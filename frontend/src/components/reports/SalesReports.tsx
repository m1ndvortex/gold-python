import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Download,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useSalesTrends, useTopProducts, useSalesOverviewChart, useExportReport } from '../../hooks/useReports';
import SalesChart from './SalesChart';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface SalesReportsProps {
  filters: {
    start_date: string;
    end_date: string;
    category_id: string;
  };
}

const SalesReports: React.FC<SalesReportsProps> = ({ filters }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [topProductsLimit, setTopProductsLimit] = useState(10);

  // API calls
  const { data: salesTrends, isLoading: trendsLoading, error: trendsError } = useSalesTrends({
    ...filters,
    period,
  });

  const { data: topProducts, isLoading: productsLoading, error: productsError } = useTopProducts({
    start_date: filters.start_date,
    end_date: filters.end_date,
    limit: topProductsLimit,
  });

  const { data: chartData, isLoading: chartLoading } = useSalesOverviewChart({
    days: 30,
  });

  const { exportToPDF, exportToCSV } = useExportReport();

  const handleExportSalesTrends = (format: 'pdf' | 'csv') => {
    if (!salesTrends) return;
    
    if (format === 'pdf') {
      exportToPDF.mutate({ reportType: 'sales-trends', data: salesTrends });
    } else {
      exportToCSV.mutate({ reportType: 'sales-trends', data: salesTrends });
    }
  };

  const handleExportTopProducts = (format: 'pdf' | 'csv') => {
    if (!topProducts) return;
    
    if (format === 'pdf') {
      exportToPDF.mutate({ reportType: 'top-products', data: topProducts });
    } else {
      exportToCSV.mutate({ reportType: 'top-products', data: topProducts });
    }
  };

  if (trendsError || productsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">خطا در بارگذاری گزارشات فروش</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sales Overview Summary */}
      {salesTrends && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل فروش</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(salesTrends.summary.total_sales)}
              </div>
              <p className="text-xs text-muted-foreground">
                میانگین روزانه: {formatCurrency(salesTrends.summary.average_daily_sales)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مبلغ دریافتی</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(salesTrends.summary.total_paid)}
              </div>
              <p className="text-xs text-muted-foreground">
                درصد پرداخت: {((salesTrends.summary.total_paid / salesTrends.summary.total_sales) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مانده بدهی</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(salesTrends.summary.total_outstanding)}
              </div>
              <p className="text-xs text-muted-foreground">
                درصد بدهی: {((salesTrends.summary.total_outstanding / salesTrends.summary.total_sales) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تعداد اقلام فروخته شده</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(salesTrends.summary.total_items_sold)}
              </div>
              <p className="text-xs text-muted-foreground">
                کل اقلام فروخته شده
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                روند فروش
              </CardTitle>
              <CardDescription>
                تحلیل روند فروش در بازه زمانی انتخاب شده
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">روزانه</SelectItem>
                  <SelectItem value="weekly">هفتگی</SelectItem>
                  <SelectItem value="monthly">ماهانه</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportSalesTrends('pdf')}
                disabled={!salesTrends}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportSalesTrends('csv')}
                disabled={!salesTrends}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : salesTrends ? (
            <SalesChart data={salesTrends} period={period} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Quantity */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>پرفروش‌ترین محصولات (تعداد)</CardTitle>
                <CardDescription>
                  محصولات با بیشترین تعداد فروش
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select 
                  value={topProductsLimit.toString()} 
                  onValueChange={(value) => setTopProductsLimit(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">۵</SelectItem>
                    <SelectItem value="10">۱۰</SelectItem>
                    <SelectItem value="20">۲۰</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportTopProducts('pdf')}
                  disabled={!topProducts}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : topProducts?.top_by_quantity.length ? (
              <div className="space-y-3">
                {topProducts.top_by_quantity.map((product, index) => (
                  <div key={product.item_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{product.item_name}</p>
                        <p className="text-sm text-gray-600">{product.category_name}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{formatNumber(product.total_quantity)} عدد</p>
                      <p className="text-sm text-gray-600">{formatCurrency(product.total_revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                داده‌ای برای نمایش وجود ندارد
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products by Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>پرفروش‌ترین محصولات (درآمد)</CardTitle>
            <CardDescription>
              محصولات با بیشترین درآمد
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : topProducts?.top_by_revenue.length ? (
              <div className="space-y-3">
                {topProducts.top_by_revenue.map((product, index) => (
                  <div key={product.item_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{product.item_name}</p>
                        <p className="text-sm text-gray-600">{product.category_name}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{formatCurrency(product.total_revenue)}</p>
                      <p className="text-sm text-gray-600">{formatNumber(product.total_quantity)} عدد</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                داده‌ای برای نمایش وجود ندارد
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesReports;