#!/usr/bin/env node

/**
 * Lightning Network Test Utilities for CI
 * 
 * Simple Node.js utilities for validating Lightning Network
 * functionality during CI/CD pipeline execution
 */

/**
 * Validate a Lightning address format
 * @param {string} address - Lightning address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateLightningAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const trimmed = address.trim();
  const lightningRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!lightningRegex.test(trimmed)) {
    return false;
  }

  const [username, domain] = trimmed.split('@');
  
  if (!username || username.length < 1) {
    return false;
  }

  if (!domain || domain.length < 3) {
    return false;
  }

  if (!domain.includes('.')) {
    return false;
  }

  return true;
}

/**
 * Generate QR code data for a Lightning address
 * @param {string} address - Lightning address
 * @returns {string} - QR code data with lightning: URI scheme
 */
function generateQRData(address) {
  if (!validateLightningAddress(address)) {
    throw new Error('Invalid lightning address format');
  }
  
  // Use lightning: URI scheme for proper wallet recognition
  return `lightning:${address.trim()}`;
}

/**
 * Test Lightning address validation with various scenarios
 * @returns {object} - Test results
 */
function runValidationTests() {
  const testCases = [
    { address: 'johndtwaldron@strike.me', shouldPass: true },
    { address: 'user@getalby.com', shouldPass: true },
    { address: 'test@walletofsatoshi.com', shouldPass: true },
    { address: 'invalid.address.com', shouldPass: false },
    { address: 'user@', shouldPass: false },
    { address: '@domain.com', shouldPass: false },
    { address: '', shouldPass: false },
    { address: null, shouldPass: false },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ address, shouldPass }) => {
    const result = validateLightningAddress(address);
    if (result === shouldPass) {
      passed++;
      console.log(`✅ Validation test passed: ${address || 'null'}`);
    } else {
      failed++;
      console.log(`❌ Validation test failed: ${address || 'null'} - expected ${shouldPass}, got ${result}`);
    }
  });

  return { passed, failed };
}

/**
 * Test QR code generation
 * @returns {object} - Test results
 */
function runQRTests() {
  const testCases = [
    'johndtwaldron@strike.me',
    'user@getalby.com',
    'test@walletofsatoshi.com',
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(address => {
    try {
      const qrData = generateQRData(address);
      const expectedQR = `lightning:${address}`;
      
      if (qrData === expectedQR) {
        passed++;
        console.log(`✅ QR test passed: ${address} -> ${qrData}`);
      } else {
        failed++;
        console.log(`❌ QR test failed: ${address} - expected ${expectedQR}, got ${qrData}`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ QR test failed: ${address} - ${error.message}`);
    }
  });

  return { passed, failed };
}

// Export functions for use in CI
module.exports = {
  validateLightningAddress,
  generateQRData,
  runValidationTests,
  runQRTests
};

// If run directly, execute tests
if (require.main === module) {
  console.log('🧪 Running Lightning Network test utilities...\n');
  
  console.log('📡 Testing Lightning address validation...');
  const validationResults = runValidationTests();
  
  console.log('\n⚡ Testing QR code generation...');
  const qrResults = runQRTests();
  
  const totalPassed = validationResults.passed + qrResults.passed;
  const totalFailed = validationResults.failed + qrResults.failed;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 All Lightning utilities tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some Lightning utilities tests failed!');
    process.exit(1);
  }
}
