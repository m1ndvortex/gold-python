/**
 * Basic Tests for Invoice Form Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceForm } from '../components/invoices/InvoiceForm';

// Setup test environment polyfills
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock dependencies
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
}));

jest.mock('../components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

jest.mock('../hooks/useCustomers', () => ({
  useCustomers: () => ({
    data: [],
    isLoading: false
  })
}));

jest.mock('../hooks/useInventory', () => ({
  useInventoryItems: () => ({
    data: { items: [] },
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
  })
}));

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

describe('Invoice Form Basic Tests', () => {
  test('should render invoice type selection', () => {
    render(
      <TestWrapper>
        <InvoiceForm />
      </TestWrapper>
    );

    expect(screen.getByText('Invoice Type Selection')).toBeInTheDocument();
    expect(screen.getByText('Gold Invoice')).toBeInTheDocument();
    expect(screen.getByText('General Invoice')).toBeInTheDocument();
  });

  test('should render customer selection', () => {
    render(
      <TestWrapper>
        <InvoiceForm />
      </TestWrapper>
    );

    expect(screen.getByText('Customer Information')).toBeInTheDocument();
    expect(screen.getByText('Customer *')).toBeInTheDocument();
  });

  test('should render invoice items section', () => {
    render(
      <TestWrapper>
        <InvoiceForm />
      </TestWrapper>
    );

    expect(screen.getByText('Invoice Items')).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  test('should render workflow configuration', () => {
    render(
      <TestWrapper>
        <InvoiceForm />
      </TestWrapper>
    );

    expect(screen.getByText('Invoice Workflow')).toBeInTheDocument();
    expect(screen.getByText('Require approval before affecting inventory stock')).toBeInTheDocument();
  });
});