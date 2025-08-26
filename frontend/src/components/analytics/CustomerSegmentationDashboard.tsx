import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Eye,
  BarChart3,
  PieChart,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/services/api';
import { InteractiveChart } from './charts/InteractiveChart';

interface CustomerSegment {
  segment_id: string;
  segment_name: string;
  customer_count: number;
  characteristics: {
    avg_recency: number;
    avg_frequency: number;
    avg_monetary: number;
    avg_transaction_value: number;
    retention_rate: number;
    churn_risk: number;
  };
  lifetime_value: number;
  recommended_actions: string[];
  segment_color: string;
  growth_trend: 'up' | 'down' | 'stable';
  percentage_of_total: number;
}

interface CustomerSegmentationData {
  segments: CustomerSegment[];
  segmentation_method: string;
  analysis_period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  total_customers: number;
  segmentation_quality: {
    silhouette_score: number;
    segment_separation: number;
    within_cluster_variance: number;
  };
  insights: string[];
  recommendations: string[];
  last_updated: string;
}

interface CustomerSegmentationDashboardProps {
  className?: string;
}

export const CustomerSegmentationDashboard: React.FC<CustomerSegmentationDashboardProps> = ({
  className
}) => {
  const [segmentationMethod, setSegmentationMethod] = useState<'rfm' | 'behavioral' | 'value_based' | 'predictive'>('rfm');
  const [numSegments, setNumSegments] = useState('5');
  const [analysisPeriod, setAnalysisPeriod] = useState('365');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch customer segmentation data
  const { data: segmentationData, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-segmentation', segmentationMethod, numSegments, analysisPeriod],
    queryFn: async (): Promise<CustomerSegmentationData> => {
      const params = new URLSearchParams({
        segmentation_method: segmentationMethod,
        num_segments: numSegments,
        analysis_period_days: analysisPeriod
      });
      return apiGet<CustomerSegmentationData>(`/advanced-analytics/customers/segmentation?${params.toString()}`);
    },
    refetchInterval: 600000, // 10 minutes
    staleTime: 300000, // 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportSegmentation = async () => {
    try {
      const exportData = await apiPost('/advanced-analytics/data/export', {
        export_format: 'excel',
        data_type: 'customer_segments',
        filters: {
          segmentation_method: segmentationMethod,
          num_segments: numSegments,
          analysis_period_days: analysisPeriod
        }
      });
      
      console.log('Export initiated:', exportData);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getSegmentColor = (segment: CustomerSegment) => {
    const colors = {
      'Champions': 'bg-gradient-to-br from-green-500 to-emerald-600',
      'Loyal Customers': 'bg-gradient-to-br from-blue-500 to-blue-600',
      'Potential Loyalists': 'bg-gradient-to-br from-purple-500 to-violet-600',
      'New Customers': 'bg-gradient-to-br from-cyan-500 to-teal-600',
      'Promising': 'bg-gradient-to-br from-orange-500 to-amber-600',
      'Need Attention': 'bg-gradient-to-br from-yellow-500 to-orange-500',
      'About to Sleep': 'bg-gradient-to-br from-red-400 to-pink-500',
      'At Risk': 'bg-gradient-to-br from-red-500 to-red-600',
      'Cannot Lose Them': 'bg-gradient-to-br from-purple-600 to-indigo-700',
      'Hibernating': 'bg-gradient-to-br from-gray-500 to-slate-600',
      'Lost': 'bg-gradient-to-br from-gray-600 to-gray-700'
    };
    return colors[segment.segment_name as keyof typeof colors] || 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Customer Segmentation</h3>
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Customer Segmentation</h1>
              <p className="text-muted-foreground text-lg">
                Advanced customer behavior analysis and segmentation
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
            <Zap className="h-3 w-3" />
            ML Powered
          </Badge>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={handleExportSegmentation} variant="outline" size="sm" className="gap-2">
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
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Segmentation Configuration</CardTitle>
                <p className="text-muted-foreground">Configure segmentation parameters and analysis settings</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Segmentation Method</label>
              <Select value={segmentationMethod} onValueChange={(value: any) => setSegmentationMethod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rfm">RFM Analysis</SelectItem>
                  <SelectItem value="behavioral">Behavioral Segmentation</SelectItem>
                  <SelectItem value="value_based">Value-Based Segmentation</SelectItem>
                  <SelectItem value="predictive">Predictive Segmentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Segments</label>
              <Select value={numSegments} onValueChange={setNumSegments}>
                <SelectTrigger>
                  <SelectValue placeholder="Select segments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Segments</SelectItem>
                  <SelectItem value="4">4 Segments</SelectItem>
                  <SelectItem value="5">5 Segments</SelectItem>
                  <SelectItem value="6">6 Segments</SelectItem>
                  <SelectItem value="8">8 Segments</SelectItem>
                  <SelectItem value="10">10 Segments</SelectItem>
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
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="180">180 Days</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                  <SelectItem value="730">2 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quality Score</label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className="text-sm font-medium">
                  {segmentationData?.segmentation_quality ? 
                    (segmentationData.segmentation_quality.silhouette_score * 100).toFixed(1) : '85.2'}%
                </div>
                <Badge variant="secondary" className="text-xs">
                  {(segmentationData?.segmentation_quality?.silhouette_score || 0) > 0.7 ? 'Excellent' : 
                   (segmentationData?.segmentation_quality?.silhouette_score || 0) > 0.5 ? 'Good' : 'Fair'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segmentation Overview */}
      {segmentationData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-700">
                  {segmentationData.total_customers.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Segments</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {segmentationData.segments.length}
                </div>
                <p className="text-sm text-muted-foreground">Active Segments</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">Method</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-lg font-bold text-purple-700 capitalize">
                  {segmentationData.segmentation_method.replace('_', ' ')}
                </div>
                <p className="text-sm text-muted-foreground">Segmentation Method</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">Period</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-lg font-bold text-orange-700">
                  {segmentationData.analysis_period.days} Days
                </div>
                <p className="text-sm text-muted-foreground">Analysis Period</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="segments" className="w-full">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="segments" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <PieChart className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Segment Overview</div>
                    <div className="text-xs text-muted-foreground">Customer Segments</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="analysis" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Detailed Analysis</div>
                    <div className="text-xs text-muted-foreground">Segment Characteristics</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="recommendations" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300"
                >
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Recommendations</div>
                    <div className="text-xs text-muted-foreground">Action Items</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Segments Overview Tab */}
            <TabsContent value="segments" className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 to-white">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : segmentationData?.segments ? (
                <div className="space-y-6">
                  {/* Segment Distribution Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Segment Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InteractiveChart 
                        data={segmentationData.segments.map(segment => ({
                          name: segment.segment_name,
                          value: segment.customer_count,
                          percentage: segment.percentage_of_total
                        }))}
                        type="pie"
                        height={400}
                      />
                    </CardContent>
                  </Card>

                  {/* Segment Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segmentationData.segments.map((segment) => (
                      <Card 
                        key={segment.segment_id} 
                        className={cn(
                          "border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer",
                          selectedSegment === segment.segment_id && "ring-2 ring-blue-500"
                        )}
                        onClick={() => setSelectedSegment(segment.segment_id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", getSegmentColor(segment))}>
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex items-center gap-2">
                              {segment.growth_trend === 'up' ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : segment.growth_trend === 'down' ? (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              ) : (
                                <Activity className="h-4 w-4 text-gray-500" />
                              )}
                              <Badge variant="outline" className="text-xs">
                                {segment.percentage_of_total.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="text-lg">{segment.segment_name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Customers</span>
                              <span className="font-semibold">{segment.customer_count.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Avg. Value</span>
                              <span className="font-semibold">${segment.characteristics.avg_transaction_value.toFixed(0)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Lifetime Value</span>
                              <span className="font-semibold">${segment.lifetime_value.toFixed(0)}</span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Churn Risk</span>
                                <span className="text-sm font-medium">
                                  {(segment.characteristics.churn_risk * 100).toFixed(1)}%
                                </span>
                              </div>
                              <Progress 
                                value={segment.characteristics.churn_risk * 100} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No segmentation data available</p>
                </div>
              )}
            </TabsContent>

            {/* Detailed Analysis Tab */}
            <TabsContent value="analysis" className="p-6 space-y-6 bg-gradient-to-br from-indigo-50/30 to-white">
              {segmentationData?.segments && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>RFM Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InteractiveChart 
                        data={segmentationData.segments.map(segment => ({
                          name: segment.segment_name,
                          value: segment.characteristics.avg_monetary,
                          recency: segment.characteristics.avg_recency,
                          frequency: segment.characteristics.avg_frequency,
                          monetary: segment.characteristics.avg_monetary
                        }))}
                        type="scatter"
                        height={300}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Segment Characteristics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InteractiveChart 
                        data={segmentationData.segments.map(segment => ({
                          name: segment.segment_name,
                          value: segment.lifetime_value,
                          retention: segment.characteristics.retention_rate * 100,
                          churn_risk: segment.characteristics.churn_risk * 100,
                          lifetime_value: segment.lifetime_value
                        }))}
                        type="bar"
                        height={300}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="p-6 space-y-6 bg-gradient-to-br from-purple-50/30 to-white">
              {segmentationData && (
                <div className="space-y-6">
                  {/* Global Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Key Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {segmentationData.insights.map((insight, index) => (
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

                  {/* Segment-Specific Recommendations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {segmentationData.segments.map((segment) => (
                      <Card key={segment.segment_id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", getSegmentColor(segment))}>
                              <Users className="h-3 w-3 text-white" />
                            </div>
                            {segment.segment_name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {segment.recommended_actions.map((action, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2" />
                                <span className="text-gray-700">{action}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerSegmentationDashboard;