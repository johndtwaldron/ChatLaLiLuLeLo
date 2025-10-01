Deadly progress. Here’s a tight **Backend v1 Implementation Doc** you can paste into Warp (and your repo). It’s concrete enough that Warp can scaffold it and you can fill in secrets later.

# Backend v1 — OpenAI + Modes + Web Search

## Goals

* Wire the codec UI to a **/chat** backend that streams OpenAI responses.
* Support **4 modes** with external prompt files: `BTC`, `JD`, `GW`, `MGS`.
* Optional **web search tool** to enrich replies when the user toggles “Research”.
* Keep **IP-safe**: homage tone, no verbatim MGS quotes, no actor voice cloning.

---

## Architecture (monorepo-friendly)

```
apps/
  mobile/
edge/
  api/
    chat.ts           # POST /chat (stream)
    health.ts         # GET /health
    lib/
      openai.ts       # OpenAI client + helpers
      composer.ts     # prompt+message composer (modes)
      search.ts       # optional web search tool
      schema.ts       # zod schemas
      logger.ts       # minimal redacted logs
prompts/
  modes/
    btc.md
    jd.md
    gw.md
    mgs.md
```

**Platform:** Cloudflare Workers (or Vercel Edge). Either works; examples below use **CF Workers** syntax.

---

## Request/Response

### Request (frontend → `/chat`)

```json
{
  "mode": "BTC|JD|GW|MGS",
  "messages": [
    {"role":"system","content":"(optional overrides)"},
    {"role":"user","content":"text..."},
    {"role":"assistant","content":"...previous turns..."}
  ],
  "options": {
    "research": true,
    "max_tokens": 600,
    "temperature": 0.7
  },
  "client": {
    "sessionId": "uuid",
    "appVersion": "0.1.0"
  }
}
```

### Response (SSE stream)

* `Content-Type: text/event-stream`
* Events: `data: {"type":"delta","token":"..."}` then `data: {"type":"done","usage":{...}}`

Frontend subscribes and renders tokens in `SubtitleStream`.

---

## Mode Prompts (external files)

Create `prompts/modes/*.md` (paraphrased, **no** copyrighted quotes):

* **btc.md** — Sovereignty lens, self-custody, simple threat models, *no* price advice, short codec cadence. “Orange-pill” gently with consent & clarity.
* **jd.md** — Calm mentor energy. End-sequence *vibe* (not lines). Concise, subtitle pacing, reflective, playful meta.
* **gw.md** — Controlled “haywire”: bracketed [static], glitch cadence, surreal but safe. Never insulting, never slurs. 10% max glitch density.
* **mgs.md** — Media theory + Kojima-adjacent symbolism, connect to current events without naming IP explicitly; cite public-domain thinkers where relevant.

Each file ends with guardrails: brevity, safety, no verbatim quotes, no identity claims.

---

## OpenAI Hook (edge/lib/openai.ts)

```ts
// edge/lib/openai.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type Mode = 'BTC'|'JD'|'GW'|'MGS';

export async function streamChat({
  systemPrompt,
  messages,
  model = 'gpt-4o-mini',
  temperature = 0.7,
  max_tokens = 600
}: {
  systemPrompt: string;
  messages: { role:'user'|'assistant'|'system', content:string }[];
  model?: string; temperature?: number; max_tokens?: number;
}) {
  // Compose with system on top
  const payload = [{
    role: 'system', content: systemPrompt
  }, ...messages];

  const resp = await openai.chat.completions.create({
    model,
    messages: payload,
    temperature,
    max_tokens,
    stream: true,
  });

  return resp; // AsyncIterable<ChatCompletionChunk>
}
```

---

## Prompt Composer (edge/lib/composer.ts)

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Mode = 'BTC'|'JD'|'GW'|'MGS';

const root = join(process.cwd(), '..'); // adjust if needed
const modePath = (m: Mode) => join(root, 'prompts', 'modes', m.toLowerCase() + '.md');

export function buildSystemPrompt(mode: Mode, opts?: {research?: boolean}) {
  const base = readFileSync(modePath(mode), 'utf8');
  const researchHint = opts?.research
    ? '\n\n[TOOLING]: If asked or context benefits, call the research tool to fetch 1–3 reputable sources and weave a brief synthesis. Keep quotes short.'
    : '';
  const universal = `
[UNIVERSAL RULES]
- Subtitle cadence (6–16 words), concise, no walls of text.
- No copyrighted quotes, no actor impersonation, no identity claims.
- Be kind. No slurs. No medical/financial advice.`;

  return base + researchHint + universal;
}
```

---

## Optional Web Search Tool (edge/lib/search.ts)

Pick one: **Tavily**, **SerpAPI**, **SearchAPI**. Example for Tavily:

```ts
export async function webSearch(q: string) {
  const key = process.env.TAVILY_API_KEY!;
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ query: q, max_results: 3 })
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).map((r: any) => ({
    title: r.title, url: r.url, snippet: r.snippet
  }));
}
```

Expose it as a **tool**: before hitting OpenAI, detect `options.research === true` and:

* Build a search query from the **last user message** (+ mode hint).
* Fetch top results and **prepend** a compact “context” block to the system prompt.

```ts
export function formatResearchContext(results: {title:string,url:string,snippet:string}[]) {
  if (!results.length) return '';
  const lines = results.map(r => `- ${r.title} — ${r.url}\n  ${r.snippet}`);
  return `\n[RESEARCH CONTEXT]\nUse sparingly. Sources:\n${lines.join('\n')}\n`;
}
```

---

## API Route (edge/api/chat.ts) — Cloudflare Worker

```ts
import { streamChat } from '../lib/openai';
import { buildSystemPrompt } from '../lib/composer';
import { webSearch, formatResearchContext } from '../lib/search';

export default {
  async fetch(req: Request, env: any) {
    const url = new URL(req.url);
    if (url.pathname === '/health') return new Response('ok');

    if (url.pathname !== '/chat' || req.method !== 'POST') {
      return new Response('Not Found', { status: 404 });
    }

    const { mode, messages, options, client } = await req.json();

    // Basic validation
    if (!['BTC','JD','GW','MGS'].includes(mode)) {
      return new Response('Invalid mode', { status: 400 });
    }

    // Research context (optional)
    let researchBlock = '';
    if (options?.research) {
      const lastUser = [...(messages||[])].reverse().find(m => m.role === 'user')?.content ?? '';
      const results = lastUser ? await webSearch(`${mode}: ${lastUser}`) : [];
      researchBlock = formatResearchContext(results);
    }

    const systemPrompt = buildSystemPrompt(mode, { research: !!options?.research }) + researchBlock;

    // OpenAI stream
    const stream = await streamChat({
      systemPrompt,
      messages,
      model: env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 600
    });

    // SSE pipe
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type:'delta', token: delta })}\n\n`));
          }
        }
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type:'done' })}\n\n`));
      } catch (e) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type:'error', message: String(e) })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  }
} satisfies ExportedHandler;
```

> **Vercel Edge**: same idea using `ReadableStream`/`TextEncoder` and edge runtime.

---

## Frontend Hook

Call `/chat` with **fetch + EventSource** (or `fetch` + stream reader) and pipe tokens to `SubtitleStream`. Include `mode`, `messages`, and `options.research`.

```ts
// apps/mobile/src/lib/api.ts
export function streamReply(body: any, onToken: (t:string)=>void) {
  return fetch(process.env.EXPO_PUBLIC_API_URL + '/chat', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  }).then(async (res) => {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      text.split('\n\n').forEach(line => {
        if (!line.startsWith('data:')) return;
        const evt = JSON.parse(line.slice(5).trim());
        if (evt.type === 'delta') onToken(evt.token);
      });
    }
  });
}
```

---

## Environment & Secrets

* `OPENAI_API_KEY` (required)
* `OPENAI_MODEL` (optional, default `gpt-4o-mini`)
* `TAVILY_API_KEY` (optional for research)
* Set on **CF Workers** or **Vercel** project settings; **never** ship to client.

---

## Local Dev

**Edge** (Cloudflare):

```bash
cd edge
npm i
# wrangler.toml with routes for /chat and /health
npx wrangler dev --local
```

**Mobile (web) pointing to local edge:**

* Add `EXPO_PUBLIC_API_URL=http://127.0.0.1:8787` to `apps/mobile/.env`.
* Restart `npm run start -- --web`.

---

## Acceptance Tests (manual)

1. **Stream**: Tokens arrive within 1.5s and render without blocking.
2. **Modes**: Switching modes loads the correct tone (BTC/JD/GW/MGS).
3. **Research**: With `research=true`, model references 1–3 sources succinctly.
4. **Safety**: No copyrighted quotes, no impersonation, no advice.
5. **Perf**: Responses < 600 tokens; backend < ~2s TTFB on good network.

---

## Next Tickets (suggested)

* [ ] `edge/api/chat.ts`: add lightweight **rate limiting** (IP/session) to curb abuse.
* [ ] **Telemetry**: anonymized counters (mode used, latency, tokens).
* [ ] **Mode intensity** dial (e.g., `gw_glitch_level: 0–3`).
* [ ] **Unit tests** for `composer.ts` + `search.ts`.
* [ ] **CI**: Edge typecheck + deploy preview on PR.

---
