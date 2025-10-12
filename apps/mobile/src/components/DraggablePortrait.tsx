import React, { useMemo, useState, useEffect } from 'react';
import { ViewStyle, View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Portrait } from '@/components/Portrait';
import { LightningQR } from '@/components/LightningQR';
import { cycleColonelPortrait, getCodecTheme, getCurrentMode, subscribeToThemeChanges } from '@/lib/theme';
import { playRandomUserSound, subscribeToUserSfx } from '@/lib/audio';
import { isBitcoinModeActive } from '@/lib/lightning';

export interface Rect {
  x: number; // relative to container
  y: number;
  width: number;
  height: number;
}

interface DraggablePortraitProps {
  type: 'colonel' | 'user';
  initialX: number;
  initialY: number;
  container: Rect; // bounds to stay within
  otherPortraitPosition?: { x: number; y: number }; // position of the other draggable portrait
  onPositionChange?: (x: number, y: number) => void; // callback when this portrait moves
  lightningAddress?: string; // Lightning address for donations (user portrait only)
  waveformHeight?: number; // Height of waveform to avoid (creates top boundary)
  style?: ViewStyle;
}

// Simple AABB overlap check
const isOverlap = (a: Rect, b: Rect) => {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
};

export const DraggablePortrait: React.FC<DraggablePortraitProps> = ({
  type,
  initialX,
  initialY,
  container,
  otherPortraitPosition,
  onPositionChange,
  lightningAddress,
  waveformHeight = 0,
  style,
}) => {
  const [currentMode, setCurrentMode] = useState(getCurrentMode());
  const [showLightningQR, setShowLightningQR] = useState(false);
  // UI overlay for current SFX file name while playing
  const [currentSfxFile, setCurrentSfxFile] = useState<string | null>(null);
  const [sfxPlaying, setSfxPlaying] = useState(false);

  // Subscribe to mode/theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      const newMode = getCurrentMode();
      setCurrentMode(newMode);
      
      // Show Lightning QR for user portrait when in Bitcoin mode
      if (type === 'user') {
        setShowLightningQR(isBitcoinModeActive(newMode));
      }
    });
    return unsubscribe;
  }, [type]);

  // Initialize Lightning QR visibility
  useEffect(() => {
    if (type === 'user') {
      setShowLightningQR(isBitcoinModeActive(currentMode));
    }
  }, [type, currentMode]);

  // Subscribe to user SFX events to show/hide filename overlay (user portrait only)
  useEffect(() => {
    if (type !== 'user') return;
    const off = subscribeToUserSfx((e) => {
      if (e.type === 'start') {
        setCurrentSfxFile(e.fileName || e.name);
        setSfxPlaying(true);
      } else {
        setSfxPlaying(false);
        setCurrentSfxFile(null);
      }
    });
    return () => { if (off) { off(); } };
  }, [type]);
  // Portrait size is currently fixed by Portrait styles: 120x140
  const portraitSize = useMemo(() => ({ width: 120, height: 140 }), []);

  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  
  // Ensure shared values are updated when initial positions change
  useEffect(() => {
    translateX.value = initialX;
    translateY.value = initialY;
  }, [initialX, initialY, translateX, translateY]);

  // Clamp to container bounds with waveform exclusion zone
  const clampToContainer = (x: number, y: number) => {
    const maxX = Math.max(0, container.width - portraitSize.width);
    const maxY = Math.max(0, container.height - portraitSize.height);
    
    // Clamp X to container bounds
    let clampedX = Math.min(Math.max(0, x), maxX);
    let clampedY = y;
    
    // Define waveform exclusion zone (if waveform is present)
    if (waveformHeight > 0) {
      const waveformTop = Math.max(0, waveformHeight - 56); // Top of waveform area
      const waveformBottom = waveformHeight; // Bottom of waveform area
      const waveformLeft = container.width * 0.25; // Left edge of waveform (center 50%)
      const waveformRight = container.width * 0.75; // Right edge of waveform
      
      // Check if portrait would overlap with waveform area
      const portraitLeft = clampedX;
      const portraitRight = clampedX + portraitSize.width;
      const portraitTop = y;
      const portraitBottom = y + portraitSize.height;
      
      // If portrait overlaps with waveform area, push it away
      if (portraitLeft < waveformRight && portraitRight > waveformLeft &&
          portraitTop < waveformBottom && portraitBottom > waveformTop) {
        
        // Calculate distances to each edge to find closest exit
        const distToLeft = waveformLeft - portraitRight;
        const distToRight = portraitLeft - waveformRight;
        const distToTop = waveformTop - portraitBottom;
        const distToBottom = portraitTop - waveformBottom;
        
        // Find the minimum distance (easiest exit)
        const minDist = Math.min(
          Math.abs(distToLeft),
          Math.abs(distToRight), 
          Math.abs(distToTop),
          Math.abs(distToBottom)
        );
        
        // Push portrait to the closest non-overlapping position
        if (minDist === Math.abs(distToLeft) && distToLeft < 0) {
          clampedX = waveformLeft - portraitSize.width;
        } else if (minDist === Math.abs(distToRight) && distToRight > 0) {
          clampedX = waveformRight;
        } else if (minDist === Math.abs(distToTop) && distToTop < 0) {
          clampedY = waveformTop - portraitSize.height;
        } else if (minDist === Math.abs(distToBottom) && distToBottom > 0) {
          clampedY = waveformBottom;
        }
        
        // Ensure we stay within container bounds after exclusion zone adjustment
        clampedX = Math.min(Math.max(0, clampedX), maxX);
        clampedY = Math.min(Math.max(0, clampedY), maxY);
      } else {
        // No overlap with waveform, just clamp to container bounds
        clampedY = Math.min(Math.max(0, y), maxY);
      }
    } else {
      // No waveform present, just clamp to container bounds
      clampedY = Math.min(Math.max(0, y), maxY);
    }
    
    
    return { x: clampedX, y: clampedY };
  };

  // Adjust to avoid other portrait by nudging away on overlap
  const avoidOtherPortrait = (x: number, y: number) => {
    if (!otherPortraitPosition) return { x, y };
    
    const rect: Rect = { x, y, width: portraitSize.width, height: portraitSize.height };
    const otherRect: Rect = {
      x: otherPortraitPosition.x,
      y: otherPortraitPosition.y,
      width: portraitSize.width,
      height: portraitSize.height
    };
    
    if (isOverlap(rect, otherRect)) {
      // Compute minimal displacement (push horizontally or vertically depending on least overlap)
      const pushLeft = rect.x + rect.width - otherRect.x; // move rect left
      const pushRight = otherRect.x + otherRect.width - rect.x; // move rect right
      const pushUp = rect.y + rect.height - otherRect.y; // move rect up
      const pushDown = otherRect.y + otherRect.height - rect.y; // move rect down

      // Choose smallest displacement axis, but respect waveform boundary
      const minWaveformY = waveformHeight > 0 ? waveformHeight : 0;
      const minPush = Math.min(pushLeft, pushRight, pushUp, pushDown);
      
      if (minPush === pushLeft) {
        rect.x = otherRect.x - rect.width;
      } else if (minPush === pushRight) {
        rect.x = otherRect.x + otherRect.width;
      } else if (minPush === pushUp) {
        const newY = otherRect.y - rect.height;
        // Don't push above waveform boundary - prefer horizontal displacement instead
        if (newY < minWaveformY) {
          // Try horizontal displacement instead
          if (pushLeft < pushRight) {
            rect.x = otherRect.x - rect.width;
          } else {
            rect.x = otherRect.x + otherRect.width;
          }
        } else {
          rect.y = newY;
        }
      } else {
        rect.y = otherRect.y + otherRect.height;
      }

      // After nudge, re-clamp to container
      const clamped = clampToContainer(rect.x, rect.y);
      return { x: clamped.x, y: clamped.y };
    }
    return { x, y };
  };

  // Handle portrait interactions on tap
  const handlePortraitInteraction = () => {
    if (type === 'colonel') {
      // Cycle colonel portrait images
      cycleColonelPortrait();
    } else if (type === 'user') {
      // In Bitcoin mode, Lightning QR handles its own interactions
      // Otherwise, play random sound effect for user clicks
      if (!showLightningQR) {
        playRandomUserSound();
        // Sound feedback only, no console logging
      }
    }
  };

  // Handle Lightning QR copy success
  const handleLightningCopy = (success: boolean) => {
    if (success) {
      // Success handled by LightningQR component
      // Sound is handled by LightningQR component (rations sound)
    }
    // Error handling is managed by LightningQR component
  };

  // Track if we're dragging to prevent cycling on drag end
  const isDragging = useSharedValue(false);
  const dragThreshold = 5; // pixels

  const tap = Gesture.Tap()
    .maxDuration(250) // Quick tap only
    .onEnd(() => {
      // Only trigger interaction if we're not dragging
      if (!isDragging.value) {
        runOnJS(handlePortraitInteraction)();
      }
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      isDragging.value = false;
    })
    .onChange((e) => {
      // Check if we've moved enough to be considered dragging
      const totalMovement = Math.abs(e.translationX) + Math.abs(e.translationY);
      if (totalMovement > dragThreshold) {
        isDragging.value = true;
      }
      
      const nextX = translateX.value + e.changeX;
      const nextY = translateY.value + e.changeY;
      const clamped = clampToContainer(nextX, nextY);
      const adjusted = avoidOtherPortrait(clamped.x, clamped.y);
      translateX.value = adjusted.x;
      translateY.value = adjusted.y;
      
      // Notify parent of position change (remove throttling to prevent console flood)
      if (onPositionChange) {
        runOnJS(onPositionChange)(adjusted.x, adjusted.y);
      }
    })
    .onEnd(() => {
      // Spring settle to final integer pixel to avoid subpixel blur
      const finalX = Math.round(translateX.value);
      const finalY = Math.round(translateY.value);
      translateX.value = withSpring(finalX);
      translateY.value = withSpring(finalY);
      
      // Notify parent of final position
      if (onPositionChange) {
        runOnJS(onPositionChange)(finalX, finalY);
      }
      
      // Reset dragging state after a short delay
      setTimeout(() => {
        isDragging.value = false;
      }, 100);
    });

  // Use Race gesture - tap wins over pan for quick taps
  const composed = Gesture.Race(tap, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    position: 'absolute',
    left: 0,
    top: 0,
    // Ensure Lightning QR is above other UI elements
    ...(type === 'user' && showLightningQR && {
      zIndex: 9999,
      elevation: 20,
    }),
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[animatedStyle, style]}>
        {/* Filename overlay above the user box while SFX is playing */}
        {type === 'user' && sfxPlaying && currentSfxFile && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -18,
              left: 0,
              right: 0,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: getCodecTheme().colors.primary,
                fontFamily: 'monospace',
                fontSize: 10,
              }}
            >
              {currentSfxFile}
            </Text>
          </View>
        )}

        {/* Show Lightning QR for user portrait in Bitcoin mode, otherwise show normal portrait */}
        {type === 'user' && showLightningQR ? (
          <LightningQR 
            lightningAddress={lightningAddress}
            size="small"
            onCopy={handleLightningCopy}
          />
        ) : (
          <Portrait type={type} isActive={type === 'colonel'} isSpeaking={false} />
        )}
      </Animated.View>
    </GestureDetector>
  );
};

