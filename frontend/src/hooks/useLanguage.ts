import { useState, useEffect, createContext, useContext } from 'react';
import { Language, Direction, LanguageContextType } from '../types';

// Simple translation object - in a real app, this would come from translation files
const translations = {
  en: {
    'app.title': 'Gold Shop Management System',
    'nav.dashboard': 'Dashboard',
    'nav.inventory': 'Inventory',
    'nav.customers': 'Customers',
    'nav.invoices': 'Invoices',
    'nav.accounting': 'Accounting',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
  },
  fa: {
    'app.title': 'سیستم مدیریت طلافروشی',
    'nav.dashboard': 'داشبورد',
    'nav.inventory': 'موجودی',
    'nav.customers': 'مشتریان',
    'nav.invoices': 'فاکتورها',
    'nav.accounting': 'حسابداری',
    'nav.reports': 'گزارشات',
    'nav.settings': 'تنظیمات',
    'auth.login': 'ورود',
    'auth.logout': 'خروج',
    'common.save': 'ذخیره',
    'common.cancel': 'لغو',
    'common.delete': 'حذف',
    'common.edit': 'ویرایش',
    'common.add': 'افزودن',
  },
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useLanguageProvider = () => {
  const [language, setLanguageState] = useState<Language>('fa'); // Default to Persian
  const [direction, setDirection] = useState<Direction>('rtl');

  useEffect(() => {
    // Load language from localStorage or browser preference
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'fa'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
      setDirection(savedLanguage === 'fa' ? 'rtl' : 'ltr');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setDirection(lang === 'fa' ? 'rtl' : 'ltr');
    localStorage.setItem('language', lang);
    
    // Update document direction
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang === 'fa' ? 'fa' : 'en';
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return {
    language,
    direction,
    setLanguage,
    t,
  };
};