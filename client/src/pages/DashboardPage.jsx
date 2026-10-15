import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { ShieldCheck, Building2, User, Mail, MapPin, Phone, Calendar, ArrowRight, Layers } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Authenticated Session Active
                </span>
                <span className="text-xs text-slate-500">Tenant ID #{user?.id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome, {user?.name}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Operating workspace for <span className="font-semibold text-slate-800">{user?.business_name}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                <span className="font-medium text-slate-700">Database Context:</span> quikinvoice_dev (MySQL)
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card & System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Business Details Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm col-span-1 md:col-span-2">
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

          {/* Phase 1 Verification Status Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Reconstruction Status
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                <span>Phase 0: Architecture & Schema</span>
                <span className="font-bold">Passed ✓</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                <span>Phase 1: Foundation & Auth</span>
                <span className="font-bold">Passed ✓</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
                <span>Phase 2: Invoices, Clients & PDF</span>
                <span className="text-slate-500 italic">Pending Auth</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
                <span>Phase 3: Payments & Testing</span>
                <span className="text-slate-500 italic">Planned</span>
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
