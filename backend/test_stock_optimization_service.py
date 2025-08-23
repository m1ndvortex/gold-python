"""
Unit tests for StockOptimizationService

Tests stock optimization recommendations with various inventory scenarios.
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

class TestStockOptimizationService:
    """Test cases for StockOptimizationService"""
    
    @pytest.mark.asyncio
    async def test_service_initialization(self, stock_optimization_service):
        """Test that stock optimization service initializes correctly"""
        assert stock_optimization_service is not None
        assert hasattr(stock_optimization_service, 'db')
        assert stock_optimization_service.default_holding_cost_rate == 0.25
        assert stock_optimization_service.default_ordering_cost == Decimal('50.00')
        assert stock_optimization_service.default_service_level == 0.95
    
    @pytest.mark.asyncio
    async def test_calculate_economic_order_quantity(self, stock_optimization_service):
        """Test EOQ calculation with synthetic data"""
        # Mock item data and sales data
        item_data = {
            'id': 'test-item-id',
            'name': 'Test Item',
            'stock_quantity': 50,
            'purchase_price': 100.0,
            'sell_price': 150.0
        }
        
        # Create synthetic sales data for 1 year with consistent demand
        sales_data = []
        base_date = datetime.now() - timedelta(days=365)
        
        for i in range(365):
            # Consistent daily demand of 2 units with some variation
            quantity = max(1, int(2 + np.random.uniform(-0.5, 0.5)))
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
            
            print(f"EOQ Test - EOQ: {eoq_result.economic_order_quantity}")
            print(f"EOQ Test - Annual Demand: {eoq_result.annual_demand:.2f}")
            print(f"EOQ Test - Total Annual Cost: ${eoq_result.total_annual_cost:.2f}")
            print(f"EOQ Test - Order Frequency: {eoq_result.order_frequency:.2f} orders/year")
            
        finally:
            stock_optimization_service._get_item_data = original_get_item
            stock_optimization_service._get_item_sales_data = original_get_sales
    
    @pytest.mark.asyncio
    async def test_calculate_reorder_point_with_lead_time(self, stock_optimization_service):
        """Test reorder point calculation with lead time considerations"""
        # Mock item data
        item_data = {
            'id': 'test-item-id',
            'name': 'Test Item',
            'stock_quantity': 30,
            'purchase_price': 50.0,
            'sell_price': 75.0,
            'lead_time_days': 10
        }
        
        # Create sales data with variable demand
        sales_data = []
        base_date = datetime.now() - timedelta(days=180)
        
        for i in range(180):
            # Variable daily demand (1-5 units)
            quantity = max(1, int(3 + np.random.uniform(-2, 2)))
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
            
            print(f"Reorder Point Test - Reorder Point: {reorder_result.reorder_point}")
            print(f"Reorder Point Test - Safety Stock: {reorder_result.safety_stock}")
            print(f"Reorder Point Test - Avg Daily Demand: {reorder_result.average_daily_demand:.2f}")
            print(f"Reorder Point Test - Stockout Probability: {reorder_result.stockout_probability:.3f}")
            
        finally:
            stock_optimization_service._get_item_data = original_get_item
            stock_optimization_service._get_item_sales_data = original_get_sales
    
    @pytest.mark.asyncio
    async def test_calculate_safety_stock_optimization(self, stock_optimization_service):
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
        base_date = datetime.now() - timedelta(days=90)
        
        for i in range(90):
            # Demand with some variability
            quantity = max(1, int(4 + np.random.normal(0, 1)))
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
                
                # Higher service levels should have higher safety stock and lower stockout probability
                if i > 0:
                    assert result['safety_stock'] >= safety_stock_results[i-1]['safety_stock']
                    assert result['stockout_probability'] <= safety_stock_results[i-1]['stockout_probability']
            
            print("Safety Stock Optimization Results:")
            for result in safety_stock_results:
                print(f"  Service Level {result['service_level']:.0%}: "
                      f"Safety Stock = {result['safety_stock']}, "
                      f"Total Cost = ${result['total_annual_cost']:.2f}")
            
        finally:
            stock_optimization_service._get_item_data = original_get_item
            stock_optimization_service._get_item_sales_data = original_get_sales
    
    @pytest.mark.asyncio
    async def test_generate_stock_recommendations_reorder_scenario(self, stock_optimization_service):
        """Test stock recommendations for reorder scenario"""
        # Mock items data - low stock item
        items_data = [{
            'id': 'low-stock-item',
            'name': 'Low Stock Item',
            'stock_quantity': 5,  # Very low stock
            'purchase_price': 60.0,
            'sell_price': 90.0,
            'category_name': 'Test Category'
        }]
        
        # Create sales data showing regular demand
        sales_data = []
        base_date = datetime.now() - timedelta(days=60)
        
        for i in range(60):
            quantity = max(1, int(3 + np.random.uniform(-1, 1)))
            sales_data.append({
                'sale_date': (base_date + timedelta(days=i)).date(),
                'quantity': quantity,
                'total_value': quantity * 90,
                'avg_price': 90
            })
        
        # Mock the methods
        original_get_items = stock_optimization_service._get_items_for_analysis
        original_get_sales = stock_optimization_service._get_item_sales_data
        
        stock_optimization_service._get_items_for_analysis = lambda item_ids=None, category_ids=None: items_data
        stock_optimization_service._get_item_sales_data = lambda item_id: sales_data
        
        try:
            recommendations = await stock_optimization_service.generate_stock_recommendations()
            
            assert len(recommendations) > 0
            
            reorder_rec = recommendations[0]
            assert isinstance(reorder_rec, StockOptimizationRecommendation)
            assert reorder_rec.item_id == 'low-stock-item'
            assert reorder_rec.recommendation_type == 'reorder'
            assert reorder_rec.priority_level == 'high'
            assert reorder_rec.current_stock == 5
            assert reorder_rec.reorder_point is not None
            assert reorder_rec.reorder_quantity is not None
            assert reorder_rec.estimated_savings > 0
            
            print(f"Reorder Recommendation - Type: {reorder_rec.recommendation_type}")
            print(f"Reorder Recommendation - Priority: {reorder_rec.priority_level}")
            print(f"Reorder Recommendation - Reasoning: {reorder_rec.reasoning}")
            print(f"Reorder Recommendation - Estimated Savings: ${reorder_rec.estimated_savings}")
            
        finally:
            stock_optimization_service._get_items_for_analysis = original_get_items
            stock_optimization_service._get_item_sales_data = original_get_sales
    
    @pytest.mark.asyncio
    async def test_generate_stock_recommendations_overstock_scenario(self, stock_optimization_service):
        """Test stock recommendations for overstock scenario"""
        # Mock items data - high stock item
        items_data = [{
            'id': 'high-stock-item',
            'name': 'High Stock Item',
            'stock_quantity': 200,  # Very high stock
            'purchase_price': 40.0,
            'sell_price': 60.0,
            'category_name': 'Test Category'
        }]
        
        # Create sales data showing low demand
        sales_data = []
        base_date = datetime.now() - timedelta(days=90)
        
        for i in range(90):
            # Low, irregular demand
            quantity = max(0, int(1 + np.random.uniform(-0.5, 1)))
            if quantity > 0:
                sales_data.append({
                    'sale_date': (base_date + timedelta(days=i)).date(),
                    'quantity': quantity,
                    'total_value': quantity * 60,
                    'avg_price': 60
                })
        
        # Mock the methods
        original_get_items = stock_optimization_service._get_items_for_analysis
        original_get_sales = stock_optimization_service._get_item_sales_data
        
        stock_optimization_service._get_items_for_analysis = lambda item_ids=None, category_ids=None: items_data
        stock_optimization_service._get_item_sales_data = lambda item_id: sales_data
        
        try:
            recommendations = await stock_optimization_service.generate_stock_recommendations()
            
            assert len(recommendations) > 0
            
            reduce_rec = recommendations[0]
            assert isinstance(reduce_rec, StockOptimizationRecommendation)
            assert reduce_rec.item_id == 'high-stock-item'
            assert reduce_rec.recommendation_type in ['reduce', 'discontinue']
            assert reduce_rec.current_stock == 200
            assert reduce_rec.estimated_savings > 0
            
            print(f"Overstock Recommendation - Type: {reduce_rec.recommendation_type}")
            print(f"Overstock Recommendation - Priority: {reduce_rec.priority_level}")
            print(f"Overstock Recommendation - Reasoning: {reduce_rec.reasoning}")
            
        finally:
            stock_optimization_service._get_items_for_analysis = original_get_items
            stock_optimization_service._get_item_sales_data = original_get_sales
    
    @pytest.mark.asyncio
    async def test_eoq_calculation_edge_cases(self, stock_optimization_service):
        """Test EOQ calculation with edge cases"""
        # Test with very low demand
        item_data = {
            'id': 'low-demand-item',
            'name': 'Low Demand Item',
            'stock_quantity': 10,
            'purchase_price': 100.0,
            'sell_price': 150.0
        }
        
        # Very low demand data
        sales_data = [
            {'sale_date': (datetime.now() - timedelta(days=30)).date(), 'quantity': 1, 'total_value': 150, 'avg_price': 150},
            {'sale_date': (datetime.now() - timedelta(days=60)).date(), 'quantity': 1, 'total_value': 150, 'avg_price': 150},
        ]
        
        # Mock the methods
        original_get_item = stock_optimization_service._get_item_data
        original_get_sales = stock_optimization_service._get_item_sales_data
        
        stock_optimization_service._get_item_data = lambda item_id: item_data
        stock_optimization_service._get_item_sales_data = lambda item_id: sales_data
        
        try:
            eoq_result = await stock_optimization_service.calculate_economic_order_quantity('low-demand-item')
            
            # Should still calculate valid EOQ even with low demand
            assert eoq_result.economic_order_quantity >= 1
            assert eoq_result.annual_demand > 0
            
            print(f"Low Demand EOQ - EOQ: {eoq_result.economic_order_quantity}")
            print(f"Low Demand EOQ - Annual Demand: {eoq_result.annual_demand:.2f}")
            
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
        
        # Very little sales data
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
            
            print("Insufficient Data Test - Correctly raised ValueError for insufficient data")
            
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
        
        print(f"Demand Stats Test - Avg Daily: {stats['avg_daily_demand']}")
        print(f"Demand Stats Test - Std Dev: {stats['std_dev']:.2f}")
        print(f"Demand Stats Test - Annual: {stats['annual_demand']:.2f}")
    
    @pytest.mark.asyncio
    async def test_custom_cost_parameters(self, stock_optimization_service):
        """Test EOQ calculation with custom cost parameters"""
        item_data = {
            'id': 'custom-cost-item',
            'name': 'Custom Cost Item',
            'stock_quantity': 30,
            'purchase_price': 200.0,
            'sell_price': 300.0
        }
        
        sales_data = []
        base_date = datetime.now() - timedelta(days=100)
        
        for i in range(100):
            quantity = max(1, int(2 + np.random.uniform(-0.5, 0.5)))
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
            
            print(f"Custom Cost Test - EOQ: {eoq_result.economic_order_quantity}")
            print(f"Custom Cost Test - Ordering Cost: ${eoq_result.ordering_cost}")
            print(f"Custom Cost Test - Holding Cost/Unit: ${eoq_result.holding_cost_per_unit}")
            
        finally:
            stock_optimization_service._get_item_data = original_get_item
            stock_optimization_service._get_item_sales_data = original_get_sales

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])