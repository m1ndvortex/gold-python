"""
Seed data script for Gold Shop Management System
This script populates the database with initial data after tables are created
"""

import uuid
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Role, CompanySettings, Category, User
from auth import get_password_hash

def seed_database():
    """Seed the database with initial data"""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_roles = db.query(Role).count()
        if existing_roles > 0:
            print("Database already seeded, skipping...")
            return
        
        print("Seeding database with initial data...")
        
        # Insert default roles with proper permissions
        owner_role_id = uuid.uuid4()
        manager_role_id = uuid.uuid4()
        accountant_role_id = uuid.uuid4()
        cashier_role_id = uuid.uuid4()
        
        roles = [
            Role(
                id=owner_role_id,
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
                    "manage_settings": True,
                    "manage_roles": True,
                    "manage_users": True
                }
            ),
            Role(
                id=manager_role_id,
                name='Manager',
                description='Management access with most permissions',
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
                    "view_reports": True,
                    "send_sms": True,
                    "manage_settings": False,
                    "manage_roles": False,
                    "manage_users": False
                }
            ),
            Role(
                id=accountant_role_id,
                name='Accountant',
                description='Financial and accounting access',
                permissions={
                    "view_dashboard": True,
                    "view_inventory": True,
                    "edit_inventory": False,
                    "view_customers": True,
                    "manage_customers": False,
                    "manage_payments": False,
                    "view_invoices": True,
                    "create_invoices": False,
                    "edit_invoices": False,
                    "view_accounting": True,
                    "edit_accounting": True,
                    "view_reports": True,
                    "send_sms": False,
                    "manage_settings": False,
                    "manage_roles": False,
                    "manage_users": False
                }
            ),
            Role(
                id=cashier_role_id,
                name='Cashier',
                description='Sales and customer service access',
                permissions={
                    "view_dashboard": True,
                    "view_inventory": True,
                    "edit_inventory": False,
                    "view_customers": True,
                    "manage_customers": True,
                    "manage_payments": True,
                    "view_invoices": True,
                    "create_invoices": True,
                    "edit_invoices": False,
                    "view_accounting": False,
                    "edit_accounting": False,
                    "view_reports": False,
                    "send_sms": True,
                    "manage_settings": False,
                    "manage_roles": False,
                    "manage_users": False
                }
            )
        ]
        
        for role in roles:
            db.add(role)
        
        # Create default admin user
        admin_user = User(
            id=uuid.uuid4(),
            username='admin',
            email='admin@goldshop.com',
            password_hash=get_password_hash('admin123'),
            role_id=owner_role_id,
            is_active=True
        )
        db.add(admin_user)
        
        # Create test users for different roles
        test_users = [
            User(
                id=uuid.uuid4(),
                username='manager',
                email='manager@goldshop.com',
                password_hash=get_password_hash('manager123'),
                role_id=manager_role_id,
                is_active=True
            ),
            User(
                id=uuid.uuid4(),
                username='accountant',
                email='accountant@goldshop.com',
                password_hash=get_password_hash('accountant123'),
                role_id=accountant_role_id,
                is_active=True
            ),
            User(
                id=uuid.uuid4(),
                username='cashier',
                email='cashier@goldshop.com',
                password_hash=get_password_hash('cashier123'),
                role_id=cashier_role_id,
                is_active=True
            )
        ]
        
        for user in test_users:
            db.add(user)
        
        # Insert default company settings
        company_settings = CompanySettings(
            id=uuid.uuid4(),
            company_name='Gold Shop',
            default_gold_price=50.00,
            default_labor_percentage=10.00,
            default_profit_percentage=15.00,
            default_vat_percentage=9.00
        )
        db.add(company_settings)
        
        # Insert default categories
        categories = [
            Category(id=uuid.uuid4(), name='Rings', description='Gold rings and wedding bands'),
            Category(id=uuid.uuid4(), name='Necklaces', description='Gold necklaces and chains'),
            Category(id=uuid.uuid4(), name='Bracelets', description='Gold bracelets and bangles'),
            Category(id=uuid.uuid4(), name='Earrings', description='Gold earrings'),
            Category(id=uuid.uuid4(), name='Coins', description='Gold coins and bullion')
        ]
        
        for category in categories:
            db.add(category)
        
        db.commit()
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()