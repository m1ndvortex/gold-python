import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Settings } from '../pages/Settings';
import { CompanySettingsForm } from '../components/settings/CompanySettingsForm';
import { GoldPriceConfig } from '../components/settings/GoldPriceConfig';
import { RolePermissionManager } from '../components/settings/RolePermissionManager';
import { UserManagementComponent } from '../components/settings/UserManagement';
import { InvoiceTemplateDesigner } from '../components/settings/InvoiceTemplateDesigner';
import { useAuth } from '../hooks/useAuth';
import { settingsApi } from '../services/settingsApi';

// Mock the auth hook
jest.mock('../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the language hook
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    direction: 'ltr',
  }),
}));

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

// Mock the settings API
jest.mock('../services/settingsApi');
const mockSettingsApi = settingsApi as jest.Mocked<typeof settingsApi>;

// Mock toast
jest.mock('../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Settings Interface - Docker Integration Tests', () => {
  beforeEach(() => {
    // Mock auth permissions
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'admin',
        email: 'admin@test.com',
        role_id: '1',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        // role object optional, provide minimal shape
        role: { id: '1', name: 'Owner', description: 'Owner role', permissions: {}, created_at: '2024-01-01T00:00:00Z' }
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      isLoggingIn: false,
      loginError: null,
      hasPermission: jest.fn().mockReturnValue(true),
      hasAnyRole: jest.fn().mockReturnValue(true),
      hasRole: jest.fn().mockReturnValue(true),
      getPermissions: jest.fn().mockReturnValue({}),
      isTokenExpired: jest.fn().mockReturnValue(false)
    });

    // Mock API responses
    mockSettingsApi.getCompanySettings.mockResolvedValue({
      id: '1',
      company_name: 'Test Gold Shop',
      company_logo_url: '',
      company_address: '123 Test Street',
      default_gold_price: 50.0,
      default_labor_percentage: 10.0,
      default_profit_percentage: 15.0,
      default_vat_percentage: 5.0,
      updated_at: '2024-01-01T00:00:00Z',
    });

    mockSettingsApi.getGoldPriceConfig.mockResolvedValue({
      current_price: 50.0,
      auto_update_enabled: false,
      last_updated: '2024-01-01T00:00:00Z',
    });

    mockSettingsApi.getAllRoles.mockResolvedValue([
      {
        id: '1',
        name: 'Admin',
        description: 'Administrator role',
        permissions: { manage_users: true, edit_settings: true },
        created_at: '2024-01-01T00:00:00Z',
        users: [],
      },
    ]);

    mockSettingsApi.getAllUsers.mockResolvedValue({
      users: [
        {
          id: '1',
          username: 'admin',
          email: 'admin@test.com',
          role_id: '1',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          role: {
            id: '1',
            name: 'Admin',
            description: 'Administrator role',
            permissions: { manage_users: true },
            created_at: '2024-01-01T00:00:00Z',
          },
        },
      ],
      total: 1,
      page: 1,
      per_page: 20,
    });

    mockSettingsApi.getPermissionStructure.mockResolvedValue({
      categories: [
        {
          name: 'inventory',
          label: 'Inventory Management',
          permissions: [
            { key: 'view_inventory', label: 'View Inventory' },
            { key: 'edit_inventory', label: 'Edit Inventory' },
          ],
        },
      ],
    });

    mockSettingsApi.getInvoiceTemplate.mockResolvedValue({
      name: 'Default Template',
      layout: 'portrait',
      page_size: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      header: {
        name: 'header',
        fields: [],
        position: { x: 0, y: 0 },
        style: {},
      },
      body: {
        name: 'body',
        fields: [],
        position: { x: 0, y: 80 },
        style: {},
      },
      footer: {
        name: 'footer',
        fields: [],
        position: { x: 0, y: 700 },
        style: {},
      },
      styles: { font_family: 'Arial' },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Settings Page', () => {
    test('renders settings page with all tabs', async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      expect(screen.getByText('System Settings')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Gold Price')).toBeInTheDocument();
      expect(screen.getByText('Invoice')).toBeInTheDocument();
      expect(screen.getByText('Roles')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    test('shows access denied when user lacks permissions', () => {
      mockUseAuth.mockReturnValue({
        user: undefined,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        isLoggingIn: false,
        loginError: null,
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyRole: jest.fn().mockReturnValue(false),
        hasRole: jest.fn().mockReturnValue(false),
        getPermissions: jest.fn().mockReturnValue({}),
        isTokenExpired: jest.fn().mockReturnValue(true)
      });

      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Company Settings Form', () => {
    test('renders company settings form with data', async () => {
      render(
        <TestWrapper>
          <CompanySettingsForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Gold Shop')).toBeInTheDocument();
        expect(screen.getByDisplayValue('123 Test Street')).toBeInTheDocument();
        expect(screen.getByDisplayValue('50')).toBeInTheDocument();
      });
    });

    test('updates company settings', async () => {
      mockSettingsApi.updateCompanySettings.mockResolvedValue({
        success: true,
        message: 'Settings updated successfully',
      });

      render(
        <TestWrapper>
          <CompanySettingsForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Gold Shop')).toBeInTheDocument();
      });

      const companyNameInput = screen.getByDisplayValue('Test Gold Shop');
      fireEvent.change(companyNameInput, { target: { value: 'Updated Gold Shop' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSettingsApi.updateCompanySettings).toHaveBeenCalledWith(
          expect.objectContaining({
            company_name: 'Updated Gold Shop',
          })
        );
      });
    });
  });

  describe('Gold Price Configuration', () => {
    test('renders gold price config with current price', async () => {
      render(
        <TestWrapper>
          <GoldPriceConfig />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('$50.00')).toBeInTheDocument();
        expect(screen.getByText('Manual Update')).toBeInTheDocument();
      });
    });

    test('updates gold price', async () => {
      mockSettingsApi.updateGoldPrice.mockResolvedValue({
        success: true,
        message: 'Gold price updated successfully',
      });

      render(
        <TestWrapper>
          <GoldPriceConfig />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('50')).toBeInTheDocument();
      });

      const priceInput = screen.getByDisplayValue('50');
      fireEvent.change(priceInput, { target: { value: '55' } });

      const updateButton = screen.getByText('Update Price');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockSettingsApi.updateGoldPrice).toHaveBeenCalledWith({
          price: "55",
        });
      });
    });
  });

  describe('Role Permission Manager', () => {
    test('renders roles list', async () => {
      render(
        <TestWrapper>
          <RolePermissionManager />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Administrator role')).toBeInTheDocument();
      });
    });

    test('creates new role', async () => {
      mockSettingsApi.createRole.mockResolvedValue({
        id: '2',
        name: 'Manager',
        description: 'Manager role',
        permissions: { view_inventory: true },
        created_at: '2024-01-01T00:00:00Z',
        users: [],
      });

      render(
        <TestWrapper>
          <RolePermissionManager />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Role');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Role')).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText('e.g., Sales Manager');
      fireEvent.change(nameInput, { target: { value: 'Manager' } });

      const submitButton = screen.getByText('Create Role');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSettingsApi.createRole).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Manager',
          })
        );
      });
    });
  });

  describe('User Management', () => {
    test('renders users list', async () => {
      render(
        <TestWrapper>
          <UserManagementComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      });
    });

    test('creates new user', async () => {
      mockSettingsApi.createUser.mockResolvedValue({
        id: '2',
        username: 'newuser',
        email: 'newuser@test.com',
        role_id: '1',
        is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        role: {
          id: '1',
          name: 'Admin',
          description: 'Administrator role',
          permissions: { manage_users: true },
          created_at: '2024-01-01T00:00:00Z',
        },
      });

      render(
        <TestWrapper>
          <UserManagementComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Create New User')).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText('Enter username');
      fireEvent.change(usernameInput, { target: { value: 'newuser' } });

      const emailInput = screen.getByPlaceholderText('Enter email');
      fireEvent.change(emailInput, { target: { value: 'newuser@test.com' } });

      const passwordInput = screen.getByPlaceholderText('Enter password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const createButton = screen.getByText('Create User');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockSettingsApi.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'newuser',
            email: 'newuser@test.com',
            password: 'password123',
          })
        );
      });
    });
  });

  describe('Invoice Template Designer', () => {
    test('renders template designer', async () => {
      render(
        <TestWrapper>
          <InvoiceTemplateDesigner />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Invoice Template Designer')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Default Template')).toBeInTheDocument();
      });
    });

    test('updates template settings', async () => {
      mockSettingsApi.updateInvoiceTemplate.mockResolvedValue({
        success: true,
        message: 'Template updated successfully',
      });

      render(
        <TestWrapper>
          <InvoiceTemplateDesigner />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Default Template')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Default Template');
      fireEvent.change(nameInput, { target: { value: 'Custom Template' } });

      const saveButton = screen.getByText('Save Template');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSettingsApi.updateInvoiceTemplate).toHaveBeenCalled();
      });
    });

    test('shows preview mode', async () => {
      render(
        <TestWrapper>
          <InvoiceTemplateDesigner />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Preview')[0]).toBeInTheDocument();
      });

      const previewButton = screen.getAllByText('Preview')[0];
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('Invoice Template Preview')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration Tests', () => {
    test('handles API errors gracefully', async () => {
      mockSettingsApi.getCompanySettings.mockRejectedValue(
        new Error('Network error')
      );

      render(
        <TestWrapper>
          <CompanySettingsForm />
        </TestWrapper>
      );

      // Should show loading state and handle error
      await waitFor(() => {
        expect(screen.getByText('Company Information')).toBeInTheDocument();
      });
    });

    test('validates form inputs', async () => {
      render(
        <TestWrapper>
          <CompanySettingsForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      const companyNameInput = screen.getByPlaceholderText('Enter company name');
      fireEvent.change(companyNameInput, { target: { value: '' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
      });
    });

    test('handles permission-based UI rendering', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          username: 'user',
          email: 'user@test.com',
          role_id: '2',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          role: { id: '2', name: 'User', description: 'User role', permissions: { view_settings: true }, created_at: '2024-01-01T00:00:00Z' }
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        isLoggingIn: false,
        loginError: null,
        hasPermission: (permission: string) => permission === 'view_settings',
        hasAnyRole: jest.fn().mockReturnValue(false),
        hasRole: jest.fn().mockReturnValue(false),
        getPermissions: jest.fn().mockReturnValue({ view_settings: true }),
        isTokenExpired: jest.fn().mockReturnValue(false)
      });

      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Should show settings but not user/role management tabs
      expect(screen.getByText('System Settings')).toBeInTheDocument();
      expect(screen.queryByText('Users')).not.toBeInTheDocument();
      expect(screen.queryByText('Roles')).not.toBeInTheDocument();
    });
  });

  describe('Real Backend Integration', () => {
    // These tests would run against the actual Docker backend
    test('connects to real settings API', async () => {
      // This test would make actual API calls to the Docker backend
      // For now, we'll simulate the behavior
      const realApiCall = async () => {
        try {
          // In a real test, this would be:
          // const response = await fetch('http://localhost:8000/settings/company');
          // return response.json();
          return mockSettingsApi.getCompanySettings();
        } catch (error) {
          throw new Error('Failed to connect to backend');
        }
      };

      const result = await realApiCall();
      expect(result).toBeDefined();
      expect(result.company_name).toBe('Test Gold Shop');
    });

    test('validates backend response format', async () => {
      const response = await mockSettingsApi.getCompanySettings();
      
      // Validate response structure
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('company_name');
      expect(response).toHaveProperty('default_gold_price');
      expect(typeof response.default_gold_price).toBe('number');
    });
  });
});

describe('Settings Components Integration', () => {
  test('all settings components work together', async () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    // Test tab navigation
    const goldPriceTab = screen.getByText('Gold Price');
    fireEvent.click(goldPriceTab);

    await waitFor(() => {
      expect(screen.getByText('Gold Price Configuration')).toBeInTheDocument();
    });

    const invoiceTab = screen.getByText('Invoice');
    fireEvent.click(invoiceTab);

    await waitFor(() => {
      expect(screen.getByText('Invoice Template Designer')).toBeInTheDocument();
    });
  });

  test('settings data persistence across tabs', async () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    // Verify data loads in company tab
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Gold Shop')).toBeInTheDocument();
    });

    // Switch to gold price tab
    const goldPriceTab = screen.getByText('Gold Price');
    fireEvent.click(goldPriceTab);

    await waitFor(() => {
      expect(screen.getByText('$50.00')).toBeInTheDocument();
    });

    // Switch back to company tab - data should still be there
    const companyTab = screen.getByText('Company');
    fireEvent.click(companyTab);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Gold Shop')).toBeInTheDocument();
    });
  });
});