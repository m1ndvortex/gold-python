import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { BreadcrumbNav } from '../BreadcrumbNav';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the hooks
jest.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    direction: 'ltr' as const,
    t: (key: string) => {
      const translations: Record<string, string> = {
        'nav.dashboard': 'Dashboard',
        'nav.inventory': 'Inventory',
        'nav.customers': 'Customers',
        'nav.invoices': 'Invoices',
        'nav.accounting': 'Accounting',
        'nav.reports': 'Reports',
        'nav.sms': 'SMS',
        'nav.settings': 'Settings',
        'common.add': 'Add',
        'common.edit': 'Edit',
        'common.create': 'Create',
        'accounting.income': 'Income',
        'accounting.expense': 'Expense',
        'reports.sales': 'Sales Reports',
      };
      return translations[key] || key;
    },
    setLanguage: jest.fn(),
  }),
}));

const renderBreadcrumbNav = (initialEntries = ['/'], props = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <BreadcrumbNav {...props} />
    </MemoryRouter>
  );
};

describe('BreadcrumbNav Component', () => {
  describe('Basic Rendering', () => {
    it('renders home icon for dashboard', () => {
      renderBreadcrumbNav(['/dashboard']);
      
      // Should show home icon
      const homeLink = screen.getByRole('link');
      expect(homeLink).toHaveAttribute('href', '/dashboard');
    });

    it('renders breadcrumb trail for nested routes', () => {
      renderBreadcrumbNav(['/inventory/add']);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('highlights current page in breadcrumb', () => {
      renderBreadcrumbNav(['/inventory/add']);
      
      const currentPage = screen.getByText('Add');
      expect(currentPage.closest('[class*="bg-primary"]')).toBeInTheDocument();
    });

    it('does not render for single dashboard item when features disabled', () => {
      const { container } = renderBreadcrumbNav(['/dashboard'], {
        showHistory: false,
        showQuickAccess: false,
      });
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Navigation History', () => {
    it('renders navigation controls when history is enabled', () => {
      renderBreadcrumbNav(['/inventory'], { showHistory: true });
      
      expect(screen.getByLabelText('Go back')).toBeInTheDocument();
      expect(screen.getByLabelText('Go forward')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigation history')).toBeInTheDocument();
    });

    it('disables back button when cannot go back', () => {
      renderBreadcrumbNav(['/dashboard'], { showHistory: true });
      
      const backButton = screen.getByLabelText('Go back');
      expect(backButton).toBeDisabled();
    });

    it('opens history dropdown when history button is clicked', async () => {
      renderBreadcrumbNav(['/inventory'], { showHistory: true });
      
      const historyButton = screen.getByLabelText('Navigation history');
      fireEvent.click(historyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Pages')).toBeInTheDocument();
      });
    });

    it('shows "No recent pages" when history is empty', async () => {
      renderBreadcrumbNav(['/dashboard'], { showHistory: true });
      
      const historyButton = screen.getByLabelText('Navigation history');
      fireEvent.click(historyButton);
      
      await waitFor(() => {
        expect(screen.getByText('No recent pages')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Access', () => {
    it('renders quick access dropdown when enabled', () => {
      renderBreadcrumbNav(['/inventory'], { showQuickAccess: true });
      
      expect(screen.getByText('Quick Access')).toBeInTheDocument();
    });

    it('opens quick access dropdown when clicked', async () => {
      renderBreadcrumbNav(['/inventory'], { showQuickAccess: true });
      
      const quickAccessButton = screen.getByText('Quick Access');
      fireEvent.click(quickAccessButton);
      
      await waitFor(() => {
        expect(screen.getByText('Frequently Used')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Inventory')).toBeInTheDocument();
      });
    });

    it('shows badges for quick access items', async () => {
      renderBreadcrumbNav(['/dashboard'], { showQuickAccess: true });
      
      const quickAccessButton = screen.getByText('Quick Access');
      fireEvent.click(quickAccessButton);
      
      await waitFor(() => {
        expect(screen.getByText('Hot')).toBeInTheDocument(); // Inventory badge
      });
    });

    it('shows mobile quick access on smaller screens', () => {
      renderBreadcrumbNav(['/inventory'], { showQuickAccess: true });
      
      // Mobile version should have a more horizontal icon button
      const mobileButtons = screen.getAllByRole('button');
      expect(mobileButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Breadcrumb Functionality', () => {
    it('handles dynamic routes correctly', () => {
      renderBreadcrumbNav(['/customers/123/edit']);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('provides correct navigation links', () => {
      renderBreadcrumbNav(['/inventory/add']);
      
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      const inventoryLink = screen.getByText('Inventory').closest('a');
      
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(inventoryLink).toHaveAttribute('href', '/inventory');
    });

    it('shows separators between breadcrumb items', () => {
      renderBreadcrumbNav(['/inventory/add']);
      
      // Should have chevron separators
      const separators = document.querySelectorAll('[class*="lucide-chevron-right"]');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('Professional Styling', () => {
    it('applies gradient background', () => {
      const { container } = renderBreadcrumbNav(['/inventory']);
      
      const breadcrumbContainer = container.firstChild;
      expect(breadcrumbContainer).toHaveClass('bg-gradient-to-r');
    });

    it('applies hover effects to navigation items', () => {
      renderBreadcrumbNav(['/inventory/add']);
      
      const inventoryLink = screen.getByText('Inventory');
      expect(inventoryLink).toHaveClass('hover:bg-primary/10');
    });

    it('highlights current page with primary colors', () => {
      renderBreadcrumbNav(['/inventory/add']);
      
      const currentPage = screen.getByText('Add');
      expect(currentPage).toHaveClass('bg-primary/10', 'text-primary-700');
    });
  });

  describe('Responsive Design', () => {
    it('hides desktop quick access on mobile', () => {
      renderBreadcrumbNav(['/inventory'], { showQuickAccess: true });
      
      const desktopQuickAccess = screen.getByText('Quick Access').closest('.hidden.lg\\:flex');
      expect(desktopQuickAccess).toBeInTheDocument();
    });

    it('shows mobile quick access menu', () => {
      renderBreadcrumbNav(['/inventory'], { showQuickAccess: true });
      
      const mobileQuickAccess = document.querySelector('.lg\\:hidden');
      expect(mobileQuickAccess).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for navigation controls', () => {
      renderBreadcrumbNav(['/inventory'], { showHistory: true });
      
      expect(screen.getByLabelText('Go back')).toBeInTheDocument();
      expect(screen.getByLabelText('Go forward')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigation history')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderBreadcrumbNav(['/inventory/add']);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('provides proper link relationships', () => {
      renderBreadcrumbNav(['/inventory/add']);
      
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      const inventoryLink = screen.getByText('Inventory').closest('a');
      
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(inventoryLink).toHaveAttribute('href', '/inventory');
    });
  });

  describe('Animation and Transitions', () => {
    it('applies motion classes for animations', () => {
      const { container } = renderBreadcrumbNav(['/inventory']);
      
      // Motion div should be present (mocked)
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies transition classes to interactive elements', () => {
      renderBreadcrumbNav(['/inventory'], { showHistory: true });
      
      const backButton = screen.getByLabelText('Go back');
      expect(backButton).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('Route Matching', () => {
    it('matches exact routes correctly', () => {
      renderBreadcrumbNav(['/accounting/income']);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Accounting')).toBeInTheDocument();
      expect(screen.getByText('Income')).toBeInTheDocument();
    });

    it('falls back to base path for unknown routes', () => {
      renderBreadcrumbNav(['/unknown/path']);
      
      // Should fall back to dashboard
      expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard');
    });

    it('handles nested accounting routes', () => {
      renderBreadcrumbNav(['/accounting/expense']);
      
      expect(screen.getByText('Expense')).toBeInTheDocument();
    });

    it('handles reports routes', () => {
      renderBreadcrumbNav(['/reports/sales']);
      
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Sales Reports')).toBeInTheDocument();
    });
  });
});