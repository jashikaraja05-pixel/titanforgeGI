// Gemini Live API (gemini-3.8-live) Client-Side Real-Time Voice Conversation Service

export interface LiveVoiceCallbacks {
  onConnected?: () => void;
  onTextChunk?: (text: string) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onError?: (err: string) => void;
  onClose?: () => void;
  onInterrupted?: () => void;
}

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isRunning: boolean = false;
  private audioQueue: ArrayBuffer[] = [];
  private isPlayingQueue: boolean = false;
  private callbacks: LiveVoiceCallbacks;

  constructor(callbacks: LiveVoiceCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.callbacks.onConnected?.();
        this.startMic();
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.connected) {
            this.callbacks.onConnected?.();
          }

          if (msg.text) {
            this.callbacks.onTextChunk?.(msg.text);
          }

          if (msg.audio) {
            this.playAudioChunk(msg.audio);
          }

          if (msg.interrupted) {
            this.audioQueue = [];
            this.callbacks.onInterrupted?.();
          }

          if (msg.error) {
            this.callbacks.onError?.(msg.error);
          }
        } catch (e) {
          // ignore parsing error
        }
      };

      this.ws.onerror = (e) => {
        console.warn('Live WebSocket error:', e);
        this.callbacks.onError?.('Live session connection error');
      };

      this.ws.onclose = () => {
        this.callbacks.onClose?.();
        this.stop();
      };
    } catch (err: any) {
      console.warn('Failed to start Live session:', err);
      this.callbacks.onError?.(err?.message || 'Could not connect to Live API');
      this.stop();
    }
  }

  private async startMic(): Promise<void> {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.source = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isRunning || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const floatData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const int16Buffer = new Int16Array(floatData.length);
        for (let i = 0; i < floatData.length; i++) {
          const s = Math.max(-1, Math.min(1, floatData[i]));
          int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert to base64
        const uint8 = new Uint8Array(int16Buffer.buffer);
        let binary = '';
        for (let i = 0; i < uint8.byteLength; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64Audio = btoa(binary);

        this.ws.send(
          JSON.stringify({
            audio: base64Audio,
            mimeType: 'audio/pcm;rate=16000',
          })
        );
      };

      this.source.connect(this.processor);
      this.processor.connect(this.inputAudioCtx.destination);
    } catch (err: any) {
      console.warn('Mic access error in Live session:', err);
      this.callbacks.onError?.('Microphone access denied or unavailable');
    }
  }

  private playAudioChunk(base64Audio: string): void {
    if (!this.outputAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
    }

    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM 16-bit 24kHz to AudioBuffer
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const sourceNode = this.outputAudioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.outputAudioCtx.destination);

      this.callbacks.onAudioStart?.();
      sourceNode.onended = () => {
        this.callbacks.onAudioEnd?.();
      };

      sourceNode.start();
    } catch (err) {
      console.warn('Failed to decode/play Live audio chunk:', err);
    }
  }

  public sendTextMessage(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  public stop(): void {
    this.isRunning = false;

    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch {}
      this.processor = null;
    }

    if (this.source) {
      try {
        this.source.disconnect();
      } catch {}
      this.source = null;
    }

    if (this.micStream) {
      try {
        this.micStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.micStream = null;
    }

    if (this.inputAudioCtx) {
      try {
        this.inputAudioCtx.close();
      } catch {}
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      try {
        this.outputAudioCtx.close();
      } catch {}
      this.outputAudioCtx = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}
