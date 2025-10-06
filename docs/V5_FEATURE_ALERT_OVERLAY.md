📄 File: docs/V5_FEATURE_ALERT_OVERLAY.md

Feature: MGS-Style Alert Overlay & Sound Effect
Version Target: V5
Author: JDW
Status: Planned
Category: UI/UX + Feedback System

🎯 Overview

Introduce a Metal Gear Solid–style alert overlay (⚠️ ! or ?) with synchronized audio feedback whenever specific system events occur — such as AI quota exhaustion, connection issues, or mode transitions.

This feature enhances immersion, connecting gameplay nostalgia with live AI system feedback.

💡 Concept

Inspired by the “!” and “?” reaction icons from classic Metal Gear Solid, this feature creates a moment of dynamic user feedback whenever something notable happens in the simulation — e.g. when the backend loses OpenAI quota, encounters an error, or when the user triggers a rare state.

It ties into the “codec simulation” illusion by giving the Colonel interface emotional responsiveness.

🧠 Behavioural Summary
Event	Symbol	Audio	Description
Insufficient Credits / Quota Error	!	alert-exclaim.mp3	Critical alert — system unable to process AI calls
Health Check Fails (no quota or API down)	!	alert-exclaim.mp3	Warning on boot or debug toggle
Slow Response (>5s)	?	alert-question.mp3	Indicates system delay or lag
User Curiosity (“?” moments)	?	alert-question.mp3	Optional: can be triggered manually in dev mode for testing
🧩 Technical Design
1. Backend

Add quota status reporting to apps/edge/api/health.ts and propagate errors in /chat endpoint.

// health.ts
return json({
  status: 'ok',
  quota_ok: isQuotaAvailable,
  timestamp: Date.now()
});

// chat.ts
if (error.message.includes("insufficient_quota")) {
  return new Response(JSON.stringify({ code: "NO_CREDITS" }), {
    status: 402,
    headers: { "content-type": "application/json" },
  });
}

2. Frontend Assets
File	Description
apps/mobile/assets/audio/alert-exclaim.mp3	Short “!” alert (critical)
apps/mobile/assets/audio/alert-question.mp3	Short “?” alert (soft info)
3. Animation System

Add CRT-style exclamation burst via Tailwind or CSS keyframes:

// tailwind.config.ts
extend: {
  keyframes: {
    exclaim: {
      '0%': { transform: 'translate(-50%,-70%) scale(0.6)', opacity: 0 },
      '20%': { transform: 'translate(-50%,-80%) scale(1.1)', opacity: 1 },
      '100%': { transform: 'translate(-50%,-90%) scale(1.0)', opacity: 0 },
    },
  },
  animation: {
    exclaim: 'exclaim 1200ms cubic-bezier(.17,.67,.32,1) forwards',
  },
  boxShadow: {
    'crt-glow': '0 0 8px rgba(0,255,255,.55), 0 0 18px rgba(0,255,255,.25)',
  },
}

4. Overlay Component

apps/mobile/src/components/ui/AlertOverlay.tsx

import React, { useEffect, useState } from 'react';
import { playAlertExclaim, playAlertQuestion } from '@/lib/audio';

export function useAlertOverlay() {
  const [burst, setBurst] = useState<null | 'exclaim' | 'question'>(null);
  const trigger = (v = 'exclaim') => setBurst(v);
  const view = <AlertOverlay variant={burst} onDone={() => setBurst(null)} />;
  return { trigger, view };
}

export function AlertOverlay({ variant, onDone }) {
  useEffect(() => {
    if (!variant) return;
    const stop = setTimeout(onDone, 1200);
    (variant === 'exclaim' ? playAlertExclaim : playAlertQuestion)();
    return () => clearTimeout(stop);
  }, [variant]);

  if (!variant) return null;

  return (
    <div className="fixed left-[110px] top-[70px] z-40 pointer-events-none">
      <span className="text-5xl font-bold text-cyan-300 animate-exclaim shadow-crt-glow">
        {variant === 'exclaim' ? '!' : '?'}
      </span>
    </div>
  );
}

5. Audio Library Extension

apps/mobile/src/lib/audio.ts

export function initAlertAudio() {
  exclaim = new Audio(require('../../assets/audio/alert-exclaim.mp3'));
  question = new Audio(require('../../assets/audio/alert-question.mp3'));
  exclaim.volume = 0.6;
  question.volume = 0.45;
}

export function playAlertExclaim() { exclaim?.play().catch(() => {}); }
export function playAlertQuestion() { question?.play().catch(() => {}); }

6. Integration Points

On quota check fail → triggerAlert('exclaim')

On network warning or slow response → triggerAlert('question')

On manual dev trigger (e.g., user panel click) → triggerAlert('exclaim')

Render inside ChatScreen root:

{alertView}
<CodecFrame> ... </CodecFrame>

🎨 Theme Logic

Default color: text-cyan-300

Optional dynamic mapping:

Orange → text-orange-400

Purple → text-fuchsia-400

Green → text-emerald-400

Gold → text-yellow-400

(Handled by theme context if required.)

⚙️ Future Enhancements

🔊 Dynamic Sound Bank (different alert pitches per mode)

⚠️ “Low Token Balance” periodic soft alert

🎮 User-Interactive Easter Egg: If user types !alert in chat, Colonel “detects” suspicious activity.

✅ Acceptance Criteria
Requirement	Status
“!” overlay appears for quota/credit errors	☐
“?” overlay appears for soft warnings	☐
Audio plays correctly across themes	☐
No layout shift or scroll interference	☐
Works in web and packaged desktop builds	☐
Debounce prevents alert spam	☐
💾 Commit Example
git add -A
git commit -m "feat(ui): add MGS-style alert overlay + sfx for quota/warning events"

📅 Version Placement

Introduced in V5 – Immersive UI Enhancements

Part of Codec Simulation Deepening Series (Phase 2)

Estimated Dev Time: 1–2 days

Priority: Medium (UX + Immersion)