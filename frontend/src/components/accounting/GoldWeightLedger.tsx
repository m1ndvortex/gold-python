import React, { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { FilterIcon, RefreshCwIcon, ScaleIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
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
  const totalPurchases = goldWeightEntries?.filter(entry => 
    entry.transaction_type === 'purchase'
  ).reduce((sum, entry) => sum + entry.weight_grams, 0) || 0;

  const totalSales = goldWeightEntries?.filter(entry => 
    entry.transaction_type === 'sale'
  ).reduce((sum, entry) => sum + Math.abs(entry.weight_grams), 0) || 0;

  const netGoldWeight = totalPurchases - totalSales;

  const totalValuation = goldWeightEntries?.reduce((sum, entry) => 
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
      {/* Header with Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gold Purchased
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatWeight(totalPurchases)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gold Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatWeight(totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Gold Weight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netGoldWeight >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatWeight(netGoldWeight)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Valuation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalValuation)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Gold Weight Ledger Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ScaleIcon className="h-5 w-5" />
              Gold Weight Ledger
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
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
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
                    goldWeightEntries?.map((entry) => (
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

      {/* Gold Weight Summary Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gold Weight Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {goldWeightEntries?.filter(e => e.transaction_type === 'purchase').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Purchase Transactions</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-2">
                {goldWeightEntries?.filter(e => e.transaction_type === 'sale').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Sale Transactions</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {goldWeightEntries?.filter(e => e.transaction_type === 'adjustment').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Adjustment Transactions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};