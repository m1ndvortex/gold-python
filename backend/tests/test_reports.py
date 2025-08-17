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

class TestReportsAPI:
    """Test suite for Reports API endpoints using real PostgreSQL database in Docker"""
    
    @pytest.fixture(autouse=True)
    def setup_test_data(self, db_session: Session):
        """Set up test data for reports testing"""
        self.db = db_session
        
        # Create test role
        self.test_role = Role(
            name="Test Role",
            description="Test role for reports",
            permissions={"view_reports": True, "manage_inventory": True}
        )
        self.db.add(self.test_role)
        
        # Create test categories
        self.category1 = Category(name="Gold Rings", description="Gold ring category")
        self.category2 = Category(name="Gold Necklaces", description="Gold necklace category")
        self.db.add_all([self.category1, self.category2])
        self.db.flush()
        
        # Create test inventory items
        self.item1 = InventoryItem(
            name="Gold Ring 18K",
            category_id=self.category1.id,
            weight_grams=Decimal("5.5"),
            purchase_price=Decimal("200.00"),
            sell_price=Decimal("300.00"),
            stock_quantity=10,
            min_stock_level=5
        )
        
        self.item2 = InventoryItem(
            name="Gold Necklace 22K",
            category_id=self.category2.id,
            weight_grams=Decimal("15.0"),
            purchase_price=Decimal("800.00"),
            sell_price=Decimal("1200.00"),
            stock_quantity=2,  # Low stock
            min_stock_level=5
        )
        
        self.item3 = InventoryItem(
            name="Gold Bracelet 18K",
            category_id=self.category1.id,
            weight_grams=Decimal("8.0"),
            purchase_price=Decimal("400.00"),
            sell_price=Decimal("600.00"),
            stock_quantity=0,  # Out of stock
            min_stock_level=3
        )
        
        self.db.add_all([self.item1, self.item2, self.item3])
        self.db.flush()
        
        # Create test customers
        self.customer1 = Customer(
            name="Ahmad Hassan",
            phone="+1234567890",
            email="ahmad@example.com",
            current_debt=Decimal("500.00"),
            total_purchases=Decimal("2000.00")
        )
        
        self.customer2 = Customer(
            name="Fatima Ali",
            phone="+1234567891",
            email="fatima@example.com",
            current_debt=Decimal("0.00"),
            total_purchases=Decimal("1500.00")
        )
        
        self.customer3 = Customer(
            name="Omar Khan",
            phone="+1234567892",
            current_debt=Decimal("2500.00"),  # High debt
            total_purchases=Decimal("5000.00")
        )
        
        self.db.add_all([self.customer1, self.customer2, self.customer3])
        self.db.flush()
        
        # Create test invoices with different dates
        today = datetime.now()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        self.invoice1 = Invoice(
            invoice_number="INV-001",
            customer_id=self.customer1.id,
            total_amount=Decimal("600.00"),
            paid_amount=Decimal("100.00"),
            remaining_amount=Decimal("500.00"),
            gold_price_per_gram=Decimal("50.00"),
            status="partially_paid",
            created_at=today
        )
        
        self.invoice2 = Invoice(
            invoice_number="INV-002",
            customer_id=self.customer2.id,
            total_amount=Decimal("1200.00"),
            paid_amount=Decimal("1200.00"),
            remaining_amount=Decimal("0.00"),
            gold_price_per_gram=Decimal("50.00"),
            status="paid",
            created_at=week_ago
        )
        
        self.invoice3 = Invoice(
            invoice_number="INV-003",
            customer_id=self.customer3.id,
            total_amount=Decimal("1800.00"),
            paid_amount=Decimal("0.00"),
            remaining_amount=Decimal("1800.00"),
            gold_price_per_gram=Decimal("52.00"),
            status="pending",
            created_at=month_ago
        )
        
        self.db.add_all([self.invoice1, self.invoice2, self.invoice3])
        self.db.flush()
        
        # Create invoice items
        self.invoice_item1 = InvoiceItem(
            invoice_id=self.invoice1.id,
            inventory_item_id=self.item1.id,
            quantity=2,
            unit_price=Decimal("300.00"),
            total_price=Decimal("600.00"),
            weight_grams=Decimal("11.0")
        )
        
        self.invoice_item2 = InvoiceItem(
            invoice_id=self.invoice2.id,
            inventory_item_id=self.item2.id,
            quantity=1,
            unit_price=Decimal("1200.00"),
            total_price=Decimal("1200.00"),
            weight_grams=Decimal("15.0")
        )
        
        self.invoice_item3 = InvoiceItem(
            invoice_id=self.invoice3.id,
            inventory_item_id=self.item1.id,
            quantity=6,
            unit_price=Decimal("300.00"),
            total_price=Decimal("1800.00"),
            weight_grams=Decimal("33.0")
        )
        
        self.db.add_all([self.invoice_item1, self.invoice_item2, self.invoice_item3])
        
        # Create test payments
        self.payment1 = Payment(
            customer_id=self.customer1.id,
            invoice_id=self.invoice1.id,
            amount=Decimal("100.00"),
            payment_method="cash",
            payment_date=today
        )
        
        self.payment2 = Payment(
            customer_id=self.customer2.id,
            invoice_id=self.invoice2.id,
            amount=Decimal("1200.00"),
            payment_method="bank",
            payment_date=week_ago
        )
        
        # Old payment for debt aging test
        old_payment = Payment(
            customer_id=self.customer3.id,
            amount=Decimal("500.00"),
            payment_method="cash",
            payment_date=today - timedelta(days=45)  # 45 days ago
        )
        
        self.db.add_all([self.payment1, self.payment2, old_payment])
        self.db.commit()
    
    def test_sales_trends_daily(self):
        """Test sales trends analysis with daily period"""
        response = client.get(
            "/reports/sales/trends",
            params={
                "period": "daily",
                "start_date": (date.today() - timedelta(days=30)).isoformat(),
                "end_date": date.today().isoformat()
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "period" in data
        assert "summary" in data
        assert "trends" in data
        assert data["period"] == "daily"
        
        # Verify summary calculations
        summary = data["summary"]
        assert "total_sales" in summary
        assert "total_paid" in summary
        assert "total_outstanding" in summary
        assert "total_items_sold" in summary
        assert "average_daily_sales" in summary
        
        # Should have sales data from our test invoices
        assert summary["total_sales"] > 0
        assert summary["total_items_sold"] > 0
        
        # Verify trends data structure
        assert isinstance(data["trends"], list)
        if data["trends"]:
            trend = data["trends"][0]
            assert "period" in trend
            assert "total_amount" in trend
            assert "paid_amount" in trend
            assert "items_sold" in trend
            assert "categories" in trend
    
    def test_sales_trends_with_category_filter(self):
        """Test sales trends with category filtering"""
        response = client.get(
            "/reports/sales/trends",
            params={
                "period": "weekly",
                "category_id": str(self.category1.id),
                "start_date": (date.today() - timedelta(days=30)).isoformat(),
                "end_date": date.today().isoformat()
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only include sales from category1 (Gold Rings)
        assert data["period"] == "weekly"
        assert "trends" in data
    
    def test_top_selling_products(self):
        """Test top selling products endpoint"""
        response = client.get(
            "/reports/sales/top-products",
            params={
                "limit": 5,
                "start_date": (date.today() - timedelta(days=30)).isoformat(),
                "end_date": date.today().isoformat()
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "period" in data
        assert "top_by_quantity" in data
        assert "top_by_revenue" in data
        
        # Verify data structure for top products
        if data["top_by_quantity"]:
            product = data["top_by_quantity"][0]
            assert "item_id" in product
            assert "item_name" in product
            assert "category_name" in product
            assert "total_quantity" in product
            assert "total_revenue" in product
            assert "transaction_count" in product
            assert "average_price" in product
        
        if data["top_by_revenue"]:
            product = data["top_by_revenue"][0]
            assert "item_id" in product
            assert "total_revenue" in product
    
    def test_inventory_valuation(self):
        """Test inventory valuation report"""
        response = client.get("/reports/inventory/valuation")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "summary" in data
        assert "category_breakdown" in data
        assert "items" in data
        
        # Verify summary calculations
        summary = data["summary"]
        assert "total_purchase_value" in summary
        assert "total_sell_value" in summary
        assert "total_potential_profit" in summary
        assert "overall_profit_margin" in summary
        assert "total_weight_grams" in summary
        assert "total_items" in summary
        assert "unique_products" in summary
        
        # Should have positive values from our test data
        assert summary["total_purchase_value"] > 0
        assert summary["total_sell_value"] > 0
        assert summary["total_potential_profit"] > 0
        assert summary["total_items"] >= 0  # Could be 0 if all out of stock
        
        # Verify category breakdown
        assert isinstance(data["category_breakdown"], list)
        if data["category_breakdown"]:
            category = data["category_breakdown"][0]
            assert "category_name" in category
            assert "purchase_value" in category
            assert "sell_value" in category
            assert "potential_profit" in category
            assert "profit_margin" in category
        
        # Verify items data
        assert isinstance(data["items"], list)
        if data["items"]:
            item = data["items"][0]
            assert "item_id" in item
            assert "item_name" in item
            assert "category_name" in item
            assert "stock_quantity" in item
            assert "total_purchase_value" in item
            assert "total_sell_value" in item
            assert "potential_profit" in item
            assert "profit_margin" in item
    
    def test_inventory_valuation_with_category_filter(self):
        """Test inventory valuation with category filter"""
        response = client.get(
            "/reports/inventory/valuation",
            params={"category_id": str(self.category1.id)}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only include items from category1
        for item in data["items"]:
            # All items should be from the filtered category
            assert item["category_name"] == "Gold Rings"
    
    def test_low_stock_report(self):
        """Test low stock items report"""
        response = client.get("/reports/inventory/low-stock")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "summary" in data
        assert "items" in data
        
        # Verify summary
        summary = data["summary"]
        assert "total_low_stock_items" in summary
        assert "critical_items" in summary
        assert "warning_items" in summary
        assert "total_potential_lost_sales" in summary
        
        # Should detect our low stock items (item2 and item3)
        assert summary["total_low_stock_items"] >= 2
        assert summary["critical_items"] >= 1  # item3 has 0 stock
        
        # Verify items data
        assert isinstance(data["items"], list)
        if data["items"]:
            item = data["items"][0]
            assert "item_id" in item
            assert "item_name" in item
            assert "category_name" in item
            assert "current_stock" in item
            assert "min_stock_level" in item
            assert "shortage" in item
            assert "status" in item
            assert "urgency_score" in item
            
            # Verify status classification
            assert item["status"] in ["critical", "warning"]
    
    def test_low_stock_with_threshold_multiplier(self):
        """Test low stock report with custom threshold multiplier"""
        response = client.get(
            "/reports/inventory/low-stock",
            params={"threshold_multiplier": 2.0}  # Double the threshold
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # With higher threshold, should detect more items as low stock
        assert data["summary"]["threshold_multiplier"] == 2.0
    
    def test_customer_analysis(self):
        """Test customer purchase analysis"""
        response = client.get(
            "/reports/customers/analysis",
            params={
                "start_date": (date.today() - timedelta(days=30)).isoformat(),
                "end_date": date.today().isoformat(),
                "min_purchases": 1
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "period" in data
        assert "summary" in data
        assert "customers" in data
        
        # Verify summary
        summary = data["summary"]
        assert "total_active_customers" in summary
        assert "total_revenue" in summary
        assert "average_revenue_per_customer" in summary
        assert "high_value_customers" in summary
        assert "customers_with_debt" in summary
        assert "debt_percentage" in summary
        
        # Should have customers from our test data
        assert summary["total_active_customers"] > 0
        assert summary["customers_with_debt"] >= 2  # customer1 and customer3 have debt
        
        # Verify customer data
        assert isinstance(data["customers"], list)
        if data["customers"]:
            customer = data["customers"][0]
            assert "customer_id" in customer
            assert "customer_name" in customer
            assert "current_debt" in customer
            assert "period_purchases" in customer
            assert "segment" in customer
            assert customer["segment"] in ["high_value", "medium_value", "low_value"]
    
    def test_debt_report(self):
        """Test customer debt report"""
        response = client.get(
            "/reports/customers/debt-report",
            params={"min_debt": 0, "sort_by": "debt_desc"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "summary" in data
        assert "debt_aging" in data
        assert "customers" in data
        
        # Verify summary
        summary = data["summary"]
        assert "total_customers_with_debt" in summary
        assert "total_outstanding_debt" in summary
        assert "average_debt_per_customer" in summary
        
        # Should detect customers with debt
        assert summary["total_customers_with_debt"] >= 2
        assert summary["total_outstanding_debt"] > 0
        
        # Verify debt aging structure
        debt_aging = data["debt_aging"]
        assert "current" in debt_aging
        assert "thirty_days" in debt_aging
        assert "sixty_days" in debt_aging
        assert "ninety_days_plus" in debt_aging
        
        # Verify customer debt data
        assert isinstance(data["customers"], list)
        if data["customers"]:
            customer = data["customers"][0]
            assert "customer_id" in customer
            assert "customer_name" in customer
            assert "current_debt" in customer
            assert "total_payments" in customer
            assert "payment_history_score" in customer
            assert "debt_to_purchases_ratio" in customer
    
    def test_debt_report_sorting(self):
        """Test debt report with different sorting options"""
        # Test sorting by debt amount (descending)
        response = client.get(
            "/reports/customers/debt-report",
            params={"sort_by": "debt_desc"}
        )
        assert response.status_code == 200
        
        # Test sorting by name
        response = client.get(
            "/reports/customers/debt-report",
            params={"sort_by": "name"}
        )
        assert response.status_code == 200
        
        # Test sorting by last payment
        response = client.get(
            "/reports/customers/debt-report",
            params={"sort_by": "last_payment"}
        )
        assert response.status_code == 200
    
    def test_sales_overview_chart_data(self):
        """Test sales overview chart data for dashboard"""
        response = client.get(
            "/reports/charts/sales-overview",
            params={"days": 30}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "period" in data
        assert "daily_sales" in data
        assert "category_sales" in data
        
        # Verify period info
        assert data["period"]["days"] == 30
        
        # Verify daily sales structure
        assert isinstance(data["daily_sales"], list)
        if data["daily_sales"]:
            daily_sale = data["daily_sales"][0]
            assert "date" in daily_sale
            assert "total_sales" in daily_sale
            assert "total_paid" in daily_sale
            assert "invoice_count" in daily_sale
        
        # Verify category sales structure
        assert isinstance(data["category_sales"], list)
        if data["category_sales"]:
            category_sale = data["category_sales"][0]
            assert "category" in category_sale
            assert "total_sales" in category_sale
            assert "total_quantity" in category_sale
            assert "percentage" in category_sale
    
    def test_inventory_overview_chart_data(self):
        """Test inventory overview chart data for dashboard"""
        response = client.get("/reports/charts/inventory-overview")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "category_breakdown" in data
        assert "stock_status" in data
        
        # Verify category breakdown
        assert isinstance(data["category_breakdown"], list)
        if data["category_breakdown"]:
            category = data["category_breakdown"][0]
            assert "category" in category
            assert "item_count" in category
            assert "total_stock" in category
            assert "total_value" in category
            assert "low_stock_items" in category
        
        # Verify stock status
        stock_status = data["stock_status"]
        assert "out_of_stock" in stock_status
        assert "low_stock" in stock_status
        assert "in_stock" in stock_status
        
        # Should detect our stock issues
        assert stock_status["out_of_stock"] >= 1  # item3 is out of stock
        assert stock_status["low_stock"] >= 1     # item2 is low stock
    
    def test_customer_overview_chart_data(self):
        """Test customer overview chart data for dashboard"""
        response = client.get(
            "/reports/charts/customer-overview",
            params={"days": 30}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "period" in data
        assert "debt_distribution" in data
        assert "recent_activity" in data
        assert "top_customers" in data
        
        # Verify debt distribution
        debt_dist = data["debt_distribution"]
        assert "no_debt" in debt_dist
        assert "low_debt" in debt_dist
        assert "medium_debt" in debt_dist
        assert "high_debt" in debt_dist
        
        # Should have customers in different debt categories
        total_customers = sum(debt_dist.values())
        assert total_customers >= 3  # Our test customers
        
        # Verify recent activity structure
        assert isinstance(data["recent_activity"], list)
        if data["recent_activity"]:
            activity = data["recent_activity"][0]
            assert "date" in activity
            assert "active_customers" in activity
            assert "total_sales" in activity
        
        # Verify top customers structure
        assert isinstance(data["top_customers"], list)
        if data["top_customers"]:
            customer = data["top_customers"][0]
            assert "customer_name" in customer
            assert "recent_purchases" in customer
            assert "recent_invoices" in customer
    
    def test_reports_authentication_required(self):
        """Test that reports endpoints require authentication"""
        # Temporarily remove the mock authentication
        app.dependency_overrides.clear()
        
        response = client.get("/reports/sales/trends")
        assert response.status_code == 401
        
        response = client.get("/reports/inventory/valuation")
        assert response.status_code == 401
        
        response = client.get("/reports/customers/analysis")
        assert response.status_code == 401
        
        # Restore mock authentication
        app.dependency_overrides[get_current_user] = mock_get_current_user
    
    def test_invalid_date_parameters(self):
        """Test handling of invalid date parameters"""
        # Test with invalid date format
        response = client.get(
            "/reports/sales/trends",
            params={"start_date": "invalid-date"}
        )
        assert response.status_code == 422  # Validation error
        
        # Test with end_date before start_date
        response = client.get(
            "/reports/sales/trends",
            params={
                "start_date": date.today().isoformat(),
                "end_date": (date.today() - timedelta(days=1)).isoformat()
            }
        )
        # Should still work but return empty or minimal data
        assert response.status_code == 200
    
    def test_empty_database_scenarios(self):
        """Test reports with minimal or no data"""
        # Clear all test data
        self.db.query(InvoiceItem).delete()
        self.db.query(Payment).delete()
        self.db.query(Invoice).delete()
        self.db.query(InventoryItem).delete()
        self.db.query(Customer).delete()
        self.db.query(Category).delete()
        self.db.commit()
        
        # Test sales trends with no data
        response = client.get("/reports/sales/trends")
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["total_sales"] == 0
        
        # Test inventory valuation with no data
        response = client.get("/reports/inventory/valuation")
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["total_purchase_value"] == 0
        
        # Test customer analysis with no data
        response = client.get("/reports/customers/analysis")
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["total_active_customers"] == 0
    
    def test_large_dataset_performance(self):
        """Test reports performance with larger dataset"""
        # This test would be expanded in a real scenario to test with thousands of records
        # For now, we'll just verify the endpoints can handle the current test data efficiently
        
        import time
        
        start_time = time.time()
        response = client.get("/reports/sales/trends")
        end_time = time.time()
        
        assert response.status_code == 200
        # Should complete within reasonable time (adjust threshold as needed)
        assert (end_time - start_time) < 5.0  # 5 seconds max
        
        start_time = time.time()
        response = client.get("/reports/inventory/valuation")
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 5.0
    
    def test_concurrent_report_requests(self):
        """Test handling of concurrent report requests"""
        import threading
        import time
        
        results = []
        
        def make_request():
            try:
                response = client.get("/reports/sales/trends")
                results.append(response.status_code)
            except Exception as e:
                results.append(str(e))
        
        # Create multiple threads to simulate concurrent requests
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert all(result == 200 for result in results)
        assert len(results) == 5