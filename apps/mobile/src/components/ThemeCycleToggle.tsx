import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { getCodecTheme, subscribeToThemeChanges, cycleTheme, getCurrentTheme, getThemeDisplayName } from '@/lib/theme';

export const ThemeCycleToggle: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  
  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  const handleCycle = () => {
    cycleTheme();
  };

  const currentThemeName = getCurrentTheme();
  const displayName = getThemeDisplayName(currentThemeName);

  return (
    <View style={styles.container}>
      <Pressable 
        onPress={handleCycle}
        style={[
          styles.button,
          { 
            borderColor: currentTheme.colors.primary,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }
        ]}
      >
        <Text style={[styles.buttonText, { color: currentTheme.colors.primary }]}>
          THEME: {displayName}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: '50%',
    marginLeft: 100, // Move further right to prevent overlap
    zIndex: 100,
  },
  
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
  },
  
  buttonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
