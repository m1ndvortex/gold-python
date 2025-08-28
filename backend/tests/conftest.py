"""
Test configuration for running tests in Docker environment with real PostgreSQL.
"""

import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base


@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine"""
    database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
    engine = create_engine(database_url)
    
    # Ensure all tables exist (they should from migrations, but just in case)
    Base.metadata.create_all(bind=engine)
    
    return engine


@pytest.fixture(scope="function")
def db_session(test_engine):
    """Create a database session for testing"""
    TestingSessionLocal = sessionmaker(bind=test_engine)
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_database(test_engine):
    """Set up test database schema before running tests"""
    # Tables are already created in test_engine fixture
    yield
    
    # Cleanup is handled by individual test fixtures
    pass


def pytest_configure(config):
    """Configure pytest for Docker environment"""
    # Add custom markers
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "database: mark test as database test"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically"""
    for item in items:
        # Mark all tests in test_models.py as database tests
        if "test_models" in item.nodeid:
            item.add_marker(pytest.mark.database)