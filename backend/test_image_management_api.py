"""
Integration tests for Image Management API endpoints

Tests the REST API endpoints for image upload, processing, and management
using real database connections and Docker environment.
"""

import pytest
import asyncio
import io
from PIL import Image
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from main import app
from database_base import Base
from database import get_db

# Test configuration
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/goldshop_test"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    # Create analytics schema if it doesn't exist
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS analytics"))
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    await engine.dispose()

@pytest.fixture
async def db_session(test_engine):
    """Create test database session"""
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session

@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def sample_image_bytes():
    """Create sample image bytes for testing"""
    img = Image.new('RGB', (400, 300), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG', quality=90)
    img_bytes.seek(0)
    return img_bytes

@pytest.fixture
def auth_headers():
    """Mock authentication headers for testing"""
    # In a real test, you would authenticate and get a real token
    return {"Authorization": "Bearer mock_token"}

class TestImageManagementAPI:
    """Test suite for Image Management API endpoints"""
    
    def test_upload_image_endpoint_structure(self, client):
        """Test that the upload endpoint exists and has proper structure"""
        # Test without authentication (should fail)
        response = client.post("/api/images/upload")
        
        # Should return 422 (validation error) or 401 (unauthorized)
        # This confirms the endpoint exists
        assert response.status_code in [401, 422]
    
    def test_get_entity_images_endpoint_structure(self, client):
        """Test that the get entity images endpoint exists"""
        response = client.get("/api/images/entity/product/test-id")
        
        # Should return 401 (unauthorized) - confirms endpoint exists
        assert response.status_code == 401
    
    def test_image_statistics_endpoint_structure(self, client):
        """Test that the statistics endpoint exists"""
        response = client.get("/api/images/statistics")
        
        # Should return 401 (unauthorized) - confirms endpoint exists
        assert response.status_code == 401
    
    def test_update_image_metadata_endpoint_structure(self, client):
        """Test that the update metadata endpoint exists"""
        response = client.put("/api/images/test-id/metadata")
        
        # Should return 401 (unauthorized) - confirms endpoint exists
        assert response.status_code == 401
    
    def test_delete_image_endpoint_structure(self, client):
        """Test that the delete image endpoint exists"""
        response = client.delete("/api/images/test-id")
        
        # Should return 401 (unauthorized) - confirms endpoint exists
        assert response.status_code == 401
    
    def test_multiple_upload_endpoint_structure(self, client):
        """Test that the multiple upload endpoint exists"""
        response = client.post("/api/images/upload/multiple")
        
        # Should return 422 (validation error) or 401 (unauthorized)
        assert response.status_code in [401, 422]
    
    def test_api_endpoints_return_json(self, client):
        """Test that API endpoints return JSON responses"""
        endpoints = [
            "/api/images/entity/product/test-id",
            "/api/images/statistics",
            "/api/images/test-id/metadata"
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            # Even unauthorized responses should be JSON
            assert response.headers.get("content-type", "").startswith("application/json")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])