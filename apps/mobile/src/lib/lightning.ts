/**
 * Lightning Network utilities for Bitcoin donations
 * Handles lightning addresses, QR code generation, and validation
 */

export interface LightningAddress {
  username: string;
  domain: string;
  full: string; // user@domain.com format
}

export interface LightningValidationResult {
  isValid: boolean;
  error?: string;
  address?: LightningAddress;
}

/**
 * Validates a lightning address format (user@domain.com)
 */
export function validateLightningAddress(address: string): LightningValidationResult {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Lightning address is required' };
  }

  const trimmed = address.trim();
  
  // Basic format check: user@domain.com
  const lightningRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!lightningRegex.test(trimmed)) {
    return { 
      isValid: false, 
      error: 'Invalid lightning address format. Expected: user@domain.com' 
    };
  }

  const [username, domain] = trimmed.split('@');
  
  // Additional validation
  if (!username || username.length < 1) {
    return { isValid: false, error: 'Username part cannot be empty' };
  }

  if (!domain || domain.length < 3) {
    return { isValid: false, error: 'Domain part is too short' };
  }

  // Check for valid domain structure
  if (!domain.includes('.')) {
    return { isValid: false, error: 'Domain must contain a dot' };
  }

  return {
    isValid: true,
    address: {
      username,
      domain,
      full: trimmed
    }
  };
}

/**
 * Formats a lightning address for display
 */
export function formatLightningAddress(address: string): string {
  const validation = validateLightningAddress(address);
  if (validation.isValid && validation.address) {
    return validation.address.full;
  }
  return address; // Return as-is if invalid
}

/**
 * Generates the data for QR code from lightning address
 * For lightning addresses, we typically use "lightning:" prefix
 */
export function getLightningQRData(address: string): string {
  const validation = validateLightningAddress(address);
  if (!validation.isValid || !validation.address) {
    throw new Error(`Invalid lightning address: ${validation.error}`);
  }
  
  // For lightning addresses, use the address directly
  // Some wallets support "lightning:" prefix, others just the address
  return validation.address.full;
}

/**
 * Generates a lightning invoice QR data (for future backend integration)
 */
export function getLightningInvoiceQRData(invoice: string): string {
  if (!invoice || typeof invoice !== 'string') {
    throw new Error('Lightning invoice is required');
  }
  
  const trimmed = invoice.trim();
  
  // Lightning invoices start with "lnbc" (mainnet) or "lntb" (testnet)
  if (!trimmed.toLowerCase().startsWith('ln')) {
    throw new Error('Invalid lightning invoice format');
  }
  
  return trimmed.toLowerCase();
}

/**
 * Checks if we're in Bitcoin mode (for conditional Lightning features)
 */
export function isBitcoinModeActive(currentMode: string): boolean {
  return currentMode === 'bitcoin';
}

/**
 * Gets the appropriate QR code size for the UI context
 */
export function getQRCodeSize(context: 'portrait' | 'modal' | 'fullscreen' = 'portrait'): number {
  switch (context) {
    case 'portrait':
      return 100; // Small QR for portrait overlay
    case 'modal':
      return 200; // Medium QR for popup modal
    case 'fullscreen':
      return 300; // Large QR for dedicated screen
    default:
      return 100;
  }
}

/**
 * Default lightning address configuration
 * This will be replaced with user's actual lightning address
 */
export const DEFAULT_LIGHTNING_ADDRESS = 'donations@example.com';

/**
 * Lightning donation configuration
 */
export const LIGHTNING_CONFIG = {
  // Default suggested amounts in satoshis
  suggestedAmounts: [1000, 5000, 10000, 50000, 100000], // 1k to 100k sats
  
  // QR code styling
  qrStyle: {
    size: 200,
    fgColor: '#000000',
    bgColor: '#ffffff',
    level: 'M' as const, // Error correction level
  },
  
  // Copy feedback messages
  messages: {
    copySuccess: 'Lightning address copied!',
    copyError: 'Failed to copy address',
    qrGenerateError: 'Failed to generate QR code',
    invalidAddress: 'Invalid lightning address',
  }
};
