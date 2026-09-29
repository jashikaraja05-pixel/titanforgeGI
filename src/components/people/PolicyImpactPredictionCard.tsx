import React, { useState, useEffect } from 'react';
import { GovernmentPolicy, PolicyCitizenImpact, CitizenInterestsProfile } from '../../types';
import { PolicyImpactBadge } from './PolicyImpactBadge';
import { PolicyVoiceFeedbackModal } from './PolicyVoiceFeedbackModal';
import {
  predictPolicyImpact,
  getCachedPolicyImpact,
} from '../../services/policyImpactService';
import {
  playPolicySpeech,
  stopPolicySpeech,
  subscribePolicySpeech,
  getPolicySpeechState,
} from '../../services/policySpeechService';
import {
  BrainCircuit,
  Sparkles,
  MapPin,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Clock,
  ArrowRight,
  Flame,
  Zap,
  Mic,
  MessageSquare,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface PolicyImpactPredictionCardProps {
  policy: GovernmentPolicy;
  citizenInterests?: CitizenInterestsProfile;
  initialImpact?: PolicyCitizenImpact;
  isExpandedDefault?: boolean;
  onSelect?: (policy: GovernmentPolicy) => void;
  preferredLangCode?: string;
}

export const PolicyImpactPredictionCard: React.FC<PolicyImpactPredictionCardProps> = ({
  policy,
  citizenInterests,
  initialImpact,
  isExpandedDefault = false,
  onSelect,
  preferredLangCode = 'en',
}) => {
  const [impact, setImpact] = useState<PolicyCitizenImpact | null>(
    initialImpact || getCachedPolicyImpact(policy.id)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(isExpandedDefault);
  const [isFullGazetteOpen, setIsFullGazetteOpen] = useState<boolean>(false);
  const [isVoiceFeedbackOpen, setIsVoiceFeedbackOpen] = useState<boolean>(false);
  const [speechState, setSpeechState] = useState(getPolicySpeechState);

  useEffect(() => {
    const unsub = subscribePolicySpeech(setSpeechState);
    return () => unsub();
  }, []);

  const isSpeakingThisPolicy = speechState.isPlaying && speechState.policyId === policy.id;

  const handleToggleSpeech = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeakingThisPolicy) {
      stopPolicySpeech();
    } else {
      playPolicySpeech({
        policy,
        impact,
        langCode: preferredLangCode || 'en',
      });
    }
  };

  // Automatically predict impact if not cached
  useEffect(() => {
    const cached = getCachedPolicyImpact(policy.id);
    if (cached) {
      setImpact(cached);
    } else {
      setIsLoading(true);
      predictPolicyImpact(policy, citizenInterests)
        .then((res) => setImpact(res))
        .catch((err) => console.warn('Prediction error:', err))
        .finally(() => setIsLoading(false));
    }

    const handleUpdate = (e: any) => {
      if (e.detail && e.detail.policyId === policy.id) {
        setImpact(e.detail);
      }
    };
    window.addEventListener('govinsight_policy_impact_updated', handleUpdate);
    return () => {
      window.removeEventListener('govinsight_policy_impact_updated', handleUpdate);
    };
  }, [policy.id, policy, citizenInterests]);

  const handleRecalculate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      const res = await predictPolicyImpact(policy, citizenInterests);
      setImpact(res);
    } catch (err) {
      console.warn('Re-prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isUrgent = policy.priority === 'URGENT';
  const score = impact?.potentialImpactScore || 'Medium';
  const numericScore = impact?.numericScore || 50;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        score === 'High'
          ? 'bg-gradient-to-r from-red-950/30 via-[#0e0b12] to-slate-950 border-red-500/40 hover:border-red-500/70 shadow-[0_4px_25px_rgba(239,68,68,0.15)]'
          : score === 'Medium'
          ? 'bg-gradient-to-r from-amber-950/20 via-[#0d0f17] to-slate-950 border-amber-500/30 hover:border-amber-500/50'
          : 'bg-[#0b0d14] border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top Banner Bar for High Impact Alert */}
      {score === 'High' && (
        <div className="bg-gradient-to-r from-red-600/30 via-rose-600/20 to-red-500/10 px-4 py-1.5 border-b border-red-500/30 flex items-center justify-between text-[11px] font-mono text-red-300">
          <span className="flex items-center gap-1.5 font-bold">
            <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>DIRECT HIGH IMPACT ON YOUR CIVIC PRIORITIES</span>
          </span>
          <span className="text-[10px] text-red-400/80">Gemini Predictive Score: {numericScore}/100</span>
        </div>
      )}

      {/* Main Header Card Area */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <PolicyImpactBadge score={score} numericScore={numericScore} size="md" />

              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                  isUrgent
                    ? 'bg-red-600/40 text-red-300 border border-red-500/50'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {policy.priority} DIRECTIVE
              </span>

              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400 capitalize">
                {policy.category}
              </span>

              {impact?.source === 'gemini-3.8-flash' && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                  Gemini Analyzed
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug pt-0.5">
              {policy.title}
            </h3>

            {/* Metadata Line */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 pt-0.5">
              <span className="text-slate-300 font-semibold">{policy.department}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-3 h-3 text-red-400" />
                <span>
                  {policy.affectedDistrict ? `${policy.affectedDistrict}, ` : ''}
                  {policy.affectedState}
                </span>
              </span>
              <span>•</span>
              <span className="text-slate-500 font-mono text-[11px]">
                {new Date(policy.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Listen Aloud via Web Speech API (SpeechSynthesis) */}
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isSpeakingThisPolicy
                  ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse'
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/40 hover:text-white shadow-[0_0_8px_rgba(59,130,246,0.2)]'
              }`}
              title="Listen to policy summary and AI insights read aloud using SpeechSynthesis API (optimized for Tamil)"
            >
              {isSpeakingThisPolicy ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-white" />
                  <span>Stop Speech</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">
                    {preferredLangCode === 'ta' ? 'கேளுங்கள் (Listen)' : 'Listen Aloud'}
                  </span>
                  <span className="sm:hidden">Listen</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsVoiceFeedbackOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)]"
              title="Speak your feedback on this policy using Web Speech API"
            >
              <Mic className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="hidden sm:inline">Voice Feedback</span>
              <span className="sm:hidden">Feedback</span>
            </button>
            <button
              onClick={handleRecalculate}
              disabled={isLoading}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
              title="Recalculate impact using Gemini API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
            </button>
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
              title={isExpanded ? 'Collapse analysis' : 'Expand full AI predictive analysis'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Predictive AI Impact Summary Callout */}
        <div className="mt-3.5 p-3 sm:p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-red-300">
              <BrainCircuit className="w-3.5 h-3.5 text-red-400" />
              <span>Predictive Impact for Your Profile:</span>
            </span>
            <span
              className={`font-mono text-[11px] ${
                score === 'High' ? 'text-red-400' : score === 'Medium' ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {score} Priority Impact ({numericScore}/100)
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {isLoading ? (
              <span className="flex items-center gap-2 text-slate-400 py-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                <span>Evaluating against citizen stated interests via Gemini API...</span>
              </span>
            ) : (
              impact?.impactSummary || policy.summary
            )}
          </p>

          {/* Matched Interests Tags */}
          {impact?.relevantInterestMatches && impact.relevantInterestMatches.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-mono">Matched Interests:</span>
              {impact.relevantInterestMatches.map((match) => (
                <span
                  key={match}
                  className="px-2 py-0.5 rounded-md bg-red-950/40 text-red-300 border border-red-500/30 text-[10px] font-mono"
                >
                  ✓ {match}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Expanded View */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3.5 animate-fade-in text-xs">
            {/* Key Benefits Grid */}
            {impact?.keyBenefits && impact.keyBenefits.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Key Positive Benefits for You:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {impact.keyBenefits.map((b, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-slate-200 text-xs flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Steps for Citizen */}
            {impact?.actionSteps && impact.actionSteps.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Actionable Steps for Citizen:</span>
                </h4>
                <div className="space-y-1.5">
                  {impact.actionSteps.map((step, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-slate-200 text-xs flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Gazette Directive Full Text */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsFullGazetteOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isFullGazetteOpen ? 'Hide Full Gazette Directive' : 'Read Full Official Gazette Directive'}</span>
                {isFullGazetteOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {isFullGazetteOpen && policy.fullContent && (
                <div className="mt-2 p-3.5 rounded-xl bg-black/60 border border-white/10 text-slate-300 text-xs leading-relaxed whitespace-pre-line animate-fade-in font-mono">
                  {policy.fullContent}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Policy Voice Feedback Modal (Web Speech API) */}
        <PolicyVoiceFeedbackModal
          isOpen={isVoiceFeedbackOpen}
          onClose={() => setIsVoiceFeedbackOpen(false)}
          policy={policy}
        />
      </div>
    </div>
  );
};
