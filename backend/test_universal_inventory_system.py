"""
Comprehensive Unit Tests for Universal Inventory Management System
Tests all features including nested categories, custom attributes, advanced search,
SKU/barcode management, inventory movements, and audit trails.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from uuid import uuid4
import json

from main import app
from database import get_db, engine
from models_universal import (
    Base, InventoryItem, Category, InventoryMovement, User, Role, AuditLog
)
from services.inventory_service import UniversalInventoryService
from schemas_inventory_universal import *


# Test client setup
client = TestClient(app)

# Test database setup
@pytest.fixture(scope="function")
def db_session():
    """Create a test database session"""
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        yield db
    finally:
        db.rollback()
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(db_session: Session):
    """Create a test user"""
    role = Role(
        name="admin",
        description="Administrator",
        permissions={"inventory": ["create", "read", "update", "delete"]}
    )
    db_session.add(role)
    db_session.commit()
    
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash="hashed_password",
        role_id=role.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def inventory_service(db_session: Session):
    """Create inventory service instance"""
    return UniversalInventoryService(db_session)


class TestCategoryManagement:
    """Test category management with hierarchical structure"""
    
    def test_create_root_category(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test creating a root category"""
        category_data = UniversalCategoryCreate(
            name="Electronics",
            description="Electronic items",
            business_type="retail",
            attribute_schema=[
                AttributeDefinition(
                    name="brand",
                    label="Brand",
                    type=AttributeType.TEXT,
                    required=True
                ),
                AttributeDefinition(
                    name="warranty_months",
                    label="Warranty (Months)",
                    type=AttributeType.NUMBER,
                    required=False
                )
            ]
        )
        
        category = inventory_service.create_category(
            category_data=category_data,
            user_id=str(test_user.id),
            business_type="retail"
        )
        
        assert category.name == "Electronics"
        assert category.level == 0
        assert category.parent_id is None
        assert len(category.attribute_schema) == 2
        assert category.business_type == "retail"
    
    def test_create_nested_category(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test creating nested categories"""
        # Create parent category
        parent_data = UniversalCategoryCreate(
            name="Electronics",
            description="Electronic items"
        )
        parent = inventory_service.create_category(
            category_data=parent_data,
            user_id=str(test_user.id)
        )
        
        # Create child category
        child_data = UniversalCategoryCreate(
            name="Smartphones",
            description="Mobile phones",
            parent_id=parent.id
        )
        child = inventory_service.create_category(
            category_data=child_data,
            user_id=str(test_user.id)
        )
        
        assert child.parent_id == parent.id
        assert child.level == 1
        
        # Create grandchild category
        grandchild_data = UniversalCategoryCreate(
            name="Android Phones",
            description="Android smartphones",
            parent_id=child.id
        )
        grandchild = inventory_service.create_category(
            category_data=grandchild_data,
            user_id=str(test_user.id)
        )
        
        assert grandchild.parent_id == child.id
        assert grandchild.level == 2
    
    def test_category_hierarchy_move(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test moving categories in hierarchy"""
        # Create categories
        electronics = inventory_service.create_category(
            UniversalCategoryCreate(name="Electronics"),
            str(test_user.id)
        )
        
        appliances = inventory_service.create_category(
            UniversalCategoryCreate(name="Appliances"),
            str(test_user.id)
        )
        
        smartphones = inventory_service.create_category(
            UniversalCategoryCreate(name="Smartphones", parent_id=electronics.id),
            str(test_user.id)
        )
        
        # Move smartphones from Electronics to Appliances
        updated_category = inventory_service.update_category_hierarchy(
            category_id=str(smartphones.id),
            new_parent_id=str(appliances.id),
            user_id=str(test_user.id)
        )
        
        assert updated_category.parent_id == appliances.id
        assert updated_category.level == 1
    
    def test_prevent_circular_reference(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test prevention of circular references in hierarchy"""
        parent = inventory_service.create_category(
            UniversalCategoryCreate(name="Parent"),
            str(test_user.id)
        )
        
        child = inventory_service.create_category(
            UniversalCategoryCreate(name="Child", parent_id=parent.id),
            str(test_user.id)
        )
        
        # Try to make parent a child of child (should fail)
        with pytest.raises(ValueError, match="circular reference"):
            inventory_service.update_category_hierarchy(
                category_id=str(parent.id),
                new_parent_id=str(child.id),
                user_id=str(test_user.id)
            )
    
    def test_get_category_tree(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test getting category tree with statistics"""
        # Create category hierarchy
        electronics = inventory_service.create_category(
            UniversalCategoryCreate(name="Electronics"),
            str(test_user.id)
        )
        
        smartphones = inventory_service.create_category(
            UniversalCategoryCreate(name="Smartphones", parent_id=electronics.id),
            str(test_user.id)
        )
        
        laptops = inventory_service.create_category(
            UniversalCategoryCreate(name="Laptops", parent_id=electronics.id),
            str(test_user.id)
        )
        
        tree = inventory_service.get_category_tree(include_stats=True)
        
        assert len(tree) == 1  # One root category
        assert tree[0]['name'] == "Electronics"
        assert len(tree[0]['children']) == 2  # Two child categories
        assert 'count' in tree[0]  # Statistics included


class TestInventoryItemManagement:
    """Test inventory item management with universal features"""
    
    def test_create_inventory_item_with_sku_generation(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test creating inventory item with automatic SKU generation"""
        # Create category first
        category = inventory_service.create_category(
            UniversalCategoryCreate(name="Electronics"),
            str(test_user.id)
        )
        
        item_data = {
            "name": "iPhone 15",
            "category_id": str(category.id),
            "cost_price": 800.00,
            "sale_price": 1200.00,
            "stock_quantity": 10,
            "attributes": {
                "brand": "Apple",
                "model": "iPhone 15",
                "storage": "128GB"
            },
            "tags": ["smartphone", "apple", "premium"]
        }
        
        item = inventory_service.create_inventory_item(
            item_data=item_data,
            user_id=str(test_user.id)
        )
        
        assert item.name == "iPhone 15"
        assert item.sku is not None
        assert item.sku.startswith("ELE")  # Should use category prefix
        assert item.attributes["brand"] == "Apple"
        assert "smartphone" in item.tags
        assert item.stock_quantity == 10
    
    def test_create_inventory_item_with_custom_sku(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test creating inventory item with custom SKU"""
        item_data = {
            "name": "Custom Item",
            "sku": "CUSTOM001",
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 5
        }
        
        item = inventory_service.create_inventory_item(
            item_data=item_data,
            user_id=str(test_user.id)
        )
        
        assert item.sku == "CUSTOM001"
    
    def test_sku_uniqueness_validation(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test SKU uniqueness validation"""
        # Create first item
        item_data1 = {
            "name": "Item 1",
            "sku": "UNIQUE001",
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 5
        }
        
        inventory_service.create_inventory_item(
            item_data=item_data1,
            user_id=str(test_user.id)
        )
        
        # Try to create second item with same SKU
        item_data2 = {
            "name": "Item 2",
            "sku": "UNIQUE001",
            "cost_price": 200.00,
            "sale_price": 250.00,
            "stock_quantity": 3
        }
        
        with pytest.raises(ValueError, match="SKU.*already exists"):
            inventory_service.create_inventory_item(
                item_data=item_data2,
                user_id=str(test_user.id)
            )
    
    def test_barcode_uniqueness_validation(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test barcode uniqueness validation"""
        # Create first item
        item_data1 = {
            "name": "Item 1",
            "barcode": "1234567890123",
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 5
        }
        
        inventory_service.create_inventory_item(
            item_data=item_data1,
            user_id=str(test_user.id)
        )
        
        # Try to create second item with same barcode
        item_data2 = {
            "name": "Item 2",
            "barcode": "1234567890123",
            "cost_price": 200.00,
            "sale_price": 250.00,
            "stock_quantity": 3
        }
        
        with pytest.raises(ValueError, match="Barcode.*already exists"):
            inventory_service.create_inventory_item(
                item_data=item_data2,
                user_id=str(test_user.id)
            )
    
    def test_update_inventory_item_with_stock_tracking(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test updating inventory item with stock movement tracking"""
        # Create item
        item_data = {
            "name": "Test Item",
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 10
        }
        
        item = inventory_service.create_inventory_item(
            item_data=item_data,
            user_id=str(test_user.id)
        )
        
        # Update stock quantity
        update_data = {
            "stock_quantity": 15,
            "sale_price": 160.00
        }
        
        updated_item = inventory_service.update_inventory_item(
            item_id=str(item.id),
            update_data=update_data,
            user_id=str(test_user.id)
        )
        
        assert updated_item.stock_quantity == 15
        assert updated_item.sale_price == 160.00
        
        # Check that inventory movement was created
        movements, _ = inventory_service.get_inventory_movements(item_id=str(item.id))
        assert len(movements) == 2  # Initial stock + adjustment
        assert movements[0].movement_type == "adjustment"
        assert movements[0].quantity == 5  # Increase of 5


class TestAdvancedSearch:
    """Test advanced search and filtering capabilities"""
    
    def test_text_search(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test text search across multiple fields"""
        # Create test items
        items_data = [
            {
                "name": "iPhone 15 Pro",
                "description": "Latest Apple smartphone",
                "sku": "APPLE001",
                "cost_price": 900.00,
                "sale_price": 1300.00,
                "stock_quantity": 5
            },
            {
                "name": "Samsung Galaxy S24",
                "description": "Android flagship phone",
                "sku": "SAMSUNG001",
                "cost_price": 800.00,
                "sale_price": 1200.00,
                "stock_quantity": 8
            },
            {
                "name": "MacBook Pro",
                "description": "Apple laptop computer",
                "sku": "APPLE002",
                "cost_price": 1500.00,
                "sale_price": 2000.00,
                "stock_quantity": 3
            }
        ]
        
        for item_data in items_data:
            inventory_service.create_inventory_item(
                item_data=item_data,
                user_id=str(test_user.id)
            )
        
        # Search for "Apple" - should find iPhone and MacBook
        items, total = inventory_service.search_inventory_items(query="Apple")
        assert total == 2
        
        # Search for "phone" - should find iPhone and Samsung
        items, total = inventory_service.search_inventory_items(query="phone")
        assert total == 2
        
        # Search by SKU
        items, total = inventory_service.search_inventory_items(query="APPLE001")
        assert total == 1
        assert items[0].name == "iPhone 15 Pro"
    
    def test_attribute_filtering(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test filtering by custom attributes"""
        # Create category with attributes
        category = inventory_service.create_category(
            UniversalCategoryCreate(
                name="Smartphones",
                attribute_schema=[
                    AttributeDefinition(
                        name="brand",
                        label="Brand",
                        type=AttributeType.TEXT,
                        required=True
                    ),
                    AttributeDefinition(
                        name="storage",
                        label="Storage",
                        type=AttributeType.ENUM,
                        options=["64GB", "128GB", "256GB", "512GB"]
                    )
                ]
            ),
            str(test_user.id)
        )
        
        # Create items with different attributes
        items_data = [
            {
                "name": "iPhone 15",
                "category_id": str(category.id),
                "attributes": {"brand": "Apple", "storage": "128GB"},
                "cost_price": 800.00,
                "sale_price": 1200.00,
                "stock_quantity": 5
            },
            {
                "name": "iPhone 15 Pro",
                "category_id": str(category.id),
                "attributes": {"brand": "Apple", "storage": "256GB"},
                "cost_price": 900.00,
                "sale_price": 1300.00,
                "stock_quantity": 3
            },
            {
                "name": "Galaxy S24",
                "category_id": str(category.id),
                "attributes": {"brand": "Samsung", "storage": "128GB"},
                "cost_price": 700.00,
                "sale_price": 1100.00,
                "stock_quantity": 7
            }
        ]
        
        for item_data in items_data:
            inventory_service.create_inventory_item(
                item_data=item_data,
                user_id=str(test_user.id)
            )
        
        # Filter by brand
        items, total = inventory_service.search_inventory_items(
            attributes_filter={"brand": "Apple"}
        )
        assert total == 2
        
        # Filter by storage
        items, total = inventory_service.search_inventory_items(
            attributes_filter={"storage": "128GB"}
        )
        assert total == 2
        
        # Filter by multiple attributes
        items, total = inventory_service.search_inventory_items(
            attributes_filter={"brand": "Apple", "storage": "256GB"}
        )
        assert total == 1
        assert items[0].name == "iPhone 15 Pro"
    
    def test_tag_filtering(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test filtering by tags"""
        # Create items with different tags
        items_data = [
            {
                "name": "iPhone 15",
                "tags": ["smartphone", "apple", "premium"],
                "cost_price": 800.00,
                "sale_price": 1200.00,
                "stock_quantity": 5
            },
            {
                "name": "AirPods Pro",
                "tags": ["audio", "apple", "wireless"],
                "cost_price": 200.00,
                "sale_price": 300.00,
                "stock_quantity": 10
            },
            {
                "name": "Galaxy Buds",
                "tags": ["audio", "samsung", "wireless"],
                "cost_price": 150.00,
                "sale_price": 250.00,
                "stock_quantity": 8
            }
        ]
        
        for item_data in items_data:
            inventory_service.create_inventory_item(
                item_data=item_data,
                user_id=str(test_user.id)
            )
        
        # Filter by single tag
        items, total = inventory_service.search_inventory_items(tags_filter=["apple"])
        assert total == 2
        
        # Filter by multiple tags (AND condition)
        items, total = inventory_service.search_inventory_items(tags_filter=["audio", "wireless"])
        assert total == 2  # Both AirPods and Galaxy Buds have both tags
    
    def test_stock_level_filtering(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test filtering by stock levels"""
        # Create items with different stock levels
        items_data = [
            {
                "name": "High Stock Item",
                "stock_quantity": 100,
                "min_stock_level": 10,
                "cost_price": 50.00,
                "sale_price": 75.00
            },
            {
                "name": "Low Stock Item",
                "stock_quantity": 3,
                "min_stock_level": 5,
                "cost_price": 100.00,
                "sale_price": 150.00
            },
            {
                "name": "Out of Stock Item",
                "stock_quantity": 0,
                "min_stock_level": 1,
                "cost_price": 200.00,
                "sale_price": 300.00
            }
        ]
        
        for item_data in items_data:
            inventory_service.create_inventory_item(
                item_data=item_data,
                user_id=str(test_user.id)
            )
        
        # Filter by stock range
        items, total = inventory_service.search_inventory_items(
            stock_level_filter={"min_stock": 1, "max_stock": 50}
        )
        assert total == 1  # Only "Low Stock Item"
        
        # Filter for low stock items
        items, total = inventory_service.search_inventory_items(
            stock_level_filter={"low_stock_only": True}
        )
        assert total == 2  # Low stock and out of stock items
    
    def test_price_range_filtering(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test filtering by price ranges"""
        # Create items with different prices
        items_data = [
            {
                "name": "Budget Item",
                "cost_price": 10.00,
                "sale_price": 20.00,
                "stock_quantity": 50
            },
            {
                "name": "Mid-range Item",
                "cost_price": 100.00,
                "sale_price": 150.00,
                "stock_quantity": 20
            },
            {
                "name": "Premium Item",
                "cost_price": 500.00,
                "sale_price": 800.00,
                "stock_quantity": 5
            }
        ]
        
        for item_data in items_data:
            inventory_service.create_inventory_item(
                item_data=item_data,
                user_id=str(test_user.id)
            )
        
        # Filter by price range
        items, total = inventory_service.search_inventory_items(
            price_range={"min_price": 50.00, "max_price": 200.00}
        )
        assert total == 1  # Only "Mid-range Item"
    
    def test_sorting_and_pagination(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test sorting and pagination"""
        # Create multiple items
        for i in range(15):
            item_data = {
                "name": f"Item {i:02d}",
                "cost_price": float(i * 10),
                "sale_price": float(i * 15),
                "stock_quantity": i + 1
            }
            inventory_service.create_inventory_item(
                item_data=item_data,
                user_id=str(test_user.id)
            )
        
        # Test sorting by name (ascending)
        items, total = inventory_service.search_inventory_items(
            sort_by="name",
            sort_order="asc",
            limit=5
        )
        assert total == 15
        assert len(items) == 5
        assert items[0].name == "Item 00"
        
        # Test sorting by cost_price (descending)
        items, total = inventory_service.search_inventory_items(
            sort_by="cost_price",
            sort_order="desc",
            limit=3
        )
        assert len(items) == 3
        assert items[0].cost_price >= items[1].cost_price >= items[2].cost_price
        
        # Test pagination
        items_page1, _ = inventory_service.search_inventory_items(
            limit=5,
            offset=0
        )
        items_page2, _ = inventory_service.search_inventory_items(
            limit=5,
            offset=5
        )
        
        assert len(items_page1) == 5
        assert len(items_page2) == 5
        # Ensure no overlap
        page1_ids = {str(item.id) for item in items_page1}
        page2_ids = {str(item.id) for item in items_page2}
        assert page1_ids.isdisjoint(page2_ids)


class TestStockAlerts:
    """Test stock alert and monitoring functionality"""
    
    def test_low_stock_alerts(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test low stock alert generation"""
        # Create items with different stock levels
        items_data = [
            {
                "name": "Critical Stock Item",
                "stock_quantity": 1,
                "min_stock_level": 10,
                "cost_price": 100.00,
                "sale_price": 150.00
            },
            {
                "name": "Low Stock Item",
                "stock_quantity": 3,
                "min_stock_level": 5,
                "cost_price": 50.00,
                "sale_price": 75.00
            },
            {
                "name": "Good Stock Item",
                "stock_quantity": 50,
                "min_stock_level": 10,
                "cost_price": 25.00,
                "sale_price": 40.00
            }
        ]
        
        for item_data in items_data:
            inventory_service.create_inventory_item(
                item_data=item_data,
                user_id=str(test_user.id)
            )
        
        # Get low stock alerts
        alerts = inventory_service.get_low_stock_alerts()
        
        assert len(alerts) == 2  # Two items below minimum stock
        
        # Check urgency scores
        critical_alert = next(a for a in alerts if a['item_name'] == "Critical Stock Item")
        low_alert = next(a for a in alerts if a['item_name'] == "Low Stock Item")
        
        assert critical_alert['urgency_score'] > low_alert['urgency_score']
        assert critical_alert['shortage'] == 9  # 10 - 1
        assert low_alert['shortage'] == 2  # 5 - 3
    
    def test_stock_alerts_with_threshold_multiplier(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test stock alerts with different threshold multipliers"""
        item_data = {
            "name": "Test Item",
            "stock_quantity": 8,
            "min_stock_level": 10,
            "cost_price": 100.00,
            "sale_price": 150.00
        }
        
        inventory_service.create_inventory_item(
            item_data=item_data,
            user_id=str(test_user.id)
        )
        
        # With default threshold (1.0), item should be in alerts
        alerts = inventory_service.get_low_stock_alerts(threshold_multiplier=1.0)
        assert len(alerts) == 1
        
        # With lower threshold (0.5), item should not be in alerts
        alerts = inventory_service.get_low_stock_alerts(threshold_multiplier=0.5)
        assert len(alerts) == 0
        
        # With higher threshold (1.5), item should still be in alerts
        alerts = inventory_service.get_low_stock_alerts(threshold_multiplier=1.5)
        assert len(alerts) == 1


class TestInventoryMovements:
    """Test inventory movement tracking and audit trails"""
    
    def test_inventory_movement_creation(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test creating inventory movements"""
        # Create item
        item_data = {
            "name": "Test Item",
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 10
        }
        
        item = inventory_service.create_inventory_item(
            item_data=item_data,
            user_id=str(test_user.id)
        )
        
        # Create manual movement
        movement = inventory_service._create_inventory_movement(
            inventory_item_id=str(item.id),
            movement_type="purchase",
            quantity=5,
            unit_cost=95.00,
            notes="Restocking purchase",
            user_id=str(test_user.id)
        )
        
        assert movement.movement_type == "purchase"
        assert movement.quantity == 5
        assert movement.unit_cost == 95.00
        assert movement.total_cost == 475.00  # 5 * 95
        assert movement.notes == "Restocking purchase"
    
    def test_get_inventory_movements_with_filtering(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test retrieving inventory movements with filtering"""
        # Create item
        item_data = {
            "name": "Test Item",
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 10
        }
        
        item = inventory_service.create_inventory_item(
            item_data=item_data,
            user_id=str(test_user.id)
        )
        
        # Create multiple movements
        movements_data = [
            {"movement_type": "purchase", "quantity": 5, "unit_cost": 95.00},
            {"movement_type": "sale", "quantity": -2, "unit_cost": 150.00},
            {"movement_type": "adjustment", "quantity": 1, "notes": "Inventory correction"}
        ]
        
        for movement_data in movements_data:
            inventory_service._create_inventory_movement(
                inventory_item_id=str(item.id),
                user_id=str(test_user.id),
                **movement_data
            )
        
        # Get all movements for item
        movements, total = inventory_service.get_inventory_movements(item_id=str(item.id))
        assert total == 4  # 3 manual + 1 initial stock
        
        # Filter by movement type
        movements, total = inventory_service.get_inventory_movements(
            item_id=str(item.id),
            movement_types=["purchase", "sale"]
        )
        assert total == 2
    
    def test_audit_trail_logging(self, inventory_service: UniversalInventoryService, test_user: User, db_session: Session):
        """Test audit trail logging for inventory operations"""
        # Create item (should create audit log)
        item_data = {
            "name": "Test Item",
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 10
        }
        
        item = inventory_service.create_inventory_item(
            item_data=item_data,
            user_id=str(test_user.id)
        )
        
        # Update item (should create another audit log)
        update_data = {"sale_price": 160.00}
        inventory_service.update_inventory_item(
            item_id=str(item.id),
            update_data=update_data,
            user_id=str(test_user.id)
        )
        
        # Check audit logs
        audit_logs = db_session.query(AuditLog).filter(
            AuditLog.resource_id == item.id
        ).all()
        
        assert len(audit_logs) == 2
        
        create_log = next(log for log in audit_logs if log.action == "CREATE_INVENTORY_ITEM")
        update_log = next(log for log in audit_logs if log.action == "UPDATE_INVENTORY_ITEM")
        
        assert create_log.new_values["name"] == "Test Item"
        assert update_log.old_values["sale_price"] == 150.00
        assert update_log.new_values["sale_price"] == 160.00


class TestMultiUnitSupport:
    """Test multi-unit inventory tracking and conversion"""
    
    def test_unit_conversion(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test unit conversion functionality"""
        # Create item with conversion factors
        item_data = {
            "name": "Fabric Roll",
            "unit_of_measure": "meter",
            "conversion_factors": {
                "meter_to_yard": 1.094,
                "meter_to_foot": 3.281
            },
            "cost_price": 10.00,
            "sale_price": 15.00,
            "stock_quantity": 100
        }
        
        item = inventory_service.create_inventory_item(
            item_data=item_data,
            user_id=str(test_user.id)
        )
        
        # Test conversion from meters to yards
        converted_quantity = inventory_service.convert_units(
            item_id=str(item.id),
            from_unit="meter",
            to_unit="yard",
            quantity=10
        )
        
        assert abs(converted_quantity - 10.94) < 0.01
        
        # Test reverse conversion (yards to meters)
        converted_quantity = inventory_service.convert_units(
            item_id=str(item.id),
            from_unit="yard",
            to_unit="meter",
            quantity=10.94
        )
        
        assert abs(converted_quantity - 10) < 0.01


class TestBusinessTypeSupport:
    """Test business type specific functionality"""
    
    def test_business_type_filtering(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test filtering by business type"""
        # Create categories for different business types
        retail_category = inventory_service.create_category(
            UniversalCategoryCreate(name="Retail Products", business_type="retail"),
            str(test_user.id),
            business_type="retail"
        )
        
        restaurant_category = inventory_service.create_category(
            UniversalCategoryCreate(name="Food Items", business_type="restaurant"),
            str(test_user.id),
            business_type="restaurant"
        )
        
        # Create items in different categories
        retail_item_data = {
            "name": "Retail Item",
            "category_id": str(retail_category.id),
            "cost_price": 50.00,
            "sale_price": 75.00,
            "stock_quantity": 20
        }
        
        restaurant_item_data = {
            "name": "Food Item",
            "category_id": str(restaurant_category.id),
            "cost_price": 5.00,
            "sale_price": 12.00,
            "stock_quantity": 100
        }
        
        inventory_service.create_inventory_item(retail_item_data, str(test_user.id))
        inventory_service.create_inventory_item(restaurant_item_data, str(test_user.id))
        
        # Search by business type
        items, total = inventory_service.search_inventory_items(business_type="retail")
        assert total == 1
        assert items[0].name == "Retail Item"
        
        items, total = inventory_service.search_inventory_items(business_type="restaurant")
        assert total == 1
        assert items[0].name == "Food Item"


class TestGoldShopCompatibility:
    """Test backward compatibility with gold shop features"""
    
    def test_gold_shop_item_creation(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test creating gold shop items with legacy fields"""
        item_data = {
            "name": "Gold Ring",
            "weight_grams": 5.5,
            "purchase_price": 300.00,
            "sell_price": 450.00,
            "stock_quantity": 1,
            "gold_specific": {
                "purity": "18K",
                "sood": 50.00,
                "ojrat": 100.00
            }
        }
        
        item = inventory_service.create_inventory_item(
            item_data=item_data,
            user_id=str(test_user.id)
        )
        
        assert item.name == "Gold Ring"
        assert item.weight_grams == 5.5
        assert item.purchase_price == 300.00
        assert item.sell_price == 450.00
        assert item.gold_specific["purity"] == "18K"
        assert item.gold_specific["sood"] == 50.00
        assert item.gold_specific["ojrat"] == 100.00


class TestPerformanceAndScalability:
    """Test performance with large datasets"""
    
def test_large_dataset_search_performance(self, inventory_service: UniversalInventoryService, test_user: User):
        """Test search performance with large number of items"""
        import time
        
        # Create a large number of items
        start_time = time.time()
        
        for i in range(1000):
            item_data = {
                "name": f"Item {i:04d}",
                "sku": f"PERF{i:06d}",
                "cost_price": float(i % 100 + 1),
                "sale_price": float((i % 100 + 1) * 1.5),
                "stock_quantity": i % 50 + 1,
                "attributes": {
                    "category": f"Category {i % 10}",
                    "brand": f"Brand {i % 5}"
                },
                "tags": [f"tag{i % 3}", f"type{i % 7}"]
            }
            
            if i % 100 == 0:  # Progress indicator
                print(f"Created {i} items...")
            
            inventory_service.create_inventory_item(
                item_data=item_data,
                user_id=str(test_user.id)
            )
        
        creation_time = time.time() - start_time
        print(f"Created 1000 items in {creation_time:.2f} seconds")
        
        # Test search performance
        start_time = time.time()
        
        items, total = inventory_service.search_inventory_items(
            query="Item",
            limit=50
        )
        
        search_time = time.time() - start_time
        print(f"Search completed in {search_time:.2f} seconds")
        
        assert total == 1000
        assert len(items) == 50
        assert search_time < 1.0  # Should complete within 1 second


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])