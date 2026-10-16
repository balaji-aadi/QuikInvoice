import request from 'supertest';
import app from '../src/app.js';
import { query } from '../src/config/db.js';
import './setup.js';

describe('QuikInvoice Phase 3 — Payment Recording, Concurrency & Transactional Integrity', () => {
  let userTokenA;
  let userTokenB;
  let clientAId;
  let clientBId;
  let invoiceAId;
  let draftInvoiceId;

  const userA = {
    name: 'Ada Lovelace',
    email: 'ada@analytical.com',
    password: 'Password123!',
    businessName: 'Analytical Engines Ltd',
  };

  const userB = {
    name: 'Charles Babbage',
    email: 'charles@difference.org',
    password: 'Password123!',
    businessName: 'Difference Corp',
  };

  beforeEach(async () => {
    // 1. Register User A and create a client
    const resA = await request(app).post('/api/auth/register').send(userA);
    userTokenA = resA.body.data.token;

    const clientResA = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({
        name: 'Royal Society of London',
        email: 'billing@royalsociety.org',
      });
    clientAId = clientResA.body.data.client.id;

    // 2. Register User B and create a client
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

    // 3. Create and ISSUE an invoice for User A ($1,000.00 total)
    const invRes = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({
        clientId: clientAId,
        invoiceNumber: 'INV-PAY-001',
        issueDate: '2026-10-16',
        dueDate: '2026-11-15',
        status: 'ISSUED',
        items: [
          { description: 'Consulting Milestone 1', quantity: 10, unitPrice: 100, taxRate: 0 },
        ],
      });
    invoiceAId = invRes.body.data.invoice.id;

    // 4. Create a DRAFT invoice for User A
    const draftRes = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({
        clientId: clientAId,
        invoiceNumber: 'INV-DRAFT-001',
        issueDate: '2026-10-16',
        dueDate: '2026-11-15',
        status: 'DRAFT',
        items: [
          { description: 'Draft work', quantity: 1, unitPrice: 200, taxRate: 0 },
        ],
      });
    draftInvoiceId = draftRes.body.data.invoice.id;
  });

  describe('Authentication & Multi-Tenant Authorization', () => {
    it('should reject unauthenticated access to record or list payments with 401', async () => {
      const getRes = await request(app).get(`/api/invoices/${invoiceAId}/payments`);
      expect(getRes.status).toBe(401);

      const postRes = await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .send({ amount: 100, paymentDate: '2026-10-16', paymentMethod: 'BANK_TRANSFER' });
      expect(postRes.status).toBe(401);
    });

    it('User B cannot view payments for User A invoice (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B cannot record payment on User A invoice (returns 404)', async () => {
      const res = await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({
          amount: 100,
          paymentDate: '2026-10-16',
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Invoice State Machine Payment Restrictions', () => {
    it('should reject payment recording on a DRAFT invoice with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/invoices/${draftInvoiceId}/payments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          amount: 50,
          paymentDate: '2026-10-16',
          paymentMethod: 'CREDIT_CARD',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Cannot record payment against a DRAFT invoice');
    });

    it('should reject payment recording on a VOID invoice with 400 Bad Request', async () => {
      // Void the invoice
      await request(app)
        .patch(`/api/invoices/${invoiceAId}/status`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ status: 'VOID' });

      const res = await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          amount: 100,
          paymentDate: '2026-10-16',
          paymentMethod: 'CHECK',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Cannot record payment against a VOID invoice');
    });
  });

  describe('Validation & Overpayment Rejection', () => {
    it('should reject payment with non-positive amount or missing required fields', async () => {
      const resZero = await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ amount: 0, paymentDate: '2026-10-16', paymentMethod: 'CASH' });

      expect(resZero.status).toBe(400);

      const resNegative = await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ amount: -150, paymentDate: '2026-10-16', paymentMethod: 'CASH' });

      expect(resNegative.status).toBe(400);
    });

    it('should reject payment amounts that exceed the outstanding balance due', async () => {
      // Total amount is $1,000.00; attempt to pay $1,000.01
      const res = await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          amount: 1000.01,
          paymentDate: '2026-10-16',
          paymentMethod: 'BANK_TRANSFER',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('exceeds remaining balance');
    });
  });

  describe('Partial Payment, Full Settlement & State Machine Transitions', () => {
    it('should record a partial payment and transition status to PARTIALLY_PAID', async () => {
      const payPayload = {
        amount: 350.50,
        paymentDate: '2026-10-16',
        paymentMethod: 'BANK_TRANSFER',
        reference: 'WIRE-TX-9901',
        notes: 'Deposit milestone payment',
      };

      const res = await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send(payPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment).toBeDefined();
      expect(Number(res.body.data.payment.amount)).toBe(350.5);
      expect(res.body.data.payment.reference).toBe('WIRE-TX-9901');

      // Check updated invoice summary
      expect(res.body.data.invoice.status).toBe('PARTIALLY_PAID');
      expect(Number(res.body.data.invoice.amount_paid)).toBe(350.5);
      expect(Number(res.body.data.invoice.amount_due)).toBe(649.5);

      // Verify invoice detail view also reflects updated values
      const detailRes = await request(app)
        .get(`/api/invoices/${invoiceAId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(detailRes.body.data.invoice.status).toBe('PARTIALLY_PAID');
      expect(Number(detailRes.body.data.invoice.amount_paid)).toBe(350.5);
      expect(Number(detailRes.body.data.invoice.amount_due)).toBe(649.5);
      expect(detailRes.body.data.invoice.payments.length).toBe(1);
    });

    it('should record multiple payments up to exact settlement and transition status to PAID', async () => {
      // Payment 1: $400.00
      await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ amount: 400.0, paymentDate: '2026-10-16', paymentMethod: 'CREDIT_CARD' });

      // Payment 2: Exact balance settlement ($600.00)
      const finalRes = await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ amount: 600.0, paymentDate: '2026-10-17', paymentMethod: 'BANK_TRANSFER' });

      expect(finalRes.status).toBe(201);
      expect(finalRes.body.data.invoice.status).toBe('PAID');
      expect(Number(finalRes.body.data.invoice.amount_paid)).toBe(1000.0);
      expect(Number(finalRes.body.data.invoice.amount_due)).toBe(0.0);

      // Subsequent payment attempt on fully PAID invoice must be rejected
      const overRes = await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ amount: 10.0, paymentDate: '2026-10-18', paymentMethod: 'CASH' });

      expect(overRes.status).toBe(400);
      expect(overRes.body.error.message).toContain('already fully paid');
    });

    it('should protect invoices with recorded payments from being deleted or voided', async () => {
      // Record payment
      await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ amount: 200.0, paymentDate: '2026-10-16', paymentMethod: 'CASH' });

      // Attempt to delete
      const delRes = await request(app)
        .delete(`/api/invoices/${invoiceAId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(delRes.status).toBe(400); // Only DRAFT/VOID can be deleted
      expect(delRes.body.error.message).toContain('Cannot delete invoice');

      // Attempt to void
      const voidRes = await request(app)
        .patch(`/api/invoices/${invoiceAId}/status`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ status: 'VOID' });

      expect(voidRes.status).toBe(409);
      expect(voidRes.body.error.message).toContain('recorded payment');
    });
  });

  describe('Transactional Concurrency & Row-Level Locking (SELECT ... FOR UPDATE)', () => {
    it('should safely serialize concurrent payment requests without overpayment or balance corruption', async () => {
      // Invoice total is $1,000.00.
      // Simultaneously dispatch 3 requests of $400.00 each ($1,200 total attempted).
      // Under proper row locking:
      // Request 1: succeeds ($400 paid, $600 due)
      // Request 2: succeeds ($800 paid, $200 due)
      // Request 3: attempts $400 against $200 remaining due -> MUST BE REJECTED with 400!
      const requests = [
        request(app)
          .post(`/api/invoices/${invoiceAId}/payments`)
          .set('Authorization', `Bearer ${userTokenA}`)
          .send({ amount: 400, paymentDate: '2026-10-16', paymentMethod: 'BANK_TRANSFER' }),
        request(app)
          .post(`/api/invoices/${invoiceAId}/payments`)
          .set('Authorization', `Bearer ${userTokenA}`)
          .send({ amount: 400, paymentDate: '2026-10-16', paymentMethod: 'BANK_TRANSFER' }),
        request(app)
          .post(`/api/invoices/${invoiceAId}/payments`)
          .set('Authorization', `Bearer ${userTokenA}`)
          .send({ amount: 400, paymentDate: '2026-10-16', paymentMethod: 'BANK_TRANSFER' }),
      ];

      const responses = await Promise.all(requests);

      const successful = responses.filter((r) => r.status === 201);
      const rejected = responses.filter((r) => r.status === 400);

      // Exactly 2 requests must succeed and 1 must be rejected
      expect(successful.length).toBe(2);
      expect(rejected.length).toBe(1);
      expect(rejected[0].body.error.message).toContain('exceeds remaining balance');

      // Verify the final database state is strictly 800 paid, 200 due
      const checkRes = await request(app)
        .get(`/api/invoices/${invoiceAId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(Number(checkRes.body.data.invoice.amount_paid)).toBe(800.0);
      expect(Number(checkRes.body.data.invoice.amount_due)).toBe(200.0);
      expect(checkRes.body.data.invoice.status).toBe('PARTIALLY_PAID');
      expect(checkRes.body.data.invoice.payments.length).toBe(2);
    });
  });

  describe('Dashboard Financial Metrics Aggregation', () => {
    it('should aggregate accurate financial totals excluding draft and void invoices', async () => {
      // Currently: invoiceAId has total $1,000.00.
      // Record a payment of $300.00.
      await request(app)
        .post(`/api/invoices/${invoiceAId}/payments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ amount: 300, paymentDate: '2026-10-16', paymentMethod: 'CASH' });

      // Fetch dashboard metrics
      const metricsRes = await request(app)
        .get('/api/invoices/metrics')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(metricsRes.status).toBe(200);
      const metrics = metricsRes.body.data;

      // draftInvoice ($200) must NOT be included in total_billed or total_outstanding
      expect(Number(metrics.total_billed)).toBe(1000.0);
      expect(Number(metrics.total_collected)).toBe(300.0);
      expect(Number(metrics.total_outstanding)).toBe(700.0);
      expect(Number(metrics.partially_paid_count)).toBe(1);
      expect(Number(metrics.draft_count)).toBe(1);
    });
  });
});
