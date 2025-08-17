import { renderHook, act } from '@testing-library/react';
import { useLanguageProvider } from '../hooks/useLanguage';

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

describe('useLanguage Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset document properties
    document.documentElement.dir = '';
    document.documentElement.lang = '';
  });

  test('initializes with Persian as default language', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useLanguageProvider());
    
    expect(result.current.language).toBe('fa');
    expect(result.current.direction).toBe('rtl');
  });

  test('loads saved language from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    const { result } = renderHook(() => useLanguageProvider());
    
    expect(result.current.language).toBe('en');
    expect(result.current.direction).toBe('ltr');
  });

  test('changes language and updates document properties', () => {
    const { result } = renderHook(() => useLanguageProvider());
    
    act(() => {
      result.current.setLanguage('en');
    });
    
    expect(result.current.language).toBe('en');
    expect(result.current.direction).toBe('ltr');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  test('translates keys correctly', () => {
    const { result } = renderHook(() => useLanguageProvider());
    
    // Test Persian translation
    expect(result.current.t('app.title')).toBe('سیستم مدیریت طلافروشی');
    
    act(() => {
      result.current.setLanguage('en');
    });
    
    // Test English translation
    expect(result.current.t('app.title')).toBe('Gold Shop Management System');
  });

  test('returns key if translation not found', () => {
    const { result } = renderHook(() => useLanguageProvider());
    
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });
});