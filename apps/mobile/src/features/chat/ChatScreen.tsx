import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

import { CodecFrame } from '@/components/CodecFrame';
import { Portrait } from '@/components/Portrait';
import { SubtitleStream } from '@/components/SubtitleStream';
import { codecTheme } from '@/lib/theme';

interface Message {
  id: string;
  text: string;
  speaker: 'colonel' | 'user';
  timestamp: number;
}

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Codec connection established. Four modes available.',
      speaker: 'colonel',
      timestamp: Date.now() - 45000,
    },
    {
      id: '2', 
      text: 'MGS2 MEME Philosophy, Bitcoin, Haywire, or MGS Lore?',
      speaker: 'colonel',
      timestamp: Date.now() - 30000,
    },
    {
      id: '3',
      text: 'Initiating Philosophy mode... What is truth?',
      speaker: 'user',
      timestamp: Date.now() - 20000,
    },
    {
      id: '4',
      text: 'Information control becomes reality control. The digital age has blurred the line between authentic experience and manufactured consensus.',
      speaker: 'colonel',
      timestamp: Date.now() - 5000,
    },
  ]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [haywireMode, setHaywireMode] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <CodecFrame haywireMode={haywireMode}>
        <View style={styles.content}>
          {/* Portrait Section */}
          <View style={styles.portraitSection}>
            <Portrait 
              type="colonel" 
              isActive={true}
              isSpeaking={isStreaming}
            />
            <Portrait 
              type="user" 
              isActive={false}
            />
          </View>

          {/* Subtitle Stream */}
          <View style={styles.streamSection}>
            <SubtitleStream
              messages={messages}
              isStreaming={isStreaming}
              currentStreamText="The nature of information itself becomes questionable..."
            />
          </View>

          {/* Future: Input controls will go here */}
          <View style={styles.controlsSection}>
            {/* Placeholder for input bar, mode selector, send button */}
          </View>
        </View>
      </CodecFrame>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: codecTheme.colors.background,
  },
  
  content: {
    flex: 1,
    padding: codecTheme.spacing.sm,
  },
  
  portraitSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: codecTheme.spacing.md,
    paddingVertical: codecTheme.spacing.sm,
  },
  
  streamSection: {
    flex: 1,
    marginVertical: codecTheme.spacing.sm,
  },
  
  controlsSection: {
    height: 80,
    // Will contain input controls later
    backgroundColor: codecTheme.colors.surface,
    borderWidth: 1,
    borderColor: codecTheme.colors.border,
    margin: codecTheme.spacing.sm,
  },
});
