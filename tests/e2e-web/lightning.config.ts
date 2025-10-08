/**
 * Lightning Network E2E Test Configuration
 * 
 * Specialized Playwright configuration for Lightning Network integration tests
 * Optimized for Bitcoin mode testing and QR code validation
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e-web',
  testMatch: ['**/lightning-*.spec.ts'],
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'tests/e2e-web/reports/lightning' }],
    ['json', { outputFile: 'tests/e2e-web/reports/lightning-results.json' }],
    ['junit', { outputFile: 'tests/e2e-web/reports/lightning-results.xml' }]
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:14085',
    
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording for failed tests */
    video: 'retain-on-failure',
    
    /* Viewport settings optimized for codec interface */
    viewport: { width: 1280, height: 720 },
    
    /* Longer timeout for Lightning QR generation */
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  /* Global timeout for each test */
  timeout: 30000,
  
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },
    
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },
    
    /* Test against mobile viewports for responsive QR display */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },
  ],

  /* Folder for test artifacts */
  outputDir: 'tests/e2e-web/test-results/lightning',
  
  /* Run local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    port: 14085,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  
  /* Global setup for Lightning tests */
  globalSetup: require.resolve('./lightning-global-setup.ts'),
  
  /* Test metadata for CI integration */
  metadata: {
    testType: 'e2e-lightning',
    component: 'Lightning Network Integration',
    version: '1.0.0'
  }
});
