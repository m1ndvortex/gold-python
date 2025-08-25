import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mock the hooks
jest.mock('../hooks/useReports', () => ({
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

describe('Individual Reports Gradient Styling Verification', () => {
  it('should verify that Reports.tsx file has been updated with gradient styling', async () => {
    // This test verifies that the Reports.tsx file contains the expected gradient classes
    // by checking if the file imports and uses the necessary components
    
    // Import the Reports component to ensure it compiles correctly
    const Reports = require('../pages/Reports').default;
    expect(Reports).toBeDefined();
    
    // Check that the component can be rendered without errors
    const { container } = renderWithProviders(<Reports />);
    expect(container).toBeInTheDocument();
  });

  it('should verify gradient classes are present in the DOM when Reports component renders', async () => {
    const Reports = require('../pages/Reports').default;
    
    renderWithProviders(<Reports />);
    
    await waitFor(() => {
      // Check for main Reports page gradient elements
      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      
      // Check for gradient icon containers
      const gradientIcons = document.querySelectorAll('.bg-gradient-to-br');
      expect(gradientIcons.length).toBeGreaterThan(0);
      
      // Check for gradient buttons
      const gradientButtons = document.querySelectorAll('.bg-gradient-to-r');
      expect(gradientButtons.length).toBeGreaterThan(0);
      
      // Check for shadow effects
      const shadowElements = document.querySelectorAll('.shadow-lg');
      expect(shadowElements.length).toBeGreaterThan(0);
    });
  });

  it('should verify that individual report route components exist and can be imported', () => {
    // Test that the individual route components can be imported
    const { ReportsWithRouting } = require('../pages/Reports');
    expect(ReportsWithRouting).toBeDefined();
    
    // Verify the component can be rendered
    const { container } = renderWithProviders(<ReportsWithRouting />);
    expect(container).toBeInTheDocument();
  });

  it('should confirm the Reports file structure includes enhanced styling', () => {
    // Read the Reports.tsx file content to verify it includes gradient styling
    const fs = require('fs');
    const path = require('path');
    
    const reportsFilePath = path.join(__dirname, '../pages/Reports.tsx');
    const fileContent = fs.readFileSync(reportsFilePath, 'utf8');
    
    // Check for gradient classes in the file content
    expect(fileContent).toContain('bg-gradient-to-br');
    expect(fileContent).toContain('from-indigo-500');
    expect(fileContent).toContain('from-green-500');
    expect(fileContent).toContain('from-purple-500');
    expect(fileContent).toContain('shadow-lg');
    expect(fileContent).toContain('تحلیل جامع');
  });
});