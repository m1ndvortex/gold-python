"""
Unit tests for ForecastingService

Tests forecasting accuracy using historical sales data with real PostgreSQL database.
Requirements covered: 3.1, 3.2, 3.3, 3.4, 3.5
"""

import pytest
import asyncio
from datetime import datetime, timedelta, date
from decimal import Decimal
from unittest.mock import Mock, patch
import pandas as pd
import numpy as np

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import get_db
from services.forecasting_service import ForecastingService, DemandForecast, SeasonalityAnalysis, SafetyStockRecommendation
from models import Base, InventoryItem, Invoice, InvoiceItem, Customer, Category

# Test database setup - use Docker database
TEST_DATABASE_URL = "postgresql://postgres:postgres@db:5432/goldshop"

@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine"""
    engine = create_engine(TEST_DATABASE_URL)
    return engine

@pytest.fixture(scope="session")
def test_session_factory(test_engine):
    """Create test session factory"""
    return sessionmaker(bind=test_engine)

@pytest.fixture
def db_session(test_session_factory):
    """Create test database session"""
    session = test_session_factory()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def forecasting_service(db_session):
    """Create forecasting service instance"""
    return ForecastingService(db_session)

@pytest.fixture
def test_inventory_item(db_session):
    """Create test inventory item with category"""
    # Create test category
    category = Category(
        name="Test Gold Jewelry",
        description="Test category for forecasting"
    )
    db_session.add(category)
    db_session.flush()
    
    # Create test inventory item
    item = InventoryItem(
        name="Test Gold Ring",
        category_id=category.id,
        weight_grams=Decimal('5.5'),
        purchase_price=Decimal('100.00'),
        sell_price=Decimal('150.00'),
        stock_quantity=50,
        min_stock_level=10
    )
    db_session.add(item)
    db_session.flush()
    
    yield item
    
    # Cleanup
    db_session.delete(item)
    db_session.delete(category)
    db_session.commit()

@pytest.fixture
def test_customer(db_session):
    """Create test customer"""
    customer = Customer(
        name="Test Customer",
        phone="1234567890",
        email="test@example.com"
    )
    db_session.add(customer)
    db_session.flush()
    
    yield customer
    
    # Cleanup
    db_session.delete(customer)
    db_session.commit()

@pytest.fixture
def historical_sales_data(db_session, test_inventory_item, test_customer):
    """Create historical sales data for testing"""
    invoices = []
    invoice_items = []
    
    # Create 90 days of sales data with some seasonality and trend
    base_date = datetime.now() - timedelta(days=90)
    
    for i in range(90):
        sale_date = base_date + timedelta(days=i)
        
        # Add some seasonality (higher sales on weekends)
        base_quantity = 2
        if sale_date.weekday() >= 5:  # Weekend
            base_quantity = 4
        
        # Add some trend (increasing sales over time)
        trend_factor = 1 + (i / 180)  # 50% increase over 90 days
        
        # Add some randomness
        random_factor = np.random.uniform(0.5, 1.5)
        
        quantity = max(1, int(base_quantity * trend_factor * random_factor))
        
        # Create invoice
        invoice = Invoice(
            invoice_number=f"TEST-{i:04d}",
            customer_id=test_customer.id,
            total_amount=Decimal(str(quantity * 150)),
            paid_amount=Decimal(str(quantity * 150)),
            remaining_amount=Decimal('0'),
            gold_price_per_gram=Decimal('50.00'),
            status='completed',
            created_at=sale_date
        )
        db_session.add(invoice)
        db_session.flush()
        invoices.append(invoice)
        
        # Create invoice item
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            inventory_item_id=test_inventory_item.id,
            quantity=quantity,
            unit_price=Decimal('150.00'),
            total_price=Decimal(str(quantity * 150)),
            weight_grams=Decimal(str(quantity * 5.5))
        )
        db_session.add(invoice_item)
        invoice_items.append(invoice_item)
    
    db_session.commit()
    
    yield {
        'invoices': invoices,
        'invoice_items': invoice_items,
        'item_id': str(test_inventory_item.id)
    }
    
    # Cleanup
    for item in invoice_items:
        db_session.delete(item)
    for invoice in invoices:
        db_session.delete(invoice)
    db_session.commit()

class TestForecastingService:
    """Test cases for ForecastingService"""
    
    @pytest.mark.asyncio
    async def test_forecast_demand_arima(self, forecasting_service, historical_sales_data):
        """Test ARIMA demand forecasting"""
        item_id = historical_sales_data['item_id']
        
        # Test ARIMA forecasting
        forecast = await forecasting_service.forecast_demand(
            item_id=item_id,
            periods=30,
            model_type='arima'
        )
        
        # Verify forecast structure
        assert isinstance(forecast, DemandForecast)
        assert forecast.item_id == item_id
        assert len(forecast.predictions) == 30
        assert forecast.model_used == 'arima'
        assert 0 <= forecast.confidence_score <= 1
        
        # Verify prediction structure
        for prediction in forecast.predictions:
            assert 'date' in prediction
            assert 'predicted_demand' in prediction
            assert 'confidence_lower' in prediction
            assert 'confidence_upper' in prediction
            assert prediction['predicted_demand'] >= 0
            assert prediction['confidence_lower'] >= 0
            assert prediction['confidence_upper'] >= prediction['confidence_lower']
        
        # Verify accuracy metrics
        assert 'mae' in forecast.accuracy_metrics
        assert 'mse' in forecast.accuracy_metrics
        assert 'rmse' in forecast.accuracy_metrics
        assert 'aic' in forecast.accuracy_metrics
        
        print(f"ARIMA Forecast - Confidence: {forecast.confidence_score}")
        print(f"ARIMA Forecast - MAE: {forecast.accuracy_metrics['mae']:.2f}")
        print(f"ARIMA Forecast - First 5 predictions: {forecast.predictions[:5]}")
    
    @pytest.mark.asyncio
    async def test_forecast_demand_linear_regression(self, forecasting_service, historical_sales_data):
        """Test linear regression demand forecasting"""
        item_id = historical_sales_data['item_id']
        
        # Test linear regression forecasting
        forecast = await forecasting_service.forecast_demand(
            item_id=item_id,
            periods=30,
            model_type='linear_regression'
        )
        
        # Verify forecast structure
        assert isinstance(forecast, DemandForecast)
        assert forecast.item_id == item_id
        assert len(forecast.predictions) == 30
        assert forecast.model_used == 'linear_regression'
        assert 0 <= forecast.confidence_score <= 1
        
        # Verify accuracy metrics
        assert 'mae' in forecast.accuracy_metrics
        assert 'r2_score' in forecast.accuracy_metrics
        
        print(f"Linear Regression Forecast - Confidence: {forecast.confidence_score}")
        print(f"Linear Regression Forecast - R²: {forecast.accuracy_metrics['r2_score']:.3f}")
    
    @pytest.mark.asyncio
    async def test_forecast_demand_seasonal_decompose(self, forecasting_service, historical_sales_data):
        """Test seasonal decomposition forecasting"""
        item_id = historical_sales_data['item_id']
        
        # Test seasonal decomposition forecasting
        forecast = await forecasting_service.forecast_demand(
            item_id=item_id,
            periods=30,
            model_type='seasonal_decompose'
        )
        
        # Verify forecast structure
        assert isinstance(forecast, DemandForecast)
        assert forecast.item_id == item_id
        assert len(forecast.predictions) == 30
        assert forecast.model_used == 'seasonal_decompose'
        
        # Verify accuracy metrics
        assert 'mae' in forecast.accuracy_metrics
        assert 'seasonal_strength' in forecast.accuracy_metrics
        
        print(f"Seasonal Decompose Forecast - Seasonal Strength: {forecast.accuracy_metrics['seasonal_strength']:.3f}")
    
    @pytest.mark.asyncio
    async def test_analyze_seasonality(self, forecasting_service, historical_sales_data):
        """Test seasonality detection and pattern recognition"""
        # Get historical data
        historical_data = await forecasting_service._get_historical_sales_data(
            historical_sales_data['item_id']
        )
        
        # Analyze seasonality
        seasonality_analysis = await forecasting_service.analyze_seasonality(historical_data)
        
        # Verify analysis structure
        assert isinstance(seasonality_analysis, SeasonalityAnalysis)
        assert seasonality_analysis.item_id == historical_sales_data['item_id']
        assert isinstance(seasonality_analysis.has_seasonality, bool)
        assert 0 <= seasonality_analysis.seasonal_strength <= 1
        assert isinstance(seasonality_analysis.seasonal_factors, dict)
        assert isinstance(seasonality_analysis.trend_component, float)
        assert isinstance(seasonality_analysis.residual_variance, float)
        
        print(f"Seasonality Analysis - Has Seasonality: {seasonality_analysis.has_seasonality}")
        print(f"Seasonality Analysis - Strength: {seasonality_analysis.seasonal_strength:.3f}")
        print(f"Seasonality Analysis - Trend: {seasonality_analysis.trend_component:.3f}")
    
    @pytest.mark.asyncio
    async def test_calculate_safety_stock(self, forecasting_service, historical_sales_data):
        """Test safety stock calculations with service level optimization"""
        item_id = historical_sales_data['item_id']
        
        # Test safety stock calculation
        safety_stock_rec = await forecasting_service.calculate_safety_stock(
            item_id=item_id,
            service_level=0.95
        )
        
        # Verify recommendation structure
        assert isinstance(safety_stock_rec, SafetyStockRecommendation)
        assert safety_stock_rec.item_id == item_id
        assert safety_stock_rec.service_level == 0.95
        assert safety_stock_rec.recommended_safety_stock >= 0
        assert safety_stock_rec.lead_time_days > 0
        assert 0 <= safety_stock_rec.stockout_probability <= 1
        assert isinstance(safety_stock_rec.cost_impact, Decimal)
        
        print(f"Safety Stock - Current: {safety_stock_rec.current_safety_stock}")
        print(f"Safety Stock - Recommended: {safety_stock_rec.recommended_safety_stock}")
        print(f"Safety Stock - Stockout Probability: {safety_stock_rec.stockout_probability:.3f}")
        print(f"Safety Stock - Cost Impact: ${safety_stock_rec.cost_impact}")
    
    @pytest.mark.asyncio
    async def test_forecast_with_insufficient_data(self, forecasting_service, db_session):
        """Test forecasting behavior with insufficient historical data"""
        # Create item with minimal data
        category = Category(name="Test Category")
        db_session.add(category)
        db_session.flush()
        
        item = InventoryItem(
            name="Test Item",
            category_id=category.id,
            weight_grams=Decimal('1.0'),
            purchase_price=Decimal('10.00'),
            sell_price=Decimal('15.00'),
            stock_quantity=5,
            min_stock_level=1
        )
        db_session.add(item)
        db_session.flush()
        
        # Test with insufficient data
        with pytest.raises(ValueError, match="Insufficient historical data"):
            await forecasting_service.forecast_demand(
                item_id=str(item.id),
                periods=30,
                model_type='arima'
            )
        
        # Cleanup
        db_session.delete(item)
        db_session.delete(category)
        db_session.commit()
    
    @pytest.mark.asyncio
    async def test_forecast_confidence_calculation(self, forecasting_service, historical_sales_data):
        """Test confidence score calculation accuracy"""
        item_id = historical_sales_data['item_id']
        
        # Get forecasts with different models
        arima_forecast = await forecasting_service.forecast_demand(
            item_id=item_id,
            periods=7,  # Short term for better accuracy
            model_type='arima'
        )
        
        lr_forecast = await forecasting_service.forecast_demand(
            item_id=item_id,
            periods=7,
            model_type='linear_regression'
        )
        
        # Confidence scores should be reasonable
        assert 0.1 <= arima_forecast.confidence_score <= 1.0
        assert 0.1 <= lr_forecast.confidence_score <= 1.0
        
        print(f"ARIMA Confidence: {arima_forecast.confidence_score:.3f}")
        print(f"Linear Regression Confidence: {lr_forecast.confidence_score:.3f}")
    
    @pytest.mark.asyncio
    async def test_forecast_date_range_accuracy(self, forecasting_service, historical_sales_data):
        """Test forecast date range accuracy"""
        item_id = historical_sales_data['item_id']
        periods = 14
        
        forecast = await forecasting_service.forecast_demand(
            item_id=item_id,
            periods=periods,
            model_type='linear_regression'
        )
        
        # Verify date range
        expected_start = datetime.now().date() + timedelta(days=1)
        expected_end = expected_start + timedelta(days=periods-1)
        
        assert forecast.forecast_period_start == expected_start
        assert forecast.forecast_period_end == expected_end
        
        # Verify prediction dates
        for i, prediction in enumerate(forecast.predictions):
            expected_date = expected_start + timedelta(days=i)
            assert prediction['date'] == expected_date.isoformat()
    
    @pytest.mark.asyncio
    async def test_multiple_service_levels_safety_stock(self, forecasting_service, historical_sales_data):
        """Test safety stock calculation with different service levels"""
        item_id = historical_sales_data['item_id']
        
        service_levels = [0.90, 0.95, 0.99]
        recommendations = []
        
        for service_level in service_levels:
            rec = await forecasting_service.calculate_safety_stock(
                item_id=item_id,
                service_level=service_level
            )
            recommendations.append(rec)
        
        # Higher service levels should require more safety stock
        for i in range(1, len(recommendations)):
            assert recommendations[i].recommended_safety_stock >= recommendations[i-1].recommended_safety_stock
            assert recommendations[i].stockout_probability <= recommendations[i-1].stockout_probability
        
        print("Safety Stock by Service Level:")
        for rec in recommendations:
            print(f"  {rec.service_level:.0%}: {rec.recommended_safety_stock} units")
    
    @pytest.mark.asyncio
    async def test_forecast_model_fallback(self, forecasting_service, historical_sales_data):
        """Test model fallback behavior"""
        item_id = historical_sales_data['item_id']
        
        # Test with invalid model type (should fallback to ARIMA)
        forecast = await forecasting_service.forecast_demand(
            item_id=item_id,
            periods=10,
            model_type='invalid_model'
        )
        
        assert forecast.model_used == 'arima'  # Should fallback to ARIMA
        assert len(forecast.predictions) == 10
    
    @pytest.mark.asyncio
    async def test_forecast_negative_demand_handling(self, forecasting_service, historical_sales_data):
        """Test handling of negative demand predictions"""
        item_id = historical_sales_data['item_id']
        
        forecast = await forecasting_service.forecast_demand(
            item_id=item_id,
            periods=30,
            model_type='linear_regression'
        )
        
        # All predictions should be non-negative
        for prediction in forecast.predictions:
            assert prediction['predicted_demand'] >= 0
            assert prediction['confidence_lower'] >= 0
    
    def test_time_series_data_preparation(self, forecasting_service):
        """Test time series data preparation"""
        # Mock historical data with gaps
        historical_data = [
            {'item_id': 'test-id', 'sale_date': date(2024, 1, 1), 'quantity': 5, 'total_value': 100, 'avg_price': 20},
            {'item_id': 'test-id', 'sale_date': date(2024, 1, 3), 'quantity': 3, 'total_value': 60, 'avg_price': 20},
            {'item_id': 'test-id', 'sale_date': date(2024, 1, 5), 'quantity': 7, 'total_value': 140, 'avg_price': 20},
        ]
        
        ts_data = forecasting_service._prepare_time_series_data(historical_data)
        
        # Should fill missing dates with zeros
        assert len(ts_data) == 5  # Jan 1-5
        assert ts_data.loc['2024-01-01', 'quantity'] == 5
        assert ts_data.loc['2024-01-02', 'quantity'] == 0  # Filled gap
        assert ts_data.loc['2024-01-03', 'quantity'] == 3
        assert ts_data.loc['2024-01-04', 'quantity'] == 0  # Filled gap
        assert ts_data.loc['2024-01-05', 'quantity'] == 7
    
    def test_confidence_score_calculation(self, forecasting_service):
        """Test confidence score calculation logic"""
        # Test with good accuracy metrics
        good_metrics = {'mae': 1.0, 'rmse': 1.5}
        good_confidence = forecasting_service._calculate_confidence_score(good_metrics, 100)
        
        # Test with poor accuracy metrics
        poor_metrics = {'mae': 10.0, 'rmse': 15.0}
        poor_confidence = forecasting_service._calculate_confidence_score(poor_metrics, 100)
        
        # Good metrics should have higher confidence
        assert good_confidence > poor_confidence
        assert 0 <= good_confidence <= 1
        assert 0 <= poor_confidence <= 1
        
        # Test with insufficient data
        insufficient_data_confidence = forecasting_service._calculate_confidence_score(good_metrics, 10)
        sufficient_data_confidence = forecasting_service._calculate_confidence_score(good_metrics, 100)
        
        # More data should increase confidence
        assert sufficient_data_confidence >= insufficient_data_confidence

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])