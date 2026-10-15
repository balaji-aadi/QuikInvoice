import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 10, // Relaxed during testing
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    error: {
      message: 'Too many login attempts from this IP, please try again after 15 minutes',
      code: 'TOO_MANY_REQUESTS',
    },
  },
  skip: (req) => env.NODE_ENV === 'test', // Skip rate limiting during automated test suite execution
});

export default {
  authLimiter,
};
