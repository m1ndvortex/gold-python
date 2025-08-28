import { AuthenticatedApiClient } from './AuthenticatedApiClient';
import type {
  DashboardAnalytics,
  KPITarget,
  KPITargetCreate,
  KPITargetUpdate,
  AnalyticsRequest,
  AnalyticsResponse,
  AnalyticsData
} from '../types/analytics';

class AnalyticsApiService extends AuthenticatedApiClient {
  constructor() {
    super({
      baseURL: '/analytics',
      timeout: 60000, // 60 second timeout for analytics operations
      retryAttempts: 2,
    });
  }

  // Dashboard Analytics API
  async getDashboardAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<DashboardAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/dashboard?${queryString}` : '/dashboard';
    
    return this.get<DashboardAnalytics>(url);
  }

  // KPI Targets API
  async createKPITarget(kpiTarget: KPITargetCreate): Promise<KPITarget> {
    return this.post<KPITarget>('/kpi-targets', kpiTarget);
  }

  async getKPITargets(
    kpiType?: string,
    targetPeriod?: string,
    isActive: boolean = true
  ): Promise<KPITarget[]> {
    const params = new URLSearchParams();
    if (kpiType) params.append('kpi_type', kpiType);
    if (targetPeriod) params.append('target_period', targetPeriod);
    params.append('is_active', isActive.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/kpi-targets?${queryString}` : '/kpi-targets';
    
    return this.get<KPITarget[]>(url);
  }

  async updateKPITarget(
    kpiTargetId: string,
    updates: KPITargetUpdate
  ): Promise<KPITarget> {
    return this.put<KPITarget>(`/kpi-targets/${kpiTargetId}`, updates);
  }

  // Analytics Data API
  async getAnalyticsData(
    request: AnalyticsRequest,
    skip: number = 0,
    limit: number = 100
  ): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    
    if (request.start_date) params.append('start_date', request.start_date);
    if (request.end_date) params.append('end_date', request.end_date);
    if (request.data_types) {
      request.data_types.forEach(type => params.append('data_types', type));
    }
    if (request.entity_types) {
      request.entity_types.forEach(type => params.append('entity_types', type));
    }
    if (request.entity_ids) {
      request.entity_ids.forEach(id => params.append('entity_ids', id));
    }
    
    const queryString = params.toString();
    const url = queryString ? `/analytics-data?${queryString}` : '/analytics-data';
    
    return this.get<AnalyticsResponse>(url);
  }
}

// Create singleton instance
const analyticsApiService = new AnalyticsApiService();

// Export individual functions for backward compatibility
export const getDashboardAnalytics = (
  startDate?: string,
  endDate?: string
) => analyticsApiService.getDashboardAnalytics(startDate, endDate);

export const createKPITarget = (kpiTarget: KPITargetCreate) => 
  analyticsApiService.createKPITarget(kpiTarget);

export const getKPITargets = (
  kpiType?: string,
  targetPeriod?: string,
  isActive: boolean = true
) => analyticsApiService.getKPITargets(kpiType, targetPeriod, isActive);

export const updateKPITarget = (
  kpiTargetId: string,
  updates: KPITargetUpdate
) => analyticsApiService.updateKPITarget(kpiTargetId, updates);

export const getAnalyticsData = (
  request: AnalyticsRequest,
  skip: number = 0,
  limit: number = 100
) => analyticsApiService.getAnalyticsData(request, skip, limit);

// Export the service instance
export const analyticsApi = analyticsApiService;

// Utility functions for date formatting
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString();
};

export const getDateRange = (period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom', customStart?: Date, customEnd?: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: now
      };
    
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      return {
        start: weekStart,
        end: now
      };
    
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: monthStart,
        end: now
      };
    
    case 'quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return {
        start: quarterStart,
        end: now
      };
    
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return {
        start: yearStart,
        end: now
      };
    
    case 'custom':
      return {
        start: customStart || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days ago
        end: customEnd || now
      };
    
    default:
      return {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days ago
        end: now
      };
  }
};

// Cache keys for React Query
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (startDate?: string, endDate?: string) => 
    [...analyticsKeys.all, 'dashboard', { startDate, endDate }] as const,
  kpiTargets: (kpiType?: string, targetPeriod?: string, isActive?: boolean) => 
    [...analyticsKeys.all, 'kpi-targets', { kpiType, targetPeriod, isActive }] as const,
  analyticsData: (request: AnalyticsRequest, skip?: number, limit?: number) => 
    [...analyticsKeys.all, 'analytics-data', { request, skip, limit }] as const,
};

// Error handling
export class AnalyticsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'AnalyticsApiError';
  }
}

// Retry configuration for analytics API calls
export const analyticsRetryConfig = {
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  retryCondition: (error: any) => {
    // Retry on network errors or 5xx status codes
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }
};
