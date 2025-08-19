import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

interface CustomerAnalyticsChartProps {
  data: {
    total_customers: number;
    new_customers: number;
    retention_rate: number;
    average_order_value: number;
    customer_lifetime_value: number;
    top_customers?: Array<{ name: string; total_purchases?: number; total_revenue?: number; order_count?: number }>;
  };
  title?: string;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export const CustomerAnalyticsChart: React.FC<CustomerAnalyticsChartProps> = ({ 
  data, 
  title = "Customer Analytics" 
}) => {
  // Customer distribution data for pie chart
  const customerDistribution = [
    { name: 'Existing Customers', value: data.total_customers - data.new_customers, fill: COLORS[0] },
    { name: 'New Customers', value: data.new_customers, fill: COLORS[1] }
  ];

  // Top customers data for bar chart
  const topCustomersData = data.top_customers?.slice(0, 5).map(customer => {
    const value = customer.total_purchases || customer.total_revenue || 0;
    return {
      name: customer.name.length > 15 ? customer.name.substring(0, 12) + '...' : customer.name,
      purchases: value,
      formatted: formatCurrency(value)
    };
  }) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="text-sm text-muted-foreground">
            Total: {formatNumber(data.total_customers)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">New Customers</div>
              <div className="text-lg font-bold text-green-600">{formatNumber(data.new_customers)}</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Retention Rate</div>
              <div className="text-lg font-bold text-blue-600">{formatPercentage(data.retention_rate * 100)}</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Avg Order Value</div>
              <div className="text-lg font-bold">{formatCurrency(data.average_order_value)}</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Customer LTV</div>
              <div className="text-lg font-bold">{formatCurrency(data.customer_lifetime_value)}</div>
            </div>
          </div>

          {/* Customer Distribution */}
          <div>
            <h4 className="text-sm font-medium mb-2">Customer Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={customerDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatNumber(value), "Customers"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Customers */}
          {topCustomersData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Top Customers by Purchases</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={topCustomersData}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Total Purchases"]}
                  />
                  <Bar 
                    dataKey="purchases" 
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Customer Insights */}
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <div className="text-sm font-medium">Customer Growth</div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.new_customers > 0 
                  ? `Growing customer base with ${data.new_customers} new customers`
                  : 'No new customers this period - consider marketing initiatives'
                }
              </div>
            </div>
            
            <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
              <div className="text-sm font-medium">Retention Performance</div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.retention_rate > 0.7 
                  ? 'Excellent customer retention - customers are satisfied'
                  : 'Consider improving customer experience to boost retention'
                }
              </div>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
              <div className="text-sm font-medium">Value Optimization</div>
              <div className="text-xs text-muted-foreground mt-1">
                Average order value: {formatCurrency(data.average_order_value)} - 
                {data.average_order_value > data.customer_lifetime_value * 0.1 
                  ? ' Strong per-transaction value'
                  : ' Opportunity to increase order sizes'
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
