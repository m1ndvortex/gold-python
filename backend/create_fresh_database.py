#!/usr/bin/env python3
"""
Create fresh database with all tables
This script drops all existing tables and creates them fresh from models
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, inspect
from database import engine, SessionLocal
from models import Base
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def drop_all_tables():
    """Drop all tables in the database"""
    logger.info("Dropping all existing tables and extensions...")
    
    with engine.connect() as conn:
        # First, drop all tables and sequences
        conn.execute(text("""
            -- Drop all tables in public schema
            DO $$ DECLARE
                r RECORD;
            BEGIN
                -- Drop all tables
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
                
                -- Drop all sequences
                FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequencename) || ' CASCADE';
                END LOOP;
                
                -- Drop all views
                FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
                END LOOP;
            END $$;
        """))
        
        # Recreate schema with proper permissions
        conn.execute(text("""
            DROP SCHEMA IF EXISTS public CASCADE;
            CREATE SCHEMA public;
            GRANT ALL ON SCHEMA public TO goldshop_user;
            GRANT ALL ON SCHEMA public TO public;
        """))
        
        # Enable extensions in separate transactions
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
            conn.commit()
        except Exception as e:
            logger.warning(f"UUID extension may already exist: {e}")
            conn.rollback()
        
        # Don't try to recreate TimescaleDB extension as it's already loaded
        logger.info("Skipping TimescaleDB extension creation (already loaded)")
        conn.commit()
    
    logger.info("All tables and extensions dropped successfully!")

def create_all_tables():
    """Create all tables from models"""
    logger.info("Creating all tables from models...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("All tables created successfully!")
        
        # Create additional indexes and constraints if needed
        create_additional_constraints()
        
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise

def create_additional_constraints():
    """Create additional database constraints and indexes"""
    logger.info("Creating additional constraints and indexes...")
    
    with engine.connect() as conn:
        # Add any custom constraints or indexes that aren't in the models
        constraints_sql = """
        -- Ensure unique constraint on customer segment assignments
        ALTER TABLE customer_segment_assignments 
        ADD CONSTRAINT unique_customer_segment 
        UNIQUE (customer_id, segment_id);
        
        -- Add check constraints for percentages
        ALTER TABLE company_settings 
        ADD CONSTRAINT check_labor_percentage 
        CHECK (default_labor_percentage >= 0 AND default_labor_percentage <= 100);
        
        ALTER TABLE company_settings 
        ADD CONSTRAINT check_profit_percentage 
        CHECK (default_profit_percentage >= 0 AND default_profit_percentage <= 100);
        
        ALTER TABLE company_settings 
        ADD CONSTRAINT check_vat_percentage 
        CHECK (default_vat_percentage >= 0 AND default_vat_percentage <= 100);
        
        -- Add check constraints for scores (0-1 range)
        ALTER TABLE customer_behavior_analysis 
        ADD CONSTRAINT check_risk_score 
        CHECK (risk_score >= 0 AND risk_score <= 1);
        
        ALTER TABLE customer_behavior_analysis 
        ADD CONSTRAINT check_loyalty_score 
        CHECK (loyalty_score >= 0 AND loyalty_score <= 1);
        
        ALTER TABLE customer_behavior_analysis 
        ADD CONSTRAINT check_engagement_score 
        CHECK (engagement_score >= 0 AND engagement_score <= 1);
        
        ALTER TABLE customer_behavior_analysis 
        ADD CONSTRAINT check_churn_probability 
        CHECK (churn_probability >= 0 AND churn_probability <= 1);
        """
        
        try:
            conn.execute(text(constraints_sql))
            conn.commit()
            logger.info("Additional constraints created successfully!")
        except Exception as e:
            logger.warning(f"Some constraints may already exist or failed to create: {e}")
            conn.rollback()

def verify_tables():
    """Verify that all tables were created"""
    logger.info("Verifying table creation...")
    
    with engine.connect() as conn:
        # Get all tables
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """))
        
        tables = [row[0] for row in result]
        
        # Get all indexes
        indexes_result = conn.execute(text("""
            SELECT indexname, tablename
            FROM pg_indexes 
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname;
        """))
        
        indexes = [(row[0], row[1]) for row in indexes_result]
        
        logger.info(f"Created tables ({len(tables)}): {', '.join(tables)}")
        logger.info(f"Created indexes ({len(indexes)}): {len(indexes)} total indexes")
        
        # Verify expected tables exist
        expected_tables = [
            'users', 'roles', 'categories', 'category_templates', 'inventory_items',
            'customers', 'invoices', 'invoice_items', 'accounting_entries', 'payments',
            'company_settings', 'sms_templates', 'sms_campaigns', 'sms_messages',
            'analytics_data', 'kpi_targets', 'profitability_analysis', 'margin_analysis',
            'customer_segments', 'customer_segment_assignments', 'customer_behavior_analysis',
            'scheduled_reports', 'custom_reports', 'inventory_turnover_analysis',
            'stock_optimization_recommendations'
        ]
        
        missing_tables = [table for table in expected_tables if table not in tables]
        if missing_tables:
            logger.warning(f"Missing expected tables: {', '.join(missing_tables)}")
        else:
            logger.info("✅ All expected tables created successfully!")
    
    return tables

def test_database_connection():
    """Test database connection and basic operations"""
    logger.info("Testing database connection...")
    
    try:
        with engine.connect() as conn:
            # Test basic query
            result = conn.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            
            if test_value == 1:
                logger.info("✅ Database connection test passed!")
            else:
                logger.error("❌ Database connection test failed!")
                return False
                
            # Test UUID generation
            result = conn.execute(text("SELECT uuid_generate_v4() as test_uuid"))
            test_uuid = result.scalar()
            
            if test_uuid:
                logger.info("✅ UUID generation test passed!")
            else:
                logger.warning("⚠️  UUID generation test failed - extension may not be available")
                
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection test failed: {e}")
        return False

def main():
    """Main function to reset database"""
    try:
        logger.info("Starting fresh database creation...")
        logger.info("=" * 50)
        
        # Step 1: Test initial connection
        if not test_database_connection():
            logger.error("Initial database connection failed!")
            return False
        
        # Step 2: Drop all existing tables
        drop_all_tables()
        
        # Step 3: Create all tables from models
        create_all_tables()
        
        # Step 4: Verify tables were created
        tables = verify_tables()
        
        # Step 5: Final connection test
        if not test_database_connection():
            logger.error("Final database connection test failed!")
            return False
        
        logger.info("=" * 50)
        logger.info("✅ Database reset completed successfully!")
        logger.info("📋 Summary:")
        logger.info(f"   - Created {len(tables)} tables")
        logger.info("   - Added constraints and indexes")
        logger.info("   - Database is ready for seeding")
        logger.info("\n💡 Next step: Run seed_data.py to populate initial data")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error resetting database: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)