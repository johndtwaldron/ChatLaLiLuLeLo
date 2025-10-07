/**
 * Lightning Network E2E Global Setup
 * 
 * Prepares test environment for Lightning Network integration tests
 * Validates Bitcoin mode functionality and Lightning address configuration
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up Lightning Network E2E test environment...');
  
  // Start timing
  const startTime = Date.now();
  
  try {
    // Launch browser for setup validation
    const browser = await chromium.launch();
    const context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write']
    });
    const page = await context.newPage();
    
    console.log('🔍 Validating application availability...');
    
    // Navigate to the application
    await page.goto('http://localhost:14085', { 
      waitUntil: 'networkidle',
      timeout: 20000 
    });
    
    // Wait for codec interface to be ready
    await page.waitForSelector('[data-testid="codec-interface"]', {
      timeout: 15000,
      state: 'visible'
    });
    
    console.log('✅ Application is responding');
    
    // Validate Lightning Network configuration
    console.log('🔍 Validating Lightning configuration...');
    
    // Try switching to Bitcoin mode
    const modeButton = page.locator('text=/MODE:|BTC\\s*\\[|GW\\s*\\[|JD\\s*\\[|MGS\\s*\\[/');
    if (await modeButton.isVisible({ timeout: 5000 })) {
      // Switch to Bitcoin mode
      let currentMode = await modeButton.textContent();
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!currentMode?.includes('BTC') && attempts < maxAttempts) {
        await modeButton.click();
        await page.waitForTimeout(500);
        currentMode = await modeButton.textContent();
        attempts++;
      }
      
      if (currentMode?.includes('BTC')) {
        console.log('✅ Bitcoin mode switch successful');
        
        // Check if Lightning QR appears
        const lightningQR = page.locator('[data-testid="lightning-qr"]');
        try {
          await lightningQR.waitFor({ state: 'visible', timeout: 3000 });
          console.log('✅ Lightning QR code rendering confirmed');
          
          // Validate Lightning address
          const addressText = page.locator('text=johndtwaldron@strike.me');
          if (await addressText.isVisible({ timeout: 2000 })) {
            console.log('✅ Lightning address display confirmed');
          } else {
            console.warn('⚠️  Lightning address text not found (may impact tests)');
          }
          
        } catch (error) {
          console.warn('⚠️  Lightning QR not rendering (may impact tests):', error.message);
        }
        
      } else {
        console.warn('⚠️  Could not switch to Bitcoin mode (may impact tests)');
      }
    } else {
      console.warn('⚠️  MODE button not found (may impact tests)');
    }
    
    // Validate clipboard functionality
    console.log('🔍 Validating clipboard functionality...');
    try {
      await page.evaluate(async () => {
        await navigator.clipboard.writeText('test');
        const text = await navigator.clipboard.readText();
        if (text !== 'test') {
          throw new Error('Clipboard functionality not working');
        }
      });
      console.log('✅ Clipboard functionality confirmed');
    } catch (error) {
      console.warn('⚠️  Clipboard functionality limited:', error.message);
    }
    
    // Clean up
    await browser.close();
    
    const duration = Date.now() - startTime;
    console.log(`🎉 Lightning Network E2E setup complete in ${duration}ms`);
    
    // Store setup results for test reporting
    process.env.LIGHTNING_SETUP_SUCCESS = 'true';
    process.env.LIGHTNING_SETUP_DURATION = duration.toString();
    
  } catch (error) {
    console.error('❌ Lightning Network E2E setup failed:', error.message);
    process.env.LIGHTNING_SETUP_SUCCESS = 'false';
    process.env.LIGHTNING_SETUP_ERROR = error.message;
    
    // Don't fail the entire test suite, but warn
    console.warn('⚠️  Continuing with tests despite setup issues...');
  }
}

export default globalSetup;
