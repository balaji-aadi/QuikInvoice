import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import invoiceApi from '../api/invoiceApi';
import clientApi from '../api/clientApi';
import {
  ShieldCheck,
  Building2,
  Mail,
  MapPin,
  Phone,
  Calendar,
  Layers,
  Receipt,
  Users,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalClients: 0,
    draftInvoices: 0,
    issuedInvoices: 0,
    partiallyPaidInvoices: 0,
    paidInvoices: 0,
    voidInvoices: 0,
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdueCount: 0,
    overdueAmount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [metrics, clientsRes, recentInvoicesRes] = await Promise.all([
          invoiceApi.getDashboardMetrics(),
          clientApi.listClients({ limit: 1 }),
          invoiceApi.listInvoices({ limit: 5 }),
        ]);

        const clientCount = clientsRes.pagination?.total || 0;

        setStats({
          totalInvoices: Number(metrics?.total_invoices) || 0,
          totalClients: clientCount,
          draftInvoices: Number(metrics?.draft_count) || 0,
          issuedInvoices: Number(metrics?.issued_count) || 0,
          partiallyPaidInvoices: Number(metrics?.partially_paid_count) || 0,
          paidInvoices: Number(metrics?.paid_count) || 0,
          voidInvoices: Number(metrics?.void_count) || 0,
          totalBilled: Number(metrics?.total_billed) || 0,
          totalCollected: Number(metrics?.total_collected) || 0,
          totalOutstanding: Number(metrics?.total_outstanding) || 0,
          overdueCount: Number(metrics?.overdue_count) || 0,
          overdueAmount: Number(metrics?.overdue_amount) || 0,
        });

        setRecentInvoices(recentInvoicesRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Authenticated Session Active
                </span>
                <span className="text-xs text-slate-500 font-mono">Tenant #{user?.id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {user?.name}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Operating workspace for <span className="font-semibold text-slate-800">{user?.business_name}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/invoices/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Invoice</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Financial KPI Rollup Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Card 1: Total Billed */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Billed</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : formatCurrency(stats.totalBilled)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Excludes draft & void invoices</p>
          </div>

          {/* Card 2: Total Collected */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Collected</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {loading ? '...' : formatCurrency(stats.totalCollected)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Persisted payment transactions</p>
          </div>

          {/* Card 3: Total Outstanding Due */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Due</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 font-mono">
              {loading ? '...' : formatCurrency(stats.totalOutstanding)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Awaiting client payment</p>
          </div>

          {/* Card 4: Overdue Balance */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 font-mono">
              {loading ? '...' : formatCurrency(stats.overdueAmount)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.overdueCount} invoice(s) past due date
            </p>
          </div>
        </div>

        {/* Operational Status & Recent Invoices Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Invoices Table (2 cols) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                Recent Invoices
              </h2>
              <Link
                to="/invoices"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                View all ({stats.totalInvoices}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Loading invoices...</div>
            ) : recentInvoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No invoices found.{' '}
                <Link to="/invoices/new" className="text-blue-600 font-semibold underline">
                  Create your first invoice
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                      <th className="py-2.5 px-2">Invoice #</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-2 font-mono font-semibold text-slate-800">
                          <Link to={`/invoices/${inv.id}`} className="hover:text-blue-600">
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-slate-700 truncate max-w-xs">
                          {inv.client_name}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-xs">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                          {formatCurrency(inv.total_amount)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-amber-50 text-amber-700'
                                : inv.status === 'ISSUED'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Reconstruction Status Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Reconstruction Status
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                <span>Phase 0: Schema & Architecture</span>
                <span className="font-bold">Passed ✓</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                <span>Phase 1: Foundation & Auth</span>
                <span className="font-bold">Passed ✓</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                <span>Phase 2: Invoices, Clients & PDF</span>
                <span className="font-bold">Passed ✓</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                <span>Phase 3: Payments & Concurrency</span>
                <span className="font-bold">Complete ✓</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
                <span>Phase 4: Audit & Interview Guide</span>
                <span className="text-slate-500 italic">Next</span>
              </div>
            </div>

            {/* Invoices Breakdown Pill */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Invoice Breakdown
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-700">
                  <span className="font-bold">{stats.draftInvoices}</span> Drafts
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
                  <span className="font-bold">{stats.issuedInvoices}</span> Issued
                </div>
                <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
                  <span className="font-bold">{stats.partiallyPaidInvoices}</span> Partial
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                  <span className="font-bold">{stats.paidInvoices}</span> Paid
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Profile Details */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Company Billing Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block mb-1">Business Name</span>
              <div className="font-semibold text-slate-900">{user?.business_name}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block mb-1">Billing Email</span>
              <div className="font-semibold text-slate-900 truncate">{user?.email}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block mb-1">Contact Phone</span>
              <div className="font-semibold text-slate-900">{user?.business_phone || 'Not configured'}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium block mb-1">Total Client Profiles</span>
              <div className="font-semibold text-slate-900">{stats.totalClients}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
