#!/usr/bin/env node

/**
 * ChatLaLiLuLeLo - GitHub Pages Deployment Debugging Script
 * 
 * This script helps diagnose API connectivity issues in the deployed GitHub Pages site.
 * It simulates the same API resolution logic used by the frontend and tests all endpoints.
 */

const https = require('https');
const http = require('http');

// ANSI color codes for better logging
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`${'='.repeat(60)}`, 'cyan');
  log(`🔍 ${title}`, 'bold');
  log(`${'='.repeat(60)}`, 'cyan');
}

// Function to test API endpoint with detailed logging
async function testApiEndpoint(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    log(`\n📡 Testing: ${description}`, 'cyan');
    log(`URL: ${url}`, 'blue');
    
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'ChatLaLiLuLeLo-Debug-Script/1.0',
        'Origin': 'https://johndtwaldron.github.io',
        'Referer': 'https://johndtwaldron.github.io/ChatLaLiLuLeLo/',
        'Accept': 'application/json'
      },
      timeout: 15000
    };
    
    const startTime = Date.now();
    
    const req = protocol.request(url + '/health', options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        log(`⏱️  Response time: ${responseTime}ms`, 'blue');
        log(`📊 Status: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'red');
        
        // Log response headers
        log('📋 Response Headers:', 'blue');
        Object.entries(res.headers).forEach(([key, value]) => {
          if (key.toLowerCase().includes('cors') || 
              key.toLowerCase().includes('access-control') ||
              key.toLowerCase().includes('content-type')) {
            log(`   ${key}: ${value}`, 'cyan');
          }
        });
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            log('✅ Health check successful!', 'green');
            log('📄 Response body:', 'green');
            console.log(JSON.stringify(parsed, null, 2));
            
            resolve({ 
              success: true, 
              data: parsed, 
              status: res.statusCode, 
              responseTime,
              url 
            });
          } catch (e) {
            log('❌ Invalid JSON response', 'red');
            log(`Raw response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`, 'yellow');
            resolve({ 
              success: false, 
              error: 'Invalid JSON response', 
              status: res.statusCode, 
              responseTime,
              rawResponse: data.substring(0, 500),
              url 
            });
          }
        } else {
          log('❌ HTTP error', 'red');
          log(`Error response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`, 'yellow');
          resolve({ 
            success: false, 
            error: `HTTP ${res.statusCode}`, 
            status: res.statusCode, 
            responseTime,
            rawResponse: data.substring(0, 500),
            url 
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      log('❌ Connection error', 'red');
      log(`Error details: ${error.message}`, 'yellow');
      
      resolve({ 
        success: false, 
        error: error.message, 
        responseTime,
        url 
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      log('❌ Request timeout (15s)', 'red');
      
      resolve({ 
        success: false, 
        error: 'Request timeout', 
        responseTime,
        url 
      });
    });
    
    req.end();
  });
}

// Test CORS preflight specifically
async function testCorsEndpoint(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    log(`\n🔒 Testing CORS: ${description}`, 'cyan');
    log(`URL: ${url}/chat (OPTIONS)`, 'blue');
    
    const options = {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://johndtwaldron.github.io',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
        'User-Agent': 'ChatLaLiLuLeLo-Debug-Script/1.0'
      },
      timeout: 10000
    };
    
    const startTime = Date.now();
    
    const req = protocol.request(url + '/chat', options, (res) => {
      const responseTime = Date.now() - startTime;
      
      log(`⏱️  CORS response time: ${responseTime}ms`, 'blue');
      log(`📊 CORS Status: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'red');
      
      // Check specific CORS headers
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers']
      };
      
      log('🔒 CORS Headers:', 'blue');
      Object.entries(corsHeaders).forEach(([key, value]) => {
        if (value) {
          log(`   ${key}: ${value}`, 'green');
        } else {
          log(`   ${key}: MISSING`, 'red');
        }
      });
      
      const corsWorking = res.statusCode === 200 && corsHeaders['access-control-allow-origin'];
      
      resolve({ 
        success: corsWorking, 
        status: res.statusCode, 
        responseTime,
        corsHeaders,
        url 
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      log('❌ CORS test error', 'red');
      log(`Error details: ${error.message}`, 'yellow');
      
      resolve({ 
        success: false, 
        error: error.message, 
        responseTime,
        url 
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      log('❌ CORS timeout', 'red');
      
      resolve({ 
        success: false, 
        error: 'Request timeout', 
        responseTime,
        url 
      });
    });
    
    req.end();
  });
}

// Test GitHub Pages site accessibility
async function testGitHubPages() {
  const pagesUrl = 'https://johndtwaldron.github.io/ChatLaLiLuLeLo/';
  
  log(`\n🌐 Testing GitHub Pages deployment...`, 'cyan');
  log(`URL: ${pagesUrl}`, 'blue');
  
  return new Promise((resolve) => {
    const req = https.request(pagesUrl, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        log(`📊 Pages Status: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'red');
        
        if (res.statusCode === 200) {
          // Check for env.js script tag
          const hasEnvScript = data.includes('env.js');
          log(`🔧 env.js script: ${hasEnvScript ? '✅ Found' : '❌ Missing'}`, hasEnvScript ? 'green' : 'red');
          
          // Check for main bundle
          const hasMainBundle = data.includes('_expo/static/js/web/index-');
          log(`📦 Main bundle: ${hasMainBundle ? '✅ Found' : '❌ Missing'}`, hasMainBundle ? 'green' : 'red');
          
          // Check for security headers
          const hasCSP = data.includes('Content-Security-Policy');
          log(`🔒 Security headers: ${hasCSP ? '✅ Found' : '❌ Missing'}`, hasCSP ? 'green' : 'red');
          
          resolve({ 
            success: true, 
            hasEnvScript, 
            hasMainBundle, 
            hasCSP,
            status: res.statusCode 
          });
        } else {
          log('❌ GitHub Pages not accessible', 'red');
          resolve({ success: false, status: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      log('❌ GitHub Pages connection error', 'red');
      log(`Error: ${error.message}`, 'yellow');
      resolve({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      log('❌ GitHub Pages timeout', 'red');
      resolve({ success: false, error: 'timeout' });
    });
    
    req.end();
  });
}

// Test env.js endpoint specifically
async function testEnvJs() {
  const envUrl = 'https://johndtwaldron.github.io/ChatLaLiLuLeLo/env.js';
  
  log(`\n🔧 Testing env.js configuration...`, 'cyan');
  log(`URL: ${envUrl}`, 'blue');
  
  return new Promise((resolve) => {
    const req = https.request(envUrl, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        log(`📊 env.js Status: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'red');
        
        if (res.statusCode === 200) {
          log('📄 env.js content:', 'green');
          console.log(data);
          
          // Extract API URL from content
          const apiUrlMatch = data.match(/window\.__DEMO_API_URL='([^']+)'/);
          if (apiUrlMatch) {
            const apiUrl = apiUrlMatch[1];
            log(`🔗 Configured API URL: ${apiUrl}`, 'green');
            resolve({ success: true, apiUrl, content: data });
          } else {
            log('❌ Could not extract API URL from env.js', 'red');
            resolve({ success: false, content: data });
          }
        } else {
          log('❌ env.js not accessible', 'red');
          resolve({ success: false, status: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      log('❌ env.js connection error', 'red');
      log(`Error: ${error.message}`, 'yellow');
      resolve({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      log('❌ env.js timeout', 'red');
      resolve({ success: false, error: 'timeout' });
    });
    
    req.end();
  });
}

// Main diagnostic function
async function runDiagnostics() {
  log('🚀 ChatLaLiLuLeLo - GitHub Pages Deployment Diagnostics', 'bold');
  log(`⏰ Started at: ${new Date().toISOString()}`, 'blue');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    recommendations: []
  };
  
  try {
    // Test 1: GitHub Pages accessibility
    logSection('GitHub Pages Site Accessibility');
    const pagesTest = await testGitHubPages();
    results.tests.githubPages = pagesTest;
    
    if (!pagesTest.success) {
      results.recommendations.push('❌ GitHub Pages deployment failed - check Actions workflow');
      return results;
    }
    
    // Test 2: env.js configuration
    logSection('Environment Configuration');
    const envTest = await testEnvJs();
    results.tests.envJs = envTest;
    
    let configuredApiUrl = null;
    if (envTest.success && envTest.apiUrl) {
      configuredApiUrl = envTest.apiUrl;
    }
    
    // Test 3: API endpoints based on frontend logic
    logSection('API Endpoint Testing');
    
    // These are the URLs the frontend will try, in order
    const apiEndpoints = [
      configuredApiUrl ? { url: configuredApiUrl, description: 'Configured API URL (from env.js)' } : null,
      { url: 'https://chatlalilulelo-backend-prod.chatlalilulelo.workers.dev', description: 'Production fallback URL' }
    ].filter(Boolean);
    
    if (apiEndpoints.length === 0) {
      log('❌ No API URLs to test - this explains the connection error!', 'red');
      results.recommendations.push('❌ Configure DEMO_API_URL in GitHub repository variables');
      results.recommendations.push('❌ Ensure Cloudflare Worker backend is deployed and accessible');
      return results;
    }
    
    let anySuccess = false;
    for (const endpoint of apiEndpoints) {
      const healthTest = await testApiEndpoint(endpoint.url, endpoint.description);
      results.tests[`api_${endpoint.url.replace(/[^a-zA-Z0-9]/g, '_')}`] = healthTest;
      
      if (healthTest.success) {
        anySuccess = true;
        
        // Test CORS for successful endpoints
        const corsTest = await testCorsEndpoint(endpoint.url, endpoint.description);
        results.tests[`cors_${endpoint.url.replace(/[^a-zA-Z0-9]/g, '_')}`] = corsTest;
        
        if (!corsTest.success) {
          results.recommendations.push(`⚠️  API at ${endpoint.url} works but CORS may be misconfigured`);
        }
        
        break; // Found working API, no need to test others
      }
    }
    
    if (!anySuccess) {
      results.recommendations.push('❌ No working API endpoints found - this explains the connection error!');
      results.recommendations.push('🔧 Check Cloudflare Worker deployment and configuration');
      results.recommendations.push('🔧 Verify DEMO_API_URL repository variable is set correctly');
    }
    
  } catch (error) {
    log(`💥 Diagnostic error: ${error.message}`, 'red');
    results.error = error.message;
  }
  
  // Generate summary
  logSection('Diagnostic Summary & Recommendations');
  
  if (results.recommendations.length === 0) {
    log('✅ All tests passed! The deployment should be working correctly.', 'green');
    log('If users are still seeing connection errors, it may be a temporary network issue.', 'yellow');
  } else {
    log('🔍 Issues found that may explain the connection errors:', 'yellow');
    results.recommendations.forEach(rec => log(`   ${rec}`, 'yellow'));
  }
  
  // Specific troubleshooting steps
  log('\n🛠️  Troubleshooting Steps:', 'cyan');
  log('1. Check GitHub repository Settings → Secrets and variables → Actions', 'blue');
  log('2. Ensure DEMO_API_URL variable points to working Cloudflare Worker', 'blue');
  log('3. Test backend directly: https://chatlalilulelo-backend-prod.chatlalilulelo.workers.dev/health', 'blue');
  log('4. Check Cloudflare Worker logs for errors', 'blue');
  log('5. Verify CORS configuration allows requests from johndtwaldron.github.io', 'blue');
  
  return results;
}

// Run diagnostics if called directly
if (require.main === module) {
  runDiagnostics()
    .then(results => {
      log('\n📊 Diagnostic completed', 'green');
      
      // Save results to file for debugging
      const fs = require('fs');
      const resultFile = `diagnostic-results-${Date.now()}.json`;
      fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
      log(`📁 Detailed results saved to: ${resultFile}`, 'blue');
    })
    .catch(error => {
      log(`💥 Diagnostic failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runDiagnostics, testApiEndpoint, testCorsEndpoint };
