/**
 * Accounting Dashboard Component
 * Main dashboard for double-entry accounting system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Building2,
  Users
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { accountingApi } from '../../services/accountingApi';
import { AccountingDashboardData } from '../../types/accounting';

interface AccountingDashboardProps {
  className?: string;
}

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({ className }) => {
  const [dashboardData, setDashboardData] = useState<AccountingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountingApi.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading dashboard: {error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadDashboardData}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) return null;

  const profitMargin = dashboardData.total_revenue > 0 
    ? (dashboardData.net_income / dashboardData.total_revenue) * 100 
    : 0;

  const debtToEquityRatio = dashboardData.total_equity > 0 
    ? dashboardData.total_liabilities / dashboardData.total_equity 
    : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 via-teal-500 to-blue-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Accounting Dashboard
              </h1>
              <p className="text-muted-foreground">
                Double-entry bookkeeping overview and key metrics
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-gradient-green" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="gradient-green" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-blue-800">
                  Total Assets
                </CardTitle>
              </div>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                <TrendingUp className="h-3 w-3 mr-1" />
                Strong
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(dashboardData.total_assets)}
            </div>
            <div className="flex items-center justify-between text-xs text-blue-600">
              <span>Balance Sheet</span>
              <Eye className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        {/* Total Liabilities */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-orange-800">
                  Total Liabilities
                </CardTitle>
              </div>
              <Badge 
                className={cn(
                  debtToEquityRatio > 1 
                    ? "bg-red-100 text-red-700 hover:bg-red-100" 
                    : "bg-orange-100 text-orange-700 hover:bg-orange-100"
                )}
              >
                {debtToEquityRatio > 1 ? "High" : "Normal"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(dashboardData.total_liabilities)}
            </div>
            <div className="flex items-center justify-between text-xs text-orange-600">
              <span>D/E Ratio: {debtToEquityRatio.toFixed(2)}</span>
              <ArrowDownRight className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        {/* Total Equity */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PieChart className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-purple-800">
                  Total Equity
                </CardTitle>
              </div>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                Owner's
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(dashboardData.total_equity)}
            </div>
            <div className="flex items-center justify-between text-xs text-purple-600">
              <span>Ownership</span>
              <Users className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        {/* Net Income */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-green-800">
                  Net Income
                </CardTitle>
              </div>
              <Badge 
                className={cn(
                  dashboardData.net_income >= 0 
                    ? "bg-green-100 text-green-700 hover:bg-green-100" 
                    : "bg-red-100 text-red-700 hover:bg-red-100"
                )}
              >
                {profitMargin.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={cn(
              "text-2xl font-bold",
              dashboardData.net_income >= 0 ? 'text-green-900' : 'text-red-900'
            )}>
              {formatCurrency(dashboardData.net_income)}
            </div>
            <Progress 
              value={Math.max(0, Math.min(100, profitMargin))}
              className="h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-100/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-emerald-800">Revenue Analysis</CardTitle>
                  <p className="text-sm text-emerald-600">Income statement overview</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                P&L Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700">Total Revenue</span>
                <span className="text-lg font-bold text-emerald-900">
                  {formatCurrency(dashboardData.total_revenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-700">Total Expenses</span>
                <span className="text-lg font-bold text-red-900">
                  {formatCurrency(dashboardData.total_expenses)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gross Margin</span>
                  <span className={cn(
                    "text-lg font-bold",
                    dashboardData.net_income >= 0 ? 'text-green-900' : 'text-red-900'
                  )}>
                    {formatPercentage(dashboardData.net_income, dashboardData.total_revenue)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-blue-800">Cash Flow Status</CardTitle>
                  <p className="text-sm text-blue-600">Liquidity and working capital</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Cash Flow
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">Cash Balance</span>
                <span className="text-lg font-bold text-blue-900">
                  {formatCurrency(dashboardData.cash_balance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Accounts Receivable</span>
                <span className="text-lg font-bold text-green-900">
                  {formatCurrency(dashboardData.accounts_receivable)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-700">Accounts Payable</span>
                <span className="text-lg font-bold text-orange-900">
                  {formatCurrency(dashboardData.accounts_payable)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-sm font-semibold text-amber-800">
                Pending Entries
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {dashboardData.pending_journal_entries}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Journal entries awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-sm font-semibold text-red-800">
                Unreconciled
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {dashboardData.unreconciled_transactions}
            </div>
            <p className="text-xs text-red-600 mt-1">
              Bank transactions to reconcile
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-semibold text-green-800">
                System Health
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              Excellent
            </div>
            <p className="text-xs text-green-600 mt-1">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Recent Journal Entries</CardTitle>
                <p className="text-sm text-muted-foreground">Latest accounting transactions</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.recent_transactions.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
                    entry.status === 'posted' ? 'bg-green-100 text-green-700' :
                    entry.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {entry.entry_number.slice(-2)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.entry_date).toLocaleDateString()} • {entry.entry_number}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(entry.total_debit)}</p>
                  <Badge 
                    variant={entry.status === 'posted' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {entry.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};