/**
 * Double-Entry Accounting System Types
 * TypeScript interfaces for accounting frontend components
 */

export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  parent_id?: string;
  level: number;
  is_active: boolean;
  is_system_account: boolean;
  description?: string;
  business_type_config?: Record<string, any>;
  children?: ChartOfAccount[];
  created_at: string;
  updated_at: string;
}

export interface AccountingPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  is_closed: boolean;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  account_name?: string;
  account_code?: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  reference?: string;
  subsidiary_account?: string;
  cost_center?: string;
  project_code?: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  reference?: string;
  description: string;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  source_type?: string;
  source_id?: string;
  period_id?: string;
  status: 'draft' | 'posted' | 'reversed';
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  lines: JournalEntryLine[];
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  account_type: string;
  currency: string;
  current_balance: number;
  reconciled_balance: number;
  chart_account_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  description: string;
  reference?: string;
  amount: number;
  transaction_type: 'debit' | 'credit';
  is_reconciled: boolean;
  reconciled_at?: string;
  journal_entry_id?: string;
  created_at: string;
}

export interface BankReconciliation {
  id: string;
  bank_account_id: string;
  reconciliation_date: string;
  statement_date: string;
  statement_balance: number;
  book_balance: number;
  adjusted_balance: number;
  status: 'in_progress' | 'completed' | 'approved';
  is_balanced: boolean;
  outstanding_deposits: number;
  outstanding_checks: number;
  bank_charges: number;
  interest_earned: number;
  created_at: string;
  updated_at: string;
}

export interface CheckRegister {
  id: string;
  check_number: string;
  bank_account_id: string;
  check_date: string;
  payee: string;
  amount: number;
  memo?: string;
  status: 'issued' | 'cleared' | 'voided' | 'stopped';
  cleared_date?: string;
  journal_entry_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TrialBalanceItem {
  account_code: string;
  account_name: string;
  account_type: string;
  debit_balance: number;
  credit_balance: number;
}

export interface TrialBalance {
  as_of_date: string;
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
  accounts: TrialBalanceItem[];
}

export interface BalanceSheetItem {
  account_code: string;
  account_name: string;
  balance: number;
  level: number;
}

export interface BalanceSheet {
  as_of_date: string;
  assets: BalanceSheetItem[];
  liabilities: BalanceSheetItem[];
  equity: BalanceSheetItem[];
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
}

export interface IncomeStatementItem {
  account_code: string;
  account_name: string;
  amount: number;
  level: number;
}

export interface IncomeStatement {
  start_date: string;
  end_date: string;
  revenue: IncomeStatementItem[];
  expenses: IncomeStatementItem[];
  total_revenue: number;
  total_expenses: number;
  net_income: number;
}

export interface GeneralLedgerItem {
  entry_date: string;
  entry_number: string;
  description: string;
  reference?: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
}

export interface GeneralLedger {
  account_code: string;
  account_name: string;
  start_date: string;
  end_date: string;
  opening_balance: number;
  closing_balance: number;
  transactions: GeneralLedgerItem[];
}

export interface SubsidiaryLedger {
  subsidiary_account: string;
  account_code: string;
  account_name: string;
  start_date: string;
  end_date: string;
  opening_balance: number;
  closing_balance: number;
  transactions: GeneralLedgerItem[];
}

// Form interfaces
export interface ChartOfAccountForm {
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  parent_id?: string;
  description?: string;
  business_type_config?: Record<string, any>;
  is_active?: boolean;
}

export interface JournalEntryForm {
  entry_date: string;
  reference?: string;
  description: string;
  source_type?: string;
  source_id?: string;
  requires_approval: boolean;
  period_id?: string;
  lines: JournalEntryLineForm[];
}

export interface JournalEntryLineForm {
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  reference?: string;
  subsidiary_account?: string;
  cost_center?: string;
  project_code?: string;
}

export interface BankAccountForm {
  account_name: string;
  account_number: string;
  bank_name: string;
  account_type: string;
  currency: string;
  chart_account_id?: string;
}

export interface BankReconciliationForm {
  bank_account_id: string;
  reconciliation_date: string;
  statement_date: string;
  statement_balance: number;
  book_balance: number;
  outstanding_deposits: number;
  outstanding_checks: number;
  bank_charges: number;
  interest_earned: number;
}

export interface CheckRegisterForm {
  check_number: string;
  bank_account_id: string;
  check_date: string;
  payee: string;
  amount: number;
  memo?: string;
}

// Filter and search interfaces
export interface JournalEntryFilters {
  start_date?: string;
  end_date?: string;
  account_id?: string;
  status?: 'draft' | 'posted' | 'reversed';
  limit?: number;
  offset?: number;
}

export interface BankTransactionFilters {
  start_date?: string;
  end_date?: string;
  reconciled_only?: boolean;
}

export interface AccountingDashboardData {
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  cash_balance: number;
  accounts_receivable: number;
  accounts_payable: number;
  unreconciled_transactions: number;
  pending_journal_entries: number;
  recent_transactions: JournalEntry[];
}