import React from 'react';
import { PotentialImpactScore } from '../../types';
import { Flame, Shield, Info, Zap, Sparkles } from 'lucide-react';

interface PolicyImpactBadgeProps {
  score: PotentialImpactScore | undefined;
  numericScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumeric?: boolean;
  className?: string;
}

export const PolicyImpactBadge: React.FC<PolicyImpactBadgeProps> = ({
  score = 'Medium',
  numericScore,
  size = 'md',
  showNumeric = true,
  className = '',
}) => {
  const isHigh = score === 'High';
  const isMedium = score === 'Medium';
  const isLow = score === 'Low';

  let colorClasses = '';
  let Icon = Info;

  if (isHigh) {
    colorClasses =
      'bg-gradient-to-r from-red-600/30 via-rose-600/30 to-red-500/20 text-red-300 border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.35)]';
    Icon = Flame;
  } else if (isMedium) {
    colorClasses =
      'bg-gradient-to-r from-amber-500/25 to-yellow-500/15 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]';
    Icon = Zap;
  } else {
    colorClasses =
      'bg-slate-800/60 text-slate-300 border-slate-700/60';
    Icon = Info;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : size === 'lg'
      ? 'px-3 py-1.5 text-xs gap-1.5'
      : 'px-2.5 py-1 text-[11px] gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-mono font-black tracking-wide uppercase transition-all ${sizeClasses} ${colorClasses} ${className}`}
      title={`AI Potential Impact Score: ${score} (${numericScore ? `${numericScore}/100` : ''}) based on your stated civic interests`}
    >
      <Icon
        className={`${
          size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'
        } ${isHigh ? 'animate-pulse text-red-400' : isMedium ? 'text-amber-400' : 'text-slate-400'}`}
      />
      <span>{score} Impact</span>
      {showNumeric && numericScore !== undefined && (
        <span
          className={`px-1 py-0.2 rounded text-[9px] font-bold ${
            isHigh ? 'bg-red-500/30 text-white' : isMedium ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-700/50 text-slate-300'
          }`}
        >
          {numericScore}
        </span>
      )}
    </span>
  );
};
