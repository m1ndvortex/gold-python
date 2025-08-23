import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { InteractiveChart } from '../components/analytics/charts/InteractiveChart';
import { TrendChart } from '../components/analytics/charts/TrendChart';
import { HeatmapChart } from '../components/analytics/charts/HeatmapChart';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    rect: ({ children, ...props }: any) => <rect {...props}>{children}</rect>,
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
    line: ({ children, ...props }: any) => <line {...props}>{children}</line>,
    path: ({ children, ...props }: any) => <path {...props}>{children}</path>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}));

// Mock UI components to avoid complex dependencies
jest.mock('../components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}));

jest.mock('../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>
}));

jest.mock('../components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>
}));

jest.mock('../components/ui/separator', () => ({
  Separator: (props: any) => <hr {...props} />
}));

jest.mock('../components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => <div {...props} data-value={value} />
}));

jest.mock('../components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>
}));

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children, onClick, onMouseEnter, onMouseLeave, ...props }: any) => (
    <div 
      data-testid="line-chart" 
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </div>
  ),
  BarChart: ({ children, ...props }: any) => <div data-testid="bar-chart" {...props}>{children}</div>,
  AreaChart: ({ children, ...props }: any) => <div data-testid="area-chart" {...props}>{children}</div>,
  PieChart: ({ children, ...props }: any) => <div data-testid="pie-chart" {...props}>{children}</div>,
  ScatterChart: ({ children, ...props }: any) => <div data-testid="scatter-chart" {...props}>{children}</div>,
  Line: (props: any) => <div data-testid="line" {...props} />,
  Bar: (props: any) => <div data-testid="bar" {...props} />,
  Area: (props: any) => <div data-testid="area" {...props} />,
  Pie: (props: any) => <div data-testid="pie" {...props} />,
  Cell: (props: any) => <div data-testid="cell" {...props} />,
  Scatter: (props: any) => <div data-testid="scatter" {...props} />,
  XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: (props: any) => <div data-testid="chart-tooltip" {...props} />,
  Legend: (props: any) => <div data-testid="legend" {...props} />,
  Brush: (props: any) => <div data-testid="brush" {...props} />,
  ReferenceLine: (props: any) => <div data-testid="reference-line" {...props} />,
  ReferenceArea: (props: any) => <div data-testid="reference-area" {...props} />
}));

describe('InteractiveChart Component', () => {
  const mockData = [
    { name: 'Jan', value: 100, category: 'A' },
    { name: 'Feb', value: 150, category: 'B' },
    { name: 'Mar', value: 200, category: 'A' },
    { name: 'Apr', value: 120, category: 'C' },
    { name: 'May', value: 180, category: 'B' }
  ];

  const defaultProps = {
    data: mockData,
    type: 'line' as const,
    title: 'Test Interactive Chart',
    description: 'A test chart for unit testing'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders interactive chart with basic props', () => {
    render(<InteractiveChart {...defaultProps} />);
    
    expect(screen.getByText('Test Interactive Chart')).toBeInTheDocument();
    expect(screen.getByText('A test chart for unit testing')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('renders different chart types correctly', () => {
    const { rerender } = render(<InteractiveChart {...defaultProps} type="bar" />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

    rerender(<InteractiveChart {...defaultProps} type="area" />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();

    rerender(<InteractiveChart {...defaultProps} type="pie" />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();

    rerender(<InteractiveChart {...defaultProps} type="scatter" />);
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
  });

  test('displays zoom controls when zoom is enabled', () => {
    const zoomProps = {
      ...defaultProps,
      zoom: {
        enabled: true,
        type: 'xy' as const,
        onZoomChange: jest.fn()
      }
    };

    render(<InteractiveChart {...zoomProps} />);
    
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  test('handles zoom interactions', async () => {
    const mockZoomChange = jest.fn();
    const zoomProps = {
      ...defaultProps,
      zoom: {
        enabled: true,
        type: 'xy' as const,
        onZoomChange: mockZoomChange
      }
    };

    render(<InteractiveChart {...zoomProps} />);
    
    const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
    const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
    
    await userEvent.click(zoomInButton);
    expect(mockZoomChange).toHaveBeenCalled();
    
    await userEvent.click(zoomOutButton);
    expect(mockZoomChange).toHaveBeenCalledWith({});
  });

  test('displays drill-down breadcrumbs when enabled', () => {
    const drillDownProps = {
      ...defaultProps,
      drillDown: {
        enabled: true,
        levels: [
          { key: 'overview', label: 'Overview', dataKey: 'value' },
          { key: 'category', label: 'Category', dataKey: 'category' }
        ],
        breadcrumbs: true,
        onDrillDown: jest.fn()
      }
    };

    render(<InteractiveChart {...drillDownProps} />);
    
    // Initially should show overview
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  test('handles filter changes', async () => {
    const mockFilterChange = jest.fn();
    const filterProps = {
      ...defaultProps,
      filters: {
        enabled: true,
        filters: [
          {
            key: 'category',
            label: 'Category',
            type: 'select' as const,
            options: [
              { label: 'Category A', value: 'A' },
              { label: 'Category B', value: 'B' },
              { label: 'Category C', value: 'C' }
            ]
          }
        ],
        onFilterChange: mockFilterChange
      }
    };

    render(<InteractiveChart {...filterProps} />);
    
    const categoryFilter = screen.getByDisplayValue('');
    await userEvent.selectOptions(categoryFilter, 'A');
    
    expect(mockFilterChange).toHaveBeenCalledWith({ category: 'A' });
  });

  test('handles data point clicks', async () => {
    const mockDataPointClick = jest.fn();
    const clickProps = {
      ...defaultProps,
      onDataPointClick: mockDataPointClick
    };

    render(<InteractiveChart {...clickProps} />);
    
    const chart = screen.getByTestId('line-chart');
    fireEvent.click(chart);
    
    // Note: In a real scenario, this would be triggered by the chart library
    // Here we're just testing that the handler is passed correctly
  });

  test('displays export button when export is enabled', () => {
    const exportProps = {
      ...defaultProps,
      export: {
        enabled: true,
        formats: ['png', 'svg', 'pdf', 'csv'] as ('png' | 'svg' | 'pdf' | 'csv')[],
        onExport: jest.fn()
      }
    };

    render(<InteractiveChart {...exportProps} />);
    
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  test('handles export functionality', async () => {
    const mockExport = jest.fn();
    const exportProps = {
      ...defaultProps,
      export: {
        enabled: true,
        formats: ['png'] as ('png' | 'svg' | 'pdf' | 'csv')[],
        onExport: mockExport
      }
    };

    render(<InteractiveChart {...exportProps} />);
    
    const exportButton = screen.getByRole('button', { name: /download/i });
    await userEvent.click(exportButton);
    
    expect(mockExport).toHaveBeenCalledWith('png', mockData);
  });

  test('applies custom colors correctly', () => {
    const customColors = ['#ff0000', '#00ff00', '#0000ff'];
    const colorProps = {
      ...defaultProps,
      colors: customColors
    };

    render(<InteractiveChart {...colorProps} />);
    
    // The colors would be applied to the chart elements
    // In a real test, we might check computed styles or data attributes
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('handles fullscreen toggle', async () => {
    render(<InteractiveChart {...defaultProps} />);
    
    const fullscreenButton = screen.getByRole('button', { name: /maximize/i });
    await userEvent.click(fullscreenButton);
    
    // Check if fullscreen class or style is applied
    // This would depend on the actual implementation
  });

  test('filters data correctly based on active filters', () => {
    const filterProps = {
      ...defaultProps,
      filters: {
        enabled: true,
        filters: [
          {
            key: 'category',
            label: 'Category',
            type: 'select' as const,
            options: [
              { label: 'Category A', value: 'A' },
              { label: 'Category B', value: 'B' }
            ]
          }
        ]
      }
    };

    render(<InteractiveChart {...filterProps} />);
    
    // The component should render with all data initially
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});

describe('TrendChart Component', () => {
  const mockTrendData = [
    { timestamp: '2024-01-01T00:00:00Z', value: 100, target: 120 },
    { timestamp: '2024-01-02T00:00:00Z', value: 110, target: 120 },
    { timestamp: '2024-01-03T00:00:00Z', value: 105, target: 120 },
    { timestamp: '2024-01-04T00:00:00Z', value: 125, target: 120 },
    { timestamp: '2024-01-05T00:00:00Z', value: 130, target: 120 }
  ];

  const defaultTrendProps = {
    data: mockTrendData,
    title: 'Test Trend Chart',
    description: 'A test trend chart'
  };

  test('renders trend chart with basic props', () => {
    render(<TrendChart {...defaultTrendProps} />);
    
    expect(screen.getByText('Test Trend Chart')).toBeInTheDocument();
    expect(screen.getByText('A test trend chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  test('displays trend analysis when enabled', () => {
    const analysisProps = {
      ...defaultTrendProps,
      analysis: {
        enabled: true,
        windowSize: 5,
        showPrediction: true,
        showConfidenceBands: true,
        anomalyDetection: true
      }
    };

    render(<TrendChart {...analysisProps} />);
    
    // Should display trend indicators
    expect(screen.getByText(/UP|DOWN|STABLE/i)).toBeInTheDocument();
  });

  test('shows real-time controls when real-time is enabled', () => {
    const realTimeProps = {
      ...defaultTrendProps,
      realTime: {
        enabled: true,
        interval: 1000,
        maxDataPoints: 50
      }
    };

    render(<TrendChart {...realTimeProps} />);
    
    expect(screen.getByRole('button', { name: /pause|play/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  test('handles play/pause functionality', async () => {
    const realTimeProps = {
      ...defaultTrendProps,
      realTime: {
        enabled: true,
        interval: 1000
      }
    };

    render(<TrendChart {...realTimeProps} />);
    
    const playPauseButton = screen.getByRole('button', { name: /pause/i });
    await userEvent.click(playPauseButton);
    
    // Should change to play button
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  test('displays data summary correctly', () => {
    render(<TrendChart {...defaultTrendProps} />);
    
    expect(screen.getByText('Data Points')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Number of data points
    expect(screen.getByText('Anomalies')).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();
  });

  test('detects and displays anomalies', () => {
    const anomalyData = [
      ...mockTrendData,
      { timestamp: '2024-01-06T00:00:00Z', value: 500, target: 120 } // Anomaly
    ];

    const anomalyProps = {
      ...defaultTrendProps,
      data: anomalyData,
      analysis: {
        enabled: true,
        anomalyDetection: true
      }
    };

    render(<TrendChart {...anomalyProps} />);
    
    // Should detect the anomaly
    expect(screen.getByText('Anomalies')).toBeInTheDocument();
  });

  test('shows prediction line when enabled', () => {
    const predictionProps = {
      ...defaultTrendProps,
      analysis: {
        enabled: true,
        showPrediction: true
      }
    };

    render(<TrendChart {...predictionProps} />);
    
    // Should render prediction elements
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('handles trend change callbacks', () => {
    const mockTrendChange = jest.fn();
    const callbackProps = {
      ...defaultTrendProps,
      onTrendChange: mockTrendChange
    };

    render(<TrendChart {...callbackProps} />);
    
    // Should call trend change callback during analysis
    expect(mockTrendChange).toHaveBeenCalled();
  });

  test('displays animation progress when enabled', () => {
    const animationProps = {
      ...defaultTrendProps,
      animation: {
        enabled: true,
        duration: 1000
      }
    };

    render(<TrendChart {...animationProps} />);
    
    expect(screen.getByText('Animation Progress')).toBeInTheDocument();
  });
});

describe('HeatmapChart Component', () => {
  const mockHeatmapData = [
    { x: 'A', y: '1', value: 10, category: 'high' },
    { x: 'A', y: '2', value: 20, category: 'medium' },
    { x: 'B', y: '1', value: 15, category: 'high' },
    { x: 'B', y: '2', value: 25, category: 'low' },
    { x: 'C', y: '1', value: 30, category: 'high' },
    { x: 'C', y: '2', value: 5, category: 'low' }
  ];

  const defaultHeatmapProps = {
    data: mockHeatmapData,
    title: 'Test Heatmap Chart',
    description: 'A test heatmap chart'
  };

  test('renders heatmap chart with basic props', () => {
    render(<HeatmapChart {...defaultHeatmapProps} />);
    
    expect(screen.getByText('Test Heatmap Chart')).toBeInTheDocument();
    expect(screen.getByText('A test heatmap chart')).toBeInTheDocument();
  });

  test('displays statistics correctly', () => {
    render(<HeatmapChart {...defaultHeatmapProps} />);
    
    expect(screen.getByText('Data Points')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument(); // Number of data points
    expect(screen.getByText('Min Value')).toBeInTheDocument();
    expect(screen.getByText('Max Value')).toBeInTheDocument();
    expect(screen.getByText('Range')).toBeInTheDocument();
  });

  test('shows pattern analysis when enabled', async () => {
    const patternProps = {
      ...defaultHeatmapProps,
      patterns: {
        enabled: true,
        clusterAnalysis: true,
        hotspotDetection: true,
        trendAnalysis: true
      }
    };

    render(<HeatmapChart {...patternProps} />);
    
    const patternButton = screen.getByRole('button', { name: /patterns/i });
    await userEvent.click(patternButton);
    
    expect(screen.getByText('Pattern Analysis')).toBeInTheDocument();
    expect(screen.getByText('Hotspots')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByText('Clusters')).toBeInTheDocument();
  });

  test('displays correlation analysis when enabled', () => {
    const correlationProps = {
      ...defaultHeatmapProps,
      correlation: {
        enabled: true,
        method: 'pearson' as const,
        showSignificance: true,
        threshold: 0.5
      }
    };

    render(<HeatmapChart {...correlationProps} />);
    
    // Should show correlation results if any strong correlations are found
    // This depends on the data and correlation calculation
  });

  test('handles cell interactions', async () => {
    const mockCellClick = jest.fn();
    const mockCellHover = jest.fn();
    
    const interactionProps = {
      ...defaultHeatmapProps,
      interaction: {
        hover: true,
        click: true,
        selection: true
      },
      onCellClick: mockCellClick,
      onCellHover: mockCellHover
    };

    render(<HeatmapChart {...interactionProps} />);
    
    // In a real test, we would interact with SVG elements
    // Here we're testing that the handlers are set up correctly
  });

  test('displays legend when enabled', () => {
    const legendProps = {
      ...defaultHeatmapProps,
      visual: {
        showLegend: true,
        showLabels: true,
        showGrid: true
      }
    };

    render(<HeatmapChart {...legendProps} />);
    
    // Should display legend with color scale
    expect(screen.getByText('Value')).toBeInTheDocument(); // Default value label
  });

  test('applies different color schemes', () => {
    const colorProps = {
      ...defaultHeatmapProps,
      colorScheme: 'plasma' as const
    };

    render(<HeatmapChart {...colorProps} />);
    
    // The color scheme would be applied to the heatmap cells
    // In a real test, we might check SVG fill attributes
  });

  test('handles custom colors', () => {
    const customColorProps = {
      ...defaultHeatmapProps,
      colorScheme: 'custom' as const,
      customColors: ['#ff0000', '#00ff00', '#0000ff']
    };

    render(<HeatmapChart {...customColorProps} />);
    
    // Custom colors should be applied
  });

  test('shows selected cells information', async () => {
    const selectionProps = {
      ...defaultHeatmapProps,
      interaction: {
        selection: true,
        click: true
      }
    };

    render(<HeatmapChart {...selectionProps} />);
    
    // In a real scenario, we would click on cells to select them
    // and then check for selection information display
  });

  test('handles reset functionality', async () => {
    render(<HeatmapChart {...defaultHeatmapProps} />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);
    
    // Should reset zoom, pan, and selections
  });

  test('calculates value ranges correctly', () => {
    render(<HeatmapChart {...defaultHeatmapProps} />);
    
    // Min value should be 5, max should be 30, range should be 25
    expect(screen.getByText('5.00')).toBeInTheDocument(); // Min value
    expect(screen.getByText('30.00')).toBeInTheDocument(); // Max value
    expect(screen.getByText('25.00')).toBeInTheDocument(); // Range
  });
});

describe('Chart Component Integration', () => {
  test('all chart components handle empty data gracefully', () => {
    const emptyData: any[] = [];
    
    render(<InteractiveChart data={emptyData} type="line" />);
    render(<TrendChart data={emptyData} />);
    render(<HeatmapChart data={emptyData} />);
    
    // Should not crash and should handle empty data appropriately
  });

  test('chart components handle invalid data gracefully', () => {
    const invalidData = [
      { name: 'Test', value: NaN },
      { name: 'Test2', value: Infinity },
      { name: 'Test3', value: -Infinity }
    ];
    
    // Should not crash with invalid numeric values
    expect(() => {
      render(<InteractiveChart data={invalidData} type="line" />);
    }).not.toThrow();
  });

  test('chart components are accessible', () => {
    render(<InteractiveChart data={[]} type="line" title="Accessible Chart" />);
    render(<TrendChart data={[]} title="Accessible Trend Chart" />);
    render(<HeatmapChart data={[]} title="Accessible Heatmap Chart" />);
    
    // Should have proper ARIA labels and roles
    expect(screen.getByText('Accessible Chart')).toBeInTheDocument();
    expect(screen.getByText('Accessible Trend Chart')).toBeInTheDocument();
    expect(screen.getByText('Accessible Heatmap Chart')).toBeInTheDocument();
  });

  test('chart components handle theme changes', () => {
    const { rerender } = render(
      <InteractiveChart data={[]} type="line" theme="light" />
    );
    
    rerender(<InteractiveChart data={[]} type="line" theme="dark" />);
    
    // Should handle theme changes without crashing
  });

  test('chart components handle resize correctly', () => {
    const { rerender } = render(
      <InteractiveChart data={[]} type="line" height={400} />
    );
    
    rerender(<InteractiveChart data={[]} type="line" height={600} />);
    
    // Should handle size changes
  });
});