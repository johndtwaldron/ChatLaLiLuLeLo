/**
 * Voice Controls Component
 * 
 * Provides UI controls for voice functionality including toggle buttons,
 * voice preset selection, volume controls, and status indicators.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { getCodecTheme } from '@/lib/theme';
import { 
  getVoiceConfig, 
  updateVoiceConfig, 
  isVoiceReady, 
  getCurrentVoiceEngine,
  getVoicePresets,
  VoiceConfig 
} from '@/lib/voice';
import type { ColonelVoicePreset } from '@/lib/voice/VoiceEngine';

interface VoiceControlsProps {
  compact?: boolean; // Compact mode for small spaces
  onConfigChange?: (config: VoiceConfig) => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({ 
  compact = false, 
  onConfigChange 
}) => {
  const [config, setConfig] = useState<VoiceConfig>(getVoiceConfig());
  const [isReady, setIsReady] = useState(false);
  const [currentEngine, setCurrentEngine] = useState<{ name: string; supportsStreaming: boolean } | null>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presets] = useState<ColonelVoicePreset[]>(getVoicePresets());
  
  const theme = getCodecTheme();

  // Update state when voice system changes
  useEffect(() => {
    const updateStatus = () => {
      setConfig(getVoiceConfig());
      setIsReady(isVoiceReady());
      setCurrentEngine(getCurrentVoiceEngine());
    };

    // Initial update
    updateStatus();

    // Set up periodic status updates (voice system might initialize asynchronously)
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleConfigUpdate = (updates: Partial<VoiceConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    updateVoiceConfig(updates);
    onConfigChange?.(newConfig);
  };

  const handleVoiceToggle = () => {
    handleConfigUpdate({ enabled: !config.enabled });
  };

  const handleAutoplayToggle = () => {
    handleConfigUpdate({ autoplayReplies: !config.autoplayReplies });
  };

  const handleVolumeChange = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, config.volume + delta));
    handleConfigUpdate({ volume: newVolume });
  };

  const handlePresetSelect = (presetId: string) => {
    handleConfigUpdate({ voicePreset: presetId });
    setShowPresetModal(false);
  };

  const getVoiceStatusColor = () => {
    if (!config.enabled) return theme.colors.textSecondary;
    if (!isReady) return '#FFA500'; // Orange for loading/unavailable
    return theme.colors.primary; // Use primary color for ready status
  };

  const getVoiceStatusText = () => {
    if (!config.enabled) return 'OFF';
    if (!isReady) return 'INIT';
    return 'ON';
  };

  const getCurrentPresetName = () => {
    const preset = presets.find(p => p.id === config.voicePreset);
    return preset?.name || 'Unknown';
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: compact ? 'row' : 'column',
      alignItems: 'center',
      gap: compact ? 8 : 12,
      padding: compact ? 8 : 12,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    controlButton: {
      paddingHorizontal: compact ? 8 : 12,
      paddingVertical: compact ? 4 : 8,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 4,
      borderWidth: 1,
      minWidth: compact ? 50 : 80,
      alignItems: 'center',
    },
    controlButtonActive: {
      backgroundColor: `${theme.colors.primary}20`,
      borderColor: theme.colors.primary,
    },
    controlButtonInactive: {
      borderColor: theme.colors.textSecondary,
    },
    controlButtonText: {
      fontSize: compact ? 10 : 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    controlButtonTextActive: {
      color: theme.colors.primary,
    },
    controlButtonTextInactive: {
      color: theme.colors.textSecondary,
    },
    volumeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    volumeButton: {
      width: compact ? 20 : 24,
      height: compact ? 20 : 24,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 2,
      borderWidth: 1,
      borderColor: theme.colors.textSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    volumeText: {
      fontSize: compact ? 9 : 10,
      color: theme.colors.text,
      minWidth: compact ? 25 : 30,
      textAlign: 'center',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: compact ? 9 : 11,
      fontWeight: 'bold',
    },
    engineText: {
      fontSize: compact ? 8 : 10,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    // Modal styles
    modal: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalContent: {
      width: '80%',
      maxWidth: 400,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      padding: 20,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 16,
    },
    presetItem: {
      padding: 12,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.colors.textSecondary,
      marginBottom: 8,
    },
    presetItemActive: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}20`,
    },
    presetName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    presetDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    modalCloseButton: {
      marginTop: 16,
      padding: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
      alignItems: 'center',
    },
    modalCloseText: {
      color: theme.colors.background,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

  if (compact) {
    return (
      <View style={styles.container}>
        {/* Voice Toggle */}
        <Pressable
          style={[
            styles.controlButton,
            config.enabled ? styles.controlButtonActive : styles.controlButtonInactive
          ]}
          onPress={handleVoiceToggle}
        >
          <View style={styles.statusContainer}>
            <View 
              style={[
                styles.statusDot,
                { backgroundColor: getVoiceStatusColor() }
              ]} 
            />
            <Text 
              style={[
                styles.controlButtonText,
                styles.statusText,
                config.enabled ? styles.controlButtonTextActive : styles.controlButtonTextInactive
              ]}
            >
              {getVoiceStatusText()}
            </Text>
          </View>
        </Pressable>

        {/* Volume Control */}
        {config.enabled && (
          <View style={styles.volumeContainer}>
            <Pressable
              style={styles.volumeButton}
              onPress={() => handleVolumeChange(-0.1)}
            >
              <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>-</Text>
            </Pressable>
            <Text style={styles.volumeText}>
              {Math.round(config.volume * 100)}%
            </Text>
            <Pressable
              style={styles.volumeButton}
              onPress={() => handleVolumeChange(0.1)}
            >
              <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>+</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // Full controls
  return (
    <>
      <View style={styles.container}>
        {/* Voice Status */}
        <View style={styles.statusContainer}>
          <View 
            style={[
              styles.statusDot,
              { backgroundColor: getVoiceStatusColor() }
            ]} 
          />
          <Text 
            style={[
              styles.statusText,
              { color: getVoiceStatusColor() }
            ]}
          >
            VOICE: {getVoiceStatusText()}
          </Text>
          {currentEngine && (
            <Text style={styles.engineText}>
              ({currentEngine.name})
            </Text>
          )}
        </View>

        {/* Voice Toggle */}
        <Pressable
          style={[
            styles.controlButton,
            config.enabled ? styles.controlButtonActive : styles.controlButtonInactive
          ]}
          onPress={handleVoiceToggle}
        >
          <Text 
            style={[
              styles.controlButtonText,
              config.enabled ? styles.controlButtonTextActive : styles.controlButtonTextInactive
            ]}
          >
            VOICE: {config.enabled ? 'ON' : 'OFF'}
          </Text>
        </Pressable>

        {/* Autoplay Toggle */}
        {config.enabled && (
          <Pressable
            style={[
              styles.controlButton,
              config.autoplayReplies ? styles.controlButtonActive : styles.controlButtonInactive
            ]}
            onPress={handleAutoplayToggle}
          >
            <Text 
              style={[
                styles.controlButtonText,
                config.autoplayReplies ? styles.controlButtonTextActive : styles.controlButtonTextInactive
              ]}
            >
              AUTOPLAY: {config.autoplayReplies ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        )}

        {/* Volume Control */}
        {config.enabled && (
          <View style={styles.volumeContainer}>
            <Pressable
              style={styles.volumeButton}
              onPress={() => handleVolumeChange(-0.1)}
            >
              <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>-</Text>
            </Pressable>
            <Text style={styles.volumeText}>
              VOL: {Math.round(config.volume * 100)}%
            </Text>
            <Pressable
              style={styles.volumeButton}
              onPress={() => handleVolumeChange(0.1)}
            >
              <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>+</Text>
            </Pressable>
          </View>
        )}

        {/* Voice Preset Selection */}
        {config.enabled && (
          <Pressable
            style={[styles.controlButton, styles.controlButtonActive]}
            onPress={() => setShowPresetModal(true)}
          >
            <Text style={[styles.controlButtonText, styles.controlButtonTextActive]}>
              VOICE: {getCurrentPresetName()}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Voice Preset Modal */}
      <Modal
        visible={showPresetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPresetModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SELECT VOICE PRESET</Text>
            
            {presets.map((preset) => (
              <Pressable
                key={preset.id}
                style={[
                  styles.presetItem,
                  config.voicePreset === preset.id && styles.presetItemActive
                ]}
                onPress={() => handlePresetSelect(preset.id)}
              >
                <Text style={styles.presetName}>{preset.name}</Text>
                <Text style={styles.presetDescription}>{preset.description}</Text>
              </Pressable>
            ))}

            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setShowPresetModal(false)}
            >
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};
