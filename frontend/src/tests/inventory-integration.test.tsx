import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InventoryList } from '../components/inventory/InventoryList';
import { InventoryItemForm } from '../components/inventory/InventoryItemForm';
import { CategoryManager } from '../components/inventory/CategoryManager';
import { Inventory } from '../pages/Inventory';

// Test setup with real backend API in Docker
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { 
      retry: false,
      staleTime: 0,
      cacheTime: 0,
    },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Helper function to authenticate and get token for tests
const getAuthToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate for tests');
  }

  const data = await response.json();
  return data.data.access_token;
};

// Helper function to create test category
const createTestCategory = async (token: string, name: string = 'Test Category') => {
  const response = await fetch(`${API_BASE_URL}/inventory/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      description: 'Test category for inventory tests',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create test category');
  }

  const data = await response.json();
  return data.data;
};

// Helper function to create test inventory item
const createTestInventoryItem = async (token: string, categoryId: string, name: string = 'Test Gold Ring') => {
  const response = await fetch(`${API_BASE_URL}/inventory/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      category_id: categoryId,
      weight_grams: 5.5,
      purchase_price: 100.00,
      sell_price: 150.00,
      stock_quantity: 10,
      min_stock_level: 2,
      description: 'Test gold ring for inventory tests',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create test inventory item');
  }

  const data = await response.json();
  return data.data;
};

// Helper function to cleanup test data
const cleanupTestData = async (token: string) => {
  try {
    // Get all items and categories
    const [itemsResponse, categoriesResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/inventory/items`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }),
      fetch(`${API_BASE_URL}/inventory/categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }),
    ]);

    if (itemsResponse.ok) {
      const itemsData = await itemsResponse.json();
      const items = itemsData.data?.items || [];
      
      // Delete test items
      for (const item of items) {
        if (item.name.includes('Test')) {
          await fetch(`${API_BASE_URL}/inventory/items/${item.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        }
      }
    }

    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      const categories = categoriesData.data || [];
      
      // Delete test categories
      for (const category of categories) {
        if (category.name.includes('Test')) {
          await fetch(`${API_BASE_URL}/inventory/categories/${category.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        }
      }
    }
  } catch (error) {
    console.warn('Cleanup failed:', error);
  }
};

describe('Inventory Management Integration Tests (Docker + Real Database)', () => {
  let authToken: string;

  beforeAll(async () => {
    // Wait for backend to be ready
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) break;
      } catch (error) {
        // Backend not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries--;
    }

    if (retries === 0) {
      throw new Error('Backend not ready after 60 seconds');
    }

    // Get authentication token
    authToken = await getAuthToken();
    localStorage.setItem('access_token', authToken);
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData(authToken);
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupTestData(authToken);
    localStorage.removeItem('access_token');
  });

  describe('InventoryList Component', () => {
    test('displays inventory items from real database', async () => {
      // Create test data in real database
      const category = await createTestCategory(authToken, 'Test Rings Category');
      const item = await createTestInventoryItem(authToken, category.id, 'Test Gold Ring 18K');

      render(
        <TestWrapper>
          <InventoryList />
        </TestWrapper>
      );

      // Wait for data to load from real API
      await waitFor(() => {
        expect(screen.getByText('Test Gold Ring 18K')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify item details are displayed
      expect(screen.getByText('Test Rings Category')).toBeInTheDocument();
      expect(screen.getByText('5.5')).toBeInTheDocument(); // weight
      expect(screen.getByText('$100.00')).toBeInTheDocument(); // purchase price
      expect(screen.getByText('$150.00')).toBeInTheDocument(); // sell price
      expect(screen.getByText('10')).toBeInTheDocument(); // stock quantity
    });

    test('filters inventory items by search term', async () => {
      // Create multiple test items
      const category = await createTestCategory(authToken, 'Test Jewelry Category');
      await createTestInventoryItem(authToken, category.id, 'Gold Ring Premium');
      await createTestInventoryItem(authToken, category.id, 'Silver Necklace Classic');

      render(
        <TestWrapper>
          <InventoryList />
        </TestWrapper>
      );

      // Wait for items to load
      await waitFor(() => {
        expect(screen.getByText('Gold Ring Premium')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'Gold' } });

      // Wait for filtered results
      await waitFor(() => {
        expect(screen.getByText('Gold Ring Premium')).toBeInTheDocument();
        expect(screen.queryByText('Silver Necklace Classic')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('displays low stock alerts correctly', async () => {
      // Create item with low stock
      const category = await createTestCategory(authToken, 'Test Low Stock Category');
      const lowStockItem = await fetch(`${API_BASE_URL}/inventory/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'Low Stock Gold Ring',
          category_id: category.id,
          weight_grams: 3.0,
          purchase_price: 80.00,
          sell_price: 120.00,
          stock_quantity: 1, // Below min_stock_level
          min_stock_level: 5,
          description: 'Test low stock item',
        }),
      });

      render(
        <TestWrapper>
          <InventoryList />
        </TestWrapper>
      );

      // Wait for low stock item to appear
      await waitFor(() => {
        expect(screen.getByText('Low Stock Gold Ring')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Check for low stock indicator
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
    });

    test('handles item selection and bulk operations', async () => {
      const category = await createTestCategory(authToken, 'Test Bulk Category');
      await createTestInventoryItem(authToken, category.id, 'Bulk Test Item 1');
      await createTestInventoryItem(authToken, category.id, 'Bulk Test Item 2');

      render(
        <TestWrapper>
          <InventoryList />
        </TestWrapper>
      );

      // Wait for items to load
      await waitFor(() => {
        expect(screen.getByText('Bulk Test Item 1')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Select items using checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // First item checkbox (index 0 is select all)
      fireEvent.click(checkboxes[2]); // Second item checkbox

      // Verify bulk operations panel appears
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Selected count
        expect(screen.getByText('items selected')).toBeInTheDocument();
        expect(screen.getByText('Bulk Edit')).toBeInTheDocument();
      });
    });
  });

  describe('CategoryManager Component', () => {
    test('creates new category in real database', async () => {
      render(
        <TestWrapper>
          <CategoryManager />
        </TestWrapper>
      );

      // Click add category button
      const addButton = screen.getByText('Add Category');
      fireEvent.click(addButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Create New Category')).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText('Category Name *');
      const descriptionInput = screen.getByLabelText('Description');
      
      fireEvent.change(nameInput, { target: { value: 'Test New Category' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test category description' } });

      // Submit form
      const createButton = screen.getByText('Create Category');
      fireEvent.click(createButton);

      // Wait for category to be created and appear in list
      await waitFor(() => {
        expect(screen.getByText('Test New Category')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify description is shown
      expect(screen.getByText('- Test category description')).toBeInTheDocument();
    });

    test('displays hierarchical category structure', async () => {
      // Create parent category
      const parentCategory = await createTestCategory(authToken, 'Test Parent Category');
      
      // Create child category
      await fetch(`${API_BASE_URL}/inventory/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'Test Child Category',
          parent_id: parentCategory.id,
          description: 'Child category for testing',
        }),
      });

      render(
        <TestWrapper>
          <CategoryManager />
        </TestWrapper>
      );

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByText('Test Parent Category')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Parent should have folder icon (expandable)
      const folderIcons = screen.getAllByTestId('folder-icon') || [];
      expect(folderIcons.length).toBeGreaterThan(0);
    });

    test('edits existing category in real database', async () => {
      const category = await createTestCategory(authToken, 'Test Edit Category');

      render(
        <TestWrapper>
          <CategoryManager />
        </TestWrapper>
      );

      // Wait for category to appear
      await waitFor(() => {
        expect(screen.getByText('Test Edit Category')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Click edit button
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.querySelector('svg')?.getAttribute('data-testid') === 'edit-icon'
      );
      
      if (editButton) {
        fireEvent.click(editButton);

        // Wait for edit dialog
        await waitFor(() => {
          expect(screen.getByText('Edit Category')).toBeInTheDocument();
        });

        // Update name
        const nameInput = screen.getByDisplayValue('Test Edit Category');
        fireEvent.change(nameInput, { target: { value: 'Test Updated Category' } });

        // Submit
        const updateButton = screen.getByText('Update Category');
        fireEvent.click(updateButton);

        // Wait for update to reflect
        await waitFor(() => {
          expect(screen.getByText('Test Updated Category')).toBeInTheDocument();
        }, { timeout: 10000 });
      }
    });
  });

  describe('Full Inventory Page Integration', () => {
    test('switches between inventory and categories tabs', async () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      // Should start on inventory tab
      expect(screen.getByText('Inventory Management')).toBeInTheDocument();

      // Switch to categories tab
      const categoriesTab = screen.getByText('Categories');
      fireEvent.click(categoriesTab);

      // Should show category management
      await waitFor(() => {
        expect(screen.getByText('Category Management')).toBeInTheDocument();
      });

      // Switch back to inventory tab
      const inventoryTab = screen.getByText('Inventory Items');
      fireEvent.click(inventoryTab);

      // Should show inventory management again
      await waitFor(() => {
        expect(screen.getByText('Inventory Management')).toBeInTheDocument();
      });
    });

    test('creates complete workflow: category -> item -> display', async () => {
      render(
        <TestWrapper>
          <Inventory />
        </TestWrapper>
      );

      // Step 1: Create category
      const categoriesTab = screen.getByText('Categories');
      fireEvent.click(categoriesTab);

      await waitFor(() => {
        expect(screen.getByText('Category Management')).toBeInTheDocument();
      });

      const addCategoryButton = screen.getByText('Add Category');
      fireEvent.click(addCategoryButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Category')).toBeInTheDocument();
      });

      const categoryNameInput = screen.getByLabelText('Category Name *');
      fireEvent.change(categoryNameInput, { target: { value: 'Test Workflow Category' } });

      const createCategoryButton = screen.getByText('Create Category');
      fireEvent.click(createCategoryButton);

      await waitFor(() => {
        expect(screen.getByText('Test Workflow Category')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Step 2: Switch to inventory and create item
      const inventoryTab = screen.getByText('Inventory Items');
      fireEvent.click(inventoryTab);

      await waitFor(() => {
        expect(screen.getByText('Add Item')).toBeInTheDocument();
      });

      const addItemButton = screen.getByText('Add Item');
      fireEvent.click(addItemButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Inventory Item')).toBeInTheDocument();
      });

      // Fill item form
      const itemNameInput = screen.getByLabelText('Item Name *');
      fireEvent.change(itemNameInput, { target: { value: 'Test Workflow Gold Ring' } });

      const weightInput = screen.getByLabelText('Weight (grams) *');
      fireEvent.change(weightInput, { target: { value: '4.5' } });

      const purchasePriceInput = screen.getByLabelText('Purchase Price ($) *');
      fireEvent.change(purchasePriceInput, { target: { value: '90' } });

      const sellPriceInput = screen.getByLabelText('Sell Price ($) *');
      fireEvent.change(sellPriceInput, { target: { value: '135' } });

      const stockInput = screen.getByLabelText('Current Stock *');
      fireEvent.change(stockInput, { target: { value: '8' } });

      // Select category
      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);

      await waitFor(() => {
        const categoryOption = screen.getByText('Test Workflow Category');
        fireEvent.click(categoryOption);
      });

      // Submit item form
      const createItemButton = screen.getByText('Create Item');
      fireEvent.click(createItemButton);

      // Step 3: Verify item appears in inventory list
      await waitFor(() => {
        expect(screen.getByText('Test Workflow Gold Ring')).toBeInTheDocument();
      }, { timeout: 15000 });

      // Verify all item details are displayed correctly
      expect(screen.getByText('Test Workflow Category')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('$90.00')).toBeInTheDocument();
      expect(screen.getByText('$135.00')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles network errors gracefully', async () => {
      // Temporarily remove auth token to simulate auth error
      localStorage.removeItem('access_token');

      render(
        <TestWrapper>
          <InventoryList />
        </TestWrapper>
      );

      // Should handle auth error and show appropriate message
      await waitFor(() => {
        // The component should handle the error gracefully
        // This might redirect to login or show an error message
        expect(screen.getByText(/failed to load/i) || screen.getByText(/error/i)).toBeTruthy();
      }, { timeout: 10000 });

      // Restore auth token
      localStorage.setItem('access_token', authToken);
    });

    test('handles empty inventory state', async () => {
      // Ensure no test items exist
      await cleanupTestData(authToken);

      render(
        <TestWrapper>
          <InventoryList />
        </TestWrapper>
      );

      // Should show empty state message
      await waitFor(() => {
        expect(screen.getByText(/no inventory items found/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('validates form inputs correctly', async () => {
      render(
        <TestWrapper>
          <InventoryList />
        </TestWrapper>
      );

      // Open add item form
      const addButton = screen.getByText('Add Item');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Inventory Item')).toBeInTheDocument();
      });

      // Try to submit empty form
      const createButton = screen.getByText('Create Item');
      fireEvent.click(createButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Item name is required')).toBeInTheDocument();
      });
    });
  });
});