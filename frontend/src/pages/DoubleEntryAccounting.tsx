/**
 * Double-Entry Accounting Main Page
 * Comprehensive accounting interface integrating all double-entry accounting components
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Calculator,
  Building2,
  FileText,
  Banknote,
  BarChart3,
  Calendar,
  TrendingUp,
  RefreshCw,
  Download,
  Eye,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';

// Import double-entry accounting components
import { AccountingDashboard } from '../components/accounting/AccountingDashboard';
import { ChartOfAccountsManager } from '../components/accounting/ChartOfAccountsManager';
import { JournalEntryManager } from '../components/accounting/JournalEntryManager';
import { BankReconciliationManager } from '../components/accounting/BankReconciliationManager';
import { FinancialReports } from '../components/accounting/FinancialReports';
import { PeriodClosingManager } from '../components/accounting/PeriodClosingManager';

interface AccountingTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

export const DoubleEntryAccounting: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs: AccountingTab[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Calculator,
      component: AccountingDashboard,
      description: 'Overview of financial position and key metrics',
      color: 'green'
    },
    {
      id: 'chart-of-accounts',
      label: 'Chart of Accounts',
      icon: Building2,
      component: ChartOfAccountsManager,
      description: 'Manage hierarchical account structure',
      color: 'blue'
    },
    {
      id: 'journal-entries',
      label: 'Journal Entries',
      icon: FileText,
      component: JournalEntryManager,
      description: 'Create and manage double-entry journal entries',
      color: 'teal'
    },
    {
      id: 'bank-reconciliation',
      label: 'Bank Reconciliation',
      icon: Banknote,
      component: BankReconciliationManager,
      description: 'Reconcile bank statements with book records',
      color: 'indigo'
    },
    {
      id: 'financial-reports',
      label: 'Financial Reports',
      icon: BarChart3,
      component: FinancialReports,
      description: 'Generate standard financial statements',
      color: 'purple'
    },
    {
      id: 'period-closing',
      label: 'Period Closing',
      icon: Calendar,
      component: PeriodClosingManager,
      description: 'Manage accounting periods and closing',
      color: 'violet'
    }
  ];

  const getTabColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      green: {
        active: 'bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg',
        inactive: 'bg-green-100 text-green-600 group-hover:bg-green-200',
        text: 'text-green-700',
        bg: 'from-green-50 to-teal-50'
      },
      blue: {
        active: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg',
        inactive: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
        text: 'text-blue-700',
        bg: 'from-blue-50 to-indigo-50'
      },
      teal: {
        active: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg',
        inactive: 'bg-teal-100 text-teal-600 group-hover:bg-teal-200',
        text: 'text-teal-700',
        bg: 'from-teal-50 to-cyan-50'
      },
      indigo: {
        active: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg',
        inactive: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200',
        text: 'text-indigo-700',
        bg: 'from-indigo-50 to-purple-50'
      },
      purple: {
        active: 'bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg',
        inactive: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
        text: 'text-purple-700',
        bg: 'from-purple-50 to-violet-50'
      },
      violet: {
        active: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg',
        inactive: 'bg-violet-100 text-violet-600 group-hover:bg-violet-200',
        text: 'text-violet-700',
        bg: 'from-violet-50 to-purple-50'
      }
    };

    return colorMap[color as keyof typeof colorMap] || colorMap.green;
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Enhanced Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 via-teal-500 to-blue-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Double-Entry Accounting
              </h1>
              <p className="text-muted-foreground text-lg">
                Comprehensive accounting system with full double-entry bookkeeping
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Audit Trail
          </Button>
          <Button variant="gradient-green" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Main Accounting Interface */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Modern Tab Navigation */}
            <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-b">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-transparent">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const colorClasses = getTabColorClasses(tab.color, isActive);
                  
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex flex-col items-center gap-2 p-4 group data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-gray-300"
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110",
                        isActive ? colorClasses.active : colorClasses.inactive
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        "text-xs font-medium transition-colors",
                        isActive ? colorClasses.text : "text-gray-600 group-hover:text-gray-700"
                      )}>
                        {tab.label}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Tab Description */}
            {currentTab && (
              <div className={cn(
                "bg-gradient-to-r border-b px-6 py-4",
                `${getTabColorClasses(currentTab.color, false).bg}/50`
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-current animate-pulse opacity-60"></div>
                    <p className={cn(
                      "text-sm font-medium",
                      getTabColorClasses(currentTab.color, false).text
                    )}>
                      {currentTab.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white/50 text-current border-current/20">
                      Live Data
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-white/50">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content */}
            {tabs.map((tab) => {
              const Component = tab.component;
              const colorClasses = getTabColorClasses(tab.color, false);
              
              return (
                <TabsContent key={tab.id} value={tab.id} className="min-h-[700px] p-6">
                  {/* Tab Header */}
                  <div className="flex items-center justify-between pb-6 border-b">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shadow-lg",
                        colorClasses.active
                      )}>
                        <tab.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{tab.label}</h3>
                        <p className="text-sm text-muted-foreground">{tab.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className={cn(
                          "text-white",
                          colorClasses.active
                        )}
                      >
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

      {/* Quick Actions Footer */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-gray-100/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-foreground">System Status</p>
                <p className="text-sm text-muted-foreground">All accounting modules operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Quick Entry
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Quick Report
              </Button>
              <Button variant="gradient-green" size="sm">
                <Calculator className="h-4 w-4 mr-2" />
                Balance Check
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};