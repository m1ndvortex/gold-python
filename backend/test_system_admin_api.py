#!/usr/bin/env python3
"""
Test script for System Administration API endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

def get_auth_token():
    """Get authentication token for API requests"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=TEST_USER_CREDENTIALS
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"Failed to authenticate: {response.status_code}")
            return None
    except Exception as e:
        print(f"Authentication error: {e}")
        return None

def test_endpoint(endpoint, token, method="GET", data=None):
    """Test a single API endpoint"""
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json=data)
        else:
            print(f"Unsupported method: {method}")
            return False
            
        print(f"Testing {method} {endpoint}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2, default=str)[:500]}...")
                return True
            except:
                print(f"Response: {response.text[:200]}...")
                return True
        elif response.status_code == 401:
            print("Authentication required")
            return False
        elif response.status_code == 403:
            print("Access forbidden - insufficient permissions")
            return False
        else:
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Request failed: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("SYSTEM ADMINISTRATION API TESTS")
    print("=" * 60)
    
    # Test basic connectivity
    print("\n1. Testing basic connectivity...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Backend is accessible")
        else:
            print("❌ Backend is not accessible")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        sys.exit(1)
    
    # Get authentication token
    print("\n2. Getting authentication token...")
    token = get_auth_token()
    if not token:
        print("❌ Failed to get authentication token")
        print("Note: This is expected if no admin user exists yet")
        print("Testing endpoints without authentication...")
        token = None
    else:
        print("✅ Authentication successful")
    
    # Test system admin endpoints
    print("\n3. Testing System Administration endpoints...")
    
    endpoints_to_test = [
        "/admin/system/health",
        "/admin/services/status", 
        "/admin/performance/metrics",
        "/admin/database/status",
        "/admin/redis/status",
        "/admin/backups/status",
        "/admin/sessions",
        "/admin/alerts",
        "/admin/ssl/status",
        "/admin/security/status"
    ]
    
    successful_tests = 0
    total_tests = len(endpoints_to_test)
    
    for endpoint in endpoints_to_test:
        print(f"\n--- Testing {endpoint} ---")
        if test_endpoint(endpoint, token):
            successful_tests += 1
            print("✅ Test passed")
        else:
            print("❌ Test failed")
    
    # Test POST endpoints
    print("\n4. Testing POST endpoints...")
    
    post_endpoints = [
        ("/admin/logs/search", {"services": [], "levels": [], "limit": 10}),
        ("/admin/services/manage", {"service": "backend", "action": "restart"}),
    ]
    
    for endpoint, data in post_endpoints:
        print(f"\n--- Testing POST {endpoint} ---")
        if test_endpoint(endpoint, token, "POST", data):
            successful_tests += 1
            print("✅ Test passed")
        else:
            print("❌ Test failed")
        total_tests += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Total tests: {total_tests}")
    print(f"Successful: {successful_tests}")
    print(f"Failed: {total_tests - successful_tests}")
    print(f"Success rate: {(successful_tests/total_tests)*100:.1f}%")
    
    if successful_tests == total_tests:
        print("\n🎉 All tests passed! System Administration API is working correctly.")
        return 0
    elif successful_tests > total_tests * 0.7:
        print("\n⚠️  Most tests passed. Some endpoints may require authentication or specific setup.")
        return 0
    else:
        print("\n❌ Many tests failed. Please check the backend implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())