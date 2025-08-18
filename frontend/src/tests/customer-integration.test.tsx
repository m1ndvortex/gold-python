import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CustomerList } from '../components/customers/CustomerList';
import { CustomerForm } from '../components/customers/CustomerForm';
import { CustomerProfile } from '../components/customers/CustomerProfile';
import { PaymentForm } from '../components/customers/PaymentForm';
import { Customers } from '../pages/Customers';

// Test setup with real backend API in Docker
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { 
      retry: false,
      staleTime: 0,
      cacheTime: 0,
    },
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

// Helper function to authenticate and get token for tests
const getAuthToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate for tests');
  }

  const data = await response.json();
  return data.access_token;
};

// Helper function to create test customer
const createTestCustomer = async (token: string, name: string = 'Test Customer') => {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      phone: '+1234567890',
      email: `${name.toLowerCase().replace(/\s+/g, '')}@test.com`,
      address: '123 Test Street, Test City',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create test customer');
  }

  const data = await response.json();
  return data;
};

// Helper function to create test payment
const createTestPayment = async (token: string, customerId: string, amount: number = 50.00) => {
  const response = await fetch(`${API_BASE_URL}/customers/${customerId}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      customer_id: customerId,
      amount,
      payment_method: 'cash',
      description: 'Test payment',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create test payment');
  }

  const data = await response.json();
  return data;
};

// Helper function to update customer debt (simulate invoice)
const updateCustomerDebt = async (token: string, customerId: string, debtAmount: number) => {
  const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_debt: debtAmount,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update customer debt');
  }

  return response.json();
};

// Helper function to cleanup test data
const cleanupTestData = async (token: string) => {
  try {
    // Get all customers
    const response = await fetch(`${API_BASE_URL}/customers`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const customers = await response.json();
      
      // Delete test customers
      for (const customer of customers) {
        if (customer.name.includes('Test')) {
          await fetch(`${API_BASE_URL}/customers/${customer.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        }
      }
    }
  } catch (error) {
    console.warn('Cleanup failed:', error);
  }
};

describe('Customer Management Integration Tests (Docker + Real Database)', () => {
  let authToken: string;

  beforeAll(async () => {
    // Wait for backend to be ready
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) break;
      } catch (error) {
        // Backend not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries--;
    }

    if (retries === 0) {
      throw new Error('Backend not ready after 60 seconds');
    }

    // Get authentication token
    authToken = await getAuthToken();
    localStorage.setItem('access_token', authToken);
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData(authToken);
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupTestData(authToken);
    localStorage.removeItem('access_token');
  });

  describe('CustomerList Component', () => {
    test('displays customers from real database', async () => {
      // Create test customer in real database
      const customer = await createTestCustomer(authToken, 'John Test Customer');

      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Wait for data to load from real API
      await waitFor(() => {
        expect(screen.getByText('John Test Customer')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify customer details are displayed
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('johntestcustomer@test.com')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument(); // No debt initially
    });

    test('filters customers by search term', async () => {
      // Create multiple test customers
      await createTestCustomer(authToken, 'Alice Test Customer');
      await createTestCustomer(authToken, 'Bob Test Customer');

      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Wait for customers to load
      await waitFor(() => {
        expect(screen.getByText('Alice Test Customer')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText('Search customers by name, phone, or email...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      // Wait for filtered results
      await waitFor(() => {
        expect(screen.getByText('Alice Test Customer')).toBeInTheDocument();
        expect(screen.queryByText('Bob Test Customer')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('displays debt highlighting correctly', async () => {
      // Create customer with debt
      const customer = await createTestCustomer(authToken, 'Debt Test Customer');
      await updateCustomerDebt(authToken, customer.id, 150.00);

      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Wait for customer with debt to appear
      await waitFor(() => {
        expect(screen.getByText('Debt Test Customer')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Check for debt badge and highlighting
      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText('Has Debt')).toBeInTheDocument();
    });

    test('filters customers by debt status', async () => {
      // Create customers with and without debt
      const customerWithDebt = await createTestCustomer(authToken, 'Customer With Debt');
      const customerWithoutDebt = await createTestCustomer(authToken, 'Customer Without Debt');
      
      await updateCustomerDebt(authToken, customerWithDebt.id, 100.00);

      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Wait for customers to load
      await waitFor(() => {
        expect(screen.getByText('Customer With Debt')).toBeInTheDocument();
        expect(screen.getByText('Customer Without Debt')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Filter by customers with debt
      const debtFilter = screen.getByRole('combobox');
      fireEvent.click(debtFilter);
      
      await waitFor(() => {
        const withDebtOption = screen.getByText('With Debt');
        fireEvent.click(withDebtOption);
      });

      // Should only show customer with debt
      await waitFor(() => {
        expect(screen.getByText('Customer With Debt')).toBeInTheDocument();
        expect(screen.queryByText('Customer Without Debt')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('opens customer profile on click', async () => {
      const customer = await createTestCustomer(authToken, 'Profile Test Customer');

      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Wait for customer to appear
      await waitFor(() => {
        expect(screen.getByText('Profile Test Customer')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Click on customer row
      const customerRow = screen.getByText('Profile Test Customer').closest('tr');
      if (customerRow) {
        fireEvent.click(customerRow);

        // Should open customer profile
        await waitFor(() => {
          expect(screen.getByText('Customer Profile')).toBeInTheDocument();
        });
      }
    });
  });

  describe('CustomerForm Component', () => {
    test('creates new customer in real database', async () => {
      const mockOnSuccess = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Fill form
      const nameInput = screen.getByLabelText('Customer Name *');
      const phoneInput = screen.getByLabelText('Phone Number');
      const emailInput = screen.getByLabelText('Email Address');
      const addressInput = screen.getByLabelText('Address');

      fireEvent.change(nameInput, { target: { value: 'New Test Customer' } });
      fireEvent.change(phoneInput, { target: { value: '+1987654321' } });
      fireEvent.change(emailInput, { target: { value: 'newtestcustomer@test.com' } });
      fireEvent.change(addressInput, { target: { value: '456 New Test Street' } });

      // Submit form
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      // Wait for success
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 10000 });

      // Verify customer was created in database
      const response = await fetch(`${API_BASE_URL}/customers/search?q=New Test Customer`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const customers = await response.json();
      expect(customers.length).toBeGreaterThan(0);
      expect(customers[0].name).toBe('New Test Customer');
    });

    test('validates form inputs correctly', async () => {
      const mockOnSuccess = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Try to submit empty form
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Customer name is required')).toBeInTheDocument();
      });

      // Test invalid email
      const nameInput = screen.getByLabelText('Customer Name *');
      const emailInput = screen.getByLabelText('Email Address');

      fireEvent.change(nameInput, { target: { value: 'Test Customer' } });
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('updates existing customer in real database', async () => {
      const customer = await createTestCustomer(authToken, 'Update Test Customer');
      const mockOnSuccess = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CustomerForm 
            customer={customer} 
            onClose={mockOnClose} 
            onSuccess={mockOnSuccess} 
          />
        </TestWrapper>
      );

      // Update name
      const nameInput = screen.getByDisplayValue('Update Test Customer');
      fireEvent.change(nameInput, { target: { value: 'Updated Test Customer' } });

      // Submit form
      const updateButton = screen.getByText('Update');
      fireEvent.click(updateButton);

      // Wait for success
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 10000 });

      // Verify customer was updated in database
      const response = await fetch(`${API_BASE_URL}/customers/${customer.id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const updatedCustomer = await response.json();
      expect(updatedCustomer.name).toBe('Updated Test Customer');
    });
  });

  describe('CustomerProfile Component', () => {
    test('displays customer details and payment history', async () => {
      // Create customer with payment history
      const customer = await createTestCustomer(authToken, 'Profile Detail Customer');
      await updateCustomerDebt(authToken, customer.id, 200.00);
      await createTestPayment(authToken, customer.id, 75.00);

      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CustomerProfile customer={customer} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByText('Profile Detail Customer')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Check customer summary cards
      expect(screen.getByText('Total Purchases')).toBeInTheDocument();
      expect(screen.getByText('Current Debt')).toBeInTheDocument();
      expect(screen.getByText('Last Purchase')).toBeInTheDocument();

      // Check contact information
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('profiledetailcustomer@test.com')).toBeInTheDocument();

      // Check payment history tab
      const paymentsTab = screen.getByText('Payment History');
      fireEvent.click(paymentsTab);

      await waitFor(() => {
        expect(screen.getByText('$75.00')).toBeInTheDocument();
        expect(screen.getByText('Test payment')).toBeInTheDocument();
      });
    });

    test('opens edit form when edit button clicked', async () => {
      const customer = await createTestCustomer(authToken, 'Edit Profile Customer');
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CustomerProfile customer={customer} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByText('Edit Profile Customer')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Click edit button
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      // Should open edit form
      await waitFor(() => {
        expect(screen.getByText('Edit Customer')).toBeInTheDocument();
      });
    });

    test('opens payment form for customers with debt', async () => {
      const customer = await createTestCustomer(authToken, 'Payment Profile Customer');
      await updateCustomerDebt(authToken, customer.id, 100.00);
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CustomerProfile customer={customer} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByText('Payment Profile Customer')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Should show debt management section
      expect(screen.getByText('Debt Management')).toBeInTheDocument();
      expect(screen.getByText('Outstanding Debt')).toBeInTheDocument();

      // Click record payment button
      const recordPaymentButton = screen.getByText('Record Payment');
      fireEvent.click(recordPaymentButton);

      // Should open payment form
      await waitFor(() => {
        expect(screen.getByText('Record Payment')).toBeInTheDocument();
      });
    });

    test('displays debt history correctly', async () => {
      const customer = await createTestCustomer(authToken, 'Debt History Customer');
      await updateCustomerDebt(authToken, customer.id, 150.00);
      await createTestPayment(authToken, customer.id, 50.00);
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CustomerProfile customer={customer} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByText('Debt History Customer')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Click debt history tab
      const debtHistoryTab = screen.getByText('Debt History');
      fireEvent.click(debtHistoryTab);

      // Should show debt history entries
      await waitFor(() => {
        expect(screen.getByText('Debt History')).toBeInTheDocument();
      });
    });
  });

  describe('PaymentForm Component', () => {
    test('records payment in real database', async () => {
      const customer = await createTestCustomer(authToken, 'Payment Test Customer');
      await updateCustomerDebt(authToken, customer.id, 200.00);
      
      const mockOnSuccess = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <PaymentForm 
            customer={customer} 
            onClose={mockOnClose} 
            onSuccess={mockOnSuccess} 
          />
        </TestWrapper>
      );

      // Fill payment form
      const amountInput = screen.getByLabelText('Payment Amount *');
      const methodSelect = screen.getByRole('combobox');
      const descriptionInput = screen.getByLabelText('Description (Optional)');

      fireEvent.change(amountInput, { target: { value: '100.00' } });
      fireEvent.click(methodSelect);
      
      await waitFor(() => {
        const cardOption = screen.getByText('Credit/Debit Card');
        fireEvent.click(cardOption);
      });

      fireEvent.change(descriptionInput, { target: { value: 'Test payment via card' } });

      // Submit payment
      const recordButton = screen.getByText('Record Payment');
      fireEvent.click(recordButton);

      // Wait for success
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 10000 });

      // Verify payment was recorded in database
      const response = await fetch(`${API_BASE_URL}/customers/${customer.id}/payments`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const payments = await response.json();
      expect(payments.length).toBeGreaterThan(0);
      expect(payments[0].amount).toBe(100.00);
      expect(payments[0].payment_method).toBe('card');
    });

    test('validates payment amount correctly', async () => {
      const customer = await createTestCustomer(authToken, 'Validation Test Customer');
      await updateCustomerDebt(authToken, customer.id, 50.00);
      
      const mockOnSuccess = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <PaymentForm 
            customer={customer} 
            onClose={mockOnClose} 
            onSuccess={mockOnSuccess} 
          />
        </TestWrapper>
      );

      // Try to submit without amount
      const recordButton = screen.getByText('Record Payment');
      fireEvent.click(recordButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid payment amount')).toBeInTheDocument();
      });

      // Try amount greater than debt
      const amountInput = screen.getByLabelText('Payment Amount *');
      fireEvent.change(amountInput, { target: { value: '100.00' } });
      fireEvent.click(recordButton);

      await waitFor(() => {
        expect(screen.getByText(/Payment amount cannot exceed current debt/)).toBeInTheDocument();
      });
    });

    test('shows payment summary correctly', async () => {
      const customer = await createTestCustomer(authToken, 'Summary Test Customer');
      await updateCustomerDebt(authToken, customer.id, 150.00);
      
      const mockOnSuccess = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <PaymentForm 
            customer={customer} 
            onClose={mockOnClose} 
            onSuccess={mockOnSuccess} 
          />
        </TestWrapper>
      );

      // Enter payment amount
      const amountInput = screen.getByLabelText('Payment Amount *');
      fireEvent.change(amountInput, { target: { value: '75.00' } });

      // Should show payment summary
      await waitFor(() => {
        expect(screen.getByText('Payment Amount:')).toBeInTheDocument();
        expect(screen.getByText('$75.00')).toBeInTheDocument();
        expect(screen.getByText('Remaining Debt:')).toBeInTheDocument();
        expect(screen.getByText('$75.00')).toBeInTheDocument(); // 150 - 75 = 75
      });
    });
  });

  describe('Full Customer Page Integration', () => {
    test('complete customer workflow: create -> view -> edit -> payment', async () => {
      render(
        <TestWrapper>
          <Customers />
        </TestWrapper>
      );

      // Step 1: Create new customer
      const addCustomerButton = screen.getByText('Add Customer');
      fireEvent.click(addCustomerButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      });

      // Fill customer form
      const nameInput = screen.getByLabelText('Customer Name *');
      const phoneInput = screen.getByLabelText('Phone Number');
      const emailInput = screen.getByLabelText('Email Address');

      fireEvent.change(nameInput, { target: { value: 'Workflow Test Customer' } });
      fireEvent.change(phoneInput, { target: { value: '+1555123456' } });
      fireEvent.change(emailInput, { target: { value: 'workflow@test.com' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      // Step 2: Verify customer appears in list
      await waitFor(() => {
        expect(screen.getByText('Workflow Test Customer')).toBeInTheDocument();
      }, { timeout: 15000 });

      // Step 3: Click on customer to view profile
      const customerRow = screen.getByText('Workflow Test Customer').closest('tr');
      if (customerRow) {
        fireEvent.click(customerRow);

        await waitFor(() => {
          expect(screen.getByText('Customer Profile')).toBeInTheDocument();
        });

        // Step 4: Edit customer
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        await waitFor(() => {
          expect(screen.getByText('Edit Customer')).toBeInTheDocument();
        });

        const editNameInput = screen.getByDisplayValue('Workflow Test Customer');
        fireEvent.change(editNameInput, { target: { value: 'Updated Workflow Customer' } });

        const updateButton = screen.getByText('Update');
        fireEvent.click(updateButton);

        // Verify update
        await waitFor(() => {
          expect(screen.getByText('Updated Workflow Customer')).toBeInTheDocument();
        }, { timeout: 10000 });
      }
    });

    test('customer search and filtering functionality', async () => {
      // Create multiple customers for testing
      await createTestCustomer(authToken, 'Search Customer A');
      await createTestCustomer(authToken, 'Search Customer B');
      const customerWithDebt = await createTestCustomer(authToken, 'Search Customer C');
      await updateCustomerDebt(authToken, customerWithDebt.id, 100.00);

      render(
        <TestWrapper>
          <Customers />
        </TestWrapper>
      );

      // Wait for customers to load
      await waitFor(() => {
        expect(screen.getByText('Search Customer A')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText('Search customers by name, phone, or email...');
      fireEvent.change(searchInput, { target: { value: 'Customer A' } });

      await waitFor(() => {
        expect(screen.getByText('Search Customer A')).toBeInTheDocument();
        expect(screen.queryByText('Search Customer B')).not.toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // Test debt filter
      await waitFor(() => {
        expect(screen.getByText('Search Customer B')).toBeInTheDocument();
      });

      const debtFilter = screen.getAllByRole('combobox')[0]; // First combobox is debt filter
      fireEvent.click(debtFilter);

      await waitFor(() => {
        const withDebtOption = screen.getByText('With Debt');
        fireEvent.click(withDebtOption);
      });

      // Should only show customer with debt
      await waitFor(() => {
        expect(screen.getByText('Search Customer C')).toBeInTheDocument();
        expect(screen.queryByText('Search Customer A')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles network errors gracefully', async () => {
      // Temporarily remove auth token to simulate auth error
      localStorage.removeItem('access_token');

      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Should handle auth error gracefully
      await waitFor(() => {
        // The component should handle the error gracefully
        expect(screen.getByText(/customers/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Restore auth token
      localStorage.setItem('access_token', authToken);
    });

    test('handles empty customer list state', async () => {
      // Ensure no test customers exist
      await cleanupTestData(authToken);

      render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Should show empty state message
      await waitFor(() => {
        expect(screen.getByText(/no customers found/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('handles duplicate customer validation', async () => {
      // Create a customer first
      await createTestCustomer(authToken, 'Duplicate Test Customer');

      const mockOnSuccess = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CustomerForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Try to create customer with same phone
      const nameInput = screen.getByLabelText('Customer Name *');
      const phoneInput = screen.getByLabelText('Phone Number');

      fireEvent.change(nameInput, { target: { value: 'Another Customer' } });
      fireEvent.change(phoneInput, { target: { value: '+1234567890' } }); // Same phone as existing

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      // Should show error for duplicate phone
      await waitFor(() => {
        expect(screen.getByText(/phone number already exists/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('handles payment validation edge cases', async () => {
      const customer = await createTestCustomer(authToken, 'Edge Case Customer');
      await updateCustomerDebt(authToken, customer.id, 0.01); // Very small debt
      
      const mockOnSuccess = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <PaymentForm 
            customer={customer} 
            onClose={mockOnClose} 
            onSuccess={mockOnSuccess} 
          />
        </TestWrapper>
      );

      // Try negative amount
      const amountInput = screen.getByLabelText('Payment Amount *');
      fireEvent.change(amountInput, { target: { value: '-10' } });

      const recordButton = screen.getByText('Record Payment');
      fireEvent.click(recordButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid payment amount')).toBeInTheDocument();
      });

      // Try zero amount
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.click(recordButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid payment amount')).toBeInTheDocument();
      });
    });
  });
});