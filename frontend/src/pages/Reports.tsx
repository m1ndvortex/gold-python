import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { 
  RefreshCw, 
  Download, 
  FileText, 
  BarChart3, 
  Users, 
  Package,
  TrendingUp,
  Activity,
  Calendar,
  Filter,
  Share,
  PieChart,
  LineChart,
  Eye,
  Target,
  Zap,
  Wrench
} from 'lucide-react';
import { useRefreshReports } from '../hooks/useReports';
import { useToast } from '../components/ui/use-toast';
import { cn } from '../lib/utils';

// Import report components
import SalesReports from '../components/reports/SalesReports';
import InventoryReports from '../components/reports/InventoryReports';
import CustomerReports from '../components/reports/CustomerReports';
import ReportFilters from '../components/reports/ReportFilters';
import ReportBuilderPage from './ReportBuilder';
import AdvancedChartsPage from './AdvancedCharts';
import CacheManagementPage from './CacheManagement';
import StockOptimizationPage from './StockOptimization';
import ForecastingAnalyticsPage from './ForecastingAnalytics';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('sales');
  const [globalFilters, setGlobalFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
  });

  const { refreshAllReports, refreshSalesReports, refreshInventoryReports, refreshCustomerReports } = useRefreshReports();
  const { toast } = useToast();

  const handleRefreshAll = () => {
    refreshAllReports();
    toast({
      title: 'Reports Refreshed',
      description: 'All reports have been updated with the latest data.',
    });
  };

  const handleRefreshTab = () => {
    switch (activeTab) {
      case 'sales':
        refreshSalesReports();
        break;
      case 'inventory':
        refreshInventoryReports();
        break;
      case 'customers':
        refreshCustomerReports();
        break;
    }
    toast({
      title: 'Reports Refreshed',
      description: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} reports have been updated.`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('reports.title')}</h1>
              <p className="text-muted-foreground text-lg">
                {t('reports.comprehensive_insights')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <Activity className="h-3 w-3" />
            {t('reports.live_data')}
          </Badge>
          <Button onClick={handleRefreshTab} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('reports.refresh_current')}
          </Button>
          <Button onClick={handleRefreshAll} variant="outline" size="sm" className="gap-2">
            <Zap className="h-4 w-4" />
            {t('reports.refresh_all')}
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
            <Share className="h-4 w-4" />
            {t('reports.export')}
          </Button>
        </div>
      </div>

      {/* Enhanced Global Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100/80">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">{t('reports.global_filters')}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('reports.global_filters_desc')}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Calendar className="h-3 w-3 mr-1" />
                {t('reports.smart_filtering')}
              </Badge>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white rounded-lg shadow-sm border">
          <ReportFilters
            filters={globalFilters}
            onFiltersChange={setGlobalFilters}
          />
        </CardContent>
      </Card>

      {/* Enhanced Reports Tabs */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Modern Tab Navigation */}
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-indigo-200">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="sales" 
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg transition-all duration-300",
                    "hover:bg-white hover:shadow-sm",
                    "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <LineChart className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{t('reports.sales')}</div>
                    <div className="text-xs text-muted-foreground">{t('reports.sales_analytics_desc')}</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="inventory" 
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg transition-all duration-300",
                    "hover:bg-white hover:shadow-sm",
                    "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{t('reports.inventory')}</div>
                    <div className="text-xs text-muted-foreground">{t('reports.inventory_analytics_desc')}</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="customers" 
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg transition-all duration-300",
                    "hover:bg-white hover:shadow-sm",
                    "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-pink-300"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{t('reports.customers')}</div>
                    <div className="text-xs text-muted-foreground">{t('reports.customer_analytics_desc')}</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content with Enhanced Layout */}
            <TabsContent value="sales" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-indigo-50/30 to-white">
                {/* Tab Header */}
                <div className="flex items-center justify-between pb-4 border-b border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                      <LineChart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{t('reports.sales_analytics')}</h3>
                      <p className="text-sm text-muted-foreground">{t('reports.sales_analytics_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12.5%
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('reports.export_sales_data')}
                    </Button>
                  </div>
                </div>
                <SalesReports filters={globalFilters} />
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50/30 to-white">
                {/* Tab Header */}
                <div className="flex items-center justify-between pb-4 border-b border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{t('reports.inventory_analytics')}</h3>
                      <p className="text-sm text-muted-foreground">{t('reports.inventory_analytics_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <Target className="h-3 w-3 mr-1" />
                      85% {t('reports.efficiency')}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('reports.export_inventory')}
                    </Button>
                  </div>
                </div>
                <InventoryReports filters={globalFilters} />
              </div>
            </TabsContent>

            <TabsContent value="customers" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-pink-50/30 to-white">
                {/* Tab Header */}
                <div className="flex items-center justify-between pb-4 border-b border-pink-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{t('reports.customer_analytics')}</h3>
                      <p className="text-sm text-muted-foreground">{t('reports.customer_analytics_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                      <Activity className="h-3 w-3 mr-1" />
                      92% {t('reports.satisfaction')}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('reports.export_customer_data')}
                    </Button>
                  </div>
                </div>
                <CustomerReports filters={globalFilters} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Advanced Analytics Features Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('reports.advanced_analytics_suite')}</h2>
          <p className="text-muted-foreground">{t('reports.powerful_analytics_tools')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{t('reports.report_builder')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('reports.drag_drop_report_creation')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">{t('reports.drag_drop')}</Badge>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">{t('reports.visual_builder')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('reports.report_builder_desc')}
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                onClick={() => navigate('/reports/builder')}
              >
                <Wrench className="h-4 w-4 mr-2" />
                {t('reports.report_builder')}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{t('reports.advanced_charts')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('reports.interactive_data_visualizations')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-700">{t('reports.interactive')}</Badge>
                <Badge variant="secondary" className="bg-teal-100 text-teal-700">{t('reports.heatmaps')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('reports.advanced_charts_desc')}
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                onClick={() => navigate('/reports/charts')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('reports.advanced_charts')}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{t('reports.forecasting_analytics')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('reports.ai_powered_demand_prediction')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">{t('reports.ai_optimized')}</Badge>
                <Badge variant="secondary" className="bg-violet-100 text-violet-700">{t('reports.predictions_trends')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('reports.forecasting_analytics_description')}
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                onClick={() => navigate('/reports/forecasting')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('reports.forecasting_analytics')}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{t('reports.stock_optimization')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('reports.intelligent_inventory_management')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">{t('reports.optimization_filters')}</Badge>
                <Badge variant="secondary" className="bg-red-100 text-red-700">{t('reports.recommendations')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('reports.stock_optimization_description')}
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                onClick={() => navigate('/reports/stock-optimization')}
              >
                <Package className="h-4 w-4 mr-2" />
                {t('reports.stock_optimization')}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{t('reports.cache_management')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('reports.monitor_manage_analytics_caching')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-cyan-100 text-cyan-700">{t('reports.performance')}</Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">{t('reports.overview')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('reports.cache_management_description')}
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                onClick={() => navigate('/reports/cache-management')}
              >
                <Zap className="h-4 w-4 mr-2" />
                {t('reports.cache_management')}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{t('reports.kpi_dashboard')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('reports.kpi_dashboard_desc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{t('reports.real_time')}</Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700">KPIs</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('reports.kpi_dashboard_desc')}
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                onClick={() => navigate('/dashboard')}
              >
                <Target className="h-4 w-4 mr-2" />
                {t('reports.kpi_dashboard')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Individual route components
const SalesReportsRoute: React.FC = () => {
  const { t } = useLanguage();
  const [globalFilters, setGlobalFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('reports.sales_reports')}</h1>
              <p className="text-muted-foreground text-lg">
                {t('reports.sales_reports_description')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1">
            <Activity className="h-3 w-3" />
            داده‌های زنده
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            بروزرسانی
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
            <Download className="h-4 w-4" />
            خروجی
          </Button>
        </div>
      </div>

      {/* Enhanced Global Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50/80 to-purple-50/80">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">فیلترهای گزارش</CardTitle>
                <CardDescription className="text-muted-foreground">
                  تنظیمات فیلتر برای گزارشات فروش
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                <Calendar className="h-3 w-3 mr-1" />
                فیلتر هوشمند
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white rounded-lg shadow-sm border">
          <ReportFilters
            filters={globalFilters}
            onFiltersChange={setGlobalFilters}
          />
        </CardContent>
      </Card>

      {/* Sales Reports with Enhanced Background */}
      <div className="bg-gradient-to-br from-indigo-50/30 to-white rounded-xl p-6 shadow-sm">
        <SalesReports filters={globalFilters} />
      </div>
    </div>
  );
};

const InventoryReportsRoute: React.FC = () => {
  const { t } = useLanguage();
  const [globalFilters, setGlobalFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 via-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('reports.inventory_reports')}</h1>
              <p className="text-muted-foreground text-lg">
                {t('reports.inventory_reports_description')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <Activity className="h-3 w-3" />
            داده‌های زنده
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            بروزرسانی
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700">
            <Download className="h-4 w-4" />
            خروجی
          </Button>
        </div>
      </div>

      {/* Enhanced Global Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50/80 to-teal-50/80">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">{t('reports.report_filters')}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('reports.inventory_filters_description')}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Calendar className="h-3 w-3 mr-1" />
                فیلتر هوشمند
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white rounded-lg shadow-sm border">
          <ReportFilters
            filters={globalFilters}
            onFiltersChange={setGlobalFilters}
          />
        </CardContent>
      </Card>

      {/* Inventory Reports with Enhanced Background */}
      <div className="bg-gradient-to-br from-green-50/30 to-white rounded-xl p-6 shadow-sm">
        <InventoryReports filters={globalFilters} />
      </div>
    </div>
  );
};

const CustomerReportsRoute: React.FC = () => {
  const { t } = useLanguage();
  const [globalFilters, setGlobalFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('reports.customer_reports')}</h1>
              <p className="text-muted-foreground text-lg">
                {t('reports.customer_reports_description')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
            <Activity className="h-3 w-3" />
            داده‌های زنده
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            بروزرسانی
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
            <Download className="h-4 w-4" />
            خروجی
          </Button>
        </div>
      </div>

      {/* Enhanced Global Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50/80 to-pink-50/80">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">{t('reports.report_filters')}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('reports.customer_filters_description')}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Calendar className="h-3 w-3 mr-1" />
                فیلتر هوشمند
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white rounded-lg shadow-sm border">
          <ReportFilters
            filters={globalFilters}
            onFiltersChange={setGlobalFilters}
          />
        </CardContent>
      </Card>

      {/* Customer Reports with Enhanced Background */}
      <div className="bg-gradient-to-br from-purple-50/30 to-white rounded-xl p-6 shadow-sm">
        <CustomerReports filters={globalFilters} />
      </div>
    </div>
  );
};

// Wrapper component to handle sub-routes
export const ReportsWithRouting: React.FC = () => {
  return (
    <Routes>
      <Route path="/sales" element={<SalesReportsRoute />} />
      <Route path="/inventory" element={<InventoryReportsRoute />} />
      <Route path="/customers" element={<CustomerReportsRoute />} />
      <Route path="/builder" element={<ReportBuilderPage />} />
      <Route path="/charts" element={<AdvancedChartsPage />} />
      <Route path="/forecasting" element={<ForecastingAnalyticsPage />} />
      <Route path="/stock-optimization" element={<StockOptimizationPage />} />
      <Route path="/cache-management" element={<CacheManagementPage />} />
      <Route path="/" element={<Reports />} />
      <Route path="" element={<Reports />} />
    </Routes>
  );
};

export default Reports;