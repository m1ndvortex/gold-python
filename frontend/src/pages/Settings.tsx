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
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to view system settings.
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
              <Cog className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">System Settings</h1>
              <p className="text-muted-foreground text-lg">
                Configure your gold shop management system settings and preferences
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <CheckCircle className="h-3 w-3" />
            All Systems Online
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800">
            <Save className="h-4 w-4" />
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Enhanced Settings Tabs */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="company" className="w-full">
            {/* Modern Tab Navigation */}
            <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-b-2 border-slate-200">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="company" 
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                    "hover:bg-white hover:shadow-sm",
                    "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium">Company</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="gold-price" 
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                    "hover:bg-white hover:shadow-sm",
                    "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-amber-300"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-xs font-medium">Gold Price</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="invoice-template" 
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                    "hover:bg-white hover:shadow-sm",
                    "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium">Templates</span>
                </TabsTrigger>
                
                {canManageRoles && (
                  <TabsTrigger 
                    value="roles" 
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                      "hover:bg-white hover:shadow-sm",
                      "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300"
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-xs font-medium">Roles</span>
                  </TabsTrigger>
                )}
                
                {canManageUsers && (
                  <TabsTrigger 
                    value="users" 
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
                      "hover:bg-white hover:shadow-sm",
                      "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300"
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-xs font-medium">Users</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Enhanced Tab Content */}
            <TabsContent value="company" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 to-white">
                <div className="flex items-center justify-between pb-4 border-b border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Company Settings</h3>
                      <p className="text-sm text-muted-foreground">Configure your company details and business information</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Activity className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <CompanySettingsForm />
              </div>
            </TabsContent>

            <TabsContent value="gold-price" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-amber-50/30 to-white">
                <div className="flex items-center justify-between pb-4 border-b border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Gold Price Configuration</h3>
                      <p className="text-sm text-muted-foreground">Manage gold pricing and automatic updates</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Zap className="h-3 w-3 mr-1" />
                    Auto-Update
                  </Badge>
                </div>
                <GoldPriceConfig />
              </div>
            </TabsContent>

            <TabsContent value="invoice-template" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50/30 to-white">
                <div className="flex items-center justify-between pb-4 border-b border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Invoice Template Designer</h3>
                      <p className="text-sm text-muted-foreground">Customize invoice layouts and branding</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Customizable
                  </Badge>
                </div>
                <InvoiceTemplateDesigner />
              </div>
            </TabsContent>

            {canManageRoles && (
              <TabsContent value="roles" className="p-0">
                <div className="p-6 space-y-6 bg-gradient-to-br from-green-50/30 to-white">
                  <div className="flex items-center justify-between pb-4 border-b border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">Role & Permission Management</h3>
                        <p className="text-sm text-muted-foreground">Define user roles and system permissions</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Secure
                    </Badge>
                  </div>
                  <RolePermissionManager />
                </div>
              </TabsContent>
            )}

            {canManageUsers && (
              <TabsContent value="users" className="p-0">
                <div className="p-6 space-y-6 bg-gradient-to-br from-indigo-50/30 to-white">
                  <div className="flex items-center justify-between pb-4 border-b border-indigo-200">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">User Management</h3>
                        <p className="text-sm text-muted-foreground">Add, edit, and manage system users</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      <Users className="h-3 w-3 mr-1" />
                      Multi-User
                    </Badge>
                  </div>
                  <UserManagementComponent />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Enhanced System Status & Overview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">System Overview</h2>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Check Status
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* System Health Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Database className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-green-800">Database</CardTitle>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-bold text-green-900">99.9% Uptime</div>
              <div className="flex items-center justify-between text-xs text-green-600">
                <span>Connection: Stable</span>
                <Activity className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* API Status Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Cloud className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-blue-800">API Services</CardTitle>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  <Zap className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-bold text-blue-900">All Services</div>
              <div className="flex items-center justify-between text-xs text-blue-600">
                <span>Response: 45ms</span>
                <Activity className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Security Status Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-purple-800">Security</CardTitle>
                </div>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  <Shield className="h-3 w-3 mr-1" />
                  Secure
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-bold text-purple-900">Protected</div>
              <div className="flex items-center justify-between text-xs text-purple-600">
                <span>SSL: Enabled</span>
                <CheckCircle className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Backup Status Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Save className="h-4 w-4 text-amber-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-amber-800">Backup</CardTitle>
                </div>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Current
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-bold text-amber-900">2 Hours Ago</div>
              <div className="flex items-center justify-between text-xs text-amber-600">
                <span>Next: Scheduled</span>
                <RefreshCw className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional System Information */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-gray-100/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>Current system configuration and status details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Application</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Version:</span>
                    <span className="font-medium">v2.1.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Environment:</span>
                    <Badge variant="outline" className="text-xs">Production</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Resources</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage:</span>
                    <span className="font-medium">12%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Memory:</span>
                    <span className="font-medium">2.1 GB</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Activity</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Active Users:</span>
                    <span className="font-medium">5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Activity:</span>
                    <span className="font-medium">Just now</span>
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