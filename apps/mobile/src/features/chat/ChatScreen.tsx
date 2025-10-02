import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

import { CodecFrame } from '@/components/CodecFrame';
import { Portrait } from '@/components/Portrait';
import { DraggablePortrait, Rect } from '@/components/DraggablePortrait';
import { ConnectionDebug } from '@/components/debug/ConnectionDebug';
import { SubtitleStream } from '@/components/SubtitleStream';
import { CRTToggle } from '@/components/CRTToggle';
import { ThemeCycleToggle } from '@/components/ThemeCycleToggle';
import { ModeToggle } from '@/components/ModeToggle';
import { DebugToggle } from '@/components/DebugToggle';
import { DebugPanel } from '@/components/DebugPanel';
import { ConnectionDebugToggle } from '@/components/ConnectionDebugToggle';
import { TextInput } from '@/components/TextInput';
import { getCodecTheme, subscribeToThemeChanges, getCurrentMode, getModeDisplayName, isDebugEnabled, setDebug } from '@/lib/theme';
import { streamReply, type ChatMessage, type ChatRequest } from '@/lib/api';

interface Message {
  id: string;
  text: string;
  speaker: 'colonel' | 'user';
  timestamp: number;
}

export const ChatScreen: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
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
      text: 'Information control becomes reality control. The digital age has blurred the line between authentic experience and manufactured consciousness.',
      speaker: 'colonel',
      timestamp: Date.now() - 5000,
    },
  ]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamText, setCurrentStreamText] = useState('');
  const [haywireMode] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(isDebugEnabled());
  const [connectionDebugEnabled, setConnectionDebugEnabled] = useState(false);
  const portraitSectionRef = useRef<View>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [portraitSectionLayout, setPortraitSectionLayout] = useState<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  
  // Track positions of both draggable portraits
  const [colonelPosition, setColonelPosition] = useState({ x: 0, y: 0 });
  const [userPosition, setUserPosition] = useState({ x: 0, y: 0 });
  
  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
      setDebugEnabled(isDebugEnabled()); // Sync debug state
    });
    return unsubscribe;
  }, []);

  // Measure portrait section layout for dragging boundaries
  const handlePortraitSectionLayout = () => {
    if (portraitSectionRef.current) {
      portraitSectionRef.current.measure((x, y, width, height, pageX, pageY) => {
        setPortraitSectionLayout({ x: 0, y: 0, width, height }); // relative coordinates
        
        // Set initial positions: Colonel on left, User on right
        setColonelPosition({ x: 0, y: 0 });
        setUserPosition({ 
          x: Math.max(0, width - 120 - (currentTheme.spacing?.sm || 16)), 
          y: 0 
        });
        
        setLayoutReady(true);
      });
    }
  };

  // Handle debug toggle
  const handleDebugToggle = (enabled: boolean) => {
    setDebugEnabled(enabled);
    setDebug(enabled); // Update theme system state
  };

  // Handle connection debug toggle
  const handleConnectionDebugToggle = (enabled: boolean) => {
    setConnectionDebugEnabled(enabled);
  };

  // Handle new message from text input
  const handleSendMessage = async (messageText: string) => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const userMessage: Message = {
      id: `user-${timestamp}-${randomSuffix}`,
      text: `USER: ${messageText}`,
      speaker: 'user',
      timestamp,
    };
    
    // Add user message with deduplication check
    setMessages(prevMessages => {
      const isDuplicate = prevMessages.some(msg => 
        msg.text === userMessage.text && 
        Math.abs(msg.timestamp - userMessage.timestamp) < 100
      );
      
      if (isDuplicate) {
        console.log('Prevented duplicate user message:', userMessage.text);
        return prevMessages;
      }
      
      return [...prevMessages, userMessage];
    });
    
    // Start streaming response from API
    setIsStreaming(true);
    setCurrentStreamText('');
    
    // Convert mode mapping
    const currentMode = getCurrentMode();
    const modeMap = {
      'haywire': 'GW',
      'jd': 'JD', 
      'lore': 'MGS',
      'bitcoin': 'BTC'
    } as const;
    
    const apiMode = modeMap[currentMode] || 'JD';
    
    // Build conversation history for API
    const conversationHistory: ChatMessage[] = messages.map(msg => ({
      role: msg.speaker === 'user' ? 'user' : 'assistant',
      content: msg.text.replace(/^USER: /, ''), // Remove USER: prefix for API
    }));
    
    // Add the current user message
    conversationHistory.push({
      role: 'user',
      content: messageText
    });
    
    const chatRequest: ChatRequest = {
      mode: apiMode,
      messages: conversationHistory,
      options: {
        research: false, // TODO: Make this configurable
        max_tokens: 600,
        temperature: 0.7
      },
      client: {
        sessionId: `${process.env.EXPO_PUBLIC_SESSION_ID_PREFIX || 'chatlali'}-${Date.now()}`,
        appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0'
      }
    };
    
    let fullResponseText = '';
    
    try {
      await streamReply(
        chatRequest,
        (token: string) => {
          // Handle incoming tokens
          fullResponseText += token;
          setCurrentStreamText(fullResponseText);
        },
        (usage) => {
          // Handle completion
          console.log('Stream completed:', usage);
          
          const responseTimestamp = Date.now();
          const responseRandomSuffix = Math.random().toString(36).substring(7);
          const responseMessage: Message = {
            id: `colonel-${responseTimestamp}-${responseRandomSuffix}`,
            text: fullResponseText,
            speaker: 'colonel',
            timestamp: responseTimestamp,
          };
          
          setMessages(prev => [...prev, responseMessage]);
          setIsStreaming(false);
          setCurrentStreamText('');
        },
        (error) => {
          // Handle errors
          console.error('Stream error:', error);
          
          const errorTimestamp = Date.now();
          const errorRandomSuffix = Math.random().toString(36).substring(7);
          const errorMessage: Message = {
            id: `colonel-${errorTimestamp}-${errorRandomSuffix}`,
            text: `[ERROR] Connection failed: ${error}`,
            speaker: 'colonel',
            timestamp: errorTimestamp,
          };
          
          setMessages(prev => [...prev, errorMessage]);
          setIsStreaming(false);
          setCurrentStreamText('');
        }
      );
    } catch (error) {
      console.error('API request failed:', error);
      setIsStreaming(false);
      setCurrentStreamText('');
    }
  };

  const themeStyles = getThemeStyles(currentTheme);

  return (
    <SafeAreaView style={[staticStyles.container, { backgroundColor: currentTheme.colors.background }]}>
      <CodecFrame haywireMode={haywireMode}>
        {/* Control Buttons */}
        <CRTToggle />
        <ThemeCycleToggle />
        <ModeToggle />
        <DebugToggle onToggle={handleDebugToggle} enabled={debugEnabled} />
        <ConnectionDebugToggle onToggle={handleConnectionDebugToggle} enabled={connectionDebugEnabled} />
        
        <View style={themeStyles.content}>
          {/* Portrait Section with dual draggable portraits */}
          <View 
            ref={portraitSectionRef}
            style={[staticStyles.portraitSection, themeStyles.portraitSection]}
            onLayout={handlePortraitSectionLayout}
          >
            {/* Invisible placeholders to maintain layout space */}
            <View style={staticStyles.portraitPlaceholder} />
            <View style={staticStyles.portraitPlaceholder} />
            
            {/* Draggable Colonel Portrait (absolutely positioned) */}
            {layoutReady && (
              <DraggablePortrait
                type="colonel"
                initialX={colonelPosition.x}
                initialY={colonelPosition.y}
                container={portraitSectionLayout}
                otherPortraitPosition={userPosition}
                onPositionChange={(x, y) => setColonelPosition({ x, y })}
              />
            )}
            
            {/* Draggable User Portrait (absolutely positioned) */}
            {layoutReady && (
              <DraggablePortrait
                type="user"
                initialX={userPosition.x}
                initialY={userPosition.y}
                container={portraitSectionLayout}
                otherPortraitPosition={colonelPosition}
                onPositionChange={(x, y) => setUserPosition({ x, y })}
              />
            )}
          </View>

          {/* Subtitle Stream */}
          <View style={[staticStyles.streamSection, themeStyles.streamSection]}>
            <SubtitleStream
              messages={messages}
              isStreaming={isStreaming}
              currentStreamText={currentStreamText}
            />
          </View>

          {/* Text Input Section */}
          <View style={[staticStyles.controlsSection, themeStyles.controlsSection]}>
            <TextInput 
              onSendMessage={handleSendMessage}
              placeholder="Enter your message..."
            />
          </View>
        </View>
        
        {/* Debug Panel */}
        {debugEnabled && (
          <DebugPanel onClose={() => handleDebugToggle(false)} />
        )}
        
        {/* Connection Debug Panel */}
        {connectionDebugEnabled && (
          <ConnectionDebug />
        )}
      </CodecFrame>
    </SafeAreaView>
  );
};

// Static styles - theme-independent values only
const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  portraitSection: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  portraitPlaceholder: {
    width: 120,
    height: 140,
    opacity: 0, // Invisible but takes up layout space
  },
  
  streamSection: {
    flex: 1,
  },
  
  controlsSection: {
    minHeight: 80,
  },
});

// Dynamic styles function that takes current theme
const getThemeStyles = (theme: any) => ({
  content: {
    flex: 1,
    padding: theme.spacing.sm,
  },
  
  portraitSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  
  streamSection: {
    marginVertical: theme.spacing.sm,
  },
  
  controlsSection: {
    margin: theme.spacing.sm,
  },
});
