import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

/**
 * MIME type mapping with strict charset=utf-8 for text-based formats
 * to prevent browser MIME-sniffing vulnerabilities.
 */
export const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Hardened HTTP response security headers.
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

/**
 * In-Memory Static Asset Cache for high-concurrency performance (1,000+ users).
 * Pre-buffers assets in memory and pre-computes ETag and gzip/deflate compressed payloads
 * to prevent disk I/O bottlenecks and EMFILE (file descriptor exhaustion) errors.
 */
export class StaticAssetCache {
  constructor(rootDir) {
    this.rootDir = path.resolve(rootDir);
    this.cache = new Map();
  }

  calculateETag(buffer) {
    return `"${crypto.createHash('sha1').update(buffer).digest('base64url').slice(0, 16)}"`;
  }

  loadSync(filePath) {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath);
    }

    try {
      if (!fs.existsSync(filePath)) return null;
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) return null;

      const rawBuffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
      const etag = this.calculateETag(rawBuffer);

      // Pre-compress compressible text-based assets if > 128 bytes
      let gzipBuffer = null;
      let deflateBuffer = null;
      const isCompressible = /^(text\/|application\/(javascript|json|xml)|image\/svg\+xml)/.test(mimeType);

      if (isCompressible && rawBuffer.length > 128) {
        gzipBuffer = zlib.gzipSync(rawBuffer, { level: 6 });
        deflateBuffer = zlib.deflateSync(rawBuffer, { level: 6 });
      }

      const asset = {
        filePath,
        stats,
        rawBuffer,
        size: rawBuffer.length,
        mimeType,
        etag,
        mtime: stats.mtime.toUTCString(),
        gzipBuffer,
        deflateBuffer,
      };

      this.cache.set(filePath, asset);
      return asset;
    } catch {
      return null;
    }
  }

  prewarm() {
    const walk = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'e2e') continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (entry.isFile()) {
            this.loadSync(fullPath);
          }
        }
      } catch {
        // ignore unreadable directories
      }
    };
    walk(this.rootDir);
  }

  get(filePath) {
    return this.cache.get(filePath) || this.loadSync(filePath);
  }

  clear() {
    this.cache.clear();
  }
}

const defaultCaches = new Map();
function getAssetCache(rootDir) {
  const abs = path.resolve(rootDir);
  if (!defaultCaches.has(abs)) {
    const cache = new StaticAssetCache(abs);
    cache.prewarm();
    defaultCaches.set(abs, cache);
  }
  return defaultCaches.get(abs);
}

/**
 * Sanitizes and resolves request URL against project root.
 * Enforces strict defense against path climbing, null byte injections,
 * double URL-encoding, and access to hidden dotfiles.
 *
 * @param {string} requestUrl - Raw request URL from incoming message
 * @param {string} rootDir - Base directory to serve files from
 * @returns {{ filePath?: string, error?: number, reason?: string }}
 */
export function sanitizeAndResolvePath(requestUrl, rootDir) {
  if (!requestUrl || typeof requestUrl !== 'string') {
    return { error: 400, reason: 'Invalid request URL' };
  }

  // 1. Detect raw or encoded null bytes
  if (requestUrl.includes('\0') || /%00/i.test(requestUrl)) {
    return { error: 403, reason: 'Null byte injection detected' };
  }

  // 2. Iteratively decode URI components to uncover nested or double-encoded path traversals
  let decoded = requestUrl;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      return { error: 400, reason: 'Malformed URI encoding' };
    }
  }

  // Check again for null bytes after iterative decoding
  if (decoded.includes('\0')) {
    return { error: 403, reason: 'Null byte injection detected' };
  }

  // 3. Extract pathname component (ignore query string & hash)
  let pathname;
  try {
    const parsed = new URL(decoded, 'http://localhost');
    pathname = parsed.pathname;
  } catch {
    pathname = decoded.split(/[?#]/)[0];
  }

  // 4. Block path climbing sequences and backslashes
  if (
    pathname.includes('..') ||
    requestUrl.includes('..') ||
    pathname.includes('\\') ||
    requestUrl.includes('\\') ||
    /%2e/i.test(requestUrl) ||
    /%252e/i.test(requestUrl) ||
    /%5c/i.test(requestUrl)
  ) {
    return { error: 403, reason: 'Path traversal attempt detected' };
  }

  // 5. Normalize relative path
  let relativePath = pathname.replace(/^[/\\]+/, '');
  if (relativePath === '') {
    relativePath = 'index.html';
  }

  // 6. Block access to hidden dotfiles and directories (e.g. .git, .env, .github)
  const segments = relativePath.split(/[/\\]/);
  for (const seg of segments) {
    if (seg.startsWith('.')) {
      return { error: 403, reason: 'Access to hidden files is forbidden' };
    }
  }

  // 7. Strict project root boundary confinement
  const projectRoot = path.resolve(rootDir);
  const resolvedPath = path.resolve(projectRoot, relativePath);
  const rel = path.relative(projectRoot, resolvedPath);

  if (
    rel.startsWith('..') ||
    path.isAbsolute(rel) ||
    (!resolvedPath.startsWith(projectRoot + path.sep) && resolvedPath !== projectRoot)
  ) {
    return { error: 403, reason: 'Path escapes project root' };
  }

  return { filePath: resolvedPath };
}

/**
 * Handles incoming HTTP requests for static file serving with in-memory caching,
 * ETag 304 validation, and compression.
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {string} rootDir
 * @param {StaticAssetCache} [assetCache]
 */
export function handleRequest(req, res, rootDir, assetCache) {
  // Method Validation: Reject non-GET / non-HEAD methods
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {
      ...SECURITY_HEADERS,
      'Content-Type': 'text/plain; charset=utf-8',
      'Allow': 'GET, HEAD',
    });
    res.end('405 Method Not Allowed');
    return;
  }

  // Path Resolution & Traversal Defense
  const result = sanitizeAndResolvePath(req.url, rootDir);
  if (result.error) {
    res.writeHead(result.error, {
      ...SECURITY_HEADERS,
      'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end(`${result.error} ${result.reason || 'Forbidden'}`);
    return;
  }

  const { filePath } = result;
  const cache = assetCache || getAssetCache(rootDir);

  let asset = cache.get(filePath);

  // If direct lookup missed, check if it's a directory containing index.html
  if (!asset) {
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        asset = cache.get(indexPath);
      }
    } catch {
      // ignore
    }
  }

  if (!asset) {
    res.writeHead(404, {
      ...SECURITY_HEADERS,
      'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end('404 Not Found');
    return;
  }

  serveAsset(asset, req, res);
}

/**
 * Serves a cached static asset with appropriate ETag, Cache-Control,
 * gzip/deflate compression, and 304 Not Modified support.
 */
function serveAsset(asset, req, res) {
  const isHtml = asset.filePath.endsWith('.html') || asset.filePath.endsWith('.htm');
  const cacheControl = isHtml
    ? 'no-cache, must-revalidate'
    : 'public, max-age=31536000, immutable';

  const baseHeaders = {
    ...SECURITY_HEADERS,
    'Content-Type': asset.mimeType,
    'ETag': asset.etag,
    'Cache-Control': cacheControl,
    'Vary': 'Accept-Encoding',
  };

  // ETag conditional validation (304 Not Modified)
  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch && (ifNoneMatch === asset.etag || ifNoneMatch === `W/${asset.etag}` || ifNoneMatch === '*')) {
    res.writeHead(304, {
      ...baseHeaders,
      'Content-Length': '0',
    });
    res.end();
    return;
  }

  // Compression negotiation (gzip, deflate, or uncompressed)
  const acceptEncoding = req.headers['accept-encoding'] || '';
  let payload = asset.rawBuffer;
  let encodingHeader = null;

  if (asset.gzipBuffer && /\bgzip\b/i.test(acceptEncoding)) {
    payload = asset.gzipBuffer;
    encodingHeader = 'gzip';
  } else if (asset.deflateBuffer && /\bdeflate\b/i.test(acceptEncoding)) {
    payload = asset.deflateBuffer;
    encodingHeader = 'deflate';
  }

  const responseHeaders = {
    ...baseHeaders,
    'Content-Length': payload.length,
  };
  if (encodingHeader) {
    responseHeaders['Content-Encoding'] = encodingHeader;
  }

  // HEAD method handling: send headers with Content-Length, but no body
  if (req.method === 'HEAD') {
    res.writeHead(200, responseHeaders);
    res.end();
    return;
  }

  res.writeHead(200, responseHeaders);
  res.end(payload);
}

/**
 * Creates an HTTP server configured to serve static assets from rootDir.
 *
 * @param {{ rootDir?: string, prewarm?: boolean }} options
 * @returns {http.Server}
 */
export function createServer(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const assetCache = new StaticAssetCache(rootDir);
  if (options.prewarm !== false) {
    assetCache.prewarm();
  }

  const server = http.createServer((req, res) => handleRequest(req, res, rootDir, assetCache));
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.maxRequestsPerSocket = 0; // unlimited requests on keep-alive
  server.assetCache = assetCache;
  return server;
}

// Auto-start if executed directly
const isDirectRun = Boolean(
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
);

if (isDirectRun) {
  const PORT = parseInt(process.env.PORT || '8080', 10);
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`🌌 Cosmic Sandbox Server running at http://localhost:${PORT}`);
  });
}

export default createServer;

