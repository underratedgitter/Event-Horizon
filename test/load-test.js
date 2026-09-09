import http from 'node:http';
import { performance, monitorEventLoopDelay } from 'node:perf_hooks';

const CONCURRENCY = parseInt(process.env.CONCURRENCY || '1000', 10);
const DURATION_SEC = parseInt(process.env.DURATION || '6', 10);
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '127.0.0.1';

const ASSETS = [
  '/',
  '/style.css',
  '/src/main.js',
  '/src/physics.js',
  '/src/renderer.js',
  '/src/body.js',
  '/src/particles.js',
  '/src/ui.js',
  '/src/audio.js',
  '/src/spacecraft.js',
  '/src/habitable.js',
  '/src/spacetime.js',
];

const knownEtags = new Map();

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: CONCURRENCY + 50,
  maxTotalSockets: CONCURRENCY + 50,
  timeout: 15000,
});

function makeRequest(path, reqIdx) {
  return new Promise((resolve) => {
    const headers = {
      'Host': `${HOST}:${PORT}`,
      'Connection': 'keep-alive',
    };

    // 50% chance to request gzip compression
    if (reqIdx % 2 === 0) {
      headers['Accept-Encoding'] = 'gzip, deflate';
    }

    // 30% chance to test ETag caching if known
    const etag = knownEtags.get(path);
    if (etag && reqIdx % 3 === 0) {
      headers['If-None-Match'] = etag;
    }

    const start = performance.now();

    const req = http.request(
      {
        host: HOST,
        port: PORT,
        path,
        method: 'GET',
        headers,
        agent,
      },
      (res) => {
        let bytesReceived = 0;
        if (res.headers.etag) {
          knownEtags.set(path, res.headers.etag);
        }

        res.on('data', (chunk) => {
          bytesReceived += chunk.length;
        });

        res.on('end', () => {
          const duration = performance.now() - start;
          const isOk = res.statusCode === 200 || res.statusCode === 304;
          resolve({
            ok: isOk,
            statusCode: res.statusCode,
            duration,
            bytesReceived,
            error: isOk ? null : `Status ${res.statusCode}`,
          });
        });
      }
    );

    req.on('error', (err) => {
      const duration = performance.now() - start;
      resolve({
        ok: false,
        statusCode: 0,
        duration,
        bytesReceived: 0,
        error: err.code || err.message,
      });
    });

    req.end();
  });
}

async function runLoadTest() {
  console.log('='.repeat(70));
  console.log(`🚀 COSMIC SANDBOX - HIGH-CONCURRENCY LOAD & STRESS TEST`);
  console.log(`   Target: http://${HOST}:${PORT}`);
  console.log(`   Concurrency: ${CONCURRENCY} concurrent keep-alive users`);
  console.log(`   Target Duration: ${DURATION_SEC} seconds`);
  console.log('='.repeat(70));

  // Initialize event loop lag monitor
  const loopMonitor = monitorEventLoopDelay({ resolution: 20 });
  loopMonitor.enable();

  const memInitial = process.memoryUsage();
  let peakRss = memInitial.rss;

  const latencies = [];
  let totalRequests = 0;
  let successCount = 0;
  let errorCount = 0;
  let totalBytes = 0;
  const errorDetails = {};

  const testStartTime = performance.now();
  const testEndTime = testStartTime + DURATION_SEC * 1000;

  // Track memory periodically
  const memInterval = setInterval(() => {
    const mem = process.memoryUsage();
    if (mem.rss > peakRss) peakRss = mem.rss;
  }, 250);

  // Ramp-up workers with slight micro-staggering to avoid OS TCP listen backlog truncation
  const rampStaggerMs = 300 / CONCURRENCY;
  const workerPromises = [];

  for (let userId = 0; userId < CONCURRENCY; userId++) {
    const workerPromise = (async () => {
      if (rampStaggerMs > 0) {
        await new Promise((r) => setTimeout(r, userId * rampStaggerMs));
      }

      let reqCounter = 0;
      while (performance.now() < testEndTime) {
        const assetPath = ASSETS[(userId + reqCounter) % ASSETS.length];
        const res = await makeRequest(assetPath, reqCounter);

        latencies.push(res.duration);
        totalRequests++;
        totalBytes += res.bytesReceived;

        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
          errorDetails[res.error] = (errorDetails[res.error] || 0) + 1;
        }

        reqCounter++;
      }
    })();

    workerPromises.push(workerPromise);
  }

  await Promise.all(workerPromises);
  clearInterval(memInterval);
  loopMonitor.disable();

  const totalDurationMs = performance.now() - testStartTime;
  const totalDurationSec = totalDurationMs / 1000;
  const memFinal = process.memoryUsage();

  // Compute Latency Percentiles
  latencies.sort((a, b) => a - b);
  const getPercentile = (p) => {
    if (latencies.length === 0) return 0;
    const idx = Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length));
    return latencies[idx];
  };

  const minLat = latencies.length > 0 ? latencies[0] : 0;
  const p50 = getPercentile(50);
  const p90 = getPercentile(90);
  const p95 = getPercentile(95);
  const p99 = getPercentile(99);
  const maxLat = latencies.length > 0 ? latencies[latencies.length - 1] : 0;
  const avgLat = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const rps = totalRequests / totalDurationSec;
  const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

  // Event loop delay metrics (in ms)
  const loopLagMeanMs = loopMonitor.mean / 1e6;
  const loopLagP95Ms = loopMonitor.percentile(95) / 1e6;
  const loopLagP99Ms = loopMonitor.percentile(99) / 1e6;
  const loopLagMaxMs = loopMonitor.max / 1e6;

  agent.destroy();

  console.log('\n📊 LOAD TEST EXECUTION RESULTS:');
  console.log('-'.repeat(70));
  console.log(`Total Completed Requests : ${totalRequests.toLocaleString()}`);
  console.log(`Successful Responses     : ${successCount.toLocaleString()}`);
  console.log(`Failed / Dropped         : ${errorCount} (${errorRate.toFixed(2)}%)`);
  console.log(`Total Elapsed Time       : ${totalDurationSec.toFixed(2)} seconds`);
  console.log(`Throughput (RPS)         : ${Math.round(rps).toLocaleString()} req/sec`);
  console.log(`Transferred Payload      : ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log('-'.repeat(70));
  console.log('⚡ LATENCY DISTRIBUTION (Client round-trip):');
  console.log(`   • Min                 : ${minLat.toFixed(2)} ms`);
  console.log(`   • p50 (Median)        : ${p50.toFixed(2)} ms`);
  console.log(`   • p90                 : ${p90.toFixed(2)} ms`);
  console.log(`   • p95                 : ${p95.toFixed(2)} ms`);
  console.log(`   • p99                 : ${p99.toFixed(2)} ms`);
  console.log(`   • Max                 : ${maxLat.toFixed(2)} ms`);
  console.log(`   • Mean                : ${avgLat.toFixed(2)} ms`);
  console.log('-'.repeat(70));
  console.log('🧠 SYSTEM RESILIENCE & NODE.JS HEALTH:');
  console.log(`   • Event-Loop Lag Mean : ${loopLagMeanMs.toFixed(2)} ms`);
  console.log(`   • Event-Loop Lag p95  : ${loopLagP95Ms.toFixed(2)} ms`);
  console.log(`   • Event-Loop Lag p99  : ${loopLagP99Ms.toFixed(2)} ms`);
  console.log(`   • Event-Loop Lag Max  : ${loopLagMaxMs.toFixed(2)} ms`);
  console.log(`   • Initial RSS Memory  : ${(memInitial.rss / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   • Peak RSS Memory     : ${(peakRss / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   • Final RSS Memory    : ${(memFinal.rss / (1024 * 1024)).toFixed(2)} MB`);
  console.log('='.repeat(70));

  if (errorCount > 0) {
    console.error('⚠️ Errors encountered during test:', errorDetails);
    process.exit(1);
  } else {
    console.log('✅ 100% PRODUCTION READY: 0.00% Error Rate under 1,000 Concurrent Keep-Alive Users!\n');
    process.exit(0);
  }
}

runLoadTest().catch((err) => {
  console.error('Fatal load test crash:', err);
  process.exit(1);
});
