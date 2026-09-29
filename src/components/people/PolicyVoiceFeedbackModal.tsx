import React, { useState, useEffect, useRef } from 'react';
import { GovernmentPolicy, UserFeedback } from '../../types';
import { storeUserFeedback } from '../../services/feedbackService';
import { speakAIAssistantVoice, stopAIAssistantVoice } from '../../services/voiceAssistantService';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ThumbsUp,
  ThumbsDown,
  Star,
  Languages,
  RotateCcw,
  Check,
  Building2,
  MapPin,
  Radio,
  FileText,
  Clock,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

interface PolicyVoiceFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: GovernmentPolicy | null;
  userData?: any;
  defaultLangCode?: string;
  onFeedbackSubmitted?: (feedback: UserFeedback) => void;
}

const VOICE_LANGUAGES = [
  { code: 'ta-IN', shortCode: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'en-US', shortCode: 'en', label: 'English (US)', flag: '🌐' },
  { code: 'en-IN', shortCode: 'en-in', label: 'English (India)', flag: '🇮🇳' },
  { code: 'hi-IN', shortCode: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'ml-IN', shortCode: 'ml', label: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
  { code: 'te-IN', shortCode: 'te', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'kn-IN', shortCode: 'kn', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'es-ES', shortCode: 'es', label: 'Español', flag: '🇪🇸' },
];

const FEEDBACK_TAGS = [
  'General Citizen Feedback',
  'Implementation Suggestion',
  'Neighborhood Impact',
  'Public Safety Concern',
  'Drainage & Water Supply',
  'Road & Transit Impact',
  'Timelines & Delays',
  'Strong Endorsement',
];

export const PolicyVoiceFeedbackModal: React.FC<PolicyVoiceFeedbackModalProps> = ({
  isOpen,
  onClose,
  policy,
  userData,
  defaultLangCode = 'ta',
  onFeedbackSubmitted,
}) => {
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<string>(() => {
    if (defaultLangCode === 'ta') return 'ta-IN';
    if (defaultLangCode === 'hi') return 'hi-IN';
    if (defaultLangCode === 'ml') return 'ml-IN';
    if (defaultLangCode === 'te') return 'te-IN';
    if (defaultLangCode === 'kn') return 'kn-IN';
    if (defaultLangCode === 'es') return 'es-ES';
    return 'en-US';
  });

  const [rating, setRating] = useState<number>(4);
  const [selectedTag, setSelectedTag] = useState<string>('Neighborhood Impact');
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [hasVoiceInput, setHasVoiceInput] = useState<boolean>(false);
  const [isSpeakingBack, setIsSpeakingBack] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Check Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSpeechSupported(!!SpeechRecognition);
    }
  }, []);

  // Sync default language when changed from props
  useEffect(() => {
    if (defaultLangCode === 'ta') setSelectedVoiceLang('ta-IN');
    else if (defaultLangCode === 'hi') setSelectedVoiceLang('hi-IN');
    else if (defaultLangCode === 'ml') setSelectedVoiceLang('ml-IN');
    else if (defaultLangCode === 'te') setSelectedVoiceLang('te-IN');
    else if (defaultLangCode === 'kn') setSelectedVoiceLang('kn-IN');
    else if (defaultLangCode === 'es') setSelectedVoiceLang('es-ES');
    else setSelectedVoiceLang('en-US');
  }, [defaultLangCode]);

  // Clean up recording on unmount or close
  useEffect(() => {
    return () => {
      stopRecording();
      stopAIAssistantVoice();
    };
  }, []);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  if (!isOpen || !policy) return null;

  // Start Voice-to-Text via browser Web Speech API
  const startRecording = () => {
    setErrorMessage('');
    stopAIAssistantVoice();
    setIsSpeakingBack(false);

    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'Web Speech API is not supported in this browser. Please use Google Chrome, Edge, or type your feedback below.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedVoiceLang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        if (finalChunk) {
          setTranscribedText((prev) => {
            const separator = prev.trim().length > 0 ? ' ' : '';
            return (prev.trim() + separator + finalChunk.trim()).trim();
          });
          setHasVoiceInput(true);
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event notice:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error === 'no-speech') {
          // Handled silently
        } else {
          setErrorMessage(`Speech recognition notice: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText('');
      };

      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      setErrorMessage('Could not activate microphone. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimText('');
  };

  // Toggle Voice Input
  const handleToggleVoice = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Read Back Transcribed Feedback via TTS for verification
  const handleReadBack = async () => {
    if (isSpeakingBack) {
      stopAIAssistantVoice();
      setIsSpeakingBack(false);
      return;
    }

    const textToRead = (transcribedText + ' ' + interimText).trim();
    if (!textToRead) return;

    setIsSpeakingBack(true);
    const shortCode = selectedVoiceLang.split('-')[0] || 'ta';

    await speakAIAssistantVoice(
      textToRead,
      shortCode,
      () => setIsSpeakingBack(true),
      () => setIsSpeakingBack(false)
    );
  };

  // Submit Feedback to Firestore
  const handleSubmitFeedback = async () => {
    const finalComment = (transcribedText + ' ' + interimText).trim();
    if (!finalComment) {
      setErrorMessage('Please speak or type your feedback before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const citizenName = userData?.name || 'Citizen Contributor';
      const citizenDistrict = userData?.district || policy.affectedDistrict || 'Chennai';
      const formattedComment = `[${selectedTag}] ${finalComment}`;

      const saved = await storeUserFeedback({
        userId: userData?.uid || `citizen_${Date.now()}`,
        userName: citizenName,
        userRole: 'citizen',
        category: 'policy_feedback',
        rating,
        comment: formattedComment,
        policyId: policy.id,
        policyTitle: policy.title,
        inputMode: hasVoiceInput ? 'voice' : 'text',
        language: selectedVoiceLang,
      });

      setSubmitSuccess(true);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(saved);
      }

      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
        setTranscribedText('');
        setInterimText('');
        setHasVoiceInput(false);
      }, 2200);
    } catch (err: any) {
      console.warn('Error submitting policy feedback:', err);
      setErrorMessage('Could not record feedback right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#090b14] border border-red-500/40 rounded-3xl shadow-[0_0_60px_rgba(239,68,68,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-slate-950/90 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.3)] shrink-0">
              <Mic className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Voice Feedback on Government Policy
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold">
                  Web Speech API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Speak your opinions, local impact, or suggestions directly — no typing required
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopRecording();
              stopAIAssistantVoice();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Policy Context Card */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-red-400">
                <Building2 className="w-3.5 h-3.5" />
                <span>{policy.department}</span>
              </span>
              <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                <MapPin className="w-3 h-3 text-red-400" />
                <span>
                  {policy.affectedDistrict ? `${policy.affectedDistrict}, ` : ''}
                  {policy.affectedState}
                </span>
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white leading-snug">
              {policy.title}
            </h3>
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {policy.summary}
            </p>
          </div>

          {/* Language Selection Ribbon for Speech-to-Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-red-400" />
                <span>Choose Voice Language:</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                Active: {selectedVoiceLang}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {VOICE_LANGUAGES.map((lang) => {
                const isSelected = selectedVoiceLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      if (isRecording) stopRecording();
                      setSelectedVoiceLang(lang.code);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Web Speech API Live Microphone Control Box */}
          <div
            className={`p-5 rounded-2xl border transition-all text-center relative overflow-hidden ${
              isRecording
                ? 'bg-gradient-to-b from-red-950/60 to-black border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.35)]'
                : 'bg-black/50 border-white/10 hover:border-white/20'
            }`}
          >
            {/* Background Soundwave Simulation when Recording */}
            {isRecording && (
              <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center gap-1">
                {[40, 70, 95, 60, 100, 80, 50, 90, 75, 100, 85, 45, 65].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-2 bg-red-500 rounded-full animate-pulse"
                  />
                ))}
              </div>
            )}

            <div className="relative z-10 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                  isRecording
                    ? 'bg-red-600 text-white scale-110 shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse'
                    : 'bg-gradient-to-tr from-red-600 to-rose-500 text-white hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                }`}
                title={isRecording ? 'Click to finish speaking' : 'Click to start voice recording'}
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>

              <div className="space-y-1">
                <p className="text-sm font-extrabold text-white">
                  {isRecording ? (
                    <span className="flex items-center justify-center gap-2 text-red-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span>Listening... Speak your feedback now ({recordingSeconds}s)</span>
                    </span>
                  ) : (
                    <span>Tap microphone to speak your feedback</span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {isRecording
                    ? 'Say what you like, what is missing, or how this policy impacts your community.'
                    : 'Web Speech API converts your spoken words into text in real time.'}
                </p>
              </div>
            </div>
          </div>

          {/* Live Transcribed Feedback Text Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-400" />
                <span>Transcribed Feedback (குரல் உரை):</span>
              </label>

              <div className="flex items-center gap-2">
                {transcribedText && (
                  <button
                    type="button"
                    onClick={handleReadBack}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                      isSpeakingBack
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                    title="Verify by listening to the transcribed speech"
                  >
                    {isSpeakingBack ? (
                      <>
                        <VolumeX className="w-3 h-3" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 text-red-400" />
                        <span>Listen to Verify</span>
                      </>
                    )}
                  </button>
                )}

                {transcribedText && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscribedText('');
                      setInterimText('');
                      setHasVoiceInput(false);
                    }}
                    className="text-[11px] text-slate-400 hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={transcribedText + (interimText ? ` [${interimText}]` : '')}
                onChange={(e) => setTranscribedText(e.target.value)}
                placeholder="Spoken words will appear here automatically. You can also edit or type manually..."
                className="w-full bg-black/70 border border-white/10 focus:border-red-500/60 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/40 resize-none font-sans leading-relaxed"
              />

              {hasVoiceInput && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-[10px] font-mono text-red-300">
                  <Mic className="w-2.5 h-2.5 text-red-400" />
                  <span>Voice Transcribed</span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Topic / Perspective Tag */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-red-400" />
              <span>Feedback Category:</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {FEEDBACK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-red-600/30 text-red-300 border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Citizen Stance / Rating Slider */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Overall Policy Sentiment / Rating:</span>
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">
                {rating === 5
                  ? 'Strongly Support (முழு ஆதரவு)'
                  : rating === 4
                  ? 'Positive Support (ஆதரவு)'
                  : rating === 3
                  ? 'Neutral / Observational (நடுநிலை)'
                  : rating === 2
                  ? 'Concerns / Needs Amendment (குறைகள்)'
                  : 'Critical Objection (எதிர்ப்பு)'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all border cursor-pointer ${
                    rating >= star
                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'
                  }`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                    }`}
                  />
                  <span>{star}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {submitSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                ✓ Voice feedback successfully recorded to Firestore! Your input directly informs municipal policy revisions.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted citizen participation • Synced to Government Dashboard</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                stopRecording();
                stopAIAssistantVoice();
                onClose();
              }}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmitFeedback}
              disabled={isSubmitting || submitSuccess}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Submitting Voice Feedback...</span>
              ) : submitSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submitted!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
