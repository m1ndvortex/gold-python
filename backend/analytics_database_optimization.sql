-- Analytics Database Query Optimization and Indexing
-- Task 12.2: Optimize database queries and indexing for analytics performance
-- This script creates optimized indexes, materialized views, and query optimizations

-- Enable TimescaleDB extension if not already enabled
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create analytics schema if not exists
CREATE SCHEMA IF NOT EXISTS analytics;

-- =====================================================
-- PART 1: OPTIMIZED INDEXES FOR ANALYTICS QUERIES
-- =====================================================

-- Invoice-related analytics indexes (time-series optimized)
CREATE INDEX IF NOT EXISTS idx_invoices_created_at_status 
ON invoices(created_at DESC, status) 
WHERE status IN ('completed', 'paid', 'partially_paid');

CREATE INDEX IF NOT EXISTS idx_invoices_date_customer_amount 
ON invoices(DATE(created_at), customer_id, total_amount) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_invoices_month_year_revenue 
ON invoices(EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at), total_amount) 
WHERE status = 'completed';

-- Invoice items analytics indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_item_date_quantity 
ON invoice_items(inventory_item_id, (SELECT created_at FROM invoices WHERE id = invoice_id), quantity);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_created_at 
ON invoice_items(invoice_id, (SELECT created_at FROM invoices WHERE id = invoice_id));

-- Inventory analytics indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_category_stock_price 
ON inventory_items(category_id, stock_quantity, purchase_price, sell_price) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_inventory_items_turnover_analysis 
ON inventory_items(category_id, stock_quantity, purchase_price) 
WHERE is_active = true AND stock_quantity >= 0;

-- Customer analytics indexes
CREATE INDEX IF NOT EXISTS idx_customers_analytics_profile 
ON customers(customer_type, total_purchases, current_debt, last_purchase_date) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_customers_segmentation 
ON customers(total_purchases DESC, current_debt, customer_type) 
WHERE is_active = true;

-- Payment analytics indexes
CREATE INDEX IF NOT EXISTS idx_payments_date_customer_amount 
ON payments(DATE(payment_date), customer_id, amount);

CREATE INDEX IF NOT EXISTS idx_payments_method_date 
ON payments(payment_method, payment_date DESC);

-- Category performance indexes
CREATE INDEX IF NOT EXISTS idx_categories_performance 
ON categories(parent_id, is_active, sort_order) 
WHERE is_active = true;

-- =====================================================
-- PART 2: MATERIALIZED VIEWS FOR COMMON ANALYTICS
-- =====================================================

-- Daily Sales Summary (most frequently accessed analytics query)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.daily_sales_summary AS
SELECT 
    DATE(i.created_at) as sale_date,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT i.customer_id) as unique_customers,
    SUM(i.total_amount) as total_revenue,
    AVG(i.total_amount) as avg_transaction_value,
    SUM(i.paid_amount) as total_paid,
    SUM(i.remaining_amount) as total_outstanding,
    SUM(CASE WHEN i.status = 'completed' THEN i.total_amount ELSE 0 END) as completed_revenue,
    COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_transactions,
    -- Calculate profit metrics
    SUM(ii.total_price) as gross_sales,
    SUM(ii.quantity * inv.purchase_price) as total_cost,
    SUM(ii.total_price) - SUM(ii.quantity * inv.purchase_price) as gross_profit,
    CASE 
        WHEN SUM(ii.total_price) > 0 
        THEN ((SUM(ii.total_price) - SUM(ii.quantity * inv.purchase_price)) / SUM(ii.total_price) * 100)
        ELSE 0 
    END as profit_margin_percent
FROM invoices i
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
LEFT JOIN inventory_items inv ON ii.inventory_item_id = inv.id
WHERE i.status IN ('completed', 'paid', 'partially_paid')
GROUP BY DATE(i.created_at)
ORDER BY sale_date DESC;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_sales_summary_date 
ON analytics.daily_sales_summary(sale_date);

-- Monthly Sales Summary for trend analysis
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.monthly_sales_summary AS
SELECT 
    EXTRACT(YEAR FROM i.created_at) as year,
    EXTRACT(MONTH FROM i.created_at) as month,
    DATE_TRUNC('month', i.created_at) as month_start,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT i.customer_id) as unique_customers,
    SUM(i.total_amount) as total_revenue,
    AVG(i.total_amount) as avg_transaction_value,
    SUM(i.paid_amount) as total_paid,
    SUM(i.remaining_amount) as total_outstanding,
    -- Profit calculations
    SUM(ii.total_price) as gross_sales,
    SUM(ii.quantity * inv.purchase_price) as total_cost,
    SUM(ii.total_price) - SUM(ii.quantity * inv.purchase_price) as gross_profit,
    CASE 
        WHEN SUM(ii.total_price) > 0 
        THEN ((SUM(ii.total_price) - SUM(ii.quantity * inv.purchase_price)) / SUM(ii.total_price) * 100)
        ELSE 0 
    END as profit_margin_percent,
    -- Growth calculations (compared to previous month)
    LAG(SUM(i.total_amount)) OVER (ORDER BY EXTRACT(YEAR FROM i.created_at), EXTRACT(MONTH FROM i.created_at)) as prev_month_revenue,
    CASE 
        WHEN LAG(SUM(i.total_amount)) OVER (ORDER BY EXTRACT(YEAR FROM i.created_at), EXTRACT(MONTH FROM i.created_at)) > 0
        THEN ((SUM(i.total_amount) - LAG(SUM(i.total_amount)) OVER (ORDER BY EXTRACT(YEAR FROM i.created_at), EXTRACT(MONTH FROM i.created_at))) 
              / LAG(SUM(i.total_amount)) OVER (ORDER BY EXTRACT(YEAR FROM i.created_at), EXTRACT(MONTH FROM i.created_at)) * 100)
        ELSE 0
    END as revenue_growth_percent
FROM invoices i
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
LEFT JOIN inventory_items inv ON ii.inventory_item_id = inv.id
WHERE i.status IN ('completed', 'paid', 'partially_paid')
GROUP BY EXTRACT(YEAR FROM i.created_at), EXTRACT(MONTH FROM i.created_at), DATE_TRUNC('month', i.created_at)
ORDER BY year DESC, month DESC;

-- Create unique index on monthly summary
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_sales_summary_year_month 
ON analytics.monthly_sales_summary(year, month);

-- Inventory Turnover Analysis (critical for operational KPIs)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.inventory_turnover_summary AS
SELECT 
    inv.id as item_id,
    inv.name as item_name,
    cat.name as category_name,
    cat.id as category_id,
    inv.stock_quantity as current_stock,
    inv.purchase_price,
    inv.sell_price,
    -- Sales data for last 30 days
    COALESCE(sales_30d.units_sold, 0) as units_sold_30d,
    COALESCE(sales_30d.revenue, 0) as revenue_30d,
    COALESCE(sales_30d.profit, 0) as profit_30d,
    -- Sales data for last 90 days
    COALESCE(sales_90d.units_sold, 0) as units_sold_90d,
    COALESCE(sales_90d.revenue, 0) as revenue_90d,
    -- Turnover calculations
    CASE 
        WHEN inv.stock_quantity > 0 AND COALESCE(sales_30d.units_sold, 0) > 0
        THEN COALESCE(sales_30d.units_sold, 0)::DECIMAL / inv.stock_quantity
        ELSE 0 
    END as turnover_ratio_30d,
    CASE 
        WHEN inv.stock_quantity > 0 AND COALESCE(sales_90d.units_sold, 0) > 0
        THEN (COALESCE(sales_90d.units_sold, 0)::DECIMAL / 3) / inv.stock_quantity  -- Monthly average
        ELSE 0 
    END as turnover_ratio_monthly_avg,
    -- Movement classification
    CASE 
        WHEN COALESCE(sales_30d.units_sold, 0) = 0 THEN 'dead'
        WHEN COALESCE(sales_30d.units_sold, 0)::DECIMAL / NULLIF(inv.stock_quantity, 0) > 2 THEN 'fast'
        WHEN COALESCE(sales_30d.units_sold, 0)::DECIMAL / NULLIF(inv.stock_quantity, 0) > 0.5 THEN 'normal'
        ELSE 'slow'
    END as movement_classification,
    -- Days to stockout calculation
    CASE 
        WHEN COALESCE(sales_30d.units_sold, 0) > 0 
        THEN (inv.stock_quantity * 30.0 / COALESCE(sales_30d.units_sold, 1))::INTEGER
        ELSE NULL
    END as days_to_stockout,
    -- Last sale information
    sales_30d.last_sale_date,
    CASE 
        WHEN sales_30d.last_sale_date IS NOT NULL 
        THEN CURRENT_DATE - sales_30d.last_sale_date::DATE
        ELSE NULL
    END as days_since_last_sale,
    -- Inventory value
    inv.stock_quantity * inv.purchase_price as inventory_value,
    -- Velocity score (0-1 scale)
    CASE 
        WHEN COALESCE(sales_30d.units_sold, 0) = 0 THEN 0
        ELSE LEAST(1.0, (COALESCE(sales_30d.units_sold, 0)::DECIMAL / NULLIF(inv.stock_quantity, 1)) / 2.0)
    END as velocity_score
FROM inventory_items inv
LEFT JOIN categories cat ON inv.category_id = cat.id
-- 30-day sales subquery
LEFT JOIN (
    SELECT 
        ii.inventory_item_id,
        SUM(ii.quantity) as units_sold,
        SUM(ii.total_price) as revenue,
        SUM(ii.total_price - (ii.quantity * inv_sub.purchase_price)) as profit,
        MAX(i.created_at) as last_sale_date
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    JOIN inventory_items inv_sub ON ii.inventory_item_id = inv_sub.id
    WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND i.status = 'completed'
    GROUP BY ii.inventory_item_id
) sales_30d ON inv.id = sales_30d.inventory_item_id
-- 90-day sales subquery
LEFT JOIN (
    SELECT 
        ii.inventory_item_id,
        SUM(ii.quantity) as units_sold,
        SUM(ii.total_price) as revenue
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    WHERE i.created_at >= CURRENT_DATE - INTERVAL '90 days'
        AND i.status = 'completed'
    GROUP BY ii.inventory_item_id
) sales_90d ON inv.id = sales_90d.inventory_item_id
WHERE inv.is_active = true
ORDER BY velocity_score DESC, turnover_ratio_30d DESC;

-- Create unique index on inventory turnover summary
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_turnover_summary_item 
ON analytics.inventory_turnover_summary(item_id);

-- Create additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_inventory_turnover_summary_category 
ON analytics.inventory_turnover_summary(category_id, movement_classification);

CREATE INDEX IF NOT EXISTS idx_inventory_turnover_summary_velocity 
ON analytics.inventory_turnover_summary(velocity_score DESC, movement_classification);

-- Customer Analytics Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.customer_analytics_summary AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.customer_type,
    c.total_purchases,
    c.current_debt,
    c.last_purchase_date,
    -- Transaction metrics
    COALESCE(recent_activity.transaction_count_30d, 0) as transaction_count_30d,
    COALESCE(recent_activity.total_spent_30d, 0) as total_spent_30d,
    COALESCE(recent_activity.avg_transaction_30d, 0) as avg_transaction_30d,
    COALESCE(lifetime_activity.total_transactions, 0) as total_transactions,
    COALESCE(lifetime_activity.avg_transaction_value, 0) as avg_transaction_value,
    -- Customer segmentation metrics
    CASE 
        WHEN c.total_purchases > 50000 THEN 'high_value'
        WHEN c.total_purchases > 20000 THEN 'medium_value'
        WHEN c.total_purchases > 5000 THEN 'regular'
        ELSE 'new'
    END as value_segment,
    CASE 
        WHEN c.last_purchase_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'active'
        WHEN c.last_purchase_date >= CURRENT_DATE - INTERVAL '90 days' THEN 'at_risk'
        WHEN c.last_purchase_date >= CURRENT_DATE - INTERVAL '180 days' THEN 'dormant'
        ELSE 'inactive'
    END as activity_segment,
    -- Days since last purchase
    CASE 
        WHEN c.last_purchase_date IS NOT NULL 
        THEN CURRENT_DATE - c.last_purchase_date::DATE
        ELSE NULL
    END as days_since_last_purchase,
    -- Customer lifetime value estimation
    CASE 
        WHEN lifetime_activity.total_transactions > 0 AND c.last_purchase_date IS NOT NULL
        THEN (c.total_purchases / lifetime_activity.total_transactions) * 
             GREATEST(1, 12 - (CURRENT_DATE - c.last_purchase_date::DATE) / 30.0)
        ELSE c.total_purchases
    END as estimated_clv
FROM customers c
-- Recent activity (30 days)
LEFT JOIN (
    SELECT 
        customer_id,
        COUNT(*) as transaction_count_30d,
        SUM(total_amount) as total_spent_30d,
        AVG(total_amount) as avg_transaction_30d
    FROM invoices
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND status = 'completed'
    GROUP BY customer_id
) recent_activity ON c.id = recent_activity.customer_id
-- Lifetime activity
LEFT JOIN (
    SELECT 
        customer_id,
        COUNT(*) as total_transactions,
        AVG(total_amount) as avg_transaction_value
    FROM invoices
    WHERE status = 'completed'
    GROUP BY customer_id
) lifetime_activity ON c.id = lifetime_activity.customer_id
WHERE c.is_active = true
ORDER BY c.total_purchases DESC;

-- Create unique index on customer analytics
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_analytics_summary_customer 
ON analytics.customer_analytics_summary(customer_id);

-- Create indexes for segmentation queries
CREATE INDEX IF NOT EXISTS idx_customer_analytics_segments 
ON analytics.customer_analytics_summary(value_segment, activity_segment);

CREATE INDEX IF NOT EXISTS idx_customer_analytics_clv 
ON analytics.customer_analytics_summary(estimated_clv DESC);

-- Category Performance Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.category_performance_summary AS
SELECT 
    cat.id as category_id,
    cat.name as category_name,
    cat.parent_id,
    -- Inventory metrics
    COUNT(inv.id) as total_items,
    COUNT(CASE WHEN inv.stock_quantity > 0 THEN 1 END) as items_in_stock,
    COUNT(CASE WHEN inv.stock_quantity = 0 THEN 1 END) as items_out_of_stock,
    SUM(inv.stock_quantity * inv.purchase_price) as total_inventory_value,
    AVG(inv.purchase_price) as avg_purchase_price,
    AVG(inv.sell_price) as avg_sell_price,
    -- Sales performance (last 30 days)
    COALESCE(sales_data.revenue_30d, 0) as revenue_30d,
    COALESCE(sales_data.units_sold_30d, 0) as units_sold_30d,
    COALESCE(sales_data.transactions_30d, 0) as transactions_30d,
    COALESCE(sales_data.profit_30d, 0) as profit_30d,
    -- Sales performance (last 90 days)
    COALESCE(sales_data.revenue_90d, 0) as revenue_90d,
    COALESCE(sales_data.units_sold_90d, 0) as units_sold_90d,
    -- Performance metrics
    CASE 
        WHEN COALESCE(sales_data.revenue_30d, 0) > 0 AND SUM(inv.stock_quantity * inv.purchase_price) > 0
        THEN COALESCE(sales_data.profit_30d, 0) / COALESCE(sales_data.revenue_30d, 1) * 100
        ELSE 0
    END as profit_margin_30d,
    CASE 
        WHEN SUM(inv.stock_quantity * inv.purchase_price) > 0 AND COALESCE(sales_data.revenue_30d, 0) > 0
        THEN COALESCE(sales_data.revenue_30d, 0) / (SUM(inv.stock_quantity * inv.purchase_price) / 30.0)
        ELSE 0
    END as inventory_turnover_30d,
    -- Category classification
    CASE 
        WHEN COALESCE(sales_data.revenue_30d, 0) = 0 THEN 'inactive'
        WHEN COALESCE(sales_data.revenue_30d, 0) > 10000 THEN 'high_performer'
        WHEN COALESCE(sales_data.revenue_30d, 0) > 5000 THEN 'good_performer'
        WHEN COALESCE(sales_data.revenue_30d, 0) > 1000 THEN 'average_performer'
        ELSE 'low_performer'
    END as performance_category
FROM categories cat
LEFT JOIN inventory_items inv ON cat.id = inv.category_id AND inv.is_active = true
-- Sales data subquery
LEFT JOIN (
    SELECT 
        inv_sub.category_id,
        -- 30-day metrics
        SUM(CASE WHEN i.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN ii.total_price ELSE 0 END) as revenue_30d,
        SUM(CASE WHEN i.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN ii.quantity ELSE 0 END) as units_sold_30d,
        COUNT(DISTINCT CASE WHEN i.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN i.id END) as transactions_30d,
        SUM(CASE WHEN i.created_at >= CURRENT_DATE - INTERVAL '30 days' 
                 THEN ii.total_price - (ii.quantity * inv_sub.purchase_price) ELSE 0 END) as profit_30d,
        -- 90-day metrics
        SUM(CASE WHEN i.created_at >= CURRENT_DATE - INTERVAL '90 days' THEN ii.total_price ELSE 0 END) as revenue_90d,
        SUM(CASE WHEN i.created_at >= CURRENT_DATE - INTERVAL '90 days' THEN ii.quantity ELSE 0 END) as units_sold_90d
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    JOIN inventory_items inv_sub ON ii.inventory_item_id = inv_sub.id
    WHERE i.status = 'completed'
    GROUP BY inv_sub.category_id
) sales_data ON cat.id = sales_data.category_id
WHERE cat.is_active = true
GROUP BY cat.id, cat.name, cat.parent_id, sales_data.revenue_30d, sales_data.units_sold_30d, 
         sales_data.transactions_30d, sales_data.profit_30d, sales_data.revenue_90d, sales_data.units_sold_90d
ORDER BY revenue_30d DESC;

-- Create unique index on category performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_performance_summary_category 
ON analytics.category_performance_summary(category_id);

-- Create index for performance filtering
CREATE INDEX IF NOT EXISTS idx_category_performance_classification 
ON analytics.category_performance_summary(performance_category, revenue_30d DESC);

-- =====================================================
-- PART 3: QUERY OPTIMIZATION FUNCTIONS
-- =====================================================

-- Function to refresh all materialized views efficiently
CREATE OR REPLACE FUNCTION analytics.refresh_all_materialized_views()
RETURNS void AS $
BEGIN
    -- Refresh in dependency order
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.daily_sales_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.monthly_sales_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.inventory_turnover_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.customer_analytics_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.category_performance_summary;
    
    -- Log refresh time
    INSERT INTO analytics.materialized_view_refresh_log (refresh_time, views_refreshed)
    VALUES (CURRENT_TIMESTAMP, 5);
END;
$ LANGUAGE plpgsql;

-- Create log table for materialized view refreshes
CREATE TABLE IF NOT EXISTS analytics.materialized_view_refresh_log (
    id SERIAL PRIMARY KEY,
    refresh_time TIMESTAMPTZ NOT NULL,
    views_refreshed INTEGER NOT NULL,
    duration_seconds DECIMAL(10,3)
);

-- Function for optimized KPI calculations
CREATE OR REPLACE FUNCTION analytics.calculate_financial_kpis(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    total_revenue DECIMAL(15,2),
    total_transactions INTEGER,
    avg_transaction_value DECIMAL(12,2),
    total_profit DECIMAL(15,2),
    profit_margin DECIMAL(5,2),
    growth_rate DECIMAL(5,2)
) AS $
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT 
            SUM(dss.total_revenue) as revenue,
            SUM(dss.transaction_count) as transactions,
            AVG(dss.avg_transaction_value) as avg_transaction,
            SUM(dss.gross_profit) as profit
        FROM analytics.daily_sales_summary dss
        WHERE dss.sale_date BETWEEN start_date AND end_date
    ),
    previous_period AS (
        SELECT 
            SUM(dss.total_revenue) as prev_revenue
        FROM analytics.daily_sales_summary dss
        WHERE dss.sale_date BETWEEN 
            start_date - (end_date - start_date + 1) AND 
            start_date - 1
    )
    SELECT 
        cp.revenue,
        cp.transactions,
        cp.avg_transaction,
        cp.profit,
        CASE WHEN cp.revenue > 0 THEN cp.profit / cp.revenue * 100 ELSE 0 END,
        CASE WHEN pp.prev_revenue > 0 
             THEN (cp.revenue - pp.prev_revenue) / pp.prev_revenue * 100 
             ELSE 0 END
    FROM current_period cp
    CROSS JOIN previous_period pp;
END;
$ LANGUAGE plpgsql;

-- Function for optimized inventory analysis
CREATE OR REPLACE FUNCTION analytics.get_inventory_insights(
    category_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    total_items INTEGER,
    total_value DECIMAL(15,2),
    fast_moving_items INTEGER,
    slow_moving_items INTEGER,
    dead_stock_items INTEGER,
    avg_turnover_ratio DECIMAL(8,4),
    stockout_risk_items INTEGER
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_items,
        SUM(its.inventory_value) as total_value,
        COUNT(CASE WHEN its.movement_classification = 'fast' THEN 1 END)::INTEGER as fast_moving,
        COUNT(CASE WHEN its.movement_classification = 'slow' THEN 1 END)::INTEGER as slow_moving,
        COUNT(CASE WHEN its.movement_classification = 'dead' THEN 1 END)::INTEGER as dead_stock,
        AVG(its.turnover_ratio_30d) as avg_turnover,
        COUNT(CASE WHEN its.days_to_stockout IS NOT NULL AND its.days_to_stockout <= 7 THEN 1 END)::INTEGER as stockout_risk
    FROM analytics.inventory_turnover_summary its
    WHERE (category_filter IS NULL OR its.category_id = category_filter);
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: PERFORMANCE MONITORING QUERIES
-- =====================================================

-- Create table for query performance monitoring
CREATE TABLE IF NOT EXISTS analytics.query_performance_log (
    id SERIAL PRIMARY KEY,
    query_name VARCHAR(100) NOT NULL,
    execution_time_ms DECIMAL(10,3) NOT NULL,
    rows_returned INTEGER,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    parameters JSONB
);

-- Create index for performance monitoring
CREATE INDEX IF NOT EXISTS idx_query_performance_log_query_time 
ON analytics.query_performance_log(query_name, executed_at DESC);

-- Function to log query performance
CREATE OR REPLACE FUNCTION analytics.log_query_performance(
    query_name VARCHAR(100),
    start_time TIMESTAMPTZ,
    rows_count INTEGER DEFAULT NULL,
    query_params JSONB DEFAULT NULL
)
RETURNS void AS $
BEGIN
    INSERT INTO analytics.query_performance_log (
        query_name, 
        execution_time_ms, 
        rows_returned, 
        parameters
    )
    VALUES (
        query_name,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000,
        rows_count,
        query_params
    );
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- PART 5: AUTOMATED MAINTENANCE
-- =====================================================

-- Function to analyze and suggest index optimizations
CREATE OR REPLACE FUNCTION analytics.analyze_index_usage()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT,
    usage_ratio DECIMAL(5,2),
    recommendation TEXT
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::TEXT,
        s.tablename::TEXT,
        s.indexname::TEXT,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch,
        CASE 
            WHEN s.idx_scan > 0 
            THEN (s.idx_tup_fetch::DECIMAL / s.idx_scan * 100)
            ELSE 0 
        END as usage_ratio,
        CASE 
            WHEN s.idx_scan = 0 THEN 'Consider dropping - unused index'
            WHEN s.idx_scan > 0 AND (s.idx_tup_fetch::DECIMAL / s.idx_scan) < 1 
                THEN 'Low efficiency - review index definition'
            WHEN s.idx_scan > 1000 AND (s.idx_tup_fetch::DECIMAL / s.idx_scan) > 10 
                THEN 'High usage - consider maintenance'
            ELSE 'Normal usage'
        END::TEXT as recommendation
    FROM pg_stat_user_indexes s
    WHERE s.schemaname IN ('public', 'analytics')
    ORDER BY s.idx_scan DESC, usage_ratio DESC;
END;
$ LANGUAGE plpgsql;

-- Function to get slow query recommendations
CREATE OR REPLACE FUNCTION analytics.get_slow_query_recommendations()
RETURNS TABLE (
    avg_execution_time_ms DECIMAL(10,3),
    query_name TEXT,
    execution_count BIGINT,
    recommendation TEXT
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        AVG(qpl.execution_time_ms) as avg_time,
        qpl.query_name::TEXT,
        COUNT(*)::BIGINT as exec_count,
        CASE 
            WHEN AVG(qpl.execution_time_ms) > 5000 THEN 'Critical - optimize immediately'
            WHEN AVG(qpl.execution_time_ms) > 2000 THEN 'High priority - needs optimization'
            WHEN AVG(qpl.execution_time_ms) > 1000 THEN 'Medium priority - consider optimization'
            ELSE 'Acceptable performance'
        END::TEXT as recommendation
    FROM analytics.query_performance_log qpl
    WHERE qpl.executed_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    GROUP BY qpl.query_name
    HAVING COUNT(*) >= 10  -- Only queries executed at least 10 times
    ORDER BY AVG(qpl.execution_time_ms) DESC;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- PART 6: GRANTS AND PERMISSIONS
-- =====================================================

-- Grant permissions to application user
GRANT USAGE ON SCHEMA analytics TO goldshop_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO goldshop_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA analytics TO goldshop_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA analytics TO goldshop_user;

-- Grant permissions for materialized view refresh
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA analytics TO goldshop_user;

-- =====================================================
-- PART 7: INITIAL DATA POPULATION
-- =====================================================

-- Populate materialized views with initial data
SELECT analytics.refresh_all_materialized_views();

-- Create initial performance baseline
INSERT INTO analytics.query_performance_log (query_name, execution_time_ms, rows_returned)
VALUES ('initial_baseline', 0, 0);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $
BEGIN
    RAISE NOTICE 'Analytics database optimization completed successfully!';
    RAISE NOTICE 'Created optimized indexes for: invoices, invoice_items, inventory_items, customers, payments, categories';
    RAISE NOTICE 'Created materialized views: daily_sales_summary, monthly_sales_summary, inventory_turnover_summary, customer_analytics_summary, category_performance_summary';
    RAISE NOTICE 'Created optimization functions: refresh_all_materialized_views, calculate_financial_kpis, get_inventory_insights';
    RAISE NOTICE 'Created performance monitoring: query_performance_log, analyze_index_usage, get_slow_query_recommendations';
    RAISE NOTICE 'All permissions granted to goldshop_user';
END $;