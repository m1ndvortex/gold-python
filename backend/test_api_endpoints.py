"""
Test API endpoints for business adaptability system
"""

import requests
import json

def test_api_endpoints():
    """Test the business adaptability API endpoints"""
    
    print("Testing Business Adaptability API Endpoints...")
    
    # Test getting business types
    print("\n1. Testing business types endpoint...")
    response = requests.get('http://localhost:8000/api/business-adaptability/business-types')
    print(f'Business Types API: Status {response.status_code}')
    
    if response.status_code == 200:
        data = response.json()
        print(f'Found {len(data)} business types:')
        for bt in data[:3]:  # Show first 3
            print(f'  - {bt["name"]} ({bt["type_code"]})')
        
        # Test creating a business configuration
        print("\n2. Testing business configuration creation...")
        jewelry_type = None
        for bt in data:
            if bt['type_code'] == 'jewelry_gold':
                jewelry_type = bt
                break
        
        if jewelry_type:
            config_data = {
                'business_type_id': jewelry_type['id'],
                'business_name': 'Golden Palace Jewelry',
                'business_address': '123 Gold Street',
                'business_phone': '+1-555-0123',
                'currency': 'USD'
            }
            
            response = requests.post(
                'http://localhost:8000/api/business-adaptability/configurations',
                json=config_data
            )
            print(f'Configuration Creation API: Status {response.status_code}')
            
            if response.status_code == 200:
                config = response.json()
                print(f'Created configuration: {config["business_name"]} (ID: {config["id"]})')
                
                # Test getting terminology mapping
                print("\n3. Testing terminology mapping...")
                response = requests.get(f'http://localhost:8000/api/business-adaptability/configurations/{config["id"]}/terminology')
                print(f'Terminology API: Status {response.status_code}')
                
                if response.status_code == 200:
                    terminology = response.json()
                    print(f'Terminology mapping: {terminology}')
                
                # Test getting units of measure
                print("\n4. Testing units of measure...")
                response = requests.get('http://localhost:8000/api/business-adaptability/units-of-measure')
                print(f'Units API: Status {response.status_code}')
                
                if response.status_code == 200:
                    units = response.json()
                    print(f'Found {len(units)} units of measure')
                    weight_units = [u for u in units if u['unit_type'] == 'weight']
                    print(f'Weight units: {[u["unit_name"] for u in weight_units[:5]]}')
                
                # Clean up - delete the test configuration
                print("\n5. Cleaning up test data...")
                from database import SessionLocal
                from models_business_adaptability import EnhancedBusinessConfiguration
                
                db = SessionLocal()
                try:
                    test_config = db.query(EnhancedBusinessConfiguration).filter(
                        EnhancedBusinessConfiguration.business_name == 'Golden Palace Jewelry'
                    ).first()
                    if test_config:
                        db.delete(test_config)
                        db.commit()
                        print("✓ Test configuration cleaned up")
                except:
                    pass
                finally:
                    db.close()
            else:
                print(f"Configuration creation failed: {response.text}")
        else:
            print("Jewelry business type not found")
    else:
        print(f"Business types API failed: {response.text}")
    
    print("\n✅ API endpoint tests completed!")

if __name__ == "__main__":
    test_api_endpoints()