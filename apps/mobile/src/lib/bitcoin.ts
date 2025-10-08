/**
 * Bitcoin utilities and constants
 * Provides Bitcoin-specific functionality for the MGS2 codec interface
 */

/**
 * Bitcoin network configuration
 */
export interface BitcoinConfig {
  network: 'mainnet' | 'testnet' | 'signet';
  explorerUrl: string;
  addressPrefix: string;
}

/**
 * Bitcoin address validation result
 */
export interface BitcoinAddressValidation {
  isValid: boolean;
  type?: 'P2PKH' | 'P2SH' | 'P2WPKH' | 'P2WSH' | 'P2TR';
  network?: 'mainnet' | 'testnet';
  error?: string;
}

/**
 * Default Bitcoin configuration (mainnet)
 */
export const DEFAULT_BITCOIN_CONFIG: BitcoinConfig = {
  network: 'mainnet',
  explorerUrl: 'https://blockstream.info',
  addressPrefix: 'bc1',
};

/**
 * Validates a Bitcoin address format
 * Supports all major address types: Legacy, SegWit, Taproot
 */
export function validateBitcoinAddress(address: string): BitcoinAddressValidation {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Bitcoin address is required' };
  }

  const trimmed = address.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Bitcoin address cannot be empty' };
  }

  // Legacy P2PKH addresses (1...)
  if (trimmed.match(/^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/)) {
    return { isValid: true, type: 'P2PKH', network: 'mainnet' };
  }

  // Legacy P2SH addresses (3...)
  if (trimmed.match(/^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/)) {
    return { isValid: true, type: 'P2SH', network: 'mainnet' };
  }

  // SegWit P2WPKH/P2WSH addresses (bc1...)
  if (trimmed.match(/^bc1[a-z0-9]{39,59}$/)) {
    if (trimmed.length === 42) {
      return { isValid: true, type: 'P2WPKH', network: 'mainnet' };
    } else if (trimmed.length === 62) {
      return { isValid: true, type: 'P2WSH', network: 'mainnet' };
    }
    return { isValid: true, type: 'P2WPKH', network: 'mainnet' };
  }

  // Taproot addresses (bc1p...)
  if (trimmed.match(/^bc1p[a-z0-9]{58}$/)) {
    return { isValid: true, type: 'P2TR', network: 'mainnet' };
  }

  // Testnet addresses
  if (trimmed.match(/^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/)) {
    return { isValid: true, type: 'P2PKH', network: 'testnet' };
  }

  if (trimmed.match(/^[2][a-km-zA-HJ-NP-Z1-9]{25,34}$/)) {
    return { isValid: true, type: 'P2SH', network: 'testnet' };
  }

  if (trimmed.match(/^tb1[a-z0-9]{39,59}$/)) {
    return { isValid: true, type: 'P2WPKH', network: 'testnet' };
  }

  if (trimmed.match(/^tb1p[a-z0-9]{58}$/)) {
    return { isValid: true, type: 'P2TR', network: 'testnet' };
  }

  return { 
    isValid: false, 
    error: 'Invalid Bitcoin address format. Supported: Legacy (1...), SegWit (bc1...), Taproot (bc1p...)' 
  };
}

/**
 * Formats a Bitcoin address for display
 */
export function formatBitcoinAddress(address: string, maxLength: number = 20): string {
  const validation = validateBitcoinAddress(address);
  if (!validation.isValid) {
    return 'Invalid Address';
  }

  if (address.length <= maxLength) {
    return address;
  }

  // Show first 6 and last 4 characters
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Generates a Bitcoin block explorer URL
 */
export function getBitcoinExplorerUrl(address: string, config: BitcoinConfig = DEFAULT_BITCOIN_CONFIG): string {
  const validation = validateBitcoinAddress(address);
  if (!validation.isValid) {
    throw new Error('Invalid Bitcoin address');
  }

  return `${config.explorerUrl}/address/${address}`;
}

/**
 * Bitcoin unit conversions
 */
export const BITCOIN_UNITS = {
  BTC_TO_SATOSHI: 100_000_000,
  SATOSHI_TO_BTC: 0.00000001,
} as const;

/**
 * Converts Bitcoin to Satoshis
 */
export function btcToSatoshi(btc: number): number {
  return Math.round(btc * BITCOIN_UNITS.BTC_TO_SATOSHI);
}

/**
 * Converts Satoshis to Bitcoin
 */
export function satoshiToBtc(satoshi: number): number {
  return satoshi * BITCOIN_UNITS.SATOSHI_TO_BTC;
}

/**
 * Formats a Bitcoin amount for display
 */
export function formatBitcoinAmount(amount: number, unit: 'BTC' | 'sats' = 'BTC'): string {
  if (unit === 'sats') {
    return `${amount.toLocaleString()} sats`;
  }
  
  return `${amount.toFixed(8)} BTC`;
}

/**
 * Bitcoin donation configuration (integrates with Lightning)
 */
export const BITCOIN_DONATION_CONFIG = {
  defaultAmount: 21000, // satoshis (0.00021000 BTC)
  amounts: [1000, 5000, 10000, 21000, 50000, 100000], // satoshis
  messages: {
    donationSuccess: 'Thank you for your Bitcoin donation!',
    addressCopied: 'Bitcoin address copied to clipboard',
    invalidAmount: 'Invalid Bitcoin amount',
    networkError: 'Network error - please try again',
  },
  ui: {
    buttonText: 'Donate Bitcoin',
    qrCodeTitle: 'Bitcoin Address',
    instructionsTitle: 'How to donate',
    instructions: [
      'Scan QR code with your Bitcoin wallet',
      'Or copy the address and send manually',
      'Wait for network confirmation',
    ],
  },
} as const;

/**
 * Checks if we're in Bitcoin mode (for conditional Bitcoin features)
 * Integrates with theme system
 */
export function isBitcoinModeActive(currentMode: string): boolean {
  return currentMode === 'bitcoin';
}

/**
 * Default Bitcoin address for donations
 * This should be replaced with actual Bitcoin address in production
 */
export const DEFAULT_BITCOIN_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

/**
 * Bitcoin donation QR code data
 */
export function getBitcoinQRData(address: string, amount?: number): string {
  const validation = validateBitcoinAddress(address);
  if (!validation.isValid) {
    throw new Error(`Invalid Bitcoin address: ${validation.error}`);
  }

  // Bitcoin URI scheme for QR codes
  let uri = `bitcoin:${address}`;
  
  if (amount && amount > 0) {
    const btcAmount = satoshiToBtc(amount);
    uri += `?amount=${btcAmount.toFixed(8)}`;
  }

  return uri;
}
