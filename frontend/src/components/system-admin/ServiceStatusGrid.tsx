import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useServiceStatus, useServiceManagement, useServiceLogs } from '../../hooks/useSystemAdmin';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Server,
  Database,
  Globe,
  Zap,
  Play,
  Square,
  RotateCcw,
  FileText,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  Cpu,
  MemoryStick
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { ServiceHealth } from '../../types/systemAdmin';

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'backend': Server,
  'frontend': Globe,
  'database': Database,
  'redis': Zap,
  'nginx': Globe,
  'postgres': Database,
  'postgresql': Database,
};

export const ServiceStatusGrid: React.FC = () => {
  const { data: services, isLoading, error } = useServiceStatus();
  const serviceManagement = useServiceManagement();
  const { t } = useLanguage();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const getServiceIcon = (serviceName: string) => {
    const IconComponent = serviceIcons[serviceName.toLowerCase()] || Server;
    return IconComponent;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'starting':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'starting':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'stopped':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleServiceAction = async (serviceName: string, action: 'restart' | 'stop' | 'start') => {
    await serviceManagement.mutateAsync({
      service: serviceName,
      action,
      force: false
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-6 bg-muted rounded w-1/4"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !services) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span>{t('system.services.error')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => {
        const ServiceIcon = getServiceIcon(service.name);
        
        return (
          <Card key={service.name} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center',
                    service.status === 'healthy' && 'bg-gradient-to-br from-green-500 to-green-600',
                    service.status === 'unhealthy' && 'bg-gradient-to-br from-red-500 to-red-600',
                    service.status === 'starting' && 'bg-gradient-to-br from-yellow-500 to-yellow-600',
                    service.status === 'stopped' && 'bg-gradient-to-br from-gray-500 to-gray-600'
                  )}>
                    <ServiceIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="capitalize">{service.name}</span>
                </CardTitle>
                <Badge className={cn('px-2 py-1 text-xs', getStatusColor(service.status))}>
                  {getStatusIcon(service.status)}
                  <span className="ml-1">{t(`system.status.${service.status}`)}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Cpu className="h-3 w-3" />
                    <span>{t('system.metrics.cpu')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={service.cpu} className="h-1 flex-1" />
                    <span className="text-xs font-medium">{service.cpu}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <MemoryStick className="h-3 w-3" />
                    <span>{t('system.metrics.memory')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={service.memory} className="h-1 flex-1" />
                    <span className="text-xs font-medium">{service.memory}%</span>
                  </div>
                </div>
              </div>

              {/* Uptime */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('system.metrics.uptime')}</span>
                <span className="font-medium">{service.uptime}</span>
              </div>

              {/* Last Restart */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('system.metrics.lastRestart')}</span>
                <span className="font-medium">
                  {new Date(service.lastRestart).toLocaleDateString()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleServiceAction(service.name, 'restart')}
                  disabled={serviceManagement.isPending}
                  className="flex-1 h-8"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {t('system.actions.restart')}
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedService(service.name)}
                      className="h-8"
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <ServiceIcon className="h-5 w-5" />
                        <span>{t('system.logs.title', { service: service.name })}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <ServiceLogsViewer serviceName={service.name} />
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Service Logs Viewer Component
const ServiceLogsViewer: React.FC<{ serviceName: string }> = ({ serviceName }) => {
  const { data: logs, isLoading } = useServiceLogs(serviceName, 200);
  const { t } = useLanguage();

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      case 'debug':
        return 'text-gray-600';
      default:
        return 'text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('system.logs.empty')}
      </div>
    );
  }

  return (
    <ScrollArea className="h-96 w-full">
      <div className="space-y-1 font-mono text-xs">
        {logs.map((log, index) => (
          <div key={index} className="flex space-x-2 p-2 hover:bg-muted/50 rounded">
            <span className="text-muted-foreground whitespace-nowrap">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span className={cn('font-medium uppercase whitespace-nowrap', getLevelColor(log.level))}>
              [{log.level}]
            </span>
            <span className="flex-1 break-all">{log.message}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};