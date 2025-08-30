import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'fa';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple translation function for testing
const translations: Record<Language, Record<string, string>> = {
  en: {
    'search.placeholder': 'Search...',
    'search.filters': 'Filters',
    'search.results': 'Results',
    'search.no_results': 'No results found',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
  },
  fa: {
    'search.placeholder': 'جستجو...',
    'search.filters': 'فیلترها',
    'search.results': 'نتایج',
    'search.no_results': 'نتیجه‌ای یافت نشد',
    'common.loading': 'در حال بارگذاری...',
    'common.error': 'خطا',
    'common.retry': 'تلاش مجدد',
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};