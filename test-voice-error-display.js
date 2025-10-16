/**
 * Test Voice Error Display
 * 
 * This script tests the voice error display functionality by:
 * 1. Waiting for the VoiceBox component to register its global error handler
 * 2. Triggering a quota exceeded error to display the themed message
 * 3. Verifying the error message appears and auto-hides after 10 seconds
 */

console.log('[TEST] Starting voice error display test...');

// Test function to trigger voice error
function testVoiceError() {
  console.log('[TEST] Checking for global voice error handler...');
  
  if (typeof globalThis.__voiceErrorHandler === 'function') {
    console.log('[TEST] Found global voice error handler, triggering quota error...');
    
    // Simulate the exact error message from ElevenLabs quota exceeded
    const testError = 'ElevenLabs API error: 401 - {"detail":{"status":"quota_exceeded","message":"This request exceeds your quota of 40000. You have 59 credits remaining, while 221 credits are required for this request."}}';
    
    globalThis.__voiceErrorHandler(testError);
    
    console.log('[TEST] Voice error triggered. Check UI for error message below VoiceBox.');
    console.log('[TEST] Message should auto-hide after 10 seconds.');
    
    return true;
  } else {
    console.log('[TEST] Global voice error handler not found. VoiceBox component may not be mounted.');
    return false;
  }
}

// Test immediately
if (!testVoiceError()) {
  console.log('[TEST] Retrying in 2 seconds...');
  
  // Retry after 2 seconds to allow component mounting
  setTimeout(() => {
    if (!testVoiceError()) {
      console.log('[TEST] Failed to find voice error handler. Ensure VoiceBox component is rendered.');
    }
  }, 2000);
}

// Add manual trigger function to global scope for console testing
globalThis.triggerVoiceError = testVoiceError;
console.log('[TEST] Manual trigger available: triggerVoiceError()');
