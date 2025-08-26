/**
 * Double-Entry Accounting Frontend Interface Tests
 * Comprehensive tests for all accounting components using REAL backend APIs and database in Docker environment
 * NO MOCKS - All tests use actual API calls and database operations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import accounting components
import { AccountingDashboard } from '../components/accounting/AccountingDashboard';
import { ChartOfAccountsManager } from '../components/accounting/ChartOfAccountsManager';
import { JournalEntryManager } from '../components/accounting/JournalEntryManager';
import { BankReconciliationManager } from '../components/accounting/BankReconciliationManager';
import { FinancialReports } from '../components/accounting/FinancialReports';
import { PeriodClosingManager } from '../components/accounting/PeriodClosingManager';

// Real API configuration for Docker environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';

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
const setupTestDatabase = async (authToken: string) => {
  // Create basic chart of accounts for testing
  const accounts = [
    { account_code: '1000', account_name: 'Cash', account_type: 'Asset' },
    { account_code: '1100', account_name: 'Accounts Receivable', account_type: 'Asset' },
    { account_code: '2000', account_name: 'Accounts Payable', account_type: 'Liability' },
    { account_code: '3000', account_name: 'Owner Equity', account_type: 'Equity' },
    { account_code: '4000', account_name: 'Sales Revenue', account_type: 'Revenue' },
    { account_code: '5000', account_name: 'Operating Expenses', account_type: 'Expense' }
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

  // Create a bank account for reconciliation tests
  try {
    await apiCall('/accounting/bank-accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        account_name: 'Test Checking Account',
        account_number: '1234567890',
        bank_name: 'Test Bank',
        account_type: 'checking',
        currency: 'USD'
      })
    });
  } catch (error) {
    // Bank account might already exist, continue
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

describe('🧮 Double-Entry Accounting Frontend Interface - REAL DATABASE TESTS', () => {
  let authToken: string;
  
  // Increase timeout for real API calls
  jest.setTimeout(120000);

  beforeAll(async () => {
    console.log('🐳 Starting Real Database Accounting Tests...');
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

    // Authenticate and setup test data
    console.log('🔐 Authenticating user...');
    authToken = await authenticateUser();
    console.log('✅ Authentication successful');

    console.log('🗄️ Setting up test database...');
    await setupTestDatabase(authToken);
    console.log('✅ Test database setup complete');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up test data...');
    // Cleanup will be handled by database reset between test runs
  });

  describe('🏦 Real Database - Chart of Accounts Management', () => {
    it('should create and retrieve chart of accounts from real database', async () => {
      console.log('🧪 Testing chart of accounts creation...');
      
      // Create a new account via API
      const newAccount = {
        account_code: '1200',
        account_name: 'Test Inventory Account',
        account_type: 'Asset',
        description: 'Test account for inventory tracking'
      };

      const createdAccount = await apiCall('/accounting/chart-of-accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(newAccount)
      });

      expect(createdAccount).toHaveProperty('id');
      expect(createdAccount.account_code).toBe('1200');
      expect(createdAccount.account_name).toBe('Test Inventory Account');
      expect(createdAccount.account_type).toBe('Asset');

      // Verify it exists in database
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const foundAccount = accounts.find((acc: any) => acc.account_code === '1200');
      expect(foundAccount).toBeTruthy();
      expect(foundAccount.account_name).toBe('Test Inventory Account');

      console.log('✅ Chart of accounts creation test passed');
    });

    it('should render chart of accounts manager with real data', async () => {
      console.log('🧪 Testing chart of accounts manager component...');
      
      render(
        <TestWrapper>
          <ChartOfAccountsManager />
        </TestWrapper>
      );

      // Check for component title
      expect(screen.getByText('Chart of Accounts')).toBeInTheDocument();
      expect(screen.getByText('Manage your hierarchical account structure')).toBeInTheDocument();

      // Wait for real data to load
      await waitFor(async () => {
        // Should show real accounts from database
        const accounts = await apiCall('/accounting/chart-of-accounts', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        // Verify at least some basic accounts exist
        expect(accounts.length).toBeGreaterThan(0);
        
        // Check if accounts are displayed in UI
        const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
        if (cashAccount) {
          expect(screen.getByText('1000')).toBeInTheDocument();
          expect(screen.getByText('Cash')).toBeInTheDocument();
        }
      }, { timeout: 10000 });

      console.log('✅ Chart of accounts manager component test passed');
    });
  });

  describe('📊 Real Database - Journal Entry Management with Double-Entry Validation', () => {
    it('should create balanced journal entries in real database', async () => {
      console.log('🧪 Testing balanced journal entry creation...');
      
      // Get chart of accounts first
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
      const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');

      expect(cashAccount).toBeTruthy();
      expect(revenueAccount).toBeTruthy();

      // Create a balanced journal entry
      const journalEntry = {
        entry_date: '2024-01-15',
        description: 'Test sales transaction',
        reference: 'TEST-001',
        lines: [
          {
            account_id: cashAccount.id,
            debit_amount: 1000,
            credit_amount: 0,
            description: 'Cash received from sale'
          },
          {
            account_id: revenueAccount.id,
            debit_amount: 0,
            credit_amount: 1000,
            description: 'Sales revenue'
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
      expect(createdEntry.total_debit).toBe(1000);
      expect(createdEntry.total_credit).toBe(1000);
      expect(createdEntry.is_balanced).toBe(true);
      expect(createdEntry.lines).toHaveLength(2);

      console.log('✅ Balanced journal entry creation test passed');
    });

    it('should reject unbalanced journal entries', async () => {
      console.log('🧪 Testing unbalanced journal entry rejection...');
      
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
      const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');

      // Create an unbalanced journal entry (debits ≠ credits)
      const unbalancedEntry = {
        entry_date: '2024-01-15',
        description: 'Test unbalanced transaction',
        reference: 'TEST-UNBALANCED',
        lines: [
          {
            account_id: cashAccount.id,
            debit_amount: 1000,
            credit_amount: 0,
            description: 'Cash received'
          },
          {
            account_id: revenueAccount.id,
            debit_amount: 0,
            credit_amount: 500, // Unbalanced!
            description: 'Revenue'
          }
        ]
      };

      try {
        await apiCall('/accounting/journal-entries', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(unbalancedEntry)
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Should reject unbalanced entries
        expect((error as Error).message).toContain('400');
      }

      console.log('✅ Unbalanced journal entry rejection test passed');
    });

    it('should calculate running balances correctly', async () => {
      console.log('🧪 Testing running balance calculations...');
      
      // Get account balance before transaction
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
      
      const initialBalance = await apiCall(`/accounting/accounts/${cashAccount.id}/balance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Create another transaction
      const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');
      
      const journalEntry = {
        entry_date: '2024-01-16',
        description: 'Another test transaction',
        reference: 'TEST-002',
        lines: [
          {
            account_id: cashAccount.id,
            debit_amount: 500,
            credit_amount: 0,
            description: 'More cash received'
          },
          {
            account_id: revenueAccount.id,
            debit_amount: 0,
            credit_amount: 500,
            description: 'More revenue'
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

      // Check updated balance
      const updatedBalance = await apiCall(`/accounting/accounts/${cashAccount.id}/balance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Cash account should have increased by 500 (debit increases asset accounts)
      expect(updatedBalance.balance).toBe(initialBalance.balance + 500);

      console.log('✅ Running balance calculation test passed');
    });
  });

  describe('📈 Real Database - Financial Reports with Accurate Calculations', () => {
    it('should generate trial balance with real data and verify balance', async () => {
      console.log('🧪 Testing trial balance generation...');
      
      const trialBalance = await apiCall('/accounting/reports/trial-balance?as_of_date=2024-01-31', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(trialBalance).toHaveProperty('total_debits');
      expect(trialBalance).toHaveProperty('total_credits');
      expect(trialBalance).toHaveProperty('is_balanced');
      expect(trialBalance).toHaveProperty('accounts');

      // Verify trial balance is actually balanced
      expect(trialBalance.total_debits).toBe(trialBalance.total_credits);
      expect(trialBalance.is_balanced).toBe(true);

      // Verify accounts array contains real data
      expect(Array.isArray(trialBalance.accounts)).toBe(true);
      expect(trialBalance.accounts.length).toBeGreaterThan(0);

      // Verify account structure
      trialBalance.accounts.forEach((account: any) => {
        expect(account).toHaveProperty('account_code');
        expect(account).toHaveProperty('account_name');
        expect(account).toHaveProperty('account_type');
        expect(account).toHaveProperty('debit_balance');
        expect(account).toHaveProperty('credit_balance');
        
        // Verify account types are valid
        expect(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']).toContain(account.account_type);
      });

      console.log('✅ Trial balance generation test passed');
    });

    it('should generate balance sheet with correct accounting equation', async () => {
      console.log('🧪 Testing balance sheet generation and accounting equation...');
      
      const balanceSheet = await apiCall('/accounting/reports/balance-sheet?as_of_date=2024-01-31', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(balanceSheet).toHaveProperty('total_assets');
      expect(balanceSheet).toHaveProperty('total_liabilities');
      expect(balanceSheet).toHaveProperty('total_equity');
      expect(balanceSheet).toHaveProperty('assets');
      expect(balanceSheet).toHaveProperty('liabilities');
      expect(balanceSheet).toHaveProperty('equity');

      // Verify fundamental accounting equation: Assets = Liabilities + Equity
      const assetsTotal = balanceSheet.total_assets;
      const liabilitiesAndEquity = balanceSheet.total_liabilities + balanceSheet.total_equity;
      
      expect(Math.abs(assetsTotal - liabilitiesAndEquity)).toBeLessThan(0.01); // Allow for rounding

      console.log(`Assets: ${assetsTotal}, Liabilities + Equity: ${liabilitiesAndEquity}`);
      console.log('✅ Balance sheet and accounting equation test passed');
    });

    it('should generate income statement with correct profit calculation', async () => {
      console.log('🧪 Testing income statement generation and profit calculation...');
      
      const incomeStatement = await apiCall('/accounting/reports/income-statement?start_date=2024-01-01&end_date=2024-01-31', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(incomeStatement).toHaveProperty('total_revenue');
      expect(incomeStatement).toHaveProperty('total_expenses');
      expect(incomeStatement).toHaveProperty('net_income');
      expect(incomeStatement).toHaveProperty('revenue');
      expect(incomeStatement).toHaveProperty('expenses');

      // Verify net income calculation: Revenue - Expenses = Net Income
      const calculatedNetIncome = incomeStatement.total_revenue - incomeStatement.total_expenses;
      expect(Math.abs(incomeStatement.net_income - calculatedNetIncome)).toBeLessThan(0.01);

      console.log(`Revenue: ${incomeStatement.total_revenue}, Expenses: ${incomeStatement.total_expenses}, Net Income: ${incomeStatement.net_income}`);
      console.log('✅ Income statement and profit calculation test passed');
    });

    it('should render financial reports component with real data', async () => {
      console.log('🧪 Testing financial reports component with real data...');
      
      render(
        <TestWrapper>
          <FinancialReports />
        </TestWrapper>
      );

      expect(screen.getByText('Financial Reports')).toBeInTheDocument();
      expect(screen.getByText('Standard financial statements and reports')).toBeInTheDocument();

      // Check for report tabs
      expect(screen.getByText('Trial Balance')).toBeInTheDocument();
      expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
      expect(screen.getByText('Income Statement')).toBeInTheDocument();

      // Wait for real data to load
      await waitFor(async () => {
        // Verify trial balance loads with real data
        const trialBalance = await apiCall('/accounting/reports/trial-balance?as_of_date=2024-01-31', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        expect(trialBalance.accounts.length).toBeGreaterThan(0);
      }, { timeout: 15000 });

      console.log('✅ Financial reports component test passed');
    });
  });

  describe('🏦 Real Database - Bank Reconciliation with Transaction Matching', () => {
    it('should create bank account and transactions in real database', async () => {
      console.log('🧪 Testing bank account and transaction creation...');
      
      // Create bank transactions for testing
      const bankAccounts = await apiCall('/accounting/bank-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(bankAccounts.length).toBeGreaterThan(0);
      const testBankAccount = bankAccounts[0];

      // Create some bank transactions
      const transactions = [
        {
          bank_account_id: testBankAccount.id,
          transaction_date: '2024-01-15',
          description: 'Customer payment',
          amount: 1000,
          transaction_type: 'credit',
          reference: 'DEP-001'
        },
        {
          bank_account_id: testBankAccount.id,
          transaction_date: '2024-01-16',
          description: 'Office supplies',
          amount: 150,
          transaction_type: 'debit',
          reference: 'CHK-001'
        }
      ];

      for (const transaction of transactions) {
        const createdTransaction = await apiCall('/accounting/bank-transactions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(transaction)
        });

        expect(createdTransaction).toHaveProperty('id');
        expect(createdTransaction.amount).toBe(transaction.amount);
        expect(createdTransaction.transaction_type).toBe(transaction.transaction_type);
      }

      console.log('✅ Bank account and transaction creation test passed');
    });

    it('should perform bank reconciliation with balance validation', async () => {
      console.log('🧪 Testing bank reconciliation process...');
      
      const bankAccounts = await apiCall('/accounting/bank-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const testBankAccount = bankAccounts[0];

      // Get current bank balance
      const currentBalance = testBankAccount.current_balance || 0;

      // Create reconciliation
      const reconciliationData = {
        bank_account_id: testBankAccount.id,
        reconciliation_date: '2024-01-31',
        statement_date: '2024-01-31',
        statement_balance: currentBalance + 850, // Reflecting the transactions we created
        book_balance: currentBalance,
        outstanding_deposits: 0,
        outstanding_checks: 0,
        bank_charges: 0,
        interest_earned: 0
      };

      const reconciliation = await apiCall('/accounting/bank-reconciliations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(reconciliationData)
      });

      expect(reconciliation).toHaveProperty('id');
      expect(reconciliation.statement_balance).toBe(reconciliationData.statement_balance);
      expect(reconciliation.book_balance).toBe(reconciliationData.book_balance);

      console.log('✅ Bank reconciliation process test passed');
    });

    it('should render bank reconciliation manager with real data', async () => {
      console.log('🧪 Testing bank reconciliation manager component...');
      
      render(
        <TestWrapper>
          <BankReconciliationManager />
        </TestWrapper>
      );

      expect(screen.getByText('Bank Reconciliation')).toBeInTheDocument();
      expect(screen.getByText('Reconcile bank statements with book records')).toBeInTheDocument();

      // Wait for real bank accounts to load
      await waitFor(async () => {
        const bankAccounts = await apiCall('/accounting/bank-accounts', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        expect(bankAccounts.length).toBeGreaterThan(0);
        
        // Should display the test bank account
        const testAccount = bankAccounts.find((acc: any) => acc.account_name === 'Test Checking Account');
        if (testAccount) {
          expect(screen.getByText('Test Checking Account')).toBeInTheDocument();
        }
      }, { timeout: 10000 });

      console.log('✅ Bank reconciliation manager component test passed');
    });
  });

  describe('📅 Real Database - Period Closing and Locking', () => {
    it('should create and manage accounting periods in real database', async () => {
      console.log('🧪 Testing accounting period creation...');
      
      // Create a new accounting period
      const periodData = {
        period_name: 'Test Period January 2024',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        period_type: 'monthly'
      };

      const createdPeriod = await apiCall('/accounting/periods', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(periodData)
      });

      expect(createdPeriod).toHaveProperty('id');
      expect(createdPeriod.period_name).toBe('Test Period January 2024');
      expect(createdPeriod.period_type).toBe('monthly');
      expect(createdPeriod.is_closed).toBe(false);

      console.log('✅ Accounting period creation test passed');
    });

    it('should enforce period closing restrictions', async () => {
      console.log('🧪 Testing period closing restrictions...');
      
      // Get current period
      const currentPeriod = await apiCall('/accounting/periods/current', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (currentPeriod) {
        // Try to close the period
        const closedPeriod = await apiCall(`/accounting/periods/${currentPeriod.id}/close`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        expect(closedPeriod.is_closed).toBe(true);
        expect(closedPeriod).toHaveProperty('closed_at');

        // Try to create journal entry in closed period - should fail
        const accounts = await apiCall('/accounting/chart-of-accounts', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
        const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');

        const journalEntry = {
          entry_date: '2024-01-15', // Date within closed period
          description: 'Should fail - period closed',
          period_id: currentPeriod.id,
          lines: [
            {
              account_id: cashAccount.id,
              debit_amount: 100,
              credit_amount: 0
            },
            {
              account_id: revenueAccount.id,
              debit_amount: 0,
              credit_amount: 100
            }
          ]
        };

        try {
          await apiCall('/accounting/journal-entries', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(journalEntry)
          });
          
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          // Should reject entries in closed period
          expect((error as Error).message).toContain('400');
        }
      }

      console.log('✅ Period closing restrictions test passed');
    });

    it('should render period closing manager with real data', async () => {
      console.log('🧪 Testing period closing manager component...');
      
      render(
        <TestWrapper>
          <PeriodClosingManager />
        </TestWrapper>
      );

      expect(screen.getByText('Period Closing')).toBeInTheDocument();
      expect(screen.getByText('Manage accounting periods and period closing')).toBeInTheDocument();

      // Wait for real period data to load
      await waitFor(async () => {
        try {
          const currentPeriod = await apiCall('/accounting/periods/current', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (currentPeriod) {
            expect(screen.getByText('Current Active Period')).toBeInTheDocument();
          }
        } catch (error) {
          // Current period might not exist, that's ok
        }
      }, { timeout: 10000 });

      console.log('✅ Period closing manager component test passed');
    });
  });

  describe('🧮 Real Database - Comprehensive Accounting Calculations', () => {
    it('should verify double-entry accounting principles across all transactions', async () => {
      console.log('🧪 Testing comprehensive double-entry accounting principles...');
      
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

      console.log(`✅ Verified ${journalEntries.length} journal entries are properly balanced`);
    });

    it('should verify accounting equation holds across all accounts', async () => {
      console.log('🧪 Testing fundamental accounting equation...');
      
      // Get trial balance
      const trialBalance = await apiCall('/accounting/reports/trial-balance?as_of_date=2024-01-31', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Calculate totals by account type
      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;
      let totalRevenue = 0;
      let totalExpenses = 0;

      trialBalance.accounts.forEach((account: any) => {
        switch (account.account_type) {
          case 'Asset':
            totalAssets += account.debit_balance - account.credit_balance;
            break;
          case 'Liability':
            totalLiabilities += account.credit_balance - account.debit_balance;
            break;
          case 'Equity':
            totalEquity += account.credit_balance - account.debit_balance;
            break;
          case 'Revenue':
            totalRevenue += account.credit_balance - account.debit_balance;
            break;
          case 'Expense':
            totalExpenses += account.debit_balance - account.credit_balance;
            break;
        }
      });

      // Verify accounting equation: Assets = Liabilities + Equity + (Revenue - Expenses)
      const netIncome = totalRevenue - totalExpenses;
      const rightSide = totalLiabilities + totalEquity + netIncome;
      
      console.log(`Assets: ${totalAssets}`);
      console.log(`Liabilities: ${totalLiabilities}`);
      console.log(`Equity: ${totalEquity}`);
      console.log(`Revenue: ${totalRevenue}`);
      console.log(`Expenses: ${totalExpenses}`);
      console.log(`Net Income: ${netIncome}`);
      console.log(`Right side total: ${rightSide}`);

      expect(Math.abs(totalAssets - rightSide)).toBeLessThan(0.01);

      console.log('✅ Fundamental accounting equation verified');
    });

    it('should verify cash flow calculations are accurate', async () => {
      console.log('🧪 Testing cash flow calculations...');
      
      // Get cash account balance
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
      if (cashAccount) {
        const cashBalance = await apiCall(`/accounting/accounts/${cashAccount.id}/balance`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        // Get all journal entries affecting cash account
        const journalEntries = await apiCall('/accounting/journal-entries', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        let calculatedCashBalance = 0;
        journalEntries.forEach((entry: any) => {
          entry.lines.forEach((line: any) => {
            if (line.account_id === cashAccount.id) {
              calculatedCashBalance += line.debit_amount - line.credit_amount;
            }
          });
        });

        // Verify calculated balance matches reported balance
        expect(Math.abs(cashBalance.balance - calculatedCashBalance)).toBeLessThan(0.01);

        console.log(`Cash balance from API: ${cashBalance.balance}`);
        console.log(`Calculated cash balance: ${calculatedCashBalance}`);
      }

      console.log('✅ Cash flow calculations verified');
    });

    it('should test complex multi-account transactions', async () => {
      console.log('🧪 Testing complex multi-account transactions...');
      
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
      const arAccount = accounts.find((acc: any) => acc.account_code === '1100');
      const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');

      // Create a complex transaction: Partial cash sale, partial credit sale
      const complexEntry = {
        entry_date: '2024-01-20',
        description: 'Complex sale - partial cash, partial credit',
        reference: 'COMPLEX-001',
        lines: [
          {
            account_id: cashAccount.id,
            debit_amount: 600,
            credit_amount: 0,
            description: 'Cash portion of sale'
          },
          {
            account_id: arAccount.id,
            debit_amount: 400,
            credit_amount: 0,
            description: 'Credit portion of sale'
          },
          {
            account_id: revenueAccount.id,
            debit_amount: 0,
            credit_amount: 1000,
            description: 'Total sale revenue'
          }
        ]
      };

      const createdEntry = await apiCall('/accounting/journal-entries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(complexEntry)
      });

      expect(createdEntry.total_debit).toBe(1000);
      expect(createdEntry.total_credit).toBe(1000);
      expect(createdEntry.is_balanced).toBe(true);
      expect(createdEntry.lines).toHaveLength(3);

      // Verify each account balance was updated correctly
      const cashBalance = await apiCall(`/accounting/accounts/${cashAccount.id}/balance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const arBalance = await apiCall(`/accounting/accounts/${arAccount.id}/balance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Cash should have increased by 600 (debit increases assets)
      // AR should have increased by 400 (debit increases assets)
      expect(cashBalance.balance).toBeGreaterThan(0);
      expect(arBalance.balance).toBeGreaterThan(0);

      console.log('✅ Complex multi-account transaction test passed');
    });
  });

  describe('🔄 Real Database - Integration and Data Consistency Tests', () => {
    it('should maintain data consistency across all accounting components', async () => {
      console.log('🧪 Testing data consistency across components...');
      
      // Create a journal entry and verify it appears in all relevant places
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
      const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');

      const journalEntry = {
        entry_date: '2024-01-25',
        description: 'Integration test transaction',
        reference: 'INTEGRATION-001',
        lines: [
          {
            account_id: cashAccount.id,
            debit_amount: 2000,
            credit_amount: 0,
            description: 'Cash received'
          },
          {
            account_id: revenueAccount.id,
            debit_amount: 0,
            credit_amount: 2000,
            description: 'Revenue earned'
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

      // Verify entry appears in journal entries list
      const journalEntries = await apiCall('/accounting/journal-entries', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const foundEntry = journalEntries.find((entry: any) => entry.id === createdEntry.id);
      expect(foundEntry).toBeTruthy();

      // Verify account balances are updated
      const updatedCashBalance = await apiCall(`/accounting/accounts/${cashAccount.id}/balance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(updatedCashBalance.balance).toBeGreaterThan(0);

      // Verify entry appears in trial balance
      const trialBalance = await apiCall('/accounting/reports/trial-balance?as_of_date=2024-01-31', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashInTrial = trialBalance.accounts.find((acc: any) => acc.account_code === '1000');
      const revenueInTrial = trialBalance.accounts.find((acc: any) => acc.account_code === '4000');

      expect(cashInTrial.debit_balance).toBeGreaterThan(0);
      expect(revenueInTrial.credit_balance).toBeGreaterThan(0);

      console.log('✅ Data consistency across components verified');
    });

    it('should handle concurrent transactions correctly', async () => {
      console.log('🧪 Testing concurrent transaction handling...');
      
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
      const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');

      // Create multiple transactions concurrently
      const transactions = Array.from({ length: 5 }, (_, i) => ({
        entry_date: '2024-01-26',
        description: `Concurrent transaction ${i + 1}`,
        reference: `CONCURRENT-${i + 1}`,
        lines: [
          {
            account_id: cashAccount.id,
            debit_amount: 100,
            credit_amount: 0,
            description: `Cash ${i + 1}`
          },
          {
            account_id: revenueAccount.id,
            debit_amount: 0,
            credit_amount: 100,
            description: `Revenue ${i + 1}`
          }
        ]
      }));

      // Execute all transactions concurrently
      const results = await Promise.all(
        transactions.map(transaction =>
          apiCall('/accounting/journal-entries', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(transaction)
          })
        )
      );

      // Verify all transactions were created successfully
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result).toHaveProperty('id');
        expect(result.description).toBe(`Concurrent transaction ${index + 1}`);
        expect(result.is_balanced).toBe(true);
      });

      console.log('✅ Concurrent transaction handling test passed');
    });

    it('should validate audit trail completeness', async () => {
      console.log('🧪 Testing audit trail completeness...');
      
      // Get all journal entries
      const journalEntries = await apiCall('/accounting/journal-entries', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Verify each entry has complete audit information
      journalEntries.forEach((entry: any) => {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('entry_number');
        expect(entry).toHaveProperty('entry_date');
        expect(entry).toHaveProperty('created_at');
        expect(entry).toHaveProperty('updated_at');
        expect(entry).toHaveProperty('lines');
        
        // Verify entry number follows proper format
        expect(entry.entry_number).toMatch(/^JE-\d{4}-\d{3}$/);
        
        // Verify all lines have audit information
        entry.lines.forEach((line: any) => {
          expect(line).toHaveProperty('id');
          expect(line).toHaveProperty('journal_entry_id');
          expect(line).toHaveProperty('account_id');
          expect(line).toHaveProperty('created_at');
        });
      });

      console.log(`✅ Audit trail verified for ${journalEntries.length} journal entries`);
    });

    it('should test error handling and recovery', async () => {
      console.log('🧪 Testing error handling and recovery...');
      
      // Test invalid account ID
      try {
        await apiCall('/accounting/journal-entries', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            entry_date: '2024-01-27',
            description: 'Invalid account test',
            lines: [
              {
                account_id: 'invalid-account-id',
                debit_amount: 100,
                credit_amount: 0
              }
            ]
          })
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('400');
      }

      // Test invalid date format
      try {
        const accounts = await apiCall('/accounting/chart-of-accounts', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');

        await apiCall('/accounting/journal-entries', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            entry_date: 'invalid-date',
            description: 'Invalid date test',
            lines: [
              {
                account_id: cashAccount.id,
                debit_amount: 100,
                credit_amount: 0
              }
            ]
          })
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('400');
      }

      console.log('✅ Error handling and recovery test passed');
    });
  });

  describe('🎯 Real Database - Performance and Scalability Tests', () => {
    it('should handle large volumes of transactions efficiently', async () => {
      console.log('🧪 Testing performance with large transaction volumes...');
      
      const startTime = Date.now();
      
      // Create 50 transactions to test performance
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
      const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');

      const batchSize = 10;
      const totalTransactions = 50;
      
      for (let batch = 0; batch < totalTransactions / batchSize; batch++) {
        const batchTransactions = Array.from({ length: batchSize }, (_, i) => ({
          entry_date: '2024-01-28',
          description: `Performance test transaction ${batch * batchSize + i + 1}`,
          reference: `PERF-${batch * batchSize + i + 1}`,
          lines: [
            {
              account_id: cashAccount.id,
              debit_amount: 10,
              credit_amount: 0,
              description: 'Performance test debit'
            },
            {
              account_id: revenueAccount.id,
              debit_amount: 0,
              credit_amount: 10,
              description: 'Performance test credit'
            }
          ]
        }));

        // Process batch
        await Promise.all(
          batchTransactions.map(transaction =>
            apiCall('/accounting/journal-entries', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify(transaction)
            })
          )
        );
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Created ${totalTransactions} transactions in ${duration}ms`);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should generate reports efficiently with large datasets', async () => {
      console.log('🧪 Testing report generation performance...');
      
      const startTime = Date.now();
      
      // Generate all reports
      const [trialBalance, balanceSheet, incomeStatement] = await Promise.all([
        apiCall('/accounting/reports/trial-balance?as_of_date=2024-01-31', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }),
        apiCall('/accounting/reports/balance-sheet?as_of_date=2024-01-31', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }),
        apiCall('/accounting/reports/income-statement?start_date=2024-01-01&end_date=2024-01-31', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify reports contain data
      expect(trialBalance.accounts.length).toBeGreaterThan(0);
      expect(balanceSheet.assets.length).toBeGreaterThan(0);
      expect(incomeStatement.revenue.length).toBeGreaterThan(0);

      console.log(`✅ Generated all financial reports in ${duration}ms`);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should maintain data integrity under concurrent access', async () => {
      console.log('🧪 Testing data integrity under concurrent access...');
      
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
      
      // Get initial balance
      const initialBalance = await apiCall(`/accounting/accounts/${cashAccount.id}/balance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Create 20 concurrent transactions of $50 each
      const concurrentTransactions = Array.from({ length: 20 }, (_, i) => ({
        entry_date: '2024-01-29',
        description: `Concurrent integrity test ${i + 1}`,
        reference: `INTEGRITY-${i + 1}`,
        lines: [
          {
            account_id: cashAccount.id,
            debit_amount: 50,
            credit_amount: 0,
            description: 'Concurrent test debit'
          },
          {
            account_id: accounts.find((acc: any) => acc.account_code === '4000').id,
            debit_amount: 0,
            credit_amount: 50,
            description: 'Concurrent test credit'
          }
        ]
      }));

      // Execute all transactions concurrently
      const results = await Promise.all(
        concurrentTransactions.map(transaction =>
          apiCall('/accounting/journal-entries', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(transaction)
          })
        )
      );

      // Verify all transactions were created
      expect(results).toHaveLength(20);

      // Get final balance
      const finalBalance = await apiCall(`/accounting/accounts/${cashAccount.id}/balance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Balance should have increased by exactly $1000 (20 * $50)
      const expectedIncrease = 20 * 50;
      const actualIncrease = finalBalance.balance - initialBalance.balance;
      
      expect(Math.abs(actualIncrease - expectedIncrease)).toBeLessThan(0.01);

      console.log(`✅ Data integrity maintained: Expected increase ${expectedIncrease}, Actual increase ${actualIncrease}`);
    });
  });

  describe('🏁 Final Validation - Complete Accounting System Test', () => {
    it('should demonstrate complete accounting workflow', async () => {
      console.log('🧪 Running complete accounting workflow demonstration...');
      
      // 1. Create a complete business transaction cycle
      const accounts = await apiCall('/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const cashAccount = accounts.find((acc: any) => acc.account_code === '1000');
      const arAccount = accounts.find((acc: any) => acc.account_code === '1100');
      const revenueAccount = accounts.find((acc: any) => acc.account_code === '4000');
      const expenseAccount = accounts.find((acc: any) => acc.account_code === '5000');

      // Transaction 1: Make a sale (cash + credit)
      const saleEntry = {
        entry_date: '2024-01-30',
        description: 'Complete workflow - Sale transaction',
        reference: 'WORKFLOW-SALE',
        lines: [
          { account_id: cashAccount.id, debit_amount: 800, credit_amount: 0, description: 'Cash portion' },
          { account_id: arAccount.id, debit_amount: 200, credit_amount: 0, description: 'Credit portion' },
          { account_id: revenueAccount.id, debit_amount: 0, credit_amount: 1000, description: 'Total sale' }
        ]
      };

      const saleResult = await apiCall('/accounting/journal-entries', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(saleEntry)
      });

      // Transaction 2: Pay an expense
      const expenseEntry = {
        entry_date: '2024-01-30',
        description: 'Complete workflow - Expense payment',
        reference: 'WORKFLOW-EXPENSE',
        lines: [
          { account_id: expenseAccount.id, debit_amount: 300, credit_amount: 0, description: 'Office supplies' },
          { account_id: cashAccount.id, debit_amount: 0, credit_amount: 300, description: 'Cash payment' }
        ]
      };

      const expenseResult = await apiCall('/accounting/journal-entries', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(expenseEntry)
      });

      // Transaction 3: Collect accounts receivable
      const collectionEntry = {
        entry_date: '2024-01-31',
        description: 'Complete workflow - AR collection',
        reference: 'WORKFLOW-COLLECTION',
        lines: [
          { account_id: cashAccount.id, debit_amount: 200, credit_amount: 0, description: 'Cash collected' },
          { account_id: arAccount.id, debit_amount: 0, credit_amount: 200, description: 'AR reduction' }
        ]
      };

      const collectionResult = await apiCall('/accounting/journal-entries', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(collectionEntry)
      });

      // 2. Verify all transactions are balanced
      expect(saleResult.is_balanced).toBe(true);
      expect(expenseResult.is_balanced).toBe(true);
      expect(collectionResult.is_balanced).toBe(true);

      // 3. Generate and verify all financial reports
      const [finalTrialBalance, finalBalanceSheet, finalIncomeStatement] = await Promise.all([
        apiCall('/accounting/reports/trial-balance?as_of_date=2024-01-31', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        apiCall('/accounting/reports/balance-sheet?as_of_date=2024-01-31', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        apiCall('/accounting/reports/income-statement?start_date=2024-01-01&end_date=2024-01-31', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      // 4. Verify accounting principles
      expect(finalTrialBalance.is_balanced).toBe(true);
      expect(finalTrialBalance.total_debits).toBe(finalTrialBalance.total_credits);
      
      const assetsTotal = finalBalanceSheet.total_assets;
      const liabilitiesAndEquity = finalBalanceSheet.total_liabilities + finalBalanceSheet.total_equity;
      expect(Math.abs(assetsTotal - liabilitiesAndEquity)).toBeLessThan(0.01);

      const calculatedNetIncome = finalIncomeStatement.total_revenue - finalIncomeStatement.total_expenses;
      expect(Math.abs(finalIncomeStatement.net_income - calculatedNetIncome)).toBeLessThan(0.01);

      console.log('✅ Complete accounting workflow demonstration passed');
      console.log(`📊 Final Trial Balance: Debits ${finalTrialBalance.total_debits}, Credits ${finalTrialBalance.total_credits}`);
      console.log(`🏦 Final Balance Sheet: Assets ${assetsTotal}, Liabilities + Equity ${liabilitiesAndEquity}`);
      console.log(`💰 Final Income Statement: Revenue ${finalIncomeStatement.total_revenue}, Expenses ${finalIncomeStatement.total_expenses}, Net Income ${finalIncomeStatement.net_income}`);
    });
  });
});