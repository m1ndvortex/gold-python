import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceList } from '../components/invoices/InvoiceList';

// Mock fetch globally
global.fetch = jest.fn();

// Mock toast
jest.mock('../components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock hooks with minimal data
jest.mock('../hooks/useInvoices', () => ({
  useInvoices: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useDeleteInvoice: () => ({
    mutate: jest.fn(),
  }),
}));

jest.mock('../hooks/useCustomers', () => ({
  useCustomers: () => ({
    data: [],
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

describe('Invoice Button Fix - Simple Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Create Invoice button renders and is clickable', async () => {
    const mockOnCreateNew = jest.fn();

    render(
      <TestWrapper>
        <InvoiceList onCreateNew={mockOnCreateNew} />
      </TestWrapper>
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    // Find the Create Invoice button
    const createButton = screen.getByRole('button', { name: /create invoice/i });
    
    // Verify button exists and has correct styling
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
    
    // Verify button is clickable
    expect(createButton).not.toBeDisabled();
    
    // Click the button
    fireEvent.click(createButton);
    
    // Verify callback is called
    expect(mockOnCreateNew).toHaveBeenCalledTimes(1);
  });

  test('Invoice list renders with proper structure', async () => {
    render(
      <TestWrapper>
        <InvoiceList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    // Check for filters section
    expect(screen.getByText('Filters')).toBeInTheDocument();
    
    // Check for table headers
    expect(screen.getByText('Invoice #')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('Button has correct gradient styling', async () => {
    const mockOnCreateNew = jest.fn();

    render(
      <TestWrapper>
        <InvoiceList onCreateNew={mockOnCreateNew} />
      </TestWrapper>
    );

    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /create invoice/i });
      
      // Verify gradient classes are applied
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
    });
  });
});