# ChatLaLiLuLeLo Demo Documentation

## 🌐 Live Demo

**GitHub Pages URL**: `https://johndtwaldron.github.io/ChatLaLiLuLeLo/`

Experience the MGS2 codec interface with authentic Colonel AI personalities directly in your browser.

## 🚀 What's Deployed Where

### Frontend (GitHub Pages)
- **Platform**: GitHub Pages (Static Site)
- **URL**: `https://johndtwaldron.github.io/ChatLaLiLuLeLo/`
- **Tech Stack**: React Native Web + Expo
- **Features**: 
  - MGS2 codec UI with CRT effects
  - Live theme cycling (7 themes)
  - Dual draggable portraits
  - Real-time budget indicator
  - Interactive debug panel

### Backend (Cloudflare Workers)
- **Platform**: Cloudflare Workers (Edge Computing)
- **URL**: Configured via `DEMO_API_URL` environment variable
- **Tech Stack**: TypeScript + OpenAI API
- **Features**:
  - 4 authentic Colonel AI personalities
  - Real-time streaming responses
  - Comprehensive spend controls
  - Rate limiting (30 req/15min)
  - Budget tracking with $5/month cap

## 🛡️ Cost Controls & Security

### Budget Protection
- **Hard Cap**: $5.00/month maximum spend
- **Rate Limiting**: 30 requests per 15-minute window per IP
- **Session Limits**: 50,000 tokens per session
- **Message Length**: 8,000 character limit per message
- **Model-Aware Pricing**: Accurate cost calculation per model

### Warning System
- **75% Usage**: Orange warning indicator
- **90% Usage**: Red critical alert
- **100% Usage**: Requests blocked, Mock mode suggested

### Security Features
- **CORS Allowlist**: GitHub Pages domain explicitly allowed
- **No Exposed Secrets**: API keys secured in Cloudflare environment
- **Input Sanitization**: Message length and content validation
- **Origin Validation**: Requests validated against allowed origins

## 🔧 How to Run Locally

### Prerequisites
- Node.js 18.x or 20.x
- npm 8.x or higher
- OpenAI API key (optional, mock mode available)

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/johndtwaldron/ChatLaLiLuLeLo.git
   cd ChatLaLiLuLeLo
   ```

2. **Install Dependencies**
   ```bash
   npm ci
   ```

3. **Configure Environment** (Optional)
   ```bash
   # Create API key file (for real AI responses)
   cp apps/edge/.dev.vars.example apps/edge/.dev.vars
   # Edit .dev.vars and add your OpenAI API key
   ```

4. **Start Development Servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: `http://localhost:14085`
   - Backend: `http://localhost:8787`

### Alternative Launch Methods

**Quick Start (No API Key)**
```bash
npm run prod  # Uses Mock mode by default
```

**Desktop Launcher (Windows)**
```bash
# PowerShell launcher with auto-browser opening
scripts/launcher.ps1
```

## 🎮 Features & Controls

### Conversation Modes
- **JD Mode**: Core Colonel AI personality with philosophical authority
- **BTC Mode**: Bitcoin-focused Colonel with monetary sovereignty themes
- **GW Mode**: Haywire malfunction mode with system glitches
- **MGS Mode**: Meta-analysis of MGS2's prophetic cultural warnings

### UI Controls
- **CRT Toggle**: Enable/disable CRT visual effects
- **Theme Cycling**: 7 themes (Cyan, Purple, Gold, Green, Yellow, Crimson, Orange)
- **Model Selection**: gpt-4o-mini, gpt-4o, gpt-3.5-turbo, Mock mode
- **Debug Panel**: Real-time API status, budget tracking, system info
- **Budget Indicator**: Live spend tracking in header
- **Draggable Portraits**: Colonel (cycles images) + User (sound effects)

### Special Features
- **Orange Pill Easter Egg**: Hidden orange theme exclusive to Bitcoin mode
- **Real-time Budget Updates**: Spend tracking updates after each message
- **Message History Freezing**: Mode/model tags preserved per message
- **140.85 Frequency Reference**: MGS2 codec frequency throughout UI
- **Audio System**: Codec sounds and UI interaction feedback

## 📊 Technical Architecture

### Frontend Stack
```
React Native Web
├── Expo 54.x (Web Build System)
├── TypeScript (Type Safety)
├── React Native Reanimated (60fps Animations)
├── React Native Gesture Handler (Draggable Portraits)
└── Custom Theme System (Live Switching)
```

### Backend Stack
```
Cloudflare Workers
├── OpenAI API Integration (Streaming)
├── Rate Limiting System (IP-based)
├── Budget Tracking (Real-time)
├── CORS Management (Origin Allowlist)
└── Comprehensive Logging
```

### Build Pipeline
```
GitHub Actions
├── Automated Testing (TypeScript, ESLint, Tests)
├── Web Export (Expo Static Build)
├── GitHub Pages Deployment (SPA Routing)
└── CORS Configuration (Environment Variables)
```

## 🔗 API Endpoints

### Production Endpoints
- **Chat**: `POST /chat` - Streaming AI responses with rate limiting
- **Budget**: `GET /budget?sessionId=...` - Real-time usage statistics  
- **Health**: `GET /health` - Service status and configuration

### Request Format
```json
{
  "mode": "jd" | "btc" | "haywire" | "lore",
  "messages": [{"role": "user", "content": "..."}],
  "options": {
    "model": "gpt-4o-mini" | "gpt-4o" | "gpt-3.5-turbo" | "mock",
    "temperature": 0.7,
    "max_tokens": 600
  },
  "client": {
    "sessionId": "unique-session-id",
    "appVersion": "v4.0"
  }
}
```

## 🌟 Demo Highlights

### Authentic MGS2 Experience
- **Codec Interface**: Faithful recreation of MGS2's communication system
- **Colonel AI**: Personality based on actual game transcripts
- **140.85 Frequency**: Reference to iconic MGS2 codec frequency
- **CRT Effects**: Optional scanlines, glow, and jitter animations

### Modern Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Live Theme System**: Instant visual updates across entire interface  
- **Real-time Budget Tracking**: Transparent cost monitoring
- **Progressive Enhancement**: Works without JavaScript (basic version)

### Developer Experience
- **Hot Reload**: Instant updates during development
- **TypeScript**: Full type safety and IDE support
- **Comprehensive Testing**: Unit tests, linting, and build validation
- **Production Logging**: Complete audit trail and error tracking

## 🔄 Deployment Process

### Automatic Deployment (GitHub Pages)
1. Push to `develop-v4` branch
2. GitHub Actions runs build pipeline
3. Static web export generated
4. Deployed to GitHub Pages automatically
5. Available at GitHub Pages URL

### Manual Deployment (Local)
```bash
# Build static web export
cd apps/mobile
npm run export:web

# Serve locally for testing
npx serve dist -s -p 3000
```

## 📱 Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+ (Recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Required Features
- ES2020 JavaScript support
- Fetch API for backend communication
- CSS Grid and Flexbox
- Web Audio API (for sound effects)

## 🆘 Troubleshooting

### Common Issues

**"Budget limit reached"**
- Switch to Mock mode for zero-cost testing
- Wait for monthly budget reset
- Check debug panel for current usage

**"CORS error"**
- Ensure using official GitHub Pages URL
- Check browser developer console for specific error
- Verify backend Worker is deployed and accessible

**Slow loading**
- First load may be slower due to audio file preloading
- Subsequent visits use browser cache
- Check network connection and retry

**Audio not playing**
- Browser may require user interaction before audio
- Click anywhere in the interface to enable audio
- Check browser audio permissions

### Debug Information

Access the debug panel (DEBUG button) for:
- Real-time API connection status
- Current budget and usage statistics
- Active theme and mode information
- Audio system status
- Environment configuration

## 📧 Support

For issues, feature requests, or questions:
- **GitHub Issues**: [Create an issue](https://github.com/johndtwaldron/ChatLaLiLuLeLo/issues)
- **Repository**: https://github.com/johndtwaldron/ChatLaLiLuLeLo
- **Documentation**: See `/docs` folder for technical details

---

*"Don't be silly, Jack. This is a demonstration of digital consciousness preserved for posterity."* - Colonel AI
