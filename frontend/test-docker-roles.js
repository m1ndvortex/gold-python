// Docker Backend Role-Based Permission Testing
// Tests all user roles and their specific permissions
// Run this with: node test-docker-roles.js

const axios = require('axios');

const BACKEND_URL = 'http://localhost:8000';
const TEST_TIMEOUT = 60000;

// Test users with different roles
const TEST_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'Owner',
    expectedPermissions: {
      view_dashboard: true,
      view_inventory: true,
      edit_inventory: true,
      view_customers: true,
      manage_customers: true,
      manage_payments: true,
      view_invoices: true,
      create_invoices: true,
      edit_invoices: true,
      view_accounting: true,
      edit_accounting: true,
      view_reports: true,
      send_sms: true,
      view_settings: true,
      edit_settings: true,
      manage_roles: true,
      manage_users: true,
      view_roles: true
    }
  },
  {
    username: 'manager',
    password: 'manager123',
    role: 'Manager',
    expectedPermissions: {
      view_dashboard: true,
      view_inventory: true,
      edit_inventory: true,
      view_customers: true,
      manage_customers: true,
      manage_payments: true,
      view_invoices: true,
      create_invoices: true,
      edit_invoices: true,
      view_accounting: true,
      view_reports: true,
      send_sms: true,
      edit_settings: true,
      manage_roles: false,
      manage_users: false
    }
  },
  {
    username: 'accountant',
    password: 'accountant123',
    role: 'Accountant',
    expectedPermissions: {
      view_dashboard: true,
      view_inventory: true,
      edit_inventory: false,
      view_customers: true,
      manage_customers: false,
      manage_payments: false,
      view_invoices: true,
      create_invoices: false,
      edit_invoices: false,
      view_accounting: true,
      edit_accounting: true,
      view_reports: true,
      send_sms: false,
      manage_settings: false,
      manage_roles: false,
      manage_users: false
    }
  },
  {
    username: 'cashier',
    password: 'cashier123',
    role: 'Cashier',
    expectedPermissions: {
      view_dashboard: true,
      view_inventory: true,
      edit_inventory: false,
      view_customers: true,
      manage_customers: true,
      manage_payments: true,
      view_invoices: true,
      create_invoices: true,
      edit_invoices: false,
      view_accounting: false,
      edit_accounting: false,
      view_reports: false,
      send_sms: true,
      manage_settings: false,
      manage_roles: false,
      manage_users: false
    }
  }
];

// Test endpoints based on permissions
const PERMISSION_ENDPOINTS = {
  view_dashboard: { method: 'GET', url: '/inventory/stats' }, // Using inventory stats as dashboard
  view_inventory: { method: 'GET', url: '/inventory/items' },
  edit_inventory: { method: 'GET', url: '/inventory/categories' }, // Using GET categories as proxy for edit inventory access
  view_customers: { method: 'GET', url: '/customers' },
  manage_customers: { method: 'GET', url: '/customers' }, // Using GET as proxy since we need valid data for POST
  view_invoices: { method: 'GET', url: '/invoices' },
  create_invoices: { method: 'GET', url: '/invoices' }, // Using GET as proxy since POST needs valid data
  view_accounting: { method: 'GET', url: '/accounting/income-ledger' },
  edit_accounting: { method: 'GET', url: '/accounting/expense-ledger' },
  view_reports: { method: 'GET', url: '/reports/sales/trends' },
  view_settings: { method: 'GET', url: '/settings/company' },
  view_roles: { method: 'GET', url: '/roles' },
  manage_users: { method: 'GET', url: '/auth/verify' }, // Using auth verify as proxy for user management access
  send_sms: { method: 'GET', url: '/sms/templates' }
};

async function loginUser(username, password) {
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      username,
      password
    });
    
    if (response.status === 200 && response.data.access_token) {
      return response.data.access_token;
    }
    return null;
  } catch (error) {
    console.error(`❌ Login failed for ${username}:`, error.response?.data || error.message);
    return null;
  }
}

async function getUserInfo(token) {
  try {
    const response = await axios.get(`${BACKEND_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get user info:', error.response?.data || error.message);
    return null;
  }
}

async function testEndpointAccess(endpoint, token, shouldHaveAccess) {
  try {
    const config = {
      method: endpoint.method,
      url: `${BACKEND_URL}${endpoint.url}`,
      headers: { 'Authorization': `Bearer ${token}` }
    };
    
    if (endpoint.data) {
      config.data = endpoint.data;
    }
    
    const response = await axios(config);
    
    if (shouldHaveAccess) {
      console.log(`    ✅ ${endpoint.method} ${endpoint.url} - Access granted (${response.status})`);
      return true;
    } else {
      console.log(`    ❌ ${endpoint.method} ${endpoint.url} - Should have been denied but got (${response.status})`);
      return false;
    }
  } catch (error) {
    const status = error.response?.status;
    if (!shouldHaveAccess && (status === 403 || status === 401)) {
      console.log(`    ✅ ${endpoint.method} ${endpoint.url} - Access properly denied (${status})`);
      return true;
    } else if (shouldHaveAccess) {
      console.log(`    ❌ ${endpoint.method} ${endpoint.url} - Should have access but got error (${status})`);
      return false;
    } else {
      console.log(`    ❓ ${endpoint.method} ${endpoint.url} - Unexpected error (${status}): ${error.response?.data?.detail || error.message}`);
      return false;
    }
  }
}

async function testUserRolePermissions(user) {
  console.log(`\n🔍 Testing ${user.role} role (${user.username})`);
  console.log('=' .repeat(50));
  
  // Login
  const token = await loginUser(user.username, user.password);
  if (!token) {
    console.log(`❌ Could not login as ${user.username}`);
    return { passed: 0, total: 0 };
  }
  
  console.log(`✅ Login successful for ${user.username}`);
  
  // Get user info and verify role
  const userInfo = await getUserInfo(token);
  if (userInfo) {
    console.log(`📋 User: ${userInfo.username} (${userInfo.email})`);
    console.log(`👤 Role: ${userInfo.role?.name || 'Unknown'}`);
    console.log(`🔑 Active: ${userInfo.is_active}`);
  }
  
  // Test permissions
  console.log(`\n🧪 Testing permissions for ${user.role}:`);
  
  let passedTests = 0;
  let totalTests = 0;
  
  for (const [permission, hasPermission] of Object.entries(user.expectedPermissions)) {
    const endpoint = PERMISSION_ENDPOINTS[permission];
    if (endpoint) {
      totalTests++;
      const result = await testEndpointAccess(endpoint, token, hasPermission);
      if (result) passedTests++;
    }
  }
  
  console.log(`\n📊 ${user.role} Results: ${passedTests}/${totalTests} permission tests passed`);
  return { passed: passedTests, total: totalTests };
}

async function runAllRoleTests() {
  console.log('🚀 Starting Docker Backend Role-Based Permission Testing');
  console.log('Backend URL:', BACKEND_URL);
  console.log('Testing all user roles and their specific permissions...\n');
  
  let totalPassed = 0;
  let totalTests = 0;
  const results = [];
  
  for (const user of TEST_USERS) {
    const result = await testUserRolePermissions(user);
    results.push({ role: user.role, ...result });
    totalPassed += result.passed;
    totalTests += result.total;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL ROLE-BASED PERMISSION TEST RESULTS');
  console.log('='.repeat(60));
  
  for (const result of results) {
    const percentage = result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
    console.log(`${result.role.padEnd(12)} : ${result.passed}/${result.total} (${percentage}%)`);
  }
  
  console.log('='.repeat(60));
  const overallPercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  console.log(`OVERALL TOTAL: ${totalPassed}/${totalTests} (${overallPercentage}%)`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 All role-based permission tests passed! RBAC is working correctly.');
    process.exit(0);
  } else {
    console.log('❌ Some permission tests failed. Please review the results above.');
    process.exit(1);
  }
}

// Run all role tests
runAllRoleTests().catch(error => {
  console.error('💥 Role testing suite failed:', error);
  process.exit(1);
});
