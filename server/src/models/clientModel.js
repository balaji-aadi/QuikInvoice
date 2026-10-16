import { query } from '../config/db.js';

export class ClientModel {
  /**
   * Find all clients for a specific tenant with optional search & pagination
   * @param {number} userId - Tenant ID
   * @param {{ search?: string, page?: number, limit?: number }} options
   */
  static async findAll(userId, { search = '', page = 1, limit = 20 } = {}) {
    const offset = (Math.max(1, page) - 1) * limit;
    const params = [userId];
    let whereClause = 'WHERE user_id = ?';

    if (search && search.trim()) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    // 1. Get total count
    const countSql = `SELECT COUNT(*) as total FROM clients ${whereClause}`;
    const [countRows] = await query(countSql, params);
    const total = countRows[0]?.total || 0;

    // 2. Get paginated rows
    const dataSql = `
      SELECT 
        c.id, 
        c.user_id, 
        c.name, 
        c.email, 
        c.phone, 
        c.address, 
        c.created_at, 
        c.updated_at,
        (SELECT COUNT(*) FROM invoices WHERE client_id = c.id AND user_id = c.user_id) as invoice_count
      FROM clients c
      ${whereClause}
      ORDER BY c.name ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await query(dataSql, [...params, Number(limit), Number(offset)]);

    return {
      clients: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Find client by ID with strict tenant isolation
   * @param {number} id - Client ID
   * @param {number} userId - Tenant ID
   */
  static async findById(id, userId) {
    const sql = `
      SELECT 
        c.id, 
        c.user_id, 
        c.name, 
        c.email, 
        c.phone, 
        c.address, 
        c.created_at, 
        c.updated_at,
        (SELECT COUNT(*) FROM invoices WHERE client_id = c.id AND user_id = c.user_id) as invoice_count
      FROM clients c
      WHERE c.id = ? AND c.user_id = ?
      LIMIT 1
    `;
    const [rows] = await query(sql, [id, userId]);
    return rows[0] || null;
  }

  /**
   * Create new client record
   */
  static async create(userId, { name, email, phone = null, address = null }) {
    const sql = `
      INSERT INTO clients (user_id, name, email, phone, address)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await query(sql, [
      userId,
      name.trim(),
      email.toLowerCase().trim(),
      phone ? phone.trim() : null,
      address ? address.trim() : null,
    ]);

    return this.findById(result.insertId, userId);
  }

  /**
   * Update client details with strict tenant isolation
   */
  static async update(id, userId, { name, email, phone, address }) {
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email.toLowerCase().trim());
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone ? phone.trim() : null);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address ? address.trim() : null);
    }

    if (updates.length === 0) {
      return this.findById(id, userId);
    }

    params.push(id, userId);
    const sql = `UPDATE clients SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    await query(sql, params);

    return this.findById(id, userId);
  }

  /**
   * Delete client with strict tenant isolation
   */
  static async delete(id, userId) {
    const sql = `DELETE FROM clients WHERE id = ? AND user_id = ?`;
    const [result] = await query(sql, [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Count invoices associated with this client
   */
  static async countInvoices(clientId, userId) {
    const sql = `SELECT COUNT(*) as count FROM invoices WHERE client_id = ? AND user_id = ?`;
    const [rows] = await query(sql, [clientId, userId]);
    return rows[0]?.count || 0;
  }
}

export default ClientModel;
