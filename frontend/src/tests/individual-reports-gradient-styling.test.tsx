import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Import the individual report route components
import { ReportsWithRouting } from '../pages/Reports';

// Mock the hooks
jest.mock('../hooks/useReports', () => ({
  useRefreshReports: () => ({
    refreshAllReports: jest.fn(),
    refreshSalesReports: jest.fn(),
    refreshInventoryReports: jest.fn(),
    refreshCustomerReports: jest.fn(),
  }),
  useSalesTrends: () => ({
    data: {
      summary: {
        total_sales: 150000,
        average_daily_sales: 5000,
        total_received: 120000,
        total_transactions: 45,
        average_transaction_value: 3333
      },
      trends: []
    },
    isLoading: false,
    error: null
  }),
  useTopProducts: () => ({
    data: {
      top_by_quantity: [],
      top_by_value: []
    },
    isLoading: false,
    error: null
  }),
  useSalesOverviewChart: () => ({
    data: [],
    isLoading: false
  }),
  useInventoryValuation: () => ({
    data: {
      summary: {
        total_purchase_value: 200000,
        total_sell_value: 300000,
        unique_products: 150,
        total_quantity: 500,
        profit_margin: 0.33
      },
      categories: []
    },
    isLoading: false,
    error: null
  }),
  useLowStockReport: () => ({
    data: {
      products: []
    },
    isLoading: false,
    error: null
  }),
  useCustomerAnalysis: () => ({
    data: {
      summary: {
        total_active_customers: 85,
        total_revenue: 180000,
        average_customer_value: 2118,
        repeat_customer_rate: 65
      },
      customers: []
    },
    isLoading: false,
    error: null
  }),
  useDebtReport: () => ({
    data: {
      customers: []
    },
    isLoading: false,
    error: null
  }),
  useExportReport: () => ({
    exportToPDF: { mutate: jest.fn() },
    exportToCSV: { mutate: jest.fn() }
  })
}));

// Mock chart components
jest.mock('../components/reports/SalesChart', () => ({
  __esModule: true,
  default: () => <div data-testid="sales-chart">Sales Chart</div>
}));

jest.mock('../components/reports/InventoryChart', () => ({
  __esModule: true,
  default: () => <div data-testid="inventory-chart">Inventory Chart</div>
}));

jest.mock('../components/reports/CustomerChart', () => ({
  __esModule: true,
  default: () => <div data-testid="customer-chart">Customer Chart</div>
}));

// Mock report filters
jest.mock('../components/reports/ReportFilters', () => ({
  __esModule: true,
  default: () => <div data-testid="report-filters">Report Filters</div>
}));

// Mock toast
jest.mock('../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

const renderWithProviders = (component: React.ReactElement, initialRoute = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Mock window.location for routing
  Object.defineProperty(window, 'location', {
    value: {
      pathname: initialRoute,
    },
    writable: true,
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Individual Reports Gradient Styling', () => {
  describe('Sales Reports Route (/reports/sales)', () => {
    it('should have beautiful gradient header styling', async () => {
      // Set the route to sales
      window.history.pushState({}, 'Sales Reports', '/reports/sales');
      
      renderWithProviders(<ReportsWithRouting />, '/reports/sales');
      
      await waitFor(() => {
        // Check for gradient header icon
        const headerIcon = document.querySelector('.bg-gradient-to-br.from-indigo-500.via-purple-500.to-pink-500');
        expect(headerIcon).toBeInTheDocument();
        
        // Check for main title
        expect(screen.getByText('گزارشات فروش')).toBeInTheDocument();
        
        // Check for enhanced description
        expect(screen.getByText('تحلیل جامع عملکرد فروش و درآمدزایی')).toBeInTheDocument();
        
        // Check for gradient button
        const gradientButton = document.querySelector('.bg-gradient-to-r.from-indigo-500.to-purple-600');
        expect(gradientButton).toBeInTheDocument();
      });
    });

    it('should have gradient filter card styling', async () => {
      window.history.pushState({}, 'Sales Reports', '/reports/sales');
      
      renderWithProviders(<ReportsWithRouting />, '/reports/sales');
      
      await waitFor(() => {
        // Check for filter card gradient background
        const filterCard = document.querySelector('.bg-gradient-to-r.from-indigo-50\\/80.to-purple-50\\/80');
        expect(filterCard).toBeInTheDocument();
        
        // Check for filter icon gradient
        const filterIcon = document.querySelector('.bg-gradient-to-br.from-indigo-500.to-indigo-600');
        expect(filterIcon).toBeInTheDocument();
        
        // Check for enhanced background for reports
        const reportsBackground = document.querySelector('.bg-gradient-to-br.from-indigo-50\\/30.to-white');
        expect(reportsBackground).toBeInTheDocument();
      });
    });
  });

  describe('Inventory Reports Route (/reports/inventory)', () => {
    it('should have beautiful gradient header styling', async () => {
      window.history.pushState({}, 'Inventory Reports', '/reports/inventory');
      
      renderWithProviders(<ReportsWithRouting />, '/reports/inventory');
      
      await waitFor(() => {
        // Check for gradient header icon
        const headerIcon = document.querySelector('.bg-gradient-to-br.from-green-500.via-teal-500.to-emerald-500');
        expect(headerIcon).toBeInTheDocument();
        
        // Check for main title
        expect(screen.getByText('گزارشات موجودی')).toBeInTheDocument();
        
        // Check for enhanced description
        expect(screen.getByText('تحلیل جامع موجودی و ارزش‌گذاری انبار')).toBeInTheDocument();
        
        // Check for gradient button
        const gradientButton = document.querySelector('.bg-gradient-to-r.from-green-500.to-teal-600');
        expect(gradientButton).toBeInTheDocument();
      });
    });

    it('should have gradient filter card styling', async () => {
      window.history.pushState({}, 'Inventory Reports', '/reports/inventory');
      
      renderWithProviders(<ReportsWithRouting />, '/reports/inventory');
      
      await waitFor(() => {
        // Check for filter card gradient background
        const filterCard = document.querySelector('.bg-gradient-to-r.from-green-50\\/80.to-teal-50\\/80');
        expect(filterCard).toBeInTheDocument();
        
        // Check for filter icon gradient
        const filterIcon = document.querySelector('.bg-gradient-to-br.from-green-500.to-green-600');
        expect(filterIcon).toBeInTheDocument();
        
        // Check for enhanced background for reports
        const reportsBackground = document.querySelector('.bg-gradient-to-br.from-green-50\\/30.to-white');
        expect(reportsBackground).toBeInTheDocument();
      });
    });
  });

  describe('Customer Reports Route (/reports/customers)', () => {
    it('should have beautiful gradient header styling', async () => {
      window.history.pushState({}, 'Customer Reports', '/reports/customers');
      
      renderWithProviders(<ReportsWithRouting />, '/reports/customers');
      
      await waitFor(() => {
        // Check for gradient header icon
        const headerIcon = document.querySelector('.bg-gradient-to-br.from-purple-500.via-pink-500.to-rose-500');
        expect(headerIcon).toBeInTheDocument();
        
        // Check for main title
        expect(screen.getByText('گزارشات مشتریان')).toBeInTheDocument();
        
        // Check for enhanced description
        expect(screen.getByText('تحلیل جامع رفتار و عملکرد مشتریان')).toBeInTheDocument();
        
        // Check for gradient button
        const gradientButton = document.querySelector('.bg-gradient-to-r.from-purple-500.to-pink-600');
        expect(gradientButton).toBeInTheDocument();
      });
    });

    it('should have gradient filter card styling', async () => {
      window.history.pushState({}, 'Customer Reports', '/reports/customers');
      
      renderWithProviders(<ReportsWithRouting />, '/reports/customers');
      
      await waitFor(() => {
        // Check for filter card gradient background
        const filterCard = document.querySelector('.bg-gradient-to-r.from-purple-50\\/80.to-pink-50\\/80');
        expect(filterCard).toBeInTheDocument();
        
        // Check for filter icon gradient
        const filterIcon = document.querySelector('.bg-gradient-to-br.from-purple-500.to-purple-600');
        expect(filterIcon).toBeInTheDocument();
        
        // Check for enhanced background for reports
        const reportsBackground = document.querySelector('.bg-gradient-to-br.from-purple-50\\/30.to-white');
        expect(reportsBackground).toBeInTheDocument();
      });
    });
  });

  describe('Design System Consistency', () => {
    it('should maintain consistent gradient patterns across all report pages', async () => {
      // Test all three pages for consistent styling patterns
      const routes = [
        { path: '/reports/sales', title: 'گزارشات فروش' },
        { path: '/reports/inventory', title: 'گزارشات موجودی' },
        { path: '/reports/customers', title: 'گزارشات مشتریان' }
      ];

      for (const route of routes) {
        window.history.pushState({}, route.title, route.path);
        
        const { unmount } = renderWithProviders(<ReportsWithRouting />, route.path);
        
        await waitFor(() => {
          // Check for consistent header structure
          expect(screen.getByText(route.title)).toBeInTheDocument();
          
          // Check for consistent badge styling
          const badge = document.querySelector('.bg-.*-50.text-.*-700.border-.*-200');
          expect(badge).toBeInTheDocument();
          
          // Check for consistent button styling
          const buttons = document.querySelectorAll('button');
          expect(buttons.length).toBeGreaterThan(0);
          
          // Check for consistent card styling
          const cards = document.querySelectorAll('.shadow-lg');
          expect(cards.length).toBeGreaterThan(0);
        });
        
        unmount();
      }
    });
  });
});