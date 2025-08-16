"""
Unit tests for JWT authentication system
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
from auth import get_password_hash, verify_password, create_access_token, verify_token
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
def test_role(db_session):
    """Create a test role"""
    role = models.Role(
        id=uuid.uuid4(),
        name="TestRole",
        description="Test role for authentication tests",
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
def test_user(db_session, test_role):
    """Create a test user"""
    user = models.User(
        id=uuid.uuid4(),
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

class TestPasswordHashing:
    """Test password hashing functionality"""
    
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        # Hash should be different from original password
        assert hashed != password
        
        # Should be able to verify correct password
        assert verify_password(password, hashed) is True
        
        # Should not verify incorrect password
        assert verify_password("wrongpassword", hashed) is False

class TestJWTTokens:
    """Test JWT token functionality"""
    
    def test_create_and_verify_token(self):
        """Test JWT token creation and verification"""
        user_id = str(uuid.uuid4())
        username = "testuser"
        
        # Create token
        token = create_access_token(data={"sub": user_id, "username": username})
        assert token is not None
        
        # Verify token
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["username"] == username
        assert "exp" in payload
    
    def test_invalid_token_verification(self):
        """Test verification of invalid tokens"""
        # Test with invalid token
        invalid_token = "invalid.token.here"
        payload = verify_token(invalid_token)
        assert payload is None
        
        # Test with empty token
        payload = verify_token("")
        assert payload is None

class TestAuthenticationEndpoints:
    """Test authentication API endpoints"""
    
    def test_user_registration_success(self, client, db_session, test_role):
        """Test successful user registration"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpassword123",
            "role_id": str(test_role.id)
        }
        
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["username"] == user_data["username"]
        assert data["email"] == user_data["email"]
        assert data["is_active"] is True
        assert "password" not in data  # Password should not be returned
        
        # Verify user was created in database
        db_user = db_session.query(models.User).filter(models.User.username == "newuser").first()
        assert db_user is not None
        assert db_user.email == user_data["email"]
    
    def test_user_registration_duplicate_username(self, client, test_user):
        """Test registration with duplicate username"""
        user_data = {
            "username": test_user.username,  # Duplicate username
            "email": "different@example.com",
            "password": "password123"
        }
        
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 400
        assert "Username already registered" in response.json()["detail"]
    
    def test_user_registration_duplicate_email(self, client, test_user):
        """Test registration with duplicate email"""
        user_data = {
            "username": "differentuser",
            "email": test_user.email,  # Duplicate email
            "password": "password123"
        }
        
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]
    
    def test_user_registration_invalid_role(self, client):
        """Test registration with invalid role ID"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123",
            "role_id": str(uuid.uuid4())  # Non-existent role ID
        }
        
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 400
        assert "Invalid role ID" in response.json()["detail"]
    
    def test_user_login_success(self, client, test_user):
        """Test successful user login"""
        login_data = {
            "username": test_user.username,
            "password": "testpassword"
        }
        
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        
        # Verify token is valid
        token = data["access_token"]
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == str(test_user.id)
    
    def test_user_login_invalid_credentials(self, client, test_user):
        """Test login with invalid credentials"""
        login_data = {
            "username": test_user.username,
            "password": "wrongpassword"
        }
        
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
    
    def test_user_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        login_data = {
            "username": "nonexistent",
            "password": "password123"
        }
        
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
    
    def test_user_login_inactive_user(self, client, db_session, test_user):
        """Test login with inactive user"""
        # Deactivate user
        test_user.is_active = False
        db_session.commit()
        
        login_data = {
            "username": test_user.username,
            "password": "testpassword"
        }
        
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 400
        assert "Inactive user" in response.json()["detail"]
    
    def test_token_refresh_success(self, client, test_user):
        """Test successful token refresh"""
        # First login to get a token
        login_data = {
            "username": test_user.username,
            "password": "testpassword"
        }
        
        login_response = client.post("/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Use token to refresh
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/auth/refresh", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        
        # New token should be valid (we don't check if it's different since 
        # tokens might be identical if created at the same second)
        new_token = data["access_token"]
        new_payload = verify_token(new_token)
        assert new_payload is not None
        assert new_payload["sub"] == str(test_user.id)
    
    def test_token_refresh_invalid_token(self, client):
        """Test token refresh with invalid token"""
        headers = {"Authorization": "Bearer invalid.token.here"}
        response = client.post("/auth/refresh", headers=headers)
        
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]
    
    def test_get_current_user_info(self, client, test_user):
        """Test getting current user information"""
        # Login to get token
        login_data = {
            "username": test_user.username,
            "password": "testpassword"
        }
        
        login_response = client.post("/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Get user info
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert data["is_active"] is True
        assert "role" in data
    
    def test_verify_token_endpoint(self, client, test_user):
        """Test token verification endpoint"""
        # Login to get token
        login_data = {
            "username": test_user.username,
            "password": "testpassword"
        }
        
        login_response = client.post("/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Verify token
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/verify", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["user_id"] == str(test_user.id)
        assert data["username"] == test_user.username
        assert data["is_active"] is True
    
    def test_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without token"""
        response = client.get("/auth/me")
        assert response.status_code == 403  # FastAPI returns 403 for missing auth
    
    def test_protected_endpoint_with_invalid_token(self, client):
        """Test accessing protected endpoint with invalid token"""
        headers = {"Authorization": "Bearer invalid.token.here"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 401

class TestRoleBasedPermissions:
    """Test role-based permission system"""
    
    def test_user_permissions_from_role(self, db_session, test_user, test_role):
        """Test getting user permissions from role"""
        from auth import get_user_permissions
        
        permissions = get_user_permissions(test_user)
        assert "view_dashboard" in permissions
        assert "view_inventory" in permissions
        assert "edit_inventory" not in permissions  # This permission is False in test role
    
    def test_user_without_role_permissions(self, db_session):
        """Test user without role has no permissions"""
        from auth import get_user_permissions
        
        user = models.User(
            id=uuid.uuid4(),
            username="noroleuser",
            email="norole@example.com",
            password_hash=get_password_hash("password"),
            role_id=None,
            is_active=True
        )
        
        permissions = get_user_permissions(user)
        assert permissions == []

if __name__ == "__main__":
    pytest.main([__file__, "-v"])