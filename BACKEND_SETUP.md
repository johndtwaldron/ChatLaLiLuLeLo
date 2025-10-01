# 🚀 Backend v1 Setup Guide

Complete implementation of ChatLaLiLuLeLo backend with OpenAI integration, conversation modes, and streaming responses.

## ✅ Implementation Status

### Core Features Complete:
- ✅ **OpenAI Streaming Chat** - Real-time token streaming via SSE
- ✅ **4 Conversation Modes** - BTC, JD, GW, MGS with distinct personalities  
- ✅ **Mode Prompt System** - External prompt files for each mode
- ✅ **Web Search Integration** - Optional Tavily API for research
- ✅ **Request Validation** - Zod schemas for type-safe API handling
- ✅ **Error Handling** - Comprehensive error handling and logging
- ✅ **CORS Support** - Development-friendly CORS headers
- ✅ **Health Check** - Service health monitoring endpoint
- ✅ **Frontend Integration** - Complete API client for mobile app

### Architecture:
```
apps/
  edge/              # Cloudflare Workers backend
    api/
      chat.ts        # Main chat endpoint with streaming
      health.ts      # Health check endpoint
    lib/
      openai.ts      # OpenAI client and streaming
      composer.ts    # Prompt composition and mode handling
      search.ts      # Web search functionality (Tavily)
      schema.ts      # Zod validation schemas
      logger.ts      # Structured logging with redaction
    src/
      index.ts       # Worker entry point
  mobile/
    src/lib/
      api.ts         # Frontend API client with streaming
    .env             # Environment configuration
prompts/modes/       # Mode-specific prompt files
  btc.md            # Bitcoin orange pill mode
  jd.md             # Colonel AI mentor mode  
  gw.md             # Controlled haywire mode
  mgs.md            # Media theory and lore mode
```

## 🔧 Environment Setup Required

### 1. OpenAI API Key (Required)
```bash
# Get your API key from: https://platform.openai.com/api-keys
npx wrangler secret put OPENAI_API_KEY
# Enter your key: sk-proj-...
```

### 2. Tavily API Key (Optional - for research features)
```bash
# Get your API key from: https://tavily.com/
npx wrangler secret put TAVILY_API_KEY  
# Enter your key: tvly-...
```

### 3. Model Configuration (Optional)
```bash
# Default: gpt-4o-mini (recommended for cost-effectiveness)
npx wrangler secret put OPENAI_MODEL
# Options: gpt-4o-mini, gpt-4o, gpt-4-turbo
```

## 🚀 Quick Start Commands

### 1. Install Backend Dependencies:
```bash
cd apps/edge
npm install
```

### 2. Install Mobile Dependencies (if needed):
```bash
cd apps/mobile  
npm install
```

### 3. Start Backend Development Server:
```bash
cd apps/edge
npm run dev
# Server runs at: http://localhost:8787
```

### 4. Test Health Check:
```bash
curl http://localhost:8787/health
```

### 5. Start Mobile App:
```bash
cd apps/mobile
npx expo start --web
# App runs at: http://localhost:8081
```

## 📡 API Testing

### Test Chat Endpoint:
```bash
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "JD",
    "messages": [{"role": "user", "content": "What is reality?"}],
    "options": {"temperature": 0.7, "max_tokens": 300}
  }'
```

### Expected Response (Streaming):
```
data: {"type":"delta","token":"Reality"}
data: {"type":"delta","token":" is"}
data: {"type":"delta","token":" a"}
data: {"type":"done","usage":{"completion_tokens":42}}
```

## 🎯 Mode Personalities

### BTC Mode - Orange Pill Philosophy
- **Focus**: Bitcoin sovereignty, self-custody, monetary philosophy
- **Style**: Educational, patient, codec-friendly bursts
- **Boundaries**: No financial advice, stay philosophical

### JD Mode - Colonel AI Mentor  
- **Focus**: Information theory, digital consciousness, reality questions
- **Style**: Calm mentor energy, reflective, meta-commentary
- **Boundaries**: No direct quotes, philosophical guidance

### GW Mode - Controlled Haywire
- **Focus**: Digital glitches, system instability, surreal communication
- **Style**: [STATIC] interruptions, controlled chaos, 10% glitch density
- **Boundaries**: Safe glitches, always intelligible core message

### MGS Mode - Media Theory & Lore
- **Focus**: Media manipulation, information control, symbolic meaning
- **Style**: Academic analysis, cultural critique, theory application  
- **Boundaries**: No copyrighted material, interpretive analysis

## 🔒 Security & Safety

### Built-in Protections:
- ✅ **API Key Redaction** - Keys logged with ***redaction***
- ✅ **Request Validation** - Zod schema validation prevents malformed requests
- ✅ **Error Boundaries** - Graceful error handling prevents crashes
- ✅ **Content Safety** - Mode prompts include safety guardrails
- ✅ **Rate Limiting Ready** - Architecture supports rate limiting addition

### Privacy Features:
- ✅ **Session IDs** - Trackable but not personally identifiable
- ✅ **Redacted Logging** - Sensitive data filtered from logs
- ✅ **No Data Persistence** - Stateless processing, no conversation storage

## 🚧 Known Limitations & TODO

### Current Limitations:
- ⚠️ **No Rate Limiting** - Add lightweight IP/session limits
- ⚠️ **No Conversation Memory** - Each request is independent  
- ⚠️ **Basic Error Recovery** - Could be more sophisticated
- ⚠️ **Single Model** - No model switching per mode

### Suggested Enhancements:
- 🔄 **Conversation Context** - Store recent messages per session
- 📊 **Usage Analytics** - Anonymous usage tracking and metrics
- 🔧 **Mode Intensity Dial** - Adjustable personality strength (1-5)
- 🧪 **A/B Testing** - Experiment with different prompts
- 🔐 **Authentication** - Optional user authentication system

## 🎉 Integration Success Checklist

### Backend Ready:
- [ ] OpenAI API key configured
- [ ] Backend server running on `localhost:8787`
- [ ] Health check returns OK status
- [ ] Chat endpoint accepts requests and streams responses

### Frontend Ready:  
- [ ] Mobile app running on `localhost:8081`
- [ ] Environment variable `EXPO_PUBLIC_API_URL` set to `http://localhost:8787`
- [ ] Mode toggle cycles through BTC/JD/GW/MGS modes
- [ ] Text input connects to real API (not placeholder responses)
- [ ] Streaming responses appear in subtitle stream

### Full Integration Test:
1. Start both backend and mobile servers
2. Switch to Bitcoin mode (should show orange theme)
3. Send message: "What is Bitcoin?"
4. Verify streaming response appears with Bitcoin philosophy
5. Switch modes and test different personalities

## 📞 Troubleshooting

### Backend Won't Start:
- Check Node.js version (16+ required)
- Run `npm install` in `apps/edge`
- Check for TypeScript errors with `npm run typecheck`

### API Returns 500 Errors:
- Check OpenAI API key is set correctly
- Check API key has sufficient credits
- Review console logs for detailed errors

### Mobile App Can't Connect:
- Verify `EXPO_PUBLIC_API_URL=http://localhost:8787` in `apps/mobile/.env`
- Check CORS errors in browser console
- Ensure backend server is running

### Streaming Not Working:
- Check browser supports Server-Sent Events
- Verify fetch API implementation in `apps/mobile/src/lib/api.ts`
- Check network panel for event-stream responses

## 🎯 Next Steps

Once environment is configured:
1. **Test all 4 modes** - Verify distinct personalities work
2. **Test streaming** - Ensure real-time token updates
3. **Test error handling** - Verify graceful failures
4. **Test orange pill** - Confirm Bitcoin mode enables orange theme
5. **Deploy to production** - Use `npm run deploy` when ready

**Status**: 🎉 **BACKEND V1 IMPLEMENTATION COMPLETE** - Ready for API key setup and testing!
