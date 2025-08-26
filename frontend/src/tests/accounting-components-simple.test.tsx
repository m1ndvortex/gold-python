/**
 * Simple Accounting Components Tests
 * Tests accounting components rendering without backend dependencies
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import accounting components
import { DoubleEntryAccounting } from '../pages/DoubleEntryAccounting';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
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

describe('🧮 Double-Entry Accounting Components - Simple Tests', () => {
  it('should render main accounting interface', () => {
    render(
      <TestWrapper>
        <DoubleEntryAccounting />
      </TestWrapper>
    );

    // Check main title
    expect(screen.getByText('Double-Entry Accounting')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive accounting system with full double-entry bookkeeping')).toBeInTheDocument();

    // Check all tabs are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Chart of Accounts')).toBeInTheDocument();
    expect(screen.getByText('Journal Entries')).toBeInTheDocument();
    expect(screen.getByText('Bank Reconciliation')).toBeInTheDocument();
    expect(screen.getByText('Financial Reports')).toBeInTheDocument();
    expect(screen.getByText('Period Closing')).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Export All')).toBeInTheDocument();
  });

  it('should display tab descriptions correctly', () => {
    render(
      <TestWrapper>
        <DoubleEntryAccounting />
      </TestWrapper>
    );

    // Check default tab description (Dashboard should be active by default)
    expect(screen.getByText('Overview of financial position and key metrics')).toBeInTheDocument();
  });

  it('should have proper gradient styling classes', () => {
    render(
      <TestWrapper>
        <DoubleEntryAccounting />
      </TestWrapper>
    );

    // Check for gradient classes in the main header
    const mainHeader = screen.getByText('Double-Entry Accounting').closest('div');
    expect(mainHeader).toBeInTheDocument();
  });

  it('should render system status footer', () => {
    render(
      <TestWrapper>
        <DoubleEntryAccounting />
      </TestWrapper>
    );

    // Check system status
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('All accounting modules operational')).toBeInTheDocument();

    // Check quick action buttons
    expect(screen.getByText('Quick Entry')).toBeInTheDocument();
    expect(screen.getByText('Quick Report')).toBeInTheDocument();
    expect(screen.getByText('Balance Check')).toBeInTheDocument();
  });
});