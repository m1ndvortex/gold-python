import { AuthenticatedApiClient } from './AuthenticatedApiClient';
import {
  DashboardSummary,
  SalesChartData,
  CategorySalesData,
  TopProduct,
  LowStockItem,
  UnpaidInvoice
} from '../types';

class DashboardApiService extends AuthenticatedApiClient {
  constructor() {
    super({
      timeout: 15000, // 15 second timeout for dashboard data
      retryAttempts: 2,
    });
  }
  // Get dashboard summary data
  async getSummary(): Promise<DashboardSummary> {
    return this.get<DashboardSummary>('/reports/dashboard/summary');
  }

  // Get sales chart data
  async getSalesChartData(days: number = 30): Promise<SalesChartData> {
    const rawData = await this.get<{
      period: { start_date: string; end_date: string; days: number };
      daily_sales: Array<{ date: string; total_sales: number; total_paid: number; invoice_count: number }>;
      category_sales: Array<{ category: string; total_sales: number; total_quantity: number; percentage: number }>;
    }>(`/reports/charts/sales-overview?days=${days}`);
    
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
  }

  // Get category sales data
  async getCategorySalesData(days: number = 30): Promise<CategorySalesData[]> {
    return this.get<CategorySalesData[]>(`/reports/charts/category-sales?days=${days}`);
  }

  // Get top products
  async getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    const data = await this.get<any>(`/reports/sales/top-products?limit=${limit}`);
    return data.top_by_revenue || [];
  }

  // Get low stock items
  async getLowStockItems(limit: number = 10): Promise<LowStockItem[]> {
    const data = await this.get<any>('/reports/inventory/low-stock');
    return data.items?.slice(0, limit) || [];
  }

  // Get unpaid invoices
  async getUnpaidInvoices(limit: number = 10): Promise<UnpaidInvoice[]> {
    const data = await this.get<any>(`/invoices/?status=pending&limit=${limit}`);
    return data.invoices?.map((invoice: any) => ({
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer?.name || 'Unknown',
      total_amount: invoice.total_amount,
      remaining_amount: invoice.remaining_amount,
      days_overdue: Math.floor((new Date().getTime() - new Date(invoice.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      created_at: invoice.created_at
    })) || [];
  }

  // Get inventory valuation
  async getInventoryValuation(): Promise<any> {
    return this.get<any>('/reports/inventory/valuation');
  }

  // Get customer debt summary
  async getCustomerDebtSummary(): Promise<any> {
    return this.get<any>('/reports/customers/debt-report');
  }

  // Get current gold price (mock for now, can be replaced with real API)
  async getCurrentGoldPrice(): Promise<{
    price_per_gram: number;
    change_percentage: number;
    last_updated: string;
  }> {
    // This would typically call an external gold price API
    // For now, return mock data
    return {
      price_per_gram: 65.40,
      change_percentage: 2.5,
      last_updated: new Date().toISOString()
    };
  }

  // Get daily sales summary (today, week, month)
  async getDailySalesSummary(targetDate?: string): Promise<{
    date: string;
    today: { total_sales: number; total_paid: number; invoice_count: number };
    week: { total_sales: number; total_paid: number; invoice_count: number };
    month: { total_sales: number; total_paid: number; invoice_count: number };
  }> {
    const queryParam = targetDate ? `?target_date=${targetDate}` : '';
    return this.get<{
      date: string;
      today: { total_sales: number; total_paid: number; invoice_count: number };
      week: { total_sales: number; total_paid: number; invoice_count: number };
      month: { total_sales: number; total_paid: number; invoice_count: number };
    }>(`/reports/summary/daily${queryParam}`);
  }

  // Refresh all dashboard data in parallel
  async refreshAll(): Promise<{
    summary: DashboardSummary;
    salesChart: SalesChartData;
    categorySales: CategorySalesData[];
    topProducts: TopProduct[];
    lowStock: LowStockItem[];
    unpaidInvoices: UnpaidInvoice[];
  }> {
    const [summary, salesChart, categorySales, topProducts, lowStock, unpaidInvoices] = 
      await Promise.all([
        this.getSummary(),
        this.getSalesChartData(),
        this.getCategorySalesData(),
        this.getTopProducts(),
        this.getLowStockItems(),
        this.getUnpaidInvoices(),
      ]);
    
    return { summary, salesChart, categorySales, topProducts, lowStock, unpaidInvoices };
  }
}

// Export singleton instance
export const dashboardApi = new DashboardApiService();