import { Router } from 'express';
import AuthController from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../validations/authValidation.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Public Authentication Endpoints (Rate-limited & Schema-validated)
router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);

// Protected Authentication Endpoints
router.get('/me', requireAuth, AuthController.getMe);
router.post('/logout', requireAuth, AuthController.logout);

export default router;
