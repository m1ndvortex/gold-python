import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Activity,
  RefreshCw,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { WithPermissions } from '@/components/auth/WithPermissions';
import { TimeRangeSelector, TimeRange } from './TimeRangeSelector';
import { AlertsPanel } from './AlertsPanel';
import { KPIWidget, KPIData } from './KPIWidget';

// Types for KPI Dashboard
export interface KPIDashboardData {
  financial: {
    revenue: KPIMetric;
    profit_margin: KPIMetric;
    achievement: KPIMetric;
  };
  operational: {
    inventory_turnover: KPIMetric;
    stockout_frequency: KPIMetric;
    carrying_costs: KPIMetric;
    dead_stock: KPIMetric;
  };
  customer: {
    acquisition_rate: KPIMetric;
    retention_rate: KPIMetric;
    avg_transaction_value: KPIMetric;
    customer_lifetime_value: KPIMetric;
  };
  overall_performance: {
    overall_score: number;
    performance_level: string;
    component_scores: Record<string, number>;
  };
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  targets: Record<string, number>;
  last_updated: string;
}

export interface KPIMetric {
  value: number;
  target?: number;
  achievement_rate?: number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
    significance: 'high' | 'medium' | 'low';
  };
  status: 'success' | 'warning' | 'danger' | 'info';
  sparkline_data?: number[];
  description?: string;
  unit?: string;
  format?: 'currency' | 'number' | 'percentage';
}

export interface KPIAlert {
  id: string;
  type: 'threshold' | 'trend' | 'anomaly';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  kpi_name: string;
  current_value: number;
  threshold_value?: number;
  created_at: string;
  acknowledged: boolean;
}

interface KPIDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showAlerts?: boolean;
  showTimeRange?: boolean;
  defaultTimeRange?: TimeRange;
  compactMode?: boolean;
}

export const KPIDashboard: React.FC<KPIDashboardProps> = ({
  className,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  showAlerts = true,
  showTimeRange = true,
  defaultTimeRange = { period: 'month', label: 'Last 30 Days' },
  compactMode = false
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'operational' | 'customer'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<KPIAlert[]>([]);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  const queryClient = useQueryClient();
  const { isAuthenticated, getToken } = useAuth();
  const { canViewAnalytics, hasPermission } = usePermissions();

  // Fetch KPI dashboard data - only if authenticated and has permission
  const { data: kpiData, isLoading, error, refetch } = useQuery({
    queryKey: ['kpi-dashboard', timeRange],
    queryFn: async (): Promise<KPIDashboardData> => {
      if (!isAuthenticated || !canViewAnalytics()) {
        throw new Error('Unauthorized access to KPI dashboard');
      }

      const params = new URLSearchParams();
      
      if (timeRange.startDate) {
        params.append('start_date', timeRange.startDate.toISOString().split('T')[0]);
      }
      if (timeRange.endDate) {
        params.append('end_date', timeRange.endDate.toISOString().split('T')[0]);
      }
      if (timeRange.targets) {
        params.append('targets', JSON.stringify(timeRange.targets));
      }
      
      const url = `/kpi/dashboard?${params.toString()}`;
      return apiGet<KPIDashboardData>(url);
    },
    enabled: isAuthenticated && canViewAnalytics(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 10000, // 10 seconds
  });

  // Fetch KPI alerts - only if authenticated and has permission
  const { data: alertsData } = useQuery({
    queryKey: ['kpi-alerts'],
    queryFn: async (): Promise<KPIAlert[]> => {
      if (!isAuthenticated || !canViewAnalytics()) {
        throw new Error('Unauthorized access to KPI alerts');
      }
      return apiGet<KPIAlert[]>('/kpi/alerts');
    },
    enabled: isAuthenticated && canViewAnalytics(),
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // WebSocket connection for real-time updates - only if authenticated
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || !canViewAnalytics()) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/kpi/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    // Add authentication token to WebSocket connection
    ws.onopen = () => {
      console.log('KPI WebSocket connected');
      const token = getToken();
      if (token) {
        ws.send(JSON.stringify({ type: 'auth', token }));
      }
      setWebsocket(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        if (update.type === 'kpi_dashboard') {
          // Invalidate and refetch KPI data
          queryClient.invalidateQueries({ queryKey: ['kpi-dashboard'] });
        } else if (update.type === 'kpi_alert') {
          // Update alerts
          queryClient.invalidateQueries({ queryKey: ['kpi-alerts'] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('KPI WebSocket disconnected');
      setWebsocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('KPI WebSocket error:', error);
    };

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN && typeof ws.close === 'function') {
        ws.close();
      }
    };
  }, [autoRefresh, queryClient, isAuthenticated, canViewAnalytics, getToken]);

  // Update alerts when data changes
  useEffect(() => {
    if (alertsData) {
      setAlerts(alertsData);
    }
  }, [alertsData]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['kpi-alerts'] });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, queryClient]);

  // Convert KPI metrics to KPIData format
  const convertToKPIData = useCallback((
    id: string,
    title: string,
    metric: KPIMetric,
    icon?: React.ReactNode
  ): KPIData => ({
    id,
    title,
    value: metric.value,
    target: metric.target,
    unit: metric.unit,
    format: metric.format || 'number',
    trend: metric.trend,
    status: metric.status,
    sparklineData: metric.sparkline_data,
    description: metric.description,
    lastUpdated: kpiData?.last_updated
  }), [kpiData?.last_updated]);

  // Get financial KPIs
  const getFinancialKPIs = useCallback((): KPIData[] => {
    if (!kpiData?.financial) return [];
    
    return [
      convertToKPIData('revenue', 'Revenue', kpiData.financial.revenue),
      convertToKPIData('profit_margin', 'Profit Margin', kpiData.financial.profit_margin),
      convertToKPIData('achievement', 'Achievement Rate', kpiData.financial.achievement),
    ];
  }, [kpiData?.financial, convertToKPIData]);

  // Get operational KPIs
  const getOperationalKPIs = useCallback((): KPIData[] => {
    if (!kpiData?.operational) return [];
    
    return [
      convertToKPIData('inventory_turnover', 'Inventory Turnover', kpiData.operational.inventory_turnover),
      convertToKPIData('stockout_frequency', 'Stockout Frequency', kpiData.operational.stockout_frequency),
      convertToKPIData('carrying_costs', 'Carrying Costs', kpiData.operational.carrying_costs),
      convertToKPIData('dead_stock', 'Dead Stock', kpiData.operational.dead_stock),
    ];
  }, [kpiData?.operational, convertToKPIData]);

  // Get customer KPIs
  const getCustomerKPIs = useCallback((): KPIData[] => {
    if (!kpiData?.customer) return [];
    
    return [
      convertToKPIData('acquisition_rate', 'Acquisition Rate', kpiData.customer.acquisition_rate),
      convertToKPIData('retention_rate', 'Retention Rate', kpiData.customer.retention_rate),
      convertToKPIData('avg_transaction_value', 'Avg Transaction Value', kpiData.customer.avg_transaction_value),
      convertToKPIData('customer_lifetime_value', 'Customer Lifetime Value', kpiData.customer.customer_lifetime_value),
    ];
  }, [kpiData?.customer, convertToKPIData]);

  // Get overview KPIs (top metrics from each category)
  const getOverviewKPIs = useCallback((): KPIData[] => {
    const financial = getFinancialKPIs();
    const operational = getOperationalKPIs();
    const customer = getCustomerKPIs();
    
    return [
      ...(financial.slice(0, 2)), // Revenue and Profit Margin
      ...(operational.slice(0, 1)), // Inventory Turnover
      ...(customer.slice(0, 1)), // Acquisition Rate
    ];
  }, [getFinancialKPIs, getOperationalKPIs, getCustomerKPIs]);

  // Get performance level color
  const getPerformanceLevelColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'average':
        return 'text-yellow-600 bg-yellow-100';
      case 'below_average':
        return 'text-orange-600 bg-orange-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Check authentication and permissions first
  if (!isAuthenticated) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-700 mb-2">Authentication Required</h3>
          <p className="text-orange-600 mb-4">
            Please log in to access the KPI dashboard
          </p>
        </div>
      </Card>
    );
  }

  if (!canViewAnalytics()) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Access Denied</h3>
          <p className="text-red-600 mb-4">
            You don't have permission to view analytics and KPI data
          </p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load KPI Dashboard</h3>
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Dashboard</h1>
          <p className="text-gray-600">
            Monitor key performance indicators and business metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* WebSocket Status */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              websocket ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-xs text-gray-500">
              {websocket ? 'Live' : 'Offline'}
            </span>
          </div>
          
          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      {showTimeRange && (
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          showTargets={true}
        />
      )}

      {/* Overall Performance Score */}
      {kpiData?.overall_performance && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-100/50 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {kpiData.overall_performance.overall_score}%
                </div>
                <Badge className={getPerformanceLevelColor(kpiData.overall_performance.performance_level)}>
                  {kpiData.overall_performance.performance_level.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex gap-4 text-sm">
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100/50 border-0 shadow-sm">
                  <div className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {kpiData.overall_performance.component_scores.financial}%
                  </div>
                  <div className="text-gray-600">Financial</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-teal-100/50 border-0 shadow-sm">
                  <div className="font-semibold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    {kpiData.overall_performance.component_scores.operational}%
                  </div>
                  <div className="text-gray-600">Operational</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-violet-100/50 border-0 shadow-sm">
                  <div className="font-semibold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    {kpiData.overall_performance.component_scores.customer}%
                  </div>
                  <div className="text-gray-600">Customer</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Panel */}
      {showAlerts && alerts.length > 0 && (
        <AlertsPanel
          alerts={alerts}
          onAcknowledge={(alertId: string) => {
            setAlerts(prev => prev.map(alert => 
              alert.id === alertId ? { ...alert, acknowledged: true } : alert
            ));
          }}
          onDismiss={(alertId: string) => {
            setAlerts(prev => prev.filter(alert => alert.id !== alertId));
          }}
        />
      )}

      {/* KPI Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-0 shadow-lg p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <BarChart3 className="h-3 w-3 text-white" />
            </div>
            Overview
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <DollarSign className="h-3 w-3 text-white" />
            </div>
            Financial
          </TabsTrigger>
          <TabsTrigger value="operational" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-teal-300">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center">
              <Package className="h-3 w-3 text-white" />
            </div>
            Operational
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Users className="h-3 w-3 text-white" />
            </div>
            Customer
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <WithPermissions 
            permissions={['analytics:view']}
            fallback={
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <p className="text-gray-500">Analytics access required to view overview KPIs</p>
              </div>
            }
          >
            <div className={cn(
              'grid gap-4',
              compactMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            )}>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-100/50">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                      <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                getOverviewKPIs().map((kpi: KPIData) => (
                  <KPIWidget
                    key={kpi.id}
                    data={kpi}
                    size={compactMode ? 'sm' : 'md'}
                    animated={true}
                  />
                ))
              )}
            </div>
          </WithPermissions>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <WithPermissions 
            anyPermission={['accounting:view', 'analytics:financial']}
            fallback={
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <p className="text-gray-500">Financial access required to view financial KPIs</p>
              </div>
            }
          >
            <div className={cn(
              'grid gap-4',
              compactMode ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )}>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                      <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                getFinancialKPIs().map((kpi: KPIData) => (
                  <KPIWidget
                    key={kpi.id}
                    data={kpi}
                    size={compactMode ? 'sm' : 'md'}
                    animated={true}
                  />
                ))
              )}
            </div>
          </WithPermissions>
        </TabsContent>

        {/* Operational Tab */}
        <TabsContent value="operational" className="space-y-6">
          <div className={cn(
            'grid gap-4',
            compactMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          )}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse border-0 shadow-lg bg-gradient-to-br from-teal-50 to-green-100/50">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                  </CardContent>
                </Card>
              ))
            ) : (
              getOperationalKPIs().map((kpi: KPIData) => (
                <KPIWidget
                  key={kpi.id}
                  data={kpi}
                  size={compactMode ? 'sm' : 'md'}
                  animated={true}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Customer Tab */}
        <TabsContent value="customer" className="space-y-6">
          <div className={cn(
            'grid gap-4',
            compactMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          )}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100/50">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                  </CardContent>
                </Card>
              ))
            ) : (
              getCustomerKPIs().map((kpi: KPIData) => (
                <KPIWidget
                  key={kpi.id}
                  data={kpi}
                  size={compactMode ? 'sm' : 'md'}
                  animated={true}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      {kpiData?.last_updated && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {new Date(kpiData.last_updated).toLocaleString()}
        </div>
      )}
    </div>
  );
};