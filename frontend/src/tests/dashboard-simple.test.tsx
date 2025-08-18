import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { DashboardSummary, LowStockItem, UnpaidInvoice } from '../types';

// Mock Chart.js to avoid canvas issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  RefreshCw: () => <div data-testid="refresh-icon">RefreshCw</div>,
  TrendingUp: () => <div data-testid="trending-up">TrendingUp</div>,
  TrendingDown: () => <div data-testid="trending-down">TrendingDown</div>,
  DollarSign: () => <div data-testid="dollar-sign">DollarSign</div>,
  Package: () => <div data-testid="package">Package</div>,
  Users: () => <div data-testid="users">Users</div>,
  Coins: () => <div data-testid="coins">Coins</div>,
  AlertTriangle: () => <div data-testid="alert-triangle">AlertTriangle</div>,
  Clock: () => <div data-testid="clock">Clock</div>,
  CreditCard: () => <div data-testid="credit-card">CreditCard</div>,
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Components - Simple Tests', () => {
  describe('SummaryCards Component', () => {
    const mockSummaryData: DashboardSummary = {
      total_sales_today: 12234,
      total_sales_week: 85638,
      total_sales_month: 367452,
      total_inventory_value: 45231,
      total_customer_debt: 2350,
      current_gold_price: 65.40,
      gold_price_change: 2.5,
      low_stock_count: 3,
      unpaid_invoices_count: 5
    };

    test('renders summary cards with correct data', () => {
      const mockOnCardClick = jest.fn();
      
      render(
        <TestWrapper>
          <SummaryCards 
            data={mockSummaryData} 
            isLoading={false} 
            onCardClick={mockOnCardClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Total Sales Today')).toBeInTheDocument();
      expect(screen.getByText('$12,234')).toBeInTheDocument();
      expect(screen.getByText('Inventory Value')).toBeInTheDocument();
      expect(screen.getByText('$45,231')).toBeInTheDocument();
      expect(screen.getByText('Customer Debt')).toBeInTheDocument();
      expect(screen.getByText('$2,350')).toBeInTheDocument();
      expect(screen.getByText('Gold Price (per gram)')).toBeInTheDocument();
      expect(screen.getByText('$65')).toBeInTheDocument();
    });

    test('shows loading state correctly', () => {
      const mockOnCardClick = jest.fn();
      
      render(
        <TestWrapper>
          <SummaryCards 
            data={null} 
            isLoading={true} 
            onCardClick={mockOnCardClick}
          />
        </TestWrapper>
      );

      const loadingCards = screen.getAllByRole('generic');
      expect(loadingCards.some(card => card.classList.contains('animate-pulse'))).toBe(true);
    });

    test('handles card clicks correctly', () => {
      const mockOnCardClick = jest.fn();
      
      render(
        <TestWrapper>
          <SummaryCards 
            data={mockSummaryData} 
            isLoading={false} 
            onCardClick={mockOnCardClick}
          />
        </TestWrapper>
      );

      const salesCard = screen.getByText('Total Sales Today').closest('.cursor-pointer');
      if (salesCard) {
        fireEvent.click(salesCard);
        expect(mockOnCardClick).toHaveBeenCalledWith('sales');
      }
    });
  });

  describe('AlertsPanel Component', () => {
    const mockLowStockItems: LowStockItem[] = [
      {
        item_id: '1',
        item_name: 'Gold Ring 18K',
        category_name: 'Rings',
        current_stock: 2,
        min_stock_level: 5,
        shortage: 3,
        unit_price: 1500,
        status: 'warning',
        urgency_score: 60
      },
      {
        item_id: '2',
        item_name: 'Gold Necklace 22K',
        category_name: 'Necklaces',
        current_stock: 0,
        min_stock_level: 3,
        shortage: 3,
        unit_price: 2500,
        status: 'critical',
        urgency_score: 100
      }
    ];

    const mockUnpaidInvoices: UnpaidInvoice[] = [
      {
        invoice_id: '1',
        invoice_number: 'INV-001',
        customer_name: 'Ahmad Hassan',
        total_amount: 3500,
        remaining_amount: 1500,
        days_overdue: 15,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        invoice_id: '2',
        invoice_number: 'INV-002',
        customer_name: 'Sara Ali',
        total_amount: 2800,
        remaining_amount: 2800,
        days_overdue: 45,
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    test('renders low stock alerts correctly', () => {
      const mockOnLowStockClick = jest.fn();
      const mockOnInvoiceClick = jest.fn();
      
      render(
        <TestWrapper>
          <AlertsPanel
            lowStockItems={mockLowStockItems}
            unpaidInvoices={mockUnpaidInvoices}
            isLoading={false}
            onLowStockClick={mockOnLowStockClick}
            onInvoiceClick={mockOnInvoiceClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Low Stock Alerts')).toBeInTheDocument();
      expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
      expect(screen.getByText('Gold Necklace 22K')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
    });

    test('renders unpaid invoices correctly', () => {
      const mockOnLowStockClick = jest.fn();
      const mockOnInvoiceClick = jest.fn();
      
      render(
        <TestWrapper>
          <AlertsPanel
            lowStockItems={mockLowStockItems}
            unpaidInvoices={mockUnpaidInvoices}
            isLoading={false}
            onLowStockClick={mockOnLowStockClick}
            onInvoiceClick={mockOnInvoiceClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Unpaid Invoices')).toBeInTheDocument();
      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.getByText('INV-002')).toBeInTheDocument();
      expect(screen.getByText('Ahmad Hassan • $1,500 remaining')).toBeInTheDocument();
      expect(screen.getByText('Sara Ali • $2,800 remaining')).toBeInTheDocument();
    });

    test('handles alert clicks correctly', () => {
      const mockOnLowStockClick = jest.fn();
      const mockOnInvoiceClick = jest.fn();
      
      render(
        <TestWrapper>
          <AlertsPanel
            lowStockItems={mockLowStockItems}
            unpaidInvoices={mockUnpaidInvoices}
            isLoading={false}
            onLowStockClick={mockOnLowStockClick}
            onInvoiceClick={mockOnInvoiceClick}
          />
        </TestWrapper>
      );

      const lowStockItem = screen.getByText('Gold Ring 18K').closest('.cursor-pointer');
      if (lowStockItem) {
        fireEvent.click(lowStockItem);
        expect(mockOnLowStockClick).toHaveBeenCalledWith('1');
      }

      const unpaidInvoice = screen.getByText('INV-001').closest('.cursor-pointer');
      if (unpaidInvoice) {
        fireEvent.click(unpaidInvoice);
        expect(mockOnInvoiceClick).toHaveBeenCalledWith('1');
      }
    });

    test('shows loading state for alerts', () => {
      const mockOnLowStockClick = jest.fn();
      const mockOnInvoiceClick = jest.fn();
      
      render(
        <TestWrapper>
          <AlertsPanel
            lowStockItems={null}
            unpaidInvoices={null}
            isLoading={true}
            onLowStockClick={mockOnLowStockClick}
            onInvoiceClick={mockOnInvoiceClick}
          />
        </TestWrapper>
      );

      const loadingAlerts = screen.getAllByRole('generic');
      expect(loadingAlerts.some(alert => alert.classList.contains('animate-pulse'))).toBe(true);
    });

    test('shows empty state when no alerts', () => {
      const mockOnLowStockClick = jest.fn();
      const mockOnInvoiceClick = jest.fn();
      
      render(
        <TestWrapper>
          <AlertsPanel
            lowStockItems={[]}
            unpaidInvoices={[]}
            isLoading={false}
            onLowStockClick={mockOnLowStockClick}
            onInvoiceClick={mockOnInvoiceClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('No low stock alerts at this time.')).toBeInTheDocument();
      expect(screen.getByText('No unpaid invoices at this time.')).toBeInTheDocument();
    });
  });

  describe('Dashboard Component Integration', () => {
    test('dashboard components render without crashing', () => {
      // This is a basic smoke test to ensure components can be imported and rendered
      const mockSummaryData: DashboardSummary = {
        total_sales_today: 1000,
        total_sales_week: 7000,
        total_sales_month: 30000,
        total_inventory_value: 50000,
        total_customer_debt: 5000,
        current_gold_price: 65.40,
        gold_price_change: 2.5,
        low_stock_count: 2,
        unpaid_invoices_count: 3
      };

      render(
        <TestWrapper>
          <SummaryCards 
            data={mockSummaryData} 
            isLoading={false} 
            onCardClick={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Total Sales Today')).toBeInTheDocument();
    });
  });

  describe('Real-time Data Updates', () => {
    test('components handle data updates correctly', () => {
      const mockOnCardClick = jest.fn();
      
      const initialData: DashboardSummary = {
        total_sales_today: 1000,
        total_sales_week: 7000,
        total_sales_month: 30000,
        total_inventory_value: 50000,
        total_customer_debt: 5000,
        current_gold_price: 65.40,
        gold_price_change: 2.5,
        low_stock_count: 2,
        unpaid_invoices_count: 3
      };

      const { rerender } = render(
        <TestWrapper>
          <SummaryCards 
            data={initialData} 
            isLoading={false} 
            onCardClick={mockOnCardClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('$1,000')).toBeInTheDocument();

      const updatedData: DashboardSummary = {
        ...initialData,
        total_sales_today: 2000
      };

      rerender(
        <TestWrapper>
          <SummaryCards 
            data={updatedData} 
            isLoading={false} 
            onCardClick={mockOnCardClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('$2,000')).toBeInTheDocument();
    });
  });
});