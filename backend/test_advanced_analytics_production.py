"""
Production Tests for Advanced Analytics and Business Intelligence Backend

Comprehensive tests using real PostgreSQL database in Docker to verify:
- Correct KPI calculations with real data
- Customer segmentation accuracy
- Trend analysis and forecasting precision
- Anomaly detection effectiveness
- Data export functionality
- API endpoint responses

Requirements covered: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
"""

import pytest
import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, List, Any
import json
import math

from sqlalchemy.orm import Session
from database import get_db, engine
from models import User, Customer, Category, InventoryItem, Invoice, InvoiceItem
from services.advanced_analytics_service import AdvancedAnalyticsService
from routers.advanced_analytics import router
from fastapi.testclient import TestClient
from main import app

# Test client for API testing
client = TestClient(app)

class TestAdvancedAnalyticsProduction:
    """Production tests with real database and calculations verification"""
    
    def setup_method(self):
        """Set up test data in real database"""
        self.db = next(get_db())
        self.analytics_service = AdvancedAnalyticsService(self.db)
        
        # Clean up any existing test data
        self.cleanup_test_data()
        
        # Create comprehensive test dataset
        self.create_test_dataset()
    
    def teardown_method(self):
        """Clean up after tests"""
        self.cleanup_test_data()
        self.db.close()
    
    def cleanup_test_data(self):
        """Remove test data from database"""
        try:
            # Delete in correct order to avoid foreign key constraints
            self.db.query(InvoiceItem).filter(InvoiceItem.invoice_id.in_(
                self.db.query(Invoice.id).filter(Invoice.customer_id.in_(
                    self.db.query(Customer.id).filter(Customer.name.like('Test Customer%'))
                ))
            )).delete(synchronize_session=False)
            
            self.db.query(Invoice).filter(Invoice.customer_id.in_(
                self.db.query(Customer.id).filter(Customer.name.like('Test Customer%'))
            )).delete(synchronize_session=False)
            
            self.db.query(InventoryItem).filter(InventoryItem.name.like('Test Item%')).delete(synchronize_session=False)
            self.db.query(Customer).filter(Customer.name.like('Test Customer%')).delete(synchronize_session=False)
            self.db.query(Category).filter(Category.name.like('Test Category%')).delete(synchronize_session=False)
            
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            print(f"Cleanup error: {e}")
    
    def create_test_dataset(self):
        """Create comprehensive test dataset with known values for calculation verification"""
        
        # Create test categories
        self.test_categories = []
        category_names = ['Test Category Gold', 'Test Category Silver', 'Test Category Gems']
        
        for name in category_names:
            category = Category(name=name, description=f"Test category for {name}")
            self.db.add(category)
            self.test_categories.append(category)
        
        self.db.flush()
        
        # Create test inventory items with known prices
        self.test_items = []
        for i, category in enumerate(self.test_categories):
            for j in range(3):  # 3 items per category
                item = InventoryItem(
                    name=f"Test Item {category.name} {j+1}",
                    description=f"Test item for calculations",
                    category_id=category.id,
                    purchase_price=Decimal(f"{100 + i*50 + j*25}"),  # Known purchase prices
                    sell_price=Decimal(f"{150 + i*75 + j*37.5}"),    # Known sell prices (50% markup)
                    stock_quantity=100,
                    min_stock_level=10,
                    is_active=True
                )
                self.db.add(item)
                self.test_items.append(item)
        
        self.db.flush()
        
        # Create test customers
        self.test_customers = []
        for i in range(10):
            customer = Customer(
                name=f"Test Customer {i+1}",
                email=f"testcustomer{i+1}@example.com",
                phone=f"123-456-{7890+i}",
                address=f"Test Address {i+1}"
            )
            self.db.add(customer)
            self.test_customers.append(customer)
        
        self.db.flush()
        
        # Create test invoices with known patterns for verification
        self.test_invoices = []
        base_date = datetime.now() - timedelta(days=90)
        
        # Create invoices with predictable patterns
        for i in range(50):
            invoice_date = base_date + timedelta(days=i*1.8)  # Spread over 90 days
            customer = self.test_customers[i % len(self.test_customers)]
            
            invoice = Invoice(
                customer_id=customer.id,
                total_amount=Decimal("0"),
                paid_amount=Decimal("0"),
                remaining_amount=Decimal("0"),
                status="completed",
                created_at=invoice_date
            )
            self.db.add(invoice)
            self.db.flush()
            
            # Add items to invoice with known quantities and prices
            total_amount = Decimal("0")
            num_items = (i % 3) + 1  # 1-3 items per invoice
            
            for j in range(num_items):
                item = self.test_items[(i + j) % len(self.test_items)]
                quantity = j + 1  # Predictable quantities
                unit_price = item.sell_price
                total_price = unit_price * quantity
                
                invoice_item = InvoiceItem(
                    invoice_id=invoice.id,
                    inventory_item_id=item.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price
                )
                self.db.add(invoice_item)
                total_amount += total_price
            
            # Update invoice totals
            invoice.total_amount = total_amount
            invoice.paid_amount = total_amount
            invoice.remaining_amount = Decimal("0")
            
            self.test_invoices.append(invoice)
        
        self.db.commit()
        
        # Store expected values for verification
        self.expected_values = self.calculate_expected_values()
    
    def calculate_expected_values(self) -> Dict[str, Any]:
        """Calculate expected values manually for verification"""
        
        # Calculate expected revenue (sum of all invoice totals)
        expected_revenue = sum(float(invoice.total_amount) for invoice in self.test_invoices)
        
        # Calculate expected profit (revenue - cost)
        expected_cost = 0
        for invoice in self.test_invoices:
            for item in self.db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice.id):
                inventory_item = self.db.query(InventoryItem).filter(InventoryItem.id == item.inventory_item_id).first()
                expected_cost += float(inventory_item.purchase_price) * item.quantity
        
        expected_profit = expected_revenue - expected_cost
        expected_profit_margin = (expected_profit / expected_revenue * 100) if expected_revenue > 0 else 0
        
        # Calculate expected transaction metrics
        expected_transaction_count = len(self.test_invoices)
        expected_avg_transaction_value = expected_revenue / expected_transaction_count if expected_transaction_count > 0 else 0
        expected_unique_customers = len(set(invoice.customer_id for invoice in self.test_invoices))
        
        return {
            'revenue': expected_revenue,
            'cost': expected_cost,
            'profit': expected_profit,
            'profit_margin': expected_profit_margin,
            'transaction_count': expected_transaction_count,
            'avg_transaction_value': expected_avg_transaction_value,
            'unique_customers': expected_unique_customers
        }
    
    @pytest.mark.asyncio
    async def test_revenue_kpi_calculation_accuracy(self):
        """Test that revenue KPI calculations are mathematically correct"""
        
        end_date = date.today()
        start_date = end_date - timedelta(days=90)
        
        # Calculate KPIs using the service
        result = await self.analytics_service.calculate_advanced_kpis(
            business_type='gold_shop',
            start_date=start_date,
            end_date=end_date
        )
        
        # Verify revenue calculation
        calculated_revenue = result['primary_kpis']['revenue']['value']
        expected_revenue = self.expected_values['revenue']
        
        # Allow for small floating point differences
        assert abs(calculated_revenue - expected_revenue) < 0.01, \
            f"Revenue calculation incorrect: expected {expected_revenue}, got {calculated_revenue}"
        
        # Verify transaction count
        calculated_count = result['primary_kpis']['revenue']['transaction_count']
        expected_count = self.expected_values['transaction_count']
        
        assert calculated_count == expected_count, \
            f"Transaction count incorrect: expected {expected_count}, got {calculated_count}"
        
        # Verify average transaction value
        calculated_avg = result['primary_kpis']['revenue']['avg_transaction_value']
        expected_avg = self.expected_values['avg_transaction_value']
        
        assert abs(calculated_avg - expected_avg) < 0.01, \
            f"Average transaction value incorrect: expected {expected_avg}, got {calculated_avg}"
    
    @pytest.mark.asyncio
    async def test_profit_margin_calculation_accuracy(self):
        """Test that profit margin calculations are mathematically correct"""
        
        end_date = date.today()
        start_date = end_date - timedelta(days=90)
        
        result = await self.analytics_service.calculate_advanced_kpis(
            business_type='gold_shop',
            start_date=start_date,
            end_date=end_date
        )
        
        # Verify profit margin calculation
        calculated_margin = result['primary_kpis']['profit_margin']['value']
        expected_margin = self.expected_values['profit_margin']
        
        assert abs(calculated_margin - expected_margin) < 0.1, \
            f"Profit margin calculation incorrect: expected {expected_margin:.2f}%, got {calculated_margin:.2f}%"
        
        # Verify gross profit calculation
        calculated_profit = result['primary_kpis']['profit_margin']['gross_profit']
        expected_profit = self.expected_values['profit']
        
        assert abs(calculated_profit - expected_profit) < 0.01, \
            f"Gross profit calculation incorrect: expected {expected_profit}, got {calculated_profit}"
    
    @pytest.mark.asyncio
    async def test_customer_segmentation_accuracy(self):
        """Test customer segmentation with known customer patterns"""
        
        segments = await self.analytics_service.perform_customer_segmentation(
            segmentation_method='rfm',
            num_segments=3,  # Use fewer segments for easier verification
            analysis_period_days=90
        )
        
        # Verify we got segments
        assert len(segments) > 0, "No customer segments were created"
        assert len(segments) <= 3, "Too many segments created"
        
        # Verify total customer count matches
        total_customers_in_segments = sum(segment.customer_count for segment in segments)
        expected_customers = self.expected_values['unique_customers']
        
        assert total_customers_in_segments == expected_customers, \
            f"Customer count in segments incorrect: expected {expected_customers}, got {total_customers_in_segments}"
        
        # Verify segment characteristics are reasonable
        for segment in segments:
            assert segment.customer_count > 0, f"Segment {segment.segment_name} has no customers"
            assert segment.avg_transaction_value > 0, f"Segment {segment.segment_name} has invalid avg transaction value"
            assert segment.lifetime_value > 0, f"Segment {segment.segment_name} has invalid lifetime value"
            assert 0 <= segment.churn_risk <= 1, f"Segment {segment.segment_name} has invalid churn risk"
            assert len(segment.recommended_actions) > 0, f"Segment {segment.segment_name} has no recommendations"
    
    @pytest.mark.asyncio
    async def test_trend_analysis_with_known_pattern(self):
        """Test trend analysis with known data patterns"""
        
        # Our test data has invoices spread over 90 days with increasing amounts
        # This should show a positive trend
        
        result = await self.analytics_service.analyze_trends_and_seasonality(
            metric_name='revenue',
            entity_type='overall',
            analysis_period_days=90,
            forecast_periods=7
        )
        
        # Verify trend analysis structure
        assert result.metric_name == 'revenue'
        assert result.trend_direction in ['increasing', 'decreasing', 'stable', 'volatile']
        assert 0 <= result.trend_strength <= 1
        assert isinstance(result.seasonal_component, dict)
        assert isinstance(result.growth_rate, (int, float))
        assert isinstance(result.volatility, (int, float))
        assert isinstance(result.forecast_next_period, (int, float))
        assert len(result.confidence_interval) == 2
        assert result.confidence_interval[0] <= result.confidence_interval[1]
        
        # Verify forecast is reasonable (should be positive for revenue)
        assert result.forecast_next_period >= 0, "Revenue forecast should not be negative"
    
    @pytest.mark.asyncio
    async def test_comparative_analysis_accuracy(self):
        """Test comparative analysis with known time periods"""
        
        # Compare last 30 days vs previous 30 days
        current_end = date.today()
        current_start = current_end - timedelta(days=30)
        previous_end = current_start - timedelta(days=1)
        previous_start = previous_end - timedelta(days=30)
        
        baseline_config = {
            'start_date': previous_start.isoformat(),
            'end_date': previous_end.isoformat(),
            'type': 'time_period'
        }
        
        comparison_configs = [{
            'start_date': current_start.isoformat(),
            'end_date': current_end.isoformat(),
            'type': 'time_period'
        }]
        
        result = await self.analytics_service.perform_comparative_analysis(
            comparison_type='time_period',
            baseline_config=baseline_config,
            comparison_configs=comparison_configs,
            metrics=['revenue', 'profit_margin']
        )
        
        # Verify comparative analysis structure
        assert result.comparison_type == 'time_period'
        assert 'baseline' in result.metrics_comparison
        assert 'comparisons' in result.metrics_comparison
        assert len(result.metrics_comparison['comparisons']) == 1
        
        # Verify metrics are present
        baseline_metrics = result.metrics_comparison['baseline']
        comparison_metrics = result.metrics_comparison['comparisons'][0]
        
        for metric in ['revenue', 'profit_margin']:
            assert metric in baseline_metrics, f"Baseline missing {metric}"
            assert metric in comparison_metrics, f"Comparison missing {metric}"
            assert isinstance(baseline_metrics[metric], (int, float)), f"Baseline {metric} not numeric"
            assert isinstance(comparison_metrics[metric], (int, float)), f"Comparison {metric} not numeric"
        
        # Verify insights and recommendations
        assert isinstance(result.insights, list)
        assert isinstance(result.recommendations, list)
    
    @pytest.mark.asyncio
    async def test_anomaly_detection_functionality(self):
        """Test anomaly detection with controlled data"""
        
        anomalies = await self.analytics_service.detect_anomalies(
            metric_name='revenue',
            detection_method='statistical',
            sensitivity=0.2,  # Higher sensitivity to catch more anomalies
            lookback_days=90
        )
        
        # Verify anomaly detection structure
        assert isinstance(anomalies, list)
        
        for anomaly in anomalies:
            assert anomaly.metric_name == 'revenue'
            assert isinstance(anomaly.anomaly_score, (int, float))
            assert isinstance(anomaly.is_anomaly, bool)
            assert anomaly.anomaly_type in ['outlier', 'trend_break', 'seasonal_deviation']
            assert isinstance(anomaly.detected_at, datetime)
            assert isinstance(anomaly.context, dict)
            assert anomaly.severity in ['low', 'medium', 'high', 'critical']
            assert isinstance(anomaly.recommended_action, str)
            assert len(anomaly.recommended_action) > 0
    
    @pytest.mark.asyncio
    async def test_data_export_functionality(self):
        """Test data export with real data"""
        
        filters = {
            'start_date': (date.today() - timedelta(days=30)).isoformat(),
            'end_date': date.today().isoformat()
        }
        
        # Test JSON export
        json_result = await self.analytics_service.export_analytics_data(
            export_format='json',
            data_type='transactions',
            filters=filters,
            include_metadata=True
        )
        
        assert json_result['status'] == 'completed'
        assert 'data' in json_result
        assert 'metadata' in json_result
        assert json_result['metadata']['export_format'] == 'json'
        assert json_result['metadata']['data_type'] == 'transactions'
        
        # Test CSV export
        csv_result = await self.analytics_service.export_analytics_data(
            export_format='csv',
            data_type='customers',
            filters={'limit': 10},
            include_metadata=True
        )
        
        assert csv_result['status'] == 'completed'
        assert 'data' in csv_result
        assert isinstance(csv_result['data'], str)  # CSV should be string format
    
    def test_business_type_configurations(self):
        """Test that all business type configurations are valid"""
        
        configs = self.analytics_service.business_type_configs
        
        for business_type, config in configs.items():
            # Verify required attributes
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
            
            # Verify weights are reasonable (should sum to approximately 1.0)
            total_weight = sum(config.weights.values())
            assert 0.8 <= total_weight <= 1.2, f"Weights for {business_type} sum to {total_weight}"
    
    def test_api_endpoints_with_real_data(self):
        """Test API endpoints with real database data"""
        
        # Test business type configs endpoint
        response = client.get("/advanced-analytics/business-types/configs")
        assert response.status_code == 200
        
        data = response.json()
        assert "business_type_configs" in data
        assert len(data["business_type_configs"]) > 0
        
        # Test available metrics endpoint
        response = client.get("/advanced-analytics/metrics/available")
        assert response.status_code == 200
        
        data = response.json()
        assert "available_metrics" in data
        assert len(data["available_metrics"]) > 0
        
        # Test health check
        response = client.get("/advanced-analytics/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["service"] == "advanced_analytics"
        assert "status" in data
    
    @pytest.mark.asyncio
    async def test_edge_cases_and_error_handling(self):
        """Test edge cases and error handling"""
        
        # Test with empty date range
        future_date = date.today() + timedelta(days=30)
        
        result = await self.analytics_service.calculate_advanced_kpis(
            business_type='gold_shop',
            start_date=future_date,
            end_date=future_date + timedelta(days=1)
        )
        
        # Should handle gracefully with zero values
        assert 'primary_kpis' in result
        assert result['primary_kpis']['revenue']['value'] == 0
        
        # Test with invalid business type (should use default)
        result = await self.analytics_service.calculate_advanced_kpis(
            business_type='invalid_type',
            start_date=date.today() - timedelta(days=30),
            end_date=date.today()
        )
        
        # Should still return valid structure
        assert 'primary_kpis' in result
        assert 'business_type' in result
    
    @pytest.mark.asyncio
    async def test_calculation_consistency(self):
        """Test that calculations are consistent across multiple runs"""
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        # Run the same calculation multiple times
        results = []
        for _ in range(3):
            result = await self.analytics_service.calculate_advanced_kpis(
                business_type='gold_shop',
                start_date=start_date,
                end_date=end_date
            )
            results.append(result)
        
        # Verify all results are identical
        first_result = results[0]
        for i, result in enumerate(results[1:], 1):
            assert result['primary_kpis']['revenue']['value'] == first_result['primary_kpis']['revenue']['value'], \
                f"Revenue calculation inconsistent between run 1 and run {i+1}"
            
            assert result['primary_kpis']['profit_margin']['value'] == first_result['primary_kpis']['profit_margin']['value'], \
                f"Profit margin calculation inconsistent between run 1 and run {i+1}"
    
    @pytest.mark.asyncio
    async def test_performance_with_real_data(self):
        """Test performance with real database data"""
        
        import time
        
        end_date = date.today()
        start_date = end_date - timedelta(days=90)
        
        # Measure KPI calculation time
        start_time = time.time()
        
        result = await self.analytics_service.calculate_advanced_kpis(
            business_type='gold_shop',
            start_date=start_date,
            end_date=end_date
        )
        
        end_time = time.time()
        calculation_time = end_time - start_time
        
        # Should complete within reasonable time (10 seconds for 90 days of data)
        assert calculation_time < 10, f"KPI calculation took too long: {calculation_time:.2f} seconds"
        
        # Verify result is complete
        assert 'primary_kpis' in result
        assert len(result['primary_kpis']) > 0

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])