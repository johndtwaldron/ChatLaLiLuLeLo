import React, { useMemo, useState, useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Portrait } from '@/components/Portrait';
import { LightningQR } from '@/components/LightningQR';
import { cycleColonelPortrait, getCurrentMode, subscribeToThemeChanges } from '@/lib/theme';
import { playRandomUserSound } from '@/lib/audio';
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
  style,
}) => {
  const [currentMode, setCurrentMode] = useState(getCurrentMode());
  const [showLightningQR, setShowLightningQR] = useState(false);

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
  // Portrait size is currently fixed by Portrait styles: 120x140
  const portraitSize = useMemo(() => ({ width: 120, height: 140 }), []);

  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);

  // Clamp to container bounds
  const clampToContainer = (x: number, y: number) => {
    const maxX = Math.max(0, container.width - portraitSize.width);
    const maxY = Math.max(0, container.height - portraitSize.height);
    const clampedX = Math.min(Math.max(0, x), maxX);
    const clampedY = Math.min(Math.max(0, y), maxY);
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

      // Choose smallest displacement axis
      const minPush = Math.min(pushLeft, pushRight, pushUp, pushDown);
      if (minPush === pushLeft) rect.x = otherRect.x - rect.width;
      else if (minPush === pushRight) rect.x = otherRect.x + otherRect.width;
      else if (minPush === pushUp) rect.y = otherRect.y - rect.height;
      else rect.y = otherRect.y + otherRect.height;

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
        console.log('[DRAGGABLE PORTRAIT] User portrait clicked - playing random sound');
      }
    }
  };

  // Handle Lightning QR copy success
  const handleLightningCopy = (success: boolean) => {
    if (success) {
      console.log('[DRAGGABLE PORTRAIT] Lightning address copied successfully');
      // Sound is handled by LightningQR component (rations sound)
    } else {
      console.warn('[DRAGGABLE PORTRAIT] Failed to copy lightning address');
    }
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
      
      // Notify parent of position change
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

