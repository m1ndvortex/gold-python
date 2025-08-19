// Inventory Intelligence API Service
import { apiGet, apiPost, apiPut } from './api';
import {
  InventoryIntelligenceResponse,
  InventoryIntelligenceRequest,
  InventoryTurnoverAnalysis,
  StockOptimizationRecommendation,
  DemandForecasting,
  SeasonalAnalysis,
  InventoryPerformanceMetrics
} from '../types/inventoryIntelligence';

const API_BASE = '/inventory-intelligence';

// Dashboard API
export const getInventoryIntelligenceDashboard = async (
  startDate?: string,
  endDate?: string,
  itemIds?: string[],
  categoryIds?: string[],
  includeForecast: boolean = true,
  includeSeasonal: boolean = true,
  includeOptimization: boolean = true
): Promise<InventoryIntelligenceResponse> => {
  const params = new URLSearchParams();
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (itemIds && itemIds.length > 0) params.append('item_ids', itemIds.join(','));
  if (categoryIds && categoryIds.length > 0) params.append('category_ids', categoryIds.join(','));
  params.append('include_forecasting', includeForecast.toString());
  params.append('include_seasonal', includeSeasonal.toString());
  params.append('include_optimization', includeOptimization.toString());

  const url = `${API_BASE}/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
  return apiGet<InventoryIntelligenceResponse>(url);
};

// Turnover Analysis API
export const getTurnoverAnalysis = async (
  startDate?: string,
  endDate?: string,
  classification?: string,
  skip: number = 0,
  limit: number = 100
): Promise<InventoryTurnoverAnalysis[]> => {
  const params = new URLSearchParams();
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (classification) params.append('classification', classification);
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const url = `${API_BASE}/turnover-analysis${params.toString() ? `?${params.toString()}` : ''}`;
  return apiGet<InventoryTurnoverAnalysis[]>(url);
};

export const createTurnoverAnalysis = async (
  analysis: Omit<InventoryTurnoverAnalysis, 'id' | 'calculated_at' | 'created_at'>
): Promise<InventoryTurnoverAnalysis> => {
  return apiPost<InventoryTurnoverAnalysis>(`${API_BASE}/turnover-analysis`, analysis);
};

// Stock Optimization API
export const getStockOptimizationRecommendations = async (
  recommendationType?: string,
  priorityLevel?: string,
  status?: string,
  skip: number = 0,
  limit: number = 100
): Promise<StockOptimizationRecommendation[]> => {
  const params = new URLSearchParams();
  
  if (recommendationType) params.append('recommendation_type', recommendationType);
  if (priorityLevel) params.append('priority_level', priorityLevel);
  if (status) params.append('status', status);
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const url = `${API_BASE}/stock-optimization${params.toString() ? `?${params.toString()}` : ''}`;
  return apiGet<StockOptimizationRecommendation[]>(url);
};

export const createStockOptimizationRecommendation = async (
  recommendation: Omit<StockOptimizationRecommendation, 'id' | 'created_at'>
): Promise<StockOptimizationRecommendation> => {
  return apiPost<StockOptimizationRecommendation>(`${API_BASE}/stock-optimization`, recommendation);
};

export const updateStockOptimizationRecommendation = async (
  recommendationId: string,
  updates: { status?: string; implementation_date?: string }
): Promise<StockOptimizationRecommendation> => {
  return apiPut<StockOptimizationRecommendation>(`${API_BASE}/stock-optimization/${recommendationId}`, updates);
};

// Demand Forecasting API
export const getDemandForecasts = async (
  itemId?: string,
  forecastType?: string,
  skip: number = 0,
  limit: number = 100
): Promise<DemandForecasting[]> => {
  const params = new URLSearchParams();
  
  if (itemId) params.append('item_id', itemId);
  if (forecastType) params.append('forecast_type', forecastType);
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const url = `${API_BASE}/demand-forecasting${params.toString() ? `?${params.toString()}` : ''}`;
  return apiGet<DemandForecasting[]>(url);
};

export const createDemandForecast = async (
  forecast: Omit<DemandForecasting, 'id' | 'generated_at' | 'created_at'>
): Promise<DemandForecasting> => {
  return apiPost<DemandForecasting>(`${API_BASE}/demand-forecasting`, forecast);
};

// Seasonal Analysis API
export const getSeasonalAnalysis = async (
  season?: string,
  year?: number,
  analysisType?: string,
  skip: number = 0,
  limit: number = 100
): Promise<SeasonalAnalysis[]> => {
  const params = new URLSearchParams();
  
  if (season) params.append('season', season);
  if (year) params.append('year', year.toString());
  if (analysisType) params.append('analysis_type', analysisType);
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const url = `${API_BASE}/seasonal-analysis${params.toString() ? `?${params.toString()}` : ''}`;
  return apiGet<SeasonalAnalysis[]>(url);
};

export const createSeasonalAnalysis = async (
  analysis: Omit<SeasonalAnalysis, 'id' | 'analyzed_at' | 'created_at'>
): Promise<SeasonalAnalysis> => {
  return apiPost<SeasonalAnalysis>(`${API_BASE}/seasonal-analysis`, analysis);
};

// Performance Metrics API
export const getPerformanceMetrics = async (
  startDate?: string,
  endDate?: string,
  skip: number = 0,
  limit: number = 100
): Promise<InventoryPerformanceMetrics[]> => {
  const params = new URLSearchParams();
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const url = `${API_BASE}/performance-metrics${params.toString() ? `?${params.toString()}` : ''}`;
  return apiGet<InventoryPerformanceMetrics[]>(url);
};
