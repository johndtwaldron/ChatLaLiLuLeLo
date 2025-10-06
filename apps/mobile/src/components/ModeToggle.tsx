import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

import { 
  getCodecTheme, 
  subscribeToThemeChanges, 
  cycleMode, 
  getModeDisplayName
} from '@/lib/theme';

export const ModeToggle: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  const handlePress = () => {
    cycleMode();
  };

  return (
    <TouchableOpacity
      style={[
        styles.toggle,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.primary,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.toggleText,
        {
          color: currentTheme.colors.primary,
        }
      ]}>
        MODE: {getModeDisplayName().split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggle: {
    // Remove absolute positioning to participate in flex layout
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderRadius: 4,
  },
  
  toggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
