/**
 * @jest-environment node
 */

// This file bypasses setupTests.ts by using direct require() instead of import
// and running in Node.js environment to avoid browser CORS restrictions

describe('Docker Backend Authentication Integration (Jest)', () => {
  const BACKEND_URL = 'http://localhost:8000';
  const TEST_TIMEOUT = 60000;
  
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  };

  let authToken = null;
  let axiosLib = null;

  beforeAll(async () => {
    // Dynamically require axios to bypass Jest mocking
    axiosLib = require('axios');
    console.log('Setting up Docker authentication integration tests...');
    console.log('Backend URL:', BACKEND_URL);
  });

  test('Docker backend health check', async () => {
    console.log('Testing health endpoint...');
    
    try {
      const response = await axiosLib.get(`${BACKEND_URL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('database', 'connected');
      
      console.log('✅ Health check passed:', response.data);
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      throw error;
    }
  }, TEST_TIMEOUT);

  test('Admin login with real credentials', async () => {
    console.log('Testing admin login...');
    
    try {
      const response = await axiosLib.post(`${BACKEND_URL}/auth/login`, ADMIN_CREDENTIALS);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('token_type', 'bearer');
      expect(typeof response.data.access_token).toBe('string');
      expect(response.data.access_token.length).toBeGreaterThan(10);
      
      // Store token for subsequent tests
      authToken = response.data.access_token;
      
      console.log('✅ Admin login successful');
      console.log('Token type:', response.data.token_type);
      console.log('Token length:', response.data.access_token.length);
    } catch (error) {
      console.error('❌ Admin login failed:', error.response?.data || error.message);
      throw error;
    }
  }, TEST_TIMEOUT);

  test('Get user info with JWT token', async () => {
    console.log('Testing user info retrieval...');
    
    expect(authToken).toBeTruthy();
    
    try {
      const response = await axiosLib.get(`${BACKEND_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('username', 'admin');
      expect(response.data).toHaveProperty('email');
      expect(response.data).toHaveProperty('role');
      expect(response.data).toHaveProperty('is_active', true);
      
      console.log('✅ User info retrieved successfully');
      console.log('User username:', response.data.username);
      console.log('User email:', response.data.email);
      console.log('User role:', response.data.role?.name);
      console.log('User active:', response.data.is_active);
    } catch (error) {
      console.error('❌ User info retrieval failed:', error.response?.data || error.message);
      throw error;
    }
  }, TEST_TIMEOUT);

  test('Access protected inventory endpoint', async () => {
    console.log('Testing protected inventory access...');
    
    expect(authToken).toBeTruthy();
    
    try {
      const response = await axiosLib.get(`${BACKEND_URL}/inventory/items`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      console.log('✅ Inventory access successful');
      console.log('Inventory items count:', response.data.length);
    } catch (error) {
      console.error('❌ Inventory access failed:', error.response?.data || error.message);
      throw error;
    }
  }, TEST_TIMEOUT);

  test('Unauthorized access without token', async () => {
    console.log('Testing unauthorized access...');
    
    try {
      await axiosLib.get(`${BACKEND_URL}/auth/me`);
      // Should not reach here
      throw new Error('Expected 401/403 Unauthorized');
    } catch (error) {
      expect(error.response?.status).toBeGreaterThanOrEqual(401);
      expect(error.response?.status).toBeLessThanOrEqual(403);
      console.log('✅ Unauthorized access properly rejected (status:', error.response?.status + ')');
    }
  }, TEST_TIMEOUT);

  afterAll(() => {
    console.log('Docker authentication integration tests completed');
  });
});
