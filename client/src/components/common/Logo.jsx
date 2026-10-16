export function Logo({ size = 'md', showText = true, className = '' }) {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', badge: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-xl', badge: 'text-[10px]' },
    lg: { icon: 'w-11 h-11', text: 'text-2xl', badge: 'text-xs' },
  };

  const { icon, text, badge } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Minimalist Modern Logo Emblem */}
      <div
        className={`${icon} rounded-xl bg-[#E34234] p-1.5 shadow-sm shadow-[#E34234]/20 flex items-center justify-center text-white shrink-0 transition-transform duration-150 hover:scale-105`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          <circle cx="11.5" cy="11.5" r="7" stroke="currentColor" strokeWidth="2.75" />
          <path d="M16.5 16.5L20.5 20.5" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight text-slate-900 dark:text-white ${text}`}>
            Quik<span className="text-[#E34234]">Invoice</span>
          </span>
          <span
            className={`hidden sm:inline-block font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#E34234]/10 text-[#E34234] border border-[#E34234]/20 ${badge}`}
          >
            INR ₹
          </span>
        </div>
      )}
    </div>
  );
}

export default Logo;
