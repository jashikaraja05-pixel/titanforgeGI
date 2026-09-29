import React from 'react';
import { GeminiSentimentAnalysisResult } from '../../services/sentimentService';
import {
  Sparkles,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  Star,
  RefreshCw,
  ThumbsUp,
  AlertCircle,
  BrainCircuit,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';

interface SentimentSummaryCardProps {
  sentiment: GeminiSentimentAnalysisResult | null;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenFullDashboard?: () => void;
  compact?: boolean;
}

export const SentimentSummaryCard: React.FC<SentimentSummaryCardProps> = ({
  sentiment,
  isLoading,
  onRefresh,
  onOpenFullDashboard,
  compact = false,
}) => {
  if (!sentiment && isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-[#090b12] border border-white/10 flex flex-col items-center justify-center gap-3 animate-pulse">
        <RefreshCw className="w-6 h-6 text-red-400 animate-spin" />
        <span className="text-xs font-mono text-slate-400">
          Analyzing public feedback comments via Gemini 3.8 Flash...
        </span>
      </div>
    );
  }

  if (!sentiment) return null;

  const isPositive = sentiment.overallSentiment === 'POSITIVE';
  const isNeutral = sentiment.overallSentiment === 'NEUTRAL' || sentiment.overallSentiment === 'MIXED';

  const sentimentColor = isPositive
    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
    : isNeutral
    ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
    : 'text-rose-400 border-rose-500/40 bg-rose-500/10';

  const SentimentIcon = isPositive ? Smile : isNeutral ? Meh : Frown;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        isPositive
          ? 'bg-gradient-to-br from-[#07130f] via-[#090b14] to-[#0d0914] border-emerald-500/30 shadow-[0_0_35px_rgba(16,185,129,0.15)]'
          : 'bg-gradient-to-br from-[#140b07] via-[#090b14] to-[#0d0914] border-amber-500/30 shadow-[0_0_35px_rgba(245,158,11,0.15)]'
      } ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-7'}`}
    >
      {/* Decorative ambient top glow */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isPositive
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
            : 'bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500'
        }`}
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <BrainCircuit className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                <span>Citizen Sentiment Intelligence</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/40 text-[10px] font-mono flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-red-400" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Based on {sentiment.analyzedCommentsCount} verified citizen & officer feedback reviews
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition-all disabled:opacity-50 cursor-pointer"
            title="Re-run Gemini AI sentiment analysis on latest comments"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Analyzing...' : 'Re-Analyze'}</span>
          </button>

          {onOpenFullDashboard && compact && (
            <button
              onClick={onOpenFullDashboard}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-xs font-bold text-red-200 border border-red-500/40 transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.3)]"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
        {/* Overall Sentiment Badge */}
        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl border flex items-center justify-center ${sentimentColor}`}>
            <SentimentIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Overall Pulse
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {sentiment.sentimentScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
              <span
                className={`ml-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${sentimentColor}`}
              >
                {sentiment.overallSentiment}
              </span>
            </div>
          </div>
        </div>

        {/* Civic Satisfaction Index */}
        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Satisfaction Index
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {sentiment.civicSatisfactionIndex.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 5.0</span>
              <div className="flex items-center gap-0.5 ml-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= Math.round(sentiment.civicSatisfactionIndex)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Community Trust & Positive Momentum */}
        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Approval Ratio
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                {sentiment.positivePercentage}%
              </span>
              <span className="text-[11px] text-slate-400">Positive Comments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tri-Color Horizontal Distribution Bar */}
      <div className="mb-5 space-y-1.5 bg-black/40 p-3.5 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Positive ({sentiment.positivePercentage}%)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Constructive / Neutral ({sentiment.neutralPercentage}%)
          </span>
          <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Urgent / Critical ({sentiment.negativePercentage}%)
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${sentiment.positivePercentage}%` }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
            title={`Positive: ${sentiment.positivePercentage}%`}
          />
          <div
            style={{ width: `${sentiment.neutralPercentage}%` }}
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700"
            title={`Neutral: ${sentiment.neutralPercentage}%`}
          />
          <div
            style={{ width: `${sentiment.negativePercentage}%` }}
            className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-700"
            title={`Critical: ${sentiment.negativePercentage}%`}
          />
        </div>
      </div>

      {/* AI Executive Summary */}
      <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Gemini Executive Civic Summary</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Updated {new Date(sentiment.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
          {sentiment.executiveSummary}
        </p>
      </div>

      {/* Two Column Praises vs Concerns */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Top Praises */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2.5">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Key Citizen Praises</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {sentiment.topPraises.map((praise, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{praise}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Concerns */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2.5">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Critical Community Follow-Ups</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {sentiment.topConcerns.map((concern, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Key Emotions Pills */}
      {sentiment.keyEmotions && sentiment.keyEmotions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <HeartHandshake className="w-3 h-3 text-red-400" />
            Civic Emotions:
          </span>
          {sentiment.keyEmotions.map((emo, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-1.5"
            >
              <span className="text-slate-200">{emo.emotion}</span>
              <span className="font-mono text-[10px] text-amber-400 font-bold">
                {emo.percentage}%
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
