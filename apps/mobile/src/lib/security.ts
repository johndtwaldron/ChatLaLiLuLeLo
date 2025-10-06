/**
 * Frontend Security Validation Module
 * 
 * Provides client-side input validation and security checks
 * to complement backend security measures.
 */

export interface SecurityValidationResult {
  isValid: boolean;
  sanitized: string;
  warnings: string[];
  errorMessage?: string;
}

// Configuration constants
const MAX_MESSAGE_LENGTH = 2000; // Character limit for messages
const MAX_LINES = 20; // Line limit for multiline messages
const SUSPICIOUS_PATTERNS = [
  /ignore\s+previous\s+instructions?/i,
  /disregard\s+above/i,
  /forget\s+everything/i,
  /system\s*:\s*you\s+are/i,
  /act\s+as\s+if/i,
  /pretend\s+to\s+be/i,
  /roleplaying?\s+as/i,
];

const EXCESSIVE_REPETITION_THRESHOLD = 5; // Same character repeated more than this many times
const EXCESSIVE_CAPS_THRESHOLD = 0.7; // More than 70% of text in caps

/**
 * Validates and sanitizes user input on the client side
 */
export function validateUserInput(input: string): SecurityValidationResult {
  const warnings: string[] = [];
  let sanitized = input;
  
  // Basic sanitization: trim whitespace
  sanitized = sanitized.trim();
  
  // Check if input is empty after sanitization
  if (!sanitized) {
    return {
      isValid: false,
      sanitized: '',
      warnings: [],
      errorMessage: 'Please enter a message'
    };
  }
  
  // Check message length
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      sanitized: sanitized.substring(0, MAX_MESSAGE_LENGTH),
      warnings: [`Message too long (${sanitized.length}/${MAX_MESSAGE_LENGTH} characters)`],
      errorMessage: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`
    };
  }
  
  // Check line count for multiline messages
  const lines = sanitized.split('\n');
  if (lines.length > MAX_LINES) {
    return {
      isValid: false,
      sanitized: lines.slice(0, MAX_LINES).join('\n'),
      warnings: [`Too many lines (${lines.length}/${MAX_LINES} lines)`],
      errorMessage: `Message has too many lines (maximum ${MAX_LINES} allowed)`
    };
  }
  
  // Check for suspicious patterns (soft warning)
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      warnings.push('Message contains potentially problematic content');
      break; // Only warn once
    }
  }
  
  // Check for excessive character repetition
  const excessiveRepetition = /(.)\1{5,}/g;
  if (excessiveRepetition.test(sanitized)) {
    warnings.push('Message contains excessive character repetition');
    // Clean up excessive repetition (limit to 3 consecutive chars)
    sanitized = sanitized.replace(/(.)\1{3,}/g, '$1$1$1');
  }
  
  // Check for excessive caps (warning only)
  const letters = sanitized.replace(/[^a-zA-Z]/g, '');
  if (letters.length > 10) { // Only check if there are enough letters
    const caps = sanitized.replace(/[^A-Z]/g, '');
    const capsRatio = caps.length / letters.length;
    
    if (capsRatio > EXCESSIVE_CAPS_THRESHOLD) {
      warnings.push('Message contains excessive capital letters');
    }
  }
  
  // Check for control characters (except standard whitespace)
  // eslint-disable-next-line no-control-regex
  const controlChars = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g;
  if (controlChars.test(sanitized)) {
    warnings.push('Message contains unusual characters');
    sanitized = sanitized.replace(controlChars, '');
  }
  
  return {
    isValid: true,
    sanitized,
    warnings,
  };
}

/**
 * Formats security warnings for display to user
 */
export function formatSecurityWarnings(warnings: string[]): string {
  if (warnings.length === 0) return '';
  
  if (warnings.length === 1) {
    return `⚠️ Warning: ${warnings[0]}`;
  }
  
  return `⚠️ Warnings: ${warnings.join(', ')}`;
}

/**
 * Safe error messages for display to users
 * These should not reveal internal security details
 */
export const SAFE_ERROR_MESSAGES = {
  INVALID_INPUT: 'Please check your message and try again',
  MESSAGE_TOO_LONG: 'Message is too long, please shorten it',
  TOO_MANY_LINES: 'Message has too many lines',
  SUSPICIOUS_CONTENT: 'Message flagged for review, please rephrase',
  SERVER_ERROR: 'Unable to send message, please try again',
  NETWORK_ERROR: 'Connection error, please check your internet connection',
  RATE_LIMITED: 'Please wait a moment before sending another message',
  GENERIC_ERROR: 'Something went wrong, please try again',
} as const;

/**
 * Extracts user-friendly error message from API error response
 */
export function extractUserFriendlyError(error: any): string {
  // Try to extract structured error from response
  if (error?.message) {
    if (error.message.includes('Rate limit')) {
      return SAFE_ERROR_MESSAGES.RATE_LIMITED;
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return SAFE_ERROR_MESSAGES.NETWORK_ERROR;
    }
  }
  
  // Check for HTTP status codes
  if (error?.status) {
    switch (error.status) {
      case 400:
        return SAFE_ERROR_MESSAGES.INVALID_INPUT;
      case 429:
        return SAFE_ERROR_MESSAGES.RATE_LIMITED;
      case 500:
      case 502:
      case 503:
        return SAFE_ERROR_MESSAGES.SERVER_ERROR;
      default:
        return SAFE_ERROR_MESSAGES.GENERIC_ERROR;
    }
  }
  
  // Default safe message
  return SAFE_ERROR_MESSAGES.GENERIC_ERROR;
}

/**
 * Validates message before sending to API
 * Returns validation result with user-friendly feedback
 */
export function validateMessageForSubmission(message: string): {
  canSend: boolean;
  sanitizedMessage: string;
  userFeedback?: string;
} {
  const validation = validateUserInput(message);
  
  if (!validation.isValid) {
    return {
      canSend: false,
      sanitizedMessage: validation.sanitized,
      userFeedback: validation.errorMessage || SAFE_ERROR_MESSAGES.INVALID_INPUT
    };
  }
  
  let userFeedback: string | undefined;
  if (validation.warnings.length > 0) {
    userFeedback = formatSecurityWarnings(validation.warnings);
  }
  
  return {
    canSend: true,
    sanitizedMessage: validation.sanitized,
    userFeedback
  };
}
