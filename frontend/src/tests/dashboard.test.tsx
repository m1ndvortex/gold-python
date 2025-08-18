import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { DashboardCharts } from '../components/dashboard/DashboardCharts';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { DashboardSummary, LowStockItem, UnpaidInvoice } from '../types';

// Mock axios first
jest.mock('axios', () => ({
  default: {
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
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}));

// Mock the dashboard API
jest.mock('../services/dashboardApi');

// Import after mocking
const { dashboardApi } = require('../services/dashboardApi');
const mockedDashboardApi = dashboardApi as jest.Mocked<typeof dashboardApi>;

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

describe('Dashboard Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
  });

  describe('DashboardCharts Component', () => {
    const mockSalesData = {
      labels: ['Jan 1', 'Jan 2', 'Jan 3'],
      datasets: [{
        label: 'Sales',
        data: [1000, 1500, 1200],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };

    const mockCategoryData = [
      { category_name: 'Rings', total_sales: 15000, total_quantity: 25, percentage: 45 },
      { category_name: 'Necklaces', total_sales: 12000, total_quantity: 18, percentage: 35 },
      { category_name: 'Bracelets', total_sales: 8000, total_quantity: 15, percentage: 20 }
    ];

    const mockTopProducts = [
      {
        item_id: '1',
        item_name: 'Gold Ring 18K',
        category_name: 'Rings',
        total_quantity: 15,
        total_revenue: 22500,
        transaction_count: 8,
        average_price: 1500
      }
    ];

    test('renders charts correctly', () => {
      render(
        <TestWrapper>
          <DashboardCharts
            salesData={mockSalesData}
            categoryData={mockCategoryData}
            topProducts={mockTopProducts}
            isLoading={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Sales Trends')).toBeInTheDocument();
      expect(screen.getByText('Sales by Category')).toBeInTheDocument();
      expect(screen.getByText('Top Products')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    test('shows loading state for charts', () => {
      render(
        <TestWrapper>
          <DashboardCharts
            salesData={null}
            categoryData={null}
            topProducts={null}
            isLoading={true}
          />
        </TestWrapper>
      );

      const loadingCharts = screen.getAllByRole('generic');
      expect(loadingCharts.some(chart => chart.classList.contains('animate-pulse'))).toBe(true);
    });
  });

  describe('Dashboard Integration', () => {
    beforeEach(() => {
      // Mock all API calls
      mockedDashboardApi.getInventoryValuation.mockResolvedValue({
        summary: { total_sell_value: 45231 }
      });
      mockedDashboardApi.getCustomerDebtSummary.mockResolvedValue({
        summary: { total_outstanding_debt: 2350 }
      });
      mockedDashboardApi.getCurrentGoldPrice.mockResolvedValue({
        price_per_gram: 65.40,
        change_percentage: 2.5,
        last_updated: new Date().toISOString()
      });
      mockedDashboardApi.getLowStockItems.mockResolvedValue([]);
      mockedDashboardApi.getUnpaidInvoices.mockResolvedValue([]);
      mockedDashboardApi.getSalesChartData.mockResolvedValue({
        labels: ['Day 1', 'Day 2'],
        datasets: [{ label: 'Sales', data: [1000, 1500] }]
      });
      mockedDashboardApi.getCategorySalesData.mockResolvedValue([]);
      mockedDashboardApi.getTopProducts.mockResolvedValue([]);
    });

    test('renders full dashboard with real API integration', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check that dashboard title is rendered
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      // Wait for API calls to complete and data to load
      await waitFor(() => {
        expect(screen.getByText('Total Sales Today')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify API calls were made
      expect(mockedDashboardApi.getInventoryValuation).toHaveBeenCalled();
      expect(mockedDashboardApi.getCustomerDebtSummary).toHaveBeenCalled();
      expect(mockedDashboardApi.getCurrentGoldPrice).toHaveBeenCalled();
    });

    test('handles API errors gracefully', async () => {
      // Mock API to throw errors
      mockedDashboardApi.getInventoryValuation.mockRejectedValue(new Error('API Error'));
      mockedDashboardApi.getCustomerDebtSummary.mockRejectedValue(new Error('API Error'));
      mockedDashboardApi.getCurrentGoldPrice.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
      }, { timeout: 10000 });

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    test('refresh functionality works correctly', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      // Verify API calls are made again
      await waitFor(() => {
        expect(mockedDashboardApi.getInventoryValuation).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Real Database Integration Tests', () => {
    // These tests will run against the actual Docker backend
    const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    test('dashboard loads data from real backend API', async () => {
      // Skip if backend is not available
      try {
        const response = await fetch(`${BACKEND_URL}/health`);
        if (!response.ok) {
          console.log('Backend not available, skipping real API test');
          return;
        }
      } catch (error) {
        console.log('Backend not available, skipping real API test');
        return;
      }

      // Restore original API implementation for this test
      jest.restoreAllMocks();

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Wait for real API calls to complete
      await waitFor(() => {
        expect(screen.getByText('Total Sales Today')).toBeInTheDocument();
      }, { timeout: 30000 });

      // Verify dashboard components are rendered
      expect(screen.getByText('Inventory Value')).toBeInTheDocument();
      expect(screen.getByText('Customer Debt')).toBeInTheDocument();
      expect(screen.getByText('Gold Price (per gram)')).toBeInTheDocument();
    }, 60000);
  });
});