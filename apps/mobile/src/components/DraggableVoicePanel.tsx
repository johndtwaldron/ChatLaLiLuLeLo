/**
 * Draggable Voice Panel Component
 * 
 * A draggable wrapper for the CodecWaveform that maintains boundaries
 * and collision detection similar to the draggable portraits.
 */

import React, { useMemo, useRef } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { CodecWaveform } from '@/components/CodecWaveform';
import type { Rect } from '@/components/DraggablePortrait';

interface DraggableVoicePanelProps {
  initialX: number;
  initialY: number;
  container: Rect; // bounds to stay within
  portraitPositions?: { x: number; y: number }[]; // positions of portraits to avoid
  onPositionChange?: (x: number, y: number) => void; // callback when this panel moves
  isPlaying: boolean;
  volume?: number;
  height?: number;
  width?: number;
  debugMode?: boolean; // Enable debug logging (default: false)
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

export const DraggableVoicePanel: React.FC<DraggableVoicePanelProps> = ({
  initialX,
  initialY,
  container,
  portraitPositions = [],
  onPositionChange,
  isPlaying,
  volume = 0.7,
  height = 40,
  width = 300,
  debugMode = false,
  style,
}) => {
  // Throttling for position updates to prevent console flooding
  const lastPositionUpdateTime = useRef(0);
  const positionUpdateThrottleMs = 16; // ~60fps max

  // Voice panel dimensions
  const panelSize = useMemo(() => ({ 
    width: Math.min(width, container.width * 0.8), 
    height: height + 20 // Extra space for glow and padding
  }), [width, height, container.width]);

  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);

  // Clamp to container bounds
  const clampToContainer = (x: number, y: number) => {
    const maxX = Math.max(0, container.width - panelSize.width);
    const maxY = Math.max(0, container.height - panelSize.height);
    
    const clampedX = Math.min(Math.max(0, x), maxX);
    const clampedY = Math.min(Math.max(0, y), maxY);
    
    // Remove debug logging to prevent console flooding
    
    return { x: clampedX, y: clampedY };
  };

  // Adjust to avoid portraits by nudging away on overlap
  const avoidPortraits = (x: number, y: number) => {
    if (portraitPositions.length === 0) return { x, y };
    
    const panelRect: Rect = { x, y, width: panelSize.width, height: panelSize.height };
    const portraitSize = { width: 120, height: 140 }; // Standard portrait size
    
    let adjustedX = x;
    let adjustedY = y;
    
    for (const portraitPos of portraitPositions) {
      const portraitRect: Rect = {
        x: portraitPos.x,
        y: portraitPos.y,
        width: portraitSize.width,
        height: portraitSize.height
      };
      
      if (isOverlap({ x: adjustedX, y: adjustedY, width: panelSize.width, height: panelSize.height }, portraitRect)) {
        // Compute minimal displacement (prefer horizontal movement)
        const pushLeft = adjustedX + panelSize.width - portraitRect.x;
        const pushRight = portraitRect.x + portraitRect.width - adjustedX;
        const pushUp = adjustedY + panelSize.height - portraitRect.y;
        const pushDown = portraitRect.y + portraitRect.height - adjustedY;

        // Choose smallest displacement, preferring horizontal movement for voice panel
        const minPush = Math.min(pushLeft, pushRight, pushUp, pushDown);
        if (minPush === pushLeft) adjustedX = portraitRect.x - panelSize.width;
        else if (minPush === pushRight) adjustedX = portraitRect.x + portraitRect.width;
        else if (minPush === pushUp) adjustedY = portraitRect.y - panelSize.height;
        else adjustedY = portraitRect.y + portraitRect.height;
      }
    }
    
    // After nudging, re-clamp to container
    const clamped = clampToContainer(adjustedX, adjustedY);
    return { x: clamped.x, y: clamped.y };
  };

  // Track if we're dragging
  const isDragging = useSharedValue(false);
  const dragThreshold = 5; // pixels

  const tap = Gesture.Tap()
    .maxDuration(250) // Quick tap only
    .onEnd(() => {
      // Voice panel tap - no logging to prevent console flooding
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
      const adjusted = avoidPortraits(clamped.x, clamped.y);
      translateX.value = adjusted.x;
      translateY.value = adjusted.y;
      
      // Notify parent of position change (remove throttling to prevent issues)
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
    // Ensure voice panel stays above portraits but below debug panels
    zIndex: 100,
    elevation: 5,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[animatedStyle, style]}>
        <CodecWaveform
          isPlaying={isPlaying}
          volume={volume}
          height={height}
          width={panelSize.width}
          variant="codec"
        />
      </Animated.View>
    </GestureDetector>
  );
};
