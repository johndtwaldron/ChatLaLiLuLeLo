import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { getCodecTheme } from '@/lib/theme';

interface AudioDebugInfo {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface AudioDebugOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export const AudioDebugOverlay: React.FC<AudioDebugOverlayProps> = ({ visible, onClose }) => {
  const [debugLogs, setDebugLogs] = useState<AudioDebugInfo[]>([]);
  const [audioStatus, setAudioStatus] = useState({
    isIOSSafari: false,
    codecAudioUnlocked: false,
    voiceAudioContextState: 'unknown',
    lastTTSAttempt: 'none',
    lastTTSResult: 'none'
  });
  
  const theme = getCodecTheme();

  useEffect(() => {
    if (!visible) return;

    // Detect iOS Safari (check if we have navigator)
    const isIOSSafari = typeof navigator !== 'undefined' && 
      /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      typeof window !== 'undefined' && !(window as any).MSStream;
    setAudioStatus(prev => ({ ...prev, isIOSSafari }));

    // Override console.log to capture audio-related logs
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    const addDebugLog = (level: AudioDebugInfo['level'], message: string) => {
      if (message.includes('[AUDIO]') || message.includes('🍎') || message.includes('voice') || message.includes('TTS')) {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs(prev => [...prev.slice(-9), { timestamp, level, message }]); // Keep last 10 logs
      }
    };

    console.log = (...args) => {
      originalConsoleLog(...args);
      addDebugLog('info', args.join(' '));
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      addDebugLog('error', args.join(' '));
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      addDebugLog('warning', args.join(' '));
    };

    // Test audio status
    const testAudioStatus = async () => {
      try {
        // Check if we have window object (web environment)
        if (typeof window !== 'undefined') {
          // Test if we can create AudioContext
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const testContext = new AudioContextClass();
            setAudioStatus(prev => ({ ...prev, voiceAudioContextState: testContext.state }));
            await testContext.close();
          }

          // Test if we can create Audio element
          if (typeof Audio !== 'undefined') {
            const testAudio = new Audio();
            addDebugLog('success', '✅ HTML5 Audio element creation successful');
          } else {
            addDebugLog('warning', '⚠️ HTML5 Audio not available');
          }
        } else {
          addDebugLog('info', 'ℹ️ Running in React Native environment');
        }
        
        // Test codec audio unlock status (check if sound effects work)
        addDebugLog('info', '🔊 Codec audio status check ready');
        
      } catch (error) {
        addDebugLog('error', '❌ Audio capability test failed: ' + error);
      }
    };

    testAudioStatus();

    // Cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError; 
      console.warn = originalConsoleWarn;
    };
  }, [visible]);

  // Test TTS function
  const testTTS = async () => {
    addDebugLog('info', '🧪 Testing TTS audio playback...');
    try {
      const { processMessageForTTS } = require('@/lib/voice/VoiceService');
      await processMessageForTTS('Test message for audio debugging', 'ai');
      setAudioStatus(prev => ({ ...prev, lastTTSAttempt: new Date().toLocaleTimeString(), lastTTSResult: 'attempted' }));
    } catch (error) {
      addDebugLog('error', '❌ TTS test failed: ' + error);
      setAudioStatus(prev => ({ ...prev, lastTTSResult: 'failed: ' + error }));
    }
  };

  // Test codec sound
  const testCodecSound = async () => {
    addDebugLog('info', '🔊 Testing codec sound effect...');
    try {
      const { playCodecClose } = require('@/lib/audio');
      await playCodecClose();
      setAudioStatus(prev => ({ ...prev, codecAudioUnlocked: true }));
      addDebugLog('success', '✅ Codec sound played successfully');
    } catch (error) {
      addDebugLog('error', '❌ Codec sound failed: ' + error);
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
      <View style={[styles.container, { borderColor: theme.colors.primary }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            🔊 Audio Debug Panel
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.colors.primary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Status</Text>
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            iOS Safari: {audioStatus.isIOSSafari ? '✅' : '❌'}
          </Text>
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            Codec Audio: {audioStatus.codecAudioUnlocked ? '✅' : '❓'}
          </Text>
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            AudioContext: {audioStatus.voiceAudioContextState}
          </Text>
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            Last TTS: {audioStatus.lastTTSAttempt}
          </Text>
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            TTS Result: {audioStatus.lastTTSResult}
          </Text>
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Tests</Text>
          <TouchableOpacity 
            style={[styles.testButton, { borderColor: theme.colors.primary }]}
            onPress={testCodecSound}
          >
            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
              Test Codec Sound
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.testButton, { borderColor: theme.colors.primary }]}
            onPress={testTTS}
          >
            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
              Test TTS Voice
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Logs */}
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Recent Logs</Text>
          <ScrollView style={styles.logsContainer}>
            {debugLogs.map((log, index) => (
              <Text 
                key={index}
                style={[
                  styles.logText,
                  { 
                    color: log.level === 'error' ? '#ff4444' : 
                           log.level === 'warning' ? '#ffaa44' :
                           log.level === 'success' ? '#44ff44' :
                           theme.colors.text
                  }
                ]}
                numberOfLines={2}
              >
                {log.timestamp} {log.message}
              </Text>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    width: '95%',
    height: '80%',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.95)',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  testButton: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  logsContainer: {
    flex: 1,
  },
  logText: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
