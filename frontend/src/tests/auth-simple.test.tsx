// 🐳 SIMPLE DOCKER AUTHENTICATION TEST - MAIN Backend & Database
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { LanguageContext, useLanguageProvider } from '../hooks/useLanguage';

// 🐳 Use real axios for Docker backend testing
import axios from 'axios';

// 🐳 Unmock axios for Docker integration tests
jest.unmock('axios');
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance for MAIN Docker backend testing
const realAxios = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set longer timeout for Docker tests
jest.setTimeout(60000);

// 🐳 Use real localStorage for Docker integration tests
// No mocking - test with real browser storage

// Test wrapper
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

describe('🐳 MAIN Docker Authentication Tests', () => {
  beforeAll(async () => {
    console.log('🐳 Testing with MAIN Docker backend and PostgreSQL database');
    
    // Test direct connection to MAIN backend
    try {
      const response = await realAxios.get('/health');
      console.log('✅ MAIN Docker backend is healthy:', response.data);
      expect((response.data as any).status).toBe('healthy');
      expect((response.data as any).database).toBe('connected');
    } catch (error: any) {
      console.error('❌ Cannot connect to MAIN Docker backend:', error.message);
      throw new Error(`MAIN Docker backend not available at ${BACKEND_URL}`);
    }
  });

  test('🐳 should connect to MAIN Docker backend health endpoint', async () => {
    const response = await realAxios.get('/health');
    
    expect(response.status).toBe(200);
    expect((response.data as any).status).toBe('healthy');
    expect((response.data as any).database).toBe('connected');
    
    console.log('✅ MAIN Docker backend health check passed');
  });

  test('🐳 should authenticate with MAIN Docker backend using admin credentials', async () => {
    const loginData = {
      username: 'admin',
      password: 'admin123'
    };

    const response = await realAxios.post('/auth/login', loginData);

    expect(response.status).toBe(200);
    expect((response.data as any)).toHaveProperty('access_token');
    expect((response.data as any)).toHaveProperty('token_type', 'bearer');
    expect((response.data as any)).toHaveProperty('expires_in');
    
    console.log('✅ MAIN Docker backend authentication successful');
    
    // Test getting user info with token
    const token = (response.data as any).access_token;
    const userResponse = await realAxios.get('/auth/me', {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    expect(userResponse.status).toBe(200);
    expect(userResponse.data).toHaveProperty('username', 'admin');
    expect(userResponse.data).toHaveProperty('email');
    expect(userResponse.data).toHaveProperty('role');
    
    console.log('✅ MAIN Docker backend user data retrieval successful');
  });

  test('🐳 should handle invalid credentials with MAIN Docker backend', async () => {
    const loginData = {
      username: 'invalid_user',
      password: 'wrong_password'
    };

    try {
      await realAxios.post('/auth/login', loginData);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(401);
      expect((error.response.data as any).detail).toContain('Incorrect username or password');
      
      console.log('✅ MAIN Docker backend properly rejects invalid credentials');
    }
  });

  test('🐳 should render Login component', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    
    console.log('✅ Login component renders correctly');
  });

  test('🐳 should validate form inputs in Login component', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    
    console.log('✅ Login form validation works correctly');
  });

  test('🐳 should create and authenticate test user with MAIN Docker backend', async () => {
    // Create a test user
    const testUser = {
      username: 'test_docker_user',
      email: 'test_docker@example.com',
      password: 'testpass123'
    };

    try {
      // Try to create user (might already exist)
      await realAxios.post('/auth/register', testUser);
      console.log('✅ Test user created in MAIN Docker database');
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('ℹ️ Test user already exists in MAIN Docker database');
      } else {
        throw error;
      }
    }

    // Login with test user
    const loginResponse = await realAxios.post('/auth/login', {
      username: testUser.username,
      password: testUser.password
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data).toHaveProperty('access_token');
    
    console.log('✅ Test user authentication with MAIN Docker backend successful');
  });

  test('🐳 should test token refresh with MAIN Docker backend', async () => {
    // First login to get a token
    const loginResponse = await realAxios.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    const token = (loginResponse.data as any).access_token;

    // Test token refresh
    const refreshResponse = await realAxios.post('/auth/refresh', {}, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    expect(refreshResponse.status).toBe(200);
    expect((refreshResponse.data as any)).toHaveProperty('access_token');
    expect((refreshResponse.data as any).access_token).not.toBe(token); // Should be a new token
    
    console.log('✅ Token refresh with MAIN Docker backend successful');
  });
});