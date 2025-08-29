"""
Simple tests for Enhanced Double-Entry Accounting System
Focus on core functionality with real PostgreSQL database
"""

import pytest
import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from main import app
from database import get_db
from models import Base, User, Role, Customer
from models_accounting import (
    ChartOfAccounts, SubsidiaryAccount, JournalEntry, JournalEntryLine
)
from services.accounting_service import AccountingService
from schemas_accounting import (
    ChartOfAccountsCreate, JournalEntryCreate
)
from auth import create_access_token

client = TestClient(app)

@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine using real PostgreSQL in Docker"""
    database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
    engine = create_engine(database_url)
    return engine

@pytest.fixture(scope="session")
def test_session_factory(test_engine):
    """Create session factory for tests"""
    return sessionmaker(bind=test_engine)

@pytest.fixture
def db_session(test_session_factory):
    """Create a database session for each test"""
    session = test_session_factory()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

class TestAccountingSystemSimple:
    """Simple tests for the enhanced double-entry accounting system"""
    
    @pytest.fixture(autouse=True)
    def setup_test_data(self, db_session: Session):
        """Set up test data for accounting tests"""
        self.db = db_session
        
        # Create unique test role
        role_name = f"test_accountant_{uuid4().hex[:8]}"
        self.test_role = Role(
            id=uuid4(),
            name=role_name,
            description="Test accountant role",
            permissions={"accounting": ["read", "write", "admin"]}
        )
        self.db.add(self.test_role)
        
        # Create unique test user
        username = f"test_accountant_{uuid4().hex[:8]}"
        email = f"accountant_{uuid4().hex[:8]}@test.com"
        self.test_user = User(
            id=uuid4(),
            username=username,
            email=email,
            password_hash="hashed_password",
            role_id=self.test_role.id,
            is_active=True
        )
        self.db.add(self.test_user)
        
        self.db.commit()
        
        # Create access token for authentication
        self.access_token = create_access_token(
            data={"sub": str(self.test_user.id), "username": self.test_user.username}
        )
        self.headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Initialize accounting service
        self.accounting_service = AccountingService(self.db)

    def test_create_chart_of_accounts_api(self):
        """Test creating chart of accounts via API"""
        account_code = f"TEST{uuid4().hex[:8]}"
        
        asset_account_data = {
            "account_code": account_code,
            "account_name": "Test Cash Account",
            "account_name_persian": "حساب نقد تست",
            "account_type": "asset",
            "account_category": "current_asset",
            "account_description": "Test cash account",
            "account_description_persian": "حساب نقد تست"
        }
        
        response = client.post(
            "/accounting/chart-of-accounts",
            json=asset_account_data,
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["account_code"] == account_code
        assert data["account_name"] == "Test Cash Account"
        assert data["account_type"] == "asset"
        assert data["is_active"] == True

    def test_create_journal_entry_api(self):
        """Test creating journal entry via API"""
        # Create accounts first
        cash_code = f"CASH{uuid4().hex[:6]}"
        sales_code = f"SALE{uuid4().hex[:6]}"
        
        cash_account = ChartOfAccounts(
            id=uuid4(),
            account_code=cash_code,
            account_name="Test Cash",
            account_type="asset",
            account_category="current_asset"
        )
        sales_account = ChartOfAccounts(
            id=uuid4(),
            account_code=sales_code,
            account_name="Test Sales",
            account_type="revenue",
            account_category="operating_revenue"
        )
        
        self.db.add_all([cash_account, sales_account])
        self.db.commit()
        
        # Create journal entry
        entry_data = {
            "entry_date": date.today().isoformat(),
            "description": "Test cash sale",
            "source_type": "manual",
            "journal_lines": [
                {
                    "line_number": 1,
                    "account_id": str(cash_account.id),
                    "debit_amount": 1000.00,
                    "credit_amount": 0.00,
                    "description": "Cash received"
                },
                {
                    "line_number": 2,
                    "account_id": str(sales_account.id),
                    "debit_amount": 0.00,
                    "credit_amount": 1000.00,
                    "description": "Sales revenue"
                }
            ]
        }
        
        response = client.post(
            "/accounting/journal-entries",
            json=entry_data,
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert float(data["total_debit"]) == 1000.00
        assert float(data["total_credit"]) == 1000.00
        assert data["is_balanced"] == True
        assert data["status"] == "draft"

    def test_post_journal_entry_api(self):
        """Test posting journal entry via API"""
        # Create accounts
        cash_code = f"CASH{uuid4().hex[:6]}"
        sales_code = f"SALE{uuid4().hex[:6]}"
        
        cash_account = ChartOfAccounts(
            id=uuid4(),
            account_code=cash_code,
            account_name="Test Cash",
            account_type="asset",
            account_category="current_asset"
        )
        sales_account = ChartOfAccounts(
            id=uuid4(),
            account_code=sales_code,
            account_name="Test Sales",
            account_type="revenue",
            account_category="operating_revenue"
        )
        
        self.db.add_all([cash_account, sales_account])
        self.db.commit()
        
        # Create journal entry using service
        entry_data = JournalEntryCreate(
            entry_date=date.today(),
            description="Test posting entry",
            source_type="manual",
            journal_lines=[
                {
                    "line_number": 1,
                    "account_id": cash_account.id,
                    "debit_amount": Decimal('500.00'),
                    "credit_amount": Decimal('0.00'),
                    "description": "Cash debit"
                },
                {
                    "line_number": 2,
                    "account_id": sales_account.id,
                    "debit_amount": Decimal('0.00'),
                    "credit_amount": Decimal('500.00'),
                    "description": "Sales credit"
                }
            ]
        )
        
        # Create entry
        entry = asyncio.run(
            self.accounting_service.create_journal_entry(entry_data, self.test_user.id)
        )
        assert entry.status == "draft"
        
        # Post entry via API
        response = client.post(
            f"/accounting/journal-entries/{entry.id}/post",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "posted"
        assert data["posted_by"] == str(self.test_user.id)

    def test_trial_balance_report_api(self):
        """Test trial balance report via API"""
        # Create some accounts with balances
        cash_code = f"CASH{uuid4().hex[:6]}"
        sales_code = f"SALE{uuid4().hex[:6]}"
        
        cash_account = ChartOfAccounts(
            id=uuid4(),
            account_code=cash_code,
            account_name="Test Cash",
            account_type="asset",
            account_category="current_asset",
            debit_balance=Decimal('5000.00'),
            current_balance=Decimal('5000.00')
        )
        sales_account = ChartOfAccounts(
            id=uuid4(),
            account_code=sales_code,
            account_name="Test Sales",
            account_type="revenue",
            account_category="operating_revenue",
            credit_balance=Decimal('5000.00'),
            current_balance=Decimal('5000.00')
        )
        
        self.db.add_all([cash_account, sales_account])
        self.db.commit()
        
        # Generate trial balance
        response = client.get(
            "/accounting/reports/trial-balance",
            params={"as_of_date": date.today().isoformat()},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_debits" in data
        assert "total_credits" in data
        assert "accounts" in data
        assert len(data["accounts"]) >= 2

    def test_balance_sheet_report_api(self):
        """Test balance sheet report via API"""
        # Create balance sheet accounts
        cash_code = f"CASH{uuid4().hex[:6]}"
        equity_code = f"EQTY{uuid4().hex[:6]}"
        
        cash_account = ChartOfAccounts(
            id=uuid4(),
            account_code=cash_code,
            account_name="Test Cash",
            account_type="asset",
            account_category="current_asset",
            debit_balance=Decimal('10000.00'),
            current_balance=Decimal('10000.00')
        )
        equity_account = ChartOfAccounts(
            id=uuid4(),
            account_code=equity_code,
            account_name="Test Equity",
            account_type="equity",
            account_category="owner_equity",
            credit_balance=Decimal('10000.00'),
            current_balance=Decimal('10000.00')
        )
        
        self.db.add_all([cash_account, equity_account])
        self.db.commit()
        
        # Generate balance sheet
        response = client.get(
            "/accounting/reports/balance-sheet",
            params={"as_of_date": date.today().isoformat()},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "assets" in data
        assert "liabilities" in data
        assert "equity" in data
        assert "total_assets" in data
        assert "total_liabilities_equity" in data

    def test_gold_invoice_journal_entry_api(self):
        """Test Gold invoice journal entry creation via API"""
        # Create required accounts
        receivable_code = f"RECV{uuid4().hex[:6]}"
        sales_code = f"SALE{uuid4().hex[:6]}"
        sood_code = f"SOOD{uuid4().hex[:6]}"
        
        receivable_account = ChartOfAccounts(
            id=uuid4(),
            account_code=receivable_code,
            account_name="Accounts Receivable",
            account_type="asset",
            account_category="current_asset"
        )
        sales_account = ChartOfAccounts(
            id=uuid4(),
            account_code=sales_code,
            account_name="Sales Revenue",
            account_type="revenue",
            account_category="operating_revenue"
        )
        sood_account = ChartOfAccounts(
            id=uuid4(),
            account_code=sood_code,
            account_name="سود (Profit)",
            account_type="revenue",
            account_category="operating_revenue"
        )
        
        self.db.add_all([receivable_account, sales_account, sood_account])
        self.db.commit()
        
        # Create Gold invoice journal entry
        invoice_data = {
            "invoice_number": f"GOLD-{uuid4().hex[:6]}",
            "total_amount": 15000.00,
            "gold_sood": 2000.00,
            "gold_ojrat": 1500.00,
            "gold_maliyat": 500.00
        }
        
        response = client.post(
            "/accounting/gold-invoice-journal-entry",
            params={"invoice_id": str(uuid4())},
            json=invoice_data,
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Verify journal entry was created
        journal_entry = self.db.query(JournalEntry).filter(
            JournalEntry.reference_number == invoice_data["invoice_number"]
        ).first()
        
        assert journal_entry is not None
        assert journal_entry.gold_sood_amount == Decimal('2000.00')
        assert journal_entry.is_balanced == True
        assert journal_entry.status == "posted"

    def test_account_balance_updates_after_posting(self):
        """Test that account balances are updated correctly after posting journal entries"""
        # Create accounts
        cash_code = f"CASH{uuid4().hex[:6]}"
        sales_code = f"SALE{uuid4().hex[:6]}"
        
        cash_account = ChartOfAccounts(
            id=uuid4(),
            account_code=cash_code,
            account_name="Test Cash",
            account_type="asset",
            account_category="current_asset",
            current_balance=Decimal('0.00'),
            debit_balance=Decimal('0.00'),
            credit_balance=Decimal('0.00')
        )
        sales_account = ChartOfAccounts(
            id=uuid4(),
            account_code=sales_code,
            account_name="Test Sales",
            account_type="revenue",
            account_category="operating_revenue",
            current_balance=Decimal('0.00'),
            debit_balance=Decimal('0.00'),
            credit_balance=Decimal('0.00')
        )
        
        self.db.add_all([cash_account, sales_account])
        self.db.commit()
        
        # Create and post journal entry
        entry_data = JournalEntryCreate(
            entry_date=date.today(),
            description="Balance update test",
            source_type="manual",
            journal_lines=[
                {
                    "line_number": 1,
                    "account_id": cash_account.id,
                    "debit_amount": Decimal('1000.00'),
                    "credit_amount": Decimal('0.00'),
                    "description": "Cash increase"
                },
                {
                    "line_number": 2,
                    "account_id": sales_account.id,
                    "debit_amount": Decimal('0.00'),
                    "credit_amount": Decimal('1000.00'),
                    "description": "Sales revenue"
                }
            ]
        )
        
        entry = asyncio.run(
            self.accounting_service.create_journal_entry(entry_data, self.test_user.id)
        )
        
        # Check account balances were updated
        self.db.refresh(cash_account)
        self.db.refresh(sales_account)
        
        assert cash_account.debit_balance == Decimal('1000.00')
        assert cash_account.current_balance == Decimal('1000.00')  # Asset: debit - credit
        assert sales_account.credit_balance == Decimal('1000.00')
        assert sales_account.current_balance == Decimal('1000.00')  # Revenue: credit - debit

if __name__ == "__main__":
    pytest.main([__file__, "-v"])