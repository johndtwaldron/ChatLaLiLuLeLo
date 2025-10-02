import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';

import { ChatScreen } from './src/features/chat/ChatScreen';
import { StartupAnimation } from './src/components/StartupAnimation';
import { CodecStandby } from './src/components/CodecStandby';
import { initializeCodecAudio } from './src/lib/audio';

export default function App() {
  const [showStartup, setShowStartup] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isInStandby, setIsInStandby] = useState(true); // Start in standby as splash screen
  const [shouldPlayCloseSound, setShouldPlayCloseSound] = useState(false);

  useEffect(() => {
    // Initialize codec audio system
    const initAudio = async () => {
      try {
        await initializeCodecAudio();
        setIsAudioReady(true);
        console.log('[APP] Codec audio system ready');
      } catch (error) {
        console.warn('[APP] Audio initialization failed:', error);
        // Still allow startup without audio
        setIsAudioReady(true);
      }
    };

    initAudio();
  }, []);

  const handleStartupComplete = () => {
    setShowStartup(false);
  };

  const handleEnterStandby = () => {
    setShouldPlayCloseSound(true); // Play close sound when coming from main app
    setIsInStandby(true);
  };

  const handleReactivateFromStandby = () => {
    setShouldPlayCloseSound(false); // Reset close sound flag
    setIsInStandby(false);
    setShowStartup(true); // Show startup animation when reactivating
  };

  // Show startup animation first
  if (showStartup) {
    return (
      <>
        <StatusBar style="light" backgroundColor="#000000" />
        <StartupAnimation 
          onComplete={handleStartupComplete}
          skipAnimation={!isAudioReady} // Skip if audio not ready after timeout
        />
      </>
    );
  }

  // Show standby screen if in standby mode
  if (isInStandby) {
    return (
      <>
        <StatusBar style="light" backgroundColor="#000000" />
        <CodecStandby 
          onReactivate={handleReactivateFromStandby} 
          playCloseSound={shouldPlayCloseSound}
        />
      </>
    );
  }

  // Show main app with close button
  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      <ChatScreen onEnterStandby={handleEnterStandby} />
    </>
  );
}
