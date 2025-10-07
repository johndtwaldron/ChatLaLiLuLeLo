/**
 * Lightning Network donation configuration
 * 
 * UPDATE THIS FILE with your actual lightning address and preferences
 */

export const LIGHTNING_DONATION_CONFIG = {
  /**
   * Your Lightning Address (format: user@domain.com)
   * 
   * Examples:
   * - 'you@getalby.com' (Alby)
   * - 'you@strike.me' (Strike) 
   * - 'you@walletofsatoshi.com' (Wallet of Satoshi)
   * - 'you@blink.sv' (Blink)
   * - 'you@lnurl.com' (LNURL services)
   */
  lightningAddress: 'donations@example.com', // 👈 CHANGE THIS TO YOUR LIGHTNING ADDRESS
  
  /**
   * Display settings for the QR code
   */
  display: {
    showAddressText: true,      // Show the address text below QR code
    showCopyButton: true,       // Show copy button for easy sharing
    enableSoundOnCopy: true,    // Play sound effect when copied
  },
  
  /**
   * QR code styling preferences
   */
  qrStyle: {
    size: 80,                   // QR code size in portrait mode (pixels)
    errorCorrectionLevel: 'M',  // L, M, Q, H (higher = more resilient but larger)
    quietZone: 2,              // Border around QR code
  },
  
  /**
   * Messages shown to users
   */
  messages: {
    copySuccess: '⚡ Lightning address copied!',
    copyError: '❌ Failed to copy address',
    invalidAddress: '⚠️ Invalid Lightning address',
    bitcoinModeHint: 'Switch to BTC mode to see Lightning donations',
    donationMessage: 'Please scan the QR code to explore how to donate satoshis to this project and its development team to keep fighting the La Li Lu Le Lo',
  },
  
  /**
   * Integration settings
   */
  integration: {
    showOnlyInBitcoinMode: true,  // Only show QR when in Bitcoin/BTC mode
    replaceUserPortrait: true,    // Replace user portrait completely (vs overlay)
    maintainDraggable: true,      // Keep Lightning QR draggable like normal portraits
  }
};

/**
 * Validation: Check if lightning address is configured
 */
export const isLightningConfigured = (): boolean => {
  const address = LIGHTNING_DONATION_CONFIG.lightningAddress;
  return address !== 'donations@example.com' && address.includes('@') && address.includes('.');
};

/**
 * Get the configured lightning address
 */
export const getLightningAddress = (): string => {
  return LIGHTNING_DONATION_CONFIG.lightningAddress;
};

/**
 * Instructions for setup (shown in development/debug mode)
 */
export const SETUP_INSTRUCTIONS = `
🟠 Lightning Donations Setup:

1. Open: apps/mobile/src/config/lightning.config.ts
2. Replace 'donations@example.com' with your lightning address
3. Optional: Customize display settings and messages
4. Restart the development server
5. Switch to BTC mode to see your Lightning QR code!

Lightning Address Examples:
• you@getalby.com (Alby Wallet)
• you@strike.me (Strike)
• you@walletofsatoshi.com 
• you@blink.sv (Blink)

Test it: Switch to BTC mode and click on the user portrait area!
`;
