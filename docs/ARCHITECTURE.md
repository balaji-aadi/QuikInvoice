# QuikInvoice — System Architecture

**Project:** QuikInvoice — Web-Based Billing & Invoice Management System  
**Current Phase:** Phase 1 (Project Foundation, Database Infrastructure, and Authentication)  
**Status:** Implemented & Verified  
**Date:** October 15, 2026  

---

## 1. Architectural Philosophy

QuikInvoice is engineered to balance real-world production robustness with technical interview defensibility. The system deliberately rejects unnecessary microservice sprawl and heavyweight ORM abstractions in favor of a clean, decoupled two-tier architecture with explicit SQL queries, strict ACID transaction boundaries, and standard RESTful HTTP semantics.

### Core Principles
1. **Separation of Concerns (SoC):** HTTP presentation, pure business logic, and database persistence are strictly isolated into distinct layers.
2. **Authoritative Server-Side Processing:** The backend never trusts client calculations. All validation, state transitions, and computations are executed server-side.
3. **Defense in Depth:** Security controls (CORS, Helmet, rate limiting, Zod schema validation, parameterized SQL, constant-time password comparisons, and httpOnly cookies) are applied across every stage of the request lifecycle.
4. **Deterministic Reproducibility:** Zero "magic" auto-syncing schemas. Migrations are explicit, sequential SQL files applied deterministically.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                      CLIENT TIER                                        |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                    React.js 19 + Vite 8 + Tailwind CSS 4                        |   |
|   |                                                                                 |   |
|   |  [State & Context]                                                              |   |
|   |    └── AuthContext.jsx -> user session state, login, register, logout           |   |
|   |                                                                                 |   |
|   |  [Router & Route Guards]                                                        |   |
|   |    ├── ProtectedRoute  -> Guards /dashboard; redirects unauthenticated         |   |
|   |    └── PublicRoute     -> Guards /login, /register; redirects active sessions   |   |
|   |                                                                                 |   |
|   |  [HTTP Client Layer]                                                            |   |
|   |    └── axiosClient.js  -> baseURL: '/api', withCredentials: true,               |   |
|   |                           X-Requested-With anti-CSRF header, error interceptors |   |
|   +---------------------------------------------------------------------------------+   |
+--------------------------------------------|--------------------------------------------+
                                             | HTTP / REST (JSON)
                                             | Cookie: token=<JWT>
+--------------------------------------------v--------------------------------------------+
|                                      SERVER TIER                                        |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                        Express.js 4 Application Stack                           |   |
|   |                                                                                 |   |
|   |  [Global Middlewares]                                                           |   |
|   |    ├── Helmet          -> Secure HTTP headers (CSP, HSTS, frameguard)           |   |
|   |    ├── CORS            -> Origin: http://localhost:5173, credentials: true      |   |
|   |    ├── express.json()  -> 1MB payload ceiling                                   |   |
|   |    └── cookieParser()  -> Signed cookie extraction                              |   |
|   |                                                                                 |   |
|   |  [Route-Specific Middlewares]                                                   |   |
|   |    ├── authLimiter     -> Rate limiting (10 req / 15 min per IP)                |   |
|   |    ├── validate(Zod)   -> Schema enforcement on req.body                        |   |
|   |    └── requireAuth     -> JWT signature verification & req.user injection       |   |
|   |                                                                                 |   |
|   |  [Layered Execution]                                                            |   |
|   |    ├── Controllers     -> HTTP status codes, cookie management, response JSON   |   |
|   |    ├── Services        -> Business logic, password hashing, token creation      |   |
|   |    └── Models          -> Parameterized SQL execution (? placeholders)          |   |
|   |                                                                                 |   |
|   |  [Central Error Handler] -> Uniform RFC-7807 inspired error responses           |   |
|   +---------------------------------------------------------------------------------+   |
+--------------------------------------------|--------------------------------------------+
                                             | Connection Pool (mysql2/promise)
                                             | ConnectionLimit: 10, Charset: utf8mb4
+--------------------------------------------v--------------------------------------------+
|                                    DATABASE TIER                                        |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                             MySQL 9.5.0 (InnoDB)                                |   |
|   |                                                                                 |   |
|   |  - quikinvoice_dev  : Development environment database                          |   |
|   |  - quikinvoice_test : Isolated automated testing database                       |   |
|   |  - schema_migrations: Audit ledger of versioned migrations                      |   |
|   |  - users            : Tenants with unique email, bcrypt hash, business profile   |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Request Lifecycle & Security Flow

### 3.1 Authentication & Session Management
1. **Registration / Login Request:**
   - The client submits credentials to `POST /api/auth/register` or `POST /api/auth/login`.
   - `authLimiter` checks the rate limit bucket (10 attempts / 15 mins).
   - `validate(schema)` validates that the payload complies with the Zod schema (`email` is valid, `password` >= 8 chars).
   - `AuthService` hashes the password using `bcryptjs` (salt rounds: 12) or verifies the candidate password using constant-time comparison against the stored hash.
   - If invalid, a generic error (`Invalid email or password`) is thrown to prevent username enumeration attacks.
   - A signed JWT token is issued containing `{ id, email }` with a 24-hour expiration.
2. **Cookie & Anti-CSRF Strategy:**
   - The backend sets an `httpOnly`, `SameSite=Lax` cookie named `token`:
     - `httpOnly: true`: Browser JavaScript cannot read `document.cookie`, completely neutralizing XSS token exfiltration.
     - `sameSite: 'lax'`: Browsers will not attach the cookie on cross-site subrequests (such as `<img>`, `<form POST>` from external sites), mitigating Cross-Site Request Forgery (CSRF).
     - `secure: true` in production environments ensures cookies are only transmitted over TLS/HTTPS.
   - For additional anti-CSRF defense, `axiosClient` automatically includes the custom header `X-Requested-With: XMLHttpRequest`. Standard HTML form submissions cannot attach custom headers across origins without a preflight CORS check.
3. **Protected Route Authorization:**
   - When calling protected endpoints (`GET /api/auth/me`), `requireAuth` middleware checks `req.cookies.token` first, with fallback to `Authorization: Bearer <token>` for automated tests and external clients.
   - The token signature is verified using `jwt.verify(token, env.JWT_SECRET)`.
   - The active user is retrieved from MySQL (`UserModel.findById(decoded.id)`). If deleted or altered, access is denied.
   - The sanitized user object is mounted on `req.user`.

---

## 4. Database Connection Management

- **Connection Pooling:** Managed via `mysql2/promise` createPool.
  - Pool size: 10 connections.
  - Character set: `utf8mb4` with `utf8mb4_unicode_ci` for full Unicode and emoji compatibility.
  - Timezone: `+00:00` (UTC) to eliminate daylight saving ambiguities.
- **Transactional Support:** The `withTransaction(async (conn) => ...)` utility manages `beginTransaction()`, `commit()`, and automatic `rollback()` on exceptions, ensuring connection release back to the pool in a `finally` block.
- **Environment Isolation:**
  - `NODE_ENV === 'test'` switches the pool target to `quikinvoice_test`.
  - Non-test runtime targets `quikinvoice_dev`.

---

## 5. Centralized Error Handling Contract

All application errors are returned using a consistent contract:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "email", "message": "Please provide a valid email address" }
    ]
  }
}
```

The global `errorHandler` maps:
- `ZodError` -> `400 Bad Request` (`VALIDATION_ERROR`)
- `SyntaxError` (Malformed JSON) -> `400 Bad Request` (`INVALID_JSON`)
- `UnauthorizedError` -> `401 Unauthorized`
- `ForbiddenError` -> `403 Forbidden`
- `NotFoundError` -> `404 Not Found`
- `ConflictError` / MySQL `ER_DUP_ENTRY` -> `409 Conflict`
- Unhandled Error -> `500 Internal Server Error` (sanitized in production)
