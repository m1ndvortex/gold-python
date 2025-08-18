import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Download,
  Scale,
  BarChart3
} from 'lucide-react';
import { useInventoryValuation, useLowStockReport, useExportReport } from '../../hooks/useReports';
import InventoryChart from './InventoryChart';
import { formatCurrency, formatNumber, formatWeight, formatPercentage } from '../../utils/formatters';

interface InventoryReportsProps {
  filters: {
    start_date: string;
    end_date: string;
    category_id: string;
  };
}

const InventoryReports: React.FC<InventoryReportsProps> = ({ filters }) => {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [thresholdMultiplier, setThresholdMultiplier] = useState(1.0);

  // API calls
  const { data: valuationData, isLoading: valuationLoading, error: valuationError } = useInventoryValuation({
    category_id: filters.category_id,
    include_inactive: includeInactive,
  });

  const { data: lowStockData, isLoading: lowStockLoading, error: lowStockError } = useLowStockReport({
    category_id: filters.category_id,
    threshold_multiplier: thresholdMultiplier,
  });

  const { exportToPDF, exportToCSV } = useExportReport();

  const handleExportValuation = (format: 'pdf' | 'csv') => {
    if (!valuationData) return;
    
    if (format === 'pdf') {
      exportToPDF.mutate({ reportType: 'inventory-valuation', data: valuationData });
    } else {
      exportToCSV.mutate({ reportType: 'inventory-valuation', data: valuationData });
    }
  };

  const handleExportLowStock = (format: 'pdf' | 'csv') => {
    if (!lowStockData) return;
    
    if (format === 'pdf') {
      exportToPDF.mutate({ reportType: 'low-stock', data: lowStockData });
    } else {
      exportToCSV.mutate({ reportType: 'low-stock', data: lowStockData });
    }
  };

  if (valuationError || lowStockError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">خطا در بارگذاری گزارشات موجودی</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory Valuation Summary */}
      {valuationData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ارزش خرید کل</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(valuationData.summary.total_purchase_value)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(valuationData.summary.unique_products)} محصول منحصر به فرد
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ارزش فروش کل</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(valuationData.summary.total_sell_value)}
              </div>
              <p className="text-xs text-muted-foreground">
                حاشیه سود: {formatPercentage(valuationData.summary.overall_profit_margin)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">سود بالقوه</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(valuationData.summary.total_potential_profit)}
              </div>
              <p className="text-xs text-muted-foreground">
                در صورت فروش کل موجودی
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">وزن کل</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatWeight(valuationData.summary.total_weight_grams)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(valuationData.summary.total_items)} قطعه کل
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Valuation Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                تحلیل ارزش موجودی
              </CardTitle>
              <CardDescription>
                ارزش موجودی بر اساس دسته‌بندی و وضعیت سود
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select 
                value={includeInactive.toString()} 
                onValueChange={(value) => setIncludeInactive(value === 'true')}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">فقط فعال</SelectItem>
                  <SelectItem value="true">شامل غیرفعال</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportValuation('pdf')}
                disabled={!valuationData}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportValuation('csv')}
                disabled={!valuationData}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {valuationLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : valuationData ? (
            <InventoryChart data={valuationData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                هشدار موجودی کم
              </CardTitle>
              <CardDescription>
                محصولاتی که موجودی آن‌ها کمتر از حد مجاز است
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select 
                value={thresholdMultiplier.toString()} 
                onValueChange={(value) => setThresholdMultiplier(parseFloat(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">۰.۵x آستانه</SelectItem>
                  <SelectItem value="1.0">۱x آستانه</SelectItem>
                  <SelectItem value="1.5">۱.۵x آستانه</SelectItem>
                  <SelectItem value="2.0">۲x آستانه</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportLowStock('pdf')}
                disabled={!lowStockData}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportLowStock('csv')}
                disabled={!lowStockData}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {lowStockLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : lowStockData?.items.length ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {formatNumber(lowStockData.summary.critical_items)}
                  </div>
                  <div className="text-sm text-red-700">موجودی صفر</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatNumber(lowStockData.summary.warning_items)}
                  </div>
                  <div className="text-sm text-orange-700">موجودی کم</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatNumber(lowStockData.summary.total_low_stock_items)}
                  </div>
                  <div className="text-sm text-yellow-700">کل اقلام</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(lowStockData.summary.total_potential_lost_sales)}
                  </div>
                  <div className="text-sm text-purple-700">فروش از دست رفته</div>
                </div>
              </div>

              {/* Low Stock Items Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>محصول</TableHead>
                      <TableHead>دسته‌بندی</TableHead>
                      <TableHead>موجودی فعلی</TableHead>
                      <TableHead>حداقل موجودی</TableHead>
                      <TableHead>کمبود</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>فروش از دست رفته</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockData.items.slice(0, 20).map((item) => (
                      <TableRow key={item.item_id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.category_name}</TableCell>
                        <TableCell>
                          <span className={item.current_stock === 0 ? 'text-red-600 font-bold' : 'text-orange-600'}>
                            {formatNumber(item.current_stock)}
                          </span>
                        </TableCell>
                        <TableCell>{formatNumber(item.min_stock_level)}</TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {formatNumber(item.shortage)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'critical' ? 'destructive' : 'secondary'}>
                            {item.status === 'critical' ? 'بحرانی' : 'هشدار'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-purple-600 font-medium">
                          {formatCurrency(item.potential_lost_sales)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {lowStockData.items.length > 20 && (
                <div className="text-center text-gray-500 text-sm">
                  و {formatNumber(lowStockData.items.length - 20)} مورد دیگر...
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>همه محصولات موجودی کافی دارند</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown Table */}
      {valuationData?.category_breakdown.length && (
        <Card>
          <CardHeader>
            <CardTitle>تفکیک ارزش بر اساس دسته‌بندی</CardTitle>
            <CardDescription>
              ارزش موجودی و سود بالقوه هر دسته‌بندی
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>دسته‌بندی</TableHead>
                    <TableHead>ارزش خرید</TableHead>
                    <TableHead>ارزش فروش</TableHead>
                    <TableHead>سود بالقوه</TableHead>
                    <TableHead>حاشیه سود</TableHead>
                    <TableHead>وزن</TableHead>
                    <TableHead>تعداد اقلام</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuationData.category_breakdown
                    .sort((a, b) => b.sell_value - a.sell_value)
                    .map((category) => (
                    <TableRow key={category.category_name}>
                      <TableCell className="font-medium">{category.category_name}</TableCell>
                      <TableCell>{formatCurrency(category.purchase_value)}</TableCell>
                      <TableCell>{formatCurrency(category.sell_value)}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(category.potential_profit)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.profit_margin > 20 ? 'default' : 'secondary'}>
                          {formatPercentage(category.profit_margin)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatWeight(category.weight_grams)}</TableCell>
                      <TableCell>{formatNumber(category.item_count)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryReports;