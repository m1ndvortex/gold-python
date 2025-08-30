import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useDatabaseStatus, useDatabaseHealthCheck, useDatabaseOptimization } from '../../hooks/useSystemAdmin';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Database,
  Activity,
  Zap,
  HardDrive,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const DatabaseAdministration: React.FC = () => {
  const { data: dbStatus, isLoading, error } = useDatabaseStatus();
  const healthCheck = useDatabaseHealthCheck();
  const optimization = useDatabaseOptimization();
  const { t } = useLanguage();

  const getConnectionPoolStatus = (active: number, total: number) => {
    const percentage = (active / total) * 100;
    if (percentage < 70) return 'healthy';
    if (percentage < 90) return 'warning';
    return 'critical';
  };

  const getReplicationStatus = (status: string) => {
    switch (status) {
      case 'healthy':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' };
      case 'lagging':
        return { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !dbStatus) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span>{t('database.error')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const poolStatus = getConnectionPoolStatus(dbStatus.connectionPool.active, dbStatus.connectionPool.total);
  const replicationInfo = getReplicationStatus(dbStatus.replication.status);
  const ReplicationIcon = replicationInfo.icon;

  return (
    <div className="space-y-6">
      {/* Database Overview */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span>{t('database.title')}</span>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => healthCheck.mutate()}
                disabled={healthCheck.isPending}
              >
                <Activity className={cn('h-4 w-4 mr-2', healthCheck.isPending && 'animate-pulse')} />
                {t('database.healthCheck')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => optimization.mutate()}
                disabled={optimization.isPending}
              >
                <Zap className={cn('h-4 w-4 mr-2', optimization.isPending && 'animate-spin')} />
                {t('database.optimize')}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Connection Pool Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4 text-blue-500" />
              <span>{t('database.connectionPool.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {dbStatus.connectionPool.active}/{dbStatus.connectionPool.total}
              </span>
              <Badge className={cn(
                'px-2 py-1',
                poolStatus === 'healthy' && 'bg-green-100 text-green-700',
                poolStatus === 'warning' && 'bg-yellow-100 text-yellow-700',
                poolStatus === 'critical' && 'bg-red-100 text-red-700'
              )}>
                {t(`database.status.${poolStatus}`)}
              </Badge>
            </div>
            <Progress 
              value={(dbStatus.connectionPool.active / dbStatus.connectionPool.total) * 100} 
              className="h-2"
              indicatorClassName={cn(
                poolStatus === 'healthy' && 'bg-green-500',
                poolStatus === 'warning' && 'bg-yellow-500',
                poolStatus === 'critical' && 'bg-red-500'
              )}
            />
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">{t('database.connectionPool.active')}: </span>
                {dbStatus.connectionPool.active}
              </div>
              <div>
                <span className="font-medium">{t('database.connectionPool.idle')}: </span>
                {dbStatus.connectionPool.idle}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Query Performance */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <span>{t('database.queryPerformance.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('database.queryPerformance.avgResponse')}</span>
                <span className="font-medium">{dbStatus.queryPerformance.averageResponseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('database.queryPerformance.slowQueries')}</span>
                <Badge variant={dbStatus.queryPerformance.slowQueries > 10 ? 'destructive' : 'outline'}>
                  {dbStatus.queryPerformance.slowQueries}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('database.queryPerformance.totalQueries')}</span>
                <span className="font-medium">{dbStatus.queryPerformance.totalQueries.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Information */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <HardDrive className="h-4 w-4 text-purple-500" />
              <span>{t('database.storage.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('database.storage.size')}</span>
                <span className="font-medium">{formatBytes(dbStatus.storage.size)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('database.storage.freeSpace')}</span>
                <span className="font-medium">{formatBytes(dbStatus.storage.freeSpace)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('database.storage.tables')}</span>
                <span className="font-medium">{dbStatus.storage.tableCount}</span>
              </div>
            </div>
            <Progress 
              value={((dbStatus.storage.size - dbStatus.storage.freeSpace) / dbStatus.storage.size) * 100} 
              className="h-2"
              indicatorClassName="bg-purple-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Replication Status */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 text-indigo-500" />
            <span>{t('database.replication.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={cn('p-2 rounded-lg', replicationInfo.bg)}>
                  <ReplicationIcon className={cn('h-5 w-5', replicationInfo.color)} />
                </div>
                <div>
                  <div className="font-medium">{t('database.replication.status')}</div>
                  <div className={cn('text-sm', replicationInfo.color)}>
                    {t(`database.replication.${dbStatus.replication.status}`)}
                  </div>
                </div>
              </div>
              
              {dbStatus.replication.status === 'lagging' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-yellow-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">{t('database.replication.lagWarning')}</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    {t('database.replication.lagDescription')}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('database.replication.lag')}</span>
                <Badge variant="outline" className={cn(
                  dbStatus.replication.lag > 1000 && 'text-red-600',
                  dbStatus.replication.lag > 500 && dbStatus.replication.lag <= 1000 && 'text-yellow-600',
                  dbStatus.replication.lag <= 500 && 'text-green-600'
                )}>
                  {dbStatus.replication.lag}ms
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <span>{t('database.actions.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => healthCheck.mutate()}
              disabled={healthCheck.isPending}
            >
              <Activity className={cn('h-6 w-6', healthCheck.isPending && 'animate-pulse')} />
              <div className="text-center">
                <div className="font-medium">{t('database.actions.healthCheck')}</div>
                <div className="text-xs text-muted-foreground">{t('database.actions.healthCheckDesc')}</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => optimization.mutate()}
              disabled={optimization.isPending}
            >
              <Zap className={cn('h-6 w-6', optimization.isPending && 'animate-spin')} />
              <div className="text-center">
                <div className="font-medium">{t('database.actions.optimize')}</div>
                <div className="text-xs text-muted-foreground">{t('database.actions.optimizeDesc')}</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <BarChart3 className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">{t('database.actions.analyze')}</div>
                <div className="text-xs text-muted-foreground">{t('database.actions.analyzeDesc')}</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};