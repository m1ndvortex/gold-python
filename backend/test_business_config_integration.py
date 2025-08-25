"""
Business Configuration Integration Tests

Comprehensive integration tests for business type configuration system
using real PostgreSQL database in Docker environment.
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

class TestCompleteBusinessSetup:
    """Test complete business setup workflows"""
    
    def test_complete_gold_shop_setup(self, business_config_service):
        """Test complete gold shop business setup with all components"""
        # 1. Create business configuration
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.GOLD_SHOP,
            name="Golden Treasures",
            description="Premium gold jewelry and precious metals store",
            industry="Jewelry & Precious Metals",
            is_active=True,
            is_default=True
        )
        
        business_config = business_config_service.create_business_configuration(config_data)
        assert business_config.id is not None
        
        # 2. Verify default terminology mappings were created
        terminology_mappings = business_config_service.get_terminology_mappings(business_config.id)
        mapping_dict = {m.standard_term: m.business_term for m in terminology_mappings}
        
        assert "inventory" in mapping_dict
        assert "weight" in mapping_dict
        assert "purity" in mapping_dict
        
        # 3. Verify default workflows were created
        workflows = business_config_service.get_workflow_configurations(business_config.id)
        assert len(workflows) >= 1
        
        invoice_workflow = next((w for w in workflows if w.workflow_type == WorkflowTypeEnum.INVOICE_WORKFLOW), None)
        assert invoice_workflow is not None
        assert len(invoice_workflow.stages) >= 2
        
        # 4. Verify default features were enabled
        features = business_config_service.get_feature_configurations(business_config.id)
        feature_names = [f.feature_name for f in features]
        
        assert "inventory_management" in feature_names
        assert "gold_calculations" in feature_names
        assert "weight_tracking" in feature_names
        
        # 5. Verify default report templates were created
        report_templates = business_config_service.get_report_templates(business_config.id)
        assert len(report_templates) >= 2
        
        # 6. Verify default KPIs were created
        kpis = business_config_service.get_kpi_definitions(business_config.id)
        assert len(kpis) >= 2
        
        kpi_names = [kpi.kpi_name for kpi in kpis]
        assert "Total Revenue" in kpi_names
        assert "Gold Weight Sold" in kpi_names
        
        # 7. Add custom fields for gold shop
        custom_fields = [
            CustomFieldSchemaCreate(
                business_config_id=business_config.id,
                field_name="purity_level",
                field_label="Purity Level (عیار)",
                field_type=FieldTypeEnum.ENUM,
                entity_type="inventory",
                field_options=[
                    {"value": "18k", "label": "18 Karat"},
                    {"value": "21k", "label": "21 Karat"},
                    {"value": "24k", "label": "24 Karat"}
                ],
                is_required=True,
                is_searchable=True,
                is_filterable=True
            ),
            CustomFieldSchemaCreate(
                business_config_id=business_config.id,
                field_name="gold_weight",
                field_label="Weight (گرم)",
                field_type=FieldTypeEnum.NUMBER,
                entity_type="inventory",
                validation_rules=[
                    {"rule_type": "min_value", "value": 0.1, "message": "Weight must be at least 0.1 grams"}
                ],
                is_required=True,
                is_searchable=True
            )
        ]
        
        for field_data in custom_fields:
            field = business_config_service.create_custom_field_schema(field_data)
            assert field.id is not None
        
        # 8. Verify complete configuration
        complete_config = business_config_service.get_business_configuration(business_config.id)
        assert complete_config is not None
        assert len(complete_config.terminology_mappings) >= 3
        assert len(complete_config.workflow_configurations) >= 1
        assert len(complete_config.custom_field_schemas) >= 2
        assert len(complete_config.feature_configurations) >= 3
        assert len(complete_config.report_templates) >= 2
        assert len(complete_config.kpi_definitions) >= 2
    
    def test_complete_service_business_setup(self, business_config_service):
        """Test complete service business setup with service catalog"""
        # 1. Create service business configuration
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.SERVICE_BUSINESS,
            name="TechConsult Pro",
            description="Professional IT consulting and support services",
            industry="Information Technology",
            is_active=True,
            is_default=False
        )
        
        business_config = business_config_service.create_business_configuration(config_data)
        
        # 2. Verify service-specific features were enabled
        features = business_config_service.get_feature_configurations(business_config.id)
        feature_names = [f.feature_name for f in features]
        
        assert "time_tracking" in feature_names
        assert "service_catalog" in feature_names
        assert "appointment_booking" in feature_names
        
        # 3. Verify service catalog was initialized
        service_catalog = business_config_service.get_service_catalog(business_config.id)
        assert len(service_catalog) >= 2
        
        service_names = [service.service_name for service in service_catalog]
        assert "Consultation" in service_names
        assert "Maintenance" in service_names
        
        # 4. Add additional services
        additional_services = [
            ServiceCatalogCreate(
                business_config_id=business_config.id,
                service_name="System Integration",
                service_code="SYS_INT",
                description="Complete system integration and setup",
                category="Integration",
                base_price="200.00",
                currency="USD",
                estimated_duration=960,  # 16 hours
                requires_booking=True,
                is_time_tracked=True,
                billing_method="project"
            ),
            ServiceCatalogCreate(
                business_config_id=business_config.id,
                service_name="Technical Training",
                service_code="TECH_TRAIN",
                description="Technical training and knowledge transfer",
                category="Training",
                base_price="150.00",
                currency="USD",
                estimated_duration=480,  # 8 hours
                requires_booking=True,
                is_time_tracked=True,
                billing_method="hourly"
            )
        ]
        
        for service_data in additional_services:
            service = business_config_service.create_service_catalog_item(service_data)
            assert service.id is not None
        
        # 5. Add service-specific custom fields
        service_fields = [
            CustomFieldSchemaCreate(
                business_config_id=business_config.id,
                field_name="skill_level",
                field_label="Required Skill Level",
                field_type=FieldTypeEnum.ENUM,
                entity_type="service",
                field_options=[
                    {"value": "junior", "label": "Junior Level"},
                    {"value": "senior", "label": "Senior Level"},
                    {"value": "expert", "label": "Expert Level"}
                ],
                is_required=True
            ),
            CustomFieldSchemaCreate(
                business_config_id=business_config.id,
                field_name="remote_available",
                field_label="Remote Service Available",
                field_type=FieldTypeEnum.BOOLEAN,
                entity_type="service",
                default_value=True
            )
        ]
        
        for field_data in service_fields:
            field = business_config_service.create_custom_field_schema(field_data)
            assert field.id is not None
        
        # 6. Verify complete service catalog
        final_catalog = business_config_service.get_service_catalog(business_config.id)
        assert len(final_catalog) >= 4
        
        # Check specific services
        integration_service = next((s for s in final_catalog if s.service_code == "SYS_INT"), None)
        assert integration_service is not None
        assert integration_service.billing_method == "project"
        assert integration_service.estimated_duration == 960
    
    def test_complete_manufacturing_setup(self, business_config_service):
        """Test complete manufacturing business setup with BOM and production tracking"""
        # 1. Create manufacturing business configuration
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.MANUFACTURING,
            name="TechParts Manufacturing",
            description="Electronic components and device manufacturing",
            industry="Electronics Manufacturing",
            is_active=True,
            is_default=False
        )
        
        business_config = business_config_service.create_business_configuration(config_data)
        
        # 2. Verify manufacturing-specific features
        features = business_config_service.get_feature_configurations(business_config.id)
        feature_names = [f.feature_name for f in features]
        
        assert "bill_of_materials" in feature_names
        assert "production_tracking" in feature_names
        assert "component_management" in feature_names
        
        # 3. Create Bill of Materials
        bom_data = BillOfMaterialsCreate(
            business_config_id=business_config.id,
            bom_name="Smartphone Assembly",
            bom_code="PHONE_001",
            product_id=uuid.uuid4(),  # Would reference actual product
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
                },
                {
                    "step_name": "Final Packaging",
                    "order": 3,
                    "description": "Package for shipping",
                    "estimated_time": 10,
                    "required_skills": ["packaging"]
                }
            ],
            material_cost="86.25",
            labor_cost="25.00",
            overhead_cost="15.00",
            total_cost="126.25"
        )
        
        bom = business_config_service.create_bill_of_materials(bom_data)
        assert bom.id is not None
        assert len(bom.components) == 3
        assert len(bom.production_steps) == 3
        
        # 4. Create Production Tracking
        production_data = ProductionTrackingCreate(
            business_config_id=business_config.id,
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
                },
                {
                    "step_name": "Quality Testing",
                    "status": "pending",
                    "start_time": None,
                    "end_time": None,
                    "notes": "Pending assembly completion"
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
        assert production.id is not None
        assert production.production_order == "PO-2024-001"
        assert production.planned_quantity == 100
        assert production.status == "planned"
        
        # 5. Verify BOM and production tracking retrieval
        boms = business_config_service.get_bills_of_materials(business_config.id)
        assert len(boms) >= 1
        
        productions = business_config_service.get_production_tracking(business_config.id)
        assert len(productions) >= 1
        
        # 6. Add manufacturing-specific custom fields
        manufacturing_fields = [
            CustomFieldSchemaCreate(
                business_config_id=business_config.id,
                field_name="production_line",
                field_label="Production Line",
                field_type=FieldTypeEnum.ENUM,
                entity_type="production",
                field_options=[
                    {"value": "line_a", "label": "Production Line A"},
                    {"value": "line_b", "label": "Production Line B"},
                    {"value": "line_c", "label": "Production Line C"}
                ]
            ),
            CustomFieldSchemaCreate(
                business_config_id=business_config.id,
                field_name="batch_number",
                field_label="Batch Number",
                field_type=FieldTypeEnum.TEXT,
                entity_type="production",
                validation_rules=[
                    {"rule_type": "pattern", "value": "^BATCH-\\d{4}-\\d{3}$", "message": "Format: BATCH-YYYY-NNN"}
                ],
                is_required=True
            )
        ]
        
        for field_data in manufacturing_fields:
            field = business_config_service.create_custom_field_schema(field_data)
            assert field.id is not None

class TestBusinessTypeDetectionIntegration:
    """Test business type detection with various scenarios"""
    
    def test_multi_business_type_detection_scenarios(self, business_config_service):
        """Test detection across multiple business type scenarios"""
        
        test_scenarios = [
            {
                "description": "We operate a pharmacy selling prescription medications, over-the-counter drugs, and health products to patients and healthcare providers.",
                "industry": "Healthcare",
                "activities": ["prescription dispensing", "health consultation", "medical supplies"],
                "expected_type": BusinessTypeEnum.PHARMACY,
                "min_confidence": 0.8
            },
            {
                "description": "Our automotive repair shop provides car maintenance, engine repair, and parts replacement services for all vehicle types.",
                "industry": "Automotive",
                "activities": ["car repair", "maintenance", "parts replacement"],
                "expected_type": BusinessTypeEnum.AUTOMOTIVE,
                "min_confidence": 0.7
            },
            {
                "description": "We run a grocery store selling fresh produce, packaged foods, beverages, and household items to local customers.",
                "industry": "Retail",
                "activities": ["food retail", "grocery sales", "customer service"],
                "expected_type": BusinessTypeEnum.GROCERY_STORE,
                "min_confidence": 0.6
            },
            {
                "description": "Our clothing boutique specializes in fashion apparel, accessories, and designer items for men and women.",
                "industry": "Fashion",
                "activities": ["clothing sales", "fashion retail", "styling"],
                "expected_type": BusinessTypeEnum.CLOTHING_STORE,
                "min_confidence": 0.6
            },
            {
                "description": "We distribute electronic components, computer parts, and technology products to retailers and businesses in bulk quantities.",
                "industry": "Technology",
                "activities": ["wholesale distribution", "bulk sales", "B2B sales"],
                "expected_type": BusinessTypeEnum.WHOLESALE,
                "min_confidence": 0.7
            }
        ]
        
        for scenario in test_scenarios:
            detection_request = BusinessTypeDetectionRequest(
                business_description=scenario["description"],
                industry=scenario["industry"],
                primary_activities=scenario["activities"],
                customer_types=["customers", "clients"]
            )
            
            result = business_config_service.detect_business_type(detection_request)
            
            assert result.suggested_business_type == scenario["expected_type"], \
                f"Expected {scenario['expected_type']}, got {result.suggested_business_type} for: {scenario['description'][:50]}..."
            assert result.confidence_score >= scenario["min_confidence"], \
                f"Confidence {result.confidence_score} below minimum {scenario['min_confidence']}"
            assert len(result.alternative_suggestions) >= 0
    
    def test_ambiguous_business_detection(self, business_config_service):
        """Test detection for ambiguous business descriptions"""
        detection_request = BusinessTypeDetectionRequest(
            business_description="We sell various products and provide some services to customers.",
            industry="General",
            primary_activities=["sales", "service"],
            customer_types=["general public"]
        )
        
        result = business_config_service.detect_business_type(detection_request)
        
        # Should default to retail store for ambiguous cases
        assert result.suggested_business_type == BusinessTypeEnum.RETAIL_STORE
        assert result.confidence_score >= 0.3  # Lower confidence for ambiguous cases
        assert len(result.alternative_suggestions) >= 0

class TestWorkflowIntegration:
    """Test workflow configuration integration"""
    
    def test_complex_workflow_configuration(self, business_config_service):
        """Test creating and managing complex workflow configurations"""
        # Create business configuration
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.RETAIL_STORE,
            name="Advanced Retail Store",
            industry="Retail"
        )
        
        business_config = business_config_service.create_business_configuration(config_data)
        
        # Create complex invoice workflow
        invoice_workflow = WorkflowConfigurationCreate(
            business_config_id=business_config.id,
            workflow_type=WorkflowTypeEnum.INVOICE_WORKFLOW,
            workflow_name="Advanced Invoice Workflow",
            stages=[
                {"name": "Draft", "order": 1, "is_required": True, "conditions": {"editable": True}},
                {"name": "Review", "order": 2, "is_required": True, "conditions": {"requires_approval": True}},
                {"name": "Approved", "order": 3, "is_required": True, "conditions": {"stock_impact": True}},
                {"name": "Paid", "order": 4, "is_required": False, "conditions": {"payment_received": True}},
                {"name": "Completed", "order": 5, "is_required": False, "conditions": {"final_stage": True}}
            ],
            rules=[
                {
                    "name": "Auto Approve Small Orders",
                    "condition": {"total_amount": {"lt": 50}},
                    "action": {"type": "auto_approve", "skip_to_stage": "Approved"},
                    "is_active": True
                },
                {
                    "name": "Manager Approval Required",
                    "condition": {"total_amount": {"gte": 1000}},
                    "action": {"type": "require_approval", "role": "manager"},
                    "is_active": True
                },
                {
                    "name": "Stock Check",
                    "condition": {"stage": "Review"},
                    "action": {"type": "validate_stock", "block_if_insufficient": True},
                    "is_active": True
                }
            ],
            approvals=[
                {
                    "stage": "Review",
                    "required_role": "supervisor",
                    "is_required": True,
                    "conditions": {"total_amount": {"gte": 100, "lt": 1000}}
                },
                {
                    "stage": "Review",
                    "required_role": "manager",
                    "is_required": True,
                    "conditions": {"total_amount": {"gte": 1000}}
                }
            ],
            notifications=[
                {
                    "event": "stage_changed",
                    "recipients": ["creator", "supervisor"],
                    "template": "invoice_stage_change",
                    "is_active": True
                },
                {
                    "event": "approval_required",
                    "recipients": ["approver"],
                    "template": "approval_request",
                    "is_active": True
                }
            ],
            is_active=True,
            is_required=True
        )
        
        workflow = business_config_service.create_workflow_configuration(invoice_workflow)
        
        assert workflow.id is not None
        assert len(workflow.stages) == 5
        assert len(workflow.rules) == 3
        assert len(workflow.approvals) == 2
        assert len(workflow.notifications) == 2
        
        # Create inventory workflow
        inventory_workflow = WorkflowConfigurationCreate(
            business_config_id=business_config.id,
            workflow_type=WorkflowTypeEnum.INVENTORY_WORKFLOW,
            workflow_name="Inventory Management Workflow",
            stages=[
                {"name": "Received", "order": 1, "is_required": True},
                {"name": "Quality Check", "order": 2, "is_required": True},
                {"name": "Stocked", "order": 3, "is_required": True},
                {"name": "Available", "order": 4, "is_required": True}
            ],
            rules=[
                {
                    "name": "Auto Stock Small Items",
                    "condition": {"quantity": {"lt": 10}},
                    "action": {"type": "auto_stock"},
                    "is_active": True
                }
            ],
            is_active=True
        )
        
        inventory_wf = business_config_service.create_workflow_configuration(inventory_workflow)
        assert inventory_wf.id is not None
        
        # Verify workflows retrieval
        all_workflows = business_config_service.get_workflow_configurations(business_config.id)
        assert len(all_workflows) >= 3  # Including default + 2 created
        
        invoice_workflows = business_config_service.get_workflow_configurations(
            business_config.id, WorkflowTypeEnum.INVOICE_WORKFLOW
        )
        assert len(invoice_workflows) >= 2  # Default + created
        
        inventory_workflows = business_config_service.get_workflow_configurations(
            business_config.id, WorkflowTypeEnum.INVENTORY_WORKFLOW
        )
        assert len(inventory_workflows) >= 1

class TestAPIIntegration:
    """Test complete API integration scenarios"""
    
    def test_complete_api_workflow(self):
        """Test complete business configuration workflow via API"""
        
        # 1. Create business configuration
        config_data = {
            "business_type": "restaurant",
            "name": "Bella Vista Restaurant",
            "description": "Fine dining Italian restaurant",
            "industry": "Food Service",
            "is_active": True,
            "is_default": True
        }
        
        response = client.post("/api/business-config/configurations", json=config_data)
        assert response.status_code == 200
        
        config = response.json()
        config_id = config["id"]
        
        # 2. Add terminology mappings
        terminology_data = {
            "business_config_id": config_id,
            "standard_term": "inventory",
            "business_term": "Menu Items",
            "context": "inventory",
            "category": "field_label",
            "language_code": "en"
        }
        
        response = client.post("/api/business-config/terminology", json=terminology_data)
        assert response.status_code == 200
        
        # 3. Add custom fields
        custom_field_data = {
            "business_config_id": config_id,
            "field_name": "spice_level",
            "field_label": "Spice Level",
            "field_type": "enum",
            "entity_type": "inventory",
            "field_options": [
                {"value": "mild", "label": "Mild"},
                {"value": "medium", "label": "Medium"},
                {"value": "hot", "label": "Hot"},
                {"value": "extra_hot", "label": "Extra Hot"}
            ],
            "is_required": False,
            "is_searchable": True,
            "is_filterable": True
        }
        
        response = client.post("/api/business-config/custom-fields", json=custom_field_data)
        assert response.status_code == 200
        
        # 4. Add feature configuration
        feature_data = {
            "business_config_id": config_id,
            "feature_name": "table_management",
            "feature_category": "restaurant",
            "is_enabled": True,
            "configuration": {
                "max_tables": 50,
                "reservation_system": True,
                "waitlist_enabled": True
            }
        }
        
        response = client.post("/api/business-config/features", json=feature_data)
        assert response.status_code == 200
        
        # 5. Get complete configuration
        response = client.get(f"/api/business-config/configurations/{config_id}")
        assert response.status_code == 200
        
        complete_config = response.json()
        assert complete_config["id"] == config_id
        assert complete_config["business_type"] == "restaurant"
        assert len(complete_config["terminology_mappings"]) >= 1
        assert len(complete_config["custom_field_schemas"]) >= 1
        assert len(complete_config["feature_configurations"]) >= 1
        
        # 6. Test feature enabled check
        response = client.get(f"/api/business-config/features/{config_id}/table_management/enabled")
        assert response.status_code == 200
        
        feature_status = response.json()
        assert feature_status["feature_name"] == "table_management"
        assert feature_status["is_enabled"] is True
    
    def test_business_setup_wizard_api(self):
        """Test business setup wizard via API"""
        setup_data = {
            "business_type": "service_business",
            "business_name": "ProTech Solutions",
            "industry": "Technology Services",
            "features_to_enable": [
                "time_tracking",
                "service_catalog",
                "project_management",
                "client_portal"
            ],
            "custom_terminology": {
                "inventory": "Services",
                "customer": "Client",
                "invoice": "Service Invoice"
            },
            "initial_workflows": ["service_delivery", "client_onboarding"]
        }
        
        response = client.post("/api/business-config/setup-wizard", json=setup_data)
        assert response.status_code == 200
        
        config = response.json()
        assert config["business_type"] == "service_business"
        assert config["name"] == "ProTech Solutions"
        assert config["industry"] == "Technology Services"
        
        config_id = config["id"]
        
        # Verify terminology mappings were created
        response = client.get(f"/api/business-config/terminology/{config_id}")
        assert response.status_code == 200
        
        mappings = response.json()
        mapping_dict = {m["standard_term"]: m["business_term"] for m in mappings}
        assert mapping_dict.get("inventory") == "Services"
        assert mapping_dict.get("customer") == "Client"
        
        # Verify features were enabled
        response = client.get(f"/api/business-config/features/{config_id}")
        assert response.status_code == 200
        
        features = response.json()
        feature_names = [f["feature_name"] for f in features]
        assert "time_tracking" in feature_names
        assert "service_catalog" in feature_names

if __name__ == "__main__":
    pytest.main([__file__, "-v"])