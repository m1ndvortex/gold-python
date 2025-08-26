"""
Create API Gateway Tables
Script to create the API gateway database tables
"""

from sqlalchemy import create_engine
from database_base import Base
from database import DATABASE_URL
import models_api_gateway
import models_universal

def create_api_gateway_tables():
    """Create API gateway tables"""
    engine = create_engine(DATABASE_URL)
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ API Gateway tables created successfully")
        
        # List created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        api_gateway_tables = [
            'api_keys', 'api_usage_logs', 'webhook_endpoints', 'webhook_deliveries',
            'bulk_operations', 'workflow_automations', 'workflow_executions',
            'external_integrations', 'integration_sync_logs'
        ]
        
        print("\n📋 API Gateway Tables Status:")
        for table in api_gateway_tables:
            if table in tables:
                print(f"  ✅ {table}")
            else:
                print(f"  ❌ {table} (missing)")
        
        print(f"\n📊 Total tables in database: {len(tables)}")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    create_api_gateway_tables()