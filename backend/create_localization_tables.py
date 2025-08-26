#!/usr/bin/env python3
"""
Create localization tables in the database
"""

from database import engine
from database_base import Base
from models_localization import (
    LanguageConfiguration, Translation, BusinessTerminology,
    CurrencyConfiguration, ExchangeRateHistory, DocumentTemplate,
    LocalizationSettings, MultilingualData, SearchIndex, TranslationMemory
)

def create_tables():
    """Create only localization tables"""
    try:
        print("Creating localization tables...")
        
        from sqlalchemy import text
        conn = engine.connect()
        
        # Create translations table manually
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS translations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    language_id UUID NOT NULL REFERENCES language_configurations(id),
                    translation_key VARCHAR(255) NOT NULL,
                    context VARCHAR(100),
                    namespace VARCHAR(50),
                    original_text TEXT NOT NULL,
                    translated_text TEXT NOT NULL,
                    is_approved BOOLEAN DEFAULT FALSE,
                    is_fuzzy BOOLEAN DEFAULT FALSE,
                    translator_notes TEXT,
                    plural_forms JSONB,
                    version INTEGER DEFAULT 1,
                    last_modified_by UUID REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            print("✅ Created table: translations")
        except Exception as e:
            print(f"⚠️  Table translations error: {e}")
        
        # Create business_terminology table manually (without business_config reference for now)
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS business_terminology (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    language_id UUID NOT NULL REFERENCES language_configurations(id),
                    business_config_id UUID,
                    standard_term VARCHAR(100) NOT NULL,
                    business_term VARCHAR(100) NOT NULL,
                    term_category VARCHAR(50),
                    usage_context VARCHAR(100),
                    industry VARCHAR(100),
                    business_type VARCHAR(50),
                    is_custom BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    priority INTEGER DEFAULT 0,
                    created_by UUID REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            print("✅ Created table: business_terminology")
        except Exception as e:
            print(f"⚠️  Table business_terminology error: {e}")
        
        # Create document_templates table manually
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS document_templates (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    language_id UUID NOT NULL REFERENCES language_configurations(id),
                    template_name VARCHAR(255) NOT NULL,
                    template_type VARCHAR(50) NOT NULL,
                    document_category VARCHAR(100),
                    template_content TEXT NOT NULL,
                    template_variables JSONB,
                    page_format VARCHAR(20) DEFAULT 'A4',
                    orientation VARCHAR(10) DEFAULT 'portrait',
                    margins JSONB,
                    font_family VARCHAR(100),
                    font_size INTEGER DEFAULT 12,
                    line_height DECIMAL(3,2) DEFAULT 1.5,
                    text_alignment VARCHAR(10),
                    number_format JSONB,
                    date_format VARCHAR(50),
                    is_active BOOLEAN DEFAULT TRUE,
                    is_default BOOLEAN DEFAULT FALSE,
                    version VARCHAR(20) DEFAULT '1.0',
                    created_by UUID REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            print("✅ Created table: document_templates")
        except Exception as e:
            print(f"⚠️  Table document_templates error: {e}")
        
        # Create localization_settings table manually
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS localization_settings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    default_language VARCHAR(10) NOT NULL DEFAULT 'en',
                    default_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
                    default_timezone VARCHAR(50) DEFAULT 'UTC',
                    default_country VARCHAR(2),
                    default_region VARCHAR(50),
                    date_format_preference VARCHAR(50) DEFAULT 'YYYY-MM-DD',
                    time_format_preference VARCHAR(20) DEFAULT '24h',
                    number_format_preference VARCHAR(50) DEFAULT '1,234.56',
                    enable_auto_translation BOOLEAN DEFAULT FALSE,
                    auto_translation_service VARCHAR(100),
                    fallback_language VARCHAR(10) DEFAULT 'en',
                    enable_rtl_support BOOLEAN DEFAULT TRUE,
                    rtl_languages JSONB DEFAULT '["ar", "fa", "he", "ur"]',
                    enable_multi_currency BOOLEAN DEFAULT TRUE,
                    auto_update_exchange_rates BOOLEAN DEFAULT FALSE,
                    exchange_rate_api VARCHAR(100),
                    localize_images BOOLEAN DEFAULT FALSE,
                    localize_documents BOOLEAN DEFAULT TRUE,
                    localize_reports BOOLEAN DEFAULT TRUE,
                    updated_by UUID REFERENCES users(id),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("✅ Created table: localization_settings")
        except Exception as e:
            print(f"⚠️  Table localization_settings error: {e}")
        
        # Create multilingual_data table manually
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS multilingual_data (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    language_id UUID NOT NULL REFERENCES language_configurations(id),
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id UUID NOT NULL,
                    field_name VARCHAR(100) NOT NULL,
                    field_content TEXT NOT NULL,
                    is_auto_translated BOOLEAN DEFAULT FALSE,
                    translation_confidence DECIMAL(3,2),
                    is_active BOOLEAN DEFAULT TRUE,
                    needs_review BOOLEAN DEFAULT FALSE,
                    created_by UUID REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            print("✅ Created table: multilingual_data")
        except Exception as e:
            print(f"⚠️  Table multilingual_data error: {e}")
        
        # Create translation_memory table manually
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS translation_memory (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    source_language VARCHAR(10) NOT NULL,
                    target_language VARCHAR(10) NOT NULL,
                    source_text TEXT NOT NULL,
                    target_text TEXT NOT NULL,
                    context VARCHAR(255),
                    domain VARCHAR(100),
                    quality_score DECIMAL(3,2) DEFAULT 0,
                    usage_count INTEGER DEFAULT 0,
                    last_used TIMESTAMP WITH TIME ZONE,
                    source_type VARCHAR(50),
                    created_by UUID REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            print("✅ Created table: translation_memory")
        except Exception as e:
            print(f"⚠️  Table translation_memory error: {e}")
        
        conn.commit()
        conn.close()
        
        print("✅ Localization tables creation completed!")
        
        # List created tables
        conn = engine.connect()
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%language%' 
            OR table_name LIKE '%translation%' 
            OR table_name LIKE '%currency%'
            OR table_name LIKE '%localization%'
            OR table_name LIKE '%multilingual%'
            OR table_name LIKE '%terminology%'
            OR table_name LIKE '%document_template%'
            OR table_name LIKE '%search_index%')
            ORDER BY table_name
        """))
        
        tables = [row[0] for row in result]
        print(f"Localization tables in database: {tables}")
        conn.close()
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    create_tables()