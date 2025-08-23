"""
Simple integration tests for StockOptimizationService

Tests stock optimization functionality with synthetic data.
Requirements covered: 4.1, 4.2, 4.3, 4.4, 4.5
"""

import pytest
import asyncio
from datetime import datetime, timedelta, date
from decimal import Decimal
import numpy as np

from database import get_db
from services.stock_optimization_service import (
    StockOptimizationService, 
    StockOptimizationRecommendation,
    EOQCalculation,
    ReorderPointCalculation
)

@pytest.fixture
def db_session():
    """Get database session"""
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def stock_optimization_service(db_session):
    """Create stock optimization service instance"""
    return StockOptimizationService(db_session)

class TestStockOptimizationSimple:
    """Simple tests for StockOptimizationService core functionality"""
    
    @pytest.mark.asyncio
    async def test_eoq_calculation_with_synthetic_data(self, stock_optimization_service):
        """Test EOQ calculation with synthetic data"""
        # Mock item data
        item_data = {
            'id': 'test-item-id',
            'name': 'Test Item',
            'stock_quantity': 50,
            'purchase_price': 100.0,
            'sell_price': 150.0
        }
        
        # Create synthetic sales data for consistent demand
        sales_data = []
        base_date = datetime.now() - timedelta(days=180)
        
        for i in range(180):
            # Consistent daily demand of 2 units with small variation
            quantity = max(1, int(2 + np.random.uniform(-0.3, 0.3)))
            sales_data.append({
                'sale_date': (base_date + timedelta(days=i)).date(),
                'quantity': quantity,
                'total_value': quantity * 150,
                'avg_price': 150
            })
        
        # Mock the methods
        original_get_item = stock_optimization_service._get_item_data
        original_get_sales = stock_optimization_service._get_item_sales_data
        
        stock_optimization_service._get_item_data = lambda item_id: item_data
        stock_optimization_service._get_item_sales_data = lambda item_id: sales_data
        
        try:
            eoq_result = await stock_optimization_service.calculate_economic_order_quantity('test-item-id')
            
            assert isinstance(eoq_result, EOQCalculation)
            assert eoq_result.item_id == 'test-item-id'
            assert eoq_result.economic_order_quantity > 0
            assert eoq_result.annual_demand > 0
            assert eoq_result.ordering_cost == Decimal('50.00')
            assert eoq_result.holding_cost_per_unit > 0
            assert eoq_result.total_annual_cost > 0
            assert eoq_result.order_frequency > 0
            assert eoq_result.cycle_time_days > 0
            
            print(f"EOQ Simple Test - EOQ: {eoq_result.economic_order_quantity}")
            print(f"EOQ Simple Test - Annual Demand: {eoq_result.annual_demand:.2f}")
            print(f"EOQ Simple Test - Total Annual Cost: ${eoq_result.total_annual_cost:.2f}")
            
        finally:
            stock_optimization_service._get_item_data = original_get_item
            stock_optimization_service._get_item_sales_data = original_get_sales
    
    @pytest.mark.asyncio
    async def test_reorder_point_calculation(self, stock_optimization_service):
        """Test reorder point calculation with lead time"""
        # Mock item data
        item_data = {
            'id': 'test-item-id',
            'name': 'Test Item',
            'stock_quantity': 30,
            'purchase_price': 50.0,
            'sell_price': 75.0,
            'lead_time_days': 10
        }
        
        # Create sales data with some variability
        sales_data = []
        base_date = datetime.now() - timedelta(days=90)
        
        for i in range(90):
            # Variable daily demand (2-6 units)
            quantity = max(1, int(4 + np.random.uniform(-2, 2)))
            sales_data.append({
                'sale_date': (base_date + timedelta(days=i)).date(),
                'quantity': quantity,
                'total_value': quantity * 75,
                'avg_price': 75
            })
        
        # Mock the methods
        original_get_item = stock_optimization_service._get_item_data
        original_get_sales = stock_optimization_service._get_item_sales_data
        
        stock_optimization_service._get_item_data = lambda item_id: item_data
        stock_optimization_service._get_item_sales_data = lambda item_id: sales_data
        
        try:
            reorder_result = await stock_optimization_service.calculate_reorder_point_with_lead_time(
                'test-item-id',
                lead_time_days=10,
                service_level=0.95
            )
            
            assert isinstance(reorder_result, ReorderPointCalculation)
            assert reorder_result.item_id == 'test-item-id'
            assert reorder_result.reorder_point > 0
            assert reorder_result.lead_time_days == 10
            assert reorder_result.average_daily_demand > 0
            assert reorder_result.safety_stock >= 0
            assert reorder_result.service_level == 0.95
            assert 0 <= reorder_result.stockout_probability <= 1
            
            print(f"Reorder Point Simple Test - Reorder Point: {reorder_result.reorder_point}")
            print(f"Reorder Point Simple Test - Safety Stock: {reorder_result.safety_stock}")
            print(f"Reorder Point Simple Test - Avg Daily Demand: {reorder_result.average_daily_demand:.2f}")
            
        finally:
            stock_optimization_service._get_item_data = original_get_item
            stock_optimization_service._get_item_sales_data = original_get_sales
    
    @pytest.mark.asyncio
    async def test_safety_stock_optimization_multiple_levels(self, stock_optimization_service):
        """Test safety stock optimization with multiple service levels"""
        # Mock item data
        item_data = {
            'id': 'test-item-id',
            'name': 'Test Item',
            'stock_quantity': 25,
            'purchase_price': 80.0,
            'sell_price': 120.0
        }
        
        # Create sales data
        sales_data = []
        base_date = datetime.now() - timedelta(days=60)
        
        for i in range(60):
            # Demand with variability
            quantity = max(1, int(3 + np.random.normal(0, 1)))
            sales_data.append({
                'sale_date': (base_date + timedelta(days=i)).date(),
                'quantity': quantity,
                'total_value': quantity * 120,
                'avg_price': 120
            })
        
        # Mock the methods
        original_get_item = stock_optimization_service._get_item_data
        original_get_sales = stock_optimization_service._get_item_sales_data
        
        stock_optimization_service._get_item_data = lambda item_id: item_data
        stock_optimization_service._get_item_sales_data = lambda item_id: sales_data
        
        try:
            service_levels = [0.90, 0.95, 0.99]
            safety_stock_results = await stock_optimization_service.calculate_safety_stock_optimization(
                'test-item-id',
                target_service_levels=service_levels
            )
            
            assert len(safety_stock_results) == 3
            
            for i, result in enumerate(safety_stock_results):
                assert result['service_level'] == service_levels[i]
                assert result['safety_stock'] >= 0
                assert result['annual_holding_cost'] >= 0
                assert result['annual_stockout_cost'] >= 0
                assert result['total_annual_cost'] >= 0
                assert 0 <= result['stockout_probability'] <= 1
                
                # Higher service levels should have higher safety stock
                if i > 0:
                    assert result['safety_stock'] >= safety_stock_results[i-1]['safety_stock']
            
            print("Safety Stock Optimization Simple Test:")
            for result in safety_stock_results:
                print(f"  Service Level {result['service_level']:.0%}: "
                      f"Safety Stock = {result['safety_stock']}, "
                      f"Total Cost = ${result['total_annual_cost']:.2f}")
            
        finally:
            stock_optimization_service._get_item_data = original_get_item
            stock_optimization_service._get_item_sales_data = original_get_sales
    
    @pytest.mark.asyncio
    async def test_custom_cost_parameters_eoq(self, stock_optimization_service):
        """Test EOQ calculation with custom cost parameters"""
        item_data = {
            'id': 'custom-cost-item',
            'name': 'Custom Cost Item',
            'stock_quantity': 40,
            'purchase_price': 200.0,
            'sell_price': 300.0
        }
        
        sales_data = []
        base_date = datetime.now() - timedelta(days=120)
        
        for i in range(120):
            quantity = max(1, int(3 + np.random.uniform(-0.5, 0.5)))
            sales_data.append({
                'sale_date': (base_date + timedelta(days=i)).date(),
                'quantity': quantity,
                'total_value': quantity * 300,
                'avg_price': 300
            })
        
        # Mock the methods
        original_get_item = stock_optimization_service._get_item_data
        original_get_sales = stock_optimization_service._get_item_sales_data
        
        stock_optimization_service._get_item_data = lambda item_id: item_data
        stock_optimization_service._get_item_sales_data = lambda item_id: sales_data
        
        try:
            # Test with custom ordering cost and holding cost rate
            eoq_result = await stock_optimization_service.calculate_economic_order_quantity(
                'custom-cost-item',
                ordering_cost=Decimal('100.00'),  # Higher ordering cost
                holding_cost_rate=0.30  # Higher holding cost rate
            )
            
            assert eoq_result.ordering_cost == Decimal('100.00')
            assert eoq_result.holding_cost_per_unit == Decimal('200.0') * Decimal('0.30')
            assert eoq_result.economic_order_quantity > 0
            
            print(f"Custom Cost Simple Test - EOQ: {eoq_result.economic_order_quantity}")
            print(f"Custom Cost Simple Test - Ordering Cost: ${eoq_result.ordering_cost}")
            print(f"Custom Cost Simple Test - Holding Cost/Unit: ${eoq_result.holding_cost_per_unit}")
            
        finally:
            stock_optimization_service._get_item_data = original_get_item
            stock_optimization_service._get_item_sales_data = original_get_sales
    
    @pytest.mark.asyncio
    async def test_insufficient_data_handling(self, stock_optimization_service):
        """Test handling of insufficient sales data"""
        item_data = {
            'id': 'no-data-item',
            'name': 'No Data Item',
            'stock_quantity': 20,
            'purchase_price': 50.0,
            'sell_price': 75.0
        }
        
        # Very little sales data (less than 5 records)
        sales_data = [
            {'sale_date': (datetime.now() - timedelta(days=1)).date(), 'quantity': 1, 'total_value': 75, 'avg_price': 75}
        ]
        
        # Mock the methods
        original_get_item = stock_optimization_service._get_item_data
        original_get_sales = stock_optimization_service._get_item_sales_data
        
        stock_optimization_service._get_item_data = lambda item_id: item_data
        stock_optimization_service._get_item_sales_data = lambda item_id: sales_data
        
        try:
            # Should raise error for insufficient data
            with pytest.raises(ValueError, match="Insufficient sales data"):
                await stock_optimization_service.calculate_economic_order_quantity('no-data-item')
            
            with pytest.raises(ValueError, match="Insufficient sales data"):
                await stock_optimization_service.calculate_reorder_point_with_lead_time('no-data-item')
            
            print("Insufficient Data Simple Test - Correctly raised ValueError for insufficient data")
            
        finally:
            stock_optimization_service._get_item_data = original_get_item
            stock_optimization_service._get_item_sales_data = original_get_sales
    
    def test_demand_statistics_calculation(self, stock_optimization_service):
        """Test demand statistics calculation"""
        # Test with normal sales data
        sales_data = [
            {'sale_date': date(2024, 1, 1), 'quantity': 5, 'total_value': 100, 'avg_price': 20},
            {'sale_date': date(2024, 1, 2), 'quantity': 3, 'total_value': 60, 'avg_price': 20},
            {'sale_date': date(2024, 1, 3), 'quantity': 7, 'total_value': 140, 'avg_price': 20},
            {'sale_date': date(2024, 1, 4), 'quantity': 4, 'total_value': 80, 'avg_price': 20},
            {'sale_date': date(2024, 1, 5), 'quantity': 6, 'total_value': 120, 'avg_price': 20},
        ]
        
        stats = stock_optimization_service._calculate_demand_statistics(sales_data)
        
        assert stats['avg_daily_demand'] == 5.0  # (5+3+7+4+6)/5
        assert stats['total_sales'] == 25.0
        assert stats['annual_demand'] > 0
        assert stats['std_dev'] > 0
        
        # Test with empty data
        empty_stats = stock_optimization_service._calculate_demand_statistics([])
        assert empty_stats['avg_daily_demand'] == 0.0
        assert empty_stats['std_dev'] == 0.0
        assert empty_stats['annual_demand'] == 0.0
        assert empty_stats['total_sales'] == 0.0
        
        print(f"Demand Stats Simple Test - Avg Daily: {stats['avg_daily_demand']}")
        print(f"Demand Stats Simple Test - Std Dev: {stats['std_dev']:.2f}")
        print(f"Demand Stats Simple Test - Annual: {stats['annual_demand']:.2f}")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])