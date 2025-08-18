// 🐳 DOCKER REQUIREMENT: Use require for axios in tests
const axios = require('axios');

export {}; // Make this file a module

describe('API Utils Test', () => {
  test('axios is available', () => {
    expect(axios).toBeDefined();
    expect(axios.create).toBeDefined();
  });
  
  test('can create axios instance', () => {
    const api = axios.create({
      baseURL: 'http://localhost:8000',
    });
    expect(api).toBeDefined();
    expect(api.defaults.baseURL).toBe('http://localhost:8000');
  });
});