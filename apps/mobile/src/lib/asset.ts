import { Platform } from 'react-native';

/**
 * Universal asset resolver for React Native and Web compatibility
 * 
 * Local development (Metro): Uses direct require() returns
 * Web static export: Wraps in { uri: } for Expo's asset processing
 */

export function asImg(file: any) {
  console.log('[ASSET DEBUG] Input file:', typeof file, file);
  
  // Check if we're in local development mode
  const isLocalDev = Platform.OS === 'web' && (
    typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '14085'
    )
  );
  
  if (isLocalDev) {
    // Local development - use direct require for Metro bundler
    console.log('[ASSET] Local dev detected - using direct require for image');
    return file;
  }
  
  // Production web build or native
  if (Platform.OS === 'web') {
    // For web production, convert absolute paths to relative paths for GitHub Pages
    let assetPath = file;
    if (typeof file === 'string' && file.startsWith('/')) {
      assetPath = '.' + file;
    }
    
    // Try different formats to see which one React Native Web accepts
    const result = { uri: assetPath };
    console.log('[ASSET] Web production - input file:', file);
    console.log('[ASSET] Web production - processed path:', assetPath);
    console.log('[ASSET] Web production - final result:', result);
    
    // Also log the current hostname to verify production detection
    console.log('[ASSET] Current hostname:', window.location.hostname);
    console.log('[ASSET] Current port:', window.location.port);
    
    return result;
  }
  
  // Native platforms
  console.log('[ASSET] Native - using direct require:', Platform.OS);
  return file;
}

export function asAudio(file: any) {
  // Check if we're in local development mode
  const isLocalDev = Platform.OS === 'web' && (
    typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '14085'
    )
  );
  
  if (isLocalDev) {
    // Local development - use direct require for Metro bundler
    console.log('[ASSET] Local dev detected - using direct require for audio');
    return file;
  }
  
  // Production web build or native
  if (Platform.OS === 'web') {
    // For web production, convert absolute paths to relative paths for GitHub Pages
    let assetPath = file;
    if (typeof file === 'string' && file.startsWith('/')) {
      assetPath = '.' + file;
    }
    console.log('[ASSET] Web production - using wrapped format with relative path for audio:', assetPath);
    return { uri: assetPath };
  }
  
  // Native platforms
  console.log('[ASSET] Native - using direct require for audio:', Platform.OS);
  return file;
}

/**
 * Usage Examples:
 * 
 * For Images:
 * const image = asImg(require('../../assets/images/colonel.jpeg'));
 * <Image source={image} />
 * 
 * For Audio:
 * const audioFile = asAudio(require('../../assets/audio/codec-send.mp3'));
 * Audio.Sound.createAsync(audioFile)
 */
