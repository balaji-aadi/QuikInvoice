import AuthService from '../services/authService.js';
import UserModel from '../models/userModel.js';
import env from '../config/env.js';

// Cookie options for secure JWT storage
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

export class AuthController {
  /**
   * Handle user registration
   */
  static async register(req, res, next) {
    try {
      const { user, token } = await AuthService.register(req.body);

      // Set JWT in httpOnly cookie
      res.cookie('token', token, COOKIE_OPTIONS);

      const responseData = { user };
      // Only include token in JSON response for test suites or programmatic API clients
      if (env.NODE_ENV === 'test' || req.headers['x-api-client']) {
        responseData.token = token;
      }

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle user login
   */
  static async login(req, res, next) {
    try {
      const { user, token } = await AuthService.login(req.body);

      // Set JWT in httpOnly cookie
      res.cookie('token', token, COOKIE_OPTIONS);

      const responseData = { user };
      // Only include token in JSON response for test suites or programmatic API clients
      if (env.NODE_ENV === 'test' || req.headers['x-api-client']) {
        responseData.token = token;
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get authenticated user profile
   */
  static async getMe(req, res, next) {
    try {
      return res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invalidate session, revoke server-side token version, and clear cookie
   */
  static async logout(req, res, next) {
    try {
      // 1. Increment token_version in MySQL to invalidate all active JWTs for this user
      if (req.user && req.user.id) {
        await UserModel.incrementTokenVersion(req.user.id);
      }

      // 2. Clear httpOnly session cookie
      res.clearCookie('token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
