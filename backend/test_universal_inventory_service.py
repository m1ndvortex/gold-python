"""
Comprehensive Unit Tests for Universal Inventory Management Service
Tests all functionality using real PostgreSQL database in Docker environment
"""

import pytest
import uuid
from decimal import Decimal
from datetime import datetime, date
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
import os

# Import models and services
from models_universal import (
    Base, UniversalCategory, UniversalInventoryItem, InventoryMovement,
    BusinessConfiguration, Image, ImageVariant
)
from schemas_universal import (
    UniversalCategoryCreate, UniversalCategoryUpdate,
    UniversalInventoryItemCreate, UniversalInventoryItemUpdate,
    InventorySearchFilters, CategorySearchFilters,
    StockUpdateRequest, StockAdjustmentRequest,
    BulkUpdateRequest, BulkTagRequest, AttributeDefinition
)
from services.universal_inventory_service import UniversalInventoryService

# Test database configuration
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop_test")

@pytest.fixture(scope="session")
def engine():
    """Create test database engine"""
    engine = create_engine(TEST_DATABASE_URL, echo=False)
    
    # Create test database schema
    with engine.connect() as conn:
        # Enable extensions
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS ltree;"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
        conn.commit()
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Cleanup
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(engine):
    """Create database session for each test"""
    Session = sessionmaker(bind=engine)
    session = Session()
    
    yield session
    
    # Cleanup after each test
    session.rollback()
    session.close()

@pytest.fixture
def service(db_session):
    """Create service instance"""
    return UniversalInventoryService(db_session)

@pytest.fixture
def sample_user_id():
    """Sample user ID for testing"""
    return uuid.uuid4()

# Category Management Tests

class TestCategoryManagement:
    """Test category management functionality"""
    
    def test_create_root_category(self, service, sample_user_id):
        """Test creating a root category"""
        category_data = UniversalCategoryCreate(
            name="Electronics",
            description="Electronic items",
            color="#FF5733",
            business_type="retail"
        )
        
        category = service.create_category(category_data, sample_user_id)
        
        assert category.name == "Electronics"
        assert category.description == "Electronic items"
        assert category.color == "#FF5733"
        assert category.business_type == "retail"
        assert category.level == 0
        assert category.parent_id is None
        assert category.path == str(category.id)
        assert category.is_active is True
        assert category.created_by == sample_user_id
    
    def test_create_subcategory(self, service, sample_user_id):
        """Test creating a subcategory"""
        # Create parent category
        parent_data = UniversalCategoryCreate(name="Electronics")
        parent = service.create_category(parent_data, sample_user_id)
        
        # Create subcategory
        child_data = UniversalCategoryCreate(
            name="Smartphones",
            parent_id=parent.id,
            description="Mobile phones"
        )
        
        child = service.create_category(child_data, sample_user_id)
        
        assert child.name == "Smartphones"
        assert child.parent_id == parent.id
        assert child.level == 1
        assert child.path == f"{parent.id}.{child.id}"
        assert child.is_active is True
    
    def test_create_deep_nested_category(self, service, sample_user_id):
        """Test creating deeply nested categories"""
        # Create hierarchy: Electronics > Smartphones > Android > Samsung
        electronics = service.create_category(
            UniversalCategoryCreate(name="Electronics"), sample_user_id
        )
        
        smartphones = service.create_category(
            UniversalCategoryCreate(name="Smartphones", parent_id=electronics.id), sample_user_id
        )
        
        android = service.create_category(
            UniversalCategoryCreate(name="Android", parent_id=smartphones.id), sample_user_id
        )
        
        samsung = service.create_category(
            UniversalCategoryCreate(name="Samsung", parent_id=android.id), sample_user_id
        )
        
        assert samsung.level == 3
        assert samsung.path == f"{electronics.id}.{smartphones.id}.{android.id}.{samsung.id}"
    
    def test_create_category_with_attributes(self, service, sample_user_id):
        """Test creating category with custom attributes"""
        attributes = [
            AttributeDefinition(
                id="brand",
                name="Brand",
                type="text",
                required=True,
                searchable=True
            ),
            AttributeDefinition(
                id="warranty",
                name="Warranty Period",
                type="enum",
                options=["1 year", "2 years", "3 years"],
                required=False
            )
        ]
        
        category_data = UniversalCategoryCreate(
            name="Electronics",
            attribute_schema=attributes
        )
        
        category = service.create_category(category_data, sample_user_id)
        
        assert len(category.attribute_schema) == 2
        assert category.attribute_schema[0]['name'] == "Brand"
        assert category.attribute_schema[1]['type'] == "enum"
    
    def test_duplicate_category_name_same_level(self, service, sample_user_id):
        """Test that duplicate category names at same level are rejected"""
        category_data = UniversalCategoryCreate(name="Electronics")
        
        # Create first category
        service.create_category(category_data, sample_user_id)
        
        # Try to create duplicate
        with pytest.raises(HTTPException) as exc_info:
            service.create_category(category_data, sample_user_id)
        
        assert exc_info.value.status_code == 400
        assert "already exists" in str(exc_info.value.detail)
    
    def test_update_category(self, service, sample_user_id):
        """Test updating category"""
        # Create category
        category_data = UniversalCategoryCreate(name="Electronics")
        category = service.create_category(category_data, sample_user_id)
        
        # Update category
        update_data = UniversalCategoryUpdate(
            name="Consumer Electronics",
            description="Updated description",
            color="#00FF00"
        )
        
        updated_category = service.update_category(category.id, update_data, sample_user_id)
        
        assert updated_category.name == "Consumer Electronics"
        assert updated_category.description == "Updated description"
        assert updated_category.color == "#00FF00"
        assert updated_category.updated_by == sample_user_id
    
    def test_move_category_to_different_parent(self, service, sample_user_id):
        """Test moving category to different parent"""
        # Create categories
        parent1 = service.create_category(UniversalCategoryCreate(name="Parent1"), sample_user_id)
        parent2 = service.create_category(UniversalCategoryCreate(name="Parent2"), sample_user_id)
        child = service.create_category(
            UniversalCategoryCreate(name="Child", parent_id=parent1.id), sample_user_id
        )
        
        # Move child to parent2
        update_data = UniversalCategoryUpdate(parent_id=parent2.id)
        updated_child = service.update_category(child.id, update_data, sample_user_id)
        
        assert updated_child.parent_id == parent2.id
        assert updated_child.level == 1
        assert updated_child.path == f"{parent2.id}.{child.id}"
    
    def test_get_categories_tree(self, service, sample_user_id):
        """Test getting categories in tree structure"""
        # Create hierarchy
        electronics = service.create_category(UniversalCategoryCreate(name="Electronics"), sample_user_id)
        smartphones = service.create_category(
            UniversalCategoryCreate(name="Smartphones", parent_id=electronics.id), sample_user_id
        )
        laptops = service.create_category(
            UniversalCategoryCreate(name="Laptops", parent_id=electronics.id), sample_user_id
        )
        
        # Get tree
        tree = service.get_categories_tree()
        
        assert len(tree) == 1  # One root category
        assert tree[0].name == "Electronics"
        assert len(tree[0].children) == 2  # Two subcategories
        
        child_names = [child.name for child in tree[0].children]
        assert "Smartphones" in child_names
        assert "Laptops" in child_names
    
    def test_delete_empty_category(self, service, sample_user_id):
        """Test deleting empty category"""
        category = service.create_category(UniversalCategoryCreate(name="Empty"), sample_user_id)
        
        result = service.delete_category(category.id)
        assert result is True
        
        # Verify category is deleted
        deleted_category = service.db.query(UniversalCategory).filter(
            UniversalCategory.id == category.id
        ).first()
        assert deleted_category is None

# Inventory Item Management Tests

class TestInventoryItemManagement:
    """Test inventory item management functionality"""
    
    def test_create_inventory_item(self, service, sample_user_id):
        """Test creating inventory item"""
        # Create category first
        category = service.create_category(UniversalCategoryCreate(name="Electronics"), sample_user_id)
        
        item_data = UniversalInventoryItemCreate(
            sku="ELEC-000001",
            name="iPhone 15",
            description="Latest iPhone model",
            category_id=category.id,
            cost_price=Decimal("800.00"),
            sale_price=Decimal("1000.00"),
            stock_quantity=Decimal("10"),
            unit_of_measure="piece",
            low_stock_threshold=Decimal("5"),
            tags=["smartphone", "apple", "premium"],
            custom_attributes={
                "brand": "Apple",
                "color": "Black",
                "storage": "128GB"
            }
        )
        
        item = service.create_inventory_item(item_data, sample_user_id)
        
        assert item.sku == "ELEC-000001"
        assert item.name == "iPhone 15"
        assert item.category_id == category.id
        assert item.cost_price == Decimal("800.00")
        assert item.sale_price == Decimal("1000.00")
        assert item.stock_quantity == Decimal("10")
        assert item.tags == ["smartphone", "apple", "premium"]
        assert item.custom_attributes["brand"] == "Apple"
        assert item.is_active is True
        assert item.created_by == sample_user_id
    
    def test_create_item_with_auto_generated_sku(self, service, sample_user_id):
        """Test creating item with auto-generated SKU"""
        category = service.create_category(UniversalCategoryCreate(name="Electronics"), sample_user_id)
        
        item_data = UniversalInventoryItemCreate(
            name="Test Item",
            category_id=category.id,
            cost_price=Decimal("10.00"),
            sale_price=Decimal("15.00")
        )
        # Don't provide SKU - should be auto-generated
        
        item = service.create_inventory_item(item_data, sample_user_id)
        
        assert item.sku is not None
        assert item.sku.startswith("ELEC-")  # Based on category name
        assert item.qr_code is not None
        assert item.qr_code.startswith("ITEM:")
    
    def test_create_item_with_duplicate_sku(self, service, sample_user_id):
        """Test that duplicate SKUs are rejected"""
        item_data = UniversalInventoryItemCreate(
            sku="DUPLICATE-001",
            name="Item 1",
            cost_price=Decimal("10.00"),
            sale_price=Decimal("15.00")
        )
        
        # Create first item
        service.create_inventory_item(item_data, sample_user_id)
        
        # Try to create duplicate
        item_data.name = "Item 2"
        with pytest.raises(HTTPException) as exc_info:
            service.create_inventory_item(item_data, sample_user_id)
        
        assert exc_info.value.status_code == 400
        assert "SKU already exists" in str(exc_info.value.detail)
    
    def test_search_inventory_items_by_name(self, service, sample_user_id):
        """Test searching items by name"""
        # Create test items
        items_data = [
            UniversalInventoryItemCreate(sku="ITEM-001", name="iPhone 15", cost_price=Decimal("800"), sale_price=Decimal("1000")),
            UniversalInventoryItemCreate(sku="ITEM-002", name="Samsung Galaxy", cost_price=Decimal("700"), sale_price=Decimal("900")),
            UniversalInventoryItemCreate(sku="ITEM-003", name="iPad Pro", cost_price=Decimal("600"), sale_price=Decimal("800"))
        ]
        
        for item_data in items_data:
            service.create_inventory_item(item_data, sample_user_id)
        
        # Search for "iPhone"
        filters = InventorySearchFilters(search="iPhone")
        items, total = service.search_inventory_items(filters)
        
        assert total == 1
        assert items[0].name == "iPhone 15"
    
    def test_search_inventory_items_by_tags(self, service, sample_user_id):
        """Test searching items by tags"""
        # Create items with tags
        item1_data = UniversalInventoryItemCreate(
            sku="ITEM-001", name="iPhone", tags=["smartphone", "apple"],
            cost_price=Decimal("800"), sale_price=Decimal("1000")
        )
        item2_data = UniversalInventoryItemCreate(
            sku="ITEM-002", name="Galaxy", tags=["smartphone", "samsung"],
            cost_price=Decimal("700"), sale_price=Decimal("900")
        )
        item3_data = UniversalInventoryItemCreate(
            sku="ITEM-003", name="iPad", tags=["tablet", "apple"],
            cost_price=Decimal("600"), sale_price=Decimal("800")
        )
        
        service.create_inventory_item(item1_data, sample_user_id)
        service.create_inventory_item(item2_data, sample_user_id)
        service.create_inventory_item(item3_data, sample_user_id)
        
        # Search for items with "apple" tag
        filters = InventorySearchFilters(tags=["apple"])
        items, total = service.search_inventory_items(filters)
        
        assert total == 2
        item_names = [item.name for item in items]
        assert "iPhone" in item_names
        assert "iPad" in item_names
    
    def test_search_inventory_items_by_custom_attributes(self, service, sample_user_id):
        """Test searching items by custom attributes"""
        # Create items with custom attributes
        item1_data = UniversalInventoryItemCreate(
            sku="ITEM-001", name="iPhone", custom_attributes={"brand": "Apple", "color": "Black"},
            cost_price=Decimal("800"), sale_price=Decimal("1000")
        )
        item2_data = UniversalInventoryItemCreate(
            sku="ITEM-002", name="Galaxy", custom_attributes={"brand": "Samsung", "color": "White"},
            cost_price=Decimal("700"), sale_price=Decimal("900")
        )
        
        service.create_inventory_item(item1_data, sample_user_id)
        service.create_inventory_item(item2_data, sample_user_id)
        
        # Search for Apple brand
        filters = InventorySearchFilters(custom_attributes={"brand": "Apple"})
        items, total = service.search_inventory_items(filters)
        
        assert total == 1
        assert items[0].name == "iPhone"
    
    def test_search_low_stock_items(self, service, sample_user_id):
        """Test searching for low stock items"""
        # Create items with different stock levels
        item1_data = UniversalInventoryItemCreate(
            sku="ITEM-001", name="High Stock", stock_quantity=Decimal("100"),
            low_stock_threshold=Decimal("10"), cost_price=Decimal("10"), sale_price=Decimal("15")
        )
        item2_data = UniversalInventoryItemCreate(
            sku="ITEM-002", name="Low Stock", stock_quantity=Decimal("5"),
            low_stock_threshold=Decimal("10"), cost_price=Decimal("10"), sale_price=Decimal("15")
        )
        
        service.create_inventory_item(item1_data, sample_user_id)
        service.create_inventory_item(item2_data, sample_user_id)
        
        # Search for low stock items
        filters = InventorySearchFilters(low_stock_only=True)
        items, total = service.search_inventory_items(filters)
        
        assert total == 1
        assert items[0].name == "Low Stock"
    
    def test_update_inventory_item(self, service, sample_user_id):
        """Test updating inventory item"""
        # Create item
        item_data = UniversalInventoryItemCreate(
            sku="ITEM-001", name="Original Name",
            cost_price=Decimal("10"), sale_price=Decimal("15")
        )
        item = service.create_inventory_item(item_data, sample_user_id)
        
        # Update item
        update_data = UniversalInventoryItemUpdate(
            name="Updated Name",
            description="Updated description",
            sale_price=Decimal("20"),
            tags=["updated", "test"]
        )
        
        updated_item = service.update_inventory_item(item.id, update_data, sample_user_id)
        
        assert updated_item.name == "Updated Name"
        assert updated_item.description == "Updated description"
        assert updated_item.sale_price == Decimal("20")
        assert updated_item.tags == ["updated", "test"]
        assert updated_item.updated_by == sample_user_id
    
    def test_update_stock_with_movement_tracking(self, service, sample_user_id):
        """Test updating stock with movement tracking"""
        # Create item
        item_data = UniversalInventoryItemCreate(
            sku="ITEM-001", name="Test Item", stock_quantity=Decimal("10"),
            cost_price=Decimal("10"), sale_price=Decimal("15")
        )
        item = service.create_inventory_item(item_data, sample_user_id)
        
        # Update stock
        stock_update = StockUpdateRequest(
            quantity_change=Decimal("5"),
            reason="Stock replenishment",
            notes="Added new inventory"
        )
        
        updated_item = service.update_stock(item.id, stock_update, sample_user_id)
        
        assert updated_item.stock_quantity == Decimal("15")
        
        # Check movement was created
        movements = service.db.query(InventoryMovement).filter(
            InventoryMovement.inventory_item_id == item.id
        ).all()
        
        # Should have 2 movements: initial stock + update
        assert len(movements) == 2
        
        # Check the update movement
        update_movement = next(m for m in movements if m.reason == "Stock replenishment")
        assert update_movement.movement_type == "in"
        assert update_movement.quantity_change == Decimal("5")
        assert update_movement.quantity_before == Decimal("10")
        assert update_movement.quantity_after == Decimal("15")
    
    def test_insufficient_stock_update(self, service, sample_user_id):
        """Test that insufficient stock updates are rejected"""
        # Create item with 10 units
        item_data = UniversalInventoryItemCreate(
            sku="ITEM-001", name="Test Item", stock_quantity=Decimal("10"),
            cost_price=Decimal("10"), sale_price=Decimal("15")
        )
        item = service.create_inventory_item(item_data, sample_user_id)
        
        # Try to remove 15 units (more than available)
        stock_update = StockUpdateRequest(
            quantity_change=Decimal("-15"),
            reason="Sale"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            service.update_stock(item.id, stock_update, sample_user_id)
        
        assert exc_info.value.status_code == 400
        assert "Insufficient stock" in str(exc_info.value.detail)

# Stock Movement Tests

class TestStockMovements:
    """Test stock movement functionality"""
    
    def test_create_stock_movement(self, service, sample_user_id):
        """Test creating stock movement"""
        # Create item
        item_data = UniversalInventoryItemCreate(
            sku="ITEM-001", name="Test Item", stock_quantity=Decimal("0"),
            cost_price=Decimal("10"), sale_price=Decimal("15")
        )
        item = service.create_inventory_item(item_data, sample_user_id)
        
        # Add stock
        stock_update = StockUpdateRequest(
            quantity_change=Decimal("20"),
            reason="Initial stock",
            notes="First delivery",
            reference_type="purchase_order",
            reference_id=uuid.uuid4()
        )
        
        service.update_stock(item.id, stock_update, sample_user_id)
        
        # Check movement was created
        movement = service.db.query(InventoryMovement).filter(
            InventoryMovement.inventory_item_id == item.id,
            InventoryMovement.reason == "Initial stock"
        ).first()
        
        assert movement is not None
        assert movement.movement_type == "in"
        assert movement.quantity_change == Decimal("20")
        assert movement.quantity_before == Decimal("0")
        assert movement.quantity_after == Decimal("20")
        assert movement.notes == "First delivery"
        assert movement.reference_type == "purchase_order"
        assert movement.status == "completed"
        assert movement.created_by == sample_user_id

# Low Stock Alerts Tests

class TestLowStockAlerts:
    """Test low stock alert functionality"""
    
    def test_get_low_stock_alerts(self, service, sample_user_id):
        """Test getting low stock alerts"""
        # Create category
        category = service.create_category(UniversalCategoryCreate(name="Electronics"), sample_user_id)
        
        # Create items with different stock levels
        items_data = [
            UniversalInventoryItemCreate(
                sku="ITEM-001", name="Critical Stock", category_id=category.id,
                stock_quantity=Decimal("0"), low_stock_threshold=Decimal("5"),
                cost_price=Decimal("10"), sale_price=Decimal("15")
            ),
            UniversalInventoryItemCreate(
                sku="ITEM-002", name="High Alert", category_id=category.id,
                stock_quantity=Decimal("2"), low_stock_threshold=Decimal("10"),
                cost_price=Decimal("10"), sale_price=Decimal("15")
            ),
            UniversalInventoryItemCreate(
                sku="ITEM-003", name="Medium Alert", category_id=category.id,
                stock_quantity=Decimal("8"), low_stock_threshold=Decimal("10"),
                cost_price=Decimal("10"), sale_price=Decimal("15")
            ),
            UniversalInventoryItemCreate(
                sku="ITEM-004", name="Good Stock", category_id=category.id,
                stock_quantity=Decimal("50"), low_stock_threshold=Decimal("10"),
                cost_price=Decimal("10"), sale_price=Decimal("15")
            )
        ]
        
        for item_data in items_data:
            service.create_inventory_item(item_data, sample_user_id)
        
        # Get low stock alerts
        alerts = service.get_low_stock_alerts()
        
        assert len(alerts) == 3  # Three items below threshold
        
        # Check urgency levels
        alert_by_name = {alert.item_name: alert for alert in alerts}
        
        assert alert_by_name["Critical Stock"].urgency_level == "critical"
        assert alert_by_name["High Alert"].urgency_level == "high"
        assert alert_by_name["Medium Alert"].urgency_level == "medium"
        
        # Check shortage calculations
        assert alert_by_name["Critical Stock"].shortage == Decimal("5")
        assert alert_by_name["High Alert"].shortage == Decimal("8")
        assert alert_by_name["Medium Alert"].shortage == Decimal("2")

# Bulk Operations Tests

class TestBulkOperations:
    """Test bulk operations functionality"""
    
    def test_bulk_update_items(self, service, sample_user_id):
        """Test bulk updating items"""
        # Create test items
        items = []
        for i in range(3):
            item_data = UniversalInventoryItemCreate(
                sku=f"ITEM-{i:03d}", name=f"Item {i}",
                cost_price=Decimal("10"), sale_price=Decimal("15")
            )
            item = service.create_inventory_item(item_data, sample_user_id)
            items.append(item)
        
        # Bulk update
        request = BulkUpdateRequest(
            item_ids=[item.id for item in items],
            updates={
                "sale_price": Decimal("20"),
                "tags": ["bulk_updated"]
            }
        )
        
        updated_count = service.bulk_update_items(request, sample_user_id)
        
        assert updated_count == 6  # 3 items × 2 fields
        
        # Verify updates
        for item in items:
            service.db.refresh(item)
            assert item.sale_price == Decimal("20")
            assert item.tags == ["bulk_updated"]
            assert item.updated_by == sample_user_id
    
    def test_bulk_tag_items_add(self, service, sample_user_id):
        """Test bulk adding tags to items"""
        # Create items with existing tags
        items = []
        for i in range(2):
            item_data = UniversalInventoryItemCreate(
                sku=f"ITEM-{i:03d}", name=f"Item {i}",
                tags=["existing"], cost_price=Decimal("10"), sale_price=Decimal("15")
            )
            item = service.create_inventory_item(item_data, sample_user_id)
            items.append(item)
        
        # Bulk add tags
        request = BulkTagRequest(
            item_ids=[item.id for item in items],
            tags=["new_tag", "another_tag"],
            operation="add"
        )
        
        updated_count = service.bulk_tag_items(request, sample_user_id)
        
        assert updated_count == 2
        
        # Verify tags were added
        for item in items:
            service.db.refresh(item)
            assert "existing" in item.tags
            assert "new_tag" in item.tags
            assert "another_tag" in item.tags
    
    def test_bulk_tag_items_remove(self, service, sample_user_id):
        """Test bulk removing tags from items"""
        # Create items with tags
        items = []
        for i in range(2):
            item_data = UniversalInventoryItemCreate(
                sku=f"ITEM-{i:03d}", name=f"Item {i}",
                tags=["keep", "remove", "also_remove"],
                cost_price=Decimal("10"), sale_price=Decimal("15")
            )
            item = service.create_inventory_item(item_data, sample_user_id)
            items.append(item)
        
        # Bulk remove tags
        request = BulkTagRequest(
            item_ids=[item.id for item in items],
            tags=["remove", "also_remove"],
            operation="remove"
        )
        
        updated_count = service.bulk_tag_items(request, sample_user_id)
        
        assert updated_count == 2
        
        # Verify tags were removed
        for item in items:
            service.db.refresh(item)
            assert item.tags == ["keep"]

# Barcode and QR Code Tests

class TestBarcodeQRCode:
    """Test barcode and QR code functionality"""
    
    def test_generate_barcode_image(self, service, sample_user_id):
        """Test generating barcode image"""
        # Create item with barcode
        item_data = UniversalInventoryItemCreate(
            sku="ITEM-001", name="Test Item", barcode="1234567890123",
            cost_price=Decimal("10"), sale_price=Decimal("15")
        )
        item = service.create_inventory_item(item_data, sample_user_id)
        
        # Generate barcode image
        barcode_bytes = service.generate_barcode_image(item.id)
        
        assert isinstance(barcode_bytes, bytes)
        assert len(barcode_bytes) > 0
        # Check if it's a valid image (PNG signature)
        assert barcode_bytes.startswith(b'\x89PNG')
    
    def test_generate_qr_code_image(self, service, sample_user_id):
        """Test generating QR code image"""
        # Create item
        item_data = UniversalInventoryItemCreate(
            sku="ITEM-001", name="Test Item",
            cost_price=Decimal("10"), sale_price=Decimal("15")
        )
        item = service.create_inventory_item(item_data, sample_user_id)
        
        # Generate QR code image
        qr_bytes = service.generate_qr_code_image(item.id)
        
        assert isinstance(qr_bytes, bytes)
        assert len(qr_bytes) > 0
        # Check if it's a valid image (PNG signature)
        assert qr_bytes.startswith(b'\x89PNG')

# Analytics Tests

class TestAnalytics:
    """Test analytics functionality"""
    
    def test_get_inventory_analytics(self, service, sample_user_id):
        """Test getting inventory analytics"""
        # Create category
        category = service.create_category(UniversalCategoryCreate(name="Electronics"), sample_user_id)
        
        # Create items
        items_data = [
            UniversalInventoryItemCreate(
                sku="ITEM-001", name="Item 1", category_id=category.id,
                stock_quantity=Decimal("10"), cost_price=Decimal("100"), sale_price=Decimal("150")
            ),
            UniversalInventoryItemCreate(
                sku="ITEM-002", name="Item 2", category_id=category.id,
                stock_quantity=Decimal("5"), low_stock_threshold=Decimal("10"),
                cost_price=Decimal("50"), sale_price=Decimal("75")
            ),
            UniversalInventoryItemCreate(
                sku="ITEM-003", name="Item 3", category_id=category.id,
                stock_quantity=Decimal("0"), low_stock_threshold=Decimal("5"),
                cost_price=Decimal("25"), sale_price=Decimal("40")
            )
        ]
        
        for item_data in items_data:
            service.create_inventory_item(item_data, sample_user_id)
        
        # Get analytics
        analytics = service.get_inventory_analytics()
        
        assert analytics['total_items'] == 3
        assert analytics['total_categories'] == 1
        assert analytics['low_stock_items'] == 2  # Items 2 and 3
        assert analytics['out_of_stock_items'] == 1  # Item 3
        assert analytics['total_value'] == float(Decimal("1250"))  # (10*100) + (5*50) + (0*25)
        
        # Check top categories
        assert len(analytics['top_categories']) == 1
        assert analytics['top_categories'][0]['name'] == "Electronics"
        assert analytics['top_categories'][0]['item_count'] == 3

# Integration Tests

class TestIntegration:
    """Test integration scenarios"""
    
    def test_complete_inventory_workflow(self, service, sample_user_id):
        """Test complete inventory management workflow"""
        # 1. Create category hierarchy
        electronics = service.create_category(
            UniversalCategoryCreate(name="Electronics"), sample_user_id
        )
        smartphones = service.create_category(
            UniversalCategoryCreate(name="Smartphones", parent_id=electronics.id), sample_user_id
        )
        
        # 2. Create inventory item
        item_data = UniversalInventoryItemCreate(
            name="iPhone 15",
            category_id=smartphones.id,
            cost_price=Decimal("800"),
            sale_price=Decimal("1000"),
            stock_quantity=Decimal("0"),
            low_stock_threshold=Decimal("5"),
            tags=["apple", "premium"]
        )
        item = service.create_inventory_item(item_data, sample_user_id)
        
        # 3. Add initial stock
        stock_update = StockUpdateRequest(
            quantity_change=Decimal("20"),
            reason="Initial inventory",
            reference_type="purchase_order"
        )
        service.update_stock(item.id, stock_update, sample_user_id)
        
        # 4. Simulate sales (reduce stock)
        sale_update = StockUpdateRequest(
            quantity_change=Decimal("-15"),
            reason="Sales",
            reference_type="invoice"
        )
        service.update_stock(item.id, sale_update, sample_user_id)
        
        # 5. Check final state
        service.db.refresh(item)
        assert item.stock_quantity == Decimal("5")
        
        # 6. Check movements
        movements = service.db.query(InventoryMovement).filter(
            InventoryMovement.inventory_item_id == item.id
        ).order_by(InventoryMovement.movement_date).all()
        
        assert len(movements) == 2
        assert movements[0].movement_type == "in"
        assert movements[0].quantity_change == Decimal("20")
        assert movements[1].movement_type == "out"
        assert movements[1].quantity_change == Decimal("-15")
        
        # 7. Check low stock alert
        alerts = service.get_low_stock_alerts()
        assert len(alerts) == 1
        assert alerts[0].item_name == "iPhone 15"
        assert alerts[0].urgency_level == "medium"  # At threshold
        
        # 8. Search functionality
        filters = InventorySearchFilters(search="iPhone")
        items, total = service.search_inventory_items(filters)
        assert total == 1
        assert items[0].name == "iPhone 15"
        
        # 9. Category tree
        tree = service.get_categories_tree()
        assert len(tree) == 1
        assert tree[0].name == "Electronics"
        assert len(tree[0].children) == 1
        assert tree[0].children[0].name == "Smartphones"

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])