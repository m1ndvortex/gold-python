-- Analytics Database Initialization for Advanced Analytics & Business Intelligence
-- This script sets up TimescaleDB extension and creates analytics-specific tables

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create analytics schema for better organization
CREATE SCHEMA IF NOT EXISTS analytics;

-- KPI Snapshots Table (Time-series data)
CREATE TABLE IF NOT EXISTS analytics.kpi_snapshots (
    id UUID DEFAULT gen_random_uuid(),
    kpi_type TEXT NOT NULL, -- 'financial', 'operational', 'customer'
    kpi_name TEXT NOT NULL, -- 'daily_revenue', 'inventory_turnover', 'customer_acquisition'
    value DECIMAL(15,4) NOT NULL,
    target_value DECIMAL(15,4),
    achievement_rate DECIMAL(5,2), -- Percentage
    trend_direction TEXT, -- 'up', 'down', 'stable'
    variance_percentage DECIMAL(8,4),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    metadata JSONB, -- Additional KPI-specific data
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('analytics.kpi_snapshots', 'created_at', if_not_exists => TRUE);

-- Demand Forecasts Table (Time-series data)
CREATE TABLE IF NOT EXISTS analytics.demand_forecasts (
    id UUID DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    predicted_demand DECIMAL(10,2) NOT NULL,
    confidence_interval_lower DECIMAL(10,2),
    confidence_interval_upper DECIMAL(10,2),
    confidence_score DECIMAL(5,4), -- 0-1 scale
    model_used TEXT NOT NULL, -- 'arima', 'linear_regression', 'seasonal_decompose'
    accuracy_score DECIMAL(5,4), -- Historical accuracy
    seasonal_factor DECIMAL(6,4) DEFAULT 1.0,
    trend_component DECIMAL(8,4) DEFAULT 0,
    historical_data JSONB, -- Historical sales data used
    external_factors JSONB, -- Events, promotions affecting demand
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('analytics.demand_forecasts', 'created_at', if_not_exists => TRUE);

-- Custom Reports Configuration Table
CREATE TABLE IF NOT EXISTS analytics.custom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL, -- 'dashboard', 'table', 'chart', 'mixed'
    data_sources JSONB NOT NULL, -- Configuration for data sources
    filters JSONB, -- Filter configurations
    visualizations JSONB NOT NULL, -- Chart and visualization configs
    layout JSONB, -- Layout configuration
    styling JSONB, -- Styling and branding
    schedule_config JSONB, -- Scheduling configuration
    is_scheduled BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    shared_with JSONB, -- User IDs with access
    last_generated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Cache Table for Performance
CREATE TABLE IF NOT EXISTS analytics.analytics_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    ttl INTEGER NOT NULL, -- Time to live in seconds
    expires_at TIMESTAMPTZ NOT NULL,
    cache_type VARCHAR(50) NOT NULL, -- 'kpi', 'report', 'forecast', 'chart'
    entity_type VARCHAR(50), -- 'global', 'customer', 'item', 'category'
    entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stock Optimization Recommendations Table
CREATE TABLE IF NOT EXISTS analytics.stock_optimization_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    recommendation_type VARCHAR(30) NOT NULL, -- 'reorder', 'reduce', 'increase', 'discontinue'
    current_stock INTEGER NOT NULL,
    recommended_stock INTEGER,
    reorder_point INTEGER,
    reorder_quantity INTEGER,
    safety_stock INTEGER,
    max_stock_level INTEGER,
    economic_order_quantity INTEGER,
    lead_time_days INTEGER DEFAULT 7,
    holding_cost_per_unit DECIMAL(10,4) DEFAULT 0,
    ordering_cost DECIMAL(10,2) DEFAULT 0,
    stockout_cost DECIMAL(10,2) DEFAULT 0,
    confidence_score DECIMAL(3,2) DEFAULT 0, -- 0-1 scale
    reasoning TEXT,
    priority_level VARCHAR(10) DEFAULT 'medium', -- 'high', 'medium', 'low'
    estimated_savings DECIMAL(12,2) DEFAULT 0,
    implementation_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'implemented', 'rejected'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

-- Cost Analysis Table (Time-series data)
CREATE TABLE IF NOT EXISTS analytics.cost_analysis (
    id UUID DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'item', 'category', 'global'
    entity_id UUID,
    analysis_date DATE NOT NULL,
    carrying_cost DECIMAL(12,2) DEFAULT 0,
    ordering_cost DECIMAL(12,2) DEFAULT 0,
    stockout_cost DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    cost_per_unit DECIMAL(10,4) DEFAULT 0,
    cost_breakdown JSONB, -- Detailed cost components
    optimization_potential DECIMAL(12,2) DEFAULT 0,
    recommendations JSONB, -- Cost reduction recommendations
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('analytics.cost_analysis', 'created_at', if_not_exists => TRUE);

-- Category Performance Analysis Table (Time-series data)
CREATE TABLE IF NOT EXISTS analytics.category_performance (
    id UUID DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL,
    analysis_date DATE NOT NULL,
    revenue DECIMAL(15,2) DEFAULT 0,
    units_sold INTEGER DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    inventory_turnover DECIMAL(8,4) DEFAULT 0,
    velocity_score DECIMAL(3,2) DEFAULT 0, -- 0-1 scale
    movement_classification TEXT DEFAULT 'normal', -- 'fast', 'normal', 'slow', 'dead'
    seasonal_factor DECIMAL(6,4) DEFAULT 1.0,
    cross_selling_score DECIMAL(3,2) DEFAULT 0, -- 0-1 scale
    performance_trend TEXT DEFAULT 'stable', -- 'improving', 'declining', 'stable'
    recommendations JSONB, -- Performance improvement suggestions
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('analytics.category_performance', 'created_at', if_not_exists => TRUE);

-- Performance Metrics Table (Time-series data)
CREATE TABLE IF NOT EXISTS analytics.performance_metrics (
    id UUID DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL, -- 'response_time', 'memory_usage', 'cpu_usage', 'query_performance'
    metric_name TEXT NOT NULL,
    value DECIMAL(15,4) NOT NULL,
    unit TEXT, -- 'ms', 'mb', 'percent', 'count'
    threshold_value DECIMAL(15,4),
    status TEXT DEFAULT 'normal', -- 'normal', 'warning', 'critical'
    service_name TEXT, -- 'backend', 'database', 'redis', 'frontend'
    endpoint TEXT, -- For API performance metrics
    additional_data JSONB,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, recorded_at)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('analytics.performance_metrics', 'recorded_at', if_not_exists => TRUE);

-- Backup Logs Table
CREATE TABLE IF NOT EXISTS analytics.backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(30) NOT NULL, -- 'database', 'files', 'full'
    backup_status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
    backup_size_bytes BIGINT,
    backup_location VARCHAR(500),
    encryption_used BOOLEAN DEFAULT false,
    compression_used BOOLEAN DEFAULT false,
    verification_status VARCHAR(20), -- 'pending', 'passed', 'failed'
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    retention_until DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Alert Rules Table
CREATE TABLE IF NOT EXISTS analytics.alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'kpi_threshold', 'performance', 'system_health'
    conditions JSONB NOT NULL, -- Alert conditions and thresholds
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    notification_channels JSONB, -- Email, SMS, webhook configurations
    is_active BOOLEAN DEFAULT true,
    cooldown_minutes INTEGER DEFAULT 60, -- Minimum time between alerts
    escalation_rules JSONB, -- Escalation configuration
    created_by UUID NOT NULL,
    last_triggered TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Alert History Table (Time-series data)
CREATE TABLE IF NOT EXISTS analytics.alert_history (
    id UUID DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL,
    alert_level TEXT NOT NULL,
    message TEXT NOT NULL,
    triggered_value DECIMAL(15,4),
    threshold_value DECIMAL(15,4),
    entity_type TEXT,
    entity_id UUID,
    notification_sent BOOLEAN DEFAULT false,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    additional_data JSONB,
    triggered_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, triggered_at)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('analytics.alert_history', 'triggered_at', if_not_exists => TRUE);

-- Image Management Table
CREATE TABLE IF NOT EXISTS analytics.image_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'product', 'category', 'company'
    entity_id UUID NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    image_width INTEGER,
    image_height INTEGER,
    thumbnails JSONB, -- Generated thumbnail information
    is_primary BOOLEAN DEFAULT false,
    alt_text VARCHAR(255),
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    optimization_applied BOOLEAN DEFAULT false,
    compression_ratio DECIMAL(5,4),
    upload_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create optimized indexes for analytics queries and performance

-- KPI Snapshots Indexes
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_type_period ON analytics.kpi_snapshots(kpi_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_name_created ON analytics.kpi_snapshots(kpi_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_achievement ON analytics.kpi_snapshots(achievement_rate) WHERE achievement_rate IS NOT NULL;

-- Demand Forecasts Indexes
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_item_date ON analytics.demand_forecasts(item_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_period_created ON analytics.demand_forecasts(forecast_period, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_accuracy ON analytics.demand_forecasts(accuracy_score) WHERE accuracy_score IS NOT NULL;

-- Custom Reports Indexes
CREATE INDEX IF NOT EXISTS idx_custom_reports_created_by ON analytics.custom_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_reports_type ON analytics.custom_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_custom_reports_scheduled ON analytics.custom_reports(is_scheduled) WHERE is_scheduled = true;
CREATE INDEX IF NOT EXISTS idx_custom_reports_public ON analytics.custom_reports(is_public) WHERE is_public = true;

-- Analytics Cache Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics.analytics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_type_entity ON analytics.analytics_cache(cache_type, entity_type, entity_id);

-- Stock Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_stock_optimization_item ON analytics.stock_optimization_recommendations(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_optimization_type ON analytics.stock_optimization_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_stock_optimization_priority ON analytics.stock_optimization_recommendations(priority_level);
CREATE INDEX IF NOT EXISTS idx_stock_optimization_status ON analytics.stock_optimization_recommendations(status);

-- Cost Analysis Indexes
CREATE INDEX IF NOT EXISTS idx_cost_analysis_entity_date ON analytics.cost_analysis(entity_type, entity_id, analysis_date);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_total_cost ON analytics.cost_analysis(total_cost);

-- Category Performance Indexes
CREATE INDEX IF NOT EXISTS idx_category_performance_category_date ON analytics.category_performance(category_id, analysis_date);
CREATE INDEX IF NOT EXISTS idx_category_performance_classification ON analytics.category_performance(movement_classification);
CREATE INDEX IF NOT EXISTS idx_category_performance_velocity ON analytics.category_performance(velocity_score);

-- Performance Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_recorded ON analytics.performance_metrics(metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_service_status ON analytics.performance_metrics(service_name, status);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON analytics.performance_metrics(endpoint) WHERE endpoint IS NOT NULL;

-- Backup Logs Indexes
CREATE INDEX IF NOT EXISTS idx_backup_logs_type_started ON analytics.backup_logs(backup_type, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON analytics.backup_logs(backup_status);

-- Alert Rules Indexes
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON analytics.alert_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON analytics.alert_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_created_by ON analytics.alert_rules(created_by);

-- Alert History Indexes
CREATE INDEX IF NOT EXISTS idx_alert_history_rule_triggered ON analytics.alert_history(rule_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_level ON analytics.alert_history(alert_level);
CREATE INDEX IF NOT EXISTS idx_alert_history_acknowledged ON analytics.alert_history(acknowledged) WHERE acknowledged = false;

-- Image Management Indexes
CREATE INDEX IF NOT EXISTS idx_image_management_entity ON analytics.image_management(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_image_management_primary ON analytics.image_management(entity_type, entity_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_image_management_sort ON analytics.image_management(entity_type, entity_id, sort_order);

-- Materialized views will be created after main tables exist
-- See analytics_views.sql for materialized view definitions

-- Create retention policies for time-series data (keep 2 years of detailed data)
SELECT add_retention_policy('analytics.kpi_snapshots', INTERVAL '2 years', if_not_exists => true);
SELECT add_retention_policy('analytics.demand_forecasts', INTERVAL '2 years', if_not_exists => true);
SELECT add_retention_policy('analytics.cost_analysis', INTERVAL '2 years', if_not_exists => true);
SELECT add_retention_policy('analytics.category_performance', INTERVAL '2 years', if_not_exists => true);
SELECT add_retention_policy('analytics.performance_metrics', INTERVAL '6 months', if_not_exists => true);
SELECT add_retention_policy('analytics.alert_history', INTERVAL '1 year', if_not_exists => true);

-- Create compression policies for better storage efficiency (only if compression is available)
DO $$ 
BEGIN
    -- Try to add compression policies, but don't fail if compression is not available
    BEGIN
        PERFORM add_compression_policy('analytics.kpi_snapshots', INTERVAL '7 days', if_not_exists => true);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Compression not available for kpi_snapshots, skipping...';
    END;
    
    BEGIN
        PERFORM add_compression_policy('analytics.demand_forecasts', INTERVAL '7 days', if_not_exists => true);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Compression not available for demand_forecasts, skipping...';
    END;
    
    BEGIN
        PERFORM add_compression_policy('analytics.cost_analysis', INTERVAL '7 days', if_not_exists => true);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Compression not available for cost_analysis, skipping...';
    END;
    
    BEGIN
        PERFORM add_compression_policy('analytics.category_performance', INTERVAL '7 days', if_not_exists => true);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Compression not available for category_performance, skipping...';
    END;
    
    BEGIN
        PERFORM add_compression_policy('analytics.performance_metrics', INTERVAL '1 day', if_not_exists => true);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Compression not available for performance_metrics, skipping...';
    END;
    
    BEGIN
        PERFORM add_compression_policy('analytics.alert_history', INTERVAL '7 days', if_not_exists => true);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Compression not available for alert_history, skipping...';
    END;
END $$;

-- Grant permissions to the application user
GRANT USAGE ON SCHEMA analytics TO goldshop_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO goldshop_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA analytics TO goldshop_user;

-- Create a function to clean up expired cache entries
CREATE OR REPLACE FUNCTION analytics.cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM analytics.analytics_cache WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up cache (requires pg_cron extension)
-- This will be handled by the application instead