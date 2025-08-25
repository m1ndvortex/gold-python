"""
Integration Tests for Universal Inventory Management System
Tests using the real PostgreSQL database in Docker environment.
"""

import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from database import get_db
from models_universal import InventoryItem, Category, User, Role
from services.inventory_service import UniversalInventoryService
from schemas_inventory_universal import UniversalCategoryCreate


def test_inventory_service_basic_functionality():
    """Test basic inventory service functionality with real database"""
    
    # Get database session
    db = next(get_db())
    
    try:
        # Create test user if not exists
        test_user = db.query(User).filter(User.username == "test_inventory_user").first()
        if not test_user:
            # Create role first
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            if not admin_role:
                admin_role = Role(
                    name="admin",
                    description="Administrator",
                    permissions={"inventory": ["create", "read", "update", "delete"]}
                )
                db.add(admin_role)
                db.commit()
                db.refresh(admin_role)
            
            test_user = User(
                username="test_inventory_user",
                email="test_inventory@example.com",
                password_hash="hashed_password",
                role_id=admin_role.id,
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        
        # Initialize service
        service = UniversalInventoryService(db)
        
        # Test 1: Create a category
        import time
        unique_suffix = str(int(time.time()))
        category_data = UniversalCategoryCreate(
            name=f"Test Electronics {unique_suffix}",
            description="Test electronic items",
            business_type="retail"
        )
        
        category = service.create_category(
            category_data=category_data,
            user_id=str(test_user.id),
            business_type="retail"
        )
        
        assert category.name.startswith("Test Electronics")
        assert category.level == 0
        assert category.business_type == "retail"
        print("✓ Category creation test passed")
        
        # Test 2: Create an inventory item
        item_data = {
            "name": "Test iPhone",
            "category_id": str(category.id),
            "cost_price": 800.00,
            "sale_price": 1200.00,
            "stock_quantity": 10,
            "weight_grams": 0.2,  # Required for backward compatibility
            "purchase_price": 800.00,  # Required for backward compatibility
            "sell_price": 1200.00,  # Required for backward compatibility
            "attributes": {
                "brand": "Apple",
                "model": "iPhone 15"
            },
            "tags": ["smartphone", "apple"]
        }
        
        item = service.create_inventory_item(
            item_data=item_data,
            user_id=str(test_user.id)
        )
        
        assert item.name == "Test iPhone"
        assert item.sku is not None
        assert item.attributes["brand"] == "Apple"
        assert "smartphone" in item.tags
        print("✓ Inventory item creation test passed")
        
        # Test 3: Search functionality
        items, total = service.search_inventory_items(query="iPhone")
        assert total >= 1
        assert any(item.name == "Test iPhone" for item in items)
        print("✓ Search functionality test passed")
        
        # Test 4: Update item
        update_data = {"sale_price": 1300.00}
        updated_item = service.update_inventory_item(
            item_id=str(item.id),
            update_data=update_data,
            user_id=str(test_user.id)
        )
        
        assert updated_item.sale_price == 1300.00
        print("✓ Item update test passed")
        
        # Test 5: Low stock alerts
        # Create a low stock item
        low_stock_data = {
            "name": "Low Stock Item",
            "stock_quantity": 2,
            "min_stock_level": 5,
            "cost_price": 50.00,
            "sale_price": 75.00,
            "weight_grams": 0.1,  # Required for backward compatibility
            "purchase_price": 50.00,  # Required for backward compatibility
            "sell_price": 75.00  # Required for backward compatibility
        }
        
        low_stock_item = service.create_inventory_item(
            item_data=low_stock_data,
            user_id=str(test_user.id)
        )
        
        alerts = service.get_low_stock_alerts()
        assert any(alert['item_name'] == "Low Stock Item" for alert in alerts)
        print("✓ Low stock alerts test passed")
        
        # Test 6: Inventory movements
        movements, total = service.get_inventory_movements(item_id=str(item.id))
        assert total >= 1  # Should have at least initial stock movement
        print("✓ Inventory movements test passed")
        
        print("\n🎉 All universal inventory tests passed successfully!")
        
        # Cleanup
        db.delete(item)
        db.delete(low_stock_item)
        db.delete(category)
        db.commit()
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    test_inventory_service_basic_functionality()