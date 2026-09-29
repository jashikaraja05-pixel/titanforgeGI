import React, { useState, useEffect } from 'react';
import { UserFeedback, SupportedLanguage } from '../../types';
import {
  GeminiSentimentAnalysisResult,
  analyzeFeedbackSentiment,
  getCachedSentiment,
} from '../../services/sentimentService';
import { SentimentSummaryCard } from './SentimentSummaryCard';
import {
  fetchUserFeedback,
  storeUserFeedback,
  subscribeToUserFeedback,
} from '../../services/feedbackService';
import {
  Smile,
  Meh,
  Frown,
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  Layers,
  Lightbulb,
  Search,
} from 'lucide-react';

interface CitizenSentimentMiniDashboardProps {
  currentLanguage: SupportedLanguage;
  userDistrict: string;
  userState: string;
  userData?: any;
}

export const CitizenSentimentMiniDashboard: React.FC<CitizenSentimentMiniDashboardProps> = ({
  currentLanguage,
  userDistrict,
  userState,
  userData,
}) => {
  const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);
  const [sentiment, setSentiment] = useState<GeminiSentimentAnalysisResult | null>(getCachedSentiment());
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New feedback form states
  const [newRating, setNewRating] = useState(5);
  const [newCategory, setNewCategory] = useState('government_action');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const jurisdiction = `${userDistrict || 'Chennai'}, ${userState || 'Tamil Nadu'}`;

  // Real-time subscription to public feedback
  useEffect(() => {
    const unsubscribe = subscribeToUserFeedback((items) => {
      setFeedbackList(items);
      // Run sentiment analysis if initial load or if not yet analyzed
      if (!sentiment) {
        runSentimentAnalysis(items);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const runSentimentAnalysis = async (itemsToAnalyze?: UserFeedback[]) => {
    setIsLoadingAnalysis(true);
    const items = itemsToAnalyze || feedbackList;
    try {
      const result = await analyzeFeedbackSentiment(items, jurisdiction);
      setSentiment(result);
    } catch (err) {
      console.warn('Sentiment analysis trigger error:', err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Submit new feedback directly
  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      await storeUserFeedback({
        userId: userData?.id || `citizen_${Date.now()}`,
        userName: userData?.fullName || 'Citizen Contributor',
        userRole: userData?.role || 'citizen',
        category: newCategory,
        rating: newRating,
        comment: newComment.trim(),
        resolved: true,
      });

      setNewComment('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3500);

      // Re-run sentiment analysis with the latest updated items
      const updatedList = await fetchUserFeedback();
      if (updatedList) {
        setFeedbackList(updatedList);
        await runSentimentAnalysis(updatedList);
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Associate per-comment sentiment tags from Gemini
  const getCommentSentimentInfo = (commentId: string, rating: number) => {
    if (sentiment?.perCommentSentiments) {
      const match = sentiment.perCommentSentiments.find((p) => p.commentId === commentId);
      if (match) return match;
    }

    // Default fallback based on star rating
    if (rating >= 4) {
      return { sentiment: 'POSITIVE', emotion: 'Satisfaction & Gratitude', score: 90 };
    } else if (rating === 3) {
      return { sentiment: 'NEUTRAL', emotion: 'Constructive Expectation', score: 60 };
    } else {
      return { sentiment: 'NEGATIVE', emotion: 'Urgency / Concern', score: 30 };
    }
  };

  // Filter feedback
  const filteredFeedback = feedbackList.filter((item) => {
    const sInfo = getCommentSentimentInfo(item.id, item.rating);
    if (filterSentiment === 'positive' && sInfo.sentiment !== 'POSITIVE') return false;
    if (filterSentiment === 'neutral' && sInfo.sentiment !== 'NEUTRAL') return false;
    if (filterSentiment === 'negative' && sInfo.sentiment !== 'NEGATIVE') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComment = item.comment.toLowerCase().includes(q);
      const matchUser = (item.userName || '').toLowerCase().includes(q);
      const matchCategory = (item.category || '').toLowerCase().includes(q);
      return matchComment || matchUser || matchCategory;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. HERO SENTIMENT SUMMARY CARD */}
      <SentimentSummaryCard
        sentiment={sentiment}
        isLoading={isLoadingAnalysis}
        onRefresh={() => runSentimentAnalysis()}
        compact={false}
      />

      {/* 2. SECTOR SENTIMENT GRID */}
      {sentiment?.sectorSentiments && sentiment.sectorSentiments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-400" />
              <span>Sector Sentiment Breakdown ({jurisdiction})</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Evaluated across civic infrastructure departments
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {sentiment.sectorSentiments.map((sec, idx) => {
              const isPositive = sec.sentiment.toLowerCase() === 'positive';
              const isNeutral = sec.sentiment.toLowerCase() === 'neutral';

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 truncate">{sec.sector}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isPositive
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : isNeutral
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {sec.sentiment}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-white">{sec.score}</span>
                    <span className="text-xs text-slate-400 font-mono">/ 100</span>
                    <span className="text-[11px] text-slate-400 ml-auto">
                      {sec.feedbackCount} feedback entries
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {sec.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ACTIONABLE CIVIC RECOMMENDATIONS */}
      {sentiment?.actionableRecommendations && sentiment.actionableRecommendations.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/30 via-slate-900 to-black border border-red-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
              Gemini Civic Action Recommendations for Local Officials
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sentiment.actionableRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1 text-xs text-slate-200"
              >
                <div className="flex items-center gap-1.5 text-red-400 font-mono text-[10px] font-bold">
                  <span>PRIORITY #{idx + 1}</span>
                </div>
                <p className="leading-relaxed text-[11px] text-slate-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. FEEDBACK FEED WITH GEMINI SENTIMENT TAGS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-extrabold text-white">
              Public Citizen Reviews ({feedbackList.length})
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Tagged with real-time Gemini sentiment classification
            </span>
          </div>

          {/* Filter Pills and Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews..."
                className="w-36 sm:w-48 pl-7 pr-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'positive', label: 'Positive (🟢)' },
                { id: 'neutral', label: 'Constructive (🟡)' },
                { id: 'negative', label: 'Critical (🔴)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterSentiment(tab.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filterSentiment === tab.id
                      ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback List Container */}
        <div className="space-y-3">
          {filteredFeedback.length === 0 ? (
            <div className="p-8 text-center bg-black/40 rounded-2xl border border-white/5 text-slate-500 text-xs">
              No citizen comments found for this sentiment filter.
            </div>
          ) : (
            filteredFeedback.map((item) => {
              const sInfo = getCommentSentimentInfo(item.id, item.rating);
              const isPos = sInfo.sentiment === 'POSITIVE';
              const isNeu = sInfo.sentiment === 'NEUTRAL';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/10 hover:border-white/20 transition-all space-y-3"
                >
                  {/* Top Row: User, Role, Rating & Sentiment Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {item.userName ? item.userName.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{item.userName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-white/5 text-slate-400 border border-white/10">
                            {item.userRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Gemini Sentiment Classification Tag */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
                          isPos
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : isNeu
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {isPos ? (
                          <Smile className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isNeu ? (
                          <Meh className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Frown className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>{sInfo.sentiment}</span>
                        {sInfo.score && (
                          <span className="text-[10px] opacity-75">({sInfo.score}%)</span>
                        )}
                      </span>

                      {/* Emotion Tag */}
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300">
                        {sInfo.emotion}
                      </span>

                      {/* Star Rating */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal bg-black/40 p-3 rounded-xl border border-white/5">
                    "{item.comment}"
                  </p>

                  {/* Issue link or metadata if present */}
                  {item.issueTitle && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>Related Case:</span>
                      <span className="text-red-400 font-semibold">{item.issueId}</span>
                      <span>—</span>
                      <span className="truncate max-w-sm text-slate-300">{item.issueTitle}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. ADD CITIZEN FEEDBACK FORM */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#090b14] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-400" />
            <h4 className="text-sm font-extrabold text-white">
              Submit Public Feedback to Analyze Live
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Real-time Firestore & Gemini integration
          </span>
        </div>

        <form onSubmit={handleAddFeedback} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Rating Selector */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Satisfaction Rating (1 to 5 Stars)
              </label>
              <div className="flex items-center gap-2 p-2 bg-black/50 rounded-xl border border-white/10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= newRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-mono text-slate-300 ml-2">
                  {newRating} Star{newRating > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Civic Category / Department
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full p-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="government_action">Municipal Repair Action</option>
                <option value="civic_service">Water Supply & Potable Mains</option>
                <option value="roads">Roads & Arterial Pothole Patching</option>
                <option value="power">Street Lighting & Power Grid</option>
                <option value="accessibility">Voice AI & Accessibility</option>
              </select>
            </div>
          </div>

          {/* Comment Text Area */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Your Public Feedback or Community Observation
            </label>
            <textarea
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="e.g., The road repairs at T. Nagar were completed quickly, but drain cleaning on the side road is still pending..."
              className="w-full p-3 bg-black/50 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center justify-between">
            {submitSuccess ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Feedback posted & Gemini re-analyzed sentiment!</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">
                Your review helps municipal authorities benchmark citizen satisfaction.
              </span>
            )}

            <button
              type="submit"
              disabled={isSubmittingFeedback || !newComment.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingFeedback ? 'Submitting & Analyzing...' : 'Submit Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
