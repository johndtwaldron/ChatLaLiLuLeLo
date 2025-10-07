/**
 * Security Test Setup
 * 
 * Global setup and teardown for security test suite.
 * Handles test environment configuration and cleanup.
 */

import { beforeAll, afterAll } from 'vitest';

export async function setup() {
  console.log('🔒 Setting up security test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'security';
  
  // Mock external dependencies that aren't needed for security tests
  process.env.OPENAI_API_KEY = 'test-key-for-security-tests';
  process.env.TAVILY_API_KEY = 'test-key-for-security-tests';
  
  // Set reasonable test timeouts
  process.env.TEST_TIMEOUT = '30000';
  
  // Create test results directory if it doesn't exist
  const fs = await import('fs');
  const path = await import('path');
  
  const testResultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }
  
  console.log('✅ Security test environment ready');
}

export async function teardown() {
  console.log('🧹 Cleaning up security test environment...');
  
  // Clean up any test artifacts
  // (Add cleanup logic if needed)
  
  console.log('✅ Security test cleanup complete');
}

// Global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in security tests:', reason);
  // Don't exit process in tests
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in security tests:', error);
  // Don't exit process in tests
});
