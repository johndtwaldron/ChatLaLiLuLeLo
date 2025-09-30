import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { getCodecTheme, subscribeToThemeChanges, toggleCRT } from '@/lib/theme';

export const CRTToggle: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  
  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    toggleCRT();
  };

  return (
    <View style={styles.container}>
      <Pressable 
        onPress={handleToggle}
        style={[
          styles.button,
          { 
            borderColor: currentTheme.colors.primary,
            backgroundColor: currentTheme.crt ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
          }
        ]}
      >
        <Text style={[styles.buttonText, { color: currentTheme.colors.primary }]}>
          CRT: {currentTheme.crt ? 'ON' : 'OFF'}
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
    marginLeft: -50, // Adjust center position slightly
    zIndex: 100,
  },
  
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  
  buttonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
