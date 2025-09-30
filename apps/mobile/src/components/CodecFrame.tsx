import React, { useEffect, useState } from 'react';
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

import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';

interface CodecFrameProps {
  children: React.ReactNode;
  haywireMode?: boolean;
}

export const CodecFrame: React.FC<CodecFrameProps> = ({ 
  children, 
  haywireMode = false 
}) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const jitterX = useSharedValue(0);
  const jitterY = useSharedValue(0);
  const scanlineOffset = useSharedValue(0);
  
  // Subscribe to theme changes (including CRT toggle)
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

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
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={currentTheme.colors.background}
      />
      
      {/* Main content with jitter */}
      <Animated.View style={[styles.content, animatedContainerStyle]}>
        {children}
      </Animated.View>

      {/* CRT Effects - only show when CRT is enabled */}
      {currentTheme.crt && (
        <>
          {/* Scanlines overlay */}
          <View style={styles.scanlinesContainer}>
            {Array.from({ length: Math.ceil(Dimensions.get('window').height / currentTheme.effects.scanlineSpacing) }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.scanline,
                  { 
                    top: index * currentTheme.effects.scanlineSpacing,
                    height: currentTheme.effects.scanlineHeight,
                    backgroundColor: currentTheme.colors.scanline,
                  },
                ]}
              />
            ))}
          </View>

          {/* Moving scanline effect */}
          <Animated.View style={[
            styles.movingScanline, 
            animatedScanlineStyle, 
            { backgroundColor: currentTheme.colors.primary }
          ]} />

          {/* CRT glow overlay */}
          <View style={[styles.glowOverlay, { backgroundColor: currentTheme.colors.glow }]} />
          
          {/* Border frame */}
          <View style={[styles.borderFrame, { borderColor: currentTheme.colors.border }]} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    opacity: 0.3,
  },
  
  movingScanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
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
    pointerEvents: 'none',
    zIndex: 5,
  },
});
