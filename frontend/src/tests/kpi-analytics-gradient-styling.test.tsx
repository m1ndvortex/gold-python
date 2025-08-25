import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetricCard } from '@/components/analytics/MetricCard';
import { SparklineChart } from '@/components/analytics/SparklineChart';
import { TrendIndicator } from '@/components/analytics/TrendIndicator';

// Mock API
jest.mock('@/services/api', () => ({
  apiGet: jest.fn()
}));

const mockApiGet = require('@/services/api').apiGet;

// Test wrapper with QueryClient
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('KPI Analytics Gradient Styling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MetricCard Component', () => {
    const mockMetricData = {
      id: 'revenue',
      title: 'Monthly Revenue',
      value: 125000,
      target: 100000,
      unit: 'USD',
      format: 'currency' as const,
      status: 'success' as const,
      trend: {
        direction: 'up' as const,
        percentage: 15.5,
        period: 'vs last month'
      },
      lastUpdated: '2024-01-31T23:59:59Z'
    };

    it('renders with gradient background based on status', () => {
      render(<MetricCard data={mockMetricData} />);

      const card = screen.getByText('Monthly Revenue').closest('.border-0.shadow-lg');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-green-50', 'to-teal-100/50');
    });

    it('displays gradient icon container', () => {
      render(<MetricCard data={mockMetricData} showIcon={true} />);

      const iconContainer = document.querySelector('.bg-gradient-to-br.from-blue-500.to-indigo-600');
      expect(iconContainer).toBeInTheDocument();
    });

    it('shows gradient progress bar for achievement', () => {
      render(<MetricCard data={mockMetricData} />);

      const progressBar = document.querySelector('.bg-gradient-to-r.from-green-500.to-teal-600');
      expect(progressBar).toBeInTheDocument();
    });

    it('renders different gradient colors for different statuses', () => {
      const warningData = { ...mockMetricData, status: 'warning' as const };
      const { rerender } = render(<MetricCard data={warningData} />);

      let card = screen.getByText('Monthly Revenue').closest('.border-0.shadow-lg');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-yellow-50', 'to-orange-100/50');

      const dangerData = { ...mockMetricData, status: 'danger' as const };
      rerender(<MetricCard data={dangerData} />);

      card = screen.getByText('Monthly Revenue').closest('.border-0.shadow-lg');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-red-50', 'to-pink-100/50');
    });
  });

  describe('SparklineChart Component', () => {
    const mockData = [100, 110, 105, 125, 120, 125, 130];

    it('renders with gradient line and area', () => {
      render(
        <SparklineChart 
          data={mockData} 
          showArea={true}
          gradientColors={{ from: '#10b981', to: '#0d9488' }}
        />
      );

      // Check for gradient definitions
      const gradients = document.querySelectorAll('linearGradient');
      expect(gradients.length).toBeGreaterThan(0);

      // Check for gradient usage in path
      const paths = document.querySelectorAll('path[stroke*="url(#"]');
      expect(paths.length).toBeGreaterThan(0);
    });

    it('renders with gradient colors and styling', () => {
      render(
        <SparklineChart 
          data={mockData} 
          showArea={true}
          showDots={true}
          gradientColors={{ from: '#10b981', to: '#0d9488' }}
        />
      );

      // Check for gradient definitions
      const gradients = document.querySelectorAll('linearGradient');
      expect(gradients.length).toBeGreaterThan(0);

      // Check for gradient usage in path
      const paths = document.querySelectorAll('path[stroke*="url(#"]');
      expect(paths.length).toBeGreaterThan(0);

      // Check for dots with gradient styling
      const dots = document.querySelectorAll('circle[fill*="url(#"]');
      expect(dots.length).toBeGreaterThan(0);
    });
  });

  describe('TrendIndicator Component', () => {
    it('renders with gradient text colors', () => {
      render(
        <TrendIndicator 
          direction="up" 
          percentage={15.5} 
          significance="high"
        />
      );

      const indicator = document.querySelector('.bg-gradient-to-r.from-green-600.to-teal-600');
      expect(indicator).toBeInTheDocument();
    });

    it('renders badge variant with gradient styling', () => {
      render(
        <TrendIndicator 
          direction="up" 
          percentage={15.5} 
          variant="badge"
          significance="medium"
        />
      );

      const badge = document.querySelector('.bg-gradient-to-br.from-green-50.to-teal-50');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('shadow-lg', 'hover:shadow-xl');
    });

    it('renders different gradient colors for different directions', () => {
      const { rerender } = render(
        <TrendIndicator 
          direction="down" 
          percentage={-10.2} 
          significance="high"
        />
      );

      let indicator = document.querySelector('.bg-gradient-to-r.from-red-600.to-pink-600');
      expect(indicator).toBeInTheDocument();

      rerender(
        <TrendIndicator 
          direction="stable" 
          percentage={0} 
          significance="medium"
        />
      );

      indicator = document.querySelector('.bg-gradient-to-r.from-gray-500.to-slate-500');
      expect(indicator).toBeInTheDocument();
    });

    it('renders with gradient background containers', () => {
      render(
        <TrendIndicator 
          direction="up" 
          percentage={15.5} 
          showIcon={true}
        />
      );

      const container = document.querySelector('.bg-gradient-to-br.from-green-50.to-teal-50');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('shadow-lg');
    });
  });

  describe('Integration Tests', () => {
    it('components have consistent gradient styling patterns', () => {
      const mockMetricData = {
        id: 'test-metric',
        title: 'Test Metric',
        value: 100,
        target: 80,
        status: 'success' as const,
        trend: { direction: 'up' as const, percentage: 25, period: 'vs last month' }
      };

      const { container } = render(
        <div>
          <MetricCard data={mockMetricData} />
          <TrendIndicator direction="up" percentage={15.5} variant="badge" />
          <SparklineChart data={[10, 20, 15, 25, 30]} showArea={true} />
        </div>
      );

      // Check that all components use gradient styling
      const gradientElements = container.querySelectorAll('[class*="gradient"]');
      expect(gradientElements.length).toBeGreaterThan(5);

      // Check for consistent shadow styling
      const shadowElements = container.querySelectorAll('.shadow-lg');
      expect(shadowElements.length).toBeGreaterThan(2);

      // Check for consistent border-0 styling (no borders)
      const borderlessElements = container.querySelectorAll('.border-0');
      expect(borderlessElements.length).toBeGreaterThan(0);
    });
  });
});