/**
 * Mobile Top Controls Component
 * 
 * Provides a simplified 3-button interface for mobile devices:
 * - Close: Returns to standby/close chat
 * - Functions: Theme, Volume, CRT, Mode controls
 * - Debug: Debug toggles and diagnostic info
 * 
 * Features modal panels that don't overlap portraits, keyboard navigation,
 * and proper touch targets (≥44px).
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Pressable,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';
import { PLATFORM_CONSTANTS } from '@/lib/platform';

type Panel = 'functions' | 'debug' | null;

interface TopControlsMobileProps {
  onClose: () => void;
  FunctionsPanel: React.ReactNode;
  DebugPanel: React.ReactNode;
}

export default function TopControlsMobile({
  onClose,
  FunctionsPanel,
  DebugPanel,
}: TopControlsMobileProps) {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  // Subscribe to theme changes for dynamic styling
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  // Handle screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const togglePanel = useCallback((panelType: Panel) => {
    setOpenPanel((current) => (current === panelType ? null : panelType));
  }, []);

  const closePanel = useCallback(() => {
    setOpenPanel(null);
  }, []);

  // Handle escape key to close panels
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openPanel) {
        closePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openPanel, closePanel]);

  // Dynamic styles based on current theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.primary + '40', // 40 = 25% opacity
    },
    button: {
      minWidth: PLATFORM_CONSTANTS.MIN_TOUCH_TARGET,
      height: PLATFORM_CONSTANTS.MIN_TOUCH_TARGET,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: currentTheme.colors.primary + '66', // 66 = 40% opacity
      borderRadius: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    buttonActive: {
      backgroundColor: currentTheme.colors.primary + '14', // 14 = 8% opacity
      borderColor: currentTheme.colors.primary,
    },
    buttonText: {
      color: currentTheme.colors.primary,
      fontWeight: '600',
      fontSize: 12,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
    backdrop: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    sheet: {
      position: 'absolute' as const,
      top: PLATFORM_CONSTANTS.MIN_TOUCH_TARGET + 20, // Below the top bar with margin
      left: 8,
      right: 8,
      maxHeight: screenDimensions.height * 0.6, // Limit to 60% of screen height
      borderWidth: 1,
      borderColor: currentTheme.colors.primary + '66',
      backgroundColor: 'rgba(0, 20, 20, 0.95)',
      borderRadius: 8,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8, // Android shadow
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.primary + '33', // 33 = 20% opacity
    },
    sheetTitle: {
      color: currentTheme.colors.primary,
      fontWeight: '700',
      fontSize: 16,
      fontFamily: 'monospace',
      letterSpacing: 1,
    },
    closeButton: {
      minWidth: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: currentTheme.colors.primary + '14',
    },
    closeButtonText: {
      color: currentTheme.colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    panelContent: {
      maxHeight: screenDimensions.height * 0.5, // Limit panel content height
      gap: 8,
    },
  });

  const renderButton = (
    type: 'close' | 'functions' | 'debug',
    label: string,
    onPress: () => void,
    isActive = false
  ) => (
    <Pressable
      key={type}
      accessibilityRole="button"
      accessibilityLabel={`${label} button`}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={[
        dynamicStyles.button,
        isActive && dynamicStyles.buttonActive,
      ]}
      android_ripple={{
        color: currentTheme.colors.primary + '33',
        borderless: false,
      }}
    >
      <Text style={dynamicStyles.buttonText}>{label}</Text>
    </Pressable>
  );

  return (
    <>
      <View style={dynamicStyles.container}>
        {renderButton('close', 'CLOSE', onClose)}
        {renderButton('functions', 'FUNCTIONS', () => togglePanel('functions'), openPanel === 'functions')}
        {renderButton('debug', 'DEBUG', () => togglePanel('debug'), openPanel === 'debug')}
      </View>

      {/* Modal Panel */}
      <Modal
        visible={openPanel !== null}
        transparent
        animationType="fade"
        onRequestClose={closePanel}
        statusBarTranslucent
      >
        {/* Backdrop - tapping closes the panel */}
        <Pressable 
          style={dynamicStyles.backdrop} 
          onPress={closePanel}
          accessibilityLabel="Close panel backdrop"
        />

        {/* Panel Sheet */}
        <View style={dynamicStyles.sheet}>
          {/* Panel Header */}
          <View style={dynamicStyles.sheetHeader}>
            <Text style={dynamicStyles.sheetTitle}>
              {openPanel === 'functions' ? 'FUNCTIONS' : 'DEBUG'}
            </Text>
            <Pressable
              onPress={closePanel}
              accessibilityLabel="Close panel"
              style={dynamicStyles.closeButton}
              android_ripple={{
                color: currentTheme.colors.primary + '33',
                borderless: true,
              }}
            >
              <Text style={dynamicStyles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Panel Content */}
          <View style={dynamicStyles.panelContent}>
            {openPanel === 'functions' ? FunctionsPanel : DebugPanel}
          </View>
        </View>
      </Modal>
    </>
  );
}
