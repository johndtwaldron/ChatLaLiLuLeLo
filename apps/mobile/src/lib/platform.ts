/**
 * Platform Detection Utilities
 * 
 * Provides reliable platform and device detection for UI adaptation.
 * Used to determine mobile vs desktop UI layouts and platform-specific behavior.
 */

export const isWeb = typeof window !== 'undefined';

export const isIOS =
  isWeb && /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

export const isAndroid = isWeb && /Android/.test(navigator.userAgent);

export const isSafari =
  isWeb &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
  !/CriOS|FxiOS/.test(navigator.userAgent);

/**
 * Detects if the current device is likely a mobile device
 * based on user agent string patterns
 */
export function guessIsMobile(): boolean {
  if (!isWeb) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Mobile/i.test(navigator.userAgent);
}

/**
 * Gets the screen dimensions for responsive design decisions
 */
export function getScreenInfo() {
  if (!isWeb) return { width: 0, height: 0, isNarrow: false };
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isNarrow = width < 768; // Typical mobile breakpoint
  
  return { width, height, isNarrow };
}

/**
 * Detects if the current environment supports touch input
 */
export function supportsTouchInput(): boolean {
  if (!isWeb) return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Platform-specific constants for UI measurements
 */
export const PLATFORM_CONSTANTS = {
  // Minimum touch target size (44px is iOS guideline)
  MIN_TOUCH_TARGET: 44,
  
  // Safe area margins for different platforms
  SAFE_MARGINS: {
    top: isIOS ? 44 : 24,    // Status bar + notch consideration
    bottom: isIOS ? 34 : 24, // Home indicator on iOS
    sides: 16,
  },
  
  // Mobile breakpoints
  BREAKPOINTS: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
  },
} as const;
