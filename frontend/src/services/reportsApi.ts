import { AuthenticatedApiClient } from './AuthenticatedApiClient';

// Utility function to clean up parameters (remove empty strings and undefined values)
const cleanParams = (params: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

export interface SalesTrendData {
  period: string;
  start_date: string;
  end_date: string;
  summary: {
    total_sales: number;
    total_paid: number;
    total_outstanding: number;
    total_items_sold: number;
    average_daily_sales: number;
  };
  trends: Array<{
    period: string;
    total_amount: number;
    paid_amount: number;
    items_sold: number;
    categories: Record<string, number>;
  }>;
}

export interface TopProductsData {
  period: {
    start_date: string;
    end_date: string;
  };
  top_by_quantity: Array<{
    item_id: string;
    item_name: string;
    category_name: string;
    total_quantity: number;
    total_revenue: number;
    transaction_count: number;
    average_price: number;
  }>;
  top_by_revenue: Array<{
    item_id: string;
    item_name: string;
    category_name: string;
    total_quantity: number;
    total_revenue: number;
    transaction_count: number;
    average_price: number;
  }>;
}

export interface InventoryValuationData {
  summary: {
    total_purchase_value: number;
    total_sell_value: number;
    total_potential_profit: number;
    overall_profit_margin: number;
    total_weight_grams: number;
    total_items: number;
    unique_products: number;
  };
  category_breakdown: Array<{
    category_name: string;
    purchase_value: number;
    sell_value: number;
    potential_profit: number;
    profit_margin: number;
    weight_grams: number;
    item_count: number;
  }>;
  items: Array<{
    item_id: string;
    item_name: string;
    category_name: string;
    stock_quantity: number;
    unit_purchase_price: number;
    unit_sell_price: number;
    unit_weight_grams: number;
    total_purchase_value: number;
    total_sell_value: number;
    total_weight_grams: number;
    potential_profit: number;
    profit_margin: number;
    is_active: boolean;
  }>;
}

export interface LowStockData {
  summary: {
    total_low_stock_items: number;
    critical_items: number;
    warning_items: number;
    total_potential_lost_sales: number;
    threshold_multiplier: number;
  };
  items: Array<{
    item_id: string;
    item_name: string;
    category_name: string;
    current_stock: number;
    min_stock_level: number;
    shortage: number;
    unit_price: number;
    unit_weight_grams: number;
    potential_lost_sales: number;
    status: 'critical' | 'warning';
    urgency_score: number;
  }>;
}

export interface CustomerAnalysisData {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_active_customers: number;
    total_revenue: number;
    average_revenue_per_customer: number;
    high_value_customers: number;
    customers_with_debt: number;
    debt_percentage: number;
  };
  customers: Array<{
    customer_id: string;
    customer_name: string;
    phone: string;
    current_debt: number;
    total_lifetime_purchases: number;
    period_purchases: number;
    period_payments: number;
    invoice_count: number;
    average_invoice: number;
    last_purchase_date: string | null;
    last_invoice_date: string | null;
    segment: 'high_value' | 'medium_value' | 'low_value';
    payment_ratio: number;
  }>;
}

export interface DebtReportData {
  summary: {
    total_customers_with_debt: number;
    total_outstanding_debt: number;
    average_debt_per_customer: number;
    min_debt_filter: number;
  };
  debt_aging: {
    current: number;
    thirty_days: number;
    sixty_days: number;
    ninety_days_plus: number;
  };
  customers: Array<{
    customer_id: string;
    customer_name: string;
    phone: string;
    email: string;
    current_debt: number;
    total_lifetime_purchases: number;
    total_payments: number;
    payment_count: number;
    last_payment_date: string | null;
    days_since_last_payment: number | null;
    unpaid_invoice_count: number;
    debt_to_purchases_ratio: number;
    payment_history_score: number;
  }>;
}

export interface SalesOverviewChartData {
  daily_sales: Array<{
    sale_date: string;
    total_sales: number;
    total_paid: number;
    invoice_count: number;
  }>;
  category_sales: Array<{
    category_name: string;
    total_sales: number;
    total_quantity: number;
  }>;
  payment_status: {
    fully_paid: number;
    partially_paid: number;
    unpaid: number;
  };
}

class ReportsApiService extends AuthenticatedApiClient {
  constructor() {
    super({
      timeout: 30000, // 30 second timeout for reports
      retryAttempts: 2,
    });
  }

  // Sales Reports API
  async getSalesTrends(params: {
    start_date?: string;
    end_date?: string;
    period?: 'daily' | 'weekly' | 'monthly';
    category_id?: string;
  }): Promise<SalesTrendData> {
    const cleanedParams = cleanParams(params);
    return this.get<SalesTrendData>('/reports/sales/trends', { params: cleanedParams });
  }

  async getTopProducts(params: {
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<TopProductsData> {
    const cleanedParams = cleanParams(params);
    return this.get<TopProductsData>('/reports/sales/top-products', { params: cleanedParams });
  }

  // Inventory Reports API
  async getInventoryValuation(params: {
    category_id?: string;
    include_inactive?: boolean;
  }): Promise<InventoryValuationData> {
    const cleanedParams = cleanParams(params);
    return this.get<InventoryValuationData>('/reports/inventory/valuation', { params: cleanedParams });
  }

  async getLowStockReport(params: {
    category_id?: string;
    threshold_multiplier?: number;
  }): Promise<LowStockData> {
    const cleanedParams = cleanParams(params);
    return this.get<LowStockData>('/reports/inventory/low-stock', { params: cleanedParams });
  }

  // Customer Reports API
  async getCustomerAnalysis(params: {
    start_date?: string;
    end_date?: string;
    min_purchases?: number;
  }): Promise<CustomerAnalysisData> {
    const cleanedParams = cleanParams(params);
    return this.get<CustomerAnalysisData>('/reports/customers/analysis', { params: cleanedParams });
  }

  async getDebtReport(params: {
    min_debt?: number;
    sort_by?: 'debt_desc' | 'debt_asc' | 'name' | 'last_payment';
  }): Promise<DebtReportData> {
    const cleanedParams = cleanParams(params);
    return this.get<DebtReportData>('/reports/customers/debt-report', { params: cleanedParams });
  }

  // Chart Data API
  async getSalesOverviewChart(params: {
    days?: number;
  }): Promise<SalesOverviewChartData> {
    const cleanedParams = cleanParams(params);
    return this.get<SalesOverviewChartData>('/reports/charts/sales-overview', { params: cleanedParams });
  }

  // Export functionality
  async exportReportToPDF(reportType: string, data: any): Promise<Blob> {
    const response = await this.axiosInstance.post(`/reports/export/${reportType}`, data, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  async exportReportToCSV(reportType: string, data: any): Promise<Blob> {
    const response = await this.axiosInstance.post(`/reports/export/${reportType}/csv`, data, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }
}

// Create singleton instance
const reportsApiService = new ReportsApiService();

// Export individual functions for backward compatibility
export const getSalesTrends = (params: {
  start_date?: string;
  end_date?: string;
  period?: 'daily' | 'weekly' | 'monthly';
  category_id?: string;
}) => reportsApiService.getSalesTrends(params);

export const getTopProducts = (params: {
  start_date?: string;
  end_date?: string;
  limit?: number;
}) => reportsApiService.getTopProducts(params);

export const getInventoryValuation = (params: {
  category_id?: string;
  include_inactive?: boolean;
}) => reportsApiService.getInventoryValuation(params);

export const getLowStockReport = (params: {
  category_id?: string;
  threshold_multiplier?: number;
}) => reportsApiService.getLowStockReport(params);

export const getCustomerAnalysis = (params: {
  start_date?: string;
  end_date?: string;
  min_purchases?: number;
}) => reportsApiService.getCustomerAnalysis(params);

export const getDebtReport = (params: {
  min_debt?: number;
  sort_by?: 'debt_desc' | 'debt_asc' | 'name' | 'last_payment';
}) => reportsApiService.getDebtReport(params);

export const getSalesOverviewChart = (params: {
  days?: number;
}) => reportsApiService.getSalesOverviewChart(params);

export const exportReportToPDF = (reportType: string, data: any) => 
  reportsApiService.exportReportToPDF(reportType, data);

export const exportReportToCSV = (reportType: string, data: any) => 
  reportsApiService.exportReportToCSV(reportType, data);

// Export the service instance as well
export const reportsApi = reportsApiService;