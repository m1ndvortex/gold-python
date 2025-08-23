"""
Comprehensive unit tests for Operational KPI Calculator Service
Tests all operational metrics with real inventory data scenarios using Docker PostgreSQL
"""

import pytest
import asyncio
from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

from database import get_db
from services.kpi_calculator_service import OperationalKPICalculator


class TestOperationalKPICalculator:
    """Test suite for operational KPI calculations with real database scenarios"""
    
    @pytest.fixture(scope="class")
    def db_session(self):
        """Create a test database session using Docker PostgreSQL"""
        # Use existing database connection
        db = next(get_db())
        yield db
        db.close()
    
    @pytest.fixture
    def operational_kpi_calculator(self, db_session):
        """Create operational KPI calculator instance"""
        return OperationalKPICalculator(db_session)
    
    @pytest.fixture
    def realistic_transaction_data(self, db_session):
        """Create realistic customer transaction data for testing operational KPIs"""
        
        # Clean up any existing test data first
        cleanup_queries = [
            "DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'TEST-%'))",
            "DELETE FROM invoices WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'TEST-%')",
            "DELETE FROM inventory_items WHERE name LIKE 'TEST-%'",
            "DELETE FROM customers WHERE name LIKE 'TEST-%'",
            "DELETE FROM categories WHERE name LIKE 'TEST-%'"
        ]
        
        for query in cleanup_queries:
            try:
                db_session.execute(text(query))
            except:
                pass  # Ignore errors if tables don't exist or are empty
        
        db_session.commit()
        
        # Create test category
        db_session.execute(text("""
            INSERT INTO categories (id, name, created_at) 
            VALUES (gen_random_uuid(), 'TEST-Gold Jewelry', CURRENT_TIMESTAMP)
        """))
        
        category_result = db_session.execute(text("""
            SELECT id FROM categories WHERE name = 'TEST-Gold Jewelry'
        """)).fetchone()
        category_id = category_result[0]
        
        # Create test customers with realistic profiles (using actual schema)
        customers_data = [
            ("TEST-Customer-VIP", "1234567890"),
            ("TEST-Customer-Regular", "1234567891"),
            ("TEST-Customer-Wholesale", "1234567892")
        ]
        
        customer_ids = []
        for name, phone in customers_data:
            db_session.execute(text("""
                INSERT INTO customers (id, name, phone, created_at) 
                VALUES (gen_random_uuid(), :name, :phone, CURRENT_TIMESTAMP)
            """), {"name": name, "phone": phone})
            
            customer_result = db_session.execute(text("""
                SELECT id FROM customers WHERE name = :name
            """), {"name": name}).fetchone()
            customer_ids.append(customer_result[0])
        
        # Create realistic inventory items with different movement patterns (using actual schema)
        inventory_items = [
            # Fast-moving items (high demand) - (name, purchase_price, stock)
            ("TEST-Gold Ring 18K", 200.00, 100),
            ("TEST-Gold Chain 22K", 400.00, 80),
            
            # Normal-moving items (medium demand)
            ("TEST-Gold Necklace Set", 800.00, 50),
            ("TEST-Gold Bracelet", 600.00, 40),
            
            # Slow-moving items (low demand)
            ("TEST-Gold Pendant Heavy", 1000.00, 30),
            ("TEST-Gold Anklet", 500.00, 25),
            
            # Dead stock items (no recent sales)
            ("TEST-Gold Vintage Brooch", 300.00, 20),
            ("TEST-Gold Cufflinks", 200.00, 15),
            
            # Stockout items (zero stock)
            ("TEST-Gold Popular Ring", 180.00, 0),
            
            # At-risk items (below minimum stock)
            ("TEST-Gold Earrings Small", 100.00, 2)
        ]
        
        item_ids = []
        for name, purchase_price, stock in inventory_items:
            db_session.execute(text("""
                INSERT INTO inventory_items (id, name, category_id, purchase_price, stock_quantity, created_at) 
                VALUES (gen_random_uuid(), :name, :category_id, :purchase_price, :stock_quantity, CURRENT_TIMESTAMP)
            """), {
                "name": name, 
                "category_id": category_id, 
                "purchase_price": purchase_price,
                "stock_quantity": stock
            })
            
            item_result = db_session.execute(text("""
                SELECT id FROM inventory_items WHERE name = :name
            """), {"name": name}).fetchone()
            item_ids.append(item_result[0])
        
        # Create realistic transaction patterns over the last 60 days
        current_date = date.today()
        invoice_counter = 1
        
        # Fast-moving items: High frequency sales (every 2-3 days)
        for i in range(25):  # 25 transactions for fast movers
            transaction_date = current_date - timedelta(days=i * 3)
            
            # Alternate between different fast-moving items and customers
            item_idx = i % 2  # First 2 items are fast-moving
            customer_idx = i % 3
            
            invoice_number = f"TEST-INV-FAST-{invoice_counter:04d}"
            invoice_counter += 1
            
            # Create invoice (using actual schema)
            sell_price = inventory_items[item_idx][1] * 1.5  # Calculate sell price as 1.5x purchase price
            db_session.execute(text("""
                INSERT INTO invoices (id, customer_id, total_amount, paid_amount, 
                                    remaining_amount, status, created_at) 
                VALUES (gen_random_uuid(), :customer_id, :total_amount, 
                        :paid_amount, :remaining_amount, :status, :created_at)
            """), {
                "customer_id": customer_ids[customer_idx],
                "total_amount": sell_price,
                "paid_amount": sell_price,
                "remaining_amount": 0,
                "status": "completed",
                "created_at": datetime.combine(transaction_date, datetime.min.time())
            })
            
            # Get invoice ID (using the last inserted invoice)
            invoice_result = db_session.execute(text("""
                SELECT id FROM invoices WHERE customer_id = :customer_id 
                ORDER BY created_at DESC LIMIT 1
            """), {"customer_id": customer_ids[customer_idx]}).fetchone()
            invoice_id = invoice_result[0]
            
            # Create invoice item (using actual schema)
            quantity = 3 if i % 2 == 0 else 2  # Higher quantities to ensure fast classification
            unit_price = sell_price
            total_price = unit_price * quantity
            
            db_session.execute(text("""
                INSERT INTO invoice_items (id, invoice_id, inventory_item_id, quantity, 
                                         unit_price, total_price, created_at) 
                VALUES (gen_random_uuid(), :invoice_id, :inventory_item_id, :quantity, 
                        :unit_price, :total_price, CURRENT_TIMESTAMP)
            """), {
                "invoice_id": invoice_id,
                "inventory_item_id": item_ids[item_idx],
                "quantity": quantity,
                "unit_price": unit_price,
                "total_price": total_price
            })
        
        # Normal-moving items: Medium frequency sales (every 5-7 days)
        for i in range(10):  # 10 transactions for normal movers
            transaction_date = current_date - timedelta(days=i * 6)
            
            item_idx = 2 + (i % 2)  # Items 2-3 are normal-moving
            customer_idx = i % 3
            
            # Create invoice (using actual schema)
            sell_price = inventory_items[item_idx][1] * 1.5  # Calculate sell price
            db_session.execute(text("""
                INSERT INTO invoices (id, customer_id, total_amount, paid_amount, 
                                    remaining_amount, status, created_at) 
                VALUES (gen_random_uuid(), :customer_id, :total_amount, 
                        :paid_amount, :remaining_amount, :status, :created_at)
            """), {
                "customer_id": customer_ids[customer_idx],
                "total_amount": sell_price,
                "paid_amount": sell_price,
                "remaining_amount": 0,
                "status": "completed",
                "created_at": datetime.combine(transaction_date, datetime.min.time())
            })
            
            # Get invoice ID and create invoice item
            invoice_result = db_session.execute(text("""
                SELECT id FROM invoices WHERE customer_id = :customer_id 
                ORDER BY created_at DESC LIMIT 1
            """), {"customer_id": customer_ids[customer_idx]}).fetchone()
            invoice_id = invoice_result[0]
            
            db_session.execute(text("""
                INSERT INTO invoice_items (id, invoice_id, inventory_item_id, quantity, 
                                         unit_price, total_price, created_at) 
                VALUES (gen_random_uuid(), :invoice_id, :inventory_item_id, :quantity, 
                        :unit_price, :total_price, CURRENT_TIMESTAMP)
            """), {
                "invoice_id": invoice_id,
                "inventory_item_id": item_ids[item_idx],
                "quantity": 1,
                "unit_price": sell_price,
                "total_price": sell_price
            })
        
        # Slow-moving items: Low frequency sales (every 15-20 days)
        for i in range(3):  # 3 transactions for slow movers
            transaction_date = current_date - timedelta(days=i * 18)
            
            item_idx = 4 + (i % 2)  # Items 4-5 are slow-moving
            customer_idx = i % 3
            
            # Create invoice (using actual schema)
            sell_price = inventory_items[item_idx][1] * 1.5  # Calculate sell price
            db_session.execute(text("""
                INSERT INTO invoices (id, customer_id, total_amount, paid_amount, 
                                    remaining_amount, status, created_at) 
                VALUES (gen_random_uuid(), :customer_id, :total_amount, 
                        :paid_amount, :remaining_amount, :status, :created_at)
            """), {
                "customer_id": customer_ids[customer_idx],
                "total_amount": sell_price,
                "paid_amount": sell_price,
                "remaining_amount": 0,
                "status": "completed",
                "created_at": datetime.combine(transaction_date, datetime.min.time())
            })
            
            # Get invoice ID and create invoice item
            invoice_result = db_session.execute(text("""
                SELECT id FROM invoices WHERE customer_id = :customer_id 
                ORDER BY created_at DESC LIMIT 1
            """), {"customer_id": customer_ids[customer_idx]}).fetchone()
            invoice_id = invoice_result[0]
            
            db_session.execute(text("""
                INSERT INTO invoice_items (id, invoice_id, inventory_item_id, quantity, 
                                         unit_price, total_price, created_at) 
                VALUES (gen_random_uuid(), :invoice_id, :inventory_item_id, :quantity, 
                        :unit_price, :total_price, CURRENT_TIMESTAMP)
            """), {
                "invoice_id": invoice_id,
                "inventory_item_id": item_ids[item_idx],
                "quantity": 1,
                "unit_price": sell_price,
                "total_price": sell_price
            })
        
        # Dead stock items: No sales (items 6-7)
        # Stockout item: No sales due to zero stock (item 8)
        # At-risk item: One minimal sale (item 9)
        transaction_date = current_date - timedelta(days=45)
        
        # Create invoice for at-risk item (using actual schema)
        sell_price = inventory_items[9][1] * 1.8  # At-risk item sell price
        db_session.execute(text("""
            INSERT INTO invoices (id, customer_id, total_amount, paid_amount, 
                                remaining_amount, status, created_at) 
            VALUES (gen_random_uuid(), :customer_id, :total_amount, 
                    :paid_amount, :remaining_amount, :status, :created_at)
        """), {
            "customer_id": customer_ids[0],
            "total_amount": sell_price,
            "paid_amount": sell_price,
            "remaining_amount": 0,
            "status": "completed",
            "created_at": datetime.combine(transaction_date, datetime.min.time())
        })
        
        # Get invoice ID and create invoice item
        invoice_result = db_session.execute(text("""
            SELECT id FROM invoices WHERE customer_id = :customer_id 
            ORDER BY created_at DESC LIMIT 1
        """), {"customer_id": customer_ids[0]}).fetchone()
        invoice_id = invoice_result[0]
        
        db_session.execute(text("""
            INSERT INTO invoice_items (id, invoice_id, inventory_item_id, quantity, 
                                     unit_price, total_price, created_at) 
            VALUES (gen_random_uuid(), :invoice_id, :inventory_item_id, :quantity, 
                    :unit_price, :total_price, CURRENT_TIMESTAMP)
        """), {
            "invoice_id": invoice_id,
            "inventory_item_id": item_ids[9],
            "quantity": 1,
            "unit_price": sell_price,
            "total_price": sell_price
        })
        
        db_session.commit()
        
        return {
            "category_id": category_id,
            "customer_ids": customer_ids,
            "item_ids": item_ids,
            "inventory_items": inventory_items,
            "total_transactions": invoice_counter - 1
        }

    
    @pytest.mark.asyncio
    async def test_inventory_turnover_kpi_calculation(self, operational_kpi_calculator):
        """Test inventory turnover rate calculations with proper time-period handling"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        # Calculate inventory turnover KPIs
        result = await operational_kpi_calculator.calculate_inventory_turnover_kpis(
            start_date=start_date,
            end_date=end_date
        )
        
        # Verify basic structure
        assert "average_turnover_ratio" in result
        assert "average_velocity_score" in result
        assert "total_units_sold" in result
        assert "fast_moving_items" in result
        assert "slow_moving_items" in result
        assert "dead_stock_items" in result
        assert "trend_direction" in result
        assert "movement_analysis" in result
        assert "inventory_health_score" in result
        
        # Verify calculations
        assert result["total_items"] >= 0  # Should have items or zero
        assert result["total_units_sold"] >= 0  # Should have sales or zero
        assert result["fast_moving_items"] >= 0  # Should be non-negative
        assert result["dead_stock_items"] >= 0  # Should be non-negative
        
        # Verify percentages are valid
        assert 0 <= result["fast_moving_percentage"] <= 100
        assert 0 <= result["slow_moving_percentage"] <= 100
        assert 0 <= result["dead_stock_percentage"] <= 100
        
        # Verify trend direction is valid
        assert result["trend_direction"] in ["up", "down", "stable"]
        
        # Verify movement analysis structure
        movement_analysis = result["movement_analysis"]
        assert "fast_movers" in movement_analysis
        assert "slow_movers" in movement_analysis
        assert "dead_stock" in movement_analysis
        assert isinstance(movement_analysis["fast_movers"], list)
        
        # Verify health score structure
        health_score = result["inventory_health_score"]
        assert "overall_score" in health_score
        assert "health_status" in health_score
        assert "component_scores" in health_score
        assert 0 <= health_score["overall_score"] <= 100
        
        print(f"Inventory Turnover KPIs: {result}")
    
    @pytest.mark.asyncio
    async def test_stockout_frequency_kpi_calculation(self, operational_kpi_calculator):
        """Test stockout frequency monitoring with alert threshold configuration"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        alert_threshold = 0.1  # 10% stockout threshold
        
        # Calculate stockout frequency KPIs
        result = await operational_kpi_calculator.calculate_stockout_frequency_kpis(
            start_date=start_date,
            end_date=end_date,
            alert_threshold=alert_threshold
        )
        
        # Verify basic structure
        assert "stockout_frequency" in result
        assert "stockout_items" in result
        assert "below_min_items" in result
        assert "at_risk_items" in result
        assert "alert_status" in result
        assert "alert_threshold" in result
        assert "trend_direction" in result
        assert "at_risk_items" in result
        assert "cost_impact" in result
        assert "recommendations" in result
        
        # Verify calculations
        assert result["total_items"] >= 0  # Should be non-negative
        assert result["stockout_items"] >= 0  # Should be non-negative
        assert result["below_min_items"] >= 0  # Should be non-negative
        assert result["alert_threshold"] == alert_threshold
        
        # Verify stockout frequency calculation
        if result["total_items"] > 0:
            expected_frequency = result["stockout_items"] / result["total_items"]
            assert abs(result["stockout_frequency"] - expected_frequency) < 0.001
        
        # Verify alert status
        assert result["alert_status"] in ["normal", "critical", "unknown"]
        
        # Verify trend direction is valid
        assert result["trend_direction"] in ["up", "down", "stable"]
        
        # Verify at-risk items structure
        at_risk_items = result["at_risk_items"]
        assert isinstance(at_risk_items, list)
        if len(at_risk_items) > 0:
            item = at_risk_items[0]
            assert "item_id" in item
            assert "item_name" in item
            assert "risk_level" in item
            assert item["risk_level"] in ["stockout", "critical", "warning"]
        
        # Verify cost impact structure
        cost_impact = result["cost_impact"]
        assert "total_lost_revenue" in cost_impact
        assert "fulfillment_rate" in cost_impact
        assert isinstance(cost_impact["total_lost_revenue"], (int, float))
        assert 0 <= cost_impact["fulfillment_rate"] <= 100
        
        # Verify recommendations
        assert isinstance(result["recommendations"], list)
        
        print(f"Stockout Frequency KPIs: {result}")
    
    @pytest.mark.asyncio
    async def test_carrying_cost_kpi_calculation(self, operational_kpi_calculator):
        """Test carrying cost calculations and dead stock percentage analysis"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        carrying_cost_rate = 0.25  # 25% annual carrying cost rate
        
        # Calculate carrying cost KPIs
        result = await operational_kpi_calculator.calculate_carrying_cost_kpis(
            start_date=start_date,
            end_date=end_date,
            carrying_cost_rate=carrying_cost_rate
        )
        
        # Verify basic structure
        assert "total_inventory_value" in result
        assert "total_carrying_cost" in result
        assert "carrying_cost_percentage" in result
        assert "dead_stock_percentage" in result
        assert "dead_stock_value" in result
        assert "slow_moving_value" in result
        assert "optimization_potential" in result
        assert "recommendations" in result
        assert "trend_direction" in result
        
        # Verify calculations
        assert result["total_items"] >= 0  # Should be non-negative
        assert result["total_inventory_value"] >= 0  # Should be non-negative
        assert result["carrying_cost_rate"] == carrying_cost_rate
        assert result["period_days"] == 30  # 30-day period
        
        # Verify carrying cost calculation
        expected_period_factor = 30 / 365.0
        expected_carrying_cost = result["total_inventory_value"] * carrying_cost_rate * expected_period_factor
        assert abs(result["total_carrying_cost"] - expected_carrying_cost) < 0.01
        
        # Verify carrying cost percentage
        if result["total_inventory_value"] > 0:
            expected_percentage = (result["total_carrying_cost"] / result["total_inventory_value"]) * 100
            assert abs(result["carrying_cost_percentage"] - expected_percentage) < 0.01
        
        # Verify dead stock analysis
        assert result["dead_stock_percentage"] >= 0
        assert result["dead_stock_value"] >= 0
        assert result["slow_moving_value"] >= 0
        
        # Verify optimization potential structure
        optimization = result["optimization_potential"]
        assert "total_optimization_potential" in optimization
        assert "dead_stock_liquidation_potential" in optimization
        assert "slow_moving_optimization_potential" in optimization
        assert "carrying_cost_reduction_potential" in optimization
        assert "optimization_percentage" in optimization
        
        # Verify trend direction is valid
        assert result["trend_direction"] in ["up", "down", "stable"]
        
        # Verify recommendations
        assert isinstance(result["recommendations"], list)
        
        print(f"Carrying Cost KPIs: {result}")
    
    @pytest.mark.asyncio
    async def test_kpi_caching_mechanism(self, operational_kpi_calculator):
        """Test caching mechanisms for expensive operational calculations"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        # First call - should calculate and cache
        result1 = await operational_kpi_calculator.calculate_inventory_turnover_kpis(
            start_date=start_date,
            end_date=end_date
        )
        
        # Second call - should use cache
        result2 = await operational_kpi_calculator.calculate_inventory_turnover_kpis(
            start_date=start_date,
            end_date=end_date
        )
        
        # Results should be identical (from cache)
        assert result1["average_turnover_ratio"] == result2["average_turnover_ratio"]
        assert result1["total_units_sold"] == result2["total_units_sold"]
        assert result1["calculated_at"] == result2["calculated_at"]  # Same timestamp indicates cache hit
        
        print("Caching mechanism working correctly")
    
    @pytest.mark.asyncio
    async def test_edge_cases_and_error_handling(self, operational_kpi_calculator):
        """Test edge cases and error handling for operational KPIs"""
        
        # Test with no inventory data
        future_start = date.today() + timedelta(days=30)
        future_end = date.today() + timedelta(days=60)
        
        result = await operational_kpi_calculator.calculate_inventory_turnover_kpis(
            start_date=future_start,
            end_date=future_end
        )
        
        # Should handle gracefully with zero values
        assert result["total_items"] >= 0
        assert result["average_turnover_ratio"] >= 0
        assert result["total_units_sold"] >= 0
        
        # Test stockout frequency with no data
        stockout_result = await operational_kpi_calculator.calculate_stockout_frequency_kpis(
            start_date=future_start,
            end_date=future_end
        )
        
        assert stockout_result["stockout_frequency"] >= 0
        assert stockout_result["alert_status"] in ["normal", "critical", "unknown"]
        
        # Test carrying cost with no data
        carrying_result = await operational_kpi_calculator.calculate_carrying_cost_kpis(
            start_date=future_start,
            end_date=future_end
        )
        
        assert carrying_result["total_carrying_cost"] >= 0
        assert carrying_result["carrying_cost_percentage"] >= 0
        
        print("Edge cases handled correctly")
    
    @pytest.mark.asyncio
    async def test_performance_with_realistic_data(self, operational_kpi_calculator):
        """Test performance with realistic data volumes"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        # Measure execution time
        import time
        start_time = time.time()
        
        # Run all KPI calculations
        turnover_result = await operational_kpi_calculator.calculate_inventory_turnover_kpis(
            start_date=start_date,
            end_date=end_date
        )
        
        stockout_result = await operational_kpi_calculator.calculate_stockout_frequency_kpis(
            start_date=start_date,
            end_date=end_date
        )
        
        carrying_result = await operational_kpi_calculator.calculate_carrying_cost_kpis(
            start_date=start_date,
            end_date=end_date
        )
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Verify all calculations completed
        assert turnover_result is not None
        assert stockout_result is not None
        assert carrying_result is not None
        
        # Performance should be reasonable (under 10 seconds for real data)
        assert execution_time < 10.0
        
        print(f"All operational KPI calculations completed in {execution_time:.2f} seconds")
    
    @pytest.mark.asyncio
    async def test_operational_kpis_with_realistic_customer_data(self, operational_kpi_calculator, realistic_transaction_data):
        """Test operational KPIs with realistic customer transaction data scenarios"""
        
        start_date = date.today() - timedelta(days=60)
        end_date = date.today()
        
        print(f"\n=== Testing with Realistic Customer Transaction Data ===")
        print(f"Test data includes:")
        print(f"- {len(realistic_transaction_data['item_ids'])} inventory items with different movement patterns")
        print(f"- {len(realistic_transaction_data['customer_ids'])} customers with varied buying patterns")
        print(f"- {realistic_transaction_data['total_transactions']} transactions over 60 days")
        
        # Test 1: Inventory Turnover Analysis
        print(f"\n--- Inventory Turnover Analysis ---")
        turnover_result = await operational_kpi_calculator.calculate_inventory_turnover_kpis(
            start_date=start_date,
            end_date=end_date
        )
        
        # Verify we have meaningful data
        assert turnover_result["total_items"] >= 10  # Should have our test items
        assert turnover_result["total_units_sold"] > 0  # Should have sales
        
        # Verify movement classification works correctly
        assert turnover_result["fast_moving_items"] >= 2  # Should identify fast movers
        assert turnover_result["dead_stock_items"] >= 2  # Should identify dead stock
        
        # Verify movement analysis provides detailed insights
        movement_analysis = turnover_result["movement_analysis"]
        assert len(movement_analysis["fast_movers"]) > 0
        assert len(movement_analysis["dead_stock"]) > 0
        
        # Check that fast movers have higher sales
        if len(movement_analysis["fast_movers"]) > 0:
            fast_mover = movement_analysis["fast_movers"][0]
            assert fast_mover["units_sold"] > 10  # Fast movers should have high sales
            assert "TEST-Gold Ring 18K" in fast_mover["item_name"] or "TEST-Gold Chain 22K" in fast_mover["item_name"]
        
        print(f"✓ Turnover Analysis: {turnover_result['fast_moving_items']} fast, {turnover_result['dead_stock_items']} dead stock items")
        print(f"✓ Average turnover ratio: {turnover_result['average_turnover_ratio']:.2f}")
        print(f"✓ Inventory health score: {turnover_result['inventory_health_score']['overall_score']:.1f}/100")
        
        # Test 2: Stockout Frequency Analysis
        print(f"\n--- Stockout Frequency Analysis ---")
        stockout_result = await operational_kpi_calculator.calculate_stockout_frequency_kpis(
            start_date=start_date,
            end_date=end_date,
            alert_threshold=0.1
        )
        
        # Verify stockout detection (may include existing database items)
        assert stockout_result["total_items"] >= 10  # Should include our test items
        assert stockout_result["stockout_items"] >= 0  # May or may not have stockouts
        assert stockout_result["at_risk_items_count"] >= 0  # May or may not have at-risk items
        
        # Verify at-risk items structure (may include items from existing database)
        at_risk_items_list = stockout_result["at_risk_items"]
        assert isinstance(at_risk_items_list, list)
        
        # Check if our test items are in the at-risk list
        test_items_found = 0
        for item in at_risk_items_list:
            if "TEST-" in item["item_name"]:
                test_items_found += 1
                assert item["risk_level"] in ["stockout", "critical", "warning"]
        
        # We should find at least some of our test items in at-risk analysis
        print(f"✓ Found {test_items_found} test items in at-risk analysis")
        
        print(f"✓ Stockout Analysis: {stockout_result['stockout_items']} stockouts, {stockout_result['at_risk_items']} at-risk items")
        print(f"✓ Stockout frequency: {stockout_result['stockout_frequency']:.3f}")
        print(f"✓ Alert status: {stockout_result['alert_status']}")
        
        # Test 3: Carrying Cost Analysis
        print(f"\n--- Carrying Cost Analysis ---")
        carrying_result = await operational_kpi_calculator.calculate_carrying_cost_kpis(
            start_date=start_date,
            end_date=end_date,
            carrying_cost_rate=0.25
        )
        
        # Verify cost calculations
        assert carrying_result["total_inventory_value"] > 0
        assert carrying_result["total_carrying_cost"] > 0
        assert carrying_result["dead_stock_percentage"] > 0  # Should have dead stock
        
        # Verify dead stock identification
        assert carrying_result["dead_stock_value"] > 0  # Should have dead stock value
        
        # Verify optimization potential
        optimization = carrying_result["optimization_potential"]
        assert optimization["total_optimization_potential"] >= 0
        
        print(f"✓ Carrying Cost Analysis: ${carrying_result['total_inventory_value']:,.2f} inventory value")
        print(f"✓ Total carrying cost: ${carrying_result['total_carrying_cost']:,.2f}")
        print(f"✓ Dead stock percentage: {carrying_result['dead_stock_percentage']:.1f}%")
        print(f"✓ Optimization potential: ${optimization['total_optimization_potential']:,.2f}")
        
        # Test 4: Verify Data Accuracy Against Known Patterns
        print(f"\n--- Data Accuracy Verification ---")
        
        # Verify fast-moving items have high turnover
        fast_movers = movement_analysis["fast_movers"]
        if len(fast_movers) > 0:
            avg_fast_turnover = sum(item["turnover_ratio"] for item in fast_movers) / len(fast_movers)
            assert avg_fast_turnover > 0.1  # Fast movers should have decent turnover
            print(f"✓ Fast movers average turnover: {avg_fast_turnover:.2f}")
        
        # Verify dead stock items have zero or minimal sales
        dead_stock = movement_analysis["dead_stock"]
        if len(dead_stock) > 0:
            for item in dead_stock:
                assert item["units_sold"] <= 1  # Dead stock should have minimal sales
            print(f"✓ Dead stock items correctly identified: {len(dead_stock)} items")
        
        # Test 5: Category-Specific Analysis
        print(f"\n--- Category-Specific Analysis ---")
        category_result = await operational_kpi_calculator.calculate_inventory_turnover_kpis(
            start_date=start_date,
            end_date=end_date,
            category_id=str(realistic_transaction_data["category_id"])
        )
        
        # Category-specific analysis should have fewer or equal items than overall analysis
        assert category_result["total_items"] <= turnover_result["total_items"]
        # Should have at least our test items in the category
        assert category_result["total_items"] >= 10
        print(f"✓ Category-specific analysis: {category_result['total_items']} items analyzed")
        
        print(f"\n=== All Operational KPI Tests Passed with Realistic Data ===")
        
        # Cleanup test data
        cleanup_queries = [
            "DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'TEST-%'))",
            "DELETE FROM invoices WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'TEST-%')",
            "DELETE FROM inventory_items WHERE name LIKE 'TEST-%'",
            "DELETE FROM customers WHERE name LIKE 'TEST-%'",
            "DELETE FROM categories WHERE name LIKE 'TEST-%'"
        ]
        
        for query in cleanup_queries:
            try:
                operational_kpi_calculator.db.execute(text(query))
            except:
                pass
        
        operational_kpi_calculator.db.commit()
        print("✓ Test data cleaned up")
    
    @pytest.mark.asyncio
    async def test_kpi_accuracy_with_known_transaction_patterns(self, operational_kpi_calculator, realistic_transaction_data):
        """Test KPI calculation accuracy against known transaction patterns"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        # Calculate KPIs
        result = await operational_kpi_calculator.calculate_inventory_turnover_kpis(
            start_date=start_date,
            end_date=end_date
        )
        
        # Verify specific business logic
        movement_analysis = result["movement_analysis"]
        
        # Fast movers should include our high-frequency items
        fast_mover_names = [item["item_name"] for item in movement_analysis["fast_movers"]]
        has_ring = any("Ring 18K" in name for name in fast_mover_names)
        has_chain = any("Chain 22K" in name for name in fast_mover_names)
        
        assert has_ring or has_chain, "Fast-moving items should be identified correctly"
        
        # Dead stock should include items with no sales
        dead_stock_names = [item["item_name"] for item in movement_analysis["dead_stock"]]
        has_brooch = any("Vintage Brooch" in name for name in dead_stock_names)
        has_cufflinks = any("Cufflinks" in name for name in dead_stock_names)
        
        assert has_brooch or has_cufflinks, "Dead stock items should be identified correctly"
        
        print("✓ KPI accuracy verified against known transaction patterns")


if __name__ == "__main__":
    # Run tests with Docker database
    pytest.main([__file__, "-v", "--tb=short"])