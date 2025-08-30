#!/usr/bin/env python3
"""
Create Universal Inventory Tables for Testing
"""

from sqlalchemy import create_engine, text
import os

def create_universal_tables():
    """Create universal inventory tables"""
    
    # Database connection
    db_url = "postgresql://goldshop_user:goldshop_password@goldshop_test_db:5432/goldshop"
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        print("🏗️ Creating universal inventory tables...")
        
        # Enable LTREE extension
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS ltree;"))
        
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
        
        # Enhanced Inventory Items
        conn.execute(text("""
            DROP TABLE IF EXISTS inventory_items_new CASCADE;
            CREATE TABLE inventory_items_new (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                name_persian VARCHAR(255),
                description TEXT,
                description_persian TEXT,
                category_id UUID REFERENCES categories_new(id),
                
                -- Pricing
                cost_price DECIMAL(15,2) DEFAULT 0.00,
                sale_price DECIMAL(15,2) DEFAULT 0.00,
                wholesale_price DECIMAL(15,2),
                
                -- Stock management
                stock_quantity INTEGER DEFAULT 0,
                reserved_quantity INTEGER DEFAULT 0,
                available_quantity INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED,
                unit_of_measure VARCHAR(50) DEFAULT 'piece',
                low_stock_threshold INTEGER DEFAULT 0,
                
                -- Identifiers
                sku VARCHAR(100) UNIQUE,
                barcode VARCHAR(100) UNIQUE,
                internal_code VARCHAR(100),
                
                -- Custom attributes (flexible schema)
                custom_attributes JSONB DEFAULT '{}',
                
                -- Tags and search
                tags TEXT[] DEFAULT '{}',
                search_keywords TEXT,
                
                -- Physical properties
                weight DECIMAL(10,3),
                dimensions JSONB, -- {length, width, height, unit}
                
                -- Business specific
                business_type VARCHAR(50) DEFAULT 'universal',
                item_metadata JSONB DEFAULT '{}',
                
                -- Status and lifecycle
                is_active BOOLEAN DEFAULT TRUE,
                is_sellable BOOLEAN DEFAULT TRUE,
                is_purchasable BOOLEAN DEFAULT TRUE,
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID,
                updated_by UUID
            );
        """))
        
        # Create indexes for inventory items
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_category ON inventory_items_new(category_id);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_sku ON inventory_items_new(sku);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_barcode ON inventory_items_new(barcode);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_name ON inventory_items_new(name);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_tags ON inventory_items_new USING GIN(tags);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_custom_attrs ON inventory_items_new USING GIN(custom_attributes);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_business_type ON inventory_items_new(business_type);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_active ON inventory_items_new(is_active);
            CREATE INDEX IF NOT EXISTS idx_inventory_items_new_stock ON inventory_items_new(stock_quantity);
        """))
        
        # Inventory Movements
        conn.execute(text("""
            DROP TABLE IF EXISTS inventory_movements CASCADE;
            CREATE TABLE inventory_movements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                inventory_item_id UUID REFERENCES inventory_items_new(id) ON DELETE CASCADE,
                movement_type VARCHAR(50) NOT NULL, -- 'in', 'out', 'adjustment', 'transfer'
                quantity INTEGER NOT NULL,
                unit_cost DECIMAL(15,2),
                total_cost DECIMAL(15,2),
                reference VARCHAR(255),
                reason TEXT,
                
                -- Source/destination tracking
                source_type VARCHAR(50), -- 'purchase', 'sale', 'adjustment', 'transfer'
                source_id UUID,
                
                -- Audit trail
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID
            );
        """))
        
        # Create indexes for movements
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(inventory_item_id);
            CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
            CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);
            CREATE INDEX IF NOT EXISTS idx_inventory_movements_source ON inventory_movements(source_type, source_id);
        """))
        
        conn.commit()
        print("✅ Universal inventory tables created successfully!")

if __name__ == "__main__":
    create_universal_tables()