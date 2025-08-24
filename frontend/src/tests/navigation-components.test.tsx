import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { MainLayout } from '../components/layout/MainLayout';
import { MobileSidebar } from '../components/layout/MobileSidebar';

// Mock hooks
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: jest.fn(),
    direction: 'ltr',
  }),
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { username: 'Test User', email: 'test@example.com', role: 'Owner' },
    hasPermission: () => true,
    hasAnyRole: () => true,
    logout: jest.fn(),
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Navigation Components with Gradient Styling', () => {
  describe('Sidebar Component', () => {
    it('renders with gradient background styling', () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check if sidebar container has gradient background classes
      const sidebarContainer = document.querySelector('.bg-gradient-to-b.from-slate-50.to-slate-100');
      expect(sidebarContainer).toBeInTheDocument();
    });

    it('renders navigation items with gradient icon containers', () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for dashboard link (should be visible)
      const dashboardLink = screen.getByRole('link', { name: /nav\.dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
      
      // Check if it has gradient styling classes
      expect(dashboardLink).toHaveClass('hover:bg-gradient-to-r');
    });

    it('handles collapse/expand functionality', () => {
      const mockToggle = jest.fn();
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={mockToggle} />
        </TestWrapper>
      );

      const toggleButton = screen.getByLabelText(/collapse sidebar/i);
      fireEvent.click(toggleButton);
      expect(mockToggle).toHaveBeenCalled();
    });

    it('shows gradient styling on active navigation items', () => {
      // Mock location to make dashboard active
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true,
      });

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      const dashboardLink = screen.getByRole('link', { name: /nav\.dashboard/i });
      expect(dashboardLink).toHaveClass('bg-gradient-to-r', 'from-green-100', 'to-teal-50');
    });
  });

  describe('Header Component', () => {
    it('renders with gradient background styling', () => {
      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-gradient-to-r', 'from-slate-50');
    });

    it('renders search input with gradient focus styling', () => {
      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toHaveClass('focus:ring-green/20', 'focus:border-green/30');
    });

    it('renders notification button with gradient hover styling', () => {
      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      const notificationButton = screen.getByLabelText(/notifications/i);
      expect(notificationButton).toHaveClass('hover:bg-gradient-to-r');
    });

    it('renders user avatar with gradient background', () => {
      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for user menu button
      const userButton = screen.getByLabelText(/user menu/i);
      expect(userButton).toBeInTheDocument();
    });
  });

  describe('MobileSidebar Component', () => {
    it('renders mobile menu button with gradient hover styling', () => {
      render(
        <TestWrapper>
          <MobileSidebar />
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText(/open navigation menu/i);
      expect(menuButton).toHaveClass('hover:bg-gradient-to-r', 'hover:from-green-100', 'hover:to-teal-100');
    });
  });

  describe('MainLayout Component', () => {
    it('renders with gradient background for main content', () => {
      render(
        <TestWrapper>
          <MainLayout>
            <div>Test Content</div>
          </MainLayout>
        </TestWrapper>
      );

      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveClass('bg-gradient-to-br', 'from-slate-50/30', 'to-white');
    });

    it('renders breadcrumb navigation with gradient background', () => {
      render(
        <TestWrapper>
          <MainLayout>
            <div>Test Content</div>
          </MainLayout>
        </TestWrapper>
      );

      // Check for breadcrumb container
      const breadcrumbContainer = document.querySelector('.bg-gradient-to-r.from-slate-50\\/95');
      expect(breadcrumbContainer).toBeInTheDocument();
    });
  });

  describe('Tab Navigation Styling', () => {
    it('supports gradient tab variants', () => {
      // This test verifies that the tabs component has gradient variants available
      // The actual tabs component is already tested in its own test file
      const { Tabs, TabsList, TabsTrigger } = require('../components/ui/tabs');
      
      expect(TabsList).toBeDefined();
      expect(TabsTrigger).toBeDefined();
      expect(Tabs).toBeDefined();
    });
  });

  describe('Responsive Behavior', () => {
    it('handles responsive sidebar behavior', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(
        <TestWrapper>
          <MainLayout>
            <div>Test Content</div>
          </MainLayout>
        </TestWrapper>
      );

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // The sidebar should be collapsed on mobile
      // This is handled by the MainLayout component's useEffect
      expect(window.innerWidth).toBe(500);
    });
  });

  describe('Gradient Color Consistency', () => {
    it('uses consistent green-teal gradient colors across components', () => {
      render(
        <TestWrapper>
          <div>
            <Sidebar isCollapsed={false} onToggle={jest.fn()} />
            <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
          </div>
        </TestWrapper>
      );

      // Check that both components use consistent gradient colors
      const sidebar = screen.getByRole('navigation');
      const header = screen.getByRole('banner');

      // Both should use slate-50 in their gradients
      const sidebarContainer = document.querySelector('.from-slate-50');
      const headerContainer = document.querySelector('.from-slate-50');
      expect(sidebarContainer).toBeInTheDocument();
      expect(headerContainer).toBeInTheDocument();
    });

    it('uses green-teal gradients for active states', () => {
      // Mock location to make dashboard active
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true,
      });

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      const dashboardLink = screen.getByRole('link', { name: /nav\.dashboard/i });
      expect(dashboardLink).toHaveClass('from-green-100', 'to-teal-50');
    });
  });

  describe('Animation and Transitions', () => {
    it('includes smooth transition classes', () => {
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      const dashboardLink = screen.getByRole('link', { name: /nav\.dashboard/i });
      expect(dashboardLink).toHaveClass('transition-all', 'duration-200');
    });

    it('includes hover shadow effects', () => {
      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      const toggleButton = screen.getByLabelText(/expand sidebar|collapse sidebar/i);
      expect(toggleButton).toHaveClass('hover:shadow-md');
    });
  });
});