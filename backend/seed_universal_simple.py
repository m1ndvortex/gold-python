#!/usr/bin/env python3
"""
Simplified Universal Data Seeding Script
Creates basic test data for the new universal structure
"""

import uuid
import random
import json
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import text
from database import engine

def create_business_config():
    """Create business configuration"""
    print("⚙️ Creating business configuration...")
    
    with engine.connect() as conn:
        config_data = {
            'default_currency': 'USD',
            'tax_rate': 9.0,
            'supports_gold_invoices': True,
            'supports_general_invoices': True
        }
        
        conn.execute(text("""
            INSERT INTO business_configurations (
                id, business_type, business_name, configuration
            ) VALUES (
                gen_random_uuid(), 'universal_jewelry', 'Universal Jewelry Shop', :config
            )
        """), {'config': json.dumps(config_data)})
        
        conn.commit()
    print("✅ Business configuration created")

def create_categories():
    """Create basic category structure"""
    print("📂 Creating categories...")
    
    categories = [
        {'name': 'Jewelry', 'path': 'jewelry', 'level': 0, 'parent_id': None},
        {'name': 'Rings', 'path': 'jewelry.rings', 'level': 1, 'parent_id': None},
        {'name': 'Necklaces', 'path': 'jewelry.necklaces', 'level': 1, 'parent_id': None},
        {'name': 'Bracelets', 'path': 'jewelry.bracelets', 'level': 1, 'parent_id': None},
        {'name': 'Precious Metals', 'path': 'metals', 'level': 0, 'parent_id': None},
        {'name': 'Gold', 'path': 'metals.gold', 'level': 1, 'parent_id': None},
        {'name': 'Silver', 'path': 'metals.silver', 'level': 1, 'parent_id': None}
    ]
    
    with engine.connect() as conn:
        category_ids = {}
        
        for cat in categories:
            cat_id = str(uuid.uuid4())
            
            # Find parent ID if needed
            parent_id = None
            if cat['level'] > 0:
                parent_path = '.'.join(cat['path'].split('.')[:-1])
                parent_id = category_ids.get(parent_path)
            
            conn.execute(text("""
                INSERT INTO categories_new (
                    id, name, path, level, parent_id, attribute_schema, is_active
                ) VALUES (
                    :id, :name, :path, :level, :parent_id, :schema, true
                )
            """), {
                'id': cat_id,
                'name': cat['name'],
                'path': cat['path'],
                'level': cat['level'],
                'parent_id': parent_id,
                'schema': json.dumps([])
            })
            
            category_ids[cat['path']] = cat_id
        
        conn.commit()
    
    print(f"✅ Created {len(categories)} categories")
    return category_ids

def create_inventory_items(category_ids):
    """Create basic inventory items"""
    print("💎 Creating inventory items...")
    
    items = [
        {
            'name': 'Gold Wedding Ring',
            'category': 'jewelry.rings',
            'cost_price': 500.00,
            'sale_price': 750.00,
            'stock': 10,
            'weight': 5.2
        },
        {
            'name': 'Diamond Necklace',
            'category': 'jewelry.necklaces',
            'cost_price': 1200.00,
            'sale_price': 1800.00,
            'stock': 5,
            'weight': 8.5
        },
        {
            'name': 'Silver Bracelet',
            'category': 'jewelry.bracelets',
            'cost_price': 150.00,
            'sale_price': 225.00,
            'stock': 15,
            'weight': 12.3
        },
        {
            'name': '1oz Gold Coin',
            'category': 'metals.gold',
            'cost_price': 2000.00,
            'sale_price': 2100.00,
            'stock': 20,
            'weight': 31.1
        },
        {
            'name': '10oz Silver Bar',
            'category': 'metals.silver',
            'cost_price': 250.00,
            'sale_price': 280.00,
            'stock': 25,
            'weight': 311.0
        }
    ]
    
    with engine.connect() as conn:
        item_ids = []
        
        for item in items:
            item_id = str(uuid.uuid4())
            category_id = category_ids.get(item['category'])
            
            if not category_id:
                continue
            
            sku = f"SKU-{random.randint(100000, 999999)}"
            barcode = ''.join(random.choices('0123456789', k=13))
            qr_code = str(uuid.uuid4()).replace('-', '').upper()[:16]
            
            conn.execute(text("""
                INSERT INTO inventory_items_new (
                    id, sku, barcode, qr_code, name, category_id,
                    cost_price, sale_price, stock_quantity, weight_grams,
                    custom_attributes, tags, business_type_fields, is_active
                ) VALUES (
                    :id, :sku, :barcode, :qr_code, :name, :category_id,
                    :cost_price, :sale_price, :stock_quantity, :weight_grams,
                    :custom_attributes, :tags, :business_type_fields, true
                )
            """), {
                'id': item_id,
                'sku': sku,
                'barcode': barcode,
                'qr_code': qr_code,
                'name': item['name'],
                'category_id': category_id,
                'cost_price': Decimal(str(item['cost_price'])),
                'sale_price': Decimal(str(item['sale_price'])),
                'stock_quantity': Decimal(str(item['stock'])),
                'weight_grams': Decimal(str(item['weight'])),
                'custom_attributes': json.dumps({'Material': 'Gold' if 'Gold' in item['name'] else 'Silver'}),
                'tags': ['jewelry', 'premium'],
                'business_type_fields': json.dumps({'handmade': False})
            })
            
            item_ids.append({'id': item_id, 'name': item['name']})
        
        conn.commit()
    
    print(f"✅ Created {len(item_ids)} inventory items")
    return item_ids

def create_customers():
    """Create sample customers"""
    print("👥 Creating customers...")
    
    customers = [
        {'name': 'John Smith', 'phone': '+1-555-0101', 'email': 'john@example.com'},
        {'name': 'Sarah Johnson', 'phone': '+1-555-0102', 'email': 'sarah@example.com'},
        {'name': 'Mike Davis', 'phone': '+1-555-0103', 'email': 'mike@example.com'},
        {'name': 'Lisa Wilson', 'phone': '+1-555-0104', 'email': 'lisa@example.com'},
        {'name': 'David Brown', 'phone': '+1-555-0105', 'email': 'david@example.com'}
    ]
    
    with engine.connect() as conn:
        customer_ids = []
        
        for customer in customers:
            customer_id = str(uuid.uuid4())
            
            conn.execute(text("""
                INSERT INTO customers (
                    id, name, phone, email, current_debt, is_active
                ) VALUES (
                    :id, :name, :phone, :email, :debt, true
                )
            """), {
                'id': customer_id,
                'name': customer['name'],
                'phone': customer['phone'],
                'email': customer['email'],
                'debt': Decimal(str(random.uniform(0, 500)))
            })
            
            customer_ids.append({'id': customer_id, 'name': customer['name']})
        
        conn.commit()
    
    print(f"✅ Created {len(customer_ids)} customers")
    return customer_ids

def create_invoices(item_ids, customer_ids):
    """Create sample invoices (both Gold and General)"""
    print("🧾 Creating invoices...")
    
    with engine.connect() as conn:
        invoice_ids = []
        
        for i in range(10):
            invoice_id = str(uuid.uuid4())
            customer = random.choice(customer_ids)
            invoice_type = random.choice(['gold', 'general'])
            
            # Basic invoice data
            subtotal = Decimal(str(random.uniform(500, 2000)))
            tax_amount = subtotal * Decimal('0.09')
            total_amount = subtotal + tax_amount
            
            qr_code = f"QR{random.randint(100000, 999999)}"
            card_url = f"https://goldshop.com/card/{qr_code}"
            
            # Gold-specific fields
            gold_sood = None
            gold_ojrat = None
            gold_maliyat = None
            
            if invoice_type == 'gold':
                gold_sood = subtotal * Decimal('0.20')
                gold_ojrat = subtotal * Decimal('0.15')
                gold_maliyat = tax_amount
            
            conn.execute(text("""
                INSERT INTO invoices_new (
                    id, invoice_number, type, status, customer_id, customer_name,
                    subtotal, tax_amount, total_amount, payment_status,
                    gold_sood, gold_ojrat, gold_maliyat, qr_code, card_url
                ) VALUES (
                    :id, :invoice_number, :type, :status, :customer_id, :customer_name,
                    :subtotal, :tax_amount, :total_amount, :payment_status,
                    :gold_sood, :gold_ojrat, :gold_maliyat, :qr_code, :card_url
                )
            """), {
                'id': invoice_id,
                'invoice_number': f"INV-2024-{1000 + i:04d}",
                'type': invoice_type,
                'status': random.choice(['draft', 'approved']),
                'customer_id': customer['id'],
                'customer_name': customer['name'],
                'subtotal': subtotal,
                'tax_amount': tax_amount,
                'total_amount': total_amount,
                'payment_status': random.choice(['unpaid', 'paid']),
                'gold_sood': gold_sood,
                'gold_ojrat': gold_ojrat,
                'gold_maliyat': gold_maliyat,
                'qr_code': qr_code,
                'card_url': card_url
            })
            
            # Add invoice items
            selected_items = random.sample(item_ids, random.randint(1, 3))
            for item in selected_items:
                quantity = random.randint(1, 2)
                unit_price = Decimal(str(random.uniform(100, 500)))
                line_total = unit_price * quantity
                
                conn.execute(text("""
                    INSERT INTO invoice_items_new (
                        id, invoice_id, inventory_item_id, item_name,
                        quantity, unit_price, total_price, custom_attributes
                    ) VALUES (
                        :id, :invoice_id, :inventory_item_id, :item_name,
                        :quantity, :unit_price, :total_price, :custom_attributes
                    )
                """), {
                    'id': str(uuid.uuid4()),
                    'invoice_id': invoice_id,
                    'inventory_item_id': item['id'],
                    'item_name': item['name'],
                    'quantity': Decimal(str(quantity)),
                    'unit_price': unit_price,
                    'total_price': line_total,
                    'custom_attributes': json.dumps({})
                })
            
            invoice_ids.append({'id': invoice_id, 'type': invoice_type})
        
        conn.commit()
    
    print(f"✅ Created {len(invoice_ids)} invoices")
    return invoice_ids

def create_chart_of_accounts():
    """Create basic chart of accounts"""
    print("📊 Creating chart of accounts...")
    
    accounts = [
        {'code': '1000', 'name': 'Assets', 'type': 'asset', 'path': 'assets'},
        {'code': '1100', 'name': 'Cash', 'type': 'asset', 'path': 'assets.cash'},
        {'code': '1200', 'name': 'Inventory', 'type': 'asset', 'path': 'assets.inventory'},
        {'code': '2000', 'name': 'Liabilities', 'type': 'liability', 'path': 'liabilities'},
        {'code': '3000', 'name': 'Equity', 'type': 'equity', 'path': 'equity'},
        {'code': '4000', 'name': 'Revenue', 'type': 'revenue', 'path': 'revenue'},
        {'code': '4100', 'name': 'Sales Revenue', 'type': 'revenue', 'path': 'revenue.sales'},
        {'code': '5000', 'name': 'Expenses', 'type': 'expense', 'path': 'expenses'}
    ]
    
    with engine.connect() as conn:
        for account in accounts:
            level = account['path'].count('.')
            
            conn.execute(text("""
                INSERT INTO chart_of_accounts (
                    id, account_code, account_name, account_type, account_path, level, is_active
                ) VALUES (
                    gen_random_uuid(), :code, :name, :type, :path, :level, true
                )
            """), {
                'code': account['code'],
                'name': account['name'],
                'type': account['type'],
                'path': account['path'],
                'level': level
            })
        
        conn.commit()
    
    print(f"✅ Created {len(accounts)} chart of accounts")

def run_simple_seeding():
    """Run simplified universal data seeding"""
    print("🚀 Starting Simplified Universal Data Seeding")
    print("=" * 60)
    
    try:
        # Step 1: Business configuration
        create_business_config()
        
        # Step 2: Categories
        category_ids = create_categories()
        
        # Step 3: Inventory items
        item_ids = create_inventory_items(category_ids)
        
        # Step 4: Customers
        customer_ids = create_customers()
        
        # Step 5: Invoices
        invoice_ids = create_invoices(item_ids, customer_ids)
        
        # Step 6: Chart of accounts
        create_chart_of_accounts()
        
        print("\n" + "=" * 60)
        print("✅ Simplified universal data seeding completed!")
        print("\n📊 Summary:")
        print(f"   • Categories: {len(category_ids)}")
        print(f"   • Inventory Items: {len(item_ids)}")
        print(f"   • Customers: {len(customer_ids)}")
        print(f"   • Invoices: {len(invoice_ids)}")
        print("   • Chart of Accounts: 8")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Seeding failed: {e}")
        return False

if __name__ == "__main__":
    success = run_simple_seeding()
    if not success:
        exit(1)