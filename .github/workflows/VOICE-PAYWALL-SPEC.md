Love it. Today was a big Rick day. 🥃
	•	Rick mode works locally ✅
	•	Rick mode works on GitHub Pages ✅
	•	Auto Cloudflare deploy is now manual-only via workflow_dispatch ✅
	•	NEW_MODE_CHECKS + RICK-PLUS spec give us a repeatable pattern for future modes ✅

Now you want:
	1.	A voice paywall spec (.md) you can hand to WARP.
	2.	A Rick/Bogart ElevenLabs voice spec (.md) you can hand to WARP.

Here are both, ready to drop into the repo root (or docs/) and paste into WARP.

⸻

1️⃣ VOICE-PAYWALL-SPEC.md

# Voice Paywall Spec (MVP)

## Goal

Introduce a **simple, configurable paywall** for text-to-speech / voice playback:

- Every new user gets **one free voice use** (per device/session).
- After the free usage, **all voice playback is locked** behind a paywall.
- Must be **easy to toggle on/off** via config/env, without needing code changes.
- Must **play nicely with friends / dev testing** (easy bypass for pals/dev).

This spec defines behaviour and integration points so an agent (WARP/AI) can implement it safely.

---

## Behaviour

### 1. Free Trial Behaviour

- Each user/device gets **1 free voice use**.
- "Voice use" = one successful **voice playback** (e.g. playing TTS for an assistant reply).
- After that one use:
  - All voice play buttons should **still render**, but:
    - They are disabled *or*
    - Tapping them shows a “Voice Locked” message instead of playing audio.

### 2. Storage / Tracking

MVP is **client-side only**, no real billing, just gating.

- Track usage in **persistent client storage**:
  - On React Native: `AsyncStorage`.
  - On Web: `localStorage` (via existing shared abstraction if we have one).
- Use a simple structure like:

```ts
interface VoiceUsageState {
  usedFreeVoice: boolean;
  lastVoiceTimestamp?: string; // ISO, optional
}

	•	Key suggestions:
	•	@voice_paywall_state or similar.

3. Config / Feature Flags

We need to be able to flip the paywall without git changes:
	•	Add env flags (front and/or back):

Frontend (apps/mobile)
In .env / .dev.vars / Metro config:
	•	VOICE_PAYWALL_ENABLED=true|false
	•	VOICE_FREE_TRIAL_USES=1

If VOICE_PAYWALL_ENABLED=false:
	•	Existing behaviour: no gating, voice works as today.

If VOICE_PAYWALL_ENABLED=true:
	•	Enforce the “1 free use then lock” behaviour.

Backend (apps/edge) – Optional
Later, we can enforce server-side too via:
	•	VOICE_PAYWALL_BACKEND_ENFORCED=true|false

If set to true, backend will reject extra voice requests after free usage, based on some token/user id. For MVP we can skip server enforcement and only gate in the client.

4. Dev / Friends Bypass

We need a zero-friction bypass for JDW + pals:
	•	Implement either (or both):

A. Local Dev Flag
	•	If __DEV__ === true OR process.env.VOICE_PAYWALL_DEV_BYPASS === 'true', then:
	•	Skip the paywall entirely, or
	•	Reset usedFreeVoice=false each app load.

B. “Secret Switch” via Local Storage
	•	If localStorage/AsyncStorage contains e.g.:

{ devVoiceBypass: true }

under key @voice_paywall_dev_bypass, then:
	•	Paywall is disabled for that device.

This gives an easy manual bypass:
	•	Open Dev Tools → set localStorage key → refresh.

⸻

Integration Points

1. Voice Playback Call Site

Wherever we currently trigger TTS playback (e.g. “Colonel voice” for assistant messages):
	•	Before calling the TTS backend, insert:

import { canUseVoice, registerVoiceUse } from '../lib/voicePaywall'; // new module

if (!(await canUseVoice())) {
  // Show toast / banner / modal instead of playing
  showVoiceLockedMessage();
  return;
}

// Proceed with TTS
await playVoiceForMessage(message);

await registerVoiceUse(); // mark the free usage as consumed

We want this abstraction so future modes (Rick, Arnie, etc.) don’t care about paywall logic.

2. New Module: voicePaywall.ts

Create something like: apps/mobile/src/lib/voicePaywall.ts

Responsibilities:
	•	Load/save VoiceUsageState from AsyncStorage / localStorage.
	•	Respect VOICE_PAYWALL_ENABLED and VOICE_FREE_TRIAL_USES.
	•	Expose simple API:

export async function canUseVoice(): Promise<boolean>;
export async function registerVoiceUse(): Promise<void>;
export async function resetVoiceUsage(): Promise<void>; // for debug / dev tools

Logic:

if (!VOICE_PAYWALL_ENABLED) return true;

const state = await loadState();
const freeUses = Number(VOICE_FREE_TRIAL_USES ?? 1);

if (!state.usedFreeVoice && freeUses > 0) return true;
return false;

3. UI Behaviour
	•	When paywall is active and user has used free trial:
	•	Voice button shows locked state:
	•	Icon overlay (padlock), or
	•	Subtle style change.
	•	On tap:
	•	No TTS call.
	•	Show bottom sheet / toast:
	•	“Voice replies are locked after your first free use.”
	•	(Later: link to “Upgrade” or “Contact JDW”.)

Optional: show “Free voice used” badge somewhere in settings.

⸻

Testing Checklist

Unit / Integration
	•	canUseVoice():
	•	returns true when VOICE_PAYWALL_ENABLED=false.
	•	returns true when enabled and state.usedFreeVoice=false.
	•	returns false when enabled and state.usedFreeVoice=true.
	•	registerVoiceUse():
	•	Sets usedFreeVoice=true after first call.
	•	Dev bypass:
	•	When VOICE_PAYWALL_DEV_BYPASS=true, paywall is never enforced.

Manual
	1.	Set VOICE_PAYWALL_ENABLED=true.
	2.	Load app fresh:
	•	Tap voice → works once.
	3.	Tap voice again:
	•	No TTS plays.
	•	Paywall message appears.
	4.	Flip VOICE_PAYWALL_ENABLED=false:
	•	Voice works every time again.
	5.	Set dev bypass key:
	•	Paywall never shows.

⸻

Future Extensions (Not MVP)
	•	Real user accounts + per-user server-side tracking.
	•	Paid upgrades / Stripe integration.
	•	Multiple paywall tiers (X free uses per day).
	•	Per-mode pricing (e.g., Rick voice more “expensive”).

---

## 2️⃣ RICK-VOICE-SPEC.md

```md
# Rick / Bogart ElevenLabs Voice Integration Spec

## Goal

Give **Rick Mode** its own **distinct voice** using ElevenLabs:

- Rick/Bogart-style TTS when reading out assistant replies in Rick mode.
- Reuse existing voice pipeline (used for Colonel voice).
- Keep it fully compatible with the voice paywall.

---

## High-Level Behaviour

- When `uiMode === 'RICK'`:
  - **All TTS for assistant messages uses the Rick/Bogart voice.**
- In all other modes:
  - Behaviour stays as-is (Colonel or default voice).

If voice paywall is active:
- Rick voice is also gated by the same `canUseVoice()` checks.

---

## Voice Asset Prep (Outside Code)

1. Collect clean audio of **Humphrey Bogart / Rick Blaine**:
   - Ideally:
     - Clean clips, minimal music.
     - Good range of tone (dry, irritated, wry, softer).
2. Train / clone in **ElevenLabs**:
   - Create new voice:
     - Name: `Rick Blaine` or `Bogart Noir`.
3. Note the **voice ID** from ElevenLabs:
   - e.g. `ELEVENLABS_RICK_VOICE_ID = "abc123..."`.

We’ll store this in config, not hardcode it.

---

## Config / Environment

### 1. Backend (apps/edge)

In `apps/edge/.dev.vars.example` and Cloudflare secrets:

- `ELEVENLABS_API_KEY` (already in use for Colonel).
- `ELEVENLABS_VOICE_COLONEL` (existing).
- **New:** `ELEVENLABS_VOICE_RICK`:

```bash
ELEVENLABS_VOICE_RICK="<rick_bogart_voice_id>"

If ELEVENLABS_VOICE_RICK is not set, backend should fall back to the default voice and log a warning.

⸻

Backend Integration

Assumption: there is a central place where we create ElevenLabs requests for TTS, e.g.:
	•	apps/edge/lib/voice.ts
	•	or inside apps/edge/api/chat.ts if TTS is inlined.

1. Extend Voice Selection Logic

We need a mode-aware voice selector:

type VoiceMode = 'DEFAULT' | 'COLONEL' | 'RICK';

interface VoiceOptions {
  mode: VoiceMode;
}

function getVoiceIdForMode(opts: VoiceOptions): string {
  const colonelId = process.env.ELEVENLABS_VOICE_COLONEL;
  const rickId = process.env.ELEVENLABS_VOICE_RICK;
  const defaultId = colonelId ?? rickId ?? 'default';

  switch (opts.mode) {
    case 'RICK':
      return rickId || defaultId;
    case 'COLONEL':
      return colonelId || defaultId;
    default:
      return defaultId;
  }
}

When building the ElevenLabs request:

const voiceId = getVoiceIdForMode({ mode: resolvedMode });
// Use voiceId in the ElevenLabs API payload

2. Connecting Chat Mode to Voice Mode

In the chat handler (apps/edge/api/chat.ts), we already receive the mode field from the client ('JD' | 'BTC' | 'GW' | 'LORE' | 'RICK' | ...).
	•	Map chat mode to VoiceMode:

function mapChatModeToVoiceMode(chatMode: string): VoiceMode {
  if (chatMode === 'RICK') return 'RICK';
  // Other mappings as needed
  return 'DEFAULT';
}

Then:

const chatMode = body.mode ?? 'JD';
const voiceMode = mapChatModeToVoiceMode(chatMode);

// Pass voiceMode into voice pipeline
const voiceId = getVoiceIdForMode({ mode: voiceMode });

If voice is triggered in a separate endpoint (e.g. /voice), use similar mapping there.

3. Logging

Add structured logging to verify correct wiring:

console.log('[VOICE] Selected voice', {
  chatMode,
  voiceMode,
  voiceId: obfuscatedVoiceId(voiceId),
});

(Where obfuscatedVoiceId masks most of the ID for logs.)

⸻

Frontend Integration

We want the frontend to simply say “play TTS for this reply in current mode”, not care about specific voice IDs.

1. Existing TTS Hook / Function

Wherever we call voice playback today (e.g. playTtsForMessage(message)), update it to pass the current uiMode / chat mode along with the request:

playTtsForMessage({
  text: assistantMessageText,
  mode: currentMode, // 'RICK', 'JD', etc.
});

The backend already receives mode in chat; for TTS-specific endpoints we add it to the request body as well.

2. Rick Mode UI Consistency
	•	When in Rick mode:
	•	Optionally change any TTS UI label/tooltip to something Rick-flavoured:
	•	e.g. “Play it, Sam.” instead of “Play voice”.
	•	This is purely cosmetic and optional.

⸻

Interaction With Voice Paywall
	•	The paywall check happens on the client, before calling the backend:
	•	canUseVoice() / registerVoiceUse() from voicePaywall.ts.
	•	Rick voice is just another mode using the same pipeline:
	•	If paywall is ON and free usage consumed, Rick TTS is also blocked.
	•	No special cases for Rick in the paywall logic.

⸻

Testing Checklist

Backend
	•	With ELEVENLABS_VOICE_RICK set:
	•	In Rick mode, logs show voiceMode: 'RICK' and a different voiceId than Colonel.
	•	With ELEVENLABS_VOICE_RICK missing:
	•	Rick mode falls back to default voice.
	•	Warning logged, but no crashes.

Frontend
	•	In normal modes:
	•	TTS behaviour unchanged.
	•	In Rick mode:
	•	TTS calls send mode: 'RICK' to backend.
	•	Subjectively: generated audio sounds Bogart-esque.

Combined with Paywall
	•	With VOICE_PAYWALL_ENABLED=true:
	•	First Rick TTS works (if free trial not used).
	•	Subsequent attempts are blocked with paywall message.
	•	With VOICE_PAYWALL_ENABLED=false:
	•	Rick voice plays every time.

⸻

Future Extensions
	•	Separate per-mode quotas (e.g., Rick voice more “expensive” than default).
	•	UI voice selector:
	•	JD / Colonel / Rick / Arnie (future).
	•	Experimental “fade between voices” based on mode blending.

---

If you like, the next tidy step could be:

- Add both files to `docs/`:
  - `docs/VOICE-PAYWALL-SPEC.md`
  - `docs/RICK-VOICE-SPEC.md`
- Commit on `dev-plus`.
- Feed each one into WARP as “implement this in small safe steps”.

For now: you’ve got Rick mode *looking* and *sounding* like something real, and you’ve carved out the next power moves cleanly.