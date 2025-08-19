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
    const rawData = response.data as {
      period: { start_date: string; end_date: string; days: number };
      daily_sales: Array<{ date: string; total_sales: number; total_paid: number; invoice_count: number }>;
      category_sales: Array<{ category: string; total_sales: number; total_quantity: number; percentage: number }>;
    };
    
    // Transform raw API data to Chart.js format
    const labels = rawData.daily_sales?.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [];
    
    const salesData = rawData.daily_sales?.map((item) => item.total_sales || 0) || [];
    
    return {
      labels,
      datasets: [
        {
          label: 'Daily Sales',
          data: salesData,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        }
      ]
    };
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
  },

  // Get daily sales summary (today, week, month)
  getDailySalesSummary: async (targetDate?: string) => {
    const queryParam = targetDate ? `?target_date=${targetDate}` : '';
    const response = await api.get(`/reports/summary/daily${queryParam}`);
    return response.data as {
      date: string;
      today: { total_sales: number; total_paid: number; invoice_count: number };
      week: { total_sales: number; total_paid: number; invoice_count: number };
      month: { total_sales: number; total_paid: number; invoice_count: number };
    };
  }
};