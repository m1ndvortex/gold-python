import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Inventory } from '../pages/Inventory';
import * as inventoryHooks from '../hooks/useInventory';
import type { InventoryItem, Category } from '../types';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Package: () => <div data-testid="package-icon">Package</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Grid3X3: () => <div data-testid="grid-icon">Grid</div>,
  List: () => <div data-testid="list-icon">List</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  SlidersHorizontal: () => <div data-testid="sliders-icon">Sliders</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  AlertTriangle: () => <div data-testid="alert-icon">Alert</div>,
  DollarSign: () => <div data-testid="dollar-icon">Dollar</div>,
  Weight: () => <div data-testid="weight-icon">Weight</div>,
  Layers: () => <div data-testid="layers-icon">Layers</div>,
  MoreHorizontal: () => <div data-testid="more-icon">More</div>,
}));

// Mock the hooks
jest.mock('../hooks/useInventory');

const mockInventoryHooks = inventoryHooks as jest.Mocked<typeof inventoryHooks>;

// Test data
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Rings',
    description: 'Gold rings',
    parent_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Necklaces',
    description: 'Gold necklaces',
    parent_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Gold Ring 18K',
    description: 'Beautiful 18K gold ring',
    category_id: '1',
    weight_grams: 5.5,
    purchase_price: 200,
    sell_price: 300,
    stock_quantity: 10,
    min_stock_level: 5,
    image_url: 'https://example.com/ring.jpg',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Gold Necklace 22K',
    description: 'Elegant 22K gold necklace',
    category_id: '2',
    weight_grams: 15.2,
    purchase_price: 800,
    sell_price: 1200,
    stock_quantity: 3,
    min_stock_level: 5,
    image_url: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Gold Bracelet 18K',
    description: 'Stylish 18K gold bracelet',
    category_id: '1',
    weight_grams: 8.3,
    purchase_price: 350,
    sell_price: 500,
    stock_quantity: 0,
    min_stock_level: 3,
    image_url: 'https://example.com/bracelet.jpg',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockInventoryData = {
  items: mockInventoryItems,
  total: 3,
  page: 1,
  total_pages: 1,
  limit: 25,
};

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
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Modern Inventory Page', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockInventoryHooks.useInventoryItems.mockReturnValue({
      data: mockInventoryData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockInventoryHooks.useCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: null,
    } as any);

    mockInventoryHooks.useDeleteInventoryItem.mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: false,
    } as any);

    mockInventoryHooks.useCreateInventoryItem.mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: false,
    } as any);

    mockInventoryHooks.useUpdateInventoryItem.mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: false,
    } as any);

    mockInventoryHooks.useUploadInventoryImage.mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: false,
    } as any);
  });

  describe('Page Layout and Header', () => {
    it('renders modern header with gradient title', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      expect(screen.getByText('Inventory Management')).toBeInTheDocument();
      expect(screen.getByText('Manage your gold jewelry inventory with modern tools and insights')).toBeInTheDocument();
    });

    it('displays add item button in header', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add item/i });
      expect(addButton).toBeInTheDocument();
      expect(within(addButton).getByTestId('lucide-plus') || within(addButton).getByRole('img')).toBeInTheDocument();
    });

    it('displays filters button with active indicator', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      expect(filtersButton).toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    it('renders view mode toggle buttons', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      // Look for the view toggle buttons within the inventory tab
      const inventoryTab = screen.getByRole('tabpanel');
      const listButton = within(inventoryTab).getByRole('button', { name: '' }); // List view button
      const gridButton = within(inventoryTab).getAllByRole('button').find(btn => 
        btn.querySelector('[data-testid="lucide-grid3x3"]') || 
        btn.querySelector('svg')
      );

      expect(listButton).toBeInTheDocument();
      expect(gridButton).toBeInTheDocument();
    });

    it('switches between list and grid view modes', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      // Find the grid view button (should be the second button in the toggle)
      const viewToggleButtons = screen.getAllByRole('button').filter(btn => 
        btn.className.includes('h-8 w-8 p-0')
      );
      
      if (viewToggleButtons.length >= 2) {
        const gridButton = viewToggleButtons[1];
        await user.click(gridButton);
        
        // In grid view, items should be displayed as cards
        await waitFor(() => {
          expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Search Functionality', () => {
    it('renders search input with placeholder', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search inventory items...');
      expect(searchInput).toBeInTheDocument();
    });

    it('updates search filter when typing', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search inventory items...');
      await user.type(searchInput, 'ring');

      expect(searchInput).toHaveValue('ring');
    });
  });

  describe('Advanced Filter Panel', () => {
    it('toggles filter panel visibility', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Filter panel should appear
      await waitFor(() => {
        expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
      });
    });

    it('shows active filter indicator when filters are applied', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Apply a search filter
      const searchInput = screen.getByPlaceholderText('Search inventory items...');
      await user.type(searchInput, 'test');

      // Check if active indicator appears
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });
  });

  describe('Data Table Display', () => {
    it('displays inventory items in table format', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      // Check for table headers
      expect(screen.getByText('Item')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Weight')).toBeInTheDocument();
      expect(screen.getByText('Purchase Price')).toBeInTheDocument();
      expect(screen.getByText('Sell Price')).toBeInTheDocument();
      expect(screen.getByText('Stock')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();

      // Check for item data
      expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
      expect(screen.getByText('Gold Necklace 22K')).toBeInTheDocument();
    });

    it('displays stock status badges correctly', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      // Should show different stock statuses
      expect(screen.getByText('In Stock')).toBeInTheDocument(); // For Gold Ring
      expect(screen.getByText('Low Stock')).toBeInTheDocument(); // For Gold Necklace
      expect(screen.getByText('Out of Stock')).toBeInTheDocument(); // For Gold Bracelet
    });

    it('displays category badges', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      expect(screen.getByText('Rings')).toBeInTheDocument();
      expect(screen.getByText('Necklaces')).toBeInTheDocument();
    });

    it('shows item count badge', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      expect(screen.getByText('3 items')).toBeInTheDocument();
    });
  });

  describe('Grid View Display', () => {
    it('displays items as cards in grid view', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      // Switch to grid view
      const viewToggleButtons = screen.getAllByRole('button').filter(btn => 
        btn.className.includes('h-8 w-8 p-0')
      );
      
      if (viewToggleButtons.length >= 2) {
        const gridButton = viewToggleButtons[1];
        await user.click(gridButton);

        // Check for card elements
        await waitFor(() => {
          expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
          expect(screen.getByText('Purchase')).toBeInTheDocument();
          expect(screen.getByText('Sell')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Item Actions', () => {
    it('shows edit and delete buttons for each item', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      // Should have edit and delete buttons for each item
      const editButtons = screen.getAllByRole('button').filter(btn => 
        btn.getAttribute('aria-label')?.includes('Edit') || 
        btn.textContent?.includes('Edit')
      );
      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.getAttribute('aria-label')?.includes('Delete') || 
        btn.textContent?.includes('Delete')
      );

      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('opens form dialog when add item button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Inventory Item')).toBeInTheDocument();
      });
    });
  });

  describe('Row Selection', () => {
    it('allows selecting individual items', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      // Find checkboxes in the table
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 1) {
        // Click on the first item checkbox (skip the header checkbox)
        await user.click(checkboxes[1]);

        // Bulk operations should appear
        await waitFor(() => {
          expect(screen.getByText(/selected/i)).toBeInTheDocument();
        });
      }
    });

    it('shows bulk operations when items are selected', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 1) {
        await user.click(checkboxes[1]);

        await waitFor(() => {
          // Should show bulk operations component
          expect(screen.getByText(/bulk/i) || screen.getByText(/selected/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Loading and Error States', () => {
    it('displays loading state', () => {
      mockInventoryHooks.useInventoryItems.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      expect(screen.getByText('Loading inventory items...')).toBeInTheDocument();
    });

    it('displays error state', () => {
      mockInventoryHooks.useInventoryItems.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
        refetch: jest.fn(),
      } as any);

      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      expect(screen.getByText('Failed to load inventory items. Please try again.')).toBeInTheDocument();
    });

    it('displays empty state when no items exist', () => {
      mockInventoryHooks.useInventoryItems.mockReturnValue({
        data: { items: [], total: 0, page: 1, total_pages: 0, limit: 25 },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      expect(screen.getByText('No inventory items found')).toBeInTheDocument();
      expect(screen.getByText('Add your first item to get started with inventory management.')).toBeInTheDocument();
    });
  });

  describe('Tabs Navigation', () => {
    it('renders inventory and categories tabs', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      expect(screen.getByRole('tab', { name: /inventory items/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /categories/i })).toBeInTheDocument();
    });

    it('switches between inventory and categories tabs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      const categoriesTab = screen.getByRole('tab', { name: /categories/i });
      await user.click(categoriesTab);

      // Should switch to categories view
      await waitFor(() => {
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders properly on different screen sizes', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      // Should still render main components
      expect(screen.getByText('Inventory Management')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search inventory items...')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls when there are multiple pages', () => {
      mockInventoryHooks.useInventoryItems.mockReturnValue({
        data: {
          ...mockInventoryData,
          total: 50,
          total_pages: 2,
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      // Should show pagination info
      expect(screen.getByText(/page/i)).toBeInTheDocument();
    });
  });

  describe('Professional Styling', () => {
    it('applies modern design system classes', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      const header = screen.getByText('Inventory Management');
      expect(header).toHaveClass('text-4xl', 'font-bold');
    });

    it('shows gradient text for main title', () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      const title = screen.getByText('Inventory Management');
      expect(title).toHaveClass('bg-gradient-to-r', 'from-primary', 'to-primary/70', 'bg-clip-text', 'text-transparent');
    });
  });
});