/**
 * Voice Box Component
 * 
 * A stationary voice waveform component that displays voice errors
 * and manages voice synthesis feedback.
 */

import React, { useState, useEffect } from 'react';
import { ViewStyle, View, Text, StyleSheet } from 'react-native';

import { getCodecTheme } from '@/lib/theme';

import { CodecWaveform } from '@/components/CodecWaveform';

interface VoiceBoxProps {
  isPlaying: boolean;
  volume?: number;
  height?: number;
  width?: number;
  style?: ViewStyle;
}

export const VoiceBox: React.FC<VoiceBoxProps> = ({
  isPlaying,
  volume = 0.7,
  height = 40,
  width = 300,
  style,
}) => {
  // Voice error state
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const theme = getCodecTheme();


  // Cleanup error timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [errorTimeout]);

  // Function to display voice error (called from external components)
  const displayVoiceError = (error: string) => {
    console.log('[VOICE BOX] Displaying error:', error); // Debug log
    
    // Clear existing timeout
    if (errorTimeout) {
      clearTimeout(errorTimeout);
    }

    // Determine themed error message based on error content
    let themedMessage = 'ERROR: Voice unavailable';
    if (error.includes('quota_exceeded') || error.includes('credits')) {
      themedMessage = 'ERROR: Voice unavailable: not enough drebin points';
    } else if (error.includes('network') || error.includes('401')) {
      themedMessage = 'ERROR: Voice unavailable: connection failed';
    }

    setVoiceError(themedMessage);

    // Auto-hide after 10 seconds
    const timeout = setTimeout(() => {
      setVoiceError(null);
      setErrorTimeout(null);
    }, 10000);
    
    setErrorTimeout(timeout);
  };

  // Expose error handler via global function
  useEffect(() => {
    console.log('[VOICE BOX] Registering global error handler'); // Debug log
    (globalThis as any).__voiceErrorHandler = displayVoiceError;
    return () => {
      console.log('[VOICE BOX] Unregistering global error handler'); // Debug log
      delete (globalThis as any).__voiceErrorHandler;
    };
  }, []);


  const styles = StyleSheet.create({
    errorContainer: {
      position: 'absolute',
      bottom: -35,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(200, 0, 0, 0.9)',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#FF4444',
      padding: 6,
      zIndex: 1000,
    },
    errorText: {
      color: theme.colors.primary,
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'center',
      textTransform: 'uppercase',
    },
  });

  return (
    <View style={[style, { position: 'relative' }]}>
      <CodecWaveform
        isPlaying={isPlaying}
        volume={volume}
        height={height}
        width={width}
        variant="codec"
      />
      
      {/* Voice Error Message */}
      {voiceError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{voiceError}</Text>
        </View>
      )}
    </View>
  );
};
