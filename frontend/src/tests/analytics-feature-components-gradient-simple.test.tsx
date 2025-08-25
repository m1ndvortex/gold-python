import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CostAnalysisDashboard } from '../components/analytics/CostAnalysisDashboard';
import { CacheManagementDashboard } from '../components/analytics/CacheManagementDashboard';
import AlertNotificationPanel from '../components/analytics/AlertNotificationPanel';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock WebSocket
const MockWebSocket = jest.fn().mockImplementation(() => ({
  onopen: jest.fn(),
  onmessage: jest.fn(),
  onclose: jest.fn(),
  onerror: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
}));

(MockWebSocket as any).CONNECTING = 0;
(MockWebSocket as any).OPEN = 1;
(MockWebSocket as any).CLOSING = 2;
(MockWebSocket as any).CLOSED = 3;

global.WebSocket = MockWebSocket as any;

// Mock Notification API
global.Notification = {
  permission: 'granted',
  requestPermission: jest.fn().mockResolvedValue('granted'),
} as any;

// Mock chart components to avoid canvas issues
jest.mock('../components/analytics/charts/TrendChart', () => ({
  TrendChart: ({ data }: any) => <div data-testid="trend-chart">Trend Chart with {data?.length || 0} points</div>
}));

jest.mock('../components/analytics/charts/HeatmapChart', () => ({
  HeatmapChart: ({ data }: any) => <div data-testid="heatmap-chart">Heatmap Chart with {data?.length || 0} points</div>
}));

jest.mock('../components/analytics/charts/ChartExportMenu', () => ({
  ChartExportMenu: () => <div data-testid="chart-export-menu">Export Menu</div>
}));

jest.mock('../components/analytics/MetricCard', () => ({
  MetricCard: ({ data }: any) => <div data-testid="metric-card">{data.title}: {data.value}</div>
}));

jest.mock('../components/analytics/TimeRangeSelector', () => ({
  TimeRangeSelector: ({ value, onChange }: any) => (
    <select data-testid="time-range-selector" onChange={(e) => onChange({ period: e.target.value })}>
      <option value="month">Last 30 Days</option>
      <option value="quarter">Last 90 Days</option>
    </select>
  )
}));

describe('Analytics Feature Components - Gradient Styling (Production Ready)', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.clearAllMocks();
  });

  describe('CostAnalysisDashboard - Gradient Implementation', () => {
    const mockCostData = {
      total_cost: 50000,
      cost_breakdown: [
        { category: 'Labor', amount: 20000, percentage: 40, trend: 'up', change: 5.2 },
        { category: 'Materials', amount: 25000, percentage: 50, trend: 'down', change: -2.1 },
      ],
      optimization_recommendations: [
        {
          id: '1',
          title: 'Optimize Labor Costs',
          description: 'Reduce overtime hours',
          potential_savings: 5000,
          priority: 'high',
          category: 'Labor',
          implementation_effort: 'medium'
        }
      ],
      cost_trends: [
        { date: '2024-01-01', total_cost: 48000, labor_cost: 19000, material_cost: 24000, overhead_cost: 5000 }
      ],
      roi_metrics: {
        current_roi: 15.5,
        projected_roi: 18.2,
        cost_per_unit: 125.50,
        efficiency_score: 78.5
      }
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCostData),
      });
    });

    test('renders with proper gradient header styling', async () => {
      await act(async () => {
        render(<CostAnalysisDashboard />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Cost Analysis Dashboard')).toBeInTheDocument();
      });

      // Verify gradient icon container exists
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-green-500.via-emerald-500.to-teal-500');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('shadow-lg');

      // Verify gradient badge exists
      const badge = screen.getByText('Cost Optimized');
      expect(badge.closest('.bg-green-50.text-green-700.border-green-200')).toBeInTheDocument();
    });

    test('implements gradient tab navigation system', async () => {
      await act(async () => {
        render(<CostAnalysisDashboard />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Cost Analysis Dashboard')).toBeInTheDocument();
      });

      // Verify gradient tab container
      const tabContainer = document.querySelector('.bg-gradient-to-r.from-green-50.via-emerald-50.to-teal-50');
      expect(tabContainer).toBeInTheDocument();
      expect(tabContainer).toHaveClass('border-b-2', 'border-green-200');

      // Verify tab triggers have proper gradient styling
      const costBreakdownTab = screen.getByText('Cost Breakdown');
      const tabTrigger = costBreakdownTab.closest('.hover\\:bg-white.hover\\:shadow-sm');
      expect(tabTrigger).toBeInTheDocument();
      expect(tabTrigger).toHaveClass('transition-all', 'duration-300');
    });

    test('applies gradient backgrounds to content cards', async () => {
      await act(async () => {
        render(<CostAnalysisDashboard />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Cost Distribution')).toBeInTheDocument();
      });

      // Verify gradient card backgrounds
      const gradientCards = document.querySelectorAll('.bg-gradient-to-br.from-green-50.to-green-100\\/50');
      expect(gradientCards.length).toBeGreaterThan(0);
      
      // Verify hover effects
      const hoverCards = document.querySelectorAll('.hover\\:shadow-xl');
      expect(hoverCards.length).toBeGreaterThan(0);
    });

    test('handles error states with gradient styling', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));
      
      await act(async () => {
        render(<CostAnalysisDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      // Error alert should still maintain styling
      const errorAlert = screen.getByText('API Error').closest('[role="alert"]');
      expect(errorAlert).toBeInTheDocument();
    });
  });

  describe('CacheManagementDashboard - Gradient Implementation', () => {
    const mockCacheData = {
      cache_statistics: {
        hit_rate: 0.85,
        miss_rate: 0.15,
        total_hits: 1000,
        total_misses: 150,
        total_keys: 500,
        memory_usage: 1024 * 1024 * 50,
        evicted_keys: 25,
        expired_keys: 10
      },
      health_status: {
        status: 'healthy',
        redis_connected: true,
        memory_usage_percent: 65,
        response_time_ms: 2.5,
        last_check: new Date().toISOString()
      },
      performance_history: [],
      ttl_strategies: { analytics: 3600, reports: 1800, cache: 900 },
      default_ttl: 3600,
      cache_types: ['analytics', 'reports', 'cache']
    };

    beforeEach(() => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/cache/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ cache_statistics: mockCacheData.cache_statistics }),
          });
        }
        if (url.includes('/api/cache/health')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ health_status: mockCacheData.health_status }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });
    });

    test('renders with proper gradient header styling', async () => {
      await act(async () => {
        render(<CacheManagementDashboard />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Cache Management')).toBeInTheDocument();
      });

      // Verify gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-purple-500.via-violet-500.to-indigo-500');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('shadow-lg');

      // Verify gradient badge
      const badge = screen.getByText('Real-time Monitoring');
      expect(badge.closest('.bg-purple-50.text-purple-700.border-purple-200')).toBeInTheDocument();
    });

    test('implements gradient health status card', async () => {
      await act(async () => {
        render(<CacheManagementDashboard />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Cache Health Status')).toBeInTheDocument();
      });

      // Verify gradient health status container
      const healthCard = document.querySelector('.bg-gradient-to-r.from-slate-50.to-slate-100\\/80');
      expect(healthCard).toBeInTheDocument();
      expect(healthCard).toHaveClass('shadow-lg');
    });

    test('applies gradient styling to metric cards', async () => {
      await act(async () => {
        render(<CacheManagementDashboard />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Hit Rate')).toBeInTheDocument();
      });

      // Verify different gradient metric cards
      expect(document.querySelector('.from-green-50.to-green-100\\/50')).toBeInTheDocument();
      expect(document.querySelector('.from-blue-50.to-blue-100\\/50')).toBeInTheDocument();
      expect(document.querySelector('.from-purple-50.to-purple-100\\/50')).toBeInTheDocument();
      expect(document.querySelector('.from-orange-50.to-orange-100\\/50')).toBeInTheDocument();
    });
  });

  describe('AlertNotificationPanel - Gradient Implementation', () => {
    beforeEach(() => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/alerts/history')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        if (url.includes('/api/alerts/rules')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        if (url.includes('/api/alerts/summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              total_alerts: 0,
              acknowledged_alerts: 0,
              unacknowledged_alerts: 0,
              severity_breakdown: {},
              active_rules: 0,
              generated_at: new Date().toISOString()
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });
    });

    test('renders with proper gradient header styling', async () => {
      await act(async () => {
        render(<AlertNotificationPanel />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Alert Notifications')).toBeInTheDocument();
      });

      // Verify gradient header container
      const headerContainer = document.querySelector('.bg-gradient-to-r.from-red-50.via-orange-50.to-yellow-50');
      expect(headerContainer).toBeInTheDocument();
      expect(headerContainer).toHaveClass('border-b-2', 'border-red-200');

      // Verify gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-red-500.to-orange-600');
      expect(iconContainer).toBeInTheDocument();
    });

    test('implements gradient action buttons', async () => {
      await act(async () => {
        render(<AlertNotificationPanel />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Check Now')).toBeInTheDocument();
      });

      // Verify gradient buttons
      const checkButton = screen.getByText('Check Now');
      expect(checkButton.closest('.bg-gradient-to-r.from-blue-500.to-indigo-600')).toBeInTheDocument();
      expect(checkButton.closest('.shadow-lg.hover\\:shadow-xl')).toBeInTheDocument();

      const rulesButton = screen.getByText('Rules (0)');
      expect(rulesButton.closest('.bg-gradient-to-r.from-purple-500.to-violet-600')).toBeInTheDocument();
    });

    test('applies gradient content background', async () => {
      await act(async () => {
        render(<AlertNotificationPanel />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Alert Notifications')).toBeInTheDocument();
      });

      // Verify gradient content background
      const contentContainer = document.querySelector('.bg-gradient-to-br.from-red-50\\/30.to-white');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Gradient Design System Compliance', () => {
    test('maintains consistent color palette across components', async () => {
      // Test multiple components use consistent gradient patterns
      const { rerender } = render(<CostAnalysisDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Cost Analysis Dashboard')).toBeInTheDocument();
      });
      
      // Check for green gradient usage in CostAnalysisDashboard
      expect(document.querySelector('.from-green-500.via-emerald-500.to-teal-500')).toBeInTheDocument();
      
      // Test CacheManagementDashboard
      await act(async () => {
        rerender(<CacheManagementDashboard />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Cache Management')).toBeInTheDocument();
      });
      
      // Check for purple gradient usage in CacheManagementDashboard
      expect(document.querySelector('.from-purple-500.via-violet-500.to-indigo-500')).toBeInTheDocument();
    });

    test('implements proper hover effects and transitions', async () => {
      await act(async () => {
        render(<CacheManagementDashboard />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Cache Management')).toBeInTheDocument();
      });
      
      // Check for hover shadow effects
      const hoverCards = document.querySelectorAll('.hover\\:shadow-xl');
      expect(hoverCards.length).toBeGreaterThan(0);
      
      // Check for transition classes
      const transitionElements = document.querySelectorAll('.transition-all.duration-300');
      expect(transitionElements.length).toBeGreaterThan(0);
    });

    test('maintains proper contrast with gradient backgrounds', async () => {
      await act(async () => {
        render(<AlertNotificationPanel />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Alert Notifications')).toBeInTheDocument();
      });
      
      // Check for proper text color classes with gradient backgrounds
      const whiteTextElements = document.querySelectorAll('.text-white');
      expect(whiteTextElements.length).toBeGreaterThan(0);
      
      // Check for proper foreground text classes
      const foregroundTextElements = document.querySelectorAll('.text-foreground');
      expect(foregroundTextElements.length).toBeGreaterThan(0);
    });

    test('implements responsive gradient layouts', async () => {
      await act(async () => {
        render(<CacheManagementDashboard />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Cache Management')).toBeInTheDocument();
      });
      
      // Check for responsive grid classes
      const responsiveGrids = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-4');
      expect(responsiveGrids.length).toBeGreaterThan(0);
      
      // Check for responsive tab layout
      const responsiveTabs = document.querySelector('.grid.w-full.grid-cols-4');
      expect(responsiveTabs).toBeInTheDocument();
    });

    test('all components render without critical errors', async () => {
      // Test that all components can render without throwing errors
      const components = [
        { component: <CostAnalysisDashboard key="cost" />, name: 'CostAnalysisDashboard' },
        { component: <CacheManagementDashboard key="cache" />, name: 'CacheManagementDashboard' },
        { component: <AlertNotificationPanel key="alert" />, name: 'AlertNotificationPanel' }
      ];

      for (const { component, name } of components) {
        await act(async () => {
          const { unmount } = render(component);
          // Component should render without throwing
          expect(document.body).toBeInTheDocument();
          unmount();
        });
      }
    });
  });

  describe('Production Readiness Verification', () => {
    test('components handle API failures gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network Error'));
      
      await act(async () => {
        render(<CostAnalysisDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Network Error')).toBeInTheDocument();
      });
      
      // Error state should still maintain gradient styling
      const errorAlert = screen.getByText('Network Error').closest('[role="alert"]');
      expect(errorAlert).toBeInTheDocument();
    });

    test('components maintain accessibility with gradient styling', async () => {
      await act(async () => {
        render(<AlertNotificationPanel />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Alert Notifications')).toBeInTheDocument();
      });
      
      // Check for proper ARIA roles and labels
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Gradient buttons should still be accessible
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    test('gradient styling works with loading states', async () => {
      // Mock a slow API response
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      await act(async () => {
        render(<CostAnalysisDashboard />);
      });

      // Loading spinner should be visible
      const loadingSpinner = screen.getByRole('status');
      expect(loadingSpinner).toBeInTheDocument();
      expect(loadingSpinner).toHaveClass('animate-spin');
    });
  });
});