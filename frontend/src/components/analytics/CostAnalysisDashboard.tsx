/**
 * Cost Analysis Dashboard Component
 * 
 * Provides comprehensive cost optimization analysis including:
 * - Detailed cost breakdowns
 * - Optimization recommendations
 * - Cost trend analysis
 * - ROI calculations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrendChart } from './charts/TrendChart';
import { HeatmapChart } from './charts/HeatmapChart';
import { MetricCard } from './MetricCard';
import { TimeRangeSelector, TimeRange } from './TimeRangeSelector';
import { ChartExportMenu } from './charts/ChartExportMenu';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  potential_savings: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  implementation_effort: 'low' | 'medium' | 'high';
}

interface CostAnalysisData {
  total_cost: number;
  cost_breakdown: CostBreakdown[];
  optimization_recommendations: OptimizationRecommendation[];
  cost_trends: Array<{
    date: string;
    total_cost: number;
    labor_cost: number;
    material_cost: number;
    overhead_cost: number;
  }>;
  roi_metrics: {
    current_roi: number;
    projected_roi: number;
    cost_per_unit: number;
    efficiency_score: number;
  };
}

export const CostAnalysisDashboard: React.FC = () => {
  const [data, setData] = useState<CostAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    period: 'month',
    label: 'Last 30 Days',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchCostAnalysisData();
  }, [timeRange, selectedCategory]);

  const fetchCostAnalysisData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        time_range: timeRange.period,
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      });
      
      const response = await fetch(`/api/cost-analysis?${params}`);
      if (!response.ok) throw new Error('Failed to fetch cost analysis data');
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="status"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Cost Analysis Dashboard</h1>
              <p className="text-muted-foreground text-lg">Optimize costs and improve profitability</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <Target className="h-3 w-3" />
            Cost Optimized
          </Badge>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="labor">Labor</SelectItem>
              <SelectItem value="materials">Materials</SelectItem>
              <SelectItem value="overhead">Overhead</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
            </SelectContent>
          </Select>
          <ChartExportMenu 
            chartElement={null}
            chartData={data.cost_breakdown}
            chartConfig={{ type: 'cost-analysis', data: data }}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          data={{
            id: 'total-cost',
            title: 'Total Cost',
            value: data.total_cost,
            format: 'currency',
            status: 'info',
            icon: <DollarSign className="h-6 w-6" />,
            trend: data.cost_trends.length > 1 ? {
              direction: data.cost_trends[data.cost_trends.length - 1].total_cost > 
                       data.cost_trends[data.cost_trends.length - 2].total_cost ? 'up' : 'down',
              percentage: 0,
              period: 'month'
            } : undefined
          }}
        />
        <MetricCard
          data={{
            id: 'current-roi',
            title: 'Current ROI',
            value: data.roi_metrics.current_roi,
            format: 'percentage',
            status: 'success',
            icon: <Target className="h-6 w-6" />,
            trend: {
              direction: data.roi_metrics.projected_roi > data.roi_metrics.current_roi ? 'up' : 'down',
              percentage: 0,
              period: 'month'
            }
          }}
        />
        <MetricCard
          data={{
            id: 'cost-per-unit',
            title: 'Cost per Unit',
            value: data.roi_metrics.cost_per_unit,
            format: 'currency',
            status: 'neutral',
            icon: <Package className="h-6 w-6" />
          }}
        />
        <MetricCard
          data={{
            id: 'efficiency-score',
            title: 'Efficiency Score',
            value: data.roi_metrics.efficiency_score,
            format: 'percentage',
            status: data.roi_metrics.efficiency_score > 75 ? 'success' : 'warning',
            icon: <BarChart3 className="h-6 w-6" />,
            trend: {
              direction: data.roi_metrics.efficiency_score > 75 ? 'up' : 'down',
              percentage: 0,
              period: 'month'
            }
          }}
        />
      </div>

      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="breakdown" className="w-full">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b-2 border-green-200">
              <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="breakdown" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300"
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <PieChart className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Cost Breakdown</div>
                    <div className="text-xs text-muted-foreground">Distribution</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="trends" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-emerald-300"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Cost Trends</div>
                    <div className="text-xs text-muted-foreground">Over Time</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="recommendations" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-teal-300"
                >
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Recommendations</div>
                    <div className="text-xs text-muted-foreground">Optimize</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="roi" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">ROI Analysis</div>
                    <div className="text-xs text-muted-foreground">Returns</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="breakdown" className="p-6 space-y-6 bg-gradient-to-br from-green-50/30 to-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Breakdown Chart */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Cost Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HeatmapChart
                      data={data.cost_breakdown.map((item, index) => ({
                        x: item.category,
                        y: 'Cost',
                        value: item.amount,
                        label: `${item.category}: ${formatCurrency(item.amount)}`
                      }))}
                      height={300}
                    />
                  </CardContent>
                </Card>

                {/* Cost Categories */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.cost_breakdown.map((item) => (
                        <div key={item.category} className="flex items-center justify-between p-3 border rounded-lg bg-white/70 hover:bg-white transition-colors">
                          <div className="flex items-center gap-3">
                            {getTrendIcon(item.trend)}
                            <div>
                              <p className="font-medium">{item.category}</p>
                              <p className="text-sm text-gray-600">{item.percentage.toFixed(1)}% of total</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(item.amount)}</p>
                            <p className={`text-sm ${item.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="p-6 space-y-6 bg-gradient-to-br from-emerald-50/30 to-white">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-100/50 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle>Cost Trends Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <TrendChart
                    data={data.cost_trends.map(item => ({
                      timestamp: item.date,
                      value: item.total_cost
                    }))}
                    height={400}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="p-6 space-y-6 bg-gradient-to-br from-teal-50/30 to-white">
              <div className="grid gap-4">
                {data.optimization_recommendations.map((rec) => (
                  <Card key={rec.id} className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{rec.title}</h3>
                            <Badge variant={getPriorityColor(rec.priority) as any}>
                              {rec.priority} priority
                            </Badge>
                            <Badge variant="outline">{rec.category}</Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{rec.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600 font-medium">
                              Potential Savings: {formatCurrency(rec.potential_savings)}
                            </span>
                            <span className="text-gray-500">
                              Implementation: {rec.implementation_effort} effort
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="roi" className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 to-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle>ROI Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-100 to-blue-200/70 rounded-lg">
                        <span className="font-medium">Current ROI</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {data.roi_metrics.current_roi.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-100 to-green-200/70 rounded-lg">
                        <span className="font-medium">Projected ROI</span>
                        <span className="text-2xl font-bold text-green-600">
                          {data.roi_metrics.projected_roi.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-100 to-gray-200/70 rounded-lg">
                        <span className="font-medium">Improvement Potential</span>
                        <span className="text-2xl font-bold text-gray-700">
                          +{(data.roi_metrics.projected_roi - data.roi_metrics.current_roi).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-100/50 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Efficiency Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Efficiency Score</span>
                          <span className="font-semibold">{data.roi_metrics.efficiency_score.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" 
                            style={{ width: `${data.roi_metrics.efficiency_score}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-2">Cost per Unit</p>
                        <p className="text-2xl font-bold">{formatCurrency(data.roi_metrics.cost_per_unit)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostAnalysisDashboard;