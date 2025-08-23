import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CacheManagementDashboard } from '../components/analytics/CacheManagementDashboard';

// Mock fetch
global.fetch = jest.fn();

const mockCacheStats = {
  hit_rate: 0.85,
  miss_rate: 0.15,
  total_hits: 1250,
  total_misses: 220,
  total_keys: 150,
  memory_usage: 52428800, // 50MB
  evicted_keys: 25,
  expired_keys: 45
};

const mockCacheHealth = {
  status: 'healthy',
  redis_connected: true,
  memory_usage_percent: 65,
  response_time_ms: 12,
  last_check: '2024-01-15T10:30:00Z'
};

const mockPerformanceHistory = [
  {
    test_id: 'test-1',
    timestamp: '2024-01-15T10:00:00Z',
    cache_hit_rate: 0.88,
    average_response_time: 15.5,
    total_operations: 1000,
    success_rate: 0.99
  },
  {
    test_id: 'test-2',
    timestamp: '2024-01-15T09:00:00Z',
    cache_hit_rate: 0.82,
    average_response_time: 18.2,
    total_operations: 800,
    success_rate: 0.98
  }
];

const mockCacheKeys = [
  {
    key: 'analytics:kpi:revenue:2024-01',
    ttl_seconds: 3600,
    type: 'string',
    expires_at: '2024-01-15T11:30:00Z'
  },
  {
    key: 'analytics:forecast:demand:product-123',
    ttl_seconds: 7200,
    type: 'hash',
    expires_at: '2024-01-15T12:30:00Z'
  }
];

const mockCacheConfig = {
  ttl_strategies: {
    'kpi': 3600,
    'forecast': 7200,
    'report': 1800,
    'analytics': 900
  },
  default_ttl: 3600,
  cache_types: ['kpi', 'forecast', 'report', 'analytics']
};

describe('CacheManagementDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  const setupMockResponses = () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cache_statistics: mockCacheStats })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ health_status: mockCacheHealth })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ performance_history: mockPerformanceHistory })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCacheConfig
      });
  };

  test('renders cache management dashboard', async () => {
    setupMockResponses();

    render(<CacheManagementDashboard />);

    expect(screen.getByText('Cache Management')).toBeInTheDocument();
    expect(screen.getByText('Monitor and manage analytics caching system performance')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Cache Health Status')).toBeInTheDocument();
    });
  });

  test('displays cache statistics correctly', async () => {
    setupMockResponses();

    render(<CacheManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('85.0%')).toBeInTheDocument(); // Hit rate
      expect(screen.getByText('150')).toBeInTheDocument(); // Total keys
      expect(screen.getByText('50.0 MB')).toBeInTheDocument(); // Memory usage
      expect(screen.getByText('25')).toBeInTheDocument(); // Evicted keys
    });
  });

  test('displays health status correctly', async () => {
    setupMockResponses();

    render(<CacheManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('12ms')).toBeInTheDocument();
    });
  });

  test('handles cache operations', async () => {
    setupMockResponses();

    // Mock operation responses
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Cache invalidated' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Cache warmed' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Cache cleaned' }) });

    render(<CacheManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cache Operations')).toBeInTheDocument();
    });

    // Test cache invalidation
    const clearButton = screen.getByText('Clear Analytics Cache');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/cache/invalidate', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: 'analytics:*' })
      }));
    });
  });

  test('switches between tabs correctly', async () => {
    setupMockResponses();

    render(<CacheManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Switch to Performance tab
    const performanceTab = screen.getByText('Performance');
    fireEvent.click(performanceTab);

    expect(screen.getByText('Performance Testing')).toBeInTheDocument();
    expect(screen.getByText('Run Performance Test')).toBeInTheDocument();

    // Switch to Keys tab
    const keysTab = screen.getByText('Keys');
    fireEvent.click(keysTab);

    expect(screen.getByText('Cache Keys')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Key pattern (e.g., analytics:*)')).toBeInTheDocument();

    // Switch to Configuration tab
    const configTab = screen.getByText('Configuration');
    fireEvent.click(configTab);

    expect(screen.getByText('Cache Configuration')).toBeInTheDocument();
  });

  test('displays performance history', async () => {
    setupMockResponses();

    render(<CacheManagementDashboard />);

    // Switch to Performance tab
    await waitFor(() => {
      const performanceTab = screen.getByText('Performance');
      fireEvent.click(performanceTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Recent Performance Tests')).toBeInTheDocument();
      expect(screen.getByText('Hit Rate: 88.0%')).toBeInTheDocument();
      expect(screen.getByText('15.5ms')).toBeInTheDocument();
      expect(screen.getByText('1000 ops')).toBeInTheDocument();
    });
  });

  test('handles cache key search and deletion', async () => {
    setupMockResponses();

    // Mock keys response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ keys: mockCacheKeys })
    });

    render(<CacheManagementDashboard />);

    // Switch to Keys tab
    await waitFor(() => {
      const keysTab = screen.getByText('Keys');
      fireEvent.click(keysTab);
    });

    // Search for keys
    const searchInput = screen.getByPlaceholderText('Key pattern (e.g., analytics:*)');
    const searchButton = screen.getByText('Search');

    fireEvent.change(searchInput, { target: { value: 'analytics:kpi:*' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/cache/keys?pattern=analytics%3Akpi%3A*&limit=50');
    });
  });

  test('displays cache configuration', async () => {
    setupMockResponses();

    render(<CacheManagementDashboard />);

    // Switch to Configuration tab
    await waitFor(() => {
      const configTab = screen.getByText('Configuration');
      fireEvent.click(configTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Default TTL')).toBeInTheDocument();
      expect(screen.getByText('3600 seconds')).toBeInTheDocument();
      expect(screen.getByText('TTL Strategies by Cache Type')).toBeInTheDocument();
      expect(screen.getByText('kpi')).toBeInTheDocument();
      expect(screen.getByText('3600s')).toBeInTheDocument();
    });
  });

  test('handles performance test execution', async () => {
    setupMockResponses();

    // Mock performance test response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Performance test completed' })
    });

    render(<CacheManagementDashboard />);

    // Switch to Performance tab
    await waitFor(() => {
      const performanceTab = screen.getByText('Performance');
      fireEvent.click(performanceTab);
    });

    // Run performance test
    const testButton = screen.getByText('Run Performance Test');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/cache/performance/test');
    });
  });

  test('handles stress test execution', async () => {
    setupMockResponses();

    // Mock stress test response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Stress test completed' })
    });

    render(<CacheManagementDashboard />);

    // Switch to Performance tab
    await waitFor(() => {
      const performanceTab = screen.getByText('Performance');
      fireEvent.click(performanceTab);
    });

    // Run stress test
    const stressTestButton = screen.getByText('Run Stress Test');
    fireEvent.click(stressTestButton);

    expect(screen.getByText('Running Stress Test...')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/cache/performance/stress-test', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_seconds: 60, concurrent_users: 10 })
      }));
    });
  });

  test('handles error states', async () => {
    // Mock failed response
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<CacheManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch cache stats')).toBeInTheDocument();
    });
  });

  test('auto-refreshes data', async () => {
    setupMockResponses();

    // Mock timer
    jest.useFakeTimers();

    render(<CacheManagementDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    // Setup new mock responses for refresh
    setupMockResponses();

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(8); // 4 initial + 4 refresh
    });

    jest.useRealTimers();
  });

  test('handles refresh button click', async () => {
    setupMockResponses();

    render(<CacheManagementDashboard />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    // Setup new mock responses for refresh
    setupMockResponses();

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(8); // 4 initial + 4 refresh
    });
  });
});