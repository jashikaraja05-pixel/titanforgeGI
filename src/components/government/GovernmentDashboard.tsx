import React, { useState, useEffect } from 'react';
import {
  CivicIssue,
  SupportedLanguage,
  CountryProfile,
  PolicyScenario,
  FutureTrend,
  ImpactBeforeAfter,
  CaseStatus,
} from '../../types';
import { t } from '../../services/i18n';
import {
  getStoredIssues,
  updateIssueStatus,
  getFutureTrends,
  getImpactMetrics,
  getPolicyScenarios,
  INITIAL_SEEDED_ISSUES,
} from '../../services/dataService';
import { GlobalMap } from '../common/GlobalMap';
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  Sparkles,
  Search,
  Filter,
  Sliders,
  DollarSign,
  Activity,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  FileCheck,
  Send,
  Eye,
  Camera,
  Volume2,
  VolumeX,
  X,
  Lock,
  Unlock,
  Shield,
  HelpCircle,
  Database,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  UserCheck,
  MessageSquare,
  Wrench,
  Navigation,
  Flame,
  Phone,
  Check,
  RefreshCw,
  Upload,
  IdCard,
  Maximize2,
} from 'lucide-react';
import {
  translateReport,
  speakCivicText,
  stopSpeaking,
  SPEECH_LOCALES,
  TranslatedCivicReport,
} from '../../services/multilingualVoiceService';
import { handleCivicImageError } from '../../utils/imageFallback';

interface GovernmentDashboardProps {
  currentLanguage: SupportedLanguage;
  currentCountry: CountryProfile;
  onOpenResponsibleAi: () => void;
  onSwitchToCitizen: () => void;
  userData?: any;
}

export const GovernmentDashboard: React.FC<GovernmentDashboardProps> = ({
  currentLanguage,
  currentCountry,
  onOpenResponsibleAi,
  onSwitchToCitizen,
  userData,
}) => {
  // Official Auth simulation & profile registration
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [officialName, setOfficialName] = useState(userData?.name || 'Dr. Rajesh Sundaram');
  const [officialRole, setOfficialRole] = useState(userData?.role || 'Executive Infrastructure Director');
  const [officialBadge, setOfficialBadge] = useState(userData?.badgeId || 'GI-OFFICIAL-8492');
  const [officialMobile, setOfficialMobile] = useState(userData?.mobile || '+91 98401 23456');
  const [officialDept, setOfficialDept] = useState(userData?.department || 'Public Works & Highways');

  // Official Registration Modal state (Name & Mobile Number)
  const [isOfficialRegModalOpen, setIsOfficialRegModalOpen] = useState<boolean>(false);
  const [regOfficialName, setRegOfficialName] = useState(officialName);
  const [regOfficialMobile, setRegOfficialMobile] = useState(officialMobile);
  const [regOfficialDept, setRegOfficialDept] = useState(officialDept);
  const [regOfficialBadge, setRegOfficialBadge] = useState(officialBadge);
  const [regOfficialRole, setRegOfficialRole] = useState(officialRole);
  const [regError, setRegError] = useState<string>('');

  // Load official profile from local storage if saved
  useEffect(() => {
    try {
      const saved = localStorage.getItem('govinsight_official_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.name) {
          setOfficialName(p.name);
          setRegOfficialName(p.name);
        }
        if (p.mobile) {
          setOfficialMobile(p.mobile);
          setRegOfficialMobile(p.mobile);
        }
        if (p.department) {
          setOfficialDept(p.department);
          setRegOfficialDept(p.department);
        }
        if (p.badgeId) {
          setOfficialBadge(p.badgeId);
          setRegOfficialBadge(p.badgeId);
        }
        if (p.role) {
          setOfficialRole(p.role);
          setRegOfficialRole(p.role);
        }
      }
    } catch {}
  }, []);

  const handleSaveOfficialProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regOfficialName.trim()) {
      setRegError('Official Name is required.');
      return;
    }
    const cleanDigits = regOfficialMobile.replace(/\D/g, '');
    if (!regOfficialMobile.trim() || cleanDigits.length < 8) {
      setRegError('Please provide a valid Mobile Number (at least 8-10 digits).');
      return;
    }

    const updatedProfile = {
      name: regOfficialName.trim(),
      mobile: regOfficialMobile.trim(),
      department: regOfficialDept,
      badgeId: regOfficialBadge.trim() || `GOV-${regOfficialMobile.trim().slice(-4)}`,
      role: regOfficialRole.trim() || 'Authorized Department Officer',
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('govinsight_official_profile', JSON.stringify(updatedProfile));
    } catch {}

    setOfficialName(updatedProfile.name);
    setOfficialMobile(updatedProfile.mobile);
    setOfficialDept(updatedProfile.department);
    setOfficialBadge(updatedProfile.badgeId);
    setOfficialRole(updatedProfile.role);
    setIsOfficialRegModalOpen(false);
    showToast(`Government Official profile registered: ${updatedProfile.name} (📱 ${updatedProfile.mobile})`, 'success');
  };

  // Navigation
  const [govTab, setGovTab] = useState<
    'overview' | 'cases' | 'map' | 'recommendations' | 'policy' | 'trends' | 'impact' | 'departments'
  >('overview');

  // Issues and filtering
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCriticality, setFilterCriticality] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<CivicIssue | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  // Multilingual voice translation engine state
  const [listenLanguage, setListenLanguage] = useState<string>('ta');
  const [translatedCase, setTranslatedCase] = useState<TranslatedCivicReport | null>(null);
  const [isVoicePlaying, setIsVoicePlaying] = useState<boolean>(false);

  // Dedicated Location Search & City Filter
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("all");

  // Photo Lightbox Modal
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title: string;
    analysis?: any;
    locationText?: string;
    isResolvedProof?: boolean;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Cleared Site Resolution Modal
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState<boolean>(false);
  const [clearedPhotoUrl, setClearedPhotoUrl] = useState<string>("");
  const [clearedNotes, setClearedNotes] = useState<string>("");
  const [clearedContractor, setClearedContractor] = useState<string>("");
  const [isSubmittingResolution, setIsSubmittingResolution] = useState<boolean>(false);

  // In-app Action Toast
  const [actionToast, setActionToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 4000);
  };

  // City complaint volume rankings
  const cityComplaintStats = React.useMemo(() => {
    const map: Record<string, { city: string; count: number; critical: number; inProgress: number; resolved: number }> = {};
    issues.forEach((issue) => {
      const city = issue.location?.city?.trim() || "General Area";
      if (!map[city]) {
        map[city] = { city, count: 0, critical: 0, inProgress: 0, resolved: 0 };
      }
      map[city].count += 1;
      if (issue.criticality === "CRITICAL" || issue.criticality === "HIGH") {
        map[city].critical += 1;
      }
      if (issue.status === "Resolved") {
        map[city].resolved += 1;
      } else {
        map[city].inProgress += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [issues]);

  const topHotspotCity = cityComplaintStats[0];

  const handleSelectCase = (issue: CivicIssue) => {
    stopSpeaking();
    setIsVoicePlaying(false);
    setSelectedCase(issue);
    const initialLang = 'ta';
    setListenLanguage(initialLang);
    const trans = translateReport(
      {
        title: issue.title,
        description: issue.description,
        locationText: `${issue.location.address}, ${issue.location.city}`,
        category: issue.category,
        criticality: issue.criticality,
        status: issue.status,
        aiSummary: issue.aiSummary,
      },
      initialLang
    );
    setTranslatedCase(trans);
  };

  const handleLanguageVoiceSwitch = (langCode: string) => {
    if (!selectedCase) return;
    setListenLanguage(langCode);
    const trans = translateReport(
      {
        title: selectedCase.title,
        description: selectedCase.description,
        locationText: `${selectedCase.location.address}, ${selectedCase.location.city}`,
        category: selectedCase.category,
        criticality: selectedCase.criticality,
        status: selectedCase.status,
        aiSummary: selectedCase.aiSummary,
      },
      langCode
    );
    setTranslatedCase(trans);

    speakCivicText({
      text: trans.aiVoiceScript,
      langCode,
      onStart: () => setIsVoicePlaying(true),
      onEnd: () => setIsVoicePlaying(false),
      onError: () => setIsVoicePlaying(false),
    });
  };

  const handleStopVoice = () => {
    stopSpeaking();
    setIsVoicePlaying(false);
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Policy Simulator & Dynamic Analytics
  const [budgetSlider, setBudgetSlider] = useState<number>(12); // $12M / ₹100 Cr
  const dynamicScenarios = React.useMemo(() => getPolicyScenarios(issues), [issues]);
  const [selectedScenario, setSelectedScenario] = useState<PolicyScenario | null>(null);

  useEffect(() => {
    if (dynamicScenarios.length > 0 && (!selectedScenario || !dynamicScenarios.find((s) => s.id === selectedScenario.id))) {
      setSelectedScenario(dynamicScenarios[0]);
    }
  }, [dynamicScenarios, selectedScenario]);

  const dynamicTrends = React.useMemo(() => getFutureTrends(issues), [issues]);
  const dynamicMetrics = React.useMemo(() => getImpactMetrics(issues), [issues]);

  // Action modal note state
  const [actionNote, setActionNote] = useState('');
  const [assigneeInput, setAssigneeInput] = useState('');

  const refreshIssues = () => {
    const list = getStoredIssues();
    setIssues(list);
    if (selectedCase) {
      const updated = list.find((i) => i.id === selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  };

  useEffect(() => {
    refreshIssues();
    const handleUpdate = () => refreshIssues();
    window.addEventListener('govinsight_issues_updated', handleUpdate);
    return () => window.removeEventListener('govinsight_issues_updated', handleUpdate);
  }, []);

  // KPIs
  const totalReports = issues.length;
  const criticalCases = issues.filter((i) => i.criticality === 'CRITICAL').length;
  const highCases = issues.filter((i) => i.criticality === 'HIGH').length;
  const mediumCases = issues.filter((i) => i.criticality === 'MEDIUM').length;
  const inProgressCases = issues.filter((i) => i.status === 'Action In Progress' || i.status === 'Assigned').length;
  const resolvedCases = issues.filter((i) => i.status === 'Resolved').length;
  const totalBeneficiaries = issues.reduce((acc, i) => acc + (i.affectedPopulationEstimate || 0), 0);

  // Handle Action state change
  const handleUpdateStatus = (newStatus: CaseStatus) => {
    if (!selectedCase) return;
    const note = actionNote.trim() || `Status transitioned to ${newStatus} by ${officialName} (${officialRole})`;
    const updated = updateIssueStatus(
      selectedCase.id,
      newStatus,
      `${officialName} [${officialBadge}]`,
      note
    );
    if (updated) {
      setSelectedCase(updated);
      setActionNote("");
      refreshIssues();
      showToast(`Case ${selectedCase.id} successfully updated to: ${newStatus}`, "success");
    }
  };

  const handleRequestInfo = () => {
    if (!selectedCase) return;
    const note = actionNote.trim() || "Official requested additional photographic landmark or street details from citizen.";
    const updated = updateIssueStatus(
      selectedCase.id,
      "Under Review",
      `${officialName} [${officialBadge}]`,
      `[Citizen Request Dispatched] ${note}`
    );
    if (updated) {
      setSelectedCase(updated);
      setActionNote("");
      refreshIssues();
      showToast(`Information request dispatched to citizen mobile for case ${selectedCase.id}!`, "info");
    }
  };

  const handleConfirmResolutionWithProof = () => {
    if (!selectedCase) return;
    setIsSubmittingResolution(true);
    const note = clearedNotes.trim() || `Site cleared and defect repaired. Verified by ${officialName} (${officialBadge}).`;
    const resolutionProof = clearedPhotoUrl.trim() || "https://images.unsplash.com/photo-1578961952402-f6f8e763137e?auto=format&fit=crop&w=800&q=80";

    const updated = updateIssueStatus(
      selectedCase.id,
      "Resolved",
      clearedContractor.trim() ? `${officialName} [Team: ${clearedContractor.trim()}]` : `${officialName} [${officialBadge}]`,
      note,
      resolutionProof
    );

    if (updated) {
      setSelectedCase(updated);
      setActionNote("");
      setIsResolutionModalOpen(false);
      setClearedPhotoUrl("");
      setClearedNotes("");
      setClearedContractor("");
      refreshIssues();
      showToast(`Case ${selectedCase.id} verified as CLEARED & RESOLVED with photo evidence!`, "success");
    }
    setIsSubmittingResolution(false);
  };

  const filteredIssues = issues.filter((i) => {
    if (filterCriticality !== "all" && i.criticality !== filterCriticality) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterDepartment !== "all" && !i.assignedDepartment?.includes(filterDepartment)) return false;
    if (selectedCityFilter !== "all" && i.location?.city?.toLowerCase() !== selectedCityFilter.toLowerCase()) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = i.title?.toLowerCase().includes(q);
      const matchId = i.id?.toLowerCase().includes(q);
      const matchDesc = i.description?.toLowerCase().includes(q);
      const matchSummary = i.aiSummary?.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchDesc && !matchSummary) return false;
    }

    if (locationSearch) {
      const lq = locationSearch.toLowerCase();
      const matchCity = i.location?.city?.toLowerCase().includes(lq);
      const matchAddress = i.location?.address?.toLowerCase().includes(lq);
      const matchDistrict = i.location?.district?.toLowerCase().includes(lq);
      const matchState = i.location?.state?.toLowerCase().includes(lq);
      const matchCoords = `${i.location?.lat},${i.location?.lng}`.includes(lq);
      if (!matchCity && !matchAddress && !matchDistrict && !matchState && !matchCoords) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Government Official HUD Bar */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-red-500/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center font-bold shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white tracking-wide">
                  GOVINSIGHT CIVIC COMMAND & ACTION DESK
                </span>
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold">
                  {currentCountry.name} DIVISION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Officer: <strong className="text-white">{officialName}</strong> ({officialRole}) • Badge: <span className="font-mono text-red-400 font-bold">{officialBadge}</span> • Phone: <span className="font-mono text-emerald-400 font-bold">{officialMobile}</span> • Dept: <span className="text-slate-300 font-medium">{officialDept}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                setRegOfficialName(officialName);
                setRegOfficialMobile(officialMobile);
                setRegOfficialDept(officialDept);
                setRegOfficialBadge(officialBadge);
                setRegOfficialRole(officialRole);
                setRegError('');
                setIsOfficialRegModalOpen(true);
              }}
              title="Register official name and mobile number"
              className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <IdCard className="w-3.5 h-3.5 text-red-400" />
              <span>Register / Edit Official Profile</span>
            </button>
            <button
              onClick={() => {
                refreshIssues();
                showToast("Live civic records refreshed from Firestore!", "info");
              }}
              title="Refresh live grievance feed from Firestore"
              className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Refresh Live Feed</span>
            </button>
            <button
              onClick={onOpenResponsibleAi}
              className="px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-500/30 text-xs font-semibold text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-red-400" />
              <span>Responsible AI Support</span>
            </button>
            <button
              onClick={onSwitchToCitizen}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Switch to Citizen View
            </button>
          </div>
        </div>

        {/* OFFICIAL REGISTRATION VERIFICATION BANNER */}
        {(!officialName || !officialMobile || officialName.includes('Dr. Rajesh')) && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-200 shadow-md">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-extrabold text-amber-300">Official Mobile Registration Required:</span>
                <span className="text-amber-100/90 ml-1">
                  Government officials must register their full name and official mobile number before verifying and clearing citizen grievances.
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setRegOfficialName(officialName);
                setRegOfficialMobile(officialMobile);
                setRegOfficialDept(officialDept);
                setRegOfficialBadge(officialBadge);
                setRegOfficialRole(officialRole);
                setRegError('');
                setIsOfficialRegModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-colors shrink-0 cursor-pointer shadow"
            >
              Register Official Details
            </button>
          </div>
        )}

        {/* HIGH PRIORITY CITY HOTSPOT BANNER */}
        {topHotspotCity && topHotspotCity.count > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/90 via-rose-950/60 to-black border border-red-500/50 shadow-xl space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 shrink-0 mt-0.5">
                  <Flame className="w-5 h-5 animate-pulse text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                      HIGH PRIORITY CITY HOTSPOT
                    </span>
                    <span className="font-mono text-xs text-red-300 font-bold">
                      Highest Citizen Grievance Concentration
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white mt-1">
                    📍 {topHotspotCity.city} — {topHotspotCity.count} Active Grievance Reports ({topHotspotCity.critical} Critical/High Priority)
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    AI spatial cluster analysis identifies {topHotspotCity.city} with the highest grievance frequency. Immediate rapid-response engineering and municipal resource allocation recommended.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelectedCityFilter(topHotspotCity.city);
                    setGovTab('cases');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Filter Cases for {topHotspotCity.city}</span>
                </button>
                {selectedCityFilter !== "all" && (
                  <button
                    onClick={() => setSelectedCityFilter("all")}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Show All Cities
                  </button>
                )}
              </div>
            </div>

            {/* Jurisdiction Hotspot Cities Ranking Bar */}
            {cityComplaintStats.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-red-500/20 text-xs">
                <span className="text-[10px] font-mono text-red-400 uppercase font-bold shrink-0 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-400" />
                  Hotspot Ranking:
                </span>
                {cityComplaintStats.slice(0, 6).map((stat, i) => (
                  <button
                    key={stat.city}
                    onClick={() => {
                      setSelectedCityFilter(stat.city);
                      setGovTab('cases');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      selectedCityFilter === stat.city
                        ? 'bg-red-600 text-white shadow-md'
                        : i === 0
                        ? 'bg-red-950/80 border border-red-500/50 text-red-200 hover:bg-red-900/60'
                        : 'bg-black/60 border border-white/10 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    <span>#{i + 1} {stat.city}</span>
                    <span className="px-1.5 py-0.2 rounded bg-black/50 text-[10px] font-mono font-bold text-red-300">
                      {stat.count} cases
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Government Sub-Navigation */}
        <div className="flex items-center gap-1 p-1 bg-black/60 rounded-2xl border border-white/10 overflow-x-auto">
          {[
            { id: 'overview', label: t('govOverview', currentLanguage.code), icon: Activity },
            { id: 'cases', label: `${t('govLiveCases', currentLanguage.code)} (${issues.length})`, icon: ShieldAlert },
            { id: 'map', label: t('govPriorityMap', currentLanguage.code), icon: MapPin },
            { id: 'policy', label: t('govPolicySim', currentLanguage.code), icon: Sliders },
            { id: 'trends', label: t('govFutureTrend', currentLanguage.code), icon: TrendingUp },
            { id: 'impact', label: t('govImpact', currentLanguage.code), icon: CheckCircle2 },
            { id: 'recommendations', label: t('govRecommend', currentLanguage.code), icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = govTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setGovTab(item.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW (Section 19 in brief) */}
        {govTab === 'overview' && (
          <div className="space-y-6">
            {/* Top KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">{t('totalReports', currentLanguage.code)}</span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">{totalReports}</div>
                <div className="text-[10px] text-red-400 mt-1">Multi-modal Citizen Evidence</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <span className="text-[10px] text-red-400 font-mono uppercase block">{t('criticalCases', currentLanguage.code)}</span>
                <div className="text-2xl sm:text-3xl font-black text-red-400 font-mono mt-1">{criticalCases}</div>
                <div className="text-[10px] text-red-400 mt-1">Emergency Hospital/School</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10">
                <span className="text-[10px] text-amber-400 font-mono uppercase block">High Priority</span>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1">{highCases}</div>
                <div className="text-[10px] text-slate-400 mt-1">Water & Sanitation Outages</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10">
                <span className="text-[10px] text-blue-400 font-mono uppercase block">{t('inProgress', currentLanguage.code)}</span>
                <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono mt-1">{inProgressCases}</div>
                <div className="text-[10px] text-slate-400 mt-1">Field Crews Mobilized</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40">
                <span className="text-[10px] text-emerald-400 font-mono uppercase block">{t('resolved', currentLanguage.code)}</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">{resolvedCases}</div>
                <div className="text-[10px] text-emerald-400 mt-1">100% Citizen Verified</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10">
                <span className="text-[10px] text-purple-400 font-mono uppercase block">{t('beneficiaries', currentLanguage.code)}</span>
                <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono mt-1">
                  {(totalBeneficiaries / 1000).toFixed(0)}K
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Population Exposure</div>
              </div>
            </div>

            {/* WARD-LEVEL HOTSPOT INTELLIGENCE & AI VISION ROAD BLOCK INSPECTOR */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-red-950/80 via-black to-slate-950 border-2 border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.25)] space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-red-500/20 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      WARD HOTSPOT ANALYSIS & AI DEFECT DETECTION
                    </span>
                    <span className="text-xs font-mono text-red-300 font-bold">
                      Real-Time Ward Cluster Ranking
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    City & Ward Grievance Hotspots: Coimbatore vs Chennai
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Spatial intelligence identifies Coimbatore as the highest grievance cluster requiring urgent emergency diversion.
                  </p>
                </div>
              </div>

              {/* Ward Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. COIMBATORE WARD 42 (CRITICAL RED HOTSPOT) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-red-950/90 to-black border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.35)] relative overflow-hidden space-y-3">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-bl-xl tracking-wider animate-pulse">
                    🚨 HIGHEST DENSITY: 2 COMPLAINTS
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-red-600/30 border border-red-500/60 text-red-400 shrink-0 mt-1">
                      <Flame className="w-5 h-5 text-red-400 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-red-400">HOTSPOT #1 • RED HIGHLIGHT</span>
                      </div>
                      <h4 className="text-base font-extrabold text-white mt-0.5">
                        Coimbatore — Ward 42 (Gandhipuram)
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        📍 100 Feet Road & Cross Cut Road (Lat: 11.0168°, Lng: 76.9558°)
                      </p>
                    </div>
                  </div>

                  {/* Complaint Breakdown */}
                  <div className="space-y-2 pt-2 border-t border-red-500/20 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/60 border border-red-500/40 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-red-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          Complaint 1: Road Block & Heavy Waterlogging
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          100 Feet Road • Deep crater & vehicular obstruction • CRITICAL
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-600/40 text-red-200 text-[10px] font-bold border border-red-500/60">
                        CRITICAL
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/60 border border-red-500/30 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-red-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Complaint 2: Open Drainage Breach & Road Collapse
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Cross Cut Road • Retaining wall failure • CRITICAL
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-600/40 text-red-200 text-[10px] font-bold border border-red-500/60">
                        CRITICAL
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Button to Center Map on Coimbatore */}
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        const cbe = issues.find((i) => i.location?.city === 'Coimbatore') || INITIAL_SEEDED_ISSUES[0];
                        setSelectedCase(cbe);
                        const mapEl = document.getElementById('gov-priority-map');
                        mapEl?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-white" />
                      <span>Highlight Coimbatore Spot in Red on Map</span>
                    </button>
                  </div>
                </div>

                {/* 2. CHENNAI WARD 104 */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0 mt-1">
                        <MapPin className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-400">HOTSPOT #2 • MODERATE</span>
                        <h4 className="text-base font-extrabold text-white mt-0.5">
                          Chennai — Ward 104 (Anna Nagar)
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          📍 Anna Nagar 2nd Avenue (Lat: 13.0827°, Lng: 80.2707°)
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-500/40 text-blue-300 text-[10px] font-mono font-bold">
                      1 COMPLAINT
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">
                          Complaint 1: Damaged Street Light Pole & Exposed Cable
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Anna Nagar 2nd Ave • TNEB fixture repair • MEDIUM
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                        MEDIUM
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        const chn = issues.find((i) => i.location?.city === 'Chennai') || INITIAL_SEEDED_ISSUES[2];
                        setSelectedCase(chn);
                        const mapEl = document.getElementById('gov-priority-map');
                        mapEl?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-slate-300" />
                      <span>View Chennai Ward 104 on Map</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* AI IMAGE VISION DEFECT DETECTION (2 DEFECT MARKS & ROAD BLOCK ASSUMPTION) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/80 border border-red-500/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-mono uppercase font-black text-red-400">
                      AI Vision Image Defect Inspection (2 Defect Marks Detected)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-600/30 border border-red-500/50 text-[10px] font-mono text-red-300 font-bold">
                    98.4% AI Vision Confidence
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                  {/* Photo with 2 Defect Visual Markers */}
                  <div className="relative rounded-xl overflow-hidden border border-red-500/50 aspect-video lg:aspect-auto lg:h-52 bg-slate-950">
                    <img
                      src="/hero-banner.jpg"
                      alt="Civic Defect Road Block"
                      className="w-full h-full object-cover filter brightness-90 contrast-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Defect Mark 1 Bounding Box Overlay */}
                    <div className="absolute top-[28%] left-[22%] w-[38%] h-[32%] border-2 border-red-500 bg-red-600/20 rounded shadow-[0_0_12px_rgba(239,68,68,0.8)] flex flex-col justify-between p-1">
                      <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black w-max">
                        Mark 1: Crater 18cm
                      </span>
                      <span className="text-[8px] font-mono text-red-200 text-right">98% Defect Match</span>
                    </div>

                    {/* Defect Mark 2 Bounding Box Overlay */}
                    <div className="absolute bottom-[18%] right-[14%] w-[42%] h-[35%] border-2 border-amber-500 bg-amber-500/20 rounded shadow-[0_0_12px_rgba(245,158,11,0.8)] flex flex-col justify-between p-1">
                      <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white text-[9px] font-black w-max">
                        Mark 2: Flood Trench
                      </span>
                      <span className="text-[8px] font-mono text-amber-200 text-right">Road Block Alert</span>
                    </div>

                    <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/90 bg-black/70 px-2 py-0.5 rounded">
                      Uploaded Photo: Coimbatore Ward 42
                    </div>
                  </div>

                  {/* AI Diagnosis Details */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-mono text-red-300 uppercase font-bold">AI Diagnosis:</div>
                        <div className="text-sm font-black text-red-200">
                          🚨 CRITICAL SITUATION: ROAD BLOCK DETECTED
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-black uppercase animate-pulse">
                        CRITICAL RED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-slate-400 block">Total Defect Marks:</span>
                        <span className="text-sm font-mono font-bold text-white">2 Marks (Crater + Waterlogging)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-slate-400 block">Corridor Impact:</span>
                        <span className="text-sm font-mono font-bold text-red-400">Total Lane Blockage</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      AI computer vision processed 2 total defect markings from citizen imagery. The combination of structural pavement collapse and floodwater accumulation confirms a <strong>Critical Road Block</strong> situation. Emergency diversion signs and municipal resurfacing units have been queued.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Priority Heatmap Preview & Live Critical Incident Alert */}
            <div id="gov-priority-map" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span>Global Civic Priority Heatmap</span>
                  </h3>
                  <button
                    onClick={() => setGovTab('map')}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                  >
                    <span>Full Map Explorer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <GlobalMap
                  issues={issues}
                  selectedIssue={selectedCase}
                  onSelectIssue={(i) => {
                    setSelectedCase(i);
                    setGovTab('cases');
                  }}
                  heightClass="h-80"
                />
              </div>

              {/* Unheard Community Detector Spotlight (Section 12 in brief) */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Unheard Community Detector</span>
                </h3>

                <div className="p-5 rounded-3xl bg-cyan-950/30 border border-cyan-500/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-400/50 text-[10px] font-mono font-bold">
                      LOW COMPLAINTS ≠ LOW NEED
                    </span>
                  </div>

                  <p className="text-xs text-cyan-100 leading-relaxed">
                    “Only 14 reports were received from this peripheral district, but demographic and satellite indicators identify a 78% baseline infrastructure deficit.”
                  </p>

                  <div className="p-3 rounded-xl bg-black/60 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Area:</span>
                      <span className="font-semibold text-white">Soweto / Zona Leste Sub-corridor</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Population Vulnerability:</span>
                      <span className="font-mono text-cyan-400 font-bold">HIGH (92%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">AI Recommendation:</span>
                      <span className="text-slate-200">Deploy proactive municipal water line inspection team.</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const underRep = issues.find((i) => i.isUnderRepresentedArea);
                      if (underRep) {
                        setSelectedCase(underRep);
                        setGovTab('cases');
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 text-xs font-bold text-cyan-200 transition-colors"
                  >
                    Inspect Under-Represented Case
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE CASES MANAGEMENT (Section 21 in brief) */}
        {govTab === 'cases' && (
          <div className="space-y-6">
            {/* Filter Bar with Dedicated Location Search & City Filter */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                {/* General Keyword Search */}
                <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search case ID, keyword, title, or description..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dedicated Location Search Option */}
                <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-black/60 border border-red-500/40">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search Location (City, District, Street, Area, Landmark)..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  {locationSearch && (
                    <button onClick={() => setLocationSearch('')} className="text-slate-400 hover:text-white cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                <div className="flex flex-wrap items-center gap-2">
                  {/* City Dropdown Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">City / Oor:</span>
                    <select
                      value={selectedCityFilter}
                      onChange={(e) => setSelectedCityFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-black/80 border border-red-500/40 text-xs font-semibold text-white focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Cities ({issues.length})</option>
                      {cityComplaintStats.map((stat) => (
                        <option key={stat.city} value={stat.city}>
                          {stat.city} ({stat.count}) {stat.critical > 0 ? `[${stat.critical} Critical]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={filterCriticality}
                    onChange={(e) => setFilterCriticality(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Criticality</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="AI Analyzed">AI Analyzed</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Action In Progress">Action In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                {(searchQuery || locationSearch || selectedCityFilter !== 'all' || filterCriticality !== 'all' || filterStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setLocationSearch('');
                      setSelectedCityFilter('all');
                      setFilterCriticality('all');
                      setFilterStatus('all');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* Quick City Hotspot Chips */}
              {cityComplaintStats.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
                  <span className="text-[10px] uppercase font-bold text-red-400 shrink-0">City Hotspots:</span>
                  {cityComplaintStats.slice(0, 6).map((stat, idx) => {
                    const isSelected = selectedCityFilter.toLowerCase() === stat.city.toLowerCase();
                    return (
                      <button
                        key={stat.city}
                        onClick={() => setSelectedCityFilter(isSelected ? 'all' : stat.city)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-black/60 border border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {idx === 0 && <Flame className="w-3 h-3 text-red-400 animate-pulse" />}
                        <span>{stat.city}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isSelected ? 'bg-black/40 text-white' : 'bg-red-950 text-red-400'}`}>
                          {stat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cases Grid & Detailed Inspection View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cases List */}
              <div className="lg:col-span-1 space-y-3">
                {filteredIssues.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center space-y-2">
                    <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-400">No cases found matching your filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setLocationSearch('');
                        setSelectedCityFilter('all');
                        setFilterCriticality('all');
                        setFilterStatus('all');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  filteredIssues.map((issue) => {
                    const isSelected = selectedCase?.id === issue.id;
                    return (
                      <div
                        key={issue.id}
                        onClick={() => handleSelectCase(issue)}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-slate-900 border-red-500/90 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                            : 'bg-black/50 border-white/10 hover:border-white/20 hover:bg-black/70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-red-400">{issue.id}</span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                issue.criticality === 'CRITICAL'
                                  ? 'bg-red-950 text-red-400 border border-red-800'
                                  : 'bg-amber-950 text-amber-400'
                              }`}
                            >
                              {issue.criticality}
                            </span>
                            <span className="font-mono text-white text-xs font-bold">
                              {issue.priorityScore}/100
                            </span>
                          </div>
                        </div>

                        {/* Title & Clickable Photo Thumbnail */}
                        <div className="flex gap-3">
                          {issue.photoUrl && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomLevel(1);
                                setLightboxImage({
                                  url: issue.photoUrl!,
                                  title: `${issue.id} - ${issue.title}`,
                                  analysis: issue.photoAnalysis,
                                  locationText: `${issue.location.address}, ${issue.location.city}`,
                                  isResolvedProof: false,
                                });
                              }}
                              className="relative group w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/15 cursor-pointer"
                              title="Click to zoom damage photo"
                            >
                              <img
                                src={issue.photoUrl}
                                alt="Damage Thumbnail"
                                onError={(e) => handleCivicImageError(e, 'before')}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white line-clamp-1">{issue.title}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{issue.aiSummary}</p>
                          </div>
                        </div>

                        {/* Highly Visible Citizen Location Line */}
                        <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
                          <div className="flex items-center gap-1 text-[11px] text-white font-semibold line-clamp-1">
                            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span>📍 {issue.location.city} • <span className="text-slate-300 font-normal">{issue.location.address}</span></span>
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-emerald-400">{issue.status}</span>
                            {issue.resolutionPhotoUrl && (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                                ✓ Cleared Proof
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* DETAILED GOVERNMENT CASE VIEW & ACTION CONTROLS (Section 21) */}
              <div className="lg:col-span-2">
                {selectedCase ? (
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-red-500/40 shadow-2xl space-y-6">
                    {/* Header with Close Cross Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-red-400 font-bold">{selectedCase.id}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded text-xs font-black ${
                              selectedCase.criticality === 'CRITICAL'
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-500 text-black'
                            }`}
                          >
                            {selectedCase.criticality}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Priority Score: <strong className="text-white">{selectedCase.priorityScore}/100</strong>
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold text-white mt-1">{selectedCase.title}</h3>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Current Status:</span>
                          <span className="px-3 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold inline-block mt-0.5">
                            {selectedCase.status}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            stopSpeaking();
                            setIsVoicePlaying(false);
                            setSelectedCase(null);
                          }}
                          className="p-2 rounded-xl bg-white/10 hover:bg-red-600/80 border border-white/15 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
                          title="Close Case View"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* UNIVERSAL CROSS-LANGUAGE AUDIO DISPATCH & TRANSLATION ENGINE */}
                    <div className="p-5 rounded-2xl bg-black/70 border border-red-500/40 shadow-lg space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-5 h-5 text-red-400" />
                          <div>
                            <h4 className="text-sm font-black text-white">
                              Multilingual Voice & Cross-Translation Dispatch
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Choose target language to translate and immediately listen in native voice
                            </p>
                          </div>
                        </div>

                        {/* Speech controller */}
                        {isVoicePlaying && (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-bold animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              Speaking ({listenLanguage.toUpperCase()})...
                            </span>
                            <button
                              onClick={handleStopVoice}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Stop</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Language Selection Buttons */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block mb-2">
                          Select Listening / Target Language:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { code: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
                            { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
                            { code: 'ml', label: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
                            { code: 'te', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
                            { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
                            { code: 'en', label: 'English (US)', flag: '🇺🇸' },
                            { code: 'en-gb', label: 'English (UK)', flag: '🇬🇧' },
                            { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
                            { code: 'pt', label: 'Português', flag: '🇧🇷' },
                            { code: 'ru', label: 'Русский', flag: '🇷🇺' },
                            { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
                          ].map((l) => {
                            const isCurrent = listenLanguage === l.code;
                            return (
                              <button
                                key={l.code}
                                onClick={() => handleLanguageVoiceSwitch(l.code)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105'
                                    : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                <span>{l.flag}</span>
                                <span>{l.label}</span>
                                {isCurrent && isVoicePlaying && (
                                  <Volume2 className="w-3.5 h-3.5 text-white animate-bounce" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Translated Case Card with Voice Dispatch Text */}
                      {translatedCase && (
                        <div className="p-4 rounded-xl bg-slate-900/90 border border-red-500/30 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-red-400 font-bold">
                              Translated in: {translatedCase.targetLanguageName} ({translatedCase.targetLanguageCode.toUpperCase()})
                            </span>
                            <button
                              onClick={() => handleLanguageVoiceSwitch(listenLanguage)}
                              className="px-3 py-1 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-xs font-bold text-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-red-400" />
                              <span>Replay Voice in {listenLanguage.toUpperCase()}</span>
                            </button>
                          </div>

                          <div className="text-sm font-bold text-white">
                            {translatedCase.title}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {translatedCase.description}
                          </p>

                          <div className="pt-2 border-t border-white/10 text-xs flex flex-wrap gap-3 text-slate-400">
                            <div>📍 <span className="text-white">{translatedCase.locationText}</span></div>
                            <div>Status: <span className="text-emerald-400 font-semibold">{translatedCase.officialStatus}</span></div>
                            <div>Category: <span className="text-white">{translatedCase.category}</span></div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 text-[11px] text-slate-300">
                            <span className="font-mono text-red-400 block font-semibold mb-0.5">Spoken AI Voice Dispatch Script:</span>
                            "{translatedCase.aiVoiceScript}"
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Citizen Request & Multilingual Transcription */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                          Original Citizen Submission ({selectedCase.originalLanguage}):
                        </span>
                        <p className="text-slate-200 leading-relaxed font-medium">
                          {selectedCase.transcription || selectedCase.description}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-black/60 border border-red-500/30 space-y-1.5">
                        <span className="text-[10px] font-mono text-red-400 uppercase font-bold block">
                          AI Structured Summary:
                        </span>
                        <p className="text-slate-200 leading-relaxed">
                          {selectedCase.aiSummary}
                        </p>
                        <span className="text-[10px] text-slate-400 block pt-1 border-t border-white/10">
                          Category: <strong>{selectedCase.category}</strong>
                        </span>
                      </div>
                    </div>

                    {/* PHOTO EVIDENCE (BEFORE & AFTER RESOLUTION PROOF) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Before: Citizen Damage Evidence */}
                      {selectedCase.photoUrl && (
                        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-red-400" />
                              <span>Before: Citizen Damage Evidence</span>
                            </span>
                            <button
                              onClick={() => {
                                setZoomLevel(1);
                                setLightboxImage({
                                  url: selectedCase.photoUrl!,
                                  title: `${selectedCase.id} - ${selectedCase.title}`,
                                  analysis: selectedCase.photoAnalysis,
                                  locationText: `${selectedCase.location.address}, ${selectedCase.location.city}`,
                                  isResolvedProof: false,
                                });
                              }}
                              className="text-[11px] font-semibold text-red-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>Click to Zoom</span>
                            </button>
                          </div>

                          <div
                            onClick={() => {
                              setZoomLevel(1);
                              setLightboxImage({
                                url: selectedCase.photoUrl!,
                                title: `${selectedCase.id} - ${selectedCase.title}`,
                                analysis: selectedCase.photoAnalysis,
                                locationText: `${selectedCase.location.address}, ${selectedCase.location.city}`,
                                isResolvedProof: false,
                              });
                            }}
                            className="relative group cursor-pointer rounded-xl overflow-hidden bg-black border border-white/10 aspect-video flex items-center justify-center"
                            title="Click to expand damage photo"
                          >
                            <img
                              src={selectedCase.photoUrl}
                              alt="Damage Evidence"
                              onError={(e) => handleCivicImageError(e, 'before')}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                              <ZoomIn className="w-5 h-5 text-red-400" />
                              <span>Click to Expand Full Photo</span>
                            </div>
                          </div>

                          {selectedCase.photoAnalysis && (
                            <div className="text-xs space-y-1 text-slate-300">
                              <div>Detected: <strong className="text-white">{selectedCase.photoAnalysis.detectedObject}</strong> (AI Confidence: <span className="text-emerald-400 font-mono">{selectedCase.photoAnalysis.confidence}%</span>)</div>
                              <div>Severity: <strong className="text-red-400">{selectedCase.photoAnalysis.severity}</strong></div>
                              <p className="text-slate-400 text-[11px] pt-1 border-t border-white/10">
                                {selectedCase.photoAnalysis.details}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* After: Government Cleared Site Proof */}
                      <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>After: Cleared Site Proof (சரி செய்யப்பட்டது)</span>
                          </span>
                          {selectedCase.resolutionPhotoUrl && (
                            <button
                              onClick={() => {
                                setZoomLevel(1);
                                setLightboxImage({
                                  url: selectedCase.resolutionPhotoUrl!,
                                  title: `${selectedCase.id} - Cleared Site Proof`,
                                  locationText: `${selectedCase.location.address}, ${selectedCase.location.city}`,
                                  isResolvedProof: true,
                                });
                              }}
                              className="text-[11px] font-semibold text-emerald-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>Click to Zoom</span>
                            </button>
                          )}
                        </div>

                        {selectedCase.resolutionPhotoUrl ? (
                          <div
                            onClick={() => {
                              setZoomLevel(1);
                              setLightboxImage({
                                url: selectedCase.resolutionPhotoUrl!,
                                title: `${selectedCase.id} - Cleared Site Proof`,
                                locationText: `${selectedCase.location.address}, ${selectedCase.location.city}`,
                                isResolvedProof: true,
                              });
                            }}
                            className="relative group cursor-pointer rounded-xl overflow-hidden bg-black border border-emerald-500/30 aspect-video flex items-center justify-center"
                            title="Click to expand cleared photo"
                          >
                            <img
                              src={selectedCase.resolutionPhotoUrl}
                              alt="Resolution Cleared Site Proof"
                              onError={(e) => handleCivicImageError(e, 'after')}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                              <ZoomIn className="w-5 h-5 text-emerald-400" />
                              <span>Click to Expand Cleared Photo</span>
                            </div>
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-bold">
                              ✓ Defect Cleared & Verified
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border-2 border-dashed border-white/10 p-6 text-center space-y-2 flex flex-col items-center justify-center h-48">
                            <Wrench className="w-8 h-8 text-slate-500" />
                            <p className="text-xs text-slate-400">
                              Site has not been marked cleared yet.
                            </p>
                            <button
                              onClick={() => setIsResolutionModalOpen(true)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Clear Issue & Upload Proof</span>
                            </button>
                          </div>
                        )}

                        {selectedCase.status === 'Resolved' && (
                          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200">
                            Status: <strong>Case Cleared & Resolved</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CRYSTAL CLEAR CITIZEN REPORTED INCIDENT LOCATION & GPS */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-black/90 to-slate-900 border border-red-500/40 space-y-3 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-red-400 uppercase font-bold tracking-wider block">
                              Citizen Reported Incident Location & Coordinates
                            </span>
                            <h4 className="text-sm font-extrabold text-white">
                              📍 {selectedCase.location.address}
                            </h4>
                          </div>
                        </div>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedCase.location.lat},${selectedCase.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-xs font-bold text-red-300 hover:text-white flex items-center gap-1.5 transition-all self-start sm:self-center cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Open in Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                          <span className="text-[10px] text-slate-400 block font-mono">City / District / Jurisdiction:</span>
                          <span className="font-extrabold text-white text-sm block mt-0.5">
                            {selectedCase.location.city}
                            {selectedCase.location.district ? `, ${selectedCase.location.district}` : ''}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{selectedCase.location.state}, {selectedCase.location.country}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                          <span className="text-[10px] text-slate-400 block font-mono">Exact GPS Coordinates:</span>
                          <span className="font-mono text-red-400 font-bold text-xs block mt-1">
                            LAT: {selectedCase.location.lat.toFixed(6)}°
                          </span>
                          <span className="font-mono text-red-400 font-bold text-xs block">
                            LNG: {selectedCase.location.lng.toFixed(6)}°
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                            {selectedCase.location.isExactGps ? '✓ Verified Device GPS Pin' : 'Geocoded Address Pin'}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                          <span className="text-[10px] text-slate-400 block font-mono">Citizen Impact Estimate:</span>
                          <span className="font-extrabold text-white text-sm block mt-0.5">
                            {selectedCase.affectedPopulationEstimate.toLocaleString()} citizens
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Sector: <strong className="text-white">{selectedCase.category}</strong>
                          </span>
                          {selectedCase.hotspotName && (
                            <span className="text-[10px] text-amber-400 font-bold block mt-0.5">
                              Hotspot: {selectedCase.hotspotName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Why & Priority Score Breakdown */}
                    <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        AI Reasoning & Transparency
                      </span>
                      <div className="space-y-1 text-xs">
                        {selectedCase.criticalityReasons.map((r, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-slate-300">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ACTION CONTROLS BUTTONS (Section 21) */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-red-500/30 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div>
                          <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                            Official Decision & Field Action
                          </span>
                          <p className="text-[11px] text-slate-400">
                            Logged as: <strong className="text-white">{officialName}</strong> (📱 {officialMobile})
                          </p>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                          Authenticated Official Action Desk
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          onClick={() => handleUpdateStatus('Under Review')}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                        >
                          [ UNDER REVIEW ]
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('Assigned')}
                          className="p-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-xs font-bold text-blue-200 transition-colors cursor-pointer"
                        >
                          [ ASSIGN CREW ]
                        </button>
                        <button
                          onClick={handleRequestInfo}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                        >
                          [ REQUEST CITIZEN INFO ]
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('Action In Progress')}
                          className="p-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-xs font-bold text-amber-200 transition-colors cursor-pointer"
                        >
                          [ START ACTION ]
                        </button>
                      </div>

                      {/* PROMINENT CLEAR ISSUE & SUBMIT PROOF BUTTON */}
                      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => setIsResolutionModalOpen(true)}
                          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer active:scale-98"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>✨ CLEAR ISSUE & SUBMIT AFTER-PHOTO PROOF (சரி செய்யப்பட்டது)</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('Resolved')}
                          className="px-4 py-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition-colors cursor-pointer"
                          title="Direct status change to Resolved without proof upload"
                        >
                          Quick Mark Resolved
                        </button>
                      </div>

                      <input
                        type="text"
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        placeholder="Add official resolution log / engineering work order note..."
                        className="w-full p-2.5 rounded-xl bg-black/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-12 rounded-3xl bg-slate-900/40 border border-white/5 text-center text-slate-500">
                    Select a case from the list to view government command view
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRIORITY MAP (Section 20 in brief) */}
        {govTab === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white">Global Geographic Hotspot Explorer</h3>
                <p className="text-xs text-slate-400">
                  Interactive multi-layer geospatial intelligence across global civic jurisdictions.
                </p>
              </div>
            </div>

            <GlobalMap
              issues={issues}
              selectedIssue={selectedCase}
              onSelectIssue={(i) => {
                setSelectedCase(i);
                setGovTab('cases');
              }}
              heightClass="h-[520px]"
            />
          </div>
        )}

        {/* TAB 4: POLICY & BUDGET SIMULATOR (Section 24 in brief) */}
        {govTab === 'policy' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-red-500/30 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono text-red-400 uppercase font-bold tracking-wider">
                  AI Decision Support & Capital Allocation
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  Policy & Budget Simulator
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Test and compare municipal investment scenarios against real civic demand.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/40 text-xs font-mono text-red-300">
                AI ESTIMATE / DEMO SIMULATION
              </div>
            </div>

            {/* Budget Slider */}
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">Available Infrastructure Budget:</span>
                <span className="text-xl font-mono font-black text-red-400">
                  ${budgetSlider} Million (~₹{(budgetSlider * 8.3).toFixed(0)} Crore)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={budgetSlider}
                onChange={(e) => setBudgetSlider(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>$5M Minimum</span>
                <span>$25M Medium</span>
                <span>$50M Major Capital Plan</span>
              </div>
            </div>

            {/* Scenarios Comparison Cards */}
            {dynamicScenarios.length === 0 ? (
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center text-slate-400 text-xs">
                No civic issues logged yet to simulate policies. As citizen reports are recorded, dynamic investment scenarios will be generated.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dynamicScenarios.map((scenario) => {
                  const isSelected = selectedScenario?.id === scenario.id;
                  return (
                    <div
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario)}
                      className={`p-5 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-950 border-red-500/90 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
                          : 'bg-black/50 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white">{scenario.title}</span>
                          {scenario.recommended && (
                            <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/50 text-[9px] font-bold">
                              AI RECOMMENDED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{scenario.focus}</p>

                        {/* Scenario Metrics */}
                        <div className="mt-4 pt-3 border-t border-white/10 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Beneficiaries:</span>
                            <span className="font-mono font-bold text-white">
                              {scenario.beneficiaries.toLocaleString()} citizens
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Gap Reduction:</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {scenario.gapReductionPercent}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Accessibility Gain:</span>
                            <span className="font-mono text-cyan-400 font-bold">
                              +{scenario.accessibilityImprovement}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Composite Impact:</span>
                            <span className="font-mono text-red-400 font-bold">
                              {scenario.estimatedImpactScore} / 100
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 italic">
                        "{scenario.aiRationale}"
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Recommendation Summary */}
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/40 text-xs text-red-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">AI Policy Recommendation: </strong>
                “Scenario C delivers the highest combined civic ROI across all tested metrics: addresses priority regions, removes baseline infrastructure deficits, and covers vulnerable citizens.”
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FUTURE TREND PREDICTION (Section 25 in brief) */}
        {govTab === 'trends' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-white">Future Trend & Risk Predictions</h3>
              <p className="text-xs text-slate-400">
                Machine learning forecast predicting complaint velocity and structural infrastructure degradation risk.
              </p>
            </div>

            {dynamicTrends.length === 0 ? (
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center text-slate-400 text-xs">
                No active complaints available yet to calculate risk velocity models.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dynamicTrends.map((trend, idx) => (
                  <div key={idx} className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{trend.category}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trend.urgencyLevel === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400'
                        }`}
                      >
                        {trend.urgencyLevel}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-mono font-black text-white">{trend.currentCount}</span>
                        <span className="text-xs font-mono font-bold text-red-400">
                          +{trend.growthRatePercent}% vs last period
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Active citizen complaints</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase block">30-Day Risk:</span>
                        <p className="text-slate-300">{trend.risk30Days}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase block">6-Month Forecast:</span>
                        <p className="text-slate-300">{trend.risk6Months}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase block">1-Year Without Intervention:</span>
                        <p className="text-red-300">{trend.risk1Year}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 italic">
                      {trend.forecastSummary}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: IMPACT ANALYTICS (Section 26 in brief) */}
        {govTab === 'impact' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-white">Before vs After Civic Impact</h3>
                <p className="text-xs text-slate-400">
                  Empirical verification of government action effectiveness and public satisfaction.
                </p>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-red-950 border border-red-500/40 font-mono text-xs text-red-400 font-bold">
                Overall Civic Impact Score: 89 / 100
              </div>
            </div>

            {dynamicMetrics.length === 0 ? (
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center text-slate-400 text-xs">
                No impact data available yet. Impact metrics are computed dynamically as grievances are resolved and citizen verification ratings are received.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dynamicMetrics.map((metric, idx) => (
                  <div key={idx} className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{metric.metricName}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                        +{metric.improvementPercentage}% Improvement
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-center">
                        <span className="text-[10px] font-mono text-slate-400 block">BEFORE FIX</span>
                        <span className="text-lg font-mono font-bold text-red-400">{metric.beforeValue}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/40 text-center">
                        <span className="text-[10px] font-mono text-emerald-400 block">AFTER ACTION</span>
                        <span className="text-lg font-mono font-bold text-emerald-400">{metric.afterValue}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {metric.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: AI CAPITAL RECOMMENDATIONS (Section 23 in brief) */}
        {govTab === 'recommendations' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-white">AI Infrastructure Capital Proposals</h3>
              <p className="text-xs text-slate-400">
                Systemic infrastructure investments generated by clustering high-priority civic incident corridors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-slate-900 border border-red-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">PROJECT #1: ARTERIAL EMERGENCY HEALTHCARE CORRIDOR</span>
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/40 text-[10px] font-bold">
                    CRITICAL PRIORITY
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Comprehensive 6.8km road resurfacing, elevated storm drainage culverts, and dedicated emergency ambulance priority lanes connecting District Hospital.
                </p>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Beneficiaries:</span>
                    <span className="font-mono text-white font-bold">65,000 citizens / day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Emergency Delay Reduction:</span>
                    <span className="font-mono text-emerald-400 font-bold">-71% (20.2 mins saved)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supporting Evidence:</span>
                    <span className="text-slate-300">27 merged citizen reports + photo analysis</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">PROJECT #2: PERIPHERAL TRUNK WATER MAIN UPGRADE</span>
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-500/40 text-[10px] font-bold">
                    HIGH PRIORITY
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Replacement of 12.4km aging asbestos-cement water conduits with ductile iron pipeline and automated leak detection acoustic nodes.
                </p>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Beneficiaries:</span>
                    <span className="font-mono text-white font-bold">48,000 low-income residents</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Water Loss Prevention:</span>
                    <span className="font-mono text-emerald-400 font-bold">140,000 Liters / day saved</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supporting Evidence:</span>
                    <span className="text-slate-300">Unheard Community Detector flag</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. PHOTO LIGHTBOX MODAL (ZOOMABLE FULLSCREEN VIEWER) */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="relative max-w-4xl w-full max-h-[92vh] bg-slate-950 border border-red-500/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="p-4 bg-slate-900/90 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    lightboxImage.isResolvedProof
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-red-950 text-red-300 border border-red-500/40'
                  }`}>
                    {lightboxImage.isResolvedProof ? '✓ Cleared Site Resolution Proof' : 'Citizen Damage Evidence'}
                  </span>
                  <span className="text-xs font-bold text-white line-clamp-1">{lightboxImage.title}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="px-2 py-1 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-slate-300 hover:text-white cursor-pointer"
                    title="Reset Zoom"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    onClick={() => setLightboxImage(null)}
                    className="p-1.5 rounded-lg bg-red-600/30 hover:bg-red-600 border border-red-500/40 text-white cursor-pointer ml-1"
                    title="Close Lightbox"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Image Viewport */}
              <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-4 min-h-[300px] max-h-[65vh]">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  onError={(e) => handleCivicImageError(e, lightboxImage.isResolvedProof ? 'after' : 'before')}
                  style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg cursor-grab active:cursor-grabbing"
                />
              </div>

              {/* Modal Footer with details */}
              <div className="p-3.5 bg-slate-900/90 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="line-clamp-1">{lightboxImage.locationText || 'Location recorded with grievance'}</span>
                </div>

                {lightboxImage.analysis && (
                  <div className="text-[11px] font-mono text-slate-300">
                    AI Vision: <strong className="text-white">{lightboxImage.analysis.detectedObject}</strong> ({lightboxImage.analysis.severity} Severity)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. CLEARED SITE RESOLUTION MODAL */}
        {isResolutionModalOpen && selectedCase && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={() => setIsResolutionModalOpen(false)}
          >
            <div
              className="relative max-w-2xl w-full max-h-[92vh] bg-slate-950 border border-emerald-500/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Clear Civic Grievance & Submit Resolution Proof
                    </h3>
                    <p className="text-[11px] text-emerald-300/80">
                      Case: <span className="font-mono font-bold text-white">{selectedCase.id}</span> • {selectedCase.location.city}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsResolutionModalOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Before summary reference */}
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center gap-3">
                  {selectedCase.photoUrl && (
                    <img
                      src={selectedCase.photoUrl}
                      alt="Before"
                      onError={(e) => handleCivicImageError(e, 'before')}
                      className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] text-red-400 font-mono font-bold block">BEFORE (Reported Defect):</span>
                    <h5 className="font-bold text-white text-xs truncate">{selectedCase.title}</h5>
                    <p className="text-[11px] text-slate-400 truncate">{selectedCase.location.address}</p>
                  </div>
                </div>

                {/* Resolution Cleared Photo Selection */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-200 block">
                    1. Upload or Select Cleared Site Proof Photo (வேலை முடிந்த பின் எடுத்த புகைப்படம்):
                  </label>

                  {/* Preset quick-select buttons */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-mono">Quick Preset Verified Repairs:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: 'Paved Clean Road', url: 'https://images.unsplash.com/photo-1578961952402-f6f8e763137e?auto=format&fit=crop&w=800&q=80' },
                        { label: 'Cleared Storm Drain', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80' },
                        { label: 'Repaired Water Pipe', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80' },
                        { label: 'New Street Light', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80' },
                        { label: 'Sanitized Waste Site', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80' },
                        { label: 'Repaired Footpath', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setClearedPhotoUrl(preset.url)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            clearedPhotoUrl === preset.url
                              ? 'bg-emerald-950/90 border-emerald-400 text-white shadow'
                              : 'bg-black/50 border-white/10 text-slate-300 hover:border-white/30'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            onError={(e) => handleCivicImageError(e, 'after')}
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                          <span className="text-[11px] font-semibold leading-tight">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Photo URL or File Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Or paste custom photo URL:</span>
                      <input
                        type="text"
                        value={clearedPhotoUrl}
                        onChange={(e) => setClearedPhotoUrl(e.target.value)}
                        placeholder="https://example.com/cleared-photo.jpg"
                        className="w-full p-2.5 rounded-xl bg-black/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Or upload photo from device / camera:</span>
                      <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-black/70 border border-white/10 hover:border-emerald-500 text-slate-300 hover:text-white cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold">Choose Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setClearedPhotoUrl(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Cleared Photo Preview */}
                  {clearedPhotoUrl && (
                    <div className="p-2 rounded-xl bg-black/70 border border-emerald-500/40 flex items-center gap-3">
                      <img
                        src={clearedPhotoUrl}
                        alt="Preview"
                        onError={(e) => handleCivicImageError(e, 'after')}
                        className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Photo Proof Selected & Verified
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Will be permanently attached to case timeline and visible to citizens.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resolution Notes */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-200 block">
                    2. Work Completion Report & Action Log (வேலை விவரக் குறிப்பு):
                  </label>
                  <textarea
                    rows={2}
                    value={clearedNotes}
                    onChange={(e) => setClearedNotes(e.target.value)}
                    placeholder="e.g. Arterial road pothole milled, compacted with 50mm premix bitumen. Water drainage line unblocked with suction jetting. Fully opened for normal public transit."
                    className="w-full p-2.5 rounded-xl bg-black/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Contractor / Field Team Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-200 block text-[11px]">
                      3. Field Crew / Contractor:
                    </label>
                    <input
                      type="text"
                      value={clearedContractor}
                      onChange={(e) => setClearedContractor(e.target.value)}
                      placeholder="e.g. PWD Zone 4 Rapid Repair Team"
                      className="w-full p-2.5 rounded-xl bg-black/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mt-1"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block text-[11px]">
                      Certifying Official:
                    </label>
                    <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 mt-1">
                      <strong className="text-white">{officialName}</strong> (📱 {officialMobile})
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-900 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResolutionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolutionWithProof}
                  disabled={isSubmittingResolution}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingResolution ? 'Updating...' : 'Confirm Cleared & Mark Resolved'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. GOVERNMENT OFFICIAL REGISTRATION MODAL (NAME & MOBILE REGISTRATION) */}
        {isOfficialRegModalOpen && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={() => setIsOfficialRegModalOpen(false)}
          >
            <div
              className="relative max-w-lg w-full bg-slate-950 border border-red-500/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 bg-red-950/40 border-b border-red-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-600/20 text-red-400">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Official Government Employee Registration
                    </h3>
                    <p className="text-[11px] text-red-300/80">
                      Register official Name & Mobile Number for grievance authentication
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOfficialRegModalOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveOfficialProfile} className="p-5 space-y-4 text-xs">
                {regError && (
                  <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-semibold">
                    {regError}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    Official Full Name (அதிகாரி பெயர்) <span className="text-red-400">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={regOfficialName}
                    onChange={(e) => setRegOfficialName(e.target.value)}
                    placeholder="e.g. S. Murugan / Dr. Rajesh Sundaram"
                    className="w-full p-2.5 rounded-xl bg-black/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    Official Mobile Number (அலைபேசி எண்) <span className="text-red-400">*</span>:
                  </label>
                  <input
                    type="tel"
                    required
                    value={regOfficialMobile}
                    onChange={(e) => setRegOfficialMobile(e.target.value)}
                    placeholder="e.g. 98401 23456 / +91 9840123456"
                    className="w-full p-2.5 rounded-xl bg-black/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Used for SMS dispatch, OTP authentication, and audit accountability when resolving grievances.
                  </span>
                </div>

                {/* Department */}
                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    Department (துறை):
                  </label>
                  <select
                    value={regOfficialDept}
                    onChange={(e) => setRegOfficialDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/70 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="Public Works & Highways">Public Works & Highways (PWD)</option>
                    <option value="Municipal Administration & Water Supply">Municipal Administration & Water Supply (TWAD)</option>
                    <option value="Greater City Municipal Corporation">Greater City Municipal Corporation</option>
                    <option value="Electricity Board & Grid Operations">Electricity Board & Grid Operations (TNEB)</option>
                    <option value="Sanitation & Solid Waste Management">Sanitation & Solid Waste Management</option>
                    <option value="Revenue & Disaster Management">Revenue & Disaster Management</option>
                    <option value="Town & Country Planning">Town & Country Planning</option>
                  </select>
                </div>

                {/* Role / Designation & Badge ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-200 block mb-1">
                      Designation / Role:
                    </label>
                    <input
                      type="text"
                      value={regOfficialRole}
                      onChange={(e) => setRegOfficialRole(e.target.value)}
                      placeholder="e.g. Assistant Executive Engineer"
                      className="w-full p-2.5 rounded-xl bg-black/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">
                      Employee ID / Badge:
                    </label>
                    <input
                      type="text"
                      value={regOfficialBadge}
                      onChange={(e) => setRegOfficialBadge(e.target.value)}
                      placeholder="e.g. GOV-PWD-4891"
                      className="w-full p-2.5 rounded-xl bg-black/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsOfficialRegModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Official Credentials</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. FLOATING ACTION TOAST NOTIFICATION */}
        {actionToast && (
          <div className="fixed bottom-6 right-6 z-[110] max-w-md p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/50 text-white shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{actionToast.message}</span>
            <button
              onClick={() => setActionToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white ml-auto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
