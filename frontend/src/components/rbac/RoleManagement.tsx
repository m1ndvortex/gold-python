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
  Users, 
  Shield,
  Eye,
  Settings
} from 'lucide-react';
import { RBACRole, RBACPermission } from '../../types';
import { rbacApi } from '../../services/rbacApi';
import { RoleDialog } from './RoleDialog';

interface RoleManagementProps {
  roles: RBACRole[];
  permissions: RBACPermission[];
  onRolesChange: () => void;
}

export const RoleManagement: React.FC<RoleManagementProps> = ({
  roles,
  permissions,
  onRolesChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<RBACRole | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleEditRole = (role: RBACRole) => {
    setSelectedRole(role);
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleDeleteRole = async (role: RBACRole) => {
    if (role.is_system_role) {
      alert('Cannot delete system roles');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the role "${role.display_name}"?`)) {
      try {
        await rbacApi.deleteRole(role.id);
        onRolesChange();
      } catch (error) {
        console.error('Failed to delete role:', error);
        alert('Failed to delete role');
      }
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedRole(null);
    setIsCreating(false);
  };

  const handleRoleSaved = () => {
    handleDialogClose();
    onRolesChange();
  };

  const getRiskLevelColor = (level: number) => {
    if (level >= 900) return 'bg-red-100 text-red-800';
    if (level >= 700) return 'bg-orange-100 text-orange-800';
    if (level >= 500) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getRiskLevelText = (level: number) => {
    if (level >= 900) return 'Critical';
    if (level >= 700) return 'High';
    if (level >= 500) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">Create and manage user roles and their permissions</p>
        </div>
        <Button onClick={handleCreateRole} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: role.color || '#3B82F6' }}
                  >
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.display_name}</CardTitle>
                    <p className="text-sm text-gray-500">{role.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!role.is_system_role && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {role.description && (
                <p className="text-sm text-gray-600">{role.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Level {role.level}</span>
                </div>
                <Badge className={getRiskLevelColor(role.priority)}>
                  {getRiskLevelText(role.priority)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {role.permissions?.length || 0} permissions
                  </span>
                </div>
                {role.is_system_role && (
                  <Badge variant="secondary">System Role</Badge>
                )}
              </div>

              {!role.is_active && (
                <Badge variant="destructive" className="w-full justify-center">
                  Inactive
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Shield className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">No roles found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first role to get started'}
              </p>
            </div>
            {!searchTerm && (
              <Button onClick={handleCreateRole}>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Role Dialog */}
      <RoleDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        role={selectedRole}
        permissions={permissions}
        isCreating={isCreating}
        onSaved={handleRoleSaved}
      />
    </div>
  );
};