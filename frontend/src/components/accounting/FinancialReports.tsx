/**
 * Financial Reports Component
 * Standard financial reports (P&L, Balance Sheet, Cash Flow, Trial Balance)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Calculator,
  BarChart3,
  PieChart,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { accountingApi } from '../../services/accountingApi';
import { 
  TrialBalance, 
  BalanceSheet, 
  IncomeStatement, 
  GeneralLedger,
  ChartOfAccount 
} from '../../types/accounting';

interface FinancialReportsProps {
  className?: string;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  asOfDate: string;
}

const TrialBalanceReport: React.FC<{ 
  trialBalance: TrialBalance | null; 
  loading: boolean; 
  onRefresh: () => void;
}> = ({ trialBalance, loading, onRefresh }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trialBalance) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trial balance data available</p>
            <Button variant="outline" onClick={onRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-semibold text-green-800">
                Total Debits
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(trialBalance.total_debits)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <CardTitle className="text-sm font-semibold text-red-800">
                Total Credits
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(trialBalance.total_credits)}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-0 shadow-lg",
          trialBalance.is_balanced 
            ? "bg-gradient-to-br from-blue-50 to-blue-100/60" 
            : "bg-gradient-to-br from-orange-50 to-orange-100/60"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {trialBalance.is_balanced ? (
                <Calculator className="h-5 w-5 text-blue-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <CardTitle className={cn(
                "text-sm font-semibold",
                trialBalance.is_balanced ? "text-blue-800" : "text-orange-800"
              )}>
                Balance Status
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              trialBalance.is_balanced ? "text-blue-900" : "text-orange-900"
            )}>
              {trialBalance.is_balanced ? 'Balanced' : 'Out of Balance'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trial Balance Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trial Balance as of {new Date(trialBalance.as_of_date).toLocaleDateString()}</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Account Code</th>
                  <th className="text-left py-3 px-4 font-semibold">Account Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-right py-3 px-4 font-semibold">Debit Balance</th>
                  <th className="text-right py-3 px-4 font-semibold">Credit Balance</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.accounts.map((account, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{account.account_code}</td>
                    <td className="py-3 px-4">{account.account_name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {account.account_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {account.debit_balance > 0 ? formatCurrency(account.debit_balance) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {account.credit_balance > 0 ? formatCurrency(account.credit_balance) : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                  <td colSpan={3} className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(trialBalance.total_debits)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(trialBalance.total_credits)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const BalanceSheetReport: React.FC<{ 
  balanceSheet: BalanceSheet | null; 
  loading: boolean; 
  onRefresh: () => void;
}> = ({ balanceSheet, loading, onRefresh }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balanceSheet) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No balance sheet data available</p>
            <Button variant="outline" onClick={onRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderSection = (title: string, items: any[], total: number, colorClass: string) => (
    <div className="space-y-2">
      <h3 className={cn("text-lg font-semibold pb-2 border-b", colorClass)}>{title}</h3>
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center py-1" style={{ paddingLeft: `${item.level * 20}px` }}>
          <span className={cn(item.level === 0 ? "font-semibold" : "text-muted-foreground")}>
            {item.account_name}
          </span>
          <span className={cn(item.level === 0 ? "font-semibold" : "")}>
            {formatCurrency(item.balance)}
          </span>
        </div>
      ))}
      <div className={cn("flex justify-between items-center py-2 border-t font-bold", colorClass)}>
        <span>Total {title}</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-semibold text-blue-800">
                Total Assets
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(balanceSheet.total_assets)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-sm font-semibold text-orange-800">
                Total Liabilities
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(balanceSheet.total_liabilities)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-sm font-semibold text-purple-800">
                Total Equity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(balanceSheet.total_equity)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Sheet */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Balance Sheet as of {new Date(balanceSheet.as_of_date).toLocaleDateString()}</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {renderSection("Assets", balanceSheet.assets, balanceSheet.total_assets, "text-blue-700")}
            </div>
            <div className="space-y-6">
              {renderSection("Liabilities", balanceSheet.liabilities, balanceSheet.total_liabilities, "text-orange-700")}
              {renderSection("Equity", balanceSheet.equity, balanceSheet.total_equity, "text-purple-700")}
              
              {/* Balance Check */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center font-bold">
                  <span>Total Liabilities + Equity</span>
                  <span>{formatCurrency(balanceSheet.total_liabilities + balanceSheet.total_equity)}</span>
                </div>
                <div className={cn(
                  "flex justify-between items-center mt-2 text-sm",
                  Math.abs(balanceSheet.total_assets - (balanceSheet.total_liabilities + balanceSheet.total_equity)) < 0.01
                    ? "text-green-600"
                    : "text-red-600"
                )}>
                  <span>Balance Check</span>
                  <span>
                    {Math.abs(balanceSheet.total_assets - (balanceSheet.total_liabilities + balanceSheet.total_equity)) < 0.01
                      ? "✓ Balanced"
                      : "✗ Out of Balance"
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const IncomeStatementReport: React.FC<{ 
  incomeStatement: IncomeStatement | null; 
  loading: boolean; 
  onRefresh: () => void;
}> = ({ incomeStatement, loading, onRefresh }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!incomeStatement) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No income statement data available</p>
            <Button variant="outline" onClick={onRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderSection = (title: string, items: any[], total: number, colorClass: string) => (
    <div className="space-y-2">
      <h3 className={cn("text-lg font-semibold pb-2 border-b", colorClass)}>{title}</h3>
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center py-1" style={{ paddingLeft: `${item.level * 20}px` }}>
          <span className={cn(item.level === 0 ? "font-semibold" : "text-muted-foreground")}>
            {item.account_name}
          </span>
          <span className={cn(item.level === 0 ? "font-semibold" : "")}>
            {formatCurrency(item.amount)}
          </span>
        </div>
      ))}
      <div className={cn("flex justify-between items-center py-2 border-t font-bold", colorClass)}>
        <span>Total {title}</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );

  const grossProfit = incomeStatement.total_revenue - incomeStatement.total_expenses;
  const netMargin = incomeStatement.total_revenue > 0 ? (incomeStatement.net_income / incomeStatement.total_revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-semibold text-green-800">
                Total Revenue
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(incomeStatement.total_revenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <CardTitle className="text-sm font-semibold text-red-800">
                Total Expenses
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(incomeStatement.total_expenses)}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-0 shadow-lg",
          incomeStatement.net_income >= 0 
            ? "bg-gradient-to-br from-blue-50 to-blue-100/60" 
            : "bg-gradient-to-br from-orange-50 to-orange-100/60"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className={cn(
                "h-5 w-5",
                incomeStatement.net_income >= 0 ? "text-blue-600" : "text-orange-600"
              )} />
              <CardTitle className={cn(
                "text-sm font-semibold",
                incomeStatement.net_income >= 0 ? "text-blue-800" : "text-orange-800"
              )}>
                Net Income
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              incomeStatement.net_income >= 0 ? "text-blue-900" : "text-orange-900"
            )}>
              {formatCurrency(incomeStatement.net_income)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-sm font-semibold text-purple-800">
                Net Margin
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {netMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Statement */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Income Statement for {new Date(incomeStatement.start_date).toLocaleDateString()} - {new Date(incomeStatement.end_date).toLocaleDateString()}
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {renderSection("Revenue", incomeStatement.revenue, incomeStatement.total_revenue, "text-green-700")}
            {renderSection("Expenses", incomeStatement.expenses, incomeStatement.total_expenses, "text-red-700")}
            
            {/* Net Income */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className={cn(
                "flex justify-between items-center font-bold text-lg",
                incomeStatement.net_income >= 0 ? "text-green-700" : "text-red-700"
              )}>
                <span>Net Income</span>
                <span>{formatCurrency(incomeStatement.net_income)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const FinancialReports: React.FC<FinancialReportsProps> = ({ className }) => {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    endDate: new Date().toISOString().split('T')[0], // Today
    asOfDate: new Date().toISOString().split('T')[0] // Today
  });

  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({
    trialBalance: false,
    balanceSheet: false,
    incomeStatement: false
  });
  const [error, setError] = useState<string | null>(null);

  const loadTrialBalance = async () => {
    try {
      setLoading(prev => ({ ...prev, trialBalance: true }));
      setError(null);
      const data = await accountingApi.getTrialBalance(filters.asOfDate);
      setTrialBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trial balance');
    } finally {
      setLoading(prev => ({ ...prev, trialBalance: false }));
    }
  };

  const loadBalanceSheet = async () => {
    try {
      setLoading(prev => ({ ...prev, balanceSheet: true }));
      setError(null);
      const data = await accountingApi.getBalanceSheet(filters.asOfDate);
      setBalanceSheet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balance sheet');
    } finally {
      setLoading(prev => ({ ...prev, balanceSheet: false }));
    }
  };

  const loadIncomeStatement = async () => {
    try {
      setLoading(prev => ({ ...prev, incomeStatement: true }));
      setError(null);
      const data = await accountingApi.getIncomeStatement(filters.startDate, filters.endDate);
      setIncomeStatement(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load income statement');
    } finally {
      setLoading(prev => ({ ...prev, incomeStatement: false }));
    }
  };

  const loadAllReports = async () => {
    await Promise.all([
      loadTrialBalance(),
      loadBalanceSheet(),
      loadIncomeStatement()
    ]);
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Financial Reports
              </h2>
              <p className="text-muted-foreground">
                Standard financial statements and reports
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-gradient-purple" onClick={loadAllReports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadAllReports}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100/80">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date (P&L)</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date (P&L)</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">As Of Date (Balance Sheet & Trial Balance)</label>
              <Input
                type="date"
                value={filters.asOfDate}
                onChange={(e) => setFilters({ ...filters, asOfDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="gradient-purple" onClick={loadAllReports}>
              <Calendar className="h-4 w-4 mr-2" />
              Update Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="trial-balance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance">
          <TrialBalanceReport 
            trialBalance={trialBalance} 
            loading={loading.trialBalance} 
            onRefresh={loadTrialBalance}
          />
        </TabsContent>

        <TabsContent value="balance-sheet">
          <BalanceSheetReport 
            balanceSheet={balanceSheet} 
            loading={loading.balanceSheet} 
            onRefresh={loadBalanceSheet}
          />
        </TabsContent>

        <TabsContent value="income-statement">
          <IncomeStatementReport 
            incomeStatement={incomeStatement} 
            loading={loading.incomeStatement} 
            onRefresh={loadIncomeStatement}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};