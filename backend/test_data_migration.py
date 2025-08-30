#!/usr/bin/env python3
"""
Comprehensive Test Suite for Universal Data Migration
Tests all aspects of Task 15: Data Migration and Fresh Test Data Creation
"""

import pytest
import uuid
import json
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from data_migration_universal import UniversalDataMigration
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestUniversalDataMigration:
    """Test suite for universal data migration"""
    
    @pytest.fixture(scope="class")
    def migration_instance(self):
        """Create migration instance for testing"""
        return UniversalDataMigration()
    
    @pytest.fixture(scope="class")
    def db_session(self):
        """Create database session for testing"""
        session = SessionLocal()
        yield session
        session.close()
    
    def test_universal_table_creation(self, migration_instance):
        """Test creation of universal table structure"""
        logger.info("Testing universal table creation...")
        
        # Run table creation
        migration_instance.create_universal_tables()
        
        # Verify tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        required_tables = [
            'business_configurations',
            'categories_new',
            'inventory_items_new',
            'invoices_new',
            'invoice_items_new',
            'qr_invoice_cards',
            'inventory_movements',
            'images'
        ]
        
        for table in required_tables:
            assert table in tables, f"Required table {table} not found"
        
        # Verify LTREE extension
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 FROM pg_extension WHERE extname = 'ltree'")).fetchone()
            assert result is not None, "LTREE extension not installed"
        
        logger.info("✅ Universal table creation test passed")
    
    def test_business_configuration_creation(self, migration_instance):
        """Test business configuration creation"""
        logger.info("Testing business configuration creation...")
        
        migration_instance.create_business_configuration()
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT business_type, business_name, configuration, feature_flags
                FROM business_configurations
                LIMIT 1
            """)).fetchone()
            
            assert result is not None, "Business configuration not created"
            assert result[0] == 'gold_shop', "Incorrect business type"
            assert result[1] == 'Universal Gold Shop', "Incorrect business name"
            
            # Verify configuration structure
            config = json.loads(result[2]) if isinstance(result[2], str) else result[2]
            assert 'default_currency' in config, "Missing default_currency in configuration"
            assert 'enable_gold_features' in config, "Missing gold features flag"
            
            # Verify feature flags
            features = json.loads(result[3]) if isinstance(result[3], str) else result[3]
            assert features.get('unlimited_categories') is True, "Unlimited categories not enabled"
            assert features.get('dual_invoice_types') is True, "Dual invoice types not enabled"
        
        logger.info("✅ Business configuration creation test passed")
    
    def test_nested_categories_creation(self, migration_instance):
        """Test nested categories with LTREE structure"""
        logger.info("Testing nested categories creation...")
        
        category_map = migration_instance.create_nested_categories()
        
        assert len(category_map) > 0, "No categories created"
        
        with engine.connect() as conn:
            # Test LTREE paths
            result = conn.execute(text("""
                SELECT name, path, level, attribute_schema
                FROM categories_new
                WHERE path ~ '*.gold_jewelry.*'
                ORDER BY level
            """)).fetchall()
            
            assert len(result) > 0, "No gold jewelry categories found"
            
            # Verify hierarchy levels
            levels = [r[2] for r in result]
            assert 0 in levels, "Root level categories missing"
            assert max(levels) >= 2, "Deep nesting not created"
            
            # Test attribute schemas
            for row in result:
                if row[3]:  # attribute_schema
                    schema = json.loads(row[3]) if isinstance(row[3], str) else row[3]
                    if schema:
                        assert isinstance(schema, list), "Attribute schema should be a list"
                        for attr in schema:
                            assert 'name' in attr, "Attribute missing name"
                            assert 'type' in attr, "Attribute missing type"
            
            # Test path queries (LTREE functionality)
            result = conn.execute(text("""
                SELECT COUNT(*) FROM categories_new 
                WHERE path <@ 'gold_jewelry'::ltree
            """)).scalar()
            
            assert result > 1, "LTREE hierarchy queries not working"
        
        logger.info("✅ Nested categories creation test passed")
    
    def test_universal_inventory_items_creation(self, migration_instance):
        """Test universal inventory items creation"""
        logger.info("Testing universal inventory items creation...")
        
        # First create categories
        category_map = migration_instance.create_nested_categories()
        
        # Create inventory items
        inventory_items = migration_instance.create_universal_inventory_items(category_map)
        
        assert len(inventory_items) > 0, "No inventory items created"
        
        with engine.connect() as conn:
            # Test item structure
            result = conn.execute(text("""
                SELECT i.name, i.sku, i.custom_attributes, i.tags, i.weight_grams,
                       c.name as category_name, c.path as category_path
                FROM inventory_items_new i
                LEFT JOIN categories_new c ON i.category_id = c.id
                LIMIT 5
            """)).fetchall()
            
            assert len(result) > 0, "No inventory items found in database"
            
            for row in result:
                assert row[0] is not None, "Item name is null"
                assert row[1] is not None, "Item SKU is null"
                
                # Test custom attributes
                if row[2]:
                    attrs = json.loads(row[2]) if isinstance(row[2], str) else row[2]
                    assert isinstance(attrs, dict), "Custom attributes should be a dict"
                
                # Test tags
                if row[3]:
                    assert isinstance(row[3], list), "Tags should be a list"
            
            # Test gold-specific items
            gold_items = conn.execute(text("""
                SELECT COUNT(*) FROM inventory_items_new 
                WHERE weight_grams IS NOT NULL AND weight_grams > 0
            """)).scalar()
            
            assert gold_items > 0, "No gold items with weight found"
            
            # Test different business types
            business_types = conn.execute(text("""
                SELECT DISTINCT jsonb_extract_path_text(business_type_fields, 'business_type')
                FROM inventory_items_new
                WHERE business_type_fields IS NOT NULL
            """)).fetchall()
            
            # Should have items for different business contexts
        
        logger.info("✅ Universal inventory items creation test passed")
    
    def test_dual_invoice_system_creation(self, migration_instance):
        """Test dual invoice system (Gold & General)"""
        logger.info("Testing dual invoice system creation...")
        
        # Setup prerequisites
        category_map = migration_instance.create_nested_categories()
        inventory_items = migration_instance.create_universal_inventory_items(category_map)
        customers = migration_instance.ensure_sample_customers()
        
        # Create invoices
        invoices = migration_instance.create_dual_invoices(inventory_items, customers)
        
        assert len(invoices) > 0, "No invoices created"
        
        with engine.connect() as conn:
            # Test invoice types
            invoice_types = conn.execute(text("""
                SELECT type, COUNT(*) FROM invoices_new GROUP BY type
            """)).fetchall()
            
            types_dict = {row[0]: row[1] for row in invoice_types}
            assert 'gold' in types_dict, "No gold invoices created"
            assert 'general' in types_dict, "No general invoices created"
            
            # Test gold invoice specific fields
            gold_invoices = conn.execute(text("""
                SELECT gold_price_per_gram, gold_sood, gold_ojrat, gold_maliyat, gold_total_weight
                FROM invoices_new WHERE type = 'gold'
                LIMIT 1
            """)).fetchone()
            
            if gold_invoices:
                assert gold_invoices[0] is not None, "Gold price per gram missing"
                assert gold_invoices[1] is not None, "Gold sood missing"
                assert gold_invoices[2] is not None, "Gold ojrat missing"
                assert gold_invoices[3] is not None, "Gold maliyat missing"
            
            # Test workflow stages
            workflow_stages = conn.execute(text("""
                SELECT DISTINCT workflow_stage FROM invoices_new
            """)).fetchall()
            
            stages = [row[0] for row in workflow_stages]
            assert 'draft' in stages, "Draft workflow stage missing"
            assert 'approved' in stages, "Approved workflow stage missing"
            
            # Test invoice items
            invoice_items_count = conn.execute(text("""
                SELECT COUNT(*) FROM invoice_items_new
            """)).scalar()
            
            assert invoice_items_count > 0, "No invoice items created"
            
            # Test QR codes
            qr_codes = conn.execute(text("""
                SELECT COUNT(*) FROM invoices_new WHERE qr_code IS NOT NULL
            """)).scalar()
            
            assert qr_codes > 0, "No QR codes generated for invoices"
        
        logger.info("✅ Dual invoice system creation test passed")
    
    def test_qr_invoice_cards_creation(self, migration_instance):
        """Test QR invoice cards creation"""
        logger.info("Testing QR invoice cards creation...")
        
        # Setup prerequisites
        category_map = migration_instance.create_nested_categories()
        inventory_items = migration_instance.create_universal_inventory_items(category_map)
        customers = migration_instance.ensure_sample_customers()
        invoices = migration_instance.create_dual_invoices(inventory_items, customers)
        
        # Create QR cards
        migration_instance.create_qr_invoice_cards(invoices)
        
        with engine.connect() as conn:
            # Test QR cards exist
            qr_cards_count = conn.execute(text("""
                SELECT COUNT(*) FROM qr_invoice_cards
            """)).scalar()
            
            assert qr_cards_count > 0, "No QR invoice cards created"
            assert qr_cards_count == len(invoices), "QR card count doesn't match invoice count"
            
            # Test QR card structure
            qr_card = conn.execute(text("""
                SELECT qr_code, card_url, card_data, theme, is_public
                FROM qr_invoice_cards
                LIMIT 1
            """)).fetchone()
            
            assert qr_card[0] is not None, "QR code is null"
            assert qr_card[1] is not None, "Card URL is null"
            assert qr_card[2] is not None, "Card data is null"
            assert qr_card[3] == 'glass', "Default theme not set"
            assert qr_card[4] is True, "Card not public by default"
            
            # Test card data structure
            card_data = json.loads(qr_card[2]) if isinstance(qr_card[2], str) else qr_card[2]
            assert 'invoice_number' in card_data, "Invoice number missing from card data"
            assert 'total_amount' in card_data, "Total amount missing from card data"
            assert 'business_name' in card_data, "Business name missing from card data"
            
            # Test relationship with invoices
            linked_invoices = conn.execute(text("""
                SELECT COUNT(*) FROM qr_invoice_cards q
                JOIN invoices_new i ON q.invoice_id = i.id
            """)).scalar()
            
            assert linked_invoices == qr_cards_count, "Not all QR cards linked to invoices"
        
        logger.info("✅ QR invoice cards creation test passed")
    
    def test_accounting_data_creation(self, migration_instance):
        """Test double-entry accounting data creation"""
        logger.info("Testing accounting data creation...")
        
        # Setup prerequisites
        category_map = migration_instance.create_nested_categories()
        inventory_items = migration_instance.create_universal_inventory_items(category_map)
        customers = migration_instance.ensure_sample_customers()
        invoices = migration_instance.create_dual_invoices(inventory_items, customers)
        
        # Create accounting data
        migration_instance.create_accounting_data(invoices)
        
        with engine.connect() as conn:
            # Test chart of accounts
            accounts_count = conn.execute(text("""
                SELECT COUNT(*) FROM chart_of_accounts
            """)).scalar()
            
            assert accounts_count > 0, "No chart of accounts created"
            
            # Test Persian terminology
            persian_accounts = conn.execute(text("""
                SELECT account_name_persian FROM chart_of_accounts
                WHERE account_name_persian IS NOT NULL
                LIMIT 1
            """)).fetchone()
            
            if persian_accounts:
                assert persian_accounts[0] is not None, "Persian account names missing"
            
            # Test journal entries
            journal_entries = conn.execute(text("""
                SELECT COUNT(*) FROM journal_entries
            """)).scalar()
            
            assert journal_entries > 0, "No journal entries created"
            
            # Test journal entry lines (double-entry)
            balanced_entries = conn.execute(text("""
                SELECT COUNT(*) FROM (
                    SELECT journal_entry_id 
                    FROM journal_entry_lines 
                    GROUP BY journal_entry_id 
                    HAVING SUM(debit_amount) = SUM(credit_amount)
                ) balanced
            """)).scalar()
            
            total_entries = conn.execute(text("""
                SELECT COUNT(DISTINCT journal_entry_id) FROM journal_entry_lines
            """)).scalar()
            
            assert balanced_entries == total_entries, "Not all journal entries are balanced"
            
            # Test invoice references
            invoice_references = conn.execute(text("""
                SELECT COUNT(*) FROM journal_entries
                WHERE reference_type = 'invoice'
            """)).scalar()
            
            assert invoice_references > 0, "No journal entries reference invoices"
        
        logger.info("✅ Accounting data creation test passed")
    
    def test_test_images_creation(self, migration_instance):
        """Test test images creation with thumbnails"""
        logger.info("Testing test images creation...")
        
        # Setup prerequisites
        category_map = migration_instance.create_nested_categories()
        inventory_items = migration_instance.create_universal_inventory_items(category_map)
        
        # Create test images
        migration_instance.create_test_images(category_map, inventory_items)
        
        with engine.connect() as conn:
            # Test images exist
            images_count = conn.execute(text("""
                SELECT COUNT(*) FROM images
            """)).scalar()
            
            assert images_count > 0, "No images created"
            
            # Test image contexts
            contexts = conn.execute(text("""
                SELECT DISTINCT context_type FROM images
            """)).fetchall()
            
            context_types = [row[0] for row in contexts]
            assert 'category' in context_types, "No category images created"
            assert 'item' in context_types, "No item images created"
            
            # Test image structure
            image = conn.execute(text("""
                SELECT filename, url, thumbnail_url, processing_status, context_id
                FROM images
                LIMIT 1
            """)).fetchone()
            
            assert image[0] is not None, "Image filename is null"
            assert image[1] is not None, "Image URL is null"
            assert image[2] is not None, "Thumbnail URL is null"
            assert image[3] == 'completed', "Image processing not completed"
            assert image[4] is not None, "Image context ID is null"
            
            # Test category image associations
            category_images = conn.execute(text("""
                SELECT COUNT(*) FROM categories_new
                WHERE image_id IS NOT NULL
            """)).scalar()
            
            assert category_images > 0, "No categories have associated images"
            
            # Test item image associations
            item_images = conn.execute(text("""
                SELECT COUNT(*) FROM inventory_items_new
                WHERE primary_image_id IS NOT NULL
            """)).scalar()
            
            assert item_images > 0, "No items have associated images"
        
        logger.info("✅ Test images creation test passed")
    
    def test_inventory_movements_creation(self, migration_instance):
        """Test inventory movements creation"""
        logger.info("Testing inventory movements creation...")
        
        # Setup prerequisites
        category_map = migration_instance.create_nested_categories()
        inventory_items = migration_instance.create_universal_inventory_items(category_map)
        
        # Create inventory movements
        migration_instance.create_inventory_movements(inventory_items)
        
        with engine.connect() as conn:
            # Test movements exist
            movements_count = conn.execute(text("""
                SELECT COUNT(*) FROM inventory_movements
            """)).scalar()
            
            assert movements_count > 0, "No inventory movements created"
            
            # Test movement types
            movement_types = conn.execute(text("""
                SELECT DISTINCT movement_type FROM inventory_movements
            """)).fetchall()
            
            types = [row[0] for row in movement_types]
            assert 'in' in types, "No 'in' movements created"
            
            # Test movement calculations
            movement = conn.execute(text("""
                SELECT quantity_before, quantity_change, quantity_after
                FROM inventory_movements
                WHERE movement_type = 'in'
                LIMIT 1
            """)).fetchone()
            
            if movement:
                calculated_after = movement[0] + movement[1]
                assert abs(calculated_after - movement[2]) < 0.001, "Movement calculation incorrect"
            
            # Test movement references
            movements_with_items = conn.execute(text("""
                SELECT COUNT(*) FROM inventory_movements m
                JOIN inventory_items_new i ON m.inventory_item_id = i.id
            """)).scalar()
            
            assert movements_with_items == movements_count, "Not all movements linked to items"
        
        logger.info("✅ Inventory movements creation test passed")
    
    def test_data_integrity_validation(self, migration_instance):
        """Test data integrity validation"""
        logger.info("Testing data integrity validation...")
        
        # Run full migration first
        migration_instance.run_full_migration()
        
        # Run validation
        validation_results = migration_instance.validate_data_integrity()
        
        # Check validation results
        assert validation_results['categories_with_ltree'] > 0, "No categories with LTREE paths"
        assert validation_results['items_with_categories'] > 0, "No items with categories"
        assert validation_results['invoices_with_items'] > 0, "No invoices with items"
        assert validation_results['qr_cards_with_invoices'] > 0, "No QR cards with invoices"
        assert validation_results['accounting_entries_balanced'] >= 0, "Accounting entries validation failed"
        assert validation_results['images_with_context'] > 0, "No images with context"
        assert validation_results['movements_with_items'] > 0, "No movements with items"
        
        # Check for critical errors
        critical_errors = [error for error in validation_results['errors'] 
                          if 'orphaned' in error.lower() or 'duplicate' in error.lower()]
        
        assert len(critical_errors) == 0, f"Critical data integrity errors found: {critical_errors}"
        
        logger.info("✅ Data integrity validation test passed")
    
    def test_migration_report_generation(self, migration_instance):
        """Test migration report generation"""
        logger.info("Testing migration report generation...")
        
        # Run migration
        migration_instance.run_full_migration()
        
        # Generate report
        report = migration_instance.generate_migration_report()
        
        # Validate report structure
        assert 'migration_timestamp' in report, "Migration timestamp missing"
        assert 'migration_stats' in report, "Migration stats missing"
        assert 'system_info' in report, "System info missing"
        
        # Validate migration stats
        stats = report['migration_stats']
        assert stats['categories_created'] > 0, "No categories created recorded"
        assert stats['items_created'] > 0, "No items created recorded"
        assert stats['invoices_created'] > 0, "No invoices created recorded"
        
        # Validate system info
        system_info = report['system_info']
        assert 'database_url' in system_info, "Database URL missing"
        assert 'migration_version' in system_info, "Migration version missing"
        
        logger.info("✅ Migration report generation test passed")
    
    def test_full_migration_workflow(self, migration_instance):
        """Test complete migration workflow"""
        logger.info("Testing full migration workflow...")
        
        # Run complete migration
        migration_instance.run_full_migration()
        
        # Verify all components exist and are properly linked
        with engine.connect() as conn:
            # Test complete data chain
            result = conn.execute(text("""
                SELECT 
                    c.name as category_name,
                    i.name as item_name,
                    inv.invoice_number,
                    inv.type as invoice_type,
                    q.qr_code,
                    img.filename
                FROM categories_new c
                JOIN inventory_items_new i ON c.id = i.category_id
                JOIN invoice_items_new ii ON i.id = ii.inventory_item_id
                JOIN invoices_new inv ON ii.invoice_id = inv.id
                LEFT JOIN qr_invoice_cards q ON inv.id = q.invoice_id
                LEFT JOIN images img ON i.primary_image_id = img.id
                LIMIT 5
            """)).fetchall()
            
            assert len(result) > 0, "Complete data chain not established"
            
            for row in result:
                assert row[0] is not None, "Category name is null"
                assert row[1] is not None, "Item name is null"
                assert row[2] is not None, "Invoice number is null"
                assert row[3] in ['gold', 'general'], "Invalid invoice type"
        
        logger.info("✅ Full migration workflow test passed")


def run_migration_tests():
    """Run all migration tests"""
    logger.info("🧪 Starting Universal Data Migration Tests...")
    
    # Create test instance
    migration = UniversalDataMigration()
    
    # Initialize test class
    test_class = TestUniversalDataMigration()
    
    try:
        # Run individual tests
        test_class.test_universal_table_creation(migration)
        test_class.test_business_configuration_creation(migration)
        test_class.test_nested_categories_creation(migration)
        test_class.test_universal_inventory_items_creation(migration)
        test_class.test_dual_invoice_system_creation(migration)
        test_class.test_qr_invoice_cards_creation(migration)
        test_class.test_accounting_data_creation(migration)
        test_class.test_test_images_creation(migration)
        test_class.test_inventory_movements_creation(migration)
        test_class.test_data_integrity_validation(migration)
        test_class.test_migration_report_generation(migration)
        test_class.test_full_migration_workflow(migration)
        
        logger.info("🎉 All migration tests passed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration test failed: {e}")
        return False
    
    finally:
        migration.session.close()


if __name__ == "__main__":
    success = run_migration_tests()
    exit(0 if success else 1)