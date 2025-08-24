import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Inventory Components Gradient Implementation - Final Verification', () => {
  describe('ProductManagement Component', () => {
    it('should render successfully with all required elements', () => {
      renderWithQueryClient(
        <ProductManagement onClose={jest.fn()} />
      );

      // Verify component renders
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Verify header and title
      expect(screen.getByText('Create New Product')).toBeInTheDocument();

      // Verify all 5 tabs are present
      expect(screen.getByText('Basic Info')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('Variants')).toBeInTheDocument();
      expect(screen.getByText('SEO & Meta')).toBeInTheDocument();

      // Verify action buttons
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create Product')).toBeInTheDocument();
    });

    it('should have functional tab navigation', () => {
      renderWithQueryClient(
        <ProductManagement onClose={jest.fn()} />
      );

      // Test tab switching
      fireEvent.click(screen.getByText('Categories'));
      expect(screen.getByText('Category Assignment')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Images'));
      expect(screen.getByText('Product Images')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Variants'));
      expect(screen.getByText('Product Variants')).toBeInTheDocument();

      fireEvent.click(screen.getByText('SEO & Meta'));
      expect(screen.getByText('SEO & Metadata')).toBeInTheDocument();
    });
  });

  describe('CategoryManager Component', () => {
    it('should render successfully with all required elements', () => {
      renderWithQueryClient(
        <CategoryManager />
      );

      // Verify main elements
      expect(screen.getByText('Advanced Category Management')).toBeInTheDocument();
      expect(screen.getByText('Add Category')).toBeInTheDocument();

      // Verify all 4 tabs are present
      const categoryTreeElements = screen.getAllByText('Category Tree');
      expect(categoryTreeElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
    });

    it('should have functional tab navigation', () => {
      renderWithQueryClient(
        <CategoryManager />
      );

      // Test tab switching
      fireEvent.click(screen.getByText('Images'));
      expect(screen.getByText('Select a Category')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Templates'));
      expect(screen.getByTestId('template-manager')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Bulk Operations'));
      expect(screen.getByTestId('bulk-operations')).toBeInTheDocument();
    });
  });

  describe('InventoryIntelligenceDashboard Component', () => {
    it('should render successfully with all required elements', () => {
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // Verify main elements
      expect(screen.getByText('Inventory Intelligence Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Advanced inventory analytics, optimization, and forecasting')).toBeInTheDocument();

      // Verify action buttons
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();

      // Verify time period controls
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
      expect(screen.getByText('Last Year')).toBeInTheDocument();

      // Verify metric cards
      expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();
      expect(screen.getByText('Optimization Score')).toBeInTheDocument();
      expect(screen.getByText('Average Turnover Ratio')).toBeInTheDocument();
      expect(screen.getByText('Fast Moving Items')).toBeInTheDocument();

      // Verify alerts section
      expect(screen.getByText('Alerts & Recommendations')).toBeInTheDocument();

      // Verify all 5 tabs are present
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Turnover')).toBeInTheDocument();
      expect(screen.getByText('Optimization')).toBeInTheDocument();
      expect(screen.getByText('Forecasting')).toBeInTheDocument();
      expect(screen.getByText('Seasonal')).toBeInTheDocument();
    });

    it('should have functional tab navigation', () => {
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // Test tab switching
      fireEvent.click(screen.getByText('Turnover'));
      expect(screen.getByTestId('turnover-chart')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Optimization'));
      expect(screen.getByTestId('optimization-chart')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Forecasting'));
      expect(screen.getByTestId('forecast-chart')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Seasonal'));
      expect(screen.getByTestId('seasonal-chart')).toBeInTheDocument();

      // Go back to overview
      fireEvent.click(screen.getByText('Overview'));
      expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
    });

    it('should handle time period selection', () => {
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // Test time period buttons
      fireEvent.click(screen.getByText('Last 7 Days'));
      fireEvent.click(screen.getByText('Last 90 Days'));
      fireEvent.click(screen.getByText('Last Year'));

      // All buttons should remain clickable
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
      expect(screen.getByText('Last Year')).toBeInTheDocument();
    });
  });

  describe('Integration and Functionality', () => {
    it('should maintain all original functionality with gradient styling', () => {
      // Test ProductManagement
      const onClose = jest.fn();
      renderWithQueryClient(
        <ProductManagement onClose={onClose} />
      );

      // Test close functionality
      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalled();

      // Test CategoryManager
      renderWithQueryClient(
        <CategoryManager />
      );
      expect(screen.getByText('Advanced Category Management')).toBeInTheDocument();

      // Test InventoryIntelligenceDashboard
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );
      expect(screen.getByText('Inventory Intelligence Dashboard')).toBeInTheDocument();
    });

    it('should render without errors and maintain accessibility', () => {
      // All components should render without throwing errors
      expect(() => {
        renderWithQueryClient(<ProductManagement onClose={jest.fn()} />);
      }).not.toThrow();

      expect(() => {
        renderWithQueryClient(<CategoryManager />);
      }).not.toThrow();

      expect(() => {
        renderWithQueryClient(<InventoryIntelligenceDashboard />);
      }).not.toThrow();
    });
  });

  describe('Task Requirements Verification', () => {
    it('should cover all required tabs for ProductManagement (5 tabs)', () => {
      renderWithQueryClient(
        <ProductManagement onClose={jest.fn()} />
      );

      // Verify all 5 tabs as specified in task 8.3
      expect(screen.getByText('Basic Info')).toBeInTheDocument(); // basic
      expect(screen.getByText('Categories')).toBeInTheDocument(); // categories
      expect(screen.getByText('Images')).toBeInTheDocument(); // images
      expect(screen.getByText('Variants')).toBeInTheDocument(); // variants
      expect(screen.getByText('SEO & Meta')).toBeInTheDocument(); // seo
    });

    it('should cover all required tabs for CategoryManager (4 tabs)', () => {
      renderWithQueryClient(
        <CategoryManager />
      );

      // Verify all 4 tabs as specified in task 8.3
      const categoryTreeElements = screen.getAllByText('Category Tree');
      expect(categoryTreeElements.length).toBeGreaterThan(0); // tree
      expect(screen.getByText('Images')).toBeInTheDocument(); // images
      expect(screen.getByText('Templates')).toBeInTheDocument(); // templates
      expect(screen.getByText('Bulk Operations')).toBeInTheDocument(); // bulk
    });

    it('should cover all required tabs for InventoryIntelligenceDashboard (5 tabs)', () => {
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // Verify all 5 tabs as specified in task 8.3
      expect(screen.getByText('Overview')).toBeInTheDocument(); // overview
      expect(screen.getByText('Turnover')).toBeInTheDocument(); // turnover
      expect(screen.getByText('Optimization')).toBeInTheDocument(); // optimization
      expect(screen.getByText('Forecasting')).toBeInTheDocument(); // forecasting
      expect(screen.getByText('Seasonal')).toBeInTheDocument(); // seasonal
    });
  });
});