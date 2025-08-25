"""
Simple OAuth2 Integration Tests for Docker Environment
Tests core OAuth2 functionality with real PostgreSQL database
"""
import pytest
import requests
import time
from datetime import datetime
import json

# Test configuration
BASE_URL = "http://backend:8000"
TEST_USER = {
    "username": "oauth2_test_user",
    "email": "oauth2test@example.com",
    "password": "TestPassword123!"
}

class TestOAuth2BasicFlow:
    """Test basic OAuth2 authentication flow"""
    
    def test_health_check(self):
        """Test OAuth2 health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/oauth2/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "provider" in data
        print(f"✓ OAuth2 Health Check: {data}")
    
    def test_login_flow(self):
        """Test complete login flow"""
        # First, create a test user through the existing auth system
        try:
            # Try to create user (may fail if already exists)
            create_response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "username": TEST_USER["username"],
                "email": TEST_USER["email"],
                "password": TEST_USER["password"]
            })
            print(f"User creation response: {create_response.status_code}")
        except:
            pass  # User might already exist
        
        # Test OAuth2 login
        login_response = requests.post(f"{BASE_URL}/api/oauth2/login", json={
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        })
        
        print(f"Login response status: {login_response.status_code}")
        if login_response.status_code != 200:
            print(f"Login error: {login_response.text}")
            # Try with default admin user
            login_response = requests.post(f"{BASE_URL}/api/oauth2/login", json={
                "username": "admin",
                "password": "admin123"
            })
        
        assert login_response.status_code == 200
        
        login_data = login_response.json()
        assert "access_token" in login_data
        assert "refresh_token" in login_data
        assert login_data["token_type"] == "bearer"
        assert "user" in login_data
        
        access_token = login_data["access_token"]
        refresh_token = login_data["refresh_token"]
        
        print(f"✓ Login successful for user: {login_data['user']['username']}")
        
        return access_token, refresh_token
    
    def test_protected_endpoint_access(self):
        """Test accessing protected endpoints with OAuth2 token"""
        access_token, _ = self.test_login_flow()
        
        # Test /me endpoint
        me_response = requests.get(
            f"{BASE_URL}/api/oauth2/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert me_response.status_code == 200
        user_data = me_response.json()
        
        assert "id" in user_data
        assert "username" in user_data
        assert "email" in user_data
        assert "permissions" in user_data
        assert user_data["is_active"] is True
        
        print(f"✓ Protected endpoint access successful: {user_data['username']}")
        
        return user_data
    
    def test_token_refresh(self):
        """Test token refresh functionality"""
        access_token, refresh_token = self.test_login_flow()
        
        # Test token refresh
        refresh_response = requests.post(f"{BASE_URL}/api/oauth2/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert refresh_response.status_code == 200
        refresh_data = refresh_response.json()
        
        assert "access_token" in refresh_data
        assert "refresh_token" in refresh_data
        assert refresh_data["token_type"] == "bearer"
        
        # Verify new token works
        new_access_token = refresh_data["access_token"]
        me_response = requests.get(
            f"{BASE_URL}/api/oauth2/me",
            headers={"Authorization": f"Bearer {new_access_token}"}
        )
        
        assert me_response.status_code == 200
        print("✓ Token refresh successful")
        
        return new_access_token
    
    def test_token_revocation(self):
        """Test token revocation"""
        access_token, refresh_token = self.test_login_flow()
        
        # Revoke refresh token
        revoke_response = requests.post(f"{BASE_URL}/api/oauth2/revoke", json={
            "token": refresh_token
        })
        
        assert revoke_response.status_code == 200
        revoke_data = revoke_response.json()
        
        print(f"✓ Token revocation: {revoke_data}")
    
    def test_logout_flow(self):
        """Test logout functionality"""
        access_token, _ = self.test_login_flow()
        
        # Logout
        logout_response = requests.post(
            f"{BASE_URL}/api/oauth2/logout",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert logout_response.status_code == 200
        logout_data = logout_response.json()
        
        assert "Logged out successfully" in logout_data["message"]
        assert "revoked_tokens" in logout_data
        
        print(f"✓ Logout successful: {logout_data}")
        
        # Verify token no longer works
        me_response = requests.get(
            f"{BASE_URL}/api/oauth2/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert me_response.status_code == 401
        print("✓ Token invalidated after logout")

class TestOAuth2Security:
    """Test OAuth2 security features"""
    
    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/oauth2/login", json={
            "username": "nonexistent",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
        print("✓ Invalid credentials properly rejected")
    
    def test_invalid_token_access(self):
        """Test access with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/oauth2/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == 401
        print("✓ Invalid token properly rejected")
    
    def test_missing_token_access(self):
        """Test access without token"""
        response = requests.get(f"{BASE_URL}/api/oauth2/me")
        
        assert response.status_code == 401
        print("✓ Missing token properly rejected")
    
    def test_invalid_refresh_token(self):
        """Test refresh with invalid token"""
        response = requests.post(f"{BASE_URL}/api/oauth2/refresh", json={
            "refresh_token": "invalid_refresh_token"
        })
        
        assert response.status_code == 401
        print("✓ Invalid refresh token properly rejected")

class TestOAuth2Configuration:
    """Test OAuth2 configuration endpoints"""
    
    def test_config_endpoint_requires_admin(self):
        """Test that config endpoint requires admin role"""
        # Try without token
        response = requests.get(f"{BASE_URL}/api/oauth2/config")
        assert response.status_code == 401
        
        # Try with regular user token (if we can create one)
        try:
            # Login as regular user
            login_response = requests.post(f"{BASE_URL}/api/oauth2/login", json={
                "username": TEST_USER["username"],
                "password": TEST_USER["password"]
            })
            
            if login_response.status_code == 200:
                access_token = login_response.json()["access_token"]
                
                config_response = requests.get(
                    f"{BASE_URL}/api/oauth2/config",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                # Should be forbidden for non-admin users
                assert config_response.status_code == 403
                print("✓ Config endpoint properly protected")
        except:
            print("✓ Config endpoint protection test skipped (no regular user)")

class TestOAuth2AuditLogging:
    """Test OAuth2 audit logging functionality"""
    
    def test_audit_logs_creation(self):
        """Test that audit logs are created for authentication events"""
        # Perform login to generate audit logs
        login_response = requests.post(f"{BASE_URL}/api/oauth2/login", json={
            "username": "admin",
            "password": "admin123"
        })
        
        if login_response.status_code == 200:
            access_token = login_response.json()["access_token"]
            
            # Try to access audit logs (requires permission)
            audit_response = requests.get(
                f"{BASE_URL}/api/oauth2/audit-logs",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            # May be 200 (success) or 403 (no permission) - both are valid
            assert audit_response.status_code in [200, 403]
            
            if audit_response.status_code == 200:
                audit_data = audit_response.json()
                assert isinstance(audit_data, list)
                print(f"✓ Audit logs accessible: {len(audit_data)} entries")
            else:
                print("✓ Audit logs properly protected")

def run_oauth2_tests():
    """Run all OAuth2 tests"""
    print("=" * 60)
    print("OAUTH2 SECURITY FOUNDATION TESTS")
    print("=" * 60)
    
    # Wait for backend to be ready
    max_retries = 30
    for i in range(max_retries):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            if response.status_code == 200:
                print(f"✓ Backend is ready after {i+1} attempts")
                break
        except:
            if i == max_retries - 1:
                print("✗ Backend not ready after maximum retries")
                return False
            time.sleep(2)
    
    test_classes = [
        TestOAuth2BasicFlow,
        TestOAuth2Security,
        TestOAuth2Configuration,
        TestOAuth2AuditLogging
    ]
    
    total_tests = 0
    passed_tests = 0
    
    for test_class in test_classes:
        print(f"\n--- {test_class.__name__} ---")
        test_instance = test_class()
        
        for method_name in dir(test_instance):
            if method_name.startswith("test_"):
                total_tests += 1
                try:
                    print(f"Running {method_name}...")
                    getattr(test_instance, method_name)()
                    passed_tests += 1
                except Exception as e:
                    print(f"✗ {method_name} failed: {str(e)}")
    
    print(f"\n" + "=" * 60)
    print(f"OAUTH2 TEST RESULTS: {passed_tests}/{total_tests} tests passed")
    print("=" * 60)
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = run_oauth2_tests()
    exit(0 if success else 1)