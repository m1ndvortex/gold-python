"""
Enhanced Multi-Language and Localization Models

This module defines comprehensive database models for multi-language support,
localization, currency management, and business-specific terminology.
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey, DECIMAL, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from enum import Enum

from database_base import Base

class SupportedLanguage(str, Enum):
    """Supported languages with their codes"""
    ENGLISH = "en"
    PERSIAN = "fa"
    ARABIC = "ar"
    SPANISH = "es"
    FRENCH = "fr"
    GERMAN = "de"
    ITALIAN = "it"
    PORTUGUESE = "pt"
    RUSSIAN = "ru"
    CHINESE = "zh"
    JAPANESE = "ja"
    KOREAN = "ko"
    HINDI = "hi"
    URDU = "ur"
    TURKISH = "tr"

class TextDirection(str, Enum):
    """Text direction for languages"""
    LTR = "ltr"  # Left-to-right
    RTL = "rtl"  # Right-to-left

class CurrencyCode(str, Enum):
    """Supported currency codes"""
    USD = "USD"  # US Dollar
    EUR = "EUR"  # Euro
    GBP = "GBP"  # British Pound
    JPY = "JPY"  # Japanese Yen
    CNY = "CNY"  # Chinese Yuan
    INR = "INR"  # Indian Rupee
    AED = "AED"  # UAE Dirham
    SAR = "SAR"  # Saudi Riyal
    IRR = "IRR"  # Iranian Rial
    TRY = "TRY"  # Turkish Lira
    PKR = "PKR"  # Pakistani Rupee
    AFN = "AFN"  # Afghan Afghani
    IQD = "IQD"  # Iraqi Dinar

class LanguageConfiguration(Base):
    """Language configuration and metadata"""
    __tablename__ = "language_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_code = Column(String(10), unique=True, nullable=False)
    language_name = Column(String(100), nullable=False)
    native_name = Column(String(100), nullable=False)
    
    # Language properties
    text_direction = Column(String(3), nullable=False, default="ltr")
    is_rtl = Column(Boolean, default=False)
    
    # Locale settings
    locale_code = Column(String(20))  # e.g., "en-US", "fa-IR"
    country_code = Column(String(2))  # ISO country code
    
    # Number and date formatting
    number_format = Column(JSONB)  # Number formatting rules
    date_format = Column(JSONB)    # Date formatting patterns
    currency_format = Column(JSONB)  # Currency formatting rules
    
    # Language status
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    completion_percentage = Column(DECIMAL(5, 2), default=0)  # Translation completion
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    translations = relationship("Translation", back_populates="language")
    business_terminology = relationship("BusinessTerminology", back_populates="language")
    document_templates = relationship("DocumentTemplate", back_populates="language")
    
    __table_args__ = (
        Index('idx_language_config_code', 'language_code'),
        Index('idx_language_config_active', 'is_active'),
        Index('idx_language_config_default', 'is_default'),
    )

class Translation(Base):
    """Core translation table for all system text"""
    __tablename__ = "translations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_id = Column(UUID(as_uuid=True), ForeignKey("language_configurations.id"), nullable=False)
    
    # Translation key and context
    translation_key = Column(String(255), nullable=False)
    context = Column(String(100))  # e.g., "dashboard", "inventory", "invoice"
    namespace = Column(String(50))  # e.g., "ui", "business", "system"
    
    # Translation content
    original_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=False)
    
    # Translation metadata
    is_approved = Column(Boolean, default=False)
    is_fuzzy = Column(Boolean, default=False)  # Needs review
    translator_notes = Column(Text)
    
    # Pluralization support
    plural_forms = Column(JSONB)  # Different plural forms for the language
    
    # Version control
    version = Column(Integer, default=1)
    last_modified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    language = relationship("LanguageConfiguration", back_populates="translations")
    modifier = relationship("User", foreign_keys=[last_modified_by])
    
    __table_args__ = (
        Index('idx_translations_key_lang', 'translation_key', 'language_id'),
        Index('idx_translations_context', 'context'),
        Index('idx_translations_namespace', 'namespace'),
        Index('idx_translations_approved', 'is_approved'),
        Index('idx_translations_fuzzy', 'is_fuzzy'),
    )

class BusinessTerminology(Base):
    """Business-specific terminology customization per language"""
    __tablename__ = "business_terminology"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_id = Column(UUID(as_uuid=True), ForeignKey("language_configurations.id"), nullable=False)
    business_config_id = Column(UUID(as_uuid=True), ForeignKey("business_configurations.id"))
    
    # Terminology mapping
    standard_term = Column(String(100), nullable=False)
    business_term = Column(String(100), nullable=False)
    
    # Context and usage
    term_category = Column(String(50))  # e.g., "product", "service", "customer"
    usage_context = Column(String(100))  # e.g., "form_label", "menu_item", "report_header"
    
    # Industry-specific information
    industry = Column(String(100))
    business_type = Column(String(50))
    
    # Customization metadata
    is_custom = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)  # Higher priority overrides lower
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    language = relationship("LanguageConfiguration", back_populates="business_terminology")
    business_config = relationship("BusinessConfiguration")
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_business_terminology_lang_term', 'language_id', 'standard_term'),
        Index('idx_business_terminology_business', 'business_config_id'),
        Index('idx_business_terminology_category', 'term_category'),
        Index('idx_business_terminology_active', 'is_active'),
    )

class CurrencyConfiguration(Base):
    """Currency configuration and exchange rates"""
    __tablename__ = "currency_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    currency_code = Column(String(3), unique=True, nullable=False)
    currency_name = Column(String(100), nullable=False)
    currency_symbol = Column(String(10), nullable=False)
    
    # Currency properties
    decimal_places = Column(Integer, default=2)
    is_crypto = Column(Boolean, default=False)
    
    # Formatting rules
    symbol_position = Column(String(10), default="before")  # "before", "after"
    thousands_separator = Column(String(1), default=",")
    decimal_separator = Column(String(1), default=".")
    
    # Exchange rate information
    base_currency = Column(String(3), default="USD")
    exchange_rate = Column(DECIMAL(15, 8), default=1.0)
    last_rate_update = Column(DateTime(timezone=True))
    
    # Auto-update settings
    auto_update_enabled = Column(Boolean, default=False)
    rate_source = Column(String(100))  # API source for rates
    update_frequency_hours = Column(Integer, default=24)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    exchange_rate_history = relationship("ExchangeRateHistory", back_populates="currency")
    
    __table_args__ = (
        Index('idx_currency_config_code', 'currency_code'),
        Index('idx_currency_config_active', 'is_active'),
        Index('idx_currency_config_default', 'is_default'),
    )

class ExchangeRateHistory(Base):
    """Historical exchange rates for currencies"""
    __tablename__ = "exchange_rate_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    currency_id = Column(UUID(as_uuid=True), ForeignKey("currency_configurations.id"), nullable=False)
    
    # Rate information
    base_currency = Column(String(3), nullable=False)
    exchange_rate = Column(DECIMAL(15, 8), nullable=False)
    rate_date = Column(DateTime(timezone=True), nullable=False)
    
    # Rate source and metadata
    source = Column(String(100))  # "manual", "api", "bank"
    source_reference = Column(String(255))
    
    # Rate type
    rate_type = Column(String(20), default="mid")  # "buy", "sell", "mid"
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    currency = relationship("CurrencyConfiguration", back_populates="exchange_rate_history")
    
    __table_args__ = (
        Index('idx_exchange_rate_currency_date', 'currency_id', 'rate_date'),
        Index('idx_exchange_rate_date', 'rate_date'),
        Index('idx_exchange_rate_source', 'source'),
    )

class DocumentTemplate(Base):
    """Document templates for different languages"""
    __tablename__ = "document_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_id = Column(UUID(as_uuid=True), ForeignKey("language_configurations.id"), nullable=False)
    
    # Template information
    template_name = Column(String(255), nullable=False)
    template_type = Column(String(50), nullable=False)  # "invoice", "receipt", "report"
    document_category = Column(String(100))
    
    # Template content
    template_content = Column(Text, nullable=False)
    template_variables = Column(JSONB)  # Available variables for the template
    
    # Formatting settings
    page_format = Column(String(20), default="A4")  # "A4", "Letter", etc.
    orientation = Column(String(10), default="portrait")  # "portrait", "landscape"
    margins = Column(JSONB)  # Page margins
    
    # Styling
    font_family = Column(String(100))
    font_size = Column(Integer, default=12)
    line_height = Column(DECIMAL(3, 2), default=1.5)
    
    # Language-specific formatting
    text_alignment = Column(String(10))  # "left", "right", "center", "justify"
    number_format = Column(JSONB)  # Number formatting for this template
    date_format = Column(String(50))  # Date format pattern
    
    # Template status
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    version = Column(String(20), default="1.0")
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    language = relationship("LanguageConfiguration", back_populates="document_templates")
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_document_templates_lang_type', 'language_id', 'template_type'),
        Index('idx_document_templates_name', 'template_name'),
        Index('idx_document_templates_active', 'is_active'),
    )

class LocalizationSettings(Base):
    """System-wide localization settings"""
    __tablename__ = "localization_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Default settings
    default_language = Column(String(10), nullable=False, default="en")
    default_currency = Column(String(3), nullable=False, default="USD")
    default_timezone = Column(String(50), default="UTC")
    
    # Regional settings
    default_country = Column(String(2))  # ISO country code
    default_region = Column(String(50))
    
    # Formatting preferences
    date_format_preference = Column(String(50), default="YYYY-MM-DD")
    time_format_preference = Column(String(20), default="24h")
    number_format_preference = Column(String(50), default="1,234.56")
    
    # Multi-language settings
    enable_auto_translation = Column(Boolean, default=False)
    auto_translation_service = Column(String(100))  # "google", "azure", "aws"
    fallback_language = Column(String(10), default="en")
    
    # RTL support settings
    enable_rtl_support = Column(Boolean, default=True)
    rtl_languages = Column(JSONB, default=["ar", "fa", "he", "ur"])
    
    # Currency settings
    enable_multi_currency = Column(Boolean, default=True)
    auto_update_exchange_rates = Column(Boolean, default=False)
    exchange_rate_api = Column(String(100))
    
    # Content localization
    localize_images = Column(Boolean, default=False)
    localize_documents = Column(Boolean, default=True)
    localize_reports = Column(Boolean, default=True)
    
    # Metadata
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    updater = relationship("User")

class TranslationMemory(Base):
    """Translation memory for consistency and reuse"""
    __tablename__ = "translation_memory"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_language = Column(String(10), nullable=False)
    target_language = Column(String(10), nullable=False)
    
    # Translation pair
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=False)
    
    # Context and metadata
    context = Column(String(255))
    domain = Column(String(100))  # e.g., "business", "technical", "legal"
    
    # Quality and usage
    quality_score = Column(DECIMAL(3, 2), default=0)  # 0-1 quality score
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True))
    
    # Source information
    source_type = Column(String(50))  # "manual", "auto", "imported"
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_translation_memory_languages', 'source_language', 'target_language'),
        Index('idx_translation_memory_source_text', 'source_text'),
        Index('idx_translation_memory_domain', 'domain'),
        Index('idx_translation_memory_quality', 'quality_score'),
    )

class MultilingualData(Base):
    """Multilingual data storage for business entities"""
    __tablename__ = "multilingual_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_id = Column(UUID(as_uuid=True), ForeignKey("language_configurations.id"), nullable=False)
    
    # Entity reference
    entity_type = Column(String(50), nullable=False)  # "product", "category", "customer"
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Field and content
    field_name = Column(String(100), nullable=False)
    field_content = Column(Text, nullable=False)
    
    # Content metadata
    is_auto_translated = Column(Boolean, default=False)
    translation_confidence = Column(DECIMAL(3, 2))  # Confidence score for auto-translations
    
    # Status
    is_active = Column(Boolean, default=True)
    needs_review = Column(Boolean, default=False)
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    language = relationship("LanguageConfiguration")
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_multilingual_data_entity', 'entity_type', 'entity_id'),
        Index('idx_multilingual_data_lang_entity', 'language_id', 'entity_type', 'entity_id'),
        Index('idx_multilingual_data_field', 'field_name'),
        Index('idx_multilingual_data_auto_translated', 'is_auto_translated'),
    )

class SearchIndex(Base):
    """Multilingual search index for fast text search"""
    __tablename__ = "search_index"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_id = Column(UUID(as_uuid=True), ForeignKey("language_configurations.id"), nullable=False)
    
    # Entity reference
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Search content
    searchable_text = Column(Text, nullable=False)
    normalized_text = Column(Text)  # Normalized for search
    keywords = Column(JSONB)  # Extracted keywords
    
    # Search metadata
    boost_factor = Column(DECIMAL(3, 2), default=1.0)  # Search ranking boost
    last_indexed = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    language = relationship("LanguageConfiguration")
    
    __table_args__ = (
        Index('idx_search_index_entity', 'entity_type', 'entity_id'),
        Index('idx_search_index_lang', 'language_id'),
        Index('idx_search_index_text', 'searchable_text'),  # Full-text search index
    )