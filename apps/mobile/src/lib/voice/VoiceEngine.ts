/**
 * Voice Engine Abstraction Layer
 * 
 * Provides a pluggable interface for different TTS engines while maintaining
 * consistent behavior across implementations. All engines must support both
 * streaming and non-streaming modes through the same interface.
 */

export type VoiceChunk = ArrayBuffer;

export interface SynthesizeOpts {
  /** Voice ID or preset name (engine-specific) */
  voiceId?: string;
  /** Speech speed multiplier (0.25 to 4.0, default: 1.0) */
  speed?: number;
  /** Voice pitch adjustment (-20 to 20 semitones, default: 0) */
  pitch?: number;
  /** Enable SSML parsing (default: false for security) */
  ssml?: boolean;
  /** Maximum text length per chunk */
  maxLength?: number;
}

export interface VoiceEngine {
  /** Human-readable engine name */
  readonly name: string;
  
  /** Whether this engine supports true streaming synthesis */
  readonly supportsStreaming: boolean;
  
  /** 
   * Synthesize text to audio chunks asynchronously
   * 
   * Must work for both streaming and non-streaming engines:
   * - Streaming: yields audio chunks as they're generated
   * - Non-streaming: synthesizes full audio then yields once
   * 
   * @param text Text to synthesize (will be pre-sanitized)
   * @param opts Synthesis options
   * @returns Async iterable of audio chunks
   */
  synthesizeStream(text: string, opts?: SynthesizeOpts): AsyncIterable<VoiceChunk>;
  
  /**
   * Initialize the engine (e.g., validate API keys, prepare resources)
   * @returns Promise that resolves when ready, rejects if initialization fails
   */
  initialize?(): Promise<void>;
  
  /**
   * Clean up resources (optional)
   */
  cleanup?(): Promise<void>;
  
  /**
   * Get available voice presets for this engine
   * @returns Array of voice IDs/names available
   */
  getAvailableVoices?(): string[];
  
  /**
   * Check if engine is properly configured and ready
   * @returns true if ready to synthesize
   */
  isReady?(): boolean;
}

/**
 * Colonel-style voice presets that map to engine-specific settings
 */
export interface ColonelVoicePreset {
  id: string;
  name: string;
  description: string;
  /** Engine-specific voice configuration */
  config: {
    voiceId: string;
    speed?: number;
    pitch?: number;
    // Engine-specific parameters can extend this
    [key: string]: any;
  };
}

/**
 * Standard Colonel voice presets (engine adapters map these to their voices)
 */
export const COLONEL_VOICE_PRESETS: ColonelVoicePreset[] = [
  {
    id: 'colonel-neutral',
    name: 'Colonel Neutral',
    description: 'Authoritative military commander voice',
    config: {
      voiceId: 'default-male-authoritative',
      speed: 0.9,
      pitch: -2,
    }
  },
  {
    id: 'colonel-gravel',
    name: 'Colonel Gravel',
    description: 'Deeper, more gravelly command voice',
    config: {
      voiceId: 'default-male-deep',
      speed: 0.85,
      pitch: -5,
    }
  },
  {
    id: 'narrator',
    name: 'Mission Narrator',
    description: 'Clear tactical briefing voice',
    config: {
      voiceId: 'default-male-clear',
      speed: 1.0,
      pitch: 0,
    }
  }
];

/**
 * Error types for voice engine operations
 */
export class VoiceEngineError extends Error {
  constructor(
    message: string,
    public readonly engine: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'VoiceEngineError';
  }
}

export class VoiceEngineNotReadyError extends VoiceEngineError {
  constructor(engine: string) {
    super(`Voice engine ${engine} is not ready`, engine, 'NOT_READY');
  }
}

export class VoiceEngineNetworkError extends VoiceEngineError {
  constructor(engine: string, originalError?: Error) {
    super(`Network error in ${engine}: ${originalError?.message || 'Unknown'}`, engine, 'NETWORK_ERROR');
  }
}
