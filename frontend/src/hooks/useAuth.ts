import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { User, LoginCredentials, AuthResponse, Role } from '../types';

// 🐳 DOCKER REQUIREMENT: Configure for Docker backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
    setIsInitialized(true);
  }, []);

  // Get current user data
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User & { role?: Role }>({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User & { role?: Role }> => {
      const response = await api.get('/auth/me');
      return response.data as User & { role?: Role };
    },
    enabled: isAuthenticated && isInitialized,
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await api.post('/auth/login', credentials);
      return response.data as AuthResponse;
    },
    onSuccess: (data) => {
      const expiryTime = Date.now() + (data.expires_in * 1000);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_expiry', expiryTime.toString());
      setIsAuthenticated(true);

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error: any) => {
      console.error('Login failed:', error);
    },
  });

  // Logout function
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_expiry');
      setIsAuthenticated(false);
      queryClient.clear();
    }
  }, [queryClient]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user?.role) return false;

    const permissions = user.role.permissions || {};
    return permissions[permission] === true;
  }, [user]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role.name);
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((roleName: string): boolean => {
    if (!user?.role) return false;
    return user.role.name === roleName;
  }, [user]);

  // Get user permissions
  const getPermissions = useCallback((): Record<string, boolean> => {
    if (!user?.role) return {};
    return user.role.permissions || {};
  }, [user]);

  // Check token expiry
  const isTokenExpired = useCallback((): boolean => {
    const expiry = localStorage.getItem('token_expiry');
    if (!expiry) return true;
    return Date.now() > parseInt(expiry);
  }, []);

  // Auto logout on token expiry
  useEffect(() => {
    if (isAuthenticated && isTokenExpired()) {
      logout();
    }
  }, [isAuthenticated, isTokenExpired, logout]);

  return {
    // State
    isAuthenticated,
    user,
    isLoading: !isInitialized || (isAuthenticated && userLoading),
    error: userError,

    // Actions
    login: loginMutation.mutate,
    logout,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    // Permission helpers
    hasPermission,
    hasAnyRole,
    hasRole,
    getPermissions,

    // Utility
    isTokenExpired,
  };
};