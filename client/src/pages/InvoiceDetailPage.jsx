import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import invoiceApi from '../api/invoiceApi';
import {
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  Send,
  Ban,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Printer,
  FileText,
  Clock,
  CheckCircle,
  Receipt,
  User,
} from 'lucide-react';

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: Clock,
  },
  ISSUED: {
    label: 'Issued',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: FileText,
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Clock,
  },
  PAID: {
    label: 'Paid',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle,
  },
  OVERDUE: {
    label: 'Overdue',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: AlertCircle,
  },
  VOID: {
    label: 'Void',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: Ban,
  },
};

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setErrorBanner('');
      const data = await invoiceApi.getInvoice(id);
      setInvoice(data);
    } catch (err) {
      setErrorBanner(err.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setDownloading(true);
      const filename = `Invoice-${invoice.invoice_number}.pdf`;
      await invoiceApi.downloadInvoicePdf(invoice.id, filename);
      setSuccessBanner(`Downloaded invoice PDF: ${filename}`);
    } catch (err) {
      setErrorBanner(err.message || 'Error generating PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      setErrorBanner('');
      const updated = await invoiceApi.updateStatus(id, newStatus);
      setInvoice(updated);
      setSuccessBanner(`Invoice status updated to ${newStatus}`);
    } catch (err) {
      setErrorBanner(err.message || 'Failed to transition invoice status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete invoice #${invoice.invoice_number}?`)) {
      return;
    }
    try {
      setDeleting(true);
      setErrorBanner('');
      await invoiceApi.deleteInvoice(id);
      navigate('/invoices');
    } catch (err) {
      setErrorBanner(err.message || 'Failed to delete invoice');
      setDeleting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(val) || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
    }
    return dateStr;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Invoice Not Found</h2>
          <p className="text-sm text-slate-600 mb-6">{errorBanner || 'The requested invoice does not exist or has been removed.'}</p>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const st = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = st.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices</span>
          </Link>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Transitions */}
            {invoice.status === 'DRAFT' && (
              <button
                onClick={() => handleStatusChange('ISSUED')}
                disabled={updatingStatus}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Mark as Issued</span>
              </button>
            )}

            {invoice.status === 'ISSUED' && (
              <button
                onClick={() => handleStatusChange('VOID')}
                disabled={updatingStatus}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Void Invoice</span>
              </button>
            )}

            {/* Edit Draft */}
            {invoice.status === 'DRAFT' && (
              <Link
                to={`/invoices/${invoice.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
            )}

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Delete (DRAFT or VOID only) */}
            {['DRAFT', 'VOID'].includes(invoice.status) && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Delete Invoice"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Feedback Banners */}
        {errorBanner && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorBanner}</div>
          </div>
        )}

        {successBanner && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successBanner}</div>
          </div>
        )}

        {/* Invoice Paper Document Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-8 sm:p-12 print:border-none print:shadow-none print:p-0">
          {/* Header: Company & Invoice # */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">INVOICE</h1>
              </div>
              <p className="font-mono text-base font-bold text-slate-700">
                #{invoice.invoice_number}
              </p>
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${st.bg} ${st.text} ${st.border}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {st.label}
                </span>
              </div>
            </div>

            {/* Dates Card */}
            <div className="text-right sm:text-right space-y-1 text-sm">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Billing Dates
              </div>
              <div>
                <span className="text-slate-500">Issue Date: </span>
                <span className="font-semibold text-slate-800">{formatDate(invoice.issue_date)}</span>
              </div>
              <div>
                <span className="text-slate-500">Payment Due: </span>
                <span className="font-semibold text-slate-800">{formatDate(invoice.due_date)}</span>
              </div>
            </div>
          </div>

          {/* Client & Billing Parties */}
          <div className="py-8 grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-slate-200 text-sm">
            {/* Bill To */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Billed To
              </h3>
              <p className="text-base font-bold text-slate-900">{invoice.client_name}</p>
              <p className="text-slate-600 mt-0.5">{invoice.client_email}</p>
              {invoice.client_phone && (
                <p className="text-slate-600 text-xs mt-0.5">{invoice.client_phone}</p>
              )}
              {invoice.client_address && (
                <p className="text-slate-500 text-xs mt-1 whitespace-pre-line">
                  {invoice.client_address}
                </p>
              )}
            </div>

            {/* Issued By */}
            <div className="sm:text-right">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Issued By
              </h3>
              <p className="text-base font-bold text-slate-900">
                {invoice.business_name || 'QuikInvoice Billing Provider'}
              </p>
              <p className="text-slate-600 mt-0.5">{invoice.user_email}</p>
              {invoice.business_phone && (
                <p className="text-slate-600 text-xs mt-0.5">{invoice.business_phone}</p>
              )}
              {invoice.business_address && (
                <p className="text-slate-500 text-xs mt-1 whitespace-pre-line">
                  {invoice.business_address}
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Itemized Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Tax Rate</th>
                    <th className="py-3 px-3 text-right">Tax Amount</th>
                    <th className="py-3 px-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {invoice.items &&
                    invoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-2 font-medium text-slate-800">
                          {item.description}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-600 font-mono">
                          {Number(item.quantity)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-600 font-mono">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-600 font-mono">
                          {Number(item.tax_rate)}%
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-600 font-mono">
                          {formatCurrency(item.line_tax)}
                        </td>
                        <td className="py-3.5 px-2 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(item.line_total)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start justify-between gap-8">
            {/* Notes / Instructions */}
            <div className="flex-1 text-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Payment Instructions & Terms
              </h4>
              <p className="text-slate-600 text-xs whitespace-pre-line leading-relaxed max-w-md">
                {invoice.notes || 'Payment is requested according to terms. Thank you for your partnership.'}
              </p>
            </div>

            {/* Calculations Box */}
            <div className="w-full sm:w-72 space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-slate-900">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Total Tax</span>
                <span className="font-mono font-medium text-slate-900">
                  {formatCurrency(invoice.tax_total)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-base font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="font-mono text-lg text-slate-900">
                  {formatCurrency(invoice.total_amount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Amount Paid</span>
                <span className="font-mono text-emerald-600 font-medium">
                  {formatCurrency(invoice.amount_paid)}
                </span>
              </div>

              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 flex items-center justify-between font-bold text-blue-900">
                <span>Balance Due</span>
                <span className="font-mono text-lg text-blue-700">
                  {formatCurrency(invoice.amount_due)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default InvoiceDetailPage;
