import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
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
  UsersIcon,
  CalendarIcon,
  BanknotesIcon,
  ClipboardListIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

// Import existing accounting components
import { IncomeLedger } from '../components/accounting/IncomeLedger';
import { ExpenseLedger } from '../components/accounting/ExpenseLedger';
import { CashBankLedger } from '../components/accounting/CashBankLedger';
import { GoldWeightLedger } from '../components/accounting/GoldWeightLedger';
import { ProfitLossAnalysis } from '../components/accounting/ProfitLossAnalysis';
import { DebtTracking } from '../components/accounting/DebtTracking';
import { useAccounting } from '../hooks/useAccounting';

// Import enhanced accounting components
import { AccountingDashboard } from '../components/accounting/AccountingDashboard';
import { ChartOfAccountsManager } from '../components/accounting/ChartOfAccountsManager';
import { JournalEntryManager } from '../components/accounting/JournalEntryManager';
import { CheckManager } from '../components/accounting/CheckManager';

export const Accounting: React.FC = () => {
  const { t } = useLanguage();
  const { useLedgerSummary } = useAccounting();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Get ledger summary for overview
  const { data: ledgerSummary, isLoading: summaryLoading } = useLedgerSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

    const formatWeight = (grams: number) => {
    return `${grams.toFixed(3)} g`;
  };

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: CalculatorIcon,
      component: AccountingDashboard,
      description: 'Enhanced double-entry accounting dashboard'
    },
    {
      id: 'chart-of-accounts',
      label: 'Chart of Accounts',
      icon: BookOpenIcon,
      component: ChartOfAccountsManager,
      description: 'Manage hierarchical account structure'
    },
    {
      id: 'journal-entries',
      label: 'Journal Entries',
      icon: FileTextIcon,
      component: JournalEntryManager,
      description: 'Double-entry bookkeeping system'
    },
    {
      id: 'checks',
      label: 'Check Management',
      icon: CreditCardIcon,
      component: CheckManager,
      description: 'مدیریت چک‌ها - Complete check lifecycle'
    },
    {
      id: 'income',
      label: t('accounting.income'),
      icon: TrendingUpIcon,
      component: IncomeLedger,
      description: t('accounting.income_desc')
    },
    {
      id: 'expense',
      label: t('accounting.expense'),
      icon: TrendingDownIcon,
      component: ExpenseLedger,
      description: 'Manage business expenses and categorization'
    },
    {
      id: 'cash-bank',
      label: t('accounting.cash_bank'),
      icon: BanknotesIcon,
      component: CashBankLedger,
      description: 'Monitor cash flow and bank transactions'
    },
    {
      id: 'gold-weight',
      label: t('accounting.gold_weight'),
      icon: ScaleIcon,
      component: GoldWeightLedger,
      description: 'Track gold inventory valuation and weight'
    },
    {
      id: 'profit-loss',
      label: t('accounting.profit_loss'),
      icon: BarChart3Icon,
      component: ProfitLossAnalysis,
      description: 'Comprehensive profit and loss analysis'
    },
    {
      id: 'debt-tracking',
      label: t('accounting.debt_tracking'),
      icon: AlertTriangleIcon,
      component: DebtTracking,
      description: 'Monitor customer debt and payment history'
    }
  ];

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
                {t('accounting.title')}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t('accounting.description')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-gradient-green" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button variant="gradient-green" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Enhanced Financial Overview Cards */}
      {!summaryLoading && ledgerSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Total Income Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-emerald-800">
                    {t('accounting.total_income')}
                  </CardTitle>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <TrendingUpIcon className="h-3 w-3 mr-1" />
                  +5.2%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-emerald-900">
                {formatCurrency(ledgerSummary.total_income)}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-emerald-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-4/5 rounded-full"></div>
                </div>
                <span className="text-xs text-emerald-600">Revenue Goal</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-red-800">
                    {t('accounting.total_expenses')}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  <TrendingDownIcon className="h-3 w-3 mr-1" />
                  -2.1%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(ledgerSummary.total_expenses)}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-red-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-3/5 rounded-full"></div>
                </div>
                <span className="text-xs text-red-600">Budget Limit</span>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-blue-800">
                    {t('accounting.cash_flow')}
                  </CardTitle>
                </div>
                <Badge 
                  className={cn(
                    "text-xs",
                    ledgerSummary.total_cash_flow >= 0 
                      ? "bg-green-100 text-green-700 hover:bg-green-100" 
                      : "bg-red-100 text-red-700 hover:bg-red-100"
                  )}
                >
                  {ledgerSummary.total_cash_flow >= 0 ? "Positive" : "Negative"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className={cn(
                "text-2xl font-bold",
                ledgerSummary.total_cash_flow >= 0 ? 'text-green-900' : 'text-red-900'
              )}>
                {formatCurrency(ledgerSummary.total_cash_flow)}
              </div>
              <div className="flex items-center justify-between text-xs text-blue-600">
                <span>This Month</span>
                <Activity className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Gold Weight Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-amber-50 to-yellow-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ScaleIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-amber-800">
                    {t('accounting.gold_weight')}
                  </CardTitle>
                </div>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  Inventory
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-amber-900">
                {formatWeight(ledgerSummary.total_gold_weight)}
              </div>
              <div className="flex items-center justify-between text-xs text-amber-600">
                <span>Total Stock</span>
                <PiggyBank className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Customer Debt Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <AlertTriangleIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-orange-800">
                    {t('accounting.customer_debt')}
                  </CardTitle>
                </div>
                <Badge 
                  variant={ledgerSummary.total_customer_debt > 10000 ? "destructive" : "secondary"}
                  className={cn(
                    ledgerSummary.total_customer_debt > 10000 
                      ? "bg-red-100 text-red-700 hover:bg-red-100" 
                      : "bg-orange-100 text-orange-700 hover:bg-orange-100"
                  )}
                >
                  {ledgerSummary.total_customer_debt > 10000 ? "High" : "Normal"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency(ledgerSummary.total_customer_debt)}
              </div>
              <div className="flex items-center justify-between text-xs text-orange-600">
                <span>Outstanding</span>
                <CreditCardIcon className="h-3 w-3" />
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
                    {t('accounting.net_profit')}
                  </CardTitle>
                </div>
                <Badge 
                  className={cn(
                    "text-xs",
                    ledgerSummary.net_profit >= 0 
                      ? "bg-green-100 text-green-700 hover:bg-green-100" 
                      : "bg-red-100 text-red-700 hover:bg-red-100"
                  )}
                >
                  {ledgerSummary.net_profit >= 0 ? "+8.4%" : "-2.1%"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className={cn(
                "text-2xl font-bold",
                ledgerSummary.net_profit >= 0 ? 'text-green-900' : 'text-red-900'
              )}>
                {formatCurrency(ledgerSummary.net_profit)}
              </div>
              <Progress 
                value={ledgerSummary.net_profit > 0 ? Math.min((ledgerSummary.net_profit / ledgerSummary.total_income) * 100, 100) : 0}
                className="h-2"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Accounting Tabs with Gradient Design */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-green-50/20 to-white">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Modern Gradient Tab Navigation */}
            <div className="bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-b-2 border-green-200">
              <TabsList variant="gradient-green" className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      variant="gradient-green"
                      className="flex flex-col items-center gap-2 p-4 group"
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110",
                        isActive 
                          ? "bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg" 
                          : "bg-green-100 text-green-600 group-hover:bg-green-200"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        "text-xs font-medium transition-colors",
                        isActive ? "text-green-700" : "text-green-600 group-hover:text-green-700"
                      )}>
                        {tab.label}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Enhanced Tab Description with Gradient */}
            <div className="bg-gradient-to-r from-green-50/50 to-teal-50/30 border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-sm text-green-800 font-medium">
                    {tabs.find(tab => tab.id === activeTab)?.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Real-time
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-green-100">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Tab Content with Gradient Backgrounds */}
            {tabs.map((tab) => {
              const Component = tab.component;
              return (
                <TabsContent key={tab.id} value={tab.id} variant="gradient-green" className="min-h-[600px]">
                  {/* Tab Header with Gradient Icon */}
                  <div className="flex items-center justify-between pb-4 border-b border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <tab.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{tab.label}</h3>
                        <p className="text-sm text-muted-foreground">Manage and track {tab.label.toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="gradient-green" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                  
                  {/* Component Content */}
                  <div className="space-y-6">
                    <Component />
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Individual route components with enhanced gradient styling
const AccountingIncomeRoute: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto p-6 space-y-8 bg-gradient-to-br from-emerald-50/40 via-green-50/30 to-white min-h-screen">
      {/* Enhanced Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
              <TrendingUpIcon className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-green-800 bg-clip-text text-transparent">
                {t('accounting.income_title')}
              </h1>
              <p className="text-muted-foreground text-lg">{t('accounting.income_desc')}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-gradient-green" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button variant="gradient-green" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Enhanced Content Container */}
      <div className="bg-gradient-to-br from-white to-green-50/20 rounded-2xl shadow-xl border-0 p-6">
        <IncomeLedger />
      </div>
    </div>
  );
};

const AccountingExpenseRoute: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto p-6 space-y-8 bg-gradient-to-br from-red-50/40 via-rose-50/30 to-white min-h-screen">
      {/* Enhanced Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-500 via-rose-500 to-red-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
              <TrendingDownIcon className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-red-700 to-rose-800 bg-clip-text text-transparent">
                {t('accounting.expense_ledger')}
              </h1>
              <p className="text-muted-foreground text-lg">{t('accounting.expense_desc')}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-gradient-red" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button variant="gradient-red" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Enhanced Content Container */}
      <div className="bg-gradient-to-br from-white to-red-50/20 rounded-2xl shadow-xl border-0 p-6">
        <ExpenseLedger />
      </div>
    </div>
  );
};

const AccountingCashBankRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-8 bg-gradient-to-br from-blue-50/40 via-cyan-50/30 to-white min-h-screen">
    {/* Enhanced Page Header */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CreditCardIcon className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
              Cash & Bank
            </h1>
            <p className="text-muted-foreground text-lg">Monitor cash flow and bank transactions</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline-gradient-blue" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
        <Button variant="gradient-blue" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
    
    {/* Enhanced Content Container */}
    <div className="bg-gradient-to-br from-white to-blue-50/20 rounded-2xl shadow-xl border-0 p-6">
      <CashBankLedger />
    </div>
  </div>
);

const AccountingGoldWeightRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-8 bg-gradient-to-br from-amber-50/40 via-yellow-50/30 to-white min-h-screen">
    {/* Enhanced Page Header */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
            <ScaleIcon className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-700 to-yellow-800 bg-clip-text text-transparent">
              Gold Weight
            </h1>
            <p className="text-muted-foreground text-lg">Track gold inventory valuation and weight</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline-gradient-amber" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
        <Button variant="gradient-amber" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
    
    {/* Enhanced Content Container */}
    <div className="bg-gradient-to-br from-white to-amber-50/20 rounded-2xl shadow-xl border-0 p-6">
      <GoldWeightLedger />
    </div>
  </div>
);

const AccountingDebtRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-8 bg-gradient-to-br from-orange-50/40 via-red-50/30 to-white min-h-screen">
    {/* Enhanced Page Header */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-red-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
            <AlertTriangleIcon className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-700 to-red-800 bg-clip-text text-transparent">
              Debt Tracking
            </h1>
            <p className="text-muted-foreground text-lg">Monitor customer debt and payment history</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline-gradient-orange" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
        <Button variant="gradient-orange" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
    
    {/* Enhanced Content Container */}
    <div className="bg-gradient-to-br from-white to-orange-50/20 rounded-2xl shadow-xl border-0 p-6">
      <DebtTracking />
    </div>
  </div>
);

const AccountingProfitLossRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-8 bg-gradient-to-br from-purple-50/40 via-violet-50/30 to-white min-h-screen">
    {/* Enhanced Page Header */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
            <BarChart3Icon className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-700 to-violet-800 bg-clip-text text-transparent">
              Profit & Loss
            </h1>
            <p className="text-muted-foreground text-lg">Comprehensive profit and loss analysis</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline-gradient-purple" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
        <Button variant="gradient-purple" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
    
    {/* Enhanced Content Container */}
    <div className="bg-gradient-to-br from-white to-purple-50/20 rounded-2xl shadow-xl border-0 p-6">
      <ProfitLossAnalysis />
    </div>
  </div>
);

// Wrapper component to handle sub-routes
export const AccountingWithRouting: React.FC = () => {
  return (
    <Routes>
      <Route path="/income" element={<AccountingIncomeRoute />} />
      <Route path="/expense" element={<AccountingExpenseRoute />} />
      <Route path="/cash-bank" element={<AccountingCashBankRoute />} />
      <Route path="/gold-weight" element={<AccountingGoldWeightRoute />} />
      <Route path="/debt" element={<AccountingDebtRoute />} />
      <Route path="/profit-loss" element={<AccountingProfitLossRoute />} />
      <Route path="/*" element={<Accounting />} />
    </Routes>
  );
};