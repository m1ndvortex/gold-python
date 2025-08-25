#!/usr/bin/env node

/**
 * Translation Audit Script
 * Scans all React components for hardcoded English strings and missing translation keys
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to detect hardcoded strings
const HARDCODED_PATTERNS = [
  // JSX text content (between > and <)
  {
    name: 'JSX Text Content',
    pattern: />([A-Z][a-zA-Z\s&!?.,'-]+)</g,
    severity: 'high'
  },
  // String literals in quotes
  {
    name: 'Quoted Strings',
    pattern: /"([A-Z][a-zA-Z\s&!?.,'-]+)"/g,
    severity: 'high'
  },
  // Placeholder attributes
  {
    name: 'Placeholders',
    pattern: /placeholder="([A-Za-z\s.,'-]+)"/g,
    severity: 'high'
  },
  // Title attributes
  {
    name: 'Title Attributes',
    pattern: /title="([A-Za-z\s.,'-]+)"/g,
    severity: 'medium'
  },
  // Alt attributes
  {
    name: 'Alt Attributes',
    pattern: /alt="([A-Za-z\s.,'-]+)"/g,
    severity: 'medium'
  },
  // Aria-label attributes
  {
    name: 'Aria Labels',
    pattern: /aria-label="([A-Za-z\s.,'-]+)"/g,
    severity: 'high'
  }
];

// Known translation keys from useLanguage.ts
const EXISTING_TRANSLATION_KEYS = new Set([
  'app.title', 'nav.dashboard', 'nav.inventory', 'nav.customers', 'nav.invoices',
  'nav.accounting', 'nav.reports', 'nav.sms', 'nav.settings', 'auth.login',
  'auth.logout', 'common.save', 'common.cancel', 'common.delete', 'common.edit',
  'common.add', 'common.create', 'common.search', 'common.language', 'common.profile',
  'common.refresh', 'common.filters', 'common.loading', 'common.actions',
  'common.status', 'common.total', 'common.new', 'dashboard.title',
  'dashboard.total_sales_today', 'customers.title', 'accounting.income',
  'reports.sales', 'sms.campaign', 'settings.company'
]);

// Files to exclude from scanning
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/build/**',
  '**/dist/**',
  '**/*.test.tsx',
  '**/*.test.ts',
  '**/tests/**'
];

class TranslationAuditor {
  constructor() {
    this.results = {
      hardcodedStrings: [],
      missingKeys: [],
      chartLabels: [],
      formElements: [],
      navigationItems: [],
      systemMessages: []
    };
  }

  async scanDirectory(directory) {
    console.log(`🔍 Scanning ${directory} for hardcoded strings...`);
    
    const files = glob.sync(`${directory}/**/*.{tsx,ts}`, {
      ignore: EXCLUDE_PATTERNS
    });

    for (const file of files) {
      await this.scanFile(file);
    }

    return this.results;
  }

  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);

      // Skip files that are primarily test files or demos
      if (this.shouldSkipFile(relativePath, content)) {
        return;
      }

      for (const patternConfig of HARDCODED_PATTERNS) {
        const matches = [...content.matchAll(patternConfig.pattern)];
        
        for (const match of matches) {
          const text = match[1];
          const lineNumber = this.getLineNumber(content, match.index);
          
          // Filter out obvious non-translatable content
          if (this.isTranslatableString(text)) {
            const hardcodedString = {
              file: relativePath,
              line: lineNumber,
              content: text,
              pattern: patternConfig.name,
              severity: patternConfig.severity,
              suggestedKey: this.generateTranslationKey(text, relativePath),
              context: this.getContext(content, match.index)
            };

            this.categorizeHardcodedString(hardcodedString);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning ${filePath}:`, error.message);
    }
  }

  shouldSkipFile(relativePath, content) {
    // Skip test files
    if (relativePath.includes('/tests/') || relativePath.includes('.test.')) {
      return true;
    }
    
    // Skip demo files
    if (relativePath.includes('Demo.tsx') || relativePath.includes('demo/')) {
      return true;
    }

    // Skip files that are primarily for testing UI components
    if (content.includes('data-testid') && content.includes('expect(')) {
      return true;
    }

    return false;
  }

  isTranslatableString(text) {
    // Skip very short strings
    if (text.length < 3) return false;
    
    // Skip CSS classes and technical terms
    if (text.match(/^(bg-|text-|border-|flex|grid|p-|m-|w-|h-)/)) return false;
    
    // Skip file extensions and technical identifiers
    if (text.match(/\.(jpg|png|svg|css|js|ts|tsx)$/i)) return false;
    
    // Skip URLs and paths
    if (text.match(/^(https?:\/\/|\/|\.\/)/)) return false;
    
    // Skip single words that are likely technical terms
    const technicalTerms = ['div', 'span', 'button', 'input', 'form', 'table', 'thead', 'tbody', 'tr', 'td', 'th'];
    if (technicalTerms.includes(text.toLowerCase())) return false;
    
    // Skip numbers and currency
    if (text.match(/^[\d$€£¥.,]+$/)) return false;
    
    return true;
  }

  categorizeHardcodedString(hardcodedString) {
    const { content, file } = hardcodedString;
    
    // Chart and data visualization labels
    if (this.isChartLabel(content, file)) {
      this.results.chartLabels.push(hardcodedString);
    }
    // Form elements
    else if (this.isFormElement(content, file)) {
      this.results.formElements.push(hardcodedString);
    }
    // Navigation items
    else if (this.isNavigationItem(content, file)) {
      this.results.navigationItems.push(hardcodedString);
    }
    // System messages
    else if (this.isSystemMessage(content)) {
      this.results.systemMessages.push(hardcodedString);
    }
    // General hardcoded strings
    else {
      this.results.hardcodedStrings.push(hardcodedString);
    }
  }

  isChartLabel(content, file) {
    const chartKeywords = ['chart', 'graph', 'analytics', 'dashboard', 'trends', 'sales', 'revenue'];
    const chartLabels = ['Sales Trends', 'Top Products', 'Sales by Category', 'Total Revenue', 'Success Rate'];
    
    return chartLabels.includes(content) || 
           (chartKeywords.some(keyword => file.toLowerCase().includes(keyword)) && 
            content.match(/^[A-Z][a-z]+ [A-Z][a-z]+/));
  }

  isFormElement(content, file) {
    const formKeywords = ['Enter', 'Select', 'Choose', 'Search', 'Type'];
    const formFiles = ['form', 'input', 'field'];
    
    return formKeywords.some(keyword => content.startsWith(keyword)) ||
           formFiles.some(keyword => file.toLowerCase().includes(keyword));
  }

  isNavigationItem(content, file) {
    const navKeywords = ['Overview', 'Templates', 'Campaigns', 'History', 'Company', 'Users', 'Roles'];
    const navFiles = ['sidebar', 'navigation', 'menu', 'tabs'];
    
    return navKeywords.includes(content) ||
           navFiles.some(keyword => file.toLowerCase().includes(keyword));
  }

  isSystemMessage(content) {
    const systemKeywords = ['Error', 'Success', 'Warning', 'Loading', 'Failed', 'Complete', 'Online', 'Offline'];
    return systemKeywords.some(keyword => content.includes(keyword));
  }

  generateTranslationKey(text, filePath) {
    // Extract module from file path
    const pathParts = filePath.split('/');
    let module = 'common';
    
    if (pathParts.includes('dashboard')) module = 'dashboard';
    else if (pathParts.includes('customers')) module = 'customers';
    else if (pathParts.includes('accounting')) module = 'accounting';
    else if (pathParts.includes('inventory')) module = 'inventory';
    else if (pathParts.includes('reports')) module = 'reports';
    else if (pathParts.includes('sms')) module = 'sms';
    else if (pathParts.includes('settings')) module = 'settings';
    else if (pathParts.includes('auth')) module = 'auth';
    
    // Generate key from text
    const key = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
    
    return `${module}.${key}`;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  getContext(content, index) {
    const lines = content.split('\n');
    const lineNumber = this.getLineNumber(content, index);
    const contextLines = [];
    
    for (let i = Math.max(0, lineNumber - 3); i < Math.min(lines.length, lineNumber + 2); i++) {
      contextLines.push(`${i + 1}: ${lines[i]}`);
    }
    
    return contextLines.join('\n');
  }

  generateReport() {
    const report = {
      summary: {
        totalHardcodedStrings: this.results.hardcodedStrings.length,
        chartLabels: this.results.chartLabels.length,
        formElements: this.results.formElements.length,
        navigationItems: this.results.navigationItems.length,
        systemMessages: this.results.systemMessages.length,
        totalIssues: Object.values(this.results).reduce((sum, arr) => sum + arr.length, 0)
      },
      details: this.results
    };

    return report;
  }
}

// Main execution
async function main() {
  const auditor = new TranslationAuditor();
  
  console.log('🚀 Starting Translation Audit...\n');
  
  // Scan frontend source directory
  await auditor.scanDirectory('frontend/src');
  
  const report = auditor.generateReport();
  
  // Output results
  console.log('\n📊 TRANSLATION AUDIT RESULTS');
  console.log('================================');
  console.log(`Total Hardcoded Strings: ${report.summary.totalHardcodedStrings}`);
  console.log(`Chart Labels: ${report.summary.chartLabels}`);
  console.log(`Form Elements: ${report.summary.formElements}`);
  console.log(`Navigation Items: ${report.summary.navigationItems}`);
  console.log(`System Messages: ${report.summary.systemMessages}`);
  console.log(`Total Issues: ${report.summary.totalIssues}`);
  
  // Save detailed report
  const reportPath = 'frontend/translation-audit-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Generate missing translation keys
  console.log('\n🔑 MISSING TRANSLATION KEYS');
  console.log('============================');
  
  const allStrings = [
    ...report.details.hardcodedStrings,
    ...report.details.chartLabels,
    ...report.details.formElements,
    ...report.details.navigationItems,
    ...report.details.systemMessages
  ];
  
  const missingKeys = new Set();
  allStrings.forEach(item => {
    if (!EXISTING_TRANSLATION_KEYS.has(item.suggestedKey)) {
      missingKeys.add(item.suggestedKey);
    }
  });
  
  console.log(`Found ${missingKeys.size} missing translation keys:`);
  Array.from(missingKeys).sort().forEach(key => {
    console.log(`  - ${key}`);
  });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TranslationAuditor };