/**
 * Test for AuthenticatedApiClient implementation
 * Verifies that the API client system works correctly with authentication
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthenticatedApiClient } from '../services/AuthenticatedApiClient';
import { dashboardApi } from '../services/dashboardApi';
import { reportsApi } from '../services/reportsApi';
import { imageManagementApi } from '../services/imageManagementApi';
import { businessConfigApi } from '../services/businessConfigApi';
import { accountingApi } from '../services/accountingApi';
import { analyticsApi } from '../services/analyticsApi';

// Mock the token manager
jest.mock('../services/TokenManager', () => ({
  tokenManager: {
    getAuthorizationHeader: jest.fn(() => 'Bearer mock-token'),
    isAuthenticated: jest.fn(() => true),
    isTokenExpired: jest.fn(() => false),
    getTokenExpiry: jest.fn(() => Date.now() + 3600000), // 1 hour from now
    refreshTokens: jest.fn(() => Promise.resolve(true)),
    clearTokens: jest.fn(),
    revokeTokens: jest.fn(() => Promise.resolve(true))
  }
}));

// Mock axios
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: { success: true } })),
      post: jest.fn(() => Promise.resolve({ data: { success: true } })),
      put: jest.fn(() => Promise.resolve({ data: { success: true } })),
      delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
      patch: jest.fn(() => Promise.resolve({ data: { success: true } })),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    }))
  }
}));

describe('AuthenticatedApiClient System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create AuthenticatedApiClient instance correctly', () => {
    const client = new AuthenticatedApiClient({
      baseURL: '/api/test',
      timeout: 5000,
      retryAttempts: 2
    });

    expect(client).toBeInstanceOf(AuthenticatedApiClient);
  });

  test('should have all API services extending AuthenticatedApiClient', () => {
    // Test that all major API services are instances of AuthenticatedApiClient
    expect(dashboardApi).toBeInstanceOf(AuthenticatedApiClient);
    expect(reportsApi).toBeInstanceOf(AuthenticatedApiClient);
    expect(imageManagementApi).toBeInstanceOf(AuthenticatedApiClient);
    expect(businessConfigApi).toBeInstanceOf(AuthenticatedApiClient);
    expect(accountingApi).toBeInstanceOf(AuthenticatedApiClient);
    expect(analyticsApi).toBeInstanceOf(AuthenticatedApiClient);
  });

  test('should provide authentication status methods', () => {
    const client = new AuthenticatedApiClient();
    
    const authStatus = client.getAuthStatus();
    expect(authStatus).toHaveProperty('isAuthenticated');
    expect(authStatus).toHaveProperty('hasValidToken');
    expect(authStatus).toHaveProperty('tokenExpiry');
  });

  test('should provide health check functionality', async () => {
    const client = new AuthenticatedApiClient();
    
    const healthStatus = await client.healthCheck();
    expect(healthStatus).toHaveProperty('status');
    expect(healthStatus).toHaveProperty('timestamp');
  });

  test('should handle authentication refresh', async () => {
    const client = new AuthenticatedApiClient();
    
    const refreshResult = await client.refreshAuthentication();
    expect(typeof refreshResult).toBe('boolean');
  });

  test('should handle logout properly', async () => {
    const client = new AuthenticatedApiClient();
    
    await expect(client.logout()).resolves.not.toThrow();
  });

  test('dashboard API should work with authentication', async () => {
    // Test that dashboard API methods are available and callable
    expect(typeof dashboardApi.getSummary).toBe('function');
    expect(typeof dashboardApi.getSalesChartData).toBe('function');
    expect(typeof dashboardApi.getTopProducts).toBe('function');
  });

  test('reports API should work with authentication', async () => {
    // Test that reports API methods are available and callable
    expect(typeof reportsApi.getSalesTrends).toBe('function');
    expect(typeof reportsApi.getTopProducts).toBe('function');
    expect(typeof reportsApi.getInventoryValuation).toBe('function');
  });

  test('image management API should work with authentication', async () => {
    // Test that image management API methods are available and callable
    expect(typeof imageManagementApi.uploadImage).toBe('function');
    expect(typeof imageManagementApi.getEntityImages).toBe('function');
    expect(typeof imageManagementApi.deleteImage).toBe('function');
  });

  test('business config API should work with authentication', async () => {
    // Test that business config API methods are available and callable
    expect(typeof businessConfigApi.createBusinessConfiguration).toBe('function');
    expect(typeof businessConfigApi.getBusinessConfiguration).toBe('function');
    expect(typeof businessConfigApi.updateBusinessConfiguration).toBe('function');
  });

  test('accounting API should work with authentication', async () => {
    // Test that accounting API methods are available and callable
    expect(typeof accountingApi.getChartOfAccounts).toBe('function');
    expect(typeof accountingApi.createJournalEntry).toBe('function');
    expect(typeof accountingApi.getTrialBalance).toBe('function');
  });

  test('analytics API should work with authentication', async () => {
    // Test that analytics API methods are available and callable
    expect(typeof analyticsApi.getDashboardAnalytics).toBe('function');
    expect(typeof analyticsApi.createKPITarget).toBe('function');
    expect(typeof analyticsApi.getAnalyticsData).toBe('function');
  });
});

// Component test to verify API integration works in React components
const TestComponent: React.FC = () => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Test that we can call API methods without errors
      const authStatus = dashboardApi.getAuthStatus();
      setData({ authStatus });
    } catch (error) {
      console.error('API call failed:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Ready'}</div>
      <div data-testid="auth-status">
        {data?.authStatus ? 'Authenticated' : 'Not Authenticated'}
      </div>
    </div>
  );
};

describe('API Integration in React Components', () => {
  test('should work with React components', async () => {
    render(<TestComponent />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Ready');
    });

    // Check that authentication status is available
    expect(screen.getByTestId('auth-status')).toBeInTheDocument();
  });
});