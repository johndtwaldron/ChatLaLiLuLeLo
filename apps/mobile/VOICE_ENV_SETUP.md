# Voice Environment Variables Setup Guide

This guide explains how to properly configure environment variables for the voice synthesis system in your Expo/React Native app.

## ⚠️ Critical Issue: EXPO_PUBLIC_ Prefix Required

**The core issue you encountered:** Environment variables were `undefined` at runtime because React Native/Expo apps require a special prefix for client-side environment variables.

### The Problem
In regular Node.js applications, `process.env.VARIABLE_NAME` works directly. However, in React Native and Expo applications:

1. **Client-side code** (React Native components) cannot access arbitrary environment variables
2. Only variables prefixed with `EXPO_PUBLIC_` are bundled and available in the JavaScript runtime  
3. Without this prefix, the variables remain `undefined` even if set in `.env` files

### The Solution
All voice-related environment variables **must** use the `EXPO_PUBLIC_` prefix:

```bash
# ❌ WRONG - Will be undefined in React Native
VOICE_ENABLED=true
ELEVENLABS_API_KEY=your_key

# ✅ CORRECT - Will be available at runtime
EXPO_PUBLIC_VOICE_ENABLED=true
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_key
```

## Updated Environment Configuration

Update your `apps/mobile/.env` file to use the correct prefixes:

```bash
# ChatLaLiLuLeLo Mobile App Environment Configuration

# Backend API URL - Default to local development
EXPO_PUBLIC_API_URL=http://localhost:8787

# App Configuration  
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_SESSION_ID_PREFIX=chatlali

# Development settings
EXPO_PUBLIC_DEBUG_MODE=true

# Voice/TTS Configuration - Use EXPO_PUBLIC_ prefix for client-side access
EXPO_PUBLIC_VOICE_ENABLED=true
EXPO_PUBLIC_VOICE_ENGINE=elevenlabs

# ElevenLabs Configuration
EXPO_PUBLIC_ELEVENLABS_ENABLED=true
# ElevenLabs API key - Use EXPO_PUBLIC_ prefix for client access
EXPO_PUBLIC_ELEVENLABS_API_KEY=sk_5eae940da80494d2c840d7009bd1d05026854789c608add1

# Voice Settings - Use EXPO_PUBLIC_ prefix for client-side access
EXPO_PUBLIC_VOICE_AUTOPLAY=true
EXPO_PUBLIC_VOICE_VOLUME=0.7
EXPO_PUBLIC_VOICE_PRESET=colonel-neutral
EXPO_PUBLIC_VOICE_SFX=true
```

## Why This Happens in Expo/React Native

1. **Bundle-time Processing**: Expo processes environment variables at build/bundle time
2. **Security**: Only explicitly prefixed variables are exposed to client code
3. **Tree Shaking**: This prevents accidentally bundling sensitive server-side variables

## Testing the Fix

After updating your environment variables:

1. **Stop the development server**: `Ctrl+C` in your terminal
2. **Clear Metro cache**: `npx expo start --clear` 
3. **Restart the app**: The voice system should now properly detect the environment variables

## Debugging Environment Variables

The voice system now includes enhanced debugging. When the app starts, you'll see:

```
=== ENVIRONMENT VARIABLES DEBUG ===
process.env keys count: X
NODE_ENV: development

--- EXPO_PUBLIC_ Variables ---
EXPO_PUBLIC_VOICE_ENABLED: true
EXPO_PUBLIC_VOICE_ENGINE: elevenlabs
EXPO_PUBLIC_ELEVENLABS_ENABLED: true
EXPO_PUBLIC_ELEVENLABS_API_KEY: [SET] (48 chars)
...
```

If you see "❌ No EXPO_PUBLIC_ variables found!", it means the `.env` file isn't being loaded or variables aren't prefixed correctly.

## Voice System Status

With correct environment variables, you should see:
```
[VOICE] Configuration loaded: { enabled: true, engine: 'elevenlabs', voicePreset: 'colonel-neutral' }
[VOICE] Service initialized with engine: ElevenLabs TTS
[VOICE] Using voice preset 'colonel-neutral' with voice ID: jm07e4kf2MeuSuRJx5vk
```

## Security Considerations

⚠️ **Important**: Variables with `EXPO_PUBLIC_` prefix are bundled into your client code and **visible to users**. 

For production:
- Consider using runtime configuration services
- Use short-lived API keys when possible  
- Implement server-side proxy for sensitive API calls
- Use environment-specific builds to avoid exposing development keys

## Common Issues

### 1. Variables Still Undefined
- Ensure proper `EXPO_PUBLIC_` prefix
- Restart development server after changing `.env`
- Check that `.env` file is in `apps/mobile/` directory

### 2. Voice ID Not Appearing in Logs  
- This was the symptom of the original issue
- Should resolve once environment variables are properly loaded

### 3. Voice System Disabled
- Check that `EXPO_PUBLIC_VOICE_ENABLED=true`
- Verify `EXPO_PUBLIC_ELEVENLABS_ENABLED=true`
- Confirm API key is set with proper prefix

## Verification Checklist

- [ ] All voice variables use `EXPO_PUBLIC_` prefix
- [ ] Development server restarted after env changes
- [ ] Debug logs show environment variables are loaded
- [ ] Voice configuration shows `enabled: true`
- [ ] ElevenLabs engine initializes successfully
- [ ] Voice ID `jm07e4kf2MeuSuRJx5vk` appears in synthesis logs

The voice system should now work correctly with your ElevenLabs Col.nonAI.v1 voice!
