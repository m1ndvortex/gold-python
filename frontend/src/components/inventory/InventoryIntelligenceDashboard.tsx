import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Package,
  Target,
  BarChart3,
  Calendar,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useInventoryIntelligenceDashboard } from '@/hooks/useInventoryIntelligence';
import { formatCurrency, formatDate, formatNumber, formatPercentage } from '@/lib/utils';

// Import chart components
import { TurnoverAnalysisChart } from './charts/TurnoverAnalysisChart';
import { StockOptimizationChart } from './charts/StockOptimizationChart';
import { DemandForecastChart } from './charts/DemandForecastChart';
import { SeasonalAnalysisChart } from './charts/SeasonalAnalysisChart';
import { PerformanceMetricsChart } from './charts/PerformanceMetricsChart';

// Import other components
import { DateRangePicker } from '../analytics/DateRangePicker';
import { ExportDialog } from '../analytics/ExportDialog';

interface InventoryIntelligenceDashboardProps {
  className?: string;
}

export const InventoryIntelligenceDashboard: React.FC<InventoryIntelligenceDashboardProps> = ({
  className
}) => {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (selectedPeriod) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }, [selectedPeriod]);

  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error,
    refetch
  } = useInventoryIntelligenceDashboard(
    dateRange.start, 
    dateRange.end,
    undefined, // itemIds
    undefined, // categoryIds
    {
      includeForecast: true,
      includeSeasonal: true,
      includeOptimization: true
    }
  );

  // Define preset time periods
  const timePresets = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Last Year', value: '1y' }
  ];

  // Handle export
  const handleExport = (options: any) => {
    console.log('Exporting inventory intelligence data with options:', options);
  };

  // Generate overview metrics
  const overviewMetrics = useMemo(() => {
    if (!dashboardData?.dashboard_data?.overview_metrics) return [];

    const metrics = dashboardData.dashboard_data.overview_metrics;
    return [
      {
        title: 'Total Inventory Value',
        value: metrics.total_inventory_value,
        format: 'currency' as const,
        trend: { value: 5.2, direction: 'up' as const },
        icon: Package,
        color: 'blue'
      },
      {
        title: 'Optimization Score',
        value: metrics.optimization_score * 100,
        format: 'percentage' as const,
        trend: { value: 3.8, direction: 'up' as const },
        icon: Target,
        color: 'green'
      },
      {
        title: 'Average Turnover Ratio',
        value: metrics.average_turnover_ratio,
        format: 'number' as const,
        trend: { value: -2.1, direction: 'down' as const },
        icon: TrendingUp,
        color: 'orange'
      },
      {
        title: 'Fast Moving Items',
        value: metrics.fast_moving_items_count,
        format: 'number' as const,
        subtitle: `${metrics.total_items_count} total items`,
        icon: BarChart3,
        color: 'purple'
      }
    ];
  }, [dashboardData]);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-destructive mb-2">Error loading inventory intelligence</p>
            <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
            <Button 
              variant="outline" 
              onClick={() => refetch()} 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Inventory Intelligence Dashboard</h2>
              <p className="text-muted-foreground">
                Advanced inventory analytics, optimization, and forecasting
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium">Time Period:</span>
              <div className="flex gap-1">
                {timePresets.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={selectedPeriod === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Period: {formatDate(new Date(dateRange.start))} - {formatDate(new Date(dateRange.end))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">{metric.title}</div>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {metric.format === 'currency' && formatCurrency(metric.value)}
                {metric.format === 'percentage' && formatPercentage(metric.value)}
                {metric.format === 'number' && formatNumber(metric.value)}
              </div>
              {metric.trend && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {metric.trend.direction === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={metric.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(Math.abs(metric.trend.value))}
                  </span>
                  <span>from last period</span>
                </div>
              )}
              {metric.subtitle && (
                <div className="text-xs text-muted-foreground mt-1">
                  {metric.subtitle}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts and Warnings */}
      {dashboardData?.dashboard_data?.alerts_and_warnings && 
       dashboardData.dashboard_data.alerts_and_warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Alerts & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.dashboard_data.alerts_and_warnings.map((alert, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border-l-4",
                    alert.severity === 'high' && "bg-red-50 border-red-400",
                    alert.severity === 'medium' && "bg-yellow-50 border-yellow-400",
                    alert.severity === 'low' && "bg-blue-50 border-blue-400"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={
                            alert.severity === 'high' ? 'destructive' : 
                            alert.severity === 'medium' ? 'secondary' : 'default'
                          }
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">{alert.type.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.action_required}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="turnover">Turnover</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceMetricsChart 
              data={dashboardData?.dashboard_data?.overview_metrics} 
              title="Performance Overview"
            />
            <TurnoverAnalysisChart 
              data={dashboardData?.dashboard_data?.turnover_analysis || []}
              title="Turnover Analysis Summary"
            />
          </div>
        </TabsContent>

        <TabsContent value="turnover" className="space-y-6">
          <TurnoverAnalysisChart 
            data={dashboardData?.dashboard_data?.turnover_analysis || []}
            title="Detailed Turnover Analysis"
            detailed={true}
          />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <StockOptimizationChart 
            data={dashboardData?.dashboard_data?.stock_optimization || []}
            title="Stock Optimization Recommendations"
          />
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <DemandForecastChart 
            data={dashboardData?.dashboard_data?.demand_forecasts || []}
            title="Demand Forecasting"
          />
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6">
          <SeasonalAnalysisChart 
            data={dashboardData?.dashboard_data?.seasonal_insights || []}
            title="Seasonal Analysis"
          />
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        title="Export Inventory Intelligence"
      />
    </div>
  );
};
