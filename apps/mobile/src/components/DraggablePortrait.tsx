import React, { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Portrait } from '@/components/Portrait';

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
  style,
}) => {
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

  const pan = Gesture.Pan()
    .onChange((e) => {
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
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    position: 'absolute',
    left: 0,
    top: 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[animatedStyle, style]}>
        <Portrait type={type} isActive={type === 'colonel'} isSpeaking={false} />
      </Animated.View>
    </GestureDetector>
  );
};

