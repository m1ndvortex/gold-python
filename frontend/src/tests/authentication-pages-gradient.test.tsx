import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageContext, useLanguageProvider } from '../hooks/useLanguage';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';

// Mock the useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: jest.fn(),
    isLoggingIn: false,
    loginError: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

describe('Authentication Pages Gradient Styling', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('Login Page', () => {
    it('renders with gradient background and styling', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Check for gradient background elements
      const backgroundElements = document.querySelectorAll('[class*="bg-gradient"]');
      expect(backgroundElements.length).toBeGreaterThan(0);

      // Check for main title with gradient text (using heading role)
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('bg-gradient-to-r');

      // Check for gradient login button (in Persian by default)
      const loginButton = screen.getByRole('button', { name: /ورود/ });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveClass('bg-gradient-to-r');
    });

    it('has enhanced demo credentials section with gradient styling', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Check for demo credentials section (in Persian by default)
      const demoSection = screen.getByText(/دسترسی نمونه/);
      expect(demoSection).toBeInTheDocument();

      // Check for role badges with gradient styling using more specific selectors
      const roleElements = screen.getAllByText(/مدیر/);
      expect(roleElements.length).toBeGreaterThan(0);
      
      const ownerRole = screen.getByText('مالک');
      const cashierRole = screen.getByText('صندوقدار');

      expect(ownerRole).toBeInTheDocument();
      expect(cashierRole).toBeInTheDocument();
    });

    it('has navigation links to other auth pages', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Use more specific selectors for links
      const links = screen.getAllByRole('link');
      const createAccountLink = links.find(link => link.textContent?.includes('ایجاد حساب کاربری'));
      const forgotPasswordLink = links.find(link => link.textContent?.includes('فراموشی رمز عبور'));

      expect(createAccountLink).toBeInTheDocument();
      expect(forgotPasswordLink).toBeInTheDocument();
    });
  });

  describe('Register Page', () => {
    it('renders with gradient background and styling', () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      // Check for gradient background elements
      const backgroundElements = document.querySelectorAll('[class*="bg-gradient"]');
      expect(backgroundElements.length).toBeGreaterThan(0);

      // Check for main title using heading role
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('bg-gradient-to-r');

      // Check for form fields (in Persian by default) using more specific selectors
      const firstNameInput = screen.getByPlaceholderText(/نام را وارد کنید/);
      const lastNameInput = screen.getByPlaceholderText(/نام خانوادگی را وارد کنید/);
      const emailInput = screen.getByPlaceholderText(/آدرس ایمیل را وارد کنید/);
      const usernameInput = screen.getByPlaceholderText(/نام کاربری انتخاب کنید/);

      expect(firstNameInput).toBeInTheDocument();
      expect(lastNameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      expect(usernameInput).toBeInTheDocument();
    });

    it('has gradient submit button', () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /ایجاد حساب کاربری/ });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveClass('bg-gradient-to-r');
    });
  });

  describe('Forgot Password Page', () => {
    it('renders with gradient background and styling', () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      );

      // Check for gradient background elements
      const backgroundElements = document.querySelectorAll('[class*="bg-gradient"]');
      expect(backgroundElements.length).toBeGreaterThan(0);

      // Check for main title using heading role
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('bg-gradient-to-r');

      // Check for email field using placeholder
      const emailInput = screen.getByPlaceholderText(/آدرس ایمیل خود را وارد کنید/);
      expect(emailInput).toBeInTheDocument();
    });

    it('has gradient submit button', () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /ارسال ایمیل بازیابی/ });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveClass('bg-gradient-to-r');
    });
  });

  describe('Gradient Design System', () => {
    it('uses consistent gradient color scheme across all auth pages', () => {
      // Test Login page
      const { unmount: unmountLogin } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      let gradientElements = document.querySelectorAll('[class*="from-green"], [class*="to-teal"], [class*="to-blue"]');
      expect(gradientElements.length).toBeGreaterThan(0);
      unmountLogin();

      // Test Register page
      const { unmount: unmountRegister } = render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      gradientElements = document.querySelectorAll('[class*="from-green"], [class*="to-teal"], [class*="to-blue"]');
      expect(gradientElements.length).toBeGreaterThan(0);
      unmountRegister();

      // Test Forgot Password page
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      );

      gradientElements = document.querySelectorAll('[class*="from-green"], [class*="to-teal"], [class*="to-blue"]');
      expect(gradientElements.length).toBeGreaterThan(0);
    });

    it('has enhanced shadow and backdrop effects', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Check for enhanced shadows
      const shadowElements = document.querySelectorAll('[class*="shadow-2xl"], [class*="shadow-xl"]');
      expect(shadowElements.length).toBeGreaterThan(0);

      // Check for backdrop blur effects
      const backdropElements = document.querySelectorAll('[class*="backdrop-blur"]');
      expect(backdropElements.length).toBeGreaterThan(0);
    });

    it('has smooth animations and transitions', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Check for animation classes
      const animatedElements = document.querySelectorAll('[class*="animate-"], [class*="transition-"], [class*="duration-"]');
      expect(animatedElements.length).toBeGreaterThan(0);

      // Check for hover effects
      const hoverElements = document.querySelectorAll('[class*="hover:"]');
      expect(hoverElements.length).toBeGreaterThan(0);
    });
  });

  describe('Loading States', () => {
    it('has gradient-styled loading states', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Check that buttons have proper loading state classes
      const buttons = document.querySelectorAll('button[class*="bg-gradient"]');
      expect(buttons.length).toBeGreaterThan(0);

      // Verify buttons have transition classes for smooth loading states
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-all');
      });
    });
  });
});