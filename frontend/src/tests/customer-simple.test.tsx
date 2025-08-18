import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CustomerList } from '../components/customers/CustomerList';
import { CustomerForm } from '../components/customers/CustomerForm';

// Simple test setup
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock the customer API
jest.mock('../services/customerApi', () => ({
  customerApi: {
    getCustomers: jest.fn(() => Promise.resolve([
      {
        id: '1',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        address: '123 Main St',
        total_purchases: 500.00,
        current_debt: 100.00,
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
        total_purchases: 750.00,
        current_debt: 0.00,
        last_purchase_date: '2024-01-10',
        created_at: '2024-01-01',
        updated_at: '2024-01-10'
      }
    ])),
    searchCustomers: jest.fn(() => Promise.resolve([])),
    createCustomer: jest.fn(() => Promise.resolve({
      id: '3',
      name: 'New Customer',
      phone: '+1555123456',
      email: 'new@example.com',
      address: '789 Pine St',
      total_purchases: 0.00,
      current_debt: 0.00,
      last_purchase_date: null,
      created_at: '2024-01-20',
      updated_at: '2024-01-20'
    })),
    updateCustomer: jest.fn(() => Promise.resolve({})),
    deleteCustomer: jest.fn(() => Promise.resolve()),
  }
}));

describe('Customer Components - Simple Tests', () => {
  beforeEach(() => {
    // Set up auth token for tests
    localStorage.setItem('access_token', 'test-token');
  });

  afterEach(() => {
    localStorage.removeItem('access_token');
    jest.clearAllMocks();
  });

  describe('CustomerList Component', () => {
    test('renders customer list with basic information', async () => {
      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Check if header is rendered
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Manage customer information and track purchase history')).toBeInTheDocument();

      // Check if add customer button is present
      expect(screen.getByText('Add Customer')).toBeInTheDocument();

      // Wait for customer data to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check customer details
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    test('displays debt status correctly', async () => {
      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // John Doe has debt
      expect(screen.getByText('Has Debt')).toBeInTheDocument();
      
      // Jane Smith has no debt
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    test('search input is functional', async () => {
      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search customers by name, phone, or email...');
      expect(searchInput).toBeInTheDocument();

      // Test typing in search
      fireEvent.change(searchInput, { target: { value: 'John' } });
      expect(searchInput).toHaveValue('John');
    });

    test('filter controls are present', async () => {
      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Check for filter controls
      expect(screen.getByText('All Customers')).toBeInTheDocument();
      expect(screen.getByText('Newest First')).toBeInTheDocument();
    });

    test('opens customer form when add button clicked', async () => {
      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      const addButton = screen.getByText('Add Customer');
      fireEvent.click(addButton);

      // Should open customer form
      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      });
    });
  });

  describe('CustomerForm Component', () => {
    test('renders form fields correctly', () => {
      const mockOnClose = jest.fn();
      const mockOnSuccess = jest.fn();

      render(
        <TestWrapper>
          <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Check form title
      expect(screen.getByText('Add New Customer')).toBeInTheDocument();

      // Check form fields
      expect(screen.getByLabelText('Customer Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Address')).toBeInTheDocument();

      // Check buttons
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    test('validates required fields', async () => {
      const mockOnClose = jest.fn();
      const mockOnSuccess = jest.fn();

      render(
        <TestWrapper>
          <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Try to submit without filling required fields
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Customer name is required')).toBeInTheDocument();
      });
    });

    test('validates email format', async () => {
      const mockOnClose = jest.fn();
      const mockOnSuccess = jest.fn();

      render(
        <TestWrapper>
          <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Fill name (required) and invalid email
      const nameInput = screen.getByLabelText('Customer Name *');
      const emailInput = screen.getByLabelText('Email Address');

      fireEvent.change(nameInput, { target: { value: 'Test Customer' } });
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      // Should show email validation error
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('calls onClose when cancel button clicked', () => {
      const mockOnClose = jest.fn();
      const mockOnSuccess = jest.fn();

      render(
        <TestWrapper>
          <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('calls onClose when X button clicked', () => {
      const mockOnClose = jest.fn();
      const mockOnSuccess = jest.fn();

      render(
        <TestWrapper>
          <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('shows edit mode for existing customer', () => {
      const mockOnClose = jest.fn();
      const mockOnSuccess = jest.fn();
      const existingCustomer = {
        id: '1',
        name: 'Existing Customer',
        phone: '+1234567890',
        email: 'existing@example.com',
        address: '123 Test St',
        total_purchases: 100.00,
        current_debt: 50.00,
        last_purchase_date: '2024-01-01',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      render(
        <TestWrapper>
          <CustomerForm 
            customer={existingCustomer}
            onClose={mockOnClose} 
            onSuccess={mockOnSuccess} 
          />
        </TestWrapper>
      );

      // Should show edit mode
      expect(screen.getByText('Edit Customer')).toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();

      // Fields should be pre-filled
      expect(screen.getByDisplayValue('Existing Customer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('existing@example.com')).toBeInTheDocument();
    });

    test('form inputs update correctly', () => {
      const mockOnClose = jest.fn();
      const mockOnSuccess = jest.fn();

      render(
        <TestWrapper>
          <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText('Customer Name *');
      const phoneInput = screen.getByLabelText('Phone Number');
      const emailInput = screen.getByLabelText('Email Address');
      const addressInput = screen.getByLabelText('Address');

      // Test input changes
      fireEvent.change(nameInput, { target: { value: 'Test Name' } });
      fireEvent.change(phoneInput, { target: { value: '+1555123456' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(addressInput, { target: { value: '123 Test Address' } });

      expect(nameInput).toHaveValue('Test Name');
      expect(phoneInput).toHaveValue('+1555123456');
      expect(emailInput).toHaveValue('test@example.com');
      expect(addressInput).toHaveValue('123 Test Address');
    });

    test('clears validation errors when input is corrected', async () => {
      const mockOnClose = jest.fn();
      const mockOnSuccess = jest.fn();

      render(
        <TestWrapper>
          <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Trigger validation error
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Customer name is required')).toBeInTheDocument();
      });

      // Fix the error
      const nameInput = screen.getByLabelText('Customer Name *');
      fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Customer name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    test('customer list and form work together', async () => {
      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Wait for list to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Open add form
      const addButton = screen.getByText('Add Customer');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      });

      // Close form
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Should return to list
      await waitFor(() => {
        expect(screen.queryByText('Add New Customer')).not.toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('displays loading state correctly', () => {
      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeTruthy();
    });
  });
});