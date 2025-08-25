import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryPerformanceAnalyzer from '../components/analytics/CategoryPerformanceAnalyzer';
import SeasonalAnalysis from '../components/analytics/SeasonalAnalysis';
import CrossSellingAnalyzer from '../components/analytics/CrossSellingAnalyzer';

// Mock fetch for API calls
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock ResizeObserver for recharts compatibility
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

global.ResizeObserver = MockResizeObserver as any;

// Mock recharts components to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  ScatterChart: ({ children }: any) => <div data-testid="scatter-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Scatter: () => <div data-testid="scatter" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
}));

describe('Category Intelligence Components - Gradient Styling', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('CategoryPerformanceAnalyzer', () => {
    it('should render with gradient styling', async () => {
      const mockData = [
        {
          category_id: '1',
          category_name: 'Test Category',
          total_revenue: 1000,
          total_quantity_sold: 50,
          avg_transaction_value: 20,
          profit_margin: 0.3,
          velocity_score: 0.8,
          performance_tier: 'fast',
          contribution_percentage: 15,
          trend_direction: 'up',
          trend_percentage: 5
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      } as Response);

      let container: HTMLElement;
      
      await act(async () => {
        const result = render(<CategoryPerformanceAnalyzer />);
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText('Category Performance Analysis')).toBeInTheDocument();
      });

      // Check for gradient classes in the DOM
      const gradientElements = container!.querySelectorAll('[class*="gradient"]');
      expect(gradientElements.length).toBeGreaterThan(0);

      // Check for shadow classes
      const shadowElements = container!.querySelectorAll('[class*="shadow"]');
      expect(shadowElements.length).toBeGreaterThan(0);
    });
  });

  describe('SeasonalAnalysis', () => {
    it('should render with gradient styling', async () => {
      const mockData = [
        {
          category_id: '1',
          category_name: 'Test Category',
          seasonal_index: { '1': 1.2, '2': 0.8 },
          peak_months: ['1'],
          low_months: ['2'],
          seasonality_strength: 0.8,
          forecast_next_month: 1000,
          confidence_interval: [800, 1200] as [number, number]
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      } as Response);

      let container: HTMLElement;
      
      await act(async () => {
        const result = render(<SeasonalAnalysis />);
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText('Seasonal Pattern Analysis')).toBeInTheDocument();
      });

      // Check for gradient classes
      const gradientElements = container!.querySelectorAll('[class*="gradient"]');
      expect(gradientElements.length).toBeGreaterThan(0);

      // Check for shadow classes
      const shadowElements = container!.querySelectorAll('[class*="shadow"]');
      expect(shadowElements.length).toBeGreaterThan(0);
    });
  });

  describe('CrossSellingAnalyzer', () => {
    it('should render with gradient styling', async () => {
      const mockData = [
        {
          primary_category_id: '1',
          primary_category_name: 'Category A',
          recommended_category_id: '2',
          recommended_category_name: 'Category B',
          confidence_score: 0.8,
          lift_ratio: 2.5,
          support: 0.1,
          expected_revenue_increase: 500
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      } as Response);

      let container: HTMLElement;
      
      await act(async () => {
        const result = render(<CrossSellingAnalyzer />);
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText('Cross-Selling Analysis Controls')).toBeInTheDocument();
      });

      // Check for gradient classes
      const gradientElements = container!.querySelectorAll('[class*="gradient"]');
      expect(gradientElements.length).toBeGreaterThan(0);

      // Check for shadow classes
      const shadowElements = container!.querySelectorAll('[class*="shadow"]');
      expect(shadowElements.length).toBeGreaterThan(0);
    });
  });

  describe('Gradient Styling Integration', () => {
    it('should render all components with consistent gradient styling', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      } as Response);

      let container: HTMLElement;
      
      await act(async () => {
        const result = render(
          <div>
            <CategoryPerformanceAnalyzer />
            <SeasonalAnalysis />
            <CrossSellingAnalyzer />
          </div>
        );
        container = result.container;
      });

      await waitFor(() => {
        // Check for gradient classes across all components
        const gradientElements = container!.querySelectorAll('[class*="gradient"]');
        expect(gradientElements.length).toBeGreaterThan(0);

        // Check for consistent shadow styling
        const shadowElements = container!.querySelectorAll('[class*="shadow"]');
        expect(shadowElements.length).toBeGreaterThan(0);

        // Check for transition classes
        const transitionElements = container!.querySelectorAll('[class*="transition"]');
        expect(transitionElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle error states with gradient styling', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));

      let container: HTMLElement;
      
      await act(async () => {
        const result = render(<CategoryPerformanceAnalyzer />);
        container = result.container;
      });

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      // Check error state has gradient classes
      const gradientElements = container!.querySelectorAll('[class*="gradient"]');
      expect(gradientElements.length).toBeGreaterThan(0);
    });
  });
});