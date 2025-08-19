// Analytics type definitions
export interface AnalyticsData {
  id: string;
  data_type: string;
  entity_type?: string;
  entity_id?: string;
  metric_name: string;
  metric_value: number;
  additional_data?: Record<string, any>;
  calculation_date: string;
  calculated_at: string;
}

export interface KPITarget {
  id: string;
  kpi_type: string;
  kpi_name: string;
  target_period: string;
  target_value: number;
  current_value: number;
  achievement_rate: number;
  trend_direction?: string;
  period_start: string;
  period_end: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KPITargetCreate {
  kpi_type: string;
  kpi_name: string;
  target_period: string;
  target_value: number;
  period_start: string;
  period_end: string;
  is_active?: boolean;
}

export interface KPITargetUpdate {
  target_value?: number;
  current_value?: number;
  achievement_rate?: number;
  trend_direction?: string;
  is_active?: boolean;
}

export interface TimeBasedAnalytics {
  daily_patterns: {
    hourly_sales: Record<string, number>;
    peak_hours: number[];
    total_invoices_by_hour: Record<string, number>;
  };
  weekly_patterns: {
    daily_sales: Record<string, number>;
    best_day: string;
    total_invoices_by_day: Record<string, number>;
  };
  monthly_trends: {
    monthly_sales: Record<string, number>;
    growth_trend: string;
    total_invoices_by_month: Record<string, number>;
  };
  year_over_year: {
    current_period_sales: number;
    last_year_sales: number;
    growth_percentage: number;
    comparison_period: string;
  };
}

export interface SalesAnalytics {
  total_sales: number;
  sales_by_period: Record<string, number>;
  top_selling_items: Array<{
    name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  sales_by_category: Record<string, number>;
  growth_rate: number;
  trend_direction: string;
}

export interface InventoryAnalytics {
  total_value: number;
  turnover_rate: number;
  fast_moving_items: Array<{
    name: string;
    total_sold: number;
    current_stock: number;
    turnover_ratio: number;
  }>;
  slow_moving_items: Array<{
    name: string;
    total_sold: number;
    current_stock: number;
    stock_value: number;
  }>;
  dead_stock_count: number;
  stock_optimization_suggestions: Array<{
    type: string;
    item_name: string;
    current_stock: number;
    recommended_action: string;
    priority: string;
  }>;
}

export interface CustomerAnalytics {
  total_customers: number;
  new_customers: number;
  retention_rate: number;
  average_order_value: number;
  customer_lifetime_value: number;
  top_customers: Array<{
    name: string;
    total_revenue: number;
    order_count: number;
  }>;
}

export interface DashboardAnalytics {
  time_based: TimeBasedAnalytics;
  sales: SalesAnalytics;
  inventory: InventoryAnalytics;
  customers: CustomerAnalytics;
  last_updated: string;
}

export interface AnalyticsRequest {
  start_date?: string;
  end_date?: string;
  data_types?: string[];
  entity_types?: string[];
  entity_ids?: string[];
}

export interface AnalyticsResponse {
  data: AnalyticsData[];
  summary: Record<string, any>;
  total_records: number;
}

// Chart data interfaces
export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface ComparisonData {
  category: string;
  current: number;
  previous: number;
  growth: number;
}

// Dashboard card interfaces
export interface AnalyticsCard {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'stable';
    period: string;
  };
  icon: string;
  color: 'gold' | 'green' | 'blue' | 'red' | 'purple';
  trend?: number[];
  description?: string;
}

// Trend analysis interfaces
export interface TrendAnalysis {
  trend_direction: 'up' | 'down' | 'stable';
  growth_rate: number;
  confidence_level: 'high' | 'medium' | 'low';
  data_points: number;
  period: string;
}

// Filter interfaces
export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  categories?: string[];
  customers?: string[];
  products?: string[];
}

export interface DateRangePreset {
  label: string;
  value: string;
  start: Date;
  end: Date;
}

// Export interfaces
export interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'png';
  title: string;
  data_type: string;
  filters: AnalyticsFilters;
  include_charts: boolean;
  include_summary: boolean;
}

export interface ExportRequest {
  config: ExportConfig;
  analytics_data: DashboardAnalytics;
}

// Real-time update interfaces
export interface AnalyticsUpdate {
  type: 'sales' | 'inventory' | 'customer' | 'kpi';
  data: any;
  timestamp: string;
}

export interface AnalyticsWebSocketEvent {
  event_type: 'analytics_update' | 'kpi_alert' | 'trend_change';
  data: AnalyticsUpdate;
}
