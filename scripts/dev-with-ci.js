#!/usr/bin/env node

/**
 * Enhanced Development Startup Script
 * Runs CI checks, linting, and starts development servers if all checks pass
 * Logs output to debug files with timestamps
 * Includes port conflict resolution and disk space monitoring
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const net = require('net');

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

// Check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

// Find next available port starting from a base port
async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Check disk space (Windows)
function checkDiskSpace() {
  try {
    const result = execSync('powershell "Get-PSDrive C | Select-Object -ExpandProperty Free"', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const freeBytes = parseInt(result.trim());
    const freeMB = Math.round(freeBytes / (1024 * 1024));
    const freeGB = (freeBytes / (1024 * 1024 * 1024)).toFixed(2);
    
    return {
      freeBytes,
      freeMB,
      freeGB: parseFloat(freeGB),
      isLow: freeMB < 500, // Less than 500MB is considered low
      isCritical: freeMB < 100 // Less than 100MB is critical
    };
  } catch (error) {
    return null;
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

    // Phase 0: System Health Check
    logAndSave('⚡ Phase 0: System Health Check...', 'yellow');
    
    // Check disk space
    const diskSpace = checkDiskSpace();
    if (diskSpace) {
      if (diskSpace.isCritical) {
        logAndSave(`🚨 CRITICAL: Only ${diskSpace.freeMB}MB (${diskSpace.freeGB}GB) free on C: drive!`, 'red');
        logAndSave('⚠️  Development may fail due to insufficient disk space', 'red');
        logAndSave('💡 Consider moving project to drive with more space or clearing cache files', 'yellow');
        logAndSave('', 'reset');
      } else if (diskSpace.isLow) {
        logAndSave(`⚠️  Low disk space: ${diskSpace.freeMB}MB (${diskSpace.freeGB}GB) free on C: drive`, 'yellow');
        logAndSave('💡 Consider cleaning up files soon', 'yellow');
      } else {
        logAndSave(`✅ Disk space OK: ${diskSpace.freeGB}GB free`, 'green');
      }
    }
    
    // Check default ports
    const frontendPort = await findAvailablePort(14085);
    const backendPort = await findAvailablePort(8787);
    
    if (frontendPort !== 14085 || backendPort !== 8787) {
      logAndSave('🔧 Port conflicts detected, using alternative ports:', 'yellow');
      if (frontendPort !== 14085) {
        logAndSave(`   Frontend: ${frontendPort} (instead of 14085)`, 'yellow');
      }
      if (backendPort !== 8787) {
        logAndSave(`   Backend: ${backendPort} (instead of 8787)`, 'yellow');
      }
    } else {
      logAndSave('✅ Default ports available (14085, 8787)', 'green');
    }
    
    logAndSave('✅ System health check completed', 'green');
    
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

    // Phase 3.5: AI Prompt Validation (New for v4.5)
    logAndSave('🤖 Phase 3.5: Validating AI Prompt Files...', 'yellow');
    
    const promptFiles = [
      'prompts/modes/btc.md',
      'prompts/modes/gw.md',
      'prompts/modes/jd.md',
      'prompts/modes/mgs.md'
    ];
    
    for (const promptFile of promptFiles) {
      if (!fs.existsSync(promptFile)) {
        logAndSave(`❌ Missing AI prompt file: ${promptFile}`, 'red');
        logAndSave('💡 AI personalities will not work without prompt files', 'yellow');
        saveLogBuffer();
        process.exit(1);
      } else {
        // Quick validation - check file size
        const stats = fs.statSync(promptFile);
        const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
        
        if (stats.size < 1000) {
          logAndSave(`⚠️  ${promptFile} is small (${sizeKB}KB) - may be incomplete`, 'yellow');
        } else {
          logAndSave(`✅ ${promptFile} validated (${sizeKB}KB)`, 'green');
        }
      }
    }
    
    // Check for uncommitted prompt changes
    try {
      const gitDiff = runCommand('git diff --name-only prompts/modes/', { silent: true });
      const gitStaged = runCommand('git diff --cached --name-only prompts/modes/', { silent: true });
      
      const uncommittedFiles = [];
      
      if (gitDiff.success && gitDiff.output.trim()) {
        uncommittedFiles.push(...gitDiff.output.trim().split('\n').filter(f => f));
      }
      
      if (gitStaged.success && gitStaged.output.trim()) {
        uncommittedFiles.push(...gitStaged.output.trim().split('\n').filter(f => f));
      }
      
      if (uncommittedFiles.length > 0) {
        logAndSave('⚠️  Uncommitted prompt changes detected:', 'yellow');
        for (const file of uncommittedFiles) {
          logAndSave(`   📝 Modified: ${file}`, 'yellow');
        }
        logAndSave('💡 Ensure AI personality changes are intentional', 'yellow');
      }
      
    } catch (error) {
      logAndSave('⚠️  Could not check prompt git status', 'yellow');
    }
    
    logAndSave('✅ AI prompt validation completed', 'green');
    
    // Phase 3.8: Backend Health Check (NEW for backend connectivity validation)
    logAndSave('🏥 Phase 3.8: Backend Health Check...', 'yellow');
    
    // Function to check if backend is responding
    async function checkBackendHealth(port, timeout = 30000) {
      const startTime = Date.now();
      const checkUrl = `http://localhost:${port}/health`;
      
      logAndSave(`🔍 Checking backend health at: ${checkUrl}`, 'gray');
      
      while (Date.now() - startTime < timeout) {
        try {
          const response = await fetch(checkUrl, { 
            method: 'GET',
            signal: AbortSignal.timeout(2000) // 2 second timeout per request
          });
          
          if (response.ok) {
            const healthData = await response.json();
            logAndSave(`✅ Backend health check passed: ${healthData.status}`, 'green');
            
            // Log additional health info if available
            if (healthData.environment) {
              logAndSave(`   📊 OpenAI Key: ${healthData.environment.openai_key_present ? 'Present' : 'Missing'}`, 'gray');
              logAndSave(`   📊 Tavily Key: ${healthData.environment.tavily_key_present ? 'Present' : 'Missing'}`, 'gray');
              logAndSave(`   📊 Model: ${healthData.environment.model || 'Unknown'}`, 'gray');
            }
            
            return true;
          } else {
            logAndSave(`⚠️  Backend responded with status ${response.status}`, 'yellow');
          }
        } catch (error) {
          // Backend might still be starting up, continue waiting
          logAndSave(`⏳ Waiting for backend... (${Math.round((Date.now() - startTime) / 1000)}s)`, 'gray');
        }
        
        // Wait 2 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      return false;
    }
    
    // Start backend first and wait for it to be ready
    logAndSave('🚀 Starting backend server...', 'blue');
    
    const backendProcess = spawn('npx', [
      'wrangler', 'dev', '--local', '--env=development', `--port=${backendPort}`
    ], {
      cwd: path.resolve('apps/edge'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });
    
    // Capture backend output
    let backendStarted = false;
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready on')) {
        backendStarted = true;
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready on')) {
        backendStarted = true;
      }
    });
    
    // Wait for backend to be ready with health check
    const backendReady = await checkBackendHealth(backendPort);
    
    if (!backendReady) {
      logAndSave('❌ Backend health check failed - backend not responding after 30 seconds', 'red');
      logAndSave('💡 Common issues:', 'yellow');
      logAndSave('   - Check .dev.vars file exists in apps/edge/', 'yellow');
      logAndSave('   - Verify OpenAI API key is valid', 'yellow');
      logAndSave('   - Ensure port 8787 is available', 'yellow');
      
      // Kill the backend process
      backendProcess.kill('SIGTERM');
      saveLogBuffer();
      process.exit(1);
    }
    
    logAndSave('✅ Backend health check completed successfully', 'green');

    // Save all validation results
    saveLogBuffer();

    // Phase 4: Start Frontend Server (Backend already started)
    logAndSave('', 'reset');
    logAndSave('🎉 All validation checks passed!', 'green');
    logAndSave('🚀 Starting frontend server...', 'cyan');
    logAndSave('', 'reset');
    
    logAndSave('📱 Launching frontend (Expo)...', 'blue');
    logAndSave(`🔗 Frontend will be available at: http://localhost:${frontendPort}`, 'magenta');
    logAndSave(`🔗 Backend API already running at: http://localhost:${backendPort}`, 'magenta');
    logAndSave('', 'reset');
    logAndSave('💡 To stop servers: Ctrl+C', 'gray');
    logAndSave('📝 This session logged to: ' + logFile, 'gray');
    logAndSave('', 'reset');

    // Final log save before starting servers
    saveLogBuffer();

    // Start only the frontend server (backend is already running)
    const mobileProcess = spawn('npx', [
      'expo', 'start', '--web', `--port=${frontendPort}`
    ], {
      cwd: path.resolve('apps/mobile'),
      stdio: 'inherit',
      shell: true
    });

    // Handle process cleanup with enhanced Windows support
    let isShuttingDown = false;
    
    const gracefulShutdown = (signal = 'SIGINT') => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      
      logAndSave('', 'reset');
      logAndSave(`🛑 Received ${signal}, shutting down development servers...`, 'yellow');
      saveLogBuffer();
      
      // Kill both backend and frontend processes
      const killProcess = (proc, name) => {
        if (!proc) return;
        
        if (process.platform === 'win32') {
          try {
            // Try to kill the entire process tree
            require('child_process').execSync(`taskkill /pid ${proc.pid} /t /f`, { stdio: 'ignore' });
            logAndSave(`🕰 ${name} process tree terminated`, 'gray');
          } catch (e) {
            // Fallback to normal kill if taskkill fails
            proc.kill('SIGKILL');
            logAndSave(`🕰 ${name} process killed (fallback)`, 'gray');
          }
        } else {
          proc.kill(signal);
          logAndSave(`🕰 ${name} process terminated`, 'gray');
        }
      };
      
      killProcess(backendProcess, 'Backend');
      killProcess(mobileProcess, 'Frontend');
      
      // Give processes a moment to clean up
      setTimeout(() => {
        logAndSave('✅ Shutdown complete', 'green');
        process.exit(0);
      }, 1000);
    };
    
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // Windows-specific cleanup
    if (process.platform === 'win32') {
      process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK'));
      
      // Handle Ctrl+C more gracefully on Windows
      require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      }).on('SIGINT', () => {
        gracefulShutdown('SIGINT');
      });
    }

    // Monitor both processes for exit
    mobileProcess.on('close', (code) => {
      logAndSave(`📱 Frontend server exited with code ${code}`, 'gray');
      if (!isShuttingDown) {
        gracefulShutdown('SIGTERM'); // Shutdown backend too
      }
    });
    
    backendProcess.on('close', (code) => {
      logAndSave(`🏥 Backend server exited with code ${code}`, 'gray');
      if (!isShuttingDown) {
        gracefulShutdown('SIGTERM'); // Shutdown frontend too
      }
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
