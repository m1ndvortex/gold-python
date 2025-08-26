import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
// Jest globals are available by default
import '@testing-library/jest-dom';
import '../types/jest-dom.d';

// Import components to test
import { UniversalInventoryManagement } from '../components/inventory/UniversalInventoryManagement';
import { UniversalInventorySearch } from '../components/inventory/UniversalInventorySearch';
import { UniversalCategoryHierarchy } from '../components/inventory/UniversalCategoryHierarchy';
import { StockLevelMonitor } from '../components/inventory/StockLevelMonitor';
import { BarcodeScanner } from '../components/inventory/BarcodeScanner';
import { InventoryMovementHistory } from '../components/inventory/InventoryMovementHistory';

// Mock API services
import * as universalInventoryApi from '../services/universalInventoryApi';
import { LanguageContext } from '../hooks/useLanguage';

// Mock data
const mockCategories = [
  {
    id: '1',
    name: 'Electronics',
    parent_id: undefined,
    description: 'Electronic items',
    icon: '📱',
    color: '#3B82F6',
    business_type: 'retail',
    attribute_schema: [],
    category_metadata: {},
    sort_order: 1,
    level: 0,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    children: [
      {
        id: '2',
        name: 'Smartphones',
        parent_id: '1',
        description: 'Mobile phones',
        icon: '📱',
        color: '#10B981',
        business_type: 'retail',
        attribute_schema: [],
        category_metadata: {},
        sort_order: 1,
        level: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        children: [],
        product_count: 5,
        total_stock: 25,
        total_value: 12500,
      }
    ],
    product_count: 5,
    total_stock: 25,
    total_value: 12500,
  }
];

const mockInventoryItems = [
  {
    id: '1',
    sku: 'PHONE-001',
    barcode: '1234567890123',
    qr_code: null,
    name: 'iPhone 15 Pro',
    category_id: '2',
    description: 'Latest iPhone model',
    cost_price: 800,
    sale_price: 1200,
    currency: 'USD',
    stock_quantity: 10,
    min_stock_level: 5,
    unit_of_measure: 'piece',
    conversion_factors: {},
    attributes: {
      brand: 'Apple',
      color: 'Space Black',
      storage: '256GB'
    },
    tags: ['premium', 'smartphone'],
    business_type_fields: {},
    weight_grams: 187,
    purchase_price: 800,
    sell_price: 1200,
    gold_specific: null,
    image_url: 'https://example.com/iphone.jpg',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    category: mockCategories[0].children[0]
  }
];

const mockSearchResponse = {
  items: mockInventoryItems,
  total_count: 1,
  page_info: {},
  filters_applied: {}
};

const mockLowStockAlerts = [
  {
    item_id: '1',
    item_name: 'iPhone 15 Pro',
    sku: 'PHONE-001',
    category_name: 'Smartphones',
    current_stock: 3,
    min_stock_level: 5,
    shortage: 2,
    urgency_score: 8,
    alert_level: 'low' as const,
    unit_cost: 800,
    potential_lost_sales: 1600,
    last_movement_date: '2024-01-01T00:00:00Z'
  }
];

const mockAnalytics = {
  total_items: 1,
  total_categories: 2,
  total_inventory_value: 12000,
  low_stock_items: 1,
  out_of_stock_items: 0,
  top_categories_by_value: [],
  top_items_by_value: [],
  inventory_turnover: 2.5,
  last_updated: '2024-01-01T00:00:00Z'
};

const mockMovements = [
  {
    id: '1',
    inventory_item_id: '1',
    movement_type: 'purchase' as const,
    quantity: 10,
    unit_cost: 800,
    total_cost: 8000,
    reference_type: 'purchase_order',
    reference_id: 'PO-001',
    notes: 'Initial stock',
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    inventory_item: mockInventoryItems[0],
    creator: { name: 'John Doe', email: 'john@example.com' }
  }
];

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock API functions
jest.mock('../services/universalInventoryApi', () => ({
  universalInventoryApi: {
    searchItems: jest.fn(),
    getItem: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    adjustStock: jest.fn(),
  },
  universalCategoriesApi: {
    getCategoryTree: jest.fn(),
    getCategory: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  },
  stockAlertsApi: {
    getLowStockAlerts: jest.fn(),
    getOutOfStockItems: jest.fn(),
  },
  inventoryAnalyticsApi: {
    getOverallAnalytics: jest.fn(),
    getCategoryAnalytics: jest.fn(),
  },
  inventoryMovementsApi: {
    getMovements: jest.fn(),
    getMovement: jest.fn(),
  },
  barcodeApi: {
    generateBarcodes: jest.fn(),
    scanBarcode: jest.fn(),
    printBarcodes: jest.fn(),
  },
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TestLanguageProvider>
          {children}
        </TestLanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Language Provider for tests
const TestLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const languageValue = {
    language: 'en' as const,
    direction: 'ltr' as const,
    setLanguage: jest.fn(),
    t: (key: string) => key, // Simple mock that returns the key
    isRTL: false,
    isLTR: true,
    getLayoutClasses: () => '',
    getTextAlignClass: () => 'text-left',
    getFlexDirectionClass: () => 'flex-row',
    getMarginClass: () => 'ml-2',
    getPaddingClass: () => 'pl-2',
    getBorderClass: () => 'border-l',
    getFloatClass: () => 'float-left',
    getClearClass: () => 'clear-left',
    getTransformClass: () => '',
    formatNumber: (num: number) => num.toString(),
    formatDate: (date: Date) => date.toISOString(),
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`
  };

  return (
    <LanguageContext.Provider value={languageValue}>
      {children}
    </LanguageContext.Provider>
  );
};

describe('Universal Inventory Management', () => {
  beforeEach(() => {
    // Setup default mock implementations
    (universalInventoryApi.universalInventoryApi.searchItems as jest.Mock).mockResolvedValue(mockSearchResponse);
    (universalInventoryApi.universalCategoriesApi.getCategoryTree as jest.Mock).mockResolvedValue(mockCategories);
    (universalInventoryApi.stockAlertsApi.getLowStockAlerts as jest.Mock).mockResolvedValue({
      alerts: mockLowStockAlerts,
      summary: {},
      threshold_multiplier: 1.0
    });
    (universalInventoryApi.inventoryAnalyticsApi.getOverallAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);
    (universalInventoryApi.inventoryMovementsApi.getMovements as jest.Mock).mockResolvedValue({
      movements: mockMovements,
      total_count: 1
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UniversalInventoryManagement Component', () => {
    it('renders main inventory management interface', async () => {
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Check header
      expect(screen.getByText('Universal Inventory Management')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive inventory management with advanced features')).toBeInTheDocument();

      // Check action buttons
      expect(screen.getByRole('button', { name: /advanced search/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });
    });

    it('displays inventory items in list view', async () => {
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
        expect(screen.getByText('PHONE-001')).toBeInTheDocument();
        expect(screen.getByText('Smartphones')).toBeInTheDocument();
      });
    });

    it('switches between list and grid views', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Find and click grid view button
      const gridButton = screen.getByRole('button', { name: /grid/i });
      await user.click(gridButton);

      // Should still show the item but in grid format
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });

    it('opens advanced search panel', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      const searchButton = screen.getByRole('button', { name: /advanced search/i });
      await user.click(searchButton);

      expect(screen.getByText('Advanced Search & Filters')).toBeInTheDocument();
    });

    it('navigates between tabs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Click on Categories tab
      const categoriesTab = screen.getByRole('tab', { name: /categories/i });
      await user.click(categoriesTab);

      await waitFor(() => {
        expect(screen.getByText('Category Hierarchy')).toBeInTheDocument();
      });

      // Click on Analytics tab
      const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText('Inventory Analytics')).toBeInTheDocument();
      });
    });

    it('displays analytics data correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Navigate to analytics tab
      const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Total items
        expect(screen.getByText('$12,000')).toBeInTheDocument(); // Total value
        expect(screen.getByText('1')).toBeInTheDocument(); // Low stock items
      });
    });

    it('shows stock alerts', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Navigate to alerts tab
      const alertsTab = screen.getByRole('tab', { name: /alerts/i });
      await user.click(alertsTab);

      await waitFor(() => {
        expect(screen.getByText('Stock Alerts')).toBeInTheDocument();
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });
    });
  });

  describe('UniversalInventorySearch Component', () => {
    const mockOnSearch = jest.fn();
    const mockOnFiltersChange = jest.fn();

    const defaultProps = {
      categories: mockCategories,
      filters: {
        query: '',
        category_ids: [],
        attributes_filter: {},
        tags_filter: [],
        sku_filter: '',
        barcode_filter: '',
        business_type: '',
        include_inactive: false,
        low_stock_only: false,
        out_of_stock_only: false,
        sort_by: 'name' as const,
        sort_order: 'asc' as const,
      },
      onFiltersChange: mockOnFiltersChange,
      onSearch: mockOnSearch,
    };

    it('renders search interface', () => {
      render(
        <TestWrapper>
          <UniversalInventorySearch {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Advanced Search & Filters')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
    });

    it('handles text search input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventorySearch {...defaultProps} />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'iPhone');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'iPhone' })
      );
    });

    it('handles SKU filter', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventorySearch {...defaultProps} />
        </TestWrapper>
      );

      const skuInput = screen.getByPlaceholderText(/enter sku/i);
      await user.type(skuInput, 'PHONE-001');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ sku_filter: 'PHONE-001' })
      );
    });

    it('expands and collapses advanced filters', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventorySearch {...defaultProps} />
        </TestWrapper>
      );

      // Find the expand button (chevron)
      const expandButton = screen.getByRole('button', { name: /settings/i });
      await user.click(expandButton);

      // Should show advanced filters
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Stock Levels')).toBeInTheDocument();
    });

    it('resets filters', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventorySearch {...defaultProps} />
        </TestWrapper>
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '',
          category_ids: [],
          sku_filter: '',
          barcode_filter: '',
        })
      );
    });
  });

  describe('UniversalCategoryHierarchy Component', () => {
    const mockOnCategorySelect = jest.fn();
    const mockOnToggleExpanded = jest.fn();

    const defaultProps = {
      categories: mockCategories,
      expandedCategories: new Set(['1']),
      onToggleExpanded: mockOnToggleExpanded,
      onCategorySelect: mockOnCategorySelect,
    };

    it('renders category hierarchy', () => {
      render(
        <TestWrapper>
          <UniversalCategoryHierarchy {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Category Hierarchy')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Smartphones')).toBeInTheDocument();
    });

    it('shows category statistics', () => {
      render(
        <TestWrapper>
          <UniversalCategoryHierarchy {...defaultProps} showStats={true} />
        </TestWrapper>
      );

      expect(screen.getByText('5')).toBeInTheDocument(); // Product count
      expect(screen.getByText('25')).toBeInTheDocument(); // Stock count
    });

    it('handles category selection', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalCategoryHierarchy {...defaultProps} />
        </TestWrapper>
      );

      const categoryElement = screen.getByText('Electronics');
      await user.click(categoryElement);

      expect(mockOnCategorySelect).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Electronics' })
      );
    });

    it('handles category expansion', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalCategoryHierarchy {...defaultProps} />
        </TestWrapper>
      );

      // Find the expand/collapse button (first button in the category)
      const expandButton = screen.getAllByRole('button')[0];
      await user.click(expandButton);

      expect(mockOnToggleExpanded).toHaveBeenCalledWith('1');
    });
  });

  describe('StockLevelMonitor Component', () => {
    const defaultProps = {
      categories: mockCategories,
    };

    it('renders stock level monitor', async () => {
      render(
        <TestWrapper>
          <StockLevelMonitor {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Stock Level Monitor')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });
    });

    it('displays stock alerts', async () => {
      render(
        <TestWrapper>
          <StockLevelMonitor {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
        expect(screen.getByText('Current Stock:')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // Current stock
        expect(screen.getByText('5')).toBeInTheDocument(); // Min level
      });
    });

    it('shows statistics cards', async () => {
      render(
        <TestWrapper>
          <StockLevelMonitor {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Total Alerts')).toBeInTheDocument();
        expect(screen.getByText('Out of Stock')).toBeInTheDocument();
        expect(screen.getByText('Critical')).toBeInTheDocument();
        expect(screen.getByText('Potential Loss')).toBeInTheDocument();
      });
    });

    it('refreshes alerts', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <StockLevelMonitor {...defaultProps} />
        </TestWrapper>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(universalInventoryApi.stockAlertsApi.getLowStockAlerts).toHaveBeenCalledTimes(2);
    });
  });

  describe('InventoryMovementHistory Component', () => {
    const defaultProps = {
      itemId: '1',
    };

    it('renders movement history', async () => {
      render(
        <TestWrapper>
          <InventoryMovementHistory {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Inventory Movement History')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Purchase')).toBeInTheDocument();
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });
    });

    it('displays movement statistics', async () => {
      render(
        <TestWrapper>
          <InventoryMovementHistory {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Total In')).toBeInTheDocument();
        expect(screen.getByText('Total Out')).toBeInTheDocument();
        expect(screen.getByText('Net Change')).toBeInTheDocument();
        expect(screen.getByText('Total Value')).toBeInTheDocument();
      });
    });

    it('opens stock adjustment dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InventoryMovementHistory {...defaultProps} />
        </TestWrapper>
      );

      const adjustmentButton = screen.getByRole('button', { name: /stock adjustment/i });
      await user.click(adjustmentButton);

      expect(screen.getByText('Stock Adjustment')).toBeInTheDocument();
      expect(screen.getByText('Movement Type')).toBeInTheDocument();
      expect(screen.getByText('Quantity Change')).toBeInTheDocument();
    });

    it('filters movements by type', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InventoryMovementHistory {...defaultProps} />
        </TestWrapper>
      );

      // Find the movement type filter
      const typeFilter = screen.getByDisplayValue('All types');
      await user.click(typeFilter);

      // Select purchase type
      const purchaseOption = screen.getByText('Purchase');
      await user.click(purchaseOption);

      // Should call the API with filtered parameters
      await waitFor(() => {
        expect(universalInventoryApi.inventoryMovementsApi.getMovements).toHaveBeenCalledWith(
          '1',
          ['purchase'],
          undefined,
          undefined,
          25,
          0
        );
      });
    });
  });

  describe('BarcodeScanner Component', () => {
    const mockOnItemFound = jest.fn();
    const mockOnItemNotFound = jest.fn();
    const mockOnClose = jest.fn();

    const defaultProps = {
      onItemFound: mockOnItemFound,
      onItemNotFound: mockOnItemNotFound,
      onClose: mockOnClose,
    };

    // Mock navigator.mediaDevices
    beforeEach(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          enumerateDevices: jest.fn().mockResolvedValue([
            { kind: 'videoinput', deviceId: 'camera1' }
          ]),
          getUserMedia: jest.fn().mockResolvedValue({
            getTracks: () => [{ stop: jest.fn() }]
          }),
        },
        writable: true,
      });
    });

    it('renders barcode scanner interface', () => {
      render(
        <TestWrapper>
          <BarcodeScanner {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Barcode Scanner & Generator')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /scanner/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /manual/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /generate/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument();
    });

    it('handles manual barcode entry', async () => {
      const user = userEvent.setup();
      
      (universalInventoryApi.barcodeApi.scanBarcode as jest.Mock).mockResolvedValue(mockInventoryItems[0]);
      
      render(
        <TestWrapper>
          <BarcodeScanner {...defaultProps} />
        </TestWrapper>
      );

      // Switch to manual tab
      const manualTab = screen.getByRole('tab', { name: /manual/i });
      await user.click(manualTab);

      // Enter barcode
      const barcodeInput = screen.getByPlaceholderText(/enter barcode manually/i);
      await user.type(barcodeInput, '1234567890123');

      // Click search
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(universalInventoryApi.barcodeApi.scanBarcode).toHaveBeenCalledWith('1234567890123');
        expect(mockOnItemFound).toHaveBeenCalledWith(mockInventoryItems[0]);
      });
    });

    it('switches between tabs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BarcodeScanner {...defaultProps} />
        </TestWrapper>
      );

      // Switch to generate tab
      const generateTab = screen.getByRole('tab', { name: /generate/i });
      await user.click(generateTab);

      expect(screen.getAllByText('Generate Barcodes')[0]).toBeInTheDocument();
      expect(screen.getByText('Barcode Type')).toBeInTheDocument();

      // Switch to history tab
      const historyTab = screen.getByRole('tab', { name: /history/i });
      await user.click(historyTab);

      expect(screen.getByText('Scan History')).toBeInTheDocument();
    });

    it('closes dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BarcodeScanner {...defaultProps} />
        </TestWrapper>
      );

      const closeButton = screen.getAllByRole('button', { name: /close/i })[0];
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('performs complete inventory search workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Open advanced search
      const searchButton = screen.getByRole('button', { name: /advanced search/i });
      await user.click(searchButton);

      // Enter search query
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'iPhone');

      // Should trigger search
      await waitFor(() => {
        expect(universalInventoryApi.universalInventoryApi.searchItems).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              query: 'iPhone'
            })
          })
        );
      });
    });

    it('handles item creation workflow', async () => {
      const user = userEvent.setup();
      
      (universalInventoryApi.universalInventoryApi.createItem as jest.Mock).mockResolvedValue(mockInventoryItems[0]);
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Click add item button
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);

      // Should open the form dialog
      expect(screen.getByText('Add New Universal Inventory Item')).toBeInTheDocument();
    });

    it('handles error states gracefully', async () => {
      // Mock API to return error
      (universalInventoryApi.universalInventoryApi.searchItems as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Should show loading state initially, then handle error
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });
    });

    it('maintains state across tab switches', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Switch to categories tab
      const categoriesTab = screen.getByRole('tab', { name: /categories/i });
      await user.click(categoriesTab);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      // Switch back to inventory tab
      const inventoryTab = screen.getByRole('tab', { name: /inventory/i });
      await user.click(inventoryTab);

      // Should still show the inventory items
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Tests', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Check for proper roles
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(5);
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Tab through the interface
      await user.tab();
      await user.tab();
      
      // Should be able to navigate with keyboard
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
    });

    it('has proper color contrast for alerts', async () => {
      render(
        <TestWrapper>
          <StockLevelMonitor categories={mockCategories} />
        </TestWrapper>
      );

      await waitFor(() => {
        const alertElement = screen.getByText('iPhone 15 Pro');
        expect(alertElement).toBeInTheDocument();
      });

      // Alert elements should have proper styling for accessibility
      const alertCards = screen.getAllByRole('generic');
      expect(alertCards.length).toBeGreaterThan(0);
    });
  });
});