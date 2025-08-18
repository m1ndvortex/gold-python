import { api } from '../utils/api';
import {
  CompanySettings,
  CompanySettingsUpdate,
  GoldPriceConfig,
  GoldPriceUpdate,
  InvoiceTemplate,
  InvoiceTemplateUpdate,
  UserListResponse,
  UserManagement,
  UserCreate,
  UserUpdate,
  UserPasswordUpdate,
  RoleWithUsers,
  RoleCreate,
  RoleUpdate,
  PermissionStructure,
  RoleAssignment,
  SystemSettings,
  SettingsUpdateResponse,
} from '../types';

// Company Settings API
export const settingsApi = {
  // Company Settings
  getCompanySettings: async (): Promise<CompanySettings> => {
    const response = await api.get('/settings/company');
    return response.data as CompanySettings;
  },

  updateCompanySettings: async (settings: CompanySettingsUpdate): Promise<SettingsUpdateResponse> => {
    const response = await api.put('/settings/company', settings);
    return response.data as SettingsUpdateResponse;
  },

  // Gold Price Configuration
  getGoldPriceConfig: async (): Promise<GoldPriceConfig> => {
    const response = await api.get('/settings/gold-price');
    return response.data as GoldPriceConfig;
  },

  updateGoldPrice: async (priceUpdate: GoldPriceUpdate): Promise<SettingsUpdateResponse> => {
    const response = await api.put('/settings/gold-price', priceUpdate);
    return response.data as SettingsUpdateResponse;
  },

  // Invoice Template
  getInvoiceTemplate: async (): Promise<InvoiceTemplate> => {
    const response = await api.get('/settings/invoice-template');
    return response.data as InvoiceTemplate;
  },

  updateInvoiceTemplate: async (templateUpdate: InvoiceTemplateUpdate): Promise<SettingsUpdateResponse> => {
    const response = await api.put('/settings/invoice-template', templateUpdate);
    return response.data as SettingsUpdateResponse;
  },

  // Role Management
  getAllRoles: async (): Promise<RoleWithUsers[]> => {
    const response = await api.get('/settings/roles');
    return response.data as RoleWithUsers[];
  },

  createRole: async (roleData: RoleCreate): Promise<RoleWithUsers> => {
    const response = await api.post('/settings/roles', roleData);
    return response.data as RoleWithUsers;
  },

  updateRole: async (roleId: string, roleUpdate: RoleUpdate): Promise<RoleWithUsers> => {
    const response = await api.put(`/settings/roles/${roleId}`, roleUpdate);
    return response.data as RoleWithUsers;
  },

  deleteRole: async (roleId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/settings/roles/${roleId}`);
    return response.data as { message: string };
  },

  // Permission Structure
  getPermissionStructure: async (): Promise<PermissionStructure> => {
    const response = await api.get('/settings/permissions');
    return response.data as PermissionStructure;
  },

  // User Management
  getAllUsers: async (page: number = 1, perPage: number = 50): Promise<UserListResponse> => {
    const response = await api.get(`/settings/users?page=${page}&per_page=${perPage}`);
    return response.data as UserListResponse;
  },

  createUser: async (userData: UserCreate): Promise<UserManagement> => {
    const response = await api.post('/settings/users', userData);
    return response.data as UserManagement;
  },

  updateUser: async (userId: string, userUpdate: UserUpdate): Promise<UserManagement> => {
    const response = await api.put(`/settings/users/${userId}`, userUpdate);
    return response.data as UserManagement;
  },

  updateUserPassword: async (userId: string, passwordUpdate: UserPasswordUpdate): Promise<SettingsUpdateResponse> => {
    const response = await api.put(`/settings/users/${userId}/password`, passwordUpdate);
    return response.data as SettingsUpdateResponse;
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/settings/users/${userId}`);
    return response.data as { message: string };
  },

  assignRoleToUser: async (userId: string, roleAssignment: RoleAssignment): Promise<{ message: string }> => {
    const response = await api.post(`/settings/users/${userId}/assign-role`, roleAssignment);
    return response.data as { message: string };
  },

  // System Settings Overview
  getSystemSettings: async (): Promise<SystemSettings> => {
    const response = await api.get('/settings/system');
    return response.data as SystemSettings;
  },
};