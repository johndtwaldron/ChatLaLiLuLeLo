import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';
import { 
  getCodecAudioSettings, 
  updateCodecAudioSettings, 
  codecAudioService 
} from '@/lib/audio';

interface CodecAudioControlsProps {
  visible: boolean;
  onClose: () => void;
}

export const CodecAudioControls: React.FC<CodecAudioControlsProps> = ({
  visible,
  onClose,
}) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const [settings, setSettings] = useState(getCodecAudioSettings());
  const [isTestPlaying, setIsTestPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (visible) {
      // Refresh settings when modal opens
      setSettings(getCodecAudioSettings());
    }
  }, [visible]);

  const handleToggleStartupAudio = async () => {
    const newSettings = {
      ...settings,
      startupAudioEnabled: !settings.startupAudioEnabled,
    };
    
    setSettings(newSettings);
    await updateCodecAudioSettings(newSettings);
  };

  const handleVolumeChange = async (volume: number) => {
    const newSettings = { ...settings, volume };
    setSettings(newSettings);
    await updateCodecAudioSettings(newSettings);
  };

  const handleTestAudio = async () => {
    if (isTestPlaying) return;
    
    setIsTestPlaying(true);
    try {
      await codecAudioService.playSound('codec_startup', {
        volume: settings.volume,
        fadeIn: false,
      });
      
      // Reset after a reasonable delay
      setTimeout(() => {
        setIsTestPlaying(false);
      }, 2000);
    } catch (error) {
      console.warn('[CODEC AUDIO CONTROLS] Test playback failed:', error);
      setIsTestPlaying(false);
    }
  };

  const availableSounds = codecAudioService.getAvailableSounds();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { borderColor: currentTheme.colors.primary }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerLine, { backgroundColor: currentTheme.colors.primary }]} />
            <Text style={[styles.headerText, { color: currentTheme.colors.primary }]}>
              CODEC AUDIO SETTINGS
            </Text>
            <View style={[styles.headerLine, { backgroundColor: currentTheme.colors.primary }]} />
          </View>

          {/* Settings Content */}
          <View style={styles.content}>
            {/* Startup Audio Toggle */}
            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.settingLabel, { color: currentTheme.colors.text }]}>
                  Startup Audio
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.colors.secondary }]}>
                  Play codec sounds during app startup
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  {
                    backgroundColor: settings.startupAudioEnabled
                      ? currentTheme.colors.primary + '40'
                      : 'transparent',
                    borderColor: currentTheme.colors.primary,
                  },
                ]}
                onPress={handleToggleStartupAudio}
              >
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color: settings.startupAudioEnabled
                        ? currentTheme.colors.primary
                        : currentTheme.colors.secondary,
                    },
                  ]}
                >
                  {settings.startupAudioEnabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Volume Control */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: currentTheme.colors.text }]}>
                  Volume: {Math.round(settings.volume * 100)}%
                </Text>
                <Text style={[styles.settingDescription, { color: currentTheme.colors.secondary }]}>
                  Adjust codec audio volume
                </Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={settings.volume}
                    onValueChange={handleVolumeChange}
                    minimumTrackTintColor={currentTheme.colors.primary}
                    maximumTrackTintColor={currentTheme.colors.secondary + '40'}
                    thumbTintColor={currentTheme.colors.primary}
                  />
                </View>
              </View>
            </View>

            {/* Test Audio Button */}
            <TouchableOpacity
              style={[
                styles.testButton,
                {
                  backgroundColor: isTestPlaying
                    ? currentTheme.colors.secondary + '40'
                    : currentTheme.colors.primary + '20',
                  borderColor: currentTheme.colors.primary,
                },
              ]}
              onPress={handleTestAudio}
              disabled={isTestPlaying}
            >
              <Text
                style={[
                  styles.testButtonText,
                  {
                    color: isTestPlaying
                      ? currentTheme.colors.secondary
                      : currentTheme.colors.primary,
                  },
                ]}
              >
                {isTestPlaying ? 'PLAYING...' : 'TEST CODEC STARTUP'}
              </Text>
            </TouchableOpacity>

            {/* Available Sounds Info */}
            <View style={styles.soundsInfo}>
              <Text style={[styles.soundsTitle, { color: currentTheme.colors.secondary }]}>
                Available Codec Sounds:
              </Text>
              {availableSounds.map((sound) => (
                <View key={sound.id} style={styles.soundItem}>
                  <Text style={[styles.soundName, { color: currentTheme.colors.text }]}>
                    • {sound.name}
                  </Text>
                  {sound.description && (
                    <Text style={[styles.soundDescription, { color: currentTheme.colors.secondary }]}>
                      {sound.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.footerButton,
                { borderColor: currentTheme.colors.secondary },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.footerButtonText, { color: currentTheme.colors.secondary }]}>
                CLOSE
              </Text>
            </TouchableOpacity>
          </View>

          {/* Frequency Display */}
          <View style={styles.frequencyDisplay}>
            <Text style={[styles.frequencyText, { color: currentTheme.colors.primary }]}>
              140.15 MHz
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderWidth: 2,
    borderRadius: 8,
    padding: 20,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerLine: {
    flex: 1,
    height: 1,
  },
  headerText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    paddingHorizontal: 15,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  sliderContainer: {
    marginTop: 15,
    width: '100%',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  testButton: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 25,
  },
  testButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  soundsInfo: {
    marginTop: 10,
  },
  soundsTitle: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  soundItem: {
    marginBottom: 8,
  },
  soundName: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  soundDescription: {
    fontSize: 10,
    fontFamily: 'monospace',
    opacity: 0.7,
    marginLeft: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  footerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 4,
  },
  footerButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  frequencyDisplay: {
    position: 'absolute',
    top: 10,
    right: 15,
  },
  frequencyText: {
    fontSize: 10,
    fontFamily: 'monospace',
    opacity: 0.6,
  },
});
