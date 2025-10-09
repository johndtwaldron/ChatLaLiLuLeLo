/**
 * Audio Mixer for Voice and SFX
 * 
 * Manages Web Audio API pipeline with separate channels for TTS and sound effects.
 * Handles audio queue management, sentence chunking, and progressive playback.
 */

import { VoiceChunk } from './VoiceEngine';

export interface AudioQueueItem {
  id: string;
  text: string;
  audioChunks: VoiceChunk[];
  priority: 'low' | 'normal' | 'high';
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface SFXAudioItem {
  id: string;
  audioBuffer: ArrayBuffer;
  volume?: number;
  onComplete?: () => void;
}

export interface AudioMixerConfig {
  ttsVolume: number; // 0-1
  sfxVolume: number; // 0-1
  masterVolume: number; // 0-1
  enableDucking: boolean; // Lower SFX when TTS is playing
  duckingLevel: number; // How much to reduce SFX volume (0-1)
  maxQueueSize: number; // Maximum items in TTS queue
}

const DEFAULT_MIXER_CONFIG: AudioMixerConfig = {
  ttsVolume: 0.8,
  sfxVolume: 0.6,
  masterVolume: 0.7,
  enableDucking: true,
  duckingLevel: 0.3,
  maxQueueSize: 10
};

export class AudioMixer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ttsGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  private config: AudioMixerConfig = { ...DEFAULT_MIXER_CONFIG };
  private initialized = false;
  
  // TTS Queue Management
  private ttsQueue: AudioQueueItem[] = [];
  private currentTTSItem: AudioQueueItem | null = null;
  private isTTSPlaying = false;
  
  // SFX Management  
  private sfxSources: Map<string, AudioBufferSourceNode> = new Map();
  
  // Sentence chunking regex
  private readonly sentenceEndRegex = /[.!?…]\s+/g;
  
  constructor(config?: Partial<AudioMixerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize the audio mixer and Web Audio context
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create audio context (handles browser compatibility)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create audio graph: Master -> TTS/SFX channels
      this.masterGain = this.audioContext.createGain();
      this.ttsGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      
      // Connect the audio graph
      this.ttsGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      // Set initial volumes
      this.updateVolumes();
      
      // Handle audio context state changes
      this.audioContext.addEventListener('statechange', this.handleStateChange.bind(this));
      
      this.initialized = true;
      console.log('[AUDIO] AudioMixer initialized successfully');
      
    } catch (error) {
      console.error('[AUDIO] Failed to initialize AudioMixer:', error);
      throw new Error(`AudioMixer initialization failed: ${error}`);
    }
  }

  private handleStateChange(): void {
    if (!this.audioContext) return;
    
    console.log(`[AUDIO] AudioContext state changed to: ${this.audioContext.state}`);
    
    if (this.audioContext.state === 'suspended') {
      console.warn('[AUDIO] AudioContext suspended - user interaction may be required');
    }
  }

  /**
   * Ensure audio context is running (handle browser autoplay policies)
   */
  async ensureAudioContextRunning(): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
      return;
    }
    
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('[AUDIO] AudioContext resumed');
      } catch (error) {
        console.warn('[AUDIO] Failed to resume AudioContext:', error);
      }
    }
  }

  /**
   * Update all volume settings
   */
  private updateVolumes(): void {
    if (!this.masterGain || !this.ttsGain || !this.sfxGain) return;
    
    this.masterGain.gain.value = this.config.masterVolume;
    this.ttsGain.gain.value = this.config.ttsVolume;
    
    // Apply ducking if TTS is playing
    const sfxVolume = this.isTTSPlaying && this.config.enableDucking 
      ? this.config.sfxVolume * this.config.duckingLevel
      : this.config.sfxVolume;
      
    this.sfxGain.gain.value = sfxVolume;
  }

  /**
   * Update mixer configuration
   */
  updateConfig(updates: Partial<AudioMixerConfig>): void {
    this.config = { ...this.config, ...updates };
    this.updateVolumes();
    console.log('[AUDIO] Mixer configuration updated:', updates);
  }

  /**
   * Split text into sentences for progressive playback
   */
  private splitIntoSentences(text: string): string[] {
    // Clean up the text first
    const cleaned = text.trim().replace(/\s+/g, ' ');
    if (!cleaned) return [];
    
    // Split on sentence endings
    const sentences = cleaned.split(this.sentenceEndRegex);
    
    // Filter out empty sentences and restore sentence endings
    const result: string[] = [];
    const matches = cleaned.match(this.sentenceEndRegex) || [];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence) {
        const ending = i < matches.length ? matches[i] : '';
        result.push(sentence + ending);
      }
    }
    
    // If no sentence endings found, return the whole text
    return result.length > 0 ? result : [cleaned];
  }

  /**
   * Queue TTS audio for playback
   */
  async queueTTS(
    text: string, 
    audioChunks: VoiceChunk[], 
    options?: {
      priority?: AudioQueueItem['priority'];
      onStart?: () => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }
  ): Promise<string> {
    // Check queue size limit
    if (this.ttsQueue.length >= this.config.maxQueueSize) {
      console.warn('[AUDIO] TTS queue is full, dropping oldest item');
      const dropped = this.ttsQueue.shift();
      dropped?.onError?.(new Error('Queue overflow - item dropped'));
    }
    
    const queueItem: AudioQueueItem = {
      id: `tts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      audioChunks,
      priority: options?.priority || 'normal',
      onStart: options?.onStart,
      onComplete: options?.onComplete,
      onError: options?.onError
    };
    
    // Insert based on priority
    if (queueItem.priority === 'high') {
      this.ttsQueue.unshift(queueItem);
    } else {
      this.ttsQueue.push(queueItem);
    }
    
    console.log(`[AUDIO] Queued TTS item: ${queueItem.id} (${audioChunks.length} chunks)`);
    
    // Start playback if not already playing
    if (!this.isTTSPlaying) {
      this.processNextTTSItem();
    }
    
    return queueItem.id;
  }

  /**
   * Process the next item in the TTS queue
   */
  private async processNextTTSItem(): Promise<void> {
    if (this.isTTSPlaying || this.ttsQueue.length === 0) return;
    
    const item = this.ttsQueue.shift();
    if (!item) return;
    
    this.currentTTSItem = item;
    this.isTTSPlaying = true;
    
    // Enable ducking
    this.updateVolumes();
    
    try {
      await this.ensureAudioContextRunning();
      
      item.onStart?.();
      
      // Play all audio chunks sequentially
      for (const chunk of item.audioChunks) {
        await this.playTTSChunk(chunk);
      }
      
      item.onComplete?.();
      console.log(`[AUDIO] Completed TTS item: ${item.id}`);
      
    } catch (error) {
      console.error(`[AUDIO] Error playing TTS item ${item.id}:`, error);
      item.onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.isTTSPlaying = false;
      this.currentTTSItem = null;
      
      // Disable ducking
      this.updateVolumes();
      
      // Process next item if available
      if (this.ttsQueue.length > 0) {
        setTimeout(() => this.processNextTTSItem(), 100); // Small gap between items
      }
    }
  }

  /**
   * Play a single TTS audio chunk
   */
  private async playTTSChunk(chunk: VoiceChunk): Promise<void> {
    if (!this.audioContext || !this.ttsGain) {
      throw new Error('AudioMixer not initialized');
    }
    
    try {
      // Decode the audio chunk
      const audioBuffer = await this.audioContext.decodeAudioData(chunk.slice(0));
      
      // Create and configure audio source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.ttsGain);
      
      // Play the chunk
      return new Promise<void>((resolve, reject) => {
        source.onended = () => resolve();
        
        // Handle potential errors during playback
        const handleError = () => reject(new Error('Audio playback error'));
        source.addEventListener('error', handleError);
        
        try {
          source.start(0);
        } catch (error) {
          reject(error);
        }
      });
      
    } catch (error) {
      console.error('[AUDIO] Failed to play TTS chunk:', error);
      throw error;
    }
  }

  /**
   * Play a sound effect
   */
  async playSFX(
    audioBuffer: ArrayBuffer, 
    options?: {
      volume?: number;
      id?: string;
      onComplete?: () => void;
    }
  ): Promise<void> {
    if (!this.audioContext || !this.sfxGain) {
      throw new Error('AudioMixer not initialized');
    }
    
    const id = options?.id || `sfx-${Date.now()}`;
    
    try {
      await this.ensureAudioContextRunning();
      
      // Decode audio buffer
      const decodedBuffer = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
      
      // Create source and gain for volume control
      const source = this.audioContext.createBufferSource();
      const gain = this.audioContext.createGain();
      
      source.buffer = decodedBuffer;
      source.connect(gain);
      gain.connect(this.sfxGain);
      
      // Set volume
      if (options?.volume !== undefined) {
        gain.gain.value = options.volume;
      }
      
      // Handle completion
      source.onended = () => {
        this.sfxSources.delete(id);
        options?.onComplete?.();
      };
      
      // Store reference for potential cancellation
      this.sfxSources.set(id, source);
      
      // Play the sound
      source.start(0);
      
      console.log(`[AUDIO] Playing SFX: ${id}`);
      
    } catch (error) {
      this.sfxSources.delete(id);
      console.error(`[AUDIO] Failed to play SFX ${id}:`, error);
      throw error;
    }
  }

  /**
   * Stop a specific SFX by ID
   */
  stopSFX(id: string): void {
    const source = this.sfxSources.get(id);
    if (source) {
      try {
        source.stop();
        this.sfxSources.delete(id);
        console.log(`[AUDIO] Stopped SFX: ${id}`);
      } catch (error) {
        console.warn(`[AUDIO] Failed to stop SFX ${id}:`, error);
      }
    }
  }

  /**
   * Clear TTS queue and stop current playback
   */
  clearTTSQueue(): void {
    // Cancel all queued items
    for (const item of this.ttsQueue) {
      item.onError?.(new Error('Queue cleared'));
    }
    
    this.ttsQueue = [];
    
    // Note: We can't easily stop current TTS playback with Web Audio API
    // once it's started, but we prevent new items from starting
    
    console.log('[AUDIO] TTS queue cleared');
  }

  /**
   * Stop all SFX
   */
  stopAllSFX(): void {
    for (const [id, source] of this.sfxSources) {
      try {
        source.stop();
      } catch (error) {
        console.warn(`[AUDIO] Failed to stop SFX ${id}:`, error);
      }
    }
    
    this.sfxSources.clear();
    console.log('[AUDIO] All SFX stopped');
  }

  /**
   * Get current mixer status
   */
  getStatus(): {
    initialized: boolean;
    audioContextState: string | null;
    isTTSPlaying: boolean;
    queueSize: number;
    activeSFX: number;
  } {
    return {
      initialized: this.initialized,
      audioContextState: this.audioContext?.state || null,
      isTTSPlaying: this.isTTSPlaying,
      queueSize: this.ttsQueue.length,
      activeSFX: this.sfxSources.size
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Clear queues and stop playback
    this.clearTTSQueue();
    this.stopAllSFX();
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
        console.log('[AUDIO] AudioContext closed');
      } catch (error) {
        console.warn('[AUDIO] Failed to close AudioContext:', error);
      }
    }
    
    // Clear references
    this.audioContext = null;
    this.masterGain = null;
    this.ttsGain = null;
    this.sfxGain = null;
    this.currentTTSItem = null;
    this.initialized = false;
    
    console.log('[AUDIO] AudioMixer cleaned up');
  }
}
