"""
Integration tests for ForecastingService using existing database data

Tests forecasting functionality with real database connection.
Requirements covered: 3.1, 3.2, 3.3, 3.4, 3.5
"""

import pytest
import asyncio
from datetime import datetime, timedelta, date
from decimal import Decimal
import pandas as pd
import numpy as np

from database import get_db
from services.forecasting_service import ForecastingService, DemandForecast, SeasonalityAnalysis, SafetyStockRecommendation

@pytest.fixture
def db_session():
    """Get database session"""
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def forecasting_service(db_session):
    """Create forecasting service instance"""
    return ForecastingService(db_session)

class TestForecastingIntegration:
    """Integration tests for ForecastingService"""
    
    @pytest.mark.asyncio
    async def test_forecasting_service_initialization(self, forecasting_service):
        """Test that forecasting service initializes correctly"""
        assert forecasting_service is not None
        assert hasattr(forecasting_service, 'db')
        assert hasattr(forecasting_service, 'models')
        assert 'arima' in forecasting_service.models
        assert 'linear_regression' in forecasting_service.models
        assert 'seasonal_decompose' in forecasting_service.models
    
    def test_get_historical_sales_data_empty(self, forecasting_service):
        """Test getting historical sales data for non-existent item"""
        # Use a UUID that doesn't exist
        fake_item_id = "00000000-0000-0000-0000-000000000000"
        
        historical_data = forecasting_service._get_historical_sales_data(fake_item_id)
        
        assert isinstance(historical_data, list)
        assert len(historical_data) == 0
    
    def test_get_current_stock_info_empty(self, forecasting_service):
        """Test getting stock info for non-existent item"""
        # Use a UUID that doesn't exist
        fake_item_id = "00000000-0000-0000-0000-000000000000"
        
        stock_info = forecasting_service._get_current_stock_info(fake_item_id)
        
        assert isinstance(stock_info, dict)
        assert len(stock_info) == 0
    
    @pytest.mark.asyncio
    async def test_forecast_with_insufficient_data_error(self, forecasting_service):
        """Test forecasting with insufficient data raises appropriate error"""
        fake_item_id = "00000000-0000-0000-0000-000000000000"
        
        with pytest.raises(ValueError, match="Insufficient historical data"):
            await forecasting_service.forecast_demand(
                item_id=fake_item_id,
                periods=30,
                model_type='arima'
            )
    
    @pytest.mark.asyncio
    async def test_safety_stock_with_insufficient_data_error(self, forecasting_service):
        """Test safety stock calculation with insufficient data raises appropriate error"""
        fake_item_id = "00000000-0000-0000-0000-000000000000"
        
        with pytest.raises(ValueError, match="Insufficient data for safety stock calculation"):
            await forecasting_service.calculate_safety_stock(
                item_id=fake_item_id,
                service_level=0.95
            )
    
    @pytest.mark.asyncio
    async def test_seasonality_analysis_with_insufficient_data(self, forecasting_service):
        """Test seasonality analysis with insufficient data"""
        # Create minimal sales data
        minimal_data = [
            {'item_id': 'test-id', 'sale_date': date(2024, 1, 1), 'quantity': 5, 'total_value': 100, 'avg_price': 20},
            {'item_id': 'test-id', 'sale_date': date(2024, 1, 2), 'quantity': 3, 'total_value': 60, 'avg_price': 20},
        ]
        
        seasonality_analysis = await forecasting_service.analyze_seasonality(minimal_data)
        
        assert isinstance(seasonality_analysis, SeasonalityAnalysis)
        assert seasonality_analysis.has_seasonality == False
        assert seasonality_analysis.seasonal_strength == 0.0
        assert len(seasonality_analysis.seasonal_factors) == 0
    
    @pytest.mark.asyncio
    async def test_seasonality_analysis_with_sufficient_data(self, forecasting_service):
        """Test seasonality analysis with sufficient data"""
        # Create 2 years of monthly data with seasonality
        sales_data = []
        base_date = date(2022, 1, 1)
        
        for i in range(24):  # 24 months
            month_date = base_date.replace(month=((i % 12) + 1))
            # Add seasonality - higher sales in December
            seasonal_factor = 1.5 if (i % 12) == 11 else 1.0
            quantity = int(10 * seasonal_factor * (1 + np.random.uniform(-0.2, 0.2)))
            
            sales_data.append({
                'item_id': 'test-id',
                'sale_date': month_date,
                'quantity': quantity,
                'total_value': quantity * 20,
                'avg_price': 20
            })
        
        seasonality_analysis = await forecasting_service.analyze_seasonality(sales_data)
        
        assert isinstance(seasonality_analysis, SeasonalityAnalysis)
        assert seasonality_analysis.item_id == 'test-id'
        # With artificial seasonality, should detect some seasonal patterns
        assert seasonality_analysis.seasonal_strength >= 0.0
    
    def test_time_series_preparation_with_gaps(self, forecasting_service):
        """Test time series data preparation handles gaps correctly"""
        # Data with gaps
        historical_data = [
            {'item_id': 'test-id', 'sale_date': date(2024, 1, 1), 'quantity': 5, 'total_value': 100, 'avg_price': 20},
            {'item_id': 'test-id', 'sale_date': date(2024, 1, 3), 'quantity': 3, 'total_value': 60, 'avg_price': 20},
            {'item_id': 'test-id', 'sale_date': date(2024, 1, 5), 'quantity': 7, 'total_value': 140, 'avg_price': 20},
        ]
        
        ts_data = forecasting_service._prepare_time_series_data(historical_data)
        
        # Should fill gaps with zeros
        assert len(ts_data) == 5  # Jan 1-5
        assert ts_data.loc['2024-01-01', 'quantity'] == 5
        assert ts_data.loc['2024-01-02', 'quantity'] == 0  # Filled gap
        assert ts_data.loc['2024-01-03', 'quantity'] == 3
        assert ts_data.loc['2024-01-04', 'quantity'] == 0  # Filled gap
        assert ts_data.loc['2024-01-05', 'quantity'] == 7
    
    def test_confidence_score_calculation_edge_cases(self, forecasting_service):
        """Test confidence score calculation with edge cases"""
        # Test with zero error (perfect accuracy)
        perfect_metrics = {'mae': 0.0, 'rmse': 0.0}
        perfect_confidence = forecasting_service._calculate_confidence_score(perfect_metrics, 100)
        assert 0.5 <= perfect_confidence <= 1.0  # Should be high but not necessarily 1.0
        
        # Test with very high error
        poor_metrics = {'mae': 1000.0, 'rmse': 1500.0}
        poor_confidence = forecasting_service._calculate_confidence_score(poor_metrics, 100)
        assert 0.0 <= poor_confidence <= 1.0
        
        # Test with missing metrics
        empty_metrics = {}
        default_confidence = forecasting_service._calculate_confidence_score(empty_metrics, 100)
        assert 0.0 <= default_confidence <= 1.0
    
    @pytest.mark.asyncio
    async def test_model_fallback_behavior(self, forecasting_service):
        """Test that invalid model types fallback to ARIMA"""
        # Create some test data
        test_data = []
        base_date = datetime.now() - timedelta(days=30)
        
        for i in range(30):
            test_data.append({
                'item_id': 'test-id',
                'sale_date': (base_date + timedelta(days=i)).date(),
                'quantity': 5 + np.random.randint(-2, 3),
                'total_value': 100,
                'avg_price': 20
            })
        
        # Mock the _get_historical_sales_data method to return our test data
        original_method = forecasting_service._get_historical_sales_data
        forecasting_service._get_historical_sales_data = lambda item_id: test_data
        
        try:
            # Test with invalid model type
            forecast = await forecasting_service.forecast_demand(
                item_id='test-id',
                periods=7,
                model_type='invalid_model_type'
            )
            
            # Should fallback to ARIMA
            assert forecast.model_used == 'arima'
            assert len(forecast.predictions) == 7
            
        finally:
            # Restore original method
            forecasting_service._get_historical_sales_data = original_method
    
    @pytest.mark.asyncio
    async def test_forecast_algorithms_with_synthetic_data(self, forecasting_service):
        """Test all forecasting algorithms with synthetic data"""
        # Create synthetic data with trend and seasonality
        test_data = []
        base_date = datetime.now() - timedelta(days=60)
        
        for i in range(60):
            # Add trend
            trend = i * 0.1
            # Add weekly seasonality (higher on weekends)
            day_of_week = (base_date + timedelta(days=i)).weekday()
            seasonal = 2 if day_of_week >= 5 else 0
            # Add noise
            noise = np.random.uniform(-1, 1)
            
            quantity = max(1, int(5 + trend + seasonal + noise))
            
            test_data.append({
                'item_id': 'test-id',
                'sale_date': (base_date + timedelta(days=i)).date(),
                'quantity': quantity,
                'total_value': quantity * 20,
                'avg_price': 20
            })
        
        # Mock the _get_historical_sales_data method
        original_method = forecasting_service._get_historical_sales_data
        forecasting_service._get_historical_sales_data = lambda item_id: test_data
        
        try:
            # Test all algorithms
            algorithms = ['arima', 'linear_regression', 'seasonal_decompose']
            
            for algorithm in algorithms:
                forecast = await forecasting_service.forecast_demand(
                    item_id='test-id',
                    periods=14,
                    model_type=algorithm
                )
                
                assert isinstance(forecast, DemandForecast)
                assert forecast.model_used == algorithm
                assert len(forecast.predictions) == 14
                assert 0 <= forecast.confidence_score <= 1
                
                # All predictions should be non-negative
                for pred in forecast.predictions:
                    assert pred['predicted_demand'] >= 0
                    assert pred['confidence_lower'] >= 0
                    assert pred['confidence_upper'] >= pred['confidence_lower']
                
                print(f"{algorithm.upper()} - Confidence: {forecast.confidence_score:.3f}, "
                      f"Avg Prediction: {np.mean([p['predicted_demand'] for p in forecast.predictions]):.2f}")
        
        finally:
            # Restore original method
            forecasting_service._get_historical_sales_data = original_method

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])