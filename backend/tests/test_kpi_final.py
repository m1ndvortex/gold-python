"""
Final comprehensive test for KPI Calculator Service using real PostgreSQL data
This test uses raw SQL to ensure compatibility with the actual database schema
"""

import pytest
import asyncio
from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy import text

from services.kpi_calculator_service import KPICalculatorService, FinancialKPICalculator


@pytest.mark.asyncio
async def test_kpi_calculator_with_real_data(db_session):
    """Test KPI calculator with real database data using raw SQL"""
    
    # Create test data using raw SQL
    await create_test_data_sql(db_session)
    
    # Create KPI service
    kpi_service = KPICalculatorService(db_session)
    
    # Define test period
    start_date = date.today() - timedelta(days=30)
    end_date = date.today()
    
    # Calculate KPIs
    result = await kpi_service.calculate_financial_kpis(
        time_range=(start_date, end_date)
    )
    
    # Verify basic structure
    assert isinstance(result, dict)
    assert "total_revenue" in result
    assert "gross_profit" in result
    assert "gross_margin" in result
    assert "transaction_count" in result
    assert "period_start" in result
    assert "period_end" in result
    assert "calculated_at" in result
    
    # Verify data types and ranges
    assert isinstance(result["total_revenue"], (int, float))
    assert isinstance(result["gross_profit"], (int, float))
    assert isinstance(result["gross_margin"], (int, float))
    assert isinstance(result["transaction_count"], int)
    assert result["total_revenue"] >= 0
    assert result["transaction_count"] >= 0
    
    # Verify period information
    assert result["period_start"] == start_date.isoformat()
    assert result["period_end"] == end_date.isoformat()
    
    print("✅ Comprehensive KPI calculator test passed!")
    print(f"Total Revenue: ${result['total_revenue']:,.2f}")
    print(f"Gross Profit: ${result['gross_profit']:,.2f}")
    print(f"Gross Margin: {result['gross_margin']:.2f}%")
    print(f"Transaction Count: {result['transaction_count']}")


@pytest.mark.asyncio
async def test_kpi_calculator_with_targets(db_session):
    """Test KPI calculator with targets and achievement rates"""
    
    # Create test data
    await create_test_data_sql(db_session)
    
    # Create KPI service
    kpi_service = KPICalculatorService(db_session)
    
    # Define test period and targets
    start_date = date.today() - timedelta(days=30)
    end_date = date.today()
    
    targets = {
        "revenue": 5000.0,
        "profit_margin": 30.0,
        "transaction_count": 10
    }
    
    # Calculate KPIs with targets
    result = await kpi_service.calculate_financial_kpis(
        time_range=(start_date, end_date),
        targets=targets
    )
    
    # Verify achievement data is included
    assert "targets" in result
    assert result["targets"] == targets
    
    print("✅ KPI calculator with targets test passed!")
    print(f"Revenue Target: ${targets['revenue']:,.2f}, Actual: ${result['total_revenue']:,.2f}")


@pytest.mark.asyncio
async def test_financial_kpi_calculator_individual_methods(db_session):
    """Test individual methods of FinancialKPICalculator"""
    
    # Create test data
    await create_test_data_sql(db_session)
    
    # Create financial calculator
    calculator = FinancialKPICalculator(db_session)
    
    # Test period revenue calculation
    start_date = date.today() - timedelta(days=30)
    end_date = date.today()
    
    revenue = await calculator._calculate_period_revenue(start_date, end_date)
    assert isinstance(revenue, (int, float))
    assert revenue >= 0
    
    # Test profit metrics calculation
    profit_metrics = await calculator._calculate_period_profit_metrics(start_date, end_date)
    assert isinstance(profit_metrics, dict)
    assert "total_sales" in profit_metrics
    assert "total_cost" in profit_metrics
    assert "gross_profit" in profit_metrics
    assert "gross_margin" in profit_metrics
    
    # Test transaction metrics calculation
    transaction_metrics = await calculator._calculate_transaction_metrics(start_date, end_date)
    assert isinstance(transaction_metrics, dict)
    assert "transaction_count" in transaction_metrics
    assert "unique_customers" in transaction_metrics
    assert "avg_transaction_value" in transaction_metrics
    
    print("✅ Individual calculator methods test passed!")
    print(f"Revenue: ${revenue:,.2f}")
    print(f"Gross Profit: ${profit_metrics['gross_profit']:,.2f}")
    print(f"Transaction Count: {transaction_metrics['transaction_count']}")


async def create_test_data_sql(db_session):
    """Create test data using raw SQL to match actual database schema"""
    
    try:
        # Create categories
        category_sql = text("""
            INSERT INTO categories (name) 
            VALUES ('Test Gold Jewelry KPI')
            RETURNING id
        """)
        category_result = db_session.execute(category_sql)
        category_id = category_result.fetchone()[0]
        
        # Create customers
        customer_sql = text("""
            INSERT INTO customers (name, phone, total_purchases) 
            VALUES 
                ('Test Customer KPI 1', '5551001', 0),
                ('Test Customer KPI 2', '5551002', 0)
            RETURNING id
        """)
        customer_results = db_session.execute(customer_sql)
        customer_ids = [row[0] for row in customer_results.fetchall()]
        
        # Create inventory items
        item_sql = text("""
            INSERT INTO inventory_items (name, category_id, purchase_price, stock_quantity) 
            VALUES 
                ('Test Gold Ring KPI 1', :category_id, 500.00, 20),
                ('Test Gold Ring KPI 2', :category_id, 600.00, 15),
                ('Test Gold Ring KPI 3', :category_id, 700.00, 10)
            RETURNING id
        """)
        item_results = db_session.execute(item_sql, {"category_id": category_id})
        item_ids = [row[0] for row in item_results.fetchall()]
        
        # Create invoices with dates in the test period
        base_date = date.today() - timedelta(days=20)
        invoice_ids = []
        
        for i in range(5):
            invoice_date = base_date + timedelta(days=i * 4)
            customer_id = customer_ids[i % len(customer_ids)]
            
            invoice_sql = text("""
                INSERT INTO invoices (customer_id, total_amount, paid_amount, remaining_amount, status, created_at) 
                VALUES (:customer_id, 1500.00, 1500.00, 0.00, 'completed', :created_at)
                RETURNING id
            """)
            
            invoice_result = db_session.execute(invoice_sql, {
                "customer_id": customer_id,
                "created_at": datetime.combine(invoice_date, datetime.min.time())
            })
            invoice_id = invoice_result.fetchone()[0]
            invoice_ids.append(invoice_id)
            
            # Create invoice items
            for j in range(2):
                item_id = item_ids[j % len(item_ids)]
                
                invoice_item_sql = text("""
                    INSERT INTO invoice_items (invoice_id, inventory_item_id, quantity, unit_price, total_price) 
                    VALUES (:invoice_id, :item_id, 1, 750.00, 750.00)
                """)
                
                db_session.execute(invoice_item_sql, {
                    "invoice_id": invoice_id,
                    "item_id": item_id
                })
            
            # Create payment
            payment_sql = text("""
                INSERT INTO payments (id, customer_id, invoice_id, amount, payment_method, description) 
                VALUES (gen_random_uuid(), :customer_id, :invoice_id, 1500.00, 'cash', :description)
            """)
            
            db_session.execute(payment_sql, {
                "customer_id": customer_id,
                "invoice_id": invoice_id,
                "description": f"Test payment for invoice {invoice_id}"
            })
        
        db_session.commit()
        print("✅ Test data created successfully using raw SQL")
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        db_session.rollback()
        raise


def test_kpi_calculator_basic_sync():
    """Synchronous test for basic KPI calculator functionality"""
    
    from unittest.mock import Mock, AsyncMock
    from sqlalchemy.orm import Session
    
    # Create a mock database session
    db_mock = Mock(spec=Session)
    
    # Mock the cache
    cache_mock = Mock()
    cache_mock.get_kpi_data = AsyncMock(return_value=None)
    cache_mock.set_kpi_data = AsyncMock()
    
    # Create calculator instance
    calculator = FinancialKPICalculator(db_mock)
    calculator.cache = cache_mock
    
    # Mock the revenue calculation methods
    calculator._calculate_period_revenue = AsyncMock(return_value=1000.0)
    calculator._calculate_revenue_trend = AsyncMock(return_value={
        "trend": "increasing",
        "slope": 10.5,
        "r_squared": 0.85,
        "data_points": 5
    })
    calculator._test_revenue_significance = AsyncMock(return_value={
        "significant": True,
        "p_value": 0.01,
        "change_percent": 15.0,
        "interpretation": "Significant increase",
        "test": "simple_threshold"
    })
    
    # Test the calculation
    async def run_test():
        today = date.today()
        result = await calculator.calculate_revenue_kpis(
            today - timedelta(days=7),
            today
        )
        
        # Verify basic structure
        assert "current_revenue" in result
        assert "previous_revenue" in result
        assert "growth_rate" in result
        assert "trend_direction" in result
        assert "trend_data" in result
        assert "significance_test" in result
        
        # Verify values
        assert result["current_revenue"] == 1000.0
        assert result["trend_data"]["trend"] == "increasing"
        assert result["significance_test"]["significant"] == True
        
        print("✅ Basic KPI calculator test passed!")
        return result
    
    # Run the async test
    result = asyncio.run(run_test())
    assert result is not None


if __name__ == "__main__":
    # Run tests directly
    import sys
    sys.exit(pytest.main([__file__, "-v"]))