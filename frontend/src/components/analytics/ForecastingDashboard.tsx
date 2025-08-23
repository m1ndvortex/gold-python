import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Package, 
  AlertTriangle,
  BarChart3,
  LineChart,
  Activity,
  Target,
  Zap,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useDemandForecasts } from '../../hooks/useInventoryIntelligence';
import { TrendChart } from './charts/TrendChart';
import { InteractiveChart } from './charts/InteractiveChart';
import { cn } from '../../lib/utils';

interface ForecastingDashboardProps {
  className?: string;
}

export const ForecastingDashboard: React.FC<ForecastingDashboardProps> = ({ className }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch demand forecasts
  const { data: forecasts, isLoading, refetch } = useDemandForecasts();

  // Sample data for demonstration
  const forecastData = useMemo(() => [
    { timestamp: '2024-01-01', value: 4200, prediction: 4100, confidence: 0.85 },
    { timestamp: '2024-01-08', value: 3800, prediction: 3900, confidence: 0.82 },
    { timestamp: '2024-01-15', value: 4500, prediction: 4300, confidence: 0.88 },
    { timestamp: '2024-01-22', value: 4100, prediction: 4100, confidence: 0.79 },
    { timestamp: '2024-01-29', value: 4600, prediction: 4600, confidence: 0.76 },
    { timestamp: '2024-02-05', value: 4200, prediction: 4200, confidence: 0.73 },
  ], []);

  // Transform API data to chart format if available
  const transformedForecasts = useMemo(() => {
    if (!forecasts || !Array.isArray(forecasts)) return null;
    
    return forecasts.map((forecast: any) => ({
      timestamp: forecast.forecast_period_start || forecast.created_at,
      value: forecast.predicted_demand || 0,
      prediction: forecast.predicted_demand || 0,
      confidence: forecast.forecast_accuracy || 0.5,
      target: forecast.confidence_interval_upper || undefined
    }));
  }, [forecasts]);

  // Use transformed API data or fallback to sample data
  const displayData = transformedForecasts || forecastData;

  const accuracyMetrics = useMemo(() => ({
    overall: 87.5,
    shortTerm: 92.1,
    longTerm: 78.3,
    seasonal: 85.7
  }), []);

  const topForecasts = useMemo(() => [
    { 
      item: 'Gold Necklace 18K', 
      category: 'Necklaces',
      currentStock: 15,
      predictedDemand: 25,
      confidence: 89,
      trend: 'up',
      urgency: 'high'
    },
    { 
      item: 'Diamond Ring Set', 
      category: 'Rings',
      currentStock: 8,
      predictedDemand: 12,
      confidence: 85,
      trend: 'up',
      urgency: 'medium'
    },
    { 
      item: 'Silver Bracelet', 
      category: 'Bracelets',
      currentStock: 22,
      predictedDemand: 18,
      confidence: 78,
      trend: 'down',
      urgency: 'low'
    },
    { 
      item: 'Gold Earrings', 
      category: 'Earrings',
      currentStock: 12,
      predictedDemand: 20,
      confidence: 91,
      trend: 'up',
      urgency: 'high'
    },
  ], []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Demand Forecasting</h1>
              <p className="text-muted-foreground text-lg">
                AI-powered demand prediction and inventory planning
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
            <Activity className="h-3 w-3" />
            Live Predictions
          </Badge>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Target className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100/80">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Forecast Filters</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Configure prediction parameters and time ranges
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Forecast Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="necklaces">Necklaces</SelectItem>
                  <SelectItem value="rings">Rings</SelectItem>
                  <SelectItem value="bracelets">Bracelets</SelectItem>
                  <SelectItem value="earrings">Earrings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Model Type</label>
              <Select defaultValue="ensemble">
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ensemble">Ensemble Model</SelectItem>
                  <SelectItem value="arima">ARIMA</SelectItem>
                  <SelectItem value="linear">Linear Regression</SelectItem>
                  <SelectItem value="seasonal">Seasonal Decomposition</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accuracy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">Overall</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-700">{accuracyMetrics.overall}%</div>
              <p className="text-sm text-muted-foreground">Prediction Accuracy</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Short-term</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-700">{accuracyMetrics.shortTerm}%</div>
              <p className="text-sm text-muted-foreground">7-Day Accuracy</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">Long-term</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-700">{accuracyMetrics.longTerm}%</div>
              <p className="text-sm text-muted-foreground">90-Day Accuracy</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">Seasonal</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-700">{accuracyMetrics.seasonal}%</div>
              <p className="text-sm text-muted-foreground">Seasonal Accuracy</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Forecast Overview</div>
                    <div className="text-xs text-muted-foreground">Predictions & Trends</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="accuracy" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Target className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Model Accuracy</div>
                    <div className="text-xs text-muted-foreground">Performance Metrics</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="recommendations" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300"
                >
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Recommendations</div>
                    <div className="text-xs text-muted-foreground">Action Items</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Forecast Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 to-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Demand Forecast Trend
                    </CardTitle>
                    <CardDescription>Predicted vs actual demand over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TrendChart 
                      data={displayData}
                      height={300}
                      analysis={{
                        enabled: true,
                        showConfidenceBands: true,
                        showPrediction: true,
                        anomalyDetection: true
                      }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Category Forecasts
                    </CardTitle>
                    <CardDescription>Demand predictions by product category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractiveChart 
                      data={[
                        { name: 'Necklaces', value: 1200, predicted: 1350 },
                        { name: 'Rings', value: 980, predicted: 1100 },
                        { name: 'Bracelets', value: 750, predicted: 820 },
                        { name: 'Earrings', value: 650, predicted: 720 },
                      ]}
                      type="bar"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Model Accuracy Tab */}
            <TabsContent value="accuracy" className="p-6 space-y-6 bg-gradient-to-br from-indigo-50/30 to-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Accuracy Trends</CardTitle>
                    <CardDescription>Model performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractiveChart 
                      data={[
                        { name: 'Jan', value: 85.2 },
                        { name: 'Feb', value: 87.1 },
                        { name: 'Mar', value: 89.3 },
                        { name: 'Apr', value: 86.7 },
                        { name: 'May', value: 88.9 },
                        { name: 'Jun', value: 87.5 },
                      ]}
                      type="line"
                      height={300}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Model Comparison</CardTitle>
                    <CardDescription>Performance by algorithm type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractiveChart 
                      data={[
                        { name: 'Ensemble', value: 87.5 },
                        { name: 'ARIMA', value: 84.2 },
                        { name: 'Linear', value: 79.8 },
                        { name: 'Seasonal', value: 85.7 },
                      ]}
                      type="bar"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="p-6 space-y-6 bg-gradient-to-br from-purple-50/30 to-white">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    High Priority Items
                  </CardTitle>
                  <CardDescription>Items requiring immediate attention based on forecasts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topForecasts.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">{item.item}</div>
                              <div className="text-sm text-muted-foreground">{item.category}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">Stock: {item.currentStock}</div>
                            <div className="text-sm text-muted-foreground">Predicted: {item.predictedDemand}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.trend === 'up' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <Badge 
                              variant={item.urgency === 'high' ? 'destructive' : item.urgency === 'medium' ? 'default' : 'secondary'}
                            >
                              {item.urgency}
                            </Badge>
                          </div>
                          <div className="text-sm font-medium">{item.confidence}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForecastingDashboard;