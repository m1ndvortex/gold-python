"""
Integration Tests for Analytics Background Tasks

Real integration tests that use actual database, services, and minimal mocking.
These tests verify the complete functionality in a production-like environment.

Requirements covered: 1.4, 3.4, 4.4
"""

import pytest
import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

# Import the actual tasks
from analytics_tasks.kpi_tasks import (
    calculate_financial_kpis_task,
    cleanup_expired_cache
)
from analytics_tasks.forecasting_tasks import (
    generate_demand_forecast_task
)

# Import models and database
from database import get_db, SessionLocal
from models import (
    InventoryItem, Customer, Invoice, InvoiceItem, Category,
    KPISnapshot, DemandForecast, CustomReport
)

class TestKPITasksIntegration:
    """Integration tests for KPI background tasks using real database"""
    
    @pytest.fixture(scope="function")
    def db_session(self):
        """Create a real database session for testing"""
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    @pytest.fixture(scope="function")
    def test_data(self, db_session):
        """Create test data in the database using actual schema"""
        # Create test category using raw SQL to match actual schema
        category_id = db_session.execute(text("""
            INSERT INTO categories (name) 
            VALUES ('Test Jewelry') 
            RETURNING id
        """)).scalar()
        
        # Create test customer using raw SQL
        customer_id = db_session.execute(text("""
            INSERT INTO customers (name, phone) 
            VALUES ('Test Customer', '1234567890') 
            RETURNING id
        """)).scalar()
        
        # Create test inventory item using raw SQL
        item_id = db_session.execute(text("""
            INSERT INTO inventory_items (name, category_id, stock_quantity, purchase_price) 
            VALUES ('Test Gold Ring', :category_id, 10, 100.00) 
            RETURNING id
        """), {"category_id": category_id}).scalar()
        
        db_session.commit()
        
        return {
            "category_id": category_id,
            "customer_id": customer_id,
            "item_id": item_id
        }
    
    def test_calculate_financial_kpis_task_with_real_data(self, test_data):
        """Test financial KPI calculation with real database data"""
        
        # Calculate KPIs for the period containing our test data
        start_date = date.today() - timedelta(days=1)
        end_date = date.today()
        
        # Execute the actual task
        result = calculate_financial_kpis_task(
            start_date.isoformat(),
            end_date.isoformat()
        )
        
        # Verify the result structure
        assert result["status"] == "completed"
        assert "revenue_kpis" in result
        assert "profit_kpis" in result
        assert result["period_start"] == start_date.isoformat()
        assert result["period_end"] == end_date.isoformat()
        
        # Verify that revenue KPIs contain expected data
        revenue_kpis = result["revenue_kpis"]
        assert "current_revenue" in revenue_kpis
        assert "growth_rate" in revenue_kpis
        assert "trend_direction" in revenue_kpis
        
        # Verify that profit KPIs contain expected data
        profit_kpis = result["profit_kpis"]
        assert "gross_margin" in profit_kpis
        assert "net_margin" in profit_kpis
        
        print(f"✅ Financial KPI calculation completed successfully")
        print(f"   Current Revenue: {revenue_kpis.get('current_revenue', 0)}")
        print(f"   Gross Margin: {profit_kpis.get('gross_margin', 0)}%")
    
    def test_cleanup_expired_cache_task(self):
        """Test cache cleanup task with real Redis connection"""
        
        # Execute the cache cleanup task
        result = cleanup_expired_cache()
        
        # Verify the result structure
        assert result["status"] == "completed"
        assert "cache_stats" in result
        
        # Verify cache stats contain expected fields
        cache_stats = result["cache_stats"]
        assert "status" in cache_stats
        
        print(f"✅ Cache cleanup completed successfully")
        print(f"   Cache Status: {cache_stats.get('status', 'unknown')}")
        print(f"   Analytics Keys: {cache_stats.get('analytics_keys', 0)}")

class TestForecastingTasksIntegration:
    """Integration tests for forecasting background tasks"""
    
    @pytest.fixture(scope="function")
    def db_session(self):
        """Create a real database session for testing"""
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    @pytest.fixture(scope="function")
    def forecasting_test_data(self, db_session):
        """Create test data with historical sales for forecasting using actual schema"""
        # Create test category
        category_id = db_session.execute(text("""
            INSERT INTO categories (name) 
            VALUES ('Forecasting Test Category') 
            RETURNING id
        """)).scalar()
        
        # Create test customer
        customer_id = db_session.execute(text("""
            INSERT INTO customers (name, phone) 
            VALUES ('Forecasting Test Customer', '9876543210') 
            RETURNING id
        """)).scalar()
        
        # Create test inventory item
        item_id = db_session.execute(text("""
            INSERT INTO inventory_items (name, category_id, stock_quantity, purchase_price) 
            VALUES ('Forecasting Test Item', :category_id, 20, 80.00) 
            RETURNING id
        """), {"category_id": category_id}).scalar()
        
        # Create historical sales data (need at least 10 data points for forecasting)
        for i in range(15):
            # Create invoice
            invoice_id = db_session.execute(text("""
                INSERT INTO invoices (customer_id, total_amount, status, created_at) 
                VALUES (:customer_id, 100.00, 'completed', :created_at) 
                RETURNING id
            """), {
                "customer_id": customer_id,
                "created_at": datetime.now() - timedelta(days=30-i*2)  # Spread over 30 days
            }).scalar()
            
            # Create invoice item
            db_session.execute(text("""
                INSERT INTO invoice_items (invoice_id, inventory_item_id, quantity, unit_price, total_price) 
                VALUES (:invoice_id, :item_id, :quantity, 80.00, :total_price)
            """), {
                "invoice_id": invoice_id,
                "item_id": item_id,
                "quantity": 1 + (i % 3),  # Vary quantity between 1-3
                "total_price": 80.00 * (1 + (i % 3))
            })
        
        db_session.commit()
        
        return {
            "category_id": category_id,
            "customer_id": customer_id,
            "item_id": item_id
        }
    
    def test_generate_demand_forecast_with_real_data(self, forecasting_test_data):
        """Test demand forecasting with real historical data"""
        
        item_id = str(forecasting_test_data["item_id"])
        
        # Execute the forecasting task
        result = generate_demand_forecast_task(
            item_id=item_id,
            periods=7,  # 7-day forecast
            model_type="linear_regression"  # Use simpler model for testing
        )
        
        # Verify the result structure
        assert result["status"] == "completed"
        assert result["item_id"] == item_id
        assert result["model_type"] == "linear_regression"
        assert result["periods"] == 7
        assert result["predictions_count"] > 0
        assert "confidence_score" in result
        assert "accuracy_metrics" in result
        
        print(f"✅ Demand forecast generated successfully")
        print(f"   Item ID: {item_id}")
        print(f"   Predictions: {result['predictions_count']}")
        print(f"   Confidence Score: {result['confidence_score']}")
        print(f"   Model Used: {result['model_type']}")

class TestDatabaseIntegration:
    """Test database operations and model relationships"""
    
    @pytest.fixture(scope="function")
    def db_session(self):
        """Create a real database session for testing"""
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    def test_kpi_snapshot_creation(self, db_session):
        """Test creating KPI snapshots in the database"""
        
        # Create a test KPI snapshot using raw SQL to match actual schema
        result = db_session.execute(text("""
            INSERT INTO analytics.kpi_snapshots 
            (kpi_type, kpi_name, value, period_start, period_end, metadata) 
            VALUES (:kpi_type, :kpi_name, :value, :period_start, :period_end, :metadata)
            RETURNING id, kpi_type, kpi_name, value, metadata
        """), {
            "kpi_type": "financial",
            "kpi_name": "test_revenue",
            "value": Decimal("1000.00"),
            "period_start": datetime.now() - timedelta(days=1),
            "period_end": datetime.now(),
            "metadata": '{"source": "integration_test"}'
        })
        
        snapshot_data = result.fetchone()
        db_session.commit()
        
        # Verify the snapshot was created
        assert snapshot_data is not None
        assert snapshot_data.kpi_type == "financial"
        assert snapshot_data.kpi_name == "test_revenue"
        assert snapshot_data.value == Decimal("1000.00")
        
        print(f"✅ KPI Snapshot created successfully")
        print(f"   ID: {snapshot_data.id}")
        print(f"   Type: {snapshot_data.kpi_type}")
        print(f"   Value: {snapshot_data.value}")
    
    def test_demand_forecast_creation(self, db_session):
        """Test creating demand forecasts in the database"""
        
        # First create a test category using raw SQL to match actual schema
        category_id = db_session.execute(text("""
            INSERT INTO categories (name) 
            VALUES ('Test Category for Forecast') 
            RETURNING id
        """)).scalar()
        
        # Create a test inventory item using raw SQL
        item_id = db_session.execute(text("""
            INSERT INTO inventory_items (name, category_id, stock_quantity, purchase_price) 
            VALUES ('Test Item for Forecast', :category_id, 15, 50.00) 
            RETURNING id
        """), {"category_id": category_id}).scalar()
        
        # Create a demand forecast using raw SQL to match actual schema
        forecast_result = db_session.execute(text("""
            INSERT INTO demand_forecasting 
            (id, item_id, forecast_period_start, forecast_period_end, forecast_type, 
             predicted_demand, confidence_interval_lower, confidence_interval_upper, 
             forecast_accuracy, forecast_method) 
            VALUES (gen_random_uuid(), :item_id, :period_start, :period_end, :forecast_type,
                    :predicted_demand, :confidence_lower, :confidence_upper, 
                    :forecast_accuracy, :forecast_method)
            RETURNING item_id, predicted_demand, forecast_method, forecast_accuracy
        """), {
            "item_id": item_id,
            "period_start": date.today() + timedelta(days=1),
            "period_end": date.today() + timedelta(days=7),
            "forecast_type": "demand",
            "predicted_demand": Decimal("5.5"),
            "confidence_lower": Decimal("3.0"),
            "confidence_upper": Decimal("8.0"),
            "forecast_accuracy": Decimal("0.85"),
            "forecast_method": "test_model"
        })
        
        forecast_data = forecast_result.fetchone()
        db_session.commit()
        
        # Verify the forecast was created
        assert forecast_data is not None
        assert forecast_data.predicted_demand == Decimal("5.5")
        assert forecast_data.forecast_method == "test_model"
        assert forecast_data.forecast_accuracy == Decimal("0.85")
        
        print(f"✅ Demand Forecast created successfully")
        print(f"   Item ID: {forecast_data.item_id}")
        print(f"   Predicted Demand: {forecast_data.predicted_demand}")
        print(f"   Forecast Accuracy: {forecast_data.forecast_accuracy}")

class TestServiceIntegration:
    """Test integration with existing services"""
    
    def test_kpi_calculator_service_integration(self):
        """Test that KPI calculator service works with background tasks"""
        
        # This test verifies that the services used by background tasks
        # are properly integrated and functional
        
        from services.kpi_calculator_service import FinancialKPICalculator
        
        with SessionLocal() as db:
            calculator = FinancialKPICalculator(db)
            
            # Test that the calculator can be instantiated
            assert calculator is not None
            assert calculator.db is not None
            
            print(f"✅ KPI Calculator Service integration verified")
    
    def test_forecasting_service_integration(self):
        """Test that forecasting service works with background tasks"""
        
        from services.forecasting_service import ForecastingService
        
        with SessionLocal() as db:
            forecasting_service = ForecastingService(db)
            
            # Test that the service can be instantiated
            assert forecasting_service is not None
            assert forecasting_service.db is not None
            
            print(f"✅ Forecasting Service integration verified")

class TestErrorHandlingIntegration:
    """Test error handling in real scenarios"""
    
    def test_task_with_invalid_data(self):
        """Test task behavior with invalid input data"""
        
        # Test with invalid date format
        try:
            result = calculate_financial_kpis_task(
                "invalid-date",
                "2024-01-31"
            )
            # Should not reach here
            assert False, "Expected task to raise an exception"
        except Exception as e:
            # Verify that the task properly handles the error
            assert "does not match format" in str(e) or "Invalid isoformat" in str(e)
            print(f"✅ Invalid date handling verified: {str(e)[:100]}...")
    
    def test_task_with_nonexistent_item(self):
        """Test forecasting task with non-existent item"""
        
        fake_item_id = "00000000-0000-0000-0000-000000000000"
        
        try:
            result = generate_demand_forecast_task(
                item_id=fake_item_id,
                periods=7,
                model_type="linear_regression"
            )
            # Should not reach here or should handle gracefully
            if result.get("status") == "completed":
                # If it completes, it should indicate no data
                assert result.get("predictions_count", 0) == 0
        except Exception as e:
            # Verify that the error is handled appropriately
            assert "Insufficient historical data" in str(e) or "not found" in str(e)
            print(f"✅ Non-existent item handling verified: {str(e)[:100]}...")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])