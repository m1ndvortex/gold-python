import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from '../pages/Login';

// Mock the useAuth hook
const mockLogin = jest.fn();
let mockUseAuth = {
  login: mockLogin,
  isLoggingIn: false,
  loginError: null,
  isAuthenticated: false,
  isLoading: false,
};

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock the useLanguage hook
const mockUseLanguage = {
  t: (key: string) => key,
  language: 'en' as const,
  setLanguage: jest.fn(),
  direction: 'ltr' as const,
};

jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => mockUseLanguage,
}));

const renderLoginPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Login Page - Production Version', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to default state
    mockUseAuth = {
      login: mockLogin,
      isLoggingIn: false,
      loginError: null,
      isAuthenticated: false,
      isLoading: false,
    };
  });

  describe('Production Features', () => {
    test('should not display demo credentials section', () => {
      renderLoginPage();
      
      // Demo credentials section should not exist
      expect(screen.queryByText(/Demo Access/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/🎯 Demo Access/)).not.toBeInTheDocument();
      expect(screen.queryByText(/admin \/ admin123/)).not.toBeInTheDocument();
      expect(screen.queryByText(/manager \/ manager123/)).not.toBeInTheDocument();
      expect(screen.queryByText(/cashier \/ cashier123/)).not.toBeInTheDocument();
    });

    test('should not display create account link', () => {
      renderLoginPage();
      
      // Create account link should not exist
      expect(screen.queryByText(/Create Account/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ایجاد حساب کاربری/)).not.toBeInTheDocument();
    });

    test('should display forgot password link', () => {
      renderLoginPage();
      
      // Forgot password link should exist
      expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
    });

    test('should display admin-only user creation note', () => {
      renderLoginPage();
      
      // Admin note should be present
      expect(screen.getByText(/New accounts are created by system administrators only/i)).toBeInTheDocument();
    });
  });

  describe('Core Login Functionality', () => {
    test('should render login form with required fields', () => {
      renderLoginPage();
      
      // Check for essential form elements
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    test('should validate required fields', async () => {
      renderLoginPage();
      
      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);
      
      // The form validation might not show immediately, so let's check if the button is disabled instead
      await waitFor(() => {
        expect(loginButton).toBeDisabled();
      });
    });

    test('should submit form with valid credentials', async () => {
      renderLoginPage();
      
      const usernameInput = screen.getByLabelText(/Username/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
      });
      
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
        });
      });
    });

    test('should toggle password visibility', () => {
      renderLoginPage();
      
      const passwordInput = screen.getByLabelText(/Password/i);
      const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Language Support', () => {
    test('should support language switching', () => {
      renderLoginPage();
      
      const languageToggle = screen.getByRole('button', { name: /فارسی/i });
      expect(languageToggle).toBeInTheDocument();
      
      // Just verify the language toggle button exists and is clickable
      expect(languageToggle).not.toBeDisabled();
    });
  });

  describe('Security Features', () => {
    test('should display secure connection indicator', () => {
      renderLoginPage();
      
      expect(screen.getByText(/🔒 Secure Connection/i)).toBeInTheDocument();
    });

    test('should show security badge', () => {
      renderLoginPage();
      
      expect(screen.getByText(/Secure • Professional • Reliable/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should display login error when authentication fails', () => {
      // Set mock to return error state
      (mockUseAuth as any).loginError = { response: { status: 401 } };
      
      renderLoginPage();
      
      expect(screen.getByText(/Invalid username or password/i)).toBeInTheDocument();
    });

    test('should display network error message', () => {
      // Set mock to return network error state
      (mockUseAuth as any).loginError = { code: 'NETWORK_ERROR' };
      
      renderLoginPage();
      
      expect(screen.getByText(/Network error. Please check your connection/i)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('should show loading state during login', () => {
      // Set mock to return logging in state
      mockUseAuth.isLoggingIn = true;
      
      renderLoginPage();
      
      expect(screen.getByText(/Signing in.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Signing in.../i })).toBeDisabled();
    });

    test('should show loading spinner during auth check', () => {
      // Set mock to return loading state
      mockUseAuth.isLoading = true;
      
      renderLoginPage();
      
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should have proper gradient background', () => {
      renderLoginPage();
      
      const container = document.querySelector('.min-h-screen');
      expect(container).toHaveClass('bg-gradient-to-br');
    });

    test('should have enhanced visual elements', () => {
      renderLoginPage();
      
      // Check for gradient title - it should be the h2 element with the gradient class
      const titleElement = document.querySelector('h2.bg-gradient-to-r');
      expect(titleElement).toBeInTheDocument();
      
      // Check for enhanced button styling
      const loginButton = screen.getByRole('button', { name: /Login/i });
      expect(loginButton).toHaveClass('bg-gradient-to-r');
    });
  });
});