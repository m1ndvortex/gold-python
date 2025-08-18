import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../services/settingsApi';
import {
  CompanySettingsUpdate,
  GoldPriceUpdate,
  InvoiceTemplateUpdate,
  UserCreate,
  UserUpdate,
  UserPasswordUpdate,
  RoleCreate,
  RoleUpdate,
  RoleAssignment,
} from '../types';
import { useToast } from '../components/ui/use-toast';

// Company Settings Hooks
export const useCompanySettings = () => {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: settingsApi.getCompanySettings,
  });
};

export const useUpdateCompanySettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings: CompanySettingsUpdate) => settingsApi.updateCompanySettings(settings),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update company settings',
        variant: 'destructive',
      });
    },
  });
};

// Gold Price Hooks
export const useGoldPriceConfig = () => {
  return useQuery({
    queryKey: ['gold-price-config'],
    queryFn: settingsApi.getGoldPriceConfig,
  });
};

export const useUpdateGoldPrice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (priceUpdate: GoldPriceUpdate) => settingsApi.updateGoldPrice(priceUpdate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gold-price-config'] });
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update gold price',
        variant: 'destructive',
      });
    },
  });
};

// Invoice Template Hooks
export const useInvoiceTemplate = () => {
  return useQuery({
    queryKey: ['invoice-template'],
    queryFn: settingsApi.getInvoiceTemplate,
  });
};

export const useUpdateInvoiceTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (templateUpdate: InvoiceTemplateUpdate) => settingsApi.updateInvoiceTemplate(templateUpdate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-template'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update invoice template',
        variant: 'destructive',
      });
    },
  });
};

// Role Management Hooks
export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: settingsApi.getAllRoles,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (roleData: RoleCreate) => settingsApi.createRole(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'Role created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create role',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ roleId, roleUpdate }: { roleId: string; roleUpdate: RoleUpdate }) =>
      settingsApi.updateRole(roleId, roleUpdate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'Role updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update role',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (roleId: string) => settingsApi.deleteRole(roleId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete role',
        variant: 'destructive',
      });
    },
  });
};

// Permission Structure Hook
export const usePermissionStructure = () => {
  return useQuery({
    queryKey: ['permission-structure'],
    queryFn: settingsApi.getPermissionStructure,
  });
};

// User Management Hooks
export const useUsers = (page: number = 1, perPage: number = 50) => {
  return useQuery({
    queryKey: ['users', page, perPage],
    queryFn: () => settingsApi.getAllUsers(page, perPage),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userData: UserCreate) => settingsApi.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, userUpdate }: { userId: string; userUpdate: UserUpdate }) =>
      settingsApi.updateUser(userId, userUpdate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateUserPassword = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, passwordUpdate }: { userId: string; passwordUpdate: UserPasswordUpdate }) =>
      settingsApi.updateUserPassword(userId, passwordUpdate),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update password',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: string) => settingsApi.deleteUser(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });
};

export const useAssignRoleToUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, roleAssignment }: { userId: string; roleAssignment: RoleAssignment }) =>
      settingsApi.assignRoleToUser(userId, roleAssignment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to assign role',
        variant: 'destructive',
      });
    },
  });
};

// System Settings Hook
export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: settingsApi.getSystemSettings,
  });
};