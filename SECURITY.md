# Security Policy 🛡️

The **Event Horizon** project adheres to a defense-in-depth security model, ensuring robust protection across static delivery, browser runtime, and state deserialization.

---

## 🔒 Defense-in-Depth Architecture

### 1. Static Web Server Hardening (`server.js`)
- **Path Traversal Defense**: Iterative recursive URI decoding, detection of null byte injections (`\0`, `%00`), blocking of path-climbing sequences (`..`, `%2e%2e`, `\\`), and boundary confinement to project root.
- **Strict Content Security Policy (CSP)**:
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none';
  ```
- **MIME Sniffing Prevention**: Strict `X-Content-Type-Options: nosniff` on all assets with explicit `charset=utf-8` on text resources.
- **Clickjacking & Framing Defense**: `X-Frame-Options: DENY` and `frame-ancestors 'none'`.
- **HTTP Method Filtering**: Rejects non-GET and non-HEAD requests with `405 Method Not Allowed`.

### 2. Client-Side Sanitization & Injection Neutralization (`src/serialization.js`)
- **Prototype Pollution Neutralization**: Sanitizes parsed JSON keys, stripping `__proto__`, `constructor`, and `prototype`.
- **XSS Vector Neutralization**: All body names and user-provided strings undergo HTML entity encoding (`&`, `<`, `>`, `"`, `'`) before DOM insertion.
- **Non-Finite Input Clamping**: Numeric fields are validated against `NaN`, `+Infinity`, and `-Infinity`, substituting deterministic fallback boundaries.
- **DoS Memory Bounding**: State arrays are strictly clamped (maximum 500 celestial bodies) to prevent browser memory exhaustion attacks.

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability or security edge case in Event Horizon:

1. **Do not create a public GitHub issue.**
2. Send an email to [sp9023156004@gmail.com](mailto:sp9023156004@gmail.com) with the subject `[SECURITY] Event Horizon Vulnerability Report`.
3. Include detailed steps to reproduce the issue, proof of concept, and affected environment.

We will review and address the reported vulnerability promptly.
