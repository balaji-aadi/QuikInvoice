import { query } from '../config/db.js';

export class PaymentModel {
  /**
   * List all payments recorded for a specific invoice
   * @param {number} invoiceId
   */
  static async findByInvoiceId(invoiceId) {
    const sql = `
      SELECT 
        id,
        invoice_id,
        amount,
        payment_date,
        payment_method,
        reference,
        notes,
        created_at
      FROM invoice_payments
      WHERE invoice_id = ?
      ORDER BY payment_date ASC, id ASC
    `;
    const [rows] = await query(sql, [invoiceId]);
    return rows;
  }

  /**
   * Find single payment record by ID
   * @param {number} id
   */
  static async findById(id) {
    const sql = `
      SELECT 
        id,
        invoice_id,
        amount,
        payment_date,
        payment_method,
        reference,
        notes,
        created_at
      FROM invoice_payments
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Count number of payments attached to an invoice
   * @param {number} invoiceId
   */
  static async countByInvoiceId(invoiceId) {
    const sql = `SELECT COUNT(*) as count FROM invoice_payments WHERE invoice_id = ?`;
    const [rows] = await query(sql, [invoiceId]);
    return rows[0]?.count || 0;
  }
}

export default PaymentModel;
