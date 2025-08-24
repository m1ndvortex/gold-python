import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InventoryWithRouting } from '../pages/Inventory';

// Mock the hooks
jest.mock('../hooks/useInventory', () => ({
  useInventoryItems: () => ({
    data: {
      items: [
        {
          id: '1',
          name: 'Test Gold Ring',
          description: 'Beautiful gold ring',
          category_id: 'cat1',
          weight_grams: 5.5,
          purchase_price: 100,
          sell_price: 150,
          stock_quantity: 10,
          min_stock_level: 5,
          image_url: null,
        }
      ],
      total: 1,
      total_pages: 1,
    },
    isLoading: false,
    error: null,
  }),
  useCategories: () => ({
    data: [
      { id: 'cat1', name: 'Rings', description: 'Ring category' }
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

// Mock components
jest.mock('../components/inventory/InventoryList', () => ({
  InventoryList: () => <div data-testid="inventory-list">Inventory List Component</div>,
}));

jest.mock('../components/inventory/CategoryManager', () => ({
  CategoryManager: () => <div data-testid="category-manager">Category Manager Component</div>,
}));

jest.mock('../components/inventory/BulkInventoryOperations', () => ({
  BulkInventoryOperations: () => <div data-testid="bulk-operations">Bulk Operations Component</div>,
}));

jest.mock('../pages/ImageManagement', () => ({
  __esModule: true,
  default: () => <div data-testid="image-management">Image Management Component</div>,
}));

const renderWithProviders = (component: React.ReactElement, initialRoute = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Inventory Sub-Pages Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Products route renders with correct gradient styling', async () => {
    renderWithProviders(<InventoryWithRouting />, '/products');

    await waitFor(() => {
      // Check for the page title
      expect(screen.getByText('Product Management')).toBeInTheDocument();
      
      // Check for the component
      expect(screen.getByTestId('inventory-list')).toBeInTheDocument();
      
      // Check for gradient styling classes
      const titleElement = screen.getByText('Product Management');
      expect(titleElement).toHaveClass('text-4xl', 'font-bold', 'bg-gradient-to-r', 'from-blue-600', 'to-indigo-600');
    });
  });

  test('Categories route renders with correct gradient styling', async () => {
    renderWithProviders(<InventoryWithRouting />, '/categories');

    await waitFor(() => {
      // Check for the page title
      expect(screen.getByText('Category Management')).toBeInTheDocument();
      
      // Check for the component
      expect(screen.getByTestId('category-manager')).toBeInTheDocument();
      
      // Check for gradient styling classes
      const titleElement = screen.getByText('Category Management');
      expect(titleElement).toHaveClass('text-4xl', 'font-bold', 'bg-gradient-to-r', 'from-green-600', 'to-teal-600');
    });
  });

  test('Bulk operations route renders with correct gradient styling', async () => {
    renderWithProviders(<InventoryWithRouting />, '/bulk');

    await waitFor(() => {
      // Check for the page title
      expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
      
      // Check for the component
      expect(screen.getByTestId('bulk-operations')).toBeInTheDocument();
      
      // Check for gradient styling classes
      const titleElement = screen.getByText('Bulk Operations');
      expect(titleElement).toHaveClass('text-4xl', 'font-bold', 'bg-gradient-to-r', 'from-purple-600', 'to-violet-600');
    });
  });

  test('Images route renders with correct gradient styling', async () => {
    renderWithProviders(<InventoryWithRouting />, '/images');

    await waitFor(() => {
      // Check for the page title
      expect(screen.getByText('Image Management')).toBeInTheDocument();
      
      // Check for the component
      expect(screen.getByTestId('image-management')).toBeInTheDocument();
      
      // Check for gradient styling classes
      const titleElement = screen.getByText('Image Management');
      expect(titleElement).toHaveClass('text-4xl', 'font-bold', 'bg-gradient-to-r', 'from-pink-600', 'to-rose-600');
    });
  });

  test('All sub-pages have consistent structure and styling', async () => {
    const routes = [
      { path: '/products', title: 'Product Management' },
      { path: '/categories', title: 'Category Management' },
      { path: '/bulk', title: 'Bulk Operations' },
      { path: '/images', title: 'Image Management' },
    ];

    for (const route of routes) {
      const { unmount } = renderWithProviders(<InventoryWithRouting />, route.path);

      await waitFor(() => {
        // Check for consistent title structure
        const title = screen.getByText(route.title);
        expect(title).toBeInTheDocument();
        expect(title).toHaveClass('text-4xl', 'font-bold', 'bg-gradient-to-r', 'bg-clip-text', 'text-transparent');

        // Check for container structure
        const container = document.querySelector('.container.mx-auto.p-6.space-y-6');
        expect(container).toBeInTheDocument();

        // Check for header with icon and title
        const headerContainer = document.querySelector('.flex.items-center.gap-4.mb-6');
        expect(headerContainer).toBeInTheDocument();

        // Check for icon container with gradient background
        const iconContainer = document.querySelector('.h-12.w-12.rounded-lg.shadow-lg');
        expect(iconContainer).toBeInTheDocument();
      });

      unmount();
    }
  });

  test('Sub-pages have proper responsive design classes', async () => {
    renderWithProviders(<InventoryWithRouting />, '/products');

    await waitFor(() => {
      // Check for responsive container
      const container = document.querySelector('.container.mx-auto.p-6.space-y-6');
      expect(container).toBeInTheDocument();

      // Check for responsive header layout
      const header = document.querySelector('.flex.items-center.gap-4');
      expect(header).toBeInTheDocument();
    });
  });

  test('Sub-pages have proper card styling', async () => {
    renderWithProviders(<InventoryWithRouting />, '/categories');

    await waitFor(() => {
      // Check for card with gradient background
      const gradientCard = document.querySelector('.bg-gradient-to-br');
      expect(gradientCard).toBeInTheDocument();

      // Check for shadow styling
      const shadowCard = document.querySelector('.shadow-lg');
      expect(shadowCard).toBeInTheDocument();
    });
  });
});