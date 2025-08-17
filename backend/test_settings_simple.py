#!/usr/bin/env python3
"""Simple settings test to verify functionality"""

import requests
import json

# Test the settings endpoints directly
BASE_URL = "http://localhost:8000"

def test_settings():
    print("Testing Settings Endpoints...")
    
    # 1. Login as admin
    print("1. Logging in as admin...")
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return False
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful")
    
    # 2. Test company settings
    print("2. Testing company settings...")
    settings_response = requests.get(f"{BASE_URL}/settings/company", headers=headers)
    
    if settings_response.status_code != 200:
        print(f"❌ Get company settings failed: {settings_response.text}")
        return False
    
    print("✅ Get company settings successful")
    print(f"   Company: {settings_response.json().get('company_name', 'N/A')}")
    
    # 3. Test updating company settings
    print("3. Testing update company settings...")
    update_data = {
        "company_name": "Test Gold Shop",
        "default_gold_price": 55.0
    }
    
    update_response = requests.put(f"{BASE_URL}/settings/company", json=update_data, headers=headers)
    
    if update_response.status_code != 200:
        print(f"❌ Update company settings failed: {update_response.text}")
        return False
    
    print("✅ Update company settings successful")
    
    # 4. Test gold price config
    print("4. Testing gold price config...")
    gold_price_response = requests.get(f"{BASE_URL}/settings/gold-price", headers=headers)
    
    if gold_price_response.status_code != 200:
        print(f"❌ Get gold price failed: {gold_price_response.text}")
        return False
    
    print("✅ Get gold price successful")
    print(f"   Gold Price: {gold_price_response.json().get('current_price', 'N/A')}")
    
    # 5. Test permissions structure
    print("5. Testing permissions structure...")
    permissions_response = requests.get(f"{BASE_URL}/settings/permissions", headers=headers)
    
    if permissions_response.status_code != 200:
        print(f"❌ Get permissions failed: {permissions_response.text}")
        return False
    
    print("✅ Get permissions successful")
    categories = permissions_response.json().get("categories", [])
    print(f"   Permission categories: {len(categories)}")
    
    # 6. Test roles
    print("6. Testing roles...")
    roles_response = requests.get(f"{BASE_URL}/settings/roles", headers=headers)
    
    if roles_response.status_code != 200:
        print(f"❌ Get roles failed: {roles_response.text}")
        return False
    
    print("✅ Get roles successful")
    roles = roles_response.json()
    print(f"   Roles found: {len(roles)}")
    
    # 7. Test users
    print("7. Testing users...")
    users_response = requests.get(f"{BASE_URL}/settings/users", headers=headers)
    
    if users_response.status_code != 200:
        print(f"❌ Get users failed: {users_response.text}")
        return False
    
    print("✅ Get users successful")
    users = users_response.json().get("users", [])
    print(f"   Users found: {len(users)}")
    
    print("\n🎉 All settings tests passed!")
    return True

if __name__ == "__main__":
    success = test_settings()
    exit(0 if success else 1)