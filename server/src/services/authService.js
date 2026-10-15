import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import UserModel from '../models/userModel.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Register a new user
   */
  static async register({ name, email, password, businessName, businessAddress, businessPhone }) {
    // 1. Check if user with this email already exists
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    // 2. Hash password with bcryptjs (12 salt rounds)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Persist new user record
    const user = await UserModel.create({
      name,
      email,
      passwordHash,
      businessName,
      businessAddress,
      businessPhone,
    });

    // 4. Generate JWT
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Authenticate user with email and password
   */
  static async login({ email, password }) {
    // 1. Fetch user by email
    const user = await UserModel.findByEmail(email);

    // 2. Generic authentication failure if user not found (prevents user enumeration)
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 3. Verify password hash using constant-time comparison
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 4. Remove password_hash from returned user object
    const { password_hash, ...sanitizedUser } = user;

    // 5. Generate JWT
    const token = this.generateToken(sanitizedUser);

    return { user: sanitizedUser, token };
  }

  /**
   * Retrieve user profile by user ID
   * @param {number} userId
   */
  static async getUserProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return user;
  }

  /**
   * Generate signed JSON Web Token
   * @param {{ id: number, email: string }} user
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  /**
   * Verify and decode a JWT string
   * @param {string} token
   */
  static verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
  }
}

export default AuthService;
