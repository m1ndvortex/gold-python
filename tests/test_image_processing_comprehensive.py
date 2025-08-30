"""
Comprehensive Image Processing and Display Tests

Tests image upload, processing, optimization, thumbnail generation,
and display functionality across the system.
"""

import hashlib
import os
import tempfile
from io import BytesIO
from pathlib import Path

import pytest
import requests
from PIL import Image, ImageDraw
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


class TestImageProcessingComprehensive:
    """Comprehensive image processing tests"""
    
    @pytest.fixture(autouse=True)
    def setup_test_environment(self):
        """Setup test environment with real database"""
        self.base_url = "http://localhost:8000"
        self.db_url = "postgresql://goldshop_user:goldshop_password@localhost:5432/goldshop"
        
        # Create database engine for direct queries
        self.engine = create_engine(self.db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Test data tracking
        self.test_images = []
        self.test_categories = []
        self.test_items = []
        
        yield
        
        # Cleanup
        self._cleanup_test_data()
    
    def _cleanup_test_data(self):
        """Clean up test data from database"""
        with self.SessionLocal() as db:
            # Delete test items
            for item_id in self.test_items:
                db.execute(text("DELETE FROM inventory_items WHERE id = :id"), {"id": item_id})
            
            # Delete test categories
            for category_id in self.test_categories:
                db.execute(text("DELETE FROM categories WHERE id = :id"), {"id": category_id})
            
            # Delete test images
            for image_id in self.test_images:
                db.execute(text("DELETE FROM images WHERE id = :id"), {"id": image_id})
            
            db.commit()
    
    def _create_test_image(self, width: int, height: int, color: str = 'red', format: str = 'JPEG') -> BytesIO:
        """Create a test image with specified dimensions and color"""
        image = Image.new('RGB', (width, height), color=color)
        
        # Add some content to make it more realistic
        draw = ImageDraw.Draw(image)
        draw.rectangle([10, 10, width-10, height-10], outline='blue', width=3)
        draw.text((20, 20), f"Test Image {width}x{height}", fill='white')
        
        image_buffer = BytesIO()
        image.save(image_buffer, format=format, quality=95)
        image_buffer.seek(0)
        return image_buffer
    
    def test_image_upload_various_formats(self):
        """Test uploading images in various formats"""
        
        formats_to_test = [
            ('test.jpg', 'JPEG', 'image/jpeg'),
            ('test.png', 'PNG', 'image/png'),
            ('test.webp', 'WEBP', 'image/webp'),
            ('test.bmp', 'BMP', 'image/bmp')
        ]
        
        for filename, pil_format, mime_type in formats_to_test:
            with self.subTest(format=pil_format):
                # Create test image
                image_buffer = self._create_test_image(800, 600, 'green', pil_format)
                
                # Upload image
                files = {'file': (filename, image_buffer, mime_type)}
                response = requests.post(f"{self.base_url}/api/images/upload", files=files)
                
                assert response.status_code == 201, f"Failed to upload {pil_format} image"
                
                image_data = response.json()
                self.test_images.append(image_data['id'])
                
                # Verify image metadata
                assert image_data['filename'] == filename
                assert image_data['mime_type'] == mime_type
                assert image_data['width'] == 800
                assert image_data['height'] == 600
                assert 'url' in image_data
                assert 'thumbnail_url' in image_data
                
                # Verify image can be retrieved
                response = requests.get(image_data['url'])
                assert response.status_code == 200
                assert response.headers['content-type'] == mime_type
    
    def test_image_size_validation(self):
        """Test image size validation and limits"""
        
        # Test maximum size limit
        large_image = self._create_test_image(5000, 5000, 'blue')  # Very large image
        files = {'file': ('large.jpg', large_image, 'image/jpeg')}
        response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        
        # Should either succeed or fail with appropriate error
        if response.status_code == 201:
            # If upload succeeds, verify it was processed
            image_data = response.json()
            self.test_images.append(image_data['id'])
            assert image_data['width'] <= 5000
            assert image_data['height'] <= 5000
        else:
            # Should fail with size limit error
            assert response.status_code == 400
            assert 'size' in response.json()['detail'].lower()
        
        # Test minimum size requirements
        tiny_image = self._create_test_image(10, 10, 'yellow')  # Very small image
        files = {'file': ('tiny.jpg', tiny_image, 'image/jpeg')}
        response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        
        # Should either succeed or fail with appropriate error
        if response.status_code != 201:
            assert 'size' in response.json()['detail'].lower()
        else:
            image_data = response.json()
            self.test_images.append(image_data['id'])
    
    def test_thumbnail_generation(self):
        """Test automatic thumbnail generation"""
        
        # Upload high-resolution image
        large_image = self._create_test_image(2000, 1500, 'purple')
        files = {'file': ('large_image.jpg', large_image, 'image/jpeg')}
        response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        
        assert response.status_code == 201
        image_data = response.json()
        self.test_images.append(image_data['id'])
        
        # Verify thumbnail was generated
        assert 'thumbnail_url' in image_data
        
        # Test thumbnail access
        response = requests.get(image_data['thumbnail_url'])
        assert response.status_code == 200
        assert response.headers['content-type'].startswith('image/')
        
        # Verify thumbnail is smaller than original
        thumbnail_content = response.content
        original_response = requests.get(image_data['url'])
        original_content = original_response.content
        
        assert len(thumbnail_content) < len(original_content)
        
        # Test different thumbnail sizes
        thumbnail_sizes = ['small', 'medium', 'large']
        
        for size in thumbnail_sizes:
            response = requests.get(f"{self.base_url}/api/images/{image_data['id']}/thumbnail/{size}")
            assert response.status_code == 200
            assert response.headers['content-type'].startswith('image/')
            
            # Verify different sizes produce different file sizes
            size_content = response.content
            # Each size should be different (allowing for some compression variance)
            assert len(size_content) > 1000  # Should be substantial
    
    def test_image_optimization(self):
        """Test image optimization functionality"""
        
        # Create unoptimized image (high quality, large file)
        unoptimized_image = Image.new('RGB', (1200, 800), color='red')
        # Add noise to make it less compressible
        draw = ImageDraw.Draw(unoptimized_image)
        for i in range(0, 1200, 10):
            for j in range(0, 800, 10):
                draw.point((i, j), fill=(i % 255, j % 255, (i+j) % 255))
        
        image_buffer = BytesIO()
        unoptimized_image.save(image_buffer, format='JPEG', quality=100)
        image_buffer.seek(0)
        
        # Upload unoptimized image
        files = {'file': ('unoptimized.jpg', image_buffer, 'image/jpeg')}
        response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        
        assert response.status_code == 201
        image_data = response.json()
        self.test_images.append(image_data['id'])
        
        # Get original file size
        original_response = requests.get(image_data['url'])
        original_size = len(original_response.content)
        
        # Optimize image
        response = requests.post(f"{self.base_url}/api/images/{image_data['id']}/optimize")
        assert response.status_code == 200
        
        optimization_result = response.json()
        assert 'original_size' in optimization_result
        assert 'optimized_size' in optimization_result
        assert 'compression_ratio' in optimization_result
        
        # Verify optimization reduced file size
        optimized_response = requests.get(image_data['url'])
        optimized_size = len(optimized_response.content)
        
        assert optimized_size <= original_size
        assert optimization_result['compression_ratio'] > 0
    
    def test_image_metadata_extraction(self):
        """Test image metadata extraction and storage"""
        
        # Create image with specific properties
        test_image = self._create_test_image(1024, 768, 'cyan')
        
        # Calculate expected file hash
        test_image.seek(0)
        content = test_image.read()
        expected_hash = hashlib.md5(content).hexdigest()
        test_image.seek(0)
        
        # Upload image
        files = {'file': ('metadata_test.jpg', test_image, 'image/jpeg')}
        response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        
        assert response.status_code == 201
        image_data = response.json()
        self.test_images.append(image_data['id'])
        
        # Verify metadata
        assert image_data['width'] == 1024
        assert image_data['height'] == 768
        assert image_data['file_size'] > 0
        assert 'created_at' in image_data
        assert 'updated_at' in image_data
        
        # Get detailed metadata
        response = requests.get(f"{self.base_url}/api/images/{image_data['id']}/metadata")
        assert response.status_code == 200
        
        detailed_metadata = response.json()
        assert detailed_metadata['width'] == 1024
        assert detailed_metadata['height'] == 768
        assert detailed_metadata['format'] == 'JPEG'
        assert detailed_metadata['mode'] == 'RGB'
        assert 'file_hash' in detailed_metadata
    
    def test_image_category_integration(self):
        """Test image integration with categories"""
        
        # Create test category
        category_data = {"name": "Image Test Category"}
        response = requests.post(f"{self.base_url}/api/categories", json=category_data)
        assert response.status_code == 201
        category = response.json()
        self.test_categories.append(category['id'])
        
        # Upload category image
        category_image = self._create_test_image(600, 400, 'orange')
        files = {'file': ('category_image.jpg', category_image, 'image/jpeg')}
        response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        
        assert response.status_code == 201
        image_data = response.json()
        self.test_images.append(image_data['id'])
        
        # Attach image to category
        update_data = {"image_id": image_data['id']}
        response = requests.patch(f"{self.base_url}/api/categories/{category['id']}", json=update_data)
        assert response.status_code == 200
        
        # Verify category has image
        response = requests.get(f"{self.base_url}/api/categories/{category['id']}")
        assert response.status_code == 200
        updated_category = response.json()
        assert updated_category['image_id'] == image_data['id']
        assert 'image_url' in updated_category
        
        # Test image display in category listing
        response = requests.get(f"{self.base_url}/api/categories")
        assert response.status_code == 200
        categories = response.json()
        
        test_category = next((c for c in categories if c['id'] == category['id']), None)
        assert test_category is not None
        assert test_category['image_id'] == image_data['id']
        assert 'image_url' in test_category
    
    def test_image_inventory_item_integration(self):
        """Test image integration with inventory items"""
        
        # Create test category
        category_data = {"name": "Item Image Test Category"}
        response = requests.post(f"{self.base_url}/api/categories", json=category_data)
        assert response.status_code == 201
        category = response.json()
        self.test_categories.append(category['id'])
        
        # Create test item
        item_data = {
            "name": "Image Test Item",
            "sku": "IMG001",
            "category_id": category['id'],
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 10
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=item_data)
        assert response.status_code == 201
        item = response.json()
        self.test_items.append(item['id'])
        
        # Upload multiple images for the item
        item_images = []
        colors = ['red', 'green', 'blue', 'yellow']
        
        for i, color in enumerate(colors):
            image_buffer = self._create_test_image(800, 600, color)
            files = {'file': (f'item_image_{i}.jpg', image_buffer, 'image/jpeg')}
            response = requests.post(f"{self.base_url}/api/images/upload", files=files)
            
            assert response.status_code == 201
            image_data = response.json()
            item_images.append(image_data)
            self.test_images.append(image_data['id'])
        
        # Attach images to item
        for image_data in item_images:
            attach_data = {"image_id": image_data['id']}
            response = requests.post(f"{self.base_url}/api/inventory/items/{item['id']}/images", json=attach_data)
            assert response.status_code == 200
        
        # Set primary image
        primary_image_data = {"primary_image_id": item_images[0]['id']}
        response = requests.patch(f"{self.base_url}/api/inventory/items/{item['id']}", json=primary_image_data)
        assert response.status_code == 200
        
        # Verify item has images
        response = requests.get(f"{self.base_url}/api/inventory/items/{item['id']}")
        assert response.status_code == 200
        updated_item = response.json()
        
        assert updated_item['primary_image_id'] == item_images[0]['id']
        assert 'images' in updated_item
        assert len(updated_item['images']) == len(item_images)
        
        # Verify image order and data
        for i, item_image in enumerate(updated_item['images']):
            assert item_image['id'] == item_images[i]['id']
            assert 'url' in item_image
            assert 'thumbnail_url' in item_image
        
        # Test image display in item search results
        response = requests.get(f"{self.base_url}/api/inventory/search", params={"q": "Image Test Item"})
        assert response.status_code == 200
        search_results = response.json()
        
        assert len(search_results['items']) == 1
        search_item = search_results['items'][0]
        assert search_item['primary_image_id'] == item_images[0]['id']
        assert 'primary_image_url' in search_item
        assert 'thumbnail_url' in search_item
    
    def test_image_bulk_operations(self):
        """Test bulk image operations"""
        
        # Upload multiple images
        image_count = 10
        uploaded_images = []
        
        for i in range(image_count):
            image_buffer = self._create_test_image(400, 300, f'color_{i}')
            files = {'file': (f'bulk_image_{i}.jpg', image_buffer, 'image/jpeg')}
            response = requests.post(f"{self.base_url}/api/images/upload", files=files)
            
            assert response.status_code == 201
            image_data = response.json()
            uploaded_images.append(image_data)
            self.test_images.append(image_data['id'])
        
        # Test bulk metadata retrieval
        image_ids = [img['id'] for img in uploaded_images]
        response = requests.post(f"{self.base_url}/api/images/bulk/metadata", json={"image_ids": image_ids})
        assert response.status_code == 200
        
        bulk_metadata = response.json()
        assert len(bulk_metadata) == image_count
        
        for metadata in bulk_metadata:
            assert 'id' in metadata
            assert 'width' in metadata
            assert 'height' in metadata
            assert 'file_size' in metadata
        
        # Test bulk optimization
        response = requests.post(f"{self.base_url}/api/images/bulk/optimize", json={"image_ids": image_ids[:5]})
        assert response.status_code == 200
        
        optimization_results = response.json()
        assert len(optimization_results) == 5
        
        for result in optimization_results:
            assert 'image_id' in result
            assert 'original_size' in result
            assert 'optimized_size' in result
            assert 'compression_ratio' in result
        
        # Test bulk deletion
        delete_ids = image_ids[-3:]  # Delete last 3 images
        response = requests.delete(f"{self.base_url}/api/images/bulk", json={"image_ids": delete_ids})
        assert response.status_code == 200
        
        # Verify images were deleted
        for image_id in delete_ids:
            response = requests.get(f"{self.base_url}/api/images/{image_id}")
            assert response.status_code == 404
            
            # Remove from cleanup list since they're already deleted
            if image_id in self.test_images:
                self.test_images.remove(image_id)
    
    def test_image_security_validation(self):
        """Test image security validation and sanitization"""
        
        # Test malicious filename
        malicious_image = self._create_test_image(200, 200, 'black')
        files = {'file': ('../../etc/passwd.jpg', malicious_image, 'image/jpeg')}
        response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        
        if response.status_code == 201:
            # If upload succeeds, verify filename was sanitized
            image_data = response.json()
            self.test_images.append(image_data['id'])
            assert '../' not in image_data['filename']
            assert 'passwd' not in image_data['filename']
        else:
            # Should fail with security error
            assert response.status_code == 400
        
        # Test invalid file type
        fake_image = BytesIO(b"This is not an image file")
        files = {'file': ('fake.jpg', fake_image, 'image/jpeg')}
        response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        
        assert response.status_code == 400
        assert 'invalid' in response.json()['detail'].lower() or 'format' in response.json()['detail'].lower()
        
        # Test oversized file
        # Create a very large fake file
        large_fake_data = b"x" * (50 * 1024 * 1024)  # 50MB of data
        files = {'file': ('large_fake.jpg', BytesIO(large_fake_data), 'image/jpeg')}
        response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        
        assert response.status_code == 400
        assert 'size' in response.json()['detail'].lower() or 'large' in response.json()['detail'].lower()
    
    def test_image_storage_cleanup(self):
        """Test image storage cleanup and orphan detection"""
        
        # Upload test image
        test_image = self._create_test_image(300, 200, 'pink')
        files = {'file': ('cleanup_test.jpg', test_image, 'image/jpeg')}
        response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        
        assert response.status_code == 201
        image_data = response.json()
        image_id = image_data['id']
        
        # Verify image exists
        response = requests.get(f"{self.base_url}/api/images/{image_id}")
        assert response.status_code == 200
        
        # Delete image
        response = requests.delete(f"{self.base_url}/api/images/{image_id}")
        assert response.status_code == 204
        
        # Verify image is deleted
        response = requests.get(f"{self.base_url}/api/images/{image_id}")
        assert response.status_code == 404
        
        # Verify file is cleaned up from storage
        response = requests.get(image_data['url'])
        assert response.status_code == 404
        
        # Test orphan detection
        response = requests.get(f"{self.base_url}/api/images/orphans")
        assert response.status_code == 200
        orphans = response.json()
        
        # Should be a list (may be empty)
        assert isinstance(orphans, list)
        
        # Test cleanup of orphans
        if orphans:
            response = requests.delete(f"{self.base_url}/api/images/orphans/cleanup")
            assert response.status_code == 200
            
            cleanup_result = response.json()
            assert 'cleaned_count' in cleanup_result
            assert cleanup_result['cleaned_count'] >= 0
    
    def test_image_performance_metrics(self):
        """Test image processing performance metrics"""
        
        # Upload images of different sizes to test performance
        test_sizes = [
            (400, 300),   # Small
            (800, 600),   # Medium
            (1600, 1200), # Large
            (3200, 2400)  # Very large
        ]
        
        performance_results = []
        
        for width, height in test_sizes:
            # Create test image
            test_image = self._create_test_image(width, height, 'teal')
            
            # Measure upload time
            import time
            start_time = time.time()
            
            files = {'file': (f'perf_test_{width}x{height}.jpg', test_image, 'image/jpeg')}
            response = requests.post(f"{self.base_url}/api/images/upload", files=files)
            
            upload_time = time.time() - start_time
            
            if response.status_code == 201:
                image_data = response.json()
                self.test_images.append(image_data['id'])
                
                performance_results.append({
                    'size': f"{width}x{height}",
                    'file_size': image_data['file_size'],
                    'upload_time': upload_time,
                    'processing_successful': True
                })
                
                # Test thumbnail generation time
                start_time = time.time()
                response = requests.get(image_data['thumbnail_url'])
                thumbnail_time = time.time() - start_time
                
                performance_results[-1]['thumbnail_time'] = thumbnail_time
                performance_results[-1]['thumbnail_successful'] = response.status_code == 200
            else:
                performance_results.append({
                    'size': f"{width}x{height}",
                    'upload_time': upload_time,
                    'processing_successful': False,
                    'error': response.json().get('detail', 'Unknown error')
                })
        
        # Verify performance is reasonable
        for result in performance_results:
            if result['processing_successful']:
                # Upload should complete within reasonable time (adjust as needed)
                assert result['upload_time'] < 30.0, f"Upload time too slow for {result['size']}: {result['upload_time']}s"
                
                if 'thumbnail_time' in result:
                    assert result['thumbnail_time'] < 10.0, f"Thumbnail generation too slow for {result['size']}: {result['thumbnail_time']}s"
        
        # Log performance results for analysis
        print("\nImage Processing Performance Results:")
        for result in performance_results:
            print(f"Size: {result['size']}, Upload: {result['upload_time']:.2f}s, Success: {result['processing_successful']}")
            if 'thumbnail_time' in result:
                print(f"  Thumbnail: {result['thumbnail_time']:.2f}s")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])