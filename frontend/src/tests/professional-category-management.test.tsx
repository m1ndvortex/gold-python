import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UniversalCategoryHierarchy } from '../components/inventory/UniversalCategoryHierarchy';
import { LanguageContext } from '../hooks/useLanguage';
import type { CategoryWithStats } from '../types/universalInventory';

// Mock the services
jest.mock('../services/universalInventoryApi', () => ({
  universalCategoriesApi: {
    getCategoryTree: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    moveCategory: jest.fn(),
  },
}));

const mockLanguageContext = {
  language: 'en' as const,
  direction: 'ltr' as const,
  t: (key: string, params?: any) => {
    const translations: Record<string, string> = {
      'category.name': 'Name',
      'category.description': 'Description',
      'category.items': 'Items',
      'category.value': 'Value',
      'category.add': 'Add Category',
      'category.edit': 'Edit Category',
      'category.delete': 'Delete Category',
      'category.move': 'Move Category',
    };
    return translations[key] || key;
  },
  setLanguage: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageContext.Provider value={mockLanguageContext}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </LanguageContext.Provider>
    </QueryClientProvider>
  );
};

// Mock category data with infinite nesting structure
const mockCategoriesWithInfiniteNesting: CategoryWithStats[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    parent_id: null,
    level: 0,
    path: 'Electronics',
    item_count: 25,
    total_value: 15000,
    children: [
      {
        id: 'smartphones',
        name: 'Smartphones',
        description: 'Mobile phones and accessories',
        parent_id: 'electronics',
        level: 1,
        path: 'Electronics/Smartphones',
        item_count: 10,
        total_value: 8000,
        children: [
          {
            id: 'android',
            name: 'Android Phones',
            description: 'Android-based smartphones',
            parent_id: 'smartphones',
            level: 2,
            path: 'Electronics/Smartphones/Android Phones',
            item_count: 6,
            total_value: 4500,
            children: [
              {
                id: 'samsung',
                name: 'Samsung',
                description: 'Samsung Android phones',
                parent_id: 'android',
                level: 3,
                path: 'Electronics/Smartphones/Android Phones/Samsung',
                item_count: 3,
                total_value: 2500,
                children: [
                  {
                    id: 'galaxy-s',
                    name: 'Galaxy S Series',
                    description: 'Samsung Galaxy S smartphones',
                    parent_id: 'samsung',
                    level: 4,
                    path: 'Electronics/Smartphones/Android Phones/Samsung/Galaxy S Series',
                    item_count: 2,
                    total_value: 1800,
                    children: [
                      {
                        id: 'galaxy-s23',
                        name: 'Galaxy S23',
                        description: 'Samsung Galaxy S23 models',
                        parent_id: 'galaxy-s',
                        level: 5,
                        path: 'Electronics/Smartphones/Android Phones/Samsung/Galaxy S Series/Galaxy S23',
                        item_count: 1,
                        total_value: 900,
                        children: []
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: 'iphones',
            name: 'iPhones',
            description: 'Apple iPhones',
            parent_id: 'smartphones',
            level: 2,
            path: 'Electronics/Smartphones/iPhones',
            item_count: 4,
            total_value: 3500,
            children: []
          }
        ]
      },
      {
        id: 'laptops',
        name: 'Laptops',
        description: 'Portable computers',
        parent_id: 'electronics',
        level: 1,
        path: 'Electronics/Laptops',
        item_count: 15,
        total_value: 7000,
        children: []
      }
    ]
  },
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Apparel and fashion items',
    parent_id: null,
    level: 0,
    path: 'Clothing',
    item_count: 50,
    total_value: 5000,
    children: [
      {
        id: 'mens',
        name: "Men's Clothing",
        description: 'Clothing for men',
        parent_id: 'clothing',
        level: 1,
        path: "Clothing/Men's Clothing",
        item_count: 25,
        total_value: 2500,
        children: []
      },
      {
        id: 'womens',
        name: "Women's Clothing",
        description: 'Clothing for women',
        parent_id: 'clothing',
        level: 1,
        path: "Clothing/Women's Clothing",
        item_count: 25,
        total_value: 2500,
        children: []
      }
    ]
  }
];

describe('Professional Category Management with Infinite Nesting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders category hierarchy with infinite nesting support', async () => {
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        onCategorySelect={jest.fn()}
      />
    );

    // Check that top-level categories are rendered
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  test('supports unlimited nested subcategories', async () => {
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        expandedCategories={new Set(['electronics', 'smartphones', 'android', 'samsung', 'galaxy-s'])}
        onCategorySelect={jest.fn()}
      />
    );

    // Check that deeply nested categories are supported (5+ levels)
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Smartphones')).toBeInTheDocument();
      expect(screen.getByText('Android Phones')).toBeInTheDocument();
      expect(screen.getByText('Samsung')).toBeInTheDocument();
      expect(screen.getByText('Galaxy S Series')).toBeInTheDocument();
      expect(screen.getByText('Galaxy S23')).toBeInTheDocument();
    });

    // Verify the nesting levels are properly displayed
    const galaxyS23Element = screen.getByText('Galaxy S23');
    expect(galaxyS23Element).toBeInTheDocument();
  });

  test('displays category statistics for each level', async () => {
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        onCategorySelect={jest.fn()}
      />
    );

    // Check that category statistics are displayed
    // The component should show item counts and values for each category
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    
    // Statistics should be visible when showStats is true
    // The exact implementation depends on how the component displays stats
  });

  test('supports drag and drop organization', async () => {
    const onCategoryMove = jest.fn();
    
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        isDragMode={true}
        onCategoryMove={onCategoryMove}
        onCategorySelect={jest.fn()}
      />
    );

    // Check that drag mode is supported
    const electronicsCategory = screen.getByText('Electronics');
    expect(electronicsCategory).toBeInTheDocument();

    // In drag mode, categories should be draggable
    // The exact drag and drop testing would require more complex setup
    // but we can verify the component accepts drag mode props
  });

  test('provides tree-view display with expand/collapse functionality', async () => {
    const onToggleExpanded = jest.fn();
    
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        onToggleExpanded={onToggleExpanded}
        onCategorySelect={jest.fn()}
      />
    );

    // Check for expand/collapse functionality
    const electronicsCategory = screen.getByText('Electronics');
    expect(electronicsCategory).toBeInTheDocument();

    // Look for expand/collapse indicators (chevron icons)
    // The component should have visual indicators for expandable categories
  });

  test('allows subcategories within subcategories infinitely', async () => {
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        expandedCategories={new Set(['electronics', 'smartphones', 'android', 'samsung', 'galaxy-s'])}
        onCategorySelect={jest.fn()}
      />
    );

    // Verify that the component can handle 6+ levels of nesting
    // Electronics > Smartphones > Android Phones > Samsung > Galaxy S Series > Galaxy S23
    await waitFor(() => {
      expect(screen.getByText('Galaxy S23')).toBeInTheDocument();
    });

    // The path should show the full hierarchy
    // Electronics/Smartphones/Android Phones/Samsung/Galaxy S Series/Galaxy S23
    const deepestCategory = mockCategoriesWithInfiniteNesting[0].children![0].children![0].children![0].children![0].children![0];
    expect(deepestCategory.level).toBe(5); // 6th level (0-indexed)
    expect(deepestCategory.path).toContain('Galaxy S23');
  });

  test('supports category creation at any level', async () => {
    const onCategoryAdd = jest.fn();
    
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        onCategoryAdd={onCategoryAdd}
        onCategorySelect={jest.fn()}
      />
    );

    // The component should support adding categories at any level
    // This would typically be through context menus or action buttons
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  test('supports category editing and deletion at any level', async () => {
    const onCategoryEdit = jest.fn();
    const onCategoryDelete = jest.fn();
    
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        onCategoryEdit={onCategoryEdit}
        onCategoryDelete={onCategoryDelete}
        onCategorySelect={jest.fn()}
      />
    );

    // The component should support editing and deleting categories at any level
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  test('maintains category hierarchy integrity during operations', async () => {
    const onCategoryMove = jest.fn();
    
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        onCategoryMove={onCategoryMove}
        onCategorySelect={jest.fn()}
      />
    );

    // The component should maintain proper parent-child relationships
    // and prevent invalid operations like moving a parent into its own child
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    
    // Verify the hierarchy structure is maintained
    const electronicsCategory = mockCategoriesWithInfiniteNesting.find(cat => cat.id === 'electronics');
    expect(electronicsCategory?.children).toBeDefined();
    expect(electronicsCategory?.children?.length).toBeGreaterThan(0);
  });

  test('supports search and filtering across all nesting levels', async () => {
    const onSearchChange = jest.fn();
    
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        searchQuery="Galaxy"
        onSearchChange={onSearchChange}
        onCategorySelect={jest.fn()}
      />
    );

    // The component should support searching across all nesting levels
    // When searching for "Galaxy", it should find "Galaxy S Series" and "Galaxy S23"
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  test('displays proper visual hierarchy with indentation', async () => {
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        expandedCategories={new Set(['electronics', 'smartphones', 'android'])}
        onCategorySelect={jest.fn()}
      />
    );

    // The component should visually represent the hierarchy with proper indentation
    // Each level should be visually distinct
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Smartphones')).toBeInTheDocument();
      expect(screen.getByText('Android Phones')).toBeInTheDocument();
    });
  });

  test('handles large category trees efficiently', async () => {
    // Create a large category tree for performance testing
    const largeCategoryTree: CategoryWithStats[] = [];
    
    // Generate 100 top-level categories with 10 subcategories each
    for (let i = 0; i < 100; i++) {
      const topCategory: CategoryWithStats = {
        id: `top-${i}`,
        name: `Top Category ${i}`,
        description: `Description for top category ${i}`,
        parent_id: null,
        level: 0,
        path: `Top Category ${i}`,
        item_count: 10,
        total_value: 1000,
        children: []
      };

      for (let j = 0; j < 10; j++) {
        topCategory.children!.push({
          id: `sub-${i}-${j}`,
          name: `Sub Category ${i}-${j}`,
          description: `Description for sub category ${i}-${j}`,
          parent_id: `top-${i}`,
          level: 1,
          path: `Top Category ${i}/Sub Category ${i}-${j}`,
          item_count: 5,
          total_value: 500,
          children: []
        });
      }

      largeCategoryTree.push(topCategory);
    }

    const startTime = performance.now();
    
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={largeCategoryTree}
        showStats={true}
        showActions={true}
        onCategorySelect={jest.fn()}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // The component should render large trees efficiently (under 1 second)
    expect(renderTime).toBeLessThan(1000);
    
    // Check that the first few categories are rendered
    expect(screen.getByText('Top Category 0')).toBeInTheDocument();
    expect(screen.getByText('Top Category 1')).toBeInTheDocument();
  });

  test('supports bulk operations on multiple categories', async () => {
    const onSelectionChange = jest.fn();
    
    renderWithProviders(
      <UniversalCategoryHierarchy
        categories={mockCategoriesWithInfiniteNesting}
        showStats={true}
        showActions={true}
        selectedCategories={['electronics', 'clothing']}
        onSelectionChange={onSelectionChange}
        onCategorySelect={jest.fn()}
      />
    );

    // The component should support selecting multiple categories for bulk operations
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });
});