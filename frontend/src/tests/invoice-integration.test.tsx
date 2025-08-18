import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Invoices } from '../pages/Invoices';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { InvoicePreview } from '../components/invoices/InvoicePreview';

// Mock data
const mockInvoice = {
  id: 'test-invoice-1',
  invoice_number: 'INV-202501-0001',
  customer_id: 'customer-1',
  total_amount: 1500.00,
  paid_amount: 500.00,
  remaining_amount: 1000.00,
  gold_price_per_gram: 2500,
  labor_cost_percentage: 10,
  profit_percentage: 15,
  vat_percentage: 9,
  status: 'partially_paid',
  created_at: '2025-01-18T10:00:00Z',
  updated_at: '2025-01-18T10:00:00Z',
};

const mockInvoiceWithDetails = {
  ...mockInvoice,
  customer: {
    id: 'customer-1',
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    address: '123 Main St, City',
    total_purchases: 5000,
    current_debt: 1000,
    last_purchase_date: '2025-01-18T10:00:00Z',
    created_at: '2025-01-18T09:00:00Z',
    updated_at: '2025-01-18T10:00:00Z',
  },
  invoice_items: [
    {
      id: 'item-1',
      invoice_id: 'test-invoice-1',
      inventory_item_id: 'inventory-1',
      quantity: 1,
      unit_price: 1500,
      total_price: 1500,
      weight_grams: 5.5,
      inventory_item: {
        id: 'inventory-1',
        name: 'Gold Ring',
        category_id: 'cat-1',
        weight_grams: 5.5,
        purchase_price: 1200,
        sell_price: 1500,
        stock_quantity: 10,
        min_stock_level: 2,
        description: 'Beautiful gold ring',
        image_url: null,
        is_active: true,
        created_at: '2025-01-18T08:00:00Z',
        updated_at: '2025-01-18T08:00:00Z',
      },
    },
  ],
  payments: [
    {
      id: 'payment-1',
      customer_id: 'customer-1',
      invoice_id: 'test-invoice-1',
      amount: 500,
      payment_method: 'cash',
      description: 'Partial payment',
      payment_date: '2025-01-18T11:00:00Z',
      created_at: '2025-01-18T11:00:00Z',
    },
  ],
};

// Mock API calls
jest.mock('../services/invoiceApi', () => ({
  invoiceApi: {
    listInvoices: jest.fn(() => Promise.resolve([mockInvoice])),
    getInvoice: jest.fn(() => Promise.resolve(mockInvoiceWithDetails)),
    getSummary: jest.fn(() => Promise.resolve({
      total_invoices: 5,
      total_amount: 7500,
      total_paid: 2500,
      total_remaining: 5000,
      status_breakdown: {
        pending: 2,
        partially_paid: 2,
        paid: 1,
      },
      average_invoice_amount: 1500,
    })),
    calculateInvoice: jest.fn(() => Promise.resolve({
      items: [],
      subtotal: 1375,
      total_labor_cost: 137.5,
      total_profit: 227.25,
      total_vat: 157.77,
      grand_total: 1500,
    })),
    createInvoice: jest.fn(() => Promise.resolve(mockInvoiceWithDetails)),
    addPayment: jest.fn(() => Promise.resolve({
      id: 'payment-2',
      customer_id: 'customer-1',
      invoice_id: 'test-invoice-1',
      amount: 300,
      payment_method: 'cash',
      description: 'Additional payment',
      payment_date: '2025-01-18T12:00:00Z',
      created_at: '2025-01-18T12:00:00Z',
    })),
    deleteInvoice: jest.fn(() => Promise.resolve({ message: 'Invoice deleted' })),
  },
}));

jest.mock('../services/customerApi', () => ({
  customerApi: {
    getCustomers: jest.fn(() => Promise.resolve([
      {
        id: 'customer-1',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        address: '123 Main St',
        total_purchases: 5000,
        current_debt: 1000,
        created_at: '2025-01-18T09:00:00Z',
        updated_at: '2025-01-18T10:00:00Z',
      },
    ])),
  },
}));

jest.mock('../services/inventoryApi', () => ({
  inventoryApi: {
    getInventoryItems: jest.fn(() => Promise.resolve([
      {
        id: 'inventory-1',
        name: 'Gold Ring',
        category_id: 'cat-1',
        weight_grams: 5.5,
        purchase_price: 1200,
        sell_price: 1500,
        stock_quantity: 10,
        min_stock_level: 2,
        is_active: true,
        created_at: '2025-01-18T08:00:00Z',
        updated_at: '2025-01-18T08:00:00Z',
      },
    ])),
  },
}));

// Test wrapper
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

describe('Invoice Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Invoices Page', () => {
    test('renders invoices page with summary cards', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Check page title
      expect(screen.getByText('Invoice Management')).toBeInTheDocument();
      expect(screen.getByText('Create, manage, and track invoices')).toBeInTheDocument();

      // Wait for summary cards to load
      await waitFor(() => {
        expect(screen.getByText('Total Invoices')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // total_invoices
        expect(screen.getByText('Total Amount')).toBeInTheDocument();
        expect(screen.getByText('$7500.00')).toBeInTheDocument(); // total_amount
      });

      // Check for create button
      expect(screen.getByText('Create Invoice')).toBeInTheDocument();
    });

    test('opens create invoice dialog', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Click create invoice button
      const createButton = screen.getByText('Create Invoice');
      fireEvent.click(createButton);

      // Check if dialog opens
      await waitFor(() => {
        expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
      });
    });

    test('displays invoice list', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Wait for invoice list to load
      await waitFor(() => {
        expect(screen.getByText('INV-202501-0001')).toBeInTheDocument();
        expect(screen.getByText('$1500.00')).toBeInTheDocument();
      });
    });
  });

  describe('InvoiceList Component', () => {
    test('renders invoice list with data', async () => {
      render(
        <TestWrapper>
          <InvoiceList />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('INV-202501-0001')).toBeInTheDocument();
        expect(screen.getByText('$1500.00')).toBeInTheDocument();
        expect(screen.getByText('$500.00')).toBeInTheDocument(); // paid amount
        expect(screen.getByText('$1000.00')).toBeInTheDocument(); // remaining
      });

      // Check for table headers
      expect(screen.getByText('Invoice #')).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    test('handles invoice actions', async () => {
      const mockOnView = jest.fn();
      const mockOnEdit = jest.fn();
      const mockOnPayment = jest.fn();

      render(
        <TestWrapper>
          <InvoiceList
            onViewInvoice={mockOnView}
            onEditInvoice={mockOnEdit}
            onAddPayment={mockOnPayment}
          />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('INV-202501-0001')).toBeInTheDocument();
      });

      // Find and click actions menu
      const actionsButton = screen.getByRole('button', { name: /more/i });
      fireEvent.click(actionsButton);

      // Check for action items
      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Add Payment')).toBeInTheDocument();
    });

    test('filters invoices by status', async () => {
      render(
        <TestWrapper>
          <InvoiceList />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('INV-202501-0001')).toBeInTheDocument();
      });

      // Find status filter
      const statusFilter = screen.getByDisplayValue('All Statuses');
      expect(statusFilter).toBeInTheDocument();
    });
  });

  describe('InvoicePreview Component', () => {
    test('renders invoice preview with details', () => {
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      // Check invoice details
      expect(screen.getByText('Invoice Preview')).toBeInTheDocument();
      expect(screen.getByText('Invoice #INV-202501-0001')).toBeInTheDocument();
      expect(screen.getByText('$1500.00')).toBeInTheDocument(); // total amount

      // Check customer info
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Phone: +1234567890')).toBeInTheDocument();

      // Check pricing details
      expect(screen.getByText('$2500.00')).toBeInTheDocument(); // gold price
      expect(screen.getByText('10%')).toBeInTheDocument(); // labor cost

      // Check items
      expect(screen.getByText('Gold Ring')).toBeInTheDocument();
      expect(screen.getByText('5.500')).toBeInTheDocument(); // weight
    });

    test('displays payment history', () => {
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      // Check payment history section
      expect(screen.getByText('Payment History')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument(); // payment amount
      expect(screen.getByText('cash')).toBeInTheDocument(); // payment method
    });

    test('shows correct status badge', () => {
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      // Check status badge
      expect(screen.getByText('Partially Paid')).toBeInTheDocument();
    });

    test('calculates totals correctly', () => {
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      // Check total weight calculation
      expect(screen.getByText('5.500g')).toBeInTheDocument(); // total weight

      // Check remaining amount
      expect(screen.getByText('Remaining: $1000.00')).toBeInTheDocument();
    });
  });

  describe('Invoice Workflow', () => {
    test('complete invoice creation workflow', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Click create invoice
      const createButton = screen.getByText('Create Invoice');
      fireEvent.click(createButton);

      // Wait for form to open
      await waitFor(() => {
        expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
      });

      // Form should have required sections
      expect(screen.getByText('Customer Information')).toBeInTheDocument();
      expect(screen.getByText('Pricing Configuration')).toBeInTheDocument();
      expect(screen.getByText('Invoice Items')).toBeInTheDocument();
    });

    test('invoice payment workflow', async () => {
      const mockOnPayment = jest.fn();

      render(
        <TestWrapper>
          <InvoiceList onAddPayment={mockOnPayment} />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('INV-202501-0001')).toBeInTheDocument();
      });

      // Open actions menu
      const actionsButton = screen.getByRole('button', { name: /more/i });
      fireEvent.click(actionsButton);

      // Click add payment
      const paymentButton = screen.getByText('Add Payment');
      fireEvent.click(paymentButton);

      // Verify callback was called
      expect(mockOnPayment).toHaveBeenCalledWith(mockInvoice);
    });
  });
});