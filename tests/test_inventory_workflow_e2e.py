"""
End-to-End Inventory Management Workflow Tests

Tests complete inventory workflows from category creation to item management,
including unlimited nested categories, custom attributes, and image management.
"""

import asyncio
import json
import os
import tempfile
from io import BytesIO
from pathlib import Path

import pytest
import requests
from PIL import Image
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import get_db
from models_universal import UniversalCategory, UniversalInventoryItem


class TestInventoryWorkflowE2E:
    """End-to-end inventory workflow tests"""
    
    @pytest.fixture(autouse=True)
    def setup_test_environment(self):
        """Setup test environment with real database"""
        self.base_url = "http://goldshop_test_backend:8000"
        self.db_url = "postgresql://goldshop_user:goldshop_password@goldshop_test_db:5432/goldshop"
        
        # Create database engine for direct queries
        self.engine = create_engine(self.db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Test data
        self.test_categories = []
        self.test_items = []
        self.test_images = []
        
        # Authenticate and get token
        self.auth_headers = self._authenticate()
        
        yield
        
        # Cleanup
        self._cleanup_test_data()
    
    def _authenticate(self) -> dict:
        """Authenticate and return headers with token"""
        # Try to login with default admin user
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response = requests.post(f"{self.base_url}/auth/login", json=login_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            return {"Authorization": f"Bearer {token}"}
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
        
        # If login fails, try to register a test user
        register_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        }
        
        response = requests.post(f"{self.base_url}/auth/register", json=register_data)
        if response.status_code == 201:
            # Now login with the new user
            login_data = {
                "username": "testuser",
                "password": "testpass123"
            }
            response = requests.post(f"{self.base_url}/auth/login", json=login_data)
            if response.status_code == 200:
                token = response.json()["access_token"]
                return {"Authorization": f"Bearer {token}"}
        
        # If all fails, return empty headers (test will fail with 403)
        return {}
    
    def _cleanup_test_data(self):
        """Clean up test data from database"""
        with self.SessionLocal() as db:
            # Delete test items
            for item_id in self.test_items:
                db.execute(text("DELETE FROM inventory_items_new WHERE id = :id"), {"id": item_id})
            
            # Delete test categories
            for category_id in self.test_categories:
                db.execute(text("DELETE FROM categories_new WHERE id = :id"), {"id": category_id})
            
            # Delete test images
            for image_id in self.test_images:
                db.execute(text("DELETE FROM images WHERE id = :id"), {"id": image_id})
            
            db.commit()
    
    def test_complete_inventory_workflow(self):
        """Test complete inventory management workflow"""
        
        # Step 1: Create root category
        root_category = self._create_category("Electronics", None)
        assert root_category is not None
        
        # Step 2: Create nested subcategories (unlimited nesting)
        mobile_category = self._create_category("Mobile Phones", root_category['id'])
        smartphone_category = self._create_category("Smartphones", mobile_category['id'])
        iphone_category = self._create_category("iPhone", smartphone_category['id'])
        
        # Verify category hierarchy
        self._verify_category_hierarchy(iphone_category['id'], 3)
        
        # Step 3: Upload category image
        category_image = self._upload_test_image("category_image.jpg")
        self._update_category_image(root_category['id'], category_image['id'])
        
        # Step 4: Create custom attribute schema for category
        attribute_schema = [
            {"name": "Brand", "type": "text", "required": True},
            {"name": "Model", "type": "text", "required": True},
            {"name": "Storage", "type": "enum", "options": ["64GB", "128GB", "256GB", "512GB"]},
            {"name": "Color", "type": "text", "required": False},
            {"name": "Price", "type": "number", "required": True},
            {"name": "In Stock", "type": "boolean", "required": True}
        ]
        
        self._update_category_schema(iphone_category['id'], attribute_schema)
        
        # Step 5: Create inventory item with custom attributes
        item_data = {
            "name": "iPhone 15 Pro",
            "description": "Latest iPhone with advanced features",
            "category_id": iphone_category['id'],
            "sku": "IPH15PRO001",
            "barcode": "1234567890123",
            "cost_price": 800.00,
            "sale_price": 1200.00,
            "stock_quantity": 10,
            "unit_of_measure": "piece",
            "low_stock_threshold": 2,
            "custom_attributes": {
                "Brand": "Apple",
                "Model": "iPhone 15 Pro",
                "Storage": "256GB",
                "Color": "Natural Titanium",
                "Price": 1200.00,
                "In Stock": True
            },
            "tags": ["smartphone", "apple", "premium", "5g"]
        }
        
        inventory_item = self._create_inventory_item(item_data)
        assert inventory_item is not None
        
        # Step 6: Upload multiple item images
        item_images = []
        for i in range(3):
            image = self._upload_test_image(f"item_image_{i}.jpg")
            item_images.append(image)
            self._attach_image_to_item(inventory_item['id'], image['id'])
        
        # Set primary image
        self._set_primary_image(inventory_item['id'], item_images[0]['id'])
        
        # Step 7: Test advanced search and filtering
        self._test_advanced_search_filtering(inventory_item)
        
        # Step 8: Test inventory movements
        self._test_inventory_movements(inventory_item['id'])
        
        # Step 9: Test SKU and barcode uniqueness
        self._test_unique_identifiers()
        
        # Step 10: Test QR code generation
        qr_code = self._generate_item_qr_code(inventory_item['id'])
        assert qr_code is not None
        
        # Step 11: Test low stock alerts
        self._test_low_stock_alerts(inventory_item['id'])
        
        # Step 12: Verify data integrity
        self._verify_data_integrity(inventory_item['id'])
    
    def _create_category(self, name: str, parent_id: str = None) -> dict:
        """Create a category"""
        data = {
            "name": name,
            "name_persian": f"{name} (فارسی)",
            "parent_id": parent_id
        }
        
        response = requests.post(f"{self.base_url}/universal-inventory/categories", json=data, headers=self.auth_headers)
        if response.status_code != 201:
            print(f"Error creating category: {response.status_code} - {response.text}")
        assert response.status_code == 201
        
        category = response.json()
        self.test_categories.append(category['id'])
        return category
    
    def _verify_category_hierarchy(self, category_id: str, expected_level: int):
        """Verify category hierarchy using LTREE"""
        with self.SessionLocal() as db:
            result = db.execute(
                text("SELECT level, path FROM categories_new WHERE id = :id"),
                {"id": category_id}
            ).fetchone()
            
            assert result is not None
            assert result.level == expected_level
            assert len(result.path.split('.')) == expected_level + 1
    
    def _upload_test_image(self, filename: str) -> dict:
        """Upload a test image"""
        # Create a test image
        image = Image.new('RGB', (800, 600), color='red')
        image_buffer = BytesIO()
        image.save(image_buffer, format='JPEG')
        image_buffer.seek(0)
        
        files = {
            'file': (filename, image_buffer, 'image/jpeg')
        }
        
        data = {
            'entity_type': 'test',
            'entity_id': 'test-entity-id'
        }
        
        response = requests.post(f"{self.base_url}/api/images/upload", files=files, data=data, headers=self.auth_headers)
        if response.status_code != 201:
            print(f"Error uploading image: {response.status_code} - {response.text}")
        assert response.status_code == 201
        
        image_data = response.json()
        self.test_images.append(image_data['id'])
        return image_data
    
    def _update_category_image(self, category_id: str, image_id: str):
        """Update category image"""
        data = {"image_id": image_id}
        response = requests.put(f"{self.base_url}/universal-inventory/categories/{category_id}", json=data)
        assert response.status_code == 200
    
    def _update_category_schema(self, category_id: str, schema: list):
        """Update category attribute schema"""
        data = {"attribute_schema": schema}
        response = requests.put(f"{self.base_url}/universal-inventory/categories/{category_id}", json=data)
        assert response.status_code == 200
    
    def _create_inventory_item(self, item_data: dict) -> dict:
        """Create an inventory item"""
        response = requests.post(f"{self.base_url}/universal-inventory/items", json=item_data)
        assert response.status_code == 201
        
        item = response.json()
        self.test_items.append(item['id'])
        return item
    
    def _attach_image_to_item(self, item_id: str, image_id: str):
        """Attach image to inventory item"""
        data = {"image_id": image_id}
        response = requests.post(f"{self.base_url}/api/inventory/items/{item_id}/images", json=data)
        assert response.status_code == 200
    
    def _set_primary_image(self, item_id: str, image_id: str):
        """Set primary image for item"""
        data = {"primary_image_id": image_id}
        response = requests.patch(f"{self.base_url}/api/inventory/items/{item_id}", json=data)
        assert response.status_code == 200
    
    def _test_advanced_search_filtering(self, item: dict):
        """Test advanced search and filtering capabilities"""
        
        # Test search by name
        response = requests.get(f"{self.base_url}/api/inventory/search", params={"q": "iPhone"})
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) > 0
        assert any(result['id'] == item['id'] for result in results['items'])
        
        # Test search by SKU
        response = requests.get(f"{self.base_url}/api/inventory/search", params={"sku": item['sku']})
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 1
        assert results['items'][0]['id'] == item['id']
        
        # Test search by barcode
        response = requests.get(f"{self.base_url}/api/inventory/search", params={"barcode": item['barcode']})
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 1
        
        # Test filter by custom attributes
        response = requests.get(
            f"{self.base_url}/api/inventory/search",
            params={"attributes": json.dumps({"Brand": "Apple", "Storage": "256GB"})}
        )
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) > 0
        
        # Test filter by tags
        response = requests.get(f"{self.base_url}/api/inventory/search", params={"tags": "smartphone,apple"})
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) > 0
        
        # Test category hierarchy filtering
        response = requests.get(f"{self.base_url}/api/inventory/search", params={"category_id": item['category_id']})
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) > 0
    
    def _test_inventory_movements(self, item_id: str):
        """Test inventory movement tracking"""
        
        # Get initial stock
        response = requests.get(f"{self.base_url}/api/inventory/items/{item_id}")
        assert response.status_code == 200
        initial_stock = response.json()['stock_quantity']
        
        # Record stock adjustment (increase)
        adjustment_data = {
            "item_id": item_id,
            "movement_type": "adjustment",
            "quantity": 5,
            "reason": "Stock replenishment",
            "reference": "ADJ001"
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/movements", json=adjustment_data)
        assert response.status_code == 201
        
        # Verify stock increased
        response = requests.get(f"{self.base_url}/api/inventory/items/{item_id}")
        assert response.status_code == 200
        new_stock = response.json()['stock_quantity']
        assert new_stock == initial_stock + 5
        
        # Record stock reduction (sale)
        sale_data = {
            "item_id": item_id,
            "movement_type": "sale",
            "quantity": -3,
            "reason": "Item sold",
            "reference": "INV001"
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/movements", json=sale_data)
        assert response.status_code == 201
        
        # Verify stock decreased
        response = requests.get(f"{self.base_url}/api/inventory/items/{item_id}")
        assert response.status_code == 200
        final_stock = response.json()['stock_quantity']
        assert final_stock == new_stock - 3
        
        # Get movement history
        response = requests.get(f"{self.base_url}/api/inventory/items/{item_id}/movements")
        assert response.status_code == 200
        movements = response.json()
        assert len(movements) >= 2
    
    def _test_unique_identifiers(self):
        """Test SKU and barcode uniqueness validation"""
        
        # Try to create item with duplicate SKU
        duplicate_sku_data = {
            "name": "Test Item",
            "sku": "IPH15PRO001",  # Same as existing item
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 5
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=duplicate_sku_data)
        assert response.status_code == 400
        assert "SKU already exists" in response.json()['detail']
        
        # Try to create item with duplicate barcode
        duplicate_barcode_data = {
            "name": "Test Item",
            "sku": "UNIQUE001",
            "barcode": "1234567890123",  # Same as existing item
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 5
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=duplicate_barcode_data)
        assert response.status_code == 400
        assert "Barcode already exists" in response.json()['detail']
    
    def _generate_item_qr_code(self, item_id: str) -> dict:
        """Generate QR code for item"""
        response = requests.post(f"{self.base_url}/api/inventory/items/{item_id}/qr-code")
        assert response.status_code == 201
        return response.json()
    
    def _test_low_stock_alerts(self, item_id: str):
        """Test low stock alert system"""
        
        # Reduce stock below threshold
        with self.SessionLocal() as db:
            db.execute(
                text("UPDATE inventory_items SET stock_quantity = 1 WHERE id = :id"),
                {"id": item_id}
            )
            db.commit()
        
        # Check low stock alerts
        response = requests.get(f"{self.base_url}/api/inventory/low-stock-alerts")
        assert response.status_code == 200
        alerts = response.json()
        
        # Verify our item is in low stock alerts
        assert any(alert['item_id'] == item_id for alert in alerts)
    
    def _verify_data_integrity(self, item_id: str):
        """Verify data integrity across all related tables"""
        
        with self.SessionLocal() as db:
            # Verify item exists
            item_result = db.execute(
                text("SELECT * FROM inventory_items WHERE id = :id"),
                {"id": item_id}
            ).fetchone()
            assert item_result is not None
            
            # Verify category relationship
            category_result = db.execute(
                text("SELECT * FROM categories WHERE id = :id"),
                {"id": item_result.category_id}
            ).fetchone()
            assert category_result is not None
            
            # Verify images are attached
            image_results = db.execute(
                text("""
                    SELECT COUNT(*) as count 
                    FROM item_images 
                    WHERE item_id = :id
                """),
                {"id": item_id}
            ).fetchone()
            assert image_results.count > 0
            
            # Verify custom attributes are stored correctly
            assert item_result.custom_attributes is not None
            assert 'Brand' in item_result.custom_attributes
            assert item_result.custom_attributes['Brand'] == 'Apple'
            
            # Verify tags are stored correctly
            assert item_result.tags is not None
            assert 'smartphone' in item_result.tags
    
    def test_bulk_operations(self):
        """Test bulk inventory operations"""
        
        # Create multiple items for bulk operations
        items_data = []
        for i in range(10):
            item_data = {
                "name": f"Bulk Item {i}",
                "sku": f"BULK{i:03d}",
                "cost_price": 50.00 + i,
                "sale_price": 75.00 + i,
                "stock_quantity": 10 + i,
                "tags": ["bulk", "test"]
            }
            items_data.append(item_data)
        
        # Bulk create items
        response = requests.post(f"{self.base_url}/api/inventory/items/bulk", json={"items": items_data})
        assert response.status_code == 201
        created_items = response.json()
        assert len(created_items) == 10
        
        # Add created items to cleanup list
        for item in created_items:
            self.test_items.append(item['id'])
        
        # Bulk update prices
        price_updates = [
            {"id": item['id'], "sale_price": item['sale_price'] + 10}
            for item in created_items
        ]
        
        response = requests.patch(f"{self.base_url}/api/inventory/items/bulk", json={"updates": price_updates})
        assert response.status_code == 200
        
        # Verify updates
        for update in price_updates:
            response = requests.get(f"{self.base_url}/api/inventory/items/{update['id']}")
            assert response.status_code == 200
            item = response.json()
            assert item['sale_price'] == update['sale_price']
    
    def test_category_tree_operations(self):
        """Test category tree operations and LTREE functionality"""
        
        # Create deep category hierarchy
        root = self._create_category("Root Category")
        level1 = self._create_category("Level 1", root['id'])
        level2 = self._create_category("Level 2", level1['id'])
        level3 = self._create_category("Level 3", level2['id'])
        level4 = self._create_category("Level 4", level3['id'])
        
        # Test ancestor queries
        response = requests.get(f"{self.base_url}/api/categories/{level4['id']}/ancestors")
        assert response.status_code == 200
        ancestors = response.json()
        assert len(ancestors) == 4  # Root, Level1, Level2, Level3
        
        # Test descendant queries
        response = requests.get(f"{self.base_url}/api/categories/{root['id']}/descendants")
        assert response.status_code == 200
        descendants = response.json()
        assert len(descendants) == 4  # Level1, Level2, Level3, Level4
        
        # Test moving category (change parent)
        new_parent = self._create_category("New Parent")
        move_data = {"parent_id": new_parent['id']}
        
        response = requests.patch(f"{self.base_url}/api/categories/{level2['id']}/move", json=move_data)
        assert response.status_code == 200
        
        # Verify the move updated the hierarchy
        response = requests.get(f"{self.base_url}/api/categories/{level4['id']}/ancestors")
        assert response.status_code == 200
        new_ancestors = response.json()
        # Should now include New Parent instead of Root and Level1
        assert any(ancestor['id'] == new_parent['id'] for ancestor in new_ancestors)
    
    def test_image_management_workflow(self):
        """Test complete image management workflow"""
        
        # Create test category and item
        category = self._create_category("Image Test Category")
        item_data = {
            "name": "Image Test Item",
            "sku": "IMG001",
            "category_id": category['id'],
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 5
        }
        item = self._create_inventory_item(item_data)
        
        # Upload multiple images with different formats
        image_formats = [
            ('test1.jpg', 'JPEG'),
            ('test2.png', 'PNG'),
            ('test3.webp', 'WEBP')
        ]
        
        uploaded_images = []
        for filename, format_type in image_formats:
            image = Image.new('RGB', (1200, 800), color='blue')
            image_buffer = BytesIO()
            image.save(image_buffer, format=format_type)
            image_buffer.seek(0)
            
            files = {'file': (filename, image_buffer, f'image/{format_type.lower()}')}
            response = requests.post(f"{self.base_url}/api/images/upload", files=files)
            assert response.status_code == 201
            
            image_data = response.json()
            uploaded_images.append(image_data)
            self.test_images.append(image_data['id'])
        
        # Attach images to item
        for image_data in uploaded_images:
            self._attach_image_to_item(item['id'], image_data['id'])
        
        # Test thumbnail generation
        for image_data in uploaded_images:
            response = requests.get(f"{self.base_url}/api/images/{image_data['id']}/thumbnail")
            assert response.status_code == 200
            assert response.headers['content-type'].startswith('image/')
        
        # Test image optimization
        response = requests.post(f"{self.base_url}/api/images/{uploaded_images[0]['id']}/optimize")
        assert response.status_code == 200
        
        # Test image deletion with cleanup
        response = requests.delete(f"{self.base_url}/api/images/{uploaded_images[-1]['id']}")
        assert response.status_code == 204
        
        # Verify image was removed from item
        response = requests.get(f"{self.base_url}/api/inventory/items/{item['id']}")
        assert response.status_code == 200
        item_data = response.json()
        assert uploaded_images[-1]['id'] not in [img['id'] for img in item_data.get('images', [])]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])