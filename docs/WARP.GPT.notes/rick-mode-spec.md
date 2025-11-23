Title: Rick Mode – Persona, Assets, and Integration Plan  
Owner: Warp  
Status: Draft / Planning  
Priority: Medium (nice UX + flavour on top of core chat flow)

---

## 1. Overview

**Goal:**  
Add a “Rick mode” to the app – a Rick Sanchez–flavoured persona + theme + SFX – that can be toggled on/off without breaking the existing chat pipeline.

Rick mode should:

- Use a specific **persona prompt** and **quote transcript** that shapes GPT behaviour.
- Switch the **UI theme** to a black & white / monochrome look while active.
- Use a dedicated set of **images** and **sound effects** (soundboard-style, same plumbing as the MGS sounds).
- Be implemented as a mode that sits on top of the existing `/chat` flow (no special backend endpoint).

---

## 2. Directory layout

Single root dir in the app repo for Rick assets:

`/assets/notes/rick/`

Implementation note (current state):
- For now, Rick image and audio source files live in the material folders:
  - Images: `/Users/jdw/workspace/jdwGH/ChatLaLiLuLeLo/material/images/Rick.images`
  - Audio: `/Users/jdw/workspace/jdwGH/ChatLaLiLuLeLo/material/audio/rick.audio`
- The app should treat these as the canonical pools to cycle through when in Rick mode.
- The `/assets/notes/rick/` path can be a logical/aliased root used by the app for bundling, but the material paths above are the ground truth locations of files during development.

Proposed structure:

```txt
/assets
  /notes
    /rick
      prompts/
        rick-persona.md
        rick-quotes-transcript.txt
        rick-behaviour-notes.md  # meta notes for us, not sent to GPT
      images/
        rick-avatar.png
        rick-avatar-bw.png
        rick-bg-01.jpg
        ...
        # Supported formats: .png, .jpg/.jpeg, .gif, .avif
      audio/
        burp-01.mp3
        portal-gun-01.mp3
        catchphrase-wubba-01.mp3
        ...
        # Supported formats: .mp3 (others can be added later if needed)
      config/
        theme.json        # colours, borders, glows for Rick mode
        soundboard.json   # mapping keys → audio files + labels

---

Notes:
	•	prompts/ → purely text that the backend /chat handler can load & inject into the system prompt for Rick mode.
	•	images/ → used for UI avatar, background, and any long-term Rick branding.
	•	audio/ → used by the same soundboard / event hooks as the MGS stuff.
	•	config/ → small JSON configs so the code can stay generic.

⸻

3. GPT persona & prompt logic

3.1 Files
	•	prompts/rick-persona.md
	•	High-level behaviour: sarcastic, cynical, but still actually helpful.
	•	Clear guard rails (no slurs, no TOS-breakers).
	•	Brief, so it doesn’t eat up too much context.
	•	prompts/rick-quotes-transcript.txt
	•	Curated quotes that help the model “pick up the vibe”.
	•	Either embedded as references in the persona prompt or used as source material for examples.
	•	prompts/rick-behaviour-notes.md
	•	Internal notes to ourselves (what works / what doesn’t).
	•	Not sent to GPT – just design notes.

3.2 Backend integration

In the Worker:
	•	There is already a mode field used for jd, haywire, etc.
	•	Add "rick" as another mode:
	•	Mode registry:

'''bash
    const MODES = {
  jd: { /* existing */ },
  rick: {
    personaFile: "/assets/notes/rick/prompts/rick-persona.md",
    quoteFile: "/assets/notes/rick/prompts/rick-quotes-transcript.txt",
    defaultModel: "gpt-4.1-mini",
    themeKey: "rick",
    soundboardKey: "rick",
  },
  // ...
};


	When mode === "rick":
	•	Load persona/quote files once (or cache them).
	•	Build the system prompt as:
	•	Base system (“you are a helpful assistant…”)
	•		•	Rick persona text
	•		•	any meta instructions (keep messages short/medium, keep it fun but still useful).
	•	Then proceed with the normal /chat flow (same streaming code, same OpenAI client).

Key point:
Rick mode should not require a new endpoint. It’s just one entry in a MODES map + some extra assets.

---

4. UI & theming

4.1 Theme switching

When mode is "rick":
	•	Apply a Rick theme object pulled from config/theme.json:

'''bash

{
  "name": "rick-bw",
  "primary": "#ffffff",
  "background": "#000000",
  "accent": "#cccccc",
  "border": "#ffffff",
  "glow": "#ffffff",
  "avatar": "/assets/notes/rick/images/rick-avatar-bw.png"
}

'''


	•	Theme changes:
	•	Background → black or very dark.
	•	Text → white or near-white.
	•	Buttons / borders → monochrome outlines.
	•	Optionally: subtle CRT/noise filter (later, not MVP).

4.2 Mode selector
	•	Add Rick mode to whatever UI element sets mode:
	•	Dropdown, toggle, or hidden “Easter egg” (e.g., via some key combo).
	•	Once selected:
	•	mode state in the frontend is set to "rick".
	•	Theme context reads mode and switches to Rick theme.

4.3 Rick portrait click behaviour

When mode is "rick", the top-left portrait box behaves as an interactive Rick soundboard:

- Label:
  - The text label in the top-left box should display **BOGART** instead of the Colonel label when Rick mode is active.

- Image cycle:
  - Each click on the portrait box should advance to the next Rick image from the Rick image pool (see directories in section 2).
  - Images can be `.png`, `.jpg/.jpeg`, `.gif`, or `.avif`.
  - Only images that successfully load/render should be kept in the cycle; any that fail to load can be skipped.

- Audio cycle:
  - Each click should also play the next Rick audio clip from the Rick audio pool.
  - The image index and audio index should advance together so each click is a paired image+sound moment.

- No stacking / re-entrancy guard:
  - If an audio clip is already playing, additional clicks on the portrait should be ignored until playback finishes.
  - After the clip ends, the next click starts a new image+audio pair.

- Wrap-around:
  - When the end of the image/audio lists is reached, cycle back to the beginning.

4.4 Theme lock-in & restore

- Rick mode forces the monochrome 1940s / black-and-white theme.
- While mode === "rick":
  - The normal theme chooser / theme button should be disabled or hidden.
  - The active theme should always be the Rick theme (see `theme.json`).

- When entering Rick mode:
  - Capture and store the current non-Rick theme key as `previousThemeKey` in the frontend state.

- When leaving Rick mode (switching to any other mode):
  - Restore the previously stored `previousThemeKey` as the active theme.
  - If `previousThemeKey` is missing for any reason, fall back to the default app theme.

- Rick mode itself should not be selectable as a theme from the regular theme UI; it is strictly tied to the Rick chat mode.

5. Soundboard & SFX

Reuse the MGS soundboard pattern:
	•	config/soundboard.json:

'''bash
{
  "rick": [
    { "id": "burp-01", "file": "/assets/notes/rick/audio/burp-01.mp3", "label": "Burp" },
    { "id": "portal-gun", "file": "/assets/notes/rick/audio/portal-gun-01.mp3", "label": "Portal gun" },
    { "id": "wubba", "file": "/assets/notes/rick/audio/catchphrase-wubba-01.mp3", "label": "Wubba lubba" }
  ]
}

'''

	•	Frontend:
	•	When mode === "rick", show Rick soundboard buttons using this config.
	•	Player logic (audio element / Web Audio) is re-used from existing MGS implementation with a different config key.

⸻

6. Code changes required

6.1 Backend (Worker /chat handler)
	1.	Mode registry
	•	Add "rick" entry to the mode config map (persona file paths, default model, theme key).
	2.	Prompt builder
	•	Extend prompt builder to:
	•	Load rick-persona.md and optionally rick-quotes-transcript.txt.
	•	Concatenate them into system content.
	•	Ensure this is done before calling OpenAI.
	3.	Assets loading
	•	Decide whether to:
	•	Bundle prompt files at build time (import as strings), or
	•	Do file reads relative to the Worker bundle (if environment allows).
	•	Cache to avoid reading on each request.
	4.	(Optional) Mode-specific logging
	•	Log mode in the structured logs to help debug Rick mode specifically.

6.2 Frontend
	1.	Mode selection
	•	Add Rick option to existing mode selector.
	•	Ensure /chat body includes "mode": "rick" when selected.
	2.	Theme
	•	Extend theme context / provider:
	•	Accept mode as input.
	•	If mode === "rick", apply Rick theme from config/theme.json.
	3.	Avatar and chrome
	•	Chat header: show Rick avatar when in Rick mode.
	•	Top-left portrait box label should display "BOGART" instead of the usual Colonel label when Rick mode is active.
	•	Optional: small label “RICK MODE” somewhere (can be subtle).
	4.	Soundboard
	•	Load Rick soundboard config.
	•	Render a row/panel of sound buttons when mode === "rick".

⸻

7. Testing & validation

7.1 Backend
	•	Rick mode “hello world”:
	•	curl with payload:

'''bash


{
  "mode": "rick",
  "model": "gpt-4.1-mini",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "input_text", "text": "Say hi, Rick." }
      ]
    }
  ]
}

'''

Expect: 200, with response that:
	•	Clearly has Rick flavour.
	•	Still respects safety / TOS.

7.2 Frontend
	•	Switch mode to Rick.
	•	Verify:
	•	Theme flips to monochrome.
	•	Rick avatar appears.
	•	Soundboard shows Rick SFX.
	•	Chat behaves like normal (no extra 400/500s).
    •   TIE Black & white theme to RICK mode

7.3 Regression
	•	Sanity check other modes (e.g., jd) still work exactly as before.
	•	Ensure /chat still accepts standard payloads; Rick is additive, not breaking.
