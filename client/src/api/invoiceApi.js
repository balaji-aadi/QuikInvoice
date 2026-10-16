import axiosClient from './axiosClient';

export const invoiceApi = {
  /**
   * List invoices with filters and pagination
   * @param {{ status?: string, clientId?: number, search?: string, page?: number, limit?: number }} params
   */
  async listInvoices(params = {}) {
    const res = await axiosClient.get('/invoices', { params });
    return res.data;
  },

  /**
   * Get single invoice by ID with line items, payments, and client details
   */
  async getInvoice(id) {
    const res = await axiosClient.get(`/invoices/${id}`);
    return res.data.data.invoice;
  },

  /**
   * Create new invoice
   */
  async createInvoice(invoiceData) {
    const res = await axiosClient.post('/invoices', invoiceData);
    return res.data.data.invoice;
  },

  /**
   * Update draft invoice
   */
  async updateInvoice(id, invoiceData) {
    const res = await axiosClient.put(`/invoices/${id}`, invoiceData);
    return res.data.data.invoice;
  },

  /**
   * Update invoice status (e.g. DRAFT -> ISSUED, VOID)
   */
  async updateStatus(id, status) {
    const res = await axiosClient.patch(`/invoices/${id}/status`, { status });
    return res.data.data.invoice;
  },

  /**
   * Delete invoice (draft or void only)
   */
  async deleteInvoice(id) {
    const res = await axiosClient.delete(`/invoices/${id}`);
    return res.data;
  },

  /**
   * Record a payment against an invoice
   */
  async recordPayment(invoiceId, paymentData) {
    const res = await axiosClient.post(`/invoices/${invoiceId}/payments`, paymentData);
    return res.data.data;
  },

  /**
   * Retrieve payment history for an invoice
   */
  async getInvoicePayments(invoiceId) {
    const res = await axiosClient.get(`/invoices/${invoiceId}/payments`);
    return res.data;
  },

  /**
   * Get aggregated financial metrics for dashboard
   */
  async getDashboardMetrics() {
    const res = await axiosClient.get('/invoices/metrics');
    return res.data.data;
  },

  /**
   * Download generated PDF directly to the browser
   */
  async downloadInvoicePdf(id, filename = 'invoice.pdf') {
    const res = await axiosClient.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default invoiceApi;
