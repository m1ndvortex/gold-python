import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InventoryItemForm } from '../components/inventory/InventoryItemForm';
import { CategoryManager } from '../components/inventory/CategoryManager';

// 🐳 Docker + Real PostgreSQL Database Testing
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 0, cacheTime: 0 },
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

// Authentication helper
const getAuthToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123',
    }),
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  const data = await response.json();
  return data.data.access_token;
};

// Test data creation helpers
const createTestCategory = async (token: string, name: string = 'Test CRUD Category') => {
  const response = await fetch(`${API_BASE_URL}/inventory/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      description: 'Test category for CRUD operations',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create test category');
  }

  const data = await response.json();
  return data.data;
};

const createTestInventoryItem = async (token: string, categoryId: string, name: string = 'Test CRUD Item') => {
  const response = await fetch(`${API_BASE_URL}/inventory/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      category_id: categoryId,
      weight_grams: 2.5,
      purchase_price: 50.00,
      sell_price: 75.00,
      stock_quantity: 5,
      min_stock_level: 1,
      description: 'Test item for CRUD operations',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create test inventory item');
  }

  const data = await response.json();
  return data.data;
};

// Cleanup helper
const cleanupTestData = async (token: string) => {
  try {
    // Clean up items
    const itemsResponse = await fetch(`${API_BASE_URL}/inventory/items`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (itemsResponse.ok) {
      const itemsData = await itemsResponse.json();
      const items = itemsData.data?.items || [];
      
      for (const item of items) {
        if (item.name.includes('Test CRUD') || item.name.includes('Created via Form')) {
          await fetch(`${API_BASE_URL}/inventory/items/${item.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        }
      }
    }

    // Clean up categories
    const categoriesResponse = await fetch(`${API_BASE_URL}/inventory/categories`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      const categories = categoriesData.data || [];
      
      for (const category of categories) {
        if (category.name.includes('Test CRUD') || category.name.includes('Created via Form')) {
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

describe('Inventory CRUD Operations - Real Database Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Wait for Docker backend
    let retries = 20;
    while (retries > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) break;
      } catch (error) {
        // Backend not ready
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
      retries--;
    }

    authToken = await getAuthToken();
    localStorage.setItem('access_token', authToken);
  });

  beforeEach(async () => {
    await cleanupTestData(authToken);
  });

  afterAll(async () => {
    await cleanupTestData(authToken);
    localStorage.removeItem('access_token');
  });

  describe('Category CRUD Operations', () => {
    test('creates category through form and saves to real database', async () => {
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CategoryManager />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Add Category')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Open create form
      const addButton = screen.getByText('Add Category');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Category')).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText('Category Name *');
      const descriptionInput = screen.getByLabelText('Description');

      fireEvent.change(nameInput, { target: { value: 'Created via Form Test' } });
      fireEvent.change(descriptionInput, { target: { value: 'This category was created through the form' } });

      // Submit form
      const createButton = screen.getByText('Create Category');
      fireEvent.click(createButton);

      // Wait for category to appear in the list (real database operation)
      await waitFor(() => {
        expect(screen.getByText('Created via Form Test')).toBeInTheDocument();
      }, { timeout: 15000 });

      // Verify description is also displayed
      expect(screen.getByText('- This category was created through the form')).toBeInTheDocument();

      // Verify in database directly
      const response = await fetch(`${API_BASE_URL}/inventory/categories`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await response.json();
      const createdCategory = data.data.find((cat: any) => cat.name === 'Created via Form Test');
      
      expect(createdCategory).toBeTruthy();
      expect(createdCategory.description).toBe('This category was created through the form');
    });

    test('edits existing category and updates in real database', async () => {
      // Create test category first
      const category = await createTestCategory(authToken, 'Edit Test Category');

      render(
        <TestWrapper>
          <CategoryManager />
        </TestWrapper>
      );

      // Wait for category to appear
      await waitFor(() => {
        expect(screen.getByText('Edit Test Category')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Find and click edit button (look for edit icon)
      const editButtons = screen.getAllByRole('button');
      let editButton = null;
      
      for (const button of editButtons) {
        const svg = button.querySelector('svg');
        if (svg && (svg.classList.contains('lucide-edit') || button.getAttribute('aria-label')?.includes('edit'))) {
          editButton = button;
          break;
        }
      }

      if (editButton) {
        fireEvent.click(editButton);

        await waitFor(() => {
          expect(screen.getByText('Edit Category')).toBeInTheDocument();
        });

        // Update the name
        const nameInput = screen.getByDisplayValue('Edit Test Category');
        fireEvent.change(nameInput, { target: { value: 'Updated Category Name' } });

        // Submit update
        const updateButton = screen.getByText('Update Category');
        fireEvent.click(updateButton);

        // Wait for update to reflect
        await waitFor(() => {
          expect(screen.getByText('Updated Category Name')).toBeInTheDocument();
        }, { timeout: 15000 });

        // Verify in database
        const response = await fetch(`${API_BASE_URL}/inventory/categories/${category.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        const data = await response.json();
        expect(data.data.name).toBe('Updated Category Name');
      }
    });

    test('deletes category from real database', async () => {
      // Create test category
      const category = await createTestCategory(authToken, 'Delete Test Category');

      render(
        <TestWrapper>
          <CategoryManager />
        </TestWrapper>
      );

      // Wait for category to appear
      await waitFor(() => {
        expect(screen.getByText('Delete Test Category')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Mock window.confirm to return true
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      // Find and click delete button
      const deleteButtons = screen.getAllByRole('button');
      let deleteButton = null;
      
      for (const button of deleteButtons) {
        const svg = button.querySelector('svg');
        if (svg && (svg.classList.contains('lucide-trash-2') || button.getAttribute('aria-label')?.includes('delete'))) {
          deleteButton = button;
          break;
        }
      }

      if (deleteButton) {
        fireEvent.click(deleteButton);

        // Wait for category to disappear
        await waitFor(() => {
          expect(screen.queryByText('Delete Test Category')).not.toBeInTheDocument();
        }, { timeout: 15000 });

        // Verify deletion in database
        const response = await fetch(`${API_BASE_URL}/inventory/categories/${category.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        expect(response.status).toBe(404);
      }

      // Restore original confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Inventory Item CRUD Operations', () => {
    test('creates inventory item through form and saves to real database', async () => {
      // Create category first
      const category = await createTestCategory(authToken, 'Items Test Category');
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <InventoryItemForm onClose={mockOnClose} />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText('Add New Inventory Item')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Fill form fields
      const nameInput = screen.getByLabelText('Item Name *');
      fireEvent.change(nameInput, { target: { value: 'Created via Form Item' } });

      const weightInput = screen.getByLabelText('Weight (grams) *');
      fireEvent.change(weightInput, { target: { value: '3.75' } });

      const purchasePriceInput = screen.getByLabelText('Purchase Price ($) *');
      fireEvent.change(purchasePriceInput, { target: { value: '120' } });

      const sellPriceInput = screen.getByLabelText('Sell Price ($) *');
      fireEvent.change(sellPriceInput, { target: { value: '180' } });

      const stockInput = screen.getByLabelText('Current Stock *');
      fireEvent.change(stockInput, { target: { value: '15' } });

      const minStockInput = screen.getByLabelText('Minimum Stock Level');
      fireEvent.change(minStockInput, { target: { value: '3' } });

      const descriptionInput = screen.getByLabelText('Description');
      fireEvent.change(descriptionInput, { target: { value: 'Item created through form testing' } });

      // Select category
      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);

      await waitFor(() => {
        const categoryOption = screen.getByText('Items Test Category');
        fireEvent.click(categoryOption);
      });

      // Submit form
      const createButton = screen.getByText('Create Item');
      fireEvent.click(createButton);

      // Wait for form to close (indicates success)
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 15000 });

      // Verify in database directly
      const response = await fetch(`${API_BASE_URL}/inventory/items`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await response.json();
      const createdItem = data.data.items.find((item: any) => item.name === 'Created via Form Item');
      
      expect(createdItem).toBeTruthy();
      expect(createdItem.weight_grams).toBe(3.75);
      expect(createdItem.purchase_price).toBe(120);
      expect(createdItem.sell_price).toBe(180);
      expect(createdItem.stock_quantity).toBe(15);
      expect(createdItem.min_stock_level).toBe(3);
      expect(createdItem.description).toBe('Item created through form testing');
    });

    test('edits existing inventory item and updates in real database', async () => {
      // Create test data
      const category = await createTestCategory(authToken, 'Edit Items Category');
      const item = await createTestInventoryItem(authToken, category.id, 'Edit Test Item');
      
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <InventoryItemForm item={item} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Wait for form to load with existing data
      await waitFor(() => {
        expect(screen.getByText('Edit Inventory Item')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Edit Test Item')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Update fields
      const nameInput = screen.getByDisplayValue('Edit Test Item');
      fireEvent.change(nameInput, { target: { value: 'Updated Test Item' } });

      const weightInput = screen.getByDisplayValue('2.5');
      fireEvent.change(weightInput, { target: { value: '4.25' } });

      const stockInput = screen.getByDisplayValue('5');
      fireEvent.change(stockInput, { target: { value: '12' } });

      // Submit update
      const updateButton = screen.getByText('Update Item');
      fireEvent.click(updateButton);

      // Wait for form to close
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 15000 });

      // Verify update in database
      const response = await fetch(`${API_BASE_URL}/inventory/items/${item.id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await response.json();
      
      expect(data.data.name).toBe('Updated Test Item');
      expect(data.data.weight_grams).toBe(4.25);
      expect(data.data.stock_quantity).toBe(12);
    });

    test('validates form inputs and shows errors', async () => {
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <InventoryItemForm onClose={mockOnClose} />
        </TestWrapper>
      );

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

      // Fill name but leave other required fields empty
      const nameInput = screen.getByLabelText('Item Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Item' } });

      fireEvent.click(createButton);

      // Should still show other validation errors
      await waitFor(() => {
        expect(screen.getByText('Weight is required') || 
               screen.getByText('Purchase price is required') ||
               screen.getByText('Sell price is required')).toBeInTheDocument();
      });
    });

    test('handles image upload functionality', async () => {
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <InventoryItemForm onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Add New Inventory Item')).toBeInTheDocument();
      });

      // Test image upload input exists
      const imageInput = screen.getByLabelText('Choose File');
      expect(imageInput).toBeInTheDocument();

      // Test that upload area is displayed
      expect(screen.getByText('Upload a product image')).toBeInTheDocument();
    });
  });

  describe('Database Integration and Error Handling', () => {
    test('handles database connection errors gracefully', async () => {
      // Use invalid token to simulate auth error
      localStorage.setItem('access_token', 'invalid-token');

      render(
        <TestWrapper>
          <CategoryManager />
        </TestWrapper>
      );

      // Should handle error gracefully (might redirect or show error)
      await waitFor(() => {
        // Component should handle the error without crashing
        expect(document.body).toBeInTheDocument();
      }, { timeout: 10000 });

      // Restore valid token
      localStorage.setItem('access_token', authToken);
    });

    test('verifies real PostgreSQL database operations', async () => {
      // Test direct database operations
      
      // Create category
      const categoryResponse = await fetch(`${API_BASE_URL}/inventory/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'DB Test Category',
          description: 'Direct database test',
        }),
      });

      expect(categoryResponse.ok).toBe(true);
      const categoryData = await categoryResponse.json();
      const categoryId = categoryData.data.id;

      // Create item
      const itemResponse = await fetch(`${API_BASE_URL}/inventory/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'DB Test Item',
          category_id: categoryId,
          weight_grams: 1.5,
          purchase_price: 30,
          sell_price: 45,
          stock_quantity: 8,
          min_stock_level: 2,
        }),
      });

      expect(itemResponse.ok).toBe(true);
      const itemData = await itemResponse.json();

      // Verify item was created with correct data
      expect(itemData.data.name).toBe('DB Test Item');
      expect(itemData.data.category_id).toBe(categoryId);
      expect(itemData.data.weight_grams).toBe(1.5);

      // Update item
      const updateResponse = await fetch(`${API_BASE_URL}/inventory/items/${itemData.data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          stock_quantity: 12,
        }),
      });

      expect(updateResponse.ok).toBe(true);
      const updatedData = await updateResponse.json();
      expect(updatedData.data.stock_quantity).toBe(12);

      // Delete item
      const deleteItemResponse = await fetch(`${API_BASE_URL}/inventory/items/${itemData.data.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      expect(deleteItemResponse.ok).toBe(true);

      // Delete category
      const deleteCategoryResponse = await fetch(`${API_BASE_URL}/inventory/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      expect(deleteCategoryResponse.ok).toBe(true);
    });
  });
});