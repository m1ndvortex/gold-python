// Translation Audit and Validation Utilities

import { 
  Language, 
  TranslationKeyExtractionResult, 
  ExtractedTranslationKey, 
  HardcodedString,
  TranslationValidationResult,
  TranslationValidationError,
  TranslationValidationWarning,
  TranslationAuditResult,
  TranslationRecommendation
} from '../types/translation';

// Translation key extraction patterns
const TRANSLATION_PATTERNS = {
  // t('key') or t("key")
  tFunction: /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g,
  // tSafe('key', 'fallback') or tSafe("key", "fallback")
  tSafeFunction: /\btSafe\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]/g,
  // hasTranslation('key') or hasTranslation("key")
  hasTranslationFunction: /\bhasTranslation\s*\(\s*['"`]([^'"`]+)['"`]/g,
  // Hardcoded strings (basic detection)
  hardcodedStrings: /(?:>|\s|=)(['"`])([A-Z][^'"`]{3,})(['"`])/g
};

// File patterns to scan
const SCANNABLE_FILE_PATTERNS = [
  '**/*.tsx',
  '**/*.ts',
  '**/*.jsx',
  '**/*.js'
];

// Files to exclude from scanning
const EXCLUDED_FILE_PATTERNS = [
  '**/node_modules/**',
  '**/build/**',
  '**/dist/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/coverage/**'
];

export class TranslationAuditor {
  private static instance: TranslationAuditor;

  private constructor() {}

  public static getInstance(): TranslationAuditor {
    if (!TranslationAuditor.instance) {
      TranslationAuditor.instance = new TranslationAuditor();
    }
    return TranslationAuditor.instance;
  }

  // Extract translation keys from file content
  public extractTranslationKeys(filePath: string, content: string): TranslationKeyExtractionResult {
    const keys: ExtractedTranslationKey[] = [];
    const hardcodedStrings: HardcodedString[] = [];
    const lines = content.split('\n');

    // Extract t() function calls
    let match;
    while ((match = TRANSLATION_PATTERNS.tFunction.exec(content)) !== null) {
      const key = match[1];
      const position = this.getLineAndColumn(content, match.index);
      const context = this.getContext(lines, position.line);

      keys.push({
        key,
        line: position.line,
        column: position.column,
        context,
        function: 't'
      });
    }

    // Extract tSafe() function calls
    TRANSLATION_PATTERNS.tSafeFunction.lastIndex = 0;
    while ((match = TRANSLATION_PATTERNS.tSafeFunction.exec(content)) !== null) {
      const key = match[1];
      const fallback = match[2];
      const position = this.getLineAndColumn(content, match.index);
      const context = this.getContext(lines, position.line);

      keys.push({
        key,
        line: position.line,
        column: position.column,
        context,
        function: 'tSafe',
        parameters: { fallback }
      });
    }

    // Extract hasTranslation() function calls
    TRANSLATION_PATTERNS.hasTranslationFunction.lastIndex = 0;
    while ((match = TRANSLATION_PATTERNS.hasTranslationFunction.exec(content)) !== null) {
      const key = match[1];
      const position = this.getLineAndColumn(content, match.index);
      const context = this.getContext(lines, position.line);

      keys.push({
        key,
        line: position.line,
        column: position.column,
        context,
        function: 'hasTranslation'
      });
    }

    // Extract potential hardcoded strings
    TRANSLATION_PATTERNS.hardcodedStrings.lastIndex = 0;
    while ((match = TRANSLATION_PATTERNS.hardcodedStrings.exec(content)) !== null) {
      const text = match[2];
      const position = this.getLineAndColumn(content, match.index);
      const context = this.getContext(lines, position.line);

      // Skip if it looks like a translation key or common non-translatable strings
      if (this.shouldSkipHardcodedString(text)) {
        continue;
      }

      hardcodedStrings.push({
        text,
        line: position.line,
        column: position.column,
        context,
        suggestion: this.generateTranslationKeySuggestion(text)
      });
    }

    return {
      file: filePath,
      keys,
      hardcodedStrings
    };
  }

  // Get line and column from character index
  private getLineAndColumn(content: string, index: number): { line: number; column: number } {
    const beforeIndex = content.substring(0, index);
    const lines = beforeIndex.split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  // Get context around a line
  private getContext(lines: string[], lineNumber: number, contextLines: number = 2): string {
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);
    return lines.slice(start, end).join('\n');
  }

  // Check if hardcoded string should be skipped
  private shouldSkipHardcodedString(text: string): boolean {
    const skipPatterns = [
      /^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)*$/, // Translation key pattern
      /^[A-Z_][A-Z0-9_]*$/, // Constants
      /^https?:\/\//, // URLs
      /^\/[a-zA-Z0-9\/\-_]*$/, // Paths
      /^[0-9]+$/, // Numbers
      /^[a-zA-Z]{1,3}$/, // Short abbreviations
      /^(true|false|null|undefined)$/, // Literals
      /^(px|em|rem|%|vh|vw)$/, // CSS units
      /^#[0-9a-fA-F]{3,6}$/, // Hex colors
      /^rgb\(|rgba\(/, // RGB colors
      /^[A-Z]{2,4}$/, // Currency codes, country codes
    ];

    return skipPatterns.some(pattern => pattern.test(text));
  }

  // Generate translation key suggestion from text
  private generateTranslationKeySuggestion(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  // Validate translation completeness
  public validateTranslationCompleteness(
    allTranslations: Record<Language, Record<string, string>>,
    usedKeys: string[]
  ): TranslationValidationResult {
    const errors: TranslationValidationError[] = [];
    const warnings: TranslationValidationWarning[] = [];
    const languages = Object.keys(allTranslations) as Language[];
    
    // Check for missing translations
    languages.forEach(language => {
      const translations = allTranslations[language];
      usedKeys.forEach(key => {
        if (!translations[key] || translations[key].trim() === '') {
          errors.push({
            type: 'missing_key',
            key,
            language,
            message: `Missing translation for key "${key}" in language "${language}"`
          });
        }
      });
    });

    // Check for unused translations
    languages.forEach(language => {
      const translations = allTranslations[language];
      Object.keys(translations).forEach(key => {
        if (!usedKeys.includes(key)) {
          warnings.push({
            type: 'unused_key',
            key,
            language,
            message: `Unused translation key "${key}" in language "${language}"`,
            suggestion: `Consider removing this key if it's no longer needed`
          });
        }
      });
    });

    // Check for duplicate keys (case-insensitive)
    languages.forEach(language => {
      const translations = allTranslations[language];
      const keyMap = new Map<string, string[]>();
      
      Object.keys(translations).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (!keyMap.has(lowerKey)) {
          keyMap.set(lowerKey, []);
        }
        keyMap.get(lowerKey)!.push(key);
      });

      keyMap.forEach((keys, lowerKey) => {
        if (keys.length > 1) {
          keys.forEach(key => {
            errors.push({
              type: 'duplicate_key',
              key,
              language,
              message: `Duplicate key "${key}" (case-insensitive) in language "${language}". Similar keys: ${keys.join(', ')}`
            });
          });
        }
      });
    });

    // Calculate statistics
    const totalKeys = usedKeys.length;
    const translatedKeys = languages.reduce((acc, language) => {
      const translations = allTranslations[language];
      const translated = usedKeys.filter(key => translations[key] && translations[key].trim() !== '').length;
      return acc + translated;
    }, 0);
    const missingKeys = errors.filter(e => e.type === 'missing_key').length;
    const unusedKeys = warnings.filter(w => w.type === 'unused_key').length;
    const duplicateKeys = errors.filter(e => e.type === 'duplicate_key').length;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics: {
        totalKeys,
        translatedKeys,
        missingKeys,
        unusedKeys,
        duplicateKeys,
        completionPercentage: totalKeys > 0 ? Math.round((translatedKeys / (totalKeys * languages.length)) * 100) : 100
      }
    };
  }

  // Generate audit report
  public generateAuditReport(
    extractionResults: TranslationKeyExtractionResult[],
    allTranslations: Record<Language, Record<string, string>>
  ): TranslationAuditResult {
    const usedKeys = new Set<string>();
    const hardcodedStrings: HardcodedString[] = [];

    // Collect all used keys and hardcoded strings
    extractionResults.forEach(result => {
      result.keys.forEach(key => usedKeys.add(key.key));
      hardcodedStrings.push(...result.hardcodedStrings);
    });

    const usedKeysArray = Array.from(usedKeys);
    const languages = Object.keys(allTranslations) as Language[];

    // Validate translations
    const validation = this.validateTranslationCompleteness(allTranslations, usedKeysArray);

    // Generate recommendations
    const recommendations: TranslationRecommendation[] = [];

    // Add missing translation recommendations
    validation.errors
      .filter(e => e.type === 'missing_key')
      .forEach(error => {
        recommendations.push({
          type: 'add_translation',
          priority: 'high',
          key: error.key,
          language: error.language,
          description: `Add missing translation for "${error.key}" in ${error.language}`,
          action: `Add translation for key "${error.key}" in language "${error.language}"`
        });
      });

    // Add unused key recommendations
    validation.warnings
      .filter(w => w.type === 'unused_key')
      .forEach(warning => {
        recommendations.push({
          type: 'remove_unused',
          priority: 'low',
          key: warning.key,
          language: warning.language,
          description: `Remove unused translation key "${warning.key}"`,
          action: `Remove unused key "${warning.key}" from language "${warning.language}"`
        });
      });

    // Add hardcoded string recommendations
    hardcodedStrings.forEach(hardcoded => {
      recommendations.push({
        type: 'add_translation',
        priority: 'medium',
        key: hardcoded.suggestion || 'unknown',
        description: `Replace hardcoded string "${hardcoded.text}" with translation`,
        action: `Create translation key for "${hardcoded.text}" and replace hardcoded usage`
      });
    });

    // Calculate language-specific statistics
    const languageStats: Record<Language, any> = {} as any;
    languages.forEach(language => {
      const translations = allTranslations[language];
      const missingKeys = usedKeysArray.filter(key => !translations[key] || translations[key].trim() === '');
      const unusedKeys = Object.keys(translations).filter(key => !usedKeysArray.includes(key));
      const duplicateKeys: string[] = []; // Would need more complex logic to detect duplicates

      languageStats[language] = {
        completionPercentage: usedKeysArray.length > 0 
          ? Math.round(((usedKeysArray.length - missingKeys.length) / usedKeysArray.length) * 100)
          : 100,
        missingKeys,
        unusedKeys,
        duplicateKeys
      };
    });

    return {
      timestamp: new Date(),
      totalFiles: extractionResults.length,
      totalComponents: extractionResults.length, // Simplified
      totalKeys: usedKeysArray.length,
      languages: languageStats,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
    };
  }

  // Detect missing translation keys in runtime
  public detectMissingKeysInRuntime(): string[] {
    // This would integrate with the translation manager to get runtime missing keys
    // For now, return empty array
    return [];
  }

  // Generate translation coverage report
  public generateCoverageReport(
    allTranslations: Record<Language, Record<string, string>>,
    usedKeys: string[]
  ): Record<Language, { covered: number; total: number; percentage: number }> {
    const languages = Object.keys(allTranslations) as Language[];
    const report: Record<Language, { covered: number; total: number; percentage: number }> = {} as any;

    languages.forEach(language => {
      const translations = allTranslations[language];
      const covered = usedKeys.filter(key => translations[key] && translations[key].trim() !== '').length;
      const total = usedKeys.length;
      const percentage = total > 0 ? Math.round((covered / total) * 100) : 100;

      report[language] = { covered, total, percentage };
    });

    return report;
  }
}

// Export singleton instance
export const translationAuditor = TranslationAuditor.getInstance();

// Utility functions for translation validation
export const validateTranslationKey = (key: string): boolean => {
  const keyPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)*$/;
  return keyPattern.test(key);
};

export const extractKeysFromContent = (content: string): string[] => {
  const keys: string[] = [];
  const patterns = [
    /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /\btSafe\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /\bhasTranslation\s*\(\s*['"`]([^'"`]+)['"`]/g
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      keys.push(match[1]);
    }
  });

  return Array.from(new Set(keys)); // Remove duplicates
};

export const findHardcodedStrings = (content: string): string[] => {
  const hardcodedStrings: string[] = [];
  const patterns = [
    // Strings in JSX content: >Text<
    />([A-Z][^<]{2,})</g,
    // Strings in attributes: ="Text"
    /=["']([A-Z][^"']{2,})["']/g,
    // Strings in template literals: `Text`
    /`([A-Z][^`]{2,})`/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1];
      
      // Skip common non-translatable patterns
      if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)*$/.test(text) && // Not a translation key
          !/^[A-Z_][A-Z0-9_]*$/.test(text) && // Not a constant
          !/^https?:\/\//.test(text) && // Not a URL
          !/^\/[a-zA-Z0-9\/\-_]*$/.test(text) && // Not a path
          !/^[0-9]+$/.test(text) && // Not a number
          text.length > 2) {
        hardcodedStrings.push(text);
      }
    }
  });

  return Array.from(new Set(hardcodedStrings)); // Remove duplicates
};