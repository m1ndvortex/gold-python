import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings } from '../pages/Settings';
import { useLanguage } from '../hooks/useLanguage';

// Mock the hooks
jest.mock('../hooks/useLanguage');
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    hasPermission: () => true,
    user: { id: '1', username: 'testuser' }
  })
}));

// Mock all the settings components
jest.mock('../components/settings/CompanySettingsForm', () => ({
  CompanySettingsForm: () => <div data-testid="company-settings">Company Settings Form</div>
}));

jest.mock('../components/settings/GoldPriceConfig', () => ({
  GoldPriceConfig: () => <div data-testid="gold-price-config">Gold Price Config</div>
}));

jest.mock('../components/settings/InvoiceTemplateDesigner', () => ({
  InvoiceTemplateDesigner: () => <div data-testid="invoice-template">Invoice Template</div>
}));

jest.mock('../components/settings/RolePermissionManager', () => ({
  RolePermissionManager: () => <div data-testid="role-manager">Role Manager</div>
}));

jest.mock('../components/settings/UserManagement', () => ({
  UserManagementComponent: () => <div data-testid="user-management">User Management</div>
}));

jest.mock('../components/settings/DisasterRecoveryDashboard', () => ({
  DisasterRecoveryDashboard: () => <div data-testid="disaster-recovery">Disaster Recovery</div>
}));

const mockUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Settings Page Translation', () => {
  beforeEach(() => {
    mockUseLanguage.mockReturnValue({
      language: 'en',
      direction: 'ltr',
      setLanguage: jest.fn(),
      t: (key: string) => {
        const translations: Record<string, string> = {
          'settings.title': 'System Settings',
          'settings.description': 'Configure your gold shop management system settings and preferences',
          'settings.all_systems_online': 'All Systems Online',
          'settings.refresh_status': 'Refresh Status',
          'settings.save_all_changes': 'Save All Changes',
          'settings.tab_company': 'Company',
          'settings.tab_gold_price': 'Gold Price',
          'settings.tab_templates': 'Templates',
          'settings.tab_roles': 'Roles',
          'settings.tab_users': 'Users',
          'settings.tab_disaster_recovery': 'Disaster Recovery',
          'settings.system_overview': 'System Overview',
          'settings.check_status': 'Check Status',
          'settings.database': 'Database',
          'settings.api_services': 'API Services',
          'settings.security': 'Security',
          'settings.backup': 'Backup',
          'settings.online': 'Online',
          'settings.connection_stable': 'Connection: Stable',
          'settings.all_services': 'All Services',
          'settings.response_time': 'Response: 45ms',
          'settings.protected': 'Protected',
          'settings.ssl_enabled': 'SSL: Enabled',
          'settings.current': 'Current',
          'settings.hours_ago': '2 Hours Ago',
          'settings.next_scheduled': 'Next: Scheduled',
          'settings.system_information': 'System Information',
          'settings.system_information_desc': 'Current system configuration and status details',
          'settings.application': 'Application',
          'settings.version': 'Version:',
          'settings.environment': 'Environment',
          'settings.production': 'Production',
          'settings.resources': 'Resources',
          'settings.cpu_usage': 'CPU Usage:',
          'settings.memory': 'Memory:',
          'settings.activity': 'Activity',
          'settings.active_users': 'Active Users:',
          'settings.last_activity': 'Last Activity:',
          'settings.just_now': 'Just now',
          'common.active': 'Active',
          'common.secure': 'Secure'
        };
        return translations[key] || key;
      },
      isRTL: false,
      isLTR: true,
      getLayoutClasses: () => 'ltr-layout',
      getTextAlignClass: () => 'text-left',
      getFlexDirectionClass: () => 'flex-row',
      getMarginClass: (margin: string) => margin,
      getPaddingClass: (padding: string) => padding,
      getBorderClass: (border: string) => border,
      formatNumber: (num: number) => num.toString(),
      formatDate: (date: Date) => date.toLocaleDateString(),
      formatCurrency: (amount: number) => `$${amount.toFixed(2)}`
    });
  });

  it('should display English Settings page translations correctly', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    // Check main page elements
    expect(screen.getByText('System Settings')).toBeInTheDocument();
    expect(screen.getByText('Configure your gold shop management system settings and preferences')).toBeInTheDocument();
    expect(screen.getByText('All Systems Online')).toBeInTheDocument();
    expect(screen.getByText('Refresh Status')).toBeInTheDocument();
    expect(screen.getByText('Save All Changes')).toBeInTheDocument();

    // Check tab labels
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Gold Price')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Disaster Recovery')).toBeInTheDocument();

    // Check system overview section
    expect(screen.getByText('System Overview')).toBeInTheDocument();
    expect(screen.getByText('Check Status')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('API Services')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Backup')).toBeInTheDocument();
  });

  it('should display Persian Settings page translations correctly', () => {
    mockUseLanguage.mockReturnValue({
      language: 'fa',
      direction: 'rtl',
      setLanguage: jest.fn(),
      t: (key: string) => {
        const translations: Record<string, string> = {
          'settings.title': 'تنظیمات سیستم',
          'settings.description': 'پیکربندی تنظیمات سیستم مدیریت طلافروشی و ترجیحات شما',
          'settings.all_systems_online': 'همه سیستم‌ها آنلاین',
          'settings.refresh_status': 'تازه‌سازی وضعیت',
          'settings.save_all_changes': 'ذخیره همه تغییرات',
          'settings.tab_company': 'شرکت',
          'settings.tab_gold_price': 'قیمت طلا',
          'settings.tab_templates': 'قالب‌ها',
          'settings.tab_roles': 'نقش‌ها',
          'settings.tab_users': 'کاربران',
          'settings.tab_disaster_recovery': 'بازیابی فاجعه',
          'settings.system_overview': 'نمای کلی سیستم',
          'settings.check_status': 'بررسی وضعیت',
          'settings.database': 'پایگاه داده',
          'settings.api_services': 'سرویس‌های API',
          'settings.security': 'امنیت',
          'settings.backup': 'پشتیبان‌گیری',
          'settings.online': 'آنلاین',
          'settings.connection_stable': 'اتصال: پایدار',
          'settings.all_services': 'همه سرویس‌ها',
          'settings.response_time': 'پاسخ: ۴۵ میلی‌ثانیه',
          'settings.protected': 'محافظت شده',
          'settings.ssl_enabled': 'SSL: فعال',
          'settings.current': 'فعلی',
          'settings.hours_ago': '۲ ساعت پیش',
          'settings.next_scheduled': 'بعدی: برنامه‌ریزی شده',
          'settings.system_information': 'اطلاعات سیستم',
          'settings.system_information_desc': 'جزئیات پیکربندی و وضعیت فعلی سیستم',
          'settings.application': 'برنامه',
          'settings.version': 'نسخه:',
          'settings.environment': 'محیط',
          'settings.production': 'تولید',
          'settings.resources': 'منابع',
          'settings.cpu_usage': 'استفاده CPU:',
          'settings.memory': 'حافظه:',
          'settings.activity': 'فعالیت',
          'settings.active_users': 'کاربران فعال:',
          'settings.last_activity': 'آخرین فعالیت:',
          'settings.just_now': 'همین الان',
          'common.active': 'فعال',
          'common.secure': 'امن'
        };
        return translations[key] || key;
      },
      isRTL: true,
      isLTR: false,
      getLayoutClasses: () => 'rtl-layout',
      getTextAlignClass: () => 'text-right',
      getFlexDirectionClass: () => 'flex-row-reverse',
      getMarginClass: (margin: string) => margin,
      getPaddingClass: (padding: string) => padding,
      getBorderClass: (border: string) => border,
      formatNumber: (num: number) => num.toString(),
      formatDate: (date: Date) => date.toLocaleDateString(),
      formatCurrency: (amount: number) => `$${amount.toFixed(2)}`
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    // Check main page elements in Persian
    expect(screen.getByText('تنظیمات سیستم')).toBeInTheDocument();
    expect(screen.getByText('پیکربندی تنظیمات سیستم مدیریت طلافروشی و ترجیحات شما')).toBeInTheDocument();
    expect(screen.getByText('همه سیستم‌ها آنلاین')).toBeInTheDocument();
    expect(screen.getByText('تازه‌سازی وضعیت')).toBeInTheDocument();
    expect(screen.getByText('ذخیره همه تغییرات')).toBeInTheDocument();

    // Check tab labels in Persian
    expect(screen.getByText('شرکت')).toBeInTheDocument();
    expect(screen.getByText('قیمت طلا')).toBeInTheDocument();
    expect(screen.getByText('قالب‌ها')).toBeInTheDocument();
    expect(screen.getByText('نقش‌ها')).toBeInTheDocument();
    expect(screen.getByText('کاربران')).toBeInTheDocument();
    expect(screen.getByText('بازیابی فاجعه')).toBeInTheDocument();

    // Check system overview section in Persian
    expect(screen.getByText('نمای کلی سیستم')).toBeInTheDocument();
    expect(screen.getByText('بررسی وضعیت')).toBeInTheDocument();
    expect(screen.getByText('پایگاه داده')).toBeInTheDocument();
    expect(screen.getByText('سرویس‌های API')).toBeInTheDocument();
    expect(screen.getByText('امنیت')).toBeInTheDocument();
    expect(screen.getByText('پشتیبان‌گیری')).toBeInTheDocument();
  });

  it('should not contain any hardcoded English strings when Persian is selected', () => {
    mockUseLanguage.mockReturnValue({
      language: 'fa',
      direction: 'rtl',
      setLanguage: jest.fn(),
      t: (key: string) => {
        const translations: Record<string, string> = {
          'settings.title': 'تنظیمات سیستم',
          'settings.description': 'پیکربندی تنظیمات سیستم مدیریت طلافروشی و ترجیحات شما',
          'settings.all_systems_online': 'همه سیستم‌ها آنلاین',
          'settings.refresh_status': 'تازه‌سازی وضعیت',
          'settings.save_all_changes': 'ذخیره همه تغییرات',
          'settings.tab_company': 'شرکت',
          'settings.tab_gold_price': 'قیمت طلا',
          'settings.tab_templates': 'قالب‌ها',
          'settings.tab_roles': 'نقش‌ها',
          'settings.tab_users': 'کاربران',
          'settings.tab_disaster_recovery': 'بازیابی فاجعه',
          'settings.system_overview': 'نمای کلی سیستم',
          'settings.check_status': 'بررسی وضعیت',
          'settings.database': 'پایگاه داده',
          'settings.api_services': 'سرویس‌های API',
          'settings.security': 'امنیت',
          'settings.backup': 'پشتیبان‌گیری',
          'settings.online': 'آنلاین',
          'settings.connection_stable': 'اتصال: پایدار',
          'settings.all_services': 'همه سرویس‌ها',
          'settings.response_time': 'پاسخ: ۴۵ میلی‌ثانیه',
          'settings.protected': 'محافظت شده',
          'settings.ssl_enabled': 'SSL: فعال',
          'settings.current': 'فعلی',
          'settings.hours_ago': '۲ ساعت پیش',
          'settings.next_scheduled': 'بعدی: برنامه‌ریزی شده',
          'settings.system_information': 'اطلاعات سیستم',
          'settings.system_information_desc': 'جزئیات پیکربندی و وضعیت فعلی سیستم',
          'settings.application': 'برنامه',
          'settings.version': 'نسخه:',
          'settings.environment': 'محیط',
          'settings.production': 'تولید',
          'settings.resources': 'منابع',
          'settings.cpu_usage': 'استفاده CPU:',
          'settings.memory': 'حافظه:',
          'settings.activity': 'فعالیت',
          'settings.active_users': 'کاربران فعال:',
          'settings.last_activity': 'آخرین فعالیت:',
          'settings.just_now': 'همین الان',
          'common.active': 'فعال',
          'common.secure': 'امن'
        };
        return translations[key] || key;
      },
      isRTL: true,
      isLTR: false,
      getLayoutClasses: () => 'rtl-layout',
      getTextAlignClass: () => 'text-right',
      getFlexDirectionClass: () => 'flex-row-reverse',
      getMarginClass: (margin: string) => margin,
      getPaddingClass: (padding: string) => padding,
      getBorderClass: (border: string) => border,
      formatNumber: (num: number) => num.toString(),
      formatDate: (date: Date) => date.toLocaleDateString(),
      formatCurrency: (amount: number) => `$${amount.toFixed(2)}`
    });

    const { container } = render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    // Check that no hardcoded English strings are present
    const hardcodedStrings = [
      'System Settings',
      'System Overview',
      'Database',
      'API Services', 
      'Security',
      'Backup',
      'All Systems Online',
      'Check Status',
      'Company',
      'Gold Price',
      'Templates',
      'Roles',
      'Users',
      'Disaster Recovery'
    ];

    hardcodedStrings.forEach(str => {
      expect(screen.queryByText(str)).not.toBeInTheDocument();
    });

    // Verify Persian content is present
    expect(screen.getByText('تنظیمات سیستم')).toBeInTheDocument();
    expect(screen.getByText('نمای کلی سیستم')).toBeInTheDocument();
  });
});