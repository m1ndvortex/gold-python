import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useLanguage } from '../hooks/useLanguage';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Activity, 
  TrendingUp,
  Zap,
  Download,
  Maximize,
  Settings,
  Share
} from 'lucide-react';

// Import the advanced chart components
import { InteractiveChart } from '../components/analytics/charts/InteractiveChart';
import { TrendChart } from '../components/analytics/charts/TrendChart';
import { HeatmapChart } from '../components/analytics/charts/HeatmapChart';
import { ChartExportMenu } from '../components/analytics/charts/ChartExportMenu';

const AdvancedChartsPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('interactive');

  // Sample data for charts
  const salesData = [
    { name: 'Jan', value: 4000, sales: 4000, profit: 2400, customers: 240 },
    { name: 'Feb', value: 3000, sales: 3000, profit: 1398, customers: 221 },
    { name: 'Mar', value: 2000, sales: 2000, profit: 9800, customers: 229 },
    { name: 'Apr', value: 2780, sales: 2780, profit: 3908, customers: 200 },
    { name: 'May', value: 1890, sales: 1890, profit: 4800, customers: 218 },
    { name: 'Jun', value: 2390, sales: 2390, profit: 3800, customers: 250 },
  ];

  const profitData = [
    { name: 'Jan', value: 2400, sales: 4000, profit: 2400, customers: 240 },
    { name: 'Feb', value: 1398, sales: 3000, profit: 1398, customers: 221 },
    { name: 'Mar', value: 9800, sales: 2000, profit: 9800, customers: 229 },
    { name: 'Apr', value: 3908, sales: 2780, profit: 3908, customers: 200 },
    { name: 'May', value: 4800, sales: 1890, profit: 4800, customers: 218 },
    { name: 'Jun', value: 3800, sales: 2390, profit: 3800, customers: 250 },
  ];

  const trendData = [
    { timestamp: '2024-01-01', value: 4000, name: 'Jan' },
    { timestamp: '2024-02-01', value: 3000, name: 'Feb' },
    { timestamp: '2024-03-01', value: 2000, name: 'Mar' },
    { timestamp: '2024-04-01', value: 2780, name: 'Apr' },
    { timestamp: '2024-05-01', value: 1890, name: 'May' },
    { timestamp: '2024-06-01', value: 2390, name: 'Jun' },
  ];

  const heatmapData = [
    { x: 'Mon', y: 'Morning', value: 45 },
    { x: 'Mon', y: 'Afternoon', value: 78 },
    { x: 'Mon', y: 'Evening', value: 23 },
    { x: 'Tue', y: 'Morning', value: 67 },
    { x: 'Tue', y: 'Afternoon', value: 89 },
    { x: 'Tue', y: 'Evening', value: 34 },
    { x: 'Wed', y: 'Morning', value: 56 },
    { x: 'Wed', y: 'Afternoon', value: 92 },
    { x: 'Wed', y: 'Evening', value: 41 },
    { x: 'Thu', y: 'Morning', value: 73 },
    { x: 'Thu', y: 'Afternoon', value: 85 },
    { x: 'Thu', y: 'Evening', value: 29 },
    { x: 'Fri', y: 'Morning', value: 81 },
    { x: 'Fri', y: 'Afternoon', value: 95 },
    { x: 'Fri', y: 'Evening', value: 52 },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('reports.advanced_charts')}</h1>
              <p className="text-muted-foreground text-lg">
                {t('reports.interactive_data_visualizations')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <Activity className="h-3 w-3" />
            {t('reports.real_time')}
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            {t('reports.configure')}
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            {t('reports.export_all')}
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700">
            <Share className="h-4 w-4" />
            {t('reports.share')}
          </Button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
                <LineChart className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">{t('reports.interactive')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              {t('reports.interactive_desc')}
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-teal-50 to-teal-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">{t('reports.trend_analysis_title')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              {t('reports.trend_analysis_chart_desc')}
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">{t('reports.heatmaps')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              {t('reports.heatmaps_desc')}
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">{t('reports.export_share_charts')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              {t('reports.export_share_charts_desc')}
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-b-2 border-green-200">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="interactive" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300"
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <LineChart className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Interactive Charts</div>
                    <div className="text-xs text-muted-foreground">Drill-down & Filtering</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="trends" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-teal-300"
                >
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Trend Charts</div>
                    <div className="text-xs text-muted-foreground">Real-time Updates</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="heatmaps" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Heatmap Charts</div>
                    <div className="text-xs text-muted-foreground">Pattern Analysis</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <TabsContent value="interactive" className="p-6 space-y-6 bg-gradient-to-br from-green-50/30 to-white">
              <div className="flex items-center justify-between pb-4 border-b border-green-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <LineChart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Interactive Charts</h3>
                    <p className="text-sm text-muted-foreground">Charts with drill-down, zoom, and filtering capabilities</p>
                  </div>
                </div>
                <ChartExportMenu chartId="interactive-chart" chartElement={null} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Sales Performance
                    </CardTitle>
                    <CardDescription>Interactive sales data with drill-down capabilities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractiveChart 
                      data={salesData}
                      type="line"
                      title="Monthly Sales"
                      height={300}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Profit Analysis
                    </CardTitle>
                    <CardDescription>Interactive profit trends with filtering</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractiveChart 
                      data={profitData}
                      type="bar"
                      title="Monthly Profit"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="p-6 space-y-6 bg-gradient-to-br from-teal-50/30 to-white">
              <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Trend Analysis</h3>
                    <p className="text-sm text-muted-foreground">Real-time trend detection and forecasting</p>
                  </div>
                </div>
                <ChartExportMenu chartId="trend-chart" chartElement={null} />
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Sales Trend Analysis
                    </CardTitle>
                    <CardDescription>Real-time trend analysis with forecasting</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TrendChart 
                      data={trendData}
                      title="Sales Trend with Forecast"
                      height={400}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="heatmaps" className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 to-white">
              <div className="flex items-center justify-between pb-4 border-b border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Heatmap Analysis</h3>
                    <p className="text-sm text-muted-foreground">Pattern visualization and correlation analysis</p>
                  </div>
                </div>
                <ChartExportMenu chartId="heatmap-chart" chartElement={null} />
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Sales Activity Heatmap
                    </CardTitle>
                    <CardDescription>Sales activity patterns by day and time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HeatmapChart 
                      data={heatmapData}
                      title="Sales Activity by Time"
                      height={400}
                      xAxisLabel="Day of Week"
                      yAxisLabel="Time of Day"
                      valueLabel="Sales Activity"
                    />
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

export default AdvancedChartsPage;