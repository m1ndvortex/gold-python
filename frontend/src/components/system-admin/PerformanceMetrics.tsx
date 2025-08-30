import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { usePerformanceMetrics } from '../../hooks/useSystemAdmin';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const TIME_RANGES = [
  { value: '1h', label: 'Last Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' }
];

export const PerformanceMetrics: React.FC = () => {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState('1h');
  const { data: metrics, isLoading, error } = usePerformanceMetrics(timeRange);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMetricColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.7) return 'text-green-600';
    if (value <= threshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (value: number, threshold: number) => {
    if (value <= threshold * 0.7) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (value <= threshold) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const formatChartData = (chartData: any[]) => {
    return chartData.map(point => ({
      ...point,
      time: new Date(point.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{t('performance.error')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-100/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span>{t('performance.title')}</span>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {t(`performance.timeRange.${range.value}`) || range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.name} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t(`performance.metrics.${metric.name}`) || metric.name}
                </span>
                {getTrendIcon(metric.trend)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn('text-2xl font-bold', getMetricColor(metric.value, metric.threshold))}>
                    {metric.value.toFixed(1)}{metric.unit}
                  </span>
                  {getStatusIcon(metric.value, metric.threshold)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('performance.threshold')}</span>
                  <span>{metric.threshold}{metric.unit}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics.filter(m => m.chartData && m.chartData.length > 0).map((metric) => (
          <Card key={`chart-${metric.name}`} className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{t(`performance.metrics.${metric.name}`) || metric.name}</span>
                <Badge variant="outline" className="text-xs">
                  {metric.unit}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {metric.name.includes('response') || metric.name.includes('time') ? (
                    <LineChart data={formatChartData(metric.chartData)}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#8b5cf6' }}
                      />
                    </LineChart>
                  ) : (
                    <AreaChart data={formatChartData(metric.chartData)}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Summary */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>{t('performance.summary.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <span className="text-sm font-medium text-green-600">{t('performance.summary.healthy')}</span>
              <div className="text-2xl font-bold text-green-600">
                {metrics.filter(m => m.value <= m.threshold * 0.7).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('performance.summary.healthyDesc')}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-yellow-600">{t('performance.summary.warning')}</span>
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.filter(m => m.value > m.threshold * 0.7 && m.value <= m.threshold).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('performance.summary.warningDesc')}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-red-600">{t('performance.summary.critical')}</span>
              <div className="text-2xl font-bold text-red-600">
                {metrics.filter(m => m.value > m.threshold).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('performance.summary.criticalDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};