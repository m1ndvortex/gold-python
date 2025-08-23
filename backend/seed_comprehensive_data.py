#!/usr/bin/env python3
"""
Comprehensive seed data script for Gold Shop Management System
This script populates the database with realistic test data including:
- Categories
- Customers
- Inventory Items
- Invoices with Items
- Payments
- Company Settings
"""

import uuid
import random
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from database import SessionLocal
from models import (
    Role, User, Category, Customer, InventoryItem, Invoice, InvoiceItem, 
    Payment, CompanySettings
)
from auth import get_password_hash

def create_comprehensive_seed_data(force=False):
    """Create comprehensive seed data for the gold shop"""
    db = SessionLocal()
    
    try:
        print("🌱 Starting comprehensive database seeding...")
        
        # Check if data already exists
        existing_customers = db.query(Customer).count()
        if existing_customers > 0 and not force:
            print("📊 Database already has customer data. Skipping seeding...")
            print("💡 Run with --force to recreate all data")
            return
        elif existing_customers > 0 and force:
            print("🧹 Clearing existing data...")
            # Clear in correct order due to foreign key constraints
            db.query(Payment).delete()
            db.query(InvoiceItem).delete()
            db.query(Invoice).delete()
            db.query(InventoryItem).delete()
            db.query(Customer).delete()
            db.query(Category).delete()
            db.commit()
            print("✅ Existing data cleared")
        
        # 1. Create Categories
        print("📂 Creating categories...")
        categories_data = [
            {"name": "Rings", "description": "Gold rings and wedding bands", "icon": "💍", "color": "#FFD700"},
            {"name": "Necklaces", "description": "Gold necklaces and chains", "icon": "📿", "color": "#FFA500"},
            {"name": "Bracelets", "description": "Gold bracelets and bangles", "icon": "⚡", "color": "#FF8C00"},
            {"name": "Earrings", "description": "Gold earrings and studs", "icon": "💎", "color": "#DAA520"},
            {"name": "Coins", "description": "Gold coins and bullion", "icon": "🪙", "color": "#B8860B"},
            {"name": "Watches", "description": "Gold watches and timepieces", "icon": "⌚", "color": "#CD853F"},
            {"name": "Pendants", "description": "Gold pendants and charms", "icon": "🔮", "color": "#DEB887"},
            {"name": "Sets", "description": "Complete jewelry sets", "icon": "💫", "color": "#F4A460"}
        ]
        
        categories = {}
        for cat_data in categories_data:
            category = Category(
                id=uuid.uuid4(),
                name=cat_data["name"],
                description=cat_data["description"],
                icon=cat_data["icon"],
                color=cat_data["color"],
                sort_order=len(categories),
                is_active=True
            )
            db.add(category)
            categories[cat_data["name"]] = category
        
        db.commit()
        print(f"✅ Created {len(categories)} categories")
        
        # 2. Create Customers
        print("👥 Creating customers...")
        customers_data = [
            {"name": "Ahmad Hassan", "phone": "+98-912-345-6789", "email": "ahmad.hassan@email.com", "address": "Tehran, Valiasr Street, No. 123"},
            {"name": "Fatima Karimi", "phone": "+98-913-456-7890", "email": "fatima.karimi@email.com", "address": "Isfahan, Chahar Bagh Street, No. 456"},
            {"name": "Mohammad Rezaei", "phone": "+98-914-567-8901", "email": "mohammad.rezaei@email.com", "address": "Shiraz, Zand Street, No. 789"},
            {"name": "Zahra Ahmadi", "phone": "+98-915-678-9012", "email": "zahra.ahmadi@email.com", "address": "Mashhad, Imam Reza Street, No. 321"},
            {"name": "Ali Moradi", "phone": "+98-916-789-0123", "email": "ali.moradi@email.com", "address": "Tabriz, Baghmisheh Street, No. 654"},
            {"name": "Maryam Hosseini", "phone": "+98-917-890-1234", "email": "maryam.hosseini@email.com", "address": "Kerman, Azadi Square, No. 987"},
            {"name": "Reza Ghorbani", "phone": "+98-918-901-2345", "email": "reza.ghorbani@email.com", "address": "Yazd, Amir Chakhmaq Square, No. 147"},
            {"name": "Soghra Bahrami", "phone": "+98-919-012-3456", "email": "soghra.bahrami@email.com", "address": "Qom, Hazrat Masumeh Street, No. 258"},
            {"name": "Hassan Jafari", "phone": "+98-920-123-4567", "email": "hassan.jafari@email.com", "address": "Ahvaz, Kianpars Street, No. 369"},
            {"name": "Narges Rahmani", "phone": "+98-921-234-5678", "email": "narges.rahmani@email.com", "address": "Rasht, Golsar Street, No. 741"},
            {"name": "Mehdi Kazemi", "phone": "+98-922-345-6789", "email": "mehdi.kazemi@email.com", "address": "Karaj, Gohardasht Street, No. 852"},
            {"name": "Leila Mousavi", "phone": "+98-923-456-7890", "email": "leila.mousavi@email.com", "address": "Urmia, Resalat Street, No. 963"},
            {"name": "Javad Sadeghi", "phone": "+98-924-567-8901", "email": "javad.sadeghi@email.com", "address": "Arak, Basij Square, No. 159"},
            {"name": "Fatemeh Zare", "phone": "+98-925-678-9012", "email": "fatemeh.zare@email.com", "address": "Bandar Abbas, Emam Khomeini Street, No. 357"},
            {"name": "Saeed Rahimi", "phone": "+98-926-789-0123", "email": "saeed.rahimi@email.com", "address": "Sari, Taleghani Street, No. 468"}
        ]
        
        customers = []
        for i, cust_data in enumerate(customers_data):
            customer = Customer(
                id=uuid.uuid4(),
                name=cust_data["name"],
                phone=cust_data["phone"],
                email=cust_data["email"],
                address=cust_data["address"],
                current_debt=Decimal(random.uniform(0, 5000)),  # Random debt between 0-5000
                credit_limit=Decimal(random.uniform(10000, 50000)),  # Random credit limit
                is_active=True
            )
            db.add(customer)
            customers.append(customer)
        
        db.commit()
        print(f"✅ Created {len(customers)} customers")
        
        # 3. Create Inventory Items
        print("💎 Creating inventory items...")
        
        # Gold items with realistic names and prices
        inventory_items_data = [
            # Rings
            {"name": "Classic Gold Wedding Band", "category": "Rings", "weight": 5.2, "purity": 18, "price": 850},
            {"name": "Diamond Engagement Ring", "category": "Rings", "weight": 3.8, "purity": 14, "price": 2500},
            {"name": "Vintage Rose Gold Ring", "category": "Rings", "weight": 4.1, "purity": 18, "price": 1200},
            {"name": "Men's Signet Ring", "category": "Rings", "weight": 8.5, "purity": 18, "price": 1800},
            {"name": "Eternity Band with Diamonds", "category": "Rings", "weight": 4.5, "purity": 18, "price": 3200},
            
            # Necklaces
            {"name": "Gold Chain Necklace 24K", "category": "Necklaces", "weight": 15.3, "purity": 24, "price": 2800},
            {"name": "Pearl and Gold Necklace", "category": "Necklaces", "weight": 12.1, "purity": 18, "price": 1950},
            {"name": "Byzantine Chain", "category": "Necklaces", "weight": 18.7, "purity": 22, "price": 3500},
            {"name": "Delicate Gold Chain", "category": "Necklaces", "weight": 6.2, "purity": 14, "price": 680},
            {"name": "Statement Gold Collar", "category": "Necklaces", "weight": 25.4, "purity": 18, "price": 4200},
            
            # Bracelets
            {"name": "Tennis Bracelet", "category": "Bracelets", "weight": 8.9, "purity": 18, "price": 2200},
            {"name": "Gold Bangle Set", "category": "Bracelets", "weight": 22.1, "purity": 22, "price": 3800},
            {"name": "Charm Bracelet", "category": "Bracelets", "weight": 12.3, "purity": 14, "price": 1100},
            {"name": "Link Chain Bracelet", "category": "Bracelets", "weight": 14.7, "purity": 18, "price": 1850},
            {"name": "Cuff Bracelet", "category": "Bracelets", "weight": 18.2, "purity": 18, "price": 2650},
            
            # Earrings
            {"name": "Diamond Stud Earrings", "category": "Earrings", "weight": 2.1, "purity": 18, "price": 1500},
            {"name": "Gold Hoop Earrings", "category": "Earrings", "weight": 4.3, "purity": 14, "price": 420},
            {"name": "Chandelier Earrings", "category": "Earrings", "weight": 6.8, "purity": 18, "price": 1800},
            {"name": "Pearl Drop Earrings", "category": "Earrings", "weight": 3.2, "purity": 18, "price": 950},
            {"name": "Geometric Gold Earrings", "category": "Earrings", "weight": 5.1, "purity": 14, "price": 680},
            
            # Coins
            {"name": "1oz Gold Eagle Coin", "category": "Coins", "weight": 31.1, "purity": 22, "price": 2100},
            {"name": "1/2oz Gold Maple Leaf", "category": "Coins", "weight": 15.55, "purity": 24, "price": 1050},
            {"name": "1/4oz Gold Krugerrand", "category": "Coins", "weight": 7.78, "purity": 22, "price": 525},
            {"name": "1/10oz Gold Panda", "category": "Coins", "weight": 3.11, "purity": 24, "price": 210},
            {"name": "Gold Commemorative Coin", "category": "Coins", "weight": 8.5, "purity": 18, "price": 650},
            
            # Watches
            {"name": "Classic Gold Watch", "category": "Watches", "weight": 45.2, "purity": 18, "price": 5500},
            {"name": "Ladies Diamond Watch", "category": "Watches", "weight": 32.1, "purity": 14, "price": 3200},
            {"name": "Men's Sports Watch", "category": "Watches", "weight": 52.8, "purity": 18, "price": 6800},
            {"name": "Vintage Pocket Watch", "category": "Watches", "weight": 38.5, "purity": 14, "price": 2800},
            
            # Pendants
            {"name": "Heart Pendant", "category": "Pendants", "weight": 3.2, "purity": 18, "price": 450},
            {"name": "Cross Pendant", "category": "Pendants", "weight": 4.1, "purity": 14, "price": 320},
            {"name": "Locket Pendant", "category": "Pendants", "weight": 5.8, "purity": 18, "price": 680},
            {"name": "Gemstone Pendant", "category": "Pendants", "weight": 6.2, "purity": 18, "price": 1200},
            
            # Sets
            {"name": "Bridal Jewelry Set", "category": "Sets", "weight": 35.2, "purity": 18, "price": 4500},
            {"name": "Evening Jewelry Set", "category": "Sets", "weight": 28.1, "purity": 14, "price": 2800},
            {"name": "Traditional Gold Set", "category": "Sets", "weight": 42.5, "purity": 22, "price": 6200}
        ]
        
        inventory_items = []
        for item_data in inventory_items_data:
            # Calculate labor and total costs
            gold_price_per_gram = 65  # Current gold price
            weight_grams = item_data["weight"]
            purity_factor = item_data["purity"] / 24
            
            gold_cost = weight_grams * gold_price_per_gram * purity_factor
            labor_cost = gold_cost * 0.15  # 15% labor cost
            total_cost = gold_cost + labor_cost
            
            item = InventoryItem(
                id=uuid.uuid4(),
                name=item_data["name"],
                category_id=categories[item_data["category"]].id,
                weight_grams=Decimal(str(weight_grams)),
                purchase_price=Decimal(str(round(total_cost, 2))),
                sell_price=Decimal(str(item_data["price"])),
                stock_quantity=random.randint(1, 20),
                min_stock_level=random.randint(1, 5),
                is_active=True,
                description=f"High-quality {item_data['purity']}K gold {item_data['name'].lower()}, Weight: {weight_grams}g, Purity: {item_data['purity']}K"
            )
            db.add(item)
            inventory_items.append(item)
        
        db.commit()
        print(f"✅ Created {len(inventory_items)} inventory items")
        
        # 4. Create Invoices with Items
        print("🧾 Creating invoices...")
        
        # Get admin user for invoices
        admin_user = db.query(User).filter(User.username == 'admin').first()
        
        invoices = []
        for i in range(25):  # Create 25 invoices
            # Random date in the last 90 days
            invoice_date = datetime.now() - timedelta(days=random.randint(0, 90))
            
            # Random customer
            customer = random.choice(customers)
            
            # Create invoice
            invoice = Invoice(
                id=uuid.uuid4(),
                invoice_number=f"INV-{2024}-{1000 + i}",
                customer_id=customer.id,
                status=random.choice(['paid', 'pending', 'overdue']),
                total_amount=Decimal('0'),
                paid_amount=Decimal('0'),
                remaining_amount=Decimal('0'),
                gold_price_per_gram=Decimal('65.00'),
                labor_cost_percentage=Decimal('15.00'),
                profit_percentage=Decimal('20.00'),
                vat_percentage=Decimal('9.00'),
                created_at=invoice_date
            )
            
            # Add 1-5 random items to each invoice
            num_items = random.randint(1, 5)
            selected_items = random.sample(inventory_items, min(num_items, len(inventory_items)))
            
            subtotal = Decimal('0')
            for item in selected_items:
                quantity = random.randint(1, 3)
                unit_price = item.sell_price
                line_total = unit_price * quantity
                
                invoice_item = InvoiceItem(
                    id=uuid.uuid4(),
                    invoice_id=invoice.id,
                    inventory_item_id=item.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=line_total,
                    weight_grams=item.weight_grams * quantity
                )
                db.add(invoice_item)
                subtotal += line_total
            
            # Calculate totals
            invoice.total_amount = subtotal
            
            # Set paid amount based on status
            if invoice.status == 'paid':
                invoice.paid_amount = subtotal
                invoice.remaining_amount = Decimal('0')
            elif invoice.status == 'pending':
                partial_payment = subtotal * Decimal(str(random.uniform(0.3, 0.8)))
                invoice.paid_amount = partial_payment
                invoice.remaining_amount = subtotal - partial_payment
            else:  # overdue
                invoice.paid_amount = Decimal('0')
                invoice.remaining_amount = subtotal
            
            db.add(invoice)
            invoices.append(invoice)
        
        db.commit()
        print(f"✅ Created {len(invoices)} invoices with items")
        
        # 5. Create Payments
        print("💰 Creating payments...")
        
        payments = []
        for invoice in invoices:
            if invoice.status in ['paid', 'pending']:
                # Create full or partial payments
                if invoice.status == 'paid':
                    # Full payment
                    payment = Payment(
                        id=uuid.uuid4(),
                        invoice_id=invoice.id,
                        customer_id=invoice.customer_id,
                        amount=invoice.total_amount,
                        payment_method=random.choice(['cash', 'card', 'bank']),
                        payment_date=invoice.created_at + timedelta(days=random.randint(0, 30)),
                        description="Full payment received"
                    )
                    db.add(payment)
                    payments.append(payment)
                else:
                    # Partial payment (50-80% of total)
                    partial_amount = invoice.total_amount * Decimal(str(random.uniform(0.5, 0.8)))
                    payment = Payment(
                        id=uuid.uuid4(),
                        invoice_id=invoice.id,
                        customer_id=invoice.customer_id,
                        amount=partial_amount,
                        payment_method=random.choice(['cash', 'card', 'bank']),
                        payment_date=invoice.created_at + timedelta(days=random.randint(0, 15)),
                        description="Partial payment received"
                    )
                    db.add(payment)
                    payments.append(payment)
        
        db.commit()
        print(f"✅ Created {len(payments)} payments")
        
        # 6. Update Company Settings
        print("⚙️ Updating company settings...")
        
        company_settings = db.query(CompanySettings).first()
        if not company_settings:
            company_settings = CompanySettings(
                id=uuid.uuid4(),
                company_name='Golden Treasures Jewelry',
                company_address='123 Gold Street, Jewelry District, Tehran, Iran',
                default_gold_price=Decimal('65.00'),
                default_labor_percentage=Decimal('15.00'),
                default_profit_percentage=Decimal('20.00'),
                default_vat_percentage=Decimal('9.00')
            )
            db.add(company_settings)
            db.commit()
            print("✅ Created company settings")
        else:
            print("✅ Company settings already exist")
        
        # 7. Create additional test users
        print("👤 Creating additional test users...")
        
        # Get roles
        owner_role = db.query(Role).filter(Role.name == 'Owner').first()
        
        # Create manager and cashier roles if they don't exist
        manager_role = db.query(Role).filter(Role.name == 'Manager').first()
        if not manager_role:
            manager_role = Role(
                id=uuid.uuid4(),
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
                    "edit_settings": True,
                    "manage_roles": False,
                    "manage_users": False
                }
            )
            db.add(manager_role)
        
        cashier_role = db.query(Role).filter(Role.name == 'Cashier').first()
        if not cashier_role:
            cashier_role = Role(
                id=uuid.uuid4(),
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
            db.add(cashier_role)
        
        db.commit()
        
        # Create test users
        test_users = [
            {"username": "manager", "email": "manager@goldshop.com", "password": "manager123", "role": manager_role},
            {"username": "cashier", "email": "cashier@goldshop.com", "password": "cashier123", "role": cashier_role}
        ]
        
        for user_data in test_users:
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing_user:
                user = User(
                    id=uuid.uuid4(),
                    username=user_data["username"],
                    email=user_data["email"],
                    password_hash=get_password_hash(user_data["password"]),
                    role_id=user_data["role"].id,
                    is_active=True
                )
                db.add(user)
        
        db.commit()
        print("✅ Created additional test users")
        
        print("\n🎉 Comprehensive database seeding completed successfully!")
        print("\n📊 Summary:")
        print(f"   • {len(categories)} Categories")
        print(f"   • {len(customers)} Customers")
        print(f"   • {len(inventory_items)} Inventory Items")
        print(f"   • {len(invoices)} Invoices")
        print(f"   • {len(payments)} Payments")
        print(f"   • Company Settings")
        print(f"   • Test Users (admin, manager, cashier)")
        
        print("\n🔑 Login Credentials:")
        print("   • Owner: admin / admin123")
        print("   • Manager: manager / manager123")
        print("   • Cashier: cashier / cashier123")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    force = len(sys.argv) > 1 and sys.argv[1] == "--force"
    create_comprehensive_seed_data(force=force)