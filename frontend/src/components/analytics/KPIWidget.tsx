import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TrendIndicator } from './TrendIndicator';
import { SparklineChart } from './SparklineChart';

export interface KPIData {
  id: string;
  title: string;
  value: number;
  target?: number;
  unit?: string;
  format?: 'currency' | 'number' | 'percentage' | 'text';
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
    significance: 'high' | 'medium' | 'low';
  };
  status: 'success' | 'warning' | 'danger' | 'info';
  sparklineData?: number[];
  description?: string;
  lastUpdated?: string;
}

interface KPIWidgetProps {
  data: KPIData;
  className?: string;
  showSparkline?: boolean;
  showProgress?: boolean;
  showTrend?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  onClick?: () => void;
}

export const KPIWidget: React.FC<KPIWidgetProps> = ({
  data,
  className,
  showSparkline = true,
  showProgress = true,
  showTrend = true,
  size = 'md',
  animated = true,
  onClick
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Animate value counting up
  useEffect(() => {
    if (!animated) {
      setDisplayValue(data.value);
      return;
    }

    setIsVisible(true);
    const duration = 1500; // 1.5 seconds
    const steps = 60;
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
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        }).format(value);
      default:
        return value.toString();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'danger':
        return 'border-red-200 bg-red-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
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

  const achievementRate = data.target ? (data.value / data.target) * 100 : 0;

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const titleSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <Card 
      className={cn(
        'transition-all duration-300 hover:shadow-lg cursor-pointer',
        getStatusColor(data.status),
        isVisible && animated ? 'animate-in fade-in-0 slide-in-from-bottom-4' : '',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className={cn('flex flex-row items-center justify-between space-y-0 pb-2', sizeClasses[size])}>
        <CardTitle className={cn('font-medium flex items-center gap-2', titleSizeClasses[size])}>
          {data.title}
        </CardTitle>
        <Badge variant={getStatusBadgeVariant(data.status)} className="text-xs">
          {data.status.toUpperCase()}
        </Badge>
      </CardHeader>
      
      <CardContent className={cn('space-y-3', sizeClasses[size])}>
        {/* Main Value */}
        <div className="space-y-1">
          <div className={cn('font-bold tracking-tight', valueSizeClasses[size])}>
            {formatValue(displayValue)}
            {data.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{data.unit}</span>}
          </div>
          
          {data.description && (
            <p className="text-xs text-muted-foreground">
              {data.description}
            </p>
          )}
        </div>

        {/* Progress Bar (if target is set) */}
        {showProgress && data.target && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{achievementRate.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(achievementRate, 100)} 
              className="h-2"
            />
            <div className="text-xs text-muted-foreground">
              Target: {formatValue(data.target)}
            </div>
          </div>
        )}

        {/* Trend and Sparkline */}
        <div className="flex items-center justify-between">
          {showTrend && (
            <TrendIndicator
              direction={data.trend.direction}
              percentage={data.trend.percentage}
              period={data.trend.period}
              significance={data.trend.significance}
              size="sm"
            />
          )}
          
          {showSparkline && data.sparklineData && data.sparklineData.length > 0 && (
            <div className="flex-1 max-w-[100px] ml-2">
              <SparklineChart
                data={data.sparklineData}
                color={data.status === 'success' ? '#10b981' : 
                       data.status === 'warning' ? '#f59e0b' :
                       data.status === 'danger' ? '#ef4444' : '#6b7280'}
                height={30}
              />
            </div>
          )}
        </div>

        {/* Last Updated */}
        {data.lastUpdated && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            Updated: {new Date(data.lastUpdated).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};