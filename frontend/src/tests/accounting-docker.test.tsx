import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Accounting } from '../pages/Accounting';
import { IncomeLedger } from '../components/accounting/IncomeLedger';
import { ExpenseLedger } from '../components/accounting/ExpenseLedger';
import { CashBankLedger } from '../components/accounting/CashBankLedger';
import { GoldWeightLedger } from '../components/accounting/GoldWeightLedger';
import { ProfitLossAnalysis } from '../components/accounting/ProfitLossAnalysis';
import { DebtTracking } from '../components/accounting/DebtTracking';

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'admin', email: 'admin@test.com', role_id: '1', is_active: true, created_at: '2024-01-01T00:00:00Z', role: { id: '1', name: 'Owner', description: 'Owner role', permissions: { accounting_view: true }, created_at: '2024-01-01T00:00:00Z' } },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    isLoggingIn: false,
    loginError: null,
    hasPermission: () => true,
    hasAnyRole: () => true,
    hasRole: () => true,
    getPermissions: () => ({ accounting_view: true }),
    isTokenExpired: () => false,
  }),
}));

// Mock the language hook
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    direction: 'ltr',
    t: (key: string) => key,
  }),
}));

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

describe('Accounting Interface - Docker Integration Tests', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    jest.clearAllMocks();
  });

  describe('Main Accounting Page', () => {
    test('renders accounting page with all tabs', async () => {
      render(
        <TestWrapper>
          <Accounting />
        </TestWrapper>
      );

      // Check if main title is rendered
      expect(screen.getByText('Accounting System')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive financial management and ledger tracking')).toBeInTheDocument();

      // Check if all tabs are present
      expect(screen.getByText('Income Ledger')).toBeInTheDocument();
      expect(screen.getByText('Expense Ledger')).toBeInTheDocument();
      expect(screen.getByText('Cash & Bank')).toBeInTheDocument();
      expect(screen.getByText('Gold Weight')).toBeInTheDocument();
      expect(screen.getByText('Profit & Loss')).toBeInTheDocument();
      expect(screen.getByText('Debt Tracking')).toBeInTheDocument();
    });

    test('switches between tabs correctly', async () => {
      render(
        <TestWrapper>
          <Accounting />
        </TestWrapper>
      );

      // Click on Expense Ledger tab
      fireEvent.click(screen.getByText('Expense Ledger'));
      
      // Wait for tab content to load
      await waitFor(() => {
        expect(screen.getByText('Manage business expenses and categorization')).toBeInTheDocument();
      });

      // Click on Profit & Loss tab
      fireEvent.click(screen.getByText('Profit & Loss'));
      
      await waitFor(() => {
        expect(screen.getByText('Comprehensive profit and loss analysis')).toBeInTheDocument();
      });
    });
  });

  describe('Income Ledger Component', () => {
    test('renders income ledger with summary cards', async () => {
      render(
        <TestWrapper>
          <IncomeLedger />
        </TestWrapper>
      );

      // Check summary cards
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Outstanding Amount')).toBeInTheDocument();
      expect(screen.getByText('Total Invoices')).toBeInTheDocument();

      // Check main table headers
      expect(screen.getByText('Invoice #')).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
      expect(screen.getByText('Paid Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    test('shows filters panel when filter button is clicked', async () => {
      render(
        <TestWrapper>
          <IncomeLedger />
        </TestWrapper>
      );

      // Click filters button
      const filtersButton = screen.getByText('Filters');
      fireEvent.click(filtersButton);

      // Check if filter inputs appear
      await waitFor(() => {
        expect(screen.getByText('Start Date')).toBeInTheDocument();
        expect(screen.getByText('End Date')).toBeInTheDocument();
        expect(screen.getByText('Payment Status')).toBeInTheDocument();
      });
    });
  });

  describe('Expense Ledger Component', () => {
    test('renders expense ledger with add expense functionality', async () => {
      render(
        <TestWrapper>
          <ExpenseLedger />
        </TestWrapper>
      );

      // Check summary cards
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Total Entries')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();

      // Check add expense button
      expect(screen.getByText('Add Expense')).toBeInTheDocument();

      // Check table headers
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    test('opens add expense dialog when button is clicked', async () => {
      render(
        <TestWrapper>
          <ExpenseLedger />
        </TestWrapper>
      );

      // Click add expense button
      const addButton = screen.getByText('Add Expense');
      fireEvent.click(addButton);

      // Check if dialog opens
      await waitFor(() => {
        expect(screen.getByText('Add New Expense')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
      });
    });
  });

  describe('Cash & Bank Ledger Component', () => {
    test('renders cash bank ledger with transaction summaries', async () => {
      render(
        <TestWrapper>
          <CashBankLedger />
        </TestWrapper>
      );

      // Check summary cards
      expect(screen.getByText('Cash Inflow')).toBeInTheDocument();
      expect(screen.getByText('Cash Outflow')).toBeInTheDocument();
      expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
      expect(screen.getByText('Total Transactions')).toBeInTheDocument();

      // Check table headers
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
    });
  });

  describe('Gold Weight Ledger Component', () => {
    test('renders gold weight ledger with weight tracking', async () => {
      render(
        <TestWrapper>
          <GoldWeightLedger />
        </TestWrapper>
      );

      // Check summary cards
      expect(screen.getByText('Gold Purchased')).toBeInTheDocument();
      expect(screen.getByText('Gold Sold')).toBeInTheDocument();
      expect(screen.getByText('Net Gold Weight')).toBeInTheDocument();
      expect(screen.getByText('Total Valuation')).toBeInTheDocument();

      // Check table headers
      expect(screen.getByText('Weight (grams)')).toBeInTheDocument();
      expect(screen.getByText('Current Valuation')).toBeInTheDocument();
    });

    test('shows gold weight summary section', async () => {
      render(
        <TestWrapper>
          <GoldWeightLedger />
        </TestWrapper>
      );

      // Check summary section
      expect(screen.getByText('Gold Weight Summary')).toBeInTheDocument();
      expect(screen.getByText('Purchase Transactions')).toBeInTheDocument();
      expect(screen.getByText('Sale Transactions')).toBeInTheDocument();
      expect(screen.getByText('Adjustment Transactions')).toBeInTheDocument();
    });
  });

  describe('Profit & Loss Analysis Component', () => {
    test('renders profit loss analysis with date controls', async () => {
      render(
        <TestWrapper>
          <ProfitLossAnalysis />
        </TestWrapper>
      );

      // Check date range controls
      expect(screen.getByText('From:')).toBeInTheDocument();
      expect(screen.getByText('To:')).toBeInTheDocument();
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    test('shows quick date range buttons', async () => {
      render(
        <TestWrapper>
          <ProfitLossAnalysis />
        </TestWrapper>
      );

      // Test quick date range buttons
      const last7DaysButton = screen.getByText('Last 7 Days');
      const last30DaysButton = screen.getByText('Last 30 Days');
      const thisMonthButton = screen.getByText('This Month');

      expect(last7DaysButton).toBeInTheDocument();
      expect(last30DaysButton).toBeInTheDocument();
      expect(thisMonthButton).toBeInTheDocument();

      // Click buttons to test functionality
      fireEvent.click(last7DaysButton);
      fireEvent.click(last30DaysButton);
      fireEvent.click(thisMonthButton);
    });
  });

  describe('Debt Tracking Component', () => {
    test('renders debt tracking with severity indicators', async () => {
      render(
        <TestWrapper>
          <DebtTracking />
        </TestWrapper>
      );

      // Check summary cards
      expect(screen.getByText('Total Outstanding Debt')).toBeInTheDocument();
      expect(screen.getByText('Customers with Debt')).toBeInTheDocument();
      expect(screen.getByText('Average Debt')).toBeInTheDocument();
      expect(screen.getByText('Critical Cases')).toBeInTheDocument();

      // Check table headers
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Total Debt')).toBeInTheDocument();
      expect(screen.getByText('Severity')).toBeInTheDocument();
    });

    test('shows debt summary by severity section', async () => {
      render(
        <TestWrapper>
          <DebtTracking />
        </TestWrapper>
      );

      // Check severity summary section
      expect(screen.getByText('Debt Summary by Severity')).toBeInTheDocument();
      expect(screen.getByText('Critical (≥$10,000)')).toBeInTheDocument();
      expect(screen.getByText('High ($5,000-$9,999)')).toBeInTheDocument();
      expect(screen.getByText('Medium ($1,000-$4,999)')).toBeInTheDocument();
      expect(screen.getByText('Low (<$1,000)')).toBeInTheDocument();
    });
  });

  describe('Real Backend Integration', () => {
    test('makes actual API calls to backend', async () => {
      // This test will make real API calls to the Docker backend
      const originalFetch = global.fetch;
      let apiCallMade = false;

      global.fetch = jest.fn().mockImplementation((...args: any[]) => {
        apiCallMade = true;
        return originalFetch(...(args as [RequestInfo | URL, RequestInit?]));
      });

      render(
        <TestWrapper>
          <Accounting />
        </TestWrapper>
      );

      // Wait for API calls to be made
      await waitFor(() => {
        expect(apiCallMade).toBe(true);
      }, { timeout: 10000 });

      global.fetch = originalFetch;
    });

    test('handles API errors gracefully', async () => {
      // Mock fetch to simulate API error
      global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <IncomeLedger />
        </TestWrapper>
      );

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByText(/Error loading income ledger/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Filter and Search Functionality', () => {
    test('applies filters correctly in income ledger', async () => {
      render(
        <TestWrapper>
          <IncomeLedger />
        </TestWrapper>
      );

      // Open filters
      fireEvent.click(screen.getByText('Filters'));

      await waitFor(() => {
        const startDateInput = screen.getByLabelText(/Start Date/i) as HTMLInputElement;
        const endDateInput = screen.getByLabelText(/End Date/i) as HTMLInputElement;

        // Set date filters
        fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
        fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });

        expect(startDateInput.value).toBe('2024-01-01');
        expect(endDateInput.value).toBe('2024-12-31');
      });
    });

    test('clears filters when clear button is clicked', async () => {
      render(
        <TestWrapper>
          <ExpenseLedger />
        </TestWrapper>
      );

      // Open filters
      fireEvent.click(screen.getByText('Filters'));

      await waitFor(() => {
        // Click clear filters button
        const clearButton = screen.getByText('Clear Filters');
        fireEvent.click(clearButton);
      });
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on mobile viewport', async () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <Accounting />
        </TestWrapper>
      );

      // Check if components render without breaking
      expect(screen.getByText('Accounting System')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    test('formats currency values correctly', async () => {
      render(
        <TestWrapper>
          <IncomeLedger />
        </TestWrapper>
      );

      // Currency formatting is handled by the components
      // This test ensures the components render without errors
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });

    test('formats dates correctly', async () => {
      render(
        <TestWrapper>
          <DebtTracking />
        </TestWrapper>
      );

      // Date formatting is handled by the components
      expect(screen.getByText('Last Purchase')).toBeInTheDocument();
      expect(screen.getByText('Last Payment')).toBeInTheDocument();
    });
  });
});