/**
 * Vitest Configuration for Security Tests
 * 
 * Specialized configuration for running security-focused tests
 * with appropriate timeouts and environment setup.
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test file patterns for security tests
    include: [
      'apps/edge/lib/__tests__/security.test.ts',
      'apps/mobile/src/lib/__tests__/security.test.ts',
      'tests/security-integration.test.ts'
    ],
    
    // Environment setup
    environment: 'node',
    
    // Timeouts for integration tests
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    
    // Global setup and teardown
    globalSetup: './tests/security-setup.ts',
    
    // Coverage configuration for security modules
    coverage: {
      provider: 'v8',
      include: [
        'apps/edge/lib/security.ts',
        'apps/mobile/src/lib/security.ts'
      ],
      exclude: [
        'node_modules',
        'dist',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      thresholds: {
        functions: 80,
        lines: 80,
        branches: 70,
        statements: 80
      },
      reporter: ['text', 'html', 'lcov']
    },
    
    // Reporters
    reporter: ['verbose', 'html'],
    outputFile: {
      html: './test-results/security-tests.html'
    },
    
    // Retry failed tests once (useful for integration tests)
    retry: 1,
    
    // Run tests in sequence for integration tests to avoid port conflicts
    sequence: {
      concurrent: false
    },
    
    // Test isolation
    isolate: true,
    
    // Pool options
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true // Ensure single process for server tests
      }
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/mobile/src'),
      '~': path.resolve(__dirname, 'apps/edge')
    }
  },
  
  // Define global constants for tests
  define: {
    __TEST_ENV__: '"security"'
  }
});
