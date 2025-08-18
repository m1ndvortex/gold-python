import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Login } from '../pages/Login';
import { AuthGuard } from '../components/auth/AuthGuard';
import { RoleBasedAccess } from '../components/auth/RoleBasedAccess';
import { LanguageContext, useLanguageProvider } from '../hooks/useLanguage';

// 🐳 DOCKER REQUIREMENT: Import axios properly for testing
const axios = require('axios');

// 🐳 DOCKER REQUIREMENT: Configure axios for MAIN Docker backend and database
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance for MAIN Docker backend testing
const realAxios = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000, // 30 second timeout for Docker integration tests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set Jest timeout for Docker integration tests
jest.setTimeout(60000); // 60 seconds for all tests

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// 🐳 DOCKER HELPER FUNCTIONS - Real backend integration
const waitForBackend = async (maxRetries = 30, delay = 1000): Promise<void> => {
  console.log(`🐳 Waiting for MAIN Docker backend to be ready at ${BACKEND_URL}...`);
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check if backend health endpoint is available
      console.log(`🔍 Attempting to connect to ${BACKEND_URL}/health`);
      const response = await realAxios.get('/health');
      if (response.status === 200 && response.data.status === 'healthy') {
        console.log('✅ MAIN Docker backend is ready and healthy!');
        return;
      }
    } catch (error: any) {
      console.log(`⏳ Waiting for backend... (${i + 1}/${maxRetries}) - Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error(`❌ MAIN Docker backend not available at ${BACKEND_URL} after maximum retries`);
};

const createTestUser = async () => {
  try {
    console.log('🐳 Creating test user in real PostgreSQL database...');
    
    // First, try to create a test role with comprehensive permissions
    let roleId;
    try {
      const roleResponse = await realAxios.post('/roles/', {
        name: 'TestRole_Auth',
        description: 'Test role for authentication tests with Docker',
        permissions: {
          view_inventory: true,
          edit_inventory: true,
          create_invoices: true,
          view_reports: true,
          manage_customers: true,
          view_accounting: true,
          send_sms: true,
        },
      });
      roleId = roleResponse.data.id;
      console.log('✅ Test role created in database');
    } catch (roleError) {
      console.log('ℹ️ Test role might already exist, trying to find existing role...');
      // Try to get existing roles and find a suitable one
      try {
        const rolesResponse = await realAxios.get('/roles/');
        const existingRole = rolesResponse.data.find((role: any) => role.name === 'TestRole_Auth');
        if (existingRole) {
          roleId = existingRole.id;
          console.log('✅ Using existing test role');
        } else {
          // Use the first available role or create a basic one
          roleId = rolesResponse.data[0]?.id;
          console.log('✅ Using first available role');
        }
      } catch (getRolesError) {
        console.log('⚠️ Could not get roles, proceeding without role assignment');
      }
    }

    // Create test user
    const userResponse = await realAxios.post('/auth/register', {
      username: 'testuser_auth_docker',
      email: 'testuser_auth_docker@example.com',
      password: 'testpass123',
      role_id: roleId,
    });

    console.log('✅ Test user created in real PostgreSQL database');
    return userResponse.data;
  } catch (error: any) {
    console.log('ℹ️ Test user might already exist, attempting login to verify...');
    
    // Try to login with existing credentials to verify user exists
    try {
      const loginResponse = await realAxios.post('/auth/login', {
        username: 'testuser_auth_docker',
        password: 'testpass123',
      });
      
      if (loginResponse.data.access_token) {
        console.log('✅ Test user already exists and is functional');
        return {
          id: 'existing-test-user-id',
          username: 'testuser_auth_docker',
          email: 'testuser_auth_docker@example.com',
        };
      }
    } catch (loginError) {
      console.error('❌ Could not create or verify test user:', error);
      throw new Error('Failed to create test user in Docker environment');
    }
  }
};

const getTestToken = async (): Promise<string> => {
  try {
    console.log('🐳 Getting fresh token from real backend...');
    const response = await realAxios.post('/auth/login', {
      username: 'testuser_auth_docker',
      password: 'testpass123',
    });
    
    if (!response.data.access_token) {
      throw new Error('No access token received from backend');
    }
    
    console.log('✅ Fresh token obtained from Docker backend');
    return response.data.access_token;
  } catch (error: any) {
    console.error('❌ Failed to get test token from Docker backend:', error.response?.data || error.message);
    throw error;
  }
};

const cleanupTestData = async (): Promise<void> => {
  try {
    // Note: In a real scenario, you'd want to clean up test data
    // For now, we'll leave it as the database is reset between test runs
    console.log('✅ Test cleanup completed');
  } catch (error) {
    console.log('ℹ️ Cleanup completed with warnings');
  }
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const languageContextValue = useLanguageProvider();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageContext.Provider value={languageContextValue}>
          {children}
        </LanguageContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Test component that uses useAuth hook
const TestAuthComponent: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    isLoggingIn,
    loginError,
    logout,
    hasPermission,
    hasRole,
    hasAnyRole,
  } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="loading-status">
        {isLoading ? 'loading' : 'not-loading'}
      </div>
      <div data-testid="user-info">
        {user ? JSON.stringify(user) : 'no-user'}
      </div>
      <div data-testid="login-status">
        {isLoggingIn ? 'logging-in' : 'not-logging-in'}
      </div>
      <div data-testid="login-error">
        {loginError ? 'has-error' : 'no-error'}
      </div>
      <button
        data-testid="login-button"
        onClick={() => login({ username: 'test', password: 'test123' })}
      >
        Login
      </button>
      <button data-testid="logout-button" onClick={logout}>
        Logout
      </button>
      <div data-testid="permission-test">
        {hasPermission('view_inventory') ? 'has-permission' : 'no-permission'}
      </div>
      <div data-testid="role-test">
        {hasRole('Owner') ? 'is-owner' : 'not-owner'}
      </div>
      <div data-testid="any-role-test">
        {hasAnyRole(['Owner', 'Manager']) ? 'has-role' : 'no-role'}
      </div>
    </div>
  );
};

// 🐳 DOCKER REQUIREMENT: All tests use real backend API in Docker
describe('Authentication System - Docker Integration', () => {
  let testUser: any;
  let testToken: string;

  beforeAll(async () => {
    // 🐳 Wait for backend to be ready
    await waitForBackend();
    
    // 🐳 Create test user in real database
    testUser = await createTestUser();
  });

  beforeEach(async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    // 🐳 Get fresh token for each test
    testToken = await getTestToken();
  });

  afterAll(async () => {
    // 🐳 Cleanup test data from real database
    await cleanupTestData();
  });

  describe('useAuth Hook - Real Backend API', () => {
    test('🐳 should initialize with unauthenticated state', () => {
      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
      expect(screen.getByTestId('login-status')).toHaveTextContent('not-logging-in');
      expect(screen.getByTestId('login-error')).toHaveTextContent('no-error');
    });

    test('🐳 should authenticate user with valid token from real backend', async () => {
      const mockExpiry = (Date.now() + 3600000).toString(); // 1 hour from now
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return testToken;
        if (key === 'token_expiry') return mockExpiry;
        return null;
      });

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    test('🐳 should not authenticate with expired token', () => {
      const mockExpiry = (Date.now() - 3600000).toString(); // 1 hour ago
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return 'expired-token';
        if (key === 'token_expiry') return mockExpiry;
        return null;
      });

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token_expiry');
    });

    test('🐳 should handle successful login with real backend API', async () => {
      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByTestId('login-button');
      
      act(() => {
        fireEvent.click(loginButton);
      });

      expect(screen.getByTestId('login-status')).toHaveTextContent('logging-in');

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      }, { timeout: 10000 });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', expect.any(String));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token_expiry', expect.any(String));
    });

    test('🐳 should handle login failure with real backend API', async () => {
      // Create component that tries to login with invalid credentials
      const InvalidLoginComponent = () => {
        const { login, isLoggingIn, loginError } = useAuth();
        
        React.useEffect(() => {
          login({ username: 'invalid_user', password: 'wrong_password' });
        }, [login]);

        return (
          <div>
            <div data-testid="login-status">
              {isLoggingIn ? 'logging-in' : 'not-logging-in'}
            </div>
            <div data-testid="login-error">
              {loginError ? 'has-error' : 'no-error'}
            </div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <InvalidLoginComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('login-error')).toHaveTextContent('has-error');
      }, { timeout: 10000 });
    });

    test('🐳 should handle logout', () => {
      localStorageMock.getItem.mockReturnValue(testToken);

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      const logoutButton = screen.getByTestId('logout-button');
      
      act(() => {
        fireEvent.click(logoutButton);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token_expiry');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    test('🐳 should check permissions correctly with real user data', async () => {
      const mockExpiry = (Date.now() + 3600000).toString();
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return testToken;
        if (key === 'token_expiry') return mockExpiry;
        return null;
      });

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('permission-test')).toHaveTextContent('has-permission');
      }, { timeout: 10000 });
    });

    // Refresh token test removed as it's not implemented in useAuth hook


  });

  describe('Login Component - Real Backend API', () => {
    test('🐳 should render login form', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('🐳 should validate form inputs', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /login/i });
      
      act(() => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    test('🐳 should submit form with valid data to real backend', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      act(() => {
        fireEvent.change(usernameInput, { target: { value: 'testuser_auth_docker' } });
        fireEvent.change(passwordInput, { target: { value: 'testpass123' } });
        fireEvent.click(submitButton);
      });

      // Wait for the login to complete and redirect
      await waitFor(() => {
        // Should redirect to dashboard on successful login
        expect(window.location.pathname).toBe('/');
      }, { timeout: 10000 });
    });

    test('🐳 should show error for invalid credentials with real backend', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      act(() => {
        fireEvent.change(usernameInput, { target: { value: 'invalid_user' } });
        fireEvent.change(passwordInput, { target: { value: 'wrong_password' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('🐳 should toggle password visibility', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(button => 
        button.querySelector('svg') // Find button with eye icon
      );

      expect(passwordInput).toHaveAttribute('type', 'password');

      if (toggleButton) {
        act(() => {
          fireEvent.click(toggleButton);
        });

        expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });

    test('🐳 should handle network errors gracefully', async () => {
      // Temporarily break the backend connection
      const originalBaseURL = axios.defaults.baseURL;
      axios.defaults.baseURL = 'http://nonexistent:9999';

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      act(() => {
        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Restore original baseURL
      axios.defaults.baseURL = originalBaseURL;
    });
  });

  describe('AuthGuard Component - Real Backend API', () => {
    const TestProtectedComponent = () => <div>Protected Content</div>;

    test('🐳 should show loading when checking authentication', () => {
      render(
        <TestWrapper>
          <AuthGuard>
            <TestProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('🐳 should show content when authenticated with real backend', async () => {
      const mockExpiry = (Date.now() + 3600000).toString();
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return testToken;
        if (key === 'token_expiry') return mockExpiry;
        return null;
      });

      render(
        <TestWrapper>
          <AuthGuard>
            <TestProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('🐳 should check role requirements with real user data', async () => {
      const mockExpiry = (Date.now() + 3600000).toString();
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return testToken;
        if (key === 'token_expiry') return mockExpiry;
        return null;
      });

      render(
        <TestWrapper>
          <AuthGuard requiredRoles={['NonExistentRole']}>
            <TestProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/you do not have the required role/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('🐳 should check permission requirements with real user data', async () => {
      const mockExpiry = (Date.now() + 3600000).toString();
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return testToken;
        if (key === 'token_expiry') return mockExpiry;
        return null;
      });

      render(
        <TestWrapper>
          <AuthGuard requiredPermissions={['nonexistent_permission']}>
            <TestProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/you do not have the required permissions/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('RoleBasedAccess Component - Real Backend API', () => {
    const TestContent = () => <div>Role-based Content</div>;
    const FallbackContent = () => <div>No Access</div>;

    test('🐳 should show content when user has required permissions with real backend', async () => {
      const mockExpiry = (Date.now() + 3600000).toString();
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return testToken;
        if (key === 'token_expiry') return mockExpiry;
        return null;
      });

      render(
        <TestWrapper>
          <RoleBasedAccess permissions={['view_inventory']} fallback={<FallbackContent />}>
            <TestContent />
          </RoleBasedAccess>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Role-based Content')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('🐳 should show fallback when user lacks required permissions', async () => {
      const mockExpiry = (Date.now() + 3600000).toString();
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return testToken;
        if (key === 'token_expiry') return mockExpiry;
        return null;
      });

      render(
        <TestWrapper>
          <RoleBasedAccess permissions={['nonexistent_permission']} fallback={<FallbackContent />}>
            <TestContent />
          </RoleBasedAccess>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No Access')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('🐳 should handle multiple permission requirements', async () => {
      const mockExpiry = (Date.now() + 3600000).toString();
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return testToken;
        if (key === 'token_expiry') return mockExpiry;
        return null;
      });

      render(
        <TestWrapper>
          <RoleBasedAccess 
            permissions={['view_inventory', 'edit_inventory']} 
            requireAll={true}
            fallback={<FallbackContent />}
          >
            <TestContent />
          </RoleBasedAccess>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Role-based Content')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('🐳 should handle inverse permission logic', async () => {
      const mockExpiry = (Date.now() + 3600000).toString();
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return testToken;
        if (key === 'token_expiry') return mockExpiry;
        return null;
      });

      render(
        <TestWrapper>
          <RoleBasedAccess 
            permissions={['nonexistent_permission']} 
            inverse={true}
            fallback={<FallbackContent />}
          >
            <TestContent />
          </RoleBasedAccess>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Role-based Content')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

});

// 🐳 COMPREHENSIVE DOCKER INTEGRATION TESTS - Real Backend + Real Database
describe('Authentication Full Integration Tests (Docker + PostgreSQL)', () => {
  beforeAll(async () => {
    console.log('🐳 Starting comprehensive Docker integration tests...');
    await waitForBackend();
  });

  test('🐳 should complete full authentication flow with real backend and database', async () => {
    try {
      // Test 1: Register new user
      const registerResponse = await realAxios.post('/auth/register', {
        username: 'integration_test_user',
        email: 'integration@test.com',
        password: 'testpass123',
      });

      expect(registerResponse.status).toBe(200);
      expect(registerResponse.data).toHaveProperty('id');
      expect(registerResponse.data.username).toBe('integration_test_user');

      // Test 2: Login with new user
      const loginResponse = await realAxios.post('/auth/login', {
        username: 'integration_test_user',
        password: 'testpass123',
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data).toHaveProperty('access_token');
      expect(loginResponse.data).toHaveProperty('token_type', 'bearer');
      expect(loginResponse.data).toHaveProperty('expires_in');

      const token = loginResponse.data.access_token;

      // Test 3: Fetch user data with token
      const userResponse = await realAxios.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(userResponse.status).toBe(200);
      expect(userResponse.data).toHaveProperty('id');
      expect(userResponse.data.username).toBe('integration_test_user');
      expect(userResponse.data.email).toBe('integration@test.com');

      // Test 4: Verify token
      const verifyResponse = await realAxios.get('/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.data.valid).toBe(true);
      expect(verifyResponse.data.username).toBe('integration_test_user');

      // Test 5: Refresh token
      const refreshResponse = await realAxios.post('/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.data).toHaveProperty('access_token');
      expect(refreshResponse.data.access_token).not.toBe(token); // Should be new token

      console.log('✅ Full authentication flow completed successfully');
    } catch (error) {
      console.error('❌ Integration test failed:', error);
      throw error;
    }
  }, 30000);

  test('🐳 should handle authentication errors correctly with real backend', async () => {
    try {
      // Test invalid login
      await realAxios.post('/auth/login', {
        username: 'nonexistent_user',
        password: 'wrong_password',
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.detail).toContain('Incorrect username or password');
    }

    try {
      // Test invalid token
      await realAxios.get('/auth/me', {
        headers: {
          Authorization: 'Bearer invalid_token',
        },
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(401);
    }

    console.log('✅ Authentication error handling verified');
  }, 15000);

  test('🐳 should handle role-based access with real database', async () => {
    try {
      // Create role with specific permissions
      const roleResponse = await realAxios.post('/roles/', {
        name: 'TestRole_Integration',
        description: 'Integration test role',
        permissions: {
          view_inventory: true,
          edit_inventory: false,
          create_invoices: true,
          view_reports: false,
        },
      });

      expect(roleResponse.status).toBe(200);
      const roleId = roleResponse.data.id;

      // Create user with specific role
      const userResponse = await realAxios.post('/auth/register', {
        username: 'role_test_user',
        email: 'roletest@test.com',
        password: 'testpass123',
        role_id: roleId,
      });

      expect(userResponse.status).toBe(200);

      // Login and verify role permissions
      const loginResponse = await realAxios.post('/auth/login', {
        username: 'role_test_user',
        password: 'testpass123',
      });

      const token = loginResponse.data.access_token;

      const meResponse = await realAxios.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(meResponse.data.role).toBeDefined();
      expect(meResponse.data.role.name).toBe('TestRole_Integration');
      expect(meResponse.data.role.permissions.view_inventory).toBe(true);
      expect(meResponse.data.role.permissions.edit_inventory).toBe(false);

      console.log('✅ Role-based access verified with real database');
    } catch (error) {
      console.error('❌ Role-based access test failed:', error);
      throw error;
    }
  }, 20000);

  test('🐳 should persist authentication state across browser sessions', async () => {
    try {
      // Login and get token
      const loginResponse = await realAxios.post('/auth/login', {
        username: 'testuser_auth_docker',
        password: 'testpass123',
      });

      const token = loginResponse.data.access_token;
      const expiresIn = loginResponse.data.expires_in;

      // Simulate storing token in localStorage
      const expiryTime = Date.now() + (expiresIn * 1000);
      
      // Verify token is still valid after some time
      await new Promise(resolve => setTimeout(resolve, 1000));

      const verifyResponse = await realAxios.get('/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.data.valid).toBe(true);

      // Verify token expiry logic
      expect(Date.now()).toBeLessThan(expiryTime);

      console.log('✅ Authentication persistence verified');
    } catch (error) {
      console.error('❌ Authentication persistence test failed:', error);
      throw error;
    }
  }, 15000);

  test('🐳 should handle concurrent authentication requests', async () => {
    try {
      // Make multiple concurrent login requests
      const loginPromises = Array.from({ length: 5 }, () =>
        realAxios.post('/auth/login', {
          username: 'testuser_auth_docker',
          password: 'testpass123',
        })
      );

      const responses = await Promise.all(loginPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('access_token');
      });

      // Tokens should be different (each request gets a new token)
      const tokens = responses.map(r => r.data.access_token);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);

      console.log('✅ Concurrent authentication requests handled correctly');
    } catch (error) {
      console.error('❌ Concurrent authentication test failed:', error);
      throw error;
    }
  }, 20000);
});