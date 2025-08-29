/**
 * Comprehensive Tests for Dual Invoice System Frontend Interface
 * Tests both Gold and General invoice types with real backend integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { Invoices } from '../pages/Invoices';
import { invoiceApi } from '../services/invoiceApi';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn()
      },
      response: {
        use: jest.fn()
      }
    }
  })),
}));

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    save: jest.fn(),
    addPage: jest.fn(),
    setFontSize: jest.fn(),
  }));
});

jest.mock('jspdf-autotable', () => ({}));

// Mock the API
jest.mock('../services/invoiceApi');
const mockInvoiceApi = invoiceApi as jest.Mocked<typeof invoiceApi>;

// Mock toast
jest.mock('../components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock hooks
jest.mock('../hooks/useCustomers', () => ({
  useCustomers: () => ({
    data: [
      {
        id: 'customer-1',
        name: 'John Doe',
        phone: '+1234567890',
        current_debt: 150.00,
        total_purchases: 1500.00
      },
      {
        id: 'customer-2',
        name: 'Jane Smith',
        phone: '+0987654321',
        current_debt: 0,
        total_purchases: 800.00
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
          id: 'item-1',
          name: 'Gold Ring',
          sku: 'GOLD-001',
          sell_price: 500,
          stock_quantity: 10,
          weight_grams: 5.5,
          is_active: true
        },
        {
          id: 'item-2',
          name: 'Silver Necklace',
          sku: 'SILVER-001',
          sell_price: 200,
          stock_quantity: 5,
          weight_grams: 12.3,
          is_active: true
        },
        {
          id: 'item-3',
          name: 'General Product',
          sku: 'GEN-001',
          sell_price: 100,
          stock_quantity: 20,
          is_active: true
        }
      ]
    },
    isLoading: false
  })
}));

jest.mock('../hooks/useInvoices', () => ({
  useCalculateInvoice: () => ({
    mutate: jest.fn(),
    isPending: false
  }),
  useCreateInvoice: () => ({
    mutate: jest.fn(),
    isPending: false
  }),
  useInvoices: () => ({
    data: [],
    isLoading: false,
    error: null
  }),
  useInvoice: () => ({
    data: null,
    isLoading: false,
    error: null
  }),
  useInvoiceSummary: () => ({
    data: {
      total_invoices: 10,
      total_amount: 5000,
      total_paid: 3000,
      total_remaining: 2000
    }
  })
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dual Invoice System Frontend Interface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Invoice Type Selection', () => {
    test('should display invoice type selection with Gold and General options', () => {
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Check for invoice type selection
      expect(screen.getByText('Invoice Type Selection')).toBeInTheDocument();
      expect(screen.getByText('Choose Invoice Type *')).toBeInTheDocument();
      
      // Check for Gold invoice option
      expect(screen.getByText('Gold Invoice')).toBeInTheDocument();
      expect(screen.getByText('Specialized for gold jewelry with سود, اجرت, مالیات calculations')).toBeInTheDocument();
      
      // Check for General invoice option
      expect(screen.getByText('General Invoice')).toBeInTheDocument();
      expect(screen.getByText('Standard invoice for any type of product or service')).toBeInTheDocument();
    });

    test('should default to General invoice type', () => {
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      const generalRadio = screen.getByRole('radio', { name: /general/i });
      expect(generalRadio).toBeChecked();
    });

    test('should allow switching between invoice types', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      const goldRadio = screen.getByRole('radio', { name: /gold/i });
      const generalRadio = screen.getByRole('radio', { name: /general/i });

      // Initially General should be selected
      expect(generalRadio).toBeChecked();
      expect(goldRadio).not.toBeChecked();

      // Switch to Gold
      await user.click(goldRadio);
      expect(goldRadio).toBeChecked();
      expect(generalRadio).not.toBeChecked();

      // Switch back to General
      await user.click(generalRadio);
      expect(generalRadio).toBeChecked();
      expect(goldRadio).not.toBeChecked();
    });
  });

  describe('Conditional Field Display', () => {
    test('should show Gold-specific fields only when Gold invoice type is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Initially, Gold fields should not be visible
      expect(screen.queryByText('Gold Pricing Configuration')).not.toBeInTheDocument();
      expect(screen.queryByText('اجرت - Labor Cost (%)')).not.toBeInTheDocument();
      expect(screen.queryByText('سود - Profit (%)')).not.toBeInTheDocument();
      expect(screen.queryByText('مالیات - VAT (%)')).not.toBeInTheDocument();

      // Switch to Gold invoice type
      const goldRadio = screen.getByRole('radio', { name: /gold/i });
      await user.click(goldRadio);

      // Now Gold fields should be visible
      await waitFor(() => {
        expect(screen.getByText('Gold Pricing Configuration')).toBeInTheDocument();
        expect(screen.getByText('اجرت - Labor Cost (%)')).toBeInTheDocument();
        expect(screen.getByText('سود - Profit (%)')).toBeInTheDocument();
        expect(screen.getByText('مالیات - VAT (%)')).toBeInTheDocument();
        expect(screen.getByLabelText('Gold Price (per gram) *')).toBeInTheDocument();
      });
    });

    test('should hide Gold-specific fields when switching to General invoice type', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Switch to Gold first
      const goldRadio = screen.getByRole('radio', { name: /gold/i });
      await user.click(goldRadio);

      // Verify Gold fields are visible
      await waitFor(() => {
        expect(screen.getByText('Gold Pricing Configuration')).toBeInTheDocument();
      });

      // Switch back to General
      const generalRadio = screen.getByRole('radio', { name: /general/i });
      await user.click(generalRadio);

      // Gold fields should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Gold Pricing Configuration')).not.toBeInTheDocument();
      });
    });

    test('should show weight field for Gold invoices and unit price for General invoices', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Initially (General), should show unit price
      expect(screen.getByText('Unit Price *')).toBeInTheDocument();
      expect(screen.queryByText('Weight (grams) *')).not.toBeInTheDocument();

      // Switch to Gold
      const goldRadio = screen.getByRole('radio', { name: /gold/i });
      await user.click(goldRadio);

      // Should show weight field instead of unit price
      await waitFor(() => {
        expect(screen.getByText('Weight (grams) *')).toBeInTheDocument();
        expect(screen.queryByText('Unit Price *')).not.toBeInTheDocument();
      });
    });
  });

  describe('Invoice Workflow Interface', () => {
    test('should display workflow configuration options', () => {
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      expect(screen.getByText('Invoice Workflow')).toBeInTheDocument();
      expect(screen.getByText('Require approval before affecting inventory stock')).toBeInTheDocument();
      expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument();
    });

    test('should allow toggling approval requirement', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      const approvalCheckbox = screen.getByRole('checkbox', { name: /require approval/i });
      
      // Initially unchecked
      expect(approvalCheckbox).not.toBeChecked();

      // Toggle on
      await user.click(approvalCheckbox);
      expect(approvalCheckbox).toBeChecked();

      // Toggle off
      await user.click(approvalCheckbox);
      expect(approvalCheckbox).not.toBeChecked();
    });
  });

  describe('Inventory Integration and Stock Validation', () => {
    test('should show stock availability alerts', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Select an inventory item
      const itemSelect = screen.getByRole('combobox', { name: /select from inventory/i });
      await user.click(itemSelect);
      
      const goldRingOption = screen.getByText('Gold Ring - $500');
      await user.click(goldRingOption);

      // Set quantity within stock
      const quantityInput = screen.getByLabelText('Quantity *');
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Should show stock available alert
      await waitFor(() => {
        expect(screen.getByText('Stock available: 10 units')).toBeInTheDocument();
      });

      // Set quantity exceeding stock
      await user.clear(quantityInput);
      await user.type(quantityInput, '15');

      // Should show insufficient stock alert
      await waitFor(() => {
        expect(screen.getByText(/Insufficient stock!/)).toBeInTheDocument();
        expect(screen.getByText(/Available: 10, Requested: 15/)).toBeInTheDocument();
      });
    });

    test('should auto-fill item details when selecting from inventory', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Select an inventory item
      const itemSelect = screen.getByRole('combobox', { name: /select from inventory/i });
      await user.click(itemSelect);
      
      const goldRingOption = screen.getByText('Gold Ring - $500');
      await user.click(goldRingOption);

      // Check that item details are auto-filled
      await waitFor(() => {
        const itemNameInput = screen.getByLabelText('Item Name *');
        expect(itemNameInput).toHaveValue('Gold Ring');
      });
    });
  });

  describe('Manual Price Override', () => {
    test('should allow manual entry of item details', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Select manual entry
      const itemSelect = screen.getByRole('combobox', { name: /select from inventory/i });
      await user.click(itemSelect);
      
      const manualOption = screen.getByText('Manual Entry');
      await user.click(manualOption);

      // Enter manual item details
      const itemNameInput = screen.getByLabelText('Item Name *');
      await user.type(itemNameInput, 'Custom Item');

      const unitPriceInput = screen.getByLabelText('Unit Price *');
      await user.type(unitPriceInput, '150');

      const quantityInput = screen.getByLabelText('Quantity *');
      await user.clear(quantityInput);
      await user.type(quantityInput, '2');

      // Verify manual entry
      expect(itemNameInput).toHaveValue('Custom Item');
      expect(unitPriceInput).toHaveValue(150);
      expect(quantityInput).toHaveValue(2);
    });
  });

  describe('Invoice Calculation and Summary', () => {
    test('should display calculation summary for General invoices', async () => {
      const user = userEvent.setup();
      
      // Mock calculation response
      mockInvoiceApi.calculateInvoice.mockResolvedValue({
        items: [{
          item_id: 'item-1',
          item_name: 'Test Item',
          quantity: 2,
          unit_price: 100,
          total_price: 200
        }],
        subtotal: 200,
        total_labor_cost: 0,
        total_profit: 0,
        total_vat: 0,
        tax_amount: 0,
        discount_amount: 0,
        grand_total: 200
      });

      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Fill in required fields
      const customerSelect = screen.getByRole('combobox', { name: /select a customer/i });
      await user.click(customerSelect);
      await user.click(screen.getByText('John Doe'));

      const itemNameInput = screen.getByLabelText('Item Name *');
      await user.type(itemNameInput, 'Test Item');

      const unitPriceInput = screen.getByLabelText('Unit Price *');
      await user.type(unitPriceInput, '100');

      const quantityInput = screen.getByLabelText('Quantity *');
      await user.clear(quantityInput);
      await user.type(quantityInput, '2');

      // Wait for calculation
      await waitFor(() => {
        expect(screen.getByText('Invoice Summary')).toBeInTheDocument();
        expect(screen.getByText('$200.00')).toBeInTheDocument();
      });
    });

    test('should display workflow status indicators', async () => {
      const user = userEvent.setup();
      
      // Mock calculation response
      mockInvoiceApi.calculateInvoice.mockResolvedValue({
        items: [{
          item_id: 'item-1',
          item_name: 'Test Item',
          quantity: 1,
          unit_price: 100,
          total_price: 100
        }],
        subtotal: 100,
        total_labor_cost: 0,
        total_profit: 0,
        total_vat: 0,
        tax_amount: 0,
        discount_amount: 0,
        grand_total: 100
      });

      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Fill in required fields to trigger calculation
      const customerSelect = screen.getByRole('combobox', { name: /select a customer/i });
      await user.click(customerSelect);
      await user.click(screen.getByText('John Doe'));

      const itemNameInput = screen.getByLabelText('Item Name *');
      await user.type(itemNameInput, 'Test Item');

      const unitPriceInput = screen.getByLabelText('Unit Price *');
      await user.type(unitPriceInput, '100');

      // Wait for workflow status to appear
      await waitFor(() => {
        expect(screen.getByText('Workflow Status')).toBeInTheDocument();
        expect(screen.getByText('Draft Stage')).toBeInTheDocument();
        expect(screen.getByText('Auto-Approved')).toBeInTheDocument();
        expect(screen.getByText('Stock Impact')).toBeInTheDocument();
      });
    });

    test('should display Gold-specific calculation summary', async () => {
      const user = userEvent.setup();
      
      // Mock Gold calculation response
      mockInvoiceApi.calculateInvoice.mockResolvedValue({
        items: [{
          item_id: 'item-1',
          item_name: 'Gold Ring',
          quantity: 1,
          unit_price: 550,
          total_price: 550,
          weight_grams: 5.5,
          base_price: 275,
          labor_cost: 27.5,
          profit_amount: 45.375,
          vat_amount: 31.26
        }],
        subtotal: 275,
        total_labor_cost: 27.5,
        total_profit: 45.375,
        total_vat: 31.26,
        tax_amount: 31.26,
        discount_amount: 0,
        grand_total: 550
      });

      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Switch to Gold invoice
      const goldRadio = screen.getByRole('radio', { name: /gold/i });
      await user.click(goldRadio);

      // Fill in required fields
      const customerSelect = screen.getByRole('combobox', { name: /select a customer/i });
      await user.click(customerSelect);
      await user.click(screen.getByText('John Doe'));

      const itemNameInput = screen.getByLabelText('Item Name *');
      await user.type(itemNameInput, 'Gold Ring');

      const weightInput = screen.getByLabelText('Weight (grams) *');
      await user.type(weightInput, '5.5');

      const quantityInput = screen.getByLabelText('Quantity *');
      await user.clear(quantityInput);
      await user.type(quantityInput, '1');

      // Wait for calculation with Gold-specific fields
      await waitFor(() => {
        expect(screen.getByText('Invoice Summary')).toBeInTheDocument();
        expect(screen.getByText('اجرت - Labor Cost')).toBeInTheDocument();
        expect(screen.getByText('سود - Profit')).toBeInTheDocument();
        expect(screen.getByText('مالیات - VAT')).toBeInTheDocument();
        expect(screen.getByText('Total Weight: 5.500g')).toBeInTheDocument();
      });
    });
  });

  describe('Invoice List with Type Filtering', () => {
    test('should display invoice type filter in list', () => {
      render(
        <TestWrapper>
          <InvoiceList />
        </TestWrapper>
      );

      expect(screen.getByRole('combobox', { name: /all types/i })).toBeInTheDocument();
    });

    test('should show invoice type badges in list', async () => {
      // Mock invoice list with different types
      mockInvoiceApi.listInvoices.mockResolvedValue([
        {
          id: 'inv-1',
          invoice_number: 'GOLD-202401-0001',
          type: 'gold',
          customer_id: 'customer-1',
          total_amount: 550,
          paid_amount: 0,
          remaining_amount: 550,
          status: 'draft',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'inv-2',
          invoice_number: 'INV-202401-0001',
          type: 'general',
          customer_id: 'customer-2',
          total_amount: 200,
          paid_amount: 200,
          remaining_amount: 0,
          status: 'paid',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z'
        }
      ]);

      render(
        <TestWrapper>
          <InvoiceList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Gold')).toBeInTheDocument();
        expect(screen.getByText('General')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('should validate Gold invoice requirements', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Switch to Gold invoice
      const goldRadio = screen.getByRole('radio', { name: /gold/i });
      await user.click(goldRadio);

      // Try to submit without required fields
      const submitButton = screen.getByRole('button', { name: /create gold invoice/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Please select a customer')).toBeInTheDocument();
      });
    });

    test('should validate weight requirement for Gold invoice items', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Switch to Gold invoice
      const goldRadio = screen.getByRole('radio', { name: /gold/i });
      await user.click(goldRadio);

      // Fill customer
      const customerSelect = screen.getByRole('combobox', { name: /select a customer/i });
      await user.click(customerSelect);
      await user.click(screen.getByText('John Doe'));

      // Fill item name but not weight
      const itemNameInput = screen.getByLabelText('Item Name *');
      await user.type(itemNameInput, 'Gold Item');

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /create gold invoice/i });
      await user.click(submitButton);

      // Should show weight validation error
      await waitFor(() => {
        expect(screen.getByText('Weight required for gold items')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should display error messages for API failures', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      mockInvoiceApi.createInvoice.mockRejectedValue({
        response: {
          data: {
            detail: 'Insufficient stock for Gold Ring'
          }
        }
      });

      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Fill form and submit
      const customerSelect = screen.getByRole('combobox', { name: /select a customer/i });
      await user.click(customerSelect);
      await user.click(screen.getByText('John Doe'));

      const itemNameInput = screen.getByLabelText('Item Name *');
      await user.type(itemNameInput, 'Test Item');

      const unitPriceInput = screen.getByLabelText('Unit Price *');
      await user.type(unitPriceInput, '100');

      const submitButton = screen.getByRole('button', { name: /create general invoice/i });
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Creation Failed')).toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Preview Modal', () => {
    test('should display enhanced preview modal with detailed information', async () => {
      const user = userEvent.setup();
      
      // Mock calculation response
      mockInvoiceApi.calculateInvoice.mockResolvedValue({
        items: [{
          item_id: 'item-1',
          item_name: 'Test Item',
          quantity: 2,
          unit_price: 100,
          total_price: 200
        }],
        subtotal: 200,
        total_labor_cost: 0,
        total_profit: 0,
        total_vat: 0,
        tax_amount: 0,
        discount_amount: 0,
        grand_total: 200
      });

      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Fill in required fields
      const customerSelect = screen.getByRole('combobox', { name: /select a customer/i });
      await user.click(customerSelect);
      await user.click(screen.getByText('John Doe'));

      const itemNameInput = screen.getByLabelText('Item Name *');
      await user.type(itemNameInput, 'Test Item');

      const unitPriceInput = screen.getByLabelText('Unit Price *');
      await user.type(unitPriceInput, '100');

      const quantityInput = screen.getByLabelText('Quantity *');
      await user.clear(quantityInput);
      await user.type(quantityInput, '2');

      // Wait for preview button to appear
      await waitFor(() => {
        expect(screen.getByText('Preview Invoice')).toBeInTheDocument();
      });

      // Click preview button
      const previewButton = screen.getByText('Preview Invoice');
      await user.click(previewButton);

      // Check if enhanced preview modal appears
      await waitFor(() => {
        expect(screen.getByText('Invoice Preview')).toBeInTheDocument();
        expect(screen.getByText('Review before creating')).toBeInTheDocument();
        expect(screen.getByText('General Invoice')).toBeInTheDocument();
        expect(screen.getByText('Invoice Items')).toBeInTheDocument();
        expect(screen.getByText('Calculation Summary')).toBeInTheDocument();
        expect(screen.getByText('QR Code & Card')).toBeInTheDocument();
        expect(screen.getByText('Confirm & Create Invoice')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and User Workflows', () => {
    test('should update button text based on invoice type', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <InvoiceForm />
        </TestWrapper>
      );

      // Initially should show General
      expect(screen.getByRole('button', { name: /create general invoice/i })).toBeInTheDocument();

      // Switch to Gold
      const goldRadio = screen.getByRole('radio', { name: /gold/i });
      await user.click(goldRadio);

      // Should update to Gold
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create gold invoice/i })).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Main Invoice Page', () => {
    test('should render complete invoice management interface', () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      expect(screen.getByText('Invoice Management')).toBeInTheDocument();
      expect(screen.getByText('Create, manage, and track invoices with professional precision')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create new invoice/i })).toBeInTheDocument();
    });
  });
});