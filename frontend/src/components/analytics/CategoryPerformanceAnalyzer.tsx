import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { TrendingUp, TrendingDown, Minus, BarChart3, Package, DollarSign } from 'lucide-react';

interface CategoryPerformance {
  category_id: string;
  category_name: string;
  total_revenue: number;
  total_quantity_sold: number;
  avg_transaction_value: number;
  profit_margin: number;
  velocity_score: number;
  performance_tier: 'fast' | 'medium' | 'slow' | 'dead';
  contribution_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';
  trend_percentage: number;
}

interface CategoryPerformanceAnalyzerProps {
  startDate?: Date;
  endDate?: Date;
  onCategorySelect?: (categoryId: string) => void;
}

const CategoryPerformanceAnalyzer: React.FC<CategoryPerformanceAnalyzerProps> = ({
  startDate,
  endDate,
  onCategorySelect
}) => {
  const [performances, setPerformances] = useState<CategoryPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('velocity_score');
  const [filterTier, setFilterTier] = useState<string>('all');

  useEffect(() => {
    fetchCategoryPerformance();
  }, [startDate, endDate]);

  const fetchCategoryPerformance = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate.toISOString());
      if (endDate) params.append('end_date', endDate.toISOString());

      const response = await fetch(`/api/category-intelligence/performance?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch category performance data');
      }

      const data = await response.json();
      setPerformances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'fast': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'slow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'dead': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'fast': return 'Fast Mover';
      case 'medium': return 'Medium Mover';
      case 'slow': return 'Slow Mover';
      case 'dead': return 'Dead Stock';
      default: return tier;
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const sortedAndFilteredPerformances = performances
    .filter(perf => filterTier === 'all' || perf.performance_tier === filterTier)
    .sort((a, b) => {
      switch (sortBy) {
        case 'velocity_score':
          return b.velocity_score - a.velocity_score;
        case 'revenue':
          return b.total_revenue - a.total_revenue;
        case 'profit_margin':
          return b.profit_margin - a.profit_margin;
        case 'contribution':
          return b.contribution_percentage - a.contribution_percentage;
        case 'name':
          return a.category_name.localeCompare(b.category_name);
        default:
          return 0;
      }
    });

  const performanceSummary = {
    totalCategories: performances.length,
    fastMovers: performances.filter(p => p.performance_tier === 'fast').length,
    slowMovers: performances.filter(p => p.performance_tier === 'slow').length,
    deadStock: performances.filter(p => p.performance_tier === 'dead').length,
    totalRevenue: performances.reduce((sum, p) => sum + p.total_revenue, 0)
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span>Category Performance Analyzer</span>
          </CardTitle>
          <CardDescription>Analyzing category performance...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gradient-to-r from-blue-500 to-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-100/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span>Category Performance Analyzer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchCategoryPerformance} className="mt-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold">{performanceSummary.totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-100/50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Fast Movers</p>
                <p className="text-2xl font-bold text-green-600">{performanceSummary.fastMovers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-100/50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Dead Stock</p>
                <p className="text-2xl font-bold text-red-600">{performanceSummary.deadStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100/50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(performanceSummary.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Card */}
      <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <span>Category Performance Analysis</span>
              </CardTitle>
              <CardDescription>
                Fast/slow mover identification with performance metrics
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="fast">Fast Movers</SelectItem>
                  <SelectItem value="medium">Medium Movers</SelectItem>
                  <SelectItem value="slow">Slow Movers</SelectItem>
                  <SelectItem value="dead">Dead Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="velocity_score">Velocity Score</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="profit_margin">Profit Margin</SelectItem>
                  <SelectItem value="contribution">Contribution</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedAndFilteredPerformances.map((performance) => (
              <div
                key={performance.category_id}
                className="border-0 rounded-lg p-4 bg-gradient-to-r from-slate-50 to-slate-100/80 hover:shadow-lg cursor-pointer transition-all duration-300"
                onClick={() => onCategorySelect?.(performance.category_id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg">{performance.category_name}</h3>
                    <Badge className={getTierColor(performance.performance_tier)}>
                      {getTierLabel(performance.performance_tier)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(performance.trend_direction)}
                    <span className="text-sm text-gray-600">
                      {formatPercentage(performance.trend_percentage)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Revenue</p>
                    <p className="font-semibold">{formatCurrency(performance.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Quantity Sold</p>
                    <p className="font-semibold">{performance.total_quantity_sold.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Transaction</p>
                    <p className="font-semibold">{formatCurrency(performance.avg_transaction_value)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Profit Margin</p>
                    <p className="font-semibold">{formatPercentage(performance.profit_margin)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Contribution</p>
                    <p className="font-semibold">{formatPercentage(performance.contribution_percentage)}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Velocity Score</span>
                    <span className="font-semibold">{performance.velocity_score.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(performance.velocity_score * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}

            {sortedAndFilteredPerformances.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No categories found matching the current filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryPerformanceAnalyzer;