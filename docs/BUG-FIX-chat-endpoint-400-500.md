# Bug Fix: /chat Endpoint 400/500 Errors

## Problem Summary

The `/chat` endpoint was returning:
- **400 Bad Request** for curl commands with lowercase mode values (e.g., `"jd"`)
- **500 Internal Server Error** from UI in some cases
- Unclear error messages ("Invalid request format" with no details)

## Root Cause

### 1. Schema Mismatch
The backend schema (`apps/edge/lib/schema.ts`) expects **uppercase** mode values:
- `'BTC'`, `'JD'`, `'GW'`, `'MGS'`

But the bug report's curl example used **lowercase**:
- `"mode": "jd"` ❌

The frontend already uses lowercase internally (`'haywire' | 'jd' | 'lore' | 'bitcoin'`) but correctly maps to uppercase before sending to the API.

### 2. Poor Error Responses
When validation failed, the endpoint returned plain text:
```
Invalid request format
```

This didn't help developers understand what was wrong.

## Changes Made

### 1. Improved Error Responses (`apps/edge/api/chat.ts`)
✅ Now returns structured JSON with validation details:

```json
{
  "error": "Invalid request format",
  "details": [
    {
      "path": "mode",
      "message": "Invalid enum value. Expected 'BTC' | 'JD' | 'GW' | 'MGS' | 'RICK', received 'jd'",
      "code": "invalid_enum_value"
    }
  ],
  "requestId": "req_abc123"
}
```

### 2. Added RICK Mode Support (`apps/edge/lib/schema.ts`)
✅ Added `'RICK'` to the ModeSchema enum for upcoming Rick mode feature

```typescript
export const ModeSchema = z.enum(['BTC', 'JD', 'GW', 'MGS', 'RICK']);
```

### 3. Enhanced Logging (`apps/edge/api/chat.ts`)
✅ Now logs the full request body when validation fails for easier debugging

### 4. Test Script (`scripts/test-chat-endpoint.sh`)
✅ Created comprehensive test script with:
- Valid examples for all modes (BTC, JD, GW, MGS, RICK)
- Invalid examples that should fail (lowercase, missing mode)
- Proper request structure documentation

## Testing the Fix

### 1. Start the Development Server
```bash
npm run dev
```

This starts:
- Backend: http://localhost:8787
- Frontend: http://localhost:14085

### 2. Run the Test Script
```bash
./scripts/test-chat-endpoint.sh
```

Or test manually:

### 3. Valid Request (should work ✅)
```bash
curl -v http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "JD",
    "messages": [
      { "role": "user", "content": "Hello Colonel" }
    ]
  }'
```

Expected: 200 OK with streaming SSE response

### 4. Invalid Request (should fail with helpful error ✅)
```bash
curl -v http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "jd",
    "messages": [
      { "role": "user", "content": "test" }
    ]
  }'
```

Expected: 400 Bad Request with JSON:
```json
{
  "error": "Invalid request format",
  "details": [
    {
      "path": "mode",
      "message": "Invalid enum value. Expected 'BTC' | 'JD' | 'GW' | 'MGS' | 'RICK', received 'jd'",
      "code": "invalid_enum_value"
    }
  ],
  "requestId": "req_..."
}
```

## Request Schema Reference

### Required Fields
```typescript
{
  mode: 'BTC' | 'JD' | 'GW' | 'MGS' | 'RICK',  // ⚠️ UPPERCASE only
  messages?: Array<{
    role: 'system' | 'user' | 'assistant',
    content: string
  }>
}
```

### Optional Fields
```typescript
{
  options?: {
    research?: boolean,
    max_tokens?: number,      // 50-1000
    temperature?: number,     // 0-2
    model?: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo' | 'mock'
  },
  client?: {
    sessionId?: string,
    appVersion?: string
  }
}
```

### Mode Mapping (Frontend → API)
The frontend uses lowercase internally and maps to uppercase:

```typescript
// Frontend (internal)
type ConversationMode = 'haywire' | 'jd' | 'lore' | 'bitcoin' | 'rick';

// API (external)
const modeMap = {
  'haywire': 'GW',
  'jd': 'JD',
  'lore': 'MGS',
  'bitcoin': 'BTC',
  'rick': 'RICK'
};
```

## Frontend Integration

The frontend (`ChatScreen.tsx`) already correctly maps modes:
```typescript
const modeMap = {
  'haywire': 'GW',
  'jd': 'JD', 
  'lore': 'MGS',
  'bitcoin': 'BTC'
} as const;

const apiMode = modeMap[currentMode] || 'JD';
```

**Action needed:** Add 'rick' to this mapping when implementing Rick mode.

## Common Errors

### ❌ "Invalid enum value" for mode
**Problem:** Using lowercase mode (`"jd"` instead of `"JD"`)
**Solution:** Use uppercase: `"JD"`, `"BTC"`, `"GW"`, `"MGS"`, `"RICK"`

### ❌ "Invalid type" for content
**Problem:** Sending content as array instead of string
**Solution:** Use `"content": "text here"` not `"content": [...]`

### ❌ Missing mode field
**Problem:** Request doesn't include `mode` field
**Solution:** Always include `"mode": "JD"` (or other valid mode)

## Verification Checklist

- [x] Schema updated to return detailed JSON errors
- [x] RICK mode added to schema
- [x] Logging improved to include request body
- [x] Test script created with valid examples
- [x] Documentation updated with correct request format
- [ ] Frontend Rick mode mapping (to be done with Rick feature)
- [ ] Test with real dev server running
- [ ] Verify 500 errors are also caught and logged properly

## Next Steps for Rick Mode

1. Add Rick system prompt to `apps/edge/context/modes/`
2. Update frontend `ChatScreen.tsx` mode mapping to include `'rick': 'RICK'`
3. Add Rick to frontend theme system (`ConversationMode` type)
4. Create Rick theme preset (black & white as per spec)
5. Test end-to-end with `npm run dev`

## References

- Bug Report: `docs/WARP.GPT.notes/bug-warp-chat-endpoint-400-500.txt`
- Rick Mode Spec: `docs/WARP.GPT.notes/rick-mode-spec.md`
- Test Script: `scripts/test-chat-endpoint.sh`
- Schema: `apps/edge/lib/schema.ts`
- Chat Handler: `apps/edge/api/chat.ts`
