import React, { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { FilterIcon, RefreshCwIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { format } from 'date-fns';
import { LedgerFilters } from '../../types';

export const CashBankLedger: React.FC = () => {
  const { useCashBankLedger } = useAccounting();
  const [filters, setFilters] = useState<LedgerFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data: cashBankEntries, isLoading, error, refetch } = useCashBankLedger(filters);

  const handleFilterChange = (key: keyof LedgerFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getTransactionTypeBadge = (type: string) => {
    const config = {
      cash_in: { variant: 'default' as const, label: 'Cash In', icon: TrendingUpIcon },
      cash_out: { variant: 'destructive' as const, label: 'Cash Out', icon: TrendingDownIcon },
      bank_deposit: { variant: 'default' as const, label: 'Bank Deposit', icon: TrendingUpIcon },
      bank_withdrawal: { variant: 'destructive' as const, label: 'Bank Withdrawal', icon: TrendingDownIcon },
    };

    const typeConfig = config[type as keyof typeof config] || { 
      variant: 'outline' as const, 
      label: type, 
      icon: TrendingUpIcon 
    };

    const Icon = typeConfig.icon;

    return (
      <Badge variant={typeConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {typeConfig.label}
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

  const formatPaymentMethod = (method: string) => {
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate totals
  const cashInTotal = cashBankEntries?.filter(entry => 
    entry.transaction_type === 'cash_in' || entry.transaction_type === 'bank_deposit'
  ).reduce((sum, entry) => sum + entry.amount, 0) || 0;

  const cashOutTotal = cashBankEntries?.filter(entry => 
    entry.transaction_type === 'cash_out' || entry.transaction_type === 'bank_withdrawal'
  ).reduce((sum, entry) => sum + entry.amount, 0) || 0;

  const netCashFlow = cashInTotal - cashOutTotal;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading cash & bank ledger: {error instanceof Error ? error.message : 'Unknown error'}
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
              Cash Inflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(cashInTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash Outflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(cashOutTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netCashFlow)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cashBankEntries?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Cash & Bank Ledger Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cash & Bank Ledger</CardTitle>
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
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Transaction Type</label>
                <Select
                  value={filters.transaction_type || ''}
                  onValueChange={(value) => handleFilterChange('transaction_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="cash_in">Cash In</SelectItem>
                    <SelectItem value="cash_out">Cash Out</SelectItem>
                    <SelectItem value="bank_deposit">Bank Deposit</SelectItem>
                    <SelectItem value="bank_withdrawal">Bank Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                <Select
                  value={filters.payment_method || ''}
                  onValueChange={(value) => handleFilterChange('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        )}

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCwIcon className="h-6 w-6 animate-spin mr-2" />
              Loading cash & bank ledger...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashBankEntries?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No cash & bank transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    cashBankEntries?.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {getTransactionTypeBadge(entry.transaction_type)}
                        </TableCell>
                        <TableCell className={`font-medium ${
                          entry.transaction_type === 'cash_in' || entry.transaction_type === 'bank_deposit'
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {entry.transaction_type === 'cash_in' || entry.transaction_type === 'bank_deposit' ? '+' : '-'}
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {formatPaymentMethod(entry.payment_method)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.reference_type ? (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {entry.reference_type}
                            </span>
                          ) : '-'}
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