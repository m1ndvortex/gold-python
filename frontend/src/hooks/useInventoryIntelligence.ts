// React hooks for Inventory Intelligence
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getInventoryIntelligenceDashboard,
  getTurnoverAnalysis,
  createTurnoverAnalysis,
  getStockOptimizationRecommendations,
  createStockOptimizationRecommendation,
  updateStockOptimizationRecommendation,
  getDemandForecasts,
  createDemandForecast,
  getSeasonalAnalysis,
  createSeasonalAnalysis,
  getPerformanceMetrics
} from '../services/inventoryIntelligenceApi';
import {
  InventoryIntelligenceResponse,
  InventoryTurnoverAnalysis,
  StockOptimizationRecommendation,
  DemandForecasting,
  SeasonalAnalysis,
  InventoryPerformanceMetrics
} from '../types/inventoryIntelligence';

// Query Keys
export const inventoryIntelligenceKeys = {
  all: ['inventory-intelligence'] as const,
  dashboard: (startDate?: string, endDate?: string) => 
    [...inventoryIntelligenceKeys.all, 'dashboard', { startDate, endDate }] as const,
  turnover: (filters?: Record<string, any>) => 
    [...inventoryIntelligenceKeys.all, 'turnover', filters] as const,
  optimization: (filters?: Record<string, any>) => 
    [...inventoryIntelligenceKeys.all, 'optimization', filters] as const,
  forecasting: (filters?: Record<string, any>) => 
    [...inventoryIntelligenceKeys.all, 'forecasting', filters] as const,
  seasonal: (filters?: Record<string, any>) => 
    [...inventoryIntelligenceKeys.all, 'seasonal', filters] as const,
  performance: (startDate?: string, endDate?: string) => 
    [...inventoryIntelligenceKeys.all, 'performance', { startDate, endDate }] as const,
};

// Dashboard Hook
export const useInventoryIntelligenceDashboard = (
  startDate?: string,
  endDate?: string,
  itemIds?: string[],
  categoryIds?: string[],
  options?: {
    includeForecast?: boolean;
    includeSeasonal?: boolean;
    includeOptimization?: boolean;
  }
) => {
  return useQuery({
    queryKey: inventoryIntelligenceKeys.dashboard(startDate, endDate),
    queryFn: () => getInventoryIntelligenceDashboard(
      startDate,
      endDate,
      itemIds,
      categoryIds,
      options?.includeForecast,
      options?.includeSeasonal,
      options?.includeOptimization
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Turnover Analysis Hooks
export const useTurnoverAnalysis = (
  startDate?: string,
  endDate?: string,
  classification?: string,
  skip: number = 0,
  limit: number = 100
) => {
  return useQuery({
    queryKey: inventoryIntelligenceKeys.turnover({ startDate, endDate, classification, skip, limit }),
    queryFn: () => getTurnoverAnalysis(startDate, endDate, classification, skip, limit),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

export const useCreateTurnoverAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTurnoverAnalysis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryIntelligenceKeys.turnover() });
      queryClient.invalidateQueries({ queryKey: inventoryIntelligenceKeys.dashboard() });
      toast.success('Turnover analysis created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create turnover analysis: ${error.message}`);
    },
  });
};

// Stock Optimization Hooks
export const useStockOptimizationRecommendations = (
  recommendationType?: string,
  priorityLevel?: string,
  status?: string,
  skip: number = 0,
  limit: number = 100
) => {
  return useQuery({
    queryKey: inventoryIntelligenceKeys.optimization({ recommendationType, priorityLevel, status, skip, limit }),
    queryFn: () => getStockOptimizationRecommendations(recommendationType, priorityLevel, status, skip, limit),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

export const useCreateStockOptimizationRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStockOptimizationRecommendation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryIntelligenceKeys.optimization() });
      queryClient.invalidateQueries({ queryKey: inventoryIntelligenceKeys.dashboard() });
      toast.success('Stock optimization recommendation created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create recommendation: ${error.message}`);
    },
  });
};

export const useUpdateStockOptimizationRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { status?: string; implementation_date?: string } }) =>
      updateStockOptimizationRecommendation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryIntelligenceKeys.optimization() });
      queryClient.invalidateQueries({ queryKey: inventoryIntelligenceKeys.dashboard() });
      toast.success('Recommendation updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update recommendation: ${error.message}`);
    },
  });
};

// Demand Forecasting Hooks
export const useDemandForecasts = (
  itemId?: string,
  forecastType?: string,
  skip: number = 0,
  limit: number = 100
) => {
  return useQuery({
    queryKey: inventoryIntelligenceKeys.forecasting({ itemId, forecastType, skip, limit }),
    queryFn: () => getDemandForecasts(itemId, forecastType, skip, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateDemandForecast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDemandForecast,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryIntelligenceKeys.forecasting() });
      queryClient.invalidateQueries({ queryKey: inventoryIntelligenceKeys.dashboard() });
      toast.success('Demand forecast created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create demand forecast: ${error.message}`);
    },
  });
};

// Seasonal Analysis Hooks
export const useSeasonalAnalysis = (
  season?: string,
  year?: number,
  analysisType?: string,
  skip: number = 0,
  limit: number = 100
) => {
  return useQuery({
    queryKey: inventoryIntelligenceKeys.seasonal({ season, year, analysisType, skip, limit }),
    queryFn: () => getSeasonalAnalysis(season, year, analysisType, skip, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes (seasonal data changes less frequently)
  });
};

export const useCreateSeasonalAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSeasonalAnalysis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryIntelligenceKeys.seasonal() });
      queryClient.invalidateQueries({ queryKey: inventoryIntelligenceKeys.dashboard() });
      toast.success('Seasonal analysis created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create seasonal analysis: ${error.message}`);
    },
  });
};

// Performance Metrics Hook
export const useInventoryPerformanceMetrics = (
  startDate?: string,
  endDate?: string,
  skip: number = 0,
  limit: number = 100
) => {
  return useQuery({
    queryKey: inventoryIntelligenceKeys.performance(startDate, endDate),
    queryFn: () => getPerformanceMetrics(startDate, endDate, skip, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Utility Hooks for Performance Monitoring
export const useInventoryIntelligenceCache = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: inventoryIntelligenceKeys.all });
  };

  const clearCache = () => {
    queryClient.removeQueries({ queryKey: inventoryIntelligenceKeys.all });
  };

  const prefetchDashboard = (startDate?: string, endDate?: string) => {
    queryClient.prefetchQuery({
      queryKey: inventoryIntelligenceKeys.dashboard(startDate, endDate),
      queryFn: () => getInventoryIntelligenceDashboard(startDate, endDate),
      staleTime: 5 * 60 * 1000
    });
  };

  return {
    invalidateAll,
    clearCache,
    prefetchDashboard,
  };
};

// Hook for real-time performance monitoring
export const useInventoryIntelligencePerformance = () => {
  const queryClient = useQueryClient();

  const getQueryState = (queryKey: readonly unknown[]) => {
    const query = queryClient.getQueryState([...queryKey]);
    return {
      isLoading: query?.status === 'loading',
      isError: query?.status === 'error',
      isSuccess: query?.status === 'success',
      isFetching: query?.fetchStatus === 'fetching',
      lastUpdated: query?.dataUpdatedAt,
      errorCount: query?.errorUpdateCount
    };
  };

  const getDashboardPerformance = (startDate?: string, endDate?: string) => {
    return getQueryState(inventoryIntelligenceKeys.dashboard(startDate, endDate));
  };

  return {
    getDashboardPerformance,
    getQueryState
  };
};
