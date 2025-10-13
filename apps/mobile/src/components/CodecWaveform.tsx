/**
 * Codec Waveform Component
 * 
 * MGS2-inspired audio visualization that displays animated waveforms during TTS playback.
 * Features dynamic theme color support and authentic codec-style animation.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { getCodecTheme } from '@/lib/theme';

interface CodecWaveformProps {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Volume level (0-1) affects animation intensity */
  volume?: number;
  /** Override theme color */
  color?: string;
  /** Waveform height */
  height?: number;
  /** Waveform width */
  width?: number;
  /** Animation style variant */
  variant?: 'standard' | 'codec' | 'minimal';
}

export const CodecWaveform: React.FC<CodecWaveformProps> = ({
  isPlaying = false,
  volume = 0.7,
  color,
  height = 60,
  width,
  variant = 'codec'
}) => {
  const [theme, setTheme] = useState(getCodecTheme());
  const waveColor = color || theme.colors.primary;
  const screenWidth = Dimensions.get('window').width;
  const waveformWidth = width || Math.min(screenWidth * 0.8, 300);
  
  // Update theme when it changes (e.g., user presses theme button during playback)
  useEffect(() => {
    const updateTheme = () => {
      const currentTheme = getCodecTheme();
      setTheme(currentTheme);
    };
    
    // Set up theme monitoring with faster updates during playback
    const interval = setInterval(updateTheme, isPlaying ? 500 : 2000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  // Number of wave bars based on width
  const barCount = Math.floor(waveformWidth / 6);
  
  // Animation values for each bar
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0))
  ).current;
  
  // Animation loop reference
  const animationLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Generate wave animation pattern
  const generateWaveAnimation = () => {
    const animations = animatedValues.map((value, index) => {
      // Create varied timing for more natural wave effect
      const delay = (index / barCount) * 200;
      const baseHeight = 0.2 + (Math.sin(index * 0.5) + 1) * 0.3; // 0.2 to 0.8
      const volumeMultiplier = Math.max(0.1, volume); // Never go completely flat
      
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: baseHeight * volumeMultiplier,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0.1 * volumeMultiplier,
            duration: 200 + Math.random() * 100,
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: (0.4 + Math.random() * 0.4) * volumeMultiplier,
            duration: 250 + Math.random() * 150,
            useNativeDriver: false,
          }),
        ]),
        { iterations: -1 }
      );
    });

    return Animated.stagger(50, animations);
  };

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && volume > 0) {
      // Start wave animation
      animationLoop.current = generateWaveAnimation();
      animationLoop.current.start();
    } else {
      // Stop animation and fade to idle state
      if (animationLoop.current) {
        animationLoop.current.stop();
      }
      
      // Animate all bars to idle state
      const idleAnimations = animatedValues.map(value => 
        Animated.timing(value, {
          toValue: 0.05,
          duration: 500,
          useNativeDriver: false,
        })
      );
      
      Animated.parallel(idleAnimations).start();
    }

    // Cleanup on unmount
    return () => {
      if (animationLoop.current) {
        animationLoop.current.stop();
      }
    };
  }, [isPlaying, volume]);

  // Generate waveform bars
  const renderWaveformBars = () => {
    return animatedValues.map((animatedValue, index) => {
      const barStyle: any[] = [
        styles.waveBar,
        {
          backgroundColor: waveColor,
          shadowColor: waveColor,
        }
      ];

      if (variant === 'codec') {
        // MGS2 codec style with glow effect
        barStyle.push({
          shadowOpacity: 0.8,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 0 },
          borderRadius: 1,
        });
      }

      return (
        <Animated.View
          key={index}
          style={[
            barStyle,
            {
              height: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [2, height],
                extrapolate: 'clamp',
              }),
              opacity: animatedValue.interpolate({
                inputRange: [0, 0.1, 1],
                outputRange: [0.3, 0.6, 1],
                extrapolate: 'clamp',
              }),
            }
          ]}
        />
      );
    });
  };

  if (!isPlaying && volume === 0) {
    // Don't render when completely off
    return null;
  }

  const containerStyle: any[] = [
    styles.container,
    {
      width: waveformWidth,
      height: height + 10, // Extra space for glow
    }
  ];

  if (variant === 'codec') {
    containerStyle.push(styles.codecContainer);
  }

  return (
    <View style={containerStyle}>
      <View style={styles.waveformContainer}>
        {renderWaveformBars()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  codecContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
    padding: 5,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    height: '100%',
  },
  waveBar: {
    width: 3,
    minHeight: 2,
    borderRadius: 1.5,
  },
});
