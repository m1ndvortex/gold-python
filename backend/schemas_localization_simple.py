"""
Simple Localization Schemas for Testing
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from decimal import Decimal
from enum import Enum
import uuid

class TextDirection(str, Enum):
    """Text direction for languages"""
    LTR = "ltr"
    RTL = "rtl"

class CurrencyCode(str, Enum):
    """Supported currency codes"""
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    CNY = "CNY"
    INR = "INR"
    AED = "AED"
    SAR = "SAR"
    IRR = "IRR"
    TRY = "TRY"
    PKR = "PKR"
    AFN = "AFN"
    IQD = "IQD"

# Language Configuration Schemas
class LanguageConfigurationCreate(BaseModel):
    """Schema for creating language configuration"""
    language_code: str
    language_name: str
    native_name: str
    text_direction: TextDirection = TextDirection.LTR
    is_rtl: bool = False
    locale_code: Optional[str] = None
    country_code: Optional[str] = None
    number_format: Optional[Dict[str, Any]] = None
    date_format: Optional[Dict[str, Any]] = None
    currency_format: Optional[Dict[str, Any]] = None
    is_active: bool = True
    is_default: bool = False
    completion_percentage: Optional[Decimal] = None

class LanguageConfigurationUpdate(BaseModel):
    """Schema for updating language configuration"""
    language_name: Optional[str] = None
    native_name: Optional[str] = None
    text_direction: Optional[TextDirection] = None
    is_rtl: Optional[bool] = None
    locale_code: Optional[str] = None
    country_code: Optional[str] = None
    number_format: Optional[Dict[str, Any]] = None
    date_format: Optional[Dict[str, Any]] = None
    currency_format: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    completion_percentage: Optional[Decimal] = None

class LanguageConfigurationResponse(BaseModel):
    """Schema for language configuration response"""
    id: uuid.UUID
    language_code: str
    language_name: str
    native_name: str
    text_direction: str
    is_rtl: bool
    locale_code: Optional[str] = None
    country_code: Optional[str] = None
    is_active: bool
    is_default: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Translation Schemas
class TranslationCreate(BaseModel):
    """Schema for creating translations"""
    language_id: uuid.UUID
    translation_key: str
    context: Optional[str] = None
    namespace: Optional[str] = None
    original_text: str
    translated_text: str
    is_approved: bool = False
    is_fuzzy: bool = False
    translator_notes: Optional[str] = None
    plural_forms: Optional[Dict[str, str]] = None
    version: int = 1

class TranslationUpdate(BaseModel):
    """Schema for updating translations"""
    translated_text: Optional[str] = None
    is_approved: Optional[bool] = None
    is_fuzzy: Optional[bool] = None
    translator_notes: Optional[str] = None
    plural_forms: Optional[Dict[str, str]] = None

class TranslationBulkCreate(BaseModel):
    """Schema for bulk translation creation"""
    language_id: uuid.UUID
    translations: List[TranslationCreate]

class TranslationResponse(BaseModel):
    """Schema for translation response"""
    id: uuid.UUID
    language_id: uuid.UUID
    translation_key: str
    context: Optional[str] = None
    namespace: Optional[str] = None
    original_text: str
    translated_text: str
    is_approved: bool
    is_fuzzy: bool
    translator_notes: Optional[str] = None
    plural_forms: Optional[Dict[str, str]] = None
    version: int
    last_modified_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Currency Configuration Schemas
class CurrencyConfigurationCreate(BaseModel):
    """Schema for creating currency configuration"""
    currency_code: str
    currency_name: str
    currency_symbol: str
    decimal_places: int = 2
    is_crypto: bool = False
    symbol_position: str = "before"
    thousands_separator: str = ","
    decimal_separator: str = "."
    base_currency: str = "USD"
    exchange_rate: Decimal = Decimal("1.0")
    auto_update_enabled: bool = False
    rate_source: Optional[str] = None
    update_frequency_hours: int = 24
    is_active: bool = True
    is_default: bool = False

class CurrencyConfigurationUpdate(BaseModel):
    """Schema for updating currency configuration"""
    currency_name: Optional[str] = None
    currency_symbol: Optional[str] = None
    decimal_places: Optional[int] = None
    is_crypto: Optional[bool] = None
    symbol_position: Optional[str] = None
    thousands_separator: Optional[str] = None
    decimal_separator: Optional[str] = None
    base_currency: Optional[str] = None
    exchange_rate: Optional[Decimal] = None
    auto_update_enabled: Optional[bool] = None
    rate_source: Optional[str] = None
    update_frequency_hours: Optional[int] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

class ExchangeRateHistoryCreate(BaseModel):
    """Schema for creating exchange rate history"""
    currency_id: uuid.UUID
    base_currency: str
    exchange_rate: Decimal
    rate_date: datetime
    source: Optional[str] = None
    source_reference: Optional[str] = None
    rate_type: str = "mid"

class CurrencyConfigurationResponse(BaseModel):
    """Schema for currency configuration response"""
    id: uuid.UUID
    currency_code: str
    currency_name: str
    currency_symbol: str
    decimal_places: int
    is_crypto: bool
    symbol_position: str
    thousands_separator: str
    decimal_separator: str
    base_currency: str
    exchange_rate: Decimal
    auto_update_enabled: bool
    rate_source: Optional[str] = None
    update_frequency_hours: int
    is_active: bool
    is_default: bool
    last_rate_update: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Formatting Schemas
class NumberFormatRequest(BaseModel):
    """Schema for number formatting requests"""
    number: Union[int, float, Decimal]
    language_code: Optional[str] = None
    currency_code: Optional[str] = None
    format_type: str = "decimal"

class DateFormatRequest(BaseModel):
    """Schema for date formatting requests"""
    date: datetime
    language_code: Optional[str] = None
    format_pattern: Optional[str] = None

class FormatResponse(BaseModel):
    """Schema for formatting responses"""
    formatted_value: str
    language_code: str
    format_pattern: str

# Business Terminology Schemas
class BusinessTerminologyCreate(BaseModel):
    """Schema for creating business terminology"""
    language_id: uuid.UUID
    business_config_id: Optional[uuid.UUID] = None
    standard_term: str
    business_term: str
    term_category: Optional[str] = None
    usage_context: Optional[str] = None
    industry: Optional[str] = None
    business_type: Optional[str] = None
    is_custom: bool = False
    is_active: bool = True
    priority: int = 0

# Document Template Schemas
class BusinessTerminologyUpdate(BaseModel):
    """Schema for updating business terminology"""
    business_term: Optional[str] = None
    term_category: Optional[str] = None
    usage_context: Optional[str] = None
    industry: Optional[str] = None
    business_type: Optional[str] = None
    is_custom: Optional[bool] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None

class DocumentTemplateCreate(BaseModel):
    """Schema for creating document templates"""
    language_id: uuid.UUID
    template_name: str
    template_type: str
    document_category: Optional[str] = None
    template_content: str
    template_variables: Optional[Dict[str, Any]] = None
    page_format: str = "A4"
    orientation: str = "portrait"
    margins: Optional[Dict[str, Any]] = None
    font_family: Optional[str] = None
    font_size: int = 12
    line_height: Decimal = Decimal("1.5")
    text_alignment: Optional[str] = None
    number_format: Optional[Dict[str, Any]] = None
    date_format: Optional[str] = None
    is_active: bool = True
    is_default: bool = False
    version: str = "1.0"

# Multilingual Data Schemas
class DocumentTemplateUpdate(BaseModel):
    """Schema for updating document templates"""
    template_name: Optional[str] = None
    template_type: Optional[str] = None
    document_category: Optional[str] = None
    template_content: Optional[str] = None
    template_variables: Optional[Dict[str, Any]] = None
    page_format: Optional[str] = None
    orientation: Optional[str] = None
    margins: Optional[Dict[str, Any]] = None
    font_family: Optional[str] = None
    font_size: Optional[int] = None
    line_height: Optional[Decimal] = None
    text_alignment: Optional[str] = None
    number_format: Optional[Dict[str, Any]] = None
    date_format: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    version: Optional[str] = None

class LocalizationSettingsUpdate(BaseModel):
    """Schema for updating localization settings"""
    default_language: Optional[str] = None
    default_currency: Optional[str] = None
    default_timezone: Optional[str] = None
    enable_rtl_support: Optional[bool] = None
    enable_multi_currency: Optional[bool] = None

class MultilingualDataCreate(BaseModel):
    """Schema for creating multilingual data"""
    language_id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    field_name: str
    field_content: str
    is_auto_translated: bool = False
    translation_confidence: Optional[Decimal] = None
    is_active: bool = True
    needs_review: bool = False

# Search Schemas
class MultilingualDataUpdate(BaseModel):
    """Schema for updating multilingual data"""
    field_content: Optional[str] = None
    is_auto_translated: Optional[bool] = None
    translation_confidence: Optional[Decimal] = None
    is_active: Optional[bool] = None
    needs_review: Optional[bool] = None

class SearchRequest(BaseModel):
    """Schema for multilingual search requests"""
    query: str
    language_id: Optional[uuid.UUID] = None
    entity_types: Optional[List[str]] = None
    limit: int = 50
    offset: int = 0

# Translation Memory Schemas
class TranslationMemoryCreate(BaseModel):
    """Schema for creating translation memory entries"""
    source_language: str
    target_language: str
    source_text: str
    target_text: str
    context: Optional[str] = None
    domain: Optional[str] = None
    quality_score: Optional[Decimal] = None
    source_type: str = "manual"

# Bulk Operations Schemas
class BulkTranslationRequest(BaseModel):
    """Schema for bulk translation requests"""
    source_language: str
    target_language: str
    texts: List[str]
    context: Optional[str] = None
    domain: Optional[str] = None

class BulkTranslationResponse(BaseModel):
    """Schema for bulk translation responses"""
    translations: List[Dict[str, str]]
    source_language: str
    target_language: str
    total_count: int
    success_count: int
    error_count: int
    errors: List[str] = []