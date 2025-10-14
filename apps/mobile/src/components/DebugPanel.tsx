import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getCodecTheme, subscribeToThemeChanges, getCurrentThemeName } from '@/lib/theme';
import { CodecAudioControls } from './CodecAudioControls';
import SimulateMobileToggle from './SimulateMobileToggle';

interface DebugInfo {
  apiStatus: 'connected' | 'disconnected' | 'loading';
  lastRequest?: {
    timestamp: string;
    mode: string;
    responseTime: number;
    tokenCount: number;
  };
  environment: {
    apiUrl: string;
    openaiKeyPresent: boolean;
    currentMode: string;
    currentTheme: string;
  };
  performance: {
    averageResponseTime: number;
    totalRequests: number;
    successRate: number;
  };
}

interface DebugPanelProps {
  debugInfo?: DebugInfo;
  onClose?: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ debugInfo, onClose }) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const [currentThemeName, setCurrentThemeName] = useState(getCurrentThemeName());
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    api: true,
    environment: false,
    performance: false,
    logs: false,
  });

  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
      setCurrentThemeName(getCurrentThemeName()); // Update theme name when theme changes
    });
    return unsubscribe;
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#00FF00';
      case 'disconnected': return '#FF0000';
      case 'loading': return currentTheme.colors.primary;
      default: return currentTheme.colors.secondary;
    }
  };

  const staticStyles = StyleSheet.create({
    debugOverlay: {
      position: 'absolute',
      top: 60,
      right: 10,
      width: 320,
      maxHeight: 400,
      borderWidth: 2,
      borderRadius: 8,
      padding: 12,
      zIndex: 1000,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'monospace',
    },
    closeButton: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderRadius: 4,
    },
    closeButtonText: {
      fontSize: 12,
      fontFamily: 'monospace',
    },
    sectionContainer: {
      marginBottom: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderRadius: 4,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      fontFamily: 'monospace',
    },
    sectionContent: {
      paddingLeft: 12,
      paddingRight: 8,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 2,
    },
    infoLabel: {
      fontSize: 12,
      fontFamily: 'monospace',
      flex: 1,
    },
    infoValue: {
      fontSize: 12,
      fontFamily: 'monospace',
      flex: 1,
      textAlign: 'right',
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 8,
    },
  });

  const dynamicStyles = {
    debugOverlay: {
      backgroundColor: `${currentTheme.colors.background}E6`, // Semi-transparent
      borderColor: currentTheme.colors.primary,
    },
    title: {
      color: currentTheme.colors.primary,
    },
    closeButton: {
      borderColor: currentTheme.colors.secondary,
    },
    closeButtonText: {
      color: currentTheme.colors.secondary,
    },
    sectionHeader: {
      backgroundColor: `${currentTheme.colors.primary}20`,
      borderColor: currentTheme.colors.primary,
    },
    sectionTitle: {
      color: currentTheme.colors.primary,
    },
    infoLabel: {
      color: currentTheme.colors.text,
    },
    infoValue: {
      color: currentTheme.colors.secondary,
    },
  };

  const defaultDebugInfo: DebugInfo = {
    apiStatus: 'connected',
    lastRequest: {
      timestamp: new Date().toLocaleTimeString(),
      mode: 'JD',
      responseTime: 1200,
      tokenCount: 45,
    },
    environment: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787',
      openaiKeyPresent: true,
      currentMode: 'JD [Colonel AI]',
      currentTheme: currentThemeName, // Use reactive theme name
    },
    performance: {
      averageResponseTime: 980,
      totalRequests: 12,
      successRate: 100,
    },
  };

  const info = debugInfo || defaultDebugInfo;

  return (
    <View style={[staticStyles.debugOverlay, dynamicStyles.debugOverlay]}>
      <View style={[staticStyles.header, { borderBottomColor: currentTheme.colors.primary }]}>
        <Text style={[staticStyles.title, dynamicStyles.title]}>DEBUG PANEL</Text>
        <TouchableOpacity
          style={[staticStyles.closeButton, dynamicStyles.closeButton]}
          onPress={onClose}
        >
          <Text style={[staticStyles.closeButtonText, dynamicStyles.closeButtonText]}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* API Status Section */}
        <View style={staticStyles.sectionContainer}>
          <TouchableOpacity
            style={[staticStyles.sectionHeader, dynamicStyles.sectionHeader]}
            onPress={() => toggleSection('api')}
          >
            <Text style={[staticStyles.sectionTitle, dynamicStyles.sectionTitle]}>
              API STATUS
            </Text>
            <View style={[
              staticStyles.statusIndicator,
              { backgroundColor: getStatusColor(info.apiStatus) }
            ]} />
          </TouchableOpacity>
          
          {expandedSections.api && (
            <View style={staticStyles.sectionContent}>
              <View style={staticStyles.infoRow}>
                <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>Status:</Text>
                <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
                  {info.apiStatus.toUpperCase()}
                </Text>
              </View>
              {info.lastRequest && (
                <>
                  <View style={staticStyles.infoRow}>
                    <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>Last Request:</Text>
                    <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
                      {info.lastRequest.timestamp}
                    </Text>
                  </View>
                  <View style={staticStyles.infoRow}>
                    <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>Mode:</Text>
                    <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
                      {info.lastRequest.mode}
                    </Text>
                  </View>
                  <View style={staticStyles.infoRow}>
                    <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>Response Time:</Text>
                    <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
                      {info.lastRequest.responseTime}ms
                    </Text>
                  </View>
                  <View style={staticStyles.infoRow}>
                    <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>Tokens:</Text>
                    <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
                      {info.lastRequest.tokenCount}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Environment Section */}
        <View style={staticStyles.sectionContainer}>
          <TouchableOpacity
            style={[staticStyles.sectionHeader, dynamicStyles.sectionHeader]}
            onPress={() => toggleSection('environment')}
          >
            <Text style={[staticStyles.sectionTitle, dynamicStyles.sectionTitle]}>
              ENVIRONMENT {expandedSections.environment ? '−' : '+'}
            </Text>
          </TouchableOpacity>
          
          {expandedSections.environment && (
            <View style={staticStyles.sectionContent}>
              <View style={staticStyles.infoRow}>
                <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>API URL:</Text>
                <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]} numberOfLines={1}>
                  {info.environment.apiUrl}
                </Text>
              </View>
              <View style={staticStyles.infoRow}>
                <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>OpenAI Key:</Text>
                <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
                  {info.environment.openaiKeyPresent ? '✓ Present' : '✗ Missing'}
                </Text>
              </View>
              <View style={staticStyles.infoRow}>
                <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>Mode:</Text>
                <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
                  {info.environment.currentMode}
                </Text>
              </View>
              <View style={staticStyles.infoRow}>
                <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>Theme:</Text>
                <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
                  {info.environment.currentTheme}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Performance Section */}
        <View style={staticStyles.sectionContainer}>
          <TouchableOpacity
            style={[staticStyles.sectionHeader, dynamicStyles.sectionHeader]}
            onPress={() => toggleSection('performance')}
          >
            <Text style={[staticStyles.sectionTitle, dynamicStyles.sectionTitle]}>
              PERFORMANCE {expandedSections.performance ? '−' : '+'}
            </Text>
          </TouchableOpacity>
          
          {expandedSections.performance && (
            <View style={staticStyles.sectionContent}>
              <View style={staticStyles.infoRow}>
                <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>Avg Response:</Text>
                <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
                  {info.performance.averageResponseTime}ms
                </Text>
              </View>
              <View style={staticStyles.infoRow}>
                <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>Total Requests:</Text>
                <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
                  {info.performance.totalRequests}
                </Text>
              </View>
              <View style={staticStyles.infoRow}>
                <Text style={[staticStyles.infoLabel, dynamicStyles.infoLabel]}>Success Rate:</Text>
                <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
                  {info.performance.successRate}%
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* UI Controls Section */}
        <View style={staticStyles.sectionContainer}>
          <View style={[staticStyles.sectionHeader, dynamicStyles.sectionHeader]}>
            <Text style={[staticStyles.sectionTitle, dynamicStyles.sectionTitle]}>
              UI CONTROLS
            </Text>
          </View>
          <View style={staticStyles.sectionContent}>
            <SimulateMobileToggle />
          </View>
        </View>

        {/* Codec Audio Controls Section */}
        <View style={staticStyles.sectionContainer}>
          <TouchableOpacity
            style={[staticStyles.sectionHeader, dynamicStyles.sectionHeader]}
            onPress={() => setShowAudioControls(true)}
          >
            <Text style={[staticStyles.sectionTitle, dynamicStyles.sectionTitle]}>
              CODEC AUDIO ♪
            </Text>
            <Text style={[staticStyles.infoValue, dynamicStyles.infoValue]}>
              SETTINGS
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Audio Controls Modal */}
      <CodecAudioControls
        visible={showAudioControls}
        onClose={() => setShowAudioControls(false)}
      />
    </View>
  );
};
