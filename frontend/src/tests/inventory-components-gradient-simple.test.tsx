import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductManagement } from '../components/inventory/ProductManagement';
import { CategoryManager } from '../components/inventory/CategoryManager';
import { InventoryIntelligenceDashboard } from '../components/inventory/InventoryIntelligenceDashboard';

// Mock the hooks
jest.mock('../hooks/useInventory', () => ({
  useCreateInventoryItem: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useUpdateInventoryItem: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useUploadInventoryImage: () => ({
    mutateAsync: jest.fn(),
  }),
  useCategories: () => ({
    data: [
      {
        id: '1',
        name: 'Gold Jewelry',
        description: 'Gold jewelry items',
        attributes: {},
      },
    ],
  }),
  useDeleteCategory: () => ({
    mutateAsync: jest.fn(),
  }),
}));

jest.mock('../hooks/useCategoryManagement', () => ({
  useCategoryTree: () => ({
    data: [
      {
        id: '1',
        name: 'Gold Jewelry',
        description: 'Gold jewelry items',
        children: [],
      },
    ],
    isLoading: false,
  }),
  useCategoryTemplates: () => ({
    data: [],
    isLoading: false,
  }),
  useEnhancedCreateCategory: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useEnhancedUpdateCategory: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useBulkUpdateCategories: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useCreateCategoryTemplate: () => ({
    mutateAsync: jest.fn(),
  }),
  useCreateCategoryFromTemplate: () => ({
    mutateAsync: jest.fn(),
  }),
  useCategoryDragAndDrop: () => ({
    handleDragStart: jest.fn(),
    handleDrop: jest.fn(),
  }),
  useCategorySelection: () => ({
    selectedCategories: new Set(),
    setSelectedCategories: jest.fn(),
    toggleCategory: jest.fn(),
    selectAll: jest.fn(),
    clearSelection: jest.fn(),
  }),
}));

jest.mock('../hooks/useInventoryIntelligence', () => ({
  useInventoryIntelligenceDashboard: () => ({
    data: {
      dashboard_data: {
        overview_metrics: {
          total_inventory_value: 50000,
          optimization_score: 0.85,
          average_turnover_ratio: 4.2,
          fast_moving_items_count: 25,
          total_items_count: 100,
        },
        alerts_and_warnings: [
          {
            severity: 'high',
            type: 'low_stock',
            message: 'Several items are running low on stock',
            action_required: 'Reorder inventory',
          },
        ],
        turnover_analysis: [],
        stock_optimization: [],
        demand_forecasts: [],
        seasonal_insights: [],
      },
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

// Mock chart components
jest.mock('../components/inventory/charts/TurnoverAnalysisChart', () => ({
  TurnoverAnalysisChart: () => <div data-testid="turnover-chart">Turnover Chart</div>,
}));

jest.mock('../components/inventory/charts/StockOptimizationChart', () => ({
  StockOptimizationChart: () => <div data-testid="optimization-chart">Optimization Chart</div>,
}));

jest.mock('../components/inventory/charts/DemandForecastChart', () => ({
  DemandForecastChart: () => <div data-testid="forecast-chart">Forecast Chart</div>,
}));

jest.mock('../components/inventory/charts/SeasonalAnalysisChart', () => ({
  SeasonalAnalysisChart: () => <div data-testid="seasonal-chart">Seasonal Chart</div>,
}));

jest.mock('../components/inventory/charts/PerformanceMetricsChart', () => ({
  PerformanceMetricsChart: () => <div data-testid="performance-chart">Performance Chart</div>,
}));

// Mock other components
jest.mock('../components/inventory/CategoryTreeView', () => ({
  CategoryTreeView: () => <div data-testid="category-tree">Category Tree</div>,
}));

jest.mock('../components/inventory/CategoryForm', () => ({
  CategoryForm: () => <div data-testid="category-form">Category Form</div>,
}));

jest.mock('../components/inventory/CategoryTemplateManager', () => ({
  CategoryTemplateManager: () => <div data-testid="template-manager">Template Manager</div>,
}));

jest.mock('../components/inventory/CategoryBulkOperations', () => ({
  CategoryBulkOperations: () => <div data-testid="bulk-operations">Bulk Operations</div>,
}));

jest.mock('../components/image-management/CategoryImageManager', () => ({
  CategoryImageManager: () => <div data-testid="image-manager">Image Manager</div>,
}));

jest.mock('../components/analytics/DateRangePicker', () => ({
  DateRangePicker: () => <div data-testid="date-picker">Date Picker</div>,
}));

jest.mock('../components/analytics/ExportDialog', () => ({
  ExportDialog: () => <div data-testid="export-dialog">Export Dialog</div>,
}));

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Inventory Components Gradient Styling - Simple Tests', () => {
  describe('ProductManagement', () => {
    it('should render with gradient styling elements', () => {
      renderWithQueryClient(
        <ProductManagement onClose={jest.fn()} />
      );

      // Check that the component renders
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Check for gradient classes in the HTML
      expect(dialog).toHaveClass('bg-gradient-to-br');
      
      // Check for tabs
      expect(screen.getByText('Basic Info')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('Variants')).toBeInTheDocument();
      expect(screen.getByText('SEO & Meta')).toBeInTheDocument();

      // Check for buttons
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create Product')).toBeInTheDocument();
    });
  });

  describe('CategoryManager', () => {
    it('should render with gradient styling elements', () => {
      renderWithQueryClient(
        <CategoryManager />
      );

      // Check for main elements
      expect(screen.getByText('Advanced Category Management')).toBeInTheDocument();
      expect(screen.getByText('Add Category')).toBeInTheDocument();

      // Check for tabs (using getAllByText to handle duplicates)
      const categoryTreeElements = screen.getAllByText('Category Tree');
      expect(categoryTreeElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
    });
  });

  describe('InventoryIntelligenceDashboard', () => {
    it('should render with gradient styling elements', () => {
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // Check for main elements
      expect(screen.getByText('Inventory Intelligence Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Advanced inventory analytics, optimization, and forecasting')).toBeInTheDocument();

      // Check for buttons
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();

      // Check for time period buttons
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
      expect(screen.getByText('Last Year')).toBeInTheDocument();

      // Check for metric cards
      expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();
      expect(screen.getByText('Optimization Score')).toBeInTheDocument();
      expect(screen.getByText('Average Turnover Ratio')).toBeInTheDocument();
      expect(screen.getByText('Fast Moving Items')).toBeInTheDocument();

      // Check for alerts section
      expect(screen.getByText('Alerts & Recommendations')).toBeInTheDocument();

      // Check for tabs
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Turnover')).toBeInTheDocument();
      expect(screen.getByText('Optimization')).toBeInTheDocument();
      expect(screen.getByText('Forecasting')).toBeInTheDocument();
      expect(screen.getByText('Seasonal')).toBeInTheDocument();
    });
  });

  describe('Gradient Styling Verification', () => {
    it('should apply gradient classes correctly', () => {
      // Test ProductManagement gradient classes
      const { container: productContainer } = renderWithQueryClient(
        <ProductManagement onClose={jest.fn()} />
      );
      
      // Check for gradient classes in the DOM
      const gradientElements = productContainer.querySelectorAll('[class*="bg-gradient"]');
      expect(gradientElements.length).toBeGreaterThan(0);

      // Test CategoryManager gradient classes
      const { container: categoryContainer } = renderWithQueryClient(
        <CategoryManager />
      );
      
      const categoryGradientElements = categoryContainer.querySelectorAll('[class*="bg-gradient"]');
      expect(categoryGradientElements.length).toBeGreaterThan(0);

      // Test InventoryIntelligenceDashboard gradient classes
      const { container: dashboardContainer } = renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );
      
      const dashboardGradientElements = dashboardContainer.querySelectorAll('[class*="bg-gradient"]');
      expect(dashboardGradientElements.length).toBeGreaterThan(0);
    });

    it('should use different gradient colors for different components', () => {
      // ProductManagement should use green gradients
      const { container: productContainer } = renderWithQueryClient(
        <ProductManagement onClose={jest.fn()} />
      );
      
      const greenGradients = productContainer.querySelectorAll('[class*="from-green"]');
      expect(greenGradients.length).toBeGreaterThan(0);

      // CategoryManager should use teal gradients
      const { container: categoryContainer } = renderWithQueryClient(
        <CategoryManager />
      );
      
      const tealGradients = categoryContainer.querySelectorAll('[class*="from-teal"]');
      expect(tealGradients.length).toBeGreaterThan(0);

      // InventoryIntelligenceDashboard should use blue gradients
      const { container: dashboardContainer } = renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );
      
      const blueGradients = dashboardContainer.querySelectorAll('[class*="from-blue"]');
      expect(blueGradients.length).toBeGreaterThan(0);
    });
  });
});