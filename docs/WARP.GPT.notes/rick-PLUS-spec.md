Love it. Rick is alive. Let’s level him up.

Below is a RICK-PLUS.md you can drop into docs/ (or just paste into WARP as instructions). It covers:
	•	Persona/prompt rewrite (no more cartoon drunk, all Bogart/Blaine / Play It Again, Sam).
	•	Using all Rick images (jpg/jpeg/png/gif/avif) and all Rick audio files.
	•	Making sure the portrait click audio is only active in Rick mode.
	•	A few test + QA notes.

⸻

RICK-PLUS.md — Persona + Assets Upgrade

0. Goals
	1.	Persona
	•	Replace “Rick & Morty drunk scientist” vibes with a suave, world-weary 1940s Bogart archetype.
	•	Tone = Casablanca Rick Blaine + Woody Allen’s imaginary Bogart in Play It Again, Sam.
	•	Short, sharp lines. Dry humour. Romantic cynicism with a hidden heart.
	2.	Assets
	•	Use all valid Rick images (jpg / jpeg / png / gif / avif) in the top-left portrait cycle.
	•	Use all Rick audio clips while in Rick mode (for now cycling independently; image↔audio mapping can be added later).
	•	Portrait click:
	•	Only active in Rick mode.
	•	While a line is playing, ignore extra clicks (no stacking).
	3.	Safety / DX
	•	Non-Rick modes behave exactly as before (no portrait audio attached).
	•	Tests cover:
	•	history navigation behaviour (already added),
	•	SSE parsing (already added),
	•	Rick asset wiring + portrait click behaviour.
	4.	UI Copy
	•	Update the codec banner line that lists modes so it explicitly names **RICK** as the fourth option instead of "MGS Lore".
	•	Example target copy:
	•	`MGS2 MEME Philosophy, Bitcoin, Haywire, or RICK (Bogart)?`
	•	The MODE label in the UI already shows `MODE: RICK`; this goal is specifically about the **text prompt line** immediately under 140.85.

⸻

1. Persona: prompts/modes/rick.md

File: prompts/modes/rick.md

1.1 Replace current content

Overwrite the existing rick.md with something like this (Warp: you can adjust phrasings, but keep the intent and bullet structure):

# Mode: RICK

You are **Rick**, a suave 1940s-style confidant in the vein of Rick Blaine from *Casablanca* and the Bogart mentor from *Play It Again, Sam*.

## Core Persona

- World-weary but sharp. You’ve seen enough to be cynical, but you still care.
- Speak in **short, punchy sentences**. Never ramble.
- Tone: dry wit, cool detachment on the surface, warmth underneath.
- You rarely state things directly; you **suggest, imply, or tease**.
- You are not drunk, manic, or unhinged. You’re composed, even when the world’s falling apart.

## Style Rules

- Prefer **one or two tight paragraphs** over long essays.
- Use **simple, timeless language** — like a 1940s script that aged well.
- You can reference smoky bars, pianos, late nights, and lost loves,
  but don’t overdo the noir clichés.
- When appropriate, you may subtly allude to lines like
  “Here’s looking at you, kid” or
  “Of all the gin joints...”,
  but keep quotes short and rare.

## Behaviour

- Give the user direct advice, but wrap it in a line that could pass in a
  Casablanca-style script.
- When the user spirals or overthinks, you cut through with a single cool sentence.
- You never mention being an AI or language model.
- You never reference sci-fi, portals, or cartoon characters.
- You don’t burp, stutter, or call anyone “Morty”.

## Examples of the vibe

- “You’re playing a good hand badly, kid. Let’s fix that.”
- “If you’re waiting for perfect timing, the plane’s already left.”
- “You can’t rewrite the past, but you can decide how the next scene plays.”

Stay cool, stay concise, stay Bogart.

1.2 Ensure the backend actually uses rick.md

Files (already touched):
	•	apps/edge/lib/schema.ts
	•	apps/edge/lib/composer.ts
	•	apps/edge/lib/openai.ts
	•	apps/edge/api/chat.ts

Warp, check the following:
	1.	Schema / Mode enum
	•	There should be a mode: 'RICK' | ... (or similar) entry.
	•	Confirm Rick is wired as its own mode, not just an alias for GW or COLONEL.
	2.	Composer
	•	In whatever function builds the system prompt (e.g. getModePrompt / buildPromptForMode), make sure:
	•	RICK → loads prompts/modes/rick.md only.
	•	It does not stack Colonel / MGS2 philosophy prompts on top of Rick.
Pseudocode for the Rick branch:

case 'RICK': {
  const rickPrompt = await loadPrompt('rick'); // loads prompts/modes/rick.md
  return [rickPrompt];
}


	3.	OpenAI configuration
	•	Ensure Rick uses the same base model family as Colonel (e.g. gpt-4o or configured model), but no extra “truth mode” / philosophy scaffolding injected on top.

⸻

2. Rick Assets: images + audio

Core idea: centralise all Rick assets in apps/mobile/src/lib/rickAssets.ts, and treat everything else as a consumer.

2.1 Metro config: support all the formats

File: apps/mobile/metro.config.js

Make sure the resolver includes .gif and .avif in assetExts. Something like:

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'gif',
  'avif',
];

module.exports = config;

If gif or avif are already present, don’t duplicate them.

2.2 rickAssets.ts

File: apps/mobile/src/lib/rickAssets.ts

Goal: expose all images + audios via a small API.

Suggested implementation:

// apps/mobile/src/lib/rickAssets.ts
import { ImageSourcePropType } from 'react-native';

type RickImage = ImageSourcePropType;
type RickAudio = number; // require() for mp3 returns a numeric module id in RN

function asImg(source: ImageSourcePropType): RickImage {
  return source;
}

// 1) IMAGES
// NOTE: These paths are from apps/mobile/src/lib/ → apps/mobile/assets/Rick.images
export const RICK_IMAGES: RickImage[] = [
  asImg(require('../../assets/Rick.images/7vai8uwrs1v11.jpg')),
  asImg(require('../../assets/Rick.images/Rick.Cigarette.jpg')),
  asImg(require('../../assets/Rick.images/RickBlaine.jpg')),
  // Warp: add every OTHER valid file in apps/mobile/assets/Rick.images:
  // - *.jpg / *.jpeg
  // - *.png
  // - *.gif
  // - *.avif (if Metro + browser are happy)
  //
  // Example:
  // asImg(require('../../assets/Rick.images/rick-silhouette.gif')),
  // asImg(require('../../assets/Rick.images/rick-smoking.avif')),
];

// 2) AUDIO
// NOTE: These paths are from apps/mobile/src/lib/ → apps/mobile/assets/Rick.audio
export const RICK_AUDIO: RickAudio[] = [
  // Warp: include ALL mp3 files from apps/mobile/assets/Rick.audio
  require('../../assets/Rick.audio/here-s-looking-at-you-kid.mp3'),
  require('../../assets/Rick.audio/of-all-the-gin-joints-in-all-the-towns-in-all-the-world-she-walks-into-mine.mp3'),
  require('../../assets/Rick.audio/louis-i-think-this-is-the-beginning-of-a-beautiful-friendship.mp3'),
  // ...etc for every mp3 listed under material/audio/rick.audio that we’ve copied in
];

// Simple cyclic index helpers
let imageIndex = 0;
let audioIndex = 0;

export function getNextRickImage(): RickImage | null {
  if (RICK_IMAGES.length === 0) return null;
  const next = RICK_IMAGES[imageIndex];
  imageIndex = (imageIndex + 1) % RICK_IMAGES.length;
  return next;
}

export function getNextRickAudio(): RickAudio | null {
  if (RICK_AUDIO.length === 0) return null;
  const next = RICK_AUDIO[audioIndex];
  audioIndex = (audioIndex + 1) % RICK_AUDIO.length;
  return next;
}

If .avif gives trouble in the browser even after Metro config, we can later convert those files to .jpg in material/ and re-copy them into apps/mobile/assets/Rick.images. For now, assume native support and keep them in the list.

2.3 Tests: rickAssets

File: apps/mobile/src/__tests__/rickAssets.test.ts

High-level expectations:
	•	RICK_IMAGES.length > 0
	•	RICK_AUDIO.length > 0
	•	getNextRickImage() cycles without throwing.
	•	getNextRickAudio() cycles without throwing.

Example:

import { RICK_IMAGES, RICK_AUDIO, getNextRickImage, getNextRickAudio } from '../lib/rickAssets';

describe('rickAssets', () => {
  it('has at least one image and one audio', () => {
    expect(RICK_IMAGES.length).toBeGreaterThan(0);
    expect(RICK_AUDIO.length).toBeGreaterThan(0);
  });

  it('cycles images', () => {
    const first = getNextRickImage();
    const second = getNextRickImage();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
  });

  it('cycles audio', () => {
    const first = getNextRickAudio();
    const second = getNextRickAudio();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
  });
});


⸻

3. Portrait behaviour in Rick mode

Files:
	•	apps/mobile/src/components/Portrait.tsx
	•	(Possibly) apps/mobile/src/features/chat/ChatScreen.tsx (for mode / session state)

3.1 Click handling (only in Rick mode)

In Portrait.tsx, where the portrait onPress handler lives, wire Rick logic roughly like:

import { getNextRickImage, getNextRickAudio } from '../lib/rickAssets';
import { useAudioMixer } from '../lib/audio'; // whatever hook / service you already use

type Props = {
  mode: 'GW' | 'RICK' | /* ... */;
  // ...
};

export function Portrait(props: Props) {
  const { mode /*, ...*/ } = props;
  const audioMixer = useAudioMixer();
  const [rickImage, setRickImage] = useState<ImageSourcePropType | null>(null);
  const [rickLinePlaying, setRickLinePlaying] = useState(false);

  const handlePress = async () => {
    if (mode !== 'RICK') {
      // Non-Rick behaviour (drag, nothing, etc.)
      return;
    }

    if (rickLinePlaying) {
      // Ignore extra clicks while a line is playing
      return;
    }

    const nextImage = getNextRickImage();
    const nextAudio = getNextRickAudio();

    if (nextImage) {
      setRickImage(nextImage);
    }

    if (nextAudio && audioMixer) {
      setRickLinePlaying(true);
      try {
        await audioMixer.play(nextAudio); // assume play returns a Promise
      } finally {
        setRickLinePlaying(false);
      }
    }
  };

  const source =
    mode === 'RICK' && rickImage
      ? rickImage
      : /* existing Colonel / default portrait logic */;

  return (
    <Pressable onPress={handlePress}>
      <Image source={source} /* ...styles */ />
    </Pressable>
  );
}

Key rules Warp should enforce:
	•	Guard on mode: if mode !== 'RICK', do not call getNextRickImage, getNextRickAudio, or audioMixer.
	•	Single playback at a time: rickLinePlaying flag prevents stacking.
	•	Fallback image: when not in Rick mode, or before any click, show the existing default (Colonel) logic.

3.2 Tests for portrait click behaviour

Add tests alongside TextInput.history.test.tsx:

File: apps/mobile/src/__tests__/Portrait.rick.test.tsx

Use React Testing Library (or your existing test setup) to assert:
	1.	Rick mode plays audio
	•	Render <Portrait mode="RICK" /> with a mocked audioMixer.play that resolves.
	•	Fire a press on the portrait.
	•	Assert audioMixer.play is called once.
	2.	Non-Rick mode does not play audio
	•	Render <Portrait mode="GW" />.
	•	Fire a press.
	•	Assert audioMixer.play is not called.
	3.	Clicks don’t stack
	•	In Rick mode, mock audioMixer.play as a Promise that doesn’t resolve immediately.
	•	Click twice quickly.
	•	Assert audioMixer.play called only once.

⸻

4. Quick QA Checklist

Once Warp applies all this and you merge into dev-plus:
	1.	Persona check
	•	Set mode to RICK.
	•	Prompt: “test Rick mode” / “give me advice on a breakup”.
	•	Verify:
	•	No “Morty”, no burps, no sci-fi references.
	•	Writes like a cool 1940s lead, in short lines.
	2.	Asset rotation
	•	Click the portrait multiple times in RICK mode:
	•	Images cycle through all stills + gifs + avifs.
	•	Audio lines change and draw from the full mp3 set.
	•	Confirm .gif and .avif display; if an extension fails, we can later convert those files to .jpg and update rickAssets.ts.
	3.	Mode isolation
	•	Switch back to Colonel / GW mode:
	•	Clicking portrait doesn’t play any Rick audio.
	•	Theme and behaviour revert to standard.
	4.	Tests
	•	npm test / npm run test (whatever your script is).
	•	Ensure:
	•	TextInput.history.test.tsx passes.
	•	api-sse-parsing.test.ts passes.
	•	rickAssets.test.ts (and any new Portrait tests) pass.

⸻

You can now feed this RICK-PLUS.md to Warp and let it wire everything up. After that, we can iterate on more fine-grained stuff like mapping specific quotes to specific images, or giving Rick special one-liner “scene transitions” when you change modes.


⸻

5. Cloudflare backend auto-deploy spec

Goal: stop relying on manual dashboard clicks for the Worker and have GitHub push -> Cloudflare deploy for the backend, in parallel with how GitHub Pages handles the web build.

### 5.1 Scope

- Worker: `chatlalilulelo-backend-prod`
- Environment: production (same as current manual deploy)
- Source branch: `dev-plus` (the dynamic branch that Pages already deploys from)
- Tooling: Cloudflare Wrangler + GitHub Actions

### 5.2 Workflow definition

**File:** `.github/workflows/backend-deploy.yml`

**Trigger:**
- `on.push.branches` includes `dev-plus`
- `on.workflow_dispatch` for manual re-deploys from the Actions tab

**Job outline:**
- `runs-on: ubuntu-latest`
- Steps:
  1. **Checkout**
     - Use `actions/checkout@v4`.
  2. **Setup Node**
     - Use `actions/setup-node@v4` with Node 20 (or the repo’s standard version).
  3. **Install dependencies**
     - `npm ci` at repo root.
  4. **Backend build (if needed)**
     - If apps/edge needs a build step, run the appropriate script, e.g.:
       - `npm run build:edge`
       - or `npm run build` if shared.
  5. **Cloudflare deploy**
     - Use `cloudflare/wrangler-action@v3` (or `npx wrangler deploy`) with:
       - `apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}`
       - `accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}`
       - `environment: production`
       - `workingDirectory: apps/edge` (if the Worker code lives there)
     - Target the existing Worker name `chatlalilulelo-backend-prod` as defined in `wrangler.toml`.

### 5.3 Required secrets and config

In the GitHub repo settings → *Secrets and variables* → *Actions*:
- `CLOUDFLARE_API_TOKEN`
  - Must have permissions to deploy Workers for the account that owns `chatlalilulelo-backend-prod`.
- `CLOUDFLARE_ACCOUNT_ID`
  - Matches the account visible in the Cloudflare dashboard URL.

In `wrangler.toml`:
- Ensure there is an entry for the production environment that matches the currently deployed Worker:
  - `name = "chatlalilulelo-backend-prod"`
  - `route` / `workers_dev` / `vars` left as-is from the working manual setup.

### 5.4 Behaviour & safety rules

- Only pushes to `dev-plus` should auto-deploy the production backend.
- For experimental backend changes, use feature branches and PRs into `dev-plus`; merging is the deploy gate.
- The workflow must **fail fast** if:
  - TypeScript build fails for apps/edge.
  - Wrangler reports a deployment error.
- No deploy should occur if tests fail (once backend tests are added); add a step to run:
  - `npm test` or a more targeted `npm run test:edge`.

### 5.5 Acceptance criteria

- [ ] A new workflow file exists at `.github/workflows/backend-deploy.yml`.
- [ ] Pushing a commit to `dev-plus` runs the backend deploy workflow in GitHub Actions.
- [ ] On success, Cloudflare’s `chatlalilulelo-backend-prod` Worker shows a new version in the Version History tied to the same commit hash.
- [ ] If the workflow fails, the existing production Worker remains unchanged, and the failure is visible in GitHub Actions logs.
- [ ] Manual `workflow_dispatch` runs from Actions can redeploy the current `dev-plus` state without using the Cloudflare dashboard UI.