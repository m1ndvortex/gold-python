#!/usr/bin/env python3
"""
Universal Inventory and Invoice Management System - Database Schema Migration
This script implements the enhanced database schema with:
- LTREE extension for unlimited nested categories
- Universal inventory items with custom attributes, tags, SKU, barcode, QR codes
- Dual invoice system (Gold vs General)
- Comprehensive double-entry accounting
- Image management system
- Audit trail tables
"""

import uuid
from datetime import datetime
from sqlalchemy import text, create_engine
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base

def enable_extensions():
    """Enable required PostgreSQL extensions"""
    print("🔧 Enabling PostgreSQL extensions...")
    
    with engine.connect() as conn:
        # Enable UUID extension
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
        
        # Enable LTREE extension for hierarchical categories
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS ltree;"))
        
        # Enable pg_trgm for better text search
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
        
        conn.commit()
    
    print("✅ Extensions enabled successfully")

def create_enhanced_schema():
    """Create enhanced database schema with new tables"""
    print("🏗️ Creating enhanced database schema...")
    
    with engine.connect() as conn:
        # Business Configuration Table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS business_configurations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                business_type VARCHAR(50) NOT NULL DEFAULT 'gold_shop',
                business_name VARCHAR(255) NOT NULL,
                configuration JSONB NOT NULL DEFAULT '{}',
                terminology_mapping JSONB DEFAULT '{}',
                workflow_config JSONB DEFAULT '{}',
                feature_flags JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Enhanced Categories with LTREE
        conn.execute(text("""
            DROP TABLE IF EXISTS categories_new CASCADE;
            CREATE TABLE categories_new (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                name_persian VARCHAR(255),
                parent_id UUID REFERENCES categories_new(id) ON DELETE CASCADE,
                path LTREE NOT NULL,
                level INTEGER NOT NULL DEFAULT 0,
                
                -- Attribute schema for custom fields
                attribute_schema JSONB DEFAULT '[]',
                
                -- Visual and organizational
                description TEXT,
                icon VARCHAR(50),
                color VARCHAR(7) DEFAULT '#3B82F6',
                sort_order INTEGER DEFAULT 0,
                
                -- Image support
                image_id UUID,
                
                -- Business type specific
                business_type VARCHAR(50) DEFAULT 'universal',
                category_metadata JSONB DEFAULT '{}',
                
                -- Status
                is_active BOOLEAN DEFAULT TRUE,
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID,
                updated_by UUID
            );
        """))
        
        # Create indexes for categories
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_categories_new_path ON categories_new USING GIST (path);
            CREATE INDEX IF NOT EXISTS idx_categories_new_parent ON categories_new(parent_id);
            CREATE INDEX IF NOT EXISTS idx_categories_new_level ON categories_new(level);
            CREATE INDEX IF NOT EXISTS idx_categories_new_business_type ON categories_new(business_type);
            CREATE INDEX IF NOT EXISTS idx_categories_new_active ON categories_new(is_active);
        """))
        
        # Universal Inventory Items
        conn.execute(text("""
            DROP TABLE IF EXISTS inventory_items_new CASCADE;
            CREATE TABLE inventory_items_new (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                
                -- Identifiers
                sku VARCHAR(100) UNIQUE NOT NULL,
                barcode VARCHAR(100) UNIQUE,
                qr_code VARCHAR(255) UNIQUE,
                
                -- Basic information
                name VARCHAR(255) NOT NULL,
                name_persian VARCHAR(255),
                description TEXT,
                description_persian TEXT,
                category_id UUID REFERENCES categories_new(id),
                
                -- Pricing
                cost_price DECIMAL(15,2) NOT NULL DEFAULT 0,
                sale_price DECIMAL(15,2) NOT NULL DEFAULT 0,
                currency VARCHAR(3) DEFAULT 'USD',
                
                -- Inventory tracking
                stock_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
                unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'piece',
                low_stock_threshold DECIMAL(15,3) DEFAULT 0,
                reorder_point DECIMAL(15,3) DEFAULT 0,
                max_stock_level DECIMAL(15,3),
                
                -- Universal attributes and tags
                custom_attributes JSONB DEFAULT '{}',
                tags TEXT[] DEFAULT '{}',
                
                -- Images
                primary_image_id UUID,
                image_ids UUID[] DEFAULT '{}',
                
                -- Business type specific fields
                business_type_fields JSONB DEFAULT '{}',
                
                -- Gold shop compatibility (backward compatibility)
                weight_grams DECIMAL(10, 3),
                gold_specific JSONB,
                
                -- Status and metadata
                is_active BOOLEAN DEFAULT TRUE,
                item_metadata JSONB DEFAULT '{}',
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID,
                updated_by UUID
            );
        """))
        
        # Create indexes for inventory items
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_sku ON inventory_items_new(sku);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_barcode ON inventory_items_new(barcode);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_qr_code ON inventory_items_new(qr_code);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_category ON inventory_items_new(category_id);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_active ON inventory_items_new(is_active);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_stock ON inventory_items_new(stock_quantity);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_tags ON inventory_items_new USING GIN(tags);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_attributes ON inventory_items_new USING GIN(custom_attributes);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_name_search ON inventory_items_new USING GIN(to_tsvector('english', name));
        """))
        
        # Enhanced Invoices with Dual Type Support
        conn.execute(text("""
            DROP TABLE IF EXISTS invoices_new CASCADE;
            CREATE TABLE invoices_new (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                invoice_number VARCHAR(100) UNIQUE NOT NULL,
                
                -- Invoice type (Gold vs General)
                type VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (type IN ('gold', 'general')),
                status VARCHAR(50) NOT NULL DEFAULT 'draft',
                
                -- Customer information
                customer_id UUID,
                customer_name VARCHAR(255),
                customer_phone VARCHAR(50),
                customer_address TEXT,
                customer_email VARCHAR(100),
                
                -- Pricing
                subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
                tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
                discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
                total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
                currency VARCHAR(3) DEFAULT 'USD',
                
                -- Payment tracking
                paid_amount DECIMAL(15,2) DEFAULT 0,
                remaining_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
                payment_status VARCHAR(50) DEFAULT 'unpaid',
                payment_method VARCHAR(100),
                payment_date TIMESTAMP WITH TIME ZONE,
                
                -- Workflow management
                workflow_stage VARCHAR(50) DEFAULT 'draft',
                stock_affected BOOLEAN DEFAULT FALSE,
                requires_approval BOOLEAN DEFAULT FALSE,
                approved_by UUID,
                approved_at TIMESTAMP WITH TIME ZONE,
                approval_notes TEXT,
                
                -- Gold-specific fields (conditional)
                gold_price_per_gram DECIMAL(10, 2),
                labor_cost_percentage DECIMAL(5, 2),
                profit_percentage DECIMAL(5, 2),
                vat_percentage DECIMAL(5, 2),
                gold_sood DECIMAL(15,2), -- سود (profit)
                gold_ojrat DECIMAL(15,2), -- اجرت (wage/labor fee)
                gold_maliyat DECIMAL(15,2), -- مالیات (tax)
                gold_total_weight DECIMAL(10,3),
                
                -- QR Card information
                qr_code VARCHAR(255) UNIQUE,
                card_url VARCHAR(500),
                card_theme VARCHAR(50) DEFAULT 'glass',
                card_config JSONB DEFAULT '{}',
                
                -- Additional metadata
                invoice_metadata JSONB DEFAULT '{}',
                notes TEXT,
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID,
                updated_by UUID
            );
        """))
        
        # Create indexes for invoices
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_invoices_new_type ON invoices_new(type);
            CREATE INDEX IF NOT EXISTS idx_invoices_new_status ON invoices_new(status);
            CREATE INDEX IF NOT EXISTS idx_invoices_new_customer ON invoices_new(customer_id);
            CREATE INDEX IF NOT EXISTS idx_invoices_new_date ON invoices_new(created_at);
            CREATE INDEX IF NOT EXISTS idx_invoices_new_workflow ON invoices_new(workflow_stage);
            CREATE INDEX IF NOT EXISTS idx_invoices_new_payment_status ON invoices_new(payment_status);
            CREATE INDEX IF NOT EXISTS idx_invoices_new_qr_code ON invoices_new(qr_code);
        """))
        
        # Enhanced Invoice Items
        conn.execute(text("""
            DROP TABLE IF EXISTS invoice_items_new CASCADE;
            CREATE TABLE invoice_items_new (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                invoice_id UUID NOT NULL REFERENCES invoices_new(id) ON DELETE CASCADE,
                inventory_item_id UUID,
                
                -- Item snapshot (preserved at invoice time)
                item_name VARCHAR(255) NOT NULL,
                item_sku VARCHAR(100),
                item_description TEXT,
                
                -- Quantity and pricing
                quantity DECIMAL(15,3) NOT NULL,
                unit_price DECIMAL(15,2) NOT NULL,
                total_price DECIMAL(15,2) NOT NULL,
                
                -- Unit and weight information
                unit_of_measure VARCHAR(50) DEFAULT 'piece',
                weight_grams DECIMAL(10, 3),
                
                -- Images (snapshot at invoice time)
                item_images JSONB DEFAULT '[]',
                
                -- Gold-specific item fields
                gold_specific JSONB,
                
                -- Custom attributes snapshot
                custom_attributes JSONB DEFAULT '{}',
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Create indexes for invoice items
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_invoice_items_new_invoice ON invoice_items_new(invoice_id);
            CREATE INDEX IF NOT EXISTS idx_invoice_items_new_inventory_item ON invoice_items_new(inventory_item_id);
        """))
        
        conn.commit()
    
    print("✅ Enhanced schema created successfully")

def create_accounting_tables():
    """Create comprehensive double-entry accounting tables"""
    print("📊 Creating double-entry accounting tables...")
    
    with engine.connect() as conn:
        # Chart of Accounts
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chart_of_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                account_code VARCHAR(20) UNIQUE NOT NULL,
                account_name VARCHAR(255) NOT NULL,
                account_name_persian VARCHAR(255),
                account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
                parent_account_id UUID REFERENCES chart_of_accounts(id),
                account_path LTREE,
                level INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Journal Entries (Double-Entry)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS journal_entries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                entry_number VARCHAR(50) UNIQUE NOT NULL,
                entry_date DATE NOT NULL,
                reference VARCHAR(255),
                description TEXT NOT NULL,
                
                -- Source tracking
                source_type VARCHAR(50), -- 'invoice', 'payment', 'adjustment', 'manual'
                source_id UUID,
                
                -- Totals (must balance)
                total_debit DECIMAL(15,2) NOT NULL DEFAULT 0,
                total_credit DECIMAL(15,2) NOT NULL DEFAULT 0,
                is_balanced BOOLEAN DEFAULT FALSE,
                
                -- Status
                status VARCHAR(20) DEFAULT 'draft', -- draft, posted, locked
                posted_at TIMESTAMP WITH TIME ZONE,
                posted_by UUID,
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID,
                updated_by UUID
            );
        """))
        
        # Journal Entry Lines
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS journal_entry_lines (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
                account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
                
                -- Debit/Credit amounts
                debit_amount DECIMAL(15,2) DEFAULT 0,
                credit_amount DECIMAL(15,2) DEFAULT 0,
                
                -- Line description
                description TEXT,
                
                -- Reference information
                reference_type VARCHAR(50),
                reference_id UUID,
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Subsidiary Accounts (حساب‌های تفصیلی)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS subsidiary_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                account_code VARCHAR(20) UNIQUE NOT NULL,
                account_name VARCHAR(255) NOT NULL,
                account_name_persian VARCHAR(255),
                parent_account_id UUID REFERENCES chart_of_accounts(id),
                
                -- Customer/Vendor linking
                entity_type VARCHAR(50), -- 'customer', 'vendor', 'employee', 'other'
                entity_id UUID,
                
                -- Balance tracking
                current_balance DECIMAL(15,2) DEFAULT 0,
                balance_type VARCHAR(10) DEFAULT 'debit', -- debit, credit
                
                -- Status
                is_active BOOLEAN DEFAULT TRUE,
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Check Management (مدیریت چک‌ها)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS check_management (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                check_number VARCHAR(50) NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                account_number VARCHAR(50),
                
                -- Check details
                amount DECIMAL(15,2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'USD',
                issue_date DATE NOT NULL,
                due_date DATE NOT NULL,
                
                -- Parties
                drawer_name VARCHAR(255), -- صادرکننده
                payee_name VARCHAR(255), -- دریافت‌کننده
                
                -- Status tracking
                status VARCHAR(50) DEFAULT 'issued', -- issued, deposited, cleared, bounced, cancelled
                transaction_date DATE,
                clearance_date DATE,
                
                -- Linking
                customer_id UUID,
                invoice_id UUID,
                journal_entry_id UUID,
                
                -- Notes
                notes TEXT,
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID,
                updated_by UUID
            );
        """))
        
        # Installment Accounts (حساب‌های اقساطی)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS installment_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                account_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id UUID NOT NULL,
                invoice_id UUID,
                
                -- Installment details
                total_amount DECIMAL(15,2) NOT NULL,
                paid_amount DECIMAL(15,2) DEFAULT 0,
                remaining_amount DECIMAL(15,2) NOT NULL,
                
                -- Schedule
                installment_count INTEGER NOT NULL,
                installment_amount DECIMAL(15,2) NOT NULL,
                start_date DATE NOT NULL,
                
                -- Status
                status VARCHAR(50) DEFAULT 'active', -- active, completed, defaulted, cancelled
                
                -- Interest and fees
                interest_rate DECIMAL(5,2) DEFAULT 0,
                late_fee_amount DECIMAL(10,2) DEFAULT 0,
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID,
                updated_by UUID
            );
        """))
        
        # Installment Payments
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS installment_payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                installment_account_id UUID NOT NULL REFERENCES installment_accounts(id) ON DELETE CASCADE,
                
                -- Payment details
                installment_number INTEGER NOT NULL,
                due_date DATE NOT NULL,
                amount_due DECIMAL(15,2) NOT NULL,
                amount_paid DECIMAL(15,2) DEFAULT 0,
                payment_date DATE,
                
                -- Status
                status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, partial
                
                -- Late fees
                late_fee_applied DECIMAL(10,2) DEFAULT 0,
                days_overdue INTEGER DEFAULT 0,
                
                -- Payment method
                payment_method VARCHAR(50),
                payment_reference VARCHAR(100),
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Bank Reconciliation
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS bank_reconciliation (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                bank_account VARCHAR(50) NOT NULL,
                statement_date DATE NOT NULL,
                
                -- Balances
                book_balance DECIMAL(15,2) NOT NULL,
                bank_balance DECIMAL(15,2) NOT NULL,
                reconciled_balance DECIMAL(15,2),
                
                -- Status
                status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, reviewed
                reconciled_by UUID,
                reconciled_at TIMESTAMP WITH TIME ZONE,
                
                -- Notes
                notes TEXT,
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Create accounting indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_code ON chart_of_accounts(account_code);
            CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON chart_of_accounts(account_type);
            CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_path ON chart_of_accounts USING GIST(account_path);
            
            CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
            CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON journal_entries(source_type, source_id);
            CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
            
            CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
            CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);
            
            CREATE INDEX IF NOT EXISTS idx_subsidiary_accounts_entity ON subsidiary_accounts(entity_type, entity_id);
            CREATE INDEX IF NOT EXISTS idx_subsidiary_accounts_parent ON subsidiary_accounts(parent_account_id);
            
            CREATE INDEX IF NOT EXISTS idx_check_management_status ON check_management(status);
            CREATE INDEX IF NOT EXISTS idx_check_management_due_date ON check_management(due_date);
            CREATE INDEX IF NOT EXISTS idx_check_management_customer ON check_management(customer_id);
            
            CREATE INDEX IF NOT EXISTS idx_installment_accounts_customer ON installment_accounts(customer_id);
            CREATE INDEX IF NOT EXISTS idx_installment_accounts_status ON installment_accounts(status);
            
            CREATE INDEX IF NOT EXISTS idx_installment_payments_account ON installment_payments(installment_account_id);
            CREATE INDEX IF NOT EXISTS idx_installment_payments_due_date ON installment_payments(due_date);
            CREATE INDEX IF NOT EXISTS idx_installment_payments_status ON installment_payments(status);
        """))
        
        conn.commit()
    
    print("✅ Accounting tables created successfully")

def create_image_management_tables():
    """Create image management and storage tables"""
    print("🖼️ Creating image management tables...")
    
    with engine.connect() as conn:
        # Images table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS images (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                
                -- File information
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                file_size INTEGER NOT NULL,
                
                -- Image dimensions
                width INTEGER,
                height INTEGER,
                
                -- URLs
                url VARCHAR(500) NOT NULL,
                thumbnail_url VARCHAR(500),
                medium_url VARCHAR(500),
                
                -- Context and usage
                context_type VARCHAR(50) NOT NULL, -- 'category', 'item', 'invoice', 'user', 'company'
                context_id UUID,
                
                -- Image metadata
                alt_text VARCHAR(255),
                caption TEXT,
                image_metadata JSONB DEFAULT '{}',
                
                -- Processing status
                processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
                processing_error TEXT,
                
                -- Storage information
                storage_provider VARCHAR(50) DEFAULT 'local', -- local, s3, cloudinary, etc.
                storage_path VARCHAR(500),
                storage_metadata JSONB DEFAULT '{}',
                
                -- Status
                is_active BOOLEAN DEFAULT TRUE,
                
                -- Audit trail
                uploaded_by UUID,
                uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Image variants (thumbnails, different sizes)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS image_variants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                parent_image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
                
                -- Variant information
                variant_type VARCHAR(50) NOT NULL, -- 'thumbnail', 'small', 'medium', 'large'
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                
                -- File information
                filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER NOT NULL,
                url VARCHAR(500) NOT NULL,
                
                -- Processing
                processing_status VARCHAR(50) DEFAULT 'pending',
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Create image indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_images_context ON images(context_type, context_id);
            CREATE INDEX IF NOT EXISTS idx_images_filename ON images(filename);
            CREATE INDEX IF NOT EXISTS idx_images_uploaded_by ON images(uploaded_by);
            CREATE INDEX IF NOT EXISTS idx_images_status ON images(processing_status);
            CREATE INDEX IF NOT EXISTS idx_images_active ON images(is_active);
            
            CREATE INDEX IF NOT EXISTS idx_image_variants_parent ON image_variants(parent_image_id);
            CREATE INDEX IF NOT EXISTS idx_image_variants_type ON image_variants(variant_type);
        """))
        
        conn.commit()
    
    print("✅ Image management tables created successfully")

def create_audit_trail_tables():
    """Create comprehensive audit trail tables"""
    print("📋 Creating audit trail tables...")
    
    with engine.connect() as conn:
        # Audit log for all data changes
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                
                -- What was changed
                table_name VARCHAR(100) NOT NULL,
                record_id UUID NOT NULL,
                operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
                
                -- Change details
                old_values JSONB,
                new_values JSONB,
                changed_fields TEXT[],
                
                -- Context
                user_id UUID,
                session_id VARCHAR(255),
                ip_address INET,
                user_agent TEXT,
                
                -- Additional context
                business_context VARCHAR(100), -- 'invoice_creation', 'inventory_update', etc.
                notes TEXT,
                
                -- Timestamp
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # System events log
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS system_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                
                -- Event information
                event_type VARCHAR(100) NOT NULL,
                event_category VARCHAR(50) NOT NULL, -- 'security', 'business', 'system', 'error'
                severity VARCHAR(20) DEFAULT 'info', -- debug, info, warning, error, critical
                
                -- Event details
                message TEXT NOT NULL,
                event_data JSONB DEFAULT '{}',
                
                -- Context
                user_id UUID,
                session_id VARCHAR(255),
                ip_address INET,
                
                -- Source
                source_module VARCHAR(100),
                source_function VARCHAR(100),
                
                -- Timestamp
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Create audit indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
            CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit_log(operation);
            
            CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type);
            CREATE INDEX IF NOT EXISTS idx_system_events_category ON system_events(event_category);
            CREATE INDEX IF NOT EXISTS idx_system_events_severity ON system_events(severity);
            CREATE INDEX IF NOT EXISTS idx_system_events_created ON system_events(created_at);
            CREATE INDEX IF NOT EXISTS idx_system_events_user ON system_events(user_id);
        """))
        
        conn.commit()
    
    print("✅ Audit trail tables created successfully")

def create_qr_card_tables():
    """Create QR invoice card tables"""
    print("🔗 Creating QR invoice card tables...")
    
    with engine.connect() as conn:
        # QR Invoice Cards
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS qr_invoice_cards (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                invoice_id UUID NOT NULL REFERENCES invoices_new(id) ON DELETE CASCADE,
                
                -- QR Code information
                qr_code VARCHAR(255) UNIQUE NOT NULL,
                card_url VARCHAR(500) UNIQUE NOT NULL,
                short_url VARCHAR(100) UNIQUE,
                
                -- Card configuration
                theme VARCHAR(50) DEFAULT 'glass', -- glass, modern, classic
                background_color VARCHAR(7) DEFAULT '#ffffff',
                text_color VARCHAR(7) DEFAULT '#000000',
                accent_color VARCHAR(7) DEFAULT '#3B82F6',
                
                -- Card data (snapshot at creation)
                card_data JSONB NOT NULL,
                
                -- Access control
                is_public BOOLEAN DEFAULT TRUE,
                requires_password BOOLEAN DEFAULT FALSE,
                access_password VARCHAR(255),
                
                -- Expiration
                expires_at TIMESTAMP WITH TIME ZONE,
                
                -- Analytics
                view_count INTEGER DEFAULT 0,
                last_viewed_at TIMESTAMP WITH TIME ZONE,
                
                -- Status
                is_active BOOLEAN DEFAULT TRUE,
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID
            );
        """))
        
        # QR Card access log
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS qr_card_access_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                card_id UUID NOT NULL REFERENCES qr_invoice_cards(id) ON DELETE CASCADE,
                
                -- Access details
                ip_address INET,
                user_agent TEXT,
                referer VARCHAR(500),
                
                -- Location (if available)
                country VARCHAR(100),
                city VARCHAR(100),
                
                -- Device information
                device_type VARCHAR(50), -- mobile, tablet, desktop
                browser VARCHAR(100),
                os VARCHAR(100),
                
                -- Timestamp
                accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Create QR card indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_qr_invoice_cards_invoice ON qr_invoice_cards(invoice_id);
            CREATE INDEX IF NOT EXISTS idx_qr_invoice_cards_qr_code ON qr_invoice_cards(qr_code);
            CREATE INDEX IF NOT EXISTS idx_qr_invoice_cards_url ON qr_invoice_cards(card_url);
            CREATE INDEX IF NOT EXISTS idx_qr_invoice_cards_active ON qr_invoice_cards(is_active);
            CREATE INDEX IF NOT EXISTS idx_qr_invoice_cards_expires ON qr_invoice_cards(expires_at);
            
            CREATE INDEX IF NOT EXISTS idx_qr_card_access_log_card ON qr_card_access_log(card_id);
            CREATE INDEX IF NOT EXISTS idx_qr_card_access_log_accessed ON qr_card_access_log(accessed_at);
            CREATE INDEX IF NOT EXISTS idx_qr_card_access_log_ip ON qr_card_access_log(ip_address);
        """))
        
        conn.commit()
    
    print("✅ QR invoice card tables created successfully")

def run_migration():
    """Run the complete database migration"""
    print("🚀 Starting Universal Inventory and Invoice Management System Migration")
    print("=" * 80)
    
    try:
        # Step 1: Enable extensions
        enable_extensions()
        
        # Step 2: Create enhanced schema
        create_enhanced_schema()
        
        # Step 3: Create accounting tables
        create_accounting_tables()
        
        # Step 4: Create image management tables
        create_image_management_tables()
        
        # Step 5: Create audit trail tables
        create_audit_trail_tables()
        
        # Step 6: Create QR card tables
        create_qr_card_tables()
        
        print("\n" + "=" * 80)
        print("✅ Migration completed successfully!")
        print("🎉 Universal Inventory and Invoice Management System schema is ready!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    if not success:
        exit(1)