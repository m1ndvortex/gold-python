import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar,
  Target,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Zap,
  Eye,
  ArrowUpDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/services/api';
import { InteractiveChart } from './charts/InteractiveChart';

interface ComparisonPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  metrics: Record<string, number>;
}

interface ComparativeAnalysisData {
  comparison_type: 'time_periods' | 'business_segments' | 'product_categories' | 'customer_segments';
  periods: ComparisonPeriod[];
  metrics_analyzed: string[];
  variance_analysis: {
    metric_name: string;
    variance_percentage: number;
    significance_level: number;
    trend_direction: 'up' | 'down' | 'stable';
    statistical_significance: boolean;
  }[];
  insights: string[];
  recommendations: string[];
  benchmark_data?: {
    industry_average: Record<string, number>;
    top_quartile: Record<string, number>;
    bottom_quartile: Record<string, number>;
  };
}

interface ComparativeAnalysisDashboardProps {
  className?: string;
}

export const ComparativeAnalysisDashboard: React.FC<ComparativeAnalysisDashboardProps> = ({
  className
}) => {
  const [comparisonType, setComparisonType] = useState<'time_periods' | 'business_segments' | 'product_categories' | 'customer_segments'>('time_periods');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'profit_margin', 'customer_count']);
  const [timePeriod1, setTimePeriod1] = useState('current_month');
  const [timePeriod2, setTimePeriod2] = useState('previous_month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Available metrics for comparison
  const availableMetrics = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'profit_margin', label: 'Profit Margin' },
    { value: 'customer_count', label: 'Customer Count' },
    { value: 'transaction_count', label: 'Transaction Count' },
    { value: 'avg_transaction_value', label: 'Avg Transaction Value' },
    { value: 'inventory_turnover', label: 'Inventory Turnover' },
    { value: 'customer_retention', label: 'Customer Retention' },
    { value: 'cost_per_acquisition', label: 'Cost per Acquisition' }
  ];

  // Fetch comparative analysis data
  const { data: comparisonData, isLoading, error, refetch } = useQuery({
    queryKey: ['comparative-analysis', comparisonType, selectedMetrics, timePeriod1, timePeriod2],
    queryFn: async (): Promise<ComparativeAnalysisData> => {
      const params = new URLSearchParams({
        comparison_type: comparisonType,
        metrics: selectedMetrics.join(','),
        period_1: timePeriod1,
        period_2: timePeriod2
      });
      return apiGet<ComparativeAnalysisData>(`/advanced-analytics/comparative-analysis?${params.toString()}`);
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

  const handleExportComparison = async () => {
    try {
      const exportData = await apiPost('/advanced-analytics/data/export', {
        export_format: 'excel',
        data_type: 'comparative_analysis',
        filters: {
          comparison_type: comparisonType,
          metrics: selectedMetrics,
          period_1: timePeriod1,
          period_2: timePeriod2
        }
      });
      
      console.log('Export initiated:', exportData);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 10) return 'text-green-700 bg-green-100';
    if (variance > 0) return 'text-blue-700 bg-blue-100';
    if (variance > -10) return 'text-orange-700 bg-orange-100';
    return 'text-red-700 bg-red-100';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Comparative Analysis</h3>
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center shadow-lg">
              <ArrowUpDown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Comparative Analysis</h1>
              <p className="text-muted-foreground text-lg">
                Compare performance across time periods and business segments
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1">
            <Zap className="h-3 w-3" />
            Statistical Analysis
          </Badge>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={handleExportComparison} variant="outline" size="sm" className="gap-2">
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
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Comparison Configuration</CardTitle>
                <p className="text-muted-foreground">Configure comparison parameters and metrics</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comparison Type</label>
              <Select value={comparisonType} onValueChange={(value: any) => setComparisonType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select comparison type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_periods">Time Periods</SelectItem>
                  <SelectItem value="business_segments">Business Segments</SelectItem>
                  <SelectItem value="product_categories">Product Categories</SelectItem>
                  <SelectItem value="customer_segments">Customer Segments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Period 1</label>
              <Select value={timePeriod1} onValueChange={setTimePeriod1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="previous_month">Previous Month</SelectItem>
                  <SelectItem value="current_quarter">Current Quarter</SelectItem>
                  <SelectItem value="previous_quarter">Previous Quarter</SelectItem>
                  <SelectItem value="current_year">Current Year</SelectItem>
                  <SelectItem value="previous_year">Previous Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Period 2</label>
              <Select value={timePeriod2} onValueChange={setTimePeriod2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="previous_month">Previous Month</SelectItem>
                  <SelectItem value="current_quarter">Current Quarter</SelectItem>
                  <SelectItem value="previous_quarter">Previous Quarter</SelectItem>
                  <SelectItem value="current_year">Current Year</SelectItem>
                  <SelectItem value="previous_year">Previous Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Metrics Count</label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className="text-sm font-medium">
                  {selectedMetrics.length} / {availableMetrics.length}
                </div>
                <Badge variant="secondary" className="text-xs">
                  Selected
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="comparison" className="w-full">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border-b-2 border-orange-200">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="comparison" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-orange-300"
                >
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Comparison View</div>
                    <div className="text-xs text-muted-foreground">Side-by-side Analysis</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="variance" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-red-300"
                >
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <Target className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Variance Analysis</div>
                    <div className="text-xs text-muted-foreground">Statistical Significance</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="insights" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-pink-300"
                >
                  <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Insights</div>
                    <div className="text-xs text-muted-foreground">Key Findings</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Comparison View Tab */}
            <TabsContent value="comparison" className="p-6 space-y-6 bg-gradient-to-br from-orange-50/30 to-white">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                  </div>
                </div>
              ) : comparisonData?.periods ? (
                <div className="space-y-6">
                  {/* Comparison Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Comparative Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InteractiveChart 
                        data={comparisonData.periods.map(period => ({
                          name: period.name,
                          value: period.metrics.revenue || 0,
                          ...period.metrics
                        }))}
                        type="bar"
                        height={400}
                      />
                    </CardContent>
                  </Card>

                  {/* Period Comparison Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {comparisonData.periods.map((period, index) => (
                      <Card key={period.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {period.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(period.metrics).map(([metric, value]) => (
                              <div key={metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium capitalize">{metric.replace('_', ' ')}</span>
                                <span className="text-lg font-bold">
                                  {typeof value === 'number' ? value.toLocaleString() : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No comparison data available</p>
                </div>
              )}
            </TabsContent>

            {/* Variance Analysis Tab */}
            <TabsContent value="variance" className="p-6 space-y-6 bg-gradient-to-br from-red-50/30 to-white">
              {comparisonData?.variance_analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Statistical Variance Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comparisonData.variance_analysis.map((variance, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", getVarianceColor(variance.variance_percentage))}>
                              {getVarianceIcon(variance.variance_percentage)}
                            </div>
                            <div>
                              <div className="font-medium capitalize">{variance.metric_name.replace('_', ' ')}</div>
                              <div className="text-sm text-muted-foreground">
                                Significance: {(variance.significance_level * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-lg font-bold", getVarianceColor(variance.variance_percentage))}>
                              {variance.variance_percentage > 0 ? '+' : ''}{variance.variance_percentage.toFixed(1)}%
                            </div>
                            <Badge variant={variance.statistical_significance ? 'default' : 'secondary'}>
                              {variance.statistical_significance ? 'Significant' : 'Not Significant'}
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
            <TabsContent value="insights" className="p-6 space-y-6 bg-gradient-to-br from-pink-50/30 to-white">
              {comparisonData && (
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
                        {comparisonData.insights.map((insight, index) => (
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
                        {comparisonData.recommendations.map((recommendation, index) => (
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

export default ComparativeAnalysisDashboard;