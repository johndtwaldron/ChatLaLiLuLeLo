# Rick Persona Fix - Bogart/Casablanca Correction

## Problem

Rick mode was responding with **Rick Sanchez** (Rick & Morty) persona instead of **Rick Blaine** (Casablanca/Bogart) persona:

❌ **Wrong behavior**:
- Burps: "*burp* That's just..."
- References to "Morty"
- "Wubba lubba dub dub"
- Portal guns, Citadel of Ricks
- Cosmic multiverse nihilism rants

✅ **Correct behavior**:
- Bogart-style mentor
- 1940s noir bar atmosphere
- Dry, clipped, world-weary wisdom
- "Kid...", "this joint...", understated affection
- Self-respect and sovereignty advice

## Root Cause

**Backend prompt mapping was wrong**:
- File: `apps/edge/lib/composer.ts`
- Lines 176-212 had Rick Sanchez prompt embedded
- Despite correct Bogart prompt existing in `prompts/modes/rick.md`

## Solution

### 1. Replaced Backend Prompt

**File**: `apps/edge/lib/composer.ts`

**Before** (lines 176-212):
```typescript
'RICK': `# RICK Mode - Rick Sanchez Persona
You are Rick Sanchez from Rick and Morty...
*burp* That's just basic quantum mechanics...
"Wubba lubba dub dub"...
```

**After**:
```typescript
'RICK': `# RICK Mode - Rick Blaine / Bogart Persona (Casablanca)
You are a Bogart-style mentor inspired by Rick Blaine from Casablanca...
No burps. No cartoon drunk. Just a man who's seen a lot...

## Hard Guardrails
This is NOT Rick Sanchez. Never behave like him:
- No "Morty", no portal guns, no Citadel of Ricks
- No "Wubba lubba dub dub" or Rick & Morty catchphrases  
- No burps in text or sloppy drunk writing
```

Key additions from `rick.md`:
- ✅ Explicit "NOT Rick Sanchez" guardrails
- ✅ Bogart-style mentor framing
- ✅ 1940s noir tone and idioms
- ✅ Self-respect/sovereignty focus
- ✅ Dry, clipped communication style

### 2. Source of Truth

The full detailed prompt lives in:
```
prompts/modes/rick.md
```

This contains:
- Complete Bogart/Casablanca character profile
- "Hard Not That Rick Guardrails" section
- Example phrases and interaction patterns
- Safety boundaries
- WARP integration notes

## Verification

### Test Query
**Send**: "What's your take on heartbreak?"

### Expected Response (Bogart style)
```
Took a hit, huh? Happens in this town.
You don't chase someone who's already halfway out the door.
Give it space, clean up your side of the street, and keep walking.
You've still got a life to build, kid.
```

### Wrong Response (Rick Sanchez style)
```
Oh *burp* heartbreak? That's just biochemistry, Morty.
In the infinite multiverse, there's a version of you that never met them...
Wubba lubba dub dub!
```

## Backend Deployment

Since this is a Cloudflare Worker backend:

```bash
# Local testing
cd apps/edge
npm run dev

# Deploy to development
npm run deploy

# Deploy to production
npm run deploy:production
```

**Important**: Backend must be redeployed for the prompt change to take effect.

## Files Changed

### Backend
- ✅ `apps/edge/lib/composer.ts` - Fixed RICK prompt (lines 176-229)

### Reference Files (Already Correct)
- ✅ `prompts/modes/rick.md` - Correct Bogart prompt
- ✅ `apps/mobile/src/lib/theme.ts` - Rick mode defined
- ✅ `apps/mobile/src/lib/api.ts` - RICK mode type
- ✅ `apps/edge/lib/openai.ts` - RICK fallback responses

## Testing Checklist

After backend deployment:

- [ ] Switch to Rick mode in UI
- [ ] Send test query: "What's your take on heartbreak?"
- [ ] Verify NO burps in response
- [ ] Verify NO "Morty" references
- [ ] Verify NO "Wubba lubba dub dub"
- [ ] Verify Bogart-style tone (dry, clipped, noir)
- [ ] Check for "kid", "this joint", bar references
- [ ] Confirm self-respect/sovereignty advice style

## Additional Context

### Why Two Rick Characters?

**Rick Sanchez** (Rick & Morty):
- Animated sci-fi comedy
- Genius scientist with portal gun
- Cynical nihilist with burps
- Multiverse adventures
- "Wubba lubba dub dub"

**Rick Blaine** (Casablanca):
- 1940s film noir drama
- Bar owner in Morocco
- World-weary romantic
- Understated heroism
- "Here's looking at you, kid"

The mode is named "RICK" but refers to **Rick Blaine**, not Rick Sanchez.

### Related Modes

- **JD Mode**: Colonel AI authority
- **GW Mode**: Haywire/glitched Colonel
- **MGS Mode**: Meta-analysis of MGS2 themes
- **BTC Mode**: Bitcoin orange-pill philosophy
- **RICK Mode**: Bogart/Casablanca mentor (THIS ONE)

## Historical Note

The Rick Sanchez prompt was likely:
1. An early placeholder during development
2. Never updated when the Casablanca/Bogart direction was decided
3. The `rick.md` file was created correctly but `composer.ts` wasn't synced

This fix aligns the backend with the intended Bogart persona.
