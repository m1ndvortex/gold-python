import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallbackPath?: string;
  showError?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallbackPath = '/login',
  showError = true,
}) => {
  const { isAuthenticated, isLoading, hasPermission, hasAnyRole } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle navigation when not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(fallbackPath, { state: { from: location }, replace: true });
    }
  }, [isLoading, isAuthenticated, navigate, fallbackPath, location]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-600" />
          <p className="text-gray-600">
            {language === 'en' ? 'Loading...' : 'در حال بارگذاری...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    if (showError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {language === 'en' 
                  ? 'You do not have the required role to access this page.' 
                  : 'شما دسترسی لازم برای مشاهده این صفحه را ندارید.'
                }
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }
    // Redirect to dashboard if role requirements are not met but no error should be shown
    navigate('/', { replace: true });
    return null;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
    
    if (!hasAllPermissions) {
      if (showError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === 'en' 
                    ? 'You do not have the required permissions to access this page.' 
                    : 'شما مجوز لازم برای مشاهده این صفحه را ندارید.'
                  }
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );
      }
      // Redirect to dashboard if permission requirements are not met but no error should be shown
      navigate('/', { replace: true });
      return null;
    }
  }

  // User is authenticated and has required permissions/roles
  return <>{children}</>;
};

// HOC version for class components or more complex wrapping
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <AuthGuard {...options}>
      <Component {...props} />
    </AuthGuard>
  );

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for conditional rendering based on permissions
export const usePermissionGuard = () => {
  const { hasPermission, hasRole, hasAnyRole, user } = useAuth();

  const canAccess = (permissions: string[] = [], roles: string[] = []) => {
    if (roles.length > 0 && !hasAnyRole(roles)) {
      return false;
    }
    
    if (permissions.length > 0) {
      return permissions.every(permission => hasPermission(permission));
    }
    
    return true;
  };

  return {
    canAccess,
    hasPermission,
    hasRole,
    hasAnyRole,
    user,
  };
};