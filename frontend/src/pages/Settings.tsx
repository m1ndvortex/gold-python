import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { CompanySettingsForm } from '../components/settings/CompanySettingsForm';
import { GoldPriceConfig } from '../components/settings/GoldPriceConfig';
import { InvoiceTemplateDesigner } from '../components/settings/InvoiceTemplateDesigner';
import { RolePermissionManager } from '../components/settings/RolePermissionManager';
import { UserManagementComponent } from '../components/settings/UserManagement';
import { DisasterRecoveryDashboard } from '../components/settings/DisasterRecoveryDashboard';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { 
  Building2, 
  TrendingUp, 
  FileText, 
  Shield, 
  Users,
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Bell,
  Zap,
  CheckCircle,
  AlertTriangle,
  Activity,
  Cog,
  Database,
  Cloud
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Settings: React.FC = () => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();

  // Check permissions for different settings sections
  const canViewSettings = hasPermission('view_settings');
  const canEditSettings = hasPermission('edit_settings');
  const canManageUsers = hasPermission('manage_users');
  const canManageRoles = hasPermission('manage_roles');

  if (!canViewSettings) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <SettingsIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">{t('settings.access_denied')}</h2>
            <p className="text-muted-foreground">
              {t('settings.access_denied_message')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Enhanced Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
              <Cog className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('settings.title')}</h1>
              <p className="text-muted-foreground text-lg">
                {t('settings.description')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 gap-1 shadow-sm">
            <CheckCircle className="h-3 w-3" />
            {t('settings.all_systems_online')}
          </Badge>
          <Button variant="outline" size="sm" className="gap-2 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 transition-all duration-300">
            <RefreshCw className="h-4 w-4" />
            {t('settings.refresh_status')}
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300">
            <Save className="h-4 w-4" />
            {t('settings.save_all_changes')}
          </Button>
        </div>
      </div>

      {/* Enhanced Settings Tabs */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50/30">
        <CardContent className="p-0">
          <Tabs defaultValue="company" className="w-full">
            {/* Modern Tab Navigation */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200/50">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-transparent h-auto p-2 gap-1">
                <TabsTrigger 
                  value="company" 
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                    "hover:bg-white hover:shadow-lg hover:scale-105",
                    "data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-medium">{t('settings.tab_company')}</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="gold-price" 
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                    "hover:bg-white hover:shadow-lg hover:scale-105",
                    "data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-amber-300 data-[state=active]:scale-105"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-medium">{t('settings.tab_gold_price')}</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="invoice-template" 
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                    "hover:bg-white hover:shadow-lg hover:scale-105",
                    "data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-purple-300 data-[state=active]:scale-105"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-medium">{t('settings.tab_templates')}</span>
                </TabsTrigger>
                
                {canManageRoles && (
                  <TabsTrigger 
                    value="roles" 
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                      "hover:bg-white hover:shadow-lg hover:scale-105",
                      "data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-green-300 data-[state=active]:scale-105"
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{t('settings.tab_roles')}</span>
                  </TabsTrigger>
                )}
                
                {canManageUsers && (
                  <TabsTrigger 
                    value="users" 
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                      "hover:bg-white hover:shadow-lg hover:scale-105",
                      "data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-indigo-300 data-[state=active]:scale-105"
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{t('settings.tab_users')}</span>
                  </TabsTrigger>
                )}
                
                <TabsTrigger 
                  value="disaster-recovery" 
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                    "hover:bg-white hover:shadow-lg hover:scale-105",
                    "data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-red-300 data-[state=active]:scale-105"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <Database className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-medium">{t('settings.tab_disaster_recovery')}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Enhanced Tab Content */}
            <TabsContent value="company" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/20">
                <div className="flex items-center justify-between pb-4 border-b border-blue-200/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{t('settings.company_title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('settings.company_description')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm">
                    <Activity className="h-3 w-3 mr-1" />
                    {t('common.active')}
                  </Badge>
                </div>
                <CompanySettingsForm />
              </div>
            </TabsContent>

            <TabsContent value="gold-price" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20">
                <div className="flex items-center justify-between pb-4 border-b border-amber-200/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{t('settings.gold_price_title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('settings.gold_price_description')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-orange-100 text-amber-700 border-amber-200 shadow-sm">
                    <Zap className="h-3 w-3 mr-1" />
                    {t('common.auto_update')}
                  </Badge>
                </div>
                <GoldPriceConfig />
              </div>
            </TabsContent>

            <TabsContent value="invoice-template" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50/40 via-white to-violet-50/20">
                <div className="flex items-center justify-between pb-4 border-b border-purple-200/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{t('settings.invoice_template_title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('settings.invoice_template_description')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-violet-100 text-purple-700 border-purple-200 shadow-sm">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('common.customizable')}
                  </Badge>
                </div>
                <InvoiceTemplateDesigner />
              </div>
            </TabsContent>

            {canManageRoles && (
              <TabsContent value="roles" className="p-0">
                <div className="p-6 space-y-6 bg-gradient-to-br from-green-50/40 via-white to-emerald-50/20">
                  <div className="flex items-center justify-between pb-4 border-b border-green-200/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{t('settings.roles_title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('settings.roles_description')}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-emerald-100 text-green-700 border-green-200 shadow-sm">
                      <Shield className="h-3 w-3 mr-1" />
                      {t('common.secure')}
                    </Badge>
                  </div>
                  <RolePermissionManager />
                </div>
              </TabsContent>
            )}

            {canManageUsers && (
              <TabsContent value="users" className="p-0">
                <div className="p-6 space-y-6 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/20">
                  <div className="flex items-center justify-between pb-4 border-b border-indigo-200/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{t('settings.users_title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('settings.users_description')}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-gradient-to-r from-indigo-50 to-blue-100 text-indigo-700 border-indigo-200 shadow-sm">
                      <Users className="h-3 w-3 mr-1" />
                      {t('common.multi_user')}
                    </Badge>
                  </div>
                  <UserManagementComponent />
                </div>
              </TabsContent>
            )}

            <TabsContent value="disaster-recovery" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-red-50/40 via-white to-rose-50/20">
                <div className="flex items-center justify-between pb-4 border-b border-red-200/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                      <Database className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{t('settings.disaster_recovery_title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('settings.disaster_recovery_description')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-gradient-to-r from-red-50 to-rose-100 text-red-700 border-red-200 shadow-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    {t('settings.protected')}
                  </Badge>
                </div>
                <DisasterRecoveryDashboard />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Enhanced System Status & Overview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">{t('settings.system_overview')}</h2>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('settings.check_status')}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* System Health Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100/60 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                    <Database className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-green-800">{t('settings.database')}</CardTitle>
                </div>
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:bg-green-100 shadow-sm">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('settings.online')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-bold text-green-900">99.9% Uptime</div>
              <div className="flex items-center justify-between text-xs text-green-600">
                <span>{t('settings.connection_stable')}</span>
                <Activity className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* API Status Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/60 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Cloud className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-blue-800">{t('settings.api_services')}</CardTitle>
                </div>
                <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 hover:bg-blue-100 shadow-sm">
                  <Zap className="h-3 w-3 mr-1" />
                  {t('common.active')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-bold text-blue-900">{t('settings.all_services')}</div>
              <div className="flex items-center justify-between text-xs text-blue-600">
                <span>{t('settings.response_time')}</span>
                <Activity className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Security Status Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100/60 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-purple-800">{t('settings.security')}</CardTitle>
                </div>
                <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 hover:bg-purple-100 shadow-sm">
                  <Shield className="h-3 w-3 mr-1" />
                  {t('common.secure')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-bold text-purple-900">{t('settings.protected')}</div>
              <div className="flex items-center justify-between text-xs text-purple-600">
                <span>{t('settings.ssl_enabled')}</span>
                <CheckCircle className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Backup Status Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-100/60 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                    <Save className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-amber-800">{t('settings.backup')}</CardTitle>
                </div>
                <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 hover:bg-amber-100 shadow-sm">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('settings.current')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-bold text-amber-900">{t('settings.hours_ago')}</div>
              <div className="flex items-center justify-between text-xs text-amber-600">
                <span>{t('settings.next_scheduled')}</span>
                <RefreshCw className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional System Information */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 via-gray-50 to-slate-100/80 hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
                <SettingsIcon className="h-3 w-3 text-white" />
              </div>
              {t('settings.system_information')}
            </CardTitle>
            <CardDescription>{t('settings.system_information_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">{t('settings.application')}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{t('settings.version')}</span>
                    <span className="font-medium">v2.1.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('settings.environment')}</span>
                    <Badge variant="outline" className="text-xs">{t('settings.production')}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">{t('settings.resources')}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{t('settings.cpu_usage')}</span>
                    <span className="font-medium">12%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('settings.memory')}</span>
                    <span className="font-medium">2.1 GB</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">{t('settings.activity')}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{t('settings.active_users')}</span>
                    <span className="font-medium">5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('settings.last_activity')}</span>
                    <span className="font-medium">{t('settings.just_now')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Individual route components
const CompanySettingsRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <Building2 className="h-8 w-8 text-blue-600" />
      <div>
        <h1 className="text-3xl font-bold">Company Settings</h1>
        <p className="text-muted-foreground">Configure your company details, logo, and default business settings</p>
      </div>
    </div>
    <CompanySettingsForm />
  </div>
);

const UserManagementRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <Users className="h-8 w-8 text-green-600" />
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Add, edit, and manage system users and their access permissions</p>
      </div>
    </div>
    <UserManagementComponent />
  </div>
);

const RoleManagementRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <Shield className="h-8 w-8 text-purple-600" />
      <div>
        <h1 className="text-3xl font-bold">Roles & Permissions</h1>
        <p className="text-muted-foreground">Define user roles and assign specific permissions for different system functions</p>
      </div>
    </div>
    <RolePermissionManager />
  </div>
);

const GoldPriceRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <TrendingUp className="h-8 w-8 text-yellow-600" />
      <div>
        <h1 className="text-3xl font-bold">Gold Price Configuration</h1>
        <p className="text-muted-foreground">Set current gold prices and configure automatic updates from external price feeds</p>
      </div>
    </div>
    <GoldPriceConfig />
  </div>
);

const InvoiceTemplatesRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <FileText className="h-8 w-8 text-indigo-600" />
      <div>
        <h1 className="text-3xl font-bold">Invoice Templates</h1>
        <p className="text-muted-foreground">Customize invoice layouts, colors, fonts, and branding to match your business identity</p>
      </div>
    </div>
    <InvoiceTemplateDesigner />
  </div>
);

// Wrapper component to handle sub-routes
export const SettingsWithRouting: React.FC = () => {
  return (
    <Routes>
      <Route path="/company" element={<CompanySettingsRoute />} />
      <Route path="/users" element={<UserManagementRoute />} />
      <Route path="/roles" element={<RoleManagementRoute />} />
      <Route path="/gold-price" element={<GoldPriceRoute />} />
      <Route path="/invoice-templates" element={<InvoiceTemplatesRoute />} />
      <Route path="/*" element={<Settings />} />
    </Routes>
  );
};