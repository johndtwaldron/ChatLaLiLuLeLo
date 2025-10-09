/**
 * ElevenLabs TTS Engine Adapter
 * 
 * Production implementation of ElevenLabs API integration.
 * Configured for Col.nonAI.v1 voice with streaming support.
 */

import { VoiceEngine, VoiceChunk, SynthesizeOpts, VoiceEngineError, VoiceEngineNotReadyError, VoiceEngineNetworkError, COLONEL_VOICE_PRESETS } from '../VoiceEngine';

interface ElevenLabsTTSRequest {
  text: string;
  model_id?: string;
  voice_settings?: {
    stability: number; // 0-1
    similarity_boost: number; // 0-1
    style?: number; // 0-1
    use_speaker_boost?: boolean;
  };
}

/**
 * Maps Colonel voice presets to ElevenLabs voice configuration
 * Uses voice name lookup to find the actual voice ID
 */
const VOICE_PRESET_MAPPING: Record<string, { voiceName: string; settings: ElevenLabsTTSRequest['voice_settings'] }> = {
  'colonel-neutral': {
    voiceName: 'Col.nonAI.v1', // Your configured ElevenLabs voice name
    settings: { stability: 0.8, similarity_boost: 0.7, style: 0.6 }
  },
  'colonel-gravel': {
    voiceName: 'Col.nonAI.v1', // Same voice, more gravelly settings
    settings: { stability: 0.9, similarity_boost: 0.8, style: 0.8 }
  },
  'narrator': {
    voiceName: 'Col.nonAI.v1', // Same voice, clearer/neutral settings
    settings: { stability: 0.7, similarity_boost: 0.6, style: 0.3 }
  }
};

export class ElevenLabsTTSEngine implements VoiceEngine {
  readonly name = 'ElevenLabs TTS';
  readonly supportsStreaming = true; // ElevenLabs supports streaming
  
  private apiKey: string | null = null;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private initialized = false;
  private featureFlagEnabled = false; // Feature flag control

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
    
    // Check feature flag from environment
    this.featureFlagEnabled = process.env.ELEVENLABS_ENABLED === 'true';
    
    if (!this.featureFlagEnabled) {
      console.log('[VOICE] ElevenLabs engine is feature-flagged OFF');
    }
  }

  async initialize(): Promise<void> {
    if (!this.featureFlagEnabled) {
      throw new VoiceEngineError('ElevenLabs engine is disabled by feature flag', this.name, 'FEATURE_DISABLED');
    }

    if (this.initialized) return;

    // Get API key from environment if not provided
    if (!this.apiKey) {
      this.apiKey = process.env.ELEVENLABS_API_KEY || null;
    }

    console.log(`[VOICE] ElevenLabs API Key present: ${!!this.apiKey}`);
    console.log(`[VOICE] ElevenLabs API Key length: ${this.apiKey?.length || 0}`);

    if (!this.apiKey) {
      throw new VoiceEngineError('ElevenLabs API key not provided', this.name, 'MISSING_API_KEY');
    }

    // Validate API key by making a test request to get user info
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      
      if (!response.ok) {
        throw new VoiceEngineError(`ElevenLabs API key validation failed: ${response.status}`, this.name, 'INVALID_API_KEY');
      }
      
      const userInfo = await response.json();
      console.log(`[VOICE] ElevenLabs initialized for user: ${userInfo.subscription?.tier || 'free'} tier`);
      
    } catch (error) {
      console.error('[VOICE] ElevenLabs API key validation failed:', error);
      throw new VoiceEngineError(`ElevenLabs initialization failed: ${error}`, this.name, 'INITIALIZATION_FAILED');
    }
    
    this.initialized = true;
    console.log('[VOICE] ElevenLabs TTS engine initialized successfully');
  }

  isReady(): boolean {
    return this.featureFlagEnabled && this.initialized && !!this.apiKey;
  }

  getAvailableVoices(): string[] {
    return COLONEL_VOICE_PRESETS.map(preset => preset.id);
  }

  private async resolveVoiceSettings(opts?: SynthesizeOpts): Promise<{ voiceId: string; settings: ElevenLabsTTSRequest['voice_settings'] }> {
    const presetId = opts?.voiceId || 'colonel-neutral';
    
    const mapping = VOICE_PRESET_MAPPING[presetId] || VOICE_PRESET_MAPPING['colonel-neutral'];
    
    // Try to find the voice ID by name
    const voiceId = await this.findVoiceIdByName(mapping.voiceName);
    
    return {
      voiceId,
      settings: mapping.settings
    };
  }

  /**
   * Find voice ID by name from ElevenLabs API
   */
  private async findVoiceIdByName(voiceName: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey!,
        },
      });
      
      if (!response.ok) {
        console.warn(`[VOICE] Failed to fetch voices: ${response.status}`);
        // Fallback: try using the name as ID directly
        return voiceName;
      }
      
      const data = await response.json();
      const voice = data.voices?.find((v: any) => v.name === voiceName);
      
      if (voice) {
        console.log(`[VOICE] Found voice "${voiceName}" with ID: ${voice.voice_id}`);
        return voice.voice_id;
      } else {
        console.warn(`[VOICE] Voice "${voiceName}" not found, available voices:`, data.voices?.map((v: any) => v.name) || []);
        // Fallback: use first available voice or name as ID
        return data.voices?.[0]?.voice_id || voiceName;
      }
    } catch (error) {
      console.error('[VOICE] Voice lookup failed:', error);
      // Fallback: use name as ID
      return voiceName;
    }
  }

  async *synthesizeStream(text: string, opts?: SynthesizeOpts): AsyncIterable<VoiceChunk> {
    if (!this.featureFlagEnabled) {
      throw new VoiceEngineError('ElevenLabs engine is disabled by feature flag', this.name, 'FEATURE_DISABLED');
    }

    if (!this.isReady()) {
      throw new VoiceEngineNotReadyError(this.name);
    }

    const sanitizedText = this.sanitizeText(text);
    const voiceSettings = await this.resolveVoiceSettings(opts);
    
    console.log(`[VOICE] Synthesizing with ElevenLabs: "${sanitizedText.substring(0, 50)}..." using voice ${voiceSettings.voiceId}`);
    
    const request: ElevenLabsTTSRequest = {
      text: sanitizedText,
      model_id: 'eleven_monolingual_v1', // Use the stable model
      voice_settings: voiceSettings.settings
    };

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceSettings.voiceId}/stream`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey!,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[VOICE] ElevenLabs API error ${response.status}: ${errorText}`);
        throw new VoiceEngineError(`ElevenLabs API error: ${response.status} - ${errorText}`, this.name, 'API_ERROR');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new VoiceEngineError('No response body from ElevenLabs API', this.name, 'NO_RESPONSE_BODY');
      }

      console.log('[VOICE] Starting ElevenLabs audio stream...');
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[VOICE] ElevenLabs stream completed');
            break;
          }
          
          if (value && value.length > 0) {
            yield value.buffer as VoiceChunk;
          }
        }
      } finally {
        reader.releaseLock();
      }
      
    } catch (error) {
      console.error('[VOICE] ElevenLabs synthesis error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new VoiceEngineNetworkError(this.name, error);
      } else if (error instanceof VoiceEngineError) {
        throw error;
      } else {
        throw new VoiceEngineError(`ElevenLabs synthesis failed: ${error}`, this.name, 'SYNTHESIS_ERROR');
      }
    }
  }

  private sanitizeText(text: string): string {
    // TODO: Implement ElevenLabs-specific text sanitization
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 5000); // ElevenLabs character limit
  }

  async cleanup(): Promise<void> {
    this.initialized = false;
    console.log('[VOICE] ElevenLabs TTS engine cleaned up');
  }
}
