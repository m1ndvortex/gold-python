import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import get_db
from main import app
import models
from auth import get_password_hash
import tempfile
import os
from pathlib import Path

# Test database setup - use Docker network hostname for database connection
SQLALCHEMY_DATABASE_URL = "postgresql://goldshop_user:goldshop_password@db:5432/goldshop"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    # Create all tables
    models.Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Clean up tables after each test
        models.Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    # Create a test role first
    test_role = models.Role(
        name="Test Role",
        description="Test role for inventory tests",
        permissions={"inventory": ["create", "read", "update", "delete"]}
    )
    db_session.add(test_role)
    db_session.commit()
    db_session.refresh(test_role)
    
    # Create test user
    user = models.User(
        username="testuser",
        email="test@example.com",
        password_hash=get_password_hash("testpassword"),
        role_id=test_role.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(test_user):
    """Get authentication headers for test user"""
    login_data = {
        "username": "testuser",
        "password": "testpassword"
    }
    response = client.post("/auth/login", json=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_category(db_session):
    """Create a test category"""
    category = models.Category(
        name="Test Category",
        description="Test category for inventory tests"
    )
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category

@pytest.fixture
def test_subcategory(db_session, test_category):
    """Create a test subcategory"""
    subcategory = models.Category(
        name="Test Subcategory",
        description="Test subcategory for inventory tests",
        parent_id=test_category.id
    )
    db_session.add(subcategory)
    db_session.commit()
    db_session.refresh(subcategory)
    return subcategory

@pytest.fixture
def test_inventory_item(db_session, test_category):
    """Create a test inventory item"""
    item = models.InventoryItem(
        name="Test Gold Ring",
        category_id=test_category.id,
        weight_grams=5.5,
        purchase_price=1000.00,
        sell_price=1200.00,
        stock_quantity=10,
        min_stock_level=5,
        description="A beautiful test gold ring"
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item

class TestCategoryManagement:
    """Test category management endpoints"""
    
    def test_create_category(self, db_session, auth_headers):
        """Test creating a new category"""
        import uuid
        unique_name = f"Test Rings {uuid.uuid4().hex[:8]}"
        category_data = {
            "name": unique_name,
            "description": "Gold rings collection"
        }
        
        response = client.post("/inventory/categories", json=category_data, headers=auth_headers)
        if response.status_code != 200:
            print(f"Error response: {response.text}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == unique_name
        assert data["description"] == "Gold rings collection"
        assert data["parent_id"] is None
        assert "id" in data
        assert "created_at" in data
        
        # Verify in database
        db_category = db_session.query(models.Category).filter(
            models.Category.name == unique_name
        ).first()
        assert db_category is not None
        assert db_category.description == "Gold rings collection"
    
    def test_create_subcategory(self, db_session, auth_headers, test_category):
        """Test creating a subcategory"""
        subcategory_data = {
            "name": "Wedding Rings",
            "parent_id": str(test_category.id),
            "description": "Wedding rings subcategory"
        }
        
        response = client.post("/inventory/categories", json=subcategory_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Wedding Rings"
        assert data["parent_id"] == str(test_category.id)
        
        # Verify in database
        db_subcategory = db_session.query(models.Category).filter(
            models.Category.name == "Wedding Rings"
        ).first()
        assert db_subcategory is not None
        assert db_subcategory.parent_id == test_category.id
    
    def test_create_category_duplicate_name_same_level(self, db_session, auth_headers, test_category):
        """Test creating category with duplicate name at same level should fail"""
        category_data = {
            "name": test_category.name,
            "description": "Duplicate category"
        }
        
        response = client.post("/inventory/categories", json=category_data, headers=auth_headers)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_create_category_invalid_parent(self, db_session, auth_headers):
        """Test creating category with invalid parent ID should fail"""
        category_data = {
            "name": "Invalid Parent Category",
            "parent_id": str(uuid.uuid4()),
            "description": "Category with invalid parent"
        }
        
        response = client.post("/inventory/categories", json=category_data, headers=auth_headers)
        assert response.status_code == 404
        assert "Parent category not found" in response.json()["detail"]
    
    def test_get_categories(self, db_session, auth_headers, test_category, test_subcategory):
        """Test getting categories list"""
        response = client.get("/inventory/categories", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        
        # Find our test category
        test_cat = next((cat for cat in data if cat["name"] == test_category.name), None)
        assert test_cat is not None
        assert len(test_cat["children"]) >= 1
        assert test_cat["children"][0]["name"] == test_subcategory.name
    
    def test_get_category_by_id(self, db_session, auth_headers, test_category, test_subcategory):
        """Test getting specific category by ID"""
        response = client.get(f"/inventory/categories/{test_category.id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == test_category.name
        assert len(data["children"]) >= 1
        assert data["children"][0]["name"] == test_subcategory.name
    
    def test_get_category_not_found(self, db_session, auth_headers):
        """Test getting non-existent category should return 404"""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/inventory/categories/{fake_id}", headers=auth_headers)
        assert response.status_code == 404
        assert "Category not found" in response.json()["detail"]
    
    def test_update_category(self, db_session, auth_headers, test_category):
        """Test updating a category"""
        update_data = {
            "name": "Updated Category Name",
            "description": "Updated description"
        }
        
        response = client.put(f"/inventory/categories/{test_category.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Updated Category Name"
        assert data["description"] == "Updated description"
        
        # Verify in database
        db_session.refresh(test_category)
        assert test_category.name == "Updated Category Name"
        assert test_category.description == "Updated description"
    
    def test_update_category_invalid_parent(self, db_session, auth_headers, test_category):
        """Test updating category with invalid parent should fail"""
        update_data = {
            "parent_id": str(uuid.uuid4())
        }
        
        response = client.put(f"/inventory/categories/{test_category.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 404
        assert "Parent category not found" in response.json()["detail"]
    
    def test_update_category_circular_reference(self, db_session, auth_headers, test_category):
        """Test updating category to be its own parent should fail"""
        update_data = {
            "parent_id": str(test_category.id)
        }
        
        response = client.put(f"/inventory/categories/{test_category.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 400
        assert "cannot be its own parent" in response.json()["detail"]
    
    def test_delete_category_empty(self, db_session, auth_headers):
        """Test deleting empty category should succeed"""
        # Create a category without items or children
        empty_category = models.Category(name="Empty Category")
        db_session.add(empty_category)
        db_session.commit()
        db_session.refresh(empty_category)
        
        response = client.delete(f"/inventory/categories/{empty_category.id}", headers=auth_headers)
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]
        
        # Verify deletion in database
        deleted_category = db_session.query(models.Category).filter(
            models.Category.id == empty_category.id
        ).first()
        assert deleted_category is None
    
    def test_delete_category_with_items(self, db_session, auth_headers, test_category, test_inventory_item):
        """Test deleting category with inventory items should fail"""
        response = client.delete(f"/inventory/categories/{test_category.id}", headers=auth_headers)
        assert response.status_code == 400
        assert "inventory items" in response.json()["detail"]
    
    def test_delete_category_with_children(self, db_session, auth_headers, test_category, test_subcategory):
        """Test deleting category with subcategories should fail"""
        response = client.delete(f"/inventory/categories/{test_category.id}", headers=auth_headers)
        assert response.status_code == 400
        assert "subcategories" in response.json()["detail"]

class TestInventoryItemManagement:
    """Test inventory item management endpoints"""
    
    def test_create_inventory_item(self, db_session, auth_headers, test_category):
        """Test creating a new inventory item"""
        item_data = {
            "name": "Gold Necklace",
            "category_id": str(test_category.id),
            "weight_grams": 15.5,
            "purchase_price": 2500.00,
            "sell_price": 3000.00,
            "stock_quantity": 5,
            "min_stock_level": 2,
            "description": "Beautiful gold necklace"
        }
        
        response = client.post("/inventory/items", json=item_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Gold Necklace"
        assert data["weight_grams"] == 15.5
        assert data["purchase_price"] == 2500.00
        assert data["sell_price"] == 3000.00
        assert data["stock_quantity"] == 5
        assert data["is_active"] == True
        assert data["category"]["name"] == test_category.name
        
        # Verify in database
        db_item = db_session.query(models.InventoryItem).filter(
            models.InventoryItem.name == "Gold Necklace"
        ).first()
        assert db_item is not None
        assert db_item.category_id == test_category.id
    
    def test_create_inventory_item_invalid_category(self, db_session, auth_headers):
        """Test creating inventory item with invalid category should fail"""
        item_data = {
            "name": "Invalid Category Item",
            "category_id": str(uuid.uuid4()),
            "weight_grams": 10.0,
            "purchase_price": 1000.00,
            "sell_price": 1200.00,
            "stock_quantity": 5
        }
        
        response = client.post("/inventory/items", json=item_data, headers=auth_headers)
        assert response.status_code == 404
        assert "Category not found" in response.json()["detail"]
    
    def test_create_inventory_item_invalid_weight(self, db_session, auth_headers, test_category):
        """Test creating inventory item with invalid weight should fail"""
        item_data = {
            "name": "Invalid Weight Item",
            "category_id": str(test_category.id),
            "weight_grams": 0,  # Invalid weight
            "purchase_price": 1000.00,
            "sell_price": 1200.00,
            "stock_quantity": 5
        }
        
        response = client.post("/inventory/items", json=item_data, headers=auth_headers)
        assert response.status_code == 400
        assert "Weight must be greater than 0" in response.json()["detail"]
    
    def test_create_inventory_item_negative_price(self, db_session, auth_headers, test_category):
        """Test creating inventory item with negative price should fail"""
        item_data = {
            "name": "Negative Price Item",
            "category_id": str(test_category.id),
            "weight_grams": 10.0,
            "purchase_price": -100.00,  # Invalid price
            "sell_price": 1200.00,
            "stock_quantity": 5
        }
        
        response = client.post("/inventory/items", json=item_data, headers=auth_headers)
        assert response.status_code == 400
        assert "cannot be negative" in response.json()["detail"]
    
    def test_get_inventory_items(self, db_session, auth_headers, test_inventory_item):
        """Test getting inventory items list"""
        response = client.get("/inventory/items", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        
        # Find our test item
        test_item = next((item for item in data if item["name"] == test_inventory_item.name), None)
        assert test_item is not None
        assert test_item["weight_grams"] == float(test_inventory_item.weight_grams)
        assert test_item["category"]["name"] == test_inventory_item.category.name
    
    def test_get_inventory_items_with_filters(self, db_session, auth_headers, test_inventory_item):
        """Test getting inventory items with filters"""
        # Test category filter
        response = client.get(
            f"/inventory/items?category_id={test_inventory_item.category_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert all(item["category"]["id"] == str(test_inventory_item.category_id) for item in data)
        
        # Test search filter
        response = client.get(
            f"/inventory/items?search={test_inventory_item.name[:4]}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(test_inventory_item.name[:4].lower() in item["name"].lower() for item in data)
    
    def test_get_inventory_item_by_id(self, db_session, auth_headers, test_inventory_item):
        """Test getting specific inventory item by ID"""
        response = client.get(f"/inventory/items/{test_inventory_item.id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == test_inventory_item.name
        assert data["weight_grams"] == float(test_inventory_item.weight_grams)
        assert data["category"]["name"] == test_inventory_item.category.name
    
    def test_get_inventory_item_not_found(self, db_session, auth_headers):
        """Test getting non-existent inventory item should return 404"""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/inventory/items/{fake_id}", headers=auth_headers)
        assert response.status_code == 404
        assert "Inventory item not found" in response.json()["detail"]
    
    def test_update_inventory_item(self, db_session, auth_headers, test_inventory_item):
        """Test updating an inventory item"""
        update_data = {
            "name": "Updated Gold Ring",
            "weight_grams": 6.0,
            "sell_price": 1300.00,
            "description": "Updated description"
        }
        
        response = client.put(f"/inventory/items/{test_inventory_item.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Updated Gold Ring"
        assert data["weight_grams"] == 6.0
        assert data["sell_price"] == 1300.00
        assert data["description"] == "Updated description"
        
        # Verify in database
        db_session.refresh(test_inventory_item)
        assert test_inventory_item.name == "Updated Gold Ring"
        assert float(test_inventory_item.weight_grams) == 6.0
        assert float(test_inventory_item.sell_price) == 1300.00
    
    def test_update_inventory_item_invalid_values(self, db_session, auth_headers, test_inventory_item):
        """Test updating inventory item with invalid values should fail"""
        update_data = {
            "weight_grams": -5.0  # Invalid weight
        }
        
        response = client.put(f"/inventory/items/{test_inventory_item.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 400
        assert "Weight must be greater than 0" in response.json()["detail"]
    
    def test_update_item_stock(self, db_session, auth_headers, test_inventory_item):
        """Test updating inventory item stock level"""
        initial_stock = test_inventory_item.stock_quantity
        stock_change = 5
        
        stock_update = {
            "quantity_change": stock_change,
            "reason": "Stock replenishment"
        }
        
        response = client.patch(f"/inventory/items/{test_inventory_item.id}/stock", json=stock_update, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["stock_quantity"] == initial_stock + stock_change
        
        # Verify in database
        db_session.refresh(test_inventory_item)
        assert test_inventory_item.stock_quantity == initial_stock + stock_change
    
    def test_update_item_stock_insufficient(self, db_session, auth_headers, test_inventory_item):
        """Test updating stock with insufficient quantity should fail"""
        stock_update = {
            "quantity_change": -(test_inventory_item.stock_quantity + 1)  # More than available
        }
        
        response = client.patch(f"/inventory/items/{test_inventory_item.id}/stock", json=stock_update, headers=auth_headers)
        assert response.status_code == 400
        assert "Insufficient stock" in response.json()["detail"]
    
    def test_delete_inventory_item_unused(self, db_session, auth_headers):
        """Test deleting unused inventory item should succeed"""
        # Create an item not used in any invoices
        unused_item = models.InventoryItem(
            name="Unused Item",
            weight_grams=5.0,
            purchase_price=1000.00,
            sell_price=1200.00,
            stock_quantity=5
        )
        db_session.add(unused_item)
        db_session.commit()
        db_session.refresh(unused_item)
        
        response = client.delete(f"/inventory/items/{unused_item.id}", headers=auth_headers)
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]
        
        # Verify deletion in database
        deleted_item = db_session.query(models.InventoryItem).filter(
            models.InventoryItem.id == unused_item.id
        ).first()
        assert deleted_item is None

class TestStockAlerts:
    """Test stock alert functionality"""
    
    def test_get_low_stock_alerts(self, db_session, auth_headers, test_category):
        """Test getting low stock alerts"""
        # Create items with low stock
        low_stock_item = models.InventoryItem(
            name="Low Stock Item",
            category_id=test_category.id,
            weight_grams=5.0,
            purchase_price=1000.00,
            sell_price=1200.00,
            stock_quantity=2,  # Below min_stock_level
            min_stock_level=5
        )
        db_session.add(low_stock_item)
        
        # Create item with normal stock
        normal_stock_item = models.InventoryItem(
            name="Normal Stock Item",
            category_id=test_category.id,
            weight_grams=5.0,
            purchase_price=1000.00,
            sell_price=1200.00,
            stock_quantity=10,  # Above min_stock_level
            min_stock_level=5
        )
        db_session.add(normal_stock_item)
        db_session.commit()
        
        response = client.get("/inventory/alerts/low-stock", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        
        # Find our low stock item
        low_stock_alert = next((alert for alert in data if alert["item_name"] == "Low Stock Item"), None)
        assert low_stock_alert is not None
        assert low_stock_alert["current_stock"] == 2
        assert low_stock_alert["min_stock_level"] == 5
        assert low_stock_alert["category_name"] == test_category.name
        
        # Normal stock item should not be in alerts
        normal_stock_alert = next((alert for alert in data if alert["item_name"] == "Normal Stock Item"), None)
        assert normal_stock_alert is None

class TestInventoryStats:
    """Test inventory statistics endpoint"""
    
    def test_get_inventory_stats(self, db_session, auth_headers, test_inventory_item, test_category):
        """Test getting inventory statistics"""
        # Create additional items for better stats
        low_stock_item = models.InventoryItem(
            name="Low Stock Stats Item",
            category_id=test_category.id,
            weight_grams=3.0,
            purchase_price=500.00,
            sell_price=600.00,
            stock_quantity=1,  # Low stock
            min_stock_level=5
        )
        db_session.add(low_stock_item)
        db_session.commit()
        
        response = client.get("/inventory/stats", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_items" in data
        assert "low_stock_items" in data
        assert "total_inventory_value" in data
        assert "total_categories" in data
        
        assert data["total_items"] >= 2  # At least our test items
        assert data["low_stock_items"] >= 1  # At least our low stock item
        assert data["total_inventory_value"] > 0
        assert data["total_categories"] >= 1

class TestAuthentication:
    """Test authentication requirements for inventory endpoints"""
    
    def test_create_category_without_auth(self, db_session):
        """Test creating category without authentication should fail"""
        category_data = {
            "name": "Unauthorized Category",
            "description": "Should fail"
        }
        
        response = client.post("/inventory/categories", json=category_data)
        assert response.status_code == 403
    
    def test_get_items_without_auth(self, db_session):
        """Test getting items without authentication should fail"""
        response = client.get("/inventory/items")
        assert response.status_code == 403
    
    def test_invalid_token(self, db_session):
        """Test using invalid token should fail"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/inventory/items", headers=headers)
        assert response.status_code == 401

if __name__ == "__main__":
    pytest.main([__file__, "-v"])