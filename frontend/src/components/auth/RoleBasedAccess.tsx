import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface RoleBasedAccessProps {
  children: React.ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles. If false, ANY will suffice
  fallback?: React.ReactNode;
  inverse?: boolean; // If true, show children when user DOESN'T have permissions/roles
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = true,
  fallback = null,
  inverse = false,
}) => {
  const { hasPermission, hasRole, hasAnyRole } = useAuth();

  const checkPermissions = (): boolean => {
    if (permissions.length === 0) return true;

    if (requireAll) {
      return permissions.every(permission => hasPermission(permission));
    } else {
      return permissions.some(permission => hasPermission(permission));
    }
  };

  const checkRoles = (): boolean => {
    if (roles.length === 0) return true;

    if (requireAll) {
      return roles.every(role => hasRole(role));
    } else {
      return hasAnyRole(roles);
    }
  };

  const hasAccess = checkPermissions() && checkRoles();
  const shouldShow = inverse ? !hasAccess : hasAccess;

  return shouldShow ? <>{children}</> : <>{fallback}</>;
};

// Specific components for common use cases
export const OwnerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleBasedAccess roles={['Owner']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const ManagerOrOwner: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleBasedAccess roles={['Owner', 'Manager']} requireAll={false} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const CashierAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleBasedAccess roles={['Owner', 'Manager', 'Cashier']} requireAll={false} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const AccountantAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleBasedAccess roles={['Owner', 'Manager', 'Accountant']} requireAll={false} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

// Permission-based components
export const CanViewInventory: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleBasedAccess permissions={['view_inventory']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const CanEditInventory: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleBasedAccess permissions={['edit_inventory']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const CanCreateInvoices: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleBasedAccess permissions={['create_invoices']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const CanViewReports: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleBasedAccess permissions={['view_reports']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const CanManageUsers: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleBasedAccess permissions={['manage_users']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const CanSendSMS: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleBasedAccess permissions={['send_sms']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

// Hook for programmatic access control
export const useRoleBasedAccess = () => {
  const { hasPermission, hasRole, hasAnyRole, user } = useAuth();

  const canAccess = (
    permissions: string[] = [],
    roles: string[] = [],
    requireAll: boolean = true
  ): boolean => {
    const checkPermissions = (): boolean => {
      if (permissions.length === 0) return true;
      
      if (requireAll) {
        return permissions.every(permission => hasPermission(permission));
      } else {
        return permissions.some(permission => hasPermission(permission));
      }
    };

    const checkRoles = (): boolean => {
      if (roles.length === 0) return true;
      
      if (requireAll) {
        return roles.every(role => hasRole(role));
      } else {
        return hasAnyRole(roles);
      }
    };

    return checkPermissions() && checkRoles();
  };

  // Predefined access checks
  const isOwner = () => hasRole('Owner');
  const isManager = () => hasRole('Manager');
  const isCashier = () => hasRole('Cashier');
  const isAccountant = () => hasRole('Accountant');
  
  const isManagerOrOwner = () => hasAnyRole(['Owner', 'Manager']);
  const canManageInventory = () => canAccess(['edit_inventory', 'delete_inventory']);
  const canManageCustomers = () => canAccess(['edit_customers', 'delete_customers']);
  const canManageInvoices = () => canAccess(['create_invoices', 'edit_invoices']);
  const canViewFinancials = () => canAccess(['view_reports', 'view_accounting']);
  const canManageSettings = () => canAccess(['manage_settings']);

  return {
    canAccess,
    hasPermission,
    hasRole,
    hasAnyRole,
    user,
    // Predefined checks
    isOwner,
    isManager,
    isCashier,
    isAccountant,
    isManagerOrOwner,
    canManageInventory,
    canManageCustomers,
    canManageInvoices,
    canViewFinancials,
    canManageSettings,
  };
};