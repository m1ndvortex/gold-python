import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Inventory } from '../pages/Inventory';

// Mock axios
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

// Mock the image management API
jest.mock('../services/imageManagementApi', () => ({
  imageManagementApi: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the hooks
jest.mock('../hooks/useInventory', () => ({
  useInventoryItems: () => ({
    data: {
      items: [
        {
          id: '1',
          name: 'Gold Ring',
          description: 'Beautiful gold ring',
          category_id: 'cat1',
          weight_grams: 5.5,
          purchase_price: 100,
          sell_price: 150,
          stock_quantity: 10,
          min_stock_level: 5,
          image_url: null,
        },
        {
          id: '2',
          name: 'Silver Necklace',
          description: 'Elegant silver necklace',
          category_id: 'cat2',
          weight_grams: 12.3,
          purchase_price: 80,
          sell_price: 120,
          stock_quantity: 2,
          min_stock_level: 5,
          image_url: 'https://example.com/necklace.jpg',
        },
      ],
      total: 2,
      total_pages: 1,
    },
    isLoading: false,
    error: null,
  }),
  useCategories: () => ({
    data: [
      { id: 'cat1', name: 'Rings' },
      { id: 'cat2', name: 'Necklaces' },
    ],
  }),
  useDeleteInventoryItem: () => ({
    mutateAsync: jest.fn(),
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

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

describe('Inventory Gradient Styling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders header with gradient icon container', async () => {
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check for gradient icon container in header
    const headerIcon = document.querySelector('.bg-gradient-to-br.from-green-500.to-teal-600');
    expect(headerIcon).toBeInTheDocument();
  });

  test('renders gradient title text', async () => {
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check for gradient title
    const title = screen.getByText('Inventory Management');
    expect(title).toHaveClass('bg-gradient-to-r', 'from-green-600', 'to-teal-600', 'bg-clip-text', 'text-transparent');
  });

  test('renders gradient buttons in header', async () => {
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check for gradient Add Item button
    const addButton = screen.getByRole('button', { name: /add item/i });
    expect(addButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');

    // Check for outline gradient Filters button
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    expect(filtersButton).toHaveClass('border-2', 'border-transparent', 'bg-gradient-to-r');
  });

  test('renders gradient tab navigation', async () => {
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check for gradient tab list
    const tabsList = document.querySelector('[role="tablist"]');
    expect(tabsList).toHaveClass('bg-gradient-to-r', 'from-green-50', 'via-teal-50', 'to-blue-50');

    // Check for gradient tab triggers
    const inventoryTab = screen.getByRole('tab', { name: /inventory items/i });
    expect(inventoryTab).toHaveClass('data-[state=active]:border-2', 'data-[state=active]:border-green-300');
  });

  test('renders filter card with gradient background', async () => {
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check for filter card with gradient background
    const filterCard = document.querySelector('.bg-gradient-to-r.from-slate-50.to-slate-100\\/80');
    expect(filterCard).toBeInTheDocument();
  });

  test('renders professional cards for content', async () => {
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check for professional card variant
    const professionalCard = document.querySelector('.shadow-lg.bg-white.hover\\:shadow-xl');
    expect(professionalCard).toBeInTheDocument();
  });

  test('renders gradient product cards in grid view', async () => {
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Switch to grid view
    const gridButton = screen.getByRole('button', { name: '' }); // Grid icon button
    const gridButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.classList.contains('h-8')
    );
    
    if (gridButtons.length >= 2) {
      fireEvent.click(gridButtons[1]); // Assuming second button is grid view
    }

    await waitFor(() => {
      // Check for gradient product cards
      const gradientCards = document.querySelectorAll('.bg-gradient-to-br.from-green-50.to-green-100\\/50');
      expect(gradientCards.length).toBeGreaterThan(0);
    });
  });

  test('renders gradient loading state', async () => {
    // Mock loading state
    const mockUseInventoryItems = require('../hooks/useInventory').useInventoryItems;
    mockUseInventoryItems.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check for gradient loading spinner
    const loadingSpinner = document.querySelector('.animate-spin.border-2.border-transparent.bg-gradient-to-r');
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('renders gradient error state', async () => {
    // Mock error state
    const mockUseInventoryItems = require('../hooks/useInventory').useInventoryItems;
    mockUseInventoryItems.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check for gradient error icon
    const errorIcon = document.querySelector('.bg-gradient-to-br.from-red-500.to-red-600');
    expect(errorIcon).toBeInTheDocument();
  });

  test('renders gradient empty state', async () => {
    // Mock empty state
    const mockUseInventoryItems = require('../hooks/useInventory').useInventoryItems;
    mockUseInventoryItems.mockReturnValue({
      data: { items: [], total: 0, total_pages: 0 },
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check for gradient empty state icon
    const emptyIcon = document.querySelector('.bg-gradient-to-br.from-green-500.to-teal-600');
    expect(emptyIcon).toBeInTheDocument();

    // Check for gradient Add First Item button
    const addFirstButton = screen.getByRole('button', { name: /add first item/i });
    expect(addFirstButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
  });

  test('view mode buttons have gradient styling when active', async () => {
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    // Check that active view mode button has gradient styling
    const viewButtons = screen.getAllByRole('button').filter(btn => 
      btn.classList.contains('h-8') && btn.classList.contains('w-8')
    );

    // List view should be active by default
    const activeButton = viewButtons.find(btn => 
      btn.classList.contains('bg-gradient-to-r')
    );
    expect(activeButton).toBeInTheDocument();
  });

  test('search input has enhanced styling', async () => {
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search inventory items...');
    expect(searchInput).toHaveClass('border-0', 'bg-white/80', 'shadow-sm');
  });

  test('badge has enhanced styling', async () => {
    render(
      <TestWrapper>
        <Inventory />
      </TestWrapper>
    );

    const itemsBadge = screen.getByText('2 items');
    expect(itemsBadge).toHaveClass('bg-white/80', 'shadow-sm');
  });
});