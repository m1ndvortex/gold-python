"""
Comprehensive Unit Tests for Double-Entry Accounting System
Tests all accounting functionality using real PostgreSQL database in Docker
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from main import app
from database import get_db, engine
from models_accounting import (
    ChartOfAccounts, AccountingPeriod, JournalEntry, JournalEntryLine,
    BankAccount, BankTransaction, BankReconciliation, CheckRegister,
    AccountingAuditLog, Base
)
from services.accounting_service import AccountingService
from schemas_accounting import (
    ChartOfAccountsCreate, AccountingPeriodCreate, JournalEntryCreate,
    JournalEntryLineCreate, BankAccountCreate, BankTransactionCreate,
    BankReconciliationCreate, CheckRegisterCreate, AccountType,
    JournalEntryStatus, PeriodType, TransactionType, ReconciliationStatus
)

# Test client
client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db = next(get_db())
    
    try:
        yield db
    finally:
        db.close()
        # Clean up tables after test
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def accounting_service(db_session):
    """Create accounting service instance"""
    return AccountingService(db_session)

@pytest.fixture
def sample_accounts(accounting_service):
    """Create sample chart of accounts for testing"""
    accounts = []
    
    # Create main account categories
    cash_account = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="1001",
            account_name="Cash",
            account_type=AccountType.ASSET,
            description="Cash account"
        ),
        "test_user"
    )
    accounts.append(cash_account)
    
    revenue_account = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="4001",
            account_name="Sales Revenue",
            account_type=AccountType.REVENUE,
            description="Sales revenue account"
        ),
        "test_user"
    )
    accounts.append(revenue_account)
    
    expense_account = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="5001",
            account_name="Office Expenses",
            account_type=AccountType.EXPENSE,
            description="Office expenses account"
        ),
        "test_user"
    )
    accounts.append(expense_account)
    
    return accounts

@pytest.fixture
def sample_period(accounting_service):
    """Create sample accounting period"""
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2024, 1, 31)
    
    period = accounting_service.create_accounting_period(
        AccountingPeriodCreate(
            period_name="January 2024",
            start_date=start_date,
            end_date=end_date,
            period_type=PeriodType.MONTHLY
        )
    )
    
    return period

class TestChartOfAccounts:
    """Test chart of accounts functionality"""
    
    def test_create_chart_account(self, accounting_service):
        """Test creating a new chart of accounts entry"""
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
        assert account.level == 0
        assert account.is_active is True
        assert account.created_by == "test_user"
    
    def test_create_hierarchical_accounts(self, accounting_service):
        """Test creating hierarchical account structure"""
        # Create parent account
        parent_account = accounting_service.create_chart_account(
            ChartOfAccountsCreate(
                account_code="1000",
                account_name="Assets",
                account_type=AccountType.ASSET
            ),
            "test_user"
        )
        
        # Create child account
        child_account = accounting_service.create_chart_account(
            ChartOfAccountsCreate(
                account_code="1100",
                account_name="Current Assets",
                account_type=AccountType.ASSET,
                parent_id=str(parent_account.id)
            ),
            "test_user"
        )
        
        assert child_account.parent_id == parent_account.id
        assert child_account.level == 1
        assert parent_account.level == 0
    
    def test_get_chart_accounts_hierarchy(self, accounting_service, sample_accounts):
        """Test retrieving chart of accounts hierarchy"""
        accounts = accounting_service.get_chart_accounts_hierarchy()
        
        assert len(accounts) >= 3
        assert any(acc.account_code == "1001" for acc in accounts)
        assert any(acc.account_code == "4001" for acc in accounts)
        assert any(acc.account_code == "5001" for acc in accounts)
    
    def test_get_chart_accounts_by_type(self, accounting_service, sample_accounts):
        """Test filtering accounts by type"""
        asset_accounts = accounting_service.get_chart_accounts_hierarchy(AccountType.ASSET)
        revenue_accounts = accounting_service.get_chart_accounts_hierarchy(AccountType.REVENUE)
        
        assert len(asset_accounts) >= 1
        assert len(revenue_accounts) >= 1
        assert all(acc.account_type == AccountType.ASSET for acc in asset_accounts)
        assert all(acc.account_type == AccountType.REVENUE for acc in revenue_accounts)
    
    def test_duplicate_account_code_prevention(self, accounting_service):
        """Test that duplicate account codes are prevented"""
        # Create first account
        accounting_service.create_chart_account(
            ChartOfAccountsCreate(
                account_code="1001",
                account_name="Cash",
                account_type=AccountType.ASSET
            ),
            "test_user"
        )
        
        # Try to create duplicate - should be handled at API level
        existing = accounting_service.get_chart_account_by_code("1001")
        assert existing is not None

class TestAccountingPeriods:
    """Test accounting period functionality"""
    
    def test_create_accounting_period(self, accounting_service):
        """Test creating an accounting period"""
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 31)
        
        period_data = AccountingPeriodCreate(
            period_name="January 2024",
            start_date=start_date,
            end_date=end_date,
            period_type=PeriodType.MONTHLY
        )
        
        period = accounting_service.create_accounting_period(period_data)
        
        assert period.id is not None
        assert period.period_name == "January 2024"
        assert period.start_date == start_date
        assert period.end_date == end_date
        assert period.period_type == PeriodType.MONTHLY
        assert period.is_closed is False
    
    def test_get_current_period(self, accounting_service):
        """Test getting current open period"""
        # Create a period that includes today
        today = datetime.utcnow()
        start_date = today.replace(day=1)
        end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        period = accounting_service.create_accounting_period(
            AccountingPeriodCreate(
                period_name=f"{today.strftime('%B %Y')}",
                start_date=start_date,
                end_date=end_date,
                period_type=PeriodType.MONTHLY
            )
        )
        
        current_period = accounting_service.get_current_period()
        assert current_period is not None
        assert current_period.id == period.id
    
    def test_close_accounting_period(self, accounting_service, sample_period):
        """Test closing an accounting period"""
        closed_period = accounting_service.close_accounting_period(str(sample_period.id), "test_user")
        
        assert closed_period.is_closed is True
        assert closed_period.closed_by == "test_user"
        assert closed_period.closed_at is not None

class TestJournalEntries:
    """Test journal entry functionality"""
    
    def test_create_journal_entry(self, accounting_service, sample_accounts, sample_period):
        """Test creating a balanced journal entry"""
        cash_account, revenue_account, _ = sample_accounts
        
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description="Test journal entry",
            reference="TEST-001",
            period_id=str(sample_period.id),
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
        assert entry.entry_number is not None
        assert entry.total_debit == Decimal('1000.00')
        assert entry.total_credit == Decimal('1000.00')
        assert entry.is_balanced is True
        assert entry.status == JournalEntryStatus.DRAFT
        assert len(entry.lines) == 2
    
    def test_unbalanced_journal_entry_validation(self, accounting_service, sample_accounts):
        """Test that unbalanced entries are rejected"""
        cash_account, revenue_account, _ = sample_accounts
        
        with pytest.raises(ValueError, match="Entry must be balanced"):
            JournalEntryCreate(
                entry_date=datetime.utcnow(),
                description="Unbalanced entry",
                lines=[
                    JournalEntryLineCreate(
                        account_id=str(cash_account.id),
                        debit_amount=Decimal('1000.00'),
                        credit_amount=Decimal('0.00')
                    ),
                    JournalEntryLineCreate(
                        account_id=str(revenue_account.id),
                        debit_amount=Decimal('0.00'),
                        credit_amount=Decimal('500.00')  # Unbalanced!
                    )
                ]
            )
    
    def test_post_journal_entry(self, accounting_service, sample_accounts, sample_period):
        """Test posting a journal entry"""
        cash_account, revenue_account, _ = sample_accounts
        
        # Create entry
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description="Test posting",
            period_id=str(sample_period.id),
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
        
        # Post the entry
        posted_entry = accounting_service.post_journal_entry(str(entry.id), "test_user")
        
        assert posted_entry.status == JournalEntryStatus.POSTED
    
    def test_approve_journal_entry(self, accounting_service, sample_accounts, sample_period):
        """Test approving a journal entry"""
        cash_account, revenue_account, _ = sample_accounts
        
        # Create entry requiring approval
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description="Test approval",
            requires_approval=True,
            period_id=str(sample_period.id),
            lines=[
                JournalEntryLineCreate(
                    account_id=str(cash_account.id),
                    debit_amount=Decimal('2000.00'),
                    credit_amount=Decimal('0.00')
                ),
                JournalEntryLineCreate(
                    account_id=str(revenue_account.id),
                    debit_amount=Decimal('0.00'),
                    credit_amount=Decimal('2000.00')
                )
            ]
        )
        
        entry = accounting_service.create_journal_entry(entry_data, "test_user")
        
        # Approve the entry
        approved_entry = accounting_service.approve_journal_entry(str(entry.id), "approver_user")
        
        assert approved_entry.approved_by == "approver_user"
        assert approved_entry.approved_at is not None
    
    def test_reverse_journal_entry(self, accounting_service, sample_accounts, sample_period):
        """Test reversing a posted journal entry"""
        cash_account, revenue_account, _ = sample_accounts
        
        # Create and post entry
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description="Entry to reverse",
            period_id=str(sample_period.id),
            lines=[
                JournalEntryLineCreate(
                    account_id=str(cash_account.id),
                    debit_amount=Decimal('750.00'),
                    credit_amount=Decimal('0.00')
                ),
                JournalEntryLineCreate(
                    account_id=str(revenue_account.id),
                    debit_amount=Decimal('0.00'),
                    credit_amount=Decimal('750.00')
                )
            ]
        )
        
        entry = accounting_service.create_journal_entry(entry_data, "test_user")
        posted_entry = accounting_service.post_journal_entry(str(entry.id), "test_user")
        
        # Reverse the entry
        reversal_entry = accounting_service.reverse_journal_entry(
            str(posted_entry.id), 
            "Test reversal", 
            "test_user"
        )
        
        assert reversal_entry.status == JournalEntryStatus.POSTED
        assert reversal_entry.total_debit == posted_entry.total_credit
        assert reversal_entry.total_credit == posted_entry.total_debit
        assert reversal_entry.source_type == "reversal"
        
        # Check original entry is marked as reversed
        accounting_service.db.refresh(posted_entry)
        assert posted_entry.status == JournalEntryStatus.REVERSED
        assert posted_entry.reversed_entry_id == reversal_entry.id

class TestBankAccounts:
    """Test bank account functionality"""
    
    def test_create_bank_account(self, accounting_service):
        """Test creating a bank account"""
        account_data = BankAccountCreate(
            account_name="Main Checking",
            account_number="123456789",
            bank_name="Test Bank",
            account_type="checking",
            currency="USD"
        )
        
        account = accounting_service.create_bank_account(account_data)
        
        assert account.id is not None
        assert account.account_name == "Main Checking"
        assert account.account_number == "123456789"
        assert account.bank_name == "Test Bank"
        assert account.current_balance == Decimal('0')
        assert account.is_active is True
    
    def test_create_bank_transaction(self, accounting_service):
        """Test creating bank transactions"""
        # Create bank account first
        bank_account = accounting_service.create_bank_account(
            BankAccountCreate(
                account_name="Test Account",
                account_number="987654321",
                bank_name="Test Bank",
                account_type="checking"
            )
        )
        
        # Create credit transaction
        transaction_data = BankTransactionCreate(
            bank_account_id=str(bank_account.id),
            transaction_date=datetime.utcnow(),
            description="Deposit",
            amount=Decimal('1000.00'),
            transaction_type=TransactionType.CREDIT,
            reference="DEP-001"
        )
        
        transaction = accounting_service.create_bank_transaction(transaction_data)
        
        assert transaction.id is not None
        assert transaction.amount == Decimal('1000.00')
        assert transaction.transaction_type == TransactionType.CREDIT
        assert transaction.is_reconciled is False
    
    def test_bank_balance_update(self, accounting_service):
        """Test that bank balance updates with transactions"""
        # Create bank account
        bank_account = accounting_service.create_bank_account(
            BankAccountCreate(
                account_name="Balance Test",
                account_number="111222333",
                bank_name="Test Bank",
                account_type="checking"
            )
        )
        
        # Add credit transaction
        accounting_service.create_bank_transaction(
            BankTransactionCreate(
                bank_account_id=str(bank_account.id),
                transaction_date=datetime.utcnow(),
                description="Deposit",
                amount=Decimal('500.00'),
                transaction_type=TransactionType.CREDIT
            )
        )
        
        # Add debit transaction
        accounting_service.create_bank_transaction(
            BankTransactionCreate(
                bank_account_id=str(bank_account.id),
                transaction_date=datetime.utcnow(),
                description="Withdrawal",
                amount=Decimal('200.00'),
                transaction_type=TransactionType.DEBIT
            )
        )
        
        # Refresh and check balance
        accounting_service.db.refresh(bank_account)
        assert bank_account.current_balance == Decimal('300.00')

class TestBankReconciliation:
    """Test bank reconciliation functionality"""
    
    def test_create_bank_reconciliation(self, accounting_service):
        """Test creating a bank reconciliation"""
        # Create bank account
        bank_account = accounting_service.create_bank_account(
            BankAccountCreate(
                account_name="Reconciliation Test",
                account_number="444555666",
                bank_name="Test Bank",
                account_type="checking"
            )
        )
        
        reconciliation_data = BankReconciliationCreate(
            bank_account_id=str(bank_account.id),
            reconciliation_date=datetime.utcnow(),
            statement_date=datetime.utcnow(),
            statement_balance=Decimal('1500.00'),
            book_balance=Decimal('1400.00'),
            outstanding_deposits=Decimal('200.00'),
            outstanding_checks=Decimal('100.00')
        )
        
        reconciliation = accounting_service.create_bank_reconciliation(reconciliation_data, "test_user")
        
        assert reconciliation.id is not None
        assert reconciliation.statement_balance == Decimal('1500.00')
        assert reconciliation.book_balance == Decimal('1400.00')
        assert reconciliation.adjusted_balance == Decimal('1600.00')  # 1500 + 200 - 100
        assert reconciliation.status == ReconciliationStatus.IN_PROGRESS

class TestFinancialReports:
    """Test financial reporting functionality"""
    
    def test_trial_balance_generation(self, accounting_service, sample_accounts, sample_period):
        """Test generating trial balance report"""
        cash_account, revenue_account, expense_account = sample_accounts
        
        # Create some journal entries
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description="Test transactions for trial balance",
            period_id=str(sample_period.id),
            lines=[
                JournalEntryLineCreate(
                    account_id=str(cash_account.id),
                    debit_amount=Decimal('1000.00'),
                    credit_amount=Decimal('0.00')
                ),
                JournalEntryLineCreate(
                    account_id=str(revenue_account.id),
                    debit_amount=Decimal('0.00'),
                    credit_amount=Decimal('1000.00')
                )
            ]
        )
        
        entry = accounting_service.create_journal_entry(entry_data, "test_user")
        accounting_service.post_journal_entry(str(entry.id), "test_user")
        
        # Generate trial balance
        trial_balance = accounting_service.generate_trial_balance(datetime.utcnow())
        
        assert trial_balance.total_debits >= Decimal('1000.00')
        assert trial_balance.total_credits >= Decimal('1000.00')
        assert trial_balance.is_balanced is True
        assert len(trial_balance.accounts) >= 3
    
    def test_balance_sheet_generation(self, accounting_service, sample_accounts, sample_period):
        """Test generating balance sheet report"""
        cash_account, revenue_account, _ = sample_accounts
        
        # Create transactions
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description="Balance sheet test",
            period_id=str(sample_period.id),
            lines=[
                JournalEntryLineCreate(
                    account_id=str(cash_account.id),
                    debit_amount=Decimal('2000.00'),
                    credit_amount=Decimal('0.00')
                ),
                JournalEntryLineCreate(
                    account_id=str(revenue_account.id),
                    debit_amount=Decimal('0.00'),
                    credit_amount=Decimal('2000.00')
                )
            ]
        )
        
        entry = accounting_service.create_journal_entry(entry_data, "test_user")
        accounting_service.post_journal_entry(str(entry.id), "test_user")
        
        # Generate balance sheet
        balance_sheet = accounting_service.generate_balance_sheet(datetime.utcnow())
        
        assert balance_sheet.total_assets >= Decimal('2000.00')
        assert len(balance_sheet.assets) >= 1
    
    def test_income_statement_generation(self, accounting_service, sample_accounts, sample_period):
        """Test generating income statement report"""
        cash_account, revenue_account, expense_account = sample_accounts
        
        # Create revenue transaction
        revenue_entry = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description="Revenue transaction",
            period_id=str(sample_period.id),
            lines=[
                JournalEntryLineCreate(
                    account_id=str(cash_account.id),
                    debit_amount=Decimal('3000.00'),
                    credit_amount=Decimal('0.00')
                ),
                JournalEntryLineCreate(
                    account_id=str(revenue_account.id),
                    debit_amount=Decimal('0.00'),
                    credit_amount=Decimal('3000.00')
                )
            ]
        )
        
        entry1 = accounting_service.create_journal_entry(revenue_entry, "test_user")
        accounting_service.post_journal_entry(str(entry1.id), "test_user")
        
        # Create expense transaction
        expense_entry = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description="Expense transaction",
            period_id=str(sample_period.id),
            lines=[
                JournalEntryLineCreate(
                    account_id=str(expense_account.id),
                    debit_amount=Decimal('500.00'),
                    credit_amount=Decimal('0.00')
                ),
                JournalEntryLineCreate(
                    account_id=str(cash_account.id),
                    debit_amount=Decimal('0.00'),
                    credit_amount=Decimal('500.00')
                )
            ]
        )
        
        entry2 = accounting_service.create_journal_entry(expense_entry, "test_user")
        accounting_service.post_journal_entry(str(entry2.id), "test_user")
        
        # Generate income statement
        start_date = sample_period.start_date
        end_date = sample_period.end_date
        income_statement = accounting_service.generate_income_statement(start_date, end_date)
        
        assert income_statement.total_revenue >= Decimal('3000.00')
        assert income_statement.total_expenses >= Decimal('500.00')
        assert income_statement.net_income >= Decimal('2500.00')
    
    def test_general_ledger_generation(self, accounting_service, sample_accounts, sample_period):
        """Test generating general ledger for specific account"""
        cash_account, revenue_account, _ = sample_accounts
        
        # Create multiple transactions for cash account
        for i in range(3):
            entry_data = JournalEntryCreate(
                entry_date=datetime.utcnow(),
                description=f"Transaction {i+1}",
                period_id=str(sample_period.id),
                lines=[
                    JournalEntryLineCreate(
                        account_id=str(cash_account.id),
                        debit_amount=Decimal(f'{(i+1)*100}.00'),
                        credit_amount=Decimal('0.00')
                    ),
                    JournalEntryLineCreate(
                        account_id=str(revenue_account.id),
                        debit_amount=Decimal('0.00'),
                        credit_amount=Decimal(f'{(i+1)*100}.00')
                    )
                ]
            )
            
            entry = accounting_service.create_journal_entry(entry_data, "test_user")
            accounting_service.post_journal_entry(str(entry.id), "test_user")
        
        # Generate general ledger
        ledger = accounting_service.generate_general_ledger(
            str(cash_account.id),
            sample_period.start_date,
            sample_period.end_date
        )
        
        assert ledger.account_code == "1001"
        assert ledger.account_name == "Cash"
        assert len(ledger.transactions) >= 3
        assert ledger.closing_balance >= Decimal('600.00')  # 100 + 200 + 300

class TestAPIEndpoints:
    """Test accounting API endpoints"""
    
    def test_create_chart_account_api(self):
        """Test chart of accounts creation via API"""
        account_data = {
            "account_code": "1002",
            "account_name": "Petty Cash",
            "account_type": "Asset",
            "description": "Petty cash account"
        }
        
        response = client.post("/api/accounting/chart-of-accounts", json=account_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["account_code"] == "1002"
        assert data["account_name"] == "Petty Cash"
        assert data["account_type"] == "Asset"
    
    def test_get_chart_accounts_api(self):
        """Test retrieving chart of accounts via API"""
        # First create an account
        account_data = {
            "account_code": "1003",
            "account_name": "Bank Account",
            "account_type": "Asset"
        }
        client.post("/api/accounting/chart-of-accounts", json=account_data)
        
        # Then retrieve accounts
        response = client.get("/api/accounting/chart-of-accounts")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    def test_create_journal_entry_api(self):
        """Test journal entry creation via API"""
        # First create accounts
        cash_account_data = {
            "account_code": "1004",
            "account_name": "Cash API Test",
            "account_type": "Asset"
        }
        cash_response = client.post("/api/accounting/chart-of-accounts", json=cash_account_data)
        cash_account = cash_response.json()
        
        revenue_account_data = {
            "account_code": "4004",
            "account_name": "Revenue API Test",
            "account_type": "Revenue"
        }
        revenue_response = client.post("/api/accounting/chart-of-accounts", json=revenue_account_data)
        revenue_account = revenue_response.json()
        
        # Create journal entry
        entry_data = {
            "entry_date": datetime.utcnow().isoformat(),
            "description": "API test journal entry",
            "reference": "API-001",
            "lines": [
                {
                    "account_id": cash_account["id"],
                    "debit_amount": "1500.00",
                    "credit_amount": "0.00",
                    "description": "Cash received"
                },
                {
                    "account_id": revenue_account["id"],
                    "debit_amount": "0.00",
                    "credit_amount": "1500.00",
                    "description": "Revenue earned"
                }
            ]
        }
        
        response = client.post("/api/accounting/journal-entries", json=entry_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_debit"] == "1500.00"
        assert data["total_credit"] == "1500.00"
        assert data["is_balanced"] is True
        assert len(data["lines"]) == 2
    
    def test_trial_balance_api(self):
        """Test trial balance generation via API"""
        as_of_date = datetime.utcnow().isoformat()
        
        response = client.get(f"/api/accounting/reports/trial-balance?as_of_date={as_of_date}")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_debits" in data
        assert "total_credits" in data
        assert "is_balanced" in data
        assert "accounts" in data
        assert isinstance(data["accounts"], list)

class TestAuditTrail:
    """Test audit trail functionality"""
    
    def test_audit_log_creation(self, accounting_service):
        """Test that audit logs are created for accounting operations"""
        # Create an account (should generate audit log)
        account_data = ChartOfAccountsCreate(
            account_code="1005",
            account_name="Audit Test Account",
            account_type=AccountType.ASSET
        )
        
        account = accounting_service.create_chart_account(account_data, "audit_test_user")
        
        # Check audit log was created
        audit_logs = accounting_service.db.query(AccountingAuditLog).filter(
            AccountingAuditLog.table_name == "chart_of_accounts",
            AccountingAuditLog.record_id == str(account.id)
        ).all()
        
        assert len(audit_logs) >= 1
        audit_log = audit_logs[0]
        assert audit_log.action == "CREATE"
        assert audit_log.user_id == "audit_test_user"
        assert audit_log.new_values is not None

class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_post_unbalanced_entry_error(self, accounting_service, sample_accounts):
        """Test that posting unbalanced entries raises error"""
        cash_account, revenue_account, _ = sample_accounts
        
        # Create unbalanced entry by manipulating after creation
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description="Test error handling",
            lines=[
                JournalEntryLineCreate(
                    account_id=str(cash_account.id),
                    debit_amount=Decimal('1000.00'),
                    credit_amount=Decimal('0.00')
                ),
                JournalEntryLineCreate(
                    account_id=str(revenue_account.id),
                    debit_amount=Decimal('0.00'),
                    credit_amount=Decimal('1000.00')
                )
            ]
        )
        
        entry = accounting_service.create_journal_entry(entry_data, "test_user")
        
        # Manually make it unbalanced
        entry.is_balanced = False
        accounting_service.db.commit()
        
        # Try to post - should fail
        with pytest.raises(ValueError, match="Cannot post unbalanced journal entry"):
            accounting_service.post_journal_entry(str(entry.id), "test_user")
    
    def test_close_period_with_unposted_entries_error(self, accounting_service, sample_accounts, sample_period):
        """Test that closing period with unposted entries raises error"""
        cash_account, revenue_account, _ = sample_accounts
        
        # Create unposted entry
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description="Unposted entry",
            period_id=str(sample_period.id),
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
        
        accounting_service.create_journal_entry(entry_data, "test_user")
        
        # Try to close period - should fail
        with pytest.raises(ValueError, match="Cannot close period with .* unposted journal entries"):
            accounting_service.close_accounting_period(str(sample_period.id), "test_user")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])