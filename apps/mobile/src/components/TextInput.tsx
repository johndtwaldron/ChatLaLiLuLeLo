import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';

interface TextInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  onSendMessage,
  placeholder = "Enter message...",
}) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const [inputText, setInputText] = useState('');

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText(''); // Clear input after sending
    }
  };

  const handleKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Enter') {
      // Check if Shift is pressed - if so, allow new line
      if (event.nativeEvent.shiftKey) {
        // Shift+Enter: Allow new line (don't send)
        return;
      } else {
        // Just Enter: Send message
        event.preventDefault(); // Prevent new line
        handleSend();
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }
      ]}>
        {/* Input Field */}
        <RNTextInput
          style={[
            styles.textInput,
            {
              color: currentTheme.colors.primary,
              borderColor: currentTheme.colors.border,
              // Dynamic height based on content
              minHeight: 40,
              maxHeight: 120, // Limit to ~6 lines max
            }
          ]}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          placeholderTextColor={currentTheme.colors.textSecondary}
          multiline={true} // Enable multiline
          returnKeyType="default" // Allow Enter key for new lines
          blurOnSubmit={false}
          textAlignVertical="top" // Align text to top for multiline
        />
        
        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim() ? currentTheme.colors.primary : currentTheme.colors.surface,
              borderColor: currentTheme.colors.primary,
            }
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={[
            styles.sendButtonText,
            {
              color: inputText.trim() ? currentTheme.colors.background : currentTheme.colors.textSecondary,
            }
          ]}>
            SEND
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Status Indicator */}
      <View style={[styles.statusBar, { backgroundColor: currentTheme.colors.surface }]}>
        <Text style={[styles.statusText, { color: currentTheme.colors.textSecondary }]}>
          [INPUT MODE: ACTIVE] [SHIFT+ENTER: NEW LINE]
        </Text>
        <Text style={[styles.statusText, { color: currentTheme.colors.textSecondary }]}>
          {inputText.length}/1000 CHARS | {(inputText.match(/\n/g) || []).length + 1} LINES
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 80,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Align to bottom for multiline
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
  },

  textInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'left',
    // Removed fixed height for multiline support
  },

  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
    alignSelf: 'flex-end', // Keep button at bottom
    marginBottom: 8, // Align with text input bottom padding
  },

  sendButtonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  statusText: {
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
});
