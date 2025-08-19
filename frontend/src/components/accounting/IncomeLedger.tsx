import React, { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { FilterIcon, RefreshCwIcon } from 'lucide-react';
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
      {/* Header with Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('accounting.total_revenue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('accounting.outstanding_amount')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalOutstanding)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('accounting.total_invoices')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incomeEntries?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Income Ledger Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('accounting.income_ledger')}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
{t('accounting.filters')}
              </Button>
              <Button
                variant="outline"
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

        {/* Filters Panel */}
        {showFilters && (
          <CardContent className="border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'fa' ? 'تاریخ شروع' : 'Start Date'}
                </label>
                <DatePicker
                  value={startDate}
                  onChange={handleStartDateChange}
                  placeholder={language === 'fa' ? 'انتخاب تاریخ شروع' : 'Select start date'}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
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
                <label className="text-sm font-medium mb-2 block">Payment Status</label>
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
                <Button variant="outline" onClick={clearFilters} className="w-full">
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