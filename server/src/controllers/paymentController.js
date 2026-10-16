import PaymentService from '../services/paymentService.js';

export class PaymentController {
  /**
   * Record a payment against an invoice
   */
  static async recordPayment(req, res, next) {
    try {
      const invoiceId = parseInt(req.params.id, 10);
      const result = await PaymentService.recordPayment(req.user.id, invoiceId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve payment history for an invoice
   */
  static async getInvoicePayments(req, res, next) {
    try {
      const invoiceId = parseInt(req.params.id, 10);
      const result = await PaymentService.getInvoicePayments(req.user.id, invoiceId);
      return res.status(200).json({
        success: true,
        data: result.payments,
        invoice: result.invoice,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default PaymentController;
