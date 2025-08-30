// Enhanced Translation Management Types

export type Language = 'en' | 'fa' | 'ar';
export type Direction = 'ltr' | 'rtl';

// Translation Entry with metadata
export interface TranslationEntry {
  key: string;
  en: string;
  fa: string;
  ar?: string;
  category: TranslationCategory;
  context?: string;
  pluralization?: {
    en: { zero?: string; one: string; other: string };
    fa: { zero?: string; one: string; other: string };
    ar?: { zero?: string; one: string; other: string };
  };
  interpolation?: string[];
  lastUpdated: Date;
  verified: boolean;
  description?: string;
}

// Translation categories for organization
export type TranslationCategory = 
  | 'page' 
  | 'component' 
  | 'form' 
  | 'api' 
  | 'common'
  | 'navigation'
  | 'dashboard'
  | 'inventory'
  | 'customers'
  | 'invoices'
  | 'accounting'
  | 'reports'
  | 'sms'
  | 'settings'
  | 'auth'
  | 'charts'
  | 'tables'
  | 'system';

// Translation file structure
export interface TranslationFile {
  version: string;
  language: Language;
  translations: Record<string, string>;
  metadata: {
    totalKeys: number;
    completionPercentage: number;
    lastAudit: Date;
    missingKeys: string[];
    unusedKeys: string[];
    duplicateKeys: string[];
  };
}

// Translation registry for systematic management
export interface TranslationRegistry {
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
  common: {
    [key: string]: string;
  };
}

// Translation validation result
export interface TranslationValidationResult {
  isValid: boolean;
  errors: TranslationValidationError[];
  warnings: TranslationValidationWarning[];
  statistics: {
    totalKeys: number;
    translatedKeys: number;
    missingKeys: number;
    unusedKeys: number;
    duplicateKeys: number;
    completionPercentage: number;
  };
}

export interface TranslationValidationError {
  type: 'missing_key' | 'invalid_interpolation' | 'duplicate_key' | 'invalid_format';
  key: string;
  language: Language;
  message: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
}

export interface TranslationValidationWarning {
  type: 'unused_key' | 'inconsistent_interpolation' | 'long_text' | 'missing_context';
  key: string;
  language?: Language;
  message: string;
  suggestion?: string;
}

// Translation audit result
export interface TranslationAuditResult {
  timestamp: Date;
  totalFiles: number;
  totalComponents: number;
  totalKeys: number;
  languages: {
    [key in Language]: {
      completionPercentage: number;
      missingKeys: string[];
      unusedKeys: string[];
      duplicateKeys: string[];
    };
  };
  recommendations: TranslationRecommendation[];
}

export interface TranslationRecommendation {
  type: 'add_translation' | 'remove_unused' | 'fix_duplicate' | 'add_context';
  priority: 'high' | 'medium' | 'low';
  key: string;
  language?: Language;
  description: string;
  action: string;
}

// Enhanced Language Context Type
export interface EnhancedLanguageContextType {
  // Current language state
  language: Language;
  direction: Direction;
  isRTL: boolean;
  isLTR: boolean;
  
  // Translation functions
  t: (key: string, params?: Record<string, any>) => string;
  tSafe: (key: string, fallback: string, params?: Record<string, any>) => string;
  hasTranslation: (key: string) => boolean;
  getTranslationWithFallback: (key: string, fallbackLanguage?: Language) => string;
  
  // Language management
  setLanguage: (lang: Language) => Promise<void>;
  getSupportedLanguages: () => Language[];
  getLanguageInfo: (lang: Language) => LanguageInfo;
  
  // Formatting functions
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date, format?: string) => string;
  formatTime: (date: Date) => string;
  formatDateTime: (date: Date) => string;
  getCalendarType: () => 'gregorian' | 'jalali';
  
  // Persian-specific formatting functions
  formatPercentage?: (value: number, decimals?: number) => string;
  formatWeight?: (grams: number, unit?: 'g' | 'kg' | 'oz') => string;
  formatBusinessAmount?: (amount: number, type?: 'profit' | 'loss' | 'revenue' | 'expense') => string;
  formatInstallment?: (totalAmount: number, installmentCount: number, monthlyAmount: number) => string;
  formatRelativeTime?: (date: Date) => string;
  
  // Layout and styling helpers (legacy)
  getLayoutClasses: () => string;
  getTextAlignClass: (align?: 'start' | 'end' | 'center') => string;
  getFlexDirectionClass: (direction?: 'row' | 'column') => string;
  getMarginClass: (margin: string) => string;
  getPaddingClass: (padding: string) => string;
  getBorderClass: (border: string) => string;
  getFloatClass: (float: 'start' | 'end') => string;
  
  // Enhanced direction adapter methods
  directionAdapter: any; // DirectionAdapter interface
  getLayoutClassesEnhanced: (baseClasses: string) => string;
  getFlexDirectionEnhanced: (flexDirection: 'row' | 'column') => string;
  getTextAlignEnhanced: (align: 'left' | 'right' | 'center') => string;
  getMarginPaddingEnhanced: (property: string, value: string) => Record<string, string>;
  adaptChartConfig: (config: any) => any;
  getDirectionalClasses: (componentType: string) => string;
  getIconClasses: (iconPosition?: 'start' | 'end') => string;
  
  // Direction utilities
  getDirectionClass: () => string;
  getDocumentDirection: () => string;
  getTextAlignment: () => 'left' | 'right';
  applyDocumentDirection: () => void;
  
  // API translation support
  translateApiResponse: (response: any) => any;
  getApiLanguageHeaders: () => Record<string, string>;
  
  // Translation management (development/admin features)
  validateTranslations: () => Promise<TranslationValidationResult>;
  auditTranslations: () => Promise<TranslationAuditResult>;
  exportTranslations: (language: Language) => Promise<string>;
  importTranslations: (language: Language, data: string) => Promise<boolean>;
  
  // Translation registry access
  getTranslationRegistry: () => TranslationRegistry;
  updateTranslationRegistry: (updates: Partial<TranslationRegistry>) => void;
  
  // Missing translation tracking
  getMissingTranslations: () => string[];
  reportMissingTranslation: (key: string) => void;
  clearMissingTranslations: () => void;
}

// Language information
export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  direction: Direction;
  locale: string;
  flag: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    currency: {
      symbol: string;
      position: 'before' | 'after';
    };
    persianDigits?: boolean;
    useJalaliCalendar?: boolean;
  };
}

// Translation key extraction result
export interface TranslationKeyExtractionResult {
  file: string;
  keys: ExtractedTranslationKey[];
  hardcodedStrings: HardcodedString[];
}

export interface ExtractedTranslationKey {
  key: string;
  line: number;
  column: number;
  context: string;
  function: 't' | 'tSafe' | 'hasTranslation';
  parameters?: Record<string, any>;
}

export interface HardcodedString {
  text: string;
  line: number;
  column: number;
  context: string;
  suggestion?: string;
}

// Translation build validation
export interface TranslationBuildValidation {
  success: boolean;
  errors: TranslationBuildError[];
  warnings: TranslationBuildWarning[];
  statistics: {
    totalFiles: number;
    totalKeys: number;
    validatedKeys: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface TranslationBuildError {
  type: 'missing_translation' | 'invalid_key' | 'type_error' | 'syntax_error';
  file: string;
  line: number;
  column: number;
  key: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface TranslationBuildWarning {
  type: 'unused_key' | 'deprecated_key' | 'inconsistent_format';
  file: string;
  key: string;
  message: string;
  suggestion?: string;
}

// Translation cache management
export interface TranslationCache {
  language: Language;
  translations: Record<string, string>;
  lastUpdated: Date;
  version: string;
}

export interface TranslationCacheManager {
  get: (language: Language) => TranslationCache | null;
  set: (language: Language, cache: TranslationCache) => void;
  clear: (language?: Language) => void;
  isValid: (language: Language) => boolean;
  getVersion: (language: Language) => string | null;
}