import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  gradientColors?: { from: string; to: string };
  strokeWidth?: number;
  className?: string;
  showDots?: boolean;
  showArea?: boolean;
  animated?: boolean;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  width = 100,
  height = 30,
  color = '#10b981',
  gradientColors = { from: '#10b981', to: '#0d9488' },
  strokeWidth = 2,
  className,
  showDots = false,
  showArea = false,
  animated = true
}) => {
  const pathData = useMemo(() => {
    if (!data || data.length === 0) return '';

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue || 1; // Avoid division by zero

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      return { x, y };
    });

    const pathCommands = points.map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point.x} ${point.y}`;
    });

    return pathCommands.join(' ');
  }, [data, width, height]);

  const areaPathData = useMemo(() => {
    if (!showArea || !pathData) return '';

    return `${pathData} L ${width} ${height} L 0 ${height} Z`;
  }, [pathData, showArea, width, height]);

  const dots = useMemo(() => {
    if (!showDots || !data || data.length === 0) return [];

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue || 1;

    return data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      return { x, y, value };
    });
  }, [data, width, height, showDots]);

  if (!data || data.length === 0) {
    return (
      <div 
        className={cn('flex items-center justify-center text-muted-foreground', className)}
        style={{ width, height }}
      >
        <span className="text-xs">No data</span>
      </div>
    );
  }

  const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const areaGradientId = `sparkline-area-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('relative', className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          {/* Line gradient */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors.from} />
            <stop offset="100%" stopColor={gradientColors.to} />
          </linearGradient>
          
          {/* Area gradient */}
          <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={gradientColors.from} stopOpacity="0.3" />
            <stop offset="100%" stopColor={gradientColors.to} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {showArea && areaPathData && (
          <path
            d={areaPathData}
            fill={`url(#${areaGradientId})`}
            className={animated ? 'animate-in fade-in-0 duration-1000' : ''}
          />
        )}

        {/* Main line */}
        <path
          d={pathData}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            animated ? 'animate-in slide-in-from-left-full duration-1500' : '',
            'transition-all duration-300 drop-shadow-sm'
          )}
          style={{
            strokeDasharray: animated ? '1000' : 'none',
            strokeDashoffset: animated ? '1000' : 'none',
            animation: animated ? 'drawLine 1.5s ease-out forwards' : 'none'
          }}
        />

        {/* Data points */}
        {showDots && dots.map((dot, index) => (
          <circle
            key={index}
            cx={dot.x}
            cy={dot.y}
            r={2}
            fill={`url(#${gradientId})`}
            className={cn(
              'transition-all duration-300 hover:r-3 drop-shadow-sm',
              animated ? 'animate-in zoom-in-0 duration-500' : ''
            )}
            style={{
              animationDelay: animated ? `${index * 100}ms` : '0ms'
            }}
          >
            <title>{`Value: ${dot.value}`}</title>
          </circle>
        ))}
      </svg>

      {/* CSS for line drawing animation */}
      <style>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Utility component for multiple sparklines comparison
interface MultiSparklineProps {
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
    gradientColors?: { from: string; to: string };
  }>;
  width?: number;
  height?: number;
  className?: string;
}

export const MultiSparkline: React.FC<MultiSparklineProps> = ({
  datasets,
  width = 100,
  height = 30,
  className
}) => {
  const allValues = datasets.flatMap(dataset => dataset.data);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue || 1;

  return (
    <div className={cn('relative', className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          {datasets.map((dataset, datasetIndex) => {
            const gradientId = `multi-sparkline-gradient-${datasetIndex}`;
            const gradientColors = dataset.gradientColors || { from: dataset.color, to: dataset.color };
            
            return (
              <linearGradient key={gradientId} id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={gradientColors.from} />
                <stop offset="100%" stopColor={gradientColors.to} />
              </linearGradient>
            );
          })}
        </defs>

        {datasets.map((dataset, datasetIndex) => {
          const pathData = dataset.data.map((value, index) => {
            const x = (index / (dataset.data.length - 1)) * width;
            const y = height - ((value - minValue) / range) * height;
            return { x, y };
          });

          const pathCommands = pathData.map((point, index) => {
            const command = index === 0 ? 'M' : 'L';
            return `${command} ${point.x} ${point.y}`;
          });

          const gradientId = `multi-sparkline-gradient-${datasetIndex}`;

          return (
            <path
              key={datasetIndex}
              d={pathCommands.join(' ')}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
              className="transition-all duration-300 hover:opacity-100 drop-shadow-sm"
            />
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="absolute -bottom-6 left-0 flex gap-2 text-xs">
        {datasets.map((dataset, index) => (
          <div key={index} className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
            <div 
              className="w-2 h-2 rounded-full shadow-sm" 
              style={{ 
                background: dataset.gradientColors 
                  ? `linear-gradient(to right, ${dataset.gradientColors.from}, ${dataset.gradientColors.to})`
                  : dataset.color 
              }}
            />
            <span className="text-gray-600 font-medium">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};