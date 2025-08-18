import React, { useState } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, BarChart3Icon } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Bar, Pie } from 'react-chartjs-2';
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
      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3Icon className="h-5 w-5" />
            Profit & Loss Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">From:</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">To:</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>
                Last 7 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>
                Last 30 Days
              </Button>
              <Button variant="outline" size="sm" onClick={setCurrentMonth}>
                This Month
              </Button>
            </div>
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUpIcon className="h-4 w-4 text-green-600" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(profitLossData.total_revenue)}
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
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(profitLossData.total_expenses)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  profitLossData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(profitLossData.net_profit)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Profit Margin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  profitLossData.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(profitLossData.profit_margin)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue vs Expenses Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar data={revenueExpenseChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Revenue and Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown by Category</CardTitle>
              </CardHeader>
              <CardContent>
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
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown by Category</CardTitle>
              </CardHeader>
              <CardContent>
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

          {/* Top Performing Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {profitLossData.top_performing_categories.length > 0 ? (
                <div className="space-y-4">
                  {profitLossData.top_performing_categories.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{category.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {formatCurrency(category.revenue)}
                        </div>
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