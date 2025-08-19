import React, { useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Download, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { designTokens } from '../../styles/design-tokens';
import { useLanguage } from '../../hooks/useLanguage';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export type ChartType = 'line' | 'bar' | 'doughnut';

interface ModernChartProps {
  type: ChartType;
  data: ChartData<any>;
  title: string;
  description?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
  height?: number;
  showExport?: boolean;
  showFullscreen?: boolean;
  customOptions?: Partial<ChartOptions<any>>;
}

// Gold shop color palette for charts
const goldShopColors = {
  primary: [
    designTokens.colors.primary[500], // Main gold
    designTokens.colors.primary[400], // Bright gold
    designTokens.colors.primary[600], // Dark gold
    designTokens.colors.primary[300], // Medium gold
    designTokens.colors.primary[700], // Darker gold
  ],
  gradients: [
    'rgba(245, 158, 11, 0.8)', // Gold with opacity
    'rgba(59, 130, 246, 0.8)', // Blue
    'rgba(16, 185, 129, 0.8)', // Green
    'rgba(239, 68, 68, 0.8)',  // Red
    'rgba(139, 92, 246, 0.8)', // Purple
    'rgba(245, 101, 101, 0.8)', // Light red
    'rgba(34, 197, 94, 0.8)',  // Light green
    'rgba(168, 85, 247, 0.8)',  // Light purple
  ],
  borders: [
    designTokens.colors.primary[600],
    designTokens.colors.semantic.info[600],
    designTokens.colors.semantic.success[600],
    designTokens.colors.semantic.error[600],
    '#8b5cf6',
    '#f87171',
    '#22c55e',
    '#a855f7',
  ]
};

export const ModernChart: React.FC<ModernChartProps> = ({
  type,
  data,
  title,
  description,
  isLoading = false,
  onRefresh,
  className = '',
  height = 320,
  showExport = true,
  showFullscreen = true,
  customOptions = {}
}) => {
  const { t } = useLanguage();
  const chartRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Enhanced chart options with gold theme and animations
  const getChartOptions = (): ChartOptions<any> => {
    const baseOptions: ChartOptions<any> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          position: type === 'doughnut' ? 'bottom' : 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              family: designTokens.typography.fontFamily.sans.join(', '),
              size: 12,
              weight: '500',
            },
            color: designTokens.colors.neutral[700],
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: designTokens.colors.primary[500],
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          padding: 12,
          titleFont: {
            family: designTokens.typography.fontFamily.sans.join(', '),
            size: 14,
            weight: '600',
          },
          bodyFont: {
            family: designTokens.typography.fontFamily.sans.join(', '),
            size: 13,
          },
          callbacks: {
            label: function(context: any) {
              const value = context.parsed.y ?? context.parsed;
              if (typeof value === 'number') {
                return `${context.dataset.label}: ${formatCurrency(value)}`;
              }
              return `${context.dataset.label}: ${value}`;
            }
          }
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    };

    // Type-specific options
    if (type === 'line' || type === 'bar') {
      baseOptions.scales = {
        x: {
          grid: {
            color: designTokens.colors.neutral[200],
            drawBorder: false,
          },
          ticks: {
            color: designTokens.colors.neutral[600],
            font: {
              family: designTokens.typography.fontFamily.sans.join(', '),
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: designTokens.colors.neutral[200],
            drawBorder: false,
          },
          ticks: {
            color: designTokens.colors.neutral[600],
            font: {
              family: designTokens.typography.fontFamily.sans.join(', '),
              size: 11,
            },
            callback: function(value: any) {
              return formatCurrency(value);
            }
          },
        },
      };
    }

    // Line chart specific options
    if (type === 'line') {
      baseOptions.elements = {
        line: {
          tension: 0.4,
          borderWidth: 3,
        },
        point: {
          radius: 4,
          hoverRadius: 6,
          borderWidth: 2,
          backgroundColor: '#fff',
        },
      };
    }

    // Bar chart specific options
    if (type === 'bar') {
      baseOptions.elements = {
        bar: {
          borderRadius: 4,
          borderSkipped: false,
        },
      };
    }

    // Merge with custom options
    return { ...baseOptions, ...customOptions };
  };

  // Apply gold theme colors to chart data
  const getThemedData = (): ChartData<any> => {
    const themedData = { ...data };
    
    themedData.datasets = themedData.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: type === 'doughnut' 
        ? goldShopColors.gradients
        : goldShopColors.gradients[index % goldShopColors.gradients.length],
      borderColor: type === 'doughnut'
        ? goldShopColors.borders
        : goldShopColors.borders[index % goldShopColors.borders.length],
      borderWidth: type === 'doughnut' ? 2 : 3,
      ...(type === 'line' && {
        fill: true,
        backgroundColor: `${goldShopColors.gradients[index % goldShopColors.gradients.length]}20`,
      }),
    }));

    return themedData;
  };

  const handleExport = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-chart.png`;
      link.href = url;
      link.click();
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderChart = () => {
    const themedData = getThemedData();
    const options = getChartOptions();

    switch (type) {
      case 'line':
        return <Line ref={chartRef} data={themedData} options={options} />;
      case 'bar':
        return <Bar ref={chartRef} data={themedData} options={options} />;
      case 'doughnut':
        return <Doughnut ref={chartRef} data={themedData} options={options} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          {description && <div className="h-4 bg-gray-200 rounded w-64"></div>}
        </CardHeader>
        <CardContent>
          <div className={`bg-gray-200 rounded`} style={{ height: `${height}px` }}></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`
        transition-all duration-300 hover:shadow-lg
        ${isFullscreen ? 'fixed inset-4 z-50 bg-white' : ''}
        ${className}
      `}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-sm text-gray-600">
              {description}
            </CardDescription>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
              aria-label={t('dashboard.refresh_chart')}
              title={t('dashboard.refresh_chart')}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          
          {showExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 w-8 p-0"
              aria-label={t('dashboard.export_chart')}
              title={t('dashboard.export_chart')}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          
          {showFullscreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
              aria-label={isFullscreen ? t('dashboard.exit_fullscreen') : t('dashboard.fullscreen')}
              title={isFullscreen ? t('dashboard.exit_fullscreen') : t('dashboard.fullscreen')}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          className="relative"
          style={{ height: `${isFullscreen ? 'calc(100vh - 200px)' : height}px` }}
        >
          {data.datasets.length > 0 ? (
            renderChart()
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">No data available</div>
                <div className="text-sm">Chart data will appear here when available</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernChart;