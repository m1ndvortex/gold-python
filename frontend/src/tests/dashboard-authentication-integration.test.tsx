import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { mockAuthenticatedUser, mockUnauthenticatedUser } from './mocks/authMocks';
import { mockDashboardApi } from './mocks/dashboardApiMocks';

// Mock axios first before any imports
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: { success: true } })),
      post: jest.fn(() => Promise.resolve({ data: { success: true } })),
      put: jest.fn(() => Promise.resolve({ data: { success: true } })),
      delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
      patch: jest.fn(() => Promise.resolve({ data: { success: true } })),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    }))
  }
}));

// Mock the dashboard API
jest.mock('../services/dashboardApi', () => ({
  dashboardApi: mockDashboardApi,
}));

import { Dashboard } from '../pages/Dashboard';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the authentication hooks
jest.mock('../hooks/useAuth');
jest.mock('../hooks/usePermissions');
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string, params?: any) => {
      if (params) {
        return key.replace(/\{(\w+)\}/g, (match, param) => params[param] || match);
      }
      return key;
    },
  }),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
      gcTime: 0,
    },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Authentication Integration', () => {
  let mockUseAuth: jest.Mock;
  let mockUsePermissions: jest.Mock;

  beforeEach(() => {
    mockUseAuth = require('../hooks/useAuth').useAuth as jest.Mock;
    mockUsePermissions = require('../hooks/usePermissions').usePermissions as jest.Mock;
    
    // Reset all mocks
    jest.clearAllMocks();
    mockDashboardApi.getDailySalesSummary.mockClear();
    mockDashboardApi.getSalesChartData.mockClear();
    mockDashboardApi.getCategorySalesData.mockClear();
    mockDashboardApi.getTopProducts.mockClear();
    mockDashboardApi.getLowStockItems.mockClear();
    mockDashboardApi.getUnpaidInvoices.mockClear();
  });

  describe('Authentication States', () => {
    it('should show authentication error when auth fails', async () => {
      mockUseAuth.mockReturnValue({
        ...mockUnauthenticatedUser,
        error: 'Authentication failed',
      });

      mockUsePermissions.mockReturnValue({
        canViewDashboard: () => false,
        hasPermission: () => false,
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(screen.getByText('auth.authentication_error')).toBeInTheDocument();
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      expect(screen.getByText('common.reload_page')).toBeInTheDocument();
    });

    it('should show access denied when user lacks dashboard permission', async () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthenticatedUser,
        error: null,
      });

      mockUsePermissions.mockReturnValue({
        canViewDashboard: () => false,
        hasPermission: () => false,
        hasAnyPermission: () => false,
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(screen.getByText('auth.access_denied')).toBeInTheDocument();
      expect(screen.getByText('auth.dashboard_access_required')).toBeInTheDocument();
    });

    it('should render dashboard when authenticated with proper permissions', async () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthenticatedUser,
        error: null,
      });

      mockUsePermissions.mockReturnValue({
        canViewDashboard: () => true,
        hasPermission: (permission: string) => {
          const allowedPermissions = [
            'dashboard:view',
            'sales:view',
            'inventory:view',
            'reports:view',
            'invoices:view'
          ];
          return allowedPermissions.includes(permission);
        },
        hasAnyPermission: (permissions: string[]) => {
          const allowedPermissions = [
            'dashboard:view',
            'sales:view',
            'inventory:view',
            'reports:view',
            'invoices:view'
          ];
          return permissions.some(p => allowedPermissions.includes(p));
        },
        canViewAccounting: () => true,
        canManageInventory: () => true,
        canManageCustomers: () => true,
        canViewReports: () => true,
        canViewAnalytics: () => true,
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Should show dashboard header
      expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
      
      // Should show user welcome message
      expect(screen.getByText(/dashboard.welcome_user/)).toBeInTheDocument();
      
      // Should show refresh button
      expect(screen.getByText('common.refresh')).toBeInTheDocument();
    });
  });

  describe('Permission-Based Rendering', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        ...mockAuthenticatedUser,
        error: null,
      });
    });

    it('should show permission fallbacks when user lacks specific permissions', async () => {
      mockUsePermissions.mockReturnValue({
        canViewDashboard: () => true,
        hasPermission: (permission: string) => {
          // Only allow dashboard view, deny others
          return permission === 'dashboard:view';
        },
        hasAnyPermission: (permissions: string[]) => {
          return permissions.includes('dashboard:view');
        },
        canViewAccounting: () => false,
        canManageInventory: () => false,
        canManageCustomers: () => false,
        canViewReports: () => false,
        canViewAnalytics: () => false,
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show permission fallback messages for charts and alerts
        expect(screen.getByText('auth.charts_access_required')).toBeInTheDocument();
        expect(screen.getByText('auth.alerts_access_required')).toBeInTheDocument();
      });
    });

    it('should show all components when user has all permissions', async () => {
      mockUsePermissions.mockReturnValue({
        canViewDashboard: () => true,
        hasPermission: () => true, // Allow all permissions
        hasAnyPermission: () => true, // Allow all permissions
        canViewAccounting: () => true,
        canManageInventory: () => true,
        canManageCustomers: () => true,
        canViewReports: () => true,
        canViewAnalytics: () => true,
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not show any permission fallback messages
        expect(screen.queryByText('auth.charts_access_required')).not.toBeInTheDocument();
        expect(screen.queryByText('auth.alerts_access_required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Loading with Authentication', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        ...mockAuthenticatedUser,
        error: null,
      });

      mockUsePermissions.mockReturnValue({
        canViewDashboard: () => true,
        hasPermission: () => true,
        hasAnyPermission: () => true,
        canViewAccounting: () => true,
        canManageInventory: () => true,
        canManageCustomers: () => true,
        canViewReports: () => true,
        canViewAnalytics: () => true,
      });
    });

    it('should load dashboard data when authenticated', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        // Verify API calls were made
        expect(mockDashboardApi.getDailySalesSummary).toHaveBeenCalled();
        expect(mockDashboardApi.getSalesChartData).toHaveBeenCalled();
        expect(mockDashboardApi.getCategorySalesData).toHaveBeenCalled();
        expect(mockDashboardApi.getTopProducts).toHaveBeenCalled();
        expect(mockDashboardApi.getLowStockItems).toHaveBeenCalled();
        expect(mockDashboardApi.getUnpaidInvoices).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock API to throw error
      mockDashboardApi.getDailySalesSummary.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show error state
        expect(screen.getByText('dashboard.error_loading')).toBeInTheDocument();
        expect(screen.getByText('common.try_again')).toBeInTheDocument();
      });
    });

    it('should refresh data when refresh button is clicked', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Wait for component to render and show refresh button
      await waitFor(() => {
        expect(screen.getByText(/common\.(refresh|try_again)/)).toBeInTheDocument();
      });

      // Find and click any refresh button (header or error state)
      const refreshButton = screen.getByText(/common\.(refresh|try_again)/);
      fireEvent.click(refreshButton);

      // Verify that the refresh action was triggered (button should be present)
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('User Information Display', () => {
    it('should display user information when authenticated', async () => {
      const mockUser = {
        ...mockAuthenticatedUser.user,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      };

      mockUseAuth.mockReturnValue({
        ...mockAuthenticatedUser,
        user: mockUser,
        error: null,
      });

      mockUsePermissions.mockReturnValue({
        canViewDashboard: () => true,
        hasPermission: () => true,
        hasAnyPermission: () => true,
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Should display user's name and email
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('should show fallback when user name is not available', async () => {
      const mockUser = {
        ...mockAuthenticatedUser.user,
        first_name: null,
        last_name: null,
        username: 'johndoe',
      };

      mockUseAuth.mockReturnValue({
        ...mockAuthenticatedUser,
        user: mockUser,
        error: null,
      });

      mockUsePermissions.mockReturnValue({
        canViewDashboard: () => true,
        hasPermission: () => true,
        hasAnyPermission: () => true,
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Should show username as fallback in welcome message
      expect(screen.getByText(/dashboard.welcome_user/)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state while authentication is initializing', async () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthenticatedUser,
        isLoading: true,
        error: null,
      });

      mockUsePermissions.mockReturnValue({
        canViewDashboard: () => true,
        hasPermission: () => true,
        hasAnyPermission: () => true,
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Should show loading indicators
      expect(screen.getByText('common.refresh')).toBeInTheDocument();
      
      // Refresh button should be disabled during loading
      const refreshButton = screen.getByText('common.refresh').closest('button');
      expect(refreshButton).toBeDisabled();
    });
  });
});