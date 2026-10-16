import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import clientApi from '../api/clientApi';
import useDebounce from '../hooks/useDebounce';
import { exportClientsToCsv, downloadClientsTemplate } from '../utils/csvUtils';
import ImportModal from '../components/common/ImportModal';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  MapPin,
  Receipt,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';

export function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Delete confirmation
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = useCallback(async (page = 1, searchQuery = '') => {
    try {
      setLoading(true);
      setErrorBanner('');
      const data = await clientApi.listClients({ page, limit: 12, search: searchQuery });
      setClients(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
    } catch (err) {
      setErrorBanner(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients(1, debouncedSearch);
  }, [debouncedSearch, fetchClients]);

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Client name is required';
    }
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Invalid email address format';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setErrorBanner('');

      if (editingClient) {
        await clientApi.updateClient(editingClient.id, formData);
        setSuccessBanner(`Client "${formData.name}" updated successfully`);
      } else {
        await clientApi.createClient(formData);
        setSuccessBanner(`Client "${formData.name}" added successfully`);
      }

      handleModalClose();
      fetchClients(pagination.page, debouncedSearch);
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        const fieldMap = {};
        err.details.forEach((d) => {
          fieldMap[d.field] = d.message;
        });
        setFormErrors(fieldMap);
      } else {
        setErrorBanner(err.message || 'Operation failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteCandidate) return;

    try {
      setDeleting(true);
      setErrorBanner('');
      await clientApi.deleteClient(deleteCandidate.id);
      setSuccessBanner(`Client "${deleteCandidate.name}" was removed`);
      setDeleteCandidate(null);
      fetchClients(pagination.page, debouncedSearch);
    } catch (err) {
      setErrorBanner(err.message || 'Could not delete client');
      setDeleteCandidate(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportClients = () => {
    if (clients.length > 0) {
      exportClientsToCsv(clients);
    } else {
      setErrorBanner('No client records to export.');
    }
  };

  const validateClientRow = (row) => {
    const name = (row.name || row['client name'] || '').trim();
    const email = (row.email || row['email address'] || '').trim();
    const phone = (row.phone || row['contact phone'] || '').trim();
    const address = (row.address || row['registered address'] || '').trim();

    if (!name) {
      return { valid: false, error: 'Name is required' };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, error: 'Valid email is required' };
    }

    return {
      valid: true,
      data: { name, email, phone, address },
    };
  };

  const handleExecuteImport = async (validRows) => {
    let successCount = 0;
    const failures = [];

    for (const item of validRows) {
      try {
        await clientApi.createClient(item);
        successCount++;
      } catch (err) {
        failures.push(`${item.name} (${item.email}): ${err.message}`);
      }
    }

    if (failures.length > 0) {
      setErrorBanner(
        `Imported ${successCount} clients. Failed on ${failures.length} records: ${failures.slice(0, 3).join(', ')}`
      );
    } else {
      setSuccessBanner(`Successfully imported ${successCount} client records!`);
    }

    fetchClients(1, debouncedSearch);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E34234] uppercase tracking-wider mb-1">
              <span>Client Management</span>
              <span>•</span>
              <span className="font-mono">{pagination.total} Records</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Clients Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage accounts, contact details, and view associated billing history.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadClientsTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Download CSV import template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Import clients from CSV/Excel"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={handleExportClients}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Export all clients to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl shadow-sm shadow-[#E34234]/25 hover:shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          </div>
        </div>

        {/* Banners */}
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

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E34234]/20 focus:border-[#E34234] transition-all"
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

          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Showing <strong className="text-slate-800 dark:text-slate-200">{clients.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{pagination.total}</strong> clients
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-16 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-[#E34234] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading clients directory...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {search ? 'No clients found matching search' : 'No clients in your directory yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
              {search
                ? `No client records matched "${search}". Try checking for typos or searching by phone number.`
                : 'Add client accounts manually or import your existing directory via spreadsheet.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Client</span>
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import from Excel/CSV</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clients.map((client) => {
              const initials = client.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={client.id}
                  className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E34234] to-[#FF6B5B] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#E34234] transition-colors truncate max-w-[170px]">
                            {client.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 font-mono">ID #{client.id}</span>
                        </div>
                      </div>

                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        title={`${client.invoice_count || 0} associated invoices`}
                      >
                        <Receipt className="w-3 h-3 text-slate-400" />
                        <span>{client.invoice_count || 0}</span>
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-xs mb-5 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`mailto:${client.email}`}
                          className="hover:text-[#E34234] transition-colors truncate"
                        >
                          {client.email}
                        </a>
                      </div>

                      {client.phone && (
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a
                            href={`tel:${client.phone}`}
                            className="hover:text-[#E34234] transition-colors truncate"
                          >
                            {client.phone}
                          </a>
                        </div>
                      )}

                      {client.address && (
                        <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{client.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <Link
                      to={`/invoices/new?clientId=${client.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E34234] bg-[#E34234]/10 hover:bg-[#E34234]/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Invoice</span>
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(client)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Client"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteCandidate(client)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete Client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-500">
            <div>
              Page <strong className="text-slate-800 dark:text-white">{pagination.page}</strong> of{' '}
              <strong className="text-slate-800 dark:text-white">{pagination.totalPages}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchClients(pagination.page - 1, debouncedSearch)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchClients(pagination.page + 1, debouncedSearch)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Create / Edit Client Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingClient ? 'Edit Client Information' : 'Add New Client'}
                </h3>
                <button
                  onClick={handleModalClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Client Name / Organization <span className="text-[#E34234]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Acme Technologies"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E34234]/20 focus:border-[#E34234]"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Billing Email Address <span className="text-[#E34234]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="billing@acme.example.com"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E34234]/20 focus:border-[#E34234]"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E34234]/20 focus:border-[#E34234]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Billing / Physical Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street, City, State, PIN..."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E34234]/20 focus:border-[#E34234]"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl shadow-xs disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Saving...' : editingClient ? 'Save Changes' : 'Create Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Delete Client Account?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to remove <strong>&quot;{deleteCandidate.name}&quot;</strong>? This action is protected by accounting referential integrity and cannot be undone.
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
                  onClick={handleDeleteClient}
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
          title="Import Client Accounts from Spreadsheet"
          templateName="Clients CSV Template"
          onDownloadTemplate={downloadClientsTemplate}
          onImport={handleExecuteImport}
          validateRow={validateClientRow}
          columns={[
            { header: 'Name', key: 'name' },
            { header: 'Email', key: 'email' },
            { header: 'Phone', key: 'phone' },
            { header: 'Address', key: 'address' },
          ]}
          sampleDescription="Includes sample records with columns: Name, Email, Phone, Address."
        />
      </main>
    </div>
  );
}

export default ClientsPage;
