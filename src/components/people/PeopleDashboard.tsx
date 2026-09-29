import React, { useState, useEffect, useRef } from 'react';
import {
  CivicIssue,
  SupportedLanguage,
  LocationData,
  CaseStatus,
  CIVIC_SECTOR_THEMES,
  CivicSectorTheme,
  GovernmentPolicy,
} from '../../types';
import { t, SUPPORTED_LANGUAGES } from '../../services/i18n';
import {
  analyzeCivicReport,
  analyzeImageFile,
  AIAnalysisResult,
  ImageAnalysisResult,
} from '../../services/aiService';
import {
  saveIssue,
  getStoredIssues,
  clearStoredIssues,
  submitCitizenFeedback,
} from '../../services/dataService';
import {
  processCitizenVoice,
  speakAIAssistantVoice,
  stopAIAssistantVoice,
  isSubmitCommand,
  VoiceAssistantAnalysis,
} from '../../services/voiceAssistantService';
import { FriendlyVoiceBuddyModal } from './FriendlyVoiceBuddyModal';
import { CitizenResolutionNotificationSystem } from './CitizenResolutionNotificationSystem';
import { CitizenEngagementHeatmap } from './CitizenEngagementHeatmap';
import { PolicyNotificationBanner } from './PolicyNotificationBanner';
import { PolicyAlertsDrawer } from './PolicyAlertsDrawer';
import { CitizenSentimentMiniDashboard } from './CitizenSentimentMiniDashboard';
import { SentimentSummaryCard } from './SentimentSummaryCard';
import { PolicyPredictiveModuleTab } from './PolicyPredictiveModuleTab';
import { LanguageDiagnosticsModal } from '../common/LanguageDiagnosticsModal';
import {
  GeminiSentimentAnalysisResult,
  analyzeFeedbackSentiment,
  getCachedSentiment,
} from '../../services/sentimentService';
import { subscribeToUserFeedback } from '../../services/feedbackService';
import {
  subscribeToAreaPolicies,
  getReadPolicyIds,
} from '../../services/policyService';
import { exportEngagementReportPDF, exportPolicyImpactReportPDF } from '../../services/pdfReportService';
import { getCitizenInterests, predictBatchPoliciesImpact } from '../../services/policyImpactService';
import { searchAddressOrLandmark } from '../../services/geocodingService';
import { GlobalMap } from '../common/GlobalMap';
import {
  Mic,
  MicOff,
  Camera,
  MapPin,
  FileText,
  Flame,
  FileDown,
  Bell,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Send,
  Upload,
  RefreshCw,
  Search,
  Eye,
  Clock,
  Sparkles,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Star,
  Layers,
  ArrowRight,
  Info,
  Sliders,
  Check,
  Edit3,
  Navigation,
  HeartPulse,
  Utensils,
  GraduationCap,
  Droplets,
  Construction,
  Zap,
  Trash2,
  X,
  Languages,
  Smile,
  BrainCircuit,
} from 'lucide-react';
import {
  getStatesForCountry,
  getDistrictsForState,
  REGIONS_AND_DISTRICTS,
} from '../../data/regionsAndDistricts';
import {
  translateReport,
  speakCivicText,
  stopSpeaking,
  TranslatedCivicReport,
} from '../../services/multilingualVoiceService';

interface PeopleDashboardProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenResponsibleAi: () => void;
  onSwitchToGov: () => void;
  userData?: any;
}

export const PeopleDashboard: React.FC<PeopleDashboardProps> = ({
  currentLanguage,
  onLanguageChange,
  onOpenResponsibleAi,
  onSwitchToGov,
  userData,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'my-reports' | 'nearby' | 'trends' | 'sentiment' | 'updates'>('report');

  // Input states
  const [selectedTheme, setSelectedTheme] = useState<CivicSectorTheme | null>(null);
  const [inputText, setInputText] = useState('');
  const [inputCategory, setInputCategory] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [isEditingTranscription, setIsEditingTranscription] = useState(false);
  const [voiceConfirmed, setVoiceConfirmed] = useState(false);
  const [isSynthesizingSpeech, setIsSynthesizingSpeech] = useState(false);
  const [isVoiceBuddyOpen, setIsVoiceBuddyOpen] = useState(false);
  const [speakLanguageCode, setSpeakLanguageCode] = useState<string>(
    currentLanguage.code || 'en'
  );

  useEffect(() => {
    setSpeakLanguageCode(currentLanguage.code || 'en');
  }, [currentLanguage.code]);
  const [autoMapNotice, setAutoMapNotice] = useState<string>('');
  const [isLanguageDiagnosticsOpen, setIsLanguageDiagnosticsOpen] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState<boolean>(false);

  // Photo states
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>('');
  const [photoAnalysis, setPhotoAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Location states
  const userCountry = userData?.country || 'India';
  const userState = userData?.state || 'Tamil Nadu';
  const userDistrict = userData?.district || 'Chennai';

  const [locationMode, setLocationMode] = useState<'registered' | 'other'>('registered');
  const [incidentCountry, setIncidentCountry] = useState<string>(userCountry);
  const [incidentState, setIncidentState] = useState<string>(userState);
  const [incidentDistrict, setIncidentDistrict] = useState<string>(userDistrict);
  const [incidentLandmark, setIncidentLandmark] = useState<string>('');
  const [isCapturingVoiceLocation, setIsCapturingVoiceLocation] = useState(false);

  const [userLocation, setUserLocation] = useState<LocationData>({
    lat: 13.0827,
    lng: 80.2707,
    address: `${userDistrict}, ${userState}`,
    city: userDistrict,
    state: userState,
    country: userCountry,
    district: userDistrict,
    isExactGps: true,
  });
  const [isLocating, setIsLocating] = useState(false);

  // My Reports & Multilingual Listening
  const [myIssueListenLang, setMyIssueListenLang] = useState<string>('ta');
  const [myIssueTranslated, setMyIssueTranslated] = useState<TranslatedCivicReport | null>(null);
  const [isMyIssueVoicePlaying, setIsMyIssueVoicePlaying] = useState<boolean>(false);

  // Conversational AI Voice Assistant states
  const [aiAssistantReply, setAiAssistantReply] = useState<string>('');
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [voiceAssistantState, setVoiceAssistantState] = useState<VoiceAssistantAnalysis | null>(null);
  const speechAccumulatedRef = useRef<string>('');

  // Live Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Real-time Government Policy Alerts states
  const [areaPolicies, setAreaPolicies] = useState<GovernmentPolicy[]>([]);
  const [activeBannerPolicy, setActiveBannerPolicy] = useState<GovernmentPolicy | null>(null);
  const [isPolicyDrawerOpen, setIsPolicyDrawerOpen] = useState(false);

  // Subscribe to real-time government policy publications affecting this citizen's area
  useEffect(() => {
    const currentArea = {
      country: incidentCountry || userCountry,
      state: incidentState || userState,
      district: incidentDistrict || userDistrict,
    };

    const unsubscribe = subscribeToAreaPolicies(currentArea, (policies, newAlert) => {
      setAreaPolicies(policies);
      if (newAlert) {
        setActiveBannerPolicy(newAlert);
      }
    });

    const handleReadUpdated = () => {
      setAreaPolicies((prev) => {
        const readIds = getReadPolicyIds();
        return prev.map((p) => ({ ...p, isRead: readIds.includes(p.id) }));
      });
    };

    const handleManualNewPolicy = (e: any) => {
      if (e.detail) {
        setActiveBannerPolicy(e.detail);
      }
    };

    window.addEventListener('govinsight_policy_read_updated', handleReadUpdated);
    window.addEventListener('govinsight_new_policy_published', handleManualNewPolicy);

    return () => {
      unsubscribe();
      window.removeEventListener('govinsight_policy_read_updated', handleReadUpdated);
      window.removeEventListener('govinsight_new_policy_published', handleManualNewPolicy);
    };
  }, [incidentCountry, incidentState, incidentDistrict, userCountry, userState, userDistrict]);

  const unreadPolicyCount = areaPolicies.filter((p) => !p.isRead).length;

  // Real-time Citizen Feedback Sentiment (Gemini API)
  const [sentimentResult, setSentimentResult] = useState<GeminiSentimentAnalysisResult | null>(getCachedSentiment());
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);

  useEffect(() => {
    const unsubFeedback = subscribeToUserFeedback((feedbacks) => {
      if (feedbacks && feedbacks.length > 0) {
        analyzeFeedbackSentiment(feedbacks, `${incidentDistrict || userDistrict}, ${incidentState || userState}`).then(
          (analysis) => {
            setSentimentResult(analysis);
          }
        );
      }
    });

    return () => {
      if (typeof unsubFeedback === 'function') unsubFeedback();
    };
  }, [incidentDistrict, incidentState, userDistrict, userState]);

  const handleIncidentStateChange = async (newState: string) => {
    setIncidentState(newState);
    const districts = getDistrictsForState(incidentCountry, newState);
    const firstDistrict = districts.length > 0 ? districts[0] : '';
    setIncidentDistrict(firstDistrict);
    const fullAddress = incidentLandmark ? `${incidentLandmark}, ${firstDistrict}, ${newState}` : `${firstDistrict}, ${newState}`;
    setUserLocation((prev) => ({
      ...prev,
      state: newState,
      district: firstDistrict,
      city: firstDistrict || newState,
      address: fullAddress,
    }));
    const geo = await searchAddressOrLandmark(`${firstDistrict || newState}, ${newState}, India`);
    if (geo) {
      setUserLocation((prev) => ({
        ...prev,
        lat: geo.lat,
        lng: geo.lng,
      }));
    }
  };

  const handleIncidentDistrictChange = async (newDistrict: string) => {
    setIncidentDistrict(newDistrict);
    const fullAddress = incidentLandmark ? `${incidentLandmark}, ${newDistrict}, ${incidentState}` : `${newDistrict}, ${incidentState}`;
    setUserLocation((prev) => ({
      ...prev,
      district: newDistrict,
      city: newDistrict,
      address: fullAddress,
    }));
    const geo = await searchAddressOrLandmark(`${newDistrict}, ${incidentState}, India`);
    if (geo) {
      setUserLocation((prev) => ({
        ...prev,
        lat: geo.lat,
        lng: geo.lng,
      }));
    }
  };

  const handleIncidentLandmarkChange = async (landmark: string) => {
    setIncidentLandmark(landmark);
    const fullAddress = landmark ? `${landmark}, ${incidentDistrict}, ${incidentState}` : `${incidentDistrict}, ${incidentState}`;
    setUserLocation((prev) => ({
      ...prev,
      address: fullAddress,
    }));
    if (landmark.trim().length >= 3) {
      const geo = await searchAddressOrLandmark(`${landmark}, ${incidentDistrict}, ${incidentState}`);
      if (geo) {
        setUserLocation((prev) => ({
          ...prev,
          lat: geo.lat,
          lng: geo.lng,
          isExactGps: true,
        }));
      }
    }
  };

  const handleGeocodeCurrentAddress = async () => {
    setIsLocating(true);
    const query = incidentLandmark
      ? `${incidentLandmark}, ${incidentDistrict}, ${incidentState}`
      : `${incidentDistrict}, ${incidentState}`;
    const geo = await searchAddressOrLandmark(query);
    if (geo) {
      setUserLocation((prev) => ({
        ...prev,
        lat: geo.lat,
        lng: geo.lng,
        address: geo.displayName || query,
        isExactGps: true,
      }));
    }
    setIsLocating(false);
  };

  const handleSwitchLocationMode = (mode: 'registered' | 'other') => {
    setLocationMode(mode);
    if (mode === 'registered') {
      setIncidentCountry(userCountry);
      setIncidentState(userState);
      setIncidentDistrict(userDistrict);
      setUserLocation((prev) => ({
        ...prev,
        country: userCountry,
        state: userState,
        district: userDistrict,
        city: userDistrict,
        address: `${userDistrict}, ${userState}`,
      }));
    }
  };

  const handleVoiceCaptureLocation = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported on this browser.');
      return;
    }
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = currentLanguage.code === 'en-gb' ? 'en-GB' : currentLanguage.code === 'ta' ? 'ta-IN' : 'en-US';
      rec.onstart = () => setIsCapturingVoiceLocation(true);
      rec.onend = () => setIsCapturingVoiceLocation(false);
      rec.onerror = () => setIsCapturingVoiceLocation(false);
      rec.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        const newAddress = incidentLandmark ? `${incidentLandmark} ${spoken}` : spoken;
        handleIncidentLandmarkChange(newAddress);
      };
      rec.start();
    } catch {
      setIsCapturingVoiceLocation(false);
    }
  };

  const handleMyIssueVoiceSwitch = (langCode: string) => {
    if (!selectedMyIssue) return;
    setMyIssueListenLang(langCode);
    const trans = translateReport(
      {
        title: selectedMyIssue.title,
        description: selectedMyIssue.description,
        locationText: `${selectedMyIssue.location.address}, ${selectedMyIssue.location.city}`,
        category: selectedMyIssue.category,
        criticality: selectedMyIssue.criticality,
        status: selectedMyIssue.status,
        aiSummary: selectedMyIssue.aiSummary,
      },
      langCode
    );
    setMyIssueTranslated(trans);

    speakCivicText({
      text: trans.aiVoiceScript,
      langCode,
      onStart: () => setIsMyIssueVoicePlaying(true),
      onEnd: () => setIsMyIssueVoicePlaying(false),
      onError: () => setIsMyIssueVoicePlaying(false),
    });
  };

  const handleStopMyIssueVoice = () => {
    stopSpeaking();
    setIsMyIssueVoicePlaying(false);
  };

  // AI Analysis & Submission states
  const [isAnalyzingReport, setIsAnalyzingReport] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);

  // My Reports & Feedback
  const [issuesList, setIssuesList] = useState<CivicIssue[]>([]);
  const [selectedMyIssue, setSelectedMyIssue] = useState<CivicIssue | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  // Speech Recognition reference
  const recognitionRef = useRef<any>(null);

  // Load issues on mount and when updated
  const refreshIssues = () => {
    const list = getStoredIssues();
    setIssuesList(list);
    if (!selectedMyIssue && list.length > 0) {
      setSelectedMyIssue(list[0]);
    } else if (selectedMyIssue) {
      const refreshed = list.find((i) => i.id === selectedMyIssue.id);
      if (refreshed) setSelectedMyIssue(refreshed);
      else if (list.length > 0) setSelectedMyIssue(list[0]);
      else setSelectedMyIssue(null);
    }
  };

  useEffect(() => {
    refreshIssues();
    const handleUpdate = () => refreshIssues();
    window.addEventListener('govinsight_issues_updated', handleUpdate);
    return () => window.removeEventListener('govinsight_issues_updated', handleUpdate);
  }, []);

  // Web Speech API Voice Recognition setup
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const transcribeWithGemini = async (audioBlob: Blob, mimeType: string) => {
    // If Web Speech API already captured text, keep it so citizen words aren't overwritten
    if (speechAccumulatedRef.current && speechAccumulatedRef.current.trim().length > 2) {
      handleProcessSpokenText(speechAccumulatedRef.current.trim());
      return;
    }

    setIsTranscribingAudio(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string)?.split(',')[1];
          if (base64Data) {
            const res = await fetch('/api/voice/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64Data, mimeType }),
            });
            const data = await res.json();
            if (data.text && data.text.trim()) {
              setTranscribedText(data.text);
              setInputText(data.text);
              handleProcessSpokenText(data.text);
            }
          }
        } catch (e) {
          console.warn('Gemini transcription API notice:', e);
        } finally {
          setIsTranscribingAudio(false);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (err) {
      console.warn('FileReader transcription error:', err);
      setIsTranscribingAudio(false);
    }
  };

  const startVoiceRecording = async () => {
    stopAIAssistantVoice();
    setIsAiSpeaking(false);
    setVoiceConfirmed(false);
    setIsEditingTranscription(false);
    setTranscribedText('');
    speechAccumulatedRef.current = '';
    audioChunksRef.current = [];

    // Focus input area so user sees typing in action
    const inputEl = document.getElementById('text-report-input');
    inputEl?.focus();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {}
        }
        const recognition = new SpeechRecognition();
        const activeSpeechLang = speakLanguageCode || currentLanguage.code || 'ta';
        const localeMap: Record<string, string> = {
          ta: 'ta-IN',
          ml: 'ml-IN',
          te: 'te-IN',
          kn: 'kn-IN',
          hi: 'hi-IN',
          en: 'en-IN',
        };
        recognition.lang = localeMap[activeSpeechLang] || 'ta-IN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }
          if (fullTranscript.trim()) {
            speechAccumulatedRef.current = fullTranscript;
            setTranscribedText(fullTranscript);
            setInputText(fullTranscript);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition notice:', err);
        };

        recognition.onend = () => {
          setIsRecording(false);
          const finalSpoken = speechAccumulatedRef.current.trim();
          if (finalSpoken) {
            handleProcessSpokenText(finalSpoken);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        return;
      } catch (e) {
        console.warn('Speech recognition start notice, falling back to MediaRecorder:', e);
      }
    }

    // MediaRecorder fallback only if Web Speech is unavailable
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/wav';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        if (audioBlob.size > 0) {
          transcribeWithGemini(audioBlob, mimeType);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (micErr) {
      console.warn('Mic access notice:', micErr);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
    const finalSpoken = speechAccumulatedRef.current.trim();
    if (finalSpoken) {
      handleProcessSpokenText(finalSpoken);
    }
  };

  // Process Citizen Spoken Voice (Greeting or Civic Issue) with Pure Single-Voice Reply
  const handleProcessSpokenText = async (spoken: string) => {
    if (!spoken.trim()) return;

    // Auto-detect language from speech content
    const detected = detectLanguageFromSpeech(spoken);
    const resolvedLang = detected || (speakLanguageCode as any) || (currentLanguage.code as any) || 'ta';

    // Check if user is confirming/submitting
    if (isSubmitCommand(spoken, resolvedLang) && analysisResult) {
      handleSubmitReport();
      return;
    }

    const analysis = processCitizenVoice(spoken, resolvedLang);
    setVoiceAssistantState(analysis);
    setTranscribedText(spoken);
    setInputText(spoken);
    setVoiceConfirmed(true);

    // If citizen said greeting only ("வணக்கம்", "ஹலோ", etc.)
    if (analysis.isGreeting && spoken.trim().split(/\s+/).length <= 2) {
      setAiAssistantReply(analysis.aiVoiceReply);
      return;
    }

    // Spoken actual civic issue
    if (analysis.category) {
      setInputCategory(analysis.category);
    }
    setAiAssistantReply(analysis.aiVoiceReply);

    if (analysis.extractedLandmark) {
      setIncidentLandmark(analysis.extractedLandmark);
      // Real geocoding to update Google Maps pin and auto-center map
      const geo = await searchAddressOrLandmark(
        `${analysis.extractedLandmark}, ${incidentDistrict}, ${incidentState}`
      );
      if (geo) {
        setUserLocation((prev) => ({
          ...prev,
          lat: geo.lat,
          lng: geo.lng,
          address: geo.displayName || `${analysis.extractedLandmark}, ${incidentDistrict}`,
          isExactGps: true,
        }));
        setAutoMapNotice(
          resolvedLang === 'ta'
            ? `📍 மேப் தானாக "${analysis.extractedLandmark}" பகுதிக்கு மாற்றப்பட்டது`
            : `📍 Map auto-positioned to "${analysis.extractedLandmark}"`
        );
      }
    }

    // Speak AI Voice Reply in the detected native language with a SINGLE pristine voice!
    stopAIAssistantVoice();
    setIsAiSpeaking(true);
    speakAIAssistantVoice(analysis.aiVoiceReply, resolvedLang, () => {
      setIsAiSpeaking(false);
    });

    // Run deeper AI civic case classification
    triggerAIAnalysis(spoken, analysis);
  };

  const handleReplayAIVoice = () => {
    if (!aiAssistantReply) return;
    const activeSpeechLang = speakLanguageCode || currentLanguage.code || 'en';
    setIsAiSpeaking(true);
    speakAIAssistantVoice(aiAssistantReply, activeSpeechLang, () => {
      setIsAiSpeaking(false);
    });
  };

  const handleStopAIVoice = () => {
    stopAIAssistantVoice();
    setIsAiSpeaking(false);
  };

  // Confirm manual transcription
  const handleConfirmVoice = () => {
    setVoiceConfirmed(true);
    setInputText(transcribedText);
    handleProcessSpokenText(transcribedText);
  };

  // Live GPS geolocation capture
  const handleCaptureGps = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.county || incidentDistrict || 'Local Ward';
          const state = data.address?.state || incidentState || 'State';
          const country = data.address?.country || incidentCountry || 'India';
          const displayName = data.display_name?.slice(0, 80) || `GPS (${lat}, ${lng})`;

          setUserLocation({
            lat,
            lng,
            address: displayName,
            city,
            state,
            country,
            district: city,
            isExactGps: true,
          });
        } catch {
          setUserLocation((prev) => ({
            ...prev,
            lat,
            lng,
            address: `GPS (${lat}°, ${lng}°)`,
            isExactGps: true,
          }));
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS denied or error:', err);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Live Camera Capture
  const startCamera = async () => {
    setIsCameraOpen(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        currentLanguage.code === 'ta'
          ? 'கேமரா அனுமதி கிடைக்கவில்லை. கோப்பு பதிவேற்றத்தைப் பயன்படுத்தலாம்.'
          : 'Camera access denied or unavailable. Please use photo file upload.'
      );
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedPhotoUrl(dataUrl);
      analyzeImageFile(dataUrl).then((res) => setPhotoAnalysis(res));
      closeCamera();
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
    setIsCameraOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setSelectedPhotoUrl(localUrl);
    setIsAnalyzingPhoto(true);
    const result = await analyzeImageFile(file);
    setPhotoAnalysis(result);
    setIsAnalyzingPhoto(false);
  };

  // Trigger Comprehensive AI Case Analysis
  const triggerAIAnalysis = async (text: string, voiceContext?: VoiceAssistantAnalysis) => {
    if (!text.trim()) return;
    setIsAnalyzingReport(true);

    const result = await analyzeCivicReport({
      rawText: text,
      languageCode: currentLanguage.code,
      location: userLocation,
      hasPhoto: Boolean(selectedPhotoUrl),
      photoAnalysis: photoAnalysis || undefined,
    });

    if (voiceContext) {
      if (voiceContext.category) result.category = voiceContext.category;
      if (voiceContext.criticality) result.criticality = voiceContext.criticality;
      if (voiceContext.recommendedDepartment) result.recommendedDepartment = voiceContext.recommendedDepartment;
    }

    setAnalysisResult(result);
    setIsAnalyzingReport(false);
  };

  // Submit Report to Government
  const handleSubmitReport = () => {
    if (!analysisResult && !inputText.trim() && !transcribedText.trim()) return;

    const stored = getStoredIssues();
    const caseCount = stored.length + 1;
    const newCaseId = `GI-2026-${String(caseCount).padStart(4, '0')}`;

    const newIssue: CivicIssue = {
      id: newCaseId,
      title: analysisResult?.problemSummary?.slice(0, 60) || inputText.slice(0, 50) || 'Civic Grievance',
      description: inputText || transcribedText,
      originalLanguage: currentLanguage.name,
      detectedLanguageCode: currentLanguage.code,
      transcription: transcribedText || undefined,
      aiSummary: analysisResult?.problemSummary || inputText,
      aiVoiceResponseText: analysisResult?.aiVoiceResponseText || aiAssistantReply,
      category: analysisResult?.category || inputCategory || 'Roads & Infrastructure',
      subcategory: analysisResult?.subcategory || 'Civic Infrastructure Repair',
      photoUrl: selectedPhotoUrl || undefined,
      photoAnalysis: photoAnalysis || undefined,
      location: userLocation,
      criticality: analysisResult?.criticality || 'HIGH',
      criticalityReasons: analysisResult?.criticalityReasons || [
        'Verified citizen report with exact GPS pinpoint.',
      ],
      priorityScore: analysisResult?.priorityScore || 85,
      scoreBreakdown: analysisResult?.scoreBreakdown || {
        citizenDemand: 20,
        infrastructureGap: 20,
        populationImpact: 20,
        urgency: 15,
        vulnerability: 10,
      },
      isUnderRepresentedArea: false,
      duplicateCount: 1,
      recommendedDepartment: analysisResult?.recommendedDepartment || 'Civic Works & Public Grievance Desk',
      assignedDepartment: analysisResult?.recommendedDepartment || 'Civic Works & Public Grievance Desk',
      assignedOfficer: 'Zonal Field Engineer',
      status: 'Submitted',
      timeline: [
        {
          status: 'Submitted',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          actor: userData?.fullName || `Citizen (${currentLanguage.name})`,
          note: `Case registered with multi-evidence: ${[
            transcribedText && 'Voice',
            selectedPhotoUrl && 'Photo',
            'GPS',
          ]
            .filter(Boolean)
            .join(' + ')}`,
        },
        {
          status: 'AI Analyzed',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          actor: 'GovInsight AI Intelligence Core',
          note: `Priority Score: ${analysisResult?.priorityScore || 85}/100. Dispatched to ${analysisResult?.recommendedDepartment || 'Public Works'}.`,
        },
      ],
      affectedPopulationEstimate: analysisResult?.affectedPopulationEstimate || 1500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidenceTypes: [
        transcribedText ? 'voice' : 'text',
        selectedPhotoUrl ? 'photo' : undefined,
        'gps',
      ].filter(Boolean) as any,
    };

    saveIssue(newIssue);
    setSubmittedCaseId(newCaseId);
    refreshIssues();
  };

  // Reset form for next report
  const handleCreateNewReport = () => {
    setSubmittedCaseId(null);
    setInputText('');
    setTranscribedText('');
    setVoiceConfirmed(false);
    setSelectedPhotoUrl('');
    setPhotoAnalysis(null);
    setAnalysisResult(null);
    setAiAssistantReply('');
    setVoiceAssistantState(null);
    speechAccumulatedRef.current = '';
    stopAIAssistantVoice();
    setIsAiSpeaking(false);
    setIsSynthesizingSpeech(false);
  };

  const playCaseSummaryVoice = (text: string) => {
    stopAIAssistantVoice();
    setIsSynthesizingSpeech(true);
    speakAIAssistantVoice(
      text,
      currentLanguage.code,
      () => setIsSynthesizingSpeech(true),
      () => setIsSynthesizingSpeech(false)
    );
  };

  const stopCaseSummaryVoice = () => {
    stopAIAssistantVoice();
    setIsSynthesizingSpeech(false);
  };

  // Submit Citizen Feedback on resolved issues
  const handleFeedbackSubmit = (issueId: string) => {
    submitCitizenFeedback(issueId, true, feedbackRating, feedbackComment);
    setFeedbackSuccess(true);
    refreshIssues();
    setTimeout(() => setFeedbackSuccess(false), 3000);
  };

  // PDF Report Export states and handler
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState(false);

  const handleDashboardExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      if (activeTab === 'updates') {
        // Compile Policy Summaries and Impact Scores into formatted PDF
        const interests = getCitizenInterests(userData);
        const impactMap = await predictBatchPoliciesImpact(areaPolicies, interests);
        await exportPolicyImpactReportPDF({
          policies: areaPolicies,
          impactMap,
          district: incidentDistrict || userDistrict || 'Chennai',
          state: incidentState || userState || 'Tamil Nadu',
          citizenInterests: interests,
          filterApplied: 'All Area Policies',
        });
      } else {
        // Compile Civic Engagement Analytics using actual real issues
        const totalReports = issuesList.length;
        const totalVoice = issuesList.filter((i) => i.originalLanguage && i.transcription).length;
        const voicePercentage = totalReports > 0 ? Math.round((totalVoice / totalReports) * 100) : 0;
        const totalInteractions = totalReports;

        const categoryMap: Record<string, number> = {};
        issuesList.forEach((issue) => {
          const cat = issue.category || 'Roads & Infrastructure';
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });

        const sectors = Object.entries(categoryMap).map(([name, count]) => ({
          name,
          count,
          voice: `${voicePercentage}%`,
          rating: 'Verified',
          priority: count > 3 ? 'CRITICAL' : count > 1 ? 'HIGH' : 'MEDIUM',
        }));

        await exportEngagementReportPDF({
          totalInteractions,
          totalVoice,
          totalReports,
          totalFeedback: 0,
          peakHour: '09:00 - 11:30 AM',
          peakDay: 'Live Feed',
          voicePercentage,
          momentum: '+18.5%',
          selectedSector: 'All Sectors',
          viewMode: 'live',
          metricFilter: 'all',
          region: `${incidentDistrict || userDistrict || 'Chennai'}, ${incidentState || userState || 'Tamil Nadu'}`,
          sectors: sectors.length > 0 ? sectors : undefined,
        });
      }
      setPdfExportSuccess(true);
      setTimeout(() => setPdfExportSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to export PDF from dashboard:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Sub-Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {t('peoplePortal', currentLanguage.code)}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {t('peopleSub', currentLanguage.code)}
              </p>
            </div>

            {/* Automated Resolution Notification Center Bell & Floating Alert System */}
            <div className="flex items-center gap-2">
              <CitizenResolutionNotificationSystem
                currentLanguage={currentLanguage}
                issuesList={issuesList}
                onSelectIssue={(issue) => {
                  setSelectedMyIssue(issue);
                  setActiveTab('my-reports');
                }}
                onOpenGrievancesTab={() => setActiveTab('my-reports')}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-xl border border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'report'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
            <button
              onClick={() => setActiveTab('my-reports')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'my-reports'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('myReports', currentLanguage.code)} ({issuesList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('nearby')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'nearby'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('nearbyIssues', currentLanguage.code)}</span>
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'trends'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Engagement Trends</span>
            </button>
            <button
              onClick={() => setActiveTab('sentiment')}
              title="Gemini AI Citizen Sentiment & Feedback Intelligence"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'sentiment'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
              <span>Public Sentiment</span>
              {sentimentResult && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  {sentimentResult.positivePercentage}%
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              title="Gemini AI Predictive Government Policy Impact for Citizens"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'updates'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Policy Impact</span>
              {areaPolicies.length > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-950 text-red-300 border border-red-500/40">
                  {areaPolicies.length}
                </span>
              )}
            </button>
            <button
              onClick={handleDashboardExportPDF}
              disabled={isExportingPdf}
              title={
                activeTab === 'updates'
                  ? 'Download compiled policy summaries and predictive impact scores as a formatted PDF for offline reading'
                  : 'Download Citizen Engagement Trends as PDF'
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.35)] disabled:opacity-50 cursor-pointer ml-1"
            >
              {isExportingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{activeTab === 'updates' ? 'Compiling Report...' : 'Exporting...'}</span>
                </>
              ) : pdfExportSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Report Downloaded!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-red-100" />
                  <span>{activeTab === 'updates' ? 'Download Policy Report' : 'Export PDF'}</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsPolicyDrawerOpen(true)}
              title="Real-time Government Policy Alerts for your area"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all bg-black/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.25)] cursor-pointer ml-1"
            >
              <Bell className="w-3.5 h-3.5 text-red-400" />
              <span>Area Policy Alerts</span>
              {unreadPolicyCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black font-mono flex items-center justify-center animate-pulse">
                  {unreadPolicyCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: REPORT ISSUE */}
        {activeTab === 'report' && (
          <div className="space-y-8">
            {/* SUCCESS SUBMITTED SCREEN */}
            {submittedCaseId ? (
              <div className="p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-2xl text-center max-w-2xl mx-auto space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    {t('caseCreated', currentLanguage.code)}
                  </span>
                  <h2 className="text-3xl font-black text-white mt-1">
                    {submittedCaseId}
                  </h2>
                  <p className="text-sm text-slate-300 mt-2">
                    Your civic report has been classified, scored, and routed directly to the authorized government department.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold text-white">{analysisResult?.recommendedDepartment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Criticality:</span>
                    <span className="font-bold text-red-400">{analysisResult?.criticality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Priority Score:</span>
                    <span className="font-bold text-white">{analysisResult?.priorityScore} / 100</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => setActiveTab('my-reports')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    Track in "My Reports"
                  </button>
                  <button
                    onClick={handleCreateNewReport}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs transition-all"
                  >
                    File Another Report
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ZERO-LITERACY & FRIENDLY VOICE AI HERO CARD */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-950/90 via-[#121622] to-red-950/70 border-2 border-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-black uppercase tracking-wider text-red-400">
                        {currentLanguage.code === 'ta'
                          ? 'படிக்க / எழுதத் தெரியாதவர்களுக்கான நேரடி வாய்ஸ் ஏஐ'
                          : 'Zero-Literacy Friendly Voice Mode'}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      {currentLanguage.code === 'ta'
                        ? '🎙️ பேசினாலே போதும்! ஏஐ நண்பன் அரசுக்கு அனுப்பும்'
                        : '🎙️ Speak Directly! Friendly AI Buddy will report to Govt'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      {currentLanguage.code === 'ta'
                        ? 'எழுதவோ படிக்கவோ தெரியாவிட்டாலும் கவலை வேண்டாம்! உங்கள் ஊரில் உள்ள ரோடு, சாக்கடை, குடிநீர் அல்லது கரண்ட் பிரச்சனையை வாய்ஸில் பேசினால் போதும். ஏஐ நண்பன் உங்களிடம் பேசி கேட்டு, அரசு போர்ட்டலுக்கு அதிகாரப்பூர்வ புகாராக அனுப்பிவிடும்.'
                        : 'No typing or reading needed. Simply talk naturally in your own language. The friendly civic AI buddy converses with you, understands the location, and sends a formal grievance directly to the Government Portal.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsVoiceBuddyOpen(true)}
                    className="w-full md:w-auto px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm shadow-[0_0_25px_rgba(239,68,68,0.6)] flex items-center justify-center gap-3 shrink-0 transition-transform active:scale-95 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mic className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <span className="tracking-wide">
                      {currentLanguage.code === 'ta'
                        ? 'ஏஐ-யுடன் பேசத் தொடங்கு'
                        : 'Start Voice Chat with AI'}
                    </span>
                  </button>
                </div>

                {/* GEMINI-POWERED CITIZEN SENTIMENT SUMMARY CARD */}
                <SentimentSummaryCard
                  sentiment={sentimentResult}
                  isLoading={isAnalyzingSentiment}
                  onRefresh={async () => {
                    setIsAnalyzingSentiment(true);
                    const res = await analyzeFeedbackSentiment([], `${incidentDistrict || userDistrict}, ${incidentState || userState}`);
                    setSentimentResult(res);
                    setIsAnalyzingSentiment(false);
                  }}
                  onOpenFullDashboard={() => setActiveTab('sentiment')}
                  compact={true}
                />

                {/* HERO SECTION */}
                <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900 via-[#0c0f18] to-slate-950 border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 max-w-3xl">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-500/40 uppercase tracking-wider">
                      Multilingual Voice-First Platform
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
                      {t('tellUsCommunity', currentLanguage.code)}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-300 mt-2">
                      {t('speakTypeShow', currentLanguage.code)}
                    </p>

                    {/* CIVIC SECTOR THEME SELECTOR */}
                    <div className="mt-6 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-red-400" />
                          <span>
                            {currentLanguage.code === 'ta' ? 'துறை / தீம் தேர்வு:' : 'Choose Civic Category:'}
                          </span>
                        </span>
                        {selectedTheme && (
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                            ✓ {selectedTheme.name}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CIVIC_SECTOR_THEMES.map((theme) => {
                          const isSelected = selectedTheme?.id === theme.id;
                          const subtitle =
                            currentLanguage.code === 'ta' && theme.tamilName
                              ? theme.tamilName
                              : theme.description.split(',')[0];

                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => {
                                setSelectedTheme(theme);
                                setInputCategory(theme.defaultCategory);
                              }}
                              className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-red-950/80 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-[1.02]'
                                  : 'bg-black/50 border-white/10 hover:border-white/25 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm">
                                  {theme.id === 'health' && '🏥'}
                                  {theme.id === 'food' && '🍲'}
                                  {theme.id === 'education' && '🎓'}
                                  {theme.id === 'water' && '💧'}
                                  {theme.id === 'roads' && '🛣️'}
                                  {theme.id === 'power' && '⚡'}
                                  {theme.id === 'sanitation' && '♻️'}
                                  {theme.id === 'safety' && '🛡️'}
                                </span>
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white leading-tight">
                                  {theme.name}
                                </h4>
                                <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                                  {subtitle}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4 MAIN ACTION BUTTONS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
                      {/* 1. SPEAK */}
                      <button
                        type="button"
                        onClick={() => {
                          const inputEl = document.getElementById('text-report-input');
                          inputEl?.focus();
                          inputEl?.scrollIntoView({ behavior: 'smooth' });
                          startVoiceRecording();
                        }}
                        className="p-4 rounded-2xl border flex flex-col items-center justify-center gap-2.5 transition-all group bg-black/60 border-white/15 hover:border-red-500/60 hover:bg-red-950/20 text-slate-200"
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-600/20 text-red-400 group-hover:scale-110 transition-transform">
                          <Mic className="w-6 h-6 animate-pulse" />
                        </div>
                        <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                          [ 🎙 {t('speakBtn', currentLanguage.code)} ]
                        </span>
                      </button>

                      {/* 2. TYPE */}
                      <button
                        onClick={() => {
                          const inputEl = document.getElementById('text-report-input');
                          inputEl?.focus();
                          inputEl?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="p-4 rounded-2xl bg-black/60 border border-white/15 hover:border-red-500/60 hover:bg-red-950/20 text-slate-200 flex flex-col items-center justify-center gap-2.5 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                          [ ⌨ {t('typeBtn', currentLanguage.code)} ]
                        </span>
                      </button>

                      {/* 3. PHOTO */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-4 rounded-2xl bg-black/60 border border-white/15 hover:border-red-500/60 hover:bg-red-950/20 text-slate-200 flex flex-col items-center justify-center gap-2.5 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                          [ 📷 {t('photoBtn', currentLanguage.code)} ]
                        </span>
                      </button>

                      {/* 4. LOCATION */}
                      <button
                        onClick={handleCaptureGps}
                        disabled={isLocating}
                        className="p-4 rounded-2xl bg-black/60 border border-white/15 hover:border-red-500/60 hover:bg-red-950/20 text-slate-200 flex flex-col items-center justify-center gap-2.5 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MapPin className={`w-6 h-6 ${isLocating ? 'animate-bounce text-red-400' : ''}`} />
                        </div>
                        <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                          {isLocating ? 'LOCATING...' : `[ 📍 ${t('gpsBtn', currentLanguage.code)} ]`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* VOICE RECORDING HUD MODAL */}
                {isRecording && (
                  <div className="p-6 rounded-3xl bg-slate-900 border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-red-400 font-mono text-sm font-bold animate-pulse">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span>{t('listening', currentLanguage.code)} ({recordingSeconds}s)</span>
                      <span className="text-slate-400 font-normal">in {currentLanguage.nativeName}</span>
                    </div>

                    {/* Animated Audio Wave bars */}
                    <div className="flex items-center justify-center gap-1.5 h-12">
                      {[18, 38, 24, 46, 32, 52, 28, 44, 20, 36, 48, 22, 40].map((h, i) => (
                        <span
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-red-600 to-rose-400 rounded-full animate-pulse"
                          style={{
                            height: `${h}px`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '0.8s',
                          }}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-slate-300 max-w-md mx-auto italic">
                      "{currentLanguage.sampleVoicePrompt}"
                    </p>

                    <button
                      onClick={stopVoiceRecording}
                      className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-lg hover:bg-red-500"
                    >
                      {t('clickToStop', currentLanguage.code)}
                    </button>
                  </div>
                )}

                {/* GEMINI 3.5 TRANSCRIBE LOADING STATE */}
                {isTranscribingAudio && (
                  <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center gap-2.5 text-xs text-white animate-pulse">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    <span className="font-bold">Transcribing audio with Gemini 3.5 Transcribe (gemini-3.5-transcribe)...</span>
                  </div>
                )}

                {/* TRANSCRIBED VOICE REVIEW & CITIZEN AI ASSISTANT DIALOGUE */}
                {transcribedText && !isRecording && (
                  <div className="p-6 rounded-3xl bg-slate-900/90 border border-red-500/40 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                          {t('detectedLang', currentLanguage.code)}: {currentLanguage.nativeName} ({currentLanguage.name})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          gemini-3.5-transcribe
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Citizen Speech Engine</span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-1 block">
                        {t('transcription', currentLanguage.code)} (உங்கள் பேச்சு):
                      </label>
                      {isEditingTranscription ? (
                        <textarea
                          value={transcribedText}
                          onChange={(e) => setTranscribedText(e.target.value)}
                          rows={3}
                          className="w-full p-3 rounded-xl bg-black/60 border border-red-500/50 text-sm text-white focus:outline-none"
                        />
                      ) : (
                        <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-sm text-slate-200 leading-relaxed font-medium">
                          "{transcribedText}"
                        </div>
                      )}
                    </div>

                    {/* CITIZEN INTERACTIVE AI VOICE ASSISTANT CARD */}
                    {aiAssistantReply && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-black to-slate-900 border border-red-500/40 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
                            <span className="text-xs font-bold text-white tracking-wide">
                              {currentLanguage.code === 'ta' ? 'குரல் வழி ஏஐ உதவியாளர் பதில்:' : 'AI Voice Assistant Response:'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAiSpeaking ? (
                              <button
                                onClick={handleStopAIVoice}
                                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold flex items-center gap-1.5 animate-pulse"
                              >
                                <VolumeX className="w-3.5 h-3.5" />
                                <span>{currentLanguage.code === 'ta' ? 'நிறுத்து' : 'Stop Audio'}</span>
                              </button>
                            ) : (
                              <button
                                onClick={handleReplayAIVoice}
                                className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-red-400" />
                                <span>{currentLanguage.code === 'ta' ? 'மீண்டும் கேட்க' : 'Replay Voice'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 font-medium">
                          {aiAssistantReply}
                        </p>

                        {/* Interactive Contextual Actions */}
                        {voiceAssistantState?.isGreeting ? (
                          <div className="pt-1 flex flex-wrap gap-2">
                            <button
                              onClick={startVoiceRecording}
                              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>{currentLanguage.code === 'ta' ? '🎙 உங்கள் பிரச்சனையை கூறவும்' : '🎙 Describe Problem & Area'}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <div className="flex flex-wrap gap-2">
                              {voiceAssistantState?.category && (
                                <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-red-500/30 text-slate-300 font-medium">
                                  📁 {voiceAssistantState.category}
                                </span>
                              )}
                              {voiceAssistantState?.extractedLandmark && (
                                <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-red-500/30 text-red-300 font-medium">
                                  📍 {voiceAssistantState.extractedLandmark}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={handleSubmitReport}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{currentLanguage.code === 'ta' ? '✓ புகாரை சமர்ப்பிக்கவும்' : 'Submit to Government'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditingTranscription(!isEditingTranscription)}
                          className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isEditingTranscription ? 'Done Editing' : t('edit', currentLanguage.code)}</span>
                        </button>
                      </div>

                      <button
                        onClick={handleConfirmVoice}
                        disabled={voiceConfirmed}
                        className={`px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                          voiceConfirmed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{voiceConfirmed ? '✓ Confirmed & Analyzed' : `✓ ${t('confirm', currentLanguage.code)}`}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2-COLUMN CIVIC EVIDENCE CAPTURE GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT COLUMN: TEXT REPORT & PHOTO */}
                  <div className="space-y-6">
                    {/* Text Problem Field with Dedicated Voice-First Speaking Engine */}
                    <div className="p-6 rounded-3xl bg-slate-900/80 border-2 border-white/10 hover:border-red-500/40 transition-colors space-y-4 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-red-400" />
                          <div>
                            <h3 className="text-sm font-black text-white flex items-center gap-2">
                              <span>
                                {currentLanguage.code === 'ta'
                                  ? 'உங்கள் பிரச்சனையை விவரியுங்கள்'
                                  : 'Describe Your Problem'}
                              </span>
                            </h3>
                            <span className="text-[11px] text-red-400 font-semibold">
                              {currentLanguage.code === 'ta'
                                ? 'டைப் செய்ய தேவையில்லை — மைக் தொட்டு பேசினாலே போதும்!'
                                : 'No typing needed — tap mic to speak your grievance!'}
                            </span>
                          </div>
                        </div>

                        {/* HIGH-VISIBILITY SPEAKING BUTTON */}
                        <button
                          type="button"
                          onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
                            isRecording
                              ? 'bg-red-600 text-white animate-pulse shadow-[0_0_30px_#ef4444] ring-4 ring-red-400/40'
                              : 'bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105'
                          }`}
                        >
                          {isRecording ? (
                            <>
                              <MicOff className="w-4 h-4 animate-bounce" />
                              <span>{currentLanguage.code === 'ta' ? '🛑 பேச்சை நிறுத்து' : 'Stop Speaking'}</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4 animate-pulse" />
                              <span>
                                {speakLanguageCode === 'ta'
                                  ? '🎙️ தமிழில் பேசுங்கள் (Speak)'
                                  : speakLanguageCode === 'ml'
                                  ? '🎙️ മലയാളത്തിൽ സംസാരിക്കൂ'
                                  : speakLanguageCode === 'te'
                                  ? '🎙️ తెలుగులో మాట్లాడండి'
                                  : speakLanguageCode === 'hi'
                                  ? '🎙️ हिंदी में बोलिए'
                                  : '🎙️ Speak Your Problem'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* QUICK LANGUAGE SELECTION CHIPS FOR VOICE */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                          <Languages className="w-3 h-3 text-red-400" />
                          <span>Language:</span>
                        </span>
                        {[
                          { code: 'en', label: 'English' },
                          { code: 'ta', label: 'தமிழ் (Tamil)' },
                          { code: 'hi', label: 'हिन्दी (Hindi)' },
                          { code: 'te', label: 'తెలుగు (Telugu)' },
                          { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
                          { code: 'ml', label: 'മലയാളം (Malayalam)' },
                        ].map((item) => (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => {
                              setSpeakLanguageCode(item.code);
                              if (isRecording) {
                                stopVoiceRecording();
                              }
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
                              speakLanguageCode === item.code
                                ? 'bg-red-600 text-white shadow-md ring-1 ring-white/40'
                                : 'bg-black/50 text-slate-300 hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => setIsLanguageDiagnosticsOpen(true)}
                          title="Open Language Output & Linguistic Accuracy Diagnostics"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-950/40 text-blue-300 hover:bg-blue-900/50 border border-blue-500/30 transition-colors shrink-0 cursor-pointer ml-auto"
                        >
                          <Activity className="w-3 h-3 text-blue-400" />
                          <span className="hidden sm:inline">Linguistic Diagnostics</span>
                          <span className="sm:hidden">Diagnostics</span>
                        </button>
                      </div>

                      {/* ACTIVE RECORDING PULSE BANNER */}
                      {isRecording && (
                        <div className="p-3.5 rounded-2xl bg-red-950/90 border-2 border-red-500 flex items-center justify-between gap-3 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
                            <span className="text-xs font-bold text-white">
                              {speakLanguageCode === 'ta'
                                ? '🎙️ ஏஐ உங்கள் குரலைக் கேட்கிறது... எந்த இடத்தில் என்ன பிரச்சனை என்று பேசுங்கள்!'
                                : speakLanguageCode === 'ml'
                                ? '🎙️ AI നിങ്ങളുടെ ശബ്ദം കേൾക്കുന്നു... എവിടെയാണ് പ്രശ്നം എന്ന് പറയൂ!'
                                : speakLanguageCode === 'te'
                                ? '🎙️ AI మీ వాయిస్ వింటోంది... ఎక్కడ సమస్య ఉందో చెప్పండి!'
                                : speakLanguageCode === 'hi'
                                ? '🎙️ AI सुन रहा है... कहाँ क्या समस्या है, बोलिए!'
                                : '🎙️ AI is listening to your voice... Speak your problem and location!'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={stopVoiceRecording}
                            className="px-3 py-1 rounded-xl bg-white text-red-700 hover:bg-slate-100 text-xs font-black shrink-0"
                          >
                            {speakLanguageCode === 'ta' ? 'முடிந்தது' : 'Done'}
                          </button>
                        </div>
                      )}

                      {/* TEXTAREA (AUTO-FILLED IN REAL TIME BY VOICE OR TYPED) */}
                      <textarea
                        id="text-report-input"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={
                          speakLanguageCode === 'ta'
                            ? 'எ.கா. அண்ணா நகர் மெயின் ரோட்டில் பெரிய பள்ளம் ஏற்பட்டுள்ளது, ஆம்புலன்ஸ் செல்ல முடியவில்லை...'
                            : speakLanguageCode === 'ml'
                            ? 'ഉദാഹരണം: മെയിൻ റോഡിൽ വലിയ കുഴികൾ ഉണ്ടായിരിക്കുന്നു, വാഹനങ്ങൾ കടന്നുപോകാൻ കഴിയുന്നില്ല...'
                            : speakLanguageCode === 'te'
                            ? 'ఉదాహరణ: మెయిన్ రోడ్డులో పెద్ద గుంతలు పడ్డాయి, అంబులెన్స్ వెళ్ళలేకపోతోంది...'
                            : speakLanguageCode === 'hi'
                            ? 'उदाहरण: मुख्य सड़क पर गहरा गड्ढा है, एम्बुलेंस नहीं निकल पा रही है...'
                            : 'e.g. Major road cave-in and flooded potholes near District Hospital blocking ambulances...'
                        }
                        rows={4}
                        className="w-full p-4 rounded-2xl bg-black/70 border border-white/15 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                      />

                      {/* AI VOICE SPOKEN REPLY & REPLAY AUDIO */}
                      {aiAssistantReply && (
                        <div className="p-3.5 rounded-2xl bg-black/60 border border-red-500/40 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-red-400 font-bold">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>
                                {speakLanguageCode === 'ta'
                                  ? 'ஏஐ குரல் பதில்:'
                                  : speakLanguageCode === 'ml'
                                  ? 'AI മറുപടി:'
                                  : speakLanguageCode === 'te'
                                  ? 'AI సమాధానం:'
                                  : 'AI Voice Reply:'}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={handleReplayAIVoice}
                              className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/30 text-[11px] font-bold text-red-300 hover:text-white flex items-center gap-1"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>{speakLanguageCode === 'ta' ? '🔊 மீண்டும் கேள்' : 'Replay'}</span>
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200 font-medium italic">
                            "{aiAssistantReply}"
                          </p>
                        </div>
                      )}

                      {/* Quick action buttons: Analyze + Fullscreen Voice Buddy */}
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        {inputText && !analysisResult && (
                          <button
                            type="button"
                            onClick={() => triggerAIAnalysis(inputText)}
                            disabled={isAnalyzingReport}
                            className="w-full sm:w-1/2 py-2.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-xs font-bold text-red-200 flex items-center justify-center gap-2 transition-all"
                          >
                            <Sparkles className="w-4 h-4 text-red-400" />
                            <span>
                              {isAnalyzingReport
                                ? 'Analyzing with Civic AI...'
                                : currentLanguage.code === 'ta'
                                ? 'ஏஐ மூலம் வகைப்படுத்து'
                                : 'Analyze Text with AI'}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsVoiceBuddyOpen(true)}
                          className={`w-full ${
                            inputText && !analysisResult ? 'sm:w-1/2' : 'w-full'
                          } py-2.5 rounded-xl bg-black/60 hover:bg-red-950/40 border border-white/15 hover:border-red-500/40 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all`}
                        >
                          <Mic className="w-3.5 h-3.5 text-red-400" />
                          <span>
                            {currentLanguage.code === 'ta'
                              ? '🎙️ முழுத்திரை வாய்ஸ் ஏஐ நண்பனைத் திற'
                              : 'Open Full Conversational Voice Assistant'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* PHOTO & CAMERA EVIDENCE */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-red-400" />
                          <h3 className="text-sm font-bold text-white">Visual Evidence (Photo / Camera)</h3>
                        </div>
                        <span className="text-[10px] text-slate-500">Live Hardware & Upload</span>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      {/* Live Camera Viewfinder Modal */}
                      {isCameraOpen ? (
                        <div className="space-y-3 p-4 rounded-2xl bg-black/80 border-2 border-red-500">
                          <div className="flex items-center justify-between text-xs text-red-400 font-bold">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                              LIVE CAMERA ACTIVE
                            </span>
                            <button
                              type="button"
                              onClick={closeCamera}
                              className="text-slate-400 hover:text-white"
                            >
                              ✕ Close
                            </button>
                          </div>
                          <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-white/20 flex items-center justify-center">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover"
                            />
                            {cameraError && (
                              <p className="absolute inset-0 p-4 flex items-center justify-center text-center text-xs text-red-300 bg-black/80">
                                {cameraError}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={closeCamera}
                              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={captureCameraPhoto}
                              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg flex items-center gap-1.5"
                            >
                              <Camera className="w-4 h-4" />
                              <span>{currentLanguage.code === 'ta' ? 'புகைப்படம் எடு' : 'Snap Photo'}</span>
                            </button>
                          </div>
                        </div>
                      ) : selectedPhotoUrl ? (
                        <div className="space-y-3">
                          <div className="relative rounded-2xl overflow-hidden border border-red-500/40 h-48 bg-black">
                            <img
                              src={selectedPhotoUrl}
                              alt="Civic Issue Evidence"
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => {
                                setSelectedPhotoUrl('');
                                setPhotoAnalysis(null);
                              }}
                              className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 text-[10px] text-red-400 border border-white/20 hover:bg-red-950"
                            >
                              Remove
                            </button>
                          </div>

                          {/* AI Vision Readout */}
                          {photoAnalysis && (
                            <div className="p-3.5 rounded-xl bg-black/60 border border-red-500/30 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-red-400">AI IMAGE ANALYSIS</span>
                                <span className="font-mono text-emerald-400 font-bold">
                                  {photoAnalysis.confidence}% Confidence
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Detected Damage:</span>
                                <span className="font-semibold text-white">{photoAnalysis.detectedObject}</span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Severity Rating:</span>
                                <span className="font-bold text-amber-400">{photoAnalysis.severity}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 italic pt-1 border-t border-white/10">
                                {photoAnalysis.details}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="border-2 border-dashed border-red-500/30 hover:border-red-500/60 bg-red-950/20 rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-center gap-2 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Camera className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">
                                {currentLanguage.code === 'ta' ? 'கேமராவைத் திறக்கவும்' : 'Open Live Camera'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {currentLanguage.code === 'ta' ? 'நேரடியாக படம் எடுக்க' : 'Capture live damage photo'}
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/15 hover:border-white/30 bg-black/40 rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-center gap-2 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-white/5 text-slate-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">
                                {currentLanguage.code === 'ta' ? 'கோப்பு பதிவேற்றம்' : 'Upload Image File'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {currentLanguage.code === 'ta' ? 'கேலரி / கோப்பிலிருந்து' : 'From phone or computer gallery'}
                              </p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: GPS MAP & LOCATION */}
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-400" />
                          <h3 className="text-sm font-bold text-white">📍 Incident Location (சம்பவம் நடந்த இடம்)</h3>
                        </div>
                        <button
                          onClick={handleCaptureGps}
                          disabled={isLocating}
                          className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-[11px] font-medium text-red-300 hover:bg-red-900/50 transition-colors flex items-center gap-1.5"
                        >
                          <Navigation className="w-3 h-3 text-red-400" />
                          <span>{t('useGps', currentLanguage.code)}</span>
                        </button>
                      </div>

                      {/* Location Origin Mode Switcher (Registered vs Out-of-Town) */}
                      <div className="p-1 rounded-xl bg-black/60 border border-white/10 grid grid-cols-2 gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => handleSwitchLocationMode('registered')}
                          className={`py-2 px-2.5 rounded-lg font-bold transition-all text-center truncate ${
                            locationMode === 'registered'
                              ? 'bg-red-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          🏠 My Area ({userDistrict})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchLocationMode('other')}
                          className={`py-2 px-2.5 rounded-lg font-bold transition-all text-center truncate ${
                            locationMode === 'other'
                              ? 'bg-red-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          🚗 Other / Out-of-Town Area
                        </button>
                      </div>

                      {/* Cascading State & District Selection if Out-of-Town */}
                      {locationMode === 'other' && (
                        <div className="p-3.5 rounded-2xl bg-black/50 border border-red-500/30 space-y-3">
                          <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block">
                            Select State & District of Incident:
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* State Cascading Dropdown */}
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">State / Province:</label>
                              <select
                                value={incidentState}
                                onChange={(e) => handleIncidentStateChange(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:border-red-500"
                              >
                                {getStatesForCountry(incidentCountry).map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* District Cascading Dropdown */}
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">District / Locality:</label>
                              <select
                                value={incidentDistrict}
                                onChange={(e) => handleIncidentDistrictChange(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:border-red-500"
                              >
                                {getDistrictsForState(incidentCountry, incidentState).map((dist) => (
                                  <option key={dist} value={dist}>
                                    {dist}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Landmark or Street Address Input with Voice Dictation */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-slate-300 font-medium">
                            Street, Landmark or Area (முகவரி / அடையாளம்):
                          </label>
                          <button
                            type="button"
                            onClick={handleVoiceCaptureLocation}
                            disabled={isCapturingVoiceLocation}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                              isCapturingVoiceLocation
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'bg-red-950/60 border border-red-500/30 text-red-300 hover:bg-red-900/50'
                            }`}
                          >
                            <Mic className="w-3 h-3 text-red-400" />
                            <span>{isCapturingVoiceLocation ? 'Listening...' : '🎙 Speak Address'}</span>
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={incidentLandmark}
                            onChange={(e) => handleIncidentLandmarkChange(e.target.value)}
                            placeholder="e.g. Near Govt Primary Health Centre, Anna Nagar Main Road"
                            className="flex-1 p-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                          />
                          <button
                            type="button"
                            onClick={handleGeocodeCurrentAddress}
                            disabled={isLocating}
                            className="px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-[11px] font-bold text-red-300 hover:bg-red-900/50 transition-all flex items-center gap-1 shrink-0"
                            title="Center Google Map on this location"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>{currentLanguage.code === 'ta' ? 'மேப்பில் தேடு' : 'Find on Map'}</span>
                          </button>
                        </div>
                      </div>

                      {/* AUTO MAP POSITIONING NOTICE BANNER */}
                      {autoMapNotice && (
                        <div className="p-3 rounded-2xl bg-red-950/80 border-2 border-red-500/70 text-xs font-bold text-red-200 flex items-center justify-between animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                            <span>{autoMapNotice}</span>
                          </div>
                          <span className="text-[10px] bg-red-600 px-2.5 py-0.5 rounded-full text-white font-mono shrink-0 shadow">
                            LIVE GPS PIN
                          </span>
                        </div>
                      )}

                      {/* Interactive Map */}
                      <GlobalMap
                        mode="picker"
                        interactiveLocation={userLocation}
                        onLocationChange={(newLoc) => setUserLocation(newLoc)}
                        heightClass="h-52"
                      />

                      {/* Detected location details */}
                      <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Selected Address:</span>
                          <span className="font-semibold text-white text-right max-w-[240px] truncate">
                            {userLocation.address}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Jurisdiction:</span>
                          <span className="text-slate-200">
                            {incidentDistrict}, {incidentState} ({incidentCountry})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">GPS Coordinates:</span>
                          <span className="font-mono text-red-400 text-[11px]">
                            {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI CASE SUMMARY & CRITICALITY BREAKDOWN (Section 9, 10, 11 in brief) */}
                {analysisResult && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.25)] space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-white/10">
                      <div>
                        <span className="text-[10px] font-mono text-red-400 uppercase font-bold tracking-wider">
                          Step 3 of Pipeline: AI Understanding & Criticality
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                          {t('aiCaseSummary', currentLanguage.code)}
                        </h3>
                      </div>

                      {/* Play Same Language AI Voice Response Button */}
                      <button
                        onClick={() =>
                          isSynthesizingSpeech
                            ? stopCaseSummaryVoice()
                            : playCaseSummaryVoice(analysisResult.aiVoiceResponseText)
                        }
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                      >
                        {isSynthesizingSpeech ? (
                          <>
                            <VolumeX className="w-4 h-4 animate-pulse" />
                            <span>Stop Voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            <span>[ 🔊 {t('playVoice', currentLanguage.code)} ]</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Spoken response banner */}
                    <div className="p-4 rounded-2xl bg-black/60 border border-red-500/30 flex items-start gap-3">
                      <Volume2 className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-mono uppercase text-red-400 font-bold block mb-1">
                          Spoken AI Response ({currentLanguage.nativeName}):
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed italic">
                          "{analysisResult.aiVoiceResponseText}"
                        </p>
                      </div>
                    </div>

                    {/* Criticality & Priority Score Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Criticality Card */}
                      <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                        <span className="text-xs text-slate-400 font-medium">Criticality Classification:</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-black tracking-wider ${
                              analysisResult.criticality === 'CRITICAL'
                                ? 'bg-red-600 text-white shadow-[0_0_15px_#ef4444]'
                                : analysisResult.criticality === 'HIGH'
                                ? 'bg-amber-500 text-black'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {analysisResult.criticality}
                          </span>
                        </div>
                        <div className="space-y-1 pt-2 border-t border-white/10 text-xs">
                          <span className="font-bold text-slate-300">WHY?</span>
                          {analysisResult.criticalityReasons.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Transparent Priority Score (0-100) */}
                      <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium">Transparent Priority:</span>
                          <span className="text-2xl font-black text-red-400 font-mono">
                            {analysisResult.priorityScore} / 100
                          </span>
                        </div>
                        {/* Breakdown progress bars */}
                        <div className="space-y-1.5 text-[11px] pt-1 border-t border-white/10">
                          <div className="flex justify-between text-slate-300">
                            <span>Citizen Demand:</span>
                            <span className="font-mono text-white">{analysisResult.scoreBreakdown.citizenDemand} / 25</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Infrastructure Gap:</span>
                            <span className="font-mono text-white">{analysisResult.scoreBreakdown.infrastructureGap} / 25</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Population Impact:</span>
                            <span className="font-mono text-white">{analysisResult.scoreBreakdown.populationImpact} / 20</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Urgency:</span>
                            <span className="font-mono text-white">{analysisResult.scoreBreakdown.urgency} / 15</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Vulnerability:</span>
                            <span className="font-mono text-white">{analysisResult.scoreBreakdown.vulnerability} / 15</span>
                          </div>
                        </div>
                      </div>

                      {/* Hotspot & Department Routing Card */}
                      <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                        <span className="text-xs text-slate-400 font-medium">Civic Intelligence Routing:</span>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Recommended Department:</span>
                          <p className="text-xs font-bold text-white mt-0.5">
                            {analysisResult.recommendedDepartment}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Duplicate Clustering:</span>
                          <p className="text-xs text-red-400 font-semibold mt-0.5">
                            Merged {analysisResult.duplicateCount} citizen reports into Hotspot
                          </p>
                        </div>
                        {analysisResult.isUnderRepresentedArea && (
                          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-[10px] text-cyan-200">
                            <strong>Under-Represented Community:</strong> Low report count compensated with high baseline infrastructure deficit.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* FINAL SUBMIT BUTTON (Section 14) */}
                    <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        <span>Evidence attached: Voice ✓ Photo ✓ GPS ✓</span>
                      </div>

                      <button
                        onClick={handleSubmitReport}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(239,68,68,0.6)] flex items-center justify-center gap-2 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        <span>{t('submitToGov', currentLanguage.code)}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: MY REPORTS (Section 15 in brief) */}
        {activeTab === 'my-reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">{t('myReports', currentLanguage.code)}</h2>
                <p className="text-xs text-slate-400">Track real-time progress from submission to field resolution.</p>
              </div>
              <div className="flex items-center gap-2">
                {issuesList.length > 0 && (
                  <button
                    onClick={() => {
                      clearStoredIssues();
                      setIssuesList([]);
                      setSelectedMyIssue(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-950/60 border border-white/10 hover:border-red-500/40 text-slate-400 hover:text-red-300 text-xs font-medium transition-colors"
                    title="Clear your filed test reports"
                  >
                    🗑 Clear All
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('report')}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                >
                  + File New Report
                </button>
              </div>
            </div>

            {issuesList.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {currentLanguage.code === 'ta'
                      ? 'இன்னும் எந்த புகாரும் பதிவு செய்யப்படவில்லை'
                      : 'No Civic Reports Filed Yet'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    {currentLanguage.code === 'ta'
                      ? 'உங்கள் பகுதியில் உள்ள பிரச்சனை (சாலை, குடிநீர், கழிவுநீர், மின்சாரம்) குறித்து குரல் அல்லது உரை மூலம் புகார் அளிக்க "Report Issue" என்பதைப் பயன்படுத்தவும்.'
                      : 'Report any issue in your community using voice or text. Your real submitted cases will appear right here.'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('report')}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>{currentLanguage.code === 'ta' ? 'புதிய புகார் பதிவு செய்' : 'File a Civic Report Now'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cases List */}
                <div className="lg:col-span-1 space-y-3">
                  {issuesList.map((issue) => {
                    const isSelected = selectedMyIssue?.id === issue.id;
                    return (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedMyIssue(issue)}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-slate-900 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                            : 'bg-black/50 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-red-400">{issue.id}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              issue.status === 'Resolved'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : issue.status === 'Action In Progress'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-blue-950 text-blue-400 border border-blue-800'
                            }`}
                          >
                            {issue.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{issue.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{issue.aiSummary}</p>
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                          <span>📍 {issue.location.city}</span>
                          <span className="font-mono text-red-400 font-bold">{issue.priorityScore}/100</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              {/* Detailed Visual Timeline & Resolution Feedback */}
              <div className="lg:col-span-2">
                {selectedMyIssue ? (
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                      <div>
                        <span className="font-mono text-xs text-red-400 font-bold">{selectedMyIssue.id}</span>
                        <h3 className="text-lg font-bold text-white mt-0.5">{selectedMyIssue.title}</h3>
                        <span className="text-xs text-slate-400">
                          {selectedMyIssue.category} • {selectedMyIssue.location.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Assigned Authority:</span>
                          <span className="text-xs font-bold text-white">{selectedMyIssue.assignedDepartment}</span>
                        </div>
                        <button
                          onClick={() => {
                            stopSpeaking();
                            setIsMyIssueVoicePlaying(false);
                            setSelectedMyIssue(null);
                          }}
                          className="p-1.5 rounded-xl bg-white/10 hover:bg-red-600/80 border border-white/15 text-slate-300 hover:text-white transition-all shadow-md"
                          title="Close Details"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* CITIZEN MULTILINGUAL VOICE PLAYER */}
                    <div className="p-4 rounded-2xl bg-black/60 border border-red-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-bold text-white">
                            Listen to Case Status in Your Preferred Language (குரல் விளக்கம்)
                          </span>
                        </div>
                        {isMyIssueVoicePlaying && (
                          <button
                            onClick={handleStopMyIssueVoice}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Stop Voice</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { code: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
                          { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
                          { code: 'ml', label: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
                          { code: 'te', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
                          { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
                          { code: 'en', label: 'English (US)', flag: '🇺🇸' },
                          { code: 'en-gb', label: 'English (UK)', flag: '🇬🇧' },
                          { code: 'es', label: 'Español', flag: '🇪🇸' },
                        ].map((l) => (
                          <button
                            key={l.code}
                            onClick={() => handleMyIssueVoiceSwitch(l.code)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                              myIssueListenLang === l.code && isMyIssueVoicePlaying
                                ? 'bg-red-600 text-white shadow'
                                : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <span>{l.flag}</span>
                            <span>{l.label}</span>
                          </button>
                        ))}
                      </div>

                      {myIssueTranslated && (
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-xs space-y-1">
                          <div className="font-bold text-white">{myIssueTranslated.title}</div>
                          <p className="text-slate-300 text-[11px]">{myIssueTranslated.description}</p>
                          <div className="text-[10px] text-red-400 font-mono pt-1">
                            Status: {myIssueTranslated.officialStatus} • Location: {myIssueTranslated.locationText}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Visual 7-Step Timeline */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                        Civic Progress Timeline
                      </h4>
                      <div className="space-y-4">
                        {selectedMyIssue.timeline.map((event, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="flex-1 pb-3 border-b border-white/5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">{event.status}</span>
                                <span className="text-[10px] font-mono text-slate-400">{event.timestamp}</span>
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5">{event.note}</p>
                              <span className="text-[10px] text-red-400 font-mono">By: {event.actor}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 17: BEFORE VS AFTER PHOTO & CITIZEN RESOLUTION FEEDBACK LOOP */}
                    {selectedMyIssue.status === 'Resolved' && (
                      <div className="p-5 rounded-2xl bg-black/60 border border-emerald-500/40 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                          <h4 className="text-sm font-bold text-white">Government Action Completed</h4>
                        </div>

                        {/* Before vs After comparison images */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                              BEFORE: Civic Problem
                            </span>
                            <div className="h-32 rounded-xl overflow-hidden bg-black border border-white/10">
                              <img
                                src={selectedMyIssue.photoUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'}
                                alt="Before Repair"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono text-emerald-400 block mb-1">
                              AFTER: Government Fix
                            </span>
                            <div className="h-32 rounded-xl overflow-hidden bg-black border border-emerald-500/40">
                              <img
                                src={selectedMyIssue.resolutionPhotoUrl || 'https://images.unsplash.com/photo-1578961952402-f6f8e763137e?auto=format&fit=crop&w=400&q=80'}
                                alt="After Repair"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Citizen feedback prompt */}
                        {selectedMyIssue.citizenFeedback ? (
                          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
                            ✓ Citizen verified resolved! Rating: {selectedMyIssue.citizenFeedback.rating} ★
                            {selectedMyIssue.citizenFeedback.comment && ` - "${selectedMyIssue.citizenFeedback.comment}"`}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3">
                            <p className="text-xs font-bold text-white">
                              {t('wasResolved', currentLanguage.code)}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleFeedbackSubmit(selectedMyIssue.id)}
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>{t('yesResolved', currentLanguage.code)}</span>
                              </button>
                              <button
                                onClick={() => alert('Feedback noted. Escalated to District Vigilance Officer.')}
                                className="px-4 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-800 text-red-200 text-xs font-bold flex items-center gap-1.5"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                                <span>{t('noNotResolved', currentLanguage.code)}</span>
                              </button>
                            </div>
                            <div className="pt-2">
                              <input
                                type="text"
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                placeholder="Optional citizen comment on road quality, speed, etc."
                                className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                              />
                            </div>
                            {feedbackSuccess && (
                              <p className="text-xs text-emerald-400 font-semibold">
                                ✓ Thank you! Your feedback has been recorded in Government Impact Analytics.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    Select a report from the left to view timeline
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

        {/* TAB 3: NEARBY ISSUES (Section 16 in brief - privacy-safe public map) */}
        {activeTab === 'nearby' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">{t('nearbyIssues', currentLanguage.code)}</h2>
                <p className="text-xs text-slate-400">
                  Privacy-safe public civic issues in your vicinity (no private citizen identity revealed).
                </p>
              </div>
            </div>

            <GlobalMap
              issues={issuesList}
              heightClass="h-96"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {issuesList.slice(0, 3).map((issue) => (
                <div key={issue.id} className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{issue.category}</span>
                    <span className="text-red-400 font-bold">{issue.criticality}</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{issue.aiSummary}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                    <span>📍 Near {issue.location.city}</span>
                    <span className="font-semibold text-emerald-400">{issue.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CITIZEN ENGAGEMENT TRENDS D3 HEATMAP */}
        {activeTab === 'trends' && (
          <CitizenEngagementHeatmap
            currentLanguage={currentLanguage}
            onSelectDateOrIssue={(dateStr) => {
              console.log('Selected engagement heatmap window:', dateStr);
            }}
          />
        )}

        {/* TAB 5: GEMINI-POWERED CITIZEN SENTIMENT & FEEDBACK MINI-DASHBOARD */}
        {activeTab === 'sentiment' && (
          <CitizenSentimentMiniDashboard
            currentLanguage={currentLanguage}
            userDistrict={incidentDistrict || userDistrict}
            userState={incidentState || userState}
            userData={userData}
          />
        )}

        {/* TAB 6: GEMINI PREDICTIVE GOVERNMENT POLICY IMPACT MODULE */}
        {activeTab === 'updates' && (
          <PolicyPredictiveModuleTab
            policies={areaPolicies}
            userData={userData}
            userDistrict={incidentDistrict || userDistrict}
            userState={incidentState || userState}
            preferredLangCode={speakLanguageCode || currentLanguage.code || 'en'}
          />
        )}

        {/* ZERO-LITERACY FRIENDLY VOICE AI BUDDY MODAL */}
        <FriendlyVoiceBuddyModal
          isOpen={isVoiceBuddyOpen}
          onClose={() => setIsVoiceBuddyOpen(false)}
          langCode={speakLanguageCode || currentLanguage.code || 'en'}
          userDistrict={incidentDistrict || userDistrict}
          userState={incidentState || userState}
          userCountry={incidentCountry || userCountry}
          userLocation={userLocation}
          onTextDetected={(text) => {
            setInputText(text);
            setTranscribedText(text);
          }}
          onLocationResolved={(newLoc) => {
            setUserLocation(newLoc);
            setIncidentLandmark(newLoc.address);
            setAutoMapNotice(`📍 மேப் தானாக "${newLoc.address}" பகுதிக்கு மாற்றப்பட்டது`);
          }}
          onIssueCreated={(newIssue) => {
            refreshIssues();
            setSelectedMyIssue(newIssue);
            setActiveTab('my-reports');
          }}
        />

        {/* REAL-TIME POLICY NOTIFICATION FLOATING BANNER */}
        <PolicyNotificationBanner
          policy={activeBannerPolicy}
          onViewPolicy={() => {
            setActiveBannerPolicy(null);
            setIsPolicyDrawerOpen(true);
          }}
          onDismiss={() => setActiveBannerPolicy(null)}
        />

        {/* REAL-TIME POLICY ALERTS & GAZETTES DRAWER */}
        <PolicyAlertsDrawer
          isOpen={isPolicyDrawerOpen}
          onClose={() => setIsPolicyDrawerOpen(false)}
          policies={areaPolicies}
          preferredLangCode={speakLanguageCode || currentLanguage.code || 'en'}
          userLocation={{
            country: incidentCountry || userCountry,
            state: incidentState || userState,
            district: incidentDistrict || userDistrict,
          }}
        />

        {/* LINGUISTIC ACCURACY & VOICE DIAGNOSTICS MODAL */}
        <LanguageDiagnosticsModal
          isOpen={isLanguageDiagnosticsOpen}
          onClose={() => setIsLanguageDiagnosticsOpen(false)}
          initialLangCode={speakLanguageCode || currentLanguage.code}
        />
      </div>
    </div>
  );
};
