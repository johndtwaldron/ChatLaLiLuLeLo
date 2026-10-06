# Voice Box Setup Guide

## Why is the Voice Box Missing?

The voice box (waveform visualization) appears in ChatScreen only when **voice is enabled**. This is controlled by environment variables.

## Quick Fix for Mac Local Development

### Step 1: Create `.env` file

```bash
cd apps/mobile
cp .env.example .env
```

### Step 2: Edit `.env` file

```bash
# Minimum required to show voice box:
EXPO_PUBLIC_VOICE_ENABLED=true
EXPO_PUBLIC_VOICE_ENGINE=elevenlabs

# For actual voice playback, also need:
EXPO_PUBLIC_ELEVENLABS_ENABLED=true
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_actual_key_here
```

### Step 3: Restart Dev Server

```bash
# Kill the current dev server (Ctrl+C)
# Then restart
npm run dev
```

The voice box should now appear at the top of the chat screen!

## Understanding the Voice System

### Environment Variable Requirements

The voice box visibility is gated by these checks (in `apps/mobile/src/lib/voice/index.ts`):

1. **`EXPO_PUBLIC_VOICE_ENABLED`** must be `'true'`
2. **`EXPO_PUBLIC_VOICE_ENGINE`** must be set to a valid engine
3. For ElevenLabs specifically:
   - `EXPO_PUBLIC_ELEVENLABS_ENABLED` must be `'true'`
   - `EXPO_PUBLIC_ELEVENLABS_API_KEY` must be set

### Voice Box Rendering Logic

In `ChatScreen.tsx` line 477:

```typescript
{voiceState.enabled && (
  <View>
    <VoiceBox ... />
  </View>
)}
```

The `voiceState.enabled` comes from `useVoicePlayingState()` hook, which gets it from `getVoiceConfig()`, which reads environment variables.

## Why GitHub Pages Shows Voice Box But Local Doesn't

### Scenario 1: Environment Variables Set During Build

If you built the app for GitHub Pages with voice environment variables set, they get baked into the production bundle.

When you run locally without those same environment variables, the voice system is disabled.

### Scenario 2: Different Branches

- **GitHub Pages** might be deployed from `main` branch with voice configured
- **Local dev** on `dev-rick` might have different `.env` or no `.env` at all

### Scenario 3: Production vs Development Check

The voice system includes web preview detection. From `voice/index.ts` lines 76-94:

```typescript
const isWebPreview = typeof window !== 'undefined' && (
  h.includes('vercel.app') ||
  h.includes('netlify.app') ||
  isGithubPages ||
  process.env.NODE_ENV === 'preview'
);

// Only disable voice on web preview if voice is NOT explicitly enabled
if (isWebPreview && !voiceEnabled) {
  // Voice disabled
}
```

If `EXPO_PUBLIC_VOICE_ENABLED=true` was set during GitHub Pages build, it works there. Without it locally, voice is disabled.

## Complete Voice Setup (With Audio Playback)

If you want actual voice output (not just the visual box):

### 1. Get ElevenLabs API Key

```bash
# Go to https://elevenlabs.io
# Sign up or login
# Navigate to Profile > API Keys
# Create new key
```

### 2. Configure Environment

```bash
# apps/mobile/.env
EXPO_PUBLIC_VOICE_ENABLED=true
EXPO_PUBLIC_VOICE_ENGINE=elevenlabs
EXPO_PUBLIC_ELEVENLABS_ENABLED=true
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_actual_key_here

# Optional settings
EXPO_PUBLIC_VOICE_AUTOPLAY=true
EXPO_PUBLIC_VOICE_VOLUME=0.7
EXPO_PUBLIC_VOICE_PRESET=colonel-neutral
```

### 3. Backend Configuration (Optional)

If you want backend to handle TTS:

```bash
# apps/edge/.dev.vars
ELEVENLABS_API_KEY=your_actual_key_here
```

## Testing Voice Configuration

### Check Environment Loading

The voice system logs detailed environment info. Watch for:

```
=== ENVIRONMENT VARIABLES DEBUG ===
--- EXPO_PUBLIC_ Variables ---
✅ EXPO_PUBLIC_VOICE_ENABLED: true
✅ EXPO_PUBLIC_VOICE_ENGINE: elevenlabs
✅ EXPO_PUBLIC_ELEVENLABS_ENABLED: true
✅ EXPO_PUBLIC_ELEVENLABS_API_KEY: [SET] (64 chars)
```

### Visual Confirmation

With voice enabled, you should see:
- **Voice Box** at top center of chat screen
- **VoiceControls toggle** in control buttons
- **Waveform animation** when audio is playing

### Debug Mode

Enable debug mode to see voice configuration:
1. Click debug icon (🐛) in top controls
2. Look for voice status section
3. Should show "Voice enabled: true"

## Troubleshooting

### ❌ Voice box still not showing after setting env vars

**Problem**: Environment variables not loaded

**Solutions**:
1. Verify `.env` file is in `apps/mobile/` directory
2. Check all variable names start with `EXPO_PUBLIC_`
3. Restart dev server completely:
   ```bash
   pkill -f expo
   pkill -f  metro
   npm run dev
   ```
4. Clear Expo cache:
   ```bash
   cd apps/mobile
   npx expo start --clear
   ```

### ❌ Voice box shows but no audio

**Problem**: Voice engine not initialized or API key invalid

**Solutions**:
1. Check console logs for `[VOICE]` messages
2. Verify ElevenLabs API key is correct
3. Check API key hasn't expired or hit quota
4. Try mock mode first:
   ```bash
   EXPO_PUBLIC_VOICE_ENGINE=disabled
   ```

### ❌ "EXPO_PUBLIC_VOICE_ENABLED is not set" warning

**Problem**: `.env` file not loaded

**Solutions**:
1. Make sure `.env` is in `apps/mobile/` not project root
2. Check file isn't named `.env.txt` or `.env.example`
3. Verify no syntax errors in `.env` file (no quotes, no spaces around =)

### ❌ Works on some machines but not others

**Problem**: Different environment configurations

**Solutions**:
1. Share `.env.example` with team
2. Document required environment variables
3. Add `.env` check to development script
4. Consider committing a `.env.development` template

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPO_PUBLIC_VOICE_ENABLED` | Yes | `false` | Master switch for voice system |
| `EXPO_PUBLIC_VOICE_ENGINE` | Yes if enabled | `'disabled'` | Engine type: `elevenlabs`, `openai`, `coqui` |
| `EXPO_PUBLIC_ELEVENLABS_ENABLED` | For ElevenLabs | `false` | Enable ElevenLabs engine |
| `EXPO_PUBLIC_ELEVENLABS_API_KEY` | For ElevenLabs | - | ElevenLabs API key |
| `EXPO_PUBLIC_VOICE_AUTOPLAY` | No | `false` | Auto-play AI responses |
| `EXPO_PUBLIC_VOICE_VOLUME` | No | `0.7` | Volume level (0-1) |
| `EXPO_PUBLIC_VOICE_PRESET` | No | `'colonel-neutral'` | Voice preset name |
| `EXPO_PUBLIC_VOICE_SFX` | No | `true` | Enable codec sound effects |

## For CI/CD and Production

### GitHub Pages Build

Set environment variables in GitHub Actions workflow:

```yaml
# .github/workflows/pages.yml
env:
  EXPO_PUBLIC_VOICE_ENABLED: true
  EXPO_PUBLIC_VOICE_ENGINE: elevenlabs
  EXPO_PUBLIC_ELEVENLABS_ENABLED: true
  # Set API key as GitHub secret
  EXPO_PUBLIC_ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}
```

### Vercel/Netlify

Add environment variables in project settings dashboard.

### Local Production Build

```bash
# Build with voice enabled
EXPO_PUBLIC_VOICE_ENABLED=true \
EXPO_PUBLIC_VOICE_ENGINE=elevenlabs \
npm run build:mobile
```

## Quick Reference: Enable Voice in 3 Steps

```bash
# 1. Add ElevenLabs key to .dev.vars
echo "ELEVENLABS_API_KEY=your_key_here" >> apps/edge/.dev.vars

# 2. Sync and start dev server
npm run dev  # Automatically syncs and starts

# 3. Check voice box appears at http://localhost:14085
```

**Note**: `npm run dev` automatically runs `npm run sync-env` first, so you don't need to sync manually!

Done! 🎉
