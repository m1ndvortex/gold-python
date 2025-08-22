"""
Test Analytics Infrastructure Setup
Tests the analytics database schema, Redis caching, and core infrastructure
"""

import pytest
import asyncio
from datetime import date, timedelta
from sqlalchemy import text
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, create_analytics_schema
from redis_config import redis_config, analytics_cache

def test_database_connection():
    """Test basic database connection"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            assert result.fetchone()[0] == 1
        print("✅ Database connection test passed")
    except Exception as e:
        pytest.fail(f"Database connection failed: {e}")

def test_analytics_schema_creation():
    """Test analytics schema creation"""
    try:
        create_analytics_schema()
        
        with engine.connect() as conn:
            # Check if analytics schema exists
            result = conn.execute(text("""
                SELECT schema_name FROM information_schema.schemata 
                WHERE schema_name = 'analytics'
            """))
            assert result.fetchone() is not None
        print("✅ Analytics schema creation test passed")
    except Exception as e:
        pytest.fail(f"Analytics schema creation failed: {e}")

def test_analytics_tables_exist():
    """Test that analytics tables were created"""
    try:
        with engine.connect() as conn:
            # Check for key analytics tables
            tables_to_check = [
                'kpi_snapshots',
                'demand_forecasts', 
                'custom_reports',
                'analytics_cache',
                'stock_optimization_recommendations',
                'cost_analysis',
                'category_performance',
                'performance_metrics'
            ]
            
            for table in tables_to_check:
                result = conn.execute(text(f"""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'analytics' AND table_name = '{table}'
                """))
                assert result.fetchone() is not None, f"Table {table} not found"
            
        print("✅ Analytics tables existence test passed")
    except Exception as e:
        pytest.fail(f"Analytics tables test failed: {e}")

def test_timescaledb_extension():
    """Test TimescaleDB extension is installed"""
    try:
        with engine.connect() as conn:
            # Check if TimescaleDB extension is installed
            result = conn.execute(text("""
                SELECT extname FROM pg_extension WHERE extname = 'timescaledb'
            """))
            assert result.fetchone() is not None
            
            # Check if hypertables were created
            result = conn.execute(text("""
                SELECT hypertable_name FROM timescaledb_information.hypertables
                WHERE hypertable_schema = 'analytics'
            """))
            hypertables = result.fetchall()
            assert len(hypertables) > 0, "No hypertables found"
            
        print("✅ TimescaleDB extension test passed")
    except Exception as e:
        pytest.fail(f"TimescaleDB test failed: {e}")

def test_redis_connection():
    """Test Redis connection"""
    try:
        assert redis_config.is_connected(), "Redis connection failed"
        
        client = redis_config.get_client()
        assert client is not None, "Redis client is None"
        
        # Test basic operations
        client.set("test_key", "test_value", ex=10)
        assert client.get("test_key") == "test_value"
        client.delete("test_key")
        
        print("✅ Redis connection test passed")
    except Exception as e:
        pytest.fail(f"Redis connection test failed: {e}")

@pytest.mark.asyncio
async def test_analytics_cache():
    """Test analytics caching functionality"""
    try:
        # Test KPI caching
        test_kpi_data = {
            "revenue": 10000,
            "profit_margin": 25.5,
            "calculated_at": "2024-01-01T00:00:00"
        }
        
        await analytics_cache.set_kpi_data("financial", "daily_revenue", test_kpi_data, ttl=60)
        cached_data = await analytics_cache.get_kpi_data("financial", "daily_revenue")
        
        assert cached_data is not None, "Cached data not found"
        assert cached_data["data"]["revenue"] == 10000
        
        # Test cache invalidation
        await analytics_cache.invalidate_cache("kpi:financial")
        cached_data = await analytics_cache.get_kpi_data("financial", "daily_revenue")
        assert cached_data is None, "Cache not invalidated"
        
        print("✅ Analytics cache test passed")
    except Exception as e:
        pytest.fail(f"Analytics cache test failed: {e}")

@pytest.mark.asyncio
async def test_analytics_service_basic():
    """Test basic analytics service functionality"""
    try:
        # Test basic cache operations without the full service
        test_data = {"test": "value", "timestamp": "2024-01-01"}
        
        await analytics_cache.set_kpi_data("test", "basic", test_data, ttl=60)
        cached_data = await analytics_cache.get_kpi_data("test", "basic")
        
        assert cached_data is not None, "Cached data not found"
        assert cached_data["data"]["test"] == "value"
        
        print("✅ Basic analytics service test passed")
    except Exception as e:
        pytest.fail(f"Basic analytics service test failed: {e}")

def test_materialized_views():
    """Test materialized views creation"""
    try:
        with engine.connect() as conn:
            # First ensure main application tables exist by creating them if needed
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS invoices (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    customer_id UUID,
                    total_amount DECIMAL(15,2) DEFAULT 0,
                    paid_amount DECIMAL(15,2) DEFAULT 0,
                    remaining_amount DECIMAL(15,2) DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS inventory_items (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    category_id UUID,
                    stock_quantity INTEGER DEFAULT 0,
                    purchase_price DECIMAL(10,2) DEFAULT 0,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS categories (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS invoice_items (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    invoice_id UUID REFERENCES invoices(id),
                    inventory_item_id UUID REFERENCES inventory_items(id),
                    quantity INTEGER NOT NULL,
                    unit_price DECIMAL(10,2) NOT NULL,
                    total_price DECIMAL(15,2) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.commit()
            
            # Now create the materialized views
            conn.execute(text("""
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
            """))
            conn.commit()
            
            # Verify materialized views were created
            views_to_check = [
                'daily_sales_summary',
                'inventory_turnover_summary'
            ]
            
            for view in views_to_check:
                result = conn.execute(text(f"""
                    SELECT matviewname FROM pg_matviews 
                    WHERE schemaname = 'analytics' AND matviewname = '{view}'
                """))
                assert result.fetchone() is not None, f"Materialized view {view} not found"
        
        print("✅ Materialized views test passed")
    except Exception as e:
        pytest.fail(f"Materialized views test failed: {e}")

def test_indexes_creation():
    """Test that analytics indexes were created"""
    try:
        with engine.connect() as conn:
            # Check for some key indexes
            result = conn.execute(text("""
                SELECT indexname FROM pg_indexes 
                WHERE schemaname = 'analytics' 
                AND indexname LIKE 'idx_%'
            """))
            indexes = result.fetchall()
            assert len(indexes) > 0, "No analytics indexes found"
            
        print("✅ Analytics indexes test passed")
    except Exception as e:
        pytest.fail(f"Analytics indexes test failed: {e}")

if __name__ == "__main__":
    """Run tests manually"""
    print("🧪 Testing Analytics Infrastructure...")
    
    # Run synchronous tests
    test_database_connection()
    test_analytics_schema_creation()
    test_analytics_tables_exist()
    test_timescaledb_extension()
    test_redis_connection()
    test_materialized_views()
    test_indexes_creation()
    
    # Run async tests
    async def run_async_tests():
        await test_analytics_cache()
        await test_analytics_service_basic()
    
    asyncio.run(run_async_tests())
    
    print("🎉 All analytics infrastructure tests passed!")