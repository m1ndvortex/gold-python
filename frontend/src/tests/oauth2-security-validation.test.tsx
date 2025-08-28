/**
 * OAuth2 Security Validation Tests
 * Tests security aspects of the AuthenticatedApiClient system
 * Validates token management, security headers, and authentication flows
 */

// Mock axios first before any imports
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: { success: true } })),
      post: jest.fn(() => Promise.resolve({ data: { success: true } })),
      put: jest.fn(() => Promise.resolve({ data: { success: true } })),
      delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
      patch: jest.fn(() => Promise.resolve({ data: { success: true } })),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    }))
  }
}));

import { tokenManager } from '../services/TokenManager';
import { AuthenticatedApiClient } from '../services/AuthenticatedApiClient';
import { dashboardApi } from '../services/dashboardApi';

// Mock fetch for testing token refresh
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.location for redirect tests
const mockLocation = {
  pathname: '/dashboard',
  href: 'http://localhost:3000/dashboard'
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('OAuth2 Security Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockFetch.mockClear();
  });

  describe('Token Manager Security', () => {
    test('should encrypt tokens before storing', () => {
      const testAccessToken = 'test-access-token-123';
      const testRefreshToken = 'test-refresh-token-456';
      const expiresIn = 3600;

      // Store tokens
      tokenManager.setTokens(testAccessToken, testRefreshToken, expiresIn);

      // Check that raw tokens are not stored in localStorage
      const storedAccessToken = localStorage.getItem('goldshop_access_token');
      const storedRefreshToken = localStorage.getItem('goldshop_refresh_token');

      expect(storedAccessToken).not.toBe(testAccessToken);
      expect(storedRefreshToken).not.toBe(testRefreshToken);
      expect(storedAccessToken).toBeTruthy();
      expect(storedRefreshToken).toBeTruthy();

      // But should be able to decrypt them
      expect(tokenManager.getAccessToken()).toBe(testAccessToken);
      expect(tokenManager.getRefreshToken()).toBe(testRefreshToken);
    });

    test('should validate token format', () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const invalidToken = 'invalid-token';

      expect(tokenManager.validateTokenFormat(validJWT)).toBe(true);
      expect(tokenManager.validateTokenFormat(invalidToken)).toBe(false);
      expect(tokenManager.validateTokenFormat('')).toBe(false);
      expect(tokenManager.validateTokenFormat(null as any)).toBe(false);
    });

    test('should handle token expiry correctly', () => {
      const currentTime = Date.now();
      const futureTime = currentTime + 3600000; // 1 hour from now
      const pastTime = currentTime - 3600000; // 1 hour ago

      // Set token with future expiry
      tokenManager.setTokens('access-token', 'refresh-token', 3600);
      expect(tokenManager.isTokenExpired()).toBe(false);
      expect(tokenManager.isTokenExpiringSoon()).toBe(false);

      // Manually set past expiry
      localStorage.setItem('goldshop_token_expiry', pastTime.toString());
      expect(tokenManager.isTokenExpired()).toBe(true);

      // Set expiry soon (within 5 minutes)
      const soonTime = currentTime + 240000; // 4 minutes from now
      localStorage.setItem('goldshop_token_expiry', soonTime.toString());
      expect(tokenManager.isTokenExpiringSoon()).toBe(true);
    });

    test('should clear all tokens securely', () => {
      // Set some tokens
      tokenManager.setTokens('access-token', 'refresh-token', 3600);
      
      // Verify tokens are stored
      expect(tokenManager.getAccessToken()).toBeTruthy();
      expect(tokenManager.getRefreshToken()).toBeTruthy();
      expect(tokenManager.getTokenExpiry()).toBeTruthy();

      // Clear tokens
      tokenManager.clearTokens();

      // Verify all tokens are cleared
      expect(tokenManager.getAccessToken()).toBeNull();
      expect(tokenManager.getRefreshToken()).toBeNull();
      expect(tokenManager.getTokenExpiry()).toBeNull();
      expect(localStorage.getItem('goldshop_access_token')).toBeNull();
      expect(localStorage.getItem('goldshop_refresh_token')).toBeNull();
      expect(localStorage.getItem('goldshop_token_expiry')).toBeNull();
    });

    test('should handle token refresh with proper error handling', async () => {
      // Mock successful refresh response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        })
      });

      // Set initial tokens
      tokenManager.setTokens('old-access-token', 'old-refresh-token', 3600);

      // Test refresh
      const result = await tokenManager.refreshTokens();
      expect(result).toBe(true);
      expect(tokenManager.getAccessToken()).toBe('new-access-token');
      expect(tokenManager.getRefreshToken()).toBe('new-refresh-token');
    });

    test('should handle failed token refresh', async () => {
      // Mock failed refresh response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      // Set initial tokens
      tokenManager.setTokens('old-access-token', 'old-refresh-token', 3600);

      // Test failed refresh
      const result = await tokenManager.refreshTokens();
      expect(result).toBe(false);
      
      // Tokens should be cleared after failed refresh
      expect(tokenManager.getAccessToken()).toBeNull();
      expect(tokenManager.getRefreshToken()).toBeNull();
    });

    test('should decode JWT token payload correctly', () => {
      const testJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE2MTYyMzkwMjIsInVzZXJfaWQiOiJ0ZXN0LXVzZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ';
      
      const payload = tokenManager.decodeTokenPayload(testJWT);
      expect(payload).toBeTruthy();
      expect(payload?.sub).toBe('1234567890');
      expect(payload?.user_id).toBe('test-user');
      expect(payload?.email).toBe('test@example.com');
    });
  });

  describe('API Client Security Headers', () => {
    test('should add security headers to requests', () => {
      const client = new AuthenticatedApiClient({
        enableLogging: false // Disable logging for cleaner test output
      });

      // Mock axios instance to capture request config
      const mockRequest = jest.fn();
      client['axiosInstance'].interceptors.request.handlers[0].fulfilled = mockRequest;

      const testConfig = {
        method: 'GET',
        url: '/test',
        headers: {}
      };

      // Simulate request interceptor
      const processedConfig = client['addAuthHeader'](testConfig);

      expect(processedConfig.headers['X-Request-ID']).toBeTruthy();
      expect(processedConfig.headers['Cache-Control']).toBe('no-cache');
      expect(processedConfig.headers['Pragma']).toBe('no-cache');
      expect(processedConfig.metadata).toBeTruthy();
      expect(processedConfig.metadata.requestId).toBeTruthy();
      expect(processedConfig.metadata.startTime).toBeTruthy();
    });

    test('should add authorization header when token is available', () => {
      // Set up token
      tokenManager.setTokens('test-access-token', 'test-refresh-token', 3600);

      const client = new AuthenticatedApiClient({
        enableLogging: false
      });

      const testConfig = {
        method: 'GET',
        url: '/test',
        headers: {}
      };

      const processedConfig = client['addAuthHeader'](testConfig);
      expect(processedConfig.headers['Authorization']).toBe('Bearer test-access-token');
    });

    test('should not add authorization header when no token is available', () => {
      // Clear tokens
      tokenManager.clearTokens();

      const client = new AuthenticatedApiClient({
        enableLogging: false
      });

      const testConfig = {
        method: 'GET',
        url: '/test',
        headers: {}
      };

      const processedConfig = client['addAuthHeader'](testConfig);
      expect(processedConfig.headers['Authorization']).toBeUndefined();
    });
  });

  describe('Authentication Error Handling', () => {
    test('should handle 401 errors with token refresh', async () => {
      const client = new AuthenticatedApiClient({
        enableLogging: false
      });

      // Set up initial tokens
      tokenManager.setTokens('expired-token', 'valid-refresh-token', 3600);

      // Mock successful token refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        })
      });

      // Mock axios instance to simulate 401 error and retry
      const mockAxiosCall = jest.fn()
        .mockRejectedValueOnce({
          response: { status: 401 },
          config: { headers: {}, metadata: { requestId: 'test-123', startTime: Date.now() } }
        })
        .mockResolvedValueOnce({ data: { success: true } });

      client['axiosInstance'] = mockAxiosCall;

      // Simulate 401 error handling
      const error = {
        response: { status: 401 },
        config: { 
          headers: {},
          metadata: { requestId: 'test-123', startTime: Date.now() }
        }
      };

      try {
        await client['handleAuthError'](error);
      } catch (e) {
        // Expected to throw if refresh fails or other issues
      }

      // Verify that token refresh was attempted
      expect(mockFetch).toHaveBeenCalledWith('/api/oauth2/refresh', expect.any(Object));
    });

    test('should handle 403 errors without retry', async () => {
      const client = new AuthenticatedApiClient({
        enableLogging: false
      });

      const error = {
        response: { status: 403 },
        config: { 
          headers: {},
          metadata: { requestId: 'test-123', startTime: Date.now() }
        }
      };

      // Should reject immediately without retry
      await expect(client['handleAuthError'](error)).rejects.toEqual(error);
    });

    test('should redirect to login on authentication failure', async () => {
      const client = new AuthenticatedApiClient({
        enableLogging: false
      });

      // Mock failed token refresh
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      // Set up tokens
      tokenManager.setTokens('expired-token', 'invalid-refresh-token', 3600);

      const error = {
        response: { status: 401 },
        config: { 
          headers: {},
          metadata: { requestId: 'test-123', startTime: Date.now() }
        }
      };

      // Mock window.location.href setter
      const mockLocationSetter = jest.fn();
      Object.defineProperty(window.location, 'href', {
        set: mockLocationSetter
      });

      try {
        await client['handleAuthError'](error);
      } catch (e) {
        // Expected to throw
      }

      // Should have attempted to redirect to login
      expect(mockLocationSetter).toHaveBeenCalledWith('/login');
      
      // Should have stored redirect URL
      expect(sessionStorage.getItem('redirectAfterLogin')).toBe('http://localhost:3000/dashboard');
    });
  });

  describe('Retry Logic and Error Handling', () => {
    test('should retry on network errors', () => {
      const client = new AuthenticatedApiClient({
        enableLogging: false
      });

      // Network error (no response)
      const networkError = { message: 'Network Error' };
      expect(client['shouldRetry'](networkError)).toBe(true);

      // 5xx server error
      const serverError = { response: { status: 500 } };
      expect(client['shouldRetry'](serverError)).toBe(true);

      // 429 rate limit error
      const rateLimitError = { response: { status: 429 } };
      expect(client['shouldRetry'](rateLimitError)).toBe(true);
    });

    test('should not retry on client errors', () => {
      const client = new AuthenticatedApiClient({
        enableLogging: false
      });

      // 400 bad request
      const badRequestError = { response: { status: 400 } };
      expect(client['shouldRetry'](badRequestError)).toBe(false);

      // 404 not found
      const notFoundError = { response: { status: 404 } };
      expect(client['shouldRetry'](notFoundError)).toBe(false);

      // Cancelled request
      const cancelledError = { code: 'ECONNABORTED' };
      expect(client['shouldRetry'](cancelledError)).toBe(false);
    });

    test('should calculate exponential backoff delay', () => {
      const client = new AuthenticatedApiClient({
        retryDelay: 1000,
        enableLogging: false
      });

      const delay1 = client['calculateRetryDelay'](1);
      const delay2 = client['calculateRetryDelay'](2);
      const delay3 = client['calculateRetryDelay'](3);

      // Should increase exponentially (with jitter)
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(3000); // 1000 + 1000 jitter
      
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(4000); // 2000 + 1000 jitter
      
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThan(6000); // 4000 + 1000 jitter

      // Should cap at 30 seconds
      const longDelay = client['calculateRetryDelay'](10);
      expect(longDelay).toBeLessThanOrEqual(30000);
    });
  });

  describe('Integration with Dashboard API', () => {
    test('should provide authentication methods on dashboard API', () => {
      expect(typeof dashboardApi.getAuthStatus).toBe('function');
      expect(typeof dashboardApi.refreshAuthentication).toBe('function');
      expect(typeof dashboardApi.logout).toBe('function');
    });

    test('should return consistent authentication status', () => {
      // Set up authentication
      tokenManager.setTokens('test-token', 'test-refresh', 3600);

      const authStatus = dashboardApi.getAuthStatus();
      expect(authStatus).toHaveProperty('isAuthenticated');
      expect(authStatus).toHaveProperty('hasValidToken');
      expect(authStatus).toHaveProperty('tokenExpiry');
      expect(authStatus.tokenExpiry).toBeInstanceOf(Date);
    });

    test('should handle logout properly', async () => {
      // Set up tokens
      tokenManager.setTokens('test-token', 'test-refresh', 3600);

      // Mock successful revoke response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await dashboardApi.logout();

      // Tokens should be cleared
      expect(tokenManager.getAccessToken()).toBeNull();
      expect(tokenManager.getRefreshToken()).toBeNull();
    });
  });

  describe('Security Best Practices', () => {
    test('should not log sensitive information', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const client = new AuthenticatedApiClient({
        enableLogging: true
      });

      // Set up token
      tokenManager.setTokens('sensitive-token-123', 'sensitive-refresh-456', 3600);

      const testConfig = {
        method: 'GET',
        url: '/test',
        headers: {}
      };

      client['addAuthHeader'](testConfig);

      // Check that sensitive token values are not logged
      const logCalls = consoleSpy.mock.calls;
      const loggedContent = logCalls.map(call => call.join(' ')).join(' ');
      
      expect(loggedContent).not.toContain('sensitive-token-123');
      expect(loggedContent).not.toContain('sensitive-refresh-456');

      consoleSpy.mockRestore();
    });

    test('should validate response data structure', () => {
      const client = new AuthenticatedApiClient({
        enableLogging: false
      });

      // Test wrapped response
      const wrappedResponse = { data: { data: { id: 1, name: 'test' } } };
      const unwrapped = client['unwrapResponse'](wrappedResponse);
      expect(unwrapped).toEqual({ id: 1, name: 'test' });

      // Test direct response
      const directResponse = { data: { id: 1, name: 'test' } };
      const direct = client['unwrapResponse'](directResponse);
      expect(direct).toEqual({ id: 1, name: 'test' });
    });

    test('should enhance error messages without exposing sensitive data', () => {
      const client = new AuthenticatedApiClient({
        enableLogging: false
      });

      const error = {
        response: {
          status: 400,
          data: {
            detail: 'Validation error',
            sensitive_field: 'should-not-be-exposed'
          }
        },
        message: 'Request failed'
      };

      const enhancedError = client['enhanceError'](error, 'POST', '/api/test');
      
      expect(enhancedError.message).toContain('POST /api/test: Validation error');
      expect(enhancedError.message).not.toContain('should-not-be-exposed');
    });
  });
});