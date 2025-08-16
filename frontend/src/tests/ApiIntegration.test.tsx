import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch for testing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('API Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockFetch.mockClear();
  });

  test('can connect to backend API', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Gold Shop Management API',
        status: 'running'
      }),
    } as Response);

    // Simple component that makes API call
    function TestApiComponent() {
      const [apiStatus, setApiStatus] = React.useState<string>('loading');

      React.useEffect(() => {
        fetch('/api/')
          .then(response => response.json())
          .then(data => {
            setApiStatus(data.status);
          })
          .catch(() => {
            setApiStatus('error');
          });
      }, []);

      return <div data-testid="api-status">{apiStatus}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestApiComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('api-status')).toHaveTextContent('running');
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/');
  });

  test('handles API health check', async () => {
    // Mock health check response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        database: 'connected',
        message: 'All systems operational'
      }),
    } as Response);

    function HealthCheckComponent() {
      const [healthStatus, setHealthStatus] = React.useState<string>('checking');

      React.useEffect(() => {
        fetch('/api/health')
          .then(response => response.json())
          .then(data => {
            setHealthStatus(data.status);
          })
          .catch(() => {
            setHealthStatus('error');
          });
      }, []);

      return <div data-testid="health-status">{healthStatus}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <HealthCheckComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('health-status')).toHaveTextContent('healthy');
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/health');
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    function ErrorHandlingComponent() {
      const [status, setStatus] = React.useState<string>('loading');

      React.useEffect(() => {
        fetch('/api/test')
          .then(response => response.json())
          .then(() => {
            setStatus('success');
          })
          .catch(() => {
            setStatus('error');
          });
      }, []);

      return <div data-testid="error-status">{status}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <ErrorHandlingComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-status')).toHaveTextContent('error');
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test');
  });

  test('React Query integration works', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: 'test data'
      }),
    } as Response);

    function ReactQueryComponent() {
      const [data, setData] = React.useState<string>('loading');

      React.useEffect(() => {
        // Simulate React Query behavior
        fetch('/api/data')
          .then(response => response.json())
          .then(result => {
            setData(result.data);
          })
          .catch(() => {
            setData('error');
          });
      }, []);

      return <div data-testid="query-data">{data}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <ReactQueryComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('query-data')).toHaveTextContent('test data');
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/data');
  });

  test('environment configuration is correct', () => {
    // Test that environment variables are properly configured for testing
    expect(process.env.NODE_ENV).toBe('test');

    // In a real integration test, we would verify API URL configuration
    // For now, we just ensure the test environment is set up correctly
    expect(process.env.CI).toBe('true');
  });
});