"""
Simple Accounting System Test
Basic functionality test for double-entry accounting
"""

import pytest
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session

from database import get_db, engine
from models_accounting import Base as AccountingBase
from models_universal import Base as UniversalBase
from services.accounting_service import AccountingService
from schemas_accounting import (
    ChartOfAccountsCreate, JournalEntryCreate, JournalEntryLineCreate,
    AccountType
)

@pytest.fixture(scope="function")
def db_session():
    """Create a database session for each test using existing database"""
    # Get database session
    db = next(get_db())
    
    try:
        yield db
    finally:
        # Clean up test data
        from sqlalchemy import text
        try:
            # Delete test data in reverse order to handle foreign keys
            db.execute(text("DELETE FROM journal_entry_lines WHERE journal_entry_id IN (SELECT id FROM journal_entries WHERE reference LIKE 'TEST-%')"))
            db.execute(text("DELETE FROM journal_entries WHERE reference LIKE 'TEST-%'"))
            db.execute(text("DELETE FROM chart_of_accounts WHERE account_code LIKE '1001' OR account_code LIKE '4001'"))
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

@pytest.fixture
def accounting_service(db_session):
    """Create accounting service instance"""
    return AccountingService(db_session)

def test_create_chart_account(accounting_service):
    """Test creating a chart of accounts entry"""
    account_data = ChartOfAccountsCreate(
        account_code="1001",
        account_name="Cash",
        account_type=AccountType.ASSET,
        description="Main cash account"
    )
    
    account = accounting_service.create_chart_account(account_data, "test_user")
    
    assert account.id is not None
    assert account.account_code == "1001"
    assert account.account_name == "Cash"
    assert account.account_type == AccountType.ASSET
    assert account.is_active is True

def test_create_journal_entry(accounting_service):
    """Test creating a balanced journal entry"""
    # Create accounts first
    cash_account = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="1001",
            account_name="Cash",
            account_type=AccountType.ASSET
        ),
        "test_user"
    )
    
    revenue_account = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="4001",
            account_name="Sales Revenue",
            account_type=AccountType.REVENUE
        ),
        "test_user"
    )
    
    # Create journal entry
    entry_data = JournalEntryCreate(
        entry_date=datetime.utcnow(),
        description="Test journal entry",
        reference="TEST-001",
        lines=[
            JournalEntryLineCreate(
                account_id=str(cash_account.id),
                debit_amount=Decimal('1000.00'),
                credit_amount=Decimal('0.00'),
                description="Cash received"
            ),
            JournalEntryLineCreate(
                account_id=str(revenue_account.id),
                debit_amount=Decimal('0.00'),
                credit_amount=Decimal('1000.00'),
                description="Revenue earned"
            )
        ]
    )
    
    entry = accounting_service.create_journal_entry(entry_data, "test_user")
    
    assert entry.id is not None
    assert entry.total_debit == Decimal('1000.00')
    assert entry.total_credit == Decimal('1000.00')
    assert entry.is_balanced is True
    assert len(entry.lines) == 2

def test_trial_balance_generation(accounting_service):
    """Test generating trial balance report"""
    # Create accounts
    cash_account = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="1001",
            account_name="Cash",
            account_type=AccountType.ASSET
        ),
        "test_user"
    )
    
    revenue_account = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="4001",
            account_name="Sales Revenue",
            account_type=AccountType.REVENUE
        ),
        "test_user"
    )
    
    # Create and post journal entry
    entry_data = JournalEntryCreate(
        entry_date=datetime.utcnow(),
        description="Test transaction",
        lines=[
            JournalEntryLineCreate(
                account_id=str(cash_account.id),
                debit_amount=Decimal('500.00'),
                credit_amount=Decimal('0.00')
            ),
            JournalEntryLineCreate(
                account_id=str(revenue_account.id),
                debit_amount=Decimal('0.00'),
                credit_amount=Decimal('500.00')
            )
        ]
    )
    
    entry = accounting_service.create_journal_entry(entry_data, "test_user")
    accounting_service.post_journal_entry(str(entry.id), "test_user")
    
    # Generate trial balance
    trial_balance = accounting_service.generate_trial_balance(datetime.utcnow())
    
    assert trial_balance.total_debits >= Decimal('500.00')
    assert trial_balance.total_credits >= Decimal('500.00')
    assert trial_balance.is_balanced is True

if __name__ == "__main__":
    pytest.main([__file__, "-v"])