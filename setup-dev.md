# ChatLaLiLuLeLo – Local Dev Setup (macOS)

This doc walks through **cloning the repo**, **installing dependencies**, **setting up API keys**, and **running the project locally** on macOS. It also covers how to **update your local copy** and do basic hygiene (lint/tests) before pushing.

---

## 0. Prerequisites (one-time setup on Mac)

You only need to do this once per machine.

### 0.1. Tools you need

- **Git**
- **Node.js + npm**
- A code editor (e.g. **VS Code**)
- Optional but nice: **Warp** (terminal), **nvm** (Node version manager)

Check if Node and npm are installed:

```bash
node -v
npm -v
```

If you see versions (e.g. v24.11.1 and 11.x.x), you’re good.

If not, install Node:
	•	Either via nodejs.org￼ (LTS is fine)
	•	Or via nvm if you prefer version management:

# install nvm (if you don't have it)
# follow: https://github.com/nvm-sh/nvm

```bash
nvm install --lts
nvm use --lts
```


⸻

1. Clone the repository

Pick a workspace folder, then:

```bash
cd ~/workspace/jdwGH   # or wherever you keep repos
git clone git@github.com:YOUR_GH_USERNAME/ChatLaLiLuLeLo.git
cd ChatLaLiLuLeLo
```

You can confirm:

```bash
pwd
# /Users/jdw/workspace/jdwGH/ChatLaLiLuLeLo

git status
# On branch main
# Your branch is up to date with 'origin/main'.
```

```bash
pwd
# /Users/jdw/workspace/jdwGH/ChatLaLiLuLeLo

git status
# On branch main
# Your branch is up to date with 'origin/main'.

# top open in VS CODE
code .
```

2. Install Node dependencies

From the repo root:
```bash
cd /Users/jdw/workspace/jdwGH/ChatLaLiLuLeLo

npm ci
```

Notes:
	•	npm ci uses the existing package-lock.json for a clean, reproducible install.
	•	You may see npm warnings about deprecated packages – that’s normal for now.
	•	You may see npm audit suggestions; you can review them later with:

```bash
npm audit
npm audit fix   # optional, only if you want to try to auto-fix
```

Once npm ci completes successfully, you’re set up for JS/TS dev.


3. Backend API keys (.dev.vars)

The backend (edge worker) uses environment variables defined in:

```bash
apps/edge/.dev.vars
```

You’ll see a template like:

```bash
# ChatLaLiLuLeLo Backend Environment Variables
# Copy this file to .dev.vars and fill in your actual API keys

OPENAI_API_KEY=sk-proj-your-openai-api-key-here
TAVILY_API_KEY=tvly-dev-...   # optional - for web search functionality

# Instructions:
# 1. Copy this file: cp .dev.vars.example .dev.vars
# 2. Get your OpenAI API key from: https://platform.openai.com/api-keys
# 3. Get your Tavily API key from: https://tavily.com/ (optional)
# 4. Replace the placeholder values above
# 5. Never commit .dev.vars to git (it's in .gitignore)
```

3.1. Create your local .dev.vars
From repo root:

```bash
cd apps/edge
cp .dev.vars.example .dev.vars
```

Then open .dev.vars in your editor and:
	•	Generate a new OpenAI API key (if you don’t remember the old one or want a Mac-only key):
	•	Visit: https://platform.openai.com/api-keys
	•	Create a key
	•	Paste it into OPENAI_API_KEY=...
	•	Optional: use your Tavily key in TAVILY_API_KEY=... if you want web search enabled.

.dev.vars is already in .gitignore, so it must not be committed.

⸻

4. Running the project locally

There are two main moving parts:
	1.	Frontend / Codec UI (React/React Native Web / Expo)
	2.	Backend / Edge worker (Cloudflare Worker via wrangler)

The exact script names live in package.json. The pattern will always be:

```bash
npm run <some-script-name>
```

4.1. See available scripts

From repo root:

```bash
npm run
```


This prints a list of all defined scripts, e.g. things like:
	•	dev / dev:web – start the web UI
	•	dev:edge / dev:worker – start the backend locally
	•	lint, test, test:ci, etc.

Use that as the source of truth if anything in this doc ever drifts.

4.2. Start the frontend (web codec UI)

From repo root (examples):

```bash
# Example patterns – confirm with `npm run`
npm run dev        # or:
npm run dev:web
```

This will:
	•	Start the dev server
	•	Show you a local URL in the terminal (e.g. http://localhost:14085)
	•	Hot-reload as you edit files in apps/mobile / src/...

4.3. Start the backend (edge / worker)

In a second terminal at the repo root:

```bash
# Again, check `npm run` for exact name – it might look like:
npm run dev:edge     # or:
npm run worker:dev
```

# Behind the scenes this usually runs wrangler dev --config wrangler.toml to simulate the Cloudflare Worker locally, reading from apps/edge/.dev.vars.

# If you don’t plan to touch backend for a session, you can often just run the frontend. But for end-to-end tests of chat/voice, the backend needs to be running.

---