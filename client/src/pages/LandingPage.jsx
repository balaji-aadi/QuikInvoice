import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { Logo } from '../components/common/Logo';
import {
  FileText,
  IndianRupee,
  ShieldCheck,
  Zap,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle,
  Download,
  Users,
  CreditCard,
  Lock,
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
          {/* Subtle Glow Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#E34234]/15 via-[#E34234]/5 to-transparent blur-3xl pointer-events-none -z-10"></div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E34234]/10 dark:bg-[#E34234]/20 border border-[#E34234]/25 text-[#E34234] text-xs font-bold uppercase tracking-wider mb-8 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#E34234] animate-pulse"></span>
              <span>Indian Rupee (INR ₹) & GST Ready Billing Architecture</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.08]">
              Invoicing made <span className="text-[#E34234]">beautifully fast</span>, accurate & effortless.
            </h1>

            {/* Subhead */}
            <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Create, track, and reconcile professional INR invoices with streaming vector PDFs, server-authoritative integer calculations, and bulk Excel import/export.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-2xl shadow-lg shadow-[#E34234]/25 hover:shadow-xl transition-all duration-150 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all duration-150 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <span>Sign In Demo</span>
              </Link>
            </div>

            {/* Highlights Bar */}
            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#E34234]" />
                <span>Zero Floating-Point Drift</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#E34234]" />
                <span>Row-Locking Concurrency</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#E34234]" />
                <span>Sub-10ms Streaming PDFs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#E34234]" />
                <span>Bulk Excel/CSV Sync</span>
              </div>
            </div>

            {/* Interactive Mock Invoice Card */}
            <div className="mt-14 max-w-4xl mx-auto rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-2xl text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Logo size="sm" />
                  <div>
                    <div className="text-xs text-slate-400">Sample Invoice</div>
                    <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      #INV-2026-0042
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    ISSUED
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E34234]/10 text-[#E34234] border border-[#E34234]/20">
                    INR (₹) Standard
                  </span>
                </div>
              </div>

              {/* Sample Line Item */}
              <div className="py-6 border-b border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-12 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Unit Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                <div className="grid grid-cols-12 text-sm text-slate-800 dark:text-slate-200 font-medium py-1">
                  <div className="col-span-6 font-semibold">Enterprise Cloud & Billing Architecture</div>
                  <div className="col-span-2 text-right font-mono">1</div>
                  <div className="col-span-2 text-right font-mono">₹1,25,000.00</div>
                  <div className="col-span-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₹1,25,000.00
                  </div>
                </div>
                <div className="grid grid-cols-12 text-sm text-slate-800 dark:text-slate-200 font-medium py-1">
                  <div className="col-span-6 font-semibold">GST (Standard 18%)</div>
                  <div className="col-span-2 text-right font-mono">—</div>
                  <div className="col-span-2 text-right font-mono">18%</div>
                  <div className="col-span-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₹22,500.00
                  </div>
                </div>
              </div>

              {/* Invoice Card Footer Totals */}
              <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  Calculated authoritatively using 64-bit integer paise arithmetic.
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">Grand Total Due</div>
                  <div className="text-2xl sm:text-3xl font-black text-[#E34234] font-mono">
                    ₹1,47,500.00
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="py-20 bg-slate-50/70 dark:bg-[#0B0F19] border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold text-[#E34234] uppercase tracking-wider mb-2">
                Engineered for Reliability
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                Everything your business needs to manage billing with confidence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#E34234]/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#E34234]/10 text-[#E34234] flex items-center justify-center mb-6">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Native INR & GST Formatting
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Proper Indian digit grouping (lakhs & crores) and standard GST rates (0%, 5%, 12%, 18%, 28%) with accurate commercial rounding.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#E34234]/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center mb-6">
                  <FileSpreadsheet className="w-6 h-6 text-[#E34234]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Excel & CSV Import / Export
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Bulk import clients and invoices from spreadsheet files with live table validation and download structured CSV reports anytime.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#E34234]/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#E34234]/10 text-[#E34234] flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  ACID Concurrency Locks
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  InnoDB row-level locking via <code>SELECT ... FOR UPDATE</code> prevents race conditions and overpayment attempts during concurrent settlements.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#E34234]/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-[#E34234]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Streaming Vector PDFs
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pure Node.js vector streaming engine generates high-fidelity branded PDF invoices in ~6ms without heavy browser dependencies.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#E34234]/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#E34234]/10 text-[#E34234] flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Multi-Tenant Isolation
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Strict user-scoped relational boundaries protect client databases and financial records against IDOR / BOLA vulnerabilities.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#E34234]/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center mb-6">
                  <CreditCard className="w-6 h-6 text-[#E34234]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Immutable Payment Ledger
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Complete audit trail with payment methods (NEFT, UPI, Cards, Cash), foreign key restrictions, and automated status transitions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Ready to upgrade your invoicing workflow?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
              Get started in seconds with modern INR billing, client management, and instant PDF generation.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-2xl shadow-lg shadow-[#E34234]/30 transition-all cursor-pointer"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-slate-200 bg-white/10 hover:bg-white/20 rounded-2xl transition-all cursor-pointer"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D16] py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span>— Web-Based Billing & Invoice Management System</span>
          </div>
          <div>Standardized Indian Rupee (INR ₹) Architecture</div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
