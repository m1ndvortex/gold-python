"""
Simple forecasting tests to verify core functionality

Tests the forecasting algorithms with synthetic data.
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

class TestForecastingSimple:
    """Simple tests for ForecastingService core functionality"""
    
    @pytest.mark.asyncio
    async def test_arima_forecast_with_synthetic_data(self, forecasting_service):
        """Test ARIMA forecasting with synthetic data"""
        # Create synthetic sales data with trend
        test_data = []
        base_date = datetime.now() - timedelta(days=60)
        
        for i in range(60):
            # Simple trend with some noise
            quantity = max(1, int(5 + i * 0.1 + np.random.uniform(-1, 1)))
            test_data.append({
                'item_id': 'test-id',
                'sale_date': (base_date + timedelta(days=i)).date(),
                'quantity': quantity,
                'total_value': quantity * 20,
                'avg_price': 20
            })
        
        # Mock the data retrieval method
        original_method = forecasting_service._get_historical_sales_data
        forecasting_service._get_historical_sales_data = lambda item_id: test_data
        
        try:
            forecast = await forecasting_service.forecast_demand(
                item_id='test-id',
                periods=14,
                model_type='arima'
            )
            
            assert isinstance(forecast, DemandForecast)
            assert forecast.model_used == 'arima'
            assert len(forecast.predictions) == 14
            assert 0 <= forecast.confidence_score <= 1
            
            # Verify prediction structure
            for pred in forecast.predictions:
                assert 'date' in pred
                assert 'predicted_demand' in pred
                assert 'confidence_lower' in pred
                assert 'confidence_upper' in pred
                assert pred['predicted_demand'] >= 0
                assert pred['confidence_lower'] >= 0
                assert pred['confidence_upper'] >= pred['confidence_lower']
            
            print(f"ARIMA Test - Confidence: {forecast.confidence_score:.3f}")
            print(f"ARIMA Test - First prediction: {forecast.predictions[0]['predicted_demand']:.2f}")
            
        finally:
            forecasting_service._get_historical_sales_data = original_method
    
    @pytest.mark.asyncio
    async def test_linear_regression_forecast(self, forecasting_service):
        """Test linear regression forecasting"""
        # Create synthetic data with clear linear trend
        test_data = []
        base_date = datetime.now() - timedelta(days=30)
        
        for i in range(30):
            # Clear linear trend
            quantity = max(1, int(3 + i * 0.2))
            test_data.append({
                'item_id': 'test-id',
                'sale_date': (base_date + timedelta(days=i)).date(),
                'quantity': quantity,
                'total_value': quantity * 15,
                'avg_price': 15
            })
        
        # Mock the data retrieval method
        original_method = forecasting_service._get_historical_sales_data
        forecasting_service._get_historical_sales_data = lambda item_id: test_data
        
        try:
            forecast = await forecasting_service.forecast_demand(
                item_id='test-id',
                periods=7,
                model_type='linear_regression'
            )
            
            assert isinstance(forecast, DemandForecast)
            assert forecast.model_used == 'linear_regression'
            assert len(forecast.predictions) == 7
            assert 0 <= forecast.confidence_score <= 1
            
            # With clear trend, predictions should be reasonable
            predictions = [p['predicted_demand'] for p in forecast.predictions]
            assert all(p > 0 for p in predictions)
            
            print(f"Linear Regression Test - Confidence: {forecast.confidence_score:.3f}")
            print(f"Linear Regression Test - R²: {forecast.accuracy_metrics.get('r2_score', 'N/A')}")
            
        finally:
            forecasting_service._get_historical_sales_data = original_method
    
    @pytest.mark.asyncio
    async def test_seasonality_analysis(self, forecasting_service):
        """Test seasonality detection"""
        # Create data with weekly seasonality (higher on weekends)
        test_data = []
        base_date = datetime.now() - timedelta(days=84)  # 12 weeks
        
        for i in range(84):
            current_date = base_date + timedelta(days=i)
            # Weekend boost
            weekend_factor = 2.0 if current_date.weekday() >= 5 else 1.0
            quantity = max(1, int(5 * weekend_factor + np.random.uniform(-0.5, 0.5)))
            
            test_data.append({
                'item_id': 'test-id',
                'sale_date': current_date.date(),
                'quantity': quantity,
                'total_value': quantity * 25,
                'avg_price': 25
            })
        
        seasonality_analysis = await forecasting_service.analyze_seasonality(test_data)
        
        assert isinstance(seasonality_analysis, SeasonalityAnalysis)
        assert seasonality_analysis.item_id == 'test-id'
        assert seasonality_analysis.has_seasonality in [True, False]
        assert 0 <= seasonality_analysis.seasonal_strength <= 1
        
        print(f"Seasonality Test - Has Seasonality: {seasonality_analysis.has_seasonality}")
        print(f"Seasonality Test - Strength: {seasonality_analysis.seasonal_strength:.3f}")
    
    @pytest.mark.asyncio
    async def test_safety_stock_calculation(self, forecasting_service):
        """Test safety stock calculation"""
        # Create historical data with some variability
        test_data = []
        base_date = datetime.now() - timedelta(days=30)
        
        for i in range(30):
            # Variable demand
            quantity = max(1, int(5 + np.random.uniform(-2, 3)))
            test_data.append({
                'item_id': 'test-id',
                'sale_date': (base_date + timedelta(days=i)).date(),
                'quantity': quantity,
                'total_value': quantity * 30,
                'avg_price': 30
            })
        
        # Mock both methods
        original_hist_method = forecasting_service._get_historical_sales_data
        original_stock_method = forecasting_service._get_current_stock_info
        
        forecasting_service._get_historical_sales_data = lambda item_id: test_data
        forecasting_service._get_current_stock_info = lambda item_id: {
            'stock_quantity': 20,
            'min_stock_level': 5,
            'purchase_price': 30.0,
            'sell_price': 45.0
        }
        
        try:
            safety_stock_rec = await forecasting_service.calculate_safety_stock(
                item_id='test-id',
                service_level=0.95
            )
            
            assert isinstance(safety_stock_rec, SafetyStockRecommendation)
            assert safety_stock_rec.item_id == 'test-id'
            assert safety_stock_rec.service_level == 0.95
            assert safety_stock_rec.recommended_safety_stock >= 0
            assert safety_stock_rec.lead_time_days > 0
            assert 0 <= safety_stock_rec.stockout_probability <= 1
            assert isinstance(safety_stock_rec.cost_impact, Decimal)
            
            print(f"Safety Stock Test - Current: {safety_stock_rec.current_safety_stock}")
            print(f"Safety Stock Test - Recommended: {safety_stock_rec.recommended_safety_stock}")
            print(f"Safety Stock Test - Stockout Prob: {safety_stock_rec.stockout_probability:.3f}")
            
        finally:
            forecasting_service._get_historical_sales_data = original_hist_method
            forecasting_service._get_current_stock_info = original_stock_method
    
    @pytest.mark.asyncio
    async def test_model_fallback(self, forecasting_service):
        """Test model fallback to ARIMA for invalid model types"""
        test_data = []
        base_date = datetime.now() - timedelta(days=20)
        
        for i in range(20):
            quantity = max(1, int(4 + np.random.uniform(-1, 2)))
            test_data.append({
                'item_id': 'test-id',
                'sale_date': (base_date + timedelta(days=i)).date(),
                'quantity': quantity,
                'total_value': quantity * 20,
                'avg_price': 20
            })
        
        original_method = forecasting_service._get_historical_sales_data
        forecasting_service._get_historical_sales_data = lambda item_id: test_data
        
        try:
            # Test with invalid model type
            forecast = await forecasting_service.forecast_demand(
                item_id='test-id',
                periods=5,
                model_type='invalid_model'
            )
            
            # Should fallback to ARIMA
            assert forecast.model_used == 'arima'
            assert len(forecast.predictions) == 5
            
            print("Model Fallback Test - Successfully fell back to ARIMA")
            
        finally:
            forecasting_service._get_historical_sales_data = original_method
    
    def test_confidence_score_calculation(self, forecasting_service):
        """Test confidence score calculation"""
        # Test with good metrics
        good_metrics = {'mae': 1.0, 'rmse': 1.2}
        good_confidence = forecasting_service._calculate_confidence_score(good_metrics, 100)
        
        # Test with poor metrics
        poor_metrics = {'mae': 10.0, 'rmse': 15.0}
        poor_confidence = forecasting_service._calculate_confidence_score(poor_metrics, 100)
        
        # Good metrics should have higher confidence
        assert good_confidence > poor_confidence
        assert 0 <= good_confidence <= 1
        assert 0 <= poor_confidence <= 1
        
        print(f"Confidence Test - Good metrics: {good_confidence:.3f}")
        print(f"Confidence Test - Poor metrics: {poor_confidence:.3f}")
    
    def test_time_series_preparation(self, forecasting_service):
        """Test time series data preparation"""
        # Test data with gaps and duplicates
        historical_data = [
            {'item_id': 'test-id', 'sale_date': date(2024, 1, 1), 'quantity': 5, 'total_value': 100, 'avg_price': 20},
            {'item_id': 'test-id', 'sale_date': date(2024, 1, 1), 'quantity': 3, 'total_value': 60, 'avg_price': 20},  # Duplicate date
            {'item_id': 'test-id', 'sale_date': date(2024, 1, 3), 'quantity': 7, 'total_value': 140, 'avg_price': 20},
        ]
        
        ts_data = forecasting_service._prepare_time_series_data(historical_data)
        
        # Should handle duplicates by summing and fill gaps
        assert len(ts_data) == 3  # Jan 1-3
        assert ts_data.loc['2024-01-01', 'quantity'] == 8  # 5 + 3 (duplicates summed)
        assert ts_data.loc['2024-01-02', 'quantity'] == 0  # Filled gap
        assert ts_data.loc['2024-01-03', 'quantity'] == 7
        
        print("Time Series Preparation Test - Successfully handled duplicates and gaps")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])