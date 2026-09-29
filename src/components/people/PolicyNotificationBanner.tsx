import React, { useEffect, useState } from 'react';
import { GovernmentPolicy, PolicyCitizenImpact } from '../../types';
import {
  BellRing,
  X,
  ArrowRight,
  MapPin,
  Sparkles,
  BrainCircuit,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { playCivicAlertChime } from '../../services/policyService';
import { predictPolicyImpact, getCachedPolicyImpact } from '../../services/policyImpactService';
import {
  playPolicySpeech,
  stopPolicySpeech,
  subscribePolicySpeech,
  getPolicySpeechState,
} from '../../services/policySpeechService';
import { PolicyImpactBadge } from './PolicyImpactBadge';

interface PolicyNotificationBannerProps {
  policy: GovernmentPolicy | null;
  onViewPolicy: (policy: GovernmentPolicy) => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const PolicyNotificationBanner: React.FC<PolicyNotificationBannerProps> = ({
  policy,
  onViewPolicy,
  onDismiss,
  autoDismissMs = 12000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [impact, setImpact] = useState<PolicyCitizenImpact | null>(null);
  const [speechState, setSpeechState] = useState(getPolicySpeechState);

  useEffect(() => {
    const unsub = subscribePolicySpeech(setSpeechState);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (policy) {
      setIsVisible(true);
      // Play high-fidelity civic chime
      playCivicAlertChime();

      // Check or calculate predicted impact for this policy
      const cached = getCachedPolicyImpact(policy.id);
      if (cached) {
        setImpact(cached);
      } else {
        predictPolicyImpact(policy).then((res) => {
          setImpact(res);
        }).catch((err) => console.warn('Impact prediction notice:', err));
      }

      if (autoDismissMs > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300);
        }, autoDismissMs);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
      setImpact(null);
    }
  }, [policy, autoDismissMs, onDismiss]);

  if (!policy || !isVisible) return null;

  const isUrgent = policy.priority === 'URGENT';
  const impactScore = impact?.potentialImpactScore || 'Medium';

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md w-full transition-all duration-300 ease-out animate-slide-in-right">
      <div
        className={`p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl border flex flex-col gap-3 relative overflow-hidden ${
          impactScore === 'High' || isUrgent
            ? 'bg-gradient-to-r from-[#1c0808] via-[#150a0a] to-[#0e111a] border-red-500/70 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
            : 'bg-gradient-to-r from-[#171107] via-[#12141f] to-[#0e111a] border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
        }`}
      >
        {/* Pulsing Accent Glow Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            impactScore === 'High' || isUrgent
              ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-400'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400'
          }`}
        />

        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg flex items-center justify-center animate-bounce ${
                impactScore === 'High' || isUrgent
                  ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                  : 'bg-amber-600/30 text-amber-400 border border-amber-500/50'
              }`}
            >
              <BellRing className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider ${
                  isUrgent
                    ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                    : 'bg-amber-500 text-black font-bold'
                }`}
              >
                {policy.priority} POLICY ALERT
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live Gazette</span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 200);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Predictive Impact Badge Indicator */}
        {impact && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-black/50 border border-white/10">
            <div className="flex items-center gap-2">
              <PolicyImpactBadge score={impact.potentialImpactScore} numericScore={impact.numericScore} size="sm" />
              <span className="text-[11px] text-slate-300 font-sans">
                {impact.potentialImpactScore === 'High'
                  ? 'High priority for your stated interests'
                  : impact.potentialImpactScore === 'Medium'
                  ? 'Moderate relevance to your profile'
                  : 'Informational for your profile'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">Gemini AI</span>
          </div>
        )}

        {/* Title & Department */}
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-white leading-snug line-clamp-2">
            {policy.title}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="truncate max-w-[200px] text-slate-300 font-medium">{policy.department}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
              <MapPin className="w-3 h-3" />
              {policy.affectedDistrict || policy.affectedState}
            </span>
          </div>
        </div>

        {/* Short Summary */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-white/5">
          {impact?.impactSummary || policy.summary}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] font-mono text-slate-500">
            Gazette Ref: {policy.gazetteRef || 'OFFICIAL-2026'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (speechState.isPlaying && speechState.policyId === policy.id) {
                  stopPolicySpeech();
                } else {
                  playPolicySpeech({
                    policy,
                    impact,
                    langCode: 'ta',
                  });
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                speechState.isPlaying && speechState.policyId === policy.id
                  ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse'
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/40'
              }`}
              title="Listen to policy summary aloud (SpeechSynthesis)"
            >
              {speechState.isPlaying && speechState.policyId === policy.id ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-white" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>கேளுங்கள்</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 200);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Later
            </button>
            <button
              onClick={() => {
                setIsVisible(false);
                onViewPolicy(policy);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                impactScore === 'High' || isUrgent
                  ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              }`}
            >
              <span>View Policy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
