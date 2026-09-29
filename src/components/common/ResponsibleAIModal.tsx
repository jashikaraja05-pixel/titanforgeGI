import React from 'react';
import { Shield, Sparkles, X, CheckCircle, Lock, EyeOff, Users, Scale } from 'lucide-react';

interface ResponsibleAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsibleAIModal: React.FC<ResponsibleAIModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-red-500/40 p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                Digital Public Good Standard
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Responsible AI & Governance Architecture
            </h2>
          </div>
        </div>

        {/* Core Responsible AI Pledge Banner */}
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/50 text-xs text-red-200 leading-relaxed font-semibold">
          “AI-assisted decision support. Final civic and capital decisions strictly require authorized human review and sign-off.”
        </div>

        {/* 4 Pillars of Governance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Scale className="w-4 h-4 text-red-400" />
              <span>Human-In-The-Loop Oversight</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              AI provides categorization, multi-modal evidence parsing, and priority scoring, but cannot reallocate public funds or close civic work orders autonomously.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Under-Represented Equity Guard</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Eliminates the "Low Complaints = Low Need" bias. Incorporates geographic baseline infrastructure deficits so vulnerable communities without smartphones receive equal public service priority.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              <span>Privacy & Zero Citizen PII Leakage</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Public nearby maps display blurred, generalized coordinates and anonymized problem descriptors. Citizen names, phone numbers, and voice recordings remain protected on secure government channels.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Transparent 5-Factor Scoring</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              No black-box algorithms. Every case score (0-100) displays exact point contributions across Citizen Demand, Infrastructure Gap, Population Impact, Urgency, and Vulnerability.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">GOVINSIGHT GLOBAL AI INTEGRITY v2.4</span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
