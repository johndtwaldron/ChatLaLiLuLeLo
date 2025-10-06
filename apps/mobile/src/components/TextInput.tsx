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
import { validateMessageForSubmission } from '@/lib/security';

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
  const [validationFeedback, setValidationFeedback] = useState<string>('');
  const [isValidInput, setIsValidInput] = useState(true);

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);
  
  // Validate input in real-time and provide feedback
  useEffect(() => {
    if (inputText.trim()) {
      const validation = validateMessageForSubmission(inputText);
      setIsValidInput(validation.canSend);
      setValidationFeedback(validation.userFeedback || '');
    } else {
      setIsValidInput(true);
      setValidationFeedback('');
    }
  }, [inputText]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    // Validate message before sending
    const validation = validateMessageForSubmission(inputText);
    
    if (!validation.canSend) {
      // Show validation error feedback
      setValidationFeedback(validation.userFeedback || 'Please check your message and try again');
      return;
    }
    
    // Send the sanitized message
    onSendMessage(validation.sanitizedMessage);
    setInputText(''); // Clear input after sending
    setValidationFeedback(''); // Clear any validation feedback
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
      
      {/* Validation Feedback */}
      {validationFeedback && (
        <View style={[
          styles.feedbackBar, 
          { 
            backgroundColor: isValidInput ? currentTheme.colors.surface : '#2a1f1f',
            borderColor: isValidInput ? '#d4af37' : '#cc3030'
          }
        ]}>
          <Text style={[
            styles.feedbackText, 
            { 
              color: isValidInput ? '#d4af37' : '#ff6b6b',
            }
          ]}>
            {validationFeedback}
          </Text>
        </View>
      )}
      
      {/* Status Indicator */}
      <View style={[styles.statusBar, { backgroundColor: currentTheme.colors.surface }]}>
        <Text style={[styles.statusText, { color: currentTheme.colors.textSecondary }]}>
          [INPUT MODE: ACTIVE] [SHIFT+ENTER: NEW LINE]
        </Text>
        <Text style={[styles.statusText, { color: currentTheme.colors.textSecondary }]}>
          {inputText.length}/2000 CHARS | {(inputText.match(/\n/g) || []).length + 1} LINES
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
    // Use new MGS codec font
    fontFamily: Platform.OS === 'web' ? 
      '"TeX Gyre Heros", "Helvetica Neue", Helvetica, Arial, sans-serif' : 
      'System',
    textAlign: 'left',
    // Enhanced typography
    lineHeight: 18.9, // 14 * 1.35
    letterSpacing: 0.2,
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
  
  feedbackBar: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderTopWidth: 0, // Connect to input container
  },
  
  feedbackText: {
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
});
