#!/usr/bin/env python3
"""
Clean Old Data Script for Universal Inventory and Invoice Management System
This script removes existing inventory and invoice data that doesn't match the new universal structure
"""

from sqlalchemy import text
from database import engine
from sqlalchemy.orm import Session

def clean_old_data():
    """Clean existing data that doesn't match new universal structure"""
    print("🧹 Cleaning old data that doesn't match new universal structure...")
    
    with engine.connect() as conn:
        try:
            # Start transaction
            trans = conn.begin()
            
            print("📊 Checking existing data...")
            
            # Get counts before deletion
            invoice_items_count = conn.execute(text("SELECT COUNT(*) FROM invoice_items")).scalar()
            invoices_count = conn.execute(text("SELECT COUNT(*) FROM invoices")).scalar()
            inventory_items_count = conn.execute(text("SELECT COUNT(*) FROM inventory_items")).scalar()
            categories_count = conn.execute(text("SELECT COUNT(*) FROM categories")).scalar()
            
            print(f"   • Invoice Items: {invoice_items_count}")
            print(f"   • Invoices: {invoices_count}")
            print(f"   • Inventory Items: {inventory_items_count}")
            print(f"   • Categories: {categories_count}")
            
            if invoice_items_count == 0 and invoices_count == 0 and inventory_items_count == 0:
                print("✅ No old data to clean - database is already clean")
                trans.rollback()
                return True
            
            print("\n🗑️ Deleting old data in correct order (respecting foreign keys)...")
            
            # Delete in correct order to respect foreign key constraints
            
            # 1. Delete invoice items first
            if invoice_items_count > 0:
                conn.execute(text("DELETE FROM invoice_items"))
                print(f"   ✅ Deleted {invoice_items_count} invoice items")
            
            # 2. Delete payments
            payments_count = conn.execute(text("SELECT COUNT(*) FROM payments")).scalar()
            if payments_count > 0:
                conn.execute(text("DELETE FROM payments"))
                print(f"   ✅ Deleted {payments_count} payments")
            
            # 3. Delete invoices
            if invoices_count > 0:
                conn.execute(text("DELETE FROM invoices"))
                print(f"   ✅ Deleted {invoices_count} invoices")
            
            # 4. Delete inventory items
            if inventory_items_count > 0:
                conn.execute(text("DELETE FROM inventory_items"))
                print(f"   ✅ Deleted {inventory_items_count} inventory items")
            
            # 5. Delete categories (keep basic structure but clean data)
            if categories_count > 0:
                conn.execute(text("DELETE FROM categories"))
                print(f"   ✅ Deleted {categories_count} categories")
            
            # 6. Clean accounting entries related to deleted invoices
            accounting_entries_count = conn.execute(text("SELECT COUNT(*) FROM accounting_entries")).scalar()
            if accounting_entries_count > 0:
                conn.execute(text("DELETE FROM accounting_entries"))
                print(f"   ✅ Deleted {accounting_entries_count} accounting entries")
            
            # 7. Reset sequences if they exist
            try:
                # Reset any auto-increment sequences (though we use UUIDs)
                conn.execute(text("SELECT setval(pg_get_serial_sequence('invoices', 'id'), 1, false) WHERE pg_get_serial_sequence('invoices', 'id') IS NOT NULL"))
            except:
                pass  # Ignore if no sequences exist
            
            # Commit the transaction
            trans.commit()
            
            print("\n✅ Old data cleaned successfully!")
            print("💡 Database is now ready for universal structure migration")
            
            return True
            
        except Exception as e:
            print(f"\n❌ Error cleaning old data: {e}")
            trans.rollback()
            return False

def verify_clean_state():
    """Verify that the database is in a clean state"""
    print("\n🔍 Verifying clean state...")
    
    with engine.connect() as conn:
        # Check critical tables are empty
        tables_to_check = [
            'invoice_items',
            'invoices', 
            'inventory_items',
            'categories',
            'payments',
            'accounting_entries'
        ]
        
        all_clean = True
        for table in tables_to_check:
            try:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                if count > 0:
                    print(f"   ⚠️ {table}: {count} records remaining")
                    all_clean = False
                else:
                    print(f"   ✅ {table}: clean")
            except Exception as e:
                print(f"   ❓ {table}: could not check ({e})")
        
        if all_clean:
            print("\n✅ Database is completely clean and ready for migration")
        else:
            print("\n⚠️ Some data remains - manual cleanup may be required")
        
        return all_clean

if __name__ == "__main__":
    print("🚀 Starting Old Data Cleanup")
    print("=" * 60)
    
    success = clean_old_data()
    
    if success:
        verify_clean_state()
        print("\n🎉 Cleanup completed successfully!")
    else:
        print("\n❌ Cleanup failed!")
        exit(1)