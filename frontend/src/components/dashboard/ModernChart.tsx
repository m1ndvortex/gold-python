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

// Enhanced Green-Teal-Blue spectrum with better visibility and balance
const goldShopColors = {
  primary: [
    '#059669', // Emerald-600 (stronger green)
    '#0891b2', // Sky-600 (vibrant teal)
    '#2563eb', // Blue-600 (deeper blue)
    '#7c3aed', // Violet-600 (rich purple)
    '#dc2626', // Red-600 (accent red)
    '#ea580c', // Orange-600 (warm accent)
  ],
  gradients: [
    'rgba(5, 150, 105, 0.8)', // Strong emerald with higher opacity
    'rgba(8, 145, 178, 0.8)', // Vibrant sky/teal
    'rgba(37, 99, 235, 0.8)', // Rich blue
    'rgba(124, 58, 237, 0.8)', // Deep violet
    'rgba(220, 38, 38, 0.8)', // Accent red
    'rgba(234, 88, 12, 0.8)', // Warm orange
    'rgba(16, 185, 129, 0.8)', // Bright green
    'rgba(168, 85, 247, 0.8)', // Bright violet
  ],
  lightGradients: [
    'rgba(5, 150, 105, 0.25)', // Light emerald
    'rgba(8, 145, 178, 0.25)', // Light sky/teal
    'rgba(37, 99, 235, 0.25)', // Light blue
    'rgba(124, 58, 237, 0.25)', // Light violet
    'rgba(220, 38, 38, 0.25)', // Light red
    'rgba(234, 88, 12, 0.25)', // Light orange
    'rgba(16, 185, 129, 0.25)', // Light green
    'rgba(168, 85, 247, 0.25)', // Light violet
  ],
  borders: [
    '#059669', // Emerald-600
    '#0891b2', // Sky-600
    '#2563eb', // Blue-600
    '#7c3aed', // Violet-600
    '#dc2626', // Red-600
    '#ea580c', // Orange-600
    '#10b981', // Green-500
    '#a855f7', // Violet-500
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
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          titleColor: '#1f2937',
          bodyColor: '#374151',
          borderColor: '#059669',
          borderWidth: 2,
          cornerRadius: 12,
          displayColors: true,
          padding: 16,
          titleFont: {
            family: designTokens.typography.fontFamily.sans.join(', '),
            size: 14,
            weight: '600',
          },
          bodyFont: {
            family: designTokens.typography.fontFamily.sans.join(', '),
            size: 13,
          },
          shadowOffsetX: 0,
          shadowOffsetY: 4,
          shadowBlur: 16,
          shadowColor: 'rgba(5, 150, 105, 0.2)',
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

  // Apply gold theme colors to chart data - Much brighter and more visible
  const getThemedData = (): ChartData<any> => {
    const themedData = { ...data };
    
    themedData.datasets = themedData.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: type === 'doughnut' 
        ? goldShopColors.gradients
        : type === 'line' 
          ? goldShopColors.lightGradients[index % goldShopColors.lightGradients.length]
          : goldShopColors.gradients[index % goldShopColors.gradients.length],
      borderColor: goldShopColors.borders[index % goldShopColors.borders.length],
      borderWidth: type === 'doughnut' ? 3 : type === 'line' ? 4 : 2,
      ...(type === 'line' && {
        fill: true,
        tension: 0.4,
        pointBackgroundColor: goldShopColors.borders[index % goldShopColors.borders.length],
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }),
      ...(type === 'bar' && {
        borderRadius: 6,
        borderSkipped: false,
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
      <Card className={`animate-pulse border-0 shadow-xl bg-gradient-to-br from-white via-emerald-50/30 to-sky-50/20 ${className}`}>
        <CardHeader>
          <div className="h-6 bg-gradient-to-r from-emerald-300 to-sky-400 rounded-lg w-48"></div>
          {description && <div className="h-4 bg-gradient-to-r from-emerald-300 to-sky-400 rounded-lg w-64 mt-2"></div>}
        </CardHeader>
        <CardContent>
          <div className={`bg-gradient-to-br from-emerald-200 via-sky-200 to-blue-300 rounded-xl shadow-inner`} style={{ height: `${height}px` }}></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`
        border-0 shadow-xl bg-gradient-to-br from-white via-emerald-50/30 to-sky-50/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]
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
              className="h-8 w-8 p-0 bg-gradient-to-r from-emerald-50 to-sky-50 border-emerald-200 hover:from-emerald-100 hover:to-sky-100 hover:border-emerald-300 transition-all duration-300"
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
              className="h-8 w-8 p-0 bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200 hover:from-sky-100 hover:to-blue-100 hover:border-sky-300 transition-all duration-300"
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
              className="h-8 w-8 p-0 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100 hover:border-violet-300 transition-all duration-300"
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
                <div className="text-lg font-medium mb-2">{t('charts.no_data')}</div>
                <div className="text-sm">{t('charts.loading')}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernChart;