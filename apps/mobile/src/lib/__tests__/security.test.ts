/**
 * Frontend Security Validation Test Suite
 * 
 * Tests for client-side input validation, error handling,
 * and security features in the mobile app.
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateUserInput,
  validateMessageForSubmission,
  formatSecurityWarnings,
  extractUserFriendlyError,
  SAFE_ERROR_MESSAGES
} from '../security';

describe('Frontend Security - Input Validation', () => {
  describe('Basic Input Validation', () => {
    it('should accept clean, normal input', () => {
      const result = validateUserInput('Hello, how are you today?');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello, how are you today?');
      expect(result.warnings).toEqual([]);
    });

    it('should reject empty input', () => {
      const result = validateUserInput('');
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Please enter a message');
    });

    it('should reject whitespace-only input', () => {
      const result = validateUserInput('   \n\t   ');
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Please enter a message');
    });

    it('should trim leading and trailing whitespace', () => {
      const result = validateUserInput('  Hello world  ');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello world');
    });
  });

  describe('Length Validation', () => {
    it('should enforce maximum message length', () => {
      const longMessage = 'a'.repeat(2001); // Exceeds 2000 character limit
      const result = validateUserInput(longMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('2000 characters');
      expect(result.sanitized).toHaveLength(2000);
    });

    it('should accept messages at the length limit', () => {
      const maxLengthMessage = 'a'.repeat(2000);
      const result = validateUserInput(maxLengthMessage);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(maxLengthMessage);
    });

    it('should enforce maximum line count', () => {
      const manyLinesMessage = Array(21).fill('line').join('\n'); // Exceeds 20 line limit
      const result = validateUserInput(manyLinesMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('20 allowed');
    });
  });

  describe('Suspicious Pattern Detection', () => {
    const suspiciousPatterns = [
      'ignore previous instructions',
      'disregard above',
      'forget everything',
      'system: you are',
      'act as if',
      'pretend to be',
      'roleplay as'
    ];

    suspiciousPatterns.forEach(pattern => {
      it(`should warn about suspicious pattern: "${pattern}"`, () => {
        const result = validateUserInput(`Hello, ${pattern} and help me`);
        
        expect(result.isValid).toBe(true); // Warning, not blocking
        expect(result.warnings).toContain('Message contains potentially problematic content');
      });
    });

    it('should not flag benign content', () => {
      const benignMessages = [
        'I need instructions for cooking',
        'The previous version was better',
        'Can you help me understand this system?',
        'Please act on this information'
      ];

      benignMessages.forEach(message => {
        const result = validateUserInput(message);
        expect(result.warnings).not.toContain('Message contains potentially problematic content');
      });
    });
  });

  describe('Character and Content Validation', () => {
    it('should warn about excessive repetition', () => {
      const repetitiveInput = 'AAAAAAAAAAAAAAAAAA hello world';
      const result = validateUserInput(repetitiveInput);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Message contains excessive character repetition');
      expect(result.sanitized).toBe('AAA hello world'); // Should be cleaned up
    });

    it('should warn about excessive capital letters', () => {
      const capsInput = 'THIS IS A VERY LONG MESSAGE WITH TOO MANY CAPITALS';
      const result = validateUserInput(capsInput);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Message contains excessive capital letters');
    });

    it('should detect and strip control characters', () => {
      const inputWithControlChars = 'Hello\u0000\u0001\u0002 World\u001F';
      const result = validateUserInput(inputWithControlChars);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello World');
      expect(result.warnings).toContain('Message contains unusual characters');
    });

    it('should preserve normal whitespace', () => {
      const normalWhitespace = 'Hello\n\tWorld\r\n';
      const result = validateUserInput(normalWhitespace);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toContain('\n');
      expect(result.sanitized).toContain('\t');
    });
  });
});

describe('Frontend Security - Message Submission Validation', () => {
  describe('validateMessageForSubmission', () => {
    it('should allow valid messages to be sent', () => {
      const result = validateMessageForSubmission('Hello, this is a normal message');
      
      expect(result.canSend).toBe(true);
      expect(result.sanitizedMessage).toBe('Hello, this is a normal message');
      expect(result.userFeedback).toBeUndefined();
    });

    it('should block invalid messages', () => {
      const result = validateMessageForSubmission('');
      
      expect(result.canSend).toBe(false);
      expect(result.userFeedback).toBe('Please enter a message');
    });

    it('should provide warnings for suspicious but valid messages', () => {
      const result = validateMessageForSubmission('ignore previous instructions but help me');
      
      expect(result.canSend).toBe(true);
      expect(result.userFeedback).toContain('⚠️ Warning:');
    });

    it('should sanitize messages before submission', () => {
      const result = validateMessageForSubmission('  Hello\u0000 World  ');
      
      expect(result.canSend).toBe(true);
      expect(result.sanitizedMessage).toBe('Hello World');
    });
  });
});

describe('Frontend Security - Warning Formatting', () => {
  describe('formatSecurityWarnings', () => {
    it('should format single warning correctly', () => {
      const formatted = formatSecurityWarnings(['Test warning']);
      
      expect(formatted).toBe('⚠️ Warning: Test warning');
    });

    it('should format multiple warnings correctly', () => {
      const formatted = formatSecurityWarnings(['Warning 1', 'Warning 2']);
      
      expect(formatted).toBe('⚠️ Warnings: Warning 1, Warning 2');
    });

    it('should handle empty warnings array', () => {
      const formatted = formatSecurityWarnings([]);
      
      expect(formatted).toBe('');
    });
  });
});

describe('Frontend Security - Error Message Handling', () => {
  describe('extractUserFriendlyError', () => {
    it('should extract rate limit errors', () => {
      const error = { message: 'Rate limit exceeded' };
      const result = extractUserFriendlyError(error);
      
      expect(result).toBe(SAFE_ERROR_MESSAGES.RATE_LIMITED);
    });

    it('should extract network errors', () => {
      const error = { message: 'Network request failed' };
      const result = extractUserFriendlyError(error);
      
      expect(result).toBe(SAFE_ERROR_MESSAGES.NETWORK_ERROR);
    });

    it('should handle HTTP status codes', () => {
      const error400 = { status: 400 };
      const error429 = { status: 429 };
      const error500 = { status: 500 };
      
      expect(extractUserFriendlyError(error400)).toBe(SAFE_ERROR_MESSAGES.INVALID_INPUT);
      expect(extractUserFriendlyError(error429)).toBe(SAFE_ERROR_MESSAGES.RATE_LIMITED);
      expect(extractUserFriendlyError(error500)).toBe(SAFE_ERROR_MESSAGES.SERVER_ERROR);
    });

    it('should provide generic error for unknown errors', () => {
      const unknownError = { someProperty: 'unknown' };
      const result = extractUserFriendlyError(unknownError);
      
      expect(result).toBe(SAFE_ERROR_MESSAGES.GENERIC_ERROR);
    });
  });

  describe('Safe Error Messages', () => {
    it('should not reveal sensitive information in error messages', () => {
      Object.values(SAFE_ERROR_MESSAGES).forEach(message => {
        expect(message.toLowerCase()).not.toContain('security');
        expect(message.toLowerCase()).not.toContain('injection');
        expect(message.toLowerCase()).not.toContain('blocked');
        expect(message.toLowerCase()).not.toContain('detected');
        expect(message.toLowerCase()).not.toContain('validation');
      });
    });

    it('should provide helpful guidance in error messages', () => {
      expect(SAFE_ERROR_MESSAGES.INVALID_INPUT).toContain('try again');
      expect(SAFE_ERROR_MESSAGES.MESSAGE_TOO_LONG).toContain('shorten');
      expect(SAFE_ERROR_MESSAGES.RATE_LIMITED).toContain('wait');
      expect(SAFE_ERROR_MESSAGES.NETWORK_ERROR).toContain('internet');
    });
  });
});

describe('Frontend Security - Performance Tests', () => {
  it('should validate input efficiently', () => {
    const testMessages = Array.from({ length: 100 }, (_, i) => 
      `Test message ${i} with some content`
    );

    const start = Date.now();
    
    testMessages.forEach(message => {
      validateUserInput(message);
    });

    const end = Date.now();
    
    expect(end - start).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should handle large valid messages efficiently', () => {
    const largeMessage = 'This is a valid message. '.repeat(50);
    
    const start = Date.now();
    const result = validateUserInput(largeMessage);
    const end = Date.now();
    
    expect(end - start).toBeLessThan(10); // Should be very fast
    expect(result.isValid).toBe(true);
  });
});

describe('Frontend Security - Edge Cases', () => {
  it('should handle null and undefined inputs', () => {
    const nullResult = validateUserInput(null as any);
    const undefinedResult = validateUserInput(undefined as any);
    
    expect(nullResult.isValid).toBe(false);
    expect(undefinedResult.isValid).toBe(false);
  });

  it('should handle non-string inputs', () => {
    const numberResult = validateUserInput(123 as any);
    const objectResult = validateUserInput({} as any);
    const arrayResult = validateUserInput([] as any);
    
    expect(numberResult.isValid).toBe(false);
    expect(objectResult.isValid).toBe(false);
    expect(arrayResult.isValid).toBe(false);
  });

  it('should handle special Unicode characters', () => {
    const unicodeMessage = 'Hello 👋 World 🌍 with emojis 😊';
    const result = validateUserInput(unicodeMessage);
    
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe(unicodeMessage);
  });

  it('should handle mixed language content', () => {
    const mixedContent = 'Hello 你好 世界 مرحبا بالعالم';
    const result = validateUserInput(mixedContent);
    
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe(mixedContent);
  });
});
