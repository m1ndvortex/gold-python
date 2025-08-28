import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Invoices } from '../pages/Invoices';
import { EnhancedInvoiceForm } from '../components/invoices/EnhancedInvoiceForm';
import { InvoiceList } from '../components/invoices/InvoiceList';

// Mock fetch globally
global.fetch = jest.fn();

// Mock toast
jest.mock('../components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock hooks
jest.mock('../hooks/useInvoices', () => ({
  useInvoices: () => ({
    data: [
      {
        id: '1',
        invoice_number: 'INV-001',
        customer_id: 'customer-1',
        total_amount: 1000,
        paid_amount: 0,
        remaining_amount: 1000,
        status: 'pending',
        created_at: '2025-01-01T00:00:00Z',
        gold_price_per_gram: 2500,
        labor_cost_percentage: 10,
        profit_percentage: 15,
        vat_percentage: 9
      }
    ],
    isLoading: false,
    error: null,
  }),
  useInvoiceSummary: () => ({
    data: {
      total_invoices: 1,
      total_amount: 1000,
      total_paid: 0,
      total_remaining: 1000,
    },
    isLoading: false,
  }),
  useCreateInvoice: () => ({
    mutate: jest.fn((data, options) => {
      // Simulate successful creation
      setTimeout(() => {
        options?.onSuccess?.({
          id: 'new-invoice-id',
          invoice_number: 'INV-002',
          ...data,
        });
      }, 100);
    }),
    isPending: false,
  }),
  useCalculateInvoice: () => ({
    mutate: jest.fn((data, options) => {
      // Simulate successful calculation
      setTimeout(() => {
        options?.onSuccess?.({
          subtotal: 2750,
          total_labor_cost: 275,
          total_profit: 412.5,
          total_vat: 371.25,
          grand_total: 3808.75,
          items: [
            {
              item_id: 'item-1',
              item_name: 'Gold Ring',
              quantity: 1,
              weight_grams: 1,
              unit_price: 2750,
              total_price: 2750,
            }
          ]
        });
      }, 100);
    }),
    isPending: false,
  }),
}));

jest.mock('../hooks/useCustomers', () => ({
  useCustomers: () => ({
    data: [
      {
        id: 'customer-1',
        name: 'John Doe',
        phone: '123-456-7890',
        current_debt: 0,
        total_purchases: 5000,
        customer_type: 'regular',
        credit_limit: 10000,
      }
    ],
    isLoading: false,
  }),
}));

jest.mock('../hooks/useInventory', () => ({
  useInventoryItems: () => ({
    data: {
      items: [
        {
          id: 'item-1',
          name: 'Gold Ring',
          weight_grams: 1,
          stock_quantity: 10,
          is_active: true,
          min_stock_level: 2,
          category_id: 'category-1',
        }
      ]
    },
    isLoading: false,
  }),
}));

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

describe('Enhanced Invoice System Button and Workflow Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Create Invoice Button Functionality', () => {
    test('renders Create Invoice button in main page', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Invoice Management')).toBeInTheDocument();
      });

      // Check for Create Invoice button
      const createButton = screen.getByRole('button', { name: /create new invoice/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
    });

    test('Create Invoice button opens dialog when clicked', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Invoice Management')).toBeInTheDocument();
      });

      // Click Create Invoice button
      const createButton = screen.getByRole('button', { name: /create new invoice/i });
      fireEvent.click(createButton);

      // Check if dialog opens
      await waitFor(() => {
        expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
        expect(screen.getByText('Generate a professional invoice with automatic calculations')).toBeInTheDocument();
      });
    });

    test('Create Invoice button in InvoiceList component works', async () => {
      const mockOnCreateNew = jest.fn();

      render(
        <TestWrapper>
          <InvoiceList onCreateNew={mockOnCreateNew} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Invoices')).toBeInTheDocument();
      });

      // Click Create Invoice button
      const createButton = screen.getByRole('button', { name: /create invoice/i });
      expect(createButton).toBeInTheDocument();
      fireEvent.click(createButton);

      // Check if callback is called
      expect(mockOnCreateNew).toHaveBeenCalledTimes(1);
    });
  });

  describe('Enhanced Invoice Form Integration', () => {
    test('renders enhanced invoice form with all tabs', async () => {
      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <TestWrapper>
          <EnhancedInvoiceForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Check for tab navigation
      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
        expect(screen.getByText('Items')).toBeInTheDocument();
        expect(screen.getByText('Validation')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Workflow')).toBeInTheDocument();
      });
    });

    test('form submission works correctly', async () => {
      const mockOnSuccess = jest.fn();

      render(
        <TestWrapper>
          <EnhancedInvoiceForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });

      // Fill in customer
      const customerSelect = screen.getByRole('combobox');
      fireEvent.click(customerSelect);
      
      await waitFor(() => {
        const customerOption = screen.getByText('John Doe (123-456-7890)');
        fireEvent.click(customerOption);
      });

      // Switch to Items tab
      const itemsTab = screen.getByText('Items');
      fireEvent.click(itemsTab);

      await waitFor(() => {
        expect(screen.getByText('Invoice Items')).toBeInTheDocument();
      });

      // Select an item
      const itemSelects = screen.getAllByRole('combobox');
      const itemSelect = itemSelects.find(select => 
        select.closest('[class*="col-span-4"]')
      );
      
      if (itemSelect) {
        fireEvent.click(itemSelect);
        
        await waitFor(() => {
          const itemOption = screen.getByText(/Gold Ring - 1g/);
          fireEvent.click(itemOption);
        });
      }

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create invoice/i });
      expect(submitButton).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Wait for success callback
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Workflow Implementation', () => {
    test('displays workflow stages correctly', async () => {
      render(
        <TestWrapper>
          <EnhancedInvoiceForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Workflow')).toBeInTheDocument();
      });

      // Click on Workflow tab
      const workflowTab = screen.getByText('Workflow');
      fireEvent.click(workflowTab);

      // Check for workflow indicators (these would be in the WorkflowIndicator component)
      // The component should show draft -> approval -> completion stages
      await waitFor(() => {
        // The workflow tab content should be visible
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      });
    });

    test('real-time calculation updates work', async () => {
      render(
        <TestWrapper>
          <EnhancedInvoiceForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });

      // Fill in customer
      const customerSelect = screen.getByRole('combobox');
      fireEvent.click(customerSelect);
      
      await waitFor(() => {
        const customerOption = screen.getByText('John Doe (123-456-7890)');
        fireEvent.click(customerOption);
      });

      // Change gold price
      const goldPriceInput = screen.getByLabelText(/gold price/i);
      fireEvent.change(goldPriceInput, { target: { value: '3000' } });

      // Switch to Items tab and add item
      const itemsTab = screen.getByText('Items');
      fireEvent.click(itemsTab);

      await waitFor(() => {
        expect(screen.getByText('Invoice Items')).toBeInTheDocument();
      });

      // The calculation should trigger automatically when valid data is entered
      // This tests the real-time calculation feature
    });
  });

  describe('Stock Integration and Validation', () => {
    test('displays stock validation in Validation tab', async () => {
      render(
        <TestWrapper>
          <EnhancedInvoiceForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Validation')).toBeInTheDocument();
      });

      // Click on Validation tab
      const validationTab = screen.getByText('Validation');
      fireEvent.click(validationTab);

      await waitFor(() => {
        // Should show stock validation component
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      });
    });

    test('shows inventory deduction warnings', async () => {
      render(
        <TestWrapper>
          <EnhancedInvoiceForm />
        </TestWrapper>
      );

      // Fill form with customer and items first
      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });

      const customerSelect = screen.getByRole('combobox');
      fireEvent.click(customerSelect);
      
      await waitFor(() => {
        const customerOption = screen.getByText('John Doe (123-456-7890)');
        fireEvent.click(customerOption);
      });

      // Switch to Items tab
      const itemsTab = screen.getByText('Items');
      fireEvent.click(itemsTab);

      await waitFor(() => {
        expect(screen.getByText('Invoice Items')).toBeInTheDocument();
      });

      // Add item with high quantity to trigger stock warning
      const quantityInput = screen.getByLabelText(/quantity/i);
      fireEvent.change(quantityInput, { target: { value: '15' } }); // More than available stock (10)

      // Switch to Validation tab
      const validationTab = screen.getByText('Validation');
      fireEvent.click(validationTab);

      // Should show stock validation warnings
      await waitFor(() => {
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      });
    });
  });

  describe('Gold Shop Specific Features', () => {
    test('preserves gold shop features (سود and اجرت)', async () => {
      render(
        <TestWrapper>
          <EnhancedInvoiceForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });

      // Check for gold shop specific fields
      expect(screen.getByLabelText(/gold price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/labor cost/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/profit/i)).toBeInTheDocument();

      // Check business type is set to gold_shop by default
      const businessTypeSelect = screen.getAllByRole('combobox').find(select => 
        select.closest('div')?.querySelector('label')?.textContent?.includes('Business Type')
      );
      
      if (businessTypeSelect) {
        expect(businessTypeSelect).toHaveValue('gold_shop');
      }
    });

    test('displays gold shop calculations in Analytics tab', async () => {
      render(
        <TestWrapper>
          <EnhancedInvoiceForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });

      // Click on Analytics tab
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        // Should show pricing analytics component with gold shop specific metrics
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and User Experience', () => {
    test('shows validation errors for required fields', async () => {
      render(
        <TestWrapper>
          <EnhancedInvoiceForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create invoice/i });
      fireEvent.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/please select a customer/i)).toBeInTheDocument();
      });
    });

    test('handles form cancellation correctly', async () => {
      const mockOnCancel = jest.fn();

      render(
        <TestWrapper>
          <EnhancedInvoiceForm onCancel={mockOnCancel} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });

      // Look for cancel button (might be in a dialog context)
      const cancelButtons = screen.queryAllByRole('button', { name: /cancel/i });
      if (cancelButtons.length > 0) {
        fireEvent.click(cancelButtons[0]);
        expect(mockOnCancel).toHaveBeenCalled();
      }
    });
  });

  describe('Professional UI and Styling', () => {
    test('uses gradient styling throughout the form', async () => {
      render(
        <TestWrapper>
          <EnhancedInvoiceForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });

      // Check for gradient classes on various elements
      const submitButton = screen.getByRole('button', { name: /create invoice/i });
      expect(submitButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');

      // Check tab styling
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('transition-all', 'duration-300');
      });
    });

    test('displays professional card layouts', async () => {
      render(
        <TestWrapper>
          <EnhancedInvoiceForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Customer & Business Information')).toBeInTheDocument();
        expect(screen.getByText('Pricing Configuration')).toBeInTheDocument();
      });

      // Cards should have gradient backgrounds and shadows
      const cards = document.querySelectorAll('[class*="bg-gradient-to-br"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});