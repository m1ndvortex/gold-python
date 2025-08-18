import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Shield, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { 
  useRoles, 
  useCreateRole, 
  useUpdateRole, 
  useDeleteRole, 
  usePermissionStructure 
} from '../../hooks/useSettings';
import { RoleCreate, RoleUpdate, RoleWithUsers } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';

interface RoleFormData {
  name: string;
  description: string;
}

export const RolePermissionManager: React.FC = () => {
  const { t } = useLanguage();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: permissionStructure, isLoading: permissionsLoading } = usePermissionStructure();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [selectedRole, setSelectedRole] = useState<RoleWithUsers | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>();

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permissionKey]: checked,
    }));
  };

  const handleCreateRole = () => {
    setSelectedPermissions({});
    reset({ name: '', description: '' });
    setIsCreateDialogOpen(true);
  };

  const handleEditRole = (role: RoleWithUsers) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions || {});
    reset({
      name: role.name,
      description: role.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const onSubmitCreate = async (data: RoleFormData) => {
    const roleData: RoleCreate = {
      name: data.name,
      description: data.description,
      permissions: selectedPermissions,
    };

    createRole.mutate(roleData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        reset();
        setSelectedPermissions({});
      },
    });
  };

  const onSubmitEdit = async (data: RoleFormData) => {
    if (!selectedRole) return;

    const roleUpdate: RoleUpdate = {
      name: data.name,
      description: data.description,
      permissions: selectedPermissions,
    };

    updateRole.mutate(
      { roleId: selectedRole.id, roleUpdate },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedRole(null);
          reset();
          setSelectedPermissions({});
        },
      }
    );
  };

  const handleDeleteRole = (role: RoleWithUsers) => {
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      deleteRole.mutate(role.id);
    }
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const PermissionCheckboxes = () => (
    <div className="space-y-4">
      {permissionStructure?.categories.map((category) => (
        <div key={category.name} className="border rounded-lg">
          <button
            type="button"
            onClick={() => toggleCategory(category.name)}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedCategories.has(category.name) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="font-medium">{category.label}</span>
            </div>
            <Badge variant="secondary">
              {category.permissions.filter(p => selectedPermissions[p.key]).length} / {category.permissions.length}
            </Badge>
          </button>
          
          {expandedCategories.has(category.name) && (
            <div className="p-3 pt-0 space-y-2">
              {category.permissions.map((permission) => (
                <div key={permission.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission.key}
                    checked={selectedPermissions[permission.key] || false}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(permission.key, checked as boolean)
                    }
                  />
                  <Label htmlFor={permission.key} className="text-sm">
                    {permission.label}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role & Permission Management
            </CardTitle>
            <CardDescription>
              Manage user roles and their permissions
            </CardDescription>
          </div>
          <Button onClick={handleCreateRole}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles?.map((role) => (
            <div key={role.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">{role.name}</h3>
                  {role.description && (
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {role.users.length} users
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRole(role)}
                    disabled={role.users.length > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Permission Summary */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">PERMISSIONS</Label>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(role.permissions || {})
                    .filter(([_, enabled]) => enabled)
                    .map(([key, _]) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Assigned Users */}
              {role.users.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <Label className="text-xs font-medium text-muted-foreground">ASSIGNED USERS</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {role.users.map((user) => (
                      <Badge key={user.id} variant="outline" className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        {user.username}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create Role Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Role name is required' })}
                    placeholder="e.g., Sales Manager"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    {...register('description')}
                    placeholder="Brief description of the role"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Permissions</Label>
                <PermissionCheckboxes />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createRole.isPending}>
                  {createRole.isPending ? 'Creating...' : 'Create Role'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Modify role details and permissions
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Role Name</Label>
                  <Input
                    id="edit-name"
                    {...register('name', { required: 'Role name is required' })}
                    placeholder="e.g., Sales Manager"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    {...register('description')}
                    placeholder="Brief description of the role"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Permissions</Label>
                <PermissionCheckboxes />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateRole.isPending}>
                  {updateRole.isPending ? 'Updating...' : 'Update Role'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};