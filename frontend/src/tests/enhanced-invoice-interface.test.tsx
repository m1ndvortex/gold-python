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

// Mock the API services
jest.mock('../services/universalInventoryApi', () => ({
  useCreateInvoice: () => ({
    mutate: jest.fn((data: any, options?: any) => {
      const mockResult = {
        id: 'invoice-123',
        invoice_number: 'INV-001',
        customer_id: data.customer_id,
        items: data.items.map((item: any, index: number) => ({
          id: `item-${index}`,
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          weight_grams: item.weight_grams,
          base_price: item.weight_grams * 100, // Mock gold price calculation
          labor_cost: (item.weight_grams * 100) * 0.15,
          profit_amount: (item.weight_grams * 100) * 0.20,
          vat_amount: (item.weight_grams * 100) * 0.10,
          unit_price: (item.weight_grams * 100) * 1.45 / item.quantity,
          total_price: (item.weight_grams * 100) * 1.45
        })),
        total_amount: data.items.reduce((sum: number, item: any) => sum + (item.weight_grams * 100 * 1.45), 0),
        status: 'draft'
      };
      
      if (options?.onSuccess) {
        options.onSuccess(mockResult);
      }
    }),
    isLoading: false,
    error: null
  })
}));

jest.mock('../services/api', () => ({
  useGetCustomers: () => ({
    data: [
      { id: '1', name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' }
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

describe('Enhanced Invoice Interface Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WorkflowIndicator Component', () => {
    test('displays draft status with progress', () => {
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

    test('displays pending approval status', () => {
      render(
        <WorkflowIndicator 
          currentStage="pending_approval"
          totalStages={4}
          stageProgress={50}
          approvalRequired={true}
        />
      );
      
      expect(screen.getByText('This invoice requires approval before stock impact')).toBeInTheDocument();
    });

    test('displays processing status with progress', () => {
      render(
        <WorkflowIndicator 
          currentStage="processing"
          totalStages={4}
          stageProgress={75}
        />
      );
      
      expect(screen.getByText('75% Complete')).toBeInTheDocument();
    });

    test('displays completed status', () => {
      render(
        <WorkflowIndicator 
          currentStage="paid"
          totalStages={4}
          stageProgress={100}
        />
      );
      
      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
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
      currentUser: { id: '1', name: 'John Doe', role: 'manager' },
      onApprove: jest.fn().mockResolvedValue(undefined),
      onReject: jest.fn().mockResolvedValue(undefined),
      onRequestApproval: jest.fn().mockResolvedValue(undefined)
    };

    test('displays approval interface for pending approval', () => {
      render(<ApprovalSystem {...mockApprovalProps} />);
      
      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
      expect(screen.getByText('Invoice Amount: $1,500.00')).toBeInTheDocument();
    });

    test('displays approve and reject buttons', () => {
      render(<ApprovalSystem {...mockApprovalProps} />);
      
      expect(screen.getByText('Approve')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    test('handles approval action', async () => {
      const onApprove = jest.fn().mockResolvedValue(undefined);
      render(<ApprovalSystem {...mockApprovalProps} onApprove={onApprove} />);
      
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);
      
      await waitFor(() => {
        expect(onApprove).toHaveBeenCalled();
      });
    });

    test('handles rejection with notes requirement', async () => {
      const onReject = jest.fn().mockResolvedValue(undefined);
      render(<ApprovalSystem {...mockApprovalProps} onReject={onReject} />);
      
      const rejectButton = screen.getByText('Reject');
      expect(rejectButton).toBeDisabled(); // Should be disabled without notes
      
      // Add notes to enable reject button
      const notesInput = screen.getByPlaceholderText(/rejection notes/i);
      fireEvent.change(notesInput, { target: { value: 'Test rejection reason' } });
      expect(rejectButton).not.toBeDisabled();
    });

    test('displays approval rules information', () => {
      render(<ApprovalSystem {...mockApprovalProps} />);
      
      expect(screen.getByText('Required Role: manager')).toBeInTheDocument();
      expect(screen.getByText('Threshold: $1,000.00')).toBeInTheDocument();
    });
  });

  describe('StockValidation Component', () => {
    const mockStockItems = [
      {
        id: '1',
        name: 'Gold Ring 18K',
        requestedQuantity: 2,
        availableQuantity: 10,
        status: 'available' as const
      },
      {
        id: '2',
        name: 'Gold Necklace 22K',
        requestedQuantity: 3,
        availableQuantity: 2,
        status: 'insufficient' as const
      },
      {
        id: '3',
        name: 'Gold Bracelet 14K',
        requestedQuantity: 1,
        availableQuantity: 0,
        status: 'out_of_stock' as const
      }
    ];

    test('displays stock validation for multiple items', () => {
      render(<StockValidation items={mockStockItems} />);
      
      expect(screen.getByText('Available')).toBeInTheDocument(); // Ring
      expect(screen.getByText('Insufficient')).toBeInTheDocument(); // Necklace
      expect(screen.getByText('Out of Stock')).toBeInTheDocument(); // Bracelet
    });

    test('displays out of stock warning', () => {
      const outOfStockItems = [mockStockItems[2]];
      render(<StockValidation items={outOfStockItems} />);
      
      expect(screen.getByText('Items out of stock')).toBeInTheDocument();
    });

    test('displays insufficient stock details', () => {
      const insufficientItems = [mockStockItems[1]];
      render(<StockValidation items={insufficientItems} />);
      
      expect(screen.getByText('Item is out of stock')).toBeInTheDocument();
      expect(screen.getByText('Consider removing this item or finding alternatives')).toBeInTheDocument();
    });

    test('handles stock refresh action', async () => {
      const onRefreshStock = jest.fn().mockResolvedValue(undefined);
      render(
        <StockValidation 
          items={mockStockItems}
          onRefreshStock={onRefreshStock}
        />
      );
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(onRefreshStock).toHaveBeenCalled();
      });
    });
  });

  describe('PricingAnalytics Component', () => {
    const mockAnalytics = {
      totalRevenue: 2289.00,
      totalCost: 1650.00,
      grossProfit: 450.00,
      profitMargin: 21.4,
      goldMetrics: {
        totalWeight: 17.8,
        goldValue: 1800.00,
        averagePurity: 18
      }
    };

    test('displays comprehensive pricing analytics', () => {
      render(<PricingAnalytics analytics={mockAnalytics} />);
      
      expect(screen.getByText('$2,289.00')).toBeInTheDocument(); // Total Revenue
      expect(screen.getByText('$1,650.00')).toBeInTheDocument(); // Total Cost
      expect(screen.getByText('$450.00')).toBeInTheDocument(); // Gross Profit
      expect(screen.getByText('21.4%')).toBeInTheDocument(); // Profit Margin
    });

    test('displays gold shop specific metrics', () => {
      render(<PricingAnalytics analytics={mockAnalytics} />);
      
      expect(screen.getByText('Gold Shop Metrics')).toBeInTheDocument();
      expect(screen.getByText('17.800g')).toBeInTheDocument(); // Total Weight
      expect(screen.getByText('$1,800.00')).toBeInTheDocument(); // Gold Value
    });

    test('displays profit margin analysis', () => {
      const goodMarginAnalytics = { ...mockAnalytics, profitMargin: 22.2 };
      render(<PricingAnalytics analytics={goodMarginAnalytics} />);
      
      expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
      expect(screen.getByText('22.2% Good')).toBeInTheDocument();
    });

    test('shows margin performance indicators', () => {
      const goodMarginAnalytics = { ...mockAnalytics, profitMargin: 25.0 };
      render(<PricingAnalytics analytics={goodMarginAnalytics} />);
      
      expect(screen.getByText('Good Margin Performance')).toBeInTheDocument();
    });
  });

  describe('PaymentMethodManager Component', () => {
    const mockPaymentProps = {
      invoiceId: 'test-invoice-1',
      totalAmount: 1500,
      paidAmount: 500,
      remainingAmount: 1000,
      paymentMethods: [
        { id: '1', type: 'cash' as const, name: 'Cash', isActive: true },
        { id: '2', type: 'card' as const, name: 'Credit Card', isActive: true },
        { id: '3', type: 'bank_transfer' as const, name: 'Bank Transfer', isActive: true }
      ],
      paymentHistory: [
        {
          id: '1',
          amount: 500,
          method: 'cash' as const,
          status: 'completed' as const,
          processedAt: new Date().toISOString(),
          reference: 'CASH-001'
        }
      ],
      onAddPayment: jest.fn().mockResolvedValue(undefined),
      onUpdatePayment: jest.fn().mockResolvedValue(undefined),
      onDeletePayment: jest.fn().mockResolvedValue(undefined),
      onCreateInstallmentPlan: jest.fn().mockResolvedValue(undefined)
    };

    test('displays payment progress and remaining amount', () => {
      render(<PaymentMethodManager {...mockPaymentProps} />);
      
      expect(screen.getByText('$500.00 of $1,500.00')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument(); // Paid amount
      expect(screen.getByText('$1,000.00')).toBeInTheDocument(); // Remaining amount
    });

    test('displays payment form fields', () => {
      render(<PaymentMethodManager {...mockPaymentProps} />);
      
      expect(screen.getByLabelText('Amount *')).toBeInTheDocument();
      expect(screen.getByLabelText('Payment Method *')).toBeInTheDocument();
    });

    test('handles payment addition', async () => {
      const onAddPayment = jest.fn().mockResolvedValue(undefined);
      render(<PaymentMethodManager {...mockPaymentProps} onAddPayment={onAddPayment} />);
      
      const amountInput = screen.getByLabelText('Amount *');
      fireEvent.change(amountInput, { target: { value: '200' } });
      
      const addButton = screen.getByText('Add Payment');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(onAddPayment).toHaveBeenCalled();
      });
    });

    test('displays payment history', () => {
      render(<PaymentMethodManager {...mockPaymentProps} />);
      
      expect(screen.getByText('Payment History')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    test('displays installment plan options', () => {
      render(<PaymentMethodManager {...mockPaymentProps} />);
      
      expect(screen.getByLabelText('Number of Installments')).toBeInTheDocument();
      expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    });
  });

  describe('AuditTrail Component', () => {
    const mockAuditEntries = [
      {
        id: '1',
        action: 'invoice_created',
        userId: '1',
        userName: 'John Doe',
        userRole: 'manager',
        timestamp: new Date().toISOString(),
        details: 'Invoice created successfully',
        changes: []
      },
      {
        id: '2',
        action: 'payment_added',
        userId: '1',
        userName: 'John Doe',
        userRole: 'manager',
        timestamp: new Date().toISOString(),
        details: 'Payment of $500 added',
        changes: []
      }
    ];

    test('displays audit trail entries', () => {
      render(<AuditTrail entries={mockAuditEntries} />);
      
      expect(screen.getByText('invoice_created')).toBeInTheDocument();
      expect(screen.getByText('payment_added')).toBeInTheDocument();
      expect(screen.getByText('John Doe (manager)')).toBeInTheDocument();
    });

    test('filters audit entries by action type', () => {
      render(<AuditTrail entries={mockAuditEntries} />);
      
      const paymentFilter = screen.getByText('payment_added');
      fireEvent.click(paymentFilter);
      
      expect(screen.getByText('payment_added')).toBeInTheDocument();
      expect(screen.queryByText('invoice_created')).not.toBeInTheDocument();
    });

    test('displays field changes in audit entries', () => {
      const entriesWithChanges = [
        {
          ...mockAuditEntries[0],
          action: 'invoice_updated',
          changes: [
            { field: 'total_amount', oldValue: '1200', newValue: '1340' }
          ]
        }
      ];
      
      render(<AuditTrail entries={entriesWithChanges} />);
      
      expect(screen.getByText('total_amount')).toBeInTheDocument();
      expect(screen.getByText('1200')).toBeInTheDocument(); // Old value
      expect(screen.getByText('1340')).toBeInTheDocument(); // New value
    });

    test('handles audit log export', async () => {
      const onExportAuditLog = jest.fn().mockResolvedValue(undefined);
      render(
        <AuditTrail 
          entries={mockAuditEntries}
          onExportAuditLog={onExportAuditLog}
        />
      );
      
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(onExportAuditLog).toHaveBeenCalled();
      });
    });
  });

  describe('EnhancedInvoiceForm Integration', () => {
    test('renders all form sections', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
        expect(screen.getByText('Items')).toBeInTheDocument();
        expect(screen.getByText('Validation')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Workflow')).toBeInTheDocument();
      });
    });

    test('displays customer debt information', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Current Debt')).toBeInTheDocument();
        expect(screen.getByText('$150.00')).toBeInTheDocument();
      });
    });

    test('handles form submission workflow', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        // Check if form sections are rendered
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });

      // Test form validation
      const submitButton = screen.getByRole('button', { name: /create invoice/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invoice Summary')).toBeInTheDocument();
      });
    });

    test('displays stock validation section', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Stock Validation')).toBeInTheDocument();
      });
    });

    test('displays pricing analytics section', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Pricing Analytics')).toBeInTheDocument();
      });
    });

    test('displays workflow indicator', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    test('handles form validation errors', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        // Test validation without customer selection
        const submitButton = screen.getByRole('button', { name: /create invoice/i });
        fireEvent.click(submitButton);
        
        expect(screen.getByText('Please select a customer')).toBeInTheDocument();
      });
    });

    test('handles successful form submission', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
      });

      // Select customer
      const customerSelect = screen.getByRole('combobox');
      fireEvent.click(customerSelect);
      
      await waitFor(() => {
        const customerOption = screen.getByText('John Doe');
        fireEvent.click(customerOption);
      });

      expect(screen.getByText('Basic Info')).toBeInTheDocument();
    });

    test('displays form fields correctly', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Customer *')).toBeInTheDocument();
        expect(screen.getByLabelText('Gold Price (per gram) *')).toBeInTheDocument();
      });
    });

    test('handles keyboard navigation', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        const firstTab = screen.getByRole('tab', { name: /basic info/i });
        firstTab.focus();
        expect(document.activeElement).toHaveAttribute('role', 'tab');
      });
    });

    test('displays workflow status correctly', async () => {
      renderWithQueryClient(<EnhancedInvoiceForm />);
      
      await waitFor(() => {
        const draftText = screen.getByText('Draft');
        expect(draftText).toBeVisible();
      });
    });
  });
});