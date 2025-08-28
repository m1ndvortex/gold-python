"""
Integration tests for KPI Dashboard API endpoints
Tests all KPI endpoints with real database and Docker environment
"""

import pytest
import asyncio
from datetime import date, datetime, timedelta
from decimal import Decimal
import json
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from main import app
from database import get_db, engine
from models import Base, User, Role, InventoryItem, Category, Customer, Invoice, InvoiceItem, Payment
from auth import create_access_token
import models

# Test client
client = TestClient(app)

@pytest.fixture(scope="module")
def setup_database():
    """Set up test database with real data"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    
    try:
        # Create test role and permissions
        admin_role = Role(
            name="admin",
            description="Administrator role",
            permissions=["view_reports", "manage_settings"]
        )
        db.add(admin_role)
        db.commit()
        
        # Create test user
        test_user = User(
            username="test_kpi_user",
            email="test@example.com",
            hashed_password="hashed_password",
            role_id=admin_role.id,
            is_active=True
        )
        db.add(test_user)
        db.commit()
        
        # Create test categories
        gold_category = Category(
            name="Gold Jewelry",
            description="Gold jewelry items"
        )
        silver_category = Category(
            name="Silver Jewelry", 
            description="Silver jewelry items"
        )
        db.add_all([gold_category, silver_category])
        db.commit()
        
        # Create test inventory items
        test_items = [
            InventoryItem(
                name="Gold Ring 18K",
                category_id=gold_category.id,
                purchase_price=Decimal("800.00"),
                sell_price=Decimal("1200.00"),
                stock_quantity=10,
                min_stock_level=2,
                is_active=True
            ),
            InventoryItem(
                name="Gold Necklace 22K",
                category_id=gold_category.id,
                purchase_price=Decimal("1500.00"),
                sell_price=Decimal("2200.00"),
                stock_quantity=5,
                min_stock_level=1,
                is_active=True
            ),
            InventoryItem(
                name="Silver Bracelet",
                category_id=silver_category.id,
                purchase_price=Decimal("150.00"),
                sell_price=Decimal("250.00"),
                stock_quantity=20,
                min_stock_level=5,
                is_active=True
            )
        ]
        db.add_all(test_items)
        db.commit()
        
        # Create test customers
        test_customers = [
            Customer(
                name="John Doe",
                email="john@example.com",
                phone="1234567890",
                address="123 Main St",
                total_purchases=Decimal("0.00")
            ),
            Customer(
                name="Jane Smith",
                email="jane@example.com", 
                phone="0987654321",
                address="456 Oak Ave",
                total_purchases=Decimal("0.00")
            )
        ]
        db.add_all(test_customers)
        db.commit()
        
        # Create test invoices with different dates for trend analysis
        base_date = date.today() - timedelta(days=60)
        
        test_invoices = []
        for i in range(30):  # Create 30 invoices over 60 days
            invoice_date = base_date + timedelta(days=i * 2)
            
            invoice = Invoice(
                invoice_number=f"INV-{1000 + i}",
                customer_id=test_customers[i % 2].id,
                total_amount=Decimal("0.00"),
                paid_amount=Decimal("0.00"),
                remaining_amount=Decimal("0.00"),
                status="completed",
                created_at=datetime.combine(invoice_date, datetime.min.time()),
                vat_percentage=Decimal("10.00"),
                labor_cost_percentage=Decimal("5.00")
            )
            test_invoices.append(invoice)
        
        db.add_all(test_invoices)
        db.commit()
        
        # Create invoice items
        for i, invoice in enumerate(test_invoices):
            # Add 1-3 items per invoice
            item_count = (i % 3) + 1
            total_amount = Decimal("0.00")
            
            for j in range(item_count):
                item = test_items[j % len(test_items)]
                quantity = (j % 3) + 1
                unit_price = item.sell_price
                total_price = unit_price * quantity
                
                invoice_item = InvoiceItem(
                    invoice_id=invoice.id,
                    inventory_item_id=item.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price
                )
                db.add(invoice_item)
                total_amount += total_price
            
            # Update invoice totals
            invoice.total_amount = total_amount
            invoice.paid_amount = total_amount
            invoice.remaining_amount = Decimal("0.00")
            
            # Update customer total purchases
            customer = db.query(Customer).filter(Customer.id == invoice.customer_id).first()
            customer.total_purchases += total_amount
        
        db.commit()
        
        # Create test payments
        for invoice in test_invoices:
            payment = Payment(
                invoice_id=invoice.id,
                amount=invoice.total_amount,
                payment_method="cash",
                payment_date=invoice.created_at.date(),
                notes="Test payment"
            )
            db.add(payment)
        
        db.commit()
        
        yield {
            "user": test_user,
            "categories": [gold_category, silver_category],
            "items": test_items,
            "customers": test_customers,
            "invoices": test_invoices
        }
        
    finally:
        db.close()

@pytest.fixture
def auth_headers(setup_database):
    """Create authentication headers for API requests"""
    test_user = setup_database["user"]
    access_token = create_access_token(data={"sub": test_user.username})
    return {"Authorization": f"Bearer {access_token}"}

def test_get_financial_kpis(setup_database, auth_headers):
    """Test financial KPIs endpoint with real data"""
    
    # Test basic financial KPIs
    response = client.get("/kpi/financial", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "revenue" in data
    assert "profit_margin" in data
    assert "period" in data
    assert "last_updated" in data
    
    # Verify revenue data structure
    revenue_data = data["revenue"]
    assert "current_revenue" in revenue_data
    assert "previous_revenue" in revenue_data
    assert "growth_rate" in revenue_data
    assert "trend_direction" in revenue_data
    
    # Verify profit margin data structure
    profit_data = data["profit_margin"]
    assert "gross_margin" in profit_data
    assert "net_margin" in profit_data
    assert "total_sales" in profit_data
    assert "total_cost" in profit_data

def test_get_financial_kpis_with_targets(setup_database, auth_headers):
    """Test financial KPIs with targets"""
    
    targets = {
        "revenue": 50000,
        "profit_margin": 25.0
    }
    
    response = client.get(
        f"/kpi/financial?targets={json.dumps(targets)}",
        headers=auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "achievement" in data
    assert data["targets"] == targets
    
    # Verify achievement data
    achievement_data = data["achievement"]
    assert "achievements" in achievement_data
    assert "overall_achievement_rate" in achievement_data
    assert "performance_level" in achievement_data

def test_get_financial_kpis_with_date_range(setup_database, auth_headers):
    """Test financial KPIs with custom date range"""
    
    start_date = (date.today() - timedelta(days=30)).isoformat()
    end_date = date.today().isoformat()
    
    response = client.get(
        f"/kpi/financial?start_date={start_date}&end_date={end_date}",
        headers=auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["period"]["start_date"] == start_date
    assert data["period"]["end_date"] == end_date
    assert data["period"]["days"] == 31

def test_get_operational_kpis(setup_database, auth_headers):
    """Test operational KPIs endpoint"""
    
    response = client.get("/kpi/operational", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "inventory_turnover" in data
    assert "stockout_frequency" in data
    assert "carrying_costs" in data
    assert "dead_stock" in data
    
    # Verify inventory turnover data
    turnover_data = data["inventory_turnover"]
    assert "turnover_rate" in turnover_data
    assert "avg_inventory_value" in turnover_data

def test_get_customer_kpis(setup_database, auth_headers):
    """Test customer KPIs endpoint"""
    
    response = client.get("/kpi/customer", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "acquisition_rate" in data
    assert "retention_rate" in data
    assert "avg_transaction_value" in data
    assert "customer_lifetime_value" in data
    
    # Verify acquisition rate data
    acquisition_data = data["acquisition_rate"]
    assert "new_customers" in acquisition_data
    assert "acquisition_rate" in acquisition_data

def test_get_kpi_dashboard(setup_database, auth_headers):
    """Test comprehensive KPI dashboard endpoint"""
    
    response = client.get("/kpi/dashboard", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "financial" in data
    assert "operational" in data
    assert "customer" in data
    assert "overall_performance" in data
    
    # Verify overall performance score
    overall_perf = data["overall_performance"]
    assert "overall_score" in overall_perf
    assert "performance_level" in overall_perf
    assert "component_scores" in overall_perf
    assert 0 <= overall_perf["overall_score"] <= 100

def test_compare_kpi_periods(setup_database, auth_headers):
    """Test KPI period comparison endpoint"""
    
    current_start = (date.today() - timedelta(days=30)).isoformat()
    current_end = date.today().isoformat()
    comparison_start = (date.today() - timedelta(days=60)).isoformat()
    comparison_end = (date.today() - timedelta(days=31)).isoformat()
    
    response = client.get(
        f"/kpi/compare?current_start={current_start}&current_end={current_end}"
        f"&comparison_start={comparison_start}&comparison_end={comparison_end}",
        headers=auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "comparison" in data
    assert "periods" in data
    
    # Verify comparison structure
    comparison = data["comparison"]
    assert "financial" in comparison
    assert "operational" in comparison
    assert "customer" in comparison
    
    # Verify each comparison has current, comparison, and changes
    for kpi_type in ["financial", "operational", "customer"]:
        kpi_comparison = comparison[kpi_type]
        assert "current" in kpi_comparison
        assert "comparison" in kpi_comparison
        assert "changes" in kpi_comparison

def test_refresh_kpi_cache(setup_database, auth_headers):
    """Test KPI cache refresh endpoint"""
    
    response = client.post("/kpi/refresh", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "message" in data
    assert "refreshed_types" in data
    assert "refreshed_at" in data
    assert "connected_clients" in data
    
    # Verify all types were refreshed
    assert "financial" in data["refreshed_types"]
    assert "operational" in data["refreshed_types"]
    assert "customer" in data["refreshed_types"]

def test_refresh_specific_kpi_types(setup_database, auth_headers):
    """Test refreshing specific KPI types"""
    
    response = client.post("/kpi/refresh?kpi_types=financial,operational", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["refreshed_types"]) == 2
    assert "financial" in data["refreshed_types"]
    assert "operational" in data["refreshed_types"]
    assert "customer" not in data["refreshed_types"]

def test_kpi_endpoints_with_invalid_targets(setup_database, auth_headers):
    """Test KPI endpoints with invalid targets JSON"""
    
    response = client.get("/kpi/financial?targets=invalid_json", headers=auth_headers)
    assert response.status_code == 400
    assert "Invalid targets JSON format" in response.json()["detail"]

def test_kpi_endpoints_unauthorized():
    """Test KPI endpoints without authentication"""
    
    response = client.get("/kpi/financial")
    assert response.status_code == 401

def test_kpi_dashboard_performance(setup_database, auth_headers):
    """Test KPI dashboard performance with concurrent requests"""
    
    import time
    
    start_time = time.time()
    
    # Make multiple concurrent requests
    responses = []
    for _ in range(5):
        response = client.get("/kpi/dashboard", headers=auth_headers)
        responses.append(response)
    
    end_time = time.time()
    
    # Verify all requests succeeded
    for response in responses:
        assert response.status_code == 200
    
    # Verify reasonable response time (should be fast due to caching)
    total_time = end_time - start_time
    assert total_time < 10.0  # Should complete within 10 seconds

def test_kpi_data_accuracy(setup_database, auth_headers):
    """Test KPI calculation accuracy with known test data"""
    
    response = client.get("/kpi/financial", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    
    # Verify revenue is positive (we created test invoices)
    assert data["revenue"]["current_revenue"] > 0
    
    # Verify profit margin calculations
    profit_data = data["profit_margin"]
    assert profit_data["gross_margin"] > 0
    assert profit_data["total_sales"] > 0
    assert profit_data["total_cost"] > 0
    
    # Verify profit margin percentage is reasonable
    assert 0 <= profit_data["gross_margin"] <= 100

def test_kpi_trend_analysis(setup_database, auth_headers):
    """Test KPI trend analysis functionality"""
    
    response = client.get("/kpi/financial", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    
    # Verify trend data is present
    revenue_data = data["revenue"]
    assert "trend_data" in revenue_data
    assert "trend_direction" in revenue_data
    
    trend_data = revenue_data["trend_data"]
    assert "trend" in trend_data
    assert "data_points" in trend_data
    
    # Verify trend direction is valid
    assert revenue_data["trend_direction"] in ["up", "down", "stable"]

def test_kpi_websocket_connection():
    """Test WebSocket connection for real-time KPI updates"""
    
    from fastapi.testclient import TestClient
    
    with client.websocket_connect("/kpi/ws") as websocket:
        # Send test message
        websocket.send_text("test_connection")
        
        # Receive response
        data = websocket.receive_text()
        assert "KPI WebSocket connected" in data

if __name__ == "__main__":
    pytest.main([__file__, "-v"])