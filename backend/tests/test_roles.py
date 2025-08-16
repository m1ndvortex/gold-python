"""
Unit tests for role management system
Tests run in Docker environment with real PostgreSQL database
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import get_db, Base
from main import app
import models
from auth import get_password_hash
import os

# Test database URL - uses real PostgreSQL in Docker
TEST_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")

# Create test engine and session
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def setup_database():
    """Set up test database with tables"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(setup_database):
    """Create a fresh database session for each test"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        # Clean up test data
        db.query(models.User).delete()
        db.query(models.Role).delete()
        db.commit()
        db.close()

@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def admin_role(db_session):
    """Create admin role with manage_roles permission"""
    role = models.Role(
        id=uuid.uuid4(),
        name="TestAdmin",
        description="Test administrator role with all permissions",
        permissions={
            "view_dashboard": True,
            "manage_roles": True,
            "manage_users": True,
            "view_inventory": True,
            "edit_inventory": True
        }
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role

@pytest.fixture
def regular_role(db_session):
    """Create regular role without manage_roles permission"""
    role = models.Role(
        id=uuid.uuid4(),
        name="TestRegular",
        description="Test regular user role",
        permissions={
            "view_dashboard": True,
            "view_inventory": True,
            "edit_inventory": False
        }
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role

@pytest.fixture
def admin_user(db_session, admin_role):
    """Create admin user with manage_roles permission"""
    user = models.User(
        id=uuid.uuid4(),
        username="testadmin",
        email="testadmin@example.com",
        password_hash=get_password_hash("adminpassword"),
        role_id=admin_role.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def regular_user(db_session, regular_role):
    """Create regular user without manage_roles permission"""
    user = models.User(
        id=uuid.uuid4(),
        username="testregular",
        email="testregular@example.com",
        password_hash=get_password_hash("regularpassword"),
        role_id=regular_role.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def admin_token(client, admin_user):
    """Get authentication token for admin user"""
    login_data = {
        "username": admin_user.username,
        "password": "adminpassword"
    }
    
    response = client.post("/auth/login", json=login_data)
    return response.json()["access_token"]

@pytest.fixture
def regular_token(client, regular_user):
    """Get authentication token for regular user"""
    login_data = {
        "username": regular_user.username,
        "password": "regularpassword"
    }
    
    response = client.post("/auth/login", json=login_data)
    return response.json()["access_token"]

class TestRoleCreation:
    """Test role creation functionality"""
    
    def test_create_role_success(self, client, admin_token):
        """Test successful role creation by admin"""
        role_data = {
            "name": "NewRole",
            "description": "A new test role",
            "permissions": {
                "view_dashboard": True,
                "view_inventory": True,
                "edit_inventory": False
            }
        }
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.post("/roles/", json=role_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == role_data["name"]
        assert data["description"] == role_data["description"]
        assert data["permissions"] == role_data["permissions"]
        assert "id" in data
        assert "created_at" in data
    
    def test_create_role_duplicate_name(self, client, admin_token, admin_role):
        """Test creating role with duplicate name"""
        role_data = {
            "name": admin_role.name,  # Duplicate name
            "description": "Duplicate role",
            "permissions": {"view_dashboard": True}
        }
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.post("/roles/", json=role_data, headers=headers)
        
        assert response.status_code == 400
        assert "Role name already exists" in response.json()["detail"]
    
    def test_create_role_without_permission(self, client, regular_token):
        """Test creating role without manage_roles permission"""
        role_data = {
            "name": "UnauthorizedRole",
            "description": "Should not be created",
            "permissions": {"view_dashboard": True}
        }
        
        headers = {"Authorization": f"Bearer {regular_token}"}
        response = client.post("/roles/", json=role_data, headers=headers)
        
        assert response.status_code == 403
        assert "Permission 'manage_roles' required" in response.json()["detail"]
    
    def test_create_role_without_authentication(self, client):
        """Test creating role without authentication"""
        role_data = {
            "name": "UnauthenticatedRole",
            "description": "Should not be created",
            "permissions": {"view_dashboard": True}
        }
        
        response = client.post("/roles/", json=role_data)
        assert response.status_code == 403

class TestRoleRetrieval:
    """Test role retrieval functionality"""
    
    def test_get_all_roles(self, client, regular_token, admin_role, regular_role):
        """Test getting all roles"""
        headers = {"Authorization": f"Bearer {regular_token}"}
        response = client.get("/roles/", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # At least admin and regular roles
        
        role_names = [role["name"] for role in data]
        assert admin_role.name in role_names
        assert regular_role.name in role_names
    
    def test_get_role_by_id(self, client, regular_token, admin_role):
        """Test getting specific role by ID"""
        headers = {"Authorization": f"Bearer {regular_token}"}
        response = client.get(f"/roles/{admin_role.id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(admin_role.id)
        assert data["name"] == admin_role.name
        assert data["description"] == admin_role.description
        assert data["permissions"] == admin_role.permissions
    
    def test_get_nonexistent_role(self, client, regular_token):
        """Test getting non-existent role"""
        fake_id = str(uuid.uuid4())
        headers = {"Authorization": f"Bearer {regular_token}"}
        response = client.get(f"/roles/{fake_id}", headers=headers)
        
        assert response.status_code == 404
        assert "Role not found" in response.json()["detail"]
    
    def test_get_roles_without_authentication(self, client):
        """Test getting roles without authentication"""
        response = client.get("/roles/")
        assert response.status_code == 403

class TestRoleUpdate:
    """Test role update functionality"""
    
    def test_update_role_success(self, client, admin_token, regular_role):
        """Test successful role update by admin"""
        update_data = {
            "name": "UpdatedRole",
            "description": "Updated description",
            "permissions": {
                "view_dashboard": True,
                "view_inventory": True,
                "edit_inventory": True  # Changed from False to True
            }
        }
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.put(f"/roles/{regular_role.id}", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["permissions"] == update_data["permissions"]
    
    def test_update_role_duplicate_name(self, client, admin_token, admin_role, regular_role):
        """Test updating role with duplicate name"""
        update_data = {
            "name": admin_role.name,  # Duplicate name
            "description": "Updated description",
            "permissions": {"view_dashboard": True}
        }
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.put(f"/roles/{regular_role.id}", json=update_data, headers=headers)
        
        assert response.status_code == 400
        assert "Role name already exists" in response.json()["detail"]
    
    def test_update_nonexistent_role(self, client, admin_token):
        """Test updating non-existent role"""
        fake_id = str(uuid.uuid4())
        update_data = {
            "name": "NonExistentRole",
            "description": "Should not work",
            "permissions": {"view_dashboard": True}
        }
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.put(f"/roles/{fake_id}", json=update_data, headers=headers)
        
        assert response.status_code == 404
        assert "Role not found" in response.json()["detail"]
    
    def test_update_role_without_permission(self, client, regular_token, regular_role):
        """Test updating role without manage_roles permission"""
        update_data = {
            "name": "UnauthorizedUpdate",
            "description": "Should not work",
            "permissions": {"view_dashboard": True}
        }
        
        headers = {"Authorization": f"Bearer {regular_token}"}
        response = client.put(f"/roles/{regular_role.id}", json=update_data, headers=headers)
        
        assert response.status_code == 403
        assert "Permission 'manage_roles' required" in response.json()["detail"]

class TestRoleDeletion:
    """Test role deletion functionality"""
    
    def test_delete_role_success(self, client, admin_token, db_session):
        """Test successful role deletion"""
        # Create a role to delete
        role_to_delete = models.Role(
            id=uuid.uuid4(),
            name="ToDelete",
            description="Role to be deleted",
            permissions={"view_dashboard": True}
        )
        db_session.add(role_to_delete)
        db_session.commit()
        db_session.refresh(role_to_delete)
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.delete(f"/roles/{role_to_delete.id}", headers=headers)
        
        assert response.status_code == 200
        assert "Role deleted successfully" in response.json()["message"]
        
        # Verify role was deleted from database
        deleted_role = db_session.query(models.Role).filter(models.Role.id == role_to_delete.id).first()
        assert deleted_role is None
    
    def test_delete_role_with_assigned_users(self, client, admin_token, regular_role, regular_user):
        """Test deleting role that has users assigned to it"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.delete(f"/roles/{regular_role.id}", headers=headers)
        
        assert response.status_code == 400
        assert "Cannot delete role" in response.json()["detail"]
        assert "users are assigned to this role" in response.json()["detail"]
    
    def test_delete_nonexistent_role(self, client, admin_token):
        """Test deleting non-existent role"""
        fake_id = str(uuid.uuid4())
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.delete(f"/roles/{fake_id}", headers=headers)
        
        assert response.status_code == 404
        assert "Role not found" in response.json()["detail"]
    
    def test_delete_role_without_permission(self, client, regular_token, db_session):
        """Test deleting role without manage_roles permission"""
        # Create a role to attempt deletion
        role_to_delete = models.Role(
            id=uuid.uuid4(),
            name="UnauthorizedDelete",
            description="Should not be deleted",
            permissions={"view_dashboard": True}
        )
        db_session.add(role_to_delete)
        db_session.commit()
        
        headers = {"Authorization": f"Bearer {regular_token}"}
        response = client.delete(f"/roles/{role_to_delete.id}", headers=headers)
        
        assert response.status_code == 403
        assert "Permission 'manage_roles' required" in response.json()["detail"]

class TestAvailablePermissions:
    """Test available permissions endpoint"""
    
    def test_get_available_permissions(self, client, regular_token):
        """Test getting list of available permissions"""
        headers = {"Authorization": f"Bearer {regular_token}"}
        response = client.get("/roles/permissions/available", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "permissions" in data
        
        permissions = data["permissions"]
        expected_permissions = [
            "view_dashboard", "view_inventory", "edit_inventory",
            "view_customers", "edit_customers", "view_invoices",
            "create_invoices", "edit_invoices", "view_accounting",
            "edit_accounting", "view_reports", "send_sms",
            "manage_settings", "manage_roles", "manage_users"
        ]
        
        for permission in expected_permissions:
            assert permission in permissions
            assert isinstance(permissions[permission], str)  # Description should be string
    
    def test_get_available_permissions_without_authentication(self, client):
        """Test getting available permissions without authentication"""
        response = client.get("/roles/permissions/available")
        assert response.status_code == 403

if __name__ == "__main__":
    pytest.main([__file__, "-v"])