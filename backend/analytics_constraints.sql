-- Add foreign key constraints to analytics tables after main tables are created
-- This script should be run after the main application tables exist

-- Add foreign key constraints for demand_forecasts
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items' AND table_schema = 'public') THEN
        ALTER TABLE analytics.demand_forecasts 
        ADD CONSTRAINT fk_demand_forecasts_item_id 
        FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints for stock_optimization_recommendations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items' AND table_schema = 'public') THEN
        ALTER TABLE analytics.stock_optimization_recommendations 
        ADD CONSTRAINT fk_stock_optimization_item_id 
        FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints for category_performance
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
        ALTER TABLE analytics.category_performance 
        ADD CONSTRAINT fk_category_performance_category_id 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints for custom_reports
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        ALTER TABLE analytics.custom_reports 
        ADD CONSTRAINT fk_custom_reports_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
END $$;

-- Add foreign key constraints for alert_rules
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        ALTER TABLE analytics.alert_rules 
        ADD CONSTRAINT fk_alert_rules_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
END $$;

-- Add foreign key constraints for alert_history
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        ALTER TABLE analytics.alert_history 
        ADD CONSTRAINT fk_alert_history_acknowledged_by 
        FOREIGN KEY (acknowledged_by) REFERENCES users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alert_rules' AND table_schema = 'analytics') THEN
        ALTER TABLE analytics.alert_history 
        ADD CONSTRAINT fk_alert_history_rule_id 
        FOREIGN KEY (rule_id) REFERENCES analytics.alert_rules(id) ON DELETE CASCADE;
    END IF;
END $$;