"""
Standalone Business Configuration Tests

Comprehensive tests for business configuration system without importing main app
to avoid table conflicts. Tests with real PostgreSQL database in Docker.
"""

import pytest
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import required modules directly
from database import get_db, engine, DATABASE_URL
from services.business_config_service import BusinessConfigurationService
from schemas_business_config import (
    BusinessTypeConfigurationCreate, BusinessTypeEnum,
    BusinessTypeDetectionRequest, BusinessSetupWizardRequest,
    TerminologyMappingCreate, WorkflowConfigurationCreate,
    CustomFieldSchemaCreate, FeatureConfigurationCreate,
    ServiceCatalogCreate, BillOfMaterialsCreate, ProductionTrackingCreate,
    WorkflowTypeEnum, FieldTypeEnum
)

# Create test engine and session
test_engine = create_engine(DATABASE_URL)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture
def db_session():
    """Create a database session for testing"""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def business_config_service(db_session):
    """Create business configuration service"""
    return BusinessConfigurationService(db_session)

class TestBusinessConfigurationCRUD:
    """Test basic CRUD operations for business configurations"""
    
    def test_create_and_retrieve_business_configuration(self, business_config_service):
        """Test creating and retrieving business configuration"""
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.GOLD_SHOP,
            name="Premium Gold Shop",
            description="High-end gold jewelry and precious metals store",
            industry="Jewelry & Precious Metals",
            is_active=True,
            is_default=False
        )
        
        # Create configuration
        config = business_config_service.create_business_configuration(config_data)
        
        # Verify creation
        assert config.id is not None
        assert config.business_type == BusinessTypeEnum.GOLD_SHOP
        assert config.name == "Premium Gold Shop"
        assert config.description == "High-end gold jewelry and precious metals store"
        assert config.industry == "Jewelry & Precious Metals"
        assert config.is_active is True
        assert config.created_at is not None
        
        # Retrieve configuration
        retrieved_config = business_config_service.get_business_configuration(config.id)
        assert retrieved_config is not None
        assert retrieved_config.id == config.id
        assert retrieved_config.business_type == BusinessTypeEnum.GOLD_SHOP
        assert retrieved_config.name == "Premium Gold Shop"
        
        # Retrieve by business type
        type_config = business_config_service.get_business_configuration_by_type(BusinessTypeEnum.GOLD_SHOP)
        assert type_config is not None
        assert type_config.id == config.id
    
    def test_business_configuration_with_relationships(self, business_config_service):
        """Test business configuration with all relationships"""
        # Create business configuration
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.SERVICE_BUSINESS,
            name="TechConsult Pro",
            description="Professional IT consulting services",
            industry="Information Technology",
            is_active=True
        )
        
        config = business_config_service.create_business_configuration(config_data)
        
        # Add terminology mapping
        terminology_data = TerminologyMappingCreate(
            business_config_id=config.id,
            standard_term="inventory",
            business_term="Services",
            context="inventory",
            category="field_label",
            language_code="en"
        )
        
        terminology = business_config_service.create_terminology_mapping(terminology_data)
        assert terminology.id is not None
        assert terminology.business_config_id == config.id
        assert terminology.standard_term == "inventory"
        assert terminology.business_term == "Services"
        
        # Add workflow configuration
        workflow_data = WorkflowConfigurationCreate(
            business_config_id=config.id,
            workflow_type=WorkflowTypeEnum.INVOICE_WORKFLOW,
            workflow_name="Service Invoice Workflow",
            stages=[
                {"name": "Draft", "order": 1, "is_required": True},
                {"name": "In Progress", "order": 2, "is_required": True},
                {"name": "Completed", "order": 3, "is_required": True}
            ],
            rules=[
                {
                    "name": "Auto Progress Small Jobs",
                    "condition": {"hours": {"lt": 2}},
                    "action": {"type": "auto_progress"},
                    "is_active": True
                }
            ],
            is_active=True
        )
        
        workflow = business_config_service.create_workflow_configuration(workflow_data)
        assert workflow.id is not None
        assert workflow.business_config_id == config.id
        assert workflow.workflow_type == WorkflowTypeEnum.INVOICE_WORKFLOW
        assert len(workflow.stages) == 3
        assert len(workflow.rules) == 1
        
        # Add custom field
        field_data = CustomFieldSchemaCreate(
            business_config_id=config.id,
            field_name="skill_level",
            field_label="Required Skill Level",
            field_type=FieldTypeEnum.ENUM,
            entity_type="service",
            field_options=[
                {"value": "junior", "label": "Junior Level"},
                {"value": "senior", "label": "Senior Level"},
                {"value": "expert", "label": "Expert Level"}
            ],
            is_required=True,
            is_searchable=True,
            is_filterable=True
        )
        
        field = business_config_service.create_custom_field_schema(field_data)
        assert field.id is not None
        assert field.business_config_id == config.id
        assert field.field_name == "skill_level"
        assert field.field_type == FieldTypeEnum.ENUM
        assert len(field.field_options) == 3
        
        # Add feature configuration
        feature_data = FeatureConfigurationCreate(
            business_config_id=config.id,
            feature_name="time_tracking",
            feature_category="service",
            is_enabled=True,
            configuration={"track_billable_hours": True, "automatic_timers": True},
            required_roles=["consultant", "manager"]
        )
        
        feature = business_config_service.create_feature_configuration(feature_data)
        assert feature.id is not None
        assert feature.business_config_id == config.id
        assert feature.feature_name == "time_tracking"
        assert feature.is_enabled is True
        assert feature.configuration["track_billable_hours"] is True
        
        # Verify complete configuration retrieval
        complete_config = business_config_service.get_business_configuration(config.id)
        assert complete_config is not None
        assert len(complete_config.terminology_mappings) >= 1
        assert len(complete_config.workflow_configurations) >= 1
        assert len(complete_config.custom_field_schemas) >= 1
        assert len(complete_config.feature_configurations) >= 1

class TestBusinessTypeDetection:
    """Test business type detection functionality"""
    
    def test_gold_shop_detection_english(self, business_config_service):
        """Test gold shop detection with English keywords"""
        detection_request = BusinessTypeDetectionRequest(
            business_description="We sell gold jewelry, precious metals, and gold coins. We specialize in 18k and 24k gold items.",
            industry="Jewelry",
            primary_activities=["gold trading", "jewelry sales", "precious metals"],
            customer_types=["individual customers", "collectors"]
        )
        
        result = business_config_service.detect_business_type(detection_request)
        
        assert result.suggested_business_type == BusinessTypeEnum.GOLD_SHOP
        assert result.confidence_score > 0.6
        assert "gold" in result.reasoning.lower()
        assert len(result.alternative_suggestions) >= 0
    
    def test_gold_shop_detection_persian(self, business_config_service):
        """Test gold shop detection with Persian keywords"""
        detection_request = BusinessTypeDetectionRequest(
            business_description="ما یک فروشگاه طلا و جواهرات هستیم که انواع طلا و سکه می‌فروشیم",
            industry="طلا و جواهرات",
            primary_activities=["فروش طلا", "فروش سکه", "جواهرات"],
            customer_types=["مشتریان عادی"]
        )
        
        result = business_config_service.detect_business_type(detection_request)
        
        assert result.suggested_business_type == BusinessTypeEnum.GOLD_SHOP
        assert result.confidence_score > 0.5
    
    def test_restaurant_detection(self, business_config_service):
        """Test restaurant detection"""
        detection_request = BusinessTypeDetectionRequest(
            business_description="We operate a fine dining restaurant serving Italian cuisine with a full kitchen and dining room.",
            industry="Food Service",
            primary_activities=["food preparation", "dining service", "catering"],
            customer_types=["diners", "event organizers"]
        )
        
        result = business_config_service.detect_business_type(detection_request)
        
        assert result.suggested_business_type == BusinessTypeEnum.RESTAURANT
        assert result.confidence_score > 0.5
        assert "restaurant" in result.reasoning.lower()
    
    def test_service_business_detection(self, business_config_service):
        """Test service business detection"""
        detection_request = BusinessTypeDetectionRequest(
            business_description="We provide professional consulting services, technical support, and maintenance services to businesses.",
            industry="Professional Services",
            primary_activities=["consulting", "maintenance", "support", "professional services"],
            customer_types=["businesses", "organizations"]
        )
        
        result = business_config_service.detect_business_type(detection_request)
        
        assert result.suggested_business_type == BusinessTypeEnum.SERVICE_BUSINESS
        assert result.confidence_score > 0.5
    
    def test_manufacturing_detection(self, business_config_service):
        """Test manufacturing detection"""
        detection_request = BusinessTypeDetectionRequest(
            business_description="We manufacture electronic components and assemble products for various industries using advanced production lines.",
            industry="Manufacturing",
            primary_activities=["manufacturing", "production", "assembly", "components"],
            customer_types=["businesses", "distributors", "retailers"]
        )
        
        result = business_config_service.detect_business_type(detection_request)
        
        assert result.suggested_business_type == BusinessTypeEnum.MANUFACTURING
        assert result.confidence_score > 0.6

class TestBusinessSetupWizard:
    """Test business setup wizard functionality"""
    
    def test_complete_gold_shop_setup(self, business_config_service):
        """Test complete gold shop setup with wizard"""
        setup_request = BusinessSetupWizardRequest(
            business_type=BusinessTypeEnum.GOLD_SHOP,
            business_name="Golden Treasures",
            industry="Jewelry & Precious Metals",
            features_to_enable=[
                "inventory_management",
                "gold_calculations",
                "weight_tracking",
                "purity_management"
            ],
            custom_terminology={
                "inventory": "Gold Items",
                "customer": "Customer",
                "weight": "Weight (گرم)",
                "purity": "Purity (عیار)"
            }
        )
        
        config = business_config_service.setup_business_wizard(setup_request)
        
        # Verify configuration
        assert config.id is not None
        assert config.business_type == BusinessTypeEnum.GOLD_SHOP
        assert config.name == "Golden Treasures"
        assert config.industry == "Jewelry & Precious Metals"
        assert config.is_default is True
        
        # Verify terminology mappings
        mappings = business_config_service.get_terminology_mappings(config.id)
        mapping_dict = {m.standard_term: m.business_term for m in mappings}
        
        assert mapping_dict.get("inventory") == "Gold Items"
        assert mapping_dict.get("weight") == "Weight (گرم)"
        assert mapping_dict.get("purity") == "Purity (عیار)"
        
        # Verify features were enabled
        features = business_config_service.get_feature_configurations(config.id)
        feature_names = [f.feature_name for f in features]
        
        assert "inventory_management" in feature_names
        assert "gold_calculations" in feature_names
        assert "weight_tracking" in feature_names
        
        # Verify default configurations were created
        workflows = business_config_service.get_workflow_configurations(config.id)
        assert len(workflows) >= 1
        
        # Verify complete configuration retrieval
        complete_config = business_config_service.get_business_configuration(config.id)
        assert complete_config is not None
        assert len(complete_config.terminology_mappings) >= 4
        assert len(complete_config.workflow_configurations) >= 1
        assert len(complete_config.feature_configurations) >= 4
    
    def test_service_business_setup_with_catalog(self, business_config_service):
        """Test service business setup with service catalog"""
        setup_request = BusinessSetupWizardRequest(
            business_type=BusinessTypeEnum.SERVICE_BUSINESS,
            business_name="ProTech Solutions",
            industry="Technology Services",
            features_to_enable=[
                "time_tracking",
                "service_catalog",
                "appointment_booking",
                "project_management"
            ],
            custom_terminology={
                "inventory": "Services",
                "customer": "Client",
                "invoice": "Service Invoice"
            }
        )
        
        config = business_config_service.setup_business_wizard(setup_request)
        
        # Verify configuration
        assert config.business_type == BusinessTypeEnum.SERVICE_BUSINESS
        assert config.name == "ProTech Solutions"
        
        # Verify service catalog was initialized
        service_catalog = business_config_service.get_service_catalog(config.id)
        assert len(service_catalog) >= 2  # Default services should be created
        
        service_names = [service.service_name for service in service_catalog]
        assert "Consultation" in service_names
        assert "Maintenance" in service_names
        
        # Add additional service
        additional_service = ServiceCatalogCreate(
            business_config_id=config.id,
            service_name="System Integration",
            service_code="SYS_INT",
            description="Complete system integration service",
            category="Integration",
            base_price="200.00",
            currency="USD",
            estimated_duration=480,  # 8 hours
            requires_booking=True,
            is_time_tracked=True,
            billing_method="project"
        )
        
        service = business_config_service.create_service_catalog_item(additional_service)
        assert service.id is not None
        assert service.service_name == "System Integration"
        assert service.billing_method == "project"
        
        # Verify updated catalog
        updated_catalog = business_config_service.get_service_catalog(config.id)
        assert len(updated_catalog) >= 3

class TestManufacturingSupport:
    """Test manufacturing business support"""
    
    def test_manufacturing_with_bom_and_production(self, business_config_service):
        """Test manufacturing setup with BOM and production tracking"""
        # Create manufacturing configuration
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.MANUFACTURING,
            name="TechParts Manufacturing",
            description="Electronic components manufacturing",
            industry="Electronics Manufacturing"
        )
        
        config = business_config_service.create_business_configuration(config_data)
        
        # Create Bill of Materials
        bom_data = BillOfMaterialsCreate(
            business_config_id=config.id,
            bom_name="Smartphone Assembly",
            bom_code="PHONE_001",
            product_id=uuid.uuid4(),
            version="1.0",
            components=[
                {
                    "component_id": str(uuid.uuid4()),
                    "component_name": "Circuit Board",
                    "quantity": 1.0,
                    "unit": "piece",
                    "cost_per_unit": 25.50
                },
                {
                    "component_id": str(uuid.uuid4()),
                    "component_name": "Display Screen",
                    "quantity": 1.0,
                    "unit": "piece",
                    "cost_per_unit": 45.00
                },
                {
                    "component_id": str(uuid.uuid4()),
                    "component_name": "Battery",
                    "quantity": 1.0,
                    "unit": "piece",
                    "cost_per_unit": 15.75
                }
            ],
            production_steps=[
                {
                    "step_name": "Component Assembly",
                    "order": 1,
                    "description": "Assemble main components",
                    "estimated_time": 30,
                    "required_skills": ["electronics", "assembly"]
                },
                {
                    "step_name": "Quality Testing",
                    "order": 2,
                    "description": "Test functionality and quality",
                    "estimated_time": 15,
                    "required_skills": ["quality_control", "testing"]
                }
            ],
            material_cost="86.25",
            labor_cost="25.00",
            overhead_cost="15.00",
            total_cost="126.25"
        )
        
        bom = business_config_service.create_bill_of_materials(bom_data)
        
        # Verify BOM creation
        assert bom.id is not None
        assert bom.bom_name == "Smartphone Assembly"
        assert bom.bom_code == "PHONE_001"
        assert len(bom.components) == 3
        assert len(bom.production_steps) == 2
        assert bom.total_cost == "126.25"
        
        # Create Production Tracking
        production_data = ProductionTrackingCreate(
            business_config_id=config.id,
            production_order="PO-2024-001",
            bom_id=bom.id,
            product_id=bom.product_id,
            planned_quantity=100,
            produced_quantity=0,
            rejected_quantity=0,
            status="planned",
            production_steps=[
                {
                    "step_name": "Component Assembly",
                    "status": "pending",
                    "start_time": None,
                    "end_time": None,
                    "notes": "Waiting for components"
                }
            ],
            quality_checks=[
                {
                    "check_name": "Functionality Test",
                    "result": "pending",
                    "checked_by": None,
                    "check_time": None,
                    "notes": "Standard functionality verification"
                }
            ]
        )
        
        production = business_config_service.create_production_tracking(production_data)
        
        # Verify production tracking
        assert production.id is not None
        assert production.production_order == "PO-2024-001"
        assert production.bom_id == bom.id
        assert production.planned_quantity == 100
        assert production.status == "planned"
        assert len(production.production_steps) == 1
        assert len(production.quality_checks) == 1
        
        # Verify retrieval
        boms = business_config_service.get_bills_of_materials(config.id)
        assert len(boms) >= 1
        
        productions = business_config_service.get_production_tracking(config.id)
        assert len(productions) >= 1

class TestPerformanceAndConcurrency:
    """Test performance and concurrent operations"""
    
    def test_bulk_configuration_creation(self, business_config_service):
        """Test creating multiple configurations efficiently"""
        import time
        
        business_types = [
            BusinessTypeEnum.RETAIL_STORE,
            BusinessTypeEnum.RESTAURANT,
            BusinessTypeEnum.PHARMACY,
            BusinessTypeEnum.AUTOMOTIVE,
            BusinessTypeEnum.GROCERY_STORE
        ]
        
        start_time = time.time()
        created_configs = []
        
        for i, business_type in enumerate(business_types):
            config_data = BusinessTypeConfigurationCreate(
                business_type=business_type,
                name=f"Test {business_type.value.replace('_', ' ').title()} {i+1}",
                description=f"Test configuration for {business_type.value}",
                industry=f"Industry {i+1}",
                is_active=True,
                is_default=(i == 0)
            )
            
            config = business_config_service.create_business_configuration(config_data)
            created_configs.append(config)
        
        creation_time = time.time() - start_time
        
        # Should create configurations efficiently
        assert creation_time < 3.0, f"Bulk creation took {creation_time:.2f} seconds"
        assert len(created_configs) == 5
        
        # Verify all configurations were created
        for config in created_configs:
            assert config.id is not None
            retrieved = business_config_service.get_business_configuration(config.id)
            assert retrieved is not None
    
    def test_complex_configuration_retrieval(self, business_config_service):
        """Test retrieving complex configurations with many relationships"""
        import time
        
        # Create configuration with many related items
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.SERVICE_BUSINESS,
            name="Complex Service Business",
            industry="Professional Services"
        )
        
        config = business_config_service.create_business_configuration(config_data)
        
        # Add multiple terminology mappings
        for i in range(10):
            mapping_data = TerminologyMappingCreate(
                business_config_id=config.id,
                standard_term=f"term_{i}",
                business_term=f"Business Term {i}",
                context=f"context_{i % 3}",
                category="field_label"
            )
            business_config_service.create_terminology_mapping(mapping_data)
        
        # Add multiple custom fields
        for i in range(5):
            field_data = CustomFieldSchemaCreate(
                business_config_id=config.id,
                field_name=f"field_{i}",
                field_label=f"Field {i}",
                field_type=FieldTypeEnum.TEXT if i % 2 == 0 else FieldTypeEnum.NUMBER,
                entity_type="service",
                display_order=i
            )
            business_config_service.create_custom_field_schema(field_data)
        
        # Test retrieval performance
        start_time = time.time()
        complete_config = business_config_service.get_business_configuration(config.id)
        retrieval_time = time.time() - start_time
        
        # Should retrieve efficiently
        assert retrieval_time < 1.0, f"Complex retrieval took {retrieval_time:.2f} seconds"
        assert complete_config is not None
        assert len(complete_config.terminology_mappings) >= 10
        assert len(complete_config.custom_field_schemas) >= 5

if __name__ == "__main__":
    pytest.main([__file__, "-v"])