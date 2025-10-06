/**
 * API Smoke Tests - V4.5 QA Focus
 * 
 * Lightweight smoke tests for Cloudflare Workers API endpoints.
 * Tests the live deployed API for basic functionality and error handling.
 * No heavy dependencies - just Node.js fetch and basic assertions.
 */

// Simple test framework - no dependencies needed
const assert = require('assert');
const { performance } = require('perf_hooks');

// API Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://chatlalilulelo-backend.chatlalilulelo.workers.dev';
const TEST_TIMEOUT = 10000; // 10 seconds

// Test utilities
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Origin': 'https://johndtwaldron.github.io',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    json: async () => {
      try {
        return await response.json();
      } catch (e) {
        return null;
      }
    },
    text: async () => await response.text()
  };
};

// Test runner
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log(`🧪 Starting API Smoke Tests - V4.5 QA Focus`);
    console.log(`📍 Testing API: ${API_BASE_URL}`);
    console.log(`⏱️  Timeout: ${TEST_TIMEOUT}ms\n`);

    for (const { name, testFn } of this.tests) {
      this.results.total++;
      
      try {
        const start = performance.now();
        await Promise.race([
          testFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
          )
        ]);
        const duration = Math.round(performance.now() - start);
        
        console.log(`✅ ${name} (${duration}ms)`);
        this.results.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   ${error.message}`);
        this.results.failed++;
        this.results.errors.push({ test: name, error: error.message });
      }
    }

    this.printSummary();
    return this.results.failed === 0;
  }

  printSummary() {
    console.log(`\n📊 Test Results:`);
    console.log(`   Total: ${this.results.total}`);
    console.log(`   Passed: ${this.results.passed}`);
    console.log(`   Failed: ${this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log(`\n💥 Failures:`);
      this.results.errors.forEach(({ test, error }) => {
        console.log(`   - ${test}: ${error}`);
      });
    }
  }
}

// Test suite
const runner = new TestRunner();

// Health endpoint tests
runner.test('Health endpoint responds with 200', async () => {
  const response = await makeRequest('/health');
  assert.strictEqual(response.status, 200, 'Health endpoint should return 200');
});

runner.test('Health endpoint returns valid JSON', async () => {
  const response = await makeRequest('/health');
  const data = await response.json();
  
  assert(data, 'Health endpoint should return JSON data');
  assert.strictEqual(data.status, 'ok', 'Health status should be "ok"');
  assert(typeof data.timestamp === 'number', 'Should include timestamp');
  assert(typeof data.version === 'string', 'Should include version');
  assert(typeof data.environment === 'object', 'Should include environment info');
});

runner.test('Health endpoint includes environment info', async () => {
  const response = await makeRequest('/health');
  const data = await response.json();
  
  assert(data.environment, 'Should have environment object');
  assert(typeof data.environment.openai_key_present === 'boolean', 'Should indicate OpenAI key status');
  assert(typeof data.environment.model === 'string', 'Should include model info');
});

// Budget endpoint tests
runner.test('Budget endpoint responds with 200', async () => {
  const response = await makeRequest('/budget?sessionId=test-session-123');
  assert.strictEqual(response.status, 200, 'Budget endpoint should return 200');
});

runner.test('Budget endpoint returns usage stats', async () => {
  const response = await makeRequest('/budget?sessionId=test-session-456');
  const data = await response.json();
  
  assert(data, 'Budget endpoint should return JSON data');
  assert.strictEqual(data.status, 'ok', 'Budget status should be "ok"');
  assert(data.usage, 'Should include usage stats');
  assert(data.config, 'Should include config info');
  
  // Check usage structure
  assert(typeof data.usage.requestCount === 'number', 'Should track request count');
  assert(typeof data.usage.tokenCount === 'number', 'Should track token count');
  assert(typeof data.usage.estimatedSpendUSD === 'number', 'Should estimate spend');
});

runner.test('Budget endpoint includes rate limiting config', async () => {
  const response = await makeRequest('/budget');
  const data = await response.json();
  
  assert(data.config, 'Should include config');
  assert(typeof data.config.requestsPerWindow === 'number', 'Should specify request limits');
  assert(typeof data.config.windowMs === 'number', 'Should specify time window');
  assert(typeof data.config.maxTokensPerSession === 'number', 'Should specify token limits');
  assert(typeof data.config.monthlyBudgetUSD === 'number', 'Should specify budget');
});

// CORS tests
runner.test('CORS headers are present for health endpoint', async () => {
  const response = await makeRequest('/health');
  
  assert(response.headers['access-control-allow-origin'], 'Should have CORS origin header');
});

runner.test('OPTIONS preflight request works', async () => {
  const response = await makeRequest('/health', { method: 'OPTIONS' });
  assert.strictEqual(response.status, 200, 'OPTIONS request should return 200');
  
  assert(response.headers['access-control-allow-origin'], 'Should have CORS origin');
  assert(response.headers['access-control-allow-methods'], 'Should specify allowed methods');
  assert(response.headers['access-control-allow-headers'], 'Should specify allowed headers');
});

// Chat endpoint error handling tests
runner.test('Chat endpoint rejects GET requests', async () => {
  const response = await makeRequest('/chat', { method: 'GET' });
  assert.strictEqual(response.status, 404, 'Chat endpoint should reject GET with 404');
});

runner.test('Chat endpoint rejects invalid JSON', async () => {
  const response = await makeRequest('/chat', {
    method: 'POST',
    body: 'invalid json{'
  });
  assert(response.status >= 400, 'Should return error status for invalid JSON');
});

runner.test('Chat endpoint validates request schema', async () => {
  const response = await makeRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({ invalid: 'request' })
  });
  assert.strictEqual(response.status, 400, 'Should return 400 for invalid schema');
});

runner.test('Chat endpoint requires messages array', async () => {
  const response = await makeRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({
      mode: 'JD'
      // Missing messages array
    })
  });
  assert.strictEqual(response.status, 400, 'Should return 400 for missing messages');
});

// Security tests
runner.test('Security headers are present', async () => {
  const response = await makeRequest('/health');
  
  // Check for common security headers (these might be added by Cloudflare)
  const securityHeaders = [
    'access-control-allow-origin',
    'vary'
  ];
  
  // At least some security-related headers should be present
  const hasSecurityHeaders = securityHeaders.some(header => 
    response.headers[header]
  );
  
  assert(hasSecurityHeaders, 'Should have security-related headers');
});

runner.test('Unknown endpoints return 404', async () => {
  const response = await makeRequest('/nonexistent-endpoint');
  assert.strictEqual(response.status, 404, 'Unknown endpoints should return 404');
});

// Performance tests
runner.test('Health endpoint responds quickly', async () => {
  const start = performance.now();
  const response = await makeRequest('/health');
  const duration = performance.now() - start;
  
  assert.strictEqual(response.status, 200, 'Health check should succeed');
  assert(duration < 2000, `Health endpoint should respond in <2s, took ${Math.round(duration)}ms`);
});

runner.test('Budget endpoint responds quickly', async () => {
  const start = performance.now();
  const response = await makeRequest('/budget');
  const duration = performance.now() - start;
  
  assert.strictEqual(response.status, 200, 'Budget check should succeed');
  assert(duration < 2000, `Budget endpoint should respond in <2s, took ${Math.round(duration)}ms`);
});

// Rate limiting simulation tests
runner.test('Multiple rapid requests are handled gracefully', async () => {
  const requests = Array.from({ length: 5 }, () => 
    makeRequest('/health')
  );
  
  const responses = await Promise.all(requests);
  
  // All requests should either succeed or be rate limited (not crash)
  responses.forEach((response, index) => {
    assert(
      response.status === 200 || response.status === 429,
      `Request ${index} should succeed (200) or be rate limited (429), got ${response.status}`
    );
  });
});

// Content-Type tests
runner.test('Health endpoint returns JSON content type', async () => {
  const response = await makeRequest('/health');
  const contentType = response.headers['content-type'];
  
  assert(contentType, 'Should have content-type header');
  assert(contentType.includes('application/json'), 'Health endpoint should return JSON');
});

runner.test('Budget endpoint returns JSON content type', async () => {
  const response = await makeRequest('/budget');
  const contentType = response.headers['content-type'];
  
  assert(contentType, 'Should have content-type header');
  assert(contentType.includes('application/json'), 'Budget endpoint should return JSON');
});

// Error resilience tests
runner.test('API handles malformed Origin header', async () => {
  const response = await makeRequest('/health', {
    headers: {
      'Origin': 'not-a-valid-origin'
    }
  });
  
  // Should still work, just might not get specific CORS treatment
  assert.strictEqual(response.status, 200, 'Should handle malformed origin gracefully');
});

runner.test('API handles missing Content-Type for POST', async () => {
  const response = await makeRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({ mode: 'JD', messages: [] }),
    headers: {
      // Deliberately omitting Content-Type
    }
  });
  
  // Should return an error, but not crash
  assert(response.status >= 400, 'Should return error status for POST without content-type');
});

// Run tests if this is the main module
if (require.main === module) {
  (async () => {
    try {
      const success = await runner.run();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('💥 Test runner crashed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = { TestRunner, makeRequest };
