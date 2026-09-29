// Automated Notification System for Citizens
// Alerts citizens when municipal/government officials mark their reported grievances as 'Resolved'

import { CivicIssue } from '../types';

export interface CitizenNotification {
  id: string;
  issueId: string;
  issueTitle: string;
  category: string;
  locationText: string;
  status: 'Resolved';
  actor: string;
  department: string;
  note: string;
  resolutionPhotoUrl?: string;
  originalPhotoUrl?: string;
  timestamp: string;
  read: boolean;
  ratingSubmitted?: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = 'govinsight_citizen_notifications_v2';
const NOTIFICATION_SOUND_KEY = 'govinsight_notif_sound_enabled';

// Play a pleasant, pure Web Audio synthesized two-tone municipal chime (No external audio file dependencies)
export function playNotificationChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const soundEnabled = localStorage.getItem(NOTIFICATION_SOUND_KEY) !== 'false';
    if (!soundEnabled) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Tone 1 (Warm civic alert)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.2);

    // Tone 2 (Resolution chime - higher pitch)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12); // G5
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // Audio context may be restricted before first user interaction
  }
}

export function getStoredNotifications(): CitizenNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse citizen notifications', e);
    return [];
  }
}

export function saveStoredNotifications(notifs: CitizenNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
    window.dispatchEvent(new Event('govinsight_citizen_notifications_updated'));
  } catch (e) {
    console.error('Failed to save citizen notifications', e);
  }
}

export function createResolutionNotification(
  issue: CivicIssue,
  actor: string,
  note: string,
  resolutionPhotoUrl?: string
): CitizenNotification {
  const notifs = getStoredNotifications();

  // Avoid duplicate notifications for same issue resolution
  const existing = notifs.find(
    (n) => n.issueId === issue.id && Math.abs(new Date(n.timestamp).getTime() - new Date().getTime()) < 30000
  );
  if (existing) return existing;

  const newNotif: CitizenNotification = {
    id: `notif-${Date.now()}-${issue.id.toLowerCase()}`,
    issueId: issue.id,
    issueTitle: issue.title,
    category: issue.category,
    locationText: `${issue.location.address}, ${issue.location.city}`,
    status: 'Resolved',
    actor: actor || 'Municipal Official',
    department: issue.assignedDepartment || 'Public Works Department',
    note: note || 'The defect at this location has been inspected and cleared.',
    resolutionPhotoUrl: resolutionPhotoUrl || issue.resolutionPhotoUrl,
    originalPhotoUrl: issue.photoUrl,
    timestamp: new Date().toISOString(),
    read: false,
    ratingSubmitted: !!issue.citizenFeedback,
  };

  const updated = [newNotif, ...notifs];
  saveStoredNotifications(updated);

  // Play chime
  playNotificationChime();

  // Broadcast immediate event for active citizen dashboard
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('govinsight_citizen_notification_received', {
        detail: newNotif,
      })
    );
  }

  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const notifs = getStoredNotifications();
  const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStoredNotifications(updated);
}

export function markAllNotificationsAsRead(): void {
  const notifs = getStoredNotifications();
  const updated = notifs.map((n) => ({ ...n, read: true }));
  saveStoredNotifications(updated);
}

export function clearAllNotifications(): void {
  saveStoredNotifications([]);
}

export function getUnreadCount(): number {
  const notifs = getStoredNotifications();
  return notifs.filter((n) => !n.read).length;
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(NOTIFICATION_SOUND_KEY) !== 'false';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_SOUND_KEY, enabled ? 'true' : 'false');
}
