/**
 * Voice Engine Resolver
 * 
 * Chooses and initializes the appropriate TTS engine based on environment
 * configuration and availability. Provides graceful fallback when engines fail.
 */

import { VoiceEngine, VoiceEngineError, COLONEL_VOICE_PRESETS } from './VoiceEngine';
import { OpenAITTSEngine } from './engines/openai';
import { ElevenLabsTTSEngine } from './engines/elevenlabs';
import { CoquiLocalTTSEngine } from './engines/coquiLocal';

export type VoiceEngineType = 'openai' | 'elevenlabs' | 'coqui' | 'disabled';

export interface VoiceConfig {
  enabled: boolean;
  engine: VoiceEngineType;
  autoplayReplies: boolean;
  volume: number; // 0-1
  voicePreset: string;
  enableSFX: boolean; // Enable codec sound effects
}

/**
 * Safe default configuration - voice disabled by default
 */
const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  enabled: false,
  engine: 'disabled',
  autoplayReplies: false,
  volume: 0.7,
  voicePreset: 'colonel-neutral',
  enableSFX: true
};

class VoiceService {
  private currentEngine: VoiceEngine | null = null;
  private config: VoiceConfig = { ...DEFAULT_VOICE_CONFIG };
  private initialized = false;
  private initializationAttempted = false;

  constructor() {
    this.loadConfig();
  }

  /**
   * Load voice configuration from environment and apply safe defaults
   */
  private loadConfig(): void {
    try {
      console.log('[VOICE] DEBUG: Environment variables check:');
      console.log('  VOICE_ENABLED:', process.env.VOICE_ENABLED);
      console.log('  VOICE_ENGINE:', process.env.VOICE_ENGINE);
      console.log('  ELEVENLABS_ENABLED:', process.env.ELEVENLABS_ENABLED);
      console.log('  ELEVENLABS_API_KEY present:', !!process.env.ELEVENLABS_API_KEY);
      console.log('  ELEVENLABS_API_KEY length:', process.env.ELEVENLABS_API_KEY?.length || 0);
      console.log('  OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
      console.log('  VOICE_AUTOPLAY:', process.env.VOICE_AUTOPLAY);
      
      // Check if voice is globally disabled (safe default)
      const voiceEnabled = process.env.VOICE_ENABLED === 'true';
      
      // Force disable on web preview environments unless explicitly enabled
      const isWebPreview = typeof window !== 'undefined' && (
        window.location.hostname.includes('vercel.app') ||
        window.location.hostname.includes('netlify.app') ||
        window.location.hostname.includes('github.io') ||
        process.env.NODE_ENV === 'preview'
      );
      
      if (isWebPreview && process.env.PAGES_VOICE_ENABLE !== '1') {
        console.log('[VOICE] Voice disabled on web preview deployment');
        this.config = {
          ...DEFAULT_VOICE_CONFIG,
          enabled: false,
          engine: 'disabled'
        };
        return;
      }

      // Determine engine preference with fallback
      let enginePreference: VoiceEngineType = 'disabled';
      
      if (voiceEnabled) {
        const configuredEngine = process.env.VOICE_ENGINE as VoiceEngineType;
        
        switch (configuredEngine) {
          case 'openai':
            enginePreference = process.env.OPENAI_API_KEY ? 'openai' : 'disabled';
            break;
          case 'elevenlabs':
            enginePreference = (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_ENABLED === 'true') 
              ? 'elevenlabs' : 'disabled';
            break;
          case 'coqui':
            enginePreference = process.env.COQUI_ENABLED === 'true' ? 'coqui' : 'disabled';
            break;
          default:
            // Auto-detect available engine
            if (process.env.OPENAI_API_KEY) {
              enginePreference = 'openai';
            } else if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_ENABLED === 'true') {
              enginePreference = 'elevenlabs';
            } else if (process.env.COQUI_ENABLED === 'true') {
              enginePreference = 'coqui';
            }
        }
      }

      this.config = {
        enabled: voiceEnabled && enginePreference !== 'disabled',
        engine: enginePreference,
        autoplayReplies: process.env.VOICE_AUTOPLAY === 'true',
        volume: this.parseFloat(process.env.VOICE_VOLUME, DEFAULT_VOICE_CONFIG.volume),
        voicePreset: process.env.VOICE_PRESET || DEFAULT_VOICE_CONFIG.voicePreset,
        enableSFX: process.env.VOICE_SFX !== 'false' // Default enabled
      };

      console.log('[VOICE] Configuration loaded:', {
        enabled: this.config.enabled,
        engine: this.config.engine,
        voicePreset: this.config.voicePreset
      });

    } catch (error) {
      console.error('[VOICE] Failed to load configuration, using defaults:', error);
      this.config = { ...DEFAULT_VOICE_CONFIG };
    }
  }

  private parseFloat(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : Math.max(0, Math.min(1, parsed));
  }

  /**
   * Initialize the voice service and selected engine
   */
  async initialize(): Promise<void> {
    if (this.initialized || this.initializationAttempted) return;
    
    this.initializationAttempted = true;

    if (!this.config.enabled || this.config.engine === 'disabled') {
      console.log('[VOICE] Voice service disabled by configuration');
      return;
    }

    try {
      this.currentEngine = await this.createEngine(this.config.engine);
      
      if (this.currentEngine) {
        await this.currentEngine.initialize?.();
        this.initialized = true;
        console.log(`[VOICE] Service initialized with engine: ${this.currentEngine.name}`);
      }
    } catch (error) {
      console.error(`[VOICE] Failed to initialize ${this.config.engine} engine:`, error);
      
      // Try fallback engines
      await this.tryFallbackEngines();
    }
  }

  /**
   * Try fallback engines in order of preference
   */
  private async tryFallbackEngines(): Promise<void> {
    const fallbackOrder: VoiceEngineType[] = ['openai', 'elevenlabs', 'coqui'];
    
    for (const engineType of fallbackOrder) {
      if (engineType === this.config.engine) continue; // Skip already failed engine
      
      try {
        console.log(`[VOICE] Trying fallback engine: ${engineType}`);
        
        const engine = await this.createEngine(engineType);
        if (engine) {
          await engine.initialize?.();
          this.currentEngine = engine;
          this.config.engine = engineType;
          this.initialized = true;
          console.log(`[VOICE] Successfully fell back to: ${engine.name}`);
          return;
        }
      } catch (error) {
        console.warn(`[VOICE] Fallback engine ${engineType} failed:`, error);
      }
    }
    
    console.warn('[VOICE] All engines failed, voice will be unavailable');
  }

  /**
   * Create engine instance based on type
   */
  private async createEngine(engineType: VoiceEngineType): Promise<VoiceEngine | null> {
    switch (engineType) {
      case 'openai':
        if (process.env.OPENAI_API_KEY) {
          return new OpenAITTSEngine();
        }
        break;
      
      case 'elevenlabs':
        if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_ENABLED === 'true') {
          return new ElevenLabsTTSEngine();
        }
        break;
      
      case 'coqui':
        if (process.env.COQUI_ENABLED === 'true') {
          return new CoquiLocalTTSEngine();
        }
        break;
      
      case 'disabled':
      default:
        return null;
    }
    
    return null;
  }

  /**
   * Check if voice service is ready to synthesize
   */
  isReady(): boolean {
    return this.initialized && this.currentEngine?.isReady?.() === true;
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  /**
   * Update voice configuration
   */
  updateConfig(updates: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('[VOICE] Configuration updated:', updates);
  }

  /**
   * Get available voice presets
   */
  getAvailablePresets(): typeof COLONEL_VOICE_PRESETS {
    return COLONEL_VOICE_PRESETS;
  }

  /**
   * Get current engine info
   */
  getCurrentEngine(): { name: string; supportsStreaming: boolean } | null {
    if (!this.currentEngine) return null;
    
    return {
      name: this.currentEngine.name,
      supportsStreaming: this.currentEngine.supportsStreaming
    };
  }

  /**
   * Get the current engine instance for synthesis
   */
  getEngine(): VoiceEngine | null {
    return this.currentEngine;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.currentEngine) {
      await this.currentEngine.cleanup?.();
      this.currentEngine = null;
    }
    this.initialized = false;
    this.initializationAttempted = false;
    console.log('[VOICE] Service cleaned up');
  }

  /**
   * Health check for current engine
   */
  async healthCheck(): Promise<{ healthy: boolean; engine: string | null; error?: string }> {
    if (!this.initialized || !this.currentEngine) {
      return { healthy: false, engine: null, error: 'Not initialized' };
    }

    try {
      const isReady = this.currentEngine.isReady?.() ?? true;
      return {
        healthy: isReady,
        engine: this.currentEngine.name,
        error: isReady ? undefined : 'Engine not ready'
      };
    } catch (error) {
      return {
        healthy: false,
        engine: this.currentEngine.name,
        error: String(error)
      };
    }
  }
}

// Singleton instance
export const voiceService = new VoiceService();

// Convenience functions
export const initializeVoice = () => voiceService.initialize();
export const getVoiceConfig = () => voiceService.getConfig();
export const updateVoiceConfig = (updates: Partial<VoiceConfig>) => voiceService.updateConfig(updates);
export const isVoiceReady = () => voiceService.isReady();
export const getVoiceEngine = () => voiceService.getEngine();
export const getCurrentVoiceEngine = () => voiceService.getCurrentEngine();
export const getVoicePresets = () => voiceService.getAvailablePresets();

// Re-export for convenience
export { COLONEL_VOICE_PRESETS } from './VoiceEngine';
