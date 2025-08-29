"""
Comprehensive Tests for Enhanced Double-Entry Accounting System
Tests all accounting functionality using real PostgreSQL database in Docker
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
    ChartOfAccounts, SubsidiaryAccount, JournalEntry, JournalEntryLine,
    CheckManagement, InstallmentAccount, InstallmentPayment,
    BankReconciliation, AccountingPeriod, AccountingAuditTrail
)
from services.accounting_service import AccountingService
from schemas_accounting import (
    ChartOfAccountsCreate, SubsidiaryAccountCreate, JournalEntryCreate,
    CheckManagementCreate, InstallmentAccountCreate, BankReconciliationCreate
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
        # Clean up after each test
        session.rollback()
        session.close()

class TestEnhancedAccountingSystem:
    """Comprehensive tests for the enhanced double-entry accounting system"""
    
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
        
        # Create unique test customer
        customer_name = f"Test Customer {uuid4().hex[:8]}"
        customer_email = f"customer_{uuid4().hex[:8]}@test.com"
        self.test_customer = Customer(
            id=uuid4(),
            name=customer_name,
            phone=f"123456{uuid4().hex[:4]}",
            email=customer_email,
            current_debt=Decimal('0.00')
        )
        self.db.add(self.test_customer)
        
        self.db.commit()
        
        # Create access token for authentication
        self.access_token = create_access_token(
            data={"sub": str(self.test_user.id), "username": self.test_user.username}
        )
        self.headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Initialize accounting service
        self.accounting_service = AccountingService(self.db)

    def test_create_chart_of_accounts(self):
        """Test creating chart of accounts entries"""
        # Test creating asset account
        asset_account_data = ChartOfAccountsCreate(
            account_code="1100",
            account_name="Cash",
            account_name_persian="نقد",
            account_type="asset",
            account_category="current_asset",
            account_description="Cash account",
            account_description_persian="حساب نقد"
        )
        
        response = client.post(
            "/accounting/chart-of-accounts",
            json=asset_account_data.model_dump(),
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["account_code"] == "1100"
        assert data["account_name"] == "Cash"
        assert data["account_name_persian"] == "نقد"
        assert data["account_type"] == "asset"
        assert data["is_active"] == True
        assert "id" in data
        assert "created_at" in data

    def test_create_subsidiary_account(self):
        """Test creating subsidiary accounts (حساب‌های تفصیلی)"""
        # First create main account
        main_account = ChartOfAccounts(
            id=uuid4(),
            account_code="1200",
            account_name="Accounts Receivable",
            account_name_persian="حساب‌های دریافتنی",
            account_type="asset",
            account_category="current_asset",
            requires_subsidiary=True
        )
        self.db.add(main_account)
        self.db.commit()
        
        # Create subsidiary account
        subsidiary_data = SubsidiaryAccountCreate(
            subsidiary_code="1200-001",
            subsidiary_name="Customer A/R",
            subsidiary_name_persian="دریافتنی مشتری",
            main_account_id=main_account.id,
            subsidiary_type="customer",
            reference_id=self.test_customer.id,
            reference_type="customer",
            credit_limit=Decimal('5000.00'),
            payment_terms_days=30
        )
        
        response = client.post(
            "/accounting/subsidiary-accounts",
            json=subsidiary_data.dict(),
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["subsidiary_code"] == "1200-001"
        assert data["subsidiary_name"] == "Customer A/R"
        assert data["subsidiary_type"] == "customer"
        assert data["credit_limit"] == 5000.00
        assert data["is_active"] == True

    def test_create_double_entry_journal_entry(self):
        """Test creating balanced double-entry journal entries"""
        # Create required accounts with unique codes
        cash_code = f"1100{uuid4().hex[:4]}"
        sales_code = f"4000{uuid4().hex[:4]}"
        
        cash_account = ChartOfAccounts(
            id=uuid4(),
            account_code=cash_code,
            account_name="Cash",
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
        self.db.add_all([cash_account, sales_account])
        self.db.commit()
        
        # Create balanced journal entry
        entry_data = JournalEntryCreate(
            entry_date=date.today(),
            description="Cash sale transaction",
            description_persian="معامله فروش نقدی",
            reference_number="SALE-001",
            source_type="manual",
            journal_lines=[
                {
                    "line_number": 1,
                    "account_id": cash_account.id,
                    "debit_amount": Decimal('1000.00'),
                    "credit_amount": Decimal('0.00'),
                    "description": "Cash received from sale"
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
        
        response = client.post(
            "/accounting/journal-entries",
            json=entry_data.dict(),
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_debit"] == 1000.00
        assert data["total_credit"] == 1000.00
        assert data["is_balanced"] == True
        assert data["status"] == "draft"
        assert len(data["journal_lines"]) == 2

    def test_unbalanced_journal_entry_rejection(self):
        """Test that unbalanced journal entries are rejected"""
        # Create accounts
        cash_account = ChartOfAccounts(
            id=uuid4(),
            account_code="1100",
            account_name="Cash",
            account_type="asset",
            account_category="current_asset"
        )
        sales_account = ChartOfAccounts(
            id=uuid4(),
            account_code="4000",
            account_name="Sales Revenue",
            account_type="revenue",
            account_category="operating_revenue"
        )
        self.db.add_all([cash_account, sales_account])
        self.db.commit()
        
        # Create unbalanced journal entry
        entry_data = JournalEntryCreate(
            entry_date=date.today(),
            description="Unbalanced entry",
            source_type="manual",
            journal_lines=[
                {
                    "line_number": 1,
                    "account_id": cash_account.id,
                    "debit_amount": Decimal('1000.00'),
                    "credit_amount": Decimal('0.00'),
                    "description": "Cash debit"
                },
                {
                    "line_number": 2,
                    "account_id": sales_account.id,
                    "debit_amount": Decimal('0.00'),
                    "credit_amount": Decimal('500.00'),  # Unbalanced!
                    "description": "Sales credit"
                }
            ]
        )
        
        response = client.post(
            "/accounting/journal-entries",
            json=entry_data.dict(),
            headers=self.headers
        )
        assert response.status_code == 400
        assert "must be balanced" in response.json()["detail"]

    def test_post_journal_entry(self):
        """Test posting journal entries"""
        # Create and post a journal entry using the service directly
        cash_account = ChartOfAccounts(
            id=uuid4(),
            account_code="1100",
            account_name="Cash",
            account_type="asset",
            account_category="current_asset"
        )
        sales_account = ChartOfAccounts(
            id=uuid4(),
            account_code="4000",
            account_name="Sales Revenue",
            account_type="revenue",
            account_category="operating_revenue"
        )
        self.db.add_all([cash_account, sales_account])
        self.db.commit()
        
        entry_data = JournalEntryCreate(
            entry_date=date.today(),
            description="Test posting",
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
        
        # Post entry
        response = client.post(
            f"/accounting/journal-entries/{entry.id}/post",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "posted"
        assert data["posted_by"] == str(self.test_user.id)
        assert "posted_at" in data

    def test_reverse_journal_entry(self):
        """Test reversing journal entries"""
        # Create and post a journal entry first
        cash_account = ChartOfAccounts(
            id=uuid4(),
            account_code="1100",
            account_name="Cash",
            account_type="asset",
            account_category="current_asset"
        )
        sales_account = ChartOfAccounts(
            id=uuid4(),
            account_code="4000",
            account_name="Sales Revenue",
            account_type="revenue",
            account_category="operating_revenue"
        )
        self.db.add_all([cash_account, sales_account])
        self.db.commit()
        
        entry_data = JournalEntryCreate(
            entry_date=date.today(),
            description="Entry to reverse",
            source_type="manual",
            journal_lines=[
                {
                    "line_number": 1,
                    "account_id": cash_account.id,
                    "debit_amount": Decimal('300.00'),
                    "credit_amount": Decimal('0.00'),
                    "description": "Cash debit"
                },
                {
                    "line_number": 2,
                    "account_id": sales_account.id,
                    "debit_amount": Decimal('0.00'),
                    "credit_amount": Decimal('300.00'),
                    "description": "Sales credit"
                }
            ]
        )
        
        # Create and post entry
        entry = asyncio.run(
            self.accounting_service.create_journal_entry(entry_data, self.test_user.id)
        )
        posted_entry = asyncio.run(
            self.accounting_service.post_journal_entry(entry.id, self.test_user.id)
        )
        
        # Reverse entry
        response = client.post(
            f"/accounting/journal-entries/{posted_entry.id}/reverse",
            params={"reversal_reason": "Error correction"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Check original entry is marked as reversed
        original_entry = self.db.query(JournalEntry).filter(JournalEntry.id == posted_entry.id).first()
        assert original_entry.status == "reversed"
        assert original_entry.reversal_reason == "Error correction"

    def test_check_management_system(self):
        """Test check management system (مدیریت چک‌ها)"""
        # Create subsidiary account for customer
        receivable_account = ChartOfAccounts(
            id=uuid4(),
            account_code="1200",
            account_name="Accounts Receivable",
            account_type="asset",
            account_category="current_asset"
        )
        self.db.add(receivable_account)
        self.db.commit()
        
        subsidiary_account = SubsidiaryAccount(
            id=uuid4(),
            subsidiary_code="1200-001",
            subsidiary_name="Customer Receivable",
            main_account_id=receivable_account.id,
            subsidiary_type="customer",
            reference_id=self.test_customer.id,
            reference_type="customer"
        )
        self.db.add(subsidiary_account)
        self.db.commit()
        
        # Create check
        check_data = CheckManagementCreate(
            check_number="123456",
            bank_name="Test Bank",
            bank_name_persian="بانک تست",
            check_amount=Decimal('2000.00'),
            check_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            check_type="received",
            drawer_name="Test Drawer",
            payee_name="Test Company",
            customer_id=self.test_customer.id,
            subsidiary_account_id=subsidiary_account.id
        )
        
        response = client.post(
            "/accounting/checks",
            json=check_data.dict(),
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["check_number"] == "123456"
        assert data["bank_name"] == "Test Bank"
        assert data["check_amount"] == 2000.00
        assert data["check_status"] == "pending"
        assert data["check_type"] == "received"

    def test_check_status_updates(self):
        """Test check status updates with journal entries"""
        # Create check first
        check = CheckManagement(
            id=uuid4(),
            check_number="789012",
            bank_name="Status Test Bank",
            check_amount=Decimal('1500.00'),
            check_date=date.today(),
            due_date=date.today() + timedelta(days=15),
            check_type="received",
            check_status="pending",
            customer_id=self.test_customer.id,
            created_by=self.test_user.id
        )
        self.db.add(check)
        self.db.commit()
        
        # Update status to deposited
        response = client.put(
            f"/accounting/checks/{check.id}/status",
            params={"status": "deposited", "notes": "Deposited at main branch"},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["check_status"] == "deposited"
        assert data["deposit_date"] is not None
        assert data["notes"] == "Deposited at main branch"

    def test_installment_account_management(self):
        """Test installment account management (حساب‌های اقساطی)"""
        installment_data = InstallmentAccountCreate(
            installment_number="INST-001",
            customer_id=self.test_customer.id,
            total_amount=Decimal('10000.00'),
            down_payment=Decimal('2000.00'),
            installment_amount=Decimal('800.00'),
            number_of_installments=10,
            installment_frequency="monthly",
            interest_rate=Decimal('2.5'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=300),
            terms_and_conditions="Standard installment terms"
        )
        
        response = client.post(
            "/accounting/installment-accounts",
            json=installment_data.dict(),
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["installment_number"] == "INST-001"
        assert data["total_amount"] == 10000.00
        assert data["installment_amount"] == 800.00
        assert data["number_of_installments"] == 10
        assert data["status"] == "active"
        assert data["remaining_installments"] == 10

    def test_installment_payment_processing(self):
        """Test processing installment payments"""
        # Create installment account using service
        installment_data = InstallmentAccountCreate(
            installment_number="INST-PAY-001",
            customer_id=self.test_customer.id,
            total_amount=Decimal('5000.00'),
            down_payment=Decimal('1000.00'),
            installment_amount=Decimal('500.00'),
            number_of_installments=8,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=240)
        )
        
        installment = asyncio.run(
            self.accounting_service.create_installment_account(installment_data, self.test_user.id)
        )
        
        # Process payment
        response = client.post(
            f"/accounting/installment-accounts/{installment.id}/payments",
            params={
                "payment_amount": 500.00,
                "payment_method": "cash"
            },
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Verify installment account is updated
        updated_installment = self.db.query(InstallmentAccount).filter(
            InstallmentAccount.id == installment.id
        ).first()
        assert updated_installment.paid_installments == 1
        assert updated_installment.total_paid == Decimal('500.00')

    def test_bank_reconciliation(self):
        """Test bank reconciliation functionality"""
        # Create bank account
        bank_account = ChartOfAccounts(
            id=uuid4(),
            account_code="1050",
            account_name="Bank Account",
            account_type="asset",
            account_category="current_asset"
        )
        self.db.add(bank_account)
        self.db.commit()
        
        reconciliation_data = BankReconciliationCreate(
            reconciliation_date=date.today(),
            bank_account_id=bank_account.id,
            book_balance=Decimal('15000.00'),
            bank_statement_balance=Decimal('14500.00'),
            period_start=date.today() - timedelta(days=30),
            period_end=date.today(),
            reconciliation_items=[
                {
                    "item_type": "outstanding_check",
                    "description": "Outstanding check #123",
                    "amount": Decimal('500.00'),
                    "reference_type": "check",
                    "reference_number": "123"
                }
            ]
        )
        
        response = client.post(
            "/accounting/bank-reconciliation",
            json=reconciliation_data.dict(),
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["book_balance"] == 15000.00
        assert data["bank_statement_balance"] == 14500.00
        assert data["status"] == "in_progress"
        assert len(data["reconciliation_items"]) == 1

    def test_trial_balance_report(self):
        """Test trial balance report generation"""
        # Create some accounts with balances
        accounts_data = [
            ("1100", "Cash", "asset", Decimal('5000.00'), Decimal('0.00')),
            ("2000", "Accounts Payable", "liability", Decimal('0.00'), Decimal('3000.00')),
            ("4000", "Sales Revenue", "revenue", Decimal('0.00'), Decimal('2000.00'))
        ]
        
        for code, name, acc_type, debit, credit in accounts_data:
            account = ChartOfAccounts(
                id=uuid4(),
                account_code=code,
                account_name=name,
                account_type=acc_type,
                account_category=f"{acc_type}_category",
                debit_balance=debit,
                credit_balance=credit,
                current_balance=debit - credit if acc_type in ['asset', 'expense'] else credit - debit
            )
            self.db.add(account)
        
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
        assert len(data["accounts"]) >= 3

    def test_balance_sheet_report(self):
        """Test balance sheet report generation"""
        # Create balance sheet accounts
        accounts_data = [
            ("1100", "Cash", "asset", Decimal('10000.00')),
            ("1200", "Accounts Receivable", "asset", Decimal('5000.00')),
            ("2100", "Accounts Payable", "liability", Decimal('3000.00')),
            ("3000", "Owner's Equity", "equity", Decimal('12000.00'))
        ]
        
        for code, name, acc_type, balance in accounts_data:
            if acc_type == 'asset':
                debit_balance = balance
                credit_balance = Decimal('0.00')
                current_balance = balance
            else:
                debit_balance = Decimal('0.00')
                credit_balance = balance
                current_balance = balance
            
            account = ChartOfAccounts(
                id=uuid4(),
                account_code=code,
                account_name=name,
                account_type=acc_type,
                account_category=f"{acc_type}_category",
                debit_balance=debit_balance,
                credit_balance=credit_balance,
                current_balance=current_balance
            )
            self.db.add(account)
        
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

    def test_profit_loss_statement(self):
        """Test profit and loss statement generation"""
        # Create P&L accounts
        revenue_account = ChartOfAccounts(
            id=uuid4(),
            account_code="4000",
            account_name="Sales Revenue",
            account_type="revenue",
            account_category="operating_revenue",
            credit_balance=Decimal('50000.00'),
            current_balance=Decimal('50000.00')
        )
        expense_account = ChartOfAccounts(
            id=uuid4(),
            account_code="5000",
            account_name="Operating Expenses",
            account_type="expense",
            account_category="operating_expense",
            debit_balance=Decimal('30000.00'),
            current_balance=Decimal('30000.00')
        )
        
        self.db.add_all([revenue_account, expense_account])
        self.db.commit()
        
        # Create journal entries for the period
        entry_data = JournalEntryCreate(
            entry_date=date.today(),
            description="Revenue entry",
            source_type="manual",
            journal_lines=[
                {
                    "line_number": 1,
                    "account_id": revenue_account.id,
                    "debit_amount": Decimal('0.00'),
                    "credit_amount": Decimal('10000.00'),
                    "description": "Revenue"
                },
                {
                    "line_number": 2,
                    "account_id": expense_account.id,
                    "debit_amount": Decimal('10000.00'),
                    "credit_amount": Decimal('0.00'),
                    "description": "Balancing entry"
                }
            ]
        )
        
        entry = asyncio.run(
            self.accounting_service.create_journal_entry(entry_data, self.test_user.id)
        )
        asyncio.run(
            self.accounting_service.post_journal_entry(entry.id, self.test_user.id)
        )
        
        # Generate P&L statement
        period_start = date.today() - timedelta(days=30)
        period_end = date.today()
        
        response = client.get(
            "/accounting/reports/profit-loss",
            params={
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat()
            },
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "revenue" in data
        assert "expenses" in data
        assert "gross_profit" in data
        assert "net_profit" in data

    def test_gold_invoice_journal_entry(self):
        """Test Gold invoice journal entry with سود, اجرت, مالیات"""
        # Create required accounts
        accounts_data = [
            ("1200", "Accounts Receivable", "asset"),
            ("4000", "Sales Revenue", "revenue"),
            ("4100", "سود (Profit)", "revenue"),
            ("4200", "اجرت (Labor Fee)", "revenue"),
            ("2300", "مالیات (Tax Payable)", "liability")
        ]
        
        created_accounts = {}
        for code, name, acc_type in accounts_data:
            account = ChartOfAccounts(
                id=uuid4(),
                account_code=code,
                account_name=name,
                account_type=acc_type,
                account_category=f"{acc_type}_category"
            )
            self.db.add(account)
            created_accounts[code] = account
        
        self.db.commit()
        
        # Create Gold invoice journal entry
        invoice_data = {
            "invoice_number": "GOLD-001",
            "total_amount": Decimal('15000.00'),
            "gold_sood": Decimal('2000.00'),
            "gold_ojrat": Decimal('1500.00'),
            "gold_maliyat": Decimal('500.00')
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
            JournalEntry.reference_number == "GOLD-001"
        ).first()
        
        assert journal_entry is not None
        assert journal_entry.gold_sood_amount == Decimal('2000.00')
        assert journal_entry.gold_ojrat_amount == Decimal('1500.00')
        assert journal_entry.gold_maliyat_amount == Decimal('500.00')
        assert journal_entry.is_balanced == True

    def test_account_balance_updates(self):
        """Test that account balances are updated correctly after journal entries"""
        # Create accounts
        cash_account = ChartOfAccounts(
            id=uuid4(),
            account_code="1100",
            account_name="Cash",
            account_type="asset",
            account_category="current_asset",
            current_balance=Decimal('0.00'),
            debit_balance=Decimal('0.00'),
            credit_balance=Decimal('0.00')
        )
        sales_account = ChartOfAccounts(
            id=uuid4(),
            account_code="4000",
            account_name="Sales Revenue",
            account_type="revenue",
            account_category="operating_revenue",
            current_balance=Decimal('0.00'),
            debit_balance=Decimal('0.00'),
            credit_balance=Decimal('0.00')
        )
        
        self.db.add_all([cash_account, sales_account])
        self.db.commit()
        
        # Create journal entry
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

    def test_audit_trail_logging(self):
        """Test that audit trail is properly logged for accounting changes"""
        # Create account
        account_data = ChartOfAccountsCreate(
            account_code="9999",
            account_name="Audit Test Account",
            account_type="asset",
            account_category="test_asset"
        )
        
        account = asyncio.run(
            self.accounting_service.create_chart_of_account(account_data, self.test_user.id)
        )
        
        # Check audit trail was created
        audit_entry = self.db.query(AccountingAuditTrail).filter(
            and_(
                AccountingAuditTrail.table_name == "chart_of_accounts",
                AccountingAuditTrail.record_id == account.id,
                AccountingAuditTrail.operation == "insert"
            )
        ).first()
        
        assert audit_entry is not None
        assert audit_entry.user_id == self.test_user.id
        assert audit_entry.change_description == f"Created account: {account.account_name}"
        assert audit_entry.new_values is not None

    def test_period_locking_prevents_posting(self):
        """Test that locked periods prevent journal entry posting"""
        # Create accounting period
        period = AccountingPeriod(
            id=uuid4(),
            period_code="2024-01",
            period_name="January 2024",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            fiscal_year=2024,
            status="closed",
            is_locked=True,
            locked_by=self.test_user.id
        )
        self.db.add(period)
        self.db.commit()
        
        # Create accounts
        cash_account = ChartOfAccounts(
            id=uuid4(),
            account_code="1100",
            account_name="Cash",
            account_type="asset",
            account_category="current_asset"
        )
        sales_account = ChartOfAccounts(
            id=uuid4(),
            account_code="4000",
            account_name="Sales Revenue",
            account_type="revenue",
            account_category="operating_revenue"
        )
        self.db.add_all([cash_account, sales_account])
        self.db.commit()
        
        # Create journal entry in locked period
        entry_data = JournalEntryCreate(
            entry_date=date(2024, 1, 15),  # Date in locked period
            description="Entry in locked period",
            source_type="manual",
            accounting_period="2024-01",
            journal_lines=[
                {
                    "line_number": 1,
                    "account_id": cash_account.id,
                    "debit_amount": Decimal('100.00'),
                    "credit_amount": Decimal('0.00'),
                    "description": "Cash"
                },
                {
                    "line_number": 2,
                    "account_id": sales_account.id,
                    "debit_amount": Decimal('0.00'),
                    "credit_amount": Decimal('100.00'),
                    "description": "Sales"
                }
            ]
        )
        
        entry = asyncio.run(
            self.accounting_service.create_journal_entry(entry_data, self.test_user.id)
        )
        
        # Try to post entry in locked period - should fail
        with pytest.raises(ValueError, match="Cannot post entry in locked period"):
            asyncio.run(
                self.accounting_service.post_journal_entry(entry.id, self.test_user.id)
            )

    def test_comprehensive_accounting_workflow(self):
        """Test complete accounting workflow from entry creation to reporting"""
        # 1. Create chart of accounts
        accounts_data = [
            ("1100", "Cash", "asset", "current_asset"),
            ("1200", "Accounts Receivable", "asset", "current_asset"),
            ("2100", "Accounts Payable", "liability", "current_liability"),
            ("3000", "Owner's Equity", "equity", "owner_equity"),
            ("4000", "Sales Revenue", "revenue", "operating_revenue"),
            ("5000", "Operating Expenses", "expense", "operating_expense")
        ]
        
        created_accounts = {}
        for code, name, acc_type, category in accounts_data:
            account = ChartOfAccounts(
                id=uuid4(),
                account_code=code,
                account_name=name,
                account_type=acc_type,
                account_category=category
            )
            self.db.add(account)
            created_accounts[code] = account
        
        self.db.commit()
        
        # 2. Create multiple journal entries
        entries_data = [
            # Cash sale
            {
                "description": "Cash sale",
                "lines": [
                    ("1100", Decimal('5000.00'), Decimal('0.00')),
                    ("4000", Decimal('0.00'), Decimal('5000.00'))
                ]
            },
            # Credit sale
            {
                "description": "Credit sale",
                "lines": [
                    ("1200", Decimal('3000.00'), Decimal('0.00')),
                    ("4000", Decimal('0.00'), Decimal('3000.00'))
                ]
            },
            # Operating expense
            {
                "description": "Operating expense",
                "lines": [
                    ("5000", Decimal('1500.00'), Decimal('0.00')),
                    ("1100", Decimal('0.00'), Decimal('1500.00'))
                ]
            }
        ]
        
        created_entries = []
        for entry_info in entries_data:
            journal_lines = []
            for i, (account_code, debit, credit) in enumerate(entry_info["lines"], 1):
                journal_lines.append({
                    "line_number": i,
                    "account_id": created_accounts[account_code].id,
                    "debit_amount": debit,
                    "credit_amount": credit,
                    "description": f"{entry_info['description']} - {account_code}"
                })
            
            entry_data = JournalEntryCreate(
                entry_date=date.today(),
                description=entry_info["description"],
                source_type="manual",
                journal_lines=journal_lines
            )
            
            entry = asyncio.run(
                self.accounting_service.create_journal_entry(entry_data, self.test_user.id)
            )
            posted_entry = asyncio.run(
                self.accounting_service.post_journal_entry(entry.id, self.test_user.id)
            )
            created_entries.append(posted_entry)
        
        # 3. Generate and verify reports
        
        # Trial Balance
        trial_balance = asyncio.run(
            self.accounting_service.generate_trial_balance(date.today())
        )
        assert trial_balance.is_balanced
        assert trial_balance.total_debits == trial_balance.total_credits
        
        # Balance Sheet
        balance_sheet = asyncio.run(
            self.accounting_service.generate_balance_sheet(date.today())
        )
        assert balance_sheet.is_balanced
        assert balance_sheet.total_assets == balance_sheet.total_liabilities_equity
        
        # P&L Statement
        profit_loss = asyncio.run(
            self.accounting_service.generate_profit_loss_statement(
                date.today() - timedelta(days=1),
                date.today()
            )
        )
        assert profit_loss.net_profit > 0  # Should be profitable
        
        # 4. Verify account balances
        self.db.refresh(created_accounts["1100"])  # Cash
        self.db.refresh(created_accounts["4000"])  # Sales Revenue
        
        # Cash should be 5000 - 1500 = 3500
        assert created_accounts["1100"].current_balance == Decimal('3500.00')
        # Sales Revenue should be 5000 + 3000 = 8000
        assert created_accounts["4000"].current_balance == Decimal('8000.00')

if __name__ == "__main__":
    pytest.main([__file__, "-v"])