"""
Comprehensive Unit Tests for Universal Dual Invoice System
Tests both Gold and General invoice types with real PostgreSQL database in Docker
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from decimal import Decimal
import uuid
from datetime import datetime, timedelta

from main import app
from database import get_db, Base
import models_universal as models
import schemas_universal as schemas

# Test database URL (using Docker PostgreSQL)
TEST_DATABASE_URL = "postgresql://goldshop_user:goldshop_password@db:5432/goldshop"

# Create test engine and session
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_database():
    """Setup test database and create tables"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    """Create a fresh database session for each test"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def sample_category(db_session):
    """Create a sample category for testing"""
    category = models.UniversalCategory(
        name="Gold Jewelry",
        name_persian="جواهرات طلا",
        path="gold_jewelry",
        level=0,
        business_type="gold_shop",
        is_active=True
    )
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category

@pytest.fixture
def sample_inventory_item(db_session, sample_category):
    """Create a sample inventory item for testing"""
    item = models.UniversalInventoryItem(
        sku="GOLD-001",
        name="Gold Ring",
        name_persian="انگشتر طلا",
        category_id=sample_category.id,
        cost_price=Decimal('100.00'),
        sale_price=Decimal('150.00'),
        stock_quantity=Decimal('10'),
        unit_of_measure="piece",
        weight_grams=Decimal('5.5'),
        is_active=True
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item

@pytest.fixture
def sample_general_item(db_session, sample_category):
    """Create a sample general inventory item for testing"""
    item = models.UniversalInventoryItem(
        sku="GEN-001",
        name="Silver Bracelet",
        name_persian="دستبند نقره",
        category_id=sample_category.id,
        cost_price=Decimal('50.00'),
        sale_price=Decimal('75.00'),
        stock_quantity=Decimal('20'),
        unit_of_measure="piece",
        is_active=True
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item

class TestInvoiceTypeSelection:
    """Test invoice type selection and validation"""
    
    def test_create_gold_invoice_with_gold_fields(self, db_session, sample_inventory_item):
        """Test creating a gold invoice with proper gold fields"""
        invoice_data = {
            "type": "gold",
            "customer_name": "John Doe",
            "customer_phone": "+1234567890",
            "currency": "USD",
            "requires_approval": False,
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 2,
                    "unit_price": 0,  # Will be calculated
                    "weight_grams": 5.5
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 60.0,
                "labor_cost_percentage": 10.0,
                "profit_percentage": 15.0,
                "vat_percentage": 5.0
            }
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 200
        
        invoice = response.json()
        assert invoice["type"] == "gold"
        assert invoice["gold_price_per_gram"] == 60.0
        assert invoice["labor_cost_percentage"] == 10.0
        assert invoice["profit_percentage"] == 15.0
        assert invoice["vat_percentage"] == 5.0
        assert invoice["gold_total_weight"] == 11.0  # 5.5 * 2
        assert len(invoice["items"]) == 1
    
    def test_create_general_invoice_without_gold_fields(self, db_session, sample_general_item):
        """Test creating a general invoice without gold fields"""
        invoice_data = {
            "type": "general",
            "customer_name": "Jane Smith",
            "customer_phone": "+1234567891",
            "currency": "USD",
            "requires_approval": False,
            "items": [
                {
                    "inventory_item_id": str(sample_general_item.id),
                    "item_name": "Silver Bracelet",
                    "quantity": 3,
                    "unit_price": 75.0
                }
            ]
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 200
        
        invoice = response.json()
        assert invoice["type"] == "general"
        assert invoice["gold_price_per_gram"] is None
        assert invoice["total_amount"] == 225.0  # 75 * 3
        assert len(invoice["items"]) == 1
    
    def test_gold_invoice_without_gold_fields_fails(self, db_session, sample_inventory_item):
        """Test that gold invoice without gold fields fails validation"""
        invoice_data = {
            "type": "gold",
            "customer_name": "John Doe",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 100.0,
                    "weight_grams": 5.5
                }
            ]
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 400
        assert "Gold fields are required" in response.json()["detail"]
    
    def test_general_invoice_with_gold_fields_fails(self, db_session, sample_general_item):
        """Test that general invoice with gold fields fails validation"""
        invoice_data = {
            "type": "general",
            "customer_name": "Jane Smith",
            "items": [
                {
                    "inventory_item_id": str(sample_general_item.id),
                    "item_name": "Silver Bracelet",
                    "quantity": 1,
                    "unit_price": 75.0
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 60.0,
                "labor_cost_percentage": 10.0
            }
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 400
        assert "Gold fields should not be provided" in response.json()["detail"]

class TestConditionalFieldManagement:
    """Test conditional field management for Gold invoices"""
    
    def test_gold_invoice_conditional_fields_storage(self, db_session, sample_inventory_item):
        """Test that gold-specific fields are properly stored"""
        invoice_data = {
            "type": "gold",
            "customer_name": "Gold Customer",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 0,
                    "weight_grams": 10.0
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 50.0,
                "labor_cost_percentage": 12.0,
                "profit_percentage": 18.0,
                "vat_percentage": 8.0,
                "gold_sood": 90.0,
                "gold_ojrat": 60.0,
                "gold_maliyat": 40.0
            }
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 200
        
        invoice = response.json()
        assert invoice["gold_sood"] == 90.0
        assert invoice["gold_ojrat"] == 60.0
        assert invoice["gold_maliyat"] == 40.0
        assert invoice["gold_total_weight"] == 10.0
    
    def test_general_invoice_no_gold_fields_in_response(self, db_session, sample_general_item):
        """Test that general invoices don't have gold-specific fields in response"""
        invoice_data = {
            "type": "general",
            "customer_name": "General Customer",
            "items": [
                {
                    "inventory_item_id": str(sample_general_item.id),
                    "item_name": "Silver Bracelet",
                    "quantity": 2,
                    "unit_price": 75.0
                }
            ]
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 200
        
        invoice = response.json()
        assert invoice["gold_sood"] is None
        assert invoice["gold_ojrat"] is None
        assert invoice["gold_maliyat"] is None
        assert invoice["gold_price_per_gram"] is None

class TestInvoiceWorkflowEngine:
    """Test invoice workflow engine (draft → approved)"""
    
    def test_draft_to_approved_workflow_without_approval_required(self, db_session, sample_inventory_item):
        """Test automatic approval when approval is not required"""
        invoice_data = {
            "type": "gold",
            "customer_name": "Auto Approve Customer",
            "requires_approval": False,
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 0,
                    "weight_grams": 5.0
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 60.0,
                "labor_cost_percentage": 10.0,
                "profit_percentage": 15.0,
                "vat_percentage": 5.0
            }
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 200
        
        invoice = response.json()
        assert invoice["status"] == "approved"
        assert invoice["workflow_stage"] == "approved"
        assert invoice["stock_affected"] is True
        assert invoice["approved_at"] is not None
    
    def test_draft_workflow_with_approval_required(self, db_session, sample_inventory_item):
        """Test draft status when approval is required"""
        invoice_data = {
            "type": "gold",
            "customer_name": "Approval Required Customer",
            "requires_approval": True,
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 0,
                    "weight_grams": 5.0
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 60.0,
                "labor_cost_percentage": 10.0,
                "profit_percentage": 15.0,
                "vat_percentage": 5.0
            }
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 200
        
        invoice = response.json()
        assert invoice["status"] == "draft"
        assert invoice["workflow_stage"] == "draft"
        assert invoice["stock_affected"] is False
        assert invoice["approved_at"] is None
    
    def test_manual_invoice_approval(self, db_session, sample_inventory_item):
        """Test manual approval of draft invoice"""
        # First create a draft invoice
        invoice_data = {
            "type": "gold",
            "customer_name": "Manual Approval Customer",
            "requires_approval": True,
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 0,
                    "weight_grams": 5.0
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 60.0,
                "labor_cost_percentage": 10.0,
                "profit_percentage": 15.0,
                "vat_percentage": 5.0
            }
        }
        
        create_response = client.post("/universal-invoices/", json=invoice_data)
        assert create_response.status_code == 200
        invoice_id = create_response.json()["id"]
        
        # Now approve the invoice
        approval_data = {
            "approval_notes": "Approved by manager"
        }
        
        approve_response = client.put(f"/universal-invoices/{invoice_id}/approve", json=approval_data)
        assert approve_response.status_code == 200
        
        approved_invoice = approve_response.json()
        assert approved_invoice["status"] == "approved"
        assert approved_invoice["workflow_stage"] == "approved"
        assert approved_invoice["stock_affected"] is True
        assert approved_invoice["approval_notes"] == "Approved by manager"

class TestInventoryImpactControl:
    """Test automatic inventory deduction and restoration"""
    
    def test_inventory_deduction_on_approval(self, db_session, sample_inventory_item):
        """Test that inventory is deducted when invoice is approved"""
        initial_stock = sample_inventory_item.stock_quantity
        
        invoice_data = {
            "type": "general",
            "customer_name": "Stock Test Customer",
            "requires_approval": False,
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 3,
                    "unit_price": 150.0
                }
            ]
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 200
        
        # Check that stock was deducted
        db_session.refresh(sample_inventory_item)
        assert sample_inventory_item.stock_quantity == initial_stock - 3
    
    def test_inventory_restoration_on_deletion(self, db_session, sample_inventory_item):
        """Test that inventory is restored when invoice is deleted"""
        initial_stock = sample_inventory_item.stock_quantity
        
        # Create invoice
        invoice_data = {
            "type": "general",
            "customer_name": "Delete Test Customer",
            "requires_approval": False,
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 2,
                    "unit_price": 150.0
                }
            ]
        }
        
        create_response = client.post("/universal-invoices/", json=invoice_data)
        assert create_response.status_code == 200
        invoice_id = create_response.json()["id"]
        
        # Verify stock was deducted
        db_session.refresh(sample_inventory_item)
        assert sample_inventory_item.stock_quantity == initial_stock - 2
        
        # Delete invoice
        delete_response = client.delete(f"/universal-invoices/{invoice_id}")
        assert delete_response.status_code == 200
        
        # Verify stock was restored
        db_session.refresh(sample_inventory_item)
        assert sample_inventory_item.stock_quantity == initial_stock
    
    def test_inventory_restoration_on_cancellation(self, db_session, sample_inventory_item):
        """Test that inventory is restored when invoice is cancelled"""
        initial_stock = sample_inventory_item.stock_quantity
        
        # Create approved invoice
        invoice_data = {
            "type": "general",
            "customer_name": "Cancel Test Customer",
            "requires_approval": False,
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 150.0
                }
            ]
        }
        
        create_response = client.post("/universal-invoices/", json=invoice_data)
        assert create_response.status_code == 200
        invoice_id = create_response.json()["id"]
        
        # Verify stock was deducted
        db_session.refresh(sample_inventory_item)
        assert sample_inventory_item.stock_quantity == initial_stock - 1
        
        # Cancel invoice
        status_data = {"status": "cancelled"}
        cancel_response = client.put(f"/universal-invoices/{invoice_id}/status", json=status_data)
        assert cancel_response.status_code == 200
        
        # Verify stock was restored
        db_session.refresh(sample_inventory_item)
        assert sample_inventory_item.stock_quantity == initial_stock

class TestManualPriceOverride:
    """Test manual price override functionality"""
    
    def test_price_override_for_draft_invoice(self, db_session, sample_inventory_item):
        """Test overriding price for draft invoice item"""
        # Create draft invoice
        invoice_data = {
            "type": "general",
            "customer_name": "Price Override Customer",
            "requires_approval": True,
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 150.0
                }
            ]
        }
        
        create_response = client.post("/universal-invoices/", json=invoice_data)
        assert create_response.status_code == 200
        
        invoice = create_response.json()
        invoice_id = invoice["id"]
        item_id = invoice["items"][0]["id"]
        
        # Override price
        override_data = {
            "item_id": item_id,
            "override_price": 200.0,
            "reason": "Special customer discount"
        }
        
        override_response = client.put(
            f"/universal-invoices/{invoice_id}/items/{item_id}/price-override",
            json=override_data
        )
        assert override_response.status_code == 200
        
        override_result = override_response.json()
        assert override_result["original_price"] == 150.0
        assert override_result["override_price"] == 200.0
        assert override_result["price_difference"] == 50.0
        assert override_result["reason"] == "Special customer discount"
    
    def test_price_override_fails_for_approved_invoice(self, db_session, sample_inventory_item):
        """Test that price override fails for approved invoices"""
        # Create approved invoice
        invoice_data = {
            "type": "general",
            "customer_name": "Approved Invoice Customer",
            "requires_approval": False,
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 150.0
                }
            ]
        }
        
        create_response = client.post("/universal-invoices/", json=invoice_data)
        assert create_response.status_code == 200
        
        invoice = create_response.json()
        invoice_id = invoice["id"]
        item_id = invoice["items"][0]["id"]
        
        # Try to override price (should fail)
        override_data = {
            "item_id": item_id,
            "override_price": 200.0,
            "reason": "Should fail"
        }
        
        override_response = client.put(
            f"/universal-invoices/{invoice_id}/items/{item_id}/price-override",
            json=override_data
        )
        assert override_response.status_code == 400
        assert "draft invoices" in override_response.json()["detail"]

class TestInvoiceItemManagement:
    """Test comprehensive invoice item management with image support"""
    
    def test_invoice_item_snapshot_creation(self, db_session, sample_inventory_item):
        """Test that invoice items create proper snapshots of inventory data"""
        invoice_data = {
            "type": "general",
            "customer_name": "Snapshot Test Customer",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Custom Name Override",
                    "item_description": "Custom description",
                    "quantity": 1,
                    "unit_price": 150.0,
                    "custom_attributes": {"color": "gold", "size": "medium"},
                    "item_images": [{"url": "test-image.jpg", "alt": "Test image"}]
                }
            ]
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 200
        
        invoice = response.json()
        item = invoice["items"][0]
        
        assert item["item_name"] == "Custom Name Override"
        assert item["item_sku"] == sample_inventory_item.sku
        assert item["item_description"] == "Custom description"
        assert item["custom_attributes"]["color"] == "gold"
        assert len(item["item_images"]) == 1
        assert item["item_images"][0]["url"] == "test-image.jpg"
    
    def test_invoice_without_inventory_item(self, db_session):
        """Test creating invoice items without inventory reference"""
        invoice_data = {
            "type": "general",
            "customer_name": "No Inventory Customer",
            "items": [
                {
                    "item_name": "Custom Service",
                    "item_description": "One-time service",
                    "quantity": 1,
                    "unit_price": 100.0,
                    "unit_of_measure": "service"
                }
            ]
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 200
        
        invoice = response.json()
        item = invoice["items"][0]
        
        assert item["item_name"] == "Custom Service"
        assert item["inventory_item_id"] is None
        assert item["unit_of_measure"] == "service"
        assert item["total_price"] == 100.0

class TestInvoiceValidation:
    """Test invoice validation and business rules"""
    
    def test_insufficient_stock_validation(self, db_session, sample_inventory_item):
        """Test validation when requesting more stock than available"""
        invoice_data = {
            "type": "general",
            "customer_name": "Insufficient Stock Customer",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 999,  # More than available stock
                    "unit_price": 150.0
                }
            ]
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 400
        assert "Insufficient stock" in response.json()["detail"]
    
    def test_gold_invoice_weight_validation(self, db_session, sample_inventory_item):
        """Test that gold invoices require weight for items"""
        invoice_data = {
            "type": "gold",
            "customer_name": "Weight Validation Customer",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 0
                    # Missing weight_grams
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 60.0,
                "labor_cost_percentage": 10.0,
                "profit_percentage": 15.0,
                "vat_percentage": 5.0
            }
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 400
        assert "weight specified" in response.json()["detail"]
    
    def test_empty_items_validation(self, db_session):
        """Test validation when no items are provided"""
        invoice_data = {
            "type": "general",
            "customer_name": "No Items Customer",
            "items": []
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 400
        assert "at least one item" in response.json()["detail"]

class TestInvoiceCalculations:
    """Test invoice calculation accuracy"""
    
    def test_gold_invoice_calculation_accuracy(self, db_session, sample_inventory_item):
        """Test accurate calculation for gold invoices"""
        # Test calculation preview first
        invoice_data = {
            "type": "gold",
            "customer_name": "Calculation Test",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 2,
                    "unit_price": 0,
                    "weight_grams": 10.0
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 50.0,
                "labor_cost_percentage": 10.0,
                "profit_percentage": 20.0,
                "vat_percentage": 5.0
            }
        }
        
        calc_response = client.post("/universal-invoices/calculate", json=invoice_data)
        assert calc_response.status_code == 200
        
        calculation = calc_response.json()
        
        # Expected calculations:
        # Base price: 10.0 * 2 * 50.0 = 1000.0
        # Labor cost: 1000.0 * 0.10 = 100.0
        # Profit: (1000.0 + 100.0) * 0.20 = 220.0
        # VAT: (1000.0 + 100.0 + 220.0) * 0.05 = 66.0
        # Total: 1000.0 + 100.0 + 220.0 + 66.0 = 1386.0
        
        assert calculation["subtotal"] == 1000.0
        assert calculation["total_labor_cost"] == 100.0
        assert calculation["total_profit"] == 220.0
        assert calculation["total_vat"] == 66.0
        assert calculation["grand_total"] == 1386.0
    
    def test_general_invoice_calculation_accuracy(self, db_session, sample_general_item):
        """Test accurate calculation for general invoices"""
        invoice_data = {
            "type": "general",
            "customer_name": "General Calculation Test",
            "items": [
                {
                    "inventory_item_id": str(sample_general_item.id),
                    "item_name": "Silver Bracelet",
                    "quantity": 3,
                    "unit_price": 75.0
                }
            ]
        }
        
        calc_response = client.post("/universal-invoices/calculate", json=invoice_data)
        assert calc_response.status_code == 200
        
        calculation = calc_response.json()
        
        # Expected: 75.0 * 3 = 225.0
        assert calculation["subtotal"] == 225.0
        assert calculation["total_labor_cost"] == 0.0
        assert calculation["total_profit"] == 0.0
        assert calculation["total_vat"] == 0.0
        assert calculation["grand_total"] == 225.0

class TestPaymentProcessing:
    """Test payment processing and status updates"""
    
    def test_full_payment_processing(self, db_session, sample_inventory_item):
        """Test processing full payment for invoice"""
        # Create invoice
        invoice_data = {
            "type": "general",
            "customer_name": "Payment Test Customer",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 150.0
                }
            ]
        }
        
        create_response = client.post("/universal-invoices/", json=invoice_data)
        assert create_response.status_code == 200
        invoice_id = create_response.json()["id"]
        
        # Process full payment
        payment_data = {
            "amount": 150.0,
            "payment_method": "cash",
            "description": "Full payment"
        }
        
        payment_response = client.post(f"/universal-invoices/{invoice_id}/payments", json=payment_data)
        assert payment_response.status_code == 200
        
        # Verify invoice status
        get_response = client.get(f"/universal-invoices/{invoice_id}")
        invoice = get_response.json()
        
        assert invoice["paid_amount"] == 150.0
        assert invoice["remaining_amount"] == 0.0
        assert invoice["payment_status"] == "paid"
        assert invoice["status"] == "paid"
    
    def test_partial_payment_processing(self, db_session, sample_inventory_item):
        """Test processing partial payment for invoice"""
        # Create invoice
        invoice_data = {
            "type": "general",
            "customer_name": "Partial Payment Customer",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 200.0
                }
            ]
        }
        
        create_response = client.post("/universal-invoices/", json=invoice_data)
        assert create_response.status_code == 200
        invoice_id = create_response.json()["id"]
        
        # Process partial payment
        payment_data = {
            "amount": 100.0,
            "payment_method": "card",
            "description": "Partial payment"
        }
        
        payment_response = client.post(f"/universal-invoices/{invoice_id}/payments", json=payment_data)
        assert payment_response.status_code == 200
        
        # Verify invoice status
        get_response = client.get(f"/universal-invoices/{invoice_id}")
        invoice = get_response.json()
        
        assert invoice["paid_amount"] == 100.0
        assert invoice["remaining_amount"] == 100.0
        assert invoice["payment_status"] == "partially_paid"
        assert invoice["status"] == "partially_paid"
    
    def test_overpayment_validation(self, db_session, sample_inventory_item):
        """Test validation against overpayment"""
        # Create invoice
        invoice_data = {
            "type": "general",
            "customer_name": "Overpayment Test Customer",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 100.0
                }
            ]
        }
        
        create_response = client.post("/universal-invoices/", json=invoice_data)
        assert create_response.status_code == 200
        invoice_id = create_response.json()["id"]
        
        # Try to overpay
        payment_data = {
            "amount": 150.0,  # More than invoice total
            "payment_method": "cash"
        }
        
        payment_response = client.post(f"/universal-invoices/{invoice_id}/payments", json=payment_data)
        assert payment_response.status_code == 400
        assert "exceeds remaining amount" in payment_response.json()["detail"]

class TestQRCardGeneration:
    """Test QR code and card generation"""
    
    def test_qr_card_creation_on_invoice_creation(self, db_session, sample_inventory_item):
        """Test that QR card is automatically created with invoice"""
        invoice_data = {
            "type": "gold",
            "customer_name": "QR Test Customer",
            "card_theme": "glass",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 0,
                    "weight_grams": 5.0
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 60.0,
                "labor_cost_percentage": 10.0,
                "profit_percentage": 15.0,
                "vat_percentage": 5.0,
                "gold_sood": 50.0,
                "gold_ojrat": 30.0,
                "gold_maliyat": 20.0
            }
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 200
        
        invoice = response.json()
        assert invoice["qr_code"] is not None
        assert invoice["card_url"] is not None
        
        # Get QR card details
        qr_response = client.get(f"/universal-invoices/{invoice['id']}/qr-card")
        assert qr_response.status_code == 200
        
        qr_card = qr_response.json()
        assert qr_card["theme"] == "glass"
        assert qr_card["is_public"] is True
        assert qr_card["is_active"] is True
        
        # Verify card data includes gold fields
        card_data = qr_card["card_data"]
        assert card_data["invoice_type"] == "gold"
        assert card_data["gold_fields"]["gold_sood"] == 50.0
        assert card_data["gold_fields"]["gold_ojrat"] == 30.0
        assert card_data["gold_fields"]["gold_maliyat"] == 20.0

class TestBackwardCompatibility:
    """Test backward compatibility with existing gold shop features"""
    
    def test_gold_invoice_maintains_existing_fields(self, db_session, sample_inventory_item):
        """Test that gold invoices maintain all existing gold shop fields"""
        invoice_data = {
            "type": "gold",
            "customer_name": "Compatibility Test",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 0,
                    "weight_grams": 8.0
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 55.0,
                "labor_cost_percentage": 12.0,
                "profit_percentage": 18.0,
                "vat_percentage": 6.0
            }
        }
        
        response = client.post("/universal-invoices/", json=invoice_data)
        assert response.status_code == 200
        
        invoice = response.json()
        
        # Check all traditional gold shop fields are present
        assert invoice["gold_price_per_gram"] == 55.0
        assert invoice["labor_cost_percentage"] == 12.0
        assert invoice["profit_percentage"] == 18.0
        assert invoice["vat_percentage"] == 6.0
        assert invoice["gold_total_weight"] == 8.0
        
        # Check invoice item has weight
        item = invoice["items"][0]
        assert item["weight_grams"] == 8.0

class TestBulkOperations:
    """Test bulk operations for invoices"""
    
    def test_bulk_invoice_approval(self, db_session, sample_inventory_item):
        """Test bulk approval of multiple invoices"""
        # Create multiple draft invoices
        invoice_ids = []
        
        for i in range(3):
            invoice_data = {
                "type": "general",
                "customer_name": f"Bulk Customer {i+1}",
                "requires_approval": True,
                "items": [
                    {
                        "inventory_item_id": str(sample_inventory_item.id),
                        "item_name": "Gold Ring",
                        "quantity": 1,
                        "unit_price": 150.0
                    }
                ]
            }
            
            response = client.post("/universal-invoices/", json=invoice_data)
            assert response.status_code == 200
            invoice_ids.append(response.json()["id"])
        
        # Bulk approve
        bulk_data = {
            "invoice_ids": invoice_ids,
            "approval_notes": "Bulk approved by manager"
        }
        
        bulk_response = client.post("/universal-invoices/bulk/approve", json=bulk_data)
        assert bulk_response.status_code == 200
        
        approved_invoices = bulk_response.json()
        assert len(approved_invoices) == 3
        
        for invoice in approved_invoices:
            assert invoice["status"] == "approved"
            assert invoice["approval_notes"] == "Bulk approved by manager"

class TestInvoiceAnalytics:
    """Test invoice analytics and reporting"""
    
    def test_invoice_analytics_summary(self, db_session, sample_inventory_item, sample_general_item):
        """Test comprehensive invoice analytics"""
        # Create mix of gold and general invoices
        gold_invoice_data = {
            "type": "gold",
            "customer_name": "Analytics Gold Customer",
            "items": [
                {
                    "inventory_item_id": str(sample_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 0,
                    "weight_grams": 5.0
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 60.0,
                "labor_cost_percentage": 10.0,
                "profit_percentage": 15.0,
                "vat_percentage": 5.0
            }
        }
        
        general_invoice_data = {
            "type": "general",
            "customer_name": "Analytics General Customer",
            "items": [
                {
                    "inventory_item_id": str(sample_general_item.id),
                    "item_name": "Silver Bracelet",
                    "quantity": 2,
                    "unit_price": 75.0
                }
            ]
        }
        
        # Create invoices
        gold_response = client.post("/universal-invoices/", json=gold_invoice_data)
        general_response = client.post("/universal-invoices/", json=general_invoice_data)
        
        assert gold_response.status_code == 200
        assert general_response.status_code == 200
        
        # Get analytics
        analytics_response = client.get("/universal-invoices/analytics/summary")
        assert analytics_response.status_code == 200
        
        analytics = analytics_response.json()
        assert analytics["total_invoices"] >= 2
        assert analytics["gold_invoices_count"] >= 1
        assert analytics["general_invoices_count"] >= 1
        assert analytics["total_amount"] > 0
        assert "status_breakdown" in analytics
        assert "payment_status_breakdown" in analytics

if __name__ == "__main__":
    pytest.main([__file__, "-v"])