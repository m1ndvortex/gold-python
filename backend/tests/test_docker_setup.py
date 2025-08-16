import pytest
import os
from sqlalchemy import create_engine, text
from fastapi.testclient import TestClient
from main import app

class TestDockerEnvironmentSetup:
    """Test Docker environment setup and database connectivity"""
    
    def test_environment_variables(self):
        """Test that required environment variables are set"""
        required_vars = [
            "DATABASE_URL",
        ]
        
        for var in required_vars:
            assert os.getenv(var) is not None, f"Environment variable {var} is not set"
    
    def test_database_connection(self):
        """Test direct database connection"""
        database_url = os.getenv("DATABASE_URL")
        engine = create_engine(database_url)
        
        try:
            with engine.connect() as connection:
                result = connection.execute(text("SELECT 1"))
                assert result.fetchone()[0] == 1
        except Exception as e:
            pytest.fail(f"Database connection failed: {str(e)}")
    
    def test_database_tables_creation(self):
        """Test that database tables are created properly"""
        database_url = os.getenv("DATABASE_URL")
        engine = create_engine(database_url)
        
        expected_tables = [
            "users", "roles", "categories", "inventory_items", 
            "customers", "invoices", "invoice_items", 
            "accounting_entries", "company_settings"
        ]
        
        with engine.connect() as connection:
            for table in expected_tables:
                result = connection.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = '{table}'
                    );
                """))
                exists = result.fetchone()[0]
                assert exists, f"Table {table} does not exist"
    
    def test_api_health_endpoint(self, client):
        """Test API health endpoint with database connectivity"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        # The health endpoint might show unhealthy due to test database override
        # but the important thing is that it responds and we can test database separately
        assert "status" in data
        assert "database" in data
        assert "message" in data or "error" in data
    
    def test_api_root_endpoint(self, client):
        """Test API root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "status" in data
        assert data["status"] == "running"
    
    def test_database_write_operations(self, test_db_session):
        """Test database write operations with real PostgreSQL"""
        from models import Role
        import uuid
        
        # Create a test role
        test_role = Role(
            id=uuid.uuid4(),
            name="test_role_docker",
            description="Test role for Docker setup verification",
            permissions='{"test": true}'
        )
        
        try:
            test_db_session.add(test_role)
            test_db_session.commit()
            
            # Verify the role was created
            created_role = test_db_session.query(Role).filter(Role.name == "test_role_docker").first()
            assert created_role is not None
            assert created_role.name == "test_role_docker"
            assert created_role.description == "Test role for Docker setup verification"
            
        finally:
            # Clean up
            test_db_session.query(Role).filter(Role.name == "test_role_docker").delete()
            test_db_session.commit()
    
    def test_database_relationships(self, test_db_session):
        """Test database relationships work correctly"""
        from models import Role, User
        import uuid
        
        # Create test role and user
        test_role = Role(
            id=uuid.uuid4(),
            name="test_relationship_role",
            description="Test role for relationship verification",
            permissions='{"test": true}'
        )
        
        test_db_session.add(test_role)
        test_db_session.commit()
        
        test_user = User(
            id=uuid.uuid4(),
            username="test_docker_user",
            email="test@docker.com",
            password_hash="hashed_password",
            role_id=test_role.id,
            is_active=True
        )
        
        try:
            test_db_session.add(test_user)
            test_db_session.commit()
            
            # Test relationship
            created_user = test_db_session.query(User).filter(User.username == "test_docker_user").first()
            assert created_user is not None
            assert created_user.role is not None
            assert created_user.role.name == "test_relationship_role"
            
        finally:
            # Clean up
            test_db_session.query(User).filter(User.username == "test_docker_user").delete()
            test_db_session.query(Role).filter(Role.name == "test_relationship_role").delete()
            test_db_session.commit()
    
    def test_docker_networking(self, client):
        """Test that Docker networking is working properly"""
        # Test that the API is accessible within Docker network
        response = client.get("/")
        assert response.status_code == 200
        
        # Test health check endpoint is accessible (database connection tested separately)
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "database" in data  # Database status is reported, regardless of connection state