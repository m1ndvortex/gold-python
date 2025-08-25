"""
Business Configuration System Test

Simple test to verify the business configuration system is working correctly.
"""

import pytest
import uuid
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

# Import required modules
from database import get_db, engine
from services.business_config_service import BusinessConfigurationService
from schemas_business_config import (
    BusinessTypeConfigurationCreate, BusinessTypeEnum,
    BusinessTypeDetectionRequest, BusinessSetupWizardRequest
)

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

def test_business_type_detection(business_config_service):
    """Test business type detection functionality"""
    detection_request = BusinessTypeDetectionRequest(
        business_description="We sell gold jewelry, precious metals, and coins. We specialize in gold trading.",
        industry="Jewelry",
        primary_activities=["gold trading", "jewelry sales"],
        customer_types=["individual customers"]
    )
    
    result = business_config_service.detect_business_type(detection_request)
    
    assert result.suggested_business_type == BusinessTypeEnum.GOLD_SHOP
    assert result.confidence_score > 0.5
    assert "gold" in result.reasoning.lower()

def test_business_setup_wizard(business_config_service):
    """Test business setup wizard functionality"""
    setup_request = BusinessSetupWizardRequest(
        business_type=BusinessTypeEnum.RETAIL_STORE,
        business_name="Test Retail Store",
        industry="General Retail",
        features_to_enable=["inventory_management", "customer_management"],
        custom_terminology={
            "inventory": "Products",
            "customer": "Shopper"
        }
    )
    
    config = business_config_service.setup_business_wizard(setup_request)
    
    assert config.id is not None
    assert config.business_type == BusinessTypeEnum.RETAIL_STORE
    assert config.name == "Test Retail Store"
    assert config.industry == "General Retail"
    
    # Check terminology mappings were created
    mappings = business_config_service.get_terminology_mappings(config.id)
    mapping_dict = {m.standard_term: m.business_term for m in mappings}
    assert mapping_dict.get("inventory") == "Products"
    assert mapping_dict.get("customer") == "Shopper"

def test_create_business_configuration(business_config_service):
    """Test creating a basic business configuration"""
    config_data = BusinessTypeConfigurationCreate(
        business_type=BusinessTypeEnum.SERVICE_BUSINESS,
        name="Test Service Business",
        description="A test service business configuration",
        industry="Professional Services",
        is_active=True,
        is_default=False
    )
    
    config = business_config_service.create_business_configuration(config_data)
    
    assert config.id is not None
    assert config.business_type == BusinessTypeEnum.SERVICE_BUSINESS
    assert config.name == "Test Service Business"
    assert config.description == "A test service business configuration"
    assert config.industry == "Professional Services"
    assert config.is_active is True
    assert config.created_at is not None

def test_get_business_configuration(business_config_service):
    """Test retrieving business configuration"""
    # Create configuration
    config_data = BusinessTypeConfigurationCreate(
        business_type=BusinessTypeEnum.MANUFACTURING,
        name="Test Manufacturing",
        industry="Manufacturing"
    )
    
    created_config = business_config_service.create_business_configuration(config_data)
    
    # Retrieve configuration
    retrieved_config = business_config_service.get_business_configuration(created_config.id)
    
    assert retrieved_config is not None
    assert retrieved_config.id == created_config.id
    assert retrieved_config.business_type == BusinessTypeEnum.MANUFACTURING
    assert retrieved_config.name == "Test Manufacturing"

def test_list_business_configurations(business_config_service):
    """Test listing business configurations"""
    # Create multiple configurations
    config_types = [BusinessTypeEnum.RETAIL_STORE, BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.PHARMACY]
    
    created_configs = []
    for i, business_type in enumerate(config_types):
        config_data = BusinessTypeConfigurationCreate(
            business_type=business_type,
            name=f"Test {business_type.value.replace('_', ' ').title()}",
            industry=f"Industry {i+1}"
        )
        config = business_config_service.create_business_configuration(config_data)
        created_configs.append(config)
    
    # List configurations
    configs = business_config_service.list_business_configurations()
    
    assert len(configs) >= 3
    config_types_found = [config.business_type for config in configs]
    
    for created_config in created_configs:
        assert created_config.business_type in config_types_found

if __name__ == "__main__":
    pytest.main([__file__, "-v"])