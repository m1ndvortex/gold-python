// 🐳 DOCKER AUTHENTICATION INTEGRATION TEST - Node.js Environment
// This test runs in Node.js environment to avoid CORS issues

// Use Node.js environment instead of jsdom
/**
 * @jest-environment node
 */

// Unmock axios for real HTTP requests
jest.unmock('axios');

const axios = require('axios');

// Configure for Docker testing
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const TEST_TIMEOUT = 30000;

// Create axios instance for Docker backend testing
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: TEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

describe('🐳 Docker Authentication Integration Tests (Node.js)', () => {
  beforeAll(() => {
    console.log(`🐳 Testing Docker backend at: ${BACKEND_URL}`);
  });

  test('🐳 should connect to Docker backend health endpoint', async () => {
    const response = await api.get('/health');
    
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('healthy');
    expect(response.data.database).toBe('connected');
    
    console.log('✅ Docker backend health check passed');
  });

  test('🐳 should authenticate with admin credentials', async () => {
    const loginData = {
      username: 'admin',
      password: 'admin123'
    };

    const response = await api.post('/auth/login', loginData);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('access_token');
    expect(response.data).toHaveProperty('token_type', 'bearer');
    expect(response.data).toHaveProperty('expires_in');
    expect(response.data.access_token).toMatch(/^eyJ/); // JWT token starts with eyJ
    
    console.log('✅ Admin authentication successful');
    console.log(`Token: ${response.data.access_token.substring(0, 20)}...`);
    
    return response.data.access_token;
  });

  test('🐳 should get user info with JWT token', async () => {
    // First login to get token
    const loginResponse = await api.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.access_token;
    
    // Test getting user info with token
    const userResponse = await api.get('/auth/me', {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    expect(userResponse.status).toBe(200);
    expect(userResponse.data).toHaveProperty('username', 'admin');
    expect(userResponse.data).toHaveProperty('email');
    expect(userResponse.data).toHaveProperty('role');
    expect(userResponse.data.role).toHaveProperty('name');
    
    console.log(`✅ User info retrieved: ${userResponse.data.username} (${userResponse.data.role.name})`);
  });

  test('🐳 should reject invalid credentials', async () => {
    const loginData = {
      username: 'admin',
      password: 'wrongpassword'
    };

    try {
      await api.post('/auth/login', loginData);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.detail).toContain('Incorrect username or password');
      
      console.log('✅ Invalid credentials properly rejected');
    }
  });

  test('🐳 should reject requests without token', async () => {
    try {
      await api.get('/auth/me');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.detail).toBe('Not authenticated');
      
      console.log('✅ Requests without token properly rejected');
    }
  });

  test('🐳 should reject requests with invalid token', async () => {
    try {
      await api.get('/auth/me', {
        headers: { 
          'Authorization': 'Bearer invalid_token_here'
        }
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.detail).toContain('Could not validate credentials');
      
      console.log('✅ Invalid token properly rejected');
    }
  });

  test('🐳 should test protected endpoint with valid token', async () => {
    // Login first
    const loginResponse = await api.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.access_token;
    
    // Test a protected reports endpoint
    const reportsResponse = await api.get('/reports/sales/trends', {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    expect(reportsResponse.status).toBe(200);
    expect(reportsResponse.data).toHaveProperty('summary');
    expect(reportsResponse.data).toHaveProperty('trends');
    
    console.log('✅ Protected reports endpoint accessible with valid token');
    console.log(`Sales summary: $${reportsResponse.data.summary.total_sales}`);
  });
});
