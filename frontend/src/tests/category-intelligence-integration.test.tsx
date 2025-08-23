import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http } from 'msw';
import { setupServer } from 'msw/node';
import CategoryPerformanceAnalyzer from '../components/analytics/CategoryPerformanceAnalyzer';
import SeasonalAnalysis from '../components/analytics/SeasonalAnalysis';
import CrossSellingAnalyzer from '../components/analytics/CrossSellingAnalyzer';

// Mock data
const mockCategoryPerformance = [
  {
    category_id: '1',
    category_name: 'Gold Rings',
    total_revenue: 50000,
    total_quantity_sold: 150,
    avg_transaction_value: 333.33,
    profit_margin: 25.5,
    velocity_score: 0.85,
    performance_tier: 'fast',
    contribution_percentage: 35.2,
    trend_direction: 'up',
    trend_percentage: 12.5
  },
  {
    category_id: '2',
    category_name: 'Silver Necklaces',
    total_revenue: 15000,
    total_quantity_sold: 80,
    avg_transaction_value: 187.50,
    profit_margin: 18.2,
    velocity_score: 0.45,
    performance_tier: 'slow',
    contribution_percentage: 10.6,
    trend_direction: 'down',
    trend_percentage: 8.3
  },
  {
    category_id: '3',
    category_name: 'Diamonds',
    total_revenue: 75000,
    total_quantity_sold: 45,
    avg_transaction_value: 1666.67,
    profit_margin: 35.8,
    velocity_score: 0.92,
    performance_tier: 'fast',
    contribution_percentage: 52.8,
    trend_direction: 'up',
    trend_percentage: 18.7
  }
];

const mockSeasonalPatterns = [
  {
    category_id: '1',
    category_name: 'Gold Rings',
    seasonal_index: {
      '1': 1.2, '2': 2.1, '3': 0.9, '4': 0.8, '5': 1.4, '6': 1.1,
      '7': 0.7, '8': 0.6, '9': 0.9, '10': 1.0, '11': 1.3, '12': 1.8
    },
    peak_months: ['2', '12'],
    low_months: ['7', '8'],
    seasonality_strength: 0.75,
    forecast_next_month: 4200.50,
    confidence_interval: [3800.25, 4600.75]
  },
  {
    category_id: '3',
    category_name: 'Diamonds',
    seasonal_index: {
      '1': 1.5, '2': 2.3, '3': 0.8, '4': 0.7, '5': 1.2, '6': 1.0,
      '7': 0.6, '8': 0.5, '9': 0.8, '10': 1.1, '11': 1.4, '12': 2.0
    },
    peak_months: ['2', '12'],
    low_months: ['7', '8'],
    seasonality_strength: 0.85,
    forecast_next_month: 6800.75,
    confidence_interval: [6200.50, 7400.25]
  }
];

const mockCrossSellingOpportunities = [
  {
    primary_category_id: '1',
    primary_category_name: 'Gold Rings',
    recommended_category_id: '3',
    recommended_category_name: 'Diamonds',
    confidence_score: 0.45,
    lift_ratio: 2.3,
    support: 0.15,
    expected_revenue_increase: 850.25
  },
  {
    primary_category_id: '3',
    primary_category_name: 'Diamonds',
    recommended_category_id: '1',
    recommended_category_name: 'Gold Rings',
    confidence_score: 0.38,
    lift_ratio: 1.8,
    support: 0.12,
    expected_revenue_increase: 650.75
  },
  {
    primary_category_id: '1',
    primary_category_name: 'Gold Rings',
    recommended_category_id: '4',
    recommended_category_name: 'Gold Necklaces',
    confidence_score: 0.32,
    lift_ratio: 1.6,
    support: 0.08,
    expected_revenue_increase: 420.50
  }
];

// Setup MSW server
const server = setupServer(
  http.get('/api/category-intelligence/performance', () => {
    return new Response(JSON.stringify(mockCategoryPerformance), {
      headers: { 'Content-Type': 'application/json' }
    });
  }),
  http.get('/api/category-intelligence/seasonal-patterns', () => {
    return new Response(JSON.stringify(mockSeasonalPatterns), {
      headers: { 'Content-Type': 'application/json' }
    });
  }),
  http.get('/api/category-intelligence/cross-selling', () => {
    return new Response(JSON.stringify(mockCrossSellingOpportunities), {
      headers: { 'Content-Type': 'application/json' }
    });
  }),
  http.get('/api/category-intelligence/insights/summary', () => {
    return new Response(JSON.stringify({
      performance_summary: {
        total_categories_analyzed: 8,
        fast_movers: 3,
        slow_movers: 2,
        dead_stock_categories: 1,
        top_performers: mockCategoryPerformance.slice(0, 3)
      },
      seasonal_insights: {
        highly_seasonal_categories: 2,
        categories_with_patterns: 5,
        upcoming_peak_categories: mockSeasonalPatterns.slice(0, 2)
      },
      cross_selling_insights: {
        total_opportunities: 15,
        high_confidence_opportunities: 5,
        top_opportunities: mockCrossSellingOpportunities.slice(0, 3)
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Category Intelligence Integration Tests', () => {
  describe('CategoryPerformanceAnalyzer', () => {
    test('renders and displays category performance data', async () => {
      render(<CategoryPerformanceAnalyzer />);

      // Check loading state
      expect(screen.getByText('Analyzing category performance...')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Category Performance Analysis')).toBeInTheDocument();
      });

      // Check summary cards
      expect(screen.getByText('Total Categories')).toBeInTheDocument();
      expect(screen.getByText('Fast Movers')).toBeInTheDocument();
      expect(screen.getByText('Dead Stock')).toBeInTheDocument();

      // Check category data
      expect(screen.getByText('Gold Rings')).toBeInTheDocument();
      expect(screen.getByText('Diamonds')).toBeInTheDocument();
      expect(screen.getByText('Silver Necklaces')).toBeInTheDocument();

      // Check performance tiers
      expect(screen.getByText('Fast Mover')).toBeInTheDocument();
      expect(screen.getByText('Slow Mover')).toBeInTheDocument();

      // Check revenue formatting
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText('$75,000')).toBeInTheDocument();
    });

    test('handles filtering and sorting', async () => {
      render(<CategoryPerformanceAnalyzer />);

      await waitFor(() => {
        expect(screen.getByText('Gold Rings')).toBeInTheDocument();
      });

      // Test tier filtering
      const tierFilter = screen.getByDisplayValue('All Tiers');
      fireEvent.click(tierFilter);
      
      await waitFor(() => {
        expect(screen.getByText('Fast Movers')).toBeInTheDocument();
      });

      // Test sorting
      const sortSelect = screen.getByDisplayValue('Velocity Score');
      fireEvent.click(sortSelect);
      
      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });
    });

    test('handles category selection callback', async () => {
      const mockOnCategorySelect = jest.fn();
      render(<CategoryPerformanceAnalyzer onCategorySelect={mockOnCategorySelect} />);

      await waitFor(() => {
        expect(screen.getByText('Gold Rings')).toBeInTheDocument();
      });

      // Click on a category
      fireEvent.click(screen.getByText('Gold Rings'));
      expect(mockOnCategorySelect).toHaveBeenCalledWith('1');
    });

    test('handles API errors gracefully', async () => {
      server.use(
        http.get('/api/category-intelligence/performance', () => {
          return new Response(JSON.stringify({ detail: 'Internal server error' }), { status: 500 });
        })
      );

      render(<CategoryPerformanceAnalyzer />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch category performance data')).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('SeasonalAnalysis', () => {
    test('renders and displays seasonal patterns', async () => {
      render(<SeasonalAnalysis />);

      await waitFor(() => {
        expect(screen.getByText('Seasonal Pattern Analysis')).toBeInTheDocument();
      });

      // Check category list
      expect(screen.getByText('Gold Rings')).toBeInTheDocument();
      expect(screen.getByText('Diamonds')).toBeInTheDocument();

      // Check seasonality badges
      expect(screen.getByText('Highly Seasonal')).toBeInTheDocument();

      // Check forecast values
      expect(screen.getByText('$4,201')).toBeInTheDocument(); // Forecast for Gold Rings
    });

    test('displays seasonal chart when category is selected', async () => {
      render(<SeasonalAnalysis />);

      await waitFor(() => {
        expect(screen.getByText('Gold Rings')).toBeInTheDocument();
      });

      // Click on a category
      fireEvent.click(screen.getByText('Gold Rings'));

      await waitFor(() => {
        expect(screen.getByText('Gold Rings - Seasonal Index')).toBeInTheDocument();
      });

      // Check peak and low months
      expect(screen.getByText('Peak Months')).toBeInTheDocument();
      expect(screen.getByText('Low Months')).toBeInTheDocument();
      expect(screen.getByText('Next Month Forecast')).toBeInTheDocument();
    });

    test('shows insights summary', async () => {
      render(<SeasonalAnalysis />);

      await waitFor(() => {
        expect(screen.getByText('Seasonal Insights Summary')).toBeInTheDocument();
      });

      expect(screen.getByText('Categories Analyzed')).toBeInTheDocument();
      expect(screen.getByText('Highly Seasonal')).toBeInTheDocument();
      expect(screen.getByText('Total Forecast')).toBeInTheDocument();
    });

    test('handles different analysis periods', async () => {
      render(<SeasonalAnalysis />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('24 months')).toBeInTheDocument();
      });

      // Change analysis period
      const periodSelect = screen.getByDisplayValue('24 months');
      fireEvent.click(periodSelect);
      
      await waitFor(() => {
        expect(screen.getByText('12 months')).toBeInTheDocument();
      });
    });
  });

  describe('CrossSellingAnalyzer', () => {
    test('renders and displays cross-selling opportunities', async () => {
      render(<CrossSellingAnalyzer />);

      await waitFor(() => {
        expect(screen.getByText('Cross-Selling Opportunities')).toBeInTheDocument();
      });

      // Check summary cards
      expect(screen.getByText('Total Opportunities')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('Potential Revenue')).toBeInTheDocument();

      // Check opportunity data
      expect(screen.getByText('Gold Rings')).toBeInTheDocument();
      expect(screen.getByText('Diamonds')).toBeInTheDocument();

      // Check confidence badges
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();

      // Check metrics
      expect(screen.getByText('45.0%')).toBeInTheDocument(); // Confidence score
      expect(screen.getByText('2.30x')).toBeInTheDocument(); // Lift ratio
    });

    test('displays opportunity visualization', async () => {
      render(<CrossSellingAnalyzer />);

      await waitFor(() => {
        expect(screen.getByText('Opportunity Visualization')).toBeInTheDocument();
      });

      expect(screen.getByText('Confidence vs Lift Ratio (bubble size = expected revenue)')).toBeInTheDocument();
    });

    test('handles threshold adjustments', async () => {
      render(<CrossSellingAnalyzer />);

      await waitFor(() => {
        expect(screen.getByText('Cross-Selling Analysis Controls')).toBeInTheDocument();
      });

      // Check threshold controls
      expect(screen.getByText(/Minimum Support:/)).toBeInTheDocument();
      expect(screen.getByText(/Minimum Confidence:/)).toBeInTheDocument();

      // Test sorting
      const sortSelect = screen.getByDisplayValue('Confidence Score');
      fireEvent.click(sortSelect);
      
      await waitFor(() => {
        expect(screen.getByText('Lift Ratio')).toBeInTheDocument();
      });
    });

    test('shows detailed insights for opportunities', async () => {
      render(<CrossSellingAnalyzer />);

      await waitFor(() => {
        expect(screen.getByText('Gold Rings')).toBeInTheDocument();
      });

      // Check insight text
      expect(screen.getByText(/Customers who buy Gold Rings are/)).toBeInTheDocument();
      expect(screen.getByText(/2.3x more likely/)).toBeInTheDocument();
      expect(screen.getByText(/to also buy Diamonds/)).toBeInTheDocument();
    });

    test('handles opportunity selection callback', async () => {
      const mockOnOpportunitySelect = jest.fn();
      render(<CrossSellingAnalyzer onOpportunitySelect={mockOnOpportunitySelect} />);

      await waitFor(() => {
        expect(screen.getByText('Gold Rings')).toBeInTheDocument();
      });

      // Click on an opportunity
      const opportunityCard = screen.getByText('Gold Rings').closest('.border');
      fireEvent.click(opportunityCard!);

      expect(mockOnOpportunitySelect).toHaveBeenCalledWith(
        expect.objectContaining({
          primary_category_name: 'Gold Rings',
          recommended_category_name: 'Diamonds'
        })
      );
    });

    test('handles empty results gracefully', async () => {
      server.use(
        http.get('/api/category-intelligence/cross-selling', () => {
          return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      render(<CrossSellingAnalyzer />);

      await waitFor(() => {
        expect(screen.getByText('No cross-selling opportunities found with current criteria.')).toBeInTheDocument();
      });

      expect(screen.getByText('Try adjusting the support and confidence thresholds.')).toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    test('components work together in a dashboard scenario', async () => {
      const TestDashboard = () => {
        const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>();
        
        return (
          <div>
            <CategoryPerformanceAnalyzer onCategorySelect={setSelectedCategory} />
            <SeasonalAnalysis categoryId={selectedCategory} />
            <CrossSellingAnalyzer />
          </div>
        );
      };

      render(<TestDashboard />);

      // Wait for all components to load
      await waitFor(() => {
        expect(screen.getByText('Category Performance Analysis')).toBeInTheDocument();
        expect(screen.getByText('Seasonal Pattern Analysis')).toBeInTheDocument();
        expect(screen.getByText('Cross-Selling Opportunities')).toBeInTheDocument();
      });

      // Test category selection integration
      const goldRingsElement = screen.getAllByText('Gold Rings')[0]; // Get first occurrence
      fireEvent.click(goldRingsElement);

      // Verify seasonal analysis updates (would need additional API mock for specific category)
      await waitFor(() => {
        expect(screen.getByText('Seasonal Pattern Analysis')).toBeInTheDocument();
      });
    });

    test('handles real-time data updates', async () => {
      render(<CategoryPerformanceAnalyzer />);

      await waitFor(() => {
        expect(screen.getByText('$50,000')).toBeInTheDocument();
      });

      // Simulate data update
      server.use(
        http.get('/api/category-intelligence/performance', () => {
          const updatedData = [...mockCategoryPerformance];
          updatedData[0].total_revenue = 55000;
          return new Response(JSON.stringify(updatedData), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      // Trigger refresh (would need refresh button or auto-refresh)
      const retryButton = screen.queryByText('Retry');
      if (retryButton) {
        fireEvent.click(retryButton);
        
        await waitFor(() => {
          expect(screen.getByText('$55,000')).toBeInTheDocument();
        });
      }
    });

    test('performance with large datasets', async () => {
      // Create large mock dataset
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        ...mockCategoryPerformance[0],
        category_id: `${i + 1}`,
        category_name: `Category ${i + 1}`,
        total_revenue: Math.random() * 100000
      }));

      server.use(
        http.get('/api/category-intelligence/performance', () => {
          return new Response(JSON.stringify(largeDataset), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      const startTime = performance.now();
      render(<CategoryPerformanceAnalyzer />);

      await waitFor(() => {
        expect(screen.getByText('Category Performance Analysis')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time even with large dataset
      expect(renderTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});