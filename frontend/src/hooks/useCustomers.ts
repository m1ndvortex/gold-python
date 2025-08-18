import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import type {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomerWithPayments,
  CustomerDebtSummary,
  CustomerSearchFilters,
  Payment,
  PaymentCreate,
  CustomerDebtHistory
} from '../types';

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: CustomerSearchFilters) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  debtSummary: () => [...customerKeys.all, 'debt-summary'] as const,
  debtHistory: (id: string) => [...customerKeys.all, 'debt-history', id] as const,
  payments: (customerId: string) => [...customerKeys.all, 'payments', customerId] as const,
  search: (query: string) => [...customerKeys.all, 'search', query] as const,
};

// Hook for getting customers list
export const useCustomers = (filters?: CustomerSearchFilters) => {
  return useQuery({
    queryKey: customerKeys.list(filters || {}),
    queryFn: () => customerApi.getCustomers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for searching customers
export const useCustomerSearch = (query: string, enabled = true) => {
  return useQuery({
    queryKey: customerKeys.search(query),
    queryFn: () => customerApi.searchCustomers(query),
    enabled: enabled && query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for getting single customer
export const useCustomer = (id: string, includePayments = true) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerApi.getCustomer(id, includePayments),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for getting customers debt summary
export const useCustomersDebtSummary = (onlyWithDebt = true) => {
  return useQuery({
    queryKey: customerKeys.debtSummary(),
    queryFn: () => customerApi.getCustomersDebtSummary(onlyWithDebt),
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for getting customer debt history
export const useCustomerDebtHistory = (id: string) => {
  return useQuery({
    queryKey: customerKeys.debtHistory(id),
    queryFn: () => customerApi.getCustomerDebtHistory(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for getting customer payments
export const useCustomerPayments = (customerId: string, params?: { skip?: number; limit?: number }) => {
  return useQuery({
    queryKey: customerKeys.payments(customerId),
    queryFn: () => customerApi.getCustomerPayments(customerId, params),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation hooks
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customer: CustomerCreate) => customerApi.createCustomer(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.debtSummary() });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, customer }: { id: string; customer: CustomerUpdate }) =>
      customerApi.updateCustomer(id, customer),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.debtSummary() });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => customerApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.debtSummary() });
    },
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, payment }: { customerId: string; payment: PaymentCreate }) =>
      customerApi.createPayment(customerId, payment),
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(customerId) });
      queryClient.invalidateQueries({ queryKey: customerKeys.payments(customerId) });
      queryClient.invalidateQueries({ queryKey: customerKeys.debtHistory(customerId) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.debtSummary() });
    },
  });
};