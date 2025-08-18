import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  CalculatorIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  CreditCardIcon, 
  ScaleIcon, 
  BarChart3Icon, 
  AlertTriangleIcon 
} from 'lucide-react';

// Import accounting components
import { IncomeLedger } from '../components/accounting/IncomeLedger';
import { ExpenseLedger } from '../components/accounting/ExpenseLedger';
import { CashBankLedger } from '../components/accounting/CashBankLedger';
import { GoldWeightLedger } from '../components/accounting/GoldWeightLedger';
import { ProfitLossAnalysis } from '../components/accounting/ProfitLossAnalysis';
import { DebtTracking } from '../components/accounting/DebtTracking';
import { useAccounting } from '../hooks/useAccounting';

export const Accounting: React.FC = () => {
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
      label: 'Income Ledger',
      icon: TrendingUpIcon,
      component: IncomeLedger,
      description: 'Track all revenue from invoices and payments'
    },
    {
      id: 'expense',
      label: 'Expense Ledger',
      icon: TrendingDownIcon,
      component: ExpenseLedger,
      description: 'Manage business expenses and categorization'
    },
    {
      id: 'cash-bank',
      label: 'Cash & Bank',
      icon: CreditCardIcon,
      component: CashBankLedger,
      description: 'Monitor cash flow and bank transactions'
    },
    {
      id: 'gold-weight',
      label: 'Gold Weight',
      icon: ScaleIcon,
      component: GoldWeightLedger,
      description: 'Track gold inventory valuation and weight'
    },
    {
      id: 'profit-loss',
      label: 'Profit & Loss',
      icon: BarChart3Icon,
      component: ProfitLossAnalysis,
      description: 'Comprehensive profit and loss analysis'
    },
    {
      id: 'debt-tracking',
      label: 'Debt Tracking',
      icon: AlertTriangleIcon,
      component: DebtTracking,
      description: 'Monitor customer debt and payment history'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalculatorIcon className="h-8 w-8" />
            Accounting System
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive financial management and ledger tracking
          </p>
        </div>
      </div>

      {/* Ledger Summary Overview */}
      {!summaryLoading && ledgerSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-green-600" />
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(ledgerSummary.total_income)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDownIcon className="h-4 w-4 text-red-600" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(ledgerSummary.total_expenses)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCardIcon className="h-4 w-4 text-blue-600" />
                Cash Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${
                ledgerSummary.total_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(ledgerSummary.total_cash_flow)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ScaleIcon className="h-4 w-4 text-yellow-600" />
                Gold Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-yellow-600">
                {formatWeight(ledgerSummary.total_gold_weight)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
                Customer Debt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-600">
                {formatCurrency(ledgerSummary.total_customer_debt)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4 text-purple-600" />
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${
                ledgerSummary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(ledgerSummary.net_profit)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Accounting Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex flex-col items-center gap-2 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Tab Description */}
            <div className="p-4 border-b bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>

            {/* Tab Content */}
            {tabs.map((tab) => {
              const Component = tab.component;
              return (
                <TabsContent key={tab.id} value={tab.id} className="p-6 space-y-6">
                  <Component />
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};