import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';

import { 
  getCodecTheme, 
  subscribeToThemeChanges, 
  cycleMode, 
  getModeDisplayName,
  getCurrentMode,
  setMode,
  type ConversationMode,
  conversationModes
} from '@/lib/theme';

export const ModeToggle: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  const handleCyclePress = () => {
    cycleMode();
  };

  const handleDropdownPress = () => {
    setDropdownVisible(true);
  };

  const handleModeSelect = (mode: ConversationMode) => {
    setMode(mode);
    setDropdownVisible(false);
  };

  const currentMode = getCurrentMode();
  const modes: ConversationMode[] = ['haywire', 'jd', 'lore', 'bitcoin', 'rick'];

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.primary,
          }
        ]}
      >
        {/* Main button area - cycles through modes */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleCyclePress}
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
        
        {/* Dropdown arrow button */}
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            {
              borderLeftColor: currentTheme.colors.primary,
            }
          ]}
          onPress={handleDropdownPress}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.arrowText,
            {
              color: currentTheme.colors.primary,
            }
          ]}>
            ▼
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown menu modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={[
            styles.dropdownMenu,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.primary,
            }
          ]}>
            {modes.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.menuItem,
                  currentMode === mode && {
                    backgroundColor: currentTheme.colors.primary + '20',
                  }
                ]}
                onPress={() => handleModeSelect(mode)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.menuItemText,
                  {
                    color: currentMode === mode 
                      ? currentTheme.colors.tertiary 
                      : currentTheme.colors.primary,
                    fontWeight: currentMode === mode ? 'bold' : 'normal',
                  }
                ]}>
                  {conversationModes[mode]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  mainButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  
  dropdownButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderLeftWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  toggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
    textAlign: 'center',
  },
  
  arrowText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  dropdownMenu: {
    borderWidth: 2,
    borderRadius: 4,
    minWidth: 200,
    maxWidth: 300,
  },
  
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  menuItemText: {
    fontSize: 14,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
});
