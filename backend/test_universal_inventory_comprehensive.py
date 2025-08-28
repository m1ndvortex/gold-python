"""
Comprehensive Integration Tests for Universal Inventory Management
Tests complete workflows using real PostgreSQL database in Docker environment
"""

import pytest
import uuid
from decimal import Decimal
from sqlalchemy import text
from database import SessionLocal
from services.universal_inventory_service import UniversalInventoryService
from schemas_universal import (
    UniversalCategoryCreate, UniversalInventoryItemCreate, 
    InventorySearchFilters, StockUpdateRequest, BulkTagRequest,
    AttributeDefinition
)

@pytest.fixture
def db_session():
    """Create database session for testing"""
    session = SessionLocal()
    
    # Clean up test data
    try:
        session.execute(text("DELETE FROM inventory_movements WHERE inventory_item_id IN (SELECT id FROM inventory_items_new WHERE sku LIKE 'COMP-TEST-%')"))
        session.execute(text("DELETE FROM inventory_items_new WHERE sku LIKE 'COMP-TEST-%'"))
        session.execute(text("DELETE FROM categories_new WHERE name LIKE 'Comp Test%'"))
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"Cleanup error: {e}")
    
    yield session
    
    # Clean up after test
    try:
        session.execute(text("DELETE FROM inventory_movements WHERE inventory_item_id IN (SELECT id FROM inventory_items_new WHERE sku LIKE 'COMP-TEST-%')"))
        session.execute(text("DELETE FROM inventory_items_new WHERE sku LIKE 'COMP-TEST-%'"))
        session.execute(text("DELETE FROM categories_new WHERE name LIKE 'Comp Test%'"))
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"Cleanup error: {e}")
    finally:
        session.close()

@pytest.fixture
def service(db_session):
    """Create service instance"""
    return UniversalInventoryService(db_session)

@pytest.fixture
def sample_user_id():
    """Sample user ID for testing"""
    return uuid.uuid4()

def test_complete_inventory_workflow(service, sample_user_id):
    """Test complete inventory management workflow"""
    
    # 1. Create category hierarchy with custom attributes
    print("📁 Creating category hierarchy...")
    
    # Root category
    electronics_data = UniversalCategoryCreate(
        name="Comp Test Electronics",
        description="Electronics category for comprehensive testing",
        color="#0066CC",
        attribute_schema=[
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
    )
    electronics = service.create_category(electronics_data, sample_user_id)
    assert electronics.name == "Comp Test Electronics"
    assert len(electronics.attribute_schema) == 2
    
    # Subcategory
    smartphones_data = UniversalCategoryCreate(
        name="Comp Test Smartphones",
        parent_id=electronics.id,
        description="Smartphones subcategory"
    )
    smartphones = service.create_category(smartphones_data, sample_user_id)
    assert smartphones.parent_id == electronics.id
    assert smartphones.level == 1
    
    # 2. Create inventory items with various configurations
    print("📦 Creating inventory items...")
    
    items_data = [
        UniversalInventoryItemCreate(
            sku="COMP-TEST-001",
            name="Comp Test iPhone 15",
            description="Latest iPhone model for testing",
            category_id=smartphones.id,
            cost_price=Decimal("800.00"),
            sale_price=Decimal("1000.00"),
            stock_quantity=Decimal("20"),
            unit_of_measure="piece",
            low_stock_threshold=Decimal("5"),
            tags=["smartphone", "apple", "premium"],
            custom_attributes={
                "brand": "Apple",
                "color": "Black",
                "storage": "128GB",
                "warranty": "2 years"
            }
        ),
        UniversalInventoryItemCreate(
            sku="COMP-TEST-002",
            name="Comp Test Samsung Galaxy",
            description="Samsung Galaxy for testing",
            category_id=smartphones.id,
            cost_price=Decimal("700.00"),
            sale_price=Decimal("900.00"),
            stock_quantity=Decimal("3"),  # Low stock
            unit_of_measure="piece",
            low_stock_threshold=Decimal("5"),
            tags=["smartphone", "samsung", "android"],
            custom_attributes={
                "brand": "Samsung",
                "color": "White",
                "storage": "256GB",
                "warranty": "1 year"
            }
        ),
        UniversalInventoryItemCreate(
            sku="COMP-TEST-003",
            name="Comp Test iPad Pro",
            description="iPad Pro for testing",
            category_id=electronics.id,  # Different category
            cost_price=Decimal("600.00"),
            sale_price=Decimal("800.00"),
            stock_quantity=Decimal("0"),  # Out of stock
            unit_of_measure="piece",
            low_stock_threshold=Decimal("3"),
            tags=["tablet", "apple", "professional"],
            custom_attributes={
                "brand": "Apple",
                "color": "Silver",
                "storage": "512GB",
                "warranty": "1 year"
            }
        )
    ]
    
    created_items = []
    for item_data in items_data:
        item = service.create_inventory_item(item_data, sample_user_id)
        created_items.append(item)
        assert item.sku == item_data.sku
        assert item.name == item_data.name
        assert item.category_id == item_data.category_id
    
    print(f"✅ Created {len(created_items)} inventory items")
    
    # 3. Test advanced search functionality
    print("🔍 Testing advanced search...")
    
    # Search by name
    filters = InventorySearchFilters(search="iPhone")
    items, total = service.search_inventory_items(filters)
    assert total == 1
    assert items[0].name == "Comp Test iPhone 15"
    
    # Search by tags
    filters = InventorySearchFilters(tags=["apple"])
    items, total = service.search_inventory_items(filters)
    assert total == 2  # iPhone and iPad
    
    # Search by custom attributes
    filters = InventorySearchFilters(custom_attributes={"brand": "Samsung"})
    items, total = service.search_inventory_items(filters)
    assert total == 1
    assert items[0].name == "Comp Test Samsung Galaxy"
    
    # Search by category
    filters = InventorySearchFilters(category_id=smartphones.id)
    items, total = service.search_inventory_items(filters)
    assert total == 2  # iPhone and Samsung
    
    # Low stock filter
    filters = InventorySearchFilters(low_stock_only=True)
    items, total = service.search_inventory_items(filters)
    assert total >= 2  # Samsung (3 < 5) and iPad (0 < 3)
    
    print("✅ Advanced search tests passed")
    
    # 4. Test stock management
    print("📈 Testing stock management...")
    
    iphone = created_items[0]  # iPhone with 20 units
    
    # Stock increase
    stock_update = StockUpdateRequest(
        quantity_change=Decimal("10"),
        reason="Comprehensive test - stock increase",
        notes="Testing stock increase functionality"
    )
    updated_item = service.update_stock(iphone.id, stock_update, sample_user_id)
    assert updated_item.stock_quantity == Decimal("30")
    
    # Stock decrease
    stock_update = StockUpdateRequest(
        quantity_change=Decimal("-15"),
        reason="Comprehensive test - stock decrease",
        reference_type="sale"
    )
    updated_item = service.update_stock(iphone.id, stock_update, sample_user_id)
    assert updated_item.stock_quantity == Decimal("15")
    
    print("✅ Stock management tests passed")
    
    # 5. Test low stock alerts
    print("⚠️ Testing low stock alerts...")
    
    alerts = service.get_low_stock_alerts()
    
    # Should have at least Samsung (3 < 5) and iPad (0 < 3)
    test_alerts = [a for a in alerts if a.item_sku.startswith("COMP-TEST-")]
    assert len(test_alerts) >= 2
    
    # Check urgency levels
    samsung_alert = next((a for a in test_alerts if "Samsung" in a.item_name), None)
    ipad_alert = next((a for a in test_alerts if "iPad" in a.item_name), None)
    
    assert samsung_alert is not None
    assert samsung_alert.urgency_level == "medium"  # 3 <= 5 * 0.8
    
    assert ipad_alert is not None
    assert ipad_alert.urgency_level == "critical"  # 0 <= 0
    
    print("✅ Low stock alerts tests passed")
    
    # 6. Test bulk operations
    print("🔄 Testing bulk operations...")
    
    # Bulk tag update
    item_ids = [item.id for item in created_items]
    bulk_tag_request = BulkTagRequest(
        item_ids=item_ids,
        tags=["comprehensive_test", "bulk_updated"],
        operation="add"
    )
    
    updated_count = service.bulk_tag_items(bulk_tag_request, sample_user_id)
    assert updated_count == len(created_items)
    
    # Verify tags were added
    for item in created_items:
        service.db.refresh(item)
        assert "comprehensive_test" in item.tags
        assert "bulk_updated" in item.tags
    
    print("✅ Bulk operations tests passed")
    
    # 7. Test category tree functionality
    print("🌳 Testing category tree...")
    
    tree = service.get_categories_tree()
    
    # Find our test categories in the tree
    test_electronics = None
    for category in tree:
        if category.name == "Comp Test Electronics":
            test_electronics = category
            break
    
    assert test_electronics is not None
    assert len(test_electronics.children) >= 1
    
    # Find the smartphones category in children
    smartphones_child = None
    for child in test_electronics.children:
        if child.name == "Comp Test Smartphones":
            smartphones_child = child
            break
    
    assert smartphones_child is not None
    
    print("✅ Category tree tests passed")
    
    # 8. Test analytics
    print("📊 Testing analytics...")
    
    analytics = service.get_inventory_analytics()
    
    assert analytics['total_items'] >= 3
    assert analytics['total_categories'] >= 2
    assert analytics['low_stock_items'] >= 2
    assert analytics['out_of_stock_items'] >= 1
    assert analytics['total_value'] > 0
    
    # Check top categories
    category_names = [cat['name'] for cat in analytics['top_categories']]
    assert any("Comp Test" in name for name in category_names)
    
    print("✅ Analytics tests passed")
    
    # 9. Test stock movements tracking
    print("📋 Testing stock movements...")
    
    from models_universal import InventoryMovement
    movements = service.db.query(InventoryMovement).filter(
        InventoryMovement.inventory_item_id == iphone.id
    ).all()
    
    assert len(movements) >= 3  # At least initial + 2 updates
    
    # Check movement types and reasons
    movement_reasons = [m.reason for m in movements]
    assert "Initial stock" in movement_reasons
    assert "Comprehensive test - stock increase" in movement_reasons
    assert "Comprehensive test - stock decrease" in movement_reasons
    
    print("✅ Stock movements tests passed")
    
    print("\n" + "=" * 60)
    print("🎉 COMPREHENSIVE TEST COMPLETED SUCCESSFULLY!")
    print("✅ All Universal Inventory Management features are working correctly!")
    print("✅ Database integration is functioning properly!")
    print("✅ Real PostgreSQL database operations are successful!")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])