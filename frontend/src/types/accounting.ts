/**
 * Enhanced Double-Entry Accounting Types
 * Comprehensive types for the enhanced accounting system
 */

// Chart of Accounts
export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_name_persian?: string;
  parent_account_id?: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_category: string;
  is_active: boolean;
  is_system_account: boolean;
  allow_manual_entries: boolean;
  requires_subsidiary: boolean;
  current_balance: number;
  debit_balance: number;
  credit_balance: number;
  account_description?: string;
  account_description_persian?: string;
  account_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  parent_account?: ChartOfAccount;
  child_accounts?: ChartOfAccount[];
}

export interface ChartOfAccountCreate {
  account_code: string;
  account_name: string;
  account_name_persian?: string;
  parent_account_id?: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_category: string;
  account_description?: string;
  account_description_persian?: string;
  allow_manual_entries?: boolean;
  requires_subsidiary?: boolean;
  account_metadata?: Record<string, any>;
}

export interface ChartOfAccountUpdate {
  account_name?: string;
  account_name_persian?: string;
  account_category?: string;
  account_description?: string;
  account_description_persian?: string;
  is_active?: boolean;
  allow_manual_entries?: boolean;
  requires_subsidiary?: boolean;
  account_metadata?: Record<string, any>;
}

// Subsidiary Accounts (حساب‌های تفصیلی)
export interface SubsidiaryAccount {
  id: string;
  subsidiary_code: string;
  subsidiary_name: string;
  subsidiary_name_persian?: string;
  main_account_id: string;
  subsidiary_type: string;
  reference_id?: string;
  reference_type?: string;
  current_balance: number;
  debit_balance: number;
  credit_balance: number;
  credit_limit: number;
  payment_terms_days: number;
  is_active: boolean;
  is_blocked: boolean;
  block_reason?: string;
  description?: string;
  description_persian?: string;
  contact_info?: Record<string, any>;
  subsidiary_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  main_account?: ChartOfAccount;
}

export interface SubsidiaryAccountCreate {
  subsidiary_code?: string;
  subsidiary_name: string;
  subsidiary_name_persian?: string;
  main_account_id: string;
  subsidiary_type: string;
  reference_id?: string;
  reference_type?: string;
  credit_limit?: number;
  payment_terms_days?: number;
  description?: string;
  description_persian?: string;
  contact_info?: Record<string, any>;
  subsidiary_metadata?: Record<string, any>;
}

export interface SubsidiaryAccountUpdate {
  subsidiary_name?: string;
  subsidiary_name_persian?: string;
  credit_limit?: number;
  payment_terms_days?: number;
  is_active?: boolean;
  is_blocked?: boolean;
  block_reason?: string;
  description?: string;
  description_persian?: string;
  contact_info?: Record<string, any>;
  subsidiary_metadata?: Record<string, any>;
}

// Journal Entries (Double-Entry System)
export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  description_persian?: string;
  reference_number?: string;
  source_type: string;
  source_id?: string;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  status: 'draft' | 'posted' | 'reversed';
  posted_at?: string;
  posted_by?: string;
  accounting_period?: string;
  fiscal_year?: number;
  is_period_locked: boolean;
  reversed_entry_id?: string;
  reversal_reason?: string;
  reversed_at?: string;
  reversed_by?: string;
  gold_sood_amount?: number;
  gold_ojrat_amount?: number;
  gold_maliyat_amount?: number;
  entry_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  journal_lines: JournalEntryLine[];
  reversed_entry?: JournalEntry;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  line_number: number;
  account_id: string;
  subsidiary_account_id?: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  description_persian?: string;
  quantity?: number;
  unit_price?: number;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  line_metadata?: Record<string, any>;
  created_at: string;
  account?: ChartOfAccount;
  subsidiary_account?: SubsidiaryAccount;
}

export interface JournalEntryCreate {
  entry_date: string;
  description: string;
  description_persian?: string;
  reference_number?: string;
  source_type: string;
  source_id?: string;
  accounting_period?: string;
  fiscal_year?: number;
  gold_sood_amount?: number;
  gold_ojrat_amount?: number;
  gold_maliyat_amount?: number;
  entry_metadata?: Record<string, any>;
  journal_lines: JournalEntryLineCreate[];
}

export interface JournalEntryLineCreate {
  line_number: number;
  account_id: string;
  subsidiary_account_id?: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  description_persian?: string;
  quantity?: number;
  unit_price?: number;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  line_metadata?: Record<string, any>;
}

// Check Management (مدیریت چک‌ها)
export interface CheckManagement {
  id: string;
  check_number: string;
  bank_name: string;
  bank_name_persian?: string;
  branch_name?: string;
  check_amount: number;
  check_date: string;
  due_date: string;
  check_type: 'received' | 'issued';
  check_status: 'pending' | 'deposited' | 'cleared' | 'bounced' | 'cancelled';
  drawer_name?: string;
  drawer_account?: string;
  payee_name?: string;
  customer_id?: string;
  vendor_id?: string;
  subsidiary_account_id?: string;
  transaction_date?: string;
  deposit_date?: string;
  clear_date?: string;
  bounce_date?: string;
  invoice_id?: string;
  payment_id?: string;
  journal_entry_id?: string;
  is_post_dated: boolean;
  bounce_reason?: string;
  bounce_fee: number;
  notes?: string;
  notes_persian?: string;
  check_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  subsidiary_account?: SubsidiaryAccount;
  journal_entry?: JournalEntry;
}

export interface CheckManagementCreate {
  check_number: string;
  bank_name: string;
  bank_name_persian?: string;
  branch_name?: string;
  check_amount: number;
  check_date: string;
  due_date: string;
  check_type: 'received' | 'issued';
  drawer_name?: string;
  drawer_account?: string;
  payee_name?: string;
  customer_id?: string;
  vendor_id?: string;
  subsidiary_account_id?: string;
  invoice_id?: string;
  payment_id?: string;
  is_post_dated?: boolean;
  notes?: string;
  notes_persian?: string;
  check_metadata?: Record<string, any>;
}

// Installment Accounts (حساب‌های اقساطی)
export interface InstallmentAccount {
  id: string;
  account_name: string;
  account_name_persian?: string;
  customer_id?: string;
  subsidiary_account_id?: string;
  total_amount: number;
  down_payment: number;
  installment_amount: number;
  number_of_installments: number;
  paid_installments: number;
  remaining_installments: number;
  installment_frequency: 'monthly' | 'weekly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  next_due_date?: string;
  total_paid: number;
  remaining_balance: number;
  interest_rate: number;
  late_fee_rate: number;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  last_payment_date?: string;
  grace_period_days: number;
  notes?: string;
  notes_persian?: string;
  installment_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  installment_payments: InstallmentPayment[];
}

export interface InstallmentPayment {
  id: string;
  installment_account_id: string;
  installment_number: number;
  due_date: string;
  total_amount_due: number;
  principal_amount: number;
  interest_amount: number;
  late_fee_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_date?: string;
  payment_method?: string;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  days_overdue: number;
  journal_entry_id?: string;
  notes?: string;
  payment_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InstallmentAccountCreate {
  account_name: string;
  account_name_persian?: string;
  customer_id?: string;
  subsidiary_account_id?: string;
  total_amount: number;
  down_payment: number;
  number_of_installments: number;
  installment_frequency: 'monthly' | 'weekly' | 'quarterly' | 'yearly';
  start_date: string;
  interest_rate?: number;
  late_fee_rate?: number;
  grace_period_days?: number;
  notes?: string;
  notes_persian?: string;
  installment_metadata?: Record<string, any>;
}

// Bank Reconciliation
export interface BankReconciliation {
  id: string;
  reconciliation_date: string;
  bank_account_id: string;
  book_balance: number;
  bank_statement_balance: number;
  reconciled_balance: number;
  difference: number;
  period_start: string;
  period_end: string;
  status: 'in_progress' | 'completed' | 'reviewed';
  notes?: string;
  reconciliation_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  reconciliation_items: BankReconciliationItem[];
}

export interface BankReconciliationItem {
  id: string;
  reconciliation_id: string;
  item_type: 'deposit_in_transit' | 'outstanding_check' | 'bank_fee' | 'interest_earned' | 'error_correction';
  description: string;
  amount: number;
  reference_number?: string;
  journal_entry_id?: string;
  is_cleared: boolean;
  cleared_date?: string;
}

// Financial Reports
export interface TrialBalance {
  as_of_date: string;
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
  accounts: TrialBalanceAccount[];
}

export interface TrialBalanceAccount {
  account_code: string;
  account_name: string;
  account_name_persian?: string;
  account_type: string;
  debit_balance: number;
  credit_balance: number;
  net_balance: number;
}

export interface BalanceSheet {
  as_of_date: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  total_assets: number;
  total_liabilities_equity: number;
  is_balanced: boolean;
}

export interface BalanceSheetSection {
  section_name: string;
  section_name_persian?: string;
  total_amount: number;
  items: BalanceSheetItem[];
}

export interface BalanceSheetItem {
  account_code: string;
  account_name: string;
  account_name_persian?: string;
  amount: number;
}

export interface ProfitLossStatement {
  period_start: string;
  period_end: string;
  revenue: ProfitLossSection;
  expenses: ProfitLossSection;
  gross_profit: number;
  net_profit: number;
  profit_margin: number;
}

export interface ProfitLossSection {
  section_name: string;
  section_name_persian?: string;
  total_amount: number;
  items: ProfitLossItem[];
}

export interface ProfitLossItem {
  account_code: string;
  account_name: string;
  account_name_persian?: string;
  amount: number;
}

// Accounting Period Management
export interface AccountingPeriod {
  id: string;
  period_code: string;
  period_name: string;
  period_name_persian?: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  is_locked: boolean;
  locked_at?: string;
  locked_by?: string;
  lock_reason?: string;
  is_closed: boolean;
  closed_at?: string;
  closed_by?: string;
  closing_entries_created: boolean;
  period_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Filters and Search
export interface AccountingFilters {
  start_date?: string;
  end_date?: string;
  account_type?: string;
  account_category?: string;
  subsidiary_type?: string;
  status?: string;
  search_term?: string;
  include_inactive?: boolean;
  page?: number;
  limit?: number;
}

export interface JournalEntryFilters extends AccountingFilters {
  source_type?: string;
  accounting_period?: string;
  fiscal_year?: number;
  is_balanced?: boolean;
  posted_only?: boolean;
}

export interface CheckFilters extends AccountingFilters {
  check_type?: 'received' | 'issued';
  check_status?: string;
  bank_name?: string;
  min_amount?: number;
  max_amount?: number;
  due_date_from?: string;
  due_date_to?: string;
}

export interface InstallmentFilters extends AccountingFilters {
  installment_status?: string;
  customer_id?: string;
  overdue_only?: boolean;
  next_due_from?: string;
  next_due_to?: string;
}

// Dashboard and Analytics
export interface AccountingDashboard {
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  cash_balance: number;
  accounts_receivable: number;
  accounts_payable: number;
  pending_checks: number;
  overdue_installments: number;
  recent_journal_entries: JournalEntry[];
  account_balances: ChartOfAccount[];
  period_summary: {
    current_period: string;
    is_locked: boolean;
    entries_count: number;
    unbalanced_entries: number;
  };
}

// Audit Trail
export interface AccountingAuditTrail {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'insert' | 'update' | 'delete';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  change_description?: string;
  user_id: string;
  user_name?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}