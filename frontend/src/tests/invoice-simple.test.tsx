import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InvoicePreview } from '../components/invoices/InvoicePreview';
import { PaymentForm } from '../components/invoices/PaymentForm';
import { PDFGenerator } from '../components/invoices/PDFGenerator';

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    setTextColor: jest.fn(),
    line: jest.fn(),
    splitTextToSize: jest.fn(() => ['line1', 'line2']),
    autoTable: jest.fn(),
    output: jest.fn(() => new Blob()),
    save: jest.fn(),
    internal: {
      pageSize: {
        width: 210,
        height: 297,
      },
    },
    lastAutoTable: {
      finalY: 100,
    },
  }));
});

// Mock data
const mockInvoiceWithDetails = {
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
      quantity: 2,
      unit_price: 750,
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

describe('Invoice Components - Unit Tests', () => {
  describe('InvoicePreview Component', () => {
    test('renders invoice preview with basic information', () => {
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      // Check basic invoice information
      expect(screen.getByText('Invoice Preview')).toBeInTheDocument();
      expect(screen.getByText('Invoice #INV-202501-0001')).toBeInTheDocument();
      expect(screen.getByText('$1500.00')).toBeInTheDocument();
    });

    test('displays customer information correctly', () => {
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      // Check customer details
      expect(screen.getByText('Bill To:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Phone: +1234567890')).toBeInTheDocument();
      expect(screen.getByText('Email: john@example.com')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, City')).toBeInTheDocument();
    });

    test('shows pricing configuration', () => {
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      // Check pricing details
      expect(screen.getByText('$2500.00')).toBeInTheDocument(); // gold price
      expect(screen.getByText('10%')).toBeInTheDocument(); // labor cost
      expect(screen.getByText('15%')).toBeInTheDocument(); // profit
      expect(screen.getByText('9%')).toBeInTheDocument(); // VAT
    });

    test('displays invoice items with calculations', () => {
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      // Check item details
      expect(screen.getByText('Gold Ring')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // quantity
      expect(screen.getByText('5.500')).toBeInTheDocument(); // weight
      expect(screen.getByText('11.000')).toBeInTheDocument(); // total weight (5.5 * 2)
      expect(screen.getByText('$750.00')).toBeInTheDocument(); // unit price
      expect(screen.getByText('$1500.00')).toBeInTheDocument(); // total price
    });

    test('shows payment history when available', () => {
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      // Check payment history
      expect(screen.getByText('Payment History')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument(); // payment amount
      expect(screen.getByText('cash')).toBeInTheDocument(); // payment method
      expect(screen.getByText('Partial payment')).toBeInTheDocument(); // description
    });

    test('displays correct status badge', () => {
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

      // Check totals section
      expect(screen.getByText('Total Weight:')).toBeInTheDocument();
      expect(screen.getByText('11.000g')).toBeInTheDocument(); // 5.5 * 2
      expect(screen.getByText('Total Amount:')).toBeInTheDocument();
      expect(screen.getByText('Paid Amount:')).toBeInTheDocument();
      expect(screen.getByText('Remaining:')).toBeInTheDocument();
      expect(screen.getByText('$1000.00')).toBeInTheDocument(); // remaining amount
    });

    test('handles missing customer gracefully', () => {
      const invoiceWithoutCustomer = {
        ...mockInvoiceWithDetails,
        customer: undefined,
      };

      render(
        <TestWrapper>
          <InvoicePreview invoice={invoiceWithoutCustomer} />
        </TestWrapper>
      );

      expect(screen.getByText('Customer information not available')).toBeInTheDocument();
    });

    test('calls onPrint when print button is clicked', () => {
      const mockOnPrint = jest.fn();
      
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoiceWithDetails} onPrint={mockOnPrint} />
        </TestWrapper>
      );

      const printButton = screen.getByText('Print');
      fireEvent.click(printButton);

      expect(mockOnPrint).toHaveBeenCalledTimes(1);
    });
  });

  describe('PaymentForm Component', () => {
    test('renders payment form with invoice details', () => {
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} />
        </TestWrapper>
      );

      // Check form elements
      expect(screen.getByText('Add Payment')).toBeInTheDocument();
      expect(screen.getByText('Invoice: INV-202501-0001')).toBeInTheDocument();
      expect(screen.getByText('Remaining Amount: $1000.00')).toBeInTheDocument();
      
      // Check form fields
      expect(screen.getByLabelText(/payment amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    test('pre-fills amount with remaining amount', () => {
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} />
        </TestWrapper>
      );

      const amountInput = screen.getByLabelText(/payment amount/i) as HTMLInputElement;
      expect(amountInput.value).toBe('1000');
    });

    test('sets maximum payment amount to remaining amount', () => {
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} />
        </TestWrapper>
      );

      const amountInput = screen.getByLabelText(/payment amount/i);
      expect(amountInput).toHaveAttribute('max', '1000');
    });

    test('displays payment method options', () => {
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} />
        </TestWrapper>
      );

      // Click payment method dropdown
      const paymentMethodSelect = screen.getByRole('combobox');
      fireEvent.click(paymentMethodSelect);

      // Check for payment method options
      expect(screen.getByText('Cash')).toBeInTheDocument();
      expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument();
      expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
      expect(screen.getByText('Check')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    test('calculates remaining amount after payment', () => {
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} />
        </TestWrapper>
      );

      // Change payment amount
      const amountInput = screen.getByLabelText(/payment amount/i);
      fireEvent.change(amountInput, { target: { value: '300' } });

      // Check remaining amount calculation
      expect(screen.getByText('$700.00')).toBeInTheDocument(); // 1000 - 300 = 700
    });

    test('shows payment summary', () => {
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} />
        </TestWrapper>
      );

      // Check payment summary section
      expect(screen.getByText('Invoice Total:')).toBeInTheDocument();
      expect(screen.getByText('$1500.00')).toBeInTheDocument();
      expect(screen.getByText('Already Paid:')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument();
      expect(screen.getByText('Current Payment:')).toBeInTheDocument();
      expect(screen.getByText('Remaining After Payment:')).toBeInTheDocument();
    });

    test('calls onCancel when cancel button is clicked', () => {
      const mockOnCancel = jest.fn();
      
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('PDFGenerator Component', () => {
    test('renders PDF generator button', () => {
      render(
        <TestWrapper>
          <PDFGenerator invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      expect(screen.getByText('Generate PDF')).toBeInTheDocument();
    });

    test('generates PDF when button is clicked', () => {
      const mockOnGenerated = jest.fn();
      
      render(
        <TestWrapper>
          <PDFGenerator invoice={mockInvoiceWithDetails} onGenerated={mockOnGenerated} />
        </TestWrapper>
      );

      const generateButton = screen.getByText('Generate PDF');
      fireEvent.click(generateButton);

      // PDF generation should be called
      expect(mockOnGenerated).toHaveBeenCalledWith(expect.any(Blob));
    });
  });

  describe('Component Props and Callbacks', () => {
    test('InvoicePreview handles missing onGeneratePDF prop', () => {
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      // Should render without errors even without onGeneratePDF prop
      expect(screen.getByText('Invoice Preview')).toBeInTheDocument();
    });

    test('PaymentForm handles missing onSuccess prop', () => {
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} />
        </TestWrapper>
      );

      // Should render without errors even without onSuccess prop
      expect(screen.getByText('Add Payment')).toBeInTheDocument();
    });

    test('PDFGenerator uses default company info when not provided', () => {
      render(
        <TestWrapper>
          <PDFGenerator invoice={mockInvoiceWithDetails} />
        </TestWrapper>
      );

      const generateButton = screen.getByText('Generate PDF');
      fireEvent.click(generateButton);

      // Should work with default company info
      expect(generateButton).toBeInTheDocument();
    });
  });
});