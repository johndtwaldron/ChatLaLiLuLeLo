#!/usr/bin/env node

/**
 * Lightning Network E2E Test Runner
 * 
 * Runs comprehensive E2E tests for Lightning Network integration
 * Supports local development and CI/CD environments
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  playwright: {
    config: path.join(__dirname, '../tests/e2e-web/lightning.config.ts'),
    reportDir: path.join(__dirname, '../tests/e2e-web/reports/lightning'),
    testDir: path.join(__dirname, '../tests/e2e-web')
  },
  servers: {
    frontend: 'http://localhost:14085',
    backend: 'http://localhost:3001'
  },
  timeouts: {
    serverStart: 30000,
    testExecution: 300000 // 5 minutes
  }
};

class LightningE2ERunner {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false,
      browser: options.browser || 'all',
      timeout: options.timeout || CONFIG.timeouts.testExecution,
      retries: options.retries || 0,
      workers: options.workers || (process.env.CI ? 1 : 4),
      reporter: options.reporter || 'html,json,junit',
      ...options
    };
    
    this.isCI = !!process.env.CI;
    this.verbose = options.verbose || this.isCI;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔵',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[level] || '🔵';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkPrerequisites() {
    this.log('Checking Lightning E2E test prerequisites...');
    
    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'ignore' });
      this.log('Playwright installation confirmed', 'success');
    } catch (error) {
      this.log('Playwright not found - installing...', 'warning');
      execSync('npx playwright install', { stdio: 'inherit' });
    }
    
    // Check test configuration
    if (!fs.existsSync(CONFIG.playwright.config)) {
      throw new Error(`Lightning test config not found: ${CONFIG.playwright.config}`);
    }
    this.log('Lightning test configuration found', 'success');
    
    // Check test files
    const testFiles = fs.readdirSync(CONFIG.playwright.testDir)
      .filter(file => file.includes('lightning') && file.endsWith('.spec.ts'));
    
    if (testFiles.length === 0) {
      throw new Error('No Lightning test files found');
    }
    this.log(`Found ${testFiles.length} Lightning test file(s)`, 'success');
    
    // Validate server availability
    await this.validateServers();
  }

  async validateServers() {
    this.log('Validating server availability...');
    
    const checkServer = async (url, name) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          this.log(`${name} server responding at ${url}`, 'success');
          return true;
        }
      } catch (error) {
        this.log(`${name} server not available at ${url}`, 'warning');
        return false;
      }
    };
    
    const frontendOk = await checkServer(CONFIG.servers.frontend, 'Frontend');
    const backendOk = await checkServer(CONFIG.servers.backend, 'Backend');
    
    if (!frontendOk) {
      this.log('Starting frontend development server...', 'warning');
      // Note: In practice, the server should already be running
      // This is just a validation step
    }
  }

  async setupReportDirectories() {
    const dirs = [
      CONFIG.playwright.reportDir,
      path.join(CONFIG.playwright.reportDir, 'screenshots'),
      path.join(CONFIG.playwright.reportDir, 'videos'),
      path.join(CONFIG.playwright.reportDir, 'traces')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(`Created report directory: ${dir}`);
      }
    });
  }

  buildPlaywrightCommand() {
    const cmd = ['npx', 'playwright', 'test'];
    
    // Configuration
    cmd.push('--config', CONFIG.playwright.config);
    
    // Browser selection
    if (this.options.browser !== 'all') {
      cmd.push('--project', this.options.browser);
    }
    
    // Execution options
    if (this.options.headless === false) {
      cmd.push('--headed');
    }
    
    if (this.options.workers) {
      cmd.push('--workers', this.options.workers.toString());
    }
    
    if (this.options.retries) {
      cmd.push('--retries', this.options.retries.toString());
    }
    
    // Timeout
    cmd.push('--timeout', this.options.timeout.toString());
    
    // Reporting
    if (this.options.reporter.includes('html')) {
      cmd.push('--reporter', 'html');
    }
    
    // Test pattern
    cmd.push('lightning-*.spec.ts');
    
    return cmd;
  }

  async runTests() {
    this.log('Starting Lightning Network E2E tests...');
    
    const startTime = Date.now();
    const cmd = this.buildPlaywrightCommand();
    
    this.log(`Executing: ${cmd.join(' ')}`);
    
    try {
      const result = execSync(cmd.join(' '), {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        timeout: this.options.timeout,
        env: {
          ...process.env,
          LIGHTNING_E2E_MODE: 'true',
          CI: this.isCI ? '1' : undefined
        }
      });
      
      const duration = Date.now() - startTime;
      this.log(`Lightning E2E tests completed successfully in ${duration}ms`, 'success');
      
      return {
        success: true,
        duration,
        exitCode: 0
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`Lightning E2E tests failed after ${duration}ms`, 'error');
      
      if (error.code) {
        this.log(`Exit code: ${error.code}`, 'error');
      }
      
      return {
        success: false,
        duration,
        exitCode: error.code || 1,
        error: error.message
      };
    }
  }

  async generateReport() {
    this.log('Generating test report...');
    
    const reportPath = path.join(CONFIG.playwright.reportDir, 'index.html');
    if (fs.existsSync(reportPath)) {
      this.log(`Test report available at: ${reportPath}`, 'success');
      
      // In CI, also log the report URL structure
      if (this.isCI) {
        this.log('Report artifacts ready for CI collection', 'success');
      }
    } else {
      this.log('Test report not generated', 'warning');
    }
  }

  async run() {
    try {
      await this.checkPrerequisites();
      await this.setupReportDirectories();
      
      const result = await this.runTests();
      await this.generateReport();
      
      if (result.success) {
        this.log('Lightning Network E2E testing completed successfully! 🎉', 'success');
        process.exit(0);
      } else {
        this.log('Lightning Network E2E testing failed! 💥', 'error');
        process.exit(result.exitCode);
      }
      
    } catch (error) {
      this.log(`Lightning E2E runner failed: ${error.message}`, 'error');
      if (this.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  }
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--headed':
        options.headless = false;
        break;
      case '--browser':
        options.browser = args[++i];
        break;
      case '--workers':
        options.workers = parseInt(args[++i]);
        break;
      case '--retries':
        options.retries = parseInt(args[++i]);
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]);
        break;
      case '--verbose':
        options.verbose = true;
        break;
    }
  }
  
  const runner = new LightningE2ERunner(options);
  runner.run();
}

module.exports = LightningE2ERunner;
