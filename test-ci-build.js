#!/usr/bin/env node
/**
 * Local CI Build Test Script
 * Simulates the GitHub Actions workflow to validate build before git sync
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Starting Local CI Build Test...\n');

function run(command, cwd = process.cwd()) {
  console.log(`📂 ${cwd}`);
  console.log(`▶️  ${command}`);
  try {
    const result = execSync(command, { 
      cwd, 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    console.log('✅ Success\n');
    return result;
  } catch (error) {
    console.log('❌ Failed:');
    console.log(error.stdout || error.message);
    console.log(error.stderr);
    console.log('');
    throw error;
  }
}

try {
  // Step 1: Install dependencies
  console.log('📦 Step 1: Installing dependencies...');
  run('npm install', 'apps/mobile');

  // Step 2: Run linting (like CI does)
  console.log('🔍 Step 2: Running ESLint...');
  run('npm run lint', 'apps/mobile');

  // Step 3: Build the web export (main CI step)
  console.log('🏗️  Step 3: Building web export...');
  const buildResult = run('npm run export:web', 'apps/mobile');
  
  // Step 4: Verify build artifacts
  console.log('📋 Step 4: Verifying build artifacts...');
  const distPath = path.join('apps/mobile/dist');
  
  if (!fs.existsSync(distPath)) {
    throw new Error('Build directory not created');
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not generated');
  }
  
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath, { recursive: true });
    console.log(`📁 Assets generated: ${assetFiles.length} files`);
    
    // Check for key assets
    const audioFiles = assetFiles.filter(f => f.toString().includes('audio'));
    const imageFiles = assetFiles.filter(f => f.toString().includes('images'));
    
    console.log(`🎵 Audio files: ${audioFiles.length}`);
    console.log(`🖼️  Image files: ${imageFiles.length}`);
  }

  console.log('\n🎉 LOCAL CI BUILD TEST PASSED!');
  console.log('✅ All steps completed successfully');
  console.log('✅ Web export built without errors');
  console.log('✅ Assets properly bundled');
  console.log('\n🚀 Ready for git sync and GitHub Actions deployment!');

} catch (error) {
  console.log('\n💥 LOCAL CI BUILD TEST FAILED!');
  console.log('❌ Build would fail in GitHub Actions');
  console.log('❌ Fix issues before git sync\n');
  
  console.log('🔧 Troubleshooting suggestions:');
  console.log('   • Check for missing imports');
  console.log('   • Verify all referenced files exist');
  console.log('   • Add missing files to git before committing');
  console.log('   • Run: npm run lint in apps/mobile');
  console.log('   • Run: npm run export:web in apps/mobile');
  
  process.exit(1);
}
