import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KPIWidget } from '../components/analytics/KPIWidget';
import { MetricCard } from '../components/analytics/MetricCard';
import { TrendIndicator, TrendComparison } from '../components/analytics/TrendIndicator';
import type { KPIData } from '../components/analytics/KPIWidget';
import type { MetricData } from '../components/analytics/MetricCard';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('KPIWidget Component', () => {
  const mockKPIData: KPIData = {
    id: 'test-kpi-1',
    title: 'Revenue',
    value: 50000,
    target: 60000,
    unit: 'USD',
    format: 'currency',
    trend: {
      direction: 'up',
      percentage: 15.5,
      period: 'vs last month',
      significance: 'high'
    },
    status: 'success',
    sparklineData: [100, 120, 110, 140, 130, 150, 160],
    description: 'Total revenue for the period',
    lastUpdated: '2024-01-15T10:30:00Z'
  };

  test('renders KPI widget with all data', () => {
    render(<KPIWidget data={mockKPIData} />);
    
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    expect(screen.getByText('Total revenue for the period')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('83.3%')).toBeInTheDocument(); // Achievement rate
    expect(screen.getByText('Target: $60,000')).toBeInTheDocument();
  });

  test('formats currency values correctly', () => {
    render(<KPIWidget data={mockKPIData} animated={false} />);
    
    // Should display formatted currency
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('Target: $60,000')).toBeInTheDocument();
  });

  test('handles percentage format', () => {
    const percentageData: KPIData = {
      ...mockKPIData,
      value: 85.5,
      format: 'percentage',
      target: 90
    };
    
    render(<KPIWidget data={percentageData} animated={false} />);
    
    expect(screen.getByText('85.5%')).toBeInTheDocument();
    expect(screen.getByText('Target: 90.0%')).toBeInTheDocument();
  });

  test('handles number format with large values', () => {
    const numberData: KPIData = {
      ...mockKPIData,
      value: 1250000,
      format: 'number',
      target: 1500000
    };
    
    render(<KPIWidget data={numberData} animated={false} />);
    
    expect(screen.getByText('1,250,000')).toBeInTheDocument();
  });

  test('displays trend indicator correctly', () => {
    render(<KPIWidget data={mockKPIData} showTrend={true} />);
    
    expect(screen.getByText('+15.5%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  test('hides components based on props', () => {
    render(
      <KPIWidget 
        data={mockKPIData} 
        showSparkline={false}
        showProgress={false}
        showTrend={false}
      />
    );
    
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    expect(screen.queryByText('+15.5%')).not.toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<KPIWidget data={mockKPIData} onClick={handleClick} />);
    
    // Find the card by its container div and click it
    const card = screen.getByText('Revenue').closest('div[class*="cursor-pointer"]');
    fireEvent.click(card!);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('handles missing optional data gracefully', () => {
    const minimalData: KPIData = {
      id: 'minimal-kpi',
      title: 'Simple KPI',
      value: 100,
      format: 'number',
      trend: {
        direction: 'stable',
        percentage: 0,
        period: 'no change',
        significance: 'low'
      },
      status: 'info'
    };
    
    render(<KPIWidget data={minimalData} animated={false} />);
    
    expect(screen.getByText('Simple KPI')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('INFO')).toBeInTheDocument();
  });

  test('applies different sizes correctly', () => {
    const { rerender } = render(<KPIWidget data={mockKPIData} size="sm" />);
    expect(screen.getByText('Revenue')).toHaveClass('text-xs');
    
    rerender(<KPIWidget data={mockKPIData} size="lg" />);
    expect(screen.getByText('Revenue')).toHaveClass('text-base');
  });

  test('displays different status colors', () => {
    const warningData: KPIData = {
      ...mockKPIData,
      status: 'warning'
    };
    
    render(<KPIWidget data={warningData} />);
    expect(screen.getByText('WARNING')).toBeInTheDocument();
  });
});

describe('MetricCard Component', () => {
  const mockMetricData: MetricData = {
    id: 'test-metric-1',
    title: 'Total Sales',
    value: 125000,
    previousValue: 100000,
    target: 150000,
    unit: 'USD',
    format: 'currency',
    status: 'success',
    trend: {
      direction: 'up',
      percentage: 25,
      period: 'vs last quarter'
    },
    subtitle: 'Quarterly performance',
    lastUpdated: '2024-01-15T10:30:00Z'
  };

  test('renders metric card with all data', () => {
    render(<MetricCard data={mockMetricData} />);
    
    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    expect(screen.getByText('Quarterly performance')).toBeInTheDocument();
    expect(screen.getByText('+25.0%')).toBeInTheDocument();
  });

  test('formats large numbers correctly', () => {
    const largeNumberData: MetricData = {
      ...mockMetricData,
      value: 2500000,
      format: 'number'
    };
    
    render(<MetricCard data={largeNumberData} animated={false} />);
    expect(screen.getByText('2.5M')).toBeInTheDocument();
  });

  test('handles horizontal layout', () => {
    render(<MetricCard data={mockMetricData} layout="horizontal" animated={false} />);
    
    // Should still render all content but in horizontal layout
    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('$125,000')).toBeInTheDocument();
  });

  test('shows achievement progress when target is set', () => {
    render(<MetricCard data={mockMetricData} />);
    
    expect(screen.getByText('Achievement')).toBeInTheDocument();
    expect(screen.getByText('83.3%')).toBeInTheDocument(); // 125000/150000 * 100
    expect(screen.getByText('Target: $150,000')).toBeInTheDocument();
  });

  test('handles different status types', () => {
    const dangerData: MetricData = {
      ...mockMetricData,
      status: 'danger'
    };
    
    render(<MetricCard data={dangerData} />);
    expect(screen.getByText('DANGER')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<MetricCard data={mockMetricData} onClick={handleClick} />);
    
    // Find the card by its container div and click it
    const card = screen.getByText('Total Sales').closest('div[class*="cursor-pointer"]');
    fireEvent.click(card!);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('hides optional elements based on props', () => {
    render(
      <MetricCard 
        data={mockMetricData} 
        showIcon={false}
        showTrend={false}
        showStatus={false}
      />
    );
    
    expect(screen.queryByText('SUCCESS')).not.toBeInTheDocument();
    expect(screen.queryByText('+25.0%')).not.toBeInTheDocument();
  });
});

describe('TrendIndicator Component', () => {
  test('renders upward trend correctly', () => {
    render(
      <TrendIndicator
        direction="up"
        percentage={15.5}
        period="vs last month"
        significance="high"
      />
    );
    
    expect(screen.getByText('+15.5%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  test('renders downward trend correctly', () => {
    render(
      <TrendIndicator
        direction="down"
        percentage={-8.2}
        period="vs last week"
        significance="medium"
      />
    );
    
    expect(screen.getByText('-8.2%')).toBeInTheDocument();
    expect(screen.getByText('vs last week')).toBeInTheDocument();
  });

  test('renders stable trend correctly', () => {
    render(
      <TrendIndicator
        direction="stable"
        percentage={0}
        period="no change"
        significance="low"
      />
    );
    
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getByText('no change')).toBeInTheDocument();
  });

  test('renders different variants correctly', () => {
    const { rerender } = render(
      <TrendIndicator
        direction="up"
        percentage={10}
        variant="minimal"
      />
    );
    
    expect(screen.getByText('+10.0%')).toBeInTheDocument();
    
    rerender(
      <TrendIndicator
        direction="up"
        percentage={10}
        variant="badge"
      />
    );
    
    expect(screen.getByText('+10.0%')).toBeInTheDocument();
  });

  test('handles different sizes', () => {
    render(
      <TrendIndicator
        direction="up"
        percentage={10}
        size="lg"
      />
    );
    
    expect(screen.getByText('+10.0%')).toBeInTheDocument();
  });

  test('hides elements based on props', () => {
    render(
      <TrendIndicator
        direction="up"
        percentage={10}
        period="test period"
        showIcon={false}
        showPercentage={false}
        showPeriod={false}
      />
    );
    
    expect(screen.queryByText('+10.0%')).not.toBeInTheDocument();
    expect(screen.queryByText('test period')).not.toBeInTheDocument();
  });
});

describe('TrendComparison Component', () => {
  test('calculates and displays trend comparison correctly', () => {
    render(
      <TrendComparison
        current={120}
        previous={100}
        period="last month"
        format="number"
      />
    );
    
    expect(screen.getByText(/vs/)).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/last month/)).toBeInTheDocument();
    expect(screen.getByText('+20.0%')).toBeInTheDocument();
  });

  test('handles currency format', () => {
    render(
      <TrendComparison
        current={1200}
        previous={1000}
        format="currency"
      />
    );
    
    expect(screen.getByText(/vs/)).toBeInTheDocument();
    expect(screen.getByText(/\$1,000/)).toBeInTheDocument();
    expect(screen.getByText('+20.0%')).toBeInTheDocument();
  });

  test('handles negative trends', () => {
    render(
      <TrendComparison
        current={80}
        previous={100}
        format="number"
      />
    );
    
    expect(screen.getByText(/vs/)).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText('-20.0%')).toBeInTheDocument();
  });

  test('handles zero previous value', () => {
    render(
      <TrendComparison
        current={100}
        previous={0}
        format="number"
      />
    );
    
    expect(screen.getByText(/vs/)).toBeInTheDocument();
    // Check for the specific "vs 0" pattern instead of just "0"
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'vs 0 ';
    })).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});

describe('Edge Cases and Error Handling', () => {
  test('handles empty sparkline data', () => {
    const dataWithEmptySparkline: KPIData = {
      id: 'empty-sparkline',
      title: 'Test KPI',
      value: 100,
      format: 'number',
      trend: {
        direction: 'stable',
        percentage: 0,
        period: 'no change',
        significance: 'low'
      },
      status: 'info',
      sparklineData: []
    };
    
    render(<KPIWidget data={dataWithEmptySparkline} />);
    expect(screen.getByText('Test KPI')).toBeInTheDocument();
  });

  test('handles very large numbers', () => {
    const largeNumberData: KPIData = {
      id: 'large-number',
      title: 'Large Value',
      value: 999999999,
      format: 'number',
      trend: {
        direction: 'up',
        percentage: 5,
        period: 'growth',
        significance: 'medium'
      },
      status: 'success'
    };
    
    render(<KPIWidget data={largeNumberData} animated={false} />);
    expect(screen.getByText('999,999,999')).toBeInTheDocument();
  });

  test('handles zero values', () => {
    const zeroValueData: MetricData = {
      id: 'zero-value',
      title: 'Zero Metric',
      value: 0,
      format: 'number',
      status: 'neutral'
    };
    
    render(<MetricCard data={zeroValueData} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('handles negative values', () => {
    const negativeValueData: MetricData = {
      id: 'negative-value',
      title: 'Negative Metric',
      value: -500,
      format: 'currency',
      status: 'danger'
    };
    
    render(<MetricCard data={negativeValueData} animated={false} />);
    expect(screen.getByText('-$500')).toBeInTheDocument();
  });
});

describe('Animation and Interaction Tests', () => {
  test('handles animation disabled', () => {
    render(<KPIWidget data={{
      id: 'no-animation',
      title: 'No Animation',
      value: 100,
      format: 'number',
      trend: {
        direction: 'stable',
        percentage: 0,
        period: 'no change',
        significance: 'low'
      },
      status: 'info'
    }} animated={false} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  test('handles missing trend data', () => {
    const noTrendData: MetricData = {
      id: 'no-trend',
      title: 'No Trend',
      value: 100,
      format: 'number',
      status: 'neutral'
    };
    
    render(<MetricCard data={noTrendData} animated={false} />);
    expect(screen.getByText('No Trend')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});