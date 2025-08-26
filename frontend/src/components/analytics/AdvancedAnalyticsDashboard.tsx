export {};

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Download,
  RefreshCw,
  Settings,
  AlertTriangle,
  Activity,
  Brain,
  Zap,
  Filter,
  Calendar,
  Eye,
  Share2
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/services/api';

// Import existing components
import { KPIDashboard } from './KPIDashboard';
import { TimeRangeSelector, TimeRange } from './TimeRangeSelector';
import { AlertsPanel } from './AlertsPanel';

// Import new analytics components
import { PredictiveAnalyticsDashboard } from './PredictiveAnalyticsDashboard';
import { CustomerSegmentationDashboard } from './CustomerSegmentationDashboard';
import { TrendAnalysisDashboard } from './TrendAnalysisDashboard';
import { ComparativeAnalysisDashboard } from './ComparativeAnalysisDashboard';
import { IntelligentAlertingInterface } from './IntelligentAlertingInterface';
import { DataExportInterface } from './DataExportInterface';

// Data export interface
interface ExportConfig {
  format: 'excel' | 'csv' | 'pdf' | 'json';
  dataType: 'kpi' | 'trends' | 'segments' | 'predictions' | 'all';
  dateRange: TimeRange;
  includeCharts: boolean;
}

interface AdvancedAnalyticsDashboardProps {
  className?: string;
  businessType?: string;
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  className,
  businessType = 'retail_store'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'kpi' | 'predictive' | 'segmentation' | 'trends' | 'comparative' | 'alerts' | 'export'>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>({ 
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
    end: new Date() 
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'excel',
    dataType: 'all',
    dateRange: timeRange,
    includeCharts: true
  });

  const queryClient = useQueryClient();

  // Fetch dashboard overview data
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview', businessType, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        business_type: businessType,
        start_date: timeRange.start.toISOString(),
        end_date: timeRange.end.toISOString()
      });
      return apiGet(`/advanced-analytics/overview?${params.toString()}`);
    },
    refetchInterval: 300000, // 5 minutes
  });

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['analytics'] });
      await queryClient.invalidateQueries({ queryKey: ['kpi'] });
      await queryClient.invalidateQueries({ queryKey: ['predictive'] });
      await queryClient.invalidateQueries({ queryKey: ['customer-segmentation'] });
      await queryClient.invalidateQueries({ queryKey: ['trend-analysis'] });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const handleExportData = useCallback(async () => {
    try {
      const exportData = await apiPost('/advanced-analytics/data/export', exportConfig);
      console.log('Export initiated:', exportData);
      // Handle download logic here
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportConfig]);

  const handleTimeRangeChange = useCallback((newRange: TimeRange) => {
    setTimeRange(newRange);
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Advanced Analytics</h1>
              <p className="text-muted-foreground text-lg">
                Comprehensive business intelligence and predictive analytics
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1">
            <Zap className="h-3 w-3" />
            AI Powered
          </Badge>
          <TimeRangeSelector 
            value={timeRange} 
            onChange={handleTimeRangeChange}
            className="w-auto"
          />
          <Button onClick={handleRefreshAll} disabled={isRefreshing} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh All
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-indigo-200">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-8 bg-transparent h-auto p-1 gap-1">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-medium text-sm">Overview</div>
                  <div className="text-xs text-muted-foreground">Dashboard</div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="kpi" 
                className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300"
              >
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Target className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-medium text-sm">KPI Dashboard</div>
                  <div className="text-xs text-muted-foreground">Key Metrics</div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="predictive" 
                className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-pink-300"
              >
                <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-pink-600" />
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-medium text-sm">Predictive</div>
                  <div className="text-xs text-muted-foreground">AI Forecasting</div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="segmentation" 
                className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-medium text-sm">Segmentation</div>
                  <div className="text-xs text-muted-foreground">Customer Analysis</div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="trends" 
                className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300"
              >
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-medium text-sm">Trends</div>
                  <div className="text-xs text-muted-foreground">Trend Analysis</div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="comparative" 
                className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-orange-300"
              >
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-medium text-sm">Comparative</div>
                  <div className="text-xs text-muted-foreground">Analysis</div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="alerts" 
                className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-red-300"
              >
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-medium text-sm">Alerts</div>
                  <div className="text-xs text-muted-foreground">Notifications</div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="export" 
                className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-medium text-sm">Export</div>
                  <div className="text-xs text-muted-foreground">Data Export</div>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <div className="p-6">
              <TabsContent value="overview" className="space-y-6 bg-gradient-to-br from-indigo-50/30 to-white">
                {overviewLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Card key={i} className="animate-pulse border-0 shadow-lg">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-indigo-100/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                              <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">Analytics</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-indigo-700">
                              {overviewData?.total_metrics || 24}
                            </div>
                            <p className="text-sm text-muted-foreground">Active Metrics</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                              <Brain className="h-5 w-5 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">AI Models</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-purple-700">
                              {overviewData?.active_models || 8}
                            </div>
                            <p className="text-sm text-muted-foreground">AI Models Running</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md bg-gradient-to-br from-pink-50 to-pink-100/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="h-10 w-10 rounded-lg bg-pink-500 flex items-center justify-center">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-pink-100 text-pink-700">Segments</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-pink-700">
                              {overviewData?.customer_segments || 6}
                            </div>
                            <p className="text-sm text-muted-foreground">Customer Segments</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                              <Activity className="h-5 w-5 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">Accuracy</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-green-700">
                              {overviewData?.model_accuracy || '94.2'}%
                            </div>
                            <p className="text-sm text-muted-foreground">Model Accuracy</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Insights */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          Recent Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(overviewData?.recent_insights || [
                            "Sales trend shows 15% increase over last month with strong seasonal patterns",
                            "Customer segmentation reveals 3 high-value segments requiring targeted marketing",
                            "Inventory turnover improved by 8% with optimized stock levels",
                            "Predictive model accuracy increased to 94.2% with latest training data"
                          ]).map((insight: string, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs text-white font-medium">{index + 1}</span>
                              </div>
                              <p className="text-sm text-gray-700">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="kpi" className="space-y-6">
                <KPIDashboard businessType={businessType} timeRange={timeRange} />
              </TabsContent>

              <TabsContent value="predictive" className="space-y-6">
                <PredictiveAnalyticsDashboard businessType={businessType} />
              </TabsContent>

              <TabsContent value="segmentation" className="space-y-6">
                <CustomerSegmentationDashboard />
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <TrendAnalysisDashboard />
              </TabsContent>

              <TabsContent value="comparative" className="space-y-6">
                <ComparativeAnalysisDashboard />
              </TabsContent>

              <TabsContent value="alerts" className="space-y-6">
                <IntelligentAlertingInterface />
              </TabsContent>

              <TabsContent value="export" className="space-y-6">
                <DataExportInterface />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;ex
port { AdvancedAnalyticsDashboard };export
 default AdvancedAnalyticsDashboard;e
xport { AdvancedAnalyticsDashboard };