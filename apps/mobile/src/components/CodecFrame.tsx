import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import { codecTheme } from '@/lib/theme';

interface CodecFrameProps {
  children: React.ReactNode;
  haywireMode?: boolean;
}

export const CodecFrame: React.FC<CodecFrameProps> = ({ 
  children, 
  haywireMode = false 
}) => {
  const jitterX = useSharedValue(0);
  const jitterY = useSharedValue(0);
  const scanlineOffset = useSharedValue(0);

  useEffect(() => {
    // Subtle screen jitter animation
    const jitterIntensity = haywireMode ? 2 : 0.5;
    
    jitterX.value = withRepeat(
      withTiming(jitterIntensity, { duration: 100 }),
      -1,
      true
    );
    
    jitterY.value = withRepeat(
      withTiming(jitterIntensity, { duration: 120 }),
      -1,
      true
    );

    // Scanline animation
    scanlineOffset.value = withRepeat(
      withTiming(1, { duration: haywireMode ? 1000 : 3000 }),
      -1,
      false
    );
  }, [haywireMode]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: jitterX.value },
        { translateY: jitterY.value },
      ],
    };
  });

  const animatedScanlineStyle = useAnimatedStyle(() => {
    const { height: SCREEN_HEIGHT } = Dimensions.get('window');
    const translateY = interpolate(
      scanlineOffset.value,
      [0, 1],
      [-SCREEN_HEIGHT, SCREEN_HEIGHT]
    );

    return {
      transform: [{ translateY }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={codecTheme.colors.background}
      />
      
      {/* Main content with jitter */}
      <Animated.View style={[styles.content, animatedContainerStyle]}>
        {children}
      </Animated.View>

      {/* Scanlines overlay */}
      <View style={styles.scanlinesContainer}>
        {Array.from({ length: Math.ceil(Dimensions.get('window').height / codecTheme.effects.scanlineSpacing) }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.scanline,
              { top: index * codecTheme.effects.scanlineSpacing },
            ]}
          />
        ))}
      </View>

      {/* Moving scanline effect */}
      <Animated.View style={[styles.movingScanline, animatedScanlineStyle]} />

      {/* CRT glow overlay */}
      <View style={styles.glowOverlay} />
      
      {/* Border frame */}
      <View style={styles.borderFrame} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: codecTheme.colors.background,
    position: 'relative',
  },
  
  content: {
    flex: 1,
    zIndex: 1,
  },
  
  scanlinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 2,
  },
  
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: codecTheme.effects.scanlineHeight,
    backgroundColor: codecTheme.colors.scanline,
    opacity: 0.3,
  },
  
  movingScanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: codecTheme.colors.primary,
    opacity: 0.1,
    pointerEvents: 'none',
    zIndex: 3,
  },
  
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: codecTheme.colors.glow,
    pointerEvents: 'none',
    zIndex: 4,
  },
  
  borderFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: codecTheme.colors.border,
    pointerEvents: 'none',
    zIndex: 5,
  },
});
