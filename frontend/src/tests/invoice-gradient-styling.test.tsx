import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Invoices } from '../pages/Invoices';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { EnhancedInvoiceForm } from '../components/invoices/EnhancedInvoiceForm';
import { InvoicePreview } from '../components/invoices/InvoicePreview';
import { PaymentForm } from '../components/invoices/PaymentForm';
import { PDFGenerator } from '../components/invoices/PDFGenerator';

// Mock the hooks
jest.mock('../hooks/useInvoices', () => ({
  useInvoices: () => ({
    data: [
      {
        id: '1',
        invoice_number: 'INV-001',
        customer_id: 'customer-1',
        total_amount: 1000,
        paid_amount: 500,
        remaining_amount: 500,
        status: 'partially_paid',
        created_at: '2024-01-01T00:00:00Z',
        gold_price_per_gram: 50,
        labor_cost_percentage: 10,
        profit_percentage: 15,
        vat_percentage: 9
      }
    ],
    isLoading: false,
    error: null
  }),
  useInvoiceSummary: () => ({
    data: {
      total_invoices: 10,
      total_amount: 10000,
      total_paid: 7000,
      total_remaining: 3000
    }
  }),
  useInvoice: () => ({
    data: {
      id: '1',
      invoice_number: 'INV-001',
      customer_id: 'customer-1',
      total_amount: 1000,
      paid_amount: 500,
      remaining_amount: 500,
      status: 'partially_paid',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      gold_price_per_gram: 50,
      labor_cost_percentage: 10,
      profit_percentage: 15,
      vat_percentage: 9,
      customer: {
        id: 'customer-1',
        name: 'John Doe',
        phone: '123-456-7890',
        email: 'john@example.com',
        current_debt: 100,
        total_purchases: 5000,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_purchase_date: '2024-01-01'
      },
      invoice_items: [
        {
          id: 'item-1',
          invoice_id: '1',
          inventory_item_id: 'inv-1',
          quantity: 1,
          weight_grams: 10,
          unit_price: 500,
          total_price: 500,
          inventory_item: {
            id: 'inv-1',
            name: 'Gold Ring',
            category_id: 'cat-1',
            weight_grams: 10,
            purchase_price: 400,
            sell_price: 500,
            stock_quantity: 5,
            min_stock_level: 1,
            description: 'Beautiful gold ring',
            image_url: null,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      ],
      payments: []
    }
  }),
  useDeleteInvoice: () => ({
    mutate: jest.fn()
  }),
  useCalculateInvoice: () => ({
    mutate: jest.fn(),
    isPending: false
  }),
  useCreateInvoice: () => ({
    mutate: jest.fn(),
    isPending: false
  }),
  useAddPayment: () => ({
    mutate: jest.fn(),
    isPending: false
  })
}));

jest.mock('../hooks/useCustomers', () => ({
  useCustomers: () => ({
    data: [
      {
        id: 'customer-1',
        name: 'John Doe',
        phone: '123-456-7890',
        email: 'john@example.com',
        current_debt: 100,
        total_purchases: 5000
      }
    ],
    isLoading: false
  })
}));

jest.mock('../hooks/useInventory', () => ({
  useInventoryItems: () => ({
    data: {
      items: [
        {
          id: 'inv-1',
          name: 'Gold Ring',
          description: 'Beautiful gold ring',
          weight_grams: 10,
          stock_quantity: 5,
          is_active: true
        }
      ]
    },
    isLoading: false
  })
}));

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    setTextColor: jest.fn(),
    splitTextToSize: jest.fn(() => ['line1']),
    autoTable: jest.fn(),
    line: jest.fn(),
    output: jest.fn(() => new Blob()),
    save: jest.fn(),
    internal: {
      pageSize: {
        width: 210,
        height: 297
      }
    },
    lastAutoTable: {
      finalY: 100
    }
  }));
});

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Invoice Components Gradient Styling', () => {
  describe('Invoices Page', () => {
    it('should render main page with gradient styling', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Check for gradient header icon
      const headerIcon = document.querySelector('.bg-gradient-to-br.from-green-500.to-green-600');
      expect(headerIcon).toBeInTheDocument();

      // Check for gradient create button
      const createButton = screen.getByText('Create New Invoice');
      expect(createButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');

      // Wait for summary cards to load
      await waitFor(() => {
        // Check for gradient summary cards
        const totalInvoicesCard = document.querySelector('.bg-gradient-to-br.from-blue-50.to-indigo-100\\/50');
        expect(totalInvoicesCard).toBeInTheDocument();

        const totalValueCard = document.querySelector('.bg-gradient-to-br.from-emerald-50.to-teal-100\\/50');
        expect(totalValueCard).toBeInTheDocument();

        const paymentsCard = document.querySelector('.bg-gradient-to-br.from-green-50.to-emerald-100\\/50');
        expect(paymentsCard).toBeInTheDocument();

        const outstandingCard = document.querySelector('.bg-gradient-to-br.from-amber-50.to-orange-100\\/50');
        expect(outstandingCard).toBeInTheDocument();
      });

      // Check for gradient tab navigation
      const tabContainer = document.querySelector('.bg-gradient-to-r.from-green-50.via-teal-50.to-blue-50');
      expect(tabContainer).toBeInTheDocument();
    });

    it('should render analytics tab with gradient styling', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Click analytics tab
      const analyticsTab = screen.getByText('Analytics & Reports');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        // Check for gradient coming soon cards
        const revenueCard = document.querySelector('.bg-gradient-to-br.from-emerald-50.to-teal-100\\/30');
        expect(revenueCard).toBeInTheDocument();

        const paymentCard = document.querySelector('.bg-gradient-to-br.from-blue-50.to-indigo-100\\/30');
        expect(paymentCard).toBeInTheDocument();

        const profitCard = document.querySelector('.bg-gradient-to-br.from-purple-50.to-violet-100\\/30');
        expect(profitCard).toBeInTheDocument();
      });
    });
  });

  describe('InvoiceList Component', () => {
    it('should render with gradient styling', () => {
      render(
        <TestWrapper>
          <InvoiceList />
        </TestWrapper>
      );

      // Check for gradient filter card
      const filterCard = document.querySelector('.bg-gradient-to-r.from-slate-50.to-slate-100\\/80');
      expect(filterCard).toBeInTheDocument();

      // Check for gradient filter icon
      const filterIcon = document.querySelector('.bg-gradient-to-br.from-slate-500.to-slate-600');
      expect(filterIcon).toBeInTheDocument();

      // Check for gradient create button
      const createButton = screen.getByText('Create Invoice');
      expect(createButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
    });

    it('should render status badges with gradient styling', async () => {
      render(
        <TestWrapper>
          <InvoiceList />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for gradient status badge
        const statusBadge = document.querySelector('.bg-gradient-to-r.from-amber-100.to-orange-100');
        expect(statusBadge).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedInvoiceForm Component', () => {
    it('should render with gradient styling', () => {
      render(
        <TestWrapper>
          <EnhancedInvoiceForm />
        </TestWrapper>
      );

      // Check for gradient customer card
      const customerCard = document.querySelector('.bg-gradient-to-br.from-blue-50.to-indigo-100\\/50');
      expect(customerCard).toBeInTheDocument();

      // Check for gradient pricing card
      const pricingCard = document.querySelector('.bg-gradient-to-br.from-emerald-50.to-teal-100\\/50');
      expect(pricingCard).toBeInTheDocument();

      // Check for gradient items card
      const itemsCard = document.querySelector('.bg-gradient-to-br.from-purple-50.to-violet-100\\/50');
      expect(itemsCard).toBeInTheDocument();

      // Check for gradient add item button
      const addButton = screen.getByText('Add Item');
      expect(addButton).toHaveClass('bg-gradient-to-r', 'from-purple-500', 'to-violet-600');
    });
  });

  describe('InvoicePreview Component', () => {
    const mockInvoice = {
      id: '1',
      invoice_number: 'INV-001',
      customer_id: 'customer-1',
      total_amount: 1000,
      paid_amount: 500,
      remaining_amount: 500,
      status: 'partially_paid',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      gold_price_per_gram: 50,
      labor_cost_percentage: 10,
      profit_percentage: 15,
      vat_percentage: 9,
      customer: {
        id: 'customer-1',
        name: 'John Doe',
        phone: '123-456-7890',
        email: 'john@example.com',
        current_debt: 100,
        total_purchases: 5000,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_purchase_date: '2024-01-01'
      },
      invoice_items: [
        {
          id: 'item-1',
          invoice_id: '1',
          inventory_item_id: 'inv-1',
          quantity: 1,
          weight_grams: 10,
          unit_price: 500,
          total_price: 500,
          inventory_item: {
            id: 'inv-1',
            name: 'Gold Ring',
            category_id: 'cat-1',
            weight_grams: 10,
            purchase_price: 400,
            sell_price: 500,
            stock_quantity: 5,
            min_stock_level: 1,
            description: 'Beautiful gold ring',
            image_url: null,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      ],
      payments: []
    };

    it('should render with gradient styling', () => {
      render(
        <TestWrapper>
          <InvoicePreview invoice={mockInvoice} />
        </TestWrapper>
      );

      // Check for gradient header background
      const headerBg = document.querySelector('.bg-gradient-to-r.from-slate-50.to-slate-100\\/80');
      expect(headerBg).toBeInTheDocument();

      // Check for gradient status badge
      const statusBadge = document.querySelector('.bg-gradient-to-r.from-amber-100.to-orange-100');
      expect(statusBadge).toBeInTheDocument();
    });
  });

  describe('PaymentForm Component', () => {
    const mockInvoice = {
      id: '1',
      invoice_number: 'INV-001',
      customer_id: 'customer-1',
      total_amount: 1000,
      paid_amount: 500,
      remaining_amount: 500,
      status: 'partially_paid',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      gold_price_per_gram: 50,
      labor_cost_percentage: 10,
      profit_percentage: 15,
      vat_percentage: 9
    };

    it('should render with gradient styling', () => {
      render(
        <TestWrapper>
          <PaymentForm invoice={mockInvoice} />
        </TestWrapper>
      );

      // Check for gradient card background
      const card = document.querySelector('.bg-gradient-to-br.from-amber-50.to-orange-100\\/50');
      expect(card).toBeInTheDocument();

      // Check for gradient icon
      const icon = document.querySelector('.bg-gradient-to-br.from-amber-500.to-orange-600');
      expect(icon).toBeInTheDocument();

      // Check for gradient payment summary
      const summary = document.querySelector('.bg-gradient-to-r.from-amber-100\\/50.to-orange-100\\/50');
      expect(summary).toBeInTheDocument();

      // Check for gradient submit button
      const submitButton = screen.getByText('Add Payment');
      expect(submitButton).toHaveClass('bg-gradient-to-r', 'from-amber-500', 'to-orange-600');
    });
  });

  describe('PDFGenerator Component', () => {
    const mockInvoice = {
      id: '1',
      invoice_number: 'INV-001',
      customer_id: 'customer-1',
      total_amount: 1000,
      paid_amount: 500,
      remaining_amount: 500,
      status: 'partially_paid',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      gold_price_per_gram: 50,
      labor_cost_percentage: 10,
      profit_percentage: 15,
      vat_percentage: 9,
      customer: {
        id: 'customer-1',
        name: 'John Doe',
        phone: '123-456-7890',
        email: 'john@example.com',
        current_debt: 100,
        total_purchases: 5000,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_purchase_date: '2024-01-01'
      },
      invoice_items: [
        {
          id: 'item-1',
          invoice_id: '1',
          inventory_item_id: 'inv-1',
          quantity: 1,
          weight_grams: 10,
          unit_price: 500,
          total_price: 500,
          inventory_item: {
            id: 'inv-1',
            name: 'Gold Ring',
            category_id: 'cat-1',
            weight_grams: 10,
            purchase_price: 400,
            sell_price: 500,
            stock_quantity: 5,
            min_stock_level: 1,
            description: 'Beautiful gold ring',
            image_url: null,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      ],
      payments: []
    };

    it('should render with gradient styling', () => {
      render(
        <TestWrapper>
          <PDFGenerator invoice={mockInvoice} />
        </TestWrapper>
      );

      // Check for gradient button
      const pdfButton = screen.getByText('Generate PDF');
      expect(pdfButton).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600');
    });
  });

  describe('Gradient Color Consistency', () => {
    it('should use consistent gradient patterns across components', () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Check for consistent green-teal gradient usage
      const greenTealElements = document.querySelectorAll('.from-green-500.to-teal-600');
      expect(greenTealElements.length).toBeGreaterThan(0);

      // Check for consistent blue-indigo gradient usage
      const blueIndigoElements = document.querySelectorAll('.from-blue-500.to-indigo-600');
      expect(blueIndigoElements.length).toBeGreaterThan(0);

      // Check for consistent shadow usage
      const shadowElements = document.querySelectorAll('.shadow-lg');
      expect(shadowElements.length).toBeGreaterThan(0);
    });
  });

  describe('Interactive Elements', () => {
    it('should have proper hover effects on gradient buttons', () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      const createButton = screen.getByText('Create New Invoice');
      expect(createButton).toHaveClass('hover:from-green-600', 'hover:to-teal-700');
      expect(createButton).toHaveClass('hover:shadow-xl');
      expect(createButton).toHaveClass('transition-all', 'duration-300');
    });

    it('should have proper card hover effects', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        const cards = document.querySelectorAll('.hover\\:shadow-xl');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility and Contrast', () => {
    it('should maintain proper text contrast with gradient backgrounds', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check that text colors are properly set for gradient backgrounds
        const blueText = document.querySelector('.text-blue-700');
        expect(blueText).toBeInTheDocument();

        const emeraldText = document.querySelector('.text-emerald-700');
        expect(emeraldText).toBeInTheDocument();

        const greenText = document.querySelector('.text-green-700');
        expect(greenText).toBeInTheDocument();

        const amberText = document.querySelector('.text-amber-700');
        expect(amberText).toBeInTheDocument();
      });
    });
  });
});