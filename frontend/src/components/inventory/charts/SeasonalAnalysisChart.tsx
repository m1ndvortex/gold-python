import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { SeasonalInsightsReport } from '@/types/inventoryIntelligence';

interface SeasonalAnalysisChartProps {
  data: SeasonalInsightsReport[];
  title?: string;
}

export const SeasonalAnalysisChart: React.FC<SeasonalAnalysisChartProps> = ({ 
  data, 
  title = "Seasonal Analysis" 
}) => {
  // Prepare data for chart
  const chartData = data.map(item => ({
    season: item.season.charAt(0).toUpperCase() + item.season.slice(1),
    impact: item.total_impact,
    items_affected: item.items_affected,
    peak_month: item.peak_month
  }));

  const totalImpact = data.reduce((sum, item) => sum + item.total_impact, 0);
  const totalItemsAffected = data.reduce((sum, item) => sum + item.items_affected, 0);

  const getSeasonColor = (season: string) => {
    switch (season.toLowerCase()) {
      case 'spring': return '#10b981';
      case 'summer': return '#f59e0b';
      case 'fall': return '#ef4444';
      case 'winter': return '#3b82f6';
      case 'holiday': return '#8b5cf6';
      case 'ramadan': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const getSeasonIcon = (season: string) => {
    switch (season.toLowerCase()) {
      case 'spring': return '🌸';
      case 'summer': return '☀️';
      case 'fall': return '🍂';
      case 'winter': return '❄️';
      case 'holiday': return '🎄';
      case 'ramadan': return '🌙';
      default: return '📅';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalImpact)}
              </div>
              <div className="text-sm text-blue-700">Total Seasonal Impact</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalItemsAffected}</div>
              <div className="text-sm text-green-700">Items with Seasonal Patterns</div>
            </div>
          </div>

          {/* Seasonal Impact Chart */}
          {chartData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Seasonal Impact by Season</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="season" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'impact' ? formatCurrency(value) : formatNumber(value),
                      name === 'impact' ? 'Impact' : 'Items Affected'
                    ]}
                  />
                  <Bar dataKey="impact" fill="#3b82f6" name="impact" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Seasonal Insights Cards */}
          <div>
            <h4 className="text-sm font-medium mb-3">Seasonal Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map((season, index) => (
                <Card key={index} className="border-l-4" style={{ borderLeftColor: getSeasonColor(season.season) }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getSeasonIcon(season.season)}</span>
                        <div>
                          <h5 className="font-medium">{season.season.charAt(0).toUpperCase() + season.season.slice(1)} {season.year}</h5>
                          <p className="text-sm text-muted-foreground">Peak: {season.peak_month}</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {season.items_affected} items
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Impact:</span>
                        <span className="font-medium">{formatCurrency(season.total_impact)}</span>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-2">Recommendations:</p>
                        <ul className="space-y-1">
                          {season.seasonal_recommendations.slice(0, 3).map((rec, recIndex) => (
                            <li key={recIndex} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Detailed Seasonal Table */}
          {data.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Seasonal Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Season</th>
                      <th className="text-left p-2">Year</th>
                      <th className="text-center p-2">Peak Month</th>
                      <th className="text-right p-2">Items Affected</th>
                      <th className="text-right p-2">Total Impact</th>
                      <th className="text-left p-2">Top Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((season, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span>{getSeasonIcon(season.season)}</span>
                            <span className="font-medium">
                              {season.season.charAt(0).toUpperCase() + season.season.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">{season.year}</td>
                        <td className="p-2 text-center">{season.peak_month}</td>
                        <td className="p-2 text-right">{season.items_affected}</td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(season.total_impact)}
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {season.seasonal_recommendations[0] || 'No recommendations'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Data State */}
          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">📊</div>
              <p>No seasonal patterns detected yet</p>
              <p className="text-sm">Seasonal analysis requires more historical data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
