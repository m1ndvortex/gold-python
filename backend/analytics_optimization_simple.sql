-- Simplified Analytics Database Optimization
-- Task 12.2: Create optimized indexes and materialized views

-- Enable TimescaleDB extension if not already enabled
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create analytics schema if not exists
CREATE SCHEMA IF NOT EXISTS analytics;

-- =====================================================
-- PART 1: OPTIMIZED INDEXES FOR ANALYTICS QUERIES
-- =====================================================

-- Invoice analytics indexes (time-series optimized)
CREATE INDEX IF NOT EXISTS idx_invoices_created_status_amount 
ON invoices(created_at DESC, status, total_amount) 
WHERE status IN ('completed', 'paid', 'partially_paid');

CREATE INDEX IF NOT EXISTS idx_invoices_date_only 
ON invoices(DATE(created_at)) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_invoices_month_year 
ON invoices(EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)) 
WHERE status = 'completed';

-- Invoice items analytics indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_item_invoice 
ON invoice_items(inventory_item_id, invoice_id);

-- Inventory analytics indexes
CREATE INDEX IF NOT EXISTS idx_inventory_category_stock_active 
ON inventory_items(category_id, stock_quantity, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_inventory_stock_value 
ON inventory_items(stock_quantity, purchase_price, sell_price) 
WHERE is_active = true;

-- Customer analytics indexes
CREATE INDEX IF NOT EXISTS idx_customers_purchases_debt 
ON customers(total_purchases DESC, current_debt) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_customers_last_purchase 
ON customers(last_purchase_date DESC) 
WHERE is_active = true;

-- Payment analytics indexes
CREATE INDEX IF NOT EXISTS idx_payments_date_amount 
ON payments(payment_date DESC, amount);

-- =====================================================
-- PART 2: MATERIALIZED VIEWS FOR COMMON ANALYTICS
-- =====================================================

-- Daily Sales Summary
DROP MATERIALIZED VIEW IF EXISTS analytics.daily_sales_summary CASCADE;
CREATE MATERIALIZED VIEW analytics.daily_sales_summary AS
SELECT 
    DATE(i.created_at) as sale_date,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT i.customer_id) as unique_customers,
    SUM(i.total_amount) as total_revenue,
    AVG(i.total_amount) as avg_transaction_value,
    SUM(i.paid_amount) as total_paid,
    SUM(i.remaining_amount) as total_outstanding,
    SUM(CASE WHEN i.status = 'completed' THEN i.total_amount ELSE 0 END) as completed_revenue,
    COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_transactions
FROM invoices i
WHERE i.status IN ('completed', 'paid', 'partially_paid')
GROUP BY DATE(i.created_at)
ORDER BY sale_date DESC;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_daily_sales_summary_date 
ON analytics.daily_sales_summary(sale_date);

-- Monthly Sales Summary
DROP MATERIALIZED VIEW IF EXISTS analytics.monthly_sales_summary CASCADE;
CREATE MATERIALIZED VIEW analytics.monthly_sales_summary AS
SELECT 
    EXTRACT(YEAR FROM i.created_at) as year,
    EXTRACT(MONTH FROM i.created_at) as month,
    DATE_TRUNC('month', i.created_at) as month_start,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT i.customer_id) as unique_customers,
    SUM(i.total_amount) as total_revenue,
    AVG(i.total_amount) as avg_transaction_value,
    SUM(i.paid_amount) as total_paid,
    SUM(i.remaining_amount) as total_outstanding
FROM invoices i
WHERE i.status IN ('completed', 'paid', 'partially_paid')
GROUP BY EXTRACT(YEAR FROM i.created_at), EXTRACT(MONTH FROM i.created_at), DATE_TRUNC('month', i.created_at)
ORDER BY year DESC, month DESC;

-- Create unique index on monthly summary
CREATE UNIQUE INDEX idx_monthly_sales_summary_year_month 
ON analytics.monthly_sales_summary(year, month);

-- Inventory Turnover Summary
DROP MATERIALIZED VIEW IF EXISTS analytics.inventory_turnover_summary CASCADE;
CREATE MATERIALIZED VIEW analytics.inventory_turnover_summary AS
SELECT 
    inv.id as item_id,
    inv.name as item_name,
    cat.name as category_name,
    cat.id as category_id,
    inv.stock_quantity as current_stock,
    inv.purchase_price,
    inv.sell_price,
    COALESCE(sales_30d.units_sold, 0) as units_sold_30d,
    COALESCE(sales_30d.revenue, 0) as revenue_30d,
    CASE 
        WHEN inv.stock_quantity > 0 AND COALESCE(sales_30d.units_sold, 0) > 0
        THEN COALESCE(sales_30d.units_sold, 0)::DECIMAL / inv.stock_quantity
        ELSE 0 
    END as turnover_ratio_30d,
    CASE 
        WHEN COALESCE(sales_30d.units_sold, 0) = 0 THEN 'dead'
        WHEN COALESCE(sales_30d.units_sold, 0)::DECIMAL / NULLIF(inv.stock_quantity, 0) > 2 THEN 'fast'
        WHEN COALESCE(sales_30d.units_sold, 0)::DECIMAL / NULLIF(inv.stock_quantity, 0) > 0.5 THEN 'normal'
        ELSE 'slow'
    END as movement_classification,
    CASE 
        WHEN COALESCE(sales_30d.units_sold, 0) > 0 
        THEN (inv.stock_quantity * 30.0 / COALESCE(sales_30d.units_sold, 1))::INTEGER
        ELSE NULL
    END as days_to_stockout,
    sales_30d.last_sale_date,
    inv.stock_quantity * inv.purchase_price as inventory_value,
    CASE 
        WHEN COALESCE(sales_30d.units_sold, 0) = 0 THEN 0
        ELSE LEAST(1.0, (COALESCE(sales_30d.units_sold, 0)::DECIMAL / NULLIF(inv.stock_quantity, 1)) / 2.0)
    END as velocity_score
FROM inventory_items inv
LEFT JOIN categories cat ON inv.category_id = cat.id
LEFT JOIN (
    SELECT 
        ii.inventory_item_id,
        SUM(ii.quantity) as units_sold,
        SUM(ii.total_price) as revenue,
        MAX(i.created_at) as last_sale_date
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND i.status = 'completed'
    GROUP BY ii.inventory_item_id
) sales_30d ON inv.id = sales_30d.inventory_item_id
WHERE inv.is_active = true
ORDER BY velocity_score DESC;

-- Create unique index on inventory turnover summary
CREATE UNIQUE INDEX idx_inventory_turnover_summary_item 
ON analytics.inventory_turnover_summary(item_id);

-- Customer Analytics Summary
DROP MATERIALIZED VIEW IF EXISTS analytics.customer_analytics_summary CASCADE;
CREATE MATERIALIZED VIEW analytics.customer_analytics_summary AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.customer_type,
    c.total_purchases,
    c.current_debt,
    c.last_purchase_date,
    COALESCE(recent_activity.transaction_count_30d, 0) as transaction_count_30d,
    COALESCE(recent_activity.total_spent_30d, 0) as total_spent_30d,
    COALESCE(lifetime_activity.total_transactions, 0) as total_transactions,
    COALESCE(lifetime_activity.avg_transaction_value, 0) as avg_transaction_value,
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
    CASE 
        WHEN lifetime_activity.total_transactions > 0 AND c.last_purchase_date IS NOT NULL
        THEN c.total_purchases * 1.2  -- Simple CLV estimation
        ELSE c.total_purchases
    END as estimated_clv
FROM customers c
LEFT JOIN (
    SELECT 
        customer_id,
        COUNT(*) as transaction_count_30d,
        SUM(total_amount) as total_spent_30d
    FROM invoices
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND status = 'completed'
    GROUP BY customer_id
) recent_activity ON c.id = recent_activity.customer_id
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
CREATE UNIQUE INDEX idx_customer_analytics_summary_customer 
ON analytics.customer_analytics_summary(customer_id);

-- Category Performance Summary
DROP MATERIALIZED VIEW IF EXISTS analytics.category_performance_summary CASCADE;
CREATE MATERIALIZED VIEW analytics.category_performance_summary AS
SELECT 
    cat.id as category_id,
    cat.name as category_name,
    cat.parent_id,
    COUNT(inv.id) as total_items,
    COUNT(CASE WHEN inv.stock_quantity > 0 THEN 1 END) as items_in_stock,
    COUNT(CASE WHEN inv.stock_quantity = 0 THEN 1 END) as items_out_of_stock,
    COALESCE(SUM(inv.stock_quantity * inv.purchase_price), 0) as total_inventory_value,
    COALESCE(AVG(inv.purchase_price), 0) as avg_purchase_price,
    COALESCE(AVG(inv.sell_price), 0) as avg_sell_price,
    COALESCE(sales_data.revenue_30d, 0) as revenue_30d,
    COALESCE(sales_data.units_sold_30d, 0) as units_sold_30d,
    CASE 
        WHEN COALESCE(sales_data.revenue_30d, 0) = 0 THEN 'inactive'
        WHEN COALESCE(sales_data.revenue_30d, 0) > 10000 THEN 'high_performer'
        WHEN COALESCE(sales_data.revenue_30d, 0) > 5000 THEN 'good_performer'
        WHEN COALESCE(sales_data.revenue_30d, 0) > 1000 THEN 'average_performer'
        ELSE 'low_performer'
    END as performance_category
FROM categories cat
LEFT JOIN inventory_items inv ON cat.id = inv.category_id AND inv.is_active = true
LEFT JOIN (
    SELECT 
        inv_sub.category_id,
        SUM(ii.total_price) as revenue_30d,
        SUM(ii.quantity) as units_sold_30d
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    JOIN inventory_items inv_sub ON ii.inventory_item_id = inv_sub.id
    WHERE i.status = 'completed'
        AND i.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY inv_sub.category_id
) sales_data ON cat.id = sales_data.category_id
WHERE cat.is_active = true
GROUP BY cat.id, cat.name, cat.parent_id, sales_data.revenue_30d, sales_data.units_sold_30d
ORDER BY revenue_30d DESC;

-- Create unique index on category performance
CREATE UNIQUE INDEX idx_category_performance_summary_category 
ON analytics.category_performance_summary(category_id);

-- =====================================================
-- PART 3: UTILITY FUNCTIONS
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

-- Create materialized view refresh log
CREATE TABLE IF NOT EXISTS analytics.materialized_view_refresh_log (
    id SERIAL PRIMARY KEY,
    refresh_time TIMESTAMPTZ NOT NULL,
    views_refreshed INTEGER NOT NULL,
    duration_seconds DECIMAL(10,3)
);

-- =====================================================
-- PART 4: GRANTS AND PERMISSIONS
-- =====================================================

-- Grant permissions to application user
GRANT USAGE ON SCHEMA analytics TO goldshop_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO goldshop_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA analytics TO goldshop_user;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

INSERT INTO analytics.query_performance_log (query_name, execution_time_ms, rows_returned)
VALUES ('optimization_completed', 0, 0);

-- Show completion status
SELECT 'Analytics database optimization completed successfully!' as status;