import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  ThumbsUp,
  Sparkles,
  Database,
  Building2,
  Users,
} from 'lucide-react';
import {
  storeUserFeedback,
  subscribeToUserFeedback,
} from '../../services/feedbackService';
import { UserFeedback } from '../../types';
import { auth } from '../../services/firebase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'platform' | 'government_action' | 'civic_service' | 'ai_accuracy' | 'general';
  associatedIssueId?: string;
  associatedIssueTitle?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'platform',
  associatedIssueId,
  associatedIssueTitle,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>(defaultCategory);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    // Real-time subscription to Firestore feedback collection
    const unsubscribe = subscribeToUserFeedback((items) => {
      setFeedbackList(items);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMessage('Please provide a brief comment describing your feedback.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await storeUserFeedback({
        userId: auth.currentUser?.uid || `visitor_${Date.now()}`,
        userName: auth.currentUser?.displayName || 'Active Citizen',
        userEmail: auth.currentUser?.email || undefined,
        userRole: auth.currentUser?.email?.includes('gov') ? 'government' : 'citizen',
        category: category as any,
        rating,
        comment: comment.trim(),
        issueId: associatedIssueId,
        issueTitle: associatedIssueTitle,
      });

      setIsSuccess(true);
      setComment('');
      setTimeout(() => {
        setIsSuccess(false);
      }, 3500);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setErrorMessage('Failed to save feedback to Firestore. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating =
    feedbackList.length > 0
      ? (feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / feedbackList.length).toFixed(1)
      : '5.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0b0d13] border border-red-500/30 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Civic Intelligence & Platform Feedback</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono">
                  Firestore Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct community & official evaluation stored in Firebase Firestore
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-600/20 text-slate-400 hover:text-white transition-colors border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Rating overview score banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-black/60 border border-white/10">
            <div className="text-center sm:text-left flex flex-col justify-center">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Average Rating</span>
              <div className="flex items-center gap-2 justify-center sm:justify-start mt-0.5">
                <span className="text-2xl font-black text-white">{avgRating}</span>
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i <= Math.round(Number(avgRating)) ? 'fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3 flex flex-col justify-center">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Total Submissions</span>
              <span className="text-xl font-black text-red-400 mt-0.5">{feedbackList.length}</span>
            </div>

            <div className="text-center border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3 flex flex-col justify-center">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Firestore Collection</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold mt-0.5">/feedback</span>
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-red-500/20">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>Submit User Feedback & Rating</span>
            </h3>

            {/* Interactive Star Rating */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Your Satisfaction Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-mono text-amber-400 font-bold">
                  {rating === 5 && 'Outstanding (5/5)'}
                  {rating === 4 && 'Good / Prompt (4/5)'}
                  {rating === 3 && 'Acceptable (3/5)'}
                  {rating === 2 && 'Needs Improvement (2/5)'}
                  {rating === 1 && 'Unsatisfactory (1/5)'}
                </span>
              </div>
            </div>

            {/* Category Select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Feedback Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="platform">Platform Experience & Speed</option>
                  <option value="government_action">Government Action & Response Time</option>
                  <option value="civic_service">Municipal Civic Service Quality</option>
                  <option value="ai_accuracy">AI Severity & Geo-Tagging Accuracy</option>
                  <option value="resolution">Grievance Resolution Verification</option>
                  <option value="general">General Recommendation</option>
                </select>
              </div>

              {associatedIssueTitle && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Related Civic Issue
                  </label>
                  <input
                    type="text"
                    disabled
                    value={associatedIssueTitle}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-400 truncate"
                  />
                </div>
              )}
            </div>

            {/* Comment Area */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Your Comments or Recommendations <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe your civic experience, speed of resolution, or suggestions for the municipal administration..."
                className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-400 bg-red-950/60 p-2.5 rounded-xl border border-red-500/40">
                {errorMessage}
              </p>
            )}

            {isSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-500/40">
                <CheckCircle2 className="w-4 h-4" />
                <span>Feedback stored in Firebase Firestore collection `/feedback`!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Storing in Firestore...' : 'Submit Feedback to Firestore'}</span>
            </button>
          </form>

          {/* Recent Firestore Feedback Stream */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Recent Public Feedback Stream</span>
              <span className="text-[10px] font-mono text-slate-500">Live Sync</span>
            </h3>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {feedbackList.map((fb) => (
                <div
                  key={fb.id}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs hover:border-red-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{fb.userName || 'Citizen'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 capitalize">
                        {fb.category?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= fb.rating ? 'fill-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-[11px]">{fb.comment}</p>

                  {fb.issueTitle && (
                    <div className="text-[10px] text-slate-500 font-mono">
                      Ref: <span className="text-red-400">{fb.issueTitle}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5">
                    <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                    <span className="font-mono text-[9px] text-slate-600">ID: {fb.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <Database className="w-3.5 h-3.5 text-red-400" />
            <span>Database: ai-studio-govinsight-3005641a-1145-4c40-a7ef-eb155c718ce4</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
