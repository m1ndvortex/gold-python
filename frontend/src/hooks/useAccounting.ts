import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingApi } from '../services/accountingApi';
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

export const useAccounting = () => {
  const queryClient = useQueryClient();

  // Income Ledger
  const useIncomeLedger = (filters?: LedgerFilters) => {
    return useQuery({
      queryKey: ['income-ledger', filters],
      queryFn: () => accountingApi.getIncomeLedger(filters),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Expense Ledger
  const useExpenseLedger = (filters?: LedgerFilters) => {
    return useQuery({
      queryKey: ['expense-ledger', filters],
      queryFn: () => accountingApi.getExpenseLedger(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreateExpenseEntry = () => {
    return useMutation({
      mutationFn: (expenseData: ExpenseEntryCreate) => 
        accountingApi.createExpenseEntry(expenseData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['expense-ledger'] });
        queryClient.invalidateQueries({ queryKey: ['ledger-summary'] });
        queryClient.invalidateQueries({ queryKey: ['profit-loss-analysis'] });
      },
    });
  };

  // Cash & Bank Ledger
  const useCashBankLedger = (filters?: LedgerFilters) => {
    return useQuery({
      queryKey: ['cash-bank-ledger', filters],
      queryFn: () => accountingApi.getCashBankLedger(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  // Gold Weight Ledger
  const useGoldWeightLedger = (filters?: LedgerFilters) => {
    return useQuery({
      queryKey: ['gold-weight-ledger', filters],
      queryFn: () => accountingApi.getGoldWeightLedger(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  // Profit & Loss Analysis
  const useProfitLossAnalysis = (startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['profit-loss-analysis', startDate, endDate],
      queryFn: () => accountingApi.getProfitLossAnalysis(startDate, endDate),
      enabled: !!startDate && !!endDate,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Debt Tracking
  const useDebtTracking = (filters?: LedgerFilters) => {
    return useQuery({
      queryKey: ['debt-tracking', filters],
      queryFn: () => accountingApi.getDebtTracking(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  // Ledger Summary
  const useLedgerSummary = (filters?: LedgerFilters) => {
    return useQuery({
      queryKey: ['ledger-summary', filters],
      queryFn: () => accountingApi.getLedgerSummary(filters),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  return {
    useIncomeLedger,
    useExpenseLedger,
    useCreateExpenseEntry,
    useCashBankLedger,
    useGoldWeightLedger,
    useProfitLossAnalysis,
    useDebtTracking,
    useLedgerSummary,
  };
};