import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

import { CodecFrame } from '@/components/CodecFrame';
import { Portrait } from '@/components/Portrait';
import { DraggablePortrait, Rect } from '@/components/DraggablePortrait';
import { SubtitleStream } from '@/components/SubtitleStream';
import { CRTToggle } from '@/components/CRTToggle';
import { ThemeCycleToggle } from '@/components/ThemeCycleToggle';
import { ModeToggle } from '@/components/ModeToggle';
import { TextInput } from '@/components/TextInput';
import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';

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

  const [isStreaming] = useState(false);
  const [haywireMode] = useState(false);
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

  // Handle new message from text input
  const handleSendMessage = (messageText: string) => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7); // Add randomness
    const userMessage: Message = {
      id: `user-${timestamp}-${randomSuffix}`, // Fully unique ID
      text: `USER: ${messageText}`,
      speaker: 'user',
      timestamp,
    };
    
    // Add user message with deduplication check
    setMessages(prevMessages => {
      // Check if message already exists (prevent duplicates)
      const isDuplicate = prevMessages.some(msg => 
        msg.text === userMessage.text && 
        Math.abs(msg.timestamp - userMessage.timestamp) < 100 // Within 100ms
      );
      
      if (isDuplicate) {
        console.log('Prevented duplicate user message:', userMessage.text);
        return prevMessages; // Don't add duplicate
      }
      
      return [...prevMessages, userMessage];
    });
    
    // Add placeholder backend response after a short delay
    setTimeout(() => {
      const responseTimestamp = Date.now();
      const responseRandomSuffix = Math.random().toString(36).substring(7);
      const responseMessage: Message = {
        id: `colonel-${responseTimestamp}-${responseRandomSuffix}`,
        text: '<backend response>',
        speaker: 'colonel',
        timestamp: responseTimestamp,
      };
      
      setMessages(prevMessages => {
        // Check if response already exists (prevent duplicates)
        const isDuplicate = prevMessages.some(msg => 
          msg.text === responseMessage.text && 
          Math.abs(msg.timestamp - responseMessage.timestamp) < 100
        );
        
        if (isDuplicate) {
          console.log('Prevented duplicate response message');
          return prevMessages;
        }
        
        return [...prevMessages, responseMessage];
      });
    }, 1500);
  };

  const themeStyles = getThemeStyles(currentTheme);

  return (
    <SafeAreaView style={[staticStyles.container, { backgroundColor: currentTheme.colors.background }]}>
      <CodecFrame haywireMode={haywireMode}>
        {/* Control Buttons */}
        <CRTToggle />
        <ThemeCycleToggle />
        <ModeToggle />
        
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
              isStreaming={false}
              currentStreamText={""}
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
