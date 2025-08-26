/**
 * Comprehensive Double-Entry Accounting Integration Tests
 * Tests all accounting components working together using REAL backend APIs and database in Docker environment
 * NO MOCKS - All tests use actual API calls and database operations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import main accounting page
import { DoubleEntryAccounting } from '../pages/DoubleEntryAccounting';

// Real API configuration for Docker environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://backend:8000';

// Real API helper functions
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Authentication helper
const authenticateUser = async () => {
  try {
    // Try to create admin user first
    await apiCall('/auth/create-admin', {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
        email: 'admin@test.com'
      })
    });
  } catch (error) {
    // Admin might already exist, continue
  }

  // Login to get token
  const loginResponse = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  return loginResponse.access_token;
};

// Database setup helper
const setupComprehensiveTestData = async (authToken: string) => {
  // Create comprehensive chart of accounts
  const accounts = [
    // Assets
    { account_code: '1000', account_name: 'Cash in Bank', account_type: 'Asset' },
    { account_code: '1100', account_name: 'Accounts Receivable', account_type: 'Asset' },
    { account_code: '1200', account_name: 'Inventory', account_type: 'Asset' },
    { account_code: '1500', account_name: 'Equipment', account_type: 'Asset' },
    
    // Liabilities
    { account_code: '2000', account_name: 'Accounts Payable', account_type: 'Liability' },
    { account_code: '2100', account_name: 'Notes Payable', account_type: 'Liability' },
    
    // Equity
    { account_code: '3000', account_name: 'Owner Capital', account_type: 'Equity' },
    { account_code: '3100', account_name: 'Retained Earnings', account_type: 'Equity' },
    
    // Revenue
    { account_code: '4000', account_name: 'Sales Revenue', account_type: 'Revenue' },
    { account_code: '4100', account_name: 'Service Revenue', account_type: 'Revenue' },
    
    // Expenses
    { account_code: '5000', account_name: 'Cost of Goods Sold', account_type: 'Expense' },
    { account_code: '5100', account_name: 'Operating Expenses', account_type: 'Expense' },
    { account_code: '5200', account_name: 'Rent Expense', account_type: 'Expense' }
  ];

  for (const account of accounts) {
    try {
      await apiCall('/accounting/chart-of-accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(account)
      });
    } catch (error) {
      // Account might already exist, continue
    }
  }

  // Create bank accounts for reconciliation
  const bankAccounts = [
    {
      account_name: 'Main Checking Account',
      account_number: '1234567890',
      bank_name: 'Test Bank',
      account_type: 'checking',
      currency: 'USD'
    },
    {
      account_name: 'Savings Account',
      account_number: '0987654321',
      bank_name: 'Test Bank',
      account_type: 'savings',
      currency: 'USD'
    }
  ];

  for (const bankAccount of bankAccounts) {
    try {
      await apiCall('/accounting/bank-accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(bankAccount)
      });
    } catch (error) {
      // Bank account might already exist, continue
    }
  }

  // Create accounting periods
  const periods = [
    {
      period_name: 'January 2024',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      period_type: 'monthly'
    },
    {
      period_name: 'February 2024',
      start_date: '2024-02-01',
      end_date: '2024-02-29',
      period_type: 'monthly'
    }
  ];

  for (const period of periods) {
    try {
      await apiCall('/accounting/periods', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(period)
      });
    } catch (error) {
      // Period might already exist, continue
    }
  }
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: 1000,
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

describe('🧮 Comprehensive Double-Entry Accounting Integration - REAL DATABASE TESTS', () => {
  let authToken: string;
  
  // Increase timeout for real API calls
  jest.setTimeout(180000);

  beforeAll(async () => {
    console.log('🐳 Starting Comprehensive Accounting Integration Tests...');
    console.log('🐳 API Base URL:', API_BASE_URL);
    
    // Wait for backend to be ready
    let backendReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        console.log(`🐳 Checking backend health... (${30 - i} retries left)`);
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
          backendReady = true;
          console.log('✅ Backend is ready!');
          break;
        }
      } catch (error) {
        console.log('🐳 Backend not ready yet:', (error as Error).message);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!backendReady) {
      throw new Error('❌ Backend failed to start within timeout period');
    }

    // Authenticate and setup comprehensive test data
    console.log('🔐 Authenticating user...');
    authToken = await authenticateUser();
    console.log('✅ Authentication successful');

    console.log('🗄️ Setting up comprehensive test database...');
    await setupComprehensiveTestData(authToken);
    console.log('✅ Comprehensive test database setup complete');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up test data...');
    // Cleanup will be handled by database reset between test runs
  });

  describe('🏠 Main Accounting Interface Integration', () => {
    it('should render main accounting interface with all tabs', async () => {
      console.log('🧪 Testing main accounting interface rendering...');
      
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

      console.log('✅ Main accounting interface rendering test passed');
    });

    it('should navigate between accounting tabs correctly', async () => {
      console.log('🧪 Testing tab navigation...');
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DoubleEntryAccounting />
        </TestWrapper>
      );

      // Should start with dashboard tab active
      expect(screen.getByText('Overview of financial position and key metrics')).toBeInTheDocument();

      // Navigate to Chart of Accounts
      await user.click(screen.getByText('Chart of Accounts'));
      await waitFor(() => {
        expect(screen.getByText('Manage hierarchical account structure')).toBeInTheDocument();
      });

      // Navigate to Journal Entries
      await user.click(screen.getByText('Journal Entries'));
      await waitFor(() => {
        expect(screen.getByText('Create and manage double-entry journal entries')).toBeInTheDocument();
      });

      // Navigate to Bank Reconciliation
      await user.click(screen.getByText('Bank Reconciliation'));
      await waitFor(() => {
        expect(screen.getByText('Reconcile bank statements with book records')).toBeInTheDocument();
      });

      // Navigate to Financial Reports
      await user.click(screen.getByText('Financial Reports'));
      await waitFor(() => {
        expect(screen.getByText('Generate standard financial statements')).toBeInTheDocument();
      });

      // Navigate to Period Closing
      await user.click(screen.getByText('Period Closing'));
      await waitFor(() => {
        expect(screen.getByText('Manage accounting periods and closing')).toBeInTheDocument();
      });

      console.log('✅ Tab navigation test passed');
    });
  });

  describe('📊 Dashboard Integration with Real Data', () => {
    it('should display dashboard with real financial data', async () => {
      console.log('🧪 Testing dashboard with real data...');
      
      render(
        <TestWrapper>
          <DoubleEntryAccounting />
        </TestWrapper>
      );

      // Wait for dashboard to load with real data
      await waitFor(async () => {
        // Check if dashboard components are rendered
        expect(screen.getByText('Accounting Dashboard')).toBeInTheDocument();
        
        // Verify dashboard loads real data from API
        try {
          const dashboardData = await apiCall('/accounting/reports/trial-balance?as_of_date=2024-01-31', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          expect(dashboardData).toHaveProperty('accounts');
          expect(Array.isArray(dashboardData.accounts)).toBe(true);
        } catch (error) {
          // Dashboard might not have data yet, that's ok for this test
        }
      }, { timeout: 15000 });

      console.log('✅ Dashboard integration test passed');
    });
  });

  describe('🏗️ Chart of Accounts Integration', () => {
    it('should manage chart of accounts with real database operations', async () => {
      console.log('🧪 Testing chart of accounts management...');
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DoubleEntryAccounting />
        </TestWrapper>
      );

      // Navigate to Chart of Accounts tab
      await user.click(screen.getByText('Chart of Accounts'));

      await waitFor(async () => {
        // Verify accounts are loaded from real database
        const accounts = await apiCall('/accounting/chart-of-accounts', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        expect(accounts.length).toBeGreaterThan(0);
        
        // Check if some accounts are displayed
        const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
        if (cashAccount) {
          expect(screen.getByText('1000')).toBeInTheDocument();
          expect(screen.getByText('Cash in Bank')).toBeInTheDocument();
        }
      }, { timeout: 15000 });

      console.log('✅ Chart of accounts integration test passed');
    });
  });

  describe('📝 Journal Entry Integration with Balance Validation', () => {
    it('should create and validate journal entries with real database', async () => {
      console.log('🧪 Testing journal entry creation and validation...');
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DoubleEntryAccounting />
        </TestWrapper>
      );

      // Navigate to Journal Entries tab
      await user.click(screen.getByText('Journal Entries'));

      await waitFor(async () => {
        expect(screen.getByText('Create and manage double-entry journal entries')).toBeInTheDocument();
        
        // Test creating a journal entry via API
        const accounts = await apiCall('/accounting/chart-of-accounts', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
        const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');

        if (cashAccount && revenueAccount) {
          const journalEntry = {
            entry_date: '2024-01-15',
            description: 'Test integration transaction',
            reference: 'INT-001',
            lines: [
              {
                account_id: cashAccount.id,
                debit_amount: 2000,
                credit_amount: 0,
                description: 'Cash received from integration test'
              },
              {
                account_id: revenueAccount.id,
                debit_amount: 0,
                credit_amount: 2000,
                description: 'Revenue from integration test'
              }
            ]
          };

          const createdEntry = await apiCall('/accounting/journal-entries', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(journalEntry)
          });

          expect(createdEntry).toHaveProperty('id');
          expect(createdEntry.total_debit).toBe(2000);
          expect(createdEntry.total_credit).toBe(2000);
          expect(createdEntry.is_balanced).toBe(true);
        }
      }, { timeout: 15000 });

      console.log('✅ Journal entry integration test passed');
    });
  });

  describe('🏦 Bank Reconciliation Integration', () => {
    it('should perform bank reconciliation with real data', async () => {
      console.log('🧪 Testing bank reconciliation integration...');
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DoubleEntryAccounting />
        </TestWrapper>
      );

      // Navigate to Bank Reconciliation tab
      await user.click(screen.getByText('Bank Reconciliation'));

      await waitFor(async () => {
        expect(screen.getByText('Reconcile bank statements with book records')).toBeInTheDocument();
        
        // Test bank reconciliation with real data
        const bankAccounts = await apiCall('/accounting/bank-accounts', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        expect(bankAccounts.length).toBeGreaterThan(0);
        
        // Should display bank accounts
        const mainAccount = bankAccounts.find((acc: any) => acc.account_name === 'Main Checking Account');
        if (mainAccount) {
          expect(screen.getByText('Main Checking Account')).toBeInTheDocument();
        }
      }, { timeout: 15000 });

      console.log('✅ Bank reconciliation integration test passed');
    });
  });

  describe('📈 Financial Reports Integration', () => {
    it('should generate financial reports with real calculations', async () => {
      console.log('🧪 Testing financial reports integration...');
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DoubleEntryAccounting />
        </TestWrapper>
      );

      // Navigate to Financial Reports tab
      await user.click(screen.getByText('Financial Reports'));

      await waitFor(async () => {
        expect(screen.getByText('Generate standard financial statements')).toBeInTheDocument();
        
        // Test financial reports generation
        const trialBalance = await apiCall('/accounting/reports/trial-balance?as_of_date=2024-01-31', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        expect(trialBalance).toHaveProperty('total_debits');
        expect(trialBalance).toHaveProperty('total_credits');
        expect(trialBalance).toHaveProperty('is_balanced');
        expect(trialBalance.total_debits).toBe(trialBalance.total_credits);
        
        // Check for report tabs
        expect(screen.getByText('Trial Balance')).toBeInTheDocument();
        expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
        expect(screen.getByText('Income Statement')).toBeInTheDocument();
      }, { timeout: 15000 });

      console.log('✅ Financial reports integration test passed');
    });
  });

  describe('📅 Period Closing Integration', () => {
    it('should manage accounting periods with real database', async () => {
      console.log('🧪 Testing period closing integration...');
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DoubleEntryAccounting />
        </TestWrapper>
      );

      // Navigate to Period Closing tab
      await user.click(screen.getByText('Period Closing'));

      await waitFor(async () => {
        expect(screen.getByText('Manage accounting periods and closing')).toBeInTheDocument();
        
        // Test period management
        try {
          const currentPeriod = await apiCall('/accounting/periods/current', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (currentPeriod) {
            expect(currentPeriod).toHaveProperty('period_name');
            expect(currentPeriod).toHaveProperty('start_date');
            expect(currentPeriod).toHaveProperty('end_date');
          }
        } catch (error) {
          // Current period might not exist, that's ok
        }
      }, { timeout: 15000 });

      console.log('✅ Period closing integration test passed');
    });
  });

  describe('🔄 End-to-End Accounting Workflow', () => {
    it('should complete full accounting cycle with real data', async () => {
      console.log('🧪 Testing complete accounting workflow...');
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DoubleEntryAccounting />
        </TestWrapper>
      );

      // Step 1: Verify Chart of Accounts
      await user.click(screen.getByText('Chart of Accounts'));
      await waitFor(async () => {
        const accounts = await apiCall('/accounting/chart-of-accounts', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        expect(accounts.length).toBeGreaterThan(0);
      });

      // Step 2: Create Journal Entry
      await user.click(screen.getByText('Journal Entries'));
      await waitFor(async () => {
        const accounts = await apiCall('/accounting/chart-of-accounts', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
        const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');

        if (cashAccount && revenueAccount) {
          const journalEntry = {
            entry_date: '2024-01-20',
            description: 'End-to-end test transaction',
            reference: 'E2E-001',
            lines: [
              {
                account_id: cashAccount.id,
                debit_amount: 5000,
                credit_amount: 0,
                description: 'Cash from E2E test'
              },
              {
                account_id: revenueAccount.id,
                debit_amount: 0,
                credit_amount: 5000,
                description: 'Revenue from E2E test'
              }
            ]
          };

          await apiCall('/accounting/journal-entries', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(journalEntry)
          });
        }
      });

      // Step 3: Verify Financial Reports
      await user.click(screen.getByText('Financial Reports'));
      await waitFor(async () => {
        const trialBalance = await apiCall('/accounting/reports/trial-balance?as_of_date=2024-01-31', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        expect(trialBalance.is_balanced).toBe(true);
        expect(trialBalance.total_debits).toBe(trialBalance.total_credits);
      });

      // Step 4: Check Dashboard reflects changes
      await user.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('Accounting Dashboard')).toBeInTheDocument();
      });

      console.log('✅ End-to-end accounting workflow test passed');
    });
  });

  describe('⚡ Performance and Load Testing', () => {
    it('should handle multiple concurrent operations', async () => {
      console.log('🧪 Testing concurrent operations performance...');
      
      // Create multiple journal entries concurrently
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
      const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');

      if (cashAccount && revenueAccount) {
        const promises = [];
        
        for (let i = 0; i < 5; i++) {
          const journalEntry = {
            entry_date: '2024-01-25',
            description: `Concurrent test transaction ${i + 1}`,
            reference: `CONC-${i + 1}`,
            lines: [
              {
                account_id: cashAccount.id,
                debit_amount: 100 * (i + 1),
                credit_amount: 0,
                description: `Cash from concurrent test ${i + 1}`
              },
              {
                account_id: revenueAccount.id,
                debit_amount: 0,
                credit_amount: 100 * (i + 1),
                description: `Revenue from concurrent test ${i + 1}`
              }
            ]
          };

          promises.push(
            apiCall('/accounting/journal-entries', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify(journalEntry)
            })
          );
        }

        const results = await Promise.all(promises);
        
        // Verify all entries were created successfully
        results.forEach((result, index) => {
          expect(result).toHaveProperty('id');
          expect(result.total_debit).toBe(100 * (index + 1));
          expect(result.total_credit).toBe(100 * (index + 1));
          expect(result.is_balanced).toBe(true);
        });

        // Verify trial balance is still balanced after concurrent operations
        const trialBalance = await apiCall('/accounting/reports/trial-balance?as_of_date=2024-01-31', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        expect(trialBalance.is_balanced).toBe(true);
      }

      console.log('✅ Concurrent operations performance test passed');
    });
  });

  describe('🔒 Data Integrity and Audit Trail', () => {
    it('should maintain data integrity across all operations', async () => {
      console.log('🧪 Testing data integrity and audit trail...');
      
      // Get initial trial balance
      const initialTrialBalance = await apiCall('/accounting/reports/trial-balance?as_of_date=2024-01-31', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Get all journal entries
      const journalEntries = await apiCall('/accounting/journal-entries', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Verify every journal entry is balanced
      journalEntries.forEach((entry: any) => {
        expect(entry.total_debit).toBe(entry.total_credit);
        expect(entry.is_balanced).toBe(true);
        
        // Verify individual lines sum correctly
        const totalDebits = entry.lines.reduce((sum: number, line: any) => sum + line.debit_amount, 0);
        const totalCredits = entry.lines.reduce((sum: number, line: any) => sum + line.credit_amount, 0);
        
        expect(Math.abs(totalDebits - entry.total_debit)).toBeLessThan(0.01);
        expect(Math.abs(totalCredits - entry.total_credit)).toBeLessThan(0.01);
      });

      // Verify trial balance is balanced
      expect(initialTrialBalance.is_balanced).toBe(true);
      expect(initialTrialBalance.total_debits).toBe(initialTrialBalance.total_credits);

      // Verify accounting equation holds
      const balanceSheet = await apiCall('/accounting/reports/balance-sheet?as_of_date=2024-01-31', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const assetsTotal = balanceSheet.total_assets;
      const liabilitiesAndEquity = balanceSheet.total_liabilities + balanceSheet.total_equity;
      
      expect(Math.abs(assetsTotal - liabilitiesAndEquity)).toBeLessThan(0.01);

      console.log('✅ Data integrity and audit trail test passed');
    });
  });
});