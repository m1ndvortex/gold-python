"""
Real database integration tests for Image Management Service

Tests the complete image management workflow using the actual PostgreSQL database
and real file operations in Docker environment.
"""

import pytest
import tempfile
import shutil
import uuid
from pathlib import Path
from PIL import Image
import io
from sqlalchemy import text, select
from sqlalchemy.orm import Session

from services.image_management_service_sync import ImageManagementServiceSync, ImageProcessingError
from models import ImageManagement
from database import get_db, engine, create_analytics_schema

class MockUploadFile:
    """Mock UploadFile for testing"""
    def __init__(self, filename, file, content_type):
        self.filename = filename
        self.file = file
        self.content_type = content_type
    
    async def read(self):
        return self.file.read()

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Setup database schema for testing"""
    create_analytics_schema()
    
    # Create tables
    from models import Base
    Base.metadata.create_all(bind=engine)

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

class TestImageManagementRealDatabase:
    """Integration tests with real PostgreSQL database"""
    
    def test_database_connection(self, db_session):
        """Test that we can connect to the real database"""
        result = db_session.execute(text("SELECT 1 as test"))
        assert result.fetchone().test == 1
        print("✅ Database connection test passed")
    
    def test_analytics_schema_exists(self, db_session):
        """Test that analytics schema exists"""
        result = db_session.execute(text("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'analytics'
        """))
        schema = result.fetchone()
        assert schema is not None
        print("✅ Analytics schema exists")
    
    def test_image_management_table_exists(self, db_session):
        """Test that image_management table exists in analytics schema"""
        result = db_session.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'analytics' 
            AND table_name = 'image_management'
        """))
        table = result.fetchone()
        assert table is not None
        print("✅ Image management table exists")
    
    @pytest.mark.asyncio
    async def test_service_initialization_with_real_db(self, db_session, temp_upload_dir):
        """Test service initialization with real database"""
        service = ImageManagementServiceSync(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        # Check directories were created
        assert (temp_upload_dir / "uploads" / "images" / "products").exists()
        assert (temp_upload_dir / "uploads" / "images" / "categories").exists()
        assert (temp_upload_dir / "uploads" / "images" / "companies").exists()
        
        print("✅ Service initialization with real database test passed")
    
    @pytest.mark.asyncio
    async def test_real_image_upload_and_database_storage(self, db_session, sample_jpeg_file, temp_upload_dir):
        """Test complete image upload with real database storage"""
        service = ImageManagementServiceSync(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Count existing images
        initial_count = db_session.execute(
            text("SELECT COUNT(*) FROM analytics.image_management")
        ).scalar()
        
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
        image_id = result['image_id']
        
        # Verify database record was created
        final_count = db_session.execute(
            text("SELECT COUNT(*) FROM analytics.image_management")
        ).scalar()
        assert final_count == initial_count + 1
        
        # Verify record details
        record = db_session.execute(
            text("""
                SELECT entity_type, entity_id, original_filename, is_primary, 
                       alt_text, caption, optimization_applied, thumbnails
                FROM analytics.image_management 
                WHERE id = :image_id
            """),
            {"image_id": image_id}
        ).fetchone()
        
        assert record is not None
        assert record.entity_type == "product"
        assert str(record.entity_id) == entity_id
        assert record.original_filename == "test_image.jpg"
        assert record.is_primary is True
        assert record.alt_text == "Test product image"
        assert record.caption == "A beautiful test product"
        assert record.optimization_applied is True
        assert record.thumbnails is not None
        
        # Verify files were created
        original_path = Path(result['file_path'])
        assert original_path.exists()
        assert original_path.stat().st_size > 0
        
        print(f"✅ Real image upload and database storage test passed - Image ID: {image_id}")
    
    @pytest.mark.asyncio
    async def test_thumbnail_generation_with_real_files(self, db_session, sample_jpeg_file, temp_upload_dir):
        """Test thumbnail generation creates real files"""
        service = ImageManagementServiceSync(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        result = await service.upload_image(
            file=sample_jpeg_file,
            entity_type="product",
            entity_id=entity_id
        )
        
        # Verify thumbnails were generated
        thumbnails = result['thumbnails']
        expected_sizes = ['small', 'medium', 'large', 'gallery']
        
        assert len(thumbnails) == len(expected_sizes)
        
        # Verify each thumbnail file exists
        thumbnail_dir = service.UPLOAD_DIR / "products" / "thumbnails"
        for size_name in expected_sizes:
            assert size_name in thumbnails
            thumbnail_info = thumbnails[size_name]
            thumbnail_path = thumbnail_dir / thumbnail_info['filename']
            
            assert thumbnail_path.exists()
            assert thumbnail_path.stat().st_size > 0
            
            # Verify thumbnail dimensions
            with Image.open(thumbnail_path) as thumb_img:
                expected_width, expected_height = service.THUMBNAIL_SIZES[size_name]
                assert thumb_img.width == expected_width
                assert thumb_img.height == expected_height
        
        print("✅ Thumbnail generation with real files test passed")
    
    @pytest.mark.asyncio
    async def test_image_optimization_creates_real_files(self, db_session, temp_upload_dir):
        """Test image optimization creates real optimized files"""
        service = ImageManagementServiceSync(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        # Create a large image for optimization
        large_img = Image.new('RGB', (2000, 1500), color='blue')
        img_bytes = io.BytesIO()
        large_img.save(img_bytes, format='JPEG', quality=95)
        img_bytes.seek(0)
        
        large_file = MockUploadFile("large_image.jpg", img_bytes, "image/jpeg")
        
        entity_id = str(uuid.uuid4())
        
        result = await service.upload_image(
            file=large_file,
            entity_type="product",
            entity_id=entity_id
        )
        
        # Verify optimization was applied
        optimization = result['optimization']
        assert optimization['applied'] is True
        assert optimization['optimized_size'] < optimization['original_size']
        
        # Verify optimized file exists
        optimized_path = Path(optimization['optimized_path'])
        assert optimized_path.exists()
        assert optimized_path.stat().st_size == optimization['optimized_size']
        
        print(f"✅ Image optimization creates real files test passed - Compression: {optimization['compression_ratio']:.3f}")
    
    @pytest.mark.asyncio
    async def test_get_entity_images_from_real_database(self, db_session, temp_upload_dir):
        """Test retrieving entity images from real database"""
        service = ImageManagementServiceSync(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload multiple images
        for i in range(3):
            img = Image.new('RGB', (300, 300), color=(i*80, i*80, i*80))
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            file = MockUploadFile(f"image_{i}.jpg", img_bytes, "image/jpeg")
            
            await service.upload_image(
                file=file,
                entity_type="product",
                entity_id=entity_id,
                is_primary=(i == 0)
            )
        
        # Retrieve images
        images = await service.get_entity_images("product", entity_id)
        
        assert len(images) == 3
        
        # Verify primary image is first
        assert images[0]['is_primary'] is True
        
        # Verify all required fields are present
        for image in images:
            assert 'id' in image
            assert 'original_filename' in image
            assert 'stored_filename' in image
            assert 'thumbnails' in image
            assert 'optimization_applied' in image
            assert 'created_at' in image
        
        print("✅ Get entity images from real database test passed")
    
    @pytest.mark.asyncio
    async def test_update_image_metadata_in_real_database(self, db_session, sample_jpeg_file, temp_upload_dir):
        """Test updating image metadata in real database"""
        service = ImageManagementServiceSync(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        entity_id = str(uuid.uuid4())
        
        # Upload image
        upload_result = await service.upload_image(
            file=sample_jpeg_file,
            entity_type="product",
            entity_id=entity_id,
            alt_text="Original alt text"
        )
        
        image_id = upload_result['image_id']
        
        # Update metadata
        await service.update_image_metadata(
            image_id=image_id,
            alt_text="Updated alt text",
            caption="New caption",
            is_primary=True,
            sort_order=5
        )
        
        # Verify updates in database
        record = db_session.execute(
            text("""
                SELECT alt_text, caption, is_primary, sort_order
                FROM analytics.image_management 
                WHERE id = :image_id
            """),
            {"image_id": image_id}
        ).fetchone()
        
        assert record.alt_text == "Updated alt text"
        assert record.caption == "New caption"
        assert record.is_primary is True
        assert record.sort_order == 5
        
        print("✅ Update image metadata in real database test passed")
    
    @pytest.mark.asyncio
    async def test_delete_image_from_real_database(self, db_session, sample_jpeg_file, temp_upload_dir):
        """Test deleting image from real database and filesystem"""
        service = ImageManagementServiceSync(db_session)
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
        
        # Verify image exists in database
        count_before = db_session.execute(
            text("SELECT COUNT(*) FROM analytics.image_management WHERE id = :image_id"),
            {"image_id": image_id}
        ).scalar()
        assert count_before == 1
        
        # Verify files exist
        original_path = Path(upload_result['file_path'])
        assert original_path.exists()
        
        # Delete image
        delete_result = await service.delete_image(image_id)
        assert delete_result['success'] is True
        
        # Verify image deleted from database
        count_after = db_session.execute(
            text("SELECT COUNT(*) FROM analytics.image_management WHERE id = :image_id"),
            {"image_id": image_id}
        ).scalar()
        assert count_after == 0
        
        # Verify files deleted
        assert not original_path.exists()
        
        print("✅ Delete image from real database test passed")
    
    @pytest.mark.asyncio
    async def test_image_statistics_from_real_database(self, db_session, temp_upload_dir):
        """Test image statistics calculation from real database"""
        service = ImageManagementServiceSync(db_session)
        service.UPLOAD_DIR = temp_upload_dir / "uploads" / "images"
        service._ensure_upload_directories()
        
        # Get initial statistics
        initial_stats = await service.get_image_statistics()
        initial_count = initial_stats['total_images']
        
        # Upload test images
        entity_types = ["product", "category"]
        for entity_type in entity_types:
            img = Image.new('RGB', (200, 200), color='green')
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            file = MockUploadFile(f"{entity_type}_test.jpg", img_bytes, "image/jpeg")
            
            await service.upload_image(
                file=file,
                entity_type=entity_type,
                entity_id=str(uuid.uuid4())
            )
        
        # Get updated statistics
        final_stats = await service.get_image_statistics()
        
        assert final_stats['total_images'] == initial_count + 2
        assert 'images_by_entity_type' in final_stats
        assert 'total_storage_bytes' in final_stats
        assert 'optimized_images' in final_stats
        
        # Verify entity type breakdown
        for entity_type in entity_types:
            assert entity_type in final_stats['images_by_entity_type']
        
        print(f"✅ Image statistics from real database test passed - Total: {final_stats['total_images']}")
    
    def test_database_constraints_and_indexes(self, db_session):
        """Test that database constraints and indexes exist"""
        # Check indexes exist
        indexes_query = text("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE schemaname = 'analytics' 
            AND tablename = 'image_management'
        """)
        
        indexes = db_session.execute(indexes_query).fetchall()
        index_names = [idx.indexname for idx in indexes]
        
        # Verify expected indexes exist
        expected_indexes = [
            'idx_image_management_entity',
            'idx_image_management_primary',
            'idx_image_management_sort'
        ]
        
        for expected_idx in expected_indexes:
            assert any(expected_idx in idx_name for idx_name in index_names), f"Index {expected_idx} not found"
        
        print("✅ Database constraints and indexes test passed")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])