import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Save, 
  X, 
  Shield, 
  Palette,
  Settings,
  Key,
  Search
} from 'lucide-react';
import { RBACRole, RBACPermission, RoleCreateRequest, RoleUpdateRequest } from '../../types';
import { rbacApi } from '../../services/rbacApi';

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: RBACRole | null;
  permissions: RBACPermission[];
  isCreating: boolean;
  onSaved: () => void;
}

const ROLE_COLORS = [
  '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D',
  '#16A34A', '#059669', '#0891B2', '#0284C7', '#2563EB',
  '#4F46E5', '#7C3AED', '#9333EA', '#C026D3', '#DB2777'
];

export const RoleDialog: React.FC<RoleDialogProps> = ({
  isOpen,
  onClose,
  role,
  permissions,
  isCreating,
  onSaved
}) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    color: '#3B82F6',
    icon: 'shield',
    level: 5,
    priority: 100,
    is_active: true
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
        color: role.color || '#3B82F6',
        icon: role.icon || 'shield',
        level: role.level,
        priority: role.priority,
        is_active: role.is_active
      });
      setSelectedPermissions(role.permissions?.map(p => p.id) || []);
    } else {
      setFormData({
        name: '',
        display_name: '',
        description: '',
        color: '#3B82F6',
        icon: 'shield',
        level: 5,
        priority: 100,
        is_active: true
      });
      setSelectedPermissions([]);
    }
    setPermissionSearch('');
  }, [role, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate name from display_name
    if (field === 'display_name' && isCreating) {
      const name = value.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
      setFormData(prev => ({ ...prev, name }));
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const roleData = {
        ...formData,
        permission_ids: selectedPermissions
      };

      if (isCreating) {
        await rbacApi.createRole(roleData as RoleCreateRequest);
      } else if (role) {
        await rbacApi.updateRole(role.id, roleData as RoleUpdateRequest);
      }

      onSaved();
    } catch (error) {
      console.error('Failed to save role:', error);
      alert('Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
    permission.display_name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
    permission.resource.toLowerCase().includes(permissionSearch.toLowerCase())
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {isCreating ? 'Create New Role' : `Edit Role: ${role?.display_name}`}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="Administrator"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">System Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="admin"
                  disabled={!isCreating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Role description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  type="number"
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
                  min="0"
                  max="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                  min="0"
                  max="1000"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {ROLE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleInputChange('color', color)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search permissions..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary">
                {selectedPermissions.length} selected
              </Badge>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      {category.replace('_', ' ')}
                      <Badge variant="outline" className="ml-auto">
                        {categoryPermissions.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryPermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                          />
                          <div>
                            <Label htmlFor={permission.id} className="font-medium">
                              {permission.display_name}
                            </Label>
                            <p className="text-sm text-gray-500">{permission.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {permission.resource}:{permission.action}
                          </Badge>
                          <Badge className={getRiskColor(permission.risk_level)}>
                            {permission.risk_level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Role'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};