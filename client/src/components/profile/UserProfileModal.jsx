import { useState } from 'react';
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  LogOut,
  Moon,
  Sun,
  IndianRupee,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export function UserProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  if (!isOpen || !user) return null;

  const initials = (user.business_name || user.email || 'QI')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden">
        {/* Profile Header Banner */}
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E34234] to-[#FF6B5B] flex items-center justify-center text-white text-xl font-black shadow-lg shadow-[#E34234]/30 border-2 border-white/20">
              {initials}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E34234]/20 text-[#FF6B5B] border border-[#E34234]/30 text-[10px] font-bold uppercase tracking-wider mb-1">
                Verified Tenant
              </div>
              <h2 className="text-xl font-extrabold text-white">{user.business_name}</h2>
              <p className="text-xs text-slate-300 font-mono">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-5">
          {/* Company Details Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Organization Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Company Name</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {user.business_name}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Account Email</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {user.email}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone Number</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {user.business_phone || '+91 Not configured'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                  <IndianRupee className="w-3.5 h-3.5 text-[#E34234]" />
                  <span>Base Currency</span>
                </div>
                <div className="font-semibold text-[#E34234]">
                  INR (₹) — Indian Rupee
                </div>
              </div>
            </div>
          </div>

          {/* Security & Multi-Tenant Isolation Status */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Multi-Tenant Security
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Tenant ID Isolation:
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  Tenant #{user.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  JWT Token Version:
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  v{user.token_version || 1} (Server Invalidation Ready)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Session Cookie:
                </span>
                <span className="text-emerald-600 font-semibold">
                  HttpOnly / SameSite=Lax (Active)
                </span>
              </div>
            </div>
          </div>

          {/* Theme Toggle in Profile */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              {isDark ? <Moon className="w-4 h-4 text-[#E34234]" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>Interface Appearance</span>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:text-[#E34234] transition-colors"
            >
              {isDark ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
            </button>
          </div>
        </div>

        {/* Profile Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfileModal;
