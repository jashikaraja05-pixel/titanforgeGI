/**
 * Unified Speech Synthesis Singleton Manager
 * 
 * Enforces strictly SINGLE-VOICE output across all application components.
 * Immediately terminates and cancels any active audio element, browser
 * speech synthesis utterance, or Web Audio stream before launching a new stream.
 * Employs a monotonic playback token to prevent race conditions from async fetches.
 */

export interface UnifiedSpeakOptions {
  text: string;
  langCode?: string;
  voiceName?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

const BCP_LOCALE_MAP: Record<string, string> = {
  ta: 'ta-IN',
  hi: 'hi-IN',
  ml: 'ml-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  en: 'en-US',
  'en-gb': 'en-GB',
  es: 'es-ES',
  pt: 'pt-BR',
  ru: 'ru-RU',
  zh: 'zh-CN',
};

class SpeechSynthesisManager {
  private static instance: SpeechSynthesisManager | null = null;
  private currentPlaybackId: number = 0;
  private activeAudioElement: HTMLAudioElement | null = null;
  private activeAudioContext: AudioContext | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingActive: boolean = false;
  private stopListeners: Array<() => void> = [];

  private constructor() {
    // Initialized as browser singleton
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.stopAll());
    }
  }

  public static getInstance(): SpeechSynthesisManager {
    if (!SpeechSynthesisManager.instance) {
      SpeechSynthesisManager.instance = new SpeechSynthesisManager();
    }
    return SpeechSynthesisManager.instance;
  }

  /**
   * Register external audio streamer abort callback (e.g. Gemini Live session)
   */
  public registerExternalStopper(stopper: () => void): () => void {
    this.stopListeners.push(stopper);
    return () => {
      this.stopListeners = this.stopListeners.filter((s) => s !== stopper);
    };
  }

  /**
   * Terminate any active speech stream before starting a new one.
   * Increments the token so any pending promises from prior calls discard results.
   */
  public stopAll(): void {
    this.currentPlaybackId++;
    this.isSpeakingActive = false;

    // 1. Abort any registered external stream listeners
    this.stopListeners.forEach((stopFn) => {
      try {
        stopFn();
      } catch (e) {
        console.warn('External audio stop error:', e);
      }
    });

    // 2. Stop HTML5 Audio Element
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
        this.activeAudioElement.currentTime = 0;
        this.activeAudioElement.src = '';
        this.activeAudioElement.load();
      } catch (e) {
        // ignore
      }
      this.activeAudioElement = null;
    }

    // 3. Close AudioContext if used
    if (this.activeAudioContext) {
      try {
        this.activeAudioContext.close();
      } catch (e) {
        // ignore
      }
      this.activeAudioContext = null;
    }

    // 4. Cancel Browser SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
      this.activeUtterance = null;
    }
  }

  /**
   * Speak strictly with a SINGLE voice.
   */
  public async speak(options: UnifiedSpeakOptions): Promise<void> {
    const cleanText = (options.text || '').trim();
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    // Terminate existing speech streams immediately
    this.stopAll();

    // Acquire unique token for this invocation
    const playbackId = ++this.currentPlaybackId;
    const lang = (options.langCode || 'ta').toLowerCase();
    const bcp = BCP_LOCALE_MAP[lang] || 'ta-IN';

    this.isSpeakingActive = true;

    const notifyStart = () => {
      if (this.currentPlaybackId === playbackId) {
        options.onStart?.();
      }
    };

    const notifyEnd = () => {
      if (this.currentPlaybackId === playbackId) {
        this.isSpeakingActive = false;
        options.onEnd?.();
      }
    };

    // Strategy 1: High-fidelity Server-side Gemini / Regional TTS Proxy
    // Delivers fluent natural pronunciation for Tamil, Malayalam, Hindi, Telugu, Kannada
    if (['ta', 'hi', 'ml', 'te', 'kn', 'en'].includes(lang)) {
      try {
        const response = await fetch('/api/voice/gemini-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            lang,
            voice: options.voiceName || 'Kore',
          }),
        });

        // Check if token changed while waiting for network
        if (this.currentPlaybackId !== playbackId) return;

        if (response.ok) {
          const data = await response.json();
          if (data?.audioUrl && this.currentPlaybackId === playbackId) {
            this.playAudioUrl(data.audioUrl, playbackId, notifyStart, notifyEnd);
            return;
          }
        }
      } catch (fetchErr) {
        console.warn('Unified TTS network attempt error, proceeding to browser synthesis:', fetchErr);
      }
    }

    // Check if token changed
    if (this.currentPlaybackId !== playbackId) return;

    // Strategy 2: Browser Web Speech API strictly with matching native voice
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        const nativeVoice = this.findMatchingNativeVoice(lang, bcp);

        if (nativeVoice && this.currentPlaybackId === playbackId) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.voice = nativeVoice;
          utterance.lang = nativeVoice.lang || bcp;
          utterance.rate = options.rate ?? 0.95;
          utterance.pitch = options.pitch ?? 1.0;

          utterance.onstart = () => {
            if (this.currentPlaybackId === playbackId) {
              notifyStart();
            } else {
              window.speechSynthesis.cancel();
            }
          };

          utterance.onend = () => {
            if (this.currentPlaybackId === playbackId) {
              this.activeUtterance = null;
              notifyEnd();
            }
          };

          utterance.onerror = (e) => {
            if (this.currentPlaybackId === playbackId) {
              this.activeUtterance = null;
              // Fallback to proxy stream
              this.fallbackToProxyStream(cleanText, lang, playbackId, notifyStart, notifyEnd);
            }
          };

          this.activeUtterance = utterance;
          window.speechSynthesis.speak(utterance);
          return;
        }
      } catch (speechErr) {
        console.warn('Native browser synthesis error:', speechErr);
      }
    }

    // Strategy 3: Streaming TTS proxy fallback
    if (this.currentPlaybackId === playbackId) {
      this.fallbackToProxyStream(cleanText, lang, playbackId, notifyStart, notifyEnd);
    }
  }

  private fallbackToProxyStream(
    cleanText: string,
    lang: string,
    playbackId: number,
    onStart: () => void,
    onEnd: () => void
  ): void {
    const proxyUrl = `/api/voice/proxy-tts?text=${encodeURIComponent(
      cleanText.slice(0, 300)
    )}&lang=${lang}`;
    this.playAudioUrl(proxyUrl, playbackId, onStart, onEnd);
  }

  private playAudioUrl(
    url: string,
    playbackId: number,
    onStart: () => void,
    onEnd: () => void
  ): void {
    if (this.currentPlaybackId !== playbackId) return;

    try {
      const audio = new Audio(url);
      this.activeAudioElement = audio;

      audio.onplay = () => {
        if (this.currentPlaybackId === playbackId) {
          onStart();
        } else {
          audio.pause();
          audio.src = '';
        }
      };

      audio.onended = () => {
        if (this.currentPlaybackId === playbackId) {
          this.activeAudioElement = null;
          onEnd();
        }
      };

      audio.onerror = () => {
        if (this.currentPlaybackId === playbackId) {
          this.activeAudioElement = null;
          onEnd();
        }
      };

      audio.play().catch(() => {
        if (this.currentPlaybackId === playbackId) {
          this.activeAudioElement = null;
          onEnd();
        }
      });
    } catch {
      if (this.currentPlaybackId === playbackId) {
        onEnd();
      }
    }
  }

  private findMatchingNativeVoice(langCode: string, bcp: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (langCode === 'ta') {
      return (
        voices.find((v) => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return (
            (l.startsWith('ta') || n.includes('tamil') || n.includes('தமிழ்')) &&
            !n.includes('english')
          );
        }) || null
      );
    }

    if (langCode === 'hi') {
      return (
        voices.find((v) => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return (
            (l.startsWith('hi') || n.includes('hindi') || n.includes('हिन्दी')) &&
            !n.includes('english')
          );
        }) || null
      );
    }

    if (langCode === 'en') {
      return (
        voices.find((v) => {
          const l = v.lang.toLowerCase();
          return l.startsWith('en') || l === bcp.toLowerCase();
        }) || null
      );
    }

    return (
      voices.find((v) => v.lang.toLowerCase().startsWith(langCode)) || null
    );
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      this.isSpeakingActive ||
      Boolean(this.activeAudioElement && !this.activeAudioElement.paused) ||
      ('speechSynthesis' in window && window.speechSynthesis.speaking)
    );
  }
}

// Export singleton instance and utility methods
export const speechSynthesisManager = SpeechSynthesisManager.getInstance();

export function speakSingleVoice(
  text: string,
  langCode: string = 'ta',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): Promise<void> {
  return speechSynthesisManager.speak({
    text,
    langCode,
    onStart,
    onEnd,
    onError,
  });
}

export function stopSingleVoice(): void {
  speechSynthesisManager.stopAll();
}

export function isSingleVoiceSpeaking(): boolean {
  return speechSynthesisManager.isSpeaking();
}
