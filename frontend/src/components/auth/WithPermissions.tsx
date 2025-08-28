import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';

export interface WithPermissionsProps {
  children: ReactNode;
  
  // Permission-based access control
  permissions?: string[];
  anyPermission?: string[];
  allPermissions?: string[];
  
  // Role-based access control
  roles?: string[];
  anyRole?: string[];
  allRoles?: string[];
  
  // Resource-based permissions
  resource?: string;
  actions?: ('view' | 'create' | 'update' | 'delete')[];
  
  // Fallback components
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  
  // Behavior options
  hideWhenUnauthorized?: boolean;
  showLoadingWhileChecking?: boolean;
  
  // Custom authorization function
  customCheck?: () => boolean;
}

/**
 * WithPermissions component wrapper for conditional rendering based on user permissions
 * 
 * Usage examples:
 * 
 * // Single permission
 * <WithPermissions permissions={['inventory:view']}>
 *   <InventoryList />
 * </WithPermissions>
 * 
 * // Any of multiple permissions
 * <WithPermissions anyPermission={['inventory:view', 'inventory:create']}>
 *   <InventoryActions />
 * </WithPermissions>
 * 
 * // Role-based access
 * <WithPermissions roles={['admin', 'manager']}>
 *   <AdminPanel />
 * </WithPermissions>
 * 
 * // Resource-based permissions
 * <WithPermissions resource="inventory" actions={['create', 'update']}>
 *   <InventoryForm />
 * </WithPermissions>
 * 
 * // With fallback
 * <WithPermissions 
 *   permissions={['admin:access']} 
 *   fallback={<div>Access denied</div>}
 * >
 *   <AdminSettings />
 * </WithPermissions>
 */
export const WithPermissions: React.FC<WithPermissionsProps> = ({
  children,
  permissions = [],
  anyPermission = [],
  allPermissions = [],
  roles = [],
  anyRole = [],
  allRoles = [],
  resource,
  actions = [],
  fallback = null,
  loadingFallback = null,
  hideWhenUnauthorized = false,
  showLoadingWhileChecking = false,
  customCheck,
}) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canView,
    canCreate,
    canUpdate,
    canDelete,
  } = usePermissions();

  // Show loading state if requested and auth is still initializing
  if (showLoadingWhileChecking && (!isInitialized || isLoading)) {
    return loadingFallback ? <>{loadingFallback}</> : null;
  }

  // Must be authenticated to check permissions
  if (!isAuthenticated) {
    return hideWhenUnauthorized ? null : <>{fallback}</>;
  }

  // Custom authorization check
  if (customCheck && !customCheck()) {
    return hideWhenUnauthorized ? null : <>{fallback}</>;
  }

  // Check specific permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = permissions.every(permission => hasPermission(permission));
    if (!hasRequiredPermissions) {
      return hideWhenUnauthorized ? null : <>{fallback}</>;
    }
  }

  // Check any permission (OR logic)
  if (anyPermission.length > 0) {
    const hasAnyRequiredPermission = hasAnyPermission(anyPermission);
    if (!hasAnyRequiredPermission) {
      return hideWhenUnauthorized ? null : <>{fallback}</>;
    }
  }

  // Check all permissions (AND logic)
  if (allPermissions.length > 0) {
    const hasAllRequiredPermissions = hasAllPermissions(allPermissions);
    if (!hasAllRequiredPermissions) {
      return hideWhenUnauthorized ? null : <>{fallback}</>;
    }
  }

  // Check specific roles
  if (roles.length > 0) {
    const hasRequiredRoles = roles.every(role => hasRole(role));
    if (!hasRequiredRoles) {
      return hideWhenUnauthorized ? null : <>{fallback}</>;
    }
  }

  // Check any role (OR logic)
  if (anyRole.length > 0) {
    const hasAnyRequiredRole = hasAnyRole(anyRole);
    if (!hasAnyRequiredRole) {
      return hideWhenUnauthorized ? null : <>{fallback}</>;
    }
  }

  // Check all roles (AND logic)
  if (allRoles.length > 0) {
    const hasAllRequiredRoles = hasAllRoles(allRoles);
    if (!hasAllRequiredRoles) {
      return hideWhenUnauthorized ? null : <>{fallback}</>;
    }
  }

  // Check resource-based permissions
  if (resource && actions.length > 0) {
    const resourcePermissionChecks = {
      view: () => canView(resource),
      create: () => canCreate(resource),
      update: () => canUpdate(resource),
      delete: () => canDelete(resource),
    };

    const hasResourcePermissions = actions.every(action => {
      const checkFunction = resourcePermissionChecks[action];
      return checkFunction ? checkFunction() : false;
    });

    if (!hasResourcePermissions) {
      return hideWhenUnauthorized ? null : <>{fallback}</>;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
};

// Convenience components for common use cases

export interface ProtectedComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  hideWhenUnauthorized?: boolean;
}

/**
 * Admin-only component wrapper
 */
export const AdminOnly: React.FC<ProtectedComponentProps> = ({ 
  children, 
  fallback = <div className="text-red-600">Admin access required</div>,
  hideWhenUnauthorized = false 
}) => (
  <WithPermissions 
    anyRole={['admin', 'super_admin']} 
    fallback={fallback}
    hideWhenUnauthorized={hideWhenUnauthorized}
  >
    {children}
  </WithPermissions>
);

/**
 * Manager or higher access component wrapper
 */
export const ManagerOrHigher: React.FC<ProtectedComponentProps> = ({ 
  children, 
  fallback = <div className="text-red-600">Manager access required</div>,
  hideWhenUnauthorized = false 
}) => (
  <WithPermissions 
    anyRole={['manager', 'admin', 'super_admin']} 
    fallback={fallback}
    hideWhenUnauthorized={hideWhenUnauthorized}
  >
    {children}
  </WithPermissions>
);

/**
 * Financial access component wrapper (accountant, manager, admin)
 */
export const FinancialAccess: React.FC<ProtectedComponentProps> = ({ 
  children, 
  fallback = <div className="text-red-600">Financial access required</div>,
  hideWhenUnauthorized = false 
}) => (
  <WithPermissions 
    anyRole={['accountant', 'manager', 'admin', 'super_admin']} 
    fallback={fallback}
    hideWhenUnauthorized={hideWhenUnauthorized}
  >
    {children}
  </WithPermissions>
);

/**
 * Inventory access component wrapper
 */
export const InventoryAccess: React.FC<ProtectedComponentProps> = ({ 
  children, 
  fallback = <div className="text-red-600">Inventory access required</div>,
  hideWhenUnauthorized = false 
}) => (
  <WithPermissions 
    anyPermission={['inventory:view', 'inventory:create', 'inventory:update']} 
    fallback={fallback}
    hideWhenUnauthorized={hideWhenUnauthorized}
  >
    {children}
  </WithPermissions>
);

/**
 * Sales access component wrapper
 */
export const SalesAccess: React.FC<ProtectedComponentProps> = ({ 
  children, 
  fallback = <div className="text-red-600">Sales access required</div>,
  hideWhenUnauthorized = false 
}) => (
  <WithPermissions 
    anyRole={['sales_rep', 'manager', 'admin', 'super_admin']} 
    fallback={fallback}
    hideWhenUnauthorized={hideWhenUnauthorized}
  >
    {children}
  </WithPermissions>
);

/**
 * Reports access component wrapper
 */
export const ReportsAccess: React.FC<ProtectedComponentProps> = ({ 
  children, 
  fallback = <div className="text-red-600">Reports access required</div>,
  hideWhenUnauthorized = false 
}) => (
  <WithPermissions 
    permissions={['reports:view']} 
    fallback={fallback}
    hideWhenUnauthorized={hideWhenUnauthorized}
  >
    {children}
  </WithPermissions>
);

/**
 * Settings access component wrapper
 */
export const SettingsAccess: React.FC<ProtectedComponentProps> = ({ 
  children, 
  fallback = <div className="text-red-600">Settings access required</div>,
  hideWhenUnauthorized = false 
}) => (
  <WithPermissions 
    anyPermission={['settings:view', 'settings:update']} 
    fallback={fallback}
    hideWhenUnauthorized={hideWhenUnauthorized}
  >
    {children}
  </WithPermissions>
);

// Higher-order component version
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  permissionProps: Omit<WithPermissionsProps, 'children'>
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <WithPermissions {...permissionProps}>
        <Component {...props} />
      </WithPermissions>
    );
  };
}

// Hook for conditional logic based on permissions
export const useConditionalRender = () => {
  const permissions = usePermissions();
  const { isAuthenticated } = useAuth();

  const renderIf = (condition: () => boolean, component: ReactNode, fallback: ReactNode = null) => {
    if (!isAuthenticated) return fallback;
    return condition() ? component : fallback;
  };

  const renderIfPermission = (permission: string, component: ReactNode, fallback: ReactNode = null) => {
    return renderIf(() => permissions.hasPermission(permission), component, fallback);
  };

  const renderIfRole = (role: string, component: ReactNode, fallback: ReactNode = null) => {
    return renderIf(() => permissions.hasRole(role), component, fallback);
  };

  const renderIfAnyRole = (roles: string[], component: ReactNode, fallback: ReactNode = null) => {
    return renderIf(() => permissions.hasAnyRole(roles), component, fallback);
  };

  return {
    renderIf,
    renderIfPermission,
    renderIfRole,
    renderIfAnyRole,
  };
};