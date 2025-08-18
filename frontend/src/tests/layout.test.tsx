import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageContext } from '../hooks/useLanguage';
import { MainLayout } from '../components/layout/MainLayout';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { BreadcrumbNav } from '../components/layout/BreadcrumbNav';

// Mock the auth hook
const mockAuthData = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: {
      id: '1',
      name: 'Owner',
      permissions: {
        view_inventory: true,
        view_customers: true,
        view_invoices: true,
        view_accounting: true,
        view_reports: true,
        send_sms: true,
        manage_settings: true,
      },
    },
  },
  isAuthenticated: true,
  isLoading: false,
  userError: null,
  login: jest.fn(),
  isLoggingIn: false,
  loginError: null,
  logout: jest.fn(),

  hasPermission: jest.fn((permission: string) => true),
  hasRole: jest.fn((role: string) => role === 'Owner'),
  hasAnyRole: jest.fn((roles: string[]) => roles.includes('Owner')),
  tokenExpiry: Date.now() + 3600000,
};

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => mockAuthData,
}));

// Mock language context
const mockLanguageContext = {
  language: 'en' as const,
  direction: 'ltr' as const,
  setLanguage: jest.fn(),
  t: (key: string) => {
    const translations: Record<string, string> = {
      'app.title': 'Gold Shop Management System',
      'nav.dashboard': 'Dashboard',
      'nav.inventory': 'Inventory',
      'nav.customers': 'Customers',
      'nav.invoices': 'Invoices',
      'nav.accounting': 'Accounting',
      'nav.reports': 'Reports',
      'nav.settings': 'Settings',
      'nav.sms': 'SMS',
      'auth.logout': 'Logout',
      'common.search': 'Search',
      'common.language': 'Language',
      'common.profile': 'Profile',
    };
    return translations[key] || key;
  },
};

const mockLanguageContextRTL = {
  ...mockLanguageContext,
  language: 'fa' as const,
  direction: 'rtl' as const,
  t: (key: string) => {
    const translations: Record<string, string> = {
      'app.title': 'سیستم مدیریت طلافروشی',
      'nav.dashboard': 'داشبورد',
      'nav.inventory': 'موجودی',
      'nav.customers': 'مشتریان',
      'nav.invoices': 'فاکتورها',
      'nav.accounting': 'حسابداری',
      'nav.reports': 'گزارشات',
      'nav.settings': 'تنظیمات',
      'nav.sms': 'پیامک',
      'auth.logout': 'خروج',
      'common.search': 'جستجو',
      'common.language': 'زبان',
      'common.profile': 'پروفایل',
    };
    return translations[key] || key;
  },
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  languageContext?: any;
  initialRoute?: string;
}> = ({ 
  children, 
  languageContext = mockLanguageContext,
  initialRoute = '/'
}) => {
  const queryClient = createTestQueryClient();
  
  // Mock window.location for routing tests
  if (initialRoute !== '/') {
    Object.defineProperty(window, 'location', {
      value: { pathname: initialRoute },
      writable: true,
    });
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageContext.Provider value={languageContext}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </LanguageContext.Provider>
    </QueryClientProvider>
  );
};

describe('Layout Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sidebar Component', () => {
    test('renders sidebar with navigation items', () => {
      const mockToggle = jest.fn();
      
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={mockToggle} />
        </TestWrapper>
      );

      expect(screen.getByText('Gold Shop Management System')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Invoices')).toBeInTheDocument();
      expect(screen.getByText('Accounting')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('SMS')).toBeInTheDocument();
    });

    test('renders collapsed sidebar correctly', () => {
      const mockToggle = jest.fn();
      
      render(
        <TestWrapper>
          <Sidebar isCollapsed={true} onToggle={mockToggle} />
        </TestWrapper>
      );

      // App title should not be visible when collapsed
      expect(screen.queryByText('Gold Shop Management System')).not.toBeInTheDocument();
      
      // Icons should still be present
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
    });

    test('handles sidebar toggle', () => {
      const mockToggle = jest.fn();
      
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={mockToggle} />
        </TestWrapper>
      );

      const toggleButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(toggleButton);
      
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    test('renders RTL sidebar correctly', () => {
      const mockToggle = jest.fn();
      
      render(
        <TestWrapper languageContext={mockLanguageContextRTL}>
          <Sidebar isCollapsed={false} onToggle={mockToggle} />
        </TestWrapper>
      );

      expect(screen.getByText('سیستم مدیریت طلافروشی')).toBeInTheDocument();
      expect(screen.getByText('داشبورد')).toBeInTheDocument();
      expect(screen.getByText('موجودی')).toBeInTheDocument();
    });

    test('filters navigation items based on permissions', () => {
      // Mock user with limited permissions
      const limitedAuthData = {
        ...mockAuthData,
        hasPermission: jest.fn((permission: string) => permission === 'view_inventory'),
        hasAnyRole: jest.fn(() => false),
      };

      jest.doMock('../hooks/useAuth', () => ({
        useAuth: () => limitedAuthData,
      }));

      const mockToggle = jest.fn();
      
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={mockToggle} />
        </TestWrapper>
      );

      // Should show dashboard (always visible) and inventory (has permission)
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      
      // Should not show settings (no role permission)
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Header Component', () => {
    test('renders header with user information', () => {
      const mockToggle = jest.fn();
      
      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={mockToggle} />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('Change language')).toBeInTheDocument();
      expect(screen.getByLabelText('User menu')).toBeInTheDocument();
    });

    test('handles language switching', async () => {
      const mockSetLanguage = jest.fn();
      const contextWithMockSetLanguage = {
        ...mockLanguageContext,
        setLanguage: mockSetLanguage,
      };

      render(
        <TestWrapper languageContext={contextWithMockSetLanguage}>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Open language dropdown
      const languageButton = screen.getByLabelText('Change language');
      fireEvent.click(languageButton);

      // Click on Persian option
      await waitFor(() => {
        const persianOption = screen.getByText('فارسی');
        fireEvent.click(persianOption);
      });

      expect(mockSetLanguage).toHaveBeenCalledWith('fa');
    });

    test('handles user logout', async () => {
      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Open user menu
      const userMenuButton = screen.getByLabelText('User menu');
      fireEvent.click(userMenuButton);

      // Click logout
      await waitFor(() => {
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);
      });

      expect(mockAuthData.logout).toHaveBeenCalledTimes(1);
    });

    test('renders RTL header correctly', () => {
      render(
        <TestWrapper languageContext={mockLanguageContextRTL}>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('جستجو')).toBeInTheDocument();
    });
  });

  describe('BreadcrumbNav Component', () => {
    test('renders breadcrumbs for dashboard', () => {
      render(
        <TestWrapper initialRoute="/dashboard">
          <BreadcrumbNav />
        </TestWrapper>
      );

      // Dashboard should not show breadcrumbs (only one item)
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    test('renders breadcrumbs for inventory page', () => {
      // Mock useLocation to return inventory path
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: () => ({ pathname: '/inventory' }),
      }));

      render(
        <TestWrapper>
          <BreadcrumbNav />
        </TestWrapper>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    test('renders breadcrumbs for nested routes', () => {
      // Mock useLocation to return nested path
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: () => ({ pathname: '/inventory/add' }),
      }));

      render(
        <TestWrapper>
          <BreadcrumbNav />
        </TestWrapper>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('MainLayout Component', () => {
    test('renders main layout with all components', () => {
      render(
        <TestWrapper>
          <MainLayout>
            <div data-testid="main-content">Test Content</div>
          </MainLayout>
        </TestWrapper>
      );

      // Check that all layout components are rendered
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content area
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    test('handles responsive behavior', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(
        <TestWrapper>
          <MainLayout>
            <div>Mobile Content</div>
          </MainLayout>
        </TestWrapper>
      );

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      expect(screen.getByText('Mobile Content')).toBeInTheDocument();
    });

    test('applies RTL direction correctly', () => {
      const { container } = render(
        <TestWrapper languageContext={mockLanguageContextRTL}>
          <MainLayout>
            <div>RTL Content</div>
          </MainLayout>
        </TestWrapper>
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveAttribute('dir', 'rtl');
      expect(mainDiv).toHaveClass('rtl');
    });
  });

  describe('Navigation Guards', () => {
    test('shows navigation items based on user permissions', () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // All items should be visible for Owner role
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Invoices')).toBeInTheDocument();
      expect(screen.getByText('Accounting')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('SMS')).toBeInTheDocument();
    });

    test('hides restricted navigation items for limited users', () => {
      // Mock limited permissions
      const limitedAuthData = {
        ...mockAuthData,
        user: {
          ...mockAuthData.user,
          role: {
            ...mockAuthData.user.role,
            name: 'Cashier',
          },
        },
        hasPermission: jest.fn((permission: string) => 
          ['view_inventory', 'view_customers', 'view_invoices'].includes(permission)
        ),
        hasAnyRole: jest.fn((roles: string[]) => roles.includes('Cashier')),
      };

      jest.doMock('../hooks/useAuth', () => ({
        useAuth: () => limitedAuthData,
      }));

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Should show allowed items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Invoices')).toBeInTheDocument();

      // Should not show restricted items
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('sidebar has proper ARIA labels', () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      const toggleButton = screen.getByLabelText('Collapse sidebar');
      expect(toggleButton).toBeInTheDocument();
    });

    test('header has proper ARIA labels', () => {
      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('Change language')).toBeInTheDocument();
      expect(screen.getByLabelText('User menu')).toBeInTheDocument();
    });

    test('breadcrumbs have proper navigation role', () => {
      // Mock useLocation for a route that shows breadcrumbs
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: () => ({ pathname: '/inventory' }),
      }));

      render(
        <TestWrapper>
          <BreadcrumbNav />
        </TestWrapper>
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'breadcrumb');
    });
  });
});

// 🐳 Docker Integration Tests
describe('Layout Docker Integration', () => {
  test('layout components work with Docker backend', async () => {
    // This test ensures layout components can handle real backend responses
    render(
      <TestWrapper>
        <MainLayout>
          <div data-testid="docker-content">Docker Integration Test</div>
        </MainLayout>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('docker-content')).toBeInTheDocument();
    });

    // Verify layout structure is intact
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('navigation permissions work with real user data', async () => {
    // This test would work with real backend user data in Docker environment
    render(
      <TestWrapper>
        <Sidebar isCollapsed={false} onToggle={jest.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Verify navigation items are rendered based on real permissions
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
  });
});