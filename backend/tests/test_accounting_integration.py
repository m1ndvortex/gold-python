"""
Integration tests for accounting system with real database operations.
Tests the automatic ledger updates and module interconnectivity.
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from main import app
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
        session.close()

@pytest.fixture
def auth_headers(db_session):
    """Create authentication headers for API requests"""
    # Get or create a test user
    test_user = db_session.query(User).first()
    if not test_user:
        # Create a test role if none exists
        test_role = Role(
            id=uuid4(),
            name="test_admin",
            description="Test admin role",
            permissions={"accounting": ["read", "write"]}
        )
        db_session.add(test_role)
        db_session.flush()
        
        # Create a test user
        test_user = User(
            id=uuid4(),
            username="test_admin",
            email="admin@test.com",
            password_hash="hashed_password",
            role_id=test_role.id,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(test_user.id), "username": test_user.username}
    )
    return {"Authorization": f"Bearer {access_token}"}

class TestAccountingIntegration:
    """Integration tests for accounting system"""
    
    def test_ledger_summary_with_real_data(self, auth_headers, db_session):
        """Test that ledger summary works with real database data"""
        response = client.get("/accounting/ledger-summary", headers=auth_headers)
        assert response.status_code == 200
        
        summary = response.json()
        
        # Verify all required fields are present
        required_fields = [
            "total_income", "total_expenses", "total_cash_flow",
            "total_gold_weight", "total_customer_debt", "net_profit"
        ]
        
        for field in required_fields:
            assert field in summary
            assert isinstance(summary[field], (int, float))
        
        # Verify calculations make sense
        expected_cash_flow = summary["total_income"] - summary["total_expenses"]
        assert abs(summary["total_cash_flow"] - expected_cash_flow) < 0.01
        
        print(f"✓ Ledger Summary: Income={summary['total_income']}, Expenses={summary['total_expenses']}, Cash Flow={summary['total_cash_flow']}")

    def test_income_ledger_reflects_invoices(self, auth_headers, db_session):
        """Test that income ledger correctly reflects invoice data"""
        # Get actual invoice count from database
        invoice_count = db_session.query(Invoice).count()
        
        # Get income ledger
        response = client.get("/accounting/income-ledger", headers=auth_headers)
        assert response.status_code == 200
        
        income_entries = response.json()
        
        # Should have entries equal to invoice count
        assert len(income_entries) == invoice_count
        
        # Verify each entry has correct structure
        for entry in income_entries:
            assert "invoice_number" in entry
            assert "customer_name" in entry
            assert "total_amount" in entry
            assert "paid_amount" in entry
            assert "remaining_amount" in entry
            assert "payment_status" in entry
            
            # Verify payment status logic
            if entry["remaining_amount"] == 0:
                assert entry["payment_status"] == "paid"
            elif entry["paid_amount"] > 0:
                assert entry["payment_status"] == "partial"
            else:
                assert entry["payment_status"] == "unpaid"
        
        print(f"✓ Income Ledger: {len(income_entries)} entries match {invoice_count} invoices")

    def test_debt_tracking_reflects_customers(self, auth_headers, db_session):
        """Test that debt tracking correctly reflects customer debt"""
        # Get customers with debt from database
        customers_with_debt = db_session.query(Customer).filter(Customer.current_debt > 0).all()
        
        # Get debt tracking
        response = client.get("/accounting/debt-tracking", headers=auth_headers)
        assert response.status_code == 200
        
        debt_entries = response.json()
        
        # Should have entries for customers with debt
        assert len(debt_entries) == len(customers_with_debt)
        
        # Verify debt amounts match
        for entry in debt_entries:
            customer = db_session.query(Customer).filter(Customer.id == entry["customer_id"]).first()
            assert customer is not None
            assert float(customer.current_debt) == entry["total_debt"]
        
        print(f"✓ Debt Tracking: {len(debt_entries)} entries for customers with debt")

    def test_expense_creation_and_retrieval(self, auth_headers):
        """Test creating and retrieving expense entries"""
        # Create expense entry
        expense_data = {
            "category": "integration_test",
            "amount": 250.00,
            "description": "Integration test expense"
        }
        
        create_response = client.post("/accounting/expense-ledger", json=expense_data, headers=auth_headers)
        assert create_response.status_code == 200
        
        created_expense = create_response.json()
        assert created_expense["category"] == "integration_test"
        assert created_expense["amount"] == 250.00
        
        # Retrieve and verify
        retrieve_response = client.get("/accounting/expense-ledger?category=integration_test", headers=auth_headers)
        assert retrieve_response.status_code == 200
        
        expenses = retrieve_response.json()
        integration_expenses = [exp for exp in expenses if exp["category"] == "integration_test"]
        assert len(integration_expenses) >= 1
        
        print(f"✓ Expense Creation: Created and retrieved expense entry")

    def test_cash_bank_ledger_includes_payments(self, auth_headers, db_session):
        """Test that cash/bank ledger includes payment data"""
        # Get payment count from database
        payment_count = db_session.query(Payment).count()
        
        # Get cash/bank ledger
        response = client.get("/accounting/cash-bank-ledger", headers=auth_headers)
        assert response.status_code == 200
        
        cash_entries = response.json()
        
        # Should have entries for payments (cash inflows)
        cash_inflows = [entry for entry in cash_entries if entry["transaction_type"] in ["cash_in", "bank_deposit"]]
        
        # Should have at least as many inflows as payments
        assert len(cash_inflows) >= payment_count
        
        print(f"✓ Cash/Bank Ledger: {len(cash_inflows)} inflow entries for {payment_count} payments")

    def test_profit_loss_analysis_calculations(self, auth_headers, db_session):
        """Test profit/loss analysis calculations"""
        start_date = (datetime.now() - timedelta(days=30)).date()
        end_date = datetime.now().date()
        
        response = client.get(
            f"/accounting/profit-loss-analysis?start_date={start_date}&end_date={end_date}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        analysis = response.json()
        
        # Verify calculation accuracy
        assert analysis["gross_profit"] == analysis["total_revenue"] - analysis["total_expenses"]
        
        # Verify profit margin calculation
        if analysis["total_revenue"] > 0:
            expected_margin = (analysis["gross_profit"] / analysis["total_revenue"]) * 100
            assert abs(analysis["profit_margin"] - expected_margin) < 0.01
        
        # Verify data structure
        assert isinstance(analysis["top_performing_categories"], list)
        assert isinstance(analysis["revenue_breakdown"], dict)
        assert isinstance(analysis["expense_breakdown"], dict)
        
        print(f"✓ Profit/Loss Analysis: Revenue={analysis['total_revenue']}, Profit={analysis['gross_profit']}, Margin={analysis['profit_margin']:.2f}%")

    def test_automatic_ledger_update_endpoints(self, auth_headers, db_session):
        """Test automatic ledger update endpoints with real data"""
        # Get an existing invoice for testing
        existing_invoice = db_session.query(Invoice).first()
        
        if existing_invoice:
            # Test invoice created update
            response = client.post(
                f"/accounting/auto-update/invoice-created?invoice_id={existing_invoice.id}",
                headers=auth_headers
            )
            assert response.status_code == 200
            
            result = response.json()
            assert "message" in result
            assert "Ledgers updated" in result["message"]
            
            print(f"✓ Automatic Update: Invoice created update successful")
        
        # Get an existing payment for testing
        existing_payment = db_session.query(Payment).first()
        
        if existing_payment:
            # Test payment received update
            response = client.post(
                f"/accounting/auto-update/payment-received?payment_id={existing_payment.id}",
                headers=auth_headers
            )
            assert response.status_code == 200
            
            result = response.json()
            assert "message" in result
            assert "Ledgers updated" in result["message"]
            
            print(f"✓ Automatic Update: Payment received update successful")

    def test_ledger_filtering_functionality(self, auth_headers):
        """Test filtering functionality across ledgers"""
        # Test income ledger filtering
        response = client.get("/accounting/income-ledger?payment_status=paid", headers=auth_headers)
        assert response.status_code == 200
        paid_invoices = response.json()
        
        for invoice in paid_invoices:
            assert invoice["payment_status"] == "paid"
        
        # Test date range filtering
        start_date = (datetime.now() - timedelta(days=7)).date()
        end_date = datetime.now().date()
        
        response = client.get(
            f"/accounting/expense-ledger?start_date={start_date}&end_date={end_date}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        print(f"✓ Filtering: Payment status and date range filters working")

    def test_data_consistency_across_modules(self, auth_headers, db_session):
        """Test data consistency between accounting and other modules"""
        # Get ledger summary
        summary_response = client.get("/accounting/ledger-summary", headers=auth_headers)
        assert summary_response.status_code == 200
        summary = summary_response.json()
        
        # Get actual customer debt from database
        actual_debt = db_session.query(Customer.current_debt).filter(Customer.current_debt > 0).all()
        total_actual_debt = sum(float(debt[0]) for debt in actual_debt)
        
        # Verify consistency
        assert abs(summary["total_customer_debt"] - total_actual_debt) < 0.01
        
        # Get actual invoice totals
        paid_invoices = db_session.query(Invoice.paid_amount).all()
        total_paid = sum(float(amount[0]) for amount in paid_invoices)
        
        # Should be close to total income (may have some variance due to timing)
        income_variance = abs(summary["total_income"] - total_paid)
        assert income_variance < (total_paid * 0.1)  # Allow 10% variance
        
        print(f"✓ Data Consistency: Customer debt and invoice totals match across modules")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])