import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { formatNumber, formatDate } from '@/lib/utils';
import { TurnoverAnalysisReport } from '@/types/inventoryIntelligence';

interface TurnoverAnalysisChartProps {
  data: TurnoverAnalysisReport[];
  title?: string;
  detailed?: boolean;
}

export const TurnoverAnalysisChart: React.FC<TurnoverAnalysisChartProps> = ({ 
  data, 
  title = "Turnover Analysis",
  detailed = false 
}) => {
  // Transform data for charts
  const chartData = data.map(item => ({
    name: item.item_name.length > 15 ? item.item_name.substring(0, 12) + '...' : item.item_name,
    turnover_ratio: item.turnover_ratio,
    velocity_score: item.velocity_score,
    current_stock: item.current_stock,
    classification: item.movement_classification,
    trend: item.trend_direction,
    days_to_stockout: item.days_to_stockout
  }));

  // Separate data by classification
  const fastMovers = data.filter(item => item.movement_classification === 'fast');
  const slowMovers = data.filter(item => item.movement_classification === 'slow');
  const deadStock = data.filter(item => item.movement_classification === 'dead');

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'fast': return '#10b981';
      case 'normal': return '#3b82f6';
      case 'slow': return '#f59e0b';
      case 'dead': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{fastMovers.length}</div>
              <div className="text-sm text-green-700">Fast Moving</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{slowMovers.length}</div>
              <div className="text-sm text-yellow-700">Slow Moving</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{deadStock.length}</div>
              <div className="text-sm text-red-700">Dead Stock</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.length}</div>
              <div className="text-sm text-blue-700">Total Items</div>
            </div>
          </div>

          {/* Turnover Ratio Chart */}
          {chartData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Turnover Ratio by Item</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.slice(0, detailed ? 20 : 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatNumber(value, { minimumFractionDigits: 1 }),
                      name === 'turnover_ratio' ? 'Turnover Ratio' : name
                    ]}
                  />
                  <Bar 
                    dataKey="turnover_ratio" 
                    fill={(entry: any) => getClassificationColor(entry.classification)}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Velocity vs Stock Scatter Plot */}
          {detailed && chartData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Velocity Score vs Current Stock</h4>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="current_stock" 
                    name="Current Stock"
                    type="number"
                  />
                  <YAxis 
                    dataKey="velocity_score" 
                    name="Velocity Score"
                    type="number"
                    domain={[0, 1]}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatNumber(value, { minimumFractionDigits: 2 }), "Value"]}
                    labelFormatter={(label) => `Item: ${label}`}
                  />
                  <Scatter 
                    dataKey="velocity_score" 
                    fill="#3b82f6"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top/Bottom Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-green-600">Top Performers (Fast Moving)</h4>
              <div className="space-y-2">
                {fastMovers.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.item_name}</div>
                      <div className="text-xs text-muted-foreground">{item.category_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatNumber(item.turnover_ratio, { minimumFractionDigits: 1 })}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.days_to_stockout ? `${item.days_to_stockout}d` : 'In Stock'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {fastMovers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No fast-moving items found
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Performers */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-red-600">Attention Needed (Slow/Dead Stock)</h4>
              <div className="space-y-2">
                {[...slowMovers, ...deadStock].slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.item_name}</div>
                      <div className="text-xs text-muted-foreground">{item.category_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatNumber(item.turnover_ratio, { minimumFractionDigits: 1 })}
                      </div>
                      <Badge 
                        variant={item.movement_classification === 'dead' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {item.movement_classification.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
                {[...slowMovers, ...deadStock].length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    All items performing well
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Table (only in detailed view) */}
          {detailed && (
            <div>
              <h4 className="text-sm font-medium mb-3">Detailed Analysis</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Item</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-right p-2">Stock</th>
                      <th className="text-right p-2">Turnover</th>
                      <th className="text-right p-2">Velocity</th>
                      <th className="text-center p-2">Classification</th>
                      <th className="text-center p-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{item.item_name}</td>
                        <td className="p-2 text-muted-foreground">{item.category_name}</td>
                        <td className="p-2 text-right">{item.current_stock}</td>
                        <td className="p-2 text-right">
                          {formatNumber(item.turnover_ratio, { minimumFractionDigits: 1 })}
                        </td>
                        <td className="p-2 text-right">
                          {formatNumber(item.velocity_score, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant={
                              item.movement_classification === 'fast' ? 'default' :
                              item.movement_classification === 'slow' ? 'secondary' :
                              item.movement_classification === 'dead' ? 'destructive' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {item.movement_classification.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <span className={
                            item.trend_direction === 'increasing' ? 'text-green-600' :
                            item.trend_direction === 'decreasing' ? 'text-red-600' :
                            'text-gray-600'
                          }>
                            {item.trend_direction}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
