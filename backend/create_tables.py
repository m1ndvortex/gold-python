#!/usr/bin/env python3
"""
Create all database tables directly using SQLAlchemy
"""

from database import engine
from models import Base

def create_all_tables():
    """Create all tables defined in models"""
    try:
        print("Creating all database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    create_all_tables()