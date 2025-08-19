// TypeScript interfaces for Inventory Intelligence system

export interface InventoryTurnoverAnalysis {
  id: string;
  item_id: string;
  analysis_period_start: string;
  analysis_period_end: string;
  units_sold: number;
  average_stock: number;
  turnover_ratio: number;
  velocity_score: number;
  movement_classification: 'fast' | 'normal' | 'slow' | 'dead';
  days_to_stockout?: number;
  seasonal_factor: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  last_sale_date?: string;
  calculated_at: string;
  created_at: string;
}

export interface StockOptimizationRecommendation {
  id: string;
  item_id: string;
  recommendation_type: 'reorder' | 'reduce' | 'increase' | 'discontinue';
  current_stock: number;
  recommended_stock?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  safety_stock?: number;
  max_stock_level?: number;
  economic_order_quantity?: number;
  lead_time_days: number;
  holding_cost_per_unit: number;
  ordering_cost: number;
  stockout_cost: number;
  confidence_score: number;
  reasoning?: string;
  priority_level: 'high' | 'medium' | 'low';
  estimated_savings: number;
  implementation_date?: string;
  status: 'pending' | 'approved' | 'implemented' | 'rejected';
  expires_at?: string;
  created_at: string;
}

export interface DemandForecasting {
  id: string;
  item_id: string;
  forecast_period_start: string;
  forecast_period_end: string;
  forecast_type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  historical_data?: Record<string, any>;
  predicted_demand: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  forecast_accuracy?: number;
  seasonal_patterns?: Record<string, any>;
  trend_component: number;
  forecast_method?: string;
  external_factors?: Record<string, any>;
  generated_at: string;
  created_at: string;
}

export interface SeasonalAnalysis {
  id: string;
  item_id?: string;
  category_id?: string;
  analysis_type: 'item' | 'category' | 'global';
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday' | 'ramadan';
  year: number;
  baseline_sales: number;
  seasonal_sales: number;
  seasonal_factor: number;
  peak_month?: number;
  low_month?: number;
  seasonal_variance: number;
  correlation_strength: number;
  recommendations?: Record<string, any>;
  analyzed_at: string;
  created_at: string;
}

export interface InventoryPerformanceMetrics {
  id: string;
  metric_date: string;
  total_inventory_value: number;
  total_items_count: number;
  fast_moving_items_count: number;
  slow_moving_items_count: number;
  dead_stock_items_count: number;
  average_turnover_ratio: number;
  inventory_to_sales_ratio: number;
  carrying_cost_percentage: number;
  stockout_incidents: number;
  overstock_incidents: number;
  optimization_score: number;
  total_holding_cost: number;
  total_ordering_cost: number;
  total_stockout_cost: number;
  efficiency_rating: 'excellent' | 'good' | 'average' | 'poor';
  calculated_at: string;
  created_at: string;
}

// Dashboard Report Types
export interface TurnoverAnalysisReport {
  item_id: string;
  item_name: string;
  category_name: string;
  current_stock: number;
  turnover_ratio: number;
  velocity_score: number;
  movement_classification: string;
  trend_direction: string;
  days_to_stockout?: number;
  last_sale_date?: string;
}

export interface StockOptimizationReport {
  item_id: string;
  item_name: string;
  recommendation_type: string;
  current_stock: number;
  recommended_stock?: number;
  estimated_savings: number;
  priority_level: string;
  reasoning: string;
}

export interface DemandForecastReport {
  item_id: string;
  item_name: string;
  current_stock: number;
  predicted_demand_7_days: number;
  predicted_demand_30_days: number;
  recommended_action: string;
  confidence_score: number;
}

export interface SeasonalInsightsReport {
  season: string;
  year: number;
  items_affected: number;
  total_impact: number;
  peak_month: string;
  seasonal_recommendations: string[];
}

export interface InventoryIntelligenceDashboard {
  overview_metrics: InventoryPerformanceMetrics;
  turnover_analysis: TurnoverAnalysisReport[];
  stock_optimization: StockOptimizationReport[];
  demand_forecasts: DemandForecastReport[];
  seasonal_insights: SeasonalInsightsReport[];
  fast_moving_items: TurnoverAnalysisReport[];
  slow_moving_items: TurnoverAnalysisReport[];
  dead_stock_items: TurnoverAnalysisReport[];
  optimization_opportunities: Record<string, any>;
  alerts_and_warnings: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    item_name?: string;
    message: string;
    action_required: string;
  }>;
  last_updated: string;
}

export interface InventoryIntelligenceRequest {
  date_range_start?: string;
  date_range_end?: string;
  item_ids?: string[];
  category_ids?: string[];
  include_forecasting?: boolean;
  include_seasonal_analysis?: boolean;
  include_optimization?: boolean;
}

export interface InventoryIntelligenceResponse {
  dashboard_data: InventoryIntelligenceDashboard;
  request_metadata: Record<string, any>;
}
