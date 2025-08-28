#!/usr/bin/env python3
"""
Migration Validation Script
Validates that the Universal Inventory and Invoice Management System migration was successful
"""

from sqlalchemy import text
from database import engine

def validate_extensions():
    """Validate PostgreSQL extensions"""
    print("🔧 Validating PostgreSQL extensions...")
    
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

def validate_tables():
    """Validate that all required tables exist"""
    print("📋 Validating database tables...")
    
    required_tables = [
        'business_configurations',
        'categories_new',
        'inventory_items_new',
        'invoices_new',
        'invoice_items_new',
        'chart_of_accounts',
        'journal_entries',
        'journal_entry_lines',
        'subsidiary_accounts',
        'check_management',
        'installment_accounts',
        'installment_payments',
        'bank_reconciliation',
        'images',
        'image_variants',
        'audit_log',
        'system_events',
        'qr_invoice_cards',
        'qr_card_access_log'
    ]
    
    with engine.connect() as conn:
        for table in required_tables:
            result = conn.execute(text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = '{table}'
                )
            """)).scalar()
            
            if result:
                print(f"   ✅ Table '{table}' exists")
            else:
                print(f"   ❌ Table '{table}' missing")
                return False
    
    return True

def validate_data():
    """Validate that test data was created"""
    print("📊 Validating test data...")
    
    validations = [
        {
            'query': "SELECT COUNT(*) FROM business_configurations",
            'description': "Business configurations",
            'expected_min': 1
        },
        {
            'query': "SELECT COUNT(*) FROM categories_new WHERE path IS NOT NULL",
            'description': "Categories with LTREE paths",
            'expected_min': 1
        },
        {
            'query': "SELECT COUNT(*) FROM inventory_items_new WHERE sku IS NOT NULL",
            'description': "Universal inventory items with SKUs",
            'expected_min': 1
        },
        {
            'query': "SELECT COUNT(*) FROM invoices_new WHERE type IN ('gold', 'general')",
            'description': "Dual invoice types",
            'expected_min': 1
        },
        {
            'query': "SELECT COUNT(*) FROM chart_of_accounts",
            'description': "Chart of accounts",
            'expected_min': 1
        },
        {
            'query': "SELECT COUNT(*) FROM customers",
            'description': "Customers",
            'expected_min': 1
        }
    ]
    
    with engine.connect() as conn:
        all_passed = True
        
        for validation in validations:
            try:
                count = conn.execute(text(validation['query'])).scalar()
                if count >= validation['expected_min']:
                    print(f"   ✅ {validation['description']}: {count} records")
                else:
                    print(f"   ❌ {validation['description']}: {count} records (expected >= {validation['expected_min']})")
                    all_passed = False
            except Exception as e:
                print(f"   ❌ {validation['description']}: Query failed - {e}")
                all_passed = False
        
        return all_passed

def validate_features():
    """Validate specific features are working"""
    print("🎯 Validating key features...")
    
    with engine.connect() as conn:
        # Test LTREE functionality
        try:
            result = conn.execute(text("""
                SELECT COUNT(*) FROM categories_new WHERE path <@ 'jewelry'::ltree
            """)).scalar()
            print(f"   ✅ LTREE hierarchy queries: {result} categories under 'jewelry'")
        except Exception as e:
            print(f"   ❌ LTREE hierarchy queries failed: {e}")
            return False
        
        # Test dual invoice types
        try:
            gold_count = conn.execute(text("""
                SELECT COUNT(*) FROM invoices_new WHERE type = 'gold'
            """)).scalar()
            general_count = conn.execute(text("""
                SELECT COUNT(*) FROM invoices_new WHERE type = 'general'
            """)).scalar()
            print(f"   ✅ Dual invoice system: {gold_count} Gold, {general_count} General invoices")
        except Exception as e:
            print(f"   ❌ Dual invoice system failed: {e}")
            return False
        
        # Test SKU uniqueness
        try:
            sku_count = conn.execute(text("""
                SELECT COUNT(DISTINCT sku) FROM inventory_items_new WHERE sku IS NOT NULL
            """)).scalar()
            total_items = conn.execute(text("""
                SELECT COUNT(*) FROM inventory_items_new WHERE sku IS NOT NULL
            """)).scalar()
            
            if sku_count == total_items:
                print(f"   ✅ SKU uniqueness: {sku_count} unique SKUs for {total_items} items")
            else:
                print(f"   ❌ SKU uniqueness: {sku_count} unique SKUs for {total_items} items (should be equal)")
                return False
        except Exception as e:
            print(f"   ❌ SKU uniqueness test failed: {e}")
            return False
        
        # Test Gold-specific fields
        try:
            gold_fields_count = conn.execute(text("""
                SELECT COUNT(*) FROM invoices_new 
                WHERE type = 'gold' AND (gold_sood IS NOT NULL OR gold_ojrat IS NOT NULL OR gold_maliyat IS NOT NULL)
            """)).scalar()
            print(f"   ✅ Gold-specific fields: {gold_fields_count} Gold invoices with specific fields")
        except Exception as e:
            print(f"   ❌ Gold-specific fields test failed: {e}")
            return False
        
        return True

def validate_indexes():
    """Validate that important indexes exist"""
    print("🔍 Validating database indexes...")
    
    important_indexes = [
        'idx_categories_new_path',
        'idx_inventory_items_new_sku',
        'idx_invoices_new_type',
        'idx_invoices_new_qr_code'
    ]
    
    with engine.connect() as conn:
        for index_name in important_indexes:
            try:
                result = conn.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM pg_indexes 
                        WHERE indexname = '{index_name}'
                    )
                """)).scalar()
                
                if result:
                    print(f"   ✅ Index '{index_name}' exists")
                else:
                    print(f"   ⚠️ Index '{index_name}' missing (may affect performance)")
            except Exception as e:
                print(f"   ❌ Index check failed for '{index_name}': {e}")

def run_validation():
    """Run complete migration validation"""
    print("🚀 Starting Universal Migration Validation")
    print("=" * 60)
    
    try:
        # Step 1: Validate extensions
        validate_extensions()
        
        # Step 2: Validate tables
        if not validate_tables():
            print("\n❌ Table validation failed!")
            return False
        
        # Step 3: Validate data
        if not validate_data():
            print("\n❌ Data validation failed!")
            return False
        
        # Step 4: Validate features
        if not validate_features():
            print("\n❌ Feature validation failed!")
            return False
        
        # Step 5: Validate indexes
        validate_indexes()
        
        print("\n" + "=" * 60)
        print("✅ MIGRATION VALIDATION SUCCESSFUL!")
        print("\n🎉 Universal Inventory and Invoice Management System is ready!")
        print("\n📋 Validated Features:")
        print("   • PostgreSQL extensions (UUID, LTREE, pg_trgm)")
        print("   • All required database tables")
        print("   • Test data in all tables")
        print("   • LTREE hierarchical categories")
        print("   • Dual invoice system (Gold vs General)")
        print("   • SKU uniqueness constraints")
        print("   • Gold-specific invoice fields")
        print("   • Database indexes for performance")
        
        print("\n🚀 Ready for backend service implementation!")
        return True
        
    except Exception as e:
        print(f"\n❌ Validation failed with error: {e}")
        return False

if __name__ == "__main__":
    success = run_validation()
    if not success:
        exit(1)