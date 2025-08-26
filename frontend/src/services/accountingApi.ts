/**
 * Accounting API Service
 * API calls for double-entry accounting system
 */

import { 
  ChartOfAccount, 
  ChartOfAccountForm,
  AccountingPeriod,
  JournalEntry,
  JournalEntryForm,
  JournalEntryFilters,
  BankAccount,
  BankAccountForm,
  BankTransaction,
  BankTransactionFilters,
  BankReconciliation,
  BankReconciliationForm,
  CheckRegister,
  CheckRegisterForm,
  TrialBalance,
  BalanceSheet,
  IncomeStatement,
  GeneralLedger,
  SubsidiaryLedger,
  AccountingDashboardData
} from '../types/accounting';

const API_BASE = '/api/accounting';

class AccountingApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Chart of Accounts
  async getChartOfAccounts(accountType?: string): Promise<ChartOfAccount[]> {
    const params = accountType ? `?account_type=${accountType}` : '';
    return this.request<ChartOfAccount[]>(`/chart-of-accounts${params}`);
  }

  async getChartOfAccount(accountId: string): Promise<ChartOfAccount> {
    return this.request<ChartOfAccount>(`/chart-of-accounts/${accountId}`);
  }

  async createChartOfAccount(data: ChartOfAccountForm): Promise<ChartOfAccount> {
    return this.request<ChartOfAccount>('/chart-of-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateChartOfAccount(accountId: string, data: Partial<ChartOfAccountForm>): Promise<ChartOfAccount> {
    return this.request<ChartOfAccount>(`/chart-of-accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Accounting Periods
  async getCurrentPeriod(): Promise<AccountingPeriod | null> {
    return this.request<AccountingPeriod | null>('/periods/current');
  }

  async createAccountingPeriod(data: {
    period_name: string;
    start_date: string;
    end_date: string;
    period_type: 'monthly' | 'quarterly' | 'yearly';
  }): Promise<AccountingPeriod> {
    return this.request<AccountingPeriod>('/periods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async closeAccountingPeriod(periodId: string): Promise<AccountingPeriod> {
    return this.request<AccountingPeriod>(`/periods/${periodId}/close`, {
      method: 'POST',
    });
  }

  // Journal Entries
  async getJournalEntries(filters?: JournalEntryFilters): Promise<JournalEntry[]> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.account_id) params.append('account_id', filters.account_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    return this.request<JournalEntry[]>(`/journal-entries${queryString ? `?${queryString}` : ''}`);
  }

  async createJournalEntry(data: JournalEntryForm): Promise<JournalEntry> {
    return this.request<JournalEntry>('/journal-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postJournalEntry(entryId: string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/journal-entries/${entryId}/post`, {
      method: 'POST',
    });
  }

  async approveJournalEntry(entryId: string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/journal-entries/${entryId}/approve`, {
      method: 'POST',
    });
  }

  async reverseJournalEntry(entryId: string, reason: string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/journal-entries/${entryId}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ reversal_reason: reason }),
    });
  }

  async bulkPostJournalEntries(entryIds: string[]): Promise<{
    posted: number;
    errors: number;
    results: Array<{ entry_id: string; status: string }>;
    error_details: Array<{ entry_id: string; error: string }>;
  }> {
    return this.request('/journal-entries/bulk-post', {
      method: 'POST',
      body: JSON.stringify(entryIds),
    });
  }

  // Bank Accounts
  async getBankAccounts(activeOnly: boolean = true): Promise<BankAccount[]> {
    return this.request<BankAccount[]>(`/bank-accounts?active_only=${activeOnly}`);
  }

  async createBankAccount(data: BankAccountForm): Promise<BankAccount> {
    return this.request<BankAccount>('/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBankAccount(accountId: string, data: Partial<BankAccountForm>): Promise<BankAccount> {
    return this.request<BankAccount>(`/bank-accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Bank Transactions
  async getBankTransactions(
    bankAccountId: string, 
    filters?: BankTransactionFilters
  ): Promise<BankTransaction[]> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.reconciled_only !== undefined) params.append('reconciled_only', filters.reconciled_only.toString());

    const queryString = params.toString();
    return this.request<BankTransaction[]>(
      `/bank-accounts/${bankAccountId}/transactions${queryString ? `?${queryString}` : ''}`
    );
  }

  async createBankTransaction(data: {
    bank_account_id: string;
    transaction_date: string;
    description: string;
    reference?: string;
    amount: number;
    transaction_type: 'debit' | 'credit';
  }): Promise<BankTransaction> {
    return this.request<BankTransaction>('/bank-transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Bank Reconciliation
  async createBankReconciliation(data: BankReconciliationForm): Promise<BankReconciliation> {
    return this.request<BankReconciliation>('/bank-reconciliations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBankReconciliation(
    reconciliationId: string, 
    data: Partial<BankReconciliationForm>
  ): Promise<BankReconciliation> {
    return this.request<BankReconciliation>(`/bank-reconciliations/${reconciliationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async matchBankTransactions(reconciliationId: string, transactionIds: string[]): Promise<void> {
    return this.request(`/bank-reconciliations/${reconciliationId}/match-transactions`, {
      method: 'POST',
      body: JSON.stringify(transactionIds),
    });
  }

  // Check Management
  async createCheck(data: CheckRegisterForm): Promise<CheckRegister> {
    return this.request<CheckRegister>('/checks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCheckStatus(checkId: string, data: {
    status?: 'issued' | 'cleared' | 'voided' | 'stopped';
    cleared_date?: string;
    payee?: string;
    amount?: number;
    memo?: string;
  }): Promise<CheckRegister> {
    return this.request<CheckRegister>(`/checks/${checkId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Financial Reports
  async getTrialBalance(asOfDate: string): Promise<TrialBalance> {
    return this.request<TrialBalance>(`/reports/trial-balance?as_of_date=${asOfDate}`);
  }

  async getBalanceSheet(asOfDate: string): Promise<BalanceSheet> {
    return this.request<BalanceSheet>(`/reports/balance-sheet?as_of_date=${asOfDate}`);
  }

  async getIncomeStatement(startDate: string, endDate: string): Promise<IncomeStatement> {
    return this.request<IncomeStatement>(
      `/reports/income-statement?start_date=${startDate}&end_date=${endDate}`
    );
  }

  async getGeneralLedger(accountId: string, startDate: string, endDate: string): Promise<GeneralLedger> {
    return this.request<GeneralLedger>(
      `/reports/general-ledger/${accountId}?start_date=${startDate}&end_date=${endDate}`
    );
  }

  // Account Balance
  async getAccountBalance(accountId: string, asOfDate?: string): Promise<{
    account_id: string;
    account_code: string;
    account_name: string;
    balance: number;
    as_of_date: string;
  }> {
    const params = asOfDate ? `?as_of_date=${asOfDate}` : '';
    return this.request(`/accounts/${accountId}/balance${params}`);
  }

  // Ledger Methods
  async getIncomeLedger(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    
    const queryString = params.toString();
    return this.request<any[]>(`/ledger/income${queryString ? `?${queryString}` : ''}`);
  }

  async getExpenseLedger(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.category) params.append('category', filters.category);
    
    const queryString = params.toString();
    return this.request<any[]>(`/ledger/expenses${queryString ? `?${queryString}` : ''}`);
  }

  async createExpenseEntry(data: any): Promise<any> {
    return this.request<any>('/ledger/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCashBankLedger(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.account_id) params.append('account_id', filters.account_id);
    
    const queryString = params.toString();
    return this.request<any[]>(`/ledger/cash-bank${queryString ? `?${queryString}` : ''}`);
  }

  async getGoldWeightLedger(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.transaction_type) params.append('transaction_type', filters.transaction_type);
    
    const queryString = params.toString();
    return this.request<any[]>(`/ledger/gold-weight${queryString ? `?${queryString}` : ''}`);
  }

  async getProfitLossAnalysis(startDate: string, endDate: string): Promise<any> {
    return this.request<any>(`/reports/profit-loss?start_date=${startDate}&end_date=${endDate}`);
  }

  async getDebtTracking(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    return this.request<any[]>(`/ledger/debt-tracking${queryString ? `?${queryString}` : ''}`);
  }

  async getLedgerSummary(filters?: any): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    
    const queryString = params.toString();
    return this.request<any>(`/ledger/summary${queryString ? `?${queryString}` : ''}`);
  }

  // Dashboard Data
  async getDashboardData(): Promise<AccountingDashboardData> {
    // This would be a custom endpoint that aggregates dashboard data
    // For now, we'll simulate it by making multiple calls
    const [
      trialBalance,
      currentPeriod,
      recentEntries
    ] = await Promise.all([
      this.getTrialBalance(new Date().toISOString()),
      this.getCurrentPeriod(),
      this.getJournalEntries({ limit: 10, offset: 0 })
    ]);

    // Calculate dashboard metrics from trial balance
    const assets = trialBalance.accounts
      .filter(acc => acc.account_type === 'Asset')
      .reduce((sum, acc) => sum + acc.debit_balance, 0);

    const liabilities = trialBalance.accounts
      .filter(acc => acc.account_type === 'Liability')
      .reduce((sum, acc) => sum + acc.credit_balance, 0);

    const equity = trialBalance.accounts
      .filter(acc => acc.account_type === 'Equity')
      .reduce((sum, acc) => sum + acc.credit_balance, 0);

    const revenue = trialBalance.accounts
      .filter(acc => acc.account_type === 'Revenue')
      .reduce((sum, acc) => sum + acc.credit_balance, 0);

    const expenses = trialBalance.accounts
      .filter(acc => acc.account_type === 'Expense')
      .reduce((sum, acc) => sum + acc.debit_balance, 0);

    return {
      total_assets: assets,
      total_liabilities: liabilities,
      total_equity: equity,
      total_revenue: revenue,
      total_expenses: expenses,
      net_income: revenue - expenses,
      cash_balance: 0, // Would need specific cash account lookup
      accounts_receivable: 0, // Would need specific AR account lookup
      accounts_payable: 0, // Would need specific AP account lookup
      unreconciled_transactions: 0, // Would need bank reconciliation data
      pending_journal_entries: recentEntries.filter(entry => entry.status === 'draft').length,
      recent_transactions: recentEntries
    };
  }
}

export const accountingApi = new AccountingApiService();