import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useDashboardAnalytics } from '@/hooks/useAnalytics';
import { formatCurrency, formatDate, formatNumber, formatPercentage } from '@/lib/utils';

// Import chart components
import { TimeBasedChart } from './charts/TimeBasedChart';
import { SalesAnalyticsChart } from './charts/SalesAnalyticsChart';
import { InventoryAnalyticsChart } from './charts/InventoryAnalyticsChart';
import { CustomerAnalyticsChart } from './charts/CustomerAnalyticsChart';
import { AnalyticsCard } from './AnalyticsCard';
import { ExportDialog } from './ExportDialog';

interface AdvancedDashboardProps {
  className?: string;
}

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({
  className
}) => {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7d');
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (selectedPeriod) {
      case '1d':
        start.setDate(start.getDate() - 1);
        break;
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
        start.setDate(start.getDate() - 7);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }, [selectedPeriod]);

  // Fetch analytics data
  const { 
    data: analytics, 
    isLoading, 
    error,
    dataUpdatedAt 
  } = useDashboardAnalytics(dateRange.start, dateRange.end);

  // Define preset time periods
  const timePresets = [
    { label: 'Last 24 Hours', value: '1d' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Last Year', value: '1y' }
  ];

  // Handle export
  const handleExport = (options: any) => {
    console.log('Exporting with options:', options);
  };

  // Generate analytics cards data
  const analyticsCards = useMemo(() => {
    if (!analytics) return [];

    return [
      {
        title: 'Total Revenue',
        value: analytics.sales.total_sales,
        trend: {
          value: analytics.sales.growth_rate * 100,
          direction: (analytics.sales.growth_rate > 0 ? 'up' : analytics.sales.growth_rate < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
          period: 'vs last period'
        },
        format: 'currency' as const
      },
      {
        title: 'Total Customers',
        value: analytics.customers.total_customers,
        subtitle: `${analytics.customers.new_customers} new`,
        format: 'number' as const
      },
      {
        title: 'Inventory Value',
        value: analytics.inventory.total_value,
        subtitle: `${analytics.inventory.turnover_rate} turnover rate`,
        format: 'currency' as const
      },
      {
        title: 'Average Order Value',
        value: analytics.customers.average_order_value,
        format: 'currency' as const
      }
    ];
  }, [analytics]);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-destructive mb-2">Error loading analytics</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for charts
  const timeBasedData = analytics ? {
    daily_patterns: analytics.time_based.daily_patterns?.hourly_sales || {},
    monthly_trends: analytics.time_based.monthly_trends?.monthly_sales || {}
  } : {};

  const salesData = analytics ? {
    ...analytics.sales,
    top_selling_items: analytics.sales.top_selling_items?.map(item => ({
      name: item.name,
      sales: item.revenue
    }))
  } : undefined;

  const inventoryData = analytics ? {
    ...analytics.inventory,
    fast_moving_items: analytics.inventory.fast_moving_items?.map(item => ({
      name: item.name,
      sales_velocity: item.total_sold
    })),
    slow_moving_items: analytics.inventory.slow_moving_items?.map(item => ({
      name: item.name,
      sales_velocity: item.total_sold
    })),
    stock_optimization_suggestions: analytics.inventory.stock_optimization_suggestions?.map(suggestion => ({
      item: suggestion.item_name,
      suggestion: suggestion.recommended_action
    }))
  } : undefined;

  const customerData = analytics ? {
    ...analytics.customers,
    top_customers: analytics.customers.top_customers?.map(customer => ({
      name: customer.name,
      total_purchases: customer.total_revenue
    }))
  } : undefined;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Advanced Analytics Dashboard</h2>
              <p className="text-muted-foreground">Comprehensive business intelligence and insights</p>
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
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
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
              Last updated: {formatDate(new Date(dataUpdatedAt || Date.now()))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsCards.map((card, index) => (
          <AnalyticsCard
            key={index}
            {...card}
          />
        ))}
      </div>

      {/* Charts Section */}
      {analytics && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimeBasedChart
            data={timeBasedData}
            title="Time-Based Analytics"
          />

          {salesData && (
            <SalesAnalyticsChart
              data={salesData}
              title="Sales Analytics"
            />
          )}

          {inventoryData && (
            <InventoryAnalyticsChart
              data={inventoryData}
              title="Inventory Analytics"
            />
          )}

          {customerData && (
            <CustomerAnalyticsChart
              data={customerData}
              title="Customer Analytics"
            />
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
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

      {/* Quick Insights */}
      {analytics && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <h4 className="font-medium text-green-800">Top Performing</h4>
                <p className="text-sm text-green-600 mt-1">
                  {analytics.sales.top_selling_items?.[0]?.name || 'N/A'} - 
                  {formatCurrency(analytics.sales.top_selling_items?.[0]?.revenue || 0)}
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-medium text-blue-800">Customer Retention</h4>
                <p className="text-sm text-blue-600 mt-1">
                  {formatPercentage(analytics.customers.retention_rate * 100)} - 
                  {analytics.customers.retention_rate > 0.7 ? 'Excellent' : 'Needs Improvement'}
                </p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-medium text-yellow-800">Inventory Turnover</h4>
                <p className="text-sm text-yellow-600 mt-1">
                  {formatNumber(analytics.inventory.turnover_rate, { minimumFractionDigits: 1 })} - 
                  {analytics.inventory.turnover_rate > 4 ? 'Good' : 'Low'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        title="Export Analytics"
      />
    </div>
  );
};