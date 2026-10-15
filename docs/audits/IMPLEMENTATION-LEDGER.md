# QuikInvoice — Implementation Ledger

**Repository:** `QuikInvoice`  
**Base Branch:** `main`  
**Active Work Branch:** `feature/reconstruction`  
**Last Updated:** October 15, 2026  

---

## 1. Project Phase Tracker

| Phase | Description | Status | Audit Report File | Authorized By | Authorization Date |
| :---: | :--- | :---: | :--- | :---: | :---: |
| **Phase 0** | Repository Inspection, Architecture Proposal & Plan | **COMPLETED** | [`00-project-assessment.md`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/docs/audits/00-project-assessment.md) | User | Pending Review |
| **Phase 1** | Project Foundation, Database Schema & Auth | **PLANNED** | `01-phase-1-audit.md` | — | — |
| **Phase 2** | Core Invoicing, Clients, Taxes & PDF Engine | **PLANNED** | `02-phase-2-audit.md` | — | — |
| **Phase 3** | Payments, Transactions, Security, Testing & UI | **PLANNED** | `03-phase-3-audit.md` | — | — |
| **Phase 4** | Final Audit, Architecture Docs & Interview Guide | **PLANNED** | `04-final-audit.md` | — | — |

---

## 2. Change Log Ledger

| ID | Timestamp (UTC/Local) | Phase | Files Modified / Created | Summary of Change | Motivation & Technical Rationale | Verification Evidence | Audit Reference |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| `CHG-001` | 2026-10-15 21:54 | Phase 0 | `.git/HEAD` | Switched branch to `feature/reconstruction` | Rule B compliance: isolate reconstruction work on dedicated branch, preserve pristine `main` | `git branch` returned `* feature/reconstruction` | [`00-project-assessment.md`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/docs/audits/00-project-assessment.md#section-21) |
| `CHG-002` | 2026-10-15 21:55 | Phase 0 | `docs/audits/00-project-assessment.md` | Created initial Phase 0 assessment & architecture blueprint | Define full technical stack, normalized schema, request lifecycle, and security controls before implementation | File created, all 14 mandatory sections verified | [`00-project-assessment.md`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/docs/audits/00-project-assessment.md) |
| `CHG-003` | 2026-10-15 21:56 | Phase 0 | `docs/audits/IMPLEMENTATION-LEDGER.md` | Initialized permanent project implementation ledger | Rule D compliance: continuous audit trail of all changes, rationale, and verification states | File created and populated | [`00-project-assessment.md`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/docs/audits/00-project-assessment.md#section-3) |

---

## 3. Database Schema Migration History

*No migrations executed yet. Planned for Phase 1 on dedicated database `quikinvoice_dev`.*

| Migration ID | File Name | Target Database | Description | Applied At | Rollback Available |
| :--- | :--- | :--- | :--- | :--- | :---: |
| *MIG-001* | `001_create_users.sql` | `quikinvoice_dev` | Creates `users` table for multi-tenant authentication | *Planned* | Yes |
| *MIG-002* | `002_create_clients.sql` | `quikinvoice_dev` | Creates `clients` table with FK to `users` | *Planned* | Yes |
| *MIG-003* | `003_create_invoices.sql` | `quikinvoice_dev` | Creates `invoices` table with unique constraint & status enum | *Planned* | Yes |
| *MIG-004* | `004_create_invoice_items.sql` | `quikinvoice_dev` | Creates `invoice_items` with line-level tax and pricing | *Planned* | Yes |
| *MIG-005* | `005_create_invoice_payments.sql` | `quikinvoice_dev` | Creates `invoice_payments` ledger table | *Planned* | Yes |

---

## 4. Architectural Decision Log (ADR Quick Index)

| ADR ID | Decision Title | Status | Summary of Decision | Detailed Documentation |
| :---: | :--- | :---: | :--- | :--- |
| `ADR-001` | Pure Node.js Streaming PDF with PDFKit | **PROPOSED** | Use PDFKit over Puppeteer to avoid heavy 300MB Chromium binaries, 150MB RAM footprint, and slow cold-starts. | [`00-project-assessment.md#section-121`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/docs/audits/00-project-assessment.md#121-pdf-generation-pdfkit-vs-puppeteer--html-to-pdf) |
| `ADR-002` | Native MySQL Queries (`mysql2/promise`) vs. Heavy ORM | **PROPOSED** | Hand-craft normalized SQL DDL, indexes, and parameterized queries for superior interview defensibility and zero ORM abstraction overhead. | [`00-project-assessment.md#section-122`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/docs/audits/00-project-assessment.md#122-database-layer-raw-mysql-queries-mysql2-vs-heavy-orm-prisma--typeorm--sequelize) |
| `ADR-003` | Exact Monetary Arithmetic (`DECIMAL(12,2)`) | **PROPOSED** | Prevent IEEE-754 floating point rounding drift in financial calculations using fixed-point SQL columns and explicit server-side rounding. | [`00-project-assessment.md#section-123`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/docs/audits/00-project-assessment.md#123-monetary-arithmetic-integer-cents-vs-decimal12-2) |
| `ADR-004` | Pessimistic Locking for Payment Consistency | **PROPOSED** | Use `SELECT ... FOR UPDATE` inside atomic MySQL transactions to prevent double-payments and race conditions. | [`00-project-assessment.md#section-53`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/docs/audits/00-project-assessment.md#53-payment-recording-flow-acid-consistency) |
| `ADR-005` | HTTP-Only Cookies for JWT Session Storage | **PROPOSED** | Store signed JWT in an `httpOnly`, `SameSite=Lax` cookie to eliminate XSS token exfiltration risks, with fallback Authorization header support. | [`00-project-assessment.md#section-81`](file:///Users/balajiaadesh/Desktop/projects/QuikInvoice/docs/audits/00-project-assessment.md#81-authentication-architecture) |

---

## 5. Security Threat Modeling & Review Log

| Threat ID | Threat Category | Target Component | Mitigating Control | Implementation Status |
| :---: | :--- | :--- | :--- | :---: |
| `SEC-001` | Broken Object Level Authorization (BOLA / IDOR) | `/api/invoices/:id`, `/api/clients/:id` | Enforce `WHERE id = ? AND user_id = ?` on every data access query | Proposed / Phase 1 |
| `SEC-002` | SQL Injection | Database Queries | 100% Parameterized queries with `mysql2/promise` placeholders (`?`) | Proposed / Phase 1 |
| `SEC-003` | Brute Force Authentication | `/api/auth/login`, `/api/auth/register` | Rate limit to 10 requests per 15 minutes per IP via `express-rate-limit` | Proposed / Phase 1 |
| `SEC-004` | XSS Token Exfiltration | Client Session | Store JWT in an `httpOnly` cookie inaccessible to browser JavaScript | Proposed / Phase 1 |
| `SEC-005` | Floating-point Calculation Drift | Invoice Subtotal & Tax | Server-side authoritative decimal rounding; browser totals strictly disregarded | Proposed / Phase 2 |
| `SEC-006` | Payment Race Condition / Overpayment | `/api/invoices/:id/payments` | InnoDB ACID transaction with `SELECT ... FOR UPDATE` row-level lock | Proposed / Phase 3 |

---

## 6. Verification Status & Test Registry

*Automated test suites will be registered and tracked here during Phases 1–3.*
