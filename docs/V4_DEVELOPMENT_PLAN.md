# ChatLaLiLuLeLo V4 Development Plan

## 🎯 **V4 Objectives**

Transform ChatLaLiLuLeLo from a local development demo into a **production-ready, shareable online platform** with advanced model controls, security hardening, and professional deployment infrastructure.

---

## 🔢 **V4 Priority Roadmap**

### **🚀 Phase 1: Core Features (Week 1)**

#### **Priority 1: Model Toggle (v4-001)** 🔧
- **Complexity**: Medium (2-3 days)
- **Components**: `ModelToggle.tsx` near MODE/CRT/THEME buttons
- **Models**: 
  - `gpt-4o-mini` (cheap, default)
  - `gpt-4o` (quality, premium)  
  - `gpt-3.5-turbo` (ultra-cheap)
  - `mock` (free testing mode)
- **Features**:
  - Model selection persisted in `localStorage`
  - Cost hints displayed per model
  - Backend allowlist validation
  - Mock mode streams deterministic fake tokens
- **API Enhancement**: `body.options.model` parameter

#### **Priority 2: Mode-Tagged Replies (v4-002)** 🏷️
- **Complexity**: Low (1 day)
- **Implementation**: Frontend decoration only (not prompt instruction)
- **Tags**: `[JD]:`, `[BTC]:`, `[GW]:`, `[MGS]:` prefixes
- **Features**:
  - Colored badges per mode/theme
  - No token waste on model-generated tags
  - Theme-coordinated visual indicators

---

### **🌐 Phase 2: Production Deployment (Week 2)**

#### **Priority 3: Shareable Online Demo (v4-003)** 🚀
- **Complexity**: High (3-4 days)
- **Frontend Deploy**: Vercel/Netlify/Cloudflare Pages
- **Backend**: Cloudflare Worker staging route
- **Features**:
  - `EXPO_PUBLIC_API_URL` pointing to Worker
  - CORS configuration for demo origin
  - Access gate: `?k=token` or basic password prompt
  - Shareable URL in `docs/demo.md`
  - 3-step "how to try" instructions

#### **Priority 4: Funding & Spend Control (v4-004)** 💰
- **Complexity**: Medium (2-3 days)
- **Hard Cap**: $5/month budget limit
- **Features**:
  - Per-IP rate limiting: N requests/15min
  - Message length capping (4-8k chars)
  - Per-session token ceiling
  - "Budget near cap" banner
  - Lightning QR for donations (optional)
  - "Budget left" indicator from Worker logs

---

### **🛡️ Phase 3: Security & Hardening (Week 3)**

#### **Priority 5: Security & Prompt Hardening (v4-005)** 🔒
- **Complexity**: High (3-4 days)
- **System Security**:
  - Server-side only system prompts (never exposed)
  - Input sanitization: strip control chars, length clamping
  - Prompt injection defense: refuse tool/URL execution
  - Markdown HTML disabled by default
- **Web Security**:
  - CSP headers in web deploy
  - CORS locked to approved domains
  - Rate limiting with timeouts + abort controllers
  - Graceful error handling banners

#### **Priority 6: Readability Polish (v4-006)** ✨
- **Complexity**: Medium (2 days)
- **Text Handling**:
  - Preserve `\n`, wrap long tokens/URLs
  - Word-boundary streaming buffer (flush on whitespace ~33-50ms)
  - Auto-scroll to latest message
- **CRT Integration**:
  - CRT ON/OFF doesn't affect wrapping/clipping
  - Subtle text shadow when CRT enabled
- **Typography**:
  ```css
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.35;
  letter-spacing: .2px;
  font-family: 'VT323', ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace;
  ```

---

### **🧪 Phase 4: QA & Performance (v4.5)**

#### **Priority 7: CI Enhancements & Testing** 🔬
- **Unit Tests**: Jest/RTL for key components
- **Worker Tests**: Supertest/Miniflare for backend
- **Security Scans**: `npm audit --production`, ESLint max-warnings=0
- **Performance Budget**: Bundle size < 3MB gzipped
- **Stress Testing**: 100+ messages, 2k token streams

#### **Priority 8: Error UX & Monitoring (v4-007)** 📊
- **SSE Retry Logic**: Connection failure recovery
- **Abort Controllers**: Request cancellation
- **Error Banners**: Clear, actionable error messages
- **Frontend Logging**: Sentry integration (PII redacted)

---

## 🛠️ **Technical Implementation Details**

### **A) Model Toggle Architecture**
```typescript
// Frontend: ModelToggle.tsx
const models = {
  'gpt-4o-mini': { name: 'GPT-4o Mini', cost: '$0.15/M tokens', default: true },
  'gpt-4o': { name: 'GPT-4o', cost: '$5.00/M tokens' },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', cost: '$0.50/M tokens' },
  'mock': { name: 'Mock Mode', cost: 'Free' }
};

// API Request Body
body = { mode, messages, options: { model } }

// Backend: Model allowlist + mock mode
if (model === 'mock') {
  return streamMockResponse(mode);
}
const allowedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
const finalModel = allowedModels.includes(model) ? model : env.DEFAULT_MODEL;
```

### **B) Mode-Tagged Replies**
```typescript
// Message Renderer (Frontend only)
const getModeTage = (mode: string) => {
  const tags = { JD: '[JD]:', BTC: '[BTC]:', GW: '[GW]:', MGS: '[MGS]:' };
  return tags[mode] || '[UNKNOWN]:';
};

return (
  <span>
    <strong className={`mode-badge mode-${mode}`}>{getModeTag(mode)}</strong>
    {renderedText}
  </span>
);
```

### **C) Deployment Configuration**
```bash
# Frontend (Vercel/Netlify)
EXPO_PUBLIC_API_URL=https://your-worker.workers.dev
EXPO_PUBLIC_DEBUG_MODE=0

# Worker Environment
DEMO_ACCESS_TOKEN=your-secret-key
CORS_ORIGINS=https://your-demo.vercel.app

# Rate Limiting
REQUESTS_PER_15MIN=30
MAX_MESSAGE_LENGTH=8000
MAX_TOKENS_PER_SESSION=50000
```

---

## 📋 **Acceptance Criteria**

### **Model Toggle**
- ✅ Switching models immediately affects next reply
- ✅ Selection persisted across browser reload
- ✅ "Mock" mode produces deterministic sample stream
- ✅ Cost hints visible in UI
- ✅ Backend validates model allowlist

### **Tagged Replies**
- ✅ All assistant messages show mode prefix (`[JD]:`, `[BTC]:`, etc.)
- ✅ Tags are frontend decoration, not model-generated
- ✅ Colored badges coordinate with theme system
- ✅ No token waste on prefix generation

### **Shareable Demo**
- ✅ URL shared to friend loads and chats successfully
- ✅ Requests hit Cloudflare Worker correctly
- ✅ CORS configuration allows demo origin
- ✅ Access gate protects against random traffic
- ✅ Demo instructions in `docs/demo.md`

### **Spend Controls**
- ✅ Per-IP and per-session limits yield friendly banner
- ✅ Send button disabled when limits exceeded
- ✅ Budget logs visible in Worker analytics
- ✅ "Mock" mode available for zero-cost testing

### **Security**
- ✅ No HTML injection vulnerabilities
- ✅ Long inputs truncated with user notice
- ✅ System prompts never echoed to user
- ✅ CSP headers properly configured
- ✅ Input sanitization prevents control char injection

### **Readability**
- ✅ No text clipping or unwanted truncation
- ✅ Newlines preserved in messages
- ✅ Auto-scroll reliable and smooth
- ✅ CRT toggle doesn't affect text legibility
- ✅ Word-boundary streaming buffer prevents choppy text

---

## 🚀 **Development Commands**

```bash
# Start V4 development
git checkout develop-v4

# Local development
npm run dev

# Web demo build
cd apps/mobile && npm run build

# Deploy frontend (set EXPO_PUBLIC_API_URL to Worker URL)
# Deploy worker as 'staging' route with CORS allowlist
```

---

## 📦 **Suggested GitHub Issues**

- **v4-001**: Implement ModelToggle (frontend + backend allowlist, mock mode)
- **v4-002**: Add mode-tag prefixes in renderer + badge color map
- **v4-003**: Deploy shareable demo (frontend to Vercel/Netlify; CORS on Worker; access gate)
- **v4-004**: Add rate limits & per-session caps; "budget near cap" banner
- **v4-005**: Prompt hardening (sanitize input, clamp length, refuse tool/URL asks)
- **v4-006**: Readability polish (wrap/newlines, buffer, auto-scroll, CRT shadow)
- **v4-007**: Error UX (SSE retry, abort controller, clear error banners)
- **v4-008**: Donation QR (Lightning) + "budget left" indicator (optional)

---

## 🎯 **Success Metrics**

- **Performance**: Bundle < 3MB gzipped, startup < 5s
- **Security**: 0 critical vulnerabilities, CSP compliance
- **UX**: Smooth streaming, reliable auto-scroll, graceful errors
- **Cost Control**: Hard $5/month cap respected
- **Accessibility**: Shareable demo with 3-step instructions
- **Code Quality**: All tests green, CI passing, comprehensive coverage

---

**Status**: 🚀 **V4 DEVELOPMENT READY** - Comprehensive plan established, branch created, ready for Priority 1 (Model Toggle) implementation.

**Next Step**: Begin Model Toggle component development with localStorage persistence and backend integration.
