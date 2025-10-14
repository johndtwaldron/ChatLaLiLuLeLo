/**
 * Simulate Mobile Toggle Component
 * 
 * Debug-only toggle to force mobile UI mode on desktop for testing.
 * Uses localStorage override to instantly switch between desktop and mobile layouts.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';
import { setDebugOverride, getDebugOverride, isDebugOverrideActive } from '@/lib/uiMode';
import { PLATFORM_CONSTANTS } from '../lib/platform';

export function SimulateMobileToggle() {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const [isEnabled, setIsEnabled] = useState(getDebugOverride() === 'mobile');

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  // Check for override changes (in case changed elsewhere)
  useEffect(() => {
    const checkOverride = () => {
      setIsEnabled(getDebugOverride() === 'mobile');
    };

    // Check periodically in case override was changed in another tab/component
    const interval = setInterval(checkOverride, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    if (newState) {
      // Enable mobile UI simulation
      setDebugOverride('mobile');
    } else {
      // Disable simulation, return to normal detection
      setDebugOverride(null);
    }
    
    // Force page reload to apply the change immediately
    // This ensures all components re-evaluate shouldUseMobileUI()
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 100);
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    label: {
      color: currentTheme.colors.textSecondary,
      fontSize: 12,
      fontFamily: 'monospace',
      flex: 1,
    },
    toggleButton: {
      minWidth: PLATFORM_CONSTANTS.MIN_TOUCH_TARGET,
      height: 32,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderRadius: 4,
      borderColor: isEnabled ? currentTheme.colors.tertiary : currentTheme.colors.primary,
      backgroundColor: isEnabled ? 'rgba(255, 165, 0, 0.1)' : 'rgba(0, 0, 0, 0.3)',
    },
    toggleButtonText: {
      color: isEnabled ? currentTheme.colors.tertiary : currentTheme.colors.primary,
      fontSize: 11,
      fontFamily: 'monospace',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    warningText: {
      color: currentTheme.colors.tertiary,
      fontSize: 10,
      fontFamily: 'monospace',
      fontStyle: 'italic',
      marginTop: 4,
      paddingLeft: 4,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={{ flex: 1 }}>
        <Text style={dynamicStyles.label}>Simulate Mobile UI</Text>
        {isEnabled && (
          <Text style={dynamicStyles.warningText}>
            ⚠ Debug mode: Mobile UI forced on desktop
          </Text>
        )}
      </View>
      <Pressable
        onPress={handleToggle}
        style={dynamicStyles.toggleButton}
        accessibilityRole="switch"
        accessibilityState={{ checked: isEnabled }}
        accessibilityLabel={`Simulate mobile UI ${isEnabled ? 'enabled' : 'disabled'}`}
        android_ripple={{
          color: currentTheme.colors.primary + '33',
          borderless: false,
        }}
      >
        <Text style={dynamicStyles.toggleButtonText}>
          {isEnabled ? 'ON' : 'OFF'}
        </Text>
      </Pressable>
    </View>
  );
}

export default SimulateMobileToggle;
