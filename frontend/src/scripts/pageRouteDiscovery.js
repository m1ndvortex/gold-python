#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

class PageRouteDiscovery {
  constructor() {
    this.srcPath = path.join(process.cwd(), 'src');
    this.pagesPath = path.join(this.srcPath, 'pages');
    this.componentsPath = path.join(this.srcPath, 'components');
    this.translationKeyPattern = /t\(['"`]([^'"`]+)['"`]\)/g;
    this.hardcodedStringPattern = /['"`]([^'"`]{3,}?)['"`]/g;
    this.routePattern = /<Route\s+path=['"`]([^'"`]+)['"`]\s+element=\{[^}]*<([^>\s]+)/g;
  }

  /**
   * Main method to discover all pages and routes
   */
  async discoverPagesAndRoutes() {
    console.log('🔍 Starting page and route discovery...');
    
    const routes = await this.extractRoutesFromApp();
    const pageFiles = await this.discoverPageFiles();
    
    const auditResult = {
      totalPages: pageFiles.length,
      totalRoutes: routes.length,
      totalTranslationKeys: 0,
      totalHardcodedStrings: 0,
      routes: [],
      summary: {
        byCategory: {},
        byPriority: {},
        translationCoverage: 0
      }
    };

    // Process each route
    for (const route of routes) {
      const routeInfo = await this.analyzeRoute(route);
      auditResult.routes.push(routeInfo);
      auditResult.totalTranslationKeys += routeInfo.translationKeys.length;
      auditResult.totalHardcodedStrings += routeInfo.hardcodedStrings.length;
      
      // Update summary
      auditResult.summary.byCategory[routeInfo.category] = 
        (auditResult.summary.byCategory[routeInfo.category] || 0) + 1;
      auditResult.summary.byPriority[routeInfo.priority] = 
        (auditResult.summary.byPriority[routeInfo.priority] || 0) + 1;
    }

    // Calculate translation coverage
    const totalStrings = auditResult.totalTranslationKeys + auditResult.totalHardcodedStrings;
    auditResult.summary.translationCoverage = totalStrings > 0 
      ? (auditResult.totalTranslationKeys / totalStrings) * 100 
      : 100;

    console.log(`✅ Discovery complete! Found ${auditResult.totalRoutes} routes across ${auditResult.totalPages} pages`);
    
    return auditResult;
  }

  /**
   * Extract routes from App.tsx
   */
  async extractRoutesFromApp() {
    const appPath = path.join(this.srcPath, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    const routes = [];
    let match;
    
    // Reset regex
    this.routePattern.lastIndex = 0;
    
    while ((match = this.routePattern.exec(appContent)) !== null) {
      routes.push({
        path: match[1],
        component: match[2]
      });
    }

    return routes;
  }

  /**
   * Discover all page files
   */
  async discoverPageFiles() {
    const pattern = path.join(this.pagesPath, '**/*.{tsx,ts}');
    try {
      const files = await glob(pattern);
      return files;
    } catch (error) {
      console.error('Error discovering page files:', error);
      return [];
    }
  }

  /**
   * Analyze a specific route
   */
  async analyzeRoute(route) {
    const componentFile = await this.findComponentFile(route.component);
    const content = componentFile ? fs.readFileSync(componentFile, 'utf-8') : '';
    
    const routeInfo = {
      path: route.path,
      component: route.component,
      file: componentFile || 'Not found',
      subRoutes: [],
      translationKeys: this.extractTranslationKeys(content),
      hardcodedStrings: this.extractHardcodedStrings(content),
      priority: this.determinePriority(route.path),
      category: this.categorizeRoute(route.path)
    };

    // Extract sub-routes if component has routing
    if (content.includes('<Routes>') || content.includes('<Route')) {
      routeInfo.subRoutes = await this.extractSubRoutes(content, componentFile || '');
    }

    return routeInfo;
  }

  /**
   * Find the actual component file
   */
  async findComponentFile(componentName) {
    // Try pages directory first
    const pageFile = path.join(this.pagesPath, `${componentName}.tsx`);
    if (fs.existsSync(pageFile)) {
      return pageFile;
    }

    // Try components directory
    const componentPattern = path.join(this.componentsPath, '**', `${componentName}.tsx`);
    try {
      const files = await glob(componentPattern);
      return files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error('Error finding component file:', error);
      return null;
    }
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
    
    // More specific patterns for different types of strings
    const patterns = [
      // JSX text content
      />([^<>{}\n\r]+)</g,
      // String literals in JSX attributes (but not className, style, etc.)
      /(?:placeholder|title|alt|aria-label|label)=['"`]([^'"`]+)['"`]/g,
      // String literals in object properties that look like user-facing text
      /(?:title|label|placeholder|description|message|text):\s*['"`]([^'"`]+)['"`]/g,
      // Button text and similar
      /<Button[^>]*>([^<]+)</g,
      // Alert/error messages
      /(?:alert|error|message|notification).*?['"`]([^'"`]{5,})['"`]/gi,
    ];
    
    patterns.forEach(pattern => {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        const str = match[1].trim();
        if (this.isTranslatableString(str)) {
          strings.push(str);
        }
      }
    });
    
    return Array.from(new Set(strings)); // Remove duplicates
  }

  /**
   * Check if a string should be translated
   */
  isTranslatableString(str) {
    // Skip empty or very short strings
    if (!str || str.length < 3) return false;
    
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
      /^className$/,                 // React props
      /^onClick$/,                   // Event handlers
      /^onChange$/,                  // Event handlers
      /^onSubmit$/,                  // Event handlers
      /^type$/,                      // HTML attributes
      /^id$/,                        // HTML attributes
      /^name$/,                      // HTML attributes
      /^value$/,                     // HTML attributes
      /^disabled$/,                  // HTML attributes
      /^required$/,                  // HTML attributes
      /^autoComplete$/,              // HTML attributes
      /^tabIndex$/,                  // HTML attributes
      /^aria-/,                      // ARIA attributes
      /^data-/,                      // Data attributes
      /^[a-z]+(-[a-z]+)*$/,         // kebab-case (likely CSS)
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
    
    // Must contain at least one letter and be meaningful
    return /[a-zA-Z]/.test(str) && str.length >= 3;
  }

  /**
   * Extract sub-routes from component content
   */
  async extractSubRoutes(content, parentFile) {
    const subRoutes = [];
    let match;
    
    // Reset regex
    this.routePattern.lastIndex = 0;
    
    while ((match = this.routePattern.exec(content)) !== null) {
      const subRoute = await this.analyzeRoute({
        path: match[1],
        component: match[2]
      });
      subRoutes.push(subRoute);
    }
    
    return subRoutes;
  }

  /**
   * Determine route priority based on path
   */
  determinePriority(routePath) {
    const highPriorityPaths = ['/', '/dashboard', '/login', '/register'];
    const mediumPriorityPaths = ['/inventory', '/customers', '/invoices', '/reports'];
    
    if (highPriorityPaths.includes(routePath)) return 'high';
    if (mediumPriorityPaths.some(path => routePath.startsWith(path))) return 'medium';
    return 'low';
  }

  /**
   * Categorize route based on path
   */
  categorizeRoute(routePath) {
    if (['/login', '/register', '/forgot-password', '/reset-password'].includes(routePath)) {
      return 'auth';
    }
    if (['/dashboard', '/inventory', '/customers', '/invoices'].some(path => routePath.startsWith(path))) {
      return 'main';
    }
    if (routePath.startsWith('/settings')) {
      return 'settings';
    }
    if (routePath.startsWith('/reports')) {
      return 'reports';
    }
    return 'other';
  }

  /**
   * Generate detailed audit report
   */
  async generateReport(auditResult) {
    const report = `# Page and Route Discovery Report

Generated on: ${new Date().toISOString()}

## Summary

- **Total Pages**: ${auditResult.totalPages}
- **Total Routes**: ${auditResult.totalRoutes}
- **Translation Keys Found**: ${auditResult.totalTranslationKeys}
- **Hardcoded Strings Found**: ${auditResult.totalHardcodedStrings}
- **Translation Coverage**: ${auditResult.summary.translationCoverage.toFixed(2)}%

## Routes by Category

${Object.entries(auditResult.summary.byCategory)
  .map(([category, count]) => `- **${category}**: ${count} routes`)
  .join('\n')}

## Routes by Priority

${Object.entries(auditResult.summary.byPriority)
  .map(([priority, count]) => `- **${priority}**: ${count} routes`)
  .join('\n')}

## Detailed Route Analysis

${auditResult.routes.map(route => this.formatRouteReport(route)).join('\n\n')}

## Translation Gaps

### Routes with Most Hardcoded Strings

${auditResult.routes
  .filter(route => route.hardcodedStrings.length > 0)
  .sort((a, b) => b.hardcodedStrings.length - a.hardcodedStrings.length)
  .slice(0, 10)
  .map(route => `- **${route.path}** (${route.component}): ${route.hardcodedStrings.length} hardcoded strings`)
  .join('\n')}

### High Priority Routes Needing Translation

${auditResult.routes
  .filter(route => route.priority === 'high' && route.hardcodedStrings.length > 0)
  .map(route => `- **${route.path}**: ${route.hardcodedStrings.length} strings need translation`)
  .join('\n')}

## Recommendations

1. **Immediate Action Required**: Focus on high-priority routes with hardcoded strings
2. **Translation Keys**: Create translation keys for the ${auditResult.totalHardcodedStrings} hardcoded strings found
3. **Component Audit**: Review components with the most hardcoded strings
4. **Systematic Approach**: Process routes by category to ensure consistent translation coverage

---

*This report was generated automatically by the Page Route Discovery tool.*
`;

    return report;
  }

  /**
   * Format individual route report
   */
  formatRouteReport(route) {
    let report = `### ${route.path} (${route.component})

- **File**: ${route.file}
- **Category**: ${route.category}
- **Priority**: ${route.priority}
- **Translation Keys**: ${route.translationKeys.length}
- **Hardcoded Strings**: ${route.hardcodedStrings.length}`;

    if (route.translationKeys.length > 0) {
      report += `\n\n**Translation Keys Used**:
${route.translationKeys.map(key => `- \`${key}\``).join('\n')}`;
    }

    if (route.hardcodedStrings.length > 0) {
      report += `\n\n**Hardcoded Strings Found**:
${route.hardcodedStrings.slice(0, 10).map(str => `- "${str}"`).join('\n')}`;
      
      if (route.hardcodedStrings.length > 10) {
        report += `\n- ... and ${route.hardcodedStrings.length - 10} more`;
      }
    }

    if (route.subRoutes.length > 0) {
      report += `\n\n**Sub-routes**: ${route.subRoutes.length}`;
      route.subRoutes.forEach(subRoute => {
        report += `\n- ${subRoute.path} (${subRoute.translationKeys.length} keys, ${subRoute.hardcodedStrings.length} hardcoded)`;
      });
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
    const jsonPath = path.join(outputDir, 'page-route-audit.json');
    fs.writeFileSync(jsonPath, JSON.stringify(auditResult, null, 2));
    console.log(`📄 JSON results saved to: ${jsonPath}`);

    // Save markdown report
    const report = await this.generateReport(auditResult);
    const reportPath = path.join(outputDir, 'page-route-audit-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`📋 Report saved to: ${reportPath}`);

    // Save translation keys list
    const allTranslationKeys = Array.from(new Set(auditResult.routes.flatMap(r => r.translationKeys)));
    const keysPath = path.join(outputDir, 'translation-keys-found.json');
    fs.writeFileSync(keysPath, JSON.stringify(allTranslationKeys, null, 2));
    console.log(`🔑 Translation keys saved to: ${keysPath}`);

    // Save hardcoded strings list
    const allHardcodedStrings = Array.from(new Set(auditResult.routes.flatMap(r => r.hardcodedStrings)));
    const stringsPath = path.join(outputDir, 'hardcoded-strings-found.json');
    fs.writeFileSync(stringsPath, JSON.stringify(allHardcodedStrings, null, 2));
    console.log(`📝 Hardcoded strings saved to: ${stringsPath}`);
  }
}

// Main execution
async function main() {
  try {
    const discovery = new PageRouteDiscovery();
    const auditResult = await discovery.discoverPagesAndRoutes();
    await discovery.saveResults(auditResult);
    
    console.log('\n🎉 Page and Route Discovery completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- Found ${auditResult.totalRoutes} routes across ${auditResult.totalPages} pages`);
    console.log(`- Translation coverage: ${auditResult.summary.translationCoverage.toFixed(2)}%`);
    console.log(`- ${auditResult.totalHardcodedStrings} hardcoded strings need translation`);
    
  } catch (error) {
    console.error('❌ Error during page discovery:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { PageRouteDiscovery };

// Run if called directly
if (require.main === module) {
  main();
}