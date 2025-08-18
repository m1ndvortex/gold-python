import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InventoryList } from '../components/inventory/InventoryList';
import { CategoryManager } from '../components/inventory/CategoryManager';

// 🐳 Docker + Real Database Testing Setup
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { 
      retry: 1,
      staleTime: 0,
      cacheTime: 0,
    },
    mutations: { retry: 1 },
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

// Helper to get auth token from real backend
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

describe('Inventory Components - Docker Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Wait for Docker backend to be ready
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

    // Get real auth token
    authToken = await getAuthToken();
    localStorage.setItem('access_token', authToken);
  });

  afterAll(() => {
    localStorage.removeItem('access_token');
  });

  test('InventoryList renders and connects to real backend API', async () => {
    render(
      <TestWrapper>
        <InventoryList />
      </TestWrapper>
    );

    // Should show loading state initially
    expect(screen.getByText(/loading inventory items/i)).toBeInTheDocument();

    // Wait for real API response
    await waitFor(() => {
      // Should show either items or empty state from real database
      expect(
        screen.getByText(/inventory management/i) ||
        screen.getByText(/no inventory items found/i) ||
        screen.getByText(/add item/i)
      ).toBeInTheDocument();
    }, { timeout: 15000 });

    // Verify key UI elements are present
    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  test('CategoryManager renders and connects to real backend API', async () => {
    render(
      <TestWrapper>
        <CategoryManager />
      </TestWrapper>
    );

    // Wait for real API response
    await waitFor(() => {
      expect(
        screen.getByText(/category management/i) ||
        screen.getByText(/no categories found/i) ||
        screen.getByText(/add category/i)
      ).toBeInTheDocument();
    }, { timeout: 15000 });

    // Verify key UI elements
    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });

  test('InventoryList search functionality works', async () => {
    render(
      <TestWrapper>
        <InventoryList />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Test search input
    const searchInput = screen.getByPlaceholderText('Search items...');
    fireEvent.change(searchInput, { target: { value: 'gold' } });

    // Verify search value is set
    expect(searchInput).toHaveValue('gold');

    // Clear filters should work
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  test('InventoryList filter controls work correctly', async () => {
    render(
      <TestWrapper>
        <InventoryList />
      </TestWrapper>
    );

    // Wait for filters to load
    await waitFor(() => {
      expect(screen.getByText('All Categories')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Test low stock filter
    const lowStockCheckbox = screen.getByLabelText('Low Stock Only');
    fireEvent.click(lowStockCheckbox);
    expect(lowStockCheckbox).toBeChecked();

    // Test clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);
    expect(lowStockCheckbox).not.toBeChecked();
  });

  test('Add Item dialog opens and closes correctly', async () => {
    render(
      <TestWrapper>
        <InventoryList />
      </TestWrapper>
    );

    // Wait for Add Item button
    await waitFor(() => {
      expect(screen.getByText('Add Item')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Click Add Item
    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByText('Add New Inventory Item')).toBeInTheDocument();
    });

    // Should show form fields
    expect(screen.getByLabelText('Item Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Weight (grams) *')).toBeInTheDocument();
    expect(screen.getByLabelText('Purchase Price ($) *')).toBeInTheDocument();
    expect(screen.getByLabelText('Sell Price ($) *')).toBeInTheDocument();

    // Close dialog
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Add New Inventory Item')).not.toBeInTheDocument();
    });
  });

  test('Add Category dialog opens and closes correctly', async () => {
    render(
      <TestWrapper>
        <CategoryManager />
      </TestWrapper>
    );

    // Wait for Add Category button
    await waitFor(() => {
      expect(screen.getByText('Add Category')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Click Add Category
    const addButton = screen.getByText('Add Category');
    fireEvent.click(addButton);

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByText('Create New Category')).toBeInTheDocument();
    });

    // Should show form fields
    expect(screen.getByLabelText('Category Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Parent Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();

    // Close dialog
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Create New Category')).not.toBeInTheDocument();
    });
  });

  test('Form validation works for inventory item creation', async () => {
    render(
      <TestWrapper>
        <InventoryList />
      </TestWrapper>
    );

    // Open add item dialog
    await waitFor(() => {
      expect(screen.getByText('Add Item')).toBeInTheDocument();
    }, { timeout: 10000 });

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

  test('Backend connectivity and error handling', async () => {
    // Test with invalid token
    localStorage.setItem('access_token', 'invalid-token');

    render(
      <TestWrapper>
        <InventoryList />
      </TestWrapper>
    );

    // Should handle auth error gracefully
    await waitFor(() => {
      // Component should either redirect or show error state
      expect(
        screen.getByText(/failed to load/i) ||
        screen.getByText(/error/i) ||
        window.location.pathname === '/login'
      ).toBeTruthy();
    }, { timeout: 10000 });

    // Restore valid token
    localStorage.setItem('access_token', authToken);
  });

  test('Real database operations - inventory items API', async () => {
    // Test direct API calls to verify backend connectivity
    const response = await fetch(`${API_BASE_URL}/inventory/items?limit=1`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('items');
    expect(Array.isArray(data.data.items)).toBe(true);
  });

  test('Real database operations - categories API', async () => {
    // Test direct API calls to verify backend connectivity
    const response = await fetch(`${API_BASE_URL}/inventory/categories`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });
});