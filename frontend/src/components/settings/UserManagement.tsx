import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  UserCheck, 
  UserX,
  Mail,
  Shield
} from 'lucide-react';
import { 
  useUsers, 
  useCreateUser, 
  useUpdateUser, 
  useUpdateUserPassword, 
  useDeleteUser,
  useRoles
} from '../../hooks/useSettings';
import { UserCreate, UserUpdate, UserPasswordUpdate, UserManagement } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/use-toast';

interface UserFormData {
  username: string;
  email: string;
  password?: string;
  role_id: string;
  is_active: boolean;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const UserManagementComponent: React.FC = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: usersData, isLoading: usersLoading } = useUsers(currentPage, 20);
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const updateUserPassword = useUpdateUserPassword();
  const deleteUser = useDeleteUser();

  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const {
    register: registerUser,
    handleSubmit: handleSubmitUser,
    reset: resetUser,
    setValue: setUserValue,
    watch: watchUser,
    formState: { errors: userErrors },
  } = useForm<UserFormData>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>();

  const handleCreateUser = () => {
    resetUser({
      username: '',
      email: '',
      password: '',
      role_id: '',
      is_active: true,
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditUser = (user: UserManagement) => {
    setSelectedUser(user);
    resetUser({
      username: user.username,
      email: user.email,
      role_id: user.role_id || '',
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleChangePassword = (user: UserManagement) => {
    setSelectedUser(user);
    resetPassword({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setIsPasswordDialogOpen(true);
  };

  const onSubmitCreate = async (data: UserFormData) => {
    const userData: UserCreate = {
      username: data.username,
      email: data.email,
      password: data.password!,
      role_id: data.role_id,
    };

    createUser.mutate(userData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetUser();
      },
    });
  };

  const onSubmitEdit = async (data: UserFormData) => {
    if (!selectedUser) return;

    const userUpdate: UserUpdate = {
      username: data.username,
      email: data.email,
      role_id: data.role_id,
      is_active: data.is_active,
    };

    updateUser.mutate(
      { userId: selectedUser.id, userUpdate },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedUser(null);
          resetUser();
        },
      }
    );
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    if (!selectedUser) return;

    if (data.new_password !== data.confirm_password) {
      return;
    }

    const passwordUpdate: UserPasswordUpdate = {
      current_password: data.current_password,
      new_password: data.new_password,
    };

    updateUserPassword.mutate(
      { userId: selectedUser.id, passwordUpdate },
      {
        onSuccess: () => {
          setIsPasswordDialogOpen(false);
          setSelectedUser(null);
          resetPassword();
        },
      }
    );
  };

  const handleDeleteUser = (user: UserManagement) => {
    // Prevent users from deleting themselves
    if (currentUser?.id === user.id) {
      toast({
        title: 'Action Not Allowed',
        description: 'You cannot delete your own account.',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      deleteUser.mutate(user.id);
    }
  };

  const toggleUserStatus = (user: UserManagement) => {
    // Prevent users from deactivating themselves
    if (currentUser?.id === user.id && user.is_active) {
      toast({
        title: 'Action Not Allowed',
        description: 'You cannot deactivate your own account. Please contact another administrator.',
        variant: 'destructive',
      });
      return;
    }

    updateUser.mutate({
      userId: user.id,
      userUpdate: { is_active: !user.is_active },
    });
  };

  if (usersLoading || rolesLoading) {
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

  const newPassword = watchPassword('new_password');
  const confirmPassword = watchPassword('confirm_password');

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                  User Management
                </CardTitle>
                <CardDescription className="text-base">
                  Manage system users and their access permissions
                </CardDescription>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleCreateUser}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Users Table */}
          <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b">
                  <TableHead className="font-semibold text-slate-700">User</TableHead>
                  <TableHead className="font-semibold text-slate-700">Role</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Created</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData?.users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge 
                          variant="outline" 
                          className={`flex items-center gap-1 w-fit font-medium shadow-sm ${
                            user.role.name === 'Owner' ? 'bg-purple-500 text-white border-purple-600' :
                            user.role.name === 'Manager' ? 'bg-blue-500 text-white border-blue-600' :
                            user.role.name === 'Accountant' ? 'bg-emerald-500 text-white border-emerald-600' :
                            user.role.name === 'Cashier' ? 'bg-amber-500 text-white border-amber-600' :
                            'bg-slate-500 text-white border-slate-600'
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          {user.role.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-500 text-white border-gray-600 shadow-sm">No Role</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => toggleUserStatus(user)}
                          disabled={updateUser.isPending || (currentUser?.id === user.id && user.is_active)}
                        />
                        <Badge variant={user.is_active ? 'default' : 'secondary'} className={user.is_active ? 'bg-green-500 text-white border-green-600 shadow-sm' : 'bg-red-500 text-white border-red-600 shadow-sm'}>
                          {user.is_active ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                        {currentUser?.id === user.id && (
                          <Badge variant="outline" className="text-xs bg-blue-500 text-white border-blue-600 shadow-sm font-medium">
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangePassword(user)}
                          className="hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={currentUser?.id === user.id}
                          title={currentUser?.id === user.id ? 'You cannot delete your own account' : 'Delete user'}
                          className={`transition-colors ${currentUser?.id === user.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 hover:border-red-300 hover:text-red-700'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {usersData && usersData.total > 20 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, usersData.total)} of {usersData.total} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage * 20 >= usersData.total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">Create New User</DialogTitle>
                  <DialogDescription className="text-base text-muted-foreground">
                    Add a new user to the system with appropriate permissions
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmitUser(onSubmitCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    {...registerUser('username', { required: 'Username is required' })}
                    placeholder="Enter username"
                  />
                  {userErrors.username && (
                    <p className="text-sm text-destructive">{userErrors.username.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...registerUser('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    placeholder="Enter email"
                  />
                  {userErrors.email && (
                    <p className="text-sm text-destructive">{userErrors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...registerUser('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  placeholder="Enter password"
                />
                {userErrors.password && (
                  <p className="text-sm text-destructive">{userErrors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(value) => setUserValue('role_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUser.isPending}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {createUser.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Edit className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">Edit User</DialogTitle>
                  <DialogDescription className="text-base text-muted-foreground">
                    Modify user details and access permissions
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmitUser(onSubmitEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input
                    id="edit-username"
                    {...registerUser('username', { required: 'Username is required' })}
                    placeholder="Enter username"
                  />
                  {userErrors.username && (
                    <p className="text-sm text-destructive">{userErrors.username.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    {...registerUser('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    placeholder="Enter email"
                  />
                  {userErrors.email && (
                    <p className="text-sm text-destructive">{userErrors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={watchUser('role_id')} 
                  onValueChange={(value) => setUserValue('role_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label htmlFor="edit-active">Active Status</Label>
                  {currentUser?.id === selectedUser?.id && watchUser('is_active') && (
                    <span className="text-xs text-muted-foreground mt-1">
                      You cannot deactivate your own account
                    </span>
                  )}
                </div>
                <Switch
                  id="edit-active"
                  checked={watchUser('is_active')}
                  onCheckedChange={(checked) => setUserValue('is_active', checked)}
                  disabled={currentUser?.id === selectedUser?.id && watchUser('is_active')}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateUser.isPending}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {updateUser.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Updating...
                    </div>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">Change Password</DialogTitle>
                  <DialogDescription className="text-base text-muted-foreground">
                    Update password for {selectedUser?.username}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  {...registerPassword('current_password', { required: 'Current password is required' })}
                  placeholder="Enter current password"
                />
                {passwordErrors.current_password && (
                  <p className="text-sm text-destructive">{passwordErrors.current_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  {...registerPassword('new_password', { 
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  placeholder="Enter new password"
                />
                {passwordErrors.new_password && (
                  <p className="text-sm text-destructive">{passwordErrors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  {...registerPassword('confirm_password', { 
                    required: 'Please confirm your password',
                    validate: (value) => value === newPassword || 'Passwords do not match'
                  })}
                  placeholder="Confirm new password"
                />
                {passwordErrors.confirm_password && (
                  <p className="text-sm text-destructive">{passwordErrors.confirm_password.message}</p>
                )}
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordDialogOpen(false)}
                  className="hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateUserPassword.isPending || newPassword !== confirmPassword}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {updateUserPassword.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Updating...
                    </div>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};