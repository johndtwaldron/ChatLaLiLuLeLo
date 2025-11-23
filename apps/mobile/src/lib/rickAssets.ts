/**
 * Rick Mode Assets Loader
 * 
 * Static imports for Rick images and audio from material directories.
 * Metro bundler doesn't support require.context for paths outside the app directory,
 * so we use explicit imports with asImg helper for cross-platform compatibility.
 */

import { asImg } from './asset';

// Static Rick image imports - now via symlinked assets in Expo project
// Path from apps/mobile/src/lib/ to apps/mobile/assets is ../../assets
const RICK_IMAGES = [
  asImg(require('../../assets/Rick.images/7vai8uwrs1v11.jpg')),
  asImg(require('../../assets/Rick.images/Rick.Cigarette.jpg')),
  asImg(require('../../assets/Rick.images/RickBlaine.jpg')),
];

// Static Rick audio imports - symlinked from material/audio/rick.audio
const RICK_AUDIO = [
  require('../../assets/rick.audio/band-playing.mp3'),
  require('../../assets/rick.audio/all-right-i-will.mp3'),
  require('../../assets/rick.audio/all-right-at-a-quarter-to-5.mp3'),
];

export interface RickAssets {
  images: any[];  // Use any for image sources (can be objects or strings)
  audio: any[];   // Use any for audio sources
}

/**
 * Get all Rick assets (images and audio)
 */
export function getRickAssets(): RickAssets {
  console.log(`[RICK] Total assets: ${RICK_IMAGES.length} images, ${RICK_AUDIO.length} audio clips`);
  
  return { 
    images: RICK_IMAGES, 
    audio: RICK_AUDIO 
  };
}

/**
 * Rick portrait cycling state
 */
export class RickPortraitCycler {
  private images: string[];
  private audio: string[];
  private currentImageIndex: number = 0;
  private currentAudioIndex: number = 0;
  private isAudioPlaying: boolean = false;
  private audioElement: HTMLAudioElement | null = null;
  
  constructor(assets: RickAssets) {
    this.images = assets.images;
    this.audio = assets.audio;
    
    if (this.images.length === 0) {
      console.warn('[RICK] No images available for cycling');
    }
    
    if (this.audio.length === 0) {
      console.warn('[RICK] No audio available for cycling');
    }
  }
  
  /**
   * Get current portrait image
   */
  getCurrentImage(): any {
    if (this.images.length === 0) {
      console.warn('[RICK] No images available');
      return null;
    }
    return this.images[this.currentImageIndex];
  }
  
  /**
   * Handle portrait click - advance image and play audio
   * Returns true if action was taken, false if guarded
   */
  async handleClick(): Promise<boolean> {
    // Guard: Don't proceed if audio is playing
    if (this.isAudioPlaying) {
      console.log('[RICK] Audio already playing, ignoring click');
      return false;
    }
    
    // Advance image index with wrap-around
    if (this.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
      console.log(`[RICK] Advanced to image ${this.currentImageIndex + 1}/${this.images.length}`);
    }
    
    // Advance audio index and play
    if (this.audio.length > 0) {
      this.currentAudioIndex = (this.currentAudioIndex + 1) % this.audio.length;
      await this.playCurrentAudio();
    }
    
    return true;
  }
  
  /**
   * Play current audio clip
   */
  private async playCurrentAudio(): Promise<void> {
    if (this.audio.length === 0) return;
    
    const audioSource = this.audio[this.currentAudioIndex];
    console.log(`[RICK] Playing audio ${this.currentAudioIndex + 1}/${this.audio.length}`);
    
    this.isAudioPlaying = true;
    
    try {
      // Stop any existing audio
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement = null;
      }
      
      // For web platform, audioSource is already a resolved URL/path
      // Create and play new audio with the proper source
      this.audioElement = new Audio(audioSource);
      this.audioElement.volume = 0.8; // Set reasonable volume
      
      // Set up event listeners
      this.audioElement.onended = () => {
        this.isAudioPlaying = false;
        this.audioElement = null;
        console.log('[RICK] Audio playback finished');
      };
      
      this.audioElement.onerror = (error) => {
        console.error('[RICK] Audio playback error:', error);
        this.isAudioPlaying = false;
        this.audioElement = null;
      };
      
      // Play with error handling
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('[RICK] Play promise rejected:', error);
          this.isAudioPlaying = false;
          this.audioElement = null;
        });
      }
      
    } catch (error) {
      console.error('[RICK] Failed to play audio:', error);
      this.isAudioPlaying = false;
      this.audioElement = null;
    }
  }
  
  /**
   * Stop any playing audio
   */
  stopAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    this.isAudioPlaying = false;
    console.log('[RICK] Audio stopped');
  }
  
  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.isAudioPlaying;
  }
  
  /**
   * Reset to first image and audio
   */
  reset(): void {
    this.currentImageIndex = 0;
    this.currentAudioIndex = 0;
    this.stopAudio();
    console.log('[RICK] Cycler reset');
  }
}
