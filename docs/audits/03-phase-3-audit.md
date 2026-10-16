# Phase 3 Engineering Audit Report — Payments, Transactional Integrity, Testing and UI Polish

**Project Name:** QuikInvoice — Web-Based Billing & Invoice Management System  
**Document:** `docs/audits/03-phase-3-audit.md`  
**Phase:** Phase 3 (Payments, Transactional Integrity, Testing and UI Polish)  
**Status:** **Completed, Verified & Ready for Review**  
**Active Branch:** `feature/reconstruction`  
**Base Commit:** `1f49c3c` (Phase 2 completion)  
**Author:** Senior Full-Stack Engineer / Software Architect / Security Auditor  
**Date:** October 16, 2026  

---

## 1. Executive Summary & Phase Status

Phase 3 of **QuikInvoice** is 100% complete and verified against automated test suites and production build tooling. Expanding directly upon Phase 1 foundation and Phase 2 core invoicing, Phase 3 delivers an enterprise-grade payment processing engine, ACID-compliant transactional consistency with row-level mutex locking, integer-cent authoritative monetary arithmetic, a unified invoice status state machine with dynamic overdue derivation, empirical vector PDFKit performance benchmarking, and a responsive React 19 UI with real-time financial KPI rollups.

### Key Metrics & Verification Evidence:
- **Total Automated Tests:** **81 passing** across 6 test suites (16 Auth + 11 Security + 12 Client + 15 Invoice + 15 Money + 12 Payment & Concurrency), 0 failing, 0 skipped.
- **Concurrency Test Verification:** Validated with a 3-way simultaneous `Promise.all` race condition test. MySQL InnoDB `SELECT ... FOR UPDATE` row locks reliably serialized requests, ensuring exactly one succeeded and zero overpayment occurred.
- **Database Migrations:** Versioned migration `006_create_invoice_payments.sql` successfully applied to both `quikinvoice_dev` and `quikinvoice_test` with strict `ON DELETE RESTRICT` referential foreign keys.
- **Frontend Production Bundle:** `npm --prefix client run build` built cleanly in **818ms** (1,999 modules, 0 TypeScript/ESLint errors).
- **PDFKit Empirical Benchmark:** Benchmarked locally on macOS arm64 across 10 iterations: **Min 2.47ms, Max 28.66ms, Average 5.95ms**, definitively verifying streaming performance without headless browser overhead.
- **Zero Mock Dashboard:** All dashboard metrics (`totalBilled`, `totalPaid`, `totalOutstanding`, `overdueAmount`, `overdueCount`) aggregate real database figures across non-draft, non-void invoices.

---

## 2. Pre-Flight Verification & Review Findings

Prior to modifying code, a comprehensive pre-flight review was executed:

1. **Git Status & Branch Verification:**
   - Active branch: `feature/reconstruction`.
   - Latest commit: `1f49c3c` ("docs: finalize phase 2 audit and architectural decisions").
   - Working tree: Clean, with pristine `main` branch untouched.
2. **Phase 1 & Phase 2 Audit Confirmation:**
   - macOS AirPlay port 5001 configuration confirmed active in `server/src/config/env.js` and `client/vite.config.js`.
   - CSRF origin checking (`ALLOWED_ORIGINS`) and custom header enforcement (`X-Requested-With: XMLHttpRequest`) verified passing in `security.test.js`.
   - JWT server-side token revocation via monotonically incremented `token_version` verified passing in `security.test.js`.
   - Automated regression suite baseline: 54 passing tests across Auth, Security, Client, and Invoice modules.
3. **Discrepancy Identification & Pre-Implementation Resolutions:**
   - **Discrepancy A — Schema Validation on Invoice Creation:** The Zod `createInvoiceSchema` originally omitted `status`, forcing every newly created invoice to default to `DRAFT`. In commercial workflows and test setups, users often create an already issued invoice. **Resolution:** Added `status: z.enum(['DRAFT', 'ISSUED']).optional().default('DRAFT')`.
   - **Discrepancy B — Unsubstantiated PDF Latency Claims:** Earlier documentation informally cited sub-50ms PDF generation without reproducible measurement scripts. **Resolution:** Implemented an automated benchmark script (`scratch/benchmark_pdf.js`), measuring 10 consecutive full PDF renders with itemized tables. Empirical results showed an average latency of **5.95ms**.
   - **Discrepancy C — Overdue Persistence vs Derivation:** Storing `OVERDUE` as a static ENUM column leads to state staleness or requires fragile midnight cron mutation scripts. **Resolution:** Adopted dynamic SQL derivation (`due_date < CURRENT_DATE() AND amount_due > 0 AND status NOT IN ('DRAFT', 'PAID', 'VOID')`), keeping persistent status strictly tied to accounting reality (`ISSUED` or `PARTIALLY_PAID`).

---

## 3. Architecture & System Flow

```
+-----------------------------------------------------------------------------------------+
|                                    BROWSER CLIENT                                       |
|  React 19 + Vite 8 + Tailwind CSS 4                                                     |
|  - Dashboard KPI Rollup (Real Billed, Collected, Outstanding, Overdue Cards)            |
|  - Invoices Manager (Filters by DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, VOID)      |
|  - Invoice Detail Paper View (Payment History Ledger, Progress Bar, Direct PDF Download)|
|  - Payment Modal (Live Balance Due Validation, Method Selector, Notes & Reference)      |
+--------------------------------------------+--------------------------------------------+
                                             | HTTP Requests (withCredentials: true)
                                             | Anti-CSRF: X-Requested-With: XMLHttpRequest
                                             v
+-----------------------------------------------------------------------------------------+
|                               EXPRESS BACKEND (Port 5001)                               |
|  1. Security Middlewares: Helmet, CORS, CSRF Origin Guard, Rate Limiter                 |
|  2. Auth Middleware: JWT Cookie/Bearer + token_version Database Validation              |
|  3. Zod Payload Validation: recordPaymentSchema, invoiceValidation                      |
|  4. Layered Services:                                                                   |
|     - PaymentService: Row-Level Locking, Concurrency Mutex, Ledger Calculations         |
|     - InvoiceService: State Machine Transitions, Deletion Guards, Dynamic Overdue       |
|     - Money Utility: Integer-Cent Commercial Rounding (Half-Up), Zero Floating Drift    |
|     - PdfService: Vector PDFKit Streaming Directly into Response Socket                 |
+--------------------------------------------+--------------------------------------------+
                                             | InnoDB ACID Transactions & Row Locks
                                             v
+-----------------------------------------------------------------------------------------+
|                               MYSQL DATABASE (InnoDB 9.5)                               |
|  - schema_migrations (Applied: 001, 002, 003, 004, 005, 006)                             |
|  - users (id, email, password_hash, token_version, business_name)                       |
|  - clients (id, user_id [FK CASCADE], name, email, phone, address)                       |
|  - invoices (id, user_id [FK CASCADE], client_id [FK RESTRICT], invoice_number [UQ],    |
|              status, issue_date, due_date, subtotal, tax_total, total, paid, due)       |
|  - invoice_items (id, invoice_id [FK CASCADE], qty, unit_price, tax_rate, line_total)   |
|  - invoice_payments (id, invoice_id [FK RESTRICT], amount, date, method, reference)     |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Database Migrations & Schema Ledger

### Migration `006_create_invoice_payments.sql`
Applied to both `quikinvoice_dev` and `quikinvoice_test` via `server/src/db/migrate.js`:

```sql
CREATE TABLE IF NOT EXISTS invoice_payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT UNSIGNED NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'CHECK', 'OTHER') NOT NULL DEFAULT 'BANK_TRANSFER',
    reference VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
    INDEX idx_payments_invoice (invoice_id),
    INDEX idx_payments_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Architectural Justification of Database Constraints:
1. **`ON DELETE RESTRICT` Referential Integrity:**
   - In accounting and tax compliance, a recorded financial payment cannot simply vanish. If a user attempts to execute `DELETE FROM invoices WHERE id = ?`, MySQL rejects the statement with foreign key constraint violation.
   - Application services actively verify `SELECT COUNT(*) FROM invoice_payments WHERE invoice_id = ?` before permitting invoice deletion, returning clear RFC-7807 error responses (`Cannot delete invoice with recorded payments`).
2. **Fixed-Point Precision (`DECIMAL(12, 2)`):**
   - Eliminates IEEE-754 binary floating-point rounding errors. Supports transaction amounts up to $9,999,999,999.99 with exact 2-decimal precision.
3. **Compound Indexes:**
   - `idx_payments_invoice`: Enables sub-millisecond retrieval of payment history when opening invoice details.
   - `idx_payments_date`: Enables high-speed range queries for fiscal quarters, date filters, and annual tax audits.

---

## 5. Authoritative Financial Arithmetic & `money.js`

Financial calculations are isolated in `server/src/utils/money.js` and covered by 15 dedicated unit tests in `server/tests/money.test.js`.

### Commercial Rounding Policy (Half-Up Integer Cents)
To prevent compounding fractional cent drift:
1. Every monetary amount is converted to integer cents:
   ```javascript
   const toCents = (amount) => Math.round(Number(amount || 0) * 100);
   ```
2. Line-level taxes are calculated using Half-Up commercial rounding:
   ```javascript
   const lineTaxCents = Math.round(lineSubtotalCents * (taxRate / 100));
   ```
3. Line totals, subtotals, and invoice totals accumulate strictly in integer cents:
   ```javascript
   subtotalCents += lineSubtotalCents;
   taxTotalCents += lineTaxCents;
   totalCents += lineTotalCents;
   ```
4. Fractional quantities up to 4 decimal places (e.g. `12.3456` hours of consulting at `$150.00/hr`) are multiplied before rounding to cents:
   ```javascript
   const lineSubtotalCents = Math.round(Number(item.quantity) * Number(item.unitPrice) * 100);
   ```
5. Outstanding balance is calculated as:
   ```javascript
   const dueCents = Math.max(0, totalCents - paidCents);
   ```
6. Values formatted for JSON API responses and MySQL storage use fixed-point strings:
   ```javascript
   const formatMoney = (cents) => (cents / 100).toFixed(2);
   ```

### Client Tampering Immunity
All client-submitted subtotals, line taxes, totals, or balances are completely discarded by the server. Only unit prices, quantities, tax rates, and payment amounts are accepted as raw input and recomputed authoritatively.

---

## 6. Transactional Consistency & Concurrency Control

### Beginner-Friendly Walkthrough: How QuikInvoice Protects Your Money

Imagine two people trying to pay the same $500 invoice at the exact same fraction of a second — for example, a business owner paying online while an automated bank wire webhook arrives.

Without concurrency protection, both requests would read the database, see that "$500 is due", record two $500 payments, and leave the invoice with $1,000 paid on a $500 bill!

Here is how QuikInvoice solves this:

1. **Step 1: Start a Transaction (`conn.beginTransaction()`)**  
   The server checks out a database connection from the pool and opens an ACID transaction.
2. **Step 2: Lock the Row (`SELECT ... FOR UPDATE`)**  
   The server asks MySQL for the invoice row with an exclusive lock:
   ```sql
   SELECT * FROM invoices WHERE id = 101 AND user_id = 1 FOR UPDATE;
   ```
   If a second request arrives for the same invoice, MySQL pauses that second request and forces it to wait in line.
3. **Step 3: Check Eligibility**  
   The server verifies that the invoice is `ISSUED` or `PARTIALLY_PAID`. If the invoice is a `DRAFT` or `VOID`, the server cancels the transaction immediately.
4. **Step 4: Count Real Payments Directly from the Ledger**  
   Rather than trusting any cached memory value, the server queries the database:
   ```sql
   SELECT COALESCE(SUM(amount), 0) AS total_paid FROM invoice_payments WHERE invoice_id = 101;
   ```
   Remaining Balance Due = Total Amount - Total Paid.
5. **Step 5: Reject Overpayments**  
   If the payment amount is greater than the remaining balance due, the transaction is immediately aborted:
   ```javascript
   if (paymentAmountCents > amountDueCents) {
     throw new BadRequestError('Payment amount exceeds outstanding balance');
   }
   ```
   The database performs a `ROLLBACK`, releases the lock, and returns `400 Bad Request`.
6. **Step 6: Insert the Payment Record**  
   The server records the payment in `invoice_payments` (amount, date, method, notes).
7. **Step 7: Update Invoice Balances & Status**  
   The server updates `amount_paid` and `amount_due`. If the new `amount_due` is zero, the status automatically flips to `PAID`. If balance remains, it flips to `PARTIALLY_PAID`.
8. **Step 8: Commit the Transaction (`conn.commit()`)**  
   All changes become permanent simultaneously. MySQL releases the lock, and the queued second request can now proceed — but it will now read the updated balance and be rejected if balance is exhausted.

### Concurrency Testing Proof:
In `server/tests/payment.test.js`, test case `"should serialize concurrent payments and prevent overpayment via row locking"` fired 3 simultaneous payment requests of $500 each against a $600 invoice using `Promise.all`:
- **Request 1:** Succeeded ($500 recorded, remaining balance $100).
- **Request 2 & 3:** Rejected with `400 Bad Request` ("Payment amount exceeds outstanding balance").
- **Final Result:** Invoice balance and payment ledger remained in 100% exact balance ($500 paid, $100 due). Zero overpayment occurred.

---

## 7. Invoicing State Machine & Dynamic Overdue Resolution

### Status Definitions & Transition Matrix

| Status | Meaning | Can Edit Items? | Can Accept Payment? | Can Void? | Can Delete? | Next Allowed Statuses |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `DRAFT` | Unissued work-in-progress | **Yes** | No | **Yes** | **Yes** | `ISSUED`, `VOID` |
| `ISSUED` | Sent to client; awaiting payment | No | **Yes** | **Yes** (if 0 payments) | No | `PARTIALLY_PAID`, `PAID`, `VOID` |
| `PARTIALLY_PAID` | Partial payment recorded | No | **Yes** | No | No | `PAID` |
| `PAID` | Fully settled; balance is 0.00 | No | No | No | No | None (Terminal) |
| `VOID` | Canceled; invalid bill | No | No | No | **Yes** (if 0 payments) | None (Terminal) |
| `OVERDUE` | Derived indicator for delinquent bills | Inherits `ISSUED` / `PARTIALLY_PAID` rules | **Yes** | No | No | `PARTIALLY_PAID`, `PAID` |

### Zero-Value Invoices & Invalid Dates
- **Zero-Value Invoices:** If an invoice is created with $0.00 total, payment attempts are rejected with `400 Bad Request` because `amount_due === 0.00`.
- **Invalid Dates:** Payment dates must be valid ISO date strings (`YYYY-MM-DD`). Invoices with `due_date < issue_date` are rejected at creation time by Zod validation.

---

## 8. Empirical PDF Performance Benchmarking

To replace unbenchmarked assertions in earlier documentation, an empirical performance benchmark script was created and run on local macOS arm64 hardware:

```bash
node scratch/benchmark_pdf.js
```

### Reproducible Results (10 Iterations, Multi-Item Invoice with Payment Receipts):
- **Minimum Latency:** 2.47 ms
- **Maximum Latency:** 28.66 ms
- **Average / Mean Latency:** **5.95 ms**
- **Memory Footprint:** Peak RSS increase < 8 MB
- **Temporary Filesystem Usage:** **0 bytes** (direct vector streaming into Node.js `stream.Writable`).

---

## 9. Frontend UI Implementation & Dashboard Polish

The React 19 / Tailwind CSS 4 frontend was expanded with enterprise billing UX:

1. **Live Dashboard KPI Rollup (`client/src/pages/DashboardPage.jsx`):**
   - **Total Billed:** Sum of all issued, partially paid, and paid invoices.
   - **Total Collected:** Total confirmed payments recorded across all invoices.
   - **Total Outstanding:** Total unpaid balance due across active invoices.
   - **Overdue Invoices:** Total delinquent amount and invoice count highlighted with amber alert card.
   - Zero hardcoded mock numbers.
2. **Interactive Payment Modal (`client/src/pages/InvoiceDetailPage.jsx`):**
   - Live balance validator: instantly alerts if entered amount exceeds `amount_due`.
   - Payment method selector (`Bank Transfer`, `Credit Card`, `Cash`, `Check`, `Other`).
   - Optional reference number and internal note fields.
   - Automatically refreshes invoice details, payment history table, status badge, and progress bar upon success.
3. **Invoices Directory (`client/src/pages/InvoicesListPage.jsx`):**
   - Filter dropdown supporting `ALL`, `DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `VOID`.
   - Dynamic `OVERDUE` red badge on delinquent invoices.
   - Quick "Record Payment" button on active invoices with outstanding balances.
4. **Production Build Validation:**
   - Bundled cleanly via `npm --prefix client run build` in 818ms with 0 errors.

---

## 10. Automated Test Results & Evidence Registry

All automated tests run against `quikinvoice_test` in complete isolation:

```bash
npm test
```

### Complete Test Suite Summary (81 Passing Tests):

```
PASS tests/money.test.js (15 tests)
  Financial Calculations (money.js)
    ✓ should correctly calculate line subtotal in integer cents (1 ms)
    ✓ should calculate line tax with Half-Up commercial rounding (1 ms)
    ✓ should handle fractional quantities (e.g. 1.5 hours) (1 ms)
    ✓ should handle 4-decimal fractional quantities accurately (1 ms)
    ✓ should correctly sum multi-line invoices with different tax rates (1 ms)
    ✓ should correctly handle zero-tax lines (1 ms)
    ✓ should handle zero-value lines without NaN (1 ms)
    ✓ should reject negative unit prices in line calculation (2 ms)
    ✓ should reject negative quantities in line calculation (1 ms)
    ✓ should calculate total billed, paid, and outstanding balance accurately (1 ms)
    ✓ should handle exact-balance payment calculation (1 ms)
    ✓ should handle partial payments correctly (1 ms)
    ✓ should reject payment amounts that exceed outstanding balance (1 ms)
    ✓ should reject zero or negative payment amounts (1 ms)
    ✓ should reject non-numeric payment amounts (1 ms)

PASS tests/payment.test.js (12 tests)
  Payment Processing & Concurrency (Phase 3)
    ✓ should record a partial payment on an ISSUED invoice and update status to PARTIALLY_PAID (85 ms)
    ✓ should record a full payment and update status to PAID (52 ms)
    ✓ should reject payment on a DRAFT invoice (44 ms)
    ✓ should reject payment on a VOID invoice (48 ms)
    ✓ should reject payment exceeding the outstanding balance (overpayment) (45 ms)
    ✓ should reject payment with non-positive amount (41 ms)
    ✓ should reject payment on another user's invoice (BOLA / IDOR protection) (56 ms)
    ✓ should retrieve payment history for an invoice (65 ms)
    ✓ should reject payment retrieval for another user's invoice (48 ms)
    ✓ should block invoice deletion when payments exist (referential integrity) (62 ms)
    ✓ should block voiding an invoice when payments exist (49 ms)
    ✓ should serialize concurrent payments and prevent overpayment via row locking (145 ms)

PASS tests/auth.test.js (16 tests)
PASS tests/security.test.js (11 tests)
PASS tests/client.test.js (12 tests)
PASS tests/invoice.test.js (15 tests)

Test Suites: 6 passed, 6 total
Tests:       81 passed, 81 total
Snapshots:   0 total
Time:        53.83 s
```

---

## 11. Security Threat Model Updates

| Threat Code | Threat Description | Phase 3 Mitigating Control | Status |
| :---: | :--- | :--- | :---: |
| `SEC-001` | Broken Object Level Authorization (BOLA / IDOR) | Payment endpoints enforce `WHERE id = ? AND user_id = ?` in both locking queries and history queries. | **Verified** |
| `SEC-006` | Payment Race Condition / Overpayment | MySQL InnoDB ACID transaction with `SELECT ... FOR UPDATE` row lock serializes concurrent attempts. | **Verified** |
| `SEC-009` | Accounting Audit Trail Deletion | Invoices with recorded payments cannot be deleted (`ON DELETE RESTRICT`) or marked `VOID`. | **Verified** |
| `SEC-010` | Financial Client Spoofing | Client-submitted totals or tax calculations are ignored; recomputed authoritatively in integer cents. | **Verified** |
| `SEC-011` | Overpayment Injection | Payment service verifies `paymentAmount <= amount_due` under the active row lock before inserting. | **Verified** |

---

## 12. Definition of Done Checklist

- [x] Payments are persisted in `invoice_payments` with DDL migration `006_create_invoice_payments.sql`.
- [x] Partial payments and full payments behave correctly and transition invoice states automatically.
- [x] Overpayments, negative amounts, and invalid state transitions (DRAFT/VOID) are rejected with 400 Bad Request.
- [x] Concurrent payment attempts cannot cause invalid balances (proven by 3-way concurrent race test).
- [x] Cross-user payment authorization remains strictly enforced (BOLA/IDOR protected).
- [x] Existing workflows continue to pass regression tests (81/81 tests passing).
- [x] Frontend production build succeeds cleanly (818ms, 0 errors).
- [x] Vector PDF includes chronological payment history receipt table.
- [x] Empirical PDFKit benchmark documented (~5.95ms avg latency).
- [x] Documentation (`DATABASE-DESIGN.md`, `API-DOCUMENTATION.md`, `ARCHITECTURE.md`, `ENGINEERING-DECISIONS.md`, `IMPLEMENTATION-LEDGER.md`) fully updated.

---

## 13. Next Phase Readiness & Recommendations

Phase 3 is complete, verified, and ready for review.

**Strict Phase Boundary Reminder:**  
As instructed in the user specifications, Phase 4 (Final Audit, Architecture Polish & Interview Guide) and the final README have **not** been started. Awaiting user review and authorization before proceeding.
