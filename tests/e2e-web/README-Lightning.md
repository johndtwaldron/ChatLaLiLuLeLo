# Lightning Network E2E Testing Guide ⚡

This directory contains comprehensive end-to-end tests for Lightning Network integration in ChatLaLiLuLeLo's Bitcoin mode. These tests ensure that Lightning address QR code functionality works correctly across different browsers and environments.

## 🎯 Test Coverage

### Core Functionality
- **Bitcoin Mode Switching**: Validates that Lightning QR appears when switching to Bitcoin mode
- **Lightning QR Rendering**: Tests QR code generation with correct Lightning address
- **Copy Functionality**: Validates clipboard integration for Lightning address copying
- **Mode Transitions**: Ensures Lightning QR disappears when leaving Bitcoin mode

### Advanced Testing
- **Visual Regression**: Screenshot-based validation of QR code appearance
- **Accessibility**: Keyboard navigation and screen reader compatibility
- **Cross-Browser**: Chrome, Firefox, Safari (WebKit) compatibility
- **Mobile Responsive**: Mobile viewport testing for QR display

## 🏗️ Test Architecture

### Files Structure
```
tests/e2e-web/
├── lightning-integration.spec.ts    # Main Lightning E2E test suite
├── lightning.config.ts              # Playwright config for Lightning tests
├── lightning-global-setup.ts        # Global test environment setup
└── README-Lightning.md              # This documentation
```

### Configuration Files
- **Lightning Config**: Specialized Playwright configuration optimized for Lightning tests
- **Global Setup**: Pre-test validation of Lightning functionality
- **Test Runner**: Custom Node.js script for running Lightning tests

## 🚀 Running Tests

### Local Development
```bash
# Run all Lightning E2E tests
npm run e2e:lightning

# Run with browser UI visible
npm run e2e:lightning:headed

# Run only Chrome tests
npm run e2e:lightning:chrome

# Manual execution with custom options
node scripts/test-lightning-e2e.js --browser firefox --headed --verbose
```

### Available Options
- `--browser <name>`: Target specific browser (chromium, firefox, webkit, all)
- `--headed`: Run tests with visible browser window
- `--workers <number>`: Set parallel worker count
- `--retries <number>`: Set retry count for failed tests
- `--timeout <ms>`: Set test timeout in milliseconds
- `--verbose`: Enable detailed logging

## 🔧 Test Configuration

### Lightning Address
Tests use the production Lightning address: `johndtwaldron@strike.me`

### Server Requirements
- Frontend: `http://localhost:14085` (Expo web server)
- Backend: `http://localhost:3001` (API server)

### Browser Support
- **Chromium**: Latest stable
- **Firefox**: Latest stable  
- **WebKit**: Latest stable (Safari engine)
- **Mobile**: Chrome Mobile, Safari Mobile viewports

## 📊 CI/CD Integration

### GitHub Actions Workflow
Lightning E2E tests run automatically on:
- Push to `main`, `develop`, or `develop-v4` branches
- Pull requests affecting Lightning-related files
- Manual workflow dispatch

### Trigger Paths
Tests trigger when these files change:
- `apps/mobile/src/components/ui/LightningQR.tsx`
- `apps/mobile/src/lib/lightning.ts`
- `apps/mobile/src/config/lightning.ts`
- `tests/e2e-web/lightning-*.spec.ts`
- Lightning test configuration files

### Artifacts
CI uploads these artifacts on test completion:
- Test results (HTML reports, JSON, JUnit XML)
- Screenshots (on failure)
- Videos (on failure)
- Playwright traces (for debugging)

## 🐛 Troubleshooting

### Common Issues

#### QR Code Not Rendering
```bash
# Check Lightning configuration
node -e "
const config = require('./apps/mobile/src/config/lightning.ts');
console.log('Lightning config:', config);
"

# Validate test utilities
node -e "
const utils = require('./tests/utils/lightning-test-utils');
console.log('Utils loaded:', Object.keys(utils));
"
```

#### Mode Switching Fails
- Ensure codec interface loads completely before mode switching
- Check for startup screens that need activation
- Verify MODE button selectors match current UI

#### Clipboard Tests Failing
- Grant clipboard permissions in test setup
- Use headless mode cautiously (clipboard may not work)
- Check browser security policies for clipboard access

#### Server Connectivity Issues
```bash
# Check server status
curl -f http://localhost:14085
curl -f http://localhost:3001/health

# Start servers manually if needed
cd apps/mobile && npm run start:web
```

### Debug Mode
```bash
# Run with debug output
DEBUG=pw:* npm run e2e:lightning

# Generate traces for failed tests
npm run e2e:lightning -- --trace on-first-retry
```

## 📈 Test Reporting

### HTML Reports
Located at: `tests/e2e-web/reports/lightning/index.html`

### JSON Results
Machine-readable results: `tests/e2e-web/reports/lightning-results.json`

### JUnit XML
CI integration: `tests/e2e-web/reports/lightning-results.xml`

## 🔒 Security Considerations

### Lightning Address Validation
- Tests validate proper Lightning address format
- QR code contains exactly the expected address
- No sensitive information leakage in test outputs

### Clipboard Security
- Tests use controlled clipboard operations
- No persistent clipboard data after tests
- Proper permission handling across browsers

## 🎨 Visual Testing

### Screenshot Comparison
- Baseline images stored in test repository
- Threshold of 0.3 allows for minor QR variations
- Separate screenshots for component and full interface

### Mobile Viewport Testing
- Pixel 5 (Android) viewport simulation
- iPhone 12 (iOS) viewport simulation
- Responsive QR code display validation

## 🤝 Contributing

### Adding New Tests
1. Follow existing test patterns in `lightning-integration.spec.ts`
2. Use the `switchToBitcoinMode()` helper function
3. Add proper test descriptions and comments
4. Update this README if adding new test categories

### Test Data Management
- Lightning address: Use production address for consistency
- Mock data: Available in `tests/utils/lightning-test-utils.js`
- Test fixtures: Store in `tests/fixtures/` if needed

### Best Practices
- Use data-testid attributes for reliable element selection
- Include proper timeout handling for async operations
- Add accessibility checks for new UI components
- Maintain cross-browser compatibility

## 📝 Test Scenarios

### Happy Path
1. Load application → Switch to Bitcoin mode → Verify QR appears → Copy address → Verify clipboard

### Edge Cases
- Fast mode switching
- Network connectivity issues
- Clipboard permission denied
- Mobile orientation changes
- Theme changes during Bitcoin mode

### Error Handling
- Invalid Lightning configuration
- QR generation failures
- Server unavailability
- Browser compatibility issues

---

**⚡ Lightning Network E2E Testing** - Ensuring robust Bitcoin donation functionality for ChatLaLiLuLeLo development support.
