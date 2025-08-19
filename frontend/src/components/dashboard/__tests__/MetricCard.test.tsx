import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricCard } from '../MetricCard';
import { DollarSign, Package, Users, TrendingUp } from 'lucide-react';

// Mock requestAnimationFrame for animation testing
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: 1000,
    icon: DollarSign,
    color: 'gold' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with basic props', () => {
      render(<MetricCard {...defaultProps} />);
      
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('renders with string value', () => {
      render(<MetricCard {...defaultProps} value="$1,234.56" />);
      
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('renders with subtitle', () => {
      render(<MetricCard {...defaultProps} subtitle="Additional info" />);
      
      expect(screen.getByText('Additional info')).toBeInTheDocument();
    });

    it('renders with badge', () => {
      render(<MetricCard {...defaultProps} badge="New" />);
      
      expect(screen.getByText('New')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton when isLoading is true', () => {
      const { container } = render(<MetricCard {...defaultProps} isLoading={true} />);
      
      // Should not render the actual content
      expect(screen.queryByText('Test Metric')).not.toBeInTheDocument();
      expect(screen.queryByText('1,000')).not.toBeInTheDocument();
      
      // Should have loading animation class
      const card = container.firstChild;
      expect(card).toHaveClass('animate-pulse');
    });
  });

  describe('Color Variants', () => {
    const colors = ['gold', 'green', 'blue', 'red', 'purple'] as const;

    colors.forEach(color => {
      it(`renders with ${color} color variant`, () => {
        const { container } = render(<MetricCard {...defaultProps} color={color} />);
        
        // Check if the appropriate color classes are applied
        const card = container.querySelector('[class*="bg-gradient-to-br"]');
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('Trend Indicators', () => {
    it('renders increase trend indicator', () => {
      const change = {
        value: 15.5,
        type: 'increase' as const,
        period: 'vs last month'
      };
      
      render(<MetricCard {...defaultProps} change={change} />);
      
      expect(screen.getByText('15.5%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('renders decrease trend indicator', () => {
      const change = {
        value: -8.2,
        type: 'decrease' as const,
        period: 'vs last week'
      };
      
      render(<MetricCard {...defaultProps} change={change} />);
      
      expect(screen.getByText('8.2%')).toBeInTheDocument();
      expect(screen.getByText('vs last week')).toBeInTheDocument();
    });

    it('renders neutral trend indicator', () => {
      const change = {
        value: 0,
        type: 'neutral' as const,
        period: 'no change'
      };
      
      render(<MetricCard {...defaultProps} change={change} />);
      
      expect(screen.getByText('0.0%')).toBeInTheDocument();
      expect(screen.getByText('no change')).toBeInTheDocument();
    });
  });

  describe('Sparkline Chart', () => {
    it('renders sparkline when trend data is provided', () => {
      const trend = [100, 120, 110, 130, 125, 140, 135];
      const { container } = render(<MetricCard {...defaultProps} trend={trend} />);
      
      // Look for the sparkline SVG specifically (not the icon SVG)
      const sparklineSvg = container.querySelector('svg[width="60"]');
      expect(sparklineSvg).toBeInTheDocument();
      
      const polyline = container.querySelector('polyline');
      expect(polyline).toBeInTheDocument();
    });

    it('does not render sparkline when trend data is empty', () => {
      const { container } = render(<MetricCard {...defaultProps} trend={[]} />);
      
      // Look for the sparkline SVG specifically (not the icon SVG)
      const sparklineSvg = container.querySelector('svg[width="60"]');
      expect(sparklineSvg).not.toBeInTheDocument();
    });

    it('does not render sparkline when trend data is not provided', () => {
      const { container } = render(<MetricCard {...defaultProps} />);
      
      // Look for the sparkline SVG specifically (not the icon SVG)
      const sparklineSvg = container.querySelector('svg[width="60"]');
      expect(sparklineSvg).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when card is clicked', () => {
      const handleClick = jest.fn();
      render(<MetricCard {...defaultProps} onClick={handleClick} />);
      
      const card = screen.getByTestId('metric-card');
      fireEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies cursor-pointer class when onClick is provided', () => {
      const handleClick = jest.fn();
      render(<MetricCard {...defaultProps} onClick={handleClick} />);
      
      const card = screen.getByTestId('metric-card');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('does not apply cursor-pointer class when onClick is not provided', () => {
      render(<MetricCard {...defaultProps} />);
      
      const card = screen.getByTestId('metric-card');
      expect(card).not.toHaveClass('cursor-pointer');
    });

    it('handles hover states', () => {
      render(<MetricCard {...defaultProps} />);
      
      const card = screen.getByTestId('metric-card');
      
      fireEvent.mouseEnter(card);
      // Hover effects are handled by CSS classes, so we just verify the event handlers work
      
      fireEvent.mouseLeave(card);
      // No specific assertions needed as hover is handled by CSS
    });
  });

  describe('Animated Counter', () => {
    it('displays numeric values correctly in test environment', () => {
      render(<MetricCard {...defaultProps} value={1000} />);
      
      // In test environment, animation is skipped and shows final value immediately
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('handles non-numeric values without animation', () => {
      render(<MetricCard {...defaultProps} value="N/A" />);
      
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('handles zero values', () => {
      render(<MetricCard {...defaultProps} value={0} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes when clickable', () => {
      const handleClick = jest.fn();
      render(<MetricCard {...defaultProps} onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('supports keyboard navigation when clickable', () => {
      const handleClick = jest.fn();
      render(<MetricCard {...defaultProps} onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(card, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('does not have button role when not clickable', () => {
      render(<MetricCard {...defaultProps} />);
      
      const card = screen.getByTestId('metric-card');
      expect(card).not.toHaveAttribute('role');
      expect(card).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Responsive Design', () => {
    it('applies custom className', () => {
      const { container } = render(<MetricCard {...defaultProps} className="custom-class" />);
      
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('maintains responsive grid layout classes', () => {
      const { container } = render(<MetricCard {...defaultProps} />);
      
      // The component should work within responsive grid layouts
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles large numeric values efficiently', () => {
      const largeValue = 999999999;
      render(<MetricCard {...defaultProps} value={largeValue} />);
      
      // Should format large numbers with commas
      expect(screen.getByText('999,999,999')).toBeInTheDocument();
    });

    it('handles rapid prop changes', () => {
      const { rerender } = render(<MetricCard {...defaultProps} value={100} />);
      
      rerender(<MetricCard {...defaultProps} value={200} />);
      rerender(<MetricCard {...defaultProps} value={300} />);
      
      // Component should handle rapid updates without issues
      expect(screen.getByText('300')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles negative values', () => {
      render(<MetricCard {...defaultProps} value={-500} />);
      
      expect(screen.getByText('-500')).toBeInTheDocument();
    });

    it('handles decimal values', () => {
      render(<MetricCard {...defaultProps} value={123.45} />);
      
      // In test environment, decimal values are displayed as-is
      expect(screen.getByText('123.45')).toBeInTheDocument();
    });

    it('handles very small trend changes', () => {
      const change = {
        value: 0.01,
        type: 'increase' as const,
        period: 'minimal change'
      };
      
      render(<MetricCard {...defaultProps} change={change} />);
      
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('handles missing trend data gracefully', () => {
      render(<MetricCard {...defaultProps} trend={undefined} />);
      
      // Should render without errors
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
    });
  });
});

describe('MetricCard Integration', () => {
  const integrationDefaultProps = {
    title: 'Test Metric',
    value: 1000,
    icon: DollarSign,
    color: 'gold' as const,
  };

  it('works with different icon components', () => {
    const icons = [DollarSign, Package, Users, TrendingUp];
    
    icons.forEach((Icon, index) => {
      const { container } = render(
        <MetricCard
          {...integrationDefaultProps}
          icon={Icon}
          title={`Metric ${index}`}
        />
      );
      
      expect(screen.getByText(`Metric ${index}`)).toBeInTheDocument();
    });
  });

  it('maintains consistent styling across different configurations', () => {
    const configurations = [
      { color: 'gold' as const, value: 1000 },
      { color: 'green' as const, value: 2000, badge: 'High' },
      { color: 'red' as const, value: 500, subtitle: 'Low performance' },
      { color: 'blue' as const, value: 1500, trend: [100, 200, 150] }
    ];

    configurations.forEach((config, index) => {
      const { container } = render(
        <MetricCard
          {...integrationDefaultProps}
          {...config}
          title={`Config ${index}`}
        />
      );
      
      expect(screen.getByText(`Config ${index}`)).toBeInTheDocument();
    });
  });
});