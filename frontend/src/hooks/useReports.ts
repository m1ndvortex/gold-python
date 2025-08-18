import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSalesTrends,
  getTopProducts,
  getInventoryValuation,
  getLowStockReport,
  getCustomerAnalysis,
  getDebtReport,
  getSalesOverviewChart,
  exportReportToPDF,
  exportReportToCSV,
  SalesTrendData,
  TopProductsData,
  InventoryValuationData,
  LowStockData,
  CustomerAnalysisData,
  DebtReportData,
  SalesOverviewChartData,
} from '../services/reportsApi';

// Sales Reports Hooks
export const useSalesTrends = (params: {
  start_date?: string;
  end_date?: string;
  period?: 'daily' | 'weekly' | 'monthly';
  category_id?: string;
}) => {
  return useQuery<SalesTrendData>({
    queryKey: ['sales-trends', params],
    queryFn: () => getSalesTrends(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTopProducts = (params: {
  start_date?: string;
  end_date?: string;
  limit?: number;
}) => {
  return useQuery<TopProductsData>({
    queryKey: ['top-products', params],
    queryFn: () => getTopProducts(params),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Inventory Reports Hooks
export const useInventoryValuation = (params: {
  category_id?: string;
  include_inactive?: boolean;
}) => {
  return useQuery<InventoryValuationData>({
    queryKey: ['inventory-valuation', params],
    queryFn: () => getInventoryValuation(params),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

export const useLowStockReport = (params: {
  category_id?: string;
  threshold_multiplier?: number;
}) => {
  return useQuery<LowStockData>({
    queryKey: ['low-stock-report', params],
    queryFn: () => getLowStockReport(params),
    staleTime: 2 * 60 * 1000, // 2 minutes for more frequent updates
    cacheTime: 5 * 60 * 1000,
  });
};

// Customer Reports Hooks
export const useCustomerAnalysis = (params: {
  start_date?: string;
  end_date?: string;
  min_purchases?: number;
}) => {
  return useQuery<CustomerAnalysisData>({
    queryKey: ['customer-analysis', params],
    queryFn: () => getCustomerAnalysis(params),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

export const useDebtReport = (params: {
  min_debt?: number;
  sort_by?: 'debt_desc' | 'debt_asc' | 'name' | 'last_payment';
}) => {
  return useQuery<DebtReportData>({
    queryKey: ['debt-report', params],
    queryFn: () => getDebtReport(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 8 * 60 * 1000,
  });
};

// Chart Data Hooks
export const useSalesOverviewChart = (params: {
  days?: number;
}) => {
  return useQuery<SalesOverviewChartData>({
    queryKey: ['sales-overview-chart', params],
    queryFn: () => getSalesOverviewChart(params),
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
};

// Export Hooks
export const useExportReport = () => {
  const queryClient = useQueryClient();

  const exportToPDF = useMutation({
    mutationFn: ({ reportType, data }: { reportType: string; data: any }) =>
      exportReportToPDF(reportType, data),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${variables.reportType}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });

  const exportToCSV = useMutation({
    mutationFn: ({ reportType, data }: { reportType: string; data: any }) =>
      exportReportToCSV(reportType, data),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${variables.reportType}-report.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });

  return {
    exportToPDF,
    exportToCSV,
  };
};

// Utility hook for refreshing all reports
export const useRefreshReports = () => {
  const queryClient = useQueryClient();

  const refreshAllReports = () => {
    queryClient.invalidateQueries({ queryKey: ['sales-trends'] });
    queryClient.invalidateQueries({ queryKey: ['top-products'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-valuation'] });
    queryClient.invalidateQueries({ queryKey: ['low-stock-report'] });
    queryClient.invalidateQueries({ queryKey: ['customer-analysis'] });
    queryClient.invalidateQueries({ queryKey: ['debt-report'] });
    queryClient.invalidateQueries({ queryKey: ['sales-overview-chart'] });
  };

  const refreshSalesReports = () => {
    queryClient.invalidateQueries({ queryKey: ['sales-trends'] });
    queryClient.invalidateQueries({ queryKey: ['top-products'] });
    queryClient.invalidateQueries({ queryKey: ['sales-overview-chart'] });
  };

  const refreshInventoryReports = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-valuation'] });
    queryClient.invalidateQueries({ queryKey: ['low-stock-report'] });
  };

  const refreshCustomerReports = () => {
    queryClient.invalidateQueries({ queryKey: ['customer-analysis'] });
    queryClient.invalidateQueries({ queryKey: ['debt-report'] });
  };

  return {
    refreshAllReports,
    refreshSalesReports,
    refreshInventoryReports,
    refreshCustomerReports,
  };
};