# Phase 1 Engineering Audit Report

**Project Name:** QuikInvoice — Web-Based Billing & Invoice Management System  
**Document:** `docs/audits/01-phase-1-audit.md`  
**Phase:** Phase 1 — Project Foundation, Database Infrastructure, and Authentication  
**Status:** **Completed & Verified**  
**Author:** Engineering Auditor / Full-Stack Architect  
**Date:** October 15, 2026  

---

## 1. Objective

The objective of Phase 1 was to establish the production-grade foundation of the QuikInvoice application:
1. Scaffold the decoupled monorepo structure with React.js (Vite + Tailwind CSS) on the frontend and Express.js on the backend.
2. Build an explicit, versioned SQL database migration system and establish a persistent MySQL connection pool with transaction capabilities.
3. Provision dedicated development (`quikinvoice_dev`) and testing (`quikinvoice_test`) databases, strictly preserving unrelated existing databases.
4. Implement secure, rate-limited, and schema-validated authentication (registration, login, profile retrieval, logout).
5. Secure sessions with `httpOnly` JWT cookies and implement defense-in-depth security controls.
6. Verify all behaviors with automated integration tests against the isolated test database.

---

## 2. Implemented Functionality

1. **Decoupled Monorepo Architecture:**
   - Client: React 19, Vite 8, Tailwind CSS 4, React Router 6, Axios, Lucide React.
   - Server: Express 4, Node 23, MySQL2 connection pool, Zod validation, Helmet, CORS, Rate Limiting, Bcryptjs.
2. **Database & Migration Engine:**
   - Dedicated databases `quikinvoice_dev` and `quikinvoice_test` created with `utf8mb4` encoding.
   - Versioned migration runner `server/src/db/migrate.js` with `schema_migrations` tracking.
   - Initial migration `001_create_users.sql` creating the multi-tenant `users` table.
3. **Authentication & Session Management:**
   - `POST /api/auth/register`: Creates business tenant, hashes password with 12 rounds of bcrypt, issues JWT, sets `httpOnly` cookie.
   - `POST /api/auth/login`: Validates credentials with constant-time hash comparison, generic error messages (no email enumeration), issues JWT, sets `httpOnly` cookie.
   - `GET /api/auth/me`: Protected profile endpoint verifying active JWT session and fetching tenant profile.
   - `POST /api/auth/logout`: Clears the authentication cookie and invalidates client session.
4. **Security Hardening:**
   - Rate limiting on auth endpoints (10 attempts / 15 mins).
   - Strict Zod schema validation rejecting malformed bodies.
   - `httpOnly`, `SameSite=Lax` cookies for XSS defense, with anti-CSRF custom headers.
5. **Frontend State & Navigation:**
   - `AuthContext`: Centralized session provider with automatic session verification on mount.
   - Route Guards: `ProtectedRoute` (guards `/dashboard`) and `PublicRoute` (guards `/login`, `/register`).
   - Clean, responsive UI for Login, Registration, and Welcome Dashboard.

---

## 3. File-by-File Changes

| File Path | Purpose | Description of Changes | Rationale / Motivation |
| :--- | :--- | :--- | :--- |
| `package.json` | Root Config | Added root-level convenience scripts (`npm test`, `npm run dev:server`, `npm run dev:client`, `npm run migrate`). | Simplifies local development and automated testing from the workspace root. |
| `.gitignore` | Version Control | Configured rules to ignore `node_modules`, `.env`, build artifacts (`dist/`), test coverage, and OS temp files. | Prevents credential leaks and repository pollution. |
| `server/package.json` | Backend Manifest | Configured dependencies (`express`, `mysql2`, `bcryptjs`, `jsonwebtoken`, `zod`, `helmet`, `cors`, `cookie-parser`, `express-rate-limit`, `jest`, `supertest`). | Defines minimal dependencies required for Phase 1. |
| `server/.env.example` | Config Template | Documented all required environment variables with safe placeholders. | Guides local setup without exposing secrets. |
| `server/.env` | Local Config | Configured local credentials for development targeting `quikinvoice_dev`. | Local environment configuration ignored by Git. |
| `server/src/config/env.js` | Config Loader | Validates process.env variables at boot time using Zod schema. | Fails fast on startup if configuration is missing or malformed. |
| `server/src/config/db.js` | Database Pool | Persistent `mysql2/promise` connection pool, transaction helper `withTransaction()`, and healthcheck. | High-performance pooled connections and ACID transaction safety. |
| `server/src/db/migrations/001_create_users.sql` | SQL Migration | DDL creating `schema_migrations` and `users` table with unique email and bcrypt hash storage. | Versioned database schema baseline. |
| `server/src/db/migrate.js` | Migration Runner | Deterministic runner that executes pending SQL migrations in transactions. | Eliminates manual database creation steps. |
| `server/src/utils/errors.js` | Error Classes | Custom error hierarchy (`AppError`, `BadRequestError`, `UnauthorizedError`, `ConflictError`, `NotFoundError`). | Clean operational error handling. |
| `server/src/middlewares/errorHandler.js` | Global Middleware | Centralized error handler converting Zod, AppError, syntax, and MySQL duplicate errors into uniform JSON. | Guarantees consistent RFC-7807 inspired error contracts. |
| `server/src/middlewares/validate.js` | Middleware | Reusable middleware factory for Zod validation on `req.body`, `query`, or `params`. | Enforces strict payload contracts before reaching controllers. |
| `server/src/validations/authValidation.js` | Zod Schemas | Validation schemas for registration and login payloads. | Sanitizes and validates user input. |
| `server/src/models/userModel.js` | Data Access | Parameterized SQL queries for user persistence and retrieval. | Encapsulates database queries away from business logic. |
| `server/src/services/authService.js` | Business Logic | User registration, password hashing (bcryptjs), login verification, and JWT issuance. | Pure domain service for authentication. |
| `server/src/middlewares/authMiddleware.js` | Auth Guard | Extracts JWT from cookies or Bearer header, validates signature, and mounts `req.user`. | Enforces resource authorization on protected routes. |
| `server/src/middlewares/rateLimiter.js` | Security Guard | Rate limiter restricting auth endpoints to 10 requests per 15 mins per IP. | Protects against brute-force password guessing. |
| `server/src/controllers/authController.js` | Controller | Handles HTTP requests, sets/clears `httpOnly` cookies, and formats JSON responses. | Separates HTTP transport from business logic. |
| `server/src/routes/authRoutes.js` | Router | Maps routes to rate limiters, validation schemas, and controllers. | Clean RESTful routing definitions. |
| `server/src/app.js` | Express Setup | Configures Helmet, CORS, cookie parser, body parser, healthcheck, routes, and error handler. | Primary Express application assembly. |
| `server/src/server.js` | Server Entry | Verifies database health on startup, listens on PORT, and handles graceful shutdown. | Clean process lifecycle management. |
| `server/tests/setup.js` | Test Setup | Verifies test database safety, runs migrations on `quikinvoice_test`, cleans tables before each test. | Ensures absolute test isolation. |
| `server/tests/auth.test.js` | Test Suite | 16 comprehensive integration tests covering auth, security, cookies, errors, and validation. | Proves correctness with automated evidence. |
| `client/package.json` | Frontend Manifest | Configured React 19, Vite 8, Tailwind CSS 4, React Router 6, Axios, Lucide React. | Modern frontend toolchain. |
| `client/vite.config.js` | Vite Config | Configured React plugin, Tailwind CSS plugin, and dev server proxy to backend on port 5000. | Seamless local API communication and HMR. |
| `client/src/index.css` | Global Styling | Imported Tailwind CSS and defined base typography and background styles. | Modern, clean UI styling foundation. |
| `client/src/api/axiosClient.js` | API Client | Axios instance configured with `withCredentials: true`, anti-CSRF headers, and error interceptors. | Unified HTTP transport layer. |
| `client/src/context/AuthContext.jsx` | State Provider | React Context managing user authentication state, login, register, and logout. | Single source of truth for client session state. |
| `client/src/components/common/ProtectedRoute.jsx` | Route Guard | Route guards for protected (`/dashboard`) and public-only (`/login`, `/register`) routes. | Client-side navigation authorization. |
| `client/src/components/layout/Navbar.jsx` | Layout Component | Clean header displaying business name, email, and logout action. | Accessible navigation header. |
| `client/src/pages/LoginPage.jsx` | Page | Login form with validation, error banners, and loading state. | User authentication entry point. |
| `client/src/pages/RegisterPage.jsx` | Page | Business onboarding registration form with multi-field validation. | Tenant registration entry point. |
| `client/src/pages/DashboardPage.jsx` | Page | Welcome dashboard showing authenticated business details and verification status. | Landing view for logged-in tenants. |
| `client/src/App.jsx` | App Root | React Router routing configuration connecting pages and guards. | Client application root. |
| `docs/ARCHITECTURE.md` | Documentation | Detailed architecture diagram, request lifecycle, database pooling, and security model. | Permanent technical architecture reference. |
| `docs/DATABASE-DESIGN.md` | Documentation | Database ER diagram, table schemas, normalization analysis, and migration instructions. | Permanent schema documentation. |
| `docs/ENGINEERING-DECISIONS.md` | Documentation | 5 comprehensive Architectural Decision Records (ADRs). | Records technical trade-offs for interview defense. |

---

## 4. Architecture & Data Flow

```
Incoming Request -> Helmet -> CORS -> Body/Cookie Parser -> Rate Limiter -> Zod Validation -> Controller -> Service -> Model -> MySQL Pool
```

- When a client registers or logs in, `authService` executes business logic, hashes/compares passwords, and generates a JWT.
- `authController` sets an `httpOnly`, `SameSite=Lax` cookie.
- Subsequent protected calls (`GET /api/auth/me`) pass through `requireAuth`, which validates the token and queries MySQL to ensure the tenant still exists, injecting `req.user`.

---

## 5. Database Changes

- **Databases Created:** `quikinvoice_dev` and `quikinvoice_test` (Charset: `utf8mb4`, Collate: `utf8mb4_unicode_ci`).
- **Tables Created:**
  - `schema_migrations`: Tracking applied migration files.
  - `users`: Multi-tenant business user profile with unique email index and bcrypt password storage.
- **Migration Status:** Migration `001_create_users.sql` applied successfully to both databases.

---

## 6. API Changes

| Method | Endpoint | Auth Required | Request Body | Success Response | Error Responses |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `GET` | `/api/health` | No | None | `200 OK` (database health status) | `503 Service Unavailable` |
| `POST` | `/api/auth/register` | No | `{ name, email, password, businessName, businessAddress, businessPhone }` | `201 Created` (user object, token, cookie set) | `400 (validation), 409 (duplicate email)` |
| `POST` | `/api/auth/login` | No | `{ email, password }` | `200 OK` (user object, token, cookie set) | `400 (validation), 401 (invalid credentials)` |
| `GET` | `/api/auth/me` | Yes (Cookie / Bearer) | None | `200 OK` (user object) | `401 Unauthorized` |
| `POST` | `/api/auth/logout` | Yes (Cookie / Bearer) | None | `200 OK` (cookie cleared) | `401 Unauthorized` |

---

## 7. Security Considerations

1. **Password Security:** Salted bcrypt hashing with 12 rounds (~300ms compute). Plaintext passwords never touch logs or databases.
2. **Credential Stuffing & Brute Force Defense:** `express-rate-limit` throttles auth endpoints to 10 attempts per 15 minutes per IP.
3. **Information Disclosure Prevention:** Failed logins return identical generic `Invalid email or password` errors regardless of whether the email exists.
4. **XSS Defense:** Authentication tokens are stored in `httpOnly` cookies inaccessible to JavaScript `document.cookie`.
5. **CSRF Defense:** Cookies utilize `SameSite=Lax`. In addition, `axiosClient` supplies the `X-Requested-With: XMLHttpRequest` custom header.
6. **SQL Injection Defense:** 100% of queries use parameterized prepared statement placeholders (`?`).

---

## 8. Testing & Verification Evidence

All 16 automated integration tests were executed against `quikinvoice_test` using Jest and Supertest:

```bash
$ npm test

> quikinvoice@1.0.0 test
> npm --prefix server test

> quikinvoice-server@1.0.0 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --detectOpenHandles --forceExit

  🚀 [MIGRATIONS] Starting database migrations on: quikinvoice_test
  ⏩ Skipping already applied: 001_create_users.sql
  🎉 [MIGRATIONS] Finished. 0 migration(s) applied.

PASS tests/auth.test.js (7.323 s)
  QuikInvoice Phase 1 — Authentication & Security Test Suite
    GET /api/health
      ✓ should return 200 OK and database health status (71 ms)
    POST /api/auth/register
      ✓ should register a new user, return 201 Created, and set httpOnly cookie (570 ms)
      ✓ should securely hash password with bcrypt and never store plaintext in database (482 ms)
      ✓ should reject registration if email is already taken with 409 Conflict (784 ms)
      ✓ should reject registration with malformed email (9 ms)
      ✓ should reject registration with password shorter than 8 characters (11 ms)
    POST /api/auth/login
      ✓ should log in with valid credentials, return 200, and set token cookie (922 ms)
      ✓ should return generic 401 Unauthorized for incorrect password without leaking hints (940 ms)
      ✓ should return the exact same generic 401 Unauthorized for non-existent email (466 ms)
    GET /api/auth/me (Protected Route)
      ✓ should reject access with 401 when no token or cookie is supplied (464 ms)
      ✓ should reject access with 401 when an invalid token is provided (463 ms)
      ✓ should allow access and return profile when valid cookie is provided (466 ms)
      ✓ should allow access and return profile when valid Bearer token header is provided (463 ms)
    POST /api/auth/logout
      ✓ should clear the token cookie on logout and subsequent access fails (498 ms)
    Malformed Payloads & Error Handling
      ✓ should return 400 Bad Request with code INVALID_JSON on malformed JSON body (9 ms)
      ✓ should return 404 for undefined API routes (7 ms)

Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        7.365 s
Ran all test suites.
```

Frontend production build verification:
```bash
$ npm run build:client

> client@0.0.0 build
> vite build

vite v8.3.4 building client environment for production...
✓ 1990 modules transformed.
dist/index.html                   0.45 kB │ gzip:   0.29 kB
dist/assets/index-u43MQHcz.css   21.10 kB │ gzip:   4.91 kB
dist/assets/index-DoqhmA4J.js   338.75 kB │ gzip: 107.31 kB
✓ built in 1.14s
```

---

## 9. Technical Decisions & Alternatives Considered

- **`bcryptjs` over native `bcrypt`:** Avoided native C++ compilation errors on Node 23 arm64; provides 100% platform portability.
- **`httpOnly` cookie over `localStorage`:** Immune to XSS token exfiltration.
- **Explicit SQL over Heavy ORMs:** Avoids ORM abstraction overhead and demonstrates raw SQL and relational competency in interviews.

---

## 10. Learning Notes & Interview Talking Points

1. **How do you explain the authentication architecture to an interviewer?**
   - *Explanation:* "We use a stateless JWT issued upon login and stored in an `httpOnly`, `SameSite=Lax` cookie. This combines the performance of stateless JWTs with the security of traditional session cookies, eliminating the vulnerability where malicious client-side JavaScript reads tokens from `localStorage`."
2. **Why use parameterized queries instead of string interpolation?**
   - *Explanation:* "Parameterized queries separate the SQL command structure from user-supplied data at the database protocol level. The MySQL parser compiles the SQL template first; parameters are sent separately as raw data values, making SQL injection mathematically impossible regardless of special characters in user input."

---

## 11. Known Issues & Unresolved Risks

- None for Phase 1. All foundation deliverables, migrations, auth endpoints, route guards, and test suites are fully operational.
- Strict phase boundary preserved: client management, invoice creation, and PDF generation are staged for Phase 2.

---

## 12. Steps to Run Locally

```bash
# 1. Run migrations against MySQL
npm run migrate

# 2. Run automated tests
npm test

# 3. Start development servers
# Terminal 1: Backend API (port 5000)
npm run dev:server

# Terminal 2: Frontend Client (port 5173)
npm run dev:client
```

---

## 13. Phase Status

- **Status:** **PHASE 1 COMPLETE & VERIFIED**
- **Next Phase:** Phase 2 — Core Invoicing Functionality, Client Management, Tax Calculations, and PDF Generation.
- **Authorization Requirement:** Requires explicit user sign-off before Phase 2 begins.
