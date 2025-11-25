SECRET-COMMANDS-SPEC.md 

# Secret Commands / Cheat Codes Spec

## Goal

Introduce **hidden commands** the user can type into the chat input that:

- Trigger **special behaviours** (SFX, video overlays, mode-specific quips).
- Do **not** require AI voice / ElevenLabs.
- Are **independent of normal chat** (intercepted before sending to backend).
- Feel like “cheat codes” or Easter eggs for people who know them.

MVP focuses on:

1. `PLAY <AUDIO_ID>` – plays a specific SFX and makes the current mode react.
2. `PLAY IT AGAIN SAM` – unlocks a special Casablanca / Woody Allen cinematic moment.

---

## 1. Architecture Overview

We add a **Secret Commands Layer** between the chat input and the normal send flow.

**Flow:**

1. User types text and hits Send.
2. Before calling `/chat`:
   - Run `handleSecretCommand(input, uiMode)`:
     - If it **matches a secret command**:
       - Perform the secret action (play SFX, show video, inject local “system message”).
       - **Do NOT** send the text to the backend (unless explicitly allowed).
       - Return early.
     - If it **doesn’t match**:
       - Fall back to normal behaviour (send to backend, etc).

This keeps secret commands self-contained and safe.

---

## 2. Command Grammar

### 2.1. `PLAY <AUDIO_ID>`

- **Pattern**: `PLAY <token>`
- Case-insensitive.
- `<token>` must match a **whitelisted audio ID**, e.g.:

  - `RATIONS`
  - `ALERT`
  - `JUST_TO_SUFFER`
  - `SECRET_FOUND` (new one)
  - `RICK_LINE_01`, `RICK_LINE_02`, etc.

- Example inputs:
  - `PLAY ALERT`
  - `play just_to_suffer`
  - `Play RICK_LINE_03`

**Behaviour:**

1. Parse token → look up in `SECRET_AUDIO_MAP`.
2. If found:
   - Play sound immediately (via existing codec audio / Rick audio system).
   - Inject a **local assistant message** into the chat, using the current `uiMode`:
     - e.g. in BTC mode:
       > “Nice choice. That alert hits like a 51% attack.”
     - in RICK mode:
       > “That sound fits this joint better than most of the clientele.”
3. If not found:
   - Optionally show a subtle toast: “Unknown secret sound.”

No call to backend required.

---

### 2.2. `PLAY IT AGAIN SAM`

- **Pattern**: whole string match, case-insensitive:
  - `PLAY IT AGAIN SAM`
- This is treated as a **named secret**, not a parameterised one.

**Behaviour (MVP):**

- Trigger a **special “secret unlocked” SFX** (see section 3.3).
- Then **open a cinematic view** with one of:

  **Option A – YouTube clip (lighter)**  
  - Open an in-app webview or external link to the “As Time Goes By / Play it, Sam” scene on YouTube.
  - Show a local assistant line in Rick mode:
    > “She never actually says it like that, but the myth’s good for business.”

  **Option B – Local MP4 (heavier, future)**  
  - Show a full-screen video player using a bundled MP4:
    - Either Casablanca scene.
    - Or Woody Allen’s *Play It Again, Sam* opening.
  - Needs:
    - Asset pipeline for `.mp4`.
    - VideoPlayer component.
    - Larger bundle size.

For now, **MVP can just open a YouTube URL in a webview** + SFX.

---

## 3. Assets & SFX

### 3.1. Secret Sound Effect (Easter Egg Ping)

We want a distinct SFX that means:

> “You’ve found something hidden.”

- File: `assets/audio/secret_found.mp3` (or similar).
- Could be:
  - Famous game unlock sound (Zelda chest, MGS secret, etc) – once you have a clean clip.

Use the same `asAudio` / asset pipeline as other sounds.

### 3.2. Rick-Associated SFX

We can map some `PLAY <AUDIO_ID>` commands to Rick-specific lines:

- `PLAY RICK_LINE_01` → a well-known Bogart line.
- `PLAY HERE_S_LOOKING_AT_YOU_KID` → corresponds to a specific mp3 in `rick.audio`.

These reuse the Rick audio pipeline; they’re just direct triggers instead of random cycling.

### 3.3. Audio Map

New module: `apps/mobile/src/lib/secretAudio.ts`:

```ts
import { asAudio } from './asset';

export type SecretAudioId =
  | 'ALERT'
  | 'RATIONS'
  | 'JUST_TO_SUFFER'
  | 'SECRET_FOUND'
  | 'RICK_LINE_01'
  | 'RICK_LINE_02';

export const SECRET_AUDIO_MAP: Record<SecretAudioId, any> = {
  ALERT: asAudio(require('../../assets/audio/mgs.alert.tindeck_1.mp3')),
  RATIONS: asAudio(require('../../assets/audio/mgs-rations.mp3')),
  JUST_TO_SUFFER: asAudio(require('../../assets/audio/why_are_we_still_here_just_to_suffer_2.mp3')),
  SECRET_FOUND: asAudio(require('../../assets/audio/secret_found.mp3')),
  RICK_LINE_01: asAudio(require('../../assets/rick.audio/here-s-looking-at-you-kid.mp3')),
  RICK_LINE_02: asAudio(require('../../assets/rick.audio/i-stick-my-neck-out-for-nobody.mp3')),
};

And a helper to get a playable URL for web/native (similar pattern as Rick assets).

⸻

4. Secret Command Engine

New module: apps/mobile/src/lib/secretCommands.ts

4.1. Types

export type SecretCommandResult =
  | { handled: false }
  | {
      handled: true;
      // Optional local assistant message to inject
      localAssistantText?: string;
    };

export interface SecretCommandContext {
  rawInput: string;
  uiMode: string;    // 'JD' | 'BTC' | 'GW' | 'LORE' | 'RICK' | ...
}

4.2. Entry Point

export async function handleSecretCommand(
  ctx: SecretCommandContext
): Promise<SecretCommandResult> {
  const text = ctx.rawInput.trim();

  // 1) PLAY IT AGAIN SAM (exact phrase)
  if (/^play it again sam$/i.test(text)) {
    await playSecretFoundSfx();
    await openPlayItAgainSamView(); // webview or link
    return {
      handled: true,
      localAssistantText: getPlayItAgainSamQuip(ctx.uiMode),
    };
  }

  // 2) PLAY <AUDIO_ID>
  const playMatch = /^play\s+([A-Z0-9_]+)$/i.exec(text);
  if (playMatch) {
    const id = playMatch[1].toUpperCase();
    const ok = await playSecretAudioById(id as any);
    if (!ok) {
      return { handled: true, localAssistantText: 'Unknown secret sound.' };
    }
    return {
      handled: true,
      localAssistantText: getPlayAudioQuip(ctx.uiMode, id),
    };
  }

  return { handled: false };
}

4.3. Mode-Specific Quips

function getPlayAudioQuip(uiMode: string, id: string): string {
  switch (uiMode) {
    case 'RICK':
      return `That one fits this joint just fine, kid. (${id})`;
    case 'BTC':
      return `Nice. That sound hits harder than a 10% candle. (${id})`;
    case 'GW':
      return `Heh. Reality glitch registered. (${id})`;
    default:
      return `Secret code acknowledged. (${id})`;
  }
}

function getPlayItAgainSamQuip(uiMode: string): string {
  switch (uiMode) {
    case 'RICK':
      return `You know she never actually says it like that, but myths sell more drinks.`;
    default:
      return `Classic move. Some scenes never get old.`;
  }
}


⸻

5. Wiring into Chat Flow

In the component that handles “Send” (likely ChatScreen.tsx or a hook it uses):

import { handleSecretCommand } from '../lib/secretCommands';

async function onSendPressed() {
  const input = textInputValue;
  const mode = uiMode;

  const result = await handleSecretCommand({ rawInput: input, uiMode: mode });

  if (result.handled) {
    clearTextInput();
    if (result.localAssistantText) {
      appendLocalAssistantMessage(result.localAssistantText);
    }
    return;
  }

  // ...normal send-to-backend logic...
}

This keeps secret commands completely client-side.

⸻

6. Testing Checklist

Unit
	•	handleSecretCommand:
	•	Returns handled: false for normal text.
	•	Matches PLAY IT AGAIN SAM correctly (case-insensitive).
	•	Matches PLAY ALERT, play rations, etc.
	•	Calls playSecretAudioById with the right ID.
	•	SECRET_AUDIO_MAP:
	•	All IDs used in tests are present.
	•	Web build resolves to usable URLs.

Manual (Local & GitHub Pages)
	1.	Type PLAY ALERT:
	•	Rick portrait mode:
	•	Alert sound plays.
	•	Rick quip appears.
	2.	Type PLAY IT AGAIN SAM:
	•	Secret SFX plays.
	•	Webview / external link opens with Casablanca/clip.
	•	Rick quip appears.
	3.	Type PLAY NOTREAL:
	•	No crash.
	•	“Unknown secret sound” (or equivalent) displays.

⸻

7. Future Secret Commands

Once the plumbing is in, we can add more:
	•	WAKE UP SAMURAI → Johnny Silverhand mode unlock / special SFX.
	•	I'LL BE BACK → Arnie mode teaser / sound.
	•	CHICKEN NUGGETS → King Curtis mode Easter egg.

Each one just becomes another branch in handleSecretCommand.

---

If you want, next step can be:

- Save that as `docs/SECRET-COMMANDS-SPEC.md`.
- When you’re ready, feed it to WARP with: *“Implement this spec in small, safe steps starting from the secretCommands.ts module.”*

For now, this lets your brain park the idea somewhere solid instead of spinning on it. The “secret found” SFX one is a lovely touch.