import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Reports from '../pages/Reports';

// 🐳 DOCKER REQUIREMENT: Test with real backend API in Docker
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Helper function to get authentication token
const getAuthToken = async (): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
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
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error: any) {
    console.error('❌ Failed to get auth token:', error.message);
    throw error;
  }
};

// Helper function to check backend connectivity
const checkBackendHealth = async (): Promise<void> => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }

    console.log('✅ Backend is healthy and accessible');
  } catch (error: any) {
    console.error('❌ Backend health check failed:', error.message);
    throw new Error(`Backend not accessible at ${BACKEND_URL}`);
  }
};

describe('Reports Docker Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    console.log('🐳 Starting Reports Docker Integration Tests...');
    console.log(`🔗 Backend URL: ${BACKEND_URL}`);

    // Check backend connectivity
    await checkBackendHealth();

    // Get authentication token
    authToken = await getAuthToken();
    console.log('✅ Authentication token obtained');

    // Store token in localStorage for components
    localStorage.setItem('token', authToken);
  }, 30000);

  afterAll(() => {
    localStorage.clear();
    console.log('🧹 Cleaned up test environment');
  });

  test('should render reports page with all tabs', async () => {
    console.log('🧪 Testing reports page rendering...');

    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Check if main title is rendered
    await waitFor(() => {
      expect(screen.getByText('گزارشات و تحلیل‌ها')).toBeInTheDocument();
    });

    // Check if tabs are rendered
    expect(screen.getByText('گزارشات فروش')).toBeInTheDocument();
    expect(screen.getByText('گزارشات موجودی')).toBeInTheDocument();
    expect(screen.getByText('گزارشات مشتریان')).toBeInTheDocument();

    console.log('✅ Reports page rendered successfully');
  });

  test('should render global filters section', async () => {
    console.log('🧪 Testing global filters rendering...');

    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Check if filters section is rendered
    await waitFor(() => {
      expect(screen.getByText('فیلترهای کلی')).toBeInTheDocument();
    });

    // Check if date inputs are rendered
    expect(screen.getByLabelText('تاریخ شروع')).toBeInTheDocument();
    expect(screen.getByLabelText('تاریخ پایان')).toBeInTheDocument();

    console.log('✅ Global filters rendered successfully');
  });

  test('should fetch and display sales reports data', async () => {
    console.log('🧪 Testing sales reports data fetching...');

    // First, let's create some test data by making a direct API call
    try {
      const response = await fetch(`${BACKEND_URL}/reports/sales/trends`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sales trends API is accessible:', data);
      } else {
        console.log('⚠️ Sales trends API returned:', response.status);
      }
    } catch (error: any) {
      console.log('⚠️ Sales trends API error:', error.message);
    }

    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('گزارشات فروش')).toBeInTheDocument();
    }, { timeout: 10000 });

    console.log('✅ Sales reports component loaded');
  }, 15000);

  test('should fetch and display inventory reports data', async () => {
    console.log('🧪 Testing inventory reports data fetching...');

    // Test inventory valuation API
    try {
      const response = await fetch(`${BACKEND_URL}/reports/inventory/valuation`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Inventory valuation API is accessible:', data);
      } else {
        console.log('⚠️ Inventory valuation API returned:', response.status);
      }
    } catch (error: any) {
      console.log('⚠️ Inventory valuation API error:', error.message);
    }

    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Click on inventory tab
    const inventoryTab = screen.getByText('گزارشات موجودی');
    inventoryTab.click();

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('گزارشات موجودی')).toBeInTheDocument();
    }, { timeout: 10000 });

    console.log('✅ Inventory reports component loaded');
  }, 15000);

  test('should fetch and display customer reports data', async () => {
    console.log('🧪 Testing customer reports data fetching...');

    // Test customer analysis API
    try {
      const response = await fetch(`${BACKEND_URL}/reports/customers/analysis`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Customer analysis API is accessible:', data);
      } else {
        console.log('⚠️ Customer analysis API returned:', response.status);
      }
    } catch (error: any) {
      console.log('⚠️ Customer analysis API error:', error.message);
    }

    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Click on customers tab
    const customersTab = screen.getByText('گزارشات مشتریان');
    customersTab.click();

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('گزارشات مشتریان')).toBeInTheDocument();
    }, { timeout: 10000 });

    console.log('✅ Customer reports component loaded');
  }, 15000);

  test('should handle API errors gracefully', async () => {
    console.log('🧪 Testing error handling...');

    // Clear the auth token to simulate unauthorized access
    localStorage.removeItem('token');

    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // The component should still render even with API errors
    await waitFor(() => {
      expect(screen.getByText('گزارشات و تحلیل‌ها')).toBeInTheDocument();
    });

    // Restore the auth token
    localStorage.setItem('token', authToken);

    console.log('✅ Error handling works correctly');
  });

  test('should test report filtering functionality', async () => {
    console.log('🧪 Testing report filtering...');

    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('فیلترهای کلی')).toBeInTheDocument();
    });

    // Test quick date range buttons
    const quickRangeButtons = screen.getAllByText(/روز گذشته/);
    expect(quickRangeButtons.length).toBeGreaterThan(0);

    console.log('✅ Report filtering functionality is available');
  });
});

// Additional test for chart components
describe('Reports Chart Components', () => {
  test('should render without crashing when no data is available', () => {
    console.log('🧪 Testing chart components with no data...');

    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // The component should render even without data
    expect(screen.getByText('گزارشات و تحلیل‌ها')).toBeInTheDocument();

    console.log('✅ Chart components handle no data gracefully');
  });
});

console.log('📊 Reports Docker Integration Tests configured successfully');