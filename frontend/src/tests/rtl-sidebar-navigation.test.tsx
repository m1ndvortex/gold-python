import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { MobileSidebar } from '../components/layout/MobileSidebar';

// Create mock functions that can be updated per test
let mockLanguage = 'en';
let mockDirection = 'ltr';

jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: mockLanguage,
    setLanguage: jest.fn(),
    direction: mockDirection,
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

// Mock UI components
jest.mock('../components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div data-testid="sheet">{children}</div>,
  SheetContent: ({ children, side }: { children: React.ReactNode; side: string }) => (
    <div data-testid="sheet-content" data-side={side}>{children}</div>
  ),
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="sheet-trigger">{children}</div>,
}));

jest.mock('../components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children, align }: { children: React.ReactNode; align?: string }) => (
    <div data-testid="dropdown-content" data-align={align}>{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div data-testid="dropdown-item" onClick={onClick}>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-label">{children}</div>,
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-trigger">{children}</div>,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('RTL Sidebar and Navigation Support', () => {
  beforeEach(() => {
    // Reset to default values
    mockLanguage = 'en';
    mockDirection = 'ltr';
  });

  describe('Sidebar RTL Support', () => {
    it('applies RTL classes when language is Persian', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check if sidebar has RTL classes
      const sidebar = document.querySelector('[class*="sidebar-rtl"]');
      expect(sidebar).toBeInTheDocument();

      // Check if sidebar has proper border positioning for RTL
      const sidebarWithBorder = document.querySelector('[class*="border-s"]');
      expect(sidebarWithBorder).toBeInTheDocument();
    });

    it('applies LTR classes when language is English', () => {
      mockLanguage = 'en';
      mockDirection = 'ltr';

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check if sidebar has LTR classes
      const sidebar = document.querySelector('[class*="sidebar-ltr"]');
      expect(sidebar).toBeInTheDocument();

      // Check if sidebar has proper border positioning for LTR
      const sidebarWithBorder = document.querySelector('[class*="border-e"]');
      expect(sidebarWithBorder).toBeInTheDocument();
    });

    it('positions active indicator correctly in RTL mode', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for RTL active indicator positioning
      const activeIndicator = document.querySelector('[class*="end-0"][class*="rounded-s-full"]');
      expect(activeIndicator).toBeInTheDocument();
    });

    it('positions active indicator correctly in LTR mode', () => {
      mockLanguage = 'en';
      mockDirection = 'ltr';

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for LTR active indicator positioning
      const activeIndicator = document.querySelector('[class*="start-0"][class*="rounded-e-full"]');
      expect(activeIndicator).toBeInTheDocument();
    });

    it('positions sub-navigation correctly in RTL mode', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for RTL sub-navigation positioning
      const subNav = document.querySelector('[class*="me-4"][class*="border-e"][class*="pe-4"]');
      expect(subNav).toBeInTheDocument();
    });

    it('positions sub-navigation correctly in LTR mode', () => {
      mockLanguage = 'en';
      mockDirection = 'ltr';

      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for LTR sub-navigation positioning
      const subNav = document.querySelector('[class*="ms-4"][class*="border-s"][class*="ps-4"]');
      expect(subNav).toBeInTheDocument();
    });

    it('handles toggle button icon direction correctly', () => {
      const mockToggle = jest.fn();
      render(
        <TestWrapper>
          <Sidebar isCollapsed={false} onToggle={mockToggle} />
        </TestWrapper>
      );

      const toggleButton = screen.getByLabelText(/collapse sidebar/i);
      expect(toggleButton).toBeInTheDocument();
      
      fireEvent.click(toggleButton);
      expect(mockToggle).toHaveBeenCalled();
    });
  });

  describe('MobileSidebar RTL Support', () => {
    it('positions mobile sidebar on correct side for RTL', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      render(
        <TestWrapper>
          <MobileSidebar />
        </TestWrapper>
      );

      // Check if sheet content has correct side positioning
      const sheetContent = screen.getByTestId('sheet-content');
      expect(sheetContent).toHaveAttribute('data-side', 'right');
    });

    it('positions mobile sidebar on correct side for LTR', () => {
      mockLanguage = 'en';
      mockDirection = 'ltr';

      render(
        <TestWrapper>
          <MobileSidebar />
        </TestWrapper>
      );

      // Check if sheet content has correct side positioning
      const sheetContent = screen.getByTestId('sheet-content');
      expect(sheetContent).toHaveAttribute('data-side', 'left');
    });

    it('applies correct border classes for RTL', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      render(
        <TestWrapper>
          <MobileSidebar />
        </TestWrapper>
      );

      // Check for RTL border classes
      const borderElement = document.querySelector('[class*="border-s"]');
      expect(borderElement).toBeInTheDocument();
    });

    it('applies correct border classes for LTR', () => {
      mockLanguage = 'en';
      mockDirection = 'ltr';

      render(
        <TestWrapper>
          <MobileSidebar />
        </TestWrapper>
      );

      // Check for LTR border classes
      const borderElement = document.querySelector('[class*="border-e"]');
      expect(borderElement).toBeInTheDocument();
    });
  });

  describe('Header RTL Support', () => {
    it('positions dropdown menus correctly for RTL', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check dropdown alignment
      const dropdownContent = screen.getAllByTestId('dropdown-content');
      dropdownContent.forEach(dropdown => {
        expect(dropdown).toHaveAttribute('data-align', 'start');
      });
    });

    it('positions dropdown menus correctly for LTR', () => {
      mockLanguage = 'en';
      mockDirection = 'ltr';

      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check dropdown alignment
      const dropdownContent = screen.getAllByTestId('dropdown-content');
      dropdownContent.forEach(dropdown => {
        expect(dropdown).toHaveAttribute('data-align', 'end');
      });
    });

    it('applies correct spacing classes for RTL', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for space-x-reverse class
      const spacingElements = document.querySelectorAll('[class*="space-x-reverse"]');
      expect(spacingElements.length).toBeGreaterThan(0);
    });

    it('handles search input direction correctly', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
      
      // Check if search input has proper RTL styling
      expect(searchInput).toHaveClass('pr-10', 'pl-3');
    });

    it('positions notification dropdown correctly for RTL', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for notification positioning classes
      const notificationDropdown = document.querySelector('[class*="left-0"]');
      expect(notificationDropdown).toBeInTheDocument();
    });

    it('positions notification dropdown correctly for LTR', () => {
      mockLanguage = 'en';
      mockDirection = 'ltr';

      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for notification positioning classes
      const notificationDropdown = document.querySelector('[class*="right-0"]');
      expect(notificationDropdown).toBeInTheDocument();
    });
  });

  describe('Navigation Icon Positioning', () => {
    it('positions icons correctly in dropdown items for RTL', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for RTL icon positioning (ml-3 instead of mr-3)
      const iconElements = document.querySelectorAll('[class*="ml-3"]');
      expect(iconElements.length).toBeGreaterThan(0);
    });

    it('positions icons correctly in dropdown items for LTR', () => {
      mockLanguage = 'en';
      mockDirection = 'ltr';

      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for LTR icon positioning (mr-3)
      const iconElements = document.querySelectorAll('[class*="mr-3"]');
      expect(iconElements.length).toBeGreaterThan(0);
    });

    it('handles notification icon positioning for RTL', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for RTL notification icon positioning
      const clockIcon = document.querySelector('[class*="ml-1"]');
      expect(clockIcon).toBeInTheDocument();
    });

    it('handles notification icon positioning for LTR', () => {
      mockLanguage = 'en';
      mockDirection = 'ltr';

      render(
        <TestWrapper>
          <Header isSidebarCollapsed={false} onSidebarToggle={jest.fn()} />
        </TestWrapper>
      );

      // Check for LTR notification icon positioning
      const clockIcon = document.querySelector('[class*="mr-1"]');
      expect(clockIcon).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('maintains RTL layout on mobile', () => {
      mockLanguage = 'fa';
      mockDirection = 'rtl';

      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(
        <TestWrapper>
          <MobileSidebar />
        </TestWrapper>
      );

      const sheetContent = screen.getByTestId('sheet-content');
      expect(sheetContent).toHaveAttribute('data-side', 'right');
    });

    it('maintains LTR layout on mobile', () => {
      mockLanguage = 'en';
      mockDirection = 'ltr';

      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(
        <TestWrapper>
          <MobileSidebar />
        </TestWrapper>
      );

      const sheetContent = screen.getByTestId('sheet-content');
      expect(sheetContent).toHaveAttribute('data-side', 'left');
    });
  });
});