# NEW_MODE_CHECKS.md

Standard checklist for adding or upgrading a **conversation mode** in ChatLaLiLuLeLo.

The aim is:
- Consistent behaviour across modes.
- Clear asset + prompt layout.
- Clean UI wiring.
- Predictable CI/CD to GitHub Pages + Cloudflare Workers.

---

## 0. Branch & Scope

1. Create a feature branch from `dev-plus`:

   - Naming: `dev-<mode-name>` (e.g. `dev-rick`, `dev-napoleon`).
   - Keep the branch focused on a single mode or a well-defined upgrade.

2. When done, PR → `dev-plus`. `dev-plus` remains the **deploy branch** for:
   - GitHub Pages web app.
   - Cloudflare backend Worker (`chatlalilulelo-backend-prod`).

---

## 1. Backend Persona & Prompt

### 1.1 Prompt file

- Add a prompt file under `prompts/modes/`:

  - Example: `prompts/modes/rick.md`, `prompts/modes/napoleon.md`.

- In that file, define:
  - **Core persona**: who they are.
  - **Style rules**: sentence length, tone, references that are allowed vs banned.
  - **Behaviour**: how they answer, what they avoid (no system leaks, no other IP, etc.).
  - A few **example lines** that set the vibe.

### 1.2 Backend wiring

Update the backend so the new mode is first-class:

- Files to check/update:
  - `apps/edge/lib/schema.ts` – add the mode to the `Mode` enum / schema.
  - `apps/edge/lib/composer.ts` – add a `case '<MODE>'` that:
    - Loads exactly `prompts/modes/<mode>.md`.
    - Does **not** stack other mode prompts on top unless explicitly intended.
  - `apps/edge/lib/openai.ts` / `apps/edge/api/chat.ts` – ensure the mode is passed through correctly to OpenAI.

Backend acceptance criteria:

- Calling `/chat` with `mode: '<MODE>'` uses the new prompt only.
- No stray references to other modes (e.g. no Rick Sanchez in Rick Blaine mode, etc.).

---

## 2. Frontend Mode Wiring

Make sure the new mode is fully understood by the frontend.

- Update any shared mode types / enums:
  - e.g. `Mode` type in `apps/mobile/src/lib/api.ts` or similar.

- Ensure the mode is included in:
  - **Mode cycling logic** (the button / control that cycles GW → JD → BTC → …).
  - **Initial “choose mode” banner text** in `ChatScreen.tsx`:
    - e.g. `Choose mode: Philosophy (JD), Bitcoin (BTC), Haywire (GW), MGS Lore, or Rick (Bogart)?`

- Add / update **mode → label** mappings used in the UI:
  - Prefix in the transcript: `[GW:gpt-4o-mini]`, `[RICK:gpt-4o]`, etc.
  - Any mode-specific colours / tags.

---

## 3. Assets & Theming

### 3.1 Asset layout

Standard layout under `apps/mobile/assets`:

- Images: `apps/mobile/assets/<ModeName>.images/*`
- Audio SFX / quotes: `apps/mobile/assets/<mode>.audio/*`
- Source vault copies live under `material/`:
  - `material/images/<ModeName>.images/*`
  - `material/audio/<mode>.audio/*`
  - `material/transcripts/<ModeName>TextMaterial/*` (if applicable)

Keep `material/**` as your vault; the app only consumes `apps/mobile/assets/**`.

### 3.2 Asset loader module

Each mode gets a single **asset helper module**, e.g.:

- `apps/mobile/src/lib/rickAssets.ts`
- `apps/mobile/src/lib/napoleonAssets.ts`

Responsibilities:

- Import **all** valid image formats you support (jpg / jpeg / png / gif / avif).
- Import all relevant audio clips.
- Expose a tiny API:

  - `getNext<Mode>Image()`
  - `getNext<Mode>Audio()`
  - `getCurrent<Mode>Image()`
  - `reset<Mode>Assets()`
  - `get<Mode>AssetCounts()`

This keeps portrait logic simple and testable.

### 3.3 Metro & Jest config

- Ensure `apps/mobile/metro.config.js` supports all required asset extensions:
  - Add `gif`, `avif`, etc., if not already present.
- Update `apps/mobile/jest.config.js` / Jest setup to handle new extensions (mocking image/audio imports).

### 3.4 Theming

If the mode has a custom theme:

- Define or extend theme in `apps/mobile/src/lib/theme.ts` (or equivalent).
- Make sure:
  - Theme activates when the mode is active.
  - Theme reverts cleanly when switching back to other modes.

---

## 4. UI Affordances

Every mode should be clearly visible in the UI.

### 4.1 Mode label

- The top HUD must show the current mode, e.g. `MODE: RICK`.
- The initial banner text under `140.85` must clearly list the mode by name.

### 4.2 Top-right user box

- The user box label should change per mode.

  Example mapping:

  - GW / default: `SOLDIER`
  - Philosophy: `AGENT`
  - Bitcoin: `STACKER`
  - MGS Lore: `SOLDIER`
  - Rick: `PATRON` or `GUEST` (patron at Rick’s joint)

- Implementation: a `USER_LABEL_BY_MODE` map consumed by the HUD component.

### 4.3 Transcript prefix

- The prefix inside the transcript should reflect the mode:

  - `[GW:gpt-4o-mini]`
  - `[BTC:gpt-4o-mini]`
  - `[RICK:gpt-4o]`

- Implement via a `MODE_PREFIX` map rather than hard-coding `"MGS"`.

---

## 5. Portrait, Audio & Voice

### 5.1 Portrait click behaviour

- Portrait component (`Portrait.tsx` or equivalent) must:

  - Only run mode-specific logic when `mode === '<MODE>'`.
  - Use the asset helper to cycle images and audio.
  - Guard against **audio stacking**:
    - e.g. `is<Mode>AudioPlaying` flag or a small state machine.

- Non-matching modes:
  - Use existing default behaviour.
  - Must **not** trigger mode-specific audio or image logic.

### 5.2 Mode SFX / quotes

- Decide if:
  - Mode reuses global SFX (`playRandomUserSound()`), or
  - Mode has its own quotes (like Rick).

- Implement the latter via the `<Mode>Assets` module and the portrait click handler.

### 5.3 Optional voice (ElevenLabs / TTS)

If the mode gets a dedicated TTS voice:

- Add required env vars / secrets (e.g. `ELEVENLABS_API_KEY`, voice ID).
- Create a small helper that:
  - Calls the TTS provider for text → audio when online.
  - Falls back gracefully (no hard failure) when TTS is unavailable.
- Integrate into the mode **optionally**:
  - Don’t block standard text responses on TTS failures.

---

## 6. Tests & QA

### 6.1 Unit tests

At minimum:

- **Assets tests** (like `rickAssets.test.ts`):

  - Asset counts > 0.
  - Cycle behaviour doesn’t throw.
  - Reset works.

- **Portrait behaviour tests** (e.g. `Portrait.<mode>.test.tsx`):

  - In `<MODE>`, clicking portrait:
    - Calls the mode audio player once.
    - Changes the portrait image.
  - In other modes:
    - Same click does **not** call mode audio.
  - Rapid clicks don’t stack playback.

- Any existing core tests (history navigation, SSE parsing, etc.) must still pass.

### 6.2 Manual QA checklist

For a new mode:

1. **Persona check**
   - Set mode = `<MODE>`.
   - Ask a typical question.
   - Confirm:
     - Tone matches prompt.
     - Forbidden references are absent (e.g. no Rick & Morty in Rick Blaine).

2. **Assets**
   - Click portrait repeatedly to ensure:
     - Images cycle as expected.
     - Audio plays and rotates.
     - No crashes or console errors.

3. **Mode isolation**
   - Switch away from `<MODE>`:
     - Portrait click no longer plays `<MODE>` audio.
     - UI theme and labels revert.

4. **HUD**
   - MODE label correct.
   - User box label correct for the mode.
   - Transcript prefix reflects the mode.

---

## 7. CI/CD & Cloudflare

### 7.1 GitHub Actions

- Ensure the following workflows are green for the PR:

  - Main CI: typecheck, tests, lint.
  - Web deploy to GitHub Pages (from `dev-plus`).
  - Backend deploy to Cloudflare Worker:
    - `.github/workflows/backend-deploy.yml`:
      - Triggered on `dev-plus` pushes touching `apps/edge/**` or `prompts/**`.
      - Runs TypeScript check in `apps/edge` (tests excluded via tsconfig).
      - Runs `npm run deploy` in `apps/edge` (wrangler deploy).
      - Deploys to `chatlalilulelo-backend-prod`.

#### Backend Auto-Deploy Troubleshooting

If the backend-deploy workflow fails:

- **"Validate backend code" step fails**:
  - Check TypeScript errors in `apps/edge`.
  - Common issues:
    - Missing type definitions (add to `apps/edge/lib/logger.ts` or relevant interfaces).
    - Test files being type-checked (ensure `**/__tests__/**` is in tsconfig exclude).

- **"Deploy to Cloudflare Workers" step fails**:
  - Check for missing/incorrect npm scripts in `apps/edge/package.json`.
  - Verify GitHub secrets are set: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
  - Check wrangler config in `apps/edge/wrangler.toml`.

- **Manual deployment fallback**:
  - From `apps/edge/`: run `npm run deploy`.
  - Pause/disable the GitHub workflow temporarily if needed.

### 7.2 Secrets

**Required for backend deploys**:

- `CLOUDFLARE_API_TOKEN`
  - From Cloudflare dashboard → My Profile → API Tokens
  - Create token with "Edit Cloudflare Workers" template
  - Or custom token with Account → "Edit Workers" permission

- `CLOUDFLARE_ACCOUNT_ID`
  - Found in Cloudflare dashboard URL or Overview page
  - Long hex string identifying your account

**Optional mode-specific secrets**:
- TTS voice keys (e.g. `ELEVENLABS_API_KEY` for voice modes)
- Additional API keys as needed per mode

**How to add secrets**:
1. Go to repo Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add name and value
4. Secrets are available in workflows as `${{ secrets.SECRET_NAME }}`

---

## 8. PR Template / Acceptance Criteria

When opening a PR for a new mode or major mode upgrade, include:

- **Summary**: “Add `<MODE>` mode with persona X and assets Y.”
- **Files of interest**:
  - `prompts/modes/<mode>.md`
  - `apps/edge/**` (mode wiring)
  - `apps/mobile/src/lib/<mode>Assets.ts`
  - `apps/mobile/src/components/Portrait.tsx`
  - `apps/mobile/src/features/chat/ChatScreen.tsx`
  - Tests added/updated.
- **Checklist** (tick off):

  - [ ] Prompt file created / updated.
  - [ ] Backend uses only this prompt for `<MODE>`.
  - [ ] Assets imported and helper module implemented.
  - [ ] Portrait logic guarded by mode.
  - [ ] HUD labels & transcript prefix updated.
  - [ ] New tests added & passing.
  - [ ] CI + backend deploy workflows passing.
  - [ ] Manual QA performed (see section 6.2).

---

## 9. Post-Merge

Once the PR is merged into `dev-plus`:

1. Confirm GitHub Actions:
   - CI ✅
   - Pages deploy ✅
   - Backend deploy ✅

2. Verify in production (GitHub Pages + Cloudflare Worker):
   - New mode appears in mode cycle.
   - Persona, assets, and HUD behave as seen locally.

3. When stable and battle-tested, open a PR from `dev-plus` → `main` to snapshot the release.

---

## 10. Mode Spec Docs

Each mode SHOULD have a spec file in the repo root:

- `MODE-RICK-SPEC.md`
- `MODE-<NAME>-SPEC.md`

Every spec MUST link back to this file:

> See [`NEW_MODE_CHECKS.md`](./NEW_MODE_CHECKS.md) for the canonical implementation checklist.