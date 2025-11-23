# API Keys Map

## Single Source of Truth: `apps/edge/.dev.vars`

All API keys are stored in **one place**: `apps/edge/.dev.vars`

This file is:
- ✅ The canonical source for all secrets
- ❌ **NEVER** committed to git (in `.gitignore`)
- 🔄 Synced to other locations automatically

## Setup

```bash
# 1. Create from template
cd apps/edge
cp .dev.vars.example .dev.vars

# 2. Edit with your actual API keys
# Add: OPENAI_API_KEY, TAVILY_API_KEY, ELEVENLABS_API_KEY

# 3. Sync to mobile app
cd ../..
npm run sync-env

# 4. Start development
npm run dev  # Automatically runs sync-env first
```

## API Keys Inventory

### OPENAI_API_KEY

**Source**: `apps/edge/.dev.vars`

**Format**: `sk-proj-...` or `sk-...`

**Used In**:
- `apps/edge/api/chat.ts` - Main chat endpoint
- `apps/edge/lib/openai.ts` - OpenAI client initialization
- `apps/mobile/src/lib/voice/engines/openai.ts` - OpenAI TTS (if used)

**Validation**:
- `apps/edge/lib/config.ts` - `validateOpenAIKey()`
- `apps/edge/lib/__tests__/config.test.ts` - Unit tests

**Required**: ✅ Yes (backend won't start without it)

**How to Get**:
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Add to `apps/edge/.dev.vars`

---

### TAVILY_API_KEY

**Source**: `apps/edge/.dev.vars`

**Format**: `tvly-...`

**Used In**:
- `apps/edge/lib/search.ts` - Web search functionality
- `apps/edge/api/chat.ts` - Optional research mode

**Validation**:
- `apps/edge/lib/config.ts` - `validateTavilyKey()`
- `apps/edge/lib/__tests__/config.test.ts` - Unit tests

**Required**: ❌ No (optional feature)

**How to Get**:
1. Go to https://tavily.com
2. Sign up and get API key
3. Add to `apps/edge/.dev.vars`

---

### ELEVENLABS_API_KEY

**Source**: `apps/edge/.dev.vars`

**Synced To**: `apps/mobile/.env` as `EXPO_PUBLIC_ELEVENLABS_API_KEY`

**Format**: Variable (typically 20+ characters)

**Used In**:
- **Backend**: `apps/edge/lib/voice/engines/elevenlabs.ts` - If backend handles TTS
- **Frontend**: `apps/mobile/src/lib/voice/engines/elevenlabs.ts` - Client-side TTS
- **Frontend**: `apps/mobile/src/lib/voice/index.ts` - Voice config initialization

**Sync Process**:
1. Add `ELEVENLABS_API_KEY=...` to `apps/edge/.dev.vars`
2. Run `npm run sync-env`
3. Script creates `apps/mobile/.env` with `EXPO_PUBLIC_ELEVENLABS_API_KEY`
4. Voice system automatically enables

**Validation**:
- `apps/edge/lib/config.ts` - `validateElevenLabsKey()`
- `apps/edge/lib/__tests__/config.test.ts` - Unit tests
- `apps/mobile/src/lib/voice/debugEnv.ts` - Runtime environment check

**Required**: ❌ No (voice features optional)

**How to Get**:
1. Go to https://elevenlabs.io
2. Sign up or login
3. Navigate to Profile > API Keys
4. Create new key
5. Add to `apps/edge/.dev.vars` (NOT directly to mobile .env)

**Effect When Set**:
- ✅ Voice box appears in UI
- ✅ TTS audio playback available
- ✅ Voice controls enabled

**Effect When Missing**:
- ❌ Voice box hidden
- ❌ No audio playback
- ℹ️ App still works normally without voice

---

## Environment Sync Flow

```
┌─────────────────────────────────────┐
│ apps/edge/.dev.vars                 │
│ (Single Source of Truth)            │
│                                     │
│ OPENAI_API_KEY=sk-proj-...         │
│ TAVILY_API_KEY=tvly-...            │
│ ELEVENLABS_API_KEY=your-key        │
└─────────────────────────────────────┘
              │
              │ npm run sync-env
              │ (scripts/sync-env.sh)
              ▼
┌─────────────────────────────────────┐
│ apps/mobile/.env                    │
│ (Auto-generated, DO NOT EDIT)       │
│                                     │
│ EXPO_PUBLIC_VOICE_ENABLED=true     │
│ EXPO_PUBLIC_ELEVENLABS_API_KEY=... │
└─────────────────────────────────────┘
```

## Key Rotation

To rotate any API key:

```bash
# 1. Update the key in .dev.vars
vim apps/edge/.dev.vars

# 2. Sync to mobile (for ElevenLabs only)
npm run sync-env

# 3. Restart dev server
npm run dev
```

**That's it!** No need to update multiple files.

## Security Best Practices

### ✅ DO

- Store all keys in `apps/edge/.dev.vars`
- Use `npm run sync-env` to propagate changes
- Add `.dev.vars` to `.gitignore` (already done)
- Add `apps/mobile/.env` to `.gitignore` (already done)
- Use environment variables for all secrets
- Validate key formats before use

### ❌ DON'T

- Commit `.dev.vars` or `apps/mobile/.env` to git
- Hardcode API keys in source code
- Edit `apps/mobile/.env` manually (it's auto-generated)
- Share keys in plain text (use secure channels)
- Use production keys in development

## Troubleshooting

### "Voice box not showing"

**Cause**: ElevenLabs key not synced

**Fix**:
```bash
# 1. Add key to .dev.vars
echo "ELEVENLABS_API_KEY=your_key_here" >> apps/edge/.dev.vars

# 2. Sync
npm run sync-env

# 3. Restart
npm run dev
```

### "Invalid OpenAI API key format"

**Cause**: Typo in key (e.g., `ssk-proj-` instead of `sk-proj-`)

**Fix**:
1. Check `apps/edge/.dev.vars` for typos
2. Ensure key starts with `sk-` or `sk-proj-`
3. Validation will show detailed error message

### "sync-env.sh not found"

**Cause**: Script not executable or wrong directory

**Fix**:
```bash
chmod +x scripts/sync-env.sh
npm run sync-env
```

## CI/CD Configuration

### GitHub Actions

Set secrets in repository settings, then use in workflows:

```yaml
# .github/workflows/pages.yml
env:
  EXPO_PUBLIC_VOICE_ENABLED: true
  EXPO_PUBLIC_VOICE_ENGINE: elevenlabs
  EXPO_PUBLIC_ELEVENLABS_ENABLED: true
  EXPO_PUBLIC_ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}
```

### Cloudflare Workers

Set secrets via Wrangler CLI:

```bash
cd apps/edge
wrangler secret put OPENAI_API_KEY
wrangler secret put TAVILY_API_KEY
wrangler secret put ELEVENLABS_API_KEY
```

## Adding New API Keys

If you need to add a new API key:

1. **Add to `.dev.vars.example`**:
   ```bash
   NEW_SERVICE_API_KEY=your-key-here   # description
   ```

2. **Add validation** in `apps/edge/lib/config.ts`:
   ```typescript
   export function validateNewServiceKey(key: unknown): KeyValidationResult {
     // Validation logic
   }
   ```

3. **Add tests** in `apps/edge/lib/__tests__/config.test.ts`:
   ```typescript
   describe('validateNewServiceKey', () => {
     // Test cases
   });
   ```

4. **Update sync script** if needed for frontend access:
   ```bash
   # In scripts/sync-env.sh
   # Extract and add to mobile .env
   ```

5. **Update this document** with the new key's details

---

**Last Updated**: November 23, 2025  
**Sync Script**: `scripts/sync-env.sh`  
**Validation**: `apps/edge/lib/config.ts`
