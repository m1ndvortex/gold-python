import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Role, LoginCredentials, AuthResponse } from '../types';
import { tokenManager, TokenPayload } from '../services/TokenManager';
import { api } from '../utils/api';

export interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Authentication actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  
  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getPermissions: () => Record<string, boolean>;
  
  // Token management
  getToken: () => string | null;
  isTokenExpired: () => boolean;
  getTokenInfo: () => any;
  
  // User management
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  
  // Legacy compatibility
  isLoggingIn: boolean;
  loginError: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Auto-refresh token when it's expiring
  useEffect(() => {
    if (isAuthenticated && tokenManager.isTokenExpiringSoon()) {
      refreshToken();
    }
  }, [isAuthenticated]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we have valid tokens
      if (tokenManager.isAuthenticated()) {
        // Try to get user info from token first
        const tokenPayload = tokenManager.getCurrentUserFromToken();
        if (tokenPayload) {
          // Fetch full user data from server
          await fetchUserData();
        } else {
          // Invalid token, clear it
          tokenManager.clearTokens();
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setError('Authentication initialization failed');
      tokenManager.clearTokens();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get('/api/oauth2/me');
      const userData = response.data as User;
      
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
      
      if (error.response?.status === 401) {
        // Token is invalid, try to refresh
        const refreshed = await refreshToken();
        if (!refreshed) {
          // Refresh failed, clear auth state
          handleAuthFailure();
        }
      } else {
        setError('Failed to load user information');
      }
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Make login request
      const response = await api.post('/api/oauth2/login', {
        username: credentials.username,
        password: credentials.password,
      });

      const authData = response.data as AuthResponse;

      // Store tokens
      tokenManager.setTokens(
        authData.access_token,
        authData.refresh_token,
        authData.expires_in
      );

      // Set user data
      if (authData.user) {
        setUser(authData.user);
      } else {
        // Fetch user data separately if not included
        await fetchUserData();
      }

      setIsAuthenticated(true);
      setError(null);

      console.log('Login successful');
    } catch (error: any) {
      console.error('Login failed:', error);
      
      let errorMessage = 'Login failed';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Revoke tokens on server
      await tokenManager.revokeTokens();
      
      // Try to call logout endpoint
      try {
        await api.post('/api/oauth2/logout');
      } catch (error) {
        // Ignore logout endpoint errors, tokens are already revoked
        console.warn('Logout endpoint failed:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      handleAuthFailure();
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      setError(null);
      
      const success = await tokenManager.refreshTokens();
      
      if (success) {
        // Fetch updated user data
        await fetchUserData();
        return true;
      } else {
        handleAuthFailure();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleAuthFailure();
      return false;
    }
  };

  const handleAuthFailure = () => {
    tokenManager.clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
  };

  // Permission helpers
  const hasPermission = useCallback((permission: string): boolean => {
    // Check RBAC roles first (new system)
    if (user?.rbac_roles && user.rbac_roles.length > 0) {
      for (const role of user.rbac_roles) {
        if (role.is_active && role.permissions) {
          for (const perm of role.permissions) {
            if (perm.is_active && perm.name === permission) {
              return true;
            }
          }
        }
      }
      return false;
    }
    
    // Fallback to legacy role system
    if (!user?.role?.permissions) return false;
    return user.role.permissions[permission] === true;
  }, [user]);

  const hasRole = useCallback((roleName: string): boolean => {
    // Check RBAC roles first (new system)
    if (user?.rbac_roles && user.rbac_roles.length > 0) {
      return user.rbac_roles.some(role => role.is_active && role.name === roleName);
    }
    
    // Fallback to legacy role system
    if (!user?.role) return false;
    return user.role.name === roleName;
  }, [user]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    // Check RBAC roles first (new system)
    if (user?.rbac_roles && user.rbac_roles.length > 0) {
      const userRoleNames = user.rbac_roles
        .filter(role => role.is_active)
        .map(role => role.name);
      return roles.some(role => userRoleNames.includes(role));
    }
    
    // Fallback to legacy role system
    if (!user?.role) return false;
    return roles.includes(user.role.name);
  }, [user]);

  const getPermissions = useCallback((): Record<string, boolean> => {
    const permissions: Record<string, boolean> = {};
    
    // Get permissions from RBAC roles (new system)
    if (user?.rbac_roles && user.rbac_roles.length > 0) {
      user.rbac_roles.forEach(role => {
        if (role.is_active && role.permissions) {
          role.permissions.forEach(permission => {
            if (permission.is_active) {
              permissions[permission.name] = true;
            }
          });
        }
      });
      return permissions;
    }
    
    // Fallback to legacy role system
    if (!user?.role?.permissions) return {};
    return user.role.permissions;
  }, [user]);

  // Token helpers
  const getToken = useCallback((): string | null => {
    return tokenManager.getAccessToken();
  }, []);

  const isTokenExpired = useCallback((): boolean => {
    return tokenManager.isTokenExpired();
  }, []);

  const getTokenInfo = useCallback(() => {
    return tokenManager.getTokenInfo();
  }, []);

  // User management
  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    // State
    isAuthenticated,
    user,
    isLoading,
    isInitialized,
    error,
    
    // Actions
    login,
    logout,
    refreshToken,
    
    // Permission helpers
    hasPermission,
    hasRole,
    hasAnyRole,
    getPermissions,
    
    // Token management
    getToken,
    isTokenExpired,
    getTokenInfo,
    
    // User management
    updateUser,
    clearError,
    
    // Legacy compatibility
    isLoggingIn: isLoading,
    loginError: error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Error boundary for auth-related errors
export class AuthErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-red-600">Authentication Error</h2>
            <p className="text-gray-600">
              An error occurred with the authentication system. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}