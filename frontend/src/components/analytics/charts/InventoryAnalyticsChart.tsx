import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface InventoryAnalyticsChartProps {
  data: {
    total_value: number;
    turnover_rate: number;
    fast_moving_items?: Array<{ name: string; sales_velocity?: number; total_sold?: number; turnover_ratio?: number }>;
    slow_moving_items?: Array<{ name: string; sales_velocity?: number; total_sold?: number; turnover_ratio?: number }>;
    dead_stock_count: number;
    stock_optimization_suggestions?: Array<{ item: string; suggestion: string }>;
  };
  title?: string;
}

export const InventoryAnalyticsChart: React.FC<InventoryAnalyticsChartProps> = ({ 
  data, 
  title = "Inventory Analytics" 
}) => {
  // Prepare velocity data for chart
  const velocityData = [
    ...(data.fast_moving_items?.slice(0, 5).map(item => ({
      name: item.name,
      velocity: item.sales_velocity || item.turnover_ratio || item.total_sold || 0,
      type: 'Fast Moving',
      color: '#10b981'
    })) || []),
    ...(data.slow_moving_items?.slice(0, 5).map(item => ({
      name: item.name,
      velocity: item.sales_velocity || item.turnover_ratio || item.total_sold || 0,
      type: 'Slow Moving',
      color: '#ef4444'
    })) || [])
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="text-sm text-muted-foreground">
            Value: {formatCurrency(data.total_value)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Turnover Rate</div>
              <div className="text-lg font-bold">{formatNumber(data.turnover_rate, { minimumFractionDigits: 1 })}</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Dead Stock Items</div>
              <div className="text-lg font-bold text-red-600">{data.dead_stock_count}</div>
            </div>
          </div>

          {/* Sales Velocity Chart */}
          {velocityData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Sales Velocity</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={velocityData}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${formatNumber(value)} units/period`,
                      props.payload.type
                    ]}
                  />
                  <Bar 
                    dataKey="velocity" 
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Fast Moving Items */}
          {data.fast_moving_items && data.fast_moving_items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-green-600">Fast Moving Items</h4>
              <div className="space-y-1">
                {data.fast_moving_items.slice(0, 5).map((item, index) => {
                  const velocity = item.sales_velocity || item.turnover_ratio || item.total_sold || 0;
                  return (
                    <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm font-medium">{formatNumber(velocity)} units/period</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Slow Moving Items */}
          {data.slow_moving_items && data.slow_moving_items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-red-600">Slow Moving Items</h4>
              <div className="space-y-1">
                {data.slow_moving_items.slice(0, 5).map((item, index) => {
                  const velocity = item.sales_velocity || item.turnover_ratio || item.total_sold || 0;
                  return (
                    <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm font-medium">{formatNumber(velocity)} units/period</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {data.stock_optimization_suggestions && data.stock_optimization_suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Optimization Suggestions</h4>
              <div className="space-y-2">
                {data.stock_optimization_suggestions.slice(0, 3).map((suggestion, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <div className="text-sm font-medium">{suggestion.item}</div>
                    <div className="text-xs text-muted-foreground mt-1">{suggestion.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
