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
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalClients: 0,
    draftInvoices: 0,
    issuedInvoices: 0,
    paidInvoices: 0,
    totalBilled: 0,
    totalOutstanding: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardMetrics() {
      try {
        setLoading(true);
        const [invoicesRes, clientsRes] = await Promise.all([
          invoiceApi.listInvoices({ limit: 100 }),
          clientApi.listClients({ limit: 1 }),
        ]);

        const invoiceList = invoicesRes.data || [];
        const clientCount = clientsRes.pagination?.total || 0;

        let totalBilled = 0;
        let totalOutstanding = 0;
        let drafts = 0;
        let issued = 0;
        let paid = 0;

        invoiceList.forEach((inv) => {
          totalBilled += Number(inv.total_amount) || 0;
          totalOutstanding += Number(inv.amount_due) || 0;
          if (inv.status === 'DRAFT') drafts += 1;
          if (inv.status === 'ISSUED') issued += 1;
          if (inv.status === 'PAID') paid += 1;
        });

        setStats({
          totalInvoices: invoicesRes.pagination?.total || invoiceList.length,
          totalClients: clientCount,
          draftInvoices: drafts,
          issuedInvoices: issued,
          paidInvoices: paid,
          totalBilled,
          totalOutstanding,
        });
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardMetrics();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(val) || 0);
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

        {/* Financial & Operational Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Card 1: Total Receivables / Invoiced */}
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
            <p className="text-xs text-slate-500 mt-1">Across all issued & draft invoices</p>
          </div>

          {/* Card 2: Total Outstanding */}
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

          {/* Card 3: Active Invoices */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Invoices</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : stats.totalInvoices}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span>{stats.draftInvoices} draft</span>
              <span>•</span>
              <span>{stats.issuedInvoices} issued</span>
            </div>
          </div>

          {/* Card 4: Total Clients */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Clients</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : stats.totalClients}
            </div>
            <Link
              to="/clients"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1"
            >
              Manage directory <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Profile Card & System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Business Details Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs col-span-1 md:col-span-2">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Company Billing Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block mb-1">Business Name</span>
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {user?.business_name}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block mb-1">Billing Contact Email</span>
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {user?.email}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block mb-1">Contact Phone</span>
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {user?.business_phone || 'Not configured'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block mb-1">Account Created</span>
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                <span className="text-xs text-slate-500 font-medium block mb-1">Registered Address</span>
                <div className="font-medium text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  {user?.business_address || 'No billing address provided during onboarding.'}
                </div>
              </div>
            </div>
          </div>

          {/* Reconstruction Status Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
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
                <span className="font-bold">Complete ✓</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
                <span>Phase 3: Payments & Testing</span>
                <span className="text-slate-500 italic">Next</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
                <span>Phase 4: Audit & Interview Guide</span>
                <span className="text-slate-500 italic">Planned</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
