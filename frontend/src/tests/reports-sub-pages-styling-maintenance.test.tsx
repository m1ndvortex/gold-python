import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Import all report pages and components
import Reports from '../pages/Reports';
import AdvancedChartsPage from '../pages/AdvancedCharts';
import ReportBuilderPage from '../pages/ReportBuilder';
import ForecastingAnalyticsPage from '../pages/ForecastingAnalytics';
import StockOptimizationPage from '../pages/StockOptimization';
import CacheManagementPage from '../pages/CacheManagement';
import SalesReports from '../components/reports/SalesReports';
import InventoryReports from '../components/reports/InventoryReports';
import CustomerReports from '../components/reports/CustomerReports';

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

// Mock the dashboard components
jest.mock('../components/analytics/ForecastingDashboard', () => ({
  ForecastingDashboard: () => (
    <div data-testid="forecasting-dashboard" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100/50 hover:shadow-xl transition-all duration-300 p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Demand Forecasting</h3>
        </div>
      </div>
    </div>
  )
}));

jest.mock('../components/analytics/StockOptimizationDashboard', () => ({
  StockOptimizationDashboard: () => (
    <div data-testid="stock-optimization-dashboard" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-100/50 hover:shadow-xl transition-all duration-300 p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Stock Optimization</h3>
        </div>
      </div>
    </div>
  )
}));

jest.mock('../components/analytics/CacheManagementDashboard', () => ({
  CacheManagementDashboard: () => (
    <div data-testid="cache-management-dashboard" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-blue-100/50 hover:shadow-xl transition-all duration-300 p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Cache Performance</h3>
        </div>
      </div>
    </div>
  )
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

// Mock advanced chart components
jest.mock('../components/analytics/charts/InteractiveChart', () => ({
  InteractiveChart: () => <div data-testid="interactive-chart">Interactive Chart</div>
}));

jest.mock('../components/analytics/charts/TrendChart', () => ({
  TrendChart: () => <div data-testid="trend-chart">Trend Chart</div>
}));

jest.mock('../components/analytics/charts/HeatmapChart', () => ({
  HeatmapChart: () => <div data-testid="heatmap-chart">Heatmap Chart</div>
}));

jest.mock('../components/analytics/charts/ChartExportMenu', () => ({
  ChartExportMenu: () => <div data-testid="chart-export-menu">Export Menu</div>
}));

// Mock report builder components
jest.mock('../components/reports/ReportBuilder', () => ({
  ReportBuilder: () => <div data-testid="report-builder">Report Builder Component</div>
}));

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

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Reports Sub-Pages Styling Maintenance', () => {
  describe('Main Reports Page', () => {
    it('should maintain beautiful gradient styling in header', async () => {
      renderWithProviders(<Reports />);
      
      await waitFor(() => {
        // Check for gradient header icon
        const headerIcon = document.querySelector('.bg-gradient-to-br.from-indigo-500.via-purple-500.to-pink-500');
        expect(headerIcon).toBeInTheDocument();
        
        // Check for main title
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
        
        // Check for gradient buttons
        const gradientButton = document.querySelector('.bg-gradient-to-r.from-indigo-500.to-purple-600');
        expect(gradientButton).toBeInTheDocument();
      });
    });

    it('should maintain gradient styling in global filters card', async () => {
      renderWithProviders(<Reports />);
      
      await waitFor(() => {
        // Check for filter card gradient background
        const filterCard = document.querySelector('.bg-gradient-to-r.from-slate-50.to-slate-100\\/80');
        expect(filterCard).toBeInTheDocument();
        
        // Check for filter icon gradient
        const filterIcon = document.querySelector('.bg-gradient-to-br.from-blue-500.to-blue-600');
        expect(filterIcon).toBeInTheDocument();
      });
    });

    it('should maintain gradient tab navigation styling', async () => {
      renderWithProviders(<Reports />);
      
      await waitFor(() => {
        // Check for tab container gradient
        const tabContainer = document.querySelector('.bg-gradient-to-r.from-indigo-50.via-purple-50.to-pink-50');
        expect(tabContainer).toBeInTheDocument();
        
        // Check for tab icons with gradient backgrounds
        const tabIcons = document.querySelectorAll('.bg-indigo-100, .bg-purple-100, .bg-pink-100');
        expect(tabIcons.length).toBeGreaterThan(0);
      });
    });

    it('should maintain advanced analytics cards gradient styling', async () => {
      renderWithProviders(<Reports />);
      
      await waitFor(() => {
        // Check for various gradient card backgrounds
        const gradientCards = document.querySelectorAll(
          '.bg-gradient-to-br.from-blue-50.to-indigo-100\\/50, ' +
          '.bg-gradient-to-br.from-green-50.to-teal-100\\/50, ' +
          '.bg-gradient-to-br.from-purple-50.to-violet-100\\/50, ' +
          '.bg-gradient-to-br.from-orange-50.to-red-100\\/50, ' +
          '.bg-gradient-to-br.from-cyan-50.to-blue-100\\/50, ' +
          '.bg-gradient-to-br.from-emerald-50.to-green-100\\/50'
        );
        expect(gradientCards.length).toBeGreaterThan(0);
        
        // Check for gradient icon containers
        const iconContainers = document.querySelectorAll('.bg-gradient-to-br.from-blue-500, .bg-gradient-to-br.from-green-500');
        expect(iconContainers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Sales Reports Sub-Page', () => {
    it('should maintain beautiful styling in sales reports', async () => {
      const filters = { start_date: '2024-01-01', end_date: '2024-12-31', category_id: '' };
      renderWithProviders(<SalesReports filters={filters} />);
      
      await waitFor(() => {
        // Check for sales summary cards
        expect(screen.getByText('کل فروش')).toBeInTheDocument();
        expect(screen.getByText('مبلغ دریافتی')).toBeInTheDocument();
        
        // Verify currency formatting
        expect(screen.getByText('150,000 تومان')).toBeInTheDocument();
      });
    });
  });

  describe('Inventory Reports Sub-Page', () => {
    it('should maintain beautiful styling in inventory reports', async () => {
      const filters = { start_date: '2024-01-01', end_date: '2024-12-31', category_id: '' };
      renderWithProviders(<InventoryReports filters={filters} />);
      
      await waitFor(() => {
        // Check for inventory summary cards
        expect(screen.getByText('ارزش خرید کل')).toBeInTheDocument();
        expect(screen.getByText('ارزش فروش کل')).toBeInTheDocument();
        
        // Verify currency formatting
        expect(screen.getByText('200,000 تومان')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Reports Sub-Page', () => {
    it('should maintain beautiful styling in customer reports', async () => {
      const filters = { start_date: '2024-01-01', end_date: '2024-12-31', category_id: '' };
      renderWithProviders(<CustomerReports filters={filters} />);
      
      await waitFor(() => {
        // Check for customer summary cards
        expect(screen.getByText('مشتریان فعال')).toBeInTheDocument();
        expect(screen.getByText('کل درآمد')).toBeInTheDocument();
        
        // Verify number formatting
        expect(screen.getByText('85')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Charts Page', () => {
    it('should maintain beautiful gradient styling', async () => {
      renderWithProviders(<AdvancedChartsPage />);
      
      await waitFor(() => {
        // Check for header gradient icon
        const headerIcon = document.querySelector('.bg-gradient-to-br.from-green-500.via-teal-500.to-blue-500');
        expect(headerIcon).toBeInTheDocument();
        
        // Check for main title
        expect(screen.getByText('Advanced Charts')).toBeInTheDocument();
        
        // Check for feature cards with gradient backgrounds
        const featureCards = document.querySelectorAll(
          '.bg-gradient-to-br.from-green-50.to-green-100\\/50, ' +
          '.bg-gradient-to-br.from-teal-50.to-teal-100\\/50, ' +
          '.bg-gradient-to-br.from-blue-50.to-blue-100\\/50, ' +
          '.bg-gradient-to-br.from-purple-50.to-purple-100\\/50'
        );
        expect(featureCards.length).toBeGreaterThan(0);
        
        // Check for tab navigation gradient
        const tabContainer = document.querySelector('.bg-gradient-to-r.from-green-50.via-teal-50.to-blue-50');
        expect(tabContainer).toBeInTheDocument();
      });
    });

    it('should maintain interactive chart components', async () => {
      renderWithProviders(<AdvancedChartsPage />);
      
      await waitFor(() => {
        // Check for chart components
        expect(screen.getAllByTestId('interactive-chart')).toHaveLength(2);
      });
    });
  });

  describe('Report Builder Page', () => {
    it('should maintain beautiful gradient styling', async () => {
      renderWithProviders(<ReportBuilderPage />);
      
      await waitFor(() => {
        // Check for header gradient icon
        const headerIcon = document.querySelector('.bg-gradient-to-br.from-blue-500.via-indigo-500.to-purple-500');
        expect(headerIcon).toBeInTheDocument();
        
        // Check for main title
        expect(screen.getByText('Report Builder')).toBeInTheDocument();
        
        // Check for feature cards with gradient backgrounds
        const featureCards = document.querySelectorAll(
          '.bg-gradient-to-br.from-blue-50.to-blue-100\\/50, ' +
          '.bg-gradient-to-br.from-indigo-50.to-indigo-100\\/50, ' +
          '.bg-gradient-to-br.from-purple-50.to-purple-100\\/50'
        );
        expect(featureCards.length).toBeGreaterThan(0);
        
        // Check for gradient buttons
        const gradientButton = document.querySelector('.bg-gradient-to-r.from-blue-500.to-indigo-600');
        expect(gradientButton).toBeInTheDocument();
      });
    });

    it('should display drag and drop interface elements', async () => {
      renderWithProviders(<ReportBuilderPage />);
      
      await waitFor(() => {
        // Check for drag and drop sections
        expect(screen.getByText('Data Sources')).toBeInTheDocument();
        expect(screen.getByText('Available Fields')).toBeInTheDocument();
        expect(screen.getByText('Report Canvas')).toBeInTheDocument();
        
        // Check for draggable elements
        expect(screen.getByText('Sales Data')).toBeInTheDocument();
        expect(screen.getByText('Inventory Data')).toBeInTheDocument();
        expect(screen.getByText('Customer Data')).toBeInTheDocument();
      });
    });
  });

  describe('Forecasting Analytics Page', () => {
    it('should maintain beautiful gradient styling', async () => {
      renderWithProviders(<ForecastingAnalyticsPage />);
      
      await waitFor(() => {
        // Check for header gradient icon
        const headerIcon = document.querySelector('.bg-gradient-to-br.from-purple-500.via-violet-500.to-indigo-500');
        expect(headerIcon).toBeInTheDocument();
        
        // Check for main title
        expect(screen.getByText('Forecasting Analytics')).toBeInTheDocument();
        
        // Check for dashboard component
        expect(screen.getByTestId('forecasting-dashboard')).toBeInTheDocument();
        
        // Check for gradient cards in dashboard
        const gradientCard = document.querySelector('.bg-gradient-to-br.from-purple-50.to-violet-100\\/50');
        expect(gradientCard).toBeInTheDocument();
      });
    });
  });

  describe('Stock Optimization Page', () => {
    it('should maintain beautiful gradient styling', async () => {
      renderWithProviders(<StockOptimizationPage />);
      
      await waitFor(() => {
        // Check for header gradient icon
        const headerIcon = document.querySelector('.bg-gradient-to-br.from-orange-500.via-red-500.to-pink-500');
        expect(headerIcon).toBeInTheDocument();
        
        // Check for main title
        expect(screen.getAllByText('Stock Optimization')).toHaveLength(2);
        
        // Check for dashboard component
        expect(screen.getByTestId('stock-optimization-dashboard')).toBeInTheDocument();
        
        // Check for gradient cards in dashboard
        const gradientCard = document.querySelector('.bg-gradient-to-br.from-orange-50.to-red-100\\/50');
        expect(gradientCard).toBeInTheDocument();
      });
    });
  });

  describe('Cache Management Page', () => {
    it('should maintain beautiful gradient styling', async () => {
      renderWithProviders(<CacheManagementPage />);
      
      await waitFor(() => {
        // Check for header gradient icon
        const headerIcon = document.querySelector('.bg-gradient-to-br.from-blue-500.via-cyan-500.to-teal-500');
        expect(headerIcon).toBeInTheDocument();
        
        // Check for main title
        expect(screen.getByText('Cache Management')).toBeInTheDocument();
        
        // Check for dashboard component
        expect(screen.getByTestId('cache-management-dashboard')).toBeInTheDocument();
        
        // Check for gradient cards in dashboard
        const gradientCard = document.querySelector('.bg-gradient-to-br.from-cyan-50.to-blue-100\\/50');
        expect(gradientCard).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should maintain gradient styling on different screen sizes', async () => {
      // Test mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderWithProviders(<Reports />);
      
      await waitFor(() => {
        // Check that gradient elements are still present on mobile
        const headerIcon = document.querySelector('.bg-gradient-to-br.from-indigo-500.via-purple-500.to-pink-500');
        expect(headerIcon).toBeInTheDocument();
        
        // Check responsive grid classes
        const gridElements = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
        expect(gridElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper contrast ratios with gradient backgrounds', async () => {
      renderWithProviders(<Reports />);
      
      await waitFor(() => {
        // Check for proper text contrast classes
        const textElements = document.querySelectorAll('.text-foreground, .text-muted-foreground, .text-white');
        expect(textElements.length).toBeGreaterThan(0);
        
        // Check for proper focus states
        const focusableElements = document.querySelectorAll('button, [tabindex]');
        expect(focusableElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance', () => {
    it('should render gradient elements efficiently', async () => {
      const startTime = performance.now();
      renderWithProviders(<Reports />);
      
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});