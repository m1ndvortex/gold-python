"""
Simple tests for Category Intelligence System
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from database import get_db
from services.category_intelligence_service import CategoryIntelligenceService
from models import Category, InventoryItem, Customer, Invoice, InvoiceItem
import uuid


@pytest.fixture
def test_db():
    """Get database session"""
    return next(get_db())


@pytest.mark.asyncio
async def test_category_intelligence_service_creation(test_db: Session):
    """Test that the service can be created"""
    service = CategoryIntelligenceService(test_db)
    assert service is not None
    assert service.db == test_db


@pytest.mark.asyncio
async def test_analyze_category_performance_empty(test_db: Session):
    """Test category performance analysis with no data"""
    service = CategoryIntelligenceService(test_db)
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    performances = await service.analyze_category_performance(
        start_date=start_date,
        end_date=end_date
    )
    
    # Should return empty list when no data
    assert isinstance(performances, list)


@pytest.mark.asyncio
async def test_analyze_seasonal_patterns_empty(test_db: Session):
    """Test seasonal analysis with no data"""
    service = CategoryIntelligenceService(test_db)
    
    patterns = await service.analyze_seasonal_patterns()
    
    # Should return empty list when no data
    assert isinstance(patterns, list)


@pytest.mark.asyncio
async def test_identify_cross_selling_opportunities_empty(test_db: Session):
    """Test cross-selling analysis with no data"""
    service = CategoryIntelligenceService(test_db)
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    opportunities = await service.identify_cross_selling_opportunities(
        start_date=start_date,
        end_date=end_date
    )
    
    # Should return empty list when no data
    assert isinstance(opportunities, list)


def test_api_endpoints_exist():
    """Test that API endpoints are accessible"""
    from fastapi.testclient import TestClient
    from main import app
    
    client = TestClient(app)
    
    # Test endpoints return proper status codes (even if empty)
    response = client.get("/api/category-intelligence/performance")
    assert response.status_code in [200, 422]  # 422 for validation errors is OK
    
    response = client.get("/api/category-intelligence/seasonal-patterns")
    assert response.status_code in [200, 422]
    
    response = client.get("/api/category-intelligence/cross-selling")
    assert response.status_code in [200, 422]
    
    response = client.get("/api/category-intelligence/insights/summary")
    assert response.status_code in [200, 422]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])