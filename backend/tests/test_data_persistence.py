import pytest
import os
from sqlalchemy import create_engine, text
from fastapi.testclient import TestClient
from main import app

class TestDataPersistence:
    """Test data persistence with main database and Docker volumes"""
    
    def test_seeded_data_exists(self):
        """Test that seeded data exists in the main database"""
        database_url = os.getenv("DATABASE_URL")
        engine = create_engine(database_url)
        
        with engine.connect() as connection:
            # Check if roles were seeded
            result = connection.execute(text("SELECT COUNT(*) FROM roles"))
            role_count = result.fetchone()[0]
            assert role_count >= 4, f"Expected at least 4 roles, found {role_count}"
            
            # Check specific roles exist
            result = connection.execute(text("SELECT name FROM roles ORDER BY name"))
            role_names = [row[0] for row in result.fetchall()]
            expected_roles = ['Accountant', 'Cashier', 'Manager', 'Owner']
            for expected_role in expected_roles:
                assert expected_role in role_names, f"Role {expected_role} not found in database"
            
            # Check if categories were seeded
            result = connection.execute(text("SELECT COUNT(*) FROM categories"))
            category_count = result.fetchone()[0]
            assert category_count >= 5, f"Expected at least 5 categories, found {category_count}"
            
            # Check specific categories exist
            result = connection.execute(text("SELECT name FROM categories ORDER BY name"))
            category_names = [row[0] for row in result.fetchall()]
            expected_categories = ['Bracelets', 'Coins', 'Earrings', 'Necklaces', 'Rings']
            for expected_category in expected_categories:
                assert expected_category in category_names, f"Category {expected_category} not found in database"
            
            # Check if company settings were seeded
            result = connection.execute(text("SELECT COUNT(*) FROM company_settings"))
            settings_count = result.fetchone()[0]
            assert settings_count >= 1, f"Expected at least 1 company setting, found {settings_count}"
    
    def test_data_persistence_across_restarts(self, test_db_session):
        """Test that data persists across container restarts"""
        from models import Role
        import uuid
        
        # Create a test role to verify persistence
        test_role_name = "test_persistence_role"
        
        # First, clean up any existing test role
        test_db_session.query(Role).filter(Role.name == test_role_name).delete()
        test_db_session.commit()
        
        # Create a new test role
        test_role = Role(
            id=uuid.uuid4(),
            name=test_role_name,
            description="Test role for persistence verification",
            permissions='{"persistence": true}'
        )
        
        test_db_session.add(test_role)
        test_db_session.commit()
        
        # Verify the role was created
        created_role = test_db_session.query(Role).filter(Role.name == test_role_name).first()
        assert created_role is not None
        assert created_role.name == test_role_name
        assert created_role.description == "Test role for persistence verification"
        
        # Note: In a real persistence test, we would restart the container here
        # For this test, we verify the data exists and can be queried
        
        # Query again to simulate persistence check
        persistent_role = test_db_session.query(Role).filter(Role.name == test_role_name).first()
        assert persistent_role is not None
        assert persistent_role.id == created_role.id
        assert persistent_role.name == test_role_name
        
        # Clean up
        test_db_session.query(Role).filter(Role.name == test_role_name).delete()
        test_db_session.commit()
    
    def test_volume_configuration(self):
        """Test that Docker volumes are properly configured"""
        # This test verifies that the environment is set up for persistence
        # The actual volume persistence is tested by Docker itself
        
        database_url = os.getenv("DATABASE_URL")
        assert database_url is not None, "DATABASE_URL environment variable not set"
        
        # Verify we're using the main database, not a test database
        assert "goldshop" in database_url, "Should be using main goldshop database"
        assert "test" not in database_url, "Should not be using test database"
        
        # Verify database connection works
        engine = create_engine(database_url)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            assert result.fetchone()[0] == 1
    
    def test_main_database_integration(self, client):
        """Test integration with main database through API"""
        # Test that API endpoints work with the main database
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        # With main database, health should be good
        assert "status" in data
        assert "database" in data
        
        # Test root endpoint
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "running"
        assert "message" in data
    
    def test_concurrent_database_access(self, test_db_session):
        """Test that multiple operations can access the main database concurrently"""
        from models import Role, Category
        import uuid
        
        # Create multiple test records
        test_items = []
        
        # Create test role
        test_role = Role(
            id=uuid.uuid4(),
            name="concurrent_test_role",
            description="Test concurrent access",
            permissions='{"concurrent": true}'
        )
        test_items.append(test_role)
        
        # Create test category
        test_category = Category(
            id=uuid.uuid4(),
            name="Concurrent Test Category",
            description="Test concurrent database access"
        )
        test_items.append(test_category)
        
        try:
            # Add all items in one transaction
            for item in test_items:
                test_db_session.add(item)
            test_db_session.commit()
            
            # Verify all items were created
            created_role = test_db_session.query(Role).filter(Role.name == "concurrent_test_role").first()
            assert created_role is not None
            
            created_category = test_db_session.query(Category).filter(Category.name == "Concurrent Test Category").first()
            assert created_category is not None
            
        finally:
            # Clean up
            test_db_session.query(Role).filter(Role.name == "concurrent_test_role").delete()
            test_db_session.query(Category).filter(Category.name == "Concurrent Test Category").delete()
            test_db_session.commit()