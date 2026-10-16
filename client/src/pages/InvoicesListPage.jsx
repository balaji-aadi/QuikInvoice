import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import invoiceApi from '../api/invoiceApi';
import clientApi from '../api/clientApi';
import useDebounce from '../hooks/useDebounce';
import { exportInvoicesToCsv, downloadInvoicesTemplate } from '../utils/csvUtils';
import ImportModal from '../components/common/ImportModal';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  Download,
  Upload,
  FileSpreadsheet,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  CheckCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  X,
  IndianRupee,
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: Clock,
  },
  ISSUED: {
    label: 'Issued',
    bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: FileText,
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Clock,
  },
  PAID: {
    label: 'Paid',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle,
  },
  OVERDUE: {
    label: 'Overdue',
    bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    icon: AlertCircle,
  },
  VOID: {
    label: 'Void',
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
    border: 'border-slate-200 dark:border-slate-700',
    icon: Ban,
  },
};

export function InvoicesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get('status') || '';

  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [errorBanner, setErrorBanner] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchInvoices = useCallback(
    async (page = 1, status = selectedStatus, searchQuery = '') => {
      try {
        setLoading(true);
        setErrorBanner('');
        const params = { page, limit: 15 };
        if (status) params.status = status;
        if (searchQuery) params.search = searchQuery;

        const res = await invoiceApi.listInvoices(params);
        setInvoices(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      } catch (err) {
        setErrorBanner(err.message || 'Failed to fetch invoices');
      } finally {
        setLoading(false);
      }
    },
    [selectedStatus]
  );

  useEffect(() => {
    fetchInvoices(1, selectedStatus, debouncedSearch);
  }, [selectedStatus, debouncedSearch, fetchInvoices]);

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    if (status) {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  const handleDownloadPdf = async (invoice, e) => {
    e.stopPropagation();
    try {
      setDownloadingId(invoice.id);
      setErrorBanner('');
      const blob = await invoiceApi.downloadInvoicePdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `Invoice-${invoice.invoice_number}.pdf`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessBanner(`Downloaded PDF for invoice #${invoice.invoice_number}`);
    } catch (err) {
      setErrorBanner(err.message || 'Failed to download invoice PDF');
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
      fetchInvoices(pagination.page, selectedStatus, debouncedSearch);
    } catch (err) {
      setErrorBanner(err.message || 'Failed to delete invoice');
      setDeleteCandidate(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = () => {
    if (invoices.length > 0) {
      exportInvoicesToCsv(invoices);
    } else {
      setErrorBanner('No invoice records to export.');
    }
  };

  const validateInvoiceRow = (row) => {
    const clientEmail = (row['client email'] || row.client_email || row.email || '').trim();
    const description = (row.description || row.item || row['service description'] || '').trim();
    const quantity = parseFloat(row.quantity || row.qty || '1');
    const unitPrice = parseFloat(row['unit price (inr)'] || row.unitprice || row.price || '0');
    const taxRate = parseFloat(row['tax rate (%)'] || row.taxrate || row.tax || '0');
    const issueDate = (row['issue date'] || row.issuedate || new Date().toISOString().split('T')[0]).trim();
    const dueDate = (row['due date'] || row.duedate || '').trim();
    const notes = (row.notes || row['payment instructions'] || 'Payment requested within terms.').trim();

    if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return { valid: false, error: 'Valid client email is required' };
    }
    if (!description) {
      return { valid: false, error: 'Item description is required' };
    }
    if (isNaN(quantity) || quantity <= 0) {
      return { valid: false, error: 'Quantity must be > 0' };
    }
    if (isNaN(unitPrice) || unitPrice < 0) {
      return { valid: false, error: 'Unit price must be >= 0' };
    }

    return {
      valid: true,
      data: {
        clientEmail,
        description,
        quantity,
        unitPrice,
        taxRate: isNaN(taxRate) ? 0 : taxRate,
        issueDate,
        dueDate: dueDate || issueDate,
        notes,
      },
    };
  };

  const handleExecuteImportInvoices = async (validRows) => {
    // 1. Fetch available clients
    const clientsRes = await clientApi.listClients({ limit: 500 });
    const existingClients = clientsRes.data || [];
    const clientMap = new Map();
    existingClients.forEach((c) => {
      clientMap.set(c.email.toLowerCase(), c.id);
    });

    let successCount = 0;
    const failures = [];

    for (const item of validRows) {
      try {
        let clientId = clientMap.get(item.clientEmail.toLowerCase());
        if (!clientId) {
          // Auto create client
          const newClient = await clientApi.createClient({
            name: item.clientEmail.split('@')[0],
            email: item.clientEmail,
          });
          clientId = newClient.id;
          clientMap.set(item.clientEmail.toLowerCase(), clientId);
        }

        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await invoiceApi.createInvoice({
          clientId,
          invoiceNumber,
          issueDate: item.issueDate,
          dueDate: item.dueDate,
          notes: item.notes,
          status: 'ISSUED',
          items: [
            {
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
            },
          ],
        });
        successCount++;
      } catch (err) {
        failures.push(`${item.clientEmail}: ${err.message}`);
      }
    }

    if (failures.length > 0) {
      setErrorBanner(
        `Imported ${successCount} invoices. Failed on ${failures.length} records: ${failures.slice(0, 3).join(', ')}`
      );
    } else {
      setSuccessBanner(`Successfully imported ${successCount} invoice records!`);
    }

    fetchInvoices(1, selectedStatus, debouncedSearch);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E34234] uppercase tracking-wider mb-1">
              <span>Billing Ledger</span>
              <span>•</span>
              <span className="font-mono">{pagination.total} Invoices</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Invoices Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Issue, track payments, download vector PDFs, and manage billing accounts.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadInvoicesTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Download CSV import template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Import invoices from CSV/Excel"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Export all invoices to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <Link
              to="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl shadow-sm shadow-[#E34234]/25 hover:shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {errorBanner && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorBanner}</div>
            <button onClick={() => setErrorBanner('')} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successBanner && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successBanner}</div>
            <button onClick={() => setSuccessBanner('')} className="text-emerald-400 hover:text-emerald-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Controls: Status Tabs & Debounced Search */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: '', label: 'All Invoices' },
              { id: 'DRAFT', label: 'Draft' },
              { id: 'ISSUED', label: 'Issued' },
              { id: 'PARTIALLY_PAID', label: 'Partial' },
              { id: 'PAID', label: 'Paid' },
              { id: 'OVERDUE', label: 'Overdue' },
              { id: 'VOID', label: 'Void' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-[#E34234] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice # or client..."
              className="w-full pl-10 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E34234]/20 focus:border-[#E34234] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Invoices Table Card */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-[#E34234] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-[#E34234]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {search || selectedStatus ? 'No matching invoices' : 'No invoices generated yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                {search || selectedStatus
                  ? 'No records match your selected filter or search term. Try resetting your query.'
                  : 'Start issuing professional INR invoices to your clients with automated calculations.'}
              </p>
              <Link
                to="/invoices/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create First Invoice</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Invoice #</th>
                    <th className="py-3.5 px-6">Client</th>
                    <th className="py-3.5 px-6">Issue Date</th>
                    <th className="py-3.5 px-6">Due Date</th>
                    <th className="py-3.5 px-6 text-right">Total (₹)</th>
                    <th className="py-3.5 px-6 text-right">Balance Due (₹)</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {invoices.map((inv) => {
                    const st = STATUS_CONFIG[inv.status] || STATUS_CONFIG.DRAFT;
                    const StatusIcon = st.icon;

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="hover:text-[#E34234] transition-colors"
                          >
                            #{inv.invoice_number}
                          </Link>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {inv.client_name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {inv.client_email}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                          {formatDate(inv.issue_date)}
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-4 px-6 text-right font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                          {formatINR(inv.total_amount)}
                        </td>
                        <td className="py-4 px-6 text-right font-medium font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
                          {formatINR(inv.amount_due)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.bg} ${st.border}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {st.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Quick Record Payment */}
                            {['ISSUED', 'PARTIALLY_PAID'].includes(inv.status) &&
                              Number(inv.amount_due) > 0 && (
                                <Link
                                  to={`/invoices/${inv.id}`}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors inline-flex items-center"
                                  title="Record Payment"
                                >
                                  <IndianRupee className="w-3.5 h-3.5" />
                                </Link>
                              )}

                            {/* View Detail */}
                            <Link
                              to={`/invoices/${inv.id}`}
                              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            {/* Download PDF */}
                            <button
                              onClick={(e) => handleDownloadPdf(inv, e)}
                              disabled={downloadingId === inv.id}
                              className="p-1.5 text-slate-400 hover:text-[#E34234] hover:bg-[#E34234]/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit (Draft only) */}
                            {inv.status === 'DRAFT' && (
                              <Link
                                to={`/invoices/${inv.id}/edit`}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                                title="Edit Draft"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            {/* Delete (Draft only) */}
                            {inv.status === 'DRAFT' && (
                              <button
                                onClick={() => setDeleteCandidate(inv)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Delete Draft"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing page <strong className="text-slate-800 dark:text-white">{pagination.page}</strong> of{' '}
                <strong className="text-slate-800 dark:text-white">{pagination.totalPages}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchInvoices(pagination.page - 1, selectedStatus, debouncedSearch)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchInvoices(pagination.page + 1, selectedStatus, debouncedSearch)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Delete Draft Invoice?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete draft invoice <strong>#{deleteCandidate.invoice_number}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteInvoice}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Invoices from Spreadsheet"
          templateName="Invoices CSV Template"
          onDownloadTemplate={downloadInvoicesTemplate}
          onImport={handleExecuteImportInvoices}
          validateRow={validateInvoiceRow}
          columns={[
            { header: 'Client Email', key: 'clientEmail' },
            { header: 'Item Description', key: 'description' },
            { header: 'Qty', key: 'quantity' },
            { header: 'Unit Price (₹)', key: 'unitPrice' },
            { header: 'Tax %', key: 'taxRate' },
            { header: 'Due Date', key: 'dueDate' },
          ]}
          sampleDescription="Includes sample records with columns: Client Email, Issue Date, Due Date, Description, Quantity, Unit Price, Tax Rate, Notes."
        />
      </main>
    </div>
  );
}

export default InvoicesListPage;
