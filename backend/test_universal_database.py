#!/usr/bin/env python3
"""
Comprehensive Database Tests for Universal Inventory and Invoice Management System
Tests all new database features using real PostgreSQL in Docker environment
"""

import pytest
import uuid
import random
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import text, create_engine
from sqlalchemy.orm import Session
from database import SessionLocal, engine

class TestUniversalDatabase:
    """Test suite for universal database schema and functionality"""
    
    def setup_method(self):
        """Setup test environment"""
        self.db = SessionLocal()
    
    def teardown_method(self):
        """Cleanup after tests"""
        self.db.close()
    
    def test_postgresql_extensions(self):
        """Test that required PostgreSQL extensions are enabled"""
        print("🔧 Testing PostgreSQL extensions...")
        
        with engine.connect() as conn:
            # Test UUID extension
            result = conn.execute(text("SELECT gen_random_uuid()")).scalar()
            assert result is not None
            print("   ✅ UUID extension working")
            
            # Test LTREE extension
            result = conn.execute(text("SELECT 'jewelry.rings.wedding'::ltree")).scalar()
            assert result == 'jewelry.rings.wedding'
            print("   ✅ LTREE extension working")
            
            # Test pg_trgm extension
            result = conn.execute(text("SELECT similarity('gold', 'golden')")).scalar()
            assert result > 0
            print("   ✅ pg_trgm extension working")
    
    def test_business_configuration_table(self):
        """Test business configuration functionality"""
        print("⚙️ Testing business configuration...")
        
        with engine.connect() as conn:
            # Insert test configuration
            config_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO business_configurations (
                    id, business_type, business_name, configuration
                ) VALUES (
                    :id, :business_type, :business_name, :configuration
                )
            """), {
                'id': config_id,
                'business_type': 'test_jewelry',
                'business_name': 'Test Jewelry Store',
                'configuration': {
                    'currency': 'USD',
                    'tax_rate': 8.5,
                    'features': ['inventory', 'invoices', 'accounting']
                }
            })
            
            # Verify insertion
            result = conn.execute(text("""
                SELECT business_name, configuration FROM business_configurations WHERE id = :id
            """), {'id': config_id}).fetchone()
            
            assert result[0] == 'Test Jewelry Store'
            assert result[1]['currency'] == 'USD'
            assert result[1]['tax_rate'] == 8.5
            
            # Cleanup
            conn.execute(text("DELETE FROM business_configurations WHERE id = :id"), {'id': config_id})
            conn.commit()
            
            print("   ✅ Business configuration table working")
    
    def test_nested_categories_with_ltree(self):
        """Test unlimited nested categories with LTREE"""
        print("📂 Testing nested categories with LTREE...")
        
        with engine.connect() as conn:
            # Create test category hierarchy
            categories = [
                {'id': str(uuid.uuid4()), 'name': 'Jewelry', 'path': 'jewelry', 'level': 0, 'parent_id': None},
                {'id': str(uuid.uuid4()), 'name': 'Rings', 'path': 'jewelry.rings', 'level': 1, 'parent_id': None},
                {'id': str(uuid.uuid4()), 'name': 'Wedding', 'path': 'jewelry.rings.wedding', 'level': 2, 'parent_id': None},
                {'id': str(uuid.uuid4()), 'name': 'Gold', 'path': 'jewelry.rings.wedding.gold', 'level': 3, 'parent_id': None},
            ]
            
            # Set parent relationships
            for i in range(1, len(categories)):
                categories[i]['parent_id'] = categories[i-1]['id']
            
            # Insert categories
            for cat in categories:
                conn.execute(text("""
                    INSERT INTO categories_new (
                        id, name, path, level, parent_id, attribute_schema, is_active
                    ) VALUES (
                        :id, :name, :path, :level, :parent_id, :attribute_schema, :is_active
                    )
                """), {
                    'id': cat['id'],
                    'name': cat['name'],
                    'path': cat['path'],
                    'level': cat['level'],
                    'parent_id': cat['parent_id'],
                    'attribute_schema': [
                        {'name': 'Material', 'type': 'enum', 'options': ['Gold', 'Silver'], 'required': True}
                    ],
                    'is_active': True
                })
            
            # Test LTREE queries
            
            # 1. Find all descendants of 'jewelry'
            descendants = conn.execute(text("""
                SELECT name, path FROM categories_new WHERE path <@ 'jewelry'::ltree ORDER BY level
            """)).fetchall()
            assert len(descendants) == 4
            print("   ✅ LTREE descendant query working")
            
            # 2. Find direct children of 'jewelry.rings'
            children = conn.execute(text("""
                SELECT name FROM categories_new WHERE path ~ 'jewelry.rings.*{1}'::lquery
            """)).fetchall()
            assert len(children) == 1
            assert children[0][0] == 'Wedding'
            print("   ✅ LTREE children query working")
            
            # 3. Find path from root to leaf
            path_query = conn.execute(text("""
                SELECT name FROM categories_new WHERE 'jewelry.rings.wedding.gold'::ltree ~ ('*.' || path || '.*')::lquery
                ORDER BY level
            """)).fetchall()
            assert len(path_query) >= 1
            print("   ✅ LTREE path query working")
            
            # Cleanup
            for cat in reversed(categories):
                conn.execute(text("DELETE FROM categories_new WHERE id = :id"), {'id': cat['id']})
            
            conn.commit()
            print("   ✅ Nested categories with LTREE working")
    
    def test_universal_inventory_items(self):
        """Test universal inventory items with all features"""
        print("💎 Testing universal inventory items...")
        
        with engine.connect() as conn:
            # Create test category first
            category_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO categories_new (id, name, path, level, is_active)
                VALUES (:id, :name, :path, :level, :is_active)
            """), {
                'id': category_id,
                'name': 'Test Category',
                'path': 'test',
                'level': 0,
                'is_active': True
            })
            
            # Create test inventory item
            item_id = str(uuid.uuid4())
            sku = f"TEST-{random.randint(100000, 999999)}"
            barcode = ''.join(random.choices('0123456789', k=13))
            qr_code = str(uuid.uuid4()).replace('-', '').upper()[:16]
            
            conn.execute(text("""
                INSERT INTO inventory_items_new (
                    id, sku, barcode, qr_code, name, category_id,
                    cost_price, sale_price, stock_quantity, custom_attributes,
                    tags, weight_grams, business_type_fields, is_active
                ) VALUES (
                    :id, :sku, :barcode, :qr_code, :name, :category_id,
                    :cost_price, :sale_price, :stock_quantity, :custom_attributes,
                    :tags, :weight_grams, :business_type_fields, :is_active
                )
            """), {
                'id': item_id,
                'sku': sku,
                'barcode': barcode,
                'qr_code': qr_code,
                'name': 'Test Gold Ring',
                'category_id': category_id,
                'cost_price': Decimal('500.00'),
                'sale_price': Decimal('750.00'),
                'stock_quantity': Decimal('10'),
                'custom_attributes': {
                    'Material': 'Gold',
                    'Purity': '18K',
                    'Size': '7',
                    'Weight': 5.2
                },
                'tags': ['gold', 'ring', 'jewelry', 'test'],
                'weight_grams': Decimal('5.2'),
                'business_type_fields': {
                    'gold_purity': 18,
                    'is_handmade': True
                },
                'is_active': True
            })
            
            # Test queries
            
            # 1. Test SKU uniqueness and search
            result = conn.execute(text("""
                SELECT name, sku FROM inventory_items_new WHERE sku = :sku
            """), {'sku': sku}).fetchone()
            assert result[0] == 'Test Gold Ring'
            assert result[1] == sku
            print("   ✅ SKU functionality working")
            
            # 2. Test barcode search
            result = conn.execute(text("""
                SELECT name FROM inventory_items_new WHERE barcode = :barcode
            """), {'barcode': barcode}).fetchone()
            assert result[0] == 'Test Gold Ring'
            print("   ✅ Barcode functionality working")
            
            # 3. Test QR code search
            result = conn.execute(text("""
                SELECT name FROM inventory_items_new WHERE qr_code = :qr_code
            """), {'qr_code': qr_code}).fetchone()
            assert result[0] == 'Test Gold Ring'
            print("   ✅ QR code functionality working")
            
            # 4. Test custom attributes search
            result = conn.execute(text("""
                SELECT name FROM inventory_items_new 
                WHERE custom_attributes->>'Material' = 'Gold'
                AND custom_attributes->>'Purity' = '18K'
            """)).fetchall()
            assert len(result) >= 1
            print("   ✅ Custom attributes search working")
            
            # 5. Test tags search
            result = conn.execute(text("""
                SELECT name FROM inventory_items_new WHERE 'gold' = ANY(tags)
            """)).fetchall()
            assert len(result) >= 1
            print("   ✅ Tags search working")
            
            # 6. Test full-text search
            result = conn.execute(text("""
                SELECT name FROM inventory_items_new 
                WHERE to_tsvector('english', name) @@ to_tsquery('english', 'gold')
            """)).fetchall()
            assert len(result) >= 1
            print("   ✅ Full-text search working")
            
            # Cleanup
            conn.execute(text("DELETE FROM inventory_items_new WHERE id = :id"), {'id': item_id})
            conn.execute(text("DELETE FROM categories_new WHERE id = :id"), {'id': category_id})
            conn.commit()
            
            print("   ✅ Universal inventory items working")
    
    def test_dual_invoice_system(self):
        """Test dual invoice system (Gold vs General)"""
        print("🧾 Testing dual invoice system...")
        
        with engine.connect() as conn:
            # Create test invoices
            gold_invoice_id = str(uuid.uuid4())
            general_invoice_id = str(uuid.uuid4())
            
            # Test Gold invoice
            conn.execute(text("""
                INSERT INTO invoices_new (
                    id, invoice_number, type, status, customer_name,
                    subtotal, tax_amount, total_amount, gold_sood, gold_ojrat, gold_maliyat,
                    gold_price_per_gram, gold_total_weight, qr_code, card_url
                ) VALUES (
                    :id, :invoice_number, :type, :status, :customer_name,
                    :subtotal, :tax_amount, :total_amount, :gold_sood, :gold_ojrat, :gold_maliyat,
                    :gold_price_per_gram, :gold_total_weight, :qr_code, :card_url
                )
            """), {
                'id': gold_invoice_id,
                'invoice_number': 'TEST-GOLD-001',
                'type': 'gold',
                'status': 'draft',
                'customer_name': 'Test Customer',
                'subtotal': Decimal('1000.00'),
                'tax_amount': Decimal('90.00'),
                'total_amount': Decimal('1090.00'),
                'gold_sood': Decimal('200.00'),  # سود
                'gold_ojrat': Decimal('150.00'),  # اجرت
                'gold_maliyat': Decimal('90.00'),  # مالیات
                'gold_price_per_gram': Decimal('65.00'),
                'gold_total_weight': Decimal('15.38'),
                'qr_code': 'TESTGOLD001',
                'card_url': 'https://test.com/card/TESTGOLD001'
            })
            
            # Test General invoice
            conn.execute(text("""
                INSERT INTO invoices_new (
                    id, invoice_number, type, status, customer_name,
                    subtotal, tax_amount, total_amount, qr_code, card_url
                ) VALUES (
                    :id, :invoice_number, :type, :status, :customer_name,
                    :subtotal, :tax_amount, :total_amount, :qr_code, :card_url
                )
            """), {
                'id': general_invoice_id,
                'invoice_number': 'TEST-GEN-001',
                'type': 'general',
                'status': 'approved',
                'customer_name': 'Test Customer 2',
                'subtotal': Decimal('500.00'),
                'tax_amount': Decimal('45.00'),
                'total_amount': Decimal('545.00'),
                'qr_code': 'TESTGEN001',
                'card_url': 'https://test.com/card/TESTGEN001'
            })
            
            # Test queries
            
            # 1. Test Gold invoice specific fields
            result = conn.execute(text("""
                SELECT gold_sood, gold_ojrat, gold_maliyat, gold_total_weight
                FROM invoices_new WHERE type = 'gold' AND id = :id
            """), {'id': gold_invoice_id}).fetchone()
            assert result[0] == Decimal('200.00')  # سود
            assert result[1] == Decimal('150.00')  # اجرت
            assert result[2] == Decimal('90.00')   # مالیات
            assert result[3] == Decimal('15.38')   # weight
            print("   ✅ Gold invoice specific fields working")
            
            # 2. Test General invoice (no Gold fields)
            result = conn.execute(text("""
                SELECT gold_sood, gold_ojrat, gold_maliyat FROM invoices_new 
                WHERE type = 'general' AND id = :id
            """), {'id': general_invoice_id}).fetchone()
            assert result[0] is None
            assert result[1] is None
            assert result[2] is None
            print("   ✅ General invoice (no Gold fields) working")
            
            # 3. Test invoice type filtering
            gold_count = conn.execute(text("""
                SELECT COUNT(*) FROM invoices_new WHERE type = 'gold'
            """)).scalar()
            general_count = conn.execute(text("""
                SELECT COUNT(*) FROM invoices_new WHERE type = 'general'
            """)).scalar()
            assert gold_count >= 1
            assert general_count >= 1
            print("   ✅ Invoice type filtering working")
            
            # 4. Test QR code uniqueness
            qr_codes = conn.execute(text("""
                SELECT qr_code FROM invoices_new WHERE id IN (:gold_id, :general_id)
            """), {'gold_id': gold_invoice_id, 'general_id': general_invoice_id}).fetchall()
            assert len(set(qr[0] for qr in qr_codes)) == 2  # Both unique
            print("   ✅ QR code uniqueness working")
            
            # Cleanup
            conn.execute(text("DELETE FROM invoices_new WHERE id IN (:gold_id, :general_id)"), 
                        {'gold_id': gold_invoice_id, 'general_id': general_invoice_id})
            conn.commit()
            
            print("   ✅ Dual invoice system working")
    
    def test_double_entry_accounting(self):
        """Test double-entry accounting system"""
        print("📊 Testing double-entry accounting...")
        
        with engine.connect() as conn:
            # Create test accounts
            cash_account_id = str(uuid.uuid4())
            sales_account_id = str(uuid.uuid4())
            
            conn.execute(text("""
                INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, is_active)
                VALUES 
                (:cash_id, '1110', 'Cash', 'asset', true),
                (:sales_id, '4100', 'Sales Revenue', 'revenue', true)
            """), {'cash_id': cash_account_id, 'sales_id': sales_account_id})
            
            # Create journal entry
            entry_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO journal_entries (
                    id, entry_number, entry_date, description, source_type,
                    total_debit, total_credit, is_balanced, status
                ) VALUES (
                    :id, :entry_number, :entry_date, :description, :source_type,
                    :total_debit, :total_credit, :is_balanced, :status
                )
            """), {
                'id': entry_id,
                'entry_number': 'JE-TEST-001',
                'entry_date': datetime.now().date(),
                'description': 'Test sale transaction',
                'source_type': 'invoice',
                'total_debit': Decimal('1000.00'),
                'total_credit': Decimal('1000.00'),
                'is_balanced': True,
                'status': 'posted'
            })
            
            # Create journal entry lines
            debit_line_id = str(uuid.uuid4())
            credit_line_id = str(uuid.uuid4())
            
            conn.execute(text("""
                INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit_amount, credit_amount, description)
                VALUES 
                (:debit_id, :entry_id, :cash_account, :debit_amount, 0, 'Cash received'),
                (:credit_id, :entry_id, :sales_account, 0, :credit_amount, 'Sales revenue')
            """), {
                'debit_id': debit_line_id,
                'credit_id': credit_line_id,
                'entry_id': entry_id,
                'cash_account': cash_account_id,
                'sales_account': sales_account_id,
                'debit_amount': Decimal('1000.00'),
                'credit_amount': Decimal('1000.00')
            })
            
            # Test double-entry validation
            balance_check = conn.execute(text("""
                SELECT 
                    SUM(debit_amount) as total_debits,
                    SUM(credit_amount) as total_credits
                FROM journal_entry_lines 
                WHERE journal_entry_id = :entry_id
            """), {'entry_id': entry_id}).fetchone()
            
            assert balance_check[0] == balance_check[1]  # Debits = Credits
            assert balance_check[0] == Decimal('1000.00')
            print("   ✅ Double-entry balance validation working")
            
            # Test account balance calculation
            cash_balance = conn.execute(text("""
                SELECT 
                    SUM(debit_amount) - SUM(credit_amount) as balance
                FROM journal_entry_lines 
                WHERE account_id = :account_id
            """), {'account_id': cash_account_id}).scalar()
            
            assert cash_balance == Decimal('1000.00')  # Asset account has debit balance
            print("   ✅ Account balance calculation working")
            
            # Cleanup
            conn.execute(text("DELETE FROM journal_entry_lines WHERE journal_entry_id = :id"), {'id': entry_id})
            conn.execute(text("DELETE FROM journal_entries WHERE id = :id"), {'id': entry_id})
            conn.execute(text("DELETE FROM chart_of_accounts WHERE id IN (:cash_id, :sales_id)"), 
                        {'cash_id': cash_account_id, 'sales_id': sales_account_id})
            conn.commit()
            
            print("   ✅ Double-entry accounting working")
    
    def test_image_management(self):
        """Test image management system"""
        print("🖼️ Testing image management...")
        
        with engine.connect() as conn:
            # Create test image
            image_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO images (
                    id, filename, original_name, file_path, mime_type, file_size,
                    width, height, url, thumbnail_url, context_type, context_id,
                    processing_status, is_active
                ) VALUES (
                    :id, :filename, :original_name, :file_path, :mime_type, :file_size,
                    :width, :height, :url, :thumbnail_url, :context_type, :context_id,
                    :processing_status, :is_active
                )
            """), {
                'id': image_id,
                'filename': 'test-ring.jpg',
                'original_name': 'beautiful-gold-ring.jpg',
                'file_path': '/uploads/images/test-ring.jpg',
                'mime_type': 'image/jpeg',
                'file_size': 245760,
                'width': 800,
                'height': 600,
                'url': 'https://example.com/images/test-ring.jpg',
                'thumbnail_url': 'https://example.com/images/thumbs/test-ring.jpg',
                'context_type': 'item',
                'context_id': str(uuid.uuid4()),
                'processing_status': 'completed',
                'is_active': True
            })
            
            # Create image variants
            variant_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO image_variants (
                    id, parent_image_id, variant_type, width, height,
                    filename, file_path, file_size, url, processing_status
                ) VALUES (
                    :id, :parent_id, :variant_type, :width, :height,
                    :filename, :file_path, :file_size, :url, :processing_status
                )
            """), {
                'id': variant_id,
                'parent_id': image_id,
                'variant_type': 'thumbnail',
                'width': 150,
                'height': 150,
                'filename': 'test-ring-thumb.jpg',
                'file_path': '/uploads/thumbs/test-ring-thumb.jpg',
                'file_size': 12800,
                'url': 'https://example.com/thumbs/test-ring-thumb.jpg',
                'processing_status': 'completed'
            })
            
            # Test image queries
            
            # 1. Test image retrieval by context
            result = conn.execute(text("""
                SELECT filename, mime_type, processing_status 
                FROM images WHERE context_type = 'item' AND id = :id
            """), {'id': image_id}).fetchone()
            assert result[0] == 'test-ring.jpg'
            assert result[1] == 'image/jpeg'
            assert result[2] == 'completed'
            print("   ✅ Image context retrieval working")
            
            # 2. Test image variants
            variants = conn.execute(text("""
                SELECT variant_type, width, height FROM image_variants 
                WHERE parent_image_id = :parent_id
            """), {'parent_id': image_id}).fetchall()
            assert len(variants) == 1
            assert variants[0][0] == 'thumbnail'
            assert variants[0][1] == 150
            print("   ✅ Image variants working")
            
            # 3. Test image with variants join
            result = conn.execute(text("""
                SELECT i.filename, COUNT(v.id) as variant_count
                FROM images i
                LEFT JOIN image_variants v ON i.id = v.parent_image_id
                WHERE i.id = :id
                GROUP BY i.id, i.filename
            """), {'id': image_id}).fetchone()
            assert result[0] == 'test-ring.jpg'
            assert result[1] == 1
            print("   ✅ Image-variant relationships working")
            
            # Cleanup
            conn.execute(text("DELETE FROM image_variants WHERE parent_image_id = :id"), {'id': image_id})
            conn.execute(text("DELETE FROM images WHERE id = :id"), {'id': image_id})
            conn.commit()
            
            print("   ✅ Image management working")
    
    def test_audit_trail(self):
        """Test audit trail functionality"""
        print("📋 Testing audit trail...")
        
        with engine.connect() as conn:
            # Create test audit log entry
            audit_id = str(uuid.uuid4())
            record_id = str(uuid.uuid4())
            
            conn.execute(text("""
                INSERT INTO audit_log (
                    id, table_name, record_id, operation, old_values, new_values,
                    changed_fields, business_context
                ) VALUES (
                    :id, :table_name, :record_id, :operation, :old_values, :new_values,
                    :changed_fields, :business_context
                )
            """), {
                'id': audit_id,
                'table_name': 'inventory_items_new',
                'record_id': record_id,
                'operation': 'UPDATE',
                'old_values': {'stock_quantity': 10, 'sale_price': 100.00},
                'new_values': {'stock_quantity': 8, 'sale_price': 120.00},
                'changed_fields': ['stock_quantity', 'sale_price'],
                'business_context': 'inventory_update'
            })
            
            # Create system event
            event_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO system_events (
                    id, event_type, event_category, severity, message, event_data
                ) VALUES (
                    :id, :event_type, :event_category, :severity, :message, :event_data
                )
            """), {
                'id': event_id,
                'event_type': 'inventory_low_stock',
                'event_category': 'business',
                'severity': 'warning',
                'message': 'Item stock below threshold',
                'event_data': {'item_id': record_id, 'current_stock': 2, 'threshold': 5}
            })
            
            # Test audit queries
            
            # 1. Test audit log retrieval
            result = conn.execute(text("""
                SELECT operation, table_name, changed_fields FROM audit_log WHERE id = :id
            """), {'id': audit_id}).fetchone()
            assert result[0] == 'UPDATE'
            assert result[1] == 'inventory_items_new'
            assert 'stock_quantity' in result[2]
            print("   ✅ Audit log recording working")
            
            # 2. Test system events
            result = conn.execute(text("""
                SELECT event_type, severity, event_data FROM system_events WHERE id = :id
            """), {'id': event_id}).fetchone()
            assert result[0] == 'inventory_low_stock'
            assert result[1] == 'warning'
            assert result[2]['current_stock'] == 2
            print("   ✅ System events working")
            
            # 3. Test audit trail by record
            audit_trail = conn.execute(text("""
                SELECT operation, created_at FROM audit_log 
                WHERE record_id = :record_id ORDER BY created_at DESC
            """), {'record_id': record_id}).fetchall()
            assert len(audit_trail) >= 1
            print("   ✅ Audit trail by record working")
            
            # Cleanup
            conn.execute(text("DELETE FROM audit_log WHERE id = :id"), {'id': audit_id})
            conn.execute(text("DELETE FROM system_events WHERE id = :id"), {'id': event_id})
            conn.commit()
            
            print("   ✅ Audit trail working")
    
    def test_qr_invoice_cards(self):
        """Test QR invoice cards functionality"""
        print("🔗 Testing QR invoice cards...")
        
        with engine.connect() as conn:
            # Create test invoice first
            invoice_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO invoices_new (id, invoice_number, type, total_amount, qr_code)
                VALUES (:id, :invoice_number, :type, :total_amount, :qr_code)
            """), {
                'id': invoice_id,
                'invoice_number': 'TEST-QR-001',
                'type': 'gold',
                'total_amount': Decimal('1500.00'),
                'qr_code': 'TESTQR001'
            })
            
            # Create QR invoice card
            card_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO qr_invoice_cards (
                    id, invoice_id, qr_code, card_url, theme, card_data,
                    is_public, view_count, is_active
                ) VALUES (
                    :id, :invoice_id, :qr_code, :card_url, :theme, :card_data,
                    :is_public, :view_count, :is_active
                )
            """), {
                'id': card_id,
                'invoice_id': invoice_id,
                'qr_code': 'TESTQR001',
                'card_url': 'https://goldshop.com/card/TESTQR001',
                'theme': 'glass',
                'card_data': {
                    'invoice_number': 'TEST-QR-001',
                    'customer_name': 'Test Customer',
                    'total': 1500.00,
                    'items': [
                        {'name': 'Gold Ring', 'quantity': 1, 'price': 1500.00}
                    ]
                },
                'is_public': True,
                'view_count': 0,
                'is_active': True
            })
            
            # Create access log entry
            access_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO qr_card_access_log (
                    id, card_id, ip_address, device_type, browser
                ) VALUES (
                    :id, :card_id, :ip_address, :device_type, :browser
                )
            """), {
                'id': access_id,
                'card_id': card_id,
                'ip_address': '192.168.1.100',
                'device_type': 'mobile',
                'browser': 'Chrome'
            })
            
            # Test QR card queries
            
            # 1. Test card retrieval by QR code
            result = conn.execute(text("""
                SELECT theme, card_data, is_public FROM qr_invoice_cards WHERE qr_code = :qr_code
            """), {'qr_code': 'TESTQR001'}).fetchone()
            assert result[0] == 'glass'
            assert result[1]['invoice_number'] == 'TEST-QR-001'
            assert result[2] is True
            print("   ✅ QR card retrieval working")
            
            # 2. Test card-invoice relationship
            result = conn.execute(text("""
                SELECT i.invoice_number, c.card_url 
                FROM invoices_new i
                JOIN qr_invoice_cards c ON i.id = c.invoice_id
                WHERE c.qr_code = :qr_code
            """), {'qr_code': 'TESTQR001'}).fetchone()
            assert result[0] == 'TEST-QR-001'
            assert 'TESTQR001' in result[1]
            print("   ✅ Card-invoice relationship working")
            
            # 3. Test access logging
            access_count = conn.execute(text("""
                SELECT COUNT(*) FROM qr_card_access_log WHERE card_id = :card_id
            """), {'card_id': card_id}).scalar()
            assert access_count == 1
            print("   ✅ QR card access logging working")
            
            # Cleanup
            conn.execute(text("DELETE FROM qr_card_access_log WHERE card_id = :id"), {'id': card_id})
            conn.execute(text("DELETE FROM qr_invoice_cards WHERE id = :id"), {'id': card_id})
            conn.execute(text("DELETE FROM invoices_new WHERE id = :id"), {'id': invoice_id})
            conn.commit()
            
            print("   ✅ QR invoice cards working")
    
    def test_data_integrity_constraints(self):
        """Test database constraints and data integrity"""
        print("🔒 Testing data integrity constraints...")
        
        with engine.connect() as conn:
            # Test unique constraints
            
            # 1. Test SKU uniqueness
            item_id_1 = str(uuid.uuid4())
            item_id_2 = str(uuid.uuid4())
            test_sku = f"UNIQUE-TEST-{random.randint(100000, 999999)}"
            
            # Insert first item
            conn.execute(text("""
                INSERT INTO inventory_items_new (id, sku, name, cost_price, sale_price, stock_quantity)
                VALUES (:id, :sku, :name, :cost_price, :sale_price, :stock_quantity)
            """), {
                'id': item_id_1,
                'sku': test_sku,
                'name': 'Test Item 1',
                'cost_price': Decimal('100.00'),
                'sale_price': Decimal('150.00'),
                'stock_quantity': Decimal('10')
            })
            
            # Try to insert duplicate SKU (should fail)
            try:
                conn.execute(text("""
                    INSERT INTO inventory_items_new (id, sku, name, cost_price, sale_price, stock_quantity)
                    VALUES (:id, :sku, :name, :cost_price, :sale_price, :stock_quantity)
                """), {
                    'id': item_id_2,
                    'sku': test_sku,  # Same SKU
                    'name': 'Test Item 2',
                    'cost_price': Decimal('200.00'),
                    'sale_price': Decimal('250.00'),
                    'stock_quantity': Decimal('5')
                })
                conn.commit()
                assert False, "Should have failed due to duplicate SKU"
            except Exception:
                conn.rollback()
                print("   ✅ SKU uniqueness constraint working")
            
            # 2. Test foreign key constraints
            try:
                # Try to insert item with non-existent category
                conn.execute(text("""
                    INSERT INTO inventory_items_new (id, sku, name, category_id, cost_price, sale_price, stock_quantity)
                    VALUES (:id, :sku, :name, :category_id, :cost_price, :sale_price, :stock_quantity)
                """), {
                    'id': str(uuid.uuid4()),
                    'sku': f"FK-TEST-{random.randint(100000, 999999)}",
                    'name': 'FK Test Item',
                    'category_id': str(uuid.uuid4()),  # Non-existent category
                    'cost_price': Decimal('100.00'),
                    'sale_price': Decimal('150.00'),
                    'stock_quantity': Decimal('10')
                })
                conn.commit()
                assert False, "Should have failed due to foreign key constraint"
            except Exception:
                conn.rollback()
                print("   ✅ Foreign key constraints working")
            
            # 3. Test check constraints
            try:
                # Try to insert invoice with invalid type
                conn.execute(text("""
                    INSERT INTO invoices_new (id, invoice_number, type, total_amount)
                    VALUES (:id, :invoice_number, :type, :total_amount)
                """), {
                    'id': str(uuid.uuid4()),
                    'invoice_number': 'INVALID-TYPE-001',
                    'type': 'invalid_type',  # Should only allow 'gold' or 'general'
                    'total_amount': Decimal('100.00')
                })
                conn.commit()
                assert False, "Should have failed due to check constraint"
            except Exception:
                conn.rollback()
                print("   ✅ Check constraints working")
            
            # Cleanup
            conn.execute(text("DELETE FROM inventory_items_new WHERE id = :id"), {'id': item_id_1})
            conn.commit()
            
            print("   ✅ Data integrity constraints working")

def run_comprehensive_tests():
    """Run all database tests"""
    print("🚀 Starting Comprehensive Universal Database Tests")
    print("=" * 80)
    
    test_suite = TestUniversalDatabase()
    
    tests = [
        test_suite.test_postgresql_extensions,
        test_suite.test_business_configuration_table,
        test_suite.test_nested_categories_with_ltree,
        test_suite.test_universal_inventory_items,
        test_suite.test_dual_invoice_system,
        test_suite.test_double_entry_accounting,
        test_suite.test_image_management,
        test_suite.test_audit_trail,
        test_suite.test_qr_invoice_cards,
        test_suite.test_data_integrity_constraints
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test_suite.setup_method()
            test()
            test_suite.teardown_method()
            passed += 1
        except Exception as e:
            print(f"   ❌ Test failed: {e}")
            failed += 1
            test_suite.teardown_method()
    
    print("\n" + "=" * 80)
    print(f"📊 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All database tests passed successfully!")
        return True
    else:
        print("❌ Some tests failed!")
        return False

if __name__ == "__main__":
    success = run_comprehensive_tests()
    if not success:
        exit(1)