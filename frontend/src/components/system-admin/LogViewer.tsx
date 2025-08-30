import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { useLogs, useLogExport } from '../../hooks/useSystemAdmin';
import { useLanguage } from '../../hooks/useLanguage';
import {
  FileText,
  Search,
  Download,
  Filter,
  RefreshCw,
  Calendar,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { LogFilter, LogEntry } from '../../types/systemAdmin';

const LOG_LEVELS = ['debug', 'info', 'warning', 'error', 'critical'];
const SERVICES = ['backend', 'frontend', 'database', 'redis', 'nginx'];

export const LogViewer: React.FC = () => {
  const { t } = useLanguage();
  const logExport = useLogExport();
  
  const [filter, setFilter] = useState<Partial<LogFilter>>({
    services: [],
    levels: [],
    searchQuery: '',
    limit: 100,
    dateRange: [
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      new Date()
    ]
  });

  const [searchInput, setSearchInput] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: logs, isLoading, error, refetch } = useLogs(filter);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleSearch = () => {
    setFilter(prev => ({ ...prev, searchQuery: searchInput }));
  };

  const handleServiceToggle = (service: string) => {
    setFilter(prev => ({
      ...prev,
      services: prev.services?.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...(prev.services || []), service]
    }));
  };

  const handleLevelToggle = (level: string) => {
    setFilter(prev => ({
      ...prev,
      levels: prev.levels?.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...(prev.levels || []), level]
    }));
  };

  const handleExport = (format: 'csv' | 'json') => {
    logExport.mutate({ filter, format });
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'debug':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getServiceColor = (service: string) => {
    const colors = {
      backend: 'bg-green-100 text-green-700',
      frontend: 'bg-blue-100 text-blue-700',
      database: 'bg-purple-100 text-purple-700',
      redis: 'bg-red-100 text-red-700',
      nginx: 'bg-orange-100 text-orange-700'
    };
    return colors[service as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Log Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span>{t('logs.title')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(autoRefresh && 'bg-green-50 text-green-700 border-green-200')}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', autoRefresh && 'animate-spin')} />
                {t('logs.autoRefresh')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={logExport.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('logs.export')}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('logs.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>
              {t('common.search')}
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('logs.services')}</label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((service) => (
                  <Badge
                    key={service}
                    variant={filter.services?.includes(service) ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-colors',
                      filter.services?.includes(service) && getServiceColor(service)
                    )}
                    onClick={() => handleServiceToggle(service)}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Level Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('logs.levels')}</label>
              <div className="flex flex-wrap gap-2">
                {LOG_LEVELS.map((level) => (
                  <Badge
                    key={level}
                    variant={filter.levels?.includes(level) ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-colors',
                      filter.levels?.includes(level) && getLevelColor(level)
                    )}
                    onClick={() => handleLevelToggle(level)}
                  >
                    {getLevelIcon(level)}
                    <span className="ml-1 capitalize">{level}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Limit Selection */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">{t('logs.limit')}</label>
            <Select
              value={filter.limit?.toString()}
              onValueChange={(value) => setFilter(prev => ({ ...prev, limit: parseInt(value) }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('logs.entries')}</span>
            {logs && (
              <Badge variant="outline">
                {logs.length} {t('logs.entriesCount')}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <XCircle className="h-8 w-8 mx-auto mb-2" />
              <span>{t('logs.error')}</span>
            </div>
          ) : logs && logs.length > 0 ? (
            <ScrollArea className="h-96 w-full">
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex space-x-2 p-2 rounded hover:bg-muted/50 transition-colors',
                      log.level === 'error' && 'bg-red-50/50',
                      log.level === 'warning' && 'bg-yellow-50/50'
                    )}
                  >
                    <span className="text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn('text-xs px-1 py-0', getLevelColor(log.level))}
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('text-xs px-1 py-0', getServiceColor(log.service))}
                    >
                      {log.service}
                    </Badge>
                    <span className="flex-1 break-all">{log.message}</span>
                    {log.traceId && (
                      <Badge variant="outline" className="text-xs px-1 py-0 text-purple-600">
                        {log.traceId.slice(0, 8)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <span>{t('logs.empty')}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};