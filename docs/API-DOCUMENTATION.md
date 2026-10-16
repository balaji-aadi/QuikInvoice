# QuikInvoice — REST API Specification & Documentation

**Version:** 1.2.0 (Phase 2 Implemented)  
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
      "client_name": "Acme Technologies",
      "client_email": "billing@acme.com",
      "item_count": 2
    }
  ],
  "pagination": { ... }
}
```

### `GET /api/invoices/:id`
Retrieve comprehensive invoice record including full client profile and itemized line items.
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
      "status": "ISSUED",
      "issue_date": "2026-10-16",
      "due_date": "2026-11-15",
      "subtotal": "2000.00",
      "tax_total": "300.00",
      "total_amount": "2300.00",
      "amount_paid": "0.00",
      "amount_due": "2300.00",
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
      ]
    }
  }
}
```

### `GET /api/invoices/:id/pdf`
Streams a dynamically generated vector PDF document directly to the client browser.
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
- **Constraint:** Only invoices in `DRAFT` status can be modified. If the invoice is `ISSUED` or `PAID`, returns `400 Bad Request`.
- **Response (200 OK):** Updated invoice object.

### `PATCH /api/invoices/:id/status`
Transitions the status of an invoice according to the finite state machine.
- **Request Body:**
```json
{
  "status": "ISSUED"
}
```
- **Valid Transitions:**
  - `DRAFT -> ISSUED`
  - `ISSUED -> VOID`
  - `DRAFT -> VOID`
- **Response (200 OK):** Updated invoice object.

### `DELETE /api/invoices/:id`
Deletes an invoice.
- **Constraint:** Only `DRAFT` or `VOID` invoices can be deleted. `ISSUED` or `PAID` invoices cannot be deleted to preserve accounting records.
- **Response (200 OK):** Confirmation message.
