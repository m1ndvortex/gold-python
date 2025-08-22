"""
Simple test for KPI Calculator Service
"""

import asyncio
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from unittest.mock import Mock, AsyncMock

from services.kpi_calculator_service import FinancialKPICalculator
from models import Invoice, InvoiceItem, InventoryItem, Customer, Category
from database import get_db

def test_kpi_calculator_basic():
    """Test basic KPI calculator functionality"""
    
    # Create a mock database session
    db_mock = Mock(spec=Session)
    
    # Mock the cache
    cache_mock = Mock()
    cache_mock.get_kpi_data = AsyncMock(return_value=None)
    cache_mock.set_kpi_data = AsyncMock()
    
    # Create calculator instance
    calculator = FinancialKPICalculator(db_mock)
    calculator.cache = cache_mock
    
    # Mock the revenue calculation
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
    return result

if __name__ == "__main__":
    test_kpi_calculator_basic()
    print("All tests passed!")