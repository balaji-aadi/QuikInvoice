import AuthService from '../services/authService.js';
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

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token, // Included for API testing & Bearer client support
        },
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

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token, // Included for API testing & Bearer client support
        },
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
   * Invalidate session and clear cookie
   */
  static async logout(req, res, next) {
    try {
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
