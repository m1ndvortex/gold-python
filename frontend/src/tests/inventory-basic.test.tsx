import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// 🐳 DOCKER REQUIREMENT: Use require for axios in tests
const axios = require('axios');

// 🐳 DOCKER + Real PostgreSQL Database Testing
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance for real Docker backend testing
const realAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Helper to get auth token from real backend
const getAuthToken = async (): Promise<string> => {
  const response = await realAxios.post('/auth/login', {
    username: 'admin',
    password: 'admin123',
  });

  if (response.status !== 200) {
    throw new Error('Authentication failed');
  }

  return response.data.data.access_token;
};

describe('Inventory Management - Docker Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Wait for Docker backend to be ready
    let retries = 20;
    while (retries > 0) {
      try {
        const response = await realAxios.get('/health');
        if (response.status === 200) break;
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

  test('Backend connectivity - inventory items API', async () => {
    // Test direct API calls to verify backend connectivity
    const response = await realAxios.get('/inventory/items?limit=1', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('data');
    expect(response.data.data).toHaveProperty('items');
    expect(Array.isArray(response.data.data.items)).toBe(true);
  });

  test('Backend connectivity - categories API', async () => {
    // Test direct API calls to verify backend connectivity
    const response = await realAxios.get('/inventory/categories', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  test('Create and delete category through real API', async () => {
    // Create category
    const createResponse = await realAxios.post('/inventory/categories', {
      name: 'Test API Category',
      description: 'Category created through API test',
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(createResponse.status).toBe(200);
    const categoryId = createResponse.data.data.id;
    expect(categoryId).toBeDefined();
    expect(createResponse.data.data.name).toBe('Test API Category');

    // Verify category exists
    const getResponse = await realAxios.get(`/inventory/categories/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(getResponse.status).toBe(200);
    expect(getResponse.data.data.name).toBe('Test API Category');

    // Delete category
    const deleteResponse = await realAxios.delete(`/inventory/categories/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(deleteResponse.status).toBe(200);

    // Verify category is deleted
    try {
      await realAxios.get(`/inventory/categories/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      fail('Category should have been deleted');
    } catch (error: any) {
      expect(error.response.status).toBe(404);
    }
  });

  test('Create, update, and delete inventory item through real API', async () => {
    // First create a category
    const categoryResponse = await realAxios.post('/inventory/categories', {
      name: 'Test Items Category',
      description: 'Category for item testing',
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const categoryId = categoryResponse.data.data.id;

    // Create inventory item
    const createResponse = await realAxios.post('/inventory/items', {
      name: 'Test API Gold Ring',
      category_id: categoryId,
      weight_grams: 3.5,
      purchase_price: 80.00,
      sell_price: 120.00,
      stock_quantity: 5,
      min_stock_level: 1,
      description: 'Item created through API test',
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(createResponse.status).toBe(200);
    const itemId = createResponse.data.data.id;
    expect(itemId).toBeDefined();
    expect(createResponse.data.data.name).toBe('Test API Gold Ring');
    expect(createResponse.data.data.weight_grams).toBe(3.5);

    // Update inventory item
    const updateResponse = await realAxios.put(`/inventory/items/${itemId}`, {
      stock_quantity: 10,
      sell_price: 130.00,
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.data.stock_quantity).toBe(10);
    expect(updateResponse.data.data.sell_price).toBe(130.00);

    // Delete inventory item
    const deleteItemResponse = await realAxios.delete(`/inventory/items/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(deleteItemResponse.status).toBe(200);

    // Delete category
    await realAxios.delete(`/inventory/categories/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
  });

  test('Inventory items pagination and filtering', async () => {
    // Test pagination
    const paginationResponse = await realAxios.get('/inventory/items?page=1&limit=5', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(paginationResponse.status).toBe(200);
    expect(paginationResponse.data.data).toHaveProperty('page');
    expect(paginationResponse.data.data).toHaveProperty('limit');
    expect(paginationResponse.data.data).toHaveProperty('total');
    expect(paginationResponse.data.data).toHaveProperty('total_pages');

    // Test search filtering
    const searchResponse = await realAxios.get('/inventory/items?search=gold', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.data.data).toHaveProperty('items');
  });

  test('Error handling for invalid requests', async () => {
    // Test invalid category creation
    try {
      await realAxios.post('/inventory/categories', {
        // Missing required name field
        description: 'Invalid category',
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.response.status).toBe(422); // Validation error
    }

    // Test invalid item creation
    try {
      await realAxios.post('/inventory/items', {
        name: 'Invalid Item',
        // Missing required fields
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.response.status).toBe(422); // Validation error
    }

    // Test unauthorized access
    try {
      await realAxios.get('/inventory/items', {
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      });
      fail('Should have thrown auth error');
    } catch (error: any) {
      expect(error.response.status).toBe(401); // Unauthorized
    }
  });

  test('Database persistence across requests', async () => {
    // Create category
    const categoryResponse = await realAxios.post('/inventory/categories', {
      name: 'Persistence Test Category',
      description: 'Testing database persistence',
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const categoryId = categoryResponse.data.data.id;

    // Create item
    const itemResponse = await realAxios.post('/inventory/items', {
      name: 'Persistence Test Item',
      category_id: categoryId,
      weight_grams: 2.0,
      purchase_price: 50.00,
      sell_price: 75.00,
      stock_quantity: 3,
      min_stock_level: 1,
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const itemId = itemResponse.data.data.id;

    // Verify data persists in separate requests
    const getCategoryResponse = await realAxios.get(`/inventory/categories/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const getItemResponse = await realAxios.get(`/inventory/items/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(getCategoryResponse.data.data.name).toBe('Persistence Test Category');
    expect(getItemResponse.data.data.name).toBe('Persistence Test Item');
    expect(getItemResponse.data.data.category_id).toBe(categoryId);

    // Cleanup
    await realAxios.delete(`/inventory/items/${itemId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    await realAxios.delete(`/inventory/categories/${categoryId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
  });
});