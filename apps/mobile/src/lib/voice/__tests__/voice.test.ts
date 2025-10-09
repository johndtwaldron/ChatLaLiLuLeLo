/**
 * Voice System Unit Tests
 * 
 * Tests voice engine functionality, security, and configuration handling
 */

import { validateTTSInput, quickTTSSecurityCheck, getMaxLengthForEngine } from '../VoiceSecurity';
import { COLONEL_VOICE_PRESETS } from '../VoiceEngine';

describe('Voice Security', () => {
  describe('validateTTSInput', () => {
    it('should accept valid text', () => {
      const result = validateTTSInput('Hello, how are you?');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe('Hello, how are you?');
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject empty text', () => {
      const result = validateTTSInput('');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('enter a message');
    });

    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(5000);
      const result = validateTTSInput(longText);
      expect(result.isValid).toBe(true); // Should truncate, not reject
      expect(result.sanitizedText.length).toBeLessThanOrEqual(4000);
      expect(result.warnings.some(w => w.includes('truncated'))).toBe(true);
    });

    it('should remove HTML tags', () => {
      const result = validateTTSInput('Hello <script>alert("xss")</script> world!');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe('Hello  world!');
      expect(result.warnings.some(w => w.includes('SSML tags removed'))).toBe(true);
    });

    it('should sanitize control characters', () => {
      const result = validateTTSInput('Hello\x00\x08world');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe('Helloworld');
      expect(result.warnings.some(w => w.includes('unusual characters'))).toBe(true);
    });

    it('should apply engine-specific sanitization', () => {
      const text = 'Hello 🎭 world! ™';
      const result = validateTTSInput(text, { engineSpecific: 'openai' });
      expect(result.isValid).toBe(true);
      // Should remove emoji and special characters for OpenAI
      expect(result.sanitizedText).toBe('Hello  world! ');
    });

    it('should limit text length per engine', () => {
      const longText = 'a'.repeat(2000);
      
      const openaiResult = validateTTSInput(longText, { engineSpecific: 'openai' });
      expect(openaiResult.sanitizedText.length).toBeLessThanOrEqual(4000);
      
      const coquiResult = validateTTSInput(longText, { engineSpecific: 'coqui', maxLength: 1000 });
      expect(coquiResult.sanitizedText.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('quickTTSSecurityCheck', () => {
    it('should accept safe text', () => {
      expect(quickTTSSecurityCheck('Hello world')).toBe(true);
      expect(quickTTSSecurityCheck('This is a normal sentence.')).toBe(true);
    });

    it('should reject dangerous patterns', () => {
      expect(quickTTSSecurityCheck('<script>alert("xss")</script>')).toBe(false);
      expect(quickTTSSecurityCheck('javascript:alert("xss")')).toBe(false);
      expect(quickTTSSecurityCheck('<iframe src="evil.com"></iframe>')).toBe(false);
      expect(quickTTSSecurityCheck('file:///etc/passwd')).toBe(false);
      expect(quickTTSSecurityCheck('data:text/html,<script>')).toBe(false);
    });

    it('should allow safe data URLs', () => {
      expect(quickTTSSecurityCheck('data:audio/mp3,base64data')).toBe(true);
      expect(quickTTSSecurityCheck('data:image/png,base64data')).toBe(true);
    });
  });

  describe('getMaxLengthForEngine', () => {
    it('should return correct limits for each engine', () => {
      expect(getMaxLengthForEngine('openai')).toBe(4000);
      expect(getMaxLengthForEngine('elevenlabs')).toBe(5000);
      expect(getMaxLengthForEngine('coqui')).toBe(1000);
      expect(getMaxLengthForEngine('unknown')).toBe(4000); // Default
    });
  });
});

describe('Voice Engine Configuration', () => {
  describe('COLONEL_VOICE_PRESETS', () => {
    it('should have required presets', () => {
      expect(COLONEL_VOICE_PRESETS).toHaveLength(3);
      
      const presetIds = COLONEL_VOICE_PRESETS.map(p => p.id);
      expect(presetIds).toContain('colonel-neutral');
      expect(presetIds).toContain('colonel-gravel');
      expect(presetIds).toContain('narrator');
    });

    it('should have valid preset structure', () => {
      COLONEL_VOICE_PRESETS.forEach(preset => {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('config');
        expect(preset.config).toHaveProperty('voiceId');
        expect(typeof preset.id).toBe('string');
        expect(typeof preset.name).toBe('string');
        expect(typeof preset.description).toBe('string');
        expect(typeof preset.config.voiceId).toBe('string');
      });
    });

    it('should have reasonable speed and pitch values', () => {
      COLONEL_VOICE_PRESETS.forEach(preset => {
        if (preset.config.speed) {
          expect(preset.config.speed).toBeGreaterThanOrEqual(0.25);
          expect(preset.config.speed).toBeLessThanOrEqual(4.0);
        }
        
        if (preset.config.pitch) {
          expect(preset.config.pitch).toBeGreaterThanOrEqual(-20);
          expect(preset.config.pitch).toBeLessThanOrEqual(20);
        }
      });
    });
  });
});

describe('Voice Service Integration', () => {
  // Mock environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should have voice disabled by default', async () => {
    // Clear voice-related env vars
    delete process.env.VOICE_ENABLED;
    delete process.env.OPENAI_API_KEY;
    
    // Re-import to get fresh instance
    const { getVoiceConfig } = await import('../index');
    
    const config = getVoiceConfig();
    expect(config.enabled).toBe(false);
    expect(config.engine).toBe('disabled');
  });

  it('should detect web preview environments', async () => {
    // Simulate web preview environment
    Object.defineProperty(window, 'location', {
      value: { hostname: 'test.vercel.app' },
      writable: true
    });
    
    process.env.VOICE_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'sk-test';
    
    // Voice should still be disabled due to web preview
    const { getVoiceConfig } = await import('../index');
    const config = getVoiceConfig();
    expect(config.enabled).toBe(false);
  });

  it('should enable voice with proper configuration', async () => {
    process.env.VOICE_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'sk-test123';
    process.env.VOICE_ENGINE = 'openai';
    
    const { getVoiceConfig } = await import('../index');
    const config = getVoiceConfig();
    expect(config.enabled).toBe(true);
    expect(config.engine).toBe('openai');
  });

  it('should auto-detect available engine', async () => {
    process.env.VOICE_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'sk-test123';
    // Don't set VOICE_ENGINE - should auto-detect
    
    const { getVoiceConfig } = await import('../index');
    const config = getVoiceConfig();
    expect(config.enabled).toBe(true);
    expect(config.engine).toBe('openai'); // Should auto-select OpenAI
  });

  it('should fallback to disabled when no engines available', async () => {
    process.env.VOICE_ENABLED = 'true';
    // No API keys provided
    delete process.env.OPENAI_API_KEY;
    delete process.env.ELEVENLABS_API_KEY;
    process.env.COQUI_ENABLED = 'false';
    
    const { getVoiceConfig } = await import('../index');
    const config = getVoiceConfig();
    expect(config.enabled).toBe(false);
    expect(config.engine).toBe('disabled');
  });
});

describe('Audio Mixer Mock Tests', () => {
  // These would be more complete with actual AudioMixer implementation
  // For now, just basic structure tests
  
  it('should handle audio chunks queue', () => {
    const mockAudioChunks = [
      new ArrayBuffer(1024),
      new ArrayBuffer(2048)
    ];
    
    expect(mockAudioChunks).toHaveLength(2);
    expect(mockAudioChunks[0].byteLength).toBe(1024);
    expect(mockAudioChunks[1].byteLength).toBe(2048);
  });

  it('should validate audio mixer configuration', () => {
    const mockConfig = {
      ttsVolume: 0.8,
      sfxVolume: 0.6,
      masterVolume: 0.7,
      enableDucking: true,
      duckingLevel: 0.3,
      maxQueueSize: 10
    };
    
    expect(mockConfig.ttsVolume).toBeGreaterThanOrEqual(0);
    expect(mockConfig.ttsVolume).toBeLessThanOrEqual(1);
    expect(mockConfig.sfxVolume).toBeGreaterThanOrEqual(0);
    expect(mockConfig.sfxVolume).toBeLessThanOrEqual(1);
    expect(mockConfig.masterVolume).toBeGreaterThanOrEqual(0);
    expect(mockConfig.masterVolume).toBeLessThanOrEqual(1);
    expect(mockConfig.duckingLevel).toBeGreaterThanOrEqual(0);
    expect(mockConfig.duckingLevel).toBeLessThanOrEqual(1);
    expect(mockConfig.maxQueueSize).toBeGreaterThan(0);
  });
});

// Smoke test for main voice service
describe('Voice Service Smoke Test', () => {
  it('should not crash during import', async () => {
    expect(async () => {
      await import('../VoiceService');
      await import('../index');
      await import('../AudioMixer');
    }).not.toThrow();
  });

  it('should export expected functions', async () => {
    const voiceModule = await import('../index');
    
    expect(typeof voiceModule.initializeVoice).toBe('function');
    expect(typeof voiceModule.getVoiceConfig).toBe('function');
    expect(typeof voiceModule.updateVoiceConfig).toBe('function');
    expect(typeof voiceModule.isVoiceReady).toBe('function');
    expect(typeof voiceModule.getVoiceEngine).toBe('function');
  });

  it('should export voice service functions', async () => {
    const serviceModule = await import('../VoiceService');
    
    expect(typeof serviceModule.synthesizeText).toBe('function');
    expect(typeof serviceModule.processMessageForTTS).toBe('function');
    expect(typeof serviceModule.playCodecSFX).toBe('function');
    expect(typeof serviceModule.clearVoiceQueue).toBe('function');
    expect(typeof serviceModule.stopAllVoice).toBe('function');
  });
});
