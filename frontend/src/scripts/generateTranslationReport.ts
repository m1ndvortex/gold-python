#!/usr/bin/env node

// Translation Coverage Report Generator

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { 
  TranslationAuditResult, 
  TranslationValidationResult,
  Language 
} from '../types/translation';
import { translationAuditor, extractKeysFromContent } from '../utils/translationAudit';

interface TranslationCoverageReport {
  timestamp: Date;
  summary: {
    totalFiles: number;
    totalKeys: number;
    languages: {
      [key in Language]: {
        translatedKeys: number;
        missingKeys: number;
        completionPercentage: number;
      };
    };
  };
  details: {
    fileAnalysis: FileAnalysisResult[];
    keyAnalysis: KeyAnalysisResult[];
    missingTranslations: MissingTranslationResult[];
    recommendations: RecommendationResult[];
  };
}

interface FileAnalysisResult {
  file: string;
  keysFound: number;
  hardcodedStrings: number;
  issues: string[];
}

interface KeyAnalysisResult {
  key: string;
  category: string;
  languages: {
    [key in Language]: {
      exists: boolean;
      value?: string;
    };
  };
  usageCount: number;
  files: string[];
}

interface MissingTranslationResult {
  key: string;
  language: Language;
  suggestedValue?: string;
  priority: 'high' | 'medium' | 'low';
}

interface RecommendationResult {
  type: 'add_translation' | 'remove_unused' | 'fix_hardcoded' | 'improve_key';
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  files?: string[];
}

class TranslationReportGenerator {
  private sourceDir = 'src';
  private excludePatterns = [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/coverage/**'
  ];

  public async generateReport(): Promise<TranslationCoverageReport> {
    console.log('🔍 Generating translation coverage report...');

    // Step 1: Scan all source files
    const files = this.getSourceFiles();
    console.log(`📁 Found ${files.length} source files`);

    // Step 2: Extract translation keys and analyze files
    const fileAnalysis = await this.analyzeFiles(files);
    const allKeys = this.extractAllKeys(fileAnalysis);
    console.log(`🔑 Found ${allKeys.length} unique translation keys`);

    // Step 3: Load existing translations
    const translations = await this.loadTranslations();

    // Step 4: Analyze key coverage
    const keyAnalysis = this.analyzeKeys(allKeys, translations, fileAnalysis);

    // Step 5: Find missing translations
    const missingTranslations = this.findMissingTranslations(keyAnalysis);

    // Step 6: Generate recommendations
    const recommendations = this.generateRecommendations(fileAnalysis, keyAnalysis, missingTranslations);

    // Step 7: Calculate summary statistics
    const summary = this.calculateSummary(files.length, allKeys.length, keyAnalysis);

    return {
      timestamp: new Date(),
      summary,
      details: {
        fileAnalysis,
        keyAnalysis,
        missingTranslations,
        recommendations
      }
    };
  }

  private getSourceFiles(): string[] {
    return glob.sync(`${this.sourceDir}/**/*.{ts,tsx,js,jsx}`, {
      ignore: this.excludePatterns
    });
  }

  private async analyzeFiles(files: string[]): Promise<FileAnalysisResult[]> {
    const results: FileAnalysisResult[] = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const extractionResult = translationAuditor.extractTranslationKeys(file, content);
        
        const issues: string[] = [];
        
        // Check for hardcoded strings
        if (extractionResult.hardcodedStrings.length > 0) {
          issues.push(`${extractionResult.hardcodedStrings.length} hardcoded strings found`);
        }

        // Check for invalid key formats
        const invalidKeys = extractionResult.keys.filter(k => 
          !/^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)*$/.test(k.key)
        );
        if (invalidKeys.length > 0) {
          issues.push(`${invalidKeys.length} invalid key formats`);
        }

        results.push({
          file,
          keysFound: extractionResult.keys.length,
          hardcodedStrings: extractionResult.hardcodedStrings.length,
          issues
        });
      } catch (error) {
        results.push({
          file,
          keysFound: 0,
          hardcodedStrings: 0,
          issues: [`Error reading file: ${error}`]
        });
      }
    }

    return results;
  }

  private extractAllKeys(fileAnalysis: FileAnalysisResult[]): string[] {
    const allKeys = new Set<string>();
    
    // Re-extract keys from files (simplified approach)
    for (const analysis of fileAnalysis) {
      try {
        const content = fs.readFileSync(analysis.file, 'utf-8');
        const keys = extractKeysFromContent(content);
        keys.forEach(key => allKeys.add(key));
      } catch (error) {
        console.warn(`Failed to re-extract keys from ${analysis.file}:`, error);
      }
    }

    return Array.from(allKeys);
  }

  private async loadTranslations(): Promise<Record<Language, Record<string, string>>> {
    // This is a simplified version - in a real implementation, 
    // you'd parse the actual translation files
    try {
      // For now, return empty translations
      // In a real implementation, you'd load from the useLanguage.ts file
      // or separate translation files
      return {
        en: {},
        fa: {},
        ar: {}
      };
    } catch (error) {
      console.warn('Failed to load translations:', error);
      return { en: {}, fa: {}, ar: {} };
    }
  }

  private analyzeKeys(
    keys: string[], 
    translations: Record<Language, Record<string, string>>,
    fileAnalysis: FileAnalysisResult[]
  ): KeyAnalysisResult[] {
    return keys.map(key => {
      // Find files that use this key
      const files = fileAnalysis
        .filter(analysis => {
          try {
            const content = fs.readFileSync(analysis.file, 'utf-8');
            return content.includes(`'${key}'`) || content.includes(`"${key}"`);
          } catch {
            return false;
          }
        })
        .map(analysis => analysis.file);

      // Determine category
      const category = key.split('.')[0] || 'unknown';

      // Check language coverage
      const languages = {
        en: {
          exists: key in translations.en,
          value: translations.en[key]
        },
        fa: {
          exists: key in translations.fa,
          value: translations.fa[key]
        },
        ar: {
          exists: key in translations.ar,
          value: translations.ar[key]
        }
      };

      return {
        key,
        category,
        languages,
        usageCount: files.length,
        files
      };
    });
  }

  private findMissingTranslations(keyAnalysis: KeyAnalysisResult[]): MissingTranslationResult[] {
    const missing: MissingTranslationResult[] = [];

    for (const analysis of keyAnalysis) {
      for (const language of ['en', 'fa', 'ar'] as Language[]) {
        if (!analysis.languages[language].exists) {
          // Determine priority based on usage and category
          let priority: 'high' | 'medium' | 'low' = 'medium';
          
          if (analysis.usageCount > 5 || analysis.category === 'common') {
            priority = 'high';
          } else if (analysis.usageCount === 0) {
            priority = 'low';
          }

          missing.push({
            key: analysis.key,
            language,
            priority
          });
        }
      }
    }

    return missing;
  }

  private generateRecommendations(
    fileAnalysis: FileAnalysisResult[],
    keyAnalysis: KeyAnalysisResult[],
    missingTranslations: MissingTranslationResult[]
  ): RecommendationResult[] {
    const recommendations: RecommendationResult[] = [];

    // High priority missing translations
    const highPriorityMissing = missingTranslations.filter(m => m.priority === 'high');
    if (highPriorityMissing.length > 0) {
      recommendations.push({
        type: 'add_translation',
        description: `Add ${highPriorityMissing.length} high-priority missing translations`,
        action: 'Add translations for frequently used keys',
        priority: 'high'
      });
    }

    // Files with many hardcoded strings
    const filesWithHardcodedStrings = fileAnalysis.filter(f => f.hardcodedStrings > 3);
    if (filesWithHardcodedStrings.length > 0) {
      recommendations.push({
        type: 'fix_hardcoded',
        description: `${filesWithHardcodedStrings.length} files have excessive hardcoded strings`,
        action: 'Replace hardcoded strings with translation keys',
        priority: 'medium',
        files: filesWithHardcodedStrings.map(f => f.file)
      });
    }

    // Unused keys
    const unusedKeys = keyAnalysis.filter(k => k.usageCount === 0);
    if (unusedKeys.length > 0) {
      recommendations.push({
        type: 'remove_unused',
        description: `${unusedKeys.length} translation keys are not used`,
        action: 'Remove unused translation keys to reduce bundle size',
        priority: 'low'
      });
    }

    // Invalid key formats
    const invalidKeys = keyAnalysis.filter(k => 
      !/^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)*$/.test(k.key)
    );
    if (invalidKeys.length > 0) {
      recommendations.push({
        type: 'improve_key',
        description: `${invalidKeys.length} keys have invalid format`,
        action: 'Rename keys to follow naming convention: category.subcategory.item',
        priority: 'medium'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private calculateSummary(
    totalFiles: number, 
    totalKeys: number, 
    keyAnalysis: KeyAnalysisResult[]
  ) {
    const languages = {
      en: {
        translatedKeys: keyAnalysis.filter(k => k.languages.en.exists).length,
        missingKeys: keyAnalysis.filter(k => !k.languages.en.exists).length,
        completionPercentage: 0
      },
      fa: {
        translatedKeys: keyAnalysis.filter(k => k.languages.fa.exists).length,
        missingKeys: keyAnalysis.filter(k => !k.languages.fa.exists).length,
        completionPercentage: 0
      },
      ar: {
        translatedKeys: keyAnalysis.filter(k => k.languages.ar.exists).length,
        missingKeys: keyAnalysis.filter(k => !k.languages.ar.exists).length,
        completionPercentage: 0
      }
    };

    // Calculate completion percentages
    for (const lang of ['en', 'fa', 'ar'] as Language[]) {
      if (totalKeys > 0) {
        languages[lang].completionPercentage = Math.round(
          (languages[lang].translatedKeys / totalKeys) * 100
        );
      }
    }

    return {
      totalFiles,
      totalKeys,
      languages
    };
  }

  public async saveReport(report: TranslationCoverageReport, outputPath: string): Promise<void> {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save JSON report
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved to ${outputPath}`);

      // Generate human-readable summary
      const summaryPath = outputPath.replace('.json', '-summary.txt');
      const summary = this.generateHumanReadableSummary(report);
      fs.writeFileSync(summaryPath, summary);
      console.log(`📄 Summary saved to ${summaryPath}`);
    } catch (error) {
      console.error(`Failed to save report: ${error}`);
    }
  }

  private generateHumanReadableSummary(report: TranslationCoverageReport): string {
    const { summary, details } = report;
    
    let output = '';
    output += '# Translation Coverage Report\n\n';
    output += `Generated: ${report.timestamp.toISOString()}\n\n`;
    
    output += '## Summary\n\n';
    output += `- **Total Files Scanned:** ${summary.totalFiles}\n`;
    output += `- **Total Translation Keys:** ${summary.totalKeys}\n\n`;
    
    output += '### Language Coverage\n\n';
    for (const [lang, stats] of Object.entries(summary.languages)) {
      output += `**${lang.toUpperCase()}:**\n`;
      output += `- Translated: ${stats.translatedKeys}/${summary.totalKeys} (${stats.completionPercentage}%)\n`;
      output += `- Missing: ${stats.missingKeys}\n\n`;
    }
    
    output += '## Issues Found\n\n';
    
    const filesWithIssues = details.fileAnalysis.filter(f => f.issues.length > 0);
    if (filesWithIssues.length > 0) {
      output += `### Files with Issues (${filesWithIssues.length})\n\n`;
      for (const file of filesWithIssues.slice(0, 10)) { // Show top 10
        output += `- **${file.file}:** ${file.issues.join(', ')}\n`;
      }
      if (filesWithIssues.length > 10) {
        output += `- ... and ${filesWithIssues.length - 10} more files\n`;
      }
      output += '\n';
    }
    
    output += '## Recommendations\n\n';
    for (const rec of details.recommendations.slice(0, 5)) { // Show top 5
      output += `### ${rec.priority.toUpperCase()}: ${rec.description}\n`;
      output += `**Action:** ${rec.action}\n\n`;
    }
    
    output += '## Missing Translations by Priority\n\n';
    const highPriority = details.missingTranslations.filter(m => m.priority === 'high');
    const mediumPriority = details.missingTranslations.filter(m => m.priority === 'medium');
    const lowPriority = details.missingTranslations.filter(m => m.priority === 'low');
    
    output += `- **High Priority:** ${highPriority.length}\n`;
    output += `- **Medium Priority:** ${mediumPriority.length}\n`;
    output += `- **Low Priority:** ${lowPriority.length}\n\n`;
    
    if (highPriority.length > 0) {
      output += '### High Priority Missing Translations\n\n';
      for (const missing of highPriority.slice(0, 20)) { // Show top 20
        output += `- ${missing.key} (${missing.language})\n`;
      }
      if (highPriority.length > 20) {
        output += `- ... and ${highPriority.length - 20} more\n`;
      }
    }
    
    return output;
  }
}

// CLI interface
async function main() {
  const generator = new TranslationReportGenerator();
  
  try {
    const report = await generator.generateReport();
    
    // Save report
    const outputPath = 'build/translation-coverage-report.json';
    await generator.saveReport(report, outputPath);
    
    // Print summary to console
    console.log('\n📊 Translation Coverage Summary:');
    console.log(`   Files scanned: ${report.summary.totalFiles}`);
    console.log(`   Translation keys: ${report.summary.totalKeys}`);
    console.log(`   English: ${report.summary.languages.en.completionPercentage}% complete`);
    console.log(`   Persian: ${report.summary.languages.fa.completionPercentage}% complete`);
    console.log(`   Arabic: ${report.summary.languages.ar.completionPercentage}% complete`);
    console.log(`   Recommendations: ${report.details.recommendations.length}`);
    
    // Print top recommendations
    if (report.details.recommendations.length > 0) {
      console.log('\n🎯 Top Recommendations:');
      report.details.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
      });
    }
    
    console.log('\n✅ Translation coverage report generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Report generation failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { TranslationReportGenerator };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}