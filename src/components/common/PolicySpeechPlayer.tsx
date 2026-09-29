import React, { useState, useEffect } from 'react';
import {
  subscribePolicySpeech,
  getPolicySpeechState,
  pausePolicySpeech,
  resumePolicySpeech,
  stopPolicySpeech,
  setPolicySpeechRate,
  PolicySpeechState,
} from '../../services/policySpeechService';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Sparkles,
  Languages,
  X,
  ChevronUp,
  ChevronDown,
  Gauge,
  Radio,
  FileText,
} from 'lucide-react';

export const PolicySpeechPlayer: React.FC = () => {
  const [speechState, setSpeechState] = useState<PolicySpeechState>(getPolicySpeechState);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribePolicySpeech((newState) => {
      setSpeechState(newState);
    });
    return () => unsubscribe();
  }, []);

  if (!speechState.isPlaying && !speechState.isPaused) {
    return null;
  }

  const isTamil = speechState.langCode === 'ta';
  const progressPercent =
    speechState.totalSentences > 0
      ? Math.round((speechState.sentenceIndex / speechState.totalSentences) * 100)
      : 0;

  const handleRateChange = (newRate: number) => {
    setPolicySpeechRate(newRate);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-50 animate-slide-up">
      <div className="bg-[#0b0d17]/95 backdrop-blur-xl border border-blue-500/40 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)] overflow-hidden">
        {/* Progress Bar Top Strip */}
        <div className="w-full bg-white/5 h-1">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Player Header */}
        <div className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Animated Sound Wave Indicator */}
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              {speechState.isPlaying && !speechState.isPaused ? (
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-1 bg-blue-400 rounded-full animate-pulse h-full" />
                  <span className="w-1 bg-blue-400 rounded-full animate-pulse h-2" />
                  <span className="w-1 bg-blue-400 rounded-full animate-pulse h-3" />
                  <span className="w-1 bg-blue-400 rounded-full animate-pulse h-1.5" />
                </div>
              ) : (
                <Volume2 className="w-4 h-4 text-slate-400" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                  {isTamil ? '🇮🇳 தமிழ் SpeechSynthesis' : `${speechState.langCode.toUpperCase()} TTS`}
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  Part {speechState.sentenceIndex} of {speechState.totalSentences}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white truncate max-w-[240px] sm:max-w-[320px]">
                {speechState.policyTitle || 'Policy Briefing'}
              </h4>
            </div>
          </div>

          {/* Quick Player Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {speechState.isPaused ? (
              <button
                type="button"
                onClick={resumePolicySpeech}
                className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                title="Resume reading"
              >
                <Play className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={pausePolicySpeech}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Pause reading"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={stopPolicySpeech}
              className="w-8 h-8 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Stop speech"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand sentence script'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Sentence Live Reader & Controls */}
        {isExpanded && (
          <div className="p-3 sm:p-4 space-y-3 bg-black/40">
            {/* Live Highlighted Sentence */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-400" />
                <span>Now Reading (தற்போதைய வாக்கியம்):</span>
              </span>
              <p className="text-xs sm:text-sm text-blue-200 font-sans leading-relaxed select-text font-medium">
                "{speechState.currentSentence}"
              </p>
            </div>

            {/* Bottom Controls: Speed & Active Voice Driver */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono">Speed:</span>
                {[0.8, 0.9, 1.0, 1.15].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => handleRateChange(speed)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      speechState.rate === speed
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                <Radio className="w-3 h-3 text-emerald-400" />
                <span className="truncate">{speechState.activeVoiceName || 'SpeechSynthesis Engine'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
