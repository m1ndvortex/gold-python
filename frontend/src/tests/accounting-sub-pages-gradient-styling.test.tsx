import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Import all accounting components
import { IncomeLedger } from '../components/accounting/IncomeLedger';
import { ExpenseLedger } from '../components/accounting/ExpenseLedger';
import { CashBankLedger } from '../components/accounting/CashBankLedger';
import { GoldWeightLedger } from '../components/accounting/GoldWeightLedger';
import { DebtTracking } from '../components/accounting/DebtTracking';
import { ProfitLossAnalysis } from '../components/accounting/ProfitLossAnalysis';

// Mock the accounting hooks
jest.mock('../hooks/useAccounting', () => ({
  useAccounting: () => ({
    useIncomeLedger: () => ({
      data: [
        {
          id: 1,
          invoice_number: 'INV-001',
          customer_name: 'John Doe',
          total_amount: 1000,
          paid_amount: 800,
          remaining_amount: 200,
          payment_status: 'partial',
          transaction_date: '2024-01-15T10:00:00Z'
        }
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    }),
    useExpenseLedger: () => ({
      data: [
        {
          id: 1,
          category: 'inventory_purchase',
          amount: 500,
          description: 'Gold purchase',
          transaction_date: '2024-01-15T10:00:00Z',
          reference_type: 'purchase'
        }
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    }),
    useCashBankLedger: () => ({
      data: [
        {
          id: 1,
          transaction_type: 'cash_in',
          amount: 1000,
          description: 'Cash sale',
          payment_method: 'cash',
          transaction_date: '2024-01-15T10:00:00Z',
          reference_type: 'sale'
        }
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    }),
    useGoldWeightLedger: () => ({
      data: [
        {
          id: 1,
          transaction_type: 'purchase',
          weight_grams: 100.5,
          description: 'Gold purchase',
          current_valuation: 5000,
          transaction_date: '2024-01-15T10:00:00Z',
          reference_type: 'purchase'
        }
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    }),
    useDebtTracking: () => ({
      data: [
        {
          customer_id: 1,
          customer_name: 'John Doe',
          customer_phone: '+1234567890',
          total_debt: 5000,
          total_invoices: 3,
          payment_history_count: 2,
          last_purchase_date: '2024-01-15',
          last_payment_date: '2024-01-10'
        }
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    }),
    useProfitLossAnalysis: () => ({
      data: {
        total_revenue: 10000,
        total_expenses: 6000,
        net_profit: 4000,
        profit_margin: 40,
        revenue_breakdown: {
          'Gold Sales': 8000,
          'Jewelry': 2000
        },
        expense_breakdown: {
          'Inventory': 4000,
          'Labor': 2000
        },
        top_performing_categories: [
          { category: 'Gold Sales', revenue: 8000 },
          { category: 'Jewelry', revenue: 2000 }
        ]
      },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    }),
    useCreateExpenseEntry: () => ({
      mutateAsync: jest.fn(),
      isPending: false
    }),
    useLedgerSummary: () => ({
      data: {
        total_income: 10000,
        total_expenses: 6000,
        total_cash_flow: 4000,
        total_gold_weight: 500,
        total_customer_debt: 5000,
        net_profit: 4000
      },
      isLoading: false
    })
  })
}));

// Mock the language hook
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en'
  })
}));

// Mock the toast hook
jest.mock('../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>
}));

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  CategoryScale: {},
  LinearScale: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  ArcElement: {}
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

describe('Accounting Sub-Pages Gradient Styling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('IncomeLedger Component', () => {
    test('renders with enhanced gradient styling', async () => {
      render(
        <TestWrapper>
          <IncomeLedger />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for gradient card backgrounds
        const cards = document.querySelectorAll('.bg-gradient-to-br');
        expect(cards.length).toBeGreaterThan(0);

        // Check for enhanced header with gradient styling
        expect(document.querySelector('.from-emerald-50')).toBeInTheDocument();
        expect(document.querySelector('.to-green-100\\/60')).toBeInTheDocument();

        // Check for gradient buttons
        expect(document.querySelector('.bg-gradient-to-br.from-emerald-500')).toBeInTheDocument();
      });

      // Verify content is still rendered
      expect(screen.getByText('accounting.income_ledger')).toBeInTheDocument();
      expect(screen.getByText('accounting.total_revenue')).toBeInTheDocument();
    });

    test('has enhanced summary cards with gradient backgrounds', async () => {
      render(
        <TestWrapper>
          <IncomeLedger />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for gradient summary cards
        const gradientCards = document.querySelectorAll('.bg-gradient-to-br.from-emerald-50');
        expect(gradientCards.length).toBeGreaterThan(0);

        // Check for hover effects
        const hoverCards = document.querySelectorAll('.hover\\:shadow-lg');
        expect(hoverCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ExpenseLedger Component', () => {
    test('renders with enhanced gradient styling', async () => {
      render(
        <TestWrapper>
          <ExpenseLedger />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for red gradient styling
        expect(document.querySelector('.from-red-50')).toBeInTheDocument();
        expect(document.querySelector('.to-rose-100\\/60')).toBeInTheDocument();

        // Check for gradient buttons
        expect(document.querySelector('.bg-gradient-to-br.from-red-500')).toBeInTheDocument();
      });

      expect(screen.getByText('accounting.expense_ledger')).toBeInTheDocument();
      expect(screen.getByText('accounting.total_expenses')).toBeInTheDocument();
    });
  });

  describe('CashBankLedger Component', () => {
    test('renders with enhanced gradient styling', async () => {
      render(
        <TestWrapper>
          <CashBankLedger />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for blue gradient styling
        expect(document.querySelector('.from-blue-50')).toBeInTheDocument();
        expect(document.querySelector('.to-indigo-100\\/60')).toBeInTheDocument();

        // Check for gradient buttons
        expect(document.querySelector('.bg-gradient-to-br.from-blue-500')).toBeInTheDocument();
      });

      expect(screen.getByText('Cash & Bank Ledger')).toBeInTheDocument();
    });
  });

  describe('GoldWeightLedger Component', () => {
    test('renders with enhanced gradient styling', async () => {
      render(
        <TestWrapper>
          <GoldWeightLedger />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for amber gradient styling
        expect(document.querySelector('.from-amber-50')).toBeInTheDocument();
        expect(document.querySelector('.to-yellow-100\\/60')).toBeInTheDocument();

        // Check for gradient buttons
        expect(document.querySelector('.bg-gradient-to-br.from-amber-500')).toBeInTheDocument();
      });

      expect(screen.getByText('Gold Weight Ledger')).toBeInTheDocument();
    });

    test('has enhanced summary chart with gradient styling', async () => {
      render(
        <TestWrapper>
          <GoldWeightLedger />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for enhanced summary section
        expect(screen.getByText('Gold Weight Summary')).toBeInTheDocument();
        
        // Check for gradient summary cards
        const summaryCards = document.querySelectorAll('.bg-gradient-to-br.from-emerald-50');
        expect(summaryCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DebtTracking Component', () => {
    test('renders with enhanced gradient styling', async () => {
      render(
        <TestWrapper>
          <DebtTracking />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for orange gradient styling
        expect(document.querySelector('.from-orange-50')).toBeInTheDocument();
        expect(document.querySelector('.to-red-50\\/30')).toBeInTheDocument();

        // Check for gradient buttons
        expect(document.querySelector('.bg-gradient-to-br.from-orange-500')).toBeInTheDocument();
      });

      expect(screen.getByText('Customer Debt Tracking')).toBeInTheDocument();
    });

    test('has enhanced debt summary with gradient styling', async () => {
      render(
        <TestWrapper>
          <DebtTracking />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for enhanced summary section
        expect(screen.getByText('Debt Summary by Severity')).toBeInTheDocument();
        
        // Check for gradient summary cards
        const summaryCards = document.querySelectorAll('.bg-gradient-to-br.from-red-50');
        expect(summaryCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ProfitLossAnalysis Component', () => {
    test('renders with enhanced gradient styling', async () => {
      render(
        <TestWrapper>
          <ProfitLossAnalysis />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for purple gradient styling
        expect(document.querySelector('.from-purple-50')).toBeInTheDocument();
        expect(document.querySelector('.to-violet-100\\/60')).toBeInTheDocument();

        // Check for gradient buttons
        expect(document.querySelector('.bg-gradient-to-br.from-purple-500')).toBeInTheDocument();
      });

      expect(screen.getByText('Profit & Loss Analysis')).toBeInTheDocument();
    });

    test('has enhanced charts with gradient styling', async () => {
      render(
        <TestWrapper>
          <ProfitLossAnalysis />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for chart containers with gradient styling
        expect(screen.getByText('Revenue vs Expenses Overview')).toBeInTheDocument();
        expect(screen.getByText('Revenue Breakdown by Category')).toBeInTheDocument();
        expect(screen.getByText('Expense Breakdown by Category')).toBeInTheDocument();
        expect(screen.getByText('Top Performing Categories')).toBeInTheDocument();

        // Check for chart components
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getAllByTestId('pie-chart')).toHaveLength(2);
      });
    });
  });

  describe('Common Gradient Styling Features', () => {
    test('all components have consistent gradient design elements', async () => {
      const components = [
        IncomeLedger,
        ExpenseLedger,
        CashBankLedger,
        GoldWeightLedger,
        DebtTracking,
        ProfitLossAnalysis
      ];

      for (const Component of components) {
        const { unmount } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        await waitFor(() => {
          // Check for gradient backgrounds
          const gradientElements = document.querySelectorAll('.bg-gradient-to-br, .bg-gradient-to-r');
          expect(gradientElements.length).toBeGreaterThan(0);

          // Check for shadow effects
          const shadowElements = document.querySelectorAll('.shadow-lg, .shadow-xl');
          expect(shadowElements.length).toBeGreaterThan(0);

          // Check for hover effects
          const hoverElements = document.querySelectorAll('.hover\\:shadow-lg, .hover\\:shadow-xl');
          expect(hoverElements.length).toBeGreaterThan(0);

          // Check for transition effects
          const transitionElements = document.querySelectorAll('.transition-all');
          expect(transitionElements.length).toBeGreaterThan(0);
        });

        unmount();
      }
    });

    test('all components have enhanced card styling', async () => {
      const components = [
        IncomeLedger,
        ExpenseLedger,
        CashBankLedger,
        GoldWeightLedger,
        DebtTracking,
        ProfitLossAnalysis
      ];

      for (const Component of components) {
        const { unmount } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        await waitFor(() => {
          // Check for border-0 (borderless cards)
          const borderlessCards = document.querySelectorAll('.border-0');
          expect(borderlessCards.length).toBeGreaterThan(0);

          // Check for enhanced shadows
          const shadowCards = document.querySelectorAll('.shadow-lg, .shadow-xl');
          expect(shadowCards.length).toBeGreaterThan(0);
        });

        unmount();
      }
    });
  });

  describe('Responsive Design', () => {
    test('components maintain gradient styling on different screen sizes', async () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <IncomeLedger />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check that gradient styling is still present on mobile
        const gradientElements = document.querySelectorAll('.bg-gradient-to-br');
        expect(gradientElements.length).toBeGreaterThan(0);

        // Check for responsive grid classes
        const responsiveGrids = document.querySelectorAll('.grid-cols-1, .md\\:grid-cols-3, .lg\\:grid-cols-4');
        expect(responsiveGrids.length).toBeGreaterThan(0);
      });
    });
  });
});