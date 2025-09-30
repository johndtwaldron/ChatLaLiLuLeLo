# ChatLaLiLuLeLo — Spec v0.1 (JDW)

> An iOS‑first, OpenAI‑powered “Codec” companion inspired by the endgame JD/GW AI from *MGS2*. Part craic, part philosophy; respectful of IP.

---

## 0) North Star & Ethos
- **Goal:** Marry Bitcoin‑sovereign vibes and JDW’s brand with a playful, thought‑provoking assistant that looks/feels like the MGS2 codec screen—**without** infringing on Konami or voice actors.
- **Promise:** Cheap to build/run, fun to use, technically tight (modern CI, good QA), and extensible (Android later).
- **Tone:** Haunting, witty, meta. Philosophically mischievous, never cruel. Opt‑in edginess (“Haywire Mode”) that stays within App Store guidelines.

---

## 1) Product Scope
### 1.1 MVP (6–8 weeks)
**What ships:**
- iOS app (TestFlight) with a **Codec‑style UI**: two portraits + scrolling subtitle field + green scanlines.
- **Animated head**: sprite‑based mouth flaps + subtle idle motion; later upgrade to viseme‑driven lip‑sync.
- **Text chat** using OpenAI API (GPT‑4o-mini or current cost‑efficient model) with a custom system prompt (“JD/GW Codex Style Guide”) seeded by the canonical end‑sequence transcript (paraphrased, not copied verbatim) and JDW’s style.
- **Voices:** 4 presets ("Colonel‑esque", "Rose‑esque", "Colonel AI‑glitch", "Skull"). Use **non‑infringing** TTS voices tweaked via SSML; **no celebrity/actor cloning**.
- **Modes:**
  - "Craic" (banter),
  - "Philosophy" (short theses),
  - "Haywire" (glitchy meta, constrained),
  - "Bitcoin" (sovereign finance POV with disclaimers).
- **Safety:** opt‑in mature toggle; content filters; clear disclaimers.
- **Cheap ops:** In‑app local cache, token budget controls, rate limiting.

**Acceptance criteria:**
- Smooth 60fps UI on iPhone 12 and up.
- Latency: first token < 1.5s on solid connection.
- Unit + E2E CI green. TestFlight build installable.

### 1.2 Nice‑to‑Have v0.x
- **TTS lip‑sync** using visemes (when the TTS API exposes phoneme/viseme timings) → 2D morph targets.
- **Android** via Expo EAS.
- **In‑app ads “meta gag”** (toggle): playful codec‑style sponsor gags that never hijack UX.
- **Prompt personalities** library + in‑app editor.
- **Local speech‑to‑text** fallback for privacy.

---

## 2) Legal / IP Guardrails
- **No trademarks, names, or verbatim script.** We ship a *homage*, not a copy. Visuals are *codec‑inspired*: monochrome palette, scanlines, minimalist HUD **without** Konami assets.
- **Voices:** use generic military/partner TTS. Avoid sound‑alike cloning of any real actor.
- **Marketing copy:** “codec‑style”, “tactical console”, “AI colonel vibe”—never “Metal Gear Solid” or character names.
- **Content:** Paraphrase the philosophical beats; attribute original ideas to public‑domain philosophy when relevant.

---

## 3) UX / UI
- **Layout:**
  - Left portrait = “Colonel‑esque”. Right portrait = user avatar or blank silhouette.
  - Center HUD = waveform (when TTS), response tokens scroll like subtitles.
  - Bottom strip = input bar, Mode selector, Send.
- **Aesthetic:** green phosphor, scanlines, slight CRT bloom, subtle jitter (Haywire mode increases).
- **Accessibility:** dynamic text sizes, captions on by default.

---

## 4) Tech Stack
- **Client:** **Expo + React Native (TypeScript)** → iOS‑first via **EAS Build**; unlock Android later with minimal code change.
- **State:** Zustand or Redux Toolkit (lean). React Query for network.
- **Animation:** React Native Reanimated + Lottie for scanlines; sprite sheet for mouth flaps.
- **Audio:** Expo‑AV for TTS playback. Start with OpenAI TTS (or platform TTS) → later viseme‑driven.
- **Backend:** **Serverless proxy** (Cloudflare Workers or Vercel Edge) to hold API keys, do rate limiting, log redaction. Optional Supabase for anonymized usage analytics.
- **LLM:** OpenAI Chat Completions/Responses API with function‑free MVP; later small tools (e.g., clock, randomizer).
- **Payments:** none in MVP. Future: £0.99 one‑off or tip jar (StoreKit). Ads only as opted‑in gag.

---

## 5) Prompting & Personality
- **System Prompt: "JD/GW Codex Style Guide"** (stored client‑side, versioned):
  - Tone directives (dry wit, meta asides, never abusive, short lines like subtitle cadence).
  - Philosophy mode: stoicism, simulation, media critique.
  - Bitcoin mode: sovereignty, custody, security hygiene; avoid financial advice.
  - Haywire mode: glitch grammar, non‑sequitur *only* within safety rails.
- **Content Library:** curated paraphrases of the end‑sequence themes + JDW quips. No verbatim copying.

---

## 6) Architecture
```
apps/mobile (Expo RN)
  src/
    components/CodecFrame.tsx
    components/Portrait.tsx
    components/SubtitleStream.tsx
    features/chat/
      ChatScreen.tsx
      useChat.ts
    features/voice/
      useTTS.ts
    lib/
      api.ts (fetch to edge)
      store.ts
      theme.ts
    assets/
      sprites/colonel-mouth.png
      lotties/scanlines.json

edge/api (Cloudflare Worker)
  index.ts (routes: /chat, /tts)
  auth.ts (HMAC app key, rate limit)

packages/shared
  prompts/
    jdgw-style-v1.md
  types/
    chat.ts
```

- **Data:**
  - No PII by default. On‑device conversation history (secure storage). Opt‑in telemetry (counts, latency only).
- **Security:**
  - Client signs each request with an app‑issued public key → Worker validates and injects OpenAI secret.
  - Abuse throttling per device.

---

## 7) DevEx (Gitpod + CI)
### Gitpod
`.gitpod.yml`
```yml
image: mcr.microsoft.com/devcontainers/javascript-node:20
ports:
  - port: 19000 # Expo
  - port: 19001
  - port: 19002
tasks:
  - init: npm i -g expo-cli eas-cli && npm ci
    command: npm run dev
vscode:
  extensions:
    - esbenp.prettier-vscode
    - dbaeumer.vscode-eslint
```

### Scripts
```json
{
  "scripts": {
    "dev": "expo start",
    "typecheck": "tsc -p . --noEmit",
    "lint": "eslint .",
    "test": "jest",
    "e2e": "detox test -c ios.sim.debug"
  }
}
```

### CI (GitHub Actions)
- **PR:** typecheck, ESLint, unit tests, build iOS simulator app, Detox smoke.
- **Main:** EAS build to Internal, Tag → TestFlight via EAS submit.

`.github/workflows/ci.yml`
```yml
name: mobile-ci
on: [pull_request]
jobs:
  build-test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run typecheck && npm run lint && npm test
      - name: iOS build (sim)
        run: npx expo prebuild && xcodebuild -project ios/*.xcodeproj -scheme "*" -destination 'platform=iOS Simulator,name=iPhone 15'
      - name: Detox smoke
        run: npm run e2e
```

---

## 8) QA Plan
- **Unit:** prompt selector, mode toggles, token budget calc, rate limit backoff.
- **Integration:** chat ↔ TTS ↔ mouth‑flap animation timing.
- **E2E (Detox):**
  - Launch → send message → see streaming subtitles within 1.5s.
  - Toggle modes → verify system prompt switch.
  - Offline → cached reply or graceful error with retry.
- **Non‑func:** memory < 200MB, no ANR, battery drain under 3% per 5‑min session.
- **Release checklist:** privacy labels, age rating, content filter on by default, crash‑free sessions > 99% in TestFlight.

---

## 9) Costing (rough)
- **OpenAI:** £0.002–£0.02 / prompt depending on model/length. Cap via token budget.
- **Infra:** Cloudflare Worker free/low tier, Supabase free tier, EAS builds ~£20–£40/month when active.
- **One‑off:** App Store dev (£79/yr). Assets via open‑source or custom.

---

## 10) Roadmap
- **Week 1–2:** Repo scaffold, codec UI, static responses, basic mouth flaps.
- **Week 3–4:** Edge proxy, OpenAI streaming, presets/modes, TTS playback.
- **Week 5:** QA hardening, Detox E2E, TestFlight alpha.
- **Week 6–8:** Polish, privacy review, closed beta + iterate.
- **Post‑MVP:** Android, viseme lip‑sync, personality editor, opt‑in ads gag.

---

## 11) Risks & Mitigations
- **IP risk** → Homage only; rename assets generically; avoid names/quotes.
- **App Store rejection** → Strict content filters, privacy labels, no deceptive behavior.
- **Latency/jitter** → Streaming, partial rendering, retry logic.
- **Cost blowout** → Token caps, short responses, client‑side summarization.

---

## 12) Naming
Working codename: **ChatLaLiLuLeLo**.
Public‑safe candidates (non‑infringing):
- **CodecLine**
- **GreenRoom**
- **Colonel’s Console** (internal only, avoid store listing)
- **Tactical Codec**
- **Line‑140.85** (number‑based nod without direct reference)

---

## 13) Next Actions (Warp‑ready)
- [ ] Create GitHub org + repo with Expo scaffold and folders above.
- [ ] Commit `.gitpod.yml`, CI stub, README with legal guardrails.
- [ ] Draft v1 system prompt (“JD/GW Codex Style Guide”).
- [ ] Produce first sprite sheet (8 mouth frames + idle sway).
- [ ] Implement `/chat` Worker proxy with HMAC auth + rate limiting.
- [ ] Wire streaming chat → subtitle renderer → basic mouth flaps.
- [ ] Add 4 TTS presets (non‑infringing voices).
- [ ] Ship TestFlight build to JDW + Warp for QA.

---

## 14) Appendix A — JD/GW Codex Style Guide (outline)
- **Sentence cadence:** 6–16 words. Occasional fragment. Subtitle‑friendly.
- **Demeanor:** Paradoxical authority + glitchy self‑awareness.
- **Themes:** control vs freedom, signal vs noise, self‑sovereignty, media diet.
- **Haywire rules:** max 10% of lines with glitch text; never harm, never slur.
- **Bitcoin mode:** custody, threat models, privacy tips; no price talk; no advice.

## 15) Appendix B — Sample Prompts
- *Craic:* “You’re a sardonic yet kind ‘codec‑style’ mentor. Keep lines short. Make me smirk. Avoid real‑world IP.”
- *Philosophy:* “Summon pithy theses (1–3 lines), cite classical ideas without quoting modern scripts.”
- *Haywire:* “Occasionally insert bracketed [static] and meta asides; never exceed safety rules.”
- *Bitcoin:* “Default to self‑custody, plain‑English threat models, opt‑in links to learn more.”

