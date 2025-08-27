import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { 
  Shield, 
  Users, 
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Settings,
  Lock,
  Unlock,
  UserCheck,
  UserX
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  is_system: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  user_count: number;
  is_system: boolean;
  created_at: string;
}

interface UserRole {
  user_id: string;
  username: string;
  email: string;
  role_id: string;
  role_name: string;
  is_active: boolean;
  last_login?: string;
}

interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

export const RoleBasedAccessInterface: React.FC = () => {
  const { language, direction } = useLanguage();
  const { user, hasPermission } = useAuth();
  
  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'users'>('roles');

  // Load data
  useEffect(() => {
    loadRoles();
    loadPermissions();
    loadUserRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/auth/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/auth/permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const loadUserRoles = async () => {
    try {
      const response = await fetch('/api/auth/user-roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserRoles(data.user_roles || []);
      }
    } catch (error) {
      console.error('Failed to load user roles:', error);
    }
  };

  const handleRolePermissionToggle = async (roleId: string, permissionId: string, granted: boolean) => {
    if (!hasPermission('manage_roles')) {
      setError(language === 'en' 
        ? 'You do not have permission to modify roles' 
        : 'شما مجوز تغییر نقش‌ها را ندارید'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/auth/roles/${roleId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          permission_id: permissionId,
          granted: granted
        })
      });

      if (response.ok) {
        setSuccess(language === 'en' 
          ? 'Role permissions updated successfully' 
          : 'مجوزهای نقش با موفقیت به‌روزرسانی شد'
        );
        await loadRoles();
      } else {
        throw new Error('Failed to update role permissions');
      }
    } catch (error) {
      setError(language === 'en' 
        ? `Failed to update role permissions: ${error}` 
        : `به‌روزرسانی مجوزهای نقش ناموفق بود: ${error}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleChange = async (userId: string, newRoleId: string) => {
    if (!hasPermission('manage_users')) {
      setError(language === 'en' 
        ? 'You do not have permission to modify user roles' 
        : 'شما مجوز تغییر نقش کاربران را ندارید'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          role_id: newRoleId
        })
      });

      if (response.ok) {
        setSuccess(language === 'en' 
          ? 'User role updated successfully' 
          : 'نقش کاربر با موفقیت به‌روزرسانی شد'
        );
        await loadUserRoles();
      } else {
        throw new Error('Failed to update user role');
      }
    } catch (error) {
      setError(language === 'en' 
        ? `Failed to update user role: ${error}` 
        : `به‌روزرسانی نقش کاربر ناموفق بود: ${error}`
      );
    } finally {
      setLoading(false);
    }
  };

  const getPermissionsByCategory = (): PermissionCategory[] => {
    const categories: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });

    return Object.entries(categories).map(([name, perms]) => ({
      name,
      permissions: perms
    }));
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || permission.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredUserRoles = userRoles.filter(userRole =>
    userRole.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userRole.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userRole.role_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'owner':
        return 'from-red-500 to-pink-600';
      case 'manager':
        return 'from-blue-500 to-indigo-600';
      case 'accountant':
        return 'from-green-500 to-teal-600';
      case 'cashier':
        return 'from-purple-500 to-violet-600';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  const getPermissionIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'inventory':
        return '📦';
      case 'invoices':
        return '🧾';
      case 'customers':
        return '👥';
      case 'reports':
        return '📊';
      case 'settings':
        return '⚙️';
      case 'users':
        return '👤';
      default:
        return '🔑';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-100/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Role-Based Access Control' : 'کنترل دسترسی مبتنی بر نقش'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {language === 'en' 
                  ? 'Manage user roles, permissions, and access control' 
                  : 'مدیریت نقش‌های کاربری، مجوزها و کنترل دسترسی'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'roles', label: language === 'en' ? 'Roles' : 'نقش‌ها', icon: Users },
          { id: 'permissions', label: language === 'en' ? 'Permissions' : 'مجوزها', icon: Key },
          { id: 'users', label: language === 'en' ? 'User Assignments' : 'تخصیص کاربران', icon: UserCheck }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={language === 'en' ? 'Search...' : 'جستجو...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {activeTab === 'permissions' && (
              <div className="sm:w-48">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">
                    {language === 'en' ? 'All Categories' : 'همه دسته‌ها'}
                  </option>
                  {Array.from(new Set(permissions.map(p => p.category))).map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roles List */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === 'en' ? 'System Roles' : 'نقش‌های سیستم'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                    selectedRole?.id === role.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold",
                        `bg-gradient-to-br ${getRoleColor(role.name)}`
                      )}>
                        {role.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{role.name}</h3>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {role.user_count} {language === 'en' ? 'users' : 'کاربر'}
                      </Badge>
                      {role.is_system && (
                        <Badge variant="secondary" className="text-xs">
                          {language === 'en' ? 'System' : 'سیستمی'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {role.permissions.length} {language === 'en' ? 'permissions' : 'مجوز'}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Role Permissions */}
          {selectedRole && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {language === 'en' ? 'Role Permissions' : 'مجوزهای نقش'}
                </CardTitle>
                <CardDescription>
                  {language === 'en' ? 'Permissions for' : 'مجوزها برای'} {selectedRole.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getPermissionsByCategory().map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <span className="text-lg">{getPermissionIcon(category.name)}</span>
                      <span className="capitalize">{category.name}</span>
                    </div>
                    <div className="space-y-2 ml-6">
                      {category.permissions.map((permission) => {
                        const hasRolePermission = selectedRole.permissions.includes(permission.id);
                        return (
                          <div key={permission.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{permission.name}</p>
                              <p className="text-xs text-gray-600">{permission.description}</p>
                            </div>
                            <Switch
                              checked={hasRolePermission}
                              onCheckedChange={(checked) => 
                                handleRolePermissionToggle(selectedRole.id, permission.id, checked)
                              }
                              disabled={loading || selectedRole.is_system || !hasPermission('manage_roles')}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'permissions' && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {language === 'en' ? 'System Permissions' : 'مجوزهای سیستم'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPermissions.map((permission) => (
                <div key={permission.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPermissionIcon(permission.category)}</span>
                      <div>
                        <h3 className="font-semibold text-sm">{permission.name}</h3>
                        <Badge variant="outline" className="text-xs mt-1">
                          {permission.category}
                        </Badge>
                      </div>
                    </div>
                    {permission.is_system && (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{permission.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              {language === 'en' ? 'User Role Assignments' : 'تخصیص نقش‌های کاربری'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUserRoles.map((userRole) => (
                <div key={userRole.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold",
                      `bg-gradient-to-br ${getRoleColor(userRole.role_name)}`
                    )}>
                      {userRole.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{userRole.username}</h3>
                      <p className="text-sm text-gray-600">{userRole.email}</p>
                      {userRole.last_login && (
                        <p className="text-xs text-gray-500">
                          {language === 'en' ? 'Last login:' : 'آخرین ورود:'} {' '}
                          {new Date(userRole.last_login).toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {userRole.is_active ? (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <UserX className="h-4 w-4 text-red-600" />
                      )}
                      <Badge className={getRoleColor(userRole.role_name).replace('from-', 'bg-').replace(' to-', '').split('-')[0] + '-100 text-' + getRoleColor(userRole.role_name).replace('from-', '').replace(' to-', '').split('-')[0] + '-800'}>
                        {userRole.role_name}
                      </Badge>
                    </div>
                    
                    {hasPermission('manage_users') && (
                      <select
                        value={userRole.role_id}
                        onChange={(e) => handleUserRoleChange(userRole.user_id, e.target.value)}
                        disabled={loading}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};