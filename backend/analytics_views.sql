-- Create materialized views for common analytics queries
-- This script should be run after the main application tables exist

-- Daily sales summary materialized view
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
        CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.daily_sales_summary AS
        SELECT 
            DATE(created_at) as sale_date,
            COUNT(*) as transaction_count,
            SUM(total_amount) as total_revenue,
            AVG(total_amount) as avg_transaction_value,
            SUM(paid_amount) as total_paid,
            SUM(remaining_amount) as total_outstanding
        FROM invoices 
        WHERE status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY sale_date DESC;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_sales_summary_date ON analytics.daily_sales_summary(sale_date);
    END IF;
END $$;

-- Inventory turnover summary materialized view
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items' AND table_schema = 'public') THEN
        
        CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.inventory_turnover_summary AS
        SELECT 
            i.id as item_id,
            i.name as item_name,
            c.name as category_name,
            i.stock_quantity as current_stock,
            COALESCE(SUM(ii.quantity), 0) as units_sold_30d,
            CASE 
                WHEN i.stock_quantity > 0 THEN COALESCE(SUM(ii.quantity), 0)::DECIMAL / i.stock_quantity
                ELSE 0 
            END as turnover_ratio,
            CASE 
                WHEN COALESCE(SUM(ii.quantity), 0) = 0 THEN 'dead'
                WHEN COALESCE(SUM(ii.quantity), 0)::DECIMAL / NULLIF(i.stock_quantity, 0) > 2 THEN 'fast'
                WHEN COALESCE(SUM(ii.quantity), 0)::DECIMAL / NULLIF(i.stock_quantity, 0) > 0.5 THEN 'normal'
                ELSE 'slow'
            END as movement_classification,
            MAX(inv.created_at) as last_sale_date
        FROM inventory_items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN invoice_items ii ON i.id = ii.inventory_item_id
        LEFT JOIN invoices inv ON ii.invoice_id = inv.id AND inv.created_at >= CURRENT_DATE - INTERVAL '30 days'
        WHERE i.is_active = true
        GROUP BY i.id, i.name, c.name, i.stock_quantity;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_turnover_summary_item ON analytics.inventory_turnover_summary(item_id);
    END IF;
END $$;

-- Set up automatic refresh function for materialized views
CREATE OR REPLACE FUNCTION analytics.refresh_materialized_views()
RETURNS void AS $$
BEGIN
    -- Only refresh views that exist
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'analytics' AND matviewname = 'daily_sales_summary') THEN
        REFRESH MATERIALIZED VIEW analytics.daily_sales_summary;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'analytics' AND matviewname = 'inventory_turnover_summary') THEN
        REFRESH MATERIALIZED VIEW analytics.inventory_turnover_summary;
    END IF;
END;
$$ LANGUAGE plpgsql;