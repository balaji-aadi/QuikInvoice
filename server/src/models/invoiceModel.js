import { query, withTransaction } from '../config/db.js';

export class InvoiceModel {
  /**
   * Find paginated invoices for a tenant with optional filters
   * @param {number} userId - Tenant ID
   * @param {Object} filters
   */
  static async findAll(userId, { status, clientId, search = '', page = 1, limit = 20 } = {}) {
    const offset = (Math.max(1, page) - 1) * limit;
    const params = [userId];
    let whereClause = 'WHERE i.user_id = ?';

    if (status) {
      if (status === 'OVERDUE') {
        // Overdue is derived from calendar date and unpaid balance
        whereClause += " AND i.due_date < CURRENT_DATE() AND i.amount_due > 0 AND i.status NOT IN ('DRAFT', 'PAID', 'VOID')";
      } else {
        whereClause += ' AND i.status = ?';
        params.push(status);
      }
    }

    if (clientId) {
      whereClause += ' AND i.client_id = ?';
      params.push(clientId);
    }

    if (search && search.trim()) {
      whereClause += ' AND (i.invoice_number LIKE ? OR c.name LIKE ? OR c.email LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    // 1. Total count query
    const countSql = `
      SELECT COUNT(*) as total 
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      ${whereClause}
    `;
    const [countRows] = await query(countSql, params);
    const total = countRows[0]?.total || 0;

    // 2. Data rows query with dynamic is_overdue derivation
    const dataSql = `
      SELECT 
        i.id,
        i.user_id,
        i.client_id,
        i.invoice_number,
        i.status,
        i.issue_date,
        i.due_date,
        i.subtotal,
        i.tax_total,
        i.total_amount,
        i.amount_paid,
        i.amount_due,
        i.notes,
        i.created_at,
        i.updated_at,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        CASE 
          WHEN i.due_date < CURRENT_DATE() AND i.amount_due > 0 AND i.status NOT IN ('DRAFT', 'PAID', 'VOID') 
          THEN 1 ELSE 0 
        END as is_overdue
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await query(dataSql, [...params, Number(limit), Number(offset)]);

    return {
      invoices: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Find single invoice by ID with client details, line items, and payment history
   * @param {number} id - Invoice ID
   * @param {number} userId - Tenant ID
   */
  static async findById(id, userId) {
    const invoiceSql = `
      SELECT 
        i.id,
        i.user_id,
        i.client_id,
        i.invoice_number,
        i.status,
        i.issue_date,
        i.due_date,
        i.subtotal,
        i.tax_total,
        i.total_amount,
        i.amount_paid,
        i.amount_due,
        i.notes,
        i.created_at,
        i.updated_at,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        c.address as client_address,
        u.business_name,
        u.business_address,
        u.business_phone,
        u.email as user_email,
        CASE 
          WHEN i.due_date < CURRENT_DATE() AND i.amount_due > 0 AND i.status NOT IN ('DRAFT', 'PAID', 'VOID') 
          THEN 1 ELSE 0 
        END as is_overdue
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      JOIN users u ON i.user_id = u.id
      WHERE i.id = ? AND i.user_id = ?
      LIMIT 1
    `;
    const [invoiceRows] = await query(invoiceSql, [id, userId]);
    if (!invoiceRows.length) {
      return null;
    }

    const invoice = invoiceRows[0];

    // Fetch line items
    const itemsSql = `
      SELECT 
        id,
        invoice_id,
        description,
        quantity,
        unit_price,
        tax_rate,
        line_subtotal,
        line_tax,
        line_total,
        created_at
      FROM invoice_items
      WHERE invoice_id = ?
      ORDER BY id ASC
    `;
    const [itemRows] = await query(itemsSql, [id]);
    invoice.items = itemRows;

    // Fetch payments history
    const paymentsSql = `
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
    const [paymentRows] = await query(paymentsSql, [id]);
    invoice.payments = paymentRows;

    return invoice;
  }

  /**
   * Check if invoice number is already taken by this tenant
   */
  static async findByNumber(userId, invoiceNumber) {
    const sql = `
      SELECT id, invoice_number 
      FROM invoices 
      WHERE user_id = ? AND invoice_number = ? 
      LIMIT 1
    `;
    const [rows] = await query(sql, [userId, invoiceNumber.trim()]);
    return rows[0] || null;
  }

  /**
   * Create invoice and line items atomically inside a MySQL transaction
   */
  static async create(userId, invoiceData, processedItems) {
    return withTransaction(async (conn) => {
      // 1. Insert invoice header
      const invoiceSql = `
        INSERT INTO invoices (
          user_id, client_id, invoice_number, status, 
          issue_date, due_date, subtotal, tax_total, 
          total_amount, amount_paid, amount_due, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [invoiceResult] = await conn.query(invoiceSql, [
        userId,
        invoiceData.clientId,
        invoiceData.invoiceNumber.trim(),
        invoiceData.status || 'DRAFT',
        invoiceData.issueDate,
        invoiceData.dueDate,
        invoiceData.subtotal,
        invoiceData.taxTotal,
        invoiceData.totalAmount,
        invoiceData.amountPaid || 0.0,
        invoiceData.amountDue,
        invoiceData.notes || null,
      ]);

      const invoiceId = invoiceResult.insertId;

      // 2. Insert line items
      const itemSql = `
        INSERT INTO invoice_items (
          invoice_id, description, quantity, unit_price, 
          tax_rate, line_subtotal, line_tax, line_total
        ) VALUES ?
      `;
      const itemValues = processedItems.map((item) => [
        invoiceId,
        item.description,
        item.quantity,
        item.unitPrice,
        item.taxRate,
        item.lineSubtotal,
        item.lineTax,
        item.lineTotal,
      ]);

      await conn.query(itemSql, [itemValues]);

      return invoiceId;
    });
  }

  /**
   * Update invoice header and line items atomically
   */
  static async update(id, userId, invoiceData, processedItems) {
    return withTransaction(async (conn) => {
      // 1. Update invoice header
      const updateSql = `
        UPDATE invoices SET
          client_id = ?,
          invoice_number = ?,
          issue_date = ?,
          due_date = ?,
          subtotal = ?,
          tax_total = ?,
          total_amount = ?,
          amount_due = ?,
          notes = ?
        WHERE id = ? AND user_id = ?
      `;
      await conn.query(updateSql, [
        invoiceData.clientId,
        invoiceData.invoiceNumber.trim(),
        invoiceData.issueDate,
        invoiceData.dueDate,
        invoiceData.subtotal,
        invoiceData.taxTotal,
        invoiceData.totalAmount,
        invoiceData.amountDue,
        invoiceData.notes || null,
        id,
        userId,
      ]);

      // 2. Delete existing line items
      await conn.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);

      // 3. Re-insert updated line items
      const itemSql = `
        INSERT INTO invoice_items (
          invoice_id, description, quantity, unit_price, 
          tax_rate, line_subtotal, line_tax, line_total
        ) VALUES ?
      `;
      const itemValues = processedItems.map((item) => [
        id,
        item.description,
        item.quantity,
        item.unitPrice,
        item.taxRate,
        item.lineSubtotal,
        item.lineTax,
        item.lineTotal,
      ]);

      await conn.query(itemSql, [itemValues]);

      return id;
    });
  }

  /**
   * Update invoice status
   */
  static async updateStatus(id, userId, status) {
    const sql = `UPDATE invoices SET status = ? WHERE id = ? AND user_id = ?`;
    await query(sql, [status, id, userId]);
    return this.findById(id, userId);
  }

  /**
   * Delete invoice (cascades to items)
   */
  static async delete(id, userId) {
    const sql = `DELETE FROM invoices WHERE id = ? AND user_id = ?`;
    const [result] = await query(sql, [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Calculate aggregated financial metrics for tenant dashboard
   * @param {number} userId - Tenant ID
   */
  static async getDashboardMetrics(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(CASE WHEN status NOT IN ('DRAFT', 'VOID') THEN total_amount ELSE 0 END), 0) as total_billed,
        COALESCE(SUM(CASE WHEN status NOT IN ('DRAFT', 'VOID') THEN amount_paid ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN status NOT IN ('DRAFT', 'VOID') THEN amount_due ELSE 0 END), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END), 0) as draft_count,
        COALESCE(SUM(CASE WHEN status = 'ISSUED' THEN 1 ELSE 0 END), 0) as issued_count,
        COALESCE(SUM(CASE WHEN status = 'PARTIALLY_PAID' THEN 1 ELSE 0 END), 0) as partially_paid_count,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0) as paid_count,
        COALESCE(SUM(CASE WHEN status = 'VOID' THEN 1 ELSE 0 END), 0) as void_count,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE() AND amount_due > 0 AND status NOT IN ('DRAFT', 'PAID', 'VOID') THEN 1 ELSE 0 END), 0) as overdue_count,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE() AND amount_due > 0 AND status NOT IN ('DRAFT', 'PAID', 'VOID') THEN amount_due ELSE 0 END), 0) as overdue_amount
      FROM invoices
      WHERE user_id = ?
    `;
    const [rows] = await query(sql, [userId]);
    return rows[0];
  }
}

export default InvoiceModel;
