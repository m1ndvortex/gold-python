import { api } from '../utils/api';
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

// Customer CRUD operations
export const customerApi = {
  // Get all customers with filtering and pagination
  getCustomers: async (params?: {
    skip?: number;
    limit?: number;
    name?: string;
    phone?: string;
    email?: string;
    has_debt?: boolean;
    min_debt?: number;
    max_debt?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<Customer[]> => {
    const response = await api.get('/customers', { params });
    return response.data as Customer[];
  },

  // Search customers
  searchCustomers: async (query: string): Promise<Customer[]> => {
    const response = await api.get('/customers/search', {
      params: { q: query }
    });
    return response.data as Customer[];
  },

  // Get customer by ID with optional payment history
  getCustomer: async (id: string, includePayments = true): Promise<CustomerWithPayments> => {
    const response = await api.get(`/customers/${id}`, {
      params: { include_payments: includePayments }
    });
    return response.data as CustomerWithPayments;
  },

  // Create new customer
  createCustomer: async (customer: CustomerCreate): Promise<Customer> => {
    const response = await api.post('/customers', customer);
    return response.data as Customer;
  },

  // Update customer
  updateCustomer: async (id: string, customer: CustomerUpdate): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, customer);
    return response.data as Customer;
  },

  // Delete customer
  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  // Get customers debt summary
  getCustomersDebtSummary: async (onlyWithDebt = true): Promise<CustomerDebtSummary[]> => {
    const response = await api.get('/customers/debt-summary', {
      params: { only_with_debt: onlyWithDebt }
    });
    return response.data as CustomerDebtSummary[];
  },

  // Get customer debt history
  getCustomerDebtHistory: async (id: string): Promise<CustomerDebtHistory> => {
    const response = await api.get(`/customers/${id}/debt-history`);
    return response.data as CustomerDebtHistory;
  },

  // Payment operations
  createPayment: async (customerId: string, payment: PaymentCreate): Promise<Payment> => {
    const response = await api.post(`/customers/${customerId}/payments`, payment);
    return response.data as Payment;
  },

  // Get customer payments
  getCustomerPayments: async (customerId: string, params?: {
    skip?: number;
    limit?: number;
  }): Promise<Payment[]> => {
    const response = await api.get(`/customers/${customerId}/payments`, { params });
    return response.data as Payment[];
  }
};