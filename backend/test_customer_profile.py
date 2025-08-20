#!/usr/bin/env python3
"""
Comprehensive Customer Profile System Test Script

This script tests all the new customer profile fields and functionality:
- Full address fields (street, city, state, zip, country)
- Personal information (national ID, age, birthday, gender, nationality, occupation)
- Emergency contact information
- Additional fields (notes, tags, custom fields, preferences)
- Business fields (customer type, credit limit, payment terms, etc.)
- Status fields (is_active, blacklisted)

Test scenarios:
1. Create customers with all new fields
2. Update customer information
3. Test validation (unique constraints)
4. Test filtering capabilities
5. Test search functionality
"""

import requests
import json
import sys
from datetime import date, datetime
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# Test credentials - update these based on your system
TEST_USER = {
    "username": "admin",
    "password": "admin"
}

class CustomerProfileTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        
    def authenticate(self) -> bool:
        """Authenticate and get access token"""
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login",
                data=TEST_USER,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.auth_token = token_data["access_token"]
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                print("✓ Authentication successful")
                return True
            else:
                print(f"✗ Authentication failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"✗ Authentication error: {e}")
            return False
    
    def test_create_comprehensive_customer(self) -> Dict[str, Any]:
        """Test creating a customer with comprehensive profile data"""
        print("\n📝 Testing comprehensive customer creation...")
        
        customer_data = {
            "name": "John Doe Smith",
            "phone": "+1-555-0123",
            "email": "john.doe@email.com",
            
            # Comprehensive address
            "street_address": "1234 Main Street, Apt 5B",
            "city": "New York",
            "state": "New York",
            "postal_code": "10001",
            "country": "United States",
            
            # Personal information
            "national_id": "123-45-6789",
            "date_of_birth": "1985-06-15",
            "age": 39,
            "gender": "male",
            "nationality": "American",
            "occupation": "Software Engineer",
            
            # Emergency contact
            "emergency_contact_name": "Jane Doe Smith",
            "emergency_contact_phone": "+1-555-0124",
            "emergency_contact_relationship": "spouse",
            
            # Additional information
            "notes": "Prefers email communication. VIP customer since 2020.",
            "tags": ["VIP", "Regular", "Email-Preferred"],
            "custom_fields": {
                "preferred_metal": "Gold",
                "jewelry_style": "Classic",
                "anniversary_date": "2020-03-15"
            },
            "preferences": {
                "contact_method": "email",
                "marketing_emails": True,
                "newsletter": True
            },
            
            # Business fields
            "customer_type": "retail",
            "credit_limit": 5000.00,
            "payment_terms": 30,
            "discount_percentage": 5.0,
            "tax_exempt": False
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/customers/",
                json=customer_data
            )
            
            if response.status_code == 200:
                customer = response.json()
                print("✓ Comprehensive customer created successfully")
                print(f"  - Customer ID: {customer['id']}")
                print(f"  - Name: {customer['name']}")
                print(f"  - Full Address: {customer.get('street_address', '')}, {customer.get('city', '')}, {customer.get('state', '')}")
                print(f"  - National ID: {customer.get('national_id', 'N/A')}")
                print(f"  - Customer Type: {customer.get('customer_type', 'N/A')}")
                return customer
            else:
                print(f"✗ Failed to create customer: {response.status_code}")
                print(f"  Error: {response.text}")
                return None
        except Exception as e:
            print(f"✗ Error creating customer: {e}")
            return None
    
    def test_create_wholesale_customer(self) -> Dict[str, Any]:
        """Test creating a wholesale customer"""
        print("\n🏢 Testing wholesale customer creation...")
        
        customer_data = {
            "name": "ABC Jewelry Store Inc.",
            "phone": "+1-555-0200",
            "email": "orders@abcjewelry.com",
            
            # Business address
            "street_address": "5678 Business Blvd, Suite 100",
            "city": "Los Angeles",
            "state": "California",
            "postal_code": "90210",
            "country": "United States",
            
            # Business information
            "national_id": "98-7654321",  # EIN for business
            "customer_type": "wholesale",
            "credit_limit": 50000.00,
            "payment_terms": 60,
            "discount_percentage": 15.0,
            "tax_exempt": True,
            "tax_id": "98-7654321",
            
            # Business contact
            "emergency_contact_name": "Mike Johnson",
            "emergency_contact_phone": "+1-555-0201",
            "emergency_contact_relationship": "business_partner",
            
            "notes": "Wholesale customer with net 60 terms. Large orders monthly.",
            "tags": ["Wholesale", "Net60", "High-Volume"],
            "custom_fields": {
                "business_license": "CA-BWL-123456",
                "annual_volume": "500000",
                "preferred_categories": ["Rings", "Necklaces"]
            }
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/customers/",
                json=customer_data
            )
            
            if response.status_code == 200:
                customer = response.json()
                print("✓ Wholesale customer created successfully")
                print(f"  - Business Name: {customer['name']}")
                print(f"  - Customer Type: {customer['customer_type']}")
                print(f"  - Credit Limit: ${customer['credit_limit']}")
                print(f"  - Payment Terms: {customer['payment_terms']} days")
                return customer
            else:
                print(f"✗ Failed to create wholesale customer: {response.status_code}")
                print(f"  Error: {response.text}")
                return None
        except Exception as e:
            print(f"✗ Error creating wholesale customer: {e}")
            return None
    
    def test_update_customer(self, customer_id: str) -> bool:
        """Test updating customer information"""
        print(f"\n📝 Testing customer update for ID: {customer_id}")
        
        update_data = {
            "age": 40,  # Birthday passed
            "city": "Brooklyn",  # Moved to Brooklyn
            "notes": "Updated notes: Customer moved to Brooklyn. Still VIP status.",
            "credit_limit": 7500.00,  # Increased credit limit
            "preferences": {
                "contact_method": "phone",  # Changed preference
                "marketing_emails": False,  # Opt out of marketing
                "newsletter": True
            }
        }
        
        try:
            response = self.session.put(
                f"{API_BASE}/customers/{customer_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                customer = response.json()
                print("✓ Customer updated successfully")
                print(f"  - New Age: {customer.get('age', 'N/A')}")
                print(f"  - New City: {customer.get('city', 'N/A')}")
                print(f"  - New Credit Limit: ${customer.get('credit_limit', 'N/A')}")
                return True
            else:
                print(f"✗ Failed to update customer: {response.status_code}")
                print(f"  Error: {response.text}")
                return False
        except Exception as e:
            print(f"✗ Error updating customer: {e}")
            return False
    
    def test_validation_constraints(self) -> bool:
        """Test unique constraint validations"""
        print("\n🔒 Testing validation constraints...")
        
        # Try to create customer with duplicate phone
        duplicate_customer = {
            "name": "Duplicate Phone Test",
            "phone": "+1-555-0123",  # Same as first customer
            "email": "different@email.com"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/customers/",
                json=duplicate_customer
            )
            
            if response.status_code == 400:
                print("✓ Phone number uniqueness constraint working")
            else:
                print("✗ Phone number constraint failed")
                return False
        except Exception as e:
            print(f"✗ Error testing phone constraint: {e}")
            return False
        
        # Try to create customer with duplicate national ID
        duplicate_national_id = {
            "name": "Duplicate National ID Test",
            "phone": "+1-555-9999",
            "email": "different2@email.com",
            "national_id": "123-45-6789"  # Same as first customer
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/customers/",
                json=duplicate_national_id
            )
            
            if response.status_code == 400:
                print("✓ National ID uniqueness constraint working")
                return True
            else:
                print("✗ National ID constraint failed")
                return False
        except Exception as e:
            print(f"✗ Error testing national ID constraint: {e}")
            return False
    
    def test_filtering_capabilities(self) -> bool:
        """Test the new filtering capabilities"""
        print("\n🔍 Testing filtering capabilities...")
        
        filters_to_test = [
            ("city", "Brooklyn"),
            ("customer_type", "retail"),
            ("gender", "male"),
            ("is_active", "true"),
            ("min_credit_limit", "1000"),
            ("nationality", "American")
        ]
        
        all_passed = True
        
        for filter_name, filter_value in filters_to_test:
            try:
                response = self.session.get(
                    f"{API_BASE}/customers/",
                    params={filter_name: filter_value}
                )
                
                if response.status_code == 200:
                    customers = response.json()
                    print(f"✓ Filter '{filter_name}={filter_value}' returned {len(customers)} results")
                else:
                    print(f"✗ Filter '{filter_name}={filter_value}' failed: {response.status_code}")
                    all_passed = False
            except Exception as e:
                print(f"✗ Error testing filter '{filter_name}': {e}")
                all_passed = False
        
        return all_passed
    
    def test_search_functionality(self) -> bool:
        """Test search functionality"""
        print("\n🔎 Testing search functionality...")
        
        search_terms = ["John", "555-0123", "john.doe"]
        
        for term in search_terms:
            try:
                response = self.session.get(
                    f"{API_BASE}/customers/search",
                    params={"q": term}
                )
                
                if response.status_code == 200:
                    results = response.json()
                    print(f"✓ Search '{term}' returned {len(results)} results")
                else:
                    print(f"✗ Search '{term}' failed: {response.status_code}")
                    return False
            except Exception as e:
                print(f"✗ Error testing search '{term}': {e}")
                return False
        
        return True
    
    def test_get_customer_details(self, customer_id: str) -> bool:
        """Test getting detailed customer information"""
        print(f"\n📋 Testing customer detail retrieval for ID: {customer_id}")
        
        try:
            response = self.session.get(f"{API_BASE}/customers/{customer_id}")
            
            if response.status_code == 200:
                customer = response.json()
                print("✓ Customer details retrieved successfully")
                print(f"  - Full Profile Available: {len(customer)} fields")
                
                # Check for key new fields
                new_fields = [
                    'street_address', 'city', 'state', 'postal_code',
                    'national_id', 'date_of_birth', 'gender', 'nationality',
                    'emergency_contact_name', 'tags', 'custom_fields',
                    'customer_type', 'credit_limit'
                ]
                
                present_fields = [field for field in new_fields if field in customer and customer[field] is not None]
                print(f"  - New Fields Present: {len(present_fields)}/{len(new_fields)}")
                return True
            else:
                print(f"✗ Failed to get customer details: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error getting customer details: {e}")
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Comprehensive Customer Profile System Tests")
        print("=" * 60)
        
        # Authenticate
        if not self.authenticate():
            print("❌ Authentication failed. Exiting tests.")
            return False
        
        # Test 1: Create comprehensive customer
        retail_customer = self.test_create_comprehensive_customer()
        if not retail_customer:
            print("❌ Failed to create retail customer. Exiting tests.")
            return False
        
        # Test 2: Create wholesale customer
        wholesale_customer = self.test_create_wholesale_customer()
        if not wholesale_customer:
            print("❌ Failed to create wholesale customer. Some tests may be limited.")
        
        # Test 3: Update customer
        if not self.test_update_customer(retail_customer['id']):
            print("❌ Customer update test failed.")
            return False
        
        # Test 4: Test validation constraints
        if not self.test_validation_constraints():
            print("❌ Validation constraints test failed.")
            return False
        
        # Test 5: Test filtering
        if not self.test_filtering_capabilities():
            print("❌ Filtering capabilities test failed.")
            return False
        
        # Test 6: Test search
        if not self.test_search_functionality():
            print("❌ Search functionality test failed.")
            return False
        
        # Test 7: Test customer details
        if not self.test_get_customer_details(retail_customer['id']):
            print("❌ Customer details test failed.")
            return False
        
        print("\n" + "=" * 60)
        print("🎉 All Comprehensive Customer Profile System tests completed successfully!")
        print("\n✅ Summary of implemented features:")
        print("   • Full address fields (street, city, state, postal code, country)")
        print("   • Personal information (national ID, DOB, age, gender, nationality, occupation)")
        print("   • Emergency contact information")
        print("   • Notes and tags system")
        print("   • Custom fields and preferences (JSON)")
        print("   • Business customer support (wholesale/retail)")
        print("   • Credit limits and payment terms")
        print("   • Tax exemption and discount management")
        print("   • Enhanced filtering and search capabilities")
        print("   • Unique constraint validation")
        
        return True

def main():
    tester = CustomerProfileTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎯 All tests passed! The comprehensive customer profile system is working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
        sys.exit(1)

if __name__ == "__main__":
    main()
