import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer, sanitizeAndResolvePath } from '../server.js';

describe('Production-Grade Static Server Defense & Security Hardening', () => {
  let server;
  let port;

  before(async () => {
    server = createServer();
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  function request(reqPath, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          path: reqPath,
          method: options.method || 'GET',
          headers: options.headers || {},
        },
        (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body,
            });
          });
        }
      );
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  // 1. Path Traversal Defense
  describe('Path Traversal Defense', () => {
    it('should block directory climbing /../../../etc/passwd with 403', async () => {
      const res = await request('/../../../etc/passwd');
      assert.equal(res.statusCode, 403);
    });

    it('should block encoded path traversal /..%2f..%2fpackage.json with 403', async () => {
      const res = await request('/..%2f..%2fpackage.json');
      assert.equal(res.statusCode, 403);
    });

    it('should block double-encoded path traversal /%252e%252e/package.json with 403', async () => {
      const res = await request('/%252e%252e/package.json');
      assert.equal(res.statusCode, 403);
    });

    it('should block Windows-style backslash traversal /..\\..\\package.json with 403', async () => {
      const res = await request('/..\\..\\package.json');
      assert.equal(res.statusCode, 403);
    });

    it('should block null byte injection in request path with 403', () => {
      const check = sanitizeAndResolvePath('/package.json\0.html', process.cwd());
      assert.equal(check.error, 403);
      assert.equal(check.reason, 'Null byte injection detected');
    });

    it('should block encoded null byte injection %00 with 403', async () => {
      const res = await request('/package.json%00.html');
      assert.equal(res.statusCode, 403);
    });
  });

  // 2. Hidden File Protection
  describe('Hidden File Protection', () => {
    it('should block access to .git directory with 403', async () => {
      const res = await request('/.git/config');
      assert.equal(res.statusCode, 403);
    });

    it('should block access to .env files with 403', async () => {
      const res = await request('/.env');
      assert.equal(res.statusCode, 403);
    });

    it('should block access to .github directory with 403', async () => {
      const res = await request('/.github');
      assert.equal(res.statusCode, 403);
    });
  });

  // 3. HTTP Method Filtering
  describe('HTTP Method Filtering', () => {
    it('should reject POST method with 405 Method Not Allowed', async () => {
      const res = await request('/', { method: 'POST' });
      assert.equal(res.statusCode, 405);
      assert.equal(res.headers['allow'], 'GET, HEAD');
    });

    it('should reject PUT method with 405 Method Not Allowed', async () => {
      const res = await request('/index.html', { method: 'PUT' });
      assert.equal(res.statusCode, 405);
      assert.equal(res.headers['allow'], 'GET, HEAD');
    });

    it('should reject DELETE method with 405 Method Not Allowed', async () => {
      const res = await request('/index.html', { method: 'DELETE' });
      assert.equal(res.statusCode, 405);
      assert.equal(res.headers['allow'], 'GET, HEAD');
    });

    it('should allow HEAD method with 200 and empty body', async () => {
      const res = await request('/index.html', { method: 'HEAD' });
      assert.equal(res.statusCode, 200);
      assert.equal(res.body, '');
      assert.ok(res.headers['content-length']);
    });
  });

  // 4. Security Headers & MIME Types
  describe('Security Headers & Content-Type', () => {
    it('should return all required security headers on 200 responses', async () => {
      const res = await request('/');
      assert.equal(res.statusCode, 200);
      assert.equal(
        res.headers['content-security-policy'],
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none';"
      );
      assert.equal(res.headers['x-content-type-options'], 'nosniff');
      assert.equal(res.headers['x-frame-options'], 'DENY');
      assert.equal(res.headers['referrer-policy'], 'strict-origin-when-cross-origin');
      assert.equal(res.headers['cross-origin-opener-policy'], 'same-origin');
    });

    it('should serve index.html with text/html; charset=utf-8', async () => {
      const res = await request('/index.html');
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'text/html; charset=utf-8');
      assert.ok(
        res.body.includes('Event Horizon') ||
          res.body.includes('EVENT HORIZON') ||
          res.body.includes('Cosmic Gravity & Orbital Sandbox') ||
          res.body.includes('COSMIC SANDBOX')
      );
    });

    it('should serve JS with text/javascript; charset=utf-8', async () => {
      const res = await request('/src/main.js');
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'text/javascript; charset=utf-8');
    });

    it('should serve CSS with text/css; charset=utf-8', async () => {
      const res = await request('/style.css');
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'text/css; charset=utf-8');
    });

    it('should serve JSON with application/json; charset=utf-8', async () => {
      const res = await request('/package.json');
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
      const parsed = JSON.parse(res.body);
      assert.ok(parsed.name === 'event-horizon' || parsed.name === 'cosmic-sandbox');
    });

    it('should return 404 for non-existent files with security headers', async () => {
      const res = await request('/non-existent-file.xyz');
      assert.equal(res.statusCode, 404);
      assert.equal(res.headers['x-content-type-options'], 'nosniff');
    });
  });

  // 5. In-Memory Caching, ETag, and HTTP Compression
  describe('High-Concurrency In-Memory Caching & Compression', () => {
    it('should return ETag and Cache-Control on index.html and static assets', async () => {
      const htmlRes = await request('/index.html');
      assert.equal(htmlRes.statusCode, 200);
      assert.ok(htmlRes.headers['etag']);
      assert.equal(htmlRes.headers['cache-control'], 'no-cache, must-revalidate');

      const cssRes = await request('/style.css');
      assert.equal(cssRes.statusCode, 200);
      assert.ok(cssRes.headers['etag']);
      assert.equal(cssRes.headers['cache-control'], 'public, max-age=31536000, immutable');
    });

    it('should return 304 Not Modified when If-None-Match matches ETag', async () => {
      const initial = await request('/style.css');
      const etag = initial.headers['etag'];
      assert.ok(etag);

      const cached = await request('/style.css', {
        headers: { 'if-none-match': etag },
      });
      assert.equal(cached.statusCode, 304);
      assert.equal(cached.body, '');
    });

    it('should serve gzip compressed response when Accept-Encoding includes gzip', async () => {
      const zlib = await import('node:zlib');
      const res = await new Promise((resolve, reject) => {
        const req = http.request(
          {
            host: '127.0.0.1',
            port,
            path: '/style.css',
            method: 'GET',
            headers: { 'Accept-Encoding': 'gzip' },
          },
          (resStream) => {
            const chunks = [];
            resStream.on('data', (chunk) => chunks.push(chunk));
            resStream.on('end', () => {
              resolve({
                statusCode: resStream.statusCode,
                headers: resStream.headers,
                buffer: Buffer.concat(chunks),
              });
            });
          }
        );
        req.on('error', reject);
        req.end();
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-encoding'], 'gzip');
      assert.equal(res.headers['vary'], 'Accept-Encoding');

      const decompressed = zlib.gunzipSync(res.buffer).toString('utf8');
      assert.ok(decompressed.includes('.hud-top'));
    });
  });
});
