import { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react';

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'How does QuikInvoice handle Indian GST and Rupee (INR ₹) computations?',
      a: 'All calculations are executed server-authoritatively in integer paise (100 paise = ₹1.00) using strict ceiling math. This mathematically eliminates IEEE-754 floating-point drift. All standard Indian GST tax slabs (0% Nil, 5%, 12%, 18%, 28%) are calculated per line item and itemized on the final tax breakdown.',
    },
    {
      q: 'Can I import and export my existing clients and invoices using Excel / CSV?',
      a: 'Yes! QuikInvoice includes a complete CSV/Excel data pipeline. You can download pre-formatted CSV templates for both Clients and Invoices, upload hundreds of rows at once with schema validation, and export your entire financial ledger with a single click.',
    },
    {
      q: 'How fast is vector PDF invoice generation?',
      a: 'QuikInvoice uses a native Node.js vector streaming engine that compiles high-fidelity, branded PDF documents directly to HTTP response buffers in ~6 milliseconds, avoiding the memory bloat and latency of headless Chromium browsers.',
    },
    {
      q: 'How is transactional integrity maintained during concurrent payments?',
      a: 'Every payment settlement executes within an explicit MySQL InnoDB database transaction guarded by row-level locking (SELECT ... FOR UPDATE). This prevents double settlements, overpayments, and race conditions during simultaneous payment operations.',
    },
    {
      q: 'Is my business data secure and isolated from other tenants?',
      a: 'Strict multi-tenant relational scoping (user_id isolation) is enforced at the database query layer. Authenticated sessions use HttpOnly, SameSite cookies with token-version tracking for instant server-side revocation.',
    },
    {
      q: 'What payment methods are supported for recording settlements?',
      a: 'You can record payments across Bank Wire (NEFT / RTGS / IMPS), UPI, Credit/Debit Card, Cheque, and Cash, complete with optional transaction reference numbers and accounting audit notes.',
    },
  ];

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
                <span>Sign In</span>
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
                    GST 18%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-b border-slate-100 dark:border-slate-800 text-sm">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Billed To
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Reliance Digital Retail Ltd</div>
                  <div className="text-slate-500 text-xs mt-0.5">finance@reliancedigital.in</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Issue Date
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">16 Oct 2026</div>
                  <div className="text-slate-500 text-xs mt-0.5">Due: 30 Oct 2026</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Total Amount Due
                  </div>
                  <div className="font-mono text-2xl font-black text-[#E34234]">
                    ₹1,47,500.00
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">₹0.00 Paid • Fully Outstanding</div>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span>Includes 18% IGST</span>
                  <span>•</span>
                  <span>Pure Node.js Vector Engine</span>
                </div>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 font-bold text-[#E34234] hover:text-[#CB3528]"
                >
                  <span>Generate Your Own Invoice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-20 bg-slate-50/60 dark:bg-[#0C1220] border-y border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#E34234] mb-3">
                Built For Real-World Financial Reliability
              </h2>
              <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Everything required to bill, collect, and reconcile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#E34234]/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#E34234]/10 text-[#E34234] flex items-center justify-center mb-6">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  INR & Integer Paise Math
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Calculations convert rupees to integer paise, apply tax rates per item with ceiling math, eliminating floating-point rounding discrepancies.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#E34234]/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center mb-6">
                  <FileSpreadsheet className="w-6 h-6 text-[#E34234]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Excel & CSV Data Sync
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Bulk import clients and invoices from spreadsheet software, download ready-to-use CSV templates, and export complete audit trails.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#E34234]/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#E34234]/10 text-[#E34234] flex items-center justify-center mb-6">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Row-Locking Concurrency
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  MySQL InnoDB row locks guarantee that payments made concurrently never exceed total amounts due or produce race conditions.
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

        {/* Interactive FAQ Section */}
        <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E34234]/10 text-[#E34234] text-xs font-bold uppercase tracking-wider mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Frequently Asked Questions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Everything you need to know
            </h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Clear answers regarding our billing architecture, data privacy, and GST compliance.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full py-4.5 px-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white hover:text-[#E34234] dark:hover:text-[#E34234] transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    <span className="shrink-0 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
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

      {/* Comprehensive Multi-Column Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070A10] text-slate-600 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1: Brand */}
            <div className="space-y-4 md:col-span-1">
              <Logo size="md" />
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                High-performance invoice and billing portal engineered with server-authoritative INR calculations, streaming vector PDFs, and Excel data sync.
              </p>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* Col 2: Product Modules */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Product
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/login" className="hover:text-[#E34234] transition-colors">
                    Dashboard Overview
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#E34234] transition-colors">
                    Client Management
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#E34234] transition-colors">
                    Invoice Creation & Drafting
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#E34234] transition-colors">
                    Streaming Vector PDFs
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#E34234] transition-colors">
                    Bulk Excel / CSV Sync
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Architecture & Security */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Architecture & Security
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Multi-Tenant Relational Isolation</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#E34234]" />
                  <span>InnoDB Row-Level Locking</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  <span>Server-Authoritative Integer Math</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>HttpOnly JWT Cookie Revocation</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Compliance & Standards */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Compliance
              </h4>
              <ul className="space-y-2 text-xs">
                <li>Indian Rupee (INR ₹) Standard</li>
                <li>GST Breakdown (CGST, SGST, IGST)</li>
                <li>Paise-Precision Financial Rounding</li>
                <li>RESTful API & CSRF Guard</li>
                <li>ISO 8601 Audit Timestamps</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div>
              © 2026 QuikInvoice Technologies. Built with pride for Indian & global enterprises.
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-[#E34234] cursor-pointer">Privacy Policy</span>
              <span className="hover:text-[#E34234] cursor-pointer">Terms of Service</span>
              <span className="hover:text-[#E34234] cursor-pointer">Security Protocol</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
