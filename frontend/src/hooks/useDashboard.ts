import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';
import {
  DashboardSummary,
  SalesChartData,
  CategorySalesData,
  TopProduct,
  LowStockItem,
  UnpaidInvoice
} from '../types';

export const useDashboard = () => {
  // Dashboard summary data
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      // Since we don't have a dedicated summary endpoint, we'll aggregate data
      const [
        inventoryValuation,
        debtSummary,
        goldPrice,
        lowStock,
        unpaidInvoices
      ] = await Promise.all([
        dashboardApi.getInventoryValuation(),
        dashboardApi.getCustomerDebtSummary(),
        dashboardApi.getCurrentGoldPrice(),
        dashboardApi.getLowStockItems(5),
        dashboardApi.getUnpaidInvoices(5)
      ]);

      // Calculate today's sales (mock for now)
      const today = new Date();
      const todaySales = Math.random() * 5000 + 1000; // Mock data
      const weekSales = todaySales * 7;
      const monthSales = todaySales * 30;

      return {
        total_sales_today: todaySales,
        total_sales_week: weekSales,
        total_sales_month: monthSales,
        total_inventory_value: (inventoryValuation as any)?.summary?.total_sell_value || 0,
        total_customer_debt: (debtSummary as any)?.summary?.total_outstanding_debt || 0,
        current_gold_price: goldPrice.price_per_gram,
        gold_price_change: goldPrice.change_percentage,
        low_stock_count: lowStock.length,
        unpaid_invoices_count: unpaidInvoices.length
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });

  // Sales chart data
  const {
    data: salesChartData,
    isLoading: salesChartLoading,
    error: salesChartError,
    refetch: refetchSalesChart
  } = useQuery<SalesChartData>({
    queryKey: ['dashboard', 'sales-chart'],
    queryFn: () => dashboardApi.getSalesChartData(30),
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    staleTime: 5 * 60 * 1000,
  });

  // Category sales data
  const {
    data: categoryData,
    isLoading: categoryLoading,
    error: categoryError,
    refetch: refetchCategory
  } = useQuery<CategorySalesData[]>({
    queryKey: ['dashboard', 'category-sales'],
    queryFn: () => dashboardApi.getCategorySalesData(30),
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  // Top products data
  const {
    data: topProducts,
    isLoading: topProductsLoading,
    error: topProductsError,
    refetch: refetchTopProducts
  } = useQuery<TopProduct[]>({
    queryKey: ['dashboard', 'top-products'],
    queryFn: () => dashboardApi.getTopProducts(5),
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
    staleTime: 10 * 60 * 1000,
  });

  // Low stock items
  const {
    data: lowStockItems,
    isLoading: lowStockLoading,
    error: lowStockError,
    refetch: refetchLowStock
  } = useQuery<LowStockItem[]>({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: () => dashboardApi.getLowStockItems(10),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000,
  });

  // Unpaid invoices
  const {
    data: unpaidInvoices,
    isLoading: unpaidInvoicesLoading,
    error: unpaidInvoicesError,
    refetch: refetchUnpaidInvoices
  } = useQuery<UnpaidInvoice[]>({
    queryKey: ['dashboard', 'unpaid-invoices'],
    queryFn: () => dashboardApi.getUnpaidInvoices(10),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000,
  });

  // Aggregate loading states
  const isLoading = summaryLoading || salesChartLoading || categoryLoading || 
                   topProductsLoading || lowStockLoading || unpaidInvoicesLoading;

  // Aggregate errors
  const hasError = summaryError || salesChartError || categoryError || 
                  topProductsError || lowStockError || unpaidInvoicesError;

  // Refresh all data
  const refreshAll = () => {
    refetchSummary();
    refetchSalesChart();
    refetchCategory();
    refetchTopProducts();
    refetchLowStock();
    refetchUnpaidInvoices();
  };

  return {
    // Data
    summaryData,
    salesChartData,
    categoryData,
    topProducts,
    lowStockItems,
    unpaidInvoices,
    
    // Loading states
    isLoading,
    summaryLoading,
    salesChartLoading,
    categoryLoading,
    topProductsLoading,
    lowStockLoading,
    unpaidInvoicesLoading,
    
    // Errors
    hasError,
    summaryError,
    salesChartError,
    categoryError,
    topProductsError,
    lowStockError,
    unpaidInvoicesError,
    
    // Actions
    refreshAll,
    refetchSummary,
    refetchSalesChart,
    refetchCategory,
    refetchTopProducts,
    refetchLowStock,
    refetchUnpaidInvoices
  };
};