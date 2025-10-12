/**
 * Voice Playing State Hook
 * 
 * React hook to monitor TTS audio playing state and voice configuration
 * for use with the codec waveform visualization.
 */

import { useState, useEffect } from 'react';
import { getVoiceServiceStatus } from '@/lib/voice/VoiceService';
import { getVoiceConfig } from '@/lib/voice';

export interface VoicePlayingState {
  isPlaying: boolean;
  volume: number;
  enabled: boolean;
  initialized: boolean;
}

/**
 * Hook to monitor voice service audio playing state
 * Updates every 200ms to provide real-time status for waveform animation
 */
export const useVoicePlayingState = (): VoicePlayingState => {
  const [state, setState] = useState<VoicePlayingState>({
    isPlaying: false,
    volume: 0,
    enabled: false,
    initialized: false,
  });

  useEffect(() => {
    const updateState = () => {
      try {
        const voiceStatus = getVoiceServiceStatus();
        const voiceConfig = getVoiceConfig();
        
        setState({
          isPlaying: voiceStatus.isPlaying || false,
          volume: voiceConfig.volume || 0,
          enabled: voiceConfig.enabled || false,
          initialized: voiceStatus.initialized || false,
        });
      } catch (error) {
        // Gracefully handle errors if voice service isn't ready
        setState(prev => ({
          ...prev,
          isPlaying: false,
        }));
      }
    };

    // Initial update
    updateState();

    // Set up polling for real-time updates
    // 200ms provides smooth waveform animation without excessive CPU usage
    const interval = setInterval(updateState, 200);

    return () => clearInterval(interval);
  }, []);

  return state;
};
