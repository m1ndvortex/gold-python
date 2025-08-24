import React, { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { FilterIcon, RefreshCwIcon, TrendingUpIcon, AlertTriangleIcon, BarChart3Icon, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { LedgerFilters } from '../../types';
import DatePicker from '../ui/date-picker';
import { JalaliUtils } from '../../utils/jalali';

export const IncomeLedger: React.FC = () => {
  const { t, language } = useLanguage();
  const { useIncomeLedger } = useAccounting();
  const [filters, setFilters] = useState<LedgerFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const { data: incomeEntries, isLoading, error, refetch } = useIncomeLedger(filters);

  const handleFilterChange = (key: keyof LedgerFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    const dateString = date ? date.toISOString().split('T')[0] : '';
    handleFilterChange('start_date', dateString);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    const dateString = date ? date.toISOString().split('T')[0] : '';
    handleFilterChange('end_date', dateString);
  };

  const clearFilters = () => {
    setFilters({});
    setStartDate(null);
    setEndDate(null);
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      partial: 'secondary',
      unpaid: 'destructive'
    } as const;

    const labels = {
      paid: t('accounting.paid'),
      partial: t('accounting.partial'),
      unpaid: t('accounting.unpaid')
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const totalRevenue = incomeEntries?.reduce((sum, entry) => sum + entry.paid_amount, 0) || 0;
  const totalOutstanding = incomeEntries?.reduce((sum, entry) => sum + entry.remaining_amount, 0) || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading income ledger: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUpIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-emerald-800">
                  {t('accounting.total_revenue')}
                </CardTitle>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Revenue
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-emerald-900">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-emerald-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-4/5 rounded-full"></div>
              </div>
              <span className="text-xs text-emerald-600">Target</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertTriangleIcon className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-orange-800">
                  {t('accounting.outstanding_amount')}
                </CardTitle>
              </div>
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-3/5 rounded-full"></div>
              </div>
              <span className="text-xs text-orange-600">Collection</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3Icon className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-blue-800">
                  {t('accounting.total_invoices')}
                </CardTitle>
              </div>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                Count
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-blue-900">
              {incomeEntries?.length || 0}
            </div>
            <div className="flex items-center justify-between text-xs text-blue-600">
              <span>This Period</span>
              <Activity className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Income Ledger Card */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-green-50/20 to-white">
        <CardHeader className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-b-2 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                <TrendingUpIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-green-800">{t('accounting.income_ledger')}</CardTitle>
                <p className="text-sm text-green-600">Track all revenue and payment transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline-gradient-green"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                {t('accounting.filters')}
              </Button>
              <Button
                variant="gradient-green"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {t('accounting.refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <CardContent className="border-b bg-gradient-to-r from-green-50/50 to-teal-50/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-green-800">
                  {language === 'fa' ? 'تاریخ شروع' : 'Start Date'}
                </label>
                <DatePicker
                  value={startDate}
                  onChange={handleStartDateChange}
                  placeholder={language === 'fa' ? 'انتخاب تاریخ شروع' : 'Select start date'}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-green-800">
                  {language === 'fa' ? 'تاریخ پایان' : 'End Date'}
                </label>
                <DatePicker
                  value={endDate}
                  onChange={handleEndDateChange}
                  placeholder={language === 'fa' ? 'انتخاب تاریخ پایان' : 'Select end date'}
                  minDate={startDate || undefined}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-green-800">Payment Status</label>
                <Select
                  value={filters.payment_status || ''}
                  onValueChange={(value) => handleFilterChange('payment_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline-gradient-green" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCwIcon className="h-6 w-6 animate-spin mr-2" />
{t('accounting.loading_income')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('accounting.invoice_number')}</TableHead>
                    <TableHead>{t('accounting.customer')}</TableHead>
                    <TableHead>{t('accounting.total_amount')}</TableHead>
                    <TableHead>{t('accounting.paid_amount')}</TableHead>
                    <TableHead>{t('accounting.remaining')}</TableHead>
                    <TableHead>{t('accounting.status')}</TableHead>
                    <TableHead>{t('accounting.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeEntries?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
{t('accounting.no_income_entries')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomeEntries?.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.invoice_number}
                        </TableCell>
                        <TableCell>{entry.customer_name}</TableCell>
                        <TableCell>{formatCurrency(entry.total_amount)}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(entry.paid_amount)}
                        </TableCell>
                        <TableCell className={entry.remaining_amount > 0 ? 'text-orange-600' : ''}>
                          {formatCurrency(entry.remaining_amount)}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(entry.payment_status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(entry.transaction_date)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};