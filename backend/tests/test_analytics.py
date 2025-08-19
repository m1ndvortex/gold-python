import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from decimal import Decimal
import json

from main import app
from database import get_db
import models
import schemas

client = TestClient(app)

@pytest.fixture
def auth_headers(test_user_token):
    """Fixture to provide authentication headers"""
    return {"Authorization": f"Bearer {test_user_token}"}

@pytest.fixture
def test_analytics_data(db_session, test_user):
    """Create test data for analytics"""
    # Create test invoices with different dates
    now = datetime.now()
    
    # Create customer
    customer = models.Customer(
        name="Test Customer",
        phone="1234567890",
        email="test@example.com",
        total_purchases=Decimal("1000.00"),
        current_debt=Decimal("200.00")
    )
    db_session.add(customer)
    db_session.flush()
    
    # Create category
    category = models.Category(
        name="Test Category",
        description="Test category"
    )
    db_session.add(category)
    db_session.flush()
    
    # Create inventory item
    inventory_item = models.InventoryItem(
        name="Test Gold Ring",
        category_id=category.id,
        weight_grams=Decimal("10.5"),
        purchase_price=Decimal("500.00"),
        sell_price=Decimal("800.00"),
        stock_quantity=50,
        min_stock_level=5
    )
    db_session.add(inventory_item)
    db_session.flush()
    
    # Create invoices with different dates
    invoices_data = [
        (now - timedelta(days=1), Decimal("800.00")),
        (now - timedelta(days=7), Decimal("1200.00")),
        (now - timedelta(days=15), Decimal("600.00")),
        (now - timedelta(days=30), Decimal("900.00")),
    ]
    
    invoices = []
    for i, (date, amount) in enumerate(invoices_data):
        invoice = models.Invoice(
            invoice_number=f"INV-{i+1:03d}",
            customer_id=customer.id,
            total_amount=amount,
            paid_amount=amount * Decimal("0.8"),  # 80% paid
            remaining_amount=amount * Decimal("0.2"),  # 20% remaining
            gold_price_per_gram=Decimal("60.00"),
            created_at=date,
            status="partial"
        )
        db_session.add(invoice)
        invoices.append(invoice)
    
    db_session.commit()
    
    return {
        "customer": customer,
        "category": category,
        "inventory_item": inventory_item,
        "invoices": invoices
    }

class TestAnalyticsDashboard:
    """Test Analytics Dashboard API"""
    
    def test_get_dashboard_analytics_success(self, db_session, auth_headers, test_analytics_data):
        """Test successful dashboard analytics retrieval"""
        # Test without date range
        response = client.get("/analytics/dashboard", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "time_based" in data
        assert "sales" in data
        assert "inventory" in data
        assert "customers" in data
        assert "last_updated" in data
        
        # Verify time-based analytics structure
        time_based = data["time_based"]
        assert "daily_patterns" in time_based
        assert "weekly_patterns" in time_based
        assert "monthly_trends" in time_based
        assert "year_over_year" in time_based
        
        # Verify sales analytics structure
        sales = data["sales"]
        assert "total_sales" in sales
        assert "sales_by_period" in sales
        assert "top_selling_items" in sales
        assert "sales_by_category" in sales
        assert "growth_rate" in sales
        assert "trend_direction" in sales
        
        # Verify inventory analytics structure
        inventory = data["inventory"]
        assert "total_value" in inventory
        assert "turnover_rate" in inventory
        assert "fast_moving_items" in inventory
        assert "slow_moving_items" in inventory
        assert "dead_stock_count" in inventory
        assert "stock_optimization_suggestions" in inventory
        
        # Verify customer analytics structure
        customers = data["customers"]
        assert "total_customers" in customers
        assert "new_customers" in customers
        assert "retention_rate" in customers
        assert "average_order_value" in customers
        assert "customer_lifetime_value" in customers
        assert "top_customers" in customers

    def test_get_dashboard_analytics_with_date_range(self, db_session, auth_headers, test_analytics_data):
        """Test dashboard analytics with custom date range"""
        start_date = (datetime.now() - timedelta(days=10)).isoformat()
        end_date = datetime.now().isoformat()
        
        response = client.get(
            f"/analytics/dashboard?start_date={start_date}&end_date={end_date}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "time_based" in data
        assert "sales" in data
        assert "inventory" in data
        assert "customers" in data

    def test_get_dashboard_analytics_unauthorized(self, db_session):
        """Test dashboard analytics without authentication"""
        response = client.get("/analytics/dashboard")
        assert response.status_code == 401

    def test_get_dashboard_analytics_insufficient_permissions(self, db_session, test_user_token_no_permissions):
        """Test dashboard analytics with insufficient permissions"""
        headers = {"Authorization": f"Bearer {test_user_token_no_permissions}"}
        response = client.get("/analytics/dashboard", headers=headers)
        assert response.status_code == 403

class TestKPITargets:
    """Test KPI Targets API"""
    
    def test_create_kpi_target_success(self, db_session, auth_headers):
        """Test successful KPI target creation"""
        kpi_data = {
            "kpi_type": "financial",
            "kpi_name": "daily_sales",
            "target_period": "daily",
            "target_value": 1000.0,
            "period_start": datetime.now().isoformat(),
            "period_end": (datetime.now() + timedelta(days=30)).isoformat(),
            "is_active": True
        }
        
        response = client.post("/analytics/kpi-targets", json=kpi_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["kpi_type"] == "financial"
        assert data["kpi_name"] == "daily_sales"
        assert data["target_value"] == 1000.0
        assert data["current_value"] == 0.0
        assert data["achievement_rate"] == 0.0
        assert data["is_active"] == True

    def test_create_kpi_target_unauthorized(self, db_session):
        """Test KPI target creation without authentication"""
        kpi_data = {
            "kpi_type": "financial",
            "kpi_name": "daily_sales",
            "target_period": "daily",
            "target_value": 1000.0,
            "period_start": datetime.now().isoformat(),
            "period_end": (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        response = client.post("/analytics/kpi-targets", json=kpi_data)
        assert response.status_code == 401

    def test_get_kpi_targets_success(self, db_session, auth_headers, test_user):
        """Test successful KPI targets retrieval"""
        # Create test KPI target
        kpi_target = models.KPITarget(
            kpi_type="financial",
            kpi_name="weekly_sales",
            target_period="weekly",
            target_value=Decimal("5000.00"),
            current_value=Decimal("3000.00"),
            achievement_rate=Decimal("60.0"),
            period_start=datetime.now(),
            period_end=datetime.now() + timedelta(days=7),
            created_by=test_user.id
        )
        db_session.add(kpi_target)
        db_session.commit()
        
        response = client.get("/analytics/kpi-targets", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["kpi_name"] == "weekly_sales"
        assert data[0]["target_value"] == 5000.0

    def test_get_kpi_targets_with_filters(self, db_session, auth_headers, test_user):
        """Test KPI targets retrieval with filters"""
        # Create test KPI targets
        kpi_targets = [
            models.KPITarget(
                kpi_type="financial",
                kpi_name="daily_sales",
                target_period="daily",
                target_value=Decimal("1000.00"),
                period_start=datetime.now(),
                period_end=datetime.now() + timedelta(days=1),
                created_by=test_user.id
            ),
            models.KPITarget(
                kpi_type="operational",
                kpi_name="inventory_turnover",
                target_period="monthly",
                target_value=Decimal("2.5"),
                period_start=datetime.now(),
                period_end=datetime.now() + timedelta(days=30),
                created_by=test_user.id
            )
        ]
        
        for kpi in kpi_targets:
            db_session.add(kpi)
        db_session.commit()
        
        # Test filter by kpi_type
        response = client.get("/analytics/kpi-targets?kpi_type=financial", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["kpi_type"] == "financial"
        
        # Test filter by target_period
        response = client.get("/analytics/kpi-targets?target_period=daily", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["target_period"] == "daily"

    def test_update_kpi_target_success(self, db_session, auth_headers, test_user):
        """Test successful KPI target update"""
        # Create test KPI target
        kpi_target = models.KPITarget(
            kpi_type="financial",
            kpi_name="monthly_sales",
            target_period="monthly",
            target_value=Decimal("10000.00"),
            current_value=Decimal("7500.00"),
            achievement_rate=Decimal("75.0"),
            period_start=datetime.now(),
            period_end=datetime.now() + timedelta(days=30),
            created_by=test_user.id
        )
        db_session.add(kpi_target)
        db_session.commit()
        
        # Update the KPI target
        update_data = {
            "current_value": 8500.0,
            "achievement_rate": 85.0,
            "trend_direction": "up"
        }
        
        response = client.put(
            f"/analytics/kpi-targets/{kpi_target.id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["current_value"] == 8500.0
        assert data["achievement_rate"] == 85.0
        assert data["trend_direction"] == "up"

    def test_update_kpi_target_not_found(self, db_session, auth_headers):
        """Test KPI target update with non-existent ID"""
        update_data = {
            "current_value": 8500.0,
            "achievement_rate": 85.0
        }
        
        response = client.put(
            "/analytics/kpi-targets/123e4567-e89b-12d3-a456-426614174000",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 404

class TestAnalyticsData:
    """Test Analytics Data API"""
    
    def test_get_analytics_data_success(self, db_session, auth_headers):
        """Test successful analytics data retrieval"""
        # Create test analytics data
        analytics_data = [
            models.AnalyticsData(
                data_type="sales_trend",
                entity_type="global",
                metric_name="daily_sales",
                metric_value=Decimal("1200.50"),
                calculation_date=datetime.now().date(),
                additional_data={"category": "rings", "period": "daily"}
            ),
            models.AnalyticsData(
                data_type="inventory_turnover",
                entity_type="category",
                metric_name="turnover_rate",
                metric_value=Decimal("2.5"),
                calculation_date=datetime.now().date(),
                additional_data={"category_name": "rings"}
            )
        ]
        
        for data in analytics_data:
            db_session.add(data)
        db_session.commit()
        
        response = client.get("/analytics/analytics-data", headers=auth_headers)
        assert response.status_code == 200
        
        result = response.json()
        assert "data" in result
        assert "summary" in result
        assert "total_records" in result
        assert len(result["data"]) == 2

    def test_get_analytics_data_with_filters(self, db_session, auth_headers):
        """Test analytics data retrieval with filters"""
        # Create test analytics data
        start_date = datetime.now() - timedelta(days=5)
        end_date = datetime.now()
        
        analytics_data = [
            models.AnalyticsData(
                data_type="sales_trend",
                entity_type="global",
                metric_name="daily_sales",
                metric_value=Decimal("1000.00"),
                calculation_date=start_date.date()
            ),
            models.AnalyticsData(
                data_type="customer_behavior",
                entity_type="customer",
                metric_name="purchase_frequency",
                metric_value=Decimal("3.2"),
                calculation_date=end_date.date()
            )
        ]
        
        for data in analytics_data:
            db_session.add(data)
        db_session.commit()
        
        # Test with date range filter
        response = client.get(
            f"/analytics/analytics-data?start_date={start_date.isoformat()}&end_date={end_date.isoformat()}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        result = response.json()
        assert len(result["data"]) == 2

    def test_get_analytics_data_pagination(self, db_session, auth_headers):
        """Test analytics data pagination"""
        # Create multiple analytics data entries
        for i in range(15):
            analytics_data = models.AnalyticsData(
                data_type="test_data",
                entity_type="global",
                metric_name=f"metric_{i}",
                metric_value=Decimal(str(i * 100)),
                calculation_date=datetime.now().date()
            )
            db_session.add(analytics_data)
        db_session.commit()
        
        # Test pagination
        response = client.get("/analytics/analytics-data?skip=0&limit=10", headers=auth_headers)
        assert response.status_code == 200
        
        result = response.json()
        assert len(result["data"]) == 10
        assert result["total_records"] >= 15

class TestAnalyticsIntegration:
    """Test analytics integration with real business data"""
    
    def test_analytics_with_real_business_scenario(self, db_session, auth_headers, test_analytics_data):
        """Test analytics with realistic business scenario"""
        # Get dashboard analytics
        response = client.get("/analytics/dashboard", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify that analytics reflect the test data
        assert data["customers"]["total_customers"] >= 1
        assert data["inventory"]["total_value"] > 0
        assert data["sales"]["total_sales"] > 0
        
        # Verify time-based patterns
        assert "hourly_sales" in data["time_based"]["daily_patterns"]
        assert "daily_sales" in data["time_based"]["weekly_patterns"]
        assert "monthly_sales" in data["time_based"]["monthly_trends"]
        
        # Verify year-over-year comparison
        yoy = data["time_based"]["year_over_year"]
        assert "current_period_sales" in yoy
        assert "last_year_sales" in yoy
        assert "growth_percentage" in yoy

    def test_analytics_error_handling(self, db_session, auth_headers):
        """Test analytics error handling"""
        # Test with invalid date format
        response = client.get(
            "/analytics/dashboard?start_date=invalid-date",
            headers=auth_headers
        )
        # Should handle gracefully or return 422 for validation error
        assert response.status_code in [200, 422]

if __name__ == "__main__":
    pytest.main([__file__])
