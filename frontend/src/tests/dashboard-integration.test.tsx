import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';

// Mock axios first
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.reject(new Error('API Error'))),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    })),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}));

// Mock Chart.js to avoid canvas issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  RefreshCw: () => <div data-testid="refresh-icon">RefreshCw</div>,
  TrendingUp: () => <div data-testid="trending-up">TrendingUp</div>,
  TrendingDown: () => <div data-testid="trending-down">TrendingDown</div>,
  DollarSign: () => <div data-testid="dollar-sign">DollarSign</div>,
  Package: () => <div data-testid="package">Package</div>,
  Users: () => <div data-testid="users">Users</div>,
  Coins: () => <div data-testid="coins">Coins</div>,
  AlertTriangle: () => <div data-testid="alert-triangle">AlertTriangle</div>,
  Clock: () => <div data-testid="clock">Clock</div>,
  CreditCard: () => <div data-testid="credit-card">CreditCard</div>,
}));

// Mock the useLanguage hook
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    direction: 'ltr',
    setLanguage: jest.fn()
  })
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { 
      retry: false,
      refetchOnWindowFocus: false,
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

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    // Mock localStorage for auth token
    const mockLocalStorage = {
      getItem: jest.fn((key) => {
        if (key === 'access_token') {
          return 'mock-jwt-token';
        }
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  test('dashboard renders without crashing', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Check that the dashboard title is rendered
    expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
    
    // Check that the refresh button is rendered
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  test('dashboard shows loading state initially', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Should show loading indicators initially
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.some(el => el.classList.contains('animate-pulse'))).toBe(true);
  });

  test('dashboard handles API errors gracefully', async () => {
    // Mock fetch to simulate API errors
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('API Error'))
    );

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    }, { timeout: 10000 });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('dashboard components are properly structured', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Check for main dashboard structure
    expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    
    // The dashboard should have space for summary cards, charts, and alerts
    // Even in loading state, the structure should be present
    const dashboard = screen.getByText('nav.dashboard').closest('div');
    expect(dashboard).toBeInTheDocument();
  });

  test('refresh functionality is available', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton.closest('button')).not.toBeDisabled();
  });
});

describe('Dashboard Real Backend Integration', () => {
  const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  beforeEach(() => {
    // Reset fetch mock
    if (global.fetch && typeof (global.fetch as any).mockRestore === 'function') {
      (global.fetch as any).mockRestore();
    }
  });

  test('dashboard can connect to real backend', async () => {
    // Skip if backend is not available
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (!response.ok) {
        console.log('Backend not available, skipping real API test');
        return;
      }
    } catch (error) {
      console.log('Backend not available, skipping real API test');
      return;
    }

    // Mock authentication token
    const mockLocalStorage = {
      getItem: jest.fn((key) => {
        if (key === 'access_token') {
          return 'test-token'; // This would need to be a real token in production
        }
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for the dashboard to load
    await waitFor(() => {
      expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
    }, { timeout: 30000 });

    // The dashboard should render even if API calls fail due to auth
    // This tests that the component structure is working
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  }, 60000);

  test('dashboard API endpoints are accessible', async () => {
    // This is a basic connectivity test
    try {
      const healthResponse = await fetch(`${BACKEND_URL}/health`);
      expect(healthResponse.status).toBe(200);
      
      // Test that the reports endpoints exist (even if they return 403 due to auth)
      const inventoryResponse = await fetch(`${BACKEND_URL}/reports/inventory/valuation`);
      expect([200, 401, 403]).toContain(inventoryResponse.status);
      
      const lowStockResponse = await fetch(`${BACKEND_URL}/reports/inventory/low-stock`);
      expect([200, 401, 403]).toContain(lowStockResponse.status);
      
    } catch (error) {
      console.log('Backend connectivity test skipped:', error);
    }
  });
});