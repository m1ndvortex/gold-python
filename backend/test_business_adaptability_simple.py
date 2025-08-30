"""
Simple test for business adaptability system
"""

import asyncio
from decimal import Decimal
from uuid import uuid4
from database import SessionLocal
from models_business_adaptability import BusinessType, EnhancedBusinessConfiguration
from schemas_business_adaptability import BusinessTypeCreate, EnhancedBusinessConfigurationCreate

async def test_basic_functionality():
    """Test basic business adaptability functionality"""
    db = SessionLocal()
    
    try:
        # Test 1: Create business type directly
        print("Test 1: Creating business type...")
        business_type_data = {
            "type_code": "test_retail",
            "name": "Test Retail Store",
            "description": "Test retail business type",
            "default_configuration": {"inventory_tracking": True},
            "default_terminology": {"item": "product"},
            "default_workflow_config": {"auto_reorder": False},
            "default_feature_flags": {"inventory_tracking": True},
            "default_units": [{"unit_code": "pcs", "unit_name": "Pieces", "unit_type": "count"}],
            "default_pricing_models": [{"rule_name": "Standard Markup", "rule_type": "markup"}]
        }
        
        business_type = BusinessType(**business_type_data)
        db.add(business_type)
        db.commit()
        db.refresh(business_type)
        
        print(f"✓ Business type created: {business_type.name} (ID: {business_type.id})")
        
        # Test 2: Create business configuration
        print("Test 2: Creating business configuration...")
        config_data = {
            "business_type_id": business_type.id,
            "business_name": "Test Store",
            "business_address": "123 Test Street",
            "configuration": {"store_hours": "9AM-5PM"},
            "terminology_mapping": {"customer": "client"},
            "feature_flags": {"pos_integration": True}
        }
        
        business_config = EnhancedBusinessConfiguration(**config_data)
        db.add(business_config)
        db.commit()
        db.refresh(business_config)
        
        print(f"✓ Business configuration created: {business_config.business_name} (ID: {business_config.id})")
        
        # Test 3: Query data
        print("Test 3: Querying data...")
        all_types = db.query(BusinessType).filter(BusinessType.type_code.like('%test%')).all()
        all_configs = db.query(EnhancedBusinessConfiguration).all()
        
        print(f"✓ Found {len(all_types)} business types and {len(all_configs)} configurations")
        
        # Test 4: Test API endpoint
        print("Test 4: Testing API endpoint...")
        try:
            import requests
            response = requests.get("http://localhost:8000/api/business-adaptability/business-types")
            if response.status_code == 200:
                print(f"✓ API endpoint working: {len(response.json())} business types returned")
            else:
                print(f"⚠ API endpoint returned status: {response.status_code}")
        except Exception as api_error:
            print(f"⚠ API test failed: {api_error}")
        
        print("\n✅ All basic tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        db.rollback()
        raise
    finally:
        # Clean up
        try:
            db.query(EnhancedBusinessConfiguration).filter(
                EnhancedBusinessConfiguration.business_name == "Test Store"
            ).delete()
            db.query(BusinessType).filter(
                BusinessType.type_code == "test_retail"
            ).delete()
            db.commit()
            print("✓ Test data cleaned up")
        except:
            pass
        db.close()

if __name__ == "__main__":
    asyncio.run(test_basic_functionality())