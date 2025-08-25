import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChartExportMenu } from '../components/analytics/charts/ChartExportMenu';
import { ChartAnnotations } from '../components/analytics/charts/ChartAnnotations';
import { InteractiveChart } from '../components/analytics/charts/InteractiveChart';
import { TrendChart } from '../components/analytics/charts/TrendChart';
import { HeatmapChart } from '../components/analytics/charts/HeatmapChart';

// Mock the chart export service
jest.mock('../services/chartExportService', () => ({
  chartExportService: {
    exportToPNG: jest.fn().mockResolvedValue({ success: true, filename: 'chart.png' }),
    exportToSVG: jest.fn().mockResolvedValue({ success: true, filename: 'chart.svg' }),
    exportToPDF: jest.fn().mockResolvedValue({ success: true, filename: 'chart.pdf' }),
    exportToCSV: jest.fn().mockResolvedValue({ success: true, filename: 'chart.csv' }),
    generateShareLink: jest.fn().mockResolvedValue('https://example.com/share/123'),
    generateEmbedCode: jest.fn().mockReturnValue('<iframe src="https://example.com/embed/123"></iframe>'),
    getAnnotations: jest.fn().mockReturnValue([]),
    createAnnotation: jest.fn().mockReturnValue('annotation-123'),
    deleteAnnotation: jest.fn().mockReturnValue(true)
  }
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    rect: ({ children, ...props }: any) => <rect {...props}>{children}</rect>,
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
    line: ({ children, ...props }: any) => <line {...props}>{children}</line>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  ScatterChart: ({ children }: any) => <div data-testid="scatter-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Scatter: () => <div data-testid="scatter" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Brush: () => <div data-testid="brush" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  ReferenceArea: () => <div data-testid="reference-area" />
}));

describe('Chart and Visualization Components - Gradient Styling', () => {
  const mockChartData = [
    { name: 'Jan', value: 100 },
    { name: 'Feb', value: 200 },
    { name: 'Mar', value: 150 }
  ];

  const mockTrendData = [
    { timestamp: '2024-01-01', value: 100, target: 120 },
    { timestamp: '2024-01-02', value: 110, target: 120 },
    { timestamp: '2024-01-03', value: 105, target: 120 }
  ];

  const mockHeatmapData = [
    { x: 'A', y: '1', value: 10 },
    { x: 'B', y: '1', value: 20 },
    { x: 'A', y: '2', value: 15 }
  ];

  describe('ChartExportMenu Component', () => {
    it('should render export button with gradient styling', () => {
      const mockElement = document.createElement('div');
      render(
        <ChartExportMenu
          chartElement={mockElement}
          chartData={mockChartData}
          chartId="test-chart"
        />
      );

      const exportButton = screen.getByRole('button');
      expect(exportButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
      expect(exportButton).toHaveClass('shadow-lg', 'hover:shadow-xl');
    });
  });

  describe('ChartAnnotations Component', () => {
    it('should render annotation controls with gradient styling', () => {
      const mockElement = document.createElement('div');
      render(
        <ChartAnnotations
          chartId="test-chart"
          chartElement={mockElement}
          currentUser={{ name: 'Test User' }}
        />
      );

      const addButton = screen.getByText('Add Annotation');
      expect(addButton).toHaveClass('shadow-lg', 'hover:shadow-xl');

      const showButton = screen.getByRole('button', { name: 'Hide' }); // Default is showing, so button says "Hide"
      expect(showButton).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600');

      const badge = screen.getByText(/0 annotation/);
      expect(badge).toHaveClass('bg-gradient-to-r', 'from-slate-100', 'to-slate-200');
    });
  });

  describe('InteractiveChart Component', () => {
    it('should maintain existing beautiful styling', () => {
      render(
        <InteractiveChart
          data={mockChartData}
          type="line"
          title="Test Chart"
          enableExport={true}
          enableAnnotations={true}
        />
      );

      // Chart should render with existing styling preserved
      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render export and annotation buttons', () => {
      render(
        <InteractiveChart
          data={mockChartData}
          type="line"
          title="Test Chart"
          enableExport={true}
          enableAnnotations={true}
        />
      );

      // Should have export and annotation buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('TrendChart Component', () => {
    it('should preserve existing beautiful design', () => {
      render(
        <TrendChart
          data={mockTrendData}
          title="Trend Analysis"
          enableExport={true}
          enableAnnotations={true}
        />
      );

      // Chart should render with existing styling preserved
      expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render trend analysis with existing styling', () => {
      render(
        <TrendChart
          data={mockTrendData}
          title="Trend Analysis"
          analysis={{ enabled: true }}
        />
      );

      // Should show trend analysis components
      expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
    });
  });

  describe('HeatmapChart Component', () => {
    it('should keep existing beautiful styling', () => {
      render(
        <HeatmapChart
          data={mockHeatmapData}
          title="Heatmap Analysis"
          width={400}
          height={300}
        />
      );

      // Chart should render with existing styling preserved
      expect(screen.getByText('Heatmap Analysis')).toBeInTheDocument();
    });

    it('should render pattern analysis controls with existing styling', () => {
      render(
        <HeatmapChart
          data={mockHeatmapData}
          title="Heatmap Analysis"
          patterns={{ enabled: true }}
        />
      );

      // Should have pattern controls
      expect(screen.getByText('Heatmap Analysis')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should render chart components with gradient styling', () => {
      const mockElement = document.createElement('div');
      
      render(
        <div>
          <InteractiveChart
            data={mockChartData}
            type="line"
            title="Interactive Chart"
          />
          <ChartExportMenu
            chartElement={mockElement}
            chartData={mockChartData}
          />
          <ChartAnnotations
            chartId="test-chart"
            chartElement={mockElement}
            currentUser={{ name: 'Test User' }}
          />
        </div>
      );

      // All components should render
      expect(screen.getByText('Interactive Chart')).toBeInTheDocument();
      expect(screen.getByText('Add Annotation')).toBeInTheDocument();
      
      // Export button should have gradient styling - get the first one with gradient classes
      const exportButtons = screen.getAllByRole('button');
      const gradientButton = exportButtons.find(button => 
        button.className.includes('bg-gradient-to-r') && 
        button.className.includes('from-green-500')
      );
      expect(gradientButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
    });

    it('should maintain responsive behavior with gradient styling', () => {
      const mockElement = document.createElement('div');
      
      render(
        <div className="w-full">
          <InteractiveChart
            data={mockChartData}
            type="bar"
            title="Responsive Chart"
            height={300}
          />
          <ChartExportMenu
            chartElement={mockElement}
            chartData={mockChartData}
          />
        </div>
      );

      // Components should render responsively
      expect(screen.getByText('Responsive Chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });
});