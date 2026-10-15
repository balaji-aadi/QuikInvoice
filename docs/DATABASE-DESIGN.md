# QuikInvoice — Database Design & Schema Documentation

**Project:** QuikInvoice — Web-Based Billing & Invoice Management System  
**Storage Engine:** MySQL 9.5.0 (InnoDB)  
**Active Schema Version:** Migration 001 (`001_create_users.sql`)  
**Character Set:** `utf8mb4` | **Collation:** `utf8mb4_unicode_ci`  
**Date:** October 15, 2026  

---

## 1. Overview & Isolation Strategy

QuikInvoice utilizes **MySQL** with the **InnoDB** storage engine to provide strict ACID compliance, foreign key enforcement, and exact monetary representation.

To preserve complete development and test integrity:
1. **Development Database:** `quikinvoice_dev`
2. **Testing Database:** `quikinvoice_test`
3. **Unrelated Databases:** Any existing local databases (e.g. `Leasemanagement`, `practice`, `school`) remain completely untouched and unreferenced.

---

## 2. Active Schema (Phase 1 Implemented)

### 2.1 Table: `schema_migrations`
Maintains an immutable audit ledger of all applied database migrations.

```sql
CREATE TABLE schema_migrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 Table: `users` (Tenants / Businesses)
Stores business owners who issue invoices. Every business operates in multi-tenant isolation.

```sql
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    business_address TEXT NULL,
    business_phone VARCHAR(50) NULL,
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
- `created_at` / `updated_at`: Automated UTC audit timestamps.

---

## 3. Staged Schema (Planned for Phase 2 & Phase 3)

In strict adherence to Phase 1 boundaries, the following tables are designed and documented but **not yet executed**:

```
       +-----------------------+
       |         users         |  (ACTIVE - Phase 1)
       +-----------------------+
       | PK  id                |
       |     email (UQ)        |
       |     password_hash     |
       |     business_name     |
       +-----------+-----------+
                   | 1
                   |
                   | has many
                   |
       +-----------v-----------+               +-----------------------+
       |        clients        | 1             |        invoices       |  (STAGED - Phase 2)
       +-----------------------+---------------+-----------------------+
       | PK  id                | has many      | PK  id                |
       | FK  user_id           |<--------------| FK  user_id           |
       |     name              |               | FK  client_id         |
       |     email             |               |     invoice_number    |
       +-----------------------+               |     total_amount      |
                                               +-----------+-----------+
                                                           | 1
                                           +---------------+---------------+
                                           | has many                      | has many
                                           |                               |
                               +-----------v-----------+       +-----------v-----------+
                               |     invoice_items     |       |    invoice_payments   | (STAGED - Phase 3)
                               +-----------------------+       +-----------------------+
                               | PK  id                |       | PK  id                |
                               | FK  invoice_id        |       | FK  invoice_id        |
                               |     line_subtotal     |       |     amount            |
                               |     line_tax          |       |     payment_date      |
                               +-----------------------+       +-----------------------+
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

### How the Migration Runner Works
1. Connects to the target MySQL database using credentials from `.env`.
2. Creates `schema_migrations` if not present.
3. Reads already applied migration filenames.
4. Reads all `.sql` files in `server/src/db/migrations/` in alphabetical order.
5. Executes pending migrations inside an atomic transaction.
6. Records applied migrations in `schema_migrations`.
