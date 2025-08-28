import axios from 'axios';
import { ApiResponse } from '../types';
import { tokenManager } from '../services/TokenManager';

// 🐳 DOCKER FIX: Use relative URLs for browser requests (handled by proxy)
// The REACT_APP_API_URL with backend:8000 is only for server-side rendering
const API_BASE_URL = '';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token and handle token refresh
api.interceptors.request.use(
  (config) => {
    // Add authorization header if token exists
    const authHeader = tokenManager.getAuthorizationHeader();
    if (authHeader) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = authHeader;
    }

    // Add request timestamp for debugging
    (config as any).metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response: any) => {
    // Log response time for debugging
    const config = response.config as any;
    if (config.metadata?.startTime) {
      const duration = Date.now() - config.metadata.startTime;
      console.log(`API ${config.method?.toUpperCase()} ${config.url} completed in ${duration}ms`);
    }
    
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config as any;
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('Received 401, attempting token refresh...');
      
      // Try to refresh token
      const refreshed = await tokenManager.refreshTokens();
      
      if (refreshed) {
        // Retry the original request with new token
        const authHeader = tokenManager.getAuthorizationHeader();
        if (authHeader) {
          originalRequest.headers['Authorization'] = authHeader;
        }
        
        console.log('Token refreshed, retrying request...');
        return api(originalRequest);
      } else {
        // Refresh failed, redirect to login
        console.log('Token refresh failed, redirecting to login...');
        tokenManager.clearTokens();
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle other error types
    if (error.response?.status === 403) {
      console.warn('Access forbidden - insufficient permissions');
    } else if (error.response?.status === 429) {
      console.warn('Rate limit exceeded');
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.status);
    }
    
    return Promise.reject(error);
  }
);

// Generic API functions
// Helper to unwrap backend responses (supports both wrapped {data: T} and raw T)
function unwrap<T>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
}

export const apiGet = async <T>(url: string): Promise<T> => {
  const response = await api.get(url);
  return unwrap<T>(response.data);
};

export const apiPost = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response = await api.post(url, data);
  return unwrap<T>(response.data);
};

export const apiPut = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response = await api.put(url, data);
  return unwrap<T>(response.data);
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await api.delete(url);
  return unwrap<T>(response.data);
};