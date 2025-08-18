import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  Download,
  Phone,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useCustomerAnalysis, useDebtReport, useExportReport } from '../../hooks/useReports';
import CustomerChart from './CustomerChart';
import { formatCurrency, formatNumber, formatPercentage, formatDate, formatPhoneNumber } from '../../utils/formatters';

interface CustomerReportsProps {
  filters: {
    start_date: string;
    end_date: string;
    category_id: string;
  };
}

const CustomerReports: React.FC<CustomerReportsProps> = ({ filters }) => {
  const [minPurchases, setMinPurchases] = useState(1);
  const [minDebt, setMinDebt] = useState(0);
  const [debtSortBy, setDebtSortBy] = useState<'debt_desc' | 'debt_asc' | 'name' | 'last_payment'>('debt_desc');

  // API calls
  const { data: customerAnalysis, isLoading: analysisLoading, error: analysisError } = useCustomerAnalysis({
    start_date: filters.start_date,
    end_date: filters.end_date,
    min_purchases: minPurchases,
  });

  const { data: debtReport, isLoading: debtLoading, error: debtError } = useDebtReport({
    min_debt: minDebt,
    sort_by: debtSortBy,
  });

  const { exportToPDF, exportToCSV } = useExportReport();

  const handleExportCustomerAnalysis = (format: 'pdf' | 'csv') => {
    if (!customerAnalysis) return;
    
    if (format === 'pdf') {
      exportToPDF.mutate({ reportType: 'customer-analysis', data: customerAnalysis });
    } else {
      exportToCSV.mutate({ reportType: 'customer-analysis', data: customerAnalysis });
    }
  };

  const handleExportDebtReport = (format: 'pdf' | 'csv') => {
    if (!debtReport) return;
    
    if (format === 'pdf') {
      exportToPDF.mutate({ reportType: 'debt-report', data: debtReport });
    } else {
      exportToCSV.mutate({ reportType: 'debt-report', data: debtReport });
    }
  };

  if (analysisError || debtError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">خطا در بارگذاری گزارشات مشتریان</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Analysis Summary */}
      {customerAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مشتریان فعال</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(customerAnalysis.summary.total_active_customers)}
              </div>
              <p className="text-xs text-muted-foreground">
                مشتریان با خرید در دوره
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل درآمد</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(customerAnalysis.summary.total_revenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                میانگین: {formatCurrency(customerAnalysis.summary.average_revenue_per_customer)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مشتریان پرارزش</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(customerAnalysis.summary.high_value_customers)}
              </div>
              <p className="text-xs text-muted-foreground">
                مشتریان با خرید بالا
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مشتریان بدهکار</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatNumber(customerAnalysis.summary.customers_with_debt)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(customerAnalysis.summary.debt_percentage)} از کل
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Analysis Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                تحلیل مشتریان
              </CardTitle>
              <CardDescription>
                تحلیل رفتار خرید و بخش‌بندی مشتریان
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select 
                value={minPurchases.toString()} 
                onValueChange={(value) => setMinPurchases(parseInt(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">حداقل ۱ خرید</SelectItem>
                  <SelectItem value="2">حداقل ۲ خرید</SelectItem>
                  <SelectItem value="5">حداقل ۵ خرید</SelectItem>
                  <SelectItem value="10">حداقل ۱۰ خرید</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCustomerAnalysis('pdf')}
                disabled={!customerAnalysis}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCustomerAnalysis('csv')}
                disabled={!customerAnalysis}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analysisLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : customerAnalysis ? (
            <CustomerChart data={customerAnalysis} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Customers Table */}
      {customerAnalysis?.customers.length && (
        <Card>
          <CardHeader>
            <CardTitle>برترین مشتریان</CardTitle>
            <CardDescription>
              مشتریان با بیشترین خرید در دوره انتخاب شده
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>مشتری</TableHead>
                    <TableHead>تلفن</TableHead>
                    <TableHead>خرید دوره</TableHead>
                    <TableHead>تعداد فاکتور</TableHead>
                    <TableHead>میانگین فاکتور</TableHead>
                    <TableHead>بدهی فعلی</TableHead>
                    <TableHead>بخش</TableHead>
                    <TableHead>آخرین خرید</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerAnalysis.customers
                    .sort((a, b) => b.period_purchases - a.period_purchases)
                    .slice(0, 20)
                    .map((customer) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell className="font-medium">{customer.customer_name}</TableCell>
                      <TableCell>
                        {customer.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {formatPhoneNumber(customer.phone)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(customer.period_purchases)}
                      </TableCell>
                      <TableCell>{formatNumber(customer.invoice_count)}</TableCell>
                      <TableCell>{formatCurrency(customer.average_invoice)}</TableCell>
                      <TableCell>
                        {customer.current_debt > 0 ? (
                          <span className="text-red-600 font-medium">
                            {formatCurrency(customer.current_debt)}
                          </span>
                        ) : (
                          <span className="text-green-600">بدون بدهی</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          customer.segment === 'high_value' ? 'default' :
                          customer.segment === 'medium_value' ? 'secondary' : 'outline'
                        }>
                          {customer.segment === 'high_value' ? 'پرارزش' :
                           customer.segment === 'medium_value' ? 'متوسط' : 'کم‌ارزش'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {customer.last_purchase_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(customer.last_purchase_date)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debt Report */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-500" />
                گزارش بدهی مشتریان
              </CardTitle>
              <CardDescription>
                وضعیت بدهی و تاریخچه پرداخت مشتریان
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select 
                value={minDebt.toString()} 
                onValueChange={(value) => setMinDebt(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">همه بدهی‌ها</SelectItem>
                  <SelectItem value="100000">بالای ۱۰۰ هزار</SelectItem>
                  <SelectItem value="500000">بالای ۵۰۰ هزار</SelectItem>
                  <SelectItem value="1000000">بالای ۱ میلیون</SelectItem>
                </SelectContent>
              </Select>
              <Select value={debtSortBy} onValueChange={(value: any) => setDebtSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debt_desc">بدهی نزولی</SelectItem>
                  <SelectItem value="debt_asc">بدهی صعودی</SelectItem>
                  <SelectItem value="name">نام</SelectItem>
                  <SelectItem value="last_payment">آخرین پرداخت</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportDebtReport('pdf')}
                disabled={!debtReport}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportDebtReport('csv')}
                disabled={!debtReport}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {debtLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : debtReport?.customers.length ? (
            <div className="space-y-6">
              {/* Debt Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {formatNumber(debtReport.summary.total_customers_with_debt)}
                  </div>
                  <div className="text-sm text-red-700">مشتریان بدهکار</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(debtReport.summary.total_outstanding_debt)}
                  </div>
                  <div className="text-sm text-orange-700">کل بدهی</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(debtReport.summary.average_debt_per_customer)}
                  </div>
                  <div className="text-sm text-yellow-700">میانگین بدهی</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(debtReport.debt_aging.ninety_days_plus)}
                  </div>
                  <div className="text-sm text-blue-700">بدهی +۹۰ روزه</div>
                </div>
              </div>

              {/* Debt Aging Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">سن‌بندی بدهی</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span>جاری (۰-۳۰ روز)</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(debtReport.debt_aging.current)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                      <span>۳۱-۶۰ روز</span>
                      <span className="font-bold text-yellow-600">
                        {formatCurrency(debtReport.debt_aging.thirty_days)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <span>۶۱-۹۰ روز</span>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(debtReport.debt_aging.sixty_days)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span>بالای ۹۰ روز</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(debtReport.debt_aging.ninety_days_plus)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">آمار کلی بدهی</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>درصد بدهی جاری</span>
                      <span className="font-bold">
                        {formatPercentage((debtReport.debt_aging.current / debtReport.summary.total_outstanding_debt) * 100)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>درصد بدهی معوق</span>
                      <span className="font-bold text-red-600">
                        {formatPercentage(((debtReport.debt_aging.sixty_days + debtReport.debt_aging.ninety_days_plus) / debtReport.summary.total_outstanding_debt) * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Debt Details Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>مشتری</TableHead>
                      <TableHead>تلفن</TableHead>
                      <TableHead>بدهی فعلی</TableHead>
                      <TableHead>کل خریدها</TableHead>
                      <TableHead>آخرین پرداخت</TableHead>
                      <TableHead>روز از آخرین پرداخت</TableHead>
                      <TableHead>امتیاز پرداخت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debtReport.customers.slice(0, 20).map((customer) => (
                      <TableRow key={customer.customer_id}>
                        <TableCell className="font-medium">{customer.customer_name}</TableCell>
                        <TableCell>
                          {customer.phone ? formatPhoneNumber(customer.phone) : '-'}
                        </TableCell>
                        <TableCell className="font-bold text-red-600">
                          {formatCurrency(customer.current_debt)}
                        </TableCell>
                        <TableCell>{formatCurrency(customer.total_lifetime_purchases)}</TableCell>
                        <TableCell>
                          {customer.last_payment_date ? formatDate(customer.last_payment_date) : 'هرگز'}
                        </TableCell>
                        <TableCell>
                          {customer.days_since_last_payment ? (
                            <Badge variant={
                              customer.days_since_last_payment > 90 ? 'destructive' :
                              customer.days_since_last_payment > 60 ? 'secondary' : 'outline'
                            }>
                              {formatNumber(customer.days_since_last_payment)} روز
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            customer.payment_history_score > 80 ? 'default' :
                            customer.payment_history_score > 60 ? 'secondary' : 'destructive'
                          }>
                            {formatPercentage(customer.payment_history_score)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {debtReport.customers.length > 20 && (
                <div className="text-center text-gray-500 text-sm">
                  و {formatNumber(debtReport.customers.length - 20)} مشتری دیگر...
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>مشتری بدهکاری یافت نشد</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerReports;