import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RefreshCw, Download, FileText, BarChart3, Users, Package } from 'lucide-react';
import { useRefreshReports } from '../hooks/useReports';
import { useToast } from '../components/ui/use-toast';

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
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">گزارشات و تحلیل‌ها</h1>
          <p className="text-gray-600 mt-2">تحلیل جامع فروش، موجودی و مشتریان</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefreshTab} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            بروزرسانی
          </Button>
          <Button onClick={handleRefreshAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            بروزرسانی همه
          </Button>
        </div>
      </div>

      {/* Global Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            فیلترهای کلی
          </CardTitle>
          <CardDescription>
            فیلترهای اعمال شده به تمام گزارشات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilters
            filters={globalFilters}
            onFiltersChange={setGlobalFilters}
          />
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            گزارشات فروش
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            گزارشات موجودی
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            گزارشات مشتریان
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <SalesReports filters={globalFilters} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <InventoryReports filters={globalFilters} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <CustomerReports filters={globalFilters} />
        </TabsContent>
      </Tabs>
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