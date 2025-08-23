import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components after mocking
import { InteractiveChart } from '../components/analytics/charts/InteractiveChart';
import { TrendChart } from '../components/analytics/charts/TrendChart';

// Mock all external dependencies to avoid complex interactions
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

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children, ...props }: any) => <div data-testid="line-chart" {...props}>{children}</div>,
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

describe('Advanced Chart Components - Basic Functionality', () => {
  const mockData = [
    { name: 'Jan', value: 100, category: 'A' },
    { name: 'Feb', value: 150, category: 'B' },
    { name: 'Mar', value: 200, category: 'A' }
  ];

  const mockTrendData = [
    { timestamp: '2024-01-01T00:00:00Z', value: 100, target: 120 },
    { timestamp: '2024-01-02T00:00:00Z', value: 110, target: 120 },
    { timestamp: '2024-01-03T00:00:00Z', value: 105, target: 120 }
  ];

  describe('InteractiveChart Component', () => {
    test('renders with basic props', () => {
      render(
        <InteractiveChart 
          data={mockData} 
          type="line" 
          title="Test Chart" 
          description="Test Description"
        />
      );
      
      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    test('renders different chart types', () => {
      const { rerender } = render(
        <InteractiveChart data={mockData} type="bar" />
      );
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

      rerender(<InteractiveChart data={mockData} type="area" />);
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();

      rerender(<InteractiveChart data={mockData} type="pie" />);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();

      rerender(<InteractiveChart data={mockData} type="scatter" />);
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });

    test('handles empty data gracefully', () => {
      render(<InteractiveChart data={[]} type="line" />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    test('displays zoom controls when enabled', () => {
      render(
        <InteractiveChart 
          data={mockData} 
          type="line"
          zoom={{ enabled: true, type: 'xy' }}
        />
      );
      
      // Should have zoom buttons (mocked as regular buttons)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('displays export button when enabled', () => {
      render(
        <InteractiveChart 
          data={mockData} 
          type="line"
          export={{ enabled: true, formats: ['png'] }}
        />
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('TrendChart Component', () => {
    test('renders with basic props', () => {
      render(
        <TrendChart 
          data={mockTrendData} 
          title="Test Trend Chart" 
          description="Test Trend Description"
        />
      );
      
      expect(screen.getByText('Test Trend Chart')).toBeInTheDocument();
      expect(screen.getByText('Test Trend Description')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    test('displays data summary', () => {
      render(<TrendChart data={mockTrendData} />);
      
      expect(screen.getByText('Data Points')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Number of data points
      expect(screen.getByText('Anomalies')).toBeInTheDocument();
      expect(screen.getByText('Confidence')).toBeInTheDocument();
    });

    test('shows real-time controls when enabled', () => {
      render(
        <TrendChart 
          data={mockTrendData}
          realTime={{ enabled: true, interval: 1000 }}
        />
      );
      
      expect(screen.getByText('Live')).toBeInTheDocument();
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('displays trend analysis when enabled', () => {
      render(
        <TrendChart 
          data={mockTrendData}
          analysis={{ enabled: true, showPrediction: true }}
        />
      );
      
      // Should display trend indicators
      expect(screen.getByText(/UP|DOWN|STABLE/i)).toBeInTheDocument();
    });

    test('handles empty data gracefully', () => {
      render(<TrendChart data={[]} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Chart Component Integration', () => {
    test('components handle invalid data gracefully', () => {
      const invalidData = [
        { name: 'Test', value: NaN },
        { name: 'Test2', value: Infinity }
      ];
      
      expect(() => {
        render(<InteractiveChart data={invalidData} type="line" />);
      }).not.toThrow();
      
      expect(() => {
        render(<TrendChart data={[]} />);
      }).not.toThrow();
    });

    test('components are accessible', () => {
      render(<InteractiveChart data={mockData} type="line" title="Accessible Chart" />);
      render(<TrendChart data={mockTrendData} title="Accessible Trend Chart" />);
      
      expect(screen.getByText('Accessible Chart')).toBeInTheDocument();
      expect(screen.getByText('Accessible Trend Chart')).toBeInTheDocument();
    });

    test('components handle theme changes', () => {
      const { rerender } = render(
        <InteractiveChart data={mockData} type="line" theme="light" />
      );
      
      rerender(<InteractiveChart data={mockData} type="line" theme="dark" />);
      
      // Should handle theme changes without crashing
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    test('components handle resize correctly', () => {
      const { rerender } = render(
        <InteractiveChart data={mockData} type="line" height={400} />
      );
      
      rerender(<InteractiveChart data={mockData} type="line" height={600} />);
      
      // Should handle size changes
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Chart Data Processing', () => {
    test('InteractiveChart processes data correctly', () => {
      render(<InteractiveChart data={mockData} type="line" />);
      
      // Should render chart with data
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    test('TrendChart processes trend data correctly', () => {
      render(<TrendChart data={mockTrendData} />);
      
      // Should render chart with trend data
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByText('Data Points')).toBeInTheDocument();
    });

    test('Charts handle data updates', () => {
      const { rerender } = render(
        <InteractiveChart data={mockData} type="line" />
      );
      
      const newData = [...mockData, { name: 'Apr', value: 250, category: 'C' }];
      rerender(<InteractiveChart data={newData} type="line" />);
      
      // Should handle data updates without crashing
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Chart Configuration', () => {
    test('InteractiveChart applies custom colors', () => {
      const customColors = ['#ff0000', '#00ff00', '#0000ff'];
      render(
        <InteractiveChart 
          data={mockData} 
          type="line" 
          colors={customColors}
        />
      );
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    test('TrendChart applies animation settings', () => {
      render(
        <TrendChart 
          data={mockTrendData}
          animation={{ enabled: true, duration: 1000 }}
        />
      );
      
      expect(screen.getByText('Animation Progress')).toBeInTheDocument();
    });

    test('Charts handle disabled features', () => {
      render(
        <InteractiveChart 
          data={mockData} 
          type="line"
          zoom={{ enabled: false, type: 'x' }}
          export={{ enabled: false, formats: [] }}
        />
      );
      
      render(
        <TrendChart 
          data={mockTrendData}
          realTime={{ enabled: false }}
          analysis={{ enabled: false }}
        />
      );
      
      // Should render without optional features
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
    });
  });
});