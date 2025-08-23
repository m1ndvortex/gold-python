"""
Integration tests for Analytics Data API endpoints
Tests demand forecasting, cost optimization, and category performance analysis
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
def setup_analytics_database():
    """Set up test database with comprehensive analytics test data"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    
    try:
        # Create test role and permissions
        admin_role = Role(
            name="analytics_admin",
            description="Analytics Administrator role",
            permissions=["view_reports", "manage_settings"]
        )
        db.add(admin_role)
        db.commit()
        
        # Create test user
        test_user = User(
            username="test_analytics_user",
            email="analytics@example.com",
            hashed_password="hashed_password",
            role_id=admin_role.id,
            is_active=True
        )
        db.add(test_user)
        db.commit()
        
        # Create test categories with different performance characteristics
        categories = [
            Category(name="High-End Gold", description="Premium gold jewelry"),
            Category(name="Silver Collection", description="Silver jewelry items"),
            Category(name="Gemstone Jewelry", description="Jewelry with precious stones"),
            Category(name="Fashion Accessories", description="Trendy fashion items")
        ]
        db.add_all(categories)
        db.commit()
        
        # Create diverse inventory items for comprehensive testing
        test_items = []
        
        # High-End Gold items (high value, low volume)
        gold_items = [
            InventoryItem(
                name="Diamond Gold Ring 24K",
                category_id=categories[0].id,
                purchase_price=Decimal("2000.00"),
                sell_price=Decimal("3500.00"),
                stock_quantity=3,
                min_stock_level=1,
                is_active=True
            ),
            InventoryItem(
                name="Gold Necklace with Emerald",
                category_id=categories[0].id,
                purchase_price=Decimal("3000.00"),
                sell_price=Decimal("5000.00"),
                stock_quantity=2,
                min_stock_level=1,
                is_active=True
            )
        ]
        
        # Silver Collection items (medium value, medium volume)
        silver_items = [
            InventoryItem(
                name="Silver Chain Bracelet",
                category_id=categories[1].id,
                purchase_price=Decimal("80.00"),
                sell_price=Decimal("150.00"),
                stock_quantity=25,
                min_stock_level=5,
                is_active=True
            ),
            InventoryItem(
                name="Silver Earrings Set",
                category_id=categories[1].id,
                purchase_price=Decimal("120.00"),
                sell_price=Decimal("200.00"),
                stock_quantity=15,
                min_stock_level=3,
                is_active=True
            )
        ]
        
        # Gemstone items (high value, seasonal)
        gemstone_items = [
            InventoryItem(
                name="Ruby Pendant",
                category_id=categories[2].id,
                purchase_price=Decimal("800.00"),
                sell_price=Decimal("1400.00"),
                stock_quantity=8,
                min_stock_level=2,
                is_active=True
            ),
            InventoryItem(
                name="Sapphire Ring",
                category_id=categories[2].id,
                purchase_price=Decimal("1200.00"),
                sell_price=Decimal("2000.00"),
                stock_quantity=5,
                min_stock_level=1,
                is_active=True
            )
        ]
        
        # Fashion items (low value, high volume)
        fashion_items = [
            InventoryItem(
                name="Fashion Ring Set",
                category_id=categories[3].id,
                purchase_price=Decimal("25.00"),
                sell_price=Decimal("50.00"),
                stock_quantity=100,
                min_stock_level=20,
                is_active=True
            ),
            InventoryItem(
                name="Costume Jewelry Necklace",
                category_id=categories[3].id,
                purchase_price=Decimal("15.00"),
                sell_price=Decimal("35.00"),
                stock_quantity=80,
                min_stock_level=15,
                is_active=True
            )
        ]
        
        test_items = gold_items + silver_items + gemstone_items + fashion_items
        db.add_all(test_items)
        db.commit()
        
        # Create diverse customers for market basket analysis
        test_customers = [
            Customer(name="Premium Customer A", email="premium1@example.com", phone="1111111111", 
                    address="Luxury District", total_purchases=Decimal("0.00")),
            Customer(name="Premium Customer B", email="premium2@example.com", phone="2222222222",
                    address="High-End Area", total_purchases=Decimal("0.00")),
            Customer(name="Regular Customer A", email="regular1@example.com", phone="3333333333",
                    address="Main Street", total_purchases=Decimal("0.00")),
            Customer(name="Regular Customer B", email="regular2@example.com", phone="4444444444",
                    address="Oak Avenue", total_purchases=Decimal("0.00")),
            Customer(name="Frequent Buyer", email="frequent@example.com", phone="5555555555",
                    address="Shopping Center", total_purchases=Decimal("0.00"))
        ]
        db.add_all(test_customers)
        db.commit()
        
        # Create comprehensive sales history for analytics (6 months of data)
        base_date = date.today() - timedelta(days=180)
        test_invoices = []
        
        # Create varied sales patterns for different items and seasons
        for day_offset in range(180):
            current_date = base_date + timedelta(days=day_offset)
            
            # Simulate seasonal patterns
            is_holiday_season = current_date.month in [11, 12, 2]  # Nov, Dec, Feb (Valentine's)
            is_summer = current_date.month in [6, 7, 8]
            
            # Determine number of transactions per day (more during holidays)
            if is_holiday_season:
                daily_transactions = 3 + (day_offset % 4)  # 3-6 transactions
            elif is_summer:
                daily_transactions = 1 + (day_offset % 3)  # 1-3 transactions
            else:
                daily_transactions = 2 + (day_offset % 3)  # 2-4 transactions
            
            for transaction_num in range(daily_transactions):
                customer = test_customers[transaction_num % len(test_customers)]
                
                invoice = Invoice(
                    invoice_number=f"ANL-{day_offset:03d}-{transaction_num}",
                    customer_id=customer.id,
                    total_amount=Decimal("0.00"),
                    paid_amount=Decimal("0.00"),
                    remaining_amount=Decimal("0.00"),
                    status="completed",
                    created_at=datetime.combine(current_date, datetime.min.time()) + timedelta(hours=9 + transaction_num * 2),
                    vat_percentage=Decimal("10.00"),
                    labor_cost_percentage=Decimal("5.00")
                )
                test_invoices.append(invoice)
        
        db.add_all(test_invoices)
        db.commit()
        
        # Create invoice items with realistic buying patterns
        for i, invoice in enumerate(test_invoices):
            invoice_date = invoice.created_at.date()
            is_holiday_season = invoice_date.month in [11, 12, 2]
            is_summer = invoice_date.month in [6, 7, 8]
            
            # Determine item selection based on customer type and season
            customer_type = i % 5  # 0-1: Premium, 2-3: Regular, 4: Frequent
            
            total_amount = Decimal("0.00")
            
            if customer_type <= 1:  # Premium customers
                if is_holiday_season:
                    # Premium customers buy high-end items during holidays
                    selected_items = gold_items + gemstone_items[:1]
                    item_count = 1 + (i % 2)  # 1-2 items
                else:
                    selected_items = gold_items[:1] + silver_items
                    item_count = 1
            elif customer_type <= 3:  # Regular customers
                if is_holiday_season:
                    selected_items = silver_items + gemstone_items
                    item_count = 1 + (i % 2)
                else:
                    selected_items = silver_items + fashion_items
                    item_count = 1 + (i % 3)  # 1-3 items
            else:  # Frequent buyer
                # Frequent buyers often buy multiple items, including bundles
                selected_items = test_items
                item_count = 2 + (i % 4)  # 2-5 items
            
            # Create invoice items
            for j in range(min(item_count, len(selected_items))):
                item = selected_items[j % len(selected_items)]
                quantity = 1
                
                # Frequent buyers sometimes buy multiple quantities
                if customer_type == 4 and item.category_id == categories[3].id:  # Fashion items
                    quantity = 1 + (i % 3)
                
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
        
        # Create payments for all invoices
        for invoice in test_invoices:
            payment = Payment(
                invoice_id=invoice.id,
                amount=invoice.total_amount,
                payment_method="cash" if invoice.total_amount < 1000 else "card",
                payment_date=invoice.created_at.date(),
                notes="Analytics test payment"
            )
            db.add(payment)
        
        db.commit()
        
        yield {
            "user": test_user,
            "categories": categories,
            "items": test_items,
            "customers": test_customers,
            "invoices": test_invoices,
            "gold_items": gold_items,
            "silver_items": silver_items,
            "gemstone_items": gemstone_items,
            "fashion_items": fashion_items
        }
        
    finally:
        db.close()

@pytest.fixture
def analytics_auth_headers(setup_analytics_database):
    """Create authentication headers for analytics API requests"""
    test_user = setup_analytics_database["user"]
    access_token = create_access_token(data={"sub": test_user.username})
    return {"Authorization": f"Bearer {access_token}"}

def test_get_demand_forecast_single_item(setup_analytics_database, analytics_auth_headers):
    """Test demand forecasting for a single item"""
    
    gold_ring = setup_analytics_database["gold_items"][0]
    
    response = client.get(
        f"/analytics-data/demand-forecast?item_id={gold_ring.id}&periods=30&model_type=arima",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["forecast_type"] == "single_item"
    assert "item" in data
    assert "forecast" in data
    assert "generated_at" in data
    
    # Verify item details
    item_data = data["item"]
    assert item_data["id"] == str(gold_ring.id)
    assert item_data["name"] == gold_ring.name
    assert item_data["current_stock"] == gold_ring.stock_quantity
    
    # Verify forecast structure
    forecast_data = data["forecast"]
    assert "predictions" in forecast_data
    assert "model_accuracy" in forecast_data
    assert "confidence_intervals" in forecast_data

def test_get_demand_forecast_category(setup_analytics_database, analytics_auth_headers):
    """Test demand forecasting for a category"""
    
    silver_category = setup_analytics_database["categories"][1]
    
    response = client.get(
        f"/analytics-data/demand-forecast?category_id={silver_category.id}&periods=60&model_type=linear_regression",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["forecast_type"] == "category"
    assert "category" in data
    assert "forecast" in data
    
    # Verify category details
    category_data = data["category"]
    assert category_data["id"] == str(silver_category.id)
    assert category_data["name"] == silver_category.name
    assert category_data["item_count"] > 0

def test_get_demand_forecast_overall(setup_analytics_database, analytics_auth_headers):
    """Test overall demand forecasting"""
    
    response = client.get(
        "/analytics-data/demand-forecast?periods=90&model_type=seasonal&confidence_level=0.90",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["forecast_type"] == "overall"
    assert "forecast" in data
    
    # Verify forecast includes confidence intervals
    forecast_data = data["forecast"]
    assert "confidence_level" in forecast_data
    assert forecast_data["confidence_level"] == 0.90

def test_get_demand_forecast_with_historical_data(setup_analytics_database, analytics_auth_headers):
    """Test demand forecast with historical data included"""
    
    fashion_item = setup_analytics_database["fashion_items"][0]
    
    response = client.get(
        f"/analytics-data/demand-forecast?item_id={fashion_item.id}&periods=30&include_historical=true",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "historical_data" in data
    
    historical_data = data["historical_data"]
    assert "daily_sales" in historical_data
    assert "trend_analysis" in historical_data
    assert len(historical_data["daily_sales"]) > 0

def test_get_seasonality_analysis_item(setup_analytics_database, analytics_auth_headers):
    """Test seasonality analysis for a specific item"""
    
    gemstone_item = setup_analytics_database["gemstone_items"][0]
    
    response = client.get(
        f"/analytics-data/seasonality-analysis?item_id={gemstone_item.id}&analysis_period_days=180",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "entity" in data
    assert "seasonality" in data
    assert "analysis_period_days" in data
    
    # Verify entity information
    entity = data["entity"]
    assert entity["type"] == "item"
    assert entity["id"] == str(gemstone_item.id)
    
    # Verify seasonality analysis
    seasonality = data["seasonality"]
    assert "seasonal_patterns" in seasonality
    assert "peak_periods" in seasonality
    assert "trend_strength" in seasonality

def test_get_seasonality_analysis_category(setup_analytics_database, analytics_auth_headers):
    """Test seasonality analysis for a category"""
    
    fashion_category = setup_analytics_database["categories"][3]
    
    response = client.get(
        f"/analytics-data/seasonality-analysis?category_id={fashion_category.id}&analysis_period_days=365",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["entity"]["type"] == "category"
    assert data["entity"]["name"] == fashion_category.name
    assert data["analysis_period_days"] == 365

def test_get_cost_optimization_single_item(setup_analytics_database, analytics_auth_headers):
    """Test cost optimization for a single item"""
    
    silver_item = setup_analytics_database["silver_items"][0]
    
    response = client.get(
        f"/analytics-data/cost-optimization?item_id={silver_item.id}&service_level=0.95&optimization_type=all",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["optimization_type"] == "single_item"
    assert "item" in data
    assert "optimization" in data
    
    # Verify item details
    item_data = data["item"]
    assert item_data["id"] == str(silver_item.id)
    assert item_data["current_stock"] == silver_item.stock_quantity
    
    # Verify optimization results
    optimization = data["optimization"]
    assert "carrying_costs" in optimization
    assert "ordering_costs" in optimization
    assert "stockout_costs" in optimization
    assert "optimal_order_quantity" in optimization
    assert "reorder_point" in optimization

def test_get_cost_optimization_category(setup_analytics_database, analytics_auth_headers):
    """Test cost optimization for a category"""
    
    gold_category = setup_analytics_database["categories"][0]
    
    response = client.get(
        f"/analytics-data/cost-optimization?category_id={gold_category.id}&service_level=0.98&optimization_type=carrying_cost",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["optimization_type"] == "category"
    assert "category" in data
    assert "optimization" in data
    
    # Verify service level is applied
    assert data["service_level"] == 0.98
    assert data["optimization_scope"] == "carrying_cost"

def test_get_cost_optimization_with_recommendations(setup_analytics_database, analytics_auth_headers):
    """Test cost optimization with recommendations"""
    
    response = client.get(
        "/analytics-data/cost-optimization?optimization_type=all&include_recommendations=true",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["optimization_type"] == "overall"
    assert "recommendations" in data
    
    recommendations = data["recommendations"]
    assert "priority_actions" in recommendations
    assert "cost_savings_potential" in recommendations
    assert "implementation_timeline" in recommendations

def test_get_category_performance_single_category(setup_analytics_database, analytics_auth_headers):
    """Test category performance analysis for a single category"""
    
    silver_category = setup_analytics_database["categories"][1]
    start_date = (date.today() - timedelta(days=90)).isoformat()
    end_date = date.today().isoformat()
    
    response = client.get(
        f"/analytics-data/category-performance?category_id={silver_category.id}&start_date={start_date}&end_date={end_date}&performance_metrics=all",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["analysis_type"] == "single_category"
    assert "category" in data
    assert "performance" in data
    
    # Verify performance metrics
    performance = data["performance"]
    assert "sales_metrics" in performance
    assert "profit_metrics" in performance
    assert "turnover_metrics" in performance
    assert "growth_metrics" in performance

def test_get_category_performance_all_categories(setup_analytics_database, analytics_auth_headers):
    """Test category performance analysis for all categories"""
    
    response = client.get(
        "/analytics-data/category-performance?include_trends=true&include_comparisons=true&performance_metrics=sales,profit",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["analysis_type"] == "all_categories"
    assert "categories" in data
    assert "comparisons" in data
    
    # Verify categories are sorted by performance
    categories = data["categories"]
    assert len(categories) > 0
    
    # Verify comparisons
    comparisons = data["comparisons"]
    assert "top_performers" in comparisons
    assert "averages" in comparisons

def test_get_fast_slow_movers_analysis(setup_analytics_database, analytics_auth_headers):
    """Test fast/slow movers analysis"""
    
    response = client.get(
        "/analytics-data/fast-slow-movers?velocity_threshold=1.5&limit=10",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "fast_movers" in data
    assert "slow_movers" in data
    assert "dead_stock" in data
    assert "summary" in data
    
    # Verify summary statistics
    summary = data["summary"]
    assert "total_items_analyzed" in summary
    assert "fast_movers_count" in summary
    assert "slow_movers_count" in summary
    assert "dead_stock_count" in summary
    assert summary["velocity_threshold"] == 1.5
    
    # Verify items are properly classified
    fast_movers = data["fast_movers"]
    for item in fast_movers:
        assert item["velocity"] >= 1.5
        assert item["classification"] == "fast"

def test_get_fast_slow_movers_with_category_filter(setup_analytics_database, analytics_auth_headers):
    """Test fast/slow movers analysis with category filter"""
    
    fashion_category = setup_analytics_database["categories"][3]
    
    response = client.get(
        f"/analytics-data/fast-slow-movers?category_id={fashion_category.id}&velocity_threshold=2.0",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["category_filter"] == str(fashion_category.id)
    
    # Verify all items belong to the filtered category
    all_items = data["fast_movers"] + data["slow_movers"] + data["dead_stock"]
    for item in all_items:
        # Fashion items should be present (high volume category)
        assert "Fashion" in item["item_name"] or "Costume" in item["item_name"]

def test_get_cross_selling_opportunities(setup_analytics_database, analytics_auth_headers):
    """Test cross-selling opportunities analysis"""
    
    response = client.get(
        "/analytics-data/cross-selling-opportunities?min_support=0.01&min_confidence=0.2&max_recommendations=15",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "cross_selling_rules" in data
    assert "bundle_recommendations" in data
    assert "revenue_impact" in data
    assert "analysis_parameters" in data
    
    # Verify analysis parameters
    params = data["analysis_parameters"]
    assert params["min_support"] == 0.01
    assert params["min_confidence"] == 0.2
    assert params["max_recommendations"] == 15
    
    # Verify cross-selling rules structure
    if data["cross_selling_rules"]:
        rule = data["cross_selling_rules"][0]
        assert "antecedent_name" in rule
        assert "consequent_name" in rule
        assert "support" in rule
        assert "confidence" in rule
        assert "lift" in rule

def test_get_cross_selling_bundle_recommendations(setup_analytics_database, analytics_auth_headers):
    """Test bundle recommendations from cross-selling analysis"""
    
    response = client.get(
        "/analytics-data/cross-selling-opportunities?min_support=0.005&min_confidence=0.15",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    bundle_recommendations = data["bundle_recommendations"]
    
    if bundle_recommendations:
        bundle = bundle_recommendations[0]
        assert "anchor_item" in bundle
        assert "bundle_items" in bundle
        assert "bundle_metrics" in bundle
        
        # Verify bundle metrics
        metrics = bundle["bundle_metrics"]
        assert "total_items" in metrics
        assert "original_price" in metrics
        assert "suggested_discount_percent" in metrics
        assert "discounted_price" in metrics
        assert "avg_confidence" in metrics
        
        # Verify discount is reasonable
        assert 0 <= metrics["suggested_discount_percent"] <= 20

def test_get_cross_selling_revenue_impact(setup_analytics_database, analytics_auth_headers):
    """Test revenue impact calculation for cross-selling"""
    
    response = client.get(
        "/analytics-data/cross-selling-opportunities?min_support=0.005&min_confidence=0.1",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    revenue_impact = data["revenue_impact"]
    
    assert "total_potential_revenue" in revenue_impact
    assert "total_additional_revenue" in revenue_impact
    assert "revenue_uplift_percent" in revenue_impact
    assert "bundle_count" in revenue_impact
    assert "analysis_period_days" in revenue_impact
    
    # Verify revenue calculations are non-negative
    assert revenue_impact["total_potential_revenue"] >= 0
    assert revenue_impact["total_additional_revenue"] >= 0
    assert revenue_impact["revenue_uplift_percent"] >= 0

def test_analytics_data_endpoints_unauthorized():
    """Test analytics data endpoints without authentication"""
    
    endpoints = [
        "/analytics-data/demand-forecast",
        "/analytics-data/seasonality-analysis",
        "/analytics-data/cost-optimization",
        "/analytics-data/category-performance",
        "/analytics-data/fast-slow-movers",
        "/analytics-data/cross-selling-opportunities"
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code == 401

def test_analytics_data_invalid_parameters(setup_analytics_database, analytics_auth_headers):
    """Test analytics endpoints with invalid parameters"""
    
    # Test invalid item ID
    response = client.get(
        "/analytics-data/demand-forecast?item_id=invalid-uuid",
        headers=analytics_auth_headers
    )
    assert response.status_code == 422  # Validation error
    
    # Test invalid periods
    response = client.get(
        "/analytics-data/demand-forecast?periods=0",
        headers=analytics_auth_headers
    )
    assert response.status_code == 422
    
    # Test invalid confidence level
    response = client.get(
        "/analytics-data/demand-forecast?confidence_level=1.5",
        headers=analytics_auth_headers
    )
    assert response.status_code == 422

def test_analytics_data_performance(setup_analytics_database, analytics_auth_headers):
    """Test analytics data endpoints performance"""
    
    import time
    
    endpoints_to_test = [
        "/analytics-data/demand-forecast?periods=30",
        "/analytics-data/category-performance",
        "/analytics-data/fast-slow-movers?limit=5",
        "/analytics-data/cost-optimization?optimization_type=carrying_cost"
    ]
    
    for endpoint in endpoints_to_test:
        start_time = time.time()
        response = client.get(endpoint, headers=analytics_auth_headers)
        end_time = time.time()
        
        assert response.status_code == 200
        # Each endpoint should respond within reasonable time
        assert (end_time - start_time) < 15.0  # 15 seconds max

def test_analytics_data_accuracy_validation(setup_analytics_database, analytics_auth_headers):
    """Test analytics data calculation accuracy"""
    
    # Test that fast movers have higher velocity than slow movers
    response = client.get(
        "/analytics-data/fast-slow-movers?velocity_threshold=1.0",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    fast_movers = data["fast_movers"]
    slow_movers = data["slow_movers"]
    
    if fast_movers and slow_movers:
        # Verify velocity ordering
        max_slow_velocity = max(item["velocity"] for item in slow_movers)
        min_fast_velocity = min(item["velocity"] for item in fast_movers)
        assert min_fast_velocity >= max_slow_velocity

def test_analytics_comprehensive_workflow(setup_analytics_database, analytics_auth_headers):
    """Test comprehensive analytics workflow"""
    
    # 1. Get category performance to identify top category
    response = client.get(
        "/analytics-data/category-performance?performance_metrics=sales",
        headers=analytics_auth_headers
    )
    assert response.status_code == 200
    
    categories = response.json()["categories"]
    if categories:
        top_category_id = categories[0]["category"]["id"]
        
        # 2. Get demand forecast for top category
        response = client.get(
            f"/analytics-data/demand-forecast?category_id={top_category_id}&periods=60",
            headers=analytics_auth_headers
        )
        assert response.status_code == 200
        
        # 3. Get cost optimization for the same category
        response = client.get(
            f"/analytics-data/cost-optimization?category_id={top_category_id}&optimization_type=all",
            headers=analytics_auth_headers
        )
        assert response.status_code == 200
        
        # 4. Get seasonality analysis
        response = client.get(
            f"/analytics-data/seasonality-analysis?category_id={top_category_id}",
            headers=analytics_auth_headers
        )
        assert response.status_code == 200
        
        # All requests should succeed in sequence
        assert True  # If we reach here, the workflow completed successfully

if __name__ == "__main__":
    pytest.main([__file__, "-v"])