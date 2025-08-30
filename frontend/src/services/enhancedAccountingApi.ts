/**
 * Enhanced Double-Entry Accounting API Service
 * Comprehensive API service for the enhanced accounting system
 */

import { api } from '../utils/api';
import {
  ChartOfAccount,
  ChartOfAccountCreate,
  ChartOfAccountUpdate,
  SubsidiaryAccount,
  SubsidiaryAccountCreate,
  SubsidiaryAccountUpdate,
  JournalEntry,
  JournalEntryCreate,
  CheckManagement,
  CheckManagementCreate,
  InstallmentAccount,
  InstallmentAccountCreate,
  InstallmentPayment,
  BankReconciliation,
  TrialBalance,
  BalanceSheet,
  ProfitLossStatement,
  AccountingDashboard,
  AccountingFilters,
  JournalEntryFilters,
  CheckFilters,
  InstallmentFilters,
  AccountingPeriod,
  AccountingAuditTrail
} from '../types/accounting';

export const enhancedAccountingApi = {
  // Chart of Accounts Management
  getChartOfAccounts: async (includeInactive = false): Promise<ChartOfAccount[]> => {
    const params = new URLSearchParams();
    if (includeInactive) params.append('include_inactive', 'true');
    
    const response = await api.get(`/accounting/chart-of-accounts?${params.toString()}`);
    return response.data as ChartOfAccount[];
  },

  createChartOfAccount: async (accountData: ChartOfAccountCreate): Promise<ChartOfAccount> => {
    const response = await api.post('/accounting/chart-of-accounts', accountData);
    return response.data as ChartOfAccount;
  },

  updateChartOfAccount: async (accountId: string, accountData: ChartOfAccountUpdate): Promise<ChartOfAccount> => {
    const response = await api.put(`/accounting/chart-of-accounts/${accountId}`, accountData);
    return response.data as ChartOfAccount;
  },

  deleteChartOfAccount: async (accountId: string): Promise<void> => {
    await api.delete(`/accounting/chart-of-accounts/${accountId}`);
  },

  getChartOfAccount: async (accountId: string): Promise<ChartOfAccount> => {
    const response = await api.get(`/accounting/chart-of-accounts/${accountId}`);
    return response.data as ChartOfAccount;
  },

  // Subsidiary Accounts Management (حساب‌های تفصیلی)
  getSubsidiaryAccounts: async (filters?: AccountingFilters): Promise<SubsidiaryAccount[]> => {
    const params = new URLSearchParams();
    if (filters?.subsidiary_type) params.append('subsidiary_type', filters.subsidiary_type);
    if (filters?.search_term) params.append('search_term', filters.search_term);
    if (filters?.include_inactive) params.append('include_inactive', 'true');
    
    const response = await api.get(`/accounting/subsidiary-accounts?${params.toString()}`);
    return response.data as SubsidiaryAccount[];
  },

  createSubsidiaryAccount: async (subsidiaryData: SubsidiaryAccountCreate): Promise<SubsidiaryAccount> => {
    const response = await api.post('/accounting/subsidiary-accounts', subsidiaryData);
    return response.data as SubsidiaryAccount;
  },

  updateSubsidiaryAccount: async (subsidiaryId: string, subsidiaryData: SubsidiaryAccountUpdate): Promise<SubsidiaryAccount> => {
    const response = await api.put(`/accounting/subsidiary-accounts/${subsidiaryId}`, subsidiaryData);
    return response.data as SubsidiaryAccount;
  },

  deleteSubsidiaryAccount: async (subsidiaryId: string): Promise<void> => {
    await api.delete(`/accounting/subsidiary-accounts/${subsidiaryId}`);
  },

  getSubsidiaryAccount: async (subsidiaryId: string): Promise<SubsidiaryAccount> => {
    const response = await api.get(`/accounting/subsidiary-accounts/${subsidiaryId}`);
    return response.data as SubsidiaryAccount;
  },

  // Journal Entries Management (Double-Entry System)
  getJournalEntries: async (filters?: JournalEntryFilters): Promise<JournalEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.source_type) params.append('source_type', filters.source_type);
    if (filters?.accounting_period) params.append('accounting_period', filters.accounting_period);
    if (filters?.fiscal_year) params.append('fiscal_year', filters.fiscal_year.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.posted_only) params.append('posted_only', 'true');
    if (filters?.search_term) params.append('search_term', filters.search_term);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/accounting/journal-entries?${params.toString()}`);
    return response.data as JournalEntry[];
  },

  createJournalEntry: async (entryData: JournalEntryCreate): Promise<JournalEntry> => {
    const response = await api.post('/accounting/journal-entries', entryData);
    return response.data as JournalEntry;
  },

  updateJournalEntry: async (entryId: string, entryData: Partial<JournalEntryCreate>): Promise<JournalEntry> => {
    const response = await api.put(`/accounting/journal-entries/${entryId}`, entryData);
    return response.data as JournalEntry;
  },

  deleteJournalEntry: async (entryId: string): Promise<void> => {
    await api.delete(`/accounting/journal-entries/${entryId}`);
  },

  getJournalEntry: async (entryId: string): Promise<JournalEntry> => {
    const response = await api.get(`/accounting/journal-entries/${entryId}`);
    return response.data as JournalEntry;
  },

  postJournalEntry: async (entryId: string): Promise<JournalEntry> => {
    const response = await api.post(`/accounting/journal-entries/${entryId}/post`);
    return response.data as JournalEntry;
  },

  reverseJournalEntry: async (entryId: string, reversalReason: string): Promise<JournalEntry> => {
    const response = await api.post(`/accounting/journal-entries/${entryId}/reverse`, {
      reversal_reason: reversalReason
    });
    return response.data as JournalEntry;
  },

  // General Ledger (دفتر معین)
  getGeneralLedger: async (accountId: string, filters?: AccountingFilters): Promise<JournalEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.page) params.append('page', filters.page?.toString() || '1');
    if (filters?.limit) params.append('limit', filters.limit?.toString() || '50');
    
    const response = await api.get(`/accounting/general-ledger/${accountId}?${params.toString()}`);
    return response.data as JournalEntry[];
  },

  getAccountBalance: async (accountId: string, asOfDate?: string): Promise<{ debit_balance: number; credit_balance: number; net_balance: number }> => {
    const params = new URLSearchParams();
    if (asOfDate) params.append('as_of_date', asOfDate);
    
    const response = await api.get(`/accounting/account-balance/${accountId}?${params.toString()}`);
    return response.data as { debit_balance: number; credit_balance: number; net_balance: number };
  },

  // Check Management System (مدیریت چک‌ها)
  getChecks: async (filters?: CheckFilters): Promise<CheckManagement[]> => {
    const params = new URLSearchParams();
    if (filters?.check_type) params.append('check_type', filters.check_type);
    if (filters?.check_status) params.append('check_status', filters.check_status);
    if (filters?.bank_name) params.append('bank_name', filters.bank_name);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.min_amount) params.append('min_amount', filters.min_amount.toString());
    if (filters?.max_amount) params.append('max_amount', filters.max_amount.toString());
    if (filters?.due_date_from) params.append('due_date_from', filters.due_date_from);
    if (filters?.due_date_to) params.append('due_date_to', filters.due_date_to);
    if (filters?.search_term) params.append('search_term', filters.search_term);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/accounting/checks?${params.toString()}`);
    return response.data as CheckManagement[];
  },

  createCheck: async (checkData: CheckManagementCreate): Promise<CheckManagement> => {
    const response = await api.post('/accounting/checks', checkData);
    return response.data as CheckManagement;
  },

  updateCheck: async (checkId: string, checkData: Partial<CheckManagementCreate>): Promise<CheckManagement> => {
    const response = await api.put(`/accounting/checks/${checkId}`, checkData);
    return response.data as CheckManagement;
  },

  updateCheckStatus: async (checkId: string, status: string, notes?: string): Promise<CheckManagement> => {
    const response = await api.post(`/accounting/checks/${checkId}/status`, {
      status,
      notes
    });
    return response.data as CheckManagement;
  },

  deleteCheck: async (checkId: string): Promise<void> => {
    await api.delete(`/accounting/checks/${checkId}`);
  },

  getCheck: async (checkId: string): Promise<CheckManagement> => {
    const response = await api.get(`/accounting/checks/${checkId}`);
    return response.data as CheckManagement;
  },

  // Installment Account Management (حساب‌های اقساطی)
  getInstallmentAccounts: async (filters?: InstallmentFilters): Promise<InstallmentAccount[]> => {
    const params = new URLSearchParams();
    if (filters?.installment_status) params.append('status', filters.installment_status);
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.overdue_only) params.append('overdue_only', 'true');
    if (filters?.next_due_from) params.append('next_due_from', filters.next_due_from);
    if (filters?.next_due_to) params.append('next_due_to', filters.next_due_to);
    if (filters?.search_term) params.append('search_term', filters.search_term);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/accounting/installment-accounts?${params.toString()}`);
    return response.data as InstallmentAccount[];
  },

  createInstallmentAccount: async (installmentData: InstallmentAccountCreate): Promise<InstallmentAccount> => {
    const response = await api.post('/accounting/installment-accounts', installmentData);
    return response.data as InstallmentAccount;
  },

  updateInstallmentAccount: async (installmentId: string, installmentData: Partial<InstallmentAccountCreate>): Promise<InstallmentAccount> => {
    const response = await api.put(`/accounting/installment-accounts/${installmentId}`, installmentData);
    return response.data as InstallmentAccount;
  },

  deleteInstallmentAccount: async (installmentId: string): Promise<void> => {
    await api.delete(`/accounting/installment-accounts/${installmentId}`);
  },

  getInstallmentAccount: async (installmentId: string): Promise<InstallmentAccount> => {
    const response = await api.get(`/accounting/installment-accounts/${installmentId}`);
    return response.data as InstallmentAccount;
  },

  processInstallmentPayment: async (installmentId: string, paymentAmount: number, paymentMethod: string): Promise<InstallmentPayment> => {
    const response = await api.post(`/accounting/installment-accounts/${installmentId}/payment`, {
      payment_amount: paymentAmount,
      payment_method: paymentMethod
    });
    return response.data as InstallmentPayment;
  },

  getInstallmentPayments: async (installmentId: string): Promise<InstallmentPayment[]> => {
    const response = await api.get(`/accounting/installment-accounts/${installmentId}/payments`);
    return response.data as InstallmentPayment[];
  },

  // Bank Reconciliation
  getBankReconciliations: async (bankAccountId?: string): Promise<BankReconciliation[]> => {
    const params = new URLSearchParams();
    if (bankAccountId) params.append('bank_account_id', bankAccountId);
    
    const response = await api.get(`/accounting/bank-reconciliations?${params.toString()}`);
    return response.data as BankReconciliation[];
  },

  createBankReconciliation: async (reconciliationData: any): Promise<BankReconciliation> => {
    const response = await api.post('/accounting/bank-reconciliations', reconciliationData);
    return response.data as BankReconciliation;
  },

  updateBankReconciliation: async (reconciliationId: string, reconciliationData: any): Promise<BankReconciliation> => {
    const response = await api.put(`/accounting/bank-reconciliations/${reconciliationId}`, reconciliationData);
    return response.data as BankReconciliation;
  },

  completeBankReconciliation: async (reconciliationId: string): Promise<BankReconciliation> => {
    const response = await api.post(`/accounting/bank-reconciliations/${reconciliationId}/complete`);
    return response.data as BankReconciliation;
  },

  // Financial Reports
  getTrialBalance: async (asOfDate: string): Promise<TrialBalance> => {
    const response = await api.get(`/accounting/reports/trial-balance?as_of_date=${asOfDate}`);
    return response.data as TrialBalance;
  },

  getBalanceSheet: async (asOfDate: string): Promise<BalanceSheet> => {
    const response = await api.get(`/accounting/reports/balance-sheet?as_of_date=${asOfDate}`);
    return response.data as BalanceSheet;
  },

  getProfitLossStatement: async (periodStart: string, periodEnd: string): Promise<ProfitLossStatement> => {
    const response = await api.get(`/accounting/reports/profit-loss?period_start=${periodStart}&period_end=${periodEnd}`);
    return response.data as ProfitLossStatement;
  },

  // Period Management
  getAccountingPeriods: async (): Promise<AccountingPeriod[]> => {
    const response = await api.get('/accounting/periods');
    return response.data as AccountingPeriod[];
  },

  createAccountingPeriod: async (periodData: any): Promise<AccountingPeriod> => {
    const response = await api.post('/accounting/periods', periodData);
    return response.data as AccountingPeriod;
  },

  lockAccountingPeriod: async (periodId: string, lockReason?: string): Promise<AccountingPeriod> => {
    const response = await api.post(`/accounting/periods/${periodId}/lock`, {
      lock_reason: lockReason
    });
    return response.data as AccountingPeriod;
  },

  unlockAccountingPeriod: async (periodId: string): Promise<AccountingPeriod> => {
    const response = await api.post(`/accounting/periods/${periodId}/unlock`);
    return response.data as AccountingPeriod;
  },

  closeAccountingPeriod: async (periodId: string): Promise<AccountingPeriod> => {
    const response = await api.post(`/accounting/periods/${periodId}/close`);
    return response.data as AccountingPeriod;
  },

  // Dashboard and Analytics
  getAccountingDashboard: async (): Promise<AccountingDashboard> => {
    const response = await api.get('/accounting/dashboard');
    return response.data as AccountingDashboard;
  },

  // Audit Trail
  getAuditTrail: async (filters?: AccountingFilters): Promise<AccountingAuditTrail[]> => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.search_term) params.append('search_term', filters.search_term);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/accounting/audit-trail?${params.toString()}`);
    return response.data as AccountingAuditTrail[];
  },

  // Gold-specific Accounting
  createGoldInvoiceJournalEntry: async (invoiceId: string, invoiceData: any): Promise<JournalEntry> => {
    const response = await api.post(`/accounting/gold-invoice-journal-entry/${invoiceId}`, invoiceData);
    return response.data as JournalEntry;
  },

  // Export Functions
  exportTrialBalance: async (asOfDate: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> => {
    const response = await api.get(`/accounting/reports/trial-balance/export?as_of_date=${asOfDate}&format=${format}`, {
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  exportBalanceSheet: async (asOfDate: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> => {
    const response = await api.get(`/accounting/reports/balance-sheet/export?as_of_date=${asOfDate}&format=${format}`, {
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  exportProfitLoss: async (periodStart: string, periodEnd: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> => {
    const response = await api.get(`/accounting/reports/profit-loss/export?period_start=${periodStart}&period_end=${periodEnd}&format=${format}`, {
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  exportJournalEntries: async (filters?: JournalEntryFilters, format: 'pdf' | 'excel' = 'excel'): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.source_type) params.append('source_type', filters.source_type);
    if (filters?.accounting_period) params.append('accounting_period', filters.accounting_period);
    params.append('format', format);
    
    const response = await api.get(`/accounting/journal-entries/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data as Blob;
  }
};