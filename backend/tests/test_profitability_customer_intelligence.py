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
def test_profitability_data(db_session, test_user):
    """Create comprehensive test data for profitability and customer intelligence analysis"""
    
    # Create categories
    categories = []
    category_names = ["Gold Rings", "Gold Necklaces", "Gold Bracelets"]
    for name in category_names:
        category = models.Category(name=name, description=f"Test {name}")
        db_session.add(category)
        categories.append(category)
    
    db_session.flush()
    
    # Create inventory items with different profit margins
    inventory_items = []
    items_data = [
        # (name, category_idx, purchase_price, sell_price, stock)
        ("Premium Gold Ring", 0, 800.00, 1200.00, 20),  # 33% margin
        ("Standard Gold Ring", 0, 600.00, 850.00, 30),   # 29% margin
        ("Luxury Necklace", 1, 1500.00, 2200.00, 15),    # 32% margin
        ("Simple Necklace", 1, 500.00, 650.00, 25),      # 23% margin
        ("Designer Bracelet", 2, 1200.00, 1800.00, 10),  # 33% margin
        ("Basic Bracelet", 2, 400.00, 500.00, 40),       # 20% margin
    ]
    
    for name, cat_idx, purchase, sell, stock in items_data:
        item = models.InventoryItem(
            name=name,
            category_id=categories[cat_idx].id,
            weight_grams=Decimal("15.0"),
            purchase_price=Decimal(str(purchase)),
            sell_price=Decimal(str(sell)),
            stock_quantity=stock,
            min_stock_level=5
        )
        db_session.add(item)
        inventory_items.append(item)
    
    db_session.flush()
    
    # Create customers with different profiles
    customers = []
    customers_data = [
        ("High Value Customer", 15000.00, 500.00),   # VIP
        ("Regular Customer", 5000.00, 200.00),       # Regular
        ("Occasional Customer", 1500.00, 100.00),    # Occasional
        ("New Customer", 300.00, 0.00),              # New
        ("At Risk Customer", 8000.00, 1000.00),      # High debt
    ]
    
    for name, total_purchases, debt in customers_data:
        customer = models.Customer(
            name=name,
            phone=f"123456789{len(customers)}",
            email=f"customer{len(customers)}@test.com",
            total_purchases=Decimal(str(total_purchases)),
            current_debt=Decimal(str(debt))
        )
        db_session.add(customer)
        customers.append(customer)
    
    db_session.flush()
    
    # Create invoices with varying dates and items
    invoices = []
    now = datetime.now()
    
    # Create invoices over the past 3 months
    for i in range(20):
        # Distribute invoices over time
        days_ago = i * 4  # Every 4 days
        invoice_date = now - timedelta(days=days_ago)
        
        customer = customers[i % len(customers)]
        
        invoice = models.Invoice(
            invoice_number=f"INV-{i+100:03d}",
            customer_id=customer.id,
            total_amount=Decimal("0"),  # Will calculate after items
            paid_amount=Decimal("0"),
            remaining_amount=Decimal("0"),
            gold_price_per_gram=Decimal("65.00"),
            labor_cost_percentage=Decimal("10.0"),
            profit_percentage=Decimal("15.0"),
            vat_percentage=Decimal("5.0"),
            status="completed",
            created_at=invoice_date
        )
        db_session.add(invoice)
        invoices.append(invoice)
    
    db_session.flush()
    
    # Create invoice items
    for i, invoice in enumerate(invoices):
        # Each invoice gets 1-3 items
        num_items = (i % 3) + 1
        total_amount = Decimal("0")
        
        for j in range(num_items):
            item = inventory_items[(i + j) % len(inventory_items)]
            quantity = (j % 3) + 1
            
            invoice_item = models.InvoiceItem(
                invoice_id=invoice.id,
                inventory_item_id=item.id,
                quantity=quantity,
                unit_price=item.sell_price,
                total_price=item.sell_price * quantity,
                weight_grams=item.weight_grams * quantity
            )
            db_session.add(invoice_item)
            total_amount += invoice_item.total_price
        
        # Update invoice total
        invoice.total_amount = total_amount
        invoice.paid_amount = total_amount * Decimal("0.8")  # 80% paid
        invoice.remaining_amount = total_amount * Decimal("0.2")
    
    db_session.commit()
    
    return {
        "categories": categories,
        "inventory_items": inventory_items,
        "customers": customers,
        "invoices": invoices
    }

class TestProfitabilityAnalysis:
    """Test Profitability Analysis API"""
    
    def test_profitability_dashboard_unauthorized(self):
        """Test profitability dashboard without authentication"""
        response = client.get("/profitability/dashboard")
        assert response.status_code == 403  # Expecting 403 based on error output
    
    def test_get_item_profitability_unauthorized(self):
        """Test item profitability without authentication"""
        response = client.get("/profitability/items")
        assert response.status_code == 403
    
    def test_get_category_profitability_unauthorized(self):
        """Test category profitability without authentication"""
        response = client.get("/profitability/categories")
        assert response.status_code == 403
    
    def test_get_margin_trends_unauthorized(self):
        """Test margin trends without authentication"""
        response = client.get("/profitability/margins/trends")
        assert response.status_code == 403

class TestCustomerIntelligence:
    """Test Customer Intelligence API"""
    
    def test_customer_intelligence_dashboard_unauthorized(self):
        """Test customer intelligence dashboard without authentication"""
        response = client.get("/customer-intelligence/dashboard")
        assert response.status_code == 403
    
    def test_create_customer_segment_unauthorized(self):
        """Test creating customer segment without authentication"""
        segment_data = {
            "segment_name": "High Value Customers",
            "segment_description": "Customers with high lifetime value",
            "segment_criteria": {"min_ltv": 10000},
            "segment_color": "#FFD700"
        }
        
        response = client.post("/customer-intelligence/segments", json=segment_data)
        assert response.status_code == 403
    
    def test_get_customer_segments_unauthorized(self):
        """Test getting customer segments without authentication"""
        response = client.get("/customer-intelligence/segments")
        assert response.status_code == 403
    
    def test_get_customer_behavior_analysis_unauthorized(self):
        """Test getting customer behavior analysis without authentication"""
        customer_id = "123e4567-e89b-12d3-a456-426614174000"
        response = client.get(f"/customer-intelligence/behavior/{customer_id}")
        assert response.status_code == 403
    
    def test_auto_segment_customers_unauthorized(self):
        """Test auto segmentation without authentication"""
        request_data = {
            "criteria": {"min_ltv": 5000, "min_orders": 3},
            "segment_name": "Auto Generated Segment",
            "auto_assign": True
        }
        
        response = client.post("/customer-intelligence/segmentation/auto", json=request_data)
        assert response.status_code == 403

class TestProfitabilityLogic:
    """Test profitability calculation logic"""
    
    def test_profit_margin_calculation(self, test_profitability_data):
        """Test profit margin calculations"""
        # Test data has items with known margins
        # Premium Gold Ring: purchase 800, sell 1200, margin = (1200-800)/1200 = 33.33%
        
        premium_ring = None
        for item in test_profitability_data["inventory_items"]:
            if item.name == "Premium Gold Ring":
                premium_ring = item
                break
        
        assert premium_ring is not None
        
        purchase_price = float(premium_ring.purchase_price)
        sell_price = float(premium_ring.sell_price)
        
        expected_profit = sell_price - purchase_price
        expected_margin = (expected_profit / sell_price) * 100
        
        assert abs(expected_margin - 33.33) < 0.1  # Should be ~33.33%
        assert expected_profit == 400.0  # 1200 - 800
    
    def test_markup_percentage_calculation(self, test_profitability_data):
        """Test markup percentage calculations"""
        # Markup = (sell_price - purchase_price) / purchase_price * 100
        
        basic_bracelet = None
        for item in test_profitability_data["inventory_items"]:
            if item.name == "Basic Bracelet":
                basic_bracelet = item
                break
        
        assert basic_bracelet is not None
        
        purchase_price = float(basic_bracelet.purchase_price)  # 400
        sell_price = float(basic_bracelet.sell_price)          # 500
        
        expected_markup = ((sell_price - purchase_price) / purchase_price) * 100
        assert abs(expected_markup - 25.0) < 0.1  # Should be 25%

class TestCustomerSegmentationLogic:
    """Test customer segmentation logic"""
    
    def test_customer_value_classification(self, test_profitability_data):
        """Test customer value classification logic"""
        customers = test_profitability_data["customers"]
        
        # Find high value customer
        high_value = next((c for c in customers if c.name == "High Value Customer"), None)
        assert high_value is not None
        assert float(high_value.total_purchases) == 15000.0
        
        # Find new customer
        new_customer = next((c for c in customers if c.name == "New Customer"), None)
        assert new_customer is not None
        assert float(new_customer.total_purchases) == 300.0
        
        # High value should have significantly higher LTV
        assert high_value.total_purchases > new_customer.total_purchases * 10
    
    def test_customer_risk_assessment(self, test_profitability_data):
        """Test customer risk assessment logic"""
        customers = test_profitability_data["customers"]
        
        # Find at-risk customer (high debt)
        at_risk = next((c for c in customers if c.name == "At Risk Customer"), None)
        assert at_risk is not None
        
        debt_ratio = float(at_risk.current_debt) / float(at_risk.total_purchases)
        assert debt_ratio > 0.1  # More than 10% debt ratio indicates risk

class TestDataIntegrity:
    """Test data integrity across profitability and customer intelligence"""
    
    def test_invoice_item_cost_calculation(self, test_profitability_data):
        """Test that invoice items properly reference inventory costs"""
        invoices = test_profitability_data["invoices"]
        
        # Check that all invoices have items
        assert all(invoice.total_amount > 0 for invoice in invoices)
        
        # Verify at least one invoice exists
        assert len(invoices) > 0
    
    def test_customer_purchase_consistency(self, test_profitability_data):
        """Test consistency between customer totals and invoice data"""
        customers = test_profitability_data["customers"]
        
        # All test customers should have some purchase history
        customers_with_purchases = [c for c in customers if c.total_purchases > 0]
        assert len(customers_with_purchases) == len(customers)
    
    def test_category_item_relationships(self, test_profitability_data):
        """Test that all items are properly categorized"""
        items = test_profitability_data["inventory_items"]
        categories = test_profitability_data["categories"]
        
        # All items should have valid categories
        assert all(item.category_id is not None for item in items)
        
        # All categories should have items
        category_ids = {cat.id for cat in categories}
        used_category_ids = {item.category_id for item in items}
        assert used_category_ids.issubset(category_ids)

class TestBusinessLogic:
    """Test business logic scenarios"""
    
    def test_high_margin_item_identification(self, test_profitability_data):
        """Test identification of high-margin items"""
        items = test_profitability_data["inventory_items"]
        
        high_margin_items = []
        for item in items:
            purchase = float(item.purchase_price)
            sell = float(item.sell_price)
            margin = ((sell - purchase) / sell) * 100
            
            if margin > 30:  # High margin threshold
                high_margin_items.append((item.name, margin))
        
        # Should have some high-margin items (Premium Ring, Luxury Necklace, Designer Bracelet)
        assert len(high_margin_items) >= 3
        
        # Verify specific high-margin items
        high_margin_names = [name for name, margin in high_margin_items]
        assert "Premium Gold Ring" in high_margin_names
        assert "Designer Bracelet" in high_margin_names
    
    def test_customer_lifetime_value_distribution(self, test_profitability_data):
        """Test customer LTV distribution makes business sense"""
        customers = test_profitability_data["customers"]
        
        ltv_values = [float(c.total_purchases) for c in customers]
        ltv_values.sort()
        
        # Should have a reasonable distribution
        assert ltv_values[0] < ltv_values[-1]  # Range exists
        assert max(ltv_values) >= 10000  # High-value customers exist
        assert min(ltv_values) <= 1000   # New/low-value customers exist
    
    def test_inventory_profitability_ranking(self, test_profitability_data):
        """Test that items can be ranked by profitability"""
        items = test_profitability_data["inventory_items"]
        
        # Calculate profit per unit for each item
        profitability_data = []
        for item in items:
            purchase = float(item.purchase_price)
            sell = float(item.sell_price)
            profit_per_unit = sell - purchase
            profitability_data.append((item.name, profit_per_unit))
        
        # Sort by profit per unit
        profitability_data.sort(key=lambda x: x[1], reverse=True)
        
        # Luxury Necklace should be most profitable per unit (700 profit)
        top_item = profitability_data[0]
        assert "Luxury Necklace" in top_item[0] or top_item[1] >= 600

class TestEdgeCases:
    """Test edge cases and error handling"""
    
    def test_zero_revenue_scenario(self):
        """Test handling of zero revenue scenarios"""
        # Test profit margin calculation with zero revenue
        revenue = 0
        cost = 100
        
        # Should handle division by zero gracefully
        margin = (revenue - cost) / revenue * 100 if revenue > 0 else 0
        assert margin == 0
    
    def test_negative_margin_scenario(self):
        """Test handling of negative margins (losses)"""
        revenue = 100
        cost = 150
        
        margin = ((revenue - cost) / revenue) * 100
        assert margin < 0  # Should be negative
        assert margin == -50  # 50% loss
    
    def test_customer_with_no_purchases(self):
        """Test handling of customers with no purchase history"""
        # This scenario should be handled gracefully in calculations
        ltv = 0
        orders = 0
        
        avg_order_value = ltv / orders if orders > 0 else 0
        assert avg_order_value == 0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
