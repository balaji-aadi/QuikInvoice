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
  CreditCard,
  IndianRupee,
  X,
  PlusCircle,
  History,
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';

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

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setErrorBanner('');
      const data = await invoiceApi.getInvoice(id);
      setInvoice(data);
      if (data && data.amount_due) {
        setPaymentAmount(data.amount_due);
      }
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

  const handleOpenPaymentModal = () => {
    setPaymentAmount(invoice.amount_due);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('BANK_TRANSFER');
    setReference('');
    setPaymentNotes('');
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    const dueNum = parseFloat(invoice.amount_due);

    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }

    if (amountNum > dueNum) {
      setPaymentError(`Payment amount cannot exceed remaining balance due of ${formatINR(dueNum)}.`);
      return;
    }

    try {
      setRecordingPayment(true);
      setPaymentError('');
      await invoiceApi.recordPayment(invoice.id, {
        amount: amountNum,
        paymentDate,
        paymentMethod,
        reference: reference.trim() || null,
        notes: paymentNotes.trim() || null,
      });

      setIsPaymentModalOpen(false);
      setSuccessBanner(`Payment of ${formatINR(amountNum)} recorded successfully.`);
      await loadInvoice();
    } catch (err) {
      setPaymentError(err.message || 'Failed to record payment transaction.');
    } finally {
      setRecordingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-8 h-8 border-3 border-[#E34234] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invoice Not Found</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{errorBanner || 'The requested invoice does not exist or has been removed.'}</p>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  // Derive status badge config with overdue support
  const isOverdue = invoice.is_overdue || (invoice.due_date < new Date().toISOString().split('T')[0] && Number(invoice.amount_due) > 0 && !['DRAFT', 'PAID', 'VOID'].includes(invoice.status));
  const effectiveStatus = isOverdue ? 'OVERDUE' : invoice.status;
  const st = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.DRAFT;
  const StatusIcon = st.icon;

  const canRecordPayment = ['ISSUED', 'PARTIALLY_PAID'].includes(invoice.status) && Number(invoice.amount_due) > 0;
  const hasPayments = invoice.payments && invoice.payments.length > 0;
  const percentPaid = Math.min(100, Math.round((Number(invoice.amount_paid) / Number(invoice.total_amount || 1)) * 100));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
            {/* Record Payment Button */}
            {canRecordPayment && (
              <button
                onClick={handleOpenPaymentModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <IndianRupee className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            )}

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

            {invoice.status === 'ISSUED' && !hasPayments && (
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl shadow-sm shadow-[#E34234]/20 transition-colors cursor-pointer disabled:opacity-50"
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

            {/* Delete (DRAFT or VOID only, and NO payments) */}
            {['DRAFT', 'VOID'].includes(invoice.status) && !hasPayments && (
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

        {/* Payment Settlement Progress Banner */}
        {invoice.status !== 'DRAFT' && invoice.status !== 'VOID' && (
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 mb-6 shadow-xs print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Payment Status: {invoice.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                {formatINR(invoice.amount_paid)} paid of {formatINR(invoice.total_amount)} ({percentPaid}%)
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  percentPaid === 100
                    ? 'bg-emerald-500'
                    : percentPaid > 0
                    ? 'bg-amber-500'
                    : 'bg-slate-300'
                }`}
                style={{ width: `${percentPaid}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Invoice Paper Document Card */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-8 sm:p-12 print:border-none print:shadow-none print:p-0 mb-8">
          {/* Header: Company & Invoice # */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#E34234] flex items-center justify-center text-white font-bold shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">INVOICE</h1>
              </div>
              <p className="font-mono text-base font-bold text-slate-700 dark:text-slate-300">
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
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Billing Dates
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Issue Date: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(invoice.issue_date)}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Payment Due: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(invoice.due_date)}</span>
              </div>
            </div>
          </div>

          {/* Client & Billing Parties */}
          <div className="py-8 grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-slate-200 dark:border-slate-800 text-sm">
            {/* Bill To */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Billed To
              </h3>
              <p className="text-base font-bold text-slate-900 dark:text-white">{invoice.client_name}</p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">{invoice.client_email}</p>
              {invoice.client_phone && (
                <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">{invoice.client_phone}</p>
              )}
              {invoice.client_address && (
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 whitespace-pre-line">
                  {invoice.client_address}
                </p>
              )}
            </div>

            {/* Issued By */}
            <div className="sm:text-right">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Issued By
              </h3>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {invoice.business_name || 'QuikInvoice Billing Provider'}
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">{invoice.user_email}</p>
              {invoice.business_phone && (
                <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">{invoice.business_phone}</p>
              )}
              {invoice.business_address && (
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 whitespace-pre-line">
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
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Tax Rate</th>
                    <th className="py-3 px-3 text-right">Tax Amount</th>
                    <th className="py-3 px-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                  {invoice.items &&
                    invoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-2 font-medium text-slate-800 dark:text-slate-100">
                          {item.description}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-600 dark:text-slate-300 font-mono">
                          {Number(item.quantity)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                          {formatINR(item.unit_price)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                          {Number(item.tax_rate)}%
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                          {formatINR(item.line_tax)}
                        </td>
                        <td className="py-3.5 px-2 text-right font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                          {formatINR(item.line_total)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start justify-between gap-8">
            {/* Notes / Instructions */}
            <div className="flex-1 text-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Payment Instructions & Terms
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-xs whitespace-pre-line leading-relaxed max-w-md">
                {invoice.notes || 'Payment is requested according to terms. Thank you for your partnership.'}
              </p>
            </div>

            {/* Calculations Box */}
            <div className="w-full sm:w-72 space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-200 tabular-nums">
                  {formatINR(invoice.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Total Tax</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-200 tabular-nums">
                  {formatINR(invoice.tax_total)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-base font-bold text-slate-900 dark:text-white">
                <span>Total Amount</span>
                <span className="font-mono text-lg text-slate-900 dark:text-white tabular-nums">
                  {formatINR(invoice.total_amount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Amount Paid</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                  {formatINR(invoice.amount_paid)}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between font-bold ${
                  Number(invoice.amount_due) <= 0
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-blue-50/80 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
                }`}
              >
                <span>{Number(invoice.amount_due) <= 0 ? 'Balance (PAID)' : 'Balance Due'}</span>
                <span
                  className={`font-mono text-lg tabular-nums ${
                    Number(invoice.amount_due) <= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-blue-700 dark:text-blue-400'
                  }`}
                >
                  {formatINR(invoice.amount_due)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payments History Ledger Card */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden mb-8 print:border-none print:shadow-none">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-[#E34234]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recorded Payment History</h3>
            </div>
            {canRecordPayment && (
              <button
                onClick={handleOpenPaymentModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Payment
              </button>
            )}
          </div>

          {!hasPayments ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              No payments have been recorded for this invoice yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    <th className="py-3 px-6">Payment Date</th>
                    <th className="py-3 px-6">Method</th>
                    <th className="py-3 px-6">Reference ID</th>
                    <th className="py-3 px-6">Notes</th>
                    <th className="py-3 px-6 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-6 font-medium text-slate-800 dark:text-slate-200">
                        {formatDate(p.payment_date)}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {p.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {p.reference || '—'}
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 text-xs truncate max-w-xs">
                        {p.notes || '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {formatINR(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Record Payment Modal */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-[#E34234]" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Payment</h3>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium">
                    {paymentError}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Payment Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      Balance Due: {formatINR(invoice.amount_due)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={invoice.amount_due}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                    <option value="CREDIT_CARD">Credit / Debit Card</option>
                    <option value="CASH">Cash</option>
                    <option value="CHECK">Check</option>
                    <option value="OTHER">Other / Escrow</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reference / Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WIRE-8812, TXN-9901, Cheque #402"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Additional context or notes for accounting reconciliation..."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  ></textarea>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recordingPayment}
                    className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
                  >
                    {recordingPayment ? 'Recording...' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default InvoiceDetailPage;
