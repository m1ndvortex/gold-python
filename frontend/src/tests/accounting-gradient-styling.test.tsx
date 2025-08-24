import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Accounting } from '../pages/Accounting';

// Mock the accounting hook
jest.mock('../hooks/useAccounting', () => ({
  useAccounting: () => ({
    useLedgerSummary: () => ({
      data: {
        total_income: 50000,
        total_expenses: 30000,
        total_cash_flow: 20000,
        total_gold_weight: 1250.5,
        total_customer_debt: 5000,
        net_profit: 20000
      },
      isLoading: false
    })
  })
}));

// Mock the language hook
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'accounting.title': 'Accounting Management',
        'accounting.description': 'Comprehensive financial management system',
        'accounting.income': 'Income',
        'accounting.expense': 'Expenses',
        'accounting.cash_bank': 'Cash & Bank',
        'accounting.gold_weight': 'Gold Weight',
        'accounting.profit_loss': 'Profit & Loss',
        'accounting.debt_tracking': 'Debt Tracking',
        'accounting.total_income': 'Total Income',
        'accounting.total_expenses': 'Total Expenses',
        'accounting.cash_flow': 'Cash Flow',
        'accounting.customer_debt': 'Customer Debt',
        'accounting.net_profit': 'Net Profit',
        'accounting.income_desc': 'Track all income sources',
        'accounting.expense_desc': 'Manage business expenses'
      };
      return translations[key] || key;
    }
  })
}));

// Mock accounting components
jest.mock('../components/accounting/IncomeLedger', () => ({
  IncomeLedger: () => <div data-testid="income-ledger">Income Ledger Component</div>
}));

jest.mock('../components/accounting/ExpenseLedger', () => ({
  ExpenseLedger: () => <div data-testid="expense-ledger">Expense Ledger Component</div>
}));

jest.mock('../components/accounting/CashBankLedger', () => ({
  CashBankLedger: () => <div data-testid="cash-bank-ledger">Cash Bank Ledger Component</div>
}));

jest.mock('../components/accounting/GoldWeightLedger', () => ({
  GoldWeightLedger: () => <div data-testid="gold-weight-ledger">Gold Weight Ledger Component</div>
}));

jest.mock('../components/accounting/ProfitLossAnalysis', () => ({
  ProfitLossAnalysis: () => <div data-testid="profit-loss-analysis">Profit Loss Analysis Component</div>
}));

jest.mock('../components/accounting/DebtTracking', () => ({
  DebtTracking: () => <div data-testid="debt-tracking">Debt Tracking Component</div>
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Accounting Page Gradient Styling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders main page with gradient header icon', async () => {
    renderWithProviders(<Accounting />);
    
    // Check for main title
    expect(screen.getByText('Accounting Management')).toBeInTheDocument();
    
    // Check for gradient header icon container
    const headerIcon = document.querySelector('.h-12.w-12.rounded-xl.bg-gradient-to-br.from-green-500');
    expect(headerIcon).toBeInTheDocument();
    expect(headerIcon).toHaveClass('via-teal-500', 'to-blue-600', 'shadow-lg');
  });

  test('renders gradient action buttons in header', () => {
    renderWithProviders(<Accounting />);
    
    // Check for gradient buttons
    const refreshButton = screen.getByText('Refresh Data').closest('button');
    const exportButton = screen.getByText('Export Report').closest('button');
    
    expect(refreshButton).toHaveClass('bg-gradient-to-r');
    expect(exportButton).toHaveClass('bg-gradient-to-r');
  });

  test('renders financial overview cards with gradient backgrounds', () => {
    renderWithProviders(<Accounting />);
    
    // Check for gradient card backgrounds
    const incomeCard = document.querySelector('.bg-gradient-to-br.from-emerald-50.to-green-100\\/60');
    const expenseCard = document.querySelector('.bg-gradient-to-br.from-red-50.to-red-100\\/60');
    const cashFlowCard = document.querySelector('.bg-gradient-to-br.from-blue-50.to-blue-100\\/60');
    const goldWeightCard = document.querySelector('.bg-gradient-to-br.from-amber-50.to-yellow-100\\/60');
    const debtCard = document.querySelector('.bg-gradient-to-br.from-orange-50.to-orange-100\\/60');
    const profitCard = document.querySelector('.bg-gradient-to-br.from-purple-50.to-purple-100\\/60');
    
    expect(incomeCard).toBeInTheDocument();
    expect(expenseCard).toBeInTheDocument();
    expect(cashFlowCard).toBeInTheDocument();
    expect(goldWeightCard).toBeInTheDocument();
    expect(debtCard).toBeInTheDocument();
    expect(profitCard).toBeInTheDocument();
  });

  test('renders gradient tab navigation', () => {
    renderWithProviders(<Accounting />);
    
    // Check for gradient tab container
    const tabContainer = document.querySelector('.bg-gradient-to-r.from-green-50.via-teal-50.to-blue-50');
    expect(tabContainer).toBeInTheDocument();
    expect(tabContainer).toHaveClass('border-b-2', 'border-green-200');
  });

  test('renders tab triggers with gradient styling', () => {
    renderWithProviders(<Accounting />);
    
    // Check for tab triggers with gradient icons
    const tabTriggers = document.querySelectorAll('[role="tab"]');
    expect(tabTriggers.length).toBeGreaterThan(0);
    
    // Check for gradient icon containers in tabs
    const gradientIcons = document.querySelectorAll('.bg-gradient-to-br.from-green-500.to-teal-600');
    expect(gradientIcons.length).toBeGreaterThan(0);
  });

  test('renders tab content with gradient background', async () => {
    renderWithProviders(<Accounting />);
    
    // Check for gradient tab content background
    const tabContent = document.querySelector('.bg-gradient-to-br.from-green-50\\/30.to-white');
    expect(tabContent).toBeInTheDocument();
  });

  test('renders tab description area with gradient', () => {
    renderWithProviders(<Accounting />);
    
    // Check for gradient tab description area
    const tabDescription = document.querySelector('.bg-gradient-to-r.from-green-50\\/50.to-teal-50\\/30');
    expect(tabDescription).toBeInTheDocument();
  });

  test('tab switching works with gradient styling', async () => {
    renderWithProviders(<Accounting />);
    
    // Click on expense tab
    const expenseTab = screen.getByText('Expenses').closest('button');
    expect(expenseTab).toBeInTheDocument();
    
    fireEvent.click(expenseTab!);
    
    // Wait for tab content to change and check for gradient styling
    await waitFor(() => {
      const gradientContent = document.querySelector('.bg-gradient-to-br.from-green-50\\/30.to-white');
      expect(gradientContent).toBeInTheDocument();
    });
  });

  test('export button in tab header has gradient styling', async () => {
    renderWithProviders(<Accounting />);
    
    // Check for gradient export button in tab header
    const exportButtons = screen.getAllByText('Export');
    const tabExportButton = exportButtons.find(button => 
      button.closest('button')?.classList.contains('bg-gradient-to-r')
    );
    
    expect(tabExportButton).toBeInTheDocument();
  });

  test('real-time badge has gradient styling', () => {
    renderWithProviders(<Accounting />);
    
    // Check for real-time badge with gradient styling
    const realtimeBadge = screen.getByText('Real-time');
    expect(realtimeBadge).toBeInTheDocument();
    
    // Check that the badge has the correct classes
    const badgeElement = realtimeBadge.closest('[class*="bg-green-50"]');
    expect(badgeElement).toBeInTheDocument();
  });

  test('financial cards have hover effects', () => {
    renderWithProviders(<Accounting />);
    
    // Check for hover transition classes on cards
    const cards = document.querySelectorAll('.hover\\:shadow-xl.transition-all.duration-300');
    expect(cards.length).toBeGreaterThan(0);
  });

  test('icon containers have hover scale effects', () => {
    renderWithProviders(<Accounting />);
    
    // Check for hover scale effects on icon containers
    const iconContainers = document.querySelectorAll('.group-hover\\:scale-110');
    expect(iconContainers.length).toBeGreaterThan(0);
  });
});