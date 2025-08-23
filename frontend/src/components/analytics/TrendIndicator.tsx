import React from 'react';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowUp, 
  ArrowDown,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export interface TrendIndicatorProps {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  period?: string;
  significance?: 'high' | 'medium' | 'low';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'badge' | 'arrow';
  showIcon?: boolean;
  showPercentage?: boolean;
  showPeriod?: boolean;
  className?: string;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  direction,
  percentage,
  period,
  significance = 'medium',
  size = 'sm',
  variant = 'default',
  showIcon = true,
  showPercentage = true,
  showPeriod = true,
  className
}) => {
  const getDirectionColor = (dir: string, sig: string = 'medium') => {
    const intensity = sig === 'high' ? '600' : sig === 'medium' ? '500' : '400';
    
    switch (dir) {
      case 'up':
        return `text-green-${intensity}`;
      case 'down':
        return `text-red-${intensity}`;
      case 'stable':
        return `text-gray-${intensity}`;
      default:
        return 'text-gray-400';
    }
  };

  const getBackgroundColor = (dir: string, sig: string = 'medium') => {
    const intensity = sig === 'high' ? '100' : sig === 'medium' ? '50' : '25';
    
    switch (dir) {
      case 'up':
        return `bg-green-${intensity}`;
      case 'down':
        return `bg-red-${intensity}`;
      case 'stable':
        return `bg-gray-${intensity}`;
      default:
        return 'bg-gray-25';
    }
  };

  const getBorderColor = (dir: string, sig: string = 'medium') => {
    const intensity = sig === 'high' ? '300' : sig === 'medium' ? '200' : '100';
    
    switch (dir) {
      case 'up':
        return `border-green-${intensity}`;
      case 'down':
        return `border-red-${intensity}`;
      case 'stable':
        return `border-gray-${intensity}`;
      default:
        return 'border-gray-100';
    }
  };

  const getIcon = (iconVariant: string = 'default') => {
    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    const iconSize = iconSizes[size];

    switch (iconVariant) {
      case 'arrow':
        switch (direction) {
          case 'up':
            return <ArrowUp className={iconSize} />;
          case 'down':
            return <ArrowDown className={iconSize} />;
          case 'stable':
            return <ArrowRight className={iconSize} />;
        }
        break;
      case 'chevron':
        switch (direction) {
          case 'up':
            return <ChevronUp className={iconSize} />;
          case 'down':
            return <ChevronDown className={iconSize} />;
          case 'stable':
            return <ChevronRight className={iconSize} />;
        }
        break;
      default:
        switch (direction) {
          case 'up':
            return <TrendingUp className={iconSize} />;
          case 'down':
            return <TrendingDown className={iconSize} />;
          case 'stable':
            return <Minus className={iconSize} />;
        }
    }
  };

  const formatPercentage = (value: number): string => {
    const absValue = Math.abs(value);
    return `${value > 0 ? '+' : value < 0 ? '-' : ''}${absValue.toFixed(1)}%`;
  };

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Render based on variant
  switch (variant) {
    case 'minimal':
      return (
        <div className={cn(
          'flex items-center gap-1',
          getDirectionColor(direction, significance),
          textSizes[size],
          className
        )}>
          {showIcon && getIcon()}
          {showPercentage && <span>{formatPercentage(percentage)}</span>}
          {showPeriod && period && <span className="text-muted-foreground">({period})</span>}
        </div>
      );

    case 'badge':
      return (
        <div className={cn(
          'inline-flex items-center gap-1 rounded-full border',
          sizeClasses[size],
          getDirectionColor(direction, significance),
          getBackgroundColor(direction, significance),
          getBorderColor(direction, significance),
          className
        )}>
          {showIcon && getIcon()}
          {showPercentage && <span className="font-medium">{formatPercentage(percentage)}</span>}
          {showPeriod && period && <span className="opacity-75">({period})</span>}
        </div>
      );

    case 'arrow':
      return (
        <div className={cn(
          'flex items-center gap-1',
          getDirectionColor(direction, significance),
          textSizes[size],
          className
        )}>
          {showIcon && getIcon('arrow')}
          {showPercentage && <span className="font-medium">{formatPercentage(percentage)}</span>}
          {showPeriod && period && <span className="text-muted-foreground ml-1">{period}</span>}
        </div>
      );

    default:
      return (
        <div className={cn(
          'flex items-center gap-1.5',
          getDirectionColor(direction, significance),
          textSizes[size],
          className
        )}>
          {showIcon && (
            <div className={cn(
              'flex items-center justify-center rounded-full p-1',
              getBackgroundColor(direction, significance)
            )}>
              {getIcon()}
            </div>
          )}
          <div className="flex items-center gap-1">
            {showPercentage && (
              <span className="font-medium">
                {formatPercentage(percentage)}
              </span>
            )}
            {showPeriod && period && (
              <span className="text-muted-foreground">
                {period}
              </span>
            )}
          </div>
        </div>
      );
  }
};

// Additional utility component for trend comparison
export interface TrendComparisonProps {
  current: number;
  previous: number;
  period?: string;
  format?: 'currency' | 'number' | 'percentage';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const TrendComparison: React.FC<TrendComparisonProps> = ({
  current,
  previous,
  period,
  format = 'number',
  size = 'sm',
  className
}) => {
  const difference = current - previous;
  const percentageChange = previous !== 0 ? (difference / previous) * 100 : 0;
  const direction = difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable';

  const formatValue = (value: number): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return value.toString();
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="text-muted-foreground text-xs">
        vs {formatValue(previous)} {period && `(${period})`}
      </div>
      <TrendIndicator
        direction={direction}
        percentage={percentageChange}
        size={size}
        variant="minimal"
        showPeriod={false}
      />
    </div>
  );
};