import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { StockOptimizationReport } from '@/types/inventoryIntelligence';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface StockOptimizationChartProps {
  data: StockOptimizationReport[];
  title?: string;
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

export const StockOptimizationChart: React.FC<StockOptimizationChartProps> = ({ 
  data, 
  title = "Stock Optimization" 
}) => {
  // Group recommendations by type
  const recommendationTypes = data.reduce((acc, item) => {
    const type = item.recommendation_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {} as Record<string, StockOptimizationReport[]>);

  // Calculate savings potential
  const totalSavings = data.reduce((sum, item) => sum + item.estimated_savings, 0);
  const highPriorityCount = data.filter(item => item.priority_level === 'high').length;

  // Prepare data for pie chart
  const pieData = Object.entries(recommendationTypes).map(([type, items], index) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: items.length,
    fill: COLORS[index % COLORS.length]
  }));

  // Prepare data for savings chart
  const savingsData = data
    .filter(item => item.estimated_savings > 0)
    .sort((a, b) => b.estimated_savings - a.estimated_savings)
    .slice(0, 10)
    .map(item => ({
      name: item.item_name.length > 15 ? item.item_name.substring(0, 12) + '...' : item.item_name,
      savings: item.estimated_savings,
      current_stock: item.current_stock,
      recommended_stock: item.recommended_stock || 0,
      priority: item.priority_level
    }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return AlertTriangle;
      case 'medium': return Clock;
      case 'low': return CheckCircle;
      default: return Clock;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="text-sm text-muted-foreground">
            {data.length} recommendations
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalSavings)}
              </div>
              <div className="text-sm text-green-700">Total Potential Savings</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
              <div className="text-sm text-red-700">High Priority Actions</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.length}</div>
              <div className="text-sm text-blue-700">Total Recommendations</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recommendation Types Distribution */}
            {pieData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Recommendation Types</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, "Count"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Potential Savings */}
            {savingsData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Top Savings Opportunities</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={savingsData}
                    layout="horizontal"
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={60} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), "Estimated Savings"]}
                    />
                    <Bar 
                      dataKey="savings" 
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* High Priority Recommendations */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-red-600">High Priority Recommendations</h4>
            <div className="space-y-3">
              {data
                .filter(item => item.priority_level === 'high')
                .slice(0, 5)
                .map((item, index) => {
                  const PriorityIcon = getPriorityIcon(item.priority_level);
                  return (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <PriorityIcon className="h-4 w-4 text-red-600" />
                            <span className="font-medium">{item.item_name}</span>
                            <Badge variant="destructive" className="text-xs">
                              {item.priority_level.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-2">
                            <strong>Recommendation:</strong> {item.recommendation_type.charAt(0).toUpperCase() + item.recommendation_type.slice(1)}
                          </div>
                          
                          <div className="text-sm text-gray-700 mb-3">
                            {item.reasoning}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Current Stock:</span>
                              <span className="ml-2 font-medium">{item.current_stock}</span>
                            </div>
                            {item.recommended_stock && (
                              <div>
                                <span className="text-muted-foreground">Recommended:</span>
                                <span className="ml-2 font-medium">{item.recommended_stock}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(item.estimated_savings)}
                          </div>
                          <div className="text-xs text-muted-foreground">Potential Savings</div>
                          <Button size="sm" className="mt-2">
                            Take Action
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {data.filter(item => item.priority_level === 'high').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No high priority recommendations at this time</p>
                  <p className="text-sm">Your inventory is well optimized!</p>
                </div>
              )}
            </div>
          </div>

          {/* All Recommendations Table */}
          <div>
            <h4 className="text-sm font-medium mb-3">All Recommendations</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Item</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-center p-2">Priority</th>
                    <th className="text-right p-2">Current</th>
                    <th className="text-right p-2">Recommended</th>
                    <th className="text-right p-2">Savings</th>
                    <th className="text-center p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((item, index) => {
                    const PriorityIcon = getPriorityIcon(item.priority_level);
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{item.item_name}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {item.recommendation_type}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getPriorityColor(item.priority_level)}`}>
                            <PriorityIcon className="h-3 w-3" />
                            {item.priority_level}
                          </div>
                        </td>
                        <td className="p-2 text-right">{item.current_stock}</td>
                        <td className="p-2 text-right">{item.recommended_stock || '-'}</td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(item.estimated_savings)}
                        </td>
                        <td className="p-2 text-center">
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
