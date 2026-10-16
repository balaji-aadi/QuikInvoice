# QuikInvoice — Database Design & Schema Documentation

**Project:** QuikInvoice — Web-Based Billing & Invoice Management System  
**Storage Engine:** MySQL 9.5.0 (InnoDB)  
**Active Schema Version:** Migration 006 (`006_create_invoice_payments.sql`)  
**Character Set:** `utf8mb4` | **Collation:** `utf8mb4_unicode_ci`  
**Date:** October 16, 2026  

---

## 1. Overview & Isolation Strategy

QuikInvoice utilizes **MySQL** with the **InnoDB** storage engine to provide strict ACID compliance, foreign key enforcement, exact monetary arithmetic (`DECIMAL(12, 2)`), and multi-tenant isolation.

To preserve complete development and test integrity:
1. **Development Database:** `quikinvoice_dev`
2. **Testing Database:** `quikinvoice_test`
3. **Unrelated Databases:** Any existing local databases (e.g. `Leasemanagement`, `practice`, `school`) remain completely untouched and unreferenced.

---

## 2. Active Schema (Phases 1 & 2 Implemented)

### 2.1 Table: `schema_migrations`
Maintains an immutable audit ledger of all applied database migrations.

```sql
CREATE TABLE schema_migrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2.2 Table: `users` (Tenants / Businesses)
Stores business owners who issue invoices. Every business operates in strict multi-tenant isolation.

```sql
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    business_address TEXT NULL,
    business_phone VARCHAR(50) NULL,
    token_version INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Field Specifications:
- `id`: Unsigned 32-bit integer surrogate primary key.
- `name`: Contact person or business representative name.
- `email`: Business email; unique key scoped to max 191 chars for utf8mb4 InnoDB index limits.
- `password_hash`: Salted bcrypt hash ($2a$ / $2b$ with 12 rounds), 60 characters stored in a 255 char buffer.
- `business_name`: Official business or trade name printed on generated invoices.
- `business_address`: Full billing address printed in invoice headers.
- `token_version`: Monotonically incremented counter used for instantaneous server-side JWT revocation on logout.
- `created_at` / `updated_at`: Automated UTC audit timestamps.

---

### 2.3 Table: `clients` (Customer Profiles)
Stores client and customer contact records owned by a specific tenant.

```sql
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
    INDEX idx_clients_email (user_id, email),
    INDEX idx_clients_name (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Referential Integrity & Security:
- `fk_clients_user`: Tied to `users.id` with `ON DELETE CASCADE`.
- `idx_clients_user`: High-performance tenant filtering index.
- Invoices reference `clients.id` with `ON DELETE RESTRICT` to prevent accidental deletion of clients with active accounting records.

---

### 2.4 Table: `invoices` (Billing Headers & State Machine)
Stores invoice documents with financial totals and state machine transitions.

```sql
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
```

#### Invoicing Invariants & Design:
- `uq_user_invoice_number`: Guarantees invoice numbers are unique per tenant while allowing different businesses to use identical numbering schemes (e.g. `INV-001`).
- `status`: Controlled by a finite state machine (`DRAFT -> ISSUED -> [PARTIALLY_PAID -> PAID | OVERDUE | VOID]`).
- Financial values are stored as fixed-point `DECIMAL(12, 2)` to eliminate floating-point representation drift.
- `fk_invoices_client` with `ON DELETE RESTRICT`: Protects against client deletion when invoices exist.

---

### 2.5 Table: `invoice_items` (Line Items & Itemized Taxes)
Stores normalized line items, quantities, unit prices, and line-level tax percentages.

```sql
CREATE TABLE invoice_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT UNSIGNED NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    line_subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    line_tax DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_items_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```


#### Line Arithmetic Rules:
- `line_subtotal = round(quantity * unit_price, 2)`
- `line_tax = round(line_subtotal * (tax_rate / 100), 2)`
- `line_total = line_subtotal + line_tax`
- Calculated purely on the server inside `money.js`; browser inputs for subtotals or taxes are discarded.

---

### 2.6 Table: `invoice_payments` (Payment Ledger & Transaction Audit)
Stores immutable payment records against issued invoices.

```sql
CREATE TABLE invoice_payments (
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

#### Referential Integrity & Accounting Rules:
- `fk_payments_invoice`: Bound to `invoices.id` using `ON DELETE RESTRICT`. Invoices with recorded financial transactions cannot be deleted or purged, strictly guaranteeing the legal accounting audit trail.
- `amount`: Fixed-point `DECIMAL(12, 2)` positive monetary value. Checked server-side against outstanding balance (`amount <= amount_due`).
- `payment_method`: Strictly validated ENUM (`BANK_TRANSFER`, `CREDIT_CARD`, `CASH`, `CHECK`, `OTHER`).
- `idx_payments_invoice`: Indexed for sub-millisecond retrieval of payment history when viewing an invoice.
- `idx_payments_date`: Indexed for chronological financial reporting and tax period audits.
- **Transactional Row Locking:** Payments are recorded inside an atomic MySQL transaction with `SELECT ... FOR UPDATE` row-level locks on the parent invoice to prevent concurrent double-payment race conditions.

---

## 3. Entity-Relationship Diagram (ERD)

```
       +-----------------------+
       |         users         |  (ACTIVE - Phase 1)
       +-----------------------+
       | PK  id                |
       |     email (UQ)        |
       |     password_hash     |
       |     token_version     |
       |     business_name     |
       +-----------+-----------+
                   | 1
                   |
                   | has many
                   |
       +-----------v-----------+               +-----------------------+
       |        clients        | 1             |        invoices       |  (ACTIVE - Phase 2)
       +-----------------------+---------------+-----------------------+
       | PK  id                | has many      | PK  id                |
       | FK  user_id           |<--------------| FK  user_id           |
       |     name              |               | FK  client_id         |
       |     email             |               |     invoice_number    |
       |     phone             |               |     status (ENUM)     |
       |     address           |               |     subtotal          |
       +-----------------------+               |     tax_total         |
                                               |     total_amount      |
                                               |     amount_paid       |
                                               |     amount_due        |
                                               +-----------+-----------+
                                                           | 1
                                           +---------------+---------------+
                                           | has many                      | has many
                                           |                               |
                               +-----------v-----------+       +-----------v-----------+
                               |     invoice_items     |       |    invoice_payments   | (ACTIVE - Phase 3)
                               +-----------------------+       +-----------------------+
                               | PK  id                |       | PK  id                |
                               | FK  invoice_id        |       | FK  invoice_id        |
                               |     description       |       |     amount            |
                               |     quantity          |       |     payment_date      |
                               |     unit_price        |       |     payment_method    |
                               |     tax_rate          |       |     reference         |
                               |     line_subtotal     |       |     notes             |
                               |     line_tax          |       |     created_at        |
                               |     line_total        |       +-----------------------+
                               +-----------------------+
```

---

## 4. Migration Execution & Local Reproduction

### Running Migrations
Migrations are managed deterministically via `server/src/db/migrate.js`:

```bash
# 1. Run migrations against development database (quikinvoice_dev)
npm run migrate

# 2. Run migrations against test database (quikinvoice_test)
node server/src/db/migrate.js quikinvoice_test
```
