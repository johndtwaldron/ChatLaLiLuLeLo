/**
 * UI Mode Management
 * 
 * Handles user preference between desktop and mobile UI layouts.
 * Supports URL query parameters, localStorage persistence, and automatic detection.
 */

import { guessIsMobile, isWeb } from './platform';

const STORAGE_KEY = 'ChatLaLiLuLeLo_uiMode';
const DEBUG_OVERRIDE_KEY = 'ChatLaLiLuLeLo_uiModeDebugOverride';

export type UIMode = 'desktop' | 'mobile';

/**
 * Determines the initial UI mode based on:
 * 1. URL query parameter (?mode=desktop or ?mode=mobile)
 * 2. Saved user preference in localStorage
 * 3. Device detection fallback
 */
export function getInitialMode(): UIMode {
  // Check URL query parameter first (allows sharing specific modes)
  if (isWeb) {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam === 'desktop' || modeParam === 'mobile') {
      return modeParam;
    }
  }
  
  // Check debug override (for testing)
  const debugOverride = getDebugOverride();
  if (debugOverride) {
    return debugOverride;
  }
  
  // Check saved user preference
  const savedMode = getSavedMode();
  if (savedMode) {
    return savedMode;
  }
  
  // Fallback to device detection
  return guessIsMobile() ? 'mobile' : 'desktop';
}

/**
 * Saves the user's UI mode preference to localStorage
 */
export function setUIMode(mode: UIMode): void {
  if (!isWeb) return;
  
  try {
    localStorage.setItem(STORAGE_KEY, mode);
    console.log(`[UI MODE] Saved preference: ${mode}`);
  } catch (error) {
    console.warn('[UI MODE] Failed to save preference:', error);
  }
}

/**
 * Gets the saved UI mode preference from localStorage
 */
export function getSavedMode(): UIMode | null {
  if (!isWeb) return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as UIMode | null;
    if (saved === 'desktop' || saved === 'mobile') {
      return saved;
    }
  } catch (error) {
    console.warn('[UI MODE] Failed to read saved preference:', error);
  }
  
  return null;
}

/**
 * Clears the saved UI mode preference
 */
export function clearSavedMode(): void {
  if (!isWeb) return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[UI MODE] Cleared saved preference');
  } catch (error) {
    console.warn('[UI MODE] Failed to clear saved preference:', error);
  }
}

/**
 * Creates a URL with the specified UI mode as a query parameter
 */
export function createModeURL(mode: UIMode, baseURL?: string): string {
  if (!isWeb) return '';
  
  const url = new URL(baseURL || window.location.href);
  url.searchParams.set('mode', mode);
  return url.toString();
}

/**
 * Navigates to the current URL with the specified UI mode
 */
export function navigateWithMode(mode: UIMode): void {
  if (!isWeb) return;
  
  const newURL = createModeURL(mode);
  window.location.href = newURL;
}

/**
 * Gets display-friendly labels for UI modes
 */
export function getUIModeName(mode: UIMode): string {
  switch (mode) {
    case 'desktop':
      return 'Desktop';
    case 'mobile':
      return 'Mobile';
    default:
      return 'Unknown';
  }
}

/**
 * Gets description text for UI modes
 */
export function getUIModeDescription(mode: UIMode): string {
  switch (mode) {
    case 'desktop':
      return 'Full controls visible in header. Best for large screens and keyboards.';
    case 'mobile':
      return 'Simplified controls with collapsible panels. Optimized for touch devices.';
    default:
      return '';
  }
}

/**
 * Hook-like function to check if the current mode should use mobile UI
 * Combines user preference with responsive detection
 */
export function shouldUseMobileUI(explicitMode?: UIMode): boolean {
  const mode = explicitMode || getInitialMode();
  
  // If user explicitly chose mobile mode, always use mobile
  if (mode === 'mobile') return true;
  
  // If user explicitly chose desktop mode, only override on very small screens
  if (mode === 'desktop') {
    if (!isWeb) return false;
    // Force mobile UI on very narrow screens even in desktop mode
    return window.innerWidth < 480;
  }
  
  return false;
}

/**
 * DEBUG OVERRIDE FUNCTIONS - For testing mobile UI on desktop
 */

/**
 * Gets the debug UI mode override from localStorage
 */
export function getDebugOverride(): UIMode | null {
  if (!isWeb) return null;
  
  try {
    const override = localStorage.getItem(DEBUG_OVERRIDE_KEY) as UIMode | null;
    if (override === 'desktop' || override === 'mobile') {
      return override;
    }
  } catch (error) {
    console.warn('[UI MODE] Failed to read debug override:', error);
  }
  
  return null;
}

/**
 * Sets the debug UI mode override in localStorage
 * Use null to clear the override
 */
export function setDebugOverride(mode: UIMode | null): void {
  if (!isWeb) return;
  
  try {
    if (mode) {
      localStorage.setItem(DEBUG_OVERRIDE_KEY, mode);
      console.log(`[UI MODE] Debug override set: ${mode}`);
    } else {
      localStorage.removeItem(DEBUG_OVERRIDE_KEY);
      console.log('[UI MODE] Debug override cleared');
    }
  } catch (error) {
    console.warn('[UI MODE] Failed to set debug override:', error);
  }
}

/**
 * Checks if debug override is currently active
 */
export function isDebugOverrideActive(): boolean {
  return getDebugOverride() !== null;
}
