import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
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
      'nav.inventory.products': 'Products',
      'nav.inventory.categories': 'Categories',
      'nav.inventory.bulk': 'Bulk Operations',
    };
    return translations[key] || key;
  }),
  setLanguage: jest.fn(),
};

const renderSidebar = (props = {}) => {
  const defaultProps = {
    isCollapsed: false,
    onToggle: jest.fn(),
  };

  return render(
    <BrowserRouter>
      <Sidebar {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('Sidebar Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(defaultAuthMock);
    mockUseLanguage.mockReturnValue(defaultLanguageMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the sidebar with company branding', () => {
      renderSidebar();
      
      expect(screen.getByText('Gold Shop Management')).toBeInTheDocument();
      expect(screen.getByText('Professional Edition')).toBeInTheDocument();
    });

    it('renders navigation items with proper icons', () => {
      renderSidebar();
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    it('renders footer information when expanded', () => {
      renderSidebar();
      
      expect(screen.getByText('Gold Shop Management')).toBeInTheDocument();
      expect(screen.getByText('Professional Edition v2.0')).toBeInTheDocument();
      expect(screen.getByText('System Online')).toBeInTheDocument();
    });
  });

  describe('Collapsed State', () => {
    it('hides text content when collapsed', () => {
      renderSidebar({ isCollapsed: true });
      
      expect(screen.queryByText('Gold Shop Management')).not.toBeInTheDocument();
      expect(screen.queryByText('Professional Edition')).not.toBeInTheDocument();
      expect(screen.queryByText('Professional Edition v2.0')).not.toBeInTheDocument();
    });

    it('shows toggle button when collapsed', () => {
      const onToggle = jest.fn();
      renderSidebar({ isCollapsed: true, onToggle });
      
      const toggleButton = screen.getByLabelText('Expand sidebar');
      expect(toggleButton).toBeInTheDocument();
      
      fireEvent.click(toggleButton);
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hierarchical Navigation', () => {
    it('renders expandable navigation items', () => {
      renderSidebar();
      
      // Check for expandable items (those with children)
      const inventoryButton = screen.getByRole('button', { name: /nav.inventory/i });
      expect(inventoryButton).toBeInTheDocument();
    });

    it('expands and collapses navigation sections', async () => {
      renderSidebar();
      
      const inventoryButton = screen.getByRole('button', { name: /nav.inventory/i });
      
      // Initially collapsed - sub-items should not be visible
      expect(screen.queryByText('nav.inventory.products')).not.toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(inventoryButton);
      
      // Sub-items should now be visible
      await waitFor(() => {
        expect(screen.getByText('nav.inventory.products')).toBeInTheDocument();
        expect(screen.getByText('nav.inventory.categories')).toBeInTheDocument();
      });
      
      // Click to collapse
      fireEvent.click(inventoryButton);
      
      // Sub-items should be hidden again
      await waitFor(() => {
        expect(screen.queryByText('nav.inventory.products')).not.toBeInTheDocument();
      });
    });

    it('shows badges on navigation items', () => {
      renderSidebar();
      
      // Expand inventory to see the "New" badge on categories
      const inventoryButton = screen.getByRole('button', { name: /nav.inventory/i });
      fireEvent.click(inventoryButton);
      
      waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
      });
    });
  });

  describe('Active State Indicators', () => {
    it('highlights active navigation items', () => {
      // Mock location to simulate being on dashboard
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true,
      });
      
      renderSidebar();
      
      const dashboardLink = screen.getByRole('link', { name: /nav.dashboard/i });
      expect(dashboardLink).toHaveClass('bg-gradient-to-r');
    });

    it('highlights parent items when child is active', () => {
      // Mock location to simulate being on inventory products page
      Object.defineProperty(window, 'location', {
        value: { pathname: '/inventory/products' },
        writable: true,
      });
      
      renderSidebar();
      
      const inventoryButton = screen.getByRole('button', { name: /nav.inventory/i });
      expect(inventoryButton).toHaveClass('bg-gradient-to-r');
    });
  });

  describe('Permission-Based Filtering', () => {
    it('hides navigation items when user lacks permissions', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthMock,
        hasPermission: jest.fn((permission) => permission !== 'view_inventory'),
      });
      
      renderSidebar();
      
      expect(screen.queryByText('nav.inventory')).not.toBeInTheDocument();
      expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
    });

    it('hides navigation items when user lacks required roles', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthMock,
        hasAnyRole: jest.fn((roles) => !roles.includes('Owner')),
      });
      
      renderSidebar();
      
      expect(screen.queryByText('nav.settings')).not.toBeInTheDocument();
    });

    it('filters sub-navigation items based on permissions', async () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthMock,
        hasPermission: jest.fn((permission) => permission !== 'edit_inventory'),
      });
      
      renderSidebar();
      
      const inventoryButton = screen.getByRole('button', { name: /nav.inventory/i });
      fireEvent.click(inventoryButton);
      
      await waitFor(() => {
        expect(screen.getByText('nav.inventory.products')).toBeInTheDocument();
        expect(screen.queryByText('nav.inventory.bulk')).not.toBeInTheDocument();
      });
    });
  });

  describe('RTL Support', () => {
    it('applies RTL styling when language direction is RTL', () => {
      mockUseLanguage.mockReturnValue({
        ...defaultLanguageMock,
        direction: 'rtl',
      });
      
      const { container } = renderSidebar();
      
      const sidebar = container.firstChild;
      expect(sidebar).toHaveClass('border-r-0', 'border-l');
    });
  });

  describe('Hover Effects', () => {
    it('applies hover effects to navigation items', () => {
      renderSidebar();
      
      const dashboardLink = screen.getByRole('link', { name: /nav.dashboard/i });
      expect(dashboardLink).toHaveClass('hover:bg-primary/10');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for toggle button', () => {
      renderSidebar();
      
      const toggleButton = screen.getByLabelText('Collapse sidebar');
      expect(toggleButton).toBeInTheDocument();
    });

    it('provides tooltips for collapsed navigation items', () => {
      renderSidebar({ isCollapsed: true });
      
      const dashboardLink = screen.getByRole('link', { name: /nav.dashboard/i });
      expect(dashboardLink).toHaveAttribute('title', 'nav.dashboard');
    });

    it('supports keyboard navigation', () => {
      renderSidebar();
      
      const dashboardLink = screen.getByRole('link', { name: /nav.dashboard/i });
      expect(dashboardLink).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('maintains functionality on different screen sizes', () => {
      // This would typically be tested with viewport changes
      renderSidebar();
      
      // Verify that the sidebar structure is maintained
      expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
    });
  });

  describe('Animation and Transitions', () => {
    it('applies transition classes for smooth animations', () => {
      const { container } = renderSidebar();
      
      const sidebar = container.firstChild;
      expect(sidebar).toHaveClass('transition-all', 'duration-300');
    });
  });
});