import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import invoiceApi from '../api/invoiceApi';
import clientApi from '../api/clientApi';
import { formatINR, formatDate } from '../utils/formatters';
import { exportInvoicesToCsv } from '../utils/csvUtils';
import {
  TrendingUp,
  Receipt,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  PlusCircle,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Building2,
  Calendar,
  IndianRupee,
  Download,
  UserPlus,
  ShieldCheck,
  Percent,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    overdueCount: 0,
    totalInvoices: 0,
    draftInvoices: 0,
    issuedInvoices: 0,
    partiallyPaidInvoices: 0,
    paidInvoices: 0,
    totalClients: 0,
  });

  const [recentInvoices, setRecentInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        const [kpiRes, invoicesRes, clientsRes] = await Promise.all([
          invoiceApi.getDashboardMetrics(),
          invoiceApi.listInvoices({ limit: 8 }),
          clientApi.listClients({ limit: 1 }),
        ]);

        if (kpiRes.data) {
          setStats((prev) => ({
            ...prev,
            ...kpiRes.data,
            totalClients: clientsRes.pagination?.total || 0,
          }));
        }

        if (invoicesRes.data) {
          setRecentInvoices(invoicesRes.data);
          setAllInvoices(invoicesRes.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const collectionRate =
    Number(stats.totalBilled) > 0
      ? Math.min(100, Math.round((Number(stats.totalCollected) / Number(stats.totalBilled)) * 100))
      : 0;

  const STATUS_CONFIG = {
    DRAFT: {
      label: 'Draft',
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
    ISSUED: {
      label: 'Issued',
      bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    },
    PARTIALLY_PAID: {
      label: 'Partially Paid',
      bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    },
    PAID: {
      label: 'Paid',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    },
    OVERDUE: {
      label: 'Overdue',
      bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    },
    VOID: {
      label: 'Void',
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
    },
  };

  const handleExportSummary = () => {
    if (allInvoices.length > 0) {
      exportInvoicesToCsv(allInvoices);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Top Header / Greeting Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E34234] uppercase tracking-wider mb-1">
              <span>Financial Overview</span>
              <span>•</span>
              <span className="font-mono">INR (₹) Standard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.business_name || 'Business Portal'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time authoritative billing metrics and invoice settlement ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportSummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Export all invoices to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <Link
              to="/clients"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Clients</span>
            </Link>

            <Link
              to="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl shadow-sm shadow-[#E34234]/25 hover:shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
          </div>
        </div>

        {/* Financial KPI Rollup Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Billed */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs border-l-4 border-l-[#E34234]">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Billed</span>
              <div className="w-8 h-8 rounded-lg bg-[#E34234]/10 text-[#E34234] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {loading ? '...' : formatINR(stats.totalBilled)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Excludes draft & void invoices</p>
          </div>

          {/* Card 2: Total Collected */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Collected</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              {loading ? '...' : formatINR(stats.totalCollected)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                {collectionRate}% settled
              </span>
              <span className="text-[11px] text-slate-400">Recorded payments</span>
            </div>
          </div>

          {/* Card 3: Outstanding Due */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Outstanding Due</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
              {loading ? '...' : formatINR(stats.totalOutstanding)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting client payment</p>
          </div>

          {/* Card 4: Overdue Balance */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Overdue</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums">
              {loading ? '...' : formatINR(stats.overdueAmount)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.overdueCount} invoice(s) past due date
            </p>
          </div>
        </div>

        {/* Mid-Row: Settlement Performance & Quick Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue Settlement Efficiency Gauge */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#E34234]" />
                  <span>Collection Efficiency</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  {collectionRate}%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Percentage of billed invoice volume successfully collected and reconciled to date.
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${collectionRate}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Collected</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatINR(stats.totalCollected)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Uncollected</span>
                  <span className="font-mono font-bold text-amber-600">
                    {formatINR(stats.totalOutstanding)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>ACID Row-Lock Concurrency Protection Active</span>
            </div>
          </div>

          {/* Invoice Lifecycle Distribution */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#E34234]" />
              <span>Invoice Lifecycle Status</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Breakdown of total invoice records across the state machine.
            </p>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <Link
                to="/invoices?status=DRAFT"
                className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between"
              >
                <span className="text-slate-600 dark:text-slate-300">Drafts</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">
                  {stats.draftInvoices || 0}
                </span>
              </Link>

              <Link
                to="/invoices?status=ISSUED"
                className="p-3 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 rounded-xl transition-colors flex items-center justify-between"
              >
                <span className="text-blue-700 dark:text-blue-300">Issued</span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-200">
                  {stats.issuedInvoices || 0}
                </span>
              </Link>

              <Link
                to="/invoices?status=PARTIALLY_PAID"
                className="p-3 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 rounded-xl transition-colors flex items-center justify-between"
              >
                <span className="text-amber-700 dark:text-amber-300">Partially Paid</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-200">
                  {stats.partiallyPaidInvoices || 0}
                </span>
              </Link>

              <Link
                to="/invoices?status=PAID"
                className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 rounded-xl transition-colors flex items-center justify-between"
              >
                <span className="text-emerald-700 dark:text-emerald-300">Fully Paid</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-200">
                  {stats.paidInvoices || 0}
                </span>
              </Link>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total Invoices:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {stats.totalInvoices || 0} Records
              </span>
            </div>
          </div>

          {/* Quick Operations Hub */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#E34234]" />
                <span>Quick Actions Hub</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Rapid workflows for daily billing and client operations.
              </p>

              <div className="space-y-2 text-xs">
                <Link
                  to="/invoices/new"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-[#E34234]/10 dark:hover:bg-[#E34234]/20 hover:text-[#E34234] transition-colors"
                >
                  <span className="font-semibold flex items-center gap-2">
                    <PlusCircle className="w-3.5 h-3.5 text-[#E34234]" />
                    Create New Invoice
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  to="/clients"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    Manage Client Accounts
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <button
                  type="button"
                  onClick={handleExportSummary}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    Export Invoices to CSV
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 text-[11px] text-slate-400 text-center">
              Active Client Accounts: <strong className="text-slate-700 dark:text-slate-200">{stats.totalClients}</strong>
            </div>
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#E34234]" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Invoices
              </h2>
            </div>
            <Link
              to="/invoices"
              className="text-xs font-bold text-[#E34234] hover:text-[#CB3528] flex items-center gap-1 transition-colors"
            >
              <span>View Directory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="w-6 h-6 border-2 border-[#E34234] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading invoices...
            </div>
          ) : recentInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
              <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              No invoices generated yet.{' '}
              <Link to="/invoices/new" className="text-[#E34234] font-semibold hover:underline">
                Create your first invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-5">Invoice #</th>
                    <th className="py-3 px-5">Client</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {recentInvoices.map((inv) => {
                    const st = STATUS_CONFIG[inv.status] || STATUS_CONFIG.DRAFT;

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white">
                          <Link to={`/invoices/${inv.id}`} className="hover:text-[#E34234] transition-colors">
                            #{inv.invoice_number}
                          </Link>
                        </td>
                        <td className="py-3.5 px-5 font-medium text-slate-800 dark:text-slate-200">
                          {inv.client_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatINR(inv.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.bg}`}
                          >
                            {inv.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="text-xs font-bold text-[#E34234] hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
