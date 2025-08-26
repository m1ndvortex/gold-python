"""
Enhanced Multi-Language and Localization Router

This router provides comprehensive localization API endpoints including:
- Language configuration management
- Translation management with bulk operations
- Currency and exchange rate management
- Business terminology customization
- Document template localization
- Multilingual data handling
- Search capabilities
- Number, date, and currency formatting
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime

from database import get_db
from services.localization_service import LocalizationService
from schemas_localization_simple import (
    # Language Configuration
    LanguageConfigurationCreate, LanguageConfigurationUpdate, LanguageConfigurationResponse,
    
    # Translation
    TranslationCreate, TranslationUpdate, TranslationResponse, 
    TranslationBulkCreate,
    
    # Business Terminology
    BusinessTerminologyCreate, BusinessTerminologyUpdate,
    
    # Currency
    CurrencyConfigurationCreate, CurrencyConfigurationUpdate, CurrencyConfigurationResponse,
    ExchangeRateHistoryCreate,
    
    # Document Templates
    DocumentTemplateCreate, DocumentTemplateUpdate,
    
    # Localization Settings
    LocalizationSettingsUpdate,
    
    # Multilingual Data
    MultilingualDataCreate, MultilingualDataUpdate,
    
    # Search and Formatting
    SearchRequest, NumberFormatRequest, DateFormatRequest, FormatResponse,
    
    # Translation Memory
    TranslationMemoryCreate,
    
    # Bulk Operations
    BulkTranslationRequest, BulkTranslationResponse
)
from auth import get_current_user
from models_universal import User

router = APIRouter(prefix="/api/localization", tags=["localization"])

# Language Configuration Endpoints
@router.post("/languages", response_model=LanguageConfigurationResponse)
async def create_language_configuration(
    language_data: LanguageConfigurationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new language configuration"""
    service = LocalizationService(db)
    return await service.create_language_configuration(language_data, current_user.id)

@router.get("/languages", response_model=List[LanguageConfigurationResponse])
async def get_language_configurations(
    active_only: bool = Query(True, description="Filter active languages only"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """Get all language configurations"""
    service = LocalizationService(db)
    return await service.get_language_configurations(active_only, skip, limit)

@router.get("/languages/{language_id}", response_model=LanguageConfigurationResponse)
async def get_language_configuration(
    language_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get a specific language configuration"""
    service = LocalizationService(db)
    language = await service.get_language_configuration(language_id)
    if not language:
        raise HTTPException(status_code=404, detail="Language configuration not found")
    return language

@router.get("/languages/code/{language_code}", response_model=LanguageConfigurationResponse)
async def get_language_by_code(
    language_code: str,
    db: Session = Depends(get_db)
):
    """Get language configuration by code"""
    service = LocalizationService(db)
    language = await service.get_language_by_code(language_code)
    if not language:
        raise HTTPException(status_code=404, detail="Language configuration not found")
    return language

@router.put("/languages/{language_id}", response_model=LanguageConfigurationResponse)
async def update_language_configuration(
    language_id: uuid.UUID,
    language_data: LanguageConfigurationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a language configuration"""
    service = LocalizationService(db)
    language = await service.update_language_configuration(language_id, language_data, current_user.id)
    if not language:
        raise HTTPException(status_code=404, detail="Language configuration not found")
    return language

@router.delete("/languages/{language_id}")
async def delete_language_configuration(
    language_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a language configuration"""
    service = LocalizationService(db)
    success = await service.delete_language_configuration(language_id)
    if not success:
        raise HTTPException(status_code=404, detail="Language configuration not found")
    return {"message": "Language configuration deleted successfully"}

# Translation Endpoints
@router.post("/translations", response_model=TranslationResponse)
async def create_translation(
    translation_data: TranslationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new translation"""
    service = LocalizationService(db)
    return await service.create_translation(translation_data, current_user.id)

@router.get("/translations", response_model=List[TranslationResponse])
async def get_translations(
    language_id: Optional[uuid.UUID] = Query(None, description="Filter by language ID"),
    context: Optional[str] = Query(None, description="Filter by context"),
    namespace: Optional[str] = Query(None, description="Filter by namespace"),
    approved_only: bool = Query(False, description="Filter approved translations only"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """Get translations with filters"""
    service = LocalizationService(db)
    return await service.get_translations(language_id, context, namespace, approved_only, skip, limit)

@router.get("/translations/{translation_id}", response_model=TranslationResponse)
async def get_translation(
    translation_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get a specific translation"""
    service = LocalizationService(db)
    translation = await service.get_translation(translation_id)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    return translation

@router.get("/translations/key/{language_id}/{translation_key}", response_model=TranslationResponse)
async def get_translation_by_key(
    language_id: uuid.UUID,
    translation_key: str,
    context: Optional[str] = Query(None, description="Translation context"),
    db: Session = Depends(get_db)
):
    """Get translation by key and language"""
    service = LocalizationService(db)
    translation = await service.get_translation_by_key(language_id, translation_key, context)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    return translation

@router.put("/translations/{translation_id}", response_model=TranslationResponse)
async def update_translation(
    translation_id: uuid.UUID,
    translation_data: TranslationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a translation"""
    service = LocalizationService(db)
    translation = await service.update_translation(translation_id, translation_data, current_user.id)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    return translation

@router.post("/translations/bulk", response_model=Dict[str, Any])
async def bulk_create_translations(
    bulk_data: TranslationBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create multiple translations in bulk"""
    service = LocalizationService(db)
    return await service.bulk_create_translations(bulk_data, current_user.id)

# Business Terminology Endpoints
@router.post("/terminology")
async def create_business_terminology(
    terminology_data: BusinessTerminologyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create business-specific terminology"""
    service = LocalizationService(db)
    return await service.create_business_terminology(terminology_data, current_user.id)

@router.get("/terminology")
async def get_business_terminology(
    language_id: Optional[uuid.UUID] = Query(None, description="Filter by language ID"),
    business_config_id: Optional[uuid.UUID] = Query(None, description="Filter by business config ID"),
    term_category: Optional[str] = Query(None, description="Filter by term category"),
    active_only: bool = Query(True, description="Filter active terminology only"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """Get business terminology with filters"""
    service = LocalizationService(db)
    return await service.get_business_terminology(
        language_id, business_config_id, term_category, active_only, skip, limit
    )

# Currency Configuration Endpoints
@router.post("/currencies", response_model=CurrencyConfigurationResponse)
async def create_currency_configuration(
    currency_data: CurrencyConfigurationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new currency configuration"""
    service = LocalizationService(db)
    return await service.create_currency_configuration(currency_data, current_user.id)

@router.get("/currencies", response_model=List[CurrencyConfigurationResponse])
async def get_currency_configurations(
    active_only: bool = Query(True, description="Filter active currencies only"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """Get all currency configurations"""
    service = LocalizationService(db)
    return await service.get_currency_configurations(active_only, skip, limit)

@router.post("/currencies/update-rates", response_model=Dict[str, Any])
async def update_exchange_rates(
    background_tasks: BackgroundTasks,
    currency_code: Optional[str] = Query(None, description="Specific currency to update"),
    force_update: bool = Query(False, description="Force update regardless of last update time"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update exchange rates from external API"""
    service = LocalizationService(db)
    
    # Run in background for better performance
    background_tasks.add_task(
        service.update_exchange_rates,
        currency_code,
        force_update
    )
    
    return {"message": "Exchange rate update started in background"}

# Document Template Endpoints
@router.post("/templates")
async def create_document_template(
    template_data: DocumentTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new document template"""
    service = LocalizationService(db)
    return await service.create_document_template(template_data, current_user.id)

@router.get("/templates")
async def get_document_templates(
    language_id: Optional[uuid.UUID] = Query(None, description="Filter by language ID"),
    template_type: Optional[str] = Query(None, description="Filter by template type"),
    active_only: bool = Query(True, description="Filter active templates only"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """Get document templates with filters"""
    service = LocalizationService(db)
    return await service.get_document_templates(language_id, template_type, active_only, skip, limit)

# Multilingual Data Endpoints
@router.post("/multilingual-data")
async def create_multilingual_data(
    data: MultilingualDataCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create multilingual data entry"""
    service = LocalizationService(db)
    return await service.create_multilingual_data(data, current_user.id)

@router.get("/multilingual-data/{entity_type}/{entity_id}")
async def get_multilingual_data(
    entity_type: str,
    entity_id: uuid.UUID,
    language_id: Optional[uuid.UUID] = Query(None, description="Filter by language ID"),
    db: Session = Depends(get_db)
):
    """Get multilingual data for an entity"""
    service = LocalizationService(db)
    return await service.get_multilingual_data(entity_type, entity_id, language_id)

# Search Endpoints
@router.post("/search")
async def search_multilingual(
    search_request: SearchRequest,
    db: Session = Depends(get_db)
):
    """Search across multilingual content"""
    service = LocalizationService(db)
    return await service.search_multilingual(search_request)

# Formatting Endpoints
@router.post("/format/number", response_model=FormatResponse)
async def format_number(
    format_request: NumberFormatRequest,
    db: Session = Depends(get_db)
):
    """Format number according to locale"""
    service = LocalizationService(db)
    return await service.format_number(format_request)

@router.post("/format/date", response_model=FormatResponse)
async def format_date(
    format_request: DateFormatRequest,
    db: Session = Depends(get_db)
):
    """Format date according to locale"""
    service = LocalizationService(db)
    return await service.format_date(format_request)

# Translation Memory Endpoints
@router.post("/translation-memory")
async def create_translation_memory(
    memory_data: TranslationMemoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create translation memory entry"""
    service = LocalizationService(db)
    return await service.create_translation_memory(memory_data, current_user.id)

@router.post("/translation-memory/search")
async def search_translation_memory(
    search_request: SearchRequest,
    db: Session = Depends(get_db)
):
    """Search translation memory for similar translations"""
    service = LocalizationService(db)
    # Implementation would search for similar translations
    # For now, return empty list as placeholder
    return []

# Bulk Translation Endpoints
@router.post("/translate/bulk", response_model=BulkTranslationResponse)
async def bulk_translate(
    translation_request: BulkTranslationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Perform bulk translation using external service"""
    # This would integrate with translation services like Google Translate, Azure Translator, etc.
    # For now, return a placeholder response
    return BulkTranslationResponse(
        translations=[{"source": text, "target": f"[Translated] {text}"} for text in translation_request.texts],
        source_language=translation_request.source_language,
        target_language=translation_request.target_language,
        total_count=len(translation_request.texts),
        success_count=len(translation_request.texts),
        error_count=0,
        errors=[]
    )

# Export/Import Endpoints
@router.post("/export")
async def export_translations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export translations in various formats"""
    # Implementation would export translations to JSON, CSV, PO, XLIFF formats
    # For now, return a placeholder response
    return {"message": "Export functionality not yet implemented"}

@router.post("/import")
async def import_translations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import translations from various formats"""
    # Implementation would import translations from JSON, CSV, PO, XLIFF formats
    # For now, return a placeholder response
    return {"message": "Import functionality not yet implemented"}

# Utility Endpoints
@router.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported language codes"""
    return [
        {"code": "en", "name": "English"},
        {"code": "fa", "name": "Persian"},
        {"code": "ar", "name": "Arabic"},
        {"code": "es", "name": "Spanish"},
        {"code": "fr", "name": "French"},
        {"code": "de", "name": "German"},
        {"code": "it", "name": "Italian"},
        {"code": "pt", "name": "Portuguese"},
        {"code": "ru", "name": "Russian"},
        {"code": "zh", "name": "Chinese"},
        {"code": "ja", "name": "Japanese"},
        {"code": "ko", "name": "Korean"},
        {"code": "hi", "name": "Hindi"},
        {"code": "ur", "name": "Urdu"},
        {"code": "tr", "name": "Turkish"}
    ]

@router.get("/supported-currencies")
async def get_supported_currencies():
    """Get list of supported currency codes"""
    return [
        {"code": "USD", "name": "US Dollar"},
        {"code": "EUR", "name": "Euro"},
        {"code": "GBP", "name": "British Pound"},
        {"code": "JPY", "name": "Japanese Yen"},
        {"code": "CNY", "name": "Chinese Yuan"},
        {"code": "INR", "name": "Indian Rupee"},
        {"code": "AED", "name": "UAE Dirham"},
        {"code": "SAR", "name": "Saudi Riyal"},
        {"code": "IRR", "name": "Iranian Rial"},
        {"code": "TRY", "name": "Turkish Lira"},
        {"code": "PKR", "name": "Pakistani Rupee"},
        {"code": "AFN", "name": "Afghan Afghani"},
        {"code": "IQD", "name": "Iraqi Dinar"}
    ]

@router.get("/rtl-languages")
async def get_rtl_languages():
    """Get list of RTL (Right-to-Left) languages"""
    return {
        "rtl_languages": ["ar", "fa", "he", "ur", "yi", "ji"],
        "description": "Languages that use right-to-left text direction"
    }

@router.get("/health")
async def health_check():
    """Health check endpoint for localization service"""
    return {
        "status": "healthy",
        "service": "localization",
        "timestamp": datetime.utcnow().isoformat(),
        "features": [
            "language_configuration",
            "translation_management",
            "currency_management",
            "business_terminology",
            "document_templates",
            "multilingual_data",
            "search",
            "formatting",
            "translation_memory"
        ]
    }