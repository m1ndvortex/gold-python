"""
Seed data script for Gold Shop Management System
This script populates the database with initial data after tables are created
"""

import uuid
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Role, CompanySettings, Category

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
        
        # Insert default roles
        roles = [
            Role(
                id=uuid.uuid4(),
                name='Owner',
                description='Full system access',
                permissions='{"all": true}'
            ),
            Role(
                id=uuid.uuid4(),
                name='Manager',
                description='Management access',
                permissions='{"inventory": true, "customers": true, "invoices": true, "reports": true}'
            ),
            Role(
                id=uuid.uuid4(),
                name='Accountant',
                description='Financial access',
                permissions='{"accounting": true, "reports": true, "invoices": "view"}'
            ),
            Role(
                id=uuid.uuid4(),
                name='Cashier',
                description='Sales access',
                permissions='{"invoices": true, "customers": true, "inventory": "view"}'
            )
        ]
        
        for role in roles:
            db.add(role)
        
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