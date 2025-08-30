#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

class APIEndpointTranslationAudit {
  constructor() {
    this.frontendPath = path.join(process.cwd(), 'src');
    
    // Patterns for finding translatable content in API responses
    this.errorMessagePattern = /['"`]([^'"`]*(?:error|Error|ERROR|invalid|Invalid|required|Required|not found|Not found|failed|Failed)[^'"`]*)['"`]/g;
    this.statusMessagePattern = /['"`]([^'"`]*(?:success|Success|created|Created|updated|Updated|deleted|Deleted|completed|Completed)[^'"`]*)['"`]/g;
    this.validationMessagePattern = /['"`]([^'"`]*(?:must|should|cannot|required|invalid|minimum|maximum|length)[^'"`]*)['"`]/g;
    this.userFacingTextPattern = /['"`]([^'"`]{10,}?)['"`]/g;
    
    // API endpoint patterns
    this.routePattern = /@app\.(?:get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g;
    this.fastApiRoutePattern = /@router\.(?:get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g;
    this.responsePattern = /return\s+(?:JSONResponse|Response)\([^)]*['"`]([^'"`]+)['"`]/g;
  }

  /**
   * Main method to audit API endpoints
   */
  async auditAPIEndpoints() {
    console.log('🔍 Starting API endpoint translation audit...');
    
    const frontendApiFiles = await this.discoverFrontendApiFiles();
    
    const auditResult = {
      totalFrontendApiFiles: frontendApiFiles.length,
      totalEndpoints: 0,
      totalTranslatableStrings: 0,
      apiUsage: [],
      discoveredEndpoints: [],
      summary: {
        byCategory: {},
        byMethod: {},
        translationSupport: 0,
        criticalEndpoints: []
      }
    };

    // Analyze frontend API usage
    for (const file of frontendApiFiles) {
      const apiUsage = await this.analyzeFrontendApiFile(file);
      auditResult.apiUsage.push(apiUsage);
      
      // Extract discovered endpoints from API calls
      apiUsage.apiCalls.forEach(call => {
        const endpoint = {
          path: call.endpoint,
          method: this.extractMethodFromCall(call.context),
          file: apiUsage.file,
          category: this.categorizeEndpoint(call.endpoint),
          hasTranslationSupport: apiUsage.translationUsage.length > 0,
          errorHandling: apiUsage.errorHandling.length > 0,
          recommendations: []
        };
        
        endpoint.recommendations = this.generateEndpointRecommendations(endpoint);
        auditResult.discoveredEndpoints.push(endpoint);
      });
    }

    auditResult.totalEndpoints = auditResult.discoveredEndpoints.length;

    // Calculate summary statistics
    this.calculateSummary(auditResult);

    console.log(`✅ API audit complete! Found ${auditResult.totalEndpoints} API calls with translation analysis`);
    
    return auditResult;
  }

  /**
   * Extract HTTP method from API call context
   */
  extractMethodFromCall(context) {
    const methodPatterns = [
      /\.get\(/i,
      /\.post\(/i,
      /\.put\(/i,
      /\.delete\(/i,
      /\.patch\(/i,
      /fetch.*method:\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`]/i
    ];
    
    for (const pattern of methodPatterns) {
      const match = context.match(pattern);
      if (match) {
        if (match[1]) return match[1].toUpperCase();
        return pattern.source.match(/\\\.(\w+)\\/)[1].toUpperCase();
      }
    }
    
    return 'GET'; // Default assumption
  }

  /**
   * Discover frontend API files
   */
  async discoverFrontendApiFiles() {
    const patterns = [
      path.join(this.frontendPath, 'hooks', '**/*.{ts,tsx}'),
      path.join(this.frontendPath, 'services', '**/*.{ts,tsx}'),
      path.join(this.frontendPath, 'api', '**/*.{ts,tsx}'),
      path.join(this.frontendPath, 'utils', '**/*.{ts,tsx}')
    ];
    
    let allFiles = [];
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern);
        allFiles = allFiles.concat(files);
      } catch (error) {
        console.error(`Error discovering frontend API files with pattern ${pattern}:`, error);
      }
    }
    
    return allFiles.filter(file => 
      !file.includes('.test.') && 
      !file.includes('.spec.') && 
      !file.includes('__tests__')
    );
  }

  /**
   * Analyze a backend file for API endpoints
   */
  async analyzeBackendFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(this.backendPath, filePath);
    const endpoints = [];
    
    // Find API routes
    const routePatterns = [this.routePattern, this.fastApiRoutePattern];
    
    routePatterns.forEach(pattern => {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(content)) !== null) {
        const endpoint = {
          path: match[1],
          file: relativePath,
          method: this.extractMethod(content, match.index),
          translatableStrings: this.extractTranslatableStrings(content, match.index),
          hasTranslationSupport: this.checkTranslationSupport(content),
          category: this.categorizeEndpoint(match[1]),
          recommendations: []
        };
        
        endpoint.recommendations = this.generateEndpointRecommendations(endpoint);
        endpoints.push(endpoint);
      }
    });
    
    return endpoints;
  }

  /**
   * Analyze frontend API file
   */
  async analyzeFrontendApiFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(this.frontendPath, filePath);
    
    const apiUsage = {
      file: relativePath,
      apiCalls: this.extractApiCalls(content),
      errorHandling: this.extractErrorHandling(content),
      translationUsage: this.extractTranslationUsage(content),
      recommendations: []
    };
    
    apiUsage.recommendations = this.generateApiUsageRecommendations(apiUsage);
    
    return apiUsage;
  }

  /**
   * Extract method from route definition
   */
  extractMethod(content, matchIndex) {
    const beforeMatch = content.substring(Math.max(0, matchIndex - 50), matchIndex);
    const methodMatch = beforeMatch.match(/@\w+\.(get|post|put|delete|patch)/);
    return methodMatch ? methodMatch[1].toUpperCase() : 'UNKNOWN';
  }

  /**
   * Extract translatable strings from content around a match
   */
  extractTranslatableStrings(content, matchIndex) {
    // Look for translatable strings in a reasonable range around the endpoint
    const start = Math.max(0, matchIndex - 500);
    const end = Math.min(content.length, matchIndex + 1500);
    const section = content.substring(start, end);
    
    const strings = [];
    const patterns = [
      { name: 'errorMessages', pattern: this.errorMessagePattern },
      { name: 'statusMessages', pattern: this.statusMessagePattern },
      { name: 'validationMessages', pattern: this.validationMessagePattern }
    ];
    
    patterns.forEach(({ name, pattern }) => {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(section)) !== null) {
        const str = match[1].trim();
        if (this.isTranslatableString(str)) {
          strings.push({
            text: str,
            type: name,
            context: this.getStringContext(section, match.index)
          });
        }
      }
    });
    
    return strings;
  }

  /**
   * Check if endpoint has translation support
   */
  checkTranslationSupport(content) {
    const translationIndicators = [
      'Accept-Language',
      'language',
      'locale',
      'i18n',
      'translation',
      'translate',
      'lang'
    ];
    
    return translationIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  /**
   * Extract API calls from frontend code
   */
  extractApiCalls(content) {
    const apiCalls = [];
    const patterns = [
      /fetch\(['"`]([^'"`]+)['"`]/g,
      /axios\.(?:get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
      /api\.(?:get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
      /useQuery\([^,]*['"`]([^'"`]+)['"`]/g,
      /useMutation\([^,]*['"`]([^'"`]+)['"`]/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        apiCalls.push({
          endpoint: match[1],
          context: this.getStringContext(content, match.index)
        });
      }
    });
    
    return apiCalls;
  }

  /**
   * Extract error handling patterns
   */
  extractErrorHandling(content) {
    const errorHandling = [];
    const patterns = [
      /catch\s*\([^)]*\)\s*\{([^}]+)\}/g,
      /\.catch\([^)]+\)/g,
      /onError:\s*\([^)]*\)\s*=>\s*\{([^}]+)\}/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        errorHandling.push({
          code: match[0],
          hasTranslation: match[0].includes('t(') || match[0].includes('translate')
        });
      }
    });
    
    return errorHandling;
  }

  /**
   * Extract translation usage in API context
   */
  extractTranslationUsage(content) {
    const translationUsage = [];
    const patterns = [
      /t\(['"`]([^'"`]+)['"`]\)/g,
      /translate\(['"`]([^'"`]+)['"`]\)/g,
      /i18n\.t\(['"`]([^'"`]+)['"`]\)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        translationUsage.push({
          key: match[1],
          context: this.getStringContext(content, match.index)
        });
      }
    });
    
    return translationUsage;
  }

  /**
   * Get context around a string match
   */
  getStringContext(content, matchIndex) {
    const start = Math.max(0, matchIndex - 30);
    const end = Math.min(content.length, matchIndex + 80);
    return content.substring(start, end).replace(/\s+/g, ' ').trim();
  }

  /**
   * Check if a string should be translated
   */
  isTranslatableString(str) {
    // Skip empty or very short strings
    if (!str || str.length < 5) return false;
    
    // Skip technical strings
    const technicalPatterns = [
      /^[a-z_]+$/,                    // snake_case variables
      /^[A-Z_]+$/,                    // CONSTANTS
      /^\d+$/,                        // numbers only
      /^[a-z]+:[a-z]+$/,             // key:value pairs
      /^\/[\/\w\-]*$/,               // paths
      /^https?:\/\//,                // URLs
      /^[a-z]+\([^)]*\)$/,           // function calls
      /^\{[^}]*\}$/,                 // JSON-like structures
      /^[^a-zA-Z]*$/,               // no letters
    ];
    
    if (technicalPatterns.some(pattern => pattern.test(str))) {
      return false;
    }
    
    // Must contain at least one letter and some meaningful words
    return /[a-zA-Z]/.test(str) && str.split(' ').length >= 2;
  }

  /**
   * Categorize endpoint based on path
   */
  categorizeEndpoint(endpointPath) {
    const path = endpointPath.toLowerCase();
    
    if (path.includes('auth') || path.includes('login') || path.includes('register')) return 'auth';
    if (path.includes('user') || path.includes('profile')) return 'user';
    if (path.includes('inventory') || path.includes('product') || path.includes('item')) return 'inventory';
    if (path.includes('customer') || path.includes('client')) return 'customer';
    if (path.includes('invoice') || path.includes('bill')) return 'invoice';
    if (path.includes('report') || path.includes('analytics')) return 'reports';
    if (path.includes('setting') || path.includes('config')) return 'settings';
    if (path.includes('sms') || path.includes('notification')) return 'communication';
    if (path.includes('accounting') || path.includes('finance')) return 'accounting';
    
    return 'other';
  }

  /**
   * Generate recommendations for endpoint
   */
  generateEndpointRecommendations(endpoint) {
    const recommendations = [];
    
    if (!endpoint.hasTranslationSupport) {
      recommendations.push({
        type: 'translation-support',
        priority: 'high',
        message: 'Add language header support to API calls'
      });
    }
    
    if (!endpoint.errorHandling) {
      recommendations.push({
        type: 'error-handling',
        priority: 'medium',
        message: 'Implement proper error handling with translation support'
      });
    }
    
    if (endpoint.category === 'auth' && !endpoint.hasTranslationSupport) {
      recommendations.push({
        type: 'auth-translation',
        priority: 'high',
        message: 'Authentication endpoints should support user language preferences'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate recommendations for API usage
   */
  generateApiUsageRecommendations(apiUsage) {
    const recommendations = [];
    
    if (apiUsage.errorHandling.length > 0) {
      const untranslatedErrors = apiUsage.errorHandling.filter(eh => !eh.hasTranslation);
      if (untranslatedErrors.length > 0) {
        recommendations.push({
          type: 'error-handling',
          priority: 'high',
          message: `${untranslatedErrors.length} error handlers need translation support`
        });
      }
    }
    
    if (apiUsage.apiCalls.length > 0 && apiUsage.translationUsage.length === 0) {
      recommendations.push({
        type: 'api-translation',
        priority: 'medium',
        message: 'Consider adding language headers to API calls'
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary(auditResult) {
    // Count by category
    auditResult.discoveredEndpoints.forEach(endpoint => {
      auditResult.summary.byCategory[endpoint.category] = 
        (auditResult.summary.byCategory[endpoint.category] || 0) + 1;
    });
    
    // Count by method
    auditResult.discoveredEndpoints.forEach(endpoint => {
      auditResult.summary.byMethod[endpoint.method] = 
        (auditResult.summary.byMethod[endpoint.method] || 0) + 1;
    });
    
    // Calculate translation support percentage
    const endpointsWithTranslation = auditResult.discoveredEndpoints.filter(ep => ep.hasTranslationSupport).length;
    auditResult.summary.translationSupport = auditResult.totalEndpoints > 0 
      ? (endpointsWithTranslation / auditResult.totalEndpoints) * 100 
      : 0;
    
    // Find critical endpoints
    auditResult.summary.criticalEndpoints = auditResult.discoveredEndpoints
      .filter(ep => !ep.hasTranslationSupport || !ep.errorHandling)
      .sort((a, b) => (b.hasTranslationSupport ? 0 : 1) - (a.hasTranslationSupport ? 0 : 1))
      .slice(0, 10)
      .map(ep => ({
        path: ep.path,
        method: ep.method,
        category: ep.category,
        hasTranslationSupport: ep.hasTranslationSupport,
        hasErrorHandling: ep.errorHandling
      }));
  }

  /**
   * Generate detailed audit report
   */
  async generateReport(auditResult) {
    const report = `# API Endpoint Translation Audit Report

Generated on: ${new Date().toISOString()}

## Summary

- **Total Frontend API Files**: ${auditResult.totalFrontendApiFiles}
- **Total API Endpoints Discovered**: ${auditResult.totalEndpoints}
- **Translation Support**: ${auditResult.summary.translationSupport.toFixed(2)}%

## Endpoints by Category

${Object.entries(auditResult.summary.byCategory)
  .map(([category, count]) => `- **${category}**: ${count} endpoints`)
  .join('\n')}

## Endpoints by HTTP Method

${Object.entries(auditResult.summary.byMethod)
  .map(([method, count]) => `- **${method}**: ${count} endpoints`)
  .join('\n')}

## Critical Endpoints Needing Translation Support

${auditResult.summary.criticalEndpoints
  .map((ep, index) => `${index + 1}. **${ep.method} ${ep.path}** (${ep.category})
   - Translation support: ${ep.hasTranslationSupport ? 'Yes' : 'No'}
   - Error handling: ${ep.hasErrorHandling ? 'Yes' : 'No'}`)
  .join('\n\n')}

## Detailed Endpoint Analysis

${auditResult.discoveredEndpoints
  .slice(0, 20)
  .map(ep => this.formatEndpointReport(ep))
  .join('\n\n')}

## Frontend API Usage Analysis

${auditResult.apiUsage
  .filter(usage => usage.recommendations.length > 0)
  .slice(0, 10)
  .map(usage => this.formatApiUsageReport(usage))
  .join('\n\n')}

## Implementation Recommendations

### Backend Translation Support

1. **Add Language Header Middleware**: Implement middleware to extract and validate Accept-Language headers
2. **Create Translation Service**: Build a service to handle message translation based on user language
3. **Update Error Responses**: Modify error handling to return translated messages
4. **Validation Message Translation**: Implement translated validation messages

### Frontend API Integration

1. **Language Headers**: Add Accept-Language headers to all API requests
2. **Error Message Translation**: Ensure error responses are properly translated in UI
3. **Consistent Error Handling**: Standardize error handling across all API calls

### Priority Implementation Order

1. **High Priority**: Authentication and user-facing error messages
2. **Medium Priority**: Validation messages and status updates
3. **Low Priority**: Debug messages and internal status codes

---

*This report was generated automatically by the API Endpoint Translation Audit tool.*
`;

    return report;
  }

  /**
   * Format individual endpoint report
   */
  formatEndpointReport(endpoint) {
    let report = `### ${endpoint.method} ${endpoint.path} (${endpoint.category})

- **File**: ${endpoint.file}
- **Translation Support**: ${endpoint.hasTranslationSupport ? 'Yes' : 'No'}
- **Error Handling**: ${endpoint.errorHandling ? 'Yes' : 'No'}`;

    if (endpoint.recommendations.length > 0) {
      report += `\n\n**Recommendations**:
${endpoint.recommendations.map(rec => `- [${rec.priority.toUpperCase()}] ${rec.message}`).join('\n')}`;
    }

    return report;
  }

  /**
   * Format API usage report
   */
  formatApiUsageReport(usage) {
    let report = `### ${usage.file}

- **API Calls**: ${usage.apiCalls.length}
- **Error Handlers**: ${usage.errorHandling.length}
- **Translation Usage**: ${usage.translationUsage.length}`;

    if (usage.recommendations.length > 0) {
      report += `\n\n**Recommendations**:
${usage.recommendations.map(rec => `- [${rec.priority.toUpperCase()}] ${rec.message}`).join('\n')}`;
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
    const jsonPath = path.join(outputDir, 'api-endpoint-translation-audit.json');
    fs.writeFileSync(jsonPath, JSON.stringify(auditResult, null, 2));
    console.log(`📄 JSON results saved to: ${jsonPath}`);

    // Save markdown report
    const report = await this.generateReport(auditResult);
    const reportPath = path.join(outputDir, 'api-endpoint-translation-audit-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`📋 Report saved to: ${reportPath}`);

    // Save endpoint mapping
    const endpointMapping = auditResult.discoveredEndpoints.map(ep => ({
      path: ep.path,
      method: ep.method,
      file: ep.file,
      category: ep.category,
      hasTranslationSupport: ep.hasTranslationSupport,
      hasErrorHandling: ep.errorHandling,
      recommendations: ep.recommendations
    }));
    
    const mappingPath = path.join(outputDir, 'api-endpoint-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(endpointMapping, null, 2));
    console.log(`🗺️ API endpoint mapping saved to: ${mappingPath}`);
  }
}

// Main execution
async function main() {
  try {
    const audit = new APIEndpointTranslationAudit();
    const auditResult = await audit.auditAPIEndpoints();
    await audit.saveResults(auditResult);
    
    console.log('\n🎉 API Endpoint Translation Audit completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- Found ${auditResult.totalEndpoints} API endpoints`);
    console.log(`- Translation support: ${auditResult.summary.translationSupport.toFixed(2)}%`);
    console.log(`- ${auditResult.totalTranslatableStrings} translatable strings need attention`);
    console.log(`- ${auditResult.summary.criticalEndpoints.length} critical endpoints identified`);
    
  } catch (error) {
    console.error('❌ Error during API endpoint audit:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { APIEndpointTranslationAudit };

// Run if called directly
if (require.main === module) {
  main();
}