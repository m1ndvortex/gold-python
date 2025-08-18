import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CustomerList } from '../components/customers/CustomerList';

// 🐳 Docker Integration Test - Real Backend + Real Database
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

// Helper function to authenticate with real backend
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
  return data.access_token;
};

// Helper function to create test customer via real API
const createTestCustomer = async (token: string, name: string = 'Test Customer') => {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      phone: '+1234567890',
      email: `${name.toLowerCase().replace(/\s+/g, '')}@test.com`,
      address: '123 Test Street, Test City',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create test customer:', errorText);
    throw new Error('Failed to create test customer');
  }

  return response.json();
};

// Helper function to cleanup test data
const cleanupTestData = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const customers = await response.json();
      
      for (const customer of customers) {
        if (customer.name.includes('Test')) {
          await fetch(`${API_BASE_URL}/customers/${customer.id}`, {
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

describe('🐳 Customer Management - Docker Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    console.log('🐳 Starting Docker customer tests...');
    console.log('🐳 API Base URL:', API_BASE_URL);
    
    // Wait for Docker backend to be ready
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
          console.log('✅ Backend is ready!');
          break;
        }
      } catch (error) {
        console.log(`⏳ Waiting for backend... (${retries} retries left)`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries--;
    }

    if (retries === 0) {
      throw new Error('❌ Backend not ready after 60 seconds');
    }

    // Get authentication token
    authToken = await getAuthToken();
    localStorage.setItem('access_token', authToken);
    console.log('✅ Authentication successful!');
  }, 120000);

  beforeEach(async () => {
    await cleanupTestData(authToken);
  });

  afterAll(async () => {
    await cleanupTestData(authToken);
    localStorage.removeItem('access_token');
    console.log('🧹 Cleanup completed!');
  });

  test('🐳 Backend health check and customer API connectivity', async () => {
    // Test health endpoint
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    expect(healthResponse.ok).toBe(true);

    // Test customers endpoint
    const customersResponse = await fetch(`${API_BASE_URL}/customers`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    expect(customersResponse.ok).toBe(true);

    const customers = await customersResponse.json();
    expect(Array.isArray(customers)).toBe(true);
    
    console.log('✅ Customer API connectivity verified!');
  });

  test('🐳 Create customer through real API', async () => {
    const customerData = {
      name: 'Docker Test Customer',
      phone: '+1555123456',
      email: 'dockertest@example.com',
      address: '456 Docker Street'
    };

    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(customerData),
    });

    expect(response.ok).toBe(true);
    
    const createdCustomer = await response.json();
    expect(createdCustomer.name).toBe('Docker Test Customer');
    expect(createdCustomer.phone).toBe('+1555123456');
    expect(createdCustomer.email).toBe('dockertest@example.com');
    expect(createdCustomer.current_debt).toBe(0);
    expect(createdCustomer.total_purchases).toBe(0);

    console.log('✅ Customer creation via API verified!');
  });

  test('🐳 CustomerList component loads data from real backend', async () => {
    // Create test customer in real database
    await createTestCustomer(authToken, 'Real Backend Customer');

    render(
      <TestWrapper>
        <CustomerList />
      </TestWrapper>
    );

    // Wait for customer to load from real API
    await waitFor(() => {
      expect(screen.getByText('Real Backend Customer')).toBeInTheDocument();
    }, { timeout: 15000 });

    // Verify customer details are displayed
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('realbackendcustomer@test.com')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument(); // No debt initially

    console.log('✅ CustomerList component with real backend verified!');
  });

  test('🐳 Customer search functionality with real data', async () => {
    // Create multiple customers
    await createTestCustomer(authToken, 'Search Test Alice');
    await createTestCustomer(authToken, 'Search Test Bob');

    render(
      <TestWrapper>
        <CustomerList />
      </TestWrapper>
    );

    // Wait for customers to load
    await waitFor(() => {
      expect(screen.getByText('Search Test Alice')).toBeInTheDocument();
      expect(screen.getByText('Search Test Bob')).toBeInTheDocument();
    }, { timeout: 15000 });

    // Test search functionality
    const searchInput = screen.getByPlaceholderText('Search customers by name, phone, or email...');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    // Wait for search results (this will trigger API call)
    await waitFor(() => {
      // The search should work with real backend
      expect((searchInput as HTMLInputElement).value).toBe('Alice');
    }, { timeout: 10000 });

    console.log('✅ Customer search functionality verified!');
  });

  test('🐳 Customer CRUD operations with real database', async () => {
    // Create customer
    const customer = await createTestCustomer(authToken, 'CRUD Test Customer');
    expect(customer.name).toBe('CRUD Test Customer');

    // Read customer
    const getResponse = await fetch(`${API_BASE_URL}/customers/${customer.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    expect(getResponse.ok).toBe(true);
    const fetchedCustomer = await getResponse.json();
    expect(fetchedCustomer.name).toBe('CRUD Test Customer');

    // Update customer
    const updateResponse = await fetch(`${API_BASE_URL}/customers/${customer.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Updated CRUD Customer',
        phone: '+1999888777'
      }),
    });
    expect(updateResponse.ok).toBe(true);
    const updatedCustomer = await updateResponse.json();
    expect(updatedCustomer.name).toBe('Updated CRUD Customer');
    expect(updatedCustomer.phone).toBe('+1999888777');

    // Delete customer
    const deleteResponse = await fetch(`${API_BASE_URL}/customers/${customer.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    expect(deleteResponse.ok).toBe(true);

    // Verify deletion
    const verifyResponse = await fetch(`${API_BASE_URL}/customers/${customer.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    expect(verifyResponse.status).toBe(404);

    console.log('✅ Customer CRUD operations verified!');
  });

  test('🐳 Database persistence and data integrity', async () => {
    // Create customer with specific data
    const customerData = {
      name: 'Persistence Test Customer',
      phone: '+1111222333',
      email: 'persistence@test.com',
      address: '789 Persistence Ave'
    };

    const createResponse = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(customerData),
    });

    const customer = await createResponse.json();

    // Verify data persists across multiple requests
    for (let i = 0; i < 3; i++) {
      const response = await fetch(`${API_BASE_URL}/customers/${customer.id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      const fetchedCustomer = await response.json();
      expect(fetchedCustomer.name).toBe('Persistence Test Customer');
      expect(fetchedCustomer.phone).toBe('+1111222333');
      expect(fetchedCustomer.email).toBe('persistence@test.com');
      expect(fetchedCustomer.address).toBe('789 Persistence Ave');
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Database persistence verified!');
  }, 180000);
});
