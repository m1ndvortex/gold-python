import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
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
  Zap
} from 'lucide-react';
import { useRefreshReports } from '../hooks/useReports';
import { useToast } from '../components/ui/use-toast';
import { cn } from '../lib/utils';

// Import report components
import SalesReports from '../components/reports/SalesReports';
import InventoryReports from '../components/reports/InventoryReports';
import CustomerReports from '../components/reports/CustomerReports';
import ReportFilters from '../components/reports/ReportFilters';

const Reports: React.FC = () => {
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
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
              <p className="text-muted-foreground text-lg">
                Comprehensive insights into sales, inventory, and customer performance
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <Activity className="h-3 w-3" />
            Live Data
          </Badge>
          <Button onClick={handleRefreshTab} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Current
          </Button>
          <Button onClick={handleRefreshAll} variant="outline" size="sm" className="gap-2">
            <Zap className="h-4 w-4" />
            Refresh All
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
            <Share className="h-4 w-4" />
            Export
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
                <CardTitle className="text-xl font-semibold text-foreground">Global Filters</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Configure filters applied across all report sections
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Calendar className="h-3 w-3 mr-1" />
                Smart Filtering
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
                    <div className="font-medium text-sm">Sales Reports</div>
                    <div className="text-xs text-muted-foreground">Revenue & Performance</div>
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
                    <div className="font-medium text-sm">Inventory Reports</div>
                    <div className="text-xs text-muted-foreground">Stock & Valuation</div>
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
                    <div className="font-medium text-sm">Customer Reports</div>
                    <div className="text-xs text-muted-foreground">Behavior & Analytics</div>
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
                      <h3 className="text-xl font-semibold text-foreground">Sales Analytics</h3>
                      <p className="text-sm text-muted-foreground">Track revenue trends and sales performance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12.5%
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Sales Data
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
                      <h3 className="text-xl font-semibold text-foreground">Inventory Analytics</h3>
                      <p className="text-sm text-muted-foreground">Monitor stock levels and inventory valuation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <Target className="h-3 w-3 mr-1" />
                      85% Efficiency
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Inventory
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
                      <h3 className="text-xl font-semibold text-foreground">Customer Analytics</h3>
                      <p className="text-sm text-muted-foreground">Analyze customer behavior and engagement</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                      <Activity className="h-3 w-3 mr-1" />
                      92% Satisfaction
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Customer Data
                    </Button>
                  </div>
                </div>
                <CustomerReports filters={globalFilters} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Individual route components
const SalesReportsRoute: React.FC = () => {
  const [globalFilters, setGlobalFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
  });

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">گزارشات فروش</h1>
          <p className="text-muted-foreground">تحلیل و بررسی فروش محصولات</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            فیلترهای گزارش
          </CardTitle>
          <CardDescription>
            فیلترهای اعمال شده به گزارشات فروش
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilters
            filters={globalFilters}
            onFiltersChange={setGlobalFilters}
          />
        </CardContent>
      </Card>

      <SalesReports filters={globalFilters} />
    </div>
  );
};

const InventoryReportsRoute: React.FC = () => {
  const [globalFilters, setGlobalFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
  });

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">گزارشات موجودی</h1>
          <p className="text-muted-foreground">تحلیل و بررسی موجودی انبار</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            فیلترهای گزارش
          </CardTitle>
          <CardDescription>
            فیلترهای اعمال شده به گزارشات موجودی
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilters
            filters={globalFilters}
            onFiltersChange={setGlobalFilters}
          />
        </CardContent>
      </Card>

      <InventoryReports filters={globalFilters} />
    </div>
  );
};

const CustomerReportsRoute: React.FC = () => {
  const [globalFilters, setGlobalFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
  });

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">گزارشات مشتریان</h1>
          <p className="text-muted-foreground">تحلیل و بررسی رفتار مشتریان</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            فیلترهای گزارش
          </CardTitle>
          <CardDescription>
            فیلترهای اعمال شده به گزارشات مشتریان
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilters
            filters={globalFilters}
            onFiltersChange={setGlobalFilters}
          />
        </CardContent>
      </Card>

      <CustomerReports filters={globalFilters} />
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
      <Route path="/*" element={<Reports />} />
    </Routes>
  );
};

export default Reports;