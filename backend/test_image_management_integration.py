"""
Comprehensive integration tests for Image Management Service with real database

Tests the complete image management workflow using real PostgreSQL database,
real file operations, and actual image processing in Docker environment.
"""

import pytest
import asyncio
import tempfile
import shutil
import uuid
from pathlib import Path
from PIL import Image
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from sqlalchemy.orm import sessionmaker

from services.image_management_service import ImageManagementService, ImageProcessingError
from models import ImageManagement
from database import engine, get_db

class MockUploadFile:
    """Mock UploadFile for testing"""
    def __init__(self, filename, file, content_type):
        self.filename = filename
        self.file = file
        self.content_type = content_type
    
    async def read(self):
        return self.file.read()

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def db_session():
    """Create real database session for testing"""
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def temp_upload_dir():
    """Create temporary directory for test uploads"""
    temp_dir = tempfile.mkdtemp()
    yield Path(temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)

@pytest.fixture
def sample_jpeg_file():
    """Create a sample JPEG file for testing"""
    img = Image.new('RGB', (800, 600), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG', quality=90)
    img_bytes.seek(0)
    
    return MockUploadFile(
        filename="test_image.jpg",
        file=img_bytes,
        content_type="image/jpeg"
    )

@pytest.fixture
def sample_png_file():
    """Create a sample PNG file with transparency"""
    img = Image.new('RGBA', (400, 300), color=(255, 0, 0, 128))
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return MockUploadFile(
        filename="test_image.png",
        file=img_bytes,
        content_type="image/png"
    )

@pytest.fixture
def large_image_file():
    """Create a large image file for optimization testing"""
    img = Image.new('RGB', (2000, 1500), color='blue')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG', quality=95)
    img_bytes.seek(0)
    
    return MockUploadFile(
        filename="large_test_image.jpg",
        file=img_bytes,
        content_type="image/jpeg"
    )

class TestImageManagementIntegration:
    """Comprehensive integration tests with real database"""
    
    @pytest.mark.asyncio
    async def test_complete_image_upload_workflow(self, db_session, sample_jpeg_file, temp_upload_dir):
        """Test complete image upload workflow with real database"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload image
        result = await service.upload_image(
            file=sample_jpeg_file,
            entity_type="product",
            entity_id=entity_id,
            alt_text="Test product image",
            caption="A beautiful test product",
            is_primary=True
        )
        
        # Verify upload result
        assert result['success'] is True
        assert 'image_id' in result
        assert 'stored_filename' in result
        assert 'thumbnails' in result
        assert 'optimization' in result
        
        image_id = result['image_id']
        
        # Verify database record was created
        db_result = await db_session.execute(
            select(ImageManagement).where(ImageManagement.id == uuid.UUID(image_id))
        )
        image_record = db_result.scalar_one()
        
        assert image_record is not None
        assert image_record.entity_type == "product"
        assert image_record.entity_id == uuid.UUID(entity_id)
        assert image_record.original_filename == "test_image.jpg"
        assert image_record.is_primary is True
        assert image_record.alt_text == "Test product image"
        assert image_record.caption == "A beautiful test product"
        assert image_record.optimization_applied is True
        
        # Verify files were created
        original_path = Path(image_record.file_path)
        assert original_path.exists()
        assert original_path.stat().st_size > 0
        
        # Verify optimized file was created
        optimized_dir = service.UPLOAD_DIR / "products" / "optimized"
        optimized_path = optimized_dir / image_record.stored_filename
        assert optimized_path.exists()
        
        # Verify thumbnails were created
        thumbnail_dir = service.UPLOAD_DIR / "products" / "thumbnails"
        for size_name, thumbnail_info in image_record.thumbnails.items():
            thumbnail_path = thumbnail_dir / thumbnail_info['filename']
            assert thumbnail_path.exists()
            assert thumbnail_path.stat().st_size > 0
        
        print(f"✅ Complete upload workflow test passed for image {image_id}")
    
    @pytest.mark.asyncio
    async def test_png_transparency_handling(self, db_session, sample_png_file, temp_upload_dir):
        """Test PNG with transparency conversion to JPEG"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        result = await service.upload_image(
            file=sample_png_file,
            entity_type="category",
            entity_id=entity_id
        )
        
        assert result['success'] is True
        
        # Verify thumbnails are JPEG (transparency converted)
        thumbnails = result['thumbnails']
        for size_name, thumbnail_info in thumbnails.items():
            assert thumbnail_info['filename'].endswith('.jpg')
        
        print("✅ PNG transparency handling test passed")
    
    @pytest.mark.asyncio
    async def test_large_image_optimization(self, db_session, large_image_file, temp_upload_dir):
        """Test optimization of large images"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        result = await service.upload_image(
            file=large_image_file,
            entity_type="product",
            entity_id=entity_id
        )
        
        assert result['success'] is True
        
        # Verify optimization was applied
        optimization = result['optimization']
        assert optimization['applied'] is True
        assert optimization['optimized_size'] < optimization['original_size']
        assert optimization['compression_ratio'] < 1.0
        
        print(f"✅ Large image optimization test passed - compression ratio: {optimization['compression_ratio']:.3f}")
    
    @pytest.mark.asyncio
    async def test_multiple_images_primary_management(self, db_session, temp_upload_dir):
        """Test primary image management with multiple uploads"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload first image as primary
        img1 = Image.new('RGB', (400, 300), color='red')
        img1_bytes = io.BytesIO()
        img1.save(img1_bytes, format='JPEG')
        img1_bytes.seek(0)
        
        file1 = MockUploadFile("image1.jpg", img1_bytes, "image/jpeg")
        
        result1 = await service.upload_image(
            file=file1,
            entity_type="product",
            entity_id=entity_id,
            is_primary=True
        )
        
        # Upload second image as primary (should unset first)
        img2 = Image.new('RGB', (400, 300), color='green')
        img2_bytes = io.BytesIO()
        img2.save(img2_bytes, format='JPEG')
        img2_bytes.seek(0)
        
        file2 = MockUploadFile("image2.jpg", img2_bytes, "image/jpeg")
        
        result2 = await service.upload_image(
            file=file2,
            entity_type="product",
            entity_id=entity_id,
            is_primary=True
        )
        
        # Verify only one primary image exists
        images = await service.get_entity_images("product", entity_id)
        primary_images = [img for img in images if img['is_primary']]
        
        assert len(images) == 2
        assert len(primary_images) == 1
        assert primary_images[0]['id'] == result2['image_id']
        
        print("✅ Primary image management test passed")
    
    @pytest.mark.asyncio
    async def test_image_metadata_update(self, db_session, sample_jpeg_file, temp_upload_dir):
        """Test updating image metadata"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload image
        upload_result = await service.upload_image(
            file=sample_jpeg_file,
            entity_type="product",
            entity_id=entity_id,
            alt_text="Original alt text",
            caption="Original caption"
        )
        
        image_id = upload_result['image_id']
        
        # Update metadata
        update_result = await service.update_image_metadata(
            image_id=image_id,
            alt_text="Updated alt text",
            caption="Updated caption",
            is_primary=True,
            sort_order=10
        )
        
        assert update_result['success'] is True
        
        # Verify updates in database
        db_result = await db_session.execute(
            select(ImageManagement).where(ImageManagement.id == uuid.UUID(image_id))
        )
        updated_record = db_result.scalar_one()
        
        assert updated_record.alt_text == "Updated alt text"
        assert updated_record.caption == "Updated caption"
        assert updated_record.is_primary is True
        assert updated_record.sort_order == 10
        
        print("✅ Image metadata update test passed")
    
    @pytest.mark.asyncio
    async def test_image_deletion_with_file_cleanup(self, db_session, sample_jpeg_file, temp_upload_dir):
        """Test image deletion with complete file cleanup"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload image
        upload_result = await service.upload_image(
            file=sample_jpeg_file,
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
        db_result = await db_session.execute(
            select(ImageManagement).where(ImageManagement.id == uuid.UUID(image_id))
        )
        deleted_record = db_result.scalar_one_or_none()
        assert deleted_record is None
        
        print("✅ Image deletion with file cleanup test passed")
    
    @pytest.mark.asyncio
    async def test_get_entity_images_with_sorting(self, db_session, temp_upload_dir):
        """Test retrieving entity images with proper sorting"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload multiple images with different sort orders
        images_data = [
            ("image1.jpg", False, 3),
            ("image2.jpg", True, 1),  # Primary
            ("image3.jpg", False, 2),
        ]
        
        uploaded_ids = []
        for filename, is_primary, sort_order in images_data:
            img = Image.new('RGB', (200, 200), color='red')
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            file = MockUploadFile(filename, img_bytes, "image/jpeg")
            
            result = await service.upload_image(
                file=file,
                entity_type="product",
                entity_id=entity_id,
                is_primary=is_primary
            )
            
            # Update sort order
            await service.update_image_metadata(
                image_id=result['image_id'],
                sort_order=sort_order
            )
            
            uploaded_ids.append(result['image_id'])
        
        # Retrieve images
        images = await service.get_entity_images("product", entity_id)
        
        assert len(images) == 3
        
        # Verify sorting: primary first, then by sort_order
        assert images[0]['is_primary'] is True
        assert images[0]['sort_order'] == 1
        assert images[1]['sort_order'] == 2
        assert images[2]['sort_order'] == 3
        
        print("✅ Entity images sorting test passed")
    
    @pytest.mark.asyncio
    async def test_image_statistics_calculation(self, db_session, temp_upload_dir):
        """Test image statistics calculation with real data"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        # Upload images for different entity types
        entity_types = ["product", "category", "company"]
        uploaded_images = []
        
        for entity_type in entity_types:
            for i in range(2):  # 2 images per entity type
                img = Image.new('RGB', (300, 300), color=(i*100, i*100, i*100))
                img_bytes = io.BytesIO()
                img.save(img_bytes, format='JPEG', quality=80)
                img_bytes.seek(0)
                
                file = MockUploadFile(f"{entity_type}_{i}.jpg", img_bytes, "image/jpeg")
                
                result = await service.upload_image(
                    file=file,
                    entity_type=entity_type,
                    entity_id=str(uuid.uuid4())
                )
                uploaded_images.append(result)
        
        # Get statistics
        stats = await service.get_image_statistics()
        
        assert stats['total_images'] >= 6  # At least our test images
        assert 'images_by_entity_type' in stats
        assert 'total_storage_bytes' in stats
        assert 'total_storage_mb' in stats
        assert 'optimized_images' in stats
        assert 'optimization_percentage' in stats
        
        # Verify entity type breakdown includes our test data
        for entity_type in entity_types:
            assert entity_type in stats['images_by_entity_type']
            assert stats['images_by_entity_type'][entity_type] >= 2
        
        print(f"✅ Image statistics test passed - Total images: {stats['total_images']}, Storage: {stats['total_storage_mb']} MB")
    
    @pytest.mark.asyncio
    async def test_concurrent_uploads_database_integrity(self, db_session, temp_upload_dir):
        """Test concurrent uploads maintain database integrity"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Create multiple upload tasks
        async def upload_image_task(index):
            img = Image.new('RGB', (200, 200), color=(index*50, index*50, index*50))
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            file = MockUploadFile(f"concurrent_{index}.jpg", img_bytes, "image/jpeg")
            
            return await service.upload_image(
                file=file,
                entity_type="product",
                entity_id=entity_id
            )
        
        # Run concurrent uploads
        tasks = [upload_image_task(i) for i in range(5)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Verify all uploads succeeded
        successful_results = [r for r in results if isinstance(r, dict) and r.get('success')]
        assert len(successful_results) == 5
        
        # Verify database integrity
        images = await service.get_entity_images("product", entity_id)
        assert len(images) == 5
        
        # Verify all images have unique IDs and filenames
        image_ids = [img['id'] for img in images]
        filenames = [img['stored_filename'] for img in images]
        
        assert len(set(image_ids)) == 5  # All unique IDs
        assert len(set(filenames)) == 5  # All unique filenames
        
        print("✅ Concurrent uploads database integrity test passed")
    
    @pytest.mark.asyncio
    async def test_error_handling_invalid_entity_id(self, db_session, sample_jpeg_file, temp_upload_dir):
        """Test error handling with invalid entity ID"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        # Test with invalid UUID format
        with pytest.raises(ImageProcessingError):
            await service.upload_image(
                file=sample_jpeg_file,
                entity_type="product",
                entity_id="invalid-uuid-format"
            )
        
        print("✅ Error handling test passed")
    
    @pytest.mark.asyncio
    async def test_database_transaction_rollback_on_error(self, db_session, temp_upload_dir):
        """Test database transaction rollback on processing errors"""
        service = ImageManagementService(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        # Create invalid image data
        invalid_bytes = io.BytesIO(b"This is not an image")
        invalid_file = MockUploadFile("invalid.jpg", invalid_bytes, "image/jpeg")
        
        entity_id = str(uuid.uuid4())
        
        # Count images before failed upload
        initial_stats = await service.get_image_statistics()
        initial_count = initial_stats['total_images']
        
        # Attempt upload (should fail)
        with pytest.raises(ImageProcessingError):
            await service.upload_image(
                file=invalid_file,
                entity_type="product",
                entity_id=entity_id
            )
        
        # Verify no database record was created
        final_stats = await service.get_image_statistics()
        final_count = final_stats['total_images']
        
        assert final_count == initial_count  # No new records
        
        print("✅ Database transaction rollback test passed")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])