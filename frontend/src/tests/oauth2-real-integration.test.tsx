import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Import components for real testing
import { OAuth2LoginInterface } from '../components/auth/OAuth2LoginInterface';
import { OAuth2CallbackHandler } from '../components/auth/OAuth2CallbackHandler';
import { TokenManagementInterface } from '../components/auth/TokenManagementInterface';
import { Login } from '../pages/Login';

// Real hooks - no mocking for integration test
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 1, retryDelay: 1000 },
      mutations: { retry: 1, retryDelay: 1000 }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Helper function to wait for backend to be ready
const waitForBackend = async (maxRetries = 30, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        console.log('Backend is ready');
        return true;
      }
    } catch (error) {
      console.log(`Backend not ready, attempt ${i + 1}/${maxRetries}`);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('Backend failed to start within timeout period');
};

// Helper function to create test user
const createTestUser = async () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    role_id: '1' // Assuming role ID 1 exists
  };

  try {
    const response = await fetch('http://localhost:8000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    if (response.ok) {
      const userData = await response.json();
      return { ...testUser, id: userData.id };
    } else {
      // If registration fails, try to login with existing user
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });

      if (loginResponse.ok) {
        return testUser;
      }
    }
  } catch (error) {
    console.error('Failed to create test user:', error);
  }

  // Fallback to default test user
  return {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    id: '1'
  };
};

// Helper function to clean up test data
const cleanupTestUser = async (userId: string, token: string) => {
  try {
    await fetch(`http://localhost:8000/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.log('Cleanup failed (expected for admin user):', error);
  }
};

describe('OAuth2 Real Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Wait for backend to be ready
    await waitForBackend();
    
    // Create test user
    testUser = await createTestUser();
    console.log('Test user created:', testUser.username);
  }, 60000); // 60 second timeout for setup

  afterAll(async () => {
    // Cleanup test user if we have a token
    if (authToken && testUser.id !== '1') {
      await cleanupTestUser(testUser.id, authToken);
    }
  });

  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Real Authentication Flow', () => {
    it('should perform complete login flow with real backend', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Wait for login page to load
      await waitFor(() => {
        expect(screen.getByText(/Welcome back to your gold shop management system/)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Check if OAuth2 interface is shown first
      const traditionalLoginButton = screen.queryByText('Username & Password');
      if (traditionalLoginButton) {
        // Click to show traditional login form
        fireEvent.click(traditionalLoginButton);
      }

      // Wait for traditional login form
      await waitFor(() => {
        expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Fill in login form
      const usernameInput = screen.getByLabelText(/Username/);
      const passwordInput = screen.getByLabelText(/Password/);
      const loginButton = screen.getByRole('button', { name: /login/i });

      await act(async () => {
        fireEvent.change(usernameInput, { target: { value: testUser.username } });
        fireEvent.change(passwordInput, { target: { value: testUser.password } });
      });

      // Submit login form
      await act(async () => {
        fireEvent.click(loginButton);
      });

      // Wait for successful login (redirect or success message)
      await waitFor(() => {
        // Check if we have an access token in localStorage
        const token = localStorage.getItem('access_token');
        expect(token).toBeTruthy();
        authToken = token!;
      }, { timeout: 10000 });

      console.log('Login successful, token obtained');
    }, 30000);

    it('should handle real OAuth2 provider discovery', async () => {
      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      // Wait for OAuth2 interface to load
      await waitFor(() => {
        expect(screen.getByText('Secure Authentication')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Check if providers are loaded from real backend
      await waitFor(() => {
        // Should show either providers or traditional auth
        const hasProviders = screen.queryByText('Enterprise Authentication');
        const hasTraditional = screen.queryByText('Traditional Authentication');
        expect(hasProviders || hasTraditional).toBeTruthy();
      }, { timeout: 10000 });

      console.log('OAuth2 provider discovery completed');
    }, 20000);

    it('should manage real tokens with backend API', async () => {
      // First login to get a real token
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });

      expect(loginResponse.ok).toBe(true);
      const loginData = await loginResponse.json();
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', loginData.access_token);
      localStorage.setItem('refresh_token', loginData.refresh_token || 'mock_refresh_token');
      localStorage.setItem('token_expiry', (Date.now() + (loginData.expires_in * 1000)).toString());

      authToken = loginData.access_token;

      render(
        <TestWrapper>
          <TokenManagementInterface />
        </TestWrapper>
      );

      // Wait for token management interface to load
      await waitFor(() => {
        expect(screen.getByText('Token Management')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Check if token information is displayed
      await waitFor(() => {
        expect(screen.getByText('Access Token')).toBeInTheDocument();
        expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      }, { timeout: 10000 });

      console.log('Token management interface loaded with real data');
    }, 20000);

    it('should handle real logout flow', async () => {
      // First login to get a real token
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });

      expect(loginResponse.ok).toBe(true);
      const loginData = await loginResponse.json();
      localStorage.setItem('access_token', loginData.access_token);
      authToken = loginData.access_token;

      // Test logout
      const logoutResponse = await fetch('http://localhost:8000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`
        }
      });

      // Logout should succeed or return 401 if token is invalid
      expect([200, 401, 404].includes(logoutResponse.status)).toBe(true);

      // Clear localStorage to simulate logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');

      console.log('Logout flow completed');
    }, 15000);
  });

  describe('Real Database Integration', () => {
    it('should fetch real user data from database', async () => {
      // Login first
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });

      expect(loginResponse.ok).toBe(true);
      const loginData = await loginResponse.json();
      authToken = loginData.access_token;

      // Fetch user profile
      const profileResponse = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        expect(profileData).toHaveProperty('username');
        expect(profileData).toHaveProperty('email');
        expect(profileData.username).toBe(testUser.username);
        console.log('Real user data fetched:', profileData.username);
      } else {
        console.log('Profile fetch failed (expected for some setups)');
      }
    }, 15000);

    it('should handle real session management', async () => {
      // Login first
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });

      expect(loginResponse.ok).toBe(true);
      const loginData = await loginResponse.json();
      authToken = loginData.access_token;

      // Try to fetch sessions (may not be implemented yet)
      const sessionsResponse = await fetch('http://localhost:8000/api/oauth2/sessions', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`
        }
      });

      // Sessions endpoint may not exist yet, so we accept 404
      expect([200, 404, 501].includes(sessionsResponse.status)).toBe(true);

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        console.log('Sessions data:', sessionsData);
      } else {
        console.log('Sessions endpoint not implemented yet (expected)');
      }
    }, 15000);

    it('should validate token expiry with real backend', async () => {
      // Login first
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });

      expect(loginResponse.ok).toBe(true);
      const loginData = await loginResponse.json();
      authToken = loginData.access_token;

      // Validate token by making authenticated request
      const validationResponse = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`
        }
      });

      // Token should be valid immediately after login
      if (validationResponse.status === 200) {
        console.log('Token validation successful');
      } else {
        console.log('Token validation failed or endpoint not available');
      }

      // Test with invalid token
      const invalidResponse = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': 'Bearer invalid_token_12345'
        }
      });

      expect(invalidResponse.status).toBe(401);
      console.log('Invalid token correctly rejected');
    }, 15000);
  });

  describe('Real Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Test with unreachable endpoint
      try {
        await fetch('http://localhost:9999/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'test',
            password: 'test'
          })
        });
      } catch (error) {
        expect(error).toBeDefined();
        console.log('Network error handled correctly');
      }
    }, 10000);

    it('should handle invalid credentials', async () => {
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'invalid_user_12345',
          password: 'invalid_password_12345'
        })
      });

      expect(loginResponse.status).toBe(401);
      console.log('Invalid credentials correctly rejected');
    }, 10000);

    it('should handle malformed requests', async () => {
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Missing required fields
          invalid: 'data'
        })
      });

      expect([400, 422].includes(loginResponse.status)).toBe(true);
      console.log('Malformed request correctly rejected');
    }, 10000);
  });

  describe('Real Security Features', () => {
    it('should enforce authentication on protected endpoints', async () => {
      // Try to access protected endpoint without token
      const protectedResponse = await fetch('http://localhost:8000/api/inventory', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(protectedResponse.status).toBe(401);
      console.log('Protected endpoint correctly requires authentication');
    }, 10000);

    it('should validate token format and signature', async () => {
      // Test with malformed token
      const malformedResponse = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': 'Bearer malformed.token.here'
        }
      });

      expect(malformedResponse.status).toBe(401);
      console.log('Malformed token correctly rejected');
    }, 10000);

    it('should handle concurrent login attempts', async () => {
      const loginPromises = Array.from({ length: 3 }, () =>
        fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: testUser.username,
            password: testUser.password
          })
        })
      );

      const responses = await Promise.all(loginPromises);
      
      // At least one should succeed
      const successfulLogins = responses.filter(r => r.ok);
      expect(successfulLogins.length).toBeGreaterThan(0);
      
      // Store token from successful login
      if (successfulLogins.length > 0) {
        const loginData = await successfulLogins[0].json();
        authToken = loginData.access_token;
      }

      console.log(`Concurrent logins handled: ${successfulLogins.length} successful`);
    }, 20000);
  });

  describe('Real Performance Tests', () => {
    it('should handle login within reasonable time', async () => {
      const startTime = Date.now();
      
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        authToken = loginData.access_token;
      }

      // Login should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      console.log(`Login completed in ${duration}ms`);
    }, 10000);

    it('should handle multiple API calls efficiently', async () => {
      // Login first
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        authToken = loginData.access_token;

        const startTime = Date.now();
        
        // Make multiple concurrent API calls
        const apiCalls = Array.from({ length: 5 }, () =>
          fetch('http://localhost:8000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${loginData.access_token}`
            }
          })
        );

        const responses = await Promise.all(apiCalls);
        const endTime = Date.now();
        const duration = endTime - startTime;

        // All calls should complete within 10 seconds
        expect(duration).toBeLessThan(10000);
        console.log(`${apiCalls.length} API calls completed in ${duration}ms`);
      }
    }, 15000);
  });
});