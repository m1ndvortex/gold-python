"""
Database Base Configuration
Single source of truth for SQLAlchemy Base class
"""

from sqlalchemy.orm import declarative_base

# Single Base class for all models to prevent metadata conflicts
Base = declarative_base()