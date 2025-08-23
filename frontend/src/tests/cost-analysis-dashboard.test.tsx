/**
 * Cost Analysis Dashboard Tests
 * 
 * Tests the comprehensive cost analysis dashboard functionality including:
 * - Data fetching and display
 * - Interactive filtering and time range selection
 * - Chart rendering and export capabilities
 * - Optimization recommendations
 * - ROI analysis
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CostAnalysisDashboard from '../components/analytics/CostAnalysisDashboard';

// Mock the chart components
jest.mock('../components/analytics/charts/TrendChart', () => ({
  TrendChart: ({ data }: any) => (
    <div data-testid="trend-chart">
      Trend Chart with {data.length} data points
    </div>
  )
}));

jest.mock('../components/analytics/charts/HeatmapChart', () => ({
  HeatmapChart: ({ data }: any) => (
    <div data-testid="heatmap-chart">
      Heatmap Chart with {data.length} categories
    </div>
  )
}));

jest.mock('../components/analytics/MetricCard', () => ({
  MetricCard: ({ data }: any) => (
    <div data-testid={`metric-card-${data?.title?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}>
      <span>{data?.title}: {data?.value}</span>
      {data?.trend && <span data-testid="trend">{data.trend.direction}</span>}
    </div>
  )
}));

jest.mock('../components/analytics/TimeRangeSelector', () => ({
  TimeRangeSelector: ({ value, onChange }: any) => (
    <select 
      data-testid="time-range-selector" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="7d">7 days</option>
      <option value="30d">30 days</option>
      <option value="90d">90 days</option>
    </select>
  )
}));

jest.mock('../components/analytics/charts/ChartExportMenu', () => ({
  ChartExportMenu: () => (
    <button data-testid="chart-export-menu">Export</button>
  )
}));

// Mock fetch
global.fetch = jest.fn();

const mockCostAnalysisData = {
  total_cost: 125000,
  cost_breakdown: [
    {
      category: 'Labor',
      amount: 50000,
      percentage: 40,
      trend: 'up',
      change: 5.2
    },
    {
      category: 'Materials',
      amount: 45000,
      percentage: 36,
      trend: 'down',
      change: -2.1
    },
    {
      category: 'Overhead',
      amount: 30000,
      percentage: 24,
      trend: 'stable',
      change: 0.5
    }
  ],
  optimization_recommendations: [
    {
      id: '1',
      title: 'Optimize Labor Scheduling',
      description: 'Implement dynamic scheduling to reduce overtime costs',
      potential_savings: 8500,
      priority: 'high',
      category: 'labor',
      implementation_effort: 'medium'
    },
    {
      id: '2',
      title: 'Bulk Material Purchasing',
      description: 'Negotiate better rates through bulk purchasing agreements',
      potential_savings: 5200,
      priority: 'medium',
      category: 'materials',
      implementation_effort: 'low'
    }
  ],
  cost_trends: [
    {
      date: '2024-01-01',
      total_cost: 120000,
      labor_cost: 48000,
      material_cost: 43200,
      overhead_cost: 28800
    },
    {
      date: '2024-01-02',
      total_cost: 125000,
      labor_cost: 50000,
      material_cost: 45000,
      overhead_cost: 30000
    }
  ],
  roi_metrics: {
    current_roi: 15.5,
    projected_roi: 18.2,
    cost_per_unit: 125.50,
    efficiency_score: 78.5
  }
};

describe('CostAnalysisDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockCostAnalysisData
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<CostAnalysisDashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('fetches and displays cost analysis data', async () => {
    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cost Analysis Dashboard')).toBeInTheDocument();
    });

    // Check if key metrics are displayed
    expect(screen.getByTestId('metric-card-total-cost')).toHaveTextContent('$125,000.00');
    expect(screen.getByTestId('metric-card-current-roi')).toHaveTextContent('15.5%');
    expect(screen.getByTestId('metric-card-cost-per-unit')).toHaveTextContent('$125.50');
    expect(screen.getByTestId('metric-card-efficiency-score')).toHaveTextContent('78.5%');
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('allows time range selection', async () => {
    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('time-range-selector')).toBeInTheDocument();
    });

    const timeRangeSelector = screen.getByTestId('time-range-selector');
    fireEvent.change(timeRangeSelector, { target: { value: '90d' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('time_range=90d')
      );
    });
  });

  it('allows category filtering', async () => {
    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cost Analysis Dashboard')).toBeInTheDocument();
    });

    // Find and click the category selector
    const categorySelect = screen.getByRole('combobox');
    fireEvent.click(categorySelect);

    // Select labor category
    const laborOption = screen.getByText('Labor');
    fireEvent.click(laborOption);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=labor')
      );
    });
  });

  it('displays cost breakdown correctly', async () => {
    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cost Distribution')).toBeInTheDocument();
    });

    // Check if cost breakdown categories are displayed
    expect(screen.getByText('Labor')).toBeInTheDocument();
    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getByText('Overhead')).toBeInTheDocument();

    // Check if amounts are displayed
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
    expect(screen.getByText('$45,000.00')).toBeInTheDocument();
    expect(screen.getByText('$30,000.00')).toBeInTheDocument();

    // Check if percentages are displayed
    expect(screen.getByText('40.0% of total')).toBeInTheDocument();
    expect(screen.getByText('36.0% of total')).toBeInTheDocument();
    expect(screen.getByText('24.0% of total')).toBeInTheDocument();
  });

  it('displays trend charts in trends tab', async () => {
    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cost Analysis Dashboard')).toBeInTheDocument();
    });

    // Click on trends tab
    const trendsTab = screen.getByRole('tab', { name: 'Cost Trends' });
    fireEvent.click(trendsTab);

    await waitFor(() => {
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
      expect(screen.getByText('Cost Trends Over Time')).toBeInTheDocument();
    });
  });

  it('displays optimization recommendations', async () => {
    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cost Analysis Dashboard')).toBeInTheDocument();
    });

    // Click on recommendations tab
    const recommendationsTab = screen.getByRole('tab', { name: 'Recommendations' });
    fireEvent.click(recommendationsTab);

    await waitFor(() => {
      expect(screen.getByText('Optimize Labor Scheduling')).toBeInTheDocument();
      expect(screen.getByText('Bulk Material Purchasing')).toBeInTheDocument();
    });

    // Check recommendation details
    expect(screen.getByText('Potential Savings: $8,500.00')).toBeInTheDocument();
    expect(screen.getByText('Potential Savings: $5,200.00')).toBeInTheDocument();
    expect(screen.getByText('high priority')).toBeInTheDocument();
    expect(screen.getByText('medium priority')).toBeInTheDocument();
  });

  it('displays ROI analysis', async () => {
    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cost Analysis Dashboard')).toBeInTheDocument();
    });

    // Click on ROI tab
    const roiTab = screen.getByRole('tab', { name: 'ROI Analysis' });
    fireEvent.click(roiTab);

    await waitFor(() => {
      expect(screen.getByText('ROI Comparison')).toBeInTheDocument();
      expect(screen.getByText('Efficiency Metrics')).toBeInTheDocument();
    });

    // Check ROI values
    expect(screen.getByText('15.5%')).toBeInTheDocument(); // Current ROI
    expect(screen.getByText('18.2%')).toBeInTheDocument(); // Projected ROI
    expect(screen.getByText('+2.7%')).toBeInTheDocument(); // Improvement potential
  });

  it('handles chart export functionality', async () => {
    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('chart-export-menu')).toBeInTheDocument();
    });

    const exportButton = screen.getByTestId('chart-export-menu');
    fireEvent.click(exportButton);

    // Chart export functionality should be available
    expect(exportButton).toBeInTheDocument();
  });

  it('displays trend indicators correctly', async () => {
    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cost Analysis Dashboard')).toBeInTheDocument();
    });

    // Check for trend indicators in metric cards
    const metricCards = screen.getAllByTestId(/metric-card-/);
    expect(metricCards.length).toBeGreaterThan(0);

    // Verify trend data is passed to components
    const trendElements = screen.getAllByTestId('trend');
    expect(trendElements.length).toBeGreaterThan(0);
  });

  it('formats currency values correctly', async () => {
    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByText('$125,000.00')).toBeInTheDocument();
      expect(screen.getByText('$125.50')).toBeInTheDocument();
    });
  });

  it('handles empty data gracefully', async () => {
    const emptyData = {
      total_cost: 0,
      cost_breakdown: [],
      optimization_recommendations: [],
      cost_trends: [],
      roi_metrics: {
        current_roi: 0,
        projected_roi: 0,
        cost_per_unit: 0,
        efficiency_score: 0
      }
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => emptyData
    });

    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cost Analysis Dashboard')).toBeInTheDocument();
    });

    // Should handle empty data without crashing
    expect(screen.getByTestId('metric-card-total-cost')).toHaveTextContent('$0.00');
  });

  it('updates data when filters change', async () => {
    render(<CostAnalysisDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cost Analysis Dashboard')).toBeInTheDocument();
    });

    // Change time range
    const timeRangeSelector = screen.getByTestId('time-range-selector');
    fireEvent.change(timeRangeSelector, { target: { value: '7d' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('time_range=7d')
      );
    });

    // Verify component re-renders with new data
    expect(fetch).toHaveBeenCalledTimes(2); // Initial load + filter change
  });
});