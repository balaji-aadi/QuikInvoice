import request from 'supertest';
import app from '../src/app.js';
import './setup.js';

describe('QuikInvoice Phase 2 — Invoice Management & PDF Generation Integration Tests', () => {
  let userTokenA;
  let userTokenB;
  let clientAId;
  let clientBId;

  const userA = {
    name: 'Ada Lovelace',
    email: 'ada@analytical.com',
    password: 'Password123!',
    businessName: 'Analytical Engines Ltd',
    businessAddress: '10 Downing St, London, UK',
    businessPhone: '+44 20 7946 0991',
  };

  const userB = {
    name: 'Charles Babbage',
    email: 'charles@difference.org',
    password: 'Password123!',
    businessName: 'Difference Corp',
  };

  beforeEach(async () => {
    // 1. Register User A and create a client for User A
    const resA = await request(app).post('/api/auth/register').send(userA);
    userTokenA = resA.body.data.token;

    const clientResA = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({
        name: 'Royal Society of London',
        email: 'billing@royalsociety.org',
        phone: '+44 20 7451 2500',
        address: '6-9 Carlton House Terrace, London SW1Y 5AG',
      });
    clientAId = clientResA.body.data.client.id;

    // 2. Register User B and create a client for User B
    const resB = await request(app).post('/api/auth/register').send(userB);
    userTokenB = resB.body.data.token;

    const clientResB = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${userTokenB}`)
      .send({
        name: 'British Astronomical Association',
        email: 'accounts@britastro.org',
      });
    clientBId = clientResB.body.data.client.id;
  });

  describe('Authentication & Authorization', () => {
    it('should reject unauthenticated access to /api/invoices with 401', async () => {
      const res = await request(app).get('/api/invoices');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/invoices (Create Invoice & Authoritative Arithmetic)', () => {
    it('should create an invoice and compute accurate line items, tax, and totals on server', async () => {
      const invoicePayload = {
        clientId: clientAId,
        invoiceNumber: 'INV-2026-001',
        issueDate: '2026-10-16',
        dueDate: '2026-11-15',
        notes: 'Payment net 30 days via wire transfer.',
        items: [
          {
            description: 'Software Architecture Consultation',
            quantity: 10,
            unitPrice: 150.0,
            taxRate: 20.0, // 10 * 150 = 1500, tax 20% = 300, total = 1800
          },
          {
            description: 'Cloud Infrastructure Setup',
            quantity: 1,
            unitPrice: 500.55,
            taxRate: 10.0, // 500.55, tax 10% = 50.055 -> 50.06, total = 550.61
          },
        ],
      };

      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send(invoicePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const invoice = res.body.data.invoice;

      expect(invoice.id).toBeDefined();
      expect(invoice.invoice_number).toBe('INV-2026-001');
      expect(invoice.status).toBe('DRAFT');
      expect(invoice.client_id).toBe(clientAId);
      expect(invoice.client_name).toBe('Royal Society of London');

      // Check authoritative server calculations
      expect(Number(invoice.subtotal)).toBeCloseTo(2000.55, 2);
      expect(Number(invoice.tax_total)).toBeCloseTo(350.06, 2);
      expect(Number(invoice.total_amount)).toBeCloseTo(2350.61, 2);
      expect(Number(invoice.amount_paid)).toBe(0);
      expect(Number(invoice.amount_due)).toBeCloseTo(2350.61, 2);

      // Verify line items
      expect(invoice.items.length).toBe(2);
      expect(Number(invoice.items[0].line_subtotal)).toBeCloseTo(1500.0, 2);
      expect(Number(invoice.items[0].line_tax)).toBeCloseTo(300.0, 2);
      expect(Number(invoice.items[0].line_total)).toBeCloseTo(1800.0, 2);
    });

    it('should ignore client-supplied falsified totals and compute authoritatively', async () => {
      const spoofedPayload = {
        clientId: clientAId,
        invoiceNumber: 'INV-SPOOF-01',
        issueDate: '2026-10-16',
        dueDate: '2026-10-20',
        subtotal: 1.0, // Malicious spoof
        taxTotal: 0.0, // Malicious spoof
        totalAmount: 1.0, // Malicious spoof
        items: [
          {
            description: 'Enterprise License',
            quantity: 2,
            unitPrice: 1000.0,
            taxRate: 15.0,
          },
        ],
      };

      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send(spoofedPayload);

      expect(res.status).toBe(201);
      const invoice = res.body.data.invoice;
      // Server arithmetic must overwrite spoofed values
      expect(Number(invoice.subtotal)).toBe(2000.0);
      expect(Number(invoice.tax_total)).toBe(300.0);
      expect(Number(invoice.total_amount)).toBe(2300.0);
    });

    it('should reject invoice when dueDate is earlier than issueDate', async () => {
      const invalidPayload = {
        clientId: clientAId,
        invoiceNumber: 'INV-BAD-DATE',
        issueDate: '2026-10-16',
        dueDate: '2026-10-10', // Prior to issue date
        items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
      };

      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invoice with duplicate invoice_number for the same tenant', async () => {
      const payload = {
        clientId: clientAId,
        invoiceNumber: 'INV-DUP-TEST',
        issueDate: '2026-10-16',
        dueDate: '2026-11-01',
        items: [{ description: 'Item', quantity: 1, unitPrice: 50 }],
      };

      await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send(payload);

      const dupRes = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send(payload);

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.error.code).toBe('ConflictError');
    });
  });

  describe('Multi-Tenant Isolation', () => {
    let invoiceAId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          clientId: clientAId,
          invoiceNumber: 'INV-TENANT-A',
          issueDate: '2026-10-16',
          dueDate: '2026-11-15',
          items: [{ description: 'Work A', quantity: 1, unitPrice: 100 }],
        });
      invoiceAId = res.body.data.invoice.id;
    });

    it('User A cannot create invoice for client owned by User B (returns 404)', async () => {
      const crossClientPayload = {
        clientId: clientBId, // Belongs to User B
        invoiceNumber: 'INV-CROSS-01',
        issueDate: '2026-10-16',
        dueDate: '2026-11-15',
        items: [{ description: 'Unauthorized', quantity: 1, unitPrice: 100 }],
      };

      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send(crossClientPayload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B cannot retrieve User A invoice by ID (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/invoices/${invoiceAId}`)
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B invoice list does not contain User A invoices', async () => {
      const res = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('User B cannot download PDF of User A invoice (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/invoices/${invoiceAId}/pdf`)
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Invoice Lifecycle, Status State Machine & Immutability', () => {
    let invoiceId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          clientId: clientAId,
          invoiceNumber: 'INV-STATE-01',
          issueDate: '2026-10-16',
          dueDate: '2026-11-15',
          items: [{ description: 'Initial Item', quantity: 2, unitPrice: 100, taxRate: 10 }],
        });
      invoiceId = res.body.data.invoice.id;
    });

    it('should allow modifying items and fields while invoice is in DRAFT status', async () => {
      const updatePayload = {
        notes: 'Updated draft note',
        items: [
          { description: 'Revised Item', quantity: 5, unitPrice: 200, taxRate: 20 },
        ],
      };

      const res = await request(app)
        .put(`/api/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.data.invoice.notes).toBe('Updated draft note');
      expect(Number(res.body.data.invoice.subtotal)).toBe(1000.0);
      expect(Number(res.body.data.invoice.tax_total)).toBe(200.0);
      expect(Number(res.body.data.invoice.total_amount)).toBe(1200.0);
    });

    it('should transition status from DRAFT to ISSUED', async () => {
      const res = await request(app)
        .patch(`/api/invoices/${invoiceId}/status`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ status: 'ISSUED' });

      expect(res.status).toBe(200);
      expect(res.body.data.invoice.status).toBe('ISSUED');
    });

    it('should disallow modifying items or dates once invoice is ISSUED', async () => {
      // First, issue invoice
      await request(app)
        .patch(`/api/invoices/${invoiceId}/status`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ status: 'ISSUED' });

      // Attempt to edit
      const editRes = await request(app)
        .put(`/api/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          items: [{ description: 'Illegal edit', quantity: 1, unitPrice: 50 }],
        });

      expect(editRes.status).toBe(400);
      expect(editRes.body.success).toBe(false);
      expect(editRes.body.error.message).toContain('cannot be modified');
    });

    it('should reject deletion of an ISSUED invoice with 400 Bad Request', async () => {
      await request(app)
        .patch(`/api/invoices/${invoiceId}/status`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ status: 'ISSUED' });

      const delRes = await request(app)
        .delete(`/api/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(delRes.status).toBe(400);
      expect(delRes.body.success).toBe(false);
      expect(delRes.body.error.message).toContain('must be marked as VOID');
    });

    it('should allow transitioning ISSUED invoice to VOID and then deleting it', async () => {
      // Issue
      await request(app)
        .patch(`/api/invoices/${invoiceId}/status`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ status: 'ISSUED' });

      // Void
      const voidRes = await request(app)
        .patch(`/api/invoices/${invoiceId}/status`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ status: 'VOID' });

      expect(voidRes.status).toBe(200);
      expect(voidRes.body.data.invoice.status).toBe('VOID');

      // Delete VOID invoice
      const delRes = await request(app)
        .delete(`/api/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });
  });

  describe('PDF Generation & Download', () => {
    let invoiceId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          clientId: clientAId,
          invoiceNumber: 'INV-PDF-001',
          issueDate: '2026-10-16',
          dueDate: '2026-11-15',
          notes: 'Thanks for your valued business.',
          items: [
            { description: 'Consulting Services', quantity: 5, unitPrice: 200, taxRate: 15 },
            { description: 'Server Hosting', quantity: 1, unitPrice: 150, taxRate: 0 },
          ],
        });
      invoiceId = res.body.data.invoice.id;
    });

    it('should generate and stream a valid binary PDF document for the invoice', async () => {
      const res = await request(app)
        .get(`/api/invoices/${invoiceId}/pdf`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .buffer(true)
        .parse((res, callback) => {
          res.setEncoding('binary');
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            callback(null, Buffer.from(data, 'binary'));
          });
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename="Invoice-INV-PDF-001.pdf"');

      // Verify PDF magic header bytes "%PDF-"
      const buffer = res.body;
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(500); // Legitimate PDF is at least hundreds of bytes
      const magicBytes = buffer.toString('utf-8', 0, 5);
      expect(magicBytes).toBe('%PDF-');
    });
  });
});
