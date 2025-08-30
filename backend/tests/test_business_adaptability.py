"""
Comprehensive Unit Tests for Universal Business Adaptability System
Tests business type configuration, workflow adaptation, terminology mapping,
custom field schemas, feature configuration, unit management, pricing models, and reporting templates.
"""

import pytest
import asyncio
from decimal import Decimal
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Import models and schemas
from models_business_adaptability import (
    Base, BusinessType, EnhancedBusinessConfiguration, WorkflowRule, 
    CustomFieldDefinition, UnitOfMeasure, PricingRule, ReportTemplate,
    BusinessMigrationLog, FeatureConfiguration
)
from schemas_business_adaptability import (
    BusinessTypeCreate, EnhancedBusinessConfigurationCreate, WorkflowRuleCreate,
    CustomFieldDefinitionCreate, UnitOfMeasureCreate, PricingRuleCreate,
    BusinessMigrationRequest, FeatureConfigurationCreate
)
from services.business_adaptability_service import BusinessAdaptabilityService

class TestBusinessAdaptabilitySystem:
    """Test class for business adaptability system"""
    
    @classmethod
    def setup_class(cls):
        """Set up test database using existing PostgreSQL connection"""
        # Use the existing database connection from the main application
        from database import engine, SessionLocal
        cls.engine = engine
        cls.SessionLocal = SessionLocal
        
        # Create tables
        Base.metadata.create_all(bind=cls.engine)
    
    @classmethod
    def teardown_class(cls):
        """Clean up test database"""
        # Clean up test data
        pass
    
    def setup_method(self):
        """Set up test session"""
        self.db = self.SessionLocal()
        self.service = BusinessAdaptabilityService(self.db)
        
        # Clean up any existing test data
        self.db.query(BusinessMigrationLog).delete()
        self.db.query(FeatureConfiguration).delete()
        self.db.query(ReportTemplate).filter(ReportTemplate.business_configuration_id.isnot(None)).delete()
        self.db.query(PricingRule).delete()
        self.db.query(UnitOfMeasure).filter(UnitOfMeasure.business_configuration_id.isnot(None)).delete()
        self.db.query(CustomFieldDefinition).delete()
        self.db.query(WorkflowRule).delete()
        self.db.query(EnhancedBusinessConfiguration).delete()
        self.db.query(BusinessType).filter(BusinessType.type_code.like('%test%')).delete()
        self.db.commit()
    
    def teardown_method(self):
        """Clean up test session"""
        # Clean up test data
        try:
            self.db.query(BusinessMigrationLog).delete()
            self.db.query(FeatureConfiguration).delete()
            self.db.query(ReportTemplate).filter(ReportTemplate.business_configuration_id.isnot(None)).delete()
            self.db.query(PricingRule).delete()
            self.db.query(UnitOfMeasure).filter(UnitOfMeasure.business_configuration_id.isnot(None)).delete()
            self.db.query(CustomFieldDefinition).delete()
            self.db.query(WorkflowRule).delete()
            self.db.query(EnhancedBusinessConfiguration).delete()
            self.db.query(BusinessType).filter(BusinessType.type_code.like('%test%')).delete()
            self.db.commit()
        except:
            self.db.rollback()
        finally:
            self.db.close()
    
    # Business Type Tests
    @pytest.mark.asyncio
    async def test_create_business_type(self):
        """Test creating a business type"""
        business_type_data = BusinessTypeCreate(
            type_code="retail_jewelry",
            name="Retail Jewelry Store",
            name_persian="فروشگاه جواهرات",
            description="Jewelry retail business type",
            icon="jewelry",
            color="#FFD700",
            industry_category="retail",
            default_configuration={
                "inventory_tracking": True,
                "weight_based_pricing": True,
                "precious_metals": True
            },
            default_terminology={
                "item": "jewelry_piece",
                "category": "jewelry_type",
                "price": "market_price"
            },
            default_feature_flags={
                "weight_tracking": True,
                "purity_tracking": True,
                "certificate_management": True,
                "price_fluctuation": True
            },
            default_units=[
                {
                    "unit_code": "gram",
                    "unit_name": "Gram",
                    "unit_type": "weight",
                    "conversion_factor": 1,
                    "decimal_places": 3
                },
                {
                    "unit_code": "carat",
                    "unit_name": "Carat",
                    "unit_type": "weight",
                    "conversion_factor": 0.2,
                    "decimal_places": 2
                }
            ],
            default_pricing_models=[
                {
                    "rule_name": "Gold Weight Pricing",
                    "rule_type": "weight_based",
                    "applies_to": "all",
                    "pricing_model": {
                        "base_price_per_gram": 60,
                        "purity_multiplier": True
                    }
                }
            ]
        )
        
        business_type = await self.service.create_business_type(business_type_data)
        
        assert business_type.type_code == "retail_jewelry"
        assert business_type.name == "Retail Jewelry Store"
        assert business_type.default_configuration["weight_based_pricing"] is True
        assert "jewelry_piece" in business_type.default_terminology.values()
        assert business_type.default_feature_flags["weight_tracking"] is True
        assert len(business_type.default_units) == 2
        assert len(business_type.default_pricing_models) == 1
    
    @pytest.mark.asyncio
    async def test_get_business_types(self):
        """Test retrieving business types"""
        # Create test business types
        await self.service.create_business_type(BusinessTypeCreate(
            type_code="restaurant",
            name="Restaurant",
            industry_category="service"
        ))
        
        await self.service.create_business_type(BusinessTypeCreate(
            type_code="pharmacy",
            name="Pharmacy",
            industry_category="healthcare"
        ))
        
        business_types = await self.service.get_business_types()
        assert len(business_types) >= 2
        
        type_codes = [bt.type_code for bt in business_types]
        assert "restaurant" in type_codes
        assert "pharmacy" in type_codes
    
    # Business Configuration Tests
    @pytest.mark.asyncio
    async def test_create_business_configuration(self):
        """Test creating a business configuration"""
        # First create a business type
        business_type = await self.service.create_business_type(BusinessTypeCreate(
            type_code="gold_shop",
            name="Gold Shop",
            default_configuration={"precious_metals": True},
            default_terminology={"item": "gold_item"},
            default_feature_flags={"weight_tracking": True},
            default_units=[{"unit_code": "gram", "unit_name": "Gram", "unit_type": "weight"}],
            default_pricing_models=[{"rule_name": "Gold Pricing", "rule_type": "weight_based"}]
        ))
        
        config_data = EnhancedBusinessConfigurationCreate(
            business_type_id=business_type.id,
            business_name="Golden Palace Jewelry",
            business_address="123 Gold Street, Jewelry District",
            business_phone="+1-555-0123",
            business_email="info@goldenpalace.com",
            currency="USD",
            timezone="America/New_York",
            configuration={
                "daily_price_updates": True,
                "certificate_required": True
            }
        )
        
        business_config = await self.service.create_business_configuration(config_data)
        
        assert business_config.business_name == "Golden Palace Jewelry"
        assert business_config.business_type_id == business_type.id
        assert business_config.configuration["precious_metals"] is True  # Inherited from type
        assert business_config.configuration["daily_price_updates"] is True  # Custom config
        assert business_config.terminology_mapping["item"] == "gold_item"  # Inherited
        assert business_config.feature_flags["weight_tracking"] is True  # Inherited
    
    # Workflow Rule Tests
    @pytest.mark.asyncio
    async def test_create_and_execute_workflow_rule(self):
        """Test creating and executing workflow rules"""
        # Create business configuration
        business_type = await self.service.create_business_type(BusinessTypeCreate(
            type_code="auto_shop",
            name="Auto Shop"
        ))
        
        business_config = await self.service.create_business_configuration(
            EnhancedBusinessConfigurationCreate(
                business_type_id=business_type.id,
                business_name="Mike's Auto Repair"
            )
        )
        
        # Create workflow rule
        rule_data = WorkflowRuleCreate(
            business_configuration_id=business_config.id,
            rule_name="High Value Item Alert",
            rule_type="inventory",
            entity_type="item",
            conditions={
                "price": {"gt": 1000}
            },
            actions={
                "add_tag": ["high_value"],
                "set_field": {
                    "requires_approval": True,
                    "insurance_required": True
                },
                "send_notification": {
                    "type": "email",
                    "recipients": ["manager@mikesauto.com"],
                    "message": "High value item added to inventory"
                }
            },
            priority=10
        )
        
        workflow_rule = await self.service.create_workflow_rule(rule_data)
        assert workflow_rule.rule_name == "High Value Item Alert"
        assert workflow_rule.priority == 10
        
        # Test rule execution
        entity_data = {
            "name": "Premium Engine",
            "price": 1500,
            "category": "engines",
            "tags": ["automotive"]
        }
        
        result = await self.service.execute_workflow_rules(
            business_config.id, "inventory", "item", entity_data
        )
        
        assert len(result["executed_rules"]) == 1
        assert result["executed_rules"][0]["rule_name"] == "High Value Item Alert"
        assert "high_value" in result["modifications"]["tags"]
        assert result["modifications"]["requires_approval"] is True
        assert result["modifications"]["insurance_required"] is True
        assert len(result["modifications"]["_notifications"]) == 1
    
    # Custom Field Tests
    @pytest.mark.asyncio
    async def test_create_custom_field_and_validation(self):
        """Test creating custom fields and validation"""
        # Create business configuration
        business_type = await self.service.create_business_type(BusinessTypeCreate(
            type_code="pharmacy_test",
            name="Pharmacy"
        ))
        
        business_config = await self.service.create_business_configuration(
            EnhancedBusinessConfigurationCreate(
                business_type_id=business_type.id,
                business_name="City Pharmacy"
            )
        )
        
        # Create custom field for prescription number
        field_data = CustomFieldDefinitionCreate(
            business_configuration_id=business_config.id,
            field_name="Prescription Number",
            field_key="prescription_number",
            entity_type="item",
            field_type="text",
            field_config={
                "format": "RX-XXXXXX"
            },
            validation_rules={
                "pattern": r"^RX-\d{6}$",
                "min_length": 9,
                "max_length": 9
            },
            display_name="Prescription Number",
            display_name_persian="شماره نسخه",
            is_required=True,
            is_searchable=True,
            business_rules={
                "unique_within_category": True
            }
        )
        
        custom_field = await self.service.create_custom_field(field_data)
        assert custom_field.field_name == "Prescription Number"
        assert custom_field.is_required is True
        
        # Test field validation - valid data
        valid_data = {
            "prescription_number": "RX-123456",
            "medication_name": "Aspirin",
            "dosage": "100mg"
        }
        
        validation_result = await self.service.validate_custom_field_data(
            business_config.id, "item", valid_data
        )
        
        assert validation_result["valid"] is True
        assert len(validation_result["errors"]) == 0
        
        # Test field validation - invalid data
        invalid_data = {
            "prescription_number": "INVALID",
            "medication_name": "Aspirin"
        }
        
        validation_result = await self.service.validate_custom_field_data(
            business_config.id, "item", invalid_data
        )
        
        assert validation_result["valid"] is False
        assert "prescription_number" in validation_result["errors"]
    
    # Unit of Measure Tests
    @pytest.mark.asyncio
    async def test_unit_of_measure_management(self):
        """Test unit of measure creation and conversion"""
        # Create business configuration
        business_type = await self.service.create_business_type(BusinessTypeCreate(
            type_code="bakery",
            name="Bakery"
        ))
        
        business_config = await self.service.create_business_configuration(
            EnhancedBusinessConfigurationCreate(
                business_type_id=business_type.id,
                business_name="Sweet Dreams Bakery"
            )
        )
        
        # Create units of measure
        kg_unit = await self.service.create_unit_of_measure(UnitOfMeasureCreate(
            business_configuration_id=business_config.id,
            unit_code="kg",
            unit_name="Kilogram",
            unit_symbol="kg",
            unit_type="weight",
            base_unit="kg",
            conversion_factor=Decimal('1'),
            decimal_places=3
        ))
        
        gram_unit = await self.service.create_unit_of_measure(UnitOfMeasureCreate(
            business_configuration_id=business_config.id,
            unit_code="g",
            unit_name="Gram",
            unit_symbol="g",
            unit_type="weight",
            base_unit="kg",
            conversion_factor=Decimal('0.001'),
            decimal_places=1
        ))
        
        pound_unit = await self.service.create_unit_of_measure(UnitOfMeasureCreate(
            business_configuration_id=business_config.id,
            unit_code="lb",
            unit_name="Pound",
            unit_symbol="lb",
            unit_type="weight",
            base_unit="kg",
            conversion_factor=Decimal('0.453592'),
            decimal_places=2
        ))
        
        # Test unit conversion
        # Convert 2 kg to grams
        converted_value = await self.service.convert_units(
            Decimal('2'), "kg", "g", business_config.id
        )
        assert converted_value == Decimal('2000')
        
        # Convert 1000 grams to kg
        converted_value = await self.service.convert_units(
            Decimal('1000'), "g", "kg", business_config.id
        )
        assert converted_value == Decimal('1')
        
        # Convert 2.2 pounds to kg (approximately 1 kg)
        converted_value = await self.service.convert_units(
            Decimal('2.2'), "lb", "kg", business_config.id
        )
        assert abs(converted_value - Decimal('1')) < Decimal('0.01')  # Allow small rounding difference
    
    # Pricing Rule Tests
    @pytest.mark.asyncio
    async def test_pricing_rules_and_calculation(self):
        """Test pricing rule creation and price calculation"""
        # Create business configuration
        business_type = await self.service.create_business_type(BusinessTypeCreate(
            type_code="electronics",
            name="Electronics Store"
        ))
        
        business_config = await self.service.create_business_configuration(
            EnhancedBusinessConfigurationCreate(
                business_type_id=business_type.id,
                business_name="Tech World"
            )
        )
        
        # Create quantity-based pricing rule
        quantity_rule = await self.service.create_pricing_rule(PricingRuleCreate(
            business_configuration_id=business_config.id,
            rule_name="Bulk Discount",
            rule_type="tiered",
            applies_to="all",
            pricing_model={
                "tiers": [
                    {"min_quantity": 1, "max_quantity": 9, "discount_percent": 0},
                    {"min_quantity": 10, "max_quantity": 49, "discount_percent": 5},
                    {"min_quantity": 50, "max_quantity": None, "discount_percent": 10}
                ]
            },
            priority=10
        ))
        
        # Create markup pricing rule
        markup_rule = await self.service.create_pricing_rule(PricingRuleCreate(
            business_configuration_id=business_config.id,
            rule_name="Standard Markup",
            rule_type="markup",
            applies_to="all",
            pricing_model={
                "markup_percent": 25
            },
            priority=5
        ))
        
        # Test price calculation for small quantity (no bulk discount)
        entity_id = uuid4()
        result = await self.service.calculate_price(
            business_config.id, "item", entity_id, Decimal('100'), Decimal('5')
        )
        
        # Should apply 25% markup only
        assert result["base_price"] == Decimal('100')
        assert result["final_price"] == Decimal('125')  # 100 + 25% markup
        assert result["total_price"] == Decimal('625')  # 125 * 5 quantity
        assert len(result["applied_rules"]) == 1
        assert result["applied_rules"][0]["rule_name"] == "Standard Markup"
        
        # Test price calculation for bulk quantity (with discount)
        result = await self.service.calculate_price(
            business_config.id, "item", entity_id, Decimal('100'), Decimal('15')
        )
        
        # Should apply markup first, then bulk discount
        expected_markup_price = Decimal('125')  # 100 + 25%
        expected_discount = expected_markup_price * Decimal('0.05')  # 5% bulk discount
        expected_final_price = expected_markup_price - expected_discount
        
        assert result["base_price"] == Decimal('100')
        assert abs(result["final_price"] - expected_final_price) < Decimal('0.01')
        assert len(result["applied_rules"]) == 2
    
    # Business Migration Tests
    @pytest.mark.asyncio
    async def test_business_type_migration(self):
        """Test business type migration"""
        # Create source business type
        source_type = await self.service.create_business_type(BusinessTypeCreate(
            type_code="small_retail",
            name="Small Retail Store",
            default_feature_flags={
                "basic_inventory": True,
                "simple_pricing": True
            }
        ))
        
        # Create target business type
        target_type = await self.service.create_business_type(BusinessTypeCreate(
            type_code="enterprise_retail",
            name="Enterprise Retail Store",
            default_feature_flags={
                "basic_inventory": True,
                "simple_pricing": True,
                "advanced_analytics": True,
                "multi_location": True,
                "advanced_pricing": True
            }
        ))
        
        # Create business configuration
        business_config = await self.service.create_business_configuration(
            EnhancedBusinessConfigurationCreate(
                business_type_id=source_type.id,
                business_name="Growing Store"
            )
        )
        
        # Create migration request
        migration_request = BusinessMigrationRequest(
            to_business_type_id=target_type.id,
            migration_reason="Business expansion requires enterprise features",
            preserve_data=True
        )
        
        # Execute migration
        migration_log = await self.service.migrate_business_type(
            business_config.id, migration_request
        )
        
        assert migration_log.from_business_type == "small_retail"
        assert migration_log.to_business_type == "enterprise_retail"
        assert migration_log.status == "completed"
        assert migration_log.progress_percentage == 100
        
        # Verify business configuration was updated
        updated_config = await self.service.get_business_configuration(business_config.id)
        assert updated_config.business_type_id == target_type.id
        assert updated_config.migrated_from_type == "small_retail"
        assert updated_config.migration_date is not None
        
        # Verify new features are available
        assert "advanced_analytics" in updated_config.feature_flags
        assert "multi_location" in updated_config.feature_flags
    
    # Terminology and Localization Tests
    @pytest.mark.asyncio
    async def test_terminology_mapping(self):
        """Test terminology mapping and translation"""
        # Create business configuration
        business_type = await self.service.create_business_type(BusinessTypeCreate(
            type_code="medical_clinic",
            name="Medical Clinic",
            default_terminology={
                "item": "medical_supply",
                "customer": "patient",
                "invoice": "bill"
            }
        ))
        
        business_config = await self.service.create_business_configuration(
            EnhancedBusinessConfigurationCreate(
                business_type_id=business_type.id,
                business_name="City Medical Center"
            )
        )
        
        # Test getting terminology mapping
        terminology = await self.service.get_terminology_mapping(business_config.id)
        assert terminology["item"] == "medical_supply"
        assert terminology["customer"] == "patient"
        
        # Test updating terminology
        updates = {
            "category": "medical_category",
            "price": "service_fee",
            "item": "medical_equipment"  # Override existing
        }
        
        updated_terminology = await self.service.update_terminology_mapping(
            business_config.id, updates
        )
        
        assert updated_terminology["category"] == "medical_category"
        assert updated_terminology["price"] == "service_fee"
        assert updated_terminology["item"] == "medical_equipment"  # Should be updated
        assert updated_terminology["customer"] == "patient"  # Should remain
        
        # Test term translation
        translated = await self.service.translate_term(business_config.id, "item")
        assert translated == "medical_equipment"
        
        translated = await self.service.translate_term(business_config.id, "unknown_term")
        assert translated == "unknown_term"  # Should return original if not found
    
    # Integration Tests
    @pytest.mark.asyncio
    async def test_complete_business_setup_workflow(self):
        """Test complete business setup workflow"""
        # 1. Create business type with comprehensive configuration
        business_type = await self.service.create_business_type(BusinessTypeCreate(
            type_code="comprehensive_retail",
            name="Comprehensive Retail Store",
            description="Full-featured retail business type",
            default_configuration={
                "multi_currency": True,
                "tax_calculation": True,
                "loyalty_program": True
            },
            default_terminology={
                "item": "product",
                "customer": "shopper",
                "invoice": "receipt"
            },
            default_feature_flags={
                "inventory_tracking": True,
                "customer_management": True,
                "reporting": True,
                "promotions": True
            },
            default_units=[
                {"unit_code": "pcs", "unit_name": "Pieces", "unit_type": "count"},
                {"unit_code": "box", "unit_name": "Box", "unit_type": "count"}
            ],
            default_pricing_models=[
                {
                    "rule_name": "Standard Retail Markup",
                    "rule_type": "markup",
                    "applies_to": "all",
                    "pricing_model": {"markup_percent": 50}
                }
            ]
        ))
        
        # 2. Create business configuration
        business_config = await self.service.create_business_configuration(
            EnhancedBusinessConfigurationCreate(
                business_type_id=business_type.id,
                business_name="SuperMart Plus",
                business_address="456 Commerce Ave, Business District",
                business_phone="+1-555-0199",
                business_email="contact@supermartplus.com",
                currency="USD",
                timezone="America/Los_Angeles",
                configuration={
                    "store_hours": "9AM-9PM",
                    "delivery_available": True
                }
            )
        )
        
        # 3. Add custom fields
        await self.service.create_custom_field(CustomFieldDefinitionCreate(
            business_configuration_id=business_config.id,
            field_name="Product SKU",
            field_key="sku",
            entity_type="item",
            field_type="text",
            display_name="SKU",
            is_required=True,
            is_searchable=True,
            validation_rules={"pattern": r"^[A-Z]{2}\d{6}$"}
        ))
        
        await self.service.create_custom_field(CustomFieldDefinitionCreate(
            business_configuration_id=business_config.id,
            field_name="Loyalty Points",
            field_key="loyalty_points",
            entity_type="customer",
            field_type="number",
            display_name="Loyalty Points",
            validation_rules={"min": 0}
        ))
        
        # 4. Add workflow rules
        await self.service.create_workflow_rule(WorkflowRuleCreate(
            business_configuration_id=business_config.id,
            rule_name="Low Stock Alert",
            rule_type="inventory",
            entity_type="item",
            conditions={"stock_quantity": {"lt": 10}},
            actions={
                "add_tag": ["low_stock"],
                "send_notification": {
                    "type": "email",
                    "message": "Low stock alert"
                }
            }
        ))
        
        # 5. Add additional pricing rules
        await self.service.create_pricing_rule(PricingRuleCreate(
            business_configuration_id=business_config.id,
            rule_name="Loyalty Discount",
            rule_type="formula",
            applies_to="all",
            formula="{base_price} * (1 - {loyalty_discount})",
            conditions={"customer_type": "loyalty_member"},
            priority=15
        ))
        
        # 6. Verify complete setup
        custom_fields = await self.service.get_custom_fields(business_config.id)
        workflow_rules = await self.service.get_workflow_rules(business_config.id)
        pricing_rules = await self.service.get_pricing_rules(business_config.id)
        units = await self.service.get_units_of_measure(business_config.id)
        
        assert len(custom_fields) == 2
        assert len(workflow_rules) == 1
        assert len(pricing_rules) == 2  # Default + custom
        assert len(units) >= 2  # Default units
        
        # 7. Test integrated functionality
        # Validate custom field data
        validation_result = await self.service.validate_custom_field_data(
            business_config.id, "item", {
                "sku": "AB123456",
                "name": "Test Product",
                "price": 29.99
            }
        )
        assert validation_result["valid"] is True
        
        # Execute workflow rules
        workflow_result = await self.service.execute_workflow_rules(
            business_config.id, "inventory", "item", {
                "name": "Test Product",
                "stock_quantity": 5,
                "sku": "AB123456"
            }
        )
        assert len(workflow_result["executed_rules"]) == 1
        assert "low_stock" in workflow_result["modifications"]["tags"]
        
        # Calculate pricing
        entity_id = uuid4()
        pricing_result = await self.service.calculate_price(
            business_config.id, "item", entity_id, Decimal('20'), Decimal('1'), {
                "customer_type": "loyalty_member",
                "loyalty_discount": 0.1
            }
        )
        
        # Should apply both markup and loyalty discount
        assert len(pricing_result["applied_rules"]) >= 1
        assert pricing_result["final_price"] != pricing_result["base_price"]
    
    # Error Handling Tests
    @pytest.mark.asyncio
    async def test_error_handling(self):
        """Test error handling in various scenarios"""
        # Test creating business configuration with invalid business type
        with pytest.raises(ValueError, match="Business type not found"):
            await self.service.create_business_configuration(
                EnhancedBusinessConfigurationCreate(
                    business_type_id=uuid4(),  # Non-existent ID
                    business_name="Invalid Config"
                )
            )
        
        # Test unit conversion with incompatible types
        business_type = await self.service.create_business_type(BusinessTypeCreate(
            type_code="test_error",
            name="Test Error Handling"
        ))
        
        business_config = await self.service.create_business_configuration(
            EnhancedBusinessConfigurationCreate(
                business_type_id=business_type.id,
                business_name="Error Test Business"
            )
        )
        
        # Create units of different types
        await self.service.create_unit_of_measure(UnitOfMeasureCreate(
            business_configuration_id=business_config.id,
            unit_code="kg_test",
            unit_name="Kilogram",
            unit_type="weight"
        ))
        
        await self.service.create_unit_of_measure(UnitOfMeasureCreate(
            business_configuration_id=business_config.id,
            unit_code="liter_test",
            unit_name="Liter",
            unit_type="volume"
        ))
        
        # Test conversion between incompatible unit types
        with pytest.raises(ValueError, match="Cannot convert between different unit types"):
            await self.service.convert_units(
                Decimal('1'), "kg_test", "liter_test", business_config.id
            )
        
        # Test migration with invalid target type
        with pytest.raises(ValueError, match="Target business type not found"):
            await self.service.migrate_business_type(
                business_config.id,
                BusinessMigrationRequest(
                    to_business_type_id=uuid4(),  # Non-existent ID
                    migration_reason="Test migration"
                )
            )

# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])