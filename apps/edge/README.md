# ChatLaLiLuLeLo Backend v1

OpenAI-powered edge function backend with conversation modes and optional web search.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd apps/edge
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Set your OpenAI API key (required)
   npx wrangler secret put OPENAI_API_KEY

   # Set your Tavily API key (optional - for research feature)  
   npx wrangler secret put TAVILY_API_KEY

   # Set model (optional - defaults to gpt-4o-mini)
   npx wrangler secret put OPENAI_MODEL
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Test health endpoint:**
   ```bash
   curl http://localhost:8787/health
   ```

## API Endpoints

### POST /chat
Streams OpenAI responses in real-time.

**Request:**
```json
{
  "mode": "BTC|JD|GW|MGS",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "options": {
    "research": false,
    "max_tokens": 600,
    "temperature": 0.7
  }
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"type":"delta","token":"Hello"}
data: {"type":"delta","token":" there"}
data: {"type":"done","usage":{"completion_tokens":15}}
```

### GET /health
Returns service health status and configuration.

## Conversation Modes

- **BTC**: Bitcoin philosophy and orange pill perspective
- **JD**: Calm AI mentor with philosophical insights  
- **GW**: Controlled haywire with digital glitch effects
- **MGS**: Media theory and symbolic analysis

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model to use |
| `TAVILY_API_KEY` | No | - | Tavily search API key for research feature |

## Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy

# Deploy to staging
npx wrangler deploy --env staging
```

## Development

```bash
# Type check
npm run typecheck

# Local development with hot reload
npm run dev
```

The backend will be available at `http://localhost:8787`.
