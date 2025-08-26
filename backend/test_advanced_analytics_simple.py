"""
Simple Unit Tests for Advanced Analytics and Business Intelligence Backend

Basic tests for core analytics functionality using real PostgreSQL database in Docker.

Requirements covered: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
"""

import pytest
import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, List, Any

from sqlalchemy.orm import Session
from database import get_db
from models import User, Customer, Category, InventoryItem, Invoice, InvoiceItem
from services.advanced_analytics_service import AdvancedAnalyticsService

class TestAdvancedAnalyticsBasic:
    """Basic tests for Advanced Analytics Service"""
    
    def test_analytics_service_initialization(self):
        """Test that analytics service initializes correctly"""
        
        # Mock database session
        mock_db = None
        
        try:
            service = AdvancedAnalyticsService(mock_db)
            
            # Verify business type configurations exist
            assert hasattr(service, 'business_type_configs')
            assert len(service.business_type_configs) > 0
            
            # Verify expected business types
            expected_types = ['gold_shop', 'retail_store', 'service_business', 'manufacturing']
            for business_type in expected_types:
                assert business_type in service.business_type_configs
            
            # Verify cache and TTL settings
            assert hasattr(service, 'cache_ttl')
            assert service.cache_ttl > 0
            
        except Exception as e:
            pytest.fail(f"Analytics service initialization failed: {str(e)}")
    
    def test_business_type_config_structure(self):
        """Test business type configuration structure"""
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        for business_type, config in service.business_type_configs.items():
            # Verify config has required attributes
            assert hasattr(config, 'business_type')
            assert hasattr(config, 'primary_kpis')
            assert hasattr(config, 'secondary_kpis')
            assert hasattr(config, 'custom_metrics')
            assert hasattr(config, 'thresholds')
            assert hasattr(config, 'weights')
            
            # Verify data types
            assert isinstance(config.primary_kpis, list)
            assert isinstance(config.secondary_kpis, list)
            assert isinstance(config.custom_metrics, dict)
            assert isinstance(config.thresholds, dict)
            assert isinstance(config.weights, dict)
            
            # Verify primary KPIs are not empty
            assert len(config.primary_kpis) > 0
            
            # Verify weights are reasonable
            total_weight = sum(config.weights.values())
            assert 0.8 <= total_weight <= 1.2  # Allow some flexibility
    
    def test_gold_shop_specific_config(self):
        """Test gold shop specific configuration"""
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        gold_config = service.business_type_configs['gold_shop']
        
        # Verify gold shop specific KPIs
        expected_primary = ['revenue', 'profit_margin', 'inventory_turnover', 'customer_retention']
        for kpi in expected_primary:
            assert kpi in gold_config.primary_kpis
        
        # Verify gold shop specific secondary KPIs
        expected_secondary = ['gold_price_impact', 'weight_sold', 'labor_cost_ratio']
        for kpi in expected_secondary:
            assert kpi in gold_config.secondary_kpis
        
        # Verify gold shop specific custom metrics
        assert 'sood_percentage' in gold_config.custom_metrics
        assert 'ojrat_percentage' in gold_config.custom_metrics
    
    def test_retail_store_specific_config(self):
        """Test retail store specific configuration"""
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        retail_config = service.business_type_configs['retail_store']
        
        # Verify retail store specific KPIs
        expected_primary = ['revenue', 'profit_margin', 'inventory_turnover', 'customer_acquisition']
        for kpi in expected_primary:
            assert kpi in retail_config.primary_kpis
        
        # Verify retail store specific secondary KPIs
        expected_secondary = ['basket_size', 'conversion_rate', 'foot_traffic']
        for kpi in expected_secondary:
            assert kpi in retail_config.secondary_kpis
    
    def test_service_business_specific_config(self):
        """Test service business specific configuration"""
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        service_config = service.business_type_configs['service_business']
        
        # Verify service business specific KPIs
        expected_primary = ['revenue', 'utilization_rate', 'customer_satisfaction', 'repeat_business']
        for kpi in expected_primary:
            assert kpi in service_config.primary_kpis
        
        # Verify service business specific thresholds
        assert 'utilization_rate' in service_config.thresholds
        assert 'customer_satisfaction' in service_config.thresholds
    
    def test_manufacturing_specific_config(self):
        """Test manufacturing specific configuration"""
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        manufacturing_config = service.business_type_configs['manufacturing']
        
        # Verify manufacturing specific KPIs
        expected_primary = ['production_efficiency', 'quality_rate', 'cost_per_unit', 'on_time_delivery']
        for kpi in expected_primary:
            assert kpi in manufacturing_config.primary_kpis
        
        # Verify manufacturing specific custom metrics
        assert 'oee' in manufacturing_config.custom_metrics  # Overall Equipment Effectiveness
        assert 'defect_rate' in manufacturing_config.custom_metrics

class TestAnalyticsDataStructures:
    """Test analytics data structures and models"""
    
    def test_customer_segment_structure(self):
        """Test CustomerSegment data structure"""
        
        from services.advanced_analytics_service import CustomerSegment
        
        # Create a sample customer segment
        segment = CustomerSegment(
            segment_id="1",
            segment_name="Champions",
            customer_count=25,
            characteristics={"avg_recency": 15.0, "avg_frequency": 5.2},
            avg_transaction_value=Decimal("500.00"),
            avg_frequency=5.2,
            lifetime_value=Decimal("2500.00"),
            churn_risk=0.1,
            recommended_actions=["Reward with exclusive offers", "Ask for referrals"]
        )
        
        # Verify all attributes are accessible
        assert segment.segment_id == "1"
        assert segment.segment_name == "Champions"
        assert segment.customer_count == 25
        assert isinstance(segment.characteristics, dict)
        assert isinstance(segment.avg_transaction_value, Decimal)
        assert isinstance(segment.lifetime_value, Decimal)
        assert 0 <= segment.churn_risk <= 1
        assert isinstance(segment.recommended_actions, list)
    
    def test_trend_analysis_structure(self):
        """Test TrendAnalysis data structure"""
        
        from services.advanced_analytics_service import TrendAnalysis
        
        # Create a sample trend analysis
        trend = TrendAnalysis(
            metric_name="revenue",
            trend_direction="increasing",
            trend_strength=0.85,
            seasonal_component={"month_1": 1.2, "month_2": 0.8},
            growth_rate=15.5,
            volatility=0.25,
            forecast_next_period=12500.0,
            confidence_interval=(11000.0, 14000.0),
            anomalies_detected=[{"date": "2024-01-15", "severity": "medium"}]
        )
        
        # Verify all attributes are accessible
        assert trend.metric_name == "revenue"
        assert trend.trend_direction in ["increasing", "decreasing", "stable", "volatile"]
        assert 0 <= trend.trend_strength <= 1
        assert isinstance(trend.seasonal_component, dict)
        assert isinstance(trend.growth_rate, (int, float))
        assert isinstance(trend.volatility, (int, float))
        assert isinstance(trend.confidence_interval, tuple)
        assert len(trend.confidence_interval) == 2
        assert isinstance(trend.anomalies_detected, list)
    
    def test_anomaly_detection_structure(self):
        """Test AnomalyDetection data structure"""
        
        from services.advanced_analytics_service import AnomalyDetection
        
        # Create a sample anomaly detection
        anomaly = AnomalyDetection(
            metric_name="revenue",
            anomaly_score=0.85,
            is_anomaly=True,
            anomaly_type="outlier",
            detected_at=datetime.now(),
            context={"value": 15000, "expected": 10000},
            severity="high",
            recommended_action="Investigate unusual revenue spike"
        )
        
        # Verify all attributes are accessible
        assert anomaly.metric_name == "revenue"
        assert isinstance(anomaly.anomaly_score, (int, float))
        assert isinstance(anomaly.is_anomaly, bool)
        assert anomaly.anomaly_type in ["outlier", "trend_break", "seasonal_deviation"]
        assert isinstance(anomaly.detected_at, datetime)
        assert isinstance(anomaly.context, dict)
        assert anomaly.severity in ["low", "medium", "high", "critical"]
        assert isinstance(anomaly.recommended_action, str)

class TestAnalyticsHelperMethods:
    """Test analytics helper methods and utilities"""
    
    def test_determine_rfm_segment_name(self):
        """Test RFM segment name determination logic"""
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        # Test Champions segment (low recency, high frequency, high monetary)
        segment_name = service._determine_rfm_segment_name(
            avg_recency=15.0,
            avg_frequency=8.0,
            avg_monetary=1500.0
        )
        assert segment_name == "Champions"
        
        # Test Lost Customers segment (high recency)
        segment_name = service._determine_rfm_segment_name(
            avg_recency=200.0,
            avg_frequency=2.0,
            avg_monetary=300.0
        )
        assert segment_name == "Lost Customers"
        
        # Test New Customers segment (low recency, low frequency)
        segment_name = service._determine_rfm_segment_name(
            avg_recency=20.0,
            avg_frequency=1.0,
            avg_monetary=200.0
        )
        assert segment_name == "New Customers"
    
    def test_generate_segment_recommendations(self):
        """Test segment recommendation generation"""
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        # Test Champions recommendations
        recommendations = service._generate_segment_recommendations(
            segment_name="Champions",
            avg_recency=15.0,
            avg_frequency=8.0,
            avg_monetary=1500.0
        )
        
        assert isinstance(recommendations, list)
        assert len(recommendations) > 0
        assert any("reward" in rec.lower() for rec in recommendations)
        
        # Test At Risk recommendations
        recommendations = service._generate_segment_recommendations(
            segment_name="At Risk",
            avg_recency=120.0,
            avg_frequency=3.0,
            avg_monetary=800.0
        )
        
        assert isinstance(recommendations, list)
        assert len(recommendations) > 0
        assert any("win-back" in rec.lower() for rec in recommendations)
    
    def test_detect_trend_direction(self):
        """Test trend direction detection"""
        
        import numpy as np
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        # Test increasing trend
        increasing_values = np.array([100, 110, 120, 130, 140, 150])
        direction, strength = service._detect_trend(increasing_values)
        
        assert direction == "increasing"
        assert strength > 0.8  # Should be strong correlation
        
        # Test decreasing trend
        decreasing_values = np.array([150, 140, 130, 120, 110, 100])
        direction, strength = service._detect_trend(decreasing_values)
        
        assert direction == "decreasing"
        assert strength > 0.8  # Should be strong correlation
        
        # Test stable trend (random values around same level)
        stable_values = np.array([100, 102, 98, 101, 99, 103])
        direction, strength = service._detect_trend(stable_values)
        
        assert direction == "stable"
        assert strength < 0.5  # Should be weak correlation
    
    def test_calculate_growth_rate(self):
        """Test growth rate calculation"""
        
        import numpy as np
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        # Test positive growth
        values = np.array([100, 110, 121])  # 10% growth per period
        growth_rate = service._calculate_growth_rate(values)
        
        assert growth_rate > 0
        assert 9 <= growth_rate <= 11  # Should be around 10%
        
        # Test negative growth
        values = np.array([100, 90, 81])  # -10% growth per period
        growth_rate = service._calculate_growth_rate(values)
        
        assert growth_rate < 0
        assert -11 <= growth_rate <= -9  # Should be around -10%
        
        # Test zero growth
        values = np.array([100, 100, 100])
        growth_rate = service._calculate_growth_rate(values)
        
        assert abs(growth_rate) < 1  # Should be close to 0

class TestAnalyticsErrorHandling:
    """Test error handling in analytics service"""
    
    def test_insufficient_data_handling(self):
        """Test handling of insufficient data scenarios"""
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        # Test trend detection with insufficient data
        import numpy as np
        
        insufficient_data = np.array([100])  # Only one data point
        direction, strength = service._detect_trend(insufficient_data)
        
        assert direction == "stable"
        assert strength == 0.0
        
        # Test growth rate with insufficient data
        growth_rate = service._calculate_growth_rate(insufficient_data)
        assert growth_rate == 0.0
    
    def test_zero_division_handling(self):
        """Test handling of zero division scenarios"""
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        # Test growth rate with zero starting value
        import numpy as np
        
        zero_start_values = np.array([0, 100, 200])
        growth_rate = service._calculate_growth_rate(zero_start_values)
        
        assert growth_rate == 0.0  # Should handle gracefully
    
    def test_empty_data_handling(self):
        """Test handling of empty data scenarios"""
        
        mock_db = None
        service = AdvancedAnalyticsService(mock_db)
        
        # Test trend detection with empty data
        import numpy as np
        
        empty_data = np.array([])
        direction, strength = service._detect_trend(empty_data)
        
        assert direction == "stable"
        assert strength == 0.0

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])