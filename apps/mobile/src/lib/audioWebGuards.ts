/**
 * Audio Web Guards - Prevent expo-av web crashes
 * 
 * This module provides defensive guards against the common expo-av web crash:
 * "Cannot read properties of undefined (reading 'emit')" that occurs when
 * audio elements are torn down while ontimeupdate events are still firing.
 */

import { Platform } from 'react-native';

/**
 * Web-specific audio element cleanup to prevent event handler crashes
 */
export function guardWebAudioElement(audioElement: HTMLAudioElement): () => void {
  if (Platform.OS !== 'web') {
    return () => {}; // No-op on non-web platforms
  }

  const originalHandlers = {
    ontimeupdate: audioElement.ontimeupdate,
    onended: audioElement.onended,
    onpause: audioElement.onpause,
    onplay: audioElement.onplay,
    onerror: audioElement.onerror,
    onloadstart: audioElement.onloadstart,
    oncanplay: audioElement.oncanplay,
  };

  // Create safe wrappers for all event handlers
  const createSafeHandler = (originalHandler: any) => {
    if (!originalHandler || typeof originalHandler !== 'function') {
      return null;
    }

    return (...args: any[]) => {
      try {
        // Check if the audio element and its context are still valid
        if (!audioElement || audioElement.readyState === HTMLMediaElement.HAVE_NOTHING) {
          return;
        }
        
        return originalHandler.apply(audioElement, args);
      } catch (error) {
        // Silently ignore errors from torn-down audio elements
        console.debug('[AUDIO GUARD] Prevented audio event handler crash:', (error as Error).message || error);
      }
    };
  };

  // Apply safe wrappers
  audioElement.ontimeupdate = createSafeHandler(originalHandlers.ontimeupdate);
  audioElement.onended = createSafeHandler(originalHandlers.onended);
  audioElement.onpause = createSafeHandler(originalHandlers.onpause);
  audioElement.onplay = createSafeHandler(originalHandlers.onplay);
  audioElement.onerror = createSafeHandler(originalHandlers.onerror);
  audioElement.onloadstart = createSafeHandler(originalHandlers.onloadstart);
  audioElement.oncanplay = createSafeHandler(originalHandlers.oncanplay);

  // Return cleanup function
  return () => {
    try {
      if (audioElement) {
        audioElement.ontimeupdate = null;
        audioElement.onended = null;
        audioElement.onpause = null;
        audioElement.onplay = null;
        audioElement.onerror = null;
        audioElement.onloadstart = null;
        audioElement.oncanplay = null;
      }
    } catch (cleanupError) {
      console.debug('[AUDIO GUARD] Audio cleanup completed with minor issues:', (cleanupError as Error).message || cleanupError);
    }
  };
}

/**
 * Hook to safely manage audio element lifecycle in React components
 */
export function useWebAudioGuard() {
  const cleanupCallbacks = new Set<() => void>();

  const guardAudioElement = (audioElement: HTMLAudioElement) => {
    const cleanup = guardWebAudioElement(audioElement);
    cleanupCallbacks.add(cleanup);
    return cleanup;
  };

  const cleanupAll = () => {
    cleanupCallbacks.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.debug('[AUDIO GUARD] Cleanup callback failed:', (error as Error).message || error);
      }
    });
    cleanupCallbacks.clear();
  };

  return {
    guardAudioElement,
    cleanupAll,
  };
}

/**
 * Patch expo-av Audio.Sound to automatically apply web guards
 * Call this once at app startup before creating any Audio.Sound instances
 */
export function patchExpoAudioForWeb(): void {
  if (Platform.OS !== 'web') {
    return;
  }

  try {
    // Runtime patches for common web audio issues
    
    // Global error handler for unhandled audio errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (event.error && event.error.message && 
            (event.error.message.includes('Cannot read properties of undefined (reading \'emit\')') ||
             event.error.message.includes('ontimeupdate') ||
             event.error.message.includes('audio element'))) {
          console.debug('[AUDIO GUARD] Caught global audio error:', event.error.message);
          event.preventDefault();
        }
      });
      
      // Unhandled promise rejection handler for audio cleanup
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && typeof event.reason === 'object' &&
            event.reason.message && event.reason.message.includes('audio')) {
          console.debug('[AUDIO GUARD] Caught audio promise rejection:', event.reason.message);
          event.preventDefault();
        }
      });
    }
    
    console.log('[AUDIO GUARD] Web audio guards initialized with enhanced error handling');
  } catch (error) {
    console.warn('[AUDIO GUARD] Failed to initialize web guards:', error);
  }
}

/**
 * Safe wrapper for creating expo-av Audio.Sound instances on web
 */
export async function createSafeAudioSound(
  source: any,
  initialStatus?: any,
  onPlaybackStatusUpdate?: any,
  downloadFirst?: boolean
): Promise<any> {
  if (Platform.OS !== 'web') {
    // On native platforms, use expo-av directly
    const { Audio } = await import('expo-av');
    return Audio.Sound.createAsync(source, initialStatus, onPlaybackStatusUpdate, downloadFirst);
  }

  // On web, apply additional safety measures
  try {
    const { Audio } = await import('expo-av');
    
    // Wrap the onPlaybackStatusUpdate callback for additional safety
    const safeOnPlaybackStatusUpdate = onPlaybackStatusUpdate ? (status: any) => {
      try {
        onPlaybackStatusUpdate(status);
      } catch (error) {
        console.debug('[AUDIO GUARD] Playback status update error caught:', (error as Error).message || error);
      }
    } : undefined;
    
    const result = await Audio.Sound.createAsync(
      source, 
      initialStatus, 
      safeOnPlaybackStatusUpdate, 
      downloadFirst
    );
    
    // If the sound has an underlying audio element, guard it
    if (result.sound && (result.sound as any)._nativeAudioElement) {
      const audioElement = (result.sound as any)._nativeAudioElement;
      guardWebAudioElement(audioElement);
    }
    
    // Add additional safety wrapper to the sound instance
    if (result.sound) {
      const originalUnload = result.sound.unloadAsync;
      result.sound.unloadAsync = async () => {
        try {
          return await originalUnload.apply(result.sound);
        } catch (error) {
          console.debug('[AUDIO GUARD] Safe unload completed with minor issues:', (error as Error).message || error);
          return undefined as any; // Safe fallback
        }
      };
      
      const originalStop = result.sound.stopAsync;
      result.sound.stopAsync = async () => {
        try {
          return await originalStop.apply(result.sound);
        } catch (error) {
          console.debug('[AUDIO GUARD] Safe stop completed with minor issues:', (error as Error).message || error);
          return undefined as any; // Safe fallback
        }
      };
    }
    
    return result;
  } catch (error) {
    console.error('[AUDIO GUARD] Failed to create safe audio sound:', error);
    throw error;
  }
}

/**
 * Enhanced useEffect cleanup for audio components
 */
export function createAudioCleanupEffect(
  audioRef: React.MutableRefObject<any>,
  dependencies: any[] = []
) {
  return [
    () => {
      const cleanup = () => {
        if (audioRef.current) {
          try {
            // Stop any ongoing playback
            if (typeof audioRef.current.stopAsync === 'function') {
              audioRef.current.stopAsync().catch(() => {
                // Ignore cleanup errors
              });
            }

            // Unload the sound
            if (typeof audioRef.current.unloadAsync === 'function') {
              audioRef.current.unloadAsync().catch(() => {
                // Ignore cleanup errors  
              });
            }

            // Clear the reference
            audioRef.current = null;
          } catch (error) {
            console.debug('[AUDIO GUARD] Audio cleanup completed with minor issues:', (error as Error).message || error);
          }
        }
      };

      return cleanup;
    },
    dependencies
  ];
}
