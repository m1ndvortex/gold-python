import axios from 'axios';
import {
  DashboardSummary,
  SalesChartData,
  CategorySalesData,
  TopProduct,
  LowStockItem,
  UnpaidInvoice
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const dashboardApi = {
  // Get dashboard summary data
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/reports/dashboard/summary');
    return response.data as DashboardSummary;
  },

  // Get sales chart data
  getSalesChartData: async (days: number = 30): Promise<SalesChartData> => {
    const response = await api.get(`/reports/charts/sales-overview?days=${days}`);
    return response.data as SalesChartData;
  },

  // Get category sales data
  getCategorySalesData: async (days: number = 30): Promise<CategorySalesData[]> => {
    const response = await api.get(`/reports/charts/category-sales?days=${days}`);
    return response.data as CategorySalesData[];
  },

  // Get top products
  getTopProducts: async (limit: number = 5): Promise<TopProduct[]> => {
    const response = await api.get(`/reports/sales/top-products?limit=${limit}`);
    return (response.data as any).top_by_revenue || [];
  },

  // Get low stock items
  getLowStockItems: async (limit: number = 10): Promise<LowStockItem[]> => {
    const response = await api.get(`/reports/inventory/low-stock`);
    return (response.data as any).items?.slice(0, limit) || [];
  },

  // Get unpaid invoices
  getUnpaidInvoices: async (limit: number = 10): Promise<UnpaidInvoice[]> => {
    const response = await api.get(`/invoices?status=pending&limit=${limit}`);
    return (response.data as any).invoices?.map((invoice: any) => ({
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer?.name || 'Unknown',
      total_amount: invoice.total_amount,
      remaining_amount: invoice.remaining_amount,
      days_overdue: Math.floor((new Date().getTime() - new Date(invoice.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      created_at: invoice.created_at
    })) || [];
  },

  // Get inventory valuation
  getInventoryValuation: async () => {
    const response = await api.get('/reports/inventory/valuation');
    return response.data as any;
  },

  // Get customer debt summary
  getCustomerDebtSummary: async () => {
    const response = await api.get('/reports/customers/debt-report');
    return response.data as any;
  },

  // Get current gold price (mock for now, can be replaced with real API)
  getCurrentGoldPrice: async () => {
    // This would typically call an external gold price API
    // For now, return mock data
    return {
      price_per_gram: 65.40,
      change_percentage: 2.5,
      last_updated: new Date().toISOString()
    };
  }
};