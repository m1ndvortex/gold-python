import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { WithPermissions, AdminOnly, ManagerOrHigher } from '../components/auth/WithPermissions';
import { usePermissions } from '../hooks/usePermissions';

// Mock the API and token manager
jest.mock('../utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../services/TokenManager', () => ({
  tokenManager: {
    isAuthenticated: jest.fn(() => true),
    getCurrentUserFromToken: jest.fn(() => ({ sub: 'test-user-id' })),
    getAccessToken: jest.fn(() => 'mock-token'),
    isTokenExpired: jest.fn(() => false),
    isTokenExpiringSoon: jest.fn(() => false),
    clearTokens: jest.fn(),
    setTokens: jest.fn(),
    refreshTokens: jest.fn(() => Promise.resolve(true)),
    revokeTokens: jest.fn(() => Promise.resolve()),
    getTokenInfo: jest.fn(() => ({})),
  },
}));

// Mock user data with RBAC roles
const mockUserWithAdminRole = {
  id: 'test-user-id',
  username: 'admin',
  email: 'admin@test.com',
  role_id: 'admin-role-id',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  rbac_roles: [
    {
      id: 'admin-role-id',
      name: 'admin',
      display_name: 'Administrator',
      description: 'Administrative access',
      level: 1,
      is_system_role: true,
      is_active: true,
      priority: 900,
      permissions: [
        {
          id: 'perm-1',
          name: 'dashboard:view',
          display_name: 'View Dashboard',
          resource: 'dashboard',
          action: 'view',
          is_active: true,
        },
        {
          id: 'perm-2',
          name: 'inventory:create',
          display_name: 'Create Inventory',
          resource: 'inventory',
          action: 'create',
          is_active: true,
        },
        {
          id: 'perm-3',
          name: 'settings:update',
          display_name: 'Update Settings',
          resource: 'settings',
          action: 'update',
          is_active: true,
        },
      ],
    },
  ],
};

const mockUserWithViewerRole = {
  id: 'test-user-id-2',
  username: 'viewer',
  email: 'viewer@test.com',
  role_id: 'viewer-role-id',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  rbac_roles: [
    {
      id: 'viewer-role-id',
      name: 'viewer',
      display_name: 'Viewer',
      description: 'Read-only access',
      level: 5,
      is_system_role: true,
      is_active: true,
      priority: 100,
      permissions: [
        {
          id: 'perm-1',
          name: 'dashboard:view',
          display_name: 'View Dashboard',
          resource: 'dashboard',
          action: 'view',
          is_active: true,
        },
      ],
    },
  ],
};

// Test component that uses permissions
const TestComponent: React.FC = () => {
  const { hasPermission, hasRole, canCreate, isAdmin } = usePermissions();

  return (
    <div>
      <div data-testid="dashboard-permission">
        {hasPermission('dashboard:view') ? 'Can view dashboard' : 'Cannot view dashboard'}
      </div>
      <div data-testid="inventory-permission">
        {hasPermission('inventory:create') ? 'Can create inventory' : 'Cannot create inventory'}
      </div>
      <div data-testid="admin-role">
        {hasRole('admin') ? 'Is admin' : 'Not admin'}
      </div>
      <div data-testid="can-create-inventory">
        {canCreate('inventory') ? 'Can create inventory items' : 'Cannot create inventory items'}
      </div>
      <div data-testid="is-admin-check">
        {isAdmin() ? 'Has admin privileges' : 'No admin privileges'}
      </div>
    </div>
  );
};

// Mock the AuthContext directly
jest.mock('../contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../contexts/AuthContext');
  return {
    ...originalModule,
    useAuthContext: jest.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock AuthProvider with test user
const MockAuthProvider: React.FC<{ user: any; children: React.ReactNode }> = ({ user, children }) => {
  const mockContextValue = {
    isAuthenticated: true,
    user,
    isLoading: false,
    isInitialized: true,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    hasPermission: (permission: string) => {
      if (!user?.rbac_roles) return false;
      return user.rbac_roles.some((role: any) =>
        role.is_active && role.permissions?.some((perm: any) => perm.name === permission && perm.is_active)
      );
    },
    hasRole: (roleName: string) => {
      if (!user?.rbac_roles) return false;
      return user.rbac_roles.some((role: any) => role.name === roleName && role.is_active);
    },
    hasAnyRole: (roles: string[]) => {
      if (!user?.rbac_roles) return false;
      const userRoles = user.rbac_roles.map((role: any) => role.name);
      return roles.some(role => userRoles.includes(role));
    },
    getPermissions: () => {
      const permissions: Record<string, boolean> = {};
      if (user?.rbac_roles) {
        user.rbac_roles.forEach((role: any) => {
          if (role.is_active) {
            role.permissions?.forEach((perm: any) => {
              if (perm.is_active) {
                permissions[perm.name] = true;
              }
            });
          }
        });
      }
      return permissions;
    },
    getToken: jest.fn(),
    isTokenExpired: jest.fn(),
    getTokenInfo: jest.fn(),
    updateUser: jest.fn(),
    clearError: jest.fn(),
    isLoggingIn: false,
    loginError: null,
  };

  // Mock the useAuthContext hook to return our mock values
  const { useAuthContext } = require('../contexts/AuthContext');
  useAuthContext.mockReturnValue(mockContextValue);

  return (
    <div data-testid="mock-auth-provider">
      {children}
    </div>
  );
};

describe('RBAC System Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Permission Hooks', () => {
    it('should correctly identify admin permissions', async () => {
      render(
        <MockAuthProvider user={mockUserWithAdminRole}>
          <TestComponent />
        </MockAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-permission')).toHaveTextContent('Can view dashboard');
        expect(screen.getByTestId('inventory-permission')).toHaveTextContent('Can create inventory');
        expect(screen.getByTestId('admin-role')).toHaveTextContent('Is admin');
        expect(screen.getByTestId('can-create-inventory')).toHaveTextContent('Can create inventory items');
        expect(screen.getByTestId('is-admin-check')).toHaveTextContent('Has admin privileges');
      });
    });

    it('should correctly identify viewer limitations', async () => {
      render(
        <MockAuthProvider user={mockUserWithViewerRole}>
          <TestComponent />
        </MockAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-permission')).toHaveTextContent('Can view dashboard');
        expect(screen.getByTestId('inventory-permission')).toHaveTextContent('Cannot create inventory');
        expect(screen.getByTestId('admin-role')).toHaveTextContent('Not admin');
        expect(screen.getByTestId('can-create-inventory')).toHaveTextContent('Cannot create inventory items');
        expect(screen.getByTestId('is-admin-check')).toHaveTextContent('No admin privileges');
      });
    });
  });

  describe('WithPermissions Component', () => {
    it('should render content when user has required permission', () => {
      render(
        <MockAuthProvider user={mockUserWithAdminRole}>
          <AuthProvider>
            <WithPermissions permissions={['dashboard:view']}>
              <div data-testid="protected-content">Protected Dashboard Content</div>
            </WithPermissions>
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render content when user lacks required permission', () => {
      render(
        <MockAuthProvider user={mockUserWithViewerRole}>
          <AuthProvider>
            <WithPermissions permissions={['settings:update']}>
              <div data-testid="protected-content">Protected Settings Content</div>
            </WithPermissions>
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks permission', () => {
      render(
        <MockAuthProvider user={mockUserWithViewerRole}>
          <AuthProvider>
            <WithPermissions 
              permissions={['settings:update']}
              fallback={<div data-testid="fallback-content">Access Denied</div>}
            >
              <div data-testid="protected-content">Protected Settings Content</div>
            </WithPermissions>
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback-content')).toHaveTextContent('Access Denied');
    });

    it('should work with role-based access', () => {
      render(
        <MockAuthProvider user={mockUserWithAdminRole}>
          <AuthProvider>
            <WithPermissions roles={['admin']}>
              <div data-testid="admin-content">Admin Only Content</div>
            </WithPermissions>
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });

    it('should work with anyRole access', () => {
      render(
        <MockAuthProvider user={mockUserWithAdminRole}>
          <AuthProvider>
            <WithPermissions anyRole={['admin', 'manager']}>
              <div data-testid="management-content">Management Content</div>
            </WithPermissions>
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.getByTestId('management-content')).toBeInTheDocument();
    });

    it('should work with resource-based permissions', () => {
      render(
        <MockAuthProvider user={mockUserWithAdminRole}>
          <AuthProvider>
            <WithPermissions resource="inventory" actions={['create']}>
              <div data-testid="inventory-create">Create Inventory Item</div>
            </WithPermissions>
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.getByTestId('inventory-create')).toBeInTheDocument();
    });
  });

  describe('Convenience Components', () => {
    it('AdminOnly should work for admin users', () => {
      render(
        <MockAuthProvider user={mockUserWithAdminRole}>
          <AuthProvider>
            <AdminOnly>
              <div data-testid="admin-only-content">Admin Only</div>
            </AdminOnly>
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.getByTestId('admin-only-content')).toBeInTheDocument();
    });

    it('AdminOnly should not work for viewer users', () => {
      render(
        <MockAuthProvider user={mockUserWithViewerRole}>
          <AuthProvider>
            <AdminOnly>
              <div data-testid="admin-only-content">Admin Only</div>
            </AdminOnly>
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.queryByTestId('admin-only-content')).not.toBeInTheDocument();
    });

    it('ManagerOrHigher should work for admin users', () => {
      render(
        <MockAuthProvider user={mockUserWithAdminRole}>
          <AuthProvider>
            <ManagerOrHigher>
              <div data-testid="manager-content">Manager Content</div>
            </ManagerOrHigher>
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.getByTestId('manager-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle users with no RBAC roles', () => {
      const userWithoutRoles = {
        ...mockUserWithViewerRole,
        rbac_roles: [],
      };

      render(
        <MockAuthProvider user={userWithoutRoles}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.getByTestId('dashboard-permission')).toHaveTextContent('Cannot view dashboard');
      expect(screen.getByTestId('admin-role')).toHaveTextContent('Not admin');
    });

    it('should handle users with inactive roles', () => {
      const userWithInactiveRole = {
        ...mockUserWithAdminRole,
        rbac_roles: [
          {
            ...mockUserWithAdminRole.rbac_roles[0],
            is_active: false,
          },
        ],
      };

      render(
        <MockAuthProvider user={userWithInactiveRole}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.getByTestId('dashboard-permission')).toHaveTextContent('Cannot view dashboard');
      expect(screen.getByTestId('admin-role')).toHaveTextContent('Not admin');
    });

    it('should handle users with inactive permissions', () => {
      const userWithInactivePermissions = {
        ...mockUserWithAdminRole,
        rbac_roles: [
          {
            ...mockUserWithAdminRole.rbac_roles[0],
            permissions: mockUserWithAdminRole.rbac_roles[0].permissions.map(perm => ({
              ...perm,
              is_active: false,
            })),
          },
        ],
      };

      render(
        <MockAuthProvider user={userWithInactivePermissions}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockAuthProvider>
      );

      expect(screen.getByTestId('dashboard-permission')).toHaveTextContent('Cannot view dashboard');
      expect(screen.getByTestId('inventory-permission')).toHaveTextContent('Cannot create inventory');
    });
  });
});

describe('RBAC Integration Test', () => {
  it('should provide comprehensive permission checking capabilities', () => {
    const TestIntegrationComponent: React.FC = () => {
      const permissions = usePermissions();

      return (
        <div>
          <div data-testid="permission-count">
            Permissions: {Object.keys(permissions.getPermissions()).length}
          </div>
          <div data-testid="roles-list">
            Roles: {permissions.getRoles().join(', ')}
          </div>
          <div data-testid="dashboard-access">
            {permissions.canViewDashboard() ? 'Dashboard Access' : 'No Dashboard Access'}
          </div>
          <div data-testid="inventory-management">
            {permissions.canManageInventory() ? 'Inventory Management' : 'No Inventory Management'}
          </div>
          <div data-testid="financial-access">
            {permissions.canViewAccounting() ? 'Financial Access' : 'No Financial Access'}
          </div>
        </div>
      );
    };

    render(
      <MockAuthProvider user={mockUserWithAdminRole}>
        <AuthProvider>
          <TestIntegrationComponent />
        </AuthProvider>
      </MockAuthProvider>
    );

    expect(screen.getByTestId('permission-count')).toHaveTextContent('Permissions: 3');
    expect(screen.getByTestId('roles-list')).toHaveTextContent('Roles: admin');
    expect(screen.getByTestId('dashboard-access')).toHaveTextContent('Dashboard Access');
    expect(screen.getByTestId('inventory-management')).toHaveTextContent('Inventory Management');
  });
});