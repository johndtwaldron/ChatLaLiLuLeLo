import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  Image,
  View,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';

import { getCodecTheme, subscribeToThemeChanges, codecTheme, getCurrentColonelPortrait, getCurrentBitcoinColonelPortrait, getCurrentMode } from '@/lib/theme';
import { asImg } from '@/lib/asset';
import { getNextRickImage, getNextRickAudio, getCurrentRickImage } from '@/lib/rickAssets';

// Import colonel portraits - unified compatibility for local and web
// Renamed for clarity: GW mode uses haywire, JD mode uses normal
const colonelImages = [
  asImg(require('../../assets/images/colonel_gw_haywire.jpeg')), // 0 - GW/Haywire mode
  asImg(require('../../assets/images/colonel_jd_normal.jpg')),    // 1 - JD mode
  asImg(require('../../assets/images/colonel_default.jpg')),       // 2 - Default/cycling
];

// Import Bitcoin colonel portraits - real Bitcoin images
const bitcoinColonelImages = [
  asImg(require('../../assets/images/btc_mode/MGBitcoin.GPT.Sayloresque.png')), // 0 - Sayloresque (Michael Saylor style)
  asImg(require('../../assets/images/btc_mode/MGBitcoin.GPT.Keiseresque.png')), // 1 - Keiseresque (Max Keiser style)
  asImg(require('../../assets/images/btc_mode/MGBitcoin.GPT.Miner.png')), // 2 - Miner (Bitcoin miner style)
  asImg(require('../../assets/images/btc_mode/MGBitcoin.GPT.S3.png')), // 3 - S3 (Satoshi style)
  asImg(require('../../assets/images/btc_mode/MGBitcoin.GPT.png')), // 4 - GPT (General Bitcoin maximalist)
];

// Rick mode audio playback state (module level to prevent stacking)
let isRickAudioPlaying = false;
let currentRickAudio: HTMLAudioElement | null = null;

// Event system for Rick audio (similar to user SFX)
const rickAudioListeners = new Set<(e: { type: 'start' | 'stop'; fileName: string }) => void>();
const emitRickAudio = (e: { type: 'start' | 'stop'; fileName: string }) => {
  rickAudioListeners.forEach((fn) => {
    try { fn(e); } catch (err) {
      console.error('[RICK] Listener error:', err);
    }
  });
};

export const subscribeToRickAudio = (listener: (e: { type: 'start' | 'stop'; fileName: string }) => void) => {
  rickAudioListeners.add(listener);
  return () => rickAudioListeners.delete(listener);
};

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
  // mouthFrame = 0, // Future use for mouth animation
}) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const idleAnimation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  
  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

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

  const renderColonelPortrait = () => {
    const currentMode = getCurrentMode();
    const isBitcoinMode = currentMode === 'bitcoin';
    const isRickMode = currentMode === 'rick';
    
    // Rick mode: use cycler for portrait images
    let currentColonelImage: any;
    let labelText: string;
    
    if (isRickMode) {
      currentColonelImage = getCurrentRickImage();
      labelText = 'BOGART';
    } else {
      // Select appropriate image set and index based on mode
      const currentPortraitIndex = isBitcoinMode 
        ? getCurrentBitcoinColonelPortrait() 
        : getCurrentColonelPortrait();
      const imageSet = isBitcoinMode ? bitcoinColonelImages : colonelImages;
      currentColonelImage = imageSet[currentPortraitIndex];
      labelText = isBitcoinMode ? 'BITCOIN BOSS' : 'COLONEL';
    }
    
    // Add dev log to verify portrait source
    if (__DEV__) {
      console.log('[PORTRAIT] colonel source =', currentColonelImage, 'mode =', currentMode);
    }
    
    // Handle portrait click for Rick mode
    const handlePortraitClick = async () => {
      // Guard: Only active in Rick mode
      if (!isRickMode) {
        return;
      }
      
      // Guard: Prevent audio stacking
      if (isRickAudioPlaying) {
        console.log('[RICK] Audio already playing, ignoring click');
        return;
      }
      
      // Cycle to next image
      getNextRickImage();
      
      // Get next audio and play
      const audioSource = getNextRickAudio();
      if (audioSource) {
        // Extract filename from URL for display
        const fileName = audioSource.split('/').pop()?.split('.')[0] || 'unknown';
        
        isRickAudioPlaying = true;
        emitRickAudio({ type: 'start', fileName });
        
        try {
          // Stop any existing audio
          if (currentRickAudio) {
            currentRickAudio.pause();
            currentRickAudio = null;
          }
          
          // Create and play new audio
          currentRickAudio = new Audio(audioSource);
          currentRickAudio.volume = 0.8;
          
          currentRickAudio.onended = () => {
            isRickAudioPlaying = false;
            currentRickAudio = null;
            emitRickAudio({ type: 'stop', fileName });
            console.log('[RICK] Audio playback finished');
          };
          
          currentRickAudio.onerror = (error) => {
            console.error('[RICK] Audio playback error:', error);
            isRickAudioPlaying = false;
            currentRickAudio = null;
            emitRickAudio({ type: 'stop', fileName });
          };
          
          await currentRickAudio.play();
          console.log(`[RICK] Playing audio: ${fileName}`);
          
        } catch (error) {
          console.error('[RICK] Failed to play audio:', error);
          isRickAudioPlaying = false;
          currentRickAudio = null;
          emitRickAudio({ type: 'stop', fileName });
        }
      }
      
      // Force re-render to show new image
      setCurrentTheme(getCodecTheme());
    };
    
    return (
      <View style={[styles.portraitContent, { backgroundColor: currentTheme.colors.surface }]}>
        {/* Colonel portrait image */}
        <Pressable 
          style={[styles.spriteContainer, styles.colonelImageContainer]}
          onPress={handlePortraitClick}
        >
          <Image 
            source={currentColonelImage}
            style={[
              styles.colonelImage,
              {
                opacity: isSpeaking ? 1 : 0.9,
                // Add subtle border glow effect when speaking
                ...(isSpeaking && {
                  shadowColor: currentTheme.colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                  elevation: 8,
                })
              }
            ]}
            resizeMode="cover"
          />
        
          {/* Speaking indicator overlay */}
          {isSpeaking && (
            <View style={[styles.speakingIndicator, { borderColor: currentTheme.colors.primary }]} />
          )}
        </Pressable>
        
        {/* ID Label - changes based on mode */}
        <View style={[styles.idLabel, { backgroundColor: currentTheme.colors.surface, borderTopColor: currentTheme.colors.border }]}>
          <Text style={[styles.idText, { color: currentTheme.colors.textSecondary }]}>{labelText}</Text>
        </View>
      </View>
    );
  };

  const renderUserPortrait = () => {
    const currentMode = getCurrentMode();
    
    // User label changes based on conversation mode
    const USER_LABEL_BY_MODE: Record<string, string> = {
      haywire: 'SOLDIER',
      jd: 'AGENT',
      lore: 'SOLDIER',
      bitcoin: 'STACKER',
      rick: 'PATRON',
    };
    
    const userLabel = USER_LABEL_BY_MODE[currentMode] || 'SOLDIER';
    
    return (
      <View style={[styles.portraitContent, { backgroundColor: currentTheme.colors.surface }]}>
        {/* User silhouette */}
        <View style={[styles.spriteContainer, styles.userSprite]}>
          <View style={[styles.silhouette, { backgroundColor: currentTheme.colors.tertiary }]}>
            <Text style={[styles.silhouetteText, { color: currentTheme.colors.textSecondary }]}>USER</Text>
          </View>
        </View>
        
        {/* ID Label */}
        <View style={[styles.idLabel, { backgroundColor: currentTheme.colors.surface, borderTopColor: currentTheme.colors.border }]}>
          <Text style={[styles.idText, { color: currentTheme.colors.textSecondary }]}>{userLabel}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { margin: currentTheme.spacing.sm }]}>
      <Animated.View style={[
        styles.portraitFrame, 
        animatedContainerStyle,
        { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }
      ]}>
        {/* Glow effect */}
        <Animated.View style={[styles.glow, animatedGlowStyle, { backgroundColor: currentTheme.colors.primary }]} />
        
        {/* Portrait content */}
        {type === 'colonel' ? renderColonelPortrait() : renderUserPortrait()}
        
        {/* Frame border */}
        <View style={[styles.frameBorder, { borderColor: currentTheme.colors.primary }]} />
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
  
  userSprite: {
    // Placeholder styling for user sprite
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
  
  colonelImageContainer: {
    width: 80,
    height: 90,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  
  colonelImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  
  speakingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 4,
    borderStyle: 'solid',
  },
});
