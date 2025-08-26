import React, { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { FilterIcon, RefreshCwIcon, AlertTriangleIcon, PhoneIcon, CalendarIcon, UsersIcon, BarChart3Icon, CheckCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { LedgerFilters } from '../../types';

export const DebtTracking: React.FC = () => {
  const { useDebtTracking } = useAccounting();
  const [filters, setFilters] = useState<LedgerFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data: debtEntries, isLoading, error, refetch } = useDebtTracking(filters);

  const handleFilterChange = (key: keyof LedgerFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getDebtSeverityBadge = (debt: number) => {
    if (debt >= 10000) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangleIcon className="h-3 w-3" />
        Critical
      </Badge>;
    } else if (debt >= 5000) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <AlertTriangleIcon className="h-3 w-3" />
        High
      </Badge>;
    } else if (debt >= 1000) {
      return <Badge variant="outline" className="flex items-center gap-1">
        <AlertTriangleIcon className="h-3 w-3" />
        Medium
      </Badge>;
    } else {
      return <Badge variant="default" className="flex items-center gap-1">
        Low
      </Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getDaysSinceLastPayment = (dateString?: string) => {
    if (!dateString) return null;
    const lastPayment = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastPayment.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate totals
  const totalDebt = debtEntries?.reduce((sum: number, entry: any) => sum + entry.total_debt, 0) || 0;
  const totalCustomers = debtEntries?.length || 0;
  const averageDebt = totalCustomers > 0 ? totalDebt / totalCustomers : 0;
  const criticalDebtCount = debtEntries?.filter((entry: any) => entry.total_debt >= 10000).length || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading debt tracking: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-red-50 to-rose-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-red-800">
                  Total Outstanding Debt
                </CardTitle>
              </div>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                Critical
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(totalDebt)}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-4/5 rounded-full"></div>
              </div>
              <span className="text-xs text-red-600">Risk Level</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UsersIcon className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-blue-800">
                  Customers with Debt
                </CardTitle>
              </div>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                Count
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-blue-900">
              {totalCustomers}
            </div>
            <div className="flex items-center justify-between text-xs text-blue-600">
              <span>Active Cases</span>
              <UsersIcon className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3Icon className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-orange-800">
                  Average Debt
                </CardTitle>
              </div>
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                Average
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(averageDebt)}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-3/5 rounded-full"></div>
              </div>
              <span className="text-xs text-orange-600">Per Customer</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertTriangleIcon className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-purple-800">
                  Critical Cases
                </CardTitle>
              </div>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                High Risk
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-purple-900">
              {criticalDebtCount}
            </div>
            <div className="flex items-center justify-between text-xs text-purple-600">
              <span>≥$10,000</span>
              <AlertTriangleIcon className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Debt Tracking Card */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-orange-50/20 to-white">
        <CardHeader className="bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 border-b-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <AlertTriangleIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-orange-800">Customer Debt Tracking</CardTitle>
                <p className="text-sm text-orange-600">Monitor customer debt and payment history</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline-gradient-orange"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="gradient-orange"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <CardContent className="border-b bg-gradient-to-r from-orange-50/50 to-red-50/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-orange-800">Customer Name</label>
                <Input
                  placeholder="Search by name..."
                  value={filters.customer_name || ''}
                  onChange={(e) => handleFilterChange('customer_name', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-orange-800">Min Debt Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={filters.min_debt || ''}
                  onChange={(e) => handleFilterChange('min_debt', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-orange-800">Max Debt Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="No limit"
                  value={filters.max_debt || ''}
                  onChange={(e) => handleFilterChange('max_debt', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline-gradient-orange" onClick={clearFilters} className="w-full">
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
              Loading debt tracking...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Total Debt</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Total Invoices</TableHead>
                    <TableHead>Payment History</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Days Since Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtEntries?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No customers with outstanding debt found
                      </TableCell>
                    </TableRow>
                  ) : (
                    debtEntries?.map((entry: any) => {
                      const daysSincePayment = getDaysSinceLastPayment(entry.last_payment_date);
                      return (
                        <TableRow key={entry.customer_id}>
                          <TableCell className="font-medium">
                            {entry.customer_name}
                          </TableCell>
                          <TableCell>
                            {entry.customer_phone ? (
                              <div className="flex items-center gap-1 text-sm">
                                <PhoneIcon className="h-3 w-3" />
                                {entry.customer_phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No phone</span>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-red-600">
                            {formatCurrency(entry.total_debt)}
                          </TableCell>
                          <TableCell>
                            {getDebtSeverityBadge(entry.total_debt)}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.total_invoices}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.payment_history_count}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {formatDate(entry.last_purchase_date)}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {formatDate(entry.last_payment_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {daysSincePayment ? (
                              <Badge 
                                variant={daysSincePayment > 30 ? 'destructive' : daysSincePayment > 14 ? 'secondary' : 'outline'}
                              >
                                {daysSincePayment} days
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Debt Summary by Severity */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50/30 to-white">
        <CardHeader className="bg-gradient-to-r from-orange-50/50 to-red-50/30 border-b border-orange-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
              <BarChart3Icon className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-orange-800">Debt Summary by Severity</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-rose-100/60 rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-700 mb-2">
                {debtEntries?.filter((e: any) => e.total_debt >= 10000).length || 0}
              </div>
              <div className="text-sm font-medium text-red-600 mb-1">Critical (≥$10,000)</div>
              <div className="text-xs text-red-500 font-medium">
                {formatCurrency(debtEntries?.filter((e: any) => e.total_debt >= 10000).reduce((sum: number, e: any) => sum + e.total_debt, 0) || 0)}
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-100/60 rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangleIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-700 mb-2">
                {debtEntries?.filter((e: any) => e.total_debt >= 5000 && e.total_debt < 10000).length || 0}
              </div>
              <div className="text-sm font-medium text-orange-600 mb-1">High ($5,000-$9,999)</div>
              <div className="text-xs text-orange-500 font-medium">
                {formatCurrency(debtEntries?.filter((e: any) => e.total_debt >= 5000 && e.total_debt < 10000).reduce((sum: number, e: any) => sum + e.total_debt, 0) || 0)}
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-amber-100/60 rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-yellow-700 mb-2">
                {debtEntries?.filter((e: any) => e.total_debt >= 1000 && e.total_debt < 5000).length || 0}
              </div>
              <div className="text-sm font-medium text-yellow-600 mb-1">Medium ($1,000-$4,999)</div>
              <div className="text-xs text-yellow-500 font-medium">
                {formatCurrency(debtEntries?.filter((e: any) => e.total_debt >= 1000 && e.total_debt < 5000).reduce((sum: number, e: any) => sum + e.total_debt, 0) || 0)}
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100/60 rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-700 mb-2">
                {debtEntries?.filter((e: any) => e.total_debt < 1000).length || 0}
              </div>
              <div className="text-sm font-medium text-green-600 mb-1">Low (&lt;$1,000)</div>
              <div className="text-xs text-green-500 font-medium">
                {formatCurrency(debtEntries?.filter((e: any) => e.total_debt < 1000).reduce((sum: number, e: any) => sum + e.total_debt, 0) || 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};