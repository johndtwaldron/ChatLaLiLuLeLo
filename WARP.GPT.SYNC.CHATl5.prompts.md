🧠 WARP.GPT.SYNC.CHATL5.prompts.md

Purpose:
This prompt reorients Warp GPT sessions with full project context for ChatLaLiLuLeLo.JDW, ensuring continuity between builds, debugging, CI, and TypeScript validation cycles.

🗂️ Project Summary

ChatLaLiLuLeLo.JDW is a Metal Gear Solid–themed AI codec interface that simulates philosophical or humorous dialogue via a stylized React Native Web + Expo app.
It uses:

React Native Web for cross-platform rendering.

TypeScript with strict type safety.

Custom codec UI (cyan terminal aesthetic, animated messages, voice playback).

ElevenLabs TTS for AI-generated voices.

Patch modules (SafeView.tsx, patchRawText.ts) to fix React Native Web rendering bugs (e.g. “Unexpected text node” warnings).

BitVault-style modular debug architecture via /src/debug.

Audio + Voice subsystems under /src/lib/audio and /src/lib/voice.

Dev, QA, and build automation via npm scripts defined in the root.

⚙️ Local Dev Boot Procedure
# 1️⃣ Start local server
npm run dev
# -> runs Expo/Metro bundler with web target (localhost:14085)


Root-level script handles hot reloading for both apps/mobile and shared packages.

If WarpGPT needs to modify code, ensure it runs in the correct context (apps/mobile).

🧪 Local CI + Lint Pipeline

After any major commit, run:

# Run CI tests locally
npm run ci:test

# Validate TypeScript (strict mode)
npm run lint:ts

# Run ESLint + Prettier checks
npm run lint


✅ These commands confirm all modules build cleanly before pushing or merging.

🔧 Troubleshooting Context

Common issues:

“Unexpected text node: . A text node cannot be a child of a <View>.”
→ Originates from react-native-web View patching.
→ Review /src/debug/patchRawText.ts and /src/debug/SafeView.tsx.

Portraits not rendering → Check asset import patterns (asImg(require(...))) in Portrait.tsx.

Voice system not initializing → Inspect /src/lib/voice/index.ts and confirm ElevenLabs API key presence.

🧩 WarpGPT Session Tasks

When starting a new WarpGPT session:

Read /docs/devlog.md — summarize the last 3–5 entries to reorient on context.

Check current branch & logs for any “FIXME” or “TODO” tags.

Validate environment variables (logged in /src/lib/voice/debugEnv.ts).

Review /src/debug/patchRawText.ts output for any [RNW RAW TEXT] stack errors.

Confirm SafeView + forwardRef integration aligns across:

ChatScreen.tsx

CodecFrame.tsx

SubtitleStream.tsx

Portrait.tsx

🧠 WarpGPT Guidance Prompts

When booting a session, run this in Warp’s prompt:

#Prompt to WarpGPT:
“Sync with the latest ChatLaLiLuLeLo.JDW context using WARP.GPT.SYNC.CHATL5.prompts.md.
Read /docs/devlog.md to recall last build changes, verify which scripts run in root (npm run dev, ci:test, lint, lint:ts), and confirm TypeScript and ESLint validations.
Then assist with debugging any active console errors and coordinate code patching inside /apps/mobile/src/debug or /src/components as needed.”