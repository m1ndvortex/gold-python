"""
Inventory Management Regression Tests

Tests to ensure inventory functionality remains stable across system changes:
- Stock level tracking and movements
- Category hierarchy operations
- Custom attributes and validation
- Search and filtering functionality
- Image management integration
- SKU/Barcode uniqueness
- Low stock alerts
"""

import json
import pytest
import requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


class TestInventoryRegression:
    """Regression tests for inventory management"""
    
    @pytest.fixture(autouse=True)
    def setup_test_environment(self):
        """Setup test environment with real database"""
        self.base_url = "http://localhost:8000"
        self.db_url = "postgresql://goldshop_user:goldshop_password@localhost:5432/goldshop"
        
        # Create database engine for direct queries
        self.engine = create_engine(self.db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Test data tracking
        self.test_categories = []
        self.test_items = []
        self.test_images = []
        
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
    
    def test_stock_movement_accuracy_regression(self):
        """Test that stock movements are accurately tracked and calculated"""
        
        # Create test item with initial stock
        item_data = {
            "name": "Stock Test Item",
            "sku": "STOCK001",
            "cost_price": 50.00,
            "sale_price": 75.00,
            "stock_quantity": 100,
            "low_stock_threshold": 10
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=item_data)
        assert response.status_code == 201
        item = response.json()
        self.test_items.append(item['id'])
        
        # Verify initial stock
        assert item['stock_quantity'] == 100
        
        # Test series of stock movements
        movements = [
            {"type": "adjustment", "quantity": 25, "reason": "Stock replenishment"},
            {"type": "sale", "quantity": -15, "reason": "Item sold"},
            {"type": "adjustment", "quantity": -5, "reason": "Damaged items"},
            {"type": "return", "quantity": 3, "reason": "Customer return"},
            {"type": "transfer", "quantity": -8, "reason": "Transfer to warehouse"}
        ]
        
        expected_stock = 100
        
        for movement in movements:
            # Record movement
            movement_data = {
                "item_id": item['id'],
                "movement_type": movement["type"],
                "quantity": movement["quantity"],
                "reason": movement["reason"],
                "reference": f"REG_{movement['type'].upper()}"
            }
            
            response = requests.post(f"{self.base_url}/api/inventory/movements", json=movement_data)
            assert response.status_code == 201
            
            # Update expected stock
            expected_stock += movement["quantity"]
            
            # Verify current stock matches expected
            response = requests.get(f"{self.base_url}/api/inventory/items/{item['id']}")
            assert response.status_code == 200
            current_item = response.json()
            assert current_item['stock_quantity'] == expected_stock, f"Stock mismatch after {movement['type']}: expected {expected_stock}, got {current_item['stock_quantity']}"
        
        # Verify movement history
        response = requests.get(f"{self.base_url}/api/inventory/items/{item['id']}/movements")
        assert response.status_code == 200
        movement_history = response.json()
        assert len(movement_history) == len(movements)
        
        # Verify total movement calculation
        total_movement = sum(m["quantity"] for m in movements)
        calculated_stock = 100 + total_movement
        assert calculated_stock == expected_stock
    
    def test_category_hierarchy_ltree_regression(self):
        """Test that LTREE category hierarchy operations work correctly"""
        
        # Create deep category hierarchy
        categories = []
        
        # Root category
        root_data = {"name": "Electronics", "name_persian": "الکترونیک"}
        response = requests.post(f"{self.base_url}/api/categories", json=root_data)
        assert response.status_code == 201
        root = response.json()
        categories.append(root)
        self.test_categories.append(root['id'])
        
        # Level 1
        level1_data = {"name": "Mobile Devices", "parent_id": root['id']}
        response = requests.post(f"{self.base_url}/api/categories", json=level1_data)
        assert response.status_code == 201
        level1 = response.json()
        categories.append(level1)
        self.test_categories.append(level1['id'])
        
        # Level 2
        level2_data = {"name": "Smartphones", "parent_id": level1['id']}
        response = requests.post(f"{self.base_url}/api/categories", json=level2_data)
        assert response.status_code == 201
        level2 = response.json()
        categories.append(level2)
        self.test_categories.append(level2['id'])
        
        # Level 3
        level3_data = {"name": "iPhone", "parent_id": level2['id']}
        response = requests.post(f"{self.base_url}/api/categories", json=level3_data)
        assert response.status_code == 201
        level3 = response.json()
        categories.append(level3)
        self.test_categories.append(level3['id'])
        
        # Level 4
        level4_data = {"name": "iPhone 15 Series", "parent_id": level3['id']}
        response = requests.post(f"{self.base_url}/api/categories", json=level4_data)
        assert response.status_code == 201
        level4 = response.json()
        categories.append(level4)
        self.test_categories.append(level4['id'])
        
        # Test hierarchy queries
        
        # Test ancestors query
        response = requests.get(f"{self.base_url}/api/categories/{level4['id']}/ancestors")
        assert response.status_code == 200
        ancestors = response.json()
        assert len(ancestors) == 4  # Should have 4 ancestors
        
        # Verify ancestor order (should be from root to immediate parent)
        ancestor_names = [a['name'] for a in ancestors]
        expected_order = ["Electronics", "Mobile Devices", "Smartphones", "iPhone"]
        assert ancestor_names == expected_order
        
        # Test descendants query
        response = requests.get(f"{self.base_url}/api/categories/{root['id']}/descendants")
        assert response.status_code == 200
        descendants = response.json()
        assert len(descendants) == 4  # Should have 4 descendants
        
        # Test siblings query
        # Create sibling for level4
        sibling_data = {"name": "iPhone 14 Series", "parent_id": level3['id']}
        response = requests.post(f"{self.base_url}/api/categories", json=sibling_data)
        assert response.status_code == 201
        sibling = response.json()
        self.test_categories.append(sibling['id'])
        
        response = requests.get(f"{self.base_url}/api/categories/{level4['id']}/siblings")
        assert response.status_code == 200
        siblings = response.json()
        assert len(siblings) == 1  # Should have 1 sibling
        assert siblings[0]['id'] == sibling['id']
        
        # Test category path integrity
        with self.SessionLocal() as db:
            for category in categories:
                result = db.execute(
                    text("SELECT path, level FROM categories WHERE id = :id"),
                    {"id": category['id']}
                ).fetchone()
                
                # Verify path depth matches level
                path_depth = len(result.path.split('.')) - 1
                assert path_depth == result.level
        
        # Test category move operation
        new_parent_data = {"name": "Tablets", "parent_id": level1['id']}
        response = requests.post(f"{self.base_url}/api/categories", json=new_parent_data)
        assert response.status_code == 201
        new_parent = response.json()
        self.test_categories.append(new_parent['id'])
        
        # Move level2 under new parent
        move_data = {"parent_id": new_parent['id']}
        response = requests.patch(f"{self.base_url}/api/categories/{level2['id']}/move", json=move_data)
        assert response.status_code == 200
        
        # Verify the move updated all descendant paths
        response = requests.get(f"{self.base_url}/api/categories/{level4['id']}/ancestors")
        assert response.status_code == 200
        new_ancestors = response.json()
        
        # Should now include Tablets in the path
        ancestor_names = [a['name'] for a in new_ancestors]
        assert "Tablets" in ancestor_names
        assert "Mobile Devices" not in ancestor_names  # Should no longer be in path
    
    def test_custom_attributes_validation_regression(self):
        """Test custom attributes schema validation and storage"""
        
        # Create category with complex attribute schema
        category_data = {
            "name": "Test Products",
            "attribute_schema": [
                {
                    "name": "Brand",
                    "type": "text",
                    "required": True,
                    "searchable": True
                },
                {
                    "name": "Price Range",
                    "type": "enum",
                    "options": ["Budget", "Mid-range", "Premium", "Luxury"],
                    "required": True
                },
                {
                    "name": "Weight",
                    "type": "number",
                    "required": False,
                    "min_value": 0,
                    "max_value": 1000
                },
                {
                    "name": "Release Date",
                    "type": "date",
                    "required": False
                },
                {
                    "name": "In Production",
                    "type": "boolean",
                    "required": True,
                    "default": True
                }
            ]
        }
        
        response = requests.post(f"{self.base_url}/api/categories", json=category_data)
        assert response.status_code == 201
        category = response.json()
        self.test_categories.append(category['id'])
        
        # Test valid item with all attribute types
        valid_item_data = {
            "name": "Test Product",
            "sku": "ATTR001",
            "category_id": category['id'],
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 50,
            "custom_attributes": {
                "Brand": "TestBrand",
                "Price Range": "Premium",
                "Weight": 250.5,
                "Release Date": "2024-01-15",
                "In Production": True
            }
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=valid_item_data)
        assert response.status_code == 201
        item = response.json()
        self.test_items.append(item['id'])
        
        # Verify attributes are stored correctly
        assert item['custom_attributes']['Brand'] == "TestBrand"
        assert item['custom_attributes']['Price Range'] == "Premium"
        assert item['custom_attributes']['Weight'] == 250.5
        assert item['custom_attributes']['Release Date'] == "2024-01-15"
        assert item['custom_attributes']['In Production'] is True
        
        # Test validation failures
        
        # Missing required field
        invalid_item_data = {
            "name": "Invalid Product",
            "sku": "ATTR002",
            "category_id": category['id'],
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 50,
            "custom_attributes": {
                "Price Range": "Budget"
                # Missing required "Brand" field
            }
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=invalid_item_data)
        assert response.status_code == 400
        assert "Brand" in response.json()['detail']
        
        # Invalid enum value
        invalid_enum_data = {
            "name": "Invalid Enum Product",
            "sku": "ATTR003",
            "category_id": category['id'],
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 50,
            "custom_attributes": {
                "Brand": "TestBrand",
                "Price Range": "Invalid Range",  # Not in enum options
                "In Production": True
            }
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=invalid_enum_data)
        assert response.status_code == 400
        assert "Price Range" in response.json()['detail']
        
        # Invalid number range
        invalid_number_data = {
            "name": "Invalid Number Product",
            "sku": "ATTR004",
            "category_id": category['id'],
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 50,
            "custom_attributes": {
                "Brand": "TestBrand",
                "Price Range": "Budget",
                "Weight": 1500,  # Exceeds max_value of 1000
                "In Production": True
            }
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=invalid_number_data)
        assert response.status_code == 400
        assert "Weight" in response.json()['detail']
        
        # Test attribute search functionality
        response = requests.get(
            f"{self.base_url}/api/inventory/search",
            params={"attributes": json.dumps({"Brand": "TestBrand"})}
        )
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) >= 1
        assert any(item['id'] == item['id'] for item in results['items'])
    
    def test_search_filtering_regression(self):
        """Test search and filtering functionality remains accurate"""
        
        # Create test category
        category_data = {"name": "Search Test Category"}
        response = requests.post(f"{self.base_url}/api/categories", json=category_data)
        assert response.status_code == 201
        category = response.json()
        self.test_categories.append(category['id'])
        
        # Create test items with various attributes
        test_items = [
            {
                "name": "Apple iPhone 15",
                "sku": "SEARCH001",
                "category_id": category['id'],
                "cost_price": 800.00,
                "sale_price": 1200.00,
                "stock_quantity": 25,
                "tags": ["smartphone", "apple", "premium"],
                "custom_attributes": {"Brand": "Apple", "Color": "Blue"}
            },
            {
                "name": "Samsung Galaxy S24",
                "sku": "SEARCH002",
                "category_id": category['id'],
                "cost_price": 700.00,
                "sale_price": 1000.00,
                "stock_quantity": 30,
                "tags": ["smartphone", "samsung", "android"],
                "custom_attributes": {"Brand": "Samsung", "Color": "Black"}
            },
            {
                "name": "Apple MacBook Pro",
                "sku": "SEARCH003",
                "category_id": category['id'],
                "cost_price": 1500.00,
                "sale_price": 2200.00,
                "stock_quantity": 10,
                "tags": ["laptop", "apple", "premium"],
                "custom_attributes": {"Brand": "Apple", "Color": "Silver"}
            }
        ]
        
        created_items = []
        for item_data in test_items:
            response = requests.post(f"{self.base_url}/api/inventory/items", json=item_data)
            assert response.status_code == 201
            item = response.json()
            created_items.append(item)
            self.test_items.append(item['id'])
        
        # Test name search
        response = requests.get(f"{self.base_url}/api/inventory/search", params={"q": "iPhone"})
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 1
        assert results['items'][0]['name'] == "Apple iPhone 15"
        
        # Test partial name search
        response = requests.get(f"{self.base_url}/api/inventory/search", params={"q": "Apple"})
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 2  # iPhone and MacBook
        
        # Test SKU search
        response = requests.get(f"{self.base_url}/api/inventory/search", params={"sku": "SEARCH002"})
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 1
        assert results['items'][0]['sku'] == "SEARCH002"
        
        # Test tag filtering
        response = requests.get(f"{self.base_url}/api/inventory/search", params={"tags": "smartphone"})
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 2  # iPhone and Samsung
        
        # Test multiple tag filtering
        response = requests.get(f"{self.base_url}/api/inventory/search", params={"tags": "apple,premium"})
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 2  # iPhone and MacBook (both have apple and premium tags)
        
        # Test attribute filtering
        response = requests.get(
            f"{self.base_url}/api/inventory/search",
            params={"attributes": json.dumps({"Brand": "Apple"})}
        )
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 2  # iPhone and MacBook
        
        # Test combined filtering
        response = requests.get(
            f"{self.base_url}/api/inventory/search",
            params={
                "q": "Apple",
                "tags": "smartphone",
                "attributes": json.dumps({"Color": "Blue"})
            }
        )
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 1  # Only iPhone matches all criteria
        assert results['items'][0]['name'] == "Apple iPhone 15"
        
        # Test price range filtering
        response = requests.get(
            f"{self.base_url}/api/inventory/search",
            params={"min_price": 1000.00, "max_price": 1500.00}
        )
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 2  # iPhone and Samsung
        
        # Test stock filtering
        response = requests.get(
            f"{self.base_url}/api/inventory/search",
            params={"min_stock": 20}
        )
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 2  # iPhone (25) and Samsung (30)
        
        # Test category filtering
        response = requests.get(
            f"{self.base_url}/api/inventory/search",
            params={"category_id": category['id']}
        )
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) == 3  # All items in this category
        
        # Test pagination
        response = requests.get(
            f"{self.base_url}/api/inventory/search",
            params={"limit": 2, "offset": 0}
        )
        assert response.status_code == 200
        results = response.json()
        assert len(results['items']) <= 2
        
        # Test sorting
        response = requests.get(
            f"{self.base_url}/api/inventory/search",
            params={"sort_by": "sale_price", "sort_order": "desc"}
        )
        assert response.status_code == 200
        results = response.json()
        # Should be sorted by price descending
        prices = [item['sale_price'] for item in results['items']]
        assert prices == sorted(prices, reverse=True)
    
    def test_sku_barcode_uniqueness_regression(self):
        """Test SKU and barcode uniqueness constraints"""
        
        # Create first item
        item1_data = {
            "name": "Unique Test Item 1",
            "sku": "UNIQUE001",
            "barcode": "1234567890123",
            "cost_price": 50.00,
            "sale_price": 75.00,
            "stock_quantity": 10
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=item1_data)
        assert response.status_code == 201
        item1 = response.json()
        self.test_items.append(item1['id'])
        
        # Try to create item with duplicate SKU
        item2_data = {
            "name": "Unique Test Item 2",
            "sku": "UNIQUE001",  # Same SKU
            "barcode": "9876543210987",
            "cost_price": 60.00,
            "sale_price": 85.00,
            "stock_quantity": 15
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=item2_data)
        assert response.status_code == 400
        assert "SKU" in response.json()['detail']
        
        # Try to create item with duplicate barcode
        item3_data = {
            "name": "Unique Test Item 3",
            "sku": "UNIQUE002",
            "barcode": "1234567890123",  # Same barcode
            "cost_price": 70.00,
            "sale_price": 95.00,
            "stock_quantity": 20
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=item3_data)
        assert response.status_code == 400
        assert "barcode" in response.json()['detail'].lower()
        
        # Create item with unique SKU and barcode (should succeed)
        item4_data = {
            "name": "Unique Test Item 4",
            "sku": "UNIQUE003",
            "barcode": "5555555555555",
            "cost_price": 80.00,
            "sale_price": 105.00,
            "stock_quantity": 25
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=item4_data)
        assert response.status_code == 201
        item4 = response.json()
        self.test_items.append(item4['id'])
        
        # Test updating item with duplicate SKU (should fail)
        update_data = {"sku": "UNIQUE003"}  # Try to use item4's SKU
        response = requests.patch(f"{self.base_url}/api/inventory/items/{item1['id']}", json=update_data)
        assert response.status_code == 400
        assert "SKU" in response.json()['detail']
        
        # Test updating item with unique SKU (should succeed)
        update_data = {"sku": "UNIQUE001_UPDATED"}
        response = requests.patch(f"{self.base_url}/api/inventory/items/{item1['id']}", json=update_data)
        assert response.status_code == 200
        
        # Verify the update
        response = requests.get(f"{self.base_url}/api/inventory/items/{item1['id']}")
        assert response.status_code == 200
        updated_item = response.json()
        assert updated_item['sku'] == "UNIQUE001_UPDATED"
    
    def test_low_stock_alerts_regression(self):
        """Test low stock alert system accuracy"""
        
        # Create items with different stock levels
        items_data = [
            {
                "name": "High Stock Item",
                "sku": "STOCK_HIGH",
                "stock_quantity": 100,
                "low_stock_threshold": 10,
                "cost_price": 50.00,
                "sale_price": 75.00
            },
            {
                "name": "Medium Stock Item",
                "sku": "STOCK_MED",
                "stock_quantity": 15,
                "low_stock_threshold": 20,  # Above threshold, should alert
                "cost_price": 60.00,
                "sale_price": 85.00
            },
            {
                "name": "Low Stock Item",
                "sku": "STOCK_LOW",
                "stock_quantity": 5,
                "low_stock_threshold": 10,  # Below threshold, should alert
                "cost_price": 70.00,
                "sale_price": 95.00
            },
            {
                "name": "Zero Stock Item",
                "sku": "STOCK_ZERO",
                "stock_quantity": 0,
                "low_stock_threshold": 5,  # Below threshold, should alert
                "cost_price": 80.00,
                "sale_price": 105.00
            }
        ]
        
        created_items = []
        for item_data in items_data:
            response = requests.post(f"{self.base_url}/api/inventory/items", json=item_data)
            assert response.status_code == 201
            item = response.json()
            created_items.append(item)
            self.test_items.append(item['id'])
        
        # Get low stock alerts
        response = requests.get(f"{self.base_url}/api/inventory/low-stock-alerts")
        assert response.status_code == 200
        alerts = response.json()
        
        # Should have 3 alerts (Medium, Low, and Zero stock items)
        alert_skus = [alert['sku'] for alert in alerts]
        expected_alert_skus = ["STOCK_MED", "STOCK_LOW", "STOCK_ZERO"]
        
        for expected_sku in expected_alert_skus:
            assert expected_sku in alert_skus, f"Expected {expected_sku} to be in low stock alerts"
        
        # High stock item should not be in alerts
        assert "STOCK_HIGH" not in alert_skus
        
        # Test alert details
        for alert in alerts:
            assert 'item_id' in alert
            assert 'name' in alert
            assert 'sku' in alert
            assert 'current_stock' in alert
            assert 'threshold' in alert
            assert alert['current_stock'] <= alert['threshold']
        
        # Test stock movement affecting alerts
        # Increase stock for low stock item above threshold
        movement_data = {
            "item_id": created_items[2]['id'],  # Low stock item
            "movement_type": "adjustment",
            "quantity": 20,  # Bring to 25, above threshold of 10
            "reason": "Stock replenishment"
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/movements", json=movement_data)
        assert response.status_code == 201
        
        # Get alerts again
        response = requests.get(f"{self.base_url}/api/inventory/low-stock-alerts")
        assert response.status_code == 200
        new_alerts = response.json()
        
        # Low stock item should no longer be in alerts
        new_alert_skus = [alert['sku'] for alert in new_alerts]
        assert "STOCK_LOW" not in new_alert_skus
        
        # But medium and zero stock items should still be there
        assert "STOCK_MED" in new_alert_skus
        assert "STOCK_ZERO" in new_alert_skus
    
    def test_inventory_data_integrity_regression(self):
        """Test data integrity across inventory operations"""
        
        # Create category
        category_data = {"name": "Integrity Test Category"}
        response = requests.post(f"{self.base_url}/api/categories", json=category_data)
        assert response.status_code == 201
        category = response.json()
        self.test_categories.append(category['id'])
        
        # Create item
        item_data = {
            "name": "Integrity Test Item",
            "sku": "INTEGRITY001",
            "category_id": category['id'],
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 50,
            "custom_attributes": {"test_attr": "test_value"},
            "tags": ["test", "integrity"]
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=item_data)
        assert response.status_code == 201
        item = response.json()
        self.test_items.append(item['id'])
        
        # Verify all data is stored correctly
        response = requests.get(f"{self.base_url}/api/inventory/items/{item['id']}")
        assert response.status_code == 200
        retrieved_item = response.json()
        
        assert retrieved_item['name'] == item_data['name']
        assert retrieved_item['sku'] == item_data['sku']
        assert retrieved_item['category_id'] == item_data['category_id']
        assert retrieved_item['cost_price'] == item_data['cost_price']
        assert retrieved_item['sale_price'] == item_data['sale_price']
        assert retrieved_item['stock_quantity'] == item_data['stock_quantity']
        assert retrieved_item['custom_attributes'] == item_data['custom_attributes']
        assert set(retrieved_item['tags']) == set(item_data['tags'])
        
        # Test database-level integrity
        with self.SessionLocal() as db:
            # Verify item exists in database
            result = db.execute(
                text("SELECT * FROM inventory_items WHERE id = :id"),
                {"id": item['id']}
            ).fetchone()
            
            assert result is not None
            assert result.name == item_data['name']
            assert result.sku == item_data['sku']
            assert str(result.category_id) == item_data['category_id']
            assert float(result.cost_price) == item_data['cost_price']
            assert float(result.sale_price) == item_data['sale_price']
            assert float(result.stock_quantity) == item_data['stock_quantity']
            
            # Verify category relationship
            category_result = db.execute(
                text("SELECT * FROM categories WHERE id = :id"),
                {"id": category['id']}
            ).fetchone()
            
            assert category_result is not None
            assert category_result.name == category_data['name']
            
            # Verify foreign key constraint
            assert str(result.category_id) == category['id']
        
        # Test cascading operations
        # Update category name
        update_data = {"name": "Updated Integrity Test Category"}
        response = requests.patch(f"{self.base_url}/api/categories/{category['id']}", json=update_data)
        assert response.status_code == 200
        
        # Verify item still references correct category
        response = requests.get(f"{self.base_url}/api/inventory/items/{item['id']}")
        assert response.status_code == 200
        updated_item = response.json()
        assert updated_item['category_id'] == category['id']
        
        # Verify category name was updated
        response = requests.get(f"{self.base_url}/api/categories/{category['id']}")
        assert response.status_code == 200
        updated_category = response.json()
        assert updated_category['name'] == "Updated Integrity Test Category"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])