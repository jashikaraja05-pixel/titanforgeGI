import React from 'react';

interface GovInsightLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const GovInsightLogo: React.FC<GovInsightLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const iconSizes = {
    sm: { height: 28, text: 'text-xl', sub: 'text-[9px]' },
    md: { height: 36, text: 'text-2xl', sub: 'text-[11px]' },
    lg: { height: 48, text: 'text-4xl', sub: 'text-xs' },
    xl: { height: 64, text: 'text-5xl md:text-6xl', sub: 'text-sm' },
  };

  const current = iconSizes[size];

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <div className="flex items-center gap-2">
        {/* Futuristic Civic Global Emblem */}
        <div className="relative flex items-center justify-center">
          <svg
            width={current.height}
            height={current.height}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-[0_0_12px_rgba(239,68,68,0.65)]"
          >
            {/* Outer Cybernetic Circuit Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="8 4 2 4"
              strokeOpacity="0.75"
            />
            {/* Inner Ring */}
            <circle
              cx="50"
              cy="50"
              r="36"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
            />
            {/* Central Node / Shield / Diamond Core */}
            <polygon
              points="50,18 78,50 50,82 22,50"
              fill="url(#coreGradient)"
              stroke="#ff3344"
              strokeWidth="2.5"
            />
            {/* Compass / Location Vector Pointer */}
            <polygon
              points="50,24 66,50 50,44"
              fill="#ffffff"
            />
            <polygon
              points="50,24 34,50 50,44"
              fill="#ef4444"
            />
            <polygon
              points="50,76 66,50 50,56"
              fill="#ef4444"
            />
            <polygon
              points="50,76 34,50 50,56"
              fill="#ffffff"
            />
            {/* Connected People Nodes on Cardinal points */}
            <circle cx="50" cy="8" r="4" fill="#ef4444" />
            <circle cx="92" cy="50" r="4" fill="#ffffff" />
            <circle cx="50" cy="92" r="4" fill="#ef4444" />
            <circle cx="8" cy="50" r="4" fill="#ffffff" />
            {/* Connection Arcs */}
            <line x1="50" y1="12" x2="50" y2="18" stroke="#ef4444" strokeWidth="2" />
            <line x1="88" y1="50" x2="78" y2="50" stroke="#ffffff" strokeWidth="2" />
            <line x1="50" y1="88" x2="50" y2="82" stroke="#ef4444" strokeWidth="2" />
            <line x1="12" y1="50" x2="22" y2="50" stroke="#ffffff" strokeWidth="2" />

            <defs>
              <linearGradient id="coreGradient" x1="22" y1="18" x2="78" y2="82" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1a0406" />
                <stop offset="0.5" stopColor="#3d090d" />
                <stop offset="1" stopColor="#7f1d1d" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Wordmark */}
        <div className="flex items-baseline tracking-tight font-black font-sans">
          <span className={`${current.text} text-white font-extrabold tracking-wider`}>
            GOV
          </span>
          <span
            className={`${current.text} font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-rose-600 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]`}
          >
            INSIGHT
          </span>
        </div>
      </div>

      {showTagline && (
        <div className="mt-1 flex items-center gap-1.5 pl-1 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <p className={`${current.sub} font-medium tracking-wide uppercase text-slate-300/80`}>
            Your Voice. Your Place. Your Impact.
          </p>
        </div>
      )}
    </div>
  );
};
