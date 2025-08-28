"""
Basic Tests for Universal Inventory Management Service
Simple tests to verify core functionality using real PostgreSQL database
"""

import pytest
import uuid
from decimal import Decimal
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
import os

# Import models and services
from database import get_db, engine
from models_universal import UniversalCategory, UniversalInventoryItem
from schemas_universal import UniversalCategoryCreate, UniversalInventoryItemCreate
from services.universal_inventory_service import UniversalInventoryService

@pytest.fixture
def db_session():
    """Create database session for testing"""
    from database import SessionLocal
    session = SessionLocal()
    
    # Clean up test data before each test
    session.query(UniversalInventoryItem).filter(
        UniversalInventoryItem.sku.like('TEST-%')
    ).delete(synchronize_session=False)
    session.query(UniversalCategory).filter(
        UniversalCategory.name.like('Test%')
    ).delete(synchronize_session=False)
    session.commit()
    
    yield session
    
    # Clean up after test
    session.query(UniversalInventoryItem).filter(
        UniversalInventoryItem.sku.like('TEST-%')
    ).delete(synchronize_session=False)
    session.query(UniversalCategory).filter(
        UniversalCategory.name.like('Test%')
    ).delete(synchronize_session=False)
    session.commit()
    session.close()

@pytest.fixture
def service(db_session):
    """Create service instance"""
    return UniversalInventoryService(db_session)

@pytest.fixture
def sample_user_id():
    """Sample user ID for testing"""
    return uuid.uuid4()

def test_create_category(service, sample_user_id):
    """Test creating a basic category"""
    category_data = UniversalCategoryCreate(
        name="Test Electronics",
        description="Test category for electronics",
        color="#FF5733"
    )
    
    category = service.create_category(category_data, sample_user_id)
    
    assert category.name == "Test Electronics"
    assert category.description == "Test category for electronics"
    assert category.color == "#FF5733"
    assert category.level == 0
    assert category.is_active is True
    assert category.created_by == sample_user_id

def test_create_inventory_item(service, sample_user_id):
    """Test creating a basic inventory item"""
    # Create category first
    category_data = UniversalCategoryCreate(name="Test Category")
    category = service.create_category(category_data, sample_user_id)
    
    item_data = UniversalInventoryItemCreate(
        sku="TEST-001",
        name="Test iPhone",
        description="Test iPhone description",
        category_id=category.id,
        cost_price=Decimal("800.00"),
        sale_price=Decimal("1000.00"),
        stock_quantity=Decimal("10"),
        unit_of_measure="piece",
        low_stock_threshold=Decimal("5")
    )
    
    item = service.create_inventory_item(item_data, sample_user_id)
    
    assert item.sku == "TEST-001"
    assert item.name == "Test iPhone"
    assert item.category_id == category.id
    assert item.cost_price == Decimal("800.00")
    assert item.sale_price == Decimal("1000.00")
    assert item.stock_quantity == Decimal("10")
    assert item.is_active is True
    assert item.created_by == sample_user_id

def test_search_inventory_items(service, sample_user_id):
    """Test basic inventory search"""
    # Create test items
    category_data = UniversalCategoryCreate(name="Test Category")
    category = service.create_category(category_data, sample_user_id)
    
    item1_data = UniversalInventoryItemCreate(
        sku="TEST-001",
        name="Test iPhone",
        category_id=category.id,
        cost_price=Decimal("800"),
        sale_price=Decimal("1000")
    )
    item2_data = UniversalInventoryItemCreate(
        sku="TEST-002", 
        name="Test Samsung",
        category_id=category.id,
        cost_price=Decimal("700"),
        sale_price=Decimal("900")
    )
    
    service.create_inventory_item(item1_data, sample_user_id)
    service.create_inventory_item(item2_data, sample_user_id)
    
    # Search for iPhone
    from schemas_universal import InventorySearchFilters
    filters = InventorySearchFilters(search="iPhone")
    items, total = service.search_inventory_items(filters)
    
    assert total == 1
    assert items[0].name == "Test iPhone"

def test_get_low_stock_alerts(service, sample_user_id):
    """Test low stock alerts"""
    # Create category
    category_data = UniversalCategoryCreate(name="Test Category")
    category = service.create_category(category_data, sample_user_id)
    
    # Create low stock item
    item_data = UniversalInventoryItemCreate(
        sku="TEST-LOW-001",
        name="Test Low Stock Item",
        category_id=category.id,
        stock_quantity=Decimal("2"),
        low_stock_threshold=Decimal("5"),
        cost_price=Decimal("10"),
        sale_price=Decimal("15")
    )
    
    service.create_inventory_item(item_data, sample_user_id)
    
    # Get alerts
    alerts = service.get_low_stock_alerts()
    
    assert len(alerts) >= 1
    alert = next((a for a in alerts if a.item_name == "Test Low Stock Item"), None)
    assert alert is not None
    assert alert.current_stock == Decimal("2")
    assert alert.low_stock_threshold == Decimal("5")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])