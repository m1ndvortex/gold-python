import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Key,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { RBACPermission, RBACPermissionGroup } from '../../types';

interface PermissionManagementProps {
  permissions: RBACPermission[];
  permissionGroups: RBACPermissionGroup[];
  onPermissionsChange: () => void;
}

export const PermissionManagement: React.FC<PermissionManagementProps> = ({
  permissions,
  permissionGroups,
  onPermissionsChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const permissionsByCategory = filteredPermissions.reduce((acc, permission) => {
    const category = permission.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, RBACPermission[]>);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Permission Management</h2>
          <p className="text-gray-600">Manage system permissions and their categories</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Permission
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Permissions by Category */}
      <div className="space-y-6">
        {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                <Key className="h-5 w-5" />
                {category.replace('_', ' ')}
                <Badge variant="secondary" className="ml-auto">
                  {categoryPermissions.length} permissions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryPermissions.map((permission) => (
                  <Card key={permission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{permission.display_name}</h4>
                            <p className="text-xs text-gray-500">{permission.name}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            {!permission.is_system_permission && (
                              <Button variant="ghost" size="sm" className="text-red-600">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {permission.description && (
                          <p className="text-xs text-gray-600">{permission.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {permission.resource}:{permission.action}
                          </Badge>
                          <Badge className={getRiskColor(permission.risk_level)}>
                            {permission.risk_level}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {permission.is_system_permission && (
                            <Badge variant="secondary" className="text-xs">System</Badge>
                          )}
                          {!permission.is_active && (
                            <Badge variant="destructive" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPermissions.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Key className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">No permissions found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'No permissions available'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};