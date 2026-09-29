import React, { useState, useEffect } from 'react';
import { GovernmentPolicy, PolicyCitizenImpact, CitizenInterestsProfile } from '../../types';
import { CitizenInterestsManager } from './CitizenInterestsManager';
import { PolicyImpactPredictionCard } from './PolicyImpactPredictionCard';
import { PolicyImpactBadge } from './PolicyImpactBadge';
import {
  getCitizenInterests,
  predictBatchPoliciesImpact,
} from '../../services/policyImpactService';
import { simulateAreaPolicyAlert } from '../../services/policyService';
import {
  BrainCircuit,
  Flame,
  Zap,
  Info,
  Search,
  Sliders,
  Filter,
  Sparkles,
  Building2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  FileDown,
  CheckCircle2,
} from 'lucide-react';
import { exportPolicyImpactReportPDF } from '../../services/pdfReportService';

interface PolicyPredictiveModuleTabProps {
  policies: GovernmentPolicy[];
  userData?: any;
  userDistrict: string;
  userState: string;
  preferredLangCode?: string;
}

export const PolicyPredictiveModuleTab: React.FC<PolicyPredictiveModuleTabProps> = ({
  policies,
  userData,
  userDistrict,
  userState,
  preferredLangCode = 'en',
}) => {
  const [citizenInterests, setCitizenInterests] = useState<CitizenInterestsProfile>(() =>
    getCitizenInterests(userData)
  );
  const [impactMap, setImpactMap] = useState<Record<string, PolicyCitizenImpact>>({});
  const [isLoadingBatch, setIsLoadingBatch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scoreFilter, setScoreFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low' | 'URGENT'>('ALL');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationNotice, setSimulationNotice] = useState<string>('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Handle Download PDF Report
  const handleDownloadPolicyReport = async () => {
    setIsDownloadingPdf(true);
    try {
      const activeList = filteredPolicies.length > 0 ? filteredPolicies : policies;
      await exportPolicyImpactReportPDF({
        policies: activeList,
        impactMap,
        district: userDistrict,
        state: userState,
        citizenInterests,
        filterApplied: scoreFilter === 'ALL' ? 'All Policies' : `${scoreFilter} Impact Filter`,
        searchQuery: searchQuery.trim() || undefined,
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to export policy report:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Batch predict impacts whenever policies or citizen interests change
  useEffect(() => {
    if (policies.length === 0) return;
    setIsLoadingBatch(true);
    predictBatchPoliciesImpact(policies, citizenInterests)
      .then((map) => {
        setImpactMap(map);
      })
      .catch((err) => console.warn('Batch impact notice:', err))
      .finally(() => setIsLoadingBatch(false));

    const handleInterestsUpdate = (e: any) => {
      if (e.detail) {
        setCitizenInterests(e.detail);
      }
    };

    window.addEventListener('govinsight_citizen_interests_updated', handleInterestsUpdate);
    return () => {
      window.removeEventListener('govinsight_citizen_interests_updated', handleInterestsUpdate);
    };
  }, [policies, citizenInterests]);

  const handleSimulateNewPolicy = async () => {
    setIsSimulating(true);
    setSimulationNotice('');
    try {
      const simulated = await simulateAreaPolicyAlert(userDistrict, userState);
      setSimulationNotice(`✓ Published "${simulated.title.slice(0, 40)}..." into live Firestore!`);
      setTimeout(() => setSimulationNotice(''), 4500);
    } catch (err) {
      console.warn('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Compute counts
  const highCount = policies.filter((p) => impactMap[p.id]?.potentialImpactScore === 'High').length;
  const mediumCount = policies.filter((p) => impactMap[p.id]?.potentialImpactScore === 'Medium').length;
  const lowCount = policies.filter((p) => impactMap[p.id]?.potentialImpactScore === 'Low').length;
  const urgentCount = policies.filter((p) => p.priority === 'URGENT').length;

  // Filter policies
  const filteredPolicies = policies.filter((p) => {
    const impact = impactMap[p.id];
    const score = impact?.potentialImpactScore || 'Medium';

    if (scoreFilter === 'High' && score !== 'High') return false;
    if (scoreFilter === 'Medium' && score !== 'Medium') return false;
    if (scoreFilter === 'Low' && score !== 'Low') return false;
    if (scoreFilter === 'URGENT' && p.priority !== 'URGENT') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSummary = p.summary.toLowerCase().includes(q);
      const matchDept = p.department.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchImpact = impact?.impactSummary.toLowerCase().includes(q);
      return matchTitle || matchSummary || matchDept || matchCategory || matchImpact;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Predictive Intelligence Stats */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#120a15] via-[#090b14] to-[#07090f] border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-red-600/30 text-red-300 border border-red-500/50 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.3)]">
                <BrainCircuit className="w-3.5 h-3.5 text-red-400" />
                <span>Gemini API Predictive Policy Module</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-mono">
                Jurisdiction: {userDistrict}, {userState}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Predictive Government Policy Impact for Citizens
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              GovInsight analyzes every government gazette, municipal order, and regulatory circular using the Gemini API. Each policy is calibrated against your stated civic interests to output a precise <strong className="text-red-400">Potential Impact Score (Low, Medium, High)</strong> and personal action directives.
            </p>
          </div>

          {/* Action Buttons: Simulate Alert & Download PDF Report */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleDownloadPolicyReport}
              disabled={isDownloadingPdf}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50 transition-all cursor-pointer"
              title="Download compiled government policy summaries and their corresponding impact scores into a formatted PDF document for offline reading"
            >
              {isDownloadingPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Compiling PDF Report...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Report Downloaded!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-white" />
                  <span>Download Report (PDF)</span>
                </>
              )}
            </button>

            <button
              onClick={handleSimulateNewPolicy}
              disabled={isSimulating}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isSimulating ? 'Publishing Directive...' : 'Simulate Live Alert'}</span>
            </button>
          </div>
        </div>

        {simulationNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold animate-fade-in flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{simulationNotice}</span>
          </div>
        )}

        {/* 4 Score Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
          <div
            onClick={() => setScoreFilter(scoreFilter === 'High' ? 'ALL' : 'High')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              scoreFilter === 'High'
                ? 'bg-red-950/50 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'bg-black/40 border-red-500/30 hover:border-red-500/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-red-300">
              <span className="font-bold flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-400" />
                <span>High Impact</span>
              </span>
              <span className="font-mono text-[10px] text-red-400/80">Priority</span>
            </div>
            <div className="text-2xl font-black text-white mt-1.5">{highCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Directly alters your routine / costs</div>
          </div>

          <div
            onClick={() => setScoreFilter(scoreFilter === 'Medium' ? 'ALL' : 'Medium')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              scoreFilter === 'Medium'
                ? 'bg-amber-950/50 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                : 'bg-black/40 border-amber-500/30 hover:border-amber-500/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-300">
              <span className="font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Medium Impact</span>
              </span>
              <span className="font-mono text-[10px] text-amber-400/80">Moderate</span>
            </div>
            <div className="text-2xl font-black text-white mt-1.5">{mediumCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tangential neighborhood benefits</div>
          </div>

          <div
            onClick={() => setScoreFilter(scoreFilter === 'Low' ? 'ALL' : 'Low')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              scoreFilter === 'Low'
                ? 'bg-slate-900 border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.3)]'
                : 'bg-black/40 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-400" />
                <span>Low Impact</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500">General</span>
            </div>
            <div className="text-2xl font-black text-white mt-1.5">{lowCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Informational civic directives</div>
          </div>

          <div
            onClick={() => setScoreFilter(scoreFilter === 'URGENT' ? 'ALL' : 'URGENT')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              scoreFilter === 'URGENT'
                ? 'bg-red-950/70 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-black/40 border-red-500/20 hover:border-red-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-red-300">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Urgent Directives</span>
              </span>
              <span className="font-mono text-[10px] text-red-400/80">SLA Active</span>
            </div>
            <div className="text-2xl font-black text-white mt-1.5">{urgentCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Emergency alerts & action protocols</div>
          </div>
        </div>
      </div>

      {/* Citizen Stated Interests Calibration Panel */}
      <CitizenInterestsManager
        userData={userData}
        policies={policies}
        onInterestsUpdated={(updated) => setCitizenInterests(updated)}
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies by keyword or sector..."
            className="w-full bg-black/60 border border-white/10 focus:border-red-500/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/30"
          />
        </div>

        {/* Score Filter Pills & Quick Export */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'ALL', label: `All (${policies.length})` },
            { id: 'High', label: `High Impact (${highCount})` },
            { id: 'Medium', label: `Medium (${mediumCount})` },
            { id: 'Low', label: `Low (${lowCount})` },
            { id: 'URGENT', label: `Urgent (${urgentCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScoreFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                scoreFilter === tab.id
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  : 'text-slate-400 hover:text-white bg-white/5 border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={handleDownloadPolicyReport}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 whitespace-nowrap transition-all cursor-pointer ml-1"
            title="Download formatted PDF of these policies and impact scores for offline reading"
          >
            {isDownloadingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-red-400" />
            )}
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {isLoadingBatch ? (
          <div className="p-12 text-center rounded-2xl bg-black/30 border border-white/10 space-y-3">
            <RefreshCw className="w-8 h-8 text-red-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-white">Running Gemini Predictive Policy Impact Analysis...</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Cross-referencing government directives against your stated interests ({citizenInterests.topics?.join(', ')})...
            </p>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-black/30 border border-white/10 space-y-2">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-300 font-bold">No policies match the selected filter.</p>
            <p className="text-xs text-slate-500">Try changing your search keywords or impact score filter.</p>
          </div>
        ) : (
          filteredPolicies.map((policy) => (
            <PolicyImpactPredictionCard
              key={policy.id}
              policy={policy}
              citizenInterests={citizenInterests}
              initialImpact={impactMap[policy.id]}
              preferredLangCode={preferredLangCode}
            />
          ))
        )}
      </div>
    </div>
  );
};
