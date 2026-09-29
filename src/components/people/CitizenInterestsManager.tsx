import React, { useState, useEffect } from 'react';
import { CitizenInterestsProfile, AVAILABLE_CIVIC_INTERESTS, GovernmentPolicy } from '../../types';
import {
  getCitizenInterests,
  saveCitizenInterests,
} from '../../services/policyImpactService';
import {
  BrainCircuit,
  Check,
  Plus,
  Sparkles,
  Sliders,
  Save,
  HelpCircle,
  Tag,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CitizenInterestsManagerProps {
  userData?: any;
  policies?: GovernmentPolicy[];
  onInterestsUpdated?: (newInterests: CitizenInterestsProfile) => void;
  compact?: boolean;
}

export const CitizenInterestsManager: React.FC<CitizenInterestsManagerProps> = ({
  userData,
  policies = [],
  onInterestsUpdated,
  compact = false,
}) => {
  const [interests, setInterests] = useState<CitizenInterestsProfile>(() => getCitizenInterests(userData));
  const [selectedTopics, setSelectedTopics] = useState<string[]>(interests.topics || []);
  const [customText, setCustomText] = useState<string>(interests.customInterests || '');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);

  useEffect(() => {
    const current = getCitizenInterests(userData);
    setInterests(current);
    setSelectedTopics(current.topics || []);
    setCustomText(current.customInterests || '');
  }, [userData]);

  const toggleTopic = (topicLabel: string) => {
    setIsSaved(false);
    setSelectedTopics((prev) => {
      if (prev.includes(topicLabel)) {
        return prev.filter((t) => t !== topicLabel);
      } else {
        return [...prev, topicLabel];
      }
    });
  };

  const handleSave = () => {
    const updated: CitizenInterestsProfile = {
      ...interests,
      topics: selectedTopics,
      customInterests: customText.trim(),
      district: userData?.district || interests.district,
      state: userData?.state || interests.state,
      ward: userData?.ward || interests.ward,
    };
    saveCitizenInterests(updated);
    setInterests(updated);
    setIsSaved(true);
    onInterestsUpdated?.(updated);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Quick statistics
  const matchingPoliciesCount = policies.filter((p) => {
    const text = `${p.title} ${p.summary} ${p.category}`.toLowerCase();
    return selectedTopics.some((t) => text.includes(t.toLowerCase().split(' ')[0]));
  }).length;

  return (
    <div className="rounded-2xl border border-red-500/25 bg-gradient-to-br from-[#0c0e17] via-[#090b12] to-[#120b15] shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer border-b border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        onClick={() => compact && setIsExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/30 to-amber-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <BrainCircuit className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                My Stated Civic Interests
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold">
                Gemini Predictive AI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select what matters to you to calibrate your personalized policy potential impact scores
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{selectedTopics.length} Topics Active</span>
          </div>
          {compact && (
            <button className="p-1 text-slate-400 hover:text-white">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Active Interest Chips Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-red-400" />
                <span>Select Civic Categories of Direct Interest to You:</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {selectedTopics.length} selected
              </span>
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              {AVAILABLE_CIVIC_INTERESTS.map((item) => {
                const isSelected = selectedTopics.includes(item.label);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleTopic(item.label)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-red-600/30 to-rose-600/30 text-white border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.3)] ring-1 ring-red-500/40'
                        : 'bg-black/40 text-slate-400 border-white/10 hover:border-white/25 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        isSelected ? 'bg-red-500 text-white font-bold' : 'bg-white/10 text-transparent'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Description & Context */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Personal Context & Specific Neighborhood Priorities:</span>
              <span className="text-[10px] text-slate-500 font-mono">Optional but enhances AI precision</span>
            </label>
            <textarea
              rows={2}
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setIsSaved(false);
              }}
              placeholder="e.g. Resident in low-lying area near Velachery lake; daily two-wheeler commuter concerned about waterlogging, rapid pothole patches, and rooftop solar subsidies."
              className="w-full bg-black/50 border border-white/10 focus:border-red-500/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/40 resize-none transition-colors"
            />
          </div>

          {/* Location & Ward Context */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>
                Evaluating against policies affecting:{' '}
                <strong className="text-white">
                  {userData?.district || interests.district || 'Chennai'},{' '}
                  {userData?.state || interests.state || 'Tamil Nadu'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isSaved && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>Interests saved & predictive scores updated!</span>
                </span>
              )}

              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Recalibrate AI Impact</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
