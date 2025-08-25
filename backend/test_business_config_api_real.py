"""
Business Configuration API Tests with Real Database

Tests for business configuration API endpoints using real PostgreSQL database in Docker.
"""

import pytest
import requests
import json
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Import the FastAPI app and dependencies
from database import get_db, engine
from routers.business_config import router
from fastapi import FastAPI

# Create test app with just the business config router
test_app = FastAPI()
test_app.include_router(router)

client = TestClient(test_app)

@pytest.fixture
def db_session():
    """Create a database session for testing"""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    # Override the dependency
    def override_get_db():
        try:
            yield session
        finally:
            pass
    
    test_app.dependency_overrides[get_db] = override_get_db
    
    yield session
    
    # Clean up
    test_app.dependency_overrides.clear()
    session.close()
    transaction.rollback()
    connection.close()

class TestBusinessConfigurationAPI:
    """Test business configuration API endpoints"""
    
    def test_get_supported_business_types(self, db_session):
        """Test getting supported business types"""
        response = client.get("/api/business-config/business-types")
        
        assert response.status_code == 200
        data = response.json()
        assert "business_types" in data
        assert len(data["business_types"]) > 0
        
        # Check specific business types
        business_types = [bt["value"] for bt in data["business_types"]]
        assert "gold_shop" in business_types
        assert "retail_store" in business_types
        assert "restaurant" in business_types
        assert "service_business" in business_types
        assert "manufacturing" in business_types
    
    def test_get_workflow_types(self, db_session):
        """Test getting supported workflow types"""
        response = client.get("/api/business-config/workflow-types")
        
        assert response.status_code == 200
        data = response.json()
        assert "workflow_types" in data
        assert len(data["workflow_types"]) > 0
        
        workflow_types = [wt["value"] for wt in data["workflow_types"]]
        assert "invoice_workflow" in workflow_types
        assert "inventory_workflow" in workflow_types
    
    def test_get_field_types(self, db_session):
        """Test getting supported field types"""
        response = client.get("/api/business-config/field-types")
        
        assert response.status_code == 200
        data = response.json()
        assert "field_types" in data
        assert len(data["field_types"]) > 0
        
        field_types = [ft["value"] for ft in data["field_types"]]
        assert "text" in field_types
        assert "number" in field_types
        assert "enum" in field_types
    
    def test_business_type_detection_api(self, db_session):
        """Test business type detection via API"""
        detection_data = {
            "business_description": "We sell gold jewelry and precious metals to customers",
            "industry": "Jewelry",
            "primary_activities": ["gold sales", "jewelry"],
            "customer_types": ["individual customers"]
        }
        
        response = client.post("/api/business-config/detect-business-type", json=detection_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "suggested_business_type" in data
        assert "confidence_score" in data
        assert "reasoning" in data
        assert data["suggested_business_type"] == "gold_shop"
        assert data["confidence_score"] > 0.5
    
    def test_create_business_configuration_api(self, db_session):
        """Test creating business configuration via API"""
        config_data = {
            "business_type": "retail_store",
            "name": "Test Retail Store",
            "description": "A test retail store configuration",
            "industry": "Retail",
            "is_active": True,
            "is_default": False
        }
        
        response = client.post("/api/business-config/configurations", json=config_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["business_type"] == "retail_store"
        assert data["name"] == "Test Retail Store"
        assert data["industry"] == "Retail"
        assert "id" in data
        assert "created_at" in data
        
        return data["id"]  # Return ID for further tests
    
    def test_get_business_configuration_api(self, db_session):
        """Test getting business configuration via API"""
        # First create a configuration
        config_id = self.test_create_business_configuration_api(db_session)
        
        # Then retrieve it
        response = client.get(f"/api/business-config/configurations/{config_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == config_id
        assert data["business_type"] == "retail_store"
        assert data["name"] == "Test Retail Store"
        assert "terminology_mappings" in data
        assert "workflow_configurations" in data
        assert "custom_field_schemas" in data
        assert "feature_configurations" in data
    
    def test_list_business_configurations_api(self, db_session):
        """Test listing business configurations via API"""
        # Create a configuration first
        self.test_create_business_configuration_api(db_session)
        
        response = client.get("/api/business-config/configurations")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check first configuration
        config = data[0]
        assert "id" in config
        assert "business_type" in config
        assert "name" in config
    
    def test_business_setup_wizard_api(self, db_session):
        """Test business setup wizard via API"""
        setup_data = {
            "business_type": "service_business",
            "business_name": "ProTech Solutions",
            "industry": "Technology Services",
            "features_to_enable": [
                "time_tracking",
                "service_catalog",
                "project_management"
            ],
            "custom_terminology": {
                "inventory": "Services",
                "customer": "Client",
                "invoice": "Service Invoice"
            }
        }
        
        response = client.post("/api/business-config/setup-wizard", json=setup_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["business_type"] == "service_business"
        assert data["name"] == "ProTech Solutions"
        assert data["industry"] == "Technology Services"
        
        config_id = data["id"]
        
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

class TestTerminologyMappingAPI:
    """Test terminology mapping API endpoints"""
    
    def test_create_and_get_terminology_mapping(self, db_session):
        """Test creating and retrieving terminology mappings"""
        # First create a business configuration
        config_data = {
            "business_type": "gold_shop",
            "name": "Test Gold Shop",
            "industry": "Jewelry"
        }
        
        config_response = client.post("/api/business-config/configurations", json=config_data)
        config_id = config_response.json()["id"]
        
        # Create terminology mapping
        mapping_data = {
            "business_config_id": config_id,
            "standard_term": "inventory",
            "business_term": "Gold Items",
            "context": "inventory",
            "category": "field_label",
            "language_code": "en"
        }
        
        response = client.post("/api/business-config/terminology", json=mapping_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["business_config_id"] == config_id
        assert data["standard_term"] == "inventory"
        assert data["business_term"] == "Gold Items"
        
        # Get terminology mappings
        response = client.get(f"/api/business-config/terminology/{config_id}")
        
        assert response.status_code == 200
        mappings = response.json()
        assert len(mappings) >= 1
        
        # Find our mapping
        our_mapping = next((m for m in mappings if m["standard_term"] == "inventory"), None)
        assert our_mapping is not None
        assert our_mapping["business_term"] == "Gold Items"

class TestCustomFieldAPI:
    """Test custom field API endpoints"""
    
    def test_create_and_get_custom_fields(self, db_session):
        """Test creating and retrieving custom fields"""
        # Create business configuration
        config_data = {
            "business_type": "service_business",
            "name": "Test Service Business",
            "industry": "Professional Services"
        }
        
        config_response = client.post("/api/business-config/configurations", json=config_data)
        config_id = config_response.json()["id"]
        
        # Create custom field
        field_data = {
            "business_config_id": config_id,
            "field_name": "skill_level",
            "field_label": "Required Skill Level",
            "field_type": "enum",
            "entity_type": "service",
            "field_options": [
                {"value": "junior", "label": "Junior Level"},
                {"value": "senior", "label": "Senior Level"},
                {"value": "expert", "label": "Expert Level"}
            ],
            "is_required": True,
            "is_searchable": True,
            "is_filterable": True,
            "display_order": 1
        }
        
        response = client.post("/api/business-config/custom-fields", json=field_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["business_config_id"] == config_id
        assert data["field_name"] == "skill_level"
        assert data["field_type"] == "enum"
        assert len(data["field_options"]) == 3
        
        # Get custom fields
        response = client.get(f"/api/business-config/custom-fields/{config_id}")
        
        assert response.status_code == 200
        fields = response.json()
        assert len(fields) >= 1
        
        # Find our field
        our_field = next((f for f in fields if f["field_name"] == "skill_level"), None)
        assert our_field is not None
        assert our_field["field_type"] == "enum"

class TestFeatureConfigurationAPI:
    """Test feature configuration API endpoints"""
    
    def test_create_and_check_features(self, db_session):
        """Test creating and checking feature configurations"""
        # Create business configuration
        config_data = {
            "business_type": "manufacturing",
            "name": "Test Manufacturing",
            "industry": "Manufacturing"
        }
        
        config_response = client.post("/api/business-config/configurations", json=config_data)
        config_id = config_response.json()["id"]
        
        # Create feature configuration
        feature_data = {
            "business_config_id": config_id,
            "feature_name": "advanced_production",
            "feature_category": "manufacturing",
            "is_enabled": True,
            "configuration": {
                "max_production_lines": 10,
                "quality_control": True
            },
            "required_roles": ["production_manager", "admin"]
        }
        
        response = client.post("/api/business-config/features", json=feature_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["business_config_id"] == config_id
        assert data["feature_name"] == "advanced_production"
        assert data["is_enabled"] is True
        
        # Check if feature is enabled
        response = client.get(f"/api/business-config/features/{config_id}/advanced_production/enabled")
        
        assert response.status_code == 200
        data = response.json()
        assert data["feature_name"] == "advanced_production"
        assert data["is_enabled"] is True
        
        # Check non-existent feature
        response = client.get(f"/api/business-config/features/{config_id}/non_existent_feature/enabled")
        
        assert response.status_code == 200
        data = response.json()
        assert data["feature_name"] == "non_existent_feature"
        assert data["is_enabled"] is False

class TestServiceCatalogAPI:
    """Test service catalog API endpoints"""
    
    def test_create_and_get_service_catalog(self, db_session):
        """Test creating and retrieving service catalog"""
        # Create service business configuration
        config_data = {
            "business_type": "service_business",
            "name": "Test Service Business",
            "industry": "Professional Services"
        }
        
        config_response = client.post("/api/business-config/configurations", json=config_data)
        config_id = config_response.json()["id"]
        
        # Create service catalog item
        service_data = {
            "business_config_id": config_id,
            "service_name": "Web Development",
            "service_code": "WEB_DEV",
            "description": "Custom web development service",
            "category": "Development",
            "base_price": "150.00",
            "currency": "USD",
            "estimated_duration": 480,
            "requires_booking": True,
            "is_time_tracked": True,
            "billing_method": "hourly"
        }
        
        response = client.post("/api/business-config/service-catalog", json=service_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["business_config_id"] == config_id
        assert data["service_name"] == "Web Development"
        assert data["service_code"] == "WEB_DEV"
        assert data["billing_method"] == "hourly"
        
        # Get service catalog
        response = client.get(f"/api/business-config/service-catalog/{config_id}")
        
        assert response.status_code == 200
        services = response.json()
        assert len(services) >= 1
        
        # Find our service
        our_service = next((s for s in services if s["service_code"] == "WEB_DEV"), None)
        assert our_service is not None
        assert our_service["service_name"] == "Web Development"

class TestErrorHandling:
    """Test API error handling"""
    
    def test_invalid_business_type(self, db_session):
        """Test creating configuration with invalid business type"""
        config_data = {
            "business_type": "invalid_type",
            "name": "Invalid Config"
        }
        
        response = client.post("/api/business-config/configurations", json=config_data)
        
        # Should return validation error
        assert response.status_code == 422
    
    def test_nonexistent_configuration(self, db_session):
        """Test getting non-existent configuration"""
        fake_id = str(uuid.uuid4())
        
        response = client.get(f"/api/business-config/configurations/{fake_id}")
        
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    def test_duplicate_business_type(self, db_session):
        """Test creating duplicate business type"""
        config_data = {
            "business_type": "pharmacy",
            "name": "First Pharmacy"
        }
        
        # Create first configuration
        response1 = client.post("/api/business-config/configurations", json=config_data)
        assert response1.status_code == 200
        
        # Try to create duplicate
        config_data["name"] = "Second Pharmacy"
        response2 = client.post("/api/business-config/configurations", json=config_data)
        
        assert response2.status_code == 400
        data = response2.json()
        assert "already exists" in data["detail"].lower()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])