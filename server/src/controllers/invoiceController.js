import InvoiceService from '../services/invoiceService.js';
import PdfService from '../services/pdfService.js';

export class InvoiceController {
  /**
   * Get dashboard aggregated financial metrics
   */
  static async getDashboardMetrics(req, res, next) {
    try {
      const raw = await InvoiceService.getDashboardMetrics(req.user.id);
      const metrics = {
        total_invoices: Number(raw?.total_invoices) || 0,
        total_billed: Number(raw?.total_billed) || 0,
        total_collected: Number(raw?.total_collected) || 0,
        total_outstanding: Number(raw?.total_outstanding) || 0,
        draft_count: Number(raw?.draft_count) || 0,
        issued_count: Number(raw?.issued_count) || 0,
        partially_paid_count: Number(raw?.partially_paid_count) || 0,
        paid_count: Number(raw?.paid_count) || 0,
        void_count: Number(raw?.void_count) || 0,
        overdue_count: Number(raw?.overdue_count) || 0,
        overdue_amount: Number(raw?.overdue_amount) || 0,
        // camelCase aliases for frontend
        totalInvoices: Number(raw?.total_invoices) || 0,
        totalBilled: Number(raw?.total_billed) || 0,
        totalCollected: Number(raw?.total_collected) || 0,
        totalOutstanding: Number(raw?.total_outstanding) || 0,
        draftInvoices: Number(raw?.draft_count) || 0,
        issuedInvoices: Number(raw?.issued_count) || 0,
        partiallyPaidInvoices: Number(raw?.partially_paid_count) || 0,
        paidInvoices: Number(raw?.paid_count) || 0,
        voidInvoices: Number(raw?.void_count) || 0,
        overdueCount: Number(raw?.overdue_count) || 0,
        overdueAmount: Number(raw?.overdue_amount) || 0,
      };
      return res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List invoices with filters and pagination
   */
  static async listInvoices(req, res, next) {
    try {
      const result = await InvoiceService.listInvoices(req.user.id, req.query);
      return res.status(200).json({
        success: true,
        data: result.invoices,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single invoice by ID
   */
  static async getInvoiceById(req, res, next) {
    try {
      const invoiceId = parseInt(req.params.id, 10);
      const invoice = await InvoiceService.getInvoiceById(invoiceId, req.user.id);
      return res.status(200).json({
        success: true,
        data: { invoice },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new invoice with line items
   */
  static async createInvoice(req, res, next) {
    try {
      const invoice = await InvoiceService.createInvoice(req.user.id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: { invoice },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update draft invoice
   */
  static async updateInvoice(req, res, next) {
    try {
      const invoiceId = parseInt(req.params.id, 10);
      const invoice = await InvoiceService.updateInvoice(invoiceId, req.user.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Invoice updated successfully',
        data: { invoice },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transition invoice status
   */
  static async updateInvoiceStatus(req, res, next) {
    try {
      const invoiceId = parseInt(req.params.id, 10);
      const invoice = await InvoiceService.updateStatus(invoiceId, req.user.id, req.body.status);
      return res.status(200).json({
        success: true,
        message: `Invoice status updated to ${invoice.status}`,
        data: { invoice },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete draft or void invoice
   */
  static async deleteInvoice(req, res, next) {
    try {
      const invoiceId = parseInt(req.params.id, 10);
      await InvoiceService.deleteInvoice(invoiceId, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Invoice deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stream rendered PDF directly to HTTP response
   */
  static async downloadInvoicePdf(req, res, next) {
    try {
      const invoiceId = parseInt(req.params.id, 10);
      const invoice = await InvoiceService.getInvoiceById(invoiceId, req.user.id);

      const filename = `Invoice-${invoice.invoice_number.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      PdfService.generateInvoicePdf(invoice, req.user, res);
    } catch (error) {
      next(error);
    }
  }
}

export default InvoiceController;
