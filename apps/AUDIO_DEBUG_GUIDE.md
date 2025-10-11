# Audio Debug Overlay - iPhone Testing Guide 🔊

## Overview
I've added a visual audio debugging overlay to your mobile app that displays real-time audio system status and logs directly on your iPhone screen. No desktop Safari Inspector needed!

## How to Use

### 1. Access the Audio Debug Panel
- Open your mobile app on iPhone Safari
- Look for the 🔊 button in the top control bar (next to DEBUG, CONN buttons)
- Tap the 🔊 button to open the Audio Debug Overlay

### 2. What You'll See

**Status Section:**
- ✅/❌ **iOS Safari**: Confirms if you're running on iOS Safari
- ✅/❓ **Codec Audio**: Whether sound effects (like codec close sound) are working
- **AudioContext**: State of Web Audio API context (`running`, `suspended`, etc.)
- **Last TTS**: Timestamp of last TTS attempt
- **TTS Result**: Result of TTS processing

**Test Buttons:**
- 🔊 **Test Codec Sound**: Plays a codec sound effect to verify basic audio works
- 🎤 **Test TTS Voice**: Triggers a test TTS playback

**Live Logs:**
- Real-time display of audio-related console logs
- Color-coded: Green=success, Red=errors, Yellow=warnings, White=info
- Shows all logs containing "voice", "TTS", "[AUDIO]", or "🍎" (iOS-specific)

### 3. Debugging Workflow

1. **First, test basic audio:**
   - Tap "Test Codec Sound"
   - If this works, your iOS audio is unlocked ✅
   - If this fails, iOS audio unlock is the issue ❌

2. **Then, test TTS:**
   - Tap "Test TTS Voice" 
   - Watch the logs for detailed iOS audio unlock steps
   - Look for 🍎 iOS-specific debug messages

3. **Monitor live during chat:**
   - Send a chat message
   - Watch the logs in real-time as TTS processes
   - See exactly where the TTS audio pipeline fails

## What to Look For

### ✅ **Good Signs:**
- iOS Safari: ✅ 
- Codec Audio unlocks successfully
- AudioContext state shows "running"
- TTS logs show successful audio synthesis

### ❌ **Problems to Report:**
- AudioContext stuck in "suspended" state
- iOS unlock attempts failing
- HTML5 Audio fallback errors
- ElevenLabs API failures

## Getting More Details

The overlay captures all the 🍎 iOS-specific logs I added to the AudioMixer. These will show you exactly what happens during:
- iOS Safari audio unlock attempts
- AudioContext resume calls  
- HTML5 Audio fallback attempts
- TTS audio synthesis and playback

## Next Steps

Once you test this, let me know:
1. What status indicators show (✅/❌ for each)
2. Any error messages in the logs
3. Whether codec sounds work but TTS doesn't (or vice versa)
4. Screenshots of the debug overlay if helpful

This should give us a complete picture of what's happening with iOS audio without needing desktop debugging tools! 🎯
