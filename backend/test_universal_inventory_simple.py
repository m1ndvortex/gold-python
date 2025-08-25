"""
Simple Unit Tests for Universal Inventory Management System
Basic tests to verify core functionality works correctly.
"""

import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from models_universal import Base, InventoryItem, Category, User, Role
from services.inventory_service import UniversalInventoryService
from schemas_inventory_universal import UniversalCategoryCreate, UniversalInventoryItemCreate


# Test database setup
@pytest.fixture(scope="function")
def db_session():
    """Create a test database session"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    
    from sqlalchemy.orm import sessionmaker
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


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


def test_create_root_category(inventory_service: UniversalInventoryService, test_user: User):
    """Test creating a root category"""
    category_data = UniversalCategoryCreate(
        name="Electronics",
        description="Electronic items",
        business_type="retail"
    )
    
    category = inventory_service.create_category(
        category_data=category_data,
        user_id=str(test_user.id),
        business_type="retail"
    )
    
    assert category.name == "Electronics"
    assert category.level == 0
    assert category.parent_id is None
    assert category.business_type == "retail"


def test_create_inventory_item_with_sku_generation(inventory_service: UniversalInventoryService, test_user: User):
    """Test creating inventory item with automatic SKU generation"""
    item_data = {
        "name": "iPhone 15",
        "cost_price": 800.00,
        "sale_price": 1200.00,
        "stock_quantity": 10,
        "attributes": {
            "brand": "Apple",
            "model": "iPhone 15"
        },
        "tags": ["smartphone", "apple"]
    }
    
    item = inventory_service.create_inventory_item(
        item_data=item_data,
        user_id=str(test_user.id)
    )
    
    assert item.name == "iPhone 15"
    assert item.sku is not None
    assert item.sku.startswith("ITEM")  # Default prefix
    assert item.attributes["brand"] == "Apple"
    assert "smartphone" in item.tags
    assert item.stock_quantity == 10


def test_sku_uniqueness_validation(inventory_service: UniversalInventoryService, test_user: User):
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


def test_search_inventory_items(inventory_service: UniversalInventoryService, test_user: User):
    """Test basic inventory search functionality"""
    # Create test items
    items_data = [
        {
            "name": "iPhone 15 Pro",
            "sku": "APPLE001",
            "cost_price": 900.00,
            "sale_price": 1300.00,
            "stock_quantity": 5
        },
        {
            "name": "Samsung Galaxy S24",
            "sku": "SAMSUNG001",
            "cost_price": 800.00,
            "sale_price": 1200.00,
            "stock_quantity": 8
        }
    ]
    
    for item_data in items_data:
        inventory_service.create_inventory_item(
            item_data=item_data,
            user_id=str(test_user.id)
        )
    
    # Search for "iPhone"
    items, total = inventory_service.search_inventory_items(query="iPhone")
    assert total == 1
    assert items[0].name == "iPhone 15 Pro"
    
    # Search by SKU
    items, total = inventory_service.search_inventory_items(query="APPLE001")
    assert total == 1
    assert items[0].name == "iPhone 15 Pro"


def test_low_stock_alerts(inventory_service: UniversalInventoryService, test_user: User):
    """Test low stock alert generation"""
    # Create items with different stock levels
    items_data = [
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
    
    assert len(alerts) == 1  # Only one item below minimum stock
    assert alerts[0]['item_name'] == "Low Stock Item"
    assert alerts[0]['shortage'] == 2  # 5 - 3


def test_update_inventory_item(inventory_service: UniversalInventoryService, test_user: User):
    """Test updating inventory item"""
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
    
    # Update item
    update_data = {
        "sale_price": 160.00,
        "stock_quantity": 15
    }
    
    updated_item = inventory_service.update_inventory_item(
        item_id=str(item.id),
        update_data=update_data,
        user_id=str(test_user.id)
    )
    
    assert updated_item.sale_price == 160.00
    assert updated_item.stock_quantity == 15


def test_inventory_movements_tracking(inventory_service: UniversalInventoryService, test_user: User):
    """Test inventory movement tracking"""
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
    
    # Update stock (should create movement)
    update_data = {"stock_quantity": 15}
    
    inventory_service.update_inventory_item(
        item_id=str(item.id),
        update_data=update_data,
        user_id=str(test_user.id)
    )
    
    # Check movements
    movements, total = inventory_service.get_inventory_movements(item_id=str(item.id))
    
    assert total == 2  # Initial stock + adjustment
    assert movements[0].movement_type == "adjustment"
    assert movements[0].quantity == 5  # Increase of 5


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])