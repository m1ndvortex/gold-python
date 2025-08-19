import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import * as inventoryHooks from '../hooks/useInventory';
import type { InventoryItem, Category } from '../types';

// Mock all external dependencies
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

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('../hooks/useInventory');

// Mock UI components to avoid complex dependency issues
jest.mock('../components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

jest.mock('../components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock('../components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// Mock complex components
jest.mock('../components/ui/data-table', () => ({
  DataTable: ({ data, columns }: any) => (
    <div data-testid="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((col: any) => (
              <th key={col.id}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item: any, index: number) => (
            <tr key={index}>
              {columns.map((col: any) => (
                <td key={col.id}>
                  {col.cell ? col.cell({ row: item, value: item[col.accessorKey] }) : item[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}));

jest.mock('../components/inventory/AdvancedFilterPanel', () => ({
  AdvancedFilterPanel: ({ isOpen }: any) => 
    isOpen ? <div data-testid="filter-panel">Advanced Filters</div> : null,
}));

jest.mock('../components/inventory/InventoryItemForm', () => ({
  InventoryItemForm: ({ item, onClose }: any) => (
    <div data-testid="inventory-form">
      <h2>{item ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('../components/inventory/CategoryManager', () => ({
  CategoryManager: () => <div data-testid="category-manager">Category Manager</div>,
}));

jest.mock('../components/inventory/BulkInventoryOperations', () => ({
  BulkInventoryOperations: ({ selectedItems }: any) => (
    <div data-testid="bulk-operations">
      Bulk Operations ({selectedItems.length} selected)
    </div>
  ),
}));

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
];

const mockInventoryData = {
  items: mockInventoryItems,
  total: 1,
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

describe('Modern Inventory Page Redesign', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  it('successfully loads the modern inventory page', async () => {
    // Import the component after mocks are set up
    const { Inventory } = await import('../pages/Inventory');
    
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check that the modern header is rendered
    expect(screen.getByText('Inventory Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your gold jewelry inventory with modern tools and insights')).toBeInTheDocument();
  });

  it('displays modern interface elements', async () => {
    const { Inventory } = await import('../pages/Inventory');
    
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check for modern UI elements
    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search inventory items...')).toBeInTheDocument();
  });

  it('shows inventory items in modern data table', async () => {
    const { Inventory } = await import('../pages/Inventory');
    
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check that the data table is rendered
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
  });

  it('displays tabs for inventory and categories', async () => {
    const { Inventory } = await import('../pages/Inventory');
    
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check for tab navigation - use getAllByText since there are multiple instances
    expect(screen.getAllByText('Inventory Items')).toHaveLength(2); // Tab and card title
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('handles loading state properly', async () => {
    mockInventoryHooks.useInventoryItems.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    const { Inventory } = await import('../pages/Inventory');
    
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    expect(screen.getByText('Loading inventory items...')).toBeInTheDocument();
  });

  it('handles error state properly', async () => {
    mockInventoryHooks.useInventoryItems.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: jest.fn(),
    } as any);

    const { Inventory } = await import('../pages/Inventory');
    
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    expect(screen.getByText('Failed to load inventory items. Please try again.')).toBeInTheDocument();
  });

  it('displays empty state when no items exist', async () => {
    mockInventoryHooks.useInventoryItems.mockReturnValue({
      data: { items: [], total: 0, page: 1, total_pages: 0, limit: 25 },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    const { Inventory } = await import('../pages/Inventory');
    
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    expect(screen.getByText('No inventory items found')).toBeInTheDocument();
    expect(screen.getByText('Add your first item to get started with inventory management.')).toBeInTheDocument();
  });

  it('shows item count badge', async () => {
    const { Inventory } = await import('../pages/Inventory');
    
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    expect(screen.getByText('1 items')).toBeInTheDocument();
  });
});