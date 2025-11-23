# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

ChatLaLiLuLeLo is a **production-ready React Native web application** that recreates the iconic Metal Gear Solid 2 codec interface for AI-powered philosophical conversations. The project is deployed live on GitHub Pages with a Cloudflare Workers backend.

**Key Features:**
- Authentic MGS2 codec aesthetic with CRT effects, scanlines, and animated portraits
- Four AI conversation modes (JD/Colonel, Bitcoin, Haywire/GW, MGS Lore)
- Lightning Network integration for Bitcoin payments
- Multi-layer security with prompt injection protection
- Budget controls and rate limiting

**Tech Stack:**
- Frontend: Expo + React Native (TypeScript) for web deployment
- Backend: Cloudflare Workers with OpenAI GPT-4o-mini
- Infrastructure: GitHub Pages (frontend) + Cloudflare Workers (backend)

## Development Commands

### Primary Development Workflow

```bash
# Enhanced development with CI validation (recommended)
npm run dev
# Starts both frontend (localhost:14085) and backend (localhost:8787)
# Includes automatic TypeScript/ESLint validation

# Alternative: Start without CI checks
npm run prod
```

**Port Numbers:**
- Frontend: `http://localhost:14085` (MGS2 140.85 frequency reference)
- Backend: `http://localhost:8787`
- API Health: `http://localhost:8787/health`

### Testing

```bash
# Run all tests
npm test

# Type checking and linting
npm run typecheck        # TypeScript validation
npm run lint            # ESLint code quality
npm run lint:fix        # Auto-fix linting issues

# Security testing
npm run test:security   # Prompt injection and validation tests

# Lightning Network testing
npm run test:lightning  # QR code and URI scheme validation

# CI validation (local)
npm run ci-check        # Same checks as GitHub Actions CI
```

### Build and Deployment

```bash
# Build web application
npm run build:mobile

# Deploy backend to Cloudflare
npm run deploy              # Development
npm run deploy:production   # Production
npm run deploy:staging      # Staging
```

## Code Architecture

### Monorepo Structure

```
apps/
├── mobile/              # React Native web application
│   ├── src/
│   │   ├── components/  # UI components (CodecFrame, Portrait, etc.)
│   │   ├── features/    # Feature modules (chat interface)
│   │   ├── lib/         # Core utilities
│   │   └── assets/      # Static resources (images, audio)
│   └── App.tsx
└── edge/                # Cloudflare Workers backend
    ├── api/             # API endpoints (chat.ts, health.ts)
    ├── lib/             # Backend utilities (security, logging)
    └── src/index.ts
```

### Key Architectural Patterns

#### Theme System (`apps/mobile/src/lib/theme.ts`)
- **Dynamic theme subscription**: Components subscribe to theme changes via `subscribeToTheme()`
- **Mode-specific themes**: Bitcoin mode automatically forces orange theme
- **Six color presets**: cyan (default), purple, gold, green, yellow, crimson
- **CRT effects toggle**: Globally controllable scanline/glow effects
- **Conversation modes**: `haywire`, `jd`, `lore`, `bitcoin`
- **Model selection**: `gpt-4o-mini` (default), `gpt-4o`, `gpt-3.5-turbo`, `mock`

**Important:** When adding new UI components, always subscribe to theme updates to enable live theme switching without reloading.

#### API Integration (`apps/mobile/src/lib/api.ts`)
- **Dynamic URL resolution**: Auto-detects localhost vs production deployment
- **Streaming responses**: Word-boundary buffering with 40ms flush delays
- **Error handling**: Graceful degradation with user-friendly messages
- **Request structure**: `POST /chat` with `{messages, mode, sessionId, model}`

#### Security System (Multi-layer)
1. **Frontend validation** (`apps/mobile/src/lib/security.ts`):
   - Pre-flight input validation
   - 2,000 character limit, 20 lines max
   - Real-time user feedback
   
2. **Backend sanitization** (`apps/edge/lib/security.ts`):
   - 15+ prompt injection pattern detection
   - HTML/control character stripping
   - 5,000 character hard limit
   - Structured security event logging

3. **CSP headers**: Auto-injected during GitHub Pages deployment

**Security principle:** All user input must pass validation in both frontend AND backend. Never trust client-side validation alone.

#### Audio System (`apps/mobile/src/lib/audio.ts`)
- **Platform detection**: Different implementations for web vs native
- **Preloading strategy**: All codec sounds loaded at startup
- **Error resilience**: Graceful fallback if audio fails to load
- **Web Audio API**: Used for web platform with proper buffer management

**Important:** Always test audio on web platform specifically, as it has different constraints than native.

#### Portrait Animation
- **Idle breathing**: Subtle scale animation (1.0 to 1.02)
- **Mouth movement**: Triggered during text streaming
- **Reanimated**: Uses `react-native-reanimated` for 60fps animations
- **Portrait cycling**: Multiple colonel portraits available per mode

### Backend Architecture

#### Request Flow (`apps/edge/api/chat.ts`)
1. CORS validation
2. Security validation (prompt injection detection)
3. Rate limiting check (30 requests per 15 minutes per IP)
4. Budget validation ($5/month limit)
5. OpenAI streaming request
6. Word-boundary buffered response streaming

#### Mode System Prompts
Each conversation mode has a distinct system prompt defining its personality:
- **JD Mode**: Colonel AI authority with philosophical condescension
- **Bitcoin Mode**: Monetary sovereignty education with orange-pill philosophy
- **GW Mode**: Haywire/glitch effects with reality fragmentation
- **MGS Mode**: Meta-analysis of MGS2's prophetic warnings

**Location:** `apps/edge/context/modes/`

#### Rate Limiting
- **Algorithm**: Sliding window with per-IP tracking
- **Limits**: 30 requests per 15 minutes
- **Budget**: Real-time token tracking against $5/month limit
- **Fallback**: Mode-specific responses when quota exceeded

## Development Principles

### Code Standards
- **TypeScript strict mode**: All code must type-check
- **Zero ESLint warnings**: Run `npm run lint:fix` before committing
- **Security-first**: All user input validated at multiple layers
- **Performance targets**: <16ms render times, 60fps animations

### Local-First Development
Always get local development working before web deployment. The enhanced dev script (`npm run dev`) ensures:
- Dependencies are installed
- TypeScript compiles
- ESLint passes
- Both frontend and backend start properly

### Testing Requirements
- **Unit tests**: Required for all new utilities and business logic
- **Security tests**: Required for any input validation changes
- **Integration tests**: Required for API endpoint changes
- **No breaking changes**: All existing tests must pass

### Branch Strategy
- **main**: Production-ready code with full CI validation
- **Dev-Voice.V1**: Voice feature development (v5 track)
- **Dev-QA**: Testing infrastructure expansion

### Environment Setup

#### Backend Configuration
Create `apps/edge/.dev.vars` from `apps/edge/.dev.vars.example`:
```bash
OPENAI_API_KEY=sk-proj-your-key-here
TAVILY_API_KEY=tvly-your-key-here  # Optional
```

**Never commit `.dev.vars` - it's in `.gitignore`**

#### Frontend Environment (optional)
Frontend auto-detects environment. No `.env` needed for local development.

## Common Tasks

### Adding a New Theme Color
1. Add color preset to `themePresets` in `apps/mobile/src/lib/theme.ts`
2. Add to `themeOrder` array if it should be in cycle rotation
3. Test with CRT effects enabled and disabled
4. Verify on web platform specifically

### Adding a New Conversation Mode
1. Create system prompt in `apps/edge/context/modes/`
2. Add mode to `ConversationMode` type in `apps/mobile/src/lib/theme.ts`
3. Add mode display name to `conversationModes` constant
4. Update mode selector UI in chat interface
5. Add corresponding tests

### Modifying Security Validation
1. Update patterns in `apps/edge/lib/security.ts` (backend)
2. Update validation in `apps/mobile/src/lib/security.ts` (frontend)
3. Add test cases in both `__tests__/security.test.ts` files
4. Run `npm run test:security` to verify
5. Check that legitimate use cases still work

### Testing Streaming Responses
The streaming system uses word-boundary buffering:
- Accumulates text until whitespace
- Flushes buffer every 40ms on word boundaries
- Configured in `theme.ts` under `typography.streamBuffer`

Test with various message lengths and ensure smooth rendering.

## Debugging

### Debug Panel
Press the debug icon (top-left) to access:
- Theme color picker
- CRT effects toggle
- Model selection
- API endpoint testing
- Portrait cycling

### Common Issues

**"Audio not playing on web"**
- Check browser console for Audio API errors
- Verify audio files are in `apps/mobile/assets/audio/`
- Ensure user interaction occurred before playing (browser requirement)

**"API connection failed"**
- Verify backend is running on port 8787
- Check `.dev.vars` file has valid OpenAI API key
- Review browser Network tab for actual error response

**"CRT effects not showing"**
- Check if `crtEnabled` is true via debug panel
- Verify `CodecFrame` component is rendering properly
- Test with different themes (some effects more visible on certain colors)

**"TypeScript errors after pulling changes"**
- Run `npm ci` in both root and `apps/mobile/`
- Delete `node_modules` and reinstall if issues persist
- Check for TypeScript version mismatch

## CI/CD

### GitHub Actions Workflows
- `.github/workflows/ci.yml`: Main CI pipeline (lint, test, security validation)
- `.github/workflows/pages.yml`: GitHub Pages deployment with CSP injection
- `.github/workflows/lightning-e2e.yml`: Lightning Network E2E tests

### CI Checks
All PRs must pass:
- TypeScript compilation
- ESLint code quality
- Unit tests
- Security tests
- Lightning Network tests
- Mobile asset validation
- API health checks

### Deployment
- **Frontend**: Auto-deploys to GitHub Pages on main branch push
- **Backend**: Manual deployment via `npm run deploy:production`

## Performance Considerations

- **Render budget**: Keep renders under 16ms for 60fps
- **Bundle size**: Web bundle should stay under 5MB
- **Audio preloading**: Only preload essential sounds for startup
- **Animation**: Use `react-native-reanimated` for GPU-accelerated animations
- **Theme updates**: Batch theme changes to avoid multiple re-renders

## Legal and Compliance

**IP-Safe Design**: This project contains no copyrighted MGS assets, character names, or trademarks. All artwork and code are original or open-source. It's an homage/parody under fair use.

**Security Compliance**: Follows OWASP Top 10 guidelines and implements comprehensive prompt injection protection.
