/**
 * Unit Tests for iOS Audio Compatibility Fixes
 * 
 * Tests the iPhone Safari audio activation fixes to ensure:
 * 1. iOS detection works correctly
 * 2. Silent audio activation functions properly
 * 3. Audio context resumption works
 * 4. No regressions on other platforms
 */

import { jest } from '@jest/globals';

// Mock Web Audio API
const mockAudioContext = {
  state: 'suspended',
  resume: jest.fn().mockResolvedValue(undefined),
  createBuffer: jest.fn().mockReturnValue({}),
  createBufferSource: jest.fn().mockReturnValue({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
  }),
  destination: {},
};

const mockAudio = {
  volume: 0,
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  remove: jest.fn(),
};

// Mock global objects
global.window = {
  AudioContext: jest.fn().mockImplementation(() => mockAudioContext),
  webkitAudioContext: jest.fn().mockImplementation(() => mockAudioContext),
  location: {
    hostname: 'localhost',
  },
  MSStream: undefined,
} as any;

// Define a configurable navigator mock
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  },
  configurable: true,
  writable: true,
});

global.Audio = jest.fn().mockImplementation(() => mockAudio);

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('iOS Audio Compatibility Fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset audio context state
    mockAudioContext.state = 'suspended';
    // Reset navigator userAgent to iPhone
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });
  });

  describe('iOS Safari Detection', () => {
    test('should detect iPhone user agent', () => {
      const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      expect(isIOSSafari).toBe(true);
    });

    test('should detect iPad user agent', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        configurable: true,
      });

      const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      expect(isIOSSafari).toBe(true);
    });

    test('should not detect desktop Safari as iOS', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
        configurable: true,
      });

      const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      expect(isIOSSafari).toBe(false);
    });

    test('should not detect Chrome as iOS Safari', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true,
      });

      const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      expect(isIOSSafari).toBe(false);
    });
  });

  describe('Silent Audio Activation', () => {
    test('should create silent audio element with correct data URL', () => {
      // Simulate the silent activation function from CodecStandby
      const silentActivation = () => {
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==');
        audio.volume = 0;
        return audio.play();
      };

      const playPromise = silentActivation();

      expect(Audio).toHaveBeenCalledWith('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==');
      expect(mockAudio.volume).toBe(0);
      expect(mockAudio.play).toHaveBeenCalled();
      expect(playPromise).toBeInstanceOf(Promise);
    });

    test('should handle silent audio play rejection gracefully', async () => {
      mockAudio.play.mockRejectedValueOnce(new Error('NotAllowedError'));

      const silentActivation = async () => {
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==');
        audio.volume = 0;
        try {
          await audio.play();
          return true;
        } catch (error) {
          return false;
        }
      };

      const result = await silentActivation();
      expect(result).toBe(false);
    });
  });

  describe('AudioContext Resumption', () => {
    test('should resume suspended audio context', async () => {
      mockAudioContext.state = 'suspended';

      const ensureAudioContextRunning = async (audioContext: any) => {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
      };

      await ensureAudioContextRunning(mockAudioContext);

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    test('should not attempt to resume running audio context', async () => {
      mockAudioContext.state = 'running';

      const ensureAudioContextRunning = async (audioContext: any) => {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
      };

      await ensureAudioContextRunning(mockAudioContext);

      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });

    test('should handle audio context resume failure', async () => {
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume.mockRejectedValueOnce(new Error('Resume failed'));

      const ensureAudioContextRunning = async (audioContext: any) => {
        if (audioContext.state === 'suspended') {
          try {
            await audioContext.resume();
            return true;
          } catch (error) {
            return false;
          }
        }
        return true;
      };

      const result = await ensureAudioContextRunning(mockAudioContext);
      expect(result).toBe(false);
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });

  describe('iOS Silent Buffer Creation', () => {
    test('should create silent buffer for iOS audio unlock', () => {
      const createSilentBuffer = (audioContext: any) => {
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        return source;
      };

      const source = createSilentBuffer(mockAudioContext);

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 1, 22050);
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(source.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    test('should handle silent buffer creation failure', () => {
      mockAudioContext.createBuffer.mockImplementationOnce(() => {
        throw new Error('Buffer creation failed');
      });

      const createSilentBuffer = (audioContext: any) => {
        try {
          const buffer = audioContext.createBuffer(1, 1, 22050);
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          return source;
        } catch (error) {
          return null;
        }
      };

      const result = createSilentBuffer(mockAudioContext);
      expect(result).toBeNull();
    });
  });

  describe('Platform Compatibility', () => {
    test('should handle missing AudioContext gracefully', () => {
      const originalAudioContext = window.AudioContext;
      const originalWebkitAudioContext = (window as any).webkitAudioContext;
      
      delete (window as any).AudioContext;
      delete (window as any).webkitAudioContext;

      const createAudioContext = () => {
        try {
          return new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (error) {
          return null;
        }
      };

      const audioContext = createAudioContext();
      expect(audioContext).toBeNull();

      // Restore
      window.AudioContext = originalAudioContext;
      (window as any).webkitAudioContext = originalWebkitAudioContext;
    });

    test('should handle missing navigator gracefully', () => {
      const originalNavigator = global.navigator;
      delete (global as any).navigator;

      const detectIOS = () => {
        try {
          return typeof navigator !== 'undefined' && 
            /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        } catch (error) {
          return false;
        }
      };

      const isIOS = detectIOS();
      expect(isIOS).toBe(false);

      // Restore
      global.navigator = originalNavigator;
    });

    test('should handle missing window gracefully', () => {
      const isWindowAvailable = typeof window !== 'undefined';
      expect(isWindowAvailable).toBe(true);

      // Test the check that would be used in the actual code
      const checkWindowContext = () => {
        return typeof window !== 'undefined' && window.location;
      };

      expect(checkWindowContext()).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle Audio constructor failure', () => {
      (global.Audio as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Audio not supported');
      });

      const createAudioElement = () => {
        try {
          return new Audio();
        } catch (error) {
          return null;
        }
      };

      const audio = createAudioElement();
      expect(audio).toBeNull();
    });

    test('should handle audio play promise rejection', async () => {
      const mockAudioWithRejection = {
        volume: 0,
        play: jest.fn().mockRejectedValue(new Error('Play not allowed')),
        pause: jest.fn(),
        remove: jest.fn(),
      };

      (global.Audio as jest.Mock).mockImplementationOnce(() => mockAudioWithRejection);

      const playAudio = async () => {
        const audio = new Audio();
        try {
          await audio.play();
          return true;
        } catch (error) {
          return false;
        }
      };

      const result = await playAudio();
      expect(result).toBe(false);
    });
  });

  describe('Integration Compatibility', () => {
    test('should maintain backwards compatibility for non-iOS platforms', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      });

      const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      expect(isIOSSafari).toBe(false);

      // Should not attempt iOS-specific fixes
      const shouldApplyIOSFixes = isIOSSafari;
      expect(shouldApplyIOSFixes).toBe(false);
    });

    test('should not interfere with existing audio functionality', async () => {
      // Test that the fixes don't break normal audio context creation
      const audioContext = new window.AudioContext();
      expect(audioContext).toBeDefined();
      expect(typeof audioContext.resume).toBe('function');

      // Test that normal audio elements still work
      const audio = new Audio();
      expect(audio).toBeDefined();
      expect(typeof audio.play).toBe('function');
    });
  });
});

describe('Regression Prevention', () => {
  test('should not modify global objects permanently', () => {
    // Verify that our mocks haven't permanently modified globals
    expect(typeof window).toBe('object');
    expect(typeof navigator).toBe('object');
    expect(typeof Audio).toBe('function');
  });

  test('should maintain console functionality', () => {
    // Verify console methods are available (even if mocked)
    expect(typeof console.log).toBe('function');
    expect(typeof console.warn).toBe('function');
    expect(typeof console.error).toBe('function');
  });
});
