/**
 * Enhanced Double-Entry Accounting Hooks
 * Comprehensive React Query hooks for the enhanced accounting system
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enhancedAccountingApi } from '../services/enhancedAccountingApi';
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

export const useEnhancedAccounting = () => {
  const queryClient = useQueryClient();

  // Chart of Accounts Management
  const useChartOfAccounts = (includeInactive = false) => {
    return useQuery({
      queryKey: ['chart-of-accounts', includeInactive],
      queryFn: () => enhancedAccountingApi.getChartOfAccounts(includeInactive),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  const useChartOfAccount = (accountId: string) => {
    return useQuery({
      queryKey: ['chart-of-account', accountId],
      queryFn: () => enhancedAccountingApi.getChartOfAccount(accountId),
      enabled: !!accountId,
      staleTime: 10 * 60 * 1000,
    });
  };

  const useCreateChartOfAccount = () => {
    return useMutation({
      mutationFn: (accountData: ChartOfAccountCreate) => 
        enhancedAccountingApi.createChartOfAccount(accountData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  const useUpdateChartOfAccount = () => {
    return useMutation({
      mutationFn: ({ accountId, accountData }: { accountId: string; accountData: ChartOfAccountUpdate }) => 
        enhancedAccountingApi.updateChartOfAccount(accountId, accountData),
      onSuccess: (_, { accountId }) => {
        queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['chart-of-account', accountId] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  const useDeleteChartOfAccount = () => {
    return useMutation({
      mutationFn: (accountId: string) => 
        enhancedAccountingApi.deleteChartOfAccount(accountId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  // Subsidiary Accounts Management (حساب‌های تفصیلی)
  const useSubsidiaryAccounts = (filters?: AccountingFilters) => {
    return useQuery({
      queryKey: ['subsidiary-accounts', filters],
      queryFn: () => enhancedAccountingApi.getSubsidiaryAccounts(filters),
      staleTime: 10 * 60 * 1000,
    });
  };

  const useSubsidiaryAccount = (subsidiaryId: string) => {
    return useQuery({
      queryKey: ['subsidiary-account', subsidiaryId],
      queryFn: () => enhancedAccountingApi.getSubsidiaryAccount(subsidiaryId),
      enabled: !!subsidiaryId,
      staleTime: 10 * 60 * 1000,
    });
  };

  const useCreateSubsidiaryAccount = () => {
    return useMutation({
      mutationFn: (subsidiaryData: SubsidiaryAccountCreate) => 
        enhancedAccountingApi.createSubsidiaryAccount(subsidiaryData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['subsidiary-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  const useUpdateSubsidiaryAccount = () => {
    return useMutation({
      mutationFn: ({ subsidiaryId, subsidiaryData }: { subsidiaryId: string; subsidiaryData: SubsidiaryAccountUpdate }) => 
        enhancedAccountingApi.updateSubsidiaryAccount(subsidiaryId, subsidiaryData),
      onSuccess: (_, { subsidiaryId }) => {
        queryClient.invalidateQueries({ queryKey: ['subsidiary-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['subsidiary-account', subsidiaryId] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  const useDeleteSubsidiaryAccount = () => {
    return useMutation({
      mutationFn: (subsidiaryId: string) => 
        enhancedAccountingApi.deleteSubsidiaryAccount(subsidiaryId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['subsidiary-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  // Journal Entries Management (Double-Entry System)
  const useJournalEntries = (filters?: JournalEntryFilters) => {
    return useQuery({
      queryKey: ['journal-entries', filters],
      queryFn: () => enhancedAccountingApi.getJournalEntries(filters),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const useJournalEntry = (entryId: string) => {
    return useQuery({
      queryKey: ['journal-entry', entryId],
      queryFn: () => enhancedAccountingApi.getJournalEntry(entryId),
      enabled: !!entryId,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreateJournalEntry = () => {
    return useMutation({
      mutationFn: (entryData: JournalEntryCreate) => 
        enhancedAccountingApi.createJournalEntry(entryData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
      },
    });
  };

  const useUpdateJournalEntry = () => {
    return useMutation({
      mutationFn: ({ entryId, entryData }: { entryId: string; entryData: Partial<JournalEntryCreate> }) => 
        enhancedAccountingApi.updateJournalEntry(entryId, entryData),
      onSuccess: (_, { entryId }) => {
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        queryClient.invalidateQueries({ queryKey: ['journal-entry', entryId] });
        queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  const usePostJournalEntry = () => {
    return useMutation({
      mutationFn: (entryId: string) => 
        enhancedAccountingApi.postJournalEntry(entryId),
      onSuccess: (_, entryId) => {
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        queryClient.invalidateQueries({ queryKey: ['journal-entry', entryId] });
        queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
      },
    });
  };

  const useReverseJournalEntry = () => {
    return useMutation({
      mutationFn: ({ entryId, reversalReason }: { entryId: string; reversalReason: string }) => 
        enhancedAccountingApi.reverseJournalEntry(entryId, reversalReason),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
      },
    });
  };

  const useDeleteJournalEntry = () => {
    return useMutation({
      mutationFn: (entryId: string) => 
        enhancedAccountingApi.deleteJournalEntry(entryId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  // General Ledger (دفتر معین)
  const useGeneralLedger = (accountId: string, filters?: AccountingFilters) => {
    return useQuery({
      queryKey: ['general-ledger', accountId, filters],
      queryFn: () => enhancedAccountingApi.getGeneralLedger(accountId, filters),
      enabled: !!accountId,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useAccountBalance = (accountId: string, asOfDate?: string) => {
    return useQuery({
      queryKey: ['account-balance', accountId, asOfDate],
      queryFn: () => enhancedAccountingApi.getAccountBalance(accountId, asOfDate),
      enabled: !!accountId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Check Management System (مدیریت چک‌ها)
  const useChecks = (filters?: CheckFilters) => {
    return useQuery({
      queryKey: ['checks', filters],
      queryFn: () => enhancedAccountingApi.getChecks(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCheck = (checkId: string) => {
    return useQuery({
      queryKey: ['check', checkId],
      queryFn: () => enhancedAccountingApi.getCheck(checkId),
      enabled: !!checkId,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreateCheck = () => {
    return useMutation({
      mutationFn: (checkData: CheckManagementCreate) => 
        enhancedAccountingApi.createCheck(checkData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['checks'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      },
    });
  };

  const useUpdateCheck = () => {
    return useMutation({
      mutationFn: ({ checkId, checkData }: { checkId: string; checkData: Partial<CheckManagementCreate> }) => 
        enhancedAccountingApi.updateCheck(checkId, checkData),
      onSuccess: (_, { checkId }) => {
        queryClient.invalidateQueries({ queryKey: ['checks'] });
        queryClient.invalidateQueries({ queryKey: ['check', checkId] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  const useUpdateCheckStatus = () => {
    return useMutation({
      mutationFn: ({ checkId, status, notes }: { checkId: string; status: string; notes?: string }) => 
        enhancedAccountingApi.updateCheckStatus(checkId, status, notes),
      onSuccess: (_, { checkId }) => {
        queryClient.invalidateQueries({ queryKey: ['checks'] });
        queryClient.invalidateQueries({ queryKey: ['check', checkId] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      },
    });
  };

  const useDeleteCheck = () => {
    return useMutation({
      mutationFn: (checkId: string) => 
        enhancedAccountingApi.deleteCheck(checkId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['checks'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  // Installment Account Management (حساب‌های اقساطی)
  const useInstallmentAccounts = (filters?: InstallmentFilters) => {
    return useQuery({
      queryKey: ['installment-accounts', filters],
      queryFn: () => enhancedAccountingApi.getInstallmentAccounts(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useInstallmentAccount = (installmentId: string) => {
    return useQuery({
      queryKey: ['installment-account', installmentId],
      queryFn: () => enhancedAccountingApi.getInstallmentAccount(installmentId),
      enabled: !!installmentId,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreateInstallmentAccount = () => {
    return useMutation({
      mutationFn: (installmentData: InstallmentAccountCreate) => 
        enhancedAccountingApi.createInstallmentAccount(installmentData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['installment-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  const useProcessInstallmentPayment = () => {
    return useMutation({
      mutationFn: ({ installmentId, paymentAmount, paymentMethod }: { installmentId: string; paymentAmount: number; paymentMethod: string }) => 
        enhancedAccountingApi.processInstallmentPayment(installmentId, paymentAmount, paymentMethod),
      onSuccess: (_, { installmentId }) => {
        queryClient.invalidateQueries({ queryKey: ['installment-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['installment-account', installmentId] });
        queryClient.invalidateQueries({ queryKey: ['installment-payments', installmentId] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      },
    });
  };

  const useInstallmentPayments = (installmentId: string) => {
    return useQuery({
      queryKey: ['installment-payments', installmentId],
      queryFn: () => enhancedAccountingApi.getInstallmentPayments(installmentId),
      enabled: !!installmentId,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Bank Reconciliation
  const useBankReconciliations = (bankAccountId?: string) => {
    return useQuery({
      queryKey: ['bank-reconciliations', bankAccountId],
      queryFn: () => enhancedAccountingApi.getBankReconciliations(bankAccountId),
      staleTime: 10 * 60 * 1000,
    });
  };

  const useCreateBankReconciliation = () => {
    return useMutation({
      mutationFn: (reconciliationData: any) => 
        enhancedAccountingApi.createBankReconciliation(reconciliationData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bank-reconciliations'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  const useCompleteBankReconciliation = () => {
    return useMutation({
      mutationFn: (reconciliationId: string) => 
        enhancedAccountingApi.completeBankReconciliation(reconciliationId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bank-reconciliations'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      },
    });
  };

  // Financial Reports
  const useTrialBalance = (asOfDate: string) => {
    return useQuery({
      queryKey: ['trial-balance', asOfDate],
      queryFn: () => enhancedAccountingApi.getTrialBalance(asOfDate),
      enabled: !!asOfDate,
      staleTime: 10 * 60 * 1000,
    });
  };

  const useBalanceSheet = (asOfDate: string) => {
    return useQuery({
      queryKey: ['balance-sheet', asOfDate],
      queryFn: () => enhancedAccountingApi.getBalanceSheet(asOfDate),
      enabled: !!asOfDate,
      staleTime: 10 * 60 * 1000,
    });
  };

  const useProfitLossStatement = (periodStart: string, periodEnd: string) => {
    return useQuery({
      queryKey: ['profit-loss-statement', periodStart, periodEnd],
      queryFn: () => enhancedAccountingApi.getProfitLossStatement(periodStart, periodEnd),
      enabled: !!periodStart && !!periodEnd,
      staleTime: 10 * 60 * 1000,
    });
  };

  // Period Management
  const useAccountingPeriods = () => {
    return useQuery({
      queryKey: ['accounting-periods'],
      queryFn: () => enhancedAccountingApi.getAccountingPeriods(),
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  };

  const useLockAccountingPeriod = () => {
    return useMutation({
      mutationFn: ({ periodId, lockReason }: { periodId: string; lockReason?: string }) => 
        enhancedAccountingApi.lockAccountingPeriod(periodId, lockReason),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  const useUnlockAccountingPeriod = () => {
    return useMutation({
      mutationFn: (periodId: string) => 
        enhancedAccountingApi.unlockAccountingPeriod(periodId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  const useCloseAccountingPeriod = () => {
    return useMutation({
      mutationFn: (periodId: string) => 
        enhancedAccountingApi.closeAccountingPeriod(periodId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
      },
    });
  };

  // Dashboard and Analytics
  const useAccountingDashboard = () => {
    return useQuery({
      queryKey: ['accounting-dashboard'],
      queryFn: () => enhancedAccountingApi.getAccountingDashboard(),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Audit Trail
  const useAuditTrail = (filters?: AccountingFilters) => {
    return useQuery({
      queryKey: ['audit-trail', filters],
      queryFn: () => enhancedAccountingApi.getAuditTrail(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  // Gold-specific Accounting
  const useCreateGoldInvoiceJournalEntry = () => {
    return useMutation({
      mutationFn: ({ invoiceId, invoiceData }: { invoiceId: string; invoiceData: any }) => 
        enhancedAccountingApi.createGoldInvoiceJournalEntry(invoiceId, invoiceData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      },
    });
  };

  // Export Functions
  const useExportTrialBalance = () => {
    return useMutation({
      mutationFn: ({ asOfDate, format }: { asOfDate: string; format?: 'pdf' | 'excel' }) => 
        enhancedAccountingApi.exportTrialBalance(asOfDate, format),
    });
  };

  const useExportBalanceSheet = () => {
    return useMutation({
      mutationFn: ({ asOfDate, format }: { asOfDate: string; format?: 'pdf' | 'excel' }) => 
        enhancedAccountingApi.exportBalanceSheet(asOfDate, format),
    });
  };

  const useExportProfitLoss = () => {
    return useMutation({
      mutationFn: ({ periodStart, periodEnd, format }: { periodStart: string; periodEnd: string; format?: 'pdf' | 'excel' }) => 
        enhancedAccountingApi.exportProfitLoss(periodStart, periodEnd, format),
    });
  };

  const useExportJournalEntries = () => {
    return useMutation({
      mutationFn: ({ filters, format }: { filters?: JournalEntryFilters; format?: 'pdf' | 'excel' }) => 
        enhancedAccountingApi.exportJournalEntries(filters, format),
    });
  };

  return {
    // Chart of Accounts
    useChartOfAccounts,
    useChartOfAccount,
    useCreateChartOfAccount,
    useUpdateChartOfAccount,
    useDeleteChartOfAccount,

    // Subsidiary Accounts
    useSubsidiaryAccounts,
    useSubsidiaryAccount,
    useCreateSubsidiaryAccount,
    useUpdateSubsidiaryAccount,
    useDeleteSubsidiaryAccount,

    // Journal Entries
    useJournalEntries,
    useJournalEntry,
    useCreateJournalEntry,
    useUpdateJournalEntry,
    usePostJournalEntry,
    useReverseJournalEntry,
    useDeleteJournalEntry,

    // General Ledger
    useGeneralLedger,
    useAccountBalance,

    // Check Management
    useChecks,
    useCheck,
    useCreateCheck,
    useUpdateCheck,
    useUpdateCheckStatus,
    useDeleteCheck,

    // Installment Accounts
    useInstallmentAccounts,
    useInstallmentAccount,
    useCreateInstallmentAccount,
    useProcessInstallmentPayment,
    useInstallmentPayments,

    // Bank Reconciliation
    useBankReconciliations,
    useCreateBankReconciliation,
    useCompleteBankReconciliation,

    // Financial Reports
    useTrialBalance,
    useBalanceSheet,
    useProfitLossStatement,

    // Period Management
    useAccountingPeriods,
    useLockAccountingPeriod,
    useUnlockAccountingPeriod,
    useCloseAccountingPeriod,

    // Dashboard and Analytics
    useAccountingDashboard,

    // Audit Trail
    useAuditTrail,

    // Gold-specific
    useCreateGoldInvoiceJournalEntry,

    // Export Functions
    useExportTrialBalance,
    useExportBalanceSheet,
    useExportProfitLoss,
    useExportJournalEntries,
  };
};