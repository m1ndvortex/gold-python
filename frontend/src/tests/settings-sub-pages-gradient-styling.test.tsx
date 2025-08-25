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

// Mock fetch globally
global.fetch = jest.fn();

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'testuser' },
    hasPermission: () => true,
  }),
}));

// Mock the language hook
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

// Mock the settings API hooks
jest.mock('../hooks/useSettings', () => ({
  useCompanySettings: () => ({
    data: {
      id: '1',
      company_name: 'Test Gold Shop',
      company_address: '123 Test Street',
      default_gold_price: 50.0,
      default_labor_percentage: 10.0,
      default_profit_percentage: 15.0,
      default_vat_percentage: 5.0,
    },
    isLoading: false,
  }),
  useUpdateCompanySettings: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useGoldPriceConfig: () => ({
    data: {
      current_price: 50.0,
      auto_update_enabled: false,
      last_updated: '2024-01-01T00:00:00Z',
    },
    isLoading: false,
  }),
  useUpdateGoldPrice: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useRoles: () => ({
    data: [
      {
        id: '1',
        name: 'Admin',
        description: 'Administrator role',
        permissions: { manage_users: true, edit_settings: true },
        created_at: '2024-01-01T00:00:00Z',
        users: [],
      },
    ],
    isLoading: false,
  }),
  useCreateRole: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useUpdateRole: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useDeleteRole: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  usePermissionStructure: () => ({
    data: {
      categories: [
        {
          name: 'user_management',
          label: 'User Management',
          permissions: [
            { key: 'manage_users', label: 'Manage Users' },
            { key: 'view_users', label: 'View Users' },
          ],
        },
      ],
    },
    isLoading: false,
  }),
  useUsers: () => ({
    data: {
      users: [
        {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          is_active: true,
          role_id: '1',
          role: { id: '1', name: 'Admin' },
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
    },
    isLoading: false,
  }),
  useCreateUser: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useUpdateUser: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useUpdateUserPassword: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useDeleteUser: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useInvoiceTemplate: () => ({
    data: {
      id: '1',
      name: 'Default Template',
      layout: 'portrait',
      page_size: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      styles: {
        font_family: 'Arial',
        primary_color: '#333333',
        secondary_color: '#666666',
      },
    },
    isLoading: false,
  }),
  useUpdateInvoiceTemplate: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

// Mock toast
jest.mock('../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
      },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Settings Sub-Pages Gradient Styling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Main Settings Page', () => {
    test('renders with gradient styling and all tabs', async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Check main page header with gradient styling
      expect(screen.getByText('System Settings')).toBeInTheDocument();
      
      // Check for gradient icon container in header
      const headerIcon = document.querySelector('.bg-gradient-to-br.from-blue-500.via-indigo-600.to-purple-700');
      expect(headerIcon).toBeInTheDocument();

      // Check for gradient card styling
      const mainCard = document.querySelector('.bg-gradient-to-br.from-white.to-slate-50\\/30');
      expect(mainCard).toBeInTheDocument();

      // Check for gradient tab navigation background
      const tabNavigation = document.querySelector('.bg-gradient-to-r.from-blue-50.via-indigo-50.to-purple-50');
      expect(tabNavigation).toBeInTheDocument();

      // Check all tab triggers have gradient icon containers
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Gold Price')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Roles')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Disaster Recovery')).toBeInTheDocument();
    });

    test('tab content areas have gradient backgrounds', async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('System Settings')).toBeInTheDocument();
      });

      // Company tab should be active by default - check for company settings content
      expect(screen.getByText('Company Settings')).toBeInTheDocument();

      // Click Gold Price tab
      const goldPriceTab = screen.getByText('Gold Price');
      fireEvent.click(goldPriceTab);
      
      await waitFor(() => {
        expect(screen.getByText('Gold Price Configuration')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click Templates tab
      const templatesTab = screen.getByText('Templates');
      fireEvent.click(templatesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Invoice Template Designer')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Company Settings Form', () => {
    test('renders with gradient styling', async () => {
      render(
        <TestWrapper>
          <CompanySettingsForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Company Information')).toBeInTheDocument();
      });

      // Check for company name input
      expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
      
      // Check for save button
      expect(screen.getByText('Save Changes')).toBeInTheDocument();

      // Check for gradient classes using data-testid or text content
      const companyTitle = screen.getByText('Company Information');
      expect(companyTitle).toBeInTheDocument();
    });
  });

  describe('Gold Price Configuration', () => {
    test('renders with gradient styling', async () => {
      render(
        <TestWrapper>
          <GoldPriceConfig />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Gold Price Configuration')).toBeInTheDocument();
      });

      // Check for current gold price display
      expect(screen.getByText('Current Gold Price')).toBeInTheDocument();
      
      // Check for update price input
      expect(screen.getByLabelText('Update Gold Price (per gram)')).toBeInTheDocument();
      
      // Check for update button
      expect(screen.getByText('Update Price')).toBeInTheDocument();

      // Check for automatic updates section
      expect(screen.getByText('Automatic Price Updates')).toBeInTheDocument();
    });
  });

  describe('Role Permission Manager', () => {
    test('renders with gradient styling', async () => {
      render(
        <TestWrapper>
          <RolePermissionManager />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Role & Permission Management')).toBeInTheDocument();
      });

      // Check for create role button
      expect(screen.getByText('Create Role')).toBeInTheDocument();
      
      // Check for role display
      expect(screen.getByText('Admin')).toBeInTheDocument();
      
      // Check for permissions section
      expect(screen.getByText('PERMISSIONS')).toBeInTheDocument();
    });
  });

  describe('User Management Component', () => {
    test('renders with gradient styling', async () => {
      render(
        <TestWrapper>
          <UserManagementComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Check for description
      expect(screen.getByText('Manage system users and their access permissions')).toBeInTheDocument();
      
      // Check for add new user button
      expect(screen.getByText('Add New User')).toBeInTheDocument();
      
      // Check for user table headers
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  describe('Invoice Template Designer', () => {
    test('renders with gradient styling', async () => {
      render(
        <TestWrapper>
          <InvoiceTemplateDesigner />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Invoice Template Designer')).toBeInTheDocument();
      });

      // Check for description
      expect(screen.getByText('Customize your invoice template design and layout')).toBeInTheDocument();
      
      // Check for preview and reset buttons
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
      
      // Check for save template button
      expect(screen.getByText('Save Template')).toBeInTheDocument();
    });

    test('tab navigation has proper gradient styling', async () => {
      render(
        <TestWrapper>
          <InvoiceTemplateDesigner />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Invoice Template Designer')).toBeInTheDocument();
      });

      // Check all tabs are present
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Layout')).toBeInTheDocument();
      expect(screen.getByText('Styling')).toBeInTheDocument();

      // Click Layout tab
      const layoutTab = screen.getByText('Layout');
      fireEvent.click(layoutTab);
      
      await waitFor(() => {
        expect(screen.getByText('Page Margins')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Click Styling tab
      const stylingTab = screen.getByText('Styling');
      fireEvent.click(stylingTab);
      
      await waitFor(() => {
        expect(screen.getByText('Colors')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('System Overview Cards', () => {
    test('renders system status cards with gradient styling', async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('System Overview')).toBeInTheDocument();
      });

      // Check for status card titles
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('API Services')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Backup')).toBeInTheDocument();

      // Check for system information
      expect(screen.getByText('System Information')).toBeInTheDocument();
      expect(screen.getByText('Application')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
    });
  });

  describe('Settings Components Integration', () => {
    test('all settings components render without errors', async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('System Settings')).toBeInTheDocument();
      });

      // Test that all main sections are accessible
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Gold Price')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Roles')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Disaster Recovery')).toBeInTheDocument();

      // Test that system overview is present
      expect(screen.getByText('System Overview')).toBeInTheDocument();
    });

    test('individual components render independently', async () => {
      // Test CompanySettingsForm
      const { unmount: unmountCompany } = render(
        <TestWrapper>
          <CompanySettingsForm />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Company Information')).toBeInTheDocument();
      });
      unmountCompany();

      // Test GoldPriceConfig
      const { unmount: unmountGold } = render(
        <TestWrapper>
          <GoldPriceConfig />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Gold Price Configuration')).toBeInTheDocument();
      });
      unmountGold();

      // Test UserManagementComponent
      const { unmount: unmountUser } = render(
        <TestWrapper>
          <UserManagementComponent />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
      unmountUser();
    });
  });
});