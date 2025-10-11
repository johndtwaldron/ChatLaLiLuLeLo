import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';
import { playCodecClose } from '@/lib/audio';

interface CodecStandbyProps {
  onReactivate: () => void;
  playCloseSound?: boolean; // Whether to play close sound on entry
}

export const CodecStandby: React.FC<CodecStandbyProps> = ({ onReactivate, playCloseSound = false }) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Play close sound when entering standby (only if specified)
    if (playCloseSound) {
      const playClose = async () => {
        try {
          await playCodecClose();
        } catch (error) {
          console.warn('[CODEC STANDBY] Failed to play close sound:', error);
        }
      };
      playClose();
    }

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulsing animation for frequency display
    const startPulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => startPulse());
    };

    startPulse();
  }, [playCloseSound]);

  const handleReactivate = async () => {
    // On web, first user interaction is the time to activate audio context
    if (typeof window !== 'undefined') {
      try {
        console.log('[CODEC STANDBY] Activating audio systems on user interaction...');
        
        // Initialize codec audio system
        const { initializeCodecAudio } = require('@/lib/audio');
        await initializeCodecAudio();
        
        // Initialize voice system for iOS
        try {
          const { voiceService } = require('@/lib/voice');
          await voiceService.initialize();
          
          // Get the voice engine's audio mixer and ensure it's activated
          const voiceEngine = voiceService.getEngine();
          if (voiceEngine?.audioMixer) {
            await voiceEngine.audioMixer.ensureAudioContextRunning();
            console.log('[CODEC STANDBY] Voice system audio context activated');
          }
        } catch (voiceError) {
          console.warn('[CODEC STANDBY] Voice system activation failed (may not be enabled):', voiceError);
        }
        
        // For iOS Safari - create and play a silent audio element to unlock audio
        const silentActivation = () => {
          const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==');
          audio.volume = 0;
          const playPromise = audio.play();
          if (playPromise) {
            playPromise.then(() => {
              console.log('[CODEC STANDBY] iOS Safari audio unlocked with silent audio');
              audio.pause();
              audio.remove();
            }).catch((e) => {
              console.log('[CODEC STANDBY] Silent audio activation not needed:', e.message);
            });
          }
        };
        
        // Check if we're on iOS Safari
        const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOSSafari) {
          silentActivation();
          console.log('[CODEC STANDBY] Applied iOS Safari audio activation fix');
        }
        
        console.log('[CODEC STANDBY] Audio context activation completed');
      } catch (error) {
        console.warn('[CODEC STANDBY] Failed to activate audio systems:', error);
      }
    }
    
    // Fade out before reactivating
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      onReactivate();
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar hidden />
      
      {/* Background with subtle grid */}
      <View style={styles.background}>
        {[...Array(10)].map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              {
                top: `${i * 10}%`,
                backgroundColor: currentTheme.colors.primary,
                opacity: 0.03,
                height: 1,
                width: '100%',
              },
            ]}
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              {
                left: `${i * 12.5}%`,
                backgroundColor: currentTheme.colors.primary,
                opacity: 0.03,
                width: 1,
                height: '100%',
              },
            ]}
          />
        ))}
      </View>

      {/* Main frequency display */}
      <View style={styles.centerContent}>
        <Animated.View style={[styles.frequencyContainer, { opacity: pulseAnim }]}>
          <Text style={[styles.frequencyLabel, { color: currentTheme.colors.secondary }]}>
            FREQUENCY
          </Text>
          <Text style={[styles.frequency, { color: currentTheme.colors.primary }]}>
            140.85
          </Text>
          <Text style={[styles.frequencyUnit, { color: currentTheme.colors.secondary }]}>
            MHz
          </Text>
        </Animated.View>

        {/* Status indicators */}
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: currentTheme.colors.secondary }]} />
            <Text style={[styles.statusText, { color: currentTheme.colors.secondary }]}>
              CODEC STANDBY
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: currentTheme.colors.primary, opacity: 0.3 }]} />
            <Text style={[styles.statusText, { color: currentTheme.colors.text, opacity: 0.3 }]}>
              SIGNAL IDLE
            </Text>
          </View>
        </View>
      </View>

      {/* Reactivate instruction */}
      <TouchableOpacity
        style={styles.reactivateArea}
        onPress={handleReactivate}
        activeOpacity={0.8}
      >
        <View style={[styles.reactivateButton, { borderColor: currentTheme.colors.primary }]}>
          <Text style={[styles.reactivateText, { color: currentTheme.colors.primary }]}>
            ◄ TAP TO REACTIVATE CODEC ►
          </Text>
        </View>
      </TouchableOpacity>

      {/* Subtle corner details */}
      <View style={[styles.cornerTL, { borderColor: currentTheme.colors.primary }]} />
      <View style={[styles.cornerTR, { borderColor: currentTheme.colors.primary }]} />
      <View style={[styles.cornerBL, { borderColor: currentTheme.colors.primary }]} />
      <View style={[styles.cornerBR, { borderColor: currentTheme.colors.primary }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  frequencyLabel: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 10,
  },
  frequency: {
    fontSize: 72,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 8,
    textShadowColor: 'currentColor',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  frequencyUnit: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 5,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  reactivateArea: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  reactivateButton: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 0.7,
  },
  reactivateText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Corner decorations
  cornerTL: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 20,
    height: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    opacity: 0.3,
  },
  cornerTR: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 20,
    height: 20,
    borderTopWidth: 1,
    borderRightWidth: 1,
    opacity: 0.3,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 20,
    height: 20,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    opacity: 0.3,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 20,
    height: 20,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    opacity: 0.3,
  },
});
