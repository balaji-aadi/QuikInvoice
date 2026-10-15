# QuikInvoice — Architectural Decision Records (ADR)

**Project:** QuikInvoice — Web-Based Billing & Invoice Management System  
**Date:** October 15, 2026  

---

## ADR-001: JWT Authentication via httpOnly Cookies with Bearer Fallback

### Context
Web applications storing JSON Web Tokens (JWT) in browser `localStorage` or `sessionStorage` are completely vulnerable to token theft via Cross-Site Scripting (XSS). An attacker who injects script into the client can read `localStorage.getItem('token')` and exfiltrate credentials. Conversely, pure session cookies can be susceptible to Cross-Site Request Forgery (CSRF).

### Decision
Store the JWT inside an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie named `token`.
- `httpOnly: true`: The browser prevents client JavaScript from accessing the cookie via `document.cookie`.
- `SameSite: 'lax'`: The browser withholds the cookie on cross-site requests (e.g. cross-origin form submissions), defending against CSRF.
- `Bearer Fallback`: The `requireAuth` middleware also inspects `Authorization: Bearer <token>` if present.

### Consequences
- **Positive:** Maximum browser security against XSS token exfiltration; seamless API testability via Supertest without requiring cookie jar simulation.
- **Trade-off:** Automated API test clients must either pass cookies or Bearer headers.

---

## ADR-002: MySQL Connection Pooling & Transaction Helper (`mysql2/promise`)

### Context
Creating and destroying a new database connection for every incoming HTTP request introduces 20-50ms of network handshake latency and quickly exhausts MySQL connection limits under load.

### Decision
Implement a persistent connection pool with `mysql2/promise` using a maximum of 10 connections (`connectionLimit: 10`), queueing pending requests (`waitForConnections: true`). Provide a reusable `withTransaction(callback)` helper that encapsulates `beginTransaction`, `commit`, and `rollback` within a `try...catch...finally` block that guarantees connection release.

### Consequences
- **Positive:** Millisecond query response times, zero connection leaks, and guaranteed ACID rollback on transaction errors.
- **Trade-off:** Long-running database operations must be avoided to prevent pool starvation.

---

## ADR-003: Pure JavaScript Password Hashing with `bcryptjs`

### Context
Node.js 23.1.0 on macOS arm64 frequently encounters C++ ABI changes and `node-gyp` native build failures with native `bcrypt` binaries across different operating systems.

### Decision
Use `bcryptjs` with 12 salt rounds.
- Salt rounds: 12 (~250-400ms calculation time per hash), ensuring robust protection against offline brute-force attacks.
- Pure JavaScript: Eliminates native compilation dependencies and guarantees 100% deterministic portability across macOS, Linux, and Windows.

### Consequences
- **Positive:** Zero installation errors or binary incompatibility across Node environments.
- **Trade-off:** Slightly slower CPU throughput compared to native C++ bindings, which is negligible for billing portal registration and login traffic volumes.

---

## ADR-004: Declarative Schema Validation with Zod

### Context
Relying on manual field checks in controllers leads to scattered validation logic, inconsistent error messages, and vulnerabilities where extra unexpected fields slip into SQL queries.

### Decision
Use `zod` schemas executed via a generic `validate(schema)` middleware before requests reach controllers.

### Consequences
- **Positive:** Strict payload sanitation; malformed requests are rejected with a standardized 400 Bad Request before database queries execute.
- **Trade-off:** Requires writing and maintaining schema objects alongside data models.

---

## ADR-005: Decoupled Vite + Express Monorepo with Dev Server Proxy

### Context
Developing frontend and backend on separate ports (`5173` and `5001`) often causes CORS cookie rejection during local development.

### Decision
Configure Vite's development server proxy in `client/vite.config.js` to route all `/api/*` requests directly to `http://localhost:5001`.

### Consequences
- **Positive:** Eliminates CORS complexity in local development while maintaining complete production separation.
- **Trade-off:** Requires starting both the backend server and Vite frontend server during local development.

---

## ADR-006: Server-Side JWT Invalidation via `token_version` Column

### Context
Stateless JWT tokens cannot be invalidated server-side without a persistent record of revoked tokens. If a token is compromised or copied prior to logout, it remains valid until its 24-hour expiration. Introducing Redis or an append-only token blacklist table introduces infrastructure sprawl and requires background cleanup tasks.

### Decision
Add a single non-null unsigned integer column `token_version INT UNSIGNED NOT NULL DEFAULT 1` to the `users` table. Embed `tokenVersion: user.token_version` in the JWT payload. On logout, execute `UPDATE users SET token_version = token_version + 1 WHERE id = ?` and clear the cookie. In `authMiddleware`, compare `decoded.tokenVersion === user.token_version`.

### Consequences
- **Positive:** Instant, absolute token revocation across all devices on logout with zero external dependencies (no Redis, no unbounded blacklist tables). Works identically for both cookie and Bearer header authentication.
- **Trade-off:** Requires a fast primary-key database lookup (`SELECT ... WHERE id = ?`) during authentication. Because `id` is the clustered primary key index in InnoDB, lookup latency is sub-millisecond.

---

## ADR-007: Defense-in-Depth CSRF Mitigation via Origin Allowlist & Custom Headers

### Context
Browser cookies configured with `SameSite=Lax` provide baseline protection, but do not actively reject cross-origin requests at the middleware layer. Additionally, third-party CSRF libraries like `csurf` are deprecated, bloated, and require synchronizing token pairs.

### Decision
Implement a lightweight, zero-dependency middleware ([`csrfMiddleware.js`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/server/src/middlewares/csrfMiddleware.js)) that:
1. Validates the `Origin` header against an allowlist for state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`).
2. Validates `Referer` if `Origin` is omitted.
3. Enforces `X-Requested-With: XMLHttpRequest` for all cookie-authenticated requests.
4. Terminates unauthorized requests with `403 Forbidden` before reaching controllers.

### Consequences
- **Positive:** Rejects cross-origin form submissions and unauthorized origins before any controller executes; requires zero external packages.
- **Trade-off:** Non-browser API clients must use Bearer tokens or explicitly set the required header.

---

## ADR-008: Port 5001 Selection to Prevent macOS AirPlay Daemon Collision

### Context
On macOS Monterey, Ventura, Sonoma, and Sequoia, Apple's `ControlCenter` runs an AirPlay Receiver on port 5000 (`commplex-main`). When an application attempts to bind to port 5000 or proxy requests to it, AirTunes responds with `HTTP/1.1 403 Forbidden`, causing opaque authentication and registration failures.

### Decision
Standardize the backend port on **`5001`** across all environment files, default configurations, and proxy settings.

### Consequences
- **Positive:** Eliminates port collisions with native macOS system services while leaving user system settings untouched.
- **Trade-off:** Developers must use port 5001 rather than the generic default port 5000.
