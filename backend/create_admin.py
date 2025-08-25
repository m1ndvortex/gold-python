#!/usr/bin/env python3
"""
Simple script to create admin user directly
"""

import uuid
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Role, User
from auth import get_password_hash

def create_admin_user():
    """Create admin user with Owner role"""
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.username == 'admin').first()
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Check if Owner role exists, create if not
        owner_role = db.query(Role).filter(Role.name == 'Owner').first()
        if not owner_role:
            print("Creating Owner role...")
            owner_role = Role(
                id=uuid.uuid4(),
                name='Owner',
                description='Full system access with all permissions',
                permissions={
                    "view_dashboard": True,
                    "view_inventory": True,
                    "edit_inventory": True,
                    "view_customers": True,
                    "manage_customers": True,
                    "manage_payments": True,
                    "view_invoices": True,
                    "create_invoices": True,
                    "edit_invoices": True,
                    "view_accounting": True,
                    "edit_accounting": True,
                    "view_reports": True,
                    "send_sms": True,
                    "view_settings": True,
                    "edit_settings": True,
                    "manage_roles": True,
                    "manage_users": True,
                    "view_roles": True,
                    "view_audit_logs": True,
                    "view_security_analysis": True,
                    "admin": True
                }
            )
            db.add(owner_role)
            db.commit()
            db.refresh(owner_role)
        
        # Create admin user
        print("Creating admin user...")
        admin_user = User(
            id=uuid.uuid4(),
            username='admin',
            email='admin@goldshop.com',
            password_hash=get_password_hash('admin123'),
            role_id=owner_role.id,
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Admin user created successfully!")
        print("Username: admin")
        print("Password: admin123")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()