import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { 
  CalculatorIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  CreditCardIcon, 
  ScaleIcon, 
  BarChart3Icon, 
  AlertTriangleIcon,
  DollarSign,
  Activity,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank
} from 'lucide-react';
import { cn } from '../lib/utils';

// Import accounting components
import { IncomeLedger } from '../components/accounting/IncomeLedger';
import { ExpenseLedger } from '../components/accounting/ExpenseLedger';
import { CashBankLedger } from '../components/accounting/CashBankLedger';
import { GoldWeightLedger } from '../components/accounting/GoldWeightLedger';
import { ProfitLossAnalysis } from '../components/accounting/ProfitLossAnalysis';
import { DebtTracking } from '../components/accounting/DebtTracking';
import { useAccounting } from '../hooks/useAccounting';

export const Accounting: React.FC = () => {
  const { t } = useLanguage();
  const { useLedgerSummary } = useAccounting();
  const [activeTab, setActiveTab] = useState('income');

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
      icon: CreditCardIcon,
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
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
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
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

      {/* Enhanced Accounting Tabs */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Modern Tab Navigation */}
            <div className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 border-b-2 border-slate-200">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-transparent h-auto p-1 gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                        "hover:bg-white hover:shadow-sm",
                        "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2",
                        isActive ? "data-[state=active]:border-primary-300" : "border-transparent"
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110",
                        isActive ? "bg-primary-100" : "bg-slate-200 group-hover:bg-slate-300"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-primary-600" : "text-slate-600 group-hover:text-slate-700"
                        )} />
                      </div>
                      <span className={cn(
                        "text-xs font-medium transition-colors",
                        isActive ? "text-primary-700" : "text-slate-600 group-hover:text-slate-700"
                      )}>
                        {tab.label}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Enhanced Tab Description */}
            <div className="bg-gradient-to-r from-primary-50/50 to-primary-100/30 border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse"></div>
                  <p className="text-sm text-primary-800 font-medium">
                    {tabs.find(tab => tab.id === activeTab)?.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200">
                    Real-time
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Tab Content */}
            {tabs.map((tab) => {
              const Component = tab.component;
              return (
                <TabsContent key={tab.id} value={tab.id} className="p-0">
                  <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50/30 to-white min-h-[600px]">
                    {/* Tab Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                          <tab.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{tab.label}</h3>
                          <p className="text-sm text-muted-foreground">Manage and track {tab.label.toLowerCase()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                    
                    {/* Component Content */}
                    <div className="space-y-6">
                      <Component />
                    </div>
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

// Individual route components
const AccountingIncomeRoute: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUpIcon className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">{t('accounting.income_title')}</h1>
          <p className="text-muted-foreground">{t('accounting.income_desc')}</p>
        </div>
      </div>
      <IncomeLedger />
    </div>
  );
};

const AccountingExpenseRoute: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingDownIcon className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">{t('accounting.expense_ledger')}</h1>
          <p className="text-muted-foreground">{t('accounting.expense_desc')}</p>
        </div>
      </div>
      <ExpenseLedger />
    </div>
  );
};

const AccountingCashBankRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <CreditCardIcon className="h-8 w-8 text-blue-600" />
      <div>
        <h1 className="text-3xl font-bold">Cash & Bank</h1>
        <p className="text-muted-foreground">Monitor cash flow and bank transactions</p>
      </div>
    </div>
    <CashBankLedger />
  </div>
);

const AccountingGoldWeightRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <ScaleIcon className="h-8 w-8 text-yellow-600" />
      <div>
        <h1 className="text-3xl font-bold">Gold Weight</h1>
        <p className="text-muted-foreground">Track gold inventory valuation and weight</p>
      </div>
    </div>
    <GoldWeightLedger />
  </div>
);

const AccountingDebtRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <AlertTriangleIcon className="h-8 w-8 text-orange-600" />
      <div>
        <h1 className="text-3xl font-bold">Debt Tracking</h1>
        <p className="text-muted-foreground">Monitor customer debt and payment history</p>
      </div>
    </div>
    <DebtTracking />
  </div>
);

const AccountingProfitLossRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <BarChart3Icon className="h-8 w-8 text-purple-600" />
      <div>
        <h1 className="text-3xl font-bold">Profit & Loss</h1>
        <p className="text-muted-foreground">Comprehensive profit and loss analysis</p>
      </div>
    </div>
    <ProfitLossAnalysis />
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