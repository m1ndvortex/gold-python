import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useRedisStatus, useRedisCacheClear, useRedisKeys } from '../../hooks/useSystemAdmin';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Zap,
  Trash2,
  Search,
  Key,
  Activity,
  MemoryStick,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const RedisManagement: React.FC = () => {
  const { data: redisStatus, isLoading, error } = useRedisStatus();
  const cacheClear = useRedisCacheClear();
  const { t } = useLanguage();

  const [keyPattern, setKeyPattern] = useState('*');
  const [clearPattern, setClearPattern] = useState('');
  const [showClearDialog, setShowClearDialog] = useState(false);

  const { data: keys } = useRedisKeys(keyPattern, 50);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getMemoryUsageStatus = (used: number, peak: number) => {
    const percentage = (used / peak) * 100;
    if (percentage < 70) return 'healthy';
    if (percentage < 90) return 'warning';
    return 'critical';
  };

  const getHitRateStatus = (hitRate: number) => {
    if (hitRate >= 90) return 'excellent';
    if (hitRate >= 70) return 'good';
    if (hitRate >= 50) return 'fair';
    return 'poor';
  };

  const handleClearCache = async () => {
    try {
      await cacheClear.mutateAsync(clearPattern || undefined);
      setShowClearDialog(false);
      setClearPattern('');
    } catch (error) {
      // Error handled by the hook
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                  <div className="h-2 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !redisStatus) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span>{t('redis.error')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const memoryStatus = getMemoryUsageStatus(redisStatus.memory.used, redisStatus.memory.peak);
  const hitRateStatus = getHitRateStatus(redisStatus.performance.hitRate);

  return (
    <div className="space-y-6">
      {/* Redis Overview */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-100/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span>{t('redis.title')}</span>
            </div>
            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('redis.clearCache')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('redis.clearCache')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-yellow-700">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">{t('redis.clearWarning')}</span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      {t('redis.clearWarningText')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('redis.pattern')}</label>
                    <Input
                      value={clearPattern}
                      onChange={(e) => setClearPattern(e.target.value)}
                      placeholder={t('redis.patternPlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('redis.patternHelp')}
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      onClick={handleClearCache}
                      disabled={cacheClear.isPending}
                      variant="destructive"
                    >
                      {cacheClear.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {t('redis.confirmClear')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Memory Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <MemoryStick className="h-4 w-4 text-purple-500" />
              <span>{t('redis.memory.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {formatBytes(redisStatus.memory.used)}
              </span>
              <Badge className={cn(
                'px-2 py-1',
                memoryStatus === 'healthy' && 'bg-green-100 text-green-700',
                memoryStatus === 'warning' && 'bg-yellow-100 text-yellow-700',
                memoryStatus === 'critical' && 'bg-red-100 text-red-700'
              )}>
                {t(`redis.status.${memoryStatus}`)}
              </Badge>
            </div>
            <Progress 
              value={(redisStatus.memory.used / redisStatus.memory.peak) * 100} 
              className="h-2"
              indicatorClassName={cn(
                memoryStatus === 'healthy' && 'bg-green-500',
                memoryStatus === 'warning' && 'bg-yellow-500',
                memoryStatus === 'critical' && 'bg-red-500'
              )}
            />
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">{t('redis.memory.peak')}: </span>
                {formatBytes(redisStatus.memory.peak)}
              </div>
              <div>
                <span className="font-medium">{t('redis.memory.fragmentation')}: </span>
                {redisStatus.memory.fragmentation.toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>{t('redis.performance.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('redis.performance.hitRate')}</span>
                <Badge className={cn(
                  'px-2 py-1',
                  hitRateStatus === 'excellent' && 'bg-green-100 text-green-700',
                  hitRateStatus === 'good' && 'bg-blue-100 text-blue-700',
                  hitRateStatus === 'fair' && 'bg-yellow-100 text-yellow-700',
                  hitRateStatus === 'poor' && 'bg-red-100 text-red-700'
                )}>
                  {redisStatus.performance.hitRate.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('redis.performance.missRate')}</span>
                <span className="font-medium">{redisStatus.performance.missRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('redis.performance.opsPerSec')}</span>
                <span className="font-medium">{redisStatus.performance.operationsPerSecond.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connections */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4 text-blue-500" />
              <span>{t('redis.connections.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('redis.connections.connected')}</span>
                <span className="font-medium">{redisStatus.connections.connected}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('redis.connections.blocked')}</span>
                <Badge variant={redisStatus.connections.blocked > 0 ? 'destructive' : 'outline'}>
                  {redisStatus.connections.blocked}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('redis.connections.rejected')}</span>
                <Badge variant={redisStatus.connections.rejected > 0 ? 'destructive' : 'outline'}>
                  {redisStatus.connections.rejected}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keyspace */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Key className="h-4 w-4 text-orange-500" />
              <span>{t('redis.keyspace.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('redis.keyspace.totalKeys')}</span>
                <span className="font-medium">{redisStatus.keyspace.totalKeys.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('redis.keyspace.expired')}</span>
                <span className="font-medium">{redisStatus.keyspace.expiredKeys.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('redis.keyspace.evicted')}</span>
                <span className="font-medium">{redisStatus.keyspace.evictedKeys.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Browser */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-indigo-500" />
            <span>{t('redis.keyBrowser.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('redis.keyBrowser.placeholder')}
                value={keyPattern}
                onChange={(e) => setKeyPattern(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              {t('common.search')}
            </Button>
          </div>

          {keys && keys.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {keys.map((key, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded border">
                  <span className="font-mono text-sm">{key}</span>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <span>{t('redis.keyBrowser.noKeys')}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};