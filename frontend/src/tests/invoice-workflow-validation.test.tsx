import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { WorkflowIndicator } from '../components/invoices/WorkflowIndicator';
import { StockValidation } from '../components/invoices/StockValidation';
import { PricingAnalytics } from '../components/invoices/PricingAnalytics';

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

describe('Invoice Workflow and Validation Components', () => {
  describe('WorkflowIndicator', () => {
    test('displays draft stage correctly', () => {
      render(
        <TestWrapper>
          <WorkflowIndicator currentStage="draft" />
        </TestWrapper>
      );

      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Invoice is being prepared')).toBeInTheDocument();
    });

    test('displays approval stage correctly', () => {
      render(
        <TestWrapper>
          <WorkflowIndicator currentStage="pending_approval" approvalRequired={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
      expect(screen.getByText('Waiting for manager approval')).toBeInTheDocument();
    });

    test('displays approved stage correctly', () => {
      render(
        <TestWrapper>
          <WorkflowIndicator currentStage="approved" />
        </TestWrapper>
      );

      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Invoice approved, stock impacted')).toBeInTheDocument();
    });

    test('displays paid stage correctly', () => {
      render(
        <TestWrapper>
          <WorkflowIndicator currentStage="paid" />
        </TestWrapper>
      );

      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.getByText('Payment received, invoice complete')).toBeInTheDocument();
    });

    test('shows progress correctly', () => {
      render(
        <TestWrapper>
          <WorkflowIndicator currentStage="approved" showProgress={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText(/% Complete/)).toBeInTheDocument();
    });
  });

  describe('StockValidation', () => {
    const mockStockItems = [
      {
        inventoryItemId: 'item-1',
        itemName: 'Gold Ring',
        requestedQuantity: 2,
        availableStock: 10,
        unitOfMeasure: 'pieces',
        lowStockThreshold: 5,
      },
      {
        inventoryItemId: 'item-2',
        itemName: 'Silver Necklace',
        requestedQuantity: 8,
        availableStock: 5,
        unitOfMeasure: 'pieces',
        lowStockThreshold: 3,
      },
    ];

    test('renders stock validation component', () => {
      render(
        <TestWrapper>
          <StockValidation items={mockStockItems} />
        </TestWrapper>
      );

      expect(screen.getByText('Stock Validation')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    test('displays stock items correctly', async () => {
      render(
        <TestWrapper>
          <StockValidation items={mockStockItems} realTimeValidation={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Gold Ring')).toBeInTheDocument();
        expect(screen.getByText('Silver Necklace')).toBeInTheDocument();
      });
    });

    test('shows validation results', async () => {
      const mockOnValidationComplete = jest.fn();

      render(
        <TestWrapper>
          <StockValidation 
            items={mockStockItems} 
            onValidationComplete={mockOnValidationComplete}
            realTimeValidation={true}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockOnValidationComplete).toHaveBeenCalled();
      });
    });
  });

  describe('PricingAnalytics', () => {
    const mockPricingItems = [
      {
        itemId: 'item-1',
        itemName: 'Gold Ring',
        quantity: 1,
        costPrice: 2000,
        salePrice: 2750,
        totalCost: 2000,
        totalRevenue: 2750,
        margin: 750,
        marginPercentage: 37.5,
      },
    ];

    const mockBreakdown = {
      subtotal: 2750,
      totalCost: 2000,
      grossProfit: 750,
      profitMargin: 37.5,
      goldSpecific: {
        totalWeight: 2.5,
        goldValue: 2500,
        laborCost: 250,
        profitAmount: 375,
      },
      taxAmount: 247.5,
      discountAmount: 0,
      finalTotal: 2997.5,
    };

    test('renders pricing analytics component', () => {
      render(
        <TestWrapper>
          <PricingAnalytics 
            items={mockPricingItems} 
            breakdown={mockBreakdown}
            businessType="gold_shop"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Pricing Analytics')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Item Analysis')).toBeInTheDocument();
      expect(screen.getByText('Optimization')).toBeInTheDocument();
    });

    test('displays gold shop specific metrics', () => {
      render(
        <TestWrapper>
          <PricingAnalytics 
            items={mockPricingItems} 
            breakdown={mockBreakdown}
            businessType="gold_shop"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Total Cost')).toBeInTheDocument();
      expect(screen.getByText('Gross Profit')).toBeInTheDocument();
      expect(screen.getByText('Profit Margin')).toBeInTheDocument();
    });

    test('switches between tabs correctly', () => {
      render(
        <TestWrapper>
          <PricingAnalytics 
            items={mockPricingItems} 
            breakdown={mockBreakdown}
            businessType="gold_shop"
          />
        </TestWrapper>
      );

      // Click on Item Analysis tab
      const itemAnalysisTab = screen.getByText('Item Analysis');
      fireEvent.click(itemAnalysisTab);

      expect(screen.getByText('Item Margin Analysis')).toBeInTheDocument();

      // Click on Optimization tab
      const optimizationTab = screen.getByText('Optimization');
      fireEvent.click(optimizationTab);

      expect(screen.getByText('Optimization Recommendations')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('all components use consistent gradient styling', () => {
      const { container: workflowContainer } = render(
        <TestWrapper>
          <WorkflowIndicator currentStage="draft" />
        </TestWrapper>
      );

      const { container: stockContainer } = render(
        <TestWrapper>
          <StockValidation items={[]} />
        </TestWrapper>
      );

      const { container: pricingContainer } = render(
        <TestWrapper>
          <PricingAnalytics 
            items={[]} 
            breakdown={{
              subtotal: 0,
              totalCost: 0,
              grossProfit: 0,
              profitMargin: 0,
              taxAmount: 0,
              discountAmount: 0,
              finalTotal: 0,
            }}
          />
        </TestWrapper>
      );

      // Check for gradient classes in all components
      expect(workflowContainer.querySelector('[class*="bg-gradient-to-br"]')).toBeTruthy();
      expect(stockContainer.querySelector('[class*="bg-gradient-to-br"]')).toBeTruthy();
      expect(pricingContainer.querySelector('[class*="bg-gradient-to-br"]')).toBeTruthy();
    });

    test('components handle empty data gracefully', () => {
      render(
        <TestWrapper>
          <StockValidation items={[]} />
        </TestWrapper>
      );

      expect(screen.getByText('No items to validate')).toBeInTheDocument();

      render(
        <TestWrapper>
          <PricingAnalytics 
            items={[]} 
            breakdown={{
              subtotal: 0,
              totalCost: 0,
              grossProfit: 0,
              profitMargin: 0,
              taxAmount: 0,
              discountAmount: 0,
              finalTotal: 0,
            }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });
});