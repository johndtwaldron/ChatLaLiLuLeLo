import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { codecTheme } from '@/lib/theme';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SubtitleStreamProps {
  messages: Array<{
    id: string;
    text: string;
    speaker: 'colonel' | 'user';
    timestamp: number;
  }>;
  isStreaming?: boolean;
  currentStreamText?: string;
}

export const SubtitleStream: React.FC<SubtitleStreamProps> = ({
  messages,
  isStreaming = false,
  currentStreamText = '',
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [displayText, setDisplayText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  
  // const typingProgress = useSharedValue(0);
  const blinkOpacity = useSharedValue(1);

  // Typewriter effect for streaming text
  useEffect(() => {
    if (isStreaming && currentStreamText) {
      const timer = setTimeout(() => {
        if (charIndex < currentStreamText.length) {
          setDisplayText(currentStreamText.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }
      }, 50); // Adjust speed as needed

      return () => clearTimeout(timer);
    } else {
      setDisplayText(currentStreamText);
      setCharIndex(0);
    }
  }, [isStreaming, currentStreamText, charIndex]);

  // Cursor blink animation
  useEffect(() => {
    if (isStreaming) {
      blinkOpacity.value = 1;
      const blinkAnimation = () => {
        blinkOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
          if (finished) {
            blinkOpacity.value = withTiming(1, { duration: 500 }, () => {
              runOnJS(blinkAnimation)();
            });
          }
        });
      };
      blinkAnimation();
    } else {
      blinkOpacity.value = 0;
    }
  }, [isStreaming]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, displayText]);

  const animatedCursorStyle = useAnimatedStyle(() => {
    return {
      opacity: blinkOpacity.value,
    };
  });

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getSpeakerLabel = (speaker: 'colonel' | 'user') => {
    return speaker === 'colonel' ? '>>>' : '<<<';
  };

  const getSpeakerColor = (speaker: 'colonel' | 'user') => {
    return speaker === 'colonel' ? codecTheme.colors.primary : codecTheme.colors.secondary;
  };

  return (
    <View style={styles.container}>
      {/* Header with frequency indicator */}
      <View style={styles.header}>
        <Text style={styles.frequency}>140.85</Text>
        <View style={styles.signalIndicator}>
          <View style={[styles.signalBar, { height: 8 }]} />
          <View style={[styles.signalBar, { height: 12 }]} />
          <View style={[styles.signalBar, { height: 10 }]} />
          <View style={[styles.signalBar, { height: 14 }]} />
        </View>
      </View>

      {/* Message stream */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View key={message.id} style={styles.messageContainer}>
            <View style={styles.messageHeader}>
              <Text style={[styles.speakerLabel, { color: getSpeakerColor(message.speaker) }]}>
                {getSpeakerLabel(message.speaker)}
              </Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(message.timestamp)}
              </Text>
            </View>
            <Text style={[styles.messageText, { color: getSpeakerColor(message.speaker) }]}>
              {message.text}
            </Text>
          </View>
        ))}

        {/* Streaming text */}
        {isStreaming && displayText && (
          <View style={styles.messageContainer}>
            <View style={styles.messageHeader}>
              <Text style={[styles.speakerLabel, { color: codecTheme.colors.primary }]}>
                {'>>>'}
              </Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(Date.now())}
              </Text>
            </View>
            <View style={styles.streamingContainer}>
              <Text style={[styles.messageText, { color: codecTheme.colors.primary }]}>
                {displayText}
              </Text>
              <Animated.View style={[styles.cursor, animatedCursorStyle]} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer with status */}
      <View style={styles.footer}>
        <Text style={styles.status}>
          {isStreaming ? '[RECEIVING...]' : '[STANDBY]'}
        </Text>
        <Text style={styles.messageCount}>
          {messages.length} MSG{messages.length !== 1 ? 'S' : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: codecTheme.colors.background,
    borderWidth: 1,
    borderColor: codecTheme.colors.border,
    margin: codecTheme.spacing.sm,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: codecTheme.spacing.sm,
    paddingVertical: codecTheme.spacing.xs,
    backgroundColor: codecTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: codecTheme.colors.border,
  },

  frequency: {
    color: codecTheme.colors.primary,
    fontSize: codecTheme.fonts.sizes.body,
    fontFamily: codecTheme.fonts.mono,
    fontWeight: 'bold',
  },

  signalIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },

  signalBar: {
    width: 3,
    backgroundColor: codecTheme.colors.primary,
    opacity: 0.8,
  },

  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    padding: codecTheme.spacing.sm,
    paddingBottom: codecTheme.spacing.lg,
  },

  messageContainer: {
    marginBottom: codecTheme.spacing.md,
  },

  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: codecTheme.spacing.xs,
  },

  speakerLabel: {
    fontSize: codecTheme.fonts.sizes.caption,
    fontFamily: codecTheme.fonts.mono,
    fontWeight: 'bold',
  },

  timestamp: {
    color: codecTheme.colors.textSecondary,
    fontSize: codecTheme.fonts.sizes.caption,
    fontFamily: codecTheme.fonts.mono,
    opacity: 0.7,
  },

  messageText: {
    fontSize: codecTheme.fonts.sizes.body,
    fontFamily: codecTheme.fonts.mono,
    lineHeight: 20,
    textShadowColor: codecTheme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },

  streamingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  cursor: {
    width: 8,
    height: 16,
    backgroundColor: codecTheme.colors.primary,
    marginLeft: 2,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: codecTheme.spacing.sm,
    paddingVertical: codecTheme.spacing.xs,
    backgroundColor: codecTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: codecTheme.colors.border,
  },

  status: {
    color: codecTheme.colors.textSecondary,
    fontSize: codecTheme.fonts.sizes.caption,
    fontFamily: codecTheme.fonts.mono,
  },

  messageCount: {
    color: codecTheme.colors.textSecondary,
    fontSize: codecTheme.fonts.sizes.caption,
    fontFamily: codecTheme.fonts.mono,
  },
});
