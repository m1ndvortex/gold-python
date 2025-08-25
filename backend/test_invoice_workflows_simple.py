"""
Simple Unit Tests for Enhanced Invoice System with Flexible Workflows
Tests core invoice functionality using existing database structure
"""

import pytest
from decimal import Decimal
from datetime import datetime
from uuid import uuid4
from sqlalchemy.orm import Session
from fastapi import HTTPException

from database import get_db
from models import (
    User, Role, Customer, InventoryItem, Category, Invoice, InvoiceItem,
    Payment, AccountingEntry
)
from services.invoice_service import InvoiceService, InvoiceWorkflowEngine, InvoicePricingEngine

# Test fixtures using existing database
@pytest.fixture(scope="function")
def db_session():
    """Use existing database session"""
    db = next(get_db())
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture
def test_user(db_session: Session):
    """Get or create test user"""
    user = db_session.query(User).filter(User.username == "testuser").first()
    if not user:
        # Create role first
        role = db_session.query(Role).filter(Role.name == "admin").first()
        if not role:
            role = Role(
                name="admin",
                description="Administrator",
                permissions={"invoices": ["create", "read", "update", "delete", "approve"]}
            )
            db_session.add(role)
            db_session.flush()
        
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
            role_id=role.id,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
    return user

@pytest.fixture
def test_customer(db_session: Session):
    """Get or create test customer"""
    customer = db_session.query(Customer).filter(Customer.name == "Test Customer").first()
    if not customer:
        customer = Customer(
            name="Test Customer",
            phone="+1234567890",
            email="customer@example.com",
            is_active=True
        )
        db_session.add(customer)
        db_session.commit()
    return customer

@pytest.fixture
def test_category(db_session: Session):
    """Get or create test category"""
    category = db_session.query(Category).filter(Category.name == "Test Gold").first()
    if not category:
        category = Category(
            name="Test Gold",
            description="Test gold items",
            is_active=True
        )
        db_session.add(category)
        db_session.commit()
    return category

@pytest.fixture
def test_inventory_item(db_session: Session, test_category):
    """Get or create test inventory item"""
    item = db_session.query(InventoryItem).filter(InventoryItem.name == "Test Gold Ring").first()
    if not item:
        item = InventoryItem(
            name="Test Gold Ring",
            category_id=test_category.id,
            weight_grams=Decimal('5.5'),
            purchase_price=Decimal('500.00'),
            sell_price=Decimal('800.00'),
            stock_quantity=10,
            is_active=True
        )
        db_session.add(item)
        db_session.commit()
    return item

class TestInvoicePricingEngine:
    """Test invoice pricing calculations"""
    
    def test_gold_pricing_calculation(self, db_session, test_inventory_item):
        """Test gold-specific pricing calculations"""
        pricing_engine = InvoicePricingEngine(db_session)
        
        item_data = {
            "inventory_item_id": test_inventory_item.id,
            "quantity": 2,
            "weight_grams": 5.5
        }
        
        business_config = {
            "business_type": "gold_shop",
            "gold_price_per_gram": 60.0,
            "labor_cost_percentage": 15.0,
            "profit_percentage": 10.0,
            "tax_percentage": 5.0
        }
        
        result = pricing_engine.calculate_item_pricing(item_data, business_config)
        
        # Verify basic structure
        assert "inventory_item_id" in result
        assert "item_name" in result
        assert "quantity" in result
        assert "unit_price" in result
        assert "total_price" in result
        
        # Verify calculations are positive
        assert result["quantity"] == Decimal('2')
        assert result["total_price"] > 0
        assert result["unit_price"] > 0
    
    def test_standard_pricing_calculation(self, db_session, test_inventory_item):
        """Test standard business pricing calculations"""
        pricing_engine = InvoicePricingEngine(db_session)
        
        item_data = {
            "inventory_item_id": test_inventory_item.id,
            "quantity": 3
        }
        
        business_config = {
            "business_type": "retail",
            "tax_percentage": 8.0,
            "discount_percentage": 5.0
        }
        
        result = pricing_engine.calculate_item_pricing(item_data, business_config)
        
        # Verify basic structure
        assert result["quantity"] == Decimal('3')
        assert result["total_price"] > 0
        assert result["unit_price"] > 0

class TestInvoiceWorkflowEngine:
    """Test invoice workflow management"""
    
    def test_workflow_definition_retrieval(self, db_session):
        """Test retrieving workflow definitions"""
        workflow_engine = InvoiceWorkflowEngine(db_session)
        
        workflow = workflow_engine.get_workflow_definition("gold_shop", "standard")
        
        assert "stages" in workflow
        assert "transitions" in workflow
        assert "approval_rules" in workflow
        assert len(workflow["stages"]) >= 3  # At least draft, approved, paid
    
    def test_workflow_transition_validation(self, db_session, test_user):
        """Test workflow transition validation"""
        workflow_engine = InvoiceWorkflowEngine(db_session)
        
        # Create mock invoice using existing Invoice model
        invoice = Invoice(
            invoice_number="TEST-001",
            customer_id=uuid4(),  # Mock customer ID
            total_amount=Decimal('500.00'),
            paid_amount=Decimal('0'),
            remaining_amount=Decimal('500.00'),
            gold_price_per_gram=Decimal('60.0'),
            status='pending'
        )
        
        # Add business type fields for universal support
        invoice.business_type_fields = {"business_type": "gold_shop"}
        invoice.workflow_stage = "draft"
        
        # Test valid transition (draft to approved)
        can_transition, message = workflow_engine.can_transition(invoice, "approved", test_user)
        assert can_transition or "approval" in message.lower()  # Either allowed or needs approval
        
        # Test invalid transition (draft to paid without approval)
        can_transition, message = workflow_engine.can_transition(invoice, "paid", test_user)
        assert not can_transition

class TestInvoiceService:
    """Test main invoice service functionality"""
    
    def test_invoice_number_generation(self, db_session):
        """Test invoice number generation"""
        service = InvoiceService(db_session)
        
        # Test gold shop invoice number
        gold_number = service.generate_invoice_number("gold_shop")
        assert gold_number.startswith("GLD-")
        assert len(gold_number) > 10  # Should have date and sequence
        
        # Test retail invoice number
        retail_number = service.generate_invoice_number("retail")
        assert retail_number.startswith("RTL-")
        
        # Test that numbers are different (at least in prefix)
        assert gold_number[:3] != retail_number[:3]
    
    def test_invoice_calculation(self, db_session, test_customer, test_inventory_item):
        """Test invoice calculation functionality"""
        service = InvoiceService(db_session)
        
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "gold_price_per_gram": 60.0,
            "labor_cost_percentage": 15.0,
            "profit_percentage": 10.0,
            "vat_percentage": 5.0,
            "items": [
                {
                    "inventory_item_id": test_inventory_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        calculation = service.calculate_invoice_totals(invoice_data)
        
        # Verify calculation structure
        assert "items" in calculation
        assert "grand_total" in calculation
        assert len(calculation["items"]) == 1
        assert calculation["grand_total"] > 0
    
    def test_stock_validation(self, db_session, test_user, test_customer, test_inventory_item):
        """Test stock availability validation"""
        service = InvoiceService(db_session)
        
        # Get current stock
        current_stock = test_inventory_item.stock_quantity
        
        # Try to create invoice with more than available stock
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "items": [
                {
                    "inventory_item_id": test_inventory_item.id,
                    "quantity": current_stock + 10,  # More than available
                    "weight_grams": 5.5
                }
            ]
        }
        
        with pytest.raises(HTTPException) as exc_info:
            service.create_invoice(invoice_data, test_user)
        
        assert "Insufficient stock" in str(exc_info.value.detail)
    
    def test_business_configuration_retrieval(self, db_session):
        """Test business configuration retrieval"""
        service = InvoiceService(db_session)
        
        # Test gold shop configuration
        gold_config = service._get_business_configuration("gold_shop")
        assert isinstance(gold_config, dict)
        # Check for either business_type field or default_settings (depending on configuration source)
        assert "business_type" in gold_config or "default_settings" in gold_config
        
        # Test retail configuration
        retail_config = service._get_business_configuration("retail")
        assert isinstance(retail_config, dict)
        assert "business_type" in retail_config or "default_settings" in retail_config

class TestInvoiceWorkflows:
    """Test invoice workflow scenarios"""
    
    def test_invoice_creation_workflow(self, db_session, test_user, test_customer, test_inventory_item):
        """Test basic invoice creation workflow"""
        service = InvoiceService(db_session)
        
        # Ensure we have enough stock
        if test_inventory_item.stock_quantity < 1:
            test_inventory_item.stock_quantity = 10
            db_session.add(test_inventory_item)
            db_session.commit()
        
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "gold_price_per_gram": 60.0,
            "labor_cost_percentage": 15.0,
            "profit_percentage": 10.0,
            "vat_percentage": 5.0,
            "items": [
                {
                    "inventory_item_id": test_inventory_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        # Create invoice
        invoice = service.create_invoice(invoice_data, test_user)
        
        # Verify invoice creation
        assert invoice.id is not None
        assert invoice.invoice_number.startswith("GLD-")
        assert invoice.customer_id == test_customer.id
        assert invoice.total_amount > 0
        assert len(invoice.invoice_items) == 1
        
        # Verify gold-specific fields
        if hasattr(invoice, 'gold_specific') and invoice.gold_specific:
            assert "sood" in invoice.gold_specific or "ojrat" in invoice.gold_specific
    
    def test_payment_processing(self, db_session, test_user, test_customer, test_inventory_item):
        """Test payment processing"""
        service = InvoiceService(db_session)
        
        # Ensure we have enough stock
        if test_inventory_item.stock_quantity < 1:
            test_inventory_item.stock_quantity = 10
            db_session.add(test_inventory_item)
            db_session.commit()
        
        # Create invoice
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "gold_price_per_gram": 60.0,
            "labor_cost_percentage": 15.0,
            "profit_percentage": 10.0,
            "vat_percentage": 5.0,
            "items": [
                {
                    "inventory_item_id": test_inventory_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        total_amount = invoice.total_amount
        
        # Add payment
        payment_data = {
            "amount": float(total_amount / 2),  # Partial payment
            "payment_method": "cash",
            "description": "Partial payment"
        }
        
        payment = service.add_payment(invoice.id, payment_data, test_user)
        
        # Verify payment (allow for small decimal precision differences)
        expected_payment = total_amount / 2
        assert abs(payment.amount - expected_payment) < Decimal('0.01')
        assert payment.customer_id == test_customer.id
        assert payment.invoice_id == invoice.id
        
        # Check invoice status update
        db_session.refresh(invoice)
        assert abs(invoice.paid_amount - expected_payment) < Decimal('0.01')
        assert abs(invoice.remaining_amount - expected_payment) < Decimal('0.01')

class TestBusinessTypeFeatures:
    """Test business type specific features"""
    
    def test_gold_shop_features(self, db_session, test_user, test_customer, test_inventory_item):
        """Test gold shop specific features"""
        service = InvoiceService(db_session)
        
        # Ensure we have enough stock
        if test_inventory_item.stock_quantity < 1:
            test_inventory_item.stock_quantity = 10
            db_session.add(test_inventory_item)
            db_session.commit()
        
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "gold_price_per_gram": 60.0,
            "labor_cost_percentage": 15.0,  # اجرت
            "profit_percentage": 10.0,       # سود
            "items": [
                {
                    "inventory_item_id": test_inventory_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        
        # Verify gold-specific fields are set
        assert invoice.gold_price_per_gram == Decimal('60.0')
        assert invoice.labor_cost_percentage == Decimal('15.0')
        assert invoice.profit_percentage == Decimal('10.0')
        
        # Check if gold_specific field exists and has data
        if hasattr(invoice, 'gold_specific') and invoice.gold_specific:
            assert isinstance(invoice.gold_specific, dict)
    
    def test_retail_features(self, db_session, test_user, test_customer, test_inventory_item):
        """Test retail business features"""
        service = InvoiceService(db_session)
        
        # Ensure we have enough stock
        if test_inventory_item.stock_quantity < 1:
            test_inventory_item.stock_quantity = 10
            db_session.add(test_inventory_item)
            db_session.commit()
        
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "retail",
            "tax_percentage": 8.0,
            "discount_percentage": 5.0,
            "items": [
                {
                    "inventory_item_id": test_inventory_item.id,
                    "quantity": 2
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        
        # Verify retail invoice
        assert invoice.total_amount > 0
        
        # Check business type fields
        if hasattr(invoice, 'business_type_fields') and invoice.business_type_fields:
            assert invoice.business_type_fields.get("business_type") == "retail"

class TestErrorHandling:
    """Test error handling scenarios"""
    
    def test_invalid_customer(self, db_session, test_user, test_inventory_item):
        """Test handling of invalid customer"""
        service = InvoiceService(db_session)
        
        invalid_customer_id = uuid4()
        
        invoice_data = {
            "customer_id": invalid_customer_id,
            "business_type": "gold_shop",
            "items": [
                {
                    "inventory_item_id": test_inventory_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        with pytest.raises(HTTPException) as exc_info:
            service.create_invoice(invoice_data, test_user)
        
        assert "Customer not found" in str(exc_info.value.detail)
    
    def test_invalid_inventory_item(self, db_session, test_user, test_customer):
        """Test handling of invalid inventory item"""
        service = InvoiceService(db_session)
        
        invalid_item_id = uuid4()
        
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "items": [
                {
                    "inventory_item_id": invalid_item_id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        with pytest.raises(HTTPException) as exc_info:
            service.create_invoice(invoice_data, test_user)
        
        assert "Inventory item not found" in str(exc_info.value.detail)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])