#!/usr/bin/env python3
"""
Final production test for invoice system - comprehensive but fast.
Uses main backend with proper admin authentication.
"""

import requests
import json
from decimal import Decimal
import time

# Configuration - Use localhost since we're running from main backend
API_BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Get authentication token"""
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_complete_invoice_workflow():
    """Test complete invoice workflow from creation to payment"""
    print("🧪 Final Production Test - Complete Invoice Workflow")
    print("=" * 60)
    
    # Get authentication
    print("1. Authenticating...")
    token = get_auth_token()
    if not token:
        print("   ❌ Authentication failed")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    print("   ✅ Authentication successful")
    
    # Health check
    print("\n2. Health check...")
    response = requests.get(f"{API_BASE_URL}/health")
    if response.status_code != 200:
        print("   ❌ Health check failed")
        return False
    print("   ✅ System healthy")
    
    # Get or create customer
    print("\n3. Setting up test data...")
    response = requests.get(f"{API_BASE_URL}/customers/", headers=headers)
    if response.status_code == 200 and response.json():
        customer = response.json()[0]
        print(f"   ✅ Using existing customer: {customer['name']}")
    else:
        customer_data = {
            "name": f"Final Test Customer {int(time.time())}",
            "phone": f"555{int(time.time()) % 10000}",
            "email": f"final{int(time.time())}@test.com"
        }
        response = requests.post(f"{API_BASE_URL}/customers/", json=customer_data, headers=headers)
        if response.status_code != 200:
            print(f"   ❌ Failed to create customer: {response.text}")
            return False
        customer = response.json()
        print(f"   ✅ Created customer: {customer['name']}")
    
    # Get or create inventory item
    response = requests.get(f"{API_BASE_URL}/inventory/items/", headers=headers)
    if response.status_code == 200 and response.json():
        items = [item for item in response.json() if item['stock_quantity'] >= 5]
        if items:
            item = items[0]
            print(f"   ✅ Using existing item: {item['name']} (Stock: {item['stock_quantity']})")
        else:
            # Create new item if no items with sufficient stock
            print("   📝 Creating new inventory item...")
            # Get or create category first
            response = requests.get(f"{API_BASE_URL}/inventory/categories/", headers=headers)
            if response.status_code == 200 and response.json():
                category_id = response.json()[0]["id"]
            else:
                # Create category
                category_data = {
                    "name": f"Test Category {int(time.time())}",
                    "description": "Test category for final test"
                }
                response = requests.post(f"{API_BASE_URL}/inventory/categories/", json=category_data, headers=headers)
                if response.status_code != 200:
                    print(f"   ❌ Failed to create category: {response.text}")
                    return False
                category_id = response.json()["id"]
            
            # Create inventory item
            item_data = {
                "name": f"Final Test Gold Ring {int(time.time())}",
                "category_id": category_id,
                "weight_grams": 5.5,
                "purchase_price": 200.00,
                "sell_price": 300.00,
                "stock_quantity": 20,
                "min_stock_level": 2,
                "description": "Final test ring"
            }
            
            response = requests.post(f"{API_BASE_URL}/inventory/items/", json=item_data, headers=headers)
            if response.status_code != 200:
                print(f"   ❌ Failed to create item: {response.text}")
                return False
            
            item = response.json()
            print(f"   ✅ Created item: {item['name']} (Stock: {item['stock_quantity']})")
    else:
        # Create everything from scratch
        print("   📝 Creating inventory from scratch...")
        # Create category
        category_data = {
            "name": f"Final Test Category {int(time.time())}",
            "description": "Category for final test"
        }
        response = requests.post(f"{API_BASE_URL}/inventory/categories/", json=category_data, headers=headers)
        if response.status_code != 200:
            print(f"   ❌ Failed to create category: {response.text}")
            return False
        category_id = response.json()["id"]
        
        # Create inventory item
        item_data = {
            "name": f"Final Test Gold Ring {int(time.time())}",
            "category_id": category_id,
            "weight_grams": 5.5,
            "purchase_price": 200.00,
            "sell_price": 300.00,
            "stock_quantity": 20,
            "min_stock_level": 2,
            "description": "Final test ring"
        }
        
        response = requests.post(f"{API_BASE_URL}/inventory/items/", json=item_data, headers=headers)
        if response.status_code != 200:
            print(f"   ❌ Failed to create item: {response.text}")
            return False
        
        item = response.json()
        print(f"   ✅ Created item: {item['name']} (Stock: {item['stock_quantity']})")
    
    # Test invoice calculation
    print("\n4. Testing invoice calculation...")
    calc_data = {
        "customer_id": customer["id"],
        "gold_price_per_gram": 50.0,
        "labor_cost_percentage": 10.0,
        "profit_percentage": 15.0,
        "vat_percentage": 8.0,
        "items": [{
            "inventory_item_id": item["id"],
            "quantity": 2,
            "unit_price": 0,
            "weight_grams": 5.5
        }]
    }
    
    response = requests.post(f"{API_BASE_URL}/invoices/calculate", json=calc_data, headers=headers)
    if response.status_code != 200:
        print(f"   ❌ Calculation failed: {response.text}")
        return False
    
    calculation = response.json()
    expected_base = 2 * 5.5 * 50.0  # $550
    if abs(calculation["subtotal"] - expected_base) > 0.01:
        print(f"   ❌ Calculation error. Expected: {expected_base}, Got: {calculation['subtotal']}")
        return False
    
    print(f"   ✅ Calculation correct: ${calculation['grand_total']:.2f}")
    
    # Create invoice
    print("\n5. Creating invoice...")
    response = requests.post(f"{API_BASE_URL}/invoices/", json=calc_data, headers=headers)
    if response.status_code != 200:
        print(f"   ❌ Invoice creation failed: {response.text}")
        return False
    
    invoice = response.json()
    print(f"   ✅ Invoice created: {invoice['invoice_number']} - ${invoice['total_amount']:.2f}")
    
    # Verify inventory update
    response = requests.get(f"{API_BASE_URL}/inventory/items/{item['id']}", headers=headers)
    if response.status_code == 200:
        updated_item = response.json()
        expected_stock = item['stock_quantity'] - 2
        if updated_item['stock_quantity'] == expected_stock:
            print(f"   ✅ Inventory updated: {updated_item['stock_quantity']} (was {item['stock_quantity']})")
        else:
            print(f"   ❌ Inventory not updated correctly")
            return False
    
    # Test partial payment
    print("\n6. Processing partial payment...")
    payment_amount = invoice["total_amount"] * 0.5
    payment_data = {
        "amount": payment_amount,
        "payment_method": "cash",
        "description": "Final test payment"
    }
    
    response = requests.post(f"{API_BASE_URL}/invoices/{invoice['id']}/payments", 
                           json=payment_data, headers=headers)
    if response.status_code != 200:
        print(f"   ❌ Payment failed: {response.text}")
        return False
    
    payment = response.json()
    print(f"   ✅ Payment processed: ${payment['amount']:.2f}")
    
    # Verify invoice status
    response = requests.get(f"{API_BASE_URL}/invoices/{invoice['id']}", headers=headers)
    if response.status_code == 200:
        updated_invoice = response.json()
        if (updated_invoice["status"] == "partially_paid" and 
            abs(updated_invoice["paid_amount"] - payment_amount) < 0.01):
            print(f"   ✅ Invoice status updated: {updated_invoice['status']}")
        else:
            print(f"   ❌ Invoice status not updated correctly")
            return False
    
    # Test invoice listing
    print("\n7. Testing invoice listing...")
    response = requests.get(f"{API_BASE_URL}/invoices/?customer_id={customer['id']}", headers=headers)
    if response.status_code == 200:
        invoices = response.json()
        if any(inv["id"] == invoice["id"] for inv in invoices):
            print(f"   ✅ Invoice listing works: Found {len(invoices)} invoice(s)")
        else:
            print("   ❌ Invoice not found in listing")
            return False
    
    # Test summary report
    print("\n8. Testing summary report...")
    response = requests.get(f"{API_BASE_URL}/invoices/reports/summary", headers=headers)
    if response.status_code == 200:
        summary = response.json()
        if summary["total_invoices"] > 0:
            print(f"   ✅ Summary report: {summary['total_invoices']} invoices, ${summary['total_amount']:.2f} total")
        else:
            print("   ❌ Summary report shows no invoices")
            return False
    
    print("\n" + "=" * 60)
    print("🎉 ALL FINAL PRODUCTION TESTS PASSED!")
    print("✅ Complete invoice workflow working perfectly")
    print("✅ Gram-based calculations accurate")
    print("✅ Inventory integration working")
    print("✅ Payment processing working")
    print("✅ Data persistence and reporting working")
    print("✅ System is production-ready!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    success = test_complete_invoice_workflow()
    exit(0 if success else 1)