/**
 * OpenAI TTS Engine Adapter
 * 
 * Provides TTS synthesis using OpenAI's API with Colonel-style voice presets.
 * This is a non-streaming implementation that synthesizes complete audio.
 */

import { VoiceEngine, VoiceChunk, SynthesizeOpts, VoiceEngineError, VoiceEngineNotReadyError, VoiceEngineNetworkError, COLONEL_VOICE_PRESETS } from '../VoiceEngine';

interface OpenAITTSRequest {
  model: 'tts-1' | 'tts-1-hd';
  input: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
  speed?: number; // 0.25 to 4.0
}

/**
 * Maps Colonel voice presets to OpenAI voices with appropriate characteristics
 */
const VOICE_PRESET_MAPPING: Record<string, { voice: OpenAITTSRequest['voice']; speed: number }> = {
  'colonel-neutral': { voice: 'onyx', speed: 0.9 }, // Deep, authoritative male voice
  'colonel-gravel': { voice: 'echo', speed: 0.85 }, // Gravelly, commanding tone
  'narrator': { voice: 'alloy', speed: 1.0 }, // Clear, neutral briefing voice
  'default-male-authoritative': { voice: 'onyx', speed: 0.9 },
  'default-male-deep': { voice: 'echo', speed: 0.85 },
  'default-male-clear': { voice: 'alloy', speed: 1.0 },
};

export class OpenAITTSEngine implements VoiceEngine {
  readonly name = 'OpenAI TTS';
  readonly supportsStreaming = false; // OpenAI TTS doesn't support streaming yet
  
  private apiKey: string | null = null;
  private baseUrl = 'https://api.openai.com/v1';
  private initialized = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Get API key from environment if not provided
    if (!this.apiKey) {
      this.apiKey = process.env.OPENAI_API_KEY || null;
    }

    if (!this.apiKey) {
      throw new VoiceEngineError('OpenAI API key not provided', this.name, 'MISSING_API_KEY');
    }

    // Test API key by making a minimal request
    try {
      await this.testConnection();
      this.initialized = true;
      console.log('[VOICE] OpenAI TTS engine initialized successfully');
    } catch (error) {
      throw new VoiceEngineError(`Failed to initialize OpenAI TTS: ${error}`, this.name, 'INIT_FAILED');
    }
  }

  private async testConnection(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: 'test',
        voice: 'alloy',
        response_format: 'mp3'
      } as OpenAITTSRequest),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    }
  }

  isReady(): boolean {
    return this.initialized && !!this.apiKey;
  }

  getAvailableVoices(): string[] {
    return COLONEL_VOICE_PRESETS.map(preset => preset.id);
  }

  private resolveVoiceSettings(opts?: SynthesizeOpts): { voice: OpenAITTSRequest['voice']; speed: number } {
    const presetId = opts?.voiceId || 'colonel-neutral';
    
    // Check if it's a Colonel preset
    const preset = COLONEL_VOICE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      const mapping = VOICE_PRESET_MAPPING[preset.id];
      if (mapping) {
        return {
          voice: mapping.voice,
          speed: opts?.speed || mapping.speed
        };
      }
    }

    // Direct OpenAI voice mapping
    const directMapping = VOICE_PRESET_MAPPING[presetId];
    if (directMapping) {
      return {
        voice: directMapping.voice,
        speed: opts?.speed || directMapping.speed
      };
    }

    // Default fallback
    return {
      voice: 'onyx', // Colonel-like deep voice
      speed: opts?.speed || 0.9
    };
  }

  async *synthesizeStream(text: string, opts?: SynthesizeOpts): AsyncIterable<VoiceChunk> {
    if (!this.isReady()) {
      throw new VoiceEngineNotReadyError(this.name);
    }

    // Sanitize and prepare text
    const sanitizedText = this.sanitizeText(text);
    if (!sanitizedText.trim()) {
      console.warn('[VOICE] Empty text after sanitization, skipping synthesis');
      return;
    }

    // Resolve voice settings
    const voiceSettings = this.resolveVoiceSettings(opts);
    
    // Clamp speed to OpenAI's supported range
    const speed = Math.max(0.25, Math.min(4.0, voiceSettings.speed));

    const request: OpenAITTSRequest = {
      model: 'tts-1', // Use faster model for real-time experience
      input: sanitizedText,
      voice: voiceSettings.voice,
      response_format: 'mp3', // Good balance of quality and compatibility
      speed: speed
    };

    try {
      console.log(`[VOICE] Synthesizing with OpenAI: voice=${request.voice}, speed=${request.speed}, text="${sanitizedText.substring(0, 50)}..."`);
      
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VOICE] OpenAI API error:', response.status, errorText);
        
        if (response.status === 429) {
          throw new VoiceEngineError('Rate limit exceeded', this.name, 'RATE_LIMITED');
        } else if (response.status === 401) {
          throw new VoiceEngineError('Invalid API key', this.name, 'INVALID_KEY');
        } else {
          throw new VoiceEngineError(`API error: ${response.status}`, this.name, 'API_ERROR');
        }
      }

      // Get the audio data as ArrayBuffer
      const audioBuffer = await response.arrayBuffer();
      
      console.log(`[VOICE] OpenAI synthesis complete: ${audioBuffer.byteLength} bytes`);
      
      // Yield the complete audio as a single chunk
      yield audioBuffer;
      
    } catch (error) {
      console.error('[VOICE] OpenAI synthesis error:', error);
      
      if (error instanceof VoiceEngineError) {
        throw error;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new VoiceEngineNetworkError(this.name, error);
      } else {
        throw new VoiceEngineError(`Synthesis failed: ${error}`, this.name, 'SYNTHESIS_ERROR');
      }
    }
  }

  private sanitizeText(text: string): string {
    // Multi-pass HTML/SSML tag stripping to handle nested fragments
    let sanitized = text;
    let prev: string;
    do {
      prev = sanitized;
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    } while (sanitized !== prev);

    return sanitized
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()-]/g, '') // Remove unusual characters
      .trim()
      .substring(0, 4000); // OpenAI has a 4096 character limit
  }

  async cleanup(): Promise<void> {
    this.initialized = false;
    console.log('[VOICE] OpenAI TTS engine cleaned up');
  }
}
