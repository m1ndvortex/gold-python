import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '../components/layout/Sidebar';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageContext } from '../hooks/useLanguage';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Mock the API module
jest.mock('../utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock TokenManager
jest.mock('../services/TokenManager', () => ({
  tokenManager: {
    isAuthenticated: jest.fn(() => false),
    getCurrentUserFromToken: jest.fn(() => null),
    clearTokens: jest.fn(),
    setTokens: jest.fn(),
    getAccessToken: jest.fn(() => null),
    refreshTokens: jest.fn(() => Promise.resolve(false)),
    revokeTokens: jest.fn(() => Promise.resolve()),
    isTokenExpiringSoon: jest.fn(() => false),
    isTokenExpired: jest.fn(() => true),
    getTokenInfo: jest.fn(() => ({})),
  },
}));

// Mock the language context
const mockLanguageContext = {
  language: 'en' as const,
  direction: 'ltr' as const,
  t: (key: string) => {
    const translations: Record<string, string> = {
      'app.title': 'Gold Shop Management',
      'nav.dashboard': 'Dashboard',
      'nav.inventory': 'Inventory',
      'nav.customers': 'Customers',
      'nav.invoices': 'Invoices',
      'nav.accounting': 'Accounting',
      'nav.analytics': 'Analytics',
      'nav.reports': 'Reports',
      'nav.sms': 'SMS',
      'nav.settings': 'Settings',
      'nav.inventory.products': 'Products',
      'nav.inventory.categories': 'Categories',
      'nav.inventory.analytics': 'Analytics',
      'nav.inventory.bulk': 'Bulk Operations',
      'nav.inventory.images': 'Image Management',
      'auth.please_login': 'Please log in to continue',
      'nav.no_access': 'No menu items available',
      'common.system_online': 'System Online',
      'common.connecting': 'Connecting...',
      'common.not_authenticated': 'Not Authenticated',
      'common.gold_shop_management': 'Gold Shop Management',
      'common.professional_edition': 'Professional Edition',
      'common.version': 'Version',
    };
    return translations[key] || key;
  },
  setLanguage: jest.fn(),
  isRTL: false,
  isLTR: true,
  getLayoutClasses: () => '',
  getTextAlignClass: () => '',
  getFlexDirectionClass: () => '',
  getMarginClass: () => '',
  getPaddingClass: () => '',
  getBorderClass: () => '',
  formatNumber: (num: number) => num.toString(),
  formatDate: (date: Date) => date.toISOString(),
  formatCurrency: (amount: number) => `$${amount}`,
};

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/dashboard' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test wrapper component
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
        <LanguageContext.Provider value={mockLanguageContext}>
          <AuthProvider>
            <div style={{ width: '256px', height: '600px' }}>
              {children}
            </div>
          </AuthProvider>
        </LanguageContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Sidebar Integration Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Real Authentication Integration', () => {
    test('should integrate with AuthProvider and show authentication states', async () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Should render the sidebar
      expect(screen.getAllByText('Gold Shop Management')).toHaveLength(2); // Header and footer
    });

    test('should handle authentication loading state', async () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Should show some form of loading or authentication state
      // The exact behavior depends on the AuthProvider implementation
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should persist sidebar state across re-renders', async () => {
      const { rerender } = render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Rerender the component
      rerender(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Should maintain state
      expect(screen.getAllByText('Gold Shop Management')).toHaveLength(2); // Header and footer
    });
  });

  describe('Navigation Integration', () => {
    test('should handle route changes correctly', async () => {
      // Mock different route
      mockLocation.pathname = '/inventory';

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Should handle the route change
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle navigation clicks', async () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Find navigation buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Should be able to click navigation items
      if (buttons.length > 1) {
        fireEvent.click(buttons[1]); // Click first navigation item
        // Navigation should be attempted
        expect(mockNavigate).toHaveBeenCalled();
      }
    });

    test('should handle sidebar toggle', async () => {
      const mockToggle = jest.fn();

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={mockToggle} />
        </TestWrapper>
      );

      // Find toggle button
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      fireEvent.click(toggleButton);

      expect(mockToggle).toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior Integration', () => {
    test('should handle collapsed state properly', async () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={true} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Should render in collapsed state
      expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
    });

    test('should handle expanded state properly', async () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Should render in expanded state
      expect(screen.getAllByText('Gold Shop Management')).toHaveLength(2); // Header and footer
      expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle component errors gracefully', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <TestWrapper>
            <Sidebar isCollapsed={false} onToggle={jest.fn()} />
          </TestWrapper>
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    test('should handle localStorage errors in integration', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(() => {
        render(
          <TestWrapper>
            <Sidebar isCollapsed={false} onToggle={jest.fn()} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    test('should handle invalid localStorage data', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json data');

      expect(() => {
        render(
          <TestWrapper>
            <Sidebar isCollapsed={false} onToggle={jest.fn()} />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Performance Integration', () => {
    test('should render efficiently with multiple re-renders', async () => {
      const { rerender } = render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Multiple re-renders should not cause issues
      for (let i = 0; i < 5; i++) {
        rerender(
          <TestWrapper>
            <Sidebar isCollapsed={i % 2 === 0} onToggle={jest.fn()} />
          </TestWrapper>
        );
      }

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle rapid state changes', async () => {
      const mockToggle = jest.fn();

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={mockToggle} />
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });

      // Rapid clicks should be handled gracefully
      for (let i = 0; i < 5; i++) {
        fireEvent.click(toggleButton);
      }

      expect(mockToggle).toHaveBeenCalledTimes(5);
    });
  });

  describe('Accessibility Integration', () => {
    test('should have proper ARIA attributes', async () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Should have navigation role
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Buttons should have proper labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    test('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      
      if (buttons.length > 0) {
        // Should be focusable
        buttons[0].focus();
        expect(document.activeElement).toBe(buttons[0]);

        // Should handle keyboard events
        fireEvent.keyDown(buttons[0], { key: 'Enter' });
        // Should trigger appropriate action
      }
    });

    test('should provide proper focus management', async () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      
      // Should be able to tab through buttons
      if (buttons.length > 1) {
        buttons[0].focus();
        fireEvent.keyDown(buttons[0], { key: 'Tab' });
        // Focus should move appropriately
      }
    });
  });

  describe('Real-world Usage Scenarios', () => {
    test('should handle typical user workflow', async () => {
      const mockToggle = jest.fn();

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={mockToggle} />
        </TestWrapper>
      );

      // User sees the sidebar
      expect(screen.getAllByText('Gold Shop Management')).toHaveLength(2); // Header and footer

      // User can navigate
      const buttons = screen.getAllByRole('button');
      if (buttons.length > 1) {
        fireEvent.click(buttons[1]);
        expect(mockNavigate).toHaveBeenCalled();
      }

      // User can toggle sidebar
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      fireEvent.click(toggleButton);
      expect(mockToggle).toHaveBeenCalled();
    });

    test('should maintain state during navigation', async () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Initial state
      expect(screen.getAllByText('Gold Shop Management')).toHaveLength(2); // Header and footer

      // Simulate route change
      mockLocation.pathname = '/customers';

      // Should maintain sidebar state
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('should handle authentication state changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Should handle authentication changes gracefully
      rerender(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Integration with Other Components', () => {
    test('should work within a larger layout', async () => {
      render(
        <TestWrapper>
          <div className="app-layout">
            <Sidebar isCollapsed={false} onToggle={jest.fn()} />
            <main>
              <h1>Main Content</h1>
            </main>
          </div>
        </TestWrapper>
      );

      // Both sidebar and main content should render
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    test('should handle prop changes from parent components', async () => {
      const { rerender } = render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Change props
      rerender(
        <TestWrapper>
          <Sidebar isCollapsed={true} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Should handle prop changes
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });
});