import React, { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DatePicker from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { PlusIcon, FilterIcon, RefreshCwIcon, TrendingDownIcon, BarChart3Icon, Activity, TagIcon } from 'lucide-react';
import { format } from 'date-fns';
import { LedgerFilters, ExpenseEntryCreate } from '../../types';
import { useToast } from '../ui/use-toast';
import { Badge } from '../ui/badge';

export const ExpenseLedger: React.FC = () => {
  const { t } = useLanguage();
  const { useExpenseLedger, useCreateExpenseEntry } = useAccounting();
  const { toast } = useToast();
  const [filters, setFilters] = useState<LedgerFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newExpense, setNewExpense] = useState<ExpenseEntryCreate>({
    category: '',
    amount: 0,
    description: '',
  });

  const { data: expenseEntries, isLoading, error, refetch } = useExpenseLedger(filters);
  const createExpenseMutation = useCreateExpenseEntry();

  const expenseCategories = [
    'inventory_purchase',
    'labor_costs',
    'store_rent',
    'utilities',
    'marketing',
    'equipment',
    'supplies',
    'taxes',
    'insurance',
    'maintenance',
    'other'
  ];

  const handleFilterChange = (key: keyof LedgerFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.description || newExpense.amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createExpenseMutation.mutateAsync(newExpense);
      toast({
        title: "Success",
        description: "Expense entry created successfully.",
      });
      setShowAddDialog(false);
      setNewExpense({
        category: '',
        amount: 0,
        description: '',
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create expense entry. Please try again.",
        variant: "destructive",
      });
    }
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

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const totalExpenses = expenseEntries?.reduce((sum: number, entry: any) => sum + entry.amount, 0) || 0;

  // Group expenses by category for summary
  const expensesByCategory = expenseEntries?.reduce((acc: any, entry: any) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
    return acc;
  }, {} as Record<string, number>) || {};

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading expense ledger: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-red-50 to-rose-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingDownIcon className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-red-800">
                  {t('accounting.total_expenses')}
                </CardTitle>
              </div>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                Expenses
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(totalExpenses)}
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
                  <BarChart3Icon className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-blue-800">
                  {t('accounting.total_entries')}
                </CardTitle>
              </div>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                Count
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-blue-900">
              {expenseEntries?.length || 0}
            </div>
            <div className="flex items-center justify-between text-xs text-blue-600">
              <span>This Period</span>
              <Activity className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TagIcon className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-purple-800">
                  {t('accounting.categories')}
                </CardTitle>
              </div>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                Types
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-purple-900">
              {Object.keys(expensesByCategory).length}
            </div>
            <div className="flex items-center justify-between text-xs text-purple-600">
              <span>Active</span>
              <TagIcon className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Expense Ledger Card */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-red-50/20 to-white">
        <CardHeader className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-b-2 border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                <TrendingDownIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-red-800">{t('accounting.expense_ledger')}</CardTitle>
                <p className="text-sm text-red-600">Track all business expenses and categorization</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button variant="gradient-red" size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {t('accounting.add_expense')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newExpense.category}
                        onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {formatCategory(category)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter expense description..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="transaction_date">Transaction Date</Label>
                      <Input
                        id="transaction_date"
                        type="datetime-local"
                        value={newExpense.transaction_date || ''}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, transaction_date: e.target.value || undefined }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddExpense}
                        disabled={createExpenseMutation.isPending}
                      >
                        {createExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline-gradient-red"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                {t('accounting.filters')}
              </Button>
              <Button
                variant="gradient-red"
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
          <CardContent className="border-b bg-gradient-to-r from-red-50/50 to-rose-50/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-red-800">Start Date</label>
                <Input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-red-800">End Date</label>
                <Input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-red-800">Category</label>
                <Select
                  value={filters.category || ''}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {expenseCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {formatCategory(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline-gradient-red" onClick={clearFilters} className="w-full">
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
              Loading expense ledger...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('accounting.category')}</TableHead>
                    <TableHead>{t('accounting.amount')}</TableHead>
                    <TableHead>{t('accounting.description')}</TableHead>
                    <TableHead>{t('accounting.date')}</TableHead>
                    <TableHead>{t('accounting.reference')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseEntries?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No expense entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseEntries?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {formatCategory(entry.category)}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-red-600">
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(entry.transaction_date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.reference_type || '-'}
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