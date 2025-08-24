import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Invoices } from '../pages/Invoices';

// Mock the hooks
jest.mock('../hooks/useInvoices', () => ({
  useInvoices: () => ({
    data: [
      {
        id: '1',
        invoice_number: 'INV-001',
        customer_id: 'customer-1',
        total_amount: 1000,
        paid_amount: 500,
        remaining_amount: 500,
        status: 'partially_paid',
        created_at: '2024-01-01T00:00:00Z',
        gold_price_per_gram: 50,
        labor_cost_percentage: 10,
        profit_percentage: 15,
        vat_percentage: 9
      }
    ],
    isLoading: false,
    error: null
  }),
  useInvoiceSummary: () => ({
    data: {
      total_invoices: 10,
      total_amount: 10000,
      total_paid: 7000,
      total_remaining: 3000
    }
  }),
  useInvoice: () => ({ data: null }),
  useDeleteInvoice: () => ({ mutate: jest.fn() }),
  useCalculateInvoice: () => ({ mutate: jest.fn(), isPending: false }),
  useCreateInvoice: () => ({ mutate: jest.fn(), isPending: false }),
  useAddPayment: () => ({ mutate: jest.fn(), isPending: false })
}));

jest.mock('../hooks/useCustomers', () => ({
  useCustomers: () => ({
    data: [
      {
        id: 'customer-1',
        name: 'John Doe',
        phone: '123-456-7890',
        email: 'john@example.com',
        current_debt: 100,
        total_purchases: 5000
      }
    ],
    isLoading: false
  })
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Invoice Components Gradient Styling - Simple Tests', () => {
  describe('Invoices Page Gradient Elements', () => {
    it('should render main page with gradient header icon', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Check for gradient header icon
      const headerIcon = document.querySelector('.bg-gradient-to-br.from-green-500.to-green-600');
      expect(headerIcon).toBeInTheDocument();
    });

    it('should render create button with gradient styling', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Check for gradient create button
      const createButton = screen.getByText('Create New Invoice');
      expect(createButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
      expect(createButton).toHaveClass('hover:from-green-600', 'hover:to-teal-700');
      expect(createButton).toHaveClass('shadow-lg', 'hover:shadow-xl');
    });

    it('should render summary cards with gradient backgrounds', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for gradient summary cards
        const totalInvoicesCard = document.querySelector('.bg-gradient-to-br.from-blue-50.to-indigo-100\\/50');
        expect(totalInvoicesCard).toBeInTheDocument();

        const totalValueCard = document.querySelector('.bg-gradient-to-br.from-emerald-50.to-teal-100\\/50');
        expect(totalValueCard).toBeInTheDocument();

        const paymentsCard = document.querySelector('.bg-gradient-to-br.from-green-50.to-emerald-100\\/50');
        expect(paymentsCard).toBeInTheDocument();

        const outstandingCard = document.querySelector('.bg-gradient-to-br.from-amber-50.to-orange-100\\/50');
        expect(outstandingCard).toBeInTheDocument();
      });
    });

    it('should render gradient icon containers in summary cards', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for gradient icon containers
        const blueIcon = document.querySelector('.bg-gradient-to-br.from-blue-500.to-indigo-600');
        expect(blueIcon).toBeInTheDocument();

        const emeraldIcon = document.querySelector('.bg-gradient-to-br.from-emerald-500.to-teal-600');
        expect(emeraldIcon).toBeInTheDocument();

        const greenIcon = document.querySelector('.bg-gradient-to-br.from-green-500.to-emerald-600');
        expect(greenIcon).toBeInTheDocument();

        const amberIcon = document.querySelector('.bg-gradient-to-br.from-amber-500.to-orange-600');
        expect(amberIcon).toBeInTheDocument();
      });
    });

    it('should render tab navigation with gradient background', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Check for gradient tab navigation background
      const tabContainer = document.querySelector('.bg-gradient-to-r.from-green-50.via-teal-50.to-blue-50');
      expect(tabContainer).toBeInTheDocument();
    });

    it('should render gradient text in summary values', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for gradient text in summary values
        const gradientText = document.querySelector('.bg-gradient-to-r.from-blue-600.to-indigo-600.bg-clip-text.text-transparent');
        expect(gradientText).toBeInTheDocument();
      });
    });

    it('should render gradient badges in summary cards', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for gradient badges
        const gradientBadges = document.querySelectorAll('.bg-gradient-to-r');
        expect(gradientBadges.length).toBeGreaterThan(5); // Multiple gradient elements
      });
    });

    it('should have proper shadow effects on cards', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for shadow effects
        const shadowElements = document.querySelectorAll('.shadow-lg');
        expect(shadowElements.length).toBeGreaterThan(0);

        const hoverShadowElements = document.querySelectorAll('.hover\\:shadow-xl');
        expect(hoverShadowElements.length).toBeGreaterThan(0);
      });
    });

    it('should have proper transition effects', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for transition effects
        const transitionElements = document.querySelectorAll('.transition-all.duration-300');
        expect(transitionElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Analytics Tab Gradient Styling', () => {
    it('should render analytics tab with gradient coming soon cards', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Click analytics tab
      const analyticsTab = screen.getByText('Analytics & Reports');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        // Check for gradient coming soon cards
        const emeraldCard = document.querySelector('.bg-gradient-to-br.from-emerald-50.to-teal-100\\/30');
        expect(emeraldCard).toBeInTheDocument();

        const blueCard = document.querySelector('.bg-gradient-to-br.from-blue-50.to-indigo-100\\/30');
        expect(blueCard).toBeInTheDocument();

        const purpleCard = document.querySelector('.bg-gradient-to-br.from-purple-50.to-violet-100\\/30');
        expect(purpleCard).toBeInTheDocument();
      });
    });

    it('should render gradient icon containers in analytics cards', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Click analytics tab
      const analyticsTab = screen.getByText('Analytics & Reports');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        // Check for gradient icon containers in analytics cards
        const emeraldIcon = document.querySelector('.bg-gradient-to-br.from-emerald-500.to-teal-600');
        expect(emeraldIcon).toBeInTheDocument();

        const blueIcon = document.querySelector('.bg-gradient-to-br.from-blue-500.to-indigo-600');
        expect(blueIcon).toBeInTheDocument();

        const purpleIcon = document.querySelector('.bg-gradient-to-br.from-purple-500.to-violet-600');
        expect(purpleIcon).toBeInTheDocument();
      });
    });

    it('should render gradient action card', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Click analytics tab
      const analyticsTab = screen.getByText('Analytics & Reports');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        // Check for gradient action card
        const actionCard = document.querySelector('.bg-gradient-to-r.from-green-50.via-teal-50.to-blue-50');
        expect(actionCard).toBeInTheDocument();
      });
    });
  });

  describe('Color Consistency', () => {
    it('should use consistent gradient color patterns', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for consistent green-teal gradient usage
        const greenTealElements = document.querySelectorAll('.from-green-500.to-teal-600');
        expect(greenTealElements.length).toBeGreaterThan(0);

        // Check for consistent blue-indigo gradient usage
        const blueIndigoElements = document.querySelectorAll('.from-blue-500.to-indigo-600');
        expect(blueIndigoElements.length).toBeGreaterThan(0);

        // Check for consistent emerald-teal gradient usage
        const emeraldTealElements = document.querySelectorAll('.from-emerald-500.to-teal-600');
        expect(emeraldTealElements.length).toBeGreaterThan(0);
      });
    });

    it('should maintain proper text contrast with gradient backgrounds', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check that text colors are properly set for gradient backgrounds
        const blueText = document.querySelector('.text-blue-700');
        expect(blueText).toBeInTheDocument();

        const emeraldText = document.querySelector('.text-emerald-700');
        expect(emeraldText).toBeInTheDocument();

        const greenText = document.querySelector('.text-green-700');
        expect(greenText).toBeInTheDocument();

        const amberText = document.querySelector('.text-amber-700');
        expect(amberText).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Elements', () => {
    it('should have proper hover effects on gradient buttons', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      const createButton = screen.getByText('Create New Invoice');
      expect(createButton).toHaveClass('hover:from-green-600', 'hover:to-teal-700');
      expect(createButton).toHaveClass('hover:shadow-xl');
      expect(createButton).toHaveClass('transition-all', 'duration-300');
    });

    it('should have proper card hover effects', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      await waitFor(() => {
        const cards = document.querySelectorAll('.hover\\:shadow-xl');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });
});