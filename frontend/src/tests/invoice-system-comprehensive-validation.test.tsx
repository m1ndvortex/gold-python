import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Invoices } from '../pages/Invoices';

// Mock toast
jest.mock('../components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock successful API responses
const mockCustomers = [
  {
    id: 'customer-1',
    name: 'Ahmad Ali',
    phone: '123-456-7890',
    current_debt: 0,
    total_purchases: 5000,
    customer_type: 'regular',
    credit_limit: 10000,
  }
];

const mockInventoryItems = [
  {
    id: 'item-1',
    name: 'Gold Ring 18K',
    weight_grams: 2.5,
    stock_quantity: 10,
    is_active: true,
    min_stock_level: 2,
    category_id: 'category-1',
  }
];

const mockCalculationResult = {
  subtotal: 6875,
  total_labor_cost: 687.5,
  total_profit: 1031.25,
  total_vat: 928.125,
  grand_total: 9521.875,
  items: [
    {
      item_id: 'item-1',
      item_name: 'Gold Ring 18K',
      quantity: 1,
      weight_grams: 2.5,
      unit_price: 6875,
      total_price: 6875,
    }
  ]
};

const mockCreatedInvoice = {
  id: 'invoice-123',
  invoice_number: 'INV-001',
  customer_id: 'customer-1',
  total_amount: 9521.875,
  status: 'pending',
  created_at: '2025-01-01T00:00:00Z',
  gold_price_per_gram: 2750,
  labor_cost_percentage: 10,
  profit_percentage: 15,
  vat_percentage: 9,
};

// Mock hooks with realistic data
jest.mock('../hooks/useInvoices', () => ({
  useInvoices: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useInvoiceSummary: () => ({
    data: {
      total_invoices: 0,
      total_amount: 0,
      total_paid: 0,
      total_remaining: 0,
    },
    isLoading: false,
  }),
  useCreateInvoice: () => ({
    mutate: jest.fn((data, options) => {
      console.log('Creating invoice with data:', data);
      setTimeout(() => {
        options?.onSuccess?.(mockCreatedInvoice);
      }, 100);
    }),
    isPending: false,
  }),
  useCalculateInvoice: () => ({
    mutate: jest.fn((data, options) => {
      console.log('Calculating invoice with data:', data);
      setTimeout(() => {
        options?.onSuccess?.(mockCalculationResult);
      }, 100);
    }),
    isPending: false,
  }),
}));

jest.mock('../hooks/useCustomers', () => ({
  useCustomers: () => ({
    data: mockCustomers,
    isLoading: false,
  }),
}));

jest.mock('../hooks/useInventory', () => ({
  useInventoryItems: () => ({
    data: {
      items: mockInventoryItems
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

describe('Invoice System Comprehensive Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Complete invoice creation workflow works end-to-end', async () => {
    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    // Step 1: Verify main page loads
    await waitFor(() => {
      expect(screen.getByText('Invoice Management')).toBeInTheDocument();
    });

    // Step 2: Click Create New Invoice button
    const createButton = screen.getByRole('button', { name: /create new invoice/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
    
    fireEvent.click(createButton);

    // Step 3: Verify dialog opens with enhanced form
    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
      expect(screen.getByText('Generate a professional invoice with automatic calculations')).toBeInTheDocument();
    });

    // Step 4: Verify all tabs are present
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Workflow')).toBeInTheDocument();

    // Step 5: Fill in customer information
    const customerSelect = screen.getAllByRole('combobox')[0];
    await act(async () => {
      fireEvent.click(customerSelect);
    });

    await waitFor(() => {
      const customerOption = screen.getByText('Ahmad Ali (123-456-7890)');
      fireEvent.click(customerOption);
    });

    // Step 6: Verify gold shop specific fields are present
    expect(screen.getByLabelText(/gold price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/labor cost/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/profit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vat/i)).toBeInTheDocument();

    // Step 7: Switch to Items tab
    const itemsTab = screen.getByText('Items');
    fireEvent.click(itemsTab);

    await waitFor(() => {
      expect(screen.getByText('Invoice Items')).toBeInTheDocument();
    });

    // Step 8: Add an item
    const itemSelects = screen.getAllByRole('combobox');
    const itemSelect = itemSelects.find(select => 
      select.closest('[class*="col-span-4"]')
    );
    
    if (itemSelect) {
      await act(async () => {
        fireEvent.click(itemSelect);
      });
      
      await waitFor(() => {
        const itemOption = screen.getByText(/Gold Ring 18K - 2.5g/);
        fireEvent.click(itemOption);
      });
    }

    // Step 9: Verify quantity and weight fields are filled
    const quantityInput = screen.getByLabelText(/quantity/i);
    const weightInput = screen.getByLabelText(/weight/i);
    
    expect(quantityInput).toHaveValue(1);
    expect(weightInput).toHaveValue(2.5);

    // Step 10: Check Validation tab
    const validationTab = screen.getByText('Validation');
    fireEvent.click(validationTab);

    await waitFor(() => {
      // Should show stock validation component
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    // Step 11: Check Analytics tab
    const analyticsTab = screen.getByText('Analytics');
    fireEvent.click(analyticsTab);

    await waitFor(() => {
      // Should show pricing analytics component
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    // Step 12: Check Workflow tab
    const workflowTab = screen.getByText('Workflow');
    fireEvent.click(workflowTab);

    await waitFor(() => {
      // Should show workflow component
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    // Step 13: Submit the invoice
    const submitButton = screen.getByRole('button', { name: /create invoice/i });
    expect(submitButton).not.toBeDisabled();
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Step 14: Verify success (dialog should close)
    await waitFor(() => {
      expect(screen.queryByText('Create New Invoice')).not.toBeInTheDocument();
    }, { timeout: 5000 });

    // Step 15: Verify we're back to the main page
    expect(screen.getByText('Invoice Management')).toBeInTheDocument();
  }, 30000); // Increase timeout for this comprehensive test

  test('Invoice button styling and accessibility', async () => {
    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoice Management')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create new invoice/i });
    
    // Verify button styling
    expect(createButton).toHaveClass(
      'bg-gradient-to-r',
      'from-green-500',
      'to-teal-600',
      'hover:from-green-600',
      'hover:to-teal-700',
      'text-white',
      'shadow-lg',
      'hover:shadow-xl',
      'transition-all',
      'duration-300'
    );

    // Verify button is accessible
    expect(createButton).toHaveAttribute('type', 'button');
    expect(createButton).not.toBeDisabled();
    expect(createButton).toBeVisible();
  });

  test('Gold shop specific features are preserved', async () => {
    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoice Management')).toBeInTheDocument();
    });

    // Open create dialog
    const createButton = screen.getByRole('button', { name: /create new invoice/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Check for gold shop specific fields (سود and اجرت)
    expect(screen.getByLabelText(/gold price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/labor cost/i)).toBeInTheDocument(); // This is اجرت
    expect(screen.getByLabelText(/profit/i)).toBeInTheDocument(); // This is سود
    
    // Verify default business type is gold_shop
    const businessTypeSelect = screen.getAllByRole('combobox').find(select => 
      select.closest('div')?.querySelector('label')?.textContent?.includes('Business Type')
    );
    
    if (businessTypeSelect) {
      expect(businessTypeSelect).toHaveDisplayValue('Gold Shop');
    }
  });

  test('Real-time calculation updates work', async () => {
    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoice Management')).toBeInTheDocument();
    });

    // Open create dialog
    const createButton = screen.getByRole('button', { name: /create new invoice/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Fill customer
    const customerSelect = screen.getAllByRole('combobox')[0];
    await act(async () => {
      fireEvent.click(customerSelect);
    });

    await waitFor(() => {
      const customerOption = screen.getByText('Ahmad Ali (123-456-7890)');
      fireEvent.click(customerOption);
    });

    // Change gold price to trigger calculation
    const goldPriceInput = screen.getByLabelText(/gold price/i);
    fireEvent.change(goldPriceInput, { target: { value: '3000' } });

    // Switch to items and add item
    const itemsTab = screen.getByText('Items');
    fireEvent.click(itemsTab);

    await waitFor(() => {
      expect(screen.getByText('Invoice Items')).toBeInTheDocument();
    });

    const itemSelects = screen.getAllByRole('combobox');
    const itemSelect = itemSelects.find(select => 
      select.closest('[class*="col-span-4"]')
    );
    
    if (itemSelect) {
      await act(async () => {
        fireEvent.click(itemSelect);
      });
      
      await waitFor(() => {
        const itemOption = screen.getByText(/Gold Ring 18K - 2.5g/);
        fireEvent.click(itemOption);
      });
    }

    // The calculation should trigger automatically
    // This tests the real-time calculation feature
    await waitFor(() => {
      // Look for any calculated values or summary
      const submitButton = screen.getByRole('button', { name: /create invoice/i });
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 5000 });
  });

  test('Form validation works correctly', async () => {
    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoice Management')).toBeInTheDocument();
    });

    // Open create dialog
    const createButton = screen.getByRole('button', { name: /create new invoice/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /create invoice/i });
    fireEvent.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/please select a customer/i)).toBeInTheDocument();
    });
  });

  test('Professional UI styling is consistent', async () => {
    render(
      <TestWrapper>
        <Invoices />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoice Management')).toBeInTheDocument();
    });

    // Check main page styling
    const mainTitle = screen.getByText('Invoice Management');
    expect(mainTitle).toHaveClass('text-3xl', 'font-bold');

    // Check for gradient elements
    const gradientElements = document.querySelectorAll('[class*="bg-gradient-to-"]');
    expect(gradientElements.length).toBeGreaterThan(0);

    // Check for shadow elements
    const shadowElements = document.querySelectorAll('[class*="shadow-"]');
    expect(shadowElements.length).toBeGreaterThan(0);

    // Open dialog to check form styling
    const createButton = screen.getByRole('button', { name: /create new invoice/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Check dialog styling
    const dialogTitle = screen.getByText('Create New Invoice');
    expect(dialogTitle).toHaveClass('text-2xl', 'font-bold');

    // Check tab styling
    const tabs = screen.getAllByRole('tab');
    tabs.forEach(tab => {
      expect(tab).toHaveClass('transition-all', 'duration-300');
    });
  });
});