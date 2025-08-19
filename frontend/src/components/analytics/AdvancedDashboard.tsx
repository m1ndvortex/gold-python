import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  BarChart3Icon,
  PieChartIcon,
  LineChartIcon,
  RefreshCwIcon,
  DownloadIcon,
  FilterIcon,
  ZoomInIcon
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useDashboardAnalytics, useAnalyticsCache } from '@/hooks/useAnalytics';
import { getDateRange, formatDateForAPI } from '@/services/analyticsApi';
import { TimeBasedChart } from './charts/TimeBasedChart';
import { SalesAnalyticsChart } from './charts/SalesAnalyticsChart';
import { InventoryAnalyticsChart } from './charts/InventoryAnalyticsChart';
import { CustomerAnalyticsChart } from './charts/CustomerAnalyticsChart';
import { AnalyticsCard } from './AnalyticsCard';
import { DateRangePicker } from './DateRangePicker';
import { AnalyticsFilters } from './AnalyticsFilters';
import { ExportDialog } from './ExportDialog';
import type { DashboardAnalytics, DateRangePreset, AnalyticsFilters as FilterType } from '@/types/analytics';

interface AdvancedDashboardProps {
  className?: string;
}

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ className }) => {
  const { t } = useLanguage();
  const { invalidateDashboard } = useAnalyticsCache();

  // State management
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [filters, setFilters] = useState<FilterType>({
    dateRange: getDateRange('month'),
    period: 'monthly'
  });

  // Get date range based on selected period
  const dateRange = useMemo(() => {
    if (customDateRange) {
      return customDateRange;
    }
    return getDateRange(selectedPeriod as any);
  }, [selectedPeriod, customDateRange]);

  // Fetch analytics data
  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt
  } = useDashboardAnalytics(
    formatDateForAPI(dateRange.start),
    formatDateForAPI(dateRange.end)
  );

  // Date range presets
  const datePresets: DateRangePreset[] = [
    {
      label: t('analytics.today'),
      value: 'today',
      ...getDateRange('today')
    },
    {
      label: t('analytics.this_week'),
      value: 'week',
      ...getDateRange('week')
    },
    {
      label: t('analytics.this_month'),
      value: 'month',
      ...getDateRange('month')
    },
    {
      label: t('analytics.this_quarter'),
      value: 'quarter',
      ...getDateRange('quarter')
    },
    {
      label: t('analytics.this_year'),
      value: 'year',
      ...getDateRange('year')
    }
  ];

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
    invalidateDashboard();
  };

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setCustomDateRange(null);
  };

  // Handle custom date range
  const handleCustomDateRange = (start: Date, end: Date) => {
    setCustomDateRange({ start, end });
    setSelectedPeriod('custom');
  };

  // Generate analytics cards
  const analyticsCards = useMemo(() => {
    if (!analytics) return [];

    return [
      {
        title: t('analytics.total_sales'),
        value: formatCurrency(analytics.sales.total_sales),
        change: {
          value: analytics.sales.growth_rate,
          type: analytics.sales.growth_rate > 0 ? 'increase' as const : 'decrease' as const,
          period: t('analytics.vs_previous_period')
        },
        icon: 'trending-up',
        color: 'gold' as const,
        description: t('analytics.sales_description')
      },
      {
        title: t('analytics.inventory_value'),
        value: formatCurrency(analytics.inventory.total_value),
        change: {
          value: analytics.inventory.turnover_rate * 100,
          type: 'stable' as const,
          period: t('analytics.turnover_rate')
        },
        icon: 'package',
        color: 'blue' as const,
        description: t('analytics.inventory_description')
      },
      {
        title: t('analytics.total_customers'),
        value: analytics.customers.total_customers.toString(),
        change: {
          value: analytics.customers.new_customers,
          type: 'increase' as const,
          period: t('analytics.new_this_period')
        },
        icon: 'users',
        color: 'green' as const,
        description: t('analytics.customers_description')
      },
      {
        title: t('analytics.retention_rate'),
        value: `${analytics.customers.retention_rate.toFixed(1)}%`,
        change: {
          value: analytics.customers.retention_rate,
          type: analytics.customers.retention_rate > 50 ? 'increase' as const : 'decrease' as const,
          period: t('analytics.customer_loyalty')
        },
        icon: 'heart',
        color: 'purple' as const,
        description: t('analytics.retention_description')
      }
    ];
  }, [analytics, t]);

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('analytics.error_loading')}
          </h3>
          <p className="text-gray-600 mb-4">
            {error?.message || t('analytics.generic_error')}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            {t('common.try_again')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('analytics.dashboard_title')}
          </h1>
          <p className="text-muted-foreground">
            {t('analytics.dashboard_description')}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon className="w-4 h-4 mr-2" />
            {t('analytics.filters')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            {t('analytics.export')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              <div className="flex items-center space-x-2">
                {datePresets.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={selectedPeriod === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePeriodChange(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
                <DateRangePicker
                  value={customDateRange}
                  onChange={handleCustomDateRange}
                  trigger={
                    <Button
                      variant={selectedPeriod === 'custom' ? "default" : "outline"}
                      size="sm"
                    >
                      {t('analytics.custom_range')}
                    </Button>
                  }
                />
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {t('analytics.last_updated')}: {formatDate(new Date(dataUpdatedAt || Date.now()))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <AnalyticsFilters
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsCards.map((card, index) => (
          <AnalyticsCard
            key={index}
            {...card}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3Icon className="w-4 h-4" />
            <span>{t('analytics.overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center space-x-2">
            <TrendingUpIcon className="w-4 h-4" />
            <span>{t('analytics.sales')}</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center space-x-2">
            <PieChartIcon className="w-4 h-4" />
            <span>{t('analytics.inventory')}</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center space-x-2">
            <LineChartIcon className="w-4 h-4" />
            <span>{t('analytics.customers')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics && (
              <>
                <TimeBasedChart
                  data={analytics.time_based}
                  title={t('analytics.time_trends')}
                  isLoading={isLoading}
                />
                <SalesAnalyticsChart
                  data={analytics.sales}
                  title={t('analytics.sales_overview')}
                  isLoading={isLoading}
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          {analytics && (
            <SalesAnalyticsChart
              data={analytics.sales}
              title={t('analytics.detailed_sales')}
              isLoading={isLoading}
              detailed={true}
            />
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {analytics && (
            <InventoryAnalyticsChart
              data={analytics.inventory}
              title={t('analytics.inventory_analysis')}
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {analytics && (
            <CustomerAnalyticsChart
              data={analytics.customers}
              title={t('analytics.customer_insights')}
              isLoading={isLoading}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Year-over-Year Comparison Card */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUpIcon className="w-5 h-5" />
              <span>{t('analytics.yoy_comparison')}</span>
            </CardTitle>
            <CardDescription>
              {analytics.time_based.year_over_year.comparison_period}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.time_based.year_over_year.current_period_sales)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('analytics.current_period')}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {formatCurrency(analytics.time_based.year_over_year.last_year_sales)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('analytics.same_period_last_year')}
                </div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold flex items-center justify-center space-x-1 ${
                  analytics.time_based.year_over_year.growth_percentage > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {analytics.time_based.year_over_year.growth_percentage > 0 ? (
                    <TrendingUpIcon className="w-5 h-5" />
                  ) : (
                    <TrendingDownIcon className="w-5 h-5" />
                  )}
                  <span>
                    {Math.abs(analytics.time_based.year_over_year.growth_percentage).toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('analytics.growth_rate')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Dialog */}
      {showExportDialog && analytics && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          analytics={analytics}
          filters={filters}
        />
      )}
    </div>
  );
};
