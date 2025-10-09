# ChatLaLiLuLeLo Voice System

A production-ready, pluggable Text-to-Speech (TTS) system that provides Colonel-style voice synthesis with multiple engine backends, security safeguards, and seamless integration.

## 🔐 Security & Safety First

⚠️ **IMPORTANT**: Voice features are **DISABLED BY DEFAULT** for security reasons.

- All voice engines require explicit configuration and API keys
- Text is rigorously sanitized before TTS processing
- Web preview deployments force-disable voice unless `PAGES_VOICE_ENABLE=1` is set
- No direct voice cloning - only neutral presets based on style/configuration

## 🎯 Features

- **Pluggable Architecture**: Swap TTS engines without touching app code
- **Colonel-Style Voices**: Neutral presets that evoke authority without copying real actors
- **Security-First**: Comprehensive input sanitization and SSML filtering
- **Non-Blocking**: Text renders immediately, audio is supplemental
- **Progressive Audio**: Plays audio chunks as they arrive (where supported)
- **Codec Sound Effects**: Integrated SFX for immersive MGS experience
- **Web Audio Pipeline**: Separate channels for TTS and SFX with ducking support

## 🚀 Quick Start

### 1. Local Development Setup

```bash
# Copy environment template
cp apps/mobile/.env.example apps/mobile/.env.local

# Enable voice features
echo "VOICE_ENABLED=true" >> apps/mobile/.env.local

# Add OpenAI API key (get from https://platform.openai.com/api-keys)
echo "OPENAI_API_KEY=your_openai_key_here" >> apps/mobile/.env.local

# Start with voice support
npm run dev:voice
```

### 2. Voice Controls

In the chat interface, look for the voice control button in the top control bar:

- **VOICE: OFF/ON** - Master voice toggle
- **Volume Controls** - Adjust playback volume
- **Voice Presets** - Choose Colonel voice style:
  - **Colonel Neutral**: Authoritative military commander
  - **Colonel Gravel**: Deeper, commanding tone
  - **Mission Narrator**: Clear tactical briefing voice

### 3. Configuration Options

```env
# Voice System
VOICE_ENABLED=false              # Master toggle (false by default)
VOICE_ENGINE=openai              # Engine: openai|elevenlabs|coqui
VOICE_AUTOPLAY=false             # Auto-play AI responses
VOICE_VOLUME=0.7                 # Default volume (0.0-1.0)
VOICE_PRESET=colonel-neutral     # Default voice preset
VOICE_SFX=true                   # Enable codec sound effects

# OpenAI TTS (Recommended)
OPENAI_API_KEY=                  # Required for OpenAI engine

# ElevenLabs (Feature-flagged)
ELEVENLABS_ENABLED=false         # Must be true to enable
ELEVENLABS_API_KEY=              # ElevenLabs API key

# Local Coqui TTS
COQUI_ENABLED=false              # Enable local TTS server
COQUI_TTS_URL=http://localhost:8020/tts  # Local TTS endpoint
```

## 🏗️ Architecture

### Engine Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
│   ChatScreen    │───▶│   VoiceService   │───▶│  AudioMixer    │
└─────────────────┘    └──────────────────┘    └────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌────────────────┐
                       │  Voice Engines   │    │   Web Audio    │
                       │  - OpenAI        │    │   - TTS Channel│
                       │  - ElevenLabs    │    │   - SFX Channel│
                       │  - Coqui Local   │    │   - Ducking    │
                       └──────────────────┘    └────────────────┘
```

### Security Pipeline

```
User Input → Security Validation → Engine-Specific Sanitization → TTS Engine → Audio Pipeline
```

Every text input goes through:
1. **Basic Security Validation** - Length limits, suspicious patterns
2. **SSML Sanitization** - Strip/validate markup (SSML disabled by default)
3. **Engine-Specific Cleaning** - Character set restrictions per engine
4. **Final Validation** - Ensure safe audio output

## 🎤 Supported Engines

### OpenAI TTS (Recommended)
- **Status**: ✅ Fully Implemented
- **Streaming**: No (single audio chunk)
- **Quality**: High quality, natural voices
- **Latency**: ~2-3 seconds for short text
- **Cost**: ~$15 per 1M characters
- **Voice Mapping**:
  - `colonel-neutral` → `onyx` (deep, authoritative)
  - `colonel-gravel` → `echo` (gravelly)
  - `narrator` → `alloy` (clear, neutral)

**Setup**:
```env
VOICE_ENABLED=true
VOICE_ENGINE=openai
OPENAI_API_KEY=sk-...
```

### ElevenLabs (Stub)
- **Status**: 🚧 API-Ready Stub
- **Streaming**: Yes (true streaming)
- **Quality**: Excellent, highly realistic
- **Feature Flag**: `ELEVENLABS_ENABLED=true` required
- **Note**: Implementation ready, needs completion for production use

**Setup**:
```env
VOICE_ENABLED=true
VOICE_ENGINE=elevenlabs
ELEVENLABS_ENABLED=true
ELEVENLABS_API_KEY=...
```

### Coqui Local TTS (Stub)
- **Status**: 🚧 HTTP-Ready Stub  
- **Streaming**: No
- **Quality**: Good, privacy-focused
- **Local Setup**: Requires XTTS/Piper server
- **Note**: Perfect for privacy-conscious deployments

**Setup**:
```bash
# Run local XTTS server (example)
docker run -p 8020:8020 coqui/tts-server

# Configure app
VOICE_ENABLED=true
VOICE_ENGINE=coqui
COQUI_ENABLED=true
COQUI_TTS_URL=http://localhost:8020/tts
```

## 🔧 Development

### Adding a New Engine

1. **Create Engine Adapter**:
```typescript
// apps/mobile/src/lib/voice/engines/myengine.ts
export class MyTTSEngine implements VoiceEngine {
  readonly name = 'My TTS';
  readonly supportsStreaming = true;
  
  async *synthesizeStream(text: string, opts?: SynthesizeOpts): AsyncIterable<VoiceChunk> {
    // Implementation here
  }
}
```

2. **Register Engine**:
```typescript
// apps/mobile/src/lib/voice/index.ts
import { MyTTSEngine } from './engines/myengine';

// Add to createEngine() method
case 'myengine':
  return new MyTTSEngine();
```

3. **Update Configuration**:
```typescript
// Update VoiceEngineType
export type VoiceEngineType = 'openai' | 'elevenlabs' | 'coqui' | 'myengine' | 'disabled';
```

### Testing Voice System

```bash
# Run voice-specific tests
npm run test:voice

# Test with OpenAI (requires API key)
VOICE_ENABLED=1 OPENAI_API_KEY=sk-... npm test

# Smoke test (mocked)
npm test src/lib/voice
```

### Development Scripts

```bash
# Start with voice enabled
npm run dev:voice

# Run voice smoke tests
npm run test:voice

# Type checking
npm run type-check
```

## 📊 Performance & Latency

### Expected Latency by Engine

| Engine      | Short Text (50 chars) | Medium Text (200 chars) | Long Text (1000 chars) |
|-------------|------------------------|---------------------------|--------------------------|
| OpenAI      | 1.5-2.5s              | 2-3s                     | 3-5s                    |
| ElevenLabs  | 1-2s                   | 1.5-2.5s                 | 2-4s                    |
| Coqui Local | 0.5-1.5s               | 1-2s                     | 2-3s                    |

### Optimization Tips

- **Sentence Chunking**: Long text is automatically split at sentence boundaries
- **Progressive Playback**: Audio starts playing as soon as first chunk arrives
- **Queue Management**: Multiple requests are queued and played sequentially
- **Caching**: Consider implementing audio caching for repeated phrases

## 🔒 Security Considerations

### Text Sanitization

All text goes through multiple sanitization layers:

```typescript
// Example security pipeline
const input = "Hello <script>alert('xss')</script> world!";
const result = validateTTSInput(input, {
  allowSSML: false,
  engineSpecific: 'openai'
});
// result.sanitizedText = "Hello  world!"
```

### SSML Safety

SSML is **disabled by default**. When enabled:
- Only safe tags allowed: `speak`, `p`, `break`, `emphasis`, `prosody`, etc.
- All attributes are validated and sanitized
- JavaScript/data URLs blocked
- Script tags and dangerous elements removed

### Rate Limiting

- Built-in queue management (max 10 items)
- Engine-specific character limits enforced
- Network timeout protection
- Graceful fallback on failures

## 🌐 Deployment

### Web Preview Safety

Web preview deployments (Vercel, Netlify, GitHub Pages) automatically disable voice unless explicitly enabled:

```env
# In deployment secrets only
PAGES_VOICE_ENABLE=1
```

This prevents accidental voice activation on public previews.

### Production Deployment

1. **Environment Variables**: Set all required API keys securely
2. **Monitoring**: Monitor TTS usage and costs
3. **Error Handling**: Voice failures don't break the app
4. **User Consent**: Consider adding voice consent UI for GDPR compliance

### Cost Management

```typescript
// Monitor usage in production
const usage = getVoiceServiceStatus();
console.log('TTS Queue:', usage.audioMixer.queueSize);
console.log('Engine:', usage.engineInfo);
```

## 🐛 Troubleshooting

### Voice Not Working

1. **Check Configuration**:
   ```bash
   # Verify environment variables
   cat .env.local | grep VOICE
   ```

2. **Check Console Logs**:
   ```
   [VOICE] Voice service initialized successfully
   [AUDIO] AudioMixer initialized successfully
   ```

3. **Common Issues**:
   - Missing API keys
   - Web browser autoplay policy (requires user interaction)
   - Network connectivity
   - Audio permissions

### Audio Not Playing

1. **Browser Autoplay Policy**: Modern browsers require user interaction
2. **Audio Context State**: Check if AudioContext is suspended
3. **Volume Settings**: Ensure volume > 0 and not muted
4. **SFX Channel**: Check if ducking is interfering

### Performance Issues

1. **Long Synthesis Times**: 
   - Check network connectivity
   - Consider shorter text chunks
   - Verify engine is responding

2. **Memory Usage**:
   - Audio chunks are held in memory during playback
   - Large queues consume more memory
   - Consider queue size limits

## 🔮 Future Enhancements

- **Sentence-by-sentence streaming**: Play audio while synthesizing remaining text
- **Voice Caching**: Cache frequently used phrases
- **Custom Voice Training**: Per-mode voice personalities
- **Emotion Detection**: Adjust voice tone based on message content
- **Real-time Voice Modulation**: Live voice effects
- **Multi-language Support**: Automatic language detection and switching

## 📜 Legal & Ethical Guidelines

- **No Voice Cloning**: Only neutral, synthesized voices
- **Respect Copyright**: No unauthorized voice reproduction  
- **User Consent**: Consider voice consent mechanisms
- **Privacy**: Local processing preferred when possible
- **Accessibility**: Voice should enhance, not replace text
- **Content Policy**: Ensure TTS content complies with platform policies

---

**Note**: This voice system prioritizes security, user consent, and ethical AI use. Always comply with your jurisdiction's AI and privacy regulations.
