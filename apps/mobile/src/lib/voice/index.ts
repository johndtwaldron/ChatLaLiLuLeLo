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
import { debugEnvironmentVariables, checkVoiceEnvironment } from './debugEnv';

export type VoiceEngineType = 'openai' | 'elevenlabs' | 'coqui' | 'disabled';

export interface VoiceConfig {
  enabled: boolean;
  engine: VoiceEngineType;
  autoplayReplies: boolean;
  volume: number; // 0-1
  voicePreset: string;
  enableSFX: boolean; // Enable codec sound effects
  lastVolume?: number; // Store last volume before smart toggle disable
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
      // Enhanced environment debugging
      debugEnvironmentVariables();
      
      const envCheck = checkVoiceEnvironment();
      if (!envCheck.configured) {
        console.warn('[VOICE] Environment configuration issues detected:');
        envCheck.issues.forEach(issue => console.warn(`  ❌ ${issue}`));
        console.warn('[VOICE] Recommendations:');
        envCheck.recommendations.forEach(rec => console.warn(`  💡 ${rec}`));
      }
      
      console.log('[VOICE] DEBUG: Environment variables check:');
      console.log('  EXPO_PUBLIC_VOICE_ENABLED:', process.env.EXPO_PUBLIC_VOICE_ENABLED);
      console.log('  EXPO_PUBLIC_VOICE_ENGINE:', process.env.EXPO_PUBLIC_VOICE_ENGINE);
      console.log('  EXPO_PUBLIC_ELEVENLABS_ENABLED:', process.env.EXPO_PUBLIC_ELEVENLABS_ENABLED);
      console.log('  EXPO_PUBLIC_ELEVENLABS_API_KEY present:', !!process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY);
      console.log('  EXPO_PUBLIC_ELEVENLABS_API_KEY length:', process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY?.length || 0);
      console.log('  EXPO_PUBLIC_VOICE_AUTOPLAY:', process.env.EXPO_PUBLIC_VOICE_AUTOPLAY);
      
      // Check if voice is globally disabled (safe default)
      const voiceEnabled = process.env.EXPO_PUBLIC_VOICE_ENABLED === 'true';
      
      // Check if we're in a web environment with proper voice configuration
      const h = typeof window !== 'undefined' ? window.location.hostname : '';
      const isGithubPages = (h === 'github.io') || h.endsWith('.github.io');
      const isWebPreview = typeof window !== 'undefined' && (
        h.includes('vercel.app') ||
        h.includes('netlify.app') ||
        isGithubPages ||
        process.env.NODE_ENV === 'preview'
      );
      
      // Only disable voice on web preview if voice is NOT explicitly enabled AND configured
      if (isWebPreview && !voiceEnabled) {
        console.log('[VOICE] Voice disabled on web preview deployment - set EXPO_PUBLIC_VOICE_ENABLED=true to enable');
        this.config = {
          ...DEFAULT_VOICE_CONFIG,
          enabled: false,
          engine: 'disabled'
        };
        return;
      }
      
      // If we're on GitHub Pages and voice is enabled, allow it through
      if (isWebPreview && voiceEnabled) {
        console.log('[VOICE] Voice enabled for web deployment with proper configuration');
      }

      // Determine engine preference with fallback
      let enginePreference: VoiceEngineType = 'disabled';
      
      if (voiceEnabled) {
        const configuredEngine = process.env.EXPO_PUBLIC_VOICE_ENGINE as VoiceEngineType;
        
        switch (configuredEngine) {
          case 'elevenlabs':
            enginePreference = (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY && process.env.EXPO_PUBLIC_ELEVENLABS_ENABLED === 'true') 
              ? 'elevenlabs' : 'disabled';
            break;
          case 'coqui':
            enginePreference = process.env.EXPO_PUBLIC_COQUI_ENABLED === 'true' ? 'coqui' : 'disabled';
            break;
          default:
            // Auto-detect available engine - prefer ElevenLabs for this project
            if (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY && process.env.EXPO_PUBLIC_ELEVENLABS_ENABLED === 'true') {
              enginePreference = 'elevenlabs';
            } else if (process.env.EXPO_PUBLIC_COQUI_ENABLED === 'true') {
              enginePreference = 'coqui';
            }
        }
      }

      this.config = {
        enabled: voiceEnabled && enginePreference !== 'disabled',
        engine: enginePreference,
        autoplayReplies: process.env.EXPO_PUBLIC_VOICE_AUTOPLAY === 'true',
        volume: this.parseFloat(process.env.EXPO_PUBLIC_VOICE_VOLUME, DEFAULT_VOICE_CONFIG.volume),
        voicePreset: process.env.EXPO_PUBLIC_VOICE_PRESET || DEFAULT_VOICE_CONFIG.voicePreset,
        enableSFX: process.env.EXPO_PUBLIC_VOICE_SFX !== 'false' // Default enabled
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
      case 'elevenlabs':
        if (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY && process.env.EXPO_PUBLIC_ELEVENLABS_ENABLED === 'true') {
          return new ElevenLabsTTSEngine();
        }
        break;
      
      case 'coqui':
        if (process.env.EXPO_PUBLIC_COQUI_ENABLED === 'true') {
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
