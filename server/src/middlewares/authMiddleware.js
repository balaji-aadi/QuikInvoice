import AuthService from '../services/authService.js';
import UserModel from '../models/userModel.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Authentication Middleware:
 * Verifies JWT token from httpOnly cookie or Authorization Bearer header.
 * Attaches authenticated user entity to `req.user`.
 */
export async function requireAuth(req, res, next) {
  try {
    let token = null;

    // 1. Check httpOnly cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fall back to Authorization Bearer header (supports API testing and clients)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please log in.');
    }

    // 3. Verify cryptographic token signature
    let decoded;
    try {
      decoded = AuthService.verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Authentication session has expired. Please log in again.');
      }
      throw new UnauthorizedError('Invalid authentication token');
    }

    // 4. Verify user still exists in database
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError('User account associated with this token no longer exists');
    }

    // 5. Attach user object to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export default requireAuth;
