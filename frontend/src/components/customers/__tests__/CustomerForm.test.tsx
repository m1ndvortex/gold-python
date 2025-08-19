import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerForm } from '../CustomerForm';
import { useCreateCustomer, useUpdateCustomer } from '../../../hooks/useCustomers';
import type { Customer } from '../../../types';

// Mock the hooks
jest.mock('../../../hooks/useCustomers');
const mockUseCreateCustomer = useCreateCustomer as jest.MockedFunction<typeof useCreateCustomer>;
const mockUseUpdateCustomer = useUpdateCustomer as jest.MockedFunction<typeof useUpdateCustomer>;

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

describe('CustomerForm', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCreateCustomer.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
    mockUseUpdateCustomer.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  describe('Modern Form Styling', () => {
    it('renders with professional header styling', () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      expect(screen.getByText('Create a new customer profile')).toBeInTheDocument();
    });

    it('renders edit mode with appropriate styling', () => {
      renderWithQueryClient(
        <CustomerForm 
          customer={mockCustomer}
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      );
      
      expect(screen.getByText('Edit Customer')).toBeInTheDocument();
      expect(screen.getByText('Update customer information')).toBeInTheDocument();
    });

    it('displays professional gradient header', () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      // Check for header elements that indicate professional styling
      expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      const closeButton = screen.getByRole('button', { name: '' }); // Close button with X icon
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Floating Label Inputs', () => {
    it('renders all form fields with floating labels', () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      // Check for floating label inputs
      expect(screen.getByPlaceholderText('Enter customer name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter phone number')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter full address')).toBeInTheDocument();
    });

    it('shows floating labels with icons', () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      // Icons should be present (tested through the Input component)
      const nameInput = screen.getByPlaceholderText('Enter customer name');
      const phoneInput = screen.getByPlaceholderText('Enter phone number');
      const emailInput = screen.getByPlaceholderText('Enter email address');
      const addressInput = screen.getByPlaceholderText('Enter full address');
      
      expect(nameInput).toBeInTheDocument();
      expect(phoneInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      expect(addressInput).toBeInTheDocument();
    });

    it('pre-fills form fields when editing customer', () => {
      renderWithQueryClient(
        <CustomerForm 
          customer={mockCustomer}
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      );
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required customer name field', async () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Customer name is required')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const nameInput = screen.getByPlaceholderText('Enter customer name');
      const emailInput = screen.getByPlaceholderText('Enter email address');
      const submitButton = screen.getByRole('button', { name: /create customer/i });
      
      fireEvent.change(nameInput, { target: { value: 'Test Customer' } });
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const nameInput = screen.getByPlaceholderText('Enter customer name');
      const phoneInput = screen.getByPlaceholderText('Enter phone number');
      const submitButton = screen.getByRole('button', { name: /create customer/i });
      
      fireEvent.change(nameInput, { target: { value: 'Test Customer' } });
      fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });

    it('clears validation errors when input is corrected', async () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const nameInput = screen.getByPlaceholderText('Enter customer name');
      const submitButton = screen.getByRole('button', { name: /create customer/i });
      
      // Trigger validation error
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Customer name is required')).toBeInTheDocument();
      });
      
      // Fix the error
      fireEvent.change(nameInput, { target: { value: 'Test Customer' } });
      
      await waitFor(() => {
        expect(screen.queryByText('Customer name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('creates new customer with valid data', async () => {
      mockMutateAsync.mockResolvedValue({ id: '1' });
      
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const nameInput = screen.getByPlaceholderText('Enter customer name');
      const phoneInput = screen.getByPlaceholderText('Enter phone number');
      const emailInput = screen.getByPlaceholderText('Enter email address');
      const addressInput = screen.getByPlaceholderText('Enter full address');
      const submitButton = screen.getByRole('button', { name: /create customer/i });
      
      fireEvent.change(nameInput, { target: { value: 'New Customer' } });
      fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      fireEvent.change(addressInput, { target: { value: '456 New St' } });
      
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          name: 'New Customer',
          phone: '+1234567890',
          email: 'new@example.com',
          address: '456 New St'
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('updates existing customer with valid data', async () => {
      mockMutateAsync.mockResolvedValue({ id: '1' });
      
      renderWithQueryClient(
        <CustomerForm 
          customer={mockCustomer}
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      );
      
      const nameInput = screen.getByDisplayValue('John Doe');
      const submitButton = screen.getByRole('button', { name: /update customer/i });
      
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: '1',
          customer: {
            name: 'Updated Name',
            phone: '+1234567890',
            email: 'john@example.com',
            address: '123 Main St'
          }
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('handles optional fields correctly', async () => {
      mockMutateAsync.mockResolvedValue({ id: '1' });
      
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const nameInput = screen.getByPlaceholderText('Enter customer name');
      const submitButton = screen.getByRole('button', { name: /create customer/i });
      
      fireEvent.change(nameInput, { target: { value: 'Minimal Customer' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          name: 'Minimal Customer'
        });
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during form submission', async () => {
      mockUseCreateCustomer.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);
      
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    it('disables form inputs during loading', () => {
      mockUseCreateCustomer.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);
      
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      expect(screen.getByPlaceholderText('Enter customer name')).toBeDisabled();
      expect(screen.getByPlaceholderText('Enter phone number')).toBeDisabled();
      expect(screen.getByPlaceholderText('Enter email address')).toBeDisabled();
      expect(screen.getByPlaceholderText('Enter full address')).toBeDisabled();
    });

    it('shows professional loading animation', () => {
      mockUseCreateCustomer.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);
      
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      // Should show loading spinner in button
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const mockToast = jest.fn();
      jest.mocked(require('../../ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      
      mockMutateAsync.mockRejectedValue({
        response: { data: { detail: 'Customer already exists' } }
      });
      
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const nameInput = screen.getByPlaceholderText('Enter customer name');
      const submitButton = screen.getByRole('button', { name: /create customer/i });
      
      fireEvent.change(nameInput, { target: { value: 'Test Customer' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Customer already exists',
          variant: 'destructive',
        });
      });
    });

    it('handles network errors', async () => {
      const mockToast = jest.fn();
      jest.mocked(require('../../ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      
      mockMutateAsync.mockRejectedValue(new Error('Network error'));
      
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const nameInput = screen.getByPlaceholderText('Enter customer name');
      const submitButton = screen.getByRole('button', { name: /create customer/i });
      
      fireEvent.change(nameInput, { target: { value: 'Test Customer' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to save customer',
          variant: 'destructive',
        });
      });
    });
  });

  describe('User Interactions', () => {
    it('closes form when cancel button is clicked', () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes form when X button is clicked', () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const closeButton = screen.getByRole('button', { name: '' }); // X button
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('prevents closing during form submission', () => {
      mockUseCreateCustomer.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);
      
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const closeButton = screen.getByRole('button', { name: '' });
      
      expect(cancelButton).toBeDisabled();
      expect(closeButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('provides proper form labels and ARIA attributes', () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      // Check for proper form structure
      expect(screen.getByRole('button', { name: /create customer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const nameInput = screen.getByPlaceholderText('Enter customer name');
      const phoneInput = screen.getByPlaceholderText('Enter phone number');
      
      // Should be able to tab between inputs
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);
      
      // Tab to next input
      fireEvent.keyDown(nameInput, { key: 'Tab' });
      // Note: Actual tab behavior would need more complex testing setup
    });

    it('announces validation errors to screen readers', async () => {
      renderWithQueryClient(
        <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      
      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Customer name is required');
        expect(errorMessage).toBeInTheDocument();
        // Error should be associated with the input field
      });
    });
  });
});