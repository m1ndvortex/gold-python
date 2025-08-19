import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface SalesAnalyticsChartProps {
  data: {
    total_sales: number;
    sales_by_period?: Record<string, number>;
    top_selling_items?: Array<{ name: string; sales?: number; revenue?: number; quantity_sold?: number }>;
    sales_by_category?: Record<string, number>;
    growth_rate: number;
    trend_direction: string;
  };
  title?: string;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];

export const SalesAnalyticsChart: React.FC<SalesAnalyticsChartProps> = ({ 
  data, 
  title = "Sales Analytics" 
}) => {
  // Convert sales by period to chart data
  const periodData = data.sales_by_period 
    ? Object.entries(data.sales_by_period).map(([period, sales]) => ({
        name: period,
        sales,
        formatted: formatCurrency(sales)
      }))
    : [];

  // Convert sales by category to pie chart data
  const categoryData = data.sales_by_category
    ? Object.entries(data.sales_by_category).map(([category, sales], index) => ({
        name: category,
        value: sales,
        formatted: formatCurrency(sales),
        fill: COLORS[index % COLORS.length]
      }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="text-sm text-muted-foreground">
            Total: {formatCurrency(data.total_sales)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Growth Rate Indicator */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Growth Rate:</div>
            <div className={`text-sm font-bold ${
              data.growth_rate > 0 ? 'text-green-600' : data.growth_rate < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {formatPercentage(data.growth_rate * 100)}
            </div>
            <div className="text-xs text-muted-foreground">({data.trend_direction})</div>
          </div>

          {/* Sales by Period */}
          {periodData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Sales by Period</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={periodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Sales"]}
                  />
                  <Bar dataKey="sales" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sales by Category */}
          {categoryData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Sales by Category</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Sales"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Selling Items */}
          {data.top_selling_items && data.top_selling_items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Top Selling Items</h4>
              <div className="space-y-2">
                {data.top_selling_items.slice(0, 5).map((item, index) => {
                  const value = item.sales || item.revenue || 0;
                  return (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
