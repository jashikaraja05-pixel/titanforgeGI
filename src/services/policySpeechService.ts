/**
 * High-Fidelity Text-to-Speech (TTS) Service for Policy Summaries & Civic Insights
 * Powered by browser Web Speech API (SpeechSynthesis)
 * Specifically optimized for Tamil linguistic cadence, agglutinative phonetics, and abbreviations.
 */

import { GovernmentPolicy, PolicyCitizenImpact } from '../types/index';
import { speechSynthesisManager, stopSingleVoice } from './speechSynthesisSingleton';

export interface PolicySpeechOptions {
  policy: GovernmentPolicy;
  impact?: PolicyCitizenImpact | null;
  langCode?: string; // 'ta' | 'en' | 'hi' | 'ml' | 'te' | 'kn' | 'es'
  rate?: number; // default 0.90 for Tamil, 1.0 for English
  pitch?: number; // default 1.0
  voiceName?: string;
  onStart?: () => void;
  onSentenceChange?: (currentSentence: string, index: number, total: number) => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export interface PolicySpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  policyId: string | null;
  policyTitle: string;
  currentSentence: string;
  sentenceIndex: number;
  totalSentences: number;
  langCode: string;
  activeVoiceName: string;
  isNativeSpeechSynthesis: boolean;
  rate: number;
}

type SpeechStateListener = (state: PolicySpeechState) => void;

// Active state singleton
let activeState: PolicySpeechState = {
  isPlaying: false,
  isPaused: false,
  policyId: null,
  policyTitle: '',
  currentSentence: '',
  sentenceIndex: 0,
  totalSentences: 0,
  langCode: 'en',
  activeVoiceName: '',
  isNativeSpeechSynthesis: true,
  rate: 0.90,
};

const listeners = new Set<SpeechStateListener>();

function notifyListeners() {
  const snapshot = { ...activeState };
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (e) {
      console.warn('Listener error in policySpeechService:', e);
    }
  });
}

export function subscribePolicySpeech(listener: SpeechStateListener): () => void {
  listeners.add(listener);
  listener({ ...activeState });
  return () => {
    listeners.delete(listener);
  };
}

export function getPolicySpeechState(): PolicySpeechState {
  return { ...activeState };
}

// Keep-alive timer for Chrome SpeechSynthesis bug (>15s cutoff)
let keepAliveTimer: any = null;
let currentUtterances: string[] = [];
let currentUtteranceIndex = 0;
let currentOptions: PolicySpeechOptions | null = null;
let activeAudioElement: HTMLAudioElement | null = null;

function clearKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

function startKeepAlive() {
  clearKeepAlive();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    keepAliveTimer = setInterval(() => {
      if (activeState.isPlaying && !activeState.isPaused && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }
}

/**
 * High-Fidelity Tamil Text Normalizer & Phonetic Enhancer
 * Cleans administrative jargon, expands acronyms into natural Tamil,
 * and tunes punctuation for natural cadence.
 */
export function optimizeTamilTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove Markdown & UI artifacts that trip up TTS
  cleaned = cleaned
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
    .replace(/\*(.*?)\*/g, '$1') // remove italic
    .replace(/#{1,6}\s+/g, '') // remove headings
    .replace(/`{1,3}.*?`{1,3}/g, '') // remove code tags
    .replace(/[•\-\*]\s+/g, ' ') // replace bullet markers with spaces
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links to text
    .replace(/[#@%^&*_=~<>]/g, ' '); // special chars

  // 2. Tamil Administrative Acronyms & Government Terms
  const tamilReplacements: [RegExp, string][] = [
    // Tamil government order / gazette
    [/\b(G\.O\.|GO|G\.O|அ\.ஆ\.)\b/gi, 'அரசாணை'],
    // Currency
    [/\b(Rs\.|Rs|INR|ரூ\.)\s*(\d+)/gi, '$2 ரூபாய்'],
    [/(\d+)\s*(Rs\.|Rs|INR|ரூ\.)/gi, '$1 ரூபாய்'],
    // Units of measurement
    [/(\d+)\s*(km|கி\.மீ\.|கிமீ)\b/gi, '$1 கிலோமீட்டர்'],
    [/(\d+)\s*(m|மீ\.)\b/gi, '$1 மீட்டர்'],
    [/(\d+)\s*(cm|செ\.மீ\.)\b/gi, '$1 சென்டிமீட்டர்'],
    [/(\d+)\s*(sq\.?ft|ச\.அடி)\b/gi, '$1 சதுர அடி'],
    // Percentage
    [/(\d+)\s*%/g, '$1 சதவீதம்'],
    // Common Civic abbreviations
    [/\bPHC\b/gi, 'ஆரம்ப சுகாதார நிலையம்'],
    [/\bTNEB\b/gi, 'தமிழ்நாடு மின்சார வாரியம்'],
    [/\bCMDA\b/gi, 'சென்னை பெருநகர வளர்ச்சிக் குழுமம்'],
    [/\bGCC\b/gi, 'சென்னை மாநகராட்சி'],
    [/\bPWD\b/gi, 'பொதுப்பணித்துறை'],
    [/\bPDS\b/gi, 'பொது விநியோகத் திட்டம் ரேஷன்'],
    [/\bRTO\b/gi, 'வட்டாரப் போக்குவரத்து அலுவலகம்'],
    [/\bCCTV\b/gi, 'கண்காணிப்பு கேமரா'],
    [/\bEV\b/gi, 'மின்சார வாகனம்'],
    [/\bAI\b/gi, 'செயற்கை நுண்ணறிவு'],
    [/\b24x7\b/gi, 'இருபத்தி நான்கு மணி நேரமும்'],
    [/\b100%\b/g, 'முழு சதவீதம்'],
    // Civics dates & refs
    [/\bRef:\b/gi, 'குறிப்பு எண்:'],
    [/\bDate:\b/gi, 'தேதி:'],
    [/\bDept:\b/gi, 'துறை:'],
    // Latin vs / and symbols
    [/\s*\/\s*/g, ' மற்றும் '],
    [/\s*&\s*/g, ' மற்றும் '],
  ];

  for (const [pattern, replacement] of tamilReplacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // 3. Format numbers nicely so Tamil TTS engine articulates them clearly
  // Insert spaces around standalone numbers
  cleaned = cleaned.replace(/(\d+)/g, ' $1 ');

  // 4. Ensure punctuation provides proper pause cadence
  cleaned = cleaned
    .replace(/([.!?।])\s*/g, '$1\n') // split on punctuation
    .replace(/[ \t]+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * General Text Normalizer for English and other languages
 */
export function optimizeTextForSpeech(text: string, langCode: string): string {
  if (langCode === 'ta') {
    return optimizeTamilTextForSpeech(text);
  }

  let cleaned = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[•\-\*]\s+/g, ' ')
    .replace(/[#@%^&*_=~<>]/g, ' ')
    .replace(/Rs\.\s*(\d+)/gi, '$1 rupees')
    .replace(/(\d+)%/g, '$1 percent')
    .replace(/\s*\/\s*/g, ' and ')
    .replace(/\s*&\s*/g, ' and ');

  return cleaned.replace(/[ \t]+/g, ' ').trim();
}

/**
 * Query and filter authentic voices from browser SpeechSynthesis
 */
export function getAvailableSpeechVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Finds the optimal voice for the given language
 * Prioritizes native Tamil voices and rejects English voices for Tamil
 */
export function findOptimalVoice(langCode: string): {
  voice: SpeechSynthesisVoice | null;
  isNativeMatch: boolean;
  voiceName: string;
} {
  const voices = getAvailableSpeechVoices();
  if (voices.length === 0) {
    return { voice: null, isNativeMatch: false, voiceName: 'System Default' };
  }

  const normalizedLang = langCode.toLowerCase();

  if (normalizedLang === 'ta') {
    // 1. Look for explicit Tamil locale or name
    const tamilVoices = voices.filter((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      const isTamilLang = l.startsWith('ta') || l.includes('tam');
      const hasTamilName =
        n.includes('tamil') ||
        n.includes('தமிழ்') ||
        n.includes('valluvar') ||
        n.includes('kavya') ||
        n.includes('vani');

      // Crucial: Reject English voices that mistakenly match substring
      const isEnglish = n.includes('english') || l.startsWith('en');

      return (isTamilLang || hasTamilName) && !isEnglish;
    });

    if (tamilVoices.length > 0) {
      // Prioritize natural/online voices
      const preferred =
        tamilVoices.find((v) => !v.localService || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural')) ||
        tamilVoices[0];
      return { voice: preferred, isNativeMatch: true, voiceName: preferred.name };
    }

    return { voice: null, isNativeMatch: false, voiceName: 'Gemini Cloud Tamil Voice (Studio 24kHz)' };
  }

  // Other languages: Hindi, Malayalam, Telugu, Kannada, Spanish, English
  const matched = voices.find((v) => {
    const l = v.lang.toLowerCase();
    return l.startsWith(normalizedLang);
  });

  if (matched) {
    return { voice: matched, isNativeMatch: true, voiceName: matched.name };
  }

  // Fallback default voice
  const defaultVoice = voices.find((v) => v.default) || voices[0];
  return { voice: defaultVoice || null, isNativeMatch: false, voiceName: defaultVoice?.name || 'Default Voice' };
}

/**
 * Generates an articulate, cohesive policy speech narrative in the target language.
 * Combines policy title, department, summary, and predictive impact insights.
 */
export function buildPolicySpeechScript(
  policy: GovernmentPolicy,
  impact?: PolicyCitizenImpact | null,
  langCode: string = 'en'
): string {
  const isTamil = langCode === 'ta';
  const isEnglish = langCode.startsWith('en');
  const isHindi = langCode === 'hi';
  const isMalayalam = langCode === 'ml';
  const isTelugu = langCode === 'te';

  if (isTamil) {
    let script = `தமிழ்நாடு அரசு கொள்கை அறிவிப்பு. `;
    script += `துறை: ${policy.department}. `;
    script += `கொள்கை தலைப்பு: ${policy.title}. `;
    
    if (policy.affectedDistrict || policy.affectedState) {
      script += `பயனடையும் பகுதி: ${policy.affectedDistrict ? policy.affectedDistrict + ', ' : ''}${policy.affectedState}. `;
    }

    script += `கொள்கைச் சுருக்கம்: ${policy.summary}. `;

    if (impact) {
      script += `செயற்கை நுண்ணறிவு குடிமக்கள் தாக்க மதிப்பீடு: `;
      script += `${impact.potentialImpactScore === 'High' ? 'அதிமுக்கிய முன்னுரிமை தாக்கம்.' : impact.potentialImpactScore === 'Medium' ? 'நடுத்தர தாக்கம்.' : 'வழக்கமான தகவல்.'} `;
      script += `தாக்க விளக்கம்: ${impact.impactSummary}. `;

      if (impact.keyBenefits && impact.keyBenefits.length > 0) {
        script += `முக்கிய நன்மைகள்: ${impact.keyBenefits.slice(0, 3).join('. ')}. `;
      }

      if (impact.actionSteps && impact.actionSteps.length > 0) {
        script += `குடிமக்கள் செய்ய வேண்டிய அடுத்த கட்ட நடவடிக்கை: ${impact.actionSteps.slice(0, 2).join('. ')}. `;
      }
    } else if (policy.actionRequiredForCitizen) {
      script += `குடிமக்கள் நடவடிக்கை: ${policy.actionRequiredForCitizen}. `;
    }

    script += `அறிவிப்பு நிறைவடைந்தது. நன்றி!`;
    return script;
  }

  if (isHindi) {
    let script = `सरकारी नीति अधिसूचना. `;
    script += `विभाग: ${policy.department}. `;
    script += `शीर्षक: ${policy.title}. `;
    script += `नीति सारांश: ${policy.summary}. `;
    if (impact) {
      script += `नागरिक प्रभाव सारांश: ${impact.impactSummary}. `;
      if (impact.keyBenefits && impact.keyBenefits.length > 0) {
        script += `प्रमुख लाभ: ${impact.keyBenefits.slice(0, 3).join(', ')}. `;
      }
    }
    return script;
  }

  if (isMalayalam) {
    let script = `സർക്കാർ നയ വിജ്ഞാപനം. `;
    script += `വകുപ്പ്: ${policy.department}. `;
    script += `തലക്കെട്ട്: ${policy.title}. `;
    script += `സംഗ്രഹം: ${policy.summary}. `;
    if (impact) {
      script += `പൗര സ്വാധീനം: ${impact.impactSummary}. `;
    }
    return script;
  }

  if (isTelugu) {
    let script = `ప్రభుత్వ విధాన ప్రకటన. `;
    script += `శాఖ: ${policy.department}. `;
    script += `శీర్షిక: ${policy.title}. `;
    script += `సారాంశం: ${policy.summary}. `;
    if (impact) {
      script += `ప్రజలపై ప్రభావం: ${impact.impactSummary}. `;
    }
    return script;
  }

  // Default English Script
  let script = `Government Policy Briefing. `;
  script += `Department: ${policy.department}. `;
  script += `Policy Title: ${policy.title}. `;
  
  if (policy.affectedDistrict || policy.affectedState) {
    script += `Applicable Jurisdiction: ${policy.affectedDistrict ? policy.affectedDistrict + ', ' : ''}${policy.affectedState}. `;
  }

  script += `Policy Summary: ${policy.summary}. `;

  if (impact) {
    script += `Predictive Citizen Impact Analysis: `;
    script += `${impact.potentialImpactScore} Priority Impact, with an impact score of ${impact.numericScore} out of 100. `;
    script += `Impact Overview: ${impact.impactSummary}. `;

    if (impact.keyBenefits && impact.keyBenefits.length > 0) {
      script += `Key Benefits: ${impact.keyBenefits.slice(0, 3).join('; ')}. `;
    }

    if (impact.actionSteps && impact.actionSteps.length > 0) {
      script += `Recommended Citizen Action Steps: ${impact.actionSteps.slice(0, 2).join('; ')}. `;
    }
  } else if (policy.actionRequiredForCitizen) {
    script += `Citizen Action Required: ${policy.actionRequiredForCitizen}. `;
  }

  script += `Official Gazette Briefing concluded.`;
  return script;
}

/**
 * Split text into individual speech chunks / sentences
 * to avoid browser SpeechSynthesis cut-off limitations
 */
function splitIntoSentenceChunks(text: string): string[] {
  const rawSentences = text
    .split(/(?<=[.!?।\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const chunks: string[] = [];
  let buffer = '';

  for (const sentence of rawSentences) {
    // Keep chunks under ~180 characters for optimal prosody & zero truncation
    if (buffer.length + sentence.length > 160 && buffer.length > 0) {
      chunks.push(buffer.trim());
      buffer = sentence;
    } else {
      buffer = buffer ? `${buffer} ${sentence}` : sentence;
    }
  }

  if (buffer.trim()) {
    chunks.push(buffer.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Play Policy Speech using SpeechSynthesis API (with high-fidelity Tamil tuning)
 */
export async function playPolicySpeech(options: PolicySpeechOptions): Promise<void> {
  speechSynthesisManager.stopAll();
  stopPolicySpeech();

  const langCode = options.langCode || 'en';
  const isTamil = langCode === 'ta';

  // Build the script
  const fullRawScript = buildPolicySpeechScript(options.policy, options.impact, langCode);
  const optimizedScript = optimizeTextForSpeech(fullRawScript, langCode);
  const sentenceChunks = splitIntoSentenceChunks(optimizedScript);

  currentOptions = options;
  currentUtterances = sentenceChunks;
  currentUtteranceIndex = 0;

  // Determine rate
  // Tamil benefits from a measured tempo (0.88 - 0.90) for pristine clarity of agglutinative syllables
  const defaultRate = isTamil ? 0.90 : 1.0;
  const rate = options.rate !== undefined ? options.rate : defaultRate;
  const pitch = options.pitch !== undefined ? options.pitch : 1.0;

  // Check SpeechSynthesis availability and matching voice
  const { voice, isNativeMatch, voiceName } = findOptimalVoice(langCode);

  activeState = {
    isPlaying: true,
    isPaused: false,
    policyId: options.policy.id,
    policyTitle: options.policy.title,
    currentSentence: sentenceChunks[0] || '',
    sentenceIndex: 1,
    totalSentences: sentenceChunks.length,
    langCode,
    activeVoiceName: voiceName,
    isNativeSpeechSynthesis: !!voice && (isNativeMatch || !isTamil),
    rate,
  };

  notifyListeners();
  options.onStart?.();

  // If no native voice exists on client OS for Tamil, use high-fidelity Gemini AI TTS audio pipeline
  if (isTamil && !isNativeMatch) {
    try {
      await playViaGeminiTTSFallback(optimizedScript, langCode, options);
      return;
    } catch (err) {
      console.warn('Gemini TTS fallback failed, proceeding with SpeechSynthesis default:', err);
    }
  }

  // Browser SpeechSynthesis playback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    startKeepAlive();
    speakNextChunk(voice, rate, pitch);
  } else {
    // Fallback if browser doesn't have speechSynthesis
    await playViaGeminiTTSFallback(optimizedScript, langCode, options);
  }
}

/**
 * Sequential utterance player
 */
function speakNextChunk(voice: SpeechSynthesisVoice | null, rate: number, pitch: number) {
  if (!activeState.isPlaying || activeState.isPaused) return;

  if (currentUtteranceIndex >= currentUtterances.length) {
    // Finished all sentences
    finishPlayback();
    return;
  }

  const chunk = currentUtterances[currentUtteranceIndex];
  activeState.currentSentence = chunk;
  activeState.sentenceIndex = currentUtteranceIndex + 1;
  notifyListeners();

  currentOptions?.onSentenceChange?.(chunk, currentUtteranceIndex + 1, currentUtterances.length);

  try {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1.0;

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = activeState.langCode === 'ta' ? 'ta-IN' : 'en-US';
    }

    utterance.onend = () => {
      currentUtteranceIndex++;
      if (activeState.isPlaying && !activeState.isPaused) {
        // Small pause between sentences for breathing rhythm
        setTimeout(() => {
          speakNextChunk(voice, rate, pitch);
        }, 120);
      }
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesisUtterance error notice:', e);
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        currentUtteranceIndex++;
        speakNextChunk(voice, rate, pitch);
      }
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Failed to speak utterance:', err);
    currentUtteranceIndex++;
    speakNextChunk(voice, rate, pitch);
  }
}

/**
 * Fallback to Gemini AI Studio 24kHz Studio Speech (when OS lacks native Tamil SpeechSynthesis driver)
 */
async function playViaGeminiTTSFallback(
  text: string,
  langCode: string,
  options: PolicySpeechOptions
): Promise<void> {
  activeState.isNativeSpeechSynthesis = false;
  activeState.activeVoiceName = 'Gemini AI Studio Tamil TTS (24kHz WAV)';
  notifyListeners();

  try {
    // Synthesize in rich chunks or full text
    const res = await fetch('/api/voice/gemini-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 450), // clean primary summary
        lang: langCode,
        voice: 'Kore',
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!data.audioUrl) throw new Error('No audio URL returned');

    const audio = new Audio(data.audioUrl);
    activeAudioElement = audio;

    audio.onplay = () => {
      activeState.isPlaying = true;
      activeState.isPaused = false;
      notifyListeners();
    };

    audio.onended = () => {
      finishPlayback();
    };

    audio.onerror = (e) => {
      console.warn('Audio playback error:', e);
      finishPlayback();
    };

    await audio.play();
  } catch (err) {
    console.warn('Cloud TTS fallback issue, attempting browser audio proxy:', err);
    // Last resort streaming proxy
    const proxyUrl = `/api/voice/proxy-tts?text=${encodeURIComponent(text.slice(0, 200))}&lang=${langCode}`;
    const audio = new Audio(proxyUrl);
    activeAudioElement = audio;
    audio.onended = () => finishPlayback();
    audio.onerror = () => finishPlayback();
    await audio.play();
  }
}

/**
 * Pause active policy playback
 */
export function pausePolicySpeech(): void {
  if (!activeState.isPlaying || activeState.isPaused) return;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }

  if (activeAudioElement) {
    activeAudioElement.pause();
  }

  activeState.isPaused = true;
  notifyListeners();
}

/**
 * Resume paused policy playback
 */
export function resumePolicySpeech(): void {
  if (!activeState.isPlaying || !activeState.isPaused) return;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  if (activeAudioElement) {
    activeAudioElement.play().catch(console.warn);
  }

  activeState.isPaused = false;
  notifyListeners();
}

/**
 * Stop policy playback and reset state
 */
export function stopPolicySpeech(): void {
  clearKeepAlive();

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }

  currentUtterances = [];
  currentUtteranceIndex = 0;

  activeState = {
    ...activeState,
    isPlaying: false,
    isPaused: false,
    policyId: null,
    policyTitle: '',
    currentSentence: '',
    sentenceIndex: 0,
    totalSentences: 0,
  };

  notifyListeners();
}

/**
 * Internal cleanup when speech naturally finishes
 */
function finishPlayback() {
  clearKeepAlive();
  activeAudioElement = null;
  currentUtterances = [];
  currentUtteranceIndex = 0;

  const onEndCallback = currentOptions?.onEnd;
  currentOptions = null;

  activeState = {
    ...activeState,
    isPlaying: false,
    isPaused: false,
    policyId: null,
    policyTitle: '',
    currentSentence: '',
    sentenceIndex: 0,
    totalSentences: 0,
  };

  notifyListeners();
  onEndCallback?.();
}

/**
 * Change speech playback speed
 */
export function setPolicySpeechRate(newRate: number): void {
  activeState.rate = newRate;
  notifyListeners();

  // If currently speaking, restart current chunk with new rate
  if (activeState.isPlaying && currentOptions) {
    const remainingOptions = { ...currentOptions, rate: newRate };
    playPolicySpeech(remainingOptions);
  }
}
