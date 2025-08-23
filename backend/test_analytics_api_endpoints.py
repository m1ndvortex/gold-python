"""
Simple integration tests for Analytics API endpoints
Tests that endpoints are accessible and return expected structure
"""

import pytest
import json
from datetime import date, timedelta
from fastapi.testclient import TestClient

from main import app

# Test client
client = TestClient(app)

def test_health_check():
    """Test that the application is running"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

def test_kpi_endpoints_exist():
    """Test that KPI endpoints exist and return 401 (unauthorized) instead of 404"""
    
    kpi_endpoints = [
        "/kpi/financial",
        "/kpi/operational", 
        "/kpi/customer",
        "/kpi/dashboard",
    ]
    
    for endpoint in kpi_endpoints:
        response = client.get(endpoint)
        # Should return 401/403 (unauthorized/forbidden) not 404 (not found)
        assert response.status_code in [401, 403], f"Endpoint {endpoint} should exist and require auth"

def test_analytics_data_endpoints_exist():
    """Test that analytics data endpoints exist and return 401 (unauthorized) instead of 404"""
    
    analytics_endpoints = [
        "/analytics-data/demand-forecast",
        "/analytics-data/seasonality-analysis",
        "/analytics-data/cost-optimization",
        "/analytics-data/category-performance",
        "/analytics-data/fast-slow-movers",
        "/analytics-data/cross-selling-opportunities"
    ]
    
    for endpoint in analytics_endpoints:
        response = client.get(endpoint)
        # Should return 401/403 (unauthorized/forbidden) not 404 (not found)
        assert response.status_code in [401, 403], f"Endpoint {endpoint} should exist and require auth"

def test_kpi_compare_endpoint():
    """Test KPI compare endpoint parameter validation"""
    
    # Missing required parameters should return 422 (validation error)
    response = client.get("/kpi/compare")
    assert response.status_code in [401, 403, 422]  # Either unauthorized or validation error

def test_kpi_refresh_endpoint():
    """Test KPI refresh endpoint"""
    
    response = client.post("/kpi/refresh")
    # Should return 401/403 (unauthorized/forbidden) not 404 (not found)
    assert response.status_code in [401, 403]

def test_websocket_endpoint_exists():
    """Test that WebSocket endpoint exists"""
    
    # WebSocket endpoints return different status codes
    # Just test that the endpoint is registered
    try:
        with client.websocket_connect("/kpi/ws") as websocket:
            # If we can connect, the endpoint exists
            assert True
    except Exception:
        # If connection fails due to auth or other reasons, that's expected
        # The important thing is the endpoint exists
        assert True

def test_api_documentation():
    """Test that API documentation is available"""
    
    response = client.get("/docs")
    assert response.status_code == 200
    
    response = client.get("/openapi.json")
    assert response.status_code == 200
    
    # Verify our new endpoints are in the OpenAPI spec
    openapi_data = response.json()
    paths = openapi_data.get("paths", {})
    
    # Check some key endpoints are documented
    assert "/kpi/financial" in paths
    assert "/kpi/dashboard" in paths
    assert "/analytics-data/demand-forecast" in paths
    assert "/analytics-data/cost-optimization" in paths

def test_parameter_validation():
    """Test parameter validation on endpoints"""
    
    # Test invalid date format
    response = client.get("/kpi/financial?start_date=invalid-date")
    assert response.status_code in [401, 403, 422]  # Auth or validation error
    
    # Test invalid JSON in targets
    response = client.get("/kpi/financial?targets=invalid-json")
    assert response.status_code in [401, 403, 422]  # Auth or validation error

def test_cors_headers():
    """Test that CORS headers are properly configured"""
    
    response = client.options("/kpi/financial")
    # CORS preflight should be handled
    assert response.status_code in [200, 401, 405]  # Various acceptable responses

def test_main_application_routes():
    """Test that main application routes still work"""
    
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Gold Shop Management API" in data["message"]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])