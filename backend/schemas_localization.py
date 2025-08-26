"""
Enhanced Multi-Language and Localization Schemas

Pydantic schemas for localization API requests and responses.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from decimal import Decimal
from enum import Enum
import uuid

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
    LTR = "ltr"
    RTL = "rtl"

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

# Base schemas
class LanguageConfigurationBase(BaseModel):
    """Base schema for language configuration"""
    language_code: str = Field(..., min_length=2, max_length=10)
    language_name: str = Field(..., min_length=1, max_length=100)
    native_name: str = Field(..., min_length=1, max_length=100)
    text_direction: TextDirection = TextDirection.LTR
    is_rtl: bool = False
    locale_code: Optional[str] = Field(None, max_length=20)
    country_code: Optional[str] = Field(None, min_length=2, max_length=2)
    number_format: Optional[Dict[str, Any]] = None
    date_format: Optional[Dict[str, Any]] = None
    currency_format: Optional[Dict[str, Any]] = None
    is_active: bool = True
    is_default: bool = False
    completion_percentage: Optional[Decimal] = Field(None, ge=0, le=100)

    @field_validator('language_code')
    @classmethod
    def validate_language_code(cls, v):
        if not v.islower():
            raise ValueError('Language code must be lowercase')
        return v

    @field_validator('country_code')
    @classmethod
    def validate_country_code(cls, v):
        if v and not v.isupper():
            raise ValueError('Country code must be uppercase')
        return v

class LanguageConfigurationCreate(LanguageConfigurationBase):
    """Schema for creating language configuration"""
    pass

class LanguageConfigurationUpdate(BaseModel):
    """Schema for updating language configuration"""
    language_name: Optional[str] = Field(None, min_length=1, max_length=100)
    native_name: Optional[str] = Field(None, min_length=1, max_length=100)
    text_direction: Optional[TextDirection] = None
    is_rtl: Optional[bool] = None
    locale_code: Optional[str] = Field(None, max_length=20)
    country_code: Optional[str] = Field(None, min_length=2, max_length=2)
    number_format: Optional[Dict[str, Any]] = None
    date_format: Optional[Dict[str, Any]] = None
    currency_format: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    completion_percentage: Optional[Decimal] = Field(None, ge=0, le=100)

class LanguageConfigurationResponse(LanguageConfigurationBase):
    """Schema for language configuration response"""
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Translation schemas
class TranslationBase(BaseModel):
    """Base schema for translations"""
    translation_key: str = Field(..., min_length=1, max_length=255)
    context: Optional[str] = Field(None, max_length=100)
    namespace: Optional[str] = Field(None, max_length=50)
    original_text: str = Field(..., min_length=1)
    translated_text: str = Field(..., min_length=1)
    is_approved: bool = False
    is_fuzzy: bool = False
    translator_notes: Optional[str] = None
    plural_forms: Optional[Dict[str, str]] = None
    version: int = 1

class TranslationCreate(TranslationBase):
    """Schema for creating translations"""
    language_id: uuid.UUID

class TranslationUpdate(BaseModel):
    """Schema for updating translations"""
    translated_text: Optional[str] = Field(None, min_length=1)
    is_approved: Optional[bool] = None
    is_fuzzy: Optional[bool] = None
    translator_notes: Optional[str] = None
    plural_forms: Optional[Dict[str, str]] = None

class TranslationResponse(TranslationBase):
    """Schema for translation response"""
    id: uuid.UUID
    language_id: uuid.UUID
    last_modified_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TranslationBulkCreate(BaseModel):
    """Schema for bulk translation creation"""
    language_id: uuid.UUID
    translations: List[TranslationBase]

class TranslationBulkUpdate(BaseModel):
    """Schema for bulk translation updates"""
    translations: List[Dict[str, Any]]  # List of {id, updates}

# Business terminology schemas
class BusinessTerminologyBase(BaseModel):
    """Base schema for business terminology"""
    standard_term: str = Field(..., min_length=1, max_length=100)
    business_term: str = Field(..., min_length=1, max_length=100)
    term_category: Optional[str] = Field(None, max_length=50)
    usage_context: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    business_type: Optional[str] = Field(None, max_length=50)
    is_custom: bool = False
    is_active: bool = True
    priority: int = Field(0, ge=0)

class BusinessTerminologyCreate(BusinessTerminologyBase):
    """Schema for creating business terminology"""
    language_id: uuid.UUID
    business_config_id: Optional[uuid.UUID] = None

class BusinessTerminologyUpdate(BaseModel):
    """Schema for updating business terminology"""
    business_term: Optional[str] = Field(None, min_length=1, max_length=100)
    term_category: Optional[str] = Field(None, max_length=50)
    usage_context: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    business_type: Optional[str] = Field(None, max_length=50)
    is_custom: Optional[bool] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0)

class BusinessTerminologyResponse(BusinessTerminologyBase):
    """Schema for business terminology response"""
    id: uuid.UUID
    language_id: uuid.UUID
    business_config_id: Optional[uuid.UUID] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Currency schemas
class CurrencyConfigurationBase(BaseModel):
    """Base schema for currency configuration"""
    currency_code: CurrencyCode
    currency_name: str = Field(..., min_length=1, max_length=100)
    currency_symbol: str = Field(..., min_length=1, max_length=10)
    decimal_places: int = Field(2, ge=0, le=8)
    is_crypto: bool = False
    symbol_position: str = Field("before", pattern="^(before|after)$")
    thousands_separator: str = Field(",", min_length=1, max_length=1)
    decimal_separator: str = Field(".", min_length=1, max_length=1)
    base_currency: str = Field("USD", min_length=3, max_length=3)
    exchange_rate: Decimal = Field(Decimal("1.0"), gt=0)
    auto_update_enabled: bool = False
    rate_source: Optional[str] = Field(None, max_length=100)
    update_frequency_hours: int = Field(24, ge=1, le=8760)  # Max 1 year
    is_active: bool = True
    is_default: bool = False

    @field_validator('currency_code')
    @classmethod
    def validate_currency_code(cls, v):
        if not v.isupper():
            raise ValueError('Currency code must be uppercase')
        return v

class CurrencyConfigurationCreate(CurrencyConfigurationBase):
    """Schema for creating currency configuration"""
    pass

class CurrencyConfigurationUpdate(BaseModel):
    """Schema for updating currency configuration"""
    currency_name: Optional[str] = Field(None, min_length=1, max_length=100)
    currency_symbol: Optional[str] = Field(None, min_length=1, max_length=10)
    decimal_places: Optional[int] = Field(None, ge=0, le=8)
    is_crypto: Optional[bool] = None
    symbol_position: Optional[str] = Field(None, pattern="^(before|after)$")
    thousands_separator: Optional[str] = Field(None, min_length=1, max_length=1)
    decimal_separator: Optional[str] = Field(None, min_length=1, max_length=1)
    base_currency: Optional[str] = Field(None, min_length=3, max_length=3)
    exchange_rate: Optional[Decimal] = Field(None, gt=0)
    auto_update_enabled: Optional[bool] = None
    rate_source: Optional[str] = Field(None, max_length=100)
    update_frequency_hours: Optional[int] = Field(None, ge=1, le=8760)
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

class CurrencyConfigurationResponse(CurrencyConfigurationBase):
    """Schema for currency configuration response"""
    id: uuid.UUID
    last_rate_update: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Exchange rate schemas
class ExchangeRateHistoryBase(BaseModel):
    """Base schema for exchange rate history"""
    base_currency: str = Field(..., min_length=3, max_length=3)
    exchange_rate: Decimal = Field(..., gt=0)
    rate_date: datetime
    source: Optional[str] = Field(None, max_length=100)
    source_reference: Optional[str] = Field(None, max_length=255)
    rate_type: str = Field("mid", pattern="^(buy|sell|mid)$")

class ExchangeRateHistoryCreate(ExchangeRateHistoryBase):
    """Schema for creating exchange rate history"""
    currency_id: uuid.UUID

class ExchangeRateHistoryResponse(ExchangeRateHistoryBase):
    """Schema for exchange rate history response"""
    id: uuid.UUID
    currency_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Document template schemas
class DocumentTemplateBase(BaseModel):
    """Base schema for document templates"""
    template_name: str = Field(..., min_length=1, max_length=255)
    template_type: str = Field(..., min_length=1, max_length=50)
    document_category: Optional[str] = Field(None, max_length=100)
    template_content: str = Field(..., min_length=1)
    template_variables: Optional[Dict[str, Any]] = None
    page_format: str = Field("A4", max_length=20)
    orientation: str = Field("portrait", pattern="^(portrait|landscape)$")
    margins: Optional[Dict[str, Any]] = None
    font_family: Optional[str] = Field(None, max_length=100)
    font_size: int = Field(12, ge=6, le=72)
    line_height: Decimal = Field(Decimal("1.5"), gt=0, le=5)
    text_alignment: Optional[str] = Field(None, pattern="^(left|right|center|justify)$")
    number_format: Optional[Dict[str, Any]] = None
    date_format: Optional[str] = Field(None, max_length=50)
    is_active: bool = True
    is_default: bool = False
    version: str = Field("1.0", max_length=20)

class DocumentTemplateCreate(DocumentTemplateBase):
    """Schema for creating document templates"""
    language_id: uuid.UUID

class DocumentTemplateUpdate(BaseModel):
    """Schema for updating document templates"""
    template_name: Optional[str] = Field(None, min_length=1, max_length=255)
    template_type: Optional[str] = Field(None, min_length=1, max_length=50)
    document_category: Optional[str] = Field(None, max_length=100)
    template_content: Optional[str] = Field(None, min_length=1)
    template_variables: Optional[Dict[str, Any]] = None
    page_format: Optional[str] = Field(None, max_length=20)
    orientation: Optional[str] = Field(None, pattern="^(portrait|landscape)$")
    margins: Optional[Dict[str, Any]] = None
    font_family: Optional[str] = Field(None, max_length=100)
    font_size: Optional[int] = Field(None, ge=6, le=72)
    line_height: Optional[Decimal] = Field(None, gt=0, le=5)
    text_alignment: Optional[str] = Field(None, pattern="^(left|right|center|justify)$")
    number_format: Optional[Dict[str, Any]] = None
    date_format: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    version: Optional[str] = Field(None, max_length=20)

class DocumentTemplateResponse(DocumentTemplateBase):
    """Schema for document template response"""
    id: uuid.UUID
    language_id: uuid.UUID
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Localization settings schemas
class LocalizationSettingsBase(BaseModel):
    """Base schema for localization settings"""
    default_language: str = Field("en", min_length=2, max_length=10)
    default_currency: str = Field("USD", min_length=3, max_length=3)
    default_timezone: str = Field("UTC", max_length=50)
    default_country: Optional[str] = Field(None, min_length=2, max_length=2)
    default_region: Optional[str] = Field(None, max_length=50)
    date_format_preference: str = Field("YYYY-MM-DD", max_length=50)
    time_format_preference: str = Field("24h", pattern="^(12h|24h)$")
    number_format_preference: str = Field("1,234.56", max_length=50)
    enable_auto_translation: bool = False
    auto_translation_service: Optional[str] = Field(None, max_length=100)
    fallback_language: str = Field("en", min_length=2, max_length=10)
    enable_rtl_support: bool = True
    rtl_languages: List[str] = Field(default=["ar", "fa", "he", "ur"])
    enable_multi_currency: bool = True
    auto_update_exchange_rates: bool = False
    exchange_rate_api: Optional[str] = Field(None, max_length=100)
    localize_images: bool = False
    localize_documents: bool = True
    localize_reports: bool = True

class LocalizationSettingsUpdate(LocalizationSettingsBase):
    """Schema for updating localization settings"""
    pass

class LocalizationSettingsResponse(LocalizationSettingsBase):
    """Schema for localization settings response"""
    id: uuid.UUID
    updated_by: Optional[uuid.UUID] = None
    updated_at: datetime

    class Config:
        from_attributes = True

# Multilingual data schemas
class MultilingualDataBase(BaseModel):
    """Base schema for multilingual data"""
    entity_type: str = Field(..., min_length=1, max_length=50)
    entity_id: uuid.UUID
    field_name: str = Field(..., min_length=1, max_length=100)
    field_content: str = Field(..., min_length=1)
    is_auto_translated: bool = False
    translation_confidence: Optional[Decimal] = Field(None, ge=0, le=1)
    is_active: bool = True
    needs_review: bool = False

class MultilingualDataCreate(MultilingualDataBase):
    """Schema for creating multilingual data"""
    language_id: uuid.UUID

class MultilingualDataUpdate(BaseModel):
    """Schema for updating multilingual data"""
    field_content: Optional[str] = Field(None, min_length=1)
    is_auto_translated: Optional[bool] = None
    translation_confidence: Optional[Decimal] = Field(None, ge=0, le=1)
    is_active: Optional[bool] = None
    needs_review: Optional[bool] = None

class MultilingualDataResponse(MultilingualDataBase):
    """Schema for multilingual data response"""
    id: uuid.UUID
    language_id: uuid.UUID
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Search and utility schemas
class SearchRequest(BaseModel):
    """Schema for multilingual search requests"""
    query: str = Field(..., min_length=1, max_length=500)
    language_id: Optional[uuid.UUID] = None
    entity_types: Optional[List[str]] = None
    limit: int = Field(50, ge=1, le=1000)
    offset: int = Field(0, ge=0)

class SearchResult(BaseModel):
    """Schema for search results"""
    entity_type: str
    entity_id: uuid.UUID
    language_id: uuid.UUID
    content: str
    score: float
    highlights: List[str] = []

class SearchResponse(BaseModel):
    """Schema for search response"""
    results: List[SearchResult]
    total_count: int
    query: str
    language_id: Optional[uuid.UUID] = None

# Formatting schemas
class NumberFormatRequest(BaseModel):
    """Schema for number formatting requests"""
    number: Union[int, float, Decimal]
    language_code: Optional[str] = None
    currency_code: Optional[str] = None
    format_type: str = Field("decimal", pattern="^(decimal|currency|percentage)$")

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

# Translation memory schemas
class TranslationMemoryBase(BaseModel):
    """Base schema for translation memory"""
    source_language: str = Field(..., min_length=2, max_length=10)
    target_language: str = Field(..., min_length=2, max_length=10)
    source_text: str = Field(..., min_length=1)
    target_text: str = Field(..., min_length=1)
    context: Optional[str] = Field(None, max_length=255)
    domain: Optional[str] = Field(None, max_length=100)
    quality_score: Optional[Decimal] = Field(None, ge=0, le=1)
    source_type: str = Field("manual", pattern="^(manual|auto|imported)$")

class TranslationMemoryCreate(TranslationMemoryBase):
    """Schema for creating translation memory entries"""
    pass

class TranslationMemoryResponse(TranslationMemoryBase):
    """Schema for translation memory response"""
    id: uuid.UUID
    usage_count: int
    last_used: Optional[datetime] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TranslationMemorySearch(BaseModel):
    """Schema for translation memory search"""
    source_text: str = Field(..., min_length=1)
    source_language: str = Field(..., min_length=2, max_length=10)
    target_language: str = Field(..., min_length=2, max_length=10)
    context: Optional[str] = None
    domain: Optional[str] = None
    min_quality_score: Optional[Decimal] = Field(None, ge=0, le=1)
    limit: int = Field(10, ge=1, le=100)

# Bulk operations schemas
class BulkTranslationRequest(BaseModel):
    """Schema for bulk translation requests"""
    source_language: str = Field(..., min_length=2, max_length=10)
    target_language: str = Field(..., min_length=2, max_length=10)
    texts: List[str] = Field(..., min_items=1, max_items=1000)
    context: Optional[str] = None
    domain: Optional[str] = None

class BulkTranslationResponse(BaseModel):
    """Schema for bulk translation responses"""
    translations: List[Dict[str, str]]  # [{"source": "text", "target": "translation"}]
    source_language: str
    target_language: str
    total_count: int
    success_count: int
    error_count: int
    errors: List[str] = []

# Export/Import schemas
class TranslationExportRequest(BaseModel):
    """Schema for translation export requests"""
    language_id: Optional[uuid.UUID] = None
    context: Optional[str] = None
    namespace: Optional[str] = None
    format: str = Field("json", pattern="^(json|csv|po|xliff)$")
    include_metadata: bool = True

class TranslationImportRequest(BaseModel):
    """Schema for translation import requests"""
    language_id: uuid.UUID
    format: str = Field("json", pattern="^(json|csv|po|xliff)$")
    data: str  # File content as string
    overwrite_existing: bool = False
    mark_as_approved: bool = False