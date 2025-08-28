"""
Simple Unit Tests for Universal Dual Invoice System
Tests core functionality without complex database setup
"""

import pytest
from decimal import Decimal
from datetime import datetime
import uuid

import schemas_universal as schemas
from routers.universal_invoices import (
    generate_invoice_number, 
    validate_invoice_business_rules,
    calculate_gold_invoice_totals,
    calculate_general_invoice_totals
)

class MockDB:
    """Mock database session for testing"""
    def __init__(self):
        self.items = {}
        self.committed = False
        self.rolled_back = False
    
    def query(self, model):
        return MockQuery(self.items.get(model.__name__, []))
    
    def add(self, item):
        pass
    
    def commit(self):
        self.committed = True
    
    def rollback(self):
        self.rolled_back = True
    
    def flush(self):
        pass

class MockQuery:
    """Mock query object"""
    def __init__(self, items):
        self.items = items
    
    def filter(self, *args):
        return self
    
    def first(self):
        return self.items[0] if self.items else None
    
    def all(self):
        return self.items
    
    def order_by(self, *args):
        return self

class MockInventoryItem:
    """Mock inventory item for testing"""
    def __init__(self, id, name, sku, stock_quantity=10, sale_price=100):
        self.id = id
        self.name = name
        self.sku = sku
        self.stock_quantity = stock_quantity
        self.sale_price = sale_price
        self.description = f"Description for {name}"

class TestInvoiceTypeValidation:
    """Test invoice type selection and validation"""
    
    def test_gold_invoice_requires_gold_fields(self):
        """Test that gold invoice without gold fields fails validation"""
        from fastapi import HTTPException
        
        invoice_data = schemas.UniversalInvoiceCreate(
            type="gold",
            customer_name="Test Customer",
            items=[
                schemas.UniversalInvoiceItemCreate(
                    item_name="Gold Ring",
                    quantity=1,
                    unit_price=100,
                    weight_grams=5.0
                )
            ]
            # Missing gold_fields
        )
        
        with pytest.raises(HTTPException) as exc_info:
            validate_invoice_business_rules(invoice_data)
        assert "Gold fields are required" in str(exc_info.value.detail)
    
    def test_general_invoice_rejects_gold_fields(self):
        """Test that general invoice with gold fields fails validation"""
        from pydantic_core import ValidationError
        
        with pytest.raises(ValidationError, match="Gold fields should not be provided"):
            schemas.UniversalInvoiceCreate(
                type="general",
                customer_name="Test Customer",
                items=[
                    schemas.UniversalInvoiceItemCreate(
                        item_name="Silver Bracelet",
                        quantity=1,
                        unit_price=75
                    )
                ],
                gold_fields=schemas.GoldInvoiceFields(
                    gold_price_per_gram=60.0,
                    labor_cost_percentage=10.0
                )
            )
    
    def test_valid_gold_invoice_passes_validation(self):
        """Test that valid gold invoice passes validation"""
        invoice_data = schemas.UniversalInvoiceCreate(
            type="gold",
            customer_name="Test Customer",
            items=[
                schemas.UniversalInvoiceItemCreate(
                    item_name="Gold Ring",
                    quantity=1,
                    unit_price=0,
                    weight_grams=5.0
                )
            ],
            gold_fields=schemas.GoldInvoiceFields(
                gold_price_per_gram=60.0,
                labor_cost_percentage=10.0,
                profit_percentage=15.0,
                vat_percentage=5.0
            )
        )
        
        # Should not raise any exception
        validate_invoice_business_rules(invoice_data)
    
    def test_valid_general_invoice_passes_validation(self):
        """Test that valid general invoice passes validation"""
        invoice_data = schemas.UniversalInvoiceCreate(
            type="general",
            customer_name="Test Customer",
            items=[
                schemas.UniversalInvoiceItemCreate(
                    item_name="Silver Bracelet",
                    quantity=1,
                    unit_price=75
                )
            ]
        )
        
        # Should not raise any exception
        validate_invoice_business_rules(invoice_data)

class TestInvoiceNumberGeneration:
    """Test invoice number generation"""
    
    def test_gold_invoice_number_prefix(self):
        """Test that gold invoices get GOLD prefix"""
        db = MockDB()
        invoice_number = generate_invoice_number(db, "gold")
        assert invoice_number.startswith("GOLD-")
        assert len(invoice_number.split("-")) == 3  # GOLD-YYYYMM-NNNN
    
    def test_general_invoice_number_prefix(self):
        """Test that general invoices get INV prefix"""
        db = MockDB()
        invoice_number = generate_invoice_number(db, "general")
        assert invoice_number.startswith("INV-")
        assert len(invoice_number.split("-")) == 3  # INV-YYYYMM-NNNN
    
    def test_invoice_number_format(self):
        """Test invoice number format"""
        db = MockDB()
        invoice_number = generate_invoice_number(db, "general")
        parts = invoice_number.split("-")
        
        assert len(parts) == 3
        assert parts[0] in ["INV", "GOLD"]
        assert len(parts[1]) == 6  # YYYYMM
        assert len(parts[2]) == 4  # NNNN
        assert parts[2].isdigit()

class TestGoldInvoiceCalculations:
    """Test gold invoice calculation accuracy"""
    
    def test_gold_invoice_calculation_accuracy(self):
        """Test accurate calculation for gold invoices"""
        db = MockDB()
        
        # Mock inventory item
        item_id = uuid.uuid4()
        mock_item = MockInventoryItem(item_id, "Gold Ring", "GOLD-001", 10, 150)
        db.items["UniversalInventoryItem"] = [mock_item]
        
        items = [
            schemas.UniversalInvoiceItemCreate(
                inventory_item_id=item_id,
                item_name="Gold Ring",
                quantity=2,
                unit_price=0,
                weight_grams=10.0
            )
        ]
        
        gold_fields = schemas.GoldInvoiceFields(
            gold_price_per_gram=50.0,
            labor_cost_percentage=10.0,
            profit_percentage=20.0,
            vat_percentage=5.0
        )
        
        calculation = calculate_gold_invoice_totals(items, gold_fields, db)
        
        # Expected calculations:
        # Base price: 10.0 * 2 * 50.0 = 1000.0
        # Labor cost: 1000.0 * 0.10 = 100.0
        # Profit: (1000.0 + 100.0) * 0.20 = 220.0
        # VAT: (1000.0 + 100.0 + 220.0) * 0.05 = 66.0
        # Total: 1000.0 + 100.0 + 220.0 + 66.0 = 1386.0
        
        assert calculation.subtotal == Decimal('1000.0')
        assert calculation.total_labor_cost == Decimal('100.0')
        assert calculation.total_profit == Decimal('220.0')
        assert calculation.total_vat == Decimal('66.0')
        assert calculation.grand_total == Decimal('1386.0')
    
    def test_gold_invoice_zero_percentages(self):
        """Test gold invoice calculation with zero percentages"""
        db = MockDB()
        
        item_id = uuid.uuid4()
        mock_item = MockInventoryItem(item_id, "Gold Ring", "GOLD-001", 10, 150)
        db.items["UniversalInventoryItem"] = [mock_item]
        
        items = [
            schemas.UniversalInvoiceItemCreate(
                inventory_item_id=item_id,
                item_name="Gold Ring",
                quantity=1,
                unit_price=0,
                weight_grams=5.0
            )
        ]
        
        gold_fields = schemas.GoldInvoiceFields(
            gold_price_per_gram=60.0,
            labor_cost_percentage=0.0,
            profit_percentage=0.0,
            vat_percentage=0.0
        )
        
        calculation = calculate_gold_invoice_totals(items, gold_fields, db)
        
        # Expected: only base price = 5.0 * 1 * 60.0 = 300.0
        assert calculation.subtotal == Decimal('300.0')
        assert calculation.total_labor_cost == Decimal('0.0')
        assert calculation.total_profit == Decimal('0.0')
        assert calculation.total_vat == Decimal('0.0')
        assert calculation.grand_total == Decimal('300.0')

class TestGeneralInvoiceCalculations:
    """Test general invoice calculation accuracy"""
    
    def test_general_invoice_calculation_accuracy(self):
        """Test accurate calculation for general invoices"""
        db = MockDB()
        
        item_id = uuid.uuid4()
        mock_item = MockInventoryItem(item_id, "Silver Bracelet", "SIL-001", 20, 75)
        db.items["UniversalInventoryItem"] = [mock_item]
        
        items = [
            schemas.UniversalInvoiceItemCreate(
                inventory_item_id=item_id,
                item_name="Silver Bracelet",
                quantity=3,
                unit_price=75.0
            )
        ]
        
        calculation = calculate_general_invoice_totals(items, db)
        
        # Expected: 75.0 * 3 = 225.0
        assert calculation.subtotal == Decimal('225.0')
        assert calculation.total_labor_cost == Decimal('0.0')
        assert calculation.total_profit == Decimal('0.0')
        assert calculation.total_vat == Decimal('0.0')
        assert calculation.grand_total == Decimal('225.0')
    
    def test_general_invoice_uses_inventory_price_when_zero(self):
        """Test that general invoice uses inventory price when unit_price is 0"""
        db = MockDB()
        
        item_id = uuid.uuid4()
        mock_item = MockInventoryItem(item_id, "Silver Bracelet", "SIL-001", 20, 80)
        db.items["UniversalInventoryItem"] = [mock_item]
        
        items = [
            schemas.UniversalInvoiceItemCreate(
                inventory_item_id=item_id,
                item_name="Silver Bracelet",
                quantity=2,
                unit_price=0  # Should use inventory item price
            )
        ]
        
        calculation = calculate_general_invoice_totals(items, db)
        
        # Expected: 80.0 * 2 = 160.0 (using inventory item price)
        assert calculation.subtotal == Decimal('160.0')
        assert calculation.grand_total == Decimal('160.0')

class TestBusinessRuleValidation:
    """Test business rule validation"""
    
    def test_empty_items_validation(self):
        """Test validation when no items are provided"""
        from fastapi import HTTPException
        
        invoice_data = schemas.UniversalInvoiceCreate(
            type="general",
            customer_name="Test Customer",
            items=[]
        )
        
        with pytest.raises(HTTPException) as exc_info:
            validate_invoice_business_rules(invoice_data)
        assert "at least one item" in str(exc_info.value.detail)
    
    def test_gold_invoice_weight_validation(self):
        """Test that gold invoices require weight for items"""
        from fastapi import HTTPException
        
        invoice_data = schemas.UniversalInvoiceCreate(
            type="gold",
            customer_name="Test Customer",
            items=[
                schemas.UniversalInvoiceItemCreate(
                    item_name="Gold Ring",
                    quantity=1,
                    unit_price=0
                    # Missing weight_grams
                )
            ],
            gold_fields=schemas.GoldInvoiceFields(
                gold_price_per_gram=60.0,
                labor_cost_percentage=10.0,
                profit_percentage=15.0,
                vat_percentage=5.0
            )
        )
        
        with pytest.raises(HTTPException) as exc_info:
            validate_invoice_business_rules(invoice_data)
        assert "weight specified" in str(exc_info.value.detail)
    
    def test_gold_invoice_zero_weight_validation(self):
        """Test that gold invoices reject zero weight"""
        from fastapi import HTTPException
        
        invoice_data = schemas.UniversalInvoiceCreate(
            type="gold",
            customer_name="Test Customer",
            items=[
                schemas.UniversalInvoiceItemCreate(
                    item_name="Gold Ring",
                    quantity=1,
                    unit_price=0,
                    weight_grams=0  # Zero weight should fail
                )
            ],
            gold_fields=schemas.GoldInvoiceFields(
                gold_price_per_gram=60.0,
                labor_cost_percentage=10.0,
                profit_percentage=15.0,
                vat_percentage=5.0
            )
        )
        
        with pytest.raises(HTTPException) as exc_info:
            validate_invoice_business_rules(invoice_data)
        assert "weight specified" in str(exc_info.value.detail)

class TestSchemaValidation:
    """Test Pydantic schema validation"""
    
    def test_invoice_type_validation(self):
        """Test that invalid invoice types are rejected"""
        with pytest.raises(ValueError, match='Type must be either'):
            schemas.UniversalInvoiceCreate(
                type="invalid_type",
                customer_name="Test Customer",
                items=[
                    schemas.UniversalInvoiceItemCreate(
                        item_name="Test Item",
                        quantity=1,
                        unit_price=100
                    )
                ]
            )
    
    def test_gold_fields_validation_in_business_rules(self):
        """Test gold fields validation in business rules (not schema level)"""
        from fastapi import HTTPException
        
        # Schema allows creation without gold_fields, but business rules catch it
        invoice_data = schemas.UniversalInvoiceCreate(
            type="gold",
            customer_name="Test Customer",
            items=[
                schemas.UniversalInvoiceItemCreate(
                    item_name="Gold Ring",
                    quantity=1,
                    unit_price=0,
                    weight_grams=5.0
                )
            ]
            # Missing gold_fields - should be caught by business rules
        )
        
        with pytest.raises(HTTPException) as exc_info:
            validate_invoice_business_rules(invoice_data)
        assert "Gold fields are required" in str(exc_info.value.detail)
    
    def test_general_invoice_rejects_gold_fields_in_schema(self):
        """Test that general invoice rejects gold fields in schema"""
        with pytest.raises(ValueError, match="Gold fields should not be provided"):
            schemas.UniversalInvoiceCreate(
                type="general",
                customer_name="Test Customer",
                items=[
                    schemas.UniversalInvoiceItemCreate(
                        item_name="Silver Bracelet",
                        quantity=1,
                        unit_price=75
                    )
                ],
                gold_fields=schemas.GoldInvoiceFields(
                    gold_price_per_gram=60.0,
                    labor_cost_percentage=10.0
                )
            )

class TestConditionalFieldManagement:
    """Test conditional field management for Gold invoices"""
    
    def test_gold_fields_schema_validation(self):
        """Test that gold fields schema validates correctly"""
        gold_fields = schemas.GoldInvoiceFields(
            gold_price_per_gram=50.0,
            labor_cost_percentage=12.0,
            profit_percentage=18.0,
            vat_percentage=8.0,
            gold_sood=90.0,
            gold_ojrat=60.0,
            gold_maliyat=40.0
        )
        
        assert gold_fields.gold_price_per_gram == 50.0
        assert gold_fields.labor_cost_percentage == 12.0
        assert gold_fields.profit_percentage == 18.0
        assert gold_fields.vat_percentage == 8.0
        assert gold_fields.gold_sood == 90.0
        assert gold_fields.gold_ojrat == 60.0
        assert gold_fields.gold_maliyat == 40.0
    
    def test_gold_fields_optional_fields(self):
        """Test that optional gold fields work correctly"""
        gold_fields = schemas.GoldInvoiceFields(
            gold_price_per_gram=50.0,
            labor_cost_percentage=10.0,
            profit_percentage=15.0,
            vat_percentage=5.0
            # Optional fields not provided
        )
        
        assert gold_fields.gold_sood is None
        assert gold_fields.gold_ojrat is None
        assert gold_fields.gold_maliyat is None

if __name__ == "__main__":
    pytest.main([__file__, "-v"])