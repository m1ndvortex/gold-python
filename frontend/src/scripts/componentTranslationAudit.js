#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

class ComponentTranslationAudit {
  constructor() {
    this.srcPath = path.join(process.cwd(), 'src');
    this.componentsPath = path.join(this.srcPath, 'components');
    this.translationKeyPattern = /t\(['"`]([^'"`]+)['"`]\)/g;
    this.formLabelPattern = /<Label[^>]*>([^<]+)</g;
    this.buttonTextPattern = /<Button[^>]*>([^<]+)</g;
    this.errorMessagePattern = /(?:error|Error|ERROR)[^'"`]*['"`]([^'"`]{5,})['"`]/g;
    this.placeholderPattern = /placeholder=['"`]([^'"`]+)['"`]/g;
    this.titlePattern = /title=['"`]([^'"`]+)['"`]/g;
    this.ariaLabelPattern = /aria-label=['"`]([^'"`]+)['"`]/g;
    this.alertPattern = /<Alert[^>]*>[\s\S]*?<AlertDescription[^>]*>([^<]+)</g;
    this.toastPattern = /toast\([^)]*['"`]([^'"`]+)['"`]/g;
  }

  /**
   * Main method to audit all components
   */
  async auditComponents() {
    console.log('🔍 Starting component translation audit...');
    
    const componentFiles = await this.discoverComponentFiles();
    const auditResult = {
      totalComponents: componentFiles.length,
      totalTranslationKeys: 0,
      totalHardcodedStrings: 0,
      components: [],
      summary: {
        byCategory: {},
        byType: {},
        translationCoverage: 0,
        mostProblematic: []
      }
    };

    // Process each component
    for (const componentFile of componentFiles) {
      const componentInfo = await this.analyzeComponent(componentFile);
      auditResult.components.push(componentInfo);
      auditResult.totalTranslationKeys += componentInfo.translationKeys.length;
      auditResult.totalHardcodedStrings += componentInfo.hardcodedStrings.length;
      
      // Update summary
      auditResult.summary.byCategory[componentInfo.category] = 
        (auditResult.summary.byCategory[componentInfo.category] || 0) + 1;
      auditResult.summary.byType[componentInfo.type] = 
        (auditResult.summary.byType[componentInfo.type] || 0) + 1;
    }

    // Calculate translation coverage
    const totalStrings = auditResult.totalTranslationKeys + auditResult.totalHardcodedStrings;
    auditResult.summary.translationCoverage = totalStrings > 0 
      ? (auditResult.totalTranslationKeys / totalStrings) * 100 
      : 100;

    // Find most problematic components
    auditResult.summary.mostProblematic = auditResult.components
      .filter(comp => comp.hardcodedStrings.length > 0)
      .sort((a, b) => b.hardcodedStrings.length - a.hardcodedStrings.length)
      .slice(0, 10)
      .map(comp => ({
        name: comp.name,
        path: comp.relativePath,
        hardcodedCount: comp.hardcodedStrings.length,
        translationKeys: comp.translationKeys.length
      }));

    console.log(`✅ Component audit complete! Analyzed ${auditResult.totalComponents} components`);
    
    return auditResult;
  }

  /**
   * Discover all component files
   */
  async discoverComponentFiles() {
    const patterns = [
      path.join(this.componentsPath, '**/*.{tsx,ts}'),
      path.join(this.srcPath, 'pages', '**/*.{tsx,ts}')
    ];
    
    let allFiles = [];
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern);
        allFiles = allFiles.concat(files);
      } catch (error) {
        console.error(`Error discovering files with pattern ${pattern}:`, error);
      }
    }
    
    // Filter out test files and non-component files
    return allFiles.filter(file => 
      !file.includes('.test.') && 
      !file.includes('.spec.') && 
      !file.includes('__tests__') &&
      !file.includes('.d.ts')
    );
  }

  /**
   * Analyze a specific component
   */
  async analyzeComponent(componentFile) {
    const content = fs.readFileSync(componentFile, 'utf-8');
    const relativePath = path.relative(this.srcPath, componentFile);
    const componentName = path.basename(componentFile, path.extname(componentFile));
    
    const componentInfo = {
      name: componentName,
      path: componentFile,
      relativePath: relativePath,
      category: this.categorizeComponent(relativePath),
      type: this.determineComponentType(content),
      translationKeys: this.extractTranslationKeys(content),
      hardcodedStrings: this.extractHardcodedStrings(content),
      uiElements: this.extractUIElements(content),
      recommendations: []
    };

    // Generate recommendations
    componentInfo.recommendations = this.generateRecommendations(componentInfo);

    return componentInfo;
  }

  /**
   * Extract translation keys from content
   */
  extractTranslationKeys(content) {
    const keys = [];
    let match;
    
    // Reset regex
    this.translationKeyPattern.lastIndex = 0;
    
    while ((match = this.translationKeyPattern.exec(content)) !== null) {
      keys.push(match[1]);
    }
    
    return Array.from(new Set(keys)); // Remove duplicates
  }

  /**
   * Extract hardcoded strings from content
   */
  extractHardcodedStrings(content) {
    const strings = [];
    
    // Different patterns for different types of UI text
    const patterns = [
      { name: 'formLabels', pattern: this.formLabelPattern },
      { name: 'buttonText', pattern: this.buttonTextPattern },
      { name: 'errorMessages', pattern: this.errorMessagePattern },
      { name: 'placeholders', pattern: this.placeholderPattern },
      { name: 'titles', pattern: this.titlePattern },
      { name: 'ariaLabels', pattern: this.ariaLabelPattern },
      { name: 'alerts', pattern: this.alertPattern },
      { name: 'toasts', pattern: this.toastPattern }
    ];
    
    patterns.forEach(({ name, pattern }) => {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        const str = match[1].trim();
        if (this.isTranslatableString(str)) {
          strings.push({
            text: str,
            type: name,
            context: this.getStringContext(content, match.index)
          });
        }
      }
    });
    
    return strings;
  }

  /**
   * Extract UI elements information
   */
  extractUIElements(content) {
    const elements = {
      forms: (content.match(/<form/g) || []).length,
      buttons: (content.match(/<Button/g) || []).length,
      inputs: (content.match(/<Input/g) || []).length,
      labels: (content.match(/<Label/g) || []).length,
      alerts: (content.match(/<Alert/g) || []).length,
      modals: (content.match(/<Dialog|<Modal/g) || []).length,
      tables: (content.match(/<Table|<DataTable/g) || []).length,
      cards: (content.match(/<Card/g) || []).length
    };
    
    return elements;
  }

  /**
   * Get context around a string match
   */
  getStringContext(content, matchIndex) {
    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(content.length, matchIndex + 100);
    return content.substring(start, end).replace(/\s+/g, ' ').trim();
  }

  /**
   * Check if a string should be translated
   */
  isTranslatableString(str) {
    // Skip empty or very short strings
    if (!str || str.length < 2) return false;
    
    // Skip if it's a translation key itself
    if (str.includes('.') && str.split('.').length > 1) return false;
    
    // Skip technical strings
    const technicalPatterns = [
      /^[a-z_]+$/,                    // snake_case variables
      /^[A-Z_]+$/,                    // CONSTANTS
      /^\d+$/,                        // numbers only
      /^#[0-9a-fA-F]+$/,             // hex colors
      /^[a-z]+:[a-z]+$/,             // CSS properties
      /^\/[\/\w\-]*$/,               // paths
      /^https?:\/\//,                // URLs
      /^[a-z]+\([^)]*\)$/,           // function calls
      /^[a-z\-]+$/,                  // CSS classes (single words with hyphens)
      /^[A-Z][a-z]+$/,               // Component names
      /^\{[^}]*\}$/,                 // JSX expressions
      /^(className|onClick|onChange|onSubmit|type|id|name|value|disabled|required|autoComplete|tabIndex)$/,
      /^aria-/,                      // ARIA attributes
      /^data-/,                      // Data attributes
      /^\s*$/,                       // whitespace only
      /[\r\n\t]/,                    // contains line breaks or tabs
      /^[^a-zA-Z]*$/,               // no letters
    ];
    
    if (technicalPatterns.some(pattern => pattern.test(str))) {
      return false;
    }
    
    // Skip strings that are mostly symbols or numbers
    const letterCount = (str.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < str.length * 0.5) return false;
    
    // Must contain at least one letter
    return /[a-zA-Z]/.test(str);
  }

  /**
   * Categorize component based on path
   */
  categorizeComponent(relativePath) {
    const pathParts = relativePath.split(path.sep);
    
    if (pathParts.includes('pages')) return 'page';
    if (pathParts.includes('ui')) return 'ui-component';
    if (pathParts.includes('layout')) return 'layout';
    if (pathParts.includes('auth')) return 'auth';
    if (pathParts.includes('forms')) return 'form';
    if (pathParts.includes('dashboard')) return 'dashboard';
    if (pathParts.includes('reports')) return 'reports';
    if (pathParts.includes('inventory')) return 'inventory';
    if (pathParts.includes('customers')) return 'customers';
    if (pathParts.includes('invoices')) return 'invoices';
    if (pathParts.includes('settings')) return 'settings';
    if (pathParts.includes('analytics')) return 'analytics';
    
    return 'other';
  }

  /**
   * Determine component type based on content
   */
  determineComponentType(content) {
    if (content.includes('<form') || content.includes('useForm')) return 'form';
    if (content.includes('<Table') || content.includes('<DataTable')) return 'table';
    if (content.includes('<Dialog') || content.includes('<Modal')) return 'modal';
    if (content.includes('<Chart') || content.includes('Chart.js')) return 'chart';
    if (content.includes('<Card')) return 'card';
    if (content.includes('useState') || content.includes('useEffect')) return 'interactive';
    if (content.includes('export default') && content.includes('React.FC')) return 'component';
    
    return 'utility';
  }

  /**
   * Generate recommendations for component
   */
  generateRecommendations(componentInfo) {
    const recommendations = [];
    
    if (componentInfo.hardcodedStrings.length > 0) {
      recommendations.push({
        type: 'translation',
        priority: 'high',
        message: `Replace ${componentInfo.hardcodedStrings.length} hardcoded strings with translation keys`
      });
    }
    
    if (componentInfo.uiElements.forms > 0 && componentInfo.hardcodedStrings.some(s => s.type === 'formLabels')) {
      recommendations.push({
        type: 'form',
        priority: 'high',
        message: 'Form labels should use translation keys for better accessibility'
      });
    }
    
    if (componentInfo.uiElements.buttons > 0 && componentInfo.hardcodedStrings.some(s => s.type === 'buttonText')) {
      recommendations.push({
        type: 'button',
        priority: 'medium',
        message: 'Button text should be translatable for international users'
      });
    }
    
    if (componentInfo.hardcodedStrings.some(s => s.type === 'errorMessages')) {
      recommendations.push({
        type: 'error',
        priority: 'high',
        message: 'Error messages must be translated for user understanding'
      });
    }
    
    if (componentInfo.translationKeys.length === 0 && componentInfo.hardcodedStrings.length > 0) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        message: 'Component has no translation keys but contains user-facing text'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate detailed audit report
   */
  async generateReport(auditResult) {
    const report = `# Component Translation Audit Report

Generated on: ${new Date().toISOString()}

## Summary

- **Total Components**: ${auditResult.totalComponents}
- **Translation Keys Found**: ${auditResult.totalTranslationKeys}
- **Hardcoded Strings Found**: ${auditResult.totalHardcodedStrings}
- **Translation Coverage**: ${auditResult.summary.translationCoverage.toFixed(2)}%

## Components by Category

${Object.entries(auditResult.summary.byCategory)
  .map(([category, count]) => `- **${category}**: ${count} components`)
  .join('\n')}

## Components by Type

${Object.entries(auditResult.summary.byType)
  .map(([type, count]) => `- **${type}**: ${count} components`)
  .join('\n')}

## Most Problematic Components

${auditResult.summary.mostProblematic
  .map((comp, index) => `${index + 1}. **${comp.name}** (${comp.path})
   - Hardcoded strings: ${comp.hardcodedCount}
   - Translation keys: ${comp.translationKeys}`)
  .join('\n\n')}

## Detailed Component Analysis

${auditResult.components
  .filter(comp => comp.hardcodedStrings.length > 0)
  .sort((a, b) => b.hardcodedStrings.length - a.hardcodedStrings.length)
  .slice(0, 20)
  .map(comp => this.formatComponentReport(comp))
  .join('\n\n')}

## Translation Recommendations

### High Priority Actions

1. **Form Components**: ${auditResult.components.filter(c => c.type === 'form' && c.hardcodedStrings.length > 0).length} form components need translation
2. **Error Messages**: ${auditResult.components.filter(c => c.hardcodedStrings.some(s => s.type === 'errorMessages')).length} components have untranslated error messages
3. **Button Text**: ${auditResult.components.filter(c => c.hardcodedStrings.some(s => s.type === 'buttonText')).length} components have untranslated button text

### Translation Key Patterns

Based on the analysis, consider creating these translation key patterns:
- \`forms.labels.*\` for form labels
- \`buttons.*\` for button text
- \`errors.*\` for error messages
- \`placeholders.*\` for input placeholders
- \`alerts.*\` for alert messages

### Implementation Strategy

1. **Phase 1**: Focus on high-priority components (forms, error messages)
2. **Phase 2**: Address button text and placeholders
3. **Phase 3**: Handle remaining UI text and descriptions

---

*This report was generated automatically by the Component Translation Audit tool.*
`;

    return report;
  }

  /**
   * Format individual component report
   */
  formatComponentReport(component) {
    let report = `### ${component.name} (${component.category})

- **Path**: ${component.relativePath}
- **Type**: ${component.type}
- **Translation Keys**: ${component.translationKeys.length}
- **Hardcoded Strings**: ${component.hardcodedStrings.length}`;

    if (component.translationKeys.length > 0) {
      report += `\n\n**Translation Keys Used**:
${component.translationKeys.map(key => `- \`${key}\``).join('\n')}`;
    }

    if (component.hardcodedStrings.length > 0) {
      report += `\n\n**Hardcoded Strings by Type**:`;
      const stringsByType = {};
      component.hardcodedStrings.forEach(str => {
        if (!stringsByType[str.type]) stringsByType[str.type] = [];
        stringsByType[str.type].push(str.text);
      });
      
      Object.entries(stringsByType).forEach(([type, strings]) => {
        report += `\n\n*${type}*:
${strings.slice(0, 5).map(str => `- "${str}"`).join('\n')}`;
        if (strings.length > 5) {
          report += `\n- ... and ${strings.length - 5} more`;
        }
      });
    }

    if (component.recommendations.length > 0) {
      report += `\n\n**Recommendations**:
${component.recommendations.map(rec => `- [${rec.priority.toUpperCase()}] ${rec.message}`).join('\n')}`;
    }

    return report;
  }

  /**
   * Save audit results to files
   */
  async saveResults(auditResult) {
    const outputDir = path.join(process.cwd(), 'src', 'audit-results');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save JSON data
    const jsonPath = path.join(outputDir, 'component-translation-audit.json');
    fs.writeFileSync(jsonPath, JSON.stringify(auditResult, null, 2));
    console.log(`📄 JSON results saved to: ${jsonPath}`);

    // Save markdown report
    const report = await this.generateReport(auditResult);
    const reportPath = path.join(outputDir, 'component-translation-audit-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`📋 Report saved to: ${reportPath}`);

    // Save component mapping
    const componentMapping = auditResult.components.map(comp => ({
      name: comp.name,
      path: comp.relativePath,
      category: comp.category,
      type: comp.type,
      translationKeys: comp.translationKeys,
      hardcodedStrings: comp.hardcodedStrings.map(s => s.text),
      recommendations: comp.recommendations
    }));
    
    const mappingPath = path.join(outputDir, 'component-translation-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(componentMapping, null, 2));
    console.log(`🗺️ Component mapping saved to: ${mappingPath}`);
  }
}

// Main execution
async function main() {
  try {
    const audit = new ComponentTranslationAudit();
    const auditResult = await audit.auditComponents();
    await audit.saveResults(auditResult);
    
    console.log('\n🎉 Component Translation Audit completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- Analyzed ${auditResult.totalComponents} components`);
    console.log(`- Translation coverage: ${auditResult.summary.translationCoverage.toFixed(2)}%`);
    console.log(`- ${auditResult.totalHardcodedStrings} hardcoded strings need translation`);
    console.log(`- ${auditResult.summary.mostProblematic.length} components need immediate attention`);
    
  } catch (error) {
    console.error('❌ Error during component audit:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { ComponentTranslationAudit };

// Run if called directly
if (require.main === module) {
  main();
}