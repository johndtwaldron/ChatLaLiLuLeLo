#!/bin/bash
# Test script for /chat endpoint with correct request format
# Usage: ./scripts/test-chat-endpoint.sh [endpoint_url]

set -e

ENDPOINT="${1:-http://localhost:8787}"
echo "🧪 Testing /chat endpoint at: $ENDPOINT"
echo ""

# Test 1: Health check
echo "1️⃣  Testing /health endpoint..."
curl -sS "${ENDPOINT}/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test 2: Valid request with JD mode
echo "2️⃣  Testing /chat with valid JD mode request..."
curl -v "${ENDPOINT}/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "JD",
    "messages": [
      { "role": "user", "content": "Hello Colonel" }
    ],
    "options": {
      "model": "gpt-4o-mini",
      "max_tokens": 100,
      "temperature": 0.7
    },
    "client": {
      "sessionId": "test-session-1",
      "appVersion": "1.0.0"
    }
  }' 2>&1 | grep -E "^< HTTP|^data:"
echo ""

# Test 3: Valid request with BTC mode
echo "3️⃣  Testing /chat with valid BTC mode request..."
curl -sS "${ENDPOINT}/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "BTC",
    "messages": [
      { "role": "user", "content": "Tell me about Bitcoin" }
    ]
  }' | head -n 5
echo ""

# Test 4: Valid request with GW mode (haywire)
echo "4️⃣  Testing /chat with valid GW mode request..."
curl -sS "${ENDPOINT}/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "GW",
    "messages": [
      { "role": "user", "content": "System check" }
    ]
  }' | head -n 5
echo ""

# Test 5: Valid request with MGS mode (lore)
echo "5️⃣  Testing /chat with valid MGS mode request..."
curl -sS "${ENDPOINT}/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "MGS",
    "messages": [
      { "role": "user", "content": "Tell me about MGS2" }
    ]
  }' | head -n 5
echo ""

# Test 6: Invalid request - lowercase mode (should fail with 400)
echo "6️⃣  Testing /chat with INVALID lowercase mode (should fail)..."
curl -sS "${ENDPOINT}/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "jd",
    "messages": [
      { "role": "user", "content": "test" }
    ]
  }' | jq '.' || echo "✅ Correctly rejected invalid lowercase mode"
echo ""

# Test 7: Invalid request - missing mode (should fail with 400)
echo "7️⃣  Testing /chat with INVALID missing mode (should fail)..."
curl -sS "${ENDPOINT}/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "test" }
    ]
  }' | jq '.' || echo "✅ Correctly rejected missing mode"
echo ""

# Test 8: RICK mode (new feature)
echo "8️⃣  Testing /chat with RICK mode request..."
curl -sS "${ENDPOINT}/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "RICK",
    "messages": [
      { "role": "user", "content": "Say hi, Rick" }
    ],
    "options": {
      "model": "mock"
    }
  }' | head -n 5
echo ""

echo "✅ All tests complete!"
echo ""
echo "📝 Valid modes: BTC, JD, GW, MGS, RICK (all uppercase)"
echo "📝 Valid models: gpt-4o-mini, gpt-4o, gpt-3.5-turbo, mock"
