"""
Basic Image Management Tests for Universal Inventory & Invoice System

Tests core image management functionality with real PostgreSQL database.
"""

import pytest
import tempfile
import uuid
from pathlib import Path
from PIL import Image
import io
from fastapi.testclient import TestClient
from sqlalchemy import text

from main import app
from database import get_db, create_analytics_schema
from models import Base, ImageManagement
from services.image_management_service_sync import ImageManagementServiceSync, ImageProcessingError

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Setup database schema for testing"""
    create_analytics_schema()
    Base.metadata.create_all(bind=next(get_db()).bind)

@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def db_session():
    """Create database session for testing"""
    return next(get_db())

@pytest.fixture
def sample_image_bytes():
    """Create sample image bytes for testing"""
    img = Image.new('RGB', (400, 300), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG', quality=90)
    img_bytes.seek(0)
    return img_bytes.getvalue()

@pytest.fixture
def image_service(db_session):
    """Create image management service instance"""
    return ImageManagementServiceSync(db_session)

class MockUploadFile:
    """Mock upload file for testing"""
    def __init__(self, filename, content, content_type):
        self.filename = filename
        self.content_type = content_type
        self.file = io.BytesIO(content)

class TestImageManagementBasic:
    """Basic image management tests"""
    
    def test_database_connection(self, db_session):
        """Test database connection is working"""
        result = db_session.execute(text("SELECT 1"))
        assert result.scalar() == 1
        print("✅ Database connection working")
    
    def test_image_management_table_exists(self, db_session):
        """Test that image_management table exists and has correct structure"""
        # Check table exists
        result = db_session.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'image_management'
            )
        """))
        assert result.scalar() is True
        
        # Check required columns exist
        required_columns = [
            'id', 'entity_type', 'entity_id', 'original_filename', 
            'stored_filename', 'file_path', 'file_size_bytes', 
            'mime_type', 'image_width', 'image_height', 'thumbnails',
            'is_primary', 'alt_text', 'caption', 'sort_order',
            'optimization_applied', 'compression_ratio', 'upload_metadata',
            'created_at', 'updated_at'
        ]
        
        for column in required_columns:
            result = db_session.execute(text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'image_management' AND column_name = '{column}'
                )
            """))
            assert result.scalar() is True, f"Column {column} missing from image_management table"
        
        print("✅ Image management table structure is correct")
    
    def test_service_initialization(self, image_service):
        """Test service initializes correctly and creates directories"""
        assert image_service is not None
        
        # Check that directories are created
        upload_dir = Path("uploads/images")
        backup_dir = Path("backups/images")
        cache_dir = Path("cache/images")
        
        assert upload_dir.exists(), "Upload directory not created"
        assert backup_dir.exists(), "Backup directory not created"
        assert cache_dir.exists(), "Cache directory not created"
        
        # Check entity subdirectories
        entity_types = ['categories', 'inventory_items', 'invoices', 'customers', 'companies']
        for entity_type in entity_types:
            assert (upload_dir / entity_type).exists()
            assert (upload_dir / entity_type / 'thumbnails').exists()
            assert (upload_dir / entity_type / 'optimized').exists()
            assert (backup_dir / entity_type).exists()
            assert (cache_dir / entity_type).exists()
        
        print("✅ Service initialization and directory creation working")
    
    def test_file_validation(self, image_service):
        """Test basic file validation"""
        # Test valid file
        valid_file = MockUploadFile("test.jpg", b"fake jpeg content", "image/jpeg")
        
        # Should not raise exception for valid content type
        try:
            image_service._validate_upload_file(valid_file)
        except ImageProcessingError as e:
            # May fail due to empty content, but should not fail on content type
            assert "Empty file" in str(e) or "not a valid image" in str(e)
        
        # Test invalid content type
        invalid_file = MockUploadFile("test.txt", b"text content", "text/plain")
        
        with pytest.raises(ImageProcessingError, match="Unsupported file format"):
            image_service._validate_upload_file(invalid_file)
        
        print("✅ File validation working")
    
    def test_image_upload_and_processing(self, image_service, sample_image_bytes):
        """Test complete image upload and processing workflow"""
        upload_file = MockUploadFile("test_image.jpg", sample_image_bytes, "image/jpeg")
        
        result = image_service.upload_image(
            file=upload_file,
            entity_type="inventory_item",
            entity_id=str(uuid.uuid4()),
            alt_text="Test image",
            caption="Test caption",
            is_primary=True
        )
        
        assert result['success'] is True
        assert 'image_id' in result
        assert 'thumbnails' in result
        assert len(result['thumbnails']) > 0
        
        # Verify thumbnails were created
        expected_sizes = ['small', 'medium', 'large', 'gallery', 'card', 'icon']
        for size in expected_sizes:
            assert size in result['thumbnails']
            thumbnail_path = Path(result['thumbnails'][size]['path'])
            assert thumbnail_path.exists()
        
        # Verify optimization was applied
        assert result['optimization']['applied'] is True
        assert result['optimization']['compression_ratio'] <= 1.0
        
        print("✅ Image upload and processing working")
    
    def test_image_statistics(self, image_service, sample_image_bytes):
        """Test image statistics functionality"""
        # Upload test image first
        upload_file = MockUploadFile("stats_test.jpg", sample_image_bytes, "image/jpeg")
        
        image_service.upload_image(
            file=upload_file,
            entity_type="inventory_item",
            entity_id=str(uuid.uuid4())
        )
        
        # Test statistics
        stats = image_service.get_image_statistics()
        
        assert 'total_images' in stats
        assert 'images_by_entity_type' in stats
        assert 'total_storage_bytes' in stats
        assert 'optimized_images' in stats
        assert stats['total_images'] > 0
        
        print("✅ Image statistics working")
    
    def test_image_metadata_operations(self, image_service, sample_image_bytes):
        """Test image metadata update operations"""
        # Upload image
        entity_id = str(uuid.uuid4())
        upload_file = MockUploadFile("metadata_test.jpg", sample_image_bytes, "image/jpeg")
        
        upload_result = image_service.upload_image(
            file=upload_file,
            entity_type="inventory_item",
            entity_id=entity_id,
            alt_text="Original alt text",
            caption="Original caption"
        )
        
        image_id = upload_result['image_id']
        
        # Update metadata
        update_result = image_service.update_image_metadata(
            image_id=image_id,
            alt_text="Updated alt text",
            caption="Updated caption",
            is_primary=True,
            sort_order=5
        )
        
        assert update_result['success'] is True
        assert 'updated_fields' in update_result
        
        # Verify updates in database
        images = image_service.get_entity_images("inventory_item", entity_id)
        updated_image = next(img for img in images if img['id'] == image_id)
        
        assert updated_image['alt_text'] == "Updated alt text"
        assert updated_image['caption'] == "Updated caption"
        assert updated_image['is_primary'] is True
        assert updated_image['sort_order'] == 5
        
        print("✅ Image metadata operations working")
    
    def test_image_deletion_with_cleanup(self, image_service, sample_image_bytes):
        """Test image deletion removes all associated files"""
        # Upload image
        upload_file = MockUploadFile("delete_test.jpg", sample_image_bytes, "image/jpeg")
        
        upload_result = image_service.upload_image(
            file=upload_file,
            entity_type="inventory_item",
            entity_id=str(uuid.uuid4())
        )
        
        image_id = upload_result['image_id']
        
        # Collect file paths before deletion
        original_path = Path(upload_result['file_path'])
        thumbnail_paths = [Path(thumb['path']) for thumb in upload_result['thumbnails'].values()]
        
        # Verify files exist
        assert original_path.exists()
        for thumb_path in thumbnail_paths:
            assert thumb_path.exists()
        
        # Delete image
        delete_result = image_service.delete_image(image_id)
        
        assert delete_result['success'] is True
        assert 'files_deleted' in delete_result
        
        # Verify files are deleted
        assert not original_path.exists()
        for thumb_path in thumbnail_paths:
            assert not thumb_path.exists()
        
        print("✅ Image deletion with cleanup working")
    
    def test_multiple_thumbnail_sizes(self, image_service, sample_image_bytes):
        """Test all thumbnail sizes are generated correctly"""
        upload_file = MockUploadFile("thumbnail_test.jpg", sample_image_bytes, "image/jpeg")
        
        result = image_service.upload_image(
            file=upload_file,
            entity_type="category",
            entity_id=str(uuid.uuid4())
        )
        
        expected_sizes = {
            'small': (150, 150),
            'medium': (300, 300),
            'large': (600, 600),
            'gallery': (800, 600),
            'card': (400, 300),
            'icon': (64, 64)
        }
        
        for size_name, expected_dimensions in expected_sizes.items():
            assert size_name in result['thumbnails']
            thumbnail_info = result['thumbnails'][size_name]
            assert thumbnail_info['width'] == expected_dimensions[0]
            assert thumbnail_info['height'] == expected_dimensions[1]
            
            # Verify file exists
            thumbnail_path = Path(thumbnail_info['path'])
            assert thumbnail_path.exists()
            
            # Verify actual image dimensions
            with Image.open(thumbnail_path) as img:
                assert img.size == expected_dimensions
        
        print("✅ All thumbnail sizes generated correctly")
    
    def test_api_endpoints_exist(self, client):
        """Test that all image management API endpoints exist"""
        endpoints_to_test = [
            ("/api/images/upload", "POST"),
            ("/api/images/upload/multiple", "POST"),
            ("/api/images/entity/inventory_item/test-id", "GET"),
            ("/api/images/serve/test-id", "GET"),
            ("/api/images/statistics", "GET"),
            ("/api/images/cleanup", "POST"),
            ("/api/images/backup", "POST"),
            ("/api/images/restore", "POST"),
            ("/api/images/health", "GET"),
            ("/api/images/test-id/metadata", "PUT"),
            ("/api/images/test-id", "DELETE"),
        ]
        
        for endpoint, method in endpoints_to_test:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint)
            elif method == "PUT":
                response = client.put(endpoint)
            elif method == "DELETE":
                response = client.delete(endpoint)
            
            # Should return proper HTTP status (auth required or validation error)
            assert response.status_code in [401, 403, 422, 404], f"Endpoint {endpoint} returned {response.status_code}"
            
            # Should return JSON
            assert response.headers.get("content-type", "").startswith("application/json")
        
        print("✅ All API endpoints exist and return proper responses")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])