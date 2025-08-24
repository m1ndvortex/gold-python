import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Import report pages
import AdvancedChartsPage from '../pages/AdvancedCharts';
import ReportBuilderPage from '../pages/ReportBuilder';
import ForecastingAnalyticsPage from '../pages/ForecastingAnalytics';
import StockOptimizationPage from '../pages/StockOptimization';
import CacheManagementPage from '../pages/CacheManagement';

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

describe('Reports Sub-Pages Styling Maintenance - Simple', () => {
  describe('Advanced Charts Page', () => {
    it('should maintain beautiful gradient styling', async () => {
      renderWithProviders(<AdvancedChartsPage />);
      
      await waitFor(() => {
        // Check for header gradient icon
        const headerIcon = document.querySelector('.bg-gradient-to-br.from-green-500.via-teal-500.to-blue-500');
        expect(headerIcon).toBeInTheDocument();
        
        // Check for main title
        expect(screen.getByText('Advanced Charts')).toBeInTheDocument();
        
        // Check for gradient buttons
        const gradientButton = document.querySelector('.bg-gradient-to-r.from-green-500.to-teal-600');
        expect(gradientButton).toBeInTheDocument();
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
        
        // Check for gradient buttons
        const gradientButton = document.querySelector('.bg-gradient-to-r.from-blue-500.to-indigo-600');
        expect(gradientButton).toBeInTheDocument();
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
        
        // Check for dashboard component
        expect(screen.getByTestId('stock-optimization-dashboard')).toBeInTheDocument();
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
      });
    });
  });
});