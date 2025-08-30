// Enhanced Translation Management System

import { 
  Language, 
  Direction, 
  TranslationEntry, 
  TranslationRegistry, 
  TranslationValidationResult, 
  TranslationAuditResult, 
  TranslationKeyExtractionResult,
  TranslationBuildValidation,
  TranslationCache,
  TranslationCacheManager,
  LanguageInfo
} from '../types/translation';

// Language configuration
export const LANGUAGE_CONFIG: Record<Language, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    locale: 'en-US',
    flag: '🇺🇸',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: {
        symbol: '$',
        position: 'before'
      }
    }
  },
  fa: {
    code: 'fa',
    name: 'Persian',
    nativeName: 'فارسی',
    direction: 'rtl',
    locale: 'fa-IR',
    flag: '🇮🇷',
    dateFormat: 'yyyy/MM/dd',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: {
        symbol: 'ریال',
        position: 'after'
      },
      persianDigits: true,
      useJalaliCalendar: true
    }
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    locale: 'ar-SA',
    flag: '🇸🇦',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: {
        symbol: 'ريال',
        position: 'after'
      }
    }
  }
};

// Translation Cache Manager Implementation
class TranslationCacheManagerImpl implements TranslationCacheManager {
  private cache: Map<Language, TranslationCache> = new Map();
  private readonly CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  get(language: Language): TranslationCache | null {
    const cached = this.cache.get(language);
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.lastUpdated.getTime() > this.CACHE_EXPIRY_MS) {
      this.cache.delete(language);
      return null;
    }
    
    return cached;
  }

  set(language: Language, cache: TranslationCache): void {
    this.cache.set(language, cache);
  }

  clear(language?: Language): void {
    if (language) {
      this.cache.delete(language);
    } else {
      this.cache.clear();
    }
  }

  isValid(language: Language): boolean {
    const cached = this.get(language);
    return cached !== null;
  }

  getVersion(language: Language): string | null {
    const cached = this.get(language);
    return cached?.version || null;
  }
}

// Translation Manager Class
export class TranslationManager {
  private static instance: TranslationManager;
  private cacheManager: TranslationCacheManager;
  private missingTranslations: Set<string> = new Set();
  private translationRegistry: TranslationRegistry;

  private constructor() {
    this.cacheManager = new TranslationCacheManagerImpl();
    this.translationRegistry = this.initializeRegistry();
  }

  public static getInstance(): TranslationManager {
    if (!TranslationManager.instance) {
      TranslationManager.instance = new TranslationManager();
    }
    return TranslationManager.instance;
  }

  private initializeRegistry(): TranslationRegistry {
    return {
      pages: {},
      components: {},
      forms: {},
      api: {
        errors: {},
        messages: {},
        status: {}
      },
      common: {}
    };
  }

  // Translation key validation
  public validateTranslationKey(key: string): boolean {
    // Check if key follows naming convention: category.subcategory.item
    const keyPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)*$/;
    return keyPattern.test(key);
  }

  // Safe translation with fallback
  public translateSafe(
    translations: Record<string, string>, 
    key: string, 
    fallback: string, 
    params?: Record<string, any>
  ): string {
    let translation = translations[key];
    
    if (!translation) {
      this.reportMissingTranslation(key);
      translation = fallback;
    }

    // Handle parameter interpolation
    if (params && translation) {
      Object.keys(params).forEach(param => {
        const placeholder = `{${param}}`;
        translation = translation.replace(new RegExp(placeholder, 'g'), String(params[param]));
      });
    }

    return translation;
  }

  // Translation with fallback language
  public translateWithFallback(
    allTranslations: Record<Language, Record<string, string>>,
    key: string,
    language: Language,
    fallbackLanguage: Language = 'en',
    params?: Record<string, any>
  ): string {
    let translation = allTranslations[language]?.[key];
    
    if (!translation && language !== fallbackLanguage) {
      translation = allTranslations[fallbackLanguage]?.[key];
    }
    
    if (!translation) {
      this.reportMissingTranslation(key);
      return `[${key}]`;
    }

    // Handle parameter interpolation
    if (params) {
      Object.keys(params).forEach(param => {
        const placeholder = `{${param}}`;
        translation = translation.replace(new RegExp(placeholder, 'g'), String(params[param]));
      });
    }

    return translation;
  }

  // Check if translation exists
  public hasTranslation(translations: Record<string, string>, key: string): boolean {
    return key in translations && translations[key].trim() !== '';
  }

  // Report missing translation
  public reportMissingTranslation(key: string): void {
    this.missingTranslations.add(key);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation key: ${key}`);
    }
  }

  // Get missing translations
  public getMissingTranslations(): string[] {
    return Array.from(this.missingTranslations);
  }

  // Clear missing translations
  public clearMissingTranslations(): void {
    this.missingTranslations.clear();
  }

  // Persian digit conversion
  private convertToPersianDigits(str: string): string {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.replace(/[0-9]/g, (digit) => persianDigits[parseInt(digit)]);
  }

  // Convert Persian digits to English
  private convertToEnglishDigits(str: string): string {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    let result = str;
    persianDigits.forEach((persianDigit, index) => {
      result = result.replace(new RegExp(persianDigit, 'g'), index.toString());
    });
    return result;
  }

  // Jalali calendar conversion (basic implementation)
  private gregorianToJalali(date: Date): { year: number; month: number; day: number } {
    // This is a simplified Jalali conversion
    // In a production app, you'd use a proper library like moment-jalaali
    const gy = date.getFullYear();
    const gm = date.getMonth() + 1;
    const gd = date.getDate();
    
    // Simplified conversion algorithm (approximate)
    let jy = gy - 621;
    let jm = gm;
    let jd = gd;
    
    // Adjust for Persian calendar differences
    if (gm <= 3) {
      jy -= 1;
      jm += 9;
    } else {
      jm -= 3;
    }
    
    // Basic day adjustment (this is very simplified)
    if (jm <= 6) {
      // First 6 months have 31 days
      if (jd > 31) {
        jm += 1;
        jd -= 31;
      }
    } else {
      // Last 6 months have 30 days (except last month in leap years)
      if (jd > 30) {
        jm += 1;
        jd -= 30;
      }
    }
    
    return { year: jy, month: jm, day: jd };
  }

  // Format number based on language
  public formatNumber(num: number, language: Language): string {
    const config = LANGUAGE_CONFIG[language];
    
    try {
      let formatted = new Intl.NumberFormat(config.locale).format(num);
      
      // Convert to Persian digits if needed
      if (language === 'fa' && (config.numberFormat as any).persianDigits) {
        formatted = this.convertToPersianDigits(formatted);
      }
      
      return formatted;
    } catch (error) {
      console.warn(`Number formatting failed for language ${language}:`, error);
      return num.toString();
    }
  }

  // Format currency based on language
  public formatCurrency(amount: number, language: Language, currency?: string): string {
    const config = LANGUAGE_CONFIG[language];
    
    try {
      let formatted: string;
      
      if (currency) {
        formatted = new Intl.NumberFormat(config.locale, {
          style: 'currency',
          currency: currency
        }).format(amount);
      } else {
        // Use custom currency symbol
        const numberFormatted = new Intl.NumberFormat(config.locale).format(amount);
        const symbol = config.numberFormat.currency.symbol;
        
        formatted = config.numberFormat.currency.position === 'before' 
          ? `${symbol}${numberFormatted}`
          : `${numberFormatted} ${symbol}`;
      }
      
      // Convert to Persian digits if needed
      if (language === 'fa' && (config.numberFormat as any).persianDigits) {
        formatted = this.convertToPersianDigits(formatted);
      }
      
      return formatted;
    } catch (error) {
      console.warn(`Currency formatting failed for language ${language}:`, error);
      return amount.toString();
    }
  }

  // Format date based on language
  public formatDate(date: Date, language: Language, format?: string): string {
    const config = LANGUAGE_CONFIG[language];
    
    try {
      let formatted: string;
      
      // Use Jalali calendar for Persian
      if (language === 'fa' && (config.numberFormat as any).useJalaliCalendar) {
        const jalali = this.gregorianToJalali(date);
        formatted = `${jalali.year}/${jalali.month.toString().padStart(2, '0')}/${jalali.day.toString().padStart(2, '0')}`;
        
        // Convert to Persian digits
        if ((config.numberFormat as any).persianDigits) {
          formatted = this.convertToPersianDigits(formatted);
        }
      } else {
        if (format) {
          // Custom format handling would go here
          formatted = new Intl.DateTimeFormat(config.locale).format(date);
        } else {
          formatted = new Intl.DateTimeFormat(config.locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(date);
        }
        
        // Convert to Persian digits if needed
        if (language === 'fa' && (config.numberFormat as any).persianDigits) {
          formatted = this.convertToPersianDigits(formatted);
        }
      }
      
      return formatted;
    } catch (error) {
      console.warn(`Date formatting failed for language ${language}:`, error);
      return date.toLocaleDateString();
    }
  }

  // Format time based on language
  public formatTime(date: Date, language: Language): string {
    const config = LANGUAGE_CONFIG[language];
    
    try {
      let formatted = new Intl.DateTimeFormat(config.locale, {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
      
      // Convert to Persian digits if needed
      if (language === 'fa' && (config.numberFormat as any).persianDigits) {
        formatted = this.convertToPersianDigits(formatted);
      }
      
      return formatted;
    } catch (error) {
      console.warn(`Time formatting failed for language ${language}:`, error);
      return date.toLocaleTimeString();
    }
  }

  // Get layout classes for RTL/LTR
  public getLayoutClasses(language: Language): string {
    const direction = LANGUAGE_CONFIG[language].direction;
    return direction === 'rtl' ? 'rtl' : 'ltr';
  }

  // Get text alignment class
  public getTextAlignClass(language: Language, align: 'start' | 'end' | 'center' = 'start'): string {
    const direction = LANGUAGE_CONFIG[language].direction;
    
    if (align === 'center') return 'text-center';
    
    if (direction === 'rtl') {
      return align === 'start' ? 'text-right' : 'text-left';
    } else {
      return align === 'start' ? 'text-left' : 'text-right';
    }
  }

  // Get flex direction class
  public getFlexDirectionClass(language: Language, direction: 'row' | 'column' = 'row'): string {
    if (direction === 'column') return 'flex-col';
    
    const langDirection = LANGUAGE_CONFIG[language].direction;
    return langDirection === 'rtl' ? 'flex-row-reverse' : 'flex-row';
  }

  // Get margin class with RTL support
  public getMarginClass(language: Language, margin: string): string {
    const direction = LANGUAGE_CONFIG[language].direction;
    
    if (direction === 'rtl') {
      // Convert left/right margins for RTL
      let result = margin;
      
      // Replace ml- with temporary placeholder
      result = result.replace(/ml-/g, 'TEMP_MR_');
      // Replace mr- with ml-
      result = result.replace(/mr-/g, 'ml-');
      // Replace temporary placeholder with mr-
      result = result.replace(/TEMP_MR_/g, 'mr-');
      
      return result;
    }
    
    return margin;
  }

  // Get padding class with RTL support
  public getPaddingClass(language: Language, padding: string): string {
    const direction = LANGUAGE_CONFIG[language].direction;
    
    if (direction === 'rtl') {
      // Convert left/right paddings for RTL
      return padding
        .replace(/pl-/g, 'temp-pr-')
        .replace(/pr-/g, 'pl-')
        .replace(/temp-pr-/g, 'pr-');
    }
    
    return padding;
  }

  // Get border class with RTL support
  public getBorderClass(language: Language, border: string): string {
    const direction = LANGUAGE_CONFIG[language].direction;
    
    if (direction === 'rtl') {
      // Convert left/right borders for RTL
      return border
        .replace(/border-l/g, 'temp-border-r')
        .replace(/border-r/g, 'border-l')
        .replace(/temp-border-r/g, 'border-r');
    }
    
    return border;
  }

  // Get float class with RTL support
  public getFloatClass(language: Language, float: 'start' | 'end'): string {
    const direction = LANGUAGE_CONFIG[language].direction;
    
    if (direction === 'rtl') {
      return float === 'start' ? 'float-right' : 'float-left';
    } else {
      return float === 'start' ? 'float-left' : 'float-right';
    }
  }

  // Format percentage based on language
  public formatPercentage(value: number, language: Language, decimals: number = 1): string {
    const config = LANGUAGE_CONFIG[language];
    
    try {
      let formatted = new Intl.NumberFormat(config.locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value / 100);
      
      // Convert to Persian digits if needed
      if (language === 'fa' && (config.numberFormat as any).persianDigits) {
        formatted = this.convertToPersianDigits(formatted);
      }
      
      return formatted;
    } catch (error) {
      console.warn(`Percentage formatting failed for language ${language}:`, error);
      return `${value}%`;
    }
  }

  // Format weight (for gold/jewelry) based on language
  public formatWeight(grams: number, language: Language, unit: 'g' | 'kg' | 'oz' = 'g'): string {
    const config = LANGUAGE_CONFIG[language];
    let value = grams;
    let unitLabel: string = unit;
    
    // Convert units if needed
    switch (unit) {
      case 'kg':
        value = grams / 1000;
        unitLabel = language === 'fa' ? 'کیلوگرم' : 'kg';
        break;
      case 'oz':
        value = grams / 28.3495;
        unitLabel = language === 'fa' ? 'اونس' : 'oz';
        break;
      default:
        unitLabel = language === 'fa' ? 'گرم' : 'g';
    }
    
    try {
      let formatted = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: unit === 'g' ? 1 : 2,
        maximumFractionDigits: unit === 'g' ? 1 : 2
      }).format(value);
      
      // Convert to Persian digits if needed
      if (language === 'fa' && (config.numberFormat as any).persianDigits) {
        formatted = this.convertToPersianDigits(formatted);
      }
      
      return `${formatted} ${unitLabel}`;
    } catch (error) {
      console.warn(`Weight formatting failed for language ${language}:`, error);
      return `${value} ${unitLabel}`;
    }
  }

  // Format business calculations (profit, loss, etc.)
  public formatBusinessAmount(amount: number, language: Language, type: 'profit' | 'loss' | 'revenue' | 'expense' = 'revenue'): string {
    const config = LANGUAGE_CONFIG[language];
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    try {
      let formatted = this.formatCurrency(absAmount, language);
      
      // Add prefix/suffix based on type and language
      if (language === 'fa') {
        switch (type) {
          case 'profit':
            formatted = isNegative ? `ضرر ${formatted}` : `سود ${formatted}`;
            break;
          case 'loss':
            formatted = `ضرر ${formatted}`;
            break;
          case 'expense':
            formatted = `هزینه ${formatted}`;
            break;
          default:
            formatted = isNegative ? `-${formatted}` : formatted;
        }
      } else {
        switch (type) {
          case 'profit':
            formatted = isNegative ? `Loss ${formatted}` : `Profit ${formatted}`;
            break;
          case 'loss':
            formatted = `Loss ${formatted}`;
            break;
          case 'expense':
            formatted = `Expense ${formatted}`;
            break;
          default:
            formatted = isNegative ? `-${formatted}` : formatted;
        }
      }
      
      return formatted;
    } catch (error) {
      console.warn(`Business amount formatting failed for language ${language}:`, error);
      return amount.toString();
    }
  }

  // Format installment payment information
  public formatInstallment(
    totalAmount: number, 
    installmentCount: number, 
    monthlyAmount: number, 
    language: Language
  ): string {
    try {
      const total = this.formatCurrency(totalAmount, language);
      const monthly = this.formatCurrency(monthlyAmount, language);
      let count = installmentCount.toString();
      
      // Convert count to Persian digits if needed
      if (language === 'fa' && (LANGUAGE_CONFIG[language].numberFormat as any).persianDigits) {
        count = this.convertToPersianDigits(count);
      }
      
      if (language === 'fa') {
        return `${count} قسط ${monthly} از مجموع ${total}`;
      } else {
        return `${count} installments of ${monthly} from total ${total}`;
      }
    } catch (error) {
      console.warn(`Installment formatting failed for language ${language}:`, error);
      return `${installmentCount} x ${monthlyAmount}`;
    }
  }

  // Format relative time (e.g., "2 hours ago")
  public formatRelativeTime(date: Date, language: Language): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    try {
      let result: string;
      
      if (diffMinutes < 1) {
        result = language === 'fa' ? 'همین الان' : 'just now';
      } else if (diffMinutes < 60) {
        const minutes = diffMinutes.toString();
        const persianMinutes = language === 'fa' && (LANGUAGE_CONFIG[language].numberFormat as any).persianDigits 
          ? this.convertToPersianDigits(minutes) 
          : minutes;
        result = language === 'fa' ? `${persianMinutes} دقیقه پیش` : `${minutes} minutes ago`;
      } else if (diffHours < 24) {
        const hours = diffHours.toString();
        const persianHours = language === 'fa' && (LANGUAGE_CONFIG[language].numberFormat as any).persianDigits 
          ? this.convertToPersianDigits(hours) 
          : hours;
        result = language === 'fa' ? `${persianHours} ساعت پیش` : `${hours} hours ago`;
      } else {
        const days = diffDays.toString();
        const persianDays = language === 'fa' && (LANGUAGE_CONFIG[language].numberFormat as any).persianDigits 
          ? this.convertToPersianDigits(days) 
          : days;
        result = language === 'fa' ? `${persianDays} روز پیش` : `${days} days ago`;
      }
      
      return result;
    } catch (error) {
      console.warn(`Relative time formatting failed for language ${language}:`, error);
      return this.formatDate(date, language);
    }
  }

  // Get API language headers
  public getApiLanguageHeaders(language: Language): Record<string, string> {
    return {
      'Accept-Language': language,
      'Content-Language': language,
      'X-Language': language,
      'X-Direction': LANGUAGE_CONFIG[language].direction
    };
  }

  // Translate API response (placeholder for future implementation)
  public translateApiResponse(response: any, language: Language): any {
    // This would implement API response translation
    // For now, just return the response as-is
    return response;
  }

  // Get translation registry
  public getTranslationRegistry(): TranslationRegistry {
    return this.translationRegistry;
  }

  // Update translation registry
  public updateTranslationRegistry(updates: Partial<TranslationRegistry>): void {
    this.translationRegistry = { ...this.translationRegistry, ...updates };
  }

  // Validate translations (placeholder for future implementation)
  public async validateTranslations(): Promise<TranslationValidationResult> {
    // This would implement comprehensive translation validation
    return {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {
        totalKeys: 0,
        translatedKeys: 0,
        missingKeys: 0,
        unusedKeys: 0,
        duplicateKeys: 0,
        completionPercentage: 100
      }
    };
  }

  // Audit translations (placeholder for future implementation)
  public async auditTranslations(): Promise<TranslationAuditResult> {
    // This would implement comprehensive translation audit
    return {
      timestamp: new Date(),
      totalFiles: 0,
      totalComponents: 0,
      totalKeys: 0,
      languages: {
        en: { completionPercentage: 100, missingKeys: [], unusedKeys: [], duplicateKeys: [] },
        fa: { completionPercentage: 100, missingKeys: [], unusedKeys: [], duplicateKeys: [] },
        ar: { completionPercentage: 100, missingKeys: [], unusedKeys: [], duplicateKeys: [] }
      },
      recommendations: []
    };
  }

  // Export translations
  public async exportTranslations(language: Language): Promise<string> {
    // This would export translations in a specific format
    return JSON.stringify({}, null, 2);
  }

  // Import translations
  public async importTranslations(language: Language, data: string): Promise<boolean> {
    // This would import translations from a specific format
    try {
      JSON.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  // Cache management
  public getCacheManager(): TranslationCacheManager {
    return this.cacheManager;
  }
}

// Export singleton instance
export const translationManager = TranslationManager.getInstance();

// Utility functions
export const getLanguageInfo = (language: Language): LanguageInfo => {
  return LANGUAGE_CONFIG[language];
};

export const getSupportedLanguages = (): Language[] => {
  return Object.keys(LANGUAGE_CONFIG) as Language[];
};

export const getDirection = (language: Language): Direction => {
  return LANGUAGE_CONFIG[language].direction;
};

export const isRTL = (language: Language): boolean => {
  return LANGUAGE_CONFIG[language].direction === 'rtl';
};

export const isLTR = (language: Language): boolean => {
  return LANGUAGE_CONFIG[language].direction === 'ltr';
};