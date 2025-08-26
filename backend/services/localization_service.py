"""
Enhanced Multi-Language and Localization Service

This service provides comprehensive localization functionality including:
- Language configuration management
- Translation management with memory
- Currency and exchange rate management
- Business terminology customization
- Document template localization
- Multilingual data handling
- Search capabilities
- Number, date, and currency formatting
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text, desc
from typing import List, Dict, Any, Optional, Union, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
import json
import re
import uuid
import logging
try:
    from babel import Locale, dates, numbers
    from babel.core import UnknownLocaleError
    BABEL_AVAILABLE = True
except ImportError:
    BABEL_AVAILABLE = False
    # Fallback classes for when babel is not available
    class Locale:
        @staticmethod
        def parse(locale_code):
            return locale_code
    
    class dates:
        @staticmethod
        def format_date(date, locale=None):
            return date.strftime("%Y-%m-%d")
    
    class numbers:
        @staticmethod
        def format_decimal(number, locale=None):
            return f"{number:,.2f}"
        
        @staticmethod
        def format_currency(number, currency, locale=None):
            return f"{currency} {number:,.2f}"
        
        @staticmethod
        def format_percent(number, locale=None):
            return f"{number:.1%}"
    
    class UnknownLocaleError(Exception):
        pass
import requests
from fastapi import HTTPException

from models_localization import (
    LanguageConfiguration, Translation, BusinessTerminology,
    CurrencyConfiguration, ExchangeRateHistory, DocumentTemplate,
    LocalizationSettings, MultilingualData, SearchIndex, TranslationMemory
)
from schemas_localization_simple import (
    LanguageConfigurationCreate, LanguageConfigurationUpdate,
    TranslationCreate, TranslationUpdate, TranslationBulkCreate,
    BusinessTerminologyCreate, BusinessTerminologyUpdate,
    CurrencyConfigurationCreate, CurrencyConfigurationUpdate,
    ExchangeRateHistoryCreate, DocumentTemplateCreate, DocumentTemplateUpdate,
    LocalizationSettingsUpdate, MultilingualDataCreate, MultilingualDataUpdate,
    SearchRequest, NumberFormatRequest, DateFormatRequest,
    TranslationMemoryCreate, BulkTranslationRequest
)

logger = logging.getLogger(__name__)

class LocalizationService:
    """Service for managing localization and multi-language features"""
    
    def __init__(self, db: Session):
        self.db = db
        self._exchange_rate_apis = {
            "fixer": "https://api.fixer.io/latest",
            "exchangerate": "https://api.exchangerate-api.com/v4/latest",
            "currencylayer": "http://api.currencylayer.com/live"
        }
    
    # Language Configuration Management
    async def create_language_configuration(
        self, 
        language_data: LanguageConfigurationCreate,
        user_id: Optional[uuid.UUID] = None
    ) -> LanguageConfiguration:
        """Create a new language configuration"""
        try:
            # Check if language code already exists
            existing = self.db.query(LanguageConfiguration).filter(
                LanguageConfiguration.language_code == language_data.language_code
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Language configuration for '{language_data.language_code}' already exists"
                )
            
            # If this is set as default, unset other defaults
            if language_data.is_default:
                self.db.query(LanguageConfiguration).filter(
                    LanguageConfiguration.is_default == True
                ).update({"is_default": False})
            
            # Create language configuration
            db_language = LanguageConfiguration(**language_data.dict())
            self.db.add(db_language)
            self.db.commit()
            self.db.refresh(db_language)
            
            logger.info(f"Created language configuration: {language_data.language_code}")
            return db_language
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating language configuration: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_language_configurations(
        self,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[LanguageConfiguration]:
        """Get all language configurations"""
        query = self.db.query(LanguageConfiguration)
        
        if active_only:
            query = query.filter(LanguageConfiguration.is_active == True)
        
        return query.offset(skip).limit(limit).all()
    
    async def get_language_configuration(
        self, 
        language_id: uuid.UUID
    ) -> Optional[LanguageConfiguration]:
        """Get a specific language configuration"""
        return self.db.query(LanguageConfiguration).filter(
            LanguageConfiguration.id == language_id
        ).first()
    
    async def get_language_by_code(
        self, 
        language_code: str
    ) -> Optional[LanguageConfiguration]:
        """Get language configuration by code"""
        return self.db.query(LanguageConfiguration).filter(
            LanguageConfiguration.language_code == language_code
        ).first()
    
    async def update_language_configuration(
        self,
        language_id: uuid.UUID,
        language_data: LanguageConfigurationUpdate,
        user_id: Optional[uuid.UUID] = None
    ) -> Optional[LanguageConfiguration]:
        """Update a language configuration"""
        try:
            db_language = await self.get_language_configuration(language_id)
            if not db_language:
                return None
            
            # If setting as default, unset other defaults
            if language_data.is_default:
                self.db.query(LanguageConfiguration).filter(
                    LanguageConfiguration.is_default == True,
                    LanguageConfiguration.id != language_id
                ).update({"is_default": False})
            
            # Update fields
            update_data = language_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_language, field, value)
            
            self.db.commit()
            self.db.refresh(db_language)
            
            logger.info(f"Updated language configuration: {language_id}")
            return db_language
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating language configuration: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def delete_language_configuration(
        self, 
        language_id: uuid.UUID
    ) -> bool:
        """Delete a language configuration"""
        try:
            db_language = await self.get_language_configuration(language_id)
            if not db_language:
                return False
            
            # Don't allow deletion of default language
            if db_language.is_default:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot delete default language configuration"
                )
            
            self.db.delete(db_language)
            self.db.commit()
            
            logger.info(f"Deleted language configuration: {language_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting language configuration: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Translation Management
    async def create_translation(
        self,
        translation_data: TranslationCreate,
        user_id: Optional[uuid.UUID] = None
    ) -> Translation:
        """Create a new translation"""
        try:
            # Check if translation already exists
            existing = self.db.query(Translation).filter(
                and_(
                    Translation.language_id == translation_data.language_id,
                    Translation.translation_key == translation_data.translation_key,
                    Translation.context == translation_data.context
                )
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Translation already exists for this key and context"
                )
            
            # Create translation
            db_translation = Translation(**translation_data.dict())
            if user_id:
                db_translation.last_modified_by = user_id
            
            self.db.add(db_translation)
            self.db.commit()
            self.db.refresh(db_translation)
            
            # Update search index
            await self._update_search_index(db_translation)
            
            # Add to translation memory
            await self._add_to_translation_memory(db_translation, user_id)
            
            logger.info(f"Created translation: {translation_data.translation_key}")
            return db_translation
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating translation: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_translations(
        self,
        language_id: Optional[uuid.UUID] = None,
        context: Optional[str] = None,
        namespace: Optional[str] = None,
        approved_only: bool = False,
        skip: int = 0,
        limit: int = 100
    ) -> List[Translation]:
        """Get translations with filters"""
        query = self.db.query(Translation)
        
        if language_id:
            query = query.filter(Translation.language_id == language_id)
        if context:
            query = query.filter(Translation.context == context)
        if namespace:
            query = query.filter(Translation.namespace == namespace)
        if approved_only:
            query = query.filter(Translation.is_approved == True)
        
        return query.offset(skip).limit(limit).all()
    
    async def get_translation(
        self, 
        translation_id: uuid.UUID
    ) -> Optional[Translation]:
        """Get a specific translation"""
        return self.db.query(Translation).filter(
            Translation.id == translation_id
        ).first()
    
    async def get_translation_by_key(
        self,
        language_id: uuid.UUID,
        translation_key: str,
        context: Optional[str] = None
    ) -> Optional[Translation]:
        """Get translation by key and language"""
        query = self.db.query(Translation).filter(
            and_(
                Translation.language_id == language_id,
                Translation.translation_key == translation_key
            )
        )
        
        if context:
            query = query.filter(Translation.context == context)
        
        return query.first()
    
    async def update_translation(
        self,
        translation_id: uuid.UUID,
        translation_data: TranslationUpdate,
        user_id: Optional[uuid.UUID] = None
    ) -> Optional[Translation]:
        """Update a translation"""
        try:
            db_translation = await self.get_translation(translation_id)
            if not db_translation:
                return None
            
            # Update fields
            update_data = translation_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_translation, field, value)
            
            if user_id:
                db_translation.last_modified_by = user_id
            db_translation.version += 1
            
            self.db.commit()
            self.db.refresh(db_translation)
            
            # Update search index
            await self._update_search_index(db_translation)
            
            logger.info(f"Updated translation: {translation_id}")
            return db_translation
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating translation: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def bulk_create_translations(
        self,
        bulk_data: TranslationBulkCreate,
        user_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """Create multiple translations in bulk"""
        try:
            created_count = 0
            error_count = 0
            errors = []
            
            for translation_data in bulk_data.translations:
                try:
                    # Check if translation already exists
                    existing = self.db.query(Translation).filter(
                        and_(
                            Translation.language_id == bulk_data.language_id,
                            Translation.translation_key == translation_data.translation_key,
                            Translation.context == translation_data.context
                        )
                    ).first()
                    
                    if existing:
                        error_count += 1
                        errors.append(f"Translation already exists: {translation_data.translation_key}")
                        continue
                    
                    # Create translation
                    db_translation = Translation(
                        language_id=bulk_data.language_id,
                        **translation_data.dict()
                    )
                    if user_id:
                        db_translation.last_modified_by = user_id
                    
                    self.db.add(db_translation)
                    created_count += 1
                    
                except Exception as e:
                    error_count += 1
                    errors.append(f"Error creating {translation_data.translation_key}: {str(e)}")
            
            self.db.commit()
            
            logger.info(f"Bulk created {created_count} translations, {error_count} errors")
            return {
                "created_count": created_count,
                "error_count": error_count,
                "errors": errors
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error in bulk translation creation: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Business Terminology Management
    async def create_business_terminology(
        self,
        terminology_data: BusinessTerminologyCreate,
        user_id: Optional[uuid.UUID] = None
    ) -> BusinessTerminology:
        """Create business-specific terminology"""
        try:
            db_terminology = BusinessTerminology(**terminology_data.dict())
            if user_id:
                db_terminology.created_by = user_id
            
            self.db.add(db_terminology)
            self.db.commit()
            self.db.refresh(db_terminology)
            
            logger.info(f"Created business terminology: {terminology_data.standard_term}")
            return db_terminology
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating business terminology: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_business_terminology(
        self,
        language_id: Optional[uuid.UUID] = None,
        business_config_id: Optional[uuid.UUID] = None,
        term_category: Optional[str] = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[BusinessTerminology]:
        """Get business terminology with filters"""
        query = self.db.query(BusinessTerminology)
        
        if language_id:
            query = query.filter(BusinessTerminology.language_id == language_id)
        if business_config_id:
            query = query.filter(BusinessTerminology.business_config_id == business_config_id)
        if term_category:
            query = query.filter(BusinessTerminology.term_category == term_category)
        if active_only:
            query = query.filter(BusinessTerminology.is_active == True)
        
        return query.order_by(desc(BusinessTerminology.priority)).offset(skip).limit(limit).all()
    
    # Currency Management
    async def create_currency_configuration(
        self,
        currency_data: CurrencyConfigurationCreate,
        user_id: Optional[uuid.UUID] = None
    ) -> CurrencyConfiguration:
        """Create a new currency configuration"""
        try:
            # Check if currency already exists
            existing = self.db.query(CurrencyConfiguration).filter(
                CurrencyConfiguration.currency_code == currency_data.currency_code
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Currency configuration for '{currency_data.currency_code}' already exists"
                )
            
            # If this is set as default, unset other defaults
            if currency_data.is_default:
                self.db.query(CurrencyConfiguration).filter(
                    CurrencyConfiguration.is_default == True
                ).update({"is_default": False})
            
            # Create currency configuration
            db_currency = CurrencyConfiguration(**currency_data.dict())
            self.db.add(db_currency)
            self.db.commit()
            self.db.refresh(db_currency)
            
            logger.info(f"Created currency configuration: {currency_data.currency_code}")
            return db_currency
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating currency configuration: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_currency_configurations(
        self,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[CurrencyConfiguration]:
        """Get all currency configurations"""
        query = self.db.query(CurrencyConfiguration)
        
        if active_only:
            query = query.filter(CurrencyConfiguration.is_active == True)
        
        return query.offset(skip).limit(limit).all()
    
    async def update_exchange_rates(
        self,
        currency_code: Optional[str] = None,
        force_update: bool = False
    ) -> Dict[str, Any]:
        """Update exchange rates from external API"""
        try:
            # Get currencies that need updating
            query = self.db.query(CurrencyConfiguration).filter(
                CurrencyConfiguration.auto_update_enabled == True,
                CurrencyConfiguration.is_active == True
            )
            
            if currency_code:
                query = query.filter(CurrencyConfiguration.currency_code == currency_code)
            
            if not force_update:
                # Only update if last update was more than update_frequency_hours ago
                query = query.filter(
                    or_(
                        CurrencyConfiguration.last_rate_update.is_(None),
                        CurrencyConfiguration.last_rate_update < 
                        datetime.utcnow() - timedelta(hours=CurrencyConfiguration.update_frequency_hours)
                    )
                )
            
            currencies = query.all()
            
            updated_count = 0
            error_count = 0
            errors = []
            
            for currency in currencies:
                try:
                    # Get exchange rate from API
                    rate = await self._fetch_exchange_rate(
                        currency.currency_code,
                        currency.base_currency,
                        currency.rate_source
                    )
                    
                    if rate:
                        # Update currency
                        currency.exchange_rate = rate
                        currency.last_rate_update = datetime.utcnow()
                        
                        # Add to history
                        history_entry = ExchangeRateHistory(
                            currency_id=currency.id,
                            base_currency=currency.base_currency,
                            exchange_rate=rate,
                            rate_date=datetime.utcnow(),
                            source=currency.rate_source or "api",
                            rate_type="mid"
                        )
                        self.db.add(history_entry)
                        
                        updated_count += 1
                    else:
                        error_count += 1
                        errors.append(f"Failed to fetch rate for {currency.currency_code}")
                        
                except Exception as e:
                    error_count += 1
                    errors.append(f"Error updating {currency.currency_code}: {str(e)}")
            
            self.db.commit()
            
            logger.info(f"Updated {updated_count} exchange rates, {error_count} errors")
            return {
                "updated_count": updated_count,
                "error_count": error_count,
                "errors": errors
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating exchange rates: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Document Template Management
    async def create_document_template(
        self,
        template_data: DocumentTemplateCreate,
        user_id: Optional[uuid.UUID] = None
    ) -> DocumentTemplate:
        """Create a new document template"""
        try:
            db_template = DocumentTemplate(**template_data.dict())
            if user_id:
                db_template.created_by = user_id
            
            self.db.add(db_template)
            self.db.commit()
            self.db.refresh(db_template)
            
            logger.info(f"Created document template: {template_data.template_name}")
            return db_template
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating document template: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_document_templates(
        self,
        language_id: Optional[uuid.UUID] = None,
        template_type: Optional[str] = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[DocumentTemplate]:
        """Get document templates with filters"""
        query = self.db.query(DocumentTemplate)
        
        if language_id:
            query = query.filter(DocumentTemplate.language_id == language_id)
        if template_type:
            query = query.filter(DocumentTemplate.template_type == template_type)
        if active_only:
            query = query.filter(DocumentTemplate.is_active == True)
        
        return query.offset(skip).limit(limit).all()
    
    # Multilingual Data Management
    async def create_multilingual_data(
        self,
        data: MultilingualDataCreate,
        user_id: Optional[uuid.UUID] = None
    ) -> MultilingualData:
        """Create multilingual data entry"""
        try:
            db_data = MultilingualData(**data.dict())
            if user_id:
                db_data.created_by = user_id
            
            self.db.add(db_data)
            self.db.commit()
            self.db.refresh(db_data)
            
            # Update search index
            await self._update_multilingual_search_index(db_data)
            
            logger.info(f"Created multilingual data: {data.entity_type}:{data.entity_id}")
            return db_data
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating multilingual data: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_multilingual_data(
        self,
        entity_type: str,
        entity_id: uuid.UUID,
        language_id: Optional[uuid.UUID] = None
    ) -> List[MultilingualData]:
        """Get multilingual data for an entity"""
        query = self.db.query(MultilingualData).filter(
            and_(
                MultilingualData.entity_type == entity_type,
                MultilingualData.entity_id == entity_id,
                MultilingualData.is_active == True
            )
        )
        
        if language_id:
            query = query.filter(MultilingualData.language_id == language_id)
        
        return query.all()
    
    # Search Functionality
    async def search_multilingual(
        self,
        search_request: SearchRequest
    ) -> Dict[str, Any]:
        """Search across multilingual content"""
        try:
            query = self.db.query(SearchIndex).filter(
                SearchIndex.searchable_text.ilike(f"%{search_request.query}%")
            )
            
            if search_request.language_id:
                query = query.filter(SearchIndex.language_id == search_request.language_id)
            
            if search_request.entity_types:
                query = query.filter(SearchIndex.entity_type.in_(search_request.entity_types))
            
            # Get total count
            total_count = query.count()
            
            # Get results with pagination
            results = query.order_by(desc(SearchIndex.boost_factor)).offset(
                search_request.offset
            ).limit(search_request.limit).all()
            
            # Format results
            formatted_results = []
            for result in results:
                formatted_results.append({
                    "entity_type": result.entity_type,
                    "entity_id": result.entity_id,
                    "language_id": result.language_id,
                    "content": result.searchable_text,
                    "score": float(result.boost_factor),
                    "highlights": self._extract_highlights(result.searchable_text, search_request.query)
                })
            
            return {
                "results": formatted_results,
                "total_count": total_count,
                "query": search_request.query,
                "language_id": search_request.language_id
            }
            
        except Exception as e:
            logger.error(f"Error in multilingual search: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Formatting Functions
    async def format_number(
        self,
        format_request: NumberFormatRequest
    ) -> Dict[str, str]:
        """Format number according to locale"""
        try:
            language_code = format_request.language_code or "en"
            
            # Get language configuration
            lang_config = await self.get_language_by_code(language_code)
            locale_code = lang_config.locale_code if lang_config else language_code
            
            if BABEL_AVAILABLE:
                try:
                    # Normalize locale code for Babel
                    if locale_code and '-' in locale_code:
                        parts = locale_code.split('-')
                        normalized_locale = f"{parts[0].lower()}_{parts[1].upper()}"
                    else:
                        normalized_locale = locale_code.lower() if locale_code else "en"
                    
                    locale = Locale.parse(normalized_locale)
                except (UnknownLocaleError, ValueError):
                    locale = Locale.parse("en")
                
                # Format based on type
                if format_request.format_type == "currency":
                    currency_code = format_request.currency_code or "USD"
                    formatted = numbers.format_currency(
                        format_request.number,
                        currency_code,
                        locale=locale
                    )
                elif format_request.format_type == "percentage":
                    formatted = numbers.format_percent(
                        format_request.number,
                        locale=locale
                    )
                else:  # decimal
                    formatted = numbers.format_decimal(
                        format_request.number,
                        locale=locale
                    )
                
                format_pattern = str(locale)
            else:
                # Fallback formatting when babel is not available
                if format_request.format_type == "currency":
                    currency_code = format_request.currency_code or "USD"
                    formatted = f"{currency_code} {format_request.number:,.2f}"
                elif format_request.format_type == "percentage":
                    formatted = f"{format_request.number:.1%}"
                else:  # decimal
                    formatted = f"{format_request.number:,.2f}"
                
                format_pattern = "fallback"
            
            return {
                "formatted_value": formatted,
                "language_code": language_code,
                "format_pattern": format_pattern
            }
            
        except Exception as e:
            logger.error(f"Error formatting number: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def format_date(
        self,
        format_request: DateFormatRequest
    ) -> Dict[str, str]:
        """Format date according to locale"""
        try:
            language_code = format_request.language_code or "en"
            
            # Get language configuration
            lang_config = await self.get_language_by_code(language_code)
            locale_code = lang_config.locale_code if lang_config else language_code
            
            # Format date
            if format_request.format_pattern:
                formatted = format_request.date.strftime(format_request.format_pattern)
                format_pattern = format_request.format_pattern
            elif BABEL_AVAILABLE:
                try:
                    # Normalize locale code for Babel
                    if locale_code and '-' in locale_code:
                        parts = locale_code.split('-')
                        normalized_locale = f"{parts[0].lower()}_{parts[1].upper()}"
                    else:
                        normalized_locale = locale_code.lower() if locale_code else "en"
                    
                    locale = Locale.parse(normalized_locale)
                except (UnknownLocaleError, ValueError):
                    locale = Locale.parse("en")
                
                formatted = dates.format_date(
                    format_request.date,
                    locale=locale
                )
                format_pattern = "babel_default"
            else:
                # Fallback formatting
                formatted = format_request.date.strftime("%Y-%m-%d")
                format_pattern = "fallback"
            
            return {
                "formatted_value": formatted,
                "language_code": language_code,
                "format_pattern": format_pattern
            }
            
        except Exception as e:
            logger.error(f"Error formatting date: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Translation Memory
    async def create_translation_memory(
        self,
        memory_data: TranslationMemoryCreate,
        user_id: Optional[uuid.UUID] = None
    ) -> TranslationMemory:
        """Create translation memory entry"""
        try:
            db_memory = TranslationMemory(**memory_data.dict())
            if user_id:
                db_memory.created_by = user_id
            
            self.db.add(db_memory)
            self.db.commit()
            self.db.refresh(db_memory)
            
            logger.info(f"Created translation memory entry")
            return db_memory
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating translation memory: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Private helper methods
    async def _update_search_index(self, translation: Translation):
        """Update search index for translation"""
        try:
            # Remove existing index entry
            self.db.query(SearchIndex).filter(
                and_(
                    SearchIndex.entity_type == "translation",
                    SearchIndex.entity_id == translation.id
                )
            ).delete()
            
            # Create new index entry
            search_text = f"{translation.original_text} {translation.translated_text}"
            index_entry = SearchIndex(
                language_id=translation.language_id,
                entity_type="translation",
                entity_id=translation.id,
                searchable_text=search_text,
                normalized_text=search_text.lower(),
                keywords=self._extract_keywords(search_text)
            )
            
            self.db.add(index_entry)
            
        except Exception as e:
            logger.error(f"Error updating search index: {str(e)}")
    
    async def _update_multilingual_search_index(self, data: MultilingualData):
        """Update search index for multilingual data"""
        try:
            # Remove existing index entry
            self.db.query(SearchIndex).filter(
                and_(
                    SearchIndex.entity_type == data.entity_type,
                    SearchIndex.entity_id == data.entity_id,
                    SearchIndex.language_id == data.language_id
                )
            ).delete()
            
            # Create new index entry
            index_entry = SearchIndex(
                language_id=data.language_id,
                entity_type=data.entity_type,
                entity_id=data.entity_id,
                searchable_text=data.field_content,
                normalized_text=data.field_content.lower(),
                keywords=self._extract_keywords(data.field_content)
            )
            
            self.db.add(index_entry)
            
        except Exception as e:
            logger.error(f"Error updating multilingual search index: {str(e)}")
    
    async def _add_to_translation_memory(
        self, 
        translation: Translation, 
        user_id: Optional[uuid.UUID] = None
    ):
        """Add translation to memory for reuse"""
        try:
            # Get source language (assume English as source for now)
            source_lang = await self.get_language_by_code("en")
            if not source_lang:
                return
            
            memory_entry = TranslationMemory(
                source_language="en",
                target_language=translation.language.language_code,
                source_text=translation.original_text,
                target_text=translation.translated_text,
                context=translation.context,
                domain="business",
                quality_score=Decimal("0.8") if translation.is_approved else Decimal("0.6"),
                source_type="manual",
                created_by=user_id
            )
            
            self.db.add(memory_entry)
            
        except Exception as e:
            logger.error(f"Error adding to translation memory: {str(e)}")
    
    async def _fetch_exchange_rate(
        self,
        from_currency: str,
        to_currency: str,
        source: Optional[str] = None
    ) -> Optional[Decimal]:
        """Fetch exchange rate from external API"""
        try:
            if not source or source not in self._exchange_rate_apis:
                source = "exchangerate"
            
            api_url = self._exchange_rate_apis[source]
            
            # Make API request (simplified - in production, add proper error handling and API keys)
            response = requests.get(f"{api_url}/{to_currency}")
            if response.status_code == 200:
                data = response.json()
                if "rates" in data and from_currency in data["rates"]:
                    return Decimal(str(data["rates"][from_currency]))
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching exchange rate: {str(e)}")
            return None
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text for search indexing"""
        # Simple keyword extraction - in production, use more sophisticated NLP
        words = re.findall(r'\b\w+\b', text.lower())
        # Filter out common stop words and short words
        stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}
        keywords = [word for word in words if len(word) > 2 and word not in stop_words]
        return list(set(keywords))  # Remove duplicates
    
    def _extract_highlights(self, text: str, query: str) -> List[str]:
        """Extract highlighted snippets from text"""
        # Simple highlighting - in production, use more sophisticated text processing
        query_words = query.lower().split()
        highlights = []
        
        for word in query_words:
            if word in text.lower():
                # Find context around the word
                start = max(0, text.lower().find(word) - 50)
                end = min(len(text), text.lower().find(word) + len(word) + 50)
                highlight = text[start:end]
                if highlight not in highlights:
                    highlights.append(highlight)
        
        return highlights[:3]  # Return up to 3 highlights