"""
Comprehensive Unit Tests for Advanced Analytics and Business Intelligence Backend

Tests all components of the advanced analytics system including:
- Advanced KPI calculation engine with customizable metrics per business type
- Predictive analytics for sales, inventory, and cash flow forecasting
- Customer segmentation and behavior analysis algorithms
- Trend analysis with seasonal patterns and growth projections
- Comparative analysis capabilities across time periods and business segments
- Intelligent alerting system based on business rules and anomaly detection
- Data export capabilities for external analysis tools
- Background task processing for complex analytics using Celery

Requirements covered: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
"""

import pytest
import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, List, Any
from unittest.mock import Mock, patch, AsyncMock
import pandas as pd
import numpy as np

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from models import (
    User, Customer, Category, InventoryItem, Invoice, InvoiceItem,
    KPISnapshot
)
from models_universal import BusinessConfiguration
from services.advanced_analytics_service import (
    AdvancedAnalyticsService, BusinessTypeKPIConfig, CustomerSegment,
    TrendAnalysis, ComparativeAnalysis, AnomalyDetection
)
from analytics_tasks.analytics_intelligence_tasks import (
    calculate_advanced_kpis_task, perform_customer_segmentation_task,
    analyze_trends_seasonality_task, detect_anomalies_task,
    export_analytics_data_task
)

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a test database session"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_customers(db_session):
    """Create sample customers for testing"""
    customers = []
    for i in range(10):
        customer = Customer(
            name=f"Customer {i+1}",
            email=f"customer{i+1}@example.com",
            phone=f"123-456-{7890+i}",
            address=f"Address {i+1}"
        )
        db_session.add(customer)
        customers.append(customer)
    
    db_session.commit()
    return customers

@pytest.fixture
def sample_categories(db_session):
    """Create sample categories for testing"""
    categories = []
    category_names = ["Gold Jewelry", "Silver Items", "Precious Stones", "Watches", "Accessories"]
    
    for name in category_names:
        category = Category(name=name, description=f"Category for {name}")
        db_session.add(category)
        categories.append(category)
    
    db_session.commit()
    return categories

@pytest.fixture
def sample_inventory_items(db_session, sample_categories):
    """Create sample inventory items for testing"""
    items = []
    for i, category in enumerate(sample_categories):
        for j in range(5):  # 5 items per category
            item = InventoryItem(
                name=f"{category.name} Item {j+1}",
                description=f"Description for item {j+1}",
                category_id=category.id,
                purchase_price=Decimal(f"{100 + i*50 + j*10}"),
                sell_price=Decimal(f"{150 + i*75 + j*15}"),
                stock_quantity=50 + j*10,
                min_stock_level=10,
                is_active=True
            )
            db_session.add(item)
            items.append(item)
    
    db_session.commit()
    return items

@pytest.fixture
def sample_invoices_with_items(db_session, sample_customers, sample_inventory_items):
    """Create sample invoices with items for testing"""
    invoices = []
    
    # Create invoices over the past 6 months
    base_date = datetime.now() - timedelta(days=180)
    
    for i in range(100):  # 100 invoices
        invoice_date = base_date + timedelta(days=i*1.8)  # Spread over 180 days
        customer = sample_customers[i % len(sample_customers)]
        
        invoice = Invoice(
            customer_id=customer.id,
            total_amount=Decimal("0"),
            paid_amount=Decimal("0"),
            remaining_amount=Decimal("0"),
            status="completed",
            created_at=invoice_date
        )
        db_session.add(invoice)
        db_session.flush()  # Get the invoice ID
        
        # Add 1-3 items per invoice
        total_amount = Decimal("0")
        num_items = min(3, (i % 3) + 1)
        
        for j in range(num_items):
            item = sample_inventory_items[(i + j) % len(sample_inventory_items)]
            quantity = (j % 3) + 1
            unit_price = item.sell_price
            total_price = unit_price * quantity
            
            invoice_item = InvoiceItem(
                invoice_id=invoice.id,
                inventory_item_id=item.id,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price
            )
            db_session.add(invoice_item)
            total_amount += total_price
        
        # Update invoice totals
        invoice.total_amount = total_amount
        invoice.paid_amount = total_amount
        invoice.remaining_amount = Decimal("0")
        
        invoices.append(invoice)
    
    db_session.commit()
    return invoices

@pytest.fixture
def analytics_service(db_session):
    """Create analytics service instance"""
    return AdvancedAnalyticsService(db_session)

class TestAdvancedAnalyticsService:
    """Test suite for Advanced Analytics Service"""
    
    @pytest.mark.asyncio
    async def test_calculate_advanced_kpis_gold_shop(
        self, 
        analytics_service, 
        sample_invoices_with_items
    ):
        """Test advanced KPI calculation for gold shop business type"""
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        result = await analytics_service.calculate_advanced_kpis(
            business_type='gold_shop',
            start_date=start_date,
            end_date=end_date
        )
        
        # Verify result structure
        assert 'business_type' in result
        assert result['business_type'] == 'gold_shop'
        assert 'primary_kpis' in result
        assert 'secondary_kpis' in result
        assert 'composite_score' in result
        assert 'trend_analysis' in result
        assert 'insights' in result
        
        # Verify primary KPIs for gold shop
        primary_kpis = result['primary_kpis']
        expected_kpis = ['revenue', 'profit_margin', 'inventory_turnover', 'customer_retention']
        
        for kpi in expected_kpis:
            assert kpi in primary_kpis
            assert isinstance(primary_kpis[kpi], dict)
            assert 'value' in primary_kpis[kpi]
        
        # Verify composite score
        composite_score = result['composite_score']
        assert 'score' in composite_score
        assert 'performance_level' in composite_score
        assert isinstance(composite_score['score'], (int, float))
        assert composite_score['performance_level'] in ['excellent', 'good', 'average', 'needs_improvement']
    
    @pytest.mark.asyncio
    async def test_calculate_advanced_kpis_retail_store(
        self, 
        analytics_service, 
        sample_invoices_with_items
    ):
        """Test advanced KPI calculation for retail store business type"""
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        result = await analytics_service.calculate_advanced_kpis(
            business_type='retail_store',
            start_date=start_date,
            end_date=end_date
        )
        
        # Verify business type specific configuration
        assert result['business_type'] == 'retail_store'
        
        # Verify retail-specific KPIs
        primary_kpis = result['primary_kpis']
        expected_kpis = ['revenue', 'profit_margin', 'inventory_turnover', 'customer_acquisition']
        
        for kpi in expected_kpis:
            assert kpi in primary_kpis
        
        # Verify insights are business-type specific
        insights = result['insights']
        assert isinstance(insights, list)
        assert len(insights) > 0
    
    @pytest.mark.asyncio
    async def test_calculate_advanced_kpis_with_custom_metrics(
        self, 
        analytics_service, 
        sample_invoices_with_items
    ):
        """Test KPI calculation with custom metrics"""
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        custom_metrics = {
            'custom_conversion_rate': {'target': 0.15, 'weight': 0.1},
            'custom_satisfaction_score': {'target': 4.5, 'weight': 0.2}
        }
        
        result = await analytics_service.calculate_advanced_kpis(
            business_type='retail_store',
            start_date=start_date,
            end_date=end_date,
            custom_metrics=custom_metrics
        )
        
        # Verify custom metrics are included
        assert 'custom_kpis' in result
        custom_kpis = result['custom_kpis']
        
        for metric_name in custom_metrics.keys():
            assert metric_name in custom_kpis
    
    @pytest.mark.asyncio
    async def test_perform_customer_segmentation_rfm(
        self, 
        analytics_service, 
        sample_invoices_with_items
    ):
        """Test RFM customer segmentation"""
        
        segments = await analytics_service.perform_customer_segmentation(
            segmentation_method='rfm',
            num_segments=5,
            analysis_period_days=180
        )
        
        # Verify segmentation results
        assert isinstance(segments, list)
        assert len(segments) <= 5  # May be fewer if insufficient data
        
        for segment in segments:
            assert isinstance(segment, CustomerSegment)
            assert segment.segment_id is not None
            assert segment.segment_name is not None
            assert segment.customer_count > 0
            assert isinstance(segment.characteristics, dict)
            assert isinstance(segment.avg_transaction_value, Decimal)
            assert isinstance(segment.lifetime_value, Decimal)
            assert 0 <= segment.churn_risk <= 1
            assert isinstance(segment.recommended_actions, list)
        
        # Verify segment names are meaningful
        segment_names = [s.segment_name for s in segments]
        expected_names = ['Champions', 'Loyal Customers', 'Potential Loyalists', 'New Customers', 'At Risk', 'Cannot Lose Them', 'Lost Customers', 'Others']
        
        for name in segment_names:
            assert name in expected_names
    
    @pytest.mark.asyncio
    async def test_analyze_trends_and_seasonality(
        self, 
        analytics_service, 
        sample_invoices_with_items
    ):
        """Test trend analysis and seasonality detection"""
        
        result = await analytics_service.analyze_trends_and_seasonality(
            metric_name='revenue',
            entity_type='overall',
            analysis_period_days=180,
            forecast_periods=30
        )
        
        # Verify trend analysis results
        assert isinstance(result, TrendAnalysis)
        assert result.metric_name == 'revenue'
        assert result.trend_direction in ['increasing', 'decreasing', 'stable', 'volatile']
        assert 0 <= result.trend_strength <= 1
        assert isinstance(result.seasonal_component, dict)
        assert isinstance(result.growth_rate, (int, float))
        assert isinstance(result.volatility, (int, float))
        assert isinstance(result.forecast_next_period, (int, float))
        assert isinstance(result.confidence_interval, tuple)
        assert len(result.confidence_interval) == 2
        assert isinstance(result.anomalies_detected, list)
    
    @pytest.mark.asyncio
    async def test_perform_comparative_analysis(
        self, 
        analytics_service, 
        sample_invoices_with_items
    ):
        """Test comparative analysis across time periods"""
        
        # Define comparison configuration
        baseline_config = {
            'start_date': (date.today() - timedelta(days=60)).isoformat(),
            'end_date': (date.today() - timedelta(days=30)).isoformat(),
            'type': 'time_period'
        }
        
        comparison_configs = [
            {
                'start_date': (date.today() - timedelta(days=30)).isoformat(),
                'end_date': date.today().isoformat(),
                'type': 'time_period'
            }
        ]
        
        metrics = ['revenue', 'profit_margin', 'transaction_count']
        
        result = await analytics_service.perform_comparative_analysis(
            comparison_type='time_period',
            baseline_config=baseline_config,
            comparison_configs=comparison_configs,
            metrics=metrics
        )
        
        # Verify comparative analysis results
        assert isinstance(result, ComparativeAnalysis)
        assert result.comparison_type == 'time_period'
        assert result.baseline_period == baseline_config
        assert result.comparison_periods == comparison_configs
        assert 'baseline' in result.metrics_comparison
        assert 'comparisons' in result.metrics_comparison
        assert isinstance(result.statistical_significance, dict)
        assert isinstance(result.insights, list)
        assert isinstance(result.recommendations, list)
        
        # Verify metrics are compared
        baseline_metrics = result.metrics_comparison['baseline']
        for metric in metrics:
            assert metric in baseline_metrics
    
    @pytest.mark.asyncio
    async def test_detect_anomalies_statistical(
        self, 
        analytics_service, 
        sample_invoices_with_items
    ):
        """Test statistical anomaly detection"""
        
        anomalies = await analytics_service.detect_anomalies(
            metric_name='revenue',
            detection_method='statistical',
            sensitivity=0.1,
            lookback_days=90
        )
        
        # Verify anomaly detection results
        assert isinstance(anomalies, list)
        
        for anomaly in anomalies:
            assert isinstance(anomaly, AnomalyDetection)
            assert anomaly.metric_name == 'revenue'
            assert isinstance(anomaly.anomaly_score, (int, float))
            assert isinstance(anomaly.is_anomaly, bool)
            assert anomaly.anomaly_type in ['outlier', 'trend_break', 'seasonal_deviation']
            assert isinstance(anomaly.detected_at, datetime)
            assert isinstance(anomaly.context, dict)
            assert anomaly.severity in ['low', 'medium', 'high', 'critical']
            assert isinstance(anomaly.recommended_action, str)
    
    @pytest.mark.asyncio
    async def test_export_analytics_data_json(
        self, 
        analytics_service, 
        sample_invoices_with_items
    ):
        """Test analytics data export in JSON format"""
        
        filters = {
            'start_date': (date.today() - timedelta(days=30)).isoformat(),
            'end_date': date.today().isoformat()
        }
        
        result = await analytics_service.export_analytics_data(
            export_format='json',
            data_type='transactions',
            filters=filters,
            include_metadata=True
        )
        
        # Verify export results
        assert 'export_id' in result
        assert 'data' in result
        assert 'metadata' in result
        assert result['status'] == 'completed'
        
        # Verify metadata
        metadata = result['metadata']
        assert 'export_timestamp' in metadata
        assert metadata['data_type'] == 'transactions'
        assert metadata['export_format'] == 'json'
        assert metadata['filters_applied'] == filters
        assert 'record_count' in metadata
        assert 'schema' in metadata
    
    @pytest.mark.asyncio
    async def test_export_analytics_data_csv(
        self, 
        analytics_service, 
        sample_invoices_with_items
    ):
        """Test analytics data export in CSV format"""
        
        filters = {'limit': 50}
        
        result = await analytics_service.export_analytics_data(
            export_format='csv',
            data_type='customers',
            filters=filters,
            include_metadata=True
        )
        
        # Verify export results
        assert result['status'] == 'completed'
        assert 'data' in result
        
        # Verify CSV format (should be string data)
        assert isinstance(result['data'], str)
    
    def test_business_type_configs(self, analytics_service):
        """Test business type configurations"""
        
        configs = analytics_service.business_type_configs
        
        # Verify all expected business types are configured
        expected_types = ['gold_shop', 'retail_store', 'service_business', 'manufacturing']
        
        for business_type in expected_types:
            assert business_type in configs
            config = configs[business_type]
            
            assert isinstance(config, BusinessTypeKPIConfig)
            assert config.business_type == business_type
            assert isinstance(config.primary_kpis, list)
            assert isinstance(config.secondary_kpis, list)
            assert isinstance(config.custom_metrics, dict)
            assert isinstance(config.thresholds, dict)
            assert isinstance(config.weights, dict)
            
            # Verify weights sum to approximately 1.0
            total_weight = sum(config.weights.values())
            assert 0.9 <= total_weight <= 1.1  # Allow for small rounding errors

class TestAnalyticsBackgroundTasks:
    """Test suite for Analytics Background Tasks"""
    
    @patch('analytics_tasks.analytics_intelligence_tasks.SessionLocal')
    @patch('analytics_tasks.analytics_intelligence_tasks.AdvancedAnalyticsService')
    def test_calculate_advanced_kpis_task(self, mock_service_class, mock_session):
        """Test advanced KPIs calculation background task"""
        
        # Mock the service and its methods
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        
        # Mock the calculate_advanced_kpis method
        mock_kpi_result = {
            'business_type': 'gold_shop',
            'primary_kpis': {'revenue': {'value': 10000}},
            'composite_score': {'score': 85.5}
        }
        
        async def mock_calculate_kpis(*args, **kwargs):
            return mock_kpi_result
        
        mock_service.calculate_advanced_kpis = mock_calculate_kpis
        
        # Mock database session
        mock_db = Mock()
        mock_session.return_value.__enter__.return_value = mock_db
        
        # Create a mock task instance
        mock_task = Mock()
        mock_task.request.id = 'test-task-id'
        mock_task.update_state = Mock()
        
        # Test the task function
        with patch('analytics_tasks.analytics_intelligence_tasks.get_analytics_cache') as mock_cache:
            mock_cache_instance = Mock()
            mock_cache_instance.set_kpi_data = AsyncMock()
            mock_cache.return_value = mock_cache_instance
            
            # Call the task function directly
            result = calculate_advanced_kpis_task.__wrapped__(
                mock_task,
                business_type='gold_shop',
                start_date='2024-01-01',
                end_date='2024-01-31',
                user_id='test-user'
            )
            
            # Verify task progress updates were called
            assert mock_task.update_state.call_count >= 3
            
            # Verify result structure
            assert 'task_id' in result
            assert 'business_type' in result
            assert 'kpi_results' in result
            assert result['status'] == 'completed'
    
    @patch('analytics_tasks.analytics_intelligence_tasks.SessionLocal')
    @patch('analytics_tasks.analytics_intelligence_tasks.AdvancedAnalyticsService')
    def test_perform_customer_segmentation_task(self, mock_service_class, mock_session):
        """Test customer segmentation background task"""
        
        # Mock the service and its methods
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        
        # Mock customer segments
        mock_segments = [
            Mock(
                segment_id='1',
                segment_name='Champions',
                customer_count=25,
                characteristics={'avg_recency': 15.0},
                avg_transaction_value=Decimal('500.00'),
                avg_frequency=5.2,
                lifetime_value=Decimal('2500.00'),
                churn_risk=0.1,
                recommended_actions=['Reward with exclusive offers']
            )
        ]
        
        async def mock_segmentation(*args, **kwargs):
            return mock_segments
        
        mock_service.perform_customer_segmentation = mock_segmentation
        
        # Mock database session
        mock_db = Mock()
        mock_session.return_value.__enter__.return_value = mock_db
        
        # Create a mock task instance
        mock_task = Mock()
        mock_task.request.id = 'test-segmentation-task'
        mock_task.update_state = Mock()
        
        # Call the task function directly
        result = perform_customer_segmentation_task.__wrapped__(
            mock_task,
            segmentation_method='rfm',
            num_segments=5,
            analysis_period_days=365,
            user_id='test-user'
        )
        
        # Verify result structure
        assert 'task_id' in result
        assert 'segmentation_method' in result
        assert 'segments' in result
        assert 'summary' in result
        assert result['status'] == 'completed'
        
        # Verify segments data
        segments_data = result['segments']
        assert len(segments_data) == 1
        assert segments_data[0]['segment_name'] == 'Champions'
    
    @patch('analytics_tasks.analytics_intelligence_tasks.SessionLocal')
    @patch('analytics_tasks.analytics_intelligence_tasks.AdvancedAnalyticsService')
    def test_detect_anomalies_task(self, mock_service_class, mock_session):
        """Test anomaly detection background task"""
        
        # Mock the service and its methods
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        
        # Mock anomalies
        mock_anomalies = [
            Mock(
                metric_name='revenue',
                anomaly_score=0.85,
                is_anomaly=True,
                anomaly_type='outlier',
                detected_at=datetime.now(),
                context={'value': 15000, 'expected': 10000},
                severity='high',
                recommended_action='Investigate unusual revenue spike'
            )
        ]
        
        async def mock_detect_anomalies(*args, **kwargs):
            return mock_anomalies
        
        mock_service.detect_anomalies = mock_detect_anomalies
        
        # Mock database session
        mock_db = Mock()
        mock_session.return_value.__enter__.return_value = mock_db
        
        # Create a mock task instance
        mock_task = Mock()
        mock_task.request.id = 'test-anomaly-task'
        mock_task.update_state = Mock()
        
        # Call the task function directly
        result = detect_anomalies_task.__wrapped__(
            mock_task,
            metric_name='revenue',
            detection_method='statistical',
            sensitivity=0.1,
            lookback_days=90,
            user_id='test-user'
        )
        
        # Verify result structure
        assert 'task_id' in result
        assert 'metric_name' in result
        assert 'anomalies' in result
        assert 'summary' in result
        assert result['status'] == 'completed'
        
        # Verify anomalies data
        anomalies_data = result['anomalies']
        assert len(anomalies_data) == 1
        assert anomalies_data[0]['severity'] == 'high'

class TestAnalyticsIntegration:
    """Integration tests for analytics system"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_analytics_workflow(
        self, 
        analytics_service, 
        sample_invoices_with_items
    ):
        """Test complete analytics workflow from KPI calculation to insights"""
        
        end_date = date.today()
        start_date = end_date - timedelta(days=90)
        
        # Step 1: Calculate KPIs
        kpi_results = await analytics_service.calculate_advanced_kpis(
            business_type='gold_shop',
            start_date=start_date,
            end_date=end_date
        )
        
        assert 'primary_kpis' in kpi_results
        
        # Step 2: Perform customer segmentation
        segments = await analytics_service.perform_customer_segmentation(
            segmentation_method='rfm',
            num_segments=4,
            analysis_period_days=90
        )
        
        assert len(segments) > 0
        
        # Step 3: Analyze trends
        trend_analysis = await analytics_service.analyze_trends_and_seasonality(
            metric_name='revenue',
            entity_type='overall',
            analysis_period_days=90,
            forecast_periods=30
        )
        
        assert trend_analysis.metric_name == 'revenue'
        
        # Step 4: Detect anomalies
        anomalies = await analytics_service.detect_anomalies(
            metric_name='revenue',
            detection_method='statistical',
            sensitivity=0.2,
            lookback_days=90
        )
        
        # Verify all components work together
        assert isinstance(anomalies, list)
        
        # Step 5: Export data
        export_result = await analytics_service.export_analytics_data(
            export_format='json',
            data_type='kpis',
            filters={'start_date': start_date.isoformat(), 'end_date': end_date.isoformat()},
            include_metadata=True
        )
        
        assert export_result['status'] == 'completed'
    
    @pytest.mark.asyncio
    async def test_analytics_performance_with_large_dataset(
        self, 
        analytics_service, 
        db_session,
        sample_customers,
        sample_inventory_items
    ):
        """Test analytics performance with larger dataset"""
        
        # Create a larger dataset (1000 invoices)
        base_date = datetime.now() - timedelta(days=365)
        
        for i in range(1000):
            invoice_date = base_date + timedelta(days=i*0.365)  # Spread over 365 days
            customer = sample_customers[i % len(sample_customers)]
            
            invoice = Invoice(
                customer_id=customer.id,
                total_amount=Decimal(f"{100 + (i % 500)}"),
                paid_amount=Decimal(f"{100 + (i % 500)}"),
                remaining_amount=Decimal("0"),
                status="completed",
                created_at=invoice_date
            )
            db_session.add(invoice)
            db_session.flush()
            
            # Add items to invoice
            item = sample_inventory_items[i % len(sample_inventory_items)]
            invoice_item = InvoiceItem(
                invoice_id=invoice.id,
                inventory_item_id=item.id,
                quantity=1,
                unit_price=item.sell_price,
                total_price=item.sell_price
            )
            db_session.add(invoice_item)
        
        db_session.commit()
        
        # Test KPI calculation performance
        start_time = datetime.now()
        
        kpi_results = await analytics_service.calculate_advanced_kpis(
            business_type='retail_store',
            start_date=date.today() - timedelta(days=180),
            end_date=date.today()
        )
        
        end_time = datetime.now()
        calculation_time = (end_time - start_time).total_seconds()
        
        # Verify performance (should complete within reasonable time)
        assert calculation_time < 30  # Should complete within 30 seconds
        assert 'primary_kpis' in kpi_results
        
        # Test segmentation performance
        start_time = datetime.now()
        
        segments = await analytics_service.perform_customer_segmentation(
            segmentation_method='rfm',
            num_segments=5,
            analysis_period_days=365
        )
        
        end_time = datetime.now()
        segmentation_time = (end_time - start_time).total_seconds()
        
        # Verify segmentation performance
        assert segmentation_time < 20  # Should complete within 20 seconds
        assert len(segments) > 0

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])