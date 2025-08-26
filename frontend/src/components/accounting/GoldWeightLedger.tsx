import React, { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { FilterIcon, RefreshCwIcon, ScaleIcon, TrendingUpIcon, TrendingDownIcon, BarChart3Icon, DollarSignIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { LedgerFilters } from '../../types';

export const GoldWeightLedger: React.FC = () => {
  const { useGoldWeightLedger } = useAccounting();
  const [filters, setFilters] = useState<LedgerFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data: goldWeightEntries, isLoading, error, refetch } = useGoldWeightLedger(filters);

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
      purchase: { variant: 'default' as const, label: 'Purchase', icon: TrendingUpIcon },
      sale: { variant: 'destructive' as const, label: 'Sale', icon: TrendingDownIcon },
      adjustment: { variant: 'secondary' as const, label: 'Adjustment', icon: ScaleIcon },
    };

    const typeConfig = config[type as keyof typeof config] || { 
      variant: 'outline' as const, 
      label: type, 
      icon: ScaleIcon 
    };

    const Icon = typeConfig.icon;

    return (
      <Badge variant={typeConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {typeConfig.label}
      </Badge>
    );
  };

  const formatWeight = (grams: number) => {
    return `${grams.toFixed(3)} g`;
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

  // Calculate totals
  const totalPurchases = goldWeightEntries?.filter((entry: any) => 
    entry.transaction_type === 'purchase'
  ).reduce((sum: number, entry: any) => sum + entry.weight_grams, 0) || 0;

  const totalSales = goldWeightEntries?.filter((entry: any) => 
    entry.transaction_type === 'sale'
  ).reduce((sum: number, entry: any) => sum + Math.abs(entry.weight_grams), 0) || 0;

  const netGoldWeight = totalPurchases - totalSales;

  const totalValuation = goldWeightEntries?.reduce((sum: number, entry: any) => 
    sum + (entry.current_valuation || 0), 0) || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading gold weight ledger: {error instanceof Error ? error.message : 'Unknown error'}
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
                  Gold Purchased
                </CardTitle>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Bought
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-emerald-900">
              {formatWeight(totalPurchases)}
            </div>
            <div className="flex items-center gap-2">
              <ScaleIcon className="h-3 w-3 text-emerald-600" />
              <span className="text-xs text-emerald-600">Inventory Added</span>
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
                  Gold Sold
                </CardTitle>
              </div>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                Sold
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-red-900">
              {formatWeight(totalSales)}
            </div>
            <div className="flex items-center gap-2">
              <ScaleIcon className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-600">Inventory Reduced</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-amber-50 to-yellow-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ScaleIcon className="h-5 w-5 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-amber-800">
                  Net Gold Weight
                </CardTitle>
              </div>
              <Badge 
                className={cn(
                  "text-xs",
                  netGoldWeight >= 0 
                    ? "bg-green-100 text-green-700 hover:bg-green-100" 
                    : "bg-red-100 text-red-700 hover:bg-red-100"
                )}
              >
                {netGoldWeight >= 0 ? "Positive" : "Negative"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={cn(
              "text-2xl font-bold",
              netGoldWeight >= 0 ? 'text-green-900' : 'text-red-900'
            )}>
              {formatWeight(netGoldWeight)}
            </div>
            <div className="flex items-center gap-2">
              <ScaleIcon className="h-3 w-3 text-amber-600" />
              <span className="text-xs text-amber-600">Current Stock</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSignIcon className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-blue-800">
                  Total Valuation
                </CardTitle>
              </div>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                Value
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(totalValuation)}
            </div>
            <div className="flex items-center gap-2">
              <DollarSignIcon className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600">Market Value</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Gold Weight Ledger Card */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-amber-50/20 to-white">
        <CardHeader className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-b-2 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg">
                <ScaleIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-amber-800">Gold Weight Ledger</CardTitle>
                <p className="text-sm text-amber-600">Track gold inventory valuation and weight</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline-gradient-amber"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="gradient-amber"
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
          <CardContent className="border-b bg-gradient-to-r from-amber-50/50 to-yellow-50/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-amber-800">Start Date</label>
                <Input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-amber-800">End Date</label>
                <Input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-amber-800">Transaction Type</label>
                <Select
                  value={filters.transaction_type || ''}
                  onValueChange={(value) => handleFilterChange('transaction_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline-gradient-amber" onClick={clearFilters} className="w-full">
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
              Loading gold weight ledger...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Weight (grams)</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Current Valuation</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goldWeightEntries?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No gold weight transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    goldWeightEntries?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {getTransactionTypeBadge(entry.transaction_type)}
                        </TableCell>
                        <TableCell className={`font-medium ${
                          entry.weight_grams >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <div className="flex items-center gap-2">
                            <ScaleIcon className="h-4 w-4" />
                            {entry.weight_grams >= 0 ? '+' : ''}
                            {formatWeight(entry.weight_grams)}
                          </div>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {entry.current_valuation ? formatCurrency(entry.current_valuation) : '-'}
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

      {/* Enhanced Gold Weight Summary Chart */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50/30 to-white">
        <CardHeader className="bg-gradient-to-r from-amber-50/50 to-yellow-50/30 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-md">
              <BarChart3Icon className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-amber-800">Gold Weight Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-100/60 rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <TrendingUpIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-emerald-700 mb-2">
                {goldWeightEntries?.filter((e: any) => e.transaction_type === 'purchase').length || 0}
              </div>
              <div className="text-sm font-medium text-emerald-600">Purchase Transactions</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-rose-100/60 rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <TrendingDownIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-700 mb-2">
                {goldWeightEntries?.filter((e: any) => e.transaction_type === 'sale').length || 0}
              </div>
              <div className="text-sm font-medium text-red-600">Sale Transactions</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100/60 rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <ScaleIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-700 mb-2">
                {goldWeightEntries?.filter((e: any) => e.transaction_type === 'adjustment').length || 0}
              </div>
              <div className="text-sm font-medium text-blue-600">Adjustment Transactions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};