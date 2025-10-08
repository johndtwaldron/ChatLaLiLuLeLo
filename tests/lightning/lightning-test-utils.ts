/**
 * Lightning Network Testing Utilities
 * 
 * Comprehensive testing utilities for Lightning address validation,
 * QR code generation, and CI/CD integration testing
 */

import { validateLightningAddress, getLightningQRData, isBitcoinModeActive } from '@/lib/lightning';
import { LIGHTNING_DONATION_CONFIG } from '@/config/lightning.config';

// Test Lightning addresses for different scenarios
export const TEST_LIGHTNING_ADDRESSES = {
  // Valid addresses
  valid: {
    strike: 'johndtwaldron@strike.me',
    alby: 'testuser@getalby.com',
    walletOfSatoshi: 'testuser@walletofsatoshi.com',
    blink: 'testuser@blink.sv',
    generic: 'user@example.com'
  },
  // Invalid addresses for negative testing
  invalid: {
    noAt: 'invalidaddress.com',
    noDomain: 'user@',
    noUser: '@domain.com',
    noDot: 'user@domain',
    empty: '',
    null: null,
    whitespace: '   ',
    invalidChars: 'user@dom<ain.com',
    tooShort: 'u@d.c'
  }
};

// Expected QR data for validation (with lightning: URI scheme)
export const EXPECTED_QR_DATA = {
  strike: 'lightning:johndtwaldron@strike.me', // Lightning addresses with URI scheme
  alby: 'lightning:testuser@getalby.com',
  // Can be extended with specific invoice formats if needed
};

/**
 * Test Lightning address validation comprehensively
 */
export function testLightningAddressValidation(): TestResult {
  const results: TestResult = { passed: 0, failed: 0, errors: [] };
  
  // Test valid addresses
  Object.entries(TEST_LIGHTNING_ADDRESSES.valid).forEach(([name, address]) => {
    try {
      const validation = validateLightningAddress(address);
      if (validation.isValid) {
        results.passed++;
        console.log(`✅ Valid address test passed: ${name} (${address})`);
      } else {
        results.failed++;
        results.errors.push(`❌ Valid address test failed: ${name} - ${validation.error}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`❌ Exception in valid address test ${name}: ${error}`);
    }
  });
  
  // Test invalid addresses
  Object.entries(TEST_LIGHTNING_ADDRESSES.invalid).forEach(([name, address]) => {
    try {
      const validation = validateLightningAddress(address as string);
      if (!validation.isValid) {
        results.passed++;
        console.log(`✅ Invalid address test passed: ${name} correctly rejected`);
      } else {
        results.failed++;
        results.errors.push(`❌ Invalid address test failed: ${name} was incorrectly accepted`);
      }
    } catch (error) {
      // Exceptions are acceptable for invalid input
      results.passed++;
      console.log(`✅ Invalid address test passed: ${name} threw exception (expected)`);
    }
  });
  
  return results;
}

/**
 * Test QR code data generation
 */
export function testQRCodeGeneration(): TestResult {
  const results: TestResult = { passed: 0, failed: 0, errors: [] };
  
  Object.entries(TEST_LIGHTNING_ADDRESSES.valid).forEach(([name, address]) => {
    try {
      const qrData = getLightningQRData(address);
      if (qrData && qrData.includes('@')) {
        results.passed++;
        console.log(`✅ QR generation test passed: ${name} -> ${qrData}`);
      } else {
        results.failed++;
        results.errors.push(`❌ QR generation test failed: ${name} - invalid QR data`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`❌ QR generation test failed: ${name} - ${error}`);
    }
  });
  
  return results;
}

/**
 * Test Bitcoin mode detection
 */
export function testBitcoinModeDetection(): TestResult {
  const results: TestResult = { passed: 0, failed: 0, errors: [] };
  
  const testCases = [
    { mode: 'bitcoin', expected: true, desc: 'Bitcoin mode' },
    { mode: 'haywire', expected: false, desc: 'Haywire mode' },
    { mode: 'jd', expected: false, desc: 'JD mode' },
    { mode: 'lore', expected: false, desc: 'Lore mode' },
    { mode: '', expected: false, desc: 'Empty mode' },
    { mode: 'invalid', expected: false, desc: 'Invalid mode' }
  ];
  
  testCases.forEach(({ mode, expected, desc }) => {
    try {
      const result = isBitcoinModeActive(mode);
      if (result === expected) {
        results.passed++;
        console.log(`✅ Bitcoin mode detection passed: ${desc}`);
      } else {
        results.failed++;
        results.errors.push(`❌ Bitcoin mode detection failed: ${desc} - expected ${expected}, got ${result}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`❌ Bitcoin mode detection error: ${desc} - ${error}`);
    }
  });
  
  return results;
}

/**
 * Test the current configuration
 */
export function testCurrentConfiguration(): TestResult {
  const results: TestResult = { passed: 0, failed: 0, errors: [] };
  
  try {
    // Test configured address
    const configuredAddress = LIGHTNING_DONATION_CONFIG.lightningAddress;
    const validation = validateLightningAddress(configuredAddress);
    
    if (validation.isValid) {
      results.passed++;
      console.log(`✅ Configured address is valid: ${configuredAddress}`);
      
      // Test QR generation for configured address
      const qrData = getLightningQRData(configuredAddress);
      const expectedQR = `lightning:${configuredAddress}`;
      if (qrData === expectedQR) {
        results.passed++;
        console.log(`✅ QR generation works for configured address: ${qrData}`);
      } else {
        results.failed++;
        results.errors.push(`❌ QR generation mismatch for configured address - expected: ${expectedQR}, got: ${qrData}`);
      }
    } else {
      results.failed++;
      results.errors.push(`❌ Configured address is invalid: ${validation.error}`);
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`❌ Configuration test error: ${error}`);
  }
  
  return results;
}

/**
 * Mock Lightning address for testing
 * Use this in tests to avoid using the real address
 */
export const MOCK_LIGHTNING_ADDRESS = 'test@mockwallet.com';

/**
 * Mock QR data for testing
 */
export const MOCK_QR_DATA = MOCK_LIGHTNING_ADDRESS;

/**
 * Test result interface
 */
export interface TestResult {
  passed: number;
  failed: number;
  errors: string[];
}

/**
 * Run all Lightning tests
 */
export function runAllLightningTests(): TestResult {
  console.log('\n🧪 Running Lightning Network Tests...\n');
  
  const allResults: TestResult = { passed: 0, failed: 0, errors: [] };
  
  // Run all test suites
  const suites = [
    { name: 'Lightning Address Validation', fn: testLightningAddressValidation },
    { name: 'QR Code Generation', fn: testQRCodeGeneration },
    { name: 'Bitcoin Mode Detection', fn: testBitcoinModeDetection },
    { name: 'Current Configuration', fn: testCurrentConfiguration }
  ];
  
  suites.forEach(({ name, fn }) => {
    console.log(`\n🔬 ${name}:`);
    const result = fn();
    allResults.passed += result.passed;
    allResults.failed += result.failed;
    allResults.errors.push(...result.errors);
    console.log(`   ${result.passed} passed, ${result.failed} failed`);
  });
  
  // Summary
  console.log('\n📊 Lightning Tests Summary:');
  console.log(`   ✅ Passed: ${allResults.passed}`);
  console.log(`   ❌ Failed: ${allResults.failed}`);
  
  if (allResults.errors.length > 0) {
    console.log('\n🚨 Errors:');
    allResults.errors.forEach(error => console.log(`   ${error}`));
  }
  
  return allResults;
}

/**
 * CI-friendly test runner that exits with appropriate code
 */
export function runLightningTestsForCI(): void {
  const results = runAllLightningTests();
  
  if (results.failed === 0) {
    console.log('\n✅ All Lightning tests passed!');
    process.exit(0);
  } else {
    console.log(`\n❌ ${results.failed} Lightning tests failed!`);
    process.exit(1);
  }
}
