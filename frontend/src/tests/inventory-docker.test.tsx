import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// 🐳 DOCKER PRODUCTION TEST - Real Backend + PostgreSQL Database
// This test uses the correct Docker networking to connect to backend service

// Use backend service name for Docker internal networking
const API_BASE_URL = process.env.NODE_ENV === 'test' 
  ? 'http://backend:8000'  // Docker internal network
  : (process.env.REACT_APP_API_URL || 'http://localhost:8000'); // External access

// Set Jest timeout for Docker integration tests
jest.setTimeout(120000); // 2 minutes for Docker tests

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { 
      retry: 2,
      staleTime: 0,
      cacheTime: 0,
    },
    mutations: { retry: 2 },
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

// Helper to make API calls using fetch (avoids axios mocking issues)
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
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
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

describe('🐳 Inventory Management - Docker Production Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    console.log('🐳 Starting Docker inventory tests...');
    console.log('🐳 API Base URL:', API_BASE_URL);
    
    // Wait for Docker backend to be ready with longer timeout
    let retries = 30; // 3 minutes total
    let backendReady = false;
    
    while (retries > 0 && !backendReady) {
      try {
        console.log(`🐳 Checking backend health... (${retries} retries left)`);
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
          const healthData = await response.json();
          console.log('🐳 Backend health check passed:', healthData);
          backendReady = true;
          break;
        }
      } catch (error) {
        console.log(`🐳 Backend not ready yet: ${error}`);
      }
      await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds
      retries--;
    }

    if (!backendReady) {
      throw new Error('🐳 Backend not ready after 3 minutes');
    }

    // Get real auth token
    console.log('🐳 Authenticating with backend...');
    authToken = await getAuthToken();
    console.log('🐳 Authentication successful');
    localStorage.setItem('access_token', authToken);
  });

  afterAll(() => {
    localStorage.removeItem('access_token');
    console.log('🐳 Docker inventory tests completed');
  });

  test('🐳 Backend health check and database connectivity', async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.database).toBe('connected');
    console.log('✅ Backend and database are healthy');
  });

  test('🐳 Authentication with real backend works', async () => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });

    expect(response.data.access_token).toBeDefined();
    expect(response.data.token_type).toBe('bearer');
    console.log('✅ Authentication working correctly');
  });

  test('🐳 Inventory items API connectivity and structure', async () => {
    const response = await apiCall('/inventory/items?limit=5', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.data).toHaveProperty('items');
    expect(response.data).toHaveProperty('total');
    expect(response.data).toHaveProperty('page');
    expect(response.data).toHaveProperty('limit');
    expect(Array.isArray(response.data.items)).toBe(true);
    console.log('✅ Inventory API structure is correct');
  });

  test('🐳 Categories API connectivity and structure', async () => {
    const response = await apiCall('/inventory/categories', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    console.log('✅ Categories API structure is correct');
  });

  test('🐳 Full CRUD operations - Category lifecycle', async () => {
    console.log('🐳 Testing category CRUD operations...');
    
    // CREATE category
    const createResponse = await apiCall('/inventory/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Docker Test Category',
        description: 'Category created in Docker production test',
      }),
    });

    expect(createResponse.data.id).toBeDefined();
    expect(createResponse.data.name).toBe('Docker Test Category');
    const categoryId = createResponse.data.id;
    console.log('✅ Category created successfully:', categoryId);

    // READ category
    const getResponse = await apiCall(`/inventory/categories/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(getResponse.data.name).toBe('Docker Test Category');
    expect(getResponse.data.description).toBe('Category created in Docker production test');
    console.log('✅ Category read successfully');

    // UPDATE category
    const updateResponse = await apiCall(`/inventory/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Updated Docker Test Category',
        description: 'Updated description',
      }),
    });

    expect(updateResponse.data.name).toBe('Updated Docker Test Category');
    expect(updateResponse.data.description).toBe('Updated description');
    console.log('✅ Category updated successfully');

    // DELETE category
    await apiCall(`/inventory/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Verify deletion
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
    console.log('✅ Category deleted successfully');
  });

  test('🐳 Full CRUD operations - Inventory item lifecycle', async () => {
    console.log('🐳 Testing inventory item CRUD operations...');
    
    // First create a category for the item
    const categoryResponse = await apiCall('/inventory/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Docker Items Test Category',
        description: 'Category for Docker item testing',
      }),
    });

    const categoryId = categoryResponse.data.id;
    console.log('✅ Test category created for items');

    // CREATE inventory item
    const createResponse = await apiCall('/inventory/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Docker Test Gold Ring',
        category_id: categoryId,
        weight_grams: 5.25,
        purchase_price: 150.00,
        sell_price: 225.00,
        stock_quantity: 12,
        min_stock_level: 3,
        description: 'Gold ring created in Docker production test',
      }),
    });

    expect(createResponse.data.id).toBeDefined();
    expect(createResponse.data.name).toBe('Docker Test Gold Ring');
    expect(createResponse.data.weight_grams).toBe(5.25);
    expect(createResponse.data.purchase_price).toBe(150.00);
    expect(createResponse.data.sell_price).toBe(225.00);
    expect(createResponse.data.stock_quantity).toBe(12);
    const itemId = createResponse.data.id;
    console.log('✅ Inventory item created successfully:', itemId);

    // READ inventory item
    const getResponse = await apiCall(`/inventory/items/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(getResponse.data.name).toBe('Docker Test Gold Ring');
    expect(getResponse.data.category_id).toBe(categoryId);
    expect(getResponse.data.description).toBe('Gold ring created in Docker production test');
    console.log('✅ Inventory item read successfully');

    // UPDATE inventory item
    const updateResponse = await apiCall(`/inventory/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        stock_quantity: 20,
        sell_price: 250.00,
        description: 'Updated gold ring description',
      }),
    });

    expect(updateResponse.data.stock_quantity).toBe(20);
    expect(updateResponse.data.sell_price).toBe(250.00);
    expect(updateResponse.data.description).toBe('Updated gold ring description');
    // Other fields should remain unchanged
    expect(updateResponse.data.name).toBe('Docker Test Gold Ring');
    expect(updateResponse.data.weight_grams).toBe(5.25);
    console.log('✅ Inventory item updated successfully');

    // DELETE inventory item
    await apiCall(`/inventory/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Verify item deletion
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
    console.log('✅ Inventory item deleted successfully');

    // Clean up category
    await apiCall(`/inventory/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    console.log('✅ Test category cleaned up');
  });

  test('🐳 Advanced filtering and pagination', async () => {
    console.log('🐳 Testing advanced filtering and pagination...');
    
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
    console.log('✅ Pagination working correctly');

    // Test search filtering
    const searchResponse = await apiCall('/inventory/items?search=gold', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(searchResponse.data).toHaveProperty('items');
    expect(Array.isArray(searchResponse.data.items)).toBe(true);
    console.log('✅ Search filtering working correctly');

    // Test low stock filtering
    const lowStockResponse = await apiCall('/inventory/items?low_stock=true', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(lowStockResponse.data).toHaveProperty('items');
    expect(Array.isArray(lowStockResponse.data.items)).toBe(true);
    console.log('✅ Low stock filtering working correctly');
  });

  test('🐳 Error handling and validation', async () => {
    console.log('🐳 Testing error handling and validation...');
    
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
    console.log('✅ Category validation working correctly');

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
    console.log('✅ Item validation working correctly');

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
    console.log('✅ Authentication validation working correctly');
  });

  test('🐳 Database persistence and consistency', async () => {
    console.log('🐳 Testing database persistence and consistency...');
    
    // Create test data
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
        weight_grams: 2.5,
        purchase_price: 60.00,
        sell_price: 90.00,
        stock_quantity: 8,
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
        weight_grams: 4.0,
        purchase_price: 100.00,
        sell_price: 150.00,
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
    expect(getItem1.data.weight_grams).toBe(2.5);

    expect(getItem2.data.name).toBe('Persistence Test Item 2');
    expect(getItem2.data.category_id).toBe(categoryId2);
    expect(getItem2.data.weight_grams).toBe(4.0);

    console.log('✅ Database persistence verified');

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

    console.log('✅ Test data cleaned up successfully');
  });
});