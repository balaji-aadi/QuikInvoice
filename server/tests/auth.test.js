import request from 'supertest';
import app from '../src/app.js';
import { query } from '../src/config/db.js';
import './setup.js';

describe('QuikInvoice Phase 1 — Authentication & Security Test Suite', () => {
  const validUser = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'SuperSecretPassword123!',
    businessName: 'Analytical Engines Ltd',
    businessAddress: '123 Algorithm Way, London, UK',
    businessPhone: '+44 20 7946 0991',
  };

  describe('GET /api/health', () => {
    it('should return 200 OK and database health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database.connected).toBe(true);
      expect(res.body.database.database).toBe('quikinvoice_test');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user, return 201 Created, and set httpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.name).toBe(validUser.name);
      expect(res.body.data.user.business_name).toBe(validUser.businessName);
      expect(res.body.data.user.password_hash).toBeUndefined(); // Password hash must NEVER leak to client
      expect(res.body.data.token).toBeDefined();

      // Verify cookie properties
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
      expect(tokenCookie).toContain('SameSite=Lax');
    });

    it('should securely hash password with bcrypt and never store plaintext in database', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUser);

      const [rows] = await query('SELECT password_hash FROM users WHERE email = ?', [validUser.email]);
      expect(rows.length).toBe(1);
      expect(rows[0].password_hash).not.toBe(validUser.password);
      // Bcrypt hash signature check: starts with $2a$ or $2b$
      expect(rows[0].password_hash).toMatch(/^\$2[ab]\$12\$/);
    });

    it('should reject registration if email is already taken with 409 Conflict', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(validUser);

      // Duplicate registration attempt
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          name: 'Another User',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already exists/i);
    });

    it('should reject registration with malformed email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: 'not-an-email',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Seed user for login tests
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('should log in with valid credentials, return 200, and set token cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.password_hash).toBeUndefined();
      expect(res.body.data.token).toBeDefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
    });

    it('should return generic 401 Unauthorized for incorrect password without leaking hints', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('should return the exact same generic 401 Unauthorized for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@example.com',
          password: 'AnyPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me (Protected Route)', () => {
    let authToken;
    let cookieHeader;

    beforeEach(async () => {
      const regRes = await request(app).post('/api/auth/register').send(validUser);
      authToken = regRes.body.data.token;
      cookieHeader = regRes.headers['set-cookie'];
    });

    it('should reject access with 401 when no token or cookie is supplied', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Authentication required/i);
    });

    it('should reject access with 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.jwt.signature');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid authentication token/i);
    });

    it('should allow access and return profile when valid cookie is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookieHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.business_name).toBe(validUser.businessName);
    });

    it('should allow access and return profile when valid Bearer token header is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the token cookie on logout and subsequent access fails', async () => {
      // 1. Register & login
      const regRes = await request(app).post('/api/auth/register').send(validUser);
      const cookieHeader = regRes.headers['set-cookie'];

      // 2. Logout with active cookie and browser anti-CSRF header
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookieHeader)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify cleared cookie header
      const cookies = logoutRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      // Cleared cookies typically have expires=Thu, 01 Jan 1970 or Max-Age=0
      expect(tokenCookie).toMatch(/(expires=Thu, 01 Jan 1970|Max-Age=0)/i);
    });
  });

  describe('Malformed Payloads & Error Handling', () => {
    it('should return 400 Bad Request with code INVALID_JSON on malformed JSON body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "broken-json,');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_JSON');
    });

    it('should return 404 for undefined API routes', async () => {
      const res = await request(app).get('/api/nonexistent-route-xyz');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NotFoundError');
    });
  });
});
