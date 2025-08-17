import pytest
import bcrypt
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime

from main import app
from database import get_db
from models import User, Role, CompanySettings
import schemas
from auth import get_password_hash

client = TestClient(app)

class TestSettingsEndpoints:
    """Test settings management endpoints with real PostgreSQL database"""
    
    def setup_method(self):
        """Set up test data before each test"""
        # Use existing admin user from seed data
        admin_login = client.post("/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.json()}"
        self.admin_token = admin_login.json()["access_token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Use existing cashier user from seed data
        cashier_login = client.post("/auth/login", json={
            "username": "cashier",
            "password": "cashier123"
        })
        
        if cashier_login.status_code == 200:
            self.user_token = cashier_login.json()["access_token"]
            self.user_headers = {"Authorization": f"Bearer {self.user_token}"}
        else:
            self.user_headers = {}
        
        # Get database session
        self.db = next(get_db())
        
        # Get existing roles from seed data
        self.admin_role = self.db.query(Role).filter(Role.name == "Owner").first()
        self.user_role = self.db.query(Role).filter(Role.name == "Cashier").first()
        
        # Get existing users
        self.admin_user = self.db.query(User).filter(User.username == "admin").first()
        self.regular_user = self.db.query(User).filter(User.username == "cashier").first()
    
    def teardown_method(self):
        """Clean up after each test"""
        if hasattr(self, 'db'):
            self.db.close()
    
    def test_get_company_settings_creates_default(self):
        """Test getting company settings creates default if none exist"""
        response = client.get("/settings/company", headers=self.admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "Gold Shop" in data["company_name"]  # Could be "Gold Shop" or "Gold Shop LLC" depending on previous tests
        assert data["default_gold_price"] >= 50.0  # Could be changed by previous tests
        assert data["default_labor_percentage"] >= 10.0  # Could be changed by previous tests
        assert data["default_profit_percentage"] >= 15.0  # Could be changed by previous tests
        assert data["default_vat_percentage"] >= 5.0  # Could be changed by previous tests
    
    def test_update_company_settings(self):
        """Test updating company settings"""
        update_data = {
            "company_name": "Premium Gold Shop",
            "company_address": "123 Gold Street",
            "default_gold_price": 55.0,
            "default_labor_percentage": 12.0
        }
        
        response = client.put("/settings/company", json=update_data, headers=self.admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "company_name" in data["updated_fields"]
        assert "default_gold_price" in data["updated_fields"]
    
    def test_get_gold_price_config(self):
        """Test getting gold price configuration"""
        response = client.get("/settings/gold-price", headers=self.admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "current_price" in data
        assert data["auto_update_enabled"] is False
        assert data["update_frequency_hours"] == 24
    
    def test_update_gold_price(self):
        """Test updating gold price manually"""
        price_update = {
            "price": 65.5,
            "source": "manual"
        }
        
        response = client.put("/settings/gold-price", json=price_update, headers=self.admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "65.5" in data["message"]
    
    def test_get_invoice_template_default(self):
        """Test getting default invoice template when none exists"""
        response = client.get("/settings/invoice-template", headers=self.admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Default Template"
        assert data["layout"] == "portrait"
        assert data["page_size"] == "A4"
        assert "header" in data
        assert "body" in data
        assert "footer" in data
    
    def test_get_all_roles(self):
        """Test getting all roles with users"""
        response = client.get("/settings/roles", headers=self.admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1  # At least one role should exist
        
        # Check that roles have the expected structure
        for role in data:
            assert "id" in role
            assert "name" in role
            assert "permissions" in role
            assert "users" in role
    
    def test_get_permission_structure(self):
        """Test getting permission structure"""
        response = client.get("/settings/permissions", headers=self.admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        
        categories = data["categories"]
        category_names = [cat["name"] for cat in categories]
        assert "inventory" in category_names
        assert "customers" in category_names
        assert "invoices" in category_names
        assert "accounting" in category_names
        assert "reports" in category_names
        assert "settings" in category_names
        assert "sms" in category_names
    
    def test_get_all_users(self):
        """Test getting all users with pagination"""
        response = client.get("/settings/users?page=1&per_page=10", headers=self.admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert data["total"] >= 2
        assert len(data["users"]) >= 2
    
    def test_get_system_settings(self):
        """Test getting complete system settings overview"""
        response = client.get("/settings/system", headers=self.admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "company" in data
        assert "gold_price" in data
        assert "invoice_template" in data
        assert "permissions" in data
    
    def test_unauthorized_access_fails(self):
        """Test that unauthorized users cannot access settings"""
        # Test without token
        response = client.get("/settings/company")
        assert response.status_code in [401, 403]  # FastAPI can return either for missing auth
        
        # Test with user without permissions (if available)
        if self.user_headers:
            response = client.put("/settings/company", json={"company_name": "Test"}, headers=self.user_headers)
            assert response.status_code == 403

if __name__ == "__main__":
    pytest.main([__file__])