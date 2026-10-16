import request from 'supertest';
import app from '../src/app.js';
import './setup.js';

describe('QuikInvoice Phase 2 — Client Management Integration Tests', () => {
  let userTokenA;
  let userTokenB;
  let userAId;
  let userBId;

  const userA = {
    name: 'Alice Archer',
    email: 'alice@example.com',
    password: 'Password123!',
    businessName: 'Archer Tech Solutions',
  };

  const userB = {
    name: 'Bob Builder',
    email: 'bob@example.com',
    password: 'Password123!',
    businessName: 'Bob Contracting',
  };

  beforeEach(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send(userA);
    userTokenA = resA.body.data.token;
    userAId = resA.body.data.user.id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send(userB);
    userTokenB = resB.body.data.token;
    userBId = resB.body.data.user.id;
  });

  describe('Authentication & Authorization', () => {
    it('should reject unauthenticated requests to /api/clients with 401', async () => {
      const res = await request(app).get('/api/clients');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/clients (Create Client)', () => {
    it('should create a new client and return 201 Created', async () => {
      const newClient = {
        name: 'Acme Corporation',
        email: 'billing@acme.com',
        phone: '+1-555-0199',
        address: '100 Acme Way, Silicon Valley, CA',
      };

      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send(newClient);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.client).toBeDefined();
      expect(res.body.data.client.id).toBeDefined();
      expect(res.body.data.client.name).toBe(newClient.name);
      expect(res.body.data.client.email).toBe(newClient.email);
      expect(res.body.data.client.phone).toBe(newClient.phone);
      expect(res.body.data.client.address).toBe(newClient.address);
      expect(res.body.data.client.user_id).toBe(userAId);
    });

    it('should reject client creation when required fields are missing or invalid', async () => {
      const invalidClient = {
        name: '',
        email: 'not-an-email',
      };

      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send(invalidClient);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/clients (List Clients, Search & Pagination)', () => {
    beforeEach(async () => {
      // Seed 3 clients for User A
      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ name: 'Alpha Logistics', email: 'alpha@logistics.com' });

      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ name: 'Beta Health', email: 'beta@health.org' });

      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ name: 'Alpha Technologies', email: 'contact@alphatech.io' });

      // Seed 1 client for User B
      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({ name: 'Gamma Enterprises', email: 'gamma@corp.com' });
    });

    it('should list only clients belonging to the authenticated tenant', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.pagination.total).toBe(3);
      res.body.data.forEach((c) => {
        expect(c.user_id).toBe(userAId);
      });
    });

    it('should filter clients by search keyword across name and email', async () => {
      const res = await request(app)
        .get('/api/clients?search=Alpha')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every((c) => c.name.includes('Alpha'))).toBe(true);
    });

    it('should respect pagination parameters (page and limit)', async () => {
      const res = await request(app)
        .get('/api/clients?page=1&limit=2')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.totalPages).toBe(2);
    });
  });

  describe('Multi-Tenant Isolation & CRUD Operations', () => {
    let clientAId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ name: 'Tenant A Client', email: 'clientA@test.com' });
      clientAId = res.body.data.client.id;
    });

    it('User B cannot retrieve User A client by ID (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/clients/${clientAId}`)
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User B cannot update User A client (returns 404)', async () => {
      const res = await request(app)
        .put(`/api/clients/${clientAId}`)
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(404);
    });

    it('User B cannot delete User A client (returns 404)', async () => {
      const res = await request(app)
        .delete(`/api/clients/${clientAId}`)
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(404);
    });

    it('User A can successfully update their own client', async () => {
      const res = await request(app)
        .put(`/api/clients/${clientAId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Updated Client Name',
          phone: '+1-555-9999',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.client.name).toBe('Updated Client Name');
      expect(res.body.data.client.phone).toBe('+1-555-9999');
    });

    it('User A can delete their client when no invoices are attached', async () => {
      const res = await request(app)
        .delete(`/api/clients/${clientAId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await request(app)
        .get(`/api/clients/${clientAId}`)
        .set('Authorization', `Bearer ${userTokenA}`);
      expect(check.status).toBe(404);
    });

    it('should reject client deletion with 409 Conflict if invoices exist referencing the client', async () => {
      // Create an invoice referencing clientAId
      const invoiceRes = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          clientId: clientAId,
          invoiceNumber: 'INV-REF-001',
          issueDate: '2026-10-16',
          dueDate: '2026-11-16',
          items: [
            { description: 'Consulting', quantity: 10, unitPrice: 150, taxRate: 10 },
          ],
        });
      expect(invoiceRes.status).toBe(201);

      // Attempt deletion
      const deleteRes = await request(app)
        .delete(`/api/clients/${clientAId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(deleteRes.status).toBe(409);
      expect(deleteRes.body.success).toBe(false);
      expect(deleteRes.body.error.code).toBe('ConflictError');
    });
  });
});
