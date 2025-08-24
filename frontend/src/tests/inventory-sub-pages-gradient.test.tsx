import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
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

  window.history.pushState({}, 'Test page', initialRoute);

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Inventory Sub-Pages Gradient Styling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Products page has gradient styling', async () => {
    renderWithProviders(<InventoryWithRouting />, '/products');

    await waitFor(() => {
      // Check for gradient header icon
      const headerIcon = document.querySelector('.bg-gradient-to-br.from-blue-500.to-indigo-600');
      expect(headerIcon).toBeInTheDocument();

      // Check for gradient title text
      const title = screen.getByText('Product Management');
      expect(title).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-indigo-600', 'bg-clip-text', 'text-transparent');

      // Check for gradient card background
      const gradientCard = document.querySelector('.bg-gradient-to-br.from-blue-50.to-blue-100\\/50');
      expect(gradientCard).toBeInTheDocument();

      // Check that InventoryList component is rendered
      expect(screen.getByTestId('inventory-list')).toBeInTheDocument();
    });
  });

  test('Categories page has gradient styling', async () => {
    renderWithProviders(<InventoryWithRouting />, '/categories');

    await waitFor(() => {
      // Check for gradient header icon
      const headerIcon = document.querySelector('.bg-gradient-to-br.from-green-500.to-teal-600');
      expect(headerIcon).toBeInTheDocument();

      // Check for gradient title text
      const title = screen.getByText('Category Management');
      expect(title).toHaveClass('bg-gradient-to-r', 'from-green-600', 'to-teal-600', 'bg-clip-text', 'text-transparent');

      // Check for gradient card background
      const gradientCard = document.querySelector('.bg-gradient-to-br.from-green-50.to-green-100\\/50');
      expect(gradientCard).toBeInTheDocument();

      // Check that CategoryManager component is rendered
      expect(screen.getByTestId('category-manager')).toBeInTheDocument();
    });
  });

  test('Bulk operations page has gradient styling', async () => {
    renderWithProviders(<InventoryWithRouting />, '/bulk');

    await waitFor(() => {
      // Check for gradient header icon
      const headerIcon = document.querySelector('.bg-gradient-to-br.from-purple-500.to-violet-600');
      expect(headerIcon).toBeInTheDocument();

      // Check for gradient title text
      const title = screen.getByText('Bulk Operations');
      expect(title).toHaveClass('bg-gradient-to-r', 'from-purple-600', 'to-violet-600', 'bg-clip-text', 'text-transparent');

      // Check for gradient card background
      const gradientCard = document.querySelector('.bg-gradient-to-br.from-purple-50.to-purple-100\\/50');
      expect(gradientCard).toBeInTheDocument();

      // Check that BulkInventoryOperations component is rendered
      expect(screen.getByTestId('bulk-operations')).toBeInTheDocument();
    });
  });

  test('Images page has gradient styling', async () => {
    renderWithProviders(<InventoryWithRouting />, '/images');

    await waitFor(() => {
      // Check for gradient header icon
      const headerIcon = document.querySelector('.bg-gradient-to-br.from-pink-500.to-rose-600');
      expect(headerIcon).toBeInTheDocument();

      // Check for gradient title text
      const title = screen.getByText('Image Management');
      expect(title).toHaveClass('bg-gradient-to-r', 'from-pink-600', 'to-rose-600', 'bg-clip-text', 'text-transparent');

      // Check for gradient card background
      const gradientCard = document.querySelector('.bg-gradient-to-br.from-purple-50.to-purple-100\\/50');
      expect(gradientCard).toBeInTheDocument();

      // Check that ImageManagement component is rendered
      expect(screen.getByTestId('image-management')).toBeInTheDocument();
    });
  });

  test('All sub-pages have consistent gradient styling patterns', async () => {
    const routes = [
      { path: '/products', expectedGradient: 'blue' },
      { path: '/categories', expectedGradient: 'green' },
      { path: '/bulk', expectedGradient: 'purple' },
      { path: '/images', expectedGradient: 'pink' },
    ];

    for (const route of routes) {
      const { unmount } = renderWithProviders(<InventoryWithRouting />, route.path);

      await waitFor(() => {
        // Check for consistent header structure
        const headerContainer = document.querySelector('.flex.items-center.gap-4.mb-6');
        expect(headerContainer).toBeInTheDocument();

        // Check for icon container with shadow
        const iconContainer = document.querySelector('.h-12.w-12.rounded-lg.shadow-lg');
        expect(iconContainer).toBeInTheDocument();

        // Check for gradient title
        const gradientTitle = document.querySelector('.text-4xl.font-bold.bg-gradient-to-r.bg-clip-text.text-transparent');
        expect(gradientTitle).toBeInTheDocument();

        // Check for card with shadow
        const shadowCard = document.querySelector('.shadow-lg');
        expect(shadowCard).toBeInTheDocument();
      });

      unmount();
    }
  });

  test('Sub-pages have proper responsive design', async () => {
    renderWithProviders(<InventoryWithRouting />, '/products');

    await waitFor(() => {
      // Check for container with responsive padding
      const container = document.querySelector('.container.mx-auto.p-6.space-y-6');
      expect(container).toBeInTheDocument();

      // Check for responsive header layout
      const header = document.querySelector('.flex.items-center.gap-4');
      expect(header).toBeInTheDocument();
    });
  });

  test('Sub-pages have proper animation setup', async () => {
    renderWithProviders(<InventoryWithRouting />, '/categories');

    await waitFor(() => {
      // Check that motion.div elements are rendered (mocked as regular divs)
      const animatedElements = document.querySelectorAll('div[initial]');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });
});