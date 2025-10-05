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
    let result;
    
    if (typeof file === 'object' && file.uri) {
      // File is already an object with uri (Metro production format)
      let relativeUri = file.uri;
      if (relativeUri.startsWith('/')) {
        relativeUri = '.' + relativeUri;
      }
      result = {
        ...file,
        uri: relativeUri
      };
      console.log('[ASSET] Web production - converted object URI from:', file.uri, 'to:', relativeUri);
    } else if (typeof file === 'string' && file.startsWith('/')) {
      // File is a string path
      result = { uri: '.' + file };
      console.log('[ASSET] Web production - converted string path:', file, 'to:', '.' + file);
    } else {
      // File is already in correct format or unknown format
      result = file;
      console.log('[ASSET] Web production - using file as-is:', file);
    }
    
    console.log('[ASSET] Web production - final result:', result);
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
