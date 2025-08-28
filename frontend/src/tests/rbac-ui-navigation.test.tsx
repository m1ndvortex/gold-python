import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Settings } from '../pages/Settings';
import { AuthProvider } from '../contexts/AuthContext';

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

// Mock the API
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

// Mock the language hook
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    direction: 'ltr',
  }),
}));

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    hasPermission: (permission: string) => {
      // Mock admin permissions
      return ['view_settings', 'edit_settings', 'manage_users', 'manage_roles'].includes(permission);
    },
    user: {
      id: 'test-user',
      username: 'admin',
      email: 'admin@test.com',
      rbac_roles: [
        {
          id: 'admin-role',
          name: 'admin',
          display_name: 'Administrator',
          is_active: true,
          permissions: [
            { name: 'settings:user_management', is_active: true },
            { name: 'system:audit_logs', is_active: true }
          ]
        }
      ]
    },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock the RBAC components
jest.mock('../pages/RBACManagement', () => ({
  RBACManagement: () => (
    <div data-testid="rbac-management">
      <h2>RBAC Management Interface</h2>
      <div data-testid="roles-tab">Roles Management</div>
      <div data-testid="permissions-tab">Permissions Management</div>
      <div data-testid="users-tab">User Role Assignment</div>
      <div data-testid="audit-tab">Access Audit Logs</div>
    </div>
  ),
}));

// Mock other settings components
jest.mock('../components/settings/CompanySettingsForm', () => ({
  CompanySettingsForm: () => <div data-testid="company-settings">Company Settings</div>,
}));

jest.mock('../components/settings/GoldPriceConfig', () => ({
  GoldPriceConfig: () => <div data-testid="gold-price-config">Gold Price Config</div>,
}));

jest.mock('../components/settings/InvoiceTemplateDesigner', () => ({
  InvoiceTemplateDesigner: () => <div data-testid="invoice-template">Invoice Template</div>,
}));

jest.mock('../components/settings/RolePermissionManager', () => ({
  RolePermissionManager: () => <div data-testid="role-permission-manager">Role Permission Manager</div>,
}));

jest.mock('../components/settings/UserManagement', () => ({
  UserManagementComponent: () => <div data-testid="user-management">User Management</div>,
}));

jest.mock('../components/settings/DisasterRecoveryDashboard', () => ({
  DisasterRecoveryDashboard: () => <div data-testid="disaster-recovery">Disaster Recovery</div>,
}));

describe('RBAC UI Navigation', () => {
  const renderSettings = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Settings />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render the Settings page with RBAC tab', async () => {
    renderSettings();

    // Check that the Settings page loads
    expect(screen.getByText('settings.title')).toBeInTheDocument();

    // Check that the RBAC tab is visible
    expect(screen.getByText('RBAC')).toBeInTheDocument();
  });

  it('should navigate to RBAC management when RBAC tab is clicked', async () => {
    renderSettings();

    // Find and click the RBAC tab
    const rbacTab = screen.getByText('RBAC');
    fireEvent.click(rbacTab);

    // Wait for the RBAC management component to load
    await waitFor(() => {
      expect(screen.getByTestId('rbac-management')).toBeInTheDocument();
    });

    // Check that RBAC management interface is displayed
    expect(screen.getByText('RBAC Management Interface')).toBeInTheDocument();
    expect(screen.getByTestId('roles-tab')).toBeInTheDocument();
    expect(screen.getByTestId('permissions-tab')).toBeInTheDocument();
    expect(screen.getByTestId('users-tab')).toBeInTheDocument();
    expect(screen.getByTestId('audit-tab')).toBeInTheDocument();
  });

  it('should show other settings tabs and allow navigation', async () => {
    renderSettings();

    // Check that other tabs are present
    expect(screen.getByText('settings.tab_company')).toBeInTheDocument();
    expect(screen.getByText('settings.tab_gold_price')).toBeInTheDocument();
    expect(screen.getByText('settings.tab_templates')).toBeInTheDocument();
    expect(screen.getByText('settings.tab_roles')).toBeInTheDocument();
    expect(screen.getByText('settings.tab_users')).toBeInTheDocument();

    // Test navigation to company settings (should be default)
    expect(screen.getByTestId('company-settings')).toBeInTheDocument();

    // Navigate to gold price tab
    const goldPriceTab = screen.getByText('settings.tab_gold_price');
    fireEvent.click(goldPriceTab);

    await waitFor(() => {
      expect(screen.getByTestId('gold-price-config')).toBeInTheDocument();
    });
  });

  it('should display system status cards', () => {
    renderSettings();

    // Check for system status information
    expect(screen.getByText('settings.system_overview')).toBeInTheDocument();
    expect(screen.getByText('settings.database')).toBeInTheDocument();
    expect(screen.getByText('settings.api_services')).toBeInTheDocument();
    expect(screen.getByText('settings.security')).toBeInTheDocument();
    expect(screen.getByText('settings.backup')).toBeInTheDocument();
  });

  it('should show proper permission-based access', () => {
    renderSettings();

    // RBAC tab should be visible for admin users
    expect(screen.getByText('RBAC')).toBeInTheDocument();
    
    // Users tab should be visible for admin users
    expect(screen.getByText('settings.tab_users')).toBeInTheDocument();
    
    // Roles tab should be visible for admin users
    expect(screen.getByText('settings.tab_roles')).toBeInTheDocument();
  });
});

describe('RBAC UI Navigation - Access Denied', () => {
  beforeEach(() => {
    // Mock limited permissions
    jest.clearAllMocks();
    jest.mock('../hooks/useAuth', () => ({
      useAuth: () => ({
        hasPermission: (permission: string) => {
          // Only basic view permissions
          return permission === 'view_settings';
        },
        user: {
          id: 'test-user',
          username: 'viewer',
          email: 'viewer@test.com',
          rbac_roles: [
            {
              id: 'viewer-role',
              name: 'viewer',
              display_name: 'Viewer',
              is_active: true,
              permissions: [
                { name: 'dashboard:view', is_active: true }
              ]
            }
          ]
        },
        isAuthenticated: true,
        isLoading: false,
      }),
    }));
  });

  it('should handle access denied gracefully', () => {
    const { useAuth } = require('../hooks/useAuth');
    useAuth.mockReturnValue({
      hasPermission: () => false,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Settings />
        </AuthProvider>
      </BrowserRouter>
    );

    // Should show access denied message
    expect(screen.getByText('settings.access_denied')).toBeInTheDocument();
    expect(screen.getByText('settings.access_denied_message')).toBeInTheDocument();
  });
});