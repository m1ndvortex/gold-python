"""
Simple test to verify reports functionality with real PostgreSQL database in Docker
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from decimal import Decimal
import uuid

from main import app
from database import get_db
from models import (
    User, Role, Customer, Category, InventoryItem, 
    Invoice, InvoiceItem, Payment, AccountingEntry
)
from auth import get_current_user

# Test client
client = TestClient(app)

# Mock current user for testing
def mock_get_current_user():
    return User(
        id=uuid.uuid4(),
        username="testuser",
        email="test@example.com",
        role_id=uuid.uuid4(),
        is_active=True,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

app.dependency_overrides[get_current_user] = mock_get_current_user

def test_reports_endpoints_accessible():
    """Test that all reports endpoints are accessible"""
    
    # Test sales trends endpoint
    response = client.get("/reports/sales/trends")
    assert response.status_code == 200
    data = response.json()
    assert "period" in data
    assert "summary" in data
    assert "trends" in data
    print("✓ Sales trends endpoint working")
    
    # Test top products endpoint
    response = client.get("/reports/sales/top-products")
    assert response.status_code == 200
    data = response.json()
    assert "top_by_quantity" in data
    assert "top_by_revenue" in data
    print("✓ Top products endpoint working")
    
    # Test inventory valuation endpoint
    response = client.get("/reports/inventory/valuation")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "category_breakdown" in data
    assert "items" in data
    print("✓ Inventory valuation endpoint working")
    
    # Test low stock endpoint
    response = client.get("/reports/inventory/low-stock")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "items" in data
    print("✓ Low stock endpoint working")
    
    # Test customer analysis endpoint
    response = client.get("/reports/customers/analysis")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "customers" in data
    print("✓ Customer analysis endpoint working")
    
    # Test debt report endpoint
    response = client.get("/reports/customers/debt-report")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "debt_aging" in data
    assert "customers" in data
    print("✓ Debt report endpoint working")
    
    # Test chart endpoints
    response = client.get("/reports/charts/sales-overview")
    assert response.status_code == 200
    data = response.json()
    assert "daily_sales" in data
    assert "category_sales" in data
    print("✓ Sales overview chart endpoint working")
    
    response = client.get("/reports/charts/inventory-overview")
    assert response.status_code == 200
    data = response.json()
    assert "category_breakdown" in data
    assert "stock_status" in data
    print("✓ Inventory overview chart endpoint working")
    
    response = client.get("/reports/charts/customer-overview")
    assert response.status_code == 200
    data = response.json()
    assert "debt_distribution" in data
    assert "recent_activity" in data
    assert "top_customers" in data
    print("✓ Customer overview chart endpoint working")
    
    print("\n🎉 All reports endpoints are working correctly!")

def test_reports_with_parameters():
    """Test reports endpoints with various parameters"""
    
    # Test sales trends with different periods
    for period in ["daily", "weekly", "monthly"]:
        response = client.get(f"/reports/sales/trends?period={period}")
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == period
        print(f"✓ Sales trends with {period} period working")
    
    # Test sales trends with date filtering
    start_date = (date.today() - timedelta(days=30)).isoformat()
    end_date = date.today().isoformat()
    response = client.get(f"/reports/sales/trends?start_date={start_date}&end_date={end_date}")
    assert response.status_code == 200
    data = response.json()
    assert data["start_date"] == start_date
    assert data["end_date"] == end_date
    print("✓ Sales trends with date filtering working")
    
    # Test top products with limit
    response = client.get("/reports/sales/top-products?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["top_by_quantity"]) <= 5
    assert len(data["top_by_revenue"]) <= 5
    print("✓ Top products with limit working")
    
    # Test inventory valuation with filters
    response = client.get("/reports/inventory/valuation?include_inactive=true")
    assert response.status_code == 200
    print("✓ Inventory valuation with filters working")
    
    # Test low stock with threshold
    response = client.get("/reports/inventory/low-stock?threshold_multiplier=2.0")
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["threshold_multiplier"] == 2.0
    print("✓ Low stock with threshold working")
    
    # Test debt report with sorting
    for sort_by in ["debt_desc", "debt_asc", "name", "last_payment"]:
        response = client.get(f"/reports/customers/debt-report?sort_by={sort_by}")
        assert response.status_code == 200
        print(f"✓ Debt report with {sort_by} sorting working")
    
    print("\n🎉 All reports parameters are working correctly!")

def test_reports_data_structure():
    """Test that reports return correct data structures"""
    
    # Test sales trends data structure
    response = client.get("/reports/sales/trends")
    data = response.json()
    
    # Verify summary structure
    summary = data["summary"]
    required_summary_fields = [
        "total_sales", "total_paid", "total_outstanding", 
        "total_items_sold", "average_daily_sales"
    ]
    for field in required_summary_fields:
        assert field in summary
        assert isinstance(summary[field], (int, float))
    
    # Verify trends structure
    assert isinstance(data["trends"], list)
    print("✓ Sales trends data structure correct")
    
    # Test inventory valuation data structure
    response = client.get("/reports/inventory/valuation")
    data = response.json()
    
    # Verify summary structure
    summary = data["summary"]
    required_fields = [
        "total_purchase_value", "total_sell_value", "total_potential_profit",
        "overall_profit_margin", "total_weight_grams", "total_items", "unique_products"
    ]
    for field in required_fields:
        assert field in summary
        assert isinstance(summary[field], (int, float))
    
    assert isinstance(data["category_breakdown"], list)
    assert isinstance(data["items"], list)
    print("✓ Inventory valuation data structure correct")
    
    # Test customer analysis data structure
    response = client.get("/reports/customers/analysis")
    data = response.json()
    
    summary = data["summary"]
    required_fields = [
        "total_active_customers", "total_revenue", "average_revenue_per_customer",
        "high_value_customers", "customers_with_debt", "debt_percentage"
    ]
    for field in required_fields:
        assert field in summary
        assert isinstance(summary[field], (int, float))
    
    assert isinstance(data["customers"], list)
    print("✓ Customer analysis data structure correct")
    
    print("\n🎉 All reports data structures are correct!")

if __name__ == "__main__":
    print("Testing Reports API with real PostgreSQL database in Docker...")
    print("=" * 60)
    
    try:
        test_reports_endpoints_accessible()
        test_reports_with_parameters()
        test_reports_data_structure()
        
        print("\n" + "=" * 60)
        print("🎉 ALL REPORTS TESTS PASSED! 🎉")
        print("Reports API is working correctly with real PostgreSQL database in Docker")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise