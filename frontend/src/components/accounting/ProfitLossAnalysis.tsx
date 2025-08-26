import React, { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, BarChart3Icon, DollarSignIcon, PercentIcon, TrophyIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Bar, Pie } from 'react-chartjs-2';
import { Badge } from '../ui/badge';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const ProfitLossAnalysis: React.FC = () => {
  const { useProfitLossAnalysis } = useAccounting();
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: profitLossData, isLoading, error, refetch } = useProfitLossAnalysis(startDate, endDate);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const setCurrentMonth = () => {
    const now = new Date();
    setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
  };

  // Chart data for revenue vs expenses
  const revenueExpenseChartData = {
    labels: ['Revenue', 'Expenses', 'Net Profit'],
    datasets: [
      {
        label: 'Amount',
        data: [
          profitLossData?.total_revenue || 0,
          profitLossData?.total_expenses || 0,
          profitLossData?.net_profit || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          profitLossData?.net_profit && profitLossData.net_profit >= 0 
            ? 'rgba(59, 130, 246, 0.8)' 
            : 'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          profitLossData?.net_profit && profitLossData.net_profit >= 0 
            ? 'rgba(59, 130, 246, 1)' 
            : 'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for revenue breakdown
  const revenueBreakdownData = {
    labels: Object.keys(profitLossData?.revenue_breakdown || {}),
    datasets: [
      {
        data: Object.values(profitLossData?.revenue_breakdown || {}),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  // Chart data for expense breakdown
  const expenseBreakdownData = {
    labels: Object.keys(profitLossData?.expense_breakdown || {}),
    datasets: [
      {
        data: Object.values(profitLossData?.expense_breakdown || {}),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading profit & loss analysis: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Date Range Selector */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-purple-50/20 to-white">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b-2 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <BarChart3Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-purple-800">Profit & Loss Analysis</CardTitle>
              <p className="text-sm text-purple-600">Comprehensive financial performance analysis</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-purple-800">From:</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-purple-800">To:</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline-gradient-purple" size="sm" onClick={() => setQuickDateRange(7)}>
                Last 7 Days
              </Button>
              <Button variant="outline-gradient-purple" size="sm" onClick={() => setQuickDateRange(30)}>
                Last 30 Days
              </Button>
              <Button variant="outline-gradient-purple" size="sm" onClick={setCurrentMonth}>
                This Month
              </Button>
            </div>
            <Button
              variant="gradient-purple"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCwIcon className="h-6 w-6 animate-spin mr-2" />
              Loading profit & loss analysis...
            </div>
          </CardContent>
        </Card>
      ) : profitLossData ? (
        <>
          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-100/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUpIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-emerald-800">
                      Total Revenue
                    </CardTitle>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    Income
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(profitLossData.total_revenue)}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-emerald-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-4/5 rounded-full"></div>
                  </div>
                  <span className="text-xs text-emerald-600">Target</span>
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
                      Total Expenses
                    </CardTitle>
                  </div>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                    Costs
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-red-900">
                  {formatCurrency(profitLossData.total_expenses)}
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
                      <DollarSignIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-blue-800">
                      Net Profit
                    </CardTitle>
                  </div>
                  <Badge 
                    className={cn(
                      "text-xs",
                      profitLossData.net_profit >= 0 
                        ? "bg-green-100 text-green-700 hover:bg-green-100" 
                        : "bg-red-100 text-red-700 hover:bg-red-100"
                    )}
                  >
                    {profitLossData.net_profit >= 0 ? "Profit" : "Loss"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className={cn(
                  "text-2xl font-bold",
                  profitLossData.net_profit >= 0 ? 'text-green-900' : 'text-red-900'
                )}>
                  {formatCurrency(profitLossData.net_profit)}
                </div>
                <div className="flex items-center justify-between text-xs text-blue-600">
                  <span>Net Result</span>
                  <DollarSignIcon className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-100/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PercentIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-purple-800">
                      Profit Margin
                    </CardTitle>
                  </div>
                  <Badge 
                    className={cn(
                      "text-xs",
                      profitLossData.profit_margin >= 0 
                        ? "bg-green-100 text-green-700 hover:bg-green-100" 
                        : "bg-red-100 text-red-700 hover:bg-red-100"
                    )}
                  >
                    {profitLossData.profit_margin >= 0 ? "Positive" : "Negative"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className={cn(
                  "text-2xl font-bold",
                  profitLossData.profit_margin >= 0 ? 'text-green-900' : 'text-red-900'
                )}>
                  {formatPercentage(profitLossData.profit_margin)}
                </div>
                <div className="flex items-center justify-between text-xs text-purple-600">
                  <span>Efficiency</span>
                  <PercentIcon className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Revenue vs Expenses Chart */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/30 to-white">
            <CardHeader className="bg-gradient-to-r from-purple-50/50 to-violet-50/30 border-b border-purple-200">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md">
                  <BarChart3Icon className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-purple-800">Revenue vs Expenses Overview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <Bar data={revenueExpenseChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Revenue and Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50/30 to-white">
              <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-green-50/30 border-b border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                    <TrendingUpIcon className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-emerald-800">Revenue Breakdown by Category</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {Object.keys(profitLossData.revenue_breakdown).length > 0 ? (
                  <div className="h-80">
                    <Pie data={revenueBreakdownData} options={pieChartOptions} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No revenue data available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50/30 to-white">
              <CardHeader className="bg-gradient-to-r from-red-50/50 to-rose-50/30 border-b border-red-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
                    <TrendingDownIcon className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-red-800">Expense Breakdown by Category</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {Object.keys(profitLossData.expense_breakdown).length > 0 ? (
                  <div className="h-80">
                    <Pie data={expenseBreakdownData} options={pieChartOptions} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No expense data available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Top Performing Categories */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/30 to-white">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <TrophyIcon className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-blue-800">Top Performing Categories</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {profitLossData.top_performing_categories.length > 0 ? (
                <div className="space-y-4">
                  {profitLossData.top_performing_categories.map((category: any, index: number) => (
                    <div key={category.category} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-blue-800">{category.category}</div>
                          <div className="text-xs text-blue-600">Performance Leader</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-700 text-lg">
                          {formatCurrency(category.revenue)}
                        </div>
                        <div className="text-xs text-emerald-600">Revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No category data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
};