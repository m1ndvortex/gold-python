import { AuthenticatedApiClient } from './AuthenticatedApiClient';
import {
  RBACRole,
  RBACPermission,
  RBACPermissionGroup,
  RBACUserPermission,
  RoleCreateRequest,
  RoleUpdateRequest,
  PermissionCreateRequest,
  PermissionUpdateRequest,
  UserRoleAssignment,
  UserPermissionAssignment,
  PermissionCheckRequest,
  PermissionCheckResponse,
  UserPermissionSummary,
  AccessAuditFilters,
  AccessAuditResponse,
  ApiResponse
} from '../types';

class RBACApiService {
  private api: AuthenticatedApiClient;

  constructor() {
    this.api = new AuthenticatedApiClient();
  }

  // Role Management
  async getRoles(): Promise<{ roles: RBACRole[] }> {
    const response = await this.api.get<{ roles: RBACRole[] }>('/api/rbac/roles');
    return response;
  }

  async getRole(roleId: string): Promise<RBACRole> {
    const response = await this.api.get<ApiResponse<RBACRole>>(`/api/rbac/roles/${roleId}`);
    return response.data;
  }

  async createRole(roleData: RoleCreateRequest): Promise<RBACRole> {
    const response = await this.api.post<ApiResponse<RBACRole>>('/api/rbac/roles', roleData);
    return response.data;
  }

  async updateRole(roleId: string, roleData: RoleUpdateRequest): Promise<RBACRole> {
    const response = await this.api.put<ApiResponse<RBACRole>>(`/api/rbac/roles/${roleId}`, roleData);
    return response.data;
  }

  async deleteRole(roleId: string): Promise<void> {
    await this.api.delete(`/api/rbac/roles/${roleId}`);
  }

  // Permission Management
  async getPermissions(): Promise<RBACPermission[]> {
    const response = await this.api.get<RBACPermission[]>('/api/rbac/permissions');
    return response;
  }

  async getPermission(permissionId: string): Promise<RBACPermission> {
    const response = await this.api.get<RBACPermission>(`/api/rbac/permissions/${permissionId}`);
    return response;
  }

  async createPermission(permissionData: PermissionCreateRequest): Promise<RBACPermission> {
    const response = await this.api.post<RBACPermission>('/api/rbac/permissions', permissionData);
    return response;
  }

  async updatePermission(permissionId: string, permissionData: PermissionUpdateRequest): Promise<RBACPermission> {
    const response = await this.api.put<RBACPermission>(`/api/rbac/permissions/${permissionId}`, permissionData);
    return response;
  }

  async deletePermission(permissionId: string): Promise<void> {
    await this.api.delete(`/api/rbac/permissions/${permissionId}`);
  }

  // Permission Groups
  async getPermissionGroups(): Promise<RBACPermissionGroup[]> {
    const response = await this.api.get<RBACPermissionGroup[]>('/api/rbac/permission-groups');
    return response;
  }

  // User Management
  async getUsers(): Promise<{ users: any[] }> {
    const response = await this.api.get<{ users: any[] }>('/api/users');
    return response;
  }

  // User Role Assignment
  async getUserRoles(userId: string): Promise<RBACRole[]> {
    const response = await this.api.get<RBACRole[]>(`/api/rbac/users/${userId}/roles`);
    return response;
  }

  async assignUserRoles(userId: string, roleIds: string[]): Promise<void> {
    await this.api.post('/api/rbac/users/assign-roles', { user_id: userId, role_ids: roleIds });
  }

  async removeUserRole(userId: string, roleId: string): Promise<void> {
    await this.api.delete(`/api/rbac/users/${userId}/roles/${roleId}`);
  }

  // User Permission Assignment
  async getUserPermissions(userId: string): Promise<UserPermissionSummary> {
    const response = await this.api.get<UserPermissionSummary>(`/api/rbac/users/${userId}/permissions`);
    return response;
  }

  async assignUserPermission(assignment: UserPermissionAssignment): Promise<void> {
    await this.api.post('/api/rbac/users/assign-permission', assignment);
  }

  async removeUserPermission(userId: string, permissionId: string): Promise<void> {
    await this.api.delete(`/api/rbac/users/${userId}/permissions/${permissionId}`);
  }

  // Permission Checking
  async checkPermissions(request: PermissionCheckRequest): Promise<PermissionCheckResponse> {
    const response = await this.api.post<PermissionCheckResponse>('/api/rbac/check-permissions', request);
    return response;
  }

  // Audit Logs
  async getAccessLogs(filters?: AccessAuditFilters): Promise<{ logs: any[] }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const url = `/api/rbac/audit/access-logs${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.api.get<{ logs: any[] }>(url);
    return response;
  }

  // Role Hierarchy
  async getRoleHierarchy(): Promise<any> {
    const response = await this.api.get<any>('/api/rbac/roles/hierarchy');
    return response;
  }

  // Permissions by Category
  async getPermissionsByCategory(): Promise<any> {
    const response = await this.api.get<any>('/api/rbac/permissions/by-category');
    return response;
  }

  // System Statistics
  async getRBACStats(): Promise<any> {
    const response = await this.api.get<any>('/api/rbac/stats');
    return response;
  }
}

export const rbacApi = new RBACApiService();