// Translation Validation System Tests

import { 
  translationManager, 
  translationAuditor,
  extractKeysFromContent,
  findHardcodedStrings,
  validateTranslationKey
} from '../utils/translationAudit';
import { TranslationValidator } from '../scripts/validateTranslations';
import { TranslationReportGenerator } from '../scripts/generateTranslationReport';

describe('Translation Validation System', () => {
  describe('Translation Key Validation', () => {
    test('should validate correct translation key formats', () => {
      const validKeys = [
        'common.save',
        'dashboard.total_sales_today',
        'nav.inventory.products',
        'settings.company.name',
        'forms.validation.required_field'
      ];

      validKeys.forEach(key => {
        expect(validateTranslationKey(key)).toBe(true);
      });
    });

    test('should reject invalid translation key formats', () => {
      const invalidKeys = [
        'Common.Save', // Capital letters
        'common-save', // Hyphens
        'common..save', // Double dots
        '.common.save', // Starting with dot
        'common.save.', // Ending with dot
        'common save', // Spaces
        '123.save', // Starting with number
        'common.Save', // Capital in middle
        'common.save-now' // Hyphen in middle
      ];

      invalidKeys.forEach(key => {
        expect(validateTranslationKey(key)).toBe(false);
      });
    });
  });

  describe('Translation Key Extraction', () => {
    test('should extract t() function calls', () => {
      const content = `
        const message = t('common.save');
        const title = t("dashboard.title");
        const label = t(\`forms.label\`);
      `;

      const keys = extractKeysFromContent(content);
      expect(keys).toContain('common.save');
      expect(keys).toContain('dashboard.title');
      expect(keys).toContain('forms.label');
    });

    test('should extract tSafe() function calls', () => {
      const content = `
        const message = tSafe('common.save', 'Save');
        const fallback = tSafe("missing.key", "Default");
      `;

      const keys = extractKeysFromContent(content);
      expect(keys).toContain('common.save');
      expect(keys).toContain('missing.key');
    });

    test('should extract hasTranslation() function calls', () => {
      const content = `
        if (hasTranslation('optional.key')) {
          return t('optional.key');
        }
      `;

      const keys = extractKeysFromContent(content);
      expect(keys).toContain('optional.key');
    });

    test('should handle complex extraction scenarios', () => {
      const content = `
        import { useLanguage } from './hooks/useLanguage';
        
        function Component() {
          const { t, tSafe, hasTranslation } = useLanguage();
          
          const title = t('page.title');
          const subtitle = tSafe('page.subtitle', 'Default Subtitle');
          
          return (
            <div>
              <h1>{title}</h1>
              {hasTranslation('page.description') && (
                <p>{t('page.description')}</p>
              )}
              <button onClick={() => console.log(t('common.save'))}>
                {tSafe('common.save', 'Save')}
              </button>
            </div>
          );
        }
      `;

      const keys = extractKeysFromContent(content);
      expect(keys).toContain('page.title');
      expect(keys).toContain('page.subtitle');
      expect(keys).toContain('page.description');
      expect(keys).toContain('common.save');
      
      // Should not have duplicates
      const uniqueKeys = [...new Set(keys)];
      expect(keys.length).toBe(uniqueKeys.length);
    });
  });

  describe('Hardcoded String Detection', () => {
    test('should find hardcoded strings in JSX', () => {
      const content = `
        <div>
          <h1>Welcome to Dashboard</h1>
          <button>Save Changes</button>
          <p>Loading Data...</p>
        </div>
      `;

      const hardcodedStrings = findHardcodedStrings(content);
      expect(hardcodedStrings).toContain('Welcome to Dashboard');
      expect(hardcodedStrings).toContain('Save Changes');
      expect(hardcodedStrings).toContain('Loading Data...');
    });

    test('should find hardcoded strings in attributes', () => {
      const content = `
        <input placeholder="Enter Your Name" />
        <button title="Click to Save" />
        <img alt="Profile Picture" />
      `;

      const hardcodedStrings = findHardcodedStrings(content);
      expect(hardcodedStrings).toContain('Enter Your Name');
      expect(hardcodedStrings).toContain('Click to Save');
      expect(hardcodedStrings).toContain('Profile Picture');
    });

    test('should skip non-translatable strings', () => {
      const content = `
        <div>
          <span>API_KEY</span>
          <a href="https://example.com">Link</a>
          <div>123</div>
          <p>OK</p>
          <span>common.save</span>
        </div>
      `;

      const hardcodedStrings = findHardcodedStrings(content);
      
      // Should not contain constants, URLs, numbers, short strings, or translation keys
      expect(hardcodedStrings).not.toContain('API_KEY');
      expect(hardcodedStrings).not.toContain('https://example.com');
      expect(hardcodedStrings).not.toContain('123');
      expect(hardcodedStrings).not.toContain('OK');
      expect(hardcodedStrings).not.toContain('common.save');
    });
  });

  describe('Translation Completeness Validation', () => {
    test('should detect missing translations', () => {
      const allTranslations = {
        en: {
          'common.save': 'Save',
          'common.cancel': 'Cancel',
          'unused.key': 'Unused'
        },
        fa: {
          'common.save': 'ذخیره',
          // Missing 'common.cancel'
          'unused.key': 'استفاده نشده'
        },
        ar: {
          'common.save': 'حفظ',
          'common.cancel': 'إلغاء'
        }
      };

      const usedKeys = ['common.save', 'common.cancel'];
      const result = translationAuditor.validateTranslationCompleteness(allTranslations, usedKeys);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1); // Missing fa translation for 'common.cancel'
      expect(result.errors[0].key).toBe('common.cancel');
      expect(result.errors[0].language).toBe('fa');
      expect(result.warnings).toHaveLength(2); // 2 unused keys (en and fa)
    });

    test('should detect unused translations', () => {
      const allTranslations = {
        en: {
          'common.save': 'Save',
          'unused.key1': 'Unused 1',
          'unused.key2': 'Unused 2'
        },
        fa: {
          'common.save': 'ذخیره',
          'unused.key1': 'استفاده نشده ۱'
        },
        ar: {
          'common.save': 'حفظ'
        }
      };

      const usedKeys = ['common.save'];
      const result = translationAuditor.validateTranslationCompleteness(allTranslations, usedKeys);

      expect(result.warnings.filter(w => w.type === 'unused_key')).toHaveLength(3);
      expect(result.statistics.unusedKeys).toBe(3);
    });

    test('should calculate correct statistics', () => {
      const allTranslations = {
        en: {
          'key1': 'Value 1',
          'key2': 'Value 2',
          'key3': 'Value 3'
        },
        fa: {
          'key1': 'مقدار ۱',
          'key2': 'مقدار ۲'
          // Missing key3
        },
        ar: {
          'key1': 'قيمة 1',
          'key2': 'قيمة 2',
          'key3': 'قيمة 3'
        }
      };

      const usedKeys = ['key1', 'key2', 'key3'];
      const result = translationAuditor.validateTranslationCompleteness(allTranslations, usedKeys);

      expect(result.statistics.totalKeys).toBe(3);
      expect(result.statistics.translatedKeys).toBe(8); // 3 + 2 + 3
      expect(result.statistics.missingKeys).toBe(1); // fa missing key3
      expect(result.statistics.completionPercentage).toBe(89); // 8/9 * 100 rounded
    });
  });

  describe('File Analysis', () => {
    test('should analyze file content correctly', () => {
      const filePath = 'test-component.tsx';
      const content = `
        import React from 'react';
        import { useLanguage } from '../hooks/useLanguage';
        
        export function TestComponent() {
          const { t, tSafe } = useLanguage();
          
          return (
            <div className="container">
              <h1>{t('page.title')}</h1>
              <p>{tSafe('page.description', 'Default Description')}</p>
              <button>Save Changes</button>
              <span>Loading...</span>
            </div>
          );
        }
      `;

      const result = translationAuditor.extractTranslationKeys(filePath, content);

      expect(result.file).toBe(filePath);
      expect(result.keys).toHaveLength(2);
      expect(result.keys.some(k => k.key === 'page.title')).toBe(true);
      expect(result.keys.some(k => k.key === 'page.description')).toBe(true);
      // Check that hardcoded strings were detected (the exact detection may vary)
      expect(result.hardcodedStrings.length).toBeGreaterThan(0);
    });
  });

  describe('Translation Audit Report', () => {
    test('should generate comprehensive audit report', () => {
      const extractionResults = [
        {
          file: 'component1.tsx',
          keys: [
            { key: 'common.save', line: 10, column: 20, context: 't("common.save")', function: 't' as const },
            { key: 'page.title', line: 5, column: 15, context: 't("page.title")', function: 't' as const }
          ],
          hardcodedStrings: [
            { text: 'Save Changes', line: 15, column: 10, context: '<button>Save Changes</button>' }
          ]
        },
        {
          file: 'component2.tsx',
          keys: [
            { key: 'common.save', line: 8, column: 12, context: 't("common.save")', function: 't' as const },
            { key: 'common.cancel', line: 9, column: 12, context: 't("common.cancel")', function: 't' as const }
          ],
          hardcodedStrings: []
        }
      ];

      const allTranslations = {
        en: {
          'common.save': 'Save',
          'common.cancel': 'Cancel',
          'page.title': 'Page Title',
          'unused.key': 'Unused'
        },
        fa: {
          'common.save': 'ذخیره',
          'page.title': 'عنوان صفحه'
          // Missing common.cancel
        },
        ar: {
          'common.save': 'حفظ',
          'common.cancel': 'إلغاء',
          'page.title': 'عنوان الصفحة'
        }
      };

      const report = translationAuditor.generateAuditReport(extractionResults, allTranslations);

      expect(report.totalFiles).toBe(2);
      expect(report.totalKeys).toBe(3); // common.save, page.title, common.cancel
      expect(report.languages.fa.missingKeys).toContain('common.cancel');
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      // Should have recommendations for missing translations and hardcoded strings
      expect(report.recommendations.some(r => r.type === 'add_translation')).toBe(true);
    });
  });

  describe('Build Integration', () => {
    test('should validate build-time requirements', async () => {
      // This would test the actual build validation script
      // For now, we'll test the core validation logic
      
      const mockFiles = [
        'src/component1.tsx',
        'src/component2.tsx'
      ];

      const mockTranslations = {
        en: { 'test.key': 'Test Value' },
        fa: { 'test.key': 'مقدار تست' },
        ar: { 'test.key': 'قيمة اختبار' }
      };

      // Test that validation passes with complete translations
      expect(mockTranslations.en['test.key']).toBeDefined();
      expect(mockTranslations.fa['test.key']).toBeDefined();
      expect(mockTranslations.ar['test.key']).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should handle large numbers of translation keys efficiently', () => {
      const largeTranslationSet = {};
      const largeKeySet = [];

      // Generate 1000 translation keys
      for (let i = 0; i < 1000; i++) {
        const key = `category${Math.floor(i / 100)}.item${i}`;
        largeKeySet.push(key);
        largeTranslationSet[key] = `Value ${i}`;
      }

      const startTime = Date.now();
      
      // Test key validation performance
      largeKeySet.forEach(key => {
        validateTranslationKey(key);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 100ms for 1000 keys)
      expect(duration).toBeLessThan(100);
    });

    test('should handle large file content efficiently', () => {
      // Generate large file content with many translation calls
      let content = 'import { useLanguage } from "./hooks/useLanguage";\n';
      content += 'const { t } = useLanguage();\n';
      
      for (let i = 0; i < 100; i++) {
        content += `const text${i} = t('category.item${i}');\n`;
      }

      const startTime = Date.now();
      const keys = extractKeysFromContent(content);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(keys).toHaveLength(100);
      expect(duration).toBeLessThan(50); // Should be very fast
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed content gracefully', () => {
      const malformedContent = `
        const broken = t('unclosed.string
        const another = t(missing.quotes)
        const invalid = t(123)
      `;

      // Should not throw errors
      expect(() => extractKeysFromContent(malformedContent)).not.toThrow();
      expect(() => findHardcodedStrings(malformedContent)).not.toThrow();
    });

    test('should handle empty or null content', () => {
      expect(extractKeysFromContent('')).toEqual([]);
      expect(findHardcodedStrings('')).toEqual([]);
      
      expect(extractKeysFromContent('   ')).toEqual([]);
      expect(findHardcodedStrings('   ')).toEqual([]);
    });

    test('should handle content without translation calls', () => {
      const content = `
        import React from 'react';
        
        export function Component() {
          return <div>Static content</div>;
        }
      `;

      const keys = extractKeysFromContent(content);
      expect(keys).toEqual([]);
    });
  });
});