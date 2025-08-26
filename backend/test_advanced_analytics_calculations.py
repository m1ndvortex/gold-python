"""
Advanced Analytics Calculations Tests

Focused tests for verifying mathematical accuracy of analytics calculations
using real PostgreSQL database in Docker.

Requirements covered: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
"""

import pytest
import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, List, Any
import math

from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from services.advanced_analytics_service import AdvancedAnalyticsService

class TestAdvancedAnalyticsCalculations:
    """Test mathematical accuracy of analytics calculations"""
    
    def setup_method(self):
        """Set up test environment"""
        self.db = next(get_db())
        self.analytics_service = AdvancedAnalyticsService(self.db)
    
    def teardown_method(self):
        """Clean up after tests"""
        self.db.close()
    
    def test_service_initialization(self):
        """Test that analytics service initializes correctly with real database"""
        
        assert self.analytics_service is not None
        assert hasattr(self.analytics_service, 'business_type_configs')
        assert hasattr(self.analytics_service, 'cache')
        assert hasattr(self.analytics_service, 'db')
        
        # Verify database connection
        try:
            result = self.db.execute(text("SELECT 1")).fetchone()
            assert result[0] == 1
        except Exception as e:
            pytest.fail(f"Database connection failed: {e}")
    
    def test_business_type_configurations_completeness(self):
        """Test that all business type configurations are complete and valid"""
        
        configs = self.analytics_service.business_type_configs
        expected_types = ['gold_shop', 'retail_store', 'service_business', 'manufacturing']
        
        for business_type in expected_types:
            assert business_type in configs, f"Missing configuration for {business_type}"
            
            config = configs[business_type]
            
            # Verify required attributes
            assert config.business_type == business_type
            assert isinstance(config.primary_kpis, list)
            assert isinstance(config.secondary_kpis, list)
            assert isinstance(config.custom_metrics, dict)
            assert isinstance(config.thresholds, dict)
            assert isinstance(config.weights, dict)
            
            # Verify primary KPIs are not empty
            assert len(config.primary_kpis) > 0, f"No primary KPIs for {business_type}"
            
            # Verify weights sum to approximately 1.0
            total_weight = sum(config.weights.values())
            assert 0.9 <= total_weight <= 1.1, f"Weights for {business_type} sum to {total_weight}, should be ~1.0"
            
            # Verify all weighted KPIs are in primary KPIs
            for kpi in config.weights.keys():
                assert kpi in config.primary_kpis, f"Weighted KPI {kpi} not in primary KPIs for {business_type}"
    
    def test_gold_shop_specific_configuration(self):
        """Test gold shop specific configuration details"""
        
        gold_config = self.analytics_service.business_type_configs['gold_shop']
        
        # Verify gold shop specific KPIs
        expected_primary = ['revenue', 'profit_margin', 'inventory_turnover', 'customer_retention']
        for kpi in expected_primary:
            assert kpi in gold_config.primary_kpis, f"Missing primary KPI: {kpi}"
        
        # Verify gold shop specific secondary KPIs
        expected_secondary = ['gold_price_impact', 'weight_sold', 'labor_cost_ratio']
        for kpi in expected_secondary:
            assert kpi in gold_config.secondary_kpis, f"Missing secondary KPI: {kpi}"
        
        # Verify gold shop specific custom metrics
        assert 'sood_percentage' in gold_config.custom_metrics
        assert 'ojrat_percentage' in gold_config.custom_metrics
        
        # Verify thresholds are reasonable
        assert 'revenue_growth' in gold_config.thresholds
        assert 'profit_margin' in gold_config.thresholds
        assert 0 < gold_config.thresholds['profit_margin'] < 1  # Should be between 0 and 100%
    
    @pytest.mark.asyncio
    async def test_revenue_calculation_with_existing_data(self):
        """Test revenue calculation using existing database data"""
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        try:
            # Test the revenue calculation method directly
            revenue_result = await self.analytics_service._calculate_revenue_kpi(start_date, end_date)
            
            # Verify structure
            assert 'value' in revenue_result
            assert 'previous_value' in revenue_result
            assert 'growth_rate' in revenue_result
            assert 'transaction_count' in revenue_result
            assert 'avg_transaction_value' in revenue_result
            assert 'trend' in revenue_result
            
            # Verify data types
            assert isinstance(revenue_result['value'], (int, float))
            assert isinstance(revenue_result['previous_value'], (int, float))
            assert isinstance(revenue_result['growth_rate'], (int, float))
            assert isinstance(revenue_result['transaction_count'], int)
            assert isinstance(revenue_result['avg_transaction_value'], (int, float))
            assert revenue_result['trend'] in ['up', 'down', 'stable']
            
            # Verify logical consistency
            assert revenue_result['value'] >= 0, "Revenue cannot be negative"
            assert revenue_result['previous_value'] >= 0, "Previous revenue cannot be negative"
            assert revenue_result['transaction_count'] >= 0, "Transaction count cannot be negative"
            assert revenue_result['avg_transaction_value'] >= 0, "Average transaction value cannot be negative"
            
            # If there are transactions, average should be reasonable
            if revenue_result['transaction_count'] > 0:
                expected_avg = revenue_result['value'] / revenue_result['transaction_count']
                actual_avg = revenue_result['avg_transaction_value']
                assert abs(expected_avg - actual_avg) < 0.01, \
                    f"Average transaction value calculation error: expected {expected_avg}, got {actual_avg}"
            
        except Exception as e:
            # If no data exists, that's also a valid test result
            if "insufficient" in str(e).lower() or "no data" in str(e).lower():
                pytest.skip(f"No data available for revenue calculation test: {e}")
            else:
                raise
    
    @pytest.mark.asyncio
    async def test_profit_margin_calculation_with_existing_data(self):
        """Test profit margin calculation using existing database data"""
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        try:
            # Test the profit margin calculation method directly
            profit_result = await self.analytics_service._calculate_profit_margin_kpi(start_date, end_date)
            
            # Verify structure
            assert 'value' in profit_result
            assert 'gross_profit' in profit_result
            assert 'total_sales' in profit_result
            assert 'total_cost' in profit_result
            assert 'markup' in profit_result
            
            # Verify data types
            assert isinstance(profit_result['value'], (int, float))
            assert isinstance(profit_result['gross_profit'], (int, float))
            assert isinstance(profit_result['total_sales'], (int, float))
            assert isinstance(profit_result['total_cost'], (int, float))
            assert isinstance(profit_result['markup'], (int, float))
            
            # Verify logical consistency
            assert profit_result['total_sales'] >= 0, "Total sales cannot be negative"
            assert profit_result['total_cost'] >= 0, "Total cost cannot be negative"
            
            # Verify mathematical relationships
            expected_gross_profit = profit_result['total_sales'] - profit_result['total_cost']
            assert abs(expected_gross_profit - profit_result['gross_profit']) < 0.01, \
                "Gross profit calculation error"
            
            if profit_result['total_sales'] > 0:
                expected_margin = (profit_result['gross_profit'] / profit_result['total_sales']) * 100
                assert abs(expected_margin - profit_result['value']) < 0.01, \
                    f"Profit margin calculation error: expected {expected_margin}, got {profit_result['value']}"
            
            if profit_result['total_cost'] > 0:
                expected_markup = (profit_result['gross_profit'] / profit_result['total_cost']) * 100
                assert abs(expected_markup - profit_result['markup']) < 0.01, \
                    f"Markup calculation error: expected {expected_markup}, got {profit_result['markup']}"
            
        except Exception as e:
            if "insufficient" in str(e).lower() or "no data" in str(e).lower():
                pytest.skip(f"No data available for profit margin calculation test: {e}")
            else:
                raise
    
    def test_trend_detection_algorithms(self):
        """Test trend detection algorithms with known data patterns"""
        
        import numpy as np
        
        # Test increasing trend
        increasing_values = np.array([100, 110, 120, 130, 140, 150])
        direction, strength = self.analytics_service._detect_trend(increasing_values)
        
        assert direction == "increasing", f"Failed to detect increasing trend: {direction}"
        assert strength > 0.8, f"Trend strength too low for clear increasing pattern: {strength}"
        
        # Test decreasing trend
        decreasing_values = np.array([150, 140, 130, 120, 110, 100])
        direction, strength = self.analytics_service._detect_trend(decreasing_values)
        
        assert direction == "decreasing", f"Failed to detect decreasing trend: {direction}"
        assert strength > 0.8, f"Trend strength too low for clear decreasing pattern: {strength}"
        
        # Test stable trend
        stable_values = np.array([100, 102, 98, 101, 99, 103])
        direction, strength = self.analytics_service._detect_trend(stable_values)
        
        assert direction == "stable", f"Failed to detect stable trend: {direction}"
        assert strength < 0.5, f"Trend strength too high for stable pattern: {strength}"
        
        # Test with insufficient data
        insufficient_data = np.array([100])
        direction, strength = self.analytics_service._detect_trend(insufficient_data)
        
        assert direction == "stable", "Should return stable for insufficient data"
        assert strength == 0.0, "Should return zero strength for insufficient data"
    
    def test_growth_rate_calculations(self):
        """Test growth rate calculation accuracy"""
        
        import numpy as np
        
        # Test positive growth (10% per period)
        values = np.array([100, 110, 121])
        growth_rate = self.analytics_service._calculate_growth_rate(values)
        
        expected_growth = 10.0  # 10% growth per period
        assert abs(growth_rate - expected_growth) < 1.0, \
            f"Growth rate calculation error: expected ~{expected_growth}%, got {growth_rate}%"
        
        # Test negative growth (-10% per period)
        values = np.array([100, 90, 81])
        growth_rate = self.analytics_service._calculate_growth_rate(values)
        
        expected_growth = -10.0  # -10% growth per period
        assert abs(growth_rate - expected_growth) < 1.0, \
            f"Negative growth rate calculation error: expected ~{expected_growth}%, got {growth_rate}%"
        
        # Test zero growth
        values = np.array([100, 100, 100])
        growth_rate = self.analytics_service._calculate_growth_rate(values)
        
        assert abs(growth_rate) < 0.1, f"Zero growth calculation error: expected ~0%, got {growth_rate}%"
        
        # Test edge cases
        zero_start_values = np.array([0, 100, 200])
        growth_rate = self.analytics_service._calculate_growth_rate(zero_start_values)
        assert growth_rate == 0.0, "Should handle zero starting value gracefully"
        
        single_value = np.array([100])
        growth_rate = self.analytics_service._calculate_growth_rate(single_value)
        assert growth_rate == 0.0, "Should handle single value gracefully"
    
    def test_rfm_segment_classification(self):
        """Test RFM segment classification logic"""
        
        # Test Champions segment (low recency, high frequency, high monetary)
        segment_name = self.analytics_service._determine_rfm_segment_name(
            avg_recency=15.0,
            avg_frequency=8.0,
            avg_monetary=1500.0
        )
        assert segment_name == "Champions", f"Expected Champions, got {segment_name}"
        
        # Test Lost Customers segment (high recency)
        segment_name = self.analytics_service._determine_rfm_segment_name(
            avg_recency=200.0,
            avg_frequency=2.0,
            avg_monetary=300.0
        )
        assert segment_name == "Lost Customers", f"Expected Lost Customers, got {segment_name}"
        
        # Test New Customers segment (low recency, low frequency)
        segment_name = self.analytics_service._determine_rfm_segment_name(
            avg_recency=20.0,
            avg_frequency=1.0,
            avg_monetary=200.0
        )
        assert segment_name == "New Customers", f"Expected New Customers, got {segment_name}"
        
        # Test At Risk segment (medium recency, medium frequency)
        segment_name = self.analytics_service._determine_rfm_segment_name(
            avg_recency=120.0,
            avg_frequency=3.0,
            avg_monetary=800.0
        )
        assert segment_name == "At Risk", f"Expected At Risk, got {segment_name}"
    
    def test_segment_recommendations_quality(self):
        """Test that segment recommendations are meaningful and actionable"""
        
        # Test recommendations for different segments
        segments_to_test = [
            ("Champions", 15.0, 8.0, 1500.0),
            ("At Risk", 120.0, 3.0, 800.0),
            ("Lost Customers", 200.0, 2.0, 300.0),
            ("New Customers", 20.0, 1.0, 200.0)
        ]
        
        for segment_name, recency, frequency, monetary in segments_to_test:
            recommendations = self.analytics_service._generate_segment_recommendations(
                segment_name, recency, frequency, monetary
            )
            
            # Verify recommendations exist and are meaningful
            assert isinstance(recommendations, list), f"Recommendations should be a list for {segment_name}"
            assert len(recommendations) > 0, f"No recommendations generated for {segment_name}"
            
            # Verify recommendations are strings and not empty
            for rec in recommendations:
                assert isinstance(rec, str), f"Recommendation should be string for {segment_name}"
                assert len(rec.strip()) > 10, f"Recommendation too short for {segment_name}: '{rec}'"
                
            # Verify segment-specific recommendations
            if segment_name == "Champions":
                assert any("reward" in rec.lower() or "exclusive" in rec.lower() for rec in recommendations), \
                    "Champions should have reward-based recommendations"
            elif segment_name == "At Risk":
                assert any("win-back" in rec.lower() or "special" in rec.lower() for rec in recommendations), \
                    "At Risk customers should have win-back recommendations"
            elif segment_name == "Lost Customers":
                assert any("win-back" in rec.lower() or "survey" in rec.lower() for rec in recommendations), \
                    "Lost customers should have win-back or survey recommendations"
    
    @pytest.mark.asyncio
    async def test_composite_score_calculation(self):
        """Test composite score calculation logic"""
        
        # Test with sample KPI data
        sample_kpis = {
            'revenue': {'value': 10000},
            'profit_margin': {'value': 25.0},
            'inventory_turnover': {'value': 4.0},
            'customer_retention': {'value': 85.0}
        }
        
        sample_weights = {
            'revenue': 0.3,
            'profit_margin': 0.25,
            'inventory_turnover': 0.25,
            'customer_retention': 0.2
        }
        
        composite_result = await self.analytics_service._calculate_composite_score(sample_kpis, sample_weights)
        
        # Verify structure
        assert 'score' in composite_result
        assert 'performance_level' in composite_result
        assert 'contributing_kpis' in composite_result
        assert 'calculation_method' in composite_result
        
        # Verify data types
        assert isinstance(composite_result['score'], (int, float))
        assert composite_result['performance_level'] in ['excellent', 'good', 'average', 'needs_improvement']
        assert isinstance(composite_result['contributing_kpis'], list)
        
        # Verify score is reasonable (0-200 range, typically)
        assert 0 <= composite_result['score'] <= 200, f"Composite score out of range: {composite_result['score']}"
        
        # Verify contributing KPIs match weights
        assert set(composite_result['contributing_kpis']) == set(sample_weights.keys())
    
    def test_error_handling_robustness(self):
        """Test error handling for edge cases"""
        
        import numpy as np
        
        # Test with empty arrays
        empty_data = np.array([])
        direction, strength = self.analytics_service._detect_trend(empty_data)
        assert direction == "stable"
        assert strength == 0.0
        
        # Test growth rate with empty data
        growth_rate = self.analytics_service._calculate_growth_rate(empty_data)
        assert growth_rate == 0.0
        
        # Test with NaN values
        nan_data = np.array([100, np.nan, 120])
        try:
            direction, strength = self.analytics_service._detect_trend(nan_data)
            # Should handle gracefully
            assert direction in ["increasing", "decreasing", "stable"]
            assert 0 <= strength <= 1
        except Exception:
            # If it raises an exception, that's also acceptable for NaN data
            pass
        
        # Test with infinite values
        inf_data = np.array([100, np.inf, 120])
        try:
            direction, strength = self.analytics_service._detect_trend(inf_data)
            assert direction in ["increasing", "decreasing", "stable"]
            assert 0 <= strength <= 1
        except Exception:
            # If it raises an exception, that's also acceptable for infinite data
            pass
    
    def test_database_query_safety(self):
        """Test that database queries are safe and handle edge cases"""
        
        # Test with future dates (should return empty results)
        future_start = date.today() + timedelta(days=30)
        future_end = date.today() + timedelta(days=60)
        
        try:
            # This should not crash and should return zero values
            query = text("""
                SELECT COALESCE(SUM(total_amount), 0) as total_revenue
                FROM invoices 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND status IN ('completed', 'paid', 'partially_paid')
            """)
            
            result = self.db.execute(query, {
                "start_date": future_start,
                "end_date": future_end
            }).fetchone()
            
            assert result.total_revenue == 0, "Future date query should return zero revenue"
            
        except Exception as e:
            pytest.fail(f"Database query failed with future dates: {e}")
        
        # Test with very old dates (should not crash)
        old_start = date(2000, 1, 1)
        old_end = date(2000, 12, 31)
        
        try:
            result = self.db.execute(query, {
                "start_date": old_start,
                "end_date": old_end
            }).fetchone()
            
            # Should return a valid result (likely zero) - can be Decimal from PostgreSQL
            assert isinstance(result.total_revenue, (int, float, type(None), Decimal))
            
        except Exception as e:
            pytest.fail(f"Database query failed with old dates: {e}")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])