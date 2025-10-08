#!/usr/bin/env node

/**
 * Quick test for ChatLaLiLuLeLo production API endpoint
 * 
 * This tests the production fallback URL that GitHub Pages uses when DEMO_API_URL is not configured.
 */

const https = require('https');

const PRODUCTION_API_URL = 'https://chatlalilulelo-backend-prod.chatlalilulelo.workers.dev';

console.log('🧪 Testing ChatLaLiLuLeLo Production API...');
console.log(`📡 URL: ${PRODUCTION_API_URL}`);
console.log('');

// Test /health endpoint
function testHealth() {
  return new Promise((resolve) => {
    const req = https.request(`${PRODUCTION_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Origin': 'https://johndtwaldron.github.io',
        'User-Agent': 'ChatLaLiLuLeLo-API-Test'
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ Health Check - Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log('📄 Response:', JSON.stringify(parsed, null, 2));
            resolve({ success: true, data: parsed });
          } catch (e) {
            console.log('❌ Invalid JSON response');
            console.log('Raw:', data);
            resolve({ success: false, error: 'Invalid JSON' });
          }
        } else {
          console.log('❌ Error response:', data);
          resolve({ success: false, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Connection error:', error.message);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('❌ Request timeout');
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
}

// Test CORS for /chat endpoint
function testCors() {
  return new Promise((resolve) => {
    const req = https.request(`${PRODUCTION_API_URL}/chat`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://johndtwaldron.github.io',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 10000
    }, (res) => {
      console.log(`🔒 CORS Check - Status: ${res.statusCode}`);
      
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers']
      };
      
      console.log('CORS Headers:');
      Object.entries(corsHeaders).forEach(([key, value]) => {
        console.log(`  ${key}: ${value || 'MISSING'}`);
      });
      
      const corsOk = res.statusCode === 200 && corsHeaders['access-control-allow-origin'];
      resolve({ success: corsOk, corsHeaders });
    });

    req.on('error', (error) => {
      console.log('❌ CORS test error:', error.message);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('❌ CORS test timeout');
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🏥 Testing /health endpoint...');
  const healthResult = await testHealth();
  
  console.log('\n🔒 Testing CORS configuration...');
  const corsResult = await testCors();
  
  console.log('\n📊 Summary:');
  console.log(`Health Check: ${healthResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CORS Check: ${corsResult.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (healthResult.success && corsResult.success) {
    console.log('\n🎉 Production API is working! The issue might be elsewhere.');
    console.log('💡 Check:');
    console.log('   - GitHub Pages deployment logs');
    console.log('   - Browser console for detailed error messages');
    console.log('   - Network tab to see what URL is actually being called');
  } else {
    console.log('\n🚨 Production API has issues:');
    if (!healthResult.success) {
      console.log(`   - Health endpoint failed: ${healthResult.error || 'Unknown error'}`);
    }
    if (!corsResult.success) {
      console.log(`   - CORS configuration failed: ${corsResult.error || 'Unknown error'}`);
    }
    console.log('\n🔧 This explains the connection errors on GitHub Pages!');
  }
}

runTests().catch(console.error);
