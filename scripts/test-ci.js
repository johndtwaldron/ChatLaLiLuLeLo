#!/usr/bin/env node

/**
 * ChatLaLiLuLeLo CI Test Script
 * Cross-platform version for GitHub Actions and local development
 * Tests project structure, dependencies, compilation, and configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  gray: '\x1b[37m',
  reset: '\x1b[0m'
};

// Helper function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to run commands safely
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

// Main CI test function
async function runCITests() {
  log('Starting ChatLaLiLuLeLo CI Test...', 'cyan');
  let hasErrors = false;

  try {
    // 1. Check project structure
    log('\nChecking project structure...', 'yellow');
    
    const requiredPaths = [
      'apps/mobile/package.json',
      'apps/edge/package.json',
      'apps/edge/.dev.vars',
      'apps/mobile/src/features/chat/ChatScreen.tsx'
    ];

    for (const filepath of requiredPaths) {
      if (fs.existsSync(filepath)) {
        log(`OK ${filepath} exists`, 'green');
      } else {
        log(`ERROR ${filepath} missing`, 'red');
        hasErrors = true;
      }
    }

    // 2. TypeScript compilation check
    log('\nRunning TypeScript check...', 'yellow');
    process.chdir('apps/mobile');
    
    const typecheck = runCommand('npm run typecheck', { silent: true });
    if (typecheck.success) {
      log('OK TypeScript compilation passed', 'green');
    } else {
      log('ERROR TypeScript compilation failed', 'red');
      log(typecheck.error || typecheck.output, 'red');
      hasErrors = true;
    }
    
    process.chdir('../../'); // Back to root

    // 3. Check backend API keys (only if .dev.vars exists)
    log('\nChecking backend configuration...', 'yellow');
    
    if (fs.existsSync('apps/edge/.dev.vars')) {
      const devVars = fs.readFileSync('apps/edge/.dev.vars', 'utf8');
      if (devVars.includes('OPENAI_API_KEY=sk-')) {
        log('OK OpenAI API key configured', 'green');
      } else {
        log('ERROR OpenAI API key not found or invalid', 'red');
        hasErrors = true;
      }
    } else {
      log('WARNING .dev.vars not found - API keys not configured', 'yellow');
    }

    // 4. Check critical dependency versions
    log('\nChecking dependency versions...', 'yellow');
    
    // Check wrangler version
    try {
      const edgePackage = JSON.parse(fs.readFileSync('apps/edge/package.json', 'utf8'));
      const wranglerVersion = edgePackage.devDependencies?.wrangler;
      
      if (wranglerVersion) {
        log(`   Wrangler: ${wranglerVersion}`, 'gray');
        
        const majorVersionMatch = wranglerVersion.match(/\^?(\d+)\./);
        if (majorVersionMatch && majorVersionMatch[1] === '3') {
          log('   WARNING: Wrangler v3.x is outdated. Update to v4.x recommended.', 'yellow');
          log('   Run: npm install --save-dev wrangler@4', 'gray');
        } else {
          log('   OK: Wrangler version looks current', 'green');
        }
      }
    } catch (error) {
      log('   WARNING: Could not check wrangler version', 'yellow');
    }

    // Check expo version
    try {
      const mobilePackage = JSON.parse(fs.readFileSync('apps/mobile/package.json', 'utf8'));
      const expoVersion = mobilePackage.devDependencies?.expo;
      
      if (expoVersion) {
        log(`   Expo: ${expoVersion}`, 'gray');
        
        const majorVersionMatch = expoVersion.match(/\^?(\d+)/);
        if (majorVersionMatch && parseInt(majorVersionMatch[1]) < 54) {
          log('   WARNING: Expo version may be outdated', 'yellow');
        }
      }
    } catch (error) {
      log('   WARNING: Could not check expo version', 'yellow');
    }

    // Check Node.js version
    try {
      const nodeVersion = process.version;
      log(`   Node.js: ${nodeVersion}`, 'gray');
      
      const majorVersion = parseInt(nodeVersion.substring(1));
      if (majorVersion < 18) {
        log(`   WARNING: Node.js ${nodeVersion} may be too old. v18+ recommended.`, 'yellow');
      }
    } catch (error) {
      log('   WARNING: Could not check Node.js version', 'yellow');
    }

    // 5. Test backend health endpoint (optional, only if requested)
    if (process.env.TEST_BACKEND_HEALTH) {
      log('\nTesting backend health endpoint...', 'yellow');
      
      try {
        const response = await fetch('http://localhost:8787/health', {
          timeout: 5000
        });
        
        if (response.ok) {
          log('OK Backend health endpoint responding', 'green');
          const health = await response.json();
          log(`   Version: ${health.version}`, 'gray');
          log(`   OpenAI configured: ${health.environment.openai_key_present}`, 'gray');
        }
      } catch (error) {
        log('WARNING Backend not running (this is OK for CI)', 'yellow');
        log('   To test locally: npm run dev from project root', 'gray');
      }
    }

    // Final status
    log('\nCI Test Complete!', 'cyan');
    
    if (hasErrors) {
      log('CI Test FAILED - Fix errors above', 'red');
      process.exit(1);
    } else {
      log('Ready to develop ChatLaLiLuLeLo v3', 'green');
      process.exit(0);
    }

  } catch (error) {
    log(`\nCritical error during CI test: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the CI tests
if (require.main === module) {
  runCITests();
}

module.exports = { runCITests };
