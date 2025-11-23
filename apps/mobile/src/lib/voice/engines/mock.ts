/**
 * Mock TTS Engine
 * 
 * Zero-cost voice engine for development that simulates TTS behavior
 * without making any network requests or spending API credits.
 * 
 * Perfect for:
 * - UI development (voice box appears and animates)
 * - Testing voice controls and state management
 * - Codec interface development without audio costs
 * 
 * Switch to live mode when you need real audio:
 * Set ELEVENLABS_MODE=live in apps/edge/.dev.vars
 */

import type { VoiceEngine, VoiceEngineError, VoiceChunk, SynthesizeOpts } from '../VoiceEngine';

export class MockTTSEngine implements VoiceEngine {
  name = 'Mock TTS (Development)';
  supportsStreaming = false;

  private ready = true;
  private playing = false;
  private playTimeout: NodeJS.Timeout | null = null;

  isReady(): boolean {
    return this.ready;
  }

  async initialize(): Promise<void> {
    console.log('[VOICE] MockTTSEngine initialized - Zero API calls, zero cost 🎭');
    this.ready = true;
  }

  /**
   * Synthesize text to simulated audio chunks
   * Required by VoiceEngine interface - yields a single empty chunk
   */
  async *synthesizeStream(text: string, opts?: SynthesizeOpts): AsyncIterable<VoiceChunk> {
    console.log(`[VOICE] MockTTSEngine.synthesizeStream() - Mock synthesis for: "${text.slice(0, 50)}..."`);
    
    // Simulate realistic processing delay
    const wordCount = text.split(/\s+/).length;
    const processingDelay = Math.min(Math.max(100, wordCount * 50), 1000);
    
    await new Promise(resolve => setTimeout(resolve, processingDelay));
    
    // Yield a single empty audio chunk (mock audio data)
    // In a real engine, this would be actual PCM audio data
    const mockChunk = new ArrayBuffer(0);
    yield mockChunk;
    
    console.log('[VOICE] MockTTSEngine.synthesizeStream() - Mock synthesis complete');
  }

  async speak(text: string, options?: any): Promise<void> {
    console.log(`[VOICE] MockTTSEngine.speak() - Simulating audio for: "${text.slice(0, 50)}..."`);
    
    // Clear any existing timeout
    if (this.playTimeout) {
      clearTimeout(this.playTimeout);
    }

    // Simulate "playing" state for realistic duration
    // Roughly 150ms per word + base delay
    const wordCount = text.split(/\s+/).length;
    const simulatedDuration = Math.min(Math.max(1000, wordCount * 150), 5000); // 1-5 seconds
    
    this.playing = true;
    
    return new Promise((resolve) => {
      this.playTimeout = setTimeout(() => {
        this.playing = false;
        this.playTimeout = null;
        console.log('[VOICE] MockTTSEngine.speak() - Finished simulated playback');
        resolve();
      }, simulatedDuration);
    });
  }

  isPlaying(): boolean {
    return this.playing;
  }

  async pause(): Promise<void> {
    if (this.playTimeout) {
      clearTimeout(this.playTimeout);
      this.playTimeout = null;
    }
    this.playing = false;
    console.log('[VOICE] MockTTSEngine.pause()');
  }

  async resume(): Promise<void> {
    // Mock engine doesn't support resume
    console.log('[VOICE] MockTTSEngine.resume() - Not implemented');
  }

  async stop(): Promise<void> {
    if (this.playTimeout) {
      clearTimeout(this.playTimeout);
      this.playTimeout = null;
    }
    this.playing = false;
    console.log('[VOICE] MockTTSEngine.stop()');
  }

  async cleanup(): Promise<void> {
    this.stop();
    this.ready = false;
    console.log('[VOICE] MockTTSEngine cleaned up');
  }

  getStatus(): { ready: boolean; playing: boolean; error?: VoiceEngineError } {
    return {
      ready: this.ready,
      playing: this.playing
    };
  }
}
