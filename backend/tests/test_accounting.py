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
from models import (
    Base, User, Role, Customer, InventoryItem, Category, Invoice, InvoiceItem, 
    Payment, AccountingEntry, CompanySettings
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

class TestAccountingSystem:
    """Comprehensive tests for the accounting system with real PostgreSQL database"""
    
    @pytest.fixture(autouse=True)
    def setup_test_data(self, db_session: Session):
        """Set up test data for accounting tests"""
        self.db = db_session
        
        # Create test role
        self.test_role = Role(
            id=uuid4(),
            name="test_accountant",
            description="Test accountant role",
            permissions={"accounting": ["read", "write"]}
        )
        self.db.add(self.test_role)
        
        # Create test user
        self.test_user = User(
            id=uuid4(),
            username="test_accountant",
            email="accountant@test.com",
            password_hash="hashed_password",
            role_id=self.test_role.id,
            is_active=True
        )
        self.db.add(self.test_user)
        
        # Create test category
        self.test_category = Category(
            id=uuid4(),
            name="Gold Rings",
            description="Test category for gold rings"
        )
        self.db.add(self.test_category)
        
        # Create test inventory item
        self.test_item = InventoryItem(
            id=uuid4(),
            name="Test Gold Ring",
            category_id=self.test_category.id,
            weight_grams=Decimal('10.5'),
            purchase_price=Decimal('500.00'),
            sell_price=Decimal('750.00'),
            stock_quantity=10,
            min_stock_level=2
        )
        self.db.add(self.test_item)
        
        # Create test customer
        self.test_customer = Customer(
            id=uuid4(),
            name="Test Customer",
            phone="1234567890",
            email="customer@test.com",
            current_debt=Decimal('0.00')
        )
        self.db.add(self.test_customer)
        
        # Create company settings
        self.company_settings = CompanySettings(
            id=uuid4(),
            company_name="Test Gold Shop",
            default_gold_price=Decimal('60.00'),
            default_labor_percentage=Decimal('10.00'),
            default_profit_percentage=Decimal('15.00'),
            default_vat_percentage=Decimal('5.00')
        )
        self.db.add(self.company_settings)
        
        self.db.commit()
        
        # Create access token for authentication
        self.access_token = create_access_token(
            data={"sub": str(self.test_user.id), "username": self.test_user.username}
        )
        self.headers = {"Authorization": f"Bearer {self.access_token}"}

    def test_income_ledger_empty(self):
        """Test income ledger when no invoices exist"""
        response = client.get("/accounting/income-ledger", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_income_ledger_with_invoices(self):
        """Test income ledger with actual invoice data"""
        # Create test invoice
        test_invoice = Invoice(
            id=uuid4(),
            invoice_number="INV-001",
            customer_id=self.test_customer.id,
            total_amount=Decimal('1000.00'),
            paid_amount=Decimal('500.00'),
            remaining_amount=Decimal('500.00'),
            gold_price_per_gram=Decimal('60.00'),
            labor_cost_percentage=Decimal('10.00'),
            profit_percentage=Decimal('15.00'),
            vat_percentage=Decimal('5.00'),
            status='partial'
        )
        self.db.add(test_invoice)
        
        # Create invoice item
        invoice_item = InvoiceItem(
            id=uuid4(),
            invoice_id=test_invoice.id,
            inventory_item_id=self.test_item.id,
            quantity=1,
            unit_price=Decimal('1000.00'),
            total_price=Decimal('1000.00'),
            weight_grams=Decimal('10.5')
        )
        self.db.add(invoice_item)
        self.db.commit()
        
        # Test income ledger
        response = client.get("/accounting/income-ledger", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        
        income_entry = data[0]
        assert income_entry["invoice_number"] == "INV-001"
        assert income_entry["customer_name"] == "Test Customer"
        assert income_entry["total_amount"] == 1000.00
        assert income_entry["paid_amount"] == 500.00
        assert income_entry["remaining_amount"] == 500.00
        assert income_entry["payment_status"] == "partial"

    def test_income_ledger_filtering(self):
        """Test income ledger with various filters"""
        # Create multiple invoices with different statuses
        invoices_data = [
            ("INV-002", Decimal('1000.00'), Decimal('1000.00'), Decimal('0.00'), 'paid'),
            ("INV-003", Decimal('800.00'), Decimal('0.00'), Decimal('800.00'), 'unpaid'),
            ("INV-004", Decimal('1200.00'), Decimal('600.00'), Decimal('600.00'), 'partial')
        ]
        
        for inv_num, total, paid, remaining, status in invoices_data:
            invoice = Invoice(
                id=uuid4(),
                invoice_number=inv_num,
                customer_id=self.test_customer.id,
                total_amount=total,
                paid_amount=paid,
                remaining_amount=remaining,
                gold_price_per_gram=Decimal('60.00'),
                status=status
            )
            self.db.add(invoice)
        
        self.db.commit()
        
        # Test filter by payment status - paid
        response = client.get("/accounting/income-ledger?payment_status=paid", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        paid_invoices = [inv for inv in data if inv["payment_status"] == "paid"]
        assert len(paid_invoices) >= 1
        
        # Test filter by payment status - unpaid
        response = client.get("/accounting/income-ledger?payment_status=unpaid", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        unpaid_invoices = [inv for inv in data if inv["payment_status"] == "unpaid"]
        assert len(unpaid_invoices) >= 1

    def test_expense_ledger_empty(self):
        """Test expense ledger when no expenses exist"""
        response = client.get("/accounting/expense-ledger", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_create_expense_entry(self):
        """Test creating expense entries"""
        expense_data = {
            "category": "inventory_purchase",
            "amount": 500.00,
            "description": "Purchased gold rings"
        }
        
        response = client.post("/accounting/expense-ledger", json=expense_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["category"] == "inventory_purchase"
        assert data["amount"] == 500.00
        assert data["description"] == "Purchased gold rings"
        assert "id" in data
        assert "transaction_date" in data

    def test_expense_ledger_with_entries(self):
        """Test expense ledger with actual expense data"""
        # Create expense entries directly in database
        expenses = [
            ("inventory_purchase", Decimal('1000.00'), "Gold purchase"),
            ("store_rent", Decimal('500.00'), "Monthly rent"),
            ("utilities", Decimal('200.00'), "Electricity bill")
        ]
        
        for category, amount, description in expenses:
            expense = AccountingEntry(
                id=uuid4(),
                entry_type="expense",
                category=category,
                amount=amount,
                description=description
            )
            self.db.add(expense)
        
        self.db.commit()
        
        # Test expense ledger
        response = client.get("/accounting/expense-ledger", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        
        # Verify expense categories
        categories = [exp["category"] for exp in data]
        assert "inventory_purchase" in categories
        assert "store_rent" in categories
        assert "utilities" in categories

    def test_cash_bank_ledger_with_payments(self):
        """Test cash and bank ledger with payment data"""
        # Create test payment
        test_payment = Payment(
            id=uuid4(),
            customer_id=self.test_customer.id,
            amount=Decimal('500.00'),
            payment_method='cash',
            description='Invoice payment'
        )
        self.db.add(test_payment)
        
        # Create cash outflow entry
        cash_outflow = AccountingEntry(
            id=uuid4(),
            entry_type="cash",
            category="expense",
            amount=Decimal('200.00'),
            description="Cash expense for supplies"
        )
        self.db.add(cash_outflow)
        self.db.commit()
        
        # Test cash bank ledger
        response = client.get("/accounting/cash-bank-ledger", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        
        # Check for cash inflow from payment
        cash_inflows = [entry for entry in data if entry["transaction_type"] == "cash_in"]
        assert len(cash_inflows) >= 1
        assert cash_inflows[0]["amount"] == 500.00
        
        # Check for cash outflow
        cash_outflows = [entry for entry in data if entry["transaction_type"] == "cash_out"]
        assert len(cash_outflows) >= 1
        assert cash_outflows[0]["amount"] == 200.00

    def test_gold_weight_ledger(self):
        """Test gold weight ledger for inventory valuation"""
        # Create gold weight entries
        gold_entries = [
            ("purchase", Decimal('100.5'), "Gold purchase", "inventory_purchase"),
            ("sale", Decimal('-10.5'), "Gold sale via invoice", "invoice")
        ]
        
        for category, weight, description, ref_type in gold_entries:
            entry = AccountingEntry(
                id=uuid4(),
                entry_type="gold_weight",
                category=category,
                weight_grams=weight,
                description=description,
                reference_type=ref_type
            )
            self.db.add(entry)
        
        self.db.commit()
        
        # Test gold weight ledger
        response = client.get("/accounting/gold-weight-ledger", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        
        # Verify weight calculations and valuations
        purchase_entry = next(entry for entry in data if entry["transaction_type"] == "purchase")
        assert purchase_entry["weight_grams"] == 100.5
        assert purchase_entry["current_valuation"] > 0  # Should have valuation based on gold price
        
        sale_entry = next(entry for entry in data if entry["transaction_type"] == "sale")
        assert sale_entry["weight_grams"] == 10.5  # Absolute value for display

    def test_profit_loss_analysis(self):
        """Test comprehensive profit and loss analysis"""
        # Create test data for analysis
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        # Create invoice for revenue
        test_invoice = Invoice(
            id=uuid4(),
            invoice_number="INV-PROFIT-001",
            customer_id=self.test_customer.id,
            total_amount=Decimal('2000.00'),
            paid_amount=Decimal('2000.00'),
            remaining_amount=Decimal('0.00'),
            gold_price_per_gram=Decimal('60.00'),
            status='paid'
        )
        self.db.add(test_invoice)
        
        # Create invoice item
        invoice_item = InvoiceItem(
            id=uuid4(),
            invoice_id=test_invoice.id,
            inventory_item_id=self.test_item.id,
            quantity=2,
            unit_price=Decimal('1000.00'),
            total_price=Decimal('2000.00'),
            weight_grams=Decimal('21.0')
        )
        self.db.add(invoice_item)
        
        # Create expense for cost calculation
        expense = AccountingEntry(
            id=uuid4(),
            entry_type="expense",
            category="inventory_purchase",
            amount=Decimal('800.00'),
            description="Gold purchase for analysis"
        )
        self.db.add(expense)
        self.db.commit()
        
        # Test profit loss analysis
        response = client.get(
            f"/accounting/profit-loss-analysis?start_date={start_date}&end_date={end_date}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_revenue" in data
        assert "total_expenses" in data
        assert "gross_profit" in data
        assert "net_profit" in data
        assert "profit_margin" in data
        assert "top_performing_categories" in data
        assert "revenue_breakdown" in data
        assert "expense_breakdown" in data
        
        # Verify calculations
        assert data["total_revenue"] >= 2000.00
        assert data["total_expenses"] >= 800.00
        assert data["gross_profit"] == data["total_revenue"] - data["total_expenses"]

    def test_debt_tracking_system(self):
        """Test comprehensive debt tracking with customer integration"""
        # Update customer with debt
        self.test_customer.current_debt = Decimal('1500.00')
        self.test_customer.last_purchase_date = datetime.utcnow()
        
        # Create another customer with debt
        customer_with_debt = Customer(
            id=uuid4(),
            name="Debtor Customer",
            phone="9876543210",
            current_debt=Decimal('2500.00')
        )
        self.db.add(customer_with_debt)
        
        # Create invoices for debt tracking
        invoice1 = Invoice(
            id=uuid4(),
            invoice_number="INV-DEBT-001",
            customer_id=self.test_customer.id,
            total_amount=Decimal('1500.00'),
            paid_amount=Decimal('0.00'),
            remaining_amount=Decimal('1500.00'),
            gold_price_per_gram=Decimal('60.00'),
            status='unpaid'
        )
        self.db.add(invoice1)
        
        # Create payment history
        payment = Payment(
            id=uuid4(),
            customer_id=self.test_customer.id,
            amount=Decimal('500.00'),
            payment_method='cash',
            description='Partial payment'
        )
        self.db.add(payment)
        self.db.commit()
        
        # Test debt tracking
        response = client.get("/accounting/debt-tracking", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        
        # Find test customer in debt tracking
        test_customer_debt = next(
            entry for entry in data if entry["customer_name"] == "Test Customer"
        )
        assert test_customer_debt["total_debt"] == 1500.00
        assert test_customer_debt["total_invoices"] >= 1
        assert test_customer_debt["payment_history_count"] >= 1
        assert test_customer_debt["customer_phone"] == "1234567890"

    def test_debt_tracking_filtering(self):
        """Test debt tracking with filtering options"""
        # Create customers with different debt levels
        customers_data = [
            ("Low Debt Customer", Decimal('100.00')),
            ("Medium Debt Customer", Decimal('1000.00')),
            ("High Debt Customer", Decimal('5000.00'))
        ]
        
        for name, debt in customers_data:
            customer = Customer(
                id=uuid4(),
                name=name,
                current_debt=debt
            )
            self.db.add(customer)
        
        self.db.commit()
        
        # Test minimum debt filter
        response = client.get("/accounting/debt-tracking?min_debt=1000", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        for entry in data:
            assert entry["total_debt"] >= 1000.00
        
        # Test maximum debt filter
        response = client.get("/accounting/debt-tracking?max_debt=2000", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        for entry in data:
            assert entry["total_debt"] <= 2000.00
        
        # Test customer name filter
        response = client.get("/accounting/debt-tracking?customer_name=High", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert any("High" in entry["customer_name"] for entry in data)

    def test_ledger_summary_dashboard(self):
        """Test comprehensive ledger summary for dashboard"""
        # Create comprehensive test data
        # Invoice for income
        test_invoice = Invoice(
            id=uuid4(),
            invoice_number="INV-SUMMARY-001",
            customer_id=self.test_customer.id,
            total_amount=Decimal('3000.00'),
            paid_amount=Decimal('3000.00'),
            remaining_amount=Decimal('0.00'),
            gold_price_per_gram=Decimal('60.00'),
            status='paid'
        )
        self.db.add(test_invoice)
        
        # Expense
        expense = AccountingEntry(
            id=uuid4(),
            entry_type="expense",
            category="store_expenses",
            amount=Decimal('1000.00'),
            description="Store expenses for summary"
        )
        self.db.add(expense)
        
        # Update customer debt
        self.test_customer.current_debt = Decimal('500.00')
        
        # Update inventory for gold weight calculation
        self.test_item.stock_quantity = 20
        self.test_item.weight_grams = Decimal('15.0')
        
        self.db.commit()
        
        # Test ledger summary
        response = client.get("/accounting/ledger-summary", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "total_income" in data
        assert "total_expenses" in data
        assert "total_cash_flow" in data
        assert "total_gold_weight" in data
        assert "total_customer_debt" in data
        assert "net_profit" in data
        
        # Verify calculations
        assert data["total_income"] >= 3000.00
        assert data["total_expenses"] >= 1000.00
        assert data["total_cash_flow"] == data["total_income"] - data["total_expenses"]
        assert data["total_gold_weight"] >= 300.0  # 20 * 15.0
        assert data["total_customer_debt"] >= 500.00

    def test_automatic_ledger_updates_invoice_created(self):
        """Test automatic ledger updates when invoice is created"""
        # Create invoice for automatic update test
        test_invoice = Invoice(
            id=uuid4(),
            invoice_number="INV-AUTO-001",
            customer_id=self.test_customer.id,
            total_amount=Decimal('1500.00'),
            paid_amount=Decimal('0.00'),
            remaining_amount=Decimal('1500.00'),
            gold_price_per_gram=Decimal('60.00'),
            status='pending'
        )
        self.db.add(test_invoice)
        
        # Create invoice item
        invoice_item = InvoiceItem(
            id=uuid4(),
            invoice_id=test_invoice.id,
            inventory_item_id=self.test_item.id,
            quantity=1,
            unit_price=Decimal('1500.00'),
            total_price=Decimal('1500.00'),
            weight_grams=Decimal('10.5')
        )
        self.db.add(invoice_item)
        self.db.commit()
        
        # Test automatic ledger update
        response = client.post(
            f"/accounting/auto-update/invoice-created?invoice_id={test_invoice.id}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Ledgers updated for invoice creation"
        
        # Verify gold weight ledger entry was created
        gold_entries = self.db.query(AccountingEntry).filter(
            AccountingEntry.entry_type == "gold_weight",
            AccountingEntry.reference_id == test_invoice.id
        ).all()
        assert len(gold_entries) >= 1
        assert float(gold_entries[0].weight_grams) == -10.5  # Negative for outgoing

    def test_automatic_ledger_updates_payment_received(self):
        """Test automatic ledger updates when payment is received"""
        # Create payment for automatic update test
        test_payment = Payment(
            id=uuid4(),
            customer_id=self.test_customer.id,
            amount=Decimal('750.00'),
            payment_method='bank',
            description='Bank transfer payment'
        )
        self.db.add(test_payment)
        self.db.commit()
        
        # Test automatic ledger update
        response = client.post(
            f"/accounting/auto-update/payment-received?payment_id={test_payment.id}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Ledgers updated for payment"

    def test_automatic_ledger_updates_inventory_purchased(self):
        """Test automatic ledger updates when inventory is purchased"""
        # Test automatic ledger update for inventory purchase
        response = client.post(
            f"/accounting/auto-update/inventory-purchased?item_id={self.test_item.id}&weight_grams=25.5&purchase_cost=1200.00",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Ledgers updated for inventory purchase"
        
        # Verify expense entry was created
        expense_entries = self.db.query(AccountingEntry).filter(
            AccountingEntry.entry_type == "expense",
            AccountingEntry.reference_id == self.test_item.id,
            AccountingEntry.category == "inventory_purchase"
        ).all()
        assert len(expense_entries) >= 1
        assert float(expense_entries[0].amount) == 1200.00
        
        # Verify gold weight entry was created
        gold_entries = self.db.query(AccountingEntry).filter(
            AccountingEntry.entry_type == "gold_weight",
            AccountingEntry.reference_id == self.test_item.id,
            AccountingEntry.reference_type == "inventory_purchase"
        ).all()
        assert len(gold_entries) >= 1
        assert float(gold_entries[0].weight_grams) == 25.5

    def test_ledger_synchronization_across_modules(self):
        """Test that ledger synchronization works across all modules"""
        # Create a complete business transaction flow
        
        # 1. Create invoice (should update income ledger and gold weight ledger)
        test_invoice = Invoice(
            id=uuid4(),
            invoice_number="INV-SYNC-001",
            customer_id=self.test_customer.id,
            total_amount=Decimal('2000.00'),
            paid_amount=Decimal('1000.00'),
            remaining_amount=Decimal('1000.00'),
            gold_price_per_gram=Decimal('60.00'),
            status='partial'
        )
        self.db.add(test_invoice)
        
        invoice_item = InvoiceItem(
            id=uuid4(),
            invoice_id=test_invoice.id,
            inventory_item_id=self.test_item.id,
            quantity=2,
            unit_price=Decimal('1000.00'),
            total_price=Decimal('2000.00'),
            weight_grams=Decimal('21.0')
        )
        self.db.add(invoice_item)
        
        # 2. Create payment (should update cash/bank ledger)
        payment = Payment(
            id=uuid4(),
            customer_id=self.test_customer.id,
            invoice_id=test_invoice.id,
            amount=Decimal('1000.00'),
            payment_method='cash',
            description='Partial payment for invoice'
        )
        self.db.add(payment)
        
        # 3. Update customer debt
        self.test_customer.current_debt = Decimal('1000.00')
        
        self.db.commit()
        
        # Trigger automatic updates
        client.post(
            f"/accounting/auto-update/invoice-created?invoice_id={test_invoice.id}",
            headers=self.headers
        )
        client.post(
            f"/accounting/auto-update/payment-received?payment_id={payment.id}",
            headers=self.headers
        )
        
        # Verify synchronization across all ledgers
        
        # Check income ledger
        income_response = client.get("/accounting/income-ledger", headers=self.headers)
        income_data = income_response.json()
        sync_invoice = next(
            inv for inv in income_data if inv["invoice_number"] == "INV-SYNC-001"
        )
        assert sync_invoice["payment_status"] == "partial"
        assert sync_invoice["paid_amount"] == 1000.00
        
        # Check cash/bank ledger
        cash_response = client.get("/accounting/cash-bank-ledger", headers=self.headers)
        cash_data = cash_response.json()
        cash_entries = [entry for entry in cash_data if entry["transaction_type"] == "cash_in"]
        assert any(entry["amount"] == 1000.00 for entry in cash_entries)
        
        # Check gold weight ledger
        gold_response = client.get("/accounting/gold-weight-ledger", headers=self.headers)
        gold_data = gold_response.json()
        sale_entries = [entry for entry in gold_data if entry["transaction_type"] == "sale"]
        assert any(entry["weight_grams"] == 21.0 for entry in sale_entries)
        
        # Check debt tracking
        debt_response = client.get("/accounting/debt-tracking", headers=self.headers)
        debt_data = debt_response.json()
        customer_debt = next(
            entry for entry in debt_data if entry["customer_name"] == "Test Customer"
        )
        assert customer_debt["total_debt"] == 1000.00

    def test_profit_calculations_accuracy(self):
        """Test accuracy of profit calculations with complex scenarios"""
        # Create multiple invoices with different profit margins
        invoices_data = [
            ("INV-PROFIT-A", Decimal('1000.00'), Decimal('1000.00'), Decimal('10.00'), Decimal('15.00')),
            ("INV-PROFIT-B", Decimal('2000.00'), Decimal('2000.00'), Decimal('12.00'), Decimal('20.00')),
            ("INV-PROFIT-C", Decimal('1500.00'), Decimal('1500.00'), Decimal('8.00'), Decimal('18.00'))
        ]
        
        total_revenue = Decimal('0.00')
        for inv_num, total, paid, labor, profit in invoices_data:
            invoice = Invoice(
                id=uuid4(),
                invoice_number=inv_num,
                customer_id=self.test_customer.id,
                total_amount=total,
                paid_amount=paid,
                remaining_amount=Decimal('0.00'),
                gold_price_per_gram=Decimal('60.00'),
                labor_cost_percentage=labor,
                profit_percentage=profit,
                status='paid'
            )
            self.db.add(invoice)
            total_revenue += paid
        
        # Create corresponding expenses
        expenses_data = [
            ("inventory_purchase", Decimal('3000.00')),
            ("store_rent", Decimal('800.00')),
            ("utilities", Decimal('300.00'))
        ]
        
        total_expenses = Decimal('0.00')
        for category, amount in expenses_data:
            expense = AccountingEntry(
                id=uuid4(),
                entry_type="expense",
                category=category,
                amount=amount,
                description=f"Test expense: {category}"
            )
            self.db.add(expense)
            total_expenses += amount
        
        self.db.commit()
        
        # Test profit analysis
        start_date = date.today() - timedelta(days=1)
        end_date = date.today() + timedelta(days=1)
        
        response = client.get(
            f"/accounting/profit-loss-analysis?start_date={start_date}&end_date={end_date}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify profit calculations
        expected_gross_profit = float(total_revenue - total_expenses)
        assert abs(data["gross_profit"] - expected_gross_profit) < 0.01
        
        # Verify profit margin calculation
        expected_margin = (expected_gross_profit / float(total_revenue)) * 100
        assert abs(data["profit_margin"] - expected_margin) < 0.01

    def test_error_handling_invalid_requests(self):
        """Test error handling for invalid accounting requests"""
        # Test invalid invoice ID for automatic update
        invalid_uuid = str(uuid4())
        response = client.post(
            f"/accounting/auto-update/invoice-created?invoice_id={invalid_uuid}",
            headers=self.headers
        )
        assert response.status_code == 404
        
        # Test invalid payment ID for automatic update
        response = client.post(
            f"/accounting/auto-update/payment-received?payment_id={invalid_uuid}",
            headers=self.headers
        )
        assert response.status_code == 404
        
        # Test invalid inventory item ID for purchase update
        response = client.post(
            f"/accounting/auto-update/inventory-purchased?item_id={invalid_uuid}&weight_grams=10&purchase_cost=500",
            headers=self.headers
        )
        assert response.status_code == 404

    def test_date_filtering_accuracy(self):
        """Test accuracy of date filtering across all ledgers"""
        # Create entries with specific dates
        past_date = datetime.utcnow() - timedelta(days=10)
        recent_date = datetime.utcnow() - timedelta(days=2)
        
        # Create old invoice
        old_invoice = Invoice(
            id=uuid4(),
            invoice_number="INV-OLD-001",
            customer_id=self.test_customer.id,
            total_amount=Decimal('1000.00'),
            paid_amount=Decimal('1000.00'),
            remaining_amount=Decimal('0.00'),
            gold_price_per_gram=Decimal('60.00'),
            status='paid',
            created_at=past_date
        )
        self.db.add(old_invoice)
        
        # Create recent invoice
        recent_invoice = Invoice(
            id=uuid4(),
            invoice_number="INV-RECENT-001",
            customer_id=self.test_customer.id,
            total_amount=Decimal('1500.00'),
            paid_amount=Decimal('1500.00'),
            remaining_amount=Decimal('0.00'),
            gold_price_per_gram=Decimal('60.00'),
            status='paid',
            created_at=recent_date
        )
        self.db.add(recent_invoice)
        
        self.db.commit()
        
        # Test date filtering on income ledger
        filter_date = (datetime.utcnow() - timedelta(days=5)).date()
        response = client.get(
            f"/accounting/income-ledger?start_date={filter_date}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should only include recent invoice
        invoice_numbers = [inv["invoice_number"] for inv in data]
        assert "INV-RECENT-001" in invoice_numbers
        assert "INV-OLD-001" not in invoice_numbers

if __name__ == "__main__":
    pytest.main([__file__, "-v"])