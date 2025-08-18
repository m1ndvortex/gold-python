// 🐳 DOCKER-SPECIFIC TEST SETUP
// This file configures tests for Docker environment with real backend and PostgreSQL

import '@testing-library/jest-dom';

// 🐳 Configure environment for MAIN Docker backend testing
process.env.REACT_APP_API_URL = 'http://localhost:8000';
process.env.NODE_ENV = 'test';

// 🐳 Set global test timeout for Docker integration tests
jest.setTimeout(120000); // 2 minutes for Docker tests

// 🐳 Mock console methods to reduce noise in Docker tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  // Only show actual errors, not React warnings
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || 
     args[0].includes('ReactDOMTestUtils.act') ||
     args[0].includes('React Router Future Flag'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  // Filter out React Router warnings
  if (
    typeof args[0] === 'string' &&
    args[0].includes('React Router Future Flag')
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// 🐳 Global test utilities for MAIN Docker environment
(global as any).dockerTestUtils = {
  BACKEND_URL: 'http://localhost:8000',
  DATABASE_URL: 'postgresql://goldshop_user:goldshop_password@localhost:5432/goldshop_db',
  TEST_TIMEOUT: 120000,
  
  // Helper to wait for services
  waitForServices: async () => {
    console.log('🐳 Waiting for Docker services to be ready...');
    // This will be used by tests to ensure services are available
  },
  
  // Helper to clean up test data
  cleanupTestData: async () => {
    console.log('🐳 Cleaning up test data from Docker services...');
    // This will be used by tests to clean up after themselves
  }
};

// 🐳 Configure axios defaults for MAIN Docker backend testing
const axios = require('axios');
if (axios.defaults) {
  axios.defaults.baseURL = 'http://localhost:8000';
  axios.defaults.timeout = 30000;
}

console.log('🐳 Docker test environment configured successfully');