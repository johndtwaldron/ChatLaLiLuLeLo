import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  Pressable,
} from 'react-native';

import { CodecFrame } from '@/components/CodecFrame';
import { DraggablePortrait, Rect } from '@/components/DraggablePortrait';
import { ConnectionDebug } from '@/components/debug/ConnectionDebug';
import { SubtitleStream } from '@/components/SubtitleStream';
import { CRTToggle } from '@/components/CRTToggle';
import { ThemeCycleToggle } from '@/components/ThemeCycleToggle';
import { ModeToggle } from '@/components/ModeToggle';
import { ModelToggle } from '@/components/ModelToggle';
import { DebugToggle } from '@/components/DebugToggle';
import { DebugPanel } from '@/components/DebugPanel';
import { ConnectionDebugToggle } from '@/components/ConnectionDebugToggle';
import { TextInput } from '@/components/TextInput';
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { getCodecTheme, subscribeToThemeChanges, getCurrentMode, getCurrentModel, isDebugEnabled, setDebug } from '@/lib/theme';
import { streamReply, type ChatRequest, type ChatMessage } from '@/lib/api';
import { type Message, type MsgMeta, type ModeTag, type ModelTag } from '@/types/chat';
import { playCodecClose } from '@/lib/audio';
import { extractUserFriendlyError } from '@/lib/security';
import { getLightningAddress } from '@/config/lightning.config';
import { VoiceControls } from '@/components/VoiceControls';
import { initializeVoiceService, processMessageForTTS } from '@/lib/voice/VoiceService';
import { AudioDebugOverlay } from '@/components/AudioDebugOverlay';

interface ChatScreenProps {
  onEnterStandby?: () => void;
}

// Snapshot meta helper functions
const modeToTag = (m: string): ModeTag =>
  m === 'jd' ? 'JD' : m === 'bitcoin' ? 'BTC' : m === 'haywire' ? 'GW' : 'MGS';

const modelToTag = (m: string): ModelTag =>
  m === 'gpt-4o' ? 'gpt-4o' :
  m === 'gpt-3.5-turbo' ? 'gpt-3.5-turbo' :
  m === 'mock' ? 'mock' : 'gpt-4o-mini';

function snapshotMeta(kind: 'system' | 'user' | 'ai'): MsgMeta {
  return {
    mode: modeToTag(getCurrentMode()),
    model: modelToTag(getCurrentModel()),
    at: Date.now(),
    kind,
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onEnterStandby }) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  
  // Generate stable session ID for budget tracking
  const [sessionId] = useState(() => 
    `${process.env.EXPO_PUBLIC_SESSION_ID_PREFIX || 'chatlali'}-${Date.now()}`
  );
  
  // Budget refresh trigger
  const [budgetRefreshTrigger, setBudgetRefreshTrigger] = useState(0);
  
  // Create initial seeded messages with current mode/model stamped
  const createInitialMessages = (): Message[] => {
    const systemMeta = snapshotMeta('system');
    
    return [
      {
        id: '1',
        text: 'Codec connection established. Four modes available.',
        speaker: 'colonel',
        timestamp: Date.now() - 45000,
        meta: systemMeta,
      },
      {
        id: '2', 
        text: 'MGS2 MEME Philosophy, Bitcoin, Haywire, or MGS Lore?',
        speaker: 'colonel',
        timestamp: Date.now() - 30000,
        meta: systemMeta,
      },
      {
        id: '3',
        text: 'Initiating Philosophy mode... What is truth?',
        speaker: 'user',
        timestamp: Date.now() - 20000,
        meta: snapshotMeta('user'),
      },
      {
        id: '4',
        text: 'Information control becomes reality control. The digital age has blurred the line between authentic experience and manufactured consciousness.',
        speaker: 'colonel',
        timestamp: Date.now() - 5000,
        meta: snapshotMeta('ai'),
      },
    ];
  };
  
  const [messages, setMessages] = useState<Message[]>(createInitialMessages);

  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamText, setCurrentStreamText] = useState('');
  const [haywireMode] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(isDebugEnabled());
  const [connectionDebugEnabled, setConnectionDebugEnabled] = useState(false);
  const [audioDebugEnabled, setAudioDebugEnabled] = useState(false);
  const portraitSectionRef = useRef<View>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [portraitSectionLayout, setPortraitSectionLayout] = useState<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  
  // Track positions of both draggable portraits
  const [colonelPosition, setColonelPosition] = useState({ x: 0, y: 0 });
  const [userPosition, setUserPosition] = useState({ x: 0, y: 0 });
  
  // Initialize voice service on component mount
  useEffect(() => {
    const initVoice = async () => {
      try {
        await initializeVoiceService();
        console.log('[CHAT] Voice service initialization attempted');
      } catch (error) {
        console.warn('[CHAT] Voice service initialization failed:', error);
        // Don't block the app if voice fails
      }
    };
    
    initVoice();
  }, []);

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
      portraitSectionRef.current.measure((_x, _y, width, height, _pageX, _pageY) => {
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

  // Handle audio debug toggle
  const handleAudioDebugToggle = (enabled: boolean) => {
    setAudioDebugEnabled(enabled);
  };

  // Handle close button press - enter standby mode
  const handleClosePress = async () => {
    try {
      // Play codec close sound
      await playCodecClose();
      console.log('[CHAT] Close sound played, entering standby mode');
    } catch (error) {
      console.warn('[CHAT] Failed to play close sound:', error);
    }
    
    // Enter standby mode
    onEnterStandby?.();
  };

  // Handle new message from text input
  const handleSendMessage = async (messageText: string) => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    
    // Snapshot current mode/model at creation time (freeze them)
    const meta = snapshotMeta('user');
    
    const userMessage: Message = {
      id: `user-${timestamp}-${randomSuffix}`,
      text: `USER: ${messageText}`,
      speaker: 'user',
      timestamp,
      meta, // stamp meta!
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
    
    // Get current selected model
    const selectedModel = getCurrentModel();
    
    const chatRequest: ChatRequest = {
      mode: apiMode,
      messages: conversationHistory,
      options: {
        research: false, // TODO: Make this configurable
        max_tokens: 600,
        temperature: 0.7,
        model: selectedModel // Include selected model
      },
      client: {
        sessionId: sessionId, // Use stable session ID
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
            meta, // use the SAME meta that was stamped for the user message
          };
          
          setMessages(prev => [...prev, responseMessage]);
          setIsStreaming(false);
          setCurrentStreamText('');
          
          // Process message for TTS (non-blocking)
          processMessageForTTS(fullResponseText, 'ai').catch(error => {
            console.warn('[CHAT] TTS processing failed:', error);
          });
          
          // Trigger budget refresh after successful response
          setBudgetRefreshTrigger(prev => prev + 1);
        },
        (error) => {
          // Handle errors with user-friendly messages
          console.error('Stream error:', error);
          
          const userFriendlyError = extractUserFriendlyError({ message: error });
          
          const errorTimestamp = Date.now();
          const errorRandomSuffix = Math.random().toString(36).substring(7);
          const errorMessage: Message = {
            id: `colonel-${errorTimestamp}-${errorRandomSuffix}`,
            text: `[ERROR] ${userFriendlyError}`,
            speaker: 'colonel',
            timestamp: errorTimestamp,
            meta, // use the SAME meta that was stamped for the user message
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
        {/* Control Buttons - MODEL → CLOSE → BUDGET → CRT → THEME → MODE → DEBUG → CONN → AUDIO */}
        <View style={staticStyles.controlButtonsContainer}>
          <ModelToggle />
          
          <Pressable 
            onPress={handleClosePress}
            style={[
              staticStyles.controlButton,
              { 
                borderColor: currentTheme.colors.primary,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              }
            ]}
          >
            <Text style={[staticStyles.controlButtonText, { color: currentTheme.colors.primary }]}>
              CLOSE
            </Text>
          </Pressable>
          
          <BudgetIndicator 
            sessionId={sessionId}
            compact={true}
            refreshTrigger={budgetRefreshTrigger}
          />
          
          <VoiceControls compact={true} />
          <CRTToggle />
          <ThemeCycleToggle />
          <ModeToggle />
          <DebugToggle onToggle={handleDebugToggle} enabled={debugEnabled} />
          <ConnectionDebugToggle onToggle={handleConnectionDebugToggle} enabled={connectionDebugEnabled} />
          
          <Pressable 
            onPress={() => handleAudioDebugToggle(!audioDebugEnabled)}
            style={[
              staticStyles.controlButton,
              { 
                borderColor: audioDebugEnabled ? currentTheme.colors.tertiary : currentTheme.colors.primary,
                backgroundColor: audioDebugEnabled ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.7)',
              }
            ]}
          >
            <Text style={[staticStyles.controlButtonText, { 
              color: audioDebugEnabled ? currentTheme.colors.tertiary : currentTheme.colors.primary
            }]}>
              🔊
            </Text>
          </Pressable>
        </View>
        
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
                lightningAddress={getLightningAddress()}
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
              messages={messages}
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
        
        {/* Audio Debug Panel */}
        {audioDebugEnabled && (
          <AudioDebugOverlay 
            visible={audioDebugEnabled}
            onClose={() => handleAudioDebugToggle(false)} 
          />
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
    // Ensure this doesn't interfere with Lightning QR z-indexing
    zIndex: 1,
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
  
  controlButtonsContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  
  controlButtonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
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
