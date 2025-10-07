/**
 * Lightning Network E2E Integration Tests
 * 
 * Tests Lightning address QR code functionality in Bitcoin mode
 * Includes visual validation, clipboard testing, and user flow validation
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Lightning Network Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:14085');
    
    // Wait for the codec interface to load
    await page.waitForSelector('[data-testid="codec-interface"]', { 
      timeout: 10000,
      state: 'visible'
    });
    
    // If there's a startup screen, activate the codec
    const startupButton = page.locator('text=TAP TO REACTIVATE CODEC');
    if (await startupButton.isVisible()) {
      await startupButton.click();
      await page.waitForTimeout(2000); // Allow startup animation
    }
  });

  test('Lightning QR appears when switching to Bitcoin mode', async ({ page }) => {
    // Verify we start in non-Bitcoin mode (no Lightning QR visible)
    const lightningQR = page.locator('[data-testid="lightning-qr"]');
    await expect(lightningQR).not.toBeVisible();
    
    // Find and click MODE button to cycle through modes
    const modeButton = page.locator('text=/MODE:|BTC\\s*\\[|GW\\s*\\[|JD\\s*\\[|MGS\\s*\\[/');
    await expect(modeButton).toBeVisible();
    
    // Click MODE button until we reach Bitcoin mode
    let currentMode = await modeButton.textContent();
    let attempts = 0;
    const maxAttempts = 5; // Safety limit
    
    while (!currentMode?.includes('BTC') && attempts < maxAttempts) {
      await modeButton.click();
      await page.waitForTimeout(500); // Allow mode change
      currentMode = await modeButton.textContent();
      attempts++;
    }
    
    // Verify we reached Bitcoin mode
    expect(currentMode).toContain('BTC');
    
    // Verify theme changed to orange (Bitcoin mode)
    const themeButton = page.locator('text=/THEME:|ORANGE|PURPLE|CYAN|GOLD|GREEN|YELLOW|CRIMSON/');
    const themeText = await themeButton.textContent();
    expect(themeText).toContain('ORANGE');
    
    // Verify Lightning QR is now visible in user portrait area
    await expect(lightningQR).toBeVisible({ timeout: 3000 });
    
    // Verify QR code has the correct Lightning address
    const qrCode = page.locator('[data-testid="lightning-qr"] svg');
    await expect(qrCode).toBeVisible();
    
    // Verify Lightning address is displayed (without URI scheme for display)
    const addressText = page.locator('text=johndtwaldron@strike.me');
    await expect(addressText).toBeVisible();
    
    // Verify QR code contains the lightning: URI scheme
    const qrCodeData = await page.locator('[data-testid="lightning-qr"] svg').getAttribute('data-qr-value');
    expect(qrCodeData).toContain('lightning:johndtwaldron@strike.me');
  });

  test('Lightning address copy functionality works', async ({ page }) => {
    // Switch to Bitcoin mode (reusing logic from previous test)
    await switchToBitcoinMode(page);
    
    // Wait for Lightning QR to appear
    const lightningQR = page.locator('[data-testid="lightning-qr"]');
    await expect(lightningQR).toBeVisible();
    
    // Find and click the copy button
    const copyButton = page.locator('[data-testid="lightning-copy-button"], text=/⚡\\s*COPY/');
    await expect(copyButton).toBeVisible();
    
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Click copy button
    await copyButton.click();
    
    // Verify button shows success state
    await expect(page.locator('text=/✅\\s*COPIED!/i')).toBeVisible({ timeout: 2000 });
    
    // Verify clipboard contains the Lightning address
    const clipboardText = await page.evaluate(async () => {
      return navigator.clipboard.readText();
    });
    expect(clipboardText).toBe('johndtwaldron@strike.me');
    
    // Verify button returns to normal state after timeout
    await expect(page.locator('text=/⚡\\s*COPY/i')).toBeVisible({ timeout: 3000 });
  });

  test('Lightning QR disappears when leaving Bitcoin mode', async ({ page }) => {
    // Switch to Bitcoin mode
    await switchToBitcoinMode(page);
    
    // Verify Lightning QR is visible
    const lightningQR = page.locator('[data-testid="lightning-qr"]');
    await expect(lightningQR).toBeVisible();
    
    // Switch away from Bitcoin mode
    const modeButton = page.locator('text=/BTC\\s*\\[/');
    await modeButton.click();
    await page.waitForTimeout(500);
    
    // Verify we're no longer in Bitcoin mode
    const currentMode = await modeButton.textContent();
    expect(currentMode).not.toContain('BTC');
    
    // Verify Lightning QR is no longer visible
    await expect(lightningQR).not.toBeVisible();
    
    // Verify regular user portrait is back
    const userPortrait = page.locator('[data-testid="user-portrait"], text=USER, text=SOLDIER');
    await expect(userPortrait).toBeVisible();
  });

  test('Lightning QR visual regression test', async ({ page }) => {
    // Switch to Bitcoin mode
    await switchToBitcoinMode(page);
    
    // Wait for Lightning QR to appear and stabilize
    const lightningQR = page.locator('[data-testid="lightning-qr"]');
    await expect(lightningQR).toBeVisible();
    await page.waitForTimeout(1000); // Allow animations to complete
    
    // Take screenshot of Lightning QR component
    await expect(lightningQR).toHaveScreenshot('lightning-qr-component.png', {
      threshold: 0.3, // Allow for some variance in QR generation
      animations: 'disabled'
    });
    
    // Take screenshot of full interface in Bitcoin mode
    await expect(page.locator('[data-testid="codec-interface"]')).toHaveScreenshot('bitcoin-mode-with-lightning.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('Lightning donation message is displayed', async ({ page }) => {
    // Switch to Bitcoin mode
    await switchToBitcoinMode(page);
    
    // Wait for Lightning QR to appear
    const lightningQR = page.locator('[data-testid="lightning-qr"]');
    await expect(lightningQR).toBeVisible();
    
    // Verify donation message is displayed
    const donationMessage = page.locator('text=/Support ChatLaLiLuLeLo development.*Bitcoin.*Lightning/i');
    await expect(donationMessage).toBeVisible({ timeout: 2000 });
    
    // Verify BTC MODE indicator is shown
    const btcIndicator = page.locator('text=BTC MODE');
    await expect(btcIndicator).toBeVisible();
  });

  test('Lightning QR accessibility', async ({ page }) => {
    // Switch to Bitcoin mode
    await switchToBitcoinMode(page);
    
    // Wait for Lightning QR to appear
    const lightningQR = page.locator('[data-testid="lightning-qr"]');
    await expect(lightningQR).toBeVisible();
    
    // Check that QR code has proper accessibility attributes
    const qrCode = page.locator('[data-testid="lightning-qr"] svg');
    
    // Verify QR code is keyboard accessible
    await qrCode.focus();
    expect(await qrCode.evaluate(el => el === document.activeElement)).toBe(true);
    
    // Verify copy button is keyboard accessible
    const copyButton = page.locator('[data-testid="lightning-copy-button"]');
    await copyButton.focus();
    expect(await copyButton.evaluate(el => el === document.activeElement)).toBe(true);
    
    // Test keyboard activation of copy button
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await copyButton.press('Enter');
    await expect(page.locator('text=/✅\\s*COPIED!/i')).toBeVisible({ timeout: 2000 });
  });
});

// Helper function to switch to Bitcoin mode
async function switchToBitcoinMode(page: Page) {
  const modeButton = page.locator('text=/MODE:|BTC\\s*\\[|GW\\s*\\[|JD\\s*\\[|MGS\\s*\\[/');
  await expect(modeButton).toBeVisible();
  
  let currentMode = await modeButton.textContent();
  let attempts = 0;
  const maxAttempts = 5;
  
  while (!currentMode?.includes('BTC') && attempts < maxAttempts) {
    await modeButton.click();
    await page.waitForTimeout(500);
    currentMode = await modeButton.textContent();
    attempts++;
  }
  
  expect(currentMode).toContain('BTC');
  await page.waitForTimeout(500); // Allow theme change
}
