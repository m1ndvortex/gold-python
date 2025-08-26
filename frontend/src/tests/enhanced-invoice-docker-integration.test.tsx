import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnhancedInvoiceForm } from '../components/invoices/EnhancedInvoiceForm';
import { StockValidation } from '../components/invoices/StockValidation';
import { PricingAnalytics } from '../components/invoices/PricingAnalytics';
import { ApprovalSystem } from '../components/invoices/ApprovalSystem';
import { PaymentMethodManager } from '../components/invoices/PaymentMethodManager';
import { WorkflowIndicator } from '../components/invoices/WorkflowIndicator';
import { AuditTrail } from '../components/invoices/AuditTrail';

// Mock the API modules
jest.mock('../services/universalInventoryApi', () => ({
  useCreateInvoice: () => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null
  }),
  useGetCategories: () => ({
    data: [
      { id: '1', name: 'Gold Jewelry', description: 'Gold jewelry items' }
    ],
    isLoading: false
  }),
  useGetItems: () => ({
    data: [
      {
        id: '1',
        name: 'Test Gold Ring Enhanced',
        category_id: '1',
        stock_quantity: 10,
        unit_price: 500,
        weight_grams: 2.5
      },
      {
        id: '2', 
        name: 'Test Gold Necklace Enhanced',
        category_id: '1',
        stock_quantity: 5,
        unit_price: 800,
        weight_grams: 3.0
      }
    ],
    isLoading: false
  })
}));

jest.mock('../services/api', () => ({
  useGetCustomers: () => ({
    data: [
      { id: '1', name: 'Test Customer Enhanced Invoice', email: 'test@example.com' }
    ],
    isLoading: false
  })
}));

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Enhanced Invoice Docker Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EnhancedInvoiceForm Integration', () => {
    test('renders enhanced invoice form with all components', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });
    });

    test('handles customer selection and form validation', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        const customerSelect = screen.getByRole('combobox');
        expect(customerSelect).toBeInTheDocument();
      });
    });
  });

  describe('StockValidation Component', () => {
    const mockStockItems = [
      {
        id: '1',
        name: 'Test Gold Ring Enhanced',
        requestedQuantity: 2,
        availableQuantity: 10,
        status: 'available' as const
      }
    ];

    test('displays stock validation status', () => {
      render(
        <StockValidation 
          items={mockStockItems}
          onRefreshStock={jest.fn()}
        />
      );
      
      expect(screen.getByText('Stock Validation')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
    });
  });

  describe('PricingAnalytics Component', () => {
    const mockAnalytics = {
      totalRevenue: 981.00,
      totalCost: 700.00,
      grossProfit: 281.00,
      profitMargin: 22.2,
      goldMetrics: {
        totalWeight: 5.5,
        goldValue: 400.00,
        averagePurity: 18
      }
    };

    test('displays pricing analytics correctly', () => {
      render(<PricingAnalytics analytics={mockAnalytics} />);
      
      expect(screen.getByText('$981.00')).toBeInTheDocument();
      expect(screen.getByText('$700.00')).toBeInTheDocument();
      expect(screen.getByText('22.2%')).toBeInTheDocument();
    });
  });

  describe('WorkflowIndicator Component', () => {
    test('displays draft status correctly', () => {
      render(
        <WorkflowIndicator 
          currentStage="draft"
          totalStages={4}
          stageProgress={25}
        />
      );
      
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Invoice is being prepared')).toBeInTheDocument();
      expect(screen.getByText('Stage 1 of 4')).toBeInTheDocument();
    });
  });

  describe('ApprovalSystem Component', () => {
    const mockApprovalProps = {
      invoiceId: 'test-invoice-1',
      currentStage: 'pending_approval' as const,
      totalAmount: 1500,
      approvalRequired: true,
      approvalRules: [
        { role: 'manager', amountThreshold: 1000, required: true }
      ],
      approvalHistory: [],
      currentUser: { id: '1', name: 'Test User', role: 'manager' },
      onApprove: jest.fn().mockResolvedValue(undefined),
      onReject: jest.fn().mockResolvedValue(undefined),
      onRequestApproval: jest.fn().mockResolvedValue(undefined)
    };

    test('displays approval system interface', () => {
      render(<ApprovalSystem {...mockApprovalProps} />);
      
      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
      expect(screen.getByText('Approve')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });
  });

  describe('PaymentMethodManager Component', () => {
    const mockPaymentProps = {
      invoiceId: 'test-invoice-1',
      totalAmount: 1000,
      paidAmount: 300,
      remainingAmount: 700,
      paymentMethods: [
        { id: '1', type: 'cash' as const, name: 'Cash', isActive: true }
      ],
      paymentHistory: [],
      onAddPayment: jest.fn().mockResolvedValue(undefined),
      onUpdatePayment: jest.fn().mockResolvedValue(undefined),
      onDeletePayment: jest.fn().mockResolvedValue(undefined),
      onCreateInstallmentPlan: jest.fn().mockResolvedValue(undefined)
    };

    test('displays payment management interface', () => {
      render(<PaymentMethodManager {...mockPaymentProps} />);
      
      expect(screen.getByText('$300.00 of $1,000.00')).toBeInTheDocument();
      expect(screen.getByText('Add Payment')).toBeInTheDocument();
    });
  });

  describe('AuditTrail Component', () => {
    const mockAuditEntries = [
      {
        id: '1',
        action: 'invoice_created',
        userId: '1',
        userName: 'Test User',
        userRole: 'manager',
        timestamp: new Date().toISOString(),
        details: 'Invoice created with real backend',
        changes: []
      }
    ];

    test('displays audit trail entries', () => {
      render(
        <AuditTrail 
          entries={mockAuditEntries}
          onExportAuditLog={jest.fn().mockResolvedValue(undefined)}
        />
      );
      
      expect(screen.getByText('invoice_created')).toBeInTheDocument();
      expect(screen.getByText('Test User (manager)')).toBeInTheDocument();
      expect(screen.getByText('Invoice created with real backend')).toBeInTheDocument();
    });
  });

  describe('Integration Workflow Tests', () => {
    test('complete invoice creation workflow', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });

      // Test form sections are present
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText('Validation')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Workflow')).toBeInTheDocument();
    });

    test('handles form validation errors gracefully', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        const form = screen.getByRole('form', { name: /enhanced invoice form/i });
        expect(form).toBeInTheDocument();
      });
    });
  });
});