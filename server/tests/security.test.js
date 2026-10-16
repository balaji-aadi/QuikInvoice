import request from 'supertest';
import app from '../src/app.js';
import { query } from '../src/config/db.js';
import UserModel from '../src/models/userModel.js';
import AuthService from '../src/services/authService.js';
import './setup.js';

describe('QuikInvoice Phase 1 — Security & Regression Test Suite', () => {
  const userA = {
    name: 'Alice Security',
    email: 'alice@security.com',
    password: 'Password123!',
    businessName: 'Alice Cyber Sec',
  };

  const userB = {
    name: 'Bob Defense',
    email: 'bob@defense.com',
    password: 'Password123!',
    businessName: 'Bob Defense Corp',
  };

  describe('1. Connectivity & Environment Configuration', () => {
    it('should respond with 200 OK on /api/health and report healthy test database', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database.connected).toBe(true);
      expect(res.body.database.database).toBe('quikinvoice_test');
    });
  });

  describe('2. CORS and CSRF Protection Strategy', () => {
    it('should allow requests from the approved origin (http://localhost:5173)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:5173')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(userA);

      expect(res.status).toBe(201);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should actively reject state-changing requests from unapproved origins with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://evil-attacker-site.com')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          name: 'Attacker',
          email: 'attacker@evil.com',
          password: 'Password123!',
          businessName: 'Evil Org',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Untrusted origin/i);

      // Verify state was NOT modified: user must NOT exist in database
      const user = await UserModel.findByEmail('attacker@evil.com');
      expect(user).toBeNull();
    });

    it('should reject state-changing requests with an unapproved Referer header', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Referer', 'http://phishing-site.com/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          name: 'Phished User',
          email: 'phished@victim.com',
          password: 'Password123!',
          businessName: 'Phished Inc',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Untrusted referer/i);
    });

    it('should reject cookie-authenticated state-changing requests missing X-Requested-With', async () => {
      // 1. Legitimate registration
      const regRes = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:5173')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(userA);

      const cookie = regRes.headers['set-cookie'];

      // 2. Simulated cross-site form POST without X-Requested-With
      const csrfAttackRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie);
        // Note: No X-Requested-With header attached!

      expect(csrfAttackRes.status).toBe(403);
      expect(csrfAttackRes.body.success).toBe(false);
      expect(csrfAttackRes.body.error.message).toMatch(/X-Requested-With/i);
    });

    it('should allow valid browser requests with Origin and X-Requested-With', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:5173')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(userA);

      const cookie = regRes.headers['set-cookie'];

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Origin', 'http://localhost:5173')
        .set('Cookie', cookie)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    });
  });

  describe('3. JWT Server-Side Revocation via token_version', () => {
    it('should reject an unexpired JWT via Bearer header once user logs out', async () => {
      // 1. Register user
      const regRes = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:5173')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(userA);

      const token = regRes.body.data.token;
      const cookie = regRes.headers['set-cookie'];

      // 2. Verify token works prior to logout
      const beforeLogout = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(beforeLogout.status).toBe(200);

      // 3. User calls logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Origin', 'http://localhost:5173')
        .set('Cookie', cookie)
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(logoutRes.status).toBe(200);

      // 4. Attempt to reuse the previously issued Bearer token
      const afterLogout = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      // Crucial: Must be rejected because token_version was incremented on server!
      expect(afterLogout.status).toBe(401);
      expect(afterLogout.body.success).toBe(false);
      expect(afterLogout.body.error.message).toMatch(/revoked/i);
    });

    it('should reject cookie authentication if token_version is stale', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:5173')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(userA);

      const cookie = regRes.headers['set-cookie'];
      const registeredUser = regRes.body.data.user;

      // Manually increment token_version in MySQL (simulating logout from another tab/device)
      await UserModel.incrementTokenVersion(registeredUser.id);

      // Subsequent access with old cookie must fail
      const staleRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(staleRes.status).toBe(401);
      expect(staleRes.body.error.message).toMatch(/revoked/i);
    });

    it('revoking tokens for User A should not affect User B sessions', async () => {
      // Register User A
      const regA = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:5173')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(userA);
      const tokenA = regA.body.data.token;
      const cookieA = regA.headers['set-cookie'];

      // Register User B
      const regB = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:5173')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(userB);
      const tokenB = regB.body.data.token;

      // User A logs out
      await request(app)
        .post('/api/auth/logout')
        .set('Origin', 'http://localhost:5173')
        .set('Cookie', cookieA)
        .set('X-Requested-With', 'XMLHttpRequest');

      // User A token is rejected
      const resA = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resA.status).toBe(401);

      // User B token remains completely valid
      const resB = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(resB.status).toBe(200);
      expect(resB.body.data.user.email).toBe(userB.email);
    });

    it('should reject malformed or tampered tokens', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature');

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/Invalid authentication token/i);
    });

    it('should confirm existing users default to token_version 1 and can authenticate', async () => {
      // Insert legacy user directly without explicit token_version
      const [result] = await query(
        `INSERT INTO users (name, email, password_hash, business_name) VALUES (?, ?, ?, ?)`,
        ['Legacy User', 'legacy@example.com', '$2b$12$eXampleHashPlaceHolderForTestOnly...', 'Legacy Corp']
      );

      const legacyUser = await UserModel.findById(result.insertId);
      expect(legacyUser.token_version).toBe(1);

      // Generate token with tokenVersion: 1
      const token = AuthService.generateToken(legacyUser);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('legacy@example.com');
    });
  });
});
