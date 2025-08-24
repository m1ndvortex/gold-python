import React, { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { FilterIcon, RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, CreditCardIcon, Wallet, BarChart3Icon, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
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
      {/* Enhanced Header with Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUpIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-emerald-800">
                  Cash Inflow
                </CardTitle>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Inflow
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-emerald-900">
              {formatCurrency(cashInTotal)}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-emerald-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-4/5 rounded-full"></div>
              </div>
              <span className="text-xs text-emerald-600">Target</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-red-50 to-rose-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingDownIcon className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-red-800">
                  Cash Outflow
                </CardTitle>
              </div>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                Outflow
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(cashOutTotal)}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-3/5 rounded-full"></div>
              </div>
              <span className="text-xs text-red-600">Budget</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-blue-800">
                  Net Cash Flow
                </CardTitle>
              </div>
              <Badge 
                className={cn(
                  "text-xs",
                  netCashFlow >= 0 
                    ? "bg-green-100 text-green-700 hover:bg-green-100" 
                    : "bg-red-100 text-red-700 hover:bg-red-100"
                )}
              >
                {netCashFlow >= 0 ? "Positive" : "Negative"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={cn(
              "text-2xl font-bold",
              netCashFlow >= 0 ? 'text-green-900' : 'text-red-900'
            )}>
              {formatCurrency(netCashFlow)}
            </div>
            <div className="flex items-center justify-between text-xs text-blue-600">
              <span>Net Flow</span>
              <Activity className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3Icon className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-purple-800">
                  Total Transactions
                </CardTitle>
              </div>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                Count
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-purple-900">
              {cashBankEntries?.length || 0}
            </div>
            <div className="flex items-center justify-between text-xs text-purple-600">
              <span>This Period</span>
              <Activity className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Cash & Bank Ledger Card */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-blue-50/20 to-white">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <CreditCardIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-blue-800">Cash & Bank Ledger</CardTitle>
                <p className="text-sm text-blue-600">Monitor cash flow and bank transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline-gradient-blue"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="gradient-blue"
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
          <CardContent className="border-b bg-gradient-to-r from-blue-50/50 to-cyan-50/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-blue-800">Start Date</label>
                <Input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-blue-800">End Date</label>
                <Input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-blue-800">Transaction Type</label>
                <Select
                  value={filters.transaction_type || 'all'}
                  onValueChange={(value) => handleFilterChange('transaction_type', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="cash_in">Cash In</SelectItem>
                    <SelectItem value="cash_out">Cash Out</SelectItem>
                    <SelectItem value="bank_deposit">Bank Deposit</SelectItem>
                    <SelectItem value="bank_withdrawal">Bank Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-blue-800">Payment Method</label>
                <Select
                  value={filters.payment_method || 'all'}
                  onValueChange={(value) => handleFilterChange('payment_method', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline-gradient-blue" onClick={clearFilters}>
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