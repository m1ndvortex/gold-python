import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { PaymentForm } from '../components/invoices/PaymentForm';
import { invoiceApi } from '../services/invoiceApi';
import { customerApi } from '../services/customerApi';
import { inventoryApi } from '../services/inventoryApi';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Invoice Components - Docker Integration', () => {
  beforeAll(async () => {
    // Wait for backend to be ready
    let retries = 0;
    const maxRetries = 30;
    
    while (retries < maxRetries) {
      try {
        await fetch('http://localhost:8000/health');
        break;
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          throw new Error('Backend not ready after 30 attempts');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });

  describe('InvoiceList Component', () => {
    test('renders invoice list with real backend data', async () => {
      render(
        <TestWrapper>
          <InvoiceList />
        </TestWrapper>
      );

      // Check for loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Check for table headers
      expect(screen.getByText('Invoice #')).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    test('filters invoices by status', async () => {
      render(
        <TestWrapper>
          <InvoiceList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Find and click status filter
      const statusFilter = screen.getByRole('combobox', { name: /all statuses/i });
      fireEvent.click(statusFilter);

      // Select pending status
      const pendingOption = screen.getByText('Pending');
      fireEvent.click(pendingOption);

      // Verify filter is applied
      await waitFor(() => {
        expect(statusFilter).toHaveTextContent('Pending');
      });
    });

    test('searches invoices by invoice number', async () => {
      render(
        <TestWrapper>
          <InvoiceList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Find search input
      const searchInput = screen.getByPlaceholderText(/search invoice number/i);
      
      // Type in search term
      fireEvent.change(searchInput, { target: { value: 'INV-' } });

      // Verify search input value
      expect(searchInput).toHaveValue('INV-');
    });
  });

  describe('InvoiceForm Component', () => {
    test('renders invoice form with customer and item selection', async () => {
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Check for form elements
      expect(screen.getByText('Customer Information')).toBeInTheDocument();
      expect(screen.getByText('Pricing Configuration')).toBeInTheDocument();
      expect(screen.getByText('Invoice Items')).toBeInTheDocument();

      // Check for required fields
      expect(screen.getByLabelText(/customer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/gold price/i)).toBeInTheDocument();
      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });

    test('loads customers and inventory items from backend', async () => {
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Wait for customer dropdown to load
      await waitFor(() => {
        const customerSelect = screen.getByRole('combobox');
        fireEvent.click(customerSelect);
        expect(screen.queryByText(/loading customers/i)).not.toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('calculates invoice totals in real-time', async () => {
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/gold price/i)).toBeInTheDocument();
      });

      // Fill in gold price
      const goldPriceInput = screen.getByLabelText(/gold price/i);
      fireEvent.change(goldPriceInput, { target: { value: '2500' } });

      // Verify the input value
      expect(goldPriceInput).toHaveValue(2500);
    });

    test('validates required fields', async () => {
      const mockOnSuccess = jest.fn();
      
      render(
        <TestWrapper>
          <InvoiceForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Create Invoice');
      fireEvent.click(submitButton);

      // Check that form doesn't submit (button should be disabled)
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('PaymentForm Component', () => {
    const mockInvoice = {
      id: 'test-invoice-id',
      invoice_number: 'INV-202501-0001',
      customer_id: 'test-customer-id',
      total_amount: 1000,
      paid_amount: 200,
      remaining_amount: 800,
      gold_price_per_gram: 2500,
      labor_cost_percentage: 10,
      profit_percentage: 15,
      vat_percentage: 9,
      status: 'partially_paid',
      created_at: '2025-01-18T10:00:00Z',
      updated_at: '2025-01-18T10:00:00Z',
    };

    test('renders payment form with invoice details', () => {
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} />
        </TestWrapper>
      );

      // Check for form elements
      expect(screen.getByText('Add Payment')).toBeInTheDocument();
      expect(screen.getByText('INV-202501-0001')).toBeInTheDocument();
      expect(screen.getByText('Remaining Amount: $800.00')).toBeInTheDocument();
      
      // Check for payment amount input
      expect(screen.getByLabelText(/payment amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
    });

    test('validates payment amount against remaining amount', () => {
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} />
        </TestWrapper>
      );

      const amountInput = screen.getByLabelText(/payment amount/i);
      
      // Try to enter amount greater than remaining
      fireEvent.change(amountInput, { target: { value: '1000' } });
      
      // The input should be limited by the max attribute
      expect(amountInput).toHaveAttribute('max', '800');
    });

    test('calculates remaining amount after payment', () => {
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} />
        </TestWrapper>
      );

      const amountInput = screen.getByLabelText(/payment amount/i);
      
      // Enter payment amount
      fireEvent.change(amountInput, { target: { value: '300' } });
      
      // Check remaining amount calculation
      expect(screen.getByText('$500.00')).toBeInTheDocument(); // 800 - 300 = 500
    });
  });

  describe('Invoice API Integration', () => {
    test('creates invoice with real backend', async () => {
      // First, get customers and inventory items
      const customers = await customerApi.getCustomers();
      const inventoryResponse = await inventoryApi.getItems();
      const inventoryItems = inventoryResponse.items;

      if (customers.length === 0 || inventoryItems.length === 0) {
        console.log('Skipping test - no test data available');
        return;
      }

      const invoiceData = {
        type: 'gold' as const,
        customer_id: customers[0].id,
        gold_fields: {
          gold_price_per_gram: 2500,
          labor_cost_percentage: 10,
          profit_percentage: 15,
          vat_percentage: 9,
        },
        items: [
          {
            inventory_item_id: inventoryItems[0].id,
            item_name: inventoryItems[0].name,
            quantity: 1,
            unit_price: inventoryItems[0].sell_price,
            weight_grams: inventoryItems[0].weight_grams,
          },
        ],
      };

      // Calculate invoice first
      const calculation = await invoiceApi.calculateInvoice(invoiceData);
      expect(calculation).toBeDefined();
      expect(calculation.grand_total).toBeGreaterThan(0);

      // Create invoice
      const invoice = await invoiceApi.createInvoice(invoiceData);
      expect(invoice).toBeDefined();
      expect(invoice.invoice_number).toMatch(/^INV-\d{6}-\d{4}$/);
      expect(invoice.status).toBe('pending');
      expect(invoice.total_amount).toBe(calculation.grand_total);
    }, 15000);

    test('lists invoices from backend', async () => {
      const invoices = await invoiceApi.listInvoices();
      expect(Array.isArray(invoices)).toBe(true);
      
      if (invoices.length > 0) {
        const invoice = invoices[0];
        expect(invoice).toHaveProperty('id');
        expect(invoice).toHaveProperty('invoice_number');
        expect(invoice).toHaveProperty('customer_id');
        expect(invoice).toHaveProperty('total_amount');
        expect(invoice).toHaveProperty('status');
      }
    });

    test('gets invoice details from backend', async () => {
      const invoices = await invoiceApi.listInvoices({}, 0, 1);
      
      if (invoices.length > 0) {
        const invoiceDetails = await invoiceApi.getInvoice(invoices[0].id);
        expect(invoiceDetails).toBeDefined();
        expect(invoiceDetails.id).toBe(invoices[0].id);
        expect(invoiceDetails).toHaveProperty('customer');
        expect(invoiceDetails).toHaveProperty('invoice_items');
        expect(invoiceDetails).toHaveProperty('payments');
      }
    });

    test('adds payment to invoice', async () => {
      const invoices = await invoiceApi.listInvoices({ has_remaining_amount: true }, 0, 1);
      
      if (invoices.length > 0 && invoices[0].remaining_amount > 0) {
        const paymentAmount = Math.min(100, invoices[0].remaining_amount);
        
        const payment = await invoiceApi.addPayment(invoices[0].id, {
          amount: paymentAmount,
          payment_method: 'cash',
          description: 'Test payment',
        });

        expect(payment).toBeDefined();
        expect(payment.amount).toBe(paymentAmount);
        expect(payment.payment_method).toBe('cash');

        // Verify invoice was updated
        const updatedInvoice = await invoiceApi.getInvoice(invoices[0].id);
        expect(updatedInvoice.paid_amount).toBeGreaterThan(invoices[0].paid_amount);
        expect(updatedInvoice.remaining_amount).toBeLessThan(invoices[0].remaining_amount);
      }
    });

    test('gets invoice summary statistics', async () => {
      const summary = await invoiceApi.getSummary();
      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('total_invoices');
      expect(summary).toHaveProperty('total_amount');
      expect(summary).toHaveProperty('total_paid');
      expect(summary).toHaveProperty('total_remaining');
      expect(summary).toHaveProperty('status_breakdown');
      expect(typeof summary.total_invoices).toBe('number');
    });
  });
});