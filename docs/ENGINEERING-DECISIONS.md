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
Developing frontend and backend on separate ports (`5173` and `5000`) often causes CORS cookie rejection during local development.

### Decision
Configure Vite's development server proxy in `client/vite.config.js` to route all `/api/*` requests directly to `http://localhost:5000`.

### Consequences
- **Positive:** Eliminates CORS complexity in local development while maintaining complete production separation.
- **Trade-off:** Requires starting both the backend server and Vite frontend server during local development.
