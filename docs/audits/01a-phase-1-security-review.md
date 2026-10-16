# Phase 1 Security Review: CSRF, CORS & JWT Revocation Audit

**Project:** QuikInvoice — Web-Based Billing & Invoice Management System  
**Document:** `docs/audits/01a-phase-1-security-review.md`  
**Phase:** Security Verification Preceding Phase 2  
**Status:** **Completed & Documented (Awaiting Authorization for Minimal Fixes)**  
**Author:** Engineering Auditor / Security Reviewer  
**Date:** October 15, 2026  

---

## 1. Executive Incident Analysis: Root Cause of Registration "403 Forbidden"

### 1.1 The Reported Symptom
When attempting to register a new user from the frontend browser UI, the user received an **HTTP 403 Forbidden** error.

### 1.2 Forensic Investigation & Evidence
To determine the source of the 403 error, active port bindings on the host operating system (macOS arm64) were inspected:

```bash
$ lsof -i :5000
COMMAND    PID         USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
ControlCe 1082 balajiaadesh   11u  IPv4 0xd2117c71bf74d449      0t0  TCP *:commplex-main (LISTEN)
ControlCe 1082 balajiaadesh   12u  IPv6 0xfaad2fda4d38b384      0t0  TCP *:commplex-main (LISTEN)
```

Direct HTTP probe against port 5000:
```bash
$ curl -i http://localhost:5000/
HTTP/1.1 403 Forbidden
Content-Length: 0
Server: AirTunes/980.77.5
X-Apple-ProcessingTime: 0
X-Apple-RequestReceivedTimestamp: 151298397
```

### 1.3 Findings & Root Cause
1. **The macOS AirPlay Collision:** On macOS (Monterey, Ventura, Sonoma, Sequoia), the system daemon `ControlCenter` operates an **AirPlay Receiver / AirTunes server that occupies port 5000 by default** (`commplex-main`).
2. **The 403 Source:** When an unauthenticated HTTP request hits Apple's AirTunes daemon on port 5000, **AirTunes immediately responds with `HTTP/1.1 403 Forbidden` (`Server: AirTunes/980.77.5`)**.
3. **The Proxy Target:** The Vite development server configuration in [`client/vite.config.js`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/client/vite.config.js) was configured to proxy `/api` requests to `http://localhost:5000`. Consequently, when the user submitted the registration form, Vite forwarded the request directly to Apple's AirTunes daemon instead of the QuikInvoice Express backend!
4. **Backend State:** The Express backend had not yet been started on an alternate port because the user was only running `npm run dev` in the client.

### 1.4 Proposed Minimal Fix (Awaiting User Sign-Off)
- Reconfigure the backend port to **`5001`** (verified completely free via `lsof -i :5001`) across:
  - `server/.env` (`PORT=5001`)
  - `server/.env.example` (`PORT=5001`)
  - `server/src/config/env.js` (`default(5001)`)
  - `client/vite.config.js` (`target: 'http://localhost:5001'`)
- Start both services simultaneously via `npm run dev:server` and `npm run dev:client`.

---

## 2. Check 1: CSRF & CORS Security Review

### 2.1 Scope & Inspected Files
- Configuration: [`server/src/config/env.js`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/server/src/config/env.js), `server/.env`
- Server Assembly & Middlewares: [`server/src/app.js`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/server/src/app.js), [`server/src/middlewares/authMiddleware.js`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/server/src/middlewares/authMiddleware.js)
- Routing & Controllers: [`server/src/routes/authRoutes.js`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/server/src/routes/authRoutes.js), [`server/src/controllers/authController.js`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/server/src/controllers/authController.js)
- Client Transport: [`client/src/api/axiosClient.js`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/client/src/api/axiosClient.js)

### 2.2 Detailed Evaluation by Item

| # | Item Evaluated | Implementation Status | Findings & Technical Analysis | Severity |
| :-: | :--- | :---: | :--- | :---: |
| 1 | **Allowed origins explicitly configured & validated** | **Pass with Limitations** | In `env.js`, `CORS_ORIGIN` is configured to `http://localhost:5173`. In `app.js`, `cors({ origin: env.CORS_ORIGIN, credentials: true })` restricts allowed response headers. However, `env.CORS_ORIGIN` is validated only as a string (not an origin array or URL schema). | Low |
| 2 | **Credentialed CORS restricted to approved origins** | **Pass** | In `app.js`, `cors` is initialized with `origin: env.CORS_ORIGIN` and `credentials: true`. Because origin is a specific URL and NOT `*` (wildcard), credentialed CORS complies with W3C specifications. | None |
| 3 | **Untrusted origins cannot execute authenticated state-changing requests** | **Pass with Limitations** | Modern browsers enforce CORS by withholding responses from untrusted origins. Furthermore, `SameSite=Lax` cookies are not sent on cross-site POST requests. However, because Express `cors` with a static string sets headers rather than rejecting the TCP connection with an error, an untrusted origin sending a simple non-preflighted form POST could still trigger backend logic if cookies were sent. `SameSite=Lax` mitigates this, but an active Origin/Referer guard is stronger. | Medium |
| 4 | **`X-Requested-With` header enforcement** | **Fail** | In `axiosClient.js`, `'X-Requested-With': 'XMLHttpRequest'` is set. In `app.js`, it is listed in `allowedHeaders`. **However, no middleware or route on the server actually checks for the presence of this header.** A header sent by a client that is never verified by the server provides zero defense. | Medium |
| 5 | **Cookie settings for dev vs. prod** | **Pass** | In `authController.js`, `COOKIE_OPTIONS` specifies: `httpOnly: true`, `secure: env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `maxAge: 24h`. This allows local development over HTTP (`localhost`) while requiring HTTPS in production. | None |
| 6 | **State-changing auth endpoints protected** | **Pass with Limitations** | `POST /register` and `POST /login` are public onboarding endpoints. `POST /logout` is protected by `requireAuth` and relies on `SameSite=Lax` cookie behavior. | Low |
| 7 | **Test coverage for CORS / CSRF attacks** | **Fail** | The existing 16 integration tests in `auth.test.js` test happy paths and standard input validation. Zero tests currently verify rejected cross-origin requests, invalid Origin headers, or forged cross-site payloads. | Medium |

### 2.3 Verdict on Check 1
**Decision:** **PASS WITH LIMITATIONS**  
*Rationale:* Modern browser `SameSite=Lax` cookies and strict CORS headers prevent standard browser-based CSRF attacks and unauthorized data reading. However, `X-Requested-With` is currently unenforced on the server, and no cross-origin rejection test suites exist.

---

## 3. Check 2: JWT Logout & Revocation Security Review

### 3.1 Scope & Inspected Files
- Token Signing: [`server/src/services/authService.js`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/server/src/services/authService.js)
- Cookie Invalidation: [`server/src/controllers/authController.js`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/server/src/controllers/authController.js)
- Authentication Verification: [`server/src/middlewares/authMiddleware.js`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/server/src/middlewares/authMiddleware.js)

### 3.2 Empirical Verification Evidence
A security probe was executed to test token persistence after logout:

```javascript
// 1. User logs out
const logoutRes = await request.post('/api/auth/logout').set('Cookie', cookie);
// Result: 200 OK, Set-Cookie: token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT

// 2. Client re-submits previously issued token via Authorization: Bearer <token>
const reuseRes = await request.get('/api/auth/me').set('Authorization', 'Bearer ' + token);
// Result: 200 OK, User Profile returned!
```

### 3.3 Detailed Evaluation by Item

| # | Item Evaluated | Implementation Status | Findings & Technical Analysis | Severity |
| :-: | :--- | :---: | :--- | :---: |
| 1 | **Logout clears the browser cookie** | **Pass** | In `authController.logout()`, `res.clearCookie('token', ...)` emits `Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970; HttpOnly; SameSite=Lax`. Standard browsers immediately purge the cookie. | None |
| 2 | **Unexpired JWT remains usable after logout** | **Fail / Limitation** | Because JWT authentication is completely stateless, the cryptographic signature remains mathematically valid until expiration (`24h`). If an adversary or malicious extension extracted the token prior to logout, the token can still access `/api/auth/me` and protected APIs until it expires. | Medium |
| 3 | **Bearer token bypasses cookie-only logout** | **Fail / Limitation** | `authMiddleware` accepts either cookies or `Authorization: Bearer <token>`. Calling `/api/auth/logout` only clears the cookie. An API client using Bearer headers is unaffected by logout. | Medium |
| 4 | **Token & cookie expiration consistency** | **Pass** | Both the JWT expiration (`JWT_EXPIRES_IN=24h`) and the cookie TTL (`maxAge: 24 * 60 * 60 * 1000`) are synchronized to exactly 24 hours. | None |
| 5 | **Stateless design vs. security requirements** | **Pass with Limitations** | Pure stateless JWT authentication is the standard pattern for portfolio projects and technical interview demonstrations because it avoids heavyweight session backends like Redis. However, true instantaneous revocation requires a server-side invalidation mechanism. | Low |

### 3.4 Verdict on Check 2
**Decision:** **PASS WITH LIMITATIONS**  
*Rationale:* In a purely stateless JWT architecture, logout is inherently a client-side operation (cookie deletion). This behavior is mathematically normal for stateless tokens, but represents an architectural limitation if an active token is copied prior to logout.

---

## 4. Recommended Minimal Fixes (Awaiting Authorization)

To harden both areas without introducing microservices, Redis, or excessive complexity:

### Fix A: Resolve Port 5000 AirPlay Conflict (High Priority)
- Update default port to **`5001`** in `server/.env`, `server/.env.example`, `server/src/config/env.js`, and `client/vite.config.js`.

### Fix B: Server-Side Anti-CSRF Header Enforcement (Medium Priority)
- Create a lightweight middleware in `server/src/middlewares/csrfMiddleware.js`:
  ```javascript
  export function enforceCsrfProtection(req, res, next) {
    // State-changing requests using cookie authentication must supply X-Requested-With
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && req.cookies?.token) {
      if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
        throw new ForbiddenError('CSRF protection: Missing or invalid X-Requested-With header');
      }
    }
    next();
  }
  ```
- This directly transforms `client/src/api/axiosClient.js`'s custom header into an active, enforceable defense against cross-site form submissions!

### Fix C: User `token_version` for Instant Server-Side Invalidation (Medium Priority)
- If token revocation is desired without adding Redis:
  1. Add `token_version INT UNSIGNED DEFAULT 1` to `users` table via migration `002_add_user_token_version.sql`.
  2. Include `tokenVersion: user.token_version` in the JWT payload.
  3. In `authMiddleware.js`, verify `if (decoded.tokenVersion !== user.token_version) throw new UnauthorizedError(...)`.
  4. In `authController.logout()`, execute `UPDATE users SET token_version = token_version + 1 WHERE id = ?`.
- **Cost & Benefit:** Zero external dependencies (uses existing MySQL table), 1 extra integer column, and achieves 100% instant server-side revocation on logout or password change!

### Fix D: Security Integration Tests
- Add tests in `server/tests/security.test.js`:
  1. Verifies that cross-origin form POST without `X-Requested-With` is rejected.
  2. Verifies that invalid CORS origins do not receive `Access-Control-Allow-Origin`.
  3. Verifies token invalidation behavior.

---

## 5. Residual Risks

1. **Local Port Misconfiguration:** If a developer runs only the client without starting the server, or points Vite at a conflicting system port, browser network requests will fail with connection errors or system-level 403s.
2. **Stateless JWT Lifetime:** Until Fix C (`token_version`) is implemented, any token intercepted within its 24-hour lifetime remains valid regardless of cookie deletion.

---

## 6. Summary of Inspection Decisions

| Security Audit Check | Formal Evaluation Decision |
| :--- | :---: |
| **Check 1: CSRF & CORS Implementation** | **PASS WITH LIMITATIONS** |
| **Check 2: JWT Logout & Token Revocation** | **PASS WITH LIMITATIONS** |
| **Registration 403 Incident Resolution** | **Identified (AirPlay port 5000 collision; ready for Fix A)** |

**Next Action:** Awaiting user review and authorization to apply Fix A (Port 5001), Fix B (CSRF enforcement), and/or Fix C (`token_version` revocation).
