"""
Comprehensive unit tests for Image Management Service

Tests image upload, processing, optimization, thumbnail generation, and all related functionality
using real database connections and file operations in Docker environment.
"""

import pytest
import asyncio
import tempfile
import shutil
from pathlib import Path
from PIL import Image
import io
import uuid
from unittest.mock import AsyncMock, MagicMock
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from services.image_management_service import ImageManagementService, ImageProcessingError
from database_base import Base
from models import ImageManagement
from database import get_db
from sqlalchemy import func

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
def temp_upload_dir():
    """Create temporary directory for test uploads"""
    temp_dir = tempfile.mkdtemp()
    yield Path(temp_dir)
    shutil.rmtree(temp_dir)

@pytest.fixture
def sample_image_file():
    """Create a sample image file for testing"""
    # Create a simple test image
    img = Image.new('RGB', (800, 600), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG', quality=90)
    img_bytes.seek(0)
    
    # Create UploadFile mock
    class MockUploadFile:
        def __init__(self, filename, file, content_type):
            self.filename = filename
            self.file = file
            self.content_type = content_type
        
        async def read(self):
            return self.file.read()
    
    upload_file = MockUploadFile(
        filename="test_image.jpg",
        file=img_bytes,
        content_type="image/jpeg"
    )
    
    return upload_file

@pytest.fixture
def large_sample_image_file():
    """Create a large sample image file for testing optimization"""
    # Create a larger test image
    img = Image.new('RGB', (2000, 1500), color='blue')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG', quality=95)
    img_bytes.seek(0)
    
    class MockUploadFile:
        def __init__(self, filename, file, content_type):
            self.filename = filename
            self.file = file
            self.content_type = content_type
        
        async def read(self):
            return self.file.read()
    
    upload_file = MockUploadFile(
        filename="large_test_image.jpg",
        file=img_bytes,
        content_type="image/jpeg"
    )
    
    return upload_file

@pytest.fixture
def png_sample_image_file():
    """Create a PNG sample image file with transparency"""
    # Create a PNG with transparency
    img = Image.new('RGBA', (400, 300), color=(255, 0, 0, 128))
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    class MockUploadFile:
        def __init__(self, filename, file, content_type):
            self.filename = filename
            self.file = file
            self.content_type = content_type
        
        async def read(self):
            return self.file.read()
    
    upload_file = MockUploadFile(
        filename="test_image.png",
        file=img_bytes,
        content_type="image/png"
    )
    
    return upload_file

class TestImageManagementService:
    """Test suite for ImageManagementService"""
    
    @pytest.mark.asyncio
    async def test_service_initialization(self, db_session, temp_upload_dir):
        """Test service initialization and directory creation"""
        # Mock the upload directory
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        # Check that directories are created
        assert (temp_upload_dir / "uploads" / "images").exists()
        assert (temp_upload_dir / "uploads" / "images" / "products").exists()
        assert (temp_upload_dir / "uploads" / "images" / "categories").exists()
        assert (temp_upload_dir / "uploads" / "images" / "companies").exists()
        assert (temp_upload_dir / "uploads" / "images" / "products" / "thumbnails").exists()
        assert (temp_upload_dir / "uploads" / "images" / "products" / "optimized").exists()
    
    @pytest.mark.asyncio
    async def test_upload_image_success(self, db_session, sample_image_file, temp_upload_dir):
        """Test successful image upload with processing"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        result = await service.upload_image(
            file=sample_image_file,
            entity_type="product",
            entity_id=entity_id,
            alt_text="Test image",
            caption="Test caption",
            is_primary=True
        )
        
        # Verify result structure
        assert result['success'] is True
        assert 'image_id' in result
        assert 'stored_filename' in result
        assert 'thumbnails' in result
        assert 'optimization' in result
        assert 'metadata' in result
        
        # Verify thumbnails were generated
        thumbnails = result['thumbnails']
        expected_sizes = ['small', 'medium', 'large', 'gallery']
        for size in expected_sizes:
            assert size in thumbnails
            assert 'filename' in thumbnails[size]
            assert 'width' in thumbnails[size]
            assert 'height' in thumbnails[size]
        
        # Verify optimization was applied
        optimization = result['optimization']
        assert optimization['applied'] is True
        assert optimization['compression_ratio'] <= 1.0
    
    @pytest.mark.asyncio
    async def test_upload_large_image_optimization(self, db_session, large_sample_image_file, temp_upload_dir):
        """Test optimization of large images"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        result = await service.upload_image(
            file=large_sample_image_file,
            entity_type="product",
            entity_id=entity_id
        )
        
        # Verify optimization was more aggressive for large image
        optimization = result['optimization']
        assert optimization['applied'] is True
        assert optimization['optimized_size'] < optimization['original_size']
        assert optimization['compression_ratio'] < 0.9  # Should be significantly compressed
    
    @pytest.mark.asyncio
    async def test_upload_png_with_transparency(self, db_session, png_sample_image_file, temp_upload_dir):
        """Test PNG upload with transparency handling"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        result = await service.upload_image(
            file=png_sample_image_file,
            entity_type="category",
            entity_id=entity_id
        )
        
        # Verify successful processing of PNG with transparency
        assert result['success'] is True
        assert result['metadata']['format'] == 'PNG'
        
        # Verify thumbnails were generated (should be converted to JPEG)
        thumbnails = result['thumbnails']
        assert len(thumbnails) > 0
        for size, thumbnail_info in thumbnails.items():
            assert thumbnail_info['filename'].endswith('.jpg')
    
    @pytest.mark.asyncio
    async def test_file_validation_unsupported_format(self, db_session):
        """Test file validation with unsupported format"""
        service = ImageManagementService(db_session)
        
        # Create mock file with unsupported format
        mock_file = MagicMock()
        mock_file.content_type = "application/pdf"
        mock_file.file.seek.return_value = None
        mock_file.file.tell.return_value = 1000
        
        with pytest.raises(ImageProcessingError) as exc_info:
            await service._validate_upload_file(mock_file)
        
        assert "Unsupported file format" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_file_validation_too_large(self, db_session):
        """Test file validation with oversized file"""
        service = ImageManagementService(db_session)
        
        # Create mock file that's too large
        mock_file = MagicMock()
        mock_file.content_type = "image/jpeg"
        mock_file.file.seek.return_value = None
        mock_file.file.tell.return_value = service.MAX_FILE_SIZE + 1000
        
        with pytest.raises(ImageProcessingError) as exc_info:
            await service._validate_upload_file(mock_file)
        
        assert "exceeds maximum allowed size" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_file_validation_empty_file(self, db_session):
        """Test file validation with empty file"""
        service = ImageManagementService(db_session)
        
        # Create mock empty file
        mock_file = MagicMock()
        mock_file.content_type = "image/jpeg"
        mock_file.file.seek.return_value = None
        mock_file.file.tell.return_value = 0
        
        with pytest.raises(ImageProcessingError) as exc_info:
            await service._validate_upload_file(mock_file)
        
        assert "Empty file uploaded" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_thumbnail_generation_all_sizes(self, db_session, sample_image_file, temp_upload_dir):
        """Test thumbnail generation for all defined sizes"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        # Save sample file first
        file_path = temp_upload_dir / "uploads" / "images" / "products" / "test.jpg"
        
        # Create actual image file
        img = Image.new('RGB', (1000, 800), color='green')
        img.save(file_path, format='JPEG')
        
        thumbnails = await service._generate_thumbnails(
            file_path, "product", "test.jpg"
        )
        
        # Verify all thumbnail sizes were generated
        expected_sizes = service.THUMBNAIL_SIZES.keys()
        assert set(thumbnails.keys()) == set(expected_sizes)
        
        # Verify thumbnail properties
        for size_name, thumbnail_info in thumbnails.items():
            expected_width, expected_height = service.THUMBNAIL_SIZES[size_name]
            assert thumbnail_info['width'] == expected_width
            assert thumbnail_info['height'] == expected_height
            assert thumbnail_info['file_size'] > 0
            
            # Verify thumbnail file exists
            thumbnail_path = Path(thumbnail_info['path'])
            assert thumbnail_path.exists()
    
    @pytest.mark.asyncio
    async def test_get_entity_images(self, db_session, sample_image_file, temp_upload_dir):
        """Test retrieving images for an entity"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload multiple images
        await service.upload_image(
            file=sample_image_file,
            entity_type="product",
            entity_id=entity_id,
            is_primary=True
        )
        
        # Reset file pointer for second upload
        sample_image_file.file.seek(0)
        await service.upload_image(
            file=sample_image_file,
            entity_type="product",
            entity_id=entity_id,
            is_primary=False
        )
        
        # Retrieve images
        images = await service.get_entity_images("product", entity_id)
        
        assert len(images) == 2
        
        # Verify primary image is first
        assert images[0]['is_primary'] is True
        assert images[1]['is_primary'] is False
        
        # Verify image data structure
        for image in images:
            assert 'id' in image
            assert 'original_filename' in image
            assert 'stored_filename' in image
            assert 'thumbnails' in image
            assert 'image_width' in image
            assert 'image_height' in image
    
    @pytest.mark.asyncio
    async def test_update_image_metadata(self, db_session, sample_image_file, temp_upload_dir):
        """Test updating image metadata"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload image
        upload_result = await service.upload_image(
            file=sample_image_file,
            entity_type="product",
            entity_id=entity_id
        )
        
        image_id = upload_result['image_id']
        
        # Update metadata
        update_result = await service.update_image_metadata(
            image_id=image_id,
            alt_text="Updated alt text",
            caption="Updated caption",
            is_primary=True,
            sort_order=5
        )
        
        assert update_result['success'] is True
        assert 'updated_fields' in update_result
        
        # Verify updates were applied
        images = await service.get_entity_images("product", entity_id)
        updated_image = next(img for img in images if img['id'] == image_id)
        
        assert updated_image['alt_text'] == "Updated alt text"
        assert updated_image['caption'] == "Updated caption"
        assert updated_image['is_primary'] is True
        assert updated_image['sort_order'] == 5
    
    @pytest.mark.asyncio
    async def test_delete_image(self, db_session, sample_image_file, temp_upload_dir):
        """Test image deletion with file cleanup"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload image
        upload_result = await service.upload_image(
            file=sample_image_file,
            entity_type="product",
            entity_id=entity_id
        )
        
        image_id = upload_result['image_id']
        
        # Verify files exist before deletion
        original_path = Path(upload_result['file_path'])
        assert original_path.exists()
        
        # Delete image
        delete_result = await service.delete_image(image_id)
        
        assert delete_result['success'] is True
        assert len(delete_result['files_deleted']) > 0
        
        # Verify files are deleted
        assert not original_path.exists()
        
        # Verify database record is deleted
        images = await service.get_entity_images("product", entity_id)
        assert len(images) == 0
    
    @pytest.mark.asyncio
    async def test_primary_image_management(self, db_session, sample_image_file, temp_upload_dir):
        """Test primary image management (only one primary per entity)"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload first image as primary
        sample_image_file.file.seek(0)
        await service.upload_image(
            file=sample_image_file,
            entity_type="product",
            entity_id=entity_id,
            is_primary=True
        )
        
        # Upload second image as primary (should unset first)
        sample_image_file.file.seek(0)
        await service.upload_image(
            file=sample_image_file,
            entity_type="product",
            entity_id=entity_id,
            is_primary=True
        )
        
        # Verify only one primary image
        images = await service.get_entity_images("product", entity_id)
        primary_images = [img for img in images if img['is_primary']]
        
        assert len(primary_images) == 1
        assert len(images) == 2
    
    @pytest.mark.asyncio
    async def test_get_image_statistics(self, db_session, sample_image_file, temp_upload_dir):
        """Test image statistics calculation"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload images for different entity types
        sample_image_file.file.seek(0)
        await service.upload_image(
            file=sample_image_file,
            entity_type="product",
            entity_id=entity_id
        )
        
        sample_image_file.file.seek(0)
        await service.upload_image(
            file=sample_image_file,
            entity_type="category",
            entity_id=entity_id
        )
        
        # Get statistics
        stats = await service.get_image_statistics()
        
        assert stats['total_images'] >= 2
        assert 'images_by_entity_type' in stats
        assert 'total_storage_bytes' in stats
        assert 'total_storage_mb' in stats
        assert 'optimized_images' in stats
        assert 'optimization_percentage' in stats
        
        # Verify entity type breakdown
        assert 'product' in stats['images_by_entity_type']
        assert 'category' in stats['images_by_entity_type']
    
    @pytest.mark.asyncio
    async def test_image_optimization_quality_levels(self, db_session, temp_upload_dir):
        """Test different optimization quality levels based on file size"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        # Create images of different sizes
        small_img = Image.new('RGB', (400, 300), color='red')
        medium_img = Image.new('RGB', (1200, 900), color='green')
        large_img = Image.new('RGB', (3000, 2000), color='blue')
        
        test_cases = [
            (small_img, "small.jpg", 85),  # Expected quality for small image
            (medium_img, "medium.jpg", 75),  # Expected quality for medium image
            (large_img, "large.jpg", 65),   # Expected quality for large image
        ]
        
        for img, filename, expected_min_quality in test_cases:
            # Save test image
            file_path = temp_upload_dir / "uploads" / "images" / "products" / filename
            img.save(file_path, format='JPEG', quality=95)
            
            # Test optimization
            result = await service._optimize_image(file_path, "product")
            
            assert result['applied'] is True
            assert result['compression_ratio'] <= 1.0
            assert result['optimized_size'] <= result['original_size']
    
    @pytest.mark.asyncio
    async def test_error_handling_invalid_image(self, db_session, temp_upload_dir):
        """Test error handling with invalid image file"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        # Create invalid image file
        invalid_file_path = temp_upload_dir / "uploads" / "images" / "products" / "invalid.jpg"
        with open(invalid_file_path, 'w') as f:
            f.write("This is not an image file")
        
        # Test metadata extraction (should handle error gracefully)
        with pytest.raises(ImageProcessingError):
            await service._get_image_metadata(invalid_file_path)
    
    @pytest.mark.asyncio
    async def test_concurrent_uploads(self, db_session, temp_upload_dir):
        """Test handling of concurrent image uploads"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Create multiple upload files
        upload_files = []
        for i in range(3):
            img = Image.new('RGB', (400, 300), color=(i*80, i*80, i*80))
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            class MockUploadFile:
                def __init__(self, filename, file, content_type):
                    self.filename = filename
                    self.file = file
                    self.content_type = content_type
                
                async def read(self):
                    return self.file.read()
            
            upload_file = MockUploadFile(
                filename=f"concurrent_test_{i}.jpg",
                file=img_bytes,
                content_type="image/jpeg"
            )
            upload_files.append(upload_file)
        
        # Upload concurrently
        tasks = [
            service.upload_image(
                file=upload_file,
                entity_type="product",
                entity_id=entity_id
            )
            for upload_file in upload_files
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Verify all uploads succeeded
        successful_results = [r for r in results if isinstance(r, dict) and r.get('success')]
        assert len(successful_results) == 3
        
        # Verify all images are in database
        images = await service.get_entity_images("product", entity_id)
        assert len(images) == 3

if __name__ == "__main__":
    pytest.main([__file__, "-v"])