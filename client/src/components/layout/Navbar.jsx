import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  LogOut,
  Building2,
  User,
  LayoutDashboard,
  Receipt,
  Users,
  PlusCircle,
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  const navItemClass = ({ isActive }) =>
    `inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
      isActive
        ? 'bg-blue-50 text-blue-700 shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                QuikInvoice
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wide">
                Billing
              </span>
            </div>
          </Link>

          {/* Primary Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-1.5">
              <NavLink to="/dashboard" className={navItemClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/invoices" className={navItemClass}>
                <Receipt className="w-4 h-4" />
                <span>Invoices</span>
              </NavLink>
              <NavLink to="/clients" className={navItemClass}>
                <Users className="w-4 h-4" />
                <span>Clients</span>
              </NavLink>
            </nav>
          )}
        </div>

        {/* User Info & Actions */}
        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/invoices/new"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>

            <div className="text-right hidden lg:block">
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 justify-end">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {user.business_name}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                <User className="w-3 h-3 text-slate-400" />
                {user.email}
              </div>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-700 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all duration-150 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Navigation bar */}
      {user && (
        <div className="md:hidden border-t border-slate-200/70 bg-slate-50/70 px-4 py-2 flex items-center justify-around">
          <NavLink to="/dashboard" className={navItemClass}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/invoices" className={navItemClass}>
            <Receipt className="w-4 h-4" />
            <span>Invoices</span>
          </NavLink>
          <NavLink to="/clients" className={navItemClass}>
            <Users className="w-4 h-4" />
            <span>Clients</span>
          </NavLink>
        </div>
      )}
    </header>
  );
}

export default Navbar;
