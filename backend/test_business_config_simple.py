"""
Simple Business Configuration System Tests

Basic unit tests for business type configuration functionality using real PostgreSQL database.
"""

import pytest
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from main import app
from database import get_db, engine
from models_business_config import (
    BusinessTypeConfiguration, TerminologyMapping, WorkflowConfiguration,
    CustomFieldSchema, FeatureConfiguration, ReportTemplate, KPIDefinition,
    ServiceCatalog, BillOfMaterials, ProductionTracking,
    BusinessTypeEnum, WorkflowTypeEnum, FieldTypeEnum
)
from services.business_config_service import BusinessConfigurationService
from schemas_business_config import (
    BusinessTypeConfigurationCreate, TerminologyMappingCreate,
    WorkflowConfigurationCreate, CustomFieldSchemaCreate,
    FeatureConfigurationCreate, ReportTemplateCreate, KPIDefinitionCreate,
    ServiceCatalogCreate, BillOfMaterialsCreate, ProductionTrackingCreate,
    BusinessTypeDetectionRequest, BusinessSetupWizardRequest
)

# Test client
client = TestClient(app)

@pytest.fixture
def db_session():
    """Create a database session for testing"""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def business_config_service(db_session):
    """Create business configuration service"""
    return BusinessConfigurationService(db_session)

@pytest.fixture
def sample_business_config(business_config_service):
    """Create a sample business configuration"""
    config_data = BusinessTypeConfigurationCreate(
        business_type=BusinessTypeEnum.RETAIL_STORE,
        name="Test Retail Store",
        description="A test retail store configuration",
        industry="Retail",
        is_active=True,
        is_default=True
    )
    return business_config_service.create_business_configuration(config_data)

class TestBusinessTypeConfiguration:
    """Test business type configuration CRUD operations"""
    
    def test_create_business_configuration(self, business_config_service):
        """Test creating a business configuration"""
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.GOLD_SHOP,
            name="Test Gold Shop",
            description="A test gold shop configuration",
            industry="Jewelry",
            is_active=True,
            is_default=False
        )
        
        config = business_config_service.create_business_configuration(config_data)
        
        assert config.id is not None
        assert config.business_type == BusinessTypeEnum.GOLD_SHOP
        assert config.name == "Test Gold Shop"
        assert config.description == "A test gold shop configuration"
        assert config.industry == "Jewelry"
        assert config.is_active is True
        assert config.is_default is False
        assert config.created_at is not None
    
    def test_create_duplicate_business_type_fails(self, business_config_service):
        """Test that creating duplicate business type fails"""
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.RESTAURANT,
            name="Test Restaurant 1",
            industry="Food Service"
        )
        
        # Create first configuration
        business_config_service.create_business_configuration(config_data)
        
        # Try to create duplicate
        duplicate_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.RESTAURANT,
            name="Test Restaurant 2",
            industry="Food Service"
        )
        
        with pytest.raises(ValueError, match="Business type restaurant already exists"):
            business_config_service.create_business_configuration(duplicate_data)
    
    def test_get_business_configuration(self, business_config_service, sample_business_config):
        """Test getting business configuration by ID"""
        config = business_config_service.get_business_configuration(sample_business_config.id)
        
        assert config is not None
        assert config.id == sample_business_config.id
        assert config.business_type == BusinessTypeEnum.RETAIL_STORE
        assert config.name == "Test Retail Store"
    
    def test_get_business_configuration_by_type(self, business_config_service, sample_business_config):
        """Test getting business configuration by business type"""
        config = business_config_service.get_business_configuration_by_type(BusinessTypeEnum.RETAIL_STORE)
        
        assert config is not None
        assert config.business_type == BusinessTypeEnum.RETAIL_STORE
        assert config.name == "Test Retail Store"
    
    def test_list_business_configurations(self, business_config_service, sample_business_config):
        """Test listing business configurations"""
        configs = business_config_service.list_business_configurations()
        
        assert len(configs) >= 1
        assert any(config.id == sample_business_config.id for config in configs)
    
    def test_update_business_configuration(self, business_config_service, sample_business_config):
        """Test updating business configuration"""
        from schemas_business_config import BusinessTypeConfigurationUpdate
        
        update_data = BusinessTypeConfigurationUpdate(
            name="Updated Retail Store",
            description="Updated description",
            is_active=False
        )
        
        updated_config = business_config_service.update_business_configuration(
            sample_business_config.id, update_data
        )
        
        assert updated_config is not None
        assert updated_config.name == "Updated Retail Store"
        assert updated_config.description == "Updated description"
        assert updated_config.is_active is False
    
    def test_delete_business_configuration(self, business_config_service, sample_business_config):
        """Test deleting business configuration"""
        success = business_config_service.delete_business_configuration(sample_business_config.id)
        assert success is True
        
        # Verify deletion
        config = business_config_service.get_business_configuration(sample_business_config.id)
        assert config is None

class TestTerminologyMapping:
    """Test terminology mapping functionality"""
    
    def test_create_terminology_mapping(self, business_config_service, sample_business_config):
        """Test creating terminology mapping"""
        mapping_data = TerminologyMappingCreate(
            business_config_id=sample_business_config.id,
            standard_term="inventory",
            business_term="Products",
            context="inventory",
            category="field_label",
            language_code="en"
        )
        
        mapping = business_config_service.create_terminology_mapping(mapping_data)
        
        assert mapping.id is not None
        assert mapping.business_config_id == sample_business_config.id
        assert mapping.standard_term == "inventory"
        assert mapping.business_term == "Products"
        assert mapping.context == "inventory"
        assert mapping.category == "field_label"
        assert mapping.language_code == "en"
    
    def test_get_terminology_mappings(self, business_config_service, sample_business_config):
        """Test getting terminology mappings"""
        # Create multiple mappings
        mappings_data = [
            TerminologyMappingCreate(
                business_config_id=sample_business_config.id,
                standard_term="customer",
                business_term="Client",
                context="customer",
                category="field_label"
            ),
            TerminologyMappingCreate(
                business_config_id=sample_business_config.id,
                standard_term="invoice",
                business_term="Receipt",
                context="invoice",
                category="field_label"
            )
        ]
        
        for mapping_data in mappings_data:
            business_config_service.create_terminology_mapping(mapping_data)
        
        mappings = business_config_service.get_terminology_mappings(sample_business_config.id)
        
        assert len(mappings) >= 2
        standard_terms = [mapping.standard_term for mapping in mappings]
        assert "customer" in standard_terms
        assert "invoice" in standard_terms

class TestWorkflowConfiguration:
    """Test workflow configuration functionality"""
    
    def test_create_workflow_configuration(self, business_config_service, sample_business_config):
        """Test creating workflow configuration"""
        workflow_data = WorkflowConfigurationCreate(
            business_config_id=sample_business_config.id,
            workflow_type=WorkflowTypeEnum.INVOICE_WORKFLOW,
            workflow_name="Retail Invoice Workflow",
            stages=[
                {"name": "Draft", "order": 1, "is_required": True},
                {"name": "Approved", "order": 2, "is_required": True},
                {"name": "Paid", "order": 3, "is_required": False}
            ],
            rules=[
                {
                    "name": "Auto Approve Small Orders",
                    "condition": {"total_amount": {"lt": 100}},
                    "action": {"type": "auto_approve"},
                    "is_active": True
                }
            ],
            is_active=True
        )
        
        workflow = business_config_service.create_workflow_configuration(workflow_data)
        
        assert workflow.id is not None
        assert workflow.business_config_id == sample_business_config.id
        assert workflow.workflow_type == WorkflowTypeEnum.INVOICE_WORKFLOW
        assert workflow.workflow_name == "Retail Invoice Workflow"
        assert len(workflow.stages) == 3
        assert len(workflow.rules) == 1
        assert workflow.is_active is True
    
    def test_get_workflow_configurations(self, business_config_service, sample_business_config):
        """Test getting workflow configurations"""
        # Create workflow
        workflow_data = WorkflowConfigurationCreate(
            business_config_id=sample_business_config.id,
            workflow_type=WorkflowTypeEnum.INVENTORY_WORKFLOW,
            workflow_name="Inventory Management Workflow",
            stages=[{"name": "Received", "order": 1, "is_required": True}],
            is_active=True
        )
        
        business_config_service.create_workflow_configuration(workflow_data)
        
        workflows = business_config_service.get_workflow_configurations(sample_business_config.id)
        
        assert len(workflows) >= 1
        assert any(wf.workflow_type == WorkflowTypeEnum.INVENTORY_WORKFLOW for wf in workflows)

class TestCustomFieldSchema:
    """Test custom field schema functionality"""
    
    def test_create_custom_field_schema(self, business_config_service, sample_business_config):
        """Test creating custom field schema"""
        field_data = CustomFieldSchemaCreate(
            business_config_id=sample_business_config.id,
            field_name="brand",
            field_label="Brand Name",
            field_type=FieldTypeEnum.TEXT,
            entity_type="inventory",
            validation_rules=[
                {"rule_type": "min_length", "value": 2, "message": "Brand name must be at least 2 characters"}
            ],
            is_required=False,
            is_searchable=True,
            is_filterable=True,
            display_order=1
        )
        
        field = business_config_service.create_custom_field_schema(field_data)
        
        assert field.id is not None
        assert field.business_config_id == sample_business_config.id
        assert field.field_name == "brand"
        assert field.field_label == "Brand Name"
        assert field.field_type == FieldTypeEnum.TEXT
        assert field.entity_type == "inventory"
        assert field.is_searchable is True
        assert field.is_filterable is True
        assert field.display_order == 1
    
    def test_get_custom_field_schemas(self, business_config_service, sample_business_config):
        """Test getting custom field schemas"""
        # Create multiple fields
        fields_data = [
            CustomFieldSchemaCreate(
                business_config_id=sample_business_config.id,
                field_name="size",
                field_label="Size",
                field_type=FieldTypeEnum.ENUM,
                entity_type="inventory",
                field_options=[
                    {"value": "S", "label": "Small"},
                    {"value": "M", "label": "Medium"},
                    {"value": "L", "label": "Large"}
                ],
                display_order=1
            ),
            CustomFieldSchemaCreate(
                business_config_id=sample_business_config.id,
                field_name="weight",
                field_label="Weight (kg)",
                field_type=FieldTypeEnum.NUMBER,
                entity_type="inventory",
                display_order=2
            )
        ]
        
        for field_data in fields_data:
            business_config_service.create_custom_field_schema(field_data)
        
        fields = business_config_service.get_custom_field_schemas(sample_business_config.id, "inventory")
        
        assert len(fields) >= 2
        field_names = [field.field_name for field in fields]
        assert "size" in field_names
        assert "weight" in field_names

class TestFeatureConfiguration:
    """Test feature configuration functionality"""
    
    def test_create_feature_configuration(self, business_config_service, sample_business_config):
        """Test creating feature configuration"""
        feature_data = FeatureConfigurationCreate(
            business_config_id=sample_business_config.id,
            feature_name="advanced_reporting",
            feature_category="reporting",
            is_enabled=True,
            configuration={"max_reports": 50, "export_formats": ["pdf", "excel"]},
            required_roles=["admin", "manager"]
        )
        
        feature = business_config_service.create_feature_configuration(feature_data)
        
        assert feature.id is not None
        assert feature.business_config_id == sample_business_config.id
        assert feature.feature_name == "advanced_reporting"
        assert feature.feature_category == "reporting"
        assert feature.is_enabled is True
        assert feature.configuration["max_reports"] == 50
        assert "admin" in feature.required_roles
    
    def test_is_feature_enabled(self, business_config_service, sample_business_config):
        """Test checking if feature is enabled"""
        # Create enabled feature
        feature_data = FeatureConfigurationCreate(
            business_config_id=sample_business_config.id,
            feature_name="inventory_tracking",
            is_enabled=True
        )
        business_config_service.create_feature_configuration(feature_data)
        
        # Test enabled feature
        is_enabled = business_config_service.is_feature_enabled(
            sample_business_config.id, "inventory_tracking"
        )
        assert is_enabled is True
        
        # Test non-existent feature
        is_enabled = business_config_service.is_feature_enabled(
            sample_business_config.id, "non_existent_feature"
        )
        assert is_enabled is False

class TestServiceCatalog:
    """Test service catalog functionality for service businesses"""
    
    def test_create_service_catalog_item(self, business_config_service, sample_business_config):
        """Test creating service catalog item"""
        service_data = ServiceCatalogCreate(
            business_config_id=sample_business_config.id,
            service_name="Web Development",
            service_code="WEB_DEV",
            description="Custom web development service",
            category="Development",
            base_price="150.00",
            currency="USD",
            estimated_duration=480,  # 8 hours
            requires_booking=True,
            is_time_tracked=True,
            billing_method="hourly"
        )
        
        service = business_config_service.create_service_catalog_item(service_data)
        
        assert service.id is not None
        assert service.business_config_id == sample_business_config.id
        assert service.service_name == "Web Development"
        assert service.service_code == "WEB_DEV"
        assert service.category == "Development"
        assert service.base_price == "150.00"
        assert service.estimated_duration == 480
        assert service.is_time_tracked is True
    
    def test_get_service_catalog(self, business_config_service, sample_business_config):
        """Test getting service catalog"""
        # Create multiple services
        services_data = [
            ServiceCatalogCreate(
                business_config_id=sample_business_config.id,
                service_name="Consultation",
                category="Consulting",
                base_price="100.00"
            ),
            ServiceCatalogCreate(
                business_config_id=sample_business_config.id,
                service_name="Training",
                category="Education",
                base_price="75.00"
            )
        ]
        
        for service_data in services_data:
            business_config_service.create_service_catalog_item(service_data)
        
        services = business_config_service.get_service_catalog(sample_business_config.id)
        
        assert len(services) >= 2
        service_names = [service.service_name for service in services]
        assert "Consultation" in service_names
        assert "Training" in service_names

class TestBusinessTypeDetection:
    """Test business type detection functionality"""
    
    def test_detect_gold_shop(self, business_config_service):
        """Test detecting gold shop business type"""
        detection_request = BusinessTypeDetectionRequest(
            business_description="We sell gold jewelry, precious metals, and coins. We specialize in gold trading and jewelry making.",
            industry="Jewelry",
            primary_activities=["gold trading", "jewelry sales", "precious metals"],
            customer_types=["individual customers", "collectors"]
        )
        
        result = business_config_service.detect_business_type(detection_request)
        
        assert result.suggested_business_type == BusinessTypeEnum.GOLD_SHOP
        assert result.confidence_score > 0.5
        assert "gold" in result.reasoning.lower()
    
    def test_detect_restaurant(self, business_config_service):
        """Test detecting restaurant business type"""
        detection_request = BusinessTypeDetectionRequest(
            business_description="We operate a restaurant serving traditional cuisine. We have a kitchen, dining area, and offer catering services.",
            industry="Food Service",
            primary_activities=["food preparation", "dining service", "catering"],
            customer_types=["diners", "event organizers"]
        )
        
        result = business_config_service.detect_business_type(detection_request)
        
        assert result.suggested_business_type == BusinessTypeEnum.RESTAURANT
        assert result.confidence_score > 0.5
        assert "restaurant" in result.reasoning.lower()
    
    def test_detect_service_business(self, business_config_service):
        """Test detecting service business type"""
        detection_request = BusinessTypeDetectionRequest(
            business_description="We provide professional consulting services, maintenance, and technical support to businesses.",
            industry="Professional Services",
            primary_activities=["consulting", "maintenance", "support"],
            customer_types=["businesses", "organizations"]
        )
        
        result = business_config_service.detect_business_type(detection_request)
        
        assert result.suggested_business_type == BusinessTypeEnum.SERVICE_BUSINESS
        assert result.confidence_score > 0.5
        assert len(result.alternative_suggestions) >= 0

class TestBusinessSetupWizard:
    """Test business setup wizard functionality"""
    
    def test_setup_business_wizard(self, business_config_service):
        """Test setting up business using wizard"""
        setup_request = BusinessSetupWizardRequest(
            business_type=BusinessTypeEnum.RETAIL_STORE,
            business_name="My Retail Store",
            industry="General Retail",
            features_to_enable=["inventory_management", "customer_management", "basic_reporting"],
            custom_terminology={
                "inventory": "Products",
                "customer": "Shopper",
                "invoice": "Receipt"
            }
        )
        
        config = business_config_service.setup_business_wizard(setup_request)
        
        assert config.id is not None
        assert config.business_type == BusinessTypeEnum.RETAIL_STORE
        assert config.name == "My Retail Store"
        assert config.industry == "General Retail"
        assert config.is_default is True
        
        # Check that terminology mappings were created
        mappings = business_config_service.get_terminology_mappings(config.id)
        mapping_dict = {m.standard_term: m.business_term for m in mappings}
        assert mapping_dict.get("inventory") == "Products"
        assert mapping_dict.get("customer") == "Shopper"
        
        # Check that features were enabled
        features = business_config_service.get_feature_configurations(config.id)
        feature_names = [f.feature_name for f in features]
        assert "inventory_management" in feature_names
        assert "customer_management" in feature_names

class TestAPIEndpoints:
    """Test API endpoints using FastAPI test client"""
    
    def test_create_business_configuration_api(self):
        """Test creating business configuration via API"""
        config_data = {
            "business_type": "pharmacy",
            "name": "Test Pharmacy",
            "description": "A test pharmacy configuration",
            "industry": "Healthcare",
            "is_active": True,
            "is_default": False
        }
        
        response = client.post("/api/business-config/configurations", json=config_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["business_type"] == "pharmacy"
        assert data["name"] == "Test Pharmacy"
        assert data["industry"] == "Healthcare"
    
    def test_get_supported_business_types_api(self):
        """Test getting supported business types via API"""
        response = client.get("/api/business-config/business-types")
        
        assert response.status_code == 200
        data = response.json()
        assert "business_types" in data
        assert len(data["business_types"]) > 0
        
        business_types = [bt["value"] for bt in data["business_types"]]
        assert "gold_shop" in business_types
        assert "retail_store" in business_types
        assert "restaurant" in business_types
    
    def test_detect_business_type_api(self):
        """Test business type detection via API"""
        detection_data = {
            "business_description": "We manufacture electronic components and assemble products for various industries.",
            "industry": "Manufacturing",
            "primary_activities": ["manufacturing", "assembly", "production"],
            "customer_types": ["businesses", "distributors"]
        }
        
        response = client.post("/api/business-config/detect-business-type", json=detection_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "suggested_business_type" in data
        assert "confidence_score" in data
        assert "reasoning" in data
        assert data["suggested_business_type"] == "manufacturing"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])