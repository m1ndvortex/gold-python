#!/usr/bin/env python3
"""
Simple database connection test
"""

from database import engine
from sqlalchemy import text

def test_connection():
    try:
        with engine.connect() as conn:
            # Test basic connection
            result = conn.execute(text("SELECT 1 as test"))
            print(f"✅ Database connection: {result.scalar()}")
            
            # Test users table
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            users_count = result.scalar()
            print(f"✅ Users in database: {users_count}")
            
            # Test categories table
            result = conn.execute(text("SELECT COUNT(*) FROM categories"))
            categories_count = result.scalar()
            print(f"✅ Categories in database: {categories_count}")
            
            # Test inventory items
            result = conn.execute(text("SELECT COUNT(*) FROM inventory_items"))
            items_count = result.scalar()
            print(f"✅ Inventory items in database: {items_count}")
            
            # Test customers
            result = conn.execute(text("SELECT COUNT(*) FROM customers"))
            customers_count = result.scalar()
            print(f"✅ Customers in database: {customers_count}")
            
            print("\n🎉 Database is working perfectly!")
            return True
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()