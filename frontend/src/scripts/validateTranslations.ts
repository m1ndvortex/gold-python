#!/usr/bin/env node

/**
 * Build-time Translation Validation Script
 * Validates translation completeness and prevents builds with missing translations
 */

import * as fs from 'fs';
import * as path from 'path';
import { TranslationAuditor } from '../utils/translationAudit';
import { 
  Language,
  TranslationValidationResult 
} from '../types/translation';

// Simple configuration interface for validation
interface TranslationConfig {
  defaultLanguage: Language;
  supportedLanguages: Language[];
  requiredCoverage: number;
}

// Configuration for build-time validation
const BUILD_VALIDATION_CONFIG: TranslationConfig = {
  defaultLanguage: 'fa',
  fallbackLanguage: 'en',
  supportedLanguages: ['en', 'fa'],
  enableFallback: false,
  enableCache: false,
  cacheTimeout: 0,
  enableAudit: true,
  auditInterval: 0,
  enableTypeGeneration: true,
  strictMode: true
};

// Exit codes
const EXIT_CODES = {
  SUCCESS: 0,
  VALIDATION_FAILED: 1,
  CRITICAL_ERROR: 2,
  MISSING_TRANSLATIONS: 3
} as const;

/**
 * Main validation function
 */
async function validateTranslations(): Promise<void> {
  console.log('🔍 Starting translation validation...\n');

  try {
    // Initialize translation manager
    const manager = new TranslationManager(BUILD_VALIDATION_CONFIG);
    
    // Load translations from the existing useLanguage hook
    const translationsPath = path.join(__dirname, '../hooks/useLanguage.ts');
    if (!fs.existsSync(translationsPath)) {
      throw new Error('Translation file not found: useLanguage.ts');
    }

    // For build-time validation, we'll import the translations directly
    // This is a simplified approach - in a real build system, we'd parse the file
    const { translations } = await import('../hooks/useLanguage');
    manager.loadTranslations(translations);

    // Perform validation
    const validation = await performValidation(manager);
    
    // Generate reports
    await generateReports(manager, validation);
    
    // Check if validation passed
    if (validation.isValid && validation.coverage.percentage >= 95) {
      console.log('✅ Translation validation passed!\n');
      console.log(`📊 Coverage: ${validation.coverage.percentage.toFixed(1)}%`);
      console.log(`📝 Total keys: ${validation.coverage.total}`);
      console.log(`✅ Translated: ${validation.coverage.translated}`);
      process.exit(EXIT_CODES.SUCCESS);
    } else {
      console.log('❌ Translation validation failed!\n');
      await printValidationErrors(validation);
      
      if (validation.coverage.percentage < 95) {
        console.log(`❌ Coverage too low: ${validation.coverage.percentage.toFixed(1)}% (minimum: 95%)`);
        process.exit(EXIT_CODES.MISSING_TRANSLATIONS);
      } else {
        process.exit(EXIT_CODES.VALIDATION_FAILED);
      }
    }

  } catch (error) {
    console.error('💥 Critical error during validation:', error);
    process.exit(EXIT_CODES.CRITICAL_ERROR);
  }
}

/**
 * Perform comprehensive validation
 */
async function performValidation(manager: TranslationManager): Promise<TranslationValidationResult> {
  console.log('🔍 Validating translations...');
  
  const validation = manager.validateTranslations();
  
  console.log(`📊 Found ${validation.coverage.total} translation keys`);
  console.log(`✅ Translated: ${validation.coverage.translated}`);
  console.log(`❌ Missing: ${validation.missingKeys.length}`);
  console.log(`⚠️  Unused: ${validation.unusedKeys.length}`);
  console.log(`📈 Coverage: ${validation.coverage.percentage.toFixed(1)}%\n`);
  
  return validation;
}

/**
 * Generate validation reports
 */
async function generateReports(manager: TranslationManager, validation: TranslationValidationResult): Promise<void> {
  const reportsDir = path.join(process.cwd(), 'translation-reports');
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Generate audit report
  const auditReport = manager.generateAuditReport();
  const auditReportPath = path.join(reportsDir, 'audit-report.json');
  fs.writeFileSync(auditReportPath, JSON.stringify(auditReport, null, 2));
  
  // Generate validation report
  const validationReportPath = path.join(reportsDir, 'validation-report.json');
  fs.writeFileSync(validationReportPath, JSON.stringify(validation, null, 2));
  
  // Generate human-readable summary
  const summary = await generateSummaryReport(validation);
  const summaryPath = path.join(reportsDir, 'translation-summary.md');
  fs.writeFileSync(summaryPath, summary);
  
  console.log(`📄 Reports generated in: ${reportsDir}`);
}

/**
 * Generate human-readable summary report
 */
async function generateSummaryReport(validation: TranslationValidationResult): Promise<string> {
  const timestamp = new Date().toISOString();
  
  const summary = [
    '# Translation Validation Report',
    `Generated: ${timestamp}`,
    '',
    '## Summary',
    `- **Total Keys**: ${validation.coverage.total}`,
    `- **Translated**: ${validation.coverage.translated}`,
    `- **Coverage**: ${validation.coverage.percentage.toFixed(1)}%`,
    `- **Status**: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}`,
    '',
    '## Issues',
    `- **Critical Errors**: ${validation.errors.length}`,
    `- **Warnings**: ${validation.warnings.length}`,
    `- **Missing Keys**: ${validation.missingKeys.length}`,
    `- **Unused Keys**: ${validation.unusedKeys.length}`,
    ''
  ];

  if (validation.errors.length > 0) {
    summary.push('### Critical Errors');
    validation.errors.forEach(error => {
      summary.push(`- **${error.key}**: ${error.message}`);
      if (error.suggestion) {
        summary.push(`  - *Suggestion*: ${error.suggestion}`);
      }
    });
    summary.push('');
  }

  if (validation.missingKeys.length > 0) {
    summary.push('### Missing Keys');
    validation.missingKeys.slice(0, 20).forEach(key => {
      summary.push(`- ${key}`);
    });
    if (validation.missingKeys.length > 20) {
      summary.push(`- ... and ${validation.missingKeys.length - 20} more`);
    }
    summary.push('');
  }

  if (validation.warnings.length > 0) {
    summary.push('### Warnings');
    validation.warnings.slice(0, 10).forEach(warning => {
      summary.push(`- **${warning.key}**: ${warning.message}`);
    });
    if (validation.warnings.length > 10) {
      summary.push(`- ... and ${validation.warnings.length - 10} more`);
    }
    summary.push('');
  }

  return summary.join('\n');
}

/**
 * Print validation errors to console
 */
async function printValidationErrors(validation: TranslationValidationResult): Promise<void> {
  if (validation.errors.length > 0) {
    console.log('🚨 Critical Errors:');
    validation.errors.slice(0, 10).forEach(error => {
      console.log(`  ❌ ${error.key}: ${error.message}`);
    });
    if (validation.errors.length > 10) {
      console.log(`  ... and ${validation.errors.length - 10} more errors`);
    }
    console.log('');
  }

  if (validation.missingKeys.length > 0) {
    console.log('📝 Missing Keys:');
    validation.missingKeys.slice(0, 10).forEach(key => {
      console.log(`  ❌ ${key}`);
    });
    if (validation.missingKeys.length > 10) {
      console.log(`  ... and ${validation.missingKeys.length - 10} more missing keys`);
    }
    console.log('');
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validation.warnings.slice(0, 5).forEach(warning => {
      console.log(`  ⚠️  ${warning.key}: ${warning.message}`);
    });
    if (validation.warnings.length > 5) {
      console.log(`  ... and ${validation.warnings.length - 5} more warnings`);
    }
    console.log('');
  }
}

/**
 * Generate TypeScript interfaces for translation keys
 */
async function generateTypeScriptInterfaces(manager: TranslationManager): Promise<void> {
  const allKeys = manager.getAllKeys();
  
  // Generate union type for all translation keys
  const keyUnion = allKeys.map(key => `'${key}'`).join(' | ');
  
  const interfaceContent = [
    '// Auto-generated translation key types',
    '// Do not edit this file manually',
    '',
    `export type TranslationKey = ${keyUnion};`,
    '',
    'export interface TypedTranslationFunction {',
    '  (key: TranslationKey, params?: Record<string, any>): string;',
    '}',
    ''
  ].join('\n');

  const typesPath = path.join(__dirname, '../types/translationKeys.ts');
  fs.writeFileSync(typesPath, interfaceContent);
  
  console.log(`📝 Generated TypeScript interfaces: ${typesPath}`);
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateTranslations().catch(error => {
    console.error('💥 Validation failed:', error);
    process.exit(EXIT_CODES.CRITICAL_ERROR);
  });
}

export { validateTranslations, BUILD_VALIDATION_CONFIG };