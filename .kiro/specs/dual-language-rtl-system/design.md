# Design Document

## Overview

This design document outlines the comprehensive implementation of dual-language support (English/Persian) with proper RTL/LTR layout handling for the gold shop management system. The system currently has a basic language context implementation but lacks complete translation coverage, proper RTL layout support, and comprehensive testing.

The design will transform the existing partial implementation into a robust, production-ready dual-language system that ensures all UI elements, API responses, calculations, and business logic work correctly in both languages while providing appropriate directional layouts.

## Architecture

### Current State Analysis

**Existing Implementation:**
- Basic `LanguageContext` with limited translations
- `useLanguage` hook with extensive English translations but incomplete Persian translations
- Document direction setting in App.tsx
- No RTL-specific CSS or layout handling
- Mixed language content visible in current implementation
- No systematic translation audit or management system

**Gaps Identified:**
- Incomplete Persian translations (only ~50 keys vs 500+ English keys)
- No RTL layout implementation for components
- No API-level translation support
- No systematic approach to translation key management
- Missing translation validation and testing framework

### System Architecture

```
Dual-Language RTL System
├── Translation Management Layer
│   ├── Translation Key Registry
│   ├── Language Detection & Persistence
│   ├── Fallback Mechanisms
│   └── Translation Validation
├── UI Layout Engine
│   ├── RTL/LTR CSS Framework
│   ├── Component Direction Adaptation
│   ├── Chart & Visualization RTL Support
│   └── Form & Input Direction Handling
├── API Translation Layer
│   ├── Request Language Headers
│   ├── Response Localization
│   ├── Database Content Translation
│   └── Error Message Translation
├── Testing & Validation Framework
│   ├── Translation Coverage Tests
│   ├── RTL/LTR Layout Tests
│   ├── Calculation Consistency Tests
│   └── End-to-End Language Tests
└── Build & Type Safety Integration
    ├── TypeScript Translation Interfaces
    ├── Build-time Translation Validation
    └── Type-safe Translation Keys
```

## Components and Interfaces

### 1. Enhanced Translation Management System

**Translation Key Registry:**
```typescript
interface TranslationRegistry {
  // Systematic categorization of all translatable content
  pages: {
    [pageName: string]: {
      title: string;
      description: string;
      sections: {
        [sectionName: string]: {
          [key: string]: string;
        };
      };
    };
  };
  components: {
    [componentName: string]: {
      [key: string]: string;
    };
  };
  forms: {
    [formName: string]: {
      fields: { [fieldName: string]: string };
      validation: { [validationKey: string]: string };
      actions: { [actionKey: string]: string };
    };
  };
  api: {
    errors: { [errorCode: string]: string };
    messages: { [messageKey: string]: string };
    status: { [statusKey: string]: string };
  };
}
```

**Enhanced Language Context:**
```typescript
interface EnhancedLanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
  isRTL: boolean;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  getCalendarType: () => 'gregorian' | 'jalali';
  translateApiResponse: (response: any) => any;
}
```

### 2. RTL/LTR Layout System

**CSS Direction Framework:**
```css
/* Base RTL/LTR classes */
.rtl {
  direction: rtl;
  text-align: right;
}

.ltr {
  direction: ltr;
  text-align: left;
}

/* Component-specific RTL adaptations */
.sidebar-rtl {
  right: 0;
  left: auto;
  border-left: 1px solid var(--border);
  border-right: none;
}

.dropdown-rtl {
  right: 0;
  left: auto;
}

.table-rtl th,
.table-rtl td {
  text-align: right;
}

/* Chart container RTL support */
.chart-container-rtl {
  direction: ltr; /* Keep charts LTR for data integrity */
}

.chart-container-rtl .chart-legend {
  direction: rtl;
  text-align: right;
}
```

**Component Direction Adapter:**
```typescript
interface DirectionAdapter {
  getLayoutClasses: (baseClasses: string) => string;
  getFlexDirection: (direction: 'row' | 'column') => string;
  getTextAlign: (align: 'left' | 'right' | 'center') => string;
  getMarginPadding: (property: string, value: string) => Record<string, string>;
  adaptChartConfig: (config: any) => any;
}
```

### 3. Page and Component Audit System

**Route Discovery Engine:**
```typescript
interface RouteAuditResult {
  route: string;
  component: string;
  subRoutes: string[];
  translationKeys: string[];
  missingTranslations: string[];
  rtlIssues: string[];
}

interface ComponentAuditResult {
  componentPath: string;
  translationKeys: string[];
  hardcodedStrings: string[];
  rtlCompatibility: 'full' | 'partial' | 'none';
  recommendations: string[];
}
```

**API Endpoint Audit:**
```typescript
interface APIAuditResult {
  endpoint: string;
  method: string;
  responseFields: string[];
  translatableFields: string[];
  currentTranslationSupport: boolean;
  requiredTranslations: string[];
}
```

### 4. Chart and Visualization RTL Support

**Chart Configuration Adapter:**
```typescript
interface ChartRTLAdapter {
  adaptChartConfig: (config: ChartConfiguration, isRTL: boolean) => ChartConfiguration;
  translateChartLabels: (labels: string[], language: Language) => string[];
  adaptLegendPosition: (position: string, isRTL: boolean) => string;
  formatChartTooltips: (tooltip: any, language: Language) => any;
}

// Example implementation for different chart types
const chartAdapters = {
  bar: (config: any, isRTL: boolean) => ({
    ...config,
    options: {
      ...config.options,
      plugins: {
        ...config.options.plugins,
        legend: {
          ...config.options.plugins.legend,
          align: isRTL ? 'end' : 'start',
          rtl: isRTL
        }
      },
      scales: {
        ...config.options.scales,
        x: {
          ...config.options.scales.x,
          position: isRTL ? 'right' : 'left'
        }
      }
    }
  }),
  pie: (config: any, isRTL: boolean) => ({
    ...config,
    options: {
      ...config.options,
      plugins: {
        ...config.options.plugins,
        legend: {
          ...config.options.plugins.legend,
          rtl: isRTL
        }
      }
    }
  })
};
```

### 5. Form and Input Direction Handling

**Form Direction Manager:**
```typescript
interface FormDirectionManager {
  adaptFormLayout: (formConfig: any, isRTL: boolean) => any;
  getInputAlignment: (inputType: string, isRTL: boolean) => string;
  adaptValidationMessages: (messages: any, language: Language) => any;
  handleFormSubmission: (data: any, language: Language) => any;
}

// RTL-specific form styling
const formRTLStyles = {
  input: {
    textAlign: 'right',
    paddingRight: '12px',
    paddingLeft: '40px' // For icons
  },
  label: {
    textAlign: 'right',
    marginRight: '0',
    marginLeft: '8px'
  },
  checkbox: {
    marginRight: '0',
    marginLeft: '8px'
  },
  select: {
    textAlign: 'right',
    backgroundPosition: 'left 12px center'
  }
};
```

## Data Models

### Translation Data Models

```typescript
interface TranslationEntry {
  key: string;
  en: string;
  fa: string;
  category: 'page' | 'component' | 'form' | 'api' | 'common';
  context?: string;
  pluralization?: {
    en: { zero?: string; one: string; other: string };
    fa: { zero?: string; one: string; other: string };
  };
  interpolation?: string[];
  lastUpdated: Date;
  verified: boolean;
}

interface TranslationFile {
  version: string;
  language: Language;
  translations: Record<string, string>;
  metadata: {
    totalKeys: number;
    completionPercentage: number;
    lastAudit: Date;
    missingKeys: string[];
  };
}
```

### Layout Configuration Models

```typescript
interface LayoutConfiguration {
  language: Language;
  direction: Direction;
  components: {
    [componentName: string]: {
      className: string;
      styles: Record<string, string>;
      adaptations: string[];
    };
  };
  charts: {
    defaultConfig: any;
    rtlAdaptations: any;
  };
  forms: {
    inputAlignment: 'left' | 'right';
    labelPosition: 'left' | 'right' | 'top';
    validationPosition: 'left' | 'right' | 'bottom';
  };
}
```

### API Translation Models

```typescript
interface APITranslationRequest {
  language: Language;
  endpoint: string;
  data?: any;
}

interface APITranslationResponse {
  success: boolean;
  data: any;
  translations?: Record<string, string>;
  language: Language;
  direction: Direction;
}

interface TranslatableAPIField {
  fieldPath: string;
  translationKey: string;
  fallbackValue: string;
  required: boolean;
}
```

## Error Handling

### Translation Error Handling

**Missing Translation Fallback:**
```typescript
class TranslationErrorHandler {
  handleMissingTranslation(key: string, language: Language): string {
    // Log missing translation for audit
    this.logMissingTranslation(key, language);
    
    // Return fallback in order of preference
    if (language === 'fa' && this.hasEnglishTranslation(key)) {
      return this.getEnglishTranslation(key);
    }
    
    // Return key as last resort with indicator
    return `[${key}]`;
  }
  
  handleTranslationError(error: Error, key: string): string {
    console.error(`Translation error for key "${key}":`, error);
    return this.handleMissingTranslation(key, this.currentLanguage);
  }
}
```

**RTL Layout Error Handling:**
```typescript
class RTLErrorHandler {
  handleLayoutError(component: string, error: Error): void {
    console.error(`RTL layout error in ${component}:`, error);
    
    // Apply fallback LTR styles
    this.applyFallbackStyles(component);
    
    // Report to monitoring system
    this.reportLayoutError(component, error);
  }
  
  validateRTLCompatibility(component: string): boolean {
    try {
      // Check if component has RTL-compatible styles
      return this.hasRTLStyles(component) && this.hasDirectionSupport(component);
    } catch (error) {
      this.handleLayoutError(component, error);
      return false;
    }
  }
}
```

### API Translation Error Handling

```typescript
class APITranslationErrorHandler {
  handleAPITranslationError(endpoint: string, error: Error): any {
    console.error(`API translation error for ${endpoint}:`, error);
    
    // Return untranslated response with error flag
    return {
      success: false,
      error: 'translation_failed',
      message: 'Translation service unavailable',
      fallbackLanguage: 'en'
    };
  }
  
  validateAPIResponse(response: any, expectedLanguage: Language): boolean {
    // Validate that response contains expected language content
    return this.hasLanguageContent(response, expectedLanguage);
  }
}
```

## Testing Strategy

### Translation Coverage Testing

**Automated Translation Audit:**
```typescript
interface TranslationAuditTest {
  testName: string;
  description: string;
  execute: () => Promise<TranslationAuditResult>;
}

class TranslationCoverageTests {
  async testAllPagesHaveTranslations(): Promise<TestResult> {
    const pages = await this.discoverAllPages();
    const results = [];
    
    for (const page of pages) {
      const translationKeys = await this.extractTranslationKeys(page);
      const missingTranslations = await this.findMissingTranslations(translationKeys);
      
      results.push({
        page: page.name,
        totalKeys: translationKeys.length,
        missingKeys: missingTranslations.length,
        coverage: ((translationKeys.length - missingTranslations.length) / translationKeys.length) * 100
      });
    }
    
    return {
      success: results.every(r => r.coverage === 100),
      details: results
    };
  }
  
  async testAPITranslationSupport(): Promise<TestResult> {
    const endpoints = await this.discoverAPIEndpoints();
    const results = [];
    
    for (const endpoint of endpoints) {
      const response = await this.testEndpointWithLanguage(endpoint, 'fa');
      const hasTranslatedContent = this.validateTranslatedResponse(response);
      
      results.push({
        endpoint: endpoint.path,
        supportsTranslation: hasTranslatedContent,
        issues: hasTranslatedContent ? [] : ['No Persian translation support']
      });
    }
    
    return {
      success: results.every(r => r.supportsTranslation),
      details: results
    };
  }
}
```

### RTL Layout Testing

**Visual RTL Testing:**
```typescript
class RTLLayoutTests {
  async testComponentRTLLayout(componentName: string): Promise<TestResult> {
    // Render component in RTL mode
    const rtlRender = await this.renderComponentRTL(componentName);
    
    // Validate RTL-specific properties
    const validations = [
      this.validateTextDirection(rtlRender),
      this.validateElementPositioning(rtlRender),
      this.validateScrollbarPosition(rtlRender),
      this.validateIconPositions(rtlRender)
    ];
    
    return {
      success: validations.every(v => v.passed),
      details: validations
    };
  }
  
  async testChartRTLSupport(): Promise<TestResult> {
    const chartTypes = ['bar', 'line', 'pie', 'doughnut'];
    const results = [];
    
    for (const chartType of chartTypes) {
      const rtlChart = await this.renderChartRTL(chartType);
      const ltrChart = await this.renderChartLTR(chartType);
      
      const comparison = this.compareChartLayouts(rtlChart, ltrChart);
      results.push({
        chartType,
        rtlSupported: comparison.hasProperRTLAdaptation,
        issues: comparison.issues
      });
    }
    
    return {
      success: results.every(r => r.rtlSupported),
      details: results
    };
  }
}
```

### Calculation Consistency Testing

**Business Logic Validation:**
```typescript
class CalculationConsistencyTests {
  async testAccountingCalculations(): Promise<TestResult> {
    const testCases = [
      { type: 'invoice_total', data: this.getInvoiceTestData() },
      { type: 'installment_payment', data: this.getInstallmentTestData() },
      { type: 'inventory_valuation', data: this.getInventoryTestData() },
      { type: 'profit_loss', data: this.getProfitLossTestData() }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      // Test calculation in English
      const englishResult = await this.performCalculation(testCase, 'en');
      
      // Test same calculation in Persian
      const persianResult = await this.performCalculation(testCase, 'fa');
      
      // Compare results
      const isConsistent = this.compareCalculationResults(englishResult, persianResult);
      
      results.push({
        calculationType: testCase.type,
        consistent: isConsistent,
        englishResult,
        persianResult,
        difference: isConsistent ? 0 : this.calculateDifference(englishResult, persianResult)
      });
    }
    
    return {
      success: results.every(r => r.consistent),
      details: results
    };
  }
  
  async testCurrencyFormatting(): Promise<TestResult> {
    const amounts = [1000, 1500.50, 0, -500, 999999.99];
    const results = [];
    
    for (const amount of amounts) {
      const englishFormat = this.formatCurrency(amount, 'en');
      const persianFormat = this.formatCurrency(amount, 'fa');
      
      results.push({
        amount,
        englishFormat,
        persianFormat,
        bothValid: this.validateCurrencyFormat(englishFormat, 'en') && 
                  this.validateCurrencyFormat(persianFormat, 'fa')
      });
    }
    
    return {
      success: results.every(r => r.bothValid),
      details: results
    };
  }
}
```

### End-to-End Language Testing

**Complete User Journey Testing:**
```typescript
class E2ELanguageTests {
  async testCompleteUserJourney(): Promise<TestResult> {
    const journeys = [
      'login_to_dashboard',
      'create_invoice_workflow',
      'inventory_management_workflow',
      'customer_management_workflow',
      'reports_generation_workflow'
    ];
    
    const results = [];
    
    for (const journey of journeys) {
      // Test journey in English
      const englishJourney = await this.executeUserJourney(journey, 'en');
      
      // Test same journey in Persian
      const persianJourney = await this.executeUserJourney(journey, 'fa');
      
      results.push({
        journey,
        englishSuccess: englishJourney.success,
        persianSuccess: persianJourney.success,
        englishIssues: englishJourney.issues,
        persianIssues: persianJourney.issues
      });
    }
    
    return {
      success: results.every(r => r.englishSuccess && r.persianSuccess),
      details: results
    };
  }
  
  async testLanguageSwitching(): Promise<TestResult> {
    const pages = await this.getAllPages();
    const results = [];
    
    for (const page of pages) {
      // Load page in English
      await this.navigateToPage(page, 'en');
      
      // Switch to Persian
      await this.switchLanguage('fa');
      
      // Validate page is fully in Persian
      const persianValidation = await this.validatePageLanguage(page, 'fa');
      
      // Switch back to English
      await this.switchLanguage('en');
      
      // Validate page is fully in English
      const englishValidation = await this.validatePageLanguage(page, 'en');
      
      results.push({
        page: page.name,
        persianSwitchSuccess: persianValidation.success,
        englishSwitchSuccess: englishValidation.success,
        issues: [...persianValidation.issues, ...englishValidation.issues]
      });
    }
    
    return {
      success: results.every(r => r.persianSwitchSuccess && r.englishSwitchSuccess),
      details: results
    };
  }
}
```

## Implementation Phases

### Phase 1: Translation Infrastructure Enhancement
- Upgrade existing translation system with comprehensive key management
- Implement translation validation and fallback mechanisms
- Create translation audit tools and missing key detection
- Establish TypeScript interfaces for type-safe translations

### Phase 2: Complete Translation Coverage
- Conduct systematic audit of all pages, components, and API endpoints
- Complete Persian translations for all identified keys
- Implement API-level translation support
- Add translation validation to build process

### Phase 3: RTL Layout Implementation
- Develop CSS framework for RTL/LTR adaptation
- Implement component-level RTL support
- Create chart and visualization RTL adapters
- Update form and input handling for directional support

### Phase 4: Testing Framework Development
- Build comprehensive translation coverage tests
- Implement RTL/LTR layout validation tests
- Create calculation consistency test suite
- Develop end-to-end language switching tests

### Phase 5: Integration and Validation
- Integrate all components with build process validation
- Implement Docker-based testing with real APIs
- Conduct comprehensive system testing
- Performance optimization and final validation

## Performance Considerations

### Translation Loading Optimization
- Lazy loading of translation files
- Translation caching strategies
- Efficient key lookup mechanisms
- Bundle size optimization for translations

### RTL Rendering Performance
- CSS-in-JS optimization for direction switching
- Efficient re-rendering strategies
- Chart redraw optimization
- Layout shift minimization

### API Translation Efficiency
- Request header optimization
- Response caching for translated content
- Database query optimization for multilingual content
- CDN strategies for translation assets

## Security Considerations

### Translation Security
- Input sanitization for translated content
- XSS prevention in dynamic translations
- Secure translation key management
- Audit logging for translation changes

### API Security
- Language header validation
- Translation injection prevention
- Secure fallback mechanisms
- Rate limiting for translation requests

This comprehensive design provides the foundation for implementing a robust dual-language system with proper RTL support while ensuring all business calculations and functionality work correctly across both languages.