import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      file: { uri: require('../../assets/audio/codec-send.mp3') },
      description: 'MGS codec communication startup sound'
    },
    {
      id: 'codec_lock',
      name: 'Codec Lock',
      file: { uri: require('../../assets/audio/codec_lock.mp3') },
      description: 'MGS codec frequency lock sound'
    },
    {
      id: 'impressive',
      name: 'Impressive Snake',
      file: { uri: require('../../assets/audio/metal-gear-solid-impressive-snake.mp3') },
      description: 'MGS impressive Snake voice clip'
    },
    {
      id: 'kept_waiting',
      name: 'Kept You Waiting',
      file: { uri: require('../../assets/audio/mgs2-snake-kept-you-waiting-huh.mp3') },
      description: 'MGS2 Snake kept you waiting voice clip'
    },
    {
      id: 'codec_close',
      name: 'Codec Close',
      file: { uri: require('../../assets/audio/metal_gear_solid_exit_sound_effect.mp3') },
      description: 'MGS codec communication close sound'
    }
  ];

  // User interaction sounds (non-codec related)
  private readonly userSounds: CodecSound[] = [
    {
      id: 'rations',
      name: 'Rations',
      file: { uri: require('../../assets/audio/mgs-rations.mp3') },
      description: 'MGS rations pickup sound'
    },
    {
      id: 'item_drop',
      name: 'Item Drop',
      file: { uri: require('../../assets/audio/metal-gear-item-drop.mp3') },
      description: 'MGS item acquisition sound'
    },
    {
      id: 'reflex_mode',
      name: 'Reflex Mode',
      file: { uri: require('../../assets/audio/mgs-reflex-mode.mp3') },
      description: 'MGS reflex mode activation'
    },
    {
      id: 'impressive_snake',
      name: 'Impressive Snake',
      file: { uri: require('../../assets/audio/metal-gear-solid-impressive-snake.mp3') },
      description: 'MGS impressive Snake voice clip'
    },
    {
      id: 'if_you_say_so',
      name: 'If You Say So',
      file: { uri: require('../../assets/audio/mgs2-snake-if-you-say-so.mp3') },
      description: 'MGS2 Snake voice clip'
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
        // On web, defer preloading until first user interaction
        console.log('[CODEC AUDIO] Web platform detected - deferring sound preloading');
      }
      
      this.isInitialized = true;
      console.log('[CODEC AUDIO] Service initialized successfully');
    } catch (error) {
      console.error('[CODEC AUDIO] Failed to initialize:', error);
      throw error;
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

        const { sound: newSound } = await Audio.Sound.createAsync(codecSound.file);
        sound = newSound;
        this.sounds.set(soundId, sound);
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
  async playRandomUserSound(): Promise<void> {
    if (this.userSounds.length === 0) {
      console.warn('[CODEC AUDIO] No user sounds available');
      return;
    }

    try {
      // Select a random sound from user sounds
      const randomIndex = Math.floor(Math.random() * this.userSounds.length);
      const selectedSound = this.userSounds[randomIndex];
      
      console.log(`[CODEC AUDIO] Playing random user sound: ${selectedSound.name}`);
      
      // Play with reduced volume for UI feedback
      await this.playSound(selectedSound.id, {
        volume: this.settings.volume * 0.8, // Slightly quieter for UI sounds
      });
    } catch (error) {
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
export const getCodecAudioSettings = () => codecAudioService.getSettings();
export const updateCodecAudioSettings = (settings: Partial<AudioSettings>) => 
  codecAudioService.updateSettings(settings);
