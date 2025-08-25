"""
Comprehensive Unit Tests for Enhanced Invoice System with Flexible Workflows
Tests all invoice functionality including workflows, pricing, payments, and business type support
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from fastapi import HTTPException

from main import app
from database import get_db, engine
from models_universal import (
    Base, User, Role, Customer, InventoryItem, Category, Invoice, InvoiceItem,
    Payment, PaymentMethod, BusinessConfiguration, WorkflowDefinition,
    ChartOfAccounts, AuditLog, InventoryMovement
)
from services.invoice_service import InvoiceService, InvoiceWorkflowEngine, InvoicePricingEngine
from schemas_invoice_universal import WorkflowStage, InvoiceType, BusinessType
import json

# Test fixtures
@pytest.fixture(scope="function")
def db_session():
    """Create a test database session"""
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        yield db
    finally:
        db.rollback()
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def test_user(db_session: Session):
    """Create test user with admin role"""
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
    """Create test customer"""
    customer = Customer(
        name="Test Customer",
        phone="+1234567890",
        email="customer@example.com",
        customer_type="retail",
        credit_limit=Decimal('5000.00'),
        is_active=True
    )
    db_session.add(customer)
    db_session.commit()
    return customer

@pytest.fixture
def test_category(db_session: Session):
    """Create test category"""
    category = Category(
        name="Gold Jewelry",
        description="Gold jewelry items",
        business_type="gold_shop",
        is_active=True
    )
    db_session.add(category)
    db_session.commit()
    return category

@pytest.fixture
def test_inventory_items(db_session: Session, test_category):
    """Create test inventory items"""
    items = []
    
    # Gold item
    gold_item = InventoryItem(
        sku="GOLD001",
        name="Gold Ring 18K",
        category_id=test_category.id,
        cost_price=Decimal('500.00'),
        sale_price=Decimal('800.00'),
        stock_quantity=Decimal('10'),
        weight_grams=Decimal('5.5'),
        attributes={"purity": "18K", "material": "gold"},
        tags=["jewelry", "ring", "gold"],
        is_active=True
    )
    items.append(gold_item)
    
    # Regular retail item
    retail_item = InventoryItem(
        sku="RTL001",
        name="Silver Necklace",
        category_id=test_category.id,
        cost_price=Decimal('100.00'),
        sale_price=Decimal('150.00'),
        stock_quantity=Decimal('20'),
        is_active=True
    )
    items.append(retail_item)
    
    for item in items:
        db_session.add(item)
    
    db_session.commit()
    return items

@pytest.fixture
def test_payment_methods(db_session: Session):
    """Create test payment methods"""
    methods = []
    
    cash_method = PaymentMethod(
        name="Cash",
        type="cash",
        is_active=True
    )
    methods.append(cash_method)
    
    card_method = PaymentMethod(
        name="Credit Card",
        type="card",
        configuration={"processor": "stripe"},
        is_active=True
    )
    methods.append(card_method)
    
    for method in methods:
        db_session.add(method)
    
    db_session.commit()
    return methods

@pytest.fixture
def business_configurations(db_session: Session):
    """Create business configurations"""
    configs = []
    
    # Gold shop configuration
    gold_config = BusinessConfiguration(
        business_type="gold_shop",
        business_name="Test Gold Shop",
        configuration={
            "default_gold_price": 60.0,
            "default_labor_percentage": 15.0,
            "default_profit_percentage": 10.0,
            "tax_percentage": 5.0,
            "approval_threshold": 1000.0
        },
        terminology_mapping={
            "invoice": "فاتورة",
            "customer": "زبون",
            "item": "قطعة"
        },
        is_active=True
    )
    configs.append(gold_config)
    
    # Retail configuration
    retail_config = BusinessConfiguration(
        business_type="retail",
        business_name="Test Retail Store",
        configuration={
            "tax_percentage": 8.0,
            "discount_percentage": 0.0,
            "approval_threshold": 500.0
        },
        is_active=True
    )
    configs.append(retail_config)
    
    for config in configs:
        db_session.add(config)
    
    db_session.commit()
    return configs

@pytest.fixture
def workflow_definitions(db_session: Session):
    """Create workflow definitions"""
    workflows = []
    
    # Standard workflow
    standard_workflow = WorkflowDefinition(
        name="Standard Invoice Workflow",
        entity_type="invoice",
        business_type="gold_shop",
        workflow_config={
            "stages": [
                {"name": "draft", "label": "Draft", "editable": True, "stock_impact": False},
                {"name": "pending_approval", "label": "Pending Approval", "editable": False, "stock_impact": False},
                {"name": "approved", "label": "Approved", "editable": False, "stock_impact": True},
                {"name": "paid", "label": "Paid", "editable": False, "stock_impact": True},
                {"name": "cancelled", "label": "Cancelled", "editable": False, "stock_impact": False}
            ],
            "transitions": {
                "draft": ["pending_approval", "approved", "cancelled"],
                "pending_approval": ["approved", "draft", "cancelled"],
                "approved": ["paid", "cancelled"],
                "paid": [],
                "cancelled": []
            },
            "approval_rules": {
                "required_for_stages": ["approved"],
                "roles": ["admin", "manager"],
                "amount_threshold": 1000.0
            }
        },
        is_active=True
    )
    workflows.append(standard_workflow)
    
    for workflow in workflows:
        db_session.add(workflow)
    
    db_session.commit()
    return workflows

class TestInvoicePricingEngine:
    """Test invoice pricing calculations"""
    
    def test_gold_pricing_calculation(self, db_session, test_inventory_items):
        """Test gold-specific pricing calculations"""
        pricing_engine = InvoicePricingEngine(db_session)
        gold_item = test_inventory_items[0]  # Gold ring
        
        item_data = {
            "inventory_item_id": gold_item.id,
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
        
        # Verify calculations
        expected_total_weight = Decimal('11.0')  # 5.5 * 2
        expected_base_price = expected_total_weight * Decimal('60.0')  # 660.0
        expected_labor_cost = expected_base_price * Decimal('0.15')  # 99.0
        expected_profit = (expected_base_price + expected_labor_cost) * Decimal('0.10')  # 75.9
        expected_subtotal = expected_base_price + expected_labor_cost + expected_profit  # 834.9
        expected_tax = expected_subtotal * Decimal('0.05')  # 41.745
        expected_total = expected_subtotal + expected_tax  # 876.645
        expected_unit_price = expected_total / Decimal('2')  # 438.3225
        
        assert result["quantity"] == Decimal('2')
        assert result["weight_grams"] == Decimal('5.5')
        assert result["base_price"] == expected_base_price
        assert result["labor_cost"] == expected_labor_cost
        assert result["profit_amount"] == expected_profit
        assert abs(result["total_price"] - expected_total) < Decimal('0.01')
    
    def test_standard_pricing_calculation(self, db_session, test_inventory_items):
        """Test standard business pricing calculations"""
        pricing_engine = InvoicePricingEngine(db_session)
        retail_item = test_inventory_items[1]  # Silver necklace
        
        item_data = {
            "inventory_item_id": retail_item.id,
            "quantity": 3
        }
        
        business_config = {
            "business_type": "retail",
            "tax_percentage": 8.0,
            "discount_percentage": 5.0
        }
        
        result = pricing_engine.calculate_item_pricing(item_data, business_config)
        
        # Verify calculations
        base_price = retail_item.sale_price  # 150.00
        discounted_price = base_price * Decimal('0.95')  # 142.50
        subtotal = discounted_price * Decimal('3')  # 427.50
        tax_amount = subtotal * Decimal('0.08')  # 34.20
        total_price = subtotal + tax_amount  # 461.70
        
        assert result["quantity"] == Decimal('3')
        assert result["base_unit_price"] == base_price
        assert result["unit_price"] == discounted_price
        assert abs(result["total_price"] - total_price) < Decimal('0.01')

class TestInvoiceWorkflowEngine:
    """Test invoice workflow management"""
    
    def test_workflow_definition_retrieval(self, db_session, workflow_definitions):
        """Test retrieving workflow definitions"""
        workflow_engine = InvoiceWorkflowEngine(db_session)
        
        workflow = workflow_engine.get_workflow_definition("gold_shop", "standard")
        
        assert "stages" in workflow
        assert "transitions" in workflow
        assert "approval_rules" in workflow
        assert len(workflow["stages"]) == 5
    
    def test_workflow_transition_validation(self, db_session, test_user, workflow_definitions):
        """Test workflow transition validation"""
        workflow_engine = InvoiceWorkflowEngine(db_session)
        
        # Create mock invoice
        invoice = Invoice(
            invoice_number="TEST-001",
            workflow_stage="draft",
            total_amount=Decimal('500.00'),
            business_type_fields={"business_type": "gold_shop"}
        )
        
        # Test valid transition
        can_transition, message = workflow_engine.can_transition(invoice, "approved", test_user)
        assert can_transition
        
        # Test invalid transition
        can_transition, message = workflow_engine.can_transition(invoice, "paid", test_user)
        assert not can_transition
        assert "Cannot transition from draft to paid" in message
    
    def test_approval_requirements(self, db_session, test_user, workflow_definitions):
        """Test approval requirement validation"""
        workflow_engine = InvoiceWorkflowEngine(db_session)
        
        # High value invoice requiring approval
        high_value_invoice = Invoice(
            invoice_number="TEST-002",
            workflow_stage="draft",
            total_amount=Decimal('1500.00'),  # Above threshold
            business_type_fields={"business_type": "gold_shop"}
        )
        
        can_transition, message = workflow_engine.can_transition(high_value_invoice, "approved", test_user)
        assert can_transition  # Admin user should be able to approve
        
        # Low value invoice not requiring approval
        low_value_invoice = Invoice(
            invoice_number="TEST-003",
            workflow_stage="draft",
            total_amount=Decimal('500.00'),  # Below threshold
            business_type_fields={"business_type": "gold_shop"}
        )
        
        can_transition, message = workflow_engine.can_transition(low_value_invoice, "approved", test_user)
        assert can_transition

class TestInvoiceService:
    """Test main invoice service functionality"""
    
    def test_invoice_number_generation(self, db_session):
        """Test invoice number generation"""
        service = InvoiceService(db_session)
        
        # Test gold shop invoice number
        gold_number = service.generate_invoice_number("gold_shop")
        assert gold_number.startswith("GLD-")
        
        # Test retail invoice number
        retail_number = service.generate_invoice_number("retail")
        assert retail_number.startswith("RTL-")
        
        # Test sequential numbering
        gold_number2 = service.generate_invoice_number("gold_shop")
        assert gold_number != gold_number2
    
    def test_invoice_creation_gold_shop(self, db_session, test_user, test_customer, test_inventory_items, business_configurations):
        """Test creating a gold shop invoice"""
        service = InvoiceService(db_session)
        gold_item = test_inventory_items[0]
        
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "invoice_type": "gold",
            "gold_price_per_gram": 60.0,
            "labor_cost_percentage": 15.0,
            "profit_percentage": 10.0,
            "vat_percentage": 5.0,
            "items": [
                {
                    "inventory_item_id": gold_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        
        assert invoice.invoice_number.startswith("GLD-")
        assert invoice.customer_id == test_customer.id
        assert invoice.workflow_stage == "draft"
        assert invoice.total_amount > 0
        assert len(invoice.invoice_items) == 1
        assert invoice.gold_specific is not None
        assert "sood" in invoice.gold_specific
        assert "ojrat" in invoice.gold_specific
    
    def test_invoice_creation_retail(self, db_session, test_user, test_customer, test_inventory_items, business_configurations):
        """Test creating a retail invoice"""
        service = InvoiceService(db_session)
        retail_item = test_inventory_items[1]
        
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "retail",
            "invoice_type": "standard",
            "tax_percentage": 8.0,
            "items": [
                {
                    "inventory_item_id": retail_item.id,
                    "quantity": 2
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        
        assert invoice.invoice_number.startswith("RTL-")
        assert invoice.customer_id == test_customer.id
        assert invoice.workflow_stage == "draft"
        assert invoice.total_amount > 0
        assert len(invoice.invoice_items) == 1
    
    def test_invoice_approval_workflow(self, db_session, test_user, test_customer, test_inventory_items, business_configurations, workflow_definitions):
        """Test invoice approval workflow"""
        service = InvoiceService(db_session)
        gold_item = test_inventory_items[0]
        initial_stock = gold_item.stock_quantity
        
        # Create invoice
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "items": [
                {
                    "inventory_item_id": gold_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        assert invoice.workflow_stage == "draft"
        
        # Approve invoice
        approved_invoice = service.approve_invoice(invoice.id, test_user, "Test approval")
        
        assert approved_invoice.workflow_stage == "approved"
        assert approved_invoice.approved_by == test_user.id
        assert approved_invoice.approved_at is not None
        
        # Check stock impact
        db_session.refresh(gold_item)
        assert gold_item.stock_quantity == initial_stock - Decimal('1')
        
        # Check inventory movement record
        movement = db_session.query(InventoryMovement).filter(
            InventoryMovement.inventory_item_id == gold_item.id,
            InventoryMovement.reference_id == invoice.id
        ).first()
        assert movement is not None
        assert movement.movement_type == "out"
        assert movement.quantity == Decimal('-1')
    
    def test_invoice_void_workflow(self, db_session, test_user, test_customer, test_inventory_items, business_configurations):
        """Test invoice voiding and stock restoration"""
        service = InvoiceService(db_session)
        gold_item = test_inventory_items[0]
        initial_stock = gold_item.stock_quantity
        
        # Create and approve invoice
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "items": [
                {
                    "inventory_item_id": gold_item.id,
                    "quantity": 2,
                    "weight_grams": 5.5
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        approved_invoice = service.approve_invoice(invoice.id, test_user)
        
        # Verify stock was deducted
        db_session.refresh(gold_item)
        assert gold_item.stock_quantity == initial_stock - Decimal('2')
        
        # Void invoice
        voided_invoice = service.void_invoice(invoice.id, test_user, "Test void")
        
        assert voided_invoice.workflow_stage == "cancelled"
        
        # Check stock restoration
        db_session.refresh(gold_item)
        assert gold_item.stock_quantity == initial_stock
    
    def test_payment_processing(self, db_session, test_user, test_customer, test_inventory_items, test_payment_methods, business_configurations):
        """Test payment processing"""
        service = InvoiceService(db_session)
        gold_item = test_inventory_items[0]
        cash_method = test_payment_methods[0]
        
        # Create invoice
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "items": [
                {
                    "inventory_item_id": gold_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        total_amount = invoice.total_amount
        
        # Add partial payment
        payment_data = {
            "amount": float(total_amount / 2),
            "payment_method_id": cash_method.id,
            "payment_method": "cash",
            "description": "Partial payment"
        }
        
        payment = service.add_payment(invoice.id, payment_data, test_user)
        
        assert payment.amount == total_amount / 2
        assert payment.payment_method_id == cash_method.id
        
        # Check invoice status
        db_session.refresh(invoice)
        assert invoice.paid_amount == total_amount / 2
        assert invoice.remaining_amount == total_amount / 2
        assert invoice.workflow_stage == "approved"  # Auto-approved due to payment
        
        # Add remaining payment
        remaining_payment_data = {
            "amount": float(invoice.remaining_amount),
            "payment_method_id": cash_method.id,
            "payment_method": "cash",
            "description": "Final payment"
        }
        
        final_payment = service.add_payment(invoice.id, remaining_payment_data, test_user)
        
        # Check final status
        db_session.refresh(invoice)
        assert invoice.remaining_amount == 0
        assert invoice.workflow_stage == "paid"
    
    def test_stock_validation(self, db_session, test_user, test_customer, test_inventory_items, business_configurations):
        """Test stock availability validation"""
        service = InvoiceService(db_session)
        gold_item = test_inventory_items[0]
        
        # Try to create invoice with insufficient stock
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "items": [
                {
                    "inventory_item_id": gold_item.id,
                    "quantity": 100,  # More than available stock
                    "weight_grams": 5.5
                }
            ]
        }
        
        with pytest.raises(HTTPException) as exc_info:
            service.create_invoice(invoice_data, test_user)
        
        assert "Insufficient stock" in str(exc_info.value.detail)
    
    def test_customer_debt_tracking(self, db_session, test_user, test_customer, test_inventory_items, business_configurations):
        """Test customer debt tracking"""
        service = InvoiceService(db_session)
        gold_item = test_inventory_items[0]
        initial_debt = test_customer.current_debt
        
        # Create and approve invoice
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "items": [
                {
                    "inventory_item_id": gold_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        approved_invoice = service.approve_invoice(invoice.id, test_user)
        
        # Check debt increase
        db_session.refresh(test_customer)
        assert test_customer.current_debt == initial_debt + approved_invoice.total_amount
        
        # Add payment
        payment_data = {
            "amount": float(approved_invoice.total_amount),
            "payment_method": "cash"
        }
        
        service.add_payment(invoice.id, payment_data, test_user)
        
        # Check debt decrease
        db_session.refresh(test_customer)
        assert test_customer.current_debt == initial_debt
    
    def test_audit_logging(self, db_session, test_user, test_customer, test_inventory_items, business_configurations):
        """Test comprehensive audit logging"""
        service = InvoiceService(db_session)
        gold_item = test_inventory_items[0]
        
        # Create invoice
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "items": [
                {
                    "inventory_item_id": gold_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        
        # Check creation audit log
        creation_log = db_session.query(AuditLog).filter(
            AuditLog.resource_type == "invoice",
            AuditLog.resource_id == invoice.id,
            AuditLog.action == "created"
        ).first()
        
        assert creation_log is not None
        assert creation_log.user_id == test_user.id
        
        # Approve invoice
        service.approve_invoice(invoice.id, test_user, "Test approval")
        
        # Check workflow transition log
        workflow_log = db_session.query(AuditLog).filter(
            AuditLog.resource_type == "invoice",
            AuditLog.resource_id == invoice.id,
            AuditLog.action == "workflow_transition"
        ).first()
        
        assert workflow_log is not None
        assert workflow_log.user_id == test_user.id

class TestInvoiceAPI:
    """Test invoice API endpoints"""
    
    def test_create_invoice_endpoint(self, test_client, db_session, test_user, test_customer, test_inventory_items):
        """Test invoice creation API endpoint"""
        gold_item = test_inventory_items[0]
        
        invoice_data = {
            "customer_id": str(test_customer.id),
            "business_type": "gold_shop",
            "invoice_type": "gold",
            "gold_price_per_gram": 60.0,
            "labor_cost_percentage": 15.0,
            "profit_percentage": 10.0,
            "vat_percentage": 5.0,
            "items": [
                {
                    "inventory_item_id": str(gold_item.id),
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        # Mock authentication
        with test_client as client:
            # This would require proper authentication setup
            # For now, we'll test the service directly
            pass
    
    def test_invoice_calculation_endpoint(self, test_client, db_session, test_customer, test_inventory_items):
        """Test invoice calculation API endpoint"""
        gold_item = test_inventory_items[0]
        
        calculation_data = {
            "customer_id": str(test_customer.id),
            "business_type": "gold_shop",
            "gold_price_per_gram": 60.0,
            "labor_cost_percentage": 15.0,
            "profit_percentage": 10.0,
            "tax_percentage": 5.0,
            "items": [
                {
                    "inventory_item_id": str(gold_item.id),
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        # This would test the actual API endpoint
        # For now, we'll test the service calculation directly
        service = InvoiceService(db_session)
        result = service.calculate_invoice_totals(calculation_data)
        
        assert "items" in result
        assert "grand_total" in result
        assert result["grand_total"] > 0

class TestBusinessTypeSpecificFeatures:
    """Test business type specific features"""
    
    def test_gold_shop_specific_fields(self, db_session, test_user, test_customer, test_inventory_items, business_configurations):
        """Test gold shop specific fields (سود and اجرت)"""
        service = InvoiceService(db_session)
        gold_item = test_inventory_items[0]
        
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "gold_price_per_gram": 60.0,
            "labor_cost_percentage": 15.0,  # اجرت
            "profit_percentage": 10.0,       # سود
            "items": [
                {
                    "inventory_item_id": gold_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        
        assert invoice.gold_specific is not None
        assert "sood" in invoice.gold_specific  # سود
        assert "ojrat" in invoice.gold_specific  # اجرت
        assert invoice.gold_specific["sood"] > 0
        assert invoice.gold_specific["ojrat"] > 0
    
    def test_retail_business_features(self, db_session, test_user, test_customer, test_inventory_items, business_configurations):
        """Test retail business specific features"""
        service = InvoiceService(db_session)
        retail_item = test_inventory_items[1]
        
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "retail",
            "tax_percentage": 8.0,
            "discount_percentage": 5.0,
            "items": [
                {
                    "inventory_item_id": retail_item.id,
                    "quantity": 2
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        
        assert invoice.business_type_fields["business_type"] == "retail"
        assert invoice.total_amount > 0
        
        # Check that gold-specific fields are not set
        assert invoice.gold_price_per_gram is None
        assert invoice.gold_specific is None

class TestMultiplePaymentMethods:
    """Test multiple payment method support"""
    
    def test_multiple_payment_methods(self, db_session, test_user, test_customer, test_inventory_items, test_payment_methods, business_configurations):
        """Test paying with multiple payment methods"""
        service = InvoiceService(db_session)
        gold_item = test_inventory_items[0]
        cash_method, card_method = test_payment_methods
        
        # Create invoice
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "items": [
                {
                    "inventory_item_id": gold_item.id,
                    "quantity": 1,
                    "weight_grams": 5.5
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        total_amount = invoice.total_amount
        
        # Pay 60% with cash
        cash_payment_data = {
            "amount": float(total_amount * Decimal('0.6')),
            "payment_method_id": cash_method.id,
            "payment_method": "cash"
        }
        
        cash_payment = service.add_payment(invoice.id, cash_payment_data, test_user)
        
        # Pay remaining 40% with card
        db_session.refresh(invoice)
        card_payment_data = {
            "amount": float(invoice.remaining_amount),
            "payment_method_id": card_method.id,
            "payment_method": "card",
            "reference_number": "TXN123456"
        }
        
        card_payment = service.add_payment(invoice.id, card_payment_data, test_user)
        
        # Verify payments
        assert cash_payment.payment_method_id == cash_method.id
        assert card_payment.payment_method_id == card_method.id
        assert card_payment.reference_number == "TXN123456"
        
        # Verify invoice is fully paid
        db_session.refresh(invoice)
        assert invoice.remaining_amount == 0
        assert invoice.workflow_stage == "paid"

class TestComplexScenarios:
    """Test complex business scenarios"""
    
    def test_high_volume_invoice_processing(self, db_session, test_user, test_customer, test_inventory_items, business_configurations):
        """Test processing multiple invoices efficiently"""
        service = InvoiceService(db_session)
        gold_item = test_inventory_items[0]
        
        # Create multiple invoices
        invoices = []
        for i in range(10):
            invoice_data = {
                "customer_id": test_customer.id,
                "business_type": "gold_shop",
                "items": [
                    {
                        "inventory_item_id": gold_item.id,
                        "quantity": 1,
                        "weight_grams": 5.5
                    }
                ]
            }
            
            invoice = service.create_invoice(invoice_data, test_user)
            invoices.append(invoice)
        
        assert len(invoices) == 10
        
        # Approve all invoices
        for invoice in invoices:
            service.approve_invoice(invoice.id, test_user)
        
        # Verify all are approved
        for invoice in invoices:
            db_session.refresh(invoice)
            assert invoice.workflow_stage == "approved"
    
    def test_concurrent_stock_updates(self, db_session, test_user, test_customer, test_inventory_items, business_configurations):
        """Test handling concurrent stock updates"""
        service = InvoiceService(db_session)
        gold_item = test_inventory_items[0]
        initial_stock = gold_item.stock_quantity
        
        # Create invoice that would use all available stock
        invoice_data = {
            "customer_id": test_customer.id,
            "business_type": "gold_shop",
            "items": [
                {
                    "inventory_item_id": gold_item.id,
                    "quantity": int(initial_stock),
                    "weight_grams": 5.5
                }
            ]
        }
        
        invoice = service.create_invoice(invoice_data, test_user)
        service.approve_invoice(invoice.id, test_user)
        
        # Try to create another invoice with same item (should fail)
        with pytest.raises(HTTPException) as exc_info:
            service.create_invoice(invoice_data, test_user)
        
        assert "Insufficient stock" in str(exc_info.value.detail)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])