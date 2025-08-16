"""
Unit tests for customer management API endpoints
Tests run in Docker environment with real PostgreSQL database
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from decimal import Decimal
import uuid
import os

from main import app
from database import get_db
from models import Customer, Payment, Invoice, User, Role
from auth import get_password_hash, create_access_token
from schemas import CustomerCreate, PaymentCreate

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

@pytest.fixture
def test_user_token(db_session):
    """Create a test user with customer management permissions and return JWT token"""
    # Create a role with customer permissions using unique name
    import time
    unique_name = f"test_manager_{int(time.time() * 1000000)}"
    unique_username = f"test_customer_manager_{int(time.time() * 1000000)}"
    unique_email = f"test_{int(time.time() * 1000000)}@example.com"
    
    role = Role(
        id=uuid.uuid4(),
        name=unique_name,
        description="Test role with customer permissions",
        permissions={
            "view_customers": True,
            "manage_customers": True,
            "manage_payments": True
        }
    )
    db_session.add(role)
    
    # Create a test user
    user = User(
        id=uuid.uuid4(),
        username=unique_username,
        email=unique_email,
        password_hash=get_password_hash("testpass"),
        role_id=role.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    # Create JWT token
    token_data = {"sub": str(user.id)}
    token = create_access_token(token_data)
    return f"Bearer {token}"

@pytest.fixture
def sample_customer(db_session):
    """Create a sample customer for testing"""
    customer = Customer(
        id=uuid.uuid4(),
        name="John Doe",
        phone="+1234567890",
        email="john@example.com",
        address="123 Main St",
        total_purchases=Decimal("1000.00"),
        current_debt=Decimal("500.00")
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)
    return customer

@pytest.fixture
def sample_invoice(db_session, sample_customer):
    """Create a sample invoice for testing payments"""
    import time
    unique_id = int(time.time() * 1000000)
    invoice = Invoice(
        id=uuid.uuid4(),
        invoice_number=f"INV-{unique_id}",
        customer_id=sample_customer.id,
        total_amount=Decimal("1000.00"),
        paid_amount=Decimal("0.00"),
        remaining_amount=Decimal("1000.00"),
        gold_price_per_gram=Decimal("50.00"),
        status="pending"
    )
    db_session.add(invoice)
    db_session.commit()
    db_session.refresh(invoice)
    return invoice

class TestCustomerCRUD:
    """Test customer CRUD operations"""
    
    def test_create_customer_success(self, db_session: Session, test_user_token: str):
        """Test successful customer creation"""
        import time
        unique_id = int(time.time() * 1000000)
        customer_data = {
            "name": "Jane Smith",
            "phone": f"+1987654{unique_id % 10000}",
            "email": f"jane{unique_id}@example.com",
            "address": "456 Oak Ave"
        }
        
        response = client.post(
            "/customers/",
            json=customer_data,
            headers={"Authorization": test_user_token}
        )
        
        if response.status_code != 200:
            print(f"Error response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == customer_data["name"]
        assert data["phone"] == customer_data["phone"]
        assert data["email"] == customer_data["email"]
        assert data["address"] == customer_data["address"]
        assert data["total_purchases"] == 0.0
        assert data["current_debt"] == 0.0
        assert "id" in data
        assert "created_at" in data
        
        # Verify in database
        customer = db_session.query(Customer).filter(Customer.id == data["id"]).first()
        assert customer is not None
        assert customer.name == customer_data["name"]
    
    def test_create_customer_duplicate_phone(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test customer creation with duplicate phone number"""
        customer_data = {
            "name": "Different Name",
            "phone": sample_customer.phone,  # Same phone as existing customer
            "email": "different@example.com"
        }
        
        response = client.post(
            "/customers/",
            json=customer_data,
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 400
        assert "phone number already exists" in response.json()["detail"]
    
    def test_create_customer_duplicate_email(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test customer creation with duplicate email"""
        customer_data = {
            "name": "Different Name",
            "phone": "+1111111111",
            "email": sample_customer.email  # Same email as existing customer
        }
        
        response = client.post(
            "/customers/",
            json=customer_data,
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 400
        assert "email already exists" in response.json()["detail"]
    
    def test_get_customers_list(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test getting customers list"""
        response = client.get(
            "/customers/",
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Find our sample customer
        customer_found = False
        for customer in data:
            if customer["id"] == str(sample_customer.id):
                customer_found = True
                assert customer["name"] == sample_customer.name
                assert customer["phone"] == sample_customer.phone
                break
        
        assert customer_found
    
    def test_get_customers_with_filters(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test getting customers with various filters"""
        # Test name filter
        response = client.get(
            f"/customers/?name={sample_customer.name[:4]}",
            headers={"Authorization": test_user_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(customer["id"] == str(sample_customer.id) for customer in data)
        
        # Test debt filter
        response = client.get(
            "/customers/?has_debt=true",
            headers={"Authorization": test_user_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert all(customer["current_debt"] > 0 for customer in data)
        
        # Test min debt filter
        response = client.get(
            "/customers/?min_debt=400",
            headers={"Authorization": test_user_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert all(customer["current_debt"] >= 400 for customer in data)
    
    def test_search_customers(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test customer search functionality"""
        # Search by name
        response = client.get(
            f"/customers/search?q={sample_customer.name[:4]}",
            headers={"Authorization": test_user_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(customer["id"] == str(sample_customer.id) for customer in data)
        
        # Search by phone
        response = client.get(
            f"/customers/search?q={sample_customer.phone[-4:]}",
            headers={"Authorization": test_user_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
    
    def test_get_customer_by_id(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test getting customer by ID"""
        response = client.get(
            f"/customers/{sample_customer.id}",
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(sample_customer.id)
        assert data["name"] == sample_customer.name
        assert data["phone"] == sample_customer.phone
        assert data["email"] == sample_customer.email
        assert "payments" in data  # Should include payments by default
    
    def test_get_customer_not_found(self, db_session: Session, test_user_token: str):
        """Test getting non-existent customer"""
        fake_id = uuid.uuid4()
        response = client.get(
            f"/customers/{fake_id}",
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 404
        assert "Customer not found" in response.json()["detail"]
    
    def test_update_customer(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test updating customer information"""
        update_data = {
            "name": "John Updated",
            "address": "Updated Address"
        }
        
        response = client.put(
            f"/customers/{sample_customer.id}",
            json=update_data,
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["address"] == update_data["address"]
        assert data["phone"] == sample_customer.phone  # Unchanged
        
        # Verify in database
        db_session.refresh(sample_customer)
        assert sample_customer.name == update_data["name"]
        assert sample_customer.address == update_data["address"]
    
    def test_update_customer_duplicate_phone(self, db_session: Session, test_user_token: str):
        """Test updating customer with duplicate phone"""
        # Create two customers
        customer1 = Customer(
            id=uuid.uuid4(),
            name="Customer 1",
            phone="+1111111111",
            email="customer1@example.com"
        )
        customer2 = Customer(
            id=uuid.uuid4(),
            name="Customer 2",
            phone="+2222222222",
            email="customer2@example.com"
        )
        db_session.add_all([customer1, customer2])
        db_session.commit()
        
        # Try to update customer2 with customer1's phone
        update_data = {"phone": customer1.phone}
        
        response = client.put(
            f"/customers/{customer2.id}",
            json=update_data,
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 400
        assert "phone number already exists" in response.json()["detail"]
    
    def test_delete_customer_success(self, db_session: Session, test_user_token: str):
        """Test successful customer deletion"""
        # Create a customer with no invoices or payments
        customer = Customer(
            id=uuid.uuid4(),
            name="Delete Me",
            phone="+9999999999",
            email="delete@example.com"
        )
        db_session.add(customer)
        db_session.commit()
        
        response = client.delete(
            f"/customers/{customer.id}",
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]
        
        # Verify deletion in database
        deleted_customer = db_session.query(Customer).filter(Customer.id == customer.id).first()
        assert deleted_customer is None
    
    def test_delete_customer_with_invoices(self, db_session: Session, test_user_token: str, sample_customer: Customer, sample_invoice: Invoice):
        """Test deleting customer with existing invoices"""
        response = client.delete(
            f"/customers/{sample_customer.id}",
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 400
        assert "existing invoices" in response.json()["detail"]

class TestCustomerDebtTracking:
    """Test customer debt tracking functionality"""
    
    def test_get_debt_summary(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test getting customer debt summary"""
        # Add some payments to the customer
        payment1 = Payment(
            id=uuid.uuid4(),
            customer_id=sample_customer.id,
            amount=Decimal("200.00"),
            payment_method="cash",
            description="Test payment 1"
        )
        payment2 = Payment(
            id=uuid.uuid4(),
            customer_id=sample_customer.id,
            amount=Decimal("150.00"),
            payment_method="bank",
            description="Test payment 2"
        )
        db_session.add_all([payment1, payment2])
        db_session.commit()
        
        response = client.get(
            "/customers/debt-summary",
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Find our customer in the summary
        customer_summary = None
        for summary in data:
            if summary["customer_id"] == str(sample_customer.id):
                customer_summary = summary
                break
        
        assert customer_summary is not None
        assert customer_summary["customer_name"] == sample_customer.name
        assert customer_summary["total_debt"] == float(sample_customer.current_debt)
        assert customer_summary["total_payments"] == 350.0  # 200 + 150
        assert customer_summary["payment_count"] == 2
    
    def test_get_debt_history(self, db_session: Session, test_user_token: str, sample_customer: Customer, sample_invoice: Invoice):
        """Test getting customer debt history"""
        # Add a payment
        payment = Payment(
            id=uuid.uuid4(),
            customer_id=sample_customer.id,
            invoice_id=sample_invoice.id,
            amount=Decimal("300.00"),
            payment_method="cash",
            description="Partial payment"
        )
        db_session.add(payment)
        db_session.commit()
        
        response = client.get(
            f"/customers/{sample_customer.id}/debt-history",
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["customer_id"] == str(sample_customer.id)
        assert data["current_debt"] == float(sample_customer.current_debt)
        assert "debt_history" in data
        
        debt_history = data["debt_history"]
        assert len(debt_history) >= 2  # At least invoice and payment
        
        # Check that we have both invoice and payment entries
        entry_types = [entry["type"] for entry in debt_history]
        assert "invoice" in entry_types
        assert "payment" in entry_types

class TestPaymentManagement:
    """Test payment management functionality"""
    
    def test_create_payment_success(self, db_session: Session, test_user_token: str, sample_customer: Customer, sample_invoice: Invoice):
        """Test successful payment creation"""
        payment_data = {
            "customer_id": str(sample_customer.id),
            "invoice_id": str(sample_invoice.id),
            "amount": 300.0,
            "payment_method": "cash",
            "description": "Partial payment for invoice"
        }
        
        # Get initial debt
        initial_debt = sample_customer.current_debt
        initial_paid = sample_invoice.paid_amount
        
        response = client.post(
            f"/customers/{sample_customer.id}/payments",
            json=payment_data,
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == payment_data["amount"]
        assert data["payment_method"] == payment_data["payment_method"]
        assert data["description"] == payment_data["description"]
        assert "id" in data
        assert "payment_date" in data
        
        # Verify debt reduction
        db_session.refresh(sample_customer)
        db_session.refresh(sample_invoice)
        
        assert sample_customer.current_debt == initial_debt - Decimal("300.00")
        assert sample_invoice.paid_amount == initial_paid + Decimal("300.00")
        assert sample_invoice.remaining_amount == sample_invoice.total_amount - sample_invoice.paid_amount
        assert sample_invoice.status == "partial"
    
    def test_create_payment_customer_mismatch(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test payment creation with customer ID mismatch"""
        different_customer_id = uuid.uuid4()
        payment_data = {
            "customer_id": str(different_customer_id),  # Different from URL
            "amount": 100.0,
            "payment_method": "cash"
        }
        
        response = client.post(
            f"/customers/{sample_customer.id}/payments",
            json=payment_data,
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 400
        assert "Customer ID mismatch" in response.json()["detail"]
    
    def test_create_payment_invalid_invoice(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test payment creation with invalid invoice ID"""
        fake_invoice_id = uuid.uuid4()
        payment_data = {
            "customer_id": str(sample_customer.id),
            "invoice_id": str(fake_invoice_id),
            "amount": 100.0,
            "payment_method": "cash"
        }
        
        response = client.post(
            f"/customers/{sample_customer.id}/payments",
            json=payment_data,
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 404
        assert "Invoice not found" in response.json()["detail"]
    
    def test_create_payment_without_invoice(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test creating general payment without specific invoice"""
        payment_data = {
            "customer_id": str(sample_customer.id),
            "amount": 200.0,
            "payment_method": "bank",
            "description": "General payment"
        }
        
        initial_debt = sample_customer.current_debt
        
        response = client.post(
            f"/customers/{sample_customer.id}/payments",
            json=payment_data,
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["invoice_id"] is None
        
        # Verify debt reduction
        db_session.refresh(sample_customer)
        assert sample_customer.current_debt == initial_debt - Decimal("200.00")
    
    def test_get_customer_payments(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test getting customer payment history"""
        # Create multiple payments
        payments = []
        for i in range(3):
            payment = Payment(
                id=uuid.uuid4(),
                customer_id=sample_customer.id,
                amount=Decimal(f"{100 + i * 50}.00"),
                payment_method="cash",
                description=f"Payment {i + 1}"
            )
            payments.append(payment)
            db_session.add(payment)
        
        db_session.commit()
        
        response = client.get(
            f"/customers/{sample_customer.id}/payments",
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3
        
        # Verify payments are sorted by date (newest first)
        payment_dates = [payment["payment_date"] for payment in data]
        assert payment_dates == sorted(payment_dates, reverse=True)
    
    def test_payment_fully_pays_invoice(self, db_session: Session, test_user_token: str, sample_customer: Customer, sample_invoice: Invoice):
        """Test payment that fully pays an invoice"""
        payment_data = {
            "customer_id": str(sample_customer.id),
            "invoice_id": str(sample_invoice.id),
            "amount": float(sample_invoice.remaining_amount),  # Pay full amount
            "payment_method": "cash",
            "description": "Full payment"
        }
        
        response = client.post(
            f"/customers/{sample_customer.id}/payments",
            json=payment_data,
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        
        # Verify invoice is marked as paid
        db_session.refresh(sample_invoice)
        assert sample_invoice.remaining_amount == 0
        assert sample_invoice.status == "paid"

class TestCustomerSearchAndFiltering:
    """Test customer search and filtering functionality"""
    
    def test_advanced_filtering(self, db_session: Session, test_user_token: str):
        """Test advanced customer filtering"""
        # Create customers with different debt levels
        customers = [
            Customer(
                id=uuid.uuid4(),
                name="High Debt Customer",
                phone="+1111111111",
                current_debt=Decimal("1000.00")
            ),
            Customer(
                id=uuid.uuid4(),
                name="Low Debt Customer", 
                phone="+2222222222",
                current_debt=Decimal("50.00")
            ),
            Customer(
                id=uuid.uuid4(),
                name="No Debt Customer",
                phone="+3333333333",
                current_debt=Decimal("0.00")
            )
        ]
        
        for customer in customers:
            db_session.add(customer)
        db_session.commit()
        
        # Test filtering by debt range
        response = client.get(
            "/customers/?min_debt=100&max_debt=2000",
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only return high debt customer
        assert len(data) >= 1
        for customer in data:
            assert 100 <= customer["current_debt"] <= 2000
    
    def test_sorting_functionality(self, db_session: Session, test_user_token: str):
        """Test customer sorting functionality"""
        response = client.get(
            "/customers/?sort_by=current_debt&sort_order=desc",
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 1:
            # Verify descending order by debt
            for i in range(len(data) - 1):
                assert data[i]["current_debt"] >= data[i + 1]["current_debt"]
    
    def test_pagination(self, db_session: Session, test_user_token: str):
        """Test customer list pagination"""
        response = client.get(
            "/customers/?skip=0&limit=2",
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 2

class TestCustomerPermissions:
    """Test customer management permissions"""
    
    def test_unauthorized_access(self, db_session: Session):
        """Test accessing customer endpoints without authentication"""
        response = client.get("/customers/")
        assert response.status_code == 401
    
    def test_insufficient_permissions(self, db_session: Session):
        """Test accessing customer endpoints with insufficient permissions"""
        # Create user with limited permissions
        role = Role(
            id=uuid.uuid4(),
            name="Limited Role",
            description="Role without customer permissions",
            permissions={"view_dashboard": True}  # No customer permissions
        )
        db_session.add(role)
        
        user = User(
            id=uuid.uuid4(),
            username="limited_user",
            email="limited@example.com",
            password_hash=get_password_hash("testpass"),
            role_id=role.id,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        
        # Create token for limited user
        token_data = {"sub": str(user.id)}
        token = create_access_token(token_data)
        
        response = client.get(
            "/customers/",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 403
        assert "Permission" in response.json()["detail"]

class TestDataIntegrity:
    """Test data integrity and business logic"""
    
    def test_debt_calculation_accuracy(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test that debt calculations are accurate"""
        initial_debt = sample_customer.current_debt
        
        # Make multiple payments
        payment_amounts = [Decimal("100.00"), Decimal("150.00"), Decimal("75.00")]
        total_payments = sum(payment_amounts)
        
        for i, amount in enumerate(payment_amounts):
            payment_data = {
                "customer_id": str(sample_customer.id),
                "amount": float(amount),
                "payment_method": "cash",
                "description": f"Payment {i + 1}"
            }
            
            response = client.post(
                f"/customers/{sample_customer.id}/payments",
                json=payment_data,
                headers={"Authorization": test_user_token}
            )
            assert response.status_code == 200
        
        # Verify final debt
        db_session.refresh(sample_customer)
        expected_debt = max(Decimal("0.00"), initial_debt - total_payments)
        assert sample_customer.current_debt == expected_debt
    
    def test_negative_debt_prevention(self, db_session: Session, test_user_token: str, sample_customer: Customer):
        """Test that debt cannot go negative"""
        # Try to pay more than the debt
        overpayment_amount = float(sample_customer.current_debt) + 100.0
        
        payment_data = {
            "customer_id": str(sample_customer.id),
            "amount": overpayment_amount,
            "payment_method": "cash",
            "description": "Overpayment test"
        }
        
        response = client.post(
            f"/customers/{sample_customer.id}/payments",
            json=payment_data,
            headers={"Authorization": test_user_token}
        )
        
        assert response.status_code == 200
        
        # Verify debt is zero, not negative
        db_session.refresh(sample_customer)
        assert sample_customer.current_debt == Decimal("0.00")