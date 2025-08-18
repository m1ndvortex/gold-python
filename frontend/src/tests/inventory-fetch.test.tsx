import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// 🐳 DOCKER + Real PostgreSQL Database Testing using fetch API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Set Jest timeout for Docker integration tests
jest.setTimeout(60000);

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

// Helper to make API calls using fetch
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Helper to get auth token from real backend
const getAuthToken = async (): Promise<string> => {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123',
    }),
  });

  return response.data.access_token;
};

describe('Inventory Management - Docker Integration Tests (Fetch API)', () => {
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

    if (retries === 0) {
      throw new Error('Backend not ready after 60 seconds');
    }

    // Get real auth token
    authToken = await getAuthToken();
    localStorage.setItem('access_token', authToken);
  });

  afterAll(() => {
    localStorage.removeItem('access_token');
  });

  test('Backend health check works', async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.database).toBe('connected');
  });

  test('Authentication works with real backend', async () => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });

    expect(response.data.access_token).toBeDefined();
    expect(response.data.token_type).toBe('bearer');
  });

  test('Inventory items API connectivity', async () => {
    const response = await apiCall('/inventory/items?limit=1', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.data).toHaveProperty('items');
    expect(response.data).toHaveProperty('total');
    expect(response.data).toHaveProperty('page');
    expect(response.data).toHaveProperty('limit');
    expect(Array.isArray(response.data.items)).toBe(true);
  });

  test('Categories API connectivity', async () => {
    const response = await apiCall('/inventory/categories', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('Create and delete category through real API', async () => {
    // Create category
    const createResponse = await apiCall('/inventory/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Test Fetch Category',
        description: 'Category created through fetch API test',
      }),
    });

    expect(createResponse.data.id).toBeDefined();
    expect(createResponse.data.name).toBe('Test Fetch Category');
    const categoryId = createResponse.data.id;

    // Verify category exists
    const getResponse = await apiCall(`/inventory/categories/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(getResponse.data.name).toBe('Test Fetch Category');
    expect(getResponse.data.description).toBe('Category created through fetch API test');

    // Delete category
    await apiCall(`/inventory/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Verify category is deleted
    try {
      await apiCall(`/inventory/categories/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      fail('Category should have been deleted');
    } catch (error: any) {
      expect(error.message).toContain('404');
    }
  });

  test('Create, update, and delete inventory item through real API', async () => {
    // First create a category
    const categoryResponse = await apiCall('/inventory/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Test Fetch Items Category',
        description: 'Category for item testing with fetch',
      }),
    });

    const categoryId = categoryResponse.data.id;

    // Create inventory item
    const createResponse = await apiCall('/inventory/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Test Fetch Gold Ring',
        category_id: categoryId,
        weight_grams: 4.2,
        purchase_price: 90.00,
        sell_price: 135.00,
        stock_quantity: 7,
        min_stock_level: 2,
        description: 'Item created through fetch API test',
      }),
    });

    expect(createResponse.data.id).toBeDefined();
    expect(createResponse.data.name).toBe('Test Fetch Gold Ring');
    expect(createResponse.data.weight_grams).toBe(4.2);
    expect(createResponse.data.purchase_price).toBe(90.00);
    expect(createResponse.data.sell_price).toBe(135.00);
    expect(createResponse.data.stock_quantity).toBe(7);
    const itemId = createResponse.data.id;

    // Update inventory item
    const updateResponse = await apiCall(`/inventory/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        stock_quantity: 15,
        sell_price: 140.00,
      }),
    });

    expect(updateResponse.data.stock_quantity).toBe(15);
    expect(updateResponse.data.sell_price).toBe(140.00);
    // Other fields should remain unchanged
    expect(updateResponse.data.name).toBe('Test Fetch Gold Ring');
    expect(updateResponse.data.weight_grams).toBe(4.2);

    // Get item to verify update persisted
    const getItemResponse = await apiCall(`/inventory/items/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(getItemResponse.data.stock_quantity).toBe(15);
    expect(getItemResponse.data.sell_price).toBe(140.00);

    // Delete inventory item
    await apiCall(`/inventory/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Verify item is deleted
    try {
      await apiCall(`/inventory/items/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      fail('Item should have been deleted');
    } catch (error: any) {
      expect(error.message).toContain('404');
    }

    // Delete category
    await apiCall(`/inventory/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
  });

  test('Inventory items pagination and filtering work', async () => {
    // Test pagination
    const paginationResponse = await apiCall('/inventory/items?page=1&limit=3', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(paginationResponse.data.page).toBe(1);
    expect(paginationResponse.data.limit).toBe(3);
    expect(paginationResponse.data).toHaveProperty('total');
    expect(paginationResponse.data).toHaveProperty('total_pages');
    expect(paginationResponse.data.items.length).toBeLessThanOrEqual(3);

    // Test search filtering
    const searchResponse = await apiCall('/inventory/items?search=gold', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(searchResponse.data).toHaveProperty('items');
    expect(Array.isArray(searchResponse.data.items)).toBe(true);
  });

  test('Error handling for invalid requests', async () => {
    // Test invalid category creation (missing name)
    try {
      await apiCall('/inventory/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          description: 'Invalid category without name',
        }),
      });
      fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.message).toContain('422'); // Validation error
    }

    // Test invalid item creation (missing required fields)
    try {
      await apiCall('/inventory/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'Invalid Item',
          // Missing category_id, weight_grams, etc.
        }),
      });
      fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.message).toContain('422'); // Validation error
    }

    // Test unauthorized access
    try {
      await apiCall('/inventory/items', {
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      });
      fail('Should have thrown auth error');
    } catch (error: any) {
      expect(error.message).toContain('401'); // Unauthorized
    }
  });

  test('Database persistence and consistency', async () => {
    // Create multiple related records to test consistency
    const category1Response = await apiCall('/inventory/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Persistence Test Category 1',
        description: 'Testing database persistence',
      }),
    });

    const category2Response = await apiCall('/inventory/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Persistence Test Category 2',
        description: 'Testing database persistence',
      }),
    });

    const categoryId1 = category1Response.data.id;
    const categoryId2 = category2Response.data.id;

    // Create items in different categories
    const item1Response = await apiCall('/inventory/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Persistence Test Item 1',
        category_id: categoryId1,
        weight_grams: 1.5,
        purchase_price: 30.00,
        sell_price: 45.00,
        stock_quantity: 10,
        min_stock_level: 2,
      }),
    });

    const item2Response = await apiCall('/inventory/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Persistence Test Item 2',
        category_id: categoryId2,
        weight_grams: 2.8,
        purchase_price: 60.00,
        sell_price: 90.00,
        stock_quantity: 5,
        min_stock_level: 1,
      }),
    });

    const itemId1 = item1Response.data.id;
    const itemId2 = item2Response.data.id;

    // Verify all data persists across separate requests
    const [getCat1, getCat2, getItem1, getItem2] = await Promise.all([
      apiCall(`/inventory/categories/${categoryId1}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
      apiCall(`/inventory/categories/${categoryId2}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
      apiCall(`/inventory/items/${itemId1}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
      apiCall(`/inventory/items/${itemId2}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
    ]);

    // Verify category data
    expect(getCat1.data.name).toBe('Persistence Test Category 1');
    expect(getCat2.data.name).toBe('Persistence Test Category 2');

    // Verify item data and relationships
    expect(getItem1.data.name).toBe('Persistence Test Item 1');
    expect(getItem1.data.category_id).toBe(categoryId1);
    expect(getItem1.data.weight_grams).toBe(1.5);

    expect(getItem2.data.name).toBe('Persistence Test Item 2');
    expect(getItem2.data.category_id).toBe(categoryId2);
    expect(getItem2.data.weight_grams).toBe(2.8);

    // Cleanup all test data
    await Promise.all([
      apiCall(`/inventory/items/${itemId1}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
      apiCall(`/inventory/items/${itemId2}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
    ]);

    await Promise.all([
      apiCall(`/inventory/categories/${categoryId1}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
      apiCall(`/inventory/categories/${categoryId2}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
    ]);
  });

  test('Bulk operations and complex queries', async () => {
    // Create test data for bulk operations
    const categoryResponse = await apiCall('/inventory/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Bulk Test Category',
        description: 'Category for bulk operations testing',
      }),
    });

    const categoryId = categoryResponse.data.id;

    // Create multiple items
    const items = await Promise.all([
      apiCall('/inventory/items', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({
          name: 'Bulk Test Item 1',
          category_id: categoryId,
          weight_grams: 1.0,
          purchase_price: 20.00,
          sell_price: 30.00,
          stock_quantity: 1, // Low stock
          min_stock_level: 5,
        }),
      }),
      apiCall('/inventory/items', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({
          name: 'Bulk Test Item 2',
          category_id: categoryId,
          weight_grams: 2.0,
          purchase_price: 40.00,
          sell_price: 60.00,
          stock_quantity: 10, // Normal stock
          min_stock_level: 3,
        }),
      }),
    ]);

    const itemIds = items.map(item => item.data.id);

    // Test filtering by category
    const categoryFilterResponse = await apiCall(`/inventory/items?category_id=${categoryId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    expect(categoryFilterResponse.data.items.length).toBeGreaterThanOrEqual(2);
    categoryFilterResponse.data.items.forEach((item: any) => {
      expect(item.category_id).toBe(categoryId);
    });

    // Test low stock filtering
    const lowStockResponse = await apiCall('/inventory/items?low_stock=true', {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    expect(lowStockResponse.data.items).toBeDefined();
    // Should include our low stock item
    const lowStockItem = lowStockResponse.data.items.find((item: any) => item.name === 'Bulk Test Item 1');
    expect(lowStockItem).toBeDefined();

    // Cleanup
    await Promise.all(itemIds.map(id => 
      apiCall(`/inventory/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      })
    ));

    await apiCall(`/inventory/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
  });
});