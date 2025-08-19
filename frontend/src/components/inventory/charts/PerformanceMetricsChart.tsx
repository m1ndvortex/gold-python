import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import { InventoryPerformanceMetrics } from '@/types/inventoryIntelligence';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceMetricsChartProps {
  data?: InventoryPerformanceMetrics;
  title?: string;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export const PerformanceMetricsChart: React.FC<PerformanceMetricsChartProps> = ({ 
  data, 
  title = "Performance Metrics" 
}) => {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📊</div>
            <p>No performance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for inventory distribution pie chart
  const inventoryDistribution = [
    { name: 'Fast Moving', value: data.fast_moving_items_count, fill: COLORS[0] },
    { name: 'Slow Moving', value: data.slow_moving_items_count, fill: COLORS[1] },
    { name: 'Dead Stock', value: data.dead_stock_items_count, fill: COLORS[2] },
    { 
      name: 'Normal', 
      value: data.total_items_count - data.fast_moving_items_count - data.slow_moving_items_count - data.dead_stock_items_count, 
      fill: COLORS[3] 
    }
  ].filter(item => item.value > 0);

  // Prepare cost breakdown data
  const costBreakdown = [
    { name: 'Holding', value: data.total_holding_cost, color: '#3b82f6' },
    { name: 'Ordering', value: data.total_ordering_cost, color: '#f59e0b' },
    { name: 'Stockout', value: data.total_stockout_cost, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const getEfficiencyColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'average': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getOptimizationScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge className={getEfficiencyColor(data.efficiency_rating)}>
            {data.efficiency_rating.charAt(0).toUpperCase() + data.efficiency_rating.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.total_inventory_value)}
              </div>
              <div className="text-sm text-blue-700">Total Value</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(data.average_turnover_ratio, { minimumFractionDigits: 1 })}
              </div>
              <div className="text-sm text-green-700">Avg Turnover</div>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {formatPercentage(data.carrying_cost_percentage)}
              </div>
              <div className="text-sm text-yellow-700">Carrying Cost %</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className={`text-2xl font-bold ${getOptimizationScoreColor(data.optimization_score)}`}>
                {formatPercentage(data.optimization_score * 100)}
              </div>
              <div className="text-sm text-purple-700">Optimization Score</div>
            </div>
          </div>

          {/* Optimization Score Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Optimization Score</h4>
              <span className="text-sm text-muted-foreground">
                {formatPercentage(data.optimization_score * 100)}
              </span>
            </div>
            <Progress value={data.optimization_score * 100} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Poor</span>
              <span>Average</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventory Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-3">Inventory Classification</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={inventoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inventoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, "Items"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Cost Breakdown */}
            {costBreakdown.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Cost Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={costBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), "Cost"]}
                    />
                    <Bar dataKey="value" fill={(entry: any) => entry.color} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Indicators */}
            <div>
              <h4 className="text-sm font-medium mb-3">Performance Indicators</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Inventory-to-Sales Ratio</span>
                  </div>
                  <span className="font-medium">
                    {formatNumber(data.inventory_to_sales_ratio, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Stockout Incidents</span>
                  </div>
                  <span className="font-medium text-red-600">{data.stockout_incidents}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Overstock Incidents</span>
                  </div>
                  <span className="font-medium text-yellow-600">{data.overstock_incidents}</span>
                </div>
              </div>
            </div>

            {/* Cost Analysis */}
            <div>
              <h4 className="text-sm font-medium mb-3">Cost Analysis</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Total Holding Cost</span>
                  <span className="font-medium">{formatCurrency(data.total_holding_cost)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Total Ordering Cost</span>
                  <span className="font-medium">{formatCurrency(data.total_ordering_cost)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Total Stockout Cost</span>
                  <span className="font-medium text-red-600">{formatCurrency(data.total_stockout_cost)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <span className="text-sm font-medium">Total Cost</span>
                  <span className="font-bold">
                    {formatCurrency(data.total_holding_cost + data.total_ordering_cost + data.total_stockout_cost)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Efficiency Rating Details */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Overall Efficiency Rating</h4>
              <div className="flex items-center gap-2">
                {data.efficiency_rating === 'excellent' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {data.efficiency_rating === 'good' && <TrendingUp className="h-5 w-5 text-blue-600" />}
                {data.efficiency_rating === 'average' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                {data.efficiency_rating === 'poor' && <TrendingDown className="h-5 w-5 text-red-600" />}
                <Badge className={getEfficiencyColor(data.efficiency_rating)}>
                  {data.efficiency_rating.toUpperCase()}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.efficiency_rating === 'excellent' && 
                'Your inventory is performing exceptionally well with optimal turnover and minimal waste.'}
              {data.efficiency_rating === 'good' && 
                'Good inventory performance with room for minor improvements in optimization.'}
              {data.efficiency_rating === 'average' && 
                'Average performance. Consider implementing optimization recommendations to improve efficiency.'}
              {data.efficiency_rating === 'poor' && 
                'Inventory efficiency needs immediate attention. Review stock levels and turnover rates.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
