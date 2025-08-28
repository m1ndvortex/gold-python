import { useAuthContext } from '../contexts/AuthContext';

/**
 * Enhanced useAuth hook that provides comprehensive authentication state management
 * Uses the AuthContext for centralized state management and TokenManager for secure token handling
 */
export const useAuth = () => {
  return useAuthContext();
};