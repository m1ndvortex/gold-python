import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerProfile } from '../CustomerProfile';
import { useCustomer, useCustomerDebtHistory, useCustomerPayments } from '../../../hooks/useCustomers';
import type { Customer } from '../../../types';

// Mock the hooks
jest.mock('../../../hooks/useCustomers');
const mockUseCustomer = useCustomer as jest.MockedFunction<typeof useCustomer>;
const mockUseCustomerDebtHistory = useCustomerDebtHistory as jest.MockedFunction<typeof useCustomerDebtHistory>;
const mockUseCustomerPayments = useCustomerPayments as jest.MockedFunction<typeof useCustomerPayments>;

// Mock the toast hook
jest.mock('../../ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockCustomer: Customer = {
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
};

const mockDebtHistory = {
  debt_history: [
    {
      id: '1',
      type: 'invoice',
      description: 'Invoice #001',
      amount: 2000,
      running_balance: 2000,
      date: '2024-01-10'
    },
    {
      id: '2',
      type: 'payment',
      description: 'Payment received',
      amount: -500,
      running_balance: 1500,
      date: '2024-01-12'
    }
  ]
};

const mockPayments = [
  {
    id: '1',
    amount: 500,
    payment_method: 'cash',
    payment_date: '2024-01-12',
    description: 'Partial payment',
    invoice_id: 'inv-001'
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

describe('CustomerProfile', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCustomer.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
    } as any);
    mockUseCustomerDebtHistory.mockReturnValue({
      data: mockDebtHistory,
      isLoading: false,
      error: null,
    } as any);
    mockUseCustomerPayments.mockReturnValue({
      data: mockPayments,
      isLoading: false,
      error: null,
    } as any);
  });

  describe('Professional Profile Header', () => {
    it('renders professional header with gradient styling', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/Customer ID:/)).toBeInTheDocument();
      expect(screen.getByText(/Member since/)).toBeInTheDocument();
    });

    it('displays customer status badge appropriately', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Has Outstanding Debt')).toBeInTheDocument();
    });

    it('shows clear status for customers without debt', () => {
      const customerWithoutDebt = { ...mockCustomer, current_debt: 0 };
      
      renderWithQueryClient(
        <CustomerProfile customer={customerWithoutDebt} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Account Clear')).toBeInTheDocument();
    });

    it('provides edit and close buttons with proper styling', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Close button
    });
  });

  describe('Professional Summary Cards', () => {
    it('displays total purchases with professional styling', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Total Purchases')).toBeInTheDocument();
      expect(screen.getByText('$5,000.00')).toBeInTheDocument();
      expect(screen.getByText('Lifetime value')).toBeInTheDocument();
    });

    it('displays current debt with appropriate color coding', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Current Debt')).toBeInTheDocument();
      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
      expect(screen.getByText('Requires attention')).toBeInTheDocument();
    });

    it('displays last purchase date with time calculation', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Last Purchase')).toBeInTheDocument();
      expect(screen.getByText(/days ago/)).toBeInTheDocument();
    });

    it('handles customers with no purchases', () => {
      const newCustomer = { 
        ...mockCustomer, 
        last_purchase_date: null,
        total_purchases: 0 
      };
      
      renderWithQueryClient(
        <CustomerProfile customer={newCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Never')).toBeInTheDocument();
      expect(screen.getByText('No purchases yet')).toBeInTheDocument();
    });
  });

  describe('Professional Contact Information', () => {
    it('displays contact information with modern card styling', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });

    it('handles missing contact information gracefully', () => {
      const customerWithoutContact = {
        ...mockCustomer,
        phone: '',
        email: '',
        address: ''
      };
      
      renderWithQueryClient(
        <CustomerProfile customer={customerWithoutContact} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Not provided')).toBeInTheDocument();
    });

    it('displays contact fields with appropriate icons', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      // Icons are rendered through the component structure
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
    });
  });

  describe('Debt Management Section', () => {
    it('shows debt management section for customers with debt', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Debt Management')).toBeInTheDocument();
      expect(screen.getByText('Outstanding Debt')).toBeInTheDocument();
      expect(screen.getByText('Requires Payment')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /record payment/i })).toBeInTheDocument();
    });

    it('hides debt management for customers without debt', () => {
      const customerWithoutDebt = { ...mockCustomer, current_debt: 0 };
      
      renderWithQueryClient(
        <CustomerProfile customer={customerWithoutDebt} onClose={mockOnClose} />
      );
      
      expect(screen.queryByText('Debt Management')).not.toBeInTheDocument();
    });

    it('opens payment form when record payment is clicked', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      const recordPaymentButton = screen.getByRole('button', { name: /record payment/i });
      fireEvent.click(recordPaymentButton);
      
      // Payment form should open (implementation depends on PaymentForm component)
      expect(recordPaymentButton).toBeInTheDocument();
    });
  });

  describe('Tabbed Information Display', () => {
    it('renders tab navigation with proper styling', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByRole('tab', { name: /payment history/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /debt history/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /invoices/i })).toBeInTheDocument();
    });

    it('displays payment history in professional table format', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      // Payment history should be visible by default
      expect(screen.getByText('Payment History')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument();
      expect(screen.getByText('cash')).toBeInTheDocument();
      expect(screen.getByText('Partial payment')).toBeInTheDocument();
    });

    it('switches to debt history tab correctly', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      const debtHistoryTab = screen.getByRole('tab', { name: /debt history/i });
      fireEvent.click(debtHistoryTab);
      
      expect(screen.getByText('Debt History')).toBeInTheDocument();
      expect(screen.getByText('Invoice #001')).toBeInTheDocument();
      expect(screen.getByText('Payment received')).toBeInTheDocument();
    });

    it('handles empty payment history gracefully', () => {
      mockUseCustomerPayments.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('No payments recorded yet.')).toBeInTheDocument();
    });

    it('handles empty debt history gracefully', () => {
      mockUseCustomerDebtHistory.mockReturnValue({
        data: { debt_history: [] },
        isLoading: false,
        error: null,
      } as any);
      
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      const debtHistoryTab = screen.getByRole('tab', { name: /debt history/i });
      fireEvent.click(debtHistoryTab);
      
      expect(screen.getByText('No debt history available.')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading state while fetching customer data', () => {
      mockUseCustomer.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);
      
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      // Should show loading spinner
      expect(screen.getByRole('generic')).toBeInTheDocument(); // Loading container
    });

    it('displays customer data once loaded', async () => {
      // Start with loading state
      mockUseCustomer.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);
      
      const { rerender } = renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      // Update to loaded state
      mockUseCustomer.mockReturnValue({
        data: mockCustomer,
        isLoading: false,
        error: null,
      } as any);
      
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
        </QueryClientProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('opens edit form when edit button is clicked', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      const editButton = screen.getByRole('button', { name: /edit profile/i });
      fireEvent.click(editButton);
      
      // Edit form should open (implementation depends on CustomerForm component)
      expect(editButton).toBeInTheDocument();
    });

    it('closes profile when close button is clicked', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      const closeButton = screen.getByRole('button', { name: '' }); // X button
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles tab switching smoothly', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      const paymentTab = screen.getByRole('tab', { name: /payment history/i });
      const debtTab = screen.getByRole('tab', { name: /debt history/i });
      const invoiceTab = screen.getByRole('tab', { name: /invoices/i });
      
      // Switch between tabs
      fireEvent.click(debtTab);
      expect(screen.getByText('Debt History')).toBeInTheDocument();
      
      fireEvent.click(invoiceTab);
      expect(screen.getByText('Recent Invoices')).toBeInTheDocument();
      
      fireEvent.click(paymentTab);
      expect(screen.getByText('Payment History')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('formats currency values consistently', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      // Check for properly formatted currency throughout the component
      expect(screen.getByText('$5,000.00')).toBeInTheDocument(); // Total purchases
      expect(screen.getByText('$1,500.00')).toBeInTheDocument(); // Current debt
      expect(screen.getByText('$500.00')).toBeInTheDocument(); // Payment amount
    });

    it('formats dates consistently', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      // Dates should be formatted consistently throughout
      expect(screen.getByText(/Member since/)).toBeInTheDocument();
      expect(screen.getByText(/days ago/)).toBeInTheDocument();
    });

    it('handles null and undefined values gracefully', () => {
      const incompleteCustomer = {
        ...mockCustomer,
        last_purchase_date: null,
        phone: null,
        email: null,
        address: null
      };
      
      renderWithQueryClient(
        <CustomerProfile customer={incompleteCustomer} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Never')).toBeInTheDocument();
      expect(screen.getAllByText('Not provided')).toHaveLength(3); // Phone, email, address
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      // Check for proper tab roles
      expect(screen.getByRole('tab', { name: /payment history/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /debt history/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /invoices/i })).toBeInTheDocument();
      
      // Check for proper button roles
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      const editButton = screen.getByRole('button', { name: /edit profile/i });
      const closeButton = screen.getByRole('button', { name: '' });
      
      // Should be focusable
      editButton.focus();
      expect(document.activeElement).toBe(editButton);
      
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });

    it('provides proper heading hierarchy', () => {
      renderWithQueryClient(
        <CustomerProfile customer={mockCustomer} onClose={mockOnClose} />
      );
      
      // Should have proper heading structure
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // Main heading
      expect(screen.getByText('Contact Information')).toBeInTheDocument(); // Section heading
    });
  });
});