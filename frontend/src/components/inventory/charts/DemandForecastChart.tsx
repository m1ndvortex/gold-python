import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { DemandForecastReport } from '@/types/inventoryIntelligence';

interface DemandForecastChartProps {
  data: DemandForecastReport[];
  title?: string;
}

export const DemandForecastChart: React.FC<DemandForecastChartProps> = ({ 
  data, 
  title = "Demand Forecasting" 
}) => {
  // Prepare data for charts
  const forecastData = data.slice(0, 10).map(item => ({
    name: item.item_name.length > 15 ? item.item_name.substring(0, 12) + '...' : item.item_name,
    current_stock: item.current_stock,
    demand_7d: item.predicted_demand_7_days,
    demand_30d: item.predicted_demand_30_days,
    confidence: item.confidence_score * 100,
    recommended_action: item.recommended_action
  }));

  const averageConfidence = data.length > 0 
    ? data.reduce((sum, item) => sum + item.confidence_score, 0) / data.length 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="text-sm text-muted-foreground">
            Avg Confidence: {formatPercentage(averageConfidence * 100)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.length}</div>
              <div className="text-sm text-blue-700">Items Forecasted</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(averageConfidence * 100)}
              </div>
              <div className="text-sm text-green-700">Avg Confidence</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {data.filter(item => item.recommended_action.toLowerCase().includes('reorder')).length}
              </div>
              <div className="text-sm text-yellow-700">Reorder Needed</div>
            </div>
          </div>

          {/* Demand vs Stock Chart */}
          {forecastData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">7-Day Demand vs Current Stock</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="current_stock" fill="#3b82f6" name="Current Stock" />
                  <Bar dataKey="demand_7d" fill="#f59e0b" name="7-Day Demand" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Confidence Scores */}
          {forecastData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Forecast Confidence Levels</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Confidence"]} />
                  <Line 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detailed Forecast Table */}
          <div>
            <h4 className="text-sm font-medium mb-3">Detailed Forecasts</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Item</th>
                    <th className="text-right p-2">Current Stock</th>
                    <th className="text-right p-2">7-Day Demand</th>
                    <th className="text-right p-2">30-Day Demand</th>
                    <th className="text-center p-2">Confidence</th>
                    <th className="text-left p-2">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{item.item_name}</td>
                      <td className="p-2 text-right">{item.current_stock}</td>
                      <td className="p-2 text-right">
                        {formatNumber(item.predicted_demand_7_days, { minimumFractionDigits: 1 })}
                      </td>
                      <td className="p-2 text-right">
                        {formatNumber(item.predicted_demand_30_days, { minimumFractionDigits: 1 })}
                      </td>
                      <td className="p-2 text-center">
                        <Badge 
                          variant={
                            item.confidence_score >= 0.8 ? 'default' :
                            item.confidence_score >= 0.6 ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {formatPercentage(item.confidence_score * 100)}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm">
                        <span className={
                          item.recommended_action.toLowerCase().includes('reorder') ? 'text-red-600' :
                          item.recommended_action.toLowerCase().includes('reduce') ? 'text-yellow-600' :
                          'text-green-600'
                        }>
                          {item.recommended_action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
