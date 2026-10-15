import env from '../config/env.js';
import { ForbiddenError } from '../utils/errors.js';

/**
 * Normalizes an origin string (removes trailing slash)
 */
function normalizeOrigin(origin) {
  if (!origin) return '';
  return origin.trim().replace(/\/+$/, '');
}

/**
 * List of allowed origins for browser communication
 */
const ALLOWED_ORIGINS = new Set([
  normalizeOrigin(env.CORS_ORIGIN),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5001',
]);

/**
 * CSRF and Origin Enforcement Middleware:
 * Protects state-changing endpoints (POST, PUT, PATCH, DELETE) against Cross-Site Request Forgery.
 */
export function csrfProtection(req, res, next) {
  const method = req.method.toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  // Safe read-only HTTP methods (GET, HEAD, OPTIONS) do not require CSRF guards
  if (!isStateChanging) {
    return next();
  }

  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;

  // 1. Origin Header Validation (if present)
  if (originHeader) {
    const normalizedOrigin = normalizeOrigin(originHeader);
    if (!ALLOWED_ORIGINS.has(normalizedOrigin)) {
      return next(new ForbiddenError(`CSRF / Origin denied: Untrusted origin '${originHeader}'`));
    }
  }
  // 2. Fallback Referer Validation (if Origin is absent)
  else if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader);
      const refererOrigin = normalizeOrigin(refererUrl.origin);
      if (!ALLOWED_ORIGINS.has(refererOrigin)) {
        return next(new ForbiddenError(`CSRF / Referer denied: Untrusted referer '${refererHeader}'`));
      }
    } catch (err) {
      return next(new ForbiddenError('CSRF / Referer denied: Malformed Referer header'));
    }
  }

  // 3. Cookie-Authenticated Browser Request Validation:
  // If the request carries an authentication cookie, it originates from a browser.
  // Enforce custom header 'X-Requested-With: XMLHttpRequest'.
  // Standard HTML cross-origin form submissions cannot attach custom headers.
  const hasAuthCookie = Boolean(req.cookies && req.cookies.token);
  const isBearerRequest = Boolean(req.headers.authorization && req.headers.authorization.startsWith('Bearer '));

  if (hasAuthCookie && !isBearerRequest) {
    const xRequestedWith = req.headers['x-requested-with'];
    if (xRequestedWith !== 'XMLHttpRequest') {
      return next(
        new ForbiddenError(
          'CSRF protection: State-changing browser requests must include X-Requested-With header'
        )
      );
    }
  }

  // 4. Missing Origin & Referer policy for Cookie-Authenticated Requests:
  // If a cookie-authenticated request has neither Origin nor Referer, it must present X-Requested-With
  if (!originHeader && !refererHeader && hasAuthCookie && !isBearerRequest) {
    const xRequestedWith = req.headers['x-requested-with'];
    if (xRequestedWith !== 'XMLHttpRequest') {
      return next(
        new ForbiddenError(
          'CSRF protection: Missing Origin/Referer on cookie-authenticated request'
        )
      );
    }
  }

  next();
}

export default csrfProtection;
