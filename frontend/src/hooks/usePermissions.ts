import { useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Enhanced permission checking hooks for RBAC system
 * Provides comprehensive permission and role checking capabilities
 */

export interface PermissionHooks {
  // Permission checking
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  
  // Role checking
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  
  // Permission utilities
  getPermissions: () => Record<string, boolean>;
  getRoles: () => string[];
  
  // Resource-specific permissions
  canView: (resource: string) => boolean;
  canCreate: (resource: string) => boolean;
  canUpdate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canManage: (resource: string) => boolean;
  
  // Business logic permissions
  canViewDashboard: () => boolean;
  canManageInventory: () => boolean;
  canManageCustomers: () => boolean;
  canManageInvoices: () => boolean;
  canViewAccounting: () => boolean;
  canManageAccounting: () => boolean;
  canViewReports: () => boolean;
  canCreateReports: () => boolean;
  canViewAnalytics: () => boolean;
  canManageSettings: () => boolean;
  canManageSMS: () => boolean;
  canViewAuditLogs: () => boolean;
  
  // Administrative permissions
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isManager: () => boolean;
  isAccountant: () => boolean;
  isSalesRep: () => boolean;
  isInventoryClerk: () => boolean;
  isViewer: () => boolean;
}

export const usePermissions = (): PermissionHooks => {
  const { user, hasPermission: authHasPermission, hasRole: authHasRole, hasAnyRole: authHasAnyRole } = useAuth();

  // Basic permission checking
  const hasPermission = useCallback((permission: string): boolean => {
    return authHasPermission(permission);
  }, [authHasPermission]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => authHasPermission(permission));
  }, [authHasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => authHasPermission(permission));
  }, [authHasPermission]);

  // Role checking
  const hasRole = useCallback((role: string): boolean => {
    return authHasRole(role);
  }, [authHasRole]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return authHasAnyRole(roles);
  }, [authHasAnyRole]);

  const hasAllRoles = useCallback((roles: string[]): boolean => {
    if (!user?.rbac_roles) return false;
    const userRoles = user.rbac_roles.map(role => role.name);
    return roles.every(role => userRoles.includes(role));
  }, [user]);

  // Permission utilities
  const getPermissions = useCallback((): Record<string, boolean> => {
    if (!user?.rbac_roles) return {};
    
    const permissions: Record<string, boolean> = {};
    user.rbac_roles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(permission => {
          permissions[permission.name] = true;
        });
      }
    });
    
    return permissions;
  }, [user]);

  const getRoles = useCallback((): string[] => {
    if (!user?.rbac_roles) return [];
    return user.rbac_roles.map(role => role.name);
  }, [user]);

  // Resource-specific permissions
  const canView = useCallback((resource: string): boolean => {
    return hasPermission(`${resource}:view`);
  }, [hasPermission]);

  const canCreate = useCallback((resource: string): boolean => {
    return hasPermission(`${resource}:create`);
  }, [hasPermission]);

  const canUpdate = useCallback((resource: string): boolean => {
    return hasPermission(`${resource}:update`);
  }, [hasPermission]);

  const canDelete = useCallback((resource: string): boolean => {
    return hasPermission(`${resource}:delete`);
  }, [hasPermission]);

  const canManage = useCallback((resource: string): boolean => {
    return hasAnyPermission([
      `${resource}:create`,
      `${resource}:update`,
      `${resource}:delete`
    ]);
  }, [hasAnyPermission]);

  // Business logic permissions
  const canViewDashboard = useCallback((): boolean => {
    return hasPermission('dashboard:view');
  }, [hasPermission]);

  const canManageInventory = useCallback((): boolean => {
    return hasAnyPermission([
      'inventory:create',
      'inventory:update',
      'inventory:delete',
      'inventory:manage_categories',
      'inventory:stock_adjustment'
    ]);
  }, [hasAnyPermission]);

  const canManageCustomers = useCallback((): boolean => {
    return hasAnyPermission([
      'customers:create',
      'customers:update',
      'customers:delete'
    ]);
  }, [hasAnyPermission]);

  const canManageInvoices = useCallback((): boolean => {
    return hasAnyPermission([
      'invoices:create',
      'invoices:update',
      'invoices:delete',
      'invoices:approve',
      'invoices:send',
      'invoices:payment'
    ]);
  }, [hasAnyPermission]);

  const canViewAccounting = useCallback((): boolean => {
    return hasAnyPermission([
      'accounting:view',
      'accounting:view_reports'
    ]);
  }, [hasAnyPermission]);

  const canManageAccounting = useCallback((): boolean => {
    return hasAnyPermission([
      'accounting:create_entries',
      'accounting:update_entries',
      'accounting:delete_entries',
      'accounting:chart_of_accounts'
    ]);
  }, [hasAnyPermission]);

  const canViewReports = useCallback((): boolean => {
    return hasPermission('reports:view');
  }, [hasPermission]);

  const canCreateReports = useCallback((): boolean => {
    return hasAnyPermission([
      'reports:create',
      'reports:schedule'
    ]);
  }, [hasAnyPermission]);

  const canViewAnalytics = useCallback((): boolean => {
    return hasPermission('analytics:view');
  }, [hasPermission]);

  const canManageSettings = useCallback((): boolean => {
    return hasAnyPermission([
      'settings:update',
      'settings:user_management',
      'settings:system_config'
    ]);
  }, [hasAnyPermission]);

  const canManageSMS = useCallback((): boolean => {
    return hasAnyPermission([
      'sms:send',
      'sms:manage_templates',
      'sms:campaigns'
    ]);
  }, [hasAnyPermission]);

  const canViewAuditLogs = useCallback((): boolean => {
    return hasPermission('system:audit_logs');
  }, [hasPermission]);

  // Administrative role checks
  const isAdmin = useCallback((): boolean => {
    return hasAnyRole(['admin', 'super_admin']);
  }, [hasAnyRole]);

  const isSuperAdmin = useCallback((): boolean => {
    return hasRole('super_admin');
  }, [hasRole]);

  const isManager = useCallback((): boolean => {
    return hasRole('manager');
  }, [hasRole]);

  const isAccountant = useCallback((): boolean => {
    return hasRole('accountant');
  }, [hasRole]);

  const isSalesRep = useCallback((): boolean => {
    return hasRole('sales_rep');
  }, [hasRole]);

  const isInventoryClerk = useCallback((): boolean => {
    return hasRole('inventory_clerk');
  }, [hasRole]);

  const isViewer = useCallback((): boolean => {
    return hasRole('viewer');
  }, [hasRole]);

  return {
    // Basic permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Role checking
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Permission utilities
    getPermissions,
    getRoles,
    
    // Resource-specific permissions
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canManage,
    
    // Business logic permissions
    canViewDashboard,
    canManageInventory,
    canManageCustomers,
    canManageInvoices,
    canViewAccounting,
    canManageAccounting,
    canViewReports,
    canCreateReports,
    canViewAnalytics,
    canManageSettings,
    canManageSMS,
    canViewAuditLogs,
    
    // Administrative permissions
    isAdmin,
    isSuperAdmin,
    isManager,
    isAccountant,
    isSalesRep,
    isInventoryClerk,
    isViewer,
  };
};

// Convenience hooks for specific use cases
export const useRoleCheck = () => {
  const { hasRole, hasAnyRole } = usePermissions();
  return { hasRole, hasAnyRole };
};

export const usePermissionCheck = () => {
  const { hasPermission, hasAnyPermission } = usePermissions();
  return { hasPermission, hasAnyPermission };
};

export const useResourcePermissions = (resource: string) => {
  const { canView, canCreate, canUpdate, canDelete, canManage } = usePermissions();
  
  return {
    canView: () => canView(resource),
    canCreate: () => canCreate(resource),
    canUpdate: () => canUpdate(resource),
    canDelete: () => canDelete(resource),
    canManage: () => canManage(resource),
  };
};

export const useAdminCheck = () => {
  const { isAdmin, isSuperAdmin, isManager } = usePermissions();
  return { isAdmin, isSuperAdmin, isManager };
};