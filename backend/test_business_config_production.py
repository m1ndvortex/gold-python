"""
Business Configuration Production Tests

Production-level comprehensive tests for business type configuration system
with performance, security, and edge case testing using real PostgreSQL database.
"""

import pytest
import uuid
import time
import concurrent.futures
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from unittest.mock import patch

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

class TestPerformanceAndScalability:
    """Test performance and scalability of business configuration system"""
    
    def test_bulk_business_configuration_creation(self, business_config_service):
        """Test creating multiple business configurations efficiently"""
        start_time = time.time()
        
        business_types = [
            BusinessTypeEnum.RETAIL_STORE,
            BusinessTypeEnum.RESTAURANT,
            BusinessTypeEnum.SERVICE_BUSINESS,
            BusinessTypeEnum.MANUFACTURING,
            BusinessTypeEnum.WHOLESALE,
            BusinessTypeEnum.PHARMACY,
            BusinessTypeEnum.AUTOMOTIVE,
            BusinessTypeEnum.GROCERY_STORE,
            BusinessTypeEnum.CLOTHING_STORE,
            BusinessTypeEnum.ELECTRONICS_STORE
        ]
        
        created_configs = []
        
        for i, business_type in enumerate(business_types):
            config_data = BusinessTypeConfigurationCreate(
                business_type=business_type,
                name=f"Test {business_type.value.replace('_', ' ').title()} {i+1}",
                description=f"Test configuration for {business_type.value}",
                industry=f"Industry {i+1}",
                is_active=True,
                is_default=(i == 0)  # First one is default
            )
            
            config = business_config_service.create_business_configuration(config_data)
            created_configs.append(config)
            assert config.id is not None
        
        creation_time = time.time() - start_time
        
        # Should create 10 configurations in reasonable time (< 5 seconds)
        assert creation_time < 5.0, f"Bulk creation took {creation_time:.2f} seconds, expected < 5.0"
        assert len(created_configs) == 10
        
        # Test bulk retrieval performance
        start_time = time.time()
        all_configs = business_config_service.list_business_configurations(limit=100)
        retrieval_time = time.time() - start_time
        
        assert retrieval_time < 1.0, f"Bulk retrieval took {retrieval_time:.2f} seconds, expected < 1.0"
        assert len(all_configs) >= 10
    
    def test_concurrent_configuration_access(self, business_config_service):
        """Test concurrent access to business configurations"""
        # Create a base configuration
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.RETAIL_STORE,
            name="Concurrent Test Store",
            industry="Retail"
        )
        
        base_config = business_config_service.create_business_configuration(config_data)
        
        def create_terminology_mapping(index):
            """Create terminology mapping in separate thread"""
            mapping_data = TerminologyMappingCreate(
                business_config_id=base_config.id,
                standard_term=f"term_{index}",
                business_term=f"Business Term {index}",
                context="test",
                category="field_label"
            )
            return business_config_service.create_terminology_mapping(mapping_data)
        
        def create_custom_field(index):
            """Create custom field in separate thread"""
            field_data = CustomFieldSchemaCreate(
                business_config_id=base_config.id,
                field_name=f"field_{index}",
                field_label=f"Field {index}",
                field_type=FieldTypeEnum.TEXT,
                entity_type="test",
                display_order=index
            )
            return business_config_service.create_custom_field_schema(field_data)
        
        # Test concurrent terminology mapping creation
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            terminology_futures = [executor.submit(create_terminology_mapping, i) for i in range(10)]
            field_futures = [executor.submit(create_custom_field, i) for i in range(10)]
            
            # Wait for all to complete
            terminology_results = [future.result() for future in terminology_futures]
            field_results = [future.result() for future in field_futures]
        
        concurrent_time = time.time() - start_time
        
        # Should handle concurrent operations efficiently
        assert concurrent_time < 3.0, f"Concurrent operations took {concurrent_time:.2f} seconds, expected < 3.0"
        assert len(terminology_results) == 10
        assert len(field_results) == 10
        assert all(result.id is not None for result in terminology_results)
        assert all(result.id is not None for result in field_results)
    
    def test_large_configuration_retrieval(self, business_config_service):
        """Test retrieving configurations with large amounts of related data"""
        # Create configuration with many related items
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.MANUFACTURING,
            name="Large Manufacturing Plant",
            industry="Heavy Manufacturing"
        )
        
        config = business_config_service.create_business_configuration(config_data)
        
        # Add many terminology mappings
        for i in range(50):
            mapping_data = TerminologyMappingCreate(
                business_config_id=config.id,
                standard_term=f"standard_term_{i}",
                business_term=f"Business Term {i}",
                context=f"context_{i % 5}",
                category="field_label"
            )
            business_config_service.create_terminology_mapping(mapping_data)
        
        # Add many custom fields
        for i in range(30):
            field_data = CustomFieldSchemaCreate(
                business_config_id=config.id,
                field_name=f"custom_field_{i}",
                field_label=f"Custom Field {i}",
                field_type=FieldTypeEnum.TEXT if i % 2 == 0 else FieldTypeEnum.NUMBER,
                entity_type=f"entity_{i % 3}",
                display_order=i
            )
            business_config_service.create_custom_field_schema(field_data)
        
        # Add many BOMs
        for i in range(20):
            bom_data = BillOfMaterialsCreate(
                business_config_id=config.id,
                bom_name=f"BOM {i}",
                bom_code=f"BOM_{i:03d}",
                components=[
                    {
                        "component_id": str(uuid.uuid4()),
                        "component_name": f"Component {j}",
                        "quantity": j + 1,
                        "unit": "piece",
                        "cost_per_unit": (j + 1) * 10.5
                    }
                    for j in range(5)
                ],
                production_steps=[
                    {
                        "step_name": f"Step {k}",
                        "order": k + 1,
                        "estimated_time": (k + 1) * 15
                    }
                    for k in range(3)
                ]
            )
            business_config_service.create_bill_of_materials(bom_data)
        
        # Test retrieval performance with large dataset
        start_time = time.time()
        complete_config = business_config_service.get_business_configuration(config.id)
        retrieval_time = time.time() - start_time
        
        assert retrieval_time < 2.0, f"Large config retrieval took {retrieval_time:.2f} seconds, expected < 2.0"
        assert complete_config is not None
        assert len(complete_config.terminology_mappings) >= 50
        assert len(complete_config.custom_field_schemas) >= 30
        
        # Test specific queries
        start_time = time.time()
        terminology_mappings = business_config_service.get_terminology_mappings(config.id)
        query_time = time.time() - start_time
        
        assert query_time < 0.5, f"Terminology query took {query_time:.2f} seconds, expected < 0.5"
        assert len(terminology_mappings) >= 50

class TestDataValidationAndIntegrity:
    """Test data validation and integrity constraints"""
    
    def test_invalid_business_configuration_data(self, business_config_service):
        """Test handling of invalid business configuration data"""
        
        # Test invalid business type (should be handled by enum validation)
        with pytest.raises(ValueError):
            invalid_config = BusinessTypeConfigurationCreate(
                business_type="invalid_type",  # This should fail enum validation
                name="Invalid Config"
            )
        
        # Test empty name
        with pytest.raises(ValueError):
            invalid_config = BusinessTypeConfigurationCreate(
                business_type=BusinessTypeEnum.RETAIL_STORE,
                name=""  # Empty name should fail validation
            )
    
    def test_terminology_mapping_constraints(self, business_config_service):
        """Test terminology mapping validation and constraints"""
        # Create valid business config first
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.RETAIL_STORE,
            name="Test Store",
            industry="Retail"
        )
        config = business_config_service.create_business_configuration(config_data)
        
        # Test valid terminology mapping
        valid_mapping = TerminologyMappingCreate(
            business_config_id=config.id,
            standard_term="inventory",
            business_term="Products",
            context="inventory",
            category="field_label"
        )
        
        mapping = business_config_service.create_terminology_mapping(valid_mapping)
        assert mapping.id is not None
        
        # Test invalid business_config_id
        with pytest.raises(Exception):  # Should raise foreign key constraint error
            invalid_mapping = TerminologyMappingCreate(
                business_config_id=uuid.uuid4(),  # Non-existent config ID
                standard_term="test",
                business_term="Test"
            )
            business_config_service.create_terminology_mapping(invalid_mapping)
    
    def test_custom_field_validation_rules(self, business_config_service):
        """Test custom field validation rules"""
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.RETAIL_STORE,
            name="Validation Test Store"
        )
        config = business_config_service.create_business_configuration(config_data)
        
        # Test enum field with options
        enum_field = CustomFieldSchemaCreate(
            business_config_id=config.id,
            field_name="size",
            field_label="Size",
            field_type=FieldTypeEnum.ENUM,
            entity_type="inventory",
            field_options=[
                {"value": "S", "label": "Small"},
                {"value": "M", "label": "Medium"},
                {"value": "L", "label": "Large"}
            ],
            validation_rules=[
                {"rule_type": "required", "value": True, "message": "Size is required"}
            ]
        )
        
        field = business_config_service.create_custom_field_schema(enum_field)
        assert field.id is not None
        assert len(field.field_options) == 3
        assert len(field.validation_rules) == 1
        
        # Test number field with range validation
        number_field = CustomFieldSchemaCreate(
            business_config_id=config.id,
            field_name="price",
            field_label="Price",
            field_type=FieldTypeEnum.NUMBER,
            entity_type="inventory",
            validation_rules=[
                {"rule_type": "min_value", "value": 0, "message": "Price must be positive"},
                {"rule_type": "max_value", "value": 10000, "message": "Price cannot exceed $10,000"}
            ]
        )
        
        number_field_result = business_config_service.create_custom_field_schema(number_field)
        assert number_field_result.id is not None
        assert len(number_field_result.validation_rules) == 2
    
    def test_workflow_configuration_integrity(self, business_config_service):
        """Test workflow configuration data integrity"""
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.SERVICE_BUSINESS,
            name="Workflow Test Service"
        )
        config = business_config_service.create_business_configuration(config_data)
        
        # Test workflow with complex stages and rules
        complex_workflow = WorkflowConfigurationCreate(
            business_config_id=config.id,
            workflow_type=WorkflowTypeEnum.INVOICE_WORKFLOW,
            workflow_name="Complex Service Workflow",
            stages=[
                {"name": "Initial", "order": 1, "is_required": True},
                {"name": "In Progress", "order": 2, "is_required": True},
                {"name": "Review", "order": 3, "is_required": True},
                {"name": "Completed", "order": 4, "is_required": True}
            ],
            rules=[
                {
                    "name": "Auto Progress Small Jobs",
                    "condition": {"estimated_hours": {"lt": 2}},
                    "action": {"type": "auto_progress", "to_stage": "In Progress"},
                    "is_active": True
                },
                {
                    "name": "Require Review for Large Jobs",
                    "condition": {"estimated_hours": {"gte": 40}},
                    "action": {"type": "require_review", "reviewer_role": "senior_consultant"},
                    "is_active": True
                }
            ],
            approvals=[
                {
                    "stage": "Review",
                    "required_role": "project_manager",
                    "is_required": True,
                    "conditions": {"estimated_hours": {"gte": 20}}
                }
            ],
            notifications=[
                {
                    "event": "stage_changed",
                    "recipients": ["client", "project_manager"],
                    "template": "service_progress_update",
                    "is_active": True
                }
            ]
        )
        
        workflow = business_config_service.create_workflow_configuration(complex_workflow)
        assert workflow.id is not None
        assert len(workflow.stages) == 4
        assert len(workflow.rules) == 2
        assert len(workflow.approvals) == 1
        assert len(workflow.notifications) == 1
        
        # Verify stage ordering
        stages = sorted(workflow.stages, key=lambda x: x["order"])
        assert stages[0]["name"] == "Initial"
        assert stages[3]["name"] == "Completed"

class TestBusinessTypeDetectionAccuracy:
    """Test business type detection accuracy and edge cases"""
    
    def test_detection_with_mixed_keywords(self, business_config_service):
        """Test detection with mixed business type keywords"""
        
        # Test business with multiple type indicators
        mixed_request = BusinessTypeDetectionRequest(
            business_description="We manufacture gold jewelry and also operate a retail store selling our products directly to customers. We also provide repair services.",
            industry="Jewelry Manufacturing & Retail",
            primary_activities=["manufacturing", "retail sales", "jewelry repair", "gold working"],
            customer_types=["individual customers", "jewelry stores", "repair clients"]
        )
        
        result = business_config_service.detect_business_type(mixed_request)
        
        # Should detect the strongest signal (gold shop due to gold + jewelry keywords)
        assert result.suggested_business_type == BusinessTypeEnum.GOLD_SHOP
        assert result.confidence_score > 0.6
        assert len(result.alternative_suggestions) >= 1
        
        # Check that alternatives include manufacturing and retail
        alt_types = [alt["business_type"] for alt in result.alternative_suggestions]
        assert BusinessTypeEnum.MANUFACTURING in alt_types or BusinessTypeEnum.RETAIL_STORE in alt_types
    
    def test_detection_with_minimal_information(self, business_config_service):
        """Test detection with minimal business information"""
        minimal_request = BusinessTypeDetectionRequest(
            business_description="Small business",
            primary_activities=[],
            customer_types=[]
        )
        
        result = business_config_service.detect_business_type(minimal_request)
        
        # Should default to retail store with low confidence
        assert result.suggested_business_type == BusinessTypeEnum.RETAIL_STORE
        assert result.confidence_score >= 0.3
        assert result.confidence_score <= 0.6  # Should be low confidence
    
    def test_detection_with_foreign_language_content(self, business_config_service):
        """Test detection with non-English content"""
        foreign_request = BusinessTypeDetectionRequest(
            business_description="ما یک فروشگاه طلا و جواهرات هستیم که انواع طلا و سکه می‌فروشیم",  # Persian for gold shop
            industry="طلا و جواهرات",  # Gold and jewelry
            primary_activities=["فروش طلا", "فروش سکه", "جواهرات"],  # Gold sales, coin sales, jewelry
            customer_types=["مشتریان عادی"]  # Regular customers
        )
        
        result = business_config_service.detect_business_type(foreign_request)
        
        # Should still detect gold shop due to Persian keywords
        assert result.suggested_business_type == BusinessTypeEnum.GOLD_SHOP
        assert result.confidence_score > 0.5
    
    def test_detection_accuracy_across_all_types(self, business_config_service):
        """Test detection accuracy across all supported business types"""
        
        test_cases = [
            {
                "description": "We operate a full-service pharmacy dispensing prescription medications, vaccines, and health consultations.",
                "expected": BusinessTypeEnum.PHARMACY,
                "keywords": ["pharmacy", "prescription", "medications", "health"]
            },
            {
                "description": "Our automotive service center provides car repairs, oil changes, tire services, and vehicle maintenance.",
                "expected": BusinessTypeEnum.AUTOMOTIVE,
                "keywords": ["automotive", "car repairs", "vehicle maintenance"]
            },
            {
                "description": "We run a grocery store selling fresh produce, meat, dairy products, and household essentials.",
                "expected": BusinessTypeEnum.GROCERY_STORE,
                "keywords": ["grocery", "produce", "food retail"]
            },
            {
                "description": "Our clothing boutique specializes in designer fashion, accessories, and custom tailoring services.",
                "expected": BusinessTypeEnum.CLOTHING_STORE,
                "keywords": ["clothing", "fashion", "apparel"]
            },
            {
                "description": "We distribute electronic components, computer hardware, and technology products to retailers nationwide.",
                "expected": BusinessTypeEnum.WHOLESALE,
                "keywords": ["wholesale", "distribution", "bulk sales"]
            }
        ]
        
        for case in test_cases:
            request = BusinessTypeDetectionRequest(
                business_description=case["description"],
                primary_activities=case["keywords"]
            )
            
            result = business_config_service.detect_business_type(request)
            
            assert result.suggested_business_type == case["expected"], \
                f"Expected {case['expected']}, got {result.suggested_business_type} for: {case['description'][:50]}..."
            assert result.confidence_score > 0.4, \
                f"Low confidence {result.confidence_score} for {case['expected']}"

class TestErrorHandlingAndRecovery:
    """Test error handling and recovery scenarios"""
    
    def test_database_constraint_violations(self, business_config_service):
        """Test handling of database constraint violations"""
        
        # Create initial configuration
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.RETAIL_STORE,
            name="Original Store"
        )
        config = business_config_service.create_business_configuration(config_data)
        
        # Try to create duplicate business type
        duplicate_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.RETAIL_STORE,  # Same type
            name="Duplicate Store"
        )
        
        with pytest.raises(ValueError, match="Business type retail_store already exists"):
            business_config_service.create_business_configuration(duplicate_data)
    
    def test_invalid_foreign_key_references(self, business_config_service):
        """Test handling of invalid foreign key references"""
        
        # Try to create terminology mapping with non-existent business config
        invalid_mapping = TerminologyMappingCreate(
            business_config_id=uuid.uuid4(),  # Non-existent ID
            standard_term="test",
            business_term="Test"
        )
        
        with pytest.raises(Exception):  # Should raise database constraint error
            business_config_service.create_terminology_mapping(invalid_mapping)
    
    def test_malformed_json_data_handling(self, business_config_service):
        """Test handling of malformed JSON data in JSONB fields"""
        
        config_data = BusinessTypeConfigurationCreate(
            business_type=BusinessTypeEnum.MANUFACTURING,
            name="JSON Test Manufacturing"
        )
        config = business_config_service.create_business_configuration(config_data)
        
        # Test BOM with complex nested data
        complex_bom = BillOfMaterialsCreate(
            business_config_id=config.id,
            bom_name="Complex BOM",
            components=[
                {
                    "component_id": str(uuid.uuid4()),
                    "component_name": "Complex Component",
                    "quantity": 1.5,
                    "unit": "kg",
                    "cost_per_unit": 25.75,
                    "nested_data": {
                        "specifications": {
                            "material": "steel",
                            "grade": "304",
                            "properties": ["corrosion_resistant", "high_strength"]
                        },
                        "supplier_info": {
                            "name": "Steel Corp",
                            "contact": "supplier@steelcorp.com",
                            "delivery_time": 7
                        }
                    }
                }
            ],
            production_steps=[
                {
                    "step_name": "Complex Assembly",
                    "order": 1,
                    "description": "Multi-stage assembly process",
                    "estimated_time": 120,
                    "required_skills": ["welding", "machining", "quality_control"],
                    "equipment": {
                        "primary": ["welding_station", "cnc_machine"],
                        "secondary": ["measuring_tools", "safety_equipment"]
                    },
                    "quality_checkpoints": [
                        {"checkpoint": "dimensional_check", "tolerance": 0.1},
                        {"checkpoint": "weld_inspection", "standard": "AWS_D1.1"}
                    ]
                }
            ]
        )
        
        bom = business_config_service.create_bill_of_materials(complex_bom)
        assert bom.id is not None
        assert len(bom.components) == 1
        assert bom.components[0]["nested_data"]["specifications"]["material"] == "steel"

class TestSecurityAndAccessControl:
    """Test security aspects and access control"""
    
    def test_sql_injection_prevention(self):
        """Test SQL injection prevention in API endpoints"""
        
        # Test malicious input in business type detection
        malicious_data = {
            "business_description": "'; DROP TABLE business_type_configurations; --",
            "industry": "'; DELETE FROM terminology_mappings; --",
            "primary_activities": ["'; UPDATE users SET role='admin'; --"],
            "customer_types": ["normal"]
        }
        
        response = client.post("/api/business-config/detect-business-type", json=malicious_data)
        
        # Should handle gracefully without SQL injection
        assert response.status_code == 200
        result = response.json()
        assert "suggested_business_type" in result
        
        # Verify database integrity by creating a legitimate configuration
        legitimate_data = {
            "business_type": "retail_store",
            "name": "Security Test Store",
            "industry": "Retail"
        }
        
        response = client.post("/api/business-config/configurations", json=legitimate_data)
        assert response.status_code == 200
    
    def test_input_sanitization(self):
        """Test input sanitization for various fields"""
        
        # Test with potentially dangerous input
        config_data = {
            "business_type": "service_business",
            "name": "<script>alert('xss')</script>Service Business",
            "description": "Business with <img src=x onerror=alert('xss')> description",
            "industry": "Technology & <b>Services</b>"
        }
        
        response = client.post("/api/business-config/configurations", json=config_data)
        assert response.status_code == 200
        
        result = response.json()
        # Input should be stored as-is (sanitization would happen at display time)
        assert "<script>" in result["name"]
        assert "<img" in result["description"]
    
    def test_large_payload_handling(self):
        """Test handling of large payloads"""
        
        # Create configuration with very large description
        large_description = "A" * 10000  # 10KB description
        
        config_data = {
            "business_type": "manufacturing",
            "name": "Large Data Manufacturing",
            "description": large_description,
            "industry": "Heavy Industry"
        }
        
        response = client.post("/api/business-config/configurations", json=config_data)
        assert response.status_code == 200
        
        result = response.json()
        assert len(result["description"]) == 10000

class TestAPIRateLimitingAndPerformance:
    """Test API rate limiting and performance characteristics"""
    
    def test_rapid_api_requests(self):
        """Test handling of rapid API requests"""
        
        # Make multiple rapid requests
        responses = []
        start_time = time.time()
        
        for i in range(20):
            response = client.get("/api/business-config/business-types")
            responses.append(response)
        
        total_time = time.time() - start_time
        
        # All requests should succeed
        assert all(r.status_code == 200 for r in responses)
        
        # Should handle 20 requests reasonably quickly
        assert total_time < 5.0, f"20 requests took {total_time:.2f} seconds, expected < 5.0"
    
    def test_concurrent_api_requests(self):
        """Test concurrent API requests"""
        
        def make_request(endpoint):
            return client.get(endpoint)
        
        endpoints = [
            "/api/business-config/business-types",
            "/api/business-config/workflow-types",
            "/api/business-config/field-types"
        ] * 5  # 15 total requests
        
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request, endpoint) for endpoint in endpoints]
            responses = [future.result() for future in futures]
        
        concurrent_time = time.time() - start_time
        
        # All requests should succeed
        assert all(r.status_code == 200 for r in responses)
        
        # Should handle concurrent requests efficiently
        assert concurrent_time < 3.0, f"Concurrent requests took {concurrent_time:.2f} seconds, expected < 3.0"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])