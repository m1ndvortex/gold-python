#!/usr/bin/env python3
"""
Universal Inventory and Invoice Management System - Comprehensive Seed Data
This script creates fresh test data according to the new universal structure including:
- Unlimited nested categories with custom attributes
- Universal inventory items with SKU, barcode, QR codes, tags
- Both Gold and General invoice types
- Image management data
- Double-entry accounting data
- QR invoice cards
"""

import uuid
import random
import string
import json
from datetime import datetime, timedelta, date
from decimal import Decimal
from sqlalchemy import text
from database import engine
from sqlalchemy.orm import Session

def generate_sku():
    """Generate a unique SKU"""
    prefix = random.choice(['GLD', 'SLV', 'JWL', 'ACC', 'GEM'])
    number = ''.join(random.choices(string.digits, k=6))
    return f"{prefix}-{number}"

def generate_barcode():
    """Generate a unique barcode (EAN-13 format)"""
    return ''.join(random.choices(string.digits, k=13))

def generate_qr_code():
    """Generate a unique QR code"""
    return str(uuid.uuid4()).replace('-', '').upper()[:16]

def create_business_configuration():
    """Create business configuration"""
    print("⚙️ Creating business configuration...")
    
    with engine.connect() as conn:
        # Insert business configuration
        conn.execute(text("""
            INSERT INTO business_configurations (
                id, business_type, business_name, configuration, 
                terminology_mapping, workflow_config, feature_flags
            ) VALUES (
                :id, :business_type, :business_name, :configuration::jsonb,
                :terminology_mapping::jsonb, :workflow_config::jsonb, :feature_flags::jsonb
            )
        """), {
            'id': str(uuid.uuid4()),
            'business_type': 'universal_jewelry',
            'business_name': 'Universal Jewelry & Gold Shop',
            'configuration': json.dumps({
                'default_currency': 'USD',
                'tax_rate': 9.0,
                'labor_cost_percentage': 15.0,
                'profit_margin': 20.0,
                'supports_gold_invoices': True,
                'supports_general_invoices': True,
                'inventory_tracking': True,
                'multi_unit_support': True
            }),
            'terminology_mapping': json.dumps({
                'en': {
                    'inventory': 'Inventory',
                    'categories': 'Categories',
                    'invoices': 'Invoices',
                    'customers': 'Customers'
                },
                'fa': {
                    'inventory': 'موجودی',
                    'categories': 'دسته‌بندی‌ها',
                    'invoices': 'فاکتورها',
                    'customers': 'مشتریان'
                }
            }),
            'workflow_config': json.dumps({
                'invoice_approval_required': False,
                'automatic_stock_deduction': True,
                'qr_cards_enabled': True,
                'audit_trail_enabled': True
            }),
            'feature_flags': json.dumps({
                'nested_categories': True,
                'custom_attributes': True,
                'image_management': True,
                'barcode_scanning': True,
                'qr_code_generation': True,
                'double_entry_accounting': True
            })
        })
        
        conn.commit()
    
    print("✅ Business configuration created")

def create_nested_categories():
    """Create unlimited nested categories with LTREE paths"""
    print("📂 Creating nested categories with LTREE paths...")
    
    categories_data = [
        # Level 1 - Main Categories
        {'name': 'Jewelry', 'name_persian': 'جواهرات', 'parent': None, 'path': 'jewelry', 'level': 0, 'icon': '💎', 'color': '#FFD700'},
        {'name': 'Precious Metals', 'name_persian': 'فلزات گرانبها', 'parent': None, 'path': 'metals', 'level': 0, 'icon': '🥇', 'color': '#FFA500'},
        {'name': 'Gemstones', 'name_persian': 'سنگ‌های قیمتی', 'parent': None, 'path': 'gems', 'level': 0, 'icon': '💍', 'color': '#FF6B6B'},
        {'name': 'Accessories', 'name_persian': 'لوازم جانبی', 'parent': None, 'path': 'accessories', 'level': 0, 'icon': '👜', 'color': '#4ECDC4'},
        
        # Level 2 - Jewelry Subcategories
        {'name': 'Rings', 'name_persian': 'انگشتر', 'parent': 'jewelry', 'path': 'jewelry.rings', 'level': 1, 'icon': '💍', 'color': '#FFD700'},
        {'name': 'Necklaces', 'name_persian': 'گردنبند', 'parent': 'jewelry', 'path': 'jewelry.necklaces', 'level': 1, 'icon': '📿', 'color': '#FFA500'},
        {'name': 'Bracelets', 'name_persian': 'دستبند', 'parent': 'jewelry', 'path': 'jewelry.bracelets', 'level': 1, 'icon': '⚡', 'color': '#FF8C00'},
        {'name': 'Earrings', 'name_persian': 'گوشواره', 'parent': 'jewelry', 'path': 'jewelry.earrings', 'level': 1, 'icon': '💎', 'color': '#DAA520'},
        {'name': 'Watches', 'name_persian': 'ساعت', 'parent': 'jewelry', 'path': 'jewelry.watches', 'level': 1, 'icon': '⌚', 'color': '#CD853F'},
        
        # Level 3 - Ring Subcategories
        {'name': 'Wedding Rings', 'name_persian': 'حلقه ازدواج', 'parent': 'jewelry.rings', 'path': 'jewelry.rings.wedding', 'level': 2, 'icon': '💒', 'color': '#FFE4E1'},
        {'name': 'Engagement Rings', 'name_persian': 'انگشتر نامزدی', 'parent': 'jewelry.rings', 'path': 'jewelry.rings.engagement', 'level': 2, 'icon': '💖', 'color': '#FFB6C1'},
        {'name': 'Fashion Rings', 'name_persian': 'انگشتر مد', 'parent': 'jewelry.rings', 'path': 'jewelry.rings.fashion', 'level': 2, 'icon': '✨', 'color': '#DDA0DD'},
        {'name': 'Signet Rings', 'name_persian': 'انگشتر مهر', 'parent': 'jewelry.rings', 'path': 'jewelry.rings.signet', 'level': 2, 'icon': '🔱', 'color': '#B8860B'},
        
        # Level 4 - Wedding Ring Subcategories
        {'name': 'Gold Wedding Bands', 'name_persian': 'حلقه طلا', 'parent': 'jewelry.rings.wedding', 'path': 'jewelry.rings.wedding.gold', 'level': 3, 'icon': '🟡', 'color': '#FFD700'},
        {'name': 'Platinum Wedding Bands', 'name_persian': 'حلقه پلاتین', 'parent': 'jewelry.rings.wedding', 'path': 'jewelry.rings.wedding.platinum', 'level': 3, 'icon': '⚪', 'color': '#E5E4E2'},
        {'name': 'Diamond Wedding Bands', 'name_persian': 'حلقه الماس', 'parent': 'jewelry.rings.wedding', 'path': 'jewelry.rings.wedding.diamond', 'level': 3, 'icon': '💎', 'color': '#B9F2FF'},
        
        # Level 2 - Precious Metals Subcategories
        {'name': 'Gold', 'name_persian': 'طلا', 'parent': 'metals', 'path': 'metals.gold', 'level': 1, 'icon': '🟨', 'color': '#FFD700'},
        {'name': 'Silver', 'name_persian': 'نقره', 'parent': 'metals', 'path': 'metals.silver', 'level': 1, 'icon': '⚪', 'color': '#C0C0C0'},
        {'name': 'Platinum', 'name_persian': 'پلاتین', 'parent': 'metals', 'path': 'metals.platinum', 'level': 1, 'icon': '🔘', 'color': '#E5E4E2'},
        
        # Level 3 - Gold Subcategories
        {'name': '24K Gold', 'name_persian': 'طلای ۲۴ عیار', 'parent': 'metals.gold', 'path': 'metals.gold.24k', 'level': 2, 'icon': '🥇', 'color': '#FFD700'},
        {'name': '22K Gold', 'name_persian': 'طلای ۲۲ عیار', 'parent': 'metals.gold', 'path': 'metals.gold.22k', 'level': 2, 'icon': '🥈', 'color': '#FFC700'},
        {'name': '18K Gold', 'name_persian': 'طلای ۱۸ عیار', 'parent': 'metals.gold', 'path': 'metals.gold.18k', 'level': 2, 'icon': '🥉', 'color': '#FFB700'},
        {'name': '14K Gold', 'name_persian': 'طلای ۱۴ عیار', 'parent': 'metals.gold', 'path': 'metals.gold.14k', 'level': 2, 'icon': '🟡', 'color': '#FFA700'},
    ]
    
    # Create attribute schemas for different category types
    attribute_schemas = {
        'jewelry': [
            {'name': 'Material', 'type': 'enum', 'options': ['Gold', 'Silver', 'Platinum', 'Titanium'], 'required': True},
            {'name': 'Purity', 'type': 'enum', 'options': ['24K', '22K', '18K', '14K', '10K'], 'required': False},
            {'name': 'Weight', 'type': 'number', 'unit': 'grams', 'required': True},
            {'name': 'Size', 'type': 'text', 'required': False},
            {'name': 'Brand', 'type': 'text', 'required': False},
            {'name': 'Origin', 'type': 'text', 'required': False}
        ],
        'rings': [
            {'name': 'Ring Size', 'type': 'enum', 'options': ['5', '6', '7', '8', '9', '10', '11', '12'], 'required': True},
            {'name': 'Stone Type', 'type': 'enum', 'options': ['Diamond', 'Ruby', 'Sapphire', 'Emerald', 'None'], 'required': False},
            {'name': 'Stone Weight', 'type': 'number', 'unit': 'carats', 'required': False},
            {'name': 'Setting Style', 'type': 'enum', 'options': ['Prong', 'Bezel', 'Channel', 'Pave'], 'required': False}
        ],
        'metals': [
            {'name': 'Purity', 'type': 'enum', 'options': ['99.9%', '99.5%', '95%', '92.5%'], 'required': True},
            {'name': 'Form', 'type': 'enum', 'options': ['Bar', 'Coin', 'Round', 'Sheet', 'Wire'], 'required': True},
            {'name': 'Mint', 'type': 'text', 'required': False},
            {'name': 'Certificate', 'type': 'boolean', 'required': False}
        ]
    }
    
    with engine.connect() as conn:
        category_map = {}
        
        for cat_data in categories_data:
            cat_id = str(uuid.uuid4())
            
            # Determine parent_id
            parent_id = None
            if cat_data['parent']:
                parent_id = category_map.get(cat_data['parent'])
            
            # Determine attribute schema
            schema = []
            if 'rings' in cat_data['path']:
                schema = attribute_schemas.get('rings', [])
            elif 'jewelry' in cat_data['path']:
                schema = attribute_schemas.get('jewelry', [])
            elif 'metals' in cat_data['path']:
                schema = attribute_schemas.get('metals', [])
            
            conn.execute(text("""
                INSERT INTO categories_new (
                    id, name, name_persian, parent_id, path, level,
                    attribute_schema, description, icon, color, sort_order,
                    business_type, is_active
                ) VALUES (
                    :id, :name, :name_persian, :parent_id, :path, :level,
                    :attribute_schema::jsonb, :description, :icon, :color, :sort_order,
                    :business_type, :is_active
                )
            """), {
                'id': cat_id,
                'name': cat_data['name'],
                'name_persian': cat_data['name_persian'],
                'parent_id': parent_id,
                'path': cat_data['path'],
                'level': cat_data['level'],
                'attribute_schema': json.dumps(schema),
                'description': f"Category for {cat_data['name'].lower()}",
                'icon': cat_data['icon'],
                'color': cat_data['color'],
                'sort_order': len(category_map),
                'business_type': 'universal',
                'is_active': True
            })
            
            category_map[cat_data['path']] = cat_id
        
        conn.commit()
    
    print(f"✅ Created {len(categories_data)} nested categories")
    return category_map

def create_universal_inventory_items(category_map):
    """Create universal inventory items with all new features"""
    print("💎 Creating universal inventory items...")
    
    # Sample inventory items with realistic data
    items_data = [
        # Wedding Rings
        {
            'name': 'Classic Gold Wedding Band',
            'name_persian': 'حلقه طلای کلاسیک',
            'category_path': 'jewelry.rings.wedding.gold',
            'cost_price': 850.00,
            'sale_price': 1200.00,
            'stock_quantity': 15,
            'weight_grams': 5.2,
            'custom_attributes': {
                'Material': 'Gold',
                'Purity': '18K',
                'Weight': 5.2,
                'Ring Size': '7',
                'Brand': 'Classic Jewelry Co.'
            },
            'tags': ['wedding', 'classic', 'gold', 'band', 'unisex'],
            'business_type_fields': {
                'gold_purity': 18,
                'labor_cost_percentage': 15,
                'is_handmade': False
            }
        },
        {
            'name': 'Diamond Engagement Ring',
            'name_persian': 'انگشتر نامزدی الماس',
            'category_path': 'jewelry.rings.engagement',
            'cost_price': 2500.00,
            'sale_price': 3800.00,
            'stock_quantity': 8,
            'weight_grams': 3.8,
            'custom_attributes': {
                'Material': 'Gold',
                'Purity': '18K',
                'Weight': 3.8,
                'Ring Size': '6',
                'Stone Type': 'Diamond',
                'Stone Weight': 1.0,
                'Setting Style': 'Prong'
            },
            'tags': ['engagement', 'diamond', 'luxury', 'solitaire'],
            'business_type_fields': {
                'gold_purity': 18,
                'diamond_certification': 'GIA',
                'is_certified': True
            }
        },
        
        # Necklaces
        {
            'name': 'Gold Chain Necklace 24K',
            'name_persian': 'گردنبند زنجیری طلای ۲۴ عیار',
            'category_path': 'jewelry.necklaces',
            'cost_price': 2800.00,
            'sale_price': 3500.00,
            'stock_quantity': 12,
            'weight_grams': 15.3,
            'custom_attributes': {
                'Material': 'Gold',
                'Purity': '24K',
                'Weight': 15.3,
                'Size': '18 inches',
                'Brand': 'Pure Gold Jewelry'
            },
            'tags': ['necklace', 'chain', '24k', 'pure gold', 'luxury'],
            'business_type_fields': {
                'gold_purity': 24,
                'chain_type': 'Byzantine',
                'clasp_type': 'Lobster'
            }
        },
        
        # Bracelets
        {
            'name': 'Tennis Bracelet with Diamonds',
            'name_persian': 'دستبند تنیس با الماس',
            'category_path': 'jewelry.bracelets',
            'cost_price': 2200.00,
            'sale_price': 3200.00,
            'stock_quantity': 6,
            'weight_grams': 8.9,
            'custom_attributes': {
                'Material': 'Gold',
                'Purity': '18K',
                'Weight': 8.9,
                'Size': '7 inches',
                'Stone Type': 'Diamond',
                'Stone Weight': 2.5
            },
            'tags': ['bracelet', 'tennis', 'diamond', 'elegant', 'formal'],
            'business_type_fields': {
                'gold_purity': 18,
                'diamond_count': 25,
                'total_carat_weight': 2.5
            }
        },
        
        # Watches
        {
            'name': 'Luxury Gold Watch',
            'name_persian': 'ساعت طلای لوکس',
            'category_path': 'jewelry.watches',
            'cost_price': 5500.00,
            'sale_price': 7800.00,
            'stock_quantity': 3,
            'weight_grams': 45.2,
            'custom_attributes': {
                'Material': 'Gold',
                'Purity': '18K',
                'Weight': 45.2,
                'Brand': 'Swiss Luxury',
                'Movement': 'Automatic'
            },
            'tags': ['watch', 'luxury', 'swiss', 'automatic', 'gold'],
            'business_type_fields': {
                'gold_purity': 18,
                'movement_type': 'Automatic',
                'water_resistance': '50m',
                'warranty_years': 2
            }
        },
        
        # Gold Bars and Coins
        {
            'name': '1oz Gold Eagle Coin',
            'name_persian': 'سکه طلای عقاب یک اونس',
            'category_path': 'metals.gold.22k',
            'cost_price': 2100.00,
            'sale_price': 2250.00,
            'stock_quantity': 25,
            'weight_grams': 31.1,
            'custom_attributes': {
                'Purity': '22K',
                'Form': 'Coin',
                'Mint': 'US Mint',
                'Certificate': True,
                'Year': '2024'
            },
            'tags': ['coin', 'gold', 'investment', 'eagle', 'certified'],
            'business_type_fields': {
                'gold_purity': 22,
                'mint_year': 2024,
                'is_investment_grade': True,
                'certificate_number': 'USM2024001'
            }
        },
        
        {
            'name': '10oz Silver Bar',
            'name_persian': 'شمش نقره ۱۰ اونس',
            'category_path': 'metals.silver',
            'cost_price': 280.00,
            'sale_price': 320.00,
            'stock_quantity': 40,
            'weight_grams': 311.0,
            'custom_attributes': {
                'Purity': '99.9%',
                'Form': 'Bar',
                'Mint': 'PAMP Suisse',
                'Certificate': True
            },
            'tags': ['silver', 'bar', 'investment', 'pamp', 'certified'],
            'business_type_fields': {
                'silver_purity': 99.9,
                'is_investment_grade': True,
                'serial_number': 'PS2024S001'
            }
        }
    ]
    
    with engine.connect() as conn:
        items_created = []
        
        for item_data in items_data:
            item_id = str(uuid.uuid4())
            category_id = category_map.get(item_data['category_path'])
            
            if not category_id:
                print(f"⚠️ Category not found for path: {item_data['category_path']}")
                continue
            
            # Generate unique identifiers
            sku = generate_sku()
            barcode = generate_barcode()
            qr_code = generate_qr_code()
            
            conn.execute(text("""
                INSERT INTO inventory_items_new (
                    id, sku, barcode, qr_code, name, name_persian, description,
                    category_id, cost_price, sale_price, currency, stock_quantity,
                    unit_of_measure, low_stock_threshold, custom_attributes, tags,
                    weight_grams, business_type_fields, is_active
                ) VALUES (
                    :id, :sku, :barcode, :qr_code, :name, :name_persian, :description,
                    :category_id, :cost_price, :sale_price, :currency, :stock_quantity,
                    :unit_of_measure, :low_stock_threshold, :custom_attributes::jsonb, :tags,
                    :weight_grams, :business_type_fields::jsonb, :is_active
                )
            """), {
                'id': item_id,
                'sku': sku,
                'barcode': barcode,
                'qr_code': qr_code,
                'name': item_data['name'],
                'name_persian': item_data['name_persian'],
                'description': f"High-quality {item_data['name'].lower()} with premium materials and craftsmanship",
                'category_id': category_id,
                'cost_price': Decimal(str(item_data['cost_price'])),
                'sale_price': Decimal(str(item_data['sale_price'])),
                'currency': 'USD',
                'stock_quantity': Decimal(str(item_data['stock_quantity'])),
                'unit_of_measure': 'piece',
                'low_stock_threshold': Decimal('5'),
                'custom_attributes': json.dumps(item_data['custom_attributes']),
                'tags': item_data['tags'],
                'weight_grams': Decimal(str(item_data['weight_grams'])),
                'business_type_fields': json.dumps(item_data['business_type_fields']),
                'is_active': True
            })
            
            items_created.append({
                'id': item_id,
                'name': item_data['name'],
                'sku': sku,
                'category_path': item_data['category_path']
            })
        
        conn.commit()
    
    print(f"✅ Created {len(items_created)} universal inventory items")
    return items_created

def create_dual_invoices(inventory_items):
    """Create both Gold and General invoice types"""
    print("🧾 Creating dual invoice system (Gold & General)...")
    
    # Get some customers (assuming they exist from previous seeding)
    with engine.connect() as conn:
        # Check if customers exist
        customer_count = conn.execute(text("SELECT COUNT(*) FROM customers")).scalar()
        if customer_count == 0:
            print("⚠️ No customers found - creating sample customers first")
            create_sample_customers()
        
        # Get customer IDs
        customers = conn.execute(text("SELECT id, name FROM customers LIMIT 10")).fetchall()
        
        invoices_created = []
        
        # Create 15 invoices (mix of Gold and General)
        for i in range(15):
            invoice_id = str(uuid.uuid4())
            customer = random.choice(customers)
            
            # Randomly choose invoice type
            invoice_type = random.choice(['gold', 'general'])
            
            # Generate invoice number
            invoice_number = f"INV-2024-{1000 + i:04d}"
            
            # Random date in last 60 days
            invoice_date = datetime.now() - timedelta(days=random.randint(0, 60))
            
            # Generate QR code for invoice card
            qr_code = generate_qr_code()
            card_url = f"https://goldshop.com/invoice-card/{qr_code}"
            
            # Select random items for invoice
            selected_items = random.sample(inventory_items, random.randint(1, 4))
            
            subtotal = Decimal('0')
            total_weight = Decimal('0')
            
            # Calculate totals
            for item in selected_items:
                quantity = random.randint(1, 2)
                # Get item details from database
                item_details = conn.execute(text("""
                    SELECT sale_price, weight_grams FROM inventory_items_new WHERE id = :id
                """), {'id': item['id']}).fetchone()
                
                if item_details:
                    line_total = item_details[0] * quantity
                    subtotal += line_total
                    total_weight += (item_details[1] or Decimal('0')) * quantity
            
            # Calculate taxes and totals
            tax_rate = Decimal('0.09')  # 9% tax
            tax_amount = subtotal * tax_rate
            total_amount = subtotal + tax_amount
            
            # Gold-specific calculations
            gold_sood = None
            gold_ojrat = None
            gold_maliyat = None
            gold_price_per_gram = None
            labor_cost_percentage = None
            profit_percentage = None
            vat_percentage = None
            
            if invoice_type == 'gold':
                gold_price_per_gram = Decimal('65.00')
                labor_cost_percentage = Decimal('15.00')
                profit_percentage = Decimal('20.00')
                vat_percentage = Decimal('9.00')
                
                # Calculate Gold-specific amounts
                gold_sood = subtotal * Decimal('0.20')  # 20% profit
                gold_ojrat = subtotal * Decimal('0.15')  # 15% labor
                gold_maliyat = tax_amount  # Tax amount
            
            # Create invoice
            conn.execute(text("""
                INSERT INTO invoices_new (
                    id, invoice_number, type, status, customer_id, customer_name,
                    subtotal, tax_amount, total_amount, currency, payment_status,
                    workflow_stage, stock_affected, qr_code, card_url, card_theme,
                    gold_price_per_gram, labor_cost_percentage, profit_percentage, vat_percentage,
                    gold_sood, gold_ojrat, gold_maliyat, gold_total_weight,
                    created_at
                ) VALUES (
                    :id, :invoice_number, :type, :status, :customer_id, :customer_name,
                    :subtotal, :tax_amount, :total_amount, :currency, :payment_status,
                    :workflow_stage, :stock_affected, :qr_code, :card_url, :card_theme,
                    :gold_price_per_gram, :labor_cost_percentage, :profit_percentage, :vat_percentage,
                    :gold_sood, :gold_ojrat, :gold_maliyat, :gold_total_weight,
                    :created_at
                )
            """), {
                'id': invoice_id,
                'invoice_number': invoice_number,
                'type': invoice_type,
                'status': random.choice(['draft', 'approved']),
                'customer_id': str(customer[0]),
                'customer_name': customer[1],
                'subtotal': subtotal,
                'tax_amount': tax_amount,
                'total_amount': total_amount,
                'currency': 'USD',
                'payment_status': random.choice(['unpaid', 'partial', 'paid']),
                'workflow_stage': random.choice(['draft', 'approved']),
                'stock_affected': random.choice([True, False]),
                'qr_code': qr_code,
                'card_url': card_url,
                'card_theme': random.choice(['glass', 'modern', 'classic']),
                'gold_price_per_gram': gold_price_per_gram,
                'labor_cost_percentage': labor_cost_percentage,
                'profit_percentage': profit_percentage,
                'vat_percentage': vat_percentage,
                'gold_sood': gold_sood,
                'gold_ojrat': gold_ojrat,
                'gold_maliyat': gold_maliyat,
                'gold_total_weight': total_weight if invoice_type == 'gold' else None,
                'created_at': invoice_date
            })
            
            # Create invoice items
            for item in selected_items:
                item_details = conn.execute(text("""
                    SELECT name, sku, sale_price, weight_grams, custom_attributes 
                    FROM inventory_items_new WHERE id = :id
                """), {'id': item['id']}).fetchone()
                
                if item_details:
                    quantity = random.randint(1, 2)
                    unit_price = item_details[2]
                    line_total = unit_price * quantity
                    
                    conn.execute(text("""
                        INSERT INTO invoice_items_new (
                            id, invoice_id, inventory_item_id, item_name, item_sku,
                            quantity, unit_price, total_price, weight_grams,
                            custom_attributes
                        ) VALUES (
                            :id, :invoice_id, :inventory_item_id, :item_name, :item_sku,
                            :quantity, :unit_price, :total_price, :weight_grams,
                            :custom_attributes::jsonb
                        )
                    """), {
                        'id': str(uuid.uuid4()),
                        'invoice_id': invoice_id,
                        'inventory_item_id': item['id'],
                        'item_name': item_details[0],
                        'item_sku': item_details[1],
                        'quantity': Decimal(str(quantity)),
                        'unit_price': unit_price,
                        'total_price': line_total,
                        'weight_grams': (item_details[3] or Decimal('0')) * quantity,
                        'custom_attributes': json.dumps(item_details[4] or {})
                    })
            
            invoices_created.append({
                'id': invoice_id,
                'number': invoice_number,
                'type': invoice_type,
                'total': total_amount
            })
        
        conn.commit()
    
    print(f"✅ Created {len(invoices_created)} invoices (Gold & General types)")
    return invoices_created

def create_sample_customers():
    """Create sample customers if they don't exist"""
    print("👥 Creating sample customers...")
    
    customers_data = [
        {"name": "Ahmad Hassan", "phone": "+1-555-0101", "email": "ahmad.hassan@email.com"},
        {"name": "Sarah Johnson", "phone": "+1-555-0102", "email": "sarah.johnson@email.com"},
        {"name": "Mohammad Ali", "phone": "+1-555-0103", "email": "mohammad.ali@email.com"},
        {"name": "Emily Davis", "phone": "+1-555-0104", "email": "emily.davis@email.com"},
        {"name": "Hassan Rezaei", "phone": "+1-555-0105", "email": "hassan.rezaei@email.com"},
        {"name": "Jennifer Wilson", "phone": "+1-555-0106", "email": "jennifer.wilson@email.com"},
        {"name": "Ali Moradi", "phone": "+1-555-0107", "email": "ali.moradi@email.com"},
        {"name": "Lisa Anderson", "phone": "+1-555-0108", "email": "lisa.anderson@email.com"},
        {"name": "Reza Ghorbani", "phone": "+1-555-0109", "email": "reza.ghorbani@email.com"},
        {"name": "Michelle Brown", "phone": "+1-555-0110", "email": "michelle.brown@email.com"}
    ]
    
    with engine.connect() as conn:
        for customer_data in customers_data:
            conn.execute(text("""
                INSERT INTO customers (
                    id, name, phone, email, current_debt, is_active
                ) VALUES (
                    :id, :name, :phone, :email, :current_debt, :is_active
                )
            """), {
                'id': str(uuid.uuid4()),
                'name': customer_data['name'],
                'phone': customer_data['phone'],
                'email': customer_data['email'],
                'current_debt': Decimal(str(random.uniform(0, 1000))),
                'is_active': True
            })
        
        conn.commit()
    
    print(f"✅ Created {len(customers_data)} sample customers")

def create_chart_of_accounts():
    """Create basic chart of accounts for double-entry accounting"""
    print("📊 Creating chart of accounts...")
    
    accounts_data = [
        # Assets
        {'code': '1000', 'name': 'Assets', 'name_persian': 'دارایی‌ها', 'type': 'asset', 'parent': None, 'path': 'assets'},
        {'code': '1100', 'name': 'Current Assets', 'name_persian': 'دارایی‌های جاری', 'type': 'asset', 'parent': '1000', 'path': 'assets.current'},
        {'code': '1110', 'name': 'Cash', 'name_persian': 'نقد', 'type': 'asset', 'parent': '1100', 'path': 'assets.current.cash'},
        {'code': '1120', 'name': 'Accounts Receivable', 'name_persian': 'حساب‌های دریافتنی', 'type': 'asset', 'parent': '1100', 'path': 'assets.current.receivables'},
        {'code': '1130', 'name': 'Inventory', 'name_persian': 'موجودی کالا', 'type': 'asset', 'parent': '1100', 'path': 'assets.current.inventory'},
        
        # Liabilities
        {'code': '2000', 'name': 'Liabilities', 'name_persian': 'بدهی‌ها', 'type': 'liability', 'parent': None, 'path': 'liabilities'},
        {'code': '2100', 'name': 'Current Liabilities', 'name_persian': 'بدهی‌های جاری', 'type': 'liability', 'parent': '2000', 'path': 'liabilities.current'},
        {'code': '2110', 'name': 'Accounts Payable', 'name_persian': 'حساب‌های پرداختنی', 'type': 'liability', 'parent': '2100', 'path': 'liabilities.current.payables'},
        
        # Equity
        {'code': '3000', 'name': 'Equity', 'name_persian': 'حقوق صاحبان سهام', 'type': 'equity', 'parent': None, 'path': 'equity'},
        {'code': '3100', 'name': 'Owner Equity', 'name_persian': 'حقوق مالک', 'type': 'equity', 'parent': '3000', 'path': 'equity.owner'},
        
        # Revenue
        {'code': '4000', 'name': 'Revenue', 'name_persian': 'درآمد', 'type': 'revenue', 'parent': None, 'path': 'revenue'},
        {'code': '4100', 'name': 'Sales Revenue', 'name_persian': 'درآمد فروش', 'type': 'revenue', 'parent': '4000', 'path': 'revenue.sales'},
        {'code': '4110', 'name': 'Gold Sales', 'name_persian': 'فروش طلا', 'type': 'revenue', 'parent': '4100', 'path': 'revenue.sales.gold'},
        {'code': '4120', 'name': 'General Sales', 'name_persian': 'فروش عمومی', 'type': 'revenue', 'parent': '4100', 'path': 'revenue.sales.general'},
        
        # Expenses
        {'code': '5000', 'name': 'Expenses', 'name_persian': 'هزینه‌ها', 'type': 'expense', 'parent': None, 'path': 'expenses'},
        {'code': '5100', 'name': 'Cost of Goods Sold', 'name_persian': 'بهای تمام شده کالای فروخته شده', 'type': 'expense', 'parent': '5000', 'path': 'expenses.cogs'},
        {'code': '5200', 'name': 'Operating Expenses', 'name_persian': 'هزینه‌های عملیاتی', 'type': 'expense', 'parent': '5000', 'path': 'expenses.operating'},
    ]
    
    with engine.connect() as conn:
        account_map = {}
        
        for account_data in accounts_data:
            account_id = str(uuid.uuid4())
            
            # Find parent ID
            parent_id = None
            if account_data['parent']:
                parent_id = account_map.get(account_data['parent'])
            
            # Calculate level
            level = account_data['path'].count('.') if account_data['path'] else 0
            
            conn.execute(text("""
                INSERT INTO chart_of_accounts (
                    id, account_code, account_name, account_name_persian,
                    account_type, parent_account_id, account_path, level, is_active
                ) VALUES (
                    :id, :account_code, :account_name, :account_name_persian,
                    :account_type, :parent_account_id, :account_path, :level, :is_active
                )
            """), {
                'id': account_id,
                'account_code': account_data['code'],
                'account_name': account_data['name'],
                'account_name_persian': account_data['name_persian'],
                'account_type': account_data['type'],
                'parent_account_id': parent_id,
                'account_path': account_data['path'],
                'level': level,
                'is_active': True
            })
            
            account_map[account_data['code']] = account_id
        
        conn.commit()
    
    print(f"✅ Created {len(accounts_data)} chart of accounts")
    return account_map

def run_universal_seeding():
    """Run the complete universal data seeding"""
    print("🚀 Starting Universal Inventory and Invoice Management System Data Seeding")
    print("=" * 80)
    
    try:
        # Step 1: Create business configuration
        create_business_configuration()
        
        # Step 2: Create nested categories
        category_map = create_nested_categories()
        
        # Step 3: Create universal inventory items
        inventory_items = create_universal_inventory_items(category_map)
        
        # Step 4: Create dual invoices
        invoices = create_dual_invoices(inventory_items)
        
        # Step 5: Create chart of accounts
        accounts = create_chart_of_accounts()
        
        print("\n" + "=" * 80)
        print("✅ Universal data seeding completed successfully!")
        print("\n📊 Summary:")
        print(f"   • Business Configuration: 1")
        print(f"   • Nested Categories: {len(category_map)}")
        print(f"   • Universal Inventory Items: {len(inventory_items)}")
        print(f"   • Dual Invoices (Gold & General): {len(invoices)}")
        print(f"   • Chart of Accounts: {len(accounts)}")
        
        print("\n🎯 Features Demonstrated:")
        print("   • Unlimited nested categories with LTREE")
        print("   • Custom attributes and tags")
        print("   • SKU, barcode, and QR code generation")
        print("   • Both Gold and General invoice types")
        print("   • QR invoice cards")
        print("   • Double-entry accounting structure")
        print("   • Comprehensive audit trail ready")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Universal seeding failed: {e}")
        return False

if __name__ == "__main__":
    success = run_universal_seeding()
    if not success:
        exit(1)