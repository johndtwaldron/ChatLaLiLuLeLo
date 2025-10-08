#!/usr/bin/env node

/**
 * Comprehensive linting script for ChatLaLiLuLeLo
 * 
 * This script runs multiple linting and validation tools to catch
 * issues that could cause CI failures before they reach production.
 * 
 * Usage: node scripts/lint-all.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

/**
 * Runs a command safely and returns result info
 */
function runCommand(command, description) {
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

/**
 * Validates YAML syntax for GitHub Actions workflows
 */
function validateYAML() {
  logSection('YAML Syntax Validation');
  
  const yamlFiles = [
    '.github/workflows/ci.yml',
    '.github/workflows/lightning-e2e.yml',
    '.github/workflows/pages.yml',
    '.gitpod.yml'
  ];
  
  let allValid = true;
  
  yamlFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      logWarning(`${file} - File not found, skipping`);
      return;
    }
    
    try {
      const yaml = require('js-yaml');
      const content = fs.readFileSync(file, 'utf8');
      yaml.load(content);
      logSuccess(`${file} - YAML syntax is valid`);
    } catch (error) {
      logError(`${file} - YAML syntax error: ${error.message}`);
      allValid = false;
    }
  });
  
  return allValid;
}

/**
 * Validates shell scripts embedded in YAML workflows
 */
function validateWorkflowShellScripts() {
  logSection('Workflow Shell Script Validation');
  
  const workflows = [
    '.github/workflows/lightning-e2e.yml',
    '.github/workflows/pages.yml'
  ];
  
  let allValid = true;
  
  workflows.forEach(workflowFile => {
    if (!fs.existsSync(workflowFile)) {
      logWarning(`${workflowFile} - File not found, skipping`);
      return;
    }
    
    logInfo(`Checking ${workflowFile} for heredoc syntax...`);
    
    const content = fs.readFileSync(workflowFile, 'utf8');
    const lines = content.split('\n');
    
    // Check for heredoc patterns and their termination
    const heredocPattern = /<<\s*'([^']+)'|<<\s*([^\s'"]+)/g;
    let match;
    let lineNum = 0;
    
    for (const line of lines) {
      lineNum++;
      let heredocMatch;
      
      while ((heredocMatch = heredocPattern.exec(line)) !== null) {
        const delimiter = heredocMatch[1] || heredocMatch[2];
        const isQuoted = heredocMatch[1] !== undefined;
        
        logInfo(`  Found heredoc at line ${lineNum}: delimiter="${delimiter}", quoted=${isQuoted}`);
        
        // Look for the closing delimiter in subsequent lines
        let found = false;
        let searchLine = lineNum;
        
        for (let i = lineNum; i < lines.length; i++) {
          const testLine = lines[i].trim();
          const expectedDelimiter = isQuoted ? `'${delimiter}'` : delimiter;
          
          if (testLine === expectedDelimiter) {
            logSuccess(`  Found matching delimiter at line ${i + 1}: ${expectedDelimiter}`);
            found = true;
            break;
          }
        }
        
        if (!found) {
          logError(`  Missing heredoc terminator for "${delimiter}" started at line ${lineNum}`);
          allValid = false;
        }
      }
    }
  });
  
  return allValid;
}

/**
 * Runs TypeScript/JavaScript linting
 */
function runESLint() {
  logSection('TypeScript/JavaScript Linting (ESLint)');
  
  const result = runCommand('npm run lint', 'ESLint');
  
  if (result.success) {
    logSuccess('ESLint passed');
    if (result.output.includes('WARNING')) {
      logWarning('ESLint has warnings (check output above)');
    }
    return true;
  } else {
    logError('ESLint failed');
    if (result.output) {
      console.log(result.output);
    }
    return false;
  }
}

/**
 * Validates package.json files
 */
function validatePackageJson() {
  logSection('Package.json Validation');
  
  const packageFiles = [
    'package.json',
    'apps/mobile/package.json',
    'apps/edge/package.json'
  ];
  
  let allValid = true;
  
  packageFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      logWarning(`${file} - File not found, skipping`);
      return;
    }
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      JSON.parse(content);
      logSuccess(`${file} - JSON syntax is valid`);
    } catch (error) {
      logError(`${file} - JSON syntax error: ${error.message}`);
      allValid = false;
    }
  });
  
  return allValid;
}

/**
 * Checks for common issues in workflow files
 */
function checkWorkflowBestPractices() {
  logSection('GitHub Actions Workflow Best Practices');
  
  const workflows = [
    '.github/workflows/ci.yml',
    '.github/workflows/lightning-e2e.yml',
    '.github/workflows/pages.yml'
  ];
  
  let allGood = true;
  
  workflows.forEach(file => {
    if (!fs.existsSync(file)) {
      logWarning(`${file} - File not found, skipping`);
      return;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for common issues
    if (content.includes('${{ secrets.')) {
      logWarning(`${file} - Contains secrets (ensure they're properly defined in repo)`);
    }
    
    if (content.includes('checkout@v2') || content.includes('setup-node@v2')) {
      logWarning(`${file} - Uses older action versions (consider upgrading)`);
    }
    
    if (!content.includes('timeout-minutes:')) {
      logWarning(`${file} - No timeout specified (jobs could hang indefinitely)`);
    }
    
    // Check for potentially dangerous commands
    if (content.includes('rm -rf')) {
      logWarning(`${file} - Contains 'rm -rf' commands (verify they're safe)`);
    }
    
    logInfo(`${file} - Best practices check completed`);
  });
  
  return allGood;
}

/**
 * Main execution function
 */
async function main() {
  log(`${colors.bold}${colors.magenta}ChatLaLiLuLeLo Comprehensive Linting Suite${colors.reset}`);
  log(`${colors.cyan}Running pre-commit quality checks...${colors.reset}\n`);
  
  const results = {
    yaml: validateYAML(),
    shellScripts: validateWorkflowShellScripts(),
    eslint: runESLint(),
    packageJson: validatePackageJson(),
    workflows: checkWorkflowBestPractices()
  };
  
  // Summary
  logSection('Linting Summary');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([check, passed]) => {
    if (passed) {
      logSuccess(`${check.padEnd(20)} - PASSED`);
    } else {
      logError(`${check.padEnd(20)} - FAILED`);
    }
  });
  
  log(`\n${colors.bold}Results: ${passed}/${total} checks passed${colors.reset}`);
  
  if (passed === total) {
    logSuccess('All linting checks passed! ✨');
    log(`${colors.green}Safe to commit and push to repository.${colors.reset}`);
    process.exit(0);
  } else {
    logError('Some linting checks failed!');
    log(`${colors.red}Please fix the issues above before committing.${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logError(`Linting suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
