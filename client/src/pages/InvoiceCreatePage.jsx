import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import invoiceApi from '../api/invoiceApi';
import clientApi from '../api/clientApi';
import {
  Receipt,
  Plus,
  Trash2,
  ArrowLeft,
  Calendar,
  Building,
  FileText,
  AlertCircle,
  CheckCircle2,
  Save,
  Send,
  UserPlus,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export function InvoiceCreatePage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(!!editId);

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('Payment is requested within 30 days of invoice date. Thank you for your business!');
  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // 1. Fetch available clients
  useEffect(() => {
    async function loadClients() {
      try {
        setLoadingClients(true);
        const res = await clientApi.listClients({ limit: 100 });
        const clientList = res.data || [];
        setClients(clientList);

        if (!editId && preselectedClientId) {
          setClientId(preselectedClientId);
        } else if (!editId && clientList.length > 0 && !clientId) {
          setClientId(clientList[0].id.toString());
        }
      } catch (err) {
        setErrorBanner('Failed to load clients list.');
      } finally {
        setLoadingClients(false);
      }
    }
    loadClients();
  }, [preselectedClientId, editId]);

  // 2. If editing, fetch existing invoice
  useEffect(() => {
    if (!editId) {
      // Auto-generate invoice number if creating fresh
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      setInvoiceNumber(`INV-${year}-${randomSuffix}`);
      return;
    }

    async function loadInvoice() {
      try {
        setLoadingInvoice(true);
        const inv = await invoiceApi.getInvoice(editId);
        if (inv.status !== 'DRAFT') {
          setErrorBanner(`Only DRAFT invoices can be edited. This invoice has status ${inv.status}.`);
          return;
        }
        setClientId(inv.client_id.toString());
        setInvoiceNumber(inv.invoice_number);
        setIssueDate(inv.issue_date.split('T')[0]);
        setDueDate(inv.due_date.split('T')[0]);
        setNotes(inv.notes || '');
        if (inv.items && inv.items.length > 0) {
          setItems(
            inv.items.map((i) => ({
              description: i.description,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unit_price),
              taxRate: Number(i.tax_rate),
            }))
          );
        }
      } catch (err) {
        setErrorBanner(err.message || 'Failed to load invoice for editing');
      } finally {
        setLoadingInvoice(false);
      }
    }
    loadInvoice();
  }, [editId]);

  // Live client-side calculation preview
  const liveTotals = useMemo(() => {
    let subtotalCents = 0;
    let taxTotalCents = 0;

    const computedItems = items.map((item) => {
      const qty = Math.max(0, parseFloat(item.quantity) || 0);
      const price = Math.max(0, parseFloat(item.unitPrice) || 0);
      const taxRate = Math.max(0, parseFloat(item.taxRate) || 0);

      const lineSubtotalCents = Math.round(qty * price * 100);
      const lineTaxCents = Math.round((lineSubtotalCents * taxRate) / 100);
      const lineTotalCents = lineSubtotalCents + lineTaxCents;

      subtotalCents += lineSubtotalCents;
      taxTotalCents += lineTaxCents;

      return {
        lineSubtotal: (lineSubtotalCents / 100).toFixed(2),
        lineTax: (lineTaxCents / 100).toFixed(2),
        lineTotal: (lineTotalCents / 100).toFixed(2),
      };
    });

    const totalCents = subtotalCents + taxTotalCents;

    return {
      subtotal: (subtotalCents / 100).toFixed(2),
      taxTotal: (taxTotalCents / 100).toFixed(2),
      totalAmount: (totalCents / 100).toFixed(2),
      computedItems,
    };
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const validate = () => {
    const errors = {};
    if (!clientId) errors.clientId = 'Please select a client';
    if (!invoiceNumber.trim()) errors.invoiceNumber = 'Invoice number is required';
    if (!issueDate) errors.issueDate = 'Issue date is required';
    if (!dueDate) errors.dueDate = 'Due date is required';
    if (dueDate < issueDate) errors.dueDate = 'Due date cannot be earlier than issue date';

    if (items.length === 0) {
      errors.items = 'At least one line item is required';
    } else {
      items.forEach((item, idx) => {
        if (!item.description.trim()) {
          errors[`item_${idx}_desc`] = 'Description is required';
        }
        if (parseFloat(item.quantity) <= 0 || isNaN(parseFloat(item.quantity))) {
          errors[`item_${idx}_qty`] = 'Qty must be > 0';
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (targetStatus = 'DRAFT') => {
    if (!validate()) return;

    try {
      setSaving(true);
      setErrorBanner('');

      const payload = {
        clientId: parseInt(clientId, 10),
        invoiceNumber: invoiceNumber.trim(),
        issueDate,
        dueDate,
        notes: notes.trim() || null,
        status: targetStatus,
        items: items.map((i) => ({
          description: i.description.trim(),
          quantity: parseFloat(i.quantity) || 1,
          unitPrice: parseFloat(i.unitPrice) || 0,
          taxRate: parseFloat(i.taxRate) || 0,
        })),
      };

      if (editId) {
        await invoiceApi.updateInvoice(editId, payload);
        if (targetStatus === 'ISSUED') {
          await invoiceApi.updateStatus(editId, 'ISSUED');
        }
        navigate(`/invoices/${editId}`);
      } else {
        const created = await invoiceApi.createInvoice(payload);
        navigate(`/invoices/${created.id}`);
      }
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        const fieldErrors = {};
        err.details.forEach((d) => {
          fieldErrors[d.field] = d.message;
        });
        setFormErrors(fieldErrors);
      } else {
        setErrorBanner(err.message || 'Failed to save invoice');
      }
    } finally {
      setSaving(false);
    }
  };


  if (loadingInvoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices</span>
          </Link>
        </div>

        {/* Error Banner */}
        {errorBanner && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorBanner}</div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                  <Receipt className="w-6 h-6 text-[#E34234]" />
                  {editId ? `Edit Draft Invoice #${invoiceNumber}` : 'Create New Invoice'}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Fill in the client information, line items, and applicable tax rates.
                </p>
              </div>

              {/* Status Badge */}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-center">
                DRAFT INVOICE
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Invoice Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {/* Client Selector */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <Link
                    to="/clients"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    New Client
                  </Link>
                </div>
                {loadingClients ? (
                  <div className="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
                ) : clients.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    No clients found. Please{' '}
                    <Link to="/clients" className="font-bold underline">
                      create a client
                    </Link>{' '}
                    first before drafting an invoice.
                  </div>
                ) : (
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.clientId && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.clientId}</p>
                )}
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-001"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                />
                {formErrors.invoiceNumber && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.invoiceNumber}</p>
                )}
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
                {formErrors.issueDate && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.issueDate}</p>
                )}
              </div>

              {/* Due Date */}
              <div className="sm:col-start-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
                {formErrors.dueDate && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.dueDate}</p>
                )}
              </div>
            </div>

            {/* Line Items Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-900">Line Items & Services</h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Line Item
                </button>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
                      <th className="py-2.5 px-4 w-5/12">Description</th>
                      <th className="py-2.5 px-3 w-2/12">Qty</th>
                      <th className="py-2.5 px-3 w-2/12">Unit Price (₹)</th>
                      <th className="py-2.5 px-3 w-2/12">Tax Rate (%)</th>
                      <th className="py-2.5 px-4 w-2/12 text-right">Line Total</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {items.map((item, index) => {
                      const comp = liveTotals.computedItems[index] || { lineTotal: '0.00' };

                      return (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              required
                              placeholder="Service or item description..."
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className={`w-full px-3 py-1.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${formErrors[`item_${index}_desc`] ? 'border-red-400' : 'border-slate-200'
                                }`}
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              required
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={item.taxRate}
                              onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                            >
                              <option value="0">0% (GST Exempt / Nil)</option>
                              <option value="5">5% (GST 5%)</option>
                              <option value="12">12% (GST 12%)</option>
                              <option value="18">18% (GST 18% - Standard)</option>
                              <option value="28">28% (GST 28%)</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800 tabular-nums">
                            {formatINR(comp.lineTotal)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove line item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section: Notes & Live Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-4 border-t border-slate-100">
              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Instructions & Notes
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Wire transfer details, bank IBAN, payment terms..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                ></textarea>
                <p className="mt-1 text-xs text-slate-400">
                  This note will be rendered directly onto the downloadable PDF invoice.
                </p>
              </div>

              {/* Authoritative Live Calculation Breakdown */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-6 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Invoice Summary Preview
                </h3>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-slate-800 tabular-nums">
                    {formatINR(liveTotals.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Tax Total</span>
                  <span className="font-mono font-medium text-slate-800 tabular-nums">
                    {formatINR(liveTotals.taxTotal)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-base font-bold text-slate-900">
                  <span>Total Amount Due</span>
                  <span className="font-mono text-xl text-blue-700 tabular-nums">
                    {formatINR(liveTotals.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link
                to="/invoices"
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer"
              >
                Cancel
              </Link>

              <button
                type="button"
                disabled={saving || clients.length === 0}
                onClick={() => handleSubmit('DRAFT')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save as Draft</span>
              </button>

              <button
                type="button"
                disabled={saving || clients.length === 0}
                onClick={() => handleSubmit('ISSUED')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl shadow-sm shadow-[#E34234]/25 hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{saving ? 'Processing...' : 'Save & Issue Invoice'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default InvoiceCreatePage;
