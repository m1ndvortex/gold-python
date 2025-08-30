/**
 * Enhanced Double-Entry Accounting Dashboard
 * Comprehensive dashboard for the enhanced accounting system
 */

import React, { useState } from 'react';
import { useEnhancedAccounting } from '../../hooks/useEnhancedAccounting';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  CalculatorIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  CreditCardIcon, 
  ScaleIcon, 
  BarChart3Icon, 
  AlertTriangleIcon,
  Activity,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  BookOpenIcon,
  FileTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DollarSignIcon,
  CalendarIcon,
  UsersIcon,
  BanknotesIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export const AccountingDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { useAccountingDashboard } = useEnhancedAccounting();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: dashboard, isLoading, error } = useAccountingDashboard();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <XCircleIcon className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
                <p className="text-red-600">Unable to load accounting dashboard data. Please try again.</p>
              </div>
            </div>
            <Button onClick={handleRefresh} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Enhanced Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 via-teal-500 to-blue-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
              <CalculatorIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {t('accounting.enhanced_dashboard')}
              </h1>
              <p className="text-muted-foreground text-lg">
                Double-Entry Accounting System Dashboard
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-gradient-green" size="sm" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button variant="gradient-green" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Assets Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUpIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-emerald-800">
                    Total Assets
                  </CardTitle>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  Assets
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-emerald-900">
                {formatCurrency(dashboard.total_assets)}
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-600">
                <span>Balance Sheet</span>
                <Activity className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Total Liabilities Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingDownIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-red-800">
                    Total Liabilities
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  Liabilities
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(dashboard.total_liabilities)}
              </div>
              <div className="flex items-center justify-between text-xs text-red-600">
                <span>Outstanding</span>
                <CreditCardIcon className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Total Equity Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ScaleIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-blue-800">
                    Total Equity
                  </CardTitle>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  Equity
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(dashboard.total_equity)}
              </div>
              <div className="flex items-center justify-between text-xs text-blue-600">
                <span>Owner's Equity</span>
                <PiggyBank className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Net Profit Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3Icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-purple-800">
                    Net Profit
                  </CardTitle>
                </div>
                <Badge 
                  className={cn(
                    "text-xs",
                    dashboard.net_profit >= 0 
                      ? "bg-green-100 text-green-700 hover:bg-green-100" 
                      : "bg-red-100 text-red-700 hover:bg-red-100"
                  )}
                >
                  {dashboard.net_profit >= 0 ? "Profit" : "Loss"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className={cn(
                "text-2xl font-bold",
                dashboard.net_profit >= 0 ? 'text-green-900' : 'text-red-900'
              )}>
                {formatCurrency(dashboard.net_profit)}
              </div>
              <Progress 
                value={dashboard.net_profit > 0 ? Math.min((dashboard.net_profit / dashboard.total_revenue) * 100, 100) : 0}
                className="h-2"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Secondary Metrics */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cash Balance Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-cyan-50 to-cyan-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="h-5 w-5 text-cyan-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-cyan-800">
                    Cash Balance
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-cyan-900">
                {formatCurrency(dashboard.cash_balance)}
              </div>
              <div className="flex items-center justify-between text-xs text-cyan-600">
                <span>Available Cash</span>
                <BanknotesIcon className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Accounts Receivable Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-orange-800">
                    Accounts Receivable
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency(dashboard.accounts_receivable)}
              </div>
              <div className="flex items-center justify-between text-xs text-orange-600">
                <span>Outstanding</span>
                <UsersIcon className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Accounts Payable Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-rose-50 to-rose-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowDownRight className="h-5 w-5 text-rose-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-rose-800">
                    Accounts Payable
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-rose-900">
                {formatCurrency(dashboard.accounts_payable)}
              </div>
              <div className="flex items-center justify-between text-xs text-rose-600">
                <span>Due to Vendors</span>
                <DollarSignIcon className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Checks Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ClockIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-amber-800">
                    Pending Checks
                  </CardTitle>
                </div>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  {dashboard.pending_checks}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-amber-900">
                {dashboard.pending_checks}
              </div>
              <div className="flex items-center justify-between text-xs text-amber-600">
                <span>Awaiting Clearance</span>
                <CheckCircleIcon className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Period Summary and Recent Activity */}
      {dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Period Summary Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50/30 to-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Current Period Summary</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Period: {dashboard.period_summary.current_period}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={dashboard.period_summary.is_locked ? "destructive" : "default"}
                  className={dashboard.period_summary.is_locked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}
                >
                  {dashboard.period_summary.is_locked ? "Locked" : "Open"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Journal Entries</p>
                  <p className="text-2xl font-bold text-foreground">{dashboard.period_summary.entries_count}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Unbalanced Entries</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    dashboard.period_summary.unbalanced_entries > 0 ? "text-red-600" : "text-green-600"
                  )}>
                    {dashboard.period_summary.unbalanced_entries}
                  </p>
                </div>
              </div>
              {dashboard.period_summary.unbalanced_entries > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">
                      Warning: {dashboard.period_summary.unbalanced_entries} unbalanced entries require attention
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Journal Entries Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/30 to-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <BookOpenIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Recent Journal Entries</CardTitle>
                    <p className="text-sm text-muted-foreground">Latest accounting transactions</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.recent_journal_entries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
                        entry.status === 'posted' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {entry.status === 'posted' ? <CheckCircleIcon className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{entry.entry_number}</p>
                        <p className="text-xs text-muted-foreground">{entry.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(entry.total_debit)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(entry.entry_date), 'MMM dd')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/30 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <p className="text-sm text-muted-foreground">Common accounting tasks</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline-gradient-green" className="h-auto p-4 flex flex-col gap-2">
              <BookOpenIcon className="h-6 w-6" />
              <span className="text-sm">New Journal Entry</span>
            </Button>
            <Button variant="outline-gradient-blue" className="h-auto p-4 flex flex-col gap-2">
              <CreditCardIcon className="h-6 w-6" />
              <span className="text-sm">Manage Checks</span>
            </Button>
            <Button variant="outline-gradient-purple" className="h-auto p-4 flex flex-col gap-2">
              <BarChart3Icon className="h-6 w-6" />
              <span className="text-sm">Financial Reports</span>
            </Button>
            <Button variant="outline-gradient-orange" className="h-auto p-4 flex flex-col gap-2">
              <CalendarIcon className="h-6 w-6" />
              <span className="text-sm">Period Management</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};