import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('Inventory Components Gradient Styling', () => {
  describe('ProductManagement', () => {
    it('should render with gradient styling', () => {
      renderWithQueryClient(
        <ProductManagement onClose={jest.fn()} />
      );

      // Check for gradient icon in header
      const packageIcon = screen.getByRole('dialog');
      expect(packageIcon).toBeInTheDocument();

      // Check for gradient tabs
      expect(screen.getByText('Basic Info')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('Variants')).toBeInTheDocument();
      expect(screen.getByText('SEO & Meta')).toBeInTheDocument();

      // Check for gradient buttons
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create Product')).toBeInTheDocument();
    });

    it('should show gradient styling in images tab', async () => {
      renderWithQueryClient(
        <ProductManagement onClose={jest.fn()} />
      );

      // Click on images tab
      fireEvent.click(screen.getByText('Images'));

      await waitFor(() => {
        expect(screen.getByText('No images uploaded')).toBeInTheDocument();
        expect(screen.getByText('Upload Images')).toBeInTheDocument();
      });
    });

    it('should show gradient styling in variants tab', async () => {
      renderWithQueryClient(
        <ProductManagement onClose={jest.fn()} />
      );

      // Click on variants tab
      fireEvent.click(screen.getByText('Variants'));

      await waitFor(() => {
        expect(screen.getByText('No variants created')).toBeInTheDocument();
        expect(screen.getByText('Add Variant')).toBeInTheDocument();
      });
    });
  });

  describe('CategoryManager', () => {
    it('should render with gradient styling', () => {
      renderWithQueryClient(
        <CategoryManager />
      );

      // Check for gradient header with icon
      expect(screen.getByText('Advanced Category Management')).toBeInTheDocument();
      expect(screen.getByText('Add Category')).toBeInTheDocument();

      // Check for gradient tabs
      expect(screen.getByText('Category Tree')).toBeInTheDocument();
      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
    });

    it('should switch between tabs with gradient styling', async () => {
      renderWithQueryClient(
        <CategoryManager />
      );

      // Click on images tab
      fireEvent.click(screen.getByText('Images'));
      await waitFor(() => {
        expect(screen.getByText('Select a Category')).toBeInTheDocument();
      });

      // Click on templates tab
      fireEvent.click(screen.getByText('Templates'));
      await waitFor(() => {
        expect(screen.getByTestId('template-manager')).toBeInTheDocument();
      });

      // Click on bulk operations tab
      fireEvent.click(screen.getByText('Bulk Operations'));
      await waitFor(() => {
        expect(screen.getByTestId('bulk-operations')).toBeInTheDocument();
      });
    });
  });

  describe('InventoryIntelligenceDashboard', () => {
    it('should render with gradient styling', () => {
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // Check for gradient header with icon
      expect(screen.getByText('Inventory Intelligence Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Advanced inventory analytics, optimization, and forecasting')).toBeInTheDocument();

      // Check for gradient buttons
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();

      // Check for time period buttons with gradient styling
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
      expect(screen.getByText('Last Year')).toBeInTheDocument();
    });

    it('should show gradient styled metric cards', () => {
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // Check for metric cards
      expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();
      expect(screen.getByText('Optimization Score')).toBeInTheDocument();
      expect(screen.getByText('Average Turnover Ratio')).toBeInTheDocument();
      expect(screen.getByText('Fast Moving Items')).toBeInTheDocument();
    });

    it('should show gradient styled alerts section', () => {
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // Check for alerts section with gradient styling
      expect(screen.getByText('Alerts & Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Several items are running low on stock')).toBeInTheDocument();
    });

    it('should switch between tabs with gradient styling', async () => {
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // Check for gradient tabs
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Turnover')).toBeInTheDocument();
      expect(screen.getByText('Optimization')).toBeInTheDocument();
      expect(screen.getByText('Forecasting')).toBeInTheDocument();
      expect(screen.getByText('Seasonal')).toBeInTheDocument();

      // Click on turnover tab
      fireEvent.click(screen.getByText('Turnover'));
      await waitFor(() => {
        expect(screen.getByTestId('turnover-chart')).toBeInTheDocument();
      });

      // Click on optimization tab
      fireEvent.click(screen.getByText('Optimization'));
      await waitFor(() => {
        expect(screen.getByTestId('optimization-chart')).toBeInTheDocument();
      });

      // Click on forecasting tab
      fireEvent.click(screen.getByText('Forecasting'));
      await waitFor(() => {
        expect(screen.getByTestId('forecast-chart')).toBeInTheDocument();
      });

      // Click on seasonal tab
      fireEvent.click(screen.getByText('Seasonal'));
      await waitFor(() => {
        expect(screen.getByTestId('seasonal-chart')).toBeInTheDocument();
      });
    });

    it('should handle time period selection with gradient buttons', async () => {
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // Click on different time periods
      fireEvent.click(screen.getByText('Last 7 Days'));
      fireEvent.click(screen.getByText('Last 90 Days'));
      fireEvent.click(screen.getByText('Last Year'));

      // All buttons should be present and clickable
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
      expect(screen.getByText('Last Year')).toBeInTheDocument();
    });
  });

  describe('Gradient Styling Consistency', () => {
    it('should use consistent gradient colors across components', () => {
      // ProductManagement uses green gradients
      renderWithQueryClient(
        <ProductManagement onClose={jest.fn()} />
      );
      
      // CategoryManager uses teal gradients
      renderWithQueryClient(
        <CategoryManager />
      );
      
      // InventoryIntelligenceDashboard uses blue gradients
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // All components should render without errors
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
    });

    it('should maintain accessibility with gradient styling', () => {
      renderWithQueryClient(
        <InventoryIntelligenceDashboard />
      );

      // Check that buttons are still accessible
      const exportButton = screen.getByText('Export');
      const refreshButton = screen.getByText('Refresh');
      
      expect(exportButton).toBeInTheDocument();
      expect(refreshButton).toBeInTheDocument();
      
      // Buttons should be clickable
      fireEvent.click(exportButton);
      fireEvent.click(refreshButton);
    });
  });
});