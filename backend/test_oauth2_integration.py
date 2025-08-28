"""
Comprehensive OAuth2 Integration Test
Tests the complete OAuth2 authentication system with all components
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import json
from datetime import datetime, timedelta

from main import app
from database import get_db, Base
from models import User, Role, OAuth2Token
from oauth2_config import get_oauth2_config
from oauth2_tokens import get_token_manager
from services.authentication_service import get_authentication_service
from auth import get_password_hash

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_oauth2.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def setup_database():
    """Set up test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    """Create a database session for testing"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def test_client():
    """Create a test client"""
    return TestClient(app)

@pytest.fixture
def test_user(db_session):
    """Create a test user with role and permissions"""
    # Create a test role with permissions
    role = Role(
        name="test_user",
        permissions={
            "view_inventory": True,
            "manage_inventory": True,
            "view_customers": True,
            "manage_customers": True,
            "view_reports": True,
            "manage_accounting": True,
            "view_settings": True,
            "send_sms": True
        }
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    
    # Create test user
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash=get_password_hash("testpassword"),
        role=role,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user

@pytest.fixture
def admin_user(db_session):
    """Create an admin user"""
    # Create admin role
    admin_role = Role(
        name="admin",
        permissions={
            "view_inventory": True,
            "manage_inventory": True,
            "view_customers": True,
            "manage_customers": True,
            "view_reports": True,
            "manage_accounting": True,
            "view_settings": True,
            "send_sms": True,
            "admin": True,
            "view_audit_logs": True,
            "view_security_analysis": True
        }
    )
    db_session.add(admin_role)
    db_session.commit()
    db_session.refresh(admin_role)
    
    # Create admin user
    admin = User(
        username="admin",
        email="admin@example.com",
        password_hash=get_password_hash("adminpassword"),
        role=admin_role,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    
    return admin

class TestOAuth2Authentication:
    """Test OAuth2 authentication functionality"""
    
    def test_login_success(self, test_client, test_user, setup_database):
        """Test successful login"""
        response = test_client.post("/api/oauth2/login", json={
            "username": "testuser",
            "password": "testpassword"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        assert "user" in data
        assert data["user"]["username"] == "testuser"
        assert data["user"]["email"] == "test@example.com"
    
    def test_login_invalid_credentials(self, test_client, test_user, setup_database):
        """Test login with invalid credentials"""
        response = test_client.post("/api/oauth2/login", json={
            "username": "testuser",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_login_inactive_user(self, test_client, db_session, setup_database):
        """Test login with inactive user"""
        # Create inactive user
        inactive_user = User(
            username="inactive",
            email="inactive@example.com",
            password_hash=get_password_hash("password"),
            is_active=False,
            created_at=datetime.utcnow()
        )
        db_session.add(inactive_user)
        db_session.commit()
        
        response = test_client.post("/api/oauth2/login", json={
            "username": "inactive",
            "password": "password"
        })
        
        assert response.status_code == 401
        assert "inactive" in response.json()["detail"].lower()
    
    def test_token_refresh(self, test_client, test_user, setup_database):
        """Test token refresh functionality"""
        # First login to get tokens
        login_response = test_client.post("/api/oauth2/login", json={
            "username": "testuser",
            "password": "testpassword"
        })
        
        assert login_response.status_code == 200
        tokens = login_response.json()
        refresh_token = tokens["refresh_token"]
        
        # Refresh tokens
        refresh_response = test_client.post("/api/oauth2/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert refresh_response.status_code == 200
        new_tokens = refresh_response.json()
        
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
        assert new_tokens["access_token"] != tokens["access_token"]  # Should be different
    
    def test_get_current_user_info(self, test_client, test_user, setup_database):
        """Test getting current user info"""
        # Login first
        login_response = test_client.post("/api/oauth2/login", json={
            "username": "testuser",
            "password": "testpassword"
        })
        
        tokens = login_response.json()
        access_token = tokens["access_token"]
        
        # Get user info
        response = test_client.get("/api/oauth2/me", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert response.status_code == 200
        user_info = response.json()
        
        assert user_info["username"] == "testuser"
        assert user_info["email"] == "test@example.com"
        assert user_info["is_active"] == True
        assert "permissions" in user_info
        assert len(user_info["permissions"]) > 0
    
    def test_logout(self, test_client, test_user, setup_database):
        """Test logout functionality"""
        # Login first
        login_response = test_client.post("/api/oauth2/login", json={
            "username": "testuser",
            "password": "testpassword"
        })
        
        tokens = login_response.json()
        access_token = tokens["access_token"]
        
        # Logout
        logout_response = test_client.post("/api/oauth2/logout", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert logout_response.status_code == 200
        assert "revoked_tokens" in logout_response.json()
        
        # Try to use the token after logout - should fail
        response = test_client.get("/api/oauth2/me", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert response.status_code == 401

class TestRouterAuthentication:
    """Test authentication integration with various routers"""
    
    def test_inventory_authentication(self, test_client, test_user, setup_database):
        """Test inventory endpoints require authentication"""
        # Try without authentication
        response = test_client.get("/inventory/categories")
        assert response.status_code == 401
        
        # Login and try again
        login_response = test_client.post("/api/oauth2/login", json={
            "username": "testuser",
            "password": "testpassword"
        })
        
        tokens = login_response.json()
        access_token = tokens["access_token"]
        
        # Try with authentication
        response = test_client.get("/inventory/categories", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        # Should work now (might be 200 or 404 depending on data)
        assert response.status_code in [200, 404]
    
    def test_customers_authentication(self, test_client, test_user, setup_database):
        """Test customers endpoints require authentication"""
        # Try without authentication
        response = test_client.get("/customers/")
        assert response.status_code == 401
        
        # Login and try again
        login_response = test_client.post("/api/oauth2/login", json={
            "username": "testuser",
            "password": "testpassword"
        })
        
        tokens = login_response.json()
        access_token = tokens["access_token"]
        
        # Try with authentication
        response = test_client.get("/customers/", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        # Should work now
        assert response.status_code == 200
    
    def test_reports_authentication(self, test_client, test_user, setup_database):
        """Test reports endpoints require authentication"""
        # Try without authentication
        response = test_client.get("/reports/sales/trends")
        assert response.status_code == 401
        
        # Login and try again
        login_response = test_client.post("/api/oauth2/login", json={
            "username": "testuser",
            "password": "testpassword"
        })
        
        tokens = login_response.json()
        access_token = tokens["access_token"]
        
        # Try with authentication
        response = test_client.get("/reports/sales/trends", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        # Should work now (might return empty data)
        assert response.status_code == 200

class TestPermissionSystem:
    """Test permission-based access control"""
    
    def test_permission_required_endpoints(self, test_client, db_session, setup_database):
        """Test endpoints that require specific permissions"""
        # Create user without inventory permissions
        limited_role = Role(
            name="limited_user",
            permissions={
                "view_customers": True,
                "view_reports": True
            }
        )
        db_session.add(limited_role)
        db_session.commit()
        
        limited_user = User(
            username="limited",
            email="limited@example.com",
            password_hash=get_password_hash("password"),
            role=limited_role,
            is_active=True,
            created_at=datetime.utcnow()
        )
        db_session.add(limited_user)
        db_session.commit()
        
        # Login with limited user
        login_response = test_client.post("/api/oauth2/login", json={
            "username": "limited",
            "password": "password"
        })
        
        tokens = login_response.json()
        access_token = tokens["access_token"]
        
        # Try to create inventory category (should fail)
        response = test_client.post("/inventory/categories", 
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "name": "Test Category",
                "description": "Test Description"
            }
        )
        
        assert response.status_code == 403
        assert "permission" in response.json()["detail"].lower()
    
    def test_admin_endpoints(self, test_client, admin_user, setup_database):
        """Test admin-only endpoints"""
        # Login as admin
        login_response = test_client.post("/api/oauth2/login", json={
            "username": "admin",
            "password": "adminpassword"
        })
        
        tokens = login_response.json()
        access_token = tokens["access_token"]
        
        # Try admin endpoint
        response = test_client.get("/api/oauth2/stats", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert response.status_code == 200
        stats = response.json()
        assert "users" in stats
        assert "tokens" in stats

class TestTokenManagement:
    """Test token management functionality"""
    
    def test_user_sessions(self, test_client, test_user, setup_database):
        """Test user session management"""
        # Login to create session
        login_response = test_client.post("/api/oauth2/login", json={
            "username": "testuser",
            "password": "testpassword"
        })
        
        tokens = login_response.json()
        access_token = tokens["access_token"]
        
        # Get user sessions
        response = test_client.get("/api/oauth2/sessions", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert response.status_code == 200
        sessions = response.json()
        assert "active_sessions" in sessions
        assert sessions["active_sessions"] > 0
    
    def test_oauth2_health_check(self, test_client, setup_database):
        """Test OAuth2 health check endpoint"""
        response = test_client.get("/api/oauth2/health")
        
        assert response.status_code == 200
        health = response.json()
        assert health["status"] == "healthy"
        assert "provider" in health
        assert "system_info" in health

class TestSecurityFeatures:
    """Test security features"""
    
    def test_invalid_token(self, test_client, setup_database):
        """Test behavior with invalid token"""
        response = test_client.get("/api/oauth2/me", headers={
            "Authorization": "Bearer invalid_token"
        })
        
        assert response.status_code == 401
    
    def test_expired_token_handling(self, test_client, test_user, setup_database):
        """Test expired token handling"""
        # This would require mocking time or creating expired tokens
        # For now, just test that the system handles malformed tokens
        response = test_client.get("/api/oauth2/me", headers={
            "Authorization": "Bearer malformed.token.here"
        })
        
        assert response.status_code == 401
    
    def test_missing_authorization_header(self, test_client, setup_database):
        """Test missing authorization header"""
        response = test_client.get("/api/oauth2/me")
        
        assert response.status_code == 401

if __name__ == "__main__":
    pytest.main([__file__, "-v"])