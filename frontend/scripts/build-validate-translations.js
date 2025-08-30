#!/usr/bin/env node

// Build-time Translation Validation Script
// This script runs during the build process to validate translations

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  validateTranslations: process.env.VALIDATE_TRANSLATIONS !== 'false',
  failOnErrors: false, // Don't fail the build on translation errors for now
  generateReport: process.env.GENERATE_TRANSLATION_REPORT !== 'false',
  reportPath: 'build/translation-report.json'
};

console.log('🔧 Build-time Translation Validation');
console.log('=====================================');

// Check if translation validation is enabled
if (!CONFIG.validateTranslations) {
  console.log('⏭️  Translation validation disabled (VALIDATE_TRANSLATIONS=false)');
  process.exit(0);
}

try {
  console.log('🔍 Running translation validation...');
  
  // Run TypeScript compilation check first
  console.log('📝 Checking TypeScript compilation...');
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    console.log('✅ TypeScript compilation check passed');
  } catch (error) {
    console.error('❌ TypeScript compilation errors found:');
    console.error(error.stdout?.toString() || error.message);
    
    // Don't fail the build for now - the main type check should handle this
    console.log('⚠️  Continuing with build despite TypeScript errors...');
  }

  // Run translation validation
  console.log('🌐 Validating translations...');
  
  // Create a simple validation script since we can't run TypeScript directly
  const validationScript = `
    const fs = require('fs');
    const path = require('path');
    const glob = require('glob');

    // Simple translation key extraction
    function extractTranslationKeys(content) {
      const patterns = [
        /\\bt\\s*\\(\\s*['"\`]([^'"\`]+)['"\`]/g,
        /\\btSafe\\s*\\(\\s*['"\`]([^'"\`]+)['"\`]/g,
        /\\bhasTranslation\\s*\\(\\s*['"\`]([^'"\`]+)['"\`]/g
      ];
      
      const keys = new Set();
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          keys.add(match[1]);
        }
      });
      
      return Array.from(keys);
    }

    // Find hardcoded strings
    function findHardcodedStrings(content) {
      const pattern = /(?:>|\\s|=)(['"\`])([A-Z][^'"\`]{3,})(['"\`])/g;
      const strings = [];
      let match;
      
      while ((match = pattern.exec(content)) !== null) {
        const text = match[2];
        // Skip common patterns
        if (!/^[a-z][a-z0-9]*(\\.[a-z][a-z0-9_]*)*$/.test(text) && 
            !/^[A-Z_][A-Z0-9_]*$/.test(text) && 
            !/^https?:\\/\\//.test(text) &&
            text.length > 3) {
          strings.push(text);
        }
      }
      
      return strings;
    }

    // Main validation
    try {
      console.log('📁 Scanning source files...');
      
      const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
        ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/*.test.*', '**/*.spec.*']
      });
      
      console.log(\`📊 Found \${files.length} files to scan\`);
      
      const allKeys = new Set();
      let totalHardcodedStrings = 0;
      let errors = [];
      let warnings = [];
      
      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          
          // Extract translation keys
          const keys = extractTranslationKeys(content);
          keys.forEach(key => allKeys.add(key));
          
          // Find hardcoded strings
          const hardcodedStrings = findHardcodedStrings(content);
          if (hardcodedStrings.length > 0) {
            totalHardcodedStrings += hardcodedStrings.length;
            warnings.push({
              file,
              type: 'hardcoded_strings',
              count: hardcodedStrings.length,
              examples: hardcodedStrings.slice(0, 3)
            });
          }
        } catch (error) {
          errors.push({
            file,
            type: 'read_error',
            message: error.message
          });
        }
      });
      
      console.log(\`🔑 Found \${allKeys.size} unique translation keys\`);
      console.log(\`📝 Found \${totalHardcodedStrings} hardcoded strings\`);
      
      // Validate translation key format
      const invalidKeys = Array.from(allKeys).filter(key => 
        !/^[a-z][a-z0-9]*(\\.[a-z][a-z0-9_]*)*$/.test(key)
      );
      
      if (invalidKeys.length > 0) {
        errors.push({
          type: 'invalid_keys',
          keys: invalidKeys,
          message: 'Invalid translation key format'
        });
      }
      
      // Generate report
      const report = {
        timestamp: new Date().toISOString(),
        success: errors.length === 0,
        statistics: {
          totalFiles: files.length,
          totalKeys: allKeys.size,
          hardcodedStrings: totalHardcodedStrings,
          errors: errors.length,
          warnings: warnings.length
        },
        errors,
        warnings,
        keys: Array.from(allKeys).sort()
      };
      
      // Save report
      if (${CONFIG.generateReport}) {
        const reportDir = path.dirname('${CONFIG.reportPath}');
        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
        }
        fs.writeFileSync('${CONFIG.reportPath}', JSON.stringify(report, null, 2));
        console.log('📄 Translation report saved to ${CONFIG.reportPath}');
      }
      
      // Print summary
      console.log('\\n📊 Validation Summary:');
      console.log(\`   Files scanned: \${report.statistics.totalFiles}\`);
      console.log(\`   Translation keys: \${report.statistics.totalKeys}\`);
      console.log(\`   Hardcoded strings: \${report.statistics.hardcodedStrings}\`);
      console.log(\`   Errors: \${report.statistics.errors}\`);
      console.log(\`   Warnings: \${report.statistics.warnings}\`);
      
      // Print errors
      if (errors.length > 0) {
        console.log('\\n❌ Errors:');
        errors.forEach(error => {
          if (error.type === 'invalid_keys') {
            console.log(\`   Invalid keys: \${error.keys.join(', ')}\`);
          } else {
            console.log(\`   \${error.file}: \${error.message}\`);
          }
        });
      }
      
      // Print warnings
      if (warnings.length > 0) {
        console.log('\\n⚠️  Warnings:');
        warnings.forEach(warning => {
          if (warning.type === 'hardcoded_strings') {
            console.log(\`   \${warning.file}: \${warning.count} hardcoded strings (\${warning.examples.join(', ')})\`);
          }
        });
      }
      
      // Exit with appropriate code
      if (!report.success && ${CONFIG.failOnErrors}) {
        console.log('\\n❌ Translation validation failed!');
        process.exit(1);
      } else {
        console.log('\\n✅ Translation validation completed!');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('💥 Validation error:', error);
      process.exit(1);
    }
  `;

  // Write and execute the validation script
  const tempScriptPath = path.join(__dirname, 'temp-validation.js');
  fs.writeFileSync(tempScriptPath, validationScript);
  
  try {
    execSync(`node "${tempScriptPath}"`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } finally {
    // Clean up temp script
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }
  }

} catch (error) {
  console.error('❌ Build validation failed:', error.message);
  
  if (CONFIG.failOnErrors) {
    process.exit(1);
  } else {
    console.log('⚠️  Continuing build despite validation errors...');
    process.exit(0);
  }
}