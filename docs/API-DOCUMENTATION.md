# QuikInvoice — REST API Specification & Documentation

**Version:** 1.3.0 (Phase 3 Implemented)  
**Base URL:** `http://localhost:5001/api` (Development)  
**Protocol:** HTTP/1.1 REST with JSON payloads  
**Security:** JWT in `httpOnly` + `SameSite=Lax` cookies, Bearer Token authorization header support, CSRF origin verification (`X-Requested-With: XMLHttpRequest`), and tenant-isolated data access.

---

## 1. Global Standards & Envelope

### Success Response Envelope
```json
{
  "success": true,
  "message": "Optional human-readable confirmation message",
  "data": { ... },
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "dueDate",
        "message": "Due date cannot be earlier than issue date"
      }
    ]
  }
}
```

---

## 2. Health & Monitoring

### `GET /api/health`
Checks backend and MySQL database connectivity.
- **Auth Required:** No
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-16T08:20:00.000Z",
  "database": {
    "connected": true,
    "database": "quikinvoice_dev"
  },
  "environment": "development"
}
```

---

## 3. Authentication & Profile Endpoints

### `POST /api/auth/register`
Creates a new tenant user account with bcrypt salted password hashing (12 rounds) and sets an `httpOnly` JWT session cookie.
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@doeconsulting.com",
  "password": "StrongPassword123!",
  "businessName": "Doe Consulting LLC",
  "businessAddress": "100 Innovation Way, Suite 400, Austin, TX",
  "businessPhone": "+1 (512) 555-0199"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@doeconsulting.com",
      "business_name": "Doe Consulting LLC",
      "business_address": "100 Innovation Way, Suite 400, Austin, TX",
      "business_phone": "+1 (512) 555-0199",
      "created_at": "2026-10-16T08:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### `POST /api/auth/login`
Authenticates existing user with email and password, setting an `httpOnly` cookie.
- **Request Body:**
```json
{
  "email": "jane@doeconsulting.com",
  "password": "StrongPassword123!"
}
```
- **Response (200 OK):** User profile and JWT token.

### `GET /api/auth/me`
Retrieves currently authenticated user profile.
- **Auth Required:** Yes (via cookie or `Authorization: Bearer <token>`)
- **Response (200 OK):** Current user object.

### `POST /api/auth/logout`
Clears session cookie and increments `token_version` on the user record, revoking all existing tokens.
- **Auth Required:** Yes
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 4. Client Management Endpoints

All client endpoints require an authenticated tenant session and automatically enforce tenant isolation.

### `GET /api/clients`
List clients belonging to the authenticated tenant.
- **Query Parameters:**
  - `search` (string, optional): Search keyword against name, email, or phone.
  - `page` (integer, default: 1): Page number.
  - `limit` (integer, default: 20, max: 100): Items per page.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "user_id": 1,
      "name": "Acme Technologies",
      "email": "billing@acme.com",
      "phone": "+1 (555) 234-5678",
      "address": "400 Valley Blvd, San Jose, CA",
      "created_at": "2026-10-16T08:15:00.000Z",
      "updated_at": "2026-10-16T08:15:00.000Z",
      "invoice_count": 3
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### `GET /api/clients/:id`
Fetch single client record by ID with invoice count.
- **Response (200 OK):** Single client object.
- **Response (404 Not Found):** If client does not exist or belongs to another tenant.

### `POST /api/clients`
Create a new client profile.
- **Request Body:**
```json
{
  "name": "Acme Technologies",
  "email": "billing@acme.com",
  "phone": "+1 (555) 234-5678",
  "address": "400 Valley Blvd, San Jose, CA"
}
```
- **Response (201 Created):** Created client record.

### `PUT /api/clients/:id`
Update client profile details.
- **Request Body:** Partial or complete client fields (`name`, `email`, `phone`, `address`).
- **Response (200 OK):** Updated client record.

### `DELETE /api/clients/:id`
Permanently delete a client profile.
- **Guards:** Fails with `409 ConflictError` if the client has any invoices attached, preserving legal accounting history.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

---

## 5. Invoice Management Endpoints

### `GET /api/invoices`
List invoices for the authenticated tenant with filters and pagination.
- **Query Parameters:**
  - `status` (string, optional): `DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `VOID`.
    - *Note on `OVERDUE`:* Evaluated dynamically in SQL as `due_date < CURRENT_DATE() AND amount_due > 0 AND status NOT IN ('DRAFT', 'PAID', 'VOID')`, returning all delinquent active invoices.
  - `clientId` (integer, optional): Filter by client ID.
  - `search` (string, optional): Search by invoice number or client name.
  - `page` (integer, default: 1).
  - `limit` (integer, default: 20).
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "user_id": 1,
      "client_id": 12,
      "invoice_number": "INV-2026-001",
      "status": "ISSUED",
      "issue_date": "2026-10-16",
      "due_date": "2026-11-15",
      "subtotal": "2000.00",
      "tax_total": "300.00",
      "total_amount": "2300.00",
      "amount_paid": "0.00",
      "amount_due": "2300.00",
      "is_overdue": 0,
      "client_name": "Acme Technologies",
      "client_email": "billing@acme.com",
      "item_count": 2
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### `GET /api/invoices/metrics`
Returns aggregate financial KPI metrics calculated across all active invoices for the authenticated user.
- **Calculations:**
  - `totalBilled`: Sum of `total_amount` for non-DRAFT, non-VOID invoices.
  - `totalPaid`: Sum of `amount_paid` for non-DRAFT, non-VOID invoices.
  - `totalOutstanding`: Sum of `amount_due` for non-DRAFT, non-VOID invoices (`totalBilled - totalPaid`).
  - `overdueAmount`: Sum of `amount_due` where `due_date < CURRENT_DATE()` and invoice is not DRAFT, PAID, or VOID.
  - `overdueCount`: Total count of delinquent invoices.
  - `invoiceCount`: Total number of active invoices.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalBilled": "12500.00",
    "totalPaid": "8000.00",
    "totalOutstanding": "4500.00",
    "overdueAmount": "1500.00",
    "overdueCount": 2,
    "invoiceCount": 7
  }
}
```

### `GET /api/invoices/:id`
Retrieve comprehensive invoice record including full client profile, itemized line items, and payment history ledger.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": 101,
      "user_id": 1,
      "client_id": 12,
      "invoice_number": "INV-2026-001",
      "status": "PARTIALLY_PAID",
      "issue_date": "2026-10-16",
      "due_date": "2026-11-15",
      "subtotal": "2000.00",
      "tax_total": "300.00",
      "total_amount": "2300.00",
      "amount_paid": "1000.00",
      "amount_due": "1300.00",
      "is_overdue": 0,
      "notes": "Net 30 payment terms",
      "client_name": "Acme Technologies",
      "client_email": "billing@acme.com",
      "client_phone": "+1 (555) 234-5678",
      "client_address": "400 Valley Blvd, San Jose, CA",
      "business_name": "Doe Consulting LLC",
      "user_email": "jane@doeconsulting.com",
      "items": [
        {
          "id": 501,
          "invoice_id": 101,
          "description": "Full-Stack Development Sprint",
          "quantity": "20.00",
          "unit_price": "100.00",
          "tax_rate": "15.00",
          "line_subtotal": "2000.00",
          "line_tax": "300.00",
          "line_total": "2300.00"
        }
      ],
      "payments": [
        {
          "id": 201,
          "invoice_id": 101,
          "amount": "1000.00",
          "payment_date": "2026-10-16",
          "payment_method": "BANK_TRANSFER",
          "reference": "WIRE-88992",
          "notes": "First milestone payment",
          "created_at": "2026-10-16T09:00:00.000Z"
        }
      ]
    }
  }
}
```

### `GET /api/invoices/:id/pdf`
Streams a dynamically generated vector PDF document directly to the client browser. Includes invoice header, itemized breakdown, tax details, and chronological payment receipt ledger.
- **Benchmark Performance:** Reproducible average generation latency: ~5.95ms (Min: 2.47ms, Max: 28.66ms across 10 iterations).
- **Response Headers:**
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="Invoice-INV-2026-001.pdf"`
  - `Cache-Control: private, no-cache, no-store, must-revalidate`
- **Response Body:** Binary PDF stream (starts with `%PDF-`).

### `POST /api/invoices`
Create a new invoice with itemized line items. Calculations are performed authoritatively on the server.
- **Request Body:**
```json
{
  "clientId": 12,
  "invoiceNumber": "INV-2026-001",
  "issueDate": "2026-10-16",
  "dueDate": "2026-11-15",
  "status": "DRAFT",
  "notes": "Payment via bank transfer within 30 days.",
  "items": [
    {
      "description": "Software Engineering Architecture",
      "quantity": 10,
      "unitPrice": 150.00,
      "taxRate": 10.00
    }
  ]
}
```
- **Response (201 Created):** Created invoice object with recalculated totals.

### `PUT /api/invoices/:id`
Updates a draft invoice.
- **Constraint:** Only invoices in `DRAFT` status can be modified. If the invoice is `ISSUED`, `PARTIALLY_PAID`, or `PAID`, returns `400 Bad Request`.
- **Response (200 OK):** Updated invoice object.

### `PATCH /api/invoices/:id/status`
Transitions the status of an invoice according to the finite state machine.
- **Request Body:**
```json
{
  "status": "ISSUED"
}
```
- **Valid Manual Transitions:**
  - `DRAFT -> ISSUED`
  - `DRAFT -> VOID`
  - `ISSUED -> VOID` (only if 0 payments recorded)
- **Constraint:** Invoices with recorded payments cannot be voided (`400 Bad Request`). Status transitions to `PARTIALLY_PAID` and `PAID` are managed automatically by the payment engine.
- **Response (200 OK):** Updated invoice object.

### `DELETE /api/invoices/:id`
Deletes an invoice.
- **Constraint:** Only `DRAFT` or un-paid `VOID` invoices can be deleted. `ISSUED` invoices, `PAID` invoices, or any invoice with recorded payments cannot be deleted (`400 Bad Request` or `409 Conflict`), strictly protecting the financial audit trail.
- **Response (200 OK):** Confirmation message.

---

## 6. Payment & Financial Ledger Endpoints

### `POST /api/invoices/:id/payments`
Records a payment against an issued or partially paid invoice within an atomic MySQL transaction with row-level locking (`SELECT ... FOR UPDATE`).
- **Auth Required:** Yes (Tenant owner only).
- **Request Body:**
```json
{
  "amount": 500.00,
  "paymentDate": "2026-10-16",
  "paymentMethod": "BANK_TRANSFER",
  "reference": "TXN-90210",
  "notes": "Second milestone payment"
}
```
- **Validation Rules:**
  - `amount`: Number > 0, maximum 2 decimal places. Must not exceed current `amount_due`.
  - `paymentDate`: Valid ISO date string (`YYYY-MM-DD`).
  - `paymentMethod`: `BANK_TRANSFER`, `CREDIT_CARD`, `CASH`, `CHECK`, `OTHER`.
  - `reference`: String (max 100 chars, optional).
  - `notes`: String (optional).
- **Concurrency & State Machine Behavior:**
  - Locks invoice row with `SELECT * FROM invoices WHERE id = ? AND user_id = ? FOR UPDATE`.
  - Re-evaluates exact `amount_paid` from payments ledger inside the transaction.
  - Computes remaining `amount_due = total_amount - amount_paid`.
  - If `paymentAmount > amount_due`, transaction rolls back and returns `400 Bad Request` (`Payment amount exceeds outstanding balance`).
  - If `status` is `DRAFT` or `VOID`, rejects with `400 Bad Request`.
  - Inserts row into `invoice_payments`.
  - Updates `invoices.amount_paid` and `invoices.amount_due`.
  - If new `amount_due === 0`, sets `status = 'PAID'`; otherwise sets `status = 'PARTIALLY_PAID'`.
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "payment": {
      "id": 202,
      "invoice_id": 101,
      "amount": "500.00",
      "payment_date": "2026-10-16",
      "payment_method": "BANK_TRANSFER",
      "reference": "TXN-90210",
      "notes": "Second milestone payment",
      "created_at": "2026-10-16T09:15:00.000Z"
    },
    "invoice": {
      "id": 101,
      "status": "PARTIALLY_PAID",
      "total_amount": "2300.00",
      "amount_paid": "1500.00",
      "amount_due": "800.00"
    }
  }
}
```

### `GET /api/invoices/:id/payments`
Retrieves chronological payment history for a specific invoice.
- **Auth Required:** Yes (Tenant owner only).
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 201,
      "invoice_id": 101,
      "amount": "1000.00",
      "payment_date": "2026-10-16",
      "payment_method": "BANK_TRANSFER",
      "reference": "WIRE-88992",
      "notes": "First milestone payment",
      "created_at": "2026-10-16T09:00:00.000Z"
    },
    {
      "id": 202,
      "invoice_id": 101,
      "amount": "500.00",
      "payment_date": "2026-10-16",
      "payment_method": "BANK_TRANSFER",
      "reference": "TXN-90210",
      "notes": "Second milestone payment",
      "created_at": "2026-10-16T09:15:00.000Z"
    }
  ]
}
```
