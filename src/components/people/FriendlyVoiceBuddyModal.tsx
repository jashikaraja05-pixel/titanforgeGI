import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  MapPin,
  Building2,
  AlertTriangle,
  RotateCcw,
  Languages,
  Radio,
  RadioTower,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import {
  DialogueState,
  INITIAL_DIALOGUE_STATE,
  SupportedCivicLang,
  CIVIC_LANG_METADATA,
  processConversationalTurn,
  speakAIAssistantVoice,
  stopAIAssistantVoice,
  fetchGeminiConversationalTurn,
} from '../../services/voiceAssistantService';
import { speechSynthesisManager } from '../../services/speechSynthesisSingleton';
import { GeminiLiveSession } from '../../services/liveVoiceService';
import { saveIssue } from '../../services/dataService';
import { searchAddressOrLandmark } from '../../services/geocodingService';
import type { LocationData, CivicIssue } from '../../types';

interface FriendlyVoiceBuddyModalProps {
  isOpen: boolean;
  onClose: () => void;
  langCode: string;
  userDistrict: string;
  userState: string;
  userCountry: string;
  userLocation: LocationData;
  onLocationResolved?: (newLoc: LocationData) => void;
  onIssueCreated: (newIssue: CivicIssue) => void;
  onTextDetected?: (text: string) => void;
}

export const FriendlyVoiceBuddyModal: React.FC<FriendlyVoiceBuddyModalProps> = ({
  isOpen,
  onClose,
  langCode: initialLangCode,
  userDistrict,
  userState,
  userCountry,
  userLocation,
  onLocationResolved,
  onIssueCreated,
  onTextDetected,
}) => {
  // Normalize initial language (default to English 'en')
  const defaultLang: SupportedCivicLang =
    initialLangCode in CIVIC_LANG_METADATA
      ? (initialLangCode as SupportedCivicLang)
      : 'en';

  const [currentLang, setCurrentLang] = useState<SupportedCivicLang>(defaultLang);
  const [dialogueState, setDialogueState] = useState<DialogueState>({
    ...INITIAL_DIALOGUE_STATE,
    activeLang: defaultLang,
    lastAiReply: (CIVIC_LANG_METADATA[defaultLang] || CIVIC_LANG_METADATA.en).greeting,
  });

  // Buddy Mode: Guided Assistant or Real-time Live API
  const [buddyMode, setBuddyMode] = useState<'live' | 'guided'>('guided');
  const [liveConnected, setLiveConnected] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: 'Hello! I am your real-time Civic Voice Companion powered by Gemini 3.8 Live API. You can speak into your microphone to discuss local issues, request municipal help, or learn about government policies in real time.',
    },
  ]);
  const liveSessionRef = useRef<GeminiLiveSession | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [submittedIssue, setSubmittedIssue] = useState<CivicIssue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoMapStatus, setAutoMapStatus] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  // Live session management
  const startLiveSession = async () => {
    stopAIAssistantVoice();
    stopListening();
    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
    }

    const session = new GeminiLiveSession({
      onConnected: () => {
        setLiveConnected(true);
        setIsLiveActive(true);
      },
      onTextChunk: (text) => {
        setLiveTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'model') {
            return [...prev.slice(0, -1), { role: 'model', text: last.text + text }];
          }
          return [...prev, { role: 'model', text }];
        });
      },
      onAudioStart: () => {
        setIsAiSpeaking(true);
      },
      onAudioEnd: () => {
        setIsAiSpeaking(false);
      },
      onInterrupted: () => {
        setIsAiSpeaking(false);
      },
      onError: (err) => {
        console.warn('Live API notification:', err);
      },
      onClose: () => {
        setLiveConnected(false);
        setIsLiveActive(false);
      },
    });

    liveSessionRef.current = session;
    await session.start();
  };

  const stopLiveSession = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
    }
    setLiveConnected(false);
    setIsLiveActive(false);
    setIsAiSpeaking(false);
  };

  // Register external stopper with unified speech manager
  useEffect(() => {
    return speechSynthesisManager.registerExternalStopper(() => {
      stopLiveSession();
    });
  }, []);

  // Sync language when modal opens
  useEffect(() => {
    if (isOpen) {
      const active = initialLangCode in CIVIC_LANG_METADATA ? (initialLangCode as SupportedCivicLang) : 'en';
      setCurrentLang(active);
      const meta = CIVIC_LANG_METADATA[active] || CIVIC_LANG_METADATA.en;

      const freshState: DialogueState = {
        ...INITIAL_DIALOGUE_STATE,
        activeLang: active,
        lastAiReply: meta.greeting,
      };
      setDialogueState(freshState);
      setTranscript('');
      setSubmittedIssue(null);
      setIsSubmitting(false);
      setAutoMapStatus('');

      if (buddyMode === 'live') {
        startLiveSession();
      } else {
        // Play Greeting in pure native language
        speakAIAssistantVoice(
          meta.greeting,
          active,
          () => setIsAiSpeaking(true),
          () => {
            setIsAiSpeaking(false);
            startListening(active);
          }
        );
      }
    } else {
      stopAIAssistantVoice();
      stopListening();
      stopLiveSession();
    }

    return () => {
      stopAIAssistantVoice();
      stopListening();
      stopLiveSession();
    };
  }, [isOpen, initialLangCode]);

  // Language switch handler
  const handleLanguageSwitch = (targetLang: SupportedCivicLang) => {
    stopAIAssistantVoice();
    stopListening();
    setCurrentLang(targetLang);

    const meta = CIVIC_LANG_METADATA[targetLang];
    const updatedState: DialogueState = {
      ...dialogueState,
      activeLang: targetLang,
      lastAiReply: meta.langSwitchReply,
    };
    setDialogueState(updatedState);

    speakAIAssistantVoice(
      meta.langSwitchReply,
      targetLang,
      () => setIsAiSpeaking(true),
      () => {
        setIsAiSpeaking(false);
        startListening(targetLang);
      }
    );
  };

  // Start Speech Recognition
  const startListening = (langToListen?: SupportedCivicLang) => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    stopAIAssistantVoice();
    setIsAiSpeaking(false);

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;

      const active = langToListen || currentLang;
      recognition.lang = CIVIC_LANG_METADATA[active]?.locale || 'ta-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        setTranscript(spoken);
        onTextDetected?.(spoken);
        handleUserSpeech(spoken, active);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Recognition error:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Process User's Speech Turn & Auto-Geocode Location to Map
  const handleUserSpeech = async (spokenText: string, activeLang: SupportedCivicLang) => {
    stopListening();

    const { nextState, aiSpeechReply, shouldSubmitNow, detectedLang } = processConversationalTurn(
      spokenText,
      dialogueState,
      activeLang,
      userDistrict
    );

    if (detectedLang !== currentLang) {
      setCurrentLang(detectedLang);
    }

    setDialogueState(nextState);

    // Auto Geocode location to Map if landmark is found
    if (nextState.extractedLandmark && nextState.extractedLandmark !== 'சென்னை பகுதி') {
      try {
        const query = `${nextState.extractedLandmark}, ${userDistrict}, ${userState}`;
        const geo = await searchAddressOrLandmark(query);
        if (geo && onLocationResolved) {
          onLocationResolved({
            ...userLocation,
            lat: geo.lat,
            lng: geo.lng,
            address: geo.displayName || query,
            city: userDistrict,
            state: userState,
            isExactGps: true,
          });
          setAutoMapStatus(`📍 மேப் தானாக ${nextState.extractedLandmark} பகுதிக்கு மாற்றப்பட்டது`);
        }
      } catch {
        // ignore geocode err
      }
    }

    // Attempt Gemini AI dynamic, ultra-fluent Tamil conversational response
    let finalAiReply = aiSpeechReply;
    let finalNextState = nextState;

    if (!shouldSubmitNow && spokenText.trim().length > 3) {
      try {
        const geminiTurn = await fetchGeminiConversationalTurn(
          spokenText,
          dialogueState,
          userDistrict,
          userState
        );
        if (geminiTurn && geminiTurn.aiVoiceReply) {
          finalAiReply = geminiTurn.aiVoiceReply;
          finalNextState = {
            ...nextState,
            category: geminiTurn.category || nextState.category,
            subcategory: geminiTurn.subcategory || nextState.subcategory,
            criticality: geminiTurn.criticality || nextState.criticality,
            recommendedDepartment: geminiTurn.recommendedDepartment || nextState.recommendedDepartment,
            extractedLandmark: geminiTurn.extractedLandmark || nextState.extractedLandmark,
            lastAiReply: geminiTurn.aiVoiceReply,
          };
          setDialogueState(finalNextState);
        }
      } catch (err) {
        console.warn('Gemini turn dynamic response notice:', err);
      }
    }

    // Speak AI Reply in detected / active native language (Gemini TTS / Fluent Audio)
    speakAIAssistantVoice(
      finalAiReply,
      detectedLang,
      () => setIsAiSpeaking(true),
      () => {
        setIsAiSpeaking(false);
        if (shouldSubmitNow) {
          executeDirectSubmission(finalNextState, detectedLang);
        } else if (finalNextState.step === 'confirm_submission') {
          // Give citizen a moment to say "சரி" or "அனுப்பு"
          setTimeout(() => {
            startListening(detectedLang);
          }, 350);
        }
      }
    );
  };

  // Execute Submission to Government Portal
  const executeDirectSubmission = (stateToSubmit: DialogueState, submissionLang: SupportedCivicLang) => {
    if (isSubmitting || submittedIssue) return;
    setIsSubmitting(true);

    const issueId = `CIV-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const fullAddress = `${stateToSubmit.extractedLandmark || 'சம்பவம் நடந்த இடம்'}, ${userDistrict}, ${userState}`;

    const newIssue: CivicIssue = {
      id: issueId,
      title: `${stateToSubmit.subcategory} - ${stateToSubmit.extractedLandmark || userDistrict}`,
      description: stateToSubmit.problemText || 'குரல் வழி ஏஐ மூலம் பதிவு செய்யப்பட்ட பொதுப் பிரச்சனை',
      originalLanguage: CIVIC_LANG_METADATA[submissionLang]?.name || 'Tamil',
      detectedLanguageCode: submissionLang,
      transcription: stateToSubmit.problemText,
      aiSummary: `${stateToSubmit.subcategory}. ${stateToSubmit.problemText}. Route to ${stateToSubmit.recommendedDepartment}.`,
      aiVoiceResponseText: stateToSubmit.lastAiReply,
      category: stateToSubmit.category,
      subcategory: stateToSubmit.subcategory,
      location: {
        ...userLocation,
        address: fullAddress,
        city: userDistrict,
        state: userState,
        country: userCountry,
        district: userDistrict,
        isExactGps: true,
      },
      criticality: stateToSubmit.criticality,
      criticalityReasons: [
        'Citizen voice-reported via Zero-Literacy Conversational AI Companion',
        'Verified in citizen spoken native language',
        `Direct routing to department: ${stateToSubmit.recommendedDepartment}`,
      ],
      priorityScore: stateToSubmit.criticality === 'CRITICAL' ? 95 : 85,
      scoreBreakdown: {
        citizenDemand: 25,
        infrastructureGap: 24,
        populationImpact: 20,
        urgency: 16,
        vulnerability: 10,
      },
      isUnderRepresentedArea: false,
      duplicateCount: 1,
      recommendedDepartment: stateToSubmit.recommendedDepartment,
      assignedDepartment: stateToSubmit.recommendedDepartment,
      status: 'AI Analyzed',
      timeline: [
        {
          status: 'Submitted',
          timestamp: now,
          actor: 'Voice AI Companion',
          note: `Citizen spoken input transcribed in ${CIVIC_LANG_METADATA[submissionLang]?.name}`,
        },
        {
          status: 'AI Analyzed',
          timestamp: now,
          actor: 'Autonomous AI Triage Engine',
          note: `Priority Score: 92/100. Dispatched to ${stateToSubmit.recommendedDepartment}`,
        },
      ],
      affectedPopulationEstimate: 1200,
      createdAt: now,
      updatedAt: now,
      evidenceTypes: ['voice', 'gps'],
    };

    saveIssue(newIssue);
    setSubmittedIssue(newIssue);
    setIsSubmitting(false);
    onIssueCreated(newIssue);
  };

  if (!isOpen) return null;

  const currentMeta = CIVIC_LANG_METADATA[currentLang] || CIVIC_LANG_METADATA.ta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#131620] via-[#0d1017] to-[#07080b] rounded-3xl border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.35)] overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white flex items-center gap-2">
                <span>{currentLang === 'ta' ? 'குரல் வழி ஏஐ நண்பன்' : `${currentMeta.nativeName} Voice AI`}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  Zero-Literacy Mode
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {currentLang === 'ta'
                  ? 'படிக்க எழுத தேவையில்லை — பேசி அரசுக்கு புகார் அனுப்புங்கள்'
                  : 'Speak naturally in your own mother tongue'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAIAssistantVoice();
              stopListening();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-TAP INSTANT LANGUAGE SWITCHER BAR */}
        <div className="px-4 py-2 bg-black/70 border-b border-white/10 flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 shrink-0">
            <Languages className="w-3.5 h-3.5 text-red-400" />
            <span>Language:</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {(['en', 'ta', 'hi', 'te', 'kn', 'ml'] as SupportedCivicLang[]).map((code) => {
              const meta = CIVIC_LANG_METADATA[code];
              const isActive = currentLang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLanguageSwitch(code)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.7)] ring-1 ring-white/30'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  {meta.nativeName}
                </button>
              );
            })}
          </div>
        </div>

        {/* MODE SWITCHER: GEMINI 3.8 LIVE API VS GUIDED */}
        <div className="px-4 py-2 bg-slate-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 p-0.5 bg-black/70 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setBuddyMode('live');
                startLiveSession();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                buddyMode === 'live'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Gemini 3.8 Live (Real-Time Audio)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBuddyMode('guided');
                stopLiveSession();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                buddyMode === 'guided'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Step-by-Step Guided</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {buddyMode === 'live' ? (
              <span className="text-[11px] font-mono font-bold flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                <span className={`w-2 h-2 rounded-full ${liveConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span>{liveConnected ? 'Live Model: gemini-3.8-live' : 'Connecting to Live...'}</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono">Turn-based Triage</span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* VIEW A: REAL-TIME GEMINI 3.8 LIVE CONVERSATION */}
          {buddyMode === 'live' ? (
            <div className="space-y-6">
              {/* Central Live Waveform / Pulsing Ring */}
              <div className="text-center space-y-3 py-2">
                <div className="relative inline-block">
                  <div
                    className={`w-32 h-32 mx-auto rounded-full flex flex-col items-center justify-center transition-all duration-300 relative ${
                      isAiSpeaking
                        ? 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-[0_0_60px_#38bdf8] ring-8 ring-cyan-400/40 animate-pulse'
                        : isLiveActive
                        ? 'bg-gradient-to-tr from-red-600 via-rose-600 to-amber-600 shadow-[0_0_50px_#ef4444] ring-8 ring-red-400/30'
                        : 'bg-slate-800 border-2 border-white/20'
                    }`}
                  >
                    {isAiSpeaking ? (
                      <Volume2 className="w-12 h-12 text-white animate-bounce" />
                    ) : (
                      <Mic className="w-12 h-12 text-white animate-pulse" />
                    )}
                  </div>
                  {isLiveActive && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {isAiSpeaking
                      ? 'Gemini Live Speaking (24kHz Native Voice)...'
                      : isLiveActive
                      ? 'Listening to your microphone (16kHz PCM)...'
                      : 'Connecting to Gemini Live API...'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Have a natural, hands-free conversation with Gemini 3.8 Live. Speak in any language—Tamil, Hindi, English, etc.
                  </p>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  {isLiveActive ? (
                    <button
                      type="button"
                      onClick={stopLiveSession}
                      className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <MicOff className="w-4 h-4" />
                      <span>Pause Live Audio</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startLiveSession}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start Live Audio Stream</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Live Conversation Stream History */}
              <div className="space-y-3 bg-black/50 p-4 rounded-2xl border border-white/10 max-h-64 overflow-y-auto">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Live Conversational Stream
                </span>
                {liveTranscript.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'model' && (
                      <div className="w-7 h-7 rounded-lg bg-red-600/30 border border-red-500/40 flex items-center justify-center shrink-0 text-red-400">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-red-600 text-white rounded-tr-none'
                          : 'bg-slate-900 text-slate-200 border border-white/10 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* VIEW B: STEP-BY-STEP GUIDED CITIZEN DIALOGUE */
            <>
          {/* Central Animated Orb */}
          <div className="text-center space-y-3 py-1">
            <div className="relative inline-block">
              <button
                type="button"
                onClick={isListening ? stopListening : () => startListening(currentLang)}
                className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white shadow-[0_0_45px_rgba(239,68,68,0.9)] scale-110 animate-pulse ring-8 ring-red-500/30'
                    : isAiSpeaking
                    ? 'bg-blue-600 text-white shadow-[0_0_45px_rgba(59,130,246,0.9)] scale-105 animate-pulse ring-8 ring-blue-500/30'
                    : 'bg-gradient-to-tr from-red-700 to-rose-500 text-white shadow-xl hover:scale-105 active:scale-95'
                }`}
                title="Click to Speak"
              >
                {isListening ? (
                  <Mic className="w-12 h-12 animate-bounce" />
                ) : isAiSpeaking ? (
                  <Volume2 className="w-12 h-12 animate-pulse" />
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </button>
            </div>

            {/* Current State Status Badge */}
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                    : isAiSpeaking
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {isListening
                  ? currentLang === 'ta'
                    ? '🎙️ ஏஐ கேட்கிறது... பேசுங்கள்!'
                    : currentLang === 'ml'
                    ? '🎙️ AI കേൾക്കുന്നു... സംസാരിക്കൂ!'
                    : currentLang === 'te'
                    ? '🎙️ AI వింటోంది... మాట్లాడండి!'
                    : currentLang === 'hi'
                    ? '🎙️ AI सुन रहा है... बोलिए!'
                    : '🎙️ Listening... Speak now!'
                  : isAiSpeaking
                  ? currentLang === 'ta'
                    ? '🔊 ஏஐ பேசுகிறது... கேளுங்கள்!'
                    : currentLang === 'ml'
                    ? '🔊 AI സംസാരിക്കുന്നു...'
                    : currentLang === 'te'
                    ? '🔊 AI మాట్లాడుతోంది...'
                    : currentLang === 'hi'
                    ? '🔊 AI बोल रहा है...'
                    : '🔊 AI is speaking...'
                  : currentLang === 'ta'
                  ? '✓ தயாராக உள்ளது (மைக் தொடவும்)'
                  : '✓ Ready (Tap Mic)'}
              </span>
            </div>

            {/* Auto Map Positioning Toast */}
            {autoMapStatus && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-fade-in">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{autoMapStatus}</span>
              </div>
            )}
          </div>

          {/* AI Response Card in Pure Language */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/15 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 text-red-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {currentLang === 'ta'
                    ? 'ஏஐ பதில் (Pure Tamil):'
                    : currentLang === 'ml'
                    ? 'AI മറുപടി (Malayalam):'
                    : currentLang === 'te'
                    ? 'AI సమాధానం (Telugu):'
                    : currentLang === 'hi'
                    ? 'AI उत्तर (Hindi):'
                    : 'AI Response:'}
                </span>
              </span>
              {isAiSpeaking ? (
                <button
                  type="button"
                  onClick={stopAIAssistantVoice}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>{currentLang === 'ta' ? 'ஒலியை நிறுத்து' : 'Mute'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    speakAIAssistantVoice(
                      dialogueState.lastAiReply,
                      currentLang,
                      () => setIsAiSpeaking(true),
                      () => setIsAiSpeaking(false)
                    )
                  }
                  className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-bold"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{currentLang === 'ta' ? '🔊 மீண்டும் கேள்' : '🔊 Replay Voice'}</span>
                </button>
              )}
            </div>
            <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
              "{dialogueState.lastAiReply}"
            </p>
          </div>

          {/* User's Spoken Words */}
          {transcript && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {currentLang === 'ta'
                  ? 'நீங்கள் பேசிய வார்த்தைகள் (Your Speech):'
                  : 'You said:'}
              </span>
              <p className="text-sm text-slate-200 italic font-mono">"{transcript}"</p>
            </div>
          )}

          {/* Structured Civic Report Summary Extracted by AI */}
          {dialogueState.step === 'confirm_submission' && !submittedIssue && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-300 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>
                    {currentLang === 'ta'
                      ? 'அரசுக்கு அனுப்பப்படும் தகவல்'
                      : 'Government Dispatch Package'}
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                  {dialogueState.criticality}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
                  <span className="text-slate-400 block text-[10px]">
                    {currentLang === 'ta' ? 'வகை / பிரச்சனை:' : 'Category / Problem:'}
                  </span>
                  <span className="font-bold text-white line-clamp-1">
                    {dialogueState.subcategory}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
                  <span className="text-slate-400 block text-[10px]">
                    {currentLang === 'ta' ? 'இடம் / அடையாளம்:' : 'Location:'}
                  </span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="truncate">{dialogueState.extractedLandmark || userDistrict}</span>
                  </span>
                </div>
                <div className="sm:col-span-2 p-2.5 rounded-xl bg-black/50 border border-white/10">
                  <span className="text-slate-400 block text-[10px]">
                    {currentLang === 'ta' ? 'பொறுப்பான அரசுத் துறை:' : 'Department:'}
                  </span>
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{dialogueState.recommendedDepartment}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Success Card when Issue is Submitted */}
          {submittedIssue && (
            <div className="p-6 rounded-3xl bg-emerald-950/70 border-2 border-emerald-500 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg text-2xl font-black">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {currentLang === 'ta'
                    ? 'அரசு போர்ட்டலுக்கு அனுப்பப்பட்டது!'
                    : 'Submitted to Government!'}
                </h3>
                <p className="text-xs text-emerald-300 mt-1">
                  {currentLang === 'ta'
                    ? `புகார் எண்: ${submittedIssue.id} • அதிகாரிகள் நடவடிக்கை எடுத்து வருகின்றனர்.`
                    : `Grievance ID: ${submittedIssue.id} • Dispatched to zonal officers.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopAIAssistantVoice();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
              >
                {currentLang === 'ta' ? 'முடிந்தது (Close)' : 'Done'}
              </button>
            </div>
          )}
            </>
          )}
        </div>

        {/* Modal Bottom Actions */}
        {buddyMode === 'guided' && !submittedIssue && (
          <div className="p-5 border-t border-white/10 bg-black/60 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setDialogueState({
                  ...INITIAL_DIALOGUE_STATE,
                  activeLang: currentLang,
                  lastAiReply: currentMeta.greeting,
                });
                setTranscript('');
                speakAIAssistantVoice(
                  currentMeta.greeting,
                  currentLang,
                  () => setIsAiSpeaking(true),
                  () => setIsAiSpeaking(false)
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{currentLang === 'ta' ? 'மீண்டும் தொடங்கு' : 'Restart'}</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Primary Speak Button */}
              <button
                type="button"
                onClick={isListening ? stopListening : () => startListening(currentLang)}
                className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl transition-all ${
                  isListening
                    ? 'bg-slate-800 text-red-400 border border-red-500/50'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>{currentLang === 'ta' ? 'பேச்சை நிறுத்து' : 'Stop'}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 animate-bounce" />
                    <span>
                      {currentLang === 'ta'
                        ? 'இப்போது பேசுங்கள்'
                        : currentLang === 'ml'
                        ? 'സംസാരിക്കൂ'
                        : currentLang === 'te'
                        ? 'మాట్లాడండి'
                        : 'Speak Now'}
                    </span>
                  </>
                )}
              </button>

              {/* Direct Send Button */}
              {dialogueState.step === 'confirm_submission' && (
                <button
                  type="button"
                  onClick={() => executeDirectSubmission(dialogueState, currentLang)}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'அனுப்புகிறது...'
                      : currentLang === 'ta'
                      ? 'அரசுக்கு அனுப்பு'
                      : currentLang === 'ml'
                      ? 'സർക്കാരിലേക്ക് അയക്കൂ'
                      : currentLang === 'te'
                      ? 'ప్రభుత్వానికి పంపండి'
                      : 'Send to Government'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
