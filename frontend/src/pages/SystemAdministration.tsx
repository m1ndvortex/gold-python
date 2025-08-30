import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import {
  Server,
  Shield,
  Database,
  FileText,
  Activity,
  HardDrive,
  Zap,
  Settings,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

// Import all the system admin components
import { SystemHealthOverview } from '../components/system-admin/SystemHealthOverview';
import { ServiceStatusGrid } from '../components/system-admin/ServiceStatusGrid';
import { SecurityMonitoring } from '../components/system-admin/SecurityMonitoring';
import { BackupManagement } from '../components/system-admin/BackupManagement';
import { LogViewer } from '../components/system-admin/LogViewer';
import { PerformanceMetrics } from '../components/system-admin/PerformanceMetrics';
import { DatabaseAdministration } from '../components/system-admin/DatabaseAdministration';
import { RedisManagement } from '../components/system-admin/RedisManagement';

const SystemAdministration: React.FC = () => {
  const { t } = useLanguage();
  const { hasAnyRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user has admin permissions
  if (!hasAnyRole(['Owner', 'Manager', 'Admin'])) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>{t('system.admin.accessDenied')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: t('system.admin.tabs.overview'),
      icon: Activity,
      component: SystemHealthOverview
    },
    {
      id: 'services',
      label: t('system.admin.tabs.services'),
      icon: Server,
      component: ServiceStatusGrid
    },
    {
      id: 'security',
      label: t('system.admin.tabs.security'),
      icon: Shield,
      component: SecurityMonitoring
    },
    {
      id: 'performance',
      label: t('system.admin.tabs.performance'),
      icon: Activity,
      component: PerformanceMetrics
    },
    {
      id: 'database',
      label: t('system.admin.tabs.database'),
      icon: Database,
      component: DatabaseAdministration
    },
    {
      id: 'redis',
      label: t('system.admin.tabs.redis'),
      icon: Zap,
      component: RedisManagement
    },
    {
      id: 'backups',
      label: t('system.admin.tabs.backups'),
      icon: HardDrive,
      component: BackupManagement
    },
    {
      id: 'logs',
      label: t('system.admin.tabs.logs'),
      icon: FileText,
      component: LogViewer
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {t('system.admin.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('system.admin.description')}
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          {t('system.admin.online')}
        </Badge>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-border bg-gradient-to-r from-slate-50 via-slate-50 to-slate-50 rounded-lg p-1">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-transparent">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-all duration-200',
                    'data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300',
                    'hover:bg-white/50'
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab Content */}
        {tabs.map((tab) => {
          const ComponentToRender = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <ComponentToRender />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default SystemAdministration;