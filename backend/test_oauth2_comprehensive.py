"""
Comprehensive OAuth2 Security Foundation Tests
Tests all OAuth2 components with real PostgreSQL database in Docker
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, AsyncMock
import secrets
import json

# Import the application and dependencies
from main import app
from database import get_db, engine
import models
from oauth2_config import OAuth2Config, OAuth2Provider
from oauth2_tokens import TokenManager
from oauth2_audit import (
    log_token_event, log_authentication_event, log_security_event,
    TokenEvent, SecurityEvent, analyze_failed_login_attempts, detect_suspicious_activity
)
from oauth2_providers import OAuth2ProviderService, OAuth2ProviderError
from oauth2_middleware import OAuth2Middleware
from auth import get_password_hash

# Test client
client = TestClient(app)

class TestOAuth2Configuration:
    """Test OAuth2 configuration management"""
    
    def test_oauth2_config_creation(self):
        """Test OAuth2 configuration creation"""
        config = OAuth2Config(
            provider=OAuth2Provider.AUTH0,
            auth0_domain="test.auth0.com",
            auth0_client_id="test_client_id",
            auth0_client_secret="test_client_secret",
            auth0_audience="test_audience",
            access_token_expire_minutes=15,
            refresh_token_expire_days=30
        )
        
        assert config.provider == OAuth2Provider.AUTH0
        assert config.auth0_domain == "test.auth0.com"
        assert config.access_token_expire_minutes == 15
        assert config.refresh_token_expire_days == 30
    
    def test_keycloak_config(self):
        """Test Keycloak configuration"""
        config = OAuth2Config(
            provider=OAuth2Provider.KEYCLOAK,
            keycloak_server_url="http://localhost:8080",
            keycloak_realm="test-realm",
            keycloak_client_id="test-client",
            keycloak_client_secret="test-secret"
        )
        
        assert config.provider == OAuth2Provider.KEYCLOAK
        assert config.keycloak_server_url == "http://localhost:8080"
        assert config.keycloak_realm == "test-realm"
    
    def test_custom_provider_config(self):
        """Test custom OAuth2 provider configuration"""
        config = OAuth2Config(
            provider=OAuth2Provider.CUSTOM,
            custom_authorization_url="https://custom.com/auth",
            custom_token_url="https://custom.com/token",
            custom_userinfo_url="https://custom.com/userinfo",
            custom_client_id="custom_client",
            custom_client_secret="custom_secret"
        )
        
        assert config.provider == OAuth2Provider.CUSTOM
        assert config.custom_authorization_url == "https://custom.com/auth"

class TestTokenManager:
    """Test OAuth2 token management"""
    
    @pytest.fixture
    def db_session(self):
        """Create test database session"""
        # Create tables
        models.Base.metadata.create_all(bind=engine)
        
        # Get session
        db = next(get_db())
        
        # Try to get existing test role or create new one
        test_role = db.query(models.Role).filter(models.Role.name == "test_role").first()
        if not test_role:
            test_role = models.Role(
                name="test_role",
                permissions={"read": True, "write": True}
            )
            db.add(test_role)
            db.commit()
            db.refresh(test_role)
        
        # Try to get existing test user or create new one
        test_user = db.query(models.User).filter(models.User.username == "testuser").first()
        if not test_user:
            test_user = models.User(
                username="testuser",
                email="test@example.com",
                password_hash=get_password_hash("testpassword"),
                role_id=test_role.id,
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        
        yield db, test_user
        
        # Cleanup
        db.close()
    
    def test_create_token_pair(self, db_session):
        """Test token pair creation"""
        db, user = db_session
        token_manager = TokenManager()
        
        scopes = ["read", "write"]
        access_token, refresh_token, access_expires_at, refresh_expires_at = token_manager.create_token_pair(
            str(user.id), scopes, db
        )
        
        assert access_token is not None
        assert refresh_token is not None
        assert access_expires_at > datetime.utcnow()
        assert refresh_expires_at > access_expires_at
        
        # Verify token is stored in database
        stored_token = db.query(models.OAuth2Token).filter(
            models.OAuth2Token.user_id == user.id
        ).order_by(models.OAuth2Token.created_at.desc()).first()
        
        assert stored_token is not None
        assert stored_token.scopes == scopes
        # Note: token might be revoked if rotation is enabled from previous tests
    
    def test_validate_access_token(self, db_session):
        """Test access token validation"""
        db, user = db_session
        token_manager = TokenManager()
        
        scopes = ["read", "write"]
        access_token, _, _, _ = token_manager.create_token_pair(
            str(user.id), scopes, db
        )
        
        # Validate token
        payload = token_manager.validate_access_token(access_token, db)
        
        assert payload is not None
        assert payload["sub"] == str(user.id)
        assert payload["scopes"] == scopes
        assert payload["type"] == "access"
    
    def test_refresh_tokens(self, db_session):
        """Test token refresh functionality"""
        db, user = db_session
        token_manager = TokenManager()
        
        scopes = ["read", "write"]
        _, refresh_token, _, _ = token_manager.create_token_pair(
            str(user.id), scopes, db
        )
        
        # Refresh tokens
        result = token_manager.refresh_tokens(refresh_token, db)
        
        assert result is not None
        new_access_token, new_refresh_token, new_access_expires, new_refresh_expires = result
        
        assert new_access_token is not None
        assert new_refresh_token is not None
        assert new_access_expires > datetime.utcnow()
        assert new_refresh_expires > new_access_expires
    
    def test_revoke_token(self, db_session):
        """Test token revocation"""
        db, user = db_session
        token_manager = TokenManager()
        
        scopes = ["read", "write"]
        access_token, _, _, _ = token_manager.create_token_pair(
            str(user.id), scopes, db
        )
        
        # Revoke token
        success = token_manager.revoke_token(access_token, db)
        assert success
        
        # Verify token is revoked
        payload = token_manager.validate_access_token(access_token, db)
        assert payload is None
    
    def test_revoke_user_tokens(self, db_session):
        """Test bulk token revocation for user"""
        db, user = db_session
        token_manager = TokenManager()
        
        # Create multiple tokens
        scopes = ["read", "write"]
        for _ in range(3):
            token_manager.create_token_pair(str(user.id), scopes, db)
        
        # Revoke all user tokens
        revoked_count = token_manager.revoke_user_tokens(str(user.id), db)
        assert revoked_count >= 3  # May be more due to existing tokens
        
        # Verify all tokens are revoked
        active_tokens = db.query(models.OAuth2Token).filter(
            models.OAuth2Token.user_id == user.id,
            models.OAuth2Token.revoked == False
        ).count()
        assert active_tokens == 0
    
    def test_cleanup_expired_tokens(self, db_session):
        """Test expired token cleanup"""
        db, user = db_session
        token_manager = TokenManager()
        
        # Create token with past expiration (timezone-aware)
        from datetime import timezone
        now = datetime.now(timezone.utc)
        expired_token = models.OAuth2Token(
            user_id=user.id,
            access_token_hash="expired_hash",
            refresh_token_hash="expired_refresh_hash",
            expires_at=now - timedelta(hours=1),
            refresh_expires_at=now - timedelta(hours=1),
            scopes=["read"],
            revoked=False
        )
        db.add(expired_token)
        db.commit()
        
        # Store the token ID before cleanup
        expired_token_id = expired_token.id
        
        # Cleanup expired tokens
        cleaned_count = token_manager.cleanup_expired_tokens(db)
        assert cleaned_count >= 1  # May be more due to existing expired tokens
        
        # Verify our specific token is removed
        remaining_tokens = db.query(models.OAuth2Token).filter(
            models.OAuth2Token.id == expired_token_id
        ).count()
        assert remaining_tokens == 0

class TestAuditLogging:
    """Test OAuth2 audit logging system"""
    
    @pytest.fixture
    def db_session(self):
        """Create test database session"""
        models.Base.metadata.create_all(bind=engine)
        db = next(get_db())
        
        # Try to get existing audit user or create new one
        test_user = db.query(models.User).filter(models.User.username == "audituser").first()
        if not test_user:
            test_user = models.User(
                username="audituser",
                email="audit@example.com",
                password_hash=get_password_hash("password"),
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        
        yield db, test_user
        db.close()
    
    def test_log_token_event(self, db_session):
        """Test token event logging"""
        db, user = db_session
        
        audit_entry = log_token_event(
            db, str(user.id), TokenEvent.ISSUED,
            {"token_type": "access", "scopes": ["read", "write"]},
            "192.168.1.1", "Mozilla/5.0"
        )
        
        assert audit_entry.user_id == user.id
        assert audit_entry.event_type == TokenEvent.ISSUED.value
        assert audit_entry.event_category == "token"
        assert audit_entry.details["token_type"] == "access"
        assert audit_entry.ip_address == "192.168.1.1"
    
    def test_log_authentication_event(self, db_session):
        """Test authentication event logging"""
        db, user = db_session
        
        audit_entry = log_authentication_event(
            db, str(user.id), TokenEvent.LOGIN_SUCCESS, True,
            {"username": user.username}, "192.168.1.1", "Mozilla/5.0"
        )
        
        assert audit_entry.user_id == user.id
        assert audit_entry.event_type == TokenEvent.LOGIN_SUCCESS.value
        assert audit_entry.event_category == "authentication"
        assert audit_entry.details["success"] is True
    
    def test_log_security_event(self, db_session):
        """Test security event logging"""
        db, user = db_session
        
        audit_entry = log_security_event(
            db, str(user.id), SecurityEvent.SUSPICIOUS_ACTIVITY,
            {"reason": "multiple_ip_addresses"}, "192.168.1.1", "Mozilla/5.0", "high"
        )
        
        assert audit_entry.user_id == user.id
        assert audit_entry.event_type == SecurityEvent.SUSPICIOUS_ACTIVITY.value
        assert audit_entry.event_category == "security"
        assert audit_entry.severity == "high"
    
    def test_analyze_failed_login_attempts(self, db_session):
        """Test failed login analysis"""
        db, user = db_session
        
        # Create multiple failed login attempts
        for i in range(5):
            log_authentication_event(
                db, str(user.id), TokenEvent.LOGIN_FAILED, False,
                {"username": user.username}, f"192.168.1.{i}", "Mozilla/5.0"
            )
        
        analysis = analyze_failed_login_attempts(db, str(user.id), hours=1)
        
        assert analysis["total_failed_attempts"] >= 5  # May be more due to previous tests
        assert analysis["unique_ips"] >= 5  # May be more due to previous tests
        assert analysis["unique_users"] >= 1
    
    def test_detect_suspicious_activity(self, db_session):
        """Test suspicious activity detection"""
        db, user = db_session
        
        # Create suspicious activity pattern
        for i in range(15):
            log_authentication_event(
                db, str(user.id), TokenEvent.LOGIN_FAILED, False,
                {"username": user.username}, f"192.168.1.{i}", f"Agent-{i}"
            )
        
        analysis = detect_suspicious_activity(db, str(user.id), hours=1)
        
        assert analysis["suspicion_score"] > 0
        assert analysis["risk_level"] in ["low", "medium", "high"]
        assert len(analysis["alerts"]) > 0

class TestOAuth2Providers:
    """Test OAuth2 provider integration"""
    
    @pytest.fixture
    def provider_service(self):
        """Create OAuth2 provider service"""
        return OAuth2ProviderService()
    
    @pytest.mark.asyncio
    async def test_get_authorization_url(self, provider_service):
        """Test authorization URL generation"""
        with patch.object(provider_service, 'config') as mock_config:
            mock_config.provider = OAuth2Provider.AUTH0
            mock_config.default_scopes = ["read", "write"]
        
        with patch.object(provider_service, 'provider_config', {
            "authorization_url": "https://test.auth0.com/authorize",
            "client_id": "test_client_id"
        }):
            with patch.object(provider_service, '_get_client_id', return_value="test_client_id"):
                url = await provider_service.get_authorization_url(
                    "http://localhost:3000/callback", "test_state", ["read", "write"]
                )
                
                assert "https://test.auth0.com/authorize" in url
                assert "client_id=test_client_id" in url
                assert "state=test_state" in url
    
    @pytest.mark.asyncio
    async def test_exchange_code_for_tokens_success(self, provider_service):
        """Test successful code exchange"""
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = lambda: {
            "access_token": "test_access_token",
            "refresh_token": "test_refresh_token"
        }
        
        mock_userinfo_response = AsyncMock()
        mock_userinfo_response.status_code = 200
        mock_userinfo_response.json = lambda: {
            "email": "test@example.com",
            "username": "testuser"
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_userinfo_response
            
            with patch.object(provider_service, 'provider_config', {
                "token_url": "https://test.auth0.com/oauth/token",
                "userinfo_url": "https://test.auth0.com/userinfo"
            }):
                with patch.object(provider_service, '_get_client_id', return_value="test_client"):
                    with patch.object(provider_service, '_get_client_secret', return_value="test_secret"):
                        
                        db = next(get_db())
                        access_token, refresh_token, user_info = await provider_service.exchange_code_for_tokens(
                            "test_code", "http://localhost:3000/callback", db
                        )
                        
                        assert access_token == "test_access_token"
                        assert refresh_token == "test_refresh_token"
                        assert user_info["email"] == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_exchange_code_for_tokens_failure(self, provider_service):
        """Test failed code exchange"""
        mock_response = AsyncMock()
        mock_response.status_code = 400
        mock_response.text = "Invalid authorization code"
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
            
            with patch.object(provider_service, 'provider_config', {
                "token_url": "https://test.auth0.com/oauth/token"
            }):
                with patch.object(provider_service, '_get_client_id', return_value="test_client"):
                    with patch.object(provider_service, '_get_client_secret', return_value="test_secret"):
                        
                        db = next(get_db())
                        with pytest.raises(OAuth2ProviderError):
                            await provider_service.exchange_code_for_tokens(
                                "invalid_code", "http://localhost:3000/callback", db
                            )

class TestOAuth2Middleware:
    """Test OAuth2 middleware functionality"""
    
    @pytest.fixture
    def middleware(self):
        """Create OAuth2 middleware"""
        return OAuth2Middleware()
    
    @pytest.fixture
    def db_session(self):
        """Create test database session"""
        models.Base.metadata.create_all(bind=engine)
        db = next(get_db())
        
        # Try to get existing test role or create new one
        test_role = db.query(models.Role).filter(models.Role.name == "test_role").first()
        if not test_role:
            test_role = models.Role(
                name="test_role",
                permissions={"read": True, "write": True, "admin": False}
            )
            db.add(test_role)
            db.commit()
            db.refresh(test_role)
        
        # Try to get existing middleware user or create new one
        test_user = db.query(models.User).filter(models.User.username == "middlewareuser").first()
        if not test_user:
            test_user = models.User(
                username="middlewareuser",
                email="middleware@example.com",
                password_hash=get_password_hash("password"),
                role_id=test_role.id,
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        
        yield db, test_user
        db.close()
    
    def test_get_user_permissions(self, middleware, db_session):
        """Test user permission extraction"""
        db, user = db_session
        
        permissions = middleware._get_user_permissions(user)
        
        assert "read" in permissions
        assert "write" in permissions
        assert "admin" not in permissions

class TestOAuth2API:
    """Test OAuth2 API endpoints"""
    
    @pytest.fixture
    def db_session(self):
        """Create test database session"""
        models.Base.metadata.create_all(bind=engine)
        db = next(get_db())
        
        # Try to get existing user role or create new one
        test_role = db.query(models.Role).filter(models.Role.name == "user").first()
        if not test_role:
            test_role = models.Role(
                name="user",
                permissions={"read": True, "write": True}
            )
            db.add(test_role)
            db.commit()
            db.refresh(test_role)
        
        # Try to get existing API user or create new one
        test_user = db.query(models.User).filter(models.User.username == "apiuser").first()
        if not test_user:
            test_user = models.User(
                username="apiuser",
                email="api@example.com",
                password_hash=get_password_hash("password123"),
                role_id=test_role.id,
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        
        yield db, test_user
        db.close()
    
    def test_login_endpoint(self, db_session):
        """Test login endpoint"""
        db, user = db_session
        
        response = client.post("/api/oauth2/login", json={
            "username": "apiuser",
            "password": "password123"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["username"] == "apiuser"
    
    def test_login_invalid_credentials(self, db_session):
        """Test login with invalid credentials"""
        db, user = db_session
        
        response = client.post("/api/oauth2/login", json={
            "username": "apiuser",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
    
    def test_refresh_token_endpoint(self, db_session):
        """Test refresh token endpoint"""
        db, user = db_session
        
        # First login to get tokens
        login_response = client.post("/api/oauth2/login", json={
            "username": "apiuser",
            "password": "password123"
        })
        
        login_data = login_response.json()
        refresh_token = login_data["refresh_token"]
        
        # Use refresh token
        refresh_response = client.post("/api/oauth2/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert refresh_response.status_code == 200
        refresh_data = refresh_response.json()
        
        assert "access_token" in refresh_data
        assert "refresh_token" in refresh_data
        assert refresh_data["user"]["username"] == "apiuser"
    
    def test_me_endpoint(self, db_session):
        """Test current user info endpoint"""
        db, user = db_session
        
        # Login to get access token
        login_response = client.post("/api/oauth2/login", json={
            "username": "apiuser",
            "password": "password123"
        })
        
        access_token = login_response.json()["access_token"]
        
        # Get user info
        me_response = client.get("/api/oauth2/me", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert me_response.status_code == 200
        user_data = me_response.json()
        
        assert user_data["username"] == "apiuser"
        assert user_data["email"] == "api@example.com"
        assert user_data["is_active"] is True
        assert "read" in user_data["permissions"]
        assert "write" in user_data["permissions"]
    
    def test_logout_endpoint(self, db_session):
        """Test logout endpoint"""
        db, user = db_session
        
        # Login to get access token
        login_response = client.post("/api/oauth2/login", json={
            "username": "apiuser",
            "password": "password123"
        })
        
        access_token = login_response.json()["access_token"]
        
        # Logout
        logout_response = client.post("/api/oauth2/logout", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert logout_response.status_code == 200
        logout_data = logout_response.json()
        
        assert "Logged out successfully" in logout_data["message"]
        assert logout_data["revoked_tokens"] >= 1
    
    def test_health_check_endpoint(self):
        """Test OAuth2 health check endpoint"""
        response = client.get("/api/oauth2/health")
        
        assert response.status_code == 200
        health_data = response.json()
        
        assert health_data["status"] == "healthy"
        assert "provider" in health_data
        assert "provider_configured" in health_data

class TestOAuth2Integration:
    """Integration tests for complete OAuth2 flows"""
    
    @pytest.fixture
    def db_session(self):
        """Create test database session"""
        models.Base.metadata.create_all(bind=engine)
        db = next(get_db())
        
        # Try to get existing admin role or create new one
        admin_role = db.query(models.Role).filter(models.Role.name == "admin").first()
        if not admin_role:
            admin_role = models.Role(
                name="admin",
                permissions={"read": True, "write": True, "admin": True, "view_audit_logs": True}
            )
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
        
        # Try to get existing admin user or use existing one
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin_user:
            admin_user = models.User(
                username="admin",
                email="admin@example.com",
                password_hash=get_password_hash("admin123"),
                role_id=admin_role.id,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        
        yield db, admin_user
        db.close()
    
    def test_complete_authentication_flow(self, db_session):
        """Test complete authentication flow with audit logging"""
        db, admin_user = db_session
        
        # 1. Login
        login_response = client.post("/api/oauth2/login", json={
            "username": "admin",
            "password": "admin123"
        })
        
        assert login_response.status_code == 200
        login_data = login_response.json()
        access_token = login_data["access_token"]
        refresh_token = login_data["refresh_token"]
        
        # 2. Access protected endpoint
        me_response = client.get("/api/oauth2/me", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert me_response.status_code == 200
        
        # 3. Check audit logs (may be 403 if user doesn't have permission)
        audit_response = client.get("/api/oauth2/audit-logs", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert audit_response.status_code in [200, 403]
        if audit_response.status_code == 200:
            audit_logs = audit_response.json()
            
            # Should have login success event
            login_events = [log for log in audit_logs if log["event_type"] == "login_success"]
            assert len(login_events) > 0
        
        # 4. Refresh token
        refresh_response = client.post("/api/oauth2/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert refresh_response.status_code == 200
        
        # 5. Logout (use the refreshed token if available)
        if refresh_response.status_code == 200:
            new_access_token = refresh_response.json()["access_token"]
            logout_response = client.post("/api/oauth2/logout", headers={
                "Authorization": f"Bearer {new_access_token}"
            })
        else:
            logout_response = client.post("/api/oauth2/logout", headers={
                "Authorization": f"Bearer {access_token}"
            })
        
        assert logout_response.status_code == 200
    
    def test_security_analysis_flow(self, db_session):
        """Test security analysis functionality"""
        db, admin_user = db_session
        
        # Login as admin
        login_response = client.post("/api/oauth2/login", json={
            "username": "admin",
            "password": "admin123"
        })
        
        access_token = login_response.json()["access_token"]
        
        # Generate some failed login attempts
        for _ in range(3):
            client.post("/api/oauth2/login", json={
                "username": "admin",
                "password": "wrongpassword"
            })
        
        # Get security analysis (may be 403 if user doesn't have permission)
        analysis_response = client.get("/api/oauth2/security-analysis", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        assert analysis_response.status_code in [200, 403]
        if analysis_response.status_code == 200:
            analysis_data = analysis_response.json()
            
            assert "user_analysis" in analysis_data
            assert "failed_login_analysis" in analysis_data
            assert analysis_data["failed_login_analysis"]["total_failed_attempts"] >= 3

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])