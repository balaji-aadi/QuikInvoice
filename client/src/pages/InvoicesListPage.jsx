import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import invoiceApi from '../api/invoiceApi';
import {
  Receipt,
  PlusCircle,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  CheckCircle,
  Ban,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
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

export function InvoicesListPage() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [errorBanner, setErrorBanner] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInvoices = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setErrorBanner('');
      const params = { page, limit: 15 };
      if (selectedStatus) params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const res = await invoiceApi.listInvoices(params);
      setInvoices(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      setErrorBanner(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, search]);

  useEffect(() => {
    fetchInvoices(1);
  }, [fetchInvoices]);

  const handleDownloadPdf = async (invoice) => {
    try {
      setDownloadingId(invoice.id);
      const filename = `Invoice-${invoice.invoice_number}.pdf`;
      await invoiceApi.downloadInvoicePdf(invoice.id, filename);
      setSuccessBanner(`Downloaded PDF for invoice #${invoice.invoice_number}`);
    } catch (err) {
      setErrorBanner(err.message || 'Failed to generate PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteCandidate) return;

    try {
      setDeleting(true);
      setErrorBanner('');
      await invoiceApi.deleteInvoice(deleteCandidate.id);
      setSuccessBanner(`Invoice #${deleteCandidate.invoice_number} was successfully deleted`);
      setDeleteCandidate(null);
      fetchInvoices(pagination.page);
    } catch (err) {
      setErrorBanner(err.message || 'Cannot delete invoice');
      setDeleteCandidate(null);
    } finally {
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
    // Format YYYY-MM-DD
    const parts = dateStr.split('-');
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner messages */}
        {errorBanner && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorBanner}</div>
            <button
              onClick={() => setErrorBanner('')}
              className="text-red-500 hover:text-red-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successBanner && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successBanner}</div>
            <button
              onClick={() => setSuccessBanner('')}
              className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Title & Top CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Receipt className="w-7 h-7 text-blue-600" />
              Invoices
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Create, review, and track invoices with real-time tax calculation and PDF generation.
            </p>
          </div>

          <Link
            to="/invoices/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['', 'DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'VOID'].map((st) => {
              const active = selectedStatus === st;
              const label = st === '' ? 'All Invoices' : STATUS_CONFIG[st]?.label || st;
              return (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice # or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table of Invoices */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm">Loading billing records...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No invoices found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                {selectedStatus || search
                  ? 'No invoices match your current search or filter criteria.'
                  : 'Start billing your clients by creating your first professional invoice.'}
              </p>
              {selectedStatus || search ? (
                <button
                  onClick={() => {
                    setSelectedStatus('');
                    setSearch('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Reset Filters
                </button>
              ) : (
                <Link
                  to="/invoices/new"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create First Invoice</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Invoice #</th>
                    <th className="py-3.5 px-6">Client</th>
                    <th className="py-3.5 px-6">Issue Date</th>
                    <th className="py-3.5 px-6">Due Date</th>
                    <th className="py-3.5 px-6 text-right">Total</th>
                    <th className="py-3.5 px-6 text-right">Due</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {invoices.map((inv) => {
                    const st = STATUS_CONFIG[inv.status] || STATUS_CONFIG.DRAFT;
                    const StatusIcon = st.icon;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-900">{inv.client_name}</div>
                          <div className="text-xs text-slate-400">{inv.client_email}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                          {formatDate(inv.issue_date)}
                        </td>
                        <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {formatCurrency(inv.total_amount)}
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-slate-600 whitespace-nowrap">
                          {formatCurrency(inv.amount_due)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${st.bg} ${st.text} ${st.border}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {st.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* View details */}
                            <Link
                              to={`/invoices/${inv.id}`}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Download PDF */}
                            <button
                              onClick={() => handleDownloadPdf(inv)}
                              disabled={downloadingId === inv.id}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {/* Edit (Draft only) */}
                            {inv.status === 'DRAFT' && (
                              <Link
                                to={`/invoices/${inv.id}/edit`}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit Draft"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}

                            {/* Delete (Draft or Void only) */}
                            {['DRAFT', 'VOID'].includes(inv.status) && (
                              <button
                                onClick={() => setDeleteCandidate(inv)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination controls */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => fetchInvoices(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page <span className="font-semibold text-slate-800">{pagination.page}</span> of{' '}
                <span className="font-semibold text-slate-800">{pagination.totalPages}</span>
              </span>
              <button
                onClick={() => fetchInvoices(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Invoice</h3>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to permanently delete invoice{' '}
                <span className="font-semibold text-slate-900">#{deleteCandidate.invoice_number}</span>?
                This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteInvoice}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default InvoicesListPage;
