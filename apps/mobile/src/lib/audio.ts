import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { asAudio } from './asset';
import { createSafeAudioSound, guardWebAudioElement } from './audioWebGuards';

// Audio settings storage keys
const AUDIO_SETTINGS_KEY = '@codec_audio_settings';

interface AudioSettings {
  startupAudioEnabled: boolean;
  volume: number;
  audioQuality: 'high' | 'medium' | 'low';
}

interface CodecSound {
  id: string;
  name: string;
  file: any; // Audio file import
  fileName?: string; // Actual filename for debug/overlay
  duration?: number;
  description?: string;
}

class CodecAudioService {
  private sounds: Map<string, Audio.Sound> = new Map();
  private settings: AudioSettings = {
    startupAudioEnabled: true,
    volume: 0.7,
    audioQuality: 'high',
  };
  private isInitialized = false;

  // Available codec sounds
  private readonly codecSounds: CodecSound[] = [
    {
      id: 'codec_startup',
      name: 'Codec Send',
      file: asAudio(require('../../assets/audio/codec-send.mp3')),
      fileName: 'codec-send.mp3',
      description: 'MGS codec communication startup sound'
    },
    {
      id: 'codec_lock',
      name: 'Codec Lock',
      file: asAudio(require('../../assets/audio/codec_lock.mp3')),
      fileName: 'codec_lock.mp3',
      description: 'MGS codec frequency lock sound'
    },
    {
      id: 'impressive',
      name: 'Impressive Snake',
      file: asAudio(require('../../assets/audio/metal-gear-solid-impressive-snake.mp3')),
      fileName: 'metal-gear-solid-impressive-snake.mp3',
      description: 'MGS impressive Snake voice clip'
    },
    {
      id: 'kept_waiting',
      name: 'Kept You Waiting',
      file: asAudio(require('../../assets/audio/mgs2-snake-kept-you-waiting-huh.mp3')),
      fileName: 'mgs2-snake-kept-you-waiting-huh.mp3',
      description: 'MGS2 Snake kept you waiting voice clip'
    },
    {
      id: 'codec_close',
      name: 'Codec Close',
      file: asAudio(require('../../assets/audio/metal_gear_solid_exit_sound_effect.mp3')),
      fileName: 'metal_gear_solid_exit_sound_effect.mp3',
      description: 'MGS codec communication close sound'
    }
  ];

  // User interaction sounds (non-codec related)
  private readonly userSounds: CodecSound[] = [
    // Existing
    {
      id: 'rations',
      name: 'Rations',
      file: asAudio(require('../../assets/audio/mgs-rations.mp3')),
      fileName: 'mgs-rations.mp3',
      description: 'MGS rations pickup sound'
    },
    {
      id: 'item_drop',
      name: 'Item Drop',
      file: asAudio(require('../../assets/audio/metal-gear-item-drop.mp3')),
      fileName: 'metal-gear-item-drop.mp3',
      description: 'MGS item acquisition sound'
    },
    {
      id: 'transcript_saved',
      name: 'Transcript Saved',
      file: asAudio(require('../../assets/audio/metal-gear-item-drop.mp3')),
      fileName: 'metal-gear-item-drop.mp3',
      description: 'Transcript download completion sound'
    },
    {
      id: 'reflex_mode',
      name: 'Reflex Mode',
      file: asAudio(require('../../assets/audio/mgs-reflex-mode.mp3')),
      fileName: 'mgs-reflex-mode.mp3',
      description: 'MGS reflex mode activation'
    },
    {
      id: 'impressive_snake',
      name: 'Impressive Snake',
      file: asAudio(require('../../assets/audio/metal-gear-solid-impressive-snake.mp3')),
      fileName: 'metal-gear-solid-impressive-snake.mp3',
      description: 'MGS impressive Snake voice clip'
    },
    {
      id: 'if_you_say_so',
      name: 'If You Say So',
      file: asAudio(require('../../assets/audio/mgs2-snake-if-you-say-so.mp3')),
      fileName: 'mgs2-snake-if-you-say-so.mp3',
      description: 'MGS2 Snake voice clip'
    },
    // New additions from material/audio/noncodec
    {
      id: 'brawl_voice_clips_snake',
      name: 'Brawl Voice Clips (Snake)',
      file: asAudio(require('../../assets/audio/brawl-voice-clips-snake-audiotrimmer.mp3')),
      fileName: 'brawl-voice-clips-snake-audiotrimmer.mp3'
    },
    {
      id: 'brother_not_over',
      name: "Brother, it's not over yet",
      file: asAudio(require('../../assets/audio/brother-its-not-over-not-yet.mp3')),
      fileName: 'brother-its-not-over-not-yet.mp3'
    },
    {
      id: 'knock_mgs',
      name: 'Knock (MGS)',
      file: asAudio(require('../../assets/audio/knock-mgs.mp3')),
      fileName: 'knock-mgs.mp3'
    },
    {
      id: 'konami',
      name: 'Konami',
      file: asAudio(require('../../assets/audio/konami.mp3')),
      fileName: 'konami.mp3'
    },
    {
      id: 'metal_2_TClrnEl',
      name: 'Metal 2 TClrnEl',
      file: asAudio(require('../../assets/audio/metal_2_TClrnEl.mp3')),
      fileName: 'metal_2_TClrnEl.mp3'
    },
    {
      id: 'game_over_clean_bg',
      name: 'Game Over (clean bg)',
      file: asAudio(require('../../assets/audio/metal_gear_solid_game_over_screen_clean_background-1.mp3')),
      fileName: 'metal_gear_solid_game_over_screen_clean_background-1.mp3'
    },
    {
      id: 'snake_otacon_handshake',
      name: 'Snake & Otacon Handshake',
      file: asAudio(require('../../assets/audio/metal-gear-solid-2-snake-and-otacon-handshake.mp3')),
      fileName: 'metal-gear-solid-2-snake-and-otacon-handshake.mp3'
    },
    {
      id: 'mgs_alert',
      name: 'MGS Alert',
      file: asAudio(require('../../assets/audio/mgs.alert.tindeck_1.mp3')),
      fileName: 'mgs.alert.tindeck_1.mp3'
    },
    {
      id: 'what_the_hell',
      name: 'What the hell is going on here?',
      file: asAudio(require('../../assets/audio/mgs2-snake-what-the-hell-is-going-on-here.mp3')),
      fileName: 'mgs2-snake-what-the-hell-is-going-on-here.mp3'
    },
    {
      id: 'snake_eater_ending_ringtone',
      name: 'Snake Eater Ending (ringtone)',
      file: asAudio(require('../../assets/audio/mgs-snake-eater-ending-ringtone.mp3')),
      fileName: 'mgs-snake-eater-ending-ringtone.mp3'
    },
    {
      id: 'not_solid_snake',
      name: 'No, that is not Solid Snake',
      file: asAudio(require('../../assets/audio/no-that-is-not-solid-snake.mp3')),
      fileName: 'no-that-is-not-solid-snake.mp3'
    },
    {
      id: 'ocelot_meowing',
      name: 'Ocelot Meowing',
      file: asAudio(require('../../assets/audio/ocelot-meowing.mp3')),
      fileName: 'ocelot-meowing.mp3'
    },
    {
      id: 'raiden_louder',
      name: 'Raiden Louder',
      file: asAudio(require('../../assets/audio/raiden-louder.mp3')),
      fileName: 'raiden-louder.mp3'
    },
    {
      id: 'raiden_meme',
      name: 'Raiden Meme',
      file: asAudio(require('../../assets/audio/raidenmeme.mp3')),
      fileName: 'raidenmeme.mp3'
    },
    {
      id: 'snake_eater_outro',
      name: 'Snake Eater Outro',
      file: asAudio(require('../../assets/audio/snake-eater-outro.mp3')),
      fileName: 'snake-eater-outro.mp3'
    },
    {
      id: 'standing_here_realize',
      name: 'Standing here, I realize',
      file: asAudio(require('../../assets/audio/standing-here-i-realize_B7hEFlm.mp3')),
      fileName: 'standing-here-i-realize_B7hEFlm.mp3'
    },
    {
      id: 'v_has_come_to',
      name: 'V Has Come To',
      file: asAudio(require('../../assets/audio/v-has-come-to.mp3')),
      fileName: 'v-has-come-to.mp3'
    },
    {
      id: 'just_to_suffer',
      name: 'Why are we still here, just to suffer?',
      file: asAudio(require('../../assets/audio/why_are_we_still_here_just_to_suffer_2.mp3')),
      fileName: 'why_are_we_still_here_just_to_suffer_2.mp3'
    },
    {
      id: 'woheeeeee',
      name: 'Woh eeeee',
      file: asAudio(require('../../assets/audio/woheeeeee.mp3')),
      fileName: 'woheeeeee.mp3'
    }
  ];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load user settings
      await this.loadSettings();

      // Configure audio mode for mobile platforms
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        
        // Preload sounds on native platforms
        await this.preloadSounds(['codec_startup', 'codec_lock']);
      } else {
        // On web, prepare audio context and defer preloading until first user interaction
        console.log('[CODEC AUDIO] Web platform detected - preparing web audio context');
        
        // Check if we're on iOS Safari
        const isIOSSafari = typeof navigator !== 'undefined' && 
          /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOSSafari) {
          console.log('[CODEC AUDIO] iOS Safari detected - audio will be activated on user interaction');
          // On iOS Safari, audio context will be suspended until first user interaction
          // Don't attempt to create sounds yet - wait for user interaction
        } else {
          // On desktop web browsers, attempt to prepare audio context
          try {
            const { sound: testSound } = await Audio.Sound.createAsync(
              this.codecSounds[0].file,
              { shouldPlay: false, volume: 0 }
            );
            this.sounds.set('_test_', testSound);
            console.log('[CODEC AUDIO] Web audio context prepared successfully');
          } catch (webError) {
            console.warn('[CODEC AUDIO] Web audio preparation failed (will retry on first play):', webError);
          }
        }
      }
      
      this.isInitialized = true;
      console.log('[CODEC AUDIO] Service initialized successfully');
    } catch (error) {
      console.error('[CODEC AUDIO] Failed to initialize:', error);
      // Don't throw error - allow app to continue without audio
      this.isInitialized = true;
      console.warn('[CODEC AUDIO] Continuing without audio initialization');
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(AUDIO_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('[CODEC AUDIO] Failed to load settings:', error);
    }
  }

  async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('[CODEC AUDIO] Failed to save settings:', error);
    }
  }

  private async preloadSounds(soundIds: string[]): Promise<void> {
    const loadPromises = soundIds.map(async (id) => {
      const codecSound = this.codecSounds.find(s => s.id === id);
      if (!codecSound) return;

      try {
        const { sound } = await Audio.Sound.createAsync(
          codecSound.file,
          {
            shouldPlay: false,
            volume: 0, // Start silent, will be set when playing
          }
        );
        
        this.sounds.set(id, sound);
        console.log(`[CODEC AUDIO] Preloaded: ${codecSound.name}`);
      } catch (error) {
        console.warn(`[CODEC AUDIO] Failed to preload ${codecSound.name}:`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  async playStartupSequence(): Promise<void> {
    if (!this.settings.startupAudioEnabled) {
      console.log('[CODEC AUDIO] Startup audio disabled by user');
      return;
    }

    try {
      // Play the main codec startup sound
      await this.playSound('codec_startup', {
        volume: this.settings.volume,
        fadeIn: true,
      });

      // Optional: Add a slight delay then play codec lock
      setTimeout(async () => {
        await this.playSound('codec_lock', {
          volume: this.settings.volume * 0.6,
        });
      }, 1500);

    } catch (error) {
      console.error('[CODEC AUDIO] Startup sequence failed:', error);
    }
  }

  async playSound(soundId: string, options: {
    volume?: number;
    fadeIn?: boolean;
    loop?: boolean;
  } = {}): Promise<void> {
    try {
      let sound = this.sounds.get(soundId);

      // Load sound if not preloaded
      if (!sound) {
        // Search in both codec and user sounds
        const codecSound = this.codecSounds.find(s => s.id === soundId) || 
                          this.userSounds.find(s => s.id === soundId);
        if (!codecSound) {
          throw new Error(`Sound not found: ${soundId}`);
        }

        // Use safe audio creation wrapper to prevent web crashes
        const { sound: newSound } = await createSafeAudioSound(
          codecSound.file,
          { shouldPlay: false, volume: 0 }
        );
        sound = newSound;
        if (sound) {
          this.sounds.set(soundId, sound);
        } else {
          throw new Error(`Failed to create sound: ${soundId}`);
        }
      }

      if (!sound) {
        throw new Error(`Sound could not be loaded: ${soundId}`);
      }

      // Configure playback
      const volume = options.volume ?? this.settings.volume;
      await sound.setVolumeAsync(options.fadeIn ? 0 : volume);
      await sound.setIsLoopingAsync(options.loop ?? false);

      // Play the sound
      await sound.replayAsync();

      // Handle fade-in effect
      if (options.fadeIn && volume > 0) {
        this.fadeInSound(sound, volume, 500);
      }

      console.log(`[CODEC AUDIO] Playing: ${soundId}`);
    } catch (error) {
      console.error(`[CODEC AUDIO] Failed to play ${soundId}:`, error);
    }
  }

  private fadeInSound(sound: Audio.Sound, targetVolume: number, duration: number): void {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;

    let currentStep = 0;
    const fadeInterval = setInterval(async () => {
      currentStep++;
      const currentVolume = volumeStep * currentStep;

      try {
        await sound.setVolumeAsync(Math.min(currentVolume, targetVolume));
      } catch (error) {
        clearInterval(fadeInterval);
        return;
      }

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
      }
    }, stepDuration);
  }

  // Settings management
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<AudioSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    console.log('[CODEC AUDIO] Settings updated:', this.settings);
  }

  async setStartupAudioEnabled(enabled: boolean): Promise<void> {
    await this.updateSettings({ startupAudioEnabled: enabled });
  }

  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    await this.updateSettings({ volume: clampedVolume });
  }

  // User interaction methods
  // Simple event system for user SFX start/stop
  private userSfxListeners = new Set<(e: { type: 'start' | 'stop'; id: string; name: string; fileName?: string }) => void>();
  private emitUserSfx(e: { type: 'start' | 'stop'; id: string; name: string; fileName?: string }) {
    this.userSfxListeners.forEach((fn) => {
      try { fn(e); } catch (err) {
        // Ignore listener errors to prevent disrupting audio playback
      }
    });
  }
  subscribeToUserSfx(listener: (e: { type: 'start' | 'stop'; id: string; name: string; fileName?: string }) => void) {
    this.userSfxListeners.add(listener);
    return () => this.userSfxListeners.delete(listener);
  }

  private userSfxPlaying = false;
  private clickCount = 0;
  private lastClickTime = 0;

  async playRandomUserSound(): Promise<void> {
    if (this.userSounds.length === 0) {
      console.warn('[CODEC AUDIO] No user sounds available');
      return;
    }

    // Emergency reset: If user clicks rapidly 5 times while stuck, force reset
    const now = Date.now();
    if (this.userSfxPlaying) {
      if (now - this.lastClickTime < 500) { // Within 500ms of last click
        this.clickCount++;
        if (this.clickCount >= 5) {
          console.log('[CODEC AUDIO] Emergency reset: Force unlocking stuck audio state');
          this.userSfxPlaying = false;
          this.clickCount = 0;
          this.emitUserSfx({ type: 'stop', id: 'emergency_reset', name: 'Emergency Reset', fileName: 'emergency_reset' });
          // Don't return, let it continue to play a sound
        } else {
          console.log(`[CODEC AUDIO] Ignoring click - user SFX already playing (${this.clickCount}/5 for emergency reset)`);
          this.lastClickTime = now;
          return;
        }
      } else {
        this.clickCount = 1;
        console.log('[CODEC AUDIO] Ignoring click - user SFX already playing (1/5 for emergency reset)');
        this.lastClickTime = now;
        return;
      }
    } else {
      this.clickCount = 0;
    }
    this.lastClickTime = now;

    try {
      // Select a random sound from user sounds
      const randomIndex = Math.floor(Math.random() * this.userSounds.length);
      const selectedSound = this.userSounds[randomIndex];

      this.userSfxPlaying = true;
      this.emitUserSfx({ type: 'start', id: selectedSound.id, name: selectedSound.name, fileName: selectedSound.fileName });

      // Create and play with reduced volume for UI feedback
      const { sound } = await createSafeAudioSound(selectedSound.file, { shouldPlay: false, volume: this.settings.volume * 0.8 });
      if (!sound) {
        throw new Error('Failed to create user SFX sound');
      }

      // Function to clean up and release lock
      const cleanup = () => {
        try { sound.unloadAsync(); } catch (err) {
          // Ignore unload errors - sound may already be cleaned up
        }
        this.userSfxPlaying = false;
        this.emitUserSfx({ type: 'stop', id: selectedSound.id, name: selectedSound.name, fileName: selectedSound.fileName });
      };

      // Set up completion detection with fallback timeout
      let hasCompleted = false;
      
      // Primary: Try to use playback status updates (works on native)
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status && status.didJustFinish && !hasCompleted) {
          hasCompleted = true;
          cleanup();
        }
      });

      // Fallback: Use timeout for web compatibility (most sounds are under 10 seconds)
      const timeoutId = setTimeout(() => {
        if (!hasCompleted) {
          hasCompleted = true;
          console.log('[CODEC AUDIO] Using fallback timeout cleanup for web compatibility');
          cleanup();
        }
      }, 10000); // 10 second fallback timeout

      await sound.replayAsync();

      // On web, also try to detect when sound actually ends by checking status periodically
      if (typeof window !== 'undefined') {
        const statusCheckInterval = setInterval(async () => {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded && !status.isPlaying && !hasCompleted) {
              hasCompleted = true;
              clearInterval(statusCheckInterval);
              clearTimeout(timeoutId);
              cleanup();
            }
          } catch (err) {
            // Sound may have been cleaned up already
            clearInterval(statusCheckInterval);
          }
        }, 100); // Check every 100ms
        
        // Clean up interval after maximum timeout
        setTimeout(() => {
          clearInterval(statusCheckInterval);
        }, 10000);
      }

      console.log(`[CODEC AUDIO] Playing random user sound: ${selectedSound.name} (${selectedSound.fileName || selectedSound.id})`);
    } catch (error) {
      this.userSfxPlaying = false;
      console.error('[CODEC AUDIO] Failed to play random user sound:', error);
    }
  }

  // Utility methods
  getAvailableSounds(): CodecSound[] {
    return [...this.codecSounds];
  }

  getUserSounds(): CodecSound[] {
    return [...this.userSounds];
  }

  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.sounds.values()).map(async (sound) => {
      try {
        await sound.stopAsync();
      } catch (error) {
        // Sound might already be stopped
      }
    });

    await Promise.all(stopPromises);
    console.log('[CODEC AUDIO] All sounds stopped');
  }

  async cleanup(): Promise<void> {
    await this.stopAll();

    const unloadPromises = Array.from(this.sounds.values()).map(async (sound) => {
      try {
        await sound.unloadAsync();
      } catch (error) {
        // Sound might already be unloaded
      }
    });

    await Promise.all(unloadPromises);
    this.sounds.clear();
    this.isInitialized = false;
    console.log('[CODEC AUDIO] Service cleaned up');
  }
}

// Singleton instance
export const codecAudioService = new CodecAudioService();

// Convenience functions
export const initializeCodecAudio = () => codecAudioService.initialize();
export const playCodecStartup = () => codecAudioService.playStartupSequence();
export const playCodecClose = () => codecAudioService.playSound('codec_close', { volume: codecAudioService.getSettings().volume });
export const playRandomUserSound = () => codecAudioService.playRandomUserSound();
export const subscribeToUserSfx = (listener: (e: { type: 'start' | 'stop'; id: string; name: string; fileName?: string }) => void) =>
  codecAudioService.subscribeToUserSfx(listener);

// Lightning donation specific sound
export const playRationsSound = () => {
  console.log('[CODEC AUDIO] Playing rations sound for Lightning donation copy');
  return codecAudioService.playSound('rations', { 
    volume: codecAudioService.getSettings().volume * 0.8 // Slightly quieter for UI feedback
  });
};

export const getCodecAudioSettings = () => codecAudioService.getSettings();
export const updateCodecAudioSettings = (settings: Partial<AudioSettings>) => 
  codecAudioService.updateSettings(settings);

// Transcript download completion sound
export const playTranscriptSavedSound = () => {
  console.log('[CODEC AUDIO] Playing transcript saved sound');
  return codecAudioService.playSound('transcript_saved', { 
    volume: codecAudioService.getSettings().volume * 0.8 // UI feedback volume
  });
};
