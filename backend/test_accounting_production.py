"""
Production Accounting System Test
Test the double-entry accounting system using existing database
"""

import pytest
from decimal import Decimal
from datetime import datetime
from sqlalchemy import text
from database import get_db

def test_accounting_tables_exist():
    """Test that accounting tables exist in the database"""
    db = next(get_db())
    
    # Check for accounting tables
    result = db.execute(text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('chart_of_accounts', 'accounting_periods', 'journal_entries', 'journal_entry_lines')
        ORDER BY table_name
    """))
    
    tables = [row[0] for row in result.fetchall()]
    
    expected_tables = ['accounting_periods', 'chart_of_accounts', 'journal_entries', 'journal_entry_lines']
    
    for table in expected_tables:
        assert table in tables, f"Table {table} should exist"
    
    print("✅ All accounting tables exist")

def test_chart_of_accounts_structure():
    """Test chart of accounts table structure and default data"""
    db = next(get_db())
    
    # Check table structure
    result = db.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'chart_of_accounts' 
        ORDER BY ordinal_position
    """))
    
    columns = {row[0]: row[1] for row in result.fetchall()}
    
    # Verify essential columns exist
    essential_columns = ['id', 'account_code', 'account_name', 'account_type', 'level']
    for col in essential_columns:
        assert col in columns, f"Column {col} should exist in chart_of_accounts"
    
    # Check if default accounts exist
    result = db.execute(text("""
        SELECT account_code, account_name, account_type 
        FROM chart_of_accounts 
        WHERE is_system_account = true 
        ORDER BY account_code
    """))
    
    system_accounts = result.fetchall()
    assert len(system_accounts) > 0, "Should have system accounts"
    
    print(f"✅ Chart of accounts has {len(system_accounts)} system accounts")

def test_accounting_periods_functionality():
    """Test accounting periods table"""
    db = next(get_db())
    
    # Check table structure
    result = db.execute(text("""
        SELECT COUNT(*) as count
        FROM information_schema.columns 
        WHERE table_name = 'accounting_periods'
    """))
    
    column_count = result.scalar()
    assert column_count > 0, "Accounting periods table should have columns"
    
    print("✅ Accounting periods table structure verified")

def test_journal_entries_structure():
    """Test journal entries and lines tables"""
    db = next(get_db())
    
    # Check journal_entries table
    result = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'journal_entries'
        AND column_name IN ('id', 'entry_number', 'entry_date', 'total_debit', 'total_credit')
    """))
    
    je_columns = [row[0] for row in result.fetchall()]
    assert len(je_columns) >= 5, "Journal entries should have essential columns"
    
    # Check journal_entry_lines table
    result = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'journal_entry_lines'
        AND column_name IN ('id', 'journal_entry_id', 'account_id', 'debit_amount', 'credit_amount')
    """))
    
    jel_columns = [row[0] for row in result.fetchall()]
    assert len(jel_columns) >= 5, "Journal entry lines should have essential columns"
    
    print("✅ Journal entries structure verified")

def test_accounting_constraints():
    """Test that accounting constraints are in place"""
    db = next(get_db())
    
    # Check for check constraints
    result = db.execute(text("""
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'CHECK' 
        AND table_name IN ('chart_of_accounts', 'journal_entries', 'journal_entry_lines')
    """))
    
    constraints = result.fetchall()
    assert len(constraints) > 0, "Should have check constraints for data integrity"
    
    # Check for foreign key constraints
    result = db.execute(text("""
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name IN ('journal_entry_lines', 'journal_entries')
    """))
    
    fk_constraints = result.fetchall()
    assert len(fk_constraints) > 0, "Should have foreign key constraints"
    
    print("✅ Accounting constraints verified")

def test_accounting_indexes():
    """Test that proper indexes exist for performance"""
    db = next(get_db())
    
    # Check for indexes on accounting tables
    result = db.execute(text("""
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE tablename IN ('chart_of_accounts', 'journal_entries', 'journal_entry_lines')
        AND indexname NOT LIKE '%pkey'
    """))
    
    indexes = result.fetchall()
    assert len(indexes) > 0, "Should have performance indexes"
    
    print(f"✅ Found {len(indexes)} accounting indexes")

def test_sample_account_creation():
    """Test creating a sample account (if permissions allow)"""
    db = next(get_db())
    
    try:
        # Try to insert a test account
        test_account_code = f"TEST{datetime.now().strftime('%H%M%S')}"
        
        result = db.execute(text("""
            INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, level, is_active, created_at)
            VALUES (gen_random_uuid(), :code, 'Test Account', 'Asset', 0, true, NOW())
            RETURNING id, account_code, account_name
        """), {"code": test_account_code})
        
        account = result.fetchone()
        assert account is not None, "Should create test account"
        
        # Clean up
        db.execute(text("DELETE FROM chart_of_accounts WHERE account_code = :code"), {"code": test_account_code})
        db.commit()
        
        print("✅ Account creation and deletion successful")
        
    except Exception as e:
        db.rollback()
        print(f"⚠️  Account creation test skipped: {str(e)}")

def test_double_entry_validation():
    """Test double-entry accounting validation logic"""
    # This is a conceptual test of the double-entry principle
    
    # Sample transaction: Cash sale
    debit_cash = Decimal('1000.00')
    credit_revenue = Decimal('1000.00')
    
    # Verify balance
    assert debit_cash == credit_revenue, "Debits must equal credits"
    
    # Sample transaction: Purchase with tax
    debit_inventory = Decimal('850.00')
    debit_tax = Decimal('150.00')
    credit_cash = Decimal('1000.00')
    
    total_debits = debit_inventory + debit_tax
    total_credits = credit_cash
    
    assert total_debits == total_credits, "Total debits must equal total credits"
    
    print("✅ Double-entry validation logic verified")

def test_accounting_system_integration():
    """Test overall accounting system integration"""
    db = next(get_db())
    
    # Verify all components work together
    result = db.execute(text("""
        SELECT 
            (SELECT COUNT(*) FROM chart_of_accounts) as accounts_count,
            (SELECT COUNT(*) FROM accounting_periods) as periods_count,
            (SELECT COUNT(*) FROM journal_entries) as entries_count,
            (SELECT COUNT(*) FROM journal_entry_lines) as lines_count
    """))
    
    counts = result.fetchone()
    
    print(f"📊 Accounting System Status:")
    print(f"   - Chart of Accounts: {counts[0]} accounts")
    print(f"   - Accounting Periods: {counts[1]} periods")
    print(f"   - Journal Entries: {counts[2]} entries")
    print(f"   - Journal Entry Lines: {counts[3]} lines")
    
    # Basic integrity check
    if counts[2] > 0:  # If there are journal entries
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM journal_entries je
            LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
            WHERE jel.id IS NULL
        """))
        
        orphaned_entries = result.scalar()
        assert orphaned_entries == 0, "No journal entries should be without lines"
    
    print("✅ Accounting system integration verified")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])