# ChatLaLiLuLeLo v4 Development Guide

> **📂 Workspace Location:** This project has been migrated to external drive (`F:\JDW (diskF-Samsung)-PoW\ChatLaLiLuLeLo.JDW`) for better disk space management and V4.5 QA testing requirements.

## 🚀 Quick Start

### Enhanced Development (Recommended)
```bash
npm run dev
```
**What it does:**
- ✅ **Phase 1**: CI validation (structure, dependencies, API keys)
- ✅ **Phase 2**: Code linting (ESLint)
- ✅ **Phase 3**: TypeScript compilation check  
- ✅ **Phase 4**: Start development servers (only if all checks pass)
- 📝 **Logs**: Creates `debug/terminal.outputs/dev.debug.<timestamp>.txt`

### Direct Development (Skip Validation)
```bash
npm run prod
```
**What it does:**
- Directly starts backend (port 8787) and frontend (port 8082)
- No validation checks - faster startup but may run with issues

### Standalone CI Check
```bash
npm run ci-check
```
**What it does:**
- Runs all validation checks without starting servers
- Perfect for quick validation before committing

## 📋 Available Commands

| Command | Purpose | Use Case |
|---------|---------|----------|
| `npm run dev` | **Enhanced development** | Daily development with validation |
| `npm run prod` | **Direct development** | Quick testing, debugging server issues |
| `npm run ci-check` | **Validation only** | Pre-commit checks, troubleshooting |
| `npm run typecheck` | **TypeScript check** | Type validation only |
| `npm run lint` | **Code linting** | Code quality checks |
| `npm run lint:fix` | **Auto-fix linting** | Fix auto-fixable linting issues |
| `npm run test` | **Run tests** | Unit testing |
| `npm run build-launcher` | **Build desktop launcher** | Create executable launcher for Windows |

## 🔧 Local CI Tests

### Windows (PowerShell)
```powershell
.\test-local.ps1
```

### Cross-Platform (Node.js)
```bash
node scripts/test-ci.js
```

**Validation Checklist:**
- ✅ Project structure integrity
- ✅ TypeScript compilation
- ✅ API key configuration (if .dev.vars exists)
- ✅ Dependency versions (Wrangler, Expo, Node.js)
- ⚠️ Outdated dependency warnings

## 🐛 Debug Logging

### Debug Files Location
```
debug/terminal.outputs/
├── dev.debug.2025-10-02T11-22-34.txt
├── debug.1.txt  
└── debug.2.txt
```

### What Gets Logged
- All validation phase results
- Error messages and stack traces
- Dependency version information  
- Server startup and shutdown events
- Timestamps for all events

## 🚨 Common Issues & Solutions

### ❌ "CI validation failed"
**Solution:** Run `npm run ci-check` to see detailed error messages

### ❌ "Linting failed"
**Solutions:**
```bash
npm run lint          # See linting errors
npm run lint:fix      # Auto-fix many issues (recommended!)
```

### ❌ "TypeScript validation failed"
**Solutions:**
```bash
npm run typecheck     # See type errors
# Fix type issues manually
```

### ❌ "Wrangler v3.x is outdated"
**Solution:**
```bash
cd apps/edge
npm install --save-dev wrangler@4
```

### 🔧 Skip Validation (Emergency)
If you need to develop despite validation failures:
```bash
npm run prod  # Bypasses all checks
```

## 🖥️ Desktop Launcher

### Building the Launcher
```bash
npm run build-launcher
```
**What it does:**
- Creates `ChatLaLiLuLeLo-Launcher.exe` in the project root
- Provides MGS2 codec-themed dependency checking
- Verifies Node.js and npm are installed before startup
- Designed for easy distribution to other developers

### Using the Launcher
- **Double-click** `ChatLaLiLuLeLo-Launcher.exe` to run
- **MGS2-themed output** with color-coded status messages
- **Dependency validation** before attempting to start servers
- **Browser launch** (when not in skip mode)

**Features:**
- ✅ Node.js version detection
- ✅ npm version verification  
- ✅ Project structure validation
- 🎨 MGS2 codec communication styling
- 📦 Standalone executable (no PowerShell knowledge required)

### Rebuilding the Launcher
The `npm run build-launcher` command automatically **overwrites** the previous `.exe` file, so you always get a fresh build with the latest launcher script changes.

## 🌐 GitHub Actions CI

The repository includes comprehensive GitHub Actions CI that:
- Runs the same validation checks as local CI
- Tests on Node.js 18.x and 20.x
- Includes security scanning and build validation
- Stores debug logs as artifacts (when enabled)

**GitHub Actions Integration:**
- Our local `scripts/test-ci.js` runs in the GitHub Actions workflow
- No `.dev.vars` file needed in CI (API key checks are skipped)
- Same validation logic ensures consistency between local and CI environments

## 📚 Next Steps

1. **Start Development**: `npm run dev`
2. **Check Current Status**: `npm run ci-check`  
3. **Review Debug Logs**: Check `debug/terminal.outputs/` for detailed logs
4. **Fix Any Issues**: Use the troubleshooting guide above
5. **Commit Changes**: All validation passes ensure clean commits

---

## 🎯 Development Philosophy

**"Fail Fast, Fix Fast"** - Our enhanced workflow catches issues before server startup, saving development time and preventing broken development environments.

**Validation Phases:**
1. **Structure** → Ensure project integrity  
2. **Linting** → Maintain code quality
3. **Types** → Catch compile-time errors
4. **Servers** → Only start when everything is valid

Happy coding! 🚀

---

## 🔒 V4 Security Enhancements

### Web Deployment Security

**🛡️ Multi-Layer Security Hardening Implemented:**

#### Security Headers
- **Content Security Policy (CSP)**: Prevents XSS attacks with strict resource controls
- **X-Frame-Options**: DENY - Prevents clickjacking attacks
- **X-Content-Type-Options**: nosniff - Prevents MIME-type confusion attacks
- **X-XSS-Protection**: Enables browser XSS filtering
- **Referrer-Policy**: strict-origin-when-cross-origin - Controls referrer information
- **Permissions-Policy**: Restricts access to sensitive APIs (geolocation, camera, etc.)

#### GitHub Pages Optimization
- **Asset Path Fixing**: Converts absolute paths to relative for proper loading
- **SPA Routing Support**: 404.html fallback for single-page application routing
- **Runtime API Configuration**: Dynamic API URL injection for environment flexibility
- **Page Title Enhancement**: Updated to "140.85 — ChatLaLiLuLeLo" for thematic consistency

#### CI/CD Pipeline
- **Automated Security Headers**: Injected during build process
- **Asset Verification**: Automatic checking of audio/image assets
- **Build Validation**: Comprehensive testing before deployment
- **GitHub Actions Integration**: Fully automated deployment to GitHub Pages

### Web Export Commands

```bash
# Development export
cd apps/mobile
npm run export:web

# Production deployment (GitHub Pages)
# Automatically triggered on push to develop-v4 branch
```

### Security Features Verification

After deployment, you can verify security headers are active by:
1. **Browser DevTools**: Check Network tab for response headers
2. **Security Testing Tools**: Use online header scanners
3. **Console Inspection**: No CSP violations should appear

**Archive Tags Available:**
- `v2-archive` → v2 final state
- `v3-archive` → v3 final state  
- `v4-005-security-hardening-complete` → v4 security implementation

### Branch Strategy
- **develop-v4** → Active development branch
- **main** → Production branch with all features
- **GitHub Pages** → Auto-deployed from develop-v4

## ☁️ Cloudflare Workers Deployment

### Manual Deployment Commands

```bash
# Deploy to development environment (default)
npm run deploy

# Deploy to production environment
npm run deploy:production

# Deploy to staging environment
npm run deploy:staging
```

### Automatic CI/CD Deployment

Cloudflare Workers automatically deploys from the `develop-v4` branch:
- **Trigger**: Push to `develop-v4`
- **Environment**: Production (`chatlalilulelo-backend-prod`)
- **URL**: https://chatlalilulelo-backend.chatlalilulelo.workers.dev

### Backend API Endpoints

- **Health Check**: `GET /health` - Service status and configuration
- **Budget Status**: `GET /budget?sessionId=<id>` - Usage statistics and limits
- **Chat API**: `POST /chat` - Main chat interaction endpoint

### Environment Variables (Secrets)

Required secrets (set via Cloudflare dashboard or `wrangler secret put`):
- `OPENAI_API_KEY` - OpenAI API access (required)
- `OPENAI_MODEL` - Model to use (optional, defaults to gpt-4o-mini)
- `TAVILY_API_KEY` - Search functionality (optional)
- `CORS_ORIGINS` - Additional allowed origins (optional)

## 🧪 V4.5 QA Testing Framework

### Comprehensive Testing Suite

V4.5 introduces a comprehensive QA-focused testing framework with multiple test types:

#### Asset Verification Tests
```bash
# Run asset verification tests (mobile)
cd apps/mobile
npm test -- --testPathPattern=assets.test.ts
```

**What it tests:**
- ✅ **32 comprehensive tests** for audio and image assets
- ✅ Asset availability, size limits, format validation
- ✅ Performance testing for concurrent loading
- ✅ Bundle size verification (<3MB as per V4 plan)
- ✅ Build process and deployment verification
- ✅ Asset path resolution for different environments

#### API Smoke Tests
```bash
# Run API smoke tests against live Cloudflare Workers
cd apps/edge
npm run test:api                    # Production API
npm run test:api:staging            # Staging API
```

**What it tests:**
- ✅ **21 comprehensive API tests** for all endpoints
- ✅ Health, budget, and chat endpoint validation
- ✅ CORS, security headers, performance testing
- ✅ Rate limiting and error handling verification
- ✅ **20/21 tests passing** - identified improvement opportunity

#### Local Environment Validation
```bash
# Comprehensive local CI check
.\test-local.ps1
```

**What it validates:**
- ✅ Project structure integrity
- ✅ TypeScript compilation
- ✅ Dependencies and versions
- ✅ Backend configuration
- ✅ Environment setup

### Test Coverage Status

| Test Type | Status | Coverage | Notes |
|-----------|--------|----------|---------|
| **Asset Verification** | ✅ Complete | 32 tests | Full asset pipeline testing |
| **API Smoke Tests** | ✅ Complete | 21 tests | Live API endpoint validation |
| **Security Hardening** | 🚧 In Progress | - | CSP, input validation tests |
| **Unit Tests** | 🚧 In Progress | - | React Native components |
| **E2E Tests** | 🚧 Planned | - | Playwright integration |
| **CI/CD Enhancements** | 🚧 Planned | - | Coverage reporting |

### Testing Best Practices

#### Running All Tests
```bash
# Full test suite
npm test                           # Mobile tests
cd apps/edge && npm run test:api   # API tests
.\test-local.ps1                  # Local environment
```

#### Debugging Test Failures
```bash
# Verbose test output
npm test -- --verbose

# Run specific test file
npm test -- --testPathPattern=assets.test.ts

# Debug API tests with different endpoints
API_BASE_URL=http://localhost:8787 npm run test:api
```
