import React, { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { FilterIcon, RefreshCwIcon, AlertTriangleIcon, PhoneIcon, CalendarIcon } from 'lucide-react';
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
  const totalDebt = debtEntries?.reduce((sum, entry) => sum + entry.total_debt, 0) || 0;
  const totalCustomers = debtEntries?.length || 0;
  const averageDebt = totalCustomers > 0 ? totalDebt / totalCustomers : 0;
  const criticalDebtCount = debtEntries?.filter(entry => entry.total_debt >= 10000).length || 0;

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
      {/* Header with Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Outstanding Debt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDebt)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers with Debt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCustomers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Debt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(averageDebt)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {criticalDebtCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Debt Tracking Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5" />
              Customer Debt Tracking
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
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

        {/* Filters Panel */}
        {showFilters && (
          <CardContent className="border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Customer Name</label>
                <Input
                  placeholder="Search by name..."
                  value={filters.customer_name || ''}
                  onChange={(e) => handleFilterChange('customer_name', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Min Debt Amount</label>
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
                <label className="text-sm font-medium mb-2 block">Max Debt Amount</label>
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
                    debtEntries?.map((entry) => {
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

      {/* Debt Summary by Severity */}
      <Card>
        <CardHeader>
          <CardTitle>Debt Summary by Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600 mb-2">
                {debtEntries?.filter(e => e.total_debt >= 10000).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Critical (≥$10,000)</div>
              <div className="text-xs text-red-600 font-medium">
                {formatCurrency(debtEntries?.filter(e => e.total_debt >= 10000).reduce((sum, e) => sum + e.total_debt, 0) || 0)}
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {debtEntries?.filter(e => e.total_debt >= 5000 && e.total_debt < 10000).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">High ($5,000-$9,999)</div>
              <div className="text-xs text-orange-600 font-medium">
                {formatCurrency(debtEntries?.filter(e => e.total_debt >= 5000 && e.total_debt < 10000).reduce((sum, e) => sum + e.total_debt, 0) || 0)}
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {debtEntries?.filter(e => e.total_debt >= 1000 && e.total_debt < 5000).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Medium ($1,000-$4,999)</div>
              <div className="text-xs text-yellow-600 font-medium">
                {formatCurrency(debtEntries?.filter(e => e.total_debt >= 1000 && e.total_debt < 5000).reduce((sum, e) => sum + e.total_debt, 0) || 0)}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {debtEntries?.filter(e => e.total_debt < 1000).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Low (&lt;$1,000)</div>
              <div className="text-xs text-green-600 font-medium">
                {formatCurrency(debtEntries?.filter(e => e.total_debt < 1000).reduce((sum, e) => sum + e.total_debt, 0) || 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};