// Base API utilities for making HTTP requests
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ApiRequestOptions {
  headers?: Record<string, string>;
  body?: any;
}

class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function makeRequest<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  options?: ApiRequestOptions
): Promise<T> {
  const fullUrl = `${API_BASE_URL}${url}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options?.headers,
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (options?.body && method !== 'GET') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(fullUrl, config);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      
      throw new ApiError(
        response.status,
        errorData.detail || errorData.message || `HTTP ${response.status}`,
        errorData
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return response.text() as any;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      0,
      error instanceof Error ? error.message : 'Network error',
      error
    );
  }
}

export async function apiGet<T = any>(url: string, options?: Omit<ApiRequestOptions, 'body'>): Promise<T> {
  return makeRequest<T>(url, 'GET', options);
}

export async function apiPost<T = any>(url: string, body?: any, options?: ApiRequestOptions): Promise<T> {
  return makeRequest<T>(url, 'POST', { ...options, body });
}

export async function apiPut<T = any>(url: string, body?: any, options?: ApiRequestOptions): Promise<T> {
  return makeRequest<T>(url, 'PUT', { ...options, body });
}

export async function apiDelete<T = any>(url: string, options?: Omit<ApiRequestOptions, 'body'>): Promise<T> {
  return makeRequest<T>(url, 'DELETE', options);
}

export { ApiError };
