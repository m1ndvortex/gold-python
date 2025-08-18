import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
  Settings as SettingsIcon
} from 'lucide-react';

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
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure your gold shop management system settings and preferences.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="gold-price" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Gold Price</span>
          </TabsTrigger>
          <TabsTrigger value="invoice-template" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Invoice</span>
          </TabsTrigger>
          {canManageRoles && (
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
          )}
          {canManageUsers && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company" className="space-y-6">
          <CompanySettingsForm />
        </TabsContent>

        {/* Gold Price Configuration Tab */}
        <TabsContent value="gold-price" className="space-y-6">
          <GoldPriceConfig />
        </TabsContent>

        {/* Invoice Template Designer Tab */}
        <TabsContent value="invoice-template" className="space-y-6">
          <InvoiceTemplateDesigner />
        </TabsContent>

        {/* Role & Permission Management Tab */}
        {canManageRoles && (
          <TabsContent value="roles" className="space-y-6">
            <RolePermissionManager />
          </TabsContent>
        )}

        {/* User Management Tab */}
        {canManageUsers && (
          <TabsContent value="users" className="space-y-6">
            <UserManagementComponent />
          </TabsContent>
        )}
      </Tabs>

      {/* Settings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure your company details, logo, and default business settings for invoices and calculations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Gold Price Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set current gold prices and configure automatic updates from external price feeds.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoice Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Customize invoice layouts, colors, fonts, and branding to match your business identity.
            </p>
          </CardContent>
        </Card>

        {canManageRoles && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Define user roles and assign specific permissions for different system functions.
              </p>
            </CardContent>
          </Card>
        )}

        {canManageUsers && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add, edit, and manage system users, assign roles, and control access permissions.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Database:</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>API Status:</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Backup:</span>
                <span className="text-muted-foreground">2 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};