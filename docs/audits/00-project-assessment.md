# Phase 0 Engineering Assessment & Reconstruction Proposal

**Project Name:** QuikInvoice — Web-Based Billing & Invoice Management System  
**Document:** `docs/audits/00-project-assessment.md`  
**Phase:** Phase 0 — Repository Inspection, Technical Assessment, Architecture Proposal, and Execution Plan  
**Status:** Completed (Awaiting User Review and Authorization for Phase 1)  
**Author:** Engineering Auditor / Full-Stack Architect  
**Date:** October 15, 2026  

---

## 1. Objective

The primary objective of Phase 0 is to conduct a forensic inspection of the existing workspace, evaluate the local runtime environment, identify all missing and existing components, formulate a comprehensive software architecture and normalized database schema, define the request lifecycle and security boundaries, and propose a defensible, multi-phase engineering roadmap.

This phase deliberately avoids code generation or destructive operations. It sets up the project tracking ledger, creates a dedicated feature branch, and delivers a rigorous plan built specifically for technical interview defensibility and production-grade software craftsmanship.

---

## 2. Implemented Functionality & Inspection Findings

### 2.1 Workspace & Git Repository Status
A forensic audit was performed across the local workspace directory (`/Users/balajiaadesh/Desktop/projects/QuikInvoice`):

- **Repository Type:** The project is an initialized Git repository with an established remote origin:
  - Remote: `https://github.com/balaji-aadi/QuikInvoice.git`
  - Base Branch: `main` (synchronized with `origin/main`)
  - Commit Count: 1 commit (`1cf6fb7` Initial commit)
  - Existing Files: Only a 13-byte `README.md` containing `# QuikInvoice`.
  - Working Tree State: Clean, with no uncommitted files or stashed changes.
- **Dedicated Branch Creation:** In strict compliance with Non-Negotiable Rule B, a dedicated branch `feature/reconstruction` was created and checked out (`git checkout -b feature/reconstruction`), preserving `main` as the pristine reference point.
- **Existing Application Code:** **Zero application code exists.** There are no package manifests (`package.json`), configuration files, source code files, database migrations, or test suites. This is effectively a greenfield reconstruction of the resume project.

### 2.2 Local Runtime & Infrastructure Discovery
Inspection commands were executed against the host operating system (macOS arm64):

| Runtime / Service | Version Detected | Availability & State | Implications for Project |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v23.1.0` | Installed (`/opt/homebrew/bin/node`) | Cutting-edge Node runtime. Requires pure JS or stable dependencies to avoid native build quirks. |
| **npm** | `10.9.0` | Installed | Modern package management, native workspace support if needed. |
| **MySQL Server** | `Ver 9.5.0 (Homebrew)` | Running & Alive (`mysqld is alive`) | Modern MySQL instance with full InnoDB transactional support, JSON types, window functions, and strict SQL modes. |
| **MySQL Auth / DBs** | Root accessible | Existing DBs: `information_schema`, `Leasemanagement`, `practice`, `school`, `sys` | **Critical Isolation Rule:** Must use dedicated databases `quikinvoice_dev` and `quikinvoice_test` to completely avoid cross-project contamination. |

---

## 3. File-by-File Changes (Phase 0)

| File Path | Purpose | Description of Changes | Rationale / Motivation |
| :--- | :--- | :--- | :--- |
| `docs/audits/00-project-assessment.md` | Audit Deliverable | Created comprehensive Phase 0 assessment document covering environment, architecture, schema, security, and execution plan. | Mandatory Phase 0 deliverable; defines architectural blueprint and interview talking points before any code is written. |
| `docs/audits/IMPLEMENTATION-LEDGER.md` | Audit Deliverable | Initialized permanent implementation ledger capturing changes, justifications, verification states, and phase checkpoints. | Mandatory compliance document under Rule D to prevent scope creep and ensure traceability. |
| `.git/HEAD` (branch switch) | Version Control | Switched active Git branch from `main` to `feature/reconstruction`. | Complies with Rule B to isolate greenfield reconstruction work from the primary production branch. |

---

## 4. Proposed Architecture & System Design

### 4.1 High-Level Architecture
QuikInvoice is architected as a clean, decoupled two-tier web application adhering to the **Separation of Concerns (SoC)** principle:

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT TIER                                      |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                  React.js (Vite + Tailwind CSS + Lucide)                  |   |
|   |  - Client-side Routing (React Router v6)                                  |   |
|   |  - State Management: React Context (Auth) + Local Component State        |   |
|   |  - API Layer: Axios instance with Interceptors (JWT, 401 handling)         |   |
|   |  - UI: Accessible, responsive dashboard, modals, tabular reports          |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------|-----------------------------------------+
                                          | HTTPS / REST (JSON)
                                          | (Blob for PDF Downloads)
+-----------------------------------------v-----------------------------------------+
|                                  SERVER TIER                                      |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                           Express.js Application                          |   |
|   |                                                                           |   |
|   |  [Middlewares]                                                            |   |
|   |    ├── Helmet (Security HTTP Headers)                                     |   |
|   |    ├── CORS (Restricted to client origin)                                 |   |
|   |    ├── Rate Limiting (Brute-force protection on /api/auth)                |   |
|   |    ├── JSON Body Parser & Cookie Parser                                   |   |
|   |    ├── Authentication Middleware (JWT verification + req.user context)   |   |
|   |    └── Validation Middleware (Zod schema enforcement)                     |   |
|   |                                                                           |   |
|   |  [Controllers Layer] -> HTTP Request/Response mapping, status codes       |   |
|   |  [Services Layer]    -> Pure Business Logic, Calculations, PDF generation |   |
|   |  [Data Access/Models]-> MySQL queries, parameterized statements, txns     |   |
|   |  [Central Error Handler] -> Consistent error contracts (RFC 7807 inspired) |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------|-----------------------------------------+
                                          | Connection Pool (mysql2/promise)
                                          | Parameterized Queries & Transactions
+-----------------------------------------v-----------------------------------------+
|                                 DATABASE TIER                                     |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                      MySQL 9.5.0 (InnoDB Storage Engine)                   |   |
|   |  - Multi-tenant tenant isolation via user_id foreign keys                 |   |
|   |  - ACID compliant transactions (READ COMMITTED isolation)                 |   |
|   |  - Strict FOREIGN KEY constraints (ON DELETE RESTRICT / CASCADE)         |   |
|   |  - Exact financial arithmetic with DECIMAL(12, 2)                         |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

### 4.2 Proposed Directory Structure
A clean monorepo layout with explicit frontend and backend root directories:

```
QuikInvoice/
├── .gitignore                      # Shared git ignore (node_modules, .env, coverage)
├── README.md                       # Project root documentation
├── docs/
│   ├── ARCHITECTURE.md             # High-level architecture and trade-offs
│   ├── DATABASE-DESIGN.md          # Schema diagrams, normalization, migrations
│   ├── API-DOCUMENTATION.md        # Comprehensive REST API contracts
│   ├── ENGINEERING-DECISIONS.md    # ADRs (Architectural Decision Records)
│   ├── INTERVIEW-GUIDE.md          # Complete technical interview preparation guide
│   └── audits/
│       ├── 00-project-assessment.md
│       ├── 01-phase-1-audit.md
│       ├── 02-phase-2-audit.md
│       ├── 03-phase-3-audit.md
│       ├── 04-final-audit.md
│       └── IMPLEMENTATION-LEDGER.md
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── app.js                  # Express app definition (routes, middlewares)
│   │   ├── server.js               # Entry point (listens on PORT)
│   │   ├── config/
│   │   │   ├── db.js               # mysql2 connection pool with healthcheck
│   │   │   └── env.js              # Validated environment variables
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── clientRoutes.js
│   │   │   ├── invoiceRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   └── dashboardRoutes.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── clientController.js
│   │   │   ├── invoiceController.js
│   │   │   ├── paymentController.js
│   │   │   └── dashboardController.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── clientService.js
│   │   │   ├── invoiceService.js   # Calculations, line items, status machine
│   │   │   ├── paymentService.js   # Transactional payment processing
│   │   │   ├── pdfService.js       # Streaming PDFKit generation
│   │   │   └── dashboardService.js # Metric aggregations
│   │   ├── models/
│   │   │   ├── userModel.js
│   │   │   ├── clientModel.js
│   │   │   ├── invoiceModel.js
│   │   │   ├── invoiceItemModel.js
│   │   │   └── paymentModel.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js   # JWT authentication & tenant injection
│   │   │   ├── validate.js         # Zod schema validation middleware
│   │   │   └── errorHandler.js     # Global operational error handler
│   │   ├── validations/
│   │   │   ├── authValidation.js
│   │   │   ├── clientValidation.js
│   │   │   ├── invoiceValidation.js
│   │   │   └── paymentValidation.js
│   │   ├── utils/
│   │   │   ├── money.js            # Decimal arithmetic & rounding utilities
│   │   │   └── errors.js           # Custom AppError subclasses (400, 401, 403, 404, 409)
│   │   └── db/
│   │       ├── migrate.js          # Lightweight migration runner
│   │       ├── seed.js             # Development test seed script
│   │       └── migrations/
│   │           ├── 001_create_users.sql
│   │           ├── 002_create_clients.sql
│   │           ├── 003_create_invoices.sql
│   │           ├── 004_create_invoice_items.sql
│   │           └── 005_create_invoice_payments.sql
│   └── tests/
│       ├── setup.js
│       ├── unit/
│       │   └── money.test.js       # Precision rounding & tax calculation tests
│       └── integration/
│           ├── auth.test.js
│           ├── clients.test.js
│           ├── invoices.test.js
│           └── payments.test.js
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/
        │   └── axiosClient.js      # Interceptors, base URL, withCredentials
        ├── context/
        │   └── AuthContext.jsx     # User state, login, register, logout
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useClients.js
        │   └── useInvoices.js
        ├── components/
        │   ├── common/             # Button, Input, Modal, Badge, Spinner, Alert
        │   ├── layout/             # Sidebar, Header, ProtectedRoute
        │   ├── dashboard/          # StatCard, RecentInvoicesTable
        │   ├── clients/            # ClientModal, ClientTable
        │   ├── invoices/           # LineItemRow, InvoiceForm, StatusBadge
        │   └── payments/           # RecordPaymentModal, PaymentHistoryTable
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── ClientsPage.jsx
        │   ├── InvoicesListPage.jsx
        │   ├── InvoiceCreatePage.jsx
        │   ├── InvoiceDetailPage.jsx
        │   └── NotFoundPage.jsx
        └── utils/
            ├── formatters.js       # Currency & date formatting
            └── statusHelpers.js    # Status color & label helpers
```

---

## 5. Data Flow & Request Lifecycles

### 5.1 Authentication Flow
1. **Client Request:** Browser posts credentials `{ email, password }` to `POST /api/auth/login`.
2. **Rate Limiting:** `authLimiter` verifies that the IP has not exceeded 10 requests per 15 minutes.
3. **Validation:** `validate(loginSchema)` verifies valid email format and minimum password length.
4. **Service Execution:** `authService.login`:
   - Fetches user record from `users` by email.
   - Compares candidate password against the Argon2/Bcrypt hash using constant-time comparison.
   - Generates a signed JSON Web Token (JWT) containing `{ id: user.id, email: user.email }` with a 24-hour expiration.
5. **Response:** Server sets an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie containing the JWT, or returns token in body, and responds with `{ user: { id, name, email, businessName } }`.
6. **Subsequent Calls:** `authMiddleware` reads the JWT, verifies cryptographic signature, extracts `req.user`, and rejects tampering with `401 Unauthorized`.

### 5.2 Invoice Creation & Calculation Flow
1. **Client Submission:** User adds line items with `description`, `quantity`, `unit_price`, and `tax_rate`. Submits `POST /api/invoices`.
2. **Authorization & Tenant Boundary:** Backend reads `req.user.id`. The query verifies that the associated `client_id` belongs to `req.user.id` (`SELECT id FROM clients WHERE id = ? AND user_id = ?`). If not found, immediately rejects with `404 Not Found` or `403 Forbidden`.
3. **Authoritative Calculation (Server-Side):**
   - The server **NEVER** trusts frontend totals.
   - For each item:
     - $\text{item\_subtotal} = \text{round}(\text{quantity} \times \text{unit\_price}, 2)$
     - $\text{item\_tax} = \text{round}\left(\text{item\_subtotal} \times \frac{\text{tax\_rate}}{100}, 2\right)$
     - $\text{item\_total} = \text{item\_subtotal} + \text{item\_tax}$
   - Aggregate invoice totals:
     - $\text{subtotal} = \sum \text{item\_subtotal}$
     - $\text{tax\_total} = \sum \text{item\_tax}$
     - $\text{total\_amount} = \text{subtotal} + \text{tax\_total}$
     - $\text{amount\_due} = \text{total\_amount} - \text{amount\_paid}$ (initially $0.00$)
4. **Database Transaction:**
   - Execute `START TRANSACTION`.
   - Insert row into `invoices` (`user_id`, `client_id`, `invoice_number`, `status = 'DRAFT' | 'ISSUED'`, `issue_date`, `due_date`, `subtotal`, `tax_total`, `total_amount`, `amount_due`).
   - Batch insert into `invoice_items` (`invoice_id`, `description`, `quantity`, `unit_price`, `tax_rate`, `line_subtotal`, `line_tax`, `line_total`).
   - Execute `COMMIT`. If any query fails, execute `ROLLBACK`.
5. **Response:** Return `201 Created` with the persisted, validated invoice and item collection.

### 5.3 Payment Recording Flow (ACID Consistency)
1. **Client Request:** `POST /api/invoices/:id/payments` with `{ amount, payment_date, payment_method, reference_number, notes }`.
2. **Transaction Scope:** Acquire a connection from the pool and start a transaction (`START TRANSACTION`).
3. **Pessimistic Row Lock:**
   - Execute `SELECT * FROM invoices WHERE id = ? AND user_id = ? FOR UPDATE`.
   - Guarantees no concurrent payment can read a stale `amount_due` or race to overpay.
4. **Domain Rule Validation:**
   - Verify `invoice.status` is not `'PAID'` or `'VOID'`.
   - Verify `amount > 0` and `amount <= invoice.amount_due`. If `amount > amount_due`, abort with `400 Bad Request ("Payment exceeds outstanding balance")`.
5. **Ledger Update & Status Transition:**
   - Insert payment entry into `invoice_payments`.
   - Compute new paid balance: $\text{new\_paid} = \text{invoice.amount\_paid} + \text{amount}$.
   - Compute new balance due: $\text{new\_due} = \text{invoice.total\_amount} - \text{new\_paid}$.
   - Determine status:
     - If $\text{new\_due} = 0$: `status = 'PAID'`
     - If $\text{new\_due} > 0$: `status = 'PARTIALLY_PAID'`
   - Update `invoices` row: `UPDATE invoices SET amount_paid = ?, amount_due = ?, status = ? WHERE id = ?`.
6. **Commit & Return:** Commit transaction and respond with `201 Created` containing the payment record and updated invoice status.

### 5.4 Secure PDF Generation & Streaming Flow
1. **Client Request:** `GET /api/invoices/:id/pdf`.
2. **Authorization & Query:** Join `invoices`, `clients`, `invoice_items`, and `users` (business profile) ensuring `invoices.user_id = req.user.id`.
3. **Stream Generation:**
   - Instantiate `PDFKit` document stream.
   - Set HTTP headers:
     - `Content-Type: application/pdf`
     - `Content-Disposition: attachment; filename="Invoice-INV-2026-001.pdf"`
     - `Cache-Control: private, no-store, max-age=0`
   - Pipe PDFKit stream directly into Express `res` stream.
   - Render clean, tabular layout with vector typography, business metadata, client billing address, line items table, subtotal/tax summary block, and payment receipt watermark/table if partially or fully paid.
   - Finalize stream with `doc.end()`. Memory overhead remains minimal because the file is piped in chunks without buffering entire PDFs into RAM.

---

## 6. Proposed Database Schema & Relationships

The relational schema is normalized to **Third Normal Form (3NF)** with strict referential integrity, foreign key constraints, indexes on query predicates, and exact monetary types.

```
       +-----------------------+
       |         users         |
       +-----------------------+
       | PK  id                |
       |     email (UQ)        |
       |     password_hash     |
       |     business_name     |
       |     business_address  |
       |     created_at        |
       +-----------+-----------+
                   | 1
                   |
                   | has many
                   |
       +-----------v-----------+               +-----------------------+
       |        clients        | 1             |        invoices       |
       +-----------------------+---------------+-----------------------+
       | PK  id                | has many      | PK  id                |
       | FK  user_id           |<--------------| FK  user_id           |
       |     name              |               | FK  client_id         |
       |     email             |               |     invoice_number    |
       |     phone             |               |     status            |
       |     address           |               |     issue_date        |
       |     created_at        |               |     due_date          |
       +-----------------------+               |     subtotal          |
                                               |     tax_total         |
                                               |     total_amount      |
                                               |     amount_paid       |
                                               |     amount_due        |
                                               |     notes             |
                                               |     created_at        |
                                               +-----------+-----------+
                                                           | 1
                                           +---------------+---------------+
                                           | has many                      | has many
                                           |                               |
                               +-----------v-----------+       +-----------v-----------+
                               |     invoice_items     |       |    invoice_payments   |
                               +-----------------------+       +-----------------------+
                               | PK  id                |       | PK  id                |
                               | FK  invoice_id        |       | FK  invoice_id        |
                               |     description       |       |     payment_date      |
                               |     quantity          |       |     amount            |
                               |     unit_price        |       |     payment_method    |
                               |     tax_rate          |       |     reference_number  |
                               |     line_subtotal     |       |     notes             |
                               |     line_tax          |       |     created_at        |
                               |     line_total        |       +-----------------------+
                               +-----------------------+
```

### 6.1 DDL Specification

```sql
-- 1. Users Table (Tenants)
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    business_address TEXT NULL,
    business_phone VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Clients Table
CREATE TABLE clients (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL,
    phone VARCHAR(50) NULL,
    address TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_clients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_clients_user (user_id),
    INDEX idx_clients_email (user_id, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Invoices Table
CREATE TABLE invoices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    client_id INT UNSIGNED NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    status ENUM('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID') NOT NULL DEFAULT 'DRAFT',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    amount_due DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoices_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_user_invoice_number (user_id, invoice_number),
    INDEX idx_invoices_user_status (user_id, status),
    INDEX idx_invoices_client (client_id),
    INDEX idx_invoices_due_date (user_id, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Invoice Line Items Table
CREATE TABLE invoice_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT UNSIGNED NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- e.g. 18.00 for 18%
    line_subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    line_tax DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_items_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Invoice Payments Table
CREATE TABLE invoice_payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT UNSIGNED NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'CHECK', 'OTHER') NOT NULL DEFAULT 'BANK_TRANSFER',
    reference_number VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_payments_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Schema Migrations Audit Table
CREATE TABLE schema_migrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6.2 Key Relational Design Decisions
1. **Tenant Isolation:** Every top-level entity (`clients`, `invoices`) holds a direct foreign key to `users.id`. All queries strictly scope records by `WHERE user_id = ?`.
2. **Compound Unique Key on Invoice Number:** `UNIQUE (user_id, invoice_number)`. Different users can both have an invoice `INV-001`, but a single business cannot duplicate invoice numbers.
3. **Delete Behavior:**
   - `ON DELETE RESTRICT` on `invoices.client_id`: Prevents accidental deletion of a client who has active billing history.
   - `ON DELETE CASCADE` on `invoice_items` and `invoice_payments`: Deleting a draft invoice cleans up its dependent items and payment logs cleanly.
4. **Financial Accuracy (`DECIMAL(12, 2)`):** Standard IEEE-754 floats cause binary rounding anomalies (e.g., $0.1 + 0.2 = 0.30000000000000004$). MySQL `DECIMAL(12, 2)` provides fixed-point, exact decimal representation suitable for amounts up to 9,999,999,999.99.
5. **Denormalized Running Totals with Transactional Synchronization:** Storing `amount_paid` and `amount_due` in `invoices` enables high-speed dashboard aggregations (`SUM(amount_due)`) without expensive multi-table subqueries, while InnoDB row locks (`FOR UPDATE`) guarantee zero drift between the payments ledger and the invoice record.

---

## 7. Proposed API Specifications

All endpoints follow RESTful conventions, accept/return `application/json` (except PDF binary streams), and return standard HTTP status codes.

| Method | Endpoint | Auth | Purpose | Key Request Fields / Query | Success Response | Error Codes |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Register new business user | `name, email, password, businessName` | `201 Created`, user object | `400, 409` |
| `POST` | `/api/auth/login` | No | Authenticate user & issue JWT | `email, password` | `200 OK`, token + user | `400, 401` |
| `GET` | `/api/auth/me` | Yes | Get active session profile | None | `200 OK`, user profile | `401` |
| `POST` | `/api/auth/logout` | Yes | Invalidate session / clear cookie | None | `200 OK`, `{ message }` | `401` |
| `GET` | `/api/dashboard/stats` | Yes | Aggregate dashboard metrics | None | `200 OK`, counts & totals | `401` |
| `GET` | `/api/clients` | Yes | List clients with search/pagination | `?search=&page=&limit=` | `200 OK`, `[clients]` | `401` |
| `POST` | `/api/clients` | Yes | Create new client | `name, email, phone, address` | `201 Created`, client object | `400, 401` |
| `GET` | `/api/clients/:id` | Yes | Get client details & invoices | None | `200 OK`, client + invoices | `401, 403, 404` |
| `PUT` | `/api/clients/:id` | Yes | Update client record | `name, email, phone, address` | `200 OK`, updated client | `400, 401, 403, 404` |
| `DELETE` | `/api/clients/:id` | Yes | Delete client (if no invoices) | None | `200 OK` or `204 No Content` | `400 (FK conflict), 401, 403, 404` |
| `GET` | `/api/invoices` | Yes | List invoices with filters | `?status=&clientId=&search=&page=`| `200 OK`, `[invoices]` | `401` |
| `POST` | `/api/invoices` | Yes | Create invoice with line items | `clientId, invoiceNumber, dates, items`| `201 Created`, full invoice | `400, 401, 404, 409` |
| `GET` | `/api/invoices/:id` | Yes | Get invoice, line items & payments | None | `200 OK`, full invoice detail | `401, 403, 404` |
| `PUT` | `/api/invoices/:id` | Yes | Update draft invoice & items | `dates, notes, items` | `200 OK`, updated invoice | `400, 401, 403, 404` |
| `DELETE` | `/api/invoices/:id` | Yes | Delete invoice (if draft/void) | None | `204 No Content` | `400, 401, 403, 404` |
| `POST` | `/api/invoices/:id/payments` | Yes | Record payment against invoice | `amount, paymentDate, method, reference`| `201 Created`, payment record | `400 (overpay), 401, 403, 404` |
| `GET` | `/api/invoices/:id/pdf` | Yes | Download rendered PDF invoice | None | `200 OK` (binary application/pdf) | `401, 403, 404` |

---

## 8. Authentication & Security Strategy

### 8.1 Authentication Architecture
- **Strategy:** JSON Web Token (JWT) issued upon verified authentication.
- **Token Delivery Options:**
  - *Option 1 (Recommended for Web):* Stored in an `httpOnly`, `SameSite=Lax`, `Secure` (production) cookie. Inaccessible to JavaScript `document.cookie`, providing robust defense against Cross-Site Scripting (XSS) token theft.
  - *Option 2 (Header fallback):* `Authorization: Bearer <token>` supported for API testing and Supertest suites.
- **Password Security:**
  - Hashed using `bcryptjs` (salt rounds: 12) or Argon2id.
  - Zero plaintext passwords logged or persisted. Constant-time comparison protects against timing attacks.

### 8.2 Defensive Security Controls
1. **Multi-Tenant Authorization Verification:**
   - Every controller queries entities using both the entity's ID and `req.user.id`:
     ```sql
     SELECT * FROM invoices WHERE id = ? AND user_id = ?
     ```
   - Prevents **IDOR (Insecure Direct Object Reference)** attacks where User A alters User B's invoice by guessing an integer ID.
2. **SQL Injection Defense:**
   - Exclusively using parameterized queries (`mysql2/promise` with `?` placeholders or prepared statements). Zero inline string concatenation of SQL fragments.
3. **Input Validation & Sanitization:**
   - Strict schema enforcement using `zod` at the controller entrypoint. Extra or malformed payload fields are rejected immediately with `400 Bad Request`.
4. **Denial of Service & Brute-Force Rate Limiting:**
   - `express-rate-limit` configured on `/api/auth/*` (10 requests per 15 min window) and globally (100 requests per minute).
5. **Secure Headers & Cross-Origin Configuration:**
   - `helmet` middleware sets essential security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).
   - `cors` configured strictly with the client origin (`http://localhost:5173`) and `credentials: true`.
6. **Financial Race Condition Prevention:**
   - Pessimistic locking (`SELECT ... FOR UPDATE`) inside atomic database transactions ensures two simultaneous payment submissions cannot double-credit an invoice.

---

## 9. Recommended Dependencies & Technical Justification

### 9.1 Backend Dependencies (`server/package.json`)

| Package | Purpose | Why Chosen / Technical Justification |
| :--- | :--- | :--- |
| `express` | HTTP Framework | Industry standard, minimal overhead, easily defensible in interviews. |
| `mysql2` | Database Client | Native promise support (`mysql2/promise`), connection pooling, built-in prepared statements for SQL injection prevention. |
| `bcryptjs` | Password Hashing | Robust 12-round salted hashing. Pure JavaScript implementation eliminates Node 23 native compilation issues with `node-gyp`. |
| `jsonwebtoken` | Token Generation | Compact, stateless authentication tokens for session verification. |
| `cookie-parser`| Cookie Parsing | Enables reading `httpOnly` JWT cookies for XSS-resistant authentication. |
| `dotenv` | Config Management| Loads environment variables from `.env` without hardcoding credentials. |
| `zod` | Schema Validation | TypeScript-friendly, declarative runtime validation with clear error formatting. |
| `pdfkit` | PDF Generation | Pure Node.js streaming vector PDF engine. Zero external binaries (unlike Puppeteer/wkhtmltopdf), low memory usage, ultra-fast generation. |
| `helmet` | Security Headers | Sets 11 standard HTTP security headers to protect against common web vulnerabilities. |
| `cors` | Cross-Origin Policy| Restricts browser cross-origin requests to the authorized frontend domain. |
| `express-rate-limit` | Rate Limiting | Protects authentication endpoints from credential-stuffing and brute-force attacks. |
| **Dev:** `jest` + `supertest` | Automated Testing | Industry standard integration testing framework for Express REST APIs. |
| **Dev:** `nodemon` | Dev Tooling | Automatic server reload during local development. |

### 9.2 Frontend Dependencies (`client/package.json`)

| Package | Purpose | Why Chosen / Technical Justification |
| :--- | :--- | :--- |
| `react` + `react-dom` | UI Framework | Resume requirement; standard declarative component model. |
| `vite` | Build Tool & Dev Server | Sub-second HMR, modern ES modules, clean project configuration. |
| `react-router-dom` (v6) | Routing | Declarative nested routing, protected route guards, clean URL parameters. |
| `axios` | HTTP Client | Request/response interceptors for automatic auth headers and unified 401 redirect handling. |
| `tailwindcss` + `postcss` | Utility CSS Styling | Resume-compatible, modern styling, zero CSS bloat, rapid responsive layouts. |
| `lucide-react` | Icons | High-quality, modern SVG icons for business dashboard actions (invoices, clients, download, payments). |
| **Dev:** `@testing-library/react` + `vitest` | Frontend Testing | Fast, modern component testing matching Vite toolchain. |

---

## 10. Phased Implementation Roadmap

```
  Phase 0: Assessment & Architecture (CURRENT)
     │
     ▼
  Phase 1: Project Foundation & Authentication
     ├── Setup Vite (client) & Express (server)
     ├── Database migrations & pool setup (quikinvoice_dev)
     ├── User registration, login, JWT httpOnly cookie
     └── Protected route infrastructure & Phase 1 Audit
     │
     ▼
  Phase 2: Core Invoicing, Clients & PDF Engine
     ├── Client CRUD & search with user isolation
     ├── Invoice state machine (DRAFT -> ISSUED -> OVERDUE)
     ├── Server-side tax & rounding calculation engine
     ├── PDFKit vector PDF generation & streaming download
     └── Phase 2 Audit
     │
     ▼
  Phase 3: Payments, Hardening, Testing & UI Polish
     ├── Atomic payment recording with SELECT ... FOR UPDATE
     ├── Balance recalculation & status transition (PARTIALLY_PAID / PAID)
     ├── Automated integration tests (Supertest + Jest)
     ├── Security audit (rate limiting, XSS, CSRF, IDOR check)
     ├── Dashboard metric aggregation & UI polish
     └── Phase 3 Audit
     │
     ▼
  Phase 4: Engineering Audit, Documentation & Interview Handoff
     ├── Final comprehensive audit (04-final-audit.md)
     ├── Root README.md with Mermaid diagrams
     └── INTERVIEW-GUIDE.md with 25+ defensible technical Q&As
```

### Phase Breakdown & Estimated Effort

| Phase | Core Deliverables | Verification Strategy |
| :--- | :--- | :--- |
| **Phase 0** *(Current)* | Environment discovery, git branch, architecture blueprint, schema design, audit docs. | Complete inspection output, directory status, zero uncommitted workspace pollution. |
| **Phase 1** | Monorepo layout, DB migrations runner, connection pool, auth endpoints, JWT cookie, client auth state. | Migration run on `quikinvoice_dev`, user register/login integration tests, token verification. |
| **Phase 2** | Client management UI/API, Invoice creation with line-item taxes, server-side math, PDFKit download. | Math precision tests, multi-item invoice creation, PDF download verification via curl/browser. |
| **Phase 3** | Payment recording with transactions, status sync, automated Supertest test suite, dashboard KPIs, responsive polish. | Automated test run passing, payment concurrency test, negative balance validation, clean UI review. |
| **Phase 4** | Complete root README, full Mermaid ER and architecture diagrams, comprehensive `docs/INTERVIEW-GUIDE.md`. | Complete documentation review, clean reproduction check, interview defensibility audit. |

---

## 11. Testing & Quality Assurance Strategy

1. **Unit Testing (`server/tests/unit`):**
   - Pure mathematical calculations in `money.js`: verify exact tax percentages, line subtotals, grand totals, and IEEE-754 floating point avoidance with edge-case pennies ($0.005$ rounding, multi-tax tiers).
2. **Integration Testing (`server/tests/integration`):**
   - Run against a dedicated `quikinvoice_test` database.
   - Test suites:
     - `auth.test.js`: Registration, duplicate email rejection, invalid password rejection, JWT verification.
     - `clients.test.js`: CRUD operations, multi-tenant isolation (User B cannot access User A's client).
     - `invoices.test.js`: Creation with line items, server-calculated totals, update permissions, deletion rules.
     - `payments.test.js`: Partial payments, balance reduction, status transitions to `PARTIALLY_PAID` and `PAID`, rejection of over-payments.
     - `pdf.test.js`: Verifies `200 OK` and valid `application/pdf` binary stream for authorized user; `403/404` for unauthorized.
3. **Database Constraint Verification:**
   - Foreign key violation tests: Attempting to delete a client with existing invoices must trigger an FK constraint violation.
   - Unique constraint tests: Duplicate invoice numbers for the same `user_id` must fail with `ER_DUP_ENTRY`.

---

## 12. Technical Decisions & Alternatives Considered

### 12.1 PDF Generation: PDFKit vs. Puppeteer / HTML-to-PDF
- **Decision:** Use `pdfkit`.
- **Alternatives Considered:** Puppeteer (headless Chrome), `html-pdf`.
- **Rationale for Interview Defensibility:** Headless Chromium requires downloading a ~300MB browser binary, consumes 150MB+ RAM per render instance, has significant cold-start latency (1-3 seconds), and poses security sandboxing challenges. `pdfkit` is written in pure JavaScript, starts instantaneously (<50ms), streams directly into the HTTP response socket chunk-by-chunk, and demonstrates low-level systems programming capability in an interview.

### 12.2 Database Layer: Raw MySQL Queries (`mysql2`) vs. Heavy ORM (Prisma / TypeORM / Sequelize)
- **Decision:** Use `mysql2/promise` with structured repository/model classes and parameterized queries.
- **Alternatives Considered:** Prisma, Sequelize, TypeORM.
- **Rationale for Interview Defensibility:** In technical interviews, candidates who rely on heavy ORMs often struggle when asked about raw SQL queries, table locks, connection pool exhaustion, index usage, and migration rollback mechanics. Hand-crafting normalized SQL DDL, explicit migrations, and parameterized queries demonstrates fundamental database fluency.

### 12.3 Monetary Arithmetic: Integer Cents vs. `DECIMAL(12, 2)`
- **Decision:** Store values as MySQL `DECIMAL(12, 2)` in the database, and use explicit rounding utilities (`Math.round((val + Number.EPSILON) * 100) / 100`) on the server.
- **Rationale:** Storing decimal values natively in MySQL allows native SQL aggregations (`SUM(total_amount)`) without client-side division, while strict rounding rules prevent floating point drift.

---

## 13. Learning Notes & Interview Talking Points

As the author of this reconstruction, here are the key concepts and answers to keep in mind when discussing the architecture:

1. **Why MySQL over MongoDB for Invoicing?**
   - *Talking Point:* Invoicing requires strict relational integrity and transactional guarantees (ACID). An invoice cannot exist without a client, line items must belong to an invoice, and recording a payment must atomically decrement the outstanding balance while inserting a ledger entry. Relational databases enforce these relationships at the engine level via foreign keys and ACID transactions.
2. **How is Multi-Tenancy Handled?**
   - *Talking Point:* We use logical multi-tenancy with a shared database and shared schema. Every sensitive entity (`clients`, `invoices`) contains a foreign key to `users.id`. Security is enforced at the service/query layer where all queries are parameterized with `user_id = req.user.id`.
3. **How Do You Prevent Payment Double-Spend or Race Conditions?**
   - *Talking Point:* We use database transactions with pessimistic locking (`SELECT ... FOR UPDATE`). When a payment is recorded, the invoice row is locked until the transaction commits, preventing simultaneous requests from reading a stale balance.
4. **How Do You Protect Against Insecure Direct Object References (IDOR)?**
   - *Talking Point:* Simply checking if an invoice exists (`SELECT * FROM invoices WHERE id = ?`) is vulnerable if the ID is sequential. We always bind the authenticated user's ID to the query (`WHERE id = ? AND user_id = ?`). If the record does not belong to the user, the database returns empty, triggering a safe `404 Not Found`.

---

## 14. Known Issues, Risks & Decisions Requiring User Approval

### 14.1 Identified Risks & Mitigation
1. **Node 23 Native Addon Compatibility:**
   - *Risk:* Node 23 is very recent and some native C++ addons (e.g., native `bcrypt`) may fail during `node-gyp` builds on macOS arm64.
   - *Mitigation:* We will use `bcryptjs`, which is pure JavaScript, cross-platform, and has zero native dependencies.
2. **Local MySQL Credentials:**
   - *Risk:* Inspection confirmed MySQL is running and accessible as `root` without a password.
   - *Mitigation:* Server configuration will read credentials from `.env` (`DB_HOST=127.0.0.1`, `DB_USER=root`, `DB_PASSWORD=`, `DB_NAME=quikinvoice_dev`), allowing easy configuration on any machine.

### 14.2 Decisions Requiring User Approval Before Phase 1
1. **Approval of Proposed Architecture & Directory Layout:** Monorepo with `server/` (Express REST) and `client/` (React + Vite + Tailwind CSS).
2. **Approval of Database Creation:** Permission to create `quikinvoice_dev` and `quikinvoice_test` schemas in the local MySQL server.
3. **Approval of Authentication Strategy:** JWT stored in `httpOnly` cookie with fallback authorization header.
4. **Authorization to Begin Phase 1:** Formal sign-off to proceed to project foundation setup.

---

## 15. Verification Evidence

The following inspection commands were executed and their actual console output verified:

```bash
# 1. Directory contents
$ ls -la
drwxr-xr-x   4 balajiaadesh  staff   128 Oct 15 21:54 .
drwxr-xr-x   6 balajiaadesh  staff   192 Oct 15 21:49 ..
drwxr-xr-x  13 balajiaadesh  staff   416 Oct 15 21:54 .git
-rw-r--r--   1 balajiaadesh  staff    13 Oct 15 21:53 README.md

# 2. Git Status and History
$ git status
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean

$ git log -n 5 --oneline
1cf6fb7 (HEAD -> main, origin/main, origin/HEAD) Initial commit

# 3. Dedicated branch creation
$ git checkout -b feature/reconstruction
Switched to a new branch 'feature/reconstruction'

# 4. Runtime Environment
$ node -v && npm -v
v23.1.0
10.9.0

$ which mysql && mysql --version
/opt/homebrew/bin/mysql
mysql  Ver 9.5.0 for macos26.1 on arm64 (Homebrew)

# 5. MySQL Daemon Status
$ mysqladmin ping -u root
mysqld is alive

# 6. Existing Databases (Inspection for Isolation)
$ mysql -u root -e "SHOW DATABASES;"
+--------------------+
| Database           |
+--------------------+
| information_schema |
| Leasemanagement    |
| mysql              |
| performance_schema |
| practice           |
| school             |
| sys                |
+--------------------+
```

---

## 16. Phase Status

- **Status:** **COMPLETED & AWAITING AUTHORIZATION**
- **Next Phase:** Phase 1 — Project Foundation, Database Design, Backend Structure, and Authentication.
- **Action Required:** User review and authorization to proceed to Phase 1.
