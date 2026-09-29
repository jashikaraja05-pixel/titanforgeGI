import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { UserFeedback } from '../types';

const FEEDBACK_COLLECTION = 'feedback';
const LOCAL_STORAGE_KEY = 'govinsight_user_feedback_cache_v1';

export const INITIAL_FEEDBACK_ITEMS: UserFeedback[] = [];

/**
 * Stores a user feedback entry into Firebase Firestore
 */
export async function storeUserFeedback(
  feedbackInput: Omit<UserFeedback, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<UserFeedback> {
  const feedbackId = feedbackInput.id || `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = feedbackInput.createdAt || new Date().toISOString();

  // If userId is missing, fall back to current authenticated user or generate session ID
  const effectiveUserId =
    feedbackInput.userId || auth.currentUser?.uid || `visitor_${Math.random().toString(36).substring(2, 9)}`;

  const feedbackData: UserFeedback = {
    ...feedbackInput,
    id: feedbackId,
    userId: effectiveUserId,
    userName: feedbackInput.userName || auth.currentUser?.displayName || 'Citizen Contributor',
    userEmail: feedbackInput.userEmail || auth.currentUser?.email || undefined,
    userRole: feedbackInput.userRole || 'citizen',
    category: feedbackInput.category || 'general',
    rating: Math.min(5, Math.max(1, Number(feedbackInput.rating) || 5)),
    comment: feedbackInput.comment.trim(),
    createdAt: timestamp,
  };

  const docRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
  const path = `${FEEDBACK_COLLECTION}/${feedbackId}`;

  try {
    const cleanData = JSON.parse(JSON.stringify(feedbackData));
    await setDoc(docRef, cleanData, { merge: true });

    // Cache locally for offline availability
    saveToLocalCache(feedbackData);
    window.dispatchEvent(new CustomEvent('govinsight_feedback_saved', { detail: feedbackData }));

    return feedbackData;
  } catch (error) {
    // If offline or permission notice, cache locally first then report
    saveToLocalCache(feedbackData);
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Fetches all user feedback from Firebase Firestore, ordered by creation time
 */
export async function fetchUserFeedback(): Promise<UserFeedback[]> {
  const collectionRef = collection(db, FEEDBACK_COLLECTION);
  const path = FEEDBACK_COLLECTION;

  try {
    const q = query(collectionRef, orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);

    const feedbackList: UserFeedback[] = [];
    snapshot.forEach((docSnap) => {
      feedbackList.push(docSnap.data() as UserFeedback);
    });

    if (feedbackList.length > 0) {
      updateLocalCacheAll(feedbackList);
      return feedbackList;
    }

    // If Firestore has no documents yet, return local cache
    const cached = getFromLocalCache();
    return cached.length > 0 ? cached : [];
  } catch (error) {
    // Try fallback to local cache
    const cached = getFromLocalCache();
    if (cached.length > 0) {
      return cached;
    }
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Subscribes to real-time updates for user feedback collection
 */
export function subscribeToUserFeedback(
  callback: (feedbackList: UserFeedback[]) => void
): () => void {
  const collectionRef = collection(db, FEEDBACK_COLLECTION);
  const path = FEEDBACK_COLLECTION;

  try {
    const q = query(collectionRef, orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const feedbackList: UserFeedback[] = [];
        snapshot.forEach((docSnap) => {
          feedbackList.push(docSnap.data() as UserFeedback);
        });

        if (feedbackList.length > 0) {
          updateLocalCacheAll(feedbackList);
          callback(feedbackList);
        } else {
          // Fall back to cache if collection is empty
          const cached = getFromLocalCache();
          callback(cached.length > 0 ? cached : []);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Fetches user feedback specific to a particular user ID
 */
export async function getUserFeedbackByUserId(userId: string): Promise<UserFeedback[]> {
  const collectionRef = collection(db, FEEDBACK_COLLECTION);
  const path = FEEDBACK_COLLECTION;

  try {
    const q = query(collectionRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const results: UserFeedback[] = [];
    snapshot.forEach((docSnap) => {
      results.push(docSnap.data() as UserFeedback);
    });
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Seeds initial demonstration feedback documents to Firestore
 */
export async function seedInitialFeedbackToFirestore(): Promise<number> {
  let count = 0;
  for (const item of INITIAL_FEEDBACK_ITEMS) {
    try {
      const docRef = doc(db, FEEDBACK_COLLECTION, item.id);
      await setDoc(docRef, JSON.parse(JSON.stringify(item)), { merge: true });
      count++;
    } catch (err) {
      console.warn(`Feedback seed item notice (${item.id}):`, err);
    }
  }
  return count;
}

// --- Local Cache Helpers ---

function getFromLocalCache(): UserFeedback[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToLocalCache(item: UserFeedback): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getFromLocalCache();
    const filtered = current.filter((x) => x.id !== item.id);
    filtered.unshift(item);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

function updateLocalCacheAll(items: UserFeedback[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}
