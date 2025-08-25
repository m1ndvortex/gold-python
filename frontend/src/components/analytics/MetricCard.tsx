import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendIndicator } from './TrendIndicator';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Clock
} from 'lucide-react';

export interface MetricData {
  id: string;
  title: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit?: string;
  format?: 'currency' | 'number' | 'percentage' | 'text';
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  icon?: React.ReactNode;
  subtitle?: string;
  lastUpdated?: string;
}

interface MetricCardProps {
  data: MetricData;
  className?: string;
  animated?: boolean;
  showIcon?: boolean;
  showTrend?: boolean;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  data,
  className,
  animated = true,
  showIcon = true,
  showTrend = true,
  showStatus = true,
  size = 'md',
  layout = 'vertical',
  onClick
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Animated counter effect
  useEffect(() => {
    if (!animated) {
      setDisplayValue(data.value);
      return;
    }

    setIsVisible(true);
    const duration = 2000; // 2 seconds
    const steps = 100;
    const increment = data.value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(data.value, increment * step);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(data.value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [data.value, animated]);

  const formatValue = (value: number): string => {
    switch (data.format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        }).format(value);
      default:
        return value.toString();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'danger':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-100/50 hover:shadow-xl transition-all duration-300';
      case 'warning':
        return 'border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-100/50 hover:shadow-xl transition-all duration-300';
      case 'danger':
        return 'border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-100/50 hover:shadow-xl transition-all duration-300';
      case 'info':
        return 'border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50 hover:shadow-xl transition-all duration-300';
      default:
        return 'border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-100/50 hover:shadow-xl transition-all duration-300';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default' as const;
      case 'warning':
        return 'secondary' as const;
      case 'danger':
        return 'destructive' as const;
      case 'info':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const sizeClasses = {
    sm: {
      card: 'p-3',
      title: 'text-xs',
      value: 'text-lg',
      subtitle: 'text-xs'
    },
    md: {
      card: 'p-4',
      title: 'text-sm',
      value: 'text-2xl',
      subtitle: 'text-sm'
    },
    lg: {
      card: 'p-6',
      title: 'text-base',
      value: 'text-3xl',
      subtitle: 'text-base'
    }
  };

  const layoutClasses = layout === 'horizontal' 
    ? 'flex flex-row items-center justify-between space-y-0' 
    : 'space-y-2';

  return (
    <Card 
      className={cn(
        'cursor-pointer',
        getStatusColor(data.status),
        isVisible && animated ? 'animate-in fade-in-0 slide-in-from-left-4' : '',
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn(sizeClasses[size].card, layoutClasses)}>
        {/* Header Section */}
        <div className={cn(
          'flex items-center justify-between',
          layout === 'horizontal' ? 'flex-col items-start space-y-1' : ''
        )}>
          <div className="flex items-center gap-2">
            {showIcon && (
              data.icon ? (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  {data.icon}
                </div>
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  {getStatusIcon(data.status)}
                </div>
              )
            )}
            <h3 className={cn('font-medium text-gray-700', sizeClasses[size].title)}>
              {data.title}
            </h3>
          </div>
          
          {showStatus && (
            <Badge variant={getStatusBadgeVariant(data.status)} className="text-xs shadow-sm">
              {data.status.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Value Section */}
        <div className={cn(
          'space-y-1',
          layout === 'horizontal' ? 'text-right' : ''
        )}>
          <div className={cn(
            'font-bold tracking-tight transition-all duration-300 bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent',
            sizeClasses[size].value,
            animated ? 'transform' : ''
          )}>
            {formatValue(displayValue)}
            {data.unit && (
              <span className="text-sm font-normal text-gray-600 ml-1">
                {data.unit}
              </span>
            )}
          </div>

          {data.subtitle && (
            <p className={cn('text-gray-600', sizeClasses[size].subtitle)}>
              {data.subtitle}
            </p>
          )}
        </div>

        {/* Trend and Additional Info */}
        {(showTrend && data.trend) || data.target || data.lastUpdated ? (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
            {showTrend && data.trend && (
              <TrendIndicator
                direction={data.trend.direction}
                percentage={data.trend.percentage}
                period={data.trend.period}
                size="sm"
              />
            )}

            <div className="flex items-center gap-2 text-xs text-gray-600">
              {data.target && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
                  <div className="h-4 w-4 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Target className="h-2 w-2 text-white" />
                  </div>
                  <span>Target: {formatValue(data.target)}</span>
                </div>
              )}
              
              {data.lastUpdated && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
                  <div className="h-4 w-4 rounded bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                    <Clock className="h-2 w-2 text-white" />
                  </div>
                  <span>{new Date(data.lastUpdated).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Achievement Progress (if target is set) */}
        {data.target && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Achievement</span>
              <span className="font-medium">{((data.value / data.target) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-2 shadow-inner">
              <div 
                className={cn(
                  'h-2 rounded-full transition-all duration-1000 shadow-sm',
                  data.status === 'success' ? 'bg-gradient-to-r from-green-500 to-teal-600' :
                  data.status === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                  data.status === 'danger' ? 'bg-gradient-to-r from-red-500 to-pink-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                )}
                style={{ 
                  width: `${Math.min((data.value / data.target) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};