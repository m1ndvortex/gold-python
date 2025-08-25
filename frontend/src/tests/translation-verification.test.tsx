import React from 'react';
import { render, screen } from '@testing-library/react';
import { LanguageContext, useLanguageProvider } from '../hooks/useLanguage';

// Test Language Provider Component
const TestLanguageProvider: React.FC<{ children: React.ReactNode; initialLanguage?: 'en' | 'fa' }> = ({ 
  children, 
  initialLanguage = 'en' 
}) => {
  const languageValue = useLanguageProvider();
  
  // Set initial language
  React.useEffect(() => {
    if (initialLanguage !== languageValue.language) {
      languageValue.setLanguage(initialLanguage);
    }
  }, [initialLanguage, languageValue]);

  return (
    <LanguageContext.Provider value={languageValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Simple component to test translations
const TranslationTestComponent: React.FC = () => {
  const languageValue = React.useContext(LanguageContext);
  if (!languageValue) return null;
  
  const { t } = languageValue;
  
  return (
    <div>
      <div data-testid="gold-shop-management">{t('common.gold_shop_management')}</div>
      <div data-testid="professional-edition">{t('common.professional_edition')}</div>
      <div data-testid="version">{t('common.version')}</div>
      <div data-testid="dashboard-title">{t('nav.dashboard')}</div>
      <div data-testid="welcome-message">{t('dashboard.welcome_message')}</div>
    </div>
  );
};

describe('Translation Verification', () => {
  it('should display English translations correctly', () => {
    render(
      <TestLanguageProvider initialLanguage="en">
        <TranslationTestComponent />
      </TestLanguageProvider>
    );

    // Check that the previously missing translations are now working
    expect(screen.getByTestId('gold-shop-management')).toHaveTextContent('Gold Shop Management');
    expect(screen.getByTestId('professional-edition')).toHaveTextContent('Professional Edition');
    expect(screen.getByTestId('version')).toHaveTextContent('Version');
    expect(screen.getByTestId('dashboard-title')).toHaveTextContent('Dashboard');
    expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome back! Here\'s your business overview');
  });

  it('should display Persian translations correctly', () => {
    render(
      <TestLanguageProvider initialLanguage="fa">
        <TranslationTestComponent />
      </TestLanguageProvider>
    );

    // Check that Persian translations are working
    expect(screen.getByTestId('gold-shop-management')).toHaveTextContent('مدیریت طلافروشی');
    expect(screen.getByTestId('professional-edition')).toHaveTextContent('نسخه حرفه‌ای');
    expect(screen.getByTestId('version')).toHaveTextContent('نسخه');
    expect(screen.getByTestId('dashboard-title')).toHaveTextContent('داشبورد');
    expect(screen.getByTestId('welcome-message')).toHaveTextContent('خوش آمدید! در اینجا نمای کلی کسب و کار شما است');
  });

  it('should not show MISSING translation keys', () => {
    render(
      <TestLanguageProvider initialLanguage="en">
        <TranslationTestComponent />
      </TestLanguageProvider>
    );

    // Ensure no MISSING keys are displayed
    const container = screen.getByTestId('gold-shop-management').closest('div');
    expect(container?.textContent).not.toContain('[MISSING:');
    expect(container?.textContent).not.toContain('MISSING:');
  });
});