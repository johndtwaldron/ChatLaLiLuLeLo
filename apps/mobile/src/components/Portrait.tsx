import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';

import { codecTheme } from '@/lib/theme';

interface PortraitProps {
  type: 'colonel' | 'user';
  isActive?: boolean;
  isSpeaking?: boolean;
  mouthFrame?: number; // 0-7 for mouth animation frames
}

export const Portrait: React.FC<PortraitProps> = ({
  type,
  isActive = false,
  isSpeaking = false,
  mouthFrame = 0,
}) => {
  const idleAnimation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    // Subtle idle animation (breathing/swaying)
    idleAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );

    // Glow effect when active
    glowIntensity.value = withTiming(isActive ? 1 : 0, { duration: 300 });
  }, [isActive]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      idleAnimation.value,
      [0, 1],
      [1, 1.02]
    );

    const translateY = interpolate(
      idleAnimation.value,
      [0, 1],
      [0, -2]
    );

    return {
      transform: [
        { scale },
        { translateY },
      ],
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      glowIntensity.value,
      [0, 1],
      [0, 0.6]
    );

    return {
      opacity,
    };
  });

  const renderColonelPortrait = () => (
    <View style={styles.portraitContent}>
      {/* Placeholder for colonel sprite */}
      <View style={[styles.spriteContainer, type === 'colonel' && styles.colonelSprite]}>
        <View style={styles.face}>
          <View style={styles.eye} />
          <View style={styles.eye} />
          <View style={[styles.mouth, { opacity: isSpeaking ? 1 : 0.7 }]}>
            {/* Mouth animation frames - simplified for now */}
            <View style={[
              styles.mouthShape,
              isSpeaking && mouthFrame > 0 && styles.mouthOpen
            ]} />
          </View>
        </View>
      </View>
      
      {/* ID Label */}
      <View style={styles.idLabel}>
        <Text style={styles.idText}>???</Text>
      </View>
    </View>
  );

  const renderUserPortrait = () => (
    <View style={styles.portraitContent}>
      {/* User silhouette */}
      <View style={[styles.spriteContainer, styles.userSprite]}>
        <View style={styles.silhouette}>
          <Text style={styles.silhouetteText}>USER</Text>
        </View>
      </View>
      
      {/* ID Label */}
      <View style={styles.idLabel}>
        <Text style={styles.idText}>SOLDIER</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.portraitFrame, animatedContainerStyle]}>
        {/* Glow effect */}
        <Animated.View style={[styles.glow, animatedGlowStyle]} />
        
        {/* Portrait content */}
        {type === 'colonel' ? renderColonelPortrait() : renderUserPortrait()}
        
        {/* Frame border */}
        <View style={styles.frameBorder} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 140,
    margin: codecTheme.spacing.sm,
  },
  
  portraitFrame: {
    flex: 1,
    position: 'relative',
    backgroundColor: codecTheme.colors.surface,
    borderWidth: 1,
    borderColor: codecTheme.colors.border,
  },
  
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: codecTheme.colors.primary,
    borderRadius: 4,
    zIndex: -1,
  },
  
  portraitContent: {
    flex: 1,
    padding: codecTheme.spacing.xs,
  },
  
  spriteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  colonelSprite: {
    // Placeholder styling for colonel sprite
  },
  
  userSprite: {
    // Placeholder styling for user sprite
  },
  
  face: {
    width: 60,
    height: 80,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: codecTheme.spacing.sm,
  },
  
  eye: {
    width: 8,
    height: 8,
    backgroundColor: codecTheme.colors.primary,
    borderRadius: 4,
    marginHorizontal: codecTheme.spacing.xs,
  },
  
  mouth: {
    width: 20,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  mouthShape: {
    width: 12,
    height: 4,
    backgroundColor: codecTheme.colors.primary,
    borderRadius: 2,
  },
  
  mouthOpen: {
    height: 8,
    backgroundColor: codecTheme.colors.secondary,
  },
  
  silhouette: {
    width: 60,
    height: 80,
    backgroundColor: codecTheme.colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  
  silhouetteText: {
    color: codecTheme.colors.textSecondary,
    fontSize: codecTheme.fonts.sizes.caption,
    fontFamily: codecTheme.fonts.mono,
  },
  
  idLabel: {
    height: 20,
    backgroundColor: codecTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: codecTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  idText: {
    color: codecTheme.colors.textSecondary,
    fontSize: codecTheme.fonts.sizes.caption,
    fontFamily: codecTheme.fonts.mono,
    letterSpacing: 1,
  },
  
  frameBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: codecTheme.colors.primary,
    opacity: 0.3,
    pointerEvents: 'none',
  },
});
