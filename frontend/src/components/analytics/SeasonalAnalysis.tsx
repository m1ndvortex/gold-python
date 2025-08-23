import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar, TrendingUp, Snowflake, Sun, Leaf, Flower } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface SeasonalPattern {
  category_id: string;
  category_name: string;
  seasonal_index: { [month: string]: number };
  peak_months: string[];
  low_months: string[];
  seasonality_strength: number;
  forecast_next_month: number;
  confidence_interval: [number, number];
}

interface SeasonalAnalysisProps {
  categoryId?: string;
  onCategorySelect?: (categoryId: string) => void;
}

const SeasonalAnalysis: React.FC<SeasonalAnalysisProps> = ({
  categoryId,
  onCategorySelect
}) => {
  const [patterns, setPatterns] = useState<SeasonalPattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<SeasonalPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthsBack, setMonthsBack] = useState<number>(24);

  useEffect(() => {
    fetchSeasonalPatterns();
  }, [categoryId, monthsBack]);

  const fetchSeasonalPatterns = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (categoryId) params.append('category_id', categoryId);
      params.append('months_back', monthsBack.toString());

      const response = await fetch(`/api/category-intelligence/seasonal-patterns?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch seasonal patterns');
      }

      const data = await response.json();
      setPatterns(data);
      
      // Auto-select first pattern if none selected
      if (data.length > 0 && !selectedPattern) {
        setSelectedPattern(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNumber: string) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[parseInt(monthNumber) - 1] || monthNumber;
  };

  const getSeasonIcon = (month: string) => {
    const monthNum = parseInt(month);
    if (monthNum >= 12 || monthNum <= 2) return <Snowflake className="h-4 w-4 text-blue-500" />;
    if (monthNum >= 3 && monthNum <= 5) return <Flower className="h-4 w-4 text-pink-500" />;
    if (monthNum >= 6 && monthNum <= 8) return <Sun className="h-4 w-4 text-yellow-500" />;
    return <Leaf className="h-4 w-4 text-orange-500" />;
  };

  const getSeasonalityColor = (strength: number) => {
    if (strength > 0.7) return 'bg-red-100 text-red-800 border-red-200';
    if (strength > 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (strength > 0.2) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSeasonalityLabel = (strength: number) => {
    if (strength > 0.7) return 'Highly Seasonal';
    if (strength > 0.4) return 'Moderately Seasonal';
    if (strength > 0.2) return 'Slightly Seasonal';
    return 'Not Seasonal';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const prepareChartData = (pattern: SeasonalPattern) => {
    return Object.entries(pattern.seasonal_index).map(([month, index]) => ({
      month: getMonthName(month),
      monthNumber: parseInt(month),
      seasonalIndex: index,
      isPeak: pattern.peak_months.includes(month),
      isLow: pattern.low_months.includes(month)
    })).sort((a, b) => a.monthNumber - b.monthNumber);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Analysis</CardTitle>
          <CardDescription>Analyzing seasonal patterns...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchSeasonalPatterns} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const chartData = selectedPattern ? prepareChartData(selectedPattern) : [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Seasonal Pattern Analysis</span>
              </CardTitle>
              <CardDescription>
                Pattern recognition and demand forecasting
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Select value={monthsBack.toString()} onValueChange={(value) => setMonthsBack(parseInt(value))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Analysis period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                  <SelectItem value="36">36 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {patterns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No seasonal patterns found. Need at least 12 months of data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
              <CardDescription>Select a category to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {patterns.map((pattern) => (
                  <div
                    key={pattern.category_id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPattern?.category_id === pattern.category_id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPattern(pattern)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{pattern.category_name}</h4>
                      <Badge className={getSeasonalityColor(pattern.seasonality_strength)}>
                        {getSeasonalityLabel(pattern.seasonality_strength)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Strength: {(pattern.seasonality_strength * 100).toFixed(1)}%</p>
                      <p>Forecast: {formatCurrency(pattern.forecast_next_month)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seasonal Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedPattern ? `${selectedPattern.category_name} - Seasonal Index` : 'Select a Category'}
              </CardTitle>
              <CardDescription>
                Monthly seasonal patterns (1.0 = average, &gt;1.0 = above average, &lt;1.0 = below average)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPattern && (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [value.toFixed(2), 'Seasonal Index']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Bar dataKey="seasonalIndex">
                        {chartData.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.isPeak ? '#10b981' : entry.isLow ? '#ef4444' : '#3b82f6'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Pattern Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-700">Peak Months</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedPattern.peak_months.map((month) => (
                          <Badge key={month} className="bg-green-100 text-green-800">
                            {getSeasonIcon(month)}
                            <span className="ml-1">{getMonthName(month)}</span>
                          </Badge>
                        ))}
                        {selectedPattern.peak_months.length === 0 && (
                          <span className="text-sm text-gray-500">No clear peaks</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-red-700">Low Months</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedPattern.low_months.map((month) => (
                          <Badge key={month} className="bg-red-100 text-red-800">
                            {getSeasonIcon(month)}
                            <span className="ml-1">{getMonthName(month)}</span>
                          </Badge>
                        ))}
                        {selectedPattern.low_months.length === 0 && (
                          <span className="text-sm text-gray-500">No clear lows</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-700">Next Month Forecast</h4>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">
                          {formatCurrency(selectedPattern.forecast_next_month)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Range: {formatCurrency(selectedPattern.confidence_interval[0])} - {formatCurrency(selectedPattern.confidence_interval[1])}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Insights */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Insights Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {patterns.length}
                </p>
                <p className="text-sm text-gray-600">Categories Analyzed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {patterns.filter(p => p.seasonality_strength > 0.7).length}
                </p>
                <p className="text-sm text-gray-600">Highly Seasonal</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {patterns.reduce((sum, p) => sum + p.forecast_next_month, 0).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0
                  })}
                </p>
                <p className="text-sm text-gray-600">Total Forecast</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {(patterns.reduce((sum, p) => sum + p.seasonality_strength, 0) / patterns.length * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Avg Seasonality</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SeasonalAnalysis;