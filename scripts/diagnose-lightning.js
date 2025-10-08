#!/usr/bin/env node

/**
 * Lightning Network Test Diagnostics
 * 
 * Comprehensive diagnostic script that works in both Windows PowerShell and Linux environments
 * to validate Lightning Network components before CI runs.
 * 
 * Usage:
 *   node scripts/diagnose-lightning.js [--verbose] [--fix] [--ci-mode]
 * 
 * Options:
 *   --verbose    Show detailed output
 *   --fix        Attempt to fix common issues automatically
 *   --ci-mode    Run in CI-compatible mode (no colors, structured output)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const FIX_MODE = args.includes('--fix');
const CI_MODE = args.includes('--ci-mode') || process.env.CI === 'true';

// Colors for output (disabled in CI mode)
const colors = CI_MODE ? {
  red: '', green: '', yellow: '', blue: '', cyan: '', reset: '', bold: ''
} : {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Diagnostic results
const results = {
  passed: [],
  failed: [],
  warnings: [],
  fixed: []
};

function log(message, type = 'info') {
  const prefix = CI_MODE ? `[${type.toUpperCase()}]` : '';
  const color = colors[type] || '';
  console.log(`${color}${prefix} ${message}${colors.reset}`);
}

function logVerbose(message) {
  if (VERBOSE) {
    log(`  ${message}`, 'cyan');
  }
}

function checkPassed(message, details = '') {
  results.passed.push({ message, details });
  log(`✅ ${message}`, 'green');
  if (details && VERBOSE) logVerbose(details);
}

function checkFailed(message, details = '', fixable = false) {
  results.failed.push({ message, details, fixable });
  log(`❌ ${message}`, 'red');
  if (details) logVerbose(`Details: ${details}`);
  if (fixable) logVerbose(`Fix available: run with --fix flag`);
}

function checkWarning(message, details = '') {
  results.warnings.push({ message, details });
  log(`⚠️ ${message}`, 'yellow');
  if (details && VERBOSE) logVerbose(details);
}

function checkFixed(message, details = '') {
  results.fixed.push({ message, details });
  log(`🔧 Fixed: ${message}`, 'green');
  if (details) logVerbose(details);
}

// File existence checks
const REQUIRED_FILES = [
  {
    path: 'apps/mobile/src/lib/bitcoin.ts',
    description: 'Bitcoin utilities library',
    template: `// Bitcoin utilities for ChatLaLiLuLeLo
// Basic Bitcoin address validation and utilities

export interface BitcoinAddress {
  address: string;
  type: 'legacy' | 'segwit' | 'native_segwit';
  network: 'mainnet' | 'testnet';
}

/**
 * Validates a Bitcoin address format
 * Supports legacy (1...), segwit (3...), and native segwit (bc1...) addresses
 */
export function validateBitcoinAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Basic Bitcoin address patterns
  const patterns = {
    legacy: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    segwit: /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    native_segwit: /^(bc1|tb1)[a-zA-HJ-NP-Z0-9]{25,62}$/
  };

  return Object.values(patterns).some(pattern => pattern.test(address));
}

/**
 * Determines the type of Bitcoin address
 */
export function getBitcoinAddressType(address: string): BitcoinAddress['type'] | null {
  if (!validateBitcoinAddress(address)) {
    return null;
  }

  if (address.startsWith('1')) return 'legacy';
  if (address.startsWith('3')) return 'segwit';
  if (address.startsWith('bc1') || address.startsWith('tb1')) return 'native_segwit';
  
  return null;
}

/**
 * Test Bitcoin address for demonstrations
 */
export const TEST_BITCOIN_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

export default {
  validateBitcoinAddress,
  getBitcoinAddressType,
  TEST_BITCOIN_ADDRESS
};
`
  },
  {
    path: 'apps/mobile/src/lib/lightning.ts',
    description: 'Lightning Network utilities library',
    template: `// Lightning Network utilities for ChatLaLiLuLeLo
// Lightning address validation and QR code data generation

export interface LightningAddress {
  address: string;
  domain: string;
  username: string;
  valid: boolean;
}

/**
 * Validates a Lightning address format (user@domain.com)
 * Following LNURL-pay specification for Lightning addresses
 */
export function validateLightningAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Basic email-like format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(address)) {
    return false;
  }

  // Additional Lightning address specific validations
  const parts = address.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [username, domain] = parts;
  
  // Username validations
  if (username.length === 0 || username.length > 64) {
    return false;
  }

  // Domain validations
  if (domain.length === 0 || domain.length > 253) {
    return false;
  }

  return true;
}

/**
 * Parses a Lightning address into components
 */
export function parseLightningAddress(address: string): LightningAddress | null {
  if (!validateLightningAddress(address)) {
    return null;
  }

  const [username, domain] = address.split('@');
  
  return {
    address,
    domain,
    username,
    valid: true
  };
}

/**
 * Generates QR code data for Lightning address
 * Returns the lightning: URI scheme format
 */
export function generateLightningQRData(address: string): string | null {
  if (!validateLightningAddress(address)) {
    return null;
  }

  // Lightning URI scheme: lightning:address
  return \`lightning:\${address}\`;
}

/**
 * Test Lightning address for demonstrations
 * This is a real Lightning address that can be used for testing
 */
export const TEST_LIGHTNING_ADDRESS = 'johndtwaldron@strike.me';

export default {
  validateLightningAddress,
  parseLightningAddress,
  generateLightningQRData,
  TEST_LIGHTNING_ADDRESS
};
`
  },
  {
    path: 'apps/mobile/src/config/lightning.ts',
    description: 'Lightning Network configuration',
    template: `// Lightning Network configuration for ChatLaLiLuLeLo

export const LIGHTNING_CONFIG = {
  // Default Lightning address for the application
  defaultAddress: 'johndtwaldron@strike.me',
  
  // QR code configuration
  qrCode: {
    size: 256,
    margin: 2,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: 'M' as const
  },
  
  // Network timeouts and retries
  network: {
    timeoutMs: 10000,
    retries: 3,
    retryDelayMs: 1000
  },
  
  // Validation settings
  validation: {
    maxAddressLength: 320, // Max email length per RFC 5321
    minAddressLength: 6,   // Minimum a@b.co
    allowedDomains: [], // Empty = allow all domains
    blockedDomains: ['example.com', 'test.com'] // Common test domains
  },
  
  // Feature flags
  features: {
    enableQRGeneration: true,
    enableAddressValidation: true,
    enableCopyToClipboard: true,
    enableVisualFeedback: true
  }
};

export default LIGHTNING_CONFIG;
`
  },
  {
    path: 'tests/utils/lightning-test-utils.js',
    description: 'Lightning Network test utilities',
    template: `// Lightning Network Test Utilities
// Common utilities for testing Lightning Network functionality

/**
 * Validates a Lightning address format
 * @param {string} address - Lightning address to validate
 * @returns {boolean} - Whether the address is valid
 */
function validateLightningAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Basic email-like format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(address)) {
    return false;
  }

  const parts = address.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [username, domain] = parts;
  
  // Username validations
  if (username.length === 0 || username.length > 64) {
    return false;
  }

  // Domain validations  
  if (domain.length === 0 || domain.length > 253) {
    return false;
  }

  return true;
}

/**
 * Generates QR code data for Lightning address
 * @param {string} address - Lightning address
 * @returns {string|null} - QR code data or null if invalid
 */
function generateQRData(address) {
  if (!validateLightningAddress(address)) {
    return null;
  }

  return \`lightning:\${address}\`;
}

/**
 * Test data for Lightning Network tests
 */
const TEST_DATA = {
  validAddresses: [
    'johndtwaldron@strike.me',
    'test@wallet.of.satoshi.com',
    'user@lightning.page',
    'demo@zbd.gg'
  ],
  
  invalidAddresses: [
    '',
    'invalid',
    'no-at-sign.com',
    '@missingusername.com',
    'missingdomain@',
    'spaces in@address.com',
    'toolongusernamethatexceedsmaximumlengthfortestingpurposes@domain.com'
  ],
  
  expectedQRData: {
    'johndtwaldron@strike.me': 'lightning:johndtwaldron@strike.me',
    'test@wallet.of.satoshi.com': 'lightning:test@wallet.of.satoshi.com'
  }
};

module.exports = {
  validateLightningAddress,
  generateQRData,
  TEST_DATA
};
`
  }
];

function checkFileExistence() {
  log('\n🔍 Checking required Lightning files...', 'blue');
  
  for (const file of REQUIRED_FILES) {
    const fullPath = path.resolve(file.path);
    
    if (fs.existsSync(fullPath)) {
      checkPassed(`${file.description} exists`, file.path);
      
      // Check file content
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.trim().length === 0) {
        checkWarning(`${file.description} is empty`, file.path);
      } else {
        logVerbose(`File size: ${content.length} bytes`);
      }
    } else {
      checkFailed(`${file.description} missing`, file.path, true);
      
      if (FIX_MODE) {
        try {
          // Ensure directory exists
          const dir = path.dirname(fullPath);
          fs.mkdirSync(dir, { recursive: true });
          
          // Write template content
          fs.writeFileSync(fullPath, file.template);
          checkFixed(`Created ${file.description}`, file.path);
        } catch (error) {
          log(`Failed to create ${file.path}: ${error.message}`, 'red');
        }
      }
    }
  }
}

function checkEnvironment() {
  log('\n🌍 Checking environment...', 'blue');
  
  // Node.js version
  const nodeVersion = process.version;
  checkPassed(`Node.js version: ${nodeVersion}`);
  
  // Operating system
  const platform = os.platform();
  const isWindows = platform === 'win32';
  checkPassed(`Platform: ${platform} ${isWindows ? '(Windows)' : '(Unix-like)'}`);
  
  // PowerShell detection (Windows)
  if (isWindows && process.env.PSModulePath) {
    checkPassed('PowerShell environment detected');
    logVerbose(`PSModulePath: ${process.env.PSModulePath.split(';')[0]}...`);
  }
  
  // CI environment
  if (process.env.CI) {
    checkPassed(`CI environment: ${process.env.CI}`);
    if (process.env.GITHUB_ACTIONS) {
      logVerbose('GitHub Actions detected');
    }
  } else {
    checkPassed('Local development environment');
  }
  
  // Working directory
  const cwd = process.cwd();
  checkPassed(`Working directory: ${cwd}`);
  
  // Check if in project root
  const packageJsonExists = fs.existsSync(path.join(cwd, 'package.json'));
  if (packageJsonExists) {
    checkPassed('Project root detected (package.json found)');
  } else {
    checkWarning('Not in project root (no package.json found)');
  }
}

function checkDependencies() {
  log('\n📦 Checking dependencies...', 'blue');
  
  const packagePaths = [
    'package.json',
    'apps/mobile/package.json',
    'apps/edge/package.json'
  ];
  
  for (const packagePath of packagePaths) {
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        checkPassed(`${packagePath} found`);
        logVerbose(`Name: ${pkg.name || 'Unknown'}, Version: ${pkg.version || 'Unknown'}`);
        
        // Check for Lightning-related dependencies
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        const lightningDeps = Object.keys(allDeps).filter(dep => 
          dep.includes('qr') || dep.includes('bitcoin') || dep.includes('lightning')
        );
        
        if (lightningDeps.length > 0) {
          logVerbose(`Lightning-related deps: ${lightningDeps.join(', ')}`);
        }
      } catch (error) {
        checkFailed(`Invalid JSON in ${packagePath}`, error.message);
      }
    } else {
      checkWarning(`${packagePath} not found`);
    }
  }
}

function checkTestStructure() {
  log('\n🧪 Checking test structure...', 'blue');
  
  const testDirs = [
    'tests',
    'tests/utils',
    'tests/e2e-web',
    'scripts'
  ];
  
  for (const dir of testDirs) {
    if (fs.existsSync(dir)) {
      checkPassed(`${dir} directory exists`);
      
      // List files in directory
      try {
        const files = fs.readdirSync(dir);
        logVerbose(`Files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
      } catch (error) {
        checkWarning(`Cannot read ${dir}: ${error.message}`);
      }
    } else {
      checkFailed(`${dir} directory missing`, '', true);
      
      if (FIX_MODE) {
        try {
          fs.mkdirSync(dir, { recursive: true });
          checkFixed(`Created ${dir} directory`);
        } catch (error) {
          log(`Failed to create ${dir}: ${error.message}`, 'red');
        }
      }
    }
  }
  
  // Check for specific test files
  const testFiles = [
    'tests/e2e-web/lightning-qr.spec.ts',
    'scripts/test-lightning-e2e.js',
    'scripts/test-lightning-fixes.js'
  ];
  
  for (const file of testFiles) {
    if (fs.existsSync(file)) {
      checkPassed(`${file} exists`);
    } else {
      checkWarning(`${file} not found (may be created later)`);
    }
  }
}

function runLightningValidation() {
  log('\n⚡ Running Lightning validation tests...', 'blue');
  
  try {
    // Test the validation functions if files exist
    const testUtilsPath = path.resolve('tests/utils/lightning-test-utils.js');
    
    if (fs.existsSync(testUtilsPath)) {
      // Temporarily require and test the utilities
      delete require.cache[testUtilsPath]; // Clear cache
      const { validateLightningAddress, generateQRData, TEST_DATA } = require(testUtilsPath);
      
      // Test valid addresses
      let passed = 0;
      let failed = 0;
      
      for (const address of TEST_DATA.validAddresses) {
        try {
          const isValid = validateLightningAddress(address);
          if (isValid) {
            passed++;
            logVerbose(`✓ Valid: ${address}`);
          } else {
            failed++;
            logVerbose(`✗ Should be valid: ${address}`);
          }
        } catch (error) {
          failed++;
          logVerbose(`✗ Error testing ${address}: ${error.message}`);
        }
      }
      
      // Test invalid addresses
      for (const address of TEST_DATA.invalidAddresses) {
        try {
          const isValid = validateLightningAddress(address);
          if (!isValid) {
            passed++;
            logVerbose(`✓ Invalid: ${address}`);
          } else {
            failed++;
            logVerbose(`✗ Should be invalid: ${address}`);
          }
        } catch (error) {
          failed++;
          logVerbose(`✗ Error testing ${address}: ${error.message}`);
        }
      }
      
      // Test QR generation
      for (const [address, expected] of Object.entries(TEST_DATA.expectedQRData)) {
        try {
          const qrData = generateQRData(address);
          if (qrData === expected) {
            passed++;
            logVerbose(`✓ QR data: ${address} → ${qrData}`);
          } else {
            failed++;
            logVerbose(`✗ QR data mismatch: ${address} → expected ${expected}, got ${qrData}`);
          }
        } catch (error) {
          failed++;
          logVerbose(`✗ Error generating QR for ${address}: ${error.message}`);
        }
      }
      
      if (failed === 0) {
        checkPassed(`Lightning validation tests passed (${passed} tests)`);
      } else {
        checkFailed(`Lightning validation tests failed (${failed}/${passed + failed} failures)`);
      }
    } else {
      checkWarning('Lightning test utilities not available for validation');
    }
  } catch (error) {
    checkFailed('Lightning validation test failed', error.message);
  }
}

function generateReport() {
  log('\n📊 Diagnostic Summary', 'bold');
  log('='.repeat(50));
  
  log(`✅ Passed: ${results.passed.length}`, 'green');
  log(`❌ Failed: ${results.failed.length}`, 'red');
  log(`⚠️ Warnings: ${results.warnings.length}`, 'yellow');
  if (results.fixed.length > 0) {
    log(`🔧 Fixed: ${results.fixed.length}`, 'green');
  }
  
  if (results.failed.length > 0) {
    log('\n❌ Failed Checks:', 'red');
    results.failed.forEach((item, i) => {
      log(`  ${i + 1}. ${item.message}`);
      if (item.details) logVerbose(`     ${item.details}`);
      if (item.fixable) logVerbose(`     Run with --fix to attempt automatic fix`);
    });
  }
  
  if (results.warnings.length > 0) {
    log('\n⚠️ Warnings:', 'yellow');
    results.warnings.forEach((item, i) => {
      log(`  ${i + 1}. ${item.message}`);
      if (item.details) logVerbose(`     ${item.details}`);
    });
  }
  
  // Environment-specific recommendations
  log('\n💡 Recommendations:', 'cyan');
  
  if (os.platform() === 'win32') {
    log('  • For Windows: Use PowerShell or WSL for better Linux compatibility');
    log('  • Install Git Bash for Unix-like commands if needed');
  }
  
  if (results.failed.length > 0) {
    log('  • Run with --fix to automatically create missing files');
    log('  • Use --verbose for detailed output');
  }
  
  log('  • Run this diagnostic before pushing to catch CI issues early');
  log('  • Check the Tests_of_the_LaLiLuLeLo.md documentation for more details');
  
  // Exit code
  const exitCode = results.failed.length > 0 ? 1 : 0;
  if (exitCode === 0) {
    log('\n🎉 All diagnostics passed! Ready for CI.', 'green');
  } else {
    log('\n💥 Some diagnostics failed. Fix issues before pushing.', 'red');
  }
  
  return exitCode;
}

// Main execution
async function main() {
  log('⚡ Lightning Network Diagnostics', 'bold');
  log(`Environment: ${os.platform()} | Node: ${process.version}`);
  log(`Arguments: ${args.join(' ') || 'none'}`);
  log('');
  
  // Run all diagnostic checks
  checkEnvironment();
  checkFileExistence();
  checkDependencies();
  checkTestStructure();
  runLightningValidation();
  
  // Generate final report
  const exitCode = generateReport();
  process.exit(exitCode);
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'red');
  logVerbose(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, checkFileExistence, checkEnvironment };
