import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MobileSidebar } from '../MobileSidebar';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../hooks/useLanguage';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the hooks
jest.mock('../../../hooks/useAuth');
jest.mock('../../../hooks/useLanguage');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;

const defaultAuthMock = {
  isAuthenticated: true,
  user: { 
    id: '1', 
    username: 'test', 
    email: 'test@example.com',
    role_id: '1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    role: { 
      id: '1', 
      name: 'Owner', 
      permissions: {}, 
      created_at: '2024-01-01T00:00:00Z' 
    } 
  },
  hasPermission: jest.fn(() => true),
  hasAnyRole: jest.fn(() => true),
  hasRole: jest.fn(() => true),
  getPermissions: jest.fn(() => ({})),
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
  isLoggingIn: false,
  loginError: null,
  error: null,
  isTokenExpired: jest.fn(() => false),
};

const defaultLanguageMock = {
  language: 'en' as const,
  direction: 'ltr' as const,
  t: jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'app.title': 'Gold Shop Management',
      'nav.dashboard': 'Dashboard',
      'nav.inventory': 'Inventory',
      'nav.customers': 'Customers',
      'nav.invoices': 'Invoices',
      'nav.accounting': 'Accounting',
      'nav.reports': 'Reports',
      'nav.sms': 'SMS',
      'nav.settings': 'Settings',
    };
    return translations[key] || key;
  }),
  setLanguage: jest.fn(),
  isRTL: false,
  isLTR: true,
  getLayoutClasses: jest.fn(() => 'ltr'),
  getTextAlignClass: jest.fn(() => 'text-left'),
  getFlexDirectionClass: jest.fn(() => 'flex-row'),
  getMarginClass: jest.fn((margin: string) => margin),
  getPaddingClass: jest.fn((padding: string) => padding),
  getBorderClass: jest.fn((border: string) => border),
  formatNumber: jest.fn((num: number) => num.toString()),
  formatDate: jest.fn((date: Date) => date.toLocaleDateString()),
  formatCurrency: jest.fn((amount: number) => `$${amount}`),
};

const renderMobileSidebar = (props = {}) => {
  return render(
    <BrowserRouter>
      <MobileSidebar {...props} />
    </BrowserRouter>
  );
};

describe('MobileSidebar Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(defaultAuthMock);
    mockUseLanguage.mockReturnValue(defaultLanguageMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the mobile menu trigger button', () => {
      renderMobileSidebar();
      
      const menuButton = screen.getByLabelText('Open navigation menu');
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveClass('md:hidden');
    });

    it('applies mobile-only visibility classes', () => {
      const { container } = renderMobileSidebar();
      
      const mobileContainer = container.firstChild;
      expect(mobileContainer).toHaveClass('md:hidden');
    });
  });

  describe('Menu Interaction', () => {
    it('opens the drawer when menu button is clicked', async () => {
      renderMobileSidebar();
      
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);
      
      // Wait for the drawer to open and check for mobile menu content
      await waitFor(() => {
        expect(screen.getByText('Gold Shop')).toBeInTheDocument();
        expect(screen.getByText('Mobile Menu')).toBeInTheDocument();
      });
    });

    it('shows close button in the drawer header', async () => {
      renderMobileSidebar();
      
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close navigation menu');
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('closes the drawer when close button is clicked', async () => {
      renderMobileSidebar();
      
      // Open the drawer
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mobile Menu')).toBeInTheDocument();
      });
      
      // Close the drawer
      const closeButton = screen.getByLabelText('Close navigation menu');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Mobile Menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Drawer Content', () => {
    it('displays company branding in the drawer header', async () => {
      renderMobileSidebar();
      
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByText('Gold Shop')).toBeInTheDocument();
        expect(screen.getByText('Mobile Menu')).toBeInTheDocument();
      });
    });

    it('includes the full sidebar component in the drawer', async () => {
      renderMobileSidebar();
      
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        // Check that navigation items from the main sidebar are present
        expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
        expect(screen.getByText('nav.inventory')).toBeInTheDocument();
      });
    });
  });

  describe('Styling and Animation', () => {
    it('applies proper styling classes to the menu button', () => {
      renderMobileSidebar();
      
      const menuButton = screen.getByLabelText('Open navigation menu');
      expect(menuButton).toHaveClass(
        'hover:bg-primary/10',
        'hover:text-primary-600',
        'transition-all',
        'duration-200'
      );
    });

    it('applies gradient background to the drawer content', async () => {
      renderMobileSidebar();
      
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        const drawerContent = screen.getByText('Mobile Menu').closest('[role="dialog"]');
        expect(drawerContent).toHaveClass('bg-gradient-to-b');
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for interactive elements', () => {
      renderMobileSidebar();
      
      const menuButton = screen.getByLabelText('Open navigation menu');
      expect(menuButton).toHaveAttribute('aria-label', 'Open navigation menu');
    });

    it('maintains focus management when opening and closing', async () => {
      renderMobileSidebar();
      
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close navigation menu');
        expect(closeButton).toHaveAttribute('aria-label', 'Close navigation menu');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('only shows on mobile screens', () => {
      const { container } = renderMobileSidebar();
      
      expect(container.firstChild).toHaveClass('md:hidden');
    });

    it('applies proper width to the drawer', async () => {
      renderMobileSidebar();
      
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        const drawerContent = screen.getByText('Mobile Menu').closest('[role="dialog"]');
        expect(drawerContent).toHaveClass('w-80');
      });
    });
  });

  describe('Integration with Main Sidebar', () => {
    it('passes correct props to the embedded sidebar', async () => {
      renderMobileSidebar();
      
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        // Verify that the sidebar is rendered in non-collapsed mode
        expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
        // The sidebar should show full text, not be collapsed
        expect(screen.getByText('Professional Edition v2.0')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Styling', () => {
    it('accepts and applies custom className', () => {
      const { container } = renderMobileSidebar({ className: 'custom-mobile-sidebar' });
      
      expect(container.firstChild).toHaveClass('custom-mobile-sidebar');
    });
  });
});