# ChatLaLiLuLeLo v3 Development Guide

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
