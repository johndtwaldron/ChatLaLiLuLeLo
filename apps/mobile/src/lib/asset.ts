import { Platform } from 'react-native';

/**
 * Universal asset resolver for React Native and Web compatibility
 * 
 * Local development (Metro): Uses direct require() returns
 * Web static export: Wraps in { uri: } for Expo's asset processing
 */

export function asImg(file: any) {
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
  const result = Platform.OS === 'web' ? { uri: file } : file;
  console.log('[ASSET] Production/native - using wrapped format for image:', Platform.OS);
  return result;
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
    return file;
  }
  
  // Production web build or native
  return Platform.OS === 'web' ? { uri: file } : file;
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
