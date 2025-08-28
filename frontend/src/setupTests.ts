// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock ResizeObserver
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
  root = null;
  rootMargin = '';
  thresholds = [];
}

global.IntersectionObserver = IntersectionObserverMock as any;

// Mock axios
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: {
      baseURL: '',
    },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));