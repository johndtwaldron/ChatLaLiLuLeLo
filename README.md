# ChatLaLiLuLeLo

> A codec-style entertainment companion for intellectual sparring and MGS nostalgia

**⚠️ Legal Notice**: This project is an homage and parody, not affiliated with Konami or Metal Gear Solid. No trademarks, assets, or copyrighted content are used.

## What is this?

ChatLaLiLuLeLo is an iOS-first React Native app that recreates the codec interface aesthetic for entertaining philosophical discussions. It's designed for:

- MGS fans seeking nostalgia through familiar visual language
- Intellectual sparring with AI in a unique interface
- Entertainment through codec-style conversations

## Features

- **Authentic codec aesthetic**: Green phosphor terminal, scanlines, CRT glow effects
- **Animated portraits**: Colonel-style and user avatars with mouth movement
- **Scrolling subtitles**: Real-time streaming text with typewriter effects
- **Multiple conversation modes**: Philosophy, Bitcoin, Craic, and Haywire modes
- **IP-safe design**: Original assets inspired by, not copying, codec interfaces

## Tech Stack

- **Frontend**: Expo + React Native (TypeScript)
- **Animation**: React Native Reanimated + Lottie
- **State**: Zustand / Redux Toolkit
- **Backend**: Cloudflare Workers (future)
- **LLM**: OpenAI API (future)

## Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- iOS Simulator or physical iOS device
- Expo CLI

### Local Development

```bash
# Install dependencies
npm ci

# Start Expo development server
npm run dev

# Run on iOS Simulator
npm run ios
```

### Gitpod Development

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/your-username/ChatLaLiLuLeLo)

The Gitpod environment is pre-configured with:
- Node.js 20
- Expo CLI and EAS CLI
- VS Code extensions for React Native development

## Project Structure

```
├── apps/
│   └── mobile/              # Expo React Native app
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── features/    # Feature modules
│       │   ├── lib/         # Utilities and theme
│       │   └── assets/      # Images and animations
│       └── App.tsx          # App entry point
├── edge/
│   └── api/                 # Cloudflare Workers (future)
├── packages/
│   └── shared/              # Shared types and utilities
└── .gitpod.yml             # Cloud development environment
```

## Development

### Key Components

- **CodecFrame**: Main container with scanlines and CRT effects
- **Portrait**: Animated character portraits with mouth movement
- **SubtitleStream**: Scrolling text with typewriter animation

### Scripts

```bash
npm run dev        # Start Expo dev server
npm run typecheck  # TypeScript validation
npm run lint       # ESLint
npm run test       # Jest tests (future)
npm run e2e        # Detox E2E tests (future)
```

## Design Principles

1. **IP-Safe**: No direct references to MGS characters, names, or copyrighted content
2. **Authentic Feel**: Captures the codec aesthetic without infringement
3. **Performance**: 60fps animations on iPhone 12+
4. **Accessibility**: Dynamic text sizes, captions, screen reader support

## Roadmap

- [x] Basic codec UI components
- [x] Portrait animations and subtitle streaming
- [ ] OpenAI integration for conversations
- [ ] Multiple conversation modes
- [ ] TTS with lip-sync animation
- [ ] TestFlight beta release
- [ ] Android version via Expo

## Contributing

This is currently a personal project for JDW. Contributions welcome once initial development is complete.

## Legal

This project:
- Uses NO Konami assets, trademarks, or copyrighted materials
- References NO Metal Gear Solid characters by name
- Is clearly marked as parody/homage
- Uses only original artwork and code

Any resemblance to existing properties is purely for parody and educational purposes under fair use.

---

**Developed with ❤️ and respect for the source material**
