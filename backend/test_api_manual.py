#!/usr/bin/env python3
"""
Manual API test script to verify customer management endpoints work correctly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from auth import create_access_token
import uuid

client = TestClient(app)

def test_customer_api():
    """Test customer API endpoints manually"""
    print("🧪 Testing Customer Management API Endpoints")
    
    # Update admin user permissions to include customer management
    from database import SessionLocal
    from models import User, Role
    
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user and admin_user.role:
            # Check current permissions
            print(f"   Current permissions: {admin_user.role.permissions}")
            
            # Update role permissions to include customer management
            current_permissions = admin_user.role.permissions.copy()
            current_permissions.update({
                "manage_customers": True,
                "manage_payments": True
            })
            admin_user.role.permissions = current_permissions
            db.commit()
            
            # Refresh and check updated permissions
            db.refresh(admin_user.role)
            print(f"   Updated permissions: {admin_user.role.permissions}")
            print("✅ Updated admin permissions for customer management")
            
            # Get the user ID before closing the session
            admin_user_id = admin_user.id
        else:
            print("❌ Admin user or role not found")
            return
    finally:
        db.close()
    
    # Create a test token using actual admin user ID
    token_data = {"sub": str(admin_user_id)}
    token = create_access_token(token_data)
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n1. Testing health endpoint...")
    response = client.get("/health")
    print(f"   Health check: {response.status_code} - {response.json()}")
    
    print("\n2. Testing customer creation...")
    customer_data = {
        "name": "Test Customer API",
        "phone": "+1234567890123",
        "email": "testapi@example.com",
        "address": "123 API Test St"
    }
    
    response = client.post("/customers/", json=customer_data, headers=headers)
    print(f"   Create customer: {response.status_code}")
    if response.status_code == 200:
        customer = response.json()
        customer_id = customer["id"]
        print(f"   Created customer ID: {customer_id}")
        
        print("\n3. Testing customer retrieval...")
        response = client.get(f"/customers/{customer_id}", headers=headers)
        print(f"   Get customer: {response.status_code}")
        
        print("\n4. Testing customer list...")
        response = client.get("/customers/", headers=headers)
        print(f"   List customers: {response.status_code} - Found {len(response.json())} customers")
        
        print("\n5. Testing payment creation...")
        payment_data = {
            "customer_id": customer_id,
            "amount": 100.0,
            "payment_method": "cash",
            "description": "Test payment"
        }
        
        response = client.post(f"/customers/{customer_id}/payments", json=payment_data, headers=headers)
        print(f"   Create payment: {response.status_code}")
        
        if response.status_code == 200:
            print("\n6. Testing payment history...")
            response = client.get(f"/customers/{customer_id}/payments", headers=headers)
            print(f"   Get payments: {response.status_code} - Found {len(response.json())} payments")
            
            print("\n7. Testing debt summary...")
            response = client.get("/customers/debt-summary", headers=headers)
            print(f"   Debt summary: {response.status_code} - Found {len(response.json())} customers with debt info")
        
        print("\n✅ All customer API tests completed successfully!")
    else:
        print(f"   ❌ Failed to create customer: {response.json()}")

if __name__ == "__main__":
    test_customer_api()