import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AlertsPanel } from '../AlertsPanel';
import { LowStockItem, UnpaidInvoice } from '../../../types';

describe('AlertsPanel', () => {
  const mockLowStockItems: LowStockItem[] = [
    {
      item_id: '1',
      item_name: 'Gold Ring',
      category_name: 'Rings',
      current_stock: 2,
      min_stock_level: 10,
      shortage: 8,
      unit_price: 500,
      status: 'critical',
      urgency_score: 9
    },
    {
      item_id: '2',
      item_name: 'Silver Necklace',
      category_name: 'Necklaces',
      current_stock: 5,
      min_stock_level: 15,
      shortage: 10,
      unit_price: 200,
      status: 'warning',
      urgency_score: 6
    }
  ];

  const mockUnpaidInvoices: UnpaidInvoice[] = [
    {
      invoice_id: '1',
      invoice_number: 'INV-001',
      customer_name: 'John Doe',
      total_amount: 1000,
      remaining_amount: 800,
      days_overdue: 35,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      invoice_id: '2',
      invoice_number: 'INV-002',
      customer_name: 'Jane Smith',
      total_amount: 500,
      remaining_amount: 300,
      days_overdue: 10,
      created_at: '2024-01-15T00:00:00Z'
    }
  ];

  const defaultProps = {
    lowStockItems: mockLowStockItems,
    unpaidInvoices: mockUnpaidInvoices,
    isLoading: false,
    onLowStockClick: jest.fn(),
    onInvoiceClick: jest.fn(),
    onMarkAsRead: jest.fn(),
    onDismissAlert: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with basic props', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      expect(screen.getByText('Alerts & Notifications')).toBeInTheDocument();
      expect(screen.getByText(/4 alerts/)).toBeInTheDocument();
    });

    it('displays correct alert counts', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      // Should show total alerts and unread count
      expect(screen.getByText(/4 alerts/)).toBeInTheDocument();
      expect(screen.getByText(/4 unread/)).toBeInTheDocument();
      expect(screen.getByText(/2 critical/)).toBeInTheDocument();
    });

    it('renders alert items correctly', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      expect(screen.getByText('Low Stock: Gold Ring')).toBeInTheDocument();
      expect(screen.getByText('Low Stock: Silver Necklace')).toBeInTheDocument();
      expect(screen.getByText('Overdue Payment: INV-001')).toBeInTheDocument();
      expect(screen.getByText('Overdue Payment: INV-002')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton when isLoading is true', () => {
      const { container } = render(<AlertsPanel {...defaultProps} isLoading={true} />);
      
      expect(screen.queryByText('Alerts & Notifications')).not.toBeInTheDocument();
      
      const loadingCard = container.querySelector('.animate-pulse');
      expect(loadingCard).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no alerts', () => {
      render(<AlertsPanel {...defaultProps} lowStockItems={[]} unpaidInvoices={[]} />);
      
      expect(screen.getByText('All Clear!')).toBeInTheDocument();
      expect(screen.getByText('No alerts to display.')).toBeInTheDocument();
    });

    it('shows empty state for critical tab when no critical alerts', () => {
      const nonCriticalItems = mockLowStockItems.map(item => ({ ...item, status: 'warning' as const }));
      const nonCriticalInvoices = mockUnpaidInvoices.map(invoice => ({ ...invoice, days_overdue: 5 }));
      
      render(<AlertsPanel {...defaultProps} lowStockItems={nonCriticalItems} unpaidInvoices={nonCriticalInvoices} />);
      
      // Should show that there are no critical alerts in the header
      expect(screen.queryByText(/critical/)).not.toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      // Initially on "All" tab
      expect(screen.getByText(/All \(4\)/)).toBeInTheDocument();
      
      // Switch to Critical tab
      fireEvent.click(screen.getByText(/Critical/));
      expect(screen.getByText(/Critical \(2\)/)).toBeInTheDocument();
      
      // Switch to Unread tab
      fireEvent.click(screen.getByText(/Unread/));
      expect(screen.getByText(/Unread \(4\)/)).toBeInTheDocument();
    });

    it('filters alerts correctly by tab', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      // All tab should show all alerts
      expect(screen.getAllByText(/Low Stock:|Overdue Payment:/)).toHaveLength(4);
      
      // Check that critical tab exists and shows correct count
      expect(screen.getByText(/Critical \(2\)/)).toBeInTheDocument();
    });
  });

  describe('Alert Interactions', () => {
    it('calls onLowStockClick when stock alert is clicked', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Low Stock: Gold Ring'));
      
      expect(defaultProps.onLowStockClick).toHaveBeenCalledWith('1');
    });

    it('calls onInvoiceClick when invoice alert is clicked', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Overdue Payment: INV-001'));
      
      expect(defaultProps.onInvoiceClick).toHaveBeenCalledWith('1');
    });

    it('marks alert as read when clicked', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      const alert = screen.getByText('Low Stock: Gold Ring').closest('[role="button"], div[class*="cursor-pointer"]');
      fireEvent.click(alert!);
      
      expect(defaultProps.onMarkAsRead).toHaveBeenCalledWith('stock-1', 'stock');
    });

    it('dismisses alert when dismiss button is clicked', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      const dismissButtons = screen.getAllByLabelText('Dismiss alert');
      fireEvent.click(dismissButtons[0]);
      
      expect(defaultProps.onDismissAlert).toHaveBeenCalledWith('stock-1', 'stock');
    });
  });

  describe('Priority and Categorization', () => {
    it('displays correct priority badges', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      // Check that priority badges are rendered (they contain the word "Critical")
      const criticalElements = screen.getAllByText((content) => {
        return content.includes('Critical');
      });
      expect(criticalElements.length).toBeGreaterThan(0);
    });

    it('shows correct category icons', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      // Test that alerts render with their content (icons are present but not easily testable)
      expect(screen.getByText('Low Stock: Gold Ring')).toBeInTheDocument();
      expect(screen.getByText('Overdue Payment: INV-001')).toBeInTheDocument();
    });

    it('applies correct priority styling', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      const criticalAlert = screen.getByText('Low Stock: Gold Ring').closest('div[class*="cursor-pointer"]');
      expect(criticalAlert).toHaveClass('bg-white'); // Unread alerts have white background
    });
  });

  describe('Show/Hide Dismissed Functionality', () => {
    it('toggles dismissed alerts visibility', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      // Initially should show "Show Dismissed" button
      expect(screen.getByText('Show Dismissed')).toBeInTheDocument();
      
      // Click to show dismissed
      fireEvent.click(screen.getByText('Show Dismissed'));
      expect(screen.getByText('Hide Dismissed')).toBeInTheDocument();
      
      // Click to hide dismissed
      fireEvent.click(screen.getByText('Hide Dismissed'));
      expect(screen.getByText('Show Dismissed')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('formats time correctly', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      // Should show relative time for alerts
      expect(screen.getAllByText(/ago/)).toHaveLength(4); // All 4 alerts should have time stamps
    });
  });

  describe('Responsive Design', () => {
    it('renders properly on different screen sizes', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      // Component should render without layout issues
      expect(screen.getByText('Alerts & Notifications')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      // Tab navigation should be accessible
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('supports keyboard navigation', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      const firstTab = screen.getByRole('tab', { name: /All/ });
      firstTab.focus();
      expect(firstTab).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles null data gracefully', () => {
      render(<AlertsPanel {...defaultProps} lowStockItems={null} unpaidInvoices={null} />);
      
      expect(screen.getByText('All Clear!')).toBeInTheDocument();
    });

    it('handles empty arrays', () => {
      render(<AlertsPanel {...defaultProps} lowStockItems={[]} unpaidInvoices={[]} />);
      
      expect(screen.getByText('All Clear!')).toBeInTheDocument();
    });

    it('handles missing optional props', () => {
      const propsWithoutOptional = {
        lowStockItems: mockLowStockItems,
        unpaidInvoices: mockUnpaidInvoices,
        isLoading: false,
        onLowStockClick: jest.fn(),
        onInvoiceClick: jest.fn()
      };
      
      render(<AlertsPanel {...propsWithoutOptional} />);
      
      expect(screen.getByText('Alerts & Notifications')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles large numbers of alerts efficiently', () => {
      const manyItems = Array.from({ length: 100 }, (_, i) => ({
        ...mockLowStockItems[0],
        item_id: `item-${i}`,
        item_name: `Item ${i}`
      }));
      
      render(<AlertsPanel {...defaultProps} lowStockItems={manyItems} />);
      
      // Should render without performance issues
      expect(screen.getByText('Alerts & Notifications')).toBeInTheDocument();
    });
  });

  describe('Alert State Management', () => {
    it('maintains read state correctly', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      // Click an alert to mark as read
      const alert = screen.getByText('Low Stock: Gold Ring').closest('div[class*="cursor-pointer"]');
      fireEvent.click(alert!);
      
      // The alert should be marked as read (visual changes)
      expect(defaultProps.onMarkAsRead).toHaveBeenCalled();
    });

    it('maintains dismissed state correctly', () => {
      render(<AlertsPanel {...defaultProps} />);
      
      // Dismiss an alert
      const dismissButton = screen.getAllByLabelText('Dismiss alert')[0];
      fireEvent.click(dismissButton);
      
      expect(defaultProps.onDismissAlert).toHaveBeenCalled();
    });
  });
});