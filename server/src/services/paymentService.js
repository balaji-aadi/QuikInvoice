import { pool } from '../config/db.js';
import PaymentModel from '../models/paymentModel.js';
import { toCents, fromCents, validatePaymentAmount } from '../utils/money.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export class PaymentService {
  /**
   * Record a payment against an invoice with transactional concurrency row locking (SELECT ... FOR UPDATE)
   * 
   * CONCURRENCY & ISOLATION STRATEGY:
   * 1. A dedicated connection is acquired from the pool to execute an atomic transaction.
   * 2. `SELECT * FROM invoices WHERE id = ? AND user_id = ? FOR UPDATE` acquires an exclusive row lock.
   *    Any concurrent request attempting to record a payment on the same invoice blocks until this transaction
   *    commits or rolls back.
   * 3. The true accumulated payments are re-calculated inside the lock from `invoice_payments` records using
   *    `FOR UPDATE` to guarantee that concurrent inserts cannot bypass balance checks.
   * 4. Overpayments are strictly rejected using integer-cent arithmetic.
   * 5. The payment record is inserted, the invoice's `amount_paid` and `amount_due` are synchronized,
   *    and the status transitions atomically to 'PARTIALLY_PAID' or 'PAID'.
   * 6. Transaction commits. If any step fails, transaction completely rolls back.
   * 
   * @param {number} userId - Tenant ID
   * @param {number} invoiceId - Invoice ID
   * @param {Object} paymentData
   * @param {number} paymentData.amount
   * @param {string} paymentData.paymentDate
   * @param {string} paymentData.paymentMethod
   * @param {string} [paymentData.reference]
   * @param {string} [paymentData.notes]
   */
  static async recordPayment(userId, invoiceId, paymentData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Lock invoice row exclusively for this tenant
      const [invoiceRows] = await connection.query(
        'SELECT * FROM invoices WHERE id = ? AND user_id = ? FOR UPDATE',
        [invoiceId, userId]
      );

      if (invoiceRows.length === 0) {
        throw new NotFoundError(`Invoice #${invoiceId} not found`);
      }

      const invoice = invoiceRows[0];

      // 2. State Machine Status Enforcement
      if (invoice.status === 'DRAFT') {
        throw new BadRequestError(
          'Cannot record payment against a DRAFT invoice. Please finalize and issue the invoice first.'
        );
      }

      if (invoice.status === 'VOID') {
        throw new BadRequestError('Cannot record payment against a VOID invoice.');
      }

      if (invoice.status === 'PAID' || Number(invoice.amount_due) <= 0) {
        throw new BadRequestError('Invoice is already fully paid.');
      }

      // 3. Authoritatively lock & calculate persisted payments
      const [paySumRows] = await connection.query(
        'SELECT COALESCE(SUM(amount), 0) as total_paid FROM invoice_payments WHERE invoice_id = ? FOR UPDATE',
        [invoiceId]
      );

      const totalPaidCents = toCents(paySumRows[0].total_paid);
      const totalAmountCents = toCents(invoice.total_amount);
      const currentRemainingDueCents = Math.max(0, totalAmountCents - totalPaidCents);

      // 4. Validate payment amount against remaining balance
      const validation = validatePaymentAmount(paymentData.amount, fromCents(currentRemainingDueCents));
      if (!validation.valid) {
        throw new BadRequestError(validation.error);
      }

      const paymentCents = validation.paymentCents;
      const paymentAmountFormatted = fromCents(paymentCents).toFixed(2);

      // 5. Insert payment record
      const [insertRes] = await connection.query(
        `INSERT INTO invoice_payments (invoice_id, amount, payment_date, payment_method, reference, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          paymentAmountFormatted,
          paymentData.paymentDate,
          paymentData.paymentMethod,
          paymentData.reference ? paymentData.reference.trim() : null,
          paymentData.notes ? paymentData.notes.trim() : null,
        ]
      );

      // 6. Calculate new balances and updated status
      const newPaidCents = totalPaidCents + paymentCents;
      const newDueCents = Math.max(0, totalAmountCents - newPaidCents);
      const newStatus = newDueCents === 0 ? 'PAID' : 'PARTIALLY_PAID';

      await connection.query(
        `UPDATE invoices 
         SET amount_paid = ?, amount_due = ?, status = ?
         WHERE id = ? AND user_id = ?`,
        [
          fromCents(newPaidCents).toFixed(2),
          fromCents(newDueCents).toFixed(2),
          newStatus,
          invoiceId,
          userId,
        ]
      );

      // 7. Atomic Commit
      await connection.commit();

      const createdPayment = await PaymentModel.findById(insertRes.insertId);

      return {
        payment: createdPayment,
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          status: newStatus,
          total_amount: Number(invoice.total_amount),
          amount_paid: fromCents(newPaidCents),
          amount_due: fromCents(newDueCents),
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Retrieve all payments for an invoice with ownership verification
   * @param {number} userId - Tenant ID
   * @param {number} invoiceId - Invoice ID
   */
  static async getInvoicePayments(userId, invoiceId) {
    // 1. Verify invoice belongs to this tenant
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT id, invoice_number, total_amount, amount_paid, amount_due, status FROM invoices WHERE id = ? AND user_id = ?',
        [invoiceId, userId]
      );

      if (rows.length === 0) {
        throw new NotFoundError(`Invoice #${invoiceId} not found`);
      }

      const invoice = rows[0];
      const payments = await PaymentModel.findByInvoiceId(invoiceId);

      return {
        invoice,
        payments,
      };
    } finally {
      connection.release();
    }
  }
}

export default PaymentService;
