import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  DashboardAnalytics,
  KPITarget,
  KPITargetCreate,
  KPITargetUpdate,
  AnalyticsRequest,
  AnalyticsResponse
} from '../types/analytics';
import {
  getDashboardAnalytics,
  createKPITarget,
  getKPITargets,
  updateKPITarget,
  getAnalyticsData,
  analyticsKeys,
  analyticsRetryConfig
} from '../services/analyticsApi';

// Dashboard Analytics Hook
export const useDashboardAnalytics = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: analyticsKeys.dashboard(startDate, endDate),
    queryFn: () => getDashboardAnalytics(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    ...analyticsRetryConfig,
    onError: (error: any) => {
      console.error('Error fetching dashboard analytics:', error);
      toast.error('Failed to load dashboard analytics');
    }
  });
};

// KPI Targets Hooks
export const useKPITargets = (
  kpiType?: string,
  targetPeriod?: string,
  isActive: boolean = true
) => {
  return useQuery({
    queryKey: analyticsKeys.kpiTargets(kpiType, targetPeriod, isActive),
    queryFn: () => getKPITargets(kpiType, targetPeriod, isActive),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    ...analyticsRetryConfig,
    onError: (error: any) => {
      console.error('Error fetching KPI targets:', error);
      toast.error('Failed to load KPI targets');
    }
  });
};

export const useCreateKPITarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createKPITarget,
    onSuccess: (data: KPITarget) => {
      // Invalidate and refetch KPI targets
      queryClient.invalidateQueries({ queryKey: analyticsKeys.kpiTargets() });
      toast.success(`KPI target "${data.kpi_name}" created successfully`);
    },
    onError: (error: any) => {
      console.error('Error creating KPI target:', error);
      toast.error('Failed to create KPI target');
    }
  });
};

export const useUpdateKPITarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: KPITargetUpdate }) =>
      updateKPITarget(id, updates),
    onSuccess: (data: KPITarget) => {
      // Invalidate and refetch KPI targets
      queryClient.invalidateQueries({ queryKey: analyticsKeys.kpiTargets() });
      toast.success(`KPI target "${data.kpi_name}" updated successfully`);
    },
    onError: (error: any) => {
      console.error('Error updating KPI target:', error);
      toast.error('Failed to update KPI target');
    }
  });
};

// Analytics Data Hook
export const useAnalyticsData = (
  request: AnalyticsRequest,
  skip: number = 0,
  limit: number = 100
) => {
  return useQuery({
    queryKey: analyticsKeys.analyticsData(request, skip, limit),
    queryFn: () => getAnalyticsData(request, skip, limit),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 7 * 60 * 1000, // 7 minutes
    ...analyticsRetryConfig,
    onError: (error: any) => {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    }
  });
};

// Real-time analytics hook (for periodic refresh)
export const useRealtimeAnalytics = (
  startDate?: string,
  endDate?: string,
  refreshInterval: number = 30000 // 30 seconds
) => {
  return useQuery({
    queryKey: analyticsKeys.dashboard(startDate, endDate),
    queryFn: () => getDashboardAnalytics(startDate, endDate),
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: true,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    ...analyticsRetryConfig,
    onError: (error: any) => {
      console.error('Error in real-time analytics update:', error);
      // Don't show toast for real-time errors to avoid spam
    }
  });
};

// Analytics cache management
export const useAnalyticsCache = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
  };

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard() });
  };

  const invalidateKPITargets = () => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.kpiTargets() });
  };

  const invalidateAnalyticsData = () => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.analyticsData });
  };

  const clearCache = () => {
    queryClient.removeQueries({ queryKey: analyticsKeys.all });
  };

  const prefetchDashboard = (startDate?: string, endDate?: string) => {
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.dashboard(startDate, endDate),
      queryFn: () => getDashboardAnalytics(startDate, endDate),
      staleTime: 5 * 60 * 1000
    });
  };

  return {
    invalidateAll,
    invalidateDashboard,
    invalidateKPITargets,
    invalidateAnalyticsData,
    clearCache,
    prefetchDashboard
  };
};

// Hook for analytics performance metrics
export const useAnalyticsPerformance = () => {
  const queryClient = useQueryClient();

  const getQueryState = (queryKey: any[]) => {
    const query = queryClient.getQueryState(queryKey);
    return {
      isLoading: query?.status === 'loading',
      isError: query?.status === 'error',
      isSuccess: query?.status === 'success',
      isFetching: query?.isFetching,
      lastUpdated: query?.dataUpdatedAt,
      errorCount: query?.errorUpdateCount
    };
  };

  const getDashboardPerformance = (startDate?: string, endDate?: string) => {
    return getQueryState(analyticsKeys.dashboard(startDate, endDate));
  };

  const getKPITargetsPerformance = (
    kpiType?: string,
    targetPeriod?: string,
    isActive?: boolean
  ) => {
    return getQueryState(analyticsKeys.kpiTargets(kpiType, targetPeriod, isActive));
  };

  return {
    getDashboardPerformance,
    getKPITargetsPerformance,
    getQueryState
  };
};

// Optimistic updates for better UX
export const useOptimisticKPIUpdate = () => {
  const queryClient = useQueryClient();

  const optimisticallyUpdateKPI = (
    kpiTargetId: string,
    updates: Partial<KPITarget>
  ) => {
    // Get all KPI target query keys
    const kpiQueries = queryClient.getQueriesData({ queryKey: analyticsKeys.kpiTargets() });

    kpiQueries.forEach(([queryKey, data]) => {
      if (Array.isArray(data)) {
        const updatedData = data.map((kpi: KPITarget) =>
          kpi.id === kpiTargetId ? { ...kpi, ...updates } : kpi
        );
        queryClient.setQueryData(queryKey, updatedData);
      }
    });
  };

  return { optimisticallyUpdateKPI };
};

// Analytics error handling
export const useAnalyticsErrorHandler = () => {
  const handleError = (error: any, context: string) => {
    console.error(`Analytics error in ${context}:`, error);
    
    const errorMessage = error?.response?.data?.detail || 
                        error?.message || 
                        'An unexpected error occurred';
    
    const statusCode = error?.response?.status;
    
    if (statusCode === 401) {
      toast.error('Authentication required. Please log in again.');
      // Could trigger logout here
    } else if (statusCode === 403) {
      toast.error('You do not have permission to access this data.');
    } else if (statusCode === 429) {
      toast.error('Too many requests. Please wait a moment and try again.');
    } else if (statusCode >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(errorMessage);
    }
  };

  return { handleError };
};
