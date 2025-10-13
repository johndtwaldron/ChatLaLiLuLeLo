/**
 * Mobile Panel Components
 * 
 * Wraps existing control components for use in mobile panels.
 * Provides Functions and Debug panels with proper touch targets and spacing.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';
import { PLATFORM_CONSTANTS } from '@/lib/platform';

// Import existing control components
import { ThemeCycleToggle } from '../ThemeCycleToggle';
import { CRTToggle } from '../CRTToggle';
import { ModeToggle } from '../ModeToggle';
import { ModelToggle } from '../ModelToggle';
import { VoiceControls } from '../VoiceControls';
import { DebugToggle } from '../DebugToggle';
import { ConnectionDebugToggle } from '../ConnectionDebugToggle';
import { BudgetIndicator } from '../BudgetIndicator';
import SimulateMobileToggle from '../SimulateMobileToggle';

interface MobilePanelProps {
  sessionId?: string;
  budgetRefreshTrigger?: number;
  onToggleDebug?: (enabled: boolean) => void;
  onToggleConnectionDebug?: (enabled: boolean) => void;
  debugEnabled?: boolean;
  connectionDebugEnabled?: boolean;
}

/**
 * Functions Panel - Contains primary user controls
 */
export function FunctionsPanel({ sessionId, budgetRefreshTrigger }: MobilePanelProps) {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());

  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  const styles = StyleSheet.create({
    panelContainer: {
      gap: 16,
    },
    sectionContainer: {
      gap: 12,
    },
    sectionTitle: {
      color: currentTheme.colors.primary,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'monospace',
      letterSpacing: 1,
      marginBottom: 8,
      paddingLeft: 4,
    },
    controlRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    },
    controlWrapper: {
      // Ensure controls have minimum touch target size
      minHeight: PLATFORM_CONSTANTS.MIN_TOUCH_TARGET,
      justifyContent: 'center',
    },
    voiceControlsWrapper: {
      width: '100%',
      marginTop: 4,
    },
    separator: {
      height: 1,
      backgroundColor: currentTheme.colors.primary + '33',
      marginVertical: 8,
    },
  });

  return (
    <ScrollView 
      style={{ maxHeight: 400 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.panelContainer}
    >
      {/* Theme and Visual Controls */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>APPEARANCE</Text>
        <View style={styles.controlRow}>
          <View style={styles.controlWrapper}>
            <ThemeCycleToggle />
          </View>
          <View style={styles.controlWrapper}>
            <CRTToggle />
          </View>
        </View>
      </View>

      <View style={styles.separator} />

      {/* Conversation Controls */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>CONVERSATION</Text>
        <View style={styles.controlRow}>
          <View style={styles.controlWrapper}>
            <ModeToggle />
          </View>
          <View style={styles.controlWrapper}>
            <ModelToggle />
          </View>
        </View>
      </View>

      <View style={styles.separator} />

      {/* Voice Controls */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>VOICE</Text>
        <View style={styles.voiceControlsWrapper}>
          <VoiceControls compact={false} />
        </View>
      </View>

      {/* Budget Indicator */}
      {sessionId && (
        <>
          <View style={styles.separator} />
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>BUDGET</Text>
            <View style={styles.controlWrapper}>
              <BudgetIndicator 
                sessionId={sessionId}
                refreshTrigger={budgetRefreshTrigger}
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

/**
 * Debug Panel - Contains debug and diagnostic controls
 */
export function DebugPanel({ 
  sessionId, 
  budgetRefreshTrigger, 
  onToggleDebug, 
  onToggleConnectionDebug,
  debugEnabled = false,
  connectionDebugEnabled = false 
}: MobilePanelProps) {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());

  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  const styles = StyleSheet.create({
    panelContainer: {
      gap: 16,
    },
    sectionContainer: {
      gap: 12,
    },
    sectionTitle: {
      color: currentTheme.colors.primary,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'monospace',
      letterSpacing: 1,
      marginBottom: 8,
      paddingLeft: 4,
    },
    controlRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    },
    controlWrapper: {
      // Ensure controls have minimum touch target size
      minHeight: PLATFORM_CONSTANTS.MIN_TOUCH_TARGET,
      justifyContent: 'center',
    },
    infoText: {
      color: currentTheme.colors.textSecondary,
      fontSize: 12,
      fontFamily: 'monospace',
      lineHeight: 16,
      paddingLeft: 4,
    },
    separator: {
      height: 1,
      backgroundColor: currentTheme.colors.primary + '33',
      marginVertical: 8,
    },
  });

  return (
    <ScrollView 
      style={{ maxHeight: 400 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.panelContainer}
    >
      {/* Debug Controls */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>DEBUG CONTROLS</Text>
        <View style={styles.controlRow}>
          <View style={styles.controlWrapper}>
            <DebugToggle onToggle={onToggleDebug || (() => {})} enabled={debugEnabled} />
          </View>
          <View style={styles.controlWrapper}>
            <ConnectionDebugToggle onToggle={onToggleConnectionDebug || (() => {})} enabled={connectionDebugEnabled} />
          </View>
        </View>
        <View style={{ marginTop: 8 }}>
          <SimulateMobileToggle />
        </View>
      </View>

      {/* Budget Information */}
      {sessionId && (
        <>
          <View style={styles.separator} />
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>BUDGET MONITORING</Text>
            <View style={styles.controlWrapper}>
              <BudgetIndicator 
                sessionId={sessionId}
                refreshTrigger={budgetRefreshTrigger}
                compact={false}
              />
            </View>
            <Text style={styles.infoText}>
              Tracks API costs and usage limits in real-time.
            </Text>
          </View>
        </>
      )}

      <View style={styles.separator} />

      {/* System Information */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>SYSTEM INFO</Text>
        <Text style={styles.infoText}>
          CRT: {currentTheme.crt ? 'ON' : 'OFF'}{'\n'}
          Platform: {typeof window !== 'undefined' ? 'Web' : 'Native'}{'\n'}
          Screen: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}
        </Text>
      </View>
    </ScrollView>
  );
}

/**
 * Simplified panel components for very small screens
 */
export function CompactFunctionsPanel({ sessionId }: { sessionId?: string }) {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());

  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  const styles = StyleSheet.create({
    container: {
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ThemeCycleToggle />
        <CRTToggle />
      </View>
      <View style={styles.row}>
        <ModeToggle />
        <ModelToggle />
      </View>
      <VoiceControls compact={true} />
    </View>
  );
}

export function CompactDebugPanel({ sessionId }: { sessionId?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <DebugToggle onToggle={() => {}} enabled={false} />
        <ConnectionDebugToggle onToggle={() => {}} enabled={false} />
      </View>
      {sessionId && (
        <BudgetIndicator sessionId={sessionId} />
      )}
    </View>
  );
}
