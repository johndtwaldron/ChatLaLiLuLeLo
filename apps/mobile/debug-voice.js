#!/usr/bin/env node

/**
 * Voice System Debug Script
 * 
 * This script helps debug voice system configuration issues
 * and environment variable problems.
 */

console.log('🔍 Voice System Debug Script');
console.log('================================\n');

console.log('📋 Environment Variables Check:');
console.log('-------------------------------');

// Check raw environment variables
const envVars = [
  'EXPO_PUBLIC_VOICE_ENABLED',
  'EXPO_PUBLIC_VOICE_ENGINE', 
  'EXPO_PUBLIC_ELEVENLABS_ENABLED',
  'EXPO_PUBLIC_ELEVENLABS_API_KEY',
  'EXPO_PUBLIC_VOICE_AUTOPLAY',
  'EXPO_PUBLIC_VOICE_VOLUME',
  'EXPO_PUBLIC_VOICE_PRESET',
  'EXPO_PUBLIC_VOICE_SFX',
  // Also check old format
  'VOICE_ENABLED',
  'ELEVENLABS_ENABLED', 
  'ELEVENLABS_API_KEY',
  'VOICE_AUTOPLAY',
  'VOICE_VOLUME',
  'VOICE_PRESET'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (varName.includes('API_KEY') ? `${value.substring(0,8)}...` : value) : 'NOT SET';
  console.log(`${status} ${varName}: ${display}`);
});

console.log('\n🔧 Voice Configuration Analysis:');
console.log('--------------------------------');

// Simulate the voice configuration logic
function analyzeVoiceConfig() {
  const voiceEnabled = process.env.EXPO_PUBLIC_VOICE_ENABLED === 'true';
  const elevenLabsEnabled = process.env.EXPO_PUBLIC_ELEVENLABS_ENABLED === 'true';
  const elevenLabsApiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
  const voiceEngine = process.env.EXPO_PUBLIC_VOICE_ENGINE;
  
  console.log(`Voice Enabled: ${voiceEnabled ? '✅' : '❌'} (${process.env.EXPO_PUBLIC_VOICE_ENABLED || 'undefined'})`);
  console.log(`ElevenLabs Enabled: ${elevenLabsEnabled ? '✅' : '❌'} (${process.env.EXPO_PUBLIC_ELEVENLABS_ENABLED || 'undefined'})`);
  console.log(`ElevenLabs API Key: ${elevenLabsApiKey ? '✅' : '❌'} (${elevenLabsApiKey ? 'Present' : 'Missing'})`);
  console.log(`Voice Engine: ${voiceEngine || 'undefined'}`);
  
  console.log('\n📊 Final Configuration:');
  let finalEngine = 'disabled';
  
  if (voiceEnabled) {
    if (voiceEngine === 'elevenlabs' && elevenLabsApiKey && elevenLabsEnabled) {
      finalEngine = 'elevenlabs';
    } else if (!voiceEngine && elevenLabsApiKey && elevenLabsEnabled) {
      finalEngine = 'elevenlabs'; // Auto-detect
    }
  }
  
  const configEnabled = voiceEnabled && finalEngine !== 'disabled';
  
  console.log(`Final Enabled: ${configEnabled ? '✅' : '❌'}`);
  console.log(`Final Engine: ${finalEngine}`);
  
  return { configEnabled, finalEngine, voiceEnabled, elevenLabsEnabled, elevenLabsApiKey: !!elevenLabsApiKey };
}

const config = analyzeVoiceConfig();

console.log('\n🚨 Issues Detected:');
console.log('-------------------');

const issues = [];
const recommendations = [];

if (!config.voiceEnabled) {
  issues.push('Voice system is disabled (EXPO_PUBLIC_VOICE_ENABLED != true)');
  recommendations.push('Set EXPO_PUBLIC_VOICE_ENABLED=true');
}

if (!config.elevenLabsEnabled) {
  issues.push('ElevenLabs engine is disabled (EXPO_PUBLIC_ELEVENLABS_ENABLED != true)'); 
  recommendations.push('Set EXPO_PUBLIC_ELEVENLABS_ENABLED=true');
}

if (!config.elevenLabsApiKey) {
  issues.push('ElevenLabs API key is missing (EXPO_PUBLIC_ELEVENLABS_API_KEY not set)');
  recommendations.push('Set EXPO_PUBLIC_ELEVENLABS_API_KEY=your_api_key');
}

const engineSetting = process.env.EXPO_PUBLIC_VOICE_ENGINE;
if (engineSetting && engineSetting !== 'elevenlabs') {
  issues.push(`Voice engine is set to '${engineSetting}' but ElevenLabs is needed`);
  recommendations.push('Set EXPO_PUBLIC_VOICE_ENGINE=elevenlabs (or remove to auto-detect)');
}

if (issues.length === 0) {
  console.log('✅ No configuration issues detected!');
} else {
  issues.forEach(issue => console.log(`❌ ${issue}`));
}

if (recommendations.length > 0) {
  console.log('\n💡 Recommendations:');
  console.log('-------------------');
  recommendations.forEach(rec => console.log(`💡 ${rec}`));
}

console.log('\n🔧 Environment File Check:');
console.log('---------------------------');

const fs = require('fs');
const path = require('path');

const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
let foundEnvFiles = [];

envFiles.forEach(fileName => {
  const filePath = path.join(process.cwd(), fileName);
  if (fs.existsSync(filePath)) {
    foundEnvFiles.push(fileName);
    console.log(`✅ Found: ${fileName}`);
  } else {
    console.log(`❌ Not found: ${fileName}`);
  }
});

if (foundEnvFiles.length === 0) {
  console.log('\n⚠️  No environment files found! You need to create one with:');
  console.log('   EXPO_PUBLIC_VOICE_ENABLED=true');
  console.log('   EXPO_PUBLIC_ELEVENLABS_ENABLED=true');
  console.log('   EXPO_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here');
}

console.log('\n🎯 Quick Fix Command:');
console.log('---------------------');
console.log('Create a .env file with these contents:');
console.log('');
console.log('EXPO_PUBLIC_VOICE_ENABLED=true');
console.log('EXPO_PUBLIC_ELEVENLABS_ENABLED=true'); 
console.log('EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here');
console.log('EXPO_PUBLIC_VOICE_AUTOPLAY=true');
console.log('EXPO_PUBLIC_VOICE_ENGINE=elevenlabs');
console.log('');
console.log('Then restart your app/server.');

console.log('\n================================');
console.log('🔍 Debug script completed');
