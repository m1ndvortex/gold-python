#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Verify that the production build doesn't contain test files
 */
function verifyBuild() {
  const buildDir = path.join(__dirname, '..', 'build');
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Run npm run build first.');
    process.exit(1);
  }

  console.log('🔍 Verifying production build...');
  
  const issues = [];
  
  // Check for test files in build
  function checkDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const itemRelativePath = path.join(relativePath, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        checkDirectory(fullPath, itemRelativePath);
      } else {
        // Check for test-related files
        if (item.includes('.test.') || 
            item.includes('.spec.') || 
            item.includes('__tests__') ||
            item.includes('test-utils') ||
            item.includes('setupTests')) {
          issues.push(`Test file found in build: ${itemRelativePath}`);
        }
      }
    }
  }
  
  checkDirectory(buildDir);
  
  // Check build size (should be reasonable for production)
  const buildStats = getBuildStats(buildDir);
  console.log(`📦 Build size: ${(buildStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📄 Total files: ${buildStats.fileCount}`);
  
  if (buildStats.totalSize > 50 * 1024 * 1024) { // 50MB threshold
    issues.push(`Build size is unusually large: ${(buildStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  }
  
  // Report results
  if (issues.length === 0) {
    console.log('✅ Build verification passed!');
    console.log('   - No test files found in production build');
    console.log('   - Build size is within acceptable limits');
    process.exit(0);
  } else {
    console.error('❌ Build verification failed:');
    issues.forEach(issue => console.error(`   - ${issue}`));
    process.exit(1);
  }
}

function getBuildStats(dir) {
  let totalSize = 0;
  let fileCount = 0;
  
  function calculateSize(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        calculateSize(fullPath);
      } else {
        totalSize += stats.size;
        fileCount++;
      }
    }
  }
  
  calculateSize(dir);
  return { totalSize, fileCount };
}

verifyBuild();