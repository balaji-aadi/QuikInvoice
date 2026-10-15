import { query } from '../config/db.js';

export class UserModel {
  /**
   * Find user by email (includes password_hash for authentication verification)
   * @param {string} email
   */
  static async findByEmail(email) {
    const sql = `
      SELECT 
        id, 
        name, 
        email, 
        password_hash, 
        business_name, 
        business_address, 
        business_phone, 
        created_at, 
        updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await query(sql, [email.toLowerCase().trim()]);
    return rows[0] || null;
  }

  /**
   * Find user by ID (excludes password_hash for secure profile returns)
   * @param {number} id
   */
  static async findById(id) {
    const sql = `
      SELECT 
        id, 
        name, 
        email, 
        business_name, 
        business_address, 
        business_phone, 
        created_at, 
        updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Create a new user record
   */
  static async create({ name, email, passwordHash, businessName, businessAddress = null, businessPhone = null }) {
    const sql = `
      INSERT INTO users (
        name, 
        email, 
        password_hash, 
        business_name, 
        business_address, 
        business_phone
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await query(sql, [
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      businessName.trim(),
      businessAddress ? businessAddress.trim() : null,
      businessPhone ? businessPhone.trim() : null,
    ]);

    return this.findById(result.insertId);
  }
}

export default UserModel;
