# Testing the 500 Error Fix

## What GPT Said (Paraphrased)

> "The 400/schema issue is fixed. Now we have a 500 error happening **inside** the handler. Something is throwing before we get to return a response. We need to:
> 1. Add comprehensive error logging to see the **actual** error
> 2. Check if the code changes are actually running
> 3. Look for missing environment variables or mode-specific issues"

## Changes Made to Debug & Fix

### 1. Enhanced 500 Error Handling (`apps/edge/api/chat.ts`)

✅ **Added detailed console logging**:
```typescript
console.error('CHAT ERROR - Full details:', {
  requestId,
  message: errorMessage,
  stack: errorStack,
  error: error,
  timestamp: new Date().toISOString()
});
```

✅ **Return JSON for 500 errors** (not plain text):
```json
{
  "error": "Internal server error",
  "message": "Actual error message here",
  "requestId": "req_abc123",
  "timestamp": "2025-11-23T11:12:00Z"
}
```

### 2. Entry Point Logging (`apps/edge/api/chat.ts`)

✅ **Log every request that comes in**:
```typescript
console.log('[CHAT] Received request at', new Date().toISOString());
console.log('[CHAT] Request method:', req.method);
console.log('[CHAT] Request URL:', req.url);
console.log('[CHAT] Parsed body:', JSON.stringify(body, null, 2));
```

This will show:
- If the request even reaches the handler
- What the parsed body looks like
- Exactly where it fails

### 3. Added RICK Mode System Prompt (`apps/edge/lib/composer.ts`)

✅ **Root cause found**: `MODE_PROMPTS` object was missing `'RICK'` entry!

When `buildSystemPrompt('RICK', ...)` was called, it tried to access `MODE_PROMPTS['RICK']` which was `undefined`, causing the handler to fail.

✅ **Fixed**: Added complete Rick Sanchez persona prompt with:
- Sarcastic, cynical tone
- Casual genius communication
- Dark humor and nihilism
- Scientific explanations with attitude
- Safety constraints (PG-13, no harmful content)

## How to Test Now

### 1. Start Fresh Development Server

```bash
# Kill any existing workerd processes
pkill -f workerd || pkill -f wrangler

# Clean install (optional but recommended)
npm ci

# Start dev server
npm run dev
```

Watch for:
- ✅ "Backend started on port 8787"
- ✅ "Frontend started on port 14085"

### 2. Test with curl (Terminal 2)

```bash
# Test RICK mode (this was causing the 500)
curl -v http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "RICK",
    "messages": [
      { "role": "user", "content": "Explain quantum mechanics" }
    ],
    "options": {
      "model": "mock"
    }
  }'
```

### 3. What to Look For

**In the workerd/wrangler terminal**, you should now see:

```
[CHAT] Received request at 2025-11-23T11:12:00.000Z
[CHAT] Request method: POST
[CHAT] Request URL: http://localhost:8787/chat
[CHAT] Parsed body: {
  "mode": "RICK",
  "messages": [
    { "role": "user", "content": "Explain quantum mechanics" }
  ],
  "options": {
    "model": "mock"
  }
}
[INFO] Chat request received { mode: 'RICK', messageCount: 1, ... }
```

**If it still fails**, you'll see:
```
CHAT ERROR - Full details: {
  requestId: 'req_...',
  message: 'The actual error message',
  stack: 'Full stack trace here...',
  error: { ... },
  timestamp: '...'
}
```

**Copy that entire error block** and we can fix the real issue.

### 4. Expected Success Response

For mock mode, you should get:
```
data: {"type":"delta","token":"Mock"}
data: {"type":"delta","token":" "}
data: {"type":"delta","token":"response"}
...
data: {"type":"done","usage":{"completion_tokens":3}}
```

For real OpenAI (if API key is set):
- Streaming SSE events with Rick's personality
- Sarcastic, helpful responses with *burps*

## Checklist Before Testing

- [ ] Killed all old workerd/wrangler processes
- [ ] Ran `npm ci` to ensure dependencies are fresh
- [ ] Confirmed you're on the correct branch (`git status`)
- [ ] `.dev.vars` file exists in `apps/edge/` (optional for mock mode)
- [ ] Terminal is showing the dev server output

## Common Issues & Solutions

### ❌ "Connection refused" on port 8787
**Problem**: Backend isn't running
**Solution**: Run `npm run dev` from project root

### ❌ "OPENAI_API_KEY is not defined"
**Problem**: Real API key missing (only needed for non-mock models)
**Solution**: 
- Use `"model": "mock"` in your request, OR
- Create `apps/edge/.dev.vars` with `OPENAI_API_KEY=sk-proj-...`

### ❌ Still getting plain text "Internal server error"
**Problem**: Old worker process is still running with old code
**Solution**: 
```bash
# Kill all wrangler/workerd processes
pkill -f wrangler
pkill -f workerd

# Start fresh
npm run dev
```

### ❌ "Invalid enum value" for mode
**Problem**: Using lowercase mode
**Solution**: Use uppercase: `RICK`, `JD`, `BTC`, `GW`, `MGS`

## Understanding the Error Flow

The handler now has **three layers of logging**:

1. **Entry logging**: Shows request received and parsed body
2. **Validation logging**: Shows if schema validation passes/fails
3. **Error logging**: Shows full error details if anything throws

This means we can pinpoint **exactly** where it fails:

| What You See | What It Means |
|--------------|---------------|
| Nothing in logs | Request not reaching handler (CORS? Network?) |
| `[CHAT] Received` but no validation | JSON parsing failed |
| Validation logs but no stream | Error in OpenAI/stream setup |
| `CHAT ERROR - Full details` | Something threw - check the stack |

## Next Steps After Testing

Once you run this and capture the output:

### ✅ If it works:
- Test all modes: JD, BTC, GW, MGS, RICK
- Test from UI (frontend at localhost:14085)
- Verify streaming works smoothly

### ❌ If it still fails:
- Copy the **full** `CHAT ERROR - Full details` log
- Include any other errors/warnings from the terminal
- Share that output - we'll see exactly what's wrong

## Files Changed

- `apps/edge/api/chat.ts` - Enhanced error handling and logging
- `apps/edge/lib/schema.ts` - Added 'RICK' to ModeSchema
- `apps/edge/lib/composer.ts` - Added RICK mode system prompt
- `scripts/test-chat-endpoint.sh` - Comprehensive test script
- `docs/BUG-FIX-chat-endpoint-400-500.md` - Original bug fix doc
- `docs/TESTING-500-ERROR-FIX.md` - This testing guide

## Quick Test Script

```bash
#!/bin/bash
# Quick test of all modes

ENDPOINT="http://localhost:8787"

echo "Testing all modes..."

for mode in JD BTC GW MGS RICK; do
  echo "Testing $mode mode..."
  curl -sS "${ENDPOINT}/chat" \
    -H "Content-Type: application/json" \
    -d "{
      \"mode\": \"$mode\",
      \"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}],
      \"options\": {\"model\": \"mock\"}
    }" | head -n 3
  echo ""
done
```

Save as `test-all-modes.sh`, make executable (`chmod +x`), and run it!
