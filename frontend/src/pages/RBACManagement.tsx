import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Shield, 
  Users, 
  Key, 
  Settings, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { WithPermissions } from '../components/auth/WithPermissions';
import { usePermissions } from '../hooks/usePermissions';
import { rbacApi } from '../services/rbacApi';
import { RBACRole, RBACPermission, RBACPermissionGroup, User } from '../types';
import { RoleManagement } from '../components/rbac/RoleManagement';
import { PermissionManagement } from '../components/rbac/PermissionManagement';
import { UserRoleAssignment } from '../components/rbac/UserRoleAssignment';
import { AccessAuditLogs } from '../components/rbac/AccessAuditLogs';

export const RBACManagement: React.FC = () => {
  const { canManageSettings, isAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState('roles');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Data states
  const [roles, setRoles] = useState<RBACRole[]>([]);
  const [permissions, setPermissions] = useState<RBACPermission[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<RBACPermissionGroup[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData, groupsData, statsData] = await Promise.all([
        rbacApi.getRoles(),
        rbacApi.getPermissions(),
        rbacApi.getPermissionGroups(),
        rbacApi.getRBACStats()
      ]);

      setRoles(rolesData.roles || []);
      setPermissions(permissionsData);
      setPermissionGroups(groupsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load RBAC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadInitialData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading RBAC Management...</p>
        </div>
      </div>
    );
  }

  return (
    <WithPermissions 
      anyPermission={['settings:user_management', 'settings:system_config']}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
                <p className="text-gray-600">
                  You don't have permission to access RBAC management.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                RBAC Management
              </h1>
              <p className="text-gray-600">
                Manage roles, permissions, and user access control
              </p>
            </div>
            
            {stats && (
              <div className="flex gap-4">
                <Card className="px-4 py-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total_roles || 0}</div>
                    <div className="text-sm text-gray-600">Roles</div>
                  </div>
                </Card>
                <Card className="px-4 py-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.total_permissions || 0}</div>
                    <div className="text-sm text-gray-600">Permissions</div>
                  </div>
                </Card>
                <Card className="px-4 py-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.total_users || 0}</div>
                    <div className="text-sm text-gray-600">Users</div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Main Content */}
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b bg-gray-50/50 px-6 py-4">
                  <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
                    <TabsTrigger value="roles" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Roles
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Permissions
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      User Assignment
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Audit Logs
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="roles" className="mt-0">
                    <RoleManagement 
                      roles={roles}
                      permissions={permissions}
                      onRolesChange={refreshData}
                    />
                  </TabsContent>

                  <TabsContent value="permissions" className="mt-0">
                    <PermissionManagement 
                      permissions={permissions}
                      permissionGroups={permissionGroups}
                      onPermissionsChange={refreshData}
                    />
                  </TabsContent>

                  <TabsContent value="users" className="mt-0">
                    <UserRoleAssignment />
                  </TabsContent>

                  <TabsContent value="audit" className="mt-0">
                    <WithPermissions permissions={['system:audit_logs']}>
                      <AccessAuditLogs />
                    </WithPermissions>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </WithPermissions>
  );
};