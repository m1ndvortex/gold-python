import React from 'react';
import { render, screen } from '@testing-library/react';
import { CacheManagementDashboard } from '../components/analytics/CacheManagementDashboard';

// Mock fetch
global.fetch = jest.fn();

describe('CacheManagementDashboard - Simple Test', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    
    // Mock all API responses
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          cache_statistics: {
            hit_rate: 0.85,
            miss_rate: 0.15,
            total_hits: 1250,
            total_misses: 220,
            total_keys: 150,
            memory_usage: 52428800,
            evicted_keys: 25,
            expired_keys: 45
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          health_status: {
            status: 'healthy',
            redis_connected: true,
            memory_usage_percent: 65,
            response_time_ms: 12,
            last_check: '2024-01-15T10:30:00Z'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ performance_history: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ttl_strategies: { 'kpi': 3600 },
          default_ttl: 3600,
          cache_types: ['kpi']
        })
      });
  });

  test('renders without crashing', () => {
    render(<CacheManagementDashboard />);
    expect(screen.getByText('Cache Management')).toBeInTheDocument();
  });
});