import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';

interface ConnectionDebugToggleProps {
  onToggle: (enabled: boolean) => void;
  enabled: boolean;
}

export const ConnectionDebugToggle: React.FC<ConnectionDebugToggleProps> = ({ onToggle, enabled }) => {
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
    connectionDebugButton: {
      // Remove absolute positioning to participate in flex layout
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 2,
      borderRadius: 8,
      minWidth: 120,
      alignItems: 'center',
    },
    connectionDebugText: {
      fontSize: 12,
      fontWeight: 'bold',
      fontFamily: 'monospace',
    },
  });

  const dynamicStyles = {
    connectionDebugButton: {
      backgroundColor: enabled ? currentTheme.colors.primary + '30' : 'transparent',
      borderColor: enabled ? currentTheme.colors.primary : currentTheme.colors.secondary,
    },
    connectionDebugText: {
      color: enabled ? currentTheme.colors.primary : currentTheme.colors.secondary,
    },
  };

  return (
    <TouchableOpacity
      style={[staticStyles.connectionDebugButton, dynamicStyles.connectionDebugButton]}
      onPress={handlePress}
    >
      <Text style={[staticStyles.connectionDebugText, dynamicStyles.connectionDebugText]}>
        CONN: {enabled ? 'ON' : 'OFF'}
      </Text>
    </TouchableOpacity>
  );
};
