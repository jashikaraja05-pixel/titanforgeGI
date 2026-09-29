import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Star,
  ExternalLink,
  Sparkles,
  MapPin,
  Calendar,
  Building2,
  ShieldCheck,
  ChevronRight,
  Send,
} from 'lucide-react';
import {
  CitizenNotification,
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  getUnreadCount,
  isSoundEnabled,
  setSoundEnabled,
  createResolutionNotification,
} from '../../services/citizenNotificationService';
import { handleCivicImageError } from '../../utils/imageFallback';
import { speakCivicText, stopSpeaking } from '../../services/multilingualVoiceService';
import { CivicIssue, SupportedLanguage } from '../../types';

interface Props {
  currentLanguage: SupportedLanguage;
  issuesList: CivicIssue[];
  onSelectIssue: (issue: CivicIssue) => void;
  onOpenGrievancesTab: () => void;
  onOpenLightbox?: (photoUrl: string, title: string, isResolvedProof: boolean) => void;
}

export const CitizenResolutionNotificationSystem: React.FC<Props> = ({
  currentLanguage,
  issuesList,
  onSelectIssue,
  onOpenGrievancesTab,
  onOpenLightbox,
}) => {
  const [notifications, setNotifications] = useState<CitizenNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeAlert, setActiveAlert] = useState<CitizenNotification | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isVoiceAnnouncing, setIsVoiceAnnouncing] = useState<boolean>(false);

  // Load notifications from storage
  const syncNotifications = () => {
    const list = getStoredNotifications();
    setNotifications(list);
    setUnreadCount(getUnreadCount());
    setSoundOn(isSoundEnabled());
  };

  useEffect(() => {
    syncNotifications();

    // Listen for custom immediate event
    const handleReceived = (e: any) => {
      syncNotifications();
      const notif = e.detail as CitizenNotification;
      if (notif) {
        setActiveAlert(notif);
        // Automatically announce in citizen's selected language
        triggerVoiceAnnouncement(notif);
      }
    };

    const handleUpdated = () => {
      syncNotifications();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'govinsight_citizen_notifications_v2') {
        syncNotifications();
      }
    };

    window.addEventListener('govinsight_citizen_notification_received', handleReceived);
    window.addEventListener('govinsight_citizen_notifications_updated', handleUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('govinsight_citizen_notification_received', handleReceived);
      window.removeEventListener('govinsight_citizen_notifications_updated', handleUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, [currentLanguage.code]);

  // Voice announcement of the resolution
  const triggerVoiceAnnouncement = (notif: CitizenNotification) => {
    setIsVoiceAnnouncing(true);
    let speechMessage = '';

    if (currentLanguage.code === 'ta') {
      speechMessage = `நல்ல செய்தி! உங்கள் புகார் எண் ${notif.issueId}, அரசு அதிகாரிகளால் சரி செய்யப்பட்டது என்று குறிக்கப்பட்டுள்ளது. தயவுசெய்து சரிசெய்யப்பட்ட இடத்தை சரிபார்க்கவும்.`;
    } else if (currentLanguage.code === 'hi') {
      speechMessage = `अच्छी खबर! आपकी शिकायत संख्या ${notif.issueId} सरकारी अधिकारियों द्वारा हल कर दी गई है। कृपया समाधान की पुष्टि करें।`;
    } else {
      speechMessage = `Great news! Your civic grievance ${notif.issueId}, titled ${notif.issueTitle}, has been officially marked as Resolved. Please verify the cleared site and submit your rating.`;
    }

    speakCivicText({
      text: speechMessage,
      langCode: currentLanguage.code,
      onEnd: () => {
        setIsVoiceAnnouncing(false);
      },
      onError: () => {
        setIsVoiceAnnouncing(false);
      },
    });
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // Inspect the resolved grievance
  const handleInspectResolvedIssue = (notif: CitizenNotification) => {
    markNotificationAsRead(notif.id);
    syncNotifications();
    setActiveAlert(null);

    const issue = issuesList.find((i) => i.id === notif.issueId);
    if (issue) {
      onSelectIssue(issue);
    }
    onOpenGrievancesTab();
  };

  // Simulate a government resolution notification for testing / demo
  const handleSimulateOfficialResolution = () => {
    const targetIssue =
      issuesList.find((i) => i.status !== 'Resolved') ||
      issuesList[0] || {
        id: `CIV-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Road Surface Defect & Pothole Repair',
        category: 'Roads & Infrastructure',
        location: {
          address: '42 Anna Salai, Mount Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          lat: 13.0827,
          lng: 80.2707,
          isExactGps: true,
        },
        assignedDepartment: 'Highways & Municipal Works',
        status: 'Open',
        timeline: [],
        createdAt: new Date().toISOString(),
        priorityScore: 88,
        aiSummary: 'Damaged pavement posing transit danger to commuter vehicles.',
      };

    createResolutionNotification(
      targetIssue as any,
      'Eng. Rajesh Kumar (Deputy Municipal Engineer)',
      'Asphalt cold mix and bituminous resurfacing completed with concrete curb reinforcement. Site inspected and reopened for public vehicular traffic.',
      'https://images.unsplash.com/photo-1578961952402-f6f8e763137e?auto=format&fit=crop&w=800&q=80'
    );
  };

  return (
    <>
      {/* 1. BELL BUTTON COMPONENT (For placement in PeopleDashboard Top HUD) */}
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className={`relative p-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
            unreadCount > 0
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
              : 'bg-black/60 border-white/10 hover:border-white/30 text-slate-300 hover:text-white'
          }`}
          title="Government Resolution Notifications"
        >
          <Bell className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold hidden sm:inline">
            {currentLanguage.code === 'ta' ? 'அறிவிப்புகள்' : 'Alerts'}
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[10px] font-black tracking-tight shrink-0">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. AUTOMATED FLOATING RESOLUTION ALERT BANNER (Slides in automatically on resolution) */}
      {activeAlert && (
        <aside
          role="status"
          aria-live="polite"
          aria-label="Automated Issue Resolution Notification"
          className="fixed top-20 right-4 z-[999] max-w-md w-full bg-slate-950 border-2 border-emerald-500/80 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.3)] overflow-hidden animate-in slide-in-from-top-4 duration-300 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-950/90 to-slate-900 border-b border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {currentLanguage.code === 'ta'
                    ? 'பிரச்சனை சரி செய்யப்பட்டது!'
                    : 'Grievance Marked Resolved!'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => triggerVoiceAnnouncement(activeAlert)}
                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                  isVoiceAnnouncing
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-white/10 hover:bg-white/20 border-white/10 text-emerald-300'
                }`}
                title="Speak alert announcement"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  markNotificationAsRead(activeAlert.id);
                  syncNotifications();
                  setActiveAlert(null);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Alert Body */}
          <div className="p-4 space-y-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/40">
                  {activeAlert.issueId}
                </span>
                <h4 className="font-bold text-white text-sm mt-1 leading-snug">
                  {activeAlert.issueTitle}
                </h4>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="line-clamp-1">{activeAlert.locationText}</span>
                </p>
              </div>

              {/* Cleared Photo Proof Thumbnail */}
              {activeAlert.resolutionPhotoUrl && (
                <div
                  onClick={() =>
                    onOpenLightbox &&
                    onOpenLightbox(
                      activeAlert.resolutionPhotoUrl!,
                      `${activeAlert.issueId} - Cleared Site Proof`,
                      true
                    )
                  }
                  className="relative group shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-black border border-emerald-500/50 cursor-pointer shadow"
                  title="Click to view full photo proof"
                >
                  <img
                    src={activeAlert.resolutionPhotoUrl}
                    alt="Cleared Proof"
                    onError={(e) => handleCivicImageError(e, 'after')}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  <div className="absolute inset-0 bg-emerald-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  </div>
                </div>
              )}
            </div>

            {/* Official note readout */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/20 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold text-emerald-300 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {activeAlert.actor}
                </span>
                <span className="font-mono">
                  {new Date(activeAlert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="italic text-slate-300 leading-relaxed">
                "{activeAlert.note}"
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleInspectResolvedIssue(activeAlert)}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>
                  {currentLanguage.code === 'ta'
                    ? 'முழு விபரம் & மதிப்பீடு செய்'
                    : 'Inspect Work & Rate Feedback'}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  markNotificationAsRead(activeAlert.id);
                  syncNotifications();
                  setActiveAlert(null);
                }}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                {currentLanguage.code === 'ta' ? 'மூடு' : 'Dismiss'}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 3. NOTIFICATION CENTER DRAWER / MODAL */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-950 border-l border-white/10 h-full flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                    <span>
                      {currentLanguage.code === 'ta'
                        ? 'அரசு நடவடிக்கை அறிவிப்புகள்'
                        : 'Government Resolution Alerts'}
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black">
                        {unreadCount} NEW
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {currentLanguage.code === 'ta'
                      ? 'உங்கள் புகார்கள் சரிசெய்யப்பட்ட விபரங்கள்'
                      : 'Live alerts when municipal teams fix your issues'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                    soundOn
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                      : 'bg-black/50 border-white/10 text-slate-500'
                  }`}
                  title={soundOn ? 'Sound chime enabled' : 'Sound chime muted'}
                >
                  {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                {notifications.length} Total Alerts Logged
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      markAllNotificationsAsRead();
                      syncNotifications();
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearAllNotifications();
                      syncNotifications();
                    }}
                    className="text-[11px] text-slate-500 hover:text-red-400 cursor-pointer"
                  >
                    Clear history
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Body / Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-black/40 border border-white/5 space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">No Resolution Alerts Yet</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                      When government engineers or municipal contractors mark your reported civic grievances as 'Resolved', instant alerts will appear here.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateOfficialResolution}
                    className="px-4 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition-colors flex items-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Test Automated Notification Alert</span>
                  </button>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      !notif.read
                        ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-black/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/50">
                          {notif.issueId}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(notif.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <h5 className="font-bold text-white text-xs mt-1.5">{notif.issueTitle}</h5>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="line-clamp-1">{notif.locationText}</span>
                    </p>

                    {/* Official Remarks */}
                    <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-white/5 text-[11px] text-slate-300">
                      <div className="text-[10px] text-emerald-400 font-semibold mb-0.5">
                        {notif.actor} • {notif.department}
                      </div>
                      <p className="italic text-slate-300 line-clamp-2">"{notif.note}"</p>
                    </div>

                    {/* Proof Images Thumbnails */}
                    {notif.resolutionPhotoUrl && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <div
                          onClick={() =>
                            onOpenLightbox &&
                            onOpenLightbox(
                              notif.resolutionPhotoUrl!,
                              `${notif.issueId} - Cleared Site Proof`,
                              true
                            )
                          }
                          className="relative group w-14 h-14 rounded-lg overflow-hidden bg-black border border-emerald-500/40 cursor-pointer shrink-0"
                          title="Click to view resolution photo"
                        >
                          <img
                            src={notif.resolutionPhotoUrl}
                            alt="Resolution"
                            onError={(e) => handleCivicImageError(e, 'after')}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold">
                            View
                          </div>
                        </div>
                        <div className="text-[10px] text-emerald-300">
                          <span className="font-bold block">✓ Cleared Site Photo Proof</span>
                          <span className="text-slate-400">Inspected & Verified by Public Works</span>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleInspectResolvedIssue(notif)}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect Grievance & Rate Work</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerVoiceAnnouncement(notif)}
                        className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                        title="Listen voice announcement"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer with Simulator Test Button */}
            <div className="p-3 bg-slate-900 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500">
                Civic Notification Engine Active
              </span>
              <button
                type="button"
                onClick={handleSimulateOfficialResolution}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                title="Simulate official resolving an issue to test alerts"
              >
                <Sparkles className="w-3 h-3" />
                <span>Simulate Resolution</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
