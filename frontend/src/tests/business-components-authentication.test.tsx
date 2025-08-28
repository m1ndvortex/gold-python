/**
 * Business Components Authentication Integration Tests
 * Tests authentication and permission integration for all business components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { UniversalInventoryManagement } from '../components/inventory/UniversalInventoryManagement';
import { CustomerList } from '../components/customers/CustomerList';
import { Invoices } from '../pages/Invoices';
import { Accounting } from '../pages/Accounting';
import { AccountingDashboard } from '../components/accounting/AccountingDashboard';

// Mock the API services
jest.mock('../services/universalInventoryApi', () => ({
  universalInventoryApi: {
    searchItems: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  },
  universalCategoriesApi: {
    getCategoryTree: jest.fn().mockResolvedValue([]),
  },
  stockAlertsApi: {
    getLowStockAlerts: jest.fn().mockResolvedValue({ alerts: [] }),
  },
  inventoryAnalyticsApi: {
    getOverallAnalytics: jest.fn().mockResolvedValue({}),
  },
  inventoryMovementsApi: {
    getMovements: jest.fn().mockResolvedValue({ movements: [] }),
  },
}));

jest.mock('../hooks/useCustomers', () => ({
  useCustomers: jest.fn().mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
  }),
  useCustomerSearch: jest.fn().mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../hooks/useInvoices', () => ({
  useInvoiceSummary: jest.fn().mockReturnValue({
    data: {
      total_invoices: 0,
      total_amount: 0,
      total_paid: 0,
      total_remaining: 0,
    },
    isLoading: false,
  }),
}));

jest.mock('../hooks/useAccounting', () => ({
  useAccounting: () => ({
    useLedgerSummary: jest.fn().mockReturnValue({
      data: {
        total_income: 0,
        total_expenses: 0,
        total_cash_flow: 0,
        total_gold_weight: 0,
        total_customer_debt: 0,
        net_profit: 0,
      },
      isLoading: false,
    }),
  }),
}));

jest.mock('../services/accountingApi', () => ({
  accountingApi: {
    getDashboardData: jest.fn().mockResolvedValue({
      total_assets: 0,
      total_liabilities: 0,
      total_equity: 0,
      net_income: 0,
      total_revenue: 0,
      total_expenses: 0,
      cash_balance: 0,
      accounts_receivable: 0,
      accounts_payable: 0,
      pending_journal_entries: 0,
      unreconciled_transactions: 0,
      recent_transactions: [],
    }),
  },
}));

// Mock language hook
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

// Test wrapper component
const TestWrapper: React.FC<{ 
  children: React.ReactNode;
  authValue?: any;
}> = ({ children, authValue }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const defaultAuthValue = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    hasPermission: jest.fn().mockReturnValue(false),
    hasRole: jest.fn().mockReturnValue(false),
    hasAnyRole: jest.fn().mockReturnValue(false),
    getToken: jest.fn().mockReturnValue(null),
    isTokenExpired: jest.fn().mockReturnValue(true),
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider value={authValue || defaultAuthValue}>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Business Components Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Inventory Management Authentication', () => {
    it('should show authentication required message when not authenticated', () => {
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access inventory management.')).toBeInTheDocument();
    });

    it('should show access denied when authenticated but no permissions', () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'user' },
        hasPermission: jest.fn().mockReturnValue(false),
        hasRole: jest.fn().mockReturnValue(false),
        hasAnyRole: jest.fn().mockReturnValue(false),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to view inventory.")).toBeInTheDocument();
    });

    it('should render inventory management when authenticated with permissions', async () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'manager' },
        hasPermission: jest.fn((permission: string) => {
          return ['view_inventory', 'create_inventory', 'edit_inventory'].includes(permission);
        }),
        hasRole: jest.fn().mockReturnValue(true),
        hasAnyRole: jest.fn().mockReturnValue(true),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Universal Inventory Management')).toBeInTheDocument();
      });

      // Check that Add Item button is visible with create permission
      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });

    it('should hide Add Item button when user lacks create permission', async () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'viewer' },
        hasPermission: jest.fn((permission: string) => {
          return permission === 'view_inventory'; // Only view permission
        }),
        hasRole: jest.fn().mockReturnValue(false),
        hasAnyRole: jest.fn().mockReturnValue(false),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Universal Inventory Management')).toBeInTheDocument();
      });

      // Add Item button should not be visible without create permission
      expect(screen.queryByText('Add Item')).not.toBeInTheDocument();
    });
  });

  describe('Customer Management Authentication', () => {
    it('should show authentication required message when not authenticated', () => {
      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access customer management.')).toBeInTheDocument();
    });

    it('should show access denied when authenticated but no permissions', () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'user' },
        hasPermission: jest.fn().mockReturnValue(false),
        hasRole: jest.fn().mockReturnValue(false),
        hasAnyRole: jest.fn().mockReturnValue(false),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <CustomerList />
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to view customers.")).toBeInTheDocument();
    });

    it('should render customer list when authenticated with permissions', async () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'manager' },
        hasPermission: jest.fn((permission: string) => {
          return ['view_customers', 'create_customers', 'edit_customers'].includes(permission);
        }),
        hasRole: jest.fn().mockReturnValue(true),
        hasAnyRole: jest.fn().mockReturnValue(true),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <CustomerList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('customers.title')).toBeInTheDocument();
      });
    });
  });

  describe('Invoice Management Authentication', () => {
    it('should show authentication required message when not authenticated', () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access invoice management.')).toBeInTheDocument();
    });

    it('should show access denied when authenticated but no permissions', () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'user' },
        hasPermission: jest.fn().mockReturnValue(false),
        hasRole: jest.fn().mockReturnValue(false),
        hasAnyRole: jest.fn().mockReturnValue(false),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <Invoices />
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to view invoices.")).toBeInTheDocument();
    });

    it('should render invoice management when authenticated with permissions', async () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'manager' },
        hasPermission: jest.fn((permission: string) => {
          return ['view_invoices', 'create_invoices', 'edit_invoices'].includes(permission);
        }),
        hasRole: jest.fn().mockReturnValue(true),
        hasAnyRole: jest.fn().mockReturnValue(true),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Invoice Management')).toBeInTheDocument();
      });

      // Check that Create New Invoice button is visible with create permission
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });
  });

  describe('Accounting Authentication', () => {
    it('should show authentication required message when not authenticated', () => {
      render(
        <TestWrapper>
          <Accounting />
        </TestWrapper>
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access accounting features.')).toBeInTheDocument();
    });

    it('should show access denied when authenticated but no permissions', () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'user' },
        hasPermission: jest.fn().mockReturnValue(false),
        hasRole: jest.fn().mockReturnValue(false),
        hasAnyRole: jest.fn().mockReturnValue(false),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <Accounting />
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to view accounting data.")).toBeInTheDocument();
    });

    it('should render accounting dashboard when authenticated with permissions', async () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'accountant' },
        hasPermission: jest.fn((permission: string) => {
          return ['view_accounting', 'manage_accounting'].includes(permission);
        }),
        hasRole: jest.fn().mockReturnValue(true),
        hasAnyRole: jest.fn().mockReturnValue(true),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <Accounting />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('accounting.title')).toBeInTheDocument();
      });
    });
  });

  describe('Accounting Dashboard Authentication', () => {
    it('should show authentication required message when not authenticated', () => {
      render(
        <TestWrapper>
          <AccountingDashboard />
        </TestWrapper>
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access accounting dashboard.')).toBeInTheDocument();
    });

    it('should show access denied when authenticated but no permissions', () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'user' },
        hasPermission: jest.fn().mockReturnValue(false),
        hasRole: jest.fn().mockReturnValue(false),
        hasAnyRole: jest.fn().mockReturnValue(false),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <AccountingDashboard />
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to view accounting data.")).toBeInTheDocument();
    });

    it('should render accounting dashboard when authenticated with permissions', async () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'accountant' },
        hasPermission: jest.fn((permission: string) => {
          return ['view_accounting'].includes(permission);
        }),
        hasRole: jest.fn().mockReturnValue(true),
        hasAnyRole: jest.fn().mockReturnValue(true),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <AccountingDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Accounting Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Permission-Based UI Elements', () => {
    it('should show/hide action buttons based on permissions', async () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'viewer' },
        hasPermission: jest.fn((permission: string) => {
          // Only view permissions, no create/edit/delete
          return permission.startsWith('view_');
        }),
        hasRole: jest.fn().mockReturnValue(false),
        hasAnyRole: jest.fn().mockReturnValue(false),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Universal Inventory Management')).toBeInTheDocument();
      });

      // Should not show create/edit buttons without permissions
      expect(screen.queryByText('Add Item')).not.toBeInTheDocument();
    });

    it('should show all action buttons with full permissions', async () => {
      const authValue = {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'admin' },
        hasPermission: jest.fn().mockReturnValue(true), // All permissions
        hasRole: jest.fn().mockReturnValue(true),
        hasAnyRole: jest.fn().mockReturnValue(true),
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        getToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };

      render(
        <TestWrapper authValue={authValue}>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Universal Inventory Management')).toBeInTheDocument();
      });

      // Should show create button with full permissions
      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', () => {
      const authValue = {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Authentication failed',
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        hasRole: jest.fn().mockReturnValue(false),
        hasAnyRole: jest.fn().mockReturnValue(false),
        getToken: jest.fn().mockReturnValue(null),
        isTokenExpired: jest.fn().mockReturnValue(true),
      };

      render(
        <TestWrapper authValue={authValue}>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });

    it('should handle loading states properly', () => {
      const authValue = {
        isAuthenticated: false,
        user: null,
        isLoading: true,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        hasPermission: jest.fn().mockReturnValue(false),
        hasRole: jest.fn().mockReturnValue(false),
        hasAnyRole: jest.fn().mockReturnValue(false),
        getToken: jest.fn().mockReturnValue(null),
        isTokenExpired: jest.fn().mockReturnValue(true),
      };

      render(
        <TestWrapper authValue={authValue}>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Should show authentication required during loading when not authenticated
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });
  });
});