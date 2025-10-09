/**
 * Environment Debug Utility
 * 
 * Simple utility to help debug environment variable loading issues in Expo/React Native
 */

export function debugEnvironmentVariables(): void {
  console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
  console.log('process.env keys count:', Object.keys(process.env).length);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Check all EXPO_PUBLIC_ variables
  const expoPublicVars = Object.keys(process.env)
    .filter(key => key.startsWith('EXPO_PUBLIC_'))
    .sort();
  
  console.log('\n--- EXPO_PUBLIC_ Variables ---');
  if (expoPublicVars.length === 0) {
    console.log('❌ No EXPO_PUBLIC_ variables found!');
    console.log('This suggests the .env file is not being loaded or variables are not prefixed correctly.');
  } else {
    expoPublicVars.forEach(key => {
      const value = process.env[key];
      if (key.includes('KEY') || key.includes('SECRET')) {
        // Hide sensitive values but show presence/length
        console.log(`${key}: [${value ? 'SET' : 'UNSET'}] ${value ? `(${value.length} chars)` : ''}`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });
  }

  // Check voice-specific variables
  console.log('\n--- Voice System Variables ---');
  const voiceVars = [
    'EXPO_PUBLIC_VOICE_ENABLED',
    'EXPO_PUBLIC_VOICE_ENGINE',
    'EXPO_PUBLIC_ELEVENLABS_ENABLED',
    'EXPO_PUBLIC_ELEVENLABS_API_KEY',
    'EXPO_PUBLIC_VOICE_AUTOPLAY',
    'EXPO_PUBLIC_VOICE_VOLUME',
    'EXPO_PUBLIC_VOICE_PRESET',
    'EXPO_PUBLIC_VOICE_SFX'
  ];

  voiceVars.forEach(key => {
    const value = process.env[key];
    const status = value ? '✅' : '❌';
    if (key.includes('KEY')) {
      console.log(`${status} ${key}: ${value ? `[SET] (${value.length} chars)` : '[NOT SET]'}`);
    } else {
      console.log(`${status} ${key}: ${value || '[NOT SET]'}`);
    }
  });

  // Check legacy variables (without EXPO_PUBLIC_ prefix)
  console.log('\n--- Legacy Variables (without EXPO_PUBLIC_) ---');
  const legacyVars = [
    'VOICE_ENABLED',
    'VOICE_ENGINE', 
    'ELEVENLABS_ENABLED',
    'ELEVENLABS_API_KEY'
  ];

  legacyVars.forEach(key => {
    const value = process.env[key];
    if (value) {
      console.log(`⚠️  ${key}: ${key.includes('KEY') ? `[SET] (${value.length} chars)` : value} (should use EXPO_PUBLIC_ prefix)`);
    }
  });

  console.log('=== END ENVIRONMENT DEBUG ===\n');
}

/**
 * Quick check if voice environment is properly configured
 */
export function checkVoiceEnvironment(): { 
  configured: boolean; 
  issues: string[]; 
  recommendations: string[] 
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check basic voice configuration
  if (!process.env.EXPO_PUBLIC_VOICE_ENABLED) {
    issues.push('EXPO_PUBLIC_VOICE_ENABLED is not set');
    recommendations.push('Add EXPO_PUBLIC_VOICE_ENABLED=true to .env');
  }

  if (!process.env.EXPO_PUBLIC_VOICE_ENGINE) {
    issues.push('EXPO_PUBLIC_VOICE_ENGINE is not set');
    recommendations.push('Add EXPO_PUBLIC_VOICE_ENGINE=elevenlabs to .env');
  }

  // Check ElevenLabs specific config
  if (process.env.EXPO_PUBLIC_VOICE_ENGINE === 'elevenlabs') {
    if (!process.env.EXPO_PUBLIC_ELEVENLABS_ENABLED) {
      issues.push('ElevenLabs engine selected but EXPO_PUBLIC_ELEVENLABS_ENABLED not set');
      recommendations.push('Add EXPO_PUBLIC_ELEVENLABS_ENABLED=true to .env');
    }

    if (!process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY) {
      issues.push('ElevenLabs engine selected but EXPO_PUBLIC_ELEVENLABS_API_KEY not set');
      recommendations.push('Add EXPO_PUBLIC_ELEVENLABS_API_KEY=your_api_key to .env');
    }
  }

  // Check if using old variable names
  const oldVarNames = ['VOICE_ENABLED', 'VOICE_ENGINE', 'ELEVENLABS_ENABLED', 'ELEVENLABS_API_KEY'];
  const usingOldNames = oldVarNames.some(name => process.env[name]);
  
  if (usingOldNames) {
    issues.push('Using old environment variable names without EXPO_PUBLIC_ prefix');
    recommendations.push('Prefix all voice-related environment variables with EXPO_PUBLIC_');
  }

  return {
    configured: issues.length === 0,
    issues,
    recommendations
  };
}
