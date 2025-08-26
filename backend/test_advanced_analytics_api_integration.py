"""
Integration Tests for Advanced Analytics API Endpoints

Tests the API endpoints for advanced analytics functionality using real PostgreSQL database in Docker.

Requirements covered: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, date, timedelta
from decimal import Decimal

from main import app
from database import get_db, Base, engine
from models import User, Customer, Category, InventoryItem, Invoice, InvoiceItem
from auth import create_access_token

client = TestClient(app)

@pytest.fixture(scope="function")
def test_db():
    """Create test database tables"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def auth_headers():
    """Create authentication headers for API requests"""
    # Create a test user token
    test_user_data = {"sub": "test_user", "permissions": ["view_reports", "export_data"]}
    token = create_access_token(data=test_user_data)
    return {"Authorization": f"Bearer {token}"}

class TestAdvancedAnalyticsAPI:
    """Test suite for Advanced Analytics API endpoints"""
    
    def test_get_business_type_configs(self, test_db, auth_headers):
        """Test getting business type configurations"""
        
        response = client.get("/advanced-analytics/business-types/configs", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "business_type_configs" in data
        assert "total_business_types" in data
        assert "retrieved_at" in data
        
        # Verify expected business types are present
        configs = data["business_type_configs"]
        expected_types = ["gold_shop", "retail_store", "service_business", "manufacturing"]
        
        for business_type in expected_types:
            assert business_type in configs
            config = configs[business_type]
            
            assert "primary_kpis" in config
            assert "secondary_kpis" in config
            assert "custom_metrics" in config
            assert "thresholds" in config
            assert "weights" in config
            
            assert isinstance(config["primary_kpis"], list)
            assert len(config["primary_kpis"]) > 0
    
    def test_get_available_metrics(self, test_db, auth_headers):
        """Test getting available metrics for analysis"""
        
        response = client.get("/advanced-analytics/metrics/available", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "available_metrics" in data
        assert "total_metrics" in data
        assert "retrieved_at" in data
        
        metrics = data["available_metrics"]
        assert isinstance(metrics, list)
        assert len(metrics) > 0
        
        # Verify some expected metrics are present
        expected_metrics = ["revenue", "profit_margin", "inventory_turnover", "customer_retention"]
        for metric in expected_metrics:
            assert metric in metrics
    
    def test_get_available_metrics_filtered_by_business_type(self, test_db, auth_headers):
        """Test getting available metrics filtered by business type"""
        
        response = client.get(
            "/advanced-analytics/metrics/available?business_type=gold_shop", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["business_type_filter"] == "gold_shop"
        metrics = data["available_metrics"]
        
        # Verify gold shop specific metrics are included
        gold_specific_metrics = ["gold_price_impact", "weight_sold", "labor_cost_ratio"]
        for metric in gold_specific_metrics:
            assert metric in metrics
    
    def test_calculate_advanced_kpis_request(self, test_db, auth_headers):
        """Test advanced KPI calculation request"""
        
        request_data = {
            "business_type": "gold_shop",
            "start_date": (date.today() - timedelta(days=30)).isoformat(),
            "end_date": date.today().isoformat(),
            "custom_metrics": {
                "custom_conversion_rate": {"target": 0.15, "weight": 0.1}
            },
            "include_trends": True,
            "include_forecasts": True
        }
        
        response = client.post(
            "/advanced-analytics/kpis/calculate",
            json=request_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "calculation_id" in data
        assert "status" in data
        
        # For short periods, should return immediate results
        if data["status"] == "completed":
            assert "data" in data
            assert "processing_time" in data
        else:
            # For longer periods, should return task ID
            assert "message" in data
            assert "estimated_completion" in data
    
    def test_customer_segmentation_request(self, test_db, auth_headers):
        """Test customer segmentation request"""
        
        request_data = {
            "segmentation_method": "rfm",
            "num_segments": 5,
            "analysis_period_days": 180,
            "include_recommendations": True
        }
        
        response = client.post(
            "/advanced-analytics/customers/segmentation",
            json=request_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "segmentation_id" in data
        assert "status" in data
        assert data["status"] == "processing"
        assert "method" in data
        assert data["method"] == "rfm"
        assert "num_segments" in data
        assert data["num_segments"] == 5
        assert "message" in data
        assert "estimated_completion" in data
    
    def test_trend_analysis_request(self, test_db, auth_headers):
        """Test trend analysis request"""
        
        request_data = {
            "metric_name": "revenue",
            "entity_type": "overall",
            "analysis_period_days": 90,
            "forecast_periods": 30,
            "include_seasonality": True
        }
        
        response = client.post(
            "/advanced-analytics/trends/analyze",
            json=request_data,
            headers=auth_headers
        )
        
        # This might fail due to insufficient data, but should not return 500 error
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            data = response.json()
            assert "analysis_id" in data
            assert "status" in data
            assert "metric_name" in data
            assert data["metric_name"] == "revenue"
    
    def test_comparative_analysis_request(self, test_db, auth_headers):
        """Test comparative analysis request"""
        
        request_data = {
            "comparison_type": "time_period",
            "baseline_config": {
                "start_date": (date.today() - timedelta(days=60)).isoformat(),
                "end_date": (date.today() - timedelta(days=30)).isoformat(),
                "type": "time_period"
            },
            "comparison_configs": [
                {
                    "start_date": (date.today() - timedelta(days=30)).isoformat(),
                    "end_date": date.today().isoformat(),
                    "type": "time_period"
                }
            ],
            "metrics": ["revenue", "profit_margin"],
            "include_significance_tests": True
        }
        
        response = client.post(
            "/advanced-analytics/comparative/analyze",
            json=request_data,
            headers=auth_headers
        )
        
        # This might fail due to insufficient data, but should not return 500 error
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            data = response.json()
            assert "analysis_id" in data
            assert "status" in data
            assert "comparison_type" in data
            assert data["comparison_type"] == "time_period"
    
    def test_anomaly_detection_request(self, test_db, auth_headers):
        """Test anomaly detection request"""
        
        request_data = {
            "metric_name": "revenue",
            "detection_method": "statistical",
            "sensitivity": 0.1,
            "lookback_days": 90,
            "include_context": True
        }
        
        response = client.post(
            "/advanced-analytics/anomalies/detect",
            json=request_data,
            headers=auth_headers
        )
        
        # This might fail due to insufficient data, but should not return 500 error
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            data = response.json()
            assert "detection_id" in data
            assert "status" in data
            assert "metric_name" in data
            assert data["metric_name"] == "revenue"
            assert "detection_method" in data
            assert data["detection_method"] == "statistical"
    
    def test_data_export_request(self, test_db, auth_headers):
        """Test data export request"""
        
        request_data = {
            "export_format": "json",
            "data_type": "transactions",
            "filters": {
                "start_date": (date.today() - timedelta(days=30)).isoformat(),
                "end_date": date.today().isoformat()
            },
            "include_metadata": True,
            "date_range": {
                "start": (date.today() - timedelta(days=30)).isoformat(),
                "end": date.today().isoformat()
            }
        }
        
        response = client.post(
            "/advanced-analytics/data/export",
            json=request_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "export_id" in data
        assert "status" in data
        assert data["status"] == "processing"
        assert "export_format" in data
        assert data["export_format"] == "json"
        assert "data_type" in data
        assert data["data_type"] == "transactions"
        assert "message" in data
        assert "estimated_completion" in data
    
    def test_health_check(self, test_db):
        """Test analytics service health check"""
        
        response = client.get("/advanced-analytics/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "service" in data
        assert data["service"] == "advanced_analytics"
        assert "status" in data
        assert "timestamp" in data
        assert "version" in data
    
    def test_unauthorized_access(self, test_db):
        """Test that endpoints require authentication"""
        
        # Test without authentication headers
        response = client.get("/advanced-analytics/business-types/configs")
        
        assert response.status_code == 401
    
    def test_invalid_business_type(self, test_db, auth_headers):
        """Test handling of invalid business type"""
        
        request_data = {
            "business_type": "invalid_business_type",
            "start_date": (date.today() - timedelta(days=30)).isoformat(),
            "end_date": date.today().isoformat()
        }
        
        response = client.post(
            "/advanced-analytics/kpis/calculate",
            json=request_data,
            headers=auth_headers
        )
        
        # Should handle gracefully, either with default config or error
        assert response.status_code in [200, 400, 422]
    
    def test_invalid_date_range(self, test_db, auth_headers):
        """Test handling of invalid date ranges"""
        
        request_data = {
            "business_type": "gold_shop",
            "start_date": date.today().isoformat(),  # Start date after end date
            "end_date": (date.today() - timedelta(days=30)).isoformat()
        }
        
        response = client.post(
            "/advanced-analytics/kpis/calculate",
            json=request_data,
            headers=auth_headers
        )
        
        # Should return validation error
        assert response.status_code == 422

class TestAnalyticsTaskStatus:
    """Test task status endpoints"""
    
    def test_get_task_status_invalid_id(self, test_db, auth_headers):
        """Test getting status of non-existent task"""
        
        response = client.get(
            "/advanced-analytics/tasks/invalid-task-id/status",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "task_id" in data
        assert data["task_id"] == "invalid-task-id"
        assert "status" in data
        # Should return pending or failed status for invalid task ID

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])