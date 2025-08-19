// Docker Backend Authentication Integration Test
// Run this with: node test-docker-auth.js

const axios = require('axios');

const BACKEND_URL = 'http://localhost:8000';
const TEST_TIMEOUT = 60000;

// Admin credentials for testing
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let authToken = null;

async function testHealthCheck() {
  console.log('\n🔍 Testing health endpoint...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    
    if (response.status === 200 && response.data.status === 'healthy') {
      console.log('✅ Health check passed:', response.data);
      return true;
    } else {
      console.log('❌ Health check failed: unexpected response', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testAdminLogin() {
  console.log('\n🔍 Testing admin login...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.status === 200 && 
        response.data.access_token && 
        response.data.token_type === 'bearer') {
      
      authToken = response.data.access_token;
      
      console.log('✅ Admin login successful');
      console.log('   Token type:', response.data.token_type);
      console.log('   Token length:', response.data.access_token.length);
      return true;
    } else {
      console.log('❌ Admin login failed: unexpected response', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUserInfo() {
  console.log('\n🔍 Testing user info retrieval...');
  
  if (!authToken) {
    console.error('❌ No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${BACKEND_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200 && 
        response.data.username === 'admin' && 
        response.data.is_active === true) {
      
      console.log('✅ User info retrieved successfully');
      console.log('   User username:', response.data.username);
      console.log('   User email:', response.data.email);
      console.log('   User role:', response.data.role?.name);
      console.log('   User active:', response.data.is_active);
      return true;
    } else {
      console.log('❌ User info failed: unexpected response', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ User info retrieval failed:', error.response?.data || error.message);
    return false;
  }
}

async function testInventoryAccess() {
  console.log('\n🔍 Testing protected inventory access...');
  
  if (!authToken) {
    console.error('❌ No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${BACKEND_URL}/inventory/items`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200 && Array.isArray(response.data)) {
      console.log('✅ Inventory access successful');
      console.log('   Inventory items count:', response.data.length);
      return true;
    } else {
      console.log('❌ Inventory access failed: unexpected response', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Inventory access failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🔍 Testing unauthorized access...');
  
  try {
    await axios.get(`${BACKEND_URL}/auth/me`);
    console.log('❌ Unauthorized access should have failed');
    return false;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('✅ Unauthorized access properly rejected (status:', error.response?.status + ')');
      return true;
    } else {
      console.error('❌ Unexpected error for unauthorized access:', error.message);
      return false;
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting Docker Backend Authentication Integration Tests');
  console.log('Backend URL:', BACKEND_URL);
  
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testAdminLogin());
  results.push(await testUserInfo());
  results.push(await testInventoryAccess());
  results.push(await testUnauthorizedAccess());
  
  const passed = results.filter(r => r === true).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Docker authentication integration is working correctly.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the output above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
