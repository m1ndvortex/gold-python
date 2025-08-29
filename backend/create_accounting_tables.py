"""
Create accounting tables in the database
"""

import os
from sqlalchemy import create_engine
from models_accounting import Base

def create_accounting_tables():
    """Create all accounting tables"""
    database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
    engine = create_engine(database_url)
    
    try:
        # Create all accounting tables
        Base.metadata.create_all(bind=engine)
        print("✅ Accounting tables created successfully")
        
        # List created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        accounting_tables = [t for t in tables if any(keyword in t for keyword in [
            'chart_of_accounts', 'subsidiary_accounts', 'journal_entries', 'journal_entry_lines',
            'check_management', 'installment_accounts', 'installment_payments',
            'bank_reconciliation', 'accounting_periods', 'accounting_audit_trail'
        ])]
        
        print(f"📋 Created accounting tables: {accounting_tables}")
        
    except Exception as e:
        print(f"❌ Error creating accounting tables: {e}")
        raise

if __name__ == "__main__":
    create_accounting_tables()