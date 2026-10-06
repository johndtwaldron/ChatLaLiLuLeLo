/**
 * Voice Service Integration
 * 
 * High-level service that integrates TTS engines with audio mixing
 * and provides a simple interface for text-to-speech functionality.
 */

import { AudioMixer } from './AudioMixer';
import { getVoiceEngine, initializeVoice, getVoiceConfig, isVoiceReady } from './index';
import { validateTTSInput } from './VoiceSecurity';
import { VoiceChunk } from './VoiceEngine';

export interface VoiceSynthesisOptions {
  /** Voice preset to use (default: from config) */
  voicePreset?: string;
  /** Speech speed multiplier */
  speed?: number;
  /** Enable autoplay after synthesis */
  autoplay?: boolean;
  /** Priority for playback queue */
  priority?: 'low' | 'normal' | 'high';
  /** Callbacks */
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface CodecSFXOptions {
  /** Volume override (0-1) */
  volume?: number;
  /** SFX identifier for tracking */
  id?: string;
  /** Completion callback */
  onComplete?: () => void;
}

class VoiceServiceManager {
  private audioMixer: AudioMixer | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the voice service system
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize voice engine system
      await initializeVoice();

      // Get current voice config
      const config = getVoiceConfig();

      // Initialize audio mixer with current volume settings
      this.audioMixer = new AudioMixer({
        ttsVolume: config.volume,
        masterVolume: 1.0, // Keep master at full, control through ttsVolume
        sfxVolume: 0.6,
        enableDucking: true,
        duckingLevel: 0.3,
        maxQueueSize: 10
      });
      await this.audioMixer.initialize();

      this.initialized = true;

    } catch (error) {
      console.error('[VOICE SERVICE] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Update AudioMixer volume settings from VoiceConfig
   */
  updateAudioMixerVolume(): void {
    if (!this.audioMixer) return;
    
    const config = getVoiceConfig();
    const currentVolume = config.volume;
    
    // Update AudioMixer TTS volume
    this.audioMixer.updateConfig({
      ttsVolume: currentVolume
    });
  }

  /**
   * Synthesize and optionally play text
   */
  async synthesizeText(
    text: string, 
    options?: VoiceSynthesisOptions
  ): Promise<string | null> {
    try {
      await this.initialize();

      if (!this.audioMixer || !isVoiceReady()) {
        return null;
      }

      const config = getVoiceConfig();
      if (!config.enabled) {
        return null;
      }
      
      // Ensure AudioMixer has current volume settings
      this.updateAudioMixerVolume();

      // Get voice engine
      const engine = getVoiceEngine();
      if (!engine) {
        console.error('[VOICE SERVICE] No voice engine available');
        return null;
      }

      // Security validation
      const securityResult = validateTTSInput(text, {
        allowSSML: false, // Keep SSML disabled for security
        engineSpecific: config.engine
      });

      if (!securityResult.isValid) {
        console.error('[VOICE SERVICE] Text failed security validation:', securityResult.errorMessage);
        options?.onError?.(new Error(securityResult.errorMessage || 'Text validation failed'));
        return null;
      }

      // Prepare synthesis options
      const voicePreset = options?.voicePreset || config.voicePreset;
      const synthesisOpts = {
        voiceId: voicePreset,
        speed: options?.speed,
      };

      // Collect audio chunks
      const audioChunks: VoiceChunk[] = [];
      for await (const chunk of engine.synthesizeStream(securityResult.sanitizedText, synthesisOpts)) {
        audioChunks.push(chunk);
      }

      if (audioChunks.length === 0) {
        return null;
      }

      // Queue for playback if autoplay is enabled or explicitly requested
      const shouldAutoplay = options?.autoplay ?? config.autoplayReplies;
      
      if (shouldAutoplay) {
        return await this.audioMixer.queueTTS(
          securityResult.sanitizedText,
          audioChunks,
          {
            priority: options?.priority || 'normal',
            onStart: options?.onStart,
            onComplete: options?.onComplete,
            onError: options?.onError
          }
        );
      } else {
        // Just return a synthetic ID for manual playback later
        return `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

    } catch (error) {
      console.error('[VOICE SERVICE] Synthesis failed:', error);
      
      // Trigger voice error display in UI if available
      if (typeof (globalThis as any).__voiceErrorHandler === 'function') {
        const errorMessage = error instanceof Error ? error.message : String(error);
        (globalThis as any).__voiceErrorHandler(errorMessage);
      }
      
      options?.onError?.(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Play codec sound effects
   */
  async playCodecSFX(
    sfxType: 'open' | 'close' | 'alert' | 'beep',
    options?: CodecSFXOptions
  ): Promise<void> {
    try {
      await this.initialize();

      if (!this.audioMixer) {
        return;
      }

      const config = getVoiceConfig();
      if (!config.enableSFX) {
        return;
      }

      // Map SFX types to audio files (these would need to be loaded)
      // For now, we'll use placeholder data
      const sfxAudioMap: Record<string, ArrayBuffer> = {
        // These would be loaded from existing codec audio assets
        // 'open': codecOpenAudioBuffer,
        // 'close': codecCloseAudioBuffer,
        // 'alert': alertAudioBuffer,
        // 'beep': beepAudioBuffer,
      };

      const audioBuffer = sfxAudioMap[sfxType];
      if (!audioBuffer) {
        return;
      }

      await this.audioMixer.playSFX(audioBuffer, {
        volume: options?.volume,
        id: options?.id || `codec-${sfxType}-${Date.now()}`,
        onComplete: options?.onComplete
      });

    } catch (error) {
      console.error(`[VOICE SERVICE] Failed to play SFX ${sfxType}:`, error);
    }
  }

  /**
   * Process message for potential TTS based on content and config
   */
  async processMessageForTTS(
    text: string,
    messageType: 'user' | 'ai' | 'system' = 'ai',
    options?: VoiceSynthesisOptions
  ): Promise<void> {
    const config = getVoiceConfig();
    
    // Only auto-synthesize AI messages by default
    if (messageType !== 'ai' && !options?.autoplay) {
      return;
    }

    // Skip if autoplay is disabled and not explicitly requested
    if (!config.autoplayReplies && !options?.autoplay) {
      return;
    }

    // Play codec open sound for AI messages if SFX enabled
    if (messageType === 'ai' && config.enableSFX) {
      await this.playCodecSFX('open');
    }

    // Synthesize the message
    await this.synthesizeText(text, {
      ...options,
      autoplay: true,
      onComplete: () => {
        // Play codec close sound after AI message completes
        if (messageType === 'ai' && config.enableSFX) {
          this.playCodecSFX('close');
        }
        options?.onComplete?.();
      }
    });

    // Play alert sound for messages ending with exclamation
    if (text.trim().endsWith('!') && config.enableSFX) {
      setTimeout(() => this.playCodecSFX('alert'), 500);
    }
  }

  /**
   * Clear voice queue and stop playback
   */
  async clearQueue(): Promise<void> {
    if (this.audioMixer) {
      this.audioMixer.clearTTSQueue();
    }
  }

  /**
   * Stop all audio (TTS and SFX)
   */
  async stopAll(): Promise<void> {
    if (this.audioMixer) {
      this.audioMixer.clearTTSQueue();
      this.audioMixer.stopAllSFX();
    }
  }

  /**
   * Get the internal AudioMixer for direct access (e.g., for iOS audio unlock)
   */
  getAudioMixer(): AudioMixer | null {
    return this.audioMixer;
  }

  /**
   * Check if TTS audio is currently playing
   */
  isAudioPlaying(): boolean {
    const mixerStatus = this.audioMixer?.getStatus();
    return mixerStatus ? mixerStatus.isTTSPlaying : false;
  }

  /**
   * Get current voice service status
   */
  getStatus(): {
    initialized: boolean;
    voiceReady: boolean;
    voiceEnabled: boolean;
    isPlaying: boolean;
    audioMixer: any;
    engineInfo: any;
  } {
    const config = getVoiceConfig();
    
    return {
      initialized: this.initialized,
      voiceReady: isVoiceReady(),
      voiceEnabled: config.enabled,
      isPlaying: this.isAudioPlaying(),
      audioMixer: this.audioMixer?.getStatus() || null,
      engineInfo: {
        // Would include engine-specific status
      }
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.audioMixer) {
      await this.audioMixer.cleanup();
      this.audioMixer = null;
    }

    this.initialized = false;
    this.initializationPromise = null;
  }
}

// Singleton instance
export const voiceService = new VoiceServiceManager();

// Convenience exports
export const synthesizeText = (text: string, options?: VoiceSynthesisOptions) => 
  voiceService.synthesizeText(text, options);

export const processMessageForTTS = (text: string, messageType?: 'user' | 'ai' | 'system', options?: VoiceSynthesisOptions) =>
  voiceService.processMessageForTTS(text, messageType, options);

export const playCodecSFX = (sfxType: 'open' | 'close' | 'alert' | 'beep', options?: CodecSFXOptions) =>
  voiceService.playCodecSFX(sfxType, options);

export const clearVoiceQueue = () => voiceService.clearQueue();
export const stopAllVoice = () => voiceService.stopAll();
export const getVoiceServiceStatus = () => voiceService.getStatus();
export const initializeVoiceService = () => voiceService.initialize();
export const updateVoiceServiceVolume = () => voiceService.updateAudioMixerVolume();
