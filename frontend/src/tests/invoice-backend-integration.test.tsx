import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { EnhancedInvoiceForm } from '../components/invoices/EnhancedInvoiceForm';

// Mock toast
jest.mock('../components/ui/use-toast', () => ({
  toast: jest.fn(),
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

describe('Invoice Backend Integration Test', () => {
  beforeEach(() => {
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('backend API endpoints are accessible', async () => {
    // Mock successful API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'customer-1',
            name: 'Test Customer',
            phone: '123-456-7890',
            current_debt: 0,
            total_purchases: 1000,
            customer_type: 'regular',
            credit_limit: 5000,
          }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'item-1',
              name: 'Gold Ring',
              weight_grams: 2.5,
              stock_quantity: 10,
              is_active: true,
              min_stock_level: 2,
              category_id: 'category-1',
            }
          ]
        })
      });

    render(
      <TestWrapper>
        <EnhancedInvoiceForm />
      </TestWrapper>
    );

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByText('Basic Info')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify that API calls were made
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers'),
      expect.any(Object)
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/inventory/items'),
      expect.any(Object)
    );
  });

  test('invoice calculation API works', async () => {
    // Mock API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'customer-1',
            name: 'Test Customer',
            phone: '123-456-7890',
            current_debt: 0,
            total_purchases: 1000,
            customer_type: 'regular',
            credit_limit: 5000,
          }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'item-1',
              name: 'Gold Ring',
              weight_grams: 2.5,
              stock_quantity: 10,
              is_active: true,
              min_stock_level: 2,
              category_id: 'category-1',
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subtotal: 6875,
          total_labor_cost: 687.5,
          total_profit: 1031.25,
          total_vat: 928.125,
          grand_total: 9521.875,
          items: [
            {
              item_id: 'item-1',
              item_name: 'Gold Ring',
              quantity: 1,
              weight_grams: 2.5,
              unit_price: 6875,
              total_price: 6875,
            }
          ]
        })
      });

    render(
      <TestWrapper>
        <EnhancedInvoiceForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Info')).toBeInTheDocument();
    });

    // Fill in customer
    const customerSelect = screen.getAllByRole('combobox')[0];
    await act(async () => {
      fireEvent.click(customerSelect);
    });

    await waitFor(() => {
      const customerOption = screen.getByText('Test Customer (123-456-7890)');
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
      await act(async () => {
        fireEvent.click(itemSelect);
      });
      
      await waitFor(() => {
        const itemOption = screen.getByText(/Gold Ring - 2.5g/);
        fireEvent.click(itemOption);
      });
    }

    // Wait for calculation to trigger
    await waitFor(() => {
      // Check if calculation API was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/invoices/calculate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.any(String),
        })
      );
    }, { timeout: 10000 });
  });

  test('invoice creation API works', async () => {
    // Mock API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'customer-1',
            name: 'Test Customer',
            phone: '123-456-7890',
            current_debt: 0,
            total_purchases: 1000,
            customer_type: 'regular',
            credit_limit: 5000,
          }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'item-1',
              name: 'Gold Ring',
              weight_grams: 2.5,
              stock_quantity: 10,
              is_active: true,
              min_stock_level: 2,
              category_id: 'category-1',
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subtotal: 6875,
          total_labor_cost: 687.5,
          total_profit: 1031.25,
          total_vat: 928.125,
          grand_total: 9521.875,
          items: [
            {
              item_id: 'item-1',
              item_name: 'Gold Ring',
              quantity: 1,
              weight_grams: 2.5,
              unit_price: 6875,
              total_price: 6875,
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'invoice-123',
          invoice_number: 'INV-001',
          customer_id: 'customer-1',
          total_amount: 9521.875,
          status: 'pending',
          created_at: '2025-01-01T00:00:00Z',
        })
      });

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
    const customerSelect = screen.getAllByRole('combobox')[0];
    await act(async () => {
      fireEvent.click(customerSelect);
    });

    await waitFor(() => {
      const customerOption = screen.getByText('Test Customer (123-456-7890)');
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
      await act(async () => {
        fireEvent.click(itemSelect);
      });
      
      await waitFor(() => {
        const itemOption = screen.getByText(/Gold Ring - 2.5g/);
        fireEvent.click(itemOption);
      });
    }

    // Wait for calculation to complete
    await waitFor(() => {
      // Look for calculated values or submit button to be enabled
      const submitButton = screen.getByRole('button', { name: /create invoice/i });
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 10000 });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create invoice/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for invoice creation API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/invoices'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.any(String),
        })
      );
    }, { timeout: 10000 });

    // Verify success callback was called
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});