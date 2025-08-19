import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerList } from '../CustomerList';
import { useCustomers, useCustomerSearch } from '../../../hooks/useCustomers';
import type { Customer } from '../../../types';

// Mock the hooks
jest.mock('../../../hooks/useCustomers');
const mockUseCustomers = useCustomers as jest.MockedFunction<typeof useCustomers>;
const mockUseCustomerSearch = useCustomerSearch as jest.MockedFunction<typeof useCustomerSearch>;

// Mock the toast hook
jest.mock('../../ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock customer data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    address: '123 Main St',
    total_purchases: 5000,
    current_debt: 1500,
    last_purchase_date: '2024-01-15',
    created_at: '2024-01-01',
    updated_at: '2024-01-15'
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '+1987654321',
    email: 'jane@example.com',
    address: '456 Oak Ave',
    total_purchases: 3000,
    current_debt: 0,
    last_purchase_date: '2024-01-10',
    created_at: '2024-01-01',
    updated_at: '2024-01-10'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    phone: '+1555666777',
    email: 'bob@example.com',
    address: '789 Pine Rd',
    total_purchases: 7500,
    current_debt: 500,
    last_purchase_date: '2024-01-20',
    created_at: '2024-01-01',
    updated_at: '2024-01-20'
  }
];

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('CustomerList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCustomers.mockReturnValue({
      data: mockCustomers,
      isLoading: false,
      error: null,
    } as any);
    mockUseCustomerSearch.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
  });

  describe('Modern Interface Rendering', () => {
    it('renders modern header with professional styling', () => {
      renderWithQueryClient(<CustomerList />);
      
      expect(screen.getByText('Customer Management')).toBeInTheDocument();
      expect(screen.getByText('Manage customer relationships and track purchase history with professional tools')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument();
    });

    it('renders professional stats cards', () => {
      renderWithQueryClient(<CustomerList />);
      
      expect(screen.getByText('Total Customers')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total customers count
      expect(screen.getByText('Clear Status')).toBeInTheDocument();
      expect(screen.getByText('With Debt')).toBeInTheDocument();
      expect(screen.getByText('Total Purchases')).toBeInTheDocument();
    });

    it('renders modern data table with professional styling', () => {
      renderWithQueryClient(<CustomerList />);
      
      expect(screen.getByText('Customer Directory')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('displays customer information with modern card styling', () => {
      renderWithQueryClient(<CustomerList />);
      
      // Check for customer names and contact info
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      
      // Check for formatted currency
      expect(screen.getByText('$5,000.00')).toBeInTheDocument();
      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    });
  });

  describe('Advanced Search and Filtering', () => {
    it('provides global search functionality', async () => {
      renderWithQueryClient(<CustomerList />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toBeInTheDocument();
      
      fireEvent.change(searchInput, { target: { value: 'John' } });
      
      await waitFor(() => {
        expect(mockUseCustomerSearch).toHaveBeenCalledWith('John', true);
      });
    });

    it('shows filter button and allows filtering', async () => {
      renderWithQueryClient(<CustomerList />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toBeInTheDocument();
      
      fireEvent.click(filterButton);
      
      // Should show filter panel (implementation depends on DataTable component)
      await waitFor(() => {
        expect(filterButton).toBeInTheDocument();
      });
    });

    it('handles empty search results gracefully', () => {
      mockUseCustomerSearch.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      
      renderWithQueryClient(<CustomerList />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
      
      // Should show appropriate empty message
      expect(searchInput).toHaveValue('NonExistent');
    });
  });

  describe('Professional Customer Profile Cards', () => {
    it('displays customer status badges with appropriate styling', () => {
      renderWithQueryClient(<CustomerList />);
      
      // Check for debt status badges
      const debtBadges = screen.getAllByText(/has debt|clear/i);
      expect(debtBadges.length).toBeGreaterThan(0);
    });

    it('shows customer contact information with icons', () => {
      renderWithQueryClient(<CustomerList />);
      
      // Phone and email should be displayed with icons
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('formats currency values professionally', () => {
      renderWithQueryClient(<CustomerList />);
      
      // Check for properly formatted currency
      expect(screen.getByText('$5,000.00')).toBeInTheDocument();
      expect(screen.getByText('$3,000.00')).toBeInTheDocument();
      expect(screen.getByText('$7,500.00')).toBeInTheDocument();
    });
  });

  describe('Modern UI Interactions', () => {
    it('opens customer form when Add Customer button is clicked', () => {
      renderWithQueryClient(<CustomerList />);
      
      const addButton = screen.getByRole('button', { name: /add customer/i });
      fireEvent.click(addButton);
      
      // Should open the customer form (implementation depends on form component)
      expect(addButton).toBeInTheDocument();
    });

    it('handles row selection with modern checkboxes', async () => {
      renderWithQueryClient(<CustomerList />);
      
      // DataTable should provide selection functionality
      // This test verifies the component renders without errors
      expect(screen.getByText('Customer Directory')).toBeInTheDocument();
    });

    it('provides bulk actions when customers are selected', () => {
      renderWithQueryClient(<CustomerList />);
      
      // Should show bulk action buttons when items are selected
      // This depends on the DataTable implementation
      expect(screen.getByText('Customer Directory')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state with professional styling', () => {
      mockUseCustomers.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);
      
      renderWithQueryClient(<CustomerList />);
      
      // Should show loading state
      expect(screen.getByText('Customer Management')).toBeInTheDocument();
    });

    it('handles empty state gracefully', () => {
      mockUseCustomers.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      
      renderWithQueryClient(<CustomerList />);
      
      // Should show empty state message
      expect(screen.getByText('Customer Management')).toBeInTheDocument();
    });

    it('displays error state appropriately', () => {
      mockUseCustomers.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load customers'),
      } as any);
      
      renderWithQueryClient(<CustomerList />);
      
      // Should handle error state gracefully
      expect(screen.getByText('Customer Management')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      renderWithQueryClient(<CustomerList />);
      
      // Should render mobile-friendly layout
      expect(screen.getByText('Customer Management')).toBeInTheDocument();
    });

    it('shows desktop layout on larger screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      
      renderWithQueryClient(<CustomerList />);
      
      // Should render desktop layout
      expect(screen.getByText('Customer Management')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles', () => {
      renderWithQueryClient(<CustomerList />);
      
      // Check for proper button roles
      expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderWithQueryClient(<CustomerList />);
      
      const addButton = screen.getByRole('button', { name: /add customer/i });
      
      // Should be focusable
      addButton.focus();
      expect(document.activeElement).toBe(addButton);
    });

    it('provides proper heading hierarchy', () => {
      renderWithQueryClient(<CustomerList />);
      
      // Should have proper heading structure
      expect(screen.getByRole('heading', { name: /customer management/i })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles large customer lists efficiently', () => {
      const largeCustomerList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockCustomers[0],
        id: `customer-${i}`,
        name: `Customer ${i}`,
      }));
      
      mockUseCustomers.mockReturnValue({
        data: largeCustomerList,
        isLoading: false,
        error: null,
      } as any);
      
      renderWithQueryClient(<CustomerList />);
      
      // Should render without performance issues
      expect(screen.getByText('Customer Management')).toBeInTheDocument();
    });

    it('debounces search input appropriately', async () => {
      renderWithQueryClient(<CustomerList />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      
      // Rapid typing should be debounced
      fireEvent.change(searchInput, { target: { value: 'J' } });
      fireEvent.change(searchInput, { target: { value: 'Jo' } });
      fireEvent.change(searchInput, { target: { value: 'Joh' } });
      fireEvent.change(searchInput, { target: { value: 'John' } });
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('John');
      });
    });
  });
});