# Design Document

## Overview

This design document outlines the comprehensive internationalization and RTL/LTR support solution for the gold shop management system. The current system has a solid translation foundation with the `useLanguage` hook and translation files, but suffers from incomplete translation coverage and inconsistent RTL/LTR styling. This solution will systematically identify and fix all hardcoded strings, ensure complete translation coverage, and implement proper directional styling without modifying the existing UI components or backend functionality.

## Architecture

### Current Translation System Analysis

The application already has a robust translation infrastructure:

```
Translation System
├── useLanguage Hook
│   ├── Language state management (en, fa, ar)
│   ├── Direction state (ltr, rtl)
│   ├── Translation function t(key, params)
│   └── LocalStorage persistence
├── Translation Files
│   ├── English translations (comprehensive)
│   ├── Persian translations (comprehensive)
│   └── Arabic translations (partial)
└── Context Provider
    ├── LanguageContext
    └── Document direction updates
```

### Problem Areas Identified

Based on comprehensive code analysis, the main issues are:

1. **Hardcoded English strings** in components:
   - Page titles: "System Settings", "SMS Management", "Stock Optimization"
   - Descriptions: "Welcome back! Here's your business overview"
   - Button labels: "Access Denied", "All Systems Online", "Refresh Status"
   - Card titles: "Total Campaigns", "Messages Sent", "Success Rate"
   - Tab labels: "Overview", "Templates", "Campaigns", "History"

2. **Missing translation keys** for new features:
   - SMS module: Templates, Campaigns, History sections
   - Settings module: Company, Users, Roles, Gold Price sections
   - Reports module: Advanced Charts, Report Builder, Forecasting
   - Image Management: Upload, Gallery, Category management
   - Disaster Recovery: Backup, Recovery procedures

3. **Form placeholders and labels** not translated:
   - "Enter your name", "Enter your email", "Search inventory items..."
   - "Select type", "Select entity", "Search products..."
   - Form validation messages and error states

4. **Chart and data visualization** labels not translated:
   - Chart legends, tooltips, axis labels
   - KPI widget titles and descriptions
   - Progress indicators and status messages

5. **Navigation and routing** inconsistencies:
   - Sub-route titles and breadcrumbs
   - Tab navigation labels
   - Menu item descriptions

6. **System messages and notifications** not translated:
   - Success/error messages
   - Loading states
   - Empty state messages

## Components and Interfaces

### 1. Translation Audit System

**Component Structure:**
```typescript
interface TranslationAudit {
  scanResults: {
    hardcodedStrings: HardcodedString[];
    missingKeys: MissingTranslationKey[];
    mixedContent: MixedContentIssue[];
  };
  coverage: {
    english: number;
    persian: number;
    arabic: number;
  };
}

interface HardcodedString {
  file: string;
  line: number;
  content: string;
  suggestedKey: string;
  context: string;
}
```

### 2. Complete RTL/LTR Layout Transformation System

**Comprehensive Direction Classes:**
```css
/* Complete RTL transformation */
.rtl-layout {
  direction: rtl;
  text-align: right;
}

.rtl-layout .sidebar {
  right: 0;
  left: auto;
  border-left: 1px solid var(--border);
  border-right: none;
}

.rtl-layout .main-content {
  margin-right: 16rem;
  margin-left: 0;
}

.rtl-layout .flex-row {
  flex-direction: row-reverse;
}

.rtl-layout .text-left {
  text-align: right;
}

.rtl-layout .ml-auto {
  margin-right: auto;
  margin-left: 0;
}

.rtl-layout .pl-4 {
  padding-right: 1rem;
  padding-left: 0;
}

/* Complete LTR transformation */
.ltr-layout {
  direction: ltr;
  text-align: left;
}

.ltr-layout .sidebar {
  left: 0;
  right: auto;
  border-right: 1px solid var(--border);
  border-left: none;
}

.ltr-layout .main-content {
  margin-left: 16rem;
  margin-right: 0;
}

/* Icon mirroring for RTL */
.rtl-layout .icon-arrow-right {
  transform: scaleX(-1);
}

.rtl-layout .icon-chevron-right {
  transform: rotate(180deg);
}
```

### 3. Translation Key Management

**Enhanced Translation Structure:**
```typescript
interface TranslationStructure {
  // Existing structure maintained
  common: CommonTranslations;
  nav: NavigationTranslations;
  dashboard: DashboardTranslations;
  
  // New additions for missing content
  charts: ChartTranslations;
  forms: FormTranslations;
  validation: ValidationTranslations;
  system: SystemTranslations;
}

interface ChartTranslations {
  'chart.loading': string;
  'chart.no_data': string;
  'chart.export': string;
  'chart.fullscreen': string;
  'chart.legend': string;
  'chart.tooltip': string;
}
```

### 4. Component Translation Wrapper

**Enhanced useLanguage Hook:**
```typescript
interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  // New additions
  isRTL: boolean;
  formatNumber: (num: number) => string;
  formatDate: (date: Date) => string;
  formatCurrency: (amount: number) => string;
}
```

## Data Models

### Translation Coverage Model

```typescript
interface TranslationCoverage {
  totalKeys: number;
  translatedKeys: {
    en: number;
    fa: number;
    ar: number;
  };
  missingKeys: {
    en: string[];
    fa: string[];
    ar: string[];
  };
  coverage: {
    en: number; // percentage
    fa: number;
    ar: number;
  };
}
```

### RTL Styling Configuration

```typescript
interface RTLConfiguration {
  components: {
    [componentName: string]: {
      rtlClasses: string[];
      ltrClasses: string[];
      conditionalStyles: ConditionalStyle[];
    };
  };
  globalStyles: {
    rtl: string[];
    ltr: string[];
  };
}

interface ConditionalStyle {
  condition: string;
  rtlStyle: string;
  ltrStyle: string;
}
```

### Hardcoded String Detection

```typescript
interface HardcodedStringPattern {
  pattern: RegExp;
  fileTypes: string[];
  excludePatterns: RegExp[];
  severity: 'high' | 'medium' | 'low';
}

const detectionPatterns: HardcodedStringPattern[] = [
  {
    pattern: />[A-Z][a-z]+ [A-Z][a-z]+</g,
    fileTypes: ['.tsx', '.jsx'],
    excludePatterns: [/data-testid/, /className/],
    severity: 'high'
  },
  {
    pattern: /placeholder="[A-Za-z\s]+"/g,
    fileTypes: ['.tsx', '.jsx'],
    excludePatterns: [],
    severity: 'high'
  }
];
```

## Error Handling

### Complete Language Separation Strategy

**No Fallback - Complete Language Purity:**
```typescript
const t = (key: string, params?: Record<string, string | number>): string => {
  // Get translation for current language only - NO FALLBACKS
  let translation = translations[language][key];
  
  // If translation missing, show error indicator and log
  if (!translation) {
    console.error(`CRITICAL: Missing translation for key: ${key} in language: ${language}`);
    // Return key in brackets to make missing translations obvious
    return `[MISSING: ${key}]`;
  }
  
  // Apply parameters
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      translation = translation.replace(
        new RegExp(`{${paramKey}}`, 'g'), 
        String(paramValue)
      );
    });
  }
  
  return translation;
};

// Enhanced language context with complete separation
interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  isLTR: boolean;
  // Complete layout class application
  getLayoutClasses: () => string;
  getTextAlignClass: () => string;
  getFlexDirectionClass: () => string;
}

const getLayoutClasses = (direction: Direction): string => {
  return direction === 'rtl' ? 'rtl-layout' : 'ltr-layout';
};
```

### RTL/LTR Style Conflicts

**Conflict Resolution:**
```typescript
const resolveDirectionalStyles = (
  baseClasses: string, 
  direction: Direction
): string => {
  const classes = baseClasses.split(' ');
  const resolvedClasses = classes.map(cls => {
    // Handle conflicting directional classes
    if (direction === 'rtl') {
      return cls
        .replace(/text-left/g, 'text-right')
        .replace(/ml-/g, 'mr-')
        .replace(/pl-/g, 'pr-')
        .replace(/border-l/g, 'border-r');
    }
    return cls;
  });
  
  return resolvedClasses.join(' ');
};
```

## Testing Strategy

### Translation Coverage Testing

**Automated Translation Validation:**
```typescript
describe('Translation Coverage', () => {
  test('should have complete English translations', () => {
    const missingKeys = findMissingTranslationKeys('en');
    expect(missingKeys).toHaveLength(0);
  });
  
  test('should have complete Persian translations', () => {
    const missingKeys = findMissingTranslationKeys('fa');
    expect(missingKeys).toHaveLength(0);
  });
  
  test('should not have hardcoded strings in components', () => {
    const hardcodedStrings = scanForHardcodedStrings();
    expect(hardcodedStrings).toHaveLength(0);
  });
});
```

### RTL/LTR Visual Testing

**Component Direction Testing:**
```typescript
describe('RTL/LTR Styling', () => {
  test('should apply RTL styles for Persian language', () => {
    render(<TestComponent />, { language: 'fa' });
    const container = screen.getByTestId('container');
    expect(container).toHaveClass('rtl-container');
    expect(container).toHaveStyle('direction: rtl');
  });
  
  test('should apply LTR styles for English language', () => {
    render(<TestComponent />, { language: 'en' });
    const container = screen.getByTestId('container');
    expect(container).toHaveClass('ltr-container');
    expect(container).toHaveStyle('direction: ltr');
  });
});
```

### Cross-Language Consistency Testing

**Content Consistency Validation:**
```typescript
describe('Cross-Language Consistency', () => {
  test('should have matching parameter placeholders across languages', () => {
    const englishKeys = Object.keys(translations.en);
    englishKeys.forEach(key => {
      const enParams = extractParameters(translations.en[key]);
      const faParams = extractParameters(translations.fa[key]);
      expect(faParams).toEqual(enParams);
    });
  });
});
```

## Implementation Phases

### Phase 1: Translation Audit and Gap Analysis
- Scan all components for hardcoded strings
- Identify missing translation keys
- Generate comprehensive translation coverage report
- Create prioritized list of translation fixes

### Phase 2: Translation Key Addition and Updates
- Add missing translation keys to translation files
- Replace hardcoded strings with translation keys
- Update existing components to use proper translation keys
- Ensure parameter consistency across languages

### Phase 3: RTL/LTR CSS Implementation
- Analyze current CSS for directional issues
- Implement RTL-specific CSS classes
- Update components to use directional classes
- Test layout consistency across languages

### Phase 4: Chart and Data Visualization Translation
- Identify all chart labels, legends, and tooltips
- Add translation keys for data visualization elements
- Update chart components to use translations
- Ensure number and date formatting follows language conventions

### Phase 5: Form and Validation Translation
- Translate all form labels, placeholders, and help text
- Translate validation messages and error states
- Update form components to use translation keys
- Test form behavior across languages

### Phase 6: Comprehensive Testing and Validation
- Run automated translation coverage tests
- Perform visual regression testing for RTL/LTR layouts
- Test all user journeys in both languages
- Validate accessibility compliance for RTL layouts

## Quality Assurance

### Translation Quality Standards
- All user-facing text must use translation keys
- Translation keys must be descriptive and hierarchical
- Parameters must be consistent across languages
- Cultural appropriateness for Persian and Arabic content

### RTL/LTR Layout Standards
- Text alignment must match language direction
- Icon and button positioning must be appropriate
- Navigation flow must follow language reading direction
- Form layouts must accommodate RTL input

### Performance Considerations
- Translation loading should not impact initial page load
- RTL/LTR style switching should be smooth
- Memory usage should remain optimal with multiple languages
- Bundle size impact should be minimized

## Maintenance and Updates

### Translation Management Workflow
1. New features must include translation keys from development start
2. Translation updates require review by native speakers
3. Automated tests must validate translation completeness
4. Regular audits to identify and fix translation gaps

### RTL/LTR Style Maintenance
1. New components must include RTL/LTR considerations
2. CSS changes must be tested in both directions
3. Design system updates must maintain directional consistency
4. Regular visual regression testing for layout issues