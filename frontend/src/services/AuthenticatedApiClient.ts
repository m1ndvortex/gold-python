import axios from 'axios';
import { tokenManager } from './TokenManager';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

export interface RequestMetadata {
  startTime: number;
  retryCount: number;
  requestId: string;
}

export class AuthenticatedApiClient {
  protected axiosInstance: any;
  private retryAttempts: number;
  private retryDelay: number;
  private enableLogging: boolean;
  private requestCounter: number = 0;

  constructor(config: ApiClientConfig = {}) {
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.enableLogging = config.enableLogging ?? true;

    // Create axios instance with enhanced configuration
    this.axiosInstance = axios.create({
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      // Enable credentials for CORS requests
      withCredentials: false,
      // Validate status codes
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors, handle them in interceptor
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth headers and metadata
    this.axiosInstance.interceptors.request.use(
      (config: any) => this.addAuthHeader(config),
      (error: any) => {
        this.log('Request interceptor error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors and logging
    this.axiosInstance.interceptors.response.use(
      (response: any) => this.handleSuccessResponse(response),
      (error: any) => this.handleAuthError(error)
    );
  }

  private addAuthHeader(config: any): any {
    // Generate unique request ID
    const requestId = `req_${++this.requestCounter}_${Date.now()}`;
    
    // Add authentication header if available
    const authHeader = tokenManager.getAuthorizationHeader();
    if (authHeader) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = authHeader;
    }

    // Add additional security headers
    config.headers = config.headers || {};
    config.headers['X-Request-ID'] = requestId;
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';

    // Add request metadata for debugging and retry logic
    const metadata: RequestMetadata = {
      startTime: Date.now(),
      retryCount: (config as any).retryCount || 0,
      requestId
    };
    (config as any).metadata = metadata;

    this.log(`🚀 Request [${requestId}]:`, {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasAuth: !!authHeader,
      retryCount: metadata.retryCount
    });

    return config;
  }

  private handleSuccessResponse(response: any): any {
    const metadata = (response.config as any).metadata as RequestMetadata;
    if (metadata) {
      const duration = Date.now() - metadata.startTime;
      this.log(`✅ Response [${metadata.requestId}]:`, {
        status: response.status,
        duration: `${duration}ms`,
        url: response.config.url
      });
    }
    return response;
  }

  private async handleAuthError(error: any): Promise<any> {
    const originalRequest = error.config as any;
    const metadata = originalRequest?.metadata as RequestMetadata;
    
    if (metadata) {
      const duration = Date.now() - metadata.startTime;
      this.log(`❌ Error [${metadata.requestId}]:`, {
        status: error.response?.status,
        message: error.message,
        duration: `${duration}ms`,
        url: originalRequest?.url
      });
    }

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      this.log('🔄 Attempting token refresh for 401 error...');

      try {
        // Attempt token refresh
        const refreshed = await tokenManager.refreshTokens();
        
        if (refreshed) {
          // Update auth header and retry
          const authHeader = tokenManager.getAuthorizationHeader();
          if (authHeader) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = authHeader;
          }
          
          this.log('✅ Token refreshed, retrying request...');
          return this.axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        this.log('❌ Token refresh failed:', refreshError);
      }

      // Refresh failed, clear tokens and redirect
      tokenManager.clearTokens();
      
      // Only redirect if not already on login page or OAuth callback
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/oauth2/callback')) {
        this.log('🔄 Redirecting to login page...');
        // Store current location for redirect after login
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }

    // Handle 403 Forbidden - Insufficient permissions
    if (error.response?.status === 403) {
      this.log('🚫 Access forbidden - insufficient permissions');
      // Don't retry 403 errors, they won't succeed
      return Promise.reject(error);
    }

    // Handle retry logic for network errors and 5xx server errors
    if (this.shouldRetry(error) && originalRequest.retryCount < this.retryAttempts) {
      originalRequest.retryCount = (originalRequest.retryCount || 0) + 1;
      
      const delay = this.calculateRetryDelay(originalRequest.retryCount);
      this.log(`🔄 Retrying request (${originalRequest.retryCount}/${this.retryAttempts}) after ${delay}ms...`);
      
      // Wait before retrying with exponential backoff
      await this.delay(delay);
      
      return this.axiosInstance(originalRequest);
    }

    // Log final error if all retries exhausted
    if (originalRequest.retryCount >= this.retryAttempts) {
      this.log(`❌ Request failed after ${this.retryAttempts} retries`);
    }

    return Promise.reject(error);
  }

  private shouldRetry(error: any): boolean {
    // Don't retry if request was cancelled
    if (error.code === 'ECONNABORTED' || error.message?.includes('canceled')) {
      return false;
    }

    // Don't retry client errors (4xx) except 401 (handled separately) and 429 (rate limit)
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      return error.response.status === 429; // Retry rate limit errors
    }

    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(message: string, data?: any): void {
    if (this.enableLogging) {
      if (data) {
        console.log(`[AuthenticatedApiClient] ${message}`, data);
      } else {
        console.log(`[AuthenticatedApiClient] ${message}`);
      }
    }
  }

  // Generic HTTP methods with enhanced error handling
  public async get<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.get(url, config);
      return this.unwrapResponse<T>(response);
    } catch (error) {
      throw this.enhanceError(error as any, 'GET', url);
    }
  }

  public async post<T, D = any>(url: string, data?: D, config?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.post(url, data, config);
      return this.unwrapResponse<T>(response);
    } catch (error) {
      throw this.enhanceError(error as any, 'POST', url);
    }
  }

  public async put<T, D = any>(url: string, data?: D, config?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.put(url, data, config);
      return this.unwrapResponse<T>(response);
    } catch (error) {
      throw this.enhanceError(error as any, 'PUT', url);
    }
  }

  protected async patch<T, D = any>(url: string, data?: D, config?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.patch(url, data, config);
      return this.unwrapResponse<T>(response);
    } catch (error) {
      throw this.enhanceError(error as any, 'PATCH', url);
    }
  }

  public async delete<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.delete(url, config);
      return this.unwrapResponse<T>(response);
    } catch (error) {
      throw this.enhanceError(error as any, 'DELETE', url);
    }
  }

  // Enhanced error handling
  private enhanceError(error: any, method: string, url: string): Error {
    const message = error.response?.data?.detail || 
                   error.response?.data?.message || 
                   error.message || 
                   'Request failed';
    
    const enhancedError = new Error(`${method} ${url}: ${message}`);
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).response = error.response;
    (enhancedError as any).originalError = error;
    
    return enhancedError;
  }

  // Helper to unwrap backend responses (supports both wrapped {data: T} and raw T)
  private unwrapResponse<T>(response: any): T {
    const payload = response.data;
    
    if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
      return payload.data as T;
    }
    
    return payload as T;
  }

  // Upload file with progress tracking and enhanced error handling
  protected async uploadFile<T>(
    url: string, 
    file: File, 
    options: {
      onProgress?: (progress: number) => void;
      fieldName?: string;
      additionalFields?: Record<string, string | Blob>;
    } = {}
  ): Promise<T> {
    const { onProgress, fieldName = 'file', additionalFields = {} } = options;
    
    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Add additional fields to form data
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const config: any = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minute timeout for file uploads
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    try {
      const response = await this.axiosInstance.post(url, formData, config);
      return this.unwrapResponse<T>(response);
    } catch (error) {
      throw this.enhanceError(error as any, 'UPLOAD', url);
    }
  }

  // Upload multiple files
  protected async uploadMultipleFiles<T>(
    url: string,
    files: File[],
    options: {
      onProgress?: (progress: number) => void;
      fieldName?: string;
      additionalFields?: Record<string, string | Blob>;
    } = {}
  ): Promise<T> {
    const { onProgress, fieldName = 'files', additionalFields = {} } = options;
    
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(fieldName, file);
    });
    
    // Add additional fields to form data
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const config: any = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minute timeout for multiple file uploads
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    try {
      const response = await this.axiosInstance.post(url, formData, config);
      return this.unwrapResponse<T>(response);
    } catch (error) {
      throw this.enhanceError(error as any, 'UPLOAD_MULTIPLE', url);
    }
  }

  // Download file with enhanced error handling
  protected async downloadFile(
    url: string, 
    options: {
      filename?: string;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<void> {
    const { filename, onProgress } = options;
    
    try {
      const response = await this.axiosInstance.get(url, {
        responseType: 'blob',
        timeout: 120000, // 2 minute timeout for downloads
        onDownloadProgress: (progressEvent: any) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      // Extract filename from response headers if not provided
      let downloadFilename = filename;
      if (!downloadFilename) {
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            downloadFilename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
      }
      downloadFilename = downloadFilename || 'download';

      // Create download link
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      this.log(`📥 File downloaded: ${downloadFilename}`);
    } catch (error) {
      throw this.enhanceError(error as any, 'DOWNLOAD', url);
    }
  }

  // Get file as blob (for preview or processing)
  protected async getFileBlob(url: string): Promise<Blob> {
    try {
      const response = await this.axiosInstance.get(url, {
        responseType: 'blob',
        timeout: 60000, // 1 minute timeout
      });
      return response.data;
    } catch (error) {
      throw this.enhanceError(error as any, 'GET_BLOB', url);
    }
  }

  // Batch requests with enhanced error handling
  protected async batchRequests<T>(
    requests: Array<() => Promise<T>>,
    options: {
      concurrency?: number;
      failFast?: boolean;
    } = {}
  ): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
    const { concurrency = 5, failFast = false } = options;
    const results: Array<{ success: boolean; data?: T; error?: Error }> = [];
    
    // Process requests in batches to avoid overwhelming the server
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchPromises = batch.map(async (requestFn, index) => {
        try {
          const data = await requestFn();
          return { success: true, data };
        } catch (error) {
          const result = { success: false, error: error as Error };
          if (failFast) {
            throw error;
          }
          return result;
        }
      });
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        if (failFast) {
          throw error;
        }
      }
    }
    
    return results;
  }

  // Request with timeout
  protected async requestWithTimeout<T>(
    requestFn: () => Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      requestFn()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  // Health check endpoint
  public async healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    try {
      const response = await this.get<{ status: string }>('/health');
      return {
        status: 'ok',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get authentication status
  public getAuthStatus(): {
    isAuthenticated: boolean;
    hasValidToken: boolean;
    tokenExpiry: Date | null;
  } {
    const isAuthenticated = tokenManager.isAuthenticated();
    const hasValidToken = !tokenManager.isTokenExpired();
    const expiry = tokenManager.getTokenExpiry();
    
    return {
      isAuthenticated,
      hasValidToken,
      tokenExpiry: expiry ? new Date(expiry) : null
    };
  }

  // Force token refresh
  public async refreshAuthentication(): Promise<boolean> {
    try {
      return await tokenManager.refreshTokens();
    } catch (error) {
      this.log('❌ Manual token refresh failed:', error);
      return false;
    }
  }

  // Clear authentication and logout
  public async logout(): Promise<void> {
    try {
      // Attempt to revoke tokens on server
      await tokenManager.revokeTokens();
    } catch (error) {
      this.log('⚠️ Token revocation failed, clearing locally:', error);
    } finally {
      // Always clear local tokens
      tokenManager.clearTokens();
    }
  }
}