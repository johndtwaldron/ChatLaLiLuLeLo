import { describe, it, expect } from 'vitest';
import {
  validateOpenAIKey,
  validateTavilyKey,
  validateElevenLabsKey,
  getKeyPreview,
  validateEnvironment
} from '../config';

describe('API Key Validation', () => {
  describe('validateOpenAIKey', () => {
    it('should accept valid legacy OpenAI key', () => {
      const result = validateOpenAIKey('sk-1234567890abcdefghij');
      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('openai');
    });

    it('should accept valid project OpenAI key', () => {
      const result = validateOpenAIKey('sk-proj-1234567890abcdefghij');
      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('openai');
    });

    it('should accept key with underscores and dashes', () => {
      const result = validateOpenAIKey('sk-abc_def-123_456-xyz');
      expect(result.valid).toBe(true);
    });

    it('should reject missing key', () => {
      const result = validateOpenAIKey(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing');
    });

    it('should reject non-string key', () => {
      const result = validateOpenAIKey(12345);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a string');
    });

    it('should reject key with typo (double s)', () => {
      const result = validateOpenAIKey('ssk-1234567890abcdefghij');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('typo');
      expect(result.keyType).toBe('openai-typo');
    });

    it('should reject key with typo (double k)', () => {
      const result = validateOpenAIKey('skk-1234567890abcdefghij');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('typo');
    });

    it('should reject key with wrong prefix', () => {
      const result = validateOpenAIKey('ak-1234567890abcdefghij');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should reject key that is too short', () => {
      const result = validateOpenAIKey('sk-short');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should reject empty string', () => {
      const result = validateOpenAIKey('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTavilyKey', () => {
    it('should accept valid Tavily key', () => {
      const result = validateTavilyKey('tvly-1234567890abcdefghij');
      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('tavily');
    });

    it('should reject missing key', () => {
      const result = validateTavilyKey(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing');
    });

    it('should reject wrong prefix', () => {
      const result = validateTavilyKey('sk-1234567890abcdefghij');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should reject too short key', () => {
      const result = validateTavilyKey('tvly-short');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateElevenLabsKey', () => {
    it('should accept valid ElevenLabs key', () => {
      const result = validateElevenLabsKey('eleven-1234567890abcdefghij');
      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('elevenlabs');
    });

    it('should accept any format over 20 chars', () => {
      const result = validateElevenLabsKey('a'.repeat(25));
      expect(result.valid).toBe(true);
    });

    it('should reject missing key', () => {
      const result = validateElevenLabsKey(undefined);
      expect(result.valid).toBe(false);
    });

    it('should reject too short key', () => {
      const result = validateElevenLabsKey('short');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too short');
    });
  });

  describe('getKeyPreview', () => {
    it('should return first 5 chars + ... for valid key', () => {
      const preview = getKeyPreview('sk-1234567890abcdefghij');
      expect(preview).toBe('sk-12...');
    });

    it('should handle non-string gracefully', () => {
      const preview = getKeyPreview(12345);
      expect(preview).toBe('[number]');
    });

    it('should handle too-short string', () => {
      const preview = getKeyPreview('abc');
      expect(preview).toBe('[too-short]');
    });

    it('should handle undefined', () => {
      const preview = getKeyPreview(undefined);
      expect(preview).toBe('[undefined]');
    });
  });

  describe('validateEnvironment', () => {
    it('should pass with valid OpenAI key', () => {
      const result = validateEnvironment({
        OPENAI_API_KEY: 'sk-1234567890abcdefghij'
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with missing OpenAI key', () => {
      const result = validateEnvironment({});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('OPENAI_API_KEY');
    });

    it('should fail with invalid OpenAI key format', () => {
      const result = validateEnvironment({
        OPENAI_API_KEY: 'ssk-typo123456789012345'
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('typo');
    });

    it('should warn about invalid optional keys', () => {
      const result = validateEnvironment({
        OPENAI_API_KEY: 'sk-1234567890abcdefghij',
        TAVILY_API_KEY: 'invalid-format'
      });
      expect(result.valid).toBe(true); // Still valid since Tavily is optional
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('TAVILY_API_KEY');
    });

    it('should validate all keys when present', () => {
      const result = validateEnvironment({
        OPENAI_API_KEY: 'sk-1234567890abcdefghij',
        TAVILY_API_KEY: 'tvly-1234567890abcdefghij',
        ELEVENLABS_API_KEY: 'eleven-1234567890abcdefghij'
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle multiple validation failures', () => {
      const result = validateEnvironment({
        OPENAI_API_KEY: 'ssk-typo',
        TAVILY_API_KEY: 'bad',
        ELEVENLABS_API_KEY: 'short'
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should catch the ssk-proj typo from the bug report', () => {
      const result = validateOpenAIKey('ssk-proj-1234567890abcdefghij');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('typo');
    });

    it('should accept actual OpenAI project key format', () => {
      const result = validateOpenAIKey('sk-proj-AbCdEf1234567890GhIjKlMnOpQrStUvWxYz');
      expect(result.valid).toBe(true);
    });

    it('should warn in CI if API key is clearly wrong', () => {
      const result = validateEnvironment({
        OPENAI_API_KEY: 'your-api-key-here'
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('invalid');
    });
  });
});
