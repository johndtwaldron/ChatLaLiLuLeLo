#!/usr/bin/env node

/**
 * Enhanced Development Startup Script
 * Runs CI checks, linting, and starts development servers if all checks pass
 * Logs output to debug files with timestamps
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// ANSI color codes
const colors = {
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  gray: '\x1b[37m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  const coloredMessage = `${colors[color]}${message}${colors.reset}`;
  console.log(`[${timestamp}] ${coloredMessage}`);
  return `[${timestamp}] ${message}`;
}

function createDebugDir() {
  const debugDir = 'debug';
  const outputDir = path.join(debugDir, 'terminal.outputs');
  
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  return outputDir;
}

function generateTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr || '' };
  }
}

async function runDevWithValidation() {
  const timestamp = generateTimestamp();
  const debugDir = createDebugDir();
  const logFile = path.join(debugDir, `dev.debug.${timestamp}.txt`);
  
  let logBuffer = [];
  
  function logAndSave(message, color = 'reset') {
    const logEntry = log(message, color);
    logBuffer.push(logEntry);
    
    // Save to file periodically
    if (logBuffer.length % 10 === 0) {
      fs.appendFileSync(logFile, logBuffer.join('\n') + '\n', 'utf8');
      logBuffer = [];
    }
  }

  function saveLogBuffer() {
    if (logBuffer.length > 0) {
      fs.appendFileSync(logFile, logBuffer.join('\n') + '\n', 'utf8');
      logBuffer = [];
    }
  }

  try {
    logAndSave('🚀 ChatLaLiLuLeLo Enhanced Development Startup', 'cyan');
    logAndSave(`📝 Debug log: ${logFile}`, 'gray');
    logAndSave('', 'reset');

    // Phase 1: Project Structure Check (Fast)
    logAndSave('📋 Phase 1: Checking Project Structure...', 'yellow');
    
    const requiredPaths = [
      'apps/mobile/package.json',
      'apps/edge/package.json',
      'apps/edge/.dev.vars',
      'apps/mobile/src/features/chat/ChatScreen.tsx'
    ];

    for (const filepath of requiredPaths) {
      if (!require('fs').existsSync(filepath)) {
        logAndSave(`❌ Missing required file: ${filepath}`, 'red');
        saveLogBuffer();
        process.exit(1);
      }
    }
    logAndSave('✅ Project structure validated', 'green');

    // Phase 2: Linting (Fast, likely to fail)
    logAndSave('🛡️ Phase 2: Running Code Linting...', 'yellow');
    
    try {
      const lintResult = runCommand('npm run lint', { silent: true });
      
      if (lintResult.success) {
        logAndSave('✅ Code linting passed', 'green');
      } else {
        logAndSave('❌ Linting failed:', 'red');
        logAndSave(lintResult.error || lintResult.output || 'Unknown linting error', 'red');
        logAndSave('', 'reset');
        logAndSave('💡 Quick fix: Run `npm run lint:fix` to auto-fix many issues', 'yellow');
        logAndSave('🔧 Then run `npm run dev` again', 'yellow');
        saveLogBuffer();
        process.exit(1);
      }
    } catch (error) {
      logAndSave(`❌ Linting error: ${error.message}`, 'red');
      saveLogBuffer();
      process.exit(1);
    }

    // Phase 3: TypeScript Check
    logAndSave('🔍 Phase 3: Running TypeScript Validation...', 'yellow');
    
    try {
      const tscResult = runCommand('npm run typecheck', { silent: true });
      
      if (tscResult.success) {
        logAndSave('✅ TypeScript validation passed', 'green');
      } else {
        logAndSave('❌ TypeScript validation failed:', 'red');
        logAndSave(tscResult.error || tscResult.output || 'Unknown TypeScript error', 'red');
        saveLogBuffer();
        process.exit(1);
      }
    } catch (error) {
      logAndSave(`❌ TypeScript validation error: ${error.message}`, 'red');
      saveLogBuffer();
      process.exit(1);
    }

    // Save all validation results
    saveLogBuffer();

    // Phase 4: Start Development Servers
    logAndSave('', 'reset');
    logAndSave('🎉 All validation checks passed!', 'green');
    logAndSave('🚀 Starting development servers...', 'cyan');
    logAndSave('', 'reset');
    
    // Start the production command (which starts both servers)
    logAndSave('📡 Launching backend (Cloudflare Workers) and frontend (Expo)...', 'blue');
    logAndSave('🔗 Frontend will be available at: http://localhost:8082', 'magenta');
    logAndSave('🔗 Backend API will be available at: http://localhost:8787', 'magenta');
    logAndSave('', 'reset');
    logAndSave('💡 To stop servers: Ctrl+C', 'gray');
    logAndSave('📝 This session logged to: ' + logFile, 'gray');
    logAndSave('', 'reset');

    // Final log save before starting servers
    saveLogBuffer();

    // Start the development servers using the prod command
    const devProcess = spawn('npm', ['run', 'prod'], {
      stdio: 'inherit',
      shell: true
    });

    // Handle process cleanup
    process.on('SIGINT', () => {
      logAndSave('', 'reset');
      logAndSave('🛑 Shutting down development servers...', 'yellow');
      saveLogBuffer();
      devProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logAndSave('🛑 Received SIGTERM, shutting down...', 'yellow');
      saveLogBuffer();
      devProcess.kill('SIGTERM');
      process.exit(0);
    });

    devProcess.on('close', (code) => {
      logAndSave(`🔚 Development servers exited with code ${code}`, 'gray');
      saveLogBuffer();
      process.exit(code);
    });

  } catch (error) {
    logAndSave(`💥 Critical error: ${error.message}`, 'red');
    saveLogBuffer();
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the enhanced development startup
if (require.main === module) {
  runDevWithValidation();
}

module.exports = { runDevWithValidation };
