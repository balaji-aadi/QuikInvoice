import InvoiceModel from '../models/invoiceModel.js';
import ClientModel from '../models/clientModel.js';
import { calculateInvoiceTotals } from '../utils/money.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';

export class InvoiceService {
  /**
   * List invoices for authenticated tenant
   */
  static async listInvoices(userId, filters) {
    return InvoiceModel.findAll(userId, filters);
  }

  /**
   * Get single invoice by ID with items and client details
   */
  static async getInvoiceById(id, userId) {
    const invoice = await InvoiceModel.findById(id, userId);
    if (!invoice) {
      throw new NotFoundError(`Invoice #${id} not found`);
    }
    return invoice;
  }

  /**
   * Create new invoice with server-side recalculated totals
   */
  static async createInvoice(userId, invoiceData) {
    // 1. Verify client belongs to this tenant
    const client = await ClientModel.findById(invoiceData.clientId, userId);
    if (!client) {
      throw new NotFoundError(`Client #${invoiceData.clientId} not found`);
    }

    // 2. Verify unique invoice number per tenant
    const existing = await InvoiceModel.findByNumber(userId, invoiceData.invoiceNumber);
    if (existing) {
      throw new ConflictError(`Invoice number '${invoiceData.invoiceNumber}' is already in use`);
    }

    // 3. Authoritative server-side calculation (disregards any client-supplied totals)
    const totals = calculateInvoiceTotals(invoiceData.items, 0);

    // 4. Persist in database inside transaction
    const invoiceId = await InvoiceModel.create(
      userId,
      {
        clientId: invoiceData.clientId,
        invoiceNumber: invoiceData.invoiceNumber,
        status: invoiceData.status || 'DRAFT',
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        totalAmount: totals.totalAmount,
        amountPaid: 0.0,
        amountDue: totals.totalAmount,
        notes: invoiceData.notes,
      },
      totals.processedItems
    );

    return this.getInvoiceById(invoiceId, userId);
  }

  /**
   * Update draft invoice
   */
  static async updateInvoice(id, userId, updateData) {
    // 1. Fetch existing invoice
    const existing = await this.getInvoiceById(id, userId);

    // 2. Guard: Only DRAFT invoices can be freely edited
    if (existing.status !== 'DRAFT') {
      throw new BadRequestError(
        `Invoice #${id} has status '${existing.status}' and cannot be modified. Only DRAFT invoices can be edited.`
      );
    }

    // 3. Verify client if changed
    const clientId = updateData.clientId || existing.client_id;
    if (updateData.clientId && updateData.clientId !== existing.client_id) {
      const client = await ClientModel.findById(clientId, userId);
      if (!client) {
        throw new NotFoundError(`Client #${clientId} not found`);
      }
    }

    // 4. Verify invoice number if changed
    const invoiceNumber = updateData.invoiceNumber || existing.invoice_number;
    if (updateData.invoiceNumber && updateData.invoiceNumber !== existing.invoice_number) {
      const numberConflict = await InvoiceModel.findByNumber(userId, updateData.invoiceNumber);
      if (numberConflict && numberConflict.id !== id) {
        throw new ConflictError(`Invoice number '${updateData.invoiceNumber}' is already in use`);
      }
    }

    // 5. Recalculate totals
    const items = updateData.items || existing.items;
    const totals = calculateInvoiceTotals(items, existing.amount_paid);

    // 6. Persist update in transaction
    await InvoiceModel.update(
      id,
      userId,
      {
        clientId,
        invoiceNumber,
        issueDate: updateData.issueDate || existing.issue_date,
        dueDate: updateData.dueDate || existing.due_date,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        totalAmount: totals.totalAmount,
        amountDue: totals.amountDue,
        notes: updateData.notes !== undefined ? updateData.notes : existing.notes,
      },
      totals.processedItems
    );

    return this.getInvoiceById(id, userId);
  }

  /**
   * Change invoice status following the state machine
   */
  static async updateStatus(id, userId, newStatus) {
    const invoice = await this.getInvoiceById(id, userId);

    // Legal status transition verification
    if (invoice.status === 'VOID') {
      throw new BadRequestError('VOID invoices cannot be transitioned to any other state.');
    }

    if (invoice.status === 'PAID' && newStatus === 'DRAFT') {
      throw new BadRequestError('PAID invoices cannot be reverted to DRAFT status.');
    }

    if (newStatus === invoice.status) {
      return invoice;
    }

    return InvoiceModel.updateStatus(id, userId, newStatus);
  }

  /**
   * Delete invoice safely
   */
  static async deleteInvoice(id, userId) {
    const invoice = await this.getInvoiceById(id, userId);

    // Only DRAFT or VOID invoices can be deleted to maintain legal accounting audit integrity
    if (!['DRAFT', 'VOID'].includes(invoice.status)) {
      throw new BadRequestError(
        `Cannot delete invoice with status '${invoice.status}'. Issued or paid invoices must be marked as VOID instead of being deleted.`
      );
    }

    return InvoiceModel.delete(id, userId);
  }
}

export default InvoiceService;
