import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useSystemHealth } from '../../hooks/useSystemAdmin';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Activity,
  Server,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const SystemHealthOverview: React.FC = () => {
  const { data: systemHealth, isLoading, error } = useSystemHealth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
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
    );
  }

  if (error || !systemHealth) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span>{t('system.health.error')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Overall System Health */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-100/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span>{t('system.health.overall')}</span>
            </CardTitle>
            <Badge 
              variant={systemHealth.overall.status === 'healthy' ? 'default' : 'destructive'}
              className={cn(
                'px-3 py-1',
                systemHealth.overall.status === 'healthy' && 'bg-green-100 text-green-700 border-green-200',
                systemHealth.overall.status === 'warning' && 'bg-yellow-100 text-yellow-700 border-yellow-200',
                systemHealth.overall.status === 'critical' && 'bg-red-100 text-red-700 border-red-200'
              )}
            >
              {getStatusIcon(systemHealth.overall.status)}
              <span className="ml-1">{t(`system.status.${systemHealth.overall.status}`)}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-700">
                {systemHealth.overall.score}/100
              </span>
              <span className="text-sm text-muted-foreground">
                {t('system.health.score')}
              </span>
            </div>
            <Progress 
              value={systemHealth.overall.score} 
              className="h-2"
              indicatorClassName={cn(
                systemHealth.overall.score >= 80 && 'bg-green-500',
                systemHealth.overall.score >= 60 && systemHealth.overall.score < 80 && 'bg-yellow-500',
                systemHealth.overall.score < 60 && 'bg-red-500'
              )}
            />
            <p className="text-sm text-muted-foreground">
              {systemHealth.overall.message}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU Usage */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-blue-500" />
                <span>{t('system.resources.cpu')}</span>
              </span>
              {getTrendIcon(systemHealth.resources.cpu.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {systemHealth.resources.cpu.current}%
                </span>
                <Badge variant="outline" className="text-xs">
                  Avg: {systemHealth.resources.cpu.average}%
                </Badge>
              </div>
              <Progress 
                value={systemHealth.resources.cpu.current} 
                className="h-2"
                indicatorClassName={cn(
                  systemHealth.resources.cpu.current < 70 && 'bg-green-500',
                  systemHealth.resources.cpu.current >= 70 && systemHealth.resources.cpu.current < 90 && 'bg-yellow-500',
                  systemHealth.resources.cpu.current >= 90 && 'bg-red-500'
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-purple-500" />
                <span>{t('system.resources.memory')}</span>
              </span>
              {getTrendIcon(systemHealth.resources.memory.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {systemHealth.resources.memory.percentage}%
                </span>
                <Badge variant="outline" className="text-xs">
                  {(systemHealth.resources.memory.used / 1024 / 1024 / 1024).toFixed(1)}GB / 
                  {(systemHealth.resources.memory.total / 1024 / 1024 / 1024).toFixed(1)}GB
                </Badge>
              </div>
              <Progress 
                value={systemHealth.resources.memory.percentage} 
                className="h-2"
                indicatorClassName={cn(
                  systemHealth.resources.memory.percentage < 70 && 'bg-green-500',
                  systemHealth.resources.memory.percentage >= 70 && systemHealth.resources.memory.percentage < 90 && 'bg-yellow-500',
                  systemHealth.resources.memory.percentage >= 90 && 'bg-red-500'
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-orange-500" />
                <span>{t('system.resources.disk')}</span>
              </span>
              {getTrendIcon(systemHealth.resources.disk.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {systemHealth.resources.disk.percentage}%
                </span>
                <Badge variant="outline" className="text-xs">
                  {(systemHealth.resources.disk.used / 1024 / 1024 / 1024).toFixed(1)}GB / 
                  {(systemHealth.resources.disk.total / 1024 / 1024 / 1024).toFixed(1)}GB
                </Badge>
              </div>
              <Progress 
                value={systemHealth.resources.disk.percentage} 
                className="h-2"
                indicatorClassName={cn(
                  systemHealth.resources.disk.percentage < 70 && 'bg-green-500',
                  systemHealth.resources.disk.percentage >= 70 && systemHealth.resources.disk.percentage < 90 && 'bg-yellow-500',
                  systemHealth.resources.disk.percentage >= 90 && 'bg-red-500'
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {systemHealth.alerts && systemHealth.alerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              <span>{t('system.alerts.active')} ({systemHealth.alerts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemHealth.alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(alert.type)}
                    <span className="font-medium">{alert.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.source}
                  </Badge>
                </div>
              ))}
              {systemHealth.alerts.length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  {t('system.alerts.more', { count: systemHealth.alerts.length - 3 })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        {t('system.health.lastUpdated')}: {new Date(systemHealth.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};