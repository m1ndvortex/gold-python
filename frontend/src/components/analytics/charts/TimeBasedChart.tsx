import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface TimeBasedChartProps {
  data: {
    daily_patterns?: Record<string, number>;
    weekly_patterns?: Record<string, number>;
    monthly_trends?: Record<string, number>;
    year_over_year?: Record<string, number>;
  };
  title?: string;
}

export const TimeBasedChart: React.FC<TimeBasedChartProps> = ({ 
  data, 
  title = "Time-Based Analytics" 
}) => {
  // Convert daily patterns to chart data
  const dailyData = data.daily_patterns 
    ? Object.entries(data.daily_patterns).map(([day, value]) => ({
        name: day,
        value,
        formatted: formatCurrency(value)
      }))
    : [];

  // Convert monthly trends to chart data
  const monthlyData = data.monthly_trends
    ? Object.entries(data.monthly_trends).map(([month, value]) => ({
        name: month,
        value,
        formatted: formatCurrency(value)
      }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {dailyData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Daily Patterns</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Sales"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {monthlyData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Monthly Trends</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Sales"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
