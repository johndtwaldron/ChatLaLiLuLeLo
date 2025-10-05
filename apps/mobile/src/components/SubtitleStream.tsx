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

import { getCodecTheme, subscribeToThemeChanges, codecTheme, getCurrentModeKey, getCurrentModelKey, makeTag } from '@/lib/theme';
import type { Message } from '@/types/chat';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SubtitleStreamProps {
  messages: Message[];
  isStreaming?: boolean;
  currentStreamText?: string;
}

export const SubtitleStream: React.FC<SubtitleStreamProps> = ({
  messages,
  isStreaming = false,
  currentStreamText = '',
}) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const scrollViewRef = useRef<ScrollView>(null);
  const [displayText, setDisplayText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  
  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);
  
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
    return speaker === 'colonel' ? currentTheme.colors.primary : currentTheme.colors.secondary;
  };

  // Helper function to create a tag from MsgMeta
  const createTagFromMeta = (meta: any): string => {
    if (!meta) return '[JD:gpt-4o-mini]'; // fallback
    
    // If it's the new MsgMeta format
    if ('mode' in meta && 'model' in meta && !('tag' in meta)) {
      return `[${meta.mode}:${meta.model}]`;
    }
    
    // If it's the old MessageMeta format with tag
    if ('tag' in meta) {
      return meta.tag;
    }
    
    return '[JD:gpt-4o-mini]'; // fallback
  };
  
  // Guard rail function to backfill meta for older messages that lack it
  const ensureMessageMeta = (message: Message) => {
    if (!message.meta) {
      // Backfill with current settings as a fallback
      const currentModeKey = getCurrentModeKey();
      const currentModelKey = getCurrentModelKey();
      return {
        ...message,
        meta: {
          mode: currentModeKey === 'haywire' ? 'GW' : 
                currentModeKey === 'jd' ? 'JD' : 
                currentModeKey === 'lore' ? 'MGS' :
                currentModeKey === 'bitcoin' ? 'BTC' : 'JD',
          model: currentModelKey as 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo' | 'mock',
          at: Date.now(),
          kind: message.speaker === 'user' ? 'user' : 'ai'
        }
      };
    }
    return message;
  };

  // Render message with frozen meta tag (no global state lookups)
  const renderMessageText = (message: Message): string => {
    const messageWithMeta = ensureMessageMeta(message);
    
    // Skip prefix for intro banner messages (system messages with specific content)
    const isIntroBanner = message.speaker === 'colonel' && 
      messageWithMeta.meta?.kind === 'system' &&
      (message.text.includes('Codec connection established') ||
       message.text.includes('MGS2 MEME Philosophy, Bitcoin, Haywire'));
    
    // Only add tag prefix for colonel messages, and only if not already present
    if (message.speaker === 'colonel' && !isIntroBanner) {
      const prefix = createTagFromMeta(messageWithMeta.meta);
      const text = message.text;
      
      // Check if tag is already present to avoid duplication
      if (!text.startsWith('[') || !text.includes(']:')) {
        return `${prefix} ${text}`;
      }
    }
    
    return message.text;
  };

  // For streaming text, use current mode/model (since it's being created now)
  const renderStreamingText = (text: string): string => {
    const currentModeKey = getCurrentModeKey();
    const currentModelKey = getCurrentModelKey();
    const currentTag = makeTag(currentModeKey, currentModelKey);
    
    // Only add tag if not already present
    if (!text.startsWith('[') || !text.includes(']:')) {
      return `${currentTag} ${text}`;
    }
    return text;
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background, borderColor: currentTheme.colors.border }]}>
      {/* Header with frequency indicator */}
      <View style={[styles.header, { backgroundColor: currentTheme.colors.surface, borderBottomColor: currentTheme.colors.border }]}>
        <Text style={[styles.frequency, { color: currentTheme.colors.primary }]}>140.85</Text>
        <View style={styles.signalIndicator}>
          <View style={[styles.signalBar, { height: 8, backgroundColor: currentTheme.colors.primary }]} />
          <View style={[styles.signalBar, { height: 12, backgroundColor: currentTheme.colors.primary }]} />
          <View style={[styles.signalBar, { height: 10, backgroundColor: currentTheme.colors.primary }]} />
          <View style={[styles.signalBar, { height: 14, backgroundColor: currentTheme.colors.primary }]} />
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
              <Text style={[styles.timestamp, { color: currentTheme.colors.textSecondary }]}>
                {formatTimestamp(message.timestamp)}
              </Text>
            </View>
            <Text style={[styles.messageText, { color: getSpeakerColor(message.speaker) }]}>
              {renderMessageText(message)}
            </Text>
          </View>
        ))}

        {/* Streaming text */}
        {isStreaming && displayText && (
          <View style={styles.messageContainer}>
            <View style={styles.messageHeader}>
              <Text style={[styles.speakerLabel, { color: currentTheme.colors.primary }]}>
                {'>>>'}
              </Text>
              <Text style={[styles.timestamp, { color: currentTheme.colors.textSecondary }]}>
                {formatTimestamp(Date.now())}
              </Text>
            </View>
            <View style={styles.streamingContainer}>
              <Text style={[styles.messageText, { color: currentTheme.colors.primary }]}>
                {renderStreamingText(displayText)}
              </Text>
              <Animated.View style={[styles.cursor, { backgroundColor: currentTheme.colors.primary }, animatedCursorStyle]} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer with status */}
      <View style={[styles.footer, { backgroundColor: currentTheme.colors.surface, borderTopColor: currentTheme.colors.border }]}>
        <Text style={[styles.status, { color: currentTheme.colors.textSecondary }]}>
          {isStreaming ? '[RECEIVING...]' : '[STANDBY]'}
        </Text>
        <Text style={[styles.messageCount, { color: currentTheme.colors.textSecondary }]}>
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
