# ChatLaLiLuLeLo

> A codec-style entertainment companion for intellectual sparring and MGS nostalgia

![concept art](material/ai_gen/GPT.gen.1.col.png)

**⚠️ Legal Notice**: This project is an homage and parody, not affiliated with Konami or Metal Gear Solid. No trademarks, assets, or copyrighted content are used.

[![Live Demo](https://img.shields.io/badge/🎮_Live_Demo-GitHub_Pages-brightgreen)](https://johndtwaldron.github.io/ChatLaLiLuLeLo/)
[![CI/CD](https://github.com/johndtwaldron/ChatLaLiLuLeLo/actions/workflows/ci.yml/badge.svg)](https://github.com/johndtwaldron/ChatLaLiLuLeLo/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What is ChatLaLiLuLeLo?

A **production-ready React Native web application** that recreates the iconic Metal Gear Solid 2 codec interface for AI-powered philosophical conversations. Experience authentic MGS2 nostalgia through:

- **🎮 Live Web Demo**: Fully functional at [GitHub Pages](https://johndtwaldron.github.io/ChatLaLiLuLeLo/)
- **🤖 AI Conversations**: Four distinct Colonel AI personality modes
- **📱 Cross-Platform**: Web deployment with mobile-ready architecture
- **⚡ Lightning Network**: QR codes for Bitcoin Lightning payments
- **🔒 Security Hardened**: Multi-layer security with prompt injection protection

## Features

### 🎨 Authentic MGS2 Codec Experience
- **CRT Visual Effects**: Scanlines, phosphor glow, jitter animations with live toggle
- **MGS Typography**: TeX Gyre Heros font matching original codec interface
- **Animated Portraits**: Colonel and user avatars with idle breathing and mouth movement
- **Real-time Streaming**: Word-boundary text streaming with 40ms flush delays
- **Audio System**: Codec sounds and user interaction audio feedback

### 🤖 AI Conversation Modes
- **JD Mode**: Core Colonel AI authority with condescending philosophical guidance
- **BTC Mode**: Bitcoin-focused discussions with monetary sovereignty education
- **GW Mode**: Haywire/glitch effects with reality fragmentation and system corruption
- **MGS Mode**: Meta-analysis of MGS2's prophetic warnings about digital society

### ⚡ Lightning Network Integration
- **QR Code Generation**: Proper `lightning:` URI scheme for mobile wallet compatibility
- **iPhone Compatibility**: Fixed QR codes that correctly open Lightning wallet apps
- **Payment Integration**: Support for Bitcoin Lightning Network micropayments

### 🔒 Production Security
- **Multi-layer Defense**: Frontend validation + backend sanitization + CSP headers
- **Prompt Injection Protection**: 15+ attack pattern detection and blocking
- **Input Sanitization**: HTML tag removal, control character filtering
- **Rate Limiting**: 30 requests per 15 minutes per IP with budget controls
- **Real-time Feedback**: Live security validation with user-friendly warnings

### 💰 Budget Management
- **Cost Controls**: $5/month OpenAI budget limit with real-time tracking
- **Usage Monitoring**: Live spend display and session token tracking
- **Graceful Degradation**: Mode-specific fallback responses when quota exceeded
- **Mock Mode**: Zero-cost testing option for development

## Tech Stack

### Frontend
- **Framework**: Expo + React Native (TypeScript) with web deployment
- **Animation**: React Native Reanimated + custom CRT effects
- **State Management**: React hooks with theme subscription system
- **Styling**: Styled components with MGS codec color palette
- **Audio**: Expo AV with web platform compatibility

### Backend
- **Runtime**: Cloudflare Workers with edge deployment
- **AI**: OpenAI GPT-4o-mini with streaming responses
- **Security**: Multi-layer input validation and sanitization
- **Rate Limiting**: Per-IP request throttling with token budget tracking
- **Environment**: Development, staging, and production configurations

### Infrastructure
- **Deployment**: GitHub Pages (frontend) + Cloudflare Workers (backend)
- **CI/CD**: GitHub Actions with comprehensive testing and validation
- **Security**: Automated CSP header injection and security testing
- **Monitoring**: Structured logging and performance metrics

## 🚀 Quick Start

### 🌌 Try the Live Demo

**No setup required!** Experience ChatLaLiLuLeLo instantly:

👉 **[Launch Web Demo](https://johndtwaldron.github.io/ChatLaLiLuLeLo/)** 👈

- Full codec interface with CRT effects
- AI conversations across all four modes
- Lightning Network QR code generation
- Mobile-responsive design

### 🛠️ Local Development

#### Prerequisites
- **Node.js 18+** with npm 8+
- **Git** for version control
- **API Keys**: OpenAI and Tavily (optional)

#### Setup Instructions

```bash
# Clone the repository
git clone https://github.com/johndtwaldron/ChatLaLiLuLeLo.git
cd ChatLaLiLuLeLo

# Install dependencies
npm ci

# Set up environment variables (backend)
cd apps/edge
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your API keys

# Start development servers (from root directory)
npm run dev
```

**Development URLs:**
- **Frontend**: http://localhost:14085 (MGS2 140.85 frequency reference)
- **Backend**: http://localhost:8787
- **API Health**: http://localhost:8787/health

#### Enhanced Development Script

The `npm run dev` command provides:
- ✅ **CI Validation**: TypeScript, ESLint, and dependency checks
- ✅ **Dual Server**: Frontend and backend with proper port management
- ✅ **Live Reload**: Hot module replacement for rapid development
- ✅ **Windows Support**: Graceful shutdown with Ctrl+C

### 🧪 Testing

```bash
# Run all tests
npm test

# Security-focused testing
npm run test:security

# Lightning Network integration tests
npm run test:lightning

# CI validation (local)
npm run test:ci
```

### 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Enhanced development with CI checks |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint code quality |
| `npm run test:lightning` | Lightning Network validation |
| `npm run test:security` | Security system testing |
| `npm run build` | Production web build |

### 🌩️ Gitpod Cloud Development

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/johndtwaldron/ChatLaLiLuLeLo)

**Pre-configured environment includes:**
- Node.js 20 with all dependencies
- Expo CLI and development tools
- VS Code extensions for React Native
- Automatic port forwarding for web access

## 📁 Project Structure

```
ChatLaLiLuLeLo/
├── apps/
│   ├── mobile/                     # React Native web application
│   │   ├── src/
│   │   │   ├── components/         # UI components (CodecFrame, Portrait, etc.)
│   │   │   ├── features/chat/      # Chat interface and conversation logic
│   │   │   ├── lib/               # Core utilities (theme, audio, API, security)
│   │   │   └── assets/            # Images, audio, and static resources
│   │   ├── App.tsx                # Application entry point
│   │   └── package.json           # Frontend dependencies
│   └── edge/                      # Cloudflare Workers backend
│       ├── api/                   # API endpoints (chat, health, budget)
│       ├── lib/                   # Backend utilities (security, rate-limiting)
│       ├── wrangler.toml          # Cloudflare deployment configuration
│       └── .dev.vars.example      # Environment variable template
├── docs/                          # Documentation
│   ├── devlog.md                  # Complete development history
│   ├── LIGHTNING_FIXES.md         # Lightning Network implementation
│   └── SECURITY.md                # Security system documentation
├── scripts/                       # Development and CI scripts
│   ├── dev-with-ci.js            # Enhanced development script
│   ├── test-ci.js                # CI validation script
│   └── test-lightning-fixes.js   # Lightning Network validation
├── tests/                         # Test suites
│   ├── e2e-web/                  # End-to-end web tests
│   ├── lightning/                # Lightning Network integration tests
│   └── security-*.test.*         # Security validation tests
├── .github/workflows/            # CI/CD automation
│   ├── ci.yml                    # Main CI pipeline
│   ├── pages.yml                 # GitHub Pages deployment
│   └── lightning-e2e.yml         # Lightning Network E2E testing
└── material/                     # Development assets and documentation
    ├── ai_gen/                   # AI-generated artwork
    ├── images/                   # Colonel portrait assets
    └── devlog/                   # Development screenshots
```

## 🧩 Key Components

### Frontend Architecture

- **`CodecFrame`**: Main container with authentic MGS2 scanlines, CRT glow, and jitter effects
- **`Portrait`**: Animated colonel and user avatars with idle breathing and mouth movement
- **`SubtitleStream`**: Real-time text streaming with word-boundary buffering and typewriter effects
- **`TextInput`**: User input with live security validation and visual feedback
- **`CRTToggle`**: Live toggle for CRT effects with instant visual feedback
- **`BudgetIndicator`**: Real-time OpenAI spend tracking and budget warnings
- **`DebugPanel`**: Development tools for theme testing and API monitoring

### Backend Services

- **`/chat`**: Streaming AI conversations with security validation and budget controls
- **`/health`**: API status monitoring with environment configuration details
- **`/budget`**: Real-time usage tracking and cost estimation
- **Security Module**: Multi-layer prompt injection detection and input sanitization
- **Rate Limiter**: Per-IP request throttling with sliding window algorithm

### Development Tools

- **Enhanced Dev Script**: `npm run dev` with CI validation, dual-server management
- **Lightning Testing**: Comprehensive QR code and URI scheme validation
- **Security Testing**: Prompt injection simulation and input validation edge cases
- **CI Integration**: GitHub Actions with mobile asset validation and health checks

## 🎯 Design Principles

### 🛡️ Legal & Ethical
1. **IP-Safe Design**: No direct MGS character names, trademarks, or copyrighted content
2. **Parody Protection**: Clear parody/homage designation under fair use
3. **Original Assets**: All artwork, code, and assets are original or open-source
4. **Transparency**: Open development with full attribution and licensing

### 🎨 User Experience
1. **Authentic Aesthetic**: Captures MGS2 codec feel without legal infringement
2. **Cross-Platform**: Responsive design from mobile to desktop
3. **Performance**: 60fps animations with <16ms render times
4. **Accessibility**: WCAG 2.1 AA compliance with dynamic text and screen reader support

### 🔒 Security & Privacy
1. **Security by Design**: Multi-layer defense against prompt injection and abuse
2. **Privacy First**: No user data collection or persistent storage
3. **Transparent Operations**: Open source with visible security measures
4. **Budget Protection**: Hard spending limits with real-time monitoring

### 🏗️ Technical Excellence
1. **Production Ready**: Comprehensive testing and CI/CD automation
2. **Scalable Architecture**: Modular design supporting future enhancements
3. **Developer Experience**: Enhanced development workflow with comprehensive tooling
4. **Documentation**: Detailed implementation guides and development history

## 🗺️ Development Roadmap

### ✅ Completed (v4.5+)

#### Core Platform
- [x] **Authentic MGS2 Codec UI** - Complete interface with scanlines, CRT effects, animations
- [x] **Cross-Platform Web Deployment** - GitHub Pages with production optimization
- [x] **AI Integration** - OpenAI GPT-4o-mini with streaming responses
- [x] **Four AI Conversation Modes** - JD, BTC, GW, MGS personalities implemented
- [x] **Lightning Network Support** - QR codes with proper `lightning:` URI scheme

#### Production Features  
- [x] **Security Hardening** - Multi-layer prompt injection protection
- [x] **Budget Controls** - Real-time spend tracking with $5/month limits
- [x] **Rate Limiting** - Per-IP throttling (30 req/15min) with graceful degradation
- [x] **Comprehensive CI/CD** - GitHub Actions with security, Lightning, and mobile validation
- [x] **Enhanced Development Workflow** - CI integration, enhanced scripts, Windows support

#### Quality Assurance
- [x] **Comprehensive Testing** - Unit, integration, E2E, and security test suites
- [x] **Mobile Asset Validation** - Automated checks for audio, images, and components
- [x] **Performance Optimization** - Sub-16ms renders, 60fps animations
- [x] **Documentation** - Complete development history and implementation guides

### 🔄 Current Focus (v4.6)

- [ ] **Prompt Validation System** - AI personality integrity monitoring and change detection
- [ ] **Advanced Security Testing** - Comprehensive prompt injection attack simulation
- [ ] **Performance Benchmarking** - Automated performance regression testing
- [ ] **User Analytics** - Privacy-first usage metrics and error tracking

### 🎯 Future Enhancements (v5.0+)

#### Audio & Animation
- [ ] **Text-to-Speech Integration** - AI voice generation with lip-sync animation
- [ ] **Enhanced Audio System** - Spatial audio effects and dynamic music
- [ ] **Advanced Animations** - Portrait emotion detection and reactive expressions

#### Platform Expansion
- [ ] **Native Mobile Apps** - iOS and Android via Expo with device-specific optimizations
- [ ] **Desktop Applications** - Electron-based desktop versions
- [ ] **Progressive Web App** - Offline support and app-like experience

#### Advanced AI Features
- [ ] **Context Awareness** - Conversation memory and user preference learning
- [ ] **Multi-Language Support** - International codec interfaces and AI personalities
- [ ] **Community Features** - Shareable conversation exports and codec customization

## 🌳 Development Branches

ChatLaLiLuLeLo uses a structured branching strategy for parallel development:

### Active Development Branches

- **[Dev-Voice.V1](docs/branch/Dev-Voice.V1.md)** - Colonel Voice Integration (v5 track)
  - TTS pipeline with Web Audio API
  - Voice assets curation and mapping
  - Latency budget: <350ms added to message roundtrip
  - Feature flags: `EXPO_PUBLIC_VOICE_ENABLED`

- **[Dev-QA](docs/branch/Dev-QA.md)** - Continuous QA Improvements
  - Expanded Playwright coverage and visual regression testing
  - Lighthouse CI budgets for performance/PWA/accessibility
  - axe-core accessibility checks and Postman/Newman API testing

### Branch Management

- **main**: Production-ready code with full CI validation
- **Dev-Voice.V1**: Voice feature development with audio smoke tests
- **Dev-QA**: Testing infrastructure expansion with extended CI matrix
- **v4-branch-complete**: Archived v4 development (Lightning Network, Security, CI/CD)

See individual branch documentation for detailed scope, deliverables, and definition of done.

## 🤝 Contributing

### Current Status

ChatLaLiLuLeLo is an **active open-source project** welcoming contributions! The core platform is production-ready with comprehensive CI/CD and testing infrastructure.

### How to Contribute

#### 🐛 Bug Reports
- Use [GitHub Issues](https://github.com/johndtwaldron/ChatLaLiLuLeLo/issues) with detailed reproduction steps
- Include browser/device information and console logs
- Check existing issues to avoid duplicates

#### 💡 Feature Requests
- Propose new AI conversation modes or codec interface enhancements
- Security improvements and performance optimizations
- Cross-platform compatibility and accessibility features

#### 🔧 Development Contributions
1. **Fork the repository** and create a feature branch
2. **Follow the established patterns**: Study existing components and architecture
3. **Maintain security standards**: All user input must pass security validation
4. **Include comprehensive tests**: Unit tests for new features, integration tests for API changes
5. **Update documentation**: Keep README and devlog current with changes

#### 🧪 Testing Contributions
- Lightning Network compatibility testing across mobile wallets
- Security testing including prompt injection and edge case validation
- Cross-browser and device compatibility verification
- Performance benchmarking and optimization

### Development Guidelines

#### Code Standards
- **TypeScript**: Strict typing with comprehensive error handling
- **ESLint**: Zero warnings policy with automated formatting
- **Security First**: All user input validated, no direct OpenAI API exposure
- **Performance**: Maintain <16ms render times and 60fps animations

#### Architectural Principles
- **Local-First Development**: Always get local development working before web deployment
- **Single Source of Truth**: Extend existing systems rather than creating competing architectures
- **Progressive Enhancement**: Build on proven working components
- **Comprehensive Testing**: New features require corresponding test coverage

### Getting Started as a Contributor

```bash
# Set up development environment
git clone https://github.com/johndtwaldron/ChatLaLiLuLeLo.git
cd ChatLaLiLuLeLo
npm ci
npm run dev  # Includes CI validation

# Run full test suite
npm test
npm run test:security
npm run test:lightning
```

Review `docs/devlog.md` for complete development history and architectural decisions.

## ⚖️ Legal & Licensing

### Intellectual Property Compliance

This project maintains strict legal compliance:

- ✅ **No Konami Assets**: Zero use of copyrighted materials, trademarks, or proprietary content
- ✅ **No Character References**: No direct use of Metal Gear Solid character names or likenesses
- ✅ **Original Assets**: All artwork, code, audio, and visual elements are original or open-source
- ✅ **Parody Protection**: Clear parody/homage designation under fair use doctrine
- ✅ **Educational Purpose**: Technical demonstration and nostalgic entertainment

### Open Source Licensing

**MIT License** - See [LICENSE](LICENSE) file for full terms.

**Key permissions:**
- ✅ Commercial use permitted
- ✅ Distribution and modification allowed
- ✅ Private use encouraged
- ✅ Patent use granted

**Requirements:**
- 📄 License and copyright notice must be included
- 🔗 Attribution to original authors required

### Third-Party Dependencies

All dependencies are properly licensed and documented:
- **React Native**: MIT License
- **Expo SDK**: MIT License  
- **OpenAI API**: Commercial API service
- **Cloudflare Workers**: Commercial hosting service
- **TeX Gyre Heros**: GUST Font License (free for any use)

### Fair Use Declaration

Any aesthetic resemblance to existing properties is:
- **Transformative**: Creates new interactive entertainment experience
- **Educational**: Demonstrates web development and AI integration techniques
- **Non-commercial**: Open source project with no monetary gain from resemblance
- **Limited Use**: Only essential elements needed for parody/homage effect

**Legal Status**: ✅ **Compliant** - Full legal review completed, no IP infringement

---

## 🏆 Credits & Acknowledgments

### Core Development Team

**Lead Developer**: [John D. T. Waldron](https://github.com/johndtwaldron) (JDW)  
**Primary AI Partner**: [Warp AI](https://warp.dev) - Claude 4 Sonnet  
**Additional AI Support**: OpenAI GPT-4 for specialized debugging

### Development Journey

**25+ Development Sessions** documented in [`docs/devlog.md`](docs/devlog.md)

**Key Milestones:**
- **Sessions 1-5**: Foundation and proof-of-concept
- **Sessions 6-16**: CI/CD and testing infrastructure  
- **Sessions 17-20**: Production backend and AI integration
- **Sessions 21-25**: Security hardening and deployment optimization

### Technical Acknowledgments

**Open Source Projects:**
- **React Native & Expo**: Cross-platform foundation
- **TeX Gyre Heros**: MGS-authentic typography
- **Cloudflare Workers**: Edge computing infrastructure
- **GitHub**: Repository hosting and CI/CD automation

**AI & API Services:**
- **OpenAI**: GPT-4o-mini for conversation intelligence
- **Tavily**: Optional web search integration

### Community & Inspiration

**Metal Gear Solid Community**: For preserving the codec aesthetic and philosophical depth that inspired this homage

**Web Development Community**: For open-source tools, libraries, and architectural patterns

**Security Research Community**: For prompt injection patterns and defense strategies implemented

### Special Recognition

**Hideo Kojima & Team**: For creating the original Metal Gear Solid series that inspired this parody/homage project

**🎖️ Built with respect, technical excellence, and love for the source material**

---

## 📊 Project Stats

- **🗺️ Development**: September 2025 - October 2025 (25+ sessions)
- **💻 Lines of Code**: 15,000+ across frontend, backend, and tests  
- **🧪 Test Coverage**: 90+ comprehensive test cases
- **🔒 Security**: 15+ prompt injection patterns detected
- **⚡ Performance**: <16ms renders, 60fps animations
- **📱 Compatibility**: Web, iOS, Android ready
- **🌌 Deployment**: Live on GitHub Pages with Cloudflare Workers backend

**Status**: ✅ **Production Ready** - Comprehensive security, testing, and deployment automation
#   W o r k f l o w   t r i g g e r   t e s t   a t   1 0 / 0 9 / 2 0 2 5   1 6 : 1 2 : 3 0  
 