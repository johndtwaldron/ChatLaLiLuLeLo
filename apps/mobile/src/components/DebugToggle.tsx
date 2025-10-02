import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';

interface DebugToggleProps {
  onToggle: (enabled: boolean) => void;
  enabled: boolean;
}

export const DebugToggle: React.FC<DebugToggleProps> = ({ onToggle, enabled }) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());

  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  const handlePress = () => {
    onToggle(!enabled);
  };

  const staticStyles = StyleSheet.create({
    debugButton: {
      position: 'absolute',
      top: 20,
      left: '50%',
      marginLeft: 150, // Position after THEME button
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 2,
      borderRadius: 8,
      minWidth: 100,
      alignItems: 'center',
      zIndex: 100,
    },
    debugText: {
      fontSize: 14,
      fontWeight: 'bold',
      fontFamily: 'monospace',
    },
  });

  const dynamicStyles = {
    debugButton: {
      backgroundColor: enabled ? currentTheme.colors.primary + '30' : 'transparent',
      borderColor: enabled ? currentTheme.colors.primary : currentTheme.colors.secondary,
    },
    debugText: {
      color: enabled ? currentTheme.colors.primary : currentTheme.colors.secondary,
    },
  };

  return (
    <TouchableOpacity
      style={[staticStyles.debugButton, dynamicStyles.debugButton]}
      onPress={handlePress}
    >
      <Text style={[staticStyles.debugText, dynamicStyles.debugText]}>
        DEBUG: {enabled ? 'ON' : 'OFF'}
      </Text>
    </TouchableOpacity>
  );
};
