#!/usr/bin/env python3
"""
Create RBAC (Role-Based Access Control) tables
This script creates the enhanced RBAC tables for comprehensive permission management
"""

import asyncio
import sys
import os
from sqlalchemy import text

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models_rbac import (
    RBACRole, RBACPermission, RBACUserPermission, RBACPermissionGroup,
    RBACAccessLog, RBACSession, role_permissions, user_roles, permission_group_permissions
)
from database_base import Base
from database import engine

def create_rbac_tables():
    """Create all RBAC tables"""
    print("Creating RBAC tables...")
    
    try:
        # Create all RBAC tables
        Base.metadata.create_all(bind=engine, tables=[
            RBACRole.__table__,
            RBACPermission.__table__,
            RBACUserPermission.__table__,
            RBACPermissionGroup.__table__,
            RBACAccessLog.__table__,
            RBACSession.__table__,
            role_permissions,
            user_roles,
            permission_group_permissions
        ])
        
        print("✅ RBAC tables created successfully!")
        
        # Verify tables were created
        with SessionLocal() as db:
            # Check if tables exist
            result = db.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE 'rbac_%'
                ORDER BY table_name
            """))
            tables = result.fetchall()
            
            print(f"✅ Created {len(tables)} RBAC tables:")
            for table in tables:
                print(f"  - {table[0]}")
                
            # Check association tables
            result = db.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('role_permissions', 'user_roles', 'permission_group_permissions')
                ORDER BY table_name
            """))
            assoc_tables = result.fetchall()
            
            print(f"✅ Created {len(assoc_tables)} association tables:")
            for table in assoc_tables:
                print(f"  - {table[0]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating RBAC tables: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Starting RBAC table creation...")
    
    success = create_rbac_tables()
    
    if success:
        print("🎉 RBAC table creation completed successfully!")
        return 0
    else:
        print("💥 RBAC table creation failed!")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)