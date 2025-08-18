import { api } from '../utils/api';
import {
  IncomeLedgerEntry,
  ExpenseLedgerEntry,
  ExpenseEntryCreate,
  CashBankLedgerEntry,
  GoldWeightLedgerEntry,
  ProfitLossAnalysis,
  DebtTrackingEntry,
  LedgerSummary,
  LedgerFilters
} from '../types';

export const accountingApi = {
  // Income Ledger
  getIncomeLedger: async (filters?: LedgerFilters): Promise<IncomeLedgerEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);

    const response = await api.get(`/accounting/income-ledger?${params.toString()}`);
    return response.data as IncomeLedgerEntry[];
  },

  // Expense Ledger
  getExpenseLedger: async (filters?: LedgerFilters): Promise<ExpenseLedgerEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.category) params.append('category', filters.category);

    const response = await api.get(`/accounting/expense-ledger?${params.toString()}`);
    return response.data as ExpenseLedgerEntry[];
  },

  createExpenseEntry: async (expenseData: ExpenseEntryCreate): Promise<ExpenseLedgerEntry> => {
    const response = await api.post('/accounting/expense-ledger', expenseData);
    return response.data as ExpenseLedgerEntry;
  },

  // Cash & Bank Ledger
  getCashBankLedger: async (filters?: LedgerFilters): Promise<CashBankLedgerEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.transaction_type) params.append('transaction_type', filters.transaction_type);
    if (filters?.payment_method) params.append('payment_method', filters.payment_method);

    const response = await api.get(`/accounting/cash-bank-ledger?${params.toString()}`);
    return response.data as CashBankLedgerEntry[];
  },

  // Gold Weight Ledger
  getGoldWeightLedger: async (filters?: LedgerFilters): Promise<GoldWeightLedgerEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.transaction_type) params.append('transaction_type', filters.transaction_type);

    const response = await api.get(`/accounting/gold-weight-ledger?${params.toString()}`);
    return response.data as GoldWeightLedgerEntry[];
  },

  // Profit & Loss Analysis
  getProfitLossAnalysis: async (startDate: string, endDate: string): Promise<ProfitLossAnalysis> => {
    const params = new URLSearchParams();
    params.append('start_date', startDate);
    params.append('end_date', endDate);

    const response = await api.get(`/accounting/profit-loss-analysis?${params.toString()}`);
    return response.data as ProfitLossAnalysis;
  },

  // Debt Tracking
  getDebtTracking: async (filters?: LedgerFilters): Promise<DebtTrackingEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.min_debt) params.append('min_debt', filters.min_debt.toString());
    if (filters?.max_debt) params.append('max_debt', filters.max_debt.toString());
    if (filters?.customer_name) params.append('customer_name', filters.customer_name);

    const response = await api.get(`/accounting/debt-tracking?${params.toString()}`);
    return response.data as DebtTrackingEntry[];
  },

  // Ledger Summary
  getLedgerSummary: async (filters?: LedgerFilters): Promise<LedgerSummary> => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await api.get(`/accounting/ledger-summary?${params.toString()}`);
    return response.data as LedgerSummary;
  }
};