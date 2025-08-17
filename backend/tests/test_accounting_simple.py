"""
Simplified accounting system tests that work with existing data in real PostgreSQL database.
Tests core accounting functionality without requiring clean database state.
"""

import pytest
from datetime import datetime, date, timedelta
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

class TestAccountingSystemSimple:
    """Simplified accounting system tests"""
    
    def test_accounting_endpoints_accessible(self, auth_headers):
        """Test that all accounting endpoints are accessible"""
        endpoints = [
            "/accounting/income-ledger",
            "/accounting/expense-ledger", 
            "/accounting/cash-bank-ledger",
            "/accounting/gold-weight-ledger",
            "/accounting/debt-tracking",
            "/accounting/ledger-summary"
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint, headers=auth_headers)
            assert response.status_code == 200, f"Endpoint {endpoint} failed with status {response.status_code}"
            data = response.json()
            assert isinstance(data, (list, dict)), f"Endpoint {endpoint} returned invalid data type"

    def test_income_ledger_structure(self, auth_headers):
        """Test income ledger returns correct data structure"""
        response = client.get("/accounting/income-ledger", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            entry = data[0]
            required_fields = [
                "id", "invoice_id", "invoice_number", "customer_name",
                "total_amount", "paid_amount", "remaining_amount", 
                "payment_status", "transaction_date", "category"
            ]
            for field in required_fields:
                assert field in entry, f"Missing field {field} in income ledger entry"

    def test_expense_ledger_create_and_retrieve(self, auth_headers):
        """Test creating expense entry and retrieving it"""
        # Create expense entry
        expense_data = {
            "category": "test_expense",
            "amount": 100.00,
            "description": "Test expense for accounting system"
        }
        
        create_response = client.post("/accounting/expense-ledger", json=expense_data, headers=auth_headers)
        assert create_response.status_code == 200
        created_entry = create_response.json()
        
        # Verify created entry structure
        assert created_entry["category"] == "test_expense"
        assert created_entry["amount"] == 100.00
        assert created_entry["description"] == "Test expense for accounting system"
        assert "id" in created_entry
        assert "transaction_date" in created_entry
        
        # Retrieve expense ledger and verify entry exists
        retrieve_response = client.get("/accounting/expense-ledger", headers=auth_headers)
        assert retrieve_response.status_code == 200
        expenses = retrieve_response.json()
        
        # Find our created expense
        test_expenses = [exp for exp in expenses if exp["category"] == "test_expense"]
        assert len(test_expenses) >= 1, "Created expense not found in ledger"

    def test_cash_bank_ledger_structure(self, auth_headers):
        """Test cash and bank ledger returns correct structure"""
        response = client.get("/accounting/cash-bank-ledger", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            entry = data[0]
            required_fields = [
                "id", "transaction_type", "amount", "description", 
                "payment_method", "transaction_date"
            ]
            for field in required_fields:
                assert field in entry, f"Missing field {field} in cash/bank ledger entry"

    def test_gold_weight_ledger_structure(self, auth_headers):
        """Test gold weight ledger returns correct structure"""
        response = client.get("/accounting/gold-weight-ledger", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            entry = data[0]
            required_fields = [
                "id", "transaction_type", "weight_grams", "description", 
                "transaction_date"
            ]
            for field in required_fields:
                assert field in entry, f"Missing field {field} in gold weight ledger entry"

    def test_profit_loss_analysis_structure(self, auth_headers):
        """Test profit and loss analysis returns correct structure"""
        start_date = (datetime.now() - timedelta(days=30)).date()
        end_date = datetime.now().date()
        
        response = client.get(
            f"/accounting/profit-loss-analysis?start_date={start_date}&end_date={end_date}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        required_fields = [
            "period_start", "period_end", "total_revenue", "total_expenses",
            "gross_profit", "net_profit", "profit_margin", "top_performing_categories",
            "revenue_breakdown", "expense_breakdown"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field {field} in profit/loss analysis"
        
        # Verify data types
        assert isinstance(data["total_revenue"], (int, float))
        assert isinstance(data["total_expenses"], (int, float))
        assert isinstance(data["gross_profit"], (int, float))
        assert isinstance(data["net_profit"], (int, float))
        assert isinstance(data["profit_margin"], (int, float))
        assert isinstance(data["top_performing_categories"], list)
        assert isinstance(data["revenue_breakdown"], dict)
        assert isinstance(data["expense_breakdown"], dict)

    def test_debt_tracking_structure(self, auth_headers):
        """Test debt tracking returns correct structure"""
        response = client.get("/accounting/debt-tracking", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            entry = data[0]
            required_fields = [
                "customer_id", "customer_name", "total_debt", "total_invoices",
                "payment_history_count"
            ]
            for field in required_fields:
                assert field in entry, f"Missing field {field} in debt tracking entry"

    def test_ledger_summary_structure(self, auth_headers):
        """Test ledger summary returns correct structure"""
        response = client.get("/accounting/ledger-summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        required_fields = [
            "total_income", "total_expenses", "total_cash_flow",
            "total_gold_weight", "total_customer_debt", "net_profit"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field {field} in ledger summary"
            assert isinstance(data[field], (int, float)), f"Field {field} should be numeric"

    def test_automatic_ledger_updates_endpoints_exist(self, auth_headers):
        """Test that automatic ledger update endpoints exist and handle invalid IDs properly"""
        invalid_uuid = str(uuid4())
        
        # Test invoice created update with invalid ID
        response = client.post(
            f"/accounting/auto-update/invoice-created?invoice_id={invalid_uuid}",
            headers=auth_headers
        )
        assert response.status_code == 404  # Should return 404 for non-existent invoice
        
        # Test payment received update with invalid ID
        response = client.post(
            f"/accounting/auto-update/payment-received?payment_id={invalid_uuid}",
            headers=auth_headers
        )
        assert response.status_code == 404  # Should return 404 for non-existent payment
        
        # Test inventory purchased update with invalid ID
        response = client.post(
            f"/accounting/auto-update/inventory-purchased?item_id={invalid_uuid}&weight_grams=10&purchase_cost=500",
            headers=auth_headers
        )
        assert response.status_code == 404  # Should return 404 for non-existent item

    def test_ledger_filtering_functionality(self, auth_headers):
        """Test that ledger filtering works correctly"""
        # Test income ledger filtering by payment status
        response = client.get("/accounting/income-ledger?payment_status=paid", headers=auth_headers)
        assert response.status_code == 200
        paid_invoices = response.json()
        
        # Verify all returned invoices are paid
        for invoice in paid_invoices:
            assert invoice["payment_status"] == "paid"
        
        # Test expense ledger filtering by category
        response = client.get("/accounting/expense-ledger?category=test_expense", headers=auth_headers)
        assert response.status_code == 200
        test_expenses = response.json()
        
        # Verify all returned expenses have the correct category
        for expense in test_expenses:
            assert expense["category"] == "test_expense"

    def test_date_range_filtering(self, auth_headers):
        """Test date range filtering across ledgers"""
        start_date = (datetime.now() - timedelta(days=7)).date()
        end_date = datetime.now().date()
        
        # Test income ledger with date range
        response = client.get(
            f"/accounting/income-ledger?start_date={start_date}&end_date={end_date}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Test expense ledger with date range
        response = client.get(
            f"/accounting/expense-ledger?start_date={start_date}&end_date={end_date}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Test cash/bank ledger with date range
        response = client.get(
            f"/accounting/cash-bank-ledger?start_date={start_date}&end_date={end_date}",
            headers=auth_headers
        )
        assert response.status_code == 200

    def test_accounting_integration_with_real_data(self, auth_headers, db_session):
        """Test accounting system integration with real database data"""
        # Get actual invoice count
        invoice_count = db_session.query(Invoice).count()
        
        # Get actual customer count with debt
        customer_debt_count = db_session.query(Customer).filter(Customer.current_debt > 0).count()
        
        # Get actual accounting entries count
        accounting_entries_count = db_session.query(AccountingEntry).count()
        
        # Test that ledger summary reflects real data
        response = client.get("/accounting/ledger-summary", headers=auth_headers)
        assert response.status_code == 200
        summary = response.json()
        
        # Verify summary contains reasonable data
        assert isinstance(summary["total_income"], (int, float))
        assert isinstance(summary["total_expenses"], (int, float))
        assert isinstance(summary["total_customer_debt"], (int, float))
        
        # Test that debt tracking reflects real customers
        response = client.get("/accounting/debt-tracking", headers=auth_headers)
        assert response.status_code == 200
        debt_data = response.json()
        
        # Should have same or fewer entries than customers with debt
        assert len(debt_data) <= customer_debt_count

if __name__ == "__main__":
    pytest.main([__file__, "-v"])