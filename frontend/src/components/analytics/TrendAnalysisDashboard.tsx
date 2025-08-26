export {};

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar,
  BarChart3,
  LineChart,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Target,
  Zap,
  Eye
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/services/api';
import { TrendChart } from './charts/TrendChart';
import { InteractiveChart } from './charts/InteractiveChart';

interface TrendAnalysisData {
  metric_name: string;
  trend_direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trend_strength: number; // 0-1 scale
  seasonal_component: {
    has_seasonality: boolean;
    seasonal_strength: number;
    peak_periods: string[];
    low_periods: string[];
    seasonal_pattern: Array<{
      period: string;
      factor: number;
    }>;
  };
  growth_rate: number;
  volatility: number;
  forecast_next_period: number;
  confidence_interval: [number, number];
  anomalies_detected: Array<{
    date: string;
    value: number;
    anomaly_score: number;
    type: string;
    description: string;
  }>;
  historical_data: Array<{
    date: string;
    value: number;
    trend_component: number;
    seasonal_component: number;
    residual: number;
  }>;
  insights: string[];
  recommendations: string[];
}

interface TrendAnalysisDashboardProps {
  className?: string;
}

export const TrendAnalysisDashboard: React.FC<TrendAnalysisDashboardProps> = ({
  className
}) => {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [entityType, setEntityType] = useState('overall');
  const [entityId, setEntityId] = useState<string | null>(null);
  const [analysisPeriod, setAnalysisPeriod] = useState('730'); // 2 years
  const [forecastPeriods, setForecastPeriods] = useState('30');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Available metrics for analysis
  const availableMetrics = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'profit_margin', label: 'Profit Margin' },
    { value: 'inventory_turnover', label: 'Inventory Turnover' },
    { value: 'customer_acquisition', label: 'Customer Acquisition' },
    { value: 'customer_retention', label: 'Customer Retention' },
    { value: 'transaction_count', label: 'Transaction Count' },
    { value: 'avg_transaction_value', label: 'Avg Transaction Value' }
  ];

  // Fetch trend analysis data
  const { data: trendData, isLoading, error, refetch } = useQuery({
    queryKey: ['trend-analysis', selectedMetric, entityType, entityId, analysisPeriod, forecastPeriods],
    queryFn: async (): Promise<TrendAnalysisData> => {
      const params = new URLSearchParams({
        metric_name: selectedMetric,
        entity_type: entityType,
        analysis_period_days: analysisPeriod,
        forecast_periods: forecastPeriods
      });
      
      if (entityId) {
        params.append('entity_id', entityId);
      }
      
      return apiGet<TrendAnalysisData>(`/advanced-analytics/trends/analyze?${params.toString()}`);
    },
    refetchInterval: 300000, // 5 minutes
    staleTime: 60000, // 1 minute
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportTrends = async () => {
    try {
      const exportData = await apiPost('/advanced-analytics/data/export', {
        export_format: 'excel',
        data_type: 'trend_analysis',
        filters: {
          metric_name: selectedMetric,
          entity_type: entityType,
          entity_id: entityId,
          analysis_period_days: analysisPeriod
        }
      });
      
      console.log('Export initiated:', exportData);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'volatile':
        return <Activity className="h-5 w-5 text-orange-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return 'text-green-700 bg-green-100';
      case 'decreasing':
        return 'text-red-700 bg-red-100';
      case 'volatile':
        return 'text-orange-700 bg-orange-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Trend Analysis</h3>
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 flex items-center justify-center shadow-lg">
              <LineChart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Trend Analysis</h1>
              <p className="text-muted-foreground text-lg">
                Advanced trend detection with seasonal patterns and forecasting
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <Zap className="h-3 w-3" />
            Real-time Analysis
          </Badge>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={handleExportTrends} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Configuration */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100/80">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Trend Analysis Configuration</CardTitle>
                <p className="text-muted-foreground">Configure metrics and analysis parameters</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {availableMetrics.map((metric) => (
                    <SelectItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall Business</SelectItem>
                  <SelectItem value="category">Product Category</SelectItem>
                  <SelectItem value="customer_segment">Customer Segment</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Analysis Period</label>
              <Select value={analysisPeriod} onValueChange={setAnalysisPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="365">1 Year</SelectItem>
                  <SelectItem value="730">2 Years</SelectItem>
                  <SelectItem value="1095">3 Years</SelectItem>
                  <SelectItem value="1460">4 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Forecast Periods</label>
              <Select value={forecastPeriods} onValueChange={setForecastPeriods}>
                <SelectTrigger>
                  <SelectValue placeholder="Select forecast" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trend Strength</label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className="text-sm font-medium">
                  {trendData?.trend_strength ? 
                    (trendData.trend_strength * 100).toFixed(1) : '78.5'}%
                </div>
                <Badge variant="secondary" className="text-xs">
                  {(trendData?.trend_strength || 0.785) > 0.7 ? 'Strong' : 
                   (trendData?.trend_strength || 0.785) > 0.4 ? 'Moderate' : 'Weak'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Overview */}
      {trendData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                  {getTrendIcon(trendData.trend_direction)}
                </div>
                <Badge variant="secondary" className={getTrendColor(trendData.trend_direction)}>
                  {trendData.trend_direction}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {(trendData.growth_rate * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Volatility</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-700">
                  {(trendData.volatility * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Market Volatility</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">Forecast</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-700">
                  {trendData.forecast_next_period.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Next Period Forecast</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">Seasonal</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-lg font-bold text-orange-700">
                  {trendData.seasonal_component.has_seasonality ? 'Yes' : 'No'}
                </div>
                <p className="text-sm text-muted-foreground">Seasonality Detected</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="trend" className="w-full">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-b-2 border-green-200">
              <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="trend" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300"
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <LineChart className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Trend Analysis</div>
                    <div className="text-xs text-muted-foreground">Historical Trends</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="seasonal" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-teal-300"
                >
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Seasonal Patterns</div>
                    <div className="text-xs text-muted-foreground">Seasonal Analysis</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="anomalies" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Anomaly Detection</div>
                    <div className="text-xs text-muted-foreground">Outliers & Anomalies</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="insights" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Insights</div>
                    <div className="text-xs text-muted-foreground">Key Findings</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Trend Analysis Tab */}
            <TabsContent value="trend" className="p-6 space-y-6 bg-gradient-to-br from-green-50/30 to-white">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                  </div>
                </div>
              ) : trendData ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-5 w-5" />
                        Historical Trend Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TrendChart 
                        data={trendData.historical_data.map(item => ({
                          timestamp: item.date,
                          value: item.value,
                          trend: item.trend_component,
                          seasonal: item.seasonal_component,
                          residual: item.residual
                        }))}
                        height={400}
                        analysis={{
                          enabled: true,
                          showTrendLine: true,
                          showSeasonality: true,
                          showConfidenceBands: true,
                          showPrediction: true
                        }}
                      />
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Trend Components</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <InteractiveChart 
                          data={trendData.historical_data.slice(-30).map(item => ({
                            name: new Date(item.date).toLocaleDateString(),
                            trend: item.trend_component,
                            seasonal: item.seasonal_component,
                            residual: item.residual
                          }))}
                          type="line"
                          height={300}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Forecast Confidence</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-700">
                              {trendData.forecast_next_period.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Predicted Value</div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Confidence Range</span>
                              <span className="text-sm text-muted-foreground">
                                {trendData.confidence_interval[0].toLocaleString()} - {trendData.confidence_interval[1].toLocaleString()}
                              </span>
                            </div>
                            <Progress value={85} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No trend data available</p>
                </div>
              )}
            </TabsContent>

            {/* Seasonal Patterns Tab */}
            <TabsContent value="seasonal" className="p-6 space-y-6 bg-gradient-to-br from-teal-50/30 to-white">
              {trendData?.seasonal_component && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Seasonal Pattern Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InteractiveChart 
                        data={trendData.seasonal_component.seasonal_pattern.map(item => ({
                          name: item.period,
                          value: item.factor
                        }))}
                        type="bar"
                        height={300}
                      />
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Peak Periods</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {trendData.seasonal_component.peak_periods.map((period, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <span className="font-medium">{period}</span>
                              <Badge className="bg-green-100 text-green-700">Peak</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Low Periods</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {trendData.seasonal_component.low_periods.map((period, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <span className="font-medium">{period}</span>
                              <Badge className="bg-red-100 text-red-700">Low</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Anomalies Tab */}
            <TabsContent value="anomalies" className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 to-white">
              {trendData?.anomalies_detected && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Detected Anomalies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trendData.anomalies_detected.map((anomaly, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div>
                            <div className="font-medium">{new Date(anomaly.date).toLocaleDateString()}</div>
                            <div className="text-sm text-muted-foreground">{anomaly.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">Value: {anomaly.value.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">
                              Score: {(anomaly.anomaly_score * 100).toFixed(1)}%
                            </div>
                            <Badge variant={anomaly.anomaly_score > 0.8 ? 'destructive' : 'secondary'}>
                              {anomaly.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="p-6 space-y-6 bg-gradient-to-br from-indigo-50/30 to-white">
              {trendData && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Key Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {trendData.insights.map((insight, index) => (
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

                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {trendData.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm p-3 bg-green-50 rounded-lg">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                            <span className="text-gray-700">{recommendation}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendAnalysisDashboard;export {
 TrendAnalysisDashboard };e
xport default TrendAnalysisDashboard;export { Tr
endAnalysisDashboard };