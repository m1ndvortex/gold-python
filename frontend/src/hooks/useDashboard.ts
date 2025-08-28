import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import {
  DashboardSummary,
  SalesChartData,
  CategorySalesData,
  TopProduct,
  LowStockItem,
  UnpaidInvoice
} from '../types';

export const useDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const { canViewDashboard, hasPermission } = usePermissions();

  // Dashboard summary data - only fetch if authenticated and has permission
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !canViewDashboard()) {
        throw new Error('Unauthorized access to dashboard data');
      }

      try {
        // Get real sales data and other metrics
        const [
          dailySalesSummary,
          inventoryValuation,
          debtSummary,
          goldPrice,
          lowStock,
          unpaidInvoices
        ] = await Promise.all([
          dashboardApi.getDailySalesSummary(),
          dashboardApi.getInventoryValuation(),
          dashboardApi.getCustomerDebtSummary(),
          dashboardApi.getCurrentGoldPrice(),
          dashboardApi.getLowStockItems(5),
          dashboardApi.getUnpaidInvoices(5)
        ]);

        return {
          total_sales_today: dailySalesSummary.today.total_sales,
          total_sales_week: dailySalesSummary.week.total_sales,
          total_sales_month: dailySalesSummary.month.total_sales,
          total_inventory_value: (inventoryValuation as any)?.summary?.total_sell_value || 0,
          total_customer_debt: (debtSummary as any)?.summary?.total_outstanding_debt || 0,
          current_gold_price: goldPrice.price_per_gram,
          gold_price_change: goldPrice.change_percentage,
          low_stock_count: lowStock.length,
          unpaid_invoices_count: unpaidInvoices.length
        };
      } catch (error: any) {
        console.error('Dashboard summary fetch failed:', error);
        throw new Error(error.response?.data?.detail || error.message || 'Failed to load dashboard summary');
      }
    },
    enabled: isAuthenticated && canViewDashboard(),
    refetchInterval: isAuthenticated && canViewDashboard() ? 5 * 60 * 1000 : false, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Unauthorized') || error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Sales chart data - only fetch if authenticated and has permission
  const {
    data: salesChartData,
    isLoading: salesChartLoading,
    error: salesChartError,
    refetch: refetchSalesChart
  } = useQuery<SalesChartData>({
    queryKey: ['dashboard', 'sales-chart', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !hasPermission('sales:view')) {
        throw new Error('Unauthorized access to sales chart data');
      }

      try {
        return await dashboardApi.getSalesChartData(30);
      } catch (error: any) {
        console.error('Sales chart fetch failed:', error);
        throw new Error(error.response?.data?.detail || error.message || 'Failed to load sales chart data');
      }
    },
    enabled: isAuthenticated && hasPermission('sales:view'),
    refetchInterval: isAuthenticated && hasPermission('sales:view') ? 10 * 60 * 1000 : false, // Refetch every 10 minutes
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Category sales data - only fetch if authenticated and has permission
  const {
    data: categoryData,
    isLoading: categoryLoading,
    error: categoryError,
    refetch: refetchCategory
  } = useQuery<CategorySalesData[]>({
    queryKey: ['dashboard', 'category-sales', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !hasPermission('inventory:view')) {
        throw new Error('Unauthorized access to category sales data');
      }

      try {
        return await dashboardApi.getCategorySalesData(30);
      } catch (error: any) {
        console.error('Category sales fetch failed:', error);
        throw new Error(error.response?.data?.detail || error.message || 'Failed to load category sales data');
      }
    },
    enabled: isAuthenticated && hasPermission('inventory:view'),
    refetchInterval: isAuthenticated && hasPermission('inventory:view') ? 10 * 60 * 1000 : false,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Top products data - only fetch if authenticated and has permission
  const {
    data: topProducts,
    isLoading: topProductsLoading,
    error: topProductsError,
    refetch: refetchTopProducts
  } = useQuery<TopProduct[]>({
    queryKey: ['dashboard', 'top-products', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !hasPermission('reports:view')) {
        throw new Error('Unauthorized access to top products data');
      }

      try {
        return await dashboardApi.getTopProducts(5);
      } catch (error: any) {
        console.error('Top products fetch failed:', error);
        throw new Error(error.response?.data?.detail || error.message || 'Failed to load top products data');
      }
    },
    enabled: isAuthenticated && hasPermission('reports:view'),
    refetchInterval: isAuthenticated && hasPermission('reports:view') ? 15 * 60 * 1000 : false, // Refetch every 15 minutes
    staleTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Low stock items - only fetch if authenticated and has permission
  const {
    data: lowStockItems,
    isLoading: lowStockLoading,
    error: lowStockError,
    refetch: refetchLowStock
  } = useQuery<LowStockItem[]>({
    queryKey: ['dashboard', 'low-stock', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !hasPermission('inventory:view')) {
        throw new Error('Unauthorized access to low stock data');
      }

      try {
        return await dashboardApi.getLowStockItems(10);
      } catch (error: any) {
        console.error('Low stock fetch failed:', error);
        throw new Error(error.response?.data?.detail || error.message || 'Failed to load low stock data');
      }
    },
    enabled: isAuthenticated && hasPermission('inventory:view'),
    refetchInterval: isAuthenticated && hasPermission('inventory:view') ? 5 * 60 * 1000 : false, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Unpaid invoices - only fetch if authenticated and has permission
  const {
    data: unpaidInvoices,
    isLoading: unpaidInvoicesLoading,
    error: unpaidInvoicesError,
    refetch: refetchUnpaidInvoices
  } = useQuery<UnpaidInvoice[]>({
    queryKey: ['dashboard', 'unpaid-invoices', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !hasPermission('invoices:view')) {
        throw new Error('Unauthorized access to unpaid invoices data');
      }

      try {
        return await dashboardApi.getUnpaidInvoices(10);
      } catch (error: any) {
        console.error('Unpaid invoices fetch failed:', error);
        throw new Error(error.response?.data?.detail || error.message || 'Failed to load unpaid invoices data');
      }
    },
    enabled: isAuthenticated && hasPermission('invoices:view'),
    refetchInterval: isAuthenticated && hasPermission('invoices:view') ? 5 * 60 * 1000 : false, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Unauthorized') || error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Aggregate loading states
  const isLoading = summaryLoading || salesChartLoading || categoryLoading || 
                   topProductsLoading || lowStockLoading || unpaidInvoicesLoading;

  // Aggregate errors
  const hasError = summaryError || salesChartError || categoryError || 
                  topProductsError || lowStockError || unpaidInvoicesError;

  // Refresh all data - only if authenticated and has permissions
  const refreshAll = async () => {
    if (!isAuthenticated) {
      console.warn('Cannot refresh dashboard data: user not authenticated');
      return;
    }

    const refreshPromises = [];
    
    if (canViewDashboard()) {
      refreshPromises.push(refetchSummary());
    }
    
    if (hasPermission('sales:view')) {
      refreshPromises.push(refetchSalesChart());
    }
    
    if (hasPermission('inventory:view')) {
      refreshPromises.push(refetchCategory());
      refreshPromises.push(refetchLowStock());
    }
    
    if (hasPermission('reports:view')) {
      refreshPromises.push(refetchTopProducts());
    }
    
    if (hasPermission('invoices:view')) {
      refreshPromises.push(refetchUnpaidInvoices());
    }

    try {
      await Promise.allSettled(refreshPromises);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
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