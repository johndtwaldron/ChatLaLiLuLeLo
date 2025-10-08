# Dev-Voice.V1 — Colonel Voice Integration (v5 track)

## Scope
- TTS pipeline for "Colonel" (web first, RN later)
- Web Audio API playback + queueing
- Voice assets curation & mapping (clips, triggers)
- Latency budget: < 350ms added to message roundtrip
- No regression to Lightning, chat, or security

## Deliverables
- `apps/mobile/src/lib/voice/` (adapters + queue)
- `apps/mobile/src/components/VoiceToggle.tsx`
- `apps/mobile/src/lib/voice/colonel-voice.spec.ts`
- Feature flags: `EXPO_PUBLIC_VOICE_ENABLED`
- E2E: codec chat → speech playback happy path

## Definition of Done
- All CI green on branch
- Playwright test "chat-to-speech" passes
- Fallback when voice unavailable
- Docs: `docs/voice/README.md` usage & limits

## Risks / Notes
- Streaming vs chunk TTS tradeoffs
- Browser autoplay policy (user gesture)
- Licenses for model/voices
