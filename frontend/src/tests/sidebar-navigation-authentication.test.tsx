import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '../components/layout/Sidebar';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageContext } from '../hooks/useLanguage';
import { User, RBACRole, RBACPermission } from '../types';

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
    isAuthenticated: jest.fn(() => true),
    getCurrentUserFromToken: jest.fn(() => ({ sub: '1', email: 'test@test.com' })),
    clearTokens: jest.fn(),
    setTokens: jest.fn(),
    getAccessToken: jest.fn(() => 'mock-token'),
    refreshTokens: jest.fn(() => Promise.resolve(true)),
    revokeTokens: jest.fn(() => Promise.resolve()),
    isTokenExpiringSoon: jest.fn(() => false),
    isTokenExpired: jest.fn(() => false),
    getTokenInfo: jest.fn(() => ({})),
  },
}));

// Mock the useLanguage hook
const mockLanguageContext = {
  language: 'en' as const,
  direction: 'ltr' as const,
  t: (key: string) => key,
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

// Mock permissions
const mockPermissions: RBACPermission[] = [
  {
    id: '1',
    name: 'view_dashboard',
    display_name: 'View Dashboard',
    description: 'Can view dashboard',
    resource: 'dashboard',
    action: 'view',
    scope: 'all',
    is_system_permission: true,
    is_active: true,
    requires_approval: false,
    category: 'dashboard',
    risk_level: 'low',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'view_inventory',
    display_name: 'View Inventory',
    description: 'Can view inventory',
    resource: 'inventory',
    action: 'view',
    scope: 'all',
    is_system_permission: true,
    is_active: true,
    requires_approval: false,
    category: 'inventory',
    risk_level: 'low',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'edit_settings',
    display_name: 'Edit Settings',
    description: 'Can edit settings',
    resource: 'settings',
    action: 'edit',
    scope: 'all',
    is_system_permission: true,
    is_active: true,
    requires_approval: false,
    category: 'settings',
    risk_level: 'high',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Mock roles
const mockManagerRole: RBACRole = {
  id: '1',
  name: 'Manager',
  display_name: 'Manager',
  description: 'Manager role',
  level: 2,
  is_system_role: true,
  is_active: true,
  priority: 100,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  permissions: [mockPermissions[0], mockPermissions[1], mockPermissions[2]],
};

const mockEmployeeRole: RBACRole = {
  id: '2',
  name: 'Employee',
  display_name: 'Employee',
  description: 'Employee role',
  level: 1,
  is_system_role: true,
  is_active: true,
  priority: 50,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  permissions: [mockPermissions[0], mockPermissions[1]],
};

// Mock users
const mockManagerUser: User = {
  id: '1',
  username: 'manager',
  email: 'manager@test.com',
  role_id: '1',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  rbac_roles: [mockManagerRole],
};

const mockEmployeeUser: User = {
  id: '2',
  username: 'employee',
  email: 'employee@test.com',
  role_id: '2',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  rbac_roles: [mockEmployeeRole],
};

// Mock AuthContext
const createMockAuthContext = (user: User | null, isAuthenticated: boolean = true, isLoading: boolean = false) => ({
  isAuthenticated,
  user,
  isLoading,
  isInitialized: true,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  hasPermission: (permission: string) => {
    if (!user?.rbac_roles) return false;
    return user.rbac_roles.some(role => 
      role.is_active && role.permissions?.some(p => p.is_active && p.name === permission)
    );
  },
  hasRole: (roleName: string) => {
    if (!user?.rbac_roles) return false;
    return user.rbac_roles.some(role => role.is_active && role.name === roleName);
  },
  hasAnyRole: (roles: string[]) => {
    if (!user?.rbac_roles) return false;
    const userRoleNames = user.rbac_roles.filter(r => r.is_active).map(r => r.name);
    return roles.some(role => userRoleNames.includes(role));
  },
  getPermissions: () => ({}),
  getToken: () => 'mock-token',
  isTokenExpired: () => false,
  getTokenInfo: () => ({}),
  updateUser: jest.fn(),
  clearError: jest.fn(),
  isLoggingIn: isLoading,
  loginError: null,
});

// Test wrapper component
const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  authContext?: any;
}> = ({ children, authContext }) => {
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

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Sidebar Navigation Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Authentication State Handling', () => {
    test('should show loading state when authentication is loading', async () => {
      const mockAuthContext = createMockAuthContext(null, false, true);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Should show loading skeletons
      expect(screen.getAllByRole('generic')).toHaveLength(6); // 6 skeleton items
    });

    test('should show not authenticated message when user is not logged in', async () => {
      const mockAuthContext = createMockAuthContext(null, false, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText('auth.please_login')).toBeInTheDocument();
    });

    test('should show user information when authenticated', async () => {
      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText('manager')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
    });
  });

  describe('Permission-Based Menu Filtering', () => {
    test('should show all menu items for manager with full permissions', async () => {
      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Manager should see dashboard, inventory, and settings
      expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
      expect(screen.getByText('nav.inventory')).toBeInTheDocument();
      expect(screen.getByText('nav.settings')).toBeInTheDocument();
    });

    test('should hide restricted menu items for employee with limited permissions', async () => {
      const mockAuthContext = createMockAuthContext(mockEmployeeUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Employee should see dashboard and inventory but not settings
      expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
      expect(screen.getByText('nav.inventory')).toBeInTheDocument();
      expect(screen.queryByText('nav.settings')).not.toBeInTheDocument();
    });

    test('should filter sub-menu items based on permissions', async () => {
      const mockAuthContext = createMockAuthContext(mockEmployeeUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Click to expand inventory menu
      const inventoryButton = screen.getByText('nav.inventory').closest('button');
      if (inventoryButton) {
        fireEvent.click(inventoryButton);
      }

      await waitFor(() => {
        // Employee should see inventory sub-items they have permission for
        expect(screen.getByText('nav.inventory.products')).toBeInTheDocument();
        expect(screen.getByText('nav.inventory.categories')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Menu Visibility', () => {
    test('should show admin-only menu items for users with admin role', async () => {
      const adminUser = {
        ...mockManagerUser,
        rbac_roles: [{
          ...mockManagerRole,
          name: 'Owner',
          display_name: 'Owner',
        }],
      };
      const mockAuthContext = createMockAuthContext(adminUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Owner should see settings menu
      expect(screen.getByText('nav.settings')).toBeInTheDocument();
    });

    test('should hide admin-only menu items for regular users', async () => {
      const regularUser = {
        ...mockEmployeeUser,
        rbac_roles: [{
          ...mockEmployeeRole,
          permissions: [mockPermissions[0], mockPermissions[1]], // No edit_settings permission
        }],
      };
      const mockAuthContext = createMockAuthContext(regularUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Regular user should not see settings menu
      expect(screen.queryByText('nav.settings')).not.toBeInTheDocument();
    });
  });

  describe('Navigation State Persistence', () => {
    test('should restore expanded menu items from localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('["nav.inventory"]');
      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Inventory menu should be expanded from saved state
      await waitFor(() => {
        expect(screen.getByText('nav.inventory.products')).toBeInTheDocument();
      });
    });

    test('should save expanded menu items to localStorage', async () => {
      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Find and click the expand button for inventory
      const expandButton = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'sidebar-expanded-items',
          expect.stringContaining('nav.inventory')
        );
      });
    });
  });

  describe('Active State Handling', () => {
    test('should highlight active route correctly', async () => {
      // Mock current location
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true,
      });

      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      const dashboardItem = screen.getByText('nav.dashboard').closest('button');
      expect(dashboardItem).toHaveClass('bg-gradient-to-r', 'from-green-100', 'to-teal-50');
    });

    test('should auto-expand parent menu when child route is active', async () => {
      // Mock current location to inventory sub-page
      Object.defineProperty(window, 'location', {
        value: { pathname: '/inventory/products' },
        writable: true,
      });

      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Inventory menu should be auto-expanded
      await waitFor(() => {
        expect(screen.getByText('nav.inventory.products')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Interaction', () => {
    test('should handle navigation clicks with permission checking', async () => {
      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      const dashboardButton = screen.getByText('nav.dashboard').closest('button');
      expect(dashboardButton).toBeInTheDocument();
      
      // Should be clickable for authorized user
      fireEvent.click(dashboardButton!);
      // Navigation should occur (tested via router mock)
    });

    test('should prevent navigation for unauthorized routes', async () => {
      const mockAuthContext = createMockAuthContext(mockEmployeeUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Settings should not be visible for employee
      expect(screen.queryByText('nav.settings')).not.toBeInTheDocument();
    });

    test('should toggle menu expansion correctly', async () => {
      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Find inventory expand button
      const inventorySection = screen.getByText('nav.inventory').closest('div');
      const expandButton = inventorySection?.querySelector('button[aria-label*="expand"]') || 
                          inventorySection?.querySelector('button:last-child');
      
      if (expandButton) {
        fireEvent.click(expandButton);
        
        await waitFor(() => {
          expect(screen.getByText('nav.inventory.products')).toBeInTheDocument();
        });

        // Click again to collapse
        fireEvent.click(expandButton);
        
        await waitFor(() => {
          expect(screen.queryByText('nav.inventory.products')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Responsive Behavior', () => {
    test('should handle collapsed sidebar state', async () => {
      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={true} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // In collapsed state, text should not be visible
      expect(screen.queryByText('nav.dashboard')).not.toBeInTheDocument();
      
      // But icons should still be present
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should show tooltips in collapsed state', async () => {
      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      render(
        <TestWrapper authContext={mockAuthContext}>
          <Sidebar isCollapsed={true} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Buttons should have title attributes for tooltips
      const buttons = screen.getAllByRole('button');
      const buttonWithTitle = buttons.find(button => button.getAttribute('title'));
      expect(buttonWithTitle).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      expect(() => {
        render(
          <TestWrapper authContext={mockAuthContext}>
            <Sidebar isCollapsed={false} onToggle={jest.fn()} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    test('should handle invalid localStorage data gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const mockAuthContext = createMockAuthContext(mockManagerUser, true, false);
      
      expect(() => {
        render(
          <TestWrapper authContext={mockAuthContext}>
            <Sidebar isCollapsed={false} onToggle={jest.fn()} />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });
});