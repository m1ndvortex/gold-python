"""
Comprehensive unit tests for all database models using real PostgreSQL in Docker.
Tests model relationships, constraints, and data validation with actual database operations.
"""

import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
import os

from models import (
    Base, User, Role, Category, InventoryItem, Customer, 
    Invoice, InvoiceItem, AccountingEntry, CompanySettings
)


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
def sample_role(db_session):
    """Create a sample role for testing"""
    # Try to find existing role first, or create new one with unique name
    import time
    unique_name = f"test_role_{int(time.time() * 1000000)}"
    
    role = Role(
        name=unique_name,
        description="Test role for unit tests",
        permissions={"view_inventory": True, "edit_inventory": False}
    )
    db_session.add(role)
    db_session.commit()
    return role


@pytest.fixture
def sample_user(db_session, sample_role):
    """Create a sample user for testing"""
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash="hashed_password",
        role_id=sample_role.id
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def sample_category(db_session):
    """Create a sample category for testing"""
    category = Category(
        name="Gold Rings",
        description="Various gold rings"
    )
    db_session.add(category)
    db_session.commit()
    return category


@pytest.fixture
def sample_inventory_item(db_session, sample_category):
    """Create a sample inventory item for testing"""
    item = InventoryItem(
        name="Gold Ring 18K",
        category_id=sample_category.id,
        weight_grams=Decimal("5.500"),
        purchase_price=Decimal("1000.00"),
        sell_price=Decimal("1200.00"),
        stock_quantity=10,
        min_stock_level=2,
        description="Beautiful 18K gold ring"
    )
    db_session.add(item)
    db_session.commit()
    return item


@pytest.fixture
def sample_customer(db_session):
    """Create a sample customer for testing"""
    customer = Customer(
        name="John Doe",
        phone="+1234567890",
        email="john@example.com",
        address="123 Main St",
        total_purchases=Decimal("5000.00"),
        current_debt=Decimal("500.00")
    )
    db_session.add(customer)
    db_session.commit()
    return customer


class TestRole:
    """Test Role model"""
    
    def test_create_role(self, db_session):
        """Test creating a role with JSONB permissions"""
        permissions = {
            "view_inventory": True,
            "edit_inventory": True,
            "delete_inventory": False,
            "view_reports": True
        }
        
        role = Role(
            name="manager",
            description="Manager role with specific permissions",
            permissions=permissions
        )
        
        db_session.add(role)
        db_session.commit()
        
        # Verify the role was created
        assert role.id is not None
        assert role.name == "manager"
        assert role.permissions == permissions
        assert role.created_at is not None
    
    def test_role_unique_name_constraint(self, db_session, sample_role):
        """Test that role names must be unique"""
        duplicate_role = Role(
            name=sample_role.name,  # Same name as existing role
            description="Duplicate role"
        )
        
        db_session.add(duplicate_role)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_role_user_relationship(self, db_session, sample_role, sample_user):
        """Test the relationship between roles and users"""
        assert sample_user in sample_role.users
        assert sample_user.role == sample_role


class TestUser:
    """Test User model"""
    
    def test_create_user(self, db_session, sample_role):
        """Test creating a user"""
        user = User(
            username="newuser",
            email="newuser@example.com",
            password_hash="hashed_password_123",
            role_id=sample_role.id,
            is_active=True
        )
        
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.username == "newuser"
        assert user.email == "newuser@example.com"
        assert user.is_active is True
        assert user.role_id == sample_role.id
        assert user.created_at is not None
        assert user.updated_at is not None
    
    def test_user_unique_constraints(self, db_session, sample_user):
        """Test that username and email must be unique"""
        # Test duplicate username
        duplicate_username_user = User(
            username=sample_user.username,
            email="different@example.com",
            password_hash="password"
        )
        
        db_session.add(duplicate_username_user)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Test duplicate email
        duplicate_email_user = User(
            username="differentuser",
            email=sample_user.email,
            password_hash="password"
        )
        
        db_session.add(duplicate_email_user)
        
        with pytest.raises(IntegrityError):
            db_session.commit()


class TestCategory:
    """Test Category model"""
    
    def test_create_category(self, db_session):
        """Test creating a category"""
        category = Category(
            name="Necklaces",
            description="Gold and silver necklaces"
        )
        
        db_session.add(category)
        db_session.commit()
        
        assert category.id is not None
        assert category.name == "Necklaces"
        assert category.description == "Gold and silver necklaces"
        assert category.created_at is not None
    
    def test_category_hierarchy(self, db_session):
        """Test parent-child relationship in categories"""
        parent_category = Category(name="Jewelry")
        db_session.add(parent_category)
        db_session.commit()
        
        child_category = Category(
            name="Rings",
            parent_id=parent_category.id,
            description="All types of rings"
        )
        db_session.add(child_category)
        db_session.commit()
        
        assert child_category.parent == parent_category
        assert child_category in parent_category.children
    
    def test_category_inventory_relationship(self, db_session, sample_category, sample_inventory_item):
        """Test relationship between categories and inventory items"""
        assert sample_inventory_item in sample_category.inventory_items
        assert sample_inventory_item.category == sample_category


class TestInventoryItem:
    """Test InventoryItem model"""
    
    def test_create_inventory_item(self, db_session, sample_category):
        """Test creating an inventory item"""
        item = InventoryItem(
            name="Gold Bracelet",
            category_id=sample_category.id,
            weight_grams=Decimal("12.750"),
            purchase_price=Decimal("2500.00"),
            sell_price=Decimal("3000.00"),
            stock_quantity=5,
            min_stock_level=1,
            description="Elegant gold bracelet",
            image_url="https://example.com/bracelet.jpg",
            is_active=True
        )
        
        db_session.add(item)
        db_session.commit()
        
        assert item.id is not None
        assert item.name == "Gold Bracelet"
        assert item.weight_grams == Decimal("12.750")
        assert item.purchase_price == Decimal("2500.00")
        assert item.sell_price == Decimal("3000.00")
        assert item.stock_quantity == 5
        assert item.is_active is True
        assert item.created_at is not None
        assert item.updated_at is not None
    
    def test_inventory_item_decimal_precision(self, db_session, sample_category):
        """Test decimal precision for weights and prices"""
        item = InventoryItem(
            name="Precision Test Item",
            category_id=sample_category.id,
            weight_grams=Decimal("1.234"),  # 3 decimal places
            purchase_price=Decimal("999.99"),  # 2 decimal places
            sell_price=Decimal("1234.56"),  # 2 decimal places
            stock_quantity=1
        )
        
        db_session.add(item)
        db_session.commit()
        
        # Verify precision is maintained
        assert item.weight_grams == Decimal("1.234")
        assert item.purchase_price == Decimal("999.99")
        assert item.sell_price == Decimal("1234.56")
    
    def test_inventory_item_indexes(self, db_session, test_engine):
        """Test that indexes are created properly"""
        # This test verifies that the indexes defined in the model are created
        inspector = test_engine.dialect.get_indexes(test_engine.connect(), "inventory_items")
        index_names = [idx['name'] for idx in inspector]
        
        expected_indexes = [
            'idx_inventory_items_category',
            'idx_inventory_items_active',
            'idx_inventory_items_stock'
        ]
        
        for expected_index in expected_indexes:
            assert expected_index in index_names


class TestCustomer:
    """Test Customer model"""
    
    def test_create_customer(self, db_session):
        """Test creating a customer"""
        customer = Customer(
            name="Jane Smith",
            phone="+9876543210",
            email="jane@example.com",
            address="456 Oak Ave",
            total_purchases=Decimal("10000.00"),
            current_debt=Decimal("1500.00")
        )
        
        db_session.add(customer)
        db_session.commit()
        
        assert customer.id is not None
        assert customer.name == "Jane Smith"
        assert customer.phone == "+9876543210"
        assert customer.total_purchases == Decimal("10000.00")
        assert customer.current_debt == Decimal("1500.00")
        assert customer.created_at is not None
        assert customer.updated_at is not None
    
    def test_customer_optional_fields(self, db_session):
        """Test creating customer with only required fields"""
        customer = Customer(name="Minimal Customer")
        
        db_session.add(customer)
        db_session.commit()
        
        assert customer.id is not None
        assert customer.name == "Minimal Customer"
        assert customer.phone is None
        assert customer.email is None
        assert customer.address is None
        assert customer.total_purchases == Decimal("0")
        assert customer.current_debt == Decimal("0")
    
    def test_customer_indexes(self, db_session, test_engine):
        """Test that customer indexes are created properly"""
        inspector = test_engine.dialect.get_indexes(test_engine.connect(), "customers")
        index_names = [idx['name'] for idx in inspector]
        
        expected_indexes = ['idx_customers_debt', 'idx_customers_phone']
        
        for expected_index in expected_indexes:
            assert expected_index in index_names


class TestInvoice:
    """Test Invoice model"""
    
    def test_create_invoice(self, db_session, sample_customer):
        """Test creating an invoice"""
        invoice = Invoice(
            invoice_number="INV-2024-001",
            customer_id=sample_customer.id,
            total_amount=Decimal("2400.00"),
            paid_amount=Decimal("1000.00"),
            remaining_amount=Decimal("1400.00"),
            gold_price_per_gram=Decimal("75.50"),
            labor_cost_percentage=Decimal("15.00"),
            profit_percentage=Decimal("20.00"),
            vat_percentage=Decimal("10.00"),
            status="partial"
        )
        
        db_session.add(invoice)
        db_session.commit()
        
        assert invoice.id is not None
        assert invoice.invoice_number == "INV-2024-001"
        assert invoice.customer_id == sample_customer.id
        assert invoice.total_amount == Decimal("2400.00")
        assert invoice.remaining_amount == Decimal("1400.00")
        assert invoice.gold_price_per_gram == Decimal("75.50")
        assert invoice.status == "partial"
        assert invoice.created_at is not None
    
    def test_invoice_unique_number(self, db_session, sample_customer):
        """Test that invoice numbers must be unique"""
        invoice1 = Invoice(
            invoice_number="INV-DUPLICATE",
            customer_id=sample_customer.id,
            total_amount=Decimal("1000.00"),
            remaining_amount=Decimal("1000.00"),
            gold_price_per_gram=Decimal("70.00")
        )
        
        invoice2 = Invoice(
            invoice_number="INV-DUPLICATE",  # Same number
            customer_id=sample_customer.id,
            total_amount=Decimal("2000.00"),
            remaining_amount=Decimal("2000.00"),
            gold_price_per_gram=Decimal("70.00")
        )
        
        db_session.add(invoice1)
        db_session.commit()
        
        db_session.add(invoice2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_invoice_customer_relationship(self, db_session, sample_customer):
        """Test relationship between invoices and customers"""
        invoice = Invoice(
            invoice_number="INV-REL-001",
            customer_id=sample_customer.id,
            total_amount=Decimal("1000.00"),
            remaining_amount=Decimal("1000.00"),
            gold_price_per_gram=Decimal("70.00")
        )
        
        db_session.add(invoice)
        db_session.commit()
        
        assert invoice.customer == sample_customer
        assert invoice in sample_customer.invoices


class TestInvoiceItem:
    """Test InvoiceItem model"""
    
    def test_create_invoice_item(self, db_session, sample_customer, sample_inventory_item):
        """Test creating an invoice item"""
        # First create an invoice
        invoice = Invoice(
            invoice_number="INV-ITEM-001",
            customer_id=sample_customer.id,
            total_amount=Decimal("1200.00"),
            remaining_amount=Decimal("1200.00"),
            gold_price_per_gram=Decimal("70.00")
        )
        db_session.add(invoice)
        db_session.commit()
        
        # Create invoice item
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            inventory_item_id=sample_inventory_item.id,
            quantity=1,
            unit_price=Decimal("1200.00"),
            total_price=Decimal("1200.00"),
            weight_grams=Decimal("5.500")
        )
        
        db_session.add(invoice_item)
        db_session.commit()
        
        assert invoice_item.id is not None
        assert invoice_item.invoice_id == invoice.id
        assert invoice_item.inventory_item_id == sample_inventory_item.id
        assert invoice_item.quantity == 1
        assert invoice_item.total_price == Decimal("1200.00")
        assert invoice_item.weight_grams == Decimal("5.500")
    
    def test_invoice_item_relationships(self, db_session, sample_customer, sample_inventory_item):
        """Test relationships between invoice items, invoices, and inventory items"""
        invoice = Invoice(
            invoice_number="INV-REL-002",
            customer_id=sample_customer.id,
            total_amount=Decimal("1200.00"),
            remaining_amount=Decimal("1200.00"),
            gold_price_per_gram=Decimal("70.00")
        )
        db_session.add(invoice)
        db_session.commit()
        
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            inventory_item_id=sample_inventory_item.id,
            quantity=1,
            unit_price=Decimal("1200.00"),
            total_price=Decimal("1200.00"),
            weight_grams=Decimal("5.500")
        )
        db_session.add(invoice_item)
        db_session.commit()
        
        # Test relationships
        assert invoice_item.invoice == invoice
        assert invoice_item.inventory_item == sample_inventory_item
        assert invoice_item in invoice.invoice_items
        assert invoice_item in sample_inventory_item.invoice_items


class TestAccountingEntry:
    """Test AccountingEntry model"""
    
    def test_create_accounting_entry(self, db_session):
        """Test creating an accounting entry"""
        entry = AccountingEntry(
            entry_type="income",
            category="sales",
            amount=Decimal("1500.00"),
            weight_grams=Decimal("7.250"),
            description="Sale of gold ring",
            reference_id=uuid.uuid4(),
            reference_type="invoice",
            transaction_date=datetime.now(timezone.utc)
        )
        
        db_session.add(entry)
        db_session.commit()
        
        assert entry.id is not None
        assert entry.entry_type == "income"
        assert entry.category == "sales"
        assert entry.amount == Decimal("1500.00")
        assert entry.weight_grams == Decimal("7.250")
        assert entry.description == "Sale of gold ring"
        assert entry.reference_type == "invoice"
        assert entry.created_at is not None
    
    def test_accounting_entry_types(self, db_session):
        """Test different types of accounting entries"""
        entry_types = [
            ("income", "sales", Decimal("1000.00"), None),
            ("expense", "purchase", Decimal("800.00"), None),
            ("cash", "payment", Decimal("500.00"), None),
            ("bank", "deposit", Decimal("2000.00"), None),
            ("gold_weight", "inventory", None, Decimal("10.500"))
        ]
        
        for entry_type, category, amount, weight in entry_types:
            entry = AccountingEntry(
                entry_type=entry_type,
                category=category,
                amount=amount,
                weight_grams=weight,
                description=f"Test {entry_type} entry"
            )
            db_session.add(entry)
        
        db_session.commit()
        
        # Verify all entries were created
        entries = db_session.query(AccountingEntry).all()
        assert len(entries) >= len(entry_types)
    
    def test_accounting_entry_indexes(self, db_session, test_engine):
        """Test that accounting entry indexes are created properly"""
        inspector = test_engine.dialect.get_indexes(test_engine.connect(), "accounting_entries")
        index_names = [idx['name'] for idx in inspector]
        
        expected_indexes = [
            'idx_accounting_entries_type_date',
            'idx_accounting_entries_reference'
        ]
        
        for expected_index in expected_indexes:
            assert expected_index in index_names


class TestCompanySettings:
    """Test CompanySettings model"""
    
    def test_create_company_settings(self, db_session):
        """Test creating company settings"""
        template_config = {
            "logo_position": "top-left",
            "font_family": "Arial",
            "font_size": 12,
            "colors": {
                "primary": "#000000",
                "secondary": "#666666"
            },
            "fields": ["company_name", "address", "phone"]
        }
        
        settings = CompanySettings(
            company_name="Gold Shop LLC",
            company_logo_url="https://example.com/logo.png",
            company_address="123 Gold Street, City, State",
            default_gold_price=Decimal("75.50"),
            default_labor_percentage=Decimal("15.00"),
            default_profit_percentage=Decimal("20.00"),
            default_vat_percentage=Decimal("10.00"),
            invoice_template=template_config
        )
        
        db_session.add(settings)
        db_session.commit()
        
        assert settings.id is not None
        assert settings.company_name == "Gold Shop LLC"
        assert settings.default_gold_price == Decimal("75.50")
        assert settings.default_labor_percentage == Decimal("15.00")
        assert settings.invoice_template == template_config
        assert settings.updated_at is not None
    
    def test_company_settings_jsonb_operations(self, db_session):
        """Test JSONB operations on invoice template"""
        template_config = {
            "layout": "standard",
            "sections": {
                "header": {"show": True, "height": 100},
                "items": {"show": True, "columns": ["name", "quantity", "price"]},
                "footer": {"show": True, "text": "Thank you for your business"}
            }
        }
        
        settings = CompanySettings(
            company_name="Test Company",
            invoice_template=template_config
        )
        
        db_session.add(settings)
        db_session.commit()
        
        # Test JSONB field access
        assert settings.invoice_template["layout"] == "standard"
        assert settings.invoice_template["sections"]["header"]["show"] is True
        assert "name" in settings.invoice_template["sections"]["items"]["columns"]


class TestModelIntegration:
    """Test integration between different models"""
    
    def test_complete_business_workflow(self, db_session):
        """Test a complete business workflow involving multiple models"""
        # Create role and user
        role = Role(name="cashier", permissions={"create_invoice": True})
        db_session.add(role)
        db_session.commit()
        
        user = User(
            username="cashier1",
            email="cashier@goldshop.com",
            password_hash="hashed",
            role_id=role.id
        )
        db_session.add(user)
        db_session.commit()
        
        # Create category and inventory item
        category = Category(name="Rings")
        db_session.add(category)
        db_session.commit()
        
        inventory_item = InventoryItem(
            name="Gold Ring 22K",
            category_id=category.id,
            weight_grams=Decimal("8.000"),
            purchase_price=Decimal("1500.00"),
            sell_price=Decimal("1800.00"),
            stock_quantity=5
        )
        db_session.add(inventory_item)
        db_session.commit()
        
        # Create customer
        customer = Customer(
            name="Alice Johnson",
            phone="+1111111111",
            email="alice@example.com"
        )
        db_session.add(customer)
        db_session.commit()
        
        # Create invoice
        invoice = Invoice(
            invoice_number="INV-WORKFLOW-001",
            customer_id=customer.id,
            total_amount=Decimal("1800.00"),
            paid_amount=Decimal("1000.00"),
            remaining_amount=Decimal("800.00"),
            gold_price_per_gram=Decimal("80.00")
        )
        db_session.add(invoice)
        db_session.commit()
        
        # Create invoice item
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            inventory_item_id=inventory_item.id,
            quantity=1,
            unit_price=Decimal("1800.00"),
            total_price=Decimal("1800.00"),
            weight_grams=Decimal("8.000")
        )
        db_session.add(invoice_item)
        db_session.commit()
        
        # Create accounting entry
        accounting_entry = AccountingEntry(
            entry_type="income",
            category="sales",
            amount=Decimal("1000.00"),
            description="Partial payment for gold ring",
            reference_id=invoice.id,
            reference_type="invoice"
        )
        db_session.add(accounting_entry)
        db_session.commit()
        
        # Verify all relationships work
        assert user.role == role
        assert inventory_item.category == category
        assert invoice.customer == customer
        assert invoice_item.invoice == invoice
        assert invoice_item.inventory_item == inventory_item
        
        # Verify data integrity
        assert customer.invoices[0] == invoice
        assert invoice.invoice_items[0] == invoice_item
        assert inventory_item.invoice_items[0] == invoice_item
        
        print("✅ Complete business workflow test passed!")