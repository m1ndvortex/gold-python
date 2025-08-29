import axios from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      window.location.href = '/login';
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

export const apiPatch = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response = await api.patch(url, data);
  return unwrap<T>(response.data);
};

export const apiDelete = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.delete(url, { data });
  return unwrap<T>(response.data);
};