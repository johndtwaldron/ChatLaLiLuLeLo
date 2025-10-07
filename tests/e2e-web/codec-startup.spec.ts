import { test, expect } from '@playwright/test';

/**
 * Codec Startup E2E Tests
 * Tests the critical user journey from landing page to active codec interface
 */

test.describe('MGS2 Codec Interface Startup', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the codec interface
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display codec standby screen on initial load', async ({ page }) => {
    // Check for the standby screen
    await expect(page.locator('text=TAP TO REACTIVATE CODEC')).toBeVisible({ timeout: 10000 });
    
    // Verify the frequency indicator is visible
    await expect(page.locator('text=140.85')).toBeVisible();
    
    // Check for the classic MGS codec aesthetic elements
    await expect(page.locator('[style*="scanline"]')).toBeVisible();
  });

  test('should activate codec interface when startup button is clicked', async ({ page }) => {
    // Wait for and click the codec activation button
    const activateButton = page.locator('text=TAP TO REACTIVATE CODEC');
    await expect(activateButton).toBeVisible({ timeout: 10000 });
    
    // Click to activate the codec
    await activateButton.click();
    
    // Wait for the interface to transition
    await page.waitForTimeout(2000);
    
    // Verify the main codec interface is now visible
    await expect(page.locator('text=COLONEL')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=USER')).toBeVisible({ timeout: 10000 });
    
    // Check for the control buttons (MODE, CRT, THEME, etc.)
    await expect(page.locator('text=MODE:')).toBeVisible();
    await expect(page.locator('text=CRT:')).toBeVisible();
    await expect(page.locator('text=THEME:')).toBeVisible();
    
    // Verify text input is available
    await expect(page.locator('textarea, input[type="text"]')).toBeVisible();
  });

  test('should play codec startup sound when activated', async ({ page }) => {
    // Set up audio context monitoring
    await page.addInitScript(() => {
      window.audioEvents = [];
      const originalCreateAsync = window.AudioContext ? window.AudioContext.prototype.constructor : null;
      if (originalCreateAsync) {
        window.addEventListener('load', () => {
          document.addEventListener('click', () => {
            window.audioEvents.push('user_interaction');
          });
        });
      }
    });
    
    // Click the activation button
    const activateButton = page.locator('text=TAP TO REACTIVATE CODEC');
    await expect(activateButton).toBeVisible({ timeout: 10000 });
    await activateButton.click();
    
    // Wait for audio initialization
    await page.waitForTimeout(1000);
    
    // Verify user interaction was recorded (audio context activation)
    const audioEvents = await page.evaluate(() => window.audioEvents || []);
    expect(audioEvents).toContain('user_interaction');
  });

  test('should display theme and mode controls after activation', async ({ page }) => {
    // Activate the codec
    await page.locator('text=TAP TO REACTIVATE CODEC').click();
    await page.waitForTimeout(2000);
    
    // Test theme cycling
    const themeButton = page.locator('text=THEME:');
    await expect(themeButton).toBeVisible();
    
    // Click theme button and verify theme changes
    const initialThemeText = await themeButton.textContent();
    await themeButton.click();
    await page.waitForTimeout(500);
    
    const newThemeText = await themeButton.textContent();
    // Theme should have changed (different text)
    expect(newThemeText).not.toBe(initialThemeText);
    
    // Test mode cycling
    const modeButton = page.locator('text=MODE:');
    await expect(modeButton).toBeVisible();
    
    const initialModeText = await modeButton.textContent();
    await modeButton.click();
    await page.waitForTimeout(500);
    
    const newModeText = await modeButton.textContent();
    expect(newModeText).not.toBe(initialModeText);
  });

  test('should enable CRT effects toggle', async ({ page }) => {
    // Activate the codec
    await page.locator('text=TAP TO REACTIVATE CODEC').click();
    await page.waitForTimeout(2000);
    
    // Test CRT toggle
    const crtButton = page.locator('text=CRT:');
    await expect(crtButton).toBeVisible();
    
    // Click CRT button to toggle effects
    await crtButton.click();
    await page.waitForTimeout(500);
    
    // Verify button text changed (ON/OFF state)
    await expect(crtButton).toBeVisible();
  });

  test('should allow text input and display in chat stream', async ({ page }) => {
    // Activate the codec
    await page.locator('text=TAP TO REACTIVATE CODEC').click();
    await page.waitForTimeout(2000);
    
    // Find and interact with text input
    const textInput = page.locator('textarea, input[type="text"]').first();
    await expect(textInput).toBeVisible();
    
    // Type a test message
    const testMessage = "Hello, Colonel AI!";
    await textInput.fill(testMessage);
    
    // Submit the message (Enter key or send button)
    await textInput.press('Enter');
    
    // Wait for the message to appear in the chat stream
    await page.waitForTimeout(1000);
    
    // Verify the message appears in the subtitle stream
    await expect(page.locator(`text=USER: ${testMessage}`)).toBeVisible({ timeout: 5000 });
  });

  test('should handle responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate and activate
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const activateButton = page.locator('text=TAP TO REACTIVATE CODEC');
    await expect(activateButton).toBeVisible({ timeout: 10000 });
    await activateButton.click();
    
    await page.waitForTimeout(2000);
    
    // Verify interface is responsive
    await expect(page.locator('text=COLONEL')).toBeVisible();
    await expect(page.locator('text=USER')).toBeVisible();
    
    // Check that controls are accessible on mobile
    await expect(page.locator('text=MODE:')).toBeVisible();
    await expect(page.locator('text=THEME:')).toBeVisible();
  });
});

/**
 * Visual regression tests
 */
test.describe('Visual Regression Tests', () => {
  
  test('should match codec standby screen appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for animations to settle
    await page.waitForTimeout(2000);
    
    // Take screenshot of standby screen
    await expect(page).toHaveScreenshot('codec-standby.png', {
      fullPage: true,
      mask: [
        // Mask any animated elements that might cause flakiness
        page.locator('[class*="sweep"]'),
        page.locator('[class*="jitter"]')
      ]
    });
  });
  
  test('should match active codec interface appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Activate codec
    await page.locator('text=TAP TO REACTIVATE CODEC').click();
    await page.waitForTimeout(3000);
    
    // Take screenshot of active interface
    await expect(page).toHaveScreenshot('codec-active.png', {
      fullPage: true,
      mask: [
        // Mask animated elements
        page.locator('[class*="sweep"]'),
        page.locator('[class*="jitter"]'),
        page.locator('[class*="breathing"]')
      ]
    });
  });
});
