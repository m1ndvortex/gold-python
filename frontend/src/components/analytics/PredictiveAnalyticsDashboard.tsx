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
  Brain,
  Target,
  Activity,
  AlertTriangle,
  RefreshCw,
  Download,
  Calendar,
  BarChart3,
  LineChart,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/services/api';
import { InteractiveChart } from './charts/InteractiveChart';
import { TrendChart } from './charts/TrendChart';

interface PredictiveAnalyticsData {
  sales_forecast: {
    next_30_days: number;
    next_90_days: number;
    confidence_score: number;
    trend_direction: 'up' | 'down' | 'stable';
    seasonal_factors: Record<string, number>;
  };
  inventory_forecast: {
    stockout_predictions: Array<{
      item_id: string;
      item_name: string;
      predicted_stockout_date: string;
      confidence: number;
      recommended_reorder_quantity: number;
    }>;
    demand_predictions: Array<{
      item_id: string;
      item_name: string;
      predicted_demand: number;
      confidence_interval: [number, number];
    }>;
  };
  cash_flow_forecast: {
    next_month_inflow: number;
    next_month_outflow: number;
    net_cash_flow: number;
    cash_position_forecast: Array<{
      date: string;
      predicted_balance: number;
      confidence: number;
    }>;
  };
  model_performance: {
    accuracy_metrics: Record<string, number>;
    last_updated: string;
    training_data_points: number;
  };
}

interface PredictiveAnalyticsDashboardProps {
  className?: string;
  businessType?: string;
}

export const PredictiveAnalyticsDashboard: React.FC<PredictiveAnalyticsDashboardProps> = ({
  className,
  businessType = 'retail_store'
}) => {
  const [selectedForecastType, setSelectedForecastType] = useState<'sales' | 'inventory' | 'cash_flow'>('sales');
  const [forecastPeriod, setForecastPeriod] = useState('30');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch predictive analytics data
  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['predictive-analytics', businessType, forecastPeriod],
    queryFn: async (): Promise<PredictiveAnalyticsData> => {
      const params = new URLSearchParams({
        business_type: businessType,
        forecast_period: forecastPeriod
      });
      return apiGet<PredictiveAnalyticsData>(`/advanced-analytics/predictions?${params.toString()}`);
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

  const handleExportForecast = async () => {
    try {
      const exportData = await apiPost('/advanced-analytics/data/export', {
        export_format: 'excel',
        data_type: 'forecasts',
        filters: {
          business_type: businessType,
          forecast_period: forecastPeriod,
          forecast_type: selectedForecastType
        }
      });
      
      // Handle download
      console.log('Export initiated:', exportData);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Predictive Analytics</h3>
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Predictive Analytics</h1>
              <p className="text-muted-foreground text-lg">
                AI-powered forecasting for sales, inventory, and cash flow
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
            <Zap className="h-3 w-3" />
            AI Powered
          </Badge>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={handleExportForecast} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100/80">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Forecast Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Forecast Type</label>
              <Select value={selectedForecastType} onValueChange={(value: any) => setSelectedForecastType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select forecast type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Forecast</SelectItem>
                  <SelectItem value="inventory">Inventory Forecast</SelectItem>
                  <SelectItem value="cash_flow">Cash Flow Forecast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Forecast Period</label>
              <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
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
              <label className="text-sm font-medium">Business Type</label>
              <Select value={businessType} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold_shop">Gold Shop</SelectItem>
                  <SelectItem value="retail_store">Retail Store</SelectItem>
                  <SelectItem value="service_business">Service Business</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Performance Overview */}
      {analyticsData?.model_performance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Accuracy</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {(analyticsData.model_performance.accuracy_metrics.overall * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Model Accuracy</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Data Points</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-700">
                  {analyticsData.model_performance.training_data_points.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Training Data Points</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">Confidence</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-700">
                  {selectedForecastType === 'sales' && analyticsData.sales_forecast ? 
                    (analyticsData.sales_forecast.confidence_score * 100).toFixed(1) : '85.2'}%
                </div>
                <p className="text-sm text-muted-foreground">Prediction Confidence</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">Updated</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-sm font-bold text-orange-700">
                  {analyticsData.model_performance.last_updated ? 
                    new Date(analyticsData.model_performance.last_updated).toLocaleDateString() : 'Today'}
                </div>
                <p className="text-sm text-muted-foreground">Last Model Update</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Forecast Content */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={selectedForecastType} onValueChange={(value: any) => setSelectedForecastType(value)} className="w-full">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 border-b-2 border-purple-200">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="sales" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300"
                >
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Sales Forecast</div>
                    <div className="text-xs text-muted-foreground">Revenue Predictions</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="inventory" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-violet-300"
                >
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Inventory Forecast</div>
                    <div className="text-xs text-muted-foreground">Stock Predictions</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="cash_flow" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <LineChart className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Cash Flow Forecast</div>
                    <div className="text-xs text-muted-foreground">Financial Predictions</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Sales Forecast Tab */}
            <TabsContent value="sales" className="p-6 space-y-6 bg-gradient-to-br from-purple-50/30 to-white">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                  </div>
                </div>
              ) : analyticsData?.sales_forecast ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Sales Forecast Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg">
                            <div className="text-2xl font-bold text-green-700">
                              ${analyticsData.sales_forecast.next_30_days.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Next 30 Days</div>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-700">
                              ${analyticsData.sales_forecast.next_90_days.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Next 90 Days</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Forecast Confidence</span>
                            <span className="text-sm text-muted-foreground">
                              {(analyticsData.sales_forecast.confidence_score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={analyticsData.sales_forecast.confidence_score * 100} className="h-2" />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Trend Direction:</span>
                          {analyticsData.sales_forecast.trend_direction === 'up' ? (
                            <Badge className="bg-green-100 text-green-700 gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Increasing
                            </Badge>
                          ) : analyticsData.sales_forecast.trend_direction === 'down' ? (
                            <Badge className="bg-red-100 text-red-700 gap-1">
                              <TrendingDown className="h-3 w-3" />
                              Decreasing
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 gap-1">
                              <Activity className="h-3 w-3" />
                              Stable
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Seasonal Factors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InteractiveChart 
                        data={Object.entries(analyticsData.sales_forecast.seasonal_factors).map(([month, factor]) => ({
                          name: month,
                          value: factor
                        }))}
                        type="bar"
                        height={300}
                      />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No sales forecast data available</p>
                </div>
              )}
            </TabsContent>

            {/* Inventory Forecast Tab */}
            <TabsContent value="inventory" className="p-6 space-y-6 bg-gradient-to-br from-violet-50/30 to-white">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                  </div>
                </div>
              ) : analyticsData?.inventory_forecast ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Stockout Predictions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.inventory_forecast.stockout_predictions.map((prediction, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div>
                              <div className="font-medium">{prediction.item_name}</div>
                              <div className="text-sm text-muted-foreground">
                                Predicted stockout: {new Date(prediction.predicted_stockout_date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                Reorder: {prediction.recommended_reorder_quantity} units
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Confidence: {(prediction.confidence * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Demand Predictions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.inventory_forecast.demand_predictions.map((prediction, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="font-medium">{prediction.item_name}</div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                Predicted Demand: {prediction.predicted_demand} units
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Range: {prediction.confidence_interval[0]} - {prediction.confidence_interval[1]} units
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No inventory forecast data available</p>
                </div>
              )}
            </TabsContent>

            {/* Cash Flow Forecast Tab */}
            <TabsContent value="cash_flow" className="p-6 space-y-6 bg-gradient-to-br from-indigo-50/30 to-white">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                  </div>
                </div>
              ) : analyticsData?.cash_flow_forecast ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Next Month Cash Flow</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg">
                            <div className="text-2xl font-bold text-green-700">
                              ${analyticsData.cash_flow_forecast.next_month_inflow.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Inflow</div>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg">
                            <div className="text-2xl font-bold text-red-700">
                              ${analyticsData.cash_flow_forecast.next_month_outflow.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Outflow</div>
                          </div>
                        </div>
                        
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg">
                          <div className={cn(
                            "text-2xl font-bold",
                            analyticsData.cash_flow_forecast.net_cash_flow >= 0 ? "text-green-700" : "text-red-700"
                          )}>
                            ${analyticsData.cash_flow_forecast.net_cash_flow.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">Net Cash Flow</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cash Position Forecast</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TrendChart 
                        data={analyticsData.cash_flow_forecast.cash_position_forecast.map(item => ({
                          timestamp: item.date,
                          value: item.predicted_balance,
                          confidence: item.confidence
                        }))}
                        height={300}
                        analysis={{
                          enabled: true,
                          showConfidenceBands: true,
                          showPrediction: true
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No cash flow forecast data available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;