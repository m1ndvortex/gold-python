"""
Manual API test for category intelligence endpoints
"""

import requests
import json

def test_category_intelligence_endpoints():
    """Test category intelligence API endpoints"""
    base_url = "http://localhost:8000"
    
    endpoints = [
        "/api/category-intelligence/performance",
        "/api/category-intelligence/seasonal-patterns", 
        "/api/category-intelligence/cross-selling",
        "/api/category-intelligence/insights/summary"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"\nTesting {endpoint}...")
            response = requests.get(f"{base_url}{endpoint}")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response Type: {type(data)}")
                if isinstance(data, list):
                    print(f"Items Count: {len(data)}")
                elif isinstance(data, dict):
                    print(f"Keys: {list(data.keys())}")
                print("✅ Success")
            else:
                print(f"❌ Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_category_intelligence_endpoints()