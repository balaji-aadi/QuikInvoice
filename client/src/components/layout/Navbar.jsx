import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../common/Logo';
import { UserProfileModal } from '../profile/UserProfileModal';
import {
  FileText,
  LogOut,
  Building2,
  User,
  LayoutDashboard,
  Users,
  PlusCircle,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const navItemClass = ({ isActive }) =>
    `inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-150 ${
      isActive
        ? 'bg-[#E34234]/10 text-[#E34234] dark:bg-[#E34234]/20 shadow-xs'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
    }`;

  const initials = (user?.business_name || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <header className="bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <Logo size="md" />
            </Link>

            {/* Primary Navigation */}
            {user && (
              <nav className="hidden md:flex items-center gap-1.5">
                <NavLink to="/dashboard" className={navItemClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/invoices" className={navItemClass}>
                  <FileText className="w-4 h-4" />
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
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-90 duration-200" />
              )}
            </button>

            {user ? (
              <>
                <Link
                  to="/invoices/new"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl shadow-sm shadow-[#E34234]/20 hover:shadow-md transition-all duration-150 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Invoice</span>
                </Link>

                {/* Profile Trigger Button */}
                <button
                  onClick={() => setProfileModalOpen(true)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-left"
                  title="View Company Profile & Settings"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#E34234] to-[#FF6B5B] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    {initials}
                  </div>
                  <div className="hidden lg:block leading-tight">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                      {user.business_name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span>Profile & Settings</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#E34234] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl shadow-xs transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        {user && (
          <div className="md:hidden border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-4 py-2 flex items-center justify-around text-xs">
            <NavLink to="/dashboard" className={navItemClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/invoices" className={navItemClass}>
              <FileText className="w-4 h-4" />
              <span>Invoices</span>
            </NavLink>
            <NavLink to="/clients" className={navItemClass}>
              <Users className="w-4 h-4" />
              <span>Clients</span>
            </NavLink>
            <Link
              to="/invoices/new"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-[#E34234] rounded-lg shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
            </Link>
          </div>
        )}
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}

export default Navbar;
