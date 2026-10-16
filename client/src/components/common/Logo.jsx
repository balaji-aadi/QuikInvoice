export function Logo({ size = 'md', showText = true, className = '' }) {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', badge: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-xl', badge: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', badge: 'text-xs' },
  };

  const { icon, text, badge } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon Emblem */}
      <div
        className={`${icon} rounded-xl bg-gradient-to-br from-[#E34234] to-[#C02B1D] p-1.5 shadow-md shadow-[#E34234]/25 flex items-center justify-center text-white shrink-0 transition-transform duration-200 group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Base Document Outline */}
          <path
            d="M6 3H15L19 7V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V4C5 3.44772 5.44772 3 6 3Z"
            fill="#0F172A"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Folded Corner */}
          <path
            d="M15 3V7H19"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Invoice Lines */}
          <path
            d="M8 10H13M8 14H11"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Lightning / Speed Accent */}
          <path
            d="M16 11L12.5 16H15L14 20L18 14.5H15.5L16 11Z"
            fill="#E34234"
            stroke="white"
            strokeWidth="1"
            strokeLinejoin="round"
          />
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
