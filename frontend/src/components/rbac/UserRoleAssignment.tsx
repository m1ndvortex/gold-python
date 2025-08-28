import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { 
  Users, 
  Search, 
  UserCheck, 
  Shield,
  Plus,
  X
} from 'lucide-react';
import { RBACRole, User } from '../../types';
import { api } from '../../utils/api';
import { rbacApi } from '../../services/rbacApi';

interface UserRoleAssignmentProps {}

export const UserRoleAssignment: React.FC<UserRoleAssignmentProps> = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RBACRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse] = await Promise.all([
        rbacApi.getUsers(),
        rbacApi.getRoles()
      ]);
      setUsers(usersResponse.users || []);
      setRoles(rolesResponse.roles || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManageRoles = (user: User) => {
    setSelectedUser(user);
    setSelectedRoles(user.rbac_roles?.map(role => role.id) || []);
    setIsAssignModalOpen(true);
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    
    try {
      setSaving(true);
      await rbacApi.assignUserRoles(selectedUser.id, selectedRoles);
      await loadData(); // Reload data to reflect changes
      setIsAssignModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to save role assignments:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Role Assignment</h2>
          <p className="text-gray-600">Assign roles to users and manage their permissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{user.username}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    {user.rbac_roles?.map((role) => (
                      <Badge 
                        key={role.id} 
                        style={{ backgroundColor: role.color }}
                        className="text-white"
                      >
                        {role.display_name}
                      </Badge>
                    )) || (
                      <Badge variant="secondary">No roles assigned</Badge>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleManageRoles(user)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Manage Roles
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Users className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">No users found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'No users available'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Role Assignment Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Manage Roles for {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Select the roles to assign to this user:
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={role.id}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={() => handleRoleToggle(role.id)}
                  />
                  <label 
                    htmlFor={role.id}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Badge 
                      style={{ backgroundColor: role.color }}
                      className="text-white"
                    >
                      {role.display_name}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {role.description}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsAssignModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRoles}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Save Roles
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};