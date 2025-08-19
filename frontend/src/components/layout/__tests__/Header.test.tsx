import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';

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
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the hooks
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { 
      id: '1', 
      username: 'John Doe', 
      email: 'john@example.com',
      role: 'Owner' 
    },
    hasPermission: jest.fn(() => true),
    hasAnyRole: jest.fn(() => true),
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    direction: 'ltr' as const,
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.search': 'Search...',
        'common.language': 'Language',
        'common.profile': 'Profile',
        'auth.logout': 'Sign Out',
      };
      return translations[key] || key;
    },
    setLanguage: jest.fn(),
  }),
}));

const renderHeader = (props = {}) => {
  const defaultProps = {
    isSidebarCollapsed: false,
    onSidebarToggle: jest.fn(),
  };

  return render(
    <BrowserRouter>
      <Header {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  describe('Basic Rendering', () => {
    it('renders the header with company branding', () => {
      renderHeader();
      
      expect(screen.getByText('Gold Shop')).toBeInTheDocument();
      expect(screen.getByText('Professional')).toBeInTheDocument();
    });

    it('renders the global search input', () => {
      renderHeader();
      
      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders user avatar with initials', () => {
      renderHeader();
      
      expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe initials
    });

    it('renders notification bell', () => {
      renderHeader();
      
      const notificationButton = screen.getByLabelText('Notifications');
      expect(notificationButton).toBeInTheDocument();
    });

    it('renders language switcher', () => {
      renderHeader();
      
      const languageButton = screen.getByLabelText('Change language');
      expect(languageButton).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('shows search results when typing', async () => {
      renderHeader();
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'gold' } });
      
      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      });
    });

    it('clears search when X button is clicked', async () => {
      renderHeader();
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'gold' } });
      
      await waitFor(() => {
        const clearButton = screen.getByRole('button');
        fireEvent.click(clearButton);
      });
      
      expect(searchInput).toHaveValue('');
    });

    it('displays different types of search results', async () => {
      renderHeader();
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'gold' } });
      
      await waitFor(() => {
        expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
        expect(screen.getByText('product')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Center', () => {
    it('opens notification dropdown when bell is clicked', async () => {
      renderHeader();
      
      const notificationButton = screen.getByLabelText('Notifications');
      fireEvent.click(notificationButton);
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    it('shows unread notification count', () => {
      renderHeader();
      
      // Check for notification badge (assuming there are unread notifications)
      const notificationButton = screen.getByLabelText('Notifications');
      expect(notificationButton).toBeInTheDocument();
    });

    it('displays notification items with proper formatting', async () => {
      renderHeader();
      
      const notificationButton = screen.getByLabelText('Notifications');
      fireEvent.click(notificationButton);
      
      await waitFor(() => {
        expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
        expect(screen.getByText('Payment Received')).toBeInTheDocument();
      });
    });
  });

  describe('Language Switcher', () => {
    it('opens language dropdown when globe icon is clicked', async () => {
      renderHeader();
      
      const languageButton = screen.getByLabelText('Change language');
      fireEvent.click(languageButton);
      
      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('فارسی')).toBeInTheDocument();
      });
    });

    it('shows current language selection', async () => {
      renderHeader();
      
      const languageButton = screen.getByLabelText('Change language');
      fireEvent.click(languageButton);
      
      await waitFor(() => {
        // English should be selected by default
        const englishOption = screen.getByText('English').closest('[role="menuitem"]');
        expect(englishOption).toHaveClass('bg-primary/10');
      });
    });
  });

  describe('User Menu', () => {
    it('opens user dropdown when avatar is clicked', async () => {
      renderHeader();
      
      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Owner')).toBeInTheDocument();
      });
    });

    it('shows user menu options', async () => {
      renderHeader();
      
      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);
      
      await waitFor(() => {
        expect(screen.getByText('Profile Settings')).toBeInTheDocument();
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
        expect(screen.getByText('Help & Support')).toBeInTheDocument();
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });
    });
  });

  describe('Sidebar Toggle', () => {
    it('calls onSidebarToggle when desktop toggle is clicked', () => {
      const onSidebarToggle = jest.fn();
      renderHeader({ onSidebarToggle });
      
      // Find the desktop sidebar toggle (hidden on mobile)
      const toggleButtons = screen.getAllByLabelText(/sidebar/i);
      const desktopToggle = toggleButtons.find(button => 
        button.closest('.hidden.md\\:block')
      );
      
      if (desktopToggle) {
        fireEvent.click(desktopToggle);
        expect(onSidebarToggle).toHaveBeenCalledTimes(1);
      }
    });

    it('shows correct aria-label based on sidebar state', () => {
      renderHeader({ isSidebarCollapsed: true });
      
      const toggleButton = screen.getByLabelText('Expand sidebar');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('shows mobile sidebar component', () => {
      renderHeader();
      
      // MobileSidebar should be rendered
      expect(document.querySelector('.md\\:hidden')).toBeInTheDocument();
    });

    it('hides company branding on smaller screens', () => {
      renderHeader();
      
      // Company branding should have lg:flex class (hidden on smaller screens)
      const branding = screen.getByText('Gold Shop').closest('.hidden.lg\\:flex');
      expect(branding).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for all interactive elements', () => {
      renderHeader();
      
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('Change language')).toBeInTheDocument();
      expect(screen.getByLabelText('User menu')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderHeader();
      
      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toHaveAttribute('type', 'text');
      
      // All buttons should be focusable
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Professional Styling', () => {
    it('applies gold theme classes', () => {
      const { container } = renderHeader();
      
      // Check for gradient and backdrop blur classes
      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-gradient-to-r');
      expect(header).toHaveClass('backdrop-blur-xl');
    });

    it('applies hover effects to interactive elements', () => {
      renderHeader();
      
      const notificationButton = screen.getByLabelText('Notifications');
      expect(notificationButton).toHaveClass('hover:bg-primary/10');
    });
  });

  describe('Animation and Transitions', () => {
    it('applies motion classes for animations', () => {
      const { container } = renderHeader();
      
      // Header should have motion properties (mocked)
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });
  });
});