// Global type augmentations for the mobile app

// Extend Window interface to include IE-specific MSStream property
// This is used for iOS Safari detection
declare global {
  interface Window {
    MSStream?: any; // IE-specific property used for browser detection
    webkitAudioContext?: typeof AudioContext; // Safari-prefixed AudioContext
  }
}

export {};
