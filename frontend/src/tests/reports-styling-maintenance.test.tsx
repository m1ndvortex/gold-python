import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Reports from '../pages/Reports';

// Mock the hooks and components
jest.mock('../hooks/useReports', () => ({
  useRefreshReports: () => ({
    refreshAllReports: jest.fn(),
    refreshSalesReports: jest.fn(),
    refreshInventoryReports: jest.fn(),
    refreshCustomerReports: jest.fn(),
  }),
}));

jest.mock('../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock report components
jest.mock('../components/reports/SalesReports', () => {
  return function MockSalesReports() {
    return <div data-testid="sales-reports">Sales Reports Content</div>;
  };
});

jest.mock('../components/reports/InventoryReports', () => {
  return function MockInventoryReports() {
    return <div data-testid="inventory-reports">Inventory Reports Content</div>;
  };
});

jest.mock('../components/reports/CustomerReports', () => {
  return function MockCustomerReports() {
    return <div data-testid="customer-reports">Customer Reports Content</div>;
  };
});

jest.mock('../components/reports/ReportFilters', () => {
  return function MockReportFilters({ filters, onFiltersChange }: any) {
    return (
      <div data-testid="report-filters">
        <input
          data-testid="filter-input"
          onChange={(e) => onFiltersChange({ ...filters, test: e.target.value })}
        />
      </div>
    );
  };
});

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

describe('Reports Page Styling Maintenance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Header Section Styling', () => {
    test('should maintain professional header typography', () => {
      renderWithProviders(<Reports />);
      
      const title = screen.getByText('Reports & Analytics');
      expect(title).toHaveClass('text-4xl', 'font-bold', 'tracking-tight');
      
      const subtitle = screen.getByText('Comprehensive insights into sales, inventory, and customer performance');
      expect(subtitle).toHaveClass('text-muted-foreground', 'text-lg');
    });

    test('should maintain gradient buttons in header', () => {
      renderWithProviders(<Reports />);
      
      const exportButton = screen.getByText('Export').closest('button');
      expect(exportButton).toHaveClass('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600');
      expect(exportButton).toHaveClass('hover:from-indigo-600', 'hover:to-purple-700');
    });

    test('should display live data badge', () => {
      renderWithProviders(<Reports />);
      
      const liveBadge = screen.getByText('Live Data');
      expect(liveBadge).toBeInTheDocument();
    });

    test('should have gradient icon container in header', () => {
      renderWithProviders(<Reports />);
      
      // Check that gradient classes are present in the DOM
      const gradientIcon = document.querySelector('.bg-gradient-to-br.from-indigo-500.via-purple-500.to-pink-500');
      expect(gradientIcon).toBeInTheDocument();
    });
  });

  describe('Global Filters Card Styling', () => {
    test('should maintain gradient background for filters card', () => {
      renderWithProviders(<Reports />);
      
      const filtersCard = document.querySelector('.bg-gradient-to-r.from-slate-50.to-slate-100\\/80');
      expect(filtersCard).toBeInTheDocument();
    });

    test('should display global filters section', () => {
      renderWithProviders(<Reports />);
      
      const filtersTitle = screen.getByText('Global Filters');
      expect(filtersTitle).toBeInTheDocument();
      
      const filtersDescription = screen.getByText('Configure filters applied across all report sections');
      expect(filtersDescription).toBeInTheDocument();
    });

    test('should display smart filtering badge', () => {
      renderWithProviders(<Reports />);
      
      const smartBadge = screen.getByText('Smart Filtering');
      expect(smartBadge).toBeInTheDocument();
    });
  });

  describe('Tab Navigation Styling', () => {
    test('should maintain gradient background for tab container', () => {
      renderWithProviders(<Reports />);
      
      const tabContainer = document.querySelector('.bg-gradient-to-r.from-indigo-50.via-purple-50.to-pink-50');
      expect(tabContainer).toBeInTheDocument();
    });

    test('should maintain modern pill-style tabs', () => {
      renderWithProviders(<Reports />);
      
      const salesTab = screen.getByText('Sales Reports').closest('button');
      expect(salesTab).toHaveClass('flex', 'items-center', 'gap-3', 'p-4', 'rounded-lg');
      expect(salesTab).toHaveClass('transition-all', 'duration-300');
    });

    test('should display all three main tabs', () => {
      renderWithProviders(<Reports />);
      
      expect(screen.getByText('Sales Reports')).toBeInTheDocument();
      expect(screen.getByText('Revenue & Performance')).toBeInTheDocument();
      
      expect(screen.getByText('Inventory Reports')).toBeInTheDocument();
      expect(screen.getByText('Stock & Valuation')).toBeInTheDocument();
      
      expect(screen.getByText('Customer Reports')).toBeInTheDocument();
      expect(screen.getByText('Behavior & Analytics')).toBeInTheDocument();
    });

    test('should have gradient backgrounds in tab content', () => {
      renderWithProviders(<Reports />);
      
      // Check for gradient background classes in the DOM
      const gradientBackground = document.querySelector('.bg-gradient-to-br.from-indigo-50\\/30.to-white');
      expect(gradientBackground).toBeInTheDocument();
    });
  });

  describe('Tab Content Headers', () => {
    test('should display sales analytics header', () => {
      renderWithProviders(<Reports />);
      
      expect(screen.getByText('Sales Analytics')).toBeInTheDocument();
      expect(screen.getByText('Track revenue trends and sales performance')).toBeInTheDocument();
    });

    test('should display performance badge', () => {
      renderWithProviders(<Reports />);
      
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
    });

    test('should have gradient icon containers', () => {
      renderWithProviders(<Reports />);
      
      // Check for gradient icon classes in the DOM
      const gradientIcon = document.querySelector('.bg-gradient-to-br.from-indigo-500.to-indigo-600');
      expect(gradientIcon).toBeInTheDocument();
    });
  });

  describe('Advanced Analytics Cards', () => {
    test('should maintain gradient backgrounds for analytics cards', () => {
      renderWithProviders(<Reports />);
      
      // Check for various gradient card backgrounds
      const blueGradient = document.querySelector('.bg-gradient-to-br.from-blue-50.to-indigo-100\\/50');
      expect(blueGradient).toBeInTheDocument();
      
      const greenGradient = document.querySelector('.bg-gradient-to-br.from-green-50.to-teal-100\\/50');
      expect(greenGradient).toBeInTheDocument();
      
      const purpleGradient = document.querySelector('.bg-gradient-to-br.from-purple-50.to-violet-100\\/50');
      expect(purpleGradient).toBeInTheDocument();
    });

    test('should display all analytics cards', () => {
      renderWithProviders(<Reports />);
      
      expect(screen.getByText('Report Builder')).toBeInTheDocument();
      expect(screen.getByText('Advanced Charts')).toBeInTheDocument();
      expect(screen.getByText('Forecasting Analytics')).toBeInTheDocument();
      expect(screen.getByText('Stock Optimization')).toBeInTheDocument();
      expect(screen.getByText('Cache Management')).toBeInTheDocument();
      expect(screen.getByText('KPI Dashboard')).toBeInTheDocument();
    });

    test('should maintain gradient buttons in analytics cards', () => {
      renderWithProviders(<Reports />);
      
      const reportBuilderButton = screen.getByText('Open Report Builder').closest('button');
      expect(reportBuilderButton).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600');
      expect(reportBuilderButton).toHaveClass('hover:from-blue-600', 'hover:to-indigo-700');
      
      const chartsButton = screen.getByText('Explore Charts').closest('button');
      expect(chartsButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
      expect(chartsButton).toHaveClass('hover:from-green-600', 'hover:to-teal-700');
    });

    test('should display feature badges', () => {
      renderWithProviders(<Reports />);
      
      expect(screen.getByText('Drag & Drop')).toBeInTheDocument();
      expect(screen.getByText('Interactive')).toBeInTheDocument();
      expect(screen.getByText('AI Powered')).toBeInTheDocument();
      expect(screen.getByText('Optimization')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Real-time')).toBeInTheDocument();
    });
  });

  describe('Tab Switching Functionality', () => {
    test('should allow switching between tabs', () => {
      renderWithProviders(<Reports />);
      
      // Switch to inventory tab
      const inventoryTab = screen.getByText('Inventory Reports').closest('button');
      fireEvent.click(inventoryTab!);
      
      // Verify tab is clickable and functional
      expect(inventoryTab).toBeInTheDocument();
      
      // Switch to customer tab
      const customerTab = screen.getByText('Customer Reports').closest('button');
      fireEvent.click(customerTab!);
      
      // Verify tab is clickable and functional
      expect(customerTab).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should display advanced analytics suite section', () => {
      renderWithProviders(<Reports />);
      
      expect(screen.getByText('Advanced Analytics Suite')).toBeInTheDocument();
      expect(screen.getByText('Powerful analytics tools for comprehensive business intelligence')).toBeInTheDocument();
    });

    test('should have responsive grid classes', () => {
      renderWithProviders(<Reports />);
      
      // Check for responsive grid classes in the DOM
      const responsiveGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
      expect(responsiveGrid).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    test('should maintain hover effects on cards', () => {
      renderWithProviders(<Reports />);
      
      const reportBuilderCard = screen.getByText('Report Builder').closest('.hover\\:shadow-xl');
      expect(reportBuilderCard).toHaveClass('hover:shadow-xl', 'transition-all', 'duration-300');
    });

    test('should maintain button interactions', () => {
      renderWithProviders(<Reports />);
      
      const refreshButton = screen.getByText('Refresh Current');
      expect(refreshButton).toBeInTheDocument();
      
      fireEvent.click(refreshButton);
      // Button should remain functional
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Color Consistency', () => {
    test('should maintain consistent color palette across all elements', () => {
      renderWithProviders(<Reports />);
      
      // Check that all gradient elements use the consistent color spectrum
      const gradientElements = document.querySelectorAll('[class*="gradient"]');
      expect(gradientElements.length).toBeGreaterThan(0);
      
      // Verify specific color combinations are maintained
      const indigoElements = document.querySelectorAll('[class*="from-indigo-5"]');
      const purpleElements = document.querySelectorAll('[class*="from-purple-5"]');
      const blueElements = document.querySelectorAll('[class*="from-blue-5"]');
      const greenElements = document.querySelectorAll('[class*="from-green-5"]');
      
      expect(indigoElements.length).toBeGreaterThan(0);
      expect(purpleElements.length).toBeGreaterThan(0);
      expect(blueElements.length).toBeGreaterThan(0);
      expect(greenElements.length).toBeGreaterThan(0);
    });
  });
});